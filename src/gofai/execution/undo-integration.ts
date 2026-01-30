/**
 * @file Undo Integration with CardPlay Store (Step 316)
 * @module gofai/execution/undo-integration
 * 
 * Implements Step 316: Implement automatic undo integration with CardPlay store:
 * each `EditPackage` becomes one undo step (or a grouped transaction).
 * 
 * This module integrates GOFAI's edit packages with CardPlay's undo/redo system.
 * Each applied edit package creates an entry in the undo stack that can be
 * reversed atomically.
 * 
 * Design principles:
 * - Edit packages are the unit of undo (not individual opcodes)
 * - Undo is transactional (all-or-nothing)
 * - Undo stack is linear (no branching)
 * - Multiple edit packages can be grouped into single undo step
 * - Undo tokens prevent double-undo
 * - State fingerprints catch undo conflicts
 * 
 * Integration points:
 * - CardPlay undo stack (if exists)
 * - Project state mutations
 * - Edit package history
 * - Dialogue state updates
 * 
 * @see gofai_goalB.md Step 316
 * @see gofai_goalB.md Step 317 (redo integration)
 * @see gofai_goalB.md Step 318 (edit package addressability)
 * @see docs/gofai/undo-redo.md
 */

import type {
  EditPackage,
  UndoToken,
  StateFingerprint,
  CPLPlan,
  PlanOpcode,
} from './edit-package.js';
import type { ExecutionDiff } from './diff-model.js';
import type { ProjectState } from './transactional-execution.js';

// ============================================================================
// Undo Stack Types
// ============================================================================

/**
 * Undo stack entry.
 * 
 * Represents a single undoable action in the history.
 * May contain one or more edit packages if they were grouped.
 */
export interface UndoEntry {
  /** Unique entry ID */
  readonly id: string;
  
  /** Edit packages in this entry */
  readonly packages: readonly EditPackage[];
  
  /** Undo token(s) for reversal */
  readonly tokens: readonly UndoToken[];
  
  /** When this entry was created */
  readonly timestamp: number;
  
  /** Human-readable description */
  readonly description: string;
  
  /** State fingerprint before application */
  readonly beforeState: StateFingerprint;
  
  /** State fingerprint after application */
  readonly afterState: StateFingerprint;
  
  /** Entry status */
  readonly status: UndoEntryStatus;
  
  /** Grouping information */
  readonly group?: UndoGroup;
}

/**
 * Undo entry status.
 */
export type UndoEntryStatus =
  | 'applied' // Currently applied
  | 'undone' // Has been undone
  | 'redone' // Has been redone
  | 'invalidated'; // Can no longer be undone/redone

/**
 * Undo group information.
 * 
 * Multiple edit packages can be grouped into a single undo step.
 */
export interface UndoGroup {
  /** Group ID */
  readonly id: string;
  
  /** Group description */
  readonly description: string;
  
  /** Is this the first entry in the group? */
  readonly isFirst: boolean;
  
  /** Is this the last entry in the group? */
  readonly isLast: boolean;
  
  /** Total entries in group */
  readonly totalEntries: number;
}

/**
 * Undo stack.
 * 
 * Linear history of undoable actions.
 */
export interface UndoStack {
  /** All entries in chronological order */
  readonly entries: readonly UndoEntry[];
  
  /** Current position in stack (index) */
  readonly position: number;
  
  /** Maximum stack size */
  readonly maxSize: number;
  
  /** Whether grouping is active */
  readonly groupingActive: boolean;
  
  /** Current group ID (if grouping) */
  readonly currentGroupId?: string;
}

/**
 * Undo result.
 */
export type UndoResult =
  | { readonly status: 'success'; readonly entry: UndoEntry; readonly diff: ExecutionDiff }
  | { readonly status: 'noop'; readonly reason: string }
  | { readonly status: 'conflict'; readonly reason: string; readonly expected: StateFingerprint; readonly actual: StateFingerprint }
  | { readonly status: 'error'; readonly reason: string; readonly error: unknown };

/**
 * Redo result.
 */
export type RedoResult =
  | { readonly status: 'success'; readonly entry: UndoEntry; readonly diff: ExecutionDiff }
  | { readonly status: 'noop'; readonly reason: string }
  | { readonly status: 'conflict'; readonly reason: string; readonly expected: StateFingerprint; readonly actual: StateFingerprint }
  | { readonly status: 'error'; readonly reason: string; readonly error: unknown };

// ============================================================================
// Undo Stack Manager
// ============================================================================

/**
 * Undo stack manager.
 * 
 * Manages the undo/redo stack for GOFAI edits.
 */
export class UndoStackManager {
  private entries: UndoEntry[] = [];
  private position: number = 0;
  private maxSize: number;
  private groupingActive: boolean = false;
  private currentGroupId?: string;
  private currentGroupEntries: EditPackage[] = [];
  
  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }
  
  /**
   * Get current stack state.
   */
  getStack(): UndoStack {
    return {
      entries: this.entries,
      position: this.position,
      maxSize: this.maxSize,
      groupingActive: this.groupingActive,
      currentGroupId: this.currentGroupId,
    };
  }
  
  /**
   * Can undo?
   */
  canUndo(): boolean {
    return this.position > 0;
  }
  
  /**
   * Can redo?
   */
  canRedo(): boolean {
    return this.position < this.entries.length;
  }
  
  /**
   * Add an edit package to the undo stack.
   * 
   * If grouping is active, accumulates packages.
   * Otherwise, creates a new undo entry immediately.
   */
  push(pkg: EditPackage): void {
    if (this.groupingActive) {
      this.currentGroupEntries.push(pkg);
    } else {
      this.pushEntry(this.createEntry([pkg]));
    }
  }
  
  /**
   * Start grouping mode.
   * 
   * Subsequent packages will be accumulated until endGroup() is called.
   */
  beginGroup(groupId: string, description: string): void {
    if (this.groupingActive) {
      throw new Error('Already in grouping mode');
    }
    
    this.groupingActive = true;
    this.currentGroupId = groupId;
    this.currentGroupEntries = [];
  }
  
  /**
   * End grouping mode.
   * 
   * Creates a single undo entry from all accumulated packages.
   */
  endGroup(): void {
    if (!this.groupingActive) {
      throw new Error('Not in grouping mode');
    }
    
    if (this.currentGroupEntries.length > 0) {
      const entry = this.createEntry(this.currentGroupEntries, {
        id: this.currentGroupId!,
        description: `Group: ${this.currentGroupId}`,
        isFirst: true,
        isLast: true,
        totalEntries: this.currentGroupEntries.length,
      });
      
      this.pushEntry(entry);
    }
    
    this.groupingActive = false;
    this.currentGroupId = undefined;
    this.currentGroupEntries = [];
  }
  
  /**
   * Undo the most recent entry.
   */
  async undo(state: ProjectState): Promise<UndoResult> {
    if (!this.canUndo()) {
      return {
        status: 'noop',
        reason: 'Nothing to undo',
      };
    }
    
    const entry = this.entries[this.position - 1];
    
    // Check state fingerprint
    const currentFingerprint = computeStateFingerprint(state);
    if (!fingerprintsMatch(currentFingerprint, entry.afterState)) {
      return {
        status: 'conflict',
        reason: 'Project state has changed since edit was applied',
        expected: entry.afterState,
        actual: currentFingerprint,
      };
    }
    
    try {
      // Apply inverse operations
      const diff = await this.applyInverse(state, entry);
      
      // Update position
      this.position--;
      
      // Mark entry as undone
      this.entries[this.position] = {
        ...entry,
        status: 'undone',
      };
      
      return {
        status: 'success',
        entry,
        diff,
      };
    } catch (error) {
      return {
        status: 'error',
        reason: 'Failed to undo',
        error,
      };
    }
  }
  
  /**
   * Redo the next entry.
   */
  async redo(state: ProjectState): Promise<RedoResult> {
    if (!this.canRedo()) {
      return {
        status: 'noop',
        reason: 'Nothing to redo',
      };
    }
    
    const entry = this.entries[this.position];
    
    // Check state fingerprint
    const currentFingerprint = computeStateFingerprint(state);
    if (!fingerprintsMatch(currentFingerprint, entry.beforeState)) {
      return {
        status: 'conflict',
        reason: 'Project state has changed since undo',
        expected: entry.beforeState,
        actual: currentFingerprint,
      };
    }
    
    try {
      // Re-apply forward operations
      const diff = await this.applyForward(state, entry);
      
      // Update position
      this.position++;
      
      // Mark entry as redone
      this.entries[this.position - 1] = {
        ...entry,
        status: 'redone',
      };
      
      return {
        status: 'success',
        entry,
        diff,
      };
    } catch (error) {
      return {
        status: 'error',
        reason: 'Failed to redo',
        error,
      };
    }
  }
  
  /**
   * Undo to a specific entry by ID.
   * 
   * Undoes all entries from current position back to the target entry.
   */
  async undoToEntry(entryId: string, state: ProjectState): Promise<UndoResult[]> {
    const targetIndex = this.entries.findIndex(e => e.id === entryId);
    
    if (targetIndex === -1) {
      return [{
        status: 'error',
        reason: `Entry ${entryId} not found`,
        error: new Error('Entry not found'),
      }];
    }
    
    if (targetIndex >= this.position) {
      return [{
        status: 'noop',
        reason: 'Entry is not currently applied',
      }];
    }
    
    const results: UndoResult[] = [];
    
    while (this.position > targetIndex + 1) {
      const result = await this.undo(state);
      results.push(result);
      
      if (result.status !== 'success') {
        break;
      }
    }
    
    return results;
  }
  
  /**
   * Clear the redo stack.
   * 
   * Called when a new edit is applied after undoing.
   */
  clearRedoStack(): void {
    this.entries = this.entries.slice(0, this.position);
  }
  
  /**
   * Clear the entire stack.
   */
  clear(): void {
    this.entries = [];
    this.position = 0;
  }
  
  /**
   * Get all entries (for UI display).
   */
  getAllEntries(): readonly UndoEntry[] {
    return this.entries;
  }
  
  /**
   * Get applied entries (before current position).
   */
  getAppliedEntries(): readonly UndoEntry[] {
    return this.entries.slice(0, this.position);
  }
  
  /**
   * Get undone entries (after current position).
   */
  getUndoneEntries(): readonly UndoEntry[] {
    return this.entries.slice(this.position);
  }
  
  // Private methods
  
  private pushEntry(entry: UndoEntry): void {
    // Clear redo stack when pushing new entry
    this.clearRedoStack();
    
    // Add entry
    this.entries.push(entry);
    this.position++;
    
    // Enforce max size
    if (this.entries.length > this.maxSize) {
      const excess = this.entries.length - this.maxSize;
      this.entries = this.entries.slice(excess);
      this.position -= excess;
    }
  }
  
  private createEntry(
    packages: readonly EditPackage[],
    group?: UndoGroup
  ): UndoEntry {
    const firstPkg = packages[0];
    const lastPkg = packages[packages.length - 1];
    
    return {
      id: generateUndoEntryId(),
      packages,
      tokens: packages.map(p => p.undoToken),
      timestamp: Date.now(),
      description: packages.length === 1
        ? describeEditPackage(firstPkg)
        : `${packages.length} edits`,
      beforeState: computeBeforeStateFingerprint(packages),
      afterState: computeAfterStateFingerprint(packages),
      status: 'applied',
      group,
    };
  }
  
  private async applyInverse(state: ProjectState, entry: UndoEntry): Promise<ExecutionDiff> {
    // Apply inverse operations from each package's undo token
    const diffs: ExecutionDiff[] = [];
    
    // Apply in reverse order
    for (let i = entry.packages.length - 1; i >= 0; i--) {
      const pkg = entry.packages[i];
      const diff = await applyInverseOpcodes(state, pkg.undoToken.inverseOpcodes);
      diffs.push(diff);
    }
    
    // Combine diffs
    return combineDiffs(diffs);
  }
  
  private async applyForward(state: ProjectState, entry: UndoEntry): Promise<ExecutionDiff> {
    // Re-apply forward operations from each package's plan
    const diffs: ExecutionDiff[] = [];
    
    // Apply in forward order
    for (const pkg of entry.packages) {
      const diff = await applyForwardOpcodes(state, pkg.plan.opcodes);
      diffs.push(diff);
    }
    
    // Combine diffs
    return combineDiffs(diffs);
  }
}

// ============================================================================
// State Fingerprinting
// ============================================================================

/**
 * Compute state fingerprint for current project state.
 * 
 * Used to detect conflicts when undoing/redoing.
 */
export function computeStateFingerprint(state: ProjectState): StateFingerprint {
  const entityVersions: Record<string, string> = {};
  
  // Fingerprint events
  for (const event of state.events.getAll()) {
    entityVersions[`event:${event.id}`] = computeEntityHash(event);
  }
  
  // Fingerprint tracks
  for (const track of state.tracks.getAll()) {
    entityVersions[`track:${track.id}`] = computeEntityHash(track);
  }
  
  // Fingerprint cards
  for (const card of state.cards.getAll()) {
    entityVersions[`card:${card.id}`] = computeEntityHash(card);
  }
  
  // Fingerprint sections
  for (const section of state.sections.getAll()) {
    entityVersions[`section:${section.id}`] = computeEntityHash(section);
  }
  
  // Compute structural hash
  const structureHash = computeStructureHash(state);
  
  return {
    entityVersions,
    structureHash,
  };
}

/**
 * Compute hash for a single entity.
 */
function computeEntityHash(entity: any): string {
  // Simple content-based hash
  const content = JSON.stringify(entity);
  return hashString(content);
}

/**
 * Compute hash for project structure.
 */
function computeStructureHash(state: ProjectState): string {
  const structure = {
    eventCount: state.events.getAll().length,
    trackCount: state.tracks.getAll().length,
    cardCount: state.cards.getAll().length,
    sectionCount: state.sections.getAll().length,
  };
  
  return hashString(JSON.stringify(structure));
}

/**
 * Simple string hash function.
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Check if two fingerprints match.
 */
export function fingerprintsMatch(a: StateFingerprint, b: StateFingerprint): boolean {
  // Compare structural hash first (fast check)
  if (a.structureHash !== b.structureHash) {
    return false;
  }
  
  // Compare entity versions (detailed check)
  const aKeys = Object.keys(a.entityVersions).sort();
  const bKeys = Object.keys(b.entityVersions).sort();
  
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  
  for (let i = 0; i < aKeys.length; i++) {
    if (aKeys[i] !== bKeys[i]) {
      return false;
    }
    
    if (a.entityVersions[aKeys[i]] !== b.entityVersions[bKeys[i]]) {
      return false;
    }
  }
  
  return true;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate unique undo entry ID.
 */
let undoEntryCounter = 0;
export function generateUndoEntryId(): string {
  return `undo:${Date.now()}:${undoEntryCounter++}`;
}

/**
 * Describe an edit package for undo stack display.
 */
function describeEditPackage(pkg: EditPackage): string {
  const goalCount = pkg.intent.goals.length;
  const opcodeCount = pkg.plan.opcodes.length;
  
  if (goalCount === 1) {
    const goal = pkg.intent.goals[0];
    return describeGoal(goal);
  }
  
  return `${goalCount} changes (${opcodeCount} operations)`;
}

/**
 * Describe a single goal.
 */
function describeGoal(goal: any): string {
  const type = goal.type;
  const axis = goal.axis || 'unknown';
  
  switch (type) {
    case 'increase':
      return `Increase ${axis}`;
    case 'decrease':
      return `Decrease ${axis}`;
    case 'set':
      return `Set ${axis}`;
    default:
      return `Edit ${axis}`;
  }
}

/**
 * Compute before-state fingerprint from packages.
 */
function computeBeforeStateFingerprint(packages: readonly EditPackage[]): StateFingerprint {
  const first = packages[0];
  return first.diff.before as any as StateFingerprint; // Type conversion
}

/**
 * Compute after-state fingerprint from packages.
 */
function computeAfterStateFingerprint(packages: readonly EditPackage[]): StateFingerprint {
  const last = packages[packages.length - 1];
  return last.diff.after as any as StateFingerprint; // Type conversion
}

/**
 * Apply inverse opcodes to state.
 */
async function applyInverseOpcodes(
  state: ProjectState,
  inverseOpcodes: readonly PlanOpcode[]
): Promise<ExecutionDiff> {
  // This would integrate with plan-executor.ts
  // For now, stub
  return {
    version: '1.0.0',
    before: {} as any,
    after: {} as any,
    changes: [],
    verifications: [],
    summary: 'Undo applied',
    timestamp: Date.now(),
  };
}

/**
 * Apply forward opcodes to state.
 */
async function applyForwardOpcodes(
  state: ProjectState,
  opcodes: readonly PlanOpcode[]
): Promise<ExecutionDiff> {
  // This would integrate with plan-executor.ts
  // For now, stub
  return {
    version: '1.0.0',
    before: {} as any,
    after: {} as any,
    changes: [],
    verifications: [],
    summary: 'Redo applied',
    timestamp: Date.now(),
  };
}

/**
 * Combine multiple diffs into one.
 */
function combineDiffs(diffs: readonly ExecutionDiff[]): ExecutionDiff {
  if (diffs.length === 0) {
    return {
      version: '1.0.0',
      before: {} as any,
      after: {} as any,
      changes: [],
      verifications: [],
      summary: 'No changes',
      timestamp: Date.now(),
    };
  }
  
  if (diffs.length === 1) {
    return diffs[0];
  }
  
  // Combine all changes
  const allChanges = diffs.flatMap(d => d.changes);
  const allVerifications = diffs.flatMap(d => d.verifications);
  
  return {
    version: '1.0.0',
    before: diffs[0].before,
    after: diffs[diffs.length - 1].after,
    changes: allChanges,
    verifications: allVerifications,
    summary: `${diffs.length} edits combined`,
    timestamp: Date.now(),
  };
}

// ============================================================================
// Exports
// ============================================================================

export type {
  UndoEntry,
  UndoEntryStatus,
  UndoGroup,
  UndoStack,
  UndoResult,
  RedoResult,
};

export {
  UndoStackManager,
  computeStateFingerprint,
  fingerprintsMatch,
  generateUndoEntryId,
};
