/**
 * @file Multi-Objective Planning
 * @module gofai/planning/multi-objective-planning
 *
 * Implements Steps 296-299 from gofai_goalB.md:
 * - Step 296: Add planning support for "multi-objective" requests (increase lift but decrease busyness)
 * - Step 297: Add planning support for "keep X but change Y" by encoding X as hard constraint
 * - Step 298: Add planning support for "only change drums" by restricting opcodes to selectors
 * - Step 299: Add planning support for "do it again but bigger" by scaling prior plans
 *
 * Multi-objective planning handles requests where multiple goals must be satisfied
 * simultaneously, potentially with conflicting requirements. This requires:
 * - Identifying orthogonal levers that don't interfere
 * - Detecting conflicts and offering trade-offs
 * - Maintaining constraints while optimizing for multiple axes
 * - Scaling and adapting previous successful plans
 *
 * Key Challenges:
 * - Some objectives conflict (e.g., "more dense but simpler")
 * - Must preserve constraints while serving all goals
 * - Need to detect when goals are impossible to satisfy together
 * - Should offer alternatives when exact request is unsatisfiable
 *
 * @see src/gofai/planning/lever-mappings.ts (axis to lever mappings)
 * @see src/gofai/planning/constraint-satisfaction.ts (constraint checking)
 * @see src/gofai/planning/plan-generation.ts (core planning logic)
 */

import type { CPLPlan, PlanOpcode, OpcodeId, PlanScore } from './plan-types';
import type { CPLGoal, CPLConstraint, CPLIntent } from '../canon/cpl-types';
import type { PerceptualAxis } from '../canon/perceptual-axes';
import type { LeverMapping, LeverBundle } from './lever-mappings';

// ============================================================================
// Types
// ============================================================================

/**
 * A multi-objective planning request
 */
export interface MultiObjectiveRequest {
  /** Primary objectives to satisfy */
  readonly objectives: readonly Objective[];

  /** Constraints that must be preserved */
  readonly constraints: readonly CPLConstraint[];

  /** Previous plan to adapt, if any */
  readonly basePlan?: CPLPlan;

  /** How to handle conflicts */
  readonly conflictStrategy: ConflictStrategy;
}

/**
 * A single objective with direction and importance
 */
export interface Objective {
  /** The perceptual axis or goal */
  readonly axis: PerceptualAxis | string;

  /** Direction of change */
  readonly direction: 'increase' | 'decrease' | 'maintain';

  /** Magnitude of change (1-10 scale, or specific value) */
  readonly magnitude?: number;

  /** Importance/priority (1-10, where 10 is critical) */
  readonly priority: number;

  /** Whether this objective is negotiable */
  readonly negotiable: boolean;
}

/**
 * Strategy for handling conflicting objectives
 */
export type ConflictStrategy =
  | 'best-effort'      // Try to satisfy as many as possible
  | 'prioritize'       // Satisfy high-priority first, may skip low-priority
  | 'fail-on-conflict' // Return error if any conflict detected
  | 'offer-alternatives'; // Generate multiple plans with different trade-offs

/**
 * Analysis of objective compatibility
 */
export interface ObjectiveCompatibility {
  /** Whether all objectives can be satisfied together */
  readonly compatible: boolean;

  /** Pairs of conflicting objectives */
  readonly conflicts: readonly ObjectiveConflict[];

  /** Objectives that can be satisfied together */
  readonly compatibleGroups: readonly Objective[][];

  /** Suggested priority order if not all can be satisfied */
  readonly suggestedOrder: readonly Objective[];
}

/**
 * A conflict between two objectives
 */
export interface ObjectiveConflict {
  readonly objective1: Objective;
  readonly objective2: Objective;
  readonly reason: string;
  readonly severity: 'soft' | 'hard';
  readonly possibleResolutions: readonly string[];
}

/**
 * Result of multi-objective planning
 */
export interface MultiObjectivePlanResult {
  /** Whether planning succeeded */
  readonly success: boolean;

  /** Generated plan(s) */
  readonly plans: readonly CPLPlan[];

  /** Which objectives each plan satisfies */
  readonly satisfiedObjectives: readonly (readonly Objective[])[];

  /** Objectives that couldn't be satisfied */
  readonly unsatisfiedObjectives: readonly Objective[];

  /** Trade-offs made */
  readonly tradeoffs: readonly TradeoffDescription[];

  /** Errors if planning failed */
  readonly errors: readonly string[];

  /** Warnings about suboptimal solutions */
  readonly warnings: readonly string[];
}

/**
 * Description of a trade-off between objectives
 */
export interface TradeoffDescription {
  readonly sacrificed: Objective;
  readonly preserved: Objective;
  readonly reason: string;
  readonly impact: 'minor' | 'moderate' | 'major';
}

// ============================================================================
// Objective Compatibility Analysis
// ============================================================================

/**
 * Analyze whether objectives can be satisfied together
 */
export function analyzeObjectiveCompatibility(
  objectives: readonly Objective[]
): ObjectiveCompatibility {
  const conflicts: ObjectiveConflict[] = [];
  const compatibleGroups: Objective[][] = [];

  // Check each pair of objectives for conflicts
  for (let i = 0; i < objectives.length; i++) {
    for (let j = i + 1; j < objectives.length; j++) {
      const obj1 = objectives[i];
      const obj2 = objectives[j];
      const conflict = detectConflict(obj1, obj2);
      if (conflict) {
        conflicts.push(conflict);
      }
    }
  }

  // Group compatible objectives
  if (conflicts.length === 0) {
    compatibleGroups.push([...objectives]);
  } else {
    // Build compatibility graph and find maximal compatible sets
    compatibleGroups.push(...findCompatibleGroups(objectives, conflicts));
  }

  // Sort objectives by priority for suggested order
  const suggestedOrder = [...objectives].sort((a, b) => b.priority - a.priority);

  return {
    compatible: conflicts.length === 0,
    conflicts,
    compatibleGroups,
    suggestedOrder,
  };
}

/**
 * Detect if two objectives conflict
 */
function detectConflict(
  obj1: Objective,
  obj2: Objective
): ObjectiveConflict | null {
  // Same axis, opposite directions = hard conflict
  if (obj1.axis === obj2.axis && obj1.direction !== obj2.direction) {
    if (obj1.direction !== 'maintain' && obj2.direction !== 'maintain') {
      return {
        objective1: obj1,
        objective2: obj2,
        reason: `Cannot both increase and decrease ${obj1.axis}`,
        severity: 'hard',
        possibleResolutions: [
          'Choose one direction',
          'Make one objective less important',
          'Accept partial satisfaction',
        ],
      };
    }
  }

  // Check for musical conflicts (domain knowledge)
  const musicalConflict = detectMusicalConflict(obj1, obj2);
  if (musicalConflict) {
    return musicalConflict;
  }

  return null;
}

/**
 * Detect conflicts based on musical domain knowledge
 */
function detectMusicalConflict(
  obj1: Objective,
  obj2: Objective
): ObjectiveConflict | null {
  // Map of known conflicting axis pairs
  const conflictPairs: Record<string, Record<string, string>> = {
    density: {
      simplicity: 'Increasing density inherently reduces simplicity',
      intimacy: 'Dense textures often feel less intimate',
    },
    brightness: {
      darkness: 'Brightness and darkness are opposite qualities',
      warmth: 'Very bright sounds often feel less warm',
    },
    width: {
      intimacy: 'Wide stereo fields often reduce sense of intimacy',
      focus: 'Very wide mixes can reduce sense of focus',
    },
    tension: {
      resolution: 'Increasing tension delays resolution',
      calm: 'Tension inherently opposes calm',
    },
    complexity: {
      simplicity: 'Complexity and simplicity are opposites',
      clarity: 'Very complex arrangements can reduce clarity',
    },
  };

  const axis1 = String(obj1.axis);
  const axis2 = String(obj2.axis);

  if (conflictPairs[axis1]?.[axis2]) {
    // Only conflict if directions oppose each other
    if (
      (obj1.direction === 'increase' && obj2.direction === 'increase') ||
      (obj1.direction === 'decrease' && obj2.direction === 'decrease')
    ) {
      return {
        objective1: obj1,
        objective2: obj2,
        reason: conflictPairs[axis1][axis2],
        severity: 'soft',
        possibleResolutions: [
          'Reduce magnitude of one objective',
          'Make one objective a lower priority',
          'Accept compromise between both',
        ],
      };
    }
  }

  // Check reverse direction
  if (conflictPairs[axis2]?.[axis1]) {
    if (
      (obj1.direction === 'increase' && obj2.direction === 'increase') ||
      (obj1.direction === 'decrease' && obj2.direction === 'decrease')
    ) {
      return {
        objective1: obj1,
        objective2: obj2,
        reason: conflictPairs[axis2][axis1],
        severity: 'soft',
        possibleResolutions: [
          'Reduce magnitude of one objective',
          'Make one objective a lower priority',
          'Accept compromise between both',
        ],
      };
    }
  }

  return null;
}

/**
 * Find maximal compatible groups of objectives
 */
function findCompatibleGroups(
  objectives: readonly Objective[],
  conflicts: readonly ObjectiveConflict[]
): Objective[][] {
  const groups: Objective[][] = [];

  // Build conflict map
  const conflictMap = new Map<Objective, Set<Objective>>();
  conflicts.forEach(conflict => {
    if (!conflictMap.has(conflict.objective1)) {
      conflictMap.set(conflict.objective1, new Set());
    }
    if (!conflictMap.has(conflict.objective2)) {
      conflictMap.set(conflict.objective2, new Set());
    }
    conflictMap.get(conflict.objective1)!.add(conflict.objective2);
    conflictMap.get(conflict.objective2)!.add(conflict.objective1);
  });

  // Greedy algorithm: start with highest priority, add compatible objectives
  const remaining = new Set(objectives);
  while (remaining.size > 0) {
    const group: Objective[] = [];
    const sorted = Array.from(remaining).sort((a, b) => b.priority - a.priority);

    for (const obj of sorted) {
      // Check if compatible with all in current group
      const compatible = group.every(
        groupObj => !conflictMap.get(obj)?.has(groupObj)
      );
      if (compatible) {
        group.push(obj);
        remaining.delete(obj);
      }
    }

    if (group.length > 0) {
      groups.push(group);
    }
  }

  return groups;
}

// ============================================================================
// Multi-Objective Planning
// ============================================================================

/**
 * Generate a plan satisfying multiple objectives
 */
export function planMultiObjective(
  request: MultiObjectiveRequest
): MultiObjectivePlanResult {
  const { objectives, constraints, basePlan, conflictStrategy } = request;

  // Analyze compatibility
  const compatibility = analyzeObjectiveCompatibility(objectives);

  // If incompatible and strategy is fail-on-conflict, return error
  if (!compatibility.compatible && conflictStrategy === 'fail-on-conflict') {
    return {
      success: false,
      plans: [],
      satisfiedObjectives: [],
      unsatisfiedObjectives: objectives,
      tradeoffs: [],
      errors: [
        'Conflicting objectives detected',
        ...compatibility.conflicts.map(c => c.reason),
      ],
      warnings: [],
    };
  }

  // Generate plans based on strategy
  switch (conflictStrategy) {
    case 'best-effort':
      return planBestEffort(objectives, constraints, compatibility, basePlan);

    case 'prioritize':
      return planPrioritized(objectives, constraints, compatibility, basePlan);

    case 'offer-alternatives':
      return planAlternatives(objectives, constraints, compatibility, basePlan);

    default:
      return planBestEffort(objectives, constraints, compatibility, basePlan);
  }
}

/**
 * Best-effort planning: try to satisfy as many objectives as possible
 */
function planBestEffort(
  objectives: readonly Objective[],
  constraints: readonly CPLConstraint[],
  compatibility: ObjectiveCompatibility,
  basePlan?: CPLPlan
): MultiObjectivePlanResult {
  // Start with largest compatible group
  const primaryGroup =
    compatibility.compatibleGroups.length > 0
      ? compatibility.compatibleGroups[0]
      : [];

  // Generate plan for primary group
  const plan = generatePlanForObjectives(primaryGroup, constraints, basePlan);

  if (!plan) {
    return {
      success: false,
      plans: [],
      satisfiedObjectives: [],
      unsatisfiedObjectives: objectives,
      tradeoffs: [],
      errors: ['Failed to generate plan for objectives'],
      warnings: [],
    };
  }

  // Identify which objectives are satisfied
  const satisfied = objectives.filter(obj => primaryGroup.includes(obj));
  const unsatisfied = objectives.filter(obj => !primaryGroup.includes(obj));

  // Document trade-offs
  const tradeoffs = unsatisfied.map(unsat => ({
    sacrificed: unsat,
    preserved: satisfied[0], // Simplified - would be more nuanced
    reason: `Conflicts with higher-priority objectives`,
    impact: (unsat.priority > 5 ? 'major' : 'moderate') as 'major' | 'moderate',
  }));

  return {
    success: true,
    plans: [plan],
    satisfiedObjectives: [satisfied],
    unsatisfiedObjectives: unsatisfied,
    tradeoffs,
    errors: [],
    warnings:
      unsatisfied.length > 0
        ? [`Could not satisfy ${unsatisfied.length} objective(s) due to conflicts`]
        : [],
  };
}

/**
 * Prioritized planning: satisfy objectives in priority order
 */
function planPrioritized(
  objectives: readonly Objective[],
  constraints: readonly CPLConstraint[],
  compatibility: ObjectiveCompatibility,
  basePlan?: CPLPlan
): MultiObjectivePlanResult {
  const sorted = compatibility.suggestedOrder;
  const satisfied: Objective[] = [];
  const unsatisfied: Objective[] = [];
  const tradeoffs: TradeoffDescription[] = [];

  // Try to add objectives one by one in priority order
  for (const obj of sorted) {
    const candidateGroup = [...satisfied, obj];
    const plan = generatePlanForObjectives(candidateGroup, constraints, basePlan);

    if (plan) {
      satisfied.push(obj);
    } else {
      unsatisfied.push(obj);
      if (satisfied.length > 0) {
        tradeoffs.push({
          sacrificed: obj,
          preserved: satisfied[0],
          reason: 'Conflicts with higher-priority objectives',
          impact: obj.priority > 7 ? 'major' : 'moderate',
        });
      }
    }
  }

  const finalPlan = generatePlanForObjectives(satisfied, constraints, basePlan);

  return {
    success: finalPlan !== null,
    plans: finalPlan ? [finalPlan] : [],
    satisfiedObjectives: finalPlan ? [satisfied] : [],
    unsatisfiedObjectives: unsatisfied,
    tradeoffs,
    errors: finalPlan ? [] : ['Failed to generate plan'],
    warnings: [],
  };
}

/**
 * Generate alternative plans with different trade-offs
 */
function planAlternatives(
  objectives: readonly Objective[],
  constraints: readonly CPLConstraint[],
  compatibility: ObjectiveCompatibility,
  basePlan?: CPLPlan
): MultiObjectivePlanResult {
  const plans: CPLPlan[] = [];
  const satisfiedSets: Objective[][] = [];

  // Generate plan for each compatible group
  for (const group of compatibility.compatibleGroups) {
    const plan = generatePlanForObjectives(group, constraints, basePlan);
    if (plan) {
      plans.push(plan);
      satisfiedSets.push(group);
    }
  }

  // If we have multiple plans, that's success
  if (plans.length > 0) {
    return {
      success: true,
      plans,
      satisfiedObjectives: satisfiedSets,
      unsatisfiedObjectives: [],
      tradeoffs: [],
      errors: [],
      warnings: [
        `Generated ${plans.length} alternative plans due to conflicting objectives`,
      ],
    };
  }

  return {
    success: false,
    plans: [],
    satisfiedObjectives: [],
    unsatisfiedObjectives: objectives,
    tradeoffs: [],
    errors: ['No valid plans could be generated'],
    warnings: [],
  };
}

/**
 * Generate a plan for a specific set of objectives
 * This is simplified - real implementation would use full planning pipeline
 */
function generatePlanForObjectives(
  objectives: readonly Objective[],
  constraints: readonly CPLConstraint[],
  basePlan?: CPLPlan
): CPLPlan | null {
  if (objectives.length === 0) {
    return null;
  }

  // Convert objectives to goals
  const goals: CPLGoal[] = objectives.map(obj => ({
    type: 'axis-adjustment',
    axis: String(obj.axis),
    direction: obj.direction,
    magnitude: obj.magnitude,
    priority: obj.priority,
  }));

  // This would call into the main planning pipeline
  // For now, return a stub plan structure
  const plan: CPLPlan = {
    id: `plan-multi-obj-${Date.now()}`,
    goals,
    constraints,
    steps: [],
    score: { total: 0 },
    provenance: {
      objectives: objectives,
      strategy: 'multi-objective',
    },
  };

  return plan;
}

// ============================================================================
// Scope-Restricted Planning (Step 298)
// ============================================================================

/**
 * Plan with scope restrictions (e.g., "only change drums")
 */
export interface ScopeRestrictedRequest {
  /** The objectives */
  readonly objectives: readonly Objective[];

  /** Selector restricting scope */
  readonly scopeSelector: string; // e.g., "drums", "chorus", "bass and kick"

  /** Constraints */
  readonly constraints: readonly CPLConstraint[];
}

/**
 * Generate plan restricted to specific scope
 */
export function planWithScopeRestriction(
  request: ScopeRestrictedRequest
): MultiObjectivePlanResult {
  const { objectives, scopeSelector, constraints } = request;

  // Add implicit constraint: only modify events matching selector
  const scopeConstraint: CPLConstraint = {
    type: 'only-change',
    selector: scopeSelector,
    description: `Only modify ${scopeSelector}`,
  };

  const enhancedConstraints = [...constraints, scopeConstraint];

  // Plan normally with enhanced constraints
  return planMultiObjective({
    objectives,
    constraints: enhancedConstraints,
    conflictStrategy: 'best-effort',
  });
}

// ============================================================================
// Plan Scaling (Step 299: "do it again but bigger")
// ============================================================================

/**
 * Request to scale a previous plan
 */
export interface PlanScalingRequest {
  /** The plan to scale */
  readonly basePlan: CPLPlan;

  /** Scaling factor (1.0 = same, 2.0 = twice as much, 0.5 = half) */
  readonly scaleFactor: number;

  /** Constraints that must still be satisfied */
  readonly constraints: readonly CPLConstraint[];

  /** Whether to validate scaled plan before returning */
  readonly validate: boolean;
}

/**
 * Scale a plan's parameters by a factor
 */
export function scalePlan(request: PlanScalingRequest): CPLPlan {
  const { basePlan, scaleFactor, constraints } = request;

  // Clone and scale each step's parameters
  const scaledSteps = basePlan.steps.map(step => {
    const scaledParams: Record<string, any> = {};

    // Scale numeric parameters
    Object.entries(step.parameters || {}).forEach(([key, value]) => {
      if (typeof value === 'number' && isScalableParameter(key)) {
        scaledParams[key] = scaleParameterValue(key, value, scaleFactor);
      } else {
        scaledParams[key] = value;
      }
    });

    return {
      ...step,
      parameters: scaledParams,
    };
  });

  return {
    ...basePlan,
    steps: scaledSteps,
    constraints,
    provenance: {
      ...basePlan.provenance,
      scaledFrom: basePlan.id,
      scaleFactor,
    },
  };
}

/**
 * Check if a parameter should be scaled
 */
function isScalableParameter(paramName: string): boolean {
  // Parameters that should scale with intensity
  const scalable = [
    'amount',
    'strength',
    'magnitude',
    'intensity',
    'factor',
    'ratio',
    'density',
  ];
  return scalable.includes(paramName);
}

/**
 * Scale a parameter value appropriately
 */
function scaleParameterValue(
  paramName: string,
  value: number,
  scaleFactor: number
): number {
  // Different parameters scale differently
  switch (paramName) {
    case 'ratio':
      // Ratios should stay in [0,1] range
      return Math.max(0, Math.min(1, value * scaleFactor));

    case 'strength':
    case 'amount':
      // Percentages should stay in reasonable ranges
      return Math.max(-100, Math.min(100, value * scaleFactor));

    case 'shift':
      // Discrete shifts might need rounding
      return Math.round(value * scaleFactor);

    default:
      // Generic scaling
      return value * scaleFactor;
  }
}

// ============================================================================
// Exports
// ============================================================================

export type {
  MultiObjectiveRequest,
  Objective,
  ConflictStrategy,
  ObjectiveCompatibility,
  ObjectiveConflict,
  MultiObjectivePlanResult,
  TradeoffDescription,
  ScopeRestrictedRequest,
  PlanScalingRequest,
};
