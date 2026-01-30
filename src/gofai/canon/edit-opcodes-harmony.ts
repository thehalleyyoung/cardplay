/**
 * GOFAI Edit Opcodes — Harmony Manipulation
 *
 * Step 278: Define plan opcodes for harmony edits:
 * - Revoice
 * - Add extensions
 * - Substitute chords
 * - Functional reharmonization
 * - Voice leading optimization
 * - Bass line alterations
 * - Harmonic rhythm changes
 *
 * These opcodes manipulate the harmonic structure of music while respecting
 * melody preservation constraints and voice leading principles.
 *
 * Design principles:
 * - Melody preservation is default unless explicitly overridden
 * - Voice leading quality is maintained or improved
 * - Harmonic function is preserved unless reharmonization requested
 * - All changes respect the current key/mode context
 * - Extension requires Prolog theory integration for sophisticated substitutions
 *
 * @module gofai/canon/edit-opcodes-harmony
 */

import type { EditOpcode, OpcodeId, AxisId } from './types';
import { createOpcodeId, createAxisId } from './types';

// =============================================================================
// Voicing Manipulation
// =============================================================================

/**
 * OP_REVOICE_CHORDS — Change chord voicings without altering harmony
 *
 * Transforms how chord tones are distributed across voices while maintaining
 * the harmonic function and root position/inversion. Useful for:
 * - Opening up or closing voicings
 * - Creating better voice leading
 * - Adjusting register distribution
 * - Improving playability
 *
 * Preserves: Harmonic function, melody (if specified)
 * Affects: Vertical spacing, register distribution, voice leading quality
 */
export const OP_REVOICE_CHORDS: EditOpcode = {
  id: createOpcodeId('revoice_chords'),
  name: 'Revoice Chords',
  description:
    'Change chord voicings while maintaining harmonic function. ' +
    'Redistributes chord tones across voices to improve spacing, voice leading, or playability.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which chords to revoice',
    },
    {
      name: 'voicing_style',
      type: 'string',
      required: false,
      description: 'Target voicing style',
      enumValues: [
        'open',
        'closed',
        'drop2',
        'drop3',
        'drop2and4',
        'quartals',
        'rootless',
        'shell',
        'spread',
        'cluster',
      ],
      defaultValue: 'open',
    },
    {
      name: 'preserve_melody',
      type: 'boolean',
      required: false,
      description: 'Keep melody notes unchanged',
      defaultValue: true,
    },
    {
      name: 'preserve_bass',
      type: 'boolean',
      required: false,
      description: 'Keep bass line unchanged',
      defaultValue: true,
    },
    {
      name: 'voice_leading_quality',
      type: 'string',
      required: false,
      description: 'Priority for voice leading smoothness',
      enumValues: ['strict', 'smooth', 'moderate', 'free'],
      defaultValue: 'smooth',
    },
    {
      name: 'register_range',
      type: 'string',
      required: false,
      description: 'Target register range for voicings (MIDI note range)',
    },
  ],
  affects: ['event', 'harmony', 'texture'],
  effectType: 'mutate',
  cost: 'medium',
  requiresCapabilities: ['harmony_editing'],
  affectsAxes: [
    createAxisId('voicing_spread'),
    createAxisId('thickness'),
    createAxisId('register'),
    createAxisId('harmonic_color'),
  ],
  preconditions: [
    'scope must contain harmonic events',
    'sufficient voices available for target voicing style',
  ],
  postconditions: [
    'chord voicings changed to match style',
    'harmonic function preserved',
    'melody/bass preserved if specified',
    'voice leading quality meets or exceeds specified level',
  ],
};

/**
 * OP_OPTIMIZE_VOICE_LEADING — Improve voice leading quality
 *
 * Analyzes and improves voice leading by minimizing voice motion,
 * avoiding parallel fifths/octaves, and creating smoother connections
 * between chords.
 *
 * Preserves: Harmonic function, melody
 * Affects: Voice motion, internal voice lines
 */
export const OP_OPTIMIZE_VOICE_LEADING: EditOpcode = {
  id: createOpcodeId('optimize_voice_leading'),
  name: 'Optimize Voice Leading',
  description:
    'Improve voice leading quality by minimizing motion, avoiding parallels, ' +
    'and creating smooth voice lines between chords.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Harmonic progression to optimize',
    },
    {
      name: 'strictness',
      type: 'string',
      required: false,
      description: 'How strict the voice leading rules are',
      enumValues: ['classical', 'jazz', 'pop', 'free'],
      defaultValue: 'jazz',
    },
    {
      name: 'preserve_melody',
      type: 'boolean',
      required: false,
      description: 'Keep top voice unchanged',
      defaultValue: true,
    },
    {
      name: 'preserve_bass',
      type: 'boolean',
      required: false,
      description: 'Keep bottom voice unchanged',
      defaultValue: true,
    },
    {
      name: 'allow_voice_crossing',
      type: 'boolean',
      required: false,
      description: 'Allow inner voices to cross',
      defaultValue: false,
    },
  ],
  affects: ['event', 'harmony'],
  effectType: 'mutate',
  cost: 'medium',
  requiresCapabilities: ['harmony_editing', 'theory_analysis'],
  affectsAxes: [createAxisId('smoothness'), createAxisId('harmonic_quality')],
  preconditions: ['scope must contain harmonic progression'],
  postconditions: [
    'voice leading improved according to style rules',
    'parallel motion minimized',
    'voice motion minimized where possible',
    'melody/bass preserved if specified',
  ],
};

/**
 * OP_ADJUST_CHORD_DENSITY — Change number of voices in chords
 *
 * Adds or removes chord tones to make harmonies thicker or thinner.
 *
 * Preserves: Harmonic function, essential tones
 * Affects: Chord density, texture
 */
export const OP_ADJUST_CHORD_DENSITY: EditOpcode = {
  id: createOpcodeId('adjust_chord_density'),
  name: 'Adjust Chord Density',
  description:
    'Change the number of voices in chords by adding doublings or removing non-essential tones. ' +
    'Preserves harmonic function while adjusting texture.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which chords to adjust',
    },
    {
      name: 'target_voices',
      type: 'number',
      required: false,
      description: 'Target number of voices per chord',
      validation: { min: 2, max: 12 },
    },
    {
      name: 'direction',
      type: 'string',
      required: false,
      description: 'Whether to add or remove voices',
      enumValues: ['thicken', 'thin', 'auto'],
      defaultValue: 'auto',
    },
    {
      name: 'preserve_essential_tones',
      type: 'boolean',
      required: false,
      description: 'Keep root, third, seventh when present',
      defaultValue: true,
    },
  ],
  affects: ['event', 'harmony', 'texture'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('thickness'), createAxisId('density'), createAxisId('fullness')],
  preconditions: ['scope must contain harmonic events'],
  postconditions: [
    'chord voice count adjusted toward target',
    'harmonic function preserved',
    'essential tones retained',
  ],
};

// =============================================================================
// Chord Extensions and Color Tones
// =============================================================================

/**
 * OP_ADD_CHORD_EXTENSIONS — Add extensions to chords (9ths, 11ths, 13ths)
 *
 * Enriches basic triads and seventh chords with upper extensions,
 * adding harmonic color and sophistication.
 *
 * Preserves: Root harmonic function
 * Affects: Harmonic color, complexity, tension
 */
export const OP_ADD_CHORD_EXTENSIONS: EditOpcode = {
  id: createOpcodeId('add_chord_extensions'),
  name: 'Add Chord Extensions',
  description:
    'Add upper extensions (9ths, 11ths, 13ths) to chords. ' +
    'Enriches harmonic color while preserving basic function.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which chords to extend',
    },
    {
      name: 'extension_types',
      type: 'string',
      required: false,
      description: 'Which extensions to add (comma-separated)',
      defaultValue: '9,11,13',
    },
    {
      name: 'style',
      type: 'string',
      required: false,
      description: 'Harmonic style for extension choices',
      enumValues: ['jazz', 'classical', 'pop', 'impressionist', 'contemporary'],
      defaultValue: 'jazz',
    },
    {
      name: 'avoid_avoid_notes',
      type: 'boolean',
      required: false,
      description: 'Avoid theoretically problematic extensions (e.g., natural 11 on major)',
      defaultValue: true,
    },
    {
      name: 'max_voices_added',
      type: 'number',
      required: false,
      description: 'Maximum number of extension tones to add per chord',
      validation: { min: 1, max: 4 },
      defaultValue: 2,
    },
  ],
  affects: ['event', 'harmony'],
  effectType: 'mutate',
  cost: 'medium',
  requiresCapabilities: ['harmony_editing', 'theory_analysis'],
  affectsAxes: [
    createAxisId('harmonic_color'),
    createAxisId('complexity'),
    createAxisId('sophistication'),
    createAxisId('tension'),
  ],
  preconditions: ['scope must contain harmonic events', 'chords must be identifiable'],
  postconditions: [
    'extensions added to chords',
    'harmonic function preserved',
    'avoid notes excluded if specified',
    'voice count increased',
  ],
};

/**
 * OP_REMOVE_CHORD_EXTENSIONS — Simplify chords by removing extensions
 *
 * Reduces complex chords to simpler forms, useful for creating space
 * or simplifying harmony.
 *
 * Preserves: Core harmonic function (root, third, seventh)
 * Affects: Harmonic color, complexity
 */
export const OP_REMOVE_CHORD_EXTENSIONS: EditOpcode = {
  id: createOpcodeId('remove_chord_extensions'),
  name: 'Remove Chord Extensions',
  description:
    'Simplify chords by removing extensions, reducing complexity while ' +
    'preserving core harmonic function.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which chords to simplify',
    },
    {
      name: 'remove_up_to',
      type: 'string',
      required: false,
      description: 'Highest extension to remove',
      enumValues: ['9th', '11th', '13th', 'all_extensions'],
      defaultValue: 'all_extensions',
    },
    {
      name: 'keep_essential',
      type: 'boolean',
      required: false,
      description: 'Keep root, third, seventh',
      defaultValue: true,
    },
  ],
  affects: ['event', 'harmony', 'texture'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [
    createAxisId('harmonic_color'),
    createAxisId('complexity'),
    createAxisId('simplicity'),
  ],
  preconditions: ['scope must contain harmonic events with extensions'],
  postconditions: [
    'extensions removed as specified',
    'core harmony preserved',
    'chord complexity reduced',
  ],
};

/**
 * OP_ALTER_CHORD_TONES — Apply alterations to chord tones (b5, #5, b9, #9, #11)
 *
 * Modifies chord tones chromatically to create altered dominant sounds
 * and other color variations.
 *
 * Preserves: Root and overall harmonic direction
 * Affects: Harmonic color, tension, chromaticism
 */
export const OP_ALTER_CHORD_TONES: EditOpcode = {
  id: createOpcodeId('alter_chord_tones'),
  name: 'Alter Chord Tones',
  description:
    'Apply chromatic alterations to chord tones (b5, #5, b9, #9, #11). ' +
    'Creates altered dominant sounds and other harmonic colors.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which chords to alter',
    },
    {
      name: 'alterations',
      type: 'string',
      required: false,
      description: 'Which alterations to apply (comma-separated)',
      defaultValue: 'b9,#9,#11,b13',
    },
    {
      name: 'target_chord_types',
      type: 'string',
      required: false,
      description: 'Which chord types to alter',
      enumValues: ['dominant', 'major', 'minor', 'all'],
      defaultValue: 'dominant',
    },
    {
      name: 'intensity',
      type: 'string',
      required: false,
      description: 'How many alterations to apply',
      enumValues: ['subtle', 'moderate', 'heavy'],
      defaultValue: 'moderate',
    },
  ],
  affects: ['event', 'harmony'],
  effectType: 'mutate',
  cost: 'medium',
  requiresCapabilities: ['harmony_editing', 'theory_analysis'],
  affectsAxes: [
    createAxisId('harmonic_color'),
    createAxisId('tension'),
    createAxisId('chromaticism'),
    createAxisId('dissonance'),
  ],
  preconditions: ['scope must contain harmonic events'],
  postconditions: [
    'chord tones altered as specified',
    'root harmony preserved',
    'harmonic tension increased',
  ],
};

// =============================================================================
// Chord Substitution
// =============================================================================

/**
 * OP_SUBSTITUTE_CHORD — Replace chord with a functional substitute
 *
 * Replaces a chord with another chord that serves similar harmonic function.
 * Uses theory-based rules for common substitutions (tritone subs, relative
 * chords, secondary dominants, etc.).
 *
 * Preserves: Overall harmonic motion, melody compatibility
 * Affects: Specific chord choices, harmonic color
 */
export const OP_SUBSTITUTE_CHORD: EditOpcode = {
  id: createOpcodeId('substitute_chord'),
  name: 'Substitute Chord',
  description:
    'Replace a chord with a functional substitute. Uses theory-based rules ' +
    'for common substitutions while preserving harmonic motion.',
  params: [
    {
      name: 'target_chord',
      type: 'entity_ref',
      required: true,
      description: 'The chord to substitute',
    },
    {
      name: 'substitution_type',
      type: 'string',
      required: false,
      description: 'Type of substitution',
      enumValues: [
        'tritone',
        'relative',
        'secondary_dominant',
        'parallel',
        'modal_interchange',
        'extended_dominant',
        'diminished_approach',
        'auto',
      ],
      defaultValue: 'auto',
    },
    {
      name: 'preserve_melody',
      type: 'boolean',
      required: false,
      description: 'Ensure substitute is compatible with melody',
      defaultValue: true,
    },
    {
      name: 'preserve_function',
      type: 'boolean',
      required: false,
      description: 'Keep same harmonic function (tonic/dominant/subdominant)',
      defaultValue: true,
    },
  ],
  affects: ['event', 'harmony'],
  effectType: 'mutate',
  cost: 'medium',
  requiresCapabilities: ['harmony_editing', 'theory_analysis'],
  affectsAxes: [createAxisId('harmonic_color'), createAxisId('chromaticism')],
  preconditions: [
    'target chord must exist and be identifiable',
    'key context must be established',
  ],
  postconditions: [
    'chord replaced with functional substitute',
    'harmonic motion preserved or enhanced',
    'melody compatibility maintained if specified',
  ],
};

/**
 * OP_TRITONE_SUBSTITUTION — Apply tritone substitution to dominant chords
 *
 * Replaces dominant seventh chords with dominants a tritone away,
 * a common jazz reharmonization technique.
 *
 * Preserves: Harmonic function, resolution tendency
 * Affects: Chord root, harmonic color
 */
export const OP_TRITONE_SUBSTITUTION: EditOpcode = {
  id: createOpcodeId('tritone_substitution'),
  name: 'Tritone Substitution',
  description:
    'Replace dominant chords with tritone substitutes. ' +
    'Common jazz technique that preserves resolution while changing harmonic color.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which dominant chords to substitute',
    },
    {
      name: 'apply_to_all',
      type: 'boolean',
      required: false,
      description: 'Apply to all dominant chords in scope',
      defaultValue: false,
    },
    {
      name: 'preserve_melody',
      type: 'boolean',
      required: false,
      description: 'Only substitute when compatible with melody',
      defaultValue: true,
    },
  ],
  affects: ['event', 'harmony'],
  effectType: 'mutate',
  cost: 'medium',
  requiresCapabilities: ['harmony_editing', 'theory_analysis'],
  affectsAxes: [createAxisId('harmonic_color'), createAxisId('chromaticism'), createAxisId('jazz')],
  preconditions: ['scope must contain dominant chords'],
  postconditions: [
    'dominant chords replaced with tritone substitutes',
    'resolution preserved',
    'melody compatibility maintained',
  ],
};

/**
 * OP_MODAL_INTERCHANGE — Borrow chords from parallel keys/modes
 *
 * Introduces chords from parallel modes (e.g., borrowing from minor in a
 * major key) for harmonic variety.
 *
 * Preserves: Overall tonality (usually)
 * Affects: Harmonic color, modal flavor
 */
export const OP_MODAL_INTERCHANGE: EditOpcode = {
  id: createOpcodeId('modal_interchange'),
  name: 'Modal Interchange',
  description:
    'Borrow chords from parallel keys or modes. ' +
    'Introduces modal color while maintaining tonal center.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Harmonic progression to modify',
    },
    {
      name: 'source_mode',
      type: 'string',
      required: false,
      description: 'Which parallel mode to borrow from',
      enumValues: [
        'parallel_minor',
        'parallel_major',
        'dorian',
        'phrygian',
        'lydian',
        'mixolydian',
        'locrian',
        'auto',
      ],
      defaultValue: 'auto',
    },
    {
      name: 'degree_targets',
      type: 'string',
      required: false,
      description: 'Which scale degrees to substitute (comma-separated)',
    },
    {
      name: 'intensity',
      type: 'string',
      required: false,
      description: 'How many chords to borrow',
      enumValues: ['sparse', 'moderate', 'frequent'],
      defaultValue: 'moderate',
    },
  ],
  affects: ['event', 'harmony'],
  effectType: 'mutate',
  cost: 'medium',
  requiresCapabilities: ['harmony_editing', 'theory_analysis'],
  affectsAxes: [
    createAxisId('harmonic_color'),
    createAxisId('modal_flavor'),
    createAxisId('darkness'),
  ],
  preconditions: ['scope must contain harmonic progression', 'key must be established'],
  postconditions: [
    'borrowed chords introduced',
    'tonal center generally preserved',
    'modal color added',
  ],
};

// =============================================================================
// Functional Reharmonization
// =============================================================================

/**
 * OP_REHARMONIZE_FUNCTIONAL — Reharmonize using functional harmony principles
 *
 * Replaces the entire harmonic progression while preserving melody,
 * using functional harmony principles (tonic-subdominant-dominant).
 *
 * Preserves: Melody, overall harmonic direction
 * Affects: Specific chord choices, harmonic rhythm
 */
export const OP_REHARMONIZE_FUNCTIONAL: EditOpcode = {
  id: createOpcodeId('reharmonize_functional'),
  name: 'Functional Reharmonization',
  description:
    'Replace harmonic progression using functional harmony principles. ' +
    'Preserves melody while creating new chord choices.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Section to reharmonize',
    },
    {
      name: 'harmonic_style',
      type: 'string',
      required: false,
      description: 'Style of reharmonization',
      enumValues: ['classical', 'jazz', 'pop', 'gospel', 'contemporary', 'impressionist'],
      defaultValue: 'jazz',
    },
    {
      name: 'preserve_melody_exact',
      type: 'boolean',
      required: false,
      description: 'Melody must be fully supported by new harmony',
      defaultValue: true,
    },
    {
      name: 'preserve_cadences',
      type: 'boolean',
      required: false,
      description: 'Keep cadence points unchanged',
      defaultValue: true,
    },
    {
      name: 'harmonic_rhythm',
      type: 'string',
      required: false,
      description: 'How often chords change',
      enumValues: ['preserve', 'faster', 'slower', 'vary'],
      defaultValue: 'preserve',
    },
    {
      name: 'chromaticism_level',
      type: 'string',
      required: false,
      description: 'How chromatic the reharmonization should be',
      enumValues: ['diatonic', 'moderate', 'chromatic', 'very_chromatic'],
      defaultValue: 'moderate',
    },
  ],
  affects: ['event', 'harmony'],
  effectType: 'mutate',
  cost: 'high',
  requiresCapabilities: ['harmony_editing', 'theory_analysis', 'advanced_reharmonization'],
  affectsAxes: [
    createAxisId('harmonic_color'),
    createAxisId('complexity'),
    createAxisId('chromaticism'),
  ],
  preconditions: [
    'scope must contain harmonic progression',
    'melody must be identifiable',
    'key context must be established',
  ],
  postconditions: [
    'new harmonic progression created',
    'melody preserved and supported',
    'functional harmony maintained',
    'style matches specification',
  ],
};

/**
 * OP_ADD_PASSING_CHORDS — Insert passing chords between existing chords
 *
 * Adds chords between existing harmonies to create smoother motion
 * or increase harmonic rhythm.
 *
 * Preserves: Original chords, overall function
 * Affects: Harmonic rhythm, voice leading smoothness
 */
export const OP_ADD_PASSING_CHORDS: EditOpcode = {
  id: createOpcodeId('add_passing_chords'),
  name: 'Add Passing Chords',
  description:
    'Insert passing chords between existing harmonies. ' +
    'Creates smoother harmonic motion and increases harmonic rhythm.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Harmonic progression to embellish',
    },
    {
      name: 'passing_chord_types',
      type: 'string',
      required: false,
      description: 'Types of passing chords to use',
      enumValues: ['diatonic', 'chromatic', 'diminished', 'mixed', 'auto'],
      defaultValue: 'auto',
    },
    {
      name: 'density',
      type: 'string',
      required: false,
      description: 'How many passing chords to add',
      enumValues: ['sparse', 'moderate', 'dense'],
      defaultValue: 'moderate',
    },
    {
      name: 'preserve_melody',
      type: 'boolean',
      required: false,
      description: 'Ensure passing chords support melody',
      defaultValue: true,
    },
  ],
  affects: ['event', 'harmony'],
  effectType: 'mutate',
  cost: 'medium',
  requiresCapabilities: ['harmony_editing', 'theory_analysis'],
  affectsAxes: [
    createAxisId('harmonic_rhythm'),
    createAxisId('smoothness'),
    createAxisId('complexity'),
  ],
  preconditions: ['scope must contain harmonic progression with space for additions'],
  postconditions: [
    'passing chords inserted',
    'harmonic motion smoother',
    'harmonic rhythm increased',
    'original chords preserved',
  ],
};

/**
 * OP_REMOVE_PASSING_CHORDS — Simplify harmony by removing passing chords
 *
 * Identifies and removes passing harmonies, reducing harmonic rhythm
 * and simplifying the progression.
 *
 * Preserves: Structural chords
 * Affects: Harmonic rhythm, complexity
 */
export const OP_REMOVE_PASSING_CHORDS: EditOpcode = {
  id: createOpcodeId('remove_passing_chords'),
  name: 'Remove Passing Chords',
  description:
    'Identify and remove passing chords, simplifying harmonic progression. ' +
    'Reduces harmonic rhythm and complexity.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Harmonic progression to simplify',
    },
    {
      name: 'aggressiveness',
      type: 'string',
      required: false,
      description: 'How aggressively to remove chords',
      enumValues: ['conservative', 'moderate', 'aggressive'],
      defaultValue: 'moderate',
    },
    {
      name: 'preserve_cadences',
      type: 'boolean',
      required: false,
      description: 'Never remove chords from cadences',
      defaultValue: true,
    },
  ],
  affects: ['event', 'harmony'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [
    createAxisId('harmonic_rhythm'),
    createAxisId('simplicity'),
    createAxisId('space'),
  ],
  preconditions: ['scope must contain harmonic progression'],
  postconditions: [
    'passing chords removed',
    'harmonic rhythm reduced',
    'progression simplified',
    'structural harmony preserved',
  ],
};

// =============================================================================
// Bass Line Manipulation
// =============================================================================

/**
 * OP_ALTER_BASS_LINE — Modify bass line while preserving upper harmony
 *
 * Changes bass notes (roots, inversions, pedal tones, chromatic motion)
 * while keeping upper voices unchanged.
 *
 * Preserves: Upper harmony
 * Affects: Bass motion, chord inversions, harmonic weight
 */
export const OP_ALTER_BASS_LINE: EditOpcode = {
  id: createOpcodeId('alter_bass_line'),
  name: 'Alter Bass Line',
  description:
    'Modify bass line by changing roots, inversions, or adding passing tones. ' +
    'Upper harmony remains unchanged.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Bass line to modify',
    },
    {
      name: 'alteration_type',
      type: 'string',
      required: false,
      description: 'Type of bass alteration',
      enumValues: [
        'inversions',
        'chromatic_passing',
        'diatonic_passing',
        'pedal_point',
        'walking',
        'auto',
      ],
      defaultValue: 'auto',
    },
    {
      name: 'motion_preference',
      type: 'string',
      required: false,
      description: 'Preferred bass motion style',
      enumValues: ['smooth', 'disjunct', 'mixed', 'walking'],
      defaultValue: 'smooth',
    },
    {
      name: 'preserve_strong_beats',
      type: 'boolean',
      required: false,
      description: 'Keep bass notes on downbeats unchanged',
      defaultValue: false,
    },
  ],
  affects: ['event', 'harmony'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [
    createAxisId('bass_motion'),
    createAxisId('harmonic_weight'),
    createAxisId('groove'),
  ],
  preconditions: ['scope must contain bass line', 'upper harmony must be identifiable'],
  postconditions: [
    'bass line modified as specified',
    'upper harmony preserved',
    'inversions or passing tones added',
  ],
};

/**
 * OP_ADD_PEDAL_POINT — Create pedal point (sustained bass note)
 *
 * Sustains a bass note while harmony changes above it, creating
 * tension and release.
 *
 * Preserves: Upper harmony
 * Affects: Bass line, harmonic tension
 */
export const OP_ADD_PEDAL_POINT: EditOpcode = {
  id: createOpcodeId('add_pedal_point'),
  name: 'Add Pedal Point',
  description:
    'Create a pedal point by sustaining a bass note while harmony changes above. ' +
    'Creates tension and a sense of grounding.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Where to apply pedal point',
    },
    {
      name: 'pedal_note',
      type: 'string',
      required: false,
      description: 'Which note to sustain (e.g., "tonic", "dominant", or specific pitch)',
      defaultValue: 'tonic',
    },
    {
      name: 'articulation',
      type: 'string',
      required: false,
      description: 'How to articulate the pedal',
      enumValues: ['sustained', 'repeated', 'rhythmic_pattern'],
      defaultValue: 'sustained',
    },
  ],
  affects: ['event', 'harmony'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('grounding'), createAxisId('tension'), createAxisId('drone')],
  preconditions: ['scope must contain harmonic progression'],
  postconditions: [
    'pedal point created',
    'bass note sustained or repeated',
    'upper harmony unchanged',
  ],
};

// =============================================================================
// Harmonic Rhythm
// =============================================================================

/**
 * OP_ADJUST_HARMONIC_RHYTHM — Change rate of chord changes
 *
 * Speeds up or slows down how frequently chords change, affecting
 * harmonic momentum and complexity.
 *
 * Preserves: Chord choices (or adapts them intelligently)
 * Affects: Harmonic rhythm, momentum
 */
export const OP_ADJUST_HARMONIC_RHYTHM: EditOpcode = {
  id: createOpcodeId('adjust_harmonic_rhythm'),
  name: 'Adjust Harmonic Rhythm',
  description:
    'Change the rate of chord changes. Can speed up or slow down harmonic rhythm, ' +
    'affecting momentum and complexity.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Harmonic progression to modify',
    },
    {
      name: 'change_rate',
      type: 'string',
      required: true,
      description: 'How to adjust rhythm',
      enumValues: ['half_speed', 'double_speed', 'vary', 'target_rate'],
    },
    {
      name: 'target_changes_per_bar',
      type: 'number',
      required: false,
      description: 'Target chord changes per bar (if change_rate = target_rate)',
      validation: { min: 0.25, max: 16 },
    },
    {
      name: 'adapt_chords',
      type: 'boolean',
      required: false,
      description: 'Add or remove chords as needed to match rate',
      defaultValue: true,
    },
  ],
  affects: ['event', 'harmony'],
  effectType: 'mutate',
  cost: 'medium',
  requiresCapabilities: ['harmony_editing'],
  affectsAxes: [
    createAxisId('harmonic_rhythm'),
    createAxisId('momentum'),
    createAxisId('complexity'),
  ],
  preconditions: ['scope must contain harmonic progression'],
  postconditions: [
    'harmonic rhythm adjusted to target rate',
    'chord changes redistributed',
    'harmony adapted if necessary',
  ],
};

// =============================================================================
// Secondary Harmony
// =============================================================================

/**
 * OP_ADD_SECONDARY_DOMINANTS — Insert secondary dominant chords
 *
 * Adds dominant chords that tonicize upcoming chords, creating
 * momentary key changes and harmonic momentum.
 *
 * Preserves: Original chord destinations
 * Affects: Harmonic rhythm, forward momentum, key sense
 */
export const OP_ADD_SECONDARY_DOMINANTS: EditOpcode = {
  id: createOpcodeId('add_secondary_dominants'),
  name: 'Add Secondary Dominants',
  description:
    'Insert secondary dominant chords that tonicize upcoming harmonies. ' +
    'Creates harmonic momentum and momentary key shifts.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Harmonic progression to embellish',
    },
    {
      name: 'target_degrees',
      type: 'string',
      required: false,
      description: 'Which scale degrees to tonicize (comma-separated)',
    },
    {
      name: 'density',
      type: 'string',
      required: false,
      description: 'How many secondary dominants to add',
      enumValues: ['sparse', 'moderate', 'dense'],
      defaultValue: 'moderate',
    },
    {
      name: 'include_ii_v',
      type: 'boolean',
      required: false,
      description: 'Use ii-V progressions instead of just V',
      defaultValue: false,
    },
  ],
  affects: ['event', 'harmony'],
  effectType: 'mutate',
  cost: 'medium',
  requiresCapabilities: ['harmony_editing', 'theory_analysis'],
  affectsAxes: [
    createAxisId('harmonic_momentum'),
    createAxisId('chromaticism'),
    createAxisId('tension'),
  ],
  preconditions: ['scope must contain harmonic progression', 'key must be established'],
  postconditions: [
    'secondary dominants inserted',
    'tonicizations created',
    'harmonic momentum increased',
  ],
};

// =============================================================================
// Export
// =============================================================================

/**
 * All harmony editing opcodes.
 */
export const HARMONY_OPCODES: readonly EditOpcode[] = [
  OP_REVOICE_CHORDS,
  OP_OPTIMIZE_VOICE_LEADING,
  OP_ADJUST_CHORD_DENSITY,
  OP_ADD_CHORD_EXTENSIONS,
  OP_REMOVE_CHORD_EXTENSIONS,
  OP_ALTER_CHORD_TONES,
  OP_SUBSTITUTE_CHORD,
  OP_TRITONE_SUBSTITUTION,
  OP_MODAL_INTERCHANGE,
  OP_REHARMONIZE_FUNCTIONAL,
  OP_ADD_PASSING_CHORDS,
  OP_REMOVE_PASSING_CHORDS,
  OP_ALTER_BASS_LINE,
  OP_ADD_PEDAL_POINT,
  OP_ADJUST_HARMONIC_RHYTHM,
  OP_ADD_SECONDARY_DOMINANTS,
] as const;

/**
 * Harmony opcode count: 16 comprehensive opcodes for harmonic manipulation.
 */
export const HARMONY_OPCODE_COUNT = HARMONY_OPCODES.length;
