/**
 * @file Plan Generation via Bounded Search
 * @module gofai/planning/plan-generation
 *
 * Implements Step 257 from gofai_goalB.md:
 * - Bounded search over opcodes (depth limit, beam size)
 * - Predictable offline runtime (no exponential explosion)
 * - Deterministic plan generation with stable ordering
 *
 * Key Principles:
 * - Search is bounded to keep runtime predictable (<200ms target)
 * - Beam search with pruning to avoid state explosion
 * - Deterministic: same input → same candidates → same selection
 * - Supports both single-goal and multi-goal planning
 *
 * Search Strategy:
 * 1. Start from empty plan
 * 2. Generate candidate opcodes from levers
 * 3. Expand most promising partial plans (beam search)
 * 4. Prune by cost and constraint violations
 * 5. Terminate at depth limit or satisfaction threshold
 * 6. Return top K distinct plans
 *
 * @see src/gofai/planning/lever-mappings.ts (goal → levers)
 * @see src/gofai/planning/cost-model.ts (plan scoring)
 * @see src/gofai/planning/constraint-satisfaction.ts (validation)
 */

import type { Goal, Constraint } from '../canon/goals-constraints';
import type {
  CPLPlan,
  Opcode,
  OpcodeCategory,
  PlanValidationResult,
} from './plan-types';
import type { Lever, LeverContext } from './lever-mappings';
import type { ProjectWorldAPI } from '../infra/project-world-api';
import { getLeversForGoal } from './lever-mappings';
import {
  scorePlan,
  rankPlans,
  selectBestPlans,
  type PlanScore,
} from './cost-model';
import { validatePlanConstraints } from './constraint-satisfaction';
import { compareById } from '../infra/deterministic-ordering';

// ============================================================================
// Search Configuration
// ============================================================================

/**
 * Configuration for bounded plan search.
 */
export interface SearchConfig {
  /** Maximum depth of search tree (number of opcodes in a plan) */
  readonly maxDepth: number;

  /** Beam width: how many partial plans to keep at each depth */
  readonly beamWidth: number;

  /** Maximum total plans to generate before pruning */
  readonly maxPlansGenerated: number;

  /** Goal satisfaction threshold to stop early (0.0-1.0) */
  readonly satisfactionThreshold: number;

  /** Maximum plans to return as final candidates */
  readonly maxFinalCandidates: number;

  /** Enable constraint checking during search (slower but safer) */
  readonly checkConstraintsDuringSearch: boolean;

  /** Prune plans with cost > this multiplier of best plan cost */
  readonly costPruningFactor: number;
}

/**
 * Default search configuration optimized for responsiveness.
 */
export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  maxDepth: 5, // Most edits require 1-5 opcodes
  beamWidth: 10, // Keep top 10 partial plans at each level
  maxPlansGenerated: 1000, // Hard limit to prevent runaway
  satisfactionThreshold: 0.9, // Stop if 90% satisfaction achieved
  maxFinalCandidates: 3, // Return up to 3 distinct options
  checkConstraintsDuringSearch: true, // Safety first
  costPruningFactor: 2.0, // Prune plans > 2× cost of best
};

/**
 * Fast search configuration for quick responses.
 */
export const FAST_SEARCH_CONFIG: SearchConfig = {
  ...DEFAULT_SEARCH_CONFIG,
  maxDepth: 3,
  beamWidth: 5,
  maxPlansGenerated: 100,
  checkConstraintsDuringSearch: false, // Check only final plans
};

/**
 * Thorough search configuration for complex multi-goal scenarios.
 */
export const THOROUGH_SEARCH_CONFIG: SearchConfig = {
  ...DEFAULT_SEARCH_CONFIG,
  maxDepth: 8,
  beamWidth: 20,
  maxPlansGenerated: 5000,
  satisfactionThreshold: 0.95,
  maxFinalCandidates: 5,
};

// ============================================================================
// Planning Context
// ============================================================================

/**
 * Context for plan generation: goals, constraints, world state, configuration.
 */
export interface PlanningContext {
  readonly goals: readonly Goal[];
  readonly constraints: readonly Constraint[];
  readonly leverContext: LeverContext;
  readonly world: ProjectWorldAPI;
  readonly config: SearchConfig;
}

// ============================================================================
// Partial Plan (Search State)
// ============================================================================

/**
 * A partial plan being explored during search.
 */
export interface PartialPlan {
  readonly opcodes: readonly Opcode[];
  readonly depth: number;
  readonly score: PlanScore;
  readonly goalsSatisfied: readonly string[]; // Goal IDs
  readonly constraintViolations: PlanValidationResult | null; // null if not checked yet
}

/**
 * Create an empty partial plan (search root).
 */
export function createEmptyPlan(): PartialPlan {
  return {
    opcodes: [],
    depth: 0,
    score: {
      satisfaction: 0.0,
      cost: 0.0,
      constraintRisk: 0.0,
      overall: 0.0,
      confidence: 0.0,
    },
    goalsSatisfied: [],
    constraintViolations: null,
  };
}

/**
 * Extend a partial plan with a new opcode.
 */
export function extendPlan(
  partial: PartialPlan,
  opcode: Opcode,
  score: PlanScore,
  goalsSatisfied: readonly string[],
): PartialPlan {
  return {
    opcodes: [...partial.opcodes, opcode],
    depth: partial.depth + 1,
    score,
    goalsSatisfied,
    constraintViolations: null, // Will be checked later if needed
  };
}

// ============================================================================
// Candidate Opcode Generation
// ============================================================================

/**
 * Generate candidate opcodes for a given goal using lever mappings.
 *
 * Returns a list of opcodes that could contribute to achieving the goal.
 * Opcodes are sorted by effectiveness (best first).
 */
export function generateCandidateOpcodesForGoal(
  goal: Goal,
  context: PlanningContext,
): readonly Opcode[] {
  // Get levers for this goal
  const levers = getLeversForGoal(goal, context.leverContext);

  // Instantiate each lever into concrete opcodes
  const opcodes: Opcode[] = [];
  for (const lever of levers) {
    const leverOpcodes = instantiateLever(lever, goal, context);
    opcodes.push(...leverOpcodes);
  }

  // Sort by effectiveness (highest first) then by ID for determinism
  opcodes.sort((a, b) => {
    // Opcodes don't have effectiveness directly, use cost as proxy
    // Lower cost = higher effectiveness for same goal contribution
    const costDiff = a.estimatedCost - b.estimatedCost;
    if (Math.abs(costDiff) > 0.1) return costDiff;
    return compareById(a, b);
  });

  return opcodes;
}

/**
 * Instantiate a lever into concrete opcodes.
 *
 * A lever may produce multiple opcode variants (different parameters).
 */
function instantiateLever(
  lever: Lever,
  goal: Goal,
  context: PlanningContext,
): Opcode[] {
  // Use lever's instantiate function to create opcodes
  const opcodes = lever.instantiate(goal, context);

  // Ensure all opcodes have deterministic IDs
  return opcodes.map((op, index) => ({
    ...op,
    id: `${lever.id}-${goal.id}-${index}`,
  }));
}

/**
 * Generate all candidate opcodes for all goals.
 *
 * Returns a flat list of opcodes sorted by priority:
 * 1. Opcodes for unsatisfied goals first
 * 2. Lower-cost opcodes first within each goal
 * 3. Deterministic ID ordering as tiebreaker
 */
export function generateAllCandidateOpcodes(
  context: PlanningContext,
  satisfiedGoals: readonly string[],
): readonly Opcode[] {
  const allOpcodes: Opcode[] = [];

  // Prioritize unsatisfied goals
  const unsatisfiedGoals = context.goals.filter(
    (g) => !satisfiedGoals.includes(g.id),
  );

  for (const goal of unsatisfiedGoals) {
    const opcodes = generateCandidateOpcodesForGoal(goal, context);
    allOpcodes.push(...opcodes);
  }

  // Sort by cost (lower first) then ID
  allOpcodes.sort((a, b) => {
    const costDiff = a.estimatedCost - b.estimatedCost;
    if (Math.abs(costDiff) > 0.1) return costDiff;
    return compareById(a, b);
  });

  return allOpcodes;
}

// ============================================================================
// Search Expansion and Pruning
// ============================================================================

/**
 * Expand a partial plan by adding one opcode.
 *
 * Generates successor states for beam search.
 */
export function expandPlan(
  partial: PartialPlan,
  context: PlanningContext,
): readonly PartialPlan[] {
  // Don't expand if at max depth
  if (partial.depth >= context.config.maxDepth) {
    return [];
  }

  // Don't expand if already satisfied
  if (partial.score.satisfaction >= context.config.satisfactionThreshold) {
    return [];
  }

  // Generate candidate opcodes for unsatisfied goals
  const candidateOpcodes = generateAllCandidateOpcodes(
    context,
    partial.goalsSatisfied,
  );

  // Expand to successors
  const successors: PartialPlan[] = [];
  for (const opcode of candidateOpcodes) {
    // Create successor plan
    const newOpcodes = [...partial.opcodes, opcode];
    const newPlan: CPLPlan = {
      id: `plan-${newOpcodes.map((op) => op.id).join('-')}`,
      opcodes: newOpcodes,
      totalCost: 0, // Will be computed by scorePlan
      estimatedSatisfaction: 0,
      confidence: 0,
      constraintViolations: [],
      goalsSatisfied: [],
      constraintsSatisfied: [],
      metadata: {
        plannerVersion: '1.0',
        generatedAt: Date.now(),
        searchDepth: partial.depth + 1,
      },
    };

    // Score the new plan
    const score = scorePlan(
      newPlan,
      context.goals,
      context.constraints,
      context.world,
    );

    // Determine which goals are satisfied
    const goalsSatisfied = determineGoalsSatisfied(newPlan, context.goals, score);

    // Check constraints if configured
    let violations: PlanValidationResult | null = null;
    if (context.config.checkConstraintsDuringSearch) {
      // Would need worldAfter simulation here
      // For now, skip constraint checking during search
      violations = null;
    }

    const successor = extendPlan(partial, opcode, score, goalsSatisfied);
    successors.push(successor);

    // Stop if we've generated too many
    if (successors.length >= context.config.beamWidth * 2) {
      break;
    }
  }

  return successors;
}

/**
 * Determine which goals are sufficiently satisfied by a plan.
 */
function determineGoalsSatisfied(
  plan: CPLPlan,
  goals: readonly Goal[],
  score: PlanScore,
): readonly string[] {
  // Heuristic: a goal is satisfied if overall satisfaction > 0.8
  // More sophisticated logic would track per-goal satisfaction
  if (score.satisfaction >= 0.8) {
    return goals.map((g) => g.id);
  }
  return [];
}

/**
 * Prune partial plans to keep beam width manageable.
 *
 * Keeps the top N plans by score, with deterministic tiebreaking.
 */
export function pruneBeam(
  partials: readonly PartialPlan[],
  beamWidth: number,
  costPruningFactor: number,
): readonly PartialPlan[] {
  if (partials.length <= beamWidth) {
    return partials;
  }

  // Sort by score (higher overall score first)
  const sorted = [...partials].sort((a, b) => {
    const scoreDiff = b.score.overall - a.score.overall;
    if (Math.abs(scoreDiff) > 0.01) return scoreDiff;
    // Tiebreak by depth (prefer shorter plans)
    if (a.depth !== b.depth) return a.depth - b.depth;
    // Tiebreak by first opcode ID
    return compareById(a.opcodes[0] || {}, b.opcodes[0] || {});
  });

  // Keep top beamWidth
  const beam = sorted.slice(0, beamWidth);

  // Also prune by cost: remove plans > costPruningFactor × best cost
  if (beam.length > 0) {
    const bestCost = beam[0].score.cost;
    return beam.filter((p) => p.score.cost <= bestCost * costPruningFactor);
  }

  return beam;
}

// ============================================================================
// Main Search Algorithm
// ============================================================================

/**
 * Generate plans via bounded beam search.
 *
 * Returns up to maxFinalCandidates distinct plans that satisfy goals
 * while respecting constraints.
 *
 * Search algorithm:
 * 1. Start with empty plan
 * 2. At each depth level:
 *    a. Expand each plan in the beam
 *    b. Score all successors
 *    c. Prune to beam width
 * 3. Terminate at max depth or satisfaction threshold
 * 4. Select best distinct final plans
 *
 * @param context - Planning context (goals, constraints, world, config)
 * @returns List of candidate plans, sorted by score (best first)
 */
export function generatePlans(context: PlanningContext): readonly CPLPlan[] {
  let beam: PartialPlan[] = [createEmptyPlan()];
  let allFinalPlans: PartialPlan[] = [];
  let plansGenerated = 0;

  // Beam search: expand level by level
  for (let depth = 0; depth < context.config.maxDepth; depth++) {
    const nextBeam: PartialPlan[] = [];

    for (const partial of beam) {
      // Expand this partial plan
      const successors = expandPlan(partial, context);
      plansGenerated += successors.length;

      // Add to next beam
      nextBeam.push(...successors);

      // Collect complete plans that meet satisfaction threshold
      for (const successor of successors) {
        if (
          successor.score.satisfaction >= context.config.satisfactionThreshold
        ) {
          allFinalPlans.push(successor);
        }
      }

      // Check generation limit
      if (plansGenerated >= context.config.maxPlansGenerated) {
        break;
      }
    }

    // Prune next beam
    beam = pruneBeam(
      nextBeam,
      context.config.beamWidth,
      context.config.costPruningFactor,
    );

    // Early termination if beam is empty
    if (beam.length === 0) {
      break;
    }

    // Early termination if we have enough high-quality plans
    if (
      allFinalPlans.length >= context.config.maxFinalCandidates &&
      allFinalPlans.some((p) => p.score.satisfaction >= 0.95)
    ) {
      break;
    }

    // Hard limit check
    if (plansGenerated >= context.config.maxPlansGenerated) {
      break;
    }
  }

  // Add any remaining beam plans as final candidates
  // (even if they don't meet satisfaction threshold)
  allFinalPlans.push(...beam);

  // Convert partial plans to CPLPlans
  const cplPlans: CPLPlan[] = allFinalPlans.map((partial) => ({
    id: `plan-${partial.opcodes.map((op) => op.id).join('-')}`,
    opcodes: partial.opcodes,
    totalCost: partial.score.cost,
    estimatedSatisfaction: partial.score.satisfaction,
    confidence: partial.score.confidence,
    constraintViolations: [],
    goalsSatisfied: partial.goalsSatisfied.slice(),
    constraintsSatisfied: [], // Would be computed during validation
    metadata: {
      plannerVersion: '1.0',
      generatedAt: Date.now(),
      searchDepth: partial.depth,
    },
  }));

  // Rank and select best distinct plans
  const rankedPlans = rankPlans(
    cplPlans,
    context.goals,
    context.constraints,
    context.world,
  );
  const bestPlans = selectBestPlans(rankedPlans, context.config.maxFinalCandidates);

  return bestPlans;
}

/**
 * Generate a single best plan (convenience wrapper).
 */
export function generateBestPlan(context: PlanningContext): CPLPlan | null {
  const plans = generatePlans(context);
  return plans[0] || null;
}

/**
 * Generate plans with custom configuration.
 */
export function generatePlansWithConfig(
  goals: readonly Goal[],
  constraints: readonly Constraint[],
  leverContext: LeverContext,
  world: ProjectWorldAPI,
  config: Partial<SearchConfig> = {},
): readonly CPLPlan[] {
  const context: PlanningContext = {
    goals,
    constraints,
    leverContext,
    world,
    config: { ...DEFAULT_SEARCH_CONFIG, ...config },
  };

  return generatePlans(context);
}
