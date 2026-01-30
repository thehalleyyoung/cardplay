/**
 * GOFAI Musical Vocabulary — Batch 36: Production & Mixing Natural Language Terms
 *
 * Comprehensive vocabulary for how musicians and producers describe production
 * techniques, mixing decisions, spatial placement, dynamics processing, and
 * audio effects in natural, conversational language.
 *
 * @module gofai/canon/production-mixing-vocabulary-batch36
 */

import {
  type LexemeId,
  type Lexeme,
  createLexemeId,
  createAxisId,
  createOpcodeId,
} from './types.js';

// =============================================================================
// Spatial Placement and Panning Terms
// =============================================================================

/**
 * How musicians describe stereo and spatial placement.
 */
export const SPATIAL_PLACEMENT_TERMS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'centered'),
    lemma: 'centered',
    variants: ['in-the-middle', 'mono-center', 'dead-center'],
    category: 'adj',
    semantics: {
      type: 'spatial-position',
      position: 'center',
      implies: [
        { type: 'pan', value: 0.0 },
        { type: 'equal-left-right' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#centered',
  },
  {
    id: createLexemeId('adj', 'panned-left'),
    lemma: 'left',
    variants: ['to-the-left', 'left-side', 'hard-left'],
    category: 'adj',
    semantics: {
      type: 'spatial-position',
      position: 'left',
      implies: [
        { type: 'pan', value: -0.5 },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#panned-left',
  },
  {
    id: createLexemeId('adj', 'panned-right'),
    lemma: 'right',
    variants: ['to-the-right', 'right-side', 'hard-right'],
    category: 'adj',
    semantics: {
      type: 'spatial-position',
      position: 'right',
      implies: [
        { type: 'pan', value: +0.5 },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#panned-right',
  },
  {
    id: createLexemeId('adj', 'wide-stereo'),
    lemma: 'wide',
    variants: ['spread-wide', 'expansive-stereo', 'broad-image'],
    category: 'adj',
    semantics: {
      type: 'axis-increase',
      axis: createAxisId('width'),
      amount: 0.8,
      implies: [
        { type: 'stereo-width', value: 150 },
        { type: 'm-s-processing' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#wide-stereo',
  },
  {
    id: createLexemeId('adj', 'narrow-stereo'),
    lemma: 'narrow',
    variants: ['tight-stereo', 'mono-like', 'focused-center'],
    category: 'adj',
    semantics: {
      type: 'axis-decrease',
      axis: createAxisId('width'),
      amount: 0.7,
      implies: [
        { type: 'stereo-width', value: 50 },
        { type: 'reduce-side-content' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#narrow-stereo',
  },
  {
    id: createLexemeId('adj', 'upfront-mix'),
    lemma: 'upfront',
    variants: ['in-your-face', 'forward-in-mix', 'present'],
    category: 'adj',
    semantics: {
      type: 'axis-decrease',
      axis: createAxisId('depth'),
      amount: 0.8,
      implies: [
        { type: 'reduce-reverb' },
        { type: 'increase-brightness' },
        { type: 'louder-level' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#upfront-mix',
  },
  {
    id: createLexemeId('adj', 'pushed-back'),
    lemma: 'pushed-back',
    variants: ['recessed', 'distant-in-mix', 'background'],
    category: 'adj',
    semantics: {
      type: 'axis-increase',
      axis: createAxisId('depth'),
      amount: 0.8,
      implies: [
        { type: 'increase-reverb' },
        { type: 'reduce-brightness' },
        { type: 'quieter-level' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#pushed-back',
  },
];

// =============================================================================
// Dynamics and Compression Terms
// =============================================================================

/**
 * How musicians describe dynamics processing and compression.
 */
export const DYNAMICS_COMPRESSION_TERMS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'compressed'),
    lemma: 'compressed',
    variants: ['squashed', 'tight-dynamics', 'controlled'],
    category: 'adj',
    semantics: {
      type: 'axis-decrease',
      axis: createAxisId('dynamic-range'),
      amount: 0.7,
      implies: [
        { type: 'apply-compression', ratio: 4 },
        { type: 'reduce-peak-to-average-difference' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#compressed',
  },
  {
    id: createLexemeId('adj', 'dynamic'),
    lemma: 'dynamic',
    variants: ['expressive-dynamics', 'wide-range', 'uncompressed'],
    category: 'adj',
    semantics: {
      type: 'axis-increase',
      axis: createAxisId('dynamic-range'),
      amount: 0.8,
      implies: [
        { type: 'reduce-compression' },
        { type: 'preserve-peaks' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#dynamic',
  },
  {
    id: createLexemeId('adj', 'pumping-compression'),
    lemma: 'pumping',
    variants: ['breathing', 'audible-compression', 'ducking'],
    category: 'adj',
    semantics: {
      type: 'compression-character',
      character: 'pumping',
      implies: [
        { type: 'sidechain-compression', source: 'kick' },
        { type: 'fast-release' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#pumping-compression',
  },
  {
    id: createLexemeId('adj', 'transparent-compression'),
    lemma: 'transparent',
    variants: ['invisible-compression', 'gentle-compression'],
    category: 'adj',
    semantics: {
      type: 'compression-character',
      character: 'transparent',
      implies: [
        { type: 'low-ratio', ratio: 2 },
        { type: 'slow-attack', attack: 30 },
        { type: 'inaudible-processing' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#transparent-compression',
  },
  {
    id: createLexemeId('adj', 'aggressive-compression'),
    lemma: 'aggressive',
    variants: ['heavy-compression', 'obvious-compression', 'slammed'],
    category: 'adj',
    semantics: {
      type: 'compression-character',
      character: 'aggressive',
      implies: [
        { type: 'high-ratio', ratio: 8 },
        { type: 'fast-attack', attack: 1 },
        { type: 'audible-processing' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#aggressive-compression',
  },
];

// =============================================================================
// EQ and Frequency Terms
// =============================================================================

/**
 * How musicians describe EQ and frequency content.
 */
export const EQ_FREQUENCY_TERMS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'bassy'),
    lemma: 'bassy',
    variants: ['bass-heavy', 'bottom-heavy', 'low-end-rich'],
    category: 'adj',
    semantics: {
      type: 'frequency-emphasis',
      band: 'low',
      implies: [
        { type: 'boost-low-frequencies', freq: 80, gain: +4 },
        { type: 'increase-bass-presence' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#bassy',
  },
  {
    id: createLexemeId('adj', 'muddy'),
    lemma: 'muddy',
    variants: ['unclear-low-mid', 'boomy', 'woofy'],
    category: 'adj',
    semantics: {
      type: 'frequency-problem',
      band: 'low-mid',
      implies: [
        { type: 'excess-energy', freq: 250, suggestion: 'cut' },
        { type: 'lack-of-clarity' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#muddy',
  },
  {
    id: createLexemeId('adj', 'clear-mid'),
    lemma: 'clear',
    variants: ['defined', 'articulate', 'present'],
    category: 'adj',
    semantics: {
      type: 'frequency-quality',
      band: 'mid',
      implies: [
        { type: 'balanced-midrange' },
        { type: 'good-intelligibility' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#clear-mid',
  },
  {
    id: createLexemeId('adj', 'honky'),
    lemma: 'honky',
    variants: ['nasal', 'boxy', 'telephone-like'],
    category: 'adj',
    semantics: {
      type: 'frequency-problem',
      band: 'mid',
      implies: [
        { type: 'excess-energy', freq: 1000, suggestion: 'cut' },
        { type: 'unpleasant-resonance' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#honky',
  },
  {
    id: createLexemeId('adj', 'bright-eq'),
    lemma: 'bright',
    variants: ['trebly', 'top-heavy', 'shiny'],
    category: 'adj',
    semantics: {
      type: 'frequency-emphasis',
      band: 'high',
      implies: [
        { type: 'boost-high-frequencies', freq: 8000, gain: +3 },
        { type: 'increase-presence' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#bright-eq',
  },
  {
    id: createLexemeId('adj', 'harsh'),
    lemma: 'harsh',
    variants: ['piercing', 'shrill', 'brittle'],
    category: 'adj',
    semantics: {
      type: 'frequency-problem',
      band: 'high',
      implies: [
        { type: 'excess-energy', freq: 4000, suggestion: 'cut' },
        { type: 'fatiguing-quality' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#harsh',
  },
  {
    id: createLexemeId('adj', 'scooped'),
    lemma: 'scooped',
    variants: ['mid-scooped', 'smile-curve', 'hollowed-out'],
    category: 'adj',
    semantics: {
      type: 'frequency-shape',
      shape: 'scooped',
      implies: [
        { type: 'cut-midrange', freq: 800, q: 1.5 },
        { type: 'boost-lows-and-highs' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#scooped',
  },
];

// =============================================================================
// Reverb and Space Terms
// =============================================================================

/**
 * How musicians describe reverb and spatial effects.
 */
export const REVERB_SPACE_TERMS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'dry'),
    lemma: 'dry',
    variants: ['no-reverb', 'dead', 'anechoic'],
    category: 'adj',
    semantics: {
      type: 'reverb-amount',
      amount: 'none',
      implies: [
        { type: 'reduce-reverb', value: 0 },
        { type: 'intimate-space' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#dry',
  },
  {
    id: createLexemeId('adj', 'wet'),
    lemma: 'wet',
    variants: ['reverb-heavy', 'washy', 'swimming'],
    category: 'adj',
    semantics: {
      type: 'reverb-amount',
      amount: 'high',
      implies: [
        { type: 'increase-reverb', value: 0.5 },
        { type: 'spacious-sound' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#wet',
  },
  {
    id: createLexemeId('adj', 'room-reverb'),
    lemma: 'roomy',
    variants: ['room-sound', 'small-space'],
    category: 'adj',
    semantics: {
      type: 'reverb-type',
      reverbType: 'room',
      implies: [
        { type: 'short-decay', time: 0.8 },
        { type: 'intimate-space' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#room-reverb',
  },
  {
    id: createLexemeId('adj', 'hall-reverb'),
    lemma: 'hall-like',
    variants: ['concert-hall', 'large-space'],
    category: 'adj',
    semantics: {
      type: 'reverb-type',
      reverbType: 'hall',
      implies: [
        { type: 'long-decay', time: 3.0 },
        { type: 'grand-space' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#hall-reverb',
  },
  {
    id: createLexemeId('adj', 'plate-reverb'),
    lemma: 'plate-like',
    variants: ['vintage-reverb', 'plate-sound'],
    category: 'adj',
    semantics: {
      type: 'reverb-type',
      reverbType: 'plate',
      implies: [
        { type: 'bright-reverb' },
        { type: 'dense-tail' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#plate-reverb',
  },
  {
    id: createLexemeId('adj', 'spring-reverb'),
    lemma: 'springy',
    variants: ['spring-sound', 'vintage-spring'],
    category: 'adj',
    semantics: {
      type: 'reverb-type',
      reverbType: 'spring',
      implies: [
        { type: 'metallic-character' },
        { type: 'short-bright-tail' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#spring-reverb',
  },
];

// =============================================================================
// Delay and Echo Terms
// =============================================================================

/**
 * How musicians describe delay and echo effects.
 */
export const DELAY_ECHO_TERMS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'slap-delay'),
    lemma: 'slap-delay',
    variants: ['slapback', 'quick-echo'],
    category: 'noun',
    semantics: {
      type: 'delay-type',
      delayType: 'slapback',
      implies: [
        { type: 'short-delay-time', time: 100 },
        { type: 'single-repeat' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#slap-delay',
  },
  {
    id: createLexemeId('noun', 'dotted-eighth-delay'),
    lemma: 'dotted-eighth',
    variants: ['dotted-delay', 'edge-delay'],
    category: 'noun',
    semantics: {
      type: 'delay-type',
      delayType: 'rhythmic',
      implies: [
        { type: 'tempo-synced', division: 'dotted-eighth' },
        { type: 'rhythmic-texture' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#dotted-eighth-delay',
  },
  {
    id: createLexemeId('noun', 'ping-pong-delay'),
    lemma: 'ping-pong',
    variants: ['stereo-delay', 'bouncing-delay'],
    category: 'noun',
    semantics: {
      type: 'delay-type',
      delayType: 'ping-pong',
      implies: [
        { type: 'alternating-stereo' },
        { type: 'wide-image' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#ping-pong-delay',
  },
  {
    id: createLexemeId('adj', 'washy-delay'),
    lemma: 'washy',
    variants: ['ambient-delay', 'diffused-delay'],
    category: 'adj',
    semantics: {
      type: 'delay-character',
      character: 'washy',
      implies: [
        { type: 'filtered-repeats' },
        { type: 'high-feedback', feedback: 0.7 },
        { type: 'ambient-texture' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#washy-delay',
  },
];

// =============================================================================
// Saturation and Distortion Terms
// =============================================================================

/**
 * How musicians describe saturation and distortion.
 */
export const SATURATION_DISTORTION_TERMS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'saturated'),
    lemma: 'saturated',
    variants: ['driven', 'colored', 'harmonically-enhanced'],
    category: 'adj',
    semantics: {
      type: 'axis-increase',
      axis: createAxisId('saturation'),
      amount: 0.6,
      implies: [
        { type: 'add-harmonics' },
        { type: 'subtle-distortion' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#saturated',
  },
  {
    id: createLexemeId('adj', 'clean-tone'),
    lemma: 'clean',
    variants: ['pristine', 'uncolored', 'transparent-tone'],
    category: 'adj',
    semantics: {
      type: 'axis-decrease',
      axis: createAxisId('saturation'),
      amount: 0.9,
      implies: [
        { type: 'remove-distortion' },
        { type: 'linear-processing' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#clean-tone',
  },
  {
    id: createLexemeId('adj', 'tape-saturation'),
    lemma: 'tape-like',
    variants: ['analog-warmth', 'tape-sound'],
    category: 'adj',
    semantics: {
      type: 'saturation-type',
      saturationType: 'tape',
      implies: [
        { type: 'warm-harmonic-content' },
        { type: 'gentle-compression' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#tape-saturation',
  },
  {
    id: createLexemeId('adj', 'tube-saturation'),
    lemma: 'tube-like',
    variants: ['valve-sound', 'tube-warmth'],
    category: 'adj',
    semantics: {
      type: 'saturation-type',
      saturationType: 'tube',
      implies: [
        { type: 'even-harmonic-emphasis' },
        { type: 'smooth-overdrive' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#tube-saturation',
  },
];

// =============================================================================
// Mix Balance and Level Terms
// =============================================================================

/**
 * How musicians describe mix balance and relative levels.
 */
export const MIX_BALANCE_TERMS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'buried-in-mix'),
    lemma: 'buried',
    variants: ['too-quiet', 'lost-in-mix', 'inaudible'],
    category: 'adj',
    semantics: {
      type: 'level-problem',
      problem: 'too-quiet',
      implies: [
        { type: 'increase-level', amount: +6 },
        { type: 'improve-presence' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#buried-in-mix',
  },
  {
    id: createLexemeId('adj', 'too-loud-mix'),
    lemma: 'too-loud',
    variants: ['overpowering', 'dominating', 'sticking-out'],
    category: 'adj',
    semantics: {
      type: 'level-problem',
      problem: 'too-loud',
      implies: [
        { type: 'decrease-level', amount: -4 },
        { type: 'blend-better' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#too-loud-mix',
  },
  {
    id: createLexemeId('adj', 'balanced-mix'),
    lemma: 'balanced',
    variants: ['well-balanced', 'cohesive', 'integrated'],
    category: 'adj',
    semantics: {
      type: 'mix-quality',
      quality: 'balanced',
      implies: [
        { type: 'appropriate-relative-levels' },
        { type: 'good-frequency-distribution' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/production.md#balanced-mix',
  },
];

// =============================================================================
// Export Collections
// =============================================================================

export const PRODUCTION_MIXING_VOCABULARY_BATCH36 = [
  ...SPATIAL_PLACEMENT_TERMS,
  ...DYNAMICS_COMPRESSION_TERMS,
  ...EQ_FREQUENCY_TERMS,
  ...REVERB_SPACE_TERMS,
  ...DELAY_ECHO_TERMS,
  ...SATURATION_DISTORTION_TERMS,
  ...MIX_BALANCE_TERMS,
] as const;

export const BATCH36_LEXEME_COUNT = PRODUCTION_MIXING_VOCABULARY_BATCH36.length;

export const PRODUCTION_MIXING_LEXEME_MAP = new Map(
  PRODUCTION_MIXING_VOCABULARY_BATCH36.map((lex) => [lex.id, lex])
);

export function getProductionMixingLexeme(id: LexemeId): Lexeme | undefined {
  return PRODUCTION_MIXING_LEXEME_MAP.get(id);
}

export function findProductionLexemeByLemma(lemma: string): readonly Lexeme[] {
  const lower = lemma.toLowerCase();
  return PRODUCTION_MIXING_VOCABULARY_BATCH36.filter(
    (lex) => lex.lemma.toLowerCase() === lower ||
      lex.variants.some((v) => v.toLowerCase() === lower)
  );
}
