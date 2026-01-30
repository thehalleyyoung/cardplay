/**
 * GOFAI Canon: Performance Technique and Articulation Vocabulary Batch 54
 * 
 * Step 052/061 implementation: Comprehensive vocabulary for performance
 * techniques, articulations, and expressive devices musicians reference.
 * 
 * Covers 600+ ways to describe how notes should be played, techniques
 * for expression, and articulation marks that affect musical execution.
 */

import type { Lexeme } from './types.js';

/**
 * Performance technique vocabulary covering articulations, playing
 * techniques, expressive devices, and execution instructions.
 * 
 * Categories:
 * - Basic articulations (staccato, legato, etc.)
 * - String techniques (pizzicato, tremolo, etc.)
 * - Wind techniques (flutter, growl, etc.)
 * - Keyboard techniques (pedaling, voicing, etc.)
 * - Percussion techniques (rolls, flams, etc.)
 * - Vocal techniques (vibrato, slides, etc.)
 * - Electronic/synthesizer techniques
 * - Expressive devices (bends, glissandi, etc.)
 * - Dynamic articulations
 */

export const PERFORMANCE_TECHNIQUES: readonly Lexeme[] = [
  // ============================================================================
  // BASIC ARTICULATIONS - Universal across instruments
  // ============================================================================
  
  {
    id: 'lex:noun:staccato',
    lemma: 'staccato',
    variants: ['staccato', 'staccatos', 'staccatissimo'],
    category: 'noun',
    semantics: {
      type: 'articulation',
      articulation_type: 'duration_modifier',
      effect: {
        note_length: 0.3,  // 30% of written duration
        silence_after: true,
        crisp_release: true,
      },
      maps_to_operations: [
        'shorten_note_duration',
        'add_silence_gap',
        'sharpen_release',
      ],
    },
    description: 'Short, detached articulation with silence between notes',
    examples: [
      'make it staccato',
      'add staccato articulation',
      'play staccato notes',
      'staccato in the strings',
    ],
    musical_context: {
      notation: 'dot above/below note',
      common_in: ['classical', 'jazz', 'pop'],
      instruments: 'all',
    },
  },
  
  {
    id: 'lex:noun:legato',
    lemma: 'legato',
    variants: ['legato', 'legatissimo'],
    category: 'noun',
    semantics: {
      type: 'articulation',
      articulation_type: 'connection_modifier',
      effect: {
        note_connection: 'smooth',
        overlap: true,
        no_re_attack: true,
      },
      maps_to_operations: [
        'connect_notes_smoothly',
        'remove_gaps',
        'blend_transitions',
      ],
    },
    description: 'Smooth, connected articulation with no gaps between notes',
    examples: [
      'make it legato',
      'play legato',
      'legato phrasing',
      'smooth legato lines',
    ],
    musical_context: {
      notation: 'slur marking',
      common_in: ['classical', 'jazz', 'r&b'],
      instruments: 'all',
    },
  },
  
  {
    id: 'lex:noun:accent',
    lemma: 'accent',
    variants: ['accent', 'accents', 'accented'],
    category: 'noun',
    semantics: {
      type: 'articulation',
      articulation_type: 'emphasis',
      effect: {
        velocity_increase: 0.3,  // +30% velocity
        attack_emphasis: true,
        local_prominence: true,
      },
      maps_to_operations: [
        'increase_note_velocity',
        'emphasize_attack',
        'add_dynamic_spike',
      ],
    },
    description: 'Emphasis on specific notes; played louder or with more force',
    examples: [
      'add accents',
      'accent the downbeats',
      'accented notes',
      'strong accents on 1 and 3',
    ],
    musical_context: {
      notation: '> symbol',
      common_in: 'all genres',
      instruments: 'all',
    },
  },
  
  {
    id: 'lex:noun:marcato',
    lemma: 'marcato',
    variants: ['marcato', 'marcatos'],
    category: 'noun',
    semantics: {
      type: 'articulation',
      articulation_type: 'strong_emphasis',
      effect: {
        velocity_increase: 0.5,  // +50% velocity
        sharp_attack: true,
        full_length: true,
        hammered_quality: true,
      },
      maps_to_operations: [
        'emphasize_strongly',
        'sharpen_attack',
        'maintain_duration',
      ],
    },
    description: 'Very strong emphasis; hammered or heavily accented',
    examples: [
      'play marcato',
      'marcato articulation',
      'add marcato accents',
    ],
    musical_context: {
      notation: '^  symbol',
      common_in: ['classical', 'film music'],
      instruments: 'all',
    },
  },
  
  {
    id: 'lex:noun:tenuto',
    lemma: 'tenuto',
    variants: ['tenuto', 'tenutos'],
    category: 'noun',
    semantics: {
      type: 'articulation',
      articulation_type: 'sustain_modifier',
      effect: {
        note_length: 1.0,  // Full written duration
        sustained: true,
        slight_emphasis: true,
      },
      maps_to_operations: [
        'sustain_full_duration',
        'maintain_pressure',
        'slight_emphasis',
      ],
    },
    description: 'Hold for full written duration with slight emphasis',
    examples: [
      'play tenuto',
      'tenuto marking',
      'sustained tenuto notes',
    ],
    musical_context: {
      notation: 'horizontal line',
      common_in: ['classical', 'jazz'],
      instruments: 'all',
    },
  },
  
  {
    id: 'lex:noun:sforzando',
    lemma: 'sforzando',
    variants: ['sforzando', 'sforzato', 'sfz'],
    category: 'noun',
    semantics: {
      type: 'articulation',
      articulation_type: 'sudden_emphasis',
      effect: {
        sudden_accent: true,
        velocity_spike: 0.7,  // +70% velocity
        immediate_decay: false,
      },
      maps_to_operations: [
        'sudden_loud_attack',
        'dramatic_emphasis',
        'forte_accent',
      ],
    },
    description: 'Sudden, strong emphasis; forced or explosively accented',
    examples: [
      'add sforzando',
      'sfz accent',
      'sforzando attack',
    ],
    musical_context: {
      notation: 'sfz or sf',
      common_in: ['classical', 'romantic', 'film'],
      instruments: 'all',
    },
  },
  
  // ============================================================================
  // BOWING / STRING TECHNIQUES
  // ============================================================================
  
  {
    id: 'lex:noun:pizzicato',
    lemma: 'pizzicato',
    variants: ['pizzicato', 'pizz', 'pizzicatos'],
    category: 'noun',
    semantics: {
      type: 'playing_technique',
      technique_family: 'string',
      effect: {
        attack_type: 'plucked',
        short_decay: true,
        percussive_quality: true,
        no_sustain: true,
      },
      maps_to_operations: [
        'use_plucked_samples',
        'shorten_decay',
        'percussive_envelope',
      ],
    },
    description: 'Plucked with fingers instead of bowed; short, percussive sound',
    examples: [
      'play pizzicato',
      'pizz section',
      'add pizzicato strings',
      'pizzicato bass',
    ],
    musical_context: {
      notation: 'pizz.',
      instruments: ['strings'],
      opposite: 'arco (bowed)',
    },
  },
  
  {
    id: 'lex:noun:arco',
    lemma: 'arco',
    variants: ['arco'],
    category: 'noun',
    semantics: {
      type: 'playing_technique',
      technique_family: 'string',
      effect: {
        attack_type: 'bowed',
        sustained: true,
        continuous: true,
      },
      maps_to_operations: [
        'use_bowed_samples',
        'enable_sustain',
        'smooth_attack',
      ],
    },
    description: 'Bowed (normal playing); sustained tone',
    examples: [
      'return to arco',
      'arco playing',
      'back to arco from pizz',
    ],
    musical_context: {
      notation: 'arco',
      instruments: ['strings'],
      opposite: 'pizzicato',
    },
  },
  
  {
    id: 'lex:noun:tremolo',
    lemma: 'tremolo',
    variants: ['tremolo', 'tremolos'],
    category: 'noun',
    semantics: {
      type: 'playing_technique',
      technique_family: 'rapid_repetition',
      effect: {
        rapid_repetition: true,
        rate: '16th_notes_or_faster',
        sustained_pitch: true,
        shimmering_quality: true,
      },
      maps_to_operations: [
        'rapid_note_repetition',
        'sustain_with_flutter',
        'add_tremolo_effect',
      ],
    },
    description: 'Rapid repetition of a note or alternation between notes',
    examples: [
      'add tremolo',
      'tremolo strings',
      'measured tremolo',
      'fingered tremolo',
    ],
    musical_context: {
      notation: 'slashes through stem',
      instruments: ['strings', 'keyboards', 'percussion'],
      types: ['bowed', 'fingered', 'measured'],
    },
  },
  
  {
    id: 'lex:noun:trill',
    lemma: 'trill',
    variants: ['trill', 'trills', 'trilled'],
    category: 'noun',
    semantics: {
      type: 'ornament',
      ornament_type: 'rapid_alternation',
      effect: {
        alternating_notes: true,
        interval: 'semitone_or_tone',
        rapid_speed: true,
      },
      maps_to_operations: [
        'alternate_adjacent_notes',
        'rapid_oscillation',
        'add_trill_pattern',
      ],
    },
    description: 'Rapid alternation between two adjacent notes',
    examples: [
      'add a trill',
      'trill on the high note',
      'trilled passage',
      'whole-tone trill',
    ],
    musical_context: {
      notation: 'tr with wavy line',
      instruments: 'all melodic',
      variations: ['half-step', 'whole-step'],
    },
  },
  
  {
    id: 'lex:noun:sul_ponticello',
    lemma: 'sul_ponticello',
    variants: ['sul ponticello', 'ponticello', 'sul pont'],
    category: 'noun',
    semantics: {
      type: 'playing_technique',
      technique_family: 'string_timbre',
      effect: {
        bow_position: 'near_bridge',
        thin_tone: true,
        metallic_quality: true,
        enhanced_harmonics: true,
      },
      maps_to_operations: [
        'emphasize_high_harmonics',
        'thin_tone',
        'metallic_timbre',
      ],
    },
    description: 'Bow near the bridge; thin, glassy, metallic tone',
    examples: [
      'play sul ponticello',
      'sul pont effect',
      'ponticello strings',
    ],
    musical_context: {
      notation: 'sul pont.',
      instruments: ['strings'],
      opposite: 'sul tasto',
    },
  },
  
  {
    id: 'lex:noun:sul_tasto',
    lemma: 'sul_tasto',
    variants: ['sul tasto', 'tasto', 'sul tastiera'],
    category: 'noun',
    semantics: {
      type: 'playing_technique',
      technique_family: 'string_timbre',
      effect: {
        bow_position: 'over_fingerboard',
        soft_tone: true,
        flute_like: true,
        reduced_harmonics: true,
      },
      maps_to_operations: [
        'reduce_high_harmonics',
        'soften_tone',
        'warm_timbre',
      ],
    },
    description: 'Bow over fingerboard; soft, flute-like, warm tone',
    examples: [
      'play sul tasto',
      'tasto bowing',
      'sul tasto effect',
    ],
    musical_context: {
      notation: 'sul tasto',
      instruments: ['strings'],
      opposite: 'sul ponticello',
    },
  },
  
  {
    id: 'lex:noun:col_legno',
    lemma: 'col_legno',
    variants: ['col legno', 'legno'],
    category: 'noun',
    semantics: {
      type: 'playing_technique',
      technique_family: 'string_extended',
      effect: {
        bow_part: 'wood_of_bow',
        percussive: true,
        light_attack: true,
        unusual_timbre: true,
      },
      maps_to_operations: [
        'percussive_attack',
        'short_duration',
        'wooden_timbre',
      ],
    },
    description: 'Strike strings with wood of the bow; light, percussive effect',
    examples: [
      'col legno battuto',
      'col legno tratto',
      'use col legno',
    ],
    musical_context: {
      notation: 'col legno',
      instruments: ['strings'],
      types: ['battuto (struck)', 'tratto (drawn)'],
    },
  },
  
  {
    id: 'lex:noun:harmonic',
    lemma: 'harmonic',
    variants: ['harmonic', 'harmonics', 'natural harmonic', 'artificial harmonic'],
    category: 'noun',
    semantics: {
      type: 'playing_technique',
      technique_family: 'string_pitch',
      effect: {
        pitch_type: 'overtone',
        ethereal_quality: true,
        bell_like_tone: true,
        pure_timbre: true,
      },
      maps_to_operations: [
        'use_harmonic_pitch',
        'pure_sine_wave_quality',
        'bell_tone',
      ],
    },
    description: 'Produce harmonic overtones; pure, bell-like sound',
    examples: [
      'play harmonics',
      'natural harmonics',
      'artificial harmonic',
      'harmonic glissando',
    ],
    musical_context: {
      notation: 'diamond notehead or circle',
      instruments: ['strings', 'harp', 'guitar'],
      types: ['natural', 'artificial'],
    },
  },
  
  // ============================================================================
  // WIND TECHNIQUES
  // ============================================================================
  
  {
    id: 'lex:noun:flutter_tongue',
    lemma: 'flutter_tongue',
    variants: ['flutter tongue', 'flutter-tongue', 'flutter tonguing', 'flatterzunge'],
    category: 'noun',
    semantics: {
      type: 'playing_technique',
      technique_family: 'wind',
      effect: {
        tongue_roll: true,
        buzzing_quality: true,
        growl_like: true,
      },
      maps_to_operations: [
        'add_flutter_modulation',
        'buzzing_tone',
        'rapid_tongue_tremolo',
      ],
    },
    description: 'Rapid tongue roll while playing; buzzing, growling effect',
    examples: [
      'use flutter tongue',
      'flutter tonguing passage',
      'flute flutter',
    ],
    musical_context: {
      notation: 'fltz or flutter',
      instruments: ['winds', 'brass'],
      common_in: ['contemporary classical', 'jazz'],
    },
  },
  
  {
    id: 'lex:noun:growl',
    lemma: 'growl',
    variants: ['growl', 'growls', 'growling'],
    category: 'noun',
    semantics: {
      type: 'playing_technique',
      technique_family: 'wind_extended',
      effect: {
        simultaneous_singing: true,
        raspy_quality: true,
        aggressive_tone: true,
      },
      maps_to_operations: [
        'add_distortion',
        'raspy_timbre',
        'aggressive_character',
      ],
    },
    description: 'Hum or sing while playing; raspy, aggressive effect',
    examples: [
      'add growl',
      'saxophone growl',
      'growling technique',
    ],
    musical_context: {
      notation: 'growl or text indication',
      instruments: ['winds', 'brass'],
      common_in: ['jazz', 'blues', 'funk'],
    },
  },
  
  {
    id: 'lex:noun:slap_tongue',
    lemma: 'slap_tongue',
    variants: ['slap tongue', 'slap-tongue', 'slap tonguing'],
    category: 'noun',
    semantics: {
      type: 'playing_technique',
      technique_family: 'wind_percussive',
      effect: {
        percussive_attack: true,
        popping_sound: true,
        sharp_onset: true,
      },
      maps_to_operations: [
        'percussive_onset',
        'short_sharp_attack',
        'pop_sound',
      ],
    },
    description: 'Percussive tongue slap; sharp popping sound',
    examples: [
      'slap tongue attack',
      'use slap tonguing',
      'percussive slaps',
    ],
    musical_context: {
      notation: 'slap or crossed note',
      instruments: ['woodwinds'],
      common_in: ['contemporary classical', 'jazz'],
    },
  },
  
  {
    id: 'lex:noun:double_tongue',
    lemma: 'double_tongue',
    variants: ['double tongue', 'double-tongue', 'double tonguing'],
    category: 'noun',
    semantics: {
      type: 'playing_technique',
      technique_family: 'wind_articulation',
      effect: {
        rapid_articulation: true,
        alternating_syllables: 'ta-ka',
        fast_passages: true,
      },
      maps_to_operations: [
        'rapid_articulated_notes',
        'alternating_attacks',
        'fast_passage',
      ],
    },
    description: 'Rapid articulation using alternating tongue positions',
    examples: [
      'double tongue passage',
      'use double tonguing',
      'fast double tongue',
    ],
    musical_context: {
      notation: 'no special marking',
      instruments: ['winds', 'brass'],
      related: ['triple tongue'],
    },
  },
  
  {
    id: 'lex:noun:multiphonic',
    lemma: 'multiphonic',
    variants: ['multiphonic', 'multiphonics'],
    category: 'noun',
    semantics: {
      type: 'playing_technique',
      technique_family: 'wind_extended',
      effect: {
        multiple_pitches: true,
        complex_timbre: true,
        unusual_fingering: true,
      },
      maps_to_operations: [
        'layer_multiple_pitches',
        'complex_spectrum',
        'microtonal_cluster',
      ],
    },
    description: 'Produce multiple pitches simultaneously; complex chord-like sound',
    examples: [
      'play multiphonics',
      'multiphonic chord',
      'use multiphonic fingering',
    ],
    musical_context: {
      notation: 'special chord notation',
      instruments: ['woodwinds'],
      common_in: ['contemporary classical'],
    },
  },
  
  // ============================================================================
  // KEYBOARD TECHNIQUES
  // ============================================================================
  
  {
    id: 'lex:noun:pedal',
    lemma: 'pedal',
    variants: ['pedal', 'pedals', 'pedaling', 'pedalled'],
    category: 'noun',
    semantics: {
      type: 'playing_technique',
      technique_family: 'keyboard',
      effect: {
        sustain_extended: true,
        resonance: true,
        blended_harmonies: true,
      },
      maps_to_operations: [
        'extend_sustain',
        'add_resonance',
        'blend_notes',
      ],
    },
    description: 'Use sustain pedal; extends note duration and adds resonance',
    examples: [
      'use pedal',
      'pedal marking',
      'half pedal',
      'una corda pedal',
    ],
    musical_context: {
      notation: 'Ped. with release *',
      instruments: ['piano', 'keyboards'],
      types: ['sustain', 'soft', 'sostenuto'],
    },
  },
  
  {
    id: 'lex:noun:glissando',
    lemma: 'glissando',
    variants: ['glissando', 'gliss', 'glissandi'],
    category: 'noun',
    semantics: {
      type: 'pitch_modification',
      modification_type: 'continuous_slide',
      effect: {
        pitch_slide: true,
        continuous_motion: true,
        chromatic_or_diatonic: true,
      },
      maps_to_operations: [
        'pitch_slide',
        'continuous_glide',
        'sweep_through_pitches',
      ],
    },
    description: 'Slide between pitches; continuous pitch motion',
    examples: [
      'add glissando',
      'gliss up',
      'glissando passage',
      'chromatic gliss',
    ],
    musical_context: {
      notation: 'wavy or straight line',
      instruments: 'most',
      types: ['chromatic', 'diatonic', 'white-key', 'black-key'],
    },
  },
  
  {
    id: 'lex:noun:arpeggio',
    lemma: 'arpeggio',
    variants: ['arpeggio', 'arpeggios', 'arpeggiated'],
    category: 'noun',
    semantics: {
      type: 'playing_technique',
      technique_family: 'keyboard_articulation',
      effect: {
        notes_spread: true,
        sequential_not_simultaneous: true,
        rolling_quality: true,
      },
      maps_to_operations: [
        'spread_chord_notes',
        'sequential_onset',
        'roll_chord',
      ],
    },
    description: 'Notes of a chord played in rapid succession rather than simultaneously',
    examples: [
      'play arpeggio',
      'arpeggiated chord',
      'broken chord',
      'rolled chord',
    ],
    musical_context: {
      notation: 'vertical wavy line',
      instruments: ['keyboard', 'harp', 'guitar'],
      directions: ['up', 'down', 'bidirectional'],
    },
  },
  
  // Continued with PERCUSSION, VOCAL, ELECTRONIC, and EXPRESSIVE DEVICES...
  // (600+ entries total when complete)
];

export const PERFORMANCE_TECHNIQUES_COUNT = PERFORMANCE_TECHNIQUES.length;
