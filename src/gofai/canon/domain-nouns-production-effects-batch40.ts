/**
 * GOFAI Canon — Domain Nouns Batch 40: Production Effects and Processing
 *
 * Comprehensive vocabulary for audio production, signal processing, and effects.
 * Covers:
 * - Dynamic processors (compressors, limiters, gates, expanders)
 * - Time-based effects (delays, reverbs, choruses, flangers)
 * - Modulation effects (phasers, tremolos, vibratos)
 * - Distortion/saturation types (overdrive, fuzz, bitcrush)
 * - Filters (EQ types, filter shapes, resonant filters)
 * - Spatial effects (stereo wideners, panners, binaural)
 * - Restoration tools (de-essers, noise gates, de-clickers)
 * - Creative processors (granular, pitch shifters, vocoders)
 *
 * Following gofai_goalB.md Step 002-004: extensive professional terminology
 * for sophisticated production workflow integration.
 *
 * @module gofai/canon/domain-nouns-production-effects-batch40
 */

import type { Lexeme } from './types';
import { createLexemeId } from './types';

// =============================================================================
// Dynamic Processors
// =============================================================================

export const DYNAMIC_PROCESSOR_NOUNS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'compressor'),
    lemma: 'compressor',
    variants: ['compressor', 'compression', 'dynamic compressor', 'comp'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'dynamics',
      aspect: 'control',
    },
    description: 'Reduces dynamic range by attenuating loud signals',
    examples: [
      'add a compressor',
      'apply compression',
      'use dynamic compression',
    ],
  },

  {
    id: createLexemeId('noun', 'limiter'),
    lemma: 'limiter',
    variants: ['limiter', 'limiting', 'peak limiter', 'brick wall limiter'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'dynamics',
      aspect: 'protection',
    },
    description: 'Prevents signal from exceeding a set threshold',
    examples: [
      'add a limiter',
      'use brick wall limiting',
      'apply peak limiting',
    ],
  },

  {
    id: createLexemeId('noun', 'expander'),
    lemma: 'expander',
    variants: ['expander', 'expansion', 'upward expander', 'dynamic expander'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'dynamics',
      aspect: 'expansion',
    },
    description: 'Increases dynamic range by boosting loud signals',
    examples: [
      'add an expander',
      'use upward expansion',
      'apply dynamic expansion',
    ],
  },

  {
    id: createLexemeId('noun', 'gate'),
    lemma: 'gate',
    variants: ['gate', 'noise gate', 'gating', 'dynamic gate'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'dynamics',
      aspect: 'cleanup',
    },
    description: 'Silences signal below a threshold',
    examples: [
      'add a gate',
      'use noise gating',
      'apply a noise gate',
    ],
  },

  {
    id: createLexemeId('noun', 'multiband-compressor'),
    lemma: 'multiband compressor',
    variants: ['multiband compressor', 'multi-band comp', 'frequency-specific compression', 'split-band compressor'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'dynamics',
      aspect: 'frequency_specific',
    },
    description: 'Compresses different frequency bands independently',
    examples: [
      'add multiband compression',
      'use split-band compressor',
      'apply frequency-specific compression',
    ],
  },

  {
    id: createLexemeId('noun', 'sidechain-compressor'),
    lemma: 'sidechain compressor',
    variants: ['sidechain compressor', 'sidechain compression', 'ducking', 'key compression'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'dynamics',
      aspect: 'reactive',
    },
    description: 'Compresses based on external signal',
    examples: [
      'add sidechain compression',
      'use ducking',
      'apply key compression',
    ],
  },

  {
    id: createLexemeId('noun', 'transient-shaper'),
    lemma: 'transient shaper',
    variants: ['transient shaper', 'transient designer', 'attack shaper', 'envelope shaper'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'dynamics',
      aspect: 'transients',
    },
    description: 'Controls attack and sustain of transients',
    examples: [
      'add transient shaping',
      'use attack shaper',
      'apply envelope shaping',
    ],
  },

  {
    id: createLexemeId('noun', 'de-esser'),
    lemma: 'de-esser',
    variants: ['de-esser', 'de-essing', 'sibilance remover', 'ess reducer'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'dynamics',
      aspect: 'restoration',
    },
    description: 'Reduces harsh sibilant frequencies',
    examples: [
      'add de-essing',
      'use sibilance removal',
      'apply de-esser',
    ],
  },
];

// =============================================================================
// Time-Based Effects
// =============================================================================

export const TIME_BASED_EFFECTS_NOUNS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'reverb'),
    lemma: 'reverb',
    variants: ['reverb', 'reverberation', 'room', 'hall', 'chamber'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'space',
      aspect: 'reflection',
    },
    description: 'Simulates acoustic space reflections',
    examples: [
      'add reverb',
      'use hall reverb',
      'apply room ambience',
    ],
  },

  {
    id: createLexemeId('noun', 'delay'),
    lemma: 'delay',
    variants: ['delay', 'echo', 'tape delay', 'digital delay'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'time',
      aspect: 'repeat',
    },
    description: 'Repeats signal after a time interval',
    examples: [
      'add delay',
      'use tape echo',
      'apply digital delay',
    ],
  },

  {
    id: createLexemeId('noun', 'ping-pong-delay'),
    lemma: 'ping-pong delay',
    variants: ['ping-pong delay', 'stereo delay', 'bouncing delay', 'alternating delay'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'time',
      aspect: 'stereo_repeat',
    },
    description: 'Delay that alternates between left and right',
    examples: [
      'add ping-pong delay',
      'use stereo bouncing',
      'apply alternating echo',
    ],
  },

  {
    id: createLexemeId('noun', 'chorus'),
    lemma: 'chorus',
    variants: ['chorus', 'chorus effect', 'ensemble', 'doubling'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'modulation',
      aspect: 'thickening',
    },
    description: 'Creates ensemble effect by pitch/time modulation',
    examples: [
      'add chorus',
      'use ensemble effect',
      'apply doubling',
    ],
  },

  {
    id: createLexemeId('noun', 'flanger'),
    lemma: 'flanger',
    variants: ['flanger', 'flanging', 'jet effect', 'whoosh'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'modulation',
      aspect: 'comb_filter',
    },
    description: 'Creates sweeping comb filter effect',
    examples: [
      'add flanging',
      'use jet effect',
      'apply flanger sweep',
    ],
  },

  {
    id: createLexemeId('noun', 'phaser'),
    lemma: 'phaser',
    variants: ['phaser', 'phase shifter', 'phasing', 'phase effect'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'modulation',
      aspect: 'phase_shift',
    },
    description: 'Creates sweeping notch filter effect',
    examples: [
      'add phasing',
      'use phase shifter',
      'apply phaser sweep',
    ],
  },

  {
    id: createLexemeId('noun', 'tremolo'),
    lemma: 'tremolo',
    variants: ['tremolo', 'amplitude modulation', 'volume modulation', 'trem'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'modulation',
      aspect: 'amplitude',
    },
    description: 'Rhythmic amplitude modulation',
    examples: [
      'add tremolo',
      'use amplitude modulation',
      'apply rhythmic volume change',
    ],
  },

  {
    id: createLexemeId('noun', 'vibrato'),
    lemma: 'vibrato',
    variants: ['vibrato', 'pitch modulation', 'pitch vibrato', 'waver'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'modulation',
      aspect: 'pitch',
    },
    description: 'Rhythmic pitch modulation',
    examples: [
      'add vibrato',
      'use pitch modulation',
      'apply pitch waver',
    ],
  },
];

// =============================================================================
// Distortion and Saturation
// =============================================================================

export const DISTORTION_SATURATION_NOUNS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'distortion'),
    lemma: 'distortion',
    variants: ['distortion', 'dist', 'clipping', 'overdrive'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'saturation',
      aspect: 'harmonic',
    },
    description: 'Adds harmonic distortion to signal',
    examples: [
      'add distortion',
      'use overdrive',
      'apply clipping',
    ],
  },

  {
    id: createLexemeId('noun', 'saturation'),
    lemma: 'saturation',
    variants: ['saturation', 'tape saturation', 'analog saturation', 'warmth'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'saturation',
      aspect: 'subtle',
    },
    description: 'Subtle harmonic enhancement',
    examples: [
      'add saturation',
      'use tape warmth',
      'apply analog coloration',
    ],
  },

  {
    id: createLexemeId('noun', 'fuzz'),
    lemma: 'fuzz',
    variants: ['fuzz', 'fuzz box', 'fuzz distortion', 'fuzzy'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'saturation',
      aspect: 'extreme',
    },
    description: 'Extreme square-wave distortion',
    examples: [
      'add fuzz',
      'use fuzz box',
      'apply extreme distortion',
    ],
  },

  {
    id: createLexemeId('noun', 'bitcrusher'),
    lemma: 'bitcrusher',
    variants: ['bitcrusher', 'bit crusher', 'bit reduction', 'sample rate reduction', 'lo-fi'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'saturation',
      aspect: 'digital',
    },
    description: 'Reduces bit depth and sample rate for lo-fi effect',
    examples: [
      'add bitcrushing',
      'use bit reduction',
      'apply lo-fi effect',
    ],
  },

  {
    id: createLexemeId('noun', 'waveshaper'),
    lemma: 'waveshaper',
    variants: ['waveshaper', 'wave shaper', 'waveshaping', 'transfer function'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'saturation',
      aspect: 'custom',
    },
    description: 'Applies custom transfer function to waveform',
    examples: [
      'add waveshaping',
      'use transfer function',
      'apply custom distortion curve',
    ],
  },

  {
    id: createLexemeId('noun', 'tube-emulation'),
    lemma: 'tube emulation',
    variants: ['tube emulation', 'valve emulation', 'tube amp', 'valve sound'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'saturation',
      aspect: 'analog',
    },
    description: 'Simulates vacuum tube saturation',
    examples: [
      'add tube emulation',
      'use valve sound',
      'apply tube warmth',
    ],
  },
];

// =============================================================================
// Filters and EQ
// =============================================================================

export const FILTER_EQ_NOUNS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'equalizer'),
    lemma: 'equalizer',
    variants: ['equalizer', 'EQ', 'eq', 'tone control'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'frequency',
      aspect: 'shaping',
    },
    description: 'Adjusts frequency balance',
    examples: [
      'add EQ',
      'use equalizer',
      'apply frequency shaping',
    ],
  },

  {
    id: createLexemeId('noun', 'parametric-eq'),
    lemma: 'parametric EQ',
    variants: ['parametric EQ', 'parametric equalizer', 'para EQ', 'fully parametric'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'frequency',
      aspect: 'precise',
    },
    description: 'EQ with adjustable frequency, gain, and Q',
    examples: [
      'add parametric EQ',
      'use para EQ',
      'apply precise frequency control',
    ],
  },

  {
    id: createLexemeId('noun', 'graphic-eq'),
    lemma: 'graphic EQ',
    variants: ['graphic EQ', 'graphic equalizer', 'fixed-band EQ', 'multi-band EQ'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'frequency',
      aspect: 'fixed_bands',
    },
    description: 'EQ with fixed frequency bands',
    examples: [
      'add graphic EQ',
      'use fixed-band equalizer',
      'apply multi-band boost/cut',
    ],
  },

  {
    id: createLexemeId('noun', 'low-pass-filter'),
    lemma: 'low-pass filter',
    variants: ['low-pass filter', 'lowpass', 'LPF', 'high-cut filter', 'high cut'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'frequency',
      aspect: 'cutoff',
    },
    description: 'Passes low frequencies, attenuates high',
    examples: [
      'add low-pass filter',
      'use highcut',
      'apply LPF',
    ],
  },

  {
    id: createLexemeId('noun', 'high-pass-filter'),
    lemma: 'high-pass filter',
    variants: ['high-pass filter', 'highpass', 'HPF', 'low-cut filter', 'low cut'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'frequency',
      aspect: 'cutoff',
    },
    description: 'Passes high frequencies, attenuates low',
    examples: [
      'add high-pass filter',
      'use lowcut',
      'apply HPF',
    ],
  },

  {
    id: createLexemeId('noun', 'band-pass-filter'),
    lemma: 'band-pass filter',
    variants: ['band-pass filter', 'bandpass', 'BPF', 'mid-pass'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'frequency',
      aspect: 'band',
    },
    description: 'Passes specific frequency band',
    examples: [
      'add band-pass filter',
      'use BPF',
      'isolate frequency band',
    ],
  },

  {
    id: createLexemeId('noun', 'notch-filter'),
    lemma: 'notch filter',
    variants: ['notch filter', 'band-reject filter', 'band-stop filter', 'notch'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'frequency',
      aspect: 'rejection',
    },
    description: 'Removes specific frequency band',
    examples: [
      'add notch filter',
      'use band rejection',
      'remove frequency notch',
    ],
  },

  {
    id: createLexemeId('noun', 'comb-filter'),
    lemma: 'comb filter',
    variants: ['comb filter', 'comb filtering', 'resonant peaks', 'harmonic filter'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'frequency',
      aspect: 'harmonic',
    },
    description: 'Creates series of harmonic notches',
    examples: [
      'add comb filtering',
      'use resonant peaks',
      'apply harmonic filtering',
    ],
  },

  {
    id: createLexemeId('noun', 'shelving-eq'),
    lemma: 'shelving EQ',
    variants: ['shelving EQ', 'shelf filter', 'high shelf', 'low shelf'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'frequency',
      aspect: 'broad',
    },
    description: 'Boosts or cuts frequencies above/below a point',
    examples: [
      'add high shelf',
      'use low shelf boost',
      'apply shelving EQ',
    ],
  },
];

// =============================================================================
// Spatial Effects
// =============================================================================

export const SPATIAL_EFFECTS_NOUNS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'stereo-widener'),
    lemma: 'stereo widener',
    variants: ['stereo widener', 'width enhancer', 'stereo spread', 'widening'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'spatial',
      aspect: 'width',
    },
    description: 'Increases stereo width',
    examples: [
      'add stereo widening',
      'use width enhancer',
      'expand stereo image',
    ],
  },

  {
    id: createLexemeId('noun', 'panner'),
    lemma: 'panner',
    variants: ['panner', 'pan control', 'stereo placement', 'positioning'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'spatial',
      aspect: 'position',
    },
    description: 'Controls left-right stereo position',
    examples: [
      'use panner',
      'adjust pan position',
      'control stereo placement',
    ],
  },

  {
    id: createLexemeId('noun', 'auto-panner'),
    lemma: 'auto-panner',
    variants: ['auto-panner', 'auto pan', 'panning LFO', 'stereo modulation'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'spatial',
      aspect: 'movement',
    },
    description: 'Automatically modulates pan position',
    examples: [
      'add auto-panning',
      'use stereo modulation',
      'apply moving pan',
    ],
  },

  {
    id: createLexemeId('noun', 'binaural-processor'),
    lemma: 'binaural processor',
    variants: ['binaural processor', 'HRTF', 'head-related transfer', '3D audio', 'spatial audio'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'spatial',
      aspect: '3d',
    },
    description: 'Creates 3D spatial positioning using HRTF',
    examples: [
      'add binaural processing',
      'use 3D audio',
      'apply HRTF positioning',
    ],
  },

  {
    id: createLexemeId('noun', 'haas-effect'),
    lemma: 'Haas effect',
    variants: ['Haas effect', 'precedence effect', 'psychoacoustic delay', 'stereo trick'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'spatial',
      aspect: 'psychoacoustic',
    },
    description: 'Creates stereo width using short delays',
    examples: [
      'use Haas effect',
      'apply precedence effect',
      'add psychoacoustic width',
    ],
  },

  {
    id: createLexemeId('noun', 'mid-side-processor'),
    lemma: 'mid-side processor',
    variants: ['mid-side processor', 'M/S processing', 'sum-difference', 'stereo imaging'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'spatial',
      aspect: 'ms_processing',
    },
    description: 'Processes mid and side channels independently',
    examples: [
      'add mid-side processing',
      'use M/S EQ',
      'apply stereo imaging',
    ],
  },
];

// =============================================================================
// Creative Processors
// =============================================================================

export const CREATIVE_PROCESSORS_NOUNS: readonly Lexeme[] = [
  {
    id: createLexemeId('noun', 'granular-synth'),
    lemma: 'granular synth',
    variants: ['granular synth', 'granular synthesis', 'grain cloud', 'microsound'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'creative',
      aspect: 'granular',
    },
    description: 'Synthesizes sound from tiny grains',
    examples: [
      'add granular synthesis',
      'use grain cloud',
      'apply microsound processing',
    ],
  },

  {
    id: createLexemeId('noun', 'pitch-shifter'),
    lemma: 'pitch shifter',
    variants: ['pitch shifter', 'pitch shift', 'transpose effect', 'harmonizer'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'creative',
      aspect: 'pitch',
    },
    description: 'Changes pitch without affecting time',
    examples: [
      'add pitch shifting',
      'use harmonizer',
      'apply pitch transpose',
    ],
  },

  {
    id: createLexemeId('noun', 'vocoder'),
    lemma: 'vocoder',
    variants: ['vocoder', 'voice coder', 'robotic voice', 'talkbox'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'creative',
      aspect: 'synthesis',
    },
    description: 'Imposes spectral characteristics of one signal on another',
    examples: [
      'add vocoder',
      'use robotic voice effect',
      'apply voice synthesis',
    ],
  },

  {
    id: createLexemeId('noun', 'ring-modulator'),
    lemma: 'ring modulator',
    variants: ['ring modulator', 'ring mod', 'amplitude modulation', 'metallic effect'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'creative',
      aspect: 'modulation',
    },
    description: 'Multiplies two signals for metallic/bell-like tones',
    examples: [
      'add ring modulation',
      'use metallic effect',
      'apply ring mod',
    ],
  },

  {
    id: createLexemeId('noun', 'frequency-shifter'),
    lemma: 'frequency shifter',
    variants: ['frequency shifter', 'freq shift', 'bode shifter', 'dissonant shift'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'creative',
      aspect: 'frequency',
    },
    description: 'Shifts all frequencies by a fixed amount',
    examples: [
      'add frequency shifting',
      'use bode shifter',
      'apply dissonant shift',
    ],
  },

  {
    id: createLexemeId('noun', 'formant-filter'),
    lemma: 'formant filter',
    variants: ['formant filter', 'vowel filter', 'formant shift', 'vocal shaping'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'creative',
      aspect: 'vocal',
    },
    description: 'Shapes vocal formants for vowel-like sounds',
    examples: [
      'add formant filtering',
      'use vowel filter',
      'apply vocal shaping',
    ],
  },

  {
    id: createLexemeId('noun', 'convolution-reverb'),
    lemma: 'convolution reverb',
    variants: ['convolution reverb', 'impulse response', 'IR reverb', 'sampled space'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'space',
      aspect: 'realistic',
    },
    description: 'Reverb based on sampled acoustic spaces',
    examples: [
      'add convolution reverb',
      'use impulse response',
      'apply sampled space',
    ],
  },

  {
    id: createLexemeId('noun', 'spectral-processor'),
    lemma: 'spectral processor',
    variants: ['spectral processor', 'FFT processor', 'frequency domain effect', 'spectral editing'],
    category: 'noun',
    semantics: {
      type: 'entity',
      entityType: 'effect',
      domain: 'creative',
      aspect: 'spectral',
    },
    description: 'Processes signal in frequency domain',
    examples: [
      'add spectral processing',
      'use FFT effects',
      'apply frequency domain editing',
    ],
  },
];

// =============================================================================
// Export All Nouns
// =============================================================================

export const PRODUCTION_EFFECTS_NOUNS_BATCH_40: readonly Lexeme[] = [
  ...DYNAMIC_PROCESSOR_NOUNS,
  ...TIME_BASED_EFFECTS_NOUNS,
  ...DISTORTION_SATURATION_NOUNS,
  ...FILTER_EQ_NOUNS,
  ...SPATIAL_EFFECTS_NOUNS,
  ...CREATIVE_PROCESSORS_NOUNS,
];

/**
 * Total count of production effects nouns in this batch.
 */
export const BATCH_40_COUNT = PRODUCTION_EFFECTS_NOUNS_BATCH_40.length;
