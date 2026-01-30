/**
 * @file Least-Change Planning Strategy
 * @module gofai/planning/least-change-strategy
 *
 * Implements Steps 258-259 from gofai_goalB.md:
 * - Step 258: Least-change planning as default preference
 * - Step 259: Option sets when multiple plans are near-equal
 *
 * Key Principles:
 * - Default to minimal edits that satisfy goals
 * - Prefer shallow changes over deep restructuring
 * - Allow explicit "rewrite" overrides when user wants larger changes
 * - Present multiple options when plans are significantly different
 *
 * Least-Change Philosophy:
 * - Edit magnitude matters: 2-semitone shift << reharmonization
 * - Preserve existing structure unless explicitly requested
 * - Favor production/DSP tweaks over event transformations
 * - Prefer quantization adjustments over complete rewrites
 *
 * @see src/gofai/planning/cost-model.ts (cost hierarchy)
 * @see src/gofai/planning/plan-generation.ts (search algorithm)
 */

import type { CPLPlan, Opcode, OpcodeCategory } from './plan-types';
import type { Goal, Preference } from '../canon/goals-constraints';
import type { ProjectWorldAPI } from '../infra/project-world-api';
import { scorePlan, type PlanScore } from './cost-model';
import { compareById } from '../infra/deterministic-ordering';

// ============================================================================
// Edit Magnitude Analysis
// ============================================================================

/**
 * Analyze the magnitude of change in a plan.
 *
 * Returns metrics that quantify how "big" the edit is:
 * - Event change ratio: fraction of events modified
 * - Structural depth: how deep the changes go (surface vs fundamental)
 * - Reversibility: how easily the change can be undone
 * - Audibility: how perceptible the change is
 */
export interface EditMagnitude {
  /** Fraction of project events modified (0.0-1.0) */
  readonly eventChangeRatio: number;

  /** Structural depth score (0=surface DSP, 10=complete restructure) */
  readonly structuralDepth: number;

  /** Reversibility score (0=easy undo, 10=lossy/irreversible) */
  readonly reversibility: number;

  /** Estimated audibility (0=subtle, 10=dramatic) */
  readonly audibility: number;

  /** Overall magnitude (weighted combination) */
  readonly overall: number;
}

/**
 * Compute edit magnitude for a plan.
 */
export function analyzeEditMagnitude(
  plan: CPLPlan,
  world: ProjectWorldAPI,
): EditMagnitude {
  // Count events that would be affected
  const totalEvents = world.getAllEvents().length;
  const affectedEvents = estimateAffectedEventCount(plan, world);
  const eventChangeRatio =
    totalEvents > 0 ? affectedEvents / totalEvents : 0.0;

  // Compute structural depth based on opcode categories
  const structuralDepth = computeStructuralDepth(plan.opcodes);

  // Compute reversibility based on destructiveness
  const reversibility = computeReversibility(plan.opcodes);

  // Estimate audibility based on opcode types and parameters
  const audibility = estimateAudibility(plan.opcodes);

  // Overall magnitude (weighted combination)
  const overall =
    0.2 * eventChangeRatio * 10 + // Event changes (0-2)
    0.4 * structuralDepth + // Structural depth (0-4)
    0.2 * reversibility + // Reversibility (0-2)
    0.2 * audibility; // Audibility (0-2)

  return {
    eventChangeRatio,
    structuralDepth,
    reversibility,
    audibility,
    overall,
  };
}

/**
 * Estimate how many events a plan would modify.
 */
function estimateAffectedEventCount(
  plan: CPLPlan,
  world: ProjectWorldAPI,
): number {
  // Heuristic: sum over opcodes, considering scope
  let count = 0;

  for (const opcode of plan.opcodes) {
    // Estimate based on scope
    // For now, simple heuristic based on opcode type
    if (opcode.category === 'event') {
      count += 10; // Event opcodes typically affect ~10 events
    } else if (opcode.category === 'structure') {
      count += 50; // Structure opcodes affect more
    } else if (opcode.category === 'production') {
      count += 0; // DSP changes don't modify events directly
    }
  }

  return count;
}

/**
 * Compute structural depth score for a set of opcodes.
 *
 * Scoring:
 * 0-2: Surface changes (DSP, velocity, duration tweaks)
 * 3-5: Moderate changes (density, register, quantization)
 * 6-8: Deep changes (harmony, structure, new layers)
 * 9-10: Fundamental restructuring (reharmonization, form changes)
 */
function computeStructuralDepth(opcodes: readonly Opcode[]): number {
  let maxDepth = 0;

  for (const opcode of opcodes) {
    let depth = 0;

    // Depth by category
    switch (opcode.category) {
      case 'production':
        depth = 1; // DSP is surface
        break;
      case 'event':
        if (
          opcode.type === 'adjust_velocity' ||
          opcode.type === 'adjust_duration'
        ) {
          depth = 1.5;
        } else if (opcode.type === 'quantize' || opcode.type === 'shift_timing') {
          depth = 2.5;
        } else if (opcode.type === 'transpose_pitch') {
          depth = 3.5;
        } else {
          depth = 3;
        }
        break;
      case 'rhythm':
        depth = 4;
        break;
      case 'texture':
        depth = 5;
        break;
      case 'melody':
        depth = 6;
        break;
      case 'harmony':
        if (opcode.type === 'revoice') {
          depth = 5;
        } else if (opcode.type === 'substitute_chords') {
          depth = 7;
        } else if (opcode.type === 'reharmonize') {
          depth = 9;
        } else {
          depth = 6;
        }
        break;
      case 'structure':
        depth = 8;
        break;
      case 'routing':
        depth = 4;
        break;
      default:
        depth = 5;
    }

    maxDepth = Math.max(maxDepth, depth);
  }

  return maxDepth;
}

/**
 * Compute reversibility score (higher = less reversible).
 */
function computeReversibility(opcodes: readonly Opcode[]): number {
  let worstReversibility = 0;

  for (const opcode of opcodes) {
    let score = 0;

    if (opcode.destructive) {
      score = 7; // Destructive ops are hard to reverse
    } else if (opcode.category === 'structure') {
      score = 6; // Structure changes affect undo complexity
    } else if (opcode.category === 'harmony' && opcode.type === 'reharmonize') {
      score = 8; // Reharmonization is complex to reverse
    } else if (opcode.category === 'production') {
      score = 1; // DSP changes are easily reversible
    } else {
      score = 3; // Most event transforms are moderately reversible
    }

    worstReversibility = Math.max(worstReversibility, score);
  }

  return worstReversibility;
}

/**
 * Estimate audibility of changes (higher = more noticeable).
 */
function estimateAudibility(opcodes: readonly Opcode[]): number {
  let maxAudibility = 0;

  for (const opcode of opcodes) {
    let audibility = 0;

    switch (opcode.category) {
      case 'production':
        // DSP can be subtle or dramatic
        if (opcode.type === 'adjust_brightness') {
          audibility = 4;
        } else if (opcode.type === 'adjust_width') {
          audibility = 3;
        } else {
          audibility = 5;
        }
        break;
      case 'event':
        if (opcode.type === 'transpose_pitch') {
          audibility = 8; // Pitch changes are very audible
        } else if (opcode.type === 'adjust_velocity') {
          audibility = 5;
        } else {
          audibility = 6;
        }
        break;
      case 'harmony':
        audibility = 9; // Harmony changes are highly audible
        break;
      case 'melody':
        audibility = 9; // Melody changes are highly audible
        break;
      case 'rhythm':
        audibility = 7;
        break;
      case 'texture':
        audibility = 6;
        break;
      case 'structure':
        audibility = 10; // Structure changes are maximally audible
        break;
      default:
        audibility = 5;
    }

    maxAudibility = Math.max(maxAudibility, audibility);
  }

  return maxAudibility;
}

// ============================================================================
// Least-Change Preference
// ============================================================================

/**
 * Preference level for edit magnitude.
 */
export type MagnitudePreference =
  | 'minimal' // Smallest possible changes
  | 'small' // Prefer small changes but allow moderate
  | 'moderate' // Balance between minimal and comprehensive
  | 'large' // Larger changes acceptable
  | 'rewrite'; // Complete restructuring allowed

/**
 * Extract magnitude preference from user preferences.
 */
export function getMagnitudePreference(
  preferences: readonly Preference[],
): MagnitudePreference {
  // Look for edit-style preferences
  for (const pref of preferences) {
    if (pref.type === 'edit-style') {
      const style = pref.style;
      if (style === 'minimal-change') return 'minimal';
      if (style === 'surgical') return 'small';
      if (style === 'balanced') return 'moderate';
      if (style === 'exploratory') return 'large';
      if (style === 'from-scratch') return 'rewrite';
    }
  }

  // Default: prefer minimal changes
  return 'minimal';
}

/**
 * Check if a plan's magnitude is acceptable given preferences.
 */
export function isPlanMagnitudeAcceptable(
  plan: CPLPlan,
  world: ProjectWorldAPI,
  preferences: readonly Preference[],
): boolean {
  const magnitude = analyzeEditMagnitude(plan, world);
  const preference = getMagnitudePreference(preferences);

  // Magnitude thresholds by preference
  const thresholds: Record<MagnitudePreference, number> = {
    minimal: 2.0, // Very small changes only
    small: 4.0, // Moderate changes allowed
    moderate: 6.0, // Significant changes allowed
    large: 8.0, // Large changes allowed
    rewrite: 10.0, // No limit
  };

  return magnitude.overall <= thresholds[preference];
}

/**
 * Sort plans by magnitude (smallest first) for least-change preference.
 */
export function sortPlansByMagnitude(
  plans: readonly CPLPlan[],
  world: ProjectWorldAPI,
): readonly CPLPlan[] {
  const withMagnitude = plans.map((plan) => ({
    plan,
    magnitude: analyzeEditMagnitude(plan, world),
  }));

  withMagnitude.sort((a, b) => {
    const magDiff = a.magnitude.overall - b.magnitude.overall;
    if (Math.abs(magDiff) > 0.5) return magDiff;
    // Tiebreak by plan ID
    return compareById(a.plan, b.plan);
  });

  return withMagnitude.map((item) => item.plan);
}

// ============================================================================
// Option Set Generation
// ============================================================================

/**
 * Information about why a plan is distinct from others.
 */
export interface PlanDistinction {
  readonly plan: CPLPlan;
  readonly magnitude: EditMagnitude;
  readonly score: PlanScore;
  readonly distinctionReasons: readonly string[];
}

/**
 * Determine if two plans are significantly different.
 *
 * Plans are considered distinct if they differ in:
 * - Edit magnitude (> 30% difference)
 * - Cost (> 30% difference)
 * - Category mix (different opcode categories)
 * - Scope (affecting different sections/layers)
 */
export function arePlansDistinct(
  planA: CPLPlan,
  planB: CPLPlan,
  world: ProjectWorldAPI,
): boolean {
  // Check magnitude difference
  const magA = analyzeEditMagnitude(planA, world);
  const magB = analyzeEditMagnitude(planB, world);
  const magDiff = Math.abs(magA.overall - magB.overall);
  if (magDiff > 3.0) return true; // 30% of 10-point scale

  // Check cost difference
  const costDiff = Math.abs(planA.totalCost - planB.totalCost);
  const avgCost = (planA.totalCost + planB.totalCost) / 2;
  if (avgCost > 0 && costDiff / avgCost > 0.3) return true;

  // Check category mix
  const categoriesA = new Set(planA.opcodes.map((op) => op.category));
  const categoriesB = new Set(planB.opcodes.map((op) => op.category));
  const categoryOverlap = [...categoriesA].filter((c) => categoriesB.has(c)).length;
  const categoryUnion = new Set([...categoriesA, ...categoriesB]).size;
  if (categoryOverlap / categoryUnion < 0.7) return true; // < 70% overlap

  // Plans are similar
  return false;
}

/**
 * Generate option set from multiple plans.
 *
 * Returns up to maxOptions distinct plans with explanations of differences.
 */
export function generateOptionSet(
  plans: readonly CPLPlan[],
  world: ProjectWorldAPI,
  goals: readonly Goal[],
  maxOptions: number = 3,
): readonly PlanDistinction[] {
  if (plans.length === 0) return [];

  // Score all plans
  const scored = plans.map((plan) => ({
    plan,
    magnitude: analyzeEditMagnitude(plan, world),
    score: scorePlan(plan, goals, [], world),
  }));

  // Sort by score (best first)
  scored.sort((a, b) => b.score.overall - a.score.overall);

  // Select distinct plans
  const selected: PlanDistinction[] = [];
  selected.push({
    ...scored[0],
    distinctionReasons: ['Highest overall score'],
  });

  for (let i = 1; i < scored.length && selected.length < maxOptions; i++) {
    const candidate = scored[i];

    // Check if distinct from all selected plans
    const isDistinct = selected.every((s) =>
      arePlansDistinct(s.plan, candidate.plan, world),
    );

    if (isDistinct) {
      // Determine distinction reasons
      const reasons: string[] = [];

      // Compare with first selected plan
      const reference = selected[0];

      if (
        Math.abs(candidate.magnitude.overall - reference.magnitude.overall) > 3.0
      ) {
        if (candidate.magnitude.overall < reference.magnitude.overall) {
          reasons.push('Smaller edit magnitude');
        } else {
          reasons.push('Larger edit magnitude');
        }
      }

      if (candidate.plan.totalCost < reference.plan.totalCost * 0.8) {
        reasons.push('Lower cost');
      } else if (candidate.plan.totalCost > reference.plan.totalCost * 1.2) {
        reasons.push('Higher cost but different approach');
      }

      const catsDiff = new Set(
        candidate.plan.opcodes.map((op) => op.category),
      );
      const catsRef = new Set(reference.plan.opcodes.map((op) => op.category));
      const uniqueCats = [...catsDiff].filter((c) => !catsRef.has(c));
      if (uniqueCats.length > 0) {
        reasons.push(`Different strategy: includes ${uniqueCats.join(', ')}`);
      }

      if (reasons.length === 0) {
        reasons.push('Alternative approach with similar characteristics');
      }

      selected.push({
        ...candidate,
        distinctionReasons: reasons,
      });
    }
  }

  return selected;
}

/**
 * Format option set for user presentation.
 */
export function formatOptionSet(options: readonly PlanDistinction[]): string {
  const lines: string[] = [];

  lines.push(`${options.length} distinct option(s) available:\n`);

  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    lines.push(`Option ${i + 1}:`);
    lines.push(`  Score: ${opt.score.overall.toFixed(2)}`);
    lines.push(`  Cost: ${opt.plan.totalCost.toFixed(1)}`);
    lines.push(`  Magnitude: ${opt.magnitude.overall.toFixed(1)}/10`);
    lines.push(`  Opcodes: ${opt.plan.opcodes.length}`);
    if (opt.distinctionReasons.length > 0) {
      lines.push(`  Why different: ${opt.distinctionReasons.join(', ')}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
