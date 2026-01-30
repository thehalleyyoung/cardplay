/**
 * GOFAI Edit Opcodes — Rhythm, Timing, and Groove (Batch 3)
 *
 * Step 277: Opcodes for swing, quantization, humanization, timing shifts,
 * and rhythmic transformations.
 *
 * These enable goals like "tighter groove", "more swing", "less mechanical",
 * "halftime feel", "doubletime", "syncopated", etc.
 *
 * @module gofai/canon/edit-opcodes-rhythm-timing
 */

import type { EditOpcode, OpcodeId } from './types';
import { createOpcodeId, createAxisId } from './types';

// =============================================================================
// Quantization and Timing Adjustment
// =============================================================================

/**
 * OP_QUANTIZE — Snap notes to grid
 *
 * Aligns note onsets to nearest grid subdivision. Tightens timing.
 */
export const OP_QUANTIZE: EditOpcode = {
  id: createOpcodeId('quantize'),
  name: 'Quantize',
  description:
    'Snap note onsets to nearest grid subdivision. Tightens timing and ' +
    'creates more mechanical, precise feel.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to quantize',
    },
    {
      name: 'grid',
      type: 'enum',
      required: false,
      enumValues: ['whole', 'half', 'quarter', 'eighth', 'sixteenth', 'thirty_second'],
      description: 'Quantization grid',
      defaultValue: 'sixteenth',
    },
    {
      name: 'strength',
      type: 'number',
      required: false,
      description: 'Quantize strength (0-1, 1=full snap)',
      defaultValue: 1.0,
    },
    {
      name: 'preserve_groove',
      type: 'boolean',
      required: false,
      description: 'Keep intentional timing variations',
      defaultValue: false,
    },
  ],
  preconditions: [
    'scope_has_notes',
  ],
  postconditions: [
    'timing_aligned_to_grid',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('tightness'), createAxisId('precision'), createAxisId('mechanical')],
};

/**
 * OP_HUMANIZE — Add timing and velocity variations
 *
 * Introduces subtle random variations to make performances less mechanical.
 */
export const OP_HUMANIZE: EditOpcode = {
  id: createOpcodeId('humanize'),
  name: 'Humanize',
  description:
    'Add subtle random variations to timing and velocity. Makes performances ' +
    'less mechanical and more organic.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to humanize',
    },
    {
      name: 'timing_amount',
      type: 'amount',
      required: false,
      description: 'How much timing variation',
      defaultValue: 'small',
    },
    {
      name: 'velocity_amount',
      type: 'amount',
      required: false,
      description: 'How much velocity variation',
      defaultValue: 'small',
    },
    {
      name: 'preserve_downbeats',
      type: 'boolean',
      required: false,
      description: 'Keep downbeats locked',
      defaultValue: true,
    },
    {
      name: 'correlation',
      type: 'number',
      required: false,
      description: 'Correlation between timing and velocity (0-1)',
      defaultValue: 0.3,
    },
  ],
  preconditions: [
    'scope_has_notes',
  ],
  postconditions: [
    'timing_velocity_varied',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('humanness'), createAxisId('organic'), createAxisId('looseness')],
};

/**
 * OP_ADJUST_SWING — Add or adjust swing feel
 *
 * Delays or advances off-beat notes to create swing/shuffle feel.
 */
export const OP_ADJUST_SWING: EditOpcode = {
  id: createOpcodeId('adjust_swing'),
  name: 'Adjust Swing',
  description:
    'Add or adjust swing feel by delaying off-beat notes. Controls ' +
    'the ratio between on-beat and off-beat timing.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to swing',
    },
    {
      name: 'swing_amount',
      type: 'number',
      required: false,
      description: 'Swing percentage (0-100, 50=straight, 66=triplet feel)',
      defaultValue: 66,
    },
    {
      name: 'grid',
      type: 'enum',
      required: false,
      enumValues: ['eighth', 'sixteenth'],
      description: 'Which subdivision to swing',
      defaultValue: 'sixteenth',
    },
  ],
  preconditions: [
    'scope_has_notes',
  ],
  postconditions: [
    'swing_applied',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('swing'), createAxisId('groove'), createAxisId('shuffle')],
};

/**
 * OP_REMOVE_SWING — Straighten swung notes
 *
 * Removes swing by moving off-beat notes to exact subdivisions.
 */
export const OP_REMOVE_SWING: EditOpcode = {
  id: createOpcodeId('remove_swing'),
  name: 'Remove Swing',
  description:
    'Remove swing by aligning off-beat notes to exact subdivisions. ' +
    'Creates straighter, more mechanical feel.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to straighten',
    },
    {
      name: 'strength',
      type: 'number',
      required: false,
      description: 'How much to straighten (0-1)',
      defaultValue: 1.0,
    },
  ],
  preconditions: [
    'scope_has_notes',
  ],
  postconditions: [
    'timing_straightened',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('straightness'), createAxisId('precision')],
};

/**
 * OP_SHIFT_TIMING — Nudge events earlier or later
 *
 * Shifts timing by small amounts (micro-timing adjustments).
 * Different from move (which is large structural shifts).
 */
export const OP_SHIFT_TIMING: EditOpcode = {
  id: createOpcodeId('shift_timing'),
  name: 'Shift Timing',
  description:
    'Nudge events slightly earlier or later. Micro-timing adjustments ' +
    'for groove feel and rhythmic pocket.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to shift',
    },
    {
      name: 'ticks',
      type: 'number',
      required: true,
      description: 'How many ticks to shift (+/- for direction)',
    },
    {
      name: 'preserve_grid_alignment',
      type: 'boolean',
      required: false,
      description: 'Keep downbeats on grid',
      defaultValue: false,
    },
  ],
  preconditions: [
    'scope_has_notes',
  ],
  postconditions: [
    'timing_shifted',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('timing'), createAxisId('pocket'), createAxisId('feel')],
};

/**
 * OP_PUSH_TIMING — Make events anticipate the beat
 *
 * Shifts notes slightly ahead of the beat. Creates urgency and forward motion.
 */
export const OP_PUSH_TIMING: EditOpcode = {
  id: createOpcodeId('push_timing'),
  name: 'Push Timing',
  description:
    'Shift notes slightly ahead of the beat. Creates anticipation, ' +
    'urgency, and forward momentum.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to push',
    },
    {
      name: 'amount',
      type: 'amount',
      required: false,
      description: 'How much to push',
      defaultValue: 'small',
    },
  ],
  preconditions: [
    'scope_has_notes',
  ],
  postconditions: [
    'timing_pushed_ahead',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('urgency'), createAxisId('anticipation'), createAxisId('push')],
};

/**
 * OP_LAY_BACK_TIMING — Make events lag behind the beat
 *
 * Shifts notes slightly behind the beat. Creates relaxed, laid-back feel.
 */
export const OP_LAY_BACK_TIMING: EditOpcode = {
  id: createOpcodeId('lay_back_timing'),
  name: 'Lay Back Timing',
  description:
    'Shift notes slightly behind the beat. Creates relaxed, laid-back, ' +
    'or "in the pocket" feel.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to lay back',
    },
    {
      name: 'amount',
      type: 'amount',
      required: false,
      description: 'How much to lay back',
      defaultValue: 'small',
    },
  ],
  preconditions: [
    'scope_has_notes',
  ],
  postconditions: [
    'timing_laid_back',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('relaxation'), createAxisId('pocket'), createAxisId('lag')],
};

// =============================================================================
// Rhythmic Transformations
// =============================================================================

/**
 * OP_HALFTIME — Convert to half-time feel
 *
 * Doubles note durations and spacing. Makes rhythm feel slower/heavier.
 */
export const OP_HALFTIME: EditOpcode = {
  id: createOpcodeId('halftime'),
  name: 'Halftime',
  description:
    'Convert to half-time feel by doubling note durations and spacing. ' +
    'Makes rhythm feel slower and heavier without changing tempo.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to convert',
    },
    {
      name: 'preserve_downbeats',
      type: 'boolean',
      required: false,
      description: 'Keep original downbeat emphasis',
      defaultValue: true,
    },
  ],
  preconditions: [
    'scope_has_notes',
  ],
  postconditions: [
    'rhythm_doubled',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('tempo_feel'), createAxisId('weight'), createAxisId('space')],
};

/**
 * OP_DOUBLETIME — Convert to double-time feel
 *
 * Halves note durations and spacing. Makes rhythm feel faster/busier.
 */
export const OP_DOUBLETIME: EditOpcode = {
  id: createOpcodeId('doubletime'),
  name: 'Doubletime',
  description:
    'Convert to double-time feel by halving note durations and spacing. ' +
    'Makes rhythm feel faster and busier without changing tempo.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to convert',
    },
    {
      name: 'preserve_phrasing',
      type: 'boolean',
      required: false,
      description: 'Keep phrase boundaries intact',
      defaultValue: true,
    },
  ],
  preconditions: [
    'scope_has_notes',
    'room_for_double_time',
  ],
  postconditions: [
    'rhythm_halved',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('tempo_feel'), createAxisId('energy'), createAxisId('urgency')],
};

/**
 * OP_AUGMENT_RHYTHM — Lengthen note durations
 *
 * Increases note durations proportionally. Creates more sustained feel.
 */
export const OP_AUGMENT_RHYTHM: EditOpcode = {
  id: createOpcodeId('augment_rhythm'),
  name: 'Augment Rhythm',
  description:
    'Lengthen note durations proportionally. Creates more sustained, ' +
    'spacious rhythmic feel.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to augment',
    },
    {
      name: 'factor',
      type: 'number',
      required: false,
      description: 'Duration multiplier (e.g., 1.5, 2.0)',
      defaultValue: 1.5,
    },
    {
      name: 'adjust_gaps',
      type: 'boolean',
      required: false,
      description: 'Also lengthen gaps between notes',
      defaultValue: true,
    },
  ],
  preconditions: [
    'scope_has_notes',
  ],
  postconditions: [
    'durations_lengthened',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('sustain'), createAxisId('space'), createAxisId('legato')],
};

/**
 * OP_DIMINISH_RHYTHM — Shorten note durations
 *
 * Decreases note durations proportionally. Creates more staccato feel.
 */
export const OP_DIMINISH_RHYTHM: EditOpcode = {
  id: createOpcodeId('diminish_rhythm'),
  name: 'Diminish Rhythm',
  description:
    'Shorten note durations proportionally. Creates more staccato, ' +
    'detached rhythmic feel.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to diminish',
    },
    {
      name: 'factor',
      type: 'number',
      required: false,
      description: 'Duration multiplier (e.g., 0.5, 0.75)',
      defaultValue: 0.7,
    },
    {
      name: 'minimum_duration',
      type: 'number',
      required: false,
      description: 'Minimum duration in ticks',
      defaultValue: 10,
    },
  ],
  preconditions: [
    'scope_has_notes',
  ],
  postconditions: [
    'durations_shortened',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('staccato'), createAxisId('articulation'), createAxisId('detachment')],
};

/**
 * OP_SYNCOPATE — Add syncopation
 *
 * Shifts accents to off-beats, creating rhythmic tension and interest.
 */
export const OP_SYNCOPATE: EditOpcode = {
  id: createOpcodeId('syncopate'),
  name: 'Syncopate',
  description:
    'Add syncopation by shifting accents to off-beats. Creates rhythmic ' +
    'tension, surprise, and forward momentum.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to syncopate',
    },
    {
      name: 'amount',
      type: 'amount',
      required: false,
      description: 'How much syncopation to add',
      defaultValue: 'moderate',
    },
    {
      name: 'pattern',
      type: 'enum',
      required: false,
      enumValues: ['random', 'anticipation', 'displacement', 'smart'],
      description: 'Syncopation strategy',
      defaultValue: 'smart',
    },
  ],
  preconditions: [
    'scope_has_notes',
  ],
  postconditions: [
    'syncopation_added',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('syncopation'), createAxisId('tension'), createAxisId('surprise')],
};

/**
 * OP_STRAIGHTEN_SYNCOPATION — Remove syncopation
 *
 * Moves accents back to strong beats. Makes rhythm more predictable.
 */
export const OP_STRAIGHTEN_SYNCOPATION: EditOpcode = {
  id: createOpcodeId('straighten_syncopation'),
  name: 'Straighten Syncopation',
  description:
    'Remove syncopation by moving accents to strong beats. Makes rhythm ' +
    'more predictable and grounded.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to straighten',
    },
    {
      name: 'strength',
      type: 'number',
      required: false,
      description: 'How much to straighten (0-1)',
      defaultValue: 1.0,
    },
  ],
  preconditions: [
    'scope_has_notes',
  ],
  postconditions: [
    'syncopation_reduced',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('stability'), createAxisId('predictability')],
};

/**
 * OP_ADD_TRIPLET_FEEL — Convert to triplet subdivision
 *
 * Changes binary subdivisions to ternary (triplets). Creates shuffle/swing.
 */
export const OP_ADD_TRIPLET_FEEL: EditOpcode = {
  id: createOpcodeId('add_triplet_feel'),
  name: 'Add Triplet Feel',
  description:
    'Convert binary subdivisions to ternary (triplets). Creates shuffle ' +
    'or swing feel with 3:2 ratio.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to convert',
    },
    {
      name: 'base_note',
      type: 'enum',
      required: false,
      enumValues: ['quarter', 'eighth', 'sixteenth'],
      description: 'Which subdivision becomes triplets',
      defaultValue: 'eighth',
    },
  ],
  preconditions: [
    'scope_has_notes',
  ],
  postconditions: [
    'triplet_feel_applied',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('shuffle'), createAxisId('swing'), createAxisId('triplet')],
};

/**
 * OP_ADJUST_ARTICULATION — Change note separation
 *
 * Adjusts gaps between notes (legato to staccato).
 */
export const OP_ADJUST_ARTICULATION: EditOpcode = {
  id: createOpcodeId('adjust_articulation'),
  name: 'Adjust Articulation',
  description:
    'Adjust note separation from legato (connected) to staccato (detached). ' +
    'Changes how "choppy" or "smooth" the rhythm feels.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to adjust',
    },
    {
      name: 'target',
      type: 'enum',
      required: false,
      enumValues: ['legato', 'smooth', 'normal', 'detached', 'staccato'],
      description: 'Target articulation style',
      defaultValue: 'normal',
    },
    {
      name: 'percentage',
      type: 'number',
      required: false,
      description: 'Note duration as % of inter-onset interval (10-100)',
    },
  ],
  preconditions: [
    'scope_has_notes',
  ],
  postconditions: [
    'articulation_adjusted',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('articulation'), createAxisId('legato'), createAxisId('staccato')],
};

/**
 * OP_TIGHTEN_GROOVE — Make rhythm more precise
 *
 * Combines quantization and reduced humanization to tighten timing.
 */
export const OP_TIGHTEN_GROOVE: EditOpcode = {
  id: createOpcodeId('tighten_groove'),
  name: 'Tighten Groove',
  description:
    'Tighten rhythmic precision by quantizing and reducing timing variations. ' +
    'Makes groove more locked and mechanical.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to tighten',
    },
    {
      name: 'amount',
      type: 'amount',
      required: false,
      description: 'How much to tighten',
      defaultValue: 'moderate',
    },
    {
      name: 'preserve_swing',
      type: 'boolean',
      required: false,
      description: 'Keep intentional swing intact',
      defaultValue: true,
    },
  ],
  preconditions: [
    'scope_has_notes',
  ],
  postconditions: [
    'groove_tightened',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('tightness'), createAxisId('precision'), createAxisId('locked')],
};

/**
 * OP_LOOSEN_GROOVE — Add organic timing variations
 *
 * Combines humanization and reduced quantization. Makes groove more relaxed.
 */
export const OP_LOOSEN_GROOVE: EditOpcode = {
  id: createOpcodeId('loosen_groove'),
  name: 'Loosen Groove',
  description:
    'Add organic timing variations to make groove less precise and more human. ' +
    'Creates relaxed, natural feel.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which events to loosen',
    },
    {
      name: 'amount',
      type: 'amount',
      required: false,
      description: 'How much to loosen',
      defaultValue: 'moderate',
    },
  ],
  preconditions: [
    'scope_has_notes',
  ],
  postconditions: [
    'groove_loosened',
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('looseness'), createAxisId('organic'), createAxisId('human')],
};

// =============================================================================
// Opcode Registry for Rhythm/Timing
// =============================================================================

export const RHYTHM_TIMING_OPCODES = [
  OP_QUANTIZE,
  OP_HUMANIZE,
  OP_ADJUST_SWING,
  OP_REMOVE_SWING,
  OP_SHIFT_TIMING,
  OP_PUSH_TIMING,
  OP_LAY_BACK_TIMING,
  OP_HALFTIME,
  OP_DOUBLETIME,
  OP_AUGMENT_RHYTHM,
  OP_DIMINISH_RHYTHM,
  OP_SYNCOPATE,
  OP_STRAIGHTEN_SYNCOPATION,
  OP_ADD_TRIPLET_FEEL,
  OP_ADJUST_ARTICULATION,
  OP_TIGHTEN_GROOVE,
  OP_LOOSEN_GROOVE,
] as const;

export function getRhythmTimingOpcodeIds(): OpcodeId[] {
  return RHYTHM_TIMING_OPCODES.map((op) => op.id);
}

export function getRhythmTimingOpcode(id: OpcodeId): EditOpcode | undefined {
  return RHYTHM_TIMING_OPCODES.find((op) => op.id === id);
}
