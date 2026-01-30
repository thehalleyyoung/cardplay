/**
 * GOFAI Lexeme Classes — Production Terms Batch 1
 *
 * Lexeme classes for production and mixing terms (width, brightness,
 * punch, warmth, presence, clarity, etc.) that map either to
 * arrangement levers or DSP levers.
 *
 * Step 123 [NLP][Sem] of gofai_goalA.md — Batch 1 of N
 *
 * @module gofai/canon/production-terms-batch1
 */

import type { DomainNounLexeme } from './types';

// =============================================================================
// Spectral / Tonal Character Terms
// =============================================================================

const BRIGHTNESS: DomainNounLexeme = {
  id: 'noun:prod:brightness',
  term: 'brightness',
  variants: [
    'bright',
    'brighter',
    'brilliance',
    'sparkle',
    'shimmer',
    'air',
    'airy',
    'presence peak',
    'top end',
  ],
  category: 'production_term',
  definition:
    'The perceived amount of high-frequency energy in a sound. Brighter sounds have more treble content. Can be achieved via EQ, arrangement (instrument choice), or synthesis.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'spectral_character',
    mapping: {
      axis: 'brightness',
      direction: 'increase',
      arrangement_levers: ['instrument_selection', 'register_choice', 'voicing_openness'],
      dsp_levers: ['high_shelf_eq', 'presence_boost', 'exciter', 'filter_cutoff'],
      frequency_region: 'high',
      frequency_range_hz: [4000, 20000],
    },
  },
  examples: [
    'Make it brighter',
    'Add more sparkle to the mix',
    'The top end needs more air',
    'Boost the brilliance',
  ],
};

const DARKNESS: DomainNounLexeme = {
  id: 'noun:prod:darkness',
  term: 'darkness',
  variants: [
    'dark',
    'darker',
    'dull',
    'muffled',
    'subdued',
    'rolled off',
    'woolly',
    'thick',
  ],
  category: 'production_term',
  definition:
    'The perceived lack of high-frequency energy, creating a warm, intimate, or heavy character. The opposite pole of brightness.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'spectral_character',
    mapping: {
      axis: 'brightness',
      direction: 'decrease',
      arrangement_levers: ['instrument_selection', 'lower_register', 'closed_voicing'],
      dsp_levers: ['low_pass_filter', 'high_shelf_cut', 'tape_saturation'],
      frequency_region: 'high_cut',
    },
  },
  examples: [
    'Make it darker',
    'The mix sounds too dull',
    'Roll off the top end',
    'The muffled quality is intentional',
  ],
};

const WARMTH: DomainNounLexeme = {
  id: 'noun:prod:warmth',
  term: 'warmth',
  variants: [
    'warm',
    'warmer',
    'warmness',
    'round',
    'rounded',
    'fat',
    'rich',
    'full-bodied',
    'analog warmth',
  ],
  category: 'production_term',
  definition:
    'A pleasing emphasis in the low-mid frequency range (200-800 Hz) combined with gentle high-frequency rolloff, creating a comforting, enveloping sonic character.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'spectral_character',
    mapping: {
      axis: 'warmth',
      direction: 'increase',
      arrangement_levers: ['instrument_selection', 'voicing_density', 'lower_register'],
      dsp_levers: ['low_mid_boost', 'tube_saturation', 'tape_emulation', 'gentle_compression'],
      frequency_region: 'low_mid',
      frequency_range_hz: [200, 800],
    },
  },
  examples: [
    'Make it warmer',
    'The mix needs more warmth',
    'Add analog warmth to the track',
    'The sound should be rounder',
  ],
};

const HARSHNESS: DomainNounLexeme = {
  id: 'noun:prod:harshness',
  term: 'harshness',
  variants: [
    'harsh',
    'brittle',
    'piercing',
    'strident',
    'sibilant',
    'shrill',
    'ice-picky',
    'aggressive highs',
  ],
  category: 'production_term',
  definition:
    'An unpleasant emphasis in the upper-mid to high frequency range (2-6 kHz) that causes listener fatigue. Often an unwanted artifact of digital processing or bright sources.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'spectral_problem',
    mapping: {
      axis: 'harshness',
      direction: 'presence',
      dsp_levers: ['notch_eq', 'de_esser', 'dynamic_eq', 'saturation_warmth'],
      frequency_region: 'upper_mid',
      frequency_range_hz: [2000, 6000],
      polarity: 'negative',
    },
  },
  examples: [
    'Reduce the harshness',
    'The vocals are too harsh',
    'Tame the sibilance',
    'The highs are piercing',
  ],
};

const MUDDINESS: DomainNounLexeme = {
  id: 'noun:prod:muddiness',
  term: 'muddiness',
  variants: [
    'muddy',
    'boomy',
    'tubby',
    'congested',
    'cloudy',
    'undefined',
    'low-mid buildup',
  ],
  category: 'production_term',
  definition:
    'An unwanted accumulation of low-mid frequency energy (200-500 Hz) that obscures clarity and definition. A common mixing problem in dense arrangements.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'spectral_problem',
    mapping: {
      axis: 'clarity',
      direction: 'decrease',
      dsp_levers: ['low_mid_cut', 'high_pass_filter', 'multiband_compression'],
      arrangement_levers: ['reduce_low_mid_instruments', 'thin_voicings', 'raise_register'],
      frequency_region: 'low_mid',
      frequency_range_hz: [200, 500],
      polarity: 'negative',
    },
  },
  examples: [
    'The mix is too muddy',
    'Clean up the muddiness',
    'The low mids are congested',
    'Cut the boom on the guitar',
  ],
};

const PRESENCE: DomainNounLexeme = {
  id: 'noun:prod:presence',
  term: 'presence',
  variants: [
    'present',
    'forward',
    'in your face',
    'upfront',
    'immediacy',
    'close',
    'intimate presence',
  ],
  category: 'production_term',
  definition:
    'The quality of a sound source seeming close and prominent, as if it is right in front of the listener. Achieved through upper-mid emphasis, compression, and spatial positioning.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'spectral_character',
    mapping: {
      axis: 'presence',
      direction: 'increase',
      dsp_levers: ['upper_mid_boost', 'compression', 'dry_mix', 'close_mic'],
      frequency_region: 'upper_mid',
      frequency_range_hz: [2000, 5000],
    },
  },
  examples: [
    'Give the vocal more presence',
    'The guitar should be more upfront',
    'Add more immediacy to the lead',
    'The mix needs more presence in the mids',
  ],
};

const CLARITY: DomainNounLexeme = {
  id: 'noun:prod:clarity',
  term: 'clarity',
  variants: [
    'clear',
    'clearer',
    'defined',
    'definition',
    'articulate',
    'clean',
    'transparent',
    'intelligible',
  ],
  category: 'production_term',
  definition:
    'The quality of individual elements being distinct and well-separated in a mix. Achieved through EQ separation, panning, dynamic control, and arrangement spacing.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'mix_quality',
    mapping: {
      axis: 'clarity',
      direction: 'increase',
      arrangement_levers: ['reduce_density', 'frequency_separation', 'register_spacing'],
      dsp_levers: ['eq_carving', 'compression', 'gating', 'transient_shaping'],
    },
  },
  examples: [
    'Improve the clarity of the mix',
    'The bass needs more definition',
    'Make the vocals clearer',
    'The mix should be more transparent',
  ],
};

// =============================================================================
// Dynamic / Impact Terms
// =============================================================================

const PUNCH: DomainNounLexeme = {
  id: 'noun:prod:punch',
  term: 'punch',
  variants: [
    'punchy',
    'punchier',
    'impact',
    'hit',
    'thump',
    'attack',
    'snap',
    'crack',
    'transient impact',
  ],
  category: 'production_term',
  definition:
    'The perceived power of a sound\'s attack/transient, creating a sense of physical impact. Punchy sounds have strong, well-defined transients that cut through a mix.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'dynamic_character',
    mapping: {
      axis: 'punch',
      direction: 'increase',
      dsp_levers: ['transient_shaper', 'parallel_compression', 'fast_attack_compressor', 'eq_presence'],
      arrangement_levers: ['rhythmic_clarity', 'sparse_around_hits'],
    },
  },
  examples: [
    'Make the kick punchier',
    'The snare needs more crack',
    'Add punch to the drums',
    'The transient impact should be stronger',
  ],
};

const COMPRESSION_TERM: DomainNounLexeme = {
  id: 'noun:prod:compression',
  term: 'compression',
  variants: [
    'compressed',
    'squashed',
    'crushed',
    'limited',
    'dynamic control',
    'leveling',
    'glue',
    'bus compression',
  ],
  category: 'production_term',
  definition:
    'The reduction of dynamic range, making quiet parts louder and loud parts softer. Used for consistency, punch, glue, loudness, and creative pumping effects.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'dynamics_processing',
    mapping: {
      axis: 'compression',
      dsp_levers: ['compressor', 'limiter', 'multiband_compressor', 'bus_compressor'],
      parameters: ['threshold', 'ratio', 'attack', 'release', 'knee', 'makeup_gain'],
      creative_uses: ['pumping', 'glue', 'sustain', 'parallel'],
    },
  },
  examples: [
    'Add more compression to the vocals',
    'The mix is too compressed',
    'Use bus compression to glue the drums',
    'The vocals need more dynamic control',
  ],
};

const LOUDNESS: DomainNounLexeme = {
  id: 'noun:prod:loudness',
  term: 'loudness',
  variants: [
    'loud',
    'louder',
    'volume',
    'level',
    'gain',
    'hot',
    'cranked',
    'pushed',
  ],
  category: 'production_term',
  definition:
    'The perceived intensity of a sound, determined by amplitude, spectral content, and dynamic processing. Distinguished from perceived "volume" which is more about mix level.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'level',
    mapping: {
      axis: 'loudness',
      direction: 'increase',
      dsp_levers: ['gain', 'compressor', 'limiter', 'maximizer', 'saturation'],
      measurement: ['dBFS', 'LUFS', 'dBSPL'],
    },
  },
  examples: [
    'Make it louder',
    'The master is too hot',
    'Push the level up',
    'The loudness should match the reference',
  ],
};

const SUSTAIN: DomainNounLexeme = {
  id: 'noun:prod:sustain',
  term: 'sustain',
  variants: [
    'sustain time',
    'sustaining',
    'ring',
    'decay',
    'ringing',
    'hold',
    'sustained',
    'ring out',
  ],
  category: 'production_term',
  definition:
    'How long a sound maintains its level after the initial attack. Long sustain creates smooth, flowing textures; short sustain creates percussive, rhythmic character.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'envelope',
    mapping: {
      axis: 'sustain',
      envelope_stage: 'sustain',
      dsp_levers: ['compressor', 'sustainer_pedal', 'feedback', 'reverb'],
      affects: ['perceived_smoothness', 'note_overlap', 'rhythmic_definition'],
    },
  },
  examples: [
    'Add more sustain to the guitar',
    'Let the notes ring out longer',
    'The sustain is too long',
    'Shorten the decay for a tighter feel',
  ],
};

// =============================================================================
// Spatial / Stereo Terms
// =============================================================================

const WIDTH: DomainNounLexeme = {
  id: 'noun:prod:width',
  term: 'width',
  variants: [
    'wide',
    'wider',
    'stereo width',
    'stereo spread',
    'panorama',
    'spacious',
    'immersive',
    'spread',
    'expansive',
  ],
  category: 'production_term',
  definition:
    'The perceived horizontal spread of a sound across the stereo field. Wide mixes feel expansive and immersive; narrow mixes feel focused and mono-compatible.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'spatial',
    mapping: {
      axis: 'width',
      direction: 'increase',
      arrangement_levers: ['double_tracking', 'contrary_motion', 'register_spread'],
      dsp_levers: ['stereo_widener', 'pan_spread', 'mid_side_eq', 'haas_effect', 'chorus'],
    },
  },
  examples: [
    'Make the chorus wider',
    'Widen the stereo spread',
    'The mix should be more spacious',
    'Pan the guitars wider',
  ],
};

const DEPTH: DomainNounLexeme = {
  id: 'noun:prod:depth',
  term: 'depth',
  variants: [
    'deep',
    'deeper',
    'front-to-back depth',
    '3D',
    'three-dimensional',
    'dimensional',
    'distance',
  ],
  category: 'production_term',
  definition:
    'The perceived front-to-back distance in a mix, creating a sense of three-dimensional space. Achieved through reverb, delay, EQ rolloff, and level differences.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'spatial',
    mapping: {
      axis: 'depth',
      direction: 'increase',
      dsp_levers: ['reverb', 'delay', 'high_frequency_rolloff', 'level_reduction', 'pre_delay'],
    },
  },
  examples: [
    'Add more depth to the mix',
    'Push the pads further back',
    'The mix needs more front-to-back depth',
    'Create a three-dimensional soundscape',
  ],
};

const PANNING: DomainNounLexeme = {
  id: 'noun:prod:panning',
  term: 'panning',
  variants: [
    'pan',
    'stereo placement',
    'left-right placement',
    'pan position',
    'panned',
    'hard-panned',
    'center',
  ],
  category: 'production_term',
  definition:
    'The left-right positioning of a sound in the stereo field. Strategic panning creates separation, width, and spatial clarity in a mix.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'spatial',
    mapping: {
      axis: 'pan',
      positions: ['hard_left', 'left', 'center_left', 'center', 'center_right', 'right', 'hard_right'],
      conventions: {
        center: ['vocals', 'kick', 'snare', 'bass'],
        panned: ['guitars', 'keys', 'toms', 'percussion', 'backing_vocals'],
      },
    },
  },
  examples: [
    'Pan the guitar to the left',
    'Center the vocals',
    'Hard-pan the rhythm guitars',
    'The panning should be wider',
  ],
};

const REVERB_TERM: DomainNounLexeme = {
  id: 'noun:prod:reverb',
  term: 'reverb',
  variants: [
    'reverberation',
    'room',
    'hall',
    'plate reverb',
    'spring reverb',
    'ambience',
    'room sound',
    'space',
    'verb',
  ],
  category: 'production_term',
  definition:
    'The simulation or capture of acoustic reflections that create a sense of physical space. Different reverb types (hall, room, plate, spring) create distinct spatial characters.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'spatial_effect',
    mapping: {
      axis: 'space',
      dsp_levers: ['algorithmic_reverb', 'convolution_reverb', 'plate', 'spring', 'shimmer'],
      parameters: ['decay_time', 'pre_delay', 'damping', 'size', 'wet_dry'],
      types: ['hall', 'room', 'chamber', 'plate', 'spring', 'shimmer', 'gated'],
    },
  },
  examples: [
    'Add more reverb to the vocals',
    'Use a plate reverb on the snare',
    'The room sound is too big',
    'The reverb tail is too long',
  ],
};

const DELAY_TERM: DomainNounLexeme = {
  id: 'noun:prod:delay',
  term: 'delay',
  variants: [
    'echo',
    'repeat',
    'slapback',
    'tape delay',
    'ping-pong delay',
    'dotted eighth delay',
    'feedback delay',
  ],
  category: 'production_term',
  definition:
    'A time-based effect that repeats the input signal after a specified time. Creates rhythmic interest, spatial depth, and textural density.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'time_effect',
    mapping: {
      dsp_levers: ['digital_delay', 'tape_delay', 'analog_delay', 'granular_delay'],
      parameters: ['delay_time', 'feedback', 'wet_dry', 'filter', 'modulation'],
      types: ['slapback', 'quarter_note', 'dotted_eighth', 'ping_pong', 'multi_tap'],
    },
  },
  examples: [
    'Add a dotted eighth delay to the vocal',
    'The echo should be more subtle',
    'Use ping-pong delay on the guitar',
    'The tape delay adds warmth',
  ],
};

// =============================================================================
// Saturation and Distortion Terms
// =============================================================================

const SATURATION: DomainNounLexeme = {
  id: 'noun:prod:saturation',
  term: 'saturation',
  variants: [
    'saturated',
    'driven',
    'overdrive',
    'tube saturation',
    'tape saturation',
    'analog saturation',
    'harmonic saturation',
  ],
  category: 'production_term',
  definition:
    'Gentle nonlinear distortion that adds harmonics, warmth, and perceived loudness. Types include tube (odd harmonics), tape (even harmonics), and transistor clipping.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'harmonic_processing',
    mapping: {
      axis: 'saturation',
      direction: 'increase',
      dsp_levers: ['tube_emulation', 'tape_emulation', 'soft_clipping', 'waveshaper'],
      types: ['tube', 'tape', 'transistor', 'digital'],
      adds: ['harmonics', 'warmth', 'presence', 'perceived_loudness'],
    },
  },
  examples: [
    'Add some saturation to the drums',
    'The bass needs more drive',
    'Use tape saturation for warmth',
    'The analog saturation makes it thicker',
  ],
};

const DISTORTION: DomainNounLexeme = {
  id: 'noun:prod:distortion',
  term: 'distortion',
  variants: [
    'distorted',
    'fuzz',
    'clipping',
    'crunch',
    'heavy distortion',
    'gain',
    'dirty',
    'gritty',
    'lo-fi',
  ],
  category: 'production_term',
  definition:
    'Heavy nonlinear processing that dramatically alters the harmonic content of a signal. Ranges from gentle crunch to extreme fuzz. A defining element of rock, metal, and electronic music.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'harmonic_processing',
    mapping: {
      axis: 'distortion',
      direction: 'increase',
      dsp_levers: ['overdrive', 'distortion_pedal', 'fuzz', 'bitcrusher', 'wavefolder'],
      types: ['crunch', 'overdrive', 'distortion', 'fuzz', 'bitcrush'],
      genres: ['rock', 'metal', 'electronic', 'lo_fi'],
    },
  },
  examples: [
    'Add more distortion to the guitar',
    'The fuzz should be heavier',
    'Make it crunchier',
    'The lo-fi distortion adds character',
  ],
};

// =============================================================================
// Filtering and EQ Terms
// =============================================================================

const EQ_TERM: DomainNounLexeme = {
  id: 'noun:prod:eq',
  term: 'EQ',
  variants: [
    'equalization',
    'equalizer',
    'tone control',
    'frequency adjustment',
    'tonal shaping',
    'spectral shaping',
  ],
  category: 'production_term',
  definition:
    'The process of adjusting the balance of frequency components in audio. The most fundamental mixing tool for shaping tone and creating separation.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'spectral_processing',
    mapping: {
      dsp_levers: ['parametric_eq', 'graphic_eq', 'dynamic_eq', 'linear_phase_eq'],
      operations: ['boost', 'cut', 'shelf', 'notch', 'high_pass', 'low_pass'],
      parameters: ['frequency', 'gain', 'q_bandwidth', 'slope'],
    },
  },
  examples: [
    'EQ out the mud',
    'Boost the presence with EQ',
    'Use a high-pass filter on the guitar',
    'The EQ needs more low-end cut',
  ],
};

const HIGH_PASS: DomainNounLexeme = {
  id: 'noun:prod:high_pass',
  term: 'high-pass filter',
  variants: [
    'HPF',
    'high pass',
    'low cut',
    'bass cut',
    'rumble filter',
    'roll off the lows',
  ],
  category: 'production_term',
  definition:
    'A filter that allows frequencies above a cutoff point to pass while attenuating lower frequencies. Essential for removing unwanted low-end rumble and creating mix clarity.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'filter',
    mapping: {
      filter_type: 'high_pass',
      removes: 'low_frequencies',
      purpose: ['rumble_removal', 'clarity', 'headroom'],
      parameters: ['cutoff_frequency', 'slope'],
    },
  },
  examples: [
    'Put a high-pass filter on the vocal',
    'Roll off everything below 80 Hz',
    'HPF the guitars',
    'Cut the bass rumble',
  ],
};

const LOW_PASS: DomainNounLexeme = {
  id: 'noun:prod:low_pass',
  term: 'low-pass filter',
  variants: [
    'LPF',
    'low pass',
    'high cut',
    'treble cut',
    'darken filter',
    'roll off the highs',
  ],
  category: 'production_term',
  definition:
    'A filter that allows frequencies below a cutoff point to pass while attenuating higher frequencies. Used for darkening sounds, creating distance, and taming harsh content.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'filter',
    mapping: {
      filter_type: 'low_pass',
      removes: 'high_frequencies',
      purpose: ['darkening', 'distance_simulation', 'harshness_reduction'],
      parameters: ['cutoff_frequency', 'slope', 'resonance'],
    },
  },
  examples: [
    'Low-pass filter the synth',
    'Roll off the highs for distance',
    'LPF to darken the sound',
    'Cut everything above 8kHz',
  ],
};

// =============================================================================
// Modulation Effect Terms
// =============================================================================

const CHORUS_EFFECT: DomainNounLexeme = {
  id: 'noun:prod:chorus_effect',
  term: 'chorus effect',
  variants: [
    'chorus',
    'chorusing',
    'ensemble effect',
    'thickening',
    'doubling effect',
  ],
  category: 'production_term',
  definition:
    'A modulation effect that creates copies of a signal with slight pitch and time variations, simulating multiple performers. Creates width, richness, and ensemble quality.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'modulation_effect',
    mapping: {
      dsp_levers: ['chorus_pedal', 'ensemble_effect', 'unison_detune'],
      parameters: ['rate', 'depth', 'voices', 'wet_dry'],
      creates: ['width', 'richness', 'movement'],
    },
  },
  examples: [
    'Add chorus to the clean guitar',
    'The chorus effect makes it wider',
    'Use a subtle chorusing effect',
    'The ensemble effect thickens the strings',
  ],
};

const PHASER_EFFECT: DomainNounLexeme = {
  id: 'noun:prod:phaser',
  term: 'phaser',
  variants: [
    'phase shifter',
    'phasing',
    'sweeping phase',
    'jet sound',
  ],
  category: 'production_term',
  definition:
    'A modulation effect using phase-shifted copies of a signal to create sweeping notches in the frequency spectrum. Creates a swirling, jet-like character.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'modulation_effect',
    mapping: {
      dsp_levers: ['phaser_pedal', 'all_pass_filter_chain'],
      parameters: ['rate', 'depth', 'stages', 'feedback', 'wet_dry'],
      creates: ['sweeping', 'movement', 'psychedelic_character'],
    },
  },
  examples: [
    'Add phaser to the rhythm guitar',
    'The phasing effect should be slower',
    'Use a subtle phaser',
    'The sweeping phase adds movement',
  ],
};

const FLANGER_EFFECT: DomainNounLexeme = {
  id: 'noun:prod:flanger',
  term: 'flanger',
  variants: [
    'flanging',
    'jet flanging',
    'through-zero flanger',
    'metallic sweep',
  ],
  category: 'production_term',
  definition:
    'A modulation effect similar to chorus but with shorter delay times and feedback, creating a more metallic, jet-engine-like sweeping effect.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'modulation_effect',
    mapping: {
      dsp_levers: ['flanger_pedal', 'short_modulated_delay'],
      parameters: ['rate', 'depth', 'feedback', 'wet_dry'],
      creates: ['metallic_sweep', 'jet_effect', 'comb_filtering'],
    },
  },
  examples: [
    'Add flanging to the snare',
    'The flanger should be more extreme',
    'Use through-zero flanging',
    'The metallic sweep is too obvious',
  ],
};

// =============================================================================
// Mix Balance Terms
// =============================================================================

const SEPARATION: DomainNounLexeme = {
  id: 'noun:prod:separation',
  term: 'separation',
  variants: [
    'mix separation',
    'instrument separation',
    'frequency separation',
    'distinct',
    'carved out',
    'carved space',
  ],
  category: 'production_term',
  definition:
    'The ability to hear each element distinctly in a mix without masking or blurring. Achieved through EQ carving, panning, dynamics, and arrangement choices.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'mix_quality',
    mapping: {
      axis: 'separation',
      direction: 'increase',
      dsp_levers: ['eq_carving', 'panning', 'sidechain_compression', 'dynamic_eq'],
      arrangement_levers: ['register_spacing', 'rhythmic_interleaving', 'thinning'],
    },
  },
  examples: [
    'The mix needs more separation',
    'Carve out space for the vocal',
    'The instruments are bleeding into each other',
    'Create more frequency separation',
  ],
};

const BALANCE: DomainNounLexeme = {
  id: 'noun:prod:balance',
  term: 'balance',
  variants: [
    'mix balance',
    'level balance',
    'fader balance',
    'relative levels',
    'balanced',
    'well-balanced',
  ],
  category: 'production_term',
  definition:
    'The relative volume relationships between all elements in a mix. Good balance ensures all elements are audible and appropriately prominent for the genre.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'mix_quality',
    mapping: {
      axis: 'balance',
      affects: ['level', 'perceived_importance', 'genre_appropriateness'],
    },
  },
  examples: [
    'The mix balance needs work',
    'Balance the vocals with the instruments',
    'The levels are unbalanced',
    'Get a better fader balance',
  ],
};

const HEADROOM: DomainNounLexeme = {
  id: 'noun:prod:headroom',
  term: 'headroom',
  variants: [
    'dynamic headroom',
    'ceiling',
    'overhead',
    'peak headroom',
    'margin',
  ],
  category: 'production_term',
  definition:
    'The amount of level available between the current signal peak and the maximum before clipping/distortion. Adequate headroom is essential for clean mixing and mastering.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'level_management',
    mapping: {
      measurement: 'dBFS_below_zero',
      typical_target: { mixing: -6, mastering: -1 },
    },
  },
  examples: [
    'Leave enough headroom for mastering',
    'The mix is peaking too high, no headroom',
    'Keep 6 dB of headroom',
    'The dynamic headroom is too tight',
  ],
};

const SIDECHAIN: DomainNounLexeme = {
  id: 'noun:prod:sidechain',
  term: 'sidechain',
  variants: [
    'sidechain compression',
    'ducking',
    'pumping',
    'sidechain pump',
    'sidechained',
    'SC compression',
  ],
  category: 'production_term',
  definition:
    'A compression technique where one signal controls the compressor acting on another signal. Creates rhythmic pumping effects and ensures elements like kick and bass don\'t compete.',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'dynamics_technique',
    mapping: {
      dsp_levers: ['sidechain_compressor', 'ducker', 'volume_shaper'],
      common_pairs: { trigger: 'kick', target: ['bass', 'pad', 'synth'] },
      creative_uses: ['pumping_effect', 'frequency_ducking', 'vocal_clarity'],
    },
  },
  examples: [
    'Sidechain the bass to the kick',
    'The pumping effect is too strong',
    'Add sidechain compression on the pad',
    'Duck the synth when the vocal comes in',
  ],
};

// =============================================================================
// Export — All production term lexemes from this batch
// =============================================================================

export const PRODUCTION_TERM_LEXEMES_BATCH1: readonly DomainNounLexeme[] = [
  // Spectral / tonal
  BRIGHTNESS,
  DARKNESS,
  WARMTH,
  HARSHNESS,
  MUDDINESS,
  PRESENCE,
  CLARITY,
  // Dynamic / impact
  PUNCH,
  COMPRESSION_TERM,
  LOUDNESS,
  SUSTAIN,
  // Spatial / stereo
  WIDTH,
  DEPTH,
  PANNING,
  REVERB_TERM,
  DELAY_TERM,
  // Saturation and distortion
  SATURATION,
  DISTORTION,
  // Filtering and EQ
  EQ_TERM,
  HIGH_PASS,
  LOW_PASS,
  // Modulation effects
  CHORUS_EFFECT,
  PHASER_EFFECT,
  FLANGER_EFFECT,
  // Mix balance
  SEPARATION,
  BALANCE,
  HEADROOM,
  SIDECHAIN,
];

export default PRODUCTION_TERM_LEXEMES_BATCH1;

/**
 * Statistics for this batch.
 */
export function getProductionTermBatch1Stats(): {
  total: number;
  categories: Record<string, number>;
  totalVariants: number;
} {
  const categories: Record<string, number> = {};
  let totalVariants = 0;

  for (const lexeme of PRODUCTION_TERM_LEXEMES_BATCH1) {
    categories[lexeme.category] = (categories[lexeme.category] ?? 0) + 1;
    totalVariants += lexeme.variants.length;
  }

  return {
    total: PRODUCTION_TERM_LEXEMES_BATCH1.length,
    categories,
    totalVariants,
  };
}
