/**
 * GOFAI Vocabulary — Advanced Harmony Vocabulary (Batch 65)
 *
 * Comprehensive vocabulary for advanced harmonic concepts, chord extensions,
 * alterations, substitutions, voice leading principles, and functional harmony.
 *
 * This batch enables sophisticated harmonic analysis and manipulation in natural language.
 *
 * @module gofai/canon/advanced-harmony-batch65
 */

import { type Lexeme, createLexemeId, createAxisId, createOpcodeId } from './types';

// =============================================================================
// Category 1: Chord Extensions and Alterations (8 entries)
// =============================================================================

const CHORD_EXTENSIONS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'ninth-chord'),
    lemma: 'ninth',
    variants: ['ninth', '9th', 'add9', 'ninth chord'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'chord_extension',
      value: 'ninth',
    },
    description: 'Chord extended with the ninth above the root',
    examples: ['add ninth', 'use 9th chords', 'extend with ninths'],
  },
  {
    id: createLexemeId('noun', 'eleventh-chord'),
    lemma: 'eleventh',
    variants: ['eleventh', '11th', 'add11', 'eleventh chord'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'chord_extension',
      value: 'eleventh',
    },
    description: 'Chord extended with the eleventh above the root',
    examples: ['add eleventh', 'use 11th chords', 'extend with elevenths'],
  },
  {
    id: createLexemeId('noun', 'thirteenth-chord'),
    lemma: 'thirteenth',
    variants: ['thirteenth', '13th', 'add13', 'thirteenth chord'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'chord_extension',
      value: 'thirteenth',
    },
    description: 'Chord extended with the thirteenth above the root',
    examples: ['add thirteenth', 'use 13th chords', 'extend with thirteenths'],
  },
  {
    id: createLexemeId('adj', 'altered'),
    lemma: 'altered',
    variants: ['altered', 'altered dominant', 'super-locrian'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('harmonic_tension'),
      direction: 'increase',
    },
    description: 'Chord with chromatically altered fifths and/or ninths',
    examples: ['make it altered', 'use altered dominants', 'apply super-locrian'],
  },
  {
    id: createLexemeId('adj', 'suspended'),
    lemma: 'suspended',
    variants: ['suspended', 'sus', 'sus2', 'sus4'],
    category: 'adj',
    semantics: {
      type: 'axis_modifier',
      axis: createAxisId('chord_stability'),
      direction: 'decrease',
    },
    description: 'Chord with third replaced by second or fourth',
    examples: ['make it suspended', 'use sus chords', 'suspend the harmony'],
  },
  {
    id: createLexemeId('noun', 'quartal-harmony'),
    lemma: 'quartal',
    variants: ['quartal', 'fourths', 'stacked fourths', 'quartal voicing'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'chord_structure',
      value: 'quartal',
    },
    description: 'Chords built from stacked perfect fourths',
    examples: ['use quartal harmony', 'stack fourths', 'create quartal voicing'],
  },
  {
    id: createLexemeId('noun', 'quintal-harmony'),
    lemma: 'quintal',
    variants: ['quintal', 'fifths', 'stacked fifths', 'quintal voicing'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'chord_structure',
      value: 'quintal',
    },
    description: 'Chords built from stacked perfect fifths',
    examples: ['use quintal harmony', 'stack fifths', 'create quintal voicing'],
  },
  {
    id: createLexemeId('noun', 'polychord'),
    lemma: 'polychord',
    variants: ['polychord', 'bi-tonal', 'split chord', 'compound chord'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'chord_structure',
      value: 'polychord',
    },
    description: 'Two distinct chords sounded simultaneously',
    examples: ['create polychord', 'use bi-tonal harmony', 'build split chord'],
  },
];

// =============================================================================
// Category 2: Harmonic Functions and Relationships (8 entries)
// =============================================================================

const HARMONIC_FUNCTIONS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'tonic'),
    lemma: 'tonic',
    variants: ['tonic', 'home', 'resolution', 'I chord'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'function',
      value: 'tonic',
    },
    description: 'Home chord, stable center of the key',
    examples: ['resolve to tonic', 'return to home', 'establish I chord'],
  },
  {
    id: createLexemeId('noun', 'subdominant'),
    lemma: 'subdominant',
    variants: ['subdominant', 'pre-dominant', 'IV chord', 'plagal'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'function',
      value: 'subdominant',
    },
    description: 'Fourth scale degree, leads away from tonic',
    examples: ['move to subdominant', 'use pre-dominant', 'add IV chord'],
  },
  {
    id: createLexemeId('noun', 'dominant'),
    lemma: 'dominant',
    variants: ['dominant', 'V chord', 'dominant seventh', 'V7'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'function',
      value: 'dominant',
    },
    description: 'Fifth scale degree, creates strong pull to tonic',
    examples: ['strengthen dominant', 'use V chord', 'add dominant seventh'],
  },
  {
    id: createLexemeId('noun', 'secondary-dominant'),
    lemma: 'secondary dominant',
    variants: ['secondary dominant', 'applied dominant', 'V of V', 'tonicization'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'chromatic_function',
      value: 'secondary_dominant',
    },
    description: 'Dominant chord applied to a chord other than tonic',
    examples: ['add secondary dominant', 'use applied dominant', 'tonicize the chord'],
  },
  {
    id: createLexemeId('noun', 'neapolitan'),
    lemma: 'Neapolitan',
    variants: ['Neapolitan', 'Neapolitan sixth', 'N6', 'bII'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'chromatic_chord',
      value: 'neapolitan',
    },
    description: 'Major chord built on lowered second scale degree',
    examples: ['use Neapolitan', 'add Neapolitan sixth', 'insert bII chord'],
  },
  {
    id: createLexemeId('noun', 'augmented-sixth'),
    lemma: 'augmented sixth',
    variants: ['augmented sixth', 'Italian sixth', 'French sixth', 'German sixth'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'chromatic_chord',
      value: 'augmented_sixth',
    },
    description: 'Pre-dominant chord with characteristic augmented sixth interval',
    examples: ['add augmented sixth', 'use Italian sixth', 'insert German sixth'],
  },
  {
    id: createLexemeId('noun', 'diminished-seventh'),
    lemma: 'diminished seventh',
    variants: ['diminished seventh', 'dim7', 'fully diminished', 'vii°7'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'chord_quality',
      value: 'diminished_seventh',
    },
    description: 'Symmetrical chord with stacked minor thirds',
    examples: ['add diminished seventh', 'use dim7 chord', 'insert fully diminished'],
  },
  {
    id: createLexemeId('noun', 'common-tone'),
    lemma: 'common tone',
    variants: ['common tone', 'shared note', 'pivot', 'pivot tone'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'voice_leading',
      value: 'common_tone',
    },
    description: 'Note held constant between chord changes',
    examples: ['emphasize common tone', 'use shared notes', 'pivot on held note'],
  },
];

// =============================================================================
// Category 3: Chord Substitutions (8 entries)
// =============================================================================

const CHORD_SUBSTITUTIONS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'tritone-substitution'),
    lemma: 'tritone substitution',
    variants: ['tritone sub', 'tritone substitution', 'flat-five sub', 'bV7'],
    category: 'noun',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('substitute_tritone'),
      role: 'main',
      actionType: 'harmonic_substitution',
      technique: 'tritone',
    },
    description: 'Substitute dominant chord a tritone away',
    examples: ['apply tritone sub', 'use flat-five substitution', 'replace with bV7'],
  },
  {
    id: createLexemeId('noun', 'relative-substitute'),
    lemma: 'relative substitute',
    variants: ['relative sub', 'relative substitution', 'minor for major', 'major for minor'],
    category: 'noun',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('substitute_relative'),
      role: 'main',
      actionType: 'harmonic_substitution',
      technique: 'relative',
    },
    description: 'Substitute chord with its relative major or minor',
    examples: ['use relative substitute', 'swap with relative', 'substitute related chord'],
  },
  {
    id: createLexemeId('noun', 'parallel-substitute'),
    lemma: 'parallel substitute',
    variants: ['parallel sub', 'parallel substitution', 'borrowed chord', 'modal mixture'],
    category: 'noun',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('substitute_parallel'),
      role: 'main',
      actionType: 'harmonic_substitution',
      technique: 'parallel',
    },
    description: 'Substitute chord from parallel major or minor',
    examples: ['use parallel substitute', 'borrow from parallel mode', 'apply modal mixture'],
  },
  {
    id: createLexemeId('noun', 'chord-extension-sub'),
    lemma: 'extension substitution',
    variants: ['extension sub', 'extended substitute', 'thirteenth for dominant'],
    category: 'noun',
    semantics: {
      type: 'action',
      opcode: createOpcodeId('substitute_extension'),
      role: 'main',
      actionType: 'harmonic_substitution',
      technique: 'extension',
    },
    description: 'Replace basic chord with extended version',
    examples: ['use extension substitution', 'replace with extended chord', 'add extensions'],
  },
  {
    id: createLexemeId('noun', 'chromatic-mediant'),
    lemma: 'chromatic mediant',
    variants: ['chromatic mediant', 'mediant relationship', 'third relation'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'chord_relationship',
      value: 'chromatic_mediant',
    },
    description: 'Chords whose roots are a major or minor third apart',
    examples: ['move by chromatic mediant', 'use mediant relationship', 'leap by third'],
  },
  {
    id: createLexemeId('noun', 'backdoor-progression'),
    lemma: 'backdoor',
    variants: ['backdoor', 'backdoor progression', 'bVII-I', 'subtonic resolution'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'progression_type',
      value: 'backdoor',
    },
    description: 'Resolution to tonic via lowered seventh scale degree',
    examples: ['use backdoor progression', 'resolve via bVII', 'add subtonic approach'],
  },
  {
    id: createLexemeId('noun', 'deceptive-cadence'),
    lemma: 'deceptive cadence',
    variants: ['deceptive cadence', 'interrupted cadence', 'V-vi', 'avoided resolution'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'cadence_type',
      value: 'deceptive',
    },
    description: 'Dominant resolves to submediant instead of tonic',
    examples: ['add deceptive cadence', 'use interrupted cadence', 'avoid resolution'],
  },
  {
    id: createLexemeId('noun', 'modal-interchange'),
    lemma: 'modal interchange',
    variants: ['modal interchange', 'modal borrowing', 'mode mixture', 'borrowed chords'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'chromatic_technique',
      value: 'modal_interchange',
    },
    description: 'Using chords from parallel modes',
    examples: ['apply modal interchange', 'borrow from modes', 'use mode mixture'],
  },
];

// =============================================================================
// Category 4: Voice Leading Principles (8 entries)
// =============================================================================

const VOICE_LEADING: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'contrary-motion'),
    lemma: 'contrary motion',
    variants: ['contrary motion', 'contrary', 'voices moving apart'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'voice_leading',
      aspect: 'motion_type',
      value: 'contrary',
    },
    description: 'Voices move in opposite directions',
    examples: ['use contrary motion', 'move voices apart', 'create contrary movement'],
  },
  {
    id: createLexemeId('noun', 'parallel-motion'),
    lemma: 'parallel motion',
    variants: ['parallel motion', 'parallel', 'parallel fifths', 'parallel octaves'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'voice_leading',
      aspect: 'motion_type',
      value: 'parallel',
    },
    description: 'Voices move in same direction maintaining interval',
    examples: ['use parallel motion', 'move in parallel', 'create parallel movement'],
  },
  {
    id: createLexemeId('noun', 'oblique-motion'),
    lemma: 'oblique motion',
    variants: ['oblique motion', 'oblique', 'one voice static'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'voice_leading',
      aspect: 'motion_type',
      value: 'oblique',
    },
    description: 'One voice moves while another stays fixed',
    examples: ['use oblique motion', 'hold one voice', 'create oblique movement'],
  },
  {
    id: createLexemeId('noun', 'stepwise-motion'),
    lemma: 'stepwise',
    variants: ['stepwise', 'conjunct', 'scalar motion', 'by step'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'voice_leading',
      aspect: 'interval_type',
      value: 'stepwise',
    },
    description: 'Movement by seconds (whole or half steps)',
    examples: ['move stepwise', 'use conjunct motion', 'connect by steps'],
  },
  {
    id: createLexemeId('noun', 'leap'),
    lemma: 'leap',
    variants: ['leap', 'skip', 'disjunct', 'melodic leap'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'voice_leading',
      aspect: 'interval_type',
      value: 'leap',
    },
    description: 'Movement by interval larger than a second',
    examples: ['use leaps', 'skip intervals', 'move disjunctly'],
  },
  {
    id: createLexemeId('noun', 'voice-crossing'),
    lemma: 'voice crossing',
    variants: ['voice crossing', 'crossed voices', 'voices overlap'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'voice_leading',
      aspect: 'technique',
      value: 'crossing',
    },
    description: 'Higher voice moves below lower voice or vice versa',
    examples: ['allow voice crossing', 'cross voices', 'create overlapping lines'],
  },
  {
    id: createLexemeId('noun', 'voice-exchange'),
    lemma: 'voice exchange',
    variants: ['voice exchange', 'swap voices', 'voices trade notes'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'voice_leading',
      aspect: 'technique',
      value: 'exchange',
    },
    description: 'Two voices exchange pitches',
    examples: ['use voice exchange', 'swap voice notes', 'exchange between voices'],
  },
  {
    id: createLexemeId('noun', 'pedal-point'),
    lemma: 'pedal point',
    variants: ['pedal point', 'pedal', 'drone', 'sustained bass'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'voice_leading',
      aspect: 'technique',
      value: 'pedal',
    },
    description: 'Sustained or repeated note while harmony changes above',
    examples: ['add pedal point', 'sustain bass', 'create drone'],
  },
];

// =============================================================================
// Category 5: Advanced Cadences and Progressions (8 entries)
// =============================================================================

const CADENCES_PROGRESSIONS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'authentic-cadence'),
    lemma: 'authentic cadence',
    variants: ['authentic cadence', 'perfect cadence', 'V-I', 'PAC'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'cadence_type',
      value: 'authentic',
    },
    description: 'Strong cadence from dominant to tonic',
    examples: ['use authentic cadence', 'end with perfect cadence', 'resolve V-I'],
  },
  {
    id: createLexemeId('noun', 'plagal-cadence'),
    lemma: 'plagal cadence',
    variants: ['plagal cadence', 'amen cadence', 'IV-I', 'subdominant to tonic'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'cadence_type',
      value: 'plagal',
    },
    description: 'Cadence from subdominant to tonic (amen)',
    examples: ['use plagal cadence', 'end with amen cadence', 'resolve IV-I'],
  },
  {
    id: createLexemeId('noun', 'half-cadence'),
    lemma: 'half cadence',
    variants: ['half cadence', 'imperfect cadence', 'ends on V', 'open cadence'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'cadence_type',
      value: 'half',
    },
    description: 'Phrase ending on dominant, creating expectation',
    examples: ['use half cadence', 'end on dominant', 'leave open'],
  },
  {
    id: createLexemeId('noun', 'circle-of-fifths'),
    lemma: 'circle of fifths',
    variants: ['circle of fifths', 'cycle of fifths', 'fifth progression', 'descending fifths'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'progression_pattern',
      value: 'circle_fifths',
    },
    description: 'Chord progression by descending perfect fifths',
    examples: ['follow circle of fifths', 'use fifth progression', 'descend by fifths'],
  },
  {
    id: createLexemeId('noun', 'coltrane-changes'),
    lemma: 'Coltrane changes',
    variants: ['Coltrane changes', 'Giant Steps', 'three-tonic system'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'progression_pattern',
      value: 'coltrane_changes',
    },
    description: 'Progression through three tonal centers by major thirds',
    examples: ['use Coltrane changes', 'apply Giant Steps pattern', 'three-tonic system'],
  },
  {
    id: createLexemeId('noun', 'rhythm-changes'),
    lemma: 'rhythm changes',
    variants: ['rhythm changes', 'Gershwin changes', 'I Got Rhythm'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'progression_pattern',
      value: 'rhythm_changes',
    },
    description: 'Standard jazz progression based on "I Got Rhythm"',
    examples: ['use rhythm changes', 'follow Gershwin pattern', 'I Got Rhythm form'],
  },
  {
    id: createLexemeId('noun', 'two-five-one'),
    lemma: 'two-five-one',
    variants: ['two-five-one', 'ii-V-I', 'turnaround', '2-5-1'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'progression_pattern',
      value: 'two_five_one',
    },
    description: 'Standard jazz progression: ii-V-I',
    examples: ['add two-five-one', 'use ii-V-I', 'insert turnaround'],
  },
  {
    id: createLexemeId('noun', 'descending-bassline'),
    lemma: 'descending bassline',
    variants: ['descending bassline', 'falling bass', 'lament bass', 'ground bass'],
    category: 'noun',
    semantics: {
      type: 'concept',
      domain: 'harmony',
      aspect: 'progression_pattern',
      value: 'descending_bass',
    },
    description: 'Stepwise descending bass line pattern',
    examples: ['use descending bassline', 'create falling bass', 'apply lament bass'],
  },
];

// =============================================================================
// Exports and Summary
// =============================================================================

/**
 * All advanced harmony lexemes (Batch 65).
 */
export const ADVANCED_HARMONY_BATCH65: readonly Lexeme[] = [
  ...CHORD_EXTENSIONS,
  ...HARMONIC_FUNCTIONS,
  ...CHORD_SUBSTITUTIONS,
  ...VOICE_LEADING,
  ...CADENCES_PROGRESSIONS,
];

/**
 * Count of entries in Batch 65.
 */
export const BATCH_65_COUNT = ADVANCED_HARMONY_BATCH65.length;

/**
 * Category summary for Batch 65.
 * 
 * Axes introduced:
 * - harmonic_tension (altered chords increase tension)
 * - chord_stability (suspended chords decrease stability)
 * 
 * Categories covered:
 * 1. Chord Extensions and Alterations (8 entries)
 * 2. Harmonic Functions and Relationships (8 entries)
 * 3. Chord Substitutions (8 entries)
 * 4. Voice Leading Principles (8 entries)
 * 5. Advanced Cadences and Progressions (8 entries)
 * 
 * Total: 40 lexemes covering comprehensive advanced harmony vocabulary
 */
