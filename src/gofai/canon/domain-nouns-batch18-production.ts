/**
 * GOFAI Domain Nouns — Batch 18: Audio Production & Mixing
 *
 * Comprehensive vocabulary for audio production, mixing, mastering,
 * and studio terminology. Enables natural language control of production
 * parameters and mixing decisions.
 *
 * @module gofai/canon/domain-nouns-batch18-production
 */

import type { DomainNounLexeme } from './types';

// =============================================================================
// Frequency & EQ
// =============================================================================

const SUB_BASS: DomainNounLexeme = {
  id: 'noun:sub_bass',
  term: 'sub bass',
  variants: ['sub', 'low end', 'subsonic'],
  category: 'frequency_range',
  definition: 'Frequencies below 60 Hz',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'frequency',
    mapping: {
      axis: 'frequency',
      range: [20, 60],
      affects: ['eq', 'filter'],
    },
  },
  examples: [
    'Boost the sub bass',
    'Cut sub on everything except bass',
    'Add more sub frequencies',
  ],
};

const BASS: DomainNounLexeme = {
  id: 'noun:bass_freq',
  term: 'bass',
  variants: ['low frequencies', 'lows', 'bottom end'],
  category: 'frequency_range',
  definition: 'Frequencies from 60-250 Hz',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'frequency',
    mapping: {
      axis: 'frequency',
      range: [60, 250],
      affects: ['eq', 'filter'],
    },
  },
  examples: [
    'Increase bass frequencies',
    'The lows are too muddy',
    'Cut some bass',
  ],
};

const MIDS: DomainNounLexeme = {
  id: 'noun:mids',
  term: 'mids',
  variants: ['midrange', 'mid frequencies', 'middle'],
  category: 'frequency_range',
  definition: 'Frequencies from 250 Hz - 4 kHz',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'frequency',
    mapping: {
      axis: 'frequency',
      range: [250, 4000],
      affects: ['eq', 'filter'],
    },
  },
  examples: [
    'Boost the mids',
    'Cut midrange mud',
    'The mids are too prominent',
  ],
};

const HIGHS: DomainNounLexeme = {
  id: 'noun:highs',
  term: 'highs',
  variants: ['high frequencies', 'treble', 'top end'],
  category: 'frequency_range',
  definition: 'Frequencies from 4 kHz - 12 kHz',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'frequency',
    mapping: {
      axis: 'frequency',
      range: [4000, 12000],
      affects: ['eq', 'filter'],
    },
  },
  examples: [
    'Add more highs',
    'The treble is too harsh',
    'Boost high frequencies',
  ],
};

const AIR: DomainNounLexeme = {
  id: 'noun:air',
  term: 'air',
  variants: ['air band', 'brilliance', 'sheen'],
  category: 'frequency_range',
  definition: 'Very high frequencies above 12 kHz',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'frequency',
    mapping: {
      axis: 'brightness',
      range: [12000, 20000],
      affects: ['eq', 'presence'],
    },
  },
  examples: [
    'Add air to the mix',
    'Boost the air band',
    'The top needs more air',
  ],
};

const MUD: DomainNounLexeme = {
  id: 'noun:mud',
  term: 'mud',
  variants: ['muddy', 'muddiness', 'boxy'],
  category: 'frequency_issue',
  definition: 'Excessive low-mid frequencies (200-500 Hz)',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'frequency_problem',
    mapping: {
      axis: 'clarity',
      direction: 'decrease',
      affects: ['eq'],
    },
  },
  examples: [
    'Remove the mud',
    'Cut the muddy frequencies',
    'Clean up the muddiness',
  ],
};

const BOXINESS: DomainNounLexeme = {
  id: 'noun:boxiness',
  term: 'boxiness',
  variants: ['boxy', 'hollow', 'cardboard'],
  category: 'frequency_issue',
  definition: 'Resonance around 400-800 Hz',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'frequency_problem',
    mapping: {
      axis: 'clarity',
      direction: 'decrease',
      affects: ['eq'],
    },
  },
  examples: [
    'Remove boxiness',
    'The vocal sounds boxy',
    'Cut the hollow frequencies',
  ],
};

const HARSHNESS: DomainNounLexeme = {
  id: 'noun:harshness',
  term: 'harshness',
  variants: ['harsh', 'brittle', 'edgy'],
  category: 'frequency_issue',
  definition: 'Excessive energy around 3-5 kHz',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'frequency_problem',
    mapping: {
      axis: 'brightness',
      direction: 'decrease',
      affects: ['eq', 'de-essing'],
    },
  },
  examples: [
    'Reduce harshness',
    'The mix sounds harsh',
    'Tame the brittle highs',
  ],
};

const SIBILANCE: DomainNounLexeme = {
  id: 'noun:sibilance',
  term: 'sibilance',
  variants: ['sibilant', 'esses', 's sounds'],
  category: 'frequency_issue',
  definition: 'Excessive high frequency consonants (6-8 kHz)',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'frequency_problem',
    mapping: {
      axis: 'brightness',
      direction: 'control',
      affects: ['de-esser'],
    },
  },
  examples: [
    'Control sibilance',
    'De-ess the vocal',
    'Reduce harsh s sounds',
  ],
};

// =============================================================================
// Dynamics Processing
// =============================================================================

const COMPRESSION: DomainNounLexeme = {
  id: 'noun:compression',
  term: 'compression',
  variants: ['compressor', 'dynamic control'],
  category: 'dynamics',
  definition: 'Reduction of dynamic range',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'dynamics_control',
    mapping: {
      axis: 'dynamics',
      affects: ['compressor'],
    },
  },
  examples: [
    'Add compression',
    'Increase compression ratio',
    'The drums need compression',
  ],
};

const LIMITING: DomainNounLexeme = {
  id: 'noun:limiting',
  term: 'limiting',
  variants: ['limiter', 'peak limiting', 'brick wall'],
  category: 'dynamics',
  definition: 'Hard ceiling on signal level',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'peak_control',
    mapping: {
      axis: 'loudness',
      affects: ['limiter'],
    },
  },
  examples: [
    'Apply limiting',
    'The master needs a limiter',
    'Add peak limiting',
  ],
};

const EXPANSION: DomainNounLexeme = {
  id: 'noun:expansion',
  term: 'expansion',
  variants: ['expander', 'upward expansion'],
  category: 'dynamics',
  definition: 'Increase dynamic range of loud signals',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'dynamics_enhancement',
    mapping: {
      axis: 'dynamics',
      affects: ['expander'],
    },
  },
  examples: [
    'Add expansion',
    'Use upward expansion',
    'Expand the transients',
  ],
};

const GATING: DomainNounLexeme = {
  id: 'noun:gating',
  term: 'gating',
  variants: ['gate', 'noise gate'],
  category: 'dynamics',
  definition: 'Silencing of signals below threshold',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'noise_reduction',
    mapping: {
      axis: 'clarity',
      affects: ['gate'],
    },
  },
  examples: [
    'Apply gating',
    'Gate the drums',
    'Add a noise gate',
  ],
};

const SIDE_CHAIN: DomainNounLexeme = {
  id: 'noun:side_chain',
  term: 'side chain',
  variants: ['sidechain', 'ducking', 'side-chain compression'],
  category: 'dynamics',
  definition: 'Compression triggered by external signal',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'dynamic_routing',
    mapping: {
      axis: 'dynamics',
      affects: ['compressor', 'routing'],
    },
  },
  examples: [
    'Add side chain compression',
    'Sidechain the bass to the kick',
    'Apply ducking',
  ],
};

// =============================================================================
// Spatial Effects
// =============================================================================

const REVERB: DomainNounLexeme = {
  id: 'noun:reverb',
  term: 'reverb',
  variants: ['reverberation', 'room', 'hall'],
  category: 'spatial',
  definition: 'Simulated acoustic space',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'space',
    mapping: {
      axis: 'depth',
      affects: ['reverb'],
    },
  },
  examples: [
    'Add reverb',
    'Increase reverb wetness',
    'The vocal needs more reverb',
  ],
};

const DELAY: DomainNounLexeme = {
  id: 'noun:delay',
  term: 'delay',
  variants: ['echo', 'repeat', 'slapback'],
  category: 'spatial',
  definition: 'Time-based repetition of signal',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'time_effect',
    mapping: {
      axis: 'depth',
      affects: ['delay'],
    },
  },
  examples: [
    'Add delay',
    'Increase delay feedback',
    'The guitar needs echo',
  ],
};

const CHORUS: DomainNounLexeme = {
  id: 'noun:chorus_effect',
  term: 'chorus',
  variants: ['chorus effect', 'doubling'],
  category: 'spatial',
  definition: 'Pitch-modulated delay for thickness',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'modulation',
    mapping: {
      axis: 'width',
      affects: ['chorus'],
    },
  },
  examples: [
    'Add chorus',
    'The synth needs chorus',
    'Increase chorus depth',
  ],
};

const FLANGER: DomainNounLexeme = {
  id: 'noun:flanger',
  term: 'flanger',
  variants: ['flanging', 'jet plane'],
  category: 'spatial',
  definition: 'Short delay with feedback for sweeping effect',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'modulation',
    mapping: {
      axis: 'movement',
      affects: ['flanger'],
    },
  },
  examples: [
    'Add flanging',
    'The guitar needs flanger',
    'Apply jet plane effect',
  ],
};

const PHASER: DomainNounLexeme = {
  id: 'noun:phaser',
  term: 'phaser',
  variants: ['phasing', 'phase shift'],
  category: 'spatial',
  definition: 'All-pass filter modulation',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'modulation',
    mapping: {
      axis: 'movement',
      affects: ['phaser'],
    },
  },
  examples: [
    'Add phaser',
    'The keys need phasing',
    'Apply phase shifting',
  ],
};

// =============================================================================
// Stereo & Width
// =============================================================================

const PANNING: DomainNounLexeme = {
  id: 'noun:panning',
  term: 'panning',
  variants: ['pan', 'stereo placement', 'left-right'],
  category: 'stereo',
  definition: 'Left-right positioning in stereo field',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'spatial_placement',
    mapping: {
      axis: 'width',
      affects: ['pan'],
    },
  },
  examples: [
    'Adjust the panning',
    'Pan the guitar left',
    'Center the vocal',
  ],
};

const STEREO_WIDTH: DomainNounLexeme = {
  id: 'noun:stereo_width',
  term: 'stereo width',
  variants: ['width', 'stereo spread', 'wideness'],
  category: 'stereo',
  definition: 'Apparent width of stereo image',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'stereo_dimension',
    mapping: {
      axis: 'width',
      affects: ['stereo_width'],
    },
  },
  examples: [
    'Increase stereo width',
    'Make it wider',
    'Add width to the pad',
  ],
};

const MID_SIDE: DomainNounLexeme = {
  id: 'noun:mid_side',
  term: 'mid-side',
  variants: ['MS', 'mid/side', 'ms processing'],
  category: 'stereo',
  definition: 'Processing of center vs sides separately',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'stereo_processing',
  },
  examples: [
    'Use mid-side EQ',
    'Process with MS',
    'Apply mid/side compression',
  ],
};

const MONO_COMPATIBILITY: DomainNounLexeme = {
  id: 'noun:mono_compatibility',
  term: 'mono compatibility',
  variants: ['mono', 'phase coherence', 'mono check'],
  category: 'stereo',
  definition: 'How mix sounds when summed to mono',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'phase_relationship',
  },
  examples: [
    'Check mono compatibility',
    'Make sure it sounds good in mono',
    'Fix phase issues',
  ],
};

// =============================================================================
// Distortion & Saturation
// =============================================================================

const SATURATION: DomainNounLexeme = {
  id: 'noun:saturation',
  term: 'saturation',
  variants: ['tape saturation', 'warmth', 'analog color'],
  category: 'harmonic',
  definition: 'Subtle harmonic distortion',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'harmonic_enhancement',
    mapping: {
      axis: 'warmth',
      affects: ['saturation'],
    },
  },
  examples: [
    'Add saturation',
    'Apply tape saturation',
    'Warm it up with saturation',
  ],
};

const DISTORTION: DomainNounLexeme = {
  id: 'noun:distortion',
  term: 'distortion',
  variants: ['overdrive', 'clipping', 'dirt'],
  category: 'harmonic',
  definition: 'Intentional signal clipping',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'harmonic_generation',
    mapping: {
      axis: 'aggression',
      affects: ['distortion'],
    },
  },
  examples: [
    'Add distortion',
    'Apply overdrive',
    'Make it dirtier',
  ],
};

const HARMONICS: DomainNounLexeme = {
  id: 'noun:harmonics',
  term: 'harmonics',
  variants: ['harmonic content', 'overtones', 'upper partials'],
  category: 'harmonic',
  definition: 'Overtones above fundamental frequency',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'spectral_content',
  },
  examples: [
    'Add harmonics',
    'Enhance harmonic content',
    'Bring out overtones',
  ],
};

// =============================================================================
// Level & Loudness
// =============================================================================

const HEADROOM: DomainNounLexeme = {
  id: 'noun:headroom',
  term: 'headroom',
  variants: ['dynamic headroom', 'peak room'],
  category: 'level',
  definition: 'Space between peak and clipping',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'level_management',
  },
  examples: [
    'Leave headroom for mastering',
    'Increase headroom',
    'The mix has no headroom',
  ],
};

const LOUDNESS: DomainNounLexeme = {
  id: 'noun:loudness',
  term: 'loudness',
  variants: ['perceived loudness', 'LUFS', 'volume'],
  category: 'level',
  definition: 'Perceived volume level',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'perceived_level',
    mapping: {
      axis: 'loudness',
      affects: ['gain', 'compression', 'limiting'],
    },
  },
  examples: [
    'Increase loudness',
    'Match loudness standards',
    'The track needs more loudness',
  ],
};

const GAIN_STAGING: DomainNounLexeme = {
  id: 'noun:gain_staging',
  term: 'gain staging',
  variants: ['gain structure', 'level management'],
  category: 'level',
  definition: 'Optimization of signal levels through chain',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'signal_flow',
  },
  examples: [
    'Fix gain staging',
    'Optimize gain structure',
    'Check level management',
  ],
};

// =============================================================================
// Mastering & Finalization
// =============================================================================

const MASTERING: DomainNounLexeme = {
  id: 'noun:mastering',
  term: 'mastering',
  variants: ['master', 'final processing'],
  category: 'process',
  definition: 'Final processing for distribution',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'finalization',
  },
  examples: [
    'Apply mastering',
    'Master the track',
    'Add mastering chain',
  ],
};

const DITHERING: DomainNounLexeme = {
  id: 'noun:dithering',
  term: 'dithering',
  variants: ['dither', 'noise shaping'],
  category: 'process',
  definition: 'Noise added when reducing bit depth',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'bit_depth_conversion',
  },
  examples: [
    'Apply dithering',
    'Dither to 16-bit',
    'Use noise shaping',
  ],
};

const NORMALIZATION: DomainNounLexeme = {
  id: 'noun:normalization',
  term: 'normalization',
  variants: ['normalize', 'peak normalization'],
  category: 'process',
  definition: 'Setting peak level to target',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'level_adjustment',
  },
  examples: [
    'Normalize the audio',
    'Apply peak normalization',
    'Normalize to -1 dB',
  ],
};

const TRANSIENT: DomainNounLexeme = {
  id: 'noun:transient',
  term: 'transient',
  variants: ['attack transient', 'percussive transient', 'initial attack'],
  category: 'timbre',
  definition: 'Initial short burst at beginning of sound',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'attack_characteristics',
    mapping: {
      axis: 'punch',
      affects: ['transient_designer', 'compressor'],
    },
  },
  examples: [
    'Enhance the transients',
    'The kick transient is too soft',
    'Sharpen drum transients',
  ],
};

const SUSTAIN: DomainNounLexeme = {
  id: 'noun:sustain',
  term: 'sustain',
  variants: ['held portion', 'body', 'sustain level'],
  category: 'timbre',
  definition: 'Portion of sound after attack and before release',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'envelope_body',
    mapping: {
      axis: 'length',
      affects: ['envelope', 'sustain_pedal'],
    },
  },
  examples: [
    'Increase the sustain',
    'The sustain is too short',
    'Add more sustain to the pad',
  ],
};

const RELEASE: DomainNounLexeme = {
  id: 'noun:release',
  term: 'release',
  variants: ['decay tail', 'release time', 'fade out'],
  category: 'timbre',
  definition: 'Portion of sound after note off',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'envelope_release',
    mapping: {
      axis: 'length',
      affects: ['envelope', 'compressor_release'],
    },
  },
  examples: [
    'Lengthen the release',
    'Fast release on the compressor',
    'The release tail is too long',
  ],
};

// =============================================================================
// Export All Lexemes
// =============================================================================

export const PRODUCTION_MIXING_LEXEMES: readonly DomainNounLexeme[] = [
  // Frequency
  SUB_BASS,
  BASS,
  MIDS,
  HIGHS,
  AIR,
  MUD,
  BOXINESS,
  HARSHNESS,
  SIBILANCE,

  // Dynamics
  COMPRESSION,
  LIMITING,
  EXPANSION,
  GATING,
  SIDE_CHAIN,

  // Spatial
  REVERB,
  DELAY,
  CHORUS,
  FLANGER,
  PHASER,

  // Stereo
  PANNING,
  STEREO_WIDTH,
  MID_SIDE,
  MONO_COMPATIBILITY,

  // Harmonic
  SATURATION,
  DISTORTION,
  HARMONICS,

  // Level
  HEADROOM,
  LOUDNESS,
  GAIN_STAGING,

  // Finalization
  MASTERING,
  DITHERING,
  NORMALIZATION,

  // Timbre/Envelope
  TRANSIENT,
  SUSTAIN,
  RELEASE,
] as const;

export default PRODUCTION_MIXING_LEXEMES;
