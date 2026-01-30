/**
 * @file Diff Types for Plan Comparison
 * @module gofai/execution/diff-types
 *
 * Types for human-readable diff summaries used in plan selection UI.
 * These types represent diffs in terms users understand (sections, layers, changes)
 * rather than low-level event/container mutations.
 *
 * Used by:
 * - Plan selection UI (Step 260)
 * - Diff rendering (Step 326)
 * - Explanation generation (Step 328)
 *
 * @see src/gofai/planning/plan-selection-ui.tsx (consumer)
 * @see src/gofai/execution/diff-model.ts (low-level diffs)
 * @see src/gofai/execution/diff-summary.ts (summarization logic)
 */

import type { CardPlayId } from '../../canon/cardplay-id';

// Temporary TimeRange type until music/time module is available
export interface TimeRange {
  readonly startTick: number;
  readonly endTick: number;
}

// ============================================================================
// Section-Level Diffs
// ============================================================================

/**
 * Summary of changes to a specific section (chorus, verse, etc.).
 */
export interface SectionDiff {
  /** Section identifier (e.g., "Chorus 1", "Verse 2") */
  readonly sectionName: string;

  /** Time range of the section */
  readonly timeRange: TimeRange;

  /** Number of events added in this section */
  readonly eventsAdded: number;

  /** Number of events removed in this section */
  readonly eventsRemoved: number;

  /** Number of events modified (pitch, duration, velocity, etc.) */
  readonly eventsModified: number;

  /** Number of events unchanged */
  readonly eventsUnchanged: number;

  /** Human-readable summary of section changes */
  readonly summary: string;

  /** Specific change categories in this section */
  readonly changeCategories: readonly SectionChangeCategory[];
}

/**
 * Categories of changes within a section.
 */
export type SectionChangeCategory =
  | 'structure' // Section length, breaks, repeats
  | 'density' // More/fewer notes
  | 'rhythm' // Timing, swing, quantization
  | 'pitch' // Melodic/harmonic content
  | 'articulation' // Note expression, dynamics
  | 'arrangement'; // Layer mix, routing

// ============================================================================
// Layer-Level Diffs
// ============================================================================

/**
 * Summary of changes to a specific layer/track.
 */
export interface LayerDiff {
  /** Layer identifier (track name or role) */
  readonly layerName: string;

  /** Track ID if applicable */
  readonly trackId?: CardPlayId;

  /** Density change (fraction of baseline, -1.0 to +1.0) */
  readonly densityChange?: number;

  /** Register change (semitones, negative = lower, positive = higher) */
  readonly registerChange?: number;

  /** Timing changes (quantize, humanize, swing) */
  readonly timingChanges?: readonly TimingChange[];

  /** Parameter changes (card DSP params) */
  readonly parametersChanged: readonly ParameterChange[];

  /** Human-readable summary of layer changes */
  readonly summary: string;

  /** Whether new cards were added to this layer */
  readonly cardsAdded: number;

  /** Whether cards were removed from this layer */
  readonly cardsRemoved: number;
}

/**
 * A timing-related change (quantize, swing, etc.).
 */
export interface TimingChange {
  readonly type: 'quantize' | 'humanize' | 'swing' | 'shift' | 'stretch';
  readonly description: string;
  readonly amount?: number;
}

/**
 * A parameter change on a card.
 */
export interface ParameterChange {
  readonly cardId: CardPlayId;
  readonly cardName: string;
  readonly parameterName: string;
  readonly oldValue: unknown;
  readonly newValue: unknown;
  readonly description: string;
}

// ============================================================================
// Overall Diff Summary
// ============================================================================

/**
 * High-level summary of all changes in a plan.
 * This is what users see in the plan selection UI.
 */
export interface DiffSummary {
  /** Overall one-sentence description of the change */
  readonly overallDescription: string;

  /** Scope description (e.g., "entire chorus", "bars 17-24", "drums only") */
  readonly scopeDescription: string;

  /** Changes broken down by section */
  readonly sectionDiffs: readonly SectionDiff[];

  /** Changes broken down by layer/track */
  readonly layerDiffs: readonly LayerDiff[];

  /** Total event changes across all sections/layers */
  readonly totalEventsAdded: number;
  readonly totalEventsRemoved: number;
  readonly totalEventsModified: number;
  readonly totalEventsUnchanged: number;

  /** Whether the change is considered "safe" (reversible, low risk) */
  readonly isSafeChange: boolean;

  /** Warning messages if any (constraint violations, risky operations) */
  readonly warnings: readonly string[];

  /** Preserved elements (for "keep X" constraints) */
  readonly preserved: readonly string[];
}

// ============================================================================
// Diff Comparison (for distinguishing plans)
// ============================================================================

/**
 * Result of comparing two diff summaries.
 * Used to highlight differences between plan candidates.
 */
export interface DiffComparison {
  /** Sections unique to diff A */
  readonly sectionsOnlyInA: readonly string[];

  /** Sections unique to diff B */
  readonly sectionsOnlyInB: readonly string[];

  /** Layers unique to diff A */
  readonly layersOnlyInA: readonly string[];

  /** Layers unique to diff B */
  readonly layersOnlyInB: readonly string[];

  /** Change types only in A */
  readonly changeTypesOnlyInA: readonly SectionChangeCategory[];

  /** Change types only in B */
  readonly changeTypesOnlyInB: readonly SectionChangeCategory[];

  /** Overall similarity score (0.0 = completely different, 1.0 = identical) */
  readonly similarity: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Compare two diff summaries to find distinguishing features.
 */
export function compareDiffSummaries(a: DiffSummary, b: DiffSummary): DiffComparison {
  const sectionsA = new Set(a.sectionDiffs.map((sd) => sd.sectionName));
  const sectionsB = new Set(b.sectionDiffs.map((sd) => sd.sectionName));

  const layersA = new Set(a.layerDiffs.map((ld) => ld.layerName));
  const layersB = new Set(b.layerDiffs.map((ld) => ld.layerName));

  const categoriesA = new Set(
    a.sectionDiffs.flatMap((sd) => sd.changeCategories)
  );
  const categoriesB = new Set(
    b.sectionDiffs.flatMap((sd) => sd.changeCategories)
  );

  const sectionsOnlyInA = Array.from(sectionsA).filter((s) => !sectionsB.has(s));
  const sectionsOnlyInB = Array.from(sectionsB).filter((s) => !sectionsA.has(s));

  const layersOnlyInA = Array.from(layersA).filter((l) => !layersB.has(l));
  const layersOnlyInB = Array.from(layersB).filter((l) => !layersA.has(l));

  const changeTypesOnlyInA = Array.from(categoriesA).filter((c) => !categoriesB.has(c));
  const changeTypesOnlyInB = Array.from(categoriesB).filter((c) => !categoriesA.has(c));

  // Compute similarity based on overlap
  const sectionOverlap = Array.from(sectionsA).filter((s) => sectionsB.has(s)).length;
  const layerOverlap = Array.from(layersA).filter((l) => layersB.has(l)).length;
  const categoryOverlap = Array.from(categoriesA).filter((c) => categoriesB.has(c)).length;

  const totalA = sectionsA.size + layersA.size + categoriesA.size;
  const totalB = sectionsB.size + layersB.size + categoriesB.size;
  const totalOverlap = sectionOverlap + layerOverlap + categoryOverlap;

  const similarity = totalA + totalB > 0 ? (2 * totalOverlap) / (totalA + totalB) : 1.0;

  return {
    sectionsOnlyInA,
    sectionsOnlyInB,
    layersOnlyInA,
    layersOnlyInB,
    changeTypesOnlyInA,
    changeTypesOnlyInB,
    similarity,
  };
}

/**
 * Check if two diff summaries are substantially similar.
 */
export function areDiffsSimilar(
  a: DiffSummary,
  b: DiffSummary,
  threshold: number = 0.8
): boolean {
  const comparison = compareDiffSummaries(a, b);
  return comparison.similarity >= threshold;
}

/**
 * Create an empty diff summary.
 */
export function createEmptyDiffSummary(): DiffSummary {
  return {
    overallDescription: 'No changes',
    scopeDescription: 'none',
    sectionDiffs: [],
    layerDiffs: [],
    totalEventsAdded: 0,
    totalEventsRemoved: 0,
    totalEventsModified: 0,
    totalEventsUnchanged: 0,
    isSafeChange: true,
    warnings: [],
    preserved: [],
  };
}
