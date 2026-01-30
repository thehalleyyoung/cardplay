/**
 * GOFAI Domain Nouns — Pitch and Harmony (Batch 8)
 *
 * Comprehensive vocabulary for pitch, scales, chords, and harmonic concepts.
 * Enables natural language commands about harmony, tonality, and pitch relationships.
 *
 * @module gofai/canon/domain-nouns-batch8
 */

import {
  type Lexeme,
  createLexemeId,
} from './types';

// =============================================================================
// Extended Lexeme Type for Pitch/Harmony Nouns
// =============================================================================

/**
 * Extended lexeme for pitch and harmony domain nouns.
 */
export interface PitchHarmonyLexeme extends Lexeme {
  readonly pitchHarmonyCategory:
    | 'pitch-class'
    | 'interval'
    | 'scale'
    | 'mode'
    | 'chord-type'
    | 'chord-quality'
    | 'chord-extension'
    | 'voicing'
    | 'harmonic-function'
    | 'harmonic-device';
  readonly musicTheoryContext?: string;
  readonly enharmonicEquivalents?: readonly string[];
  readonly typicalUseCase?: string;
}

// =============================================================================
// Pitch Classes
// =============================================================================

const PITCH_NOTE: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'note'),
  lemma: 'note',
  variants: ['notes', 'pitch', 'pitches', 'tone', 'tones'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'musical-object', subtype: 'note' },
  description: 'A single musical pitch or sound event.',
  examples: ['Move that note up', 'Add notes to the melody', 'Change the pitch'],
  pitchHarmonyCategory: 'pitch-class',
  musicTheoryContext: 'Fundamental unit of pitch in Western music',
};

const PITCH_C: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'c'),
  lemma: 'C',
  variants: ['C natural', 'do'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'pitch-class', value: 0 },
  description: 'The pitch class C (0 semitones from C).',
  examples: ['Transpose to C', 'Start on C', 'C major'],
  pitchHarmonyCategory: 'pitch-class',
  enharmonicEquivalents: ['B#', 'Dbb'],
};

const PITCH_C_SHARP: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'c-sharp'),
  lemma: 'C#',
  variants: ['C sharp', 'Db', 'D flat', 'C♯', 'D♭', 'ra'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'pitch-class', value: 1 },
  description: 'The pitch class C# / Db (1 semitone from C).',
  examples: ['Transpose to C#', 'Add a C# to the chord'],
  pitchHarmonyCategory: 'pitch-class',
  enharmonicEquivalents: ['C#', 'Db'],
};

const PITCH_D: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'd'),
  lemma: 'D',
  variants: ['D natural', 're'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'pitch-class', value: 2 },
  description: 'The pitch class D (2 semitones from C).',
  examples: ['Transpose to D', 'D minor', 'Start on D'],
  pitchHarmonyCategory: 'pitch-class',
  enharmonicEquivalents: ['C##', 'Ebb'],
};

const PITCH_D_SHARP: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'd-sharp'),
  lemma: 'D#',
  variants: ['D sharp', 'Eb', 'E flat', 'D♯', 'E♭', 'me'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'pitch-class', value: 3 },
  description: 'The pitch class D# / Eb (3 semitones from C).',
  examples: ['Transpose to Eb', 'Eb major'],
  pitchHarmonyCategory: 'pitch-class',
  enharmonicEquivalents: ['D#', 'Eb'],
};

const PITCH_E: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'e'),
  lemma: 'E',
  variants: ['E natural', 'mi'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'pitch-class', value: 4 },
  description: 'The pitch class E (4 semitones from C).',
  examples: ['Transpose to E', 'E major', 'E minor'],
  pitchHarmonyCategory: 'pitch-class',
  enharmonicEquivalents: ['D##', 'Fb'],
};

const PITCH_F: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'f'),
  lemma: 'F',
  variants: ['F natural', 'fa'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'pitch-class', value: 5 },
  description: 'The pitch class F (5 semitones from C).',
  examples: ['Transpose to F', 'F major', 'The subdominant'],
  pitchHarmonyCategory: 'pitch-class',
  enharmonicEquivalents: ['E#', 'Gbb'],
};

const PITCH_F_SHARP: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'f-sharp'),
  lemma: 'F#',
  variants: ['F sharp', 'Gb', 'G flat', 'F♯', 'G♭', 'fi'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'pitch-class', value: 6 },
  description: 'The pitch class F# / Gb (6 semitones from C).',
  examples: ['Transpose to F#', 'F# minor', 'Gb major'],
  pitchHarmonyCategory: 'pitch-class',
  enharmonicEquivalents: ['F#', 'Gb'],
};

const PITCH_G: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'g'),
  lemma: 'G',
  variants: ['G natural', 'sol'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'pitch-class', value: 7 },
  description: 'The pitch class G (7 semitones from C).',
  examples: ['Transpose to G', 'G major', 'The dominant'],
  pitchHarmonyCategory: 'pitch-class',
  enharmonicEquivalents: ['F##', 'Abb'],
};

const PITCH_G_SHARP: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'g-sharp'),
  lemma: 'G#',
  variants: ['G sharp', 'Ab', 'A flat', 'G♯', 'A♭', 'le'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'pitch-class', value: 8 },
  description: 'The pitch class G# / Ab (8 semitones from C).',
  examples: ['Transpose to Ab', 'Ab major', 'G# minor'],
  pitchHarmonyCategory: 'pitch-class',
  enharmonicEquivalents: ['G#', 'Ab'],
};

const PITCH_A: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'a'),
  lemma: 'A',
  variants: ['A natural', 'la'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'pitch-class', value: 9 },
  description: 'The pitch class A (9 semitones from C).',
  examples: ['Transpose to A', 'A minor', 'A440 reference'],
  pitchHarmonyCategory: 'pitch-class',
  enharmonicEquivalents: ['G##', 'Bbb'],
};

const PITCH_A_SHARP: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'a-sharp'),
  lemma: 'A#',
  variants: ['A sharp', 'Bb', 'B flat', 'A♯', 'B♭', 'te'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'pitch-class', value: 10 },
  description: 'The pitch class A# / Bb (10 semitones from C).',
  examples: ['Transpose to Bb', 'Bb major', 'A# minor'],
  pitchHarmonyCategory: 'pitch-class',
  enharmonicEquivalents: ['A#', 'Bb'],
};

const PITCH_B: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'b'),
  lemma: 'B',
  variants: ['B natural', 'ti', 'si'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'pitch-class', value: 11 },
  description: 'The pitch class B (11 semitones from C).',
  examples: ['Transpose to B', 'B minor', 'Leading tone'],
  pitchHarmonyCategory: 'pitch-class',
  enharmonicEquivalents: ['A##', 'Cb'],
};

// =============================================================================
// Intervals
// =============================================================================

const INTERVAL_UNISON: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'unison'),
  lemma: 'unison',
  variants: ['prime', 'perfect unison'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'interval', semitones: 0 },
  description: 'The interval of zero semitones (same pitch).',
  examples: ['In unison', 'Double the melody in unison'],
  pitchHarmonyCategory: 'interval',
  musicTheoryContext: 'Perfect consonance',
};

const INTERVAL_SEMITONE: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'semitone'),
  lemma: 'semitone',
  variants: ['half step', 'halfstep', 'minor second', 'm2'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'interval', semitones: 1 },
  description: 'The smallest interval in Western music (1 semitone).',
  examples: ['Move up a semitone', 'Add chromatic passing tones'],
  pitchHarmonyCategory: 'interval',
  musicTheoryContext: 'Sharp dissonance',
};

const INTERVAL_WHOLETONE: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'tone'),
  lemma: 'tone',
  variants: ['whole step', 'wholestep', 'major second', 'M2'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'interval', semitones: 2 },
  description: 'An interval of 2 semitones (major second).',
  examples: ['Move up a whole tone', 'Whole tone scale'],
  pitchHarmonyCategory: 'interval',
  musicTheoryContext: 'Mild dissonance',
};

const INTERVAL_MINOR_THIRD: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'minor-third'),
  lemma: 'minor third',
  variants: ['m3', 'minor 3rd'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'interval', semitones: 3 },
  description: 'An interval of 3 semitones.',
  examples: ['Minor third harmony', 'Add a minor third above'],
  pitchHarmonyCategory: 'interval',
  musicTheoryContext: 'Soft consonance, defines minor quality',
};

const INTERVAL_MAJOR_THIRD: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'major-third'),
  lemma: 'major third',
  variants: ['M3', 'major 3rd'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'interval', semitones: 4 },
  description: 'An interval of 4 semitones.',
  examples: ['Major third harmony', 'Bright major third'],
  pitchHarmonyCategory: 'interval',
  musicTheoryContext: 'Bright consonance, defines major quality',
};

const INTERVAL_PERFECT_FOURTH: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'fourth'),
  lemma: 'fourth',
  variants: ['perfect fourth', 'P4', '4th'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'interval', semitones: 5 },
  description: 'An interval of 5 semitones (perfect fourth).',
  examples: ['Perfect fourth voicing', 'Quartal harmony'],
  pitchHarmonyCategory: 'interval',
  musicTheoryContext: 'Perfect consonance, ambiguous in some contexts',
};

const INTERVAL_TRITONE: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'tritone'),
  lemma: 'tritone',
  variants: ['augmented fourth', 'diminished fifth', 'A4', 'd5', 'devil\'s interval'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'interval', semitones: 6 },
  description: 'An interval of 6 semitones, maximally dissonant.',
  examples: ['Tritone substitution', 'Add tension with a tritone'],
  pitchHarmonyCategory: 'interval',
  musicTheoryContext: 'Maximum dissonance, historically avoided',
};

const INTERVAL_PERFECT_FIFTH: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'fifth'),
  lemma: 'fifth',
  variants: ['perfect fifth', 'P5', '5th'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'interval', semitones: 7 },
  description: 'An interval of 7 semitones (perfect fifth).',
  examples: ['Perfect fifth harmony', 'Power chord', 'Open fifth voicing'],
  pitchHarmonyCategory: 'interval',
  musicTheoryContext: 'Most consonant interval after octave',
};

const INTERVAL_MINOR_SIXTH: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'minor-sixth'),
  lemma: 'minor sixth',
  variants: ['m6', 'minor 6th'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'interval', semitones: 8 },
  description: 'An interval of 8 semitones.',
  examples: ['Minor sixth melody', 'Inverted major third'],
  pitchHarmonyCategory: 'interval',
  musicTheoryContext: 'Soft consonance',
};

const INTERVAL_MAJOR_SIXTH: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'major-sixth'),
  lemma: 'major sixth',
  variants: ['M6', 'major 6th'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'interval', semitones: 9 },
  description: 'An interval of 9 semitones.',
  examples: ['Major sixth chord', 'Sweet sixth harmony'],
  pitchHarmonyCategory: 'interval',
  musicTheoryContext: 'Bright consonance',
};

const INTERVAL_MINOR_SEVENTH: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'minor-seventh'),
  lemma: 'minor seventh',
  variants: ['m7', 'minor 7th', 'flat seven'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'interval', semitones: 10 },
  description: 'An interval of 10 semitones.',
  examples: ['Minor seventh chord', 'Dominant seventh'],
  pitchHarmonyCategory: 'interval',
  musicTheoryContext: 'Mild dissonance, common in jazz',
};

const INTERVAL_MAJOR_SEVENTH: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'major-seventh'),
  lemma: 'major seventh',
  variants: ['M7', 'major 7th', 'maj7'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'interval', semitones: 11 },
  description: 'An interval of 11 semitones.',
  examples: ['Major seventh chord', 'Dreamy maj7 quality'],
  pitchHarmonyCategory: 'interval',
  musicTheoryContext: 'Sharp dissonance, characteristic of jazz harmony',
};

const INTERVAL_OCTAVE: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'octave'),
  lemma: 'octave',
  variants: ['8ve', 'P8', 'perfect octave'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'interval', semitones: 12 },
  description: 'An interval of 12 semitones (one octave).',
  examples: ['Transpose up an octave', 'Octave doubling'],
  pitchHarmonyCategory: 'interval',
  musicTheoryContext: 'Perfect consonance, pitch class equivalence',
};

// =============================================================================
// Scales
// =============================================================================

const SCALE_MAJOR: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'major-scale'),
  lemma: 'major',
  variants: ['major scale', 'ionian', 'diatonic major'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'scale', intervals: [0, 2, 4, 5, 7, 9, 11] },
  description: 'The major scale (W-W-H-W-W-W-H pattern).',
  examples: ['C major scale', 'Change to major', 'Major tonality'],
  pitchHarmonyCategory: 'scale',
  musicTheoryContext: 'Most common scale in Western music, bright quality',
};

const SCALE_MINOR: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'minor-scale'),
  lemma: 'minor',
  variants: ['natural minor', 'minor scale', 'aeolian'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'scale', intervals: [0, 2, 3, 5, 7, 8, 10] },
  description: 'The natural minor scale (W-H-W-W-H-W-W pattern).',
  examples: ['A minor scale', 'Change to minor', 'Minor tonality'],
  pitchHarmonyCategory: 'scale',
  musicTheoryContext: 'Dark, melancholic quality',
};

const SCALE_HARMONIC_MINOR: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'harmonic-minor'),
  lemma: 'harmonic minor',
  variants: ['harmonic minor scale'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'scale', intervals: [0, 2, 3, 5, 7, 8, 11] },
  description: 'Minor scale with raised 7th degree.',
  examples: ['Harmonic minor tonality', 'Exotic harmonic minor sound'],
  pitchHarmonyCategory: 'scale',
  musicTheoryContext: 'Creates leading tone in minor, Middle Eastern flavor',
};

const SCALE_MELODIC_MINOR: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'melodic-minor'),
  lemma: 'melodic minor',
  variants: ['melodic minor scale', 'jazz minor'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'scale', intervals: [0, 2, 3, 5, 7, 9, 11] },
  description: 'Minor scale with raised 6th and 7th degrees.',
  examples: ['Melodic minor jazz', 'Ascending melodic minor'],
  pitchHarmonyCategory: 'scale',
  musicTheoryContext: 'Common in jazz, smooth melodic motion',
};

const SCALE_PENTATONIC_MAJOR: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'pentatonic-major'),
  lemma: 'major pentatonic',
  variants: ['pentatonic', 'major pentatonic scale'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'scale', intervals: [0, 2, 4, 7, 9] },
  description: 'Five-note scale derived from major scale.',
  examples: ['Pentatonic melody', 'Major pentatonic riff'],
  pitchHarmonyCategory: 'scale',
  musicTheoryContext: 'No semitones, universally consonant, common in folk and rock',
};

const SCALE_PENTATONIC_MINOR: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'pentatonic-minor'),
  lemma: 'minor pentatonic',
  variants: ['minor pentatonic scale', 'blues scale base'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'scale', intervals: [0, 3, 5, 7, 10] },
  description: 'Five-note scale derived from minor scale.',
  examples: ['Minor pentatonic solo', 'Rock pentatonic riff'],
  pitchHarmonyCategory: 'scale',
  musicTheoryContext: 'Foundation of blues and rock soloing',
};

const SCALE_BLUES: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'blues-scale'),
  lemma: 'blues',
  variants: ['blues scale', 'blues tonality'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'scale', intervals: [0, 3, 5, 6, 7, 10] },
  description: 'Minor pentatonic with added flat 5th (blue note).',
  examples: ['Blues scale solo', 'Blues tonality', 'Add blues notes'],
  pitchHarmonyCategory: 'scale',
  musicTheoryContext: 'Characteristic of blues and rock, includes "blue note"',
};

const SCALE_CHROMATIC: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'chromatic'),
  lemma: 'chromatic',
  variants: ['chromatic scale', 'twelve-tone'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'scale', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  description: 'All twelve pitches in equal temperament.',
  examples: ['Chromatic run', 'Add chromatic passing tones', 'Chromatic approach'],
  pitchHarmonyCategory: 'scale',
  musicTheoryContext: 'All possible pitches, no tonal center',
};

const SCALE_WHOLE_TONE: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'whole-tone'),
  lemma: 'whole tone',
  variants: ['whole tone scale', 'augmented scale'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'scale', intervals: [0, 2, 4, 6, 8, 10] },
  description: 'Scale of all whole tones, no semitones.',
  examples: ['Whole tone melody', 'Debussy-style harmony'],
  pitchHarmonyCategory: 'scale',
  musicTheoryContext: 'Dreamlike, ambiguous quality, impressionistic',
};

const SCALE_DIMINISHED: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'diminished-scale'),
  lemma: 'diminished',
  variants: ['diminished scale', 'octatonic', 'half-whole'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'scale', intervals: [0, 1, 3, 4, 6, 7, 9, 10] },
  description: 'Eight-note scale alternating half and whole steps.',
  examples: ['Diminished scale tension', 'Octatonic melody'],
  pitchHarmonyCategory: 'scale',
  musicTheoryContext: 'Symmetrical, creates tension, common in bebop',
};

// =============================================================================
// Modes
// =============================================================================

const MODE_DORIAN: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'dorian'),
  lemma: 'dorian',
  variants: ['dorian mode'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'mode', intervals: [0, 2, 3, 5, 7, 9, 10] },
  description: 'Second mode of major scale (minor with raised 6th).',
  examples: ['Dorian groove', 'D dorian', 'Modal dorian feel'],
  pitchHarmonyCategory: 'mode',
  musicTheoryContext: 'Brighter minor sound, common in jazz and funk',
};

const MODE_PHRYGIAN: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'phrygian'),
  lemma: 'phrygian',
  variants: ['phrygian mode'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'mode', intervals: [0, 1, 3, 5, 7, 8, 10] },
  description: 'Third mode of major scale (minor with flat 2nd).',
  examples: ['Phrygian riff', 'Spanish phrygian', 'Dark phrygian sound'],
  pitchHarmonyCategory: 'mode',
  musicTheoryContext: 'Spanish/flamenco flavor, dark exotic sound',
};

const MODE_LYDIAN: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'lydian'),
  lemma: 'lydian',
  variants: ['lydian mode'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'mode', intervals: [0, 2, 4, 6, 7, 9, 11] },
  description: 'Fourth mode of major scale (major with raised 4th).',
  examples: ['Lydian melody', 'Bright lydian sound', 'F lydian'],
  pitchHarmonyCategory: 'mode',
  musicTheoryContext: 'Brightest mode, dreamy quality, film score staple',
};

const MODE_MIXOLYDIAN: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'mixolydian'),
  lemma: 'mixolydian',
  variants: ['mixolydian mode'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'mode', intervals: [0, 2, 4, 5, 7, 9, 10] },
  description: 'Fifth mode of major scale (major with flat 7th).',
  examples: ['Mixolydian groove', 'Blues-rock mixolydian', 'G mixolydian'],
  pitchHarmonyCategory: 'mode',
  musicTheoryContext: 'Rock and folk staple, dominant quality',
};

const MODE_LOCRIAN: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'locrian'),
  lemma: 'locrian',
  variants: ['locrian mode'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'mode', intervals: [0, 1, 3, 5, 6, 8, 10] },
  description: 'Seventh mode of major scale (minor with flat 2nd and flat 5th).',
  examples: ['Locrian tension', 'Diminished locrian', 'Unstable locrian feel'],
  pitchHarmonyCategory: 'mode',
  musicTheoryContext: 'Most unstable mode, rarely used as tonic',
};

// =============================================================================
// Chord Types
// =============================================================================

const CHORD_TRIAD: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'triad'),
  lemma: 'triad',
  variants: ['triads', 'three-note chord'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'chord-type', degrees: [1, 3, 5] },
  description: 'A three-note chord built from root, third, and fifth.',
  examples: ['Major triad', 'Minor triads', 'Simple triad harmony'],
  pitchHarmonyCategory: 'chord-type',
  musicTheoryContext: 'Basic chord structure in tonal music',
};

const CHORD_SEVENTH: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'seventh-chord'),
  lemma: 'seventh',
  variants: ['seventh chord', '7th', 'sevenths'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'chord-type', degrees: [1, 3, 5, 7] },
  description: 'A four-note chord built from root, third, fifth, and seventh.',
  examples: ['Dominant seventh', 'Major seventh chord', 'Add sevenths'],
  pitchHarmonyCategory: 'chord-type',
  musicTheoryContext: 'Adds color and tension to basic triads',
};

const CHORD_NINTH: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'ninth-chord'),
  lemma: 'ninth',
  variants: ['ninth chord', '9th', 'ninths', 'add9'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'chord-type', degrees: [1, 3, 5, 7, 9] },
  description: 'Extended chord with added ninth (second octave up).',
  examples: ['Dominant ninth', 'Add9 chord', 'Jazz ninths'],
  pitchHarmonyCategory: 'chord-type',
  musicTheoryContext: 'Common in jazz and R&B, lush sound',
};

const CHORD_ELEVENTH: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'eleventh-chord'),
  lemma: 'eleventh',
  variants: ['eleventh chord', '11th', 'elevenths', 'add11'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'chord-type', degrees: [1, 3, 5, 7, 9, 11] },
  description: 'Extended chord with added eleventh (fourth octave up).',
  examples: ['Add11 voicing', 'Suspended eleventh', 'Jazz eleventh'],
  pitchHarmonyCategory: 'chord-type',
  musicTheoryContext: 'Quartal harmony influence, modern jazz',
};

const CHORD_THIRTEENTH: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'thirteenth-chord'),
  lemma: 'thirteenth',
  variants: ['thirteenth chord', '13th', 'thirteenths', 'add13'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'chord-type', degrees: [1, 3, 5, 7, 9, 11, 13] },
  description: 'Maximal extended chord with added thirteenth (sixth octave up).',
  examples: ['Dominant 13th', 'Full thirteenth chord', 'Rich 13th harmony'],
  pitchHarmonyCategory: 'chord-type',
  musicTheoryContext: 'Maximum extension in tertian harmony',
};

const CHORD_SUSPENDED: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'suspended'),
  lemma: 'suspended',
  variants: ['sus', 'sus2', 'sus4', 'suspension'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'chord-type', modification: 'suspended-third' },
  description: 'Chord with suspended third (replaced by second or fourth).',
  examples: ['Sus4 chord', 'Suspended harmony', 'Add sus tension'],
  pitchHarmonyCategory: 'chord-type',
  musicTheoryContext: 'Ambiguous quality, neither major nor minor',
};

const CHORD_POWER: PitchHarmonyLexeme = {
  id: createLexemeId('noun', 'power-chord'),
  lemma: 'power chord',
  variants: ['power chords', 'fifth chord', '5'],
  category: 'noun',
  semantics: { type: 'entity', referentType: 'chord-type', degrees: [1, 5] },
  description: 'Two-note chord of root and fifth (no third).',
  examples: ['Rock power chords', 'Distorted power chords', 'Simple fifth chords'],
  pitchHarmonyCategory: 'chord-type',
  musicTheoryContext: 'Rock staple, ambiguous without third',
};

// Export all lexemes as vocabulary table
export const PITCH_HARMONY_LEXEMES: readonly PitchHarmonyLexeme[] = [
  // Pitch classes (13)
  PITCH_NOTE,
  PITCH_C, PITCH_C_SHARP, PITCH_D, PITCH_D_SHARP, PITCH_E, PITCH_F,
  PITCH_F_SHARP, PITCH_G, PITCH_G_SHARP, PITCH_A, PITCH_A_SHARP, PITCH_B,
  
  // Intervals (14)
  INTERVAL_UNISON, INTERVAL_SEMITONE, INTERVAL_WHOLETONE,
  INTERVAL_MINOR_THIRD, INTERVAL_MAJOR_THIRD, INTERVAL_PERFECT_FOURTH,
  INTERVAL_TRITONE, INTERVAL_PERFECT_FIFTH,
  INTERVAL_MINOR_SIXTH, INTERVAL_MAJOR_SIXTH,
  INTERVAL_MINOR_SEVENTH, INTERVAL_MAJOR_SEVENTH, INTERVAL_OCTAVE,
  
  // Scales (10)
  SCALE_MAJOR, SCALE_MINOR, SCALE_HARMONIC_MINOR, SCALE_MELODIC_MINOR,
  SCALE_PENTATONIC_MAJOR, SCALE_PENTATONIC_MINOR, SCALE_BLUES,
  SCALE_CHROMATIC, SCALE_WHOLE_TONE, SCALE_DIMINISHED,
  
  // Modes (6)
  MODE_DORIAN, MODE_PHRYGIAN, MODE_LYDIAN, MODE_MIXOLYDIAN, MODE_LOCRIAN,
  
  // Chord types (7)
  CHORD_TRIAD, CHORD_SEVENTH, CHORD_NINTH, CHORD_ELEVENTH, CHORD_THIRTEENTH,
  CHORD_SUSPENDED, CHORD_POWER,
] as const;

// Helper functions
export function getPitchClassByName(name: string): PitchHarmonyLexeme | undefined {
  return PITCH_HARMONY_LEXEMES.find(
    lex => lex.pitchHarmonyCategory === 'pitch-class' && 
           (lex.lemma.toLowerCase() === name.toLowerCase() || 
            lex.variants.some(v => v.toLowerCase() === name.toLowerCase()))
  );
}

export function getIntervalBySemitones(semitones: number): PitchHarmonyLexeme | undefined {
  return PITCH_HARMONY_LEXEMES.find(
    lex => lex.pitchHarmonyCategory === 'interval' && 
           lex.semantics.type === 'entity' && 
           lex.semantics.semitones === semitones
  );
}

export function getScaleByName(name: string): PitchHarmonyLexeme | undefined {
  return PITCH_HARMONY_LEXEMES.find(
    lex => (lex.pitchHarmonyCategory === 'scale' || lex.pitchHarmonyCategory === 'mode') &&
           (lex.lemma.toLowerCase() === name.toLowerCase() || 
            lex.variants.some(v => v.toLowerCase() === name.toLowerCase()))
  );
}

export function getAllScalesAndModes(): readonly PitchHarmonyLexeme[] {
  return PITCH_HARMONY_LEXEMES.filter(
    lex => lex.pitchHarmonyCategory === 'scale' || lex.pitchHarmonyCategory === 'mode'
  );
}

export function getChordTypeByName(name: string): PitchHarmonyLexeme | undefined {
  return PITCH_HARMONY_LEXEMES.find(
    lex => lex.pitchHarmonyCategory === 'chord-type' &&
           (lex.lemma.toLowerCase() === name.toLowerCase() || 
            lex.variants.some(v => v.toLowerCase() === name.toLowerCase()))
  );
}

/**
 * Vocabulary summary statistics.
 */
export const PITCH_HARMONY_STATS = {
  totalLexemes: PITCH_HARMONY_LEXEMES.length,
  pitchClasses: 13,
  intervals: 14,
  scales: 10,
  modes: 6,
  chordTypes: 7,
} as const;
