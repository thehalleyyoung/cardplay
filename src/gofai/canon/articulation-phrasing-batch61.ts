/**
 * GOFAI Canon — Articulation and Phrasing Vocabulary (Batch 61)
 *
 * Comprehensive vocabulary for articulation, phrasing, and performance technique
 * descriptors across instrumental and vocal traditions:
 * - Articulation types (legato, staccato, marcato, etc.)
 * - Attack characteristics
 * - Decay and release properties
 * - Phrasing shapes
 * - Breathing and continuity
 * - Performance gestures
 * - Bow techniques (strings)
 * - Tongue techniques (winds)
 *
 * This batch provides natural language coverage for expressive performance
 * control and detailed musical expression.
 *
 * @module gofai/canon/articulation-phrasing-batch61
 */

import {
  type Lexeme,
  createLexemeId,
  createAxisId,
} from './types';

// =============================================================================
// Basic Articulation Types
// =============================================================================

/**
 * Fundamental articulation descriptors.
 *
 * Covers:
 * - Legato vs staccato spectrum
 * - Attack types
 * - Note connection styles
 */
const BASIC_ARTICULATION_LEXEMES: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'legato'),
    lemma: 'legato',
    variants: ['smooth', 'connected', 'flowing', 'seamless'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('articulation'),
      direction: 'increase',
    },
    description: 'Smooth, connected articulation with minimal gaps between notes',
    examples: [
      'make it legato',
      'play legato',
      'smooth out the articulation',
      'connect the notes smoothly',
    ],
  },
  {
    id: createLexemeId('adj', 'staccato'),
    lemma: 'staccato',
    variants: ['detached', 'separated', 'short', 'choppy'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('articulation'),
      direction: 'decrease',
    },
    description: 'Short, detached articulation with clear separation between notes',
    examples: [
      'make it staccato',
      'play staccato',
      'detach the notes',
      'add separation',
    ],
  },
  {
    id: createLexemeId('adj', 'marcato'),
    lemma: 'marcato',
    variants: ['marked', 'accented', 'emphasized'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('accent_strength'),
      direction: 'increase',
    },
    description: 'Marked, accented articulation with strong attack',
    examples: [
      'make it marcato',
      'add marcato',
      'emphasize each note',
      'mark the attacks',
    ],
  },
  {
    id: createLexemeId('adj', 'tenuto'),
    lemma: 'tenuto',
    variants: ['held', 'sustained', 'full-length'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('note_duration'),
      direction: 'increase',
    },
    description: 'Sustained articulation holding notes for full value',
    examples: [
      'play tenuto',
      'hold the notes',
      'sustain fully',
      'give full value',
    ],
  },
  {
    id: createLexemeId('adj', 'portato'),
    lemma: 'portato',
    variants: ['carried', 'semi-detached'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'articulation',
      aspect: 'style',
    },
    description: 'Articulation between legato and staccato, slightly detached',
    examples: [
      'play portato',
      'semi-detached',
      'gentle separation',
      'carried notes',
    ],
  },
  {
    id: createLexemeId('adj', 'portamento'),
    lemma: 'portamento',
    variants: ['sliding', 'gliding', 'glissando', 'slide'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('pitch_continuity'),
      direction: 'increase',
    },
    description: 'Sliding articulation with continuous pitch connection',
    examples: [
      'add portamento',
      'slide between notes',
      'glide up',
      'glissando effect',
    ],
  },
  {
    id: createLexemeId('adj', 'spiccato'),
    lemma: 'spiccato',
    variants: ['bouncing', 'bounced', 'ricochet'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'articulation',
      aspect: 'bowing',
    },
    description: 'Bouncing bow articulation (string technique)',
    examples: [
      'use spiccato',
      'bouncing bow',
      'light bounce',
      'add spiccato bowing',
    ],
  },
  {
    id: createLexemeId('adj', 'pizzicato'),
    lemma: 'pizzicato',
    variants: ['plucked', 'pizz'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'articulation',
      aspect: 'bowing',
    },
    description: 'Plucked articulation (string technique)',
    examples: [
      'play pizzicato',
      'pluck the strings',
      'pizz throughout',
      'add plucked notes',
    ],
  },
];

// =============================================================================
// Attack Characteristics
// =============================================================================

/**
 * Attack and onset descriptors.
 *
 * Covers:
 * - Hard vs soft attacks
 * - Fast vs slow onsets
 * - Attack sharpness
 */
const ATTACK_CHARACTERISTIC_LEXEMES: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'hard_attack'),
    lemma: 'hard',
    variants: ['aggressive', 'forceful', 'strong attack', 'harsh attack'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('attack_strength'),
      direction: 'increase'
    },
    description: 'Hard, aggressive note attack with strong transient',
    examples: [
      'harder attacks',
      'make attacks aggressive',
      'forceful onset',
      'strong initial impact',
    ],
  },
  {
    id: createLexemeId('adj', 'soft_attack'),
    lemma: 'soft',
    variants: ['gentle', 'delicate', 'subtle attack', 'light attack'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('attack_strength'),
      direction: 'decrease'
    },
    description: 'Soft, gentle note attack with minimal transient',
    examples: [
      'softer attacks',
      'gentle onset',
      'delicate articulation',
      'light touch',
    ],
  },
  {
    id: createLexemeId('adj', 'sharp_attack'),
    lemma: 'sharp',
    variants: ['crisp', 'clear', 'defined', 'precise attack'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('attack_definition'),
      direction: 'increase'
    },
    description: 'Sharp, well-defined attack with clear onset',
    examples: [
      'sharper attacks',
      'crisp articulation',
      'clear definition',
      'precise onsets',
    ],
  },
  {
    id: createLexemeId('adj', 'rounded_attack'),
    lemma: 'rounded',
    variants: ['smooth', 'mellow attack', 'soft-edged'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('attack_definition'),
      direction: 'decrease'
    },
    description: 'Rounded, softened attack with gradual onset',
    examples: [
      'round off attacks',
      'smooth the onset',
      'mellow the articulation',
      'soften the edges',
    ],
  },
  {
    id: createLexemeId('adj', 'accented'),
    lemma: 'accented',
    variants: ['emphasized', 'stressed', 'with accent'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('accent_strength'),
      direction: 'increase'
    },
    description: 'Accented articulation with emphasized attacks',
    examples: [
      'accent the notes',
      'emphasize attacks',
      'add accents',
      'stress the downbeats',
    ],
  },
  {
    id: createLexemeId('adj', 'sforzando'),
    lemma: 'sforzando',
    variants: ['sfz', 'suddenly loud', 'forced', 'sudden accent'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('accent_strength'),
      direction: 'increase'
    },
    description: 'Sudden, strong accent (sforzando)',
    examples: [
      'add sforzando',
      'sudden forte',
      'forced accent',
      'dramatic emphasis',
    ],
  },
  {
    id: createLexemeId('adj', 'col_legno'),
    lemma: 'col legno',
    variants: ['with the wood', 'wood of bow'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'articulation',
      aspect: 'bowing',
      
    },
    description: 'Col legno articulation (striking with wood of bow)',
    examples: [
      'play col legno',
      'use wood of bow',
      'percussive bowing',
      'tap with bow stick',
    ],
  },
  {
    id: createLexemeId('adj', 'sul_ponticello'),
    lemma: 'sul ponticello',
    variants: ['near bridge', 'ponticello'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'articulation',
      aspect: 'bowing',
      
    },
    description: 'Sul ponticello articulation (bowing near bridge)',
    examples: [
      'play sul ponticello',
      'bow near bridge',
      'glassy tone',
      'metallic sound',
    ],
  },
];

// =============================================================================
// Decay and Release Properties
// =============================================================================

/**
 * Note decay and release descriptors.
 *
 * Covers:
 * - Long vs short decay
 * - Natural vs abrupt release
 * - Sustain characteristics
 */
const DECAY_RELEASE_LEXEMES: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'sustained'),
    lemma: 'sustained',
    variants: ['long', 'held', 'prolonged', 'continuing'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('sustain_length'),
      direction: 'increase'
    },
    description: 'Long, sustained decay with extended note duration',
    examples: [
      'sustain longer',
      'hold the notes',
      'extend the decay',
      'let ring',
    ],
  },
  {
    id: createLexemeId('adj', 'damped'),
    lemma: 'damped',
    variants: ['muted', 'shortened', 'cut off', 'clipped'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('sustain_length'),
      direction: 'decrease'
    },
    description: 'Short, damped decay with quick note cutoff',
    examples: [
      'damp the notes',
      'cut short',
      'quick release',
      'stop the ring',
    ],
  },
  {
    id: createLexemeId('adj', 'ringing'),
    lemma: 'ringing',
    variants: ['resonant', 'echoing', 'reverberant'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('resonance'),
      direction: 'increase'
    },
    description: 'Ringing, resonant decay with extended overtones',
    examples: [
      'let it ring',
      'add resonance',
      'resonant decay',
      'open sustain',
    ],
  },
  {
    id: createLexemeId('adj', 'dead'),
    lemma: 'dead',
    variants: ['dry', 'non-resonant', 'immediate stop'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('resonance'),
      direction: 'decrease'
    },
    description: 'Dead, non-resonant decay with immediate stop',
    examples: [
      'dead notes',
      'kill the resonance',
      'dry articulation',
      'no ring',
    ],
  },
  {
    id: createLexemeId('adj', 'natural_release'),
    lemma: 'natural',
    variants: ['organic release', 'gradual fade', 'dying away'],
    category: 'adj',
    semantics: {

      type: 'concept',

      domain: 'articulation',

      aspect: 'release_shape',

    },
    description: 'Natural, gradual release with organic decay',
    examples: [
      'natural release',
      'fade naturally',
      'organic decay',
      'let decay naturally',
    ],
  },
  {
    id: createLexemeId('adj', 'abrupt_release'),
    lemma: 'abrupt',
    variants: ['sudden stop', 'immediate cutoff', 'hard stop'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('release_shape'),
      direction: 'decrease'
    },
    description: 'Abrupt release with sudden note termination',
    examples: [
      'abrupt release',
      'sudden stop',
      'cut off sharply',
      'hard termination',
    ],
  },
  {
    id: createLexemeId('adj', 'crescendo_release'),
    lemma: 'crescendo',
    variants: ['growing', 'swelling', 'building to end'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('dynamic_shape'),
      direction: 'increase'
    },
    description: 'Growing dynamic during note duration (crescendo)',
    examples: [
      'crescendo through',
      'swell the note',
      'build to release',
      'grow louder',
    ],
  },
  {
    id: createLexemeId('adj', 'diminuendo_release'),
    lemma: 'diminuendo',
    variants: ['fading', 'dying away', 'decrescendo'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('dynamic_shape'),
      direction: 'decrease'
    },
    description: 'Fading dynamic during note duration (diminuendo)',
    examples: [
      'diminuendo through',
      'fade the note',
      'die away',
      'get quieter',
    ],
  },
];

// =============================================================================
// Phrasing Shapes
// =============================================================================

/**
 * Musical phrase shape descriptors.
 *
 * Covers:
 * - Phrase arcs and contours
 * - Breathing patterns
 * - Continuity vs segmentation
 */
const PHRASING_SHAPE_LEXEMES: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'arching'),
    lemma: 'arching',
    variants: ['arched', 'curved', 'dome-shaped phrase'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('phrase_shape'),
      direction: 'increase'
    },
    description: 'Arching phrase shape with dynamic peak in middle',
    examples: [
      'arching phrases',
      'curve the line',
      'dome-shaped dynamics',
      'peak in middle',
    ],
  },
  {
    id: createLexemeId('adj', 'linear_phrase'),
    lemma: 'linear',
    variants: ['flat', 'level', 'even phrase'],
    category: 'adj',
    semantics: {

      type: 'concept',

      domain: 'articulation',

      aspect: 'phrase_shape',

    },
    description: 'Linear, even phrase shape with consistent dynamics',
    examples: [
      'linear phrasing',
      'even dynamics',
      'flat phrase',
      'consistent level',
    ],
  },
  {
    id: createLexemeId('adj', 'terraced'),
    lemma: 'terraced',
    variants: ['stepped', 'plateaued', 'level changes'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('phrase_shape'),
      direction: 'decrease'
    },
    description: 'Terraced phrase shape with distinct dynamic levels',
    examples: [
      'terraced dynamics',
      'stepped phrasing',
      'clear levels',
      'plateaued sections',
    ],
  },
  {
    id: createLexemeId('adj', 'continuous'),
    lemma: 'continuous',
    variants: ['flowing', 'unbroken', 'seamless phrase'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('phrase_continuity'),
      direction: 'increase'
    },
    description: 'Continuous, flowing phrasing without breaks',
    examples: [
      'continuous phrasing',
      'flowing line',
      'unbroken phrases',
      'seamless connection',
    ],
  },
  {
    id: createLexemeId('adj', 'segmented'),
    lemma: 'segmented',
    variants: ['broken up', 'separated', 'distinct phrases'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('phrase_continuity'),
      direction: 'decrease'
    },
    description: 'Segmented phrasing with clear phrase boundaries',
    examples: [
      'segmented phrasing',
      'break into phrases',
      'distinct sections',
      'clear separations',
    ],
  },
  {
    id: createLexemeId('adj', 'breathing'),
    lemma: 'breathing',
    variants: ['breathy', 'vocal-like', 'with breath'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('phrase_breathing'),
      direction: 'increase'
    },
    description: 'Phrasing with natural breathing pauses',
    examples: [
      'add breathing',
      'breathe with phrases',
      'vocal phrasing',
      'natural pauses',
    ],
  },
  {
    id: createLexemeId('adj', 'long_lined'),
    lemma: 'long-lined',
    variants: ['extended', 'long phrase', 'continuous line'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('phrase_length'),
      direction: 'increase'
    },
    description: 'Long-lined phrasing with extended phrase lengths',
    examples: [
      'long-lined phrases',
      'extend the phrases',
      'continuous line',
      'sustained phrasing',
    ],
  },
  {
    id: createLexemeId('adj', 'short_phrased'),
    lemma: 'short-phrased',
    variants: ['brief', 'compact', 'concise phrases'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('phrase_length'),
      direction: 'decrease'
    },
    description: 'Short, compact phrasing with brief phrase units',
    examples: [
      'short phrases',
      'compact phrasing',
      'brief sections',
      'concise expression',
    ],
  },
];

// =============================================================================
// Performance Gestures
// =============================================================================

/**
 * Performance gesture and technique descriptors.
 *
 * Covers:
 * - Ornamental gestures
 * - Expressive techniques
 * - Performance inflections
 */
const PERFORMANCE_GESTURE_LEXEMES: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'vibrato'),
    lemma: 'vibrato',
    variants: ['with vibrato', 'oscillation', 'pitch fluctuation'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'articulation',
      aspect: 'vibrato',
      
    },
    description: 'Vibrato technique with periodic pitch oscillation',
    examples: [
      'add vibrato',
      'vibrato on sustains',
      'rich vibrato',
      'oscillate pitch',
    ],
  },
  {
    id: createLexemeId('noun', 'trill'),
    lemma: 'trill',
    variants: ['trilled', 'rapid alternation', 'shake'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'articulation',
      aspect: 'ornament',
      
    },
    description: 'Trill ornament with rapid note alternation',
    examples: [
      'add trill',
      'trill the note',
      'rapid alternation',
      'shake between notes',
    ],
  },
  {
    id: createLexemeId('noun', 'grace_note'),
    lemma: 'grace note',
    variants: ['acciaccatura', 'appoggiatura', 'ornament'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'articulation',
      aspect: 'ornament',
      
    },
    description: 'Grace note ornament before main note',
    examples: [
      'add grace notes',
      'ornament with grace',
      'quick appoggiatura',
      'decorative note',
    ],
  },
  {
    id: createLexemeId('noun', 'bend'),
    lemma: 'bend',
    variants: ['pitch bend', 'bent note', 'blue note'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'articulation',
      aspect: 'pitch_inflection',
      
    },
    description: 'Pitch bend technique (common in blues and rock)',
    examples: [
      'bend the note',
      'add pitch bend',
      'blue note bend',
      'bend up to pitch',
    ],
  },
  {
    id: createLexemeId('noun', 'slide'),
    lemma: 'slide',
    variants: ['glissando', 'portamento', 'scoop'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'articulation',
      aspect: 'pitch_inflection',
      
    },
    description: 'Sliding pitch gesture between notes',
    examples: [
      'slide into note',
      'add slides',
      'scoop up',
      'glide between pitches',
    ],
  },
  {
    id: createLexemeId('noun', 'hammer_on'),
    lemma: 'hammer-on',
    variants: ['hammer', 'slur up'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'articulation',
      aspect: 'technique',
      
    },
    description: 'Hammer-on technique (guitar/bass)',
    examples: [
      'hammer on',
      'slur up',
      'legato ascent',
      'finger hammering',
    ],
  },
  {
    id: createLexemeId('noun', 'pull_off'),
    lemma: 'pull-off',
    variants: ['pull off', 'slur down'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'articulation',
      aspect: 'technique',
      
    },
    description: 'Pull-off technique (guitar/bass)',
    examples: [
      'pull off',
      'slur down',
      'legato descent',
      'finger pulling',
    ],
  },
  {
    id: createLexemeId('noun', 'ghost_note'),
    lemma: 'ghost note',
    variants: ['muted note', 'dead note', 'percussive hit'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'articulation',
      aspect: 'technique',
      
    },
    description: 'Ghost note technique (muted, percussive articulation)',
    examples: [
      'add ghost notes',
      'muted hits',
      'percussive articulation',
      'dead note texture',
    ],
  },
];

// =============================================================================
// Export Combined Vocabulary
// =============================================================================

/**
 * All articulation and phrasing vocabulary entries from Batch 61.
 */
export const ARTICULATION_PHRASING_BATCH_61: readonly Lexeme[] = [
  ...BASIC_ARTICULATION_LEXEMES,
  ...ATTACK_CHARACTERISTIC_LEXEMES,
  ...DECAY_RELEASE_LEXEMES,
  ...PHRASING_SHAPE_LEXEMES,
  ...PERFORMANCE_GESTURE_LEXEMES,
];

/**
 * Count of entries in Batch 61.
 */
export const BATCH_61_COUNT = ARTICULATION_PHRASING_BATCH_61.length;

/**
 * Batch 61 summary for documentation.
 */
export const BATCH_61_SUMMARY = {
  batchNumber: 61,
  name: 'Articulation and Phrasing Descriptors',
  entryCount: BATCH_61_COUNT,
  categories: [
    'Basic articulation types (legato, staccato, marcato, etc.)',
    'Attack characteristics (hard, soft, sharp, etc.)',
    'Decay and release properties (sustained, damped, etc.)',
    'Phrasing shapes (arching, linear, continuous, etc.)',
    'Performance gestures (vibrato, trill, bend, etc.)',
  ],
  axesIntroduced: [
    'articulation',
    'attack_strength',
    'attack_definition',
    'accent_strength',
    'note_duration',
    'pitch_continuity',
    'sustain_length',
    'resonance',
    'release_shape',
    'dynamic_shape',
    'phrase_shape',
    'phrase_continuity',
    'phrase_breathing',
    'phrase_length',
  ],
  techniquesDefined: [
    'spiccato',
    'pizzicato',
    'col_legno',
    'sul_ponticello',
    'vibrato',
    'trill',
    'grace_note',
    'bend',
    'slide',
    'hammer_on',
    'pull_off',
    'ghost_note',
  ],
} as const;
