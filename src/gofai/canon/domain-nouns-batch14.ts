/**
 * GOFAI Domain Nouns — Batch 14: Electronic Music Production
 *
 * Terms related to synthesis, electronic production, sound design, and modern music production.
 *
 * @module gofai/canon/domain-nouns-batch14
 */

import type { DomainNoun } from './types';

// =============================================================================
// Synthesis Concepts
// =============================================================================

const SYNTHESIS: DomainNoun = {
  id: 'noun:synthesis',
  term: 'synthesis',
  variants: ['synth', 'sound synthesis', 'synthesizer'],
  category: 'production',
  definition: 'The electronic generation of sound through various methods',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'sound_generation',
  },
  examples: [
    'Use synthesis for the lead sound',
    'The synthesis is too harsh',
    'Add warmer synthesis',
  ],
};

const OSCILLATOR: DomainNoun = {
  id: 'noun:oscillator',
  term: 'oscillator',
  variants: ['osc', 'VCO', 'waveform generator'],
  category: 'synthesis',
  definition: 'The sound-generating component that produces basic waveforms',
  semantics: {
    type: 'entity',
    domain: 'synthesis',
    entityType: 'component',
  },
  examples: [
    'Detune the oscillators slightly',
    'Add a second oscillator',
    'The oscillator is out of tune',
  ],
};

const FILTER: DomainNoun = {
  id: 'noun:filter',
  term: 'filter',
  variants: ['VCF', 'cutoff', 'resonance'],
  category: 'synthesis',
  definition: 'A frequency-selective processor that shapes timbre',
  semantics: {
    type: 'entity',
    domain: 'synthesis',
    entityType: 'component',
  },
  examples: [
    'Open the filter more',
    'Add filter resonance',
    'Automate the filter cutoff',
  ],
};

const ENVELOPE: DomainNoun = {
  id: 'noun:envelope',
  term: 'envelope',
  variants: ['ADSR', 'EG', 'envelope generator'],
  category: 'synthesis',
  definition: 'A time-varying control signal shaping amplitude or timbre',
  semantics: {
    type: 'concept',
    domain: 'synthesis',
    aspect: 'temporal_shaping',
  },
  examples: [
    'Shorten the envelope release',
    'Add a longer attack envelope',
    'The envelope is too snappy',
  ],
};

const LFO: DomainNoun = {
  id: 'noun:lfo',
  term: 'LFO',
  variants: ['low frequency oscillator', 'modulation', 'vibrato'],
  category: 'synthesis',
  definition: 'A low-frequency oscillator used for modulation',
  semantics: {
    type: 'entity',
    domain: 'synthesis',
    entityType: 'modulator',
  },
  examples: [
    'Add LFO to the filter',
    'Speed up the LFO rate',
    'The LFO is too intense',
  ],
};

const WAVEFORM: DomainNoun = {
  id: 'noun:waveform',
  term: 'waveform',
  variants: ['wave shape', 'wave', 'signal shape'],
  category: 'synthesis',
  definition: 'The basic shape of an audio signal',
  semantics: {
    type: 'concept',
    domain: 'synthesis',
    aspect: 'signal_shape',
  },
  examples: [
    'Use a sawtooth waveform',
    'Mix waveforms for complexity',
    'The waveform is too simple',
  ],
};

const MODULATION: DomainNoun = {
  id: 'noun:modulation',
  term: 'modulation',
  variants: ['mod', 'FM', 'AM', 'ring mod'],
  category: 'synthesis',
  definition: 'The variation of one signal by another',
  semantics: {
    type: 'technique',
    domain: 'synthesis',
    device: 'signal_interaction',
  },
  examples: [
    'Add frequency modulation',
    'Increase modulation depth',
    'The modulation is too extreme',
  ],
};

const WAVETABLE: DomainNoun = {
  id: 'noun:wavetable',
  term: 'wavetable',
  variants: ['wavetable synthesis', 'WT', 'morphing waveforms'],
  category: 'synthesis',
  definition: 'Synthesis using tables of waveforms that can be scanned',
  semantics: {
    type: 'technique',
    domain: 'synthesis',
    device: 'wavetable_playback',
  },
  examples: [
    'Use wavetable synthesis',
    'Scan through the wavetable',
    'The wavetable adds motion',
  ],
};

const GRANULAR: DomainNoun = {
  id: 'noun:granular',
  term: 'granular synthesis',
  variants: ['granular', 'grain cloud', 'microsound'],
  category: 'synthesis',
  definition: 'Synthesis using many small grains of sound',
  semantics: {
    type: 'technique',
    domain: 'synthesis',
    device: 'grain_based',
  },
  examples: [
    'Add granular texture',
    'The granular effect is too dense',
    'Use granular synthesis for atmosphere',
  ],
};

const FM_SYNTHESIS: DomainNoun = {
  id: 'noun:fm',
  term: 'FM synthesis',
  variants: ['FM', 'frequency modulation', 'digital FM'],
  category: 'synthesis',
  definition: 'Synthesis using frequency modulation between operators',
  semantics: {
    type: 'technique',
    domain: 'synthesis',
    device: 'frequency_modulation',
  },
  examples: [
    'Use FM synthesis for bells',
    'The FM is too harsh',
    'Add subtle FM modulation',
  ],
};

// =============================================================================
// Sound Design Terms
// =============================================================================

const SOUND_DESIGN: DomainNoun = {
  id: 'noun:sound_design',
  term: 'sound design',
  variants: ['sound crafting', 'timbre design', 'sonic sculpting'],
  category: 'production',
  definition: 'The art of creating and shaping sounds',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'sound_creation',
  },
  examples: [
    'The sound design is too aggressive',
    'Add more interesting sound design',
    'Simplify the sound design',
  ],
};

const PATCH: DomainNoun = {
  id: 'noun:patch',
  term: 'patch',
  variants: ['preset', 'sound', 'program'],
  category: 'synthesis',
  definition: 'A specific configuration of synthesis parameters',
  semantics: {
    type: 'entity',
    domain: 'synthesis',
    entityType: 'configuration',
  },
  examples: [
    'Switch to a brighter patch',
    'The patch is too aggressive',
    'Create a custom patch',
  ],
};

const TEXTURE: DomainNoun = {
  id: 'noun:sonic_texture',
  term: 'texture',
  variants: ['sonic texture', 'timbral texture', 'sound quality'],
  category: 'production',
  definition: 'The overall quality and character of a sound',
  semantics: {
    type: 'concept',
    domain: 'timbre',
    aspect: 'quality',
  },
  examples: [
    'Add grainy texture',
    'The texture is too smooth',
    'Create evolving texture',
  ],
};

const NOISE: DomainNoun = {
  id: 'noun:noise',
  term: 'noise',
  variants: ['white noise', 'pink noise', 'noise generator'],
  category: 'synthesis',
  definition: 'Random audio signal used for sound design',
  semantics: {
    type: 'concept',
    domain: 'synthesis',
    aspect: 'aperiodic_signal',
  },
  examples: [
    'Add white noise to the snare',
    'Mix in subtle noise',
    'The noise is too loud',
  ],
};

const GLITCH: DomainNoun = {
  id: 'noun:glitch',
  term: 'glitch',
  variants: ['glitchy', 'digital artifacts', 'stutters'],
  category: 'effect',
  definition: 'Intentional digital errors and artifacts used creatively',
  semantics: {
    type: 'effect',
    domain: 'production',
    device: 'digital_manipulation',
  },
  examples: [
    'Add glitch effects',
    'The glitches are too prominent',
    'Use subtle glitch for interest',
  ],
};

// =============================================================================
// Production Effects
// =============================================================================

const SIDECHAIN: DomainNoun = {
  id: 'noun:sidechain',
  term: 'sidechain',
  variants: ['side-chain', 'ducking', 'pumping'],
  category: 'effect',
  definition: 'Dynamic processing triggered by an external signal',
  semantics: {
    type: 'technique',
    domain: 'production',
    device: 'dynamic_interaction',
  },
  examples: [
    'Add sidechain compression',
    'The sidechain is too aggressive',
    'Tighten the sidechain timing',
  ],
};

const SATURATION: DomainNoun = {
  id: 'noun:saturation',
  term: 'saturation',
  variants: ['saturate', 'warmth', 'analog warmth'],
  category: 'effect',
  definition: 'Harmonic enrichment through gentle distortion',
  semantics: {
    type: 'effect',
    domain: 'production',
    device: 'harmonic_generation',
  },
  examples: [
    'Add tape saturation',
    'The saturation adds warmth',
    'Reduce the saturation',
  ],
};

const BIT_CRUSH: DomainNoun = {
  id: 'noun:bit_crush',
  term: 'bit crush',
  variants: ['bit crushing', 'bit reduction', 'lo-fi'],
  category: 'effect',
  definition: 'Digital degradation effect reducing bit depth',
  semantics: {
    type: 'effect',
    domain: 'production',
    device: 'digital_degradation',
  },
  examples: [
    'Add bit crushing for grit',
    'The bit crush is too extreme',
    'Use subtle bit crush',
  ],
};

const VOCODER: DomainNoun = {
  id: 'noun:vocoder',
  term: 'vocoder',
  variants: ['vocoding', 'voice synthesis', 'robotic voice'],
  category: 'effect',
  definition: 'Effect imposing spectral envelope of one signal onto another',
  semantics: {
    type: 'effect',
    domain: 'production',
    device: 'spectral_imposition',
  },
  examples: [
    'Add vocoder to the vocals',
    'The vocoder is too robotic',
    'Blend vocoder with dry signal',
  ],
};

const AUTO_TUNE: DomainNoun = {
  id: 'noun:auto_tune',
  term: 'auto-tune',
  variants: ['pitch correction', 'tuning', 'vocal tuning'],
  category: 'effect',
  definition: 'Automatic pitch correction effect',
  semantics: {
    type: 'effect',
    domain: 'production',
    device: 'pitch_quantization',
  },
  examples: [
    'Add auto-tune to the vocals',
    'The auto-tune is too obvious',
    'Use subtle pitch correction',
  ],
};

// =============================================================================
// Sampling Terms
// =============================================================================

const SAMPLE: DomainNoun = {
  id: 'noun:sample',
  term: 'sample',
  variants: ['audio sample', 'sampled audio', 'recording'],
  category: 'production',
  definition: 'A recorded snippet of audio used as source material',
  semantics: {
    type: 'entity',
    domain: 'production',
    entityType: 'audio_source',
  },
  examples: [
    'Chop the sample finer',
    'The sample is too long',
    'Layer multiple samples',
  ],
};

const ONE_SHOT: DomainNoun = {
  id: 'noun:one_shot',
  term: 'one-shot',
  variants: ['single hit', 'drum hit', 'sample hit'],
  category: 'production',
  definition: 'A non-looping sample triggered once',
  semantics: {
    type: 'entity',
    domain: 'production',
    entityType: 'sample_type',
  },
  examples: [
    'Replace with a tighter one-shot',
    'The one-shot is too long',
    'Use a one-shot for accents',
  ],
};

const LOOP: DomainNoun = {
  id: 'noun:loop',
  term: 'loop',
  variants: ['audio loop', 'repeating sample', 'cycled audio'],
  category: 'production',
  definition: 'A sample that repeats seamlessly',
  semantics: {
    type: 'entity',
    domain: 'production',
    entityType: 'sample_type',
  },
  examples: [
    'The loop does not sync properly',
    'Add a drum loop',
    'Make the loop seamless',
  ],
};

const TIME_STRETCH: DomainNoun = {
  id: 'noun:time_stretch',
  term: 'time stretch',
  variants: ['time-stretching', 'tempo change', 'pitch-independent'],
  category: 'technique',
  definition: 'Changing duration without affecting pitch',
  semantics: {
    type: 'technique',
    domain: 'production',
    device: 'temporal_manipulation',
  },
  examples: [
    'Time stretch the vocal',
    'The time stretch sounds artificial',
    'Use high-quality time stretching',
  ],
};

const PITCH_SHIFT: DomainNoun = {
  id: 'noun:pitch_shift',
  term: 'pitch shift',
  variants: ['pitch-shifting', 'transposition', 'pitch change'],
  category: 'technique',
  definition: 'Changing pitch without affecting duration',
  semantics: {
    type: 'technique',
    domain: 'production',
    device: 'pitch_manipulation',
  },
  examples: [
    'Pitch shift down an octave',
    'The pitch shift is too obvious',
    'Add subtle pitch shifting',
  ],
};

const REVERSE: DomainNoun = {
  id: 'noun:reverse',
  term: 'reverse',
  variants: ['reversed', 'backward', 'reverse audio'],
  category: 'effect',
  definition: 'Playing audio backward in time',
  semantics: {
    type: 'effect',
    domain: 'production',
    device: 'temporal_reversal',
  },
  examples: [
    'Add a reverse cymbal',
    'The reverse effect is too loud',
    'Use reverse for transitions',
  ],
};

// =============================================================================
// Bass Music Terms
// =============================================================================

const SUB_BASS: DomainNoun = {
  id: 'noun:sub_bass',
  term: 'sub bass',
  variants: ['sub', 'subsonic', 'low frequency'],
  category: 'production',
  definition: 'Very low-frequency bass below ~60Hz',
  semantics: {
    type: 'concept',
    domain: 'production',
    aspect: 'frequency_range',
  },
  examples: [
    'Add more sub bass',
    'The sub bass is too loud',
    'Tighten the sub bass',
  ],
};

const WOBBLE: DomainNoun = {
  id: 'noun:wobble',
  term: 'wobble',
  variants: ['wobble bass', 'wub', 'modulated bass'],
  category: 'production',
  definition: 'Rhythmically modulated bass sound',
  semantics: {
    type: 'effect',
    domain: 'production',
    device: 'rhythmic_modulation',
  },
  examples: [
    'Add wobble to the bass',
    'The wobble is too fast',
    'Sync the wobble to the beat',
  ],
};

const DROP: DomainNoun = {
  id: 'noun:drop',
  term: 'drop',
  variants: ['the drop', 'bass drop', 'climax'],
  category: 'form',
  definition: 'The moment of maximum energy release in electronic music',
  semantics: {
    type: 'concept',
    domain: 'form',
    aspect: 'structural_climax',
  },
  examples: [
    'Build to the drop',
    'The drop needs more impact',
    'Add a second drop',
  ],
};

const BUILDUP: DomainNoun = {
  id: 'noun:buildup',
  term: 'buildup',
  variants: ['build', 'riser', 'tension build'],
  category: 'form',
  definition: 'A section that increases tension before a drop',
  semantics: {
    type: 'concept',
    domain: 'form',
    aspect: 'tension_increase',
  },
  examples: [
    'Extend the buildup',
    'The buildup is too long',
    'Add a riser to the buildup',
  ],
};

const BREAKDOWN: DomainNoun = {
  id: 'noun:breakdown',
  term: 'breakdown',
  variants: ['break', 'stripped section', 'minimal section'],
  category: 'form',
  definition: 'A sparse section with reduced energy',
  semantics: {
    type: 'concept',
    domain: 'form',
    aspect: 'energy_reduction',
  },
  examples: [
    'Add a breakdown after the drop',
    'The breakdown is too long',
    'Make the breakdown more minimal',
  ],
};

// =============================================================================
// Exports
// =============================================================================

export const SYNTHESIS_NOUNS: readonly DomainNoun[] = [
  SYNTHESIS,
  OSCILLATOR,
  FILTER,
  ENVELOPE,
  LFO,
  WAVEFORM,
  MODULATION,
  WAVETABLE,
  GRANULAR,
  FM_SYNTHESIS,
] as const;

export const SOUND_DESIGN_NOUNS: readonly DomainNoun[] = [
  SOUND_DESIGN,
  PATCH,
  TEXTURE,
  NOISE,
  GLITCH,
] as const;

export const PRODUCTION_EFFECT_NOUNS: readonly DomainNoun[] = [
  SIDECHAIN,
  SATURATION,
  BIT_CRUSH,
  VOCODER,
  AUTO_TUNE,
] as const;

export const SAMPLING_NOUNS: readonly DomainNoun[] = [
  SAMPLE,
  ONE_SHOT,
  LOOP,
  TIME_STRETCH,
  PITCH_SHIFT,
  REVERSE,
] as const;

export const BASS_MUSIC_NOUNS: readonly DomainNoun[] = [
  SUB_BASS,
  WOBBLE,
  DROP,
  BUILDUP,
  BREAKDOWN,
] as const;

export const BATCH_14_NOUNS: readonly DomainNoun[] = [
  ...SYNTHESIS_NOUNS,
  ...SOUND_DESIGN_NOUNS,
  ...PRODUCTION_EFFECT_NOUNS,
  ...SAMPLING_NOUNS,
  ...BASS_MUSIC_NOUNS,
] as const;

export default BATCH_14_NOUNS;
