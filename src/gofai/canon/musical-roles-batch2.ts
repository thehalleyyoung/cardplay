/**
 * GOFAI Lexeme Classes — Musical Roles Batch 2
 *
 * Extended musical role lexemes covering electronic production roles,
 * world music traditions, jazz ensemble roles, and specialized
 * arrangement functions.
 *
 * Step 121 [NLP][Sem] of gofai_goalA.md — Batch 2 of N
 *
 * @module gofai/canon/musical-roles-batch2
 */

import type { DomainNounLexeme } from './types';

// =============================================================================
// Electronic Production Roles
// =============================================================================

const SYNTH_LEAD: DomainNounLexeme = {
  id: 'noun:role:synth_lead',
  term: 'synth lead',
  variants: [
    'synthesizer lead',
    'lead synth',
    'synth melody',
    'mono lead',
    'synth solo',
    'analog lead',
    'digital lead',
  ],
  category: 'musical_role',
  definition:
    'A synthesized melodic lead voice, typically monophonic or paraphonic, providing the primary melodic interest in electronic music.',
  semantics: {
    type: 'entity',
    entityType: 'melody',
    role: 'synth_lead',
    layer_affinity: ['lead', 'melody'],
    selectional_restrictions: {
      can_modify: ['pitch', 'rhythm', 'timbre', 'dynamics', 'effects', 'filter', 'modulation'],
      cannot_modify: ['song_structure'],
      typical_axes: ['brightness', 'energy', 'tension', 'width'],
    },
  },
  examples: [
    'Make the synth lead brighter',
    'The lead synth needs more filter movement',
    'Add portamento to the synth lead',
    'The analog lead should be fatter',
  ],
};

const SYNTH_PAD: DomainNounLexeme = {
  id: 'noun:role:synth_pad',
  term: 'synth pad',
  variants: [
    'synthesizer pad',
    'pad sound',
    'evolving pad',
    'warm pad',
    'atmospheric synth',
    'lush pad',
    'swelling pad',
  ],
  category: 'musical_role',
  definition:
    'A sustained, evolving synthesized texture with soft attack, providing harmonic atmosphere and timbral depth in electronic and cinematic music.',
  semantics: {
    type: 'entity',
    entityType: 'texture',
    role: 'synth_pad',
    layer_affinity: ['harmony', 'texture'],
    selectional_restrictions: {
      can_modify: ['timbre', 'harmony', 'dynamics', 'width', 'filter', 'modulation', 'effects'],
      cannot_modify: ['rhythmic_detail'],
      typical_axes: ['warmth', 'width', 'brightness', 'intimacy'],
    },
  },
  examples: [
    'Make the synth pad warmer',
    'The pad should evolve more slowly',
    'Add more movement to the pad sound',
    'The lush pad is too bright',
  ],
};

const SYNTH_BASS: DomainNounLexeme = {
  id: 'noun:role:synth_bass',
  term: 'synth bass',
  variants: [
    'synthesizer bass',
    'bass synth',
    'analog bass',
    'reese bass',
    'wobble bass',
    'acid bass',
    '303 bass',
    'FM bass',
  ],
  category: 'musical_role',
  definition:
    'A synthesized bass voice providing low-end foundation in electronic music. Encompasses styles from acid (303), reese (detuned saws), wobble (LFO-modulated), and FM synthesis.',
  semantics: {
    type: 'entity',
    entityType: 'melody',
    role: 'synth_bass',
    layer_affinity: ['bass'],
    selectional_restrictions: {
      can_modify: ['pitch', 'rhythm', 'timbre', 'dynamics', 'filter', 'modulation', 'effects'],
      cannot_modify: ['song_structure'],
      typical_axes: ['energy', 'warmth', 'groove_tightness', 'tension'],
      register: 'low',
    },
  },
  examples: [
    'Make the synth bass wobblier',
    'The acid bass needs more resonance',
    'Add distortion to the reese bass',
    'The FM bass should be tighter',
  ],
};

const PLUCK: DomainNounLexeme = {
  id: 'noun:role:pluck',
  term: 'pluck',
  variants: [
    'synth pluck',
    'pluck sound',
    'plucked synth',
    'stab pluck',
    'short pluck',
    'pluck melody',
  ],
  category: 'musical_role',
  definition:
    'A synthesized sound with sharp attack and quick decay mimicking plucked string or mallet instruments. Common in trance, progressive, and future bass.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'synth_articulation',
    mapping: {
      role: 'pluck',
      attack: 'sharp',
      decay: 'quick',
      traditions: ['trance', 'progressive', 'future_bass', 'tropical_house'],
    },
  },
  examples: [
    'Add a pluck melody in the breakdown',
    'The pluck sound should be brighter',
    'Make the synth pluck more staccato',
    'Layer the pluck with the arp',
  ],
};

const SAMPLE: DomainNounLexeme = {
  id: 'noun:role:sample',
  term: 'sample',
  variants: [
    'audio sample',
    'vocal sample',
    'chop',
    'chopped sample',
    'loop',
    'sample loop',
    'slice',
    'sampled element',
  ],
  category: 'musical_role',
  definition:
    'A recorded audio fragment used as a musical element, either looped, chopped, or triggered as one-shots. Central to hip-hop, electronic, and experimental production.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'sampled_material',
    mapping: {
      role: 'sample',
      source: 'recorded_audio',
      traditions: ['hip_hop', 'electronic', 'experimental', 'dub'],
      operations: ['chop', 'loop', 'pitch_shift', 'time_stretch', 'reverse'],
    },
  },
  examples: [
    'Chop the sample differently',
    'The vocal sample should be pitched down',
    'Loop the sample for two bars',
    'Add a chopped sample in the verse',
  ],
};

const DROP_ELEMENT: DomainNounLexeme = {
  id: 'noun:role:drop',
  term: 'drop',
  variants: [
    'the drop',
    'bass drop',
    'beat drop',
    'main drop',
    'first drop',
    'second drop',
  ],
  category: 'musical_role',
  definition:
    'The high-energy section in electronic music where bass and drums enter or intensify after a buildup. The climactic moment of energy release in EDM forms.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'structural_climax',
    mapping: {
      role: 'drop',
      function: 'energy_release',
      typical_elements: ['bass', 'drums', 'lead'],
      traditions: ['dubstep', 'edm', 'drum_and_bass', 'trap', 'house'],
    },
  },
  examples: [
    'The drop needs more impact',
    'Make the bass drop heavier',
    'Build more tension before the drop',
    'The second drop should be different',
  ],
};

const BREAKDOWN: DomainNounLexeme = {
  id: 'noun:role:breakdown',
  term: 'breakdown',
  variants: [
    'the breakdown',
    'break section',
    'stripped section',
    'minimal section',
  ],
  category: 'musical_role',
  definition:
    'A section where instrumentation is stripped back to create contrast, build anticipation, or provide dynamic relief. Common in electronic, dance, and metal music.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'structural_contrast',
    mapping: {
      role: 'breakdown',
      function: 'tension_building',
      energy: 'reduced',
      traditions: ['electronic', 'metal', 'dance', 'pop'],
    },
  },
  examples: [
    'The breakdown should be longer',
    'Strip it down for the breakdown',
    'Add a filtered pad in the breakdown',
    'Build more tension through the breakdown',
  ],
};

const BUILDUP: DomainNounLexeme = {
  id: 'noun:role:buildup',
  term: 'buildup',
  variants: [
    'build-up',
    'build',
    'riser section',
    'tension build',
    'the build',
    'pre-drop',
  ],
  category: 'musical_role',
  definition:
    'A section of increasing energy, density, and tension that precedes a climactic moment (drop, chorus entry). Uses risers, drum rolls, filtering, and additive layering.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'energy_accumulation',
    mapping: {
      role: 'buildup',
      function: 'energy_accumulation',
      techniques: ['riser', 'snare_roll', 'filter_sweep', 'additive_layers'],
      traditions: ['electronic', 'dance', 'pop', 'cinematic'],
    },
  },
  examples: [
    'Make the buildup longer',
    'The build needs more tension',
    'Add a snare roll to the buildup',
    'The riser should sweep higher',
  ],
};

// =============================================================================
// Jazz Ensemble Roles
// =============================================================================

const COMPING: DomainNounLexeme = {
  id: 'noun:role:comping',
  term: 'comping',
  variants: [
    'comp',
    'comping chords',
    'rhythm comping',
    'harmonic comping',
    'chord comping',
    'accompaniment chords',
  ],
  category: 'musical_role',
  definition:
    'The jazz practice of playing chords in a rhythmically varied, interactive manner to support soloists. Involves voicing choices, rhythmic placement, and dynamic sensitivity.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'jazz_accompaniment',
    tradition: 'jazz',
    mapping: {
      role: 'comping',
      function: 'harmonic_support',
      interaction: 'responsive_to_soloist',
      typical_instruments: ['piano', 'guitar', 'vibraphone', 'organ'],
    },
  },
  examples: [
    'The comping should be more sparse',
    'Add some comping behind the solo',
    'Make the comp chords more dissonant',
    'The piano comping is too busy',
  ],
};

const HEAD: DomainNounLexeme = {
  id: 'noun:role:head',
  term: 'head',
  variants: [
    'the head',
    'head melody',
    'theme statement',
    'main head',
    'melody head',
    'head in',
    'head out',
  ],
  category: 'musical_role',
  definition:
    'In jazz, the composed melody of a standard or original tune, typically played at the beginning (head in) and end (head out) of a performance, bookending improvised solos.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'jazz_form',
    tradition: 'jazz',
    mapping: {
      role: 'head',
      function: 'composed_melody',
      form_position: ['opening', 'closing'],
    },
  },
  examples: [
    'Play the head straight',
    'The head should be more embellished',
    'Take it from the head',
    'Restate the head at the end',
  ],
};

const RHYTHM_CHANGES: DomainNounLexeme = {
  id: 'noun:role:rhythm_changes',
  term: 'rhythm changes',
  variants: [
    'rhythm section changes',
    'changes',
    'chord changes',
    'harmonic rhythm',
  ],
  category: 'musical_role',
  definition:
    'The chord progression underlying a jazz performance, derived from "I Got Rhythm" or any standard harmonic form. Also refers generally to harmonic progressions in jazz.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'jazz_harmony',
    tradition: 'jazz',
    mapping: {
      role: 'harmonic_foundation',
      function: 'chord_progression',
      typical_usage: 'improvisation_framework',
    },
  },
  examples: [
    'The changes are too fast',
    'Simplify the chord changes',
    'Play rhythm changes',
    'The harmonic rhythm should slow down',
  ],
};

const TRADING: DomainNounLexeme = {
  id: 'noun:role:trading',
  term: 'trading',
  variants: [
    'trading fours',
    'trading eights',
    'trading twos',
    'call and response solo',
    'trade solos',
  ],
  category: 'musical_role',
  definition:
    'A jazz practice where soloists alternate short improvisations (typically 4, 8, or 2 bars), creating musical dialogue and building intensity.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'jazz_interaction',
    tradition: 'jazz',
    mapping: {
      role: 'trading',
      function: 'alternating_improvisation',
      typical_lengths: [2, 4, 8],
      unit: 'bars',
    },
  },
  examples: [
    'Start trading fours after the second chorus',
    'The trading should get more intense',
    'Trade eights with the drums',
    'End the trading with a collective improvisation',
  ],
};

// =============================================================================
// World Music Roles
// =============================================================================

const CALL_RESPONSE: DomainNounLexeme = {
  id: 'noun:role:call_response',
  term: 'call and response',
  variants: [
    'call-and-response',
    'responsorial',
    'antiphony',
    'antiphonal',
    'leader and chorus',
    'call/response',
  ],
  category: 'musical_role',
  definition:
    'A musical structure where a leading phrase (call) is answered by a responding phrase (response). Found across African, gospel, blues, Latin, and many world music traditions.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'interaction_pattern',
    mapping: {
      role: 'call_response',
      structure: 'alternating',
      traditions: ['african', 'gospel', 'blues', 'latin', 'folk', 'work_songs'],
      parts: ['leader', 'chorus'],
    },
  },
  examples: [
    'Make it call and response between guitar and vocal',
    'The antiphonal section should be tighter',
    'Add a response to the vocal call',
    'The call and response needs more energy',
  ],
};

const TALA_PATTERN: DomainNounLexeme = {
  id: 'noun:role:tala',
  term: 'tala',
  variants: [
    'tala pattern',
    'rhythmic cycle',
    'taal',
    'tal',
    'metric cycle',
    'time cycle',
  ],
  category: 'musical_role',
  definition:
    'In Indian classical music, a cyclical rhythmic framework organizing time into repeating patterns of beats (matras) with specific stress patterns. Examples: Teental (16 beats), Jhaptal (10 beats).',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'rhythmic_framework',
    tradition: 'indian_classical',
    mapping: {
      role: 'tala',
      function: 'metric_organization',
      elements: ['sam', 'khali', 'tali', 'vibhag'],
    },
  },
  examples: [
    'Use teental as the tala',
    'The rhythmic cycle should be 16 beats',
    'Add tabla in the tala pattern',
    'Shift to jhaptal for the bridge',
  ],
};

const RAGA_MELODY: DomainNounLexeme = {
  id: 'noun:role:raga',
  term: 'raga',
  variants: [
    'raag',
    'raga melody',
    'melodic mode',
    'raga framework',
    'ascending raga',
    'descending raga',
  ],
  category: 'musical_role',
  definition:
    'In Indian classical music, a melodic framework defining specific ascending (aroha) and descending (avaroha) note sequences, characteristic phrases, and emotional associations (rasa).',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'melodic_framework',
    tradition: 'indian_classical',
    mapping: {
      role: 'raga',
      function: 'melodic_framework',
      elements: ['aroha', 'avaroha', 'pakad', 'vadi', 'samvadi'],
    },
  },
  examples: [
    'Use a raga-inspired melody',
    'The raga should be Yaman',
    'Add raga-style ornamentation',
    'Follow the ascending raga pattern',
  ],
};

const CLAVE_PATTERN: DomainNounLexeme = {
  id: 'noun:role:clave',
  term: 'clave',
  variants: [
    'clave pattern',
    'clave rhythm',
    'son clave',
    'rumba clave',
    '3-2 clave',
    '2-3 clave',
    'clave direction',
  ],
  category: 'musical_role',
  definition:
    'The foundational two-bar rhythmic pattern in Afro-Cuban and Latin music that organizes all other parts. Comes in son and rumba variants, each in 3-2 or 2-3 orientation.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'rhythmic_key',
    tradition: 'afro_cuban',
    mapping: {
      role: 'clave',
      function: 'rhythmic_key_pattern',
      variants: ['son_3_2', 'son_2_3', 'rumba_3_2', 'rumba_2_3'],
    },
  },
  examples: [
    'The clave should be 3-2 son',
    'Switch the clave direction',
    'Everything should lock to the clave',
    'Add clave sticks playing the pattern',
  ],
};

const MONTUNO: DomainNounLexeme = {
  id: 'noun:role:montuno',
  term: 'montuno',
  variants: [
    'piano montuno',
    'montuno pattern',
    'guajeo',
    'tumbao piano',
  ],
  category: 'musical_role',
  definition:
    'A syncopated, repeating piano or keyboard pattern in Afro-Cuban music that provides harmonic and rhythmic drive, typically aligned with the clave.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'latin_keyboard',
    tradition: 'afro_cuban',
    mapping: {
      role: 'montuno',
      function: 'harmonic_rhythmic_drive',
      typical_instrument: 'piano',
      relationship: 'aligned_to_clave',
    },
  },
  examples: [
    'Add a montuno pattern on the piano',
    'The montuno should be more syncopated',
    'Make the guajeo simpler',
    'The piano montuno is too busy',
  ],
};

const TUMBAO: DomainNounLexeme = {
  id: 'noun:role:tumbao',
  term: 'tumbao',
  variants: [
    'bass tumbao',
    'tumbao bass',
    'conga tumbao',
    'latin bass pattern',
  ],
  category: 'musical_role',
  definition:
    'A syncopated bass or conga pattern in Afro-Cuban music, characterized by its anticipation of beat one (the "anticipated bass"). Essential for Latin groove.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'latin_rhythm',
    tradition: 'afro_cuban',
    mapping: {
      role: 'tumbao',
      function: 'syncopated_foundation',
      typical_instruments: ['bass', 'congas'],
      characteristic: 'anticipated_downbeat',
    },
  },
  examples: [
    'The bass should play a tumbao',
    'Add a conga tumbao',
    'Make the tumbao more driving',
    'The bass tumbao needs more swing',
  ],
};

// =============================================================================
// Arrangement Function Roles
// =============================================================================

const INTRO_ELEMENT: DomainNounLexeme = {
  id: 'noun:role:intro_element',
  term: 'intro element',
  variants: [
    'intro',
    'introduction',
    'opening',
    'lead-in',
    'intro riff',
    'intro melody',
    'intro chords',
  ],
  category: 'musical_role',
  definition:
    'Any musical element specifically associated with the introduction section, establishing mood, key, tempo, and genre before the main body.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'structural_function',
    mapping: {
      role: 'intro',
      function: 'establishment',
      position: 'opening',
      establishes: ['mood', 'key', 'tempo', 'genre'],
    },
  },
  examples: [
    'Make the intro more atmospheric',
    'The intro should build gradually',
    'Add a guitar intro',
    'The intro melody should be simpler',
  ],
};

const OUTRO_ELEMENT: DomainNounLexeme = {
  id: 'noun:role:outro_element',
  term: 'outro element',
  variants: [
    'outro',
    'ending',
    'coda',
    'tag',
    'outro riff',
    'outro melody',
    'fade-out',
    'closing',
  ],
  category: 'musical_role',
  definition:
    'Any musical element specifically associated with the ending section, providing closure, summary, or fadeout.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'structural_function',
    mapping: {
      role: 'outro',
      function: 'closure',
      position: 'ending',
      techniques: ['fade_out', 'final_cadence', 'deceleration', 'thinning'],
    },
  },
  examples: [
    'Make the outro longer',
    'The ending should fade out',
    'Add a coda after the last chorus',
    'The outro needs a final hit',
  ],
};

const TRANSITION_ELEMENT: DomainNounLexeme = {
  id: 'noun:role:transition',
  term: 'transition',
  variants: [
    'transition element',
    'connector',
    'link',
    'segue',
    'bridge passage',
    'transitional passage',
  ],
  category: 'musical_role',
  definition:
    'A musical element that connects two sections, providing smooth or dramatic movement between contrasting material.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'structural_function',
    mapping: {
      role: 'transition',
      function: 'connection',
      techniques: ['modulation', 'rhythmic_shift', 'textural_change', 'dynamic_shift'],
    },
  },
  examples: [
    'Add a smoother transition between verse and chorus',
    'The transition is too abrupt',
    'Use a drum fill as a transition',
    'The segue needs more flow',
  ],
};

const DOUBLING: DomainNounLexeme = {
  id: 'noun:role:doubling',
  term: 'doubling',
  variants: [
    'double',
    'doubled part',
    'octave doubling',
    'unison doubling',
    'layer doubling',
    'thickening',
  ],
  category: 'musical_role',
  definition:
    'Playing the same melodic line with multiple instruments or at different octaves to thicken the sound, add weight, or create timbral richness.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'arrangement_technique',
    mapping: {
      role: 'doubling',
      function: 'thickening',
      types: ['unison', 'octave', 'timbral'],
      effect: 'increased_presence',
    },
  },
  examples: [
    'Double the melody with strings',
    'Add octave doubling on the bass',
    'The vocal doubling should be wider',
    'Double the riff with a distorted layer',
  ],
};

const COUNTERPOINT: DomainNounLexeme = {
  id: 'noun:role:counterpoint',
  term: 'counterpoint',
  variants: [
    'contrapuntal line',
    'contrapuntal part',
    'independent voice',
    'polyphonic line',
    'fugal voice',
    'canon part',
  ],
  category: 'musical_role',
  definition:
    'An independent melodic line that moves against the primary melody according to principles of harmonic and rhythmic contrast, creating polyphonic texture.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'polyphonic_technique',
    mapping: {
      role: 'counterpoint',
      function: 'independent_melodic_interest',
      motion_types: ['contrary', 'oblique', 'parallel', 'similar'],
      traditions: ['classical', 'baroque', 'jazz', 'progressive'],
    },
  },
  examples: [
    'Add counterpoint to the melody',
    'The contrapuntal line should be in contrary motion',
    'Make the counterpoint less busy',
    'Write a fugal voice entry',
  ],
};

const HARMONY_PART: DomainNounLexeme = {
  id: 'noun:role:harmony_part',
  term: 'harmony part',
  variants: [
    'harmony',
    'harmonization',
    'harmony line',
    'parallel harmony',
    'thirds',
    'sixths',
    'harmony vocals',
    'harmonized melody',
  ],
  category: 'musical_role',
  definition:
    'A melodic line that moves in harmonic intervals (thirds, sixths, etc.) with the main melody, enriching the harmonic content without independent contrapuntal motion.',
  semantics: {
    type: 'entity',
    entityType: 'harmony',
    role: 'harmony_part',
    layer_affinity: ['harmony', 'vocal'],
    selectional_restrictions: {
      can_modify: ['pitch', 'interval', 'dynamics', 'register', 'voicing'],
      cannot_modify: ['rhythm_independently'],
      typical_axes: ['warmth', 'width', 'tension', 'brightness'],
      relationship: 'parallel_to_melody',
    },
  },
  examples: [
    'Add harmony in thirds',
    'The harmony part should be lower',
    'Harmonize the melody in sixths',
    'The vocal harmony is too loud',
  ],
};

// =============================================================================
// Cinematic and Sound Design Roles
// =============================================================================

const UNDERSCORE: DomainNounLexeme = {
  id: 'noun:role:underscore',
  term: 'underscore',
  variants: [
    'underscoring',
    'background music',
    'incidental music',
    'score',
    'film score',
    'background score',
  ],
  category: 'musical_role',
  definition:
    'Music composed to accompany visual media (film, TV, games), designed to support emotional narrative without drawing attention to itself.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'media_function',
    mapping: {
      role: 'underscore',
      function: 'emotional_support',
      context: ['film', 'tv', 'games', 'media'],
      characteristics: ['subtle', 'supportive', 'responsive'],
    },
  },
  examples: [
    'The underscore should be more subtle',
    'Make the background music more tense',
    'The score needs to build here',
    'The incidental music is too prominent',
  ],
};

const FOLEY: DomainNounLexeme = {
  id: 'noun:role:foley',
  term: 'foley',
  variants: [
    'foley sounds',
    'field recording',
    'environmental sounds',
    'ambient sounds',
    'found sounds',
    'room tone',
  ],
  category: 'musical_role',
  definition:
    'Real-world recorded sounds used musically for texture, rhythm, or atmosphere. Includes field recordings, environmental audio, and everyday objects used as instruments.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'sound_source',
    mapping: {
      role: 'foley',
      source: 'real_world_recording',
      usage: ['texture', 'rhythm', 'atmosphere'],
      traditions: ['experimental', 'musique_concrete', 'ambient', 'sound_art'],
    },
  },
  examples: [
    'Add some foley sounds in the breakdown',
    'Use field recordings for texture',
    'The ambient sounds should be more subtle',
    'Layer found sounds over the beat',
  ],
};

const STINGER: DomainNounLexeme = {
  id: 'noun:role:stinger',
  term: 'stinger',
  variants: [
    'hit point',
    'accent hit',
    'musical hit',
    'sync point',
    'sting',
    'musical sting',
    'button',
  ],
  category: 'musical_role',
  definition:
    'A short, emphatic musical accent synchronized to a specific moment, used in media scoring and live performance to punctuate dramatic beats.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'punctuation',
    mapping: {
      role: 'stinger',
      function: 'dramatic_punctuation',
      duration: 'very_short',
      context: ['film', 'tv', 'games', 'live_performance'],
    },
  },
  examples: [
    'Add a stinger at the reveal',
    'The musical hit should be bigger',
    'Time the sting to the visual cue',
    'The accent hit needs more brass',
  ],
};

// =============================================================================
// African Music Roles
// =============================================================================

const DJEMBE_PATTERN: DomainNounLexeme = {
  id: 'noun:role:djembe',
  term: 'djembe pattern',
  variants: [
    'djembe',
    'djembe rhythm',
    'djembe part',
    'lead djembe',
    'accompanying djembe',
  ],
  category: 'musical_role',
  definition:
    'A rhythmic pattern played on the djembe (West African goblet drum), using bass, tone, and slap techniques. May serve as lead or accompanying role in the drum ensemble.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'african_percussion',
    tradition: 'west_african',
    mapping: {
      role: 'djembe',
      techniques: ['bass', 'tone', 'slap'],
      ensemble_roles: ['lead', 'accompaniment'],
    },
  },
  examples: [
    'Add a djembe pattern',
    'The lead djembe should be more improvisatory',
    'Make the djembe part simpler',
    'The djembe rhythm should drive the groove',
  ],
};

const TALKING_DRUM: DomainNounLexeme = {
  id: 'noun:role:talking_drum',
  term: 'talking drum',
  variants: [
    'dundun',
    'doundoun',
    'tama',
    'talking drum pattern',
    'pressure drum',
  ],
  category: 'musical_role',
  definition:
    'A variable-pitch drum (West African tradition) capable of mimicking tonal languages through squeeze-tension changes. Serves both rhythmic and communicative roles.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'african_percussion',
    tradition: 'west_african',
    mapping: {
      role: 'talking_drum',
      function: 'rhythmic_melodic',
      pitch_variable: true,
    },
  },
  examples: [
    'Add a talking drum part',
    'The dundun pattern should be steady',
    'Make the tama more melodic',
    'The talking drum should accent the phrase endings',
  ],
};

const MBIRA_PATTERN: DomainNounLexeme = {
  id: 'noun:role:mbira',
  term: 'mbira pattern',
  variants: [
    'mbira',
    'kalimba pattern',
    'kalimba',
    'thumb piano',
    'lamellophone',
    'likembe',
  ],
  category: 'musical_role',
  definition:
    'A cyclical melodic-rhythmic pattern played on a lamellaphone (mbira/kalimba), central to Shona music and related Southern/East African traditions.',
  semantics: {
    type: 'concept',
    domain: 'musical_role',
    aspect: 'african_melodic_percussion',
    tradition: 'southern_african',
    mapping: {
      role: 'mbira',
      function: 'melodic_rhythmic_cycle',
      characteristic: 'interlocking_patterns',
    },
  },
  examples: [
    'Add a kalimba pattern',
    'The mbira pattern should interlock',
    'Make the thumb piano brighter',
    'Layer a mbira over the pad',
  ],
};

// =============================================================================
// Export — All musical role lexemes from this batch
// =============================================================================

export const MUSICAL_ROLE_LEXEMES_BATCH2: readonly DomainNounLexeme[] = [
  // Electronic production roles
  SYNTH_LEAD,
  SYNTH_PAD,
  SYNTH_BASS,
  PLUCK,
  SAMPLE,
  DROP_ELEMENT,
  BREAKDOWN,
  BUILDUP,
  // Jazz ensemble roles
  COMPING,
  HEAD,
  RHYTHM_CHANGES,
  TRADING,
  // World music roles
  CALL_RESPONSE,
  TALA_PATTERN,
  RAGA_MELODY,
  CLAVE_PATTERN,
  MONTUNO,
  TUMBAO,
  // Arrangement function roles
  INTRO_ELEMENT,
  OUTRO_ELEMENT,
  TRANSITION_ELEMENT,
  DOUBLING,
  COUNTERPOINT,
  HARMONY_PART,
  // Cinematic and sound design roles
  UNDERSCORE,
  FOLEY,
  STINGER,
  // African music roles
  DJEMBE_PATTERN,
  TALKING_DRUM,
  MBIRA_PATTERN,
];

export default MUSICAL_ROLE_LEXEMES_BATCH2;

/**
 * Statistics for this batch.
 */
export function getMusicalRoleBatch2Stats(): {
  total: number;
  categories: Record<string, number>;
  totalVariants: number;
} {
  const categories: Record<string, number> = {};
  let totalVariants = 0;

  for (const lexeme of MUSICAL_ROLE_LEXEMES_BATCH2) {
    categories[lexeme.category] = (categories[lexeme.category] ?? 0) + 1;
    totalVariants += lexeme.variants.length;
  }

  return {
    total: MUSICAL_ROLE_LEXEMES_BATCH2.length,
    categories,
    totalVariants,
  };
}
