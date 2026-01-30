/**
 * GOFAI NL Semantics — Musical Constraints
 *
 * Typed representations for constraints that can be checked against diffs.
 * Constraints express "what must not change" or "what invariants must hold"
 * during an edit operation.
 *
 * ## Constraint Types
 *
 * 1. **Preserve Constraints**: Keep something unchanged
 *    - "Keep the melody the same"
 *    - "Preserve the chord changes"
 *    - "Don't touch the bass"
 *
 * 2. **Range Constraints**: Keep a value within bounds
 *    - "Don't make it too loud"
 *    - "Keep the tempo between 110 and 130"
 *
 * 3. **Relation Constraints**: Maintain a relationship between entities
 *    - "Keep the bass lower than the kick"
 *    - "The melody should stay above the harmony"
 *
 * 4. **Structural Constraints**: Maintain structural properties
 *    - "Keep the same number of sections"
 *    - "Don't add more than 4 layers"
 *
 * 5. **Identity Constraints**: Maintain recognizability
 *    - "Keep the melody recognizable"
 *    - "Preserve the rhythmic feel"
 *
 * ## Constraint Checking Against Diffs
 *
 * Each constraint has a `checkable` representation that specifies:
 * - **What to inspect**: The entity/property being constrained
 * - **What predicate to check**: Equality, ordering, range, etc.
 * - **Tolerance**: How much deviation is allowed
 * - **Verification method**: How to compare before/after states
 *
 * @module gofai/nl/semantics/musical-constraints
 * @see gofai_goalA.md Step 159
 */

import type { CPLConstraint } from '../../canon/cpl-types';


// =============================================================================
// CONSTRAINT CATEGORIES
// =============================================================================

/**
 * Top-level constraint categories.
 */
export type MusicalConstraintCategory =
  | 'preserve'         // Keep something unchanged
  | 'range'            // Keep value within bounds
  | 'relation'         // Maintain relationship between entities
  | 'structural'       // Maintain structural properties
  | 'identity'         // Maintain recognizability
  | 'temporal'         // Maintain timing properties
  | 'harmonic'         // Maintain harmonic properties
  | 'timbral'          // Maintain timbral properties
  | 'forbidden';       // Explicitly disallow something

/**
 * How strictly a constraint must be enforced.
 */
export type ConstraintStrength =
  | 'hard'       // Must be satisfied — violation is an error
  | 'soft'       // Should be satisfied — violation is a warning
  | 'advisory';  // Preference — violation is acceptable but noted

/**
 * Whether a constraint can be automatically checked.
 */
export type ConstraintCheckability =
  | 'fully_checkable'    // Can be checked automatically against a diff
  | 'partially_checkable' // Some aspects can be checked, others require judgment
  | 'not_checkable';     // Requires human judgment (e.g., "sounds good")


// =============================================================================
// BASE MUSICAL CONSTRAINT
// =============================================================================

/**
 * Base interface for all musical constraints.
 */
export interface MusicalConstraintBase {
  /** Unique constraint ID */
  readonly id: string;

  /** Category */
  readonly category: MusicalConstraintCategory;

  /** Human-readable description */
  readonly description: string;

  /** Strength */
  readonly strength: ConstraintStrength;

  /** Whether this constraint can be checked automatically */
  readonly checkability: ConstraintCheckability;

  /** The scope this constraint applies to */
  readonly scope: ConstraintScope;

  /** Whether the constraint was explicitly stated by the user */
  readonly explicit: boolean;

  /** Confidence (0–1) */
  readonly confidence: number;

  /** Source text */
  readonly sourceText: string | null;

  /** Source span */
  readonly sourceSpan: { readonly start: number; readonly end: number } | null;

  /** Verification specification: how to check this constraint */
  readonly verification: ConstraintVerification;

  /** What to do if the constraint is violated */
  readonly violationPolicy: ViolationPolicy;

  /** Related constraints (e.g., this constraint implies or conflicts with others) */
  readonly relatedConstraints: readonly ConstraintRelation[];
}


// =============================================================================
// CONSTRAINT SCOPE — what the constraint applies to
// =============================================================================

/**
 * What a constraint applies to.
 */
export interface ConstraintScope {
  /** Scope type */
  readonly scopeType: ConstraintScopeType;

  /** Reference text */
  readonly reference: string;

  /** Entity type (if resolved) */
  readonly entityType: string | null;

  /** Specific property within the entity (e.g., "pitch", "timing", "volume") */
  readonly property: string | null;

  /** Whether this applies globally */
  readonly global: boolean;
}

/**
 * Types of constraint scopes.
 */
export type ConstraintScopeType =
  | 'entity'           // A specific entity (section, layer, note)
  | 'property'         // A property of an entity (pitch of melody, volume of drums)
  | 'axis'             // A perceptual axis value
  | 'relationship'     // A relationship between entities
  | 'structure'        // The overall structure
  | 'all'              // Everything (global constraint)
  | 'selection';       // Current selection


// =============================================================================
// CONSTRAINT VERIFICATION — how to check constraints
// =============================================================================

/**
 * How to verify a constraint against a diff/change.
 */
export interface ConstraintVerification {
  /** The verification method */
  readonly method: VerificationMethod;

  /** What to compare */
  readonly comparisonTarget: ComparisonTarget;

  /** Tolerance for numerical comparisons */
  readonly tolerance: VerificationTolerance | null;

  /** Additional parameters for the verification */
  readonly parameters: Readonly<Record<string, string | number | boolean>>;
}

/**
 * Verification methods.
 */
export type VerificationMethod =
  | 'equality'            // Before == After
  | 'approximate_equality' // |Before - After| < tolerance
  | 'ordering'            // Before < After (or >, <=, >=)
  | 'range_check'         // min <= value <= max
  | 'set_membership'      // value ∈ allowed_set
  | 'set_exclusion'       // value ∉ forbidden_set
  | 'count_check'         // count(items) matches predicate
  | 'structure_equality'  // Structural comparison (tree/graph isomorphism)
  | 'contour_similarity'  // Melodic contour similarity (correlation)
  | 'rhythm_similarity'   // Onset pattern similarity
  | 'harmonic_equivalence' // Functional harmonic equivalence
  | 'spectral_similarity' // Spectral fingerprint comparison
  | 'perceptual_distance' // Perceptual distance metric
  | 'custom';             // Custom verification function

/**
 * What to compare when checking a constraint.
 */
export interface ComparisonTarget {
  /** What entity/property to inspect */
  readonly target: string;

  /** How to extract the value to compare */
  readonly extractor: ValueExtractor;

  /** What to compare against */
  readonly reference: ComparisonReference;
}

/**
 * How to extract a value from the project state for comparison.
 */
export type ValueExtractor =
  | { readonly kind: 'raw_value'; readonly path: string }
  | { readonly kind: 'pitch_sequence'; readonly entityRef: string }
  | { readonly kind: 'rhythm_onsets'; readonly entityRef: string }
  | { readonly kind: 'chord_symbols'; readonly entityRef: string }
  | { readonly kind: 'contour_vector'; readonly entityRef: string }
  | { readonly kind: 'spectral_centroid'; readonly entityRef: string }
  | { readonly kind: 'rms_level'; readonly entityRef: string }
  | { readonly kind: 'entity_count'; readonly entityType: string }
  | { readonly kind: 'property_value'; readonly entityRef: string; readonly property: string }
  | { readonly kind: 'structural_hash'; readonly entityRef: string }
  | { readonly kind: 'interval_sequence'; readonly entityRef: string }
  | { readonly kind: 'duration_sequence'; readonly entityRef: string };

/**
 * What to compare against.
 */
export type ComparisonReference =
  | { readonly kind: 'before_state' }           // Compare with state before the edit
  | { readonly kind: 'absolute_value'; readonly value: number | string }
  | { readonly kind: 'range'; readonly min: number; readonly max: number }
  | { readonly kind: 'other_entity'; readonly entityRef: string }
  | { readonly kind: 'template'; readonly templateId: string }
  | { readonly kind: 'previous_version'; readonly versionId: string };

/**
 * Tolerance specification for approximate comparisons.
 */
export interface VerificationTolerance {
  /** The tolerance metric */
  readonly metric: ToleranceMetric;

  /** The tolerance value */
  readonly value: number;

  /** Unit (if applicable) */
  readonly unit: string | null;

  /** Description */
  readonly description: string;
}

/**
 * Tolerance metrics.
 */
export type ToleranceMetric =
  | 'absolute_difference'   // |a - b| < tolerance
  | 'relative_difference'   // |a - b| / |a| < tolerance
  | 'percentage'            // Percentage deviation
  | 'semitones'             // Pitch difference in semitones
  | 'beats'                 // Timing difference in beats
  | 'milliseconds'          // Timing difference in ms
  | 'decibels'              // Level difference in dB
  | 'correlation'           // Correlation coefficient > tolerance
  | 'edit_distance'         // Sequence edit distance < tolerance
  | 'cosine_similarity';    // Cosine similarity > tolerance


// =============================================================================
// VIOLATION POLICY — what to do when a constraint is violated
// =============================================================================

/**
 * What to do if a constraint is violated.
 */
export interface ViolationPolicy {
  /** Action on violation */
  readonly action: ViolationAction;

  /** Priority of this constraint vs others when resolving conflicts */
  readonly priority: number;

  /** Whether to notify the user about the violation */
  readonly notify: boolean;

  /** Custom message for violations */
  readonly violationMessage: string | null;

  /** Suggested fix category (if any) */
  readonly suggestedFix: ViolationFix | null;
}

/**
 * Actions to take on constraint violation.
 */
export type ViolationAction =
  | 'reject'      // Reject the edit entirely
  | 'warn'        // Allow the edit but warn
  | 'auto_fix'    // Automatically fix the violation
  | 'propose_fix' // Propose a fix to the user
  | 'log'         // Just log the violation
  | 'ignore';     // Ignore the violation

/**
 * Suggested fix for a constraint violation.
 */
export interface ViolationFix {
  /** Fix strategy */
  readonly strategy: FixStrategy;

  /** Description */
  readonly description: string;

  /** Parameters for the fix */
  readonly parameters: Readonly<Record<string, string | number | boolean>>;
}

/**
 * Fix strategies for constraint violations.
 */
export type FixStrategy =
  | 'revert_property'    // Revert the changed property to its previous value
  | 'clamp_to_range'     // Clamp the value to the allowed range
  | 'snap_to_nearest'    // Snap to the nearest valid value
  | 'interpolate'        // Interpolate between the old and new values
  | 'undo_last_step'     // Undo the last edit step
  | 'adjust_amount'      // Reduce the edit amount until constraint is satisfied
  | 'apply_compensation' // Apply a compensating edit
  | 'request_override';  // Ask the user to explicitly override


// =============================================================================
// CONSTRAINT RELATIONS
// =============================================================================

/**
 * A relation between two constraints.
 */
export interface ConstraintRelation {
  /** The related constraint ID */
  readonly targetConstraintId: string;

  /** The relation type */
  readonly relationType: ConstraintRelationType;

  /** Description */
  readonly description: string;
}

/**
 * Types of constraint relations.
 */
export type ConstraintRelationType =
  | 'implies'          // This constraint implies the target
  | 'conflicts_with'   // This constraint conflicts with the target
  | 'subsumes'         // This constraint is stricter than the target
  | 'equivalent_to'    // These constraints have the same effect
  | 'complementary';   // These constraints together cover more cases


// =============================================================================
// SPECIFIC CONSTRAINT TYPES
// =============================================================================

/**
 * Preserve Constraint: Keep something unchanged.
 */
export interface PreserveConstraint extends MusicalConstraintBase {
  readonly category: 'preserve';

  /** What preservation mode to use */
  readonly preserveMode: PreserveMode;

  /** Target entity or property */
  readonly preserveTarget: string;

  /** Target entity type */
  readonly preserveEntityType: string | null;

  /** Which aspects to preserve (all, or specific properties) */
  readonly preserveAspects: readonly PreserveAspect[];
}

/**
 * Preservation modes.
 */
export type PreserveMode =
  | 'exact'         // Byte-for-byte identical
  | 'functional'    // Musically equivalent (same function)
  | 'recognizable'  // Recognizably similar (contour match)
  | 'structural'    // Same structure (different content OK)
  | 'proportional'; // Same relative values (absolute change OK)

/**
 * Which aspect of an entity to preserve.
 */
export interface PreserveAspect {
  /** Aspect name */
  readonly aspect: string;

  /** Description */
  readonly description: string;

  /** How to verify this aspect */
  readonly verificationMethod: VerificationMethod;

  /** Tolerance (if approximate) */
  readonly tolerance: VerificationTolerance | null;
}

/**
 * Range Constraint: Keep a value within bounds.
 */
export interface RangeConstraint extends MusicalConstraintBase {
  readonly category: 'range';

  /** The property being constrained */
  readonly property: string;

  /** Minimum value (null = no lower bound) */
  readonly min: number | null;

  /** Maximum value (null = no upper bound) */
  readonly max: number | null;

  /** Unit */
  readonly unit: string | null;

  /** Whether the bounds are inclusive */
  readonly inclusive: boolean;
}

/**
 * Relation Constraint: Maintain a relationship between entities.
 */
export interface RelationConstraint extends MusicalConstraintBase {
  readonly category: 'relation';

  /** The relation type */
  readonly relation: ConstraintRelationKind;

  /** Left-hand entity */
  readonly leftEntity: string;

  /** Right-hand entity */
  readonly rightEntity: string;

  /** Property being compared (null = overall level) */
  readonly comparedProperty: string | null;

  /** Margin/gap to maintain (if applicable) */
  readonly margin: number | null;

  /** Unit for the margin */
  readonly marginUnit: string | null;
}

/**
 * Relation kinds for ordering/comparison constraints.
 */
export type ConstraintRelationKind =
  | 'less_than'           // A < B
  | 'greater_than'        // A > B
  | 'less_or_equal'       // A <= B
  | 'greater_or_equal'    // A >= B
  | 'equal'               // A == B
  | 'not_equal'           // A != B
  | 'proportional'        // A ∝ B (same ratio)
  | 'independent'         // A changes independently of B
  | 'inverse'             // A inversely related to B
  | 'same_contour'        // A and B have same shape
  | 'complementary';      // A and B complement each other

/**
 * Structural Constraint: Maintain structural properties.
 */
export interface StructuralConstraint extends MusicalConstraintBase {
  readonly category: 'structural';

  /** What structural property */
  readonly structuralProperty: StructuralPropertyKind;

  /** Expected value (count, arrangement, etc.) */
  readonly expectedValue: string | number | null;

  /** Comparison operator */
  readonly operator: StructuralOperator;
}

/**
 * Structural property kinds.
 */
export type StructuralPropertyKind =
  | 'section_count'         // Number of sections
  | 'layer_count'           // Number of layers
  | 'section_order'         // Order of sections
  | 'section_lengths'       // Duration of sections
  | 'bar_count'             // Number of bars
  | 'time_signature'        // Time signature
  | 'key_signature'         // Key signature
  | 'song_structure'        // Overall form (AABA, verse-chorus, etc.)
  | 'layer_assignment'      // Which instruments on which layers
  | 'routing'               // Signal routing
  | 'automation_presence';  // Whether automation exists

/**
 * Structural operators.
 */
export type StructuralOperator =
  | 'equals'              // Must equal the expected value
  | 'not_equals'          // Must not equal
  | 'at_most'             // Must be <= expected value
  | 'at_least'            // Must be >= expected value
  | 'unchanged'           // Must be the same as before the edit
  | 'contains'            // Must contain the expected value
  | 'does_not_contain';   // Must not contain

/**
 * Identity Constraint: Maintain recognizability of a musical element.
 */
export interface IdentityConstraint extends MusicalConstraintBase {
  readonly category: 'identity';

  /** What identity to preserve */
  readonly identityKind: MusicalIdentityKind;

  /** The entity whose identity must be preserved */
  readonly entityRef: string;

  /** How similar the result must be (0–1) */
  readonly similarityThreshold: number;

  /** What features define this identity */
  readonly identityFeatures: readonly IdentityFeature[];
}

/**
 * Kinds of musical identity.
 */
export type MusicalIdentityKind =
  | 'melodic'      // Melodic identity (pitch sequence / contour)
  | 'rhythmic'     // Rhythmic identity (onset pattern)
  | 'harmonic'     // Harmonic identity (chord progression)
  | 'timbral'      // Timbral identity (sound character)
  | 'structural'   // Structural identity (form)
  | 'textural'     // Textural identity (density, layering)
  | 'dynamic'      // Dynamic identity (loudness contour)
  | 'composite';   // Composite identity (overall character)

/**
 * A feature that contributes to musical identity.
 */
export interface IdentityFeature {
  /** Feature name */
  readonly name: string;

  /** How important this feature is to the identity (0–1) */
  readonly weight: number;

  /** How to extract this feature */
  readonly extractor: ValueExtractor;

  /** Comparison method */
  readonly comparisonMethod: VerificationMethod;

  /** Minimum similarity for this feature (0–1) */
  readonly minSimilarity: number;
}

/**
 * Temporal Constraint: Maintain timing properties.
 */
export interface TemporalConstraint extends MusicalConstraintBase {
  readonly category: 'temporal';

  /** What timing property */
  readonly temporalProperty: TemporalPropertyKind;

  /** Expected value */
  readonly expectedValue: number | string | null;

  /** Tolerance */
  readonly timingTolerance: VerificationTolerance | null;
}

/**
 * Temporal property kinds.
 */
export type TemporalPropertyKind =
  | 'tempo'              // BPM
  | 'duration'           // Length in time
  | 'start_time'         // When something starts
  | 'end_time'           // When something ends
  | 'note_timing'        // Onset times of notes
  | 'phrase_boundaries'  // Where phrases start/end
  | 'sync_alignment'     // Alignment between layers
  | 'meter'              // Metric structure
  | 'groove_pattern';    // Swing/groove timing pattern

/**
 * Harmonic Constraint: Maintain harmonic properties.
 */
export interface HarmonicConstraint extends MusicalConstraintBase {
  readonly category: 'harmonic';

  /** What harmonic property */
  readonly harmonicProperty: HarmonicPropertyKind;

  /** Expected value */
  readonly expectedValue: string | null;

  /** Whether functional equivalence is acceptable */
  readonly functionalEquivalenceOK: boolean;
}

/**
 * Harmonic property kinds.
 */
export type HarmonicPropertyKind =
  | 'key'                   // Key center
  | 'mode'                  // Mode (major, minor, dorian, etc.)
  | 'chord_quality'         // Chord types used
  | 'chord_progression'     // Specific chord sequence
  | 'voice_leading'         // Voice leading rules
  | 'functional_harmony'    // Functional relationships (tonic, dominant, etc.)
  | 'cadence_type'          // Types of cadences
  | 'modulation'            // Key changes
  | 'tension_curve'         // Harmonic tension over time
  | 'consonance_level';     // Overall consonance/dissonance

/**
 * Timbral Constraint: Maintain timbral properties.
 */
export interface TimbralConstraint extends MusicalConstraintBase {
  readonly category: 'timbral';

  /** What timbral property */
  readonly timbralProperty: TimbralPropertyKind;

  /** Expected value or characteristic */
  readonly expectedCharacteristic: string | null;

  /** Tolerance for spectral comparison */
  readonly spectralTolerance: number | null;
}

/**
 * Timbral property kinds.
 */
export type TimbralPropertyKind =
  | 'spectral_shape'       // Overall spectral balance
  | 'brightness_level'     // Brightness value
  | 'warmth_level'         // Warmth value
  | 'saturation_level'     // Saturation amount
  | 'reverb_character'     // Reverb type and amount
  | 'effect_chain'         // Specific effects applied
  | 'instrument_identity'  // Which instrument it sounds like
  | 'texture'              // Textural quality
  | 'attack_character'     // Transient character
  | 'sustain_character';   // Sustain/decay character

/**
 * Forbidden Constraint: Explicitly disallow something.
 */
export interface ForbiddenConstraint extends MusicalConstraintBase {
  readonly category: 'forbidden';

  /** What is forbidden */
  readonly forbiddenAction: ForbiddenActionKind;

  /** Target of the prohibition */
  readonly forbiddenTarget: string;

  /** Why it's forbidden */
  readonly reason: string;
}

/**
 * Kinds of forbidden actions.
 */
export type ForbiddenActionKind =
  | 'modify'         // Don't modify X
  | 'delete'         // Don't delete X
  | 'add'            // Don't add X
  | 'move'           // Don't move X
  | 'change_axis'    // Don't change axis X
  | 'exceed_range'   // Don't exceed range
  | 'clip'           // Don't clip
  | 'overlap';       // Don't overlap


// =============================================================================
// UNION TYPE
// =============================================================================

/**
 * Union of all musical constraint types.
 */
export type MusicalConstraint =
  | PreserveConstraint
  | RangeConstraint
  | RelationConstraint
  | StructuralConstraint
  | IdentityConstraint
  | TemporalConstraint
  | HarmonicConstraint
  | TimbralConstraint
  | ForbiddenConstraint;


// =============================================================================
// DIFF REPRESENTATION — what changed in an edit
// =============================================================================

/**
 * A diff representing what changed in an edit operation.
 */
export interface EditDiff {
  /** Unique diff ID */
  readonly id: string;

  /** Description of the edit */
  readonly description: string;

  /** Individual changes */
  readonly changes: readonly DiffChange[];

  /** Timestamp */
  readonly timestamp: number;
}

/**
 * A single change within a diff.
 */
export interface DiffChange {
  /** What kind of change */
  readonly changeKind: DiffChangeKind;

  /** The entity affected */
  readonly entityRef: string;

  /** The entity type */
  readonly entityType: string;

  /** The property changed (null = the whole entity) */
  readonly property: string | null;

  /** Old value (null for additions) */
  readonly oldValue: DiffValue | null;

  /** New value (null for deletions) */
  readonly newValue: DiffValue | null;
}

/**
 * Kinds of diff changes.
 */
export type DiffChangeKind =
  | 'property_changed'  // A property value changed
  | 'entity_added'      // A new entity was added
  | 'entity_removed'    // An entity was removed
  | 'entity_moved'      // An entity was moved
  | 'entity_duplicated' // An entity was duplicated
  | 'entity_split'      // An entity was split
  | 'entity_merged';    // Entities were merged

/**
 * A value in a diff (before or after).
 */
export type DiffValue =
  | { readonly kind: 'number'; readonly value: number }
  | { readonly kind: 'string'; readonly value: string }
  | { readonly kind: 'boolean'; readonly value: boolean }
  | { readonly kind: 'sequence'; readonly values: readonly number[] }
  | { readonly kind: 'object'; readonly fields: Readonly<Record<string, string | number | boolean>> }
  | { readonly kind: 'null' };


// =============================================================================
// CONSTRAINT CHECKING — verifying constraints against diffs
// =============================================================================

/**
 * Result of checking a constraint against a diff.
 */
export interface ConstraintCheckResult {
  /** The constraint that was checked */
  readonly constraintId: string;

  /** Whether the constraint is satisfied */
  readonly satisfied: boolean;

  /** Violations found (empty if satisfied) */
  readonly violations: readonly ConstraintViolation[];

  /** How well the constraint is satisfied (0 = violated, 1 = perfectly satisfied) */
  readonly satisfactionScore: number;

  /** Details about what was checked */
  readonly details: readonly string[];
}

/**
 * A specific constraint violation.
 */
export interface ConstraintViolation {
  /** Which change caused the violation */
  readonly causingChange: DiffChange;

  /** Description of the violation */
  readonly description: string;

  /** Severity */
  readonly severity: 'error' | 'warning' | 'info';

  /** How far off the constraint was (if measurable) */
  readonly deviation: number | null;

  /** Unit of the deviation */
  readonly deviationUnit: string | null;

  /** Suggested fix */
  readonly suggestedFix: ViolationFix | null;
}

/**
 * Check a preserve constraint against a diff.
 */
export function checkPreserveConstraint(
  constraint: PreserveConstraint,
  diff: EditDiff,
): ConstraintCheckResult {
  const violations: ConstraintViolation[] = [];

  for (const change of diff.changes) {
    // Check if this change affects the preserved entity
    if (!changeAffectsEntity(change, constraint.preserveTarget, constraint.preserveEntityType)) {
      continue;
    }

    // Check preservation mode
    switch (constraint.preserveMode) {
      case 'exact': {
        // Any change to the entity is a violation
        violations.push({
          causingChange: change,
          description: `Exact preservation violated: ${change.changeKind} on "${change.entityRef}"`,
          severity: constraint.strength === 'hard' ? 'error' : 'warning',
          deviation: null,
          deviationUnit: null,
          suggestedFix: {
            strategy: 'revert_property',
            description: 'Revert the changed property to its previous value',
            parameters: { entityRef: change.entityRef },
          },
        });
        break;
      }
      case 'functional': {
        // Only structural changes are violations; property tweaks may be OK
        if (change.changeKind === 'entity_removed' || change.changeKind === 'entity_moved') {
          violations.push({
            causingChange: change,
            description: `Functional preservation violated: ${change.changeKind} on "${change.entityRef}"`,
            severity: constraint.strength === 'hard' ? 'error' : 'warning',
            deviation: null,
            deviationUnit: null,
            suggestedFix: null,
          });
        }
        break;
      }
      case 'recognizable': {
        // Only major structural changes are violations
        if (change.changeKind === 'entity_removed') {
          violations.push({
            causingChange: change,
            description: `Recognizable preservation violated: "${change.entityRef}" was removed`,
            severity: constraint.strength === 'hard' ? 'error' : 'warning',
            deviation: null,
            deviationUnit: null,
            suggestedFix: null,
          });
        }
        break;
      }
      case 'structural': {
        // Only structural additions/deletions are violations
        if (change.changeKind === 'entity_added' || change.changeKind === 'entity_removed') {
          violations.push({
            causingChange: change,
            description: `Structural preservation violated: ${change.changeKind}`,
            severity: constraint.strength === 'hard' ? 'error' : 'warning',
            deviation: null,
            deviationUnit: null,
            suggestedFix: null,
          });
        }
        break;
      }
      case 'proportional': {
        // Property changes that maintain proportions are OK
        if (change.changeKind === 'property_changed' && change.property) {
          // Check if the proportional relationship is maintained
          // (In a real implementation, this would compare ratios)
          // For now, we just note the change
          violations.push({
            causingChange: change,
            description: `Proportional preservation: check that "${change.property}" ratio is maintained`,
            severity: 'info',
            deviation: null,
            deviationUnit: null,
            suggestedFix: null,
          });
        }
        break;
      }
    }
  }

  return {
    constraintId: constraint.id,
    satisfied: violations.filter(v => v.severity === 'error').length === 0,
    violations,
    satisfactionScore: violations.length === 0 ? 1.0 : 1.0 - (violations.length / Math.max(diff.changes.length, 1)),
    details: [`Checked ${diff.changes.length} changes against preserve constraint on "${constraint.preserveTarget}"`],
  };
}

/**
 * Check a range constraint against a diff.
 */
export function checkRangeConstraint(
  constraint: RangeConstraint,
  diff: EditDiff,
): ConstraintCheckResult {
  const violations: ConstraintViolation[] = [];

  for (const change of diff.changes) {
    if (change.property !== constraint.property) continue;
    if (change.newValue === null || change.newValue.kind !== 'number') continue;

    const newVal = change.newValue.value;

    if (constraint.min !== null && (constraint.inclusive ? newVal < constraint.min : newVal <= constraint.min)) {
      violations.push({
        causingChange: change,
        description: `Value ${newVal} is below minimum ${constraint.min}${constraint.unit ? ' ' + constraint.unit : ''}`,
        severity: constraint.strength === 'hard' ? 'error' : 'warning',
        deviation: constraint.min - newVal,
        deviationUnit: constraint.unit,
        suggestedFix: {
          strategy: 'clamp_to_range',
          description: `Clamp value to minimum ${constraint.min}`,
          parameters: { min: constraint.min },
        },
      });
    }

    if (constraint.max !== null && (constraint.inclusive ? newVal > constraint.max : newVal >= constraint.max)) {
      violations.push({
        causingChange: change,
        description: `Value ${newVal} exceeds maximum ${constraint.max}${constraint.unit ? ' ' + constraint.unit : ''}`,
        severity: constraint.strength === 'hard' ? 'error' : 'warning',
        deviation: newVal - constraint.max,
        deviationUnit: constraint.unit,
        suggestedFix: {
          strategy: 'clamp_to_range',
          description: `Clamp value to maximum ${constraint.max}`,
          parameters: { max: constraint.max },
        },
      });
    }
  }

  return {
    constraintId: constraint.id,
    satisfied: violations.filter(v => v.severity === 'error').length === 0,
    violations,
    satisfactionScore: violations.length === 0 ? 1.0 : 0.0,
    details: [`Checked range constraint on "${constraint.property}": [${constraint.min ?? '-∞'}, ${constraint.max ?? '∞'}]`],
  };
}

/**
 * Check a relation constraint against a diff.
 */
export function checkRelationConstraint(
  constraint: RelationConstraint,
  diff: EditDiff,
): ConstraintCheckResult {
  const violations: ConstraintViolation[] = [];

  // Look for changes to either entity
  const leftChanges = diff.changes.filter(c =>
    c.entityRef === constraint.leftEntity &&
    (constraint.comparedProperty === null || c.property === constraint.comparedProperty));
  const rightChanges = diff.changes.filter(c =>
    c.entityRef === constraint.rightEntity &&
    (constraint.comparedProperty === null || c.property === constraint.comparedProperty));

  // If both entities changed, check the relationship is maintained
  if (leftChanges.length > 0 || rightChanges.length > 0) {
    // Extract new values (using the last change for each entity)
    const leftVal = getLatestNumericValue(leftChanges);
    const rightVal = getLatestNumericValue(rightChanges);

    if (leftVal !== null && rightVal !== null) {
      const satisfied = checkRelation(leftVal, rightVal, constraint.relation, constraint.margin);
      if (!satisfied) {
        const causingChange = leftChanges.length > 0
          ? leftChanges[leftChanges.length - 1]
          : rightChanges[rightChanges.length - 1];
        if (causingChange) {
          violations.push({
            causingChange,
            description: `Relation "${constraint.leftEntity} ${constraint.relation} ${constraint.rightEntity}" violated: ${leftVal} vs ${rightVal}`,
            severity: constraint.strength === 'hard' ? 'error' : 'warning',
            deviation: Math.abs(leftVal - rightVal),
            deviationUnit: constraint.marginUnit,
            suggestedFix: null,
          });
        }
      }
    }
  }

  return {
    constraintId: constraint.id,
    satisfied: violations.length === 0,
    violations,
    satisfactionScore: violations.length === 0 ? 1.0 : 0.0,
    details: [`Checked relation: ${constraint.leftEntity} ${constraint.relation} ${constraint.rightEntity}`],
  };
}

/**
 * Check a structural constraint against a diff.
 */
export function checkStructuralConstraint(
  constraint: StructuralConstraint,
  diff: EditDiff,
): ConstraintCheckResult {
  const violations: ConstraintViolation[] = [];

  switch (constraint.structuralProperty) {
    case 'section_count':
    case 'layer_count':
    case 'bar_count': {
      // Count additions and removals of the relevant entity type
      const entityType = constraint.structuralProperty.replace('_count', '');
      let additions = 0;
      let removals = 0;
      for (const change of diff.changes) {
        if (change.entityType === entityType) {
          if (change.changeKind === 'entity_added') additions++;
          if (change.changeKind === 'entity_removed') removals++;
        }
      }
      const netChange = additions - removals;

      if (constraint.operator === 'unchanged' && netChange !== 0) {
        const causingChange = diff.changes.find(c => c.entityType === entityType);
        if (causingChange) {
          violations.push({
            causingChange,
            description: `${constraint.structuralProperty} changed by ${netChange > 0 ? '+' : ''}${netChange}`,
            severity: constraint.strength === 'hard' ? 'error' : 'warning',
            deviation: Math.abs(netChange),
            deviationUnit: entityType + 's',
            suggestedFix: null,
          });
        }
      }
      break;
    }
    case 'section_order':
    case 'song_structure': {
      // Check if any sections were moved
      const moved = diff.changes.filter(
        c => c.entityType === 'section' && c.changeKind === 'entity_moved',
      );
      if (constraint.operator === 'unchanged' && moved.length > 0 && moved[0]) {
        violations.push({
          causingChange: moved[0],
          description: `Section order changed: ${moved.length} section(s) moved`,
          severity: constraint.strength === 'hard' ? 'error' : 'warning',
          deviation: moved.length,
          deviationUnit: 'sections',
          suggestedFix: null,
        });
      }
      break;
    }
    default: {
      // Generic structural check — just note that we can't fully verify
      break;
    }
  }

  return {
    constraintId: constraint.id,
    satisfied: violations.filter(v => v.severity === 'error').length === 0,
    violations,
    satisfactionScore: violations.length === 0 ? 1.0 : 0.0,
    details: [`Checked structural constraint on "${constraint.structuralProperty}"`],
  };
}

/**
 * Check a forbidden constraint against a diff.
 */
export function checkForbiddenConstraint(
  constraint: ForbiddenConstraint,
  diff: EditDiff,
): ConstraintCheckResult {
  const violations: ConstraintViolation[] = [];

  for (const change of diff.changes) {
    if (!changeAffectsEntity(change, constraint.forbiddenTarget, null)) continue;

    const actionMatch = matchesForbiddenAction(change, constraint.forbiddenAction);
    if (actionMatch) {
      violations.push({
        causingChange: change,
        description: `Forbidden action: ${constraint.forbiddenAction} on "${constraint.forbiddenTarget}" — ${constraint.reason}`,
        severity: 'error',
        deviation: null,
        deviationUnit: null,
        suggestedFix: {
          strategy: 'undo_last_step',
          description: 'Undo the forbidden action',
          parameters: {},
        },
      });
    }
  }

  return {
    constraintId: constraint.id,
    satisfied: violations.length === 0,
    violations,
    satisfactionScore: violations.length === 0 ? 1.0 : 0.0,
    details: [`Checked forbidden constraint: ${constraint.forbiddenAction} on "${constraint.forbiddenTarget}"`],
  };
}


// =============================================================================
// BATCH CONSTRAINT CHECKING
// =============================================================================

/**
 * Check all constraints against a diff.
 */
export function checkAllConstraints(
  constraints: readonly MusicalConstraint[],
  diff: EditDiff,
): ConstraintCheckReport {
  const results: ConstraintCheckResult[] = [];

  for (const constraint of constraints) {
    const result = checkSingleConstraint(constraint, diff);
    results.push(result);
  }

  const allViolations = results.flatMap(r => r.violations);
  const hardViolations = allViolations.filter(v => v.severity === 'error');
  const softViolations = allViolations.filter(v => v.severity === 'warning');

  return {
    results,
    totalConstraints: constraints.length,
    satisfiedCount: results.filter(r => r.satisfied).length,
    violatedCount: results.filter(r => !r.satisfied).length,
    hardViolationCount: hardViolations.length,
    softViolationCount: softViolations.length,
    overallSatisfied: hardViolations.length === 0,
    overallScore: results.length > 0
      ? results.reduce((sum, r) => sum + r.satisfactionScore, 0) / results.length
      : 1.0,
  };
}

/**
 * Check a single constraint against a diff (dispatch by category).
 */
function checkSingleConstraint(
  constraint: MusicalConstraint,
  diff: EditDiff,
): ConstraintCheckResult {
  switch (constraint.category) {
    case 'preserve': return checkPreserveConstraint(constraint, diff);
    case 'range': return checkRangeConstraint(constraint, diff);
    case 'relation': return checkRelationConstraint(constraint, diff);
    case 'structural': return checkStructuralConstraint(constraint, diff);
    case 'forbidden': return checkForbiddenConstraint(constraint, diff);
    // For types that don't have specific checkers yet, return a placeholder
    case 'identity':
    case 'temporal':
    case 'harmonic':
    case 'timbral':
      return {
        constraintId: constraint.id,
        satisfied: true,
        violations: [],
        satisfactionScore: 1.0,
        details: [`Constraint "${constraint.category}" checked (simplified — full verification not yet implemented)`],
      };
  }
}

/**
 * Report from checking all constraints against a diff.
 */
export interface ConstraintCheckReport {
  /** Individual check results */
  readonly results: readonly ConstraintCheckResult[];

  /** Total number of constraints checked */
  readonly totalConstraints: number;

  /** Number of satisfied constraints */
  readonly satisfiedCount: number;

  /** Number of violated constraints */
  readonly violatedCount: number;

  /** Number of hard violations */
  readonly hardViolationCount: number;

  /** Number of soft violations */
  readonly softViolationCount: number;

  /** Whether all hard constraints are satisfied */
  readonly overallSatisfied: boolean;

  /** Average satisfaction score (0–1) */
  readonly overallScore: number;
}


// =============================================================================
// CONSTRAINT-TO-CPL BRIDGE
// =============================================================================

/**
 * Convert a musical constraint to a CPLConstraint.
 */
export function musicalConstraintToCPL(constraint: MusicalConstraint): CPLConstraint {
  switch (constraint.category) {
    case 'preserve':
      return {
        type: 'constraint',
        id: constraint.id,
        variant: 'preserve',
        strength: constraint.strength === 'advisory' ? 'soft' : constraint.strength,
        description: constraint.description,
      };
    case 'range':
      return {
        type: 'constraint',
        id: constraint.id,
        variant: 'range',
        strength: constraint.strength === 'advisory' ? 'soft' : constraint.strength,
        description: constraint.description,
      };
    case 'relation':
      return {
        type: 'constraint',
        id: constraint.id,
        variant: 'relation',
        strength: constraint.strength === 'advisory' ? 'soft' : constraint.strength,
        description: constraint.description,
      };
    case 'structural':
    case 'temporal':
    case 'harmonic':
    case 'timbral':
      return {
        type: 'constraint',
        id: constraint.id,
        variant: 'structural',
        strength: constraint.strength === 'advisory' ? 'soft' : constraint.strength,
        description: constraint.description,
      };
    case 'identity':
      return {
        type: 'constraint',
        id: constraint.id,
        variant: 'preserve',
        strength: constraint.strength === 'advisory' ? 'soft' : constraint.strength,
        description: constraint.description,
      };
    case 'forbidden':
      return {
        type: 'constraint',
        id: constraint.id,
        variant: 'only-change',
        strength: 'hard',
        description: constraint.description,
      };
  }
}


// =============================================================================
// CONSTRAINT CONSTRUCTORS
// =============================================================================

let _constraintIdCounter = 0;
function nextConstraintId(): string {
  return `cstr_${++_constraintIdCounter}`;
}

/**
 * Create a preserve constraint.
 */
export function createPreserveConstraint(
  target: string,
  mode: PreserveMode,
  opts: {
    entityType?: string | null;
    strength?: ConstraintStrength;
    aspects?: readonly PreserveAspect[];
    sourceText?: string | null;
  } = {},
): PreserveConstraint {
  return {
    id: nextConstraintId(),
    category: 'preserve',
    description: `Preserve "${target}" (${mode})`,
    strength: opts.strength ?? 'hard',
    checkability: mode === 'exact' ? 'fully_checkable' : 'partially_checkable',
    scope: {
      scopeType: 'entity',
      reference: target,
      entityType: opts.entityType ?? null,
      property: null,
      global: false,
    },
    explicit: true,
    confidence: 0.9,
    sourceText: opts.sourceText ?? null,
    sourceSpan: null,
    verification: {
      method: mode === 'exact' ? 'equality' : 'approximate_equality',
      comparisonTarget: {
        target,
        extractor: { kind: 'raw_value', path: target },
        reference: { kind: 'before_state' },
      },
      tolerance: mode !== 'exact' ? {
        metric: 'correlation',
        value: mode === 'functional' ? 0.8 : 0.6,
        unit: null,
        description: `${mode} preservation threshold`,
      } : null,
      parameters: {},
    },
    violationPolicy: {
      action: opts.strength === 'hard' ? 'reject' : 'warn',
      priority: opts.strength === 'hard' ? 10 : 5,
      notify: true,
      violationMessage: null,
      suggestedFix: {
        strategy: 'revert_property',
        description: 'Revert changes to preserved entity',
        parameters: { target },
      },
    },
    relatedConstraints: [],
    preserveMode: mode,
    preserveTarget: target,
    preserveEntityType: opts.entityType ?? null,
    preserveAspects: opts.aspects ?? [],
  };
}

/**
 * Create a range constraint.
 */
export function createRangeConstraint(
  property: string,
  opts: {
    min?: number | null;
    max?: number | null;
    unit?: string | null;
    inclusive?: boolean;
    strength?: ConstraintStrength;
    sourceText?: string | null;
  } = {},
): RangeConstraint {
  return {
    id: nextConstraintId(),
    category: 'range',
    description: `Keep "${property}" in range [${opts.min ?? '-∞'}, ${opts.max ?? '∞'}]`,
    strength: opts.strength ?? 'hard',
    checkability: 'fully_checkable',
    scope: {
      scopeType: 'property',
      reference: property,
      entityType: null,
      property,
      global: false,
    },
    explicit: true,
    confidence: 0.95,
    sourceText: opts.sourceText ?? null,
    sourceSpan: null,
    verification: {
      method: 'range_check',
      comparisonTarget: {
        target: property,
        extractor: { kind: 'property_value', entityRef: '', property },
        reference: { kind: 'range', min: opts.min ?? -Infinity, max: opts.max ?? Infinity },
      },
      tolerance: null,
      parameters: {},
    },
    violationPolicy: {
      action: (opts.strength ?? 'hard') === 'hard' ? 'auto_fix' : 'warn',
      priority: 8,
      notify: true,
      violationMessage: null,
      suggestedFix: {
        strategy: 'clamp_to_range',
        description: `Clamp to [${opts.min ?? '-∞'}, ${opts.max ?? '∞'}]`,
        parameters: {},
      },
    },
    relatedConstraints: [],
    property,
    min: opts.min ?? null,
    max: opts.max ?? null,
    unit: opts.unit ?? null,
    inclusive: opts.inclusive ?? true,
  };
}

/**
 * Create a forbidden constraint.
 */
export function createForbiddenConstraint(
  action: ForbiddenActionKind,
  target: string,
  reason: string,
  opts: {
    sourceText?: string | null;
  } = {},
): ForbiddenConstraint {
  return {
    id: nextConstraintId(),
    category: 'forbidden',
    description: `Don't ${action} "${target}": ${reason}`,
    strength: 'hard',
    checkability: 'fully_checkable',
    scope: {
      scopeType: 'entity',
      reference: target,
      entityType: null,
      property: null,
      global: false,
    },
    explicit: true,
    confidence: 0.95,
    sourceText: opts.sourceText ?? null,
    sourceSpan: null,
    verification: {
      method: 'set_exclusion',
      comparisonTarget: {
        target,
        extractor: { kind: 'raw_value', path: target },
        reference: { kind: 'before_state' },
      },
      tolerance: null,
      parameters: { forbiddenAction: action },
    },
    violationPolicy: {
      action: 'reject',
      priority: 10,
      notify: true,
      violationMessage: `Cannot ${action} "${target}": ${reason}`,
      suggestedFix: {
        strategy: 'undo_last_step',
        description: 'Undo the forbidden action',
        parameters: {},
      },
    },
    relatedConstraints: [],
    forbiddenAction: action,
    forbiddenTarget: target,
    reason,
  };
}


// =============================================================================
// FORMATTING AND REPORTING
// =============================================================================

/**
 * Format a constraint check report as a human-readable string.
 */
export function formatConstraintCheckReport(report: ConstraintCheckReport): string {
  const lines: string[] = [
    '=== Constraint Check Report ===',
    `Total constraints: ${report.totalConstraints}`,
    `Satisfied: ${report.satisfiedCount}`,
    `Violated: ${report.violatedCount}`,
    `Hard violations: ${report.hardViolationCount}`,
    `Soft violations: ${report.softViolationCount}`,
    `Overall satisfied: ${report.overallSatisfied ? 'YES' : 'NO'}`,
    `Overall score: ${(report.overallScore * 100).toFixed(1)}%`,
    '',
  ];

  for (const result of report.results) {
    const status = result.satisfied ? '✓' : '✗';
    lines.push(`  ${status} [${result.constraintId}] — score: ${(result.satisfactionScore * 100).toFixed(0)}%`);
    for (const violation of result.violations) {
      lines.push(`      ${violation.severity.toUpperCase()}: ${violation.description}`);
      if (violation.deviation !== null) {
        lines.push(`        Deviation: ${violation.deviation}${violation.deviationUnit ? ' ' + violation.deviationUnit : ''}`);
      }
    }
  }

  return lines.join('\n');
}


// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a diff change affects a particular entity.
 */
function changeAffectsEntity(
  change: DiffChange,
  entityRef: string,
  entityType: string | null,
): boolean {
  if (change.entityRef === entityRef) return true;
  if (entityType && change.entityType === entityType) return true;
  // Also match if the entity ref is a prefix (e.g., "vocals" matches "vocals.pitch")
  if (change.entityRef.startsWith(entityRef + '.')) return true;
  return false;
}

/**
 * Get the latest numeric value from a list of changes.
 */
function getLatestNumericValue(changes: readonly DiffChange[]): number | null {
  for (let i = changes.length - 1; i >= 0; i--) {
    const change = changes[i];
    if (change && change.newValue && change.newValue.kind === 'number') {
      return change.newValue.value;
    }
  }
  return null;
}

/**
 * Check whether a relation holds between two values.
 */
function checkRelation(
  left: number,
  right: number,
  relation: ConstraintRelationKind,
  margin: number | null,
): boolean {
  const m = margin ?? 0;
  switch (relation) {
    case 'less_than': return left < right - m;
    case 'greater_than': return left > right + m;
    case 'less_or_equal': return left <= right - m;
    case 'greater_or_equal': return left >= right + m;
    case 'equal': return Math.abs(left - right) <= m;
    case 'not_equal': return Math.abs(left - right) > m;
    default: return true; // Non-numeric relations can't be checked here
  }
}

/**
 * Check whether a diff change matches a forbidden action.
 */
function matchesForbiddenAction(change: DiffChange, action: ForbiddenActionKind): boolean {
  switch (action) {
    case 'modify': return change.changeKind === 'property_changed';
    case 'delete': return change.changeKind === 'entity_removed';
    case 'add': return change.changeKind === 'entity_added';
    case 'move': return change.changeKind === 'entity_moved';
    case 'change_axis': return change.changeKind === 'property_changed' && change.property !== null;
    case 'exceed_range': return false; // Checked by range constraints
    case 'clip': return false; // Would need signal analysis
    case 'overlap': return false; // Would need temporal analysis
  }
}
