/**
 * GOFAI Musical Vocabulary — Batch 35: Rhythm & Groove Natural Language Terms
 *
 * Comprehensive vocabulary for how musicians describe rhythmic feel, groove,
 * timing, articulation, and temporal relationships. This includes both technical
 * terminology and colloquial studio language.
 *
 * @module gofai/canon/rhythm-groove-vocabulary-batch35
 */

import {
  type LexemeId,
  type Lexeme,
  createLexemeId,
  createAxisId,
} from './types.js';

// =============================================================================
// Groove Feel Descriptors
// =============================================================================

/**
 * How musicians describe the overall groove and feel.
 */
export const GROOVE_FEEL_DESCRIPTORS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'locked-groove'),
    lemma: 'locked',
    variants: ['tight', 'in-the-pocket', 'locked-in', 'glued'],
    category: 'adj',
    semantics: {
      type: 'axis-increase',
      axis: createAxisId('groove-tightness'),
      amount: 0.9,
      implies: [
        { type: 'quantize', strength: 0.95 },
        { type: 'minimize-timing-variance' },
        { type: 'align-drums-bass' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#locked-groove',
  },
  {
    id: createLexemeId('adj', 'loose-groove'),
    lemma: 'loose',
    variants: ['laid-back', 'relaxed-timing', 'free-groove'],
    category: 'adj',
    semantics: {
      type: 'axis-decrease',
      axis: createAxisId('groove-tightness'),
      amount: 0.7,
      implies: [
        { type: 'reduce-quantize-strength' },
        { type: 'add-timing-humanization' },
        { type: 'allow-drift' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#loose-groove',
  },
  {
    id: createLexemeId('adj', 'bouncy-groove'),
    lemma: 'bouncy',
    variants: ['springy', 'buoyant-rhythm', 'lively-feel'],
    category: 'adj',
    semantics: {
      type: 'axis-increase',
      axis: createAxisId('rhythmic-bounce'),
      amount: 0.8,
      implies: [
        { type: 'accent-offbeats' },
        { type: 'add-swing-feel' },
        { type: 'emphasize-upbeats' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#bouncy-groove',
  },
  {
    id: createLexemeId('adj', 'heavy-groove'),
    lemma: 'heavy',
    variants: ['weighty', 'grounded-rhythm', 'thick-groove'],
    category: 'adj',
    semantics: {
      type: 'axis-increase',
      axis: createAxisId('rhythmic-weight'),
      amount: 0.8,
      implies: [
        { type: 'emphasize-downbeats' },
        { type: 'increase-low-frequency-hits' },
        { type: 'add-bass-weight' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#heavy-groove',
  },
  {
    id: createLexemeId('adj', 'light-groove'),
    lemma: 'light',
    variants: ['airy-rhythm', 'floating-groove', 'weightless'],
    category: 'adj',
    semantics: {
      type: 'axis-decrease',
      axis: createAxisId('rhythmic-weight'),
      amount: 0.7,
      implies: [
        { type: 'reduce-low-frequency-emphasis' },
        { type: 'lighter-articulation' },
        { type: 'ghost-note-emphasis' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#light-groove',
  },
  {
    id: createLexemeId('adj', 'driving-groove'),
    lemma: 'driving',
    variants: ['propulsive', 'pushing-forward', 'relentless'],
    category: 'adj',
    semantics: {
      type: 'axis-increase',
      axis: createAxisId('forward-momentum'),
      amount: 0.9,
      implies: [
        { type: 'continuous-subdivision' },
        { type: 'minimal-rests' },
        { type: 'building-density' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#driving-groove',
  },
  {
    id: createLexemeId('adj', 'halftime-feel'),
    lemma: 'halftime',
    variants: ['half-time', 'double-time-backbeat'],
    category: 'adj',
    semantics: {
      type: 'rhythmic-transformation',
      transformation: 'halftime',
      implies: [
        { type: 'backbeat-on-3', instead: 'backbeat-on-2-and-4' },
        { type: 'perceived-tempo-half' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#halftime-feel',
  },
  {
    id: createLexemeId('adj', 'doubletime-feel'),
    lemma: 'doubletime',
    variants: ['double-time', 'double-speed-feel'],
    category: 'adj',
    semantics: {
      type: 'rhythmic-transformation',
      transformation: 'doubletime',
      implies: [
        { type: 'double-subdivision-density' },
        { type: 'perceived-tempo-double' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#doubletime-feel',
  },
  {
    id: createLexemeId('adj', 'skippy-groove'),
    lemma: 'skippy',
    variants: ['skipping', 'dotted-feel', 'galloping'],
    category: 'adj',
    semantics: {
      type: 'rhythmic-pattern',
      pattern: 'dotted-eighth-sixteenth',
      implies: [
        { type: 'uneven-subdivision' },
        { type: 'anticipatory-feel' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#skippy-groove',
  },
  {
    id: createLexemeId('adj', 'shuffled-groove'),
    lemma: 'shuffled',
    variants: ['shuffle-feel', 'triplet-based'],
    category: 'adj',
    semantics: {
      type: 'axis-increase',
      axis: createAxisId('swing'),
      amount: 0.8,
      implies: [
        { type: 'triplet-subdivision' },
        { type: 'swing-ratio', ratio: 0.66 },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#shuffled-groove',
  },
];

// =============================================================================
// Timing and Microtiming Terms
// =============================================================================

/**
 * Terms for describing timing precision and micro-timing adjustments.
 */
export const TIMING_MICROTIMING_TERMS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'ahead-of-beat'),
    lemma: 'ahead',
    variants: ['rushing', 'pushing', 'on-top'],
    category: 'adj',
    semantics: {
      type: 'timing-offset',
      direction: 'early',
      amount: 'slight',
      implies: [
        { type: 'shift-earlier', milliseconds: -10 },
        { type: 'increase-urgency-feel' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#ahead-of-beat',
  },
  {
    id: createLexemeId('adj', 'behind-beat'),
    lemma: 'behind',
    variants: ['laid-back', 'dragging', 'behind-the-beat'],
    category: 'adj',
    semantics: {
      type: 'timing-offset',
      direction: 'late',
      amount: 'slight',
      implies: [
        { type: 'shift-later', milliseconds: +15 },
        { type: 'increase-relaxed-feel' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#behind-beat',
  },
  {
    id: createLexemeId('adj', 'rubato'),
    lemma: 'rubato',
    variants: ['tempo-flexible', 'expressive-timing'],
    category: 'adj',
    semantics: {
      type: 'timing-flexibility',
      flexibility: 'high',
      implies: [
        { type: 'variable-tempo' },
        { type: 'expressive-timing-variation' },
        { type: 'phrase-dependent-timing' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#rubato',
  },
  {
    id: createLexemeId('adj', 'metronomic'),
    lemma: 'metronomic',
    variants: ['mechanical', 'perfectly-timed', 'robotic-precision'],
    category: 'adj',
    semantics: {
      type: 'timing-precision',
      precision: 'perfect',
      implies: [
        { type: 'quantize', strength: 1.0 },
        { type: 'zero-timing-variation' },
        { type: 'grid-locked' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#metronomic',
  },
  {
    id: createLexemeId('adj', 'humanized-timing'),
    lemma: 'humanized',
    variants: ['natural-timing', 'organic-feel', 'human-feel'],
    category: 'adj',
    semantics: {
      type: 'timing-variation',
      variation: 'natural',
      implies: [
        { type: 'add-subtle-timing-variance' },
        { type: 'velocity-timing-correlation' },
        { type: 'reduce-mechanical-feel' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#humanized-timing',
  },
];

// =============================================================================
// Articulation and Attack Terms
// =============================================================================

/**
 * Terms for describing how notes are attacked and articulated.
 */
export const ARTICULATION_ATTACK_TERMS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'staccato'),
    lemma: 'staccato',
    variants: ['short', 'detached', 'clipped'],
    category: 'adj',
    semantics: {
      type: 'articulation',
      articulation: 'staccato',
      implies: [
        { type: 'shorten-note-duration', percentage: 0.5 },
        { type: 'emphasize-attack' },
        { type: 'clear-separation' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#staccato',
  },
  {
    id: createLexemeId('adj', 'legato'),
    lemma: 'legato',
    variants: ['smooth', 'connected', 'flowing'],
    category: 'adj',
    semantics: {
      type: 'articulation',
      articulation: 'legato',
      implies: [
        { type: 'extend-note-duration', overlap: 0.1 },
        { type: 'minimize-separation' },
        { type: 'smooth-transitions' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#legato',
  },
  {
    id: createLexemeId('adj', 'marcato'),
    lemma: 'marcato',
    variants: ['marked', 'emphasized', 'accented'],
    category: 'adj',
    semantics: {
      type: 'articulation',
      articulation: 'marcato',
      implies: [
        { type: 'increase-accent' },
        { type: 'strong-attack' },
        { type: 'separated-notes' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#marcato',
  },
  {
    id: createLexemeId('adj', 'tenuto'),
    lemma: 'tenuto',
    variants: ['held', 'sustained', 'full-value'],
    category: 'adj',
    semantics: {
      type: 'articulation',
      articulation: 'tenuto',
      implies: [
        { type: 'hold-full-duration' },
        { type: 'slight-emphasis' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#tenuto',
  },
  {
    id: createLexemeId('adj', 'portato'),
    lemma: 'portato',
    variants: ['carried', 'lightly-detached', 'semi-staccato'],
    category: 'adj',
    semantics: {
      type: 'articulation',
      articulation: 'portato',
      implies: [
        { type: 'medium-separation' },
        { type: 'gentle-emphasis' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#portato',
  },
  {
    id: createLexemeId('adj', 'hard-attack'),
    lemma: 'hard-attack',
    variants: ['aggressive-attack', 'sharp-hit', 'forceful-onset'],
    category: 'adj',
    semantics: {
      type: 'attack-character',
      character: 'hard',
      implies: [
        { type: 'increase-velocity' },
        { type: 'sharpen-transient' },
        { type: 'reduce-attack-time' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#hard-attack',
  },
  {
    id: createLexemeId('adj', 'soft-attack'),
    lemma: 'soft-attack',
    variants: ['gentle-attack', 'gradual-onset', 'smooth-entry'],
    category: 'adj',
    semantics: {
      type: 'attack-character',
      character: 'soft',
      implies: [
        { type: 'decrease-velocity' },
        { type: 'soften-transient' },
        { type: 'increase-attack-time' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#soft-attack',
  },
];

// =============================================================================
// Rhythmic Density Terms
// =============================================================================

/**
 * Terms for describing note density and activity level.
 */
export const RHYTHMIC_DENSITY_TERMS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'sparse-rhythm'),
    lemma: 'sparse',
    variants: ['thin-rhythm', 'minimal-notes', 'space-filled'],
    category: 'adj',
    semantics: {
      type: 'axis-decrease',
      axis: createAxisId('rhythmic-density'),
      amount: 0.7,
      implies: [
        { type: 'reduce-note-count' },
        { type: 'increase-rests' },
        { type: 'emphasize-space' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#sparse-rhythm',
  },
  {
    id: createLexemeId('adj', 'dense-rhythm'),
    lemma: 'dense',
    variants: ['busy-rhythm', 'active', 'note-heavy'],
    category: 'adj',
    semantics: {
      type: 'axis-increase',
      axis: createAxisId('rhythmic-density'),
      amount: 0.8,
      implies: [
        { type: 'increase-note-count' },
        { type: 'reduce-rests' },
        { type: 'fill-space' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#dense-rhythm',
  },
  {
    id: createLexemeId('adj', 'continuous-rhythm'),
    lemma: 'continuous',
    variants: ['unbroken', 'sustained-activity', 'constant-motion'],
    category: 'adj',
    semantics: {
      type: 'rhythmic-continuity',
      continuity: 'high',
      implies: [
        { type: 'minimize-rests' },
        { type: 'overlapping-notes' },
        { type: 'perpetual-motion' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#continuous-rhythm',
  },
  {
    id: createLexemeId('adj', 'punctuated-rhythm'),
    lemma: 'punctuated',
    variants: ['broken', 'interrupted', 'stop-start'],
    category: 'adj',
    semantics: {
      type: 'rhythmic-continuity',
      continuity: 'low',
      implies: [
        { type: 'add-rests' },
        { type: 'clear-breaks' },
        { type: 'phrase-separation' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#punctuated-rhythm',
  },
];

// =============================================================================
// Syncopation and Accent Terms
// =============================================================================

/**
 * Terms for describing syncopation and accent patterns.
 */
export const SYNCOPATION_ACCENT_TERMS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'offbeat-accent'),
    lemma: 'offbeat',
    variants: ['upbeat-accent', 'weak-beat-emphasis'],
    category: 'noun',
    semantics: {
      type: 'accent-pattern',
      pattern: 'offbeat',
      implies: [
        { type: 'emphasize-upbeats' },
        { type: 'de-emphasize-downbeats' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#offbeat-accent',
  },
  {
    id: createLexemeId('noun', 'backbeat'),
    lemma: 'backbeat',
    variants: ['two-and-four', 'snare-beats'],
    category: 'noun',
    semantics: {
      type: 'accent-pattern',
      pattern: 'backbeat',
      implies: [
        { type: 'accent-beats-2-and-4' },
        { type: 'typical-of-rock-pop' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#backbeat',
  },
  {
    id: createLexemeId('noun', 'cross-rhythm'),
    lemma: 'cross-rhythm',
    variants: ['polyrhythm', 'conflicting-meters'],
    category: 'noun',
    semantics: {
      type: 'rhythmic-complexity',
      complexity: 'high',
      implies: [
        { type: 'simultaneous-different-subdivisions' },
        { type: 'metric-conflict' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#cross-rhythm',
  },
  {
    id: createLexemeId('noun', 'hemiola'),
    lemma: 'hemiola',
    variants: ['three-against-two', 'metric-shift'],
    category: 'noun',
    semantics: {
      type: 'rhythmic-device',
      device: 'hemiola',
      implies: [
        { type: 'superimpose-3-over-2' },
        { type: 'temporary-metric-shift' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#hemiola',
  },
  {
    id: createLexemeId('adj', 'anticipated-accent'),
    lemma: 'anticipated',
    variants: ['early-accent', 'pushed-accent'],
    category: 'adj',
    semantics: {
      type: 'accent-timing',
      timing: 'early',
      implies: [
        { type: 'accent-before-beat' },
        { type: 'create-forward-pull' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#anticipated-accent',
  },
  {
    id: createLexemeId('adj', 'delayed-accent'),
    lemma: 'delayed',
    variants: ['late-accent', 'held-back-accent'],
    category: 'adj',
    semantics: {
      type: 'accent-timing',
      timing: 'late',
      implies: [
        { type: 'accent-after-beat' },
        { type: 'create-relaxed-feel' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#delayed-accent',
  },
];

// =============================================================================
// Tempo-Related Terms (Conversational)
// =============================================================================

/**
 * How musicians talk about tempo in natural language.
 */
export const TEMPO_CONVERSATIONAL_TERMS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'uptempo'),
    lemma: 'uptempo',
    variants: ['fast-tempo', 'quick-tempo', 'brisk'],
    category: 'adj',
    semantics: {
      type: 'tempo-range',
      range: 'fast',
      minBPM: 130,
      implies: [
        { type: 'energetic-feel' },
        { type: 'higher-activity' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#uptempo',
  },
  {
    id: createLexemeId('adj', 'midtempo'),
    lemma: 'midtempo',
    variants: ['moderate-tempo', 'walking-pace'],
    category: 'adj',
    semantics: {
      type: 'tempo-range',
      range: 'medium',
      minBPM: 90,
      maxBPM: 130,
      implies: [
        { type: 'moderate-energy' },
        { type: 'comfortable-pace' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#midtempo',
  },
  {
    id: createLexemeId('adj', 'downtempo'),
    lemma: 'downtempo',
    variants: ['slow-tempo', 'ballad-tempo', 'relaxed-tempo'],
    category: 'adj',
    semantics: {
      type: 'tempo-range',
      range: 'slow',
      maxBPM: 90,
      implies: [
        { type: 'calm-energy' },
        { type: 'spacious-feel' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#downtempo',
  },
  {
    id: createLexemeId('adj', 'accelerating-tempo'),
    lemma: 'accelerando',
    variants: ['speeding-up', 'accelerating', 'getting-faster'],
    category: 'adj',
    semantics: {
      type: 'tempo-change',
      direction: 'faster',
      implies: [
        { type: 'gradual-tempo-increase' },
        { type: 'building-excitement' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#accelerando',
  },
  {
    id: createLexemeId('adj', 'decelerating-tempo'),
    lemma: 'ritardando',
    variants: ['slowing-down', 'decelerating', 'getting-slower'],
    category: 'adj',
    semantics: {
      type: 'tempo-change',
      direction: 'slower',
      implies: [
        { type: 'gradual-tempo-decrease' },
        { type: 'winding-down' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/rhythm.md#ritardando',
  },
];

// =============================================================================
// Export Collections
// =============================================================================

export const RHYTHM_GROOVE_VOCABULARY_BATCH35 = [
  ...GROOVE_FEEL_DESCRIPTORS,
  ...TIMING_MICROTIMING_TERMS,
  ...ARTICULATION_ATTACK_TERMS,
  ...RHYTHMIC_DENSITY_TERMS,
  ...SYNCOPATION_ACCENT_TERMS,
  ...TEMPO_CONVERSATIONAL_TERMS,
] as const;

export const BATCH35_LEXEME_COUNT = RHYTHM_GROOVE_VOCABULARY_BATCH35.length;

export const RHYTHM_GROOVE_LEXEME_MAP = new Map(
  RHYTHM_GROOVE_VOCABULARY_BATCH35.map((lex) => [lex.id, lex])
);

export function getRhythmGrooveLexeme(id: LexemeId): Lexeme | undefined {
  return RHYTHM_GROOVE_LEXEME_MAP.get(id);
}

export function findRhythmLexemeByLemma(lemma: string): readonly Lexeme[] {
  const lower = lemma.toLowerCase();
  return RHYTHM_GROOVE_VOCABULARY_BATCH35.filter(
    (lex) => lex.lemma.toLowerCase() === lower ||
      lex.variants.some((v) => v.toLowerCase() === lower)
  );
}
