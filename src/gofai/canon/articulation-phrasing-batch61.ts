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
  type LexemeId,
  type AxisId,
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
    id: createLexemeId('adjective', 'legato'),
    lemma: 'legato',
    variants: ['smooth', 'connected', 'flowing', 'seamless'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('articulation'),
      direction: 'positive',
      magnitude: 'medium',
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
    id: createLexemeId('adjective', 'staccato'),
    lemma: 'staccato',
    variants: ['detached', 'separated', 'short', 'choppy'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('articulation'),
      direction: 'negative',
      magnitude: 'medium',
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
    id: createLexemeId('adjective', 'marcato'),
    lemma: 'marcato',
    variants: ['marked', 'accented', 'emphasized'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('accent_strength'),
      direction: 'positive',
      magnitude: 'medium',
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
    id: createLexemeId('adjective', 'tenuto'),
    lemma: 'tenuto',
    variants: ['held', 'sustained', 'full-length'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('note_duration'),
      direction: 'positive',
      magnitude: 'small',
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
    id: createLexemeId('adjective', 'portato'),
    lemma: 'portato',
    variants: ['carried', 'semi-detached', 'portamento'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('articulation'),
      direction: 'neutral',
      magnitude: 'small',
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
    id: createLexemeId('adjective', 'portamento'),
    lemma: 'portamento',
    variants: ['sliding', 'gliding', 'glissando', 'slide'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('pitch_continuity'),
      direction: 'positive',
      magnitude: 'large',
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
    id: createLexemeId('adjective', 'spiccato'),
    lemma: 'spiccato',
    variants: ['bouncing', 'bounced', 'ricochet'],
    category: 'adjective',
    semantics: {
      type: 'concept',
      domain: 'articulation',
      aspect: 'bowing',
      technique: 'spiccato',
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
    id: createLexemeId('adjective', 'pizzicato'),
    lemma: 'pizzicato',
    variants: ['plucked', 'pizz'],
    category: 'adjective',
    semantics: {
      type: 'concept',
      domain: 'articulation',
      aspect: 'bowing',
      technique: 'pizzicato',
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
    id: createLexemeId('adjective', 'hard_attack'),
    lemma: 'hard',
    variants: ['aggressive', 'forceful', 'strong attack', 'harsh attack'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('attack_strength'),
      direction: 'positive',
      magnitude: 'large',
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
    id: createLexemeId('adjective', 'soft_attack'),
    lemma: 'soft',
    variants: ['gentle', 'delicate', 'subtle attack', 'light attack'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('attack_strength'),
      direction: 'negative',
      magnitude: 'large',
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
    id: createLexemeId('adjective', 'sharp_attack'),
    lemma: 'sharp',
    variants: ['crisp', 'clear', 'defined', 'precise attack'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('attack_definition'),
      direction: 'positive',
      magnitude: 'medium',
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
    id: createLexemeId('adjective', 'rounded_attack'),
    lemma: 'rounded',
    variants: ['smooth', 'mellow attack', 'soft-edged'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('attack_definition'),
      direction: 'negative',
      magnitude: 'medium',
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
    id: createLexemeId('adjective', 'accented'),
    lemma: 'accented',
    variants: ['emphasized', 'stressed', 'with accent'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('accent_strength'),
      direction: 'positive',
      magnitude: 'medium',
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
    id: createLexemeId('adjective', 'sforzando'),
    lemma: 'sforzando',
    variants: ['sfz', 'suddenly loud', 'forced', 'sudden accent'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('accent_strength'),
      direction: 'positive',
      magnitude: 'large',
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
    id: createLexemeId('adjective', 'col_legno'),
    lemma: 'col legno',
    variants: ['with the wood', 'wood of bow'],
    category: 'adjective',
    semantics: {
      type: 'concept',
      domain: 'articulation',
      aspect: 'bowing',
      technique: 'col_legno',
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
    id: createLexemeId('adjective', 'sul_ponticello'),
    lemma: 'sul ponticello',
    variants: ['near bridge', 'ponticello'],
    category: 'adjective',
    semantics: {
      type: 'concept',
      domain: 'articulation',
      aspect: 'bowing',
      technique: 'sul_ponticello',
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
    id: createLexemeId('adjective', 'sustained'),
    lemma: 'sustained',
    variants: ['long', 'held', 'prolonged', 'continuing'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('sustain_length'),
      direction: 'positive',
      magnitude: 'large',
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
    id: createLexemeId('adjective', 'damped'),
    lemma: 'damped',
    variants: ['muted', 'shortened', 'cut off', 'clipped'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('sustain_length'),
      direction: 'negative',
      magnitude: 'large',
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
    id: createLexemeId('adjective', 'ringing'),
    lemma: 'ringing',
    variants: ['resonant', 'echoing', 'reverberant'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('resonance'),
      direction: 'positive',
      magnitude: 'medium',
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
    id: createLexemeId('adjective', 'dead'),
    lemma: 'dead',
    variants: ['dry', 'non-resonant', 'immediate stop'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('resonance'),
      direction: 'negative',
      magnitude: 'large',
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
    id: createLexemeId('adjective', 'natural_release'),
    lemma: 'natural',
    variants: ['organic release', 'gradual fade', 'dying away'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('release_shape'),
      direction: 'neutral',
      magnitude: 'small',
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
    id: createLexemeId('adjective', 'abrupt_release'),
    lemma: 'abrupt',
    variants: ['sudden stop', 'immediate cutoff', 'hard stop'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('release_shape'),
      direction: 'negative',
      magnitude: 'large',
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
    id: createLexemeId('adjective', 'crescendo_release'),
    lemma: 'crescendo',
    variants: ['growing', 'swelling', 'building to end'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('dynamic_shape'),
      direction: 'positive',
      magnitude: 'medium',
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
    id: createLexemeId('adjective', 'diminuendo_release'),
    lemma: 'diminuendo',
    variants: ['fading', 'dying away', 'decrescendo'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('dynamic_shape'),
      direction: 'negative',
      magnitude: 'medium',
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
    id: createLexemeId('adjective', 'arching'),
    lemma: 'arching',
    variants: ['arched', 'curved', 'dome-shaped phrase'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('phrase_shape'),
      direction: 'positive',
      magnitude: 'medium',
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
    id: createLexemeId('adjective', 'linear_phrase'),
    lemma: 'linear',
    variants: ['flat', 'level', 'even phrase'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('phrase_shape'),
      direction: 'neutral',
      magnitude: 'small',
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
    id: createLexemeId('adjective', 'terraced'),
    lemma: 'terraced',
    variants: ['stepped', 'plateaued', 'level changes'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('phrase_shape'),
      direction: 'negative',
      magnitude: 'medium',
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
    id: createLexemeId('adjective', 'continuous'),
    lemma: 'continuous',
    variants: ['flowing', 'unbroken', 'seamless phrase'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('phrase_continuity'),
      direction: 'positive',
      magnitude: 'large',
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
    id: createLexemeId('adjective', 'segmented'),
    lemma: 'segmented',
    variants: ['broken up', 'separated', 'distinct phrases'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('phrase_continuity'),
      direction: 'negative',
      magnitude: 'large',
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
    id: createLexemeId('adjective', 'breathing'),
    lemma: 'breathing',
    variants: ['breathy', 'vocal-like', 'with breath'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('phrase_breathing'),
      direction: 'positive',
      magnitude: 'medium',
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
    id: createLexemeId('adjective', 'long_lined'),
    lemma: 'long-lined',
    variants: ['extended', 'long phrase', 'continuous line'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('phrase_length'),
      direction: 'positive',
      magnitude: 'large',
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
    id: createLexemeId('adjective', 'short_phrased'),
    lemma: 'short-phrased',
    variants: ['brief', 'compact', 'concise phrases'],
    category: 'adjective',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('phrase_length'),
      direction: 'negative',
      magnitude: 'large',
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
      technique: 'vibrato',
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
      technique: 'trill',
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
      technique: 'grace_note',
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
      technique: 'bend',
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
      technique: 'slide',
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
      technique: 'hammer_on',
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
      technique: 'pull_off',
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
      technique: 'ghost_note',
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
