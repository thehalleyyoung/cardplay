/**
 * @file Deterministic Host Action Ordering (Step 315)
 * @module gofai/execution/deterministic-ordering
 * 
 * Implements Step 315: Implement "deterministic host action ordering" so repeated
 * runs produce identical diffs.
 * 
 * This module ensures that when a plan is executed multiple times with the same
 * inputs, the resulting diffs and state changes are byte-for-byte identical.
 * This is critical for:
 * - Reproducibility (bug reports, sharing edits)
 * - Testing (golden diff tests)
 * - Undo/redo reliability
 * - Cache invalidation
 * - Edit package deduplication
 * 
 * Design principles:
 * - No Date.now() in execution path (timestamps only in metadata)
 * - No Math.random() in opcode handlers
 * - Stable sorting for all collections (by ID, then by creation order)
 * - Deterministic tie-breakers for ambiguous cases
 * - No dependency on external non-deterministic state
 * - No async operations that can race
 * 
 * Sources of non-determinism to eliminate:
 * - Object.keys() iteration order (use Map or sorted arrays)
 * - Set iteration order (convert to sorted arrays)
 * - Floating point comparisons (use epsilon comparisons)
 * - Promise.all() result order (use sequential processing)
 * - File system timestamps (use logical clocks)
 * - External randomness (no random IDs; use counters or content hashes)
 * 
 * @see gofai_goalB.md Step 315
 * @see gofai_goalB.md Step 463 (determinism enforcement)
 * @see docs/gofai/determinism.md
 */

import type { PlanOpcode, ExecutionDiff, DiffChange } from './edit-package.js';
import type { GofaiId } from '../canon/types.js';

// ============================================================================
// Ordering Types
// ============================================================================

/**
 * Ordering key for stable sorting.
 * 
 * Multiple components provide deterministic tie-breaking:
 * - Primary: ID (stable, unique)
 * - Secondary: Creation order (logical clock)
 * - Tertiary: Entity type (for cross-type sorts)
 */
export interface OrderingKey {
  /** Entity ID (primary sort key) */
  readonly id: string;
  
  /** Logical creation order (secondary sort key) */
  readonly order: number;
  
  /** Entity type (tertiary sort key) */
  readonly entityType: string;
}

/**
 * Sortable entity with ordering key.
 */
export interface SortableEntity<T> {
  readonly entity: T;
  readonly key: OrderingKey;
}

/**
 * Comparison result.
 */
export type ComparisonResult = -1 | 0 | 1;

// ============================================================================
// Deterministic Sorting
// ============================================================================

/**
 * Compare two ordering keys deterministically.
 * 
 * Ordering:
 * 1. By ID (lexicographic)
 * 2. By creation order (numeric)
 * 3. By entity type (lexicographic)
 */
export function compareOrderingKeys(a: OrderingKey, b: OrderingKey): ComparisonResult {
  // Primary: ID
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  
  // Secondary: Creation order
  if (a.order < b.order) return -1;
  if (a.order > b.order) return 1;
  
  // Tertiary: Entity type
  if (a.entityType < b.entityType) return -1;
  if (a.entityType > b.entityType) return 1;
  
  // Equal
  return 0;
}

/**
 * Sort entities deterministically by their ordering keys.
 */
export function sortByOrderingKey<T>(entities: readonly SortableEntity<T>[]): readonly T[] {
  const sorted = [...entities].sort((a, b) => compareOrderingKeys(a.key, b.key));
  return sorted.map(e => e.entity);
}

/**
 * Create an ordering key for an entity.
 */
export function createOrderingKey(
  id: string,
  order: number,
  entityType: string
): OrderingKey {
  return { id, order, entityType };
}

// ============================================================================
// Opcode Ordering
// ============================================================================

/**
 * Sort opcodes deterministically.
 * 
 * Opcodes are sorted by:
 * 1. Execution phase (structural → event → param → ui)
 * 2. Scope (global → section → layer → specific)
 * 3. ID (stable tie-breaker)
 */
export function sortOpcodesDeterministically(
  opcodes: readonly PlanOpcode[]
): readonly PlanOpcode[] {
  const withKeys = opcodes.map((opcode, index) => ({
    opcode,
    phase: getOpcodePhase(opcode),
    scopeDepth: getScopeDepth(opcode),
    index,
  }));
  
  const sorted = withKeys.sort((a, b) => {
    // Phase order
    if (a.phase !== b.phase) {
      return a.phase - b.phase;
    }
    
    // Scope depth (shallower first)
    if (a.scopeDepth !== b.scopeDepth) {
      return a.scopeDepth - b.scopeDepth;
    }
    
    // ID order
    if (a.opcode.id < b.opcode.id) return -1;
    if (a.opcode.id > b.opcode.id) return 1;
    
    // Original index (preserve plan order as final tie-breaker)
    return a.index - b.index;
  });
  
  return sorted.map(item => item.opcode);
}

/**
 * Get execution phase for an opcode.
 * 
 * Phases ensure correct ordering:
 * 0. Structural changes (add/remove tracks, sections)
 * 1. Routing changes
 * 2. Card graph changes (add/remove cards)
 * 3. Event edits
 * 4. Card parameter edits
 * 5. UI actions
 */
function getOpcodePhase(opcode: PlanOpcode): number {
  const typeStr = String(opcode.type);
  
  // Structural (must happen first)
  if (typeStr.includes('add_track') || typeStr.includes('remove_track')) return 0;
  if (typeStr.includes('add_section') || typeStr.includes('remove_section')) return 0;
  
  // Routing (before card changes)
  if (typeStr.includes('routing') || typeStr.includes('connection')) return 1;
  
  // Card graph (before param changes)
  if (typeStr.includes('add_card') || typeStr.includes('remove_card')) return 2;
  if (typeStr.includes('move_card') || typeStr.includes('reorder')) return 2;
  
  // Event edits
  if (typeStr.includes('event') || typeStr.includes('note')) return 3;
  if (typeStr.includes('quantize') || typeStr.includes('shift')) return 3;
  
  // Card params (after card exists)
  if (typeStr.includes('set_param') || typeStr.includes('param')) return 4;
  
  // UI (last, non-critical)
  if (typeStr.includes('ui_') || typeStr.includes('navigate')) return 5;
  
  // Default to event phase
  return 3;
}

/**
 * Get scope depth for an opcode.
 * 
 * Depth indicates specificity:
 * 0 = global
 * 1 = section/track
 * 2 = layer/card
 * 3 = event/parameter
 */
function getScopeDepth(opcode: PlanOpcode): number {
  const scope = opcode.scope;
  
  if (!scope) return 0;
  
  const scopeType = (scope as any).type;
  
  switch (scopeType) {
    case 'global':
      return 0;
    case 'section':
    case 'track':
      return 1;
    case 'layer':
    case 'card':
      return 2;
    case 'event':
    case 'parameter':
      return 3;
    default:
      return 0;
  }
}

// ============================================================================
// Diff Change Ordering
// ============================================================================

/**
 * Sort diff changes deterministically.
 * 
 * Changes are sorted by:
 * 1. Entity type (events → tracks → cards → sections → routing)
 * 2. Change type (added → modified → removed)
 * 3. Entity ID
 * 4. Path (for modifications)
 */
export function sortDiffChangesDeterministically(
  changes: readonly DiffChange[]
): readonly DiffChange[] {
  const sorted = [...changes].sort((a, b) => {
    // Entity type order
    const typeOrderA = getEntityTypeOrder(a.entityType);
    const typeOrderB = getEntityTypeOrder(b.entityType);
    
    if (typeOrderA !== typeOrderB) {
      return typeOrderA - typeOrderB;
    }
    
    // Change type order
    const changeOrderA = getChangeTypeOrder(a.type);
    const changeOrderB = getChangeTypeOrder(b.type);
    
    if (changeOrderA !== changeOrderB) {
      return changeOrderA - changeOrderB;
    }
    
    // Entity ID
    if (a.entityId < b.entityId) return -1;
    if (a.entityId > b.entityId) return 1;
    
    // Path (for modifications)
    if (a.path && b.path) {
      if (a.path < b.path) return -1;
      if (a.path > b.path) return 1;
    }
    
    return 0;
  });
  
  return sorted;
}

/**
 * Get sort order for entity type.
 */
function getEntityTypeOrder(entityType: string): number {
  switch (entityType) {
    case 'event':
      return 0;
    case 'track':
      return 1;
    case 'card':
      return 2;
    case 'section':
      return 3;
    case 'routing':
      return 4;
    default:
      return 99;
  }
}

/**
 * Get sort order for change type.
 */
function getChangeTypeOrder(changeType: string): number {
  switch (changeType) {
    case 'added':
      return 0;
    case 'modified':
      return 1;
    case 'removed':
      return 2;
    default:
      return 99;
  }
}

// ============================================================================
// Collection Ordering
// ============================================================================

/**
 * Sort a collection of entities by ID.
 * 
 * Used for sorting events, tracks, cards, etc. before diffing.
 */
export function sortById<T extends { id: string }>(entities: readonly T[]): readonly T[] {
  return [...entities].sort((a, b) => {
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });
}

/**
 * Sort a map's entries by key.
 * 
 * Converts Map to sorted array of [key, value] pairs.
 */
export function sortMapEntries<K, V>(map: ReadonlyMap<K, V>): readonly [K, V][] {
  const entries = Array.from(map.entries());
  return entries.sort((a, b) => {
    const keyA = String(a[0]);
    const keyB = String(b[0]);
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
  });
}

/**
 * Sort an object's keys.
 * 
 * Returns new object with keys in sorted order.
 */
export function sortObjectKeys<T extends Record<string, any>>(obj: T): T {
  const sorted: any = {};
  const keys = Object.keys(obj).sort();
  
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  
  return sorted;
}

// ============================================================================
// Execution Order Enforcement
// ============================================================================

/**
 * Execution order context.
 * 
 * Tracks order of execution for determinism.
 */
export interface ExecutionOrderContext {
  /** Current logical clock */
  currentClock: number;
  
  /** Entities created, in order */
  createdEntities: Map<string, number>;
  
  /** Entities modified, in order */
  modifiedEntities: Map<string, number>;
  
  /** Entities removed, in order */
  removedEntities: Map<string, number>;
}

/**
 * Create a new execution order context.
 */
export function createExecutionOrderContext(): ExecutionOrderContext {
  return {
    currentClock: 0,
    createdEntities: new Map(),
    modifiedEntities: new Map(),
    removedEntities: new Map(),
  };
}

/**
 * Record entity creation in execution order.
 */
export function recordCreation(ctx: ExecutionOrderContext, entityId: string): void {
  ctx.createdEntities.set(entityId, ctx.currentClock++);
}

/**
 * Record entity modification in execution order.
 */
export function recordModification(ctx: ExecutionOrderContext, entityId: string): void {
  ctx.modifiedEntities.set(entityId, ctx.currentClock++);
}

/**
 * Record entity removal in execution order.
 */
export function recordRemoval(ctx: ExecutionOrderContext, entityId: string): void {
  ctx.removedEntities.set(entityId, ctx.currentClock++);
}

/**
 * Get creation order for an entity.
 */
export function getCreationOrder(ctx: ExecutionOrderContext, entityId: string): number {
  return ctx.createdEntities.get(entityId) ?? -1;
}

// ============================================================================
// Floating Point Determinism
// ============================================================================

/**
 * Epsilon for floating point comparisons.
 * 
 * Use this for all floating point equality checks to avoid
 * non-deterministic rounding differences.
 */
export const FLOAT_EPSILON = 1e-10;

/**
 * Compare two floating point numbers deterministically.
 */
export function compareFloats(a: number, b: number): ComparisonResult {
  const diff = a - b;
  
  if (Math.abs(diff) < FLOAT_EPSILON) {
    return 0; // Equal within epsilon
  }
  
  return diff < 0 ? -1 : 1;
}

/**
 * Check if two floating point numbers are equal within epsilon.
 */
export function floatsEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < FLOAT_EPSILON;
}

/**
 * Round a float to a deterministic precision.
 * 
 * Use this when storing/comparing floats to avoid floating point drift.
 */
export function roundDeterministic(value: number, decimals: number = 6): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Deterministic ID generator.
 * 
 * Generates IDs based on content and context, not random values.
 * Same inputs → same ID.
 */
export class DeterministicIdGenerator {
  private counter: number = 0;
  private readonly prefix: string;
  
  constructor(prefix: string = 'det') {
    this.prefix = prefix;
  }
  
  /**
   * Generate next ID in sequence.
   * 
   * IDs are sequential within a generation context.
   */
  next(): string {
    return `${this.prefix}:${this.counter++}`;
  }
  
  /**
   * Generate ID from content hash.
   * 
   * Same content → same ID across runs.
   */
  fromContent(content: string): string {
    // Simple deterministic hash (not cryptographic)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    const hashStr = Math.abs(hash).toString(36);
    return `${this.prefix}:${hashStr}`;
  }
  
  /**
   * Reset counter (for testing).
   */
  reset(): void {
    this.counter = 0;
  }
}

// ============================================================================
// Diff Normalization
// ============================================================================

/**
 * Normalize a diff for deterministic comparison.
 * 
 * Ensures:
 * - All changes are sorted
 * - All collections are sorted
 * - All floats are rounded
 * - All timestamps are removed/normalized
 */
export function normalizeDiff(diff: ExecutionDiff): ExecutionDiff {
  return {
    ...diff,
    
    // Sort changes
    changes: sortDiffChangesDeterministically(diff.changes),
    
    // Normalize timestamps (keep relative order, not absolute values)
    timestamp: 0, // Remove absolute timestamp
    
    // Sort snapshots
    before: normalizeSnapshot(diff.before),
    after: normalizeSnapshot(diff.after),
    
    // Sort verifications
    verifications: [...diff.verifications].sort((a, b) => {
      if (a.constraintId < b.constraintId) return -1;
      if (a.constraintId > b.constraintId) return 1;
      return 0;
    }),
  };
}

/**
 * Normalize a state snapshot.
 */
function normalizeSnapshot(snapshot: any): any {
  return {
    events: sortById(snapshot.events ?? []),
    tracks: sortById(snapshot.tracks ?? []),
    cards: sortById(snapshot.cards ?? []),
    sections: sortById(snapshot.sections ?? []),
    routing: sortById(snapshot.routing ?? []),
  };
}

// ============================================================================
// Sequential Execution Utilities
// ============================================================================

/**
 * Execute async operations sequentially (not in parallel).
 * 
 * This prevents race conditions and ensures deterministic ordering
 * of operations that might otherwise complete in random order.
 */
export async function executeSequentially<T, R>(
  items: readonly T[],
  fn: (item: T, index: number) => Promise<R>
): Promise<readonly R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i++) {
    const result = await fn(items[i], i);
    results.push(result);
  }
  
  return results;
}

/**
 * Execute operations in deterministic batches.
 * 
 * Groups operations by phase, executes each phase sequentially,
 * but allows parallelism within a phase (with deterministic result combining).
 */
export async function executeDeterministicBatches<T, R>(
  items: readonly T[],
  getPhase: (item: T) => number,
  fn: (item: T) => Promise<R>
): Promise<readonly R[]> {
  // Group by phase
  const phases = new Map<number, T[]>();
  
  for (const item of items) {
    const phase = getPhase(item);
    if (!phases.has(phase)) {
      phases.set(phase, []);
    }
    phases.get(phase)!.push(item);
  }
  
  // Execute phases sequentially
  const results: R[] = [];
  const sortedPhases = Array.from(phases.entries()).sort((a, b) => a[0] - b[0]);
  
  for (const [_phase, phaseItems] of sortedPhases) {
    // Execute within phase (can be parallel, but results combined deterministically)
    const phaseResults = await Promise.all(phaseItems.map(fn));
    results.push(...phaseResults);
  }
  
  return results;
}

// ============================================================================
// Exports
// ============================================================================

export type {
  OrderingKey,
  SortableEntity,
  ComparisonResult,
  ExecutionOrderContext,
};

export {
  compareOrderingKeys,
  sortByOrderingKey,
  createOrderingKey,
  sortOpcodesDeterministically,
  sortDiffChangesDeterministically,
  sortById,
  sortMapEntries,
  sortObjectKeys,
  createExecutionOrderContext,
  recordCreation,
  recordModification,
  recordRemoval,
  getCreationOrder,
  compareFloats,
  floatsEqual,
  roundDeterministic,
  DeterministicIdGenerator,
  normalizeDiff,
  executeSequentially,
  executeDeterministicBatches,
  FLOAT_EPSILON,
};
