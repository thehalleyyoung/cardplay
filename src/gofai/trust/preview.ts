/**
 * Preview Trust Primitive
 *
 * The preview system ensures that users can inspect exactly what will
 * change before any mutation occurs. Every GOFAI plan produces a
 * PreviewResult that the UI must display before allowing "Apply".
 *
 * ## Design Principles
 *
 * 1. **Completeness**: Every affected entity appears in the preview
 * 2. **Accuracy**: Preview matches actual execution exactly
 * 3. **Readability**: Summaries are in musician-friendly language
 * 4. **Safety**: Safety levels are computed from constraints + scope
 *
 * ## Usage
 *
 * ```typescript
 * const preview = compiler.preview(plan);
 * if (preview.safetyLevel === 'risky') {
 *   // Show extra confirmation UI
 * }
 * // Display preview.summary, preview.affectedScopes, etc.
 * ```
 *
 * @module gofai/trust/preview
 */

import type { DiffReport } from './diff';
import type { ScopeHighlight } from './scope-highlighting';
import type { WhyExplanation } from './why';

// =============================================================================
// Safety Levels
// =============================================================================

/**
 * Safety level for a plan, derived from constraint analysis and scope size.
 *
 * - `safe`: Small, well-constrained changes. Low risk of unwanted effects.
 * - `caution`: Medium scope or some constraints are soft. Review recommended.
 * - `risky`: Large scope, weak constraints, or structural changes. Extra confirmation required.
 *
 * Safety level is NOT probabilistic. It is a deterministic function of:
 * - Number of entities affected
 * - Whether hard constraints protect important content
 * - Whether structural changes (add/remove layers/sections) are involved
 * - Whether the scope crosses section boundaries
 */
export type PreviewSafetyLevel = 'safe' | 'caution' | 'risky';

// =============================================================================
// Constraint Checks
// =============================================================================

/**
 * Result of checking a single constraint against a plan.
 */
export interface PreviewConstraintCheck {
  /** Constraint identifier (from canon constraint-types) */
  readonly constraintId: string;

  /** Human-readable constraint description */
  readonly description: string;

  /** Whether the constraint is satisfied by the plan */
  readonly satisfied: boolean;

  /** Whether this is a hard (blocking) or soft (advisory) constraint */
  readonly hard: boolean;

  /** Details about how the constraint was checked */
  readonly details: string;

  /** If violated, what entities are affected */
  readonly affectedEntities?: readonly string[];

  /** If violated and hard, this blocks execution */
  readonly blocksExecution: boolean;
}

// =============================================================================
// Cost Estimates
// =============================================================================

/**
 * Cost estimate for a plan step.
 *
 * Cost is measured in "edit distance" — a deterministic metric that
 * counts the number of atomic changes (event edits, param changes,
 * structural mutations). Higher cost = more change = more review needed.
 */
export interface PreviewCostEstimate {
  /** Total number of event-level changes (note add/remove/modify) */
  readonly eventChanges: number;

  /** Total number of parameter changes (card param adjustments) */
  readonly paramChanges: number;

  /** Total number of structural changes (add/remove cards, layers, sections) */
  readonly structuralChanges: number;

  /** Aggregate cost score (weighted sum) */
  readonly totalCost: number;

  /** Cost category for UI display */
  readonly category: 'minimal' | 'small' | 'moderate' | 'large' | 'extensive';

  /** Human-readable cost summary */
  readonly summary: string;
}

// =============================================================================
// Preview Configuration
// =============================================================================

/**
 * Configuration for preview generation.
 */
export interface PreviewConfig {
  /** Whether to include full diff details (default: true) */
  readonly includeDiff: boolean;

  /** Whether to include why-explanation chains (default: false for performance) */
  readonly includeWhy: boolean;

  /** Whether to include scope highlighting data (default: true) */
  readonly includeHighlights: boolean;

  /** Maximum number of individual changes to enumerate (default: 100) */
  readonly maxDetailedChanges: number;

  /** Whether to compute cost estimates (default: true) */
  readonly includeCost: boolean;
}

/**
 * Default preview configuration.
 */
export const DEFAULT_PREVIEW_CONFIG: PreviewConfig = {
  includeDiff: true,
  includeWhy: false,
  includeHighlights: true,
  maxDetailedChanges: 100,
  includeCost: true,
} as const;

// =============================================================================
// Preview Result
// =============================================================================

/**
 * The complete preview result for a GOFAI plan.
 *
 * This is the primary artifact consumed by the GOFAI deck UI to show
 * the user what will happen before they click "Apply".
 *
 * ## Invariants
 *
 * 1. `affectedScopes` is never empty for a non-trivial plan
 * 2. `constraintChecks` includes every constraint from the CPL request
 * 3. `safetyLevel` is deterministic given the same plan + project state
 * 4. `summary` is always a non-empty string
 * 5. If any hard constraint is violated, `canApply` is false
 */
export interface PreviewResult {
  /** Unique preview ID (tied to the plan version) */
  readonly id: string;

  /** Safety level for the overall plan */
  readonly safetyLevel: PreviewSafetyLevel;

  /** Whether the plan can be applied (false if hard constraints violated) */
  readonly canApply: boolean;

  /** Human-readable summary of what will change (one paragraph) */
  readonly summary: string;

  /** Per-line summary items for UI display */
  readonly summaryLines: readonly PreviewSummaryLine[];

  /** Scopes affected by this plan (sections, layers, time ranges) */
  readonly affectedScopes: readonly PreviewAffectedScope[];

  /** Results of all constraint checks */
  readonly constraintChecks: readonly PreviewConstraintCheck[];

  /** Cost estimate for the plan */
  readonly costEstimate: PreviewCostEstimate;

  /** Detailed diff report (if requested in config) */
  readonly diff?: DiffReport;

  /** Scope highlighting data for UI overlay (if requested) */
  readonly highlights?: readonly ScopeHighlight[];

  /** Why-explanation chain (if requested) */
  readonly explanation?: WhyExplanation;

  /** Alternative plans, if multiple were considered */
  readonly alternatives?: readonly PreviewAlternative[];
}

// =============================================================================
// Summary Lines
// =============================================================================

/**
 * A single line in the preview summary, suitable for list display.
 */
export interface PreviewSummaryLine {
  /** Icon category for UI rendering */
  readonly icon: 'add' | 'remove' | 'change' | 'preserve' | 'warning' | 'info';

  /** Human-readable description of this change */
  readonly text: string;

  /** The scope this line refers to (for click-to-highlight) */
  readonly scopeRef?: string;

  /** Whether this line represents a constraint, not a change */
  readonly isConstraint: boolean;
}

// =============================================================================
// Affected Scopes
// =============================================================================

/**
 * A scope region affected by the plan.
 */
export interface PreviewAffectedScope {
  /** What kind of scope */
  readonly kind: 'section' | 'layer' | 'time-range' | 'card' | 'global';

  /** Human-readable label */
  readonly label: string;

  /** Entity ID (section ID, layer ID, card ID, etc.) */
  readonly entityId?: string;

  /** Time range in ticks (if applicable) */
  readonly tickRange?: { readonly start: number; readonly end: number };

  /** Number of events affected in this scope */
  readonly eventCount: number;

  /** Number of parameters affected in this scope */
  readonly paramCount: number;

  /** Whether this scope has preserve constraints protecting it */
  readonly isProtected: boolean;
}

// =============================================================================
// Alternatives
// =============================================================================

/**
 * An alternative plan that was considered but not selected.
 */
export interface PreviewAlternative {
  /** Brief label for this alternative */
  readonly label: string;

  /** Why this alternative was not selected */
  readonly reason: string;

  /** Cost difference relative to the selected plan */
  readonly costDelta: number;

  /** Key differences from the selected plan */
  readonly differences: readonly string[];
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Compute the safety level from constraint checks and cost estimate.
 *
 * Rules (deterministic, no probabilities):
 * 1. If any hard constraint is violated → 'risky'
 * 2. If structural changes > 0 → at least 'caution'
 * 3. If total cost > LARGE_THRESHOLD → 'risky'
 * 4. If total cost > MODERATE_THRESHOLD → 'caution'
 * 5. Otherwise → 'safe'
 */
export function computeSafetyLevel(
  constraintChecks: readonly PreviewConstraintCheck[],
  costEstimate: PreviewCostEstimate,
): PreviewSafetyLevel {
  // Hard constraint violation → risky
  const hasHardViolation = constraintChecks.some(
    (c) => c.hard && !c.satisfied,
  );
  if (hasHardViolation) {
    return 'risky';
  }

  // Large cost → risky
  const LARGE_THRESHOLD = 50;
  if (costEstimate.totalCost > LARGE_THRESHOLD) {
    return 'risky';
  }

  // Structural changes or moderate cost → caution
  const MODERATE_THRESHOLD = 15;
  if (
    costEstimate.structuralChanges > 0 ||
    costEstimate.totalCost > MODERATE_THRESHOLD
  ) {
    return 'caution';
  }

  // Soft constraint violation → caution
  const hasSoftViolation = constraintChecks.some(
    (c) => !c.hard && !c.satisfied,
  );
  if (hasSoftViolation) {
    return 'caution';
  }

  return 'safe';
}

/**
 * Compute the cost category from a total cost score.
 */
export function computeCostCategory(
  totalCost: number,
): PreviewCostEstimate['category'] {
  if (totalCost <= 2) return 'minimal';
  if (totalCost <= 8) return 'small';
  if (totalCost <= 25) return 'moderate';
  if (totalCost <= 60) return 'large';
  return 'extensive';
}

/**
 * Generate a human-readable cost summary.
 */
export function formatCostSummary(estimate: PreviewCostEstimate): string {
  const parts: string[] = [];

  if (estimate.eventChanges > 0) {
    parts.push(
      `${estimate.eventChanges} event${estimate.eventChanges === 1 ? '' : 's'}`,
    );
  }
  if (estimate.paramChanges > 0) {
    parts.push(
      `${estimate.paramChanges} parameter${estimate.paramChanges === 1 ? '' : 's'}`,
    );
  }
  if (estimate.structuralChanges > 0) {
    parts.push(
      `${estimate.structuralChanges} structural change${estimate.structuralChanges === 1 ? '' : 's'}`,
    );
  }

  if (parts.length === 0) {
    return 'No changes';
  }

  return `${parts.join(', ')} (${estimate.category})`;
}

/**
 * Create a cost estimate from raw counts.
 *
 * Weights:
 * - Event changes: 1 point each
 * - Param changes: 2 points each (affect rendering)
 * - Structural changes: 10 points each (add/remove entities)
 */
export function createCostEstimate(
  eventChanges: number,
  paramChanges: number,
  structuralChanges: number,
): PreviewCostEstimate {
  const totalCost =
    eventChanges * 1 + paramChanges * 2 + structuralChanges * 10;
  const category = computeCostCategory(totalCost);
  const estimate: PreviewCostEstimate = {
    eventChanges,
    paramChanges,
    structuralChanges,
    totalCost,
    category,
    summary: '', // Filled below
  };
  return {
    ...estimate,
    summary: formatCostSummary(estimate),
  };
}

/**
 * Determine whether a plan can be applied given its constraint checks.
 *
 * A plan is blocked if any hard constraint is violated.
 */
export function canApplyPlan(
  constraintChecks: readonly PreviewConstraintCheck[],
): boolean {
  return !constraintChecks.some((c) => c.blocksExecution);
}
