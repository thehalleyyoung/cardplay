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
// Comprehensive Opcode Explanation Library
// =============================================================================

/**
 * Detailed explanation templates for all opcodes.
 * This maps each opcode to multiple explanation formats for different contexts.
 */
interface OpcodeExplanationTemplate {
  readonly action: string;
  readonly effect: string;
  readonly musicalRationale: string;
  readonly technicalDetails: string;
  readonly typicalGoals: readonly string[];
  readonly compatibleAxes: readonly AxisId[];
  readonly riskLevel: 'low' | 'medium' | 'high';
  readonly examples: readonly string[];
}

const OPCODE_EXPLANATIONS: Record<OpcodeId, OpcodeExplanationTemplate> = {
  // ===== Spectral / Timbral Opcodes =====
  'boost_highs': {
    action: 'Boost high frequencies',
    effect: 'Makes the sound brighter and more present',
    musicalRationale: 'Increases clarity and air, helps elements cut through the mix',
    technicalDetails: 'Applies high-shelf EQ boost centered around 8-12kHz',
    typicalGoals: ['increase brightness', 'add air', 'improve clarity'],
    compatibleAxes: ['axis:brightness' as AxisId, 'axis:air' as AxisId],
    riskLevel: 'low',
    examples: [
      'Adds sparkle to cymbals',
      'Brings out vocal presence',
      'Makes synths sound more modern',
    ],
  },
  'cut_highs': {
    action: 'Reduce high frequencies',
    effect: 'Makes the sound warmer and less harsh',
    musicalRationale: 'Reduces fatigue, creates vintage character, controls sibilance',
    technicalDetails: 'Applies high-shelf EQ cut or low-pass filter',
    typicalGoals: ['increase warmth', 'reduce harshness', 'create vintage feel'],
    compatibleAxes: ['axis:warmth' as AxisId, 'axis:brightness' as AxisId],
    riskLevel: 'low',
    examples: [
      'Warms up harsh digital synths',
      'Creates lofi character',
      'Tames overly bright recordings',
    ],
  },
  'boost_lows': {
    action: 'Boost low frequencies',
    effect: 'Adds weight and power to the sound',
    musicalRationale: 'Increases impact and physical presence, fills out thin mixes',
    technicalDetails: 'Applies low-shelf EQ boost or sub-harmonic generation',
    typicalGoals: ['add weight', 'increase power', 'fill out low end'],
    compatibleAxes: ['axis:weight' as AxisId, 'axis:power' as AxisId],
    riskLevel: 'medium',
    examples: [
      'Makes kick drums hit harder',
      'Fills out bass lines',
      'Adds sub presence to pads',
    ],
  },
  'cut_lows': {
    action: 'Reduce low frequencies',
    effect: 'Cleans up muddy low end and creates space',
    musicalRationale: 'Prevents frequency buildup, clears headroom for bass/kick',
    technicalDetails: 'Applies high-pass filter typically at 80-200Hz',
    typicalGoals: ['reduce muddiness', 'clean up mix', 'create space'],
    compatibleAxes: ['axis:clarity' as AxisId],
    riskLevel: 'low',
    examples: [
      'Removes rumble from vocals',
      'Cleans up guitar tracks',
      'Separates elements in busy mixes',
    ],
  },
  'boost_mids': {
    action: 'Boost mid-range frequencies',
    effect: 'Brings elements forward in the mix',
    musicalRationale: 'Increases presence and body, helps with mix definition',
    technicalDetails: 'Applies parametric EQ boost in 200Hz-5kHz range',
    typicalGoals: ['increase presence', 'add body', 'improve definition'],
    compatibleAxes: ['axis:presence' as AxisId, 'axis:body' as AxisId],
    riskLevel: 'medium',
    examples: [
      'Makes vocals sit forward',
      'Adds punch to snares',
      'Brings out melodic content',
    ],
  },
  'cut_mids': {
    action: 'Reduce mid-range frequencies',
    effect: 'Creates space and reduces boxiness',
    musicalRationale: 'Removes resonances, controls harshness, creates room for other elements',
    technicalDetails: 'Applies parametric EQ cut targeting resonant frequencies',
    typicalGoals: ['reduce boxiness', 'create space', 'control resonance'],
    compatibleAxes: ['axis:clarity' as AxisId, 'axis:space' as AxisId],
    riskLevel: 'medium',
    examples: [
      'Removes nasal quality from vocals',
      'Tames boxy acoustic guitars',
      'Creates room for lead elements',
    ],
  },

  // ===== Spatial / Stereo Opcodes =====
  'widen_stereo': {
    action: 'Increase stereo width',
    effect: 'Makes the sound feel more expansive and immersive',
    musicalRationale: 'Creates space and separation, enhances envelopment',
    technicalDetails: 'Applies stereo widening via mid-side processing or Haas effect',
    typicalGoals: ['increase width', 'create space', 'enhance immersion'],
    compatibleAxes: ['axis:width' as AxisId, 'axis:space' as AxisId],
    riskLevel: 'low',
    examples: [
      'Makes pad sounds more atmospheric',
      'Widens stereo synths',
      'Creates cinematic space',
    ],
  },
  'narrow_stereo': {
    action: 'Reduce stereo width',
    effect: 'Creates focus and intimacy',
    musicalRationale: 'Increases mono compatibility, focuses attention, creates intimacy',
    technicalDetails: 'Reduces side content in mid-side processing',
    typicalGoals: ['increase focus', 'improve mono compatibility', 'create intimacy'],
    compatibleAxes: ['axis:intimacy' as AxisId, 'axis:focus' as AxisId],
    riskLevel: 'low',
    examples: [
      'Focuses lead vocals',
      'Tightens bass frequencies',
      'Creates intimate acoustic feel',
    ],
  },
  'pan_left': {
    action: 'Position sound toward left',
    effect: 'Places element in left portion of stereo field',
    musicalRationale: 'Creates separation and balance in arrangement',
    technicalDetails: 'Adjusts pan position -100 to -30',
    typicalGoals: ['create separation', 'balance arrangement', 'position elements'],
    compatibleAxes: ['axis:position' as AxisId],
    riskLevel: 'low',
    examples: [
      'Pans rhythm guitar left',
      'Balances dual elements',
      'Creates stereo space',
    ],
  },
  'pan_right': {
    action: 'Position sound toward right',
    effect: 'Places element in right portion of stereo field',
    musicalRationale: 'Creates separation and balance in arrangement',
    technicalDetails: 'Adjusts pan position +30 to +100',
    typicalGoals: ['create separation', 'balance arrangement', 'position elements'],
    compatibleAxes: ['axis:position' as AxisId],
    riskLevel: 'low',
    examples: [
      'Pans rhythm guitar right',
      'Balances dual elements',
      'Creates stereo space',
    ],
  },
  'center_position': {
    action: 'Center sound in stereo field',
    effect: 'Places element directly in center',
    musicalRationale: 'Creates focus and power, typical for lead elements',
    technicalDetails: 'Sets pan position to 0 (center)',
    typicalGoals: ['create focus', 'increase power', 'center attention'],
    compatibleAxes: ['axis:focus' as AxisId, 'axis:power' as AxisId],
    riskLevel: 'low',
    examples: [
      'Centers lead vocal',
      'Focuses kick and bass',
      'Creates strong presence',
    ],
  },

  // ===== Dynamics Opcodes =====
  'compress': {
    action: 'Apply dynamic range compression',
    effect: 'Evens out volume levels and adds sustain',
    musicalRationale: 'Increases consistency, adds power and punch, controls peaks',
    technicalDetails: 'Reduces dynamic range via ratio, threshold, attack/release',
    typicalGoals: ['increase consistency', 'add punch', 'control dynamics'],
    compatibleAxes: ['axis:punch' as AxisId, 'axis:consistency' as AxisId],
    riskLevel: 'medium',
    examples: [
      'Makes vocals sit consistently',
      'Adds punch to drums',
      'Glues mix elements together',
    ],
  },
  'expand': {
    action: 'Increase dynamic range',
    effect: 'Makes quiet parts quieter and loud parts louder',
    musicalRationale: 'Restores natural dynamics, increases drama and impact',
    technicalDetails: 'Expands dynamic range via upward or downward expansion',
    typicalGoals: ['increase dynamics', 'restore life', 'add drama'],
    compatibleAxes: ['axis:dynamics' as AxisId, 'axis:drama' as AxisId],
    riskLevel: 'medium',
    examples: [
      'Restores over-compressed material',
      'Increases dramatic range',
      'Brings back natural feel',
    ],
  },
  'limit': {
    action: 'Apply hard limiting',
    effect: 'Prevents peaks from exceeding threshold',
    musicalRationale: 'Maximizes loudness without clipping, protects against peaks',
    technicalDetails: 'Applies brick-wall limiting at specified ceiling',
    typicalGoals: ['maximize loudness', 'prevent clipping', 'add power'],
    compatibleAxes: ['axis:loudness' as AxisId, 'axis:power' as AxisId],
    riskLevel: 'high',
    examples: [
      'Maximizes master bus loudness',
      'Controls transient peaks',
      'Prepares for streaming platforms',
    ],
  },
  'gate': {
    action: 'Apply noise gate',
    effect: 'Silences signal below threshold',
    musicalRationale: 'Removes noise and bleed, tightens drums, creates rhythmic effects',
    technicalDetails: 'Cuts signal below threshold with configurable attack/release',
    typicalGoals: ['remove noise', 'tighten performance', 'create rhythm'],
    compatibleAxes: ['axis:tightness' as AxisId, 'axis:clarity' as AxisId],
    riskLevel: 'medium',
    examples: [
      'Cleans up noisy recordings',
      'Tightens drum tracks',
      'Creates gated reverb effects',
    ],
  },

  // ===== Temporal / Rhythm Opcodes =====
  'quantize': {
    action: 'Align timing to grid',
    effect: 'Makes rhythm more precise and locked',
    musicalRationale: 'Increases tightness, fixes timing errors, creates mechanical feel',
    technicalDetails: 'Snaps note onsets to nearest grid position',
    typicalGoals: ['increase tightness', 'fix timing', 'create precision'],
    compatibleAxes: ['axis:tightness' as AxisId, 'axis:precision' as AxisId],
    riskLevel: 'medium',
    examples: [
      'Locks drums to grid',
      'Tightens bass performance',
      'Creates electronic precision',
    ],
  },
  'humanize': {
    action: 'Add timing variation',
    effect: 'Makes rhythm feel more natural and organic',
    musicalRationale: 'Removes mechanical feel, adds human character, creates groove',
    technicalDetails: 'Randomly offsets timing and velocity within musical bounds',
    typicalGoals: ['add humanity', 'create groove', 'remove mechanical feel'],
    compatibleAxes: ['axis:groove' as AxisId, 'axis:humanity' as AxisId],
    riskLevel: 'low',
    examples: [
      'Makes MIDI drums feel real',
      'Adds groove to programmed parts',
      'Creates natural imperfection',
    ],
  },
  'add_swing': {
    action: 'Apply swing timing',
    effect: 'Creates shuffled or swung groove',
    musicalRationale: 'Adds groove and feel, creates genre-specific character',
    technicalDetails: 'Delays off-beat events by swing percentage',
    typicalGoals: ['add groove', 'create swing feel', 'enhance rhythm'],
    compatibleAxes: ['axis:swing' as AxisId, 'axis:groove' as AxisId],
    riskLevel: 'low',
    examples: [
      'Creates jazz swing feel',
      'Adds hip-hop groove',
      'Makes rhythm less rigid',
    ],
  },
  'remove_swing': {
    action: 'Straighten swing timing',
    effect: 'Creates straight, even rhythm',
    musicalRationale: 'Removes shuffle, creates driving feel, increases urgency',
    technicalDetails: 'Removes swing offset, creates even subdivision',
    typicalGoals: ['create drive', 'increase urgency', 'straighten rhythm'],
    compatibleAxes: ['axis:drive' as AxisId, 'axis:tightness' as AxisId],
    riskLevel: 'low',
    examples: [
      'Straightens shuffled drums',
      'Creates driving rock feel',
      'Increases forward motion',
    ],
  },
  'shift_timing': {
    action: 'Shift all events in time',
    effect: 'Changes phase relationship with other elements',
    musicalRationale: 'Creates pocket, adjusts feel, fixes sync issues',
    technicalDetails: 'Offsets all events by fixed amount',
    typicalGoals: ['adjust pocket', 'fix sync', 'create feel'],
    compatibleAxes: ['axis:pocket' as AxisId],
    riskLevel: 'low',
    examples: [
      'Pushes drums ahead for urgency',
      'Lays drums back for laid-back feel',
      'Fixes phase issues between tracks',
    ],
  },

  // ===== Harmonic Opcodes =====
  'transpose_up': {
    action: 'Shift pitch upward',
    effect: 'Raises overall pitch register',
    musicalRationale: 'Changes key, increases brightness and energy',
    technicalDetails: 'Shifts all pitches by specified semitones',
    typicalGoals: ['raise register', 'increase energy', 'change key'],
    compatibleAxes: ['axis:register' as AxisId, 'axis:energy' as AxisId],
    riskLevel: 'high',
    examples: [
      'Transposes melody up an octave',
      'Raises key for brighter feel',
      'Creates higher harmony layer',
    ],
  },
  'transpose_down': {
    action: 'Shift pitch downward',
    effect: 'Lowers overall pitch register',
    musicalRationale: 'Changes key, adds weight and gravity',
    technicalDetails: 'Shifts all pitches by specified semitones',
    typicalGoals: ['lower register', 'add weight', 'change key'],
    compatibleAxes: ['axis:register' as AxisId, 'axis:weight' as AxisId],
    riskLevel: 'high',
    examples: [
      'Drops bass line an octave',
      'Lowers key for darker feel',
      'Creates lower harmony layer',
    ],
  },
  'revoice': {
    action: 'Change chord voicing',
    effect: 'Redistributes notes within chord',
    musicalRationale: 'Improves voice leading, changes character, optimizes register',
    technicalDetails: 'Moves chord tones to different octaves while preserving harmony',
    typicalGoals: ['improve voicing', 'optimize register', 'enhance character'],
    compatibleAxes: ['axis:voicing' as AxisId, 'axis:register' as AxisId],
    riskLevel: 'medium',
    examples: [
      'Opens up close voicing',
      'Creates drop-2 voicing',
      'Improves voice leading',
    ],
  },
  'add_extensions': {
    action: 'Add harmonic extensions',
    effect: 'Makes harmony richer and more colorful',
    musicalRationale: 'Adds complexity and sophistication, creates tension/color',
    technicalDetails: 'Adds 7ths, 9ths, 11ths, 13ths to chords',
    typicalGoals: ['enrich harmony', 'add color', 'increase sophistication'],
    compatibleAxes: ['axis:richness' as AxisId, 'axis:complexity' as AxisId],
    riskLevel: 'medium',
    examples: [
      'Makes triads into 7th chords',
      'Adds jazz color to progressions',
      'Creates sophisticated harmonic palette',
    ],
  },
  'substitute_chord': {
    action: 'Replace chord with substitute',
    effect: 'Changes harmonic direction while maintaining function',
    musicalRationale: 'Adds variety, creates reharmonization, maintains or enhances motion',
    technicalDetails: 'Replaces chord with functional substitute (tritone, relative, etc.)',
    typicalGoals: ['add variety', 'enhance progression', 'create interest'],
    compatibleAxes: ['axis:variety' as AxisId, 'axis:sophistication' as AxisId],
    riskLevel: 'high',
    examples: [
      'Tritone substitution in jazz',
      'Replaces IV with ii',
      'Modal interchange substitution',
    ],
  },

  // ===== Density / Texture Opcodes =====
  'thin_texture': {
    action: 'Remove notes or events',
    effect: 'Creates space and reduces busyness',
    musicalRationale: 'Increases clarity, creates breathing room, reduces fatigue',
    technicalDetails: 'Removes events based on salience, timing, or register',
    typicalGoals: ['increase clarity', 'create space', 'reduce busyness'],
    compatibleAxes: ['axis:clarity' as AxisId, 'axis:space' as AxisId, 'axis:busyness' as AxisId],
    riskLevel: 'medium',
    examples: [
      'Removes excessive hi-hat hits',
      'Thins out busy piano part',
      'Creates cleaner arrangement',
    ],
  },
  'densify': {
    action: 'Add notes or events',
    effect: 'Makes rhythm or harmony fuller',
    musicalRationale: 'Increases energy and complexity, fills holes, adds movement',
    technicalDetails: 'Adds events following musical logic (scales, subdivisions)',
    typicalGoals: ['increase energy', 'add complexity', 'fill out texture'],
    compatibleAxes: ['axis:energy' as AxisId, 'axis:complexity' as AxisId, 'axis:density' as AxisId],
    riskLevel: 'medium',
    examples: [
      'Adds hi-hat 16ths',
      'Fills out chord voicing',
      'Creates busier arrangement',
    ],
  },
  'add_layer': {
    action: 'Duplicate to new layer',
    effect: 'Creates thicker, richer sound',
    musicalRationale: 'Adds depth and body, creates ensemble effect',
    technicalDetails: 'Duplicates events to new track with optional variation',
    typicalGoals: ['add richness', 'create ensemble', 'increase power'],
    compatibleAxes: ['axis:richness' as AxisId, 'axis:power' as AxisId],
    riskLevel: 'low',
    examples: [
      'Doubles vocals for chorus',
      'Creates string ensemble',
      'Adds guitar layers',
    ],
  },
  'remove_layer': {
    action: 'Delete layer or events',
    effect: 'Simplifies arrangement',
    musicalRationale: 'Creates clarity, reduces crowding, increases focus',
    technicalDetails: 'Removes specified track or event group',
    typicalGoals: ['increase clarity', 'create focus', 'simplify arrangement'],
    compatibleAxes: ['axis:clarity' as AxisId, 'axis:focus' as AxisId],
    riskLevel: 'high',
    examples: [
      'Removes doubling for verse',
      'Strips down for breakdown',
      'Creates intimate section',
    ],
  },

  // ===== Structural Opcodes =====
  'duplicate_section': {
    action: 'Copy section to new location',
    effect: 'Repeats musical material',
    musicalRationale: 'Extends form, creates repetition, builds structure',
    technicalDetails: 'Copies all events and settings from source to destination',
    typicalGoals: ['extend form', 'create repetition', 'build structure'],
    compatibleAxes: [],
    riskLevel: 'low',
    examples: [
      'Repeats chorus',
      'Doubles verse length',
      'Creates song intro from verse',
    ],
  },
  'insert_break': {
    action: 'Create rhythmic break',
    effect: 'Adds dramatic pause or fill',
    musicalRationale: 'Creates tension, provides transition, adds drama',
    technicalDetails: 'Silences or modifies rhythm for specified duration',
    typicalGoals: ['add drama', 'create transition', 'build tension'],
    compatibleAxes: ['axis:drama' as AxisId, 'axis:tension' as AxisId],
    riskLevel: 'low',
    examples: [
      'Creates drum break before drop',
      'Adds fill before chorus',
      'Creates anticipation moment',
    ],
  },
  'extend_section': {
    action: 'Make section longer',
    effect: 'Adds more bars to section',
    musicalRationale: 'Allows development, creates space, adjusts pacing',
    technicalDetails: 'Extends section by repeating or interpolating material',
    typicalGoals: ['allow development', 'adjust pacing', 'create space'],
    compatibleAxes: [],
    riskLevel: 'low',
    examples: [
      'Extends verse for additional lyrics',
      'Lengthens solo section',
      'Creates longer buildup',
    ],
  },
  'shorten_section': {
    action: 'Make section shorter',
    effect: 'Reduces number of bars',
    musicalRationale: 'Increases urgency, tightens structure, improves pacing',
    technicalDetails: 'Removes bars while maintaining musical sense',
    typicalGoals: ['increase urgency', 'tighten structure', 'improve pacing'],
    compatibleAxes: [],
    riskLevel: 'medium',
    examples: [
      'Cuts verse from 16 to 8 bars',
      'Tightens intro',
      'Makes song more concise',
    ],
  },
  'add_variation': {
    action: 'Create subtle variations',
    effect: 'Adds interest to repetitive sections',
    musicalRationale: 'Prevents monotony, maintains interest, creates evolution',
    technicalDetails: 'Modifies repeated material with melodic/rhythmic variations',
    typicalGoals: ['add interest', 'prevent monotony', 'create evolution'],
    compatibleAxes: ['axis:variety' as AxisId, 'axis:interest' as AxisId],
    riskLevel: 'low',
    examples: [
      'Varies second verse melody',
      'Adds drum fills on repeats',
      'Creates evolving pad texture',
    ],
  },

  // ===== Effect / Processing Opcodes =====
  'add_reverb': {
    action: 'Apply spatial reverb',
    effect: 'Adds sense of space and depth',
    musicalRationale: 'Creates atmosphere, adds depth, enhances mood',
    technicalDetails: 'Applies algorithmic or convolution reverb',
    typicalGoals: ['add space', 'create atmosphere', 'add depth'],
    compatibleAxes: ['axis:space' as AxisId, 'axis:depth' as AxisId, 'axis:atmosphere' as AxisId],
    riskLevel: 'low',
    examples: [
      'Adds hall reverb to vocals',
      'Creates ambient pad space',
      'Adds room character to drums',
    ],
  },
  'reduce_reverb': {
    action: 'Decrease reverb amount',
    effect: 'Makes sound drier and more direct',
    musicalRationale: 'Increases clarity and intimacy, creates direct feel',
    technicalDetails: 'Reduces reverb mix or removes reverb processing',
    typicalGoals: ['increase clarity', 'create intimacy', 'add directness'],
    compatibleAxes: ['axis:clarity' as AxisId, 'axis:intimacy' as AxisId],
    riskLevel: 'low',
    examples: [
      'Dries out over-reverbed vocals',
      'Creates intimate acoustic feel',
      'Brings elements forward',
    ],
  },
  'add_delay': {
    action: 'Apply rhythmic delay',
    effect: 'Creates echoes and rhythmic interest',
    musicalRationale: 'Adds space, creates rhythm, enhances groove',
    technicalDetails: 'Applies time-based delay with feedback',
    typicalGoals: ['add space', 'create rhythm', 'enhance interest'],
    compatibleAxes: ['axis:space' as AxisId, 'axis:rhythm' as AxisId],
    riskLevel: 'low',
    examples: [
      'Adds eighth-note delay to vocals',
      'Creates dub echo effects',
      'Adds rhythmic interest to leads',
    ],
  },
  'add_distortion': {
    action: 'Apply harmonic distortion',
    effect: 'Adds grit, aggression, and harmonics',
    musicalRationale: 'Increases aggression and power, adds character',
    technicalDetails: 'Applies saturation, overdrive, or distortion',
    typicalGoals: ['increase aggression', 'add character', 'add power'],
    compatibleAxes: ['axis:aggression' as AxisId, 'axis:grit' as AxisId, 'axis:power' as AxisId],
    riskLevel: 'low',
    examples: [
      'Adds drive to bass',
      'Creates distorted vocal effect',
      'Adds bite to guitars',
    ],
  },
  'add_chorus': {
    action: 'Apply chorus effect',
    effect: 'Creates width and thickness',
    musicalRationale: 'Adds richness and movement, creates ensemble effect',
    technicalDetails: 'Applies pitch-modulated delay for ensemble effect',
    typicalGoals: ['add richness', 'create width', 'add movement'],
    compatibleAxes: ['axis:richness' as AxisId, 'axis:width' as AxisId],
    riskLevel: 'low',
    examples: [
      'Thickens synth pads',
      'Adds ensemble feel to strings',
      'Creates 80s guitar sound',
    ],
  },
  'add_phaser': {
    action: 'Apply phaser effect',
    effect: 'Creates sweeping motion',
    musicalRationale: 'Adds movement and psychedelic character',
    technicalDetails: 'Applies all-pass filter modulation',
    typicalGoals: ['add movement', 'create character', 'add interest'],
    compatibleAxes: ['axis:movement' as AxisId, 'axis:character' as AxisId],
    riskLevel: 'low',
    examples: [
      'Creates sweeping pad motion',
      'Adds psychedelic guitar effect',
      'Creates vintage synth character',
    ],
  },
} as const;

/**
 * Get comprehensive explanation for an opcode.
 */
function getOpcodeExplanation(
  opcodeId: OpcodeId,
  context: {
    magnitude?: number;
    targetDescription?: string;
    goalDescription?: string;
  }
): Partial<StepExplanation> {
  const template = OPCODE_EXPLANATIONS[opcodeId];
  
  if (!template) {
    // Fallback for unknown opcodes
    return {
      action: opcodeId,
      effect: 'Applies transformation',
      description: `Apply ${opcodeId}`,
      rationale: [],
      confidence: 0.5,
    };
  }

  const magnitude = context.magnitude ?? 0.30;
  const magnitudeDesc = getMagnitudeDescription(magnitude);
  const target = context.targetDescription ?? 'selected elements';

  return {
    action: template.action,
    effect: template.effect,
    description: `${magnitudeDesc} ${template.action.toLowerCase()} to ${target}`,
    rationale: context.goalDescription
      ? [`To ${context.goalDescription}`, template.musicalRationale]
      : [template.musicalRationale],
    confidence: 0.85,
    technicalNote: template.technicalDetails,
    examples: template.examples,
  };
}

/**
 * Convert numeric magnitude to descriptive phrase.
 */
function getMagnitudeDescription(magnitude: number): string {
  if (magnitude < 0.10) return 'Very slightly';
  if (magnitude < 0.20) return 'Slightly';
  if (magnitude < 0.35) return 'Moderately';
  if (magnitude < 0.50) return 'Significantly';
  if (magnitude < 0.70) return 'Substantially';
  if (magnitude < 0.85) return 'Dramatically';
  return 'Extremely';
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
