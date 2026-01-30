/**
 * GOFAI Edit Opcodes — Register and Pitch Operations (Batch 2)
 *
 * Step 252 continued: Opcodes for register shifts, transposition,
 * pitch range adjustments, and vertical spacing manipulations.
 *
 * These opcodes enable perceptual goals like "lift" (raise register),
 * "heavier" (lower register), "wider" (spread vertically), "tighter"
 * (compress register), etc.
 *
 * @module gofai/canon/edit-opcodes-register-pitch
 */

import type { EditOpcode, OpcodeId } from './types';
import { createOpcodeId, createAxisId } from './types';

// =============================================================================
// Register Manipulation Opcodes
// =============================================================================

/**
 * OP_RAISE_REGISTER — Shift pitch content upward
 *
 * Transposes events upward by octaves or specific intervals.
 * Increases perceived "lift" and brightness.
 */
export const OP_RAISE_REGISTER: EditOpcode = {
  id: createOpcodeId('raise_register'),
  name: 'Raise Register',
  description:
    'Shift pitch content upward, increasing perceived lift and brightness. ' +
    'Can transpose by octaves or specific intervals.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to raise',
    },
    {
      name: 'amount',
      type: 'amount',
      required: true,
      description: 'How much to raise (tiny=3st, small=7st, moderate=12st, large=24st)',
      defaultValue: 'moderate',
    },
    {
      name: 'semitones',
      type: 'number',
      required: false,
      description: 'Explicit semitone shift (overrides amount)',
    },
    {
      name: 'preserve_voicing_intervals',
      type: 'boolean',
      required: false,
      description: 'Maintain internal intervals between voices',
      defaultValue: true,
    },
    {
      name: 'respect_range_limits',
      type: 'boolean',
      required: false,
      description: 'Stay within instrument/vocal range',
      defaultValue: true,
    },
  ],
  preconditions: [
    'scope_has_notes',
    'room_to_raise_register',
  ],
  postconditions: [
    'pitch_content_raised',
    'voicing_preserved_if_requested',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('lift'), createAxisId('brightness'), createAxisId('lightness')],
};

/**
 * OP_LOWER_REGISTER — Shift pitch content downward
 *
 * Transposes events downward. Increases perceived weight and darkness.
 */
export const OP_LOWER_REGISTER: EditOpcode = {
  id: createOpcodeId('lower_register'),
  name: 'Lower Register',
  description:
    'Shift pitch content downward, increasing perceived weight and darkness. ' +
    'Useful for grounding, heaviness, or contrast with higher sections.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to lower',
    },
    {
      name: 'amount',
      type: 'amount',
      required: true,
      description: 'How much to lower',
      defaultValue: 'moderate',
    },
    {
      name: 'semitones',
      type: 'number',
      required: false,
      description: 'Explicit semitone shift',
    },
    {
      name: 'preserve_voicing_intervals',
      type: 'boolean',
      required: false,
      description: 'Maintain internal intervals',
      defaultValue: true,
    },
    {
      name: 'respect_range_limits',
      type: 'boolean',
      required: false,
      description: 'Stay within playable range',
      defaultValue: true,
    },
  ],
  preconditions: [
    'scope_has_notes',
    'room_to_lower_register',
  ],
  postconditions: [
    'pitch_content_lowered',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('weight'), createAxisId('darkness'), createAxisId('grounding')],
};

/**
 * OP_WIDEN_REGISTER_SPREAD — Increase vertical spacing between voices
 *
 * Increases the register span by moving outer voices farther apart.
 * Creates a more spacious, grand feel.
 */
export const OP_WIDEN_REGISTER_SPREAD: EditOpcode = {
  id: createOpcodeId('widen_register_spread'),
  name: 'Widen Register Spread',
  description:
    'Increase vertical spacing between voices, moving top voice higher ' +
    'and/or bass voice lower. Creates more spacious, open sound.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which chord voicings to widen',
    },
    {
      name: 'amount',
      type: 'amount',
      required: true,
      description: 'How much to widen',
      defaultValue: 'moderate',
    },
    {
      name: 'strategy',
      type: 'enum',
      required: false,
      enumValues: ['symmetric', 'raise_top', 'lower_bass', 'smart'],
      description: 'How to distribute widening',
      defaultValue: 'smart',
    },
    {
      name: 'preserve_inner_voices',
      type: 'boolean',
      required: false,
      description: 'Keep middle voices in place',
      defaultValue: false,
    },
  ],
  preconditions: [
    'scope_has_harmony',
    'room_to_widen',
  ],
  postconditions: [
    'register_spread_increased',
    'outer_voices_separated',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('spaciousness'), createAxisId('grandeur'), createAxisId('openness')],
};

/**
 * OP_NARROW_REGISTER_SPREAD — Reduce vertical spacing
 *
 * Brings voices closer together in register. Creates more compact,
 * intimate sound.
 */
export const OP_NARROW_REGISTER_SPREAD: EditOpcode = {
  id: createOpcodeId('narrow_register_spread'),
  name: 'Narrow Register Spread',
  description:
    'Reduce vertical spacing between voices, bringing them closer in register. ' +
    'Creates more compact, intimate sound.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which voicings to narrow',
    },
    {
      name: 'amount',
      type: 'amount',
      required: true,
      description: 'How much to narrow',
      defaultValue: 'moderate',
    },
    {
      name: 'strategy',
      type: 'enum',
      required: false,
      enumValues: ['symmetric', 'lower_top', 'raise_bass', 'compress_all'],
      description: 'How to distribute narrowing',
      defaultValue: 'compress_all',
    },
  ],
  preconditions: [
    'scope_has_harmony',
    'sufficient_spread_to_narrow',
  ],
  postconditions: [
    'register_spread_decreased',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('intimacy'), createAxisId('closeness'), createAxisId('compactness')],
};

/**
 * OP_TRANSPOSE_TO_KEY — Transpose to new key center
 *
 * Changes the tonal center while preserving intervals and voicings.
 * Updates key signature metadata.
 */
export const OP_TRANSPOSE_TO_KEY: EditOpcode = {
  id: createOpcodeId('transpose_to_key'),
  name: 'Transpose to Key',
  description:
    'Transpose entire scope to a new key center. Preserves intervals ' +
    'and updates key signature metadata.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'What to transpose',
    },
    {
      name: 'target_key',
      type: 'string',
      required: true,
      description: 'Destination key (e.g., "C major", "F# minor")',
    },
    {
      name: 'mode',
      type: 'enum',
      required: false,
      enumValues: ['chromatic', 'diatonic', 'modal'],
      description: 'Transposition mode',
      defaultValue: 'chromatic',
    },
    {
      name: 'preserve_mode',
      type: 'boolean',
      required: false,
      description: 'Keep same mode (major/minor)',
      defaultValue: true,
    },
  ],
  preconditions: [
    'scope_has_notes',
    'current_key_determinable',
  ],
  postconditions: [
    'all_notes_transposed',
    'key_signature_updated',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('key'), createAxisId('tonality')],
};

/**
 * OP_SHIFT_MELODIC_CONTOUR — Adjust melodic shape
 *
 * Modifies the contour (ascending/descending trajectory) of a melodic line
 * while preserving rhythmic structure and approximate intervals.
 */
export const OP_SHIFT_MELODIC_CONTOUR: EditOpcode = {
  id: createOpcodeId('shift_melodic_contour'),
  name: 'Shift Melodic Contour',
  description:
    'Adjust the overall shape of a melody (ascending, descending, arch, valley). ' +
    'Preserves rhythm and approximate interval relationships.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which melodic line to adjust',
    },
    {
      name: 'target_contour',
      type: 'enum',
      required: true,
      enumValues: ['ascending', 'descending', 'arch', 'valley', 'wave'],
      description: 'Desired contour shape',
    },
    {
      name: 'strength',
      type: 'amount',
      required: false,
      description: 'How strongly to reshape',
      defaultValue: 'moderate',
    },
    {
      name: 'preserve_climax',
      type: 'boolean',
      required: false,
      description: 'Keep highest/lowest points intact',
      defaultValue: true,
    },
  ],
  preconditions: [
    'scope_is_melodic',
  ],
  postconditions: [
    'contour_matches_target',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'high',
  affectsAxes: [createAxisId('contour'), createAxisId('shape'), createAxisId('direction')],
};

/**
 * OP_COMPRESS_PITCH_RANGE — Reduce melodic/harmonic range
 *
 * Brings pitches closer to a central pitch or mean. Reduces overall
 * pitch excursion.
 */
export const OP_COMPRESS_PITCH_RANGE: EditOpcode = {
  id: createOpcodeId('compress_pitch_range'),
  name: 'Compress Pitch Range',
  description:
    'Reduce the overall pitch range by bringing notes closer to the mean pitch. ' +
    'Makes melodies less extreme, more contained.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to compress',
    },
    {
      name: 'target_range_semitones',
      type: 'number',
      required: false,
      description: 'Target range in semitones',
    },
    {
      name: 'compression_factor',
      type: 'number',
      required: false,
      description: 'Compression ratio (0.5 = half the original range)',
      defaultValue: 0.7,
    },
    {
      name: 'anchor_pitch',
      type: 'number',
      required: false,
      description: 'Central pitch to compress toward (MIDI note)',
    },
  ],
  preconditions: [
    'scope_has_notes',
  ],
  postconditions: [
    'pitch_range_reduced',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('range'), createAxisId('contour'), createAxisId('restraint')],
};

/**
 * OP_EXPAND_PITCH_RANGE — Increase melodic/harmonic range
 *
 * Spreads pitches away from center. Makes melodies more dramatic
 * and harmonies more spread.
 */
export const OP_EXPAND_PITCH_RANGE: EditOpcode = {
  id: createOpcodeId('expand_pitch_range'),
  name: 'Expand Pitch Range',
  description:
    'Increase the overall pitch range by spreading notes away from mean pitch. ' +
    'Makes melodies more dramatic, harmonies more spread.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to expand',
    },
    {
      name: 'target_range_semitones',
      type: 'number',
      required: false,
      description: 'Target range in semitones',
    },
    {
      name: 'expansion_factor',
      type: 'number',
      required: false,
      description: 'Expansion ratio (1.5 = 50% wider)',
      defaultValue: 1.3,
    },
    {
      name: 'anchor_pitch',
      type: 'number',
      required: false,
      description: 'Central pitch to expand from',
    },
    {
      name: 'respect_range_limits',
      type: 'boolean',
      required: false,
      description: 'Clamp to instrument range',
      defaultValue: true,
    },
  ],
  preconditions: [
    'scope_has_notes',
    'room_to_expand',
  ],
  postconditions: [
    'pitch_range_increased',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('range'), createAxisId('drama'), createAxisId('expressiveness')],
};

/**
 * OP_OCTAVE_DISPLACEMENT — Move phrases up/down by octaves
 *
 * Strategic octave shifts for voice leading, contrast, or register color.
 */
export const OP_OCTAVE_DISPLACEMENT: EditOpcode = {
  id: createOpcodeId('octave_displacement'),
  name: 'Octave Displacement',
  description:
    'Move selected phrases or voices up/down by one or more octaves. ' +
    'Useful for register contrast and voice leading adjustments.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to displace',
    },
    {
      name: 'octaves',
      type: 'number',
      required: true,
      description: 'How many octaves (+/- for direction)',
    },
    {
      name: 'selective',
      type: 'boolean',
      required: false,
      description: 'Only displace notes outside a target range',
      defaultValue: false,
    },
  ],
  preconditions: [
    'scope_has_notes',
  ],
  postconditions: [
    'notes_displaced_by_octaves',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('register'), createAxisId('color'), createAxisId('contrast')],
};

/**
 * OP_INVERT_MELODIC_INTERVALS — Flip melodic direction
 *
 * Inverts ascending intervals to descending (and vice versa).
 * Creates mirror-image melodies.
 */
export const OP_INVERT_MELODIC_INTERVALS: EditOpcode = {
  id: createOpcodeId('invert_melodic_intervals'),
  name: 'Invert Melodic Intervals',
  description:
    'Flip the direction of melodic intervals (ascending becomes descending). ' +
    'Creates melodic inversions and mirror shapes.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which melodic line to invert',
    },
    {
      name: 'axis_pitch',
      type: 'number',
      required: false,
      description: 'Pitch to invert around (MIDI note)',
    },
    {
      name: 'preserve_rhythm',
      type: 'boolean',
      required: false,
      description: 'Keep rhythmic structure',
      defaultValue: true,
    },
  ],
  preconditions: [
    'scope_is_melodic',
  ],
  postconditions: [
    'intervals_inverted',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('transformation'), createAxisId('variation')],
};

/**
 * OP_CHROMATIC_SHIFT — Shift by semitones (non-diatonic)
 *
 * Pure chromatic transposition without regard for key. Useful for
 * creating tension or color shifts.
 */
export const OP_CHROMATIC_SHIFT: EditOpcode = {
  id: createOpcodeId('chromatic_shift'),
  name: 'Chromatic Shift',
  description:
    'Transpose by exact semitones without regard for key or mode. ' +
    'Creates chromatic color shifts and modulations.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'What to shift',
    },
    {
      name: 'semitones',
      type: 'number',
      required: true,
      description: 'Exact semitone shift (+/-)',
    },
    {
      name: 'preserve_accidentals',
      type: 'boolean',
      required: false,
      description: 'Maintain enharmonic spelling',
      defaultValue: false,
    },
  ],
  preconditions: [
    'scope_has_notes',
  ],
  postconditions: [
    'pitches_shifted_chromatically',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('chromaticism'), createAxisId('color'), createAxisId('modulation')],
};

/**
 * OP_DIATONIC_SHIFT — Shift by scale degrees
 *
 * Transposes within the current key by scale degrees. Maintains
 * diatonic relationships.
 */
export const OP_DIATONIC_SHIFT: EditOpcode = {
  id: createOpcodeId('diatonic_shift'),
  name: 'Diatonic Shift',
  description:
    'Transpose by scale degrees within the current key. Maintains ' +
    'diatonic relationships and modal quality.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'What to shift',
    },
    {
      name: 'degrees',
      type: 'number',
      required: true,
      description: 'How many scale degrees (+/-)',
    },
    {
      name: 'key_context',
      type: 'string',
      required: false,
      description: 'Key to use (defaults to current)',
    },
  ],
  preconditions: [
    'scope_has_notes',
    'key_context_available',
  ],
  postconditions: [
    'pitches_shifted_diatonically',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('key'), createAxisId('mode'), createAxisId('tonality')],
};

// =============================================================================
// Opcode Registry for Register/Pitch
// =============================================================================

export const REGISTER_PITCH_OPCODES = [
  OP_RAISE_REGISTER,
  OP_LOWER_REGISTER,
  OP_WIDEN_REGISTER_SPREAD,
  OP_NARROW_REGISTER_SPREAD,
  OP_TRANSPOSE_TO_KEY,
  OP_SHIFT_MELODIC_CONTOUR,
  OP_COMPRESS_PITCH_RANGE,
  OP_EXPAND_PITCH_RANGE,
  OP_OCTAVE_DISPLACEMENT,
  OP_INVERT_MELODIC_INTERVALS,
  OP_CHROMATIC_SHIFT,
  OP_DIATONIC_SHIFT,
] as const;

export function getRegisterPitchOpcodeIds(): OpcodeId[] {
  return REGISTER_PITCH_OPCODES.map((op) => op.id);
}

export function getRegisterPitchOpcode(id: OpcodeId): EditOpcode | undefined {
  return REGISTER_PITCH_OPCODES.find((op) => op.id === id);
}
