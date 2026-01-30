/**
 * GOFAI NL Semantics — FrameNet / Frame Semantics Integration
 *
 * Maps verb frames to axis/levers and selectional restrictions.
 * Inspired by FrameNet but adapted for the music-editing domain.
 *
 * ## Overview
 *
 * Frame semantics (Fillmore 1982) models meaning as "frames"—
 * structured representations of situations. Each frame has:
 *
 * 1. **Frame elements** (FEs): participants, props, settings
 * 2. **Lexical units** (LUs): words that evoke the frame
 * 3. **Relations**: inheritance, perspective, causative, etc.
 *
 * In our domain, frames map to CPL structures:
 *
 * - **Axis change frames** → `CPLGoal` with axis + direction
 * - **Structural edit frames** → `CPLGoal` with structural-goal variant
 * - **Navigation frames** → scope resolution / selection
 * - **Evaluation frames** → constraints and preferences
 *
 * ## Frame Hierarchy
 *
 * ```
 * Edit_Action (root)
 *   ├── Axis_Change
 *   │   ├── Scalar_Increase
 *   │   ├── Scalar_Decrease
 *   │   ├── Scalar_Set
 *   │   └── Bidirectional_Adjust
 *   ├── Structural_Edit
 *   │   ├── Creation
 *   │   ├── Destruction
 *   │   ├── Movement
 *   │   ├── Duplication
 *   │   └── Separation
 *   ├── Preservation
 *   │   ├── Exact_Preserve
 *   │   ├── Functional_Preserve
 *   │   └── Recognizable_Preserve
 *   ├── Combination
 *   │   ├── Merge
 *   │   └── Blend
 *   ├── Inspection
 *   │   ├── Playback
 *   │   └── Display
 *   └── Reversal
 *       ├── Undo
 *       └── Redo
 * ```
 *
 * @module gofai/nl/semantics/frame-semantics
 * @see gofai_goalA.md Step 157
 */

import type {
  SelectionalFeature,
  SelectionalRequirement,
  RestrictionEntityType,
} from './selectional-restrictions';

import { createRequirement } from './selectional-restrictions';

import type { EditEventCategory, ThematicRoleKind } from './event-semantics';


// =============================================================================
// FRAME IDENTIFIERS — unique IDs for each frame in the hierarchy
// =============================================================================

/**
 * Top-level frame families.
 */
export type FrameFamily =
  | 'axis_change'
  | 'structural_edit'
  | 'preservation'
  | 'combination'
  | 'inspection'
  | 'reversal'
  | 'evaluation'
  | 'navigation';

/**
 * Specific frame identifiers.
 */
export type FrameId =
  // Axis change
  | 'scalar_increase'
  | 'scalar_decrease'
  | 'scalar_set'
  | 'bidirectional_adjust'
  | 'axis_reset'
  // Structural edit
  | 'creation'
  | 'destruction'
  | 'movement'
  | 'duplication'
  | 'separation'
  | 'insertion'
  | 'replacement'
  // Preservation
  | 'exact_preserve'
  | 'functional_preserve'
  | 'recognizable_preserve'
  | 'generic_preserve'
  // Combination
  | 'merge'
  | 'blend'
  | 'layer_combine'
  // Inspection
  | 'playback'
  | 'display'
  | 'compare'
  // Reversal
  | 'undo'
  | 'redo'
  | 'restore'
  // Evaluation
  | 'evaluate_quality'
  | 'evaluate_similarity'
  | 'evaluate_conformance'
  // Navigation
  | 'scope_navigate'
  | 'selection_narrow'
  | 'selection_expand';


// =============================================================================
// FRAME ELEMENTS — the typed participants in a frame
// =============================================================================

/**
 * The coreness of a frame element: how essential it is to the frame.
 * Follows FrameNet convention: Core > Peripheral > Extra-thematic.
 */
export type FrameElementCoreness = 'core' | 'peripheral' | 'extra-thematic';

/**
 * A frame element (FE) definition.
 */
export interface FrameElementDef {
  /** Unique name within the frame */
  readonly name: string;

  /** Human-readable description */
  readonly description: string;

  /** How essential this FE is to the frame */
  readonly coreness: FrameElementCoreness;

  /** The thematic role this FE maps to */
  readonly thematicRole: ThematicRoleKind;

  /** Selectional restrictions on this FE's filler */
  readonly selectionalRestriction: SelectionalRequirement;

  /** Whether this FE is typically expressed or null-instantiated */
  readonly typicallyExpressed: boolean;

  /** Default entity type when the filler is ambiguous */
  readonly defaultEntityType: RestrictionEntityType | null;

  /** Related FEs that are mutually exclusive with this one */
  readonly excludes: readonly string[];

  /** Related FEs that this one requires */
  readonly requires: readonly string[];
}


// =============================================================================
// FRAME DEFINITION — the complete frame structure
// =============================================================================

/**
 * A frame definition: a complete structured representation of a situation type.
 */
export interface FrameDef {
  /** Unique frame identifier */
  readonly id: FrameId;

  /** Human-readable name */
  readonly name: string;

  /** Human-readable description */
  readonly description: string;

  /** Parent frame family */
  readonly family: FrameFamily;

  /** Parent frame (for inheritance) */
  readonly inheritsFrom: FrameId | null;

  /** Frame elements */
  readonly elements: ReadonlyMap<string, FrameElementDef>;

  /** Lexical units that evoke this frame */
  readonly lexicalUnits: readonly LexicalUnit[];

  /** Axis mapping: which axes this frame operates on */
  readonly axisMapping: FrameAxisMapping | null;

  /** CPL mapping: how this frame maps to CPL structures */
  readonly cplMapping: FrameCPLMapping;

  /** Event category produced by this frame */
  readonly eventCategory: EditEventCategory;

  /** Frame relations to other frames */
  readonly relations: readonly FrameRelation[];

  /** Semantic constraints on the frame as a whole */
  readonly constraints: readonly FrameConstraint[];
}


// =============================================================================
// LEXICAL UNITS — words that evoke a frame
// =============================================================================

/**
 * A lexical unit (LU): a pairing of a lemma and a frame.
 * This is the entry point into frame semantics from the parser.
 */
export interface LexicalUnit {
  /** The lemma form of the word */
  readonly lemma: string;

  /** Part of speech */
  readonly pos: LexicalUnitPOS;

  /** The frame this LU evokes */
  readonly frameId: FrameId;

  /** How strongly this LU evokes its frame (0–1) */
  readonly evocationStrength: number;

  /** Whether this is a "primary" or "secondary" sense */
  readonly senseRank: number;

  /** Axis implied by this LU (if any) */
  readonly impliedAxis: string | null;

  /** Direction implied by this LU (if any) */
  readonly impliedDirection: 'increase' | 'decrease' | 'set' | null;

  /** Levers implied by this LU (if any) */
  readonly impliedLevers: readonly string[];

  /** Example usage */
  readonly example: string;
}

/**
 * Parts of speech for lexical units.
 */
export type LexicalUnitPOS =
  | 'verb'
  | 'adjective'
  | 'noun'
  | 'adverb'
  | 'preposition'
  | 'particle';


// =============================================================================
// AXIS MAPPING — how a frame relates to perceptual axes
// =============================================================================

/**
 * How a frame maps to perceptual axis operations.
 */
export interface FrameAxisMapping {
  /** Primary axis (if the frame implies one) */
  readonly primaryAxis: string | null;

  /** Axis determined by the result FE (e.g., "make it brighter" → brightness) */
  readonly axisDeterminedBy: 'result' | 'patient' | 'theme' | 'explicit' | null;

  /** Default direction (if the frame implies one) */
  readonly defaultDirection: 'increase' | 'decrease' | 'set' | null;

  /** Levers that the frame typically controls */
  readonly typicalLevers: readonly FrameLeverBinding[];

  /** Whether this frame implies a relative or absolute change */
  readonly changeMode: 'relative' | 'absolute' | 'either';

  /** Selectional features required on the axis target */
  readonly targetFeatures: readonly SelectionalFeature[];
}

/**
 * A binding between a frame and a lever (card parameter).
 */
export interface FrameLeverBinding {
  /** Lever name (e.g., "eq_high_gain", "compressor_ratio") */
  readonly leverName: string;

  /** How strongly this lever is associated with the frame (0–1) */
  readonly relevance: number;

  /** The axis this lever belongs to */
  readonly axis: string;

  /** Expected direction of change for this lever */
  readonly direction: 'increase' | 'decrease' | 'set' | 'context-dependent';

  /** Description of why this lever is relevant */
  readonly rationale: string;
}


// =============================================================================
// CPL MAPPING — how a frame maps to CPL structures
// =============================================================================

/**
 * How a frame maps to CPL-Intent structures.
 */
export interface FrameCPLMapping {
  /** Primary CPL node type produced */
  readonly primaryNodeType: 'goal' | 'constraint' | 'preference' | 'scope' | 'selector';

  /** Goal variant (if producing a goal) */
  readonly goalVariant: 'axis-goal' | 'structural-goal' | 'production-goal' | null;

  /** How frame elements map to CPL fields */
  readonly elementMappings: readonly FrameElementCPLMapping[];

  /** Template for the CPL node (fields to set from frame element values) */
  readonly templateFields: Readonly<Record<string, string>>;

  /** Whether this frame produces multiple CPL nodes */
  readonly multiNode: boolean;
}

/**
 * How a single frame element maps to a CPL field.
 */
export interface FrameElementCPLMapping {
  /** Frame element name */
  readonly elementName: string;

  /** CPL field to populate */
  readonly cplField: string;

  /** CPL node type (when multi-node) */
  readonly cplNodeType: 'goal' | 'constraint' | 'preference' | 'scope' | 'hole';

  /** Transformation to apply */
  readonly transform: FrameElementTransform;
}

/**
 * Transformations applied when mapping FE values to CPL fields.
 */
export type FrameElementTransform =
  | { readonly kind: 'identity' }
  | { readonly kind: 'to_axis'; readonly axisName: string }
  | { readonly kind: 'to_direction'; readonly direction: 'increase' | 'decrease' | 'set' }
  | { readonly kind: 'to_scope_ref' }
  | { readonly kind: 'to_amount' }
  | { readonly kind: 'to_constraint'; readonly constraintVariant: string }
  | { readonly kind: 'to_preference'; readonly preferenceCategory: string }
  | { readonly kind: 'custom'; readonly functionId: string };


// =============================================================================
// FRAME RELATIONS — how frames relate to each other
// =============================================================================

/**
 * A relation between two frames.
 */
export interface FrameRelation {
  /** The type of relation */
  readonly relationType: FrameRelationType;

  /** The target frame */
  readonly targetFrameId: FrameId;

  /** Description */
  readonly description: string;
}

/**
 * Types of frame-frame relations.
 * Adapted from FrameNet's relation system.
 */
export type FrameRelationType =
  | 'inherits'        // This frame is-a target frame
  | 'perspective_on'  // This frame provides a perspective on the target
  | 'causative_of'    // This frame is the causative of target (increase causes brightened)
  | 'inchoative_of'   // This frame is the inchoative of target (brightened from increase)
  | 'precedes'        // This frame temporally precedes target
  | 'subframe'        // This frame is a subframe of target
  | 'uses'            // This frame uses (refers to) the target
  | 'see_also'        // Related frame for cross-reference
  | 'antonym_of';     // This frame is the opposite of target


// =============================================================================
// FRAME CONSTRAINTS — semantic constraints on frame instantiation
// =============================================================================

/**
 * A constraint on valid frame instantiations.
 */
export interface FrameConstraint {
  /** Constraint identifier */
  readonly id: string;

  /** Human-readable description */
  readonly description: string;

  /** The kind of constraint */
  readonly kind: FrameConstraintKind;

  /** Frame elements involved */
  readonly elements: readonly string[];

  /** Severity: warning or error */
  readonly severity: 'error' | 'warning';
}

/**
 * Kinds of frame constraints.
 */
export type FrameConstraintKind =
  | 'mutual_exclusion'         // Two FEs can't both be filled
  | 'co_occurrence'            // Two FEs must both be filled or both empty
  | 'conditional_requirement'  // If FE_A is filled, FE_B must be too
  | 'type_agreement'           // Two FEs must have compatible types
  | 'axis_agreement'           // FE values must agree on which axis they reference
  | 'direction_consistency'    // Direction can't contradict verb sense
  | 'scope_containment'        // Scope FE must contain patient FE
  | 'amount_boundedness';      // Amount must be within valid range


// =============================================================================
// FRAME DATABASE — the core registry of all domain frames
// =============================================================================

/**
 * Create a standard frame element definition.
 */
function fe(
  name: string,
  description: string,
  coreness: FrameElementCoreness,
  thematicRole: ThematicRoleKind,
  restriction: SelectionalRequirement,
  opts: {
    typicallyExpressed?: boolean;
    defaultEntityType?: RestrictionEntityType | null;
    excludes?: readonly string[];
    requires?: readonly string[];
  } = {},
): [string, FrameElementDef] {
  return [name, {
    name,
    description,
    coreness,
    thematicRole,
    selectionalRestriction: restriction,
    typicallyExpressed: opts.typicallyExpressed ?? true,
    defaultEntityType: opts.defaultEntityType ?? null,
    excludes: opts.excludes ?? [],
    requires: opts.requires ?? [],
  }];
}

/**
 * Create a lexical unit entry.
 */
function lu(
  lemma: string,
  pos: LexicalUnitPOS,
  frameId: FrameId,
  opts: {
    evocationStrength?: number;
    senseRank?: number;
    impliedAxis?: string | null;
    impliedDirection?: 'increase' | 'decrease' | 'set' | null;
    impliedLevers?: readonly string[];
    example?: string;
  } = {},
): LexicalUnit {
  return {
    lemma,
    pos,
    frameId,
    evocationStrength: opts.evocationStrength ?? 0.9,
    senseRank: opts.senseRank ?? 1,
    impliedAxis: opts.impliedAxis ?? null,
    impliedDirection: opts.impliedDirection ?? null,
    impliedLevers: opts.impliedLevers ?? [],
    example: opts.example ?? `${lemma} the sound`,
  };
}


// =============================================================================
// AXIS CHANGE FRAMES
// =============================================================================

/**
 * Scalar Increase frame: making something "more" along an axis.
 * LUs: brighten, widen, warm, boost, raise, increase, amplify, enhance, intensify
 */
export const SCALAR_INCREASE_FRAME: FrameDef = {
  id: 'scalar_increase',
  name: 'Scalar_Increase',
  description: 'Increasing a value along a perceptual axis',
  family: 'axis_change',
  inheritsFrom: null,
  eventCategory: 'transformation',
  elements: new Map([
    fe('Entity', 'The entity being modified', 'core', 'patient',
      createRequirement(['editable'], [], [], 'Target of increase must be editable')),
    fe('Axis', 'The perceptual axis being changed', 'core', 'result',
      createRequirement(['scalar'], [], [], 'Axis must be scalar'),
      { typicallyExpressed: false }),
    fe('Amount', 'How much to increase', 'peripheral', 'degree',
      createRequirement(['scalar'], [], [], 'Amount must be scalar'),
      { typicallyExpressed: false }),
    fe('Scope', 'Where the change applies', 'peripheral', 'location',
      createRequirement(['structural'], [], ['sectional'], 'Scope is structural'),
      { typicallyExpressed: false }),
    fe('Manner', 'How the change is performed', 'extra-thematic', 'manner',
      createRequirement([], [], [], 'Manner has no type restrictions'),
      { typicallyExpressed: false }),
    fe('Purpose', 'Why the change is made', 'extra-thematic', 'purpose',
      createRequirement([], [], [], 'Purpose has no type restrictions'),
      { typicallyExpressed: false }),
  ]),
  lexicalUnits: [
    lu('brighten', 'verb', 'scalar_increase', {
      impliedAxis: 'brightness', impliedDirection: 'increase',
      impliedLevers: ['eq_high_gain', 'eq_high_freq', 'exciter_amount'],
      example: 'Brighten the vocals',
    }),
    lu('warm', 'verb', 'scalar_increase', {
      impliedAxis: 'warmth', impliedDirection: 'increase',
      impliedLevers: ['eq_low_mid_gain', 'saturation_amount', 'tube_drive'],
      example: 'Warm up the piano',
    }),
    lu('widen', 'verb', 'scalar_increase', {
      impliedAxis: 'width', impliedDirection: 'increase',
      impliedLevers: ['stereo_width', 'mid_side_ratio', 'haas_delay'],
      example: 'Widen the stereo image',
    }),
    lu('boost', 'verb', 'scalar_increase', {
      impliedAxis: null, impliedDirection: 'increase',
      example: 'Boost the high end',
    }),
    lu('raise', 'verb', 'scalar_increase', {
      impliedAxis: null, impliedDirection: 'increase',
      example: 'Raise the volume',
    }),
    lu('increase', 'verb', 'scalar_increase', {
      impliedAxis: null, impliedDirection: 'increase',
      example: 'Increase the reverb amount',
    }),
    lu('amplify', 'verb', 'scalar_increase', {
      impliedAxis: 'loudness', impliedDirection: 'increase',
      impliedLevers: ['gain', 'output_volume'],
      example: 'Amplify the signal',
    }),
    lu('enhance', 'verb', 'scalar_increase', {
      impliedAxis: null, impliedDirection: 'increase',
      example: 'Enhance the low end',
    }),
    lu('intensify', 'verb', 'scalar_increase', {
      impliedAxis: 'energy', impliedDirection: 'increase',
      example: 'Intensify the chorus',
    }),
    lu('thicken', 'verb', 'scalar_increase', {
      impliedAxis: 'density', impliedDirection: 'increase',
      impliedLevers: ['unison_voices', 'chorus_amount', 'layer_count'],
      example: 'Thicken the pads',
    }),
    lu('deepen', 'verb', 'scalar_increase', {
      impliedAxis: 'depth', impliedDirection: 'increase',
      impliedLevers: ['reverb_amount', 'reverb_decay', 'delay_feedback'],
      example: 'Deepen the spatial feel',
    }),
    lu('sharpen', 'verb', 'scalar_increase', {
      impliedAxis: 'clarity', impliedDirection: 'increase',
      impliedLevers: ['eq_presence', 'transient_attack'],
      example: 'Sharpen the snare attack',
    }),
    lu('energize', 'verb', 'scalar_increase', {
      impliedAxis: 'energy', impliedDirection: 'increase',
      impliedLevers: ['compressor_ratio', 'exciter_amount', 'saturation_amount'],
      example: 'Energize the breakdown',
    }),
    lu('tighten', 'verb', 'scalar_increase', {
      impliedAxis: 'groove_tightness', impliedDirection: 'increase',
      impliedLevers: ['quantize_strength', 'gate_threshold', 'compressor_attack'],
      example: 'Tighten the drums',
    }),
    lu('punch', 'verb', 'scalar_increase', {
      impliedAxis: 'punch', impliedDirection: 'increase', senseRank: 2,
      impliedLevers: ['compressor_attack', 'transient_attack', 'gate_threshold'],
      example: 'Punch up the kick',
    }),
    lu('fatten', 'verb', 'scalar_increase', {
      impliedAxis: 'warmth', impliedDirection: 'increase',
      impliedLevers: ['saturation_amount', 'eq_low_gain', 'harmonic_exciter'],
      example: 'Fatten the bass',
    }),
    lu('saturate', 'verb', 'scalar_increase', {
      impliedAxis: 'saturation', impliedDirection: 'increase',
      impliedLevers: ['saturation_amount', 'drive', 'tube_saturation'],
      example: 'Saturate the drums slightly',
    }),
    lu('lift', 'verb', 'scalar_increase', {
      impliedAxis: 'lift', impliedDirection: 'increase',
      impliedLevers: ['eq_high_gain', 'reverb_pre_delay', 'compressor_release'],
      example: 'Lift the chorus section',
    }),
    lu('open', 'verb', 'scalar_increase', {
      impliedAxis: 'brightness', impliedDirection: 'increase', senseRank: 2,
      impliedLevers: ['filter_cutoff', 'eq_high_gain'],
      example: 'Open up the filter',
    }),
    lu('sweeten', 'verb', 'scalar_increase', {
      impliedAxis: 'warmth', impliedDirection: 'increase',
      impliedLevers: ['eq_high_mid_gain', 'exciter_amount', 'chorus_amount'],
      example: 'Sweeten the vocal tone',
    }),
  ],
  axisMapping: {
    primaryAxis: null,
    axisDeterminedBy: 'result',
    defaultDirection: 'increase',
    typicalLevers: [],
    changeMode: 'relative',
    targetFeatures: ['audible'],
  },
  cplMapping: {
    primaryNodeType: 'goal',
    goalVariant: 'axis-goal',
    elementMappings: [
      { elementName: 'Entity', cplField: 'scope', cplNodeType: 'scope', transform: { kind: 'to_scope_ref' } },
      { elementName: 'Axis', cplField: 'axis', cplNodeType: 'goal', transform: { kind: 'identity' } },
      { elementName: 'Amount', cplField: 'targetValue', cplNodeType: 'goal', transform: { kind: 'to_amount' } },
      { elementName: 'Scope', cplField: 'scope', cplNodeType: 'scope', transform: { kind: 'to_scope_ref' } },
    ],
    templateFields: { direction: 'increase' },
    multiNode: false,
  },
  relations: [
    { relationType: 'antonym_of', targetFrameId: 'scalar_decrease', description: 'Increase is the opposite of decrease' },
    { relationType: 'causative_of', targetFrameId: 'scalar_set', description: 'Increase can converge to a set value' },
  ],
  constraints: [
    {
      id: 'axis_agreement',
      description: 'Entity must support the axis being changed',
      kind: 'axis_agreement',
      elements: ['Entity', 'Axis'],
      severity: 'error',
    },
    {
      id: 'amount_bounded',
      description: 'Amount must be within axis range',
      kind: 'amount_boundedness',
      elements: ['Amount'],
      severity: 'warning',
    },
  ],
};

/**
 * Scalar Decrease frame: making something "less" along an axis.
 * LUs: darken, narrow, cool, cut, lower, decrease, reduce, soften, dampen
 */
export const SCALAR_DECREASE_FRAME: FrameDef = {
  id: 'scalar_decrease',
  name: 'Scalar_Decrease',
  description: 'Decreasing a value along a perceptual axis',
  family: 'axis_change',
  inheritsFrom: null,
  eventCategory: 'transformation',
  elements: new Map([
    fe('Entity', 'The entity being modified', 'core', 'patient',
      createRequirement(['editable'], [], [], 'Target of decrease must be editable')),
    fe('Axis', 'The perceptual axis being changed', 'core', 'result',
      createRequirement(['scalar'], [], [], 'Axis must be scalar'),
      { typicallyExpressed: false }),
    fe('Amount', 'How much to decrease', 'peripheral', 'degree',
      createRequirement(['scalar'], [], [], 'Amount must be scalar'),
      { typicallyExpressed: false }),
    fe('Scope', 'Where the change applies', 'peripheral', 'location',
      createRequirement(['structural'], [], ['sectional'], 'Scope is structural'),
      { typicallyExpressed: false }),
    fe('Manner', 'How the change is performed', 'extra-thematic', 'manner',
      createRequirement([], [], [], 'Manner has no type restrictions'),
      { typicallyExpressed: false }),
  ]),
  lexicalUnits: [
    lu('darken', 'verb', 'scalar_decrease', {
      impliedAxis: 'brightness', impliedDirection: 'decrease',
      impliedLevers: ['eq_high_gain', 'filter_cutoff'],
      example: 'Darken the synth pad',
    }),
    lu('narrow', 'verb', 'scalar_decrease', {
      impliedAxis: 'width', impliedDirection: 'decrease',
      impliedLevers: ['stereo_width', 'mid_side_ratio'],
      example: 'Narrow the stereo field',
    }),
    lu('cool', 'verb', 'scalar_decrease', {
      impliedAxis: 'warmth', impliedDirection: 'decrease',
      impliedLevers: ['saturation_amount', 'eq_low_mid_gain'],
      example: 'Cool down the overdriven guitar',
    }),
    lu('cut', 'verb', 'scalar_decrease', {
      impliedAxis: null, impliedDirection: 'decrease',
      example: 'Cut the high frequencies',
    }),
    lu('lower', 'verb', 'scalar_decrease', {
      impliedAxis: null, impliedDirection: 'decrease',
      example: 'Lower the volume',
    }),
    lu('decrease', 'verb', 'scalar_decrease', {
      impliedAxis: null, impliedDirection: 'decrease',
      example: 'Decrease the reverb',
    }),
    lu('reduce', 'verb', 'scalar_decrease', {
      impliedAxis: null, impliedDirection: 'decrease',
      example: 'Reduce the bass',
    }),
    lu('soften', 'verb', 'scalar_decrease', {
      impliedAxis: 'punch', impliedDirection: 'decrease',
      impliedLevers: ['transient_attack', 'compressor_attack', 'eq_presence'],
      example: 'Soften the drums',
    }),
    lu('dampen', 'verb', 'scalar_decrease', {
      impliedAxis: 'brightness', impliedDirection: 'decrease',
      impliedLevers: ['filter_cutoff', 'eq_high_gain', 'damping'],
      example: 'Dampen the hi-hats',
    }),
    lu('attenuate', 'verb', 'scalar_decrease', {
      impliedAxis: 'loudness', impliedDirection: 'decrease',
      impliedLevers: ['gain', 'output_volume', 'fader_level'],
      example: 'Attenuate the signal',
    }),
    lu('thin', 'verb', 'scalar_decrease', {
      impliedAxis: 'density', impliedDirection: 'decrease',
      impliedLevers: ['eq_low_gain', 'unison_voices', 'layer_count'],
      example: 'Thin out the arrangement',
    }),
    lu('dull', 'verb', 'scalar_decrease', {
      impliedAxis: 'brightness', impliedDirection: 'decrease',
      impliedLevers: ['eq_high_gain', 'filter_cutoff', 'exciter_amount'],
      example: 'Dull the harsh frequencies',
    }),
    lu('loosen', 'verb', 'scalar_decrease', {
      impliedAxis: 'groove_tightness', impliedDirection: 'decrease',
      impliedLevers: ['quantize_strength', 'humanize_amount'],
      example: 'Loosen the quantization',
    }),
    lu('dry', 'verb', 'scalar_decrease', {
      impliedAxis: 'depth', impliedDirection: 'decrease', senseRank: 2,
      impliedLevers: ['reverb_amount', 'delay_mix', 'reverb_decay'],
      example: 'Dry up the vocals',
    }),
    lu('mute', 'verb', 'scalar_decrease', {
      impliedAxis: 'loudness', impliedDirection: 'decrease',
      impliedLevers: ['mute_toggle', 'fader_level'],
      example: 'Mute the hi-hat track',
    }),
    lu('subdue', 'verb', 'scalar_decrease', {
      impliedAxis: 'energy', impliedDirection: 'decrease',
      impliedLevers: ['compressor_ratio', 'fader_level', 'eq_presence'],
      example: 'Subdue the guitar during the verse',
    }),
    lu('close', 'verb', 'scalar_decrease', {
      impliedAxis: 'brightness', impliedDirection: 'decrease', senseRank: 2,
      impliedLevers: ['filter_cutoff', 'eq_high_gain'],
      example: 'Close the filter slowly',
    }),
    lu('simplify', 'verb', 'scalar_decrease', {
      impliedAxis: 'complexity', impliedDirection: 'decrease',
      example: 'Simplify the arrangement',
    }),
  ],
  axisMapping: {
    primaryAxis: null,
    axisDeterminedBy: 'result',
    defaultDirection: 'decrease',
    typicalLevers: [],
    changeMode: 'relative',
    targetFeatures: ['audible'],
  },
  cplMapping: {
    primaryNodeType: 'goal',
    goalVariant: 'axis-goal',
    elementMappings: [
      { elementName: 'Entity', cplField: 'scope', cplNodeType: 'scope', transform: { kind: 'to_scope_ref' } },
      { elementName: 'Axis', cplField: 'axis', cplNodeType: 'goal', transform: { kind: 'identity' } },
      { elementName: 'Amount', cplField: 'targetValue', cplNodeType: 'goal', transform: { kind: 'to_amount' } },
    ],
    templateFields: { direction: 'decrease' },
    multiNode: false,
  },
  relations: [
    { relationType: 'antonym_of', targetFrameId: 'scalar_increase', description: 'Decrease is the opposite of increase' },
  ],
  constraints: [
    {
      id: 'axis_agreement',
      description: 'Entity must support the axis being changed',
      kind: 'axis_agreement',
      elements: ['Entity', 'Axis'],
      severity: 'error',
    },
  ],
};

/**
 * Scalar Set frame: setting a value to a specific point.
 * LUs: set, make (+ adj), tune
 */
export const SCALAR_SET_FRAME: FrameDef = {
  id: 'scalar_set',
  name: 'Scalar_Set',
  description: 'Setting a value to a specific absolute or relative point',
  family: 'axis_change',
  inheritsFrom: null,
  eventCategory: 'transformation',
  elements: new Map([
    fe('Entity', 'The entity being modified', 'core', 'patient',
      createRequirement(['editable'], [], [], 'Target of set must be editable')),
    fe('Attribute', 'The parameter/axis being set', 'core', 'result',
      createRequirement([], [], ['scalar', 'parametric'], 'Attribute should be parametric')),
    fe('Value', 'The target value', 'core', 'degree',
      createRequirement(['scalar'], [], [], 'Value must be scalar')),
    fe('Scope', 'Where the change applies', 'peripheral', 'location',
      createRequirement(['structural'], [], ['sectional'], 'Scope is structural'),
      { typicallyExpressed: false }),
  ]),
  lexicalUnits: [
    lu('set', 'verb', 'scalar_set', {
      impliedDirection: 'set',
      example: 'Set the tempo to 120',
    }),
    lu('tune', 'verb', 'scalar_set', {
      impliedAxis: 'pitch', impliedDirection: 'set',
      impliedLevers: ['pitch_offset', 'detune'],
      example: 'Tune the bass to A',
    }),
    lu('configure', 'verb', 'scalar_set', {
      impliedDirection: 'set', senseRank: 2,
      example: 'Configure the compressor threshold',
    }),
    lu('dial', 'verb', 'scalar_set', {
      impliedDirection: 'set',
      example: 'Dial in the reverb time',
    }),
    lu('match', 'verb', 'scalar_set', {
      impliedDirection: 'set', senseRank: 2,
      example: 'Match the volume levels',
    }),
    lu('calibrate', 'verb', 'scalar_set', {
      impliedDirection: 'set',
      example: 'Calibrate the panning',
    }),
  ],
  axisMapping: {
    primaryAxis: null,
    axisDeterminedBy: 'explicit',
    defaultDirection: 'set',
    typicalLevers: [],
    changeMode: 'absolute',
    targetFeatures: ['parametric'],
  },
  cplMapping: {
    primaryNodeType: 'goal',
    goalVariant: 'axis-goal',
    elementMappings: [
      { elementName: 'Entity', cplField: 'scope', cplNodeType: 'scope', transform: { kind: 'to_scope_ref' } },
      { elementName: 'Attribute', cplField: 'axis', cplNodeType: 'goal', transform: { kind: 'identity' } },
      { elementName: 'Value', cplField: 'targetValue', cplNodeType: 'goal', transform: { kind: 'to_amount' } },
    ],
    templateFields: { direction: 'set' },
    multiNode: false,
  },
  relations: [],
  constraints: [],
};

/**
 * Bidirectional Adjust frame: verbs that imply axis change but
 * rely on context for direction (e.g., "adjust", "modify", "tweak").
 */
export const BIDIRECTIONAL_ADJUST_FRAME: FrameDef = {
  id: 'bidirectional_adjust',
  name: 'Bidirectional_Adjust',
  description: 'Adjusting a value along an axis (direction determined by context)',
  family: 'axis_change',
  inheritsFrom: null,
  eventCategory: 'transformation',
  elements: new Map([
    fe('Entity', 'The entity being modified', 'core', 'patient',
      createRequirement(['editable'], [], [], 'Target of adjust must be editable')),
    fe('Axis', 'The parameter/axis being adjusted', 'peripheral', 'result',
      createRequirement([], [], ['scalar'], 'Axis is typically scalar'),
      { typicallyExpressed: false }),
    fe('Direction', 'Which way to adjust (if specified)', 'peripheral', 'manner',
      createRequirement([], [], [], 'Direction has no type restriction'),
      { typicallyExpressed: false }),
    fe('Amount', 'How much to adjust', 'peripheral', 'degree',
      createRequirement(['scalar'], [], [], 'Amount must be scalar'),
      { typicallyExpressed: false }),
    fe('Scope', 'Where the change applies', 'peripheral', 'location',
      createRequirement(['structural'], [], ['sectional'], 'Scope is structural'),
      { typicallyExpressed: false }),
  ]),
  lexicalUnits: [
    lu('adjust', 'verb', 'bidirectional_adjust', { example: 'Adjust the EQ' }),
    lu('modify', 'verb', 'bidirectional_adjust', { example: 'Modify the reverb settings' }),
    lu('tweak', 'verb', 'bidirectional_adjust', { example: 'Tweak the snare sound' }),
    lu('change', 'verb', 'bidirectional_adjust', { example: 'Change the tempo' }),
    lu('alter', 'verb', 'bidirectional_adjust', { example: 'Alter the chord voicings' }),
    lu('refine', 'verb', 'bidirectional_adjust', { example: 'Refine the mix balance' }),
    lu('rework', 'verb', 'bidirectional_adjust', { example: 'Rework the drum pattern' }),
    lu('fix', 'verb', 'bidirectional_adjust', { example: 'Fix the timing issues' }),
    lu('touch up', 'verb', 'bidirectional_adjust', { example: 'Touch up the vocal EQ' }),
    lu('polish', 'verb', 'bidirectional_adjust', { example: 'Polish the final mix' }),
  ],
  axisMapping: {
    primaryAxis: null,
    axisDeterminedBy: null,
    defaultDirection: null,
    typicalLevers: [],
    changeMode: 'either',
    targetFeatures: ['editable'],
  },
  cplMapping: {
    primaryNodeType: 'goal',
    goalVariant: 'axis-goal',
    elementMappings: [
      { elementName: 'Entity', cplField: 'scope', cplNodeType: 'scope', transform: { kind: 'to_scope_ref' } },
      { elementName: 'Axis', cplField: 'axis', cplNodeType: 'goal', transform: { kind: 'identity' } },
      { elementName: 'Amount', cplField: 'targetValue', cplNodeType: 'goal', transform: { kind: 'to_amount' } },
    ],
    templateFields: {},
    multiNode: false,
  },
  relations: [
    { relationType: 'uses', targetFrameId: 'scalar_increase', description: 'May resolve to increase' },
    { relationType: 'uses', targetFrameId: 'scalar_decrease', description: 'May resolve to decrease' },
    { relationType: 'uses', targetFrameId: 'scalar_set', description: 'May resolve to set' },
  ],
  constraints: [],
};

/**
 * Axis Reset frame: returning an axis to a default/previous state.
 */
export const AXIS_RESET_FRAME: FrameDef = {
  id: 'axis_reset',
  name: 'Axis_Reset',
  description: 'Resetting an axis value to default or a prior state',
  family: 'axis_change',
  inheritsFrom: null,
  eventCategory: 'reversal',
  elements: new Map([
    fe('Entity', 'The entity being reset', 'core', 'patient',
      createRequirement(['editable'], [], [], 'Target of reset must be editable')),
    fe('Attribute', 'The parameter/axis being reset', 'peripheral', 'result',
      createRequirement([], [], ['scalar', 'parametric'], 'Attribute should be parametric'),
      { typicallyExpressed: false }),
    fe('TargetState', 'State to return to (default, original, etc.)', 'peripheral', 'goal',
      createRequirement([], [], [], 'Target state has no type restriction'),
      { typicallyExpressed: false }),
  ]),
  lexicalUnits: [
    lu('reset', 'verb', 'axis_reset', { example: 'Reset the EQ to flat' }),
    lu('zero', 'verb', 'axis_reset', {
      impliedDirection: 'set',
      example: 'Zero out the pan',
    }),
    lu('default', 'verb', 'axis_reset', { example: 'Default the compressor settings' }),
    lu('flatten', 'verb', 'axis_reset', {
      impliedAxis: null,
      example: 'Flatten the EQ curve',
    }),
    lu('neutralize', 'verb', 'axis_reset', { example: 'Neutralize the color' }),
    lu('normalize', 'verb', 'axis_reset', { example: 'Normalize the volume' }),
  ],
  axisMapping: {
    primaryAxis: null,
    axisDeterminedBy: 'explicit',
    defaultDirection: 'set',
    typicalLevers: [],
    changeMode: 'absolute',
    targetFeatures: ['parametric'],
  },
  cplMapping: {
    primaryNodeType: 'goal',
    goalVariant: 'axis-goal',
    elementMappings: [
      { elementName: 'Entity', cplField: 'scope', cplNodeType: 'scope', transform: { kind: 'to_scope_ref' } },
      { elementName: 'Attribute', cplField: 'axis', cplNodeType: 'goal', transform: { kind: 'identity' } },
    ],
    templateFields: { direction: 'set' },
    multiNode: false,
  },
  relations: [
    { relationType: 'uses', targetFrameId: 'scalar_set', description: 'Reset is a special case of set (to default)' },
  ],
  constraints: [],
};


// =============================================================================
// STRUCTURAL EDIT FRAMES
// =============================================================================

/**
 * Creation frame: adding new elements.
 */
export const CREATION_FRAME: FrameDef = {
  id: 'creation',
  name: 'Creation',
  description: 'Adding or creating a new element',
  family: 'structural_edit',
  inheritsFrom: null,
  eventCategory: 'creation',
  elements: new Map([
    fe('CreatedEntity', 'What is being created', 'core', 'theme',
      createRequirement(['editable'], [], [], 'Created element must be editable')),
    fe('Location', 'Where to place the new element', 'peripheral', 'location',
      createRequirement(['structural'], [], ['sectional', 'layered'], 'Location should be structural')),
    fe('Template', 'Template or source for the creation', 'peripheral', 'instrument',
      createRequirement([], [], [], 'Template has no type restriction'),
      { typicallyExpressed: false }),
    fe('Scope', 'Context in which creation occurs', 'peripheral', 'location',
      createRequirement(['structural'], [], [], 'Scope is structural'),
      { typicallyExpressed: false, excludes: ['Location'] }),
  ]),
  lexicalUnits: [
    lu('add', 'verb', 'creation', { example: 'Add reverb to the vocals' }),
    lu('create', 'verb', 'creation', { example: 'Create a new drum pattern' }),
    lu('insert', 'verb', 'creation', { example: 'Insert a break before the chorus' }),
    lu('introduce', 'verb', 'creation', { example: 'Introduce a countermelody' }),
    lu('put', 'verb', 'creation', { example: 'Put a delay on the guitar' }),
    lu('place', 'verb', 'creation', { example: 'Place a compressor on the master' }),
    lu('apply', 'verb', 'creation', { example: 'Apply distortion to the bass' }),
    lu('include', 'verb', 'creation', { example: 'Include a fade-in' }),
    lu('layer', 'verb', 'creation', {
      senseRank: 2,
      example: 'Layer another synth on top',
    }),
    lu('stack', 'verb', 'creation', {
      senseRank: 2,
      example: 'Stack harmonies on the chorus',
    }),
  ],
  axisMapping: null,
  cplMapping: {
    primaryNodeType: 'goal',
    goalVariant: 'structural-goal',
    elementMappings: [
      { elementName: 'CreatedEntity', cplField: 'theme', cplNodeType: 'goal', transform: { kind: 'identity' } },
      { elementName: 'Location', cplField: 'scope', cplNodeType: 'scope', transform: { kind: 'to_scope_ref' } },
    ],
    templateFields: {},
    multiNode: false,
  },
  relations: [
    { relationType: 'antonym_of', targetFrameId: 'destruction', description: 'Creation is the opposite of destruction' },
  ],
  constraints: [],
};

/**
 * Destruction frame: removing elements.
 */
export const DESTRUCTION_FRAME: FrameDef = {
  id: 'destruction',
  name: 'Destruction',
  description: 'Removing or deleting an element',
  family: 'structural_edit',
  inheritsFrom: null,
  eventCategory: 'destruction',
  elements: new Map([
    fe('DestroyedEntity', 'What is being removed', 'core', 'patient',
      createRequirement(['deletable'], [], [], 'Removed element must be deletable')),
    fe('Source', 'Where the element is being removed from', 'peripheral', 'source',
      createRequirement(['structural'], [], [], 'Source should be structural'),
      { typicallyExpressed: false }),
    fe('Scope', 'Context for removal', 'peripheral', 'location',
      createRequirement(['structural'], [], [], 'Scope is structural'),
      { typicallyExpressed: false }),
  ]),
  lexicalUnits: [
    lu('remove', 'verb', 'destruction', { example: 'Remove the reverb' }),
    lu('delete', 'verb', 'destruction', { example: 'Delete the second verse' }),
    lu('clear', 'verb', 'destruction', { example: 'Clear the automation' }),
    lu('strip', 'verb', 'destruction', { example: 'Strip the effects from the vocal' }),
    lu('erase', 'verb', 'destruction', { example: 'Erase the drum pattern' }),
    lu('drop', 'verb', 'destruction', {
      senseRank: 2,
      example: 'Drop the bass for the breakdown',
    }),
    lu('kill', 'verb', 'destruction', {
      senseRank: 2,
      example: 'Kill the delay on the snare',
    }),
    lu('nuke', 'verb', 'destruction', {
      senseRank: 2, evocationStrength: 0.7,
      example: 'Nuke all the effects',
    }),
    lu('get rid of', 'verb', 'destruction', { example: 'Get rid of the hi-hat' }),
    lu('take out', 'verb', 'destruction', { example: 'Take out the piano' }),
  ],
  axisMapping: null,
  cplMapping: {
    primaryNodeType: 'goal',
    goalVariant: 'structural-goal',
    elementMappings: [
      { elementName: 'DestroyedEntity', cplField: 'patient', cplNodeType: 'goal', transform: { kind: 'identity' } },
      { elementName: 'Source', cplField: 'scope', cplNodeType: 'scope', transform: { kind: 'to_scope_ref' } },
    ],
    templateFields: {},
    multiNode: false,
  },
  relations: [
    { relationType: 'antonym_of', targetFrameId: 'creation', description: 'Destruction is the opposite of creation' },
  ],
  constraints: [],
};

/**
 * Movement frame: moving or rearranging elements.
 */
export const MOVEMENT_FRAME: FrameDef = {
  id: 'movement',
  name: 'Movement',
  description: 'Moving or rearranging an element',
  family: 'structural_edit',
  inheritsFrom: null,
  eventCategory: 'movement',
  elements: new Map([
    fe('MovedEntity', 'What is being moved', 'core', 'patient',
      createRequirement(['reorderable'], [], [], 'Moved element must be reorderable')),
    fe('Destination', 'Where to move it', 'core', 'goal',
      createRequirement(['structural'], [], ['temporal', 'sectional'], 'Destination should be structural')),
    fe('Source', 'Where it is coming from', 'peripheral', 'source',
      createRequirement(['structural'], [], [], 'Source should be structural'),
      { typicallyExpressed: false }),
    fe('Amount', 'How far to move', 'peripheral', 'degree',
      createRequirement(['scalar'], [], [], 'Amount must be scalar'),
      { typicallyExpressed: false }),
  ]),
  lexicalUnits: [
    lu('move', 'verb', 'movement', { example: 'Move the bridge after the second chorus' }),
    lu('shift', 'verb', 'movement', { example: 'Shift the drums forward by a beat' }),
    lu('swap', 'verb', 'movement', { example: 'Swap the verse and pre-chorus' }),
    lu('rearrange', 'verb', 'movement', { example: 'Rearrange the sections' }),
    lu('reorder', 'verb', 'movement', { example: 'Reorder the layers' }),
    lu('drag', 'verb', 'movement', { senseRank: 2, example: 'Drag the region earlier' }),
    lu('push', 'verb', 'movement', {
      senseRank: 2,
      example: 'Push the snare hits back a bit',
    }),
    lu('pull', 'verb', 'movement', {
      senseRank: 2,
      example: 'Pull the vocal track forward',
    }),
    lu('slide', 'verb', 'movement', { example: 'Slide the notes to the right' }),
    lu('nudge', 'verb', 'movement', { example: 'Nudge the timing slightly' }),
  ],
  axisMapping: null,
  cplMapping: {
    primaryNodeType: 'goal',
    goalVariant: 'structural-goal',
    elementMappings: [
      { elementName: 'MovedEntity', cplField: 'patient', cplNodeType: 'goal', transform: { kind: 'identity' } },
      { elementName: 'Destination', cplField: 'goal', cplNodeType: 'goal', transform: { kind: 'to_scope_ref' } },
    ],
    templateFields: {},
    multiNode: false,
  },
  relations: [],
  constraints: [],
};

/**
 * Duplication frame: copying elements.
 */
export const DUPLICATION_FRAME: FrameDef = {
  id: 'duplication',
  name: 'Duplication',
  description: 'Copying or duplicating an element',
  family: 'structural_edit',
  inheritsFrom: null,
  eventCategory: 'duplication',
  elements: new Map([
    fe('Original', 'The element being copied', 'core', 'patient',
      createRequirement(['duplicable'], [], [], 'Original must be duplicable')),
    fe('Destination', 'Where the copy goes', 'peripheral', 'goal',
      createRequirement(['structural'], [], [], 'Destination should be structural'),
      { typicallyExpressed: false }),
    fe('Count', 'Number of copies', 'peripheral', 'degree',
      createRequirement(['scalar'], [], [], 'Count must be scalar'),
      { typicallyExpressed: false }),
  ]),
  lexicalUnits: [
    lu('copy', 'verb', 'duplication', { example: 'Copy the chorus melody' }),
    lu('duplicate', 'verb', 'duplication', { example: 'Duplicate the drum track' }),
    lu('repeat', 'verb', 'duplication', { example: 'Repeat the riff four times' }),
    lu('double', 'verb', 'duplication', { example: 'Double the vocal line' }),
    lu('clone', 'verb', 'duplication', { example: 'Clone the verse section' }),
    lu('mirror', 'verb', 'duplication', { example: 'Mirror the left channel pattern' }),
  ],
  axisMapping: null,
  cplMapping: {
    primaryNodeType: 'goal',
    goalVariant: 'structural-goal',
    elementMappings: [
      { elementName: 'Original', cplField: 'patient', cplNodeType: 'goal', transform: { kind: 'identity' } },
      { elementName: 'Destination', cplField: 'goal', cplNodeType: 'scope', transform: { kind: 'to_scope_ref' } },
    ],
    templateFields: {},
    multiNode: false,
  },
  relations: [],
  constraints: [],
};


// =============================================================================
// PRESERVATION FRAMES
// =============================================================================

/**
 * Generic Preserve frame: keeping something the same.
 */
export const GENERIC_PRESERVE_FRAME: FrameDef = {
  id: 'generic_preserve',
  name: 'Generic_Preserve',
  description: 'Keeping an element or property unchanged',
  family: 'preservation',
  inheritsFrom: null,
  eventCategory: 'preservation',
  elements: new Map([
    fe('PreservedEntity', 'What is being preserved', 'core', 'patient',
      createRequirement(['editable'], [], [], 'Preserved element must be editable')),
    fe('Property', 'Specific property to preserve (if not the whole entity)', 'peripheral', 'theme',
      createRequirement([], [], [], 'Property has no type restriction'),
      { typicallyExpressed: false }),
    fe('Scope', 'Context for preservation', 'peripheral', 'location',
      createRequirement(['structural'], [], [], 'Scope is structural'),
      { typicallyExpressed: false }),
    fe('Mode', 'How strictly to preserve (exact, functional, recognizable)', 'peripheral', 'manner',
      createRequirement([], [], [], 'Mode has no type restriction'),
      { typicallyExpressed: false }),
  ]),
  lexicalUnits: [
    lu('keep', 'verb', 'generic_preserve', { example: 'Keep the melody the same' }),
    lu('preserve', 'verb', 'generic_preserve', { example: 'Preserve the chord changes' }),
    lu('maintain', 'verb', 'generic_preserve', { example: 'Maintain the groove' }),
    lu('retain', 'verb', 'generic_preserve', { example: 'Retain the original structure' }),
    lu('hold', 'verb', 'generic_preserve', {
      senseRank: 2,
      example: 'Hold the bass line steady',
    }),
    lu('leave', 'verb', 'generic_preserve', {
      senseRank: 2,
      example: 'Leave the drums as they are',
    }),
    lu('protect', 'verb', 'generic_preserve', { example: 'Protect the vocal from clipping' }),
    lu('lock', 'verb', 'generic_preserve', {
      senseRank: 2,
      example: 'Lock the tempo',
    }),
    lu('freeze', 'verb', 'generic_preserve', {
      senseRank: 2,
      example: 'Freeze the arrangement',
    }),
  ],
  axisMapping: null,
  cplMapping: {
    primaryNodeType: 'constraint',
    goalVariant: null,
    elementMappings: [
      { elementName: 'PreservedEntity', cplField: 'scope', cplNodeType: 'scope', transform: { kind: 'to_scope_ref' } },
      { elementName: 'Property', cplField: 'description', cplNodeType: 'constraint', transform: { kind: 'identity' } },
    ],
    templateFields: { variant: 'preserve', strength: 'hard' },
    multiNode: false,
  },
  relations: [
    { relationType: 'uses', targetFrameId: 'exact_preserve', description: 'May resolve to exact preservation' },
    { relationType: 'uses', targetFrameId: 'functional_preserve', description: 'May resolve to functional preservation' },
    { relationType: 'uses', targetFrameId: 'recognizable_preserve', description: 'May resolve to recognizable preservation' },
  ],
  constraints: [],
};

/**
 * Exact Preserve frame: keeping something byte-for-byte identical.
 */
export const EXACT_PRESERVE_FRAME: FrameDef = {
  id: 'exact_preserve',
  name: 'Exact_Preserve',
  description: 'Keeping an element exactly the same (no changes)',
  family: 'preservation',
  inheritsFrom: 'generic_preserve',
  eventCategory: 'preservation',
  elements: new Map([
    fe('PreservedEntity', 'What is being preserved', 'core', 'patient',
      createRequirement(['editable'], [], [], 'Preserved element must be editable')),
    fe('Scope', 'Context for preservation', 'peripheral', 'location',
      createRequirement(['structural'], [], [], 'Scope is structural'),
      { typicallyExpressed: false }),
  ]),
  lexicalUnits: [
    lu('untouched', 'adjective', 'exact_preserve', { example: 'Keep the drums untouched' }),
    lu('intact', 'adjective', 'exact_preserve', { example: 'Leave the melody intact' }),
    lu('identical', 'adjective', 'exact_preserve', { example: 'Keep it identical' }),
    lu('unchanged', 'adjective', 'exact_preserve', { example: 'Leave the chords unchanged' }),
    lu('as is', 'adverb', 'exact_preserve', { example: 'Keep the arrangement as is' }),
    lu('exactly', 'adverb', 'exact_preserve', { example: 'Preserve the rhythm exactly' }),
  ],
  axisMapping: null,
  cplMapping: {
    primaryNodeType: 'constraint',
    goalVariant: null,
    elementMappings: [
      { elementName: 'PreservedEntity', cplField: 'scope', cplNodeType: 'scope', transform: { kind: 'to_scope_ref' } },
    ],
    templateFields: { variant: 'preserve', strength: 'hard', mode: 'exact' },
    multiNode: false,
  },
  relations: [
    { relationType: 'inherits', targetFrameId: 'generic_preserve', description: 'Exact preserve is a specific preservation' },
  ],
  constraints: [],
};

/**
 * Functional Preserve frame: preserving the musical function, not exact content.
 */
export const FUNCTIONAL_PRESERVE_FRAME: FrameDef = {
  id: 'functional_preserve',
  name: 'Functional_Preserve',
  description: 'Preserving the musical function/role of an element',
  family: 'preservation',
  inheritsFrom: 'generic_preserve',
  eventCategory: 'preservation',
  elements: new Map([
    fe('PreservedEntity', 'What is being preserved', 'core', 'patient',
      createRequirement(['editable'], [], [], 'Preserved element must be editable')),
    fe('Function', 'The musical function to preserve', 'peripheral', 'theme',
      createRequirement([], [], [], 'Function has no type restriction'),
      { typicallyExpressed: false }),
    fe('Scope', 'Context for preservation', 'peripheral', 'location',
      createRequirement(['structural'], [], [], 'Scope is structural'),
      { typicallyExpressed: false }),
  ]),
  lexicalUnits: [
    lu('functional', 'adjective', 'functional_preserve', {
      example: 'Keep the chords functionally the same',
    }),
    lu('same feel', 'noun', 'functional_preserve', { example: 'Keep the same feel' }),
    lu('spirit', 'noun', 'functional_preserve', { example: 'Preserve the spirit of the melody' }),
    lu('essence', 'noun', 'functional_preserve', { example: 'Retain the essence' }),
    lu('character', 'noun', 'functional_preserve', { example: 'Maintain the character' }),
    lu('vibe', 'noun', 'functional_preserve', { example: 'Keep the vibe' }),
  ],
  axisMapping: null,
  cplMapping: {
    primaryNodeType: 'constraint',
    goalVariant: null,
    elementMappings: [
      { elementName: 'PreservedEntity', cplField: 'scope', cplNodeType: 'scope', transform: { kind: 'to_scope_ref' } },
    ],
    templateFields: { variant: 'preserve', strength: 'soft', mode: 'functional' },
    multiNode: false,
  },
  relations: [
    { relationType: 'inherits', targetFrameId: 'generic_preserve', description: 'Functional preserve is a specific preservation' },
  ],
  constraints: [],
};

/**
 * Recognizable Preserve frame: preserving recognizability (e.g., melody contour).
 */
export const RECOGNIZABLE_PRESERVE_FRAME: FrameDef = {
  id: 'recognizable_preserve',
  name: 'Recognizable_Preserve',
  description: 'Preserving recognizability of an element (contour, rhythm pattern)',
  family: 'preservation',
  inheritsFrom: 'generic_preserve',
  eventCategory: 'preservation',
  elements: new Map([
    fe('PreservedEntity', 'What is being preserved', 'core', 'patient',
      createRequirement(['editable'], [], [], 'Preserved element must be editable')),
    fe('IdentityFeature', 'What makes it recognizable (contour, pattern)', 'peripheral', 'theme',
      createRequirement([], [], [], 'Identity feature has no type restriction'),
      { typicallyExpressed: false }),
    fe('Scope', 'Context for preservation', 'peripheral', 'location',
      createRequirement(['structural'], [], [], 'Scope is structural'),
      { typicallyExpressed: false }),
  ]),
  lexicalUnits: [
    lu('recognizable', 'adjective', 'recognizable_preserve', {
      example: 'Keep the melody recognizable',
    }),
    lu('similar', 'adjective', 'recognizable_preserve', {
      example: 'Keep the rhythm similar',
    }),
    lu('close', 'adjective', 'recognizable_preserve', {
      example: 'Keep it close to the original',
    }),
    lu('roughly', 'adverb', 'recognizable_preserve', {
      example: 'Preserve roughly the same melody',
    }),
    lu('shape', 'noun', 'recognizable_preserve', {
      example: 'Keep the melodic shape',
    }),
    lu('contour', 'noun', 'recognizable_preserve', {
      example: 'Preserve the contour',
    }),
  ],
  axisMapping: null,
  cplMapping: {
    primaryNodeType: 'constraint',
    goalVariant: null,
    elementMappings: [
      { elementName: 'PreservedEntity', cplField: 'scope', cplNodeType: 'scope', transform: { kind: 'to_scope_ref' } },
    ],
    templateFields: { variant: 'preserve', strength: 'soft', mode: 'recognizable' },
    multiNode: false,
  },
  relations: [
    { relationType: 'inherits', targetFrameId: 'generic_preserve', description: 'Recognizable preserve is a specific preservation' },
  ],
  constraints: [],
};


// =============================================================================
// INSPECTION AND REVERSAL FRAMES
// =============================================================================

/**
 * Playback frame: playing or previewing audio.
 */
export const PLAYBACK_FRAME: FrameDef = {
  id: 'playback',
  name: 'Playback',
  description: 'Playing or previewing audio content',
  family: 'inspection',
  inheritsFrom: null,
  eventCategory: 'inspection',
  elements: new Map([
    fe('Content', 'What to play', 'core', 'patient',
      createRequirement(['audible'], [], [], 'Content must be audible')),
    fe('Scope', 'Which part to play', 'peripheral', 'location',
      createRequirement(['structural'], [], ['sectional', 'temporal'], 'Scope should be structural'),
      { typicallyExpressed: false }),
    fe('Mode', 'How to play (solo, loop, etc.)', 'peripheral', 'manner',
      createRequirement([], [], [], 'Mode has no type restriction'),
      { typicallyExpressed: false }),
  ]),
  lexicalUnits: [
    lu('play', 'verb', 'playback', { example: 'Play the chorus' }),
    lu('preview', 'verb', 'playback', { example: 'Preview the changes' }),
    lu('listen', 'verb', 'playback', { example: 'Listen to the bass' }),
    lu('hear', 'verb', 'playback', { example: 'Let me hear the drums' }),
    lu('solo', 'verb', 'playback', { example: 'Solo the vocal track' }),
    lu('audition', 'verb', 'playback', { example: 'Audition the effect' }),
  ],
  axisMapping: null,
  cplMapping: {
    primaryNodeType: 'goal',
    goalVariant: 'production-goal',
    elementMappings: [
      { elementName: 'Content', cplField: 'patient', cplNodeType: 'goal', transform: { kind: 'identity' } },
      { elementName: 'Scope', cplField: 'scope', cplNodeType: 'scope', transform: { kind: 'to_scope_ref' } },
    ],
    templateFields: {},
    multiNode: false,
  },
  relations: [],
  constraints: [],
};

/**
 * Undo frame: reversing a previous edit.
 */
export const UNDO_FRAME: FrameDef = {
  id: 'undo',
  name: 'Undo',
  description: 'Reversing a previous edit action',
  family: 'reversal',
  inheritsFrom: null,
  eventCategory: 'reversal',
  elements: new Map([
    fe('ReversedAction', 'The action to reverse', 'core', 'patient',
      createRequirement([], [], [], 'Any action can be undone'),
      { typicallyExpressed: false }),
    fe('Count', 'How many steps to undo', 'peripheral', 'degree',
      createRequirement(['scalar'], [], [], 'Count must be scalar'),
      { typicallyExpressed: false }),
  ]),
  lexicalUnits: [
    lu('undo', 'verb', 'undo', { example: 'Undo the last change' }),
    lu('revert', 'verb', 'undo', { example: 'Revert to the previous version' }),
    lu('rollback', 'verb', 'undo', { example: 'Roll back the changes' }),
    lu('take back', 'verb', 'undo', { example: 'Take back that edit' }),
    lu('go back', 'verb', 'undo', { example: 'Go back to how it was' }),
  ],
  axisMapping: null,
  cplMapping: {
    primaryNodeType: 'goal',
    goalVariant: 'structural-goal',
    elementMappings: [],
    templateFields: {},
    multiNode: false,
  },
  relations: [
    { relationType: 'antonym_of', targetFrameId: 'redo', description: 'Undo is the opposite of redo' },
  ],
  constraints: [],
};

/**
 * Redo frame: re-applying a previously undone action.
 */
export const REDO_FRAME: FrameDef = {
  id: 'redo',
  name: 'Redo',
  description: 'Re-applying a previously undone action',
  family: 'reversal',
  inheritsFrom: null,
  eventCategory: 'reversal',
  elements: new Map([
    fe('RedoneAction', 'The action to redo', 'core', 'patient',
      createRequirement([], [], [], 'Any undone action can be redone'),
      { typicallyExpressed: false }),
    fe('Count', 'How many steps to redo', 'peripheral', 'degree',
      createRequirement(['scalar'], [], [], 'Count must be scalar'),
      { typicallyExpressed: false }),
  ]),
  lexicalUnits: [
    lu('redo', 'verb', 'redo', { example: 'Redo the last change' }),
    lu('reapply', 'verb', 'redo', { example: 'Reapply the effect' }),
  ],
  axisMapping: null,
  cplMapping: {
    primaryNodeType: 'goal',
    goalVariant: 'structural-goal',
    elementMappings: [],
    templateFields: {},
    multiNode: false,
  },
  relations: [
    { relationType: 'antonym_of', targetFrameId: 'undo', description: 'Redo is the opposite of undo' },
  ],
  constraints: [],
};


// =============================================================================
// COMBINATION FRAMES
// =============================================================================

/**
 * Merge frame: combining multiple elements into one.
 */
export const MERGE_FRAME: FrameDef = {
  id: 'merge',
  name: 'Merge',
  description: 'Combining multiple elements into a single entity',
  family: 'combination',
  inheritsFrom: null,
  eventCategory: 'combination',
  elements: new Map([
    fe('Parts', 'The elements being merged', 'core', 'patient',
      createRequirement(['editable'], [], ['layered', 'sequential'], 'Parts must be editable')),
    fe('Result', 'The merged result', 'peripheral', 'result',
      createRequirement([], [], [], 'Result has no type restriction'),
      { typicallyExpressed: false }),
    fe('Mode', 'How to merge (sum, average, interleave)', 'peripheral', 'manner',
      createRequirement([], [], [], 'Mode has no type restriction'),
      { typicallyExpressed: false }),
  ]),
  lexicalUnits: [
    lu('merge', 'verb', 'merge', { example: 'Merge the two drum tracks' }),
    lu('combine', 'verb', 'merge', { example: 'Combine the layers' }),
    lu('join', 'verb', 'merge', { example: 'Join the sections together' }),
    lu('consolidate', 'verb', 'merge', { example: 'Consolidate the tracks' }),
    lu('unify', 'verb', 'merge', { example: 'Unify the separate parts' }),
  ],
  axisMapping: null,
  cplMapping: {
    primaryNodeType: 'goal',
    goalVariant: 'structural-goal',
    elementMappings: [
      { elementName: 'Parts', cplField: 'patient', cplNodeType: 'goal', transform: { kind: 'identity' } },
    ],
    templateFields: {},
    multiNode: false,
  },
  relations: [
    { relationType: 'antonym_of', targetFrameId: 'separation', description: 'Merge is the opposite of separation' },
  ],
  constraints: [],
};

/**
 * Blend frame: mixing audio qualities (not structural merge).
 */
export const BLEND_FRAME: FrameDef = {
  id: 'blend',
  name: 'Blend',
  description: 'Blending audio qualities between elements',
  family: 'combination',
  inheritsFrom: null,
  eventCategory: 'combination',
  elements: new Map([
    fe('Sources', 'The elements being blended', 'core', 'patient',
      createRequirement(['audible', 'mixable'], [], [], 'Sources must be audible and mixable')),
    fe('Ratio', 'The blend ratio / balance', 'peripheral', 'degree',
      createRequirement(['scalar'], [], [], 'Ratio must be scalar'),
      { typicallyExpressed: false }),
    fe('Manner', 'How to blend (crossfade, parallel, etc.)', 'peripheral', 'manner',
      createRequirement([], [], [], 'Manner has no type restriction'),
      { typicallyExpressed: false }),
  ]),
  lexicalUnits: [
    lu('blend', 'verb', 'blend', { example: 'Blend the two guitar tones' }),
    lu('mix', 'verb', 'blend', { example: 'Mix the wet and dry signals' }),
    lu('crossfade', 'verb', 'blend', { example: 'Crossfade between the sections' }),
    lu('balance', 'verb', 'blend', { example: 'Balance the instruments' }),
  ],
  axisMapping: null,
  cplMapping: {
    primaryNodeType: 'goal',
    goalVariant: 'production-goal',
    elementMappings: [
      { elementName: 'Sources', cplField: 'patient', cplNodeType: 'goal', transform: { kind: 'identity' } },
      { elementName: 'Ratio', cplField: 'amount', cplNodeType: 'goal', transform: { kind: 'to_amount' } },
    ],
    templateFields: {},
    multiNode: false,
  },
  relations: [],
  constraints: [],
};

/**
 * Separation frame: splitting elements apart.
 */
export const SEPARATION_FRAME: FrameDef = {
  id: 'separation',
  name: 'Separation',
  description: 'Splitting or separating an element into parts',
  family: 'structural_edit',
  inheritsFrom: null,
  eventCategory: 'separation',
  elements: new Map([
    fe('WholeEntity', 'The entity being split', 'core', 'patient',
      createRequirement(['editable'], [], ['structural', 'sequential'], 'Entity must be editable')),
    fe('Parts', 'The resulting parts', 'peripheral', 'result',
      createRequirement([], [], [], 'Parts has no type restriction'),
      { typicallyExpressed: false }),
    fe('SplitPoint', 'Where to split', 'peripheral', 'location',
      createRequirement(['temporal'], [], [], 'Split point should be temporal'),
      { typicallyExpressed: false }),
  ]),
  lexicalUnits: [
    lu('split', 'verb', 'separation', { example: 'Split the section in half' }),
    lu('separate', 'verb', 'separation', { example: 'Separate the kick and snare' }),
    lu('isolate', 'verb', 'separation', { example: 'Isolate the vocal' }),
    lu('extract', 'verb', 'separation', { example: 'Extract the melody' }),
    lu('break apart', 'verb', 'separation', { example: 'Break apart the chord' }),
    lu('divide', 'verb', 'separation', { example: 'Divide the track into stems' }),
  ],
  axisMapping: null,
  cplMapping: {
    primaryNodeType: 'goal',
    goalVariant: 'structural-goal',
    elementMappings: [
      { elementName: 'WholeEntity', cplField: 'patient', cplNodeType: 'goal', transform: { kind: 'identity' } },
    ],
    templateFields: {},
    multiNode: false,
  },
  relations: [
    { relationType: 'antonym_of', targetFrameId: 'merge', description: 'Separation is the opposite of merge' },
  ],
  constraints: [],
};


// =============================================================================
// FRAME REGISTRY — the central lookup for all frames
// =============================================================================

/**
 * All frames indexed by ID.
 */
export const FRAME_REGISTRY: ReadonlyMap<FrameId, FrameDef> = new Map([
  // Axis change
  ['scalar_increase', SCALAR_INCREASE_FRAME],
  ['scalar_decrease', SCALAR_DECREASE_FRAME],
  ['scalar_set', SCALAR_SET_FRAME],
  ['bidirectional_adjust', BIDIRECTIONAL_ADJUST_FRAME],
  ['axis_reset', AXIS_RESET_FRAME],
  // Structural edit
  ['creation', CREATION_FRAME],
  ['destruction', DESTRUCTION_FRAME],
  ['movement', MOVEMENT_FRAME],
  ['duplication', DUPLICATION_FRAME],
  ['separation', SEPARATION_FRAME],
  // Preservation
  ['generic_preserve', GENERIC_PRESERVE_FRAME],
  ['exact_preserve', EXACT_PRESERVE_FRAME],
  ['functional_preserve', FUNCTIONAL_PRESERVE_FRAME],
  ['recognizable_preserve', RECOGNIZABLE_PRESERVE_FRAME],
  // Combination
  ['merge', MERGE_FRAME],
  ['blend', BLEND_FRAME],
  // Inspection
  ['playback', PLAYBACK_FRAME],
  // Reversal
  ['undo', UNDO_FRAME],
  ['redo', REDO_FRAME],
]);


// =============================================================================
// LEXICAL UNIT INDEX — fast lookup from lemma to frames
// =============================================================================

/**
 * Index of all lexical units by lemma.
 * A single lemma may evoke multiple frames (polysemy).
 */
export const LEXICAL_UNIT_INDEX: ReadonlyMap<string, readonly LexicalUnit[]> = buildLexicalIndex();

function buildLexicalIndex(): ReadonlyMap<string, readonly LexicalUnit[]> {
  const index = new Map<string, LexicalUnit[]>();
  for (const frame of FRAME_REGISTRY.values()) {
    for (const lexUnit of frame.lexicalUnits) {
      const existing = index.get(lexUnit.lemma);
      if (existing) {
        existing.push(lexUnit);
      } else {
        index.set(lexUnit.lemma, [lexUnit]);
      }
    }
  }
  // Sort each entry by sense rank (lower = more salient)
  for (const entries of index.values()) {
    entries.sort((a, b) => a.senseRank - b.senseRank);
  }
  return index;
}


// =============================================================================
// FRAME EVOCATION — determining which frame(s) a verb/adjective evokes
// =============================================================================

/**
 * Result of frame evocation: which frames a word evokes, ranked.
 */
export interface FrameEvocationResult {
  /** The input lemma */
  readonly lemma: string;

  /** Evoked frames, ordered by strength × sense rank */
  readonly evocations: readonly FrameEvocation[];

  /** Whether any frames were found */
  readonly found: boolean;
}

/**
 * A single frame evocation.
 */
export interface FrameEvocation {
  /** The evoked frame */
  readonly frame: FrameDef;

  /** The lexical unit that triggered this evocation */
  readonly lexicalUnit: LexicalUnit;

  /** Composite score (evocation strength / sense rank) */
  readonly score: number;
}

/**
 * Look up which frame(s) a lemma evokes.
 */
export function evokeFrames(lemma: string): FrameEvocationResult {
  const normalizedLemma = lemma.toLowerCase().trim();
  const units = LEXICAL_UNIT_INDEX.get(normalizedLemma);

  if (!units || units.length === 0) {
    return { lemma: normalizedLemma, evocations: [], found: false };
  }

  const evocations: FrameEvocation[] = [];
  for (const unit of units) {
    const frame = FRAME_REGISTRY.get(unit.frameId);
    if (frame) {
      evocations.push({
        frame,
        lexicalUnit: unit,
        score: unit.evocationStrength / unit.senseRank,
      });
    }
  }

  evocations.sort((a, b) => b.score - a.score);

  return { lemma: normalizedLemma, evocations, found: evocations.length > 0 };
}

/**
 * Get the best (highest-scoring) frame for a lemma.
 */
export function bestFrame(lemma: string): FrameDef | null {
  const result = evokeFrames(lemma);
  return result.found ? result.evocations[0].frame : null;
}

/**
 * Get the axis and direction implied by a lemma.
 * Returns null if the lemma doesn't imply a specific axis/direction.
 */
export function impliedAxisFromLemma(lemma: string): {
  axis: string | null;
  direction: 'increase' | 'decrease' | 'set' | null;
  levers: readonly string[];
} | null {
  const result = evokeFrames(lemma);
  if (!result.found) return null;

  const topUnit = result.evocations[0].lexicalUnit;
  if (!topUnit.impliedAxis && !topUnit.impliedDirection && topUnit.impliedLevers.length === 0) {
    return null;
  }

  return {
    axis: topUnit.impliedAxis,
    direction: topUnit.impliedDirection,
    levers: topUnit.impliedLevers,
  };
}


// =============================================================================
// FRAME ELEMENT FILLING — matching parsed arguments to FE slots
// =============================================================================

/**
 * A filled frame element: an FE with its value bound.
 */
export interface FilledFrameElement {
  /** The FE definition */
  readonly definition: FrameElementDef;

  /** The filler value (string representation of the entity/value) */
  readonly fillerText: string;

  /** The entity type of the filler (if resolved) */
  readonly fillerEntityType: RestrictionEntityType | null;

  /** Confidence in this filling (0–1) */
  readonly confidence: number;

  /** Whether the filling was explicit or inferred */
  readonly explicit: boolean;

  /** Source span in the input text */
  readonly span: { readonly start: number; readonly end: number } | null;
}

/**
 * A filled frame: a frame with its elements bound to values.
 */
export interface FilledFrame {
  /** The frame definition */
  readonly frame: FrameDef;

  /** The lexical unit that evoked this frame */
  readonly evokingLU: LexicalUnit;

  /** Filled elements */
  readonly filledElements: ReadonlyMap<string, FilledFrameElement>;

  /** Unfilled core elements (gaps/holes) */
  readonly unfilledCoreElements: readonly FrameElementDef[];

  /** Validation issues */
  readonly validationIssues: readonly FrameValidationIssue[];

  /** Overall fit score (0–1) */
  readonly fitScore: number;
}

/**
 * A validation issue with a frame filling.
 */
export interface FrameValidationIssue {
  /** The element with the issue */
  readonly elementName: string;

  /** The kind of issue */
  readonly kind: 'selectional_violation' | 'missing_core' | 'constraint_violated' | 'type_mismatch';

  /** Human-readable description */
  readonly description: string;

  /** Severity */
  readonly severity: 'error' | 'warning';
}


// =============================================================================
// FRAME VALIDATION — checking whether a filled frame is valid
// =============================================================================

/**
 * Validate a filled frame against selectional restrictions and frame constraints.
 */
export function validateFilledFrame(filled: FilledFrame): readonly FrameValidationIssue[] {
  const issues: FrameValidationIssue[] = [];

  // 1. Check for missing core elements
  for (const [name, def] of filled.frame.elements) {
    if (def.coreness === 'core' && def.typicallyExpressed && !filled.filledElements.has(name)) {
      issues.push({
        elementName: name,
        kind: 'missing_core',
        description: `Core element "${name}" is not filled: ${def.description}`,
        severity: 'warning',
      });
    }
  }

  // 2. Check selectional restrictions on filled elements
  for (const [name, filledElem] of filled.filledElements) {
    const def = filled.frame.elements.get(name);
    if (!def) continue;

    const req = def.selectionalRestriction;
    if (req.required.length > 0 && filledElem.fillerEntityType) {
      // We'd need the entity feature profiles to fully validate here.
      // For now, record a placeholder if entity type seems wrong.
      // Full validation uses ENTITY_FEATURE_PROFILES from selectional-restrictions.
    }
  }

  // 3. Check mutual exclusion constraints
  for (const [name, def] of filled.frame.elements) {
    if (filled.filledElements.has(name)) {
      for (const excludedName of def.excludes) {
        if (filled.filledElements.has(excludedName)) {
          issues.push({
            elementName: name,
            kind: 'constraint_violated',
            description: `"${name}" and "${excludedName}" are mutually exclusive`,
            severity: 'error',
          });
        }
      }
    }
  }

  // 4. Check conditional requirements
  for (const [name, def] of filled.frame.elements) {
    if (filled.filledElements.has(name)) {
      for (const requiredName of def.requires) {
        if (!filled.filledElements.has(requiredName)) {
          issues.push({
            elementName: name,
            kind: 'constraint_violated',
            description: `"${name}" requires "${requiredName}" to be filled`,
            severity: 'warning',
          });
        }
      }
    }
  }

  // 5. Check frame-level constraints
  for (const constraint of filled.frame.constraints) {
    if (constraint.kind === 'mutual_exclusion') {
      const filled0 = constraint.elements.length > 0 && filled.filledElements.has(constraint.elements[0]);
      const filled1 = constraint.elements.length > 1 && filled.filledElements.has(constraint.elements[1]);
      if (filled0 && filled1) {
        issues.push({
          elementName: constraint.elements[0],
          kind: 'constraint_violated',
          description: constraint.description,
          severity: constraint.severity,
        });
      }
    }
  }

  return issues;
}


// =============================================================================
// FRAME-TO-CPL BRIDGE — mapping filled frames to CPL structures
// =============================================================================

/**
 * Result of mapping a filled frame to CPL fields.
 */
export interface FrameCPLFields {
  /** The primary CPL node type */
  readonly primaryNodeType: 'goal' | 'constraint' | 'preference' | 'scope' | 'selector';

  /** The goal variant (if applicable) */
  readonly goalVariant: 'axis-goal' | 'structural-goal' | 'production-goal' | null;

  /** Axis name (if applicable) */
  readonly axis: string | null;

  /** Direction (if applicable) */
  readonly direction: 'increase' | 'decrease' | 'set' | null;

  /** Implied levers */
  readonly levers: readonly string[];

  /** Scope reference (entity text) */
  readonly scopeRef: string | null;

  /** Additional template fields */
  readonly templateFields: Readonly<Record<string, string>>;

  /** Warnings from the mapping */
  readonly warnings: readonly string[];
}

/**
 * Map a filled frame to CPL fields.
 * This is the primary bridge between frame semantics and CPL-Intent.
 */
export function mapFrameToCPL(filled: FilledFrame): FrameCPLFields {
  const mapping = filled.frame.cplMapping;
  const warnings: string[] = [];

  // Determine axis from the evoking LU or filled elements
  let axis: string | null = filled.evokingLU.impliedAxis;
  const direction: 'increase' | 'decrease' | 'set' | null =
    filled.evokingLU.impliedDirection ??
    filled.frame.axisMapping?.defaultDirection ??
    null;
  const levers: string[] = [...filled.evokingLU.impliedLevers];

  // If axis was not implied by the LU, try to get it from the Axis element
  if (!axis) {
    const axisElem = filled.filledElements.get('Axis') ?? filled.filledElements.get('Attribute');
    if (axisElem) {
      axis = axisElem.fillerText;
    }
  }

  // Get scope reference
  let scopeRef: string | null = null;
  const entityElem = filled.filledElements.get('Entity')
    ?? filled.filledElements.get('PreservedEntity')
    ?? filled.filledElements.get('Content')
    ?? filled.filledElements.get('MovedEntity')
    ?? filled.filledElements.get('Original')
    ?? filled.filledElements.get('Parts')
    ?? filled.filledElements.get('WholeEntity')
    ?? filled.filledElements.get('CreatedEntity')
    ?? filled.filledElements.get('DestroyedEntity')
    ?? filled.filledElements.get('Sources');
  if (entityElem) {
    scopeRef = entityElem.fillerText;
  }

  // Also check explicit Scope element
  const scopeElem = filled.filledElements.get('Scope') ?? filled.filledElements.get('Location');
  if (scopeElem && !scopeRef) {
    scopeRef = scopeElem.fillerText;
  }

  // Warn if axis change frame has no axis
  if (filled.frame.family === 'axis_change' && !axis) {
    warnings.push(`Axis change frame "${filled.frame.id}" has no resolved axis`);
  }

  return {
    primaryNodeType: mapping.primaryNodeType,
    goalVariant: mapping.goalVariant,
    axis,
    direction,
    levers,
    scopeRef,
    templateFields: mapping.templateFields,
    warnings,
  };
}


// =============================================================================
// FRAME STATISTICS — summary of the frame database
// =============================================================================

/**
 * Compute statistics about the frame database.
 */
export function computeFrameStats(): {
  readonly totalFrames: number;
  readonly totalLexicalUnits: number;
  readonly uniqueLemmas: number;
  readonly framesByFamily: Readonly<Record<string, number>>;
  readonly avgElementsPerFrame: number;
  readonly avgLUsPerFrame: number;
  readonly polysemousLemmas: number;
} {
  let totalLUs = 0;
  let totalElements = 0;
  const familyCounts: Record<string, number> = {};
  let polysemous = 0;

  for (const frame of FRAME_REGISTRY.values()) {
    totalLUs += frame.lexicalUnits.length;
    totalElements += frame.elements.size;
    familyCounts[frame.family] = (familyCounts[frame.family] ?? 0) + 1;
  }

  for (const entries of LEXICAL_UNIT_INDEX.values()) {
    if (entries.length > 1) polysemous++;
  }

  const frameCount = FRAME_REGISTRY.size;
  return {
    totalFrames: frameCount,
    totalLexicalUnits: totalLUs,
    uniqueLemmas: LEXICAL_UNIT_INDEX.size,
    framesByFamily: familyCounts,
    avgElementsPerFrame: frameCount > 0 ? totalElements / frameCount : 0,
    avgLUsPerFrame: frameCount > 0 ? totalLUs / frameCount : 0,
    polysemousLemmas: polysemous,
  };
}

/**
 * Format frame database stats as a report string.
 */
export function formatFrameStatsReport(): string {
  const stats = computeFrameStats();
  const lines: string[] = [
    '=== Frame Semantics Database Stats ===',
    `Total frames: ${stats.totalFrames}`,
    `Total lexical units: ${stats.totalLexicalUnits}`,
    `Unique lemmas: ${stats.uniqueLemmas}`,
    `Polysemous lemmas: ${stats.polysemousLemmas}`,
    `Avg elements/frame: ${stats.avgElementsPerFrame.toFixed(1)}`,
    `Avg LUs/frame: ${stats.avgLUsPerFrame.toFixed(1)}`,
    '',
    'Frames by family:',
  ];
  for (const [family, count] of Object.entries(stats.framesByFamily)) {
    lines.push(`  ${family}: ${count}`);
  }
  return lines.join('\n');
}


// =============================================================================
// FRAME LOOKUP UTILITIES
// =============================================================================

/**
 * Get all frames in a given family.
 */
export function getFramesByFamily(family: FrameFamily): readonly FrameDef[] {
  const frames: FrameDef[] = [];
  for (const frame of FRAME_REGISTRY.values()) {
    if (frame.family === family) {
      frames.push(frame);
    }
  }
  return frames;
}

/**
 * Get the inheritance chain for a frame (self, parent, grandparent, ...).
 */
export function getFrameInheritanceChain(frameId: FrameId): readonly FrameDef[] {
  const chain: FrameDef[] = [];
  let current: FrameId | null = frameId;
  const visited = new Set<FrameId>();

  while (current && !visited.has(current)) {
    visited.add(current);
    const frame = FRAME_REGISTRY.get(current);
    if (frame) {
      chain.push(frame);
      current = frame.inheritsFrom;
    } else {
      break;
    }
  }

  return chain;
}

/**
 * Get all frame elements for a frame, including inherited elements.
 */
export function getAllFrameElements(frameId: FrameId): ReadonlyMap<string, FrameElementDef> {
  const chain = getFrameInheritanceChain(frameId);
  const allElements = new Map<string, FrameElementDef>();

  // Traverse from most general to most specific (reverse chain)
  for (let i = chain.length - 1; i >= 0; i--) {
    for (const [name, def] of chain[i].elements) {
      allElements.set(name, def);
    }
  }

  return allElements;
}

/**
 * Get all LUs across the whole frame database, optionally filtered by POS.
 */
export function getAllLexicalUnits(posFilter?: LexicalUnitPOS): readonly LexicalUnit[] {
  const allUnits: LexicalUnit[] = [];
  for (const frame of FRAME_REGISTRY.values()) {
    for (const unit of frame.lexicalUnits) {
      if (!posFilter || unit.pos === posFilter) {
        allUnits.push(unit);
      }
    }
  }
  return allUnits;
}

/**
 * Check whether two frames are antonyms.
 */
export function areAntonyms(frameA: FrameId, frameB: FrameId): boolean {
  const a = FRAME_REGISTRY.get(frameA);
  if (!a) return false;
  return a.relations.some(
    r => r.relationType === 'antonym_of' && r.targetFrameId === frameB,
  );
}

/**
 * Get all frames related to a given frame.
 */
export function getRelatedFrames(
  frameId: FrameId,
  relationType?: FrameRelationType,
): readonly { readonly frame: FrameDef; readonly relation: FrameRelation }[] {
  const sourceFrame = FRAME_REGISTRY.get(frameId);
  if (!sourceFrame) return [];

  const results: { readonly frame: FrameDef; readonly relation: FrameRelation }[] = [];
  for (const rel of sourceFrame.relations) {
    if (!relationType || rel.relationType === relationType) {
      const target = FRAME_REGISTRY.get(rel.targetFrameId);
      if (target) {
        results.push({ frame: target, relation: rel });
      }
    }
  }
  return results;
}
