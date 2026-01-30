/**
 * GOFAI Canon — Domain Verbs Batch 37: Comprehensive Editing Operations
 *
 * This batch provides exhaustive coverage of musical editing verbs across all dimensions:
 * - Structure manipulation (copy, move, delete, split, merge)
 * - Parameter adjustment (increase, decrease, set, reset, modulate)
 * - Layer operations (mute, solo, isolate, group, ungroup)
 * - Time operations (shift, stretch, compress, quantize, humanize)
 * - Content generation (fill, extend, vary, repeat, interpolate)
 * - Analysis and inspection (show, analyze, compare, measure)
 * - Creative transformations (reverse, invert, transpose, randomize)
 *
 * Following Step 002-004 from gofai_goalB.md: systematic vocabulary expansion
 * with stable IDs, provenance, and comprehensive synonym coverage.
 *
 * @module gofai/canon/domain-verbs-batch37-editing-operations
 */

import type { Lexeme, LexemeId } from './types';
import { createLexemeId, createOpcodeId, createAxisId } from './types';

// =============================================================================
// Structural Editing Verbs
// =============================================================================

export const STRUCTURAL_EDITING_VERBS: readonly Lexeme[] = [
  // COPY operations
  {
    id: createLexemeId('verb', 'copy'),
    lemma: 'copy',
    variants: ['copy', 'duplicate', 'clone', 'replicate', 'double'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('copy_section'),
      role: 'main',
    },
    description: 'Duplicate a section, layer, or range of events',
    examples: [
      'copy the chorus',
      'duplicate the drums for the verse',
      'clone these two bars',
    ],
  },

  {
    id: createLexemeId('verb', 'repeat'),
    lemma: 'repeat',
    variants: ['repeat', 'loop', 'cycle', 'recur', 'reiterate'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('repeat_section'),
      role: 'main',
    },
    description: 'Repeat a section or pattern multiple times',
    examples: [
      'repeat the hook twice',
      'loop this pattern four times',
      'cycle the progression',
    ],
  },

  {
    id: createLexemeId('verb', 'move'),
    lemma: 'move',
    variants: ['move', 'relocate', 'shift', 'transfer', 'reposition'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('move_section'),
      role: 'main',
    },
    description: 'Move a section or layer to a different position',
    examples: [
      'move the bridge after the chorus',
      'relocate the bass line to track 3',
      'shift this section later',
    ],
  },

  {
    id: createLexemeId('verb', 'delete'),
    lemma: 'delete',
    variants: ['delete', 'remove', 'erase', 'clear', 'eliminate', 'cut'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('delete_selection'),
      role: 'main',
    },
    description: 'Delete selected content',
    examples: [
      'delete the intro',
      'remove the hats from the verse',
      'clear all automation',
    ],
  },

  {
    id: createLexemeId('verb', 'split'),
    lemma: 'split',
    variants: ['split', 'divide', 'separate', 'break', 'partition'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('split_section'),
      role: 'main',
    },
    description: 'Split a section or layer into parts',
    examples: [
      'split the chorus in half',
      'divide this section at bar 8',
      'separate the lead from the backing',
    ],
  },

  {
    id: createLexemeId('verb', 'merge'),
    lemma: 'merge',
    variants: ['merge', 'combine', 'join', 'unite', 'fuse', 'blend'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('merge_sections'),
      role: 'main',
    },
    description: 'Merge multiple sections or layers into one',
    examples: [
      'merge the two verses',
      'combine the drum tracks',
      'join these sections',
    ],
  },

  {
    id: createLexemeId('verb', 'insert'),
    lemma: 'insert',
    variants: ['insert', 'add', 'inject', 'place', 'put'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('insert_section'),
      role: 'main',
    },
    description: 'Insert new content at a position',
    examples: [
      'insert a bar of silence',
      'add a break before the drop',
      'place a fill here',
    ],
  },

  {
    id: createLexemeId('verb', 'replace'),
    lemma: 'replace',
    variants: ['replace', 'substitute', 'swap', 'exchange', 'switch'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('replace_section'),
      role: 'main',
    },
    description: 'Replace content with something else',
    examples: [
      'replace the bassline',
      'substitute these chords',
      'swap the kick with this sample',
    ],
  },

  // TRUNCATE/EXTEND operations
  {
    id: createLexemeId('verb', 'extend'),
    lemma: 'extend',
    variants: ['extend', 'lengthen', 'prolong', 'stretch_out', 'elongate'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('extend_section'),
      role: 'main',
    },
    description: 'Make a section or note longer',
    examples: [
      'extend the chorus by four bars',
      'lengthen this note',
      'stretch out the intro',
    ],
  },

  {
    id: createLexemeId('verb', 'shorten'),
    lemma: 'shorten',
    variants: ['shorten', 'truncate', 'trim', 'cut_short', 'abbreviate'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('shorten_section'),
      role: 'main',
    },
    description: 'Make a section or note shorter',
    examples: [
      'shorten the verse by two bars',
      'truncate the tail',
      'trim the reverb',
    ],
  },

  {
    id: createLexemeId('verb', 'crop'),
    lemma: 'crop',
    variants: ['crop', 'clip', 'trim', 'prune', 'cut_off'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('crop_section'),
      role: 'main',
    },
    description: 'Remove portions from the beginning or end',
    examples: [
      'crop the intro',
      'trim the ending',
      'cut off the last bar',
    ],
  },

  {
    id: createLexemeId('verb', 'extract'),
    lemma: 'extract',
    variants: ['extract', 'isolate', 'pull_out', 'separate', 'lift'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('extract_layer'),
      role: 'main',
    },
    description: 'Extract a layer or element from the mix',
    examples: [
      'extract the melody',
      'isolate the bass',
      'pull out the vocal',
    ],
  },
];

// =============================================================================
// Parameter Adjustment Verbs
// =============================================================================

export const PARAMETER_ADJUSTMENT_VERBS: readonly Lexeme[] = [
  // INCREASE operations
  {
    id: createLexemeId('verb', 'increase'),
    lemma: 'increase',
    variants: ['increase', 'raise', 'boost', 'lift', 'elevate', 'turn_up', 'crank_up'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('increase_param'),
      role: 'main',
    },
    description: 'Increase a parameter value',
    examples: [
      'increase the volume',
      'boost the bass',
      'turn up the reverb',
    ],
  },

  {
    id: createLexemeId('verb', 'decrease'),
    lemma: 'decrease',
    variants: ['decrease', 'lower', 'reduce', 'drop', 'diminish', 'turn_down', 'dial_back'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('decrease_param'),
      role: 'main',
    },
    description: 'Decrease a parameter value',
    examples: [
      'decrease the tempo',
      'lower the gain',
      'reduce the density',
    ],
  },

  {
    id: createLexemeId('verb', 'set'),
    lemma: 'set',
    variants: ['set', 'adjust', 'change', 'configure', 'tune', 'dial'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('set_param'),
      role: 'main',
    },
    description: 'Set a parameter to a specific value',
    examples: [
      'set the tempo to 120',
      'adjust the cutoff to 2kHz',
      'change the key to D minor',
    ],
  },

  {
    id: createLexemeId('verb', 'reset'),
    lemma: 'reset',
    variants: ['reset', 'restore', 'revert', 'default', 'clear_changes'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('reset_param'),
      role: 'main',
    },
    description: 'Reset a parameter to its default value',
    examples: [
      'reset the effects',
      'restore default tempo',
      'revert the changes',
    ],
  },

  {
    id: createLexemeId('verb', 'modulate'),
    lemma: 'modulate',
    variants: ['modulate', 'vary', 'fluctuate', 'oscillate', 'animate'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('modulate_param'),
      role: 'main',
    },
    description: 'Add modulation or variation to a parameter',
    examples: [
      'modulate the filter cutoff',
      'vary the pan position',
      'animate the volume',
    ],
  },

  {
    id: createLexemeId('verb', 'automate'),
    lemma: 'automate',
    variants: ['automate', 'program', 'schedule', 'sequence'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('add_automation'),
      role: 'main',
    },
    description: 'Add automation to a parameter',
    examples: [
      'automate the filter sweep',
      'program a volume fade',
      'schedule the tempo changes',
    ],
  },

  {
    id: createLexemeId('verb', 'ramp'),
    lemma: 'ramp',
    variants: ['ramp', 'fade', 'sweep', 'transition', 'morph'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('ramp_param'),
      role: 'main',
    },
    description: 'Gradually change a parameter over time',
    examples: [
      'ramp the cutoff from 200Hz to 2kHz',
      'fade the volume to zero',
      'sweep the resonance',
    ],
  },

  {
    id: createLexemeId('verb', 'smooth'),
    lemma: 'smooth',
    variants: ['smooth', 'soften', 'blend', 'average', 'interpolate'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('smooth_param'),
      role: 'main',
    },
    description: 'Smooth out abrupt parameter changes',
    examples: [
      'smooth the velocity curve',
      'soften the filter modulation',
      'blend the automation',
    ],
  },
];

// =============================================================================
// Layer Control Verbs
// =============================================================================

export const LAYER_CONTROL_VERBS: readonly Lexeme[] = [
  {
    id: createLexemeId('verb', 'mute'),
    lemma: 'mute',
    variants: ['mute', 'silence', 'disable', 'turn_off'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('mute_layer'),
      role: 'main',
    },
    description: 'Mute a layer or track',
    examples: [
      'mute the drums',
      'silence the bass',
      'turn off the reverb',
    ],
  },

  {
    id: createLexemeId('verb', 'unmute'),
    lemma: 'unmute',
    variants: ['unmute', 'enable', 'turn_on', 'activate'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('unmute_layer'),
      role: 'main',
    },
    description: 'Unmute a layer or track',
    examples: [
      'unmute the drums',
      'enable the bass',
      'turn on the vocals',
    ],
  },

  {
    id: createLexemeId('verb', 'solo'),
    lemma: 'solo',
    variants: ['solo', 'isolate_audio', 'focus_on'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('solo_layer'),
      role: 'main',
    },
    description: 'Solo a layer (mute all others)',
    examples: [
      'solo the melody',
      'isolate the kick',
      'focus on the vocals',
    ],
  },

  {
    id: createLexemeId('verb', 'unsolo'),
    lemma: 'unsolo',
    variants: ['unsolo', 'release_solo', 'unmute_all'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('unsolo_layer'),
      role: 'main',
    },
    description: 'Remove solo from a layer',
    examples: [
      'unsolo the drums',
      'release the solo',
      'unmute everything',
    ],
  },

  {
    id: createLexemeId('verb', 'group'),
    lemma: 'group',
    variants: ['group', 'bundle', 'collect', 'organize'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('group_layers'),
      role: 'main',
    },
    description: 'Group multiple layers together',
    examples: [
      'group the drum tracks',
      'bundle the vocals',
      'organize the percussion',
    ],
  },

  {
    id: createLexemeId('verb', 'ungroup'),
    lemma: 'ungroup',
    variants: ['ungroup', 'unbundle', 'separate_group', 'dissolve'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('ungroup_layers'),
      role: 'main',
    },
    description: 'Ungroup a layer group',
    examples: [
      'ungroup the drums',
      'unbundle the vocals',
      'dissolve the group',
    ],
  },

  {
    id: createLexemeId('verb', 'lock'),
    lemma: 'lock',
    variants: ['lock', 'freeze', 'protect', 'secure'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('lock_layer'),
      role: 'main',
    },
    description: 'Lock a layer to prevent editing',
    examples: [
      'lock the drums',
      'freeze the melody',
      'protect the bass from changes',
    ],
  },

  {
    id: createLexemeId('verb', 'unlock'),
    lemma: 'unlock',
    variants: ['unlock', 'unfreeze', 'release', 'enable_editing'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('unlock_layer'),
      role: 'main',
    },
    description: 'Unlock a layer to allow editing',
    examples: [
      'unlock the drums',
      'unfreeze the melody',
      'enable editing the bass',
    ],
  },
];

// =============================================================================
// Time Manipulation Verbs
// =============================================================================

export const TIME_MANIPULATION_VERBS: readonly Lexeme[] = [
  {
    id: createLexemeId('verb', 'quantize'),
    lemma: 'quantize',
    variants: ['quantize', 'snap_to_grid', 'align', 'correct_timing'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('quantize_events'),
      role: 'main',
    },
    description: 'Snap notes to the nearest grid position',
    examples: [
      'quantize the drums',
      'snap the bass to 16th notes',
      'correct the timing',
    ],
  },

  {
    id: createLexemeId('verb', 'humanize'),
    lemma: 'humanize',
    variants: ['humanize', 'add_groove', 'randomize_timing', 'loosen'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('humanize_timing'),
      role: 'main',
    },
    description: 'Add subtle timing variations for a human feel',
    examples: [
      'humanize the hi-hats',
      'add groove to the drums',
      'loosen the quantization',
    ],
  },

  {
    id: createLexemeId('verb', 'swing'),
    lemma: 'swing',
    variants: ['swing', 'shuffle', 'groove', 'syncopate'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('apply_swing'),
      role: 'main',
    },
    description: 'Apply swing or shuffle timing',
    examples: [
      'swing the hi-hats',
      'add shuffle to the drums',
      'groove the pattern',
    ],
  },

  {
    id: createLexemeId('verb', 'shift'),
    lemma: 'shift',
    variants: ['shift', 'offset', 'displace', 'nudge', 'slide'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('shift_timing'),
      role: 'main',
    },
    description: 'Shift events in time',
    examples: [
      'shift the drums forward by 10ms',
      'offset the bass by one tick',
      'nudge the vocals earlier',
    ],
  },

  {
    id: createLexemeId('verb', 'stretch'),
    lemma: 'stretch',
    variants: ['stretch', 'time_stretch', 'dilate', 'expand_time'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('time_stretch'),
      role: 'main',
    },
    description: 'Stretch audio or events in time without changing pitch',
    examples: [
      'stretch this sample to fit',
      'time stretch the vocal to 4 bars',
      'expand the groove',
    ],
  },

  {
    id: createLexemeId('verb', 'compress'),
    lemma: 'compress',
    variants: ['compress', 'squeeze', 'condense', 'contract_time'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('time_compress'),
      role: 'main',
    },
    description: 'Compress events in time',
    examples: [
      'compress the drum fill',
      'squeeze the pattern',
      'condense the ending',
    ],
  },

  {
    id: createLexemeId('verb', 'retrigger'),
    lemma: 'retrigger',
    variants: ['retrigger', 'gate', 'chop', 'slice'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('retrigger_events'),
      role: 'main',
    },
    description: 'Retrigger notes at a specific rate',
    examples: [
      'retrigger the vocal at 16th notes',
      'chop the synth',
      'gate the pad at 8th notes',
    ],
  },
];

// =============================================================================
// Content Generation Verbs
// =============================================================================

export const CONTENT_GENERATION_VERBS: readonly Lexeme[] = [
  {
    id: createLexemeId('verb', 'fill'),
    lemma: 'fill',
    variants: ['fill', 'populate', 'generate', 'create_content'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('fill_section'),
      role: 'main',
    },
    description: 'Fill a section with generated content',
    examples: [
      'fill the gap with drums',
      'populate the verse with chords',
      'generate a bassline',
    ],
  },

  {
    id: createLexemeId('verb', 'continue'),
    lemma: 'continue',
    variants: ['continue', 'extend_pattern', 'develop', 'elaborate'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('continue_pattern'),
      role: 'main',
    },
    description: 'Continue a pattern or melody',
    examples: [
      'continue the melody',
      'extend the bassline',
      'develop the theme',
    ],
  },

  {
    id: createLexemeId('verb', 'vary'),
    lemma: 'vary',
    variants: ['vary', 'variate', 'change_up', 'diversify', 'alter'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('vary_pattern'),
      role: 'main',
    },
    description: 'Create variation on existing material',
    examples: [
      'vary the drum pattern',
      'change up the rhythm',
      'diversify the melody',
    ],
  },

  {
    id: createLexemeId('verb', 'interpolate'),
    lemma: 'interpolate',
    variants: ['interpolate', 'blend_between', 'morph_between', 'transition'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('interpolate_patterns'),
      role: 'main',
    },
    description: 'Create a smooth transition between two patterns',
    examples: [
      'interpolate between these two sections',
      'blend the verse into the chorus',
      'morph from pattern A to pattern B',
    ],
  },

  {
    id: createLexemeId('verb', 'randomize'),
    lemma: 'randomize',
    variants: ['randomize', 'shuffle', 'scramble', 'vary_randomly'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('randomize_events'),
      role: 'main',
    },
    description: 'Randomize aspects of events',
    examples: [
      'randomize the velocities',
      'shuffle the note order',
      'scramble the rhythm',
    ],
  },

  {
    id: createLexemeId('verb', 'arpeggiate'),
    lemma: 'arpeggiate',
    variants: ['arpeggiate', 'roll', 'spread', 'unfold_chord'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('arpeggiate_chords'),
      role: 'main',
    },
    description: 'Break chords into arpeggios',
    examples: [
      'arpeggiate the chords',
      'roll the piano part',
      'spread the harmony',
    ],
  },
];

// =============================================================================
// Analysis and Inspection Verbs
// =============================================================================

export const ANALYSIS_INSPECTION_VERBS: readonly Lexeme[] = [
  {
    id: createLexemeId('verb', 'show'),
    lemma: 'show',
    variants: ['show', 'display', 'reveal', 'present', 'visualize'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('show_analysis'),
      role: 'main',
    },
    description: 'Display information or analysis',
    examples: [
      'show the chord progression',
      'display the frequency spectrum',
      'reveal the automation',
    ],
  },

  {
    id: createLexemeId('verb', 'analyze'),
    lemma: 'analyze',
    variants: ['analyze', 'inspect', 'examine', 'study', 'evaluate'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('analyze_content'),
      role: 'main',
    },
    description: 'Analyze musical content',
    examples: [
      'analyze the harmony',
      'inspect the timing',
      'examine the frequency balance',
    ],
  },

  {
    id: createLexemeId('verb', 'compare'),
    lemma: 'compare',
    variants: ['compare', 'diff', 'contrast', 'check_difference'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('compare_sections'),
      role: 'main',
    },
    description: 'Compare two sections or states',
    examples: [
      'compare the verse and chorus',
      'diff before and after',
      'check the difference',
    ],
  },

  {
    id: createLexemeId('verb', 'measure'),
    lemma: 'measure',
    variants: ['measure', 'calculate', 'compute', 'determine'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('measure_property'),
      role: 'main',
    },
    description: 'Measure a musical property',
    examples: [
      'measure the average velocity',
      'calculate the tempo',
      'determine the key',
    ],
  },

  {
    id: createLexemeId('verb', 'detect'),
    lemma: 'detect',
    variants: ['detect', 'find', 'identify', 'locate', 'discover'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('detect_feature'),
      role: 'main',
    },
    description: 'Detect musical features automatically',
    examples: [
      'detect the key',
      'find the downbeats',
      'identify the chord changes',
    ],
  },
];

// =============================================================================
// Creative Transformation Verbs
// =============================================================================

export const CREATIVE_TRANSFORMATION_VERBS: readonly Lexeme[] = [
  {
    id: createLexemeId('verb', 'reverse'),
    lemma: 'reverse',
    variants: ['reverse', 'backward', 'flip', 'invert_time'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('reverse_events'),
      role: 'main',
    },
    description: 'Reverse the order of events in time',
    examples: [
      'reverse the melody',
      'play the drums backward',
      'flip the pattern',
    ],
  },

  {
    id: createLexemeId('verb', 'invert'),
    lemma: 'invert',
    variants: ['invert', 'mirror', 'flip_pitch', 'upside_down'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('invert_pitches'),
      role: 'main',
    },
    description: 'Invert pitches around an axis',
    examples: [
      'invert the melody',
      'mirror the bass line',
      'flip the chord voicing',
    ],
  },

  {
    id: createLexemeId('verb', 'transpose'),
    lemma: 'transpose',
    variants: ['transpose', 'shift_pitch', 'move_key', 'transpose_pitch'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('transpose_events'),
      role: 'main',
    },
    description: 'Transpose pitches by an interval',
    examples: [
      'transpose up an octave',
      'shift the key to A minor',
      'move the melody down a fifth',
    ],
  },

  {
    id: createLexemeId('verb', 'retrograde'),
    lemma: 'retrograde',
    variants: ['retrograde', 'reverse_rhythm', 'backward_time'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('retrograde_pattern'),
      role: 'main',
    },
    description: 'Apply retrograde transformation (reverse in time)',
    examples: [
      'retrograde the melody',
      'reverse the rhythm',
      'play backward',
    ],
  },

  {
    id: createLexemeId('verb', 'augment'),
    lemma: 'augment',
    variants: ['augment', 'lengthen_durations', 'stretch_rhythm'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('augment_rhythm'),
      role: 'main',
    },
    description: 'Increase all durations proportionally',
    examples: [
      'augment the rhythm by 2x',
      'lengthen all durations',
      'stretch the pattern',
    ],
  },

  {
    id: createLexemeId('verb', 'diminish'),
    lemma: 'diminish',
    variants: ['diminish', 'shorten_durations', 'compress_rhythm'],
    category: 'verb',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('diminish_rhythm'),
      role: 'main',
    },
    description: 'Decrease all durations proportionally',
    examples: [
      'diminish the rhythm by half',
      'shorten all durations',
      'compress the pattern',
    ],
  },
];

// =============================================================================
// Export All Verbs
// =============================================================================

export const DOMAIN_VERBS_BATCH_37: readonly Lexeme[] = [
  ...STRUCTURAL_EDITING_VERBS,
  ...PARAMETER_ADJUSTMENT_VERBS,
  ...LAYER_CONTROL_VERBS,
  ...TIME_MANIPULATION_VERBS,
  ...CONTENT_GENERATION_VERBS,
  ...ANALYSIS_INSPECTION_VERBS,
  ...CREATIVE_TRANSFORMATION_VERBS,
];

/**
 * Total count of verbs in this batch.
 */
export const BATCH_37_COUNT = DOMAIN_VERBS_BATCH_37.length;
