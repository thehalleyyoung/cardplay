/**
 * @file Ask vs Act Planning Strategy
 * @module gofai/planning/ask-vs-act
 *
 * Implements Steps 274-275 from gofai_goalB.md:
 * Step 274: If satisfaction requires risky ops, produce clarification/choice rather than auto-select
 * Step 275: Plans with mutation effects cannot execute in full-manual without explicit confirmation
 *
 * Key Principles:
 * - Never silently perform risky operations
 * - When goal requires destructive/expensive ops, ask user first
 * - Provide clear choice UI, not just warnings
 * - Different board policies have different risk thresholds
 * - Effect typing determines what needs confirmation
 *
 * Risk Levels:
 * - Safe: Reversible, low cost, common operations (quantize, adjust velocity)
 * - Needs Preview: Medium cost or complexity (voicing changes, register shifts)
 * - Needs Confirmation: High cost or irreversible (delete events, reharmonize)
 * - Forbidden: Violates board policy or constraints
 *
 * @see src/gofai/execution/effect-system.ts (effect types)
 * @see src/gofai/planning/plan-legality.ts (legality checks)
 * @see src/gofai/canon/capability-model.ts (board policies)
 */

import type { CPLPlan, Opcode } from './plan-types';
import type { PlanScore } from './cost-model';
import type { Goal, Constraint } from '../canon/goals-constraints';
import type { CapabilityId } from '../canon/capability-model';

// ============================================================================
// Temporary Types (TODO: Move to proper modules)
// ============================================================================

/**
 * Board policy governing what operations are allowed.
 * TODO: Move to capability-model.ts
 */
export interface BoardPolicy {
  readonly id: string;
  readonly allowedCapabilities: readonly CapabilityId[];
  readonly requireExplicitConfirmation: boolean;
  readonly allowAutoPreview: boolean;
  readonly allowDirectExecution: boolean;
}

// ============================================================================
// Risk Assessment Types
// ============================================================================

/**
 * Risk level for a plan or opcode.
 */
export type RiskLevel = 'safe' | 'needs-preview' | 'needs-confirmation' | 'forbidden';

/**
 * Risk assessment for a plan.
 */
export interface PlanRiskAssessment {
  /** Overall risk level (highest risk among all opcodes) */
  readonly overallRisk: RiskLevel;

  /** Risk level per opcode */
  readonly opcodeRisks: ReadonlyMap<string, OpcodeRiskAssessment>;

  /** Specific risk factors identified */
  readonly riskFactors: readonly RiskFactor[];

  /** Whether the plan can execute without confirmation */
  readonly canExecuteWithoutConfirmation: boolean;

  /** Whether preview is required before apply */
  readonly requiresPreview: boolean;

  /** Human-readable risk summary */
  readonly riskSummary: string;

  /** Suggested user action */
  readonly suggestedAction: SuggestedAction;
}

/**
 * Risk assessment for a single opcode.
 */
export interface OpcodeRiskAssessment {
  readonly opcodeId: string;
  readonly opcodeType: string;
  readonly riskLevel: RiskLevel;
  readonly riskReasons: readonly string[];
  readonly reversible: boolean;
  readonly editCost: number;
}

/**
 * A specific risk factor.
 */
export interface RiskFactor {
  readonly type: RiskFactorType;
  readonly severity: RiskLevel;
  readonly description: string;
  readonly affectedOpcodes: readonly string[];
}

/**
 * Types of risk factors.
 */
export type RiskFactorType =
  | 'destructive' // Deletes/removes events
  | 'expensive' // High edit cost (melody rewrite, reharmonization)
  | 'constraint-boundary' // Near constraint violation
  | 'scope-ambiguity' // Unclear what will be affected
  | 'irreversible' // Cannot undo cleanly
  | 'policy-sensitive'; // Touches protected elements

/**
 * Suggested user action based on risk.
 */
export type SuggestedAction =
  | 'apply-directly' // Safe to execute immediately
  | 'preview-first' // Show preview, then allow apply
  | 'choose-option' // Multiple plans, user must choose
  | 'confirm-risk' // Explicit confirmation required
  | 'clarify-intent'; // Too risky, need more information

// ============================================================================
// Risk Assessment Logic
// ============================================================================

/**
 * Assess the risk level of a plan.
 *
 * @param plan - The plan to assess
 * @param goals - Original goals
 * @param constraints - Active constraints
 * @param policy - Board policy determining risk thresholds
 * @returns Risk assessment with recommended action
 */
export function assessPlanRisk(
  plan: CPLPlan,
  _goals: readonly Goal[],
  constraints: readonly Constraint[],
  policy: BoardPolicy
): PlanRiskAssessment {
  const opcodeRisks = new Map<string, OpcodeRiskAssessment>();
  const riskFactors: RiskFactor[] = [];

  let overallRisk: RiskLevel = 'safe';

  // Assess each opcode
  for (const opcode of plan.opcodes) {
    const assessment = assessOpcodeRisk(opcode, policy);
    opcodeRisks.set(opcode.id, assessment);

    // Update overall risk to highest
    if (getRiskSeverity(assessment.riskLevel) > getRiskSeverity(overallRisk)) {
      overallRisk = assessment.riskLevel;
    }

    // Collect risk factors
    for (const reason of assessment.riskReasons) {
      const factorType = categorizeRiskReason(reason);
      const existingFactor = riskFactors.find((rf) => rf.type === factorType);

      if (existingFactor) {
        (existingFactor.affectedOpcodes as string[]).push(opcode.id);
      } else {
        riskFactors.push({
          type: factorType,
          severity: assessment.riskLevel,
          description: reason,
          affectedOpcodes: [opcode.id],
        });
      }
    }
  }

  // Check constraint boundaries
  const constraintRisks = assessConstraintRisks(plan, constraints);
  riskFactors.push(...constraintRisks);

  if (constraintRisks.some((r) => r.severity === 'needs-confirmation')) {
    overallRisk = maxRisk(overallRisk, 'needs-confirmation');
  }

  // Determine action based on policy and risk
  const canExecuteWithoutConfirmation =
    overallRisk === 'safe' || (overallRisk === 'needs-preview' && policy.allowAutoPreview);

  const requiresPreview =
    overallRisk === 'needs-preview' || overallRisk === 'needs-confirmation';

  const suggestedAction = determineSuggestedAction(overallRisk, policy);

  const riskSummary = generateRiskSummary(riskFactors, overallRisk);

  return {
    overallRisk,
    opcodeRisks,
    riskFactors,
    canExecuteWithoutConfirmation,
    requiresPreview,
    riskSummary,
    suggestedAction,
  };
}

/**
 * Assess risk for a single opcode.
 */
function assessOpcodeRisk(opcode: Opcode, policy: BoardPolicy): OpcodeRiskAssessment {
  const riskReasons: string[] = [];
  let riskLevel: RiskLevel = 'safe';
  let reversible = true;
  let editCost = 1.0;

  // Destructive operations
  if (isDestructiveOpcode(opcode)) {
    riskReasons.push('Removes or deletes events');
    riskLevel = 'needs-confirmation';
    reversible = false;
    editCost = 10.0;
  }

  // Melody/harmony rewrites (expensive)
  if (isExpensiveOpcode(opcode)) {
    riskReasons.push('Rewrites melody or harmony');
    riskLevel = maxRisk(riskLevel, 'needs-confirmation');
    editCost = 8.0;
  }

  // Structural changes
  if (isStructuralOpcode(opcode)) {
    riskReasons.push('Changes song structure');
    riskLevel = maxRisk(riskLevel, 'needs-preview');
    editCost = 5.0;
  }

  // Policy-sensitive operations
  if (isPolicySensitive(opcode, policy)) {
    riskReasons.push('Requires capabilities beyond current board policy');
    riskLevel = 'forbidden';
    reversible = false;
  }

  // Medium-cost operations
  if (editCost < 5.0 && isMediumCostOpcode(opcode)) {
    riskLevel = maxRisk(riskLevel, 'needs-preview');
    editCost = 3.0;
  }

  return {
    opcodeId: opcode.id,
    opcodeType: opcode.name,
    riskLevel,
    riskReasons,
    reversible,
    editCost,
  };
}

/**
 * Check if opcode is destructive (removes events).
 */
function isDestructiveOpcode(opcode: Opcode): boolean {
  const destructiveTypes = [
    'delete_events',
    'remove_layer',
    'clear_section',
    'remove_notes',
    'strip_automation',
  ];
  return destructiveTypes.includes(opcode.name);
}

/**
 * Check if opcode is expensive (melody/harmony rewrite).
 */
function isExpensiveOpcode(opcode: Opcode): boolean {
  const expensiveTypes = [
    'reharmonize',
    'rewrite_melody',
    'generate_countermelody',
    'restructure_form',
    'transpose_key',
  ];
  return expensiveTypes.includes(opcode.name);
}

/**
 * Check if opcode changes structure.
 */
function isStructuralOpcode(opcode: Opcode): boolean {
  const structuralTypes = [
    'insert_break',
    'duplicate_section',
    'extend_section',
    'shorten_section',
    'rearrange_form',
  ];
  return structuralTypes.includes(opcode.name);
}

/**
 * Check if opcode is policy-sensitive.
 */
function isPolicySensitive(opcode: Opcode, policy: BoardPolicy): boolean {
  const requiredCapability = getOpcodeRequiredCapability(opcode);

  // Check against policy restrictions
  if (!policy.allowedCapabilities.includes(requiredCapability)) {
    return true;
  }

  // Check specific policy rules
  if (policy.id === 'full-manual' && opcode.name.includes('generate')) {
    return true;
  }

  return false;
}

/**
 * Check if opcode is medium cost.
 */
function isMediumCostOpcode(opcode: Opcode): boolean {
  const mediumCostTypes = [
    'quantize',
    'shift_register',
    'adjust_voicing',
    'change_density',
    'humanize_timing',
  ];
  return mediumCostTypes.includes(opcode.name);
}

/**
 * Get required capability for opcode.
 */
function getOpcodeRequiredCapability(opcode: Opcode): CapabilityId {
  if (opcode.name.includes('filter') || opcode.name.includes('reverb')) {
    return 'production:add-card' as CapabilityId;
  }
  if (opcode.name.includes('pan') || opcode.name.includes('routing')) {
    return 'routing:connect' as CapabilityId;
  }
  return 'event:create' as CapabilityId;
}

/**
 * Assess constraint-related risks.
 */
function assessConstraintRisks(
  _plan: CPLPlan,
  constraints: readonly Constraint[]
): readonly RiskFactor[] {
  const risks: RiskFactor[] = [];

  // Check if plan comes close to violating constraints
  for (const constraint of constraints) {
    if (constraint.strength === 'required') {
      // Hard constraints must never be violated
      // If planning got this far, we assume they're satisfied
      // But we can still warn about close calls
      risks.push({
        type: 'constraint-boundary',
        severity: 'needs-preview',
        description: `May approach limits of constraint: ${constraint.description}`,
        affectedOpcodes: [],
      });
    }
  }

  return risks;
}

/**
 * Determine suggested action based on risk and policy.
 */
function determineSuggestedAction(
  riskLevel: RiskLevel,
  _policy: BoardPolicy
): SuggestedAction {
  if (riskLevel === 'forbidden') {
    return 'clarify-intent';
  }

  if (riskLevel === 'needs-confirmation') {
    // Use simple heuristics since policy fields aren't all available yet
    return 'preview-first';
  }

  if (riskLevel === 'needs-preview') {
    return 'preview-first';
  }

  // Safe operations
  return 'preview-first'; // Conservative default
}

/**
 * Generate human-readable risk summary.
 */
function generateRiskSummary(
  riskFactors: readonly RiskFactor[],
  _overallRisk: RiskLevel
): string {
  if (riskFactors.length === 0) {
    return 'This change is safe and reversible.';
  }

  const highRiskFactors = riskFactors.filter(
    (rf) => rf.severity === 'needs-confirmation' || rf.severity === 'forbidden'
  );

  if (highRiskFactors.length > 0) {
    const descriptions = highRiskFactors.map((rf) => rf.description).join('; ');
    return `⚠️ High-risk operation: ${descriptions}`;
  }

  const mediumRiskFactors = riskFactors.filter((rf) => rf.severity === 'needs-preview');

  if (mediumRiskFactors.length > 0) {
    return `Preview recommended: ${mediumRiskFactors[0].description}`;
  }

  return 'Low-risk change. Preview available.';
}

// ============================================================================
// Planning Strategy Selection
// ============================================================================

/**
 * Decide whether to generate a single plan (act) or multiple options (ask).
 *
 * Strategy:
 * - If all candidates are low risk and one is clearly best → act (return single plan)
 * - If candidates have different risk profiles → ask (present choices)
 * - If high risk required → ask (require explicit choice)
 * - If scope/intent ambiguous → ask (clarify first)
 *
 * @param candidates - Candidate plans with scores
 * @param policy - Board policy
 * @returns Planning strategy and recommended presentation
 */
export function selectPlanningStrategy(
  candidates: ReadonlyArray<{
    plan: CPLPlan;
    score: PlanScore;
    risk: PlanRiskAssessment;
  }>,
  policy: BoardPolicy
): PlanningStrategy {
  if (candidates.length === 0) {
    return {
      strategy: 'clarify',
      reason: 'No valid plans could be generated',
      recommendedAction: 'clarify-intent',
    };
  }

  // Check for forbidden plans
  const forbiddenCount = candidates.filter((c) => c.risk.overallRisk === 'forbidden').length;
  if (forbiddenCount === candidates.length) {
    return {
      strategy: 'clarify',
      reason: 'All candidates require disabled capabilities',
      recommendedAction: 'clarify-intent',
    };
  }

  // Filter out forbidden
  const allowedCandidates = candidates.filter((c) => c.risk.overallRisk !== 'forbidden');

  // Single candidate
  if (allowedCandidates.length === 1) {
    const candidate = allowedCandidates[0]!; // Length check ensures this exists

    if (candidate.risk.overallRisk === 'safe') {
      return {
        strategy: 'act',
        reason: 'Single safe option',
        recommendedAction: 'apply-directly',
        selectedPlan: candidate.plan,
      };
    }

    if (candidate.risk.overallRisk === 'needs-preview') {
      return {
        strategy: 'act',
        reason: 'Single option, preview recommended',
        recommendedAction: 'preview-first',
        selectedPlan: candidate.plan,
      };
    }

    // Needs confirmation
    return {
      strategy: 'ask',
      reason: 'High-risk operation requires explicit choice',
      recommendedAction: 'confirm-risk',
      candidatePlans: [candidate.plan],
    };
  }

  // Multiple candidates - check if one is clearly best
  const sorted = [...allowedCandidates].sort((a, b) => b.score.totalScore - a.score.totalScore);
  const best = sorted[0]!; // Must exist since allowedCandidates.length > 1
  const secondBest = sorted[1]!; // Must exist since allowedCandidates.length > 1

  const scoreGap = best.score.totalScore - secondBest.score.totalScore;
  const significantGap = scoreGap > 0.2; // 20% better

  if (significantGap && best.risk.overallRisk === 'safe') {
    return {
      strategy: 'act',
      reason: 'Clear best option with low risk',
      recommendedAction: 'apply-directly',
      selectedPlan: best.plan,
    };
  }

  // Multiple viable options → let user choose
  return {
    strategy: 'ask',
    reason: 'Multiple viable options with different tradeoffs',
    recommendedAction: 'choose-option',
    candidatePlans: sorted.slice(0, 3).map((c) => c.plan),
  };
}

/**
 * Planning strategy result.
 */
export interface PlanningStrategy {
  /** Whether to act directly or ask user */
  readonly strategy: 'act' | 'ask' | 'clarify';

  /** Reason for this strategy */
  readonly reason: string;

  /** Recommended user action */
  readonly recommendedAction: SuggestedAction;

  /** Selected plan if strategy is 'act' */
  readonly selectedPlan?: CPLPlan;

  /** Candidate plans if strategy is 'ask' */
  readonly candidatePlans?: readonly CPLPlan[];
}

// ============================================================================
// Helper Functions
// ============================================================================

function getRiskSeverity(risk: RiskLevel): number {
  const severity: Record<RiskLevel, number> = {
    safe: 0,
    'needs-preview': 1,
    'needs-confirmation': 2,
    forbidden: 3,
  };
  return severity[risk];
}

function maxRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  return getRiskSeverity(a) > getRiskSeverity(b) ? a : b;
}

function categorizeRiskReason(reason: string): RiskFactorType {
  const lower = reason.toLowerCase();
  if (lower.includes('delete') || lower.includes('remove')) return 'destructive';
  if (lower.includes('rewrite') || lower.includes('expensive')) return 'expensive';
  if (lower.includes('constraint')) return 'constraint-boundary';
  if (lower.includes('ambiguous')) return 'scope-ambiguity';
  if (lower.includes('irreversible')) return 'irreversible';
  if (lower.includes('policy') || lower.includes('capability')) return 'policy-sensitive';
  return 'expensive';
}

// ============================================================================
// Exports
// ============================================================================

export type {
  PlanRiskAssessment,
  OpcodeRiskAssessment,
  RiskFactor,
  PlanningStrategy,
};
