/**
 * GOFAI Edit Opcodes — Melody Manipulation
 *
 * Step 279: Define plan opcodes for melody edits:
 * - Ornamentation
 * - Contour shaping
 * - Register shifts under range constraints
 * - Melodic variation
 * - Phrase structure
 *
 * IMPORTANT: Melody editing is HIGH COST and OPTIONAL by default.
 * These opcodes should only be suggested when:
 * 1. User explicitly requests melody changes
 * 2. Melody preservation is NOT specified in constraints
 * 3. User confirms willingness to alter melody
 *
 * Design principles:
 * - All melody opcodes default to requiring explicit confirmation
 * - Range constraints are strictly enforced (instrument/voice limits)
 * - Harmonic compatibility is maintained
 * - Original melodic intent is preserved when possible
 * - Variations maintain recognizability unless complete rewrite requested
 *
 * @module gofai/canon/edit-opcodes-melody
 */

import type { EditOpcode, OpcodeId, AxisId } from './types';
import { createOpcodeId, createAxisId } from './types';

// =============================================================================
// Melodic Ornamentation
// =============================================================================

/**
 * OP_ADD_MELODIC_ORNAMENTS — Add decorative notes to melody
 *
 * Embellishes melody with ornaments (trills, turns, mordents, appoggiaturas,
 * grace notes) while preserving melodic skeleton and phrasing.
 *
 * Preserves: Melodic skeleton, phrase structure, harmonic outline
 * Affects: Note density, expressiveness, rhythmic detail
 */
export const OP_ADD_MELODIC_ORNAMENTS: EditOpcode = {
  id: createOpcodeId('add_melodic_ornaments'),
  name: 'Add Melodic Ornaments',
  description:
    'Embellish melody with ornaments (trills, turns, mordents, grace notes). ' +
    'Preserves melodic skeleton while adding expressive detail.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Melodic material to ornament',
    },
    {
      name: 'ornament_types',
      type: 'string',
      required: false,
      description: 'Types of ornaments to add (comma-separated)',
      defaultValue: 'trill,turn,mordent,appoggiatura,grace_note',
    },
    {
      name: 'density',
      type: 'string',
      required: false,
      description: 'How many ornaments to add',
      enumValues: ['sparse', 'moderate', 'dense', 'virtuosic'],
      defaultValue: 'moderate',
    },
    {
      name: 'style',
      type: 'string',
      required: false,
      description: 'Ornament style',
      enumValues: ['baroque', 'classical', 'romantic', 'jazz', 'folk', 'contemporary'],
      defaultValue: 'classical',
    },
    {
      name: 'preserve_contour',
      type: 'boolean',
      required: false,
      description: 'Keep overall melodic shape unchanged',
      defaultValue: true,
    },
    {
      name: 'respect_phrasing',
      type: 'boolean',
      required: false,
      description: 'Avoid ornaments that break phrase boundaries',
      defaultValue: true,
    },
  ],
  affects: ['event', 'melody'],
  effectType: 'mutate',
  cost: 'high',
  requiresCapabilities: ['melody_editing'],
  affectsAxes: [
    createAxisId('ornamentation'),
    createAxisId('expressiveness'),
    createAxisId('complexity'),
    createAxisId('virtuosity'),
  ],
  preconditions: [
    'scope must contain melodic material',
    'user must confirm melody editing',
    'no "preserve melody exact" constraint active',
  ],
  postconditions: [
    'ornaments added to melody',
    'melodic skeleton preserved',
    'phrase structure maintained',
    'harmonic compatibility preserved',
  ],
};

/**
 * OP_REMOVE_MELODIC_ORNAMENTS — Simplify melody by removing ornaments
 *
 * Strips away decorative notes, reducing melody to its essential skeleton.
 * Useful for creating simpler versions or reducing density.
 *
 * Preserves: Melodic skeleton, essential notes
 * Affects: Note density, complexity
 */
export const OP_REMOVE_MELODIC_ORNAMENTS: EditOpcode = {
  id: createOpcodeId('remove_melodic_ornaments'),
  name: 'Remove Melodic Ornaments',
  description:
    'Simplify melody by removing ornamental notes. ' +
    'Reduces to essential melodic skeleton.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Melodic material to simplify',
    },
    {
      name: 'aggressiveness',
      type: 'string',
      required: false,
      description: 'How much to simplify',
      enumValues: ['conservative', 'moderate', 'aggressive', 'skeletal'],
      defaultValue: 'moderate',
    },
    {
      name: 'preserve_accents',
      type: 'boolean',
      required: false,
      description: 'Keep accented notes even if ornamental',
      defaultValue: true,
    },
  ],
  affects: ['event', 'melody'],
  effectType: 'mutate',
  cost: 'medium',
  requiresCapabilities: ['melody_editing'],
  affectsAxes: [createAxisId('simplicity'), createAxisId('clarity'), createAxisId('density')],
  preconditions: ['scope must contain melodic material with ornaments'],
  postconditions: [
    'ornamental notes removed',
    'melodic skeleton preserved',
    'melody simplified',
  ],
};

// =============================================================================
// Melodic Contour Manipulation
// =============================================================================

/**
 * OP_SHAPE_MELODIC_CONTOUR — Adjust overall melodic shape
 *
 * Modifies the melodic contour (ascending, descending, arch, wave)
 * while attempting to preserve recognizability. High cost operation.
 *
 * Preserves: Rhythmic structure, phrase length, harmonic outline
 * Affects: Pitch contour, melodic character
 */
export const OP_SHAPE_MELODIC_CONTOUR: EditOpcode = {
  id: createOpcodeId('shape_melodic_contour'),
  name: 'Shape Melodic Contour',
  description:
    'Adjust overall melodic shape (ascending, descending, arch, wave). ' +
    'Modifies pitch contour while preserving phrase structure.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Melodic phrase to reshape',
    },
    {
      name: 'target_contour',
      type: 'string',
      required: true,
      description: 'Desired contour shape',
      enumValues: [
        'ascending',
        'descending',
        'arch',
        'inverted_arch',
        'wave',
        'terraced',
        'flat',
      ],
    },
    {
      name: 'preserve_intervals',
      type: 'boolean',
      required: false,
      description: 'Maintain interval relationships where possible',
      defaultValue: true,
    },
    {
      name: 'preserve_rhythm',
      type: 'boolean',
      required: false,
      description: 'Keep rhythmic structure unchanged',
      defaultValue: true,
    },
    {
      name: 'range_limit',
      type: 'string',
      required: false,
      description: 'Maximum pitch range for contour (semitones)',
    },
  ],
  affects: ['event', 'melody'],
  effectType: 'mutate',
  cost: 'high',
  requiresCapabilities: ['melody_editing', 'advanced_composition'],
  affectsAxes: [createAxisId('contour'), createAxisId('melodic_direction'), createAxisId('shape')],
  preconditions: [
    'scope must contain melodic phrase',
    'user must confirm melody editing',
    'no strict melody preservation constraint',
  ],
  postconditions: [
    'melodic contour adjusted to target shape',
    'phrase structure preserved',
    'harmonic compatibility maintained',
    'range limits respected',
  ],
};

/**
 * OP_INVERT_MELODIC_INTERVALS — Invert melodic intervals
 *
 * Flips ascending intervals to descending and vice versa, creating
 * melodic variation through inversion.
 *
 * Preserves: Rhythmic structure, interval sizes
 * Affects: Pitch direction, melodic character
 */
export const OP_INVERT_MELODIC_INTERVALS: EditOpcode = {
  id: createOpcodeId('invert_melodic_intervals'),
  name: 'Invert Melodic Intervals',
  description:
    'Flip melodic intervals (ascending becomes descending and vice versa). ' +
    'Creates variation while preserving interval relationships.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Melodic material to invert',
    },
    {
      name: 'inversion_axis',
      type: 'string',
      required: false,
      description: 'Pitch around which to invert',
      enumValues: ['first_note', 'center_pitch', 'tonic', 'custom'],
      defaultValue: 'first_note',
    },
    {
      name: 'preserve_rhythm',
      type: 'boolean',
      required: false,
      description: 'Keep rhythmic structure unchanged',
      defaultValue: true,
    },
  ],
  affects: ['event', 'melody'],
  effectType: 'mutate',
  cost: 'high',
  requiresCapabilities: ['melody_editing'],
  affectsAxes: [createAxisId('variation'), createAxisId('contour')],
  preconditions: [
    'scope must contain melodic material',
    'user must confirm melody editing',
  ],
  postconditions: [
    'melodic intervals inverted',
    'rhythmic structure preserved',
    'range adjusted as needed',
  ],
};

/**
 * OP_SMOOTH_MELODIC_LEAPS — Reduce large intervals with passing notes
 *
 * Fills in large melodic leaps with stepwise motion, creating
 * smoother, more singable melodies.
 *
 * Preserves: Starting and ending notes, harmonic outline
 * Affects: Interval sizes, note density, smoothness
 */
export const OP_SMOOTH_MELODIC_LEAPS: EditOpcode = {
  id: createOpcodeId('smooth_melodic_leaps'),
  name: 'Smooth Melodic Leaps',
  description:
    'Fill large melodic leaps with passing notes. ' +
    'Creates smoother, more singable melodic lines.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Melodic material to smooth',
    },
    {
      name: 'leap_threshold',
      type: 'number',
      required: false,
      description: 'Minimum interval size to smooth (semitones)',
      validation: { min: 3, max: 12 },
      defaultValue: 5,
    },
    {
      name: 'fill_strategy',
      type: 'string',
      required: false,
      description: 'How to fill leaps',
      enumValues: ['diatonic_steps', 'chromatic_steps', 'arpeggiation', 'mixed'],
      defaultValue: 'diatonic_steps',
    },
    {
      name: 'preserve_original_notes',
      type: 'boolean',
      required: false,
      description: 'Keep leap endpoints unchanged',
      defaultValue: true,
    },
  ],
  affects: ['event', 'melody'],
  effectType: 'mutate',
  cost: 'medium',
  requiresCapabilities: ['melody_editing'],
  affectsAxes: [createAxisId('smoothness'), createAxisId('stepwise_motion'), createAxisId('density')],
  preconditions: ['scope must contain melodic leaps'],
  postconditions: [
    'large leaps filled with passing notes',
    'melodic motion smoother',
    'note density increased',
    'harmonic compatibility maintained',
  ],
};

/**
 * OP_EMPHASIZE_MELODIC_LEAPS — Create more dramatic melodic contour
 *
 * Removes passing notes between structural tones to create larger,
 * more dramatic intervals.
 *
 * Preserves: Structural melodic tones
 * Affects: Interval sizes, note density, drama
 */
export const OP_EMPHASIZE_MELODIC_LEAPS: EditOpcode = {
  id: createOpcodeId('emphasize_melodic_leaps'),
  name: 'Emphasize Melodic Leaps',
  description:
    'Remove passing notes to create larger, more dramatic leaps. ' +
    'Emphasizes structural tones and creates bold melodic character.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Melodic material to dramatize',
    },
    {
      name: 'intensity',
      type: 'string',
      required: false,
      description: 'How dramatic to make the melody',
      enumValues: ['subtle', 'moderate', 'dramatic', 'extreme'],
      defaultValue: 'moderate',
    },
    {
      name: 'preserve_structural_tones',
      type: 'boolean',
      required: false,
      description: 'Keep harmonic chord tones',
      defaultValue: true,
    },
  ],
  affects: ['event', 'melody'],
  effectType: 'mutate',
  cost: 'high',
  requiresCapabilities: ['melody_editing'],
  affectsAxes: [createAxisId('drama'), createAxisId('boldness'), createAxisId('leaps')],
  preconditions: [
    'scope must contain melodic material with passing notes',
    'user must confirm melody editing',
  ],
  postconditions: [
    'passing notes removed',
    'melodic leaps emphasized',
    'structural tones preserved',
  ],
};

// =============================================================================
// Register and Range Manipulation
// =============================================================================

/**
 * OP_SHIFT_MELODIC_REGISTER — Transpose melody by octaves
 *
 * Moves melody up or down by octaves while enforcing range constraints
 * for the instrument or voice.
 *
 * Preserves: Melodic intervals, rhythmic structure
 * Affects: Register, tessitura
 */
export const OP_SHIFT_MELODIC_REGISTER: EditOpcode = {
  id: createOpcodeId('shift_melodic_register'),
  name: 'Shift Melodic Register',
  description:
    'Transpose melody by octaves within instrument/voice range constraints. ' +
    'Changes tessitura while preserving melodic intervals.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Melodic material to shift',
    },
    {
      name: 'octaves',
      type: 'number',
      required: true,
      description: 'Number of octaves to shift (negative for down)',
      validation: { min: -3, max: 3 },
    },
    {
      name: 'enforce_range',
      type: 'boolean',
      required: false,
      description: 'Enforce instrument/voice range limits',
      defaultValue: true,
    },
    {
      name: 'range_min',
      type: 'number',
      required: false,
      description: 'Minimum allowed MIDI note',
      validation: { min: 0, max: 127 },
    },
    {
      name: 'range_max',
      type: 'number',
      required: false,
      description: 'Maximum allowed MIDI note',
      validation: { min: 0, max: 127 },
    },
  ],
  affects: ['event', 'melody'],
  effectType: 'mutate',
  cost: 'low',
  requiresCapabilities: ['melody_editing'],
  affectsAxes: [createAxisId('register'), createAxisId('tessitura')],
  preconditions: ['scope must contain melodic material'],
  postconditions: [
    'melody transposed by specified octaves',
    'all notes within range constraints',
    'melodic intervals preserved',
  ],
};

/**
 * OP_COMPRESS_MELODIC_RANGE — Reduce melodic range
 *
 * Brings melodic notes closer together vertically, reducing the
 * overall pitch range. Useful for adapting melodies to different
 * instruments or creating more compact phrases.
 *
 * Preserves: Contour direction, rhythmic structure
 * Affects: Interval sizes, range
 */
export const OP_COMPRESS_MELODIC_RANGE: EditOpcode = {
  id: createOpcodeId('compress_melodic_range'),
  name: 'Compress Melodic Range',
  description:
    'Reduce melodic range by proportionally shrinking intervals. ' +
    'Preserves contour while making melody more compact.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Melodic material to compress',
    },
    {
      name: 'compression_ratio',
      type: 'number',
      required: false,
      description: 'How much to compress (0.5 = half range)',
      validation: { min: 0.1, max: 0.9 },
      defaultValue: 0.7,
    },
    {
      name: 'anchor_point',
      type: 'string',
      required: false,
      description: 'Which pitch to keep fixed',
      enumValues: ['first_note', 'lowest_note', 'highest_note', 'center'],
      defaultValue: 'first_note',
    },
    {
      name: 'quantize_to_scale',
      type: 'boolean',
      required: false,
      description: 'Snap resulting notes to scale',
      defaultValue: true,
    },
  ],
  affects: ['event', 'melody'],
  effectType: 'mutate',
  cost: 'high',
  requiresCapabilities: ['melody_editing'],
  affectsAxes: [createAxisId('range'), createAxisId('compactness')],
  preconditions: [
    'scope must contain melodic material',
    'user must confirm melody editing',
  ],
  postconditions: [
    'melodic range reduced',
    'contour direction preserved',
    'intervals proportionally compressed',
  ],
};

/**
 * OP_EXPAND_MELODIC_RANGE — Increase melodic range
 *
 * Spreads melodic notes further apart vertically, creating a wider
 * pitch range and more dramatic contour.
 *
 * Preserves: Contour direction, rhythmic structure
 * Affects: Interval sizes, range, drama
 */
export const OP_EXPAND_MELODIC_RANGE: EditOpcode = {
  id: createOpcodeId('expand_melodic_range'),
  name: 'Expand Melodic Range',
  description:
    'Increase melodic range by proportionally expanding intervals. ' +
    'Creates more dramatic melodic contour with wider pitch range.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Melodic material to expand',
    },
    {
      name: 'expansion_ratio',
      type: 'number',
      required: false,
      description: 'How much to expand (1.5 = 1.5x range)',
      validation: { min: 1.1, max: 3.0 },
      defaultValue: 1.5,
    },
    {
      name: 'anchor_point',
      type: 'string',
      required: false,
      description: 'Which pitch to keep fixed',
      enumValues: ['first_note', 'lowest_note', 'highest_note', 'center'],
      defaultValue: 'first_note',
    },
    {
      name: 'enforce_range_limits',
      type: 'boolean',
      required: false,
      description: 'Stop expansion at instrument limits',
      defaultValue: true,
    },
    {
      name: 'quantize_to_scale',
      type: 'boolean',
      required: false,
      description: 'Snap resulting notes to scale',
      defaultValue: true,
    },
  ],
  affects: ['event', 'melody'],
  effectType: 'mutate',
  cost: 'high',
  requiresCapabilities: ['melody_editing'],
  affectsAxes: [createAxisId('range'), createAxisId('drama'), createAxisId('boldness')],
  preconditions: [
    'scope must contain melodic material',
    'user must confirm melody editing',
  ],
  postconditions: [
    'melodic range increased',
    'contour direction preserved',
    'intervals proportionally expanded',
    'range limits respected',
  ],
};

// =============================================================================
// Melodic Variation and Development
// =============================================================================

/**
 * OP_CREATE_MELODIC_VARIATION — Generate variation of melodic phrase
 *
 * Creates a melodic variation using compositional techniques
 * (sequence, augmentation, diminution, fragmentation).
 *
 * Preserves: Melodic identity (recognizable as variation)
 * Affects: Specific pitches, rhythms, phrase structure
 */
export const OP_CREATE_MELODIC_VARIATION: EditOpcode = {
  id: createOpcodeId('create_melodic_variation'),
  name: 'Create Melodic Variation',
  description:
    'Generate a variation of melodic phrase using compositional techniques. ' +
    'Creates recognizable variation while introducing change.',
  params: [
    {
      name: 'source_phrase',
      type: 'scope',
      required: true,
      description: 'Original melodic phrase',
    },
    {
      name: 'variation_technique',
      type: 'string',
      required: false,
      description: 'Variation technique to apply',
      enumValues: [
        'sequence',
        'augmentation',
        'diminution',
        'fragmentation',
        'embellishment',
        'simplification',
        'rhythmic_variation',
        'interval_variation',
        'mixed',
      ],
      defaultValue: 'mixed',
    },
    {
      name: 'similarity_target',
      type: 'string',
      required: false,
      description: 'How similar to original',
      enumValues: ['very_close', 'recognizable', 'moderate', 'distant'],
      defaultValue: 'recognizable',
    },
    {
      name: 'preserve_rhythm',
      type: 'boolean',
      required: false,
      description: 'Keep rhythmic structure unchanged',
      defaultValue: false,
    },
    {
      name: 'preserve_contour',
      type: 'boolean',
      required: false,
      description: 'Keep overall melodic shape',
      defaultValue: false,
    },
  ],
  affects: ['event', 'melody'],
  effectType: 'mutate',
  cost: 'high',
  requiresCapabilities: ['melody_editing', 'advanced_composition'],
  affectsAxes: [createAxisId('variation'), createAxisId('development')],
  preconditions: [
    'source phrase must exist and be identifiable',
    'user must confirm melody editing',
  ],
  postconditions: [
    'melodic variation created',
    'variation is recognizable at specified similarity level',
    'variation technique applied',
  ],
};

/**
 * OP_SEQUENCE_MELODIC_PHRASE — Repeat phrase at different pitch levels
 *
 * Creates a melodic sequence by repeating a phrase at transposed
 * pitch levels. Common compositional technique.
 *
 * Preserves: Intervallic content, rhythmic structure
 * Affects: Pitch level, harmonic implications
 */
export const OP_SEQUENCE_MELODIC_PHRASE: EditOpcode = {
  id: createOpcodeId('sequence_melodic_phrase'),
  name: 'Sequence Melodic Phrase',
  description:
    'Create melodic sequence by repeating phrase at different pitch levels. ' +
    'Common compositional technique for development.',
  params: [
    {
      name: 'source_phrase',
      type: 'scope',
      required: true,
      description: 'Phrase to sequence',
    },
    {
      name: 'repetitions',
      type: 'number',
      required: false,
      description: 'Number of sequential repetitions',
      validation: { min: 1, max: 8 },
      defaultValue: 2,
    },
    {
      name: 'interval',
      type: 'number',
      required: false,
      description: 'Transposition interval in semitones',
      validation: { min: -12, max: 12 },
      defaultValue: 2,
    },
    {
      name: 'sequence_type',
      type: 'string',
      required: false,
      description: 'Type of sequence',
      enumValues: ['real', 'tonal', 'modified'],
      defaultValue: 'tonal',
    },
    {
      name: 'break_pattern',
      type: 'boolean',
      required: false,
      description: 'Vary the last repetition',
      defaultValue: true,
    },
  ],
  affects: ['event', 'melody'],
  effectType: 'mutate',
  cost: 'medium',
  requiresCapabilities: ['melody_editing'],
  affectsAxes: [createAxisId('sequence'), createAxisId('development'), createAxisId('unity')],
  preconditions: ['source phrase must exist'],
  postconditions: [
    'phrase sequenced at different pitch levels',
    'repetitions created',
    'intervallic content preserved',
  ],
};

// =============================================================================
// Melodic Rhythm
// =============================================================================

/**
 * OP_ADJUST_MELODIC_RHYTHM — Change rhythmic values of melody
 *
 * Modifies note durations and rhythmic patterns while preserving
 * pitch content.
 *
 * Preserves: Pitch sequence, phrase boundaries
 * Affects: Rhythmic values, note density, feel
 */
export const OP_ADJUST_MELODIC_RHYTHM: EditOpcode = {
  id: createOpcodeId('adjust_melodic_rhythm'),
  name: 'Adjust Melodic Rhythm',
  description:
    'Change rhythmic values of melody while preserving pitch content. ' +
    'Adjusts note durations and rhythmic patterns.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Melodic material to adjust',
    },
    {
      name: 'adjustment_type',
      type: 'string',
      required: false,
      description: 'Type of rhythmic adjustment',
      enumValues: [
        'augmentation',
        'diminution',
        'dotted_rhythms',
        'even_eighths',
        'syncopation',
        'straight_quarters',
      ],
      defaultValue: 'augmentation',
    },
    {
      name: 'factor',
      type: 'number',
      required: false,
      description: 'Rhythmic transformation factor',
      validation: { min: 0.25, max: 4.0 },
      defaultValue: 2.0,
    },
    {
      name: 'preserve_accents',
      type: 'boolean',
      required: false,
      description: 'Keep accented notes on strong beats',
      defaultValue: true,
    },
  ],
  affects: ['event', 'melody', 'rhythm'],
  effectType: 'mutate',
  cost: 'medium',
  requiresCapabilities: ['melody_editing'],
  affectsAxes: [createAxisId('rhythmic_density'), createAxisId('tempo_feel')],
  preconditions: ['scope must contain melodic material'],
  postconditions: [
    'melodic rhythm adjusted',
    'pitch sequence preserved',
    'phrase structure maintained',
  ],
};

// =============================================================================
// Melodic Phrasing
// =============================================================================

/**
 * OP_ADJUST_PHRASE_LENGTHS — Change phrase boundary positions
 *
 * Extends or shortens melodic phrases by adjusting boundaries,
 * affects breathing points and formal structure.
 *
 * Preserves: Melodic material (may repeat or truncate)
 * Affects: Phrase lengths, formal proportions
 */
export const OP_ADJUST_PHRASE_LENGTHS: EditOpcode = {
  id: createOpcodeId('adjust_phrase_lengths'),
  name: 'Adjust Phrase Lengths',
  description:
    'Change melodic phrase boundary positions. ' +
    'Extends or shortens phrases, affecting formal proportions.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Melodic phrases to adjust',
    },
    {
      name: 'target_length',
      type: 'number',
      required: false,
      description: 'Target phrase length in bars',
      validation: { min: 1, max: 16 },
    },
    {
      name: 'adjustment_strategy',
      type: 'string',
      required: false,
      description: 'How to adjust lengths',
      enumValues: ['extend_last_note', 'repeat_material', 'truncate', 'fill_with_rest'],
      defaultValue: 'extend_last_note',
    },
    {
      name: 'maintain_proportions',
      type: 'boolean',
      required: false,
      description: 'Keep relative phrase length ratios',
      defaultValue: true,
    },
  ],
  affects: ['event', 'melody', 'marker'],
  effectType: 'mutate',
  cost: 'medium',
  requiresCapabilities: ['melody_editing', 'structure_editing'],
  affectsAxes: [createAxisId('phrase_length'), createAxisId('breath')],
  preconditions: ['scope must contain melodic phrases'],
  postconditions: [
    'phrase lengths adjusted',
    'phrase boundaries modified',
    'melodic material preserved or adapted',
  ],
};

/**
 * OP_ADD_MELODIC_REST — Insert rests for breathing and phrasing
 *
 * Adds rests at appropriate points to create breathing room and
 * clearer phrase articulation.
 *
 * Preserves: Melodic notes
 * Affects: Phrase articulation, density, breathing
 */
export const OP_ADD_MELODIC_REST: EditOpcode = {
  id: createOpcodeId('add_melodic_rest'),
  name: 'Add Melodic Rest',
  description:
    'Insert rests at phrase boundaries or within phrases. ' +
    'Creates breathing room and clearer phrase articulation.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Melodic material to add rests to',
    },
    {
      name: 'placement',
      type: 'string',
      required: false,
      description: 'Where to add rests',
      enumValues: ['phrase_boundaries', 'between_gestures', 'regular_intervals', 'auto'],
      defaultValue: 'auto',
    },
    {
      name: 'rest_duration',
      type: 'string',
      required: false,
      description: 'Duration of rests to add',
      enumValues: ['short', 'medium', 'long', 'vary'],
      defaultValue: 'short',
    },
  ],
  affects: ['event', 'melody'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('breath'), createAxisId('articulation'), createAxisId('space')],
  preconditions: ['scope must contain melodic material'],
  postconditions: [
    'rests inserted at appropriate points',
    'phrase articulation improved',
    'melodic notes preserved',
  ],
};

// =============================================================================
// Export
// =============================================================================

/**
 * All melody editing opcodes.
 */
export const MELODY_OPCODES: readonly EditOpcode[] = [
  OP_ADD_MELODIC_ORNAMENTS,
  OP_REMOVE_MELODIC_ORNAMENTS,
  OP_SHAPE_MELODIC_CONTOUR,
  OP_INVERT_MELODIC_INTERVALS,
  OP_SMOOTH_MELODIC_LEAPS,
  OP_EMPHASIZE_MELODIC_LEAPS,
  OP_SHIFT_MELODIC_REGISTER,
  OP_COMPRESS_MELODIC_RANGE,
  OP_EXPAND_MELODIC_RANGE,
  OP_CREATE_MELODIC_VARIATION,
  OP_SEQUENCE_MELODIC_PHRASE,
  OP_ADJUST_MELODIC_RHYTHM,
  OP_ADJUST_PHRASE_LENGTHS,
  OP_ADD_MELODIC_REST,
] as const;

/**
 * Melody opcode count: 14 comprehensive opcodes for melodic manipulation.
 *
 * REMINDER: All melody opcodes are HIGH COST and require explicit user
 * confirmation or absence of melody preservation constraints.
 */
export const MELODY_OPCODE_COUNT = MELODY_OPCODES.length;
