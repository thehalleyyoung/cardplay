/**
 * @file Plan Skeleton System
 * @module gofai/planning/plan-skeleton
 *
 * Implements Step 261 from gofai_goalB.md:
 * "Implement a 'plan skeleton' step that maps from CPL-Intent to a set of
 * lever candidates with open parameters."
 *
 * The plan skeleton is an intermediate representation between user intent and
 * fully instantiated plans. It represents the STRUCTURE of what needs to happen
 * without yet committing to specific parameter values.
 *
 * Key Concepts:
 * - **Skeleton**: A plan template with open (uninstantiated) parameters
 * - **Lever**: A musical control dimension (brightness, density, etc.)
 * - **Candidate**: A possible opcode that could manipulate a lever
 * - **Open Parameter**: A parameter that needs inference or clarification
 *
 * Pipeline Position:
 *   CPL-Intent → Plan Skeleton → Parameter Inference → Concrete Plan → Execution
 *
 * Example Flow:
 *   Intent: "make the chorus brighter"
 *   → Skeleton: brightness_increase(target=chorus, amount=?, method=?)
 *   → Candidates: [boost_highs, add_harmonics, reduce_lows, ...]
 *   → Inference: amount="moderate" (0.3), method="boost_highs"
 *   → Concrete Plan: boost_highs(chorus, freq=8000Hz, gain=+3dB)
 *
 * Design Principles:
 * - Decouple intent understanding from parameter instantiation
 * - Enable multiple solution paths for the same intent
 * - Support partial plans that can be completed interactively
 * - Maintain provenance for all decisions
 * - Deterministic candidate generation
 *
 * @see src/gofai/planning/lever-mappings.ts (lever→opcode mappings)
 * @see src/gofai/planning/parameter-inference.ts (fill open parameters)
 * @see src/gofai/planning/plan-generation.ts (search over candidates)
 */

import type { CPLIntent, CPLGoal, CPLConstraint, CPLScope } from '../canon/cpl-types';
import type { OpcodeId, BaseOpcode, OpcodeCategory } from './plan-types';
import type { AxisId } from '../canon/types';
import type { Capability, CapabilityId } from '../canon/capability-model';

// =============================================================================
// Core Plan Skeleton Types
// =============================================================================

/**
 * A plan skeleton: the structure of a plan with open parameters.
 * 
 * Represents WHAT to do without yet knowing HOW (specific values).
 */
export interface PlanSkeleton {
  /** Unique ID for this skeleton */
  readonly id: PlanSkeletonId;

  /** The intent this skeleton satisfies */
  readonly intent: CPLIntent;

  /** Lever slots: musical dimensions to manipulate */
  readonly levers: readonly LeverSlot[];

  /** Constraints from intent that must be preserved */
  readonly constraints: readonly CPLConstraint[];

  /** Scope of the edit */
  readonly scope: CPLScope;

  /** Open parameters that need instantiation */
  readonly openParameters: readonly OpenParameter[];

  /** Provenance: how was this skeleton derived? */
  readonly provenance: SkeletonProvenance;

  /** Confidence: how certain are we this skeleton is correct? */
  readonly confidence: SkeletonConfidence;
}

/** Branded skeleton ID type */
export type PlanSkeletonId = string & { readonly __brand: 'PlanSkeletonId' };

/**
 * Create a skeleton ID.
 */
export function createSkeletonId(base: string): PlanSkeletonId {
  return `skel:${base}:${Date.now()}` as PlanSkeletonId;
}

/**
 * A lever slot in the skeleton: represents a musical dimension to change.
 */
export interface LeverSlot {
  /** Which axis/lever to manipulate */
  readonly lever: AxisId;

  /** Direction of change (increase/decrease) */
  readonly direction: 'increase' | 'decrease' | 'set' | 'unspecified';

  /** Target value (if absolute) */
  readonly targetValue?: number;

  /** Magnitude of change (if relative) */
  readonly magnitude?: MagnitudeSpec;

  /** Candidate opcodes that could implement this lever */
  readonly candidates: readonly OpcodeCandidate[];

  /** Required capabilities */
  readonly requiredCapabilities: readonly CapabilityId[];
}

/**
 * Magnitude specification for a change (open or fixed).
 */
export type MagnitudeSpec =
  | { readonly type: 'open'; readonly hint?: string } // "a little", "much"
  | { readonly type: 'fixed'; readonly value: number } // 0.3, +3dB
  | { readonly type: 'inferred'; readonly from: InferenceSource; readonly value: number };

/**
 * An opcode candidate for implementing a lever.
 */
export interface OpcodeCandidate {
  /** The opcode ID */
  readonly opcodeId: OpcodeId;

  /** Cost of this opcode (from cost model) */
  readonly cost: number;

  /** Open parameters in this opcode */
  readonly openParams: readonly string[];

  /** Preconditions that must be met */
  readonly preconditions: readonly string[];

  /** Expected effect */
  readonly effect: string;

  /** Confidence this opcode will work */
  readonly confidence: number;

  /** Why this opcode was selected as a candidate */
  readonly rationale: string;
}

/**
 * An open parameter in the skeleton that needs instantiation.
 */
export interface OpenParameter {
  /** Parameter name */
  readonly name: string;

  /** Expected type */
  readonly type: OpenParamType;

  /** Optional hint from user utterance */
  readonly hint?: string;

  /** Possible values (if enum-like) */
  readonly possibleValues?: readonly unknown[];

  /** Default value (if any) */
  readonly defaultValue?: unknown;

  /** Is this parameter required? */
  readonly required: boolean;

  /** Source that created this open parameter */
  readonly source: 'user_intent' | 'opcode_requirement' | 'constraint';
}

/**
 * Types of open parameters.
 */
export type OpenParamType =
  | 'amount' // Magnitude: "a little", "much"
  | 'frequency' // Hz value
  | 'time' // Duration/time value
  | 'target' // Entity reference
  | 'method' // Choice of technique
  | 'quality' // Subjective quality descriptor
  | 'boolean'; // Yes/no choice

/**
 * Provenance: how was this skeleton generated?
 */
export interface SkeletonProvenance {
  /** Which semantic rule produced this skeleton? */
  readonly rule: string;

  /** Confidence in the semantic parse */
  readonly parseConfidence: number;

  /** Lexemes that contributed */
  readonly lexemes: readonly string[];

  /** Alternative skeletons considered */
  readonly alternatives?: readonly PlanSkeletonId[];
}

/**
 * Confidence assessment for a skeleton.
 */
export interface SkeletonConfidence {
  /** Overall confidence (0-1) */
  readonly overall: number;

  /** Factors reducing confidence */
  readonly concerns: readonly ConfidenceConcern[];

  /** Can we proceed without clarification? */
  readonly proceedable: boolean;
}

/**
 * A concern that reduces confidence.
 */
export interface ConfidenceConcern {
  readonly type: 'ambiguous_intent' | 'missing_precondition' | 'risky_opcode' | 'unclear_scope';
  readonly description: string;
  readonly severity: 'low' | 'medium' | 'high';
  readonly suggestedClarification?: string;
}

// =============================================================================
// Skeleton Generation
// =============================================================================

/**
 * Generate plan skeleton(s) from CPL-Intent.
 *
 * This is the entry point: takes user intent and produces one or more
 * skeletal plans that could satisfy it.
 *
 * Returns multiple skeletons if the intent is ambiguous or has multiple
 * reasonable interpretations.
 */
export function generatePlanSkeletons(
  intent: CPLIntent,
  capabilities: readonly Capability[]
): readonly PlanSkeleton[] {
  const skeletons: PlanSkeleton[] = [];

  // Extract goals and map each to lever slots
  for (const goal of intent.goals) {
    const levers = mapGoalToLevers(goal, capabilities);

    if (levers.length === 0) {
      // Cannot satisfy this goal with available capabilities
      continue;
    }

    // Analyze open parameters
    const openParams = collectOpenParameters(levers, goal);

    // Assess confidence
    const confidence = assessSkeletonConfidence(levers, openParams, goal);

    // Create skeleton
    const skeleton: PlanSkeleton = {
      id: createSkeletonId(`${goal.type}-${Date.now()}`),
      intent,
      levers,
      constraints: intent.constraints || [],
      scope: intent.scope,
      openParameters: openParams,
      provenance: {
        rule: 'goal_to_levers_mapping',
        parseConfidence: 1.0, // TODO: get from intent
        lexemes: [], // TODO: populate
      },
      confidence,
    };

    skeletons.push(skeleton);
  }

  return skeletons;
}

/**
 * Map a single goal to lever slots.
 *
 * A goal like "increase brightness" maps to the brightness lever with
 * direction="increase" and a set of candidate opcodes.
 */
function mapGoalToLevers(
  goal: CPLGoal,
  capabilities: readonly Capability[]
): readonly LeverSlot[] {
  const levers: LeverSlot[] = [];

  // Handle axis-based goals
  if (goal.type === 'modify_axis') {
    const axis = goal.axis as AxisId;
    const direction = goal.direction || 'unspecified';

    // Get candidate opcodes for this axis
    const candidates = getCandidatesForAxis(axis, direction, capabilities);

    if (candidates.length === 0) {
      return []; // No way to satisfy this goal
    }

    const slot: LeverSlot = {
      lever: axis,
      direction,
      magnitude: goal.amount
        ? { type: 'fixed', value: goal.amount }
        : { type: 'open', hint: goal.amountHint },
      candidates,
      requiredCapabilities: determineRequiredCapabilities(candidates),
    };

    levers.push(slot);
  }

  // Handle structural goals
  else if (goal.type === 'modify_structure') {
    // Map to structure-related levers
    const candidates = getCandidatesForStructure(goal.structureType, capabilities);

    const slot: LeverSlot = {
      lever: 'structure' as AxisId, // TODO: proper structure lever type
      direction: goal.operation || 'unspecified',
      candidates,
      requiredCapabilities: determineRequiredCapabilities(candidates),
    };

    levers.push(slot);
  }

  // Handle constraint-based goals ("keep X fixed")
  else if (goal.type === 'preserve') {
    // These become constraints, not levers
    // Skip for now
  }

  return levers;
}

/**
 * Get candidate opcodes for an axis manipulation.
 *
 * Uses lever-to-opcode mappings defined in lever-mappings.ts.
 */
function getCandidatesForAxis(
  axis: AxisId,
  direction: string,
  capabilities: readonly Capability[]
): readonly OpcodeCandidate[] {
  // TODO: Import actual lever mappings
  // For now, return mock candidates

  const candidates: OpcodeCandidate[] = [];

  // Example: brightness increase → multiple candidates
  if (axis === ('brightness' as AxisId) && direction === 'increase') {
    candidates.push({
      opcodeId: 'opcode:production:boost_highs' as OpcodeId,
      cost: 1.0,
      openParams: ['frequency', 'gain'],
      preconditions: ['has_eq_capability'],
      effect: 'Boost high frequencies',
      confidence: 0.9,
      rationale: 'Standard brightness increase via EQ',
    });

    candidates.push({
      opcodeId: 'opcode:production:add_exciter' as OpcodeId,
      cost: 2.0,
      openParams: ['harmonics', 'mix'],
      preconditions: ['has_exciter_card'],
      effect: 'Add harmonic excitation',
      confidence: 0.7,
      rationale: 'Brightness via harmonic generation',
    });
  }

  // Filter by capabilities
  const availableCandidates = filterByCapabilities(candidates, capabilities);

  return availableCandidates;
}

/**
 * Get candidate opcodes for structural manipulation.
 */
function getCandidatesForStructure(
  structureType: string,
  capabilities: readonly Capability[]
): readonly OpcodeCandidate[] {
  // TODO: Implement structure opcode candidates
  return [];
}

/**
 * Filter candidates by available capabilities.
 */
function filterByCapabilities(
  candidates: readonly OpcodeCandidate[],
  capabilities: readonly Capability[]
): readonly OpcodeCandidate[] {
  const capabilitySet = new Set(capabilities.map(c => c.id));

  return candidates.filter(candidate => {
    return candidate.preconditions.every(precond => {
      // TODO: proper precondition checking
      return true; // Simplified for now
    });
  });
}

/**
 * Determine required capabilities from candidates.
 */
function determineRequiredCapabilities(
  candidates: readonly OpcodeCandidate[]
): readonly CapabilityId[] {
  const capabilities = new Set<CapabilityId>();

  for (const candidate of candidates) {
    // TODO: extract capabilities from preconditions
  }

  return Array.from(capabilities);
}

/**
 * Collect all open parameters from lever slots.
 */
function collectOpenParameters(
  levers: readonly LeverSlot[],
  goal: CPLGoal
): readonly OpenParameter[] {
  const params: OpenParameter[] = [];

  for (const lever of levers) {
    // If magnitude is open, add an amount parameter
    if (lever.magnitude?.type === 'open') {
      params.push({
        name: 'amount',
        type: 'amount',
        hint: lever.magnitude.hint,
        required: true,
        source: 'user_intent',
      });
    }

    // Collect open params from each candidate
    for (const candidate of lever.candidates) {
      for (const paramName of candidate.openParams) {
        // TODO: deduplicate and classify params
        params.push({
          name: paramName,
          type: classifyParameterType(paramName),
          required: false,
          source: 'opcode_requirement',
        });
      }
    }
  }

  return params;
}

/**
 * Classify a parameter name into an OpenParamType.
 */
function classifyParameterType(name: string): OpenParamType {
  const lower = name.toLowerCase();

  if (lower.includes('freq') || lower.includes('hz')) {
    return 'frequency';
  }
  if (lower.includes('time') || lower.includes('duration') || lower.includes('ms')) {
    return 'time';
  }
  if (lower.includes('amount') || lower.includes('gain') || lower.includes('level')) {
    return 'amount';
  }
  if (lower.includes('target') || lower.includes('layer') || lower.includes('track')) {
    return 'target';
  }
  if (lower.includes('method') || lower.includes('mode') || lower.includes('type')) {
    return 'method';
  }

  return 'quality';
}

/**
 * Assess confidence in a skeleton.
 */
function assessSkeletonConfidence(
  levers: readonly LeverSlot[],
  openParams: readonly OpenParameter[],
  goal: CPLGoal
): SkeletonConfidence {
  const concerns: ConfidenceConcern[] = [];
  let confidence = 1.0;

  // Reduce confidence for many open parameters
  if (openParams.filter(p => p.required).length > 2) {
    concerns.push({
      type: 'ambiguous_intent',
      description: 'Many parameters need clarification',
      severity: 'medium',
      suggestedClarification: 'Ask user to specify amount or method',
    });
    confidence *= 0.7;
  }

  // Reduce confidence if candidates have low confidence
  for (const lever of levers) {
    const avgCandidateConfidence =
      lever.candidates.reduce((sum, c) => sum + c.confidence, 0) / lever.candidates.length;

    if (avgCandidateConfidence < 0.6) {
      concerns.push({
        type: 'risky_opcode',
        description: `Low confidence in opcodes for lever ${lever.lever}`,
        severity: 'high',
      });
      confidence *= avgCandidateConfidence;
    }
  }

  // Check if we have no candidates for any lever
  for (const lever of levers) {
    if (lever.candidates.length === 0) {
      concerns.push({
        type: 'missing_precondition',
        description: `No available opcodes for lever ${lever.lever}`,
        severity: 'high',
        suggestedClarification: 'This operation requires capabilities not currently enabled',
      });
      confidence = 0;
    }
  }

  return {
    overall: confidence,
    concerns,
    proceedable: confidence >= 0.5 && concerns.every(c => c.severity !== 'high'),
  };
}

// =============================================================================
// Skeleton Selection & Ranking
// =============================================================================

/**
 * Rank skeletons by preference.
 *
 * When multiple skeletons are generated, rank them to pick the best or
 * to present top N to the user.
 */
export function rankSkeletons(
  skeletons: readonly PlanSkeleton[]
): readonly PlanSkeleton[] {
  return [...skeletons].sort((a, b) => {
    // Primary: confidence
    if (a.confidence.overall !== b.confidence.overall) {
      return b.confidence.overall - a.confidence.overall;
    }

    // Secondary: fewer open parameters
    const aOpenCount = a.openParameters.filter(p => p.required).length;
    const bOpenCount = b.openParameters.filter(p => p.required).length;
    if (aOpenCount !== bOpenCount) {
      return aOpenCount - bOpenCount;
    }

    // Tertiary: fewer levers (simpler plan)
    return a.levers.length - b.levers.length;
  });
}

/**
 * Check if a skeleton is ready for instantiation.
 *
 * A skeleton is ready if:
 * - It has high confidence
 * - It has no required open parameters OR they can be inferred
 * - All preconditions can be met
 */
export function isSkeletonReady(skeleton: PlanSkeleton): boolean {
  if (!skeleton.confidence.proceedable) {
    return false;
  }

  const requiredOpenParams = skeleton.openParameters.filter(p => p.required);
  if (requiredOpenParams.length > 0) {
    // Can only proceed if all have defaults
    return requiredOpenParams.every(p => p.defaultValue !== undefined);
  }

  return true;
}

// =============================================================================
// Skeleton Refinement
// =============================================================================

/**
 * Refine a skeleton by filling in an open parameter.
 *
 * Returns a new skeleton with the parameter fixed.
 */
export function refineSkeletonWithParameter(
  skeleton: PlanSkeleton,
  paramName: string,
  value: unknown
): PlanSkeleton {
  // Update magnitude if it's the amount parameter
  const updatedLevers = skeleton.levers.map(lever => {
    if (paramName === 'amount' && lever.magnitude?.type === 'open') {
      return {
        ...lever,
        magnitude: {
          type: 'fixed' as const,
          value: value as number,
        },
      };
    }
    return lever;
  });

  // Remove the parameter from open list
  const updatedOpenParams = skeleton.openParameters.filter(p => p.name !== paramName);

  // Reassess confidence
  const updatedConfidence = assessSkeletonConfidence(
    updatedLevers,
    updatedOpenParams,
    skeleton.intent.goals[0]! // TODO: handle multiple goals
  );

  return {
    ...skeleton,
    levers: updatedLevers,
    openParameters: updatedOpenParams,
    confidence: updatedConfidence,
  };
}

/**
 * Refine a skeleton by selecting a specific candidate for a lever.
 *
 * Narrows the candidate set to just one opcode.
 */
export function refineSkeletonWithCandidate(
  skeleton: PlanSkeleton,
  leverIndex: number,
  candidateId: OpcodeId
): PlanSkeleton {
  const updatedLevers = skeleton.levers.map((lever, idx) => {
    if (idx !== leverIndex) {
      return lever;
    }

    // Filter to just the selected candidate
    const selectedCandidate = lever.candidates.find(c => c.opcodeId === candidateId);
    if (!selectedCandidate) {
      throw new Error(`Candidate ${candidateId} not found in lever`);
    }

    return {
      ...lever,
      candidates: [selectedCandidate],
    };
  });

  return {
    ...skeleton,
    levers: updatedLevers,
  };
}

// =============================================================================
// Inference Source Tracking
// =============================================================================

/**
 * Source of an inferred parameter value.
 */
export type InferenceSource =
  | { readonly type: 'default'; readonly rule: string }
  | { readonly type: 'context'; readonly evidence: string }
  | { readonly type: 'user_profile'; readonly preference: string }
  | { readonly type: 'heuristic'; readonly heuristic: string };

/**
 * Record provenance for an inferred parameter.
 */
export function recordInference(
  paramName: string,
  value: unknown,
  source: InferenceSource
): { readonly from: InferenceSource; readonly value: number } {
  // TODO: Add to provenance log
  return {
    from: source,
    value: value as number,
  };
}

// =============================================================================
// Exports
// =============================================================================

export type { PlanSkeleton, LeverSlot, OpcodeCandidate, OpenParameter };
