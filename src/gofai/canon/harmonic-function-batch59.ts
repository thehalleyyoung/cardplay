/**
 * GOFAI Canon — Harmonic Function and Chord Quality Vocabulary (Batch 59)
 *
 * Comprehensive vocabulary for harmonic function, chord quality, and tonal
 * relationships:
 * - Functional harmony (tonic, dominant, subdominant)
 * - Chord quality descriptors (major, minor, diminished, augmented)
 * - Harmonic tension and resolution
 * - Modal characteristics
 * - Chord extensions and alterations
 * - Harmonic progression patterns
 *
 * This batch provides natural language coverage for harmonic analysis and
 * description in composition and arranging.
 *
 * @module gofai/canon/harmonic-function-batch59
 */

import {
  type Lexeme,
  type LexemeId,
  type AxisId,
  createLexemeId,
  createAxisId,
} from './types';

// =============================================================================
// Functional Harmony
// =============================================================================

/**
 * Functional harmony descriptors.
 *
 * Covers:
 * - Tonic function (stability)
 * - Dominant function (tension)
 * - Subdominant function (preparation)
 * - Pre-dominant and other functions
 */
const FUNCTIONAL_HARMONY_DESCRIPTORS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'tonic'),
    lemma: 'tonic',
    variants: ['I chord', 'home', 'stable', 'resolved'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'function',
      function: 'tonic',
    },
    description: 'Harmonic function providing stability and resolution',
    examples: [
      'resolve to tonic',
      'end on the I chord',
      'return to home',
    ],
  },
  {
    id: createLexemeId('adj', 'dominant'),
    lemma: 'dominant',
    variants: ['V chord', 'fifth', 'tension', 'leading'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'function',
      function: 'dominant',
    },
    description: 'Harmonic function creating tension and expectation',
    examples: [
      'add dominant chord',
      'create V-I progression',
      'build tension',
    ],
  },
  {
    id: createLexemeId('adj', 'subdominant'),
    lemma: 'subdominant',
    variants: ['IV chord', 'fourth', 'pre-dominant'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'function',
      function: 'subdominant',
    },
    description: 'Harmonic function preparing for dominant',
    examples: [
      'use subdominant',
      'add IV chord',
      'prepare the dominant',
    ],
  },
  {
    id: createLexemeId('adj', 'pre_dominant'),
    lemma: 'pre-dominant',
    variants: ['predominant', 'ii chord', 'approach'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'function',
      function: 'pre_dominant',
    },
    description: 'Harmonic function approaching dominant',
    examples: [
      'add pre-dominant',
      'use ii-V-I',
      'create approach',
    ],
  },
  {
    id: createLexemeId('noun', 'cadence'),
    lemma: 'cadence',
    variants: ['harmonic ending', 'close', 'cadential'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'cadence',
    },
    description: 'Harmonic progression ending a phrase',
    examples: [
      'add a cadence',
      'create harmonic ending',
      'close the phrase',
    ],
  },
  {
    id: createLexemeId('adj', 'authentic_cadence'),
    lemma: 'authentic',
    variants: ['perfect cadence', 'V-I', 'full cadence'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'cadence_type',
      cadenceType: 'authentic',
    },
    description: 'Strong cadence from dominant to tonic',
    examples: [
      'use authentic cadence',
      'create V-I ending',
      'add perfect cadence',
    ],
  },
  {
    id: createLexemeId('adj', 'plagal_cadence'),
    lemma: 'plagal',
    variants: ['IV-I', 'amen cadence', 'subdominant cadence'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'cadence_type',
      cadenceType: 'plagal',
    },
    description: 'Cadence from subdominant to tonic',
    examples: [
      'use plagal cadence',
      'add amen cadence',
      'create IV-I ending',
    ],
  },
  {
    id: createLexemeId('adj', 'deceptive_cadence'),
    lemma: 'deceptive',
    variants: ['interrupted', 'false cadence', 'surprise ending'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'cadence_type',
      cadenceType: 'deceptive',
    },
    description: 'Cadence avoiding expected resolution',
    examples: [
      'add deceptive cadence',
      'create interrupted ending',
      'surprise with false cadence',
    ],
  },
] as const;

// =============================================================================
// Chord Quality
// =============================================================================

/**
 * Chord quality and type descriptors.
 *
 * Covers:
 * - Major vs. minor
 * - Diminished vs. augmented
 * - Seventh chords
 * - Extended chords
 */
const CHORD_QUALITY_DESCRIPTORS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'major_chord'),
    lemma: 'major',
    variants: ['maj', 'major triad', 'bright chord'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'chord_quality',
      quality: 'major',
    },
    description: 'Chord with major third (bright, stable)',
    examples: [
      'use major chords',
      'make it major',
      'brighten the harmony',
    ],
  },
  {
    id: createLexemeId('adj', 'minor_chord'),
    lemma: 'minor',
    variants: ['min', 'minor triad', 'dark chord'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'chord_quality',
      quality: 'minor',
    },
    description: 'Chord with minor third (darker, introspective)',
    examples: [
      'use minor chords',
      'make it minor',
      'darken the harmony',
    ],
  },
  {
    id: createLexemeId('adj', 'diminished_chord'),
    lemma: 'diminished',
    variants: ['dim', 'diminished triad', 'tense chord'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'chord_quality',
      quality: 'diminished',
    },
    description: 'Chord with diminished fifth (unstable, tense)',
    examples: [
      'add diminished chord',
      'create tension',
      'use dim chord',
    ],
  },
  {
    id: createLexemeId('adj', 'augmented_chord'),
    lemma: 'augmented',
    variants: ['aug', 'augmented triad', 'raised fifth'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'chord_quality',
      quality: 'augmented',
    },
    description: 'Chord with augmented fifth (suspended, ambiguous)',
    examples: [
      'add augmented chord',
      'use aug triad',
      'raise the fifth',
    ],
  },
  {
    id: createLexemeId('adj', 'seventh_chord'),
    lemma: 'seventh',
    variants: ['7th', 'dominant seventh', 'seventh chord'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'chord_extension',
      extension: 'seventh',
    },
    description: 'Chord with added seventh',
    examples: [
      'add seventh',
      'use seventh chords',
      'extend to 7th',
    ],
  },
  {
    id: createLexemeId('adj', 'major_seventh'),
    lemma: 'major seventh',
    variants: ['maj7', 'major 7th', 'M7'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'chord_type',
      chordType: 'major_seventh',
    },
    description: 'Major chord with major seventh',
    examples: [
      'use maj7 chords',
      'add major seventh',
      'create M7',
    ],
  },
  {
    id: createLexemeId('adj', 'minor_seventh'),
    lemma: 'minor seventh',
    variants: ['min7', 'minor 7th', 'm7'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'chord_type',
      chordType: 'minor_seventh',
    },
    description: 'Minor chord with minor seventh',
    examples: [
      'use min7 chords',
      'add minor seventh',
      'create m7',
    ],
  },
  {
    id: createLexemeId('adj', 'dominant_seventh'),
    lemma: 'dominant seventh',
    variants: ['dom7', 'V7', 'dominant 7th'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'chord_type',
      chordType: 'dominant_seventh',
    },
    description: 'Major chord with minor seventh (strong resolution)',
    examples: [
      'use dom7',
      'add V7 chord',
      'create dominant seventh',
    ],
  },
] as const;

// =============================================================================
// Harmonic Tension and Resolution
// =============================================================================

/**
 * Tension, dissonance, and resolution descriptors.
 *
 * Covers:
 * - Consonant vs. dissonant
 * - Tense vs. resolved
 * - Unstable vs. stable
 * - Suspended and resolved
 */
const TENSION_RESOLUTION_DESCRIPTORS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'consonant'),
    lemma: 'consonant',
    variants: ['stable', 'harmonious', 'pleasant'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('harmonic_consonance'),
      direction: 'increase',
    },
    description: 'Harmonically stable and pleasant',
    examples: [
      'make it consonant',
      'add stability',
      'create harmony',
    ],
  },
  {
    id: createLexemeId('adj', 'dissonant'),
    lemma: 'dissonant',
    variants: ['unstable', 'clashing', 'harsh'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('harmonic_consonance'),
      direction: 'decrease',
    },
    description: 'Harmonically unstable and tense',
    examples: [
      'make it dissonant',
      'add tension',
      'create clash',
    ],
  },
  {
    id: createLexemeId('adj', 'tense_harmony'),
    lemma: 'tense',
    variants: ['tension', 'unresolved', 'expectant'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('harmonic_tension'),
      direction: 'increase',
    },
    description: 'Harmonic tension requiring resolution',
    examples: [
      'increase tension',
      'add harmonic tension',
      'create expectation',
    ],
  },
  {
    id: createLexemeId('adj', 'resolved_harmony'),
    lemma: 'resolved',
    variants: ['resolution', 'relaxed', 'settled'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('harmonic_tension'),
      direction: 'decrease',
    },
    description: 'Harmonic tension resolved',
    examples: [
      'resolve the tension',
      'add resolution',
      'settle the harmony',
    ],
  },
  {
    id: createLexemeId('adj', 'suspended'),
    lemma: 'suspended',
    variants: ['sus', 'suspension', 'delayed resolution'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'suspension',
      state: 'suspended',
    },
    description: 'Non-chord tone delaying resolution',
    examples: [
      'add suspension',
      'use sus chords',
      'delay resolution',
    ],
  },
  {
    id: createLexemeId('adj', 'stable_harmony'),
    lemma: 'stable',
    variants: ['settled', 'at rest', 'grounded'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('harmonic_stability'),
      direction: 'increase',
    },
    description: 'Harmonically stable and at rest',
    examples: [
      'make it stable',
      'ground the harmony',
      'create stability',
    ],
  },
  {
    id: createLexemeId('adj', 'unstable_harmony'),
    lemma: 'unstable',
    variants: ['unsettled', 'restless', 'floating'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('harmonic_stability'),
      direction: 'decrease',
    },
    description: 'Harmonically unstable and mobile',
    examples: [
      'make it unstable',
      'add restlessness',
      'create floating harmony',
    ],
  },
  {
    id: createLexemeId('noun', 'appoggiatura'),
    lemma: 'appoggiatura',
    variants: ['leaning note', 'accented non-chord tone'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'non_chord_tone',
      ornamentType: 'appoggiatura',
    },
    description: 'Accented non-chord tone resolving stepwise',
    examples: [
      'add appoggiatura',
      'create leaning note',
      'use accented dissonance',
    ],
  },
] as const;

// =============================================================================
// Modal Characteristics
// =============================================================================

/**
 * Modal characteristics and scale types.
 *
 * Covers:
 * - Major vs. minor modes
 * - Church modes (Dorian, Phrygian, etc.)
 * - Modal characteristics
 * - Modal mixture
 */
const MODAL_CHARACTERISTICS_DESCRIPTORS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'dorian'),
    lemma: 'Dorian',
    variants: ['Dorian mode', 'Dorian scale'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'mode',
      mode: 'dorian',
    },
    description: 'Minor mode with raised sixth degree',
    examples: [
      'use Dorian mode',
      'make it Dorian',
      'apply Dorian scale',
    ],
  },
  {
    id: createLexemeId('adj', 'phrygian'),
    lemma: 'Phrygian',
    variants: ['Phrygian mode', 'Phrygian scale'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'mode',
      mode: 'phrygian',
    },
    description: 'Minor mode with lowered second degree',
    examples: [
      'use Phrygian mode',
      'make it Phrygian',
      'apply Phrygian scale',
    ],
  },
  {
    id: createLexemeId('adj', 'lydian'),
    lemma: 'Lydian',
    variants: ['Lydian mode', 'Lydian scale'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'mode',
      mode: 'lydian',
    },
    description: 'Major mode with raised fourth degree',
    examples: [
      'use Lydian mode',
      'make it Lydian',
      'apply Lydian scale',
    ],
  },
  {
    id: createLexemeId('adj', 'mixolydian'),
    lemma: 'Mixolydian',
    variants: ['Mixolydian mode', 'Mixolydian scale'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'mode',
      mode: 'mixolydian',
    },
    description: 'Major mode with lowered seventh degree',
    examples: [
      'use Mixolydian mode',
      'make it Mixolydian',
      'apply Mixolydian scale',
    ],
  },
  {
    id: createLexemeId('adj', 'aeolian'),
    lemma: 'Aeolian',
    variants: ['Aeolian mode', 'natural minor'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'mode',
      mode: 'aeolian',
    },
    description: 'Natural minor scale',
    examples: [
      'use Aeolian mode',
      'make it natural minor',
      'apply Aeolian scale',
    ],
  },
  {
    id: createLexemeId('adj', 'locrian'),
    lemma: 'Locrian',
    variants: ['Locrian mode', 'Locrian scale'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'mode',
      mode: 'locrian',
    },
    description: 'Minor mode with lowered second and fifth',
    examples: [
      'use Locrian mode',
      'make it Locrian',
      'apply Locrian scale',
    ],
  },
  {
    id: createLexemeId('adj', 'modal_mixture'),
    lemma: 'modal mixture',
    variants: ['borrowed chords', 'mode mixture', 'modal interchange'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'technique',
      technique: 'modal_mixture',
    },
    description: 'Borrowing chords from parallel modes',
    examples: [
      'use modal mixture',
      'borrow from parallel minor',
      'add modal interchange',
    ],
  },
  {
    id: createLexemeId('adj', 'modal_ambiguity'),
    lemma: 'modal ambiguity',
    variants: ['ambiguous mode', 'unclear tonality'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('modal_clarity'),
      direction: 'decrease',
    },
    description: 'Unclear or ambiguous modal center',
    examples: [
      'add modal ambiguity',
      'obscure the mode',
      'create tonal ambiguity',
    ],
  },
] as const;

// =============================================================================
// Chord Extensions and Alterations
// =============================================================================

/**
 * Extended and altered chord descriptors.
 *
 * Covers:
 * - Ninth, eleventh, thirteenth chords
 * - Altered dominants
 * - Added tone chords
 * - Polychords
 */
const CHORD_EXTENSIONS_DESCRIPTORS: readonly Lexeme[] = [
  {
    id: createLexemeId('adj', 'ninth_chord'),
    lemma: 'ninth',
    variants: ['9th', 'ninth chord', 'add9'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'chord_extension',
      extension: 'ninth',
    },
    description: 'Chord with added ninth',
    examples: [
      'add ninth',
      'use ninth chords',
      'extend to 9th',
    ],
  },
  {
    id: createLexemeId('adj', 'eleventh_chord'),
    lemma: 'eleventh',
    variants: ['11th', 'eleventh chord', 'add11'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'chord_extension',
      extension: 'eleventh',
    },
    description: 'Chord with added eleventh',
    examples: [
      'add eleventh',
      'use eleventh chords',
      'extend to 11th',
    ],
  },
  {
    id: createLexemeId('adj', 'thirteenth_chord'),
    lemma: 'thirteenth',
    variants: ['13th', 'thirteenth chord', 'add13'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'chord_extension',
      extension: 'thirteenth',
    },
    description: 'Chord with added thirteenth',
    examples: [
      'add thirteenth',
      'use thirteenth chords',
      'extend to 13th',
    ],
  },
  {
    id: createLexemeId('adj', 'altered_dominant'),
    lemma: 'altered',
    variants: ['altered dominant', 'altered V', 'chromatic alteration'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'alteration',
      alterationType: 'dominant',
    },
    description: 'Dominant chord with chromatic alterations',
    examples: [
      'use altered dominant',
      'add alterations',
      'create altered V',
    ],
  },
  {
    id: createLexemeId('adj', 'flat_five'),
    lemma: 'flat five',
    variants: ['b5', 'diminished fifth', 'tritone sub'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'alteration',
      alterationType: 'flat_five',
    },
    description: 'Chord with lowered fifth',
    examples: [
      'add flat five',
      'use b5 chord',
      'lower the fifth',
    ],
  },
  {
    id: createLexemeId('adj', 'sharp_five'),
    lemma: 'sharp five',
    variants: ['#5', 'augmented fifth', 'raised fifth'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'alteration',
      alterationType: 'sharp_five',
    },
    description: 'Chord with raised fifth',
    examples: [
      'add sharp five',
      'use #5 chord',
      'raise the fifth',
    ],
  },
  {
    id: createLexemeId('adj', 'flat_nine'),
    lemma: 'flat nine',
    variants: ['b9', 'minor ninth', 'lowered ninth'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'alteration',
      alterationType: 'flat_nine',
    },
    description: 'Chord with lowered ninth',
    examples: [
      'add flat nine',
      'use b9 chord',
      'lower the ninth',
    ],
  },
  {
    id: createLexemeId('adj', 'sharp_nine'),
    lemma: 'sharp nine',
    variants: ['#9', 'augmented ninth', 'raised ninth', 'Hendrix chord'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'alteration',
      alterationType: 'sharp_nine',
    },
    description: 'Chord with raised ninth',
    examples: [
      'add sharp nine',
      'use #9 chord',
      'create Hendrix chord',
    ],
  },
] as const;

// =============================================================================
// Harmonic Progression Patterns
// =============================================================================

/**
 * Common harmonic progression patterns.
 *
 * Covers:
 * - Circle of fifths
 * - Chromatic progressions
 * - Sequential patterns
 * - Common turnarounds
 */
const PROGRESSION_PATTERN_DESCRIPTORS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'circle_of_fifths'),
    lemma: 'circle of fifths',
    variants: ['fifths progression', 'descending fifths'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'progression_pattern',
      pattern: 'circle_of_fifths',
    },
    description: 'Progression moving by descending fifths',
    examples: [
      'use circle of fifths',
      'create fifths progression',
      'move by descending fifths',
    ],
  },
  {
    id: createLexemeId('noun', 'chromatic_progression'),
    lemma: 'chromatic progression',
    variants: ['chromatic harmony', 'half-step motion'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'progression_pattern',
      pattern: 'chromatic',
    },
    description: 'Progression moving by half steps',
    examples: [
      'use chromatic progression',
      'add chromatic motion',
      'move by half steps',
    ],
  },
  {
    id: createLexemeId('noun', 'sequence'),
    lemma: 'sequence',
    variants: ['sequential progression', 'repeated pattern'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'progression_pattern',
      pattern: 'sequence',
    },
    description: 'Progression repeating at different pitch levels',
    examples: [
      'create sequence',
      'use sequential pattern',
      'repeat at different levels',
    ],
  },
  {
    id: createLexemeId('noun', 'turnaround'),
    lemma: 'turnaround',
    variants: ['turn', 'cyclic progression', 'I-VI-II-V'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'progression_pattern',
      pattern: 'turnaround',
    },
    description: 'Progression cycling back to tonic',
    examples: [
      'add turnaround',
      'use I-VI-II-V',
      'create cyclic progression',
    ],
  },
  {
    id: createLexemeId('noun', 'two_five_one'),
    lemma: 'ii-V-I',
    variants: ['two-five-one', '2-5-1', 'jazz progression'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'progression_pattern',
      pattern: 'two_five_one',
    },
    description: 'Classic jazz progression ii-V-I',
    examples: [
      'use ii-V-I',
      'add jazz progression',
      'create two-five-one',
    ],
  },
  {
    id: createLexemeId('noun', 'tritone_substitution'),
    lemma: 'tritone substitution',
    variants: ['tritone sub', 'flat-five substitution'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'substitution',
      substitutionType: 'tritone',
    },
    description: 'Substituting chord a tritone away',
    examples: [
      'use tritone sub',
      'add substitution',
      'replace with tritone',
    ],
  },
  {
    id: createLexemeId('adj', 'modal_interchange'),
    lemma: 'borrowed',
    variants: ['modal borrowing', 'parallel mode'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'technique',
      technique: 'borrowing',
    },
    description: 'Borrowing chords from parallel mode',
    examples: [
      'borrow from minor',
      'use parallel mode',
      'add borrowed chord',
    ],
  },
  {
    id: createLexemeId('adj', 'pedal_point'),
    lemma: 'pedal',
    variants: ['pedal point', 'sustained bass', 'drone'],
    category: 'adj',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'technique',
      technique: 'pedal',
    },
    description: 'Sustained note (usually bass) under changing harmony',
    examples: [
      'add pedal point',
      'sustain the bass',
      'create drone',
    ],
  },
] as const;

// =============================================================================
// Combined Exports
// =============================================================================

/**
 * All harmonic function and chord quality vocabulary entries from Batch 59.
 */
export const HARMONIC_FUNCTION_BATCH_59: readonly Lexeme[] = [
  ...FUNCTIONAL_HARMONY_DESCRIPTORS,
  ...CHORD_QUALITY_DESCRIPTORS,
  ...TENSION_RESOLUTION_DESCRIPTORS,
  ...MODAL_CHARACTERISTICS_DESCRIPTORS,
  ...CHORD_EXTENSIONS_DESCRIPTORS,
  ...PROGRESSION_PATTERN_DESCRIPTORS,
] as const;

/**
 * Count of entries in Batch 59.
 */
export const BATCH_59_COUNT = HARMONIC_FUNCTION_BATCH_59.length;

/**
 * Categories covered in Batch 59.
 */
export const BATCH_59_CATEGORIES = [
  'Functional Harmony (8 entries)',
  'Chord Quality (8 entries)',
  'Tension and Resolution (8 entries)',
  'Modal Characteristics (8 entries)',
  'Chord Extensions and Alterations (8 entries)',
  'Progression Patterns (8 entries)',
] as const;

/**
 * Summary of Batch 59.
 */
export const BATCH_59_SUMMARY = {
  batchNumber: 59,
  name: 'Harmonic Function and Chord Quality',
  entryCount: BATCH_59_COUNT,
  categories: BATCH_59_CATEGORIES,
  description:
    'Comprehensive vocabulary for harmonic function, chord quality, tension, ' +
    'modal characteristics, extensions, and progression patterns in composition.',
} as const;
