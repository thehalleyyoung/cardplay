/**
 * Plan Scoring Model and Cost Calculation
 * 
 * Implements Steps 254-255 from gofai_goalB.md:
 * - Define plan scoring model (goal satisfaction + edit cost + constraint risk)
 * - Define cost hierarchy aligned with user expectations
 * 
 * This module implements the "least-change" planning principle: when multiple
 * plans can satisfy the same goals, prefer the one with lower cost. Cost
 * reflects both the magnitude of the edit and its musical/creative impact.
 * 
 * @module gofai/planning/cost-model
 */

import type { CPLGoal, CPLConstraint } from '../canon/cpl-types';
import type { Opcode, OpcodeCategory, OpcodeRisk, CPLPlan } from './plan-types';

/**
 * Cost factors for plan scoring
 */
export interface CostFactors {
  /** Base opcode cost */
  readonly baseCost: number;
  
  /** Scope size factor (larger scope = higher cost) */
  readonly scopeSizeFactor: number;
  
  /** Destructiveness factor (destructive = higher cost) */
  readonly destructivenessFactor: number;
  
  /** Risk factor (high risk = higher cost) */
  readonly riskFactor: number;
  
  /** Complexity factor (complex ops = higher cost) */
  readonly complexityFactor: number;
}

/**
 * Default cost weights for different opcode categories
 * Reflects user expectations about what's "expensive" to change
 */
export const CATEGORY_BASE_COSTS: Record<OpcodeCategory, number> = {
  // Structure changes are moderate cost - they change form but preserve content
  structure: 3.0,
  
  // Melody changes are expensive - melody is often the most salient element
  melody: 5.0,
  
  // Harmony changes are moderate-high - important but more flexible than melody
  harmony: 4.0,
  
  // Event-level edits are low-moderate - local changes, easily undone
  event: 2.0,
  
  // Rhythm edits are moderate - affect groove but content remains
  rhythm: 3.0,
  
  // Texture changes are low - adjusting density/layers is common
  texture: 2.5,
  
  // Production changes are very low - DSP params are expected to be tweaked
  production: 1.0,
  
  // Routing changes are low-moderate - card graph edits are tools changes
  routing: 2.0,
  
  // Metadata changes are nearly free - labels don't affect content
  metadata: 0.5,
};

/**
 * Risk multipliers (higher risk = higher cost)
 */
export const RISK_COST_MULTIPLIERS: Record<OpcodeRisk, number> = {
  safe: 1.0,
  low: 1.2,
  moderate: 1.5,
  high: 2.0,
  critical: 3.0,
};

/**
 * Destructiveness multiplier
 */
export const DESTRUCTIVE_COST_MULTIPLIER = 1.8;

/**
 * Calculate cost for a single opcode
 */
export function calculateOpcodeCost(opcode: Opcode, scopeSize: number = 1.0): number {
  const baseCost = CATEGORY_BASE_COSTS[opcode.category];
  const riskMultiplier = RISK_COST_MULTIPLIERS[opcode.risk];
  const destructiveMultiplier = opcode.destructive ? DESTRUCTIVE_COST_MULTIPLIER : 1.0;
  const scopeMultiplier = 1.0 + Math.log(scopeSize + 1) * 0.3; // Logarithmic scaling
  
  return baseCost * riskMultiplier * destructiveMultiplier * scopeMultiplier;
}

/**
 * Calculate total cost for a sequence of opcodes
 */
export function calculatePlanCost(opcodes: readonly Opcode[], scopeSize: number = 1.0): number {
  return opcodes.reduce((total, opcode) => {
    return total + calculateOpcodeCost(opcode, scopeSize);
  }, 0);
}

/**
 * Goal satisfaction score (0.0 - 1.0)
 * Measures how well the plan satisfies the user's goals
 */
export interface GoalSatisfaction {
  readonly goalId: string;
  readonly targetAxis: string;
  readonly targetAmount: number;
  readonly achievedAmount: number;
  readonly satisfactionScore: number; // 0.0 - 1.0
}

/**
 * Calculate satisfaction score for a goal
 * 
 * @param goal The goal to satisfy
 * @param achievedAmount Estimated achievement (0.0 - 1.0 scale)
 * @returns Satisfaction score (0.0 = not satisfied, 1.0 = fully satisfied)
 */
export function calculateGoalSatisfaction(
  goal: CPLGoal,
  achievedAmount: number
): GoalSatisfaction {
  // Extract target information from goal
  // For now, simplified - in real implementation, this would analyze the goal structure
  const targetAmount = 1.0; // Would extract from goal
  const targetAxis = 'unknown'; // Would extract from goal
  
  // Calculate satisfaction: how close did we get to the target?
  const ratio = Math.min(achievedAmount / targetAmount, 1.0);
  
  // Apply satisfaction curve (diminishing returns)
  const satisfactionScore = Math.pow(ratio, 0.8);
  
  return {
    goalId: goal.type, // Would use actual goal ID
    targetAxis,
    targetAmount,
    achievedAmount,
    satisfactionScore,
  };
}

/**
 * Calculate overall satisfaction score for a plan
 * 
 * @param plan The plan to evaluate
 * @param goals Goals to satisfy
 * @returns Overall satisfaction score (0.0 - 1.0), average of all goal satisfactions
 */
export function calculatePlanSatisfaction(
  plan: CPLPlan,
  goals: readonly CPLGoal[]
): number {
  if (goals.length === 0) return 1.0;
  
  // For each goal, estimate how well the plan satisfies it
  // This is a simplified version - real implementation would simulate plan execution
  const satisfactions = goals.map(goal => {
    // Find opcodes that contribute to this goal
    const relevantOpcodes = plan.opcodes.filter(opcode => {
      // Check if opcode satisfies this goal (simplified)
      return opcode.satisfiesGoals?.includes(goal.type) ?? false;
    });
    
    // Estimate achieved amount based on opcode effectiveness
    const achievedAmount = Math.min(
      relevantOpcodes.reduce((sum, opcode) => sum + 0.3, 0), // Simplified
      1.0
    );
    
    return calculateGoalSatisfaction(goal, achievedAmount);
  });
  
  // Return average satisfaction
  return satisfactions.reduce((sum, s) => sum + s.satisfactionScore, 0) / satisfactions.length;
}

/**
 * Constraint risk assessment
 * Estimates probability of violating constraints
 */
export interface ConstraintRisk {
  readonly constraintId: string;
  readonly riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  readonly riskScore: number; // 0.0 - 1.0
  readonly reason: string;
}

/**
 * Assess constraint violation risk for a plan
 * 
 * @param plan The plan to assess
 * @param constraints Constraints to respect
 * @returns Risk assessment for each constraint
 */
export function assessConstraintRisk(
  plan: CPLPlan,
  constraints: readonly CPLConstraint[]
): readonly ConstraintRisk[] {
  return constraints.map(constraint => {
    // Check if any opcode might violate this constraint
    const riskyOpcodes = plan.opcodes.filter(opcode => {
      // Simplified: check if opcode category conflicts with constraint type
      if (constraint.type === 'preserve-constraint') {
        // Melody/harmony opcodes risk violating preserve constraints
        return opcode.category === 'melody' || opcode.category === 'harmony';
      }
      if (constraint.type === 'only-change-constraint') {
        // Any opcode outside the allowed scope is risky
        return true; // Would check scope overlap in real implementation
      }
      return false;
    });
    
    const riskScore = Math.min(riskyOpcodes.length * 0.2, 1.0);
    
    let riskLevel: ConstraintRisk['riskLevel'];
    if (riskScore === 0) riskLevel = 'none';
    else if (riskScore < 0.3) riskLevel = 'low';
    else if (riskScore < 0.6) riskLevel = 'medium';
    else if (riskScore < 0.9) riskLevel = 'high';
    else riskLevel = 'critical';
    
    return {
      constraintId: constraint.type,
      riskLevel,
      riskScore,
      reason: `${riskyOpcodes.length} potentially conflicting opcodes`,
    };
  });
}

/**
 * Overall plan score combining satisfaction, cost, and constraint risk
 * Higher score = better plan
 */
export interface PlanScore {
  readonly satisfactionScore: number;      // 0.0 - 1.0 (higher is better)
  readonly cost: number;                   // Absolute cost (lower is better)
  readonly normalizedCost: number;         // 0.0 - 1.0 (lower is better)
  readonly constraintRisk: number;         // 0.0 - 1.0 (lower is better)
  readonly softConstraintPenalty: number;  // 0.0 - 1.0 (lower is better)
  readonly overallScore: number;           // Weighted combination (higher is better)
  readonly confidence: number;             // 0.0 - 1.0 (higher is better)
}

/**
 * Scoring weights for plan comparison
 */
export interface ScoringWeights {
  readonly satisfactionWeight: number;
  readonly costWeight: number;
  readonly constraintRiskWeight: number;
  readonly softConstraintPenaltyWeight: number;
}

/**
 * Default scoring weights
 * - Satisfaction is most important (must achieve the goal)
 * - Constraint risk is critical (violations are unacceptable)
 * - Soft constraint penalties influence but don't block
 * - Cost is secondary (prefer simpler edits when satisfaction is equal)
 */
export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  satisfactionWeight: 1.0,
  constraintRiskWeight: 0.9,
  softConstraintPenaltyWeight: 0.7,
  costWeight: 0.5,
};

/**
 * Score a plan
 * 
 * @param plan The plan to score
 * @param goals Goals to satisfy
 * @param constraints Constraints to respect
 * @param weights Scoring weights (optional, uses defaults)
 * @returns Complete plan score
 */
export function scorePlan(
  plan: CPLPlan,
  goals: readonly CPLGoal[],
  constraints: readonly CPLConstraint[],
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): PlanScore {
  // Calculate satisfaction
  const satisfactionScore = calculatePlanSatisfaction(plan, goals);
  
  // Calculate cost
  const cost = calculatePlanCost(plan.opcodes);
  
  // Normalize cost (assuming max reasonable cost is 50)
  const normalizedCost = Math.min(cost / 50.0, 1.0);
  
  // Calculate constraint risk
  const risks = assessConstraintRisk(plan, constraints);
  const constraintRisk = risks.length > 0
    ? Math.max(...risks.map(r => r.riskScore))
    : 0.0;
  
  // Calculate overall score (weighted combination)
  // Note: cost is inverted (1 - normalizedCost) because lower cost is better
  const overallScore =
    satisfactionScore * weights.satisfactionWeight +
    (1.0 - normalizedCost) * weights.costWeight +
    (1.0 - constraintRisk) * weights.constraintRiskWeight;
  
  // Normalize to 0-1 range
  const maxPossibleScore =
    weights.satisfactionWeight +
    weights.costWeight +
    weights.constraintRiskWeight;
  const normalizedOverallScore = overallScore / maxPossibleScore;
  
  // Calculate confidence
  // High confidence if:
  // - High satisfaction (> 0.8)
  // - Low cost (normalized < 0.4)
  // - Low constraint risk (< 0.2)
  const confidence = Math.min(
    satisfactionScore,
    1.0 - normalizedCost * 0.5,
    1.0 - constraintRisk
  );
  
  return {
    satisfactionScore,
    cost,
    normalizedCost,
    constraintRisk,
    overallScore: normalizedOverallScore,
    confidence,
  };
}

/**
 * Compare two plans and return the better one
 * 
 * @param plan1 First plan
 * @param plan2 Second plan
 * @param goals Goals to satisfy
 * @param constraints Constraints to respect
 * @returns The better plan (or null if tied)
 */
export function comparePlans(
  plan1: CPLPlan,
  plan2: CPLPlan,
  goals: readonly CPLGoal[],
  constraints: readonly CPLConstraint[]
): CPLPlan | null {
  const score1 = scorePlan(plan1, goals, constraints);
  const score2 = scorePlan(plan2, goals, constraints);
  
  // If scores are very close (within 5%), consider them tied
  const scoreDifference = Math.abs(score1.overallScore - score2.overallScore);
  if (scoreDifference < 0.05) {
    return null; // Tied - present both as options
  }
  
  return score1.overallScore > score2.overallScore ? plan1 : plan2;
}

/**
 * Sort plans by score (best first)
 * 
 * @param plans Plans to sort
 * @param goals Goals to satisfy
 * @param constraints Constraints to respect
 * @returns Plans sorted by score (descending)
 */
export function rankPlans(
  plans: readonly CPLPlan[],
  goals: readonly CPLGoal[],
  constraints: readonly CPLConstraint[]
): Array<{ plan: CPLPlan; score: PlanScore }> {
  const scored = plans.map(plan => ({
    plan,
    score: scorePlan(plan, goals, constraints),
  }));
  
  // Sort by overall score (descending)
  scored.sort((a, b) => b.score.overallScore - a.score.overallScore);
  
  return scored;
}

/**
 * Deterministic tie-breaker for equal scores
 * Uses plan ID as stable secondary criterion
 */
export function tieBreakPlans(
  plans: readonly CPLPlan[],
  goals: readonly CPLGoal[],
  constraints: readonly CPLConstraint[]
): CPLPlan {
  if (plans.length === 0) {
    throw new Error('Cannot tie-break empty plan list');
  }
  if (plans.length === 1) {
    return plans[0];
  }
  
  // Rank plans
  const ranked = rankPlans(plans, goals, constraints);
  
  // Get best score
  const bestScore = ranked[0].score.overallScore;
  
  // Find all plans with best score (within 1% tolerance)
  const bestPlans = ranked
    .filter(({ score }) => Math.abs(score.overallScore - bestScore) < 0.01)
    .map(({ plan }) => plan);
  
  if (bestPlans.length === 1) {
    return bestPlans[0];
  }
  
  // Tie-break by ID (stable, deterministic)
  bestPlans.sort((a, b) => a.id.localeCompare(b.id));
  return bestPlans[0];
}

/**
 * Check if plans are significantly different
 * Used to decide whether to present multiple options
 */
export function arePlansSignificantlyDifferent(
  plan1: CPLPlan,
  plan2: CPLPlan,
  threshold: number = 0.3
): boolean {
  // Plans are significantly different if:
  // 1. Different number of opcodes
  if (Math.abs(plan1.opcodes.length - plan2.opcodes.length) > 2) {
    return true;
  }
  
  // 2. Different opcode categories (> 30% different)
  const categories1 = new Set(plan1.opcodes.map(o => o.category));
  const categories2 = new Set(plan2.opcodes.map(o => o.category));
  const unionSize = new Set([...categories1, ...categories2]).size;
  const intersectionSize = new Set(
    [...categories1].filter(c => categories2.has(c))
  ).size;
  const similarity = intersectionSize / unionSize;
  
  if (similarity < (1.0 - threshold)) {
    return true;
  }
  
  // 3. Different cost (> 30% different)
  const costDiff = Math.abs(plan1.totalCost - plan2.totalCost);
  const avgCost = (plan1.totalCost + plan2.totalCost) / 2;
  if (avgCost > 0 && costDiff / avgCost > threshold) {
    return true;
  }
  
  return false;
}

/**
 * Select best plan(s) from candidates
 * Returns single plan if clear winner, multiple if ambiguous
 */
export function selectBestPlans(
  plans: readonly CPLPlan[],
  goals: readonly CPLGoal[],
  constraints: readonly CPLConstraint[],
  maxOptions: number = 3
): readonly CPLPlan[] {
  if (plans.length === 0) {
    return [];
  }
  if (plans.length === 1) {
    return plans;
  }
  
  // Rank all plans
  const ranked = rankPlans(plans, goals, constraints);
  
  // Get best score
  const bestScore = ranked[0].score.overallScore;
  
  // Find all plans close to best (within 10%)
  const topPlans = ranked
    .filter(({ score }) => score.overallScore >= bestScore * 0.9)
    .map(({ plan }) => plan);
  
  if (topPlans.length === 1) {
    return topPlans;
  }
  
  // Filter to significantly different plans
  const distinctPlans: CPLPlan[] = [topPlans[0]];
  for (let i = 1; i < topPlans.length && distinctPlans.length < maxOptions; i++) {
    const candidate = topPlans[i];
    const isDistinct = distinctPlans.every(existing =>
      arePlansSignificantlyDifferent(candidate, existing)
    );
    if (isDistinct) {
      distinctPlans.push(candidate);
    }
  }
  
  return distinctPlans;
}

// =============================================================================
// Step 254 Enhancement: Comprehensive Deterministic Tie-Breaking
// =============================================================================

/**
 * Detailed tie-breaking criteria applied in order of precedence
 */
export interface TieBreakingCriteria {
  readonly name: string;
  readonly evaluate: (plan: CPLPlan) => number;
  readonly higherIsBetter: boolean;
}

/**
 * Standard tie-breaking criteria in precedence order
 * 
 * When plans have equal scores, these criteria are applied sequentially
 * until a winner is found. All criteria must be deterministic and stable.
 */
export const STANDARD_TIE_BREAKING_CRITERIA: readonly TieBreakingCriteria[] = [
  // 1. Constraint risk (lower is better)
  {
    name: 'constraint_risk',
    evaluate: (plan) => {
      const risks = plan.opcodes.map(op => RISK_COST_MULTIPLIERS[op.risk]);
      return risks.reduce((sum, r) => sum + r, 0) / risks.length;
    },
    higherIsBetter: false,
  },
  
  // 2. Number of destructive operations (fewer is better)
  {
    name: 'destructive_count',
    evaluate: (plan) => plan.opcodes.filter(op => op.destructive).length,
    higherIsBetter: false,
  },
  
  // 3. Scope size (smaller scope is better for locality)
  {
    name: 'scope_size',
    evaluate: (plan) => {
      // Estimate scope size (would use actual scope analysis in full implementation)
      return plan.opcodes.length * 10; // Simplified
    },
    higherIsBetter: false,
  },
  
  // 4. Number of opcodes (fewer is better for simplicity)
  {
    name: 'opcode_count',
    evaluate: (plan) => plan.opcodes.length,
    higherIsBetter: false,
  },
  
  // 5. Category diversity (lower is better for focus)
  {
    name: 'category_diversity',
    evaluate: (plan) => {
      const categories = new Set(plan.opcodes.map(op => op.category));
      return categories.size;
    },
    higherIsBetter: false,
  },
  
  // 6. Maximum individual opcode cost (lower is better)
  {
    name: 'max_opcode_cost',
    evaluate: (plan) => {
      const costs = plan.opcodes.map(op => CATEGORY_BASE_COSTS[op.category]);
      return Math.max(...costs, 0);
    },
    higherIsBetter: false,
  },
  
  // 7. Plan ID (lexicographic, for absolute stability)
  {
    name: 'plan_id',
    evaluate: (plan) => {
      // Convert ID to numeric hash for comparison
      let hash = 0;
      for (let i = 0; i < plan.id.length; i++) {
        hash = ((hash << 5) - hash) + plan.id.charCodeAt(i);
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash;
    },
    higherIsBetter: false,
  },
];

/**
 * Apply deterministic tie-breaking to a set of plans
 * 
 * Uses a cascade of criteria to ensure a single winner is always selected
 * in a deterministic and stable manner.
 * 
 * @param plans Plans to tie-break (should already be sorted by primary score)
 * @param criteria Tie-breaking criteria (uses standard if not provided)
 * @returns The winning plan
 */
export function deterministicTieBreak(
  plans: readonly CPLPlan[],
  criteria: readonly TieBreakingCriteria[] = STANDARD_TIE_BREAKING_CRITERIA
): CPLPlan {
  if (plans.length === 0) {
    throw new Error('Cannot tie-break empty plan list');
  }
  if (plans.length === 1) {
    return plans[0];
  }
  
  let candidates = [...plans];
  
  // Apply each criterion in order until we have a single winner
  for (const criterion of criteria) {
    if (candidates.length === 1) {
      break;
    }
    
    // Evaluate all candidates on this criterion
    const scores = candidates.map(plan => ({
      plan,
      score: criterion.evaluate(plan),
    }));
    
    // Find best score
    const bestScore = criterion.higherIsBetter
      ? Math.max(...scores.map(s => s.score))
      : Math.min(...scores.map(s => s.score));
    
    // Filter to plans matching best score (with tiny tolerance for floating point)
    const epsilon = 1e-9;
    candidates = scores
      .filter(({ score }) => Math.abs(score - bestScore) < epsilon)
      .map(({ plan }) => plan);
  }
  
  // Should have a single winner by now, but if not, take first (deterministic by construction)
  return candidates[0];
}

/**
 * Enhanced plan ranking with full tie-breaking
 * 
 * Returns plans in deterministic order with primary scores and tie-break metadata
 * 
 * @param plans Plans to rank
 * @param goals Goals to satisfy
 * @param constraints Constraints to respect
 * @returns Ranked plans with scoring details
 */
export interface RankedPlan {
  readonly plan: CPLPlan;
  readonly score: PlanScore;
  readonly rank: number;
  readonly tieBreakLevel: number; // Which criterion was used (0 = no tie-break needed)
  readonly tieBreakCriterion?: string;
}

export function rankPlansWithTieBreaking(
  plans: readonly CPLPlan[],
  goals: readonly CPLGoal[],
  constraints: readonly CPLConstraint[],
  criteria: readonly TieBreakingCriteria[] = STANDARD_TIE_BREAKING_CRITERIA
): readonly RankedPlan[] {
  if (plans.length === 0) {
    return [];
  }
  
  // Score all plans
  const scored = plans.map(plan => ({
    plan,
    score: scorePlan(plan, goals, constraints),
  }));
  
  // Group by primary score (within tolerance)
  const scoreGroups: Array<typeof scored> = [];
  const sortedScores = [...scored].sort((a, b) => b.score.overallScore - a.score.overallScore);
  
  let currentGroup: typeof scored = [];
  let currentScore = sortedScores[0]?.score.overallScore ?? 0;
  const scoreTolerance = 0.001; // Very tight tolerance for primary score
  
  for (const item of sortedScores) {
    if (Math.abs(item.score.overallScore - currentScore) < scoreTolerance) {
      currentGroup.push(item);
    } else {
      if (currentGroup.length > 0) {
        scoreGroups.push(currentGroup);
      }
      currentGroup = [item];
      currentScore = item.score.overallScore;
    }
  }
  if (currentGroup.length > 0) {
    scoreGroups.push(currentGroup);
  }
  
  // Apply tie-breaking within each group
  const rankedResults: RankedPlan[] = [];
  let currentRank = 1;
  
  for (const group of scoreGroups) {
    if (group.length === 1) {
      // No tie to break
      rankedResults.push({
        plan: group[0].plan,
        score: group[0].score,
        rank: currentRank,
        tieBreakLevel: 0,
      });
      currentRank++;
    } else {
      // Apply tie-breaking
      const groupPlans = group.map(g => g.plan);
      const tieBreakResult = applyTieBreakingWithMetadata(groupPlans, criteria);
      
      for (let i = 0; i < tieBreakResult.length; i++) {
        const item = tieBreakResult[i];
        const originalScore = group.find(g => g.plan.id === item.plan.id)!.score;
        
        rankedResults.push({
          plan: item.plan,
          score: originalScore,
          rank: currentRank + i,
          tieBreakLevel: item.tieBreakLevel,
          tieBreakCriterion: item.criterionUsed,
        });
      }
      currentRank += tieBreakResult.length;
    }
  }
  
  return rankedResults;
}

/**
 * Apply tie-breaking and return metadata about which criteria were used
 */
interface TieBreakResult {
  readonly plan: CPLPlan;
  readonly tieBreakLevel: number;
  readonly criterionUsed?: string;
}

function applyTieBreakingWithMetadata(
  plans: readonly CPLPlan[],
  criteria: readonly TieBreakingCriteria[]
): readonly TieBreakResult[] {
  if (plans.length <= 1) {
    return plans.map(plan => ({
      plan,
      tieBreakLevel: 0,
    }));
  }
  
  let candidates = [...plans];
  const results: TieBreakResult[] = [];
  let criterionLevel = 0;
  
  for (const criterion of criteria) {
    criterionLevel++;
    
    if (candidates.length === 1) {
      // Last remaining candidate wins at this level
      results.push({
        plan: candidates[0],
        tieBreakLevel: criterionLevel,
        criterionUsed: criterion.name,
      });
      candidates = [];
      break;
    }
    
    // Evaluate and sort by this criterion
    const scored = candidates.map(plan => ({
      plan,
      score: criterion.evaluate(plan),
    }));
    
    scored.sort((a, b) => {
      const diff = criterion.higherIsBetter
        ? b.score - a.score
        : a.score - b.score;
      return diff;
    });
    
    // Find best score and separate winners from losers
    const bestScore = scored[0].score;
    const epsilon = 1e-9;
    
    const winners: CPLPlan[] = [];
    const stillTied: CPLPlan[] = [];
    
    for (const item of scored) {
      if (Math.abs(item.score - bestScore) < epsilon) {
        stillTied.push(item.plan);
      } else {
        // This plan lost at this criterion level
        results.push({
          plan: item.plan,
          tieBreakLevel: criterionLevel,
          criterionUsed: criterion.name,
        });
      }
    }
    
    candidates = stillTied;
  }
  
  // Any remaining candidates are still tied after all criteria
  // Order them by plan ID (last resort)
  if (candidates.length > 0) {
    candidates.sort((a, b) => a.id.localeCompare(b.id));
    for (const plan of candidates) {
      results.push({
        plan,
        tieBreakLevel: criteria.length + 1,
        criterionUsed: 'plan_id',
      });
    }
  }
  
  // Sort results by rank (winners first)
  results.sort((a, b) => a.tieBreakLevel - b.tieBreakLevel);
  
  return results;
}

/**
 * Explain why one plan was chosen over another
 * 
 * Provides human-readable explanation of scoring and tie-breaking decisions
 */
export interface PlanComparisonExplanation {
  readonly winner: CPLPlan;
  readonly loser: CPLPlan;
  readonly primaryScoreDifference: number;
  readonly tieBreakCriterion?: string;
  readonly explanation: string;
}

export function explainPlanChoice(
  winner: CPLPlan,
  loser: CPLPlan,
  goals: readonly CPLGoal[],
  constraints: readonly CPLConstraint[],
  criteria: readonly TieBreakingCriteria[] = STANDARD_TIE_BREAKING_CRITERIA
): PlanComparisonExplanation {
  const winnerScore = scorePlan(winner, goals, constraints);
  const loserScore = scorePlan(loser, goals, constraints);
  
  const scoreDiff = winnerScore.overallScore - loserScore.overallScore;
  
  let explanation: string;
  let tieBreakCriterion: string | undefined;
  
  if (Math.abs(scoreDiff) > 0.01) {
    // Winner by primary score
    explanation = `Plan ${winner.id} has a higher overall score (${winnerScore.overallScore.toFixed(3)}) than Plan ${loser.id} (${loserScore.overallScore.toFixed(3)}). `;
    
    // Add details about what made it better
    const satisfactionDiff = winnerScore.satisfactionScore - loserScore.satisfactionScore;
    const costDiff = winnerScore.normalizedCost - loserScore.normalizedCost;
    const riskDiff = winnerScore.constraintRisk - loserScore.constraintRisk;
    
    const factors: string[] = [];
    if (Math.abs(satisfactionDiff) > 0.05) {
      factors.push(`${satisfactionDiff > 0 ? 'better' : 'worse'} goal satisfaction`);
    }
    if (Math.abs(costDiff) > 0.05) {
      factors.push(`${costDiff < 0 ? 'lower' : 'higher'} cost`);
    }
    if (Math.abs(riskDiff) > 0.05) {
      factors.push(`${riskDiff < 0 ? 'lower' : 'higher'} constraint risk`);
    }
    
    if (factors.length > 0) {
      explanation += `This is due to: ${factors.join(', ')}.`;
    }
  } else {
    // Tie-broken by secondary criteria
    explanation = `Plans have nearly equal scores (difference: ${Math.abs(scoreDiff).toFixed(4)}). `;
    
    // Find which criterion broke the tie
    for (const criterion of criteria) {
      const winnerValue = criterion.evaluate(winner);
      const loserValue = criterion.evaluate(loser);
      const diff = Math.abs(winnerValue - loserValue);
      
      if (diff > 1e-9) {
        tieBreakCriterion = criterion.name;
        const betterOrWorse = criterion.higherIsBetter
          ? (winnerValue > loserValue ? 'better' : 'worse')
          : (winnerValue < loserValue ? 'better' : 'worse');
        
        explanation += `Tie broken by ${criterion.name.replace(/_/g, ' ')}: Plan ${winner.id} has ${betterOrWorse} value (${winnerValue.toFixed(2)} vs ${loserValue.toFixed(2)}).`;
        break;
      }
    }
    
    if (!tieBreakCriterion) {
      tieBreakCriterion = 'plan_id';
      explanation += `Tie broken by plan ID for deterministic ordering.`;
    }
  }
  
  return {
    winner,
    loser,
    primaryScoreDifference: scoreDiff,
    tieBreakCriterion,
    explanation,
  };
}
