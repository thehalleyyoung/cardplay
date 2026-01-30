/**
 * GOFAI Musical Vocabulary — Batch 34: Harmony & Melody Natural Language Terms
 *
 * This file provides comprehensive natural language vocabulary for describing
 * harmonic and melodic content. Musicians use hundreds of specialized terms
 * to describe chords, voicings, progressions, melodic shapes, and relationships.
 *
 * Philosophy: Don't just cover theory terminology — cover how musicians actually
 * talk in the studio. "Add some jazz tension" means different things from
 * "make it more dissonant" even though they're related.
 *
 * @module gofai/canon/harmony-melody-vocabulary-batch34
 */

import {
  type LexemeId,
  type Lexeme,
  createLexemeId,
  createAxisId,
  createOpcodeId,
} from './types.js';

// =============================================================================
// Chord Quality Descriptions (Natural Language)
// =============================================================================

/**
 * Chord quality adjectives — how musicians describe chord feel and function.
 */
export const CHORD_QUALITY_ADJECTIVES: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'jazzy-harmony'),
    lemma: 'jazzy',
    variants: ['jazz-like', 'jazz-influenced', 'jazzy-sounding'],
    category: 'adj',
    semantics: {
      type: 'axis-increase',
      axis: createAxisId('harmonic-complexity'),
      amount: 0.7,
      implies: [
        { type: 'use-extensions', extensions: ['7th', '9th', '11th', '13th'] },
        { type: 'prefer-altered', alterations: ['#11', 'b13'] },
      ],
    },
    docLink: 'docs/gofai/vocabulary/harmony.md#jazzy',
  },
  {
    id: createLexemeId('adj', 'lush-harmony'),
    lemma: 'lush',
    variants: ['rich-harmony', 'full-voiced', 'dense-harmony'],
    category: 'adj',
    semantics: {
      type: 'axis-increase',
      axis: createAxisId('harmonic-density'),
      amount: 0.8,
      implies: [
        { type: 'thick-voicing', voices: 5 },
        { type: 'add-extensions', extensions: ['9th', '11th', '13th'] },
        { type: 'low-register-bass' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/harmony.md#lush',
  },
  {
    id: createLexemeId('adj', 'sparse-harmony'),
    lemma: 'sparse',
    variants: ['thin-harmony', 'minimal-harmony', 'skeletal'],
    category: 'adj',
    semantics: {
      type: 'axis-decrease',
      axis: createAxisId('harmonic-density'),
      amount: 0.7,
      implies: [
        { type: 'thin-voicing', voices: 3 },
        { type: 'remove-doubles' },
        { type: 'open-voicing' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/harmony.md#sparse',
  },
  {
    id: createLexemeId('adj', 'modal-harmony'),
    lemma: 'modal',
    variants: ['modal-sounding', 'modal-quality'],
    category: 'adj',
    semantics: {
      type: 'harmonic-approach',
      approach: 'modal',
      implies: [
        { type: 'avoid-functional-progressions' },
        { type: 'emphasize-mode-characteristic-tones' },
        { type: 'static-harmony' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/harmony.md#modal',
  },
  {
    id: createLexemeId('adj', 'functional-harmony'),
    lemma: 'functional',
    variants: ['functional-progression', 'tonal-functional'],
    category: 'adj',
    semantics: {
      type: 'harmonic-approach',
      approach: 'functional',
      implies: [
        { type: 'use-dominant-function' },
        { type: 'clear-cadences' },
        { type: 'goal-directed' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/harmony.md#functional',
  },
  {
    id: createLexemeId('adj', 'colorful-harmony'),
    lemma: 'colorful',
    variants: ['colored', 'chromatic-color', 'harmonically-rich'],
    category: 'adj',
    semantics: {
      type: 'axis-increase',
      axis: createAxisId('harmonic-color'),
      amount: 0.8,
      implies: [
        { type: 'add-extensions', extensions: ['9th', '11th', '13th'] },
        { type: 'chromatic-alterations' },
        { type: 'substitute-chords', substitutions: ['tritone', 'chromatic-mediant'] },
      ],
    },
    docLink: 'docs/gofai/vocabulary/harmony.md#colorful',
  },
  {
    id: createLexemeId('adj', 'diatonic-harmony'),
    lemma: 'diatonic',
    variants: ['in-key', 'scale-based'],
    category: 'adj',
    semantics: {
      type: 'constraint',
      constraint: 'stay-diatonic',
      implies: [
        { type: 'avoid-chromatic-notes' },
        { type: 'use-scale-chords-only' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/harmony.md#diatonic',
  },
  {
    id: createLexemeId('adj', 'chromatic-harmony'),
    lemma: 'chromatic',
    variants: ['chromatically-rich', 'chromatic-inflected'],
    category: 'adj',
    semantics: {
      type: 'axis-increase',
      axis: createAxisId('chromaticism'),
      amount: 0.8,
      implies: [
        { type: 'add-chromatic-passing' },
        { type: 'chromatic-substitutions' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/harmony.md#chromatic',
  },
  {
    id: createLexemeId('adj', 'open-voicing'),
    lemma: 'open',
    variants: ['open-voiced', 'spread-voicing', 'wide-voicing'],
    category: 'adj',
    semantics: {
      type: 'voicing-style',
      style: 'open',
      implies: [
        { type: 'voice-leading', style: 'open', spread: 'wide' },
        { type: 'increase-register-span' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/harmony.md#open-voicing',
  },
  {
    id: createLexemeId('adj', 'close-voicing'),
    lemma: 'close',
    variants: ['close-voiced', 'tight-voicing', 'compact-voicing'],
    category: 'adj',
    semantics: {
      type: 'voicing-style',
      style: 'close',
      implies: [
        { type: 'voice-leading', style: 'close', spread: 'narrow' },
        { type: 'decrease-register-span' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/harmony.md#close-voicing',
  },
  {
    id: createLexemeId('adj', 'rootless-voicing'),
    lemma: 'rootless',
    variants: ['without-root', 'shell-voicing'],
    category: 'adj',
    semantics: {
      type: 'voicing-style',
      style: 'rootless',
      implies: [
        { type: 'omit-root' },
        { type: 'emphasize-thirds-sevenths' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/harmony.md#rootless-voicing',
  },
];

// =============================================================================
// Harmonic Motion Descriptions
// =============================================================================

/**
 * Terms for describing harmonic movement and progression.
 */
export const HARMONIC_MOTION_TERMS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'cadence'),
    lemma: 'cadence',
    variants: ['cadential-motion', 'resolution-point'],
    category: 'noun',
    semantics: {
      type: 'structural-element',
      element: 'cadence',
      canBeModified: true,
      modifiers: ['authentic', 'plagal', 'deceptive', 'half'],
    },
    docLink: 'docs/gofai/vocabulary/harmony.md#cadence',
  },
  {
    id: createLexemeId('noun', 'turnaround'),
    lemma: 'turnaround',
    variants: ['turn', 'cyclic-progression'],
    category: 'noun',
    semantics: {
      type: 'progression-pattern',
      pattern: 'turnaround',
      implies: [
        { type: 'return-to-tonic' },
        { type: 'typical-length', bars: 2 },
      ],
    },
    docLink: 'docs/gofai/vocabulary/harmony.md#turnaround',
  },
  {
    id: createLexemeId('noun', 'pedal-point'),
    lemma: 'pedal',
    variants: ['pedal-tone', 'sustained-bass', 'drone-note'],
    category: 'noun',
    semantics: {
      type: 'harmonic-device',
      device: 'pedal-point',
      implies: [
        { type: 'static-bass' },
        { type: 'changing-upper-voices' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/harmony.md#pedal-point',
  },
  {
    id: createLexemeId('noun', 'secondary-dominant'),
    lemma: 'secondary-dominant',
    variants: ['applied-dominant', 'tonicization'],
    category: 'noun',
    semantics: {
      type: 'harmonic-device',
      device: 'secondary-dominant',
      implies: [
        { type: 'temporary-tonicization' },
        { type: 'dominant-function-to-non-tonic' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/harmony.md#secondary-dominant',
  },
  {
    id: createLexemeId('noun', 'tritone-substitution'),
    lemma: 'tritone-sub',
    variants: ['tritone-substitution', 'flat-five-sub'],
    category: 'noun',
    semantics: {
      type: 'chord-substitution',
      substitution: 'tritone',
      implies: [
        { type: 'replace-dominant', replacement: 'flat-five-dominant' },
        { type: 'jazz-reharmonization' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/harmony.md#tritone-substitution',
  },
  {
    id: createLexemeId('noun', 'reharmonization'),
    lemma: 'reharmonization',
    variants: ['reharm', 'chord-substitution', 'harmonic-variation'],
    category: 'noun',
    semantics: {
      type: 'transformation',
      transformation: 'reharmonize',
      scope: 'harmonic-layer',
      preserves: ['melody'],
    },
    docLink: 'docs/gofai/vocabulary/harmony.md#reharmonization',
  },
];

// =============================================================================
// Melodic Shape Descriptions
// =============================================================================

/**
 * Terms for describing melodic contour and motion.
 */
export const MELODIC_SHAPE_TERMS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'stepwise-motion'),
    lemma: 'stepwise',
    variants: ['conjunct', 'scalar-motion', 'step-motion'],
    category: 'adj',
    semantics: {
      type: 'melodic-motion',
      motion: 'stepwise',
      implies: [
        { type: 'prefer-seconds' },
        { type: 'avoid-large-leaps' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/melody.md#stepwise',
  },
  {
    id: createLexemeId('adj', 'leaping-motion'),
    lemma: 'leaping',
    variants: ['disjunct', 'angular', 'interval-driven'],
    category: 'adj',
    semantics: {
      type: 'melodic-motion',
      motion: 'leaping',
      implies: [
        { type: 'prefer-thirds-fourths-fifths' },
        { type: 'increase-interval-size' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/melody.md#leaping',
  },
  {
    id: createLexemeId('adj', 'arching-contour'),
    lemma: 'arching',
    variants: ['arch-shaped', 'rise-and-fall'],
    category: 'adj',
    semantics: {
      type: 'melodic-contour',
      contour: 'arch',
      implies: [
        { type: 'peak-in-middle' },
        { type: 'symmetric-shape' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/melody.md#arching',
  },
  {
    id: createLexemeId('adj', 'ascending-contour'),
    lemma: 'ascending',
    variants: ['rising', 'climbing', 'upward'],
    category: 'adj',
    semantics: {
      type: 'melodic-contour',
      contour: 'ascending',
      implies: [
        { type: 'overall-upward-motion' },
        { type: 'increasing-pitch' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/melody.md#ascending',
  },
  {
    id: createLexemeId('adj', 'descending-contour'),
    lemma: 'descending',
    variants: ['falling', 'declining', 'downward'],
    category: 'adj',
    semantics: {
      type: 'melodic-contour',
      contour: 'descending',
      implies: [
        { type: 'overall-downward-motion' },
        { type: 'decreasing-pitch' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/melody.md#descending',
  },
  {
    id: createLexemeId('adj', 'meandering'),
    lemma: 'meandering',
    variants: ['wandering', 'exploratory', 'undulating'],
    category: 'adj',
    semantics: {
      type: 'melodic-contour',
      contour: 'meandering',
      implies: [
        { type: 'frequent-direction-changes' },
        { type: 'no-clear-goal' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/melody.md#meandering',
  },
  {
    id: createLexemeId('adj', 'goal-directed'),
    lemma: 'goal-directed',
    variants: ['purposeful', 'directed', 'linear-motion'],
    category: 'adj',
    semantics: {
      type: 'melodic-character',
      character: 'goal-directed',
      implies: [
        { type: 'clear-destination' },
        { type: 'forward-momentum' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/melody.md#goal-directed',
  },
];

// =============================================================================
// Melodic Ornamentation Terms
// =============================================================================

/**
 * Terms for melodic embellishment and decoration.
 */
export const MELODIC_ORNAMENTATION_TERMS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'passing-tone'),
    lemma: 'passing-tone',
    variants: ['passing-note', 'connector-note'],
    category: 'noun',
    semantics: {
      type: 'melodic-device',
      device: 'passing-tone',
      implies: [
        { type: 'stepwise-connection' },
        { type: 'non-chord-tone' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/melody.md#passing-tone',
  },
  {
    id: createLexemeId('noun', 'neighbor-tone'),
    lemma: 'neighbor-tone',
    variants: ['auxiliary-note', 'upper-neighbor', 'lower-neighbor'],
    category: 'noun',
    semantics: {
      type: 'melodic-device',
      device: 'neighbor-tone',
      implies: [
        { type: 'step-and-return' },
        { type: 'embellishment' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/melody.md#neighbor-tone',
  },
  {
    id: createLexemeId('noun', 'appoggiatura'),
    lemma: 'appoggiatura',
    variants: ['leaning-tone', 'accented-non-chord-tone'],
    category: 'noun',
    semantics: {
      type: 'melodic-device',
      device: 'appoggiatura',
      implies: [
        { type: 'accented-dissonance' },
        { type: 'stepwise-resolution' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/melody.md#appoggiatura',
  },
  {
    id: createLexemeId('noun', 'anticipation'),
    lemma: 'anticipation',
    variants: ['anticipated-note', 'early-arrival'],
    category: 'noun',
    semantics: {
      type: 'melodic-device',
      device: 'anticipation',
      implies: [
        { type: 'early-chord-tone' },
        { type: 'rhythmic-displacement-forward' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/melody.md#anticipation',
  },
  {
    id: createLexemeId('noun', 'trill'),
    lemma: 'trill',
    variants: ['rapid-alternation', 'shake'],
    category: 'noun',
    semantics: {
      type: 'ornament',
      ornament: 'trill',
      implies: [
        { type: 'rapid-neighbor-alternation' },
        { type: 'sustained-embellishment' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/melody.md#trill',
  },
  {
    id: createLexemeId('noun', 'mordent'),
    lemma: 'mordent',
    variants: ['quick-turn', 'brief-embellishment'],
    category: 'noun',
    semantics: {
      type: 'ornament',
      ornament: 'mordent',
      implies: [
        { type: 'quick-neighbor-and-return' },
        { type: 'brief-ornament' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/melody.md#mordent',
  },
  {
    id: createLexemeId('noun', 'turn'),
    lemma: 'turn',
    variants: ['gruppetto', 'four-note-figure'],
    category: 'noun',
    semantics: {
      type: 'ornament',
      ornament: 'turn',
      implies: [
        { type: 'upper-lower-neighbor-sequence' },
        { type: 'decorative-figure' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/melody.md#turn',
  },
  {
    id: createLexemeId('noun', 'grace-note'),
    lemma: 'grace-note',
    variants: ['acciaccatura', 'quick-ornament'],
    category: 'noun',
    semantics: {
      type: 'ornament',
      ornament: 'grace-note',
      implies: [
        { type: 'unmetered-short-note' },
        { type: 'accent-decoration' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/melody.md#grace-note',
  },
];

// =============================================================================
// Harmonic Rhythm Terms
// =============================================================================

/**
 * Terms for describing the rate of harmonic change.
 */
export const HARMONIC_RHYTHM_TERMS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'fast-harmonic-rhythm'),
    lemma: 'fast-changing',
    variants: ['rapid-changes', 'busy-harmony', 'quick-chords'],
    category: 'adj',
    semantics: {
      type: 'axis-increase',
      axis: createAxisId('harmonic-rhythm-rate'),
      amount: 0.8,
      implies: [
        { type: 'increase-chord-changes' },
        { type: 'shorter-chord-duration' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/harmony.md#fast-harmonic-rhythm',
  },
  {
    id: createLexemeId('adj', 'slow-harmonic-rhythm'),
    lemma: 'slow-changing',
    variants: ['static-harmony', 'sustained-chords', 'long-chords'],
    category: 'adj',
    semantics: {
      type: 'axis-decrease',
      axis: createAxisId('harmonic-rhythm-rate'),
      amount: 0.8,
      implies: [
        { type: 'decrease-chord-changes' },
        { type: 'longer-chord-duration' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/harmony.md#slow-harmonic-rhythm',
  },
  {
    id: createLexemeId('adj', 'accelerating-harmony'),
    lemma: 'accelerating',
    variants: ['increasing-pace', 'speeding-up-changes'],
    category: 'adj',
    semantics: {
      type: 'harmonic-rhythm-change',
      direction: 'accelerate',
      implies: [
        { type: 'progressive-increase-in-change-rate' },
        { type: 'building-tension' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/harmony.md#accelerating-harmony',
  },
  {
    id: createLexemeId('adj', 'decelerating-harmony'),
    lemma: 'decelerating',
    variants: ['slowing-down', 'decreasing-pace'],
    category: 'adj',
    semantics: {
      type: 'harmonic-rhythm-change',
      direction: 'decelerate',
      implies: [
        { type: 'progressive-decrease-in-change-rate' },
        { type: 'releasing-tension' },
      ],
    },
    docLink: 'docs/gofai/vocabulary/harmony.md#decelerating-harmony',
  },
];

// =============================================================================
// Interval Descriptions (Conversational)
// =============================================================================

/**
 * How musicians talk about intervals in natural language.
 */
export const INTERVAL_DESCRIPTIONS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'wide-interval'),
    lemma: 'wide-interval',
    variants: ['large-leap', 'big-jump', 'expansive-interval'],
    category: 'noun',
    semantics: {
      type: 'interval-size',
      size: 'large',
      minInterval: 6,
    },
    docLink: 'docs/gofai/vocabulary/melody.md#wide-interval',
  },
  {
    id: createLexemeId('noun', 'narrow-interval'),
    lemma: 'narrow-interval',
    variants: ['small-step', 'close-interval', 'tight-interval'],
    category: 'noun',
    semantics: {
      type: 'interval-size',
      size: 'small',
      maxInterval: 3,
    },
    docLink: 'docs/gofai/vocabulary/melody.md#narrow-interval',
  },
  {
    id: createLexemeId('adj', 'consonant-interval'),
    lemma: 'consonant',
    variants: ['stable-interval', 'resolved-interval'],
    category: 'adj',
    semantics: {
      type: 'interval-quality',
      quality: 'consonant',
      examples: ['unison', 'third', 'fifth', 'sixth', 'octave'],
    },
    docLink: 'docs/gofai/vocabulary/melody.md#consonant-interval',
  },
  {
    id: createLexemeId('adj', 'dissonant-interval'),
    lemma: 'dissonant',
    variants: ['tense-interval', 'unstable-interval'],
    category: 'adj',
    semantics: {
      type: 'interval-quality',
      quality: 'dissonant',
      examples: ['second', 'tritone', 'seventh'],
    },
    docLink: 'docs/gofai/vocabulary/melody.md#dissonant-interval',
  },
];

// =============================================================================
// Export Collections
// =============================================================================

export const HARMONY_MELODY_VOCABULARY_BATCH34 = [
  ...CHORD_QUALITY_ADJECTIVES,
  ...HARMONIC_MOTION_TERMS,
  ...MELODIC_SHAPE_TERMS,
  ...MELODIC_ORNAMENTATION_TERMS,
  ...HARMONIC_RHYTHM_TERMS,
  ...INTERVAL_DESCRIPTIONS,
] as const;

/**
 * Total lexemes in this batch.
 */
export const BATCH34_LEXEME_COUNT = HARMONY_MELODY_VOCABULARY_BATCH34.length;

/**
 * Map for quick lookup by ID.
 */
export const HARMONY_MELODY_LEXEME_MAP = new Map(
  HARMONY_MELODY_VOCABULARY_BATCH34.map((lex) => [lex.id, lex])
);

/**
 * Get lexeme by ID.
 */
export function getHarmonyMelodyLexeme(id: LexemeId): Lexeme | undefined {
  return HARMONY_MELODY_LEXEME_MAP.get(id);
}

/**
 * Find lexemes by lemma (case-insensitive).
 */
export function findByLemma(lemma: string): readonly Lexeme[] {
  const lower = lemma.toLowerCase();
  return HARMONY_MELODY_VOCABULARY_BATCH34.filter(
    (lex) => lex.lemma.toLowerCase() === lower ||
      lex.variants.some((v) => v.toLowerCase() === lower)
  );
}
