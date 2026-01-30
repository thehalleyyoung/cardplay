/**
 * Undo Trust Primitive
 *
 * The undo system provides full-fidelity reversible edit packages.
 * Every GOFAI mutation is packaged into an EditPackage that contains
 * everything needed to undo the change exactly.
 *
 * ## Design Principles
 *
 * 1. **Atomicity**: Each edit package is an indivisible unit of undo
 * 2. **Completeness**: Undo restores exact prior state (not approximate)
 * 3. **Addressability**: Undo by recency, ID, scope, or turn
 * 4. **Persistence**: Edit history survives restart
 * 5. **Bounded**: History is configurable but never silently dropped
 *
 * ## Edit Package Lifecycle
 *
 * ```
 * compile → plan → preview → apply → EditPackage
 *                                        ↓
 *                                    [in history]
 *                                        ↓
 *                                   undo / redo
 * ```
 *
 * @module gofai/trust/undo
 */

import type { DiffReport } from './diff';
import type { WhyExplanation } from './why';

// =============================================================================
// Edit Package Identity
// =============================================================================

/**
 * Branded type for edit package IDs.
 *
 * Format: `ep:{timestamp}:{hash}` where hash is derived from
 * the CPL + plan + compiler version. This ensures:
 * - IDs are stable (same edit = same hash)
 * - IDs are unique (timestamp disambiguates)
 * - IDs are sortable (timestamp prefix)
 */
export type EditPackageId = string & { readonly __editPackageId?: unique symbol };

/**
 * Create an edit package ID.
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @param hash - Content hash of CPL + plan + version (first 8 chars)
 */
export function createEditPackageId(
  timestamp: number,
  hash: string,
): EditPackageId {
  return `ep:${timestamp}:${hash.slice(0, 8)}` as EditPackageId;
}

/**
 * Validate an edit package ID format.
 */
export function isValidEditPackageId(id: string): id is EditPackageId {
  return /^ep:\d+:[a-f0-9]{8}$/.test(id);
}

/**
 * Extract timestamp from an edit package ID.
 */
export function getEditPackageTimestamp(id: EditPackageId): number {
  const parts = id.split(':');
  return parseInt(parts[1], 10);
}

// =============================================================================
// Edit Package
// =============================================================================

/**
 * An atomic edit package — the unit of undo.
 *
 * Contains everything needed to:
 * 1. Display what happened (summary, diff, explanation)
 * 2. Undo the change (inverse diff)
 * 3. Redo the change (forward diff)
 * 4. Reproduce the change (CPL, plan, version)
 *
 * ## Invariants
 *
 * 1. `diff.inverse` applied after `diff` restores original state
 * 2. `id` is deterministic given CPL + plan + version + timestamp
 * 3. `version` matches the compiler that produced this package
 * 4. `status` transitions: applied → undone → redone → undone → ...
 */
export interface EditPackage {
  /** Stable identifier */
  readonly id: EditPackageId;

  /** When this package was created (for sorting/display) */
  readonly timestamp: number;

  /** Current status in the undo/redo lifecycle */
  readonly status: EditPackageStatus;

  /** Human-readable label ("Chorus brightness +20%") */
  readonly label: string;

  /** User-given name (if bookmarked) */
  readonly userLabel?: string;

  /** The original utterance that produced this package */
  readonly utterance: string;

  /** The normalized intent (serialized CPL-Intent) */
  readonly cpl: unknown; // CPLRequest once module exists

  /** The executed plan (serialized CPL-Plan) */
  readonly plan: unknown; // CPLPlan once module exists

  /** The diff report (what changed) */
  readonly diff: DiffReport;

  /** The why-explanation (optional, computed on demand) */
  readonly explanation?: WhyExplanation;

  /** Compiler version fingerprint */
  readonly version: string;

  /** Scope summary for addressable undo */
  readonly scopeSummary: EditScopeSummary;

  /** Tags for categorization */
  readonly tags: readonly string[];
}

/**
 * Status of an edit package in the undo/redo lifecycle.
 */
export type EditPackageStatus = 'applied' | 'undone' | 'redone';

/**
 * Summary of which scopes an edit package affects.
 * Used for addressable undo ("undo chorus changes").
 */
export interface EditScopeSummary {
  /** Section IDs affected */
  readonly sections: readonly string[];

  /** Layer/track IDs affected */
  readonly layers: readonly string[];

  /** Card IDs affected */
  readonly cards: readonly string[];

  /** Time range in ticks */
  readonly tickRange?: { readonly start: number; readonly end: number };

  /** Whether this is a global edit */
  readonly isGlobal: boolean;
}

// =============================================================================
// Undo/Redo Results
// =============================================================================

/**
 * Result of an undo operation.
 */
export type UndoResult =
  | UndoSuccess
  | UndoFailure;

export interface UndoSuccess {
  readonly type: 'success';
  /** The package that was undone */
  readonly package: EditPackage;
  /** What was restored */
  readonly restoredDiff: DiffReport;
}

export interface UndoFailure {
  readonly type: 'failure';
  /** Why undo failed */
  readonly reason: UndoFailureReason;
  /** Human-readable explanation */
  readonly message: string;
  /** The package that was attempted */
  readonly packageId: EditPackageId;
}

export type UndoFailureReason =
  | 'no_package'           // Nothing to undo
  | 'already_undone'       // Package is already undone
  | 'conflict'             // World state changed incompatibly
  | 'expired'              // Package evicted from history
  | 'corrupted';           // Package data is invalid

/**
 * Result of a redo operation.
 */
export type RedoResult =
  | RedoSuccess
  | RedoFailure;

export interface RedoSuccess {
  readonly type: 'success';
  /** The package that was redone */
  readonly package: EditPackage;
  /** What was changed */
  readonly diff: DiffReport;
}

export interface RedoFailure {
  readonly type: 'failure';
  /** Why redo failed */
  readonly reason: RedoFailureReason;
  /** Human-readable explanation */
  readonly message: string;
  /** The package that was attempted */
  readonly packageId: EditPackageId;
  /** If conflict, what specifically conflicts */
  readonly conflicts?: readonly RedoConflict[];
}

export type RedoFailureReason =
  | 'no_package'           // Nothing to redo
  | 'not_undone'           // Package is not in undone state
  | 'conflict'             // World state changed, redo would corrupt
  | 'constraint_violation'; // Redo would violate current constraints

/**
 * A specific conflict that prevents redo.
 */
export interface RedoConflict {
  /** What entity is in conflict */
  readonly entityId: string;
  /** What changed */
  readonly description: string;
  /** What the redo expected */
  readonly expected: string;
  /** What was found */
  readonly found: string;
}

// =============================================================================
// Edit History
// =============================================================================

/**
 * Configuration for edit history.
 */
export interface EditHistoryConfig {
  /** Maximum number of packages to keep (default: 200) */
  readonly maxPackages: number;

  /** Whether to persist history across sessions (default: true) */
  readonly persist: boolean;

  /** Whether evicted packages should be archived (default: false) */
  readonly archiveEvicted: boolean;

  /** Archive path (if archiving) */
  readonly archivePath?: string;
}

/**
 * Default edit history configuration.
 */
export const DEFAULT_EDIT_HISTORY_CONFIG: EditHistoryConfig = {
  maxPackages: 200,
  persist: true,
  archiveEvicted: false,
} as const;

/**
 * The edit history — an ordered collection of edit packages.
 *
 * ## Invariants
 *
 * 1. Packages are ordered by timestamp (oldest first)
 * 2. At most `maxPackages` are retained
 * 3. The "current position" divides applied from undone packages
 * 4. Undo moves position backward; redo moves it forward
 * 5. New edits clear all undone packages after current position
 */
export interface EditHistory {
  /** All packages in chronological order */
  readonly packages: readonly EditPackage[];

  /** Index of the current position (exclusive: packages[0..pos) are applied) */
  readonly currentPosition: number;

  /** Configuration */
  readonly config: EditHistoryConfig;

  /** Total number of edits ever applied (including evicted) */
  readonly totalEditsApplied: number;

  /** Last modified timestamp */
  readonly lastModified: number;
}

// =============================================================================
// History Operations
// =============================================================================

/**
 * Create an empty edit history.
 */
export function createEditHistory(
  config?: Partial<EditHistoryConfig>,
): EditHistory {
  return {
    packages: [],
    currentPosition: 0,
    config: { ...DEFAULT_EDIT_HISTORY_CONFIG, ...config },
    totalEditsApplied: 0,
    lastModified: 0,
  };
}

/**
 * Add an edit package to the history.
 *
 * This:
 * 1. Clears any undone packages after current position
 * 2. Adds the new package
 * 3. Trims history if over capacity
 * 4. Updates position
 */
export function addToHistory(
  history: EditHistory,
  pkg: EditPackage,
): EditHistory {
  // Clear undone packages (new edit invalidates redo stack)
  const activePackages = history.packages.slice(0, history.currentPosition);

  // Add new package
  const newPackages = [...activePackages, pkg];

  // Trim if over capacity
  const trimmed = trimHistory(newPackages, history.config.maxPackages);

  return {
    packages: trimmed,
    currentPosition: trimmed.length,
    config: history.config,
    totalEditsApplied: history.totalEditsApplied + 1,
    lastModified: pkg.timestamp,
  };
}

/**
 * Undo the most recent applied package.
 */
export function undoLast(
  history: EditHistory,
): { history: EditHistory; undone: EditPackage } | undefined {
  if (history.currentPosition <= 0) return undefined;

  const targetIdx = history.currentPosition - 1;
  const pkg = history.packages[targetIdx];

  const updatedPkg: EditPackage = { ...pkg, status: 'undone' };
  const updatedPackages = [...history.packages];
  updatedPackages[targetIdx] = updatedPkg;

  return {
    history: {
      ...history,
      packages: updatedPackages,
      currentPosition: targetIdx,
      lastModified: Date.now(),
    },
    undone: updatedPkg,
  };
}

/**
 * Redo the most recently undone package.
 */
export function redoNext(
  history: EditHistory,
): { history: EditHistory; redone: EditPackage } | undefined {
  if (history.currentPosition >= history.packages.length) return undefined;

  const targetIdx = history.currentPosition;
  const pkg = history.packages[targetIdx];
  if (pkg.status !== 'undone') return undefined;

  const updatedPkg: EditPackage = { ...pkg, status: 'redone' };
  const updatedPackages = [...history.packages];
  updatedPackages[targetIdx] = updatedPkg;

  return {
    history: {
      ...history,
      packages: updatedPackages,
      currentPosition: targetIdx + 1,
      lastModified: Date.now(),
    },
    redone: updatedPkg,
  };
}

/**
 * Undo a specific package by ID.
 *
 * This is more complex than undoLast because it may require
 * undoing intervening packages. Returns the list of all packages
 * that were undone.
 */
export function undoById(
  history: EditHistory,
  packageId: EditPackageId,
): { history: EditHistory; undone: readonly EditPackage[] } | undefined {
  const targetIdx = history.packages.findIndex((p) => p.id === packageId);
  if (targetIdx < 0) return undefined;
  if (targetIdx >= history.currentPosition) return undefined;

  // Must undo all packages from currentPosition-1 down to targetIdx
  const undone: EditPackage[] = [];
  const updatedPackages = [...history.packages];

  for (let i = history.currentPosition - 1; i >= targetIdx; i--) {
    const pkg = history.packages[i];
    const updated: EditPackage = { ...pkg, status: 'undone' };
    updatedPackages[i] = updated;
    undone.push(updated);
  }

  return {
    history: {
      ...history,
      packages: updatedPackages,
      currentPosition: targetIdx,
      lastModified: Date.now(),
    },
    undone,
  };
}

/**
 * Find packages affecting a specific scope (for "undo chorus changes").
 */
export function findPackagesByScope(
  history: EditHistory,
  scopeKind: 'section' | 'layer' | 'card',
  scopeId: string,
): readonly EditPackage[] {
  return history.packages
    .slice(0, history.currentPosition)
    .filter((pkg) => {
      switch (scopeKind) {
        case 'section':
          return pkg.scopeSummary.sections.includes(scopeId);
        case 'layer':
          return pkg.scopeSummary.layers.includes(scopeId);
        case 'card':
          return pkg.scopeSummary.cards.includes(scopeId);
      }
    });
}

/**
 * Get packages available for undo (applied, in reverse order).
 */
export function getUndoStack(history: EditHistory): readonly EditPackage[] {
  return history.packages.slice(0, history.currentPosition).reverse();
}

/**
 * Get packages available for redo (undone, in forward order).
 */
export function getRedoStack(history: EditHistory): readonly EditPackage[] {
  return history.packages
    .slice(history.currentPosition)
    .filter((p) => p.status === 'undone');
}

/**
 * Check if undo is available.
 */
export function canUndo(history: EditHistory): boolean {
  return history.currentPosition > 0;
}

/**
 * Check if redo is available.
 */
export function canRedo(history: EditHistory): boolean {
  return (
    history.currentPosition < history.packages.length &&
    history.packages[history.currentPosition]?.status === 'undone'
  );
}

/**
 * Serialize edit history for persistence.
 */
export function serializeHistory(history: EditHistory): string {
  return JSON.stringify({
    packages: history.packages,
    currentPosition: history.currentPosition,
    config: history.config,
    totalEditsApplied: history.totalEditsApplied,
    lastModified: history.lastModified,
  });
}

/**
 * Deserialize edit history from persistence.
 */
export function deserializeHistory(json: string): EditHistory {
  const data = JSON.parse(json) as EditHistory;
  return {
    packages: data.packages,
    currentPosition: data.currentPosition,
    config: { ...DEFAULT_EDIT_HISTORY_CONFIG, ...data.config },
    totalEditsApplied: data.totalEditsApplied,
    lastModified: data.lastModified,
  };
}

// =============================================================================
// Internal Helpers
// =============================================================================

function trimHistory(
  packages: readonly EditPackage[],
  maxPackages: number,
): readonly EditPackage[] {
  if (packages.length <= maxPackages) return packages;
  // Remove oldest packages
  return packages.slice(packages.length - maxPackages);
}
