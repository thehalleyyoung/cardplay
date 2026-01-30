/**
 * GOFAI Edit Opcodes — Phase 5 Batch 1: Musical Structure, Rhythm, Harmony Opcodes
 *
 * This module implements Steps 276-280 from gofai_goalB.md:
 * - Step 276: Plan opcodes for musical structure edits
 * - Step 277: Plan opcodes for rhythm edits
 * - Step 278: Plan opcodes for harmony edits
 * - Step 279: Plan opcodes for melody edits (optional/high cost)
 * - Step 280: Plan opcodes for arrangement edits
 *
 * These opcodes represent the comprehensive action vocabulary needed
 * for GOFAI Music+ to manipulate musical content in sophisticated ways.
 *
 * @module gofai/canon/edit-opcodes-phase5-batch1
 */

import type { EditOpcode } from './types';
import { createOpcodeId, createAxisId } from './types';

// =============================================================================
// Musical Structure Opcodes (Step 276)
// =============================================================================

/**
 * Duplicate a section (verse, chorus, bridge, etc.)
 */
export const OP_DUPLICATE_SECTION: EditOpcode = {
  id: createOpcodeId('duplicate_section'),
  name: 'Duplicate Section',
  description: 'Duplicate an entire section with all its events, markers, and automation.',
  params: [
    {
      name: 'source',
      type: 'entity_ref',
      required: true,
      description: 'The section to duplicate (e.g., "verse-1", "chorus")',
    },
    {
      name: 'insertAfter',
      type: 'entity_ref',
      required: false,
      description: 'Section after which to insert (default: after source)',
    },
    {
      name: 'count',
      type: 'number',
      required: false,
      defaultValue: 1,
      description: 'How many copies to make',
      validation: { min: 1, max: 10 },
    },
    {
      name: 'label',
      type: 'string',
      required: false,
      description: 'Label for the duplicated section(s)',
    },
  ],
  affects: ['event', 'marker', 'automation'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [],
  requiresCapabilities: [],
};

/**
 * Extend a section by lengthening it
 */
export const OP_EXTEND_SECTION: EditOpcode = {
  id: createOpcodeId('extend_section'),
  name: 'Extend Section',
  description: 'Lengthen a section by repeating its content or adding space.',
  params: [
    {
      name: 'section',
      type: 'entity_ref',
      required: true,
      description: 'The section to extend',
    },
    {
      name: 'bars',
      type: 'number',
      required: true,
      description: 'How many bars to add',
      validation: { min: 1, max: 32 },
    },
    {
      name: 'method',
      type: 'enum',
      required: false,
      enumValues: ['repeat', 'loop_last', 'silence', 'fade'],
      defaultValue: 'repeat',
      description: 'How to fill the extension',
    },
  ],
  affects: ['event', 'marker'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [],
  requiresCapabilities: [],
};

/**
 * Shorten a section by trimming it
 */
export const OP_SHORTEN_SECTION: EditOpcode = {
  id: createOpcodeId('shorten_section'),
  name: 'Shorten Section',
  description: 'Reduce the length of a section by removing bars.',
  params: [
    {
      name: 'section',
      type: 'entity_ref',
      required: true,
      description: 'The section to shorten',
    },
    {
      name: 'bars',
      type: 'number',
      required: true,
      description: 'How many bars to remove',
      validation: { min: 1, max: 32 },
    },
    {
      name: 'from',
      type: 'enum',
      required: false,
      enumValues: ['start', 'end', 'both'],
      defaultValue: 'end',
      description: 'Where to remove bars from',
    },
  ],
  affects: ['event', 'marker'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [],
  requiresCapabilities: [],
};

/**
 * Insert a pickup measure before a section
 */
export const OP_INSERT_PICKUP: EditOpcode = {
  id: createOpcodeId('insert_pickup'),
  name: 'Insert Pickup',
  description: 'Add a pickup measure (partial bar) before a section.',
  params: [
    {
      name: 'before',
      type: 'entity_ref',
      required: true,
      description: 'Section before which to insert pickup',
    },
    {
      name: 'beats',
      type: 'number',
      required: false,
      defaultValue: 1,
      description: 'Length of pickup in beats',
      validation: { min: 0.25, max: 4 },
    },
    {
      name: 'material',
      type: 'enum',
      required: false,
      enumValues: ['from_section', 'from_previous', 'empty'],
      defaultValue: 'from_section',
      description: 'Where to get pickup material',
    },
  ],
  affects: ['event', 'marker'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [],
  requiresCapabilities: [],
};

/**
 * Insert a break (silence or minimal texture)
 */
export const OP_INSERT_BREAK: EditOpcode = {
  id: createOpcodeId('insert_break'),
  name: 'Insert Break',
  description: 'Add a break section with minimal or no instrumentation.',
  params: [
    {
      name: 'after',
      type: 'entity_ref',
      required: true,
      description: 'Section after which to insert break',
    },
    {
      name: 'bars',
      type: 'number',
      required: false,
      defaultValue: 2,
      description: 'Length of break in bars',
      validation: { min: 0.5, max: 8 },
    },
    {
      name: 'texture',
      type: 'enum',
      required: false,
      enumValues: ['silence', 'minimal', 'drum_only', 'bass_only'],
      defaultValue: 'minimal',
      description: 'What remains during the break',
    },
  ],
  affects: ['event', 'marker'],
  effectType: 'mutate',
  cost: 'high',
  affectsAxes: [createAxisId('energy'), createAxisId('busyness')],
  requiresCapabilities: [],
};

/**
 * Add a build section (gradual intensity increase)
 */
export const OP_INSERT_BUILD: EditOpcode = {
  id: createOpcodeId('insert_build'),
  name: 'Insert Build',
  description: 'Add a build section that gradually increases in intensity.',
  params: [
    {
      name: 'before',
      type: 'entity_ref',
      required: true,
      description: 'Section before which to insert build',
    },
    {
      name: 'bars',
      type: 'number',
      required: false,
      defaultValue: 4,
      description: 'Length of build in bars',
      validation: { min: 1, max: 16 },
    },
    {
      name: 'intensity',
      type: 'enum',
      required: false,
      enumValues: ['subtle', 'moderate', 'dramatic'],
      defaultValue: 'moderate',
      description: 'How intense the build should be',
    },
    {
      name: 'method',
      type: 'enum',
      required: false,
      enumValues: ['density', 'register', 'layers', 'all'],
      defaultValue: 'all',
      description: 'How to build intensity',
    },
  ],
  affects: ['event', 'marker', 'automation'],
  effectType: 'mutate',
  cost: 'high',
  affectsAxes: [createAxisId('energy'), createAxisId('lift'), createAxisId('busyness')],
  requiresCapabilities: [],
};

/**
 * Add a drop section (sudden intensity change)
 */
export const OP_INSERT_DROP: EditOpcode = {
  id: createOpcodeId('insert_drop'),
  name: 'Insert Drop',
  description: 'Add a drop section with sudden textural change.',
  params: [
    {
      name: 'after',
      type: 'entity_ref',
      required: true,
      description: 'Section after which to insert drop',
    },
    {
      name: 'bars',
      type: 'number',
      required: false,
      defaultValue: 8,
      description: 'Length of drop in bars',
      validation: { min: 2, max: 32 },
    },
    {
      name: 'style',
      type: 'enum',
      required: false,
      enumValues: ['minimal', 'bass_heavy', 'rhythmic', 'melodic'],
      defaultValue: 'bass_heavy',
      description: 'Character of the drop',
    },
  ],
  affects: ['event', 'marker', 'automation'],
  effectType: 'mutate',
  cost: 'high',
  affectsAxes: [createAxisId('energy'), createAxisId('intimacy')],
  requiresCapabilities: [],
};

/**
 * Rearrange section order
 */
export const OP_REARRANGE_SECTIONS: EditOpcode = {
  id: createOpcodeId('rearrange_sections'),
  name: 'Rearrange Sections',
  description: 'Change the order of sections in the arrangement.',
  params: [
    {
      name: 'sections',
      type: 'entity_ref',
      required: true,
      description: 'Sections to rearrange (comma-separated)',
    },
    {
      name: 'newOrder',
      type: 'string',
      required: true,
      description: 'New order (section IDs comma-separated)',
    },
  ],
  affects: ['marker'],
  effectType: 'mutate',
  cost: 'high',
  affectsAxes: [],
  requiresCapabilities: [],
};

/**
 * Insert a transition between sections
 */
export const OP_INSERT_TRANSITION: EditOpcode = {
  id: createOpcodeId('insert_transition'),
  name: 'Insert Transition',
  description: 'Add a transitional passage between two sections.',
  params: [
    {
      name: 'from',
      type: 'entity_ref',
      required: true,
      description: 'Section to transition from',
    },
    {
      name: 'to',
      type: 'entity_ref',
      required: true,
      description: 'Section to transition to',
    },
    {
      name: 'bars',
      type: 'number',
      required: false,
      defaultValue: 1,
      description: 'Length of transition in bars',
      validation: { min: 0.5, max: 4 },
    },
    {
      name: 'type',
      type: 'enum',
      required: false,
      enumValues: ['fill', 'riser', 'crash', 'fade', 'crossfade'],
      defaultValue: 'fill',
      description: 'Type of transition',
    },
  ],
  affects: ['event', 'automation'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [],
  requiresCapabilities: [],
};

// =============================================================================
// Rhythm Opcodes (Step 277)
// =============================================================================

/**
 * Adjust swing feel systematically
 */
export const OP_ADJUST_SWING_ADVANCED: EditOpcode = {
  id: createOpcodeId('adjust_swing_advanced'),
  name: 'Adjust Swing (Advanced)',
  description: 'Fine-tune swing feel with per-layer control.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'What to apply swing to',
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      description: 'Swing amount percentage (50% = straight, higher = swung)',
      validation: { min: 50, max: 75 },
    },
    {
      name: 'grid',
      type: 'enum',
      required: false,
      enumValues: ['1/8', '1/16', '1/32'],
      defaultValue: '1/16',
      description: 'Grid subdivision to swing',
    },
    {
      name: 'layers',
      type: 'entity_ref',
      required: false,
      description: 'Specific layers to apply to (comma-separated)',
    },
    {
      name: 'strength',
      type: 'number',
      required: false,
      defaultValue: 100,
      description: 'Application strength percentage',
      validation: { min: 0, max: 100 },
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('groove'), createAxisId('tightness')],
  requiresCapabilities: [],
};

/**
 * Adjust quantization strength with fine control
 */
export const OP_QUANTIZE_ADVANCED: EditOpcode = {
  id: createOpcodeId('quantize_advanced'),
  name: 'Quantize (Advanced)',
  description: 'Apply quantization with strength and grid control.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'What to quantize',
    },
    {
      name: 'strength',
      type: 'number',
      required: false,
      defaultValue: 100,
      description: 'Quantization strength (0-100%)',
      validation: { min: 0, max: 100 },
    },
    {
      name: 'grid',
      type: 'enum',
      required: false,
      enumValues: ['1/4', '1/8', '1/16', '1/32', '1/4t', '1/8t', '1/16t'],
      defaultValue: '1/16',
      description: 'Quantization grid',
    },
    {
      name: 'includeVelocity',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Also quantize velocity to MIDI grid',
    },
    {
      name: 'includeDuration',
      type: 'boolean',
      required: false,
      defaultValue: false,
      description: 'Also quantize note durations',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('tightness')],
  requiresCapabilities: [],
};

/**
 * Apply humanization to timing and velocity
 */
export const OP_HUMANIZE_ADVANCED: EditOpcode = {
  id: createOpcodeId('humanize_advanced'),
  name: 'Humanize (Advanced)',
  description: 'Add realistic human timing and velocity variation.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'What to humanize',
    },
    {
      name: 'timingAmount',
      type: 'number',
      required: false,
      defaultValue: 10,
      description: 'Timing variation amount (0-50 ticks)',
      validation: { min: 0, max: 50 },
    },
    {
      name: 'velocityAmount',
      type: 'number',
      required: false,
      defaultValue: 10,
      description: 'Velocity variation amount (0-30)',
      validation: { min: 0, max: 30 },
    },
    {
      name: 'style',
      type: 'enum',
      required: false,
      enumValues: ['subtle', 'natural', 'sloppy'],
      defaultValue: 'natural',
      description: 'Humanization style',
    },
    {
      name: 'preserveGroove',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Preserve the underlying groove pattern',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('tightness'), createAxisId('groove')],
  requiresCapabilities: [],
};

/**
 * Transform rhythm to halftime feel
 */
export const OP_HALFTIME: EditOpcode = {
  id: createOpcodeId('halftime'),
  name: 'Halftime',
  description: 'Convert rhythm to halftime feel (perceived tempo halved).',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'What to convert to halftime',
    },
    {
      name: 'preserveMelody',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Keep melody at original tempo',
    },
    {
      name: 'layers',
      type: 'entity_ref',
      required: false,
      description: 'Specific layers to apply to (comma-separated)',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'high',
  affectsAxes: [createAxisId('energy'), createAxisId('groove')],
  requiresCapabilities: [],
};

/**
 * Transform rhythm to doubletime feel
 */
export const OP_DOUBLETIME: EditOpcode = {
  id: createOpcodeId('doubletime'),
  name: 'Doubletime',
  description: 'Convert rhythm to doubletime feel (perceived tempo doubled).',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'What to convert to doubletime',
    },
    {
      name: 'preserveMelody',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Keep melody at original tempo',
    },
    {
      name: 'layers',
      type: 'entity_ref',
      required: false,
      description: 'Specific layers to apply to (comma-separated)',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'high',
  affectsAxes: [createAxisId('energy'), createAxisId('busyness'), createAxisId('groove')],
  requiresCapabilities: [],
};

/**
 * Add rhythmic syncopation
 */
export const OP_ADD_SYNCOPATION: EditOpcode = {
  id: createOpcodeId('add_syncopation'),
  name: 'Add Syncopation',
  description: 'Introduce syncopated rhythms by shifting accents.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'What to syncopate',
    },
    {
      name: 'amount',
      type: 'number',
      required: false,
      defaultValue: 30,
      description: 'Syncopation intensity (0-100%)',
      validation: { min: 0, max: 100 },
    },
    {
      name: 'targetBeats',
      type: 'enum',
      required: false,
      enumValues: ['weak', 'offbeat', 'all'],
      defaultValue: 'offbeat',
      description: 'Which beats to emphasize',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('groove'), createAxisId('busyness')],
  requiresCapabilities: [],
};

/**
 * Simplify rhythm to a steadier pattern
 */
export const OP_SIMPLIFY_RHYTHM: EditOpcode = {
  id: createOpcodeId('simplify_rhythm'),
  name: 'Simplify Rhythm',
  description: 'Reduce rhythmic complexity by removing subdivisions.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'What to simplify',
    },
    {
      name: 'targetGrid',
      type: 'enum',
      required: false,
      enumValues: ['1/4', '1/8', '1/16'],
      defaultValue: '1/8',
      description: 'Simplify to this grid',
    },
    {
      name: 'preserveAccents',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Keep accented notes',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('busyness'), createAxisId('tightness')],
  requiresCapabilities: [],
};

/**
 * Shift rhythm phase (offset in time)
 */
export const OP_SHIFT_RHYTHM_PHASE: EditOpcode = {
  id: createOpcodeId('shift_rhythm_phase'),
  name: 'Shift Rhythm Phase',
  description: 'Shift the rhythmic pattern earlier or later in time.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'What to shift',
    },
    {
      name: 'ticks',
      type: 'number',
      required: true,
      description: 'How many ticks to shift (negative = earlier)',
    },
    {
      name: 'wrapAround',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Wrap shifted notes to stay in scope',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'low',
  affectsAxes: [createAxisId('groove')],
  requiresCapabilities: [],
};

// =============================================================================
// Harmony Opcodes (Step 278)
// =============================================================================

/**
 * Revoice chords for different texture
 */
export const OP_REVOICE_CHORDS: EditOpcode = {
  id: createOpcodeId('revoice_chords'),
  name: 'Revoice Chords',
  description: 'Change chord voicings while preserving harmonic function.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which chords to revoice',
    },
    {
      name: 'style',
      type: 'enum',
      required: false,
      enumValues: ['open', 'close', 'spread', 'cluster', 'drop2', 'drop3'],
      defaultValue: 'open',
      description: 'Voicing style',
    },
    {
      name: 'preserveMelody',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Keep melody notes at top',
    },
    {
      name: 'registerPreference',
      type: 'enum',
      required: false,
      enumValues: ['low', 'mid', 'high', 'current'],
      defaultValue: 'current',
      description: 'Preferred register range',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('brightness'), createAxisId('intimacy')],
  requiresCapabilities: [],
};

/**
 * Add chord extensions (7ths, 9ths, etc.)
 */
export const OP_ADD_CHORD_EXTENSIONS: EditOpcode = {
  id: createOpcodeId('add_chord_extensions'),
  name: 'Add Chord Extensions',
  description: 'Add tensions and extensions to existing chords.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which chords to extend',
    },
    {
      name: 'extensions',
      type: 'enum',
      required: false,
      enumValues: ['7th', '9th', '11th', '13th', 'color_tones', 'all'],
      defaultValue: '9th',
      description: 'Which extensions to add',
    },
    {
      name: 'density',
      type: 'number',
      required: false,
      defaultValue: 50,
      description: 'How many chords to extend (0-100%)',
      validation: { min: 0, max: 100 },
    },
    {
      name: 'preserveBasicTriad',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Keep original triad notes',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('harmonic_richness'), createAxisId('sophistication')],
  requiresCapabilities: [],
};

/**
 * Substitute chords with functional equivalents
 */
export const OP_SUBSTITUTE_CHORDS: EditOpcode = {
  id: createOpcodeId('substitute_chords'),
  name: 'Substitute Chords',
  description: 'Replace chords with functional substitutes from music theory.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which chords to substitute',
    },
    {
      name: 'substitutionType',
      type: 'enum',
      required: false,
      enumValues: ['tritone', 'relative', 'secondary_dominant', 'modal_interchange', 'chromatic_mediant'],
      defaultValue: 'tritone',
      description: 'Type of substitution to apply',
    },
    {
      name: 'preserveMelody',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Ensure melody notes are still chord tones',
    },
    {
      name: 'density',
      type: 'number',
      required: false,
      defaultValue: 30,
      description: 'How many chords to substitute (0-100%)',
      validation: { min: 0, max: 100 },
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'high',
  affectsAxes: [createAxisId('harmonic_richness'), createAxisId('sophistication'), createAxisId('mood')],
  requiresCapabilities: ['prolog'],
};

/**
 * Reharmonize melody with new chord progression
 */
export const OP_REHARMONIZE: EditOpcode = {
  id: createOpcodeId('reharmonize'),
  name: 'Reharmonize',
  description: 'Create a new chord progression under an existing melody.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Section to reharmonize',
    },
    {
      name: 'melody',
      type: 'entity_ref',
      required: true,
      description: 'Melody layer to harmonize',
    },
    {
      name: 'style',
      type: 'enum',
      required: false,
      enumValues: ['diatonic', 'chromatic', 'modal', 'jazz', 'contemporary'],
      defaultValue: 'diatonic',
      description: 'Harmonic style',
    },
    {
      name: 'changeRate',
      type: 'enum',
      required: false,
      enumValues: ['slow', 'medium', 'fast'],
      defaultValue: 'medium',
      description: 'Frequency of chord changes',
    },
    {
      name: 'preserveMelody',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Keep melody exactly as is (hard constraint)',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'high',
  affectsAxes: [createAxisId('harmonic_richness'), createAxisId('mood')],
  requiresCapabilities: ['prolog'],
};

/**
 * Add passing chords between structural chords
 */
export const OP_ADD_PASSING_CHORDS: EditOpcode = {
  id: createOpcodeId('add_passing_chords'),
  name: 'Add Passing Chords',
  description: 'Insert transitional chords between main harmonic changes.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Where to add passing chords',
    },
    {
      name: 'density',
      type: 'number',
      required: false,
      defaultValue: 30,
      description: 'How many passing chords to add (0-100%)',
      validation: { min: 0, max: 100 },
    },
    {
      name: 'type',
      type: 'enum',
      required: false,
      enumValues: ['chromatic', 'diatonic', 'diminished', 'all'],
      defaultValue: 'chromatic',
      description: 'Type of passing harmony',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('harmonic_richness'), createAxisId('busyness')],
  requiresCapabilities: ['prolog'],
};

/**
 * Simplify harmony to basic triads
 */
export const OP_SIMPLIFY_HARMONY: EditOpcode = {
  id: createOpcodeId('simplify_harmony'),
  name: 'Simplify Harmony',
  description: 'Reduce harmonic complexity to basic triads or power chords.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Which harmony to simplify',
    },
    {
      name: 'target',
      type: 'enum',
      required: false,
      enumValues: ['triads', 'power_chords', 'roots_only'],
      defaultValue: 'triads',
      description: 'Target simplicity level',
    },
    {
      name: 'preserveFunction',
      type: 'boolean',
      required: false,
      defaultValue: true,
      description: 'Keep the functional progression',
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('harmonic_richness'), createAxisId('intimacy')],
  requiresCapabilities: [],
};

/**
 * Adjust harmonic rhythm (rate of chord changes)
 */
export const OP_ADJUST_HARMONIC_RHYTHM: EditOpcode = {
  id: createOpcodeId('adjust_harmonic_rhythm'),
  name: 'Adjust Harmonic Rhythm',
  description: 'Change how frequently chords change.',
  params: [
    {
      name: 'scope',
      type: 'scope',
      required: true,
      description: 'Section to adjust',
    },
    {
      name: 'direction',
      type: 'enum',
      required: true,
      enumValues: ['faster', 'slower'],
      description: 'Speed up or slow down changes',
    },
    {
      name: 'amount',
      type: 'number',
      required: false,
      defaultValue: 50,
      description: 'How much to change (0-100%)',
      validation: { min: 0, max: 100 },
    },
  ],
  affects: ['event'],
  effectType: 'mutate',
  cost: 'medium',
  affectsAxes: [createAxisId('harmonic_richness'), createAxisId('busyness')],
  requiresCapabilities: [],
};

// Export all new opcodes
export const PHASE5_BATCH1_OPCODES: readonly EditOpcode[] = [
  // Structure (Step 276)
  OP_DUPLICATE_SECTION,
  OP_EXTEND_SECTION,
  OP_SHORTEN_SECTION,
  OP_INSERT_PICKUP,
  OP_INSERT_BREAK,
  OP_INSERT_BUILD,
  OP_INSERT_DROP,
  OP_REARRANGE_SECTIONS,
  OP_INSERT_TRANSITION,
  
  // Rhythm (Step 277)
  OP_ADJUST_SWING_ADVANCED,
  OP_QUANTIZE_ADVANCED,
  OP_HUMANIZE_ADVANCED,
  OP_HALFTIME,
  OP_DOUBLETIME,
  OP_ADD_SYNCOPATION,
  OP_SIMPLIFY_RHYTHM,
  OP_SHIFT_RHYTHM_PHASE,
  
  // Harmony (Step 278)
  OP_REVOICE_CHORDS,
  OP_ADD_CHORD_EXTENSIONS,
  OP_SUBSTITUTE_CHORDS,
  OP_REHARMONIZE,
  OP_ADD_PASSING_CHORDS,
  OP_SIMPLIFY_HARMONY,
  OP_ADJUST_HARMONIC_RHYTHM,
];
