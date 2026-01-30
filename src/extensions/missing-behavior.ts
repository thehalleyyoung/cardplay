/**
 * @fileoverview Pack Missing Behavior Policy
 * 
 * Change 440: PackMissingBehavior policy (ignore vs placeholder vs hard error)
 * per canon extensibility contract.
 * 
 * Defines how the system behaves when referenced packs/entities are missing.
 * 
 * @module @cardplay/extensions/missing-behavior
 */

import type { PackManifest } from '../user-cards/manifest';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Behavior when a pack is missing.
 */
export type PackMissingBehavior =
  | 'ignore'      // Silently skip missing pack
  | 'warn'        // Log warning but continue
  | 'placeholder' // Show placeholder UI
  | 'error';      // Throw error / block load

/**
 * Behavior when a pack entity (card, template, etc) is missing.
 */
export type EntityMissingBehavior =
  | 'ignore'      // Silently skip missing entity
  | 'warn'        // Log warning but continue
  | 'placeholder' // Show placeholder UI
  | 'error';      // Throw error / block load

/**
 * Policy configuration for missing packs/entities.
 */
export interface MissingBehaviorPolicy {
  /** Default behavior for missing packs */
  readonly packDefault: PackMissingBehavior;
  /** Default behavior for missing entities within loaded packs */
  readonly entityDefault: EntityMissingBehavior;
  /** Per-entity-type overrides */
  readonly entityOverrides?: Partial<Record<EntityType, EntityMissingBehavior>>;
  /** Per-pack overrides (by pack name) */
  readonly packOverrides?: Record<string, PackMissingBehavior>;
  /** Whether to show diagnostic info in placeholders */
  readonly showDiagnostics: boolean;
}

/**
 * Entity types that can be missing.
 */
export type EntityType =
  | 'card'
  | 'deck-template'
  | 'board'
  | 'port-type'
  | 'event-kind'
  | 'constraint-type'
  | 'theory-card'
  | 'ontology-pack'
  | 'theme';

/**
 * Information about a missing pack.
 */
export interface MissingPackInfo {
  readonly packName: string;
  readonly version?: string;
  readonly requiredBy?: string;
  readonly lastSeen?: number;
  readonly behavior: PackMissingBehavior;
}

/**
 * Information about a missing entity.
 */
export interface MissingEntityInfo {
  readonly entityType: EntityType;
  readonly entityId: string;
  readonly packName?: string;
  readonly requiredBy?: string;
  readonly behavior: EntityMissingBehavior;
  readonly suggestion?: string;
}

// ============================================================================
// DEFAULT POLICIES
// ============================================================================

/**
 * Development policy: Show warnings and placeholders for debugging.
 */
export const DEV_POLICY: MissingBehaviorPolicy = {
  packDefault: 'warn',
  entityDefault: 'placeholder',
  showDiagnostics: true,
  entityOverrides: {
    // Critical entities that should error
    'board': 'error',
    'deck-template': 'warn',
  },
};

/**
 * Production policy: Graceful degradation with placeholders.
 */
export const PRODUCTION_POLICY: MissingBehaviorPolicy = {
  packDefault: 'placeholder',
  entityDefault: 'placeholder',
  showDiagnostics: false,
  entityOverrides: {
    // Non-critical entities can be ignored
    'theme': 'ignore',
    'port-type': 'warn',
    'event-kind': 'warn',
  },
};

/**
 * Strict policy: Fail fast on any missing dependency.
 */
export const STRICT_POLICY: MissingBehaviorPolicy = {
  packDefault: 'error',
  entityDefault: 'error',
  showDiagnostics: true,
};

/**
 * Lenient policy: Ignore missing dependencies, continue silently.
 */
export const LENIENT_POLICY: MissingBehaviorPolicy = {
  packDefault: 'ignore',
  entityDefault: 'ignore',
  showDiagnostics: false,
};

// ============================================================================
// POLICY APPLICATION
// ============================================================================

/**
 * Get the behavior for a missing pack.
 */
export function getPackBehavior(
  packName: string,
  policy: MissingBehaviorPolicy
): PackMissingBehavior {
  return policy.packOverrides?.[packName] ?? policy.packDefault;
}

/**
 * Get the behavior for a missing entity.
 */
export function getEntityBehavior(
  entityType: EntityType,
  policy: MissingBehaviorPolicy
): EntityMissingBehavior {
  return policy.entityOverrides?.[entityType] ?? policy.entityDefault;
}

/**
 * Should we show a placeholder UI?
 */
export function shouldShowPlaceholder(
  behavior: PackMissingBehavior | EntityMissingBehavior
): boolean {
  return behavior === 'placeholder';
}

/**
 * Should we throw an error?
 */
export function shouldError(
  behavior: PackMissingBehavior | EntityMissingBehavior
): boolean {
  return behavior === 'error';
}

/**
 * Should we log a warning?
 */
export function shouldWarn(
  behavior: PackMissingBehavior | EntityMissingBehavior
): boolean {
  return behavior === 'warn' || behavior === 'placeholder';
}

// ============================================================================
// MISSING PACK TRACKING
// ============================================================================

const missingPacks = new Map<string, MissingPackInfo>();
const missingEntities = new Map<string, MissingEntityInfo>();

/**
 * Record a missing pack.
 */
export function recordMissingPack(info: MissingPackInfo): void {
  missingPacks.set(info.packName, info);
  
  if (shouldWarn(info.behavior)) {
    console.warn(
      `Missing pack: ${info.packName}${info.version ? `@${info.version}` : ''}` +
      (info.requiredBy ? ` (required by ${info.requiredBy})` : '')
    );
  }
  
  if (shouldError(info.behavior)) {
    throw new Error(
      `Required pack '${info.packName}' is missing` +
      (info.requiredBy ? ` (required by ${info.requiredBy})` : '')
    );
  }
}

/**
 * Record a missing entity.
 */
export function recordMissingEntity(info: MissingEntityInfo): void {
  const key = `${info.entityType}:${info.entityId}`;
  missingEntities.set(key, info);
  
  if (shouldWarn(info.behavior)) {
    console.warn(
      `Missing ${info.entityType}: ${info.entityId}` +
      (info.packName ? ` (from pack ${info.packName})` : '') +
      (info.suggestion ? ` - ${info.suggestion}` : '')
    );
  }
  
  if (shouldError(info.behavior)) {
    throw new Error(
      `Required ${info.entityType} '${info.entityId}' is missing` +
      (info.packName ? ` (from pack ${info.packName})` : '')
    );
  }
}

/**
 * Get information about a missing pack.
 */
export function getMissingPackInfo(packName: string): MissingPackInfo | undefined {
  return missingPacks.get(packName);
}

/**
 * Get information about a missing entity.
 */
export function getMissingEntityInfo(
  entityType: EntityType,
  entityId: string
): MissingEntityInfo | undefined {
  const key = `${entityType}:${entityId}`;
  return missingEntities.get(key);
}

/**
 * List all missing packs.
 */
export function listMissingPacks(): readonly MissingPackInfo[] {
  return Array.from(missingPacks.values());
}

/**
 * List all missing entities.
 */
export function listMissingEntities(): readonly MissingEntityInfo[] {
  return Array.from(missingEntities.values());
}

/**
 * Clear missing pack/entity tracking.
 */
export function clearMissingTracking(): void {
  missingPacks.clear();
  missingEntities.clear();
}

// ============================================================================
// CONTEXT-AWARE POLICY
// ============================================================================

let currentPolicy: MissingBehaviorPolicy = PRODUCTION_POLICY;

/**
 * Set the global missing behavior policy.
 */
export function setMissingBehaviorPolicy(policy: MissingBehaviorPolicy): void {
  currentPolicy = policy;
}

/**
 * Get the current missing behavior policy.
 */
export function getMissingBehaviorPolicy(): MissingBehaviorPolicy {
  return currentPolicy;
}

/**
 * Temporarily use a different policy (for testing).
 */
export function withPolicy<T>(
  policy: MissingBehaviorPolicy,
  fn: () => T
): T {
  const previousPolicy = currentPolicy;
  try {
    currentPolicy = policy;
    return fn();
  } finally {
    currentPolicy = previousPolicy;
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Detect environment and set appropriate policy
if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
  setMissingBehaviorPolicy(DEV_POLICY);
} else {
  setMissingBehaviorPolicy(PRODUCTION_POLICY);
}
