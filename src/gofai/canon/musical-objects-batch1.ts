/**
 * GOFAI Lexeme Classes — Musical Objects Batch 1
 *
 * Lexeme classes for musical objects (chords, voicings, intervals,
 * scales, keys, modes) with semantic mappings describing their
 * properties and how they participate in edit operations.
 *
 * Step 122 [NLP][Sem] of gofai_goalA.md — Batch 1 of N
 *
 * @module gofai/canon/musical-objects-batch1
 */

import type { DomainNounLexeme } from './types';

// =============================================================================
// Chord Types and Qualities
// =============================================================================

const MAJOR_CHORD: DomainNounLexeme = {
  id: 'noun:obj:major_chord',
  term: 'major chord',
  variants: ['major', 'maj', 'major triad', 'happy chord', 'bright chord'],
  category: 'musical_object',
  definition:
    'A three-note chord built from root, major third, and perfect fifth. Associated with brightness, stability, and positive affect.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'chord_quality',
    mapping: {
      intervals: ['P1', 'M3', 'P5'],
      affect: 'bright',
      stability: 'stable',
      symbol: 'maj',
    },
  },
  examples: [
    'Change it to a major chord',
    'The chorus should use major chords',
    'Make the harmony brighter with major',
    'Switch from minor to major',
  ],
};

const MINOR_CHORD: DomainNounLexeme = {
  id: 'noun:obj:minor_chord',
  term: 'minor chord',
  variants: ['minor', 'min', 'minor triad', 'sad chord', 'dark chord'],
  category: 'musical_object',
  definition:
    'A three-note chord built from root, minor third, and perfect fifth. Associated with darkness, melancholy, and introspective affect.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'chord_quality',
    mapping: {
      intervals: ['P1', 'm3', 'P5'],
      affect: 'dark',
      stability: 'stable',
      symbol: 'min',
    },
  },
  examples: [
    'Change it to minor',
    'The verse should be in minor',
    'Make the chords darker with minor',
    'Use minor chords throughout',
  ],
};

const SEVENTH_CHORD: DomainNounLexeme = {
  id: 'noun:obj:seventh_chord',
  term: 'seventh chord',
  variants: [
    'seventh',
    '7th chord',
    '7th',
    'dominant seventh',
    'dom7',
    'V7',
  ],
  category: 'musical_object',
  definition:
    'A four-note chord adding a minor seventh to a major triad, creating tension and desire for resolution. The most common seventh chord in tonal music.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'chord_quality',
    mapping: {
      intervals: ['P1', 'M3', 'P5', 'm7'],
      affect: 'tension',
      stability: 'unstable',
      resolution: 'down_fifth',
      symbol: '7',
    },
  },
  examples: [
    'Add a seventh to the chord',
    'Use dominant sevenths',
    'The V7 should resolve to the I',
    'Make the chords jazzy with sevenths',
  ],
};

const MAJOR_SEVENTH: DomainNounLexeme = {
  id: 'noun:obj:major_seventh',
  term: 'major seventh',
  variants: [
    'maj7',
    'major 7th',
    'delta chord',
    'Imaj7',
    'major seventh chord',
  ],
  category: 'musical_object',
  definition:
    'A four-note chord adding a major seventh to a major triad. Sounds lush, dreamy, and sophisticated. Characteristic of jazz, neo-soul, and city pop.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'chord_quality',
    mapping: {
      intervals: ['P1', 'M3', 'P5', 'M7'],
      affect: 'lush',
      stability: 'semi_stable',
      symbol: 'maj7',
    },
  },
  examples: [
    'Use major seventh chords',
    'The Imaj7 should be more prominent',
    'Add maj7 chords for a jazz feel',
    'The major seventh sounds too dreamy here',
  ],
};

const MINOR_SEVENTH: DomainNounLexeme = {
  id: 'noun:obj:minor_seventh',
  term: 'minor seventh',
  variants: [
    'min7',
    'minor 7th',
    'm7',
    'minor seventh chord',
    'ii7',
  ],
  category: 'musical_object',
  definition:
    'A four-note chord adding a minor seventh to a minor triad. Warm, mellow, and versatile. Central to jazz, R&B, and soul.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'chord_quality',
    mapping: {
      intervals: ['P1', 'm3', 'P5', 'm7'],
      affect: 'warm',
      stability: 'semi_stable',
      symbol: 'm7',
    },
  },
  examples: [
    'Use minor seventh chords',
    'The ii-V should use m7',
    'Add min7 for warmth',
    'The minor seventh makes it more soulful',
  ],
};

const DIMINISHED_CHORD: DomainNounLexeme = {
  id: 'noun:obj:diminished',
  term: 'diminished chord',
  variants: [
    'diminished',
    'dim',
    'diminished triad',
    'diminished seventh',
    'dim7',
    'fully diminished',
    'half diminished',
    'ø7',
  ],
  category: 'musical_object',
  definition:
    'A chord built from minor thirds, creating maximum tension and instability. Comes in diminished triad, half-diminished (m7b5), and fully diminished (dim7) forms.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'chord_quality',
    mapping: {
      intervals_triad: ['P1', 'm3', 'd5'],
      intervals_full: ['P1', 'm3', 'd5', 'dd7'],
      affect: 'tense',
      stability: 'very_unstable',
      symbol: 'dim',
    },
  },
  examples: [
    'Use a diminished chord as a passing chord',
    'The dim7 should resolve down',
    'Add a half-diminished chord',
    'The diminished creates nice tension',
  ],
};

const AUGMENTED_CHORD: DomainNounLexeme = {
  id: 'noun:obj:augmented',
  term: 'augmented chord',
  variants: [
    'augmented',
    'aug',
    'augmented triad',
    '+',
    'raised fifth',
    'aug5',
  ],
  category: 'musical_object',
  definition:
    'A chord built from two major thirds (root, major third, augmented fifth), creating a shimmering, ambiguous quality. Common in impressionist and progressive music.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'chord_quality',
    mapping: {
      intervals: ['P1', 'M3', 'A5'],
      affect: 'shimmering',
      stability: 'unstable',
      symbol: 'aug',
    },
  },
  examples: [
    'Use an augmented chord before the resolution',
    'Add an aug chord for color',
    'The augmented fifth creates tension',
    'Pass through an augmented chord',
  ],
};

const SUSPENDED_CHORD: DomainNounLexeme = {
  id: 'noun:obj:suspended',
  term: 'suspended chord',
  variants: [
    'sus chord',
    'sus4',
    'sus2',
    'suspended fourth',
    'suspended second',
    'sus',
  ],
  category: 'musical_object',
  definition:
    'A chord where the third is replaced by a fourth (sus4) or second (sus2), creating an open, ambiguous sound that typically resolves to major or minor.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'chord_quality',
    mapping: {
      intervals_sus4: ['P1', 'P4', 'P5'],
      intervals_sus2: ['P1', 'M2', 'P5'],
      affect: 'open',
      stability: 'wants_resolution',
      symbol: 'sus',
    },
  },
  examples: [
    'Use sus4 chords in the intro',
    'Resolve the sus chord to major',
    'Add suspended chords for openness',
    'The sus2 sounds more modern',
  ],
};

const NINTH_CHORD: DomainNounLexeme = {
  id: 'noun:obj:ninth',
  term: 'ninth chord',
  variants: [
    'ninth',
    '9th chord',
    '9th',
    'add9',
    'dominant ninth',
    'major ninth',
    'minor ninth',
  ],
  category: 'musical_object',
  definition:
    'A five-note chord extending beyond the seventh to include the ninth, adding color and sophistication. Common in jazz, R&B, funk, and neo-soul.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'chord_extension',
    mapping: {
      extension: 9,
      affect: 'colorful',
      genres: ['jazz', 'rnb', 'funk', 'neo_soul'],
      symbol: '9',
    },
  },
  examples: [
    'Use ninth chords for a funky feel',
    'Add the 9th to the chord',
    'The dominant ninth sounds great here',
    'Use add9 for a more open sound',
  ],
};

const ELEVENTH_CHORD: DomainNounLexeme = {
  id: 'noun:obj:eleventh',
  term: 'eleventh chord',
  variants: [
    'eleventh',
    '11th chord',
    '11th',
    'add11',
    'sharp eleven',
    '#11',
  ],
  category: 'musical_object',
  definition:
    'A chord extending to the eleventh, often with the third omitted. The sharp eleventh (Lydian sound) is particularly common in jazz and film scoring.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'chord_extension',
    mapping: {
      extension: 11,
      affect: 'ethereal',
      symbol: '11',
    },
  },
  examples: [
    'Add a sharp eleven to the chord',
    'Use 11th chords for ambiguity',
    'The #11 gives it a Lydian quality',
    'The eleventh chord sounds very open',
  ],
};

const THIRTEENTH_CHORD: DomainNounLexeme = {
  id: 'noun:obj:thirteenth',
  term: 'thirteenth chord',
  variants: [
    'thirteenth',
    '13th chord',
    '13th',
    'dominant thirteenth',
    'full extension',
  ],
  category: 'musical_object',
  definition:
    'The most fully extended tertian chord, including all seven diatonic notes. Rich and complex. Central to jazz big band voicings and sophisticated pop harmony.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'chord_extension',
    mapping: {
      extension: 13,
      affect: 'rich',
      symbol: '13',
    },
  },
  examples: [
    'Use a dominant thirteenth',
    'Add the 13th for richness',
    'The 13th chord is too dense',
    'Voiced as a thirteenth with no eleventh',
  ],
};

const POWER_FIFTH: DomainNounLexeme = {
  id: 'noun:obj:power_fifth',
  term: 'power fifth',
  variants: [
    'fifth',
    'open fifth',
    'bare fifth',
    'root and fifth',
    'dyad',
  ],
  category: 'musical_object',
  definition:
    'A two-note sonority consisting only of root and perfect fifth, with no third to define major/minor quality. Ambiguous, powerful, and clean under distortion.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'chord_quality',
    mapping: {
      intervals: ['P1', 'P5'],
      affect: 'neutral_powerful',
      stability: 'stable',
      symbol: '5',
    },
  },
  examples: [
    'Use open fifths instead of full chords',
    'The bare fifths sound cleaner with distortion',
    'Play just the root and fifth',
    'The dyads should be tighter',
  ],
};

// =============================================================================
// Voicing Types
// =============================================================================

const VOICING: DomainNounLexeme = {
  id: 'noun:obj:voicing',
  term: 'voicing',
  variants: [
    'chord voicing',
    'voice leading',
    'voicings',
    'harmonic voicing',
    'chord spacing',
  ],
  category: 'musical_object',
  definition:
    'The specific arrangement of chord tones across registers and instruments. Determines the sonic character of a chord beyond its abstract quality.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'voicing',
    mapping: {
      affects: ['register', 'spacing', 'color', 'weight'],
      types: ['close', 'open', 'drop2', 'drop3', 'spread', 'cluster'],
    },
  },
  examples: [
    'Open up the voicings',
    'Use drop 2 voicings',
    'The chord voicing is too tight',
    'Spread the voicing across more octaves',
  ],
};

const CLOSE_VOICING: DomainNounLexeme = {
  id: 'noun:obj:close_voicing',
  term: 'close voicing',
  variants: [
    'close position',
    'closed voicing',
    'tight voicing',
    'block chord',
    'locked hands',
  ],
  category: 'musical_object',
  definition:
    'A chord voicing where all notes are within one octave, creating a compact, focused sound. "Locked hands" style in jazz places melody on top of block chords.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'voicing_type',
    mapping: {
      spacing: 'close',
      range: 'within_octave',
      character: 'focused',
    },
  },
  examples: [
    'Use close voicings for the piano',
    'The block chords should be tighter',
    'Play locked-hands style',
    'Close position sounds too dense here',
  ],
};

const OPEN_VOICING: DomainNounLexeme = {
  id: 'noun:obj:open_voicing',
  term: 'open voicing',
  variants: [
    'open position',
    'spread voicing',
    'wide voicing',
    'spaced voicing',
  ],
  category: 'musical_object',
  definition:
    'A chord voicing where notes are spread across more than one octave, creating a spacious, resonant, and transparent sound.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'voicing_type',
    mapping: {
      spacing: 'open',
      range: 'multi_octave',
      character: 'spacious',
    },
  },
  examples: [
    'Open up the voicing',
    'Use spread voicings for the strings',
    'The open position sounds better here',
    'Make the chords wider and more spacious',
  ],
};

const DROP_TWO: DomainNounLexeme = {
  id: 'noun:obj:drop_two',
  term: 'drop 2 voicing',
  variants: [
    'drop 2',
    'drop two',
    'drop-2',
    'drop 2 chord',
  ],
  category: 'musical_object',
  definition:
    'A voicing technique where the second-highest note of a close-position chord is dropped down an octave, creating a practical and sonorous four-part texture widely used in jazz guitar and arranging.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'voicing_technique',
    mapping: {
      technique: 'drop_2',
      drop_voice: 'second_from_top',
      typical_instruments: ['guitar', 'vibraphone', 'piano'],
    },
  },
  examples: [
    'Use drop 2 voicings on the guitar',
    'Revoice as drop 2',
    'The drop-2 chords sound better here',
    'Switch from close to drop 2 position',
  ],
};

const INVERSION: DomainNounLexeme = {
  id: 'noun:obj:inversion',
  term: 'inversion',
  variants: [
    'chord inversion',
    'first inversion',
    'second inversion',
    'third inversion',
    'inverted chord',
    'slash chord',
    'bass note',
  ],
  category: 'musical_object',
  definition:
    'A chord arrangement where a note other than the root is in the bass. First inversion has the third in bass, second has the fifth. Affects smoothness of bass motion.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'voicing_type',
    mapping: {
      types: ['root_position', 'first', 'second', 'third'],
      affects: 'bass_motion_smoothness',
    },
  },
  examples: [
    'Use first inversion for smoother bass',
    'Put the third in the bass',
    'The slash chord should go to C/E',
    'Invert the chord for better voice leading',
  ],
};

// =============================================================================
// Intervals
// =============================================================================

const UNISON: DomainNounLexeme = {
  id: 'noun:obj:unison',
  term: 'unison',
  variants: [
    'in unison',
    'unison part',
    'same pitch',
    'doubling at unison',
  ],
  category: 'musical_object',
  definition: 'Two or more voices sounding the same pitch, creating reinforcement and timbral richness without adding harmonic content.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'interval',
    mapping: {
      interval: 'P1',
      semitones: 0,
      consonance: 'perfect',
    },
  },
  examples: [
    'Play in unison with the melody',
    'The guitars should be in unison',
    'Add unison doubling',
    'Play the theme in unison',
  ],
};

const OCTAVE: DomainNounLexeme = {
  id: 'noun:obj:octave',
  term: 'octave',
  variants: [
    'octaves',
    'octave interval',
    'at the octave',
    'octave doubling',
    '8va',
    '8vb',
  ],
  category: 'musical_object',
  definition:
    'The interval spanning twelve semitones where pitches share the same letter name. Doubling at the octave creates power and fullness without adding harmonic complexity.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'interval',
    mapping: {
      interval: 'P8',
      semitones: 12,
      consonance: 'perfect',
    },
  },
  examples: [
    'Double at the octave',
    'Raise it an octave',
    'Play octaves in the bass',
    'The melody should go up an octave',
  ],
};

const THIRD: DomainNounLexeme = {
  id: 'noun:obj:third',
  term: 'third',
  variants: [
    'thirds',
    'major third',
    'minor third',
    'harmony in thirds',
    'parallel thirds',
  ],
  category: 'musical_object',
  definition:
    'An interval spanning three or four semitones (minor/major third), the fundamental building block of chords and a common harmonization interval.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'interval',
    mapping: {
      types: { major: 4, minor: 3 },
      consonance: 'imperfect',
      harmonization: 'common',
    },
  },
  examples: [
    'Harmonize in thirds',
    'Add a third above the melody',
    'The parallel thirds sound nice',
    'Change the minor third to major',
  ],
};

const FIFTH: DomainNounLexeme = {
  id: 'noun:obj:fifth',
  term: 'fifth',
  variants: [
    'fifths',
    'perfect fifth',
    'parallel fifths',
    'open fifths',
    'power fifth interval',
  ],
  category: 'musical_object',
  definition:
    'An interval of seven semitones, the most consonant interval after the octave and unison. Provides stability and power.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'interval',
    mapping: {
      interval: 'P5',
      semitones: 7,
      consonance: 'perfect',
    },
  },
  examples: [
    'Harmonize in fifths',
    'Add a fifth above',
    'The open fifths sound medieval',
    'Avoid parallel fifths in the voice leading',
  ],
};

const TRITONE: DomainNounLexeme = {
  id: 'noun:obj:tritone',
  term: 'tritone',
  variants: [
    'augmented fourth',
    'diminished fifth',
    'flat five',
    'b5',
    '#4',
    'diabolus in musica',
  ],
  category: 'musical_object',
  definition:
    'The interval of six semitones, dividing the octave exactly in half. The most dissonant interval in tonal music, creating strong tension and desire for resolution.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'interval',
    mapping: {
      interval: 'TT',
      semitones: 6,
      consonance: 'dissonant',
      tension: 'maximum',
    },
  },
  examples: [
    'Use a tritone substitution',
    'The tritone creates tension',
    'Resolve the tritone outward',
    'Add a flat five for color',
  ],
};

// =============================================================================
// Scales and Modes
// =============================================================================

const MAJOR_SCALE: DomainNounLexeme = {
  id: 'noun:obj:major_scale',
  term: 'major scale',
  variants: [
    'major key',
    'Ionian mode',
    'Ionian',
    'diatonic major',
    'major tonality',
  ],
  category: 'musical_object',
  definition:
    'The seven-note scale with whole and half step pattern W-W-H-W-W-W-H. The foundation of Western tonal harmony, associated with brightness and stability.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'scale',
    mapping: {
      intervals: ['W', 'W', 'H', 'W', 'W', 'W', 'H'],
      mode_number: 1,
      affect: 'bright_stable',
    },
  },
  examples: [
    'Keep it in the major scale',
    'Use the major key',
    'Stay in Ionian',
    'The melody uses the major scale',
  ],
};

const MINOR_SCALE: DomainNounLexeme = {
  id: 'noun:obj:minor_scale',
  term: 'minor scale',
  variants: [
    'natural minor',
    'Aeolian mode',
    'Aeolian',
    'minor key',
    'minor tonality',
    'relative minor',
  ],
  category: 'musical_object',
  definition:
    'The seven-note scale with pattern W-H-W-W-H-W-W. Associated with darkness, sadness, and introspection in Western music.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'scale',
    mapping: {
      intervals: ['W', 'H', 'W', 'W', 'H', 'W', 'W'],
      mode_number: 6,
      affect: 'dark_melancholy',
    },
  },
  examples: [
    'Switch to the minor scale',
    'Use natural minor',
    'The verse should be in minor',
    'Stay in Aeolian mode',
  ],
};

const HARMONIC_MINOR: DomainNounLexeme = {
  id: 'noun:obj:harmonic_minor',
  term: 'harmonic minor',
  variants: [
    'harmonic minor scale',
    'raised seventh minor',
    'minor with leading tone',
  ],
  category: 'musical_object',
  definition:
    'A minor scale with a raised seventh degree creating a leading tone for stronger harmonic resolution. The augmented second between 6 and 7 gives it an "exotic" character.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'scale',
    mapping: {
      intervals: ['W', 'H', 'W', 'W', 'H', 'A2', 'H'],
      affect: 'dramatic_exotic',
      characteristic: 'augmented_second',
    },
  },
  examples: [
    'Use harmonic minor',
    'The raised seventh gives it that sound',
    'Switch to harmonic minor for the cadence',
    'The harmonic minor scale fits here',
  ],
};

const MELODIC_MINOR: DomainNounLexeme = {
  id: 'noun:obj:melodic_minor',
  term: 'melodic minor',
  variants: [
    'melodic minor scale',
    'jazz minor',
    'ascending melodic minor',
    'real melodic minor',
  ],
  category: 'musical_object',
  definition:
    'A minor scale with raised sixth and seventh degrees (ascending form). In jazz, used in both directions. Source of many important jazz scales (altered, Lydian dominant, etc.).',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'scale',
    mapping: {
      intervals: ['W', 'H', 'W', 'W', 'W', 'W', 'H'],
      affect: 'sophisticated',
      jazz_name: 'jazz_minor',
    },
  },
  examples: [
    'Use melodic minor',
    'Play jazz minor over the chord',
    'The melodic minor ascending sounds smoother',
    'Use the altered scale (from melodic minor)',
  ],
};

const PENTATONIC: DomainNounLexeme = {
  id: 'noun:obj:pentatonic',
  term: 'pentatonic scale',
  variants: [
    'pentatonic',
    'major pentatonic',
    'minor pentatonic',
    'five-note scale',
    'penta',
    'blues scale',
  ],
  category: 'musical_object',
  definition:
    'A five-note scale found in music worldwide. Major pentatonic (1-2-3-5-6) sounds bright and folk-like; minor pentatonic (1-b3-4-5-b7) is the foundation of blues and rock.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'scale',
    mapping: {
      notes: 5,
      types: ['major_pentatonic', 'minor_pentatonic'],
      traditions: ['blues', 'rock', 'folk', 'chinese', 'japanese', 'celtic', 'african'],
    },
  },
  examples: [
    'Use the pentatonic scale',
    'Stay pentatonic for the solo',
    'The minor pentatonic fits the blues feel',
    'The melody is mostly pentatonic',
  ],
};

const DORIAN: DomainNounLexeme = {
  id: 'noun:obj:dorian',
  term: 'Dorian mode',
  variants: [
    'Dorian',
    'Dorian scale',
    'second mode',
    'Dorian minor',
  ],
  category: 'musical_object',
  definition:
    'A minor mode with a raised sixth degree, brighter than natural minor. Characteristic of funk, fusion, folk, and modal jazz.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'mode',
    mapping: {
      mode_number: 2,
      affect: 'minor_but_brighter',
      genres: ['funk', 'fusion', 'folk', 'modal_jazz'],
    },
  },
  examples: [
    'Use Dorian mode',
    'The solo should be Dorian',
    'Dorian gives it that funky minor feel',
    'Switch from Aeolian to Dorian',
  ],
};

const MIXOLYDIAN: DomainNounLexeme = {
  id: 'noun:obj:mixolydian',
  term: 'Mixolydian mode',
  variants: [
    'Mixolydian',
    'Mixolydian scale',
    'fifth mode',
    'dominant mode',
  ],
  category: 'musical_object',
  definition:
    'A major mode with a lowered seventh degree, creating a bluesy, rock-oriented major sound. The mode of dominant seventh chords.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'mode',
    mapping: {
      mode_number: 5,
      affect: 'major_but_bluesy',
      genres: ['rock', 'blues', 'celtic', 'country'],
    },
  },
  examples: [
    'Use Mixolydian mode',
    'The riff is Mixolydian',
    'Mixolydian gives it that classic rock sound',
    'Use the dominant scale for the solo',
  ],
};

const LYDIAN: DomainNounLexeme = {
  id: 'noun:obj:lydian',
  term: 'Lydian mode',
  variants: [
    'Lydian',
    'Lydian scale',
    'fourth mode',
    'raised fourth mode',
  ],
  category: 'musical_object',
  definition:
    'A major mode with a raised fourth degree, creating a bright, ethereal, floating quality. Characteristic of film scoring, prog rock, and jazz.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'mode',
    mapping: {
      mode_number: 4,
      affect: 'bright_ethereal',
      genres: ['film_scoring', 'prog_rock', 'jazz'],
    },
  },
  examples: [
    'Use Lydian mode for a dreamy feel',
    'The raised fourth gives it that Lydian sound',
    'Switch to Lydian for the intro',
    'Lydian mode sounds more hopeful',
  ],
};

const PHRYGIAN: DomainNounLexeme = {
  id: 'noun:obj:phrygian',
  term: 'Phrygian mode',
  variants: [
    'Phrygian',
    'Phrygian scale',
    'third mode',
    'Phrygian dominant',
    'Spanish Phrygian',
  ],
  category: 'musical_object',
  definition:
    'A minor mode with a lowered second degree, creating a dark, exotic, Spanish/Middle Eastern sound. Phrygian dominant (with major third) is even more characteristic.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'mode',
    mapping: {
      mode_number: 3,
      affect: 'dark_exotic',
      genres: ['flamenco', 'metal', 'middle_eastern'],
    },
  },
  examples: [
    'Use Phrygian mode',
    'The Phrygian b2 gives it that Spanish flavor',
    'Switch to Phrygian dominant',
    'The dark Phrygian sound fits the metal section',
  ],
};

const WHOLE_TONE: DomainNounLexeme = {
  id: 'noun:obj:whole_tone',
  term: 'whole tone scale',
  variants: [
    'whole tone',
    'whole-tone scale',
    'augmented scale',
    'Debussy scale',
  ],
  category: 'musical_object',
  definition:
    'A six-note scale consisting entirely of whole steps, creating a dreamlike, ambiguous quality with no clear tonal center. Associated with Debussy and impressionism.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'scale',
    mapping: {
      notes: 6,
      intervals: ['W', 'W', 'W', 'W', 'W', 'W'],
      affect: 'dreamlike_ambiguous',
      tradition: 'impressionist',
    },
  },
  examples: [
    'Use the whole tone scale for a dreamy effect',
    'The whole tone run sounds impressionistic',
    'Add whole tone passages for color',
    'The augmented scale creates ambiguity',
  ],
};

const CHROMATIC: DomainNounLexeme = {
  id: 'noun:obj:chromatic',
  term: 'chromatic scale',
  variants: [
    'chromatic',
    'chromatic passage',
    'chromaticism',
    'chromatic run',
    'all twelve notes',
  ],
  category: 'musical_object',
  definition:
    'The twelve-note scale using all semitones. Chromatic passages create tension, color, and forward motion. Chromatic harmony uses chords outside the diatonic set.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'scale',
    mapping: {
      notes: 12,
      affect: 'tense_colorful',
      usage: ['passing_tones', 'approach_notes', 'chromatic_harmony'],
    },
  },
  examples: [
    'Add a chromatic run',
    'Use more chromaticism',
    'The chromatic passage builds tension',
    'Add chromatic approach notes',
  ],
};

// =============================================================================
// Export — All musical object lexemes from this batch
// =============================================================================

export const MUSICAL_OBJECT_LEXEMES_BATCH1: readonly DomainNounLexeme[] = [
  // Chord types
  MAJOR_CHORD,
  MINOR_CHORD,
  SEVENTH_CHORD,
  MAJOR_SEVENTH,
  MINOR_SEVENTH,
  DIMINISHED_CHORD,
  AUGMENTED_CHORD,
  SUSPENDED_CHORD,
  NINTH_CHORD,
  ELEVENTH_CHORD,
  THIRTEENTH_CHORD,
  POWER_FIFTH,
  // Voicing types
  VOICING,
  CLOSE_VOICING,
  OPEN_VOICING,
  DROP_TWO,
  INVERSION,
  // Intervals
  UNISON,
  OCTAVE,
  THIRD,
  FIFTH,
  TRITONE,
  // Scales and modes
  MAJOR_SCALE,
  MINOR_SCALE,
  HARMONIC_MINOR,
  MELODIC_MINOR,
  PENTATONIC,
  DORIAN,
  MIXOLYDIAN,
  LYDIAN,
  PHRYGIAN,
  WHOLE_TONE,
  CHROMATIC,
];

export default MUSICAL_OBJECT_LEXEMES_BATCH1;

/**
 * Statistics for this batch.
 */
export function getMusicalObjectBatch1Stats(): {
  total: number;
  categories: Record<string, number>;
  totalVariants: number;
} {
  const categories: Record<string, number> = {};
  let totalVariants = 0;

  for (const lexeme of MUSICAL_OBJECT_LEXEMES_BATCH1) {
    categories[lexeme.category] = (categories[lexeme.category] ?? 0) + 1;
    totalVariants += lexeme.variants.length;
  }

  return {
    total: MUSICAL_OBJECT_LEXEMES_BATCH1.length,
    categories,
    totalVariants,
  };
}
