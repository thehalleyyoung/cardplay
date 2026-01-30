/**
 * GOFAI NL Semantics — Selectional Restrictions
 *
 * Ensures that verbs are applied to appropriate argument types.
 * For example, "widen" should only modify width-like targets, not
 * arbitrary nouns. "Brighten" modifies brightness-related targets.
 * "Transpose" applies to note-bearing entities, not effects.
 *
 * ## Design
 *
 * Selectional restrictions are modeled as constraints on verb–argument
 * pairs. Each verb frame declares what entity types and semantic
 * categories its arguments can have. This module:
 *
 * 1. **Defines restriction types** — axis compatibility, entity type
 *    constraints, semantic feature requirements.
 *
 * 2. **Validates filled roles** — given a verb frame and a filled
 *    argument, check whether the argument satisfies the verb's
 *    selectional restrictions.
 *
 * 3. **Produces diagnostics** — when a restriction is violated, produce
 *    a structured error explaining why the argument doesn't fit.
 *
 * 4. **Ranks candidates** — when multiple parse candidates exist,
 *    selectional restrictions help prune impossible interpretations
 *    and rank the remaining ones.
 *
 * ## Selectional Feature Hierarchy
 *
 * Musical entities have selectional features organized hierarchically:
 *
 * ```
 * [+audible]
 *   [+pitched]
 *     [+melodic]    — melody, lead, vocal, countermelody
 *     [+harmonic]   — chord, voicing, harmony_part
 *   [−pitched]
 *     [+rhythmic]   — drum_part, percussion, groove
 *     [+timbral]    — texture, fx_layer, effect
 *   [+spatial]      — panning, stereo, width
 *   [+temporal]     — tempo, duration, bar, beat
 *   [+dynamic]      — volume, loudness, velocity
 * [+structural]
 *   [+sectional]    — section, verse, chorus
 *   [+layered]      — track, layer
 *   [+sequential]   — phrase, motif, passage
 * [+parametric]
 *   [+scalar]       — any numeric parameter
 *   [+categorical]  — key, mode, time signature
 * ```
 *
 * @module gofai/nl/semantics/selectional-restrictions
 * @see gofai_goalA.md Step 131
 */

// =============================================================================
// SELECTIONAL FEATURES — the feature system for argument compatibility
// =============================================================================

/**
 * A selectional feature: a boolean property of an entity that determines
 * what operations can apply to it.
 */
export type SelectionalFeature =
  // Audibility features
  | 'audible'
  | 'pitched'
  | 'melodic'
  | 'harmonic'
  | 'rhythmic'
  | 'timbral'
  | 'spatial'
  | 'temporal'
  | 'dynamic'
  // Structural features
  | 'structural'
  | 'sectional'
  | 'layered'
  | 'sequential'
  // Parametric features
  | 'parametric'
  | 'scalar'
  | 'categorical'
  // Special features
  | 'notated'       // Has note events (can be transposed, quantized)
  | 'loopable'      // Can be looped
  | 'automatable'   // Has automatable parameters
  | 'mixable'       // Participates in mix (has volume, pan)
  | 'editable'      // Can be directly edited
  | 'deletable'     // Can be removed
  | 'duplicable'    // Can be duplicated
  | 'reorderable';  // Can be moved/reordered

/**
 * A feature bundle: a set of features that an entity possesses.
 */
export interface FeatureBundle {
  /** Features that are present (value = true) */
  readonly positive: ReadonlySet<SelectionalFeature>;

  /** Features that are absent (value = false) */
  readonly negative: ReadonlySet<SelectionalFeature>;
}

/**
 * Create a feature bundle from positive and optional negative features.
 */
export function createFeatureBundle(
  positive: readonly SelectionalFeature[],
  negative: readonly SelectionalFeature[] = [],
): FeatureBundle {
  return {
    positive: new Set(positive),
    negative: new Set(negative),
  };
}

// =============================================================================
// ENTITY FEATURE PROFILES — default features for entity types
// =============================================================================

/**
 * Entity type identifiers (matches the grammar's entity restriction types).
 */
export type RestrictionEntityType =
  | 'section'
  | 'layer'
  | 'card'
  | 'note'
  | 'range'
  | 'track'
  | 'parameter'
  | 'musical_object'
  | 'effect'
  | 'instrument'
  | 'axis'
  | 'value'
  | 'role'
  | 'deck'
  | 'board';

/**
 * A feature profile for an entity type: what selectional features it has.
 */
export interface EntityFeatureProfile {
  /** The entity type */
  readonly entityType: RestrictionEntityType;

  /** The feature bundle */
  readonly features: FeatureBundle;

  /** Human-readable description */
  readonly description: string;
}

/**
 * Default feature profiles for all entity types.
 */
export const ENTITY_FEATURE_PROFILES: ReadonlyMap<RestrictionEntityType, EntityFeatureProfile> = new Map([
  ['section', {
    entityType: 'section',
    features: createFeatureBundle(
      ['structural', 'sectional', 'editable', 'deletable', 'duplicable', 'reorderable'],
      ['pitched', 'parametric'],
    ),
    description: 'A song section (verse, chorus, bridge)',
  }],
  ['layer', {
    entityType: 'layer',
    features: createFeatureBundle(
      ['audible', 'structural', 'layered', 'editable', 'deletable', 'duplicable', 'mixable', 'automatable'],
      ['sectional'],
    ),
    description: 'A track/layer in the arrangement',
  }],
  ['card', {
    entityType: 'card',
    features: createFeatureBundle(
      ['parametric', 'editable', 'deletable', 'duplicable', 'automatable'],
      ['pitched', 'structural'],
    ),
    description: 'A DSP processing card',
  }],
  ['note', {
    entityType: 'note',
    features: createFeatureBundle(
      ['audible', 'pitched', 'notated', 'temporal', 'dynamic', 'editable', 'deletable', 'duplicable'],
      ['structural', 'parametric'],
    ),
    description: 'A note event',
  }],
  ['range', {
    entityType: 'range',
    features: createFeatureBundle(
      ['temporal', 'structural', 'sequential'],
      ['audible', 'parametric'],
    ),
    description: 'A time range (bar range, selection)',
  }],
  ['track', {
    entityType: 'track',
    features: createFeatureBundle(
      ['audible', 'structural', 'layered', 'editable', 'deletable', 'duplicable', 'mixable', 'automatable'],
      ['sectional'],
    ),
    description: 'A track container',
  }],
  ['parameter', {
    entityType: 'parameter',
    features: createFeatureBundle(
      ['parametric', 'scalar', 'automatable', 'editable'],
      ['structural', 'audible'],
    ),
    description: 'A card or track parameter',
  }],
  ['musical_object', {
    entityType: 'musical_object',
    features: createFeatureBundle(
      ['audible', 'pitched', 'notated', 'sequential', 'editable', 'duplicable'],
      ['structural', 'parametric'],
    ),
    description: 'An abstract musical object (motif, chord, phrase)',
  }],
  ['effect', {
    entityType: 'effect',
    features: createFeatureBundle(
      ['timbral', 'parametric', 'editable', 'deletable', 'duplicable', 'automatable'],
      ['pitched', 'structural'],
    ),
    description: 'An audio effect',
  }],
  ['instrument', {
    entityType: 'instrument',
    features: createFeatureBundle(
      ['audible', 'pitched', 'timbral', 'editable'],
      ['structural'],
    ),
    description: 'A musical instrument',
  }],
  ['axis', {
    entityType: 'axis',
    features: createFeatureBundle(
      ['parametric', 'scalar'],
      ['structural', 'audible'],
    ),
    description: 'A perceptual axis (brightness, warmth)',
  }],
  ['value', {
    entityType: 'value',
    features: createFeatureBundle(
      ['parametric', 'scalar'],
      ['structural', 'audible'],
    ),
    description: 'A numeric or categorical value',
  }],
  ['role', {
    entityType: 'role',
    features: createFeatureBundle(
      ['audible'],
      ['parametric'],
    ),
    description: 'A musical role (melody, bass, accompaniment)',
  }],
  ['deck', {
    entityType: 'deck',
    features: createFeatureBundle(
      ['structural', 'editable', 'deletable', 'duplicable'],
      ['audible', 'parametric'],
    ),
    description: 'A deck (collection of cards)',
  }],
  ['board', {
    entityType: 'board',
    features: createFeatureBundle(
      ['structural', 'editable', 'deletable', 'duplicable'],
      ['audible', 'parametric'],
    ),
    description: 'A board (composition workspace)',
  }],
]);

// =============================================================================
// VERB SELECTIONAL REQUIREMENTS — what features verbs expect of arguments
// =============================================================================

/**
 * A selectional requirement for a verb argument.
 * Specifies what features the filler must have (or must not have).
 */
export interface SelectionalRequirement {
  /** Required positive features (all must be present) */
  readonly required: readonly SelectionalFeature[];

  /** Forbidden features (none may be present) */
  readonly forbidden: readonly SelectionalFeature[];

  /** Preferred features (boost ranking if present, but not required) */
  readonly preferred: readonly SelectionalFeature[];

  /** Human-readable description of the requirement */
  readonly description: string;
}

/**
 * Create a selectional requirement.
 */
export function createRequirement(
  required: readonly SelectionalFeature[],
  forbidden: readonly SelectionalFeature[] = [],
  preferred: readonly SelectionalFeature[] = [],
  description: string = '',
): SelectionalRequirement {
  return { required, forbidden, preferred, description };
}

/**
 * Verb-specific selectional restriction profiles.
 * Maps verb categories to the requirements on their patient role.
 */
export interface VerbRestrictionProfile {
  /** The verb or verb class */
  readonly verb: string;

  /** Requirements per role */
  readonly roleRequirements: ReadonlyMap<string, SelectionalRequirement>;

  /** Whether the verb can take an untyped "it" argument (pronoun) */
  readonly allowsProForm: boolean;

  /** Default entity type if argument is ambiguous */
  readonly defaultEntityType: RestrictionEntityType | null;
}

/**
 * Built-in verb restriction profiles for core verbs.
 */
export const VERB_RESTRICTION_PROFILES: ReadonlyMap<string, VerbRestrictionProfile> = new Map([
  // ── Transformation verbs ─────────────────────────────────────────────
  ['brighten', {
    verb: 'brighten',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['audible'], [], ['timbral'],
        '"brighten" targets audible elements (modifies brightness axis)',
      )],
    ]),
    allowsProForm: true,
    defaultEntityType: 'layer',
  }],
  ['darken', {
    verb: 'darken',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['audible'], [], ['timbral'],
        '"darken" targets audible elements (modifies brightness axis, decrease)',
      )],
    ]),
    allowsProForm: true,
    defaultEntityType: 'layer',
  }],
  ['widen', {
    verb: 'widen',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['audible', 'mixable'], [], ['spatial'],
        '"widen" targets mixable elements (modifies stereo width)',
      )],
    ]),
    allowsProForm: true,
    defaultEntityType: 'layer',
  }],
  ['narrow', {
    verb: 'narrow',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['audible', 'mixable'], [], ['spatial'],
        '"narrow" targets mixable elements (modifies stereo width, decrease)',
      )],
    ]),
    allowsProForm: true,
    defaultEntityType: 'layer',
  }],
  ['transpose', {
    verb: 'transpose',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['notated'], ['rhythmic'],
        ['melodic', 'harmonic'],
        '"transpose" requires note-bearing entities (not effects or rhythmic elements)',
      )],
      ['degree', createRequirement(
        ['scalar'], [],
        [],
        'Transposition amount must be a scalar value (semitones, interval)',
      )],
    ]),
    allowsProForm: true,
    defaultEntityType: 'musical_object',
  }],
  ['quantize', {
    verb: 'quantize',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['notated', 'temporal'], [],
        ['rhythmic'],
        '"quantize" requires note-bearing, temporal entities',
      )],
    ]),
    allowsProForm: true,
    defaultEntityType: 'note',
  }],
  ['compress', {
    verb: 'compress',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['audible', 'dynamic'], [],
        ['mixable'],
        '"compress" targets audible elements with dynamics',
      )],
    ]),
    allowsProForm: true,
    defaultEntityType: 'layer',
  }],
  ['saturate', {
    verb: 'saturate',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['audible'], [],
        ['timbral'],
        '"saturate" targets audible elements (adds harmonic distortion)',
      )],
    ]),
    allowsProForm: true,
    defaultEntityType: 'layer',
  }],
  ['loop', {
    verb: 'loop',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['loopable'], [],
        ['sequential', 'temporal'],
        '"loop" requires loopable content (sections, ranges, phrases)',
      )],
    ]),
    allowsProForm: true,
    defaultEntityType: 'range',
  }],
  ['automate', {
    verb: 'automate',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['automatable'], [],
        ['parametric'],
        '"automate" requires elements with automatable parameters',
      )],
    ]),
    allowsProForm: true,
    defaultEntityType: 'parameter',
  }],

  // ── Creation verbs ───────────────────────────────────────────────────
  ['add', {
    verb: 'add',
    roleRequirements: new Map([
      ['theme', createRequirement(
        ['editable'], [],
        [],
        '"add" can introduce any editable element',
      )],
      ['location', createRequirement(
        ['structural'], [],
        ['sectional', 'layered'],
        'Location for "add" should be a structural element',
      )],
    ]),
    allowsProForm: false,
    defaultEntityType: null,
  }],
  ['create', {
    verb: 'create',
    roleRequirements: new Map([
      ['theme', createRequirement(
        ['editable'], [],
        [],
        '"create" can produce any editable element',
      )],
    ]),
    allowsProForm: false,
    defaultEntityType: null,
  }],
  ['insert', {
    verb: 'insert',
    roleRequirements: new Map([
      ['theme', createRequirement(
        ['editable'], [],
        [],
        '"insert" can introduce any editable element',
      )],
      ['location', createRequirement(
        ['temporal'], [],
        ['sequential'],
        'Location for "insert" should be a temporal position',
      )],
    ]),
    allowsProForm: false,
    defaultEntityType: null,
  }],

  // ── Destruction verbs ────────────────────────────────────────────────
  ['remove', {
    verb: 'remove',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['deletable'], [],
        [],
        '"remove" requires a deletable element',
      )],
    ]),
    allowsProForm: true,
    defaultEntityType: null,
  }],
  ['delete', {
    verb: 'delete',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['deletable'], [],
        [],
        '"delete" requires a deletable element',
      )],
    ]),
    allowsProForm: true,
    defaultEntityType: null,
  }],
  ['clear', {
    verb: 'clear',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['editable'], [],
        ['structural', 'layered'],
        '"clear" removes content from an editable container',
      )],
    ]),
    allowsProForm: true,
    defaultEntityType: 'layer',
  }],
  ['strip', {
    verb: 'strip',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['editable'], [],
        [],
        '"strip" removes properties or effects from an element',
      )],
    ]),
    allowsProForm: true,
    defaultEntityType: null,
  }],

  // ── Movement verbs ──────────────────────────────────────────────────
  ['move', {
    verb: 'move',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['reorderable'], [],
        [],
        '"move" requires a reorderable element',
      )],
      ['goal', createRequirement(
        ['structural'], [],
        ['temporal', 'sectional'],
        'Destination for "move" should be a structural position',
      )],
    ]),
    allowsProForm: true,
    defaultEntityType: null,
  }],
  ['swap', {
    verb: 'swap',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['reorderable'], [],
        [],
        '"swap" requires reorderable elements',
      )],
      ['goal', createRequirement(
        ['reorderable'], [],
        [],
        '"swap" target must also be reorderable',
      )],
    ]),
    allowsProForm: false,
    defaultEntityType: null,
  }],
  ['shift', {
    verb: 'shift',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['temporal'], [],
        ['notated', 'sequential'],
        '"shift" moves elements in time',
      )],
      ['degree', createRequirement(
        ['scalar'], [],
        [],
        'Shift amount must be a scalar value',
      )],
    ]),
    allowsProForm: true,
    defaultEntityType: 'note',
  }],

  // ── Duplication verbs ───────────────────────────────────────────────
  ['copy', {
    verb: 'copy',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['duplicable'], [],
        [],
        '"copy" requires a duplicable element',
      )],
    ]),
    allowsProForm: true,
    defaultEntityType: null,
  }],
  ['duplicate', {
    verb: 'duplicate',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['duplicable'], [],
        [],
        '"duplicate" requires a duplicable element',
      )],
    ]),
    allowsProForm: true,
    defaultEntityType: null,
  }],
  ['repeat', {
    verb: 'repeat',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['duplicable', 'sequential'], [],
        ['temporal'],
        '"repeat" targets sequential, duplicable content',
      )],
    ]),
    allowsProForm: true,
    defaultEntityType: 'section',
  }],

  // ── Preservation verbs ──────────────────────────────────────────────
  ['keep', {
    verb: 'keep',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['editable'], [],
        [],
        '"keep" can preserve any editable element or property',
      )],
    ]),
    allowsProForm: true,
    defaultEntityType: null,
  }],

  // ── Combination verbs ───────────────────────────────────────────────
  ['merge', {
    verb: 'merge',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['editable'], [],
        ['layered', 'sequential'],
        '"merge" combines editable elements',
      )],
    ]),
    allowsProForm: false,
    defaultEntityType: 'layer',
  }],
  ['blend', {
    verb: 'blend',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['audible', 'mixable'], [],
        [],
        '"blend" requires audible, mixable elements',
      )],
    ]),
    allowsProForm: false,
    defaultEntityType: 'layer',
  }],

  // ── Separation verbs ────────────────────────────────────────────────
  ['split', {
    verb: 'split',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['editable'], [],
        ['structural', 'sequential'],
        '"split" divides an editable element',
      )],
    ]),
    allowsProForm: true,
    defaultEntityType: 'section',
  }],
  ['isolate', {
    verb: 'isolate',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['audible'], [],
        ['mixable'],
        '"isolate" targets audible elements for solo/mute',
      )],
    ]),
    allowsProForm: true,
    defaultEntityType: 'layer',
  }],

  // ── "Make" pattern verbs ────────────────────────────────────────────
  ['make', {
    verb: 'make',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['editable'], [],
        [],
        '"make" can modify any editable element',
      )],
      ['result', createRequirement(
        [], [],
        [],
        'Result complement can be any adjective/state',
      )],
    ]),
    allowsProForm: true,
    defaultEntityType: null,
  }],
  ['set', {
    verb: 'set',
    roleRequirements: new Map([
      ['patient', createRequirement(
        ['parametric'], [],
        ['scalar'],
        '"set" targets parametric elements (parameters, values)',
      )],
    ]),
    allowsProForm: true,
    defaultEntityType: 'parameter',
  }],
]);

// =============================================================================
// AXIS SELECTIONAL CONSTRAINTS — which axes apply to which entities
// =============================================================================

/**
 * Axis compatibility entry: which entity features an axis requires.
 */
export interface AxisCompatibility {
  /** The axis name (e.g., "brightness", "width") */
  readonly axisName: string;

  /** Required features on the target entity */
  readonly requiredFeatures: readonly SelectionalFeature[];

  /** Preferred entity types (when multiple candidates exist) */
  readonly preferredEntityTypes: readonly RestrictionEntityType[];

  /** Axes that are incompatible (e.g., "pitch" is incompatible with rhythmic-only) */
  readonly incompatibleWith: readonly string[];

  /** Human-readable description */
  readonly description: string;
}

/**
 * Axis compatibility database for perceptual axes.
 */
export const AXIS_COMPATIBILITY: ReadonlyMap<string, AxisCompatibility> = new Map([
  ['brightness', {
    axisName: 'brightness',
    requiredFeatures: ['audible'],
    preferredEntityTypes: ['layer', 'card', 'effect'],
    incompatibleWith: [],
    description: 'Brightness applies to any audible element (spectral balance)',
  }],
  ['warmth', {
    axisName: 'warmth',
    requiredFeatures: ['audible'],
    preferredEntityTypes: ['layer', 'card', 'effect'],
    incompatibleWith: [],
    description: 'Warmth applies to any audible element (spectral character)',
  }],
  ['width', {
    axisName: 'width',
    requiredFeatures: ['audible', 'mixable'],
    preferredEntityTypes: ['layer', 'track'],
    incompatibleWith: [],
    description: 'Width requires mixable elements with stereo processing',
  }],
  ['depth', {
    axisName: 'depth',
    requiredFeatures: ['audible', 'mixable'],
    preferredEntityTypes: ['layer', 'track'],
    incompatibleWith: [],
    description: 'Depth requires mixable elements (reverb/spatial)',
  }],
  ['energy', {
    axisName: 'energy',
    requiredFeatures: ['audible'],
    preferredEntityTypes: ['section', 'layer'],
    incompatibleWith: [],
    description: 'Energy is a high-level perceptual axis for any audible content',
  }],
  ['tension', {
    axisName: 'tension',
    requiredFeatures: ['audible'],
    preferredEntityTypes: ['section', 'musical_object'],
    incompatibleWith: [],
    description: 'Tension is a harmonic/melodic axis for pitched content',
  }],
  ['groove_tightness', {
    axisName: 'groove_tightness',
    requiredFeatures: ['rhythmic'],
    preferredEntityTypes: ['layer', 'note'],
    incompatibleWith: ['pitched'],
    description: 'Groove tightness applies to rhythmic elements',
  }],
  ['loudness', {
    axisName: 'loudness',
    requiredFeatures: ['audible', 'dynamic'],
    preferredEntityTypes: ['layer', 'track', 'section'],
    incompatibleWith: [],
    description: 'Loudness requires audible elements with dynamics',
  }],
  ['density', {
    axisName: 'density',
    requiredFeatures: ['audible'],
    preferredEntityTypes: ['section', 'layer'],
    incompatibleWith: [],
    description: 'Density is a textural axis for arrangement complexity',
  }],
  ['intimacy', {
    axisName: 'intimacy',
    requiredFeatures: ['audible', 'mixable'],
    preferredEntityTypes: ['layer', 'track'],
    incompatibleWith: [],
    description: 'Intimacy is a spatial/proximity axis',
  }],
  ['complexity', {
    axisName: 'complexity',
    requiredFeatures: ['audible'],
    preferredEntityTypes: ['section', 'layer', 'musical_object'],
    incompatibleWith: [],
    description: 'Complexity measures arrangement/harmonic intricacy',
  }],
  ['tempo', {
    axisName: 'tempo',
    requiredFeatures: ['temporal'],
    preferredEntityTypes: ['section', 'range'],
    incompatibleWith: [],
    description: 'Tempo is a temporal axis (BPM)',
  }],
  ['pitch', {
    axisName: 'pitch',
    requiredFeatures: ['pitched'],
    preferredEntityTypes: ['note', 'musical_object'],
    incompatibleWith: ['rhythmic'],
    description: 'Pitch requires pitched content',
  }],
  ['register', {
    axisName: 'register',
    requiredFeatures: ['pitched'],
    preferredEntityTypes: ['layer', 'musical_object'],
    incompatibleWith: [],
    description: 'Register is the high/low frequency range of pitched content',
  }],
  ['sustain', {
    axisName: 'sustain',
    requiredFeatures: ['audible', 'dynamic'],
    preferredEntityTypes: ['note', 'layer', 'effect'],
    incompatibleWith: [],
    description: 'Sustain relates to the temporal envelope of audible content',
  }],
  ['attack', {
    axisName: 'attack',
    requiredFeatures: ['audible', 'dynamic'],
    preferredEntityTypes: ['note', 'layer', 'effect'],
    incompatibleWith: [],
    description: 'Attack is the onset speed of audible content',
  }],
  ['punch', {
    axisName: 'punch',
    requiredFeatures: ['audible', 'dynamic'],
    preferredEntityTypes: ['layer', 'note'],
    incompatibleWith: [],
    description: 'Punch is the perceived impact/transient strength',
  }],
  ['clarity', {
    axisName: 'clarity',
    requiredFeatures: ['audible'],
    preferredEntityTypes: ['layer', 'track', 'section'],
    incompatibleWith: [],
    description: 'Clarity is the intelligibility/separation axis',
  }],
  ['saturation', {
    axisName: 'saturation',
    requiredFeatures: ['audible'],
    preferredEntityTypes: ['layer', 'effect'],
    incompatibleWith: [],
    description: 'Saturation is the harmonic distortion/overdrive axis',
  }],
  ['lift', {
    axisName: 'lift',
    requiredFeatures: ['audible'],
    preferredEntityTypes: ['section', 'layer'],
    incompatibleWith: [],
    description: 'Lift is a composite perceptual axis (energy + brightness)',
  }],
]);

// =============================================================================
// RESTRICTION VALIDATION — checking whether arguments satisfy restrictions
// =============================================================================

/**
 * Result of validating a selectional restriction.
 */
export interface RestrictionValidation {
  /** Whether the restriction is satisfied */
  readonly satisfied: boolean;

  /** The verb being validated */
  readonly verb: string;

  /** The role being validated */
  readonly role: string;

  /** The entity type of the argument */
  readonly entityType: RestrictionEntityType;

  /** Violations found (empty if satisfied) */
  readonly violations: readonly RestrictionViolation[];

  /** How well the argument fits (0 = no fit, 1 = perfect fit) */
  readonly fitScore: number;

  /** Features that matched */
  readonly matchedFeatures: readonly SelectionalFeature[];

  /** Features that are preferred and matched */
  readonly matchedPreferred: readonly SelectionalFeature[];
}

/**
 * A selectional restriction violation.
 */
export interface RestrictionViolation {
  /** What kind of violation */
  readonly type: ViolationType;

  /** The feature involved */
  readonly feature: SelectionalFeature;

  /** Human-readable explanation */
  readonly explanation: string;

  /** Severity */
  readonly severity: 'error' | 'warning';
}

export type ViolationType =
  | 'missing_required'   // Entity lacks a required feature
  | 'has_forbidden'      // Entity has a forbidden feature
  | 'type_mismatch';     // Entity type not in allowed set

/**
 * Validate an argument against a verb's selectional restrictions.
 */
export function validateRestriction(
  verb: string,
  role: string,
  entityType: RestrictionEntityType,
): RestrictionValidation {
  const profile = VERB_RESTRICTION_PROFILES.get(verb);
  if (!profile) {
    // Unknown verb — no restrictions, assume valid
    return {
      satisfied: true,
      verb,
      role,
      entityType,
      violations: [],
      fitScore: 0.5, // Neutral
      matchedFeatures: [],
      matchedPreferred: [],
    };
  }

  const requirement = profile.roleRequirements.get(role);
  if (!requirement) {
    // No requirements for this role — valid
    return {
      satisfied: true,
      verb,
      role,
      entityType,
      violations: [],
      fitScore: 0.5,
      matchedFeatures: [],
      matchedPreferred: [],
    };
  }

  const entityProfile = ENTITY_FEATURE_PROFILES.get(entityType);
  if (!entityProfile) {
    // Unknown entity type
    return {
      satisfied: false,
      verb,
      role,
      entityType,
      violations: [{
        type: 'type_mismatch',
        feature: 'editable',
        explanation: `Unknown entity type: "${entityType}"`,
        severity: 'error',
      }],
      fitScore: 0,
      matchedFeatures: [],
      matchedPreferred: [],
    };
  }

  return validateFeatures(verb, role, entityType, entityProfile.features, requirement);
}

/**
 * Validate a feature bundle against a selectional requirement.
 */
function validateFeatures(
  verb: string,
  role: string,
  entityType: RestrictionEntityType,
  features: FeatureBundle,
  requirement: SelectionalRequirement,
): RestrictionValidation {
  const violations: RestrictionViolation[] = [];
  const matchedFeatures: SelectionalFeature[] = [];
  const matchedPreferred: SelectionalFeature[] = [];

  // Check required features
  for (const required of requirement.required) {
    if (features.positive.has(required)) {
      matchedFeatures.push(required);
    } else if (!features.negative.has(required)) {
      // Feature is not explicitly present or absent — might be inherited
      // For now, treat as missing (conservative)
      violations.push({
        type: 'missing_required',
        feature: required,
        explanation: `"${verb}" requires [+${required}] on the ${role}, but ${entityType} lacks it`,
        severity: 'error',
      });
    } else {
      // Feature is explicitly absent
      violations.push({
        type: 'missing_required',
        feature: required,
        explanation: `"${verb}" requires [+${required}] on the ${role}, but ${entityType} is [−${required}]`,
        severity: 'error',
      });
    }
  }

  // Check forbidden features
  for (const forbidden of requirement.forbidden) {
    if (features.positive.has(forbidden)) {
      violations.push({
        type: 'has_forbidden',
        feature: forbidden,
        explanation: `"${verb}" forbids [+${forbidden}] on the ${role}, but ${entityType} is [+${forbidden}]`,
        severity: 'error',
      });
    }
  }

  // Check preferred features
  for (const preferred of requirement.preferred) {
    if (features.positive.has(preferred)) {
      matchedPreferred.push(preferred);
    }
  }

  // Compute fit score
  const requiredTotal = requirement.required.length;
  const requiredMatched = matchedFeatures.length;
  const preferredTotal = requirement.preferred.length;
  const preferredMatched = matchedPreferred.length;

  let fitScore: number;
  if (violations.length > 0) {
    // Has violations — base score is low, but differentiate by severity
    const errorViolations = violations.filter(v => v.severity === 'error').length;
    fitScore = Math.max(0, 0.3 - errorViolations * 0.1);
  } else {
    // No violations — base 0.5, plus bonuses for required/preferred matches
    fitScore = 0.5;
    if (requiredTotal > 0) {
      fitScore += 0.3 * (requiredMatched / requiredTotal);
    } else {
      fitScore += 0.3; // No requirements = full required credit
    }
    if (preferredTotal > 0) {
      fitScore += 0.2 * (preferredMatched / preferredTotal);
    }
  }

  return {
    satisfied: violations.filter(v => v.severity === 'error').length === 0,
    verb,
    role,
    entityType,
    violations,
    fitScore: Math.min(1, Math.max(0, fitScore)),
    matchedFeatures,
    matchedPreferred,
  };
}

// =============================================================================
// AXIS COMPATIBILITY VALIDATION
// =============================================================================

/**
 * Result of validating axis compatibility with an entity.
 */
export interface AxisCompatibilityResult {
  /** Whether the axis is compatible with the entity */
  readonly compatible: boolean;

  /** The axis name */
  readonly axisName: string;

  /** The entity type */
  readonly entityType: RestrictionEntityType;

  /** How well the entity fits the axis (0–1) */
  readonly fitScore: number;

  /** Missing required features */
  readonly missingFeatures: readonly SelectionalFeature[];

  /** Whether this entity is a preferred type for this axis */
  readonly isPreferred: boolean;

  /** Human-readable explanation */
  readonly explanation: string;
}

/**
 * Validate whether an axis can be applied to an entity type.
 */
export function validateAxisCompatibility(
  axisName: string,
  entityType: RestrictionEntityType,
): AxisCompatibilityResult {
  const axisEntry = AXIS_COMPATIBILITY.get(axisName);
  if (!axisEntry) {
    return {
      compatible: true, // Unknown axis — allow it
      axisName,
      entityType,
      fitScore: 0.5,
      missingFeatures: [],
      isPreferred: false,
      explanation: `Unknown axis "${axisName}" — no restrictions`,
    };
  }

  const entityProfile = ENTITY_FEATURE_PROFILES.get(entityType);
  if (!entityProfile) {
    return {
      compatible: false,
      axisName,
      entityType,
      fitScore: 0,
      missingFeatures: [...axisEntry.requiredFeatures],
      isPreferred: false,
      explanation: `Unknown entity type "${entityType}"`,
    };
  }

  const features = entityProfile.features;
  const missingFeatures: SelectionalFeature[] = [];

  for (const required of axisEntry.requiredFeatures) {
    if (!features.positive.has(required)) {
      missingFeatures.push(required);
    }
  }

  const isPreferred = axisEntry.preferredEntityTypes.includes(entityType);
  const compatible = missingFeatures.length === 0;

  let fitScore: number;
  if (!compatible) {
    fitScore = Math.max(0, 0.3 - missingFeatures.length * 0.1);
  } else if (isPreferred) {
    fitScore = 1.0;
  } else {
    fitScore = 0.7;
  }

  const explanation = compatible
    ? isPreferred
      ? `"${axisName}" is a natural fit for ${entityType}`
      : `"${axisName}" is compatible with ${entityType}`
    : `"${axisName}" requires [+${missingFeatures.join(', +')}] but ${entityType} lacks ${missingFeatures.length === 1 ? 'it' : 'them'}`;

  return {
    compatible,
    axisName,
    entityType,
    fitScore,
    missingFeatures,
    isPreferred,
    explanation,
  };
}

// =============================================================================
// CANDIDATE RANKING — pruning and ranking parse candidates
// =============================================================================

/**
 * A parse candidate with an entity type assignment for an argument.
 */
export interface ArgumentCandidate {
  /** The candidate entity type */
  readonly entityType: RestrictionEntityType;

  /** The surface text of the argument */
  readonly surface: string;

  /** Confidence from the parser (0–1) */
  readonly parseConfidence: number;
}

/**
 * A ranked parse candidate after selectional restriction filtering.
 */
export interface RankedCandidate {
  /** The original candidate */
  readonly candidate: ArgumentCandidate;

  /** Selectional restriction validation */
  readonly validation: RestrictionValidation;

  /** Combined score (parse confidence × fit score) */
  readonly combinedScore: number;

  /** Whether this candidate was pruned (violates hard restrictions) */
  readonly pruned: boolean;

  /** Reason for pruning (if pruned) */
  readonly pruneReason: string | null;
}

/**
 * Rank a set of argument candidates using selectional restrictions.
 * Returns candidates sorted by combined score, with pruned candidates at the end.
 */
export function rankCandidates(
  verb: string,
  role: string,
  candidates: readonly ArgumentCandidate[],
): readonly RankedCandidate[] {
  const ranked: RankedCandidate[] = candidates.map(candidate => {
    const validation = validateRestriction(verb, role, candidate.entityType);
    const combinedScore = candidate.parseConfidence * validation.fitScore;

    const pruned = !validation.satisfied;
    const pruneReason = pruned
      ? validation.violations
          .filter(v => v.severity === 'error')
          .map(v => v.explanation)
          .join('; ')
      : null;

    return {
      candidate,
      validation,
      combinedScore,
      pruned,
      pruneReason,
    };
  });

  // Sort: non-pruned first by score, then pruned by score
  ranked.sort((a, b) => {
    if (a.pruned !== b.pruned) return a.pruned ? 1 : -1;
    return b.combinedScore - a.combinedScore;
  });

  return ranked;
}

/**
 * Get only the viable (non-pruned) candidates.
 */
export function viableCandidates(ranked: readonly RankedCandidate[]): readonly RankedCandidate[] {
  return ranked.filter(r => !r.pruned);
}

/**
 * Get the best candidate (highest combined score, non-pruned).
 * Returns null if all candidates are pruned.
 */
export function bestCandidate(ranked: readonly RankedCandidate[]): RankedCandidate | null {
  const viable = viableCandidates(ranked);
  return viable.length > 0 ? viable[0]! : null;
}

// =============================================================================
// DIAGNOSTICS — human-readable restriction violation reports
// =============================================================================

/**
 * Format a restriction validation as a human-readable diagnostic.
 */
export function formatRestrictionDiagnostic(validation: RestrictionValidation): string {
  const lines: string[] = [];

  if (validation.satisfied) {
    lines.push(`✓ "${validation.verb}" + ${validation.entityType} (${validation.role}): OK (fit: ${(validation.fitScore * 100).toFixed(0)}%)`);
    if (validation.matchedPreferred.length > 0) {
      lines.push(`  Preferred features matched: ${validation.matchedPreferred.join(', ')}`);
    }
  } else {
    lines.push(`✗ "${validation.verb}" + ${validation.entityType} (${validation.role}): VIOLATION`);
    for (const v of validation.violations) {
      const marker = v.severity === 'error' ? '✗' : '⚠';
      lines.push(`  ${marker} ${v.explanation}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format an axis compatibility result as a diagnostic.
 */
export function formatAxisDiagnostic(result: AxisCompatibilityResult): string {
  const status = result.compatible
    ? result.isPreferred ? '✓✓' : '✓'
    : '✗';
  return `${status} ${result.axisName} + ${result.entityType}: ${result.explanation} (fit: ${(result.fitScore * 100).toFixed(0)}%)`;
}

/**
 * Format ranked candidates as a diagnostic.
 */
export function formatCandidateRanking(
  verb: string,
  role: string,
  ranked: readonly RankedCandidate[],
): string {
  const lines: string[] = [];
  lines.push(`Candidates for "${verb}" ${role}:`);

  for (let i = 0; i < ranked.length; i++) {
    const r = ranked[i]!;
    const status = r.pruned ? 'PRUNED' : `#${i + 1}`;
    const score = (r.combinedScore * 100).toFixed(0);
    lines.push(`  [${status}] ${r.candidate.entityType} "${r.candidate.surface}" — score: ${score}%`);
    if (r.pruned && r.pruneReason) {
      lines.push(`    Reason: ${r.pruneReason}`);
    }
  }

  return lines.join('\n');
}

// =============================================================================
// FEATURE INFERENCE — inferring features from context
// =============================================================================

/**
 * Infer additional features for an entity based on context.
 * For example, if a layer is known to contain drum patterns, it gains [+rhythmic].
 */
export interface ContextualFeatures {
  /** The entity type */
  readonly entityType: RestrictionEntityType;

  /** Additional features inferred from context */
  readonly inferredFeatures: readonly SelectionalFeature[];

  /** Why each feature was inferred */
  readonly reasons: ReadonlyMap<SelectionalFeature, string>;
}

/**
 * Feature inference rules based on entity names/labels.
 */
export const NAME_FEATURE_INFERENCES: ReadonlyMap<string, readonly SelectionalFeature[]> = new Map([
  // Melodic/harmonic instruments
  ['piano', ['pitched', 'melodic', 'harmonic']],
  ['guitar', ['pitched', 'melodic', 'harmonic']],
  ['synth', ['pitched', 'timbral']],
  ['strings', ['pitched', 'melodic', 'harmonic']],
  ['brass', ['pitched', 'melodic']],
  ['woodwinds', ['pitched', 'melodic']],
  ['vocal', ['pitched', 'melodic']],
  ['voice', ['pitched', 'melodic']],
  ['lead', ['pitched', 'melodic']],
  ['pad', ['pitched', 'harmonic', 'timbral']],
  ['chord', ['pitched', 'harmonic']],
  ['harmony', ['pitched', 'harmonic']],
  ['melody', ['pitched', 'melodic']],

  // Rhythmic
  ['drums', ['rhythmic']],
  ['kick', ['rhythmic', 'dynamic']],
  ['snare', ['rhythmic', 'dynamic']],
  ['hihat', ['rhythmic']],
  ['hats', ['rhythmic']],
  ['percussion', ['rhythmic']],
  ['shaker', ['rhythmic']],
  ['tambourine', ['rhythmic']],
  ['clap', ['rhythmic', 'dynamic']],

  // Bass
  ['bass', ['pitched', 'harmonic']],
  ['sub', ['pitched']],

  // Effects / Timbral
  ['reverb', ['timbral', 'spatial']],
  ['delay', ['timbral', 'temporal']],
  ['distortion', ['timbral']],
  ['chorus', ['timbral', 'spatial']],
  ['flanger', ['timbral']],
  ['phaser', ['timbral']],
  ['compressor', ['dynamic']],
  ['eq', ['timbral']],
  ['filter', ['timbral']],
  ['limiter', ['dynamic']],

  // Structural
  ['verse', ['sectional', 'sequential']],
  ['chorus', ['sectional', 'sequential']],
  ['bridge', ['sectional', 'sequential']],
  ['intro', ['sectional', 'sequential']],
  ['outro', ['sectional', 'sequential']],
]);

/**
 * Infer additional features from an entity's display name.
 */
export function inferFeaturesFromName(
  entityType: RestrictionEntityType,
  displayName: string,
): ContextualFeatures {
  const lower = displayName.toLowerCase();
  const inferred: SelectionalFeature[] = [];
  const reasons = new Map<SelectionalFeature, string>();

  for (const [keyword, features] of NAME_FEATURE_INFERENCES) {
    if (lower.includes(keyword)) {
      for (const feature of features) {
        if (!inferred.includes(feature)) {
          inferred.push(feature);
          reasons.set(feature, `Name contains "${keyword}"`);
        }
      }
    }
  }

  return {
    entityType,
    inferredFeatures: inferred,
    reasons,
  };
}

/**
 * Merge inferred features into an entity's base feature profile.
 */
export function mergeFeatures(
  base: FeatureBundle,
  inferred: readonly SelectionalFeature[],
): FeatureBundle {
  const positive = new Set(base.positive);
  for (const f of inferred) {
    positive.add(f);
  }
  return {
    positive,
    negative: base.negative,
  };
}

/**
 * Validate a restriction with contextual feature inference.
 */
export function validateWithContext(
  verb: string,
  role: string,
  entityType: RestrictionEntityType,
  displayName: string,
): RestrictionValidation {
  const profile = VERB_RESTRICTION_PROFILES.get(verb);
  if (!profile) {
    return validateRestriction(verb, role, entityType);
  }

  const requirement = profile.roleRequirements.get(role);
  if (!requirement) {
    return validateRestriction(verb, role, entityType);
  }

  const baseProfile = ENTITY_FEATURE_PROFILES.get(entityType);
  if (!baseProfile) {
    return validateRestriction(verb, role, entityType);
  }

  // Infer additional features from the display name
  const contextual = inferFeaturesFromName(entityType, displayName);
  const mergedFeatures = mergeFeatures(baseProfile.features, contextual.inferredFeatures);

  return validateFeatures(verb, role, entityType, mergedFeatures, requirement);
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get statistics about the selectional restriction module.
 */
export function getSelectionalRestrictionStats(): {
  entityTypes: number;
  verbProfiles: number;
  axisEntries: number;
  features: number;
  nameInferences: number;
} {
  return {
    entityTypes: ENTITY_FEATURE_PROFILES.size,
    verbProfiles: VERB_RESTRICTION_PROFILES.size,
    axisEntries: AXIS_COMPATIBILITY.size,
    features: 24, // count of SelectionalFeature union members
    nameInferences: NAME_FEATURE_INFERENCES.size,
  };
}

// =============================================================================
// RESET — for testing
// =============================================================================

/**
 * Reset module state (for testing).
 */
export function resetSelectionalRestrictions(): void {
  // Currently stateless — placeholder for future mutable state
}
