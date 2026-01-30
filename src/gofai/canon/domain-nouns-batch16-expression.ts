/**
 * GOFAI Domain Nouns — Batch 16: Musical Expression & Articulation
 *
 * Comprehensive vocabulary for musical expression, articulation, phrasing,
 * and performance nuances. This batch provides extensive coverage of how
 * musicians naturally describe expressive elements of music.
 *
 * @module gofai/canon/domain-nouns-batch16-expression
 */

import type { DomainNounLexeme } from './types';

// =============================================================================
// Articulation Styles
// =============================================================================

const STACCATO: DomainNounLexeme = {
  id: 'noun:staccato',
  term: 'staccato',
  variants: ['detached', 'short notes', 'clipped'],
  category: 'articulation',
  definition: 'Short, detached notes with space between them',
  semantics: {
    type: 'concept',
    domain: 'articulation',
    aspect: 'note_separation',
    mapping: {
      axis: 'articulation',
      direction: 'detached',
      affects: ['duration', 'spacing'],
    },
  },
  examples: [
    'Make the strings more staccato',
    'Add staccato to the pizzicato',
    'The piano should be staccato here',
  ],
};

const LEGATO: DomainNounLexeme = {
  id: 'noun:legato',
  term: 'legato',
  variants: ['smooth', 'connected', 'flowing'],
  category: 'articulation',
  definition: 'Smooth, connected notes without breaks',
  semantics: {
    type: 'concept',
    domain: 'articulation',
    aspect: 'note_connection',
    mapping: {
      axis: 'articulation',
      direction: 'connected',
      affects: ['duration', 'overlap'],
    },
  },
  examples: [
    'Make the melody more legato',
    'The strings should be legato',
    'Add legato phrasing to the vocal',
  ],
};

const MARCATO: DomainNounLexeme = {
  id: 'noun:marcato',
  term: 'marcato',
  variants: ['marked', 'accented', 'emphasized'],
  category: 'articulation',
  definition: 'Each note marked with emphasis',
  semantics: {
    type: 'concept',
    domain: 'articulation',
    aspect: 'emphasis',
    mapping: {
      axis: 'articulation',
      direction: 'emphasized',
      affects: ['velocity', 'attack'],
    },
  },
  examples: [
    'The brass should be marcato',
    'Add marcato articulation',
    'Make it more marcato and punchy',
  ],
};

const TENUTO: DomainNounLexeme = {
  id: 'noun:tenuto',
  term: 'tenuto',
  variants: ['held', 'sustained', 'full value'],
  category: 'articulation',
  definition: 'Notes held for their full duration',
  semantics: {
    type: 'concept',
    domain: 'articulation',
    aspect: 'note_length',
    mapping: {
      axis: 'articulation',
      direction: 'sustained',
      affects: ['duration'],
    },
  },
  examples: [
    'Play the bass notes tenuto',
    'Add tenuto markings',
    'The chords should be tenuto',
  ],
};

const PORTAMENTO: DomainNounLexeme = {
  id: 'noun:portamento',
  term: 'portamento',
  variants: ['glide', 'slide', 'pitch bend'],
  category: 'articulation',
  definition: 'Smooth glide between pitches',
  semantics: {
    type: 'concept',
    domain: 'articulation',
    aspect: 'pitch_transition',
    mapping: {
      axis: 'articulation',
      direction: 'gliding',
      affects: ['pitch', 'transition'],
    },
  },
  examples: [
    'Add portamento to the synth',
    'The strings need portamento',
    'Make the pitch changes more portamento',
  ],
};

const PIZZICATO: DomainNounLexeme = {
  id: 'noun:pizzicato',
  term: 'pizzicato',
  variants: ['plucked', 'pizz'],
  category: 'articulation',
  definition: 'Plucked string technique',
  semantics: {
    type: 'concept',
    domain: 'articulation',
    aspect: 'attack_style',
    mapping: {
      axis: 'articulation',
      direction: 'plucked',
      affects: ['attack', 'timbre'],
    },
  },
  examples: [
    'Switch the strings to pizzicato',
    'Add pizzicato section',
    'The cellos should be pizzicato',
  ],
};

// =============================================================================
// Dynamic Expression
// =============================================================================

const CRESCENDO: DomainNounLexeme = {
  id: 'noun:crescendo',
  term: 'crescendo',
  variants: ['getting louder', 'building', 'swelling'],
  category: 'dynamics',
  definition: 'Gradual increase in volume',
  semantics: {
    type: 'concept',
    domain: 'dynamics',
    aspect: 'volume_change',
    mapping: {
      axis: 'dynamics',
      direction: 'increasing',
      affects: ['velocity', 'volume'],
    },
  },
  examples: [
    'Add a crescendo to the strings',
    'The build needs a crescendo',
    'Make the crescendo more dramatic',
  ],
};

const DECRESCENDO: DomainNounLexeme = {
  id: 'noun:decrescendo',
  term: 'decrescendo',
  variants: ['diminuendo', 'getting quieter', 'fading'],
  category: 'dynamics',
  definition: 'Gradual decrease in volume',
  semantics: {
    type: 'concept',
    domain: 'dynamics',
    aspect: 'volume_change',
    mapping: {
      axis: 'dynamics',
      direction: 'decreasing',
      affects: ['velocity', 'volume'],
    },
  },
  examples: [
    'Add a decrescendo at the end',
    'The outro needs a decrescendo',
    'Make it decrescendo into silence',
  ],
};

const SFORZANDO: DomainNounLexeme = {
  id: 'noun:sforzando',
  term: 'sforzando',
  variants: ['sfz', 'sudden accent', 'strong accent'],
  category: 'dynamics',
  definition: 'Sudden strong accent',
  semantics: {
    type: 'concept',
    domain: 'dynamics',
    aspect: 'accent',
    mapping: {
      axis: 'dynamics',
      direction: 'accented',
      affects: ['velocity', 'attack'],
    },
  },
  examples: [
    'Add sforzando to the downbeats',
    'The brass needs sforzando accents',
    'Make those hits more sforzando',
  ],
};

const FORTEPIANO: DomainNounLexeme = {
  id: 'noun:fortepiano',
  term: 'fortepiano',
  variants: ['fp', 'loud then soft', 'accent then diminish'],
  category: 'dynamics',
  definition: 'Loud attack followed immediately by soft',
  semantics: {
    type: 'concept',
    domain: 'dynamics',
    aspect: 'dynamic_shape',
    mapping: {
      axis: 'dynamics',
      direction: 'varied',
      affects: ['velocity', 'envelope'],
    },
  },
  examples: [
    'Apply fortepiano to the piano',
    'The chords should be fortepiano',
    'Add fortepiano articulation',
  ],
};

// =============================================================================
// Phrasing & Breath
// =============================================================================

const PHRASE_MARK: DomainNounLexeme = {
  id: 'noun:phrase_mark',
  term: 'phrase mark',
  variants: ['phrase', 'slur', 'phrasing'],
  category: 'phrasing',
  definition: 'Grouping of notes into a musical phrase',
  semantics: {
    type: 'concept',
    domain: 'phrasing',
    aspect: 'note_grouping',
  },
  examples: [
    'Add phrase marks to the melody',
    'The phrasing should be clearer',
    'Mark the phrase boundaries',
  ],
};

const BREATH_MARK: DomainNounLexeme = {
  id: 'noun:breath_mark',
  term: 'breath mark',
  variants: ['breath', 'caesura', 'pause'],
  category: 'phrasing',
  definition: 'Brief pause for breathing',
  semantics: {
    type: 'concept',
    domain: 'phrasing',
    aspect: 'phrase_separation',
  },
  examples: [
    'Add a breath mark here',
    'The vocal needs breath marks',
    'Put breaths between phrases',
  ],
};

const CAESURA: DomainNounLexeme = {
  id: 'noun:caesura',
  term: 'caesura',
  variants: ['railroad tracks', 'break', 'cut-off'],
  category: 'phrasing',
  definition: 'Complete break in sound',
  semantics: {
    type: 'concept',
    domain: 'phrasing',
    aspect: 'silence',
  },
  examples: [
    'Add a caesura before the drop',
    'Put a caesura at the climax',
    'The pause should be a full caesura',
  ],
};

// =============================================================================
// Tempo Modifications
// =============================================================================

const RITARDANDO: DomainNounLexeme = {
  id: 'noun:ritardando',
  term: 'ritardando',
  variants: ['rit', 'rallentando', 'slowing down', 'rall'],
  category: 'tempo',
  definition: 'Gradual decrease in tempo',
  semantics: {
    type: 'concept',
    domain: 'tempo',
    aspect: 'tempo_change',
    mapping: {
      axis: 'tempo',
      direction: 'decreasing',
      affects: ['timing', 'groove'],
    },
  },
  examples: [
    'Add a ritardando at the end',
    'The phrase needs a ritardando',
    'Make it ritardando into the cadence',
  ],
};

const ACCELERANDO: DomainNounLexeme = {
  id: 'noun:accelerando',
  term: 'accelerando',
  variants: ['accel', 'speeding up', 'rushing'],
  category: 'tempo',
  definition: 'Gradual increase in tempo',
  semantics: {
    type: 'concept',
    domain: 'tempo',
    aspect: 'tempo_change',
    mapping: {
      axis: 'tempo',
      direction: 'increasing',
      affects: ['timing', 'groove'],
    },
  },
  examples: [
    'Add an accelerando to the build',
    'The drums should accelerando',
    'Make it accelerando into the chorus',
  ],
};

const RUBATO: DomainNounLexeme = {
  id: 'noun:rubato',
  term: 'rubato',
  variants: ['tempo rubato', 'flexible timing', 'expressive timing'],
  category: 'tempo',
  definition: 'Flexible, expressive tempo',
  semantics: {
    type: 'concept',
    domain: 'tempo',
    aspect: 'timing_flexibility',
    mapping: {
      axis: 'timing',
      direction: 'flexible',
      affects: ['timing', 'groove', 'humanization'],
    },
  },
  examples: [
    'Play with more rubato',
    'Add rubato to the piano',
    'The intro should be rubato',
  ],
};

const A_TEMPO: DomainNounLexeme = {
  id: 'noun:a_tempo',
  term: 'a tempo',
  variants: ['return to tempo', 'tempo primo', 'back to tempo'],
  category: 'tempo',
  definition: 'Return to the original tempo',
  semantics: {
    type: 'concept',
    domain: 'tempo',
    aspect: 'tempo_return',
  },
  examples: [
    'Go back a tempo after the ritardando',
    'Mark a tempo at measure 32',
    'Return a tempo for the chorus',
  ],
};

const FERMATA: DomainNounLexeme = {
  id: 'noun:fermata',
  term: 'fermata',
  variants: ['hold', 'pause', 'bird\'s eye'],
  category: 'tempo',
  definition: 'Hold note or rest longer than notated',
  semantics: {
    type: 'concept',
    domain: 'tempo',
    aspect: 'duration_hold',
  },
  examples: [
    'Add a fermata to the final chord',
    'Put fermatas on the rests',
    'Hold that note with a fermata',
  ],
};

// =============================================================================
// Performance Techniques
// =============================================================================

const TRILL: DomainNounLexeme = {
  id: 'noun:trill',
  term: 'trill',
  variants: ['shake', 'rapid alternation', 'mordent'],
  category: 'ornament',
  definition: 'Rapid alternation between two adjacent notes',
  semantics: {
    type: 'concept',
    domain: 'ornamentation',
    aspect: 'pitch_alternation',
  },
  examples: [
    'Add a trill to the melody',
    'The flute should trill there',
    'Make the ornamentation a trill',
  ],
};

const GLISSANDO: DomainNounLexeme = {
  id: 'noun:glissando',
  term: 'glissando',
  variants: ['gliss', 'sweep', 'run'],
  category: 'ornament',
  definition: 'Continuous slide between pitches',
  semantics: {
    type: 'concept',
    domain: 'ornamentation',
    aspect: 'pitch_slide',
  },
  examples: [
    'Add a glissando up to the high note',
    'The strings should glissando',
    'Make that transition a glissando',
  ],
};

const TREMOLO: DomainNounLexeme = {
  id: 'noun:tremolo',
  term: 'tremolo',
  variants: ['rapid repetition', 'trembling', 'measured tremolo'],
  category: 'ornament',
  definition: 'Rapid repetition of a single note',
  semantics: {
    type: 'concept',
    domain: 'ornamentation',
    aspect: 'note_repetition',
  },
  examples: [
    'Add tremolo to the strings',
    'The guitar should be tremolo',
    'Make the sustain into tremolo',
  ],
};

const MORDENT: DomainNounLexeme = {
  id: 'noun:mordent',
  term: 'mordent',
  variants: ['upper mordent', 'lower mordent', 'single alternation'],
  category: 'ornament',
  definition: 'Brief alternation with an adjacent note',
  semantics: {
    type: 'concept',
    domain: 'ornamentation',
    aspect: 'brief_ornament',
  },
  examples: [
    'Add mordents to the cadence',
    'The harpsichord needs mordents',
    'Ornament with mordents',
  ],
};

const TURN: DomainNounLexeme = {
  id: 'noun:turn',
  term: 'turn',
  variants: ['gruppetto', 'neighbor figure', 'ornamental turn'],
  category: 'ornament',
  definition: 'Ornament moving above and below the principal note',
  semantics: {
    type: 'concept',
    domain: 'ornamentation',
    aspect: 'melodic_ornament',
  },
  examples: [
    'Add turns to the melody',
    'The solo should have turns',
    'Ornament with classical turns',
  ],
};

const APPOGGIATURA: DomainNounLexeme = {
  id: 'noun:appoggiatura',
  term: 'appoggiatura',
  variants: ['leaning note', 'grace note', 'acciaccatura'],
  category: 'ornament',
  definition: 'Ornamental note that resolves to a main note',
  semantics: {
    type: 'concept',
    domain: 'ornamentation',
    aspect: 'melodic_approach',
  },
  examples: [
    'Add appoggiaturas before the melody notes',
    'The piano should have appoggiaturas',
    'Ornament with appoggiaturas',
  ],
};

// =============================================================================
// Expression Marks
// =============================================================================

const AGOGIC_ACCENT: DomainNounLexeme = {
  id: 'noun:agogic_accent',
  term: 'agogic accent',
  variants: ['durational accent', 'length emphasis', 'temporal accent'],
  category: 'expression',
  definition: 'Emphasis through duration rather than dynamics',
  semantics: {
    type: 'concept',
    domain: 'expression',
    aspect: 'durational_emphasis',
  },
  examples: [
    'Add agogic accents to the melody',
    'Use agogic accents instead of dynamic',
    'Emphasize with agogic accents',
  ],
};

const BEND: DomainNounLexeme = {
  id: 'noun:bend',
  term: 'bend',
  variants: ['pitch bend', 'blue note', 'string bend'],
  category: 'expression',
  definition: 'Raising or lowering pitch by stretching string or embouchure',
  semantics: {
    type: 'concept',
    domain: 'expression',
    aspect: 'pitch_inflection',
  },
  examples: [
    'Add bends to the guitar solo',
    'The blues needs more bends',
    'Make those notes bend upward',
  ],
};

const FALL: DomainNounLexeme = {
  id: 'noun:fall',
  term: 'fall',
  variants: ['drop off', 'fall off', 'descending fall'],
  category: 'expression',
  definition: 'Downward pitch slide at note end',
  semantics: {
    type: 'concept',
    domain: 'expression',
    aspect: 'pitch_release',
  },
  examples: [
    'Add falls to the brass hits',
    'The saxophone should fall off',
    'Put falls on the endings',
  ],
};

const SCOOP: DomainNounLexeme = {
  id: 'noun:scoop',
  term: 'scoop',
  variants: ['lift', 'pitch approach', 'upward scoop'],
  category: 'expression',
  definition: 'Upward pitch slide at note beginning',
  semantics: {
    type: 'concept',
    domain: 'expression',
    aspect: 'pitch_approach',
  },
  examples: [
    'Add scoops to the vocal',
    'The trombone should scoop',
    'Put scoops on the note attacks',
  ],
};

const GHOST_NOTE: DomainNounLexeme = {
  id: 'noun:ghost_note',
  term: 'ghost note',
  variants: ['dead note', 'muted note', 'percussive note'],
  category: 'expression',
  definition: 'Very quiet, muted note for rhythmic texture',
  semantics: {
    type: 'concept',
    domain: 'expression',
    aspect: 'muted_percussion',
  },
  examples: [
    'Add ghost notes to the snare pattern',
    'The hi-hat needs ghost notes',
    'Fill in with ghost notes',
  ],
};

// =============================================================================
// Vocal Expression
// =============================================================================

const MELISMA: DomainNounLexeme = {
  id: 'noun:melisma',
  term: 'melisma',
  variants: ['melismatic', 'runs', 'vocal runs'],
  category: 'vocal_technique',
  definition: 'Multiple notes sung on a single syllable',
  semantics: {
    type: 'concept',
    domain: 'vocals',
    aspect: 'syllabic_extension',
  },
  examples: [
    'Add melisma to the vocal',
    'The phrase should be melismatic',
    'Put melisma on the last word',
  ],
};

const PORTAMENTO_VOCAL: DomainNounLexeme = {
  id: 'noun:portamento_vocal',
  term: 'vocal portamento',
  variants: ['slide', 'glide', 'vocal slide'],
  category: 'vocal_technique',
  definition: 'Smooth pitch transition in singing',
  semantics: {
    type: 'concept',
    domain: 'vocals',
    aspect: 'pitch_glide',
  },
  examples: [
    'Add portamento to the vocal line',
    'The singer should slide between notes',
    'Make the transitions more portamento',
  ],
};

const CHEST_VOICE: DomainNounLexeme = {
  id: 'noun:chest_voice',
  term: 'chest voice',
  variants: ['chest register', 'modal voice', 'heavy mechanism'],
  category: 'vocal_technique',
  definition: 'Lower vocal register with chest resonance',
  semantics: {
    type: 'concept',
    domain: 'vocals',
    aspect: 'vocal_register',
  },
  examples: [
    'Use chest voice for power',
    'The verse should be chest voice',
    'Drop into chest voice',
  ],
};

const HEAD_VOICE: DomainNounLexeme = {
  id: 'noun:head_voice',
  term: 'head voice',
  variants: ['head register', 'falsetto', 'light mechanism'],
  category: 'vocal_technique',
  definition: 'Upper vocal register with head resonance',
  semantics: {
    type: 'concept',
    domain: 'vocals',
    aspect: 'vocal_register',
  },
  examples: [
    'Switch to head voice for the high notes',
    'The bridge should be head voice',
    'Use head voice for softness',
  ],
};

const GROWL: DomainNounLexeme = {
  id: 'noun:growl',
  term: 'growl',
  variants: ['vocal fry', 'rasp', 'distortion'],
  category: 'vocal_technique',
  definition: 'Rough, distorted vocal timbre',
  semantics: {
    type: 'concept',
    domain: 'vocals',
    aspect: 'vocal_distortion',
  },
  examples: [
    'Add growl to the vocal',
    'The rock vocal needs growl',
    'Make it more growly and aggressive',
  ],
};

// =============================================================================
// Ensemble & Balance
// =============================================================================

const DOUBLING: DomainNounLexeme = {
  id: 'noun:doubling',
  term: 'doubling',
  variants: ['octave doubling', 'unison doubling', 'reinforcement'],
  category: 'ensemble',
  definition: 'Multiple instruments playing the same line',
  semantics: {
    type: 'concept',
    domain: 'arrangement',
    aspect: 'voice_multiplication',
  },
  examples: [
    'Add doubling to the melody',
    'The bass needs doubling',
    'Remove octave doubling',
  ],
};

const HOCKET: DomainNounLexeme = {
  id: 'noun:hocket',
  term: 'hocket',
  variants: ['hocketing', 'note alternation', 'shared melody'],
  category: 'ensemble',
  definition: 'Melody split between voices with rests',
  semantics: {
    type: 'concept',
    domain: 'arrangement',
    aspect: 'voice_alternation',
  },
  examples: [
    'Create hocket between instruments',
    'The melody should hocket',
    'Add hocketing technique',
  ],
};

const ANTIPHONY: DomainNounLexeme = {
  id: 'noun:antiphony',
  term: 'antiphony',
  variants: ['call and response', 'antiphonal', 'alternating'],
  category: 'ensemble',
  definition: 'Alternating phrases between groups',
  semantics: {
    type: 'concept',
    domain: 'arrangement',
    aspect: 'group_alternation',
  },
  examples: [
    'Create antiphony between sections',
    'The brass and strings should be antiphonal',
    'Add call and response structure',
  ],
};

const RINFORZANDO: DomainNounLexeme = {
  id: 'noun:rinforzando',
  term: 'rinforzando',
  variants: ['rfz', 'reinforcing', 'sudden emphasis'],
  category: 'dynamics',
  definition: 'Sudden reinforcement of a note or chord',
  semantics: {
    type: 'concept',
    domain: 'dynamics',
    aspect: 'emphasis',
    mapping: {
      axis: 'dynamics',
      direction: 'emphasized',
      affects: ['velocity', 'attack'],
    },
  },
  examples: [
    'Add rinforzando to the climax',
    'Mark that chord rinforzando',
    'The downbeat should be rinforzando',
  ],
};

const SUBITO: DomainNounLexeme = {
  id: 'noun:subito',
  term: 'subito',
  variants: ['suddenly', 'immediate change'],
  category: 'expression',
  definition: 'Sudden immediate change in dynamics or tempo',
  semantics: {
    type: 'concept',
    domain: 'expression',
    aspect: 'sudden_change',
  },
  examples: [
    'Go subito piano',
    'Add subito forte',
    'The change should be subito',
  ],
};

const SOTTO_VOCE: DomainNounLexeme = {
  id: 'noun:sotto_voce',
  term: 'sotto voce',
  variants: ['under the voice', 'hushed', 'whispered'],
  category: 'dynamics',
  definition: 'Very soft, as if whispered',
  semantics: {
    type: 'concept',
    domain: 'dynamics',
    aspect: 'soft_quality',
    mapping: {
      axis: 'dynamics',
      direction: 'quiet',
      affects: ['velocity', 'intimacy'],
    },
  },
  examples: [
    'Play sotto voce',
    'The passage should be sotto voce',
    'Whisper it sotto voce',
  ],
};

// =============================================================================
// Export All Lexemes
// =============================================================================

export const EXPRESSION_ARTICULATION_LEXEMES: readonly DomainNounLexeme[] = [
  // Articulation
  STACCATO,
  LEGATO,
  MARCATO,
  TENUTO,
  PORTAMENTO,
  PIZZICATO,

  // Dynamics
  CRESCENDO,
  DECRESCENDO,
  SFORZANDO,
  FORTEPIANO,
  RINFORZANDO,
  SOTTO_VOCE,

  // Phrasing
  PHRASE_MARK,
  BREATH_MARK,
  CAESURA,

  // Tempo
  RITARDANDO,
  ACCELERANDO,
  RUBATO,
  A_TEMPO,
  FERMATA,

  // Ornaments
  TRILL,
  GLISSANDO,
  TREMOLO,
  MORDENT,
  TURN,
  APPOGGIATURA,

  // Expression
  AGOGIC_ACCENT,
  BEND,
  FALL,
  SCOOP,
  GHOST_NOTE,
  SUBITO,

  // Vocal
  MELISMA,
  PORTAMENTO_VOCAL,
  CHEST_VOICE,
  HEAD_VOICE,
  GROWL,

  // Ensemble
  DOUBLING,
  HOCKET,
  ANTIPHONY,
] as const;

export default EXPRESSION_ARTICULATION_LEXEMES;
