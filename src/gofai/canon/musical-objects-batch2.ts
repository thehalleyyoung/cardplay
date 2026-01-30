/**
 * GOFAI Lexeme Classes — Musical Objects Batch 2
 *
 * Lexeme classes for musical objects covering rhythm, groove,
 * density, register, dynamics, articulation, form, and texture
 * with semantic mappings.
 *
 * Step 122 [NLP][Sem] of gofai_goalA.md — Batch 2 of N
 *
 * @module gofai/canon/musical-objects-batch2
 */

import type { DomainNounLexeme } from './types';

// =============================================================================
// Rhythm and Time Objects
// =============================================================================

const BEAT: DomainNounLexeme = {
  id: 'noun:obj:beat',
  term: 'beat',
  variants: ['beats', 'pulse', 'rhythmic pulse', 'tactus', 'metric beat'],
  category: 'musical_object',
  definition:
    'The basic unit of musical time that listeners tap or nod to. The regular pulse underlying a piece of music, organized into measures.',
  semantics: {
    type: 'concept',
    domain: 'rhythm',
    aspect: 'time_unit',
    mapping: {
      level: 'tactus',
      metric_role: 'pulse',
      subdivisions: ['half', 'quarter', 'eighth', 'sixteenth', 'triplet'],
    },
  },
  examples: [
    'Put the accent on beat 3',
    'The pulse should be steadier',
    'Subdivide the beat into triplets',
    'The beat is too stiff',
  ],
};

const DOWNBEAT: DomainNounLexeme = {
  id: 'noun:obj:downbeat',
  term: 'downbeat',
  variants: ['downbeats', 'beat one', 'strong beat', 'thesis'],
  category: 'musical_object',
  definition:
    'The first and strongest beat of a measure, providing the primary rhythmic anchor. In 4/4 time, beats 1 and 3 are typically strong.',
  semantics: {
    type: 'concept',
    domain: 'rhythm',
    aspect: 'metric_position',
    mapping: {
      position: 'first_beat',
      strength: 'strong',
      function: 'metric_anchor',
    },
  },
  examples: [
    'Accent the downbeat',
    'The kick should hit on every downbeat',
    'Anticipate the downbeat',
    'The downbeats need more weight',
  ],
};

const OFFBEAT: DomainNounLexeme = {
  id: 'noun:obj:offbeat',
  term: 'offbeat',
  variants: [
    'offbeats',
    'upbeat',
    'and',
    'weak beat',
    'backbeat',
    'arsis',
  ],
  category: 'musical_object',
  definition:
    'Beats or subdivisions between the main pulse positions. Offbeat emphasis creates groove, swing, and genre-specific feels (reggae skank, funk, etc.).',
  semantics: {
    type: 'concept',
    domain: 'rhythm',
    aspect: 'metric_position',
    mapping: {
      position: 'between_beats',
      strength: 'weak',
      function: 'groove_generator',
    },
  },
  examples: [
    'Put the hats on the offbeats',
    'Emphasize the upbeat',
    'The backbeat should crack more',
    'The offbeat chords give it a reggae feel',
  ],
};

const SYNCOPATION: DomainNounLexeme = {
  id: 'noun:obj:syncopation',
  term: 'syncopation',
  variants: [
    'syncopated',
    'syncopated rhythm',
    'off-the-grid',
    'displaced accent',
    'anticipated beat',
  ],
  category: 'musical_object',
  definition:
    'Rhythmic displacement that places accents on normally weak beats or between beats, creating forward momentum and rhythmic interest.',
  semantics: {
    type: 'concept',
    domain: 'rhythm',
    aspect: 'rhythmic_technique',
    mapping: {
      effect: 'accent_displacement',
      creates: ['momentum', 'groove', 'interest'],
      genres: ['funk', 'jazz', 'latin', 'hip_hop'],
    },
  },
  examples: [
    'Add more syncopation',
    'The rhythm needs syncopation',
    'Make the bass more syncopated',
    'The syncopated pattern is too complex',
  ],
};

const SWING: DomainNounLexeme = {
  id: 'noun:obj:swing',
  term: 'swing',
  variants: [
    'swing feel',
    'shuffle',
    'swing rhythm',
    'triplet feel',
    'swung eighths',
    'swing percentage',
  ],
  category: 'musical_object',
  definition:
    'A rhythmic feel where pairs of notes are played with unequal durations (long-short), creating a bouncing, lilting quality. Central to jazz, blues, and shuffle grooves.',
  semantics: {
    type: 'concept',
    domain: 'rhythm',
    aspect: 'feel',
    mapping: {
      technique: 'unequal_subdivision',
      range: ['straight', 'light_swing', 'medium_swing', 'hard_swing', 'shuffle'],
      genres: ['jazz', 'blues', 'swing', 'shuffle'],
    },
  },
  examples: [
    'Add swing to the groove',
    'The hi-hats should have more shuffle',
    'Make it straight instead of swung',
    'The swing feel should be lighter',
  ],
};

const POLYRHYTHM: DomainNounLexeme = {
  id: 'noun:obj:polyrhythm',
  term: 'polyrhythm',
  variants: [
    'polyrhythmic',
    'cross-rhythm',
    'polymeter',
    'metric modulation',
    'hemiola',
    'three against two',
    'four against three',
  ],
  category: 'musical_object',
  definition:
    'The simultaneous use of contrasting rhythmic patterns (e.g., 3 against 2, 4 against 3). Creates complexity and tension. Central to African, Indian, and progressive music.',
  semantics: {
    type: 'concept',
    domain: 'rhythm',
    aspect: 'rhythmic_complexity',
    mapping: {
      technique: 'simultaneous_contrasting_meters',
      common: ['3:2', '4:3', '5:4', '7:4'],
      traditions: ['african', 'indian', 'progressive', 'minimalist'],
    },
  },
  examples: [
    'Add a 3-against-2 polyrhythm',
    'The cross-rhythm between hands creates tension',
    'Use hemiola in the transition',
    'The polyrhythmic pattern is too complex',
  ],
};

const GHOST_NOTE: DomainNounLexeme = {
  id: 'noun:obj:ghost_note',
  term: 'ghost note',
  variants: [
    'ghost notes',
    'grace note',
    'dead note',
    'muted note',
    'ghost stroke',
    'subtle note',
  ],
  category: 'musical_object',
  definition:
    'A very quiet, almost inaudible note played between main beats that adds rhythmic texture and groove without melodic emphasis. Essential to funk and jazz drumming.',
  semantics: {
    type: 'concept',
    domain: 'rhythm',
    aspect: 'ornamental_rhythm',
    mapping: {
      dynamics: 'very_soft',
      function: 'groove_texture',
      genres: ['funk', 'jazz', 'r_and_b'],
    },
  },
  examples: [
    'Add ghost notes on the snare',
    'The ghost notes make it groovier',
    'More subtle ghost strokes',
    'The dead notes on guitar add feel',
  ],
};

const TIME_SIGNATURE: DomainNounLexeme = {
  id: 'noun:obj:time_signature',
  term: 'time signature',
  variants: [
    'meter',
    'time',
    'common time',
    '4/4',
    '3/4',
    '6/8',
    '5/4',
    '7/8',
    'odd meter',
    'compound meter',
  ],
  category: 'musical_object',
  definition:
    'The notational convention specifying how many beats per measure and which note value gets one beat. Determines the basic metric framework.',
  semantics: {
    type: 'concept',
    domain: 'rhythm',
    aspect: 'metric_framework',
    mapping: {
      common: { '4/4': 'common_time', '3/4': 'waltz', '6/8': 'compound_duple' },
      odd: ['5/4', '7/8', '11/8', '13/8'],
    },
  },
  examples: [
    'Change to 3/4 time',
    'Use 7/8 for this section',
    'Stay in common time',
    'The odd meter gives it a progressive feel',
  ],
};

const TEMPO: DomainNounLexeme = {
  id: 'noun:obj:tempo',
  term: 'tempo',
  variants: [
    'BPM',
    'beats per minute',
    'speed',
    'pace',
    'tempo marking',
  ],
  category: 'musical_object',
  definition:
    'The speed of the music measured in beats per minute (BPM). A fundamental attribute that determines energy level and genre appropriateness.',
  semantics: {
    type: 'entity',
    entityType: 'param',
    role: 'tempo',
    mapping: {
      unit: 'bpm',
      ranges: {
        slow: [60, 80],
        moderate: [80, 120],
        fast: [120, 160],
        very_fast: [160, 200],
      },
    },
  },
  examples: [
    'Increase the tempo',
    'Set the BPM to 128',
    'The pace should be faster',
    'Slow down the tempo for the bridge',
  ],
};

// =============================================================================
// Density and Register Objects
// =============================================================================

const DENSITY: DomainNounLexeme = {
  id: 'noun:obj:density',
  term: 'density',
  variants: [
    'arrangement density',
    'textural density',
    'thickness',
    'fullness',
    'sparseness',
    'busy-ness',
  ],
  category: 'musical_object',
  definition:
    'The number of simultaneous musical elements and the amount of activity at any given moment. Dense arrangements sound full and powerful; sparse ones feel open and intimate.',
  semantics: {
    type: 'concept',
    domain: 'arrangement',
    aspect: 'density',
    mapping: {
      axis: 'density',
      poles: ['sparse', 'dense'],
      affects: ['perceived_energy', 'clarity', 'weight'],
    },
  },
  examples: [
    'Reduce the density in the verse',
    'Make the chorus denser',
    'The arrangement is too thick',
    'Add more fullness to the mix',
  ],
};

const REGISTER: DomainNounLexeme = {
  id: 'noun:obj:register',
  term: 'register',
  variants: [
    'pitch register',
    'tessitura',
    'range',
    'pitch range',
    'high register',
    'low register',
    'mid register',
  ],
  category: 'musical_object',
  definition:
    'The vertical pitch location of a musical part or passage. Low register sounds warm/heavy, mid register is centered, high register sounds bright/thin.',
  semantics: {
    type: 'concept',
    domain: 'arrangement',
    aspect: 'register',
    mapping: {
      axis: 'register',
      regions: ['sub_bass', 'bass', 'low_mid', 'mid', 'upper_mid', 'high', 'very_high'],
      affect_mapping: {
        low: 'warm_heavy',
        mid: 'centered',
        high: 'bright_thin',
      },
    },
  },
  examples: [
    'Move it to a higher register',
    'The melody is in a comfortable tessitura',
    'Drop the register for warmth',
    'The register is too high for the instrument',
  ],
};

const RANGE: DomainNounLexeme = {
  id: 'noun:obj:range',
  term: 'range',
  variants: [
    'melodic range',
    'pitch span',
    'compass',
    'ambitus',
    'vocal range',
    'instrument range',
  ],
  category: 'musical_object',
  definition:
    'The distance between the highest and lowest notes used in a part or passage. Wide range creates drama; narrow range creates focus.',
  semantics: {
    type: 'concept',
    domain: 'arrangement',
    aspect: 'range',
    mapping: {
      measurement: 'interval_span',
      types: ['narrow', 'moderate', 'wide', 'extreme'],
    },
  },
  examples: [
    'The melody has too wide a range',
    'Narrow the range for the verse',
    'Expand the vocal range in the chorus',
    'The compass should stay within an octave',
  ],
};

// =============================================================================
// Dynamics Objects
// =============================================================================

const DYNAMICS: DomainNounLexeme = {
  id: 'noun:obj:dynamics',
  term: 'dynamics',
  variants: [
    'dynamic range',
    'volume',
    'loudness',
    'level',
    'dynamic contrast',
    'dynamic shape',
  ],
  category: 'musical_object',
  definition:
    'The relative loudness or softness of music and how it changes over time. Dynamic contrast is essential for emotional impact and musical shape.',
  semantics: {
    type: 'concept',
    domain: 'performance',
    aspect: 'dynamics',
    mapping: {
      levels: ['ppp', 'pp', 'p', 'mp', 'mf', 'f', 'ff', 'fff'],
      changes: ['crescendo', 'decrescendo', 'sforzando', 'subito'],
    },
  },
  examples: [
    'Add more dynamics',
    'The dynamic range is too flat',
    'Make the chorus louder',
    'Add a crescendo into the chorus',
  ],
};

const CRESCENDO: DomainNounLexeme = {
  id: 'noun:obj:crescendo',
  term: 'crescendo',
  variants: [
    'crescendo',
    'getting louder',
    'building volume',
    'swell',
    'dynamic build',
    'cresc.',
  ],
  category: 'musical_object',
  definition:
    'A gradual increase in loudness, creating forward momentum and building tension or excitement toward a climactic point.',
  semantics: {
    type: 'concept',
    domain: 'performance',
    aspect: 'dynamic_change',
    mapping: {
      direction: 'increase',
      rate: 'gradual',
      effect: 'tension_building',
    },
  },
  examples: [
    'Add a crescendo before the chorus',
    'The swell should be longer',
    'Build the volume gradually',
    'The crescendo is too abrupt',
  ],
};

const DECRESCENDO: DomainNounLexeme = {
  id: 'noun:obj:decrescendo',
  term: 'decrescendo',
  variants: [
    'diminuendo',
    'getting softer',
    'fading',
    'dying away',
    'decresc.',
    'dim.',
  ],
  category: 'musical_object',
  definition:
    'A gradual decrease in loudness, creating release, calm, or transition. Can signal the end of a phrase, section, or the entire piece.',
  semantics: {
    type: 'concept',
    domain: 'performance',
    aspect: 'dynamic_change',
    mapping: {
      direction: 'decrease',
      rate: 'gradual',
      effect: 'tension_release',
    },
  },
  examples: [
    'Add a decrescendo at the end',
    'The diminuendo should be more gradual',
    'Let it die away naturally',
    'Fade the dynamics through the transition',
  ],
};

const ACCENT: DomainNounLexeme = {
  id: 'noun:obj:accent',
  term: 'accent',
  variants: [
    'accents',
    'accent pattern',
    'emphasis',
    'stressed note',
    'sforzando',
    'sfz',
    'fp',
  ],
  category: 'musical_object',
  definition:
    'A sudden emphasis on a specific note or beat, created by increased velocity, articulation change, or dynamic marking. Shapes rhythmic feel and musical phrasing.',
  semantics: {
    type: 'concept',
    domain: 'performance',
    aspect: 'emphasis',
    mapping: {
      types: ['dynamic', 'agogic', 'tonic', 'sforzando'],
      function: 'rhythmic_shaping',
    },
  },
  examples: [
    'Add accents on beats 2 and 4',
    'The sforzando should be stronger',
    'Accent the first note of each phrase',
    'The accent pattern defines the groove',
  ],
};

// =============================================================================
// Articulation Objects
// =============================================================================

const LEGATO_OBJ: DomainNounLexeme = {
  id: 'noun:obj:legato',
  term: 'legato',
  variants: [
    'smooth',
    'connected notes',
    'flowing',
    'sustained',
    'legato style',
  ],
  category: 'musical_object',
  definition:
    'A smooth, connected manner of playing where notes overlap or transition without gaps. Creates flowing, singing musical lines.',
  semantics: {
    type: 'concept',
    domain: 'performance',
    aspect: 'articulation',
    mapping: {
      note_connection: 'overlapping',
      character: 'smooth',
      opposite: 'staccato',
    },
  },
  examples: [
    'Play it more legato',
    'The melody should flow more smoothly',
    'Use legato phrasing',
    'Connect the notes more',
  ],
};

const STACCATO_OBJ: DomainNounLexeme = {
  id: 'noun:obj:staccato',
  term: 'staccato',
  variants: [
    'short notes',
    'detached',
    'choppy',
    'clipped',
    'staccato style',
  ],
  category: 'musical_object',
  definition:
    'A detached manner of playing where notes are shortened with space between them. Creates rhythmic precision and percussive character.',
  semantics: {
    type: 'concept',
    domain: 'performance',
    aspect: 'articulation',
    mapping: {
      note_connection: 'separated',
      character: 'detached',
      opposite: 'legato',
    },
  },
  examples: [
    'Make the strings more staccato',
    'The notes should be shorter and detached',
    'Use staccato articulation',
    'The choppy notes add rhythmic interest',
  ],
};

const VIBRATO: DomainNounLexeme = {
  id: 'noun:obj:vibrato',
  term: 'vibrato',
  variants: [
    'vibrato',
    'pitch vibrato',
    'amplitude vibrato',
    'tremolo',
    'wobble',
    'vib',
  ],
  category: 'musical_object',
  definition:
    'A regular, slight fluctuation in pitch (or amplitude) that adds warmth and expressiveness to sustained notes. Rate and depth vary by style and tradition.',
  semantics: {
    type: 'concept',
    domain: 'performance',
    aspect: 'ornament',
    mapping: {
      parameters: ['rate', 'depth', 'onset_delay'],
      types: ['pitch', 'amplitude'],
      traditions: ['classical', 'jazz', 'pop', 'indian'],
    },
  },
  examples: [
    'Add more vibrato to the vocal',
    'The vibrato is too fast',
    'Use wider vibrato on the sustained notes',
    'The tremolo should be subtle',
  ],
};

const GLISSANDO: DomainNounLexeme = {
  id: 'noun:obj:glissando',
  term: 'glissando',
  variants: [
    'gliss',
    'slide',
    'portamento',
    'pitch slide',
    'scoop',
    'fall',
    'bend',
  ],
  category: 'musical_object',
  definition:
    'A continuous slide between two pitches, either through all intermediate pitches (true glissando) or smooth pitch transition (portamento).',
  semantics: {
    type: 'concept',
    domain: 'performance',
    aspect: 'ornament',
    mapping: {
      types: ['glissando', 'portamento', 'scoop', 'fall', 'bend'],
      direction: ['up', 'down'],
    },
  },
  examples: [
    'Add a glissando into the note',
    'Slide up to the high note',
    'The portamento should be smoother',
    'Add a scoop before the phrase',
  ],
};

const TRILL: DomainNounLexeme = {
  id: 'noun:obj:trill',
  term: 'trill',
  variants: [
    'trills',
    'trill ornament',
    'shake',
    'mordent',
    'turn',
    'gruppetto',
    'ornament',
  ],
  category: 'musical_object',
  definition:
    'A rapid alternation between two adjacent pitches, used as melodic ornamentation. Trills, mordents, turns, and other ornaments add Baroque and classical elegance.',
  semantics: {
    type: 'concept',
    domain: 'performance',
    aspect: 'ornament',
    mapping: {
      types: ['trill', 'mordent', 'inverted_mordent', 'turn', 'gruppetto'],
      speed: ['slow', 'moderate', 'fast'],
    },
  },
  examples: [
    'Add a trill on the long notes',
    'The mordent should be quicker',
    'Use turns as ornaments',
    'The trills add Baroque character',
  ],
};

// =============================================================================
// Form and Structure Objects
// =============================================================================

const PHRASE: DomainNounLexeme = {
  id: 'noun:obj:phrase',
  term: 'phrase',
  variants: [
    'musical phrase',
    'melodic phrase',
    'phrasing',
    'sentence',
    'period',
    'phrase group',
  ],
  category: 'musical_object',
  definition:
    'A coherent musical thought analogous to a sentence in language, typically 4-8 bars, with a beginning, climax, and cadence.',
  semantics: {
    type: 'concept',
    domain: 'form',
    aspect: 'phrase_structure',
    mapping: {
      typical_length: { bars: [2, 4, 8] },
      parts: ['antecedent', 'consequent'],
      boundary: 'cadence',
    },
  },
  examples: [
    'The phrase should breathe more',
    'Shape the phrasing naturally',
    'The musical phrase is too long',
    'Add a breath between phrases',
  ],
};

const CADENCE: DomainNounLexeme = {
  id: 'noun:obj:cadence',
  term: 'cadence',
  variants: [
    'cadence point',
    'resolution',
    'ending',
    'perfect cadence',
    'half cadence',
    'deceptive cadence',
    'plagal cadence',
  ],
  category: 'musical_object',
  definition:
    'A harmonic/melodic formula that marks the end of a phrase, section, or piece. Different cadence types create different degrees of finality or surprise.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'cadence',
    mapping: {
      types: {
        perfect: 'V-I',
        half: 'X-V',
        plagal: 'IV-I',
        deceptive: 'V-vi',
        interrupted: 'V-other',
      },
      finality: ['conclusive', 'inconclusive', 'surprising'],
    },
  },
  examples: [
    'Use a perfect cadence at the end',
    'Add a deceptive cadence for surprise',
    'The half cadence keeps it open',
    'Resolve with a plagal cadence',
  ],
};

const MOTIF: DomainNounLexeme = {
  id: 'noun:obj:motif',
  term: 'motif',
  variants: [
    'motive',
    'motivic cell',
    'thematic fragment',
    'melodic cell',
    'rhythmic motif',
    'kernel',
  ],
  category: 'musical_object',
  definition:
    'The smallest identifiable musical idea — a short rhythmic, melodic, or harmonic fragment that can be developed through repetition, transposition, inversion, augmentation, etc.',
  semantics: {
    type: 'concept',
    domain: 'form',
    aspect: 'thematic_unit',
    mapping: {
      size: 'smallest_identifiable',
      development_techniques: [
        'repetition', 'sequence', 'transposition', 'inversion',
        'augmentation', 'diminution', 'fragmentation',
      ],
    },
  },
  examples: [
    'Develop the motif through the section',
    'The rhythmic motif is the seed of the piece',
    'Invert the motif for contrast',
    'Fragment the motif as it develops',
  ],
};

const SEQUENCE: DomainNounLexeme = {
  id: 'noun:obj:sequence',
  term: 'sequence',
  variants: [
    'melodic sequence',
    'harmonic sequence',
    'sequential pattern',
    'rising sequence',
    'falling sequence',
  ],
  category: 'musical_object',
  definition:
    'A musical pattern repeated at successively higher or lower pitch levels, creating directional momentum and formal expansion.',
  semantics: {
    type: 'concept',
    domain: 'form',
    aspect: 'development_technique',
    mapping: {
      types: ['real', 'tonal', 'modified'],
      directions: ['ascending', 'descending'],
      interval: 'variable',
    },
  },
  examples: [
    'Add a rising sequence',
    'The melodic sequence should descend by steps',
    'Use a harmonic sequence to build tension',
    'The sequential pattern is too predictable',
  ],
};

const MODULATION: DomainNounLexeme = {
  id: 'noun:obj:modulation',
  term: 'modulation',
  variants: [
    'key change',
    'modulate',
    'tonicization',
    'shift key',
    'change key',
    'pivot chord',
  ],
  category: 'musical_object',
  definition:
    'A change from one key to another within a piece, creating harmonic variety and emotional shift. Methods include pivot chord, chromatic, and direct modulation.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'key_change',
    mapping: {
      types: ['pivot_chord', 'chromatic', 'direct', 'enharmonic', 'common_tone'],
      common_targets: ['relative', 'parallel', 'dominant', 'up_half_step'],
    },
  },
  examples: [
    'Modulate up a half step for the last chorus',
    'Use a pivot chord modulation',
    'The key change is too abrupt',
    'Tonicize the relative major briefly',
  ],
};

// =============================================================================
// Texture Objects
// =============================================================================

const MONOPHONY: DomainNounLexeme = {
  id: 'noun:obj:monophony',
  term: 'monophony',
  variants: [
    'monophonic',
    'single voice',
    'unison melody',
    'unaccompanied melody',
    'one voice',
  ],
  category: 'musical_object',
  definition:
    'A musical texture consisting of a single melodic line without harmony or accompaniment. The simplest texture, found in chant, folk, and solo performance.',
  semantics: {
    type: 'concept',
    domain: 'texture',
    aspect: 'textural_type',
    mapping: {
      voices: 1,
      complexity: 'minimal',
      traditions: ['chant', 'folk', 'solo'],
    },
  },
  examples: [
    'Start with a monophonic melody',
    'Strip it down to a single voice',
    'The unaccompanied melody is powerful',
    'Play the theme in unison',
  ],
};

const HOMOPHONY: DomainNounLexeme = {
  id: 'noun:obj:homophony',
  term: 'homophony',
  variants: [
    'homophonic',
    'melody and chords',
    'chordal texture',
    'hymn texture',
    'melody with accompaniment',
  ],
  category: 'musical_object',
  definition:
    'A texture where one voice carries the melody while others provide harmonic support (chords). The most common texture in popular music.',
  semantics: {
    type: 'concept',
    domain: 'texture',
    aspect: 'textural_type',
    mapping: {
      roles: ['melody', 'accompaniment'],
      complexity: 'moderate',
      prevalence: 'most_common',
    },
  },
  examples: [
    'Use a homophonic texture',
    'The melody and chords texture works well',
    'Write it in hymn style',
    'Keep the accompaniment subordinate to the melody',
  ],
};

const POLYPHONY: DomainNounLexeme = {
  id: 'noun:obj:polyphony',
  term: 'polyphony',
  variants: [
    'polyphonic',
    'contrapuntal texture',
    'multiple voices',
    'independent lines',
    'fugal texture',
  ],
  category: 'musical_object',
  definition:
    'A texture with two or more independent melodic lines sounding simultaneously, each maintaining its own rhythmic and melodic identity.',
  semantics: {
    type: 'concept',
    domain: 'texture',
    aspect: 'textural_type',
    mapping: {
      voices: 'multiple_independent',
      complexity: 'high',
      traditions: ['renaissance', 'baroque', 'jazz', 'progressive'],
    },
  },
  examples: [
    'Use a polyphonic texture',
    'Add more contrapuntal interest',
    'The independent lines should interweave',
    'Write a fugal texture',
  ],
};

const HETEROPHONY: DomainNounLexeme = {
  id: 'noun:obj:heterophony',
  term: 'heterophony',
  variants: [
    'heterophonic',
    'simultaneous variation',
    'embellished unison',
    'heterophonic texture',
  ],
  category: 'musical_object',
  definition:
    'A texture where two or more voices play the same melody simultaneously but with different ornamentation or variation. Common in Middle Eastern, East Asian, and folk traditions.',
  semantics: {
    type: 'concept',
    domain: 'texture',
    aspect: 'textural_type',
    mapping: {
      voices: 'same_melody_varied',
      traditions: ['middle_eastern', 'east_asian', 'folk', 'gamelan'],
    },
  },
  examples: [
    'Use a heterophonic texture',
    'Let each voice ornament the melody differently',
    'The simultaneous variations create richness',
    'The embellished unison sounds organic',
  ],
};

// =============================================================================
// Harmonic Progression Objects
// =============================================================================

const CHORD_PROGRESSION: DomainNounLexeme = {
  id: 'noun:obj:chord_progression',
  term: 'chord progression',
  variants: [
    'progression',
    'changes',
    'harmonic progression',
    'chord sequence',
    'harmony',
    'chords',
  ],
  category: 'musical_object',
  definition:
    'A series of chords played in succession, forming the harmonic foundation of a section or piece. Common progressions include I-IV-V, ii-V-I, and I-V-vi-IV.',
  semantics: {
    type: 'entity',
    entityType: 'harmony',
    mapping: {
      common: {
        pop: ['I-V-vi-IV', 'I-IV-V', 'vi-IV-I-V'],
        jazz: ['ii-V-I', 'I-vi-ii-V', 'iii-vi-ii-V'],
        blues: ['I-IV-I-V-IV-I'],
      },
    },
  },
  examples: [
    'Change the chord progression',
    'Use a ii-V-I progression',
    'The changes are too predictable',
    'Make the harmonic progression more interesting',
  ],
};

const KEY: DomainNounLexeme = {
  id: 'noun:obj:key',
  term: 'key',
  variants: [
    'musical key',
    'key signature',
    'tonality',
    'tonal center',
    'home key',
  ],
  category: 'musical_object',
  definition:
    'The tonal center and associated scale that organizes a piece of music. Determines which notes sound "at home" and which create tension.',
  semantics: {
    type: 'entity',
    entityType: 'param',
    mapping: {
      roots: ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'],
      qualities: ['major', 'minor'],
    },
  },
  examples: [
    'What key is it in?',
    'Change the key to E minor',
    'Modulate to the relative major key',
    'The tonal center should be more clear',
  ],
};

const TURNAROUND: DomainNounLexeme = {
  id: 'noun:obj:turnaround',
  term: 'turnaround',
  variants: [
    'turnaround progression',
    'I-vi-ii-V',
    'harmonic turnaround',
    'cycle',
  ],
  category: 'musical_object',
  definition:
    'A short chord progression (typically 2-4 bars) that leads back to the beginning of a section, creating smooth harmonic continuity across repetitions.',
  semantics: {
    type: 'concept',
    domain: 'harmony',
    aspect: 'harmonic_device',
    mapping: {
      function: 'section_reconnection',
      common: ['I-vi-ii-V', 'I-VI-II-V', 'iii-vi-ii-V'],
      typical_length: 2,
    },
  },
  examples: [
    'Add a turnaround at the end of the section',
    'Use a jazz turnaround',
    'The turnaround should be smoother',
    'The I-vi-ii-V turnaround works here',
  ],
};

// =============================================================================
// Export — All musical object lexemes from this batch
// =============================================================================

export const MUSICAL_OBJECT_LEXEMES_BATCH2: readonly DomainNounLexeme[] = [
  // Rhythm and time
  BEAT,
  DOWNBEAT,
  OFFBEAT,
  SYNCOPATION,
  SWING,
  POLYRHYTHM,
  GHOST_NOTE,
  TIME_SIGNATURE,
  TEMPO,
  // Density and register
  DENSITY,
  REGISTER,
  RANGE,
  // Dynamics
  DYNAMICS,
  CRESCENDO,
  DECRESCENDO,
  ACCENT,
  // Articulation
  LEGATO_OBJ,
  STACCATO_OBJ,
  VIBRATO,
  GLISSANDO,
  TRILL,
  // Form and structure
  PHRASE,
  CADENCE,
  MOTIF,
  SEQUENCE,
  MODULATION,
  // Texture
  MONOPHONY,
  HOMOPHONY,
  POLYPHONY,
  HETEROPHONY,
  // Harmonic progressions
  CHORD_PROGRESSION,
  KEY,
  TURNAROUND,
];

export default MUSICAL_OBJECT_LEXEMES_BATCH2;

/**
 * Statistics for this batch.
 */
export function getMusicalObjectBatch2Stats(): {
  total: number;
  categories: Record<string, number>;
  totalVariants: number;
} {
  const categories: Record<string, number> = {};
  let totalVariants = 0;

  for (const lexeme of MUSICAL_OBJECT_LEXEMES_BATCH2) {
    categories[lexeme.category] = (categories[lexeme.category] ?? 0) + 1;
    totalVariants += lexeme.variants.length;
  }

  return {
    total: MUSICAL_OBJECT_LEXEMES_BATCH2.length,
    categories,
    totalVariants,
  };
}
