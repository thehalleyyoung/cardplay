/**
 * GOFAI Plan Explainability System — Step 264
 *
 * Generates human-readable explanations for every step in a plan, linking
 * opcodes back to the goals they serve. This system ensures that users can
 * always understand "what changed and why".
 *
 * Key responsibilities:
 * 1. Generate natural language explanations for opcodes
 * 2. Link each opcode to the goal(s) it satisfies
 * 3. Trace provenance from user intent → goals → levers → opcodes
 * 4. Provide before/after summaries
 * 5. Explain constraint preservation decisions
 * 6. Support different levels of detail (summary vs detailed)
 *
 * Design principles:
 * - Every step is explainable (no black boxes)
 * - Explanations use musician-friendly language
 * - Technical details available on demand
 * - Provenance is complete and traversable
 * - Multi-turn dialogue support (can drill down)
 *
 * Reference: gofai_goalB.md Step 264, gofaimusicplus.md §8.4
 *
 * @module gofai/planning/plan-explainability
 */

import type {
  AxisId,
  OpcodeId,
  LexemeId,
} from '../canon/types.js';
import type {
  CPLIntent,
  CPLGoal,
  CPLConstraint,
  CPLScope,
  CPLPlan,
  CPLOpcode,
} from '../canon/cpl-types.js';
import type { PlanSkeleton } from './plan-skeleton.js';

// =============================================================================
// Core Types
// =============================================================================

/**
 * Complete explanation for a plan.
 */
export interface PlanExplanation {
  /** High-level summary of what the plan does */
  readonly summary: string;

  /** Detailed explanations for each step */
  readonly steps: readonly StepExplanation[];

  /** How this plan satisfies the user's goals */
  readonly goalSatisfaction: readonly GoalSatisfactionExplanation[];

  /** How this plan preserves required constraints */
  readonly constraintPreservation: readonly ConstraintExplanation[];

  /** Scope of the edit with human description */
  readonly scope: ScopeExplanation;

  /** Expected outcomes */
  readonly expectedOutcomes: readonly string[];

  /** Potential risks or side effects */
  readonly risks: readonly string[];

  /** Full provenance chain */
  readonly provenance: ProvenanceChain;
}

/**
 * Explanation for a single plan step.
 */
export interface StepExplanation {
  /** Step index (1-based for user display) */
  readonly stepNumber: number;

  /** The opcode being explained */
  readonly opcodeId: OpcodeId;

  /** Natural language description */
  readonly description: string;

  /** What this step does (action) */
  readonly action: string;

  /** What entities are affected */
  readonly target: string;

  /** Expected effect */
  readonly effect: string;

  /** Why this step is needed (link to goals) */
  readonly rationale: readonly string[];

  /** Parameters with explanations */
  readonly parameters: ReadonlyMap<string, ParameterExplanation>;

  /** Confidence this step will work */
  readonly confidence: number;

  /** Alternative approaches that were considered */
  readonly alternatives?: readonly AlternativeExplanation[];
}

/**
 * Explanation for a parameter value.
 */
export interface ParameterExplanation {
  /** Parameter name */
  readonly name: string;

  /** Human-readable value description */
  readonly value: string;

  /** Why this value was chosen */
  readonly reason: string;

  /** Units (if applicable) */
  readonly units?: string;

  /** Typical range for this parameter */
  readonly range?: string;
}

/**
 * Alternative approach explanation.
 */
export interface AlternativeExplanation {
  /** What the alternative would do */
  readonly description: string;

  /** Why this alternative wasn't chosen */
  readonly rejectionReason: string;

  /** Relative cost/quality */
  readonly tradeoff: string;
}

/**
 * Explanation of how a goal is satisfied.
 */
export interface GoalSatisfactionExplanation {
  /** The goal being satisfied */
  readonly goal: CPLGoal;

  /** Natural language description of the goal */
  readonly goalDescription: string;

  /** Which step(s) satisfy this goal */
  readonly satisfiedBy: readonly number[];

  /** How well this plan satisfies the goal (0-1) */
  readonly satisfaction: number;

  /** Explanation of the satisfaction level */
  readonly explanation: string;
}

/**
 * Explanation of constraint preservation.
 */
export interface ConstraintExplanation {
  /** The constraint being preserved */
  readonly constraint: CPLConstraint;

  /** Natural language description */
  readonly description: string;

  /** How this constraint is preserved */
  readonly preservationMethod: string;

  /** Verification strategy */
  readonly verification: string;

  /** Confidence the constraint will be preserved */
  readonly confidence: number;
}

/**
 * Scope explanation.
 */
export interface ScopeExplanation {
  /** Natural language description of scope */
  readonly description: string;

  /** Entities included */
  readonly includes: readonly string[];

  /** Entities explicitly excluded */
  readonly excludes: readonly string[];

  /** Time range (if applicable) */
  readonly timeRange?: string;

  /** Number of affected elements */
  readonly affectedCount?: number;
}

/**
 * Complete provenance chain from intent to plan.
 */
export interface ProvenanceChain {
  /** Original user utterance */
  readonly utterance: string;

  /** Lexemes matched */
  readonly lexemes: readonly LexemeId[];

  /** Goals extracted */
  readonly goals: readonly CPLGoal[];

  /** Constraints identified */
  readonly constraints: readonly CPLConstraint[];

  /** Levers selected */
  readonly levers: readonly AxisId[];

  /** Opcodes chosen */
  readonly opcodes: readonly OpcodeId[];

  /** Key decision points */
  readonly decisions: readonly DecisionPoint[];
}

/**
 * A decision point in the planning process.
 */
export interface DecisionPoint {
  /** What decision was made */
  readonly decision: string;

  /** Why this choice */
  readonly rationale: string;

  /** Alternatives considered */
  readonly alternatives: readonly string[];

  /** Confidence in this decision */
  readonly confidence: number;
}

// =============================================================================
// Main Explanation Generation
// =============================================================================

/**
 * Generate complete explanation for a plan.
 */
export function explainPlan(
  plan: CPLPlan,
  intent: CPLIntent,
  skeleton?: PlanSkeleton
): PlanExplanation {
  const steps = plan.opcodes.map((opcode, index) =>
    explainStep(opcode, index + 1, intent, plan)
  );

  const goalSatisfaction = explainGoalSatisfaction(
    intent.goals || [],
    steps,
    plan
  );

  const constraintPreservation = explainConstraintPreservation(
    intent.constraints || [],
    plan
  );

  const scope = explainScope(plan.scope, intent);

  const summary = generatePlanSummary(steps, goalSatisfaction, scope);

  const expectedOutcomes = generateExpectedOutcomes(steps, goalSatisfaction);

  const risks = identifyRisks(plan, intent, steps);

  const provenance = buildProvenanceChain(intent, skeleton, plan);

  return {
    summary,
    steps,
    goalSatisfaction,
    constraintPreservation,
    scope,
    expectedOutcomes,
    risks,
    provenance,
  };
}

/**
 * Explain a single plan step.
 */
function explainStep(
  opcode: CPLOpcode,
  stepNumber: number,
  intent: CPLIntent,
  plan: CPLPlan
): StepExplanation {
  const description = generateStepDescription(opcode);
  const action = describeOpcodeAction(opcode.opcodeId);
  const target = describeOpcodeTarget(opcode, plan);
  const effect = describeExpectedEffect(opcode);
  const rationale = explainStepRationale(opcode, intent);
  const parameters = explainParameters(opcode);
  const confidence = 0.8; // Default confidence

  return {
    stepNumber,
    opcodeId: opcode.opcodeId as OpcodeId,
    description,
    action,
    target,
    effect,
    rationale,
    parameters,
    confidence,
  };
}

/**
 * Generate natural language description for a step.
 */
function generateStepDescription(opcode: CPLOpcode): string {
  const actionPhrase = getActionPhrase(opcode.opcodeId);
  const targetPhrase = getTargetPhrase(opcode);
  const magnitudePhrase = getMagnitudePhrase(opcode);

  return `${actionPhrase} ${targetPhrase}${magnitudePhrase}`;
}

/**
 * Get action phrase for opcode.
 */
function getActionPhrase(opcodeId: OpcodeId): string {
  const actionPhrases: Record<string, string> = {
    'boost_highs': 'Boost high frequencies',
    'cut_lows': 'Reduce low frequencies',
    'add_reverb': 'Add reverb',
    'widen_stereo': 'Widen stereo image',
    'thin_texture': 'Thin texture',
    'densify': 'Increase density',
    'raise_register': 'Raise register',
    'lower_register': 'Lower register',
    'add_swing': 'Add swing feel',
    'quantize': 'Quantize timing',
    'revoice': 'Revoice chords',
    'add_layer': 'Add new layer',
    'remove_layer': 'Remove layer',
    'duplicate_section': 'Duplicate section',
    'insert_break': 'Insert break',
  };

  return actionPhrases[opcodeId] ?? `Execute ${opcodeId}`;
}

/**
 * Get target phrase from opcode parameters.
 */
function getTargetPhrase(opcode: CPLOpcode): string {
  const selector = opcode.params.get('selector');
  if (selector) {
    return `in ${selector}`;
  }

  const target = opcode.params.get('target');
  if (target) {
    return `for ${target}`;
  }

  return 'in selection';
}

/**
 * Get magnitude phrase from opcode parameters.
 */
function getMagnitudePhrase(opcode: CPLOpcode): string {
  const amount = opcode.params.get('amount');
  if (typeof amount === 'number') {
    if (amount < 0.2) return ' (subtle)';
    if (amount < 0.4) return ' (moderate)';
    if (amount < 0.7) return ' (significant)';
    return ' (dramatic)';
  }

  const gain = opcode.params.get('gain');
  if (typeof gain === 'number') {
    return ` (${gain > 0 ? '+' : ''}${gain.toFixed(1)} dB)`;
  }

  return '';
}

/**
 * Describe what action an opcode performs.
 */
function describeOpcodeAction(opcodeId: OpcodeId): string {
  const actions: Record<string, string> = {
    'boost_highs': 'Increase high frequency content',
    'cut_lows': 'Decrease low frequency content',
    'add_reverb': 'Apply reverb effect',
    'widen_stereo': 'Increase stereo width',
    'thin_texture': 'Reduce event density',
    'densify': 'Increase event density',
    'raise_register': 'Transpose upward',
    'lower_register': 'Transpose downward',
  };

  return actions[opcodeId] ?? 'Modify musical content';
}

/**
 * Describe the target of an opcode.
 */
function describeOpcodeTarget(_opcode: CPLOpcode, _plan: CPLPlan): string {
  // TODO: Extract target from scope and opcode params
  return 'selected regions';
}

/**
 * Describe expected effect of an opcode.
 */
function describeExpectedEffect(opcode: CPLOpcode): string {
  const effects: Record<string, string> = {
    'boost_highs': 'Brighter, more air and sparkle',
    'cut_lows': 'Tighter, less muddy',
    'add_reverb': 'More spacious, sense of depth',
    'widen_stereo': 'Wider soundstage, more immersive',
    'thin_texture': 'Less busy, more space between events',
    'densify': 'Fuller, more active',
    'raise_register': 'Higher pitch, lighter feel',
    'lower_register': 'Lower pitch, heavier feel',
  };

  return effects[opcode.opcodeId] ?? 'Modified sound';
}

/**
 * Explain why this step is needed (link to goals).
 */
function explainStepRationale(
  opcode: CPLOpcode,
  intent: CPLIntent
): readonly string[] {
  const rationales: string[] = [];

  // Check opcode's reasons field if available
  if ((opcode as any).reasons) {
    rationales.push(...(opcode as any).reasons);
  }

  // Infer from goal types
  const goals = intent.goals || [];
  for (const goal of goals) {
    if (goal.type === 'axis-goal') {
      const axis = (goal as any).axis;
      const opcodeAxisMap = getOpcodeToAxisMapping();
      if (opcodeAxisMap[opcode.opcodeId]?.includes(axis)) {
        const direction = (goal as any).direction || 'change';
        rationales.push(
          `Supports goal: ${direction} ${axis}`
        );
      }
    }
  }

  if (rationales.length === 0) {
    rationales.push('Part of overall transformation');
  }

  return rationales;
}

/**
 * Map opcodes to axes they affect.
 */
function getOpcodeToAxisMapping(): Record<string, readonly string[]> {
  return {
    'boost_highs': ['brightness', 'air', 'clarity'],
    'cut_lows': ['tightness', 'clarity'],
    'add_reverb': ['depth', 'space', 'width'],
    'widen_stereo': ['width', 'immersion'],
    'thin_texture': ['density', 'space', 'clarity'],
    'densify': ['density', 'energy', 'busyness'],
    'raise_register': ['lift', 'brightness', 'lightness'],
    'lower_register': ['weight', 'darkness', 'power'],
  };
}

/**
 * Explain parameter values.
 */
function explainParameters(
  opcode: CPLOpcode
): ReadonlyMap<string, ParameterExplanation> {
  const explanations = new Map<string, ParameterExplanation>();

  for (const [name, value] of opcode.params.entries()) {
    const explanation = explainParameter(name, value, opcode.opcodeId);
    if (explanation) {
      explanations.set(name, explanation);
    }
  }

  return explanations;
}

/**
 * Explain a single parameter.
 */
function explainParameter(
  name: string,
  value: unknown,
  opcodeId: OpcodeId
): ParameterExplanation | null {
  if (name === 'selector' || name === 'target') {
    // Don't explain structural parameters
    return null;
  }

  let valueStr: string;
  let units: string | undefined;
  let range: string | undefined;

  if (typeof value === 'number') {
    // Frequency
    if (name.includes('freq') || name === 'frequency') {
      valueStr = `${(value / 1000).toFixed(1)} kHz`;
      units = 'Hz';
      range = '20 Hz - 20 kHz';
    }
    // Gain
    else if (name === 'gain' || name.includes('level')) {
      valueStr = `${value > 0 ? '+' : ''}${value.toFixed(1)} dB`;
      units = 'dB';
      range = '-12 dB to +12 dB';
    }
    // Amount (normalized)
    else if (name === 'amount' || name === 'magnitude') {
      const percent = (value * 100).toFixed(0);
      valueStr = `${percent}%`;
      range = '0% - 100%';
    }
    // Generic number
    else {
      valueStr = value.toFixed(2);
    }
  } else if (typeof value === 'string') {
    valueStr = value;
  } else {
    valueStr = String(value);
  }

  const reason = inferParameterReason(name, value, opcodeId);

  return {
    name,
    value: valueStr,
    reason,
    units,
    range,
  };
}

/**
 * Infer why a parameter has a particular value.
 */
function inferParameterReason(
  name: string,
  value: unknown,
  opcodeId: OpcodeId
): string {
  // Amount reasoning
  if (name === 'amount' && typeof value === 'number') {
    if (value < 0.2) return 'Subtle change for safety';
    if (value < 0.4) return 'Moderate change as default';
    if (value < 0.7) return 'Significant change as requested';
    return 'Dramatic change for strong effect';
  }

  // Frequency reasoning
  if (name.includes('freq') && typeof value === 'number') {
    if (opcodeId === 'boost_highs') {
      return 'Boosts air and presence frequencies';
    }
    if (opcodeId === 'cut_lows') {
      return 'Removes muddy low frequencies';
    }
  }

  return 'Default value for this operation';
}

// =============================================================================
// Goal Satisfaction Explanation
// =============================================================================

/**
 * Explain how goals are satisfied.
 */
function explainGoalSatisfaction(
  goals: readonly CPLGoal[],
  steps: readonly StepExplanation[],
  plan: CPLPlan
): readonly GoalSatisfactionExplanation[] {
  return goals.map((goal) => {
    const goalDescription = describeGoal(goal);
    const satisfiedBy = findStepsThatSatisfy(goal, steps);
    const satisfaction = calculateGoalSatisfaction(goal, plan);
    const explanation = explainSatisfactionLevel(satisfaction);

    return {
      goal,
      goalDescription,
      satisfiedBy,
      satisfaction,
      explanation,
    };
  });
}

/**
 * Describe a goal in natural language.
 */
function describeGoal(goal: CPLGoal): string {
  if (goal.type === 'axis-goal') {
    const axis = (goal as any).axis;
    const direction = (goal as any).direction || 'change';
    const amount = (goal as any).amount;

    let desc = `${direction} ${axis}`;
    if (amount) {
      desc += ` by ${formatAmount(amount)}`;
    }
    return desc;
  }

  return 'Achieve goal'; // Fallback
}

/**
 * Format amount for display.
 */
function formatAmount(amount: any): string {
  if (typeof amount === 'number') {
    return `${(amount * 100).toFixed(0)}%`;
  }
  if (typeof amount === 'object' && amount.modifier) {
    return amount.modifier;
  }
  return 'some amount';
}

/**
 * Find which steps satisfy a goal.
 */
function findStepsThatSatisfy(
  goal: CPLGoal,
  steps: readonly StepExplanation[]
): readonly number[] {
  const satisfyingSteps: number[] = [];

  for (const step of steps) {
    if (stepSatisfiesGoal(step, goal)) {
      satisfyingSteps.push(step.stepNumber);
    }
  }

  return satisfyingSteps;
}

/**
 * Check if a step satisfies a goal.
 */
function stepSatisfiesGoal(step: StepExplanation, goal: CPLGoal): boolean {
  // Check if step's rationale mentions this goal
  const goalDesc = describeGoal(goal);
  return step.rationale.some((r) =>
    r.toLowerCase().includes(goalDesc.toLowerCase())
  );
}

/**
 * Calculate how well a plan satisfies a goal.
 */
function calculateGoalSatisfaction(
  goal: CPLGoal,
  plan: CPLPlan
): number {
  // Simplified - in reality would analyze plan effects
  return 0.85;
}

/**
 * Explain satisfaction level.
 */
function explainSatisfactionLevel(satisfaction: number): string {
  if (satisfaction >= 0.9) return 'Fully satisfied';
  if (satisfaction >= 0.7) return 'Well satisfied';
  if (satisfaction >= 0.5) return 'Partially satisfied';
  return 'Minimally satisfied';
}

// =============================================================================
// Constraint Preservation Explanation
// =============================================================================

/**
 * Explain how constraints are preserved.
 */
function explainConstraintPreservation(
  constraints: readonly CPLConstraint[],
  plan: CPLPlan
): readonly ConstraintExplanation[] {
  return constraints.map((constraint) => {
    const description = describeConstraint(constraint);
    const preservationMethod = describePreservationMethod(constraint, plan);
    const verification = describeVerification(constraint);
    const confidence = 0.9; // Would be calculated

    return {
      constraint,
      description,
      preservationMethod,
      verification,
      confidence,
    };
  });
}

/**
 * Describe a constraint.
 */
function describeConstraint(constraint: CPLConstraint): string {
  if (constraint.type === 'preserve-constraint') {
    const target = (constraint as any).target;
    const aspect = (constraint as any).aspect;
    return `Preserve ${aspect} of ${target}`;
  }

  if (constraint.type === 'only-change-constraint') {
    const allowed = (constraint as any).allowed;
    return `Only change ${allowed.join(', ')}`;
  }

  return 'Apply constraint';
}

/**
 * Describe how constraint is preserved.
 */
function describePreservationMethod(
  constraint: CPLConstraint,
  plan: CPLPlan
): string {
  if (constraint.type === 'preserve-constraint') {
    return 'Plan avoids modifying preserved elements';
  }

  return 'Plan respects constraint';
}

/**
 * Describe verification strategy.
 */
function describeVerification(constraint: CPLConstraint): string {
  if (constraint.type === 'preserve-constraint') {
    return 'Before/after comparison ensures preservation';
  }

  return 'Constraint checked during execution';
}

// =============================================================================
// Supporting Functions
// =============================================================================

/**
 * Explain scope of the plan.
 */
function explainScope(scope: CPLScope, intent: CPLIntent): ScopeExplanation {
  // Simplified implementation
  return {
    description: 'Selected region',
    includes: ['Current selection'],
    excludes: [],
  };
}

/**
 * Generate summary of entire plan.
 */
function generatePlanSummary(
  steps: readonly StepExplanation[],
  goalSatisfaction: readonly GoalSatisfactionExplanation[],
  scope: ScopeExplanation
): string {
  const numSteps = steps.length;
  const scopeDesc = scope.description;
  const mainGoals = goalSatisfaction
    .slice(0, 2)
    .map((g) => g.goalDescription)
    .join(' and ');

  return `${numSteps}-step plan to ${mainGoals} in ${scopeDesc}`;
}

/**
 * Generate expected outcomes.
 */
function generateExpectedOutcomes(
  steps: readonly StepExplanation[],
  goalSatisfaction: readonly GoalSatisfactionExplanation[]
): readonly string[] {
  const outcomes: string[] = [];

  for (const goal of goalSatisfaction) {
    if (goal.satisfaction >= 0.7) {
      outcomes.push(goal.goalDescription);
    }
  }

  return outcomes;
}

/**
 * Identify potential risks.
 */
function identifyRisks(
  plan: CPLPlan,
  intent: CPLIntent,
  steps: readonly StepExplanation[]
): readonly string[] {
  const risks: string[] = [];

  // Check for low confidence steps
  for (const step of steps) {
    if (step.confidence < 0.7) {
      risks.push(`Step ${step.stepNumber} has lower confidence`);
    }
  }

  // Check for destructive operations
  const destructiveOpcodes = ['remove_layer', 'delete_events'];
  for (const step of steps) {
    if (destructiveOpcodes.includes(step.opcodeId)) {
      risks.push(`Step ${step.stepNumber} is destructive (can be undone)`);
    }
  }

  return risks;
}

/**
 * Build complete provenance chain.
 */
function buildProvenanceChain(
  intent: CPLIntent,
  skeleton: PlanSkeleton | undefined,
  plan: CPLPlan
): ProvenanceChain {
  return {
    utterance: '', // Would come from intent
    lexemes: [],
    goals: intent.goals || [],
    constraints: intent.constraints || [],
    levers: skeleton?.levers.map((l) => l.lever) || [],
    opcodes: plan.opcodes.map((op) => op.id),
    decisions: [],
  };
}
