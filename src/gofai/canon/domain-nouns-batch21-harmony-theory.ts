/**
 * GOFAI Canon — Domain Nouns Batch 21: Harmony Theory and Chord Types
 *
 * Comprehensive vocabulary for harmony theory, chord types, voicings,
 * progressions, functional harmony, and harmonic motion. This batch
 * systematically enumerates the natural language terms musicians use
 * to describe harmonic structures and relationships.
 *
 * This continues the extensive enumeration requirement from gofai_goalB.md
 * to build comprehensive natural language coverage for musical concepts.
 *
 * @module gofai/canon/domain-nouns-batch21-harmony-theory
 */

import type { LexemeId } from './types';
import { createLexemeId } from './types';

/**
 * Harmony-related lexeme.
 */
export interface HarmonyLexeme {
  readonly id: LexemeId;
  readonly lemma: string;
  readonly variants: readonly string[];
  readonly category: 'noun' | 'adjective';
  readonly semantics: {
    readonly type: 'chord_type' | 'voicing' | 'progression' | 'function' | 'motion';
    readonly chordQuality?: string;
    readonly functionalRole?: string;
    readonly harmonicMotion?: string;
    readonly affects: readonly string[];
  };
  readonly description: string;
  readonly examples: readonly string[];
  readonly musicalContext?: readonly string[];
}

// =============================================================================
// Basic Chord Types (Triads)
// =============================================================================

export const BASIC_CHORD_LEXEMES: readonly HarmonyLexeme[] = [
  {
    id: createLexemeId('chord', 'major'),
    lemma: 'major',
    variants: ['major chord', 'major triad', 'maj'],
    category: 'noun',
    semantics: {
      type: 'chord_type',
      chordQuality: 'major',
      affects: ['harmony', 'brightness', 'stability'],
    },
    description: 'Major triad (1-3-5)',
    examples: [
      'make it a major chord',
      'use major harmonies',
      'brighten with major triads',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('chord', 'minor'),
    lemma: 'minor',
    variants: ['minor chord', 'minor triad', 'min', 'm'],
    category: 'noun',
    semantics: {
      type: 'chord_type',
      chordQuality: 'minor',
      affects: ['harmony', 'darkness', 'melancholy'],
    },
    description: 'Minor triad (1-♭3-5)',
    examples: [
      'make it a minor chord',
      'use minor harmonies',
      'darker with minor triads',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('chord', 'diminished'),
    lemma: 'diminished',
    variants: ['diminished chord', 'diminished triad', 'dim', 'º'],
    category: 'noun',
    semantics: {
      type: 'chord_type',
      chordQuality: 'diminished',
      affects: ['harmony', 'tension', 'instability'],
    },
    description: 'Diminished triad (1-♭3-♭5)',
    examples: [
      'use a diminished chord',
      'add tension with diminished',
      'dim chord for transition',
    ],
    musicalContext: ['classical', 'jazz', 'theory'],
  },
  {
    id: createLexemeId('chord', 'augmented'),
    lemma: 'augmented',
    variants: ['augmented chord', 'augmented triad', 'aug', '+'],
    category: 'noun',
    semantics: {
      type: 'chord_type',
      chordQuality: 'augmented',
      affects: ['harmony', 'tension', 'expansion'],
    },
    description: 'Augmented triad (1-3-#5)',
    examples: [
      'use an augmented chord',
      'add tension with augmented',
      'aug chord for color',
    ],
    musicalContext: ['jazz', 'impressionist', 'contemporary'],
  },

  // =============================================================================
  // Seventh Chords
  // =============================================================================

  {
    id: createLexemeId('chord', 'dominant-seventh'),
    lemma: 'dominant seventh',
    variants: ['dominant 7th', 'dom7', 'V7', '7'],
    category: 'noun',
    semantics: {
      type: 'chord_type',
      chordQuality: 'dominant',
      functionalRole: 'dominant',
      affects: ['harmony', 'tension', 'resolution'],
    },
    description: 'Dominant seventh chord (1-3-5-♭7)',
    examples: [
      'use a dominant seventh',
      'V7 chord for resolution',
      'add seventh for tension',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('chord', 'major-seventh'),
    lemma: 'major seventh',
    variants: ['major 7th', 'maj7', 'M7', 'Δ'],
    category: 'noun',
    semantics: {
      type: 'chord_type',
      chordQuality: 'major',
      affects: ['harmony', 'lushness', 'sophistication'],
    },
    description: 'Major seventh chord (1-3-5-7)',
    examples: [
      'use major seventh chords',
      'maj7 for jazzy feel',
      'lush major sevenths',
    ],
    musicalContext: ['jazz', 'R&B', 'contemporary'],
  },
  {
    id: createLexemeId('chord', 'minor-seventh'),
    lemma: 'minor seventh',
    variants: ['minor 7th', 'min7', 'm7', '-7'],
    category: 'noun',
    semantics: {
      type: 'chord_type',
      chordQuality: 'minor',
      affects: ['harmony', 'smoothness', 'moodiness'],
    },
    description: 'Minor seventh chord (1-♭3-5-♭7)',
    examples: [
      'use minor seventh chords',
      'min7 for smooth harmony',
      'moody minor sevenths',
    ],
    musicalContext: ['jazz', 'soul', 'R&B'],
  },
  {
    id: createLexemeId('chord', 'half-diminished'),
    lemma: 'half diminished',
    variants: ['half-diminished seventh', 'min7♭5', 'ø7', 'm7♭5'],
    category: 'noun',
    semantics: {
      type: 'chord_type',
      chordQuality: 'half_diminished',
      functionalRole: 'pre-dominant',
      affects: ['harmony', 'tension', 'ambiguity'],
    },
    description: 'Half-diminished seventh (1-♭3-♭5-♭7)',
    examples: [
      'use half-diminished chord',
      'min7♭5 for tension',
      'half-dim for transition',
    ],
    musicalContext: ['jazz', 'classical'],
  },
  {
    id: createLexemeId('chord', 'fully-diminished'),
    lemma: 'fully diminished',
    variants: ['diminished seventh', 'dim7', 'º7'],
    category: 'noun',
    semantics: {
      type: 'chord_type',
      chordQuality: 'fully_diminished',
      affects: ['harmony', 'tension', 'symmetry'],
    },
    description: 'Fully diminished seventh (1-♭3-♭5-♭♭7)',
    examples: [
      'use fully diminished',
      'dim7 for high tension',
      'symmetrical dim7',
    ],
    musicalContext: ['classical', 'jazz'],
  },

  // =============================================================================
  // Extended Chords
  // =============================================================================

  {
    id: createLexemeId('chord', 'ninth'),
    lemma: 'ninth',
    variants: ['ninth chord', '9', 'add9'],
    category: 'noun',
    semantics: {
      type: 'chord_type',
      chordQuality: 'extended',
      affects: ['harmony', 'color', 'richness'],
    },
    description: 'Chord with added ninth',
    examples: [
      'add ninth chords',
      'use 9 for color',
      'extended ninths',
    ],
    musicalContext: ['jazz', 'contemporary'],
  },
  {
    id: createLexemeId('chord', 'eleventh'),
    lemma: 'eleventh',
    variants: ['eleventh chord', '11', 'add11'],
    category: 'noun',
    semantics: {
      type: 'chord_type',
      chordQuality: 'extended',
      affects: ['harmony', 'suspension', 'openness'],
    },
    description: 'Chord with added eleventh',
    examples: [
      'add eleventh chords',
      'use 11 for suspension',
      'open elevenths',
    ],
    musicalContext: ['jazz', 'modal'],
  },
  {
    id: createLexemeId('chord', 'thirteenth'),
    lemma: 'thirteenth',
    variants: ['thirteenth chord', '13', 'add13'],
    category: 'noun',
    semantics: {
      type: 'chord_type',
      chordQuality: 'extended',
      affects: ['harmony', 'sophistication', 'fullness'],
    },
    description: 'Chord with added thirteenth',
    examples: [
      'add thirteenth chords',
      'use 13 for richness',
      'full thirteenths',
    ],
    musicalContext: ['jazz', 'fusion'],
  },

  // =============================================================================
  // Altered Chords
  // =============================================================================

  {
    id: createLexemeId('chord', 'flat-nine'),
    lemma: 'flat nine',
    variants: ['♭9', 'b9', 'flat ninth'],
    category: 'noun',
    semantics: {
      type: 'chord_type',
      chordQuality: 'altered',
      affects: ['harmony', 'tension', 'color'],
    },
    description: 'Chord with lowered ninth',
    examples: [
      'add flat nine',
      'use ♭9 for tension',
      'altered dominant with b9',
    ],
    musicalContext: ['jazz', 'bebop'],
  },
  {
    id: createLexemeId('chord', 'sharp-nine'),
    lemma: 'sharp nine',
    variants: ['#9', 'sharp ninth', 'Hendrix chord'],
    category: 'noun',
    semantics: {
      type: 'chord_type',
      chordQuality: 'altered',
      affects: ['harmony', 'bluesy', 'edge'],
    },
    description: 'Chord with raised ninth',
    examples: [
      'add sharp nine',
      'use #9 for blues feel',
      'Hendrix chord',
    ],
    musicalContext: ['blues', 'rock', 'jazz'],
  },
  {
    id: createLexemeId('chord', 'flat-five'),
    lemma: 'flat five',
    variants: ['♭5', 'b5', 'flat fifth'],
    category: 'noun',
    semantics: {
      type: 'chord_type',
      chordQuality: 'altered',
      affects: ['harmony', 'tension', 'tritone'],
    },
    description: 'Chord with lowered fifth',
    examples: [
      'add flat five',
      'use ♭5 for tension',
      'tritone substitution',
    ],
    musicalContext: ['jazz', 'contemporary'],
  },
  {
    id: createLexemeId('chord', 'sharp-five'),
    lemma: 'sharp five',
    variants: ['#5', 'aug5', 'sharp fifth'],
    category: 'noun',
    semantics: {
      type: 'chord_type',
      chordQuality: 'altered',
      affects: ['harmony', 'expansion', 'color'],
    },
    description: 'Chord with raised fifth',
    examples: [
      'add sharp five',
      'use #5 for color',
      'augmented fifth',
    ],
    musicalContext: ['jazz', 'impressionist'],
  },

  // =============================================================================
  // Voicings
  // =============================================================================

  {
    id: createLexemeId('voicing', 'close-voicing'),
    lemma: 'close voicing',
    variants: ['close position', 'tight voicing', 'closed'],
    category: 'noun',
    semantics: {
      type: 'voicing',
      affects: ['spacing', 'density', 'blend'],
    },
    description: 'Chord tones within an octave',
    examples: [
      'use close voicing',
      'tight chord spacing',
      'closed position',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('voicing', 'open-voicing'),
    lemma: 'open voicing',
    variants: ['open position', 'spread voicing', 'opened'],
    category: 'noun',
    semantics: {
      type: 'voicing',
      affects: ['spacing', 'airiness', 'clarity'],
    },
    description: 'Chord tones spread over more than an octave',
    examples: [
      'use open voicing',
      'spread out the chord',
      'open position',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('voicing', 'drop-two'),
    lemma: 'drop 2',
    variants: ['drop two voicing', 'drop-2'],
    category: 'noun',
    semantics: {
      type: 'voicing',
      affects: ['spacing', 'balance', 'clarity'],
    },
    description: 'Second note from top dropped an octave',
    examples: [
      'use drop 2 voicing',
      'drop-2 for guitar',
      'drop the second voice',
    ],
    musicalContext: ['jazz', 'contemporary'],
  },
  {
    id: createLexemeId('voicing', 'drop-three'),
    lemma: 'drop 3',
    variants: ['drop three voicing', 'drop-3'],
    category: 'noun',
    semantics: {
      type: 'voicing',
      affects: ['spacing', 'width', 'bass'],
    },
    description: 'Third note from top dropped an octave',
    examples: [
      'use drop 3 voicing',
      'drop-3 for wider spacing',
      'drop the third voice',
    ],
    musicalContext: ['jazz', 'big band'],
  },
  {
    id: createLexemeId('voicing', 'rootless'),
    lemma: 'rootless',
    variants: ['rootless voicing', 'no root', 'shell voicing'],
    category: 'noun',
    semantics: {
      type: 'voicing',
      affects: ['texture', 'lightness', 'space'],
    },
    description: 'Voicing without the root note',
    examples: [
      'use rootless voicing',
      'omit the root',
      'shell voicing',
    ],
    musicalContext: ['jazz', 'comping'],
  },

  // =============================================================================
  // Harmonic Functions
  // =============================================================================

  {
    id: createLexemeId('func', 'tonic'),
    lemma: 'tonic',
    variants: ['I', 'home', 'resolution', 'stable'],
    category: 'noun',
    semantics: {
      type: 'function',
      functionalRole: 'tonic',
      affects: ['stability', 'resolution', 'home'],
    },
    description: 'Home chord, stable resolution point',
    examples: [
      'resolve to tonic',
      'home chord',
      'stable I chord',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('func', 'subdominant'),
    lemma: 'subdominant',
    variants: ['IV', 'pre-dominant', 'plagal'],
    category: 'noun',
    semantics: {
      type: 'function',
      functionalRole: 'subdominant',
      affects: ['departure', 'preparation', 'motion'],
    },
    description: 'Fourth degree, moves away from tonic',
    examples: [
      'use subdominant',
      'IV chord',
      'pre-dominant function',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('func', 'dominant'),
    lemma: 'dominant',
    variants: ['V', 'V7', 'tension', 'leading'],
    category: 'noun',
    semantics: {
      type: 'function',
      functionalRole: 'dominant',
      affects: ['tension', 'pull', 'resolution'],
    },
    description: 'Fifth degree, creates tension for resolution',
    examples: [
      'use dominant',
      'V chord tension',
      'dominant resolution',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('func', 'mediant'),
    lemma: 'mediant',
    variants: ['III', 'iii', 'middle function'],
    category: 'noun',
    semantics: {
      type: 'function',
      functionalRole: 'mediant',
      affects: ['color', 'modulation', 'ambiguity'],
    },
    description: 'Third degree, between tonic and dominant',
    examples: [
      'use mediant',
      'III chord',
      'mediant color',
    ],
    musicalContext: ['classical', 'theory'],
  },
  {
    id: createLexemeId('func', 'submediant'),
    lemma: 'submediant',
    variants: ['VI', 'vi', 'relative minor'],
    category: 'noun',
    semantics: {
      type: 'function',
      functionalRole: 'submediant',
      affects: ['departure', 'minor', 'melancholy'],
    },
    description: 'Sixth degree, often to relative minor',
    examples: [
      'use submediant',
      'vi chord',
      'relative minor',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('func', 'leading-tone'),
    lemma: 'leading tone',
    variants: ['VII', 'viiº', 'diminished seventh degree'],
    category: 'noun',
    semantics: {
      type: 'function',
      functionalRole: 'leading_tone',
      affects: ['tension', 'pull', 'leading'],
    },
    description: 'Seventh degree, leads strongly to tonic',
    examples: [
      'use leading tone',
      'viiº chord',
      'strong pull to tonic',
    ],
    musicalContext: ['classical', 'theory'],
  },

  // =============================================================================
  // Chord Progressions and Patterns
  // =============================================================================

  {
    id: createLexemeId('prog', 'authentic-cadence'),
    lemma: 'authentic cadence',
    variants: ['V-I', 'perfect cadence', 'full cadence'],
    category: 'noun',
    semantics: {
      type: 'progression',
      harmonicMotion: 'cadential',
      affects: ['resolution', 'closure', 'finality'],
    },
    description: 'V to I progression, strongest resolution',
    examples: [
      'authentic cadence',
      'V-I resolution',
      'perfect cadence',
    ],
    musicalContext: ['classical', 'all genres'],
  },
  {
    id: createLexemeId('prog', 'plagal-cadence'),
    lemma: 'plagal cadence',
    variants: ['IV-I', 'amen cadence'],
    category: 'noun',
    semantics: {
      type: 'progression',
      harmonicMotion: 'cadential',
      affects: ['resolution', 'softer', 'hymn-like'],
    },
    description: 'IV to I progression',
    examples: [
      'plagal cadence',
      'IV-I amen',
      'softer resolution',
    ],
    musicalContext: ['classical', 'hymns'],
  },
  {
    id: createLexemeId('prog', 'deceptive-cadence'),
    lemma: 'deceptive cadence',
    variants: ['V-vi', 'interrupted cadence', 'false cadence'],
    category: 'noun',
    semantics: {
      type: 'progression',
      harmonicMotion: 'deceptive',
      affects: ['surprise', 'continuation', 'avoidance'],
    },
    description: 'V to vi instead of I, avoids resolution',
    examples: [
      'deceptive cadence',
      'V-vi surprise',
      'avoid resolution',
    ],
    musicalContext: ['classical', 'all genres'],
  },
  {
    id: createLexemeId('prog', 'half-cadence'),
    lemma: 'half cadence',
    variants: ['imperfect cadence', 'semi-cadence'],
    category: 'noun',
    semantics: {
      type: 'progression',
      harmonicMotion: 'cadential',
      affects: ['pause', 'question', 'incomplete'],
    },
    description: 'Ending on V, incomplete resolution',
    examples: [
      'half cadence',
      'pause on V',
      'incomplete resolution',
    ],
    musicalContext: ['classical'],
  },
  {
    id: createLexemeId('prog', 'circle-of-fifths'),
    lemma: 'circle of fifths',
    variants: ['cycle of fifths', 'fifth progression'],
    category: 'noun',
    semantics: {
      type: 'progression',
      harmonicMotion: 'circular',
      affects: ['motion', 'cycle', 'momentum'],
    },
    description: 'Progression by descending fifths',
    examples: [
      'circle of fifths',
      'cycle by fifths',
      'descending fifth motion',
    ],
    musicalContext: ['jazz', 'classical'],
  },
  {
    id: createLexemeId('prog', 'two-five-one'),
    lemma: 'two five one',
    variants: ['ii-V-I', '2-5-1', 'jazz cadence'],
    category: 'noun',
    semantics: {
      type: 'progression',
      harmonicMotion: 'cadential',
      affects: ['jazz', 'resolution', 'standard'],
    },
    description: 'Standard jazz progression ii-V-I',
    examples: [
      'use two-five-one',
      'ii-V-I progression',
      'jazz cadence',
    ],
    musicalContext: ['jazz', 'bebop'],
  },
  {
    id: createLexemeId('prog', 'tritone-sub'),
    lemma: 'tritone substitution',
    variants: ['tritone sub', 'flatted-fifth sub', 'bII7'],
    category: 'noun',
    semantics: {
      type: 'progression',
      harmonicMotion: 'substitution',
      affects: ['color', 'tension', 'chromaticism'],
    },
    description: 'Substituting bII7 for V7',
    examples: [
      'use tritone sub',
      'flatted-fifth substitution',
      'bII7 for V7',
    ],
    musicalContext: ['jazz', 'contemporary'],
  },

  // =============================================================================
  // Harmonic Motion Types
  // =============================================================================

  {
    id: createLexemeId('motion', 'parallel-motion'),
    lemma: 'parallel motion',
    variants: ['parallel', 'parallel voices'],
    category: 'noun',
    semantics: {
      type: 'motion',
      harmonicMotion: 'parallel',
      affects: ['direction', 'blend', 'strength'],
    },
    description: 'Voices moving in same direction by same interval',
    examples: [
      'parallel motion',
      'voices move together',
      'parallel fifths',
    ],
    musicalContext: ['all genres'],
  },
  {
    id: createLexemeId('motion', 'contrary-motion'),
    lemma: 'contrary motion',
    variants: ['contrary', 'opposite motion'],
    category: 'noun',
    semantics: {
      type: 'motion',
      harmonicMotion: 'contrary',
      affects: ['independence', 'strength', 'opposition'],
    },
    description: 'Voices moving in opposite directions',
    examples: [
      'contrary motion',
      'voices oppose',
      'independent lines',
    ],
    musicalContext: ['classical', 'counterpoint'],
  },
  {
    id: createLexemeId('motion', 'oblique-motion'),
    lemma: 'oblique motion',
    variants: ['oblique', 'one voice static'],
    category: 'noun',
    semantics: {
      type: 'motion',
      harmonicMotion: 'oblique',
      affects: ['stability', 'pedal', 'sustain'],
    },
    description: 'One voice moves, one stays static',
    examples: [
      'oblique motion',
      'one voice sustains',
      'pedal tone',
    ],
    musicalContext: ['classical', 'theory'],
  },
];

// =============================================================================
// Exports
// =============================================================================

/**
 * All harmony theory lexemes in this batch.
 */
export const HARMONY_THEORY_LEXEMES: readonly HarmonyLexeme[] = [
  ...BASIC_CHORD_LEXEMES,
];

/**
 * Count of lexemes in this batch.
 */
export const HARMONY_THEORY_LEXEME_COUNT = HARMONY_THEORY_LEXEMES.length;
