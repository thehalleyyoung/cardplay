/**
 * GOFAI NL Semantics — Pragmatic Bias Layer
 *
 * Pushes ambiguous parses into clarification rather than unsafe execution.
 * This module sits between semantic analysis (scope resolution, degree
 * semantics, quantifier interpretation) and the downstream planning engine.
 *
 * ## Why pragmatic bias?
 *
 * A parser that reports "5 readings" is only useful if the system can decide
 * which readings are safe to collapse, which require user input, and which
 * can be deferred to the planner. This module encodes pragmatic heuristics:
 *
 * 1. **Safety-first**: If any reading could cause destructive edits, clarify.
 * 2. **Confidence gating**: If the top reading is far ahead, apply it silently.
 * 3. **Minimality**: Don't ask what can be inferred from context or defaults.
 * 4. **Deferability**: Prefer planning-time resolution over user interruption.
 * 5. **Severity calibration**: Match ambiguity severity to intervention level.
 *
 * @module gofai/nl/semantics/pragmatic-bias
 * @see gofai_goalA.md Step 139
 */

// =============================================================================
// TYPE DEFINITIONS — Bias Assessment
// =============================================================================

/**
 * Risk level for a single interpretation of an ambiguous utterance.
 */
export type InterpretationRisk = 'safe' | 'low' | 'moderate' | 'high' | 'destructive';

/**
 * How an ambiguity should be resolved.
 */
export type BiasDecision =
  | { readonly type: 'clarify'; readonly reason: string; readonly urgency: BiasUrgency }
  | { readonly type: 'apply_default'; readonly defaultIndex: number; readonly reason: string }
  | { readonly type: 'defer_to_planning'; readonly reason: string }
  | { readonly type: 'merge_equivalent'; readonly equivalentIndices: readonly number[]; readonly reason: string }
  | { readonly type: 'reject'; readonly reason: string };

/**
 * How urgently clarification is needed.
 */
export type BiasUrgency = 'immediate' | 'before_execution' | 'advisory';

/**
 * Category of ambiguity from a pragmatic standpoint.
 */
export type AmbiguityCategory =
  | 'lexical'        // Word has multiple senses
  | 'structural'     // Attachment / grouping ambiguity
  | 'scope'          // Quantifier / negation scope
  | 'reference'      // Which entity is meant
  | 'degree'         // How much change
  | 'temporal'       // When / what order
  | 'modal'          // Obligation vs. permission vs. suggestion
  | 'pragmatic';     // Implicature / indirectness

/**
 * A single interpretation candidate with its risk profile.
 */
export interface InterpretationCandidate {
  readonly index: number;
  readonly score: number;               // 0–1 confidence
  readonly risk: InterpretationRisk;
  readonly category: AmbiguityCategory;
  readonly description: string;
  readonly reversible: boolean;
  readonly affectedScope: AffectedScope;
  readonly paraphrase: string;
}

/**
 * Scope of what an interpretation affects.
 */
export type AffectedScope =
  | 'none'           // No change
  | 'single_param'   // One parameter tweak
  | 'single_event'   // One edit event
  | 'multi_event'    // Multiple edit events
  | 'section'        // Entire section
  | 'global';        // Whole project

/**
 * Risk profile aggregated across all interpretations.
 */
export interface RiskProfile {
  readonly worstCase: InterpretationRisk;
  readonly bestCase: InterpretationRisk;
  readonly averageRisk: number;            // 0–1 scale
  readonly destructiveCount: number;
  readonly safeCount: number;
  readonly totalCount: number;
  readonly allReversible: boolean;
  readonly maxAffectedScope: AffectedScope;
}

/**
 * Confidence analysis for the top interpretation.
 */
export interface ConfidenceProfile {
  readonly topScore: number;
  readonly secondScore: number;
  readonly gap: number;                    // topScore - secondScore
  readonly topIsConfident: boolean;        // gap > SCORE_GAP_THRESHOLD
  readonly topIsDominant: boolean;         // top > CONFIDENCE_THRESHOLD
  readonly distribution: ConfidenceDistribution;
}

/**
 * How scores are distributed across candidates.
 */
export type ConfidenceDistribution =
  | 'dominant'       // One clear winner
  | 'bimodal'        // Two strong clusters
  | 'uniform'        // All roughly equal — maximally ambiguous
  | 'skewed';        // One weak winner, long tail

/**
 * Full bias assessment result.
 */
export interface PragmaticBiasAssessment {
  readonly decision: BiasDecision;
  readonly riskProfile: RiskProfile;
  readonly confidenceProfile: ConfidenceProfile;
  readonly candidates: readonly InterpretationCandidate[];
  readonly deferralReasons: readonly DeferralReason[];
  readonly biasFactors: readonly BiasFactor[];
  readonly explanation: string;
}

/**
 * Reason why an ambiguity can be deferred.
 */
export interface DeferralReason {
  readonly type: DeferralType;
  readonly description: string;
  readonly confidence: number;   // 0–1 how confident we are deferral is safe
}

/**
 * Categories of deferral.
 */
export type DeferralType =
  | 'planning_can_resolve'     // Planner has enough info
  | 'context_will_disambiguate' // Later input will clarify
  | 'all_readings_equivalent'  // Different readings → same effect
  | 'safe_default_exists'      // A safe default can be applied
  | 'reversible_action'        // Can undo if wrong
  | 'low_severity';            // Difference is negligible

/**
 * A factor that influenced the bias decision.
 */
export interface BiasFactor {
  readonly name: string;
  readonly weight: number;       // -1 to +1 (negative → defer, positive → clarify)
  readonly description: string;
}

// =============================================================================
// THRESHOLDS — Configurable pragmatic parameters
// =============================================================================

/**
 * Default pragmatic bias thresholds.
 */
export interface BiasThresholds {
  /** Minimum score for top candidate to be considered dominant. Default: 0.75. */
  readonly confidenceThreshold: number;
  /** Minimum gap between top two scores to skip clarification. Default: 0.15. */
  readonly scoreGapThreshold: number;
  /** Maximum number of viable candidates before forcing clarification. Default: 4. */
  readonly maxViableCandidates: number;
  /** Risk level at or above which clarification is mandatory. Default: 'high'. */
  readonly mandatoryClarificationRisk: InterpretationRisk;
  /** Whether reversible actions can skip clarification. Default: true. */
  readonly allowReversibleSkip: boolean;
  /** Whether planning-time deferral is enabled. Default: true. */
  readonly allowDeferral: boolean;
  /** Minimum confidence for safe-default application. Default: 0.6. */
  readonly safeDefaultMinConfidence: number;
  /** Weight for surface scope preference in bias scoring. Default: 0.3. */
  readonly surfaceScopeWeight: number;
  /** Weight for specificity preference. Default: 0.2. */
  readonly specificityWeight: number;
  /** Weight for safety preference. Default: 0.5. */
  readonly safetyWeight: number;
}

/**
 * Default threshold values.
 */
export const DEFAULT_BIAS_THRESHOLDS: BiasThresholds = {
  confidenceThreshold: 0.75,
  scoreGapThreshold: 0.15,
  maxViableCandidates: 4,
  mandatoryClarificationRisk: 'high',
  allowReversibleSkip: true,
  allowDeferral: true,
  safeDefaultMinConfidence: 0.6,
  surfaceScopeWeight: 0.3,
  specificityWeight: 0.2,
  safetyWeight: 0.5,
};

// =============================================================================
// RISK SCORING — Map interpretation properties to risk levels
// =============================================================================

const RISK_NUMERIC: ReadonlyMap<InterpretationRisk, number> = new Map([
  ['safe', 0.0],
  ['low', 0.25],
  ['moderate', 0.5],
  ['high', 0.75],
  ['destructive', 1.0],
]);

const SCOPE_RISK: ReadonlyMap<AffectedScope, number> = new Map([
  ['none', 0.0],
  ['single_param', 0.1],
  ['single_event', 0.2],
  ['multi_event', 0.5],
  ['section', 0.7],
  ['global', 1.0],
]);

const SCOPE_ORDERING: readonly AffectedScope[] = [
  'none', 'single_param', 'single_event', 'multi_event', 'section', 'global',
];

const RISK_ORDERING: readonly InterpretationRisk[] = [
  'safe', 'low', 'moderate', 'high', 'destructive',
];

/**
 * Get numeric risk value.
 */
function riskNumeric(risk: InterpretationRisk): number {
  return RISK_NUMERIC.get(risk) ?? 0.5;
}

/**
 * Get numeric scope severity.
 */
function scopeNumeric(scope: AffectedScope): number {
  return SCOPE_RISK.get(scope) ?? 0.5;
}

/**
 * Compare two risk levels. Returns positive if a > b.
 */
function compareRisk(a: InterpretationRisk, b: InterpretationRisk): number {
  return riskNumeric(a) - riskNumeric(b);
}

/**
 * Compare two scopes. Returns positive if a > b.
 */
function compareScope(a: AffectedScope, b: AffectedScope): number {
  return scopeNumeric(a) - scopeNumeric(b);
}

/**
 * Get the maximum risk from a list of risks.
 */
function maxRisk(risks: readonly InterpretationRisk[]): InterpretationRisk {
  let worst: InterpretationRisk = 'safe';
  for (const r of risks) {
    if (compareRisk(r, worst) > 0) worst = r;
  }
  return worst;
}

/**
 * Get the minimum risk from a list of risks.
 */
function minRisk(risks: readonly InterpretationRisk[]): InterpretationRisk {
  let best: InterpretationRisk = 'destructive';
  for (const r of risks) {
    if (compareRisk(r, best) < 0) best = r;
  }
  return best;
}

/**
 * Get the maximum scope from a list.
 */
function maxScope(scopes: readonly AffectedScope[]): AffectedScope {
  let worst: AffectedScope = 'none';
  for (const s of scopes) {
    if (compareScope(s, worst) > 0) worst = s;
  }
  return worst;
}

// =============================================================================
// RISK PROFILE — Aggregate risk across candidates
// =============================================================================

/**
 * Build a risk profile from a set of interpretation candidates.
 */
export function buildRiskProfile(
  candidates: readonly InterpretationCandidate[],
): RiskProfile {
  if (candidates.length === 0) {
    return {
      worstCase: 'safe',
      bestCase: 'safe',
      averageRisk: 0,
      destructiveCount: 0,
      safeCount: 0,
      totalCount: 0,
      allReversible: true,
      maxAffectedScope: 'none',
    };
  }

  const risks = candidates.map(c => c.risk);
  const scopes = candidates.map(c => c.affectedScope);

  const totalRisk = candidates.reduce((sum, c) => sum + riskNumeric(c.risk), 0);

  return {
    worstCase: maxRisk(risks),
    bestCase: minRisk(risks),
    averageRisk: totalRisk / candidates.length,
    destructiveCount: candidates.filter(c => c.risk === 'destructive').length,
    safeCount: candidates.filter(c => c.risk === 'safe').length,
    totalCount: candidates.length,
    allReversible: candidates.every(c => c.reversible),
    maxAffectedScope: maxScope(scopes),
  };
}

// =============================================================================
// CONFIDENCE PROFILE — Analyze score distribution
// =============================================================================

/**
 * Build a confidence profile from sorted candidates (highest score first).
 */
export function buildConfidenceProfile(
  candidates: readonly InterpretationCandidate[],
  thresholds: BiasThresholds = DEFAULT_BIAS_THRESHOLDS,
): ConfidenceProfile {
  const sorted = [...candidates].sort((a, b) => b.score - a.score);

  const topScore = sorted.length > 0 ? sorted[0]!.score : 0;
  const secondScore = sorted.length > 1 ? sorted[1]!.score : 0;
  const gap = topScore - secondScore;

  return {
    topScore,
    secondScore,
    gap,
    topIsConfident: gap >= thresholds.scoreGapThreshold,
    topIsDominant: topScore >= thresholds.confidenceThreshold,
    distribution: classifyDistribution(sorted.map(c => c.score)),
  };
}

/**
 * Classify how scores are distributed.
 */
function classifyDistribution(scores: readonly number[]): ConfidenceDistribution {
  if (scores.length <= 1) return 'dominant';

  const max = scores[0] ?? 0;
  const min = scores[scores.length - 1] ?? 0;
  const range = max - min;

  if (range < 0.1) return 'uniform';

  // Check bimodal: is there a gap in the middle?
  const sorted = [...scores].sort((a, b) => b - a);
  let maxGap = 0;
  let gapIndex = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    const g = sorted[i]! - sorted[i + 1]!;
    if (g > maxGap) {
      maxGap = g;
      gapIndex = i;
    }
  }

  // Clear winner with big gap at top
  if (gapIndex === 0 && maxGap > 0.2) return 'dominant';

  // Gap in the middle → bimodal
  if (gapIndex > 0 && gapIndex < sorted.length - 1 && maxGap > 0.15) return 'bimodal';

  // Top is ahead but not by a lot
  if (sorted[0]! - sorted[1]! > 0.05) return 'skewed';

  return 'uniform';
}

// =============================================================================
// DEFERRAL ANALYSIS — Can ambiguity be resolved without the user?
// =============================================================================

/**
 * Analyze whether ambiguity can be deferred to a later stage.
 */
export function analyzeDeferral(
  candidates: readonly InterpretationCandidate[],
  riskProfile: RiskProfile,
  confidenceProfile: ConfidenceProfile,
  thresholds: BiasThresholds = DEFAULT_BIAS_THRESHOLDS,
): readonly DeferralReason[] {
  const reasons: DeferralReason[] = [];

  if (!thresholds.allowDeferral) return reasons;

  // All readings produce the same observable effect
  if (allReadingsEquivalent(candidates)) {
    reasons.push({
      type: 'all_readings_equivalent',
      description: 'All interpretations produce the same edit effect.',
      confidence: 0.95,
    });
  }

  // All actions are reversible
  if (riskProfile.allReversible && riskProfile.worstCase !== 'destructive') {
    reasons.push({
      type: 'reversible_action',
      description: 'All interpretations are reversible; can undo if wrong.',
      confidence: 0.8,
    });
  }

  // Safe default exists with good confidence
  if (confidenceProfile.topIsDominant && confidenceProfile.topIsConfident) {
    const topCandidate = [...candidates].sort((a, b) => b.score - a.score)[0];
    if (topCandidate && (topCandidate.risk === 'safe' || topCandidate.risk === 'low')) {
      reasons.push({
        type: 'safe_default_exists',
        description: `Top interpretation "${topCandidate.description}" is safe and confident (${(topCandidate.score * 100).toFixed(0)}%).`,
        confidence: topCandidate.score,
      });
    }
  }

  // Low severity: all safe or low risk
  if (riskProfile.worstCase === 'safe' || riskProfile.worstCase === 'low') {
    reasons.push({
      type: 'low_severity',
      description: 'All interpretations have low or no risk.',
      confidence: 0.9,
    });
  }

  // Planner can resolve with more context
  if (riskProfile.worstCase !== 'destructive' && candidates.length <= thresholds.maxViableCandidates) {
    const nonTrivial = candidates.filter(c => c.risk !== 'safe');
    if (nonTrivial.length <= 2) {
      reasons.push({
        type: 'planning_can_resolve',
        description: 'Planner can resolve among few viable candidates with additional context.',
        confidence: 0.65,
      });
    }
  }

  return reasons;
}

/**
 * Check if all candidates would produce the same observable effect.
 * Uses a heuristic: same category + same scope + similar descriptions.
 */
function allReadingsEquivalent(candidates: readonly InterpretationCandidate[]): boolean {
  if (candidates.length <= 1) return true;

  const first = candidates[0]!;
  return candidates.every(
    c =>
      c.category === first.category &&
      c.affectedScope === first.affectedScope &&
      c.risk === first.risk &&
      c.reversible === first.reversible,
  );
}

// =============================================================================
// BIAS FACTORS — Individual signals that influence the decision
// =============================================================================

/**
 * Compute individual bias factors that influence the final decision.
 */
export function computeBiasFactors(
  candidates: readonly InterpretationCandidate[],
  riskProfile: RiskProfile,
  confidenceProfile: ConfidenceProfile,
  thresholds: BiasThresholds = DEFAULT_BIAS_THRESHOLDS,
): readonly BiasFactor[] {
  const factors: BiasFactor[] = [];

  // 1. Safety factor — high risk pushes toward clarification
  const safetyWeight = riskProfile.averageRisk * thresholds.safetyWeight;
  factors.push({
    name: 'safety',
    weight: safetyWeight,
    description: `Average risk ${(riskProfile.averageRisk * 100).toFixed(0)}% (worst: ${riskProfile.worstCase}).`,
  });

  // 2. Destructive penalty — any destructive reading forces clarification
  if (riskProfile.destructiveCount > 0) {
    factors.push({
      name: 'destructive_reading',
      weight: 1.0,
      description: `${riskProfile.destructiveCount} interpretation(s) could cause destructive edits.`,
    });
  }

  // 3. Confidence bonus — high confidence pushes toward applying default
  const confidenceBonus = confidenceProfile.topIsDominant
    ? -confidenceProfile.topScore * 0.5
    : 0;
  if (confidenceBonus !== 0) {
    factors.push({
      name: 'top_confidence',
      weight: confidenceBonus,
      description: `Top reading at ${(confidenceProfile.topScore * 100).toFixed(0)}% confidence.`,
    });
  }

  // 4. Score gap bonus — clear winner pushes toward applying default
  const gapBonus = confidenceProfile.topIsConfident
    ? -confidenceProfile.gap * 0.4
    : 0;
  if (gapBonus !== 0) {
    factors.push({
      name: 'score_gap',
      weight: gapBonus,
      description: `Score gap of ${(confidenceProfile.gap * 100).toFixed(0)}% between top two readings.`,
    });
  }

  // 5. Uniform distribution penalty — maximally ambiguous
  if (confidenceProfile.distribution === 'uniform') {
    factors.push({
      name: 'uniform_ambiguity',
      weight: 0.3,
      description: 'Interpretations are uniformly distributed (maximally ambiguous).',
    });
  }

  // 6. Candidate count factor — many candidates → more ambiguous
  if (candidates.length > thresholds.maxViableCandidates) {
    factors.push({
      name: 'excess_candidates',
      weight: 0.2,
      description: `${candidates.length} candidates exceed maximum viable count (${thresholds.maxViableCandidates}).`,
    });
  }

  // 7. Reversibility bonus — all reversible → lower urgency
  if (riskProfile.allReversible) {
    factors.push({
      name: 'all_reversible',
      weight: -0.15,
      description: 'All interpretations are reversible.',
    });
  }

  // 8. Scope severity — global scope pushes toward clarification
  const scopeSeverity = scopeNumeric(riskProfile.maxAffectedScope) * 0.3;
  if (scopeSeverity > 0.1) {
    factors.push({
      name: 'scope_severity',
      weight: scopeSeverity,
      description: `Maximum affected scope: ${riskProfile.maxAffectedScope}.`,
    });
  }

  // 9. Category-specific biases
  const categoryFactors = computeCategoryBias(candidates);
  factors.push(...categoryFactors);

  return factors;
}

/**
 * Category-specific pragmatic biases from linguistics.
 */
function computeCategoryBias(
  candidates: readonly InterpretationCandidate[],
): readonly BiasFactor[] {
  const factors: BiasFactor[] = [];
  const categories = new Set(candidates.map(c => c.category));

  // Scope ambiguity: linguistically common, often resolvable by convention
  if (categories.has('scope')) {
    factors.push({
      name: 'scope_convention',
      weight: -0.1,
      description: 'Scope ambiguity often follows surface order convention.',
    });
  }

  // Degree ambiguity: "how much" is subjective but usually low-risk
  if (categories.has('degree')) {
    factors.push({
      name: 'degree_subjectivity',
      weight: -0.05,
      description: 'Degree ambiguity is subjective; defaults are usually safe.',
    });
  }

  // Reference ambiguity: getting the wrong entity is risky
  if (categories.has('reference')) {
    factors.push({
      name: 'reference_sensitivity',
      weight: 0.2,
      description: 'Reference ambiguity: wrong entity could cause unintended edits.',
    });
  }

  // Modal ambiguity: obligation vs. suggestion matters
  if (categories.has('modal')) {
    factors.push({
      name: 'modal_confusion',
      weight: 0.15,
      description: 'Modal ambiguity: obligation vs. suggestion affects execution.',
    });
  }

  return factors;
}

// =============================================================================
// ASSESSMENT — Main pragmatic bias computation
// =============================================================================

/**
 * Compute a full pragmatic bias assessment for a set of interpretation candidates.
 *
 * This is the main entry point. It analyzes confidence, risk, deferral options,
 * and bias factors to produce a final decision about how to handle ambiguity.
 */
export function assessPragmaticBias(
  candidates: readonly InterpretationCandidate[],
  thresholds: BiasThresholds = DEFAULT_BIAS_THRESHOLDS,
): PragmaticBiasAssessment {
  // Edge cases
  if (candidates.length === 0) {
    return makeAssessment(
      { type: 'reject', reason: 'No interpretation candidates.' },
      [],
      DEFAULT_BIAS_THRESHOLDS,
    );
  }

  if (candidates.length === 1) {
    const only = candidates[0]!;
    if (only.risk === 'destructive') {
      return makeAssessment(
        {
          type: 'clarify',
          reason: `Only interpretation is destructive: "${only.description}".`,
          urgency: 'immediate',
        },
        candidates,
        thresholds,
      );
    }
    return makeAssessment(
      {
        type: 'apply_default',
        defaultIndex: only.index,
        reason: `Single interpretation: "${only.description}".`,
      },
      candidates,
      thresholds,
    );
  }

  // Build profiles
  const riskProfile = buildRiskProfile(candidates);
  const confidenceProfile = buildConfidenceProfile(candidates, thresholds);
  const deferralReasons = analyzeDeferral(candidates, riskProfile, confidenceProfile, thresholds);
  const biasFactors = computeBiasFactors(candidates, riskProfile, confidenceProfile, thresholds);

  // Decision logic — ordered from most to least decisive

  // Rule 1: Any destructive reading → mandatory clarification
  if (riskProfile.destructiveCount > 0) {
    return {
      decision: {
        type: 'clarify',
        reason: `${riskProfile.destructiveCount} destructive interpretation(s) detected.`,
        urgency: 'immediate',
      },
      riskProfile,
      confidenceProfile,
      candidates,
      deferralReasons,
      biasFactors,
      explanation: formatExplanation('clarify', biasFactors),
    };
  }

  // Rule 2: All readings equivalent → merge
  if (allReadingsEquivalent(candidates)) {
    return {
      decision: {
        type: 'merge_equivalent',
        equivalentIndices: candidates.map(c => c.index),
        reason: 'All interpretations produce the same observable effect.',
      },
      riskProfile,
      confidenceProfile,
      candidates,
      deferralReasons,
      biasFactors,
      explanation: formatExplanation('merge', biasFactors),
    };
  }

  // Rule 3: Risk above mandatory threshold → clarify
  const mandatoryIdx = RISK_ORDERING.indexOf(thresholds.mandatoryClarificationRisk);
  const worstIdx = RISK_ORDERING.indexOf(riskProfile.worstCase);
  if (worstIdx >= mandatoryIdx) {
    return {
      decision: {
        type: 'clarify',
        reason: `Worst-case risk (${riskProfile.worstCase}) meets mandatory clarification threshold.`,
        urgency: 'before_execution',
      },
      riskProfile,
      confidenceProfile,
      candidates,
      deferralReasons,
      biasFactors,
      explanation: formatExplanation('clarify', biasFactors),
    };
  }

  // Rule 4: Confident top candidate + safe → apply default
  if (
    confidenceProfile.topIsDominant &&
    confidenceProfile.topIsConfident
  ) {
    const sorted = [...candidates].sort((a, b) => b.score - a.score);
    const top = sorted[0]!;
    if (top.risk === 'safe' || top.risk === 'low') {
      return {
        decision: {
          type: 'apply_default',
          defaultIndex: top.index,
          reason: `Top interpretation confident (${(top.score * 100).toFixed(0)}%) and safe.`,
        },
        riskProfile,
        confidenceProfile,
        candidates,
        deferralReasons,
        biasFactors,
        explanation: formatExplanation('apply_default', biasFactors),
      };
    }
  }

  // Rule 5: All low risk + reversible + deferral available → defer
  if (
    thresholds.allowDeferral &&
    riskProfile.allReversible &&
    (riskProfile.worstCase === 'safe' || riskProfile.worstCase === 'low') &&
    deferralReasons.length > 0
  ) {
    const bestDeferral = deferralReasons.reduce(
      (best, r) => (r.confidence > best.confidence ? r : best),
      deferralReasons[0]!,
    );
    return {
      decision: {
        type: 'defer_to_planning',
        reason: bestDeferral.description,
      },
      riskProfile,
      confidenceProfile,
      candidates,
      deferralReasons,
      biasFactors,
      explanation: formatExplanation('defer', biasFactors),
    };
  }

  // Rule 6: Moderate risk with safe default → apply default cautiously
  if (confidenceProfile.topIsDominant) {
    const sorted = [...candidates].sort((a, b) => b.score - a.score);
    const top = sorted[0]!;
    if (top.score >= thresholds.safeDefaultMinConfidence && top.risk !== 'high') {
      return {
        decision: {
          type: 'apply_default',
          defaultIndex: top.index,
          reason: `Top interpretation at ${(top.score * 100).toFixed(0)}% with moderate risk.`,
        },
        riskProfile,
        confidenceProfile,
        candidates,
        deferralReasons,
        biasFactors,
        explanation: formatExplanation('apply_default', biasFactors),
      };
    }
  }

  // Rule 7: Aggregate bias factor score decides
  const totalBias = biasFactors.reduce((sum, f) => sum + f.weight, 0);

  if (totalBias <= -0.2 && deferralReasons.length > 0 && thresholds.allowDeferral) {
    return {
      decision: {
        type: 'defer_to_planning',
        reason: 'Aggregate bias factors favor deferral.',
      },
      riskProfile,
      confidenceProfile,
      candidates,
      deferralReasons,
      biasFactors,
      explanation: formatExplanation('defer', biasFactors),
    };
  }

  // Default: clarify
  const urgency: BiasUrgency = riskProfile.worstCase === 'moderate'
    ? 'before_execution'
    : 'advisory';

  return {
    decision: {
      type: 'clarify',
      reason: 'Ambiguity could not be resolved by confidence, risk, or deferral analysis.',
      urgency,
    },
    riskProfile,
    confidenceProfile,
    candidates,
    deferralReasons,
    biasFactors,
    explanation: formatExplanation('clarify', biasFactors),
  };
}

/**
 * Internal helper to build a minimal assessment (for edge cases).
 */
function makeAssessment(
  decision: BiasDecision,
  candidates: readonly InterpretationCandidate[],
  thresholds: BiasThresholds,
): PragmaticBiasAssessment {
  const riskProfile = buildRiskProfile(candidates);
  const confidenceProfile = buildConfidenceProfile(candidates, thresholds);
  const deferralReasons = analyzeDeferral(candidates, riskProfile, confidenceProfile, thresholds);
  const biasFactors = computeBiasFactors(candidates, riskProfile, confidenceProfile, thresholds);

  return {
    decision,
    riskProfile,
    confidenceProfile,
    candidates,
    deferralReasons,
    biasFactors,
    explanation: formatExplanation(decision.type, biasFactors),
  };
}

// =============================================================================
// CANDIDATE BUILDERS — Convenience constructors
// =============================================================================

/**
 * Create an interpretation candidate.
 */
export function createCandidate(
  index: number,
  score: number,
  risk: InterpretationRisk,
  category: AmbiguityCategory,
  description: string,
  options?: {
    readonly reversible?: boolean;
    readonly affectedScope?: AffectedScope;
    readonly paraphrase?: string;
  },
): InterpretationCandidate {
  return {
    index,
    score: Math.max(0, Math.min(1, score)),
    risk,
    category,
    description,
    reversible: options?.reversible ?? true,
    affectedScope: options?.affectedScope ?? 'single_event',
    paraphrase: options?.paraphrase ?? description,
  };
}

/**
 * Create candidates from scope readings.
 */
export function candidatesFromScopeReadings(
  readings: readonly {
    readonly index: number;
    readonly score: number;
    readonly logicalForm: string;
    readonly preferred: boolean;
  }[],
  riskEstimator?: (reading: { readonly index: number; readonly logicalForm: string }) => InterpretationRisk,
): readonly InterpretationCandidate[] {
  const estimator = riskEstimator ?? (() => 'low' as InterpretationRisk);

  return readings.map(r => ({
    index: r.index,
    score: r.score,
    risk: estimator(r),
    category: 'scope' as AmbiguityCategory,
    description: r.logicalForm,
    reversible: true,
    affectedScope: 'single_event' as AffectedScope,
    paraphrase: r.logicalForm,
  }));
}

/**
 * Create candidates from degree ambiguity (multiple axis interpretations).
 */
export function candidatesFromDegreeAmbiguity(
  axes: readonly {
    readonly axisName: string;
    readonly confidence: number;
    readonly description: string;
  }[],
): readonly InterpretationCandidate[] {
  return axes.map((axis, i) => ({
    index: i,
    score: axis.confidence,
    risk: 'low' as InterpretationRisk,
    category: 'degree' as AmbiguityCategory,
    description: `Adjust ${axis.axisName}: ${axis.description}`,
    reversible: true,
    affectedScope: 'single_param' as AffectedScope,
    paraphrase: `Change the ${axis.axisName}`,
  }));
}

/**
 * Create candidates from reference ambiguity (multiple entity referents).
 */
export function candidatesFromReferenceAmbiguity(
  entities: readonly {
    readonly entityId: string;
    readonly entityName: string;
    readonly confidence: number;
    readonly scope: AffectedScope;
  }[],
): readonly InterpretationCandidate[] {
  return entities.map((ent, i) => ({
    index: i,
    score: ent.confidence,
    risk: ent.scope === 'global' ? 'moderate' as InterpretationRisk : 'low' as InterpretationRisk,
    category: 'reference' as AmbiguityCategory,
    description: `Refers to "${ent.entityName}" (${ent.entityId})`,
    reversible: true,
    affectedScope: ent.scope,
    paraphrase: `Apply to ${ent.entityName}`,
  }));
}

// =============================================================================
// PRAGMATIC HEURISTIC DATABASE — Domain-specific biases for music editing
// =============================================================================

/**
 * A pragmatic heuristic rule that can adjust candidate scores or risk.
 */
export interface PragmaticHeuristic {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: AmbiguityCategory;
  readonly condition: string;
  readonly adjustment: HeuristicAdjustment;
}

/**
 * How a heuristic adjusts scoring.
 */
export type HeuristicAdjustment =
  | { readonly type: 'boost_score'; readonly amount: number; readonly target: string }
  | { readonly type: 'reduce_risk'; readonly from: InterpretationRisk; readonly to: InterpretationRisk; readonly target: string }
  | { readonly type: 'force_clarify'; readonly reason: string }
  | { readonly type: 'force_defer'; readonly reason: string };

/**
 * Built-in pragmatic heuristics for music production domain.
 */
export const PRAGMATIC_HEURISTIC_DATABASE: readonly PragmaticHeuristic[] = [
  // Scope heuristics
  {
    id: 'PH001',
    name: 'surface_scope_default',
    description: 'Prefer surface scope reading for quantifier interactions.',
    category: 'scope',
    condition: 'scope ambiguity with quantifier interaction',
    adjustment: { type: 'boost_score', amount: 0.1, target: 'surface_order_reading' },
  },
  {
    id: 'PH002',
    name: 'negation_wide_scope',
    description: 'Prefer negation to take wide scope ("don\'t make all tracks louder" → negation over quantifier).',
    category: 'scope',
    condition: 'negation + universal quantifier',
    adjustment: { type: 'boost_score', amount: 0.15, target: 'negation_wide' },
  },
  {
    id: 'PH003',
    name: 'only_narrow_scope',
    description: '"Only" associates with the focused constituent.',
    category: 'scope',
    condition: '"only" with multiple possible associates',
    adjustment: { type: 'force_clarify', reason: '"Only" focus is ambiguous; clarify what is excluded.' },
  },

  // Degree heuristics
  {
    id: 'PH010',
    name: 'warmer_prefers_timbre',
    description: '"Warmer" in isolation defaults to timbre/harmonic richness.',
    category: 'degree',
    condition: 'adjective "warmer" without axis context',
    adjustment: { type: 'boost_score', amount: 0.2, target: 'timbre_warmth' },
  },
  {
    id: 'PH011',
    name: 'brighter_prefers_high_freq',
    description: '"Brighter" defaults to high-frequency EQ boost.',
    category: 'degree',
    condition: 'adjective "brighter" without axis context',
    adjustment: { type: 'boost_score', amount: 0.2, target: 'high_freq_eq' },
  },
  {
    id: 'PH012',
    name: 'louder_is_volume',
    description: '"Louder" unambiguously means volume increase.',
    category: 'degree',
    condition: 'adjective "louder"',
    adjustment: { type: 'reduce_risk', from: 'low', to: 'safe', target: 'volume_increase' },
  },
  {
    id: 'PH013',
    name: 'darker_ambiguous',
    description: '"Darker" could mean timbre, harmony, or mood — always clarify.',
    category: 'degree',
    condition: 'adjective "darker" with 3+ axis candidates',
    adjustment: { type: 'force_clarify', reason: '"Darker" has multiple music-domain meanings.' },
  },
  {
    id: 'PH014',
    name: 'tighter_prefers_timing',
    description: '"Tighter" defaults to timing quantization.',
    category: 'degree',
    condition: 'adjective "tighter" without axis context',
    adjustment: { type: 'boost_score', amount: 0.15, target: 'timing_quantization' },
  },

  // Reference heuristics
  {
    id: 'PH020',
    name: 'it_prefers_last_mentioned',
    description: 'Pronoun "it" defaults to the most recently mentioned entity.',
    category: 'reference',
    condition: 'pronoun "it" with multiple antecedent candidates',
    adjustment: { type: 'boost_score', amount: 0.2, target: 'most_recent_entity' },
  },
  {
    id: 'PH021',
    name: 'the_X_requires_unique',
    description: 'Definite "the X" requires a unique referent or clarification.',
    category: 'reference',
    condition: 'definite NP with multiple matching entities',
    adjustment: { type: 'force_clarify', reason: '"The" presupposes a unique referent.' },
  },
  {
    id: 'PH022',
    name: 'this_prefers_selected',
    description: '"This" refers to the currently selected entity.',
    category: 'reference',
    condition: 'demonstrative "this" with selection context',
    adjustment: { type: 'boost_score', amount: 0.25, target: 'selected_entity' },
  },

  // Structural heuristics
  {
    id: 'PH030',
    name: 'right_attachment_pp',
    description: 'PPs attach to the nearest verb/noun (right association).',
    category: 'structural',
    condition: 'PP attachment ambiguity',
    adjustment: { type: 'boost_score', amount: 0.1, target: 'right_attachment' },
  },
  {
    id: 'PH031',
    name: 'minimal_attachment',
    description: 'Prefer the structurally simpler parse tree.',
    category: 'structural',
    condition: 'structural ambiguity with differing tree depth',
    adjustment: { type: 'boost_score', amount: 0.05, target: 'simpler_tree' },
  },

  // Temporal heuristics
  {
    id: 'PH040',
    name: 'sequence_is_chronological',
    description: '"Add reverb and delay" → add reverb first, then delay.',
    category: 'temporal',
    condition: 'conjoined actions without explicit ordering',
    adjustment: { type: 'force_defer', reason: 'Temporal ordering deferred to planner.' },
  },
  {
    id: 'PH041',
    name: 'before_after_is_explicit',
    description: '"Before the chorus" has explicit temporal reference.',
    category: 'temporal',
    condition: 'explicit temporal preposition',
    adjustment: { type: 'reduce_risk', from: 'moderate', to: 'low', target: 'explicit_temporal' },
  },

  // Modal heuristics
  {
    id: 'PH050',
    name: 'could_is_suggestion',
    description: '"Could you" is a polite request, not a question about ability.',
    category: 'modal',
    condition: 'modal "could" in imperative context',
    adjustment: { type: 'reduce_risk', from: 'moderate', to: 'safe', target: 'polite_request' },
  },
  {
    id: 'PH051',
    name: 'should_is_advisory',
    description: '"Should" indicates a suggestion that needs confirmation.',
    category: 'modal',
    condition: 'modal "should" without prior agreement',
    adjustment: { type: 'boost_score', amount: 0.1, target: 'suggestion_reading' },
  },

  // Pragmatic / implicature heuristics
  {
    id: 'PH060',
    name: 'some_implicates_not_all',
    description: '"Some tracks" implicates not all tracks (scalar implicature).',
    category: 'pragmatic',
    condition: '"some" with universal alternative available',
    adjustment: { type: 'boost_score', amount: 0.1, target: 'not_all_reading' },
  },
  {
    id: 'PH061',
    name: 'or_is_inclusive',
    description: '"Add reverb or delay" defaults to inclusive-or in music editing.',
    category: 'pragmatic',
    condition: '"or" in additive context',
    adjustment: { type: 'reduce_risk', from: 'low', to: 'safe', target: 'inclusive_or' },
  },
  {
    id: 'PH062',
    name: 'negative_polarity_licensing',
    description: '"Any" under negation is NPI, not free-choice.',
    category: 'pragmatic',
    condition: '"any" in negative context',
    adjustment: { type: 'boost_score', amount: 0.15, target: 'npi_reading' },
  },
];

/**
 * Look up applicable heuristics for a given ambiguity category.
 */
export function getApplicableHeuristics(
  category: AmbiguityCategory,
): readonly PragmaticHeuristic[] {
  return PRAGMATIC_HEURISTIC_DATABASE.filter(h => h.category === category);
}

/**
 * Look up a heuristic by ID.
 */
export function getHeuristicById(id: string): PragmaticHeuristic | undefined {
  return PRAGMATIC_HEURISTIC_DATABASE.find(h => h.id === id);
}

// =============================================================================
// CLARIFICATION QUESTION GENERATION — Bridge to clarification system
// =============================================================================

/**
 * A pragmatically motivated clarification question.
 */
export interface PragmaticClarificationQuestion {
  readonly question: string;
  readonly category: AmbiguityCategory;
  readonly options: readonly PragmaticClarificationOption[];
  readonly defaultOptionIndex: number | null;
  readonly whyItMatters: string;
  readonly urgency: BiasUrgency;
  readonly skippable: boolean;
  readonly skipDefault: number | null;    // index to use if user skips
}

/**
 * An option in a pragmatic clarification question.
 */
export interface PragmaticClarificationOption {
  readonly label: string;
  readonly candidateIndex: number;
  readonly riskLevel: InterpretationRisk;
  readonly explanation: string;
}

/**
 * Generate a clarification question from a pragmatic bias assessment.
 */
export function generatePragmaticClarification(
  assessment: PragmaticBiasAssessment,
): PragmaticClarificationQuestion | null {
  if (assessment.decision.type !== 'clarify') return null;

  const sorted = [...assessment.candidates].sort((a, b) => b.score - a.score);

  // Limit to top 4 options for UX
  const topCandidates = sorted.slice(0, 4);

  const options: PragmaticClarificationOption[] = topCandidates.map(c => ({
    label: c.paraphrase,
    candidateIndex: c.index,
    riskLevel: c.risk,
    explanation: c.description,
  }));

  // Find safe default (highest-scoring safe candidate)
  const safeDefault = sorted.find(c => c.risk === 'safe' || c.risk === 'low');
  const defaultIndex = safeDefault
    ? options.findIndex(o => o.candidateIndex === safeDefault.index)
    : null;

  // Determine skip-ability: skippable if a safe default exists
  const skippable = safeDefault !== undefined;
  const skipDefault = skippable && safeDefault
    ? safeDefault.index
    : null;

  // Generate the question text
  const question = generateQuestionText(assessment);
  const whyItMatters = generateWhyItMatters(assessment);

  return {
    question,
    category: sorted[0]?.category ?? 'pragmatic',
    options,
    defaultOptionIndex: defaultIndex !== null && defaultIndex >= 0 ? defaultIndex : null,
    whyItMatters,
    urgency: assessment.decision.type === 'clarify' ? assessment.decision.urgency : 'advisory',
    skippable,
    skipDefault,
  };
}

/**
 * Generate human-readable question text based on the ambiguity category.
 */
function generateQuestionText(assessment: PragmaticBiasAssessment): string {
  const categories = new Set(assessment.candidates.map(c => c.category));
  const count = assessment.candidates.length;

  if (categories.has('scope')) {
    return `This sentence has ${count} possible scope interpretations. Which reading did you intend?`;
  }
  if (categories.has('degree')) {
    return `The adjective you used could refer to ${count} different sound qualities. Which do you mean?`;
  }
  if (categories.has('reference')) {
    return `There are ${count} possible things you could be referring to. Which one?`;
  }
  if (categories.has('structural')) {
    return `This sentence can be parsed ${count} ways. Which structure did you mean?`;
  }
  if (categories.has('temporal')) {
    return `The timing of these actions is ambiguous. What order should they happen?`;
  }
  if (categories.has('modal')) {
    return `Are you making a request or asking a question?`;
  }
  if (categories.has('lexical')) {
    return `The word you used has ${count} possible meanings here. Which did you intend?`;
  }

  return `This instruction is ambiguous (${count} interpretations). Which did you mean?`;
}

/**
 * Generate a "why it matters" explanation.
 */
function generateWhyItMatters(assessment: PragmaticBiasAssessment): string {
  const { riskProfile } = assessment;

  if (riskProfile.destructiveCount > 0) {
    return 'Some interpretations could cause irreversible changes to your project.';
  }
  if (riskProfile.maxAffectedScope === 'global') {
    return 'Different interpretations affect the entire project differently.';
  }
  if (riskProfile.maxAffectedScope === 'section') {
    return 'Different interpretations would change different sections of your project.';
  }
  if (!riskProfile.allReversible) {
    return 'Some interpretations cannot be undone.';
  }
  if (riskProfile.averageRisk > 0.5) {
    return 'The interpretations differ significantly in what they would change.';
  }

  return 'Different interpretations would produce noticeably different results.';
}

// =============================================================================
// FORMATTING — Human-readable bias assessment output
// =============================================================================

/**
 * Format a pragmatic bias assessment for developer/debug output.
 */
export function formatBiasAssessment(assessment: PragmaticBiasAssessment): string {
  const lines: string[] = [];

  lines.push('=== Pragmatic Bias Assessment ===');
  lines.push('');

  // Decision
  lines.push(`Decision: ${formatDecision(assessment.decision)}`);
  lines.push('');

  // Risk profile
  lines.push('Risk Profile:');
  lines.push(`  Worst case: ${assessment.riskProfile.worstCase}`);
  lines.push(`  Best case:  ${assessment.riskProfile.bestCase}`);
  lines.push(`  Average:    ${(assessment.riskProfile.averageRisk * 100).toFixed(0)}%`);
  lines.push(`  Reversible: ${assessment.riskProfile.allReversible ? 'all' : 'some not'}`);
  lines.push(`  Max scope:  ${assessment.riskProfile.maxAffectedScope}`);
  lines.push('');

  // Confidence profile
  lines.push('Confidence Profile:');
  lines.push(`  Top score:    ${(assessment.confidenceProfile.topScore * 100).toFixed(0)}%`);
  lines.push(`  Second score: ${(assessment.confidenceProfile.secondScore * 100).toFixed(0)}%`);
  lines.push(`  Gap:          ${(assessment.confidenceProfile.gap * 100).toFixed(0)}%`);
  lines.push(`  Distribution: ${assessment.confidenceProfile.distribution}`);
  lines.push('');

  // Candidates
  lines.push(`Candidates (${assessment.candidates.length}):`);
  const sorted = [...assessment.candidates].sort((a, b) => b.score - a.score);
  for (const c of sorted) {
    lines.push(`  [${c.index}] ${(c.score * 100).toFixed(0)}% ${c.risk} (${c.category}) — ${c.description}`);
  }
  lines.push('');

  // Bias factors
  if (assessment.biasFactors.length > 0) {
    lines.push('Bias Factors:');
    for (const f of assessment.biasFactors) {
      const dir = f.weight > 0 ? '→ clarify' : f.weight < 0 ? '→ defer' : '→ neutral';
      lines.push(`  ${f.name}: ${f.weight > 0 ? '+' : ''}${f.weight.toFixed(2)} ${dir}`);
      lines.push(`    ${f.description}`);
    }
    lines.push('');
  }

  // Deferral reasons
  if (assessment.deferralReasons.length > 0) {
    lines.push('Deferral Reasons:');
    for (const r of assessment.deferralReasons) {
      lines.push(`  [${r.type}] ${r.description} (confidence: ${(r.confidence * 100).toFixed(0)}%)`);
    }
    lines.push('');
  }

  // Explanation
  lines.push(`Explanation: ${assessment.explanation}`);

  return lines.join('\n');
}

/**
 * Format a decision for display.
 */
function formatDecision(decision: BiasDecision): string {
  switch (decision.type) {
    case 'clarify':
      return `CLARIFY (${decision.urgency}) — ${decision.reason}`;
    case 'apply_default':
      return `APPLY DEFAULT [${decision.defaultIndex}] — ${decision.reason}`;
    case 'defer_to_planning':
      return `DEFER TO PLANNER — ${decision.reason}`;
    case 'merge_equivalent':
      return `MERGE [${decision.equivalentIndices.join(', ')}] — ${decision.reason}`;
    case 'reject':
      return `REJECT — ${decision.reason}`;
  }
}

/**
 * Format an explanation string from bias factors.
 */
function formatExplanation(
  decisionType: string,
  factors: readonly BiasFactor[],
): string {
  const total = factors.reduce((sum, f) => sum + f.weight, 0);
  const topFactors = [...factors]
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
    .slice(0, 3);

  const factorSummary = topFactors
    .map(f => f.name)
    .join(', ');

  switch (decisionType) {
    case 'clarify':
      return `Clarification needed. Key factors: ${factorSummary}. Aggregate bias: ${total > 0 ? '+' : ''}${total.toFixed(2)}.`;
    case 'apply_default':
      return `Applying safe default. Key factors: ${factorSummary}.`;
    case 'defer':
    case 'defer_to_planning':
      return `Deferring to planner. Key factors: ${factorSummary}. Aggregate bias: ${total.toFixed(2)}.`;
    case 'merge':
    case 'merge_equivalent':
      return `Merging equivalent readings.`;
    case 'reject':
      return `No viable interpretations.`;
    default:
      return `Decision: ${decisionType}. Factors: ${factorSummary}.`;
  }
}

/**
 * Format a compact one-line summary of the assessment.
 */
export function formatBiasCompact(assessment: PragmaticBiasAssessment): string {
  const d = assessment.decision;
  const n = assessment.candidates.length;
  const risk = assessment.riskProfile.worstCase;
  const conf = (assessment.confidenceProfile.topScore * 100).toFixed(0);

  switch (d.type) {
    case 'clarify':
      return `[CLARIFY/${d.urgency}] ${n} candidates, risk=${risk}, top=${conf}%`;
    case 'apply_default':
      return `[DEFAULT #${d.defaultIndex}] ${n} candidates, risk=${risk}, top=${conf}%`;
    case 'defer_to_planning':
      return `[DEFER] ${n} candidates, risk=${risk}, top=${conf}%`;
    case 'merge_equivalent':
      return `[MERGE ${d.equivalentIndices.length}] risk=${risk}`;
    case 'reject':
      return `[REJECT] ${d.reason}`;
  }
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Aggregate statistics about the pragmatic bias system.
 */
export interface PragmaticBiasStats {
  readonly heuristicCount: number;
  readonly heuristicsByCategory: ReadonlyMap<AmbiguityCategory, number>;
  readonly adjustmentTypes: ReadonlyMap<string, number>;
  readonly riskLevels: number;
  readonly scopeLevels: number;
  readonly thresholdKeys: number;
}

/**
 * Get statistics about the pragmatic bias system.
 */
export function getPragmaticBiasStats(): PragmaticBiasStats {
  const byCategory = new Map<AmbiguityCategory, number>();
  const byAdjustment = new Map<string, number>();

  for (const h of PRAGMATIC_HEURISTIC_DATABASE) {
    byCategory.set(h.category, (byCategory.get(h.category) ?? 0) + 1);
    byAdjustment.set(h.adjustment.type, (byAdjustment.get(h.adjustment.type) ?? 0) + 1);
  }

  return {
    heuristicCount: PRAGMATIC_HEURISTIC_DATABASE.length,
    heuristicsByCategory: byCategory,
    adjustmentTypes: byAdjustment,
    riskLevels: RISK_ORDERING.length,
    scopeLevels: SCOPE_ORDERING.length,
    thresholdKeys: Object.keys(DEFAULT_BIAS_THRESHOLDS).length,
  };
}
