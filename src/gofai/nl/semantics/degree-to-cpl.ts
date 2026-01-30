/**
 * GOFAI NL Semantics — Degree-to-CPL Bridge
 *
 * Maps degree expressions (from degree-semantics.ts) to CPL-Intent nodes,
 * with special handling for comparatives as axis ordering constraints.
 *
 * ## Key Insight: "More" as Ordering Constraint
 *
 * The comparative "more X" doesn't specify an absolute value — it specifies
 * an ordering constraint on an axis variable:
 *
 * ```
 * "make the bass brighter than the vocals"
 * ∀t ∈ {bass}: brightness(t) > brightness(vocals)
 *
 * "make it a bit louder"
 * ∃Δ > 0, Δ ∈ [small]: volume(result) = volume(current) + Δ
 *
 * "the brightest it can be"
 * maximize(brightness(target))
 * ```
 *
 * This module:
 * 1. Maps comparative degrees to axis ordering constraints
 * 2. Maps superlatives to extremal constraints (maximize/minimize)
 * 3. Maps equatives to equality constraints
 * 4. Maps excessive degrees to bounded constraints (too much = above threshold)
 * 5. Maps sufficient degrees to floor constraints (enough = above minimum)
 * 6. Maps absolute values to exact CPL amounts
 * 7. Maps relative values to delta CPL amounts
 * 8. Handles modifier stacking ("much much brighter" → stronger intensity)
 * 9. Handles negated comparatives ("not brighter" → preserve or decrease)
 * 10. Handles cross-entity comparatives ("louder than the drums")
 *
 * @module gofai/nl/semantics/degree-to-cpl
 * @see gofai_goalA.md Step 155
 */

import type {
  DegreeExpression,
  DegreeExpressionType,
  DegreeMagnitude,
  AxisCandidate,
  ComparisonStandard,
} from './degree-semantics';

import type { SemanticVersion } from '../../canon/versioning';

import type {
  CPLGoal,
  CPLConstraint,
  CPLAmount,
  CPLScope,
  CPLHole,
} from '../../canon/cpl-types';


// =============================================================================
// Axis Ordering Constraints
// =============================================================================

/**
 * An ordering constraint on an axis variable.
 *
 * This is the core representation for comparatives:
 * "brighter" → axis(brightness) > current_value
 * "brighter than X" → axis(brightness, target) > axis(brightness, X)
 */
export interface AxisOrderingConstraint {
  /** Unique constraint ID */
  readonly id: string;

  /** The axis being constrained */
  readonly axis: string;

  /** The ordering relation */
  readonly relation: AxisRelation;

  /** Left-hand side: what is being changed */
  readonly lhs: AxisReference;

  /** Right-hand side: the comparison standard */
  readonly rhs: AxisReference;

  /** Delta specification (for relative comparatives: "a bit more") */
  readonly delta: DeltaSpec | null;

  /** Whether this constraint is negated ("not brighter") */
  readonly negated: boolean;

  /** Source degree expression */
  readonly sourceDegreeType: DegreeExpressionType;

  /** Confidence in this constraint */
  readonly confidence: number;

  /** Provenance */
  readonly sourceSpan?: readonly [number, number] | undefined;
}

/**
 * Ordering relation between axis values.
 */
export type AxisRelation =
  | 'greater-than'       // comparative up: "brighter"
  | 'less-than'          // comparative down: "darker"
  | 'equal-to'           // equative: "as bright as"
  | 'greater-or-equal'   // sufficient: "bright enough"
  | 'maximize'           // superlative up: "brightest"
  | 'minimize'           // superlative down: "darkest"
  | 'below-threshold'    // excessive: "too bright" → must be reduced
  | 'above-threshold';   // insufficient: "not bright enough" → must be increased

/**
 * A reference to an axis value.
 *
 * Can reference a specific entity's current value, the result value after
 * editing, an absolute value, or a threshold.
 */
export interface AxisReference {
  /** Reference type */
  readonly kind:
    | 'current-value'    // The current value of entity on axis
    | 'result-value'     // The value after the edit
    | 'absolute-value'   // A specific numeric value
    | 'entity-value'     // Another entity's value on the same axis
    | 'threshold'        // A named threshold (e.g., "maximum", "nominal")
    | 'percentile'       // A percentile of the axis range
    | 'unspecified';     // No explicit reference (use pragmatic default)

  /** Entity ID (for current-value, result-value, entity-value) */
  readonly entityId?: string | undefined;

  /** Entity name (human-readable) */
  readonly entityName?: string | undefined;

  /** Absolute value (for absolute-value) */
  readonly absoluteValue?: number | undefined;

  /** Unit (for absolute-value) */
  readonly unit?: string | undefined;

  /** Threshold name (for threshold) */
  readonly thresholdName?: string | undefined;

  /** Percentile (0-100, for percentile) */
  readonly percentile?: number | undefined;
}

/**
 * Delta specification for relative comparatives.
 *
 * "a bit brighter" → delta = { magnitude: 'small', multiplier: 0.3 }
 * "much brighter" → delta = { magnitude: 'large', multiplier: 1.5 }
 */
export interface DeltaSpec {
  /** Named magnitude */
  readonly magnitude:
    | 'imperceptible'  // barely detectable change
    | 'small'          // "a bit", "slightly"
    | 'moderate'       // default comparative
    | 'large'          // "much", "a lot"
    | 'extreme'        // "way more", "drastically"
    | 'maximum';       // "as much as possible"

  /** Numeric multiplier on the axis's default step size */
  readonly multiplier: number;

  /** Optional absolute delta (if specified numerically) */
  readonly absoluteDelta?: number | undefined;

  /** Unit for absolute delta */
  readonly absoluteUnit?: string | undefined;

  /** How many modifier stacks produced this delta ("much much" = 2) */
  readonly modifierStackDepth: number;
}


// =============================================================================
// Degree-to-CPL Mapping
// =============================================================================

/**
 * Result of mapping a degree expression to CPL nodes.
 */
export interface DegreeToCPLResult {
  /** Generated goals */
  readonly goals: readonly CPLGoal[];

  /** Generated ordering constraints */
  readonly orderingConstraints: readonly AxisOrderingConstraint[];

  /** Generated CPL constraints (for preserve/bound constraints) */
  readonly cplConstraints: readonly CPLConstraint[];

  /** Holes (unresolved aspects) */
  readonly holes: readonly CPLHole[];

  /** Warnings */
  readonly warnings: readonly string[];

  /** Which axis candidate was selected (if determined) */
  readonly selectedAxisIndex: number | null;
}

/** Counter for unique IDs */
let degreeIdCounter = 0;

function nextDegreeId(prefix: string): string {
  return `${prefix}-deg-${++degreeIdCounter}`;
}

/**
 * Reset the degree ID counter (for testing).
 */
export function resetDegreeIdCounter(): void {
  degreeIdCounter = 0;
}

/**
 * Map a degree expression to CPL goals and axis ordering constraints.
 */
export function mapDegreeToCPL(
  degree: DegreeExpression,
  scope: CPLScope | null,
  config: DegreeToCPLConfig = DEFAULT_DEGREE_TO_CPL_CONFIG
): DegreeToCPLResult {
  const goals: CPLGoal[] = [];
  const orderingConstraints: AxisOrderingConstraint[] = [];
  const cplConstraints: CPLConstraint[] = [];
  const holes: CPLHole[] = [];
  const warnings: string[] = [];

  // Select axis (or create ambiguity hole)
  let selectedAxisIndex: number | null = null;
  let selectedAxis: AxisCandidate | null = null;

  if (degree.axisCandidates.length === 0) {
    warnings.push('Degree expression has no axis candidates');
    return { goals, orderingConstraints, cplConstraints, holes, warnings, selectedAxisIndex };
  }

  if (degree.axisCandidates.length === 1) {
    selectedAxisIndex = 0;
    selectedAxis = degree.axisCandidates[0]!;
  } else {
    // Multiple candidates — pick highest confidence or create hole
    const best = degree.axisCandidates.reduce((a, b) =>
      a.likelihood > b.likelihood ? a : b
    );

    if (best.likelihood >= config.autoSelectThreshold) {
      selectedAxisIndex = degree.axisCandidates.indexOf(best);
      selectedAxis = best;
    } else {
      // Create ambiguity hole
      holes.push({
        type: 'hole',
        id: nextDegreeId(config.idPrefix),
        holeKind: 'ambiguous-reference',
        priority: 'medium',
        question: `Which quality does "${degree.adjective.surfaceForm}" refer to?`,
        options: degree.axisCandidates.map((c, i) => ({
          id: `axis-${i}`,
          description: `${c.axisName} (${c.likelihood > 0.7 ? 'likely' : 'possible'})`,
          resolution: c.axisName,
          confidence: c.likelihood,
        })),
        defaultOption: 0,
      });
      // Use first candidate tentatively
      selectedAxisIndex = 0;
      selectedAxis = degree.axisCandidates[0]!;
    }
  }

  if (!selectedAxis) return { goals, orderingConstraints, cplConstraints, holes, warnings, selectedAxisIndex };

  // Map by degree type
  switch (degree.type) {
    case 'comparative':
      mapComparativeDegree(degree, selectedAxis, scope, config, goals, orderingConstraints, cplConstraints, warnings);
      break;

    case 'superlative':
      mapSuperlativeDegree(degree, selectedAxis, scope, config, goals, orderingConstraints, warnings);
      break;

    case 'equative':
      mapEquativeDegree(degree, selectedAxis, scope, config, goals, orderingConstraints, warnings);
      break;

    case 'excessive':
      mapExcessiveDegree(degree, selectedAxis, scope, config, goals, orderingConstraints, cplConstraints, warnings);
      break;

    case 'sufficient':
      mapSufficientDegree(degree, selectedAxis, scope, config, goals, orderingConstraints, cplConstraints, warnings);
      break;

    case 'absolute':
      mapAbsoluteDegree(degree, selectedAxis, scope, config, goals, warnings);
      break;

    case 'relative':
      mapRelativeDegree(degree, selectedAxis, scope, config, goals, orderingConstraints, warnings);
      break;

    case 'positive':
      mapPositiveDegree(degree, selectedAxis, scope, config, goals, orderingConstraints, warnings);
      break;
  }

  return { goals, orderingConstraints, cplConstraints, holes, warnings, selectedAxisIndex };
}


// =============================================================================
// Degree Type Mappers
// =============================================================================

/**
 * Map a comparative degree ("brighter", "more warm").
 *
 * Result: axis ordering constraint + goal.
 */
function mapComparativeDegree(
  degree: DegreeExpression,
  axis: AxisCandidate,
  scope: CPLScope | null,
  config: DegreeToCPLConfig,
  goals: CPLGoal[],
  orderings: AxisOrderingConstraint[],
  _cplConstraints: CPLConstraint[],
  _warnings: string[]
): void {
  const direction = degree.direction;
  const delta = magnitudeToDelta(degree.magnitude, config);

  // Create ordering constraint
  const ordering: AxisOrderingConstraint = {
    id: nextDegreeId(config.idPrefix),
    axis: axis.axisName,
    relation: direction === 'increase' ? 'greater-than' : 'less-than',
    lhs: { kind: 'result-value' },
    rhs: degree.standard
      ? standardToAxisRef(degree.standard)
      : { kind: 'current-value' },
    delta,
    negated: false,
    sourceDegreeType: 'comparative',
    confidence: axis.likelihood,
    sourceSpan: [degree.span.start, degree.span.end],
  };
  orderings.push(ordering);

  // Create goal
  goals.push({
    type: 'goal',
    id: nextDegreeId(config.idPrefix),
    variant: 'axis-goal',
    axis: axis.axisName,
    direction: direction === 'increase' ? 'increase' : 'decrease',
    targetValue: deltaToAmount(delta),
    ...(scope ? { scope } : {}),
  });
}

/**
 * Map a superlative degree ("brightest", "most warm").
 *
 * Result: maximize/minimize ordering constraint + goal.
 */
function mapSuperlativeDegree(
  degree: DegreeExpression,
  axis: AxisCandidate,
  scope: CPLScope | null,
  config: DegreeToCPLConfig,
  goals: CPLGoal[],
  orderings: AxisOrderingConstraint[],
  _warnings: string[]
): void {
  const isMaximize = degree.direction === 'increase' || degree.direction === 'maximize';

  orderings.push({
    id: nextDegreeId(config.idPrefix),
    axis: axis.axisName,
    relation: isMaximize ? 'maximize' : 'minimize',
    lhs: { kind: 'result-value' },
    rhs: { kind: 'threshold', thresholdName: isMaximize ? 'maximum' : 'minimum' },
    delta: null,
    negated: false,
    sourceDegreeType: 'superlative',
    confidence: axis.likelihood,
    sourceSpan: [degree.span.start, degree.span.end],
  });

  goals.push({
    type: 'goal',
    id: nextDegreeId(config.idPrefix),
    variant: 'axis-goal',
    axis: axis.axisName,
    direction: isMaximize ? 'increase' : 'decrease',
    targetValue: {
      type: 'qualitative',
      qualifier: 'completely',
    },
    ...(scope ? { scope } : {}),
  });
}

/**
 * Map an equative degree ("as bright as X").
 *
 * Result: equality ordering constraint + goal.
 */
function mapEquativeDegree(
  degree: DegreeExpression,
  axis: AxisCandidate,
  scope: CPLScope | null,
  config: DegreeToCPLConfig,
  goals: CPLGoal[],
  orderings: AxisOrderingConstraint[],
  warnings: string[]
): void {
  if (!degree.standard) {
    warnings.push('Equative degree without comparison standard');
    return;
  }

  orderings.push({
    id: nextDegreeId(config.idPrefix),
    axis: axis.axisName,
    relation: 'equal-to',
    lhs: { kind: 'result-value' },
    rhs: standardToAxisRef(degree.standard),
    delta: null,
    negated: false,
    sourceDegreeType: 'equative',
    confidence: axis.likelihood,
    sourceSpan: [degree.span.start, degree.span.end],
  });

  goals.push({
    type: 'goal',
    id: nextDegreeId(config.idPrefix),
    variant: 'axis-goal',
    axis: axis.axisName,
    direction: 'set',
    ...(scope ? { scope } : {}),
  });
}

/**
 * Map an excessive degree ("too bright").
 *
 * Result: below-threshold constraint → decrease goal.
 */
function mapExcessiveDegree(
  degree: DegreeExpression,
  axis: AxisCandidate,
  scope: CPLScope | null,
  config: DegreeToCPLConfig,
  goals: CPLGoal[],
  orderings: AxisOrderingConstraint[],
  cplConstraints: CPLConstraint[],
  _warnings: string[]
): void {
  // "Too bright" means brightness exceeds an acceptable threshold
  // → need to decrease it
  orderings.push({
    id: nextDegreeId(config.idPrefix),
    axis: axis.axisName,
    relation: 'below-threshold',
    lhs: { kind: 'result-value' },
    rhs: { kind: 'threshold', thresholdName: 'acceptable-maximum' },
    delta: null,
    negated: false,
    sourceDegreeType: 'excessive',
    confidence: axis.likelihood,
    sourceSpan: [degree.span.start, degree.span.end],
  });

  // Generate a bound constraint
  cplConstraints.push({
    type: 'constraint',
    id: nextDegreeId(config.idPrefix),
    variant: 'range',
    strength: 'hard',
    description: `${axis.axisName} must not be excessive`,
  });

  // Generate a decrease goal
  goals.push({
    type: 'goal',
    id: nextDegreeId(config.idPrefix),
    variant: 'axis-goal',
    axis: axis.axisName,
    direction: 'decrease',
    targetValue: { type: 'qualitative', qualifier: 'somewhat' },
    ...(scope ? { scope } : {}),
  });
}

/**
 * Map a sufficient degree ("bright enough").
 *
 * Result: above-threshold constraint → may or may not need a goal.
 */
function mapSufficientDegree(
  degree: DegreeExpression,
  axis: AxisCandidate,
  _scope: CPLScope | null,
  config: DegreeToCPLConfig,
  _goals: CPLGoal[],
  orderings: AxisOrderingConstraint[],
  cplConstraints: CPLConstraint[],
  _warnings: string[]
): void {
  orderings.push({
    id: nextDegreeId(config.idPrefix),
    axis: axis.axisName,
    relation: 'greater-or-equal',
    lhs: { kind: 'result-value' },
    rhs: { kind: 'threshold', thresholdName: 'sufficient-minimum' },
    delta: null,
    negated: false,
    sourceDegreeType: 'sufficient',
    confidence: axis.likelihood,
    sourceSpan: [degree.span.start, degree.span.end],
  });

  // "Bright enough" might mean "it's currently sufficient" (inspect) or
  // "ensure it stays sufficient" (preserve constraint)
  cplConstraints.push({
    type: 'constraint',
    id: nextDegreeId(config.idPrefix),
    variant: 'range',
    strength: 'soft',
    description: `${axis.axisName} should be at least sufficient`,
  });
}

/**
 * Map an absolute degree ("120 BPM", "3 dB").
 *
 * Result: goal with exact target value.
 */
function mapAbsoluteDegree(
  degree: DegreeExpression,
  axis: AxisCandidate,
  scope: CPLScope | null,
  config: DegreeToCPLConfig,
  goals: CPLGoal[],
  _warnings: string[]
): void {
  const amount: CPLAmount = {
    type: 'absolute',
    value: degree.magnitude.absoluteValue ?? degree.magnitude.intensity,
    ...(degree.magnitude.absoluteUnit ? { unit: degree.magnitude.absoluteUnit } : {}),
  };

  goals.push({
    type: 'goal',
    id: nextDegreeId(config.idPrefix),
    variant: 'axis-goal',
    axis: axis.axisName,
    direction: 'set',
    targetValue: amount,
    ...(scope ? { scope } : {}),
  });
}

/**
 * Map a relative degree ("a bit brighter", "much darker").
 *
 * Result: ordering constraint with delta + goal with relative amount.
 */
function mapRelativeDegree(
  degree: DegreeExpression,
  axis: AxisCandidate,
  scope: CPLScope | null,
  config: DegreeToCPLConfig,
  goals: CPLGoal[],
  orderings: AxisOrderingConstraint[],
  _warnings: string[]
): void {
  const delta = magnitudeToDelta(degree.magnitude, config);

  orderings.push({
    id: nextDegreeId(config.idPrefix),
    axis: axis.axisName,
    relation: degree.direction === 'increase' ? 'greater-than' : 'less-than',
    lhs: { kind: 'result-value' },
    rhs: { kind: 'current-value' },
    delta,
    negated: false,
    sourceDegreeType: 'relative',
    confidence: axis.likelihood,
    sourceSpan: [degree.span.start, degree.span.end],
  });

  goals.push({
    type: 'goal',
    id: nextDegreeId(config.idPrefix),
    variant: 'axis-goal',
    axis: axis.axisName,
    direction: degree.direction === 'increase' ? 'increase' : 'decrease',
    targetValue: deltaToAmount(delta),
    ...(scope ? { scope } : {}),
  });
}

/**
 * Map a positive degree ("bright" — base form).
 *
 * Positive form is context-dependent:
 * - "make it bright" → increase brightness
 * - "is it bright?" → inspect brightness (no change goal)
 * - "keep it bright" → preserve brightness
 */
function mapPositiveDegree(
  degree: DegreeExpression,
  axis: AxisCandidate,
  scope: CPLScope | null,
  config: DegreeToCPLConfig,
  goals: CPLGoal[],
  orderings: AxisOrderingConstraint[],
  _warnings: string[]
): void {
  // Default: treat as a comparative "more X" with moderate delta
  const delta: DeltaSpec = {
    magnitude: 'moderate',
    multiplier: config.defaultStepMultiplier,
    modifierStackDepth: 0,
  };

  orderings.push({
    id: nextDegreeId(config.idPrefix),
    axis: axis.axisName,
    relation: degree.direction === 'decrease' ? 'less-than' : 'greater-than',
    lhs: { kind: 'result-value' },
    rhs: { kind: 'current-value' },
    delta,
    negated: false,
    sourceDegreeType: 'positive',
    confidence: axis.likelihood * 0.8, // Lower confidence for positive form
    sourceSpan: [degree.span.start, degree.span.end],
  });

  goals.push({
    type: 'goal',
    id: nextDegreeId(config.idPrefix),
    variant: 'axis-goal',
    axis: axis.axisName,
    direction: degree.direction === 'decrease' ? 'decrease' : 'increase',
    targetValue: deltaToAmount(delta),
    ...(scope ? { scope } : {}),
  });
}


// =============================================================================
// Configuration
// =============================================================================

/**
 * Configuration for degree-to-CPL mapping.
 */
export interface DegreeToCPLConfig {
  /** ID prefix for generated nodes */
  readonly idPrefix: string;

  /** Schema version */
  readonly schemaVersion: SemanticVersion;

  /** Confidence threshold for auto-selecting axis candidates */
  readonly autoSelectThreshold: number;

  /** Default step multiplier for moderate comparatives */
  readonly defaultStepMultiplier: number;

  /** Multiplier scale for degree modifiers */
  readonly modifierScale: Readonly<Record<string, number>>;
}

/**
 * Default configuration.
 */
export const DEFAULT_DEGREE_TO_CPL_CONFIG: DegreeToCPLConfig = {
  idPrefix: 'deg',
  schemaVersion: { major: 1, minor: 0, patch: 0 },
  autoSelectThreshold: 0.75,
  defaultStepMultiplier: 1.0,
  modifierScale: {
    'barely': 0.1,
    'slightly': 0.3,
    'a-bit': 0.3,
    'a-little': 0.3,
    'somewhat': 0.6,
    'moderately': 0.6,
    'noticeably': 0.8,
    'much': 1.5,
    'a-lot': 1.5,
    'very': 2.0,
    'extremely': 3.0,
    'drastically': 4.0,
    'completely': 5.0,
    'way-more': 3.0,
    'significantly': 2.0,
  },
};


// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Convert a DegreeMagnitude to a DeltaSpec.
 */
function magnitudeToDelta(
  magnitude: DegreeMagnitude,
  config: DegreeToCPLConfig
): DeltaSpec {
  const intensityToMagnitude = (intensity: number): DeltaSpec['magnitude'] => {
    if (intensity < 0.1) return 'imperceptible';
    if (intensity < 0.3) return 'small';
    if (intensity < 0.6) return 'moderate';
    if (intensity < 0.8) return 'large';
    if (intensity < 1.0) return 'extreme';
    return 'maximum';
  };

  const magnitudeName = intensityToMagnitude(magnitude.intensity);
  const multiplier = magnitude.intensity * config.defaultStepMultiplier;
  const stackDepth = magnitude.modifier ? 1 : 0;

  return {
    magnitude: magnitudeName,
    multiplier: multiplier * Math.pow(1.5, stackDepth),
    ...(magnitude.absoluteValue != null ? { absoluteDelta: magnitude.absoluteValue } : {}),
    ...(magnitude.absoluteUnit ? { absoluteUnit: magnitude.absoluteUnit } : {}),
    modifierStackDepth: stackDepth,
  };
}

/**
 * Convert a ComparisonStandard to an AxisReference.
 */
function standardToAxisRef(standard: ComparisonStandard): AxisReference {
  switch (standard.type) {
    case 'other_entity':
      return {
        kind: 'entity-value',
        ...(standard.referenceValue ? { entityName: standard.referenceValue } : {}),
      };

    case 'previous_state':
    case 'current_value':
      return {
        kind: 'current-value',
        ...(standard.referenceValue ? { entityName: standard.referenceValue } : {}),
      };

    case 'explicit_value':
      return {
        kind: 'absolute-value',
        ...(standard.referenceValue ? { entityName: standard.referenceValue } : {}),
      };

    case 'norm':
    default:
      return {
        kind: 'unspecified',
        ...(standard.referenceValue ? { entityName: standard.referenceValue } : {}),
      };
  }
}

/**
 * Convert a DeltaSpec to a CPLAmount.
 */
function deltaToAmount(delta: DeltaSpec): CPLAmount {
  if (delta.absoluteDelta != null) {
    return {
      type: 'relative',
      value: delta.absoluteDelta,
      ...(delta.absoluteUnit ? { unit: delta.absoluteUnit } : {}),
    };
  }

  const qualifierMap: Record<DeltaSpec['magnitude'], CPLAmount['qualifier']> = {
    'imperceptible': 'slightly',
    'small': 'a-little',
    'moderate': 'somewhat',
    'large': 'much',
    'extreme': 'completely',
    'maximum': 'completely',
  };

  return {
    type: 'qualitative',
    qualifier: qualifierMap[delta.magnitude] ?? 'somewhat',
  };
}


// =============================================================================
// Cross-Entity Comparative Handling
// =============================================================================

/**
 * A cross-entity comparative constraint.
 *
 * "make the bass louder than the vocals"
 * → AxisOrderingConstraint { axis: volume, lhs: bass, rhs: vocals, relation: greater-than }
 */
export interface CrossEntityComparative {
  /** The axis being compared */
  readonly axis: string;

  /** The entity that should be higher/lower */
  readonly subject: {
    readonly entityType: string;
    readonly entityName: string;
  };

  /** The comparison standard entity */
  readonly standard: {
    readonly entityType: string;
    readonly entityName: string;
  };

  /** Whether subject should be higher (true) or lower (false) */
  readonly subjectHigher: boolean;

  /** Delta (if specified: "3dB louder than") */
  readonly delta: DeltaSpec | null;
}

/**
 * Map a cross-entity comparative to an AxisOrderingConstraint.
 */
export function mapCrossEntityComparative(
  comparative: CrossEntityComparative,
  config: DegreeToCPLConfig = DEFAULT_DEGREE_TO_CPL_CONFIG
): AxisOrderingConstraint {
  return {
    id: nextDegreeId(config.idPrefix),
    axis: comparative.axis,
    relation: comparative.subjectHigher ? 'greater-than' : 'less-than',
    lhs: {
      kind: 'entity-value',
      entityName: comparative.subject.entityName,
    },
    rhs: {
      kind: 'entity-value',
      entityName: comparative.standard.entityName,
    },
    delta: comparative.delta,
    negated: false,
    sourceDegreeType: 'comparative',
    confidence: 0.9,
  };
}


// =============================================================================
// Negated Comparative Handling
// =============================================================================

/**
 * Map a negated comparative to CPL nodes.
 *
 * "don't make it brighter" → either preserve current or decrease
 * "not louder than X" → constrain to be ≤ X
 */
export function mapNegatedComparative(
  degree: DegreeExpression,
  axis: AxisCandidate,
  _scope: CPLScope | null,
  config: DegreeToCPLConfig = DEFAULT_DEGREE_TO_CPL_CONFIG
): {
  readonly constraint: CPLConstraint;
  readonly ordering: AxisOrderingConstraint;
} {
  // "Not brighter" → result ≤ current (preserve or decrease)
  const ordering: AxisOrderingConstraint = {
    id: nextDegreeId(config.idPrefix),
    axis: axis.axisName,
    relation: degree.direction === 'increase' ? 'less-than' : 'greater-than',
    lhs: { kind: 'result-value' },
    rhs: degree.standard
      ? standardToAxisRef(degree.standard)
      : { kind: 'current-value' },
    delta: null,
    negated: true,
    sourceDegreeType: degree.type,
    confidence: axis.likelihood,
    sourceSpan: [degree.span.start, degree.span.end],
  };

  const constraint: CPLConstraint = {
    type: 'constraint',
    id: nextDegreeId(config.idPrefix),
    variant: 'range',
    strength: 'hard',
    description: `${axis.axisName} must not ${degree.direction === 'increase' ? 'increase' : 'decrease'}`,
  };

  return { constraint, ordering };
}


// =============================================================================
// Formatting
// =============================================================================

/**
 * Format an AxisOrderingConstraint for debugging.
 */
export function formatAxisOrdering(constraint: AxisOrderingConstraint): string {
  const lhsStr = formatAxisRef(constraint.lhs);
  const rhsStr = formatAxisRef(constraint.rhs);
  const deltaStr = constraint.delta
    ? ` (delta: ${constraint.delta.magnitude}, ×${constraint.delta.multiplier.toFixed(2)})`
    : '';
  const negStr = constraint.negated ? 'NOT ' : '';

  return `${negStr}${constraint.axis}: ${lhsStr} ${constraint.relation} ${rhsStr}${deltaStr} [${constraint.sourceDegreeType}]`;
}

/**
 * Format an AxisReference for display.
 */
function formatAxisRef(ref: AxisReference): string {
  switch (ref.kind) {
    case 'current-value': return ref.entityName ? `current(${ref.entityName})` : 'current';
    case 'result-value': return ref.entityName ? `result(${ref.entityName})` : 'result';
    case 'absolute-value': return `${ref.absoluteValue}${ref.unit ? ` ${ref.unit}` : ''}`;
    case 'entity-value': return `value(${ref.entityName ?? ref.entityId ?? '?'})`;
    case 'threshold': return `threshold(${ref.thresholdName ?? '?'})`;
    case 'percentile': return `P${ref.percentile ?? '?'}`;
    case 'unspecified': return '?';
    default: return '?';
  }
}

/**
 * Format a DegreeToCPLResult for debugging.
 */
export function formatDegreeToCPLResult(result: DegreeToCPLResult): string {
  const lines: string[] = ['=== Degree → CPL Result ==='];

  lines.push(`Goals: ${result.goals.length}`);
  for (const g of result.goals) {
    lines.push(`  ${g.id}: ${g.axis ?? '?'} ${g.direction ?? '?'}`);
  }

  lines.push(`Ordering constraints: ${result.orderingConstraints.length}`);
  for (const o of result.orderingConstraints) {
    lines.push(`  ${formatAxisOrdering(o)}`);
  }

  lines.push(`CPL constraints: ${result.cplConstraints.length}`);
  lines.push(`Holes: ${result.holes.length}`);
  lines.push(`Warnings: ${result.warnings.length}`);

  if (result.selectedAxisIndex !== null) {
    lines.push(`Selected axis: index ${result.selectedAxisIndex}`);
  }

  return lines.join('\n');
}


// =============================================================================
// Batch Processing
// =============================================================================

/**
 * Map multiple degree expressions to CPL (for stacked adjectives).
 *
 * "brighter and wider and less busy" → 3 degree expressions → merged result
 */
export function mapDegreeStackToCPL(
  degrees: readonly DegreeExpression[],
  scope: CPLScope | null,
  config: DegreeToCPLConfig = DEFAULT_DEGREE_TO_CPL_CONFIG
): DegreeToCPLResult {
  const allGoals: CPLGoal[] = [];
  const allOrderings: AxisOrderingConstraint[] = [];
  const allConstraints: CPLConstraint[] = [];
  const allHoles: CPLHole[] = [];
  const allWarnings: string[] = [];

  for (const degree of degrees) {
    const result = mapDegreeToCPL(degree, scope, config);
    allGoals.push(...result.goals);
    allOrderings.push(...result.orderingConstraints);
    allConstraints.push(...result.cplConstraints);
    allHoles.push(...result.holes);
    allWarnings.push(...result.warnings);
  }

  return {
    goals: allGoals,
    orderingConstraints: allOrderings,
    cplConstraints: allConstraints,
    holes: allHoles,
    warnings: allWarnings,
    selectedAxisIndex: null,
  };
}
