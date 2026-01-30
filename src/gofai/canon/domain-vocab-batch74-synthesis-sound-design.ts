/**
 * @file Domain Vocabulary Batch 74 - Synthesis, Sound Design, and Modulation
 * @module gofai/canon/domain-vocab-batch74-synthesis-sound-design
 * 
 * Comprehensive vocabulary for synthesis, sound design, and modulation:
 * - Synthesis types (subtractive, additive, FM, wavetable, granular)
 * - Oscillator types and waveforms
 * - Filter types and characteristics  
 * - Envelope parameters and shapes
 * - Modulation sources and destinations
 * - Sound design techniques and terminology
 * - Patch programming concepts
 * - Timbre manipulation
 * 
 * Part of systematic vocabulary expansion for GOFAI natural language understanding.
 * 
 * @see gofai_goalB.md Phase 1
 * @see docs/gofai/vocabulary-coverage.md
 */

import type { Lexeme } from './types.js';

// ============================================================================
// SYNTHESIS TYPES AND METHODS
// ============================================================================

export const SYNTHESIS_TYPES_LEXEMES: readonly Lexeme[] = [
  {
    id: 'lex:noun:subtractive_synthesis',
    surface: ['subtractive synthesis', 'subtractive', 'analog synthesis', 'filter synthesis'],
    category: 'noun',
    semanticTags: ['synthesis', 'sound_design', 'technique', 'classic'],
    meaning: 'synthesis method using oscillators and filters to subtract harmonics',
    examples: ['use subtractive synthesis', 'classic analog subtractive', 'filter-based sound']
  },
  {
    id: 'lex:noun:additive_synthesis',
    surface: ['additive synthesis', 'additive', 'harmonic synthesis', 'partial synthesis'],
    category: 'noun',
    semanticTags: ['synthesis', 'sound_design', 'technique', 'complex'],
    meaning: 'synthesis method building sound from individual sine wave partials',
    examples: ['additive synthesis bells', 'control individual harmonics', 'complex additive patch']
  },
  {
    id: 'lex:noun:fm_synthesis',
    surface: ['FM synthesis', 'frequency modulation', 'FM', 'frequency mod'],
    category: 'noun',
    semanticTags: ['synthesis', 'sound_design', 'technique', 'digital'],
    meaning: 'synthesis using frequency modulation between oscillators',
    examples: ['FM synthesis bass', 'FM bell tones', 'modulate carrier frequency']
  },
  {
    id: 'lex:noun:wavetable_synthesis',
    surface: ['wavetable synthesis', 'wavetable', 'wave scanning', 'wavetable scan'],
    category: 'noun',
    semanticTags: ['synthesis', 'sound_design', 'technique', 'digital'],
    meaning: 'synthesis scanning through stored waveform tables',
    examples: ['wavetable synthesis pad', 'scan through wavetables', 'evolving wavetable']
  },
  {
    id: 'lex:noun:granular_synthesis',
    surface: ['granular synthesis', 'granular', 'grain synthesis', 'microsound'],
    category: 'noun',
    semanticTags: ['synthesis', 'sound_design', 'technique', 'experimental'],
    meaning: 'synthesis using tiny audio grains for complex textures',
    examples: ['granular texture', 'grain cloud', 'granular processing']
  },
  {
    id: 'lex:noun:sample_playback',
    surface: ['sample playback', 'sampling', 'rompler', 'sample-based'],
    category: 'noun',
    semanticTags: ['synthesis', 'sound_design', 'technique', 'realistic'],
    meaning: 'synthesis method playing back recorded samples',
    examples: ['sample playback piano', 'realistic sample-based sounds']
  },
  {
    id: 'lex:noun:physical_modeling',
    surface: ['physical modeling', 'modeling', 'physical model', 'mathematical modeling'],
    category: 'noun',
    semanticTags: ['synthesis', 'sound_design', 'technique', 'realistic'],
    meaning: 'synthesis simulating physical acoustic behavior',
    examples: ['physical modeling strings', 'modeled resonance', 'physical model brass']
  },
  {
    id: 'lex:noun:hybrid_synthesis',
    surface: ['hybrid synthesis', 'hybrid', 'mixed synthesis', 'combination synthesis'],
    category: 'noun',
    semanticTags: ['synthesis', 'sound_design', 'technique', 'versatile'],
    meaning: 'synthesis combining multiple synthesis methods',
    examples: ['hybrid analog-digital', 'combine FM with subtractive', 'mixed synthesis approach']
  },
  {
    id: 'lex:noun:vector_synthesis',
    surface: ['vector synthesis', 'vector', 'morphing synthesis', 'crossfade synthesis'],
    category: 'noun',
    semanticTags: ['synthesis', 'sound_design', 'technique', 'dynamic'],
    meaning: 'synthesis blending multiple sources via joystick or automation',
    examples: ['vector synthesis pad', 'morph between oscillators', 'dynamic vector movement']
  },
  {
    id: 'lex:noun:phase_distortion',
    surface: ['phase distortion', 'PD synthesis', 'phase modulation', 'waveshaping'],
    category: 'noun',
    semanticTags: ['synthesis', 'sound_design', 'technique', 'digital'],
    meaning: 'synthesis distorting phase of waveform for harmonic content',
    examples: ['phase distortion bass', 'PD metallic tones', 'waveshaping synthesis']
  }
];

// ============================================================================
// OSCILLATOR TYPES AND WAVEFORMS
// ============================================================================

export const OSCILLATOR_LEXEMES: readonly Lexeme[] = [
  {
    id: 'lex:noun:oscillator',
    surface: ['oscillator', 'osc', 'tone generator', 'voice'],
    category: 'noun',
    semanticTags: ['synthesis', 'component', 'sound_source', 'fundamental'],
    meaning: 'sound source generating periodic waveforms',
    examples: ['detune oscillators', 'three oscillator design', 'oscillator pitch']
  },
  {
    id: 'lex:noun:sine_wave',
    surface: ['sine wave', 'sine', 'sinusoid', 'pure tone'],
    category: 'noun',
    semanticTags: ['synthesis', 'waveform', 'pure', 'fundamental'],
    meaning: 'pure waveform with no harmonics',
    examples: ['sine wave sub bass', 'pure sine tone', 'fundamental frequency']
  },
  {
    id: 'lex:noun:triangle_wave',
    surface: ['triangle wave', 'triangle', 'triangular waveform'],
    category: 'noun',
    semanticTags: ['synthesis', 'waveform', 'basic', 'hollow'],
    meaning: 'waveform with odd harmonics, softer than square',
    examples: ['triangle wave lead', 'hollow triangle tone', 'mellow waveform']
  },
  {
    id: 'lex:noun:sawtooth_wave',
    surface: ['sawtooth wave', 'sawtooth', 'saw', 'ramp wave'],
    category: 'noun',
    semanticTags: ['synthesis', 'waveform', 'basic', 'bright'],
    meaning: 'waveform with all harmonics, bright and buzzy',
    examples: ['sawtooth bass', 'bright saw lead', 'harsh sawtooth']
  },
  {
    id: 'lex:noun:square_wave',
    surface: ['square wave', 'square', 'pulse', 'rectangular wave'],
    category: 'noun',
    semanticTags: ['synthesis', 'waveform', 'basic', 'hollow'],
    meaning: 'waveform with odd harmonics, hollow character',
    examples: ['square wave bass', 'hollow pulse tone', 'clarinet-like square']
  },
  {
    id: 'lex:noun:pulse_width',
    surface: ['pulse width', 'duty cycle', 'pulse shape', 'waveform width'],
    category: 'noun',
    semanticTags: ['synthesis', 'parameter', 'modulation', 'timbre'],
    meaning: 'ratio of high to low in pulse/square wave',
    examples: ['modulate pulse width', 'narrow pulse width', 'PWM effect']
  },
  {
    id: 'lex:noun:pwm',
    surface: ['PWM', 'pulse width modulation', 'pulse mod', 'width modulation'],
    category: 'noun',
    semanticTags: ['synthesis', 'modulation', 'technique', 'classic'],
    meaning: 'modulation of pulse width for animated timbre',
    examples: ['add PWM', 'slow PWM sweep', 'classic PWM sound']
  },
  {
    id: 'lex:noun:noise_oscillator',
    surface: ['noise oscillator', 'noise generator', 'white noise', 'pink noise'],
    category: 'noun',
    semanticTags: ['synthesis', 'sound_source', 'noise', 'texture'],
    meaning: 'generator producing random noise for texture',
    examples: ['add noise oscillator', 'white noise layer', 'filtered pink noise']
  },
  {
    id: 'lex:noun:sub_oscillator',
    surface: ['sub oscillator', 'sub osc', 'octave down', 'bass oscillator'],
    category: 'noun',
    semanticTags: ['synthesis', 'component', 'bass', 'depth'],
    meaning: 'oscillator one or two octaves below main pitch',
    examples: ['add sub oscillator', 'deep sub bass', 'octave down layer']
  },
  {
    id: 'lex:noun:sync',
    surface: ['oscillator sync', 'hard sync', 'sync', 'osc sync'],
    category: 'noun',
    semanticTags: ['synthesis', 'technique', 'modulation', 'aggressive'],
    meaning: 'forcing one oscillator to reset by another',
    examples: ['hard sync lead', 'sync sweep', 'aggressive sync tone']
  },
  {
    id: 'lex:noun:ring_modulation',
    surface: ['ring modulation', 'ring mod', 'RM', 'amplitude modulation'],
    category: 'noun',
    semanticTags: ['synthesis', 'technique', 'modulation', 'metallic'],
    meaning: 'multiplying two signals for metallic tones',
    examples: ['ring mod bell', 'metallic ring modulation', 'strange RM texture']
  },
  {
    id: 'lex:noun:detune',
    surface: ['detune', 'detuning', 'pitch spread', 'chorus effect'],
    category: 'noun',
    semanticTags: ['synthesis', 'parameter', 'timbre', 'width'],
    meaning: 'slight pitch difference between oscillators',
    examples: ['add detune', 'thick detuned sound', 'slight pitch spread']
  },
  {
    id: 'lex:verb:detune',
    surface: ['detune', 'spread', 'widen', 'pitch shift'],
    category: 'verb',
    semanticTags: ['synthesis', 'edit', 'timbre', 'width'],
    meaning: 'adjust relative pitch between oscillators',
    examples: ['detune the oscillators', 'spread the voices', 'slightly detune']
  },
  {
    id: 'lex:noun:unison',
    surface: ['unison', 'voice stacking', 'multi-voice', 'thick unison'],
    category: 'noun',
    semanticTags: ['synthesis', 'technique', 'width', 'power'],
    meaning: 'multiple detuned voices playing same note',
    examples: ['thick unison', 'seven voice stack', 'wide unison detune']
  }
];

// ============================================================================
// FILTER TYPES AND PARAMETERS
// ============================================================================

export const FILTER_LEXEMES: readonly Lexeme[] = [
  {
    id: 'lex:noun:low_pass_filter',
    surface: ['low pass filter', 'low-pass', 'LPF', 'highcut filter'],
    category: 'noun',
    semanticTags: ['synthesis', 'filter', 'processing', 'fundamental'],
    meaning: 'filter removing frequencies above cutoff',
    examples: ['low pass sweep', 'classic LPF', 'cut the highs']
  },
  {
    id: 'lex:noun:high_pass_filter',
    surface: ['high pass filter', 'high-pass', 'HPF', 'lowcut filter'],
    category: 'noun',
    semanticTags: ['synthesis', 'filter', 'processing', 'clarity'],
    meaning: 'filter removing frequencies below cutoff',
    examples: ['high pass to clean', 'HPF the bass', 'remove rumble']
  },
  {
    id: 'lex:noun:band_pass_filter',
    surface: ['band pass filter', 'band-pass', 'BPF', 'bandpass'],
    category: 'noun',
    semanticTags: ['synthesis', 'filter', 'processing', 'focused'],
    meaning: 'filter passing only frequencies near cutoff',
    examples: ['band pass sweep', 'narrow BPF', 'telephone filter effect']
  },
  {
    id: 'lex:noun:notch_filter',
    surface: ['notch filter', 'band reject', 'band stop', 'notch'],
    category: 'noun',
    semanticTags: ['synthesis', 'filter', 'processing', 'surgical'],
    meaning: 'filter removing frequencies near cutoff',
    examples: ['notch filter resonance', 'remove specific frequency', 'band reject sweep']
  },
  {
    id: 'lex:noun:comb_filter',
    surface: ['comb filter', 'comb', 'phaser effect', 'resonant peaks'],
    category: 'noun',
    semanticTags: ['synthesis', 'filter', 'processing', 'metallic'],
    meaning: 'filter with multiple evenly-spaced notches',
    examples: ['comb filter texture', 'metallic comb effect', 'resonant peaks']
  },
  {
    id: 'lex:noun:formant_filter',
    surface: ['formant filter', 'formant', 'vocal filter', 'vowel filter'],
    category: 'noun',
    semanticTags: ['synthesis', 'filter', 'processing', 'vocal'],
    meaning: 'filter emphasizing vocal formant peaks',
    examples: ['formant filter sweep', 'vowel morphing', 'vocal character']
  },
  {
    id: 'lex:noun:cutoff_frequency',
    surface: ['cutoff frequency', 'cutoff', 'corner frequency', 'filter frequency'],
    category: 'noun',
    semanticTags: ['synthesis', 'parameter', 'filter', 'fundamental'],
    meaning: 'frequency where filter begins attenuating',
    examples: ['sweep cutoff', 'raise cutoff frequency', 'open the filter']
  },
  {
    id: 'lex:noun:resonance',
    surface: ['resonance', 'Q', 'emphasis', 'filter peak'],
    category: 'noun',
    semanticTags: ['synthesis', 'parameter', 'filter', 'character'],
    meaning: 'emphasis of frequencies near filter cutoff',
    examples: ['increase resonance', 'add filter peak', 'screaming resonance']
  },
  {
    id: 'lex:noun:filter_slope',
    surface: ['filter slope', 'roll-off', 'filter poles', 'attenuation rate'],
    category: 'noun',
    semanticTags: ['synthesis', 'parameter', 'filter', 'character'],
    meaning: 'steepness of filter attenuation curve',
    examples: ['24dB per octave', 'steep filter slope', 'four-pole filter']
  },
  {
    id: 'lex:noun:filter_envelope',
    surface: ['filter envelope', 'envelope to filter', 'filter modulation', 'filter EG'],
    category: 'noun',
    semanticTags: ['synthesis', 'modulation', 'filter', 'dynamic'],
    meaning: 'envelope controlling filter cutoff over time',
    examples: ['add filter envelope', 'slow filter opening', 'envelope amount to cutoff']
  },
  {
    id: 'lex:noun:self_oscillation',
    surface: ['self oscillation', 'filter feedback', 'resonant sine', 'infinite Q'],
    category: 'noun',
    semanticTags: ['synthesis', 'filter', 'technique', 'extreme'],
    meaning: 'filter resonance high enough to generate tone',
    examples: ['filter self oscillates', 'use as sine oscillator', 'extreme resonance tone']
  },
  {
    id: 'lex:noun:ladder_filter',
    surface: ['ladder filter', 'Moog filter', 'transistor ladder', '24dB filter'],
    category: 'noun',
    semanticTags: ['synthesis', 'filter', 'classic', 'analog'],
    meaning: 'classic four-pole transistor ladder filter design',
    examples: ['Moog ladder sound', 'classic analog filter', 'creamy ladder response']
  },
  {
    id: 'lex:noun:state_variable_filter',
    surface: ['state variable filter', 'SV filter', 'multi-mode filter', 'SVF'],
    category: 'noun',
    semanticTags: ['synthesis', 'filter', 'versatile', 'modern'],
    meaning: 'filter topology providing multiple simultaneous outputs',
    examples: ['state variable design', 'parallel filter outputs', 'SVF topology']
  }
];

// ============================================================================
// ENVELOPE PARAMETERS AND SHAPES
// ============================================================================

export const ENVELOPE_LEXEMES: readonly Lexeme[] = [
  {
    id: 'lex:noun:adsr',
    surface: ['ADSR', 'envelope', 'ADSR envelope', 'amplitude envelope'],
    category: 'noun',
    semanticTags: ['synthesis', 'modulation', 'fundamental', 'dynamic'],
    meaning: 'attack-decay-sustain-release envelope shape',
    examples: ['classic ADSR', 'adjust envelope shape', 'pluck ADSR']
  },
  {
    id: 'lex:noun:attack_time',
    surface: ['attack time', 'attack', 'onset time', 'rise time'],
    category: 'noun',
    semanticTags: ['synthesis', 'parameter', 'envelope', 'dynamic'],
    meaning: 'time for envelope to reach peak from note-on',
    examples: ['fast attack', 'slow attack swell', 'instant attack time']
  },
  {
    id: 'lex:noun:decay_time',
    surface: ['decay time', 'decay', 'initial decay', 'fall time'],
    category: 'noun',
    semanticTags: ['synthesis', 'parameter', 'envelope', 'dynamic'],
    meaning: 'time for envelope to fall from peak to sustain level',
    examples: ['short decay', 'pluck decay curve', 'adjust decay rate']
  },
  {
    id: 'lex:noun:sustain_level',
    surface: ['sustain level', 'sustain', 'held level', 'plateau'],
    category: 'noun',
    semanticTags: ['synthesis', 'parameter', 'envelope', 'dynamic'],
    meaning: 'level envelope maintains while note is held',
    examples: ['full sustain', 'low sustain level', 'pad sustain']
  },
  {
    id: 'lex:noun:release_time',
    surface: ['release time', 'release', 'decay after release', 'tail time'],
    category: 'noun',
    semanticTags: ['synthesis', 'parameter', 'envelope', 'dynamic'],
    meaning: 'time for envelope to fade after note-off',
    examples: ['long release', 'natural release tail', 'quick release']
  },
  {
    id: 'lex:noun:envelope_generator',
    surface: ['envelope generator', 'EG', 'envelope gen', 'envelope source'],
    category: 'noun',
    semanticTags: ['synthesis', 'component', 'modulation', 'control'],
    meaning: 'module generating time-varying control signal',
    examples: ['dedicated envelope generator', 'multi-stage EG', 'looping envelope']
  },
  {
    id: 'lex:noun:ad_envelope',
    surface: ['AD envelope', 'attack-decay', 'two-stage envelope', 'simple envelope'],
    category: 'noun',
    semanticTags: ['synthesis', 'modulation', 'simple', 'percussive'],
    meaning: 'simplified envelope with only attack and decay',
    examples: ['AD envelope for percussion', 'simple attack-decay', 'pluck envelope']
  },
  {
    id: 'lex:noun:multi_stage_envelope',
    surface: ['multi-stage envelope', 'complex envelope', 'many-stage EG', 'advanced envelope'],
    category: 'noun',
    semanticTags: ['synthesis', 'modulation', 'complex', 'flexible'],
    meaning: 'envelope with more than four stages',
    examples: ['six-stage envelope', 'complex envelope shape', 'multi-breakpoint EG']
  },
  {
    id: 'lex:noun:envelope_curve',
    surface: ['envelope curve', 'curve shape', 'envelope slope', 'curve type'],
    category: 'noun',
    semanticTags: ['synthesis', 'parameter', 'envelope', 'shape'],
    meaning: 'shape of envelope transitions (linear, exponential, etc.)',
    examples: ['exponential curve', 'linear envelope', 'natural decay curve']
  },
  {
    id: 'lex:noun:velocity_sensitivity',
    surface: ['velocity sensitivity', 'velocity response', 'dynamic response', 'touch sensitivity'],
    category: 'noun',
    semanticTags: ['synthesis', 'parameter', 'expressive', 'dynamic'],
    meaning: 'how much velocity affects envelope or filter',
    examples: ['increase velocity sensitivity', 'expressive velocity response', 'dynamic touch']
  }
];

// ============================================================================
// MODULATION SOURCES AND ROUTING
// ============================================================================

export const MODULATION_LEXEMES: readonly Lexeme[] = [
  {
    id: 'lex:noun:lfo',
    surface: ['LFO', 'low frequency oscillator', 'modulator', 'LFO source'],
    category: 'noun',
    semanticTags: ['synthesis', 'modulation', 'fundamental', 'periodic'],
    meaning: 'slow oscillator for modulation purposes',
    examples: ['add LFO', 'vibrato LFO', 'slow LFO rate']
  },
  {
    id: 'lex:noun:vibrato',
    surface: ['vibrato', 'pitch vibrato', 'pitch modulation', 'pitch LFO'],
    category: 'noun',
    semanticTags: ['synthesis', 'modulation', 'pitch', 'expressive'],
    meaning: 'periodic pitch modulation',
    examples: ['add vibrato', 'slow vibrato rate', 'expressive pitch vibrato']
  },
  {
    id: 'lex:noun:tremolo',
    surface: ['tremolo', 'amplitude modulation', 'volume modulation', 'amplitude LFO'],
    category: 'noun',
    semanticTags: ['synthesis', 'modulation', 'amplitude', 'rhythmic'],
    meaning: 'periodic amplitude modulation',
    examples: ['add tremolo', 'slow tremolo pulse', 'rhythmic amplitude mod']
  },
  {
    id: 'lex:noun:modulation_matrix',
    surface: ['modulation matrix', 'mod matrix', 'routing matrix', 'mod destinations'],
    category: 'noun',
    semanticTags: ['synthesis', 'architecture', 'modulation', 'flexible'],
    meaning: 'system for routing modulation sources to destinations',
    examples: ['flexible mod matrix', 'assign modulation', 'complex routing']
  },
  {
    id: 'lex:noun:modulation_depth',
    surface: ['modulation depth', 'mod amount', 'modulation intensity', 'mod depth'],
    category: 'noun',
    semanticTags: ['synthesis', 'parameter', 'modulation', 'amount'],
    meaning: 'intensity of modulation effect',
    examples: ['increase mod depth', 'subtle modulation amount', 'extreme modulation']
  },
  {
    id: 'lex:noun:modulation_rate',
    surface: ['modulation rate', 'LFO rate', 'mod speed', 'LFO frequency'],
    category: 'noun',
    semanticTags: ['synthesis', 'parameter', 'modulation', 'speed'],
    meaning: 'speed of periodic modulation',
    examples: ['fast LFO rate', 'slow modulation speed', 'adjust mod rate']
  },
  {
    id: 'lex:noun:aftertouch',
    surface: ['aftertouch', 'channel pressure', 'poly aftertouch', 'key pressure'],
    category: 'noun',
    semanticTags: ['synthesis', 'modulation', 'expressive', 'keyboard'],
    meaning: 'pressure applied after key is pressed',
    examples: ['modulate with aftertouch', 'expressive pressure', 'aftertouch to filter']
  },
  {
    id: 'lex:noun:modulation_wheel',
    surface: ['modulation wheel', 'mod wheel', 'mod control', 'vibrato wheel'],
    category: 'noun',
    semanticTags: ['synthesis', 'modulation', 'controller', 'expressive'],
    meaning: 'physical controller for real-time modulation',
    examples: ['use mod wheel', 'assign to mod wheel', 'expressive wheel control']
  },
  {
    id: 'lex:noun:macro_control',
    surface: ['macro control', 'macro', 'super control', 'meta parameter'],
    category: 'noun',
    semanticTags: ['synthesis', 'control', 'complex', 'efficient'],
    meaning: 'single control affecting multiple parameters',
    examples: ['assign to macro', 'comprehensive macro control', 'one-knob timbre change']
  },
  {
    id: 'lex:noun:sample_and_hold',
    surface: ['sample and hold', 'S&H', 'random steps', 'stepped random'],
    category: 'noun',
    semanticTags: ['synthesis', 'modulation', 'random', 'stepped'],
    meaning: 'modulation source that holds random values',
    examples: ['S&H to filter', 'random stepped modulation', 'sample and hold texture']
  },
  {
    id: 'lex:noun:envelope_follower',
    surface: ['envelope follower', 'envelope tracking', 'amplitude follower', 'dynamics tracking'],
    category: 'noun',
    semanticTags: ['synthesis', 'modulation', 'dynamic', 'reactive'],
    meaning: 'modulation source tracking input amplitude',
    examples: ['envelope follower modulation', 'track input dynamics', 'amplitude-reactive filter']
  }
];

// ============================================================================
// SOUND DESIGN TECHNIQUES
// ============================================================================

export const SOUND_DESIGN_LEXEMES: readonly Lexeme[] = [
  {
    id: 'lex:noun:layering',
    surface: ['layering', 'sound layering', 'multi-layer', 'stacking sounds'],
    category: 'noun',
    semanticTags: ['sound_design', 'technique', 'complexity', 'depth'],
    meaning: 'combining multiple sounds for complexity',
    examples: ['layer multiple synths', 'complex layering', 'three-layer sound']
  },
  {
    id: 'lex:verb:layer',
    surface: ['layer', 'stack', 'combine', 'blend sounds'],
    category: 'verb',
    semanticTags: ['sound_design', 'technique', 'edit', 'composition'],
    meaning: 'combine multiple sounds together',
    examples: ['layer the pads', 'stack oscillators', 'blend multiple sources']
  },
  {
    id: 'lex:noun:spectral_layering',
    surface: ['spectral layering', 'frequency layering', 'spectral stacking', 'freq separation'],
    category: 'noun',
    semanticTags: ['sound_design', 'technique', 'frequency', 'separation'],
    meaning: 'layering sounds in different frequency ranges',
    examples: ['spectral layer separation', 'frequency-specific layers', 'low-mid-high layering']
  },
  {
    id: 'lex:noun:resampling',
    surface: ['resampling', 'resample', 'bounce and resample', 'audio recycling'],
    category: 'noun',
    semanticTags: ['sound_design', 'technique', 'transformation', 'creative'],
    meaning: 'recording sound and using it as new source',
    examples: ['resample the texture', 'bounce and mangle', 'creative resampling']
  },
  {
    id: 'lex:verb:resample',
    surface: ['resample', 'bounce down', 'print', 'capture audio'],
    category: 'verb',
    semanticTags: ['sound_design', 'technique', 'edit', 'transformation'],
    meaning: 'record synthesized sound for further processing',
    examples: ['resample the patch', 'print to audio', 'capture and process']
  },
  {
    id: 'lex:noun:morphing',
    surface: ['morphing', 'sound morphing', 'crossfading', 'blending'],
    category: 'noun',
    semanticTags: ['sound_design', 'technique', 'transformation', 'dynamic'],
    meaning: 'gradual transformation between different sounds',
    examples: ['morph between patches', 'smooth sound transformation', 'dynamic morphing']
  },
  {
    id: 'lex:verb:morph',
    surface: ['morph', 'blend', 'crossfade', 'transition'],
    category: 'verb',
    semanticTags: ['sound_design', 'technique', 'edit', 'dynamic'],
    meaning: 'gradually transform one sound into another',
    examples: ['morph to different timbre', 'smoothly blend', 'crossfade between sources']
  },
  {
    id: 'lex:noun:sound_mangling',
    surface: ['sound mangling', 'mangling', 'glitching', 'destruction'],
    category: 'noun',
    semanticTags: ['sound_design', 'technique', 'experimental', 'aggressive'],
    meaning: 'aggressive processing for unusual textures',
    examples: ['extreme sound mangling', 'glitched texture', 'destructive processing']
  },
  {
    id: 'lex:verb:mangle',
    surface: ['mangle', 'destroy', 'glitch', 'distort heavily'],
    category: 'verb',
    semanticTags: ['sound_design', 'technique', 'edit', 'aggressive'],
    meaning: 'aggressively process sound for texture',
    examples: ['mangle the sample', 'destroy the original', 'heavily glitch']
  },
  {
    id: 'lex:noun:texture_design',
    surface: ['texture design', 'textural sound', 'ambient texture', 'sonic texture'],
    category: 'noun',
    semanticTags: ['sound_design', 'technique', 'ambient', 'atmospheric'],
    meaning: 'creating complex atmospheric sound textures',
    examples: ['design ambient textures', 'evolving sonic texture', 'textural pad']
  },
  {
    id: 'lex:noun:modular_approach',
    surface: ['modular approach', 'modular thinking', 'patch programming', 'signal flow'],
    category: 'noun',
    semanticTags: ['sound_design', 'technique', 'architecture', 'flexible'],
    meaning: 'building sounds from interconnected modules',
    examples: ['modular sound design', 'flexible signal flow', 'patch cable thinking']
  },
  {
    id: 'lex:noun:preset',
    surface: ['preset', 'patch', 'sound', 'program'],
    category: 'noun',
    semanticTags: ['sound_design', 'synthesis', 'storage', 'recall'],
    meaning: 'saved synthesizer settings',
    examples: ['recall preset', 'save patch', 'browse sounds']
  },
  {
    id: 'lex:noun:initialization',
    surface: ['initialization', 'init patch', 'blank slate', 'default state'],
    category: 'noun',
    semanticTags: ['sound_design', 'synthesis', 'starting_point', 'neutral'],
    meaning: 'basic starting point for sound design',
    examples: ['start from init', 'blank patch', 'initialize synthesizer']
  },
  {
    id: 'lex:verb:initialize',
    surface: ['initialize', 'reset', 'clear patch', 'start fresh'],
    category: 'verb',
    semanticTags: ['sound_design', 'synthesis', 'edit', 'reset'],
    meaning: 'reset synthesizer to basic starting state',
    examples: ['initialize the patch', 'clear all settings', 'reset to default']
  }
];

// ============================================================================
// TIMBRE AND CHARACTER DESCRIPTORS
// ============================================================================

export const TIMBRE_DESCRIPTORS_LEXEME: readonly Lexeme[] = [
  {
    id: 'lex:adj:analog',
    surface: ['analog', 'analogue', 'analog-style', 'vintage analog'],
    category: 'adj',
    semanticTags: ['timbre', 'character', 'warm', 'classic'],
    meaning: 'having warm character of analog circuitry',
    examples: ['analog warmth', 'vintage analog sound', 'analog-style synthesis']
  },
  {
    id: 'lex:adj:digital',
    surface: ['digital', 'digital-sounding', 'precise digital', 'clean digital'],
    category: 'adj',
    semanticTags: ['timbre', 'character', 'precise', 'modern'],
    meaning: 'having precise character of digital processing',
    examples: ['digital precision', 'clean digital sound', 'modern digital timbre']
  },
  {
    id: 'lex:adj:harsh',
    surface: ['harsh', 'aggressive', 'edgy', 'abrasive'],
    category: 'adj',
    semanticTags: ['timbre', 'character', 'aggressive', 'distorted'],
    meaning: 'having rough or aggressive tonal quality',
    examples: ['harsh distortion', 'aggressive timbre', 'edgy resonance']
  },
  {
    id: 'lex:adj:smooth',
    surface: ['smooth', 'silky', 'polished', 'refined'],
    category: 'adj',
    semanticTags: ['timbre', 'character', 'refined', 'pleasant'],
    meaning: 'having refined pleasant tonal quality',
    examples: ['smooth filter', 'silky pad', 'polished sound']
  },
  {
    id: 'lex:adj:metallic',
    surface: ['metallic', 'bell-like', 'inharmonic', 'clangy'],
    category: 'adj',
    semanticTags: ['timbre', 'character', 'inharmonic', 'FM'],
    meaning: 'having bell-like inharmonic partials',
    examples: ['metallic FM', 'bell-like timbre', 'clangy resonance']
  },
  {
    id: 'lex:adj:wooden',
    surface: ['wooden', 'hollow', 'acoustic', 'natural'],
    category: 'adj',
    semanticTags: ['timbre', 'character', 'acoustic', 'natural'],
    meaning: 'having hollow acoustic wood-like quality',
    examples: ['wooden percussion', 'hollow resonance', 'natural acoustic']
  },
  {
    id: 'lex:adj:glassy',
    surface: ['glassy', 'crystalline', 'clear', 'transparent'],
    category: 'adj',
    semanticTags: ['timbre', 'character', 'clear', 'delicate'],
    meaning: 'having clear delicate crystalline quality',
    examples: ['glassy pad', 'crystalline bells', 'transparent texture']
  },
  {
    id: 'lex:adj:evolving',
    surface: ['evolving', 'morphing', 'moving', 'dynamic'],
    category: 'adj',
    semanticTags: ['timbre', 'character', 'dynamic', 'changing'],
    meaning: 'having timbre that changes over time',
    examples: ['evolving pad', 'morphing texture', 'dynamic timbre']
  },
  {
    id: 'lex:adj:static',
    surface: ['static', 'unchanging', 'stable', 'constant'],
    category: 'adj',
    semanticTags: ['timbre', 'character', 'stable', 'consistent'],
    meaning: 'having consistent unchanging timbre',
    examples: ['static drone', 'stable tone', 'constant timbre']
  },
  {
    id: 'lex:adj:lo_fi',
    surface: ['lo-fi', 'low fidelity', 'degraded', 'bitcrushed'],
    category: 'adj',
    semanticTags: ['timbre', 'character', 'degraded', 'vintage'],
    meaning: 'having intentionally degraded quality',
    examples: ['lo-fi texture', 'bitcrushed sound', 'degraded quality']
  },
  {
    id: 'lex:adj:hi_fi',
    surface: ['hi-fi', 'high fidelity', 'pristine', 'clean'],
    category: 'adj',
    semanticTags: ['timbre', 'character', 'clean', 'quality'],
    meaning: 'having high quality clean reproduction',
    examples: ['hi-fi sound', 'pristine quality', 'clean reproduction']
  },
  {
    id: 'lex:adj:aliased',
    surface: ['aliased', 'aliasing', 'steppy', 'digital artifacts'],
    category: 'adj',
    semanticTags: ['timbre', 'character', 'artifacts', 'digital'],
    meaning: 'having digital aliasing artifacts',
    examples: ['aliased distortion', 'digital stepping', 'harsh artifacts']
  }
];

// ============================================================================
// Export combined vocabulary
// ============================================================================

export const SYNTHESIS_SOUND_DESIGN_LEXEMES: readonly Lexeme[] = [
  ...SYNTHESIS_TYPES_LEXEMES,
  ...OSCILLATOR_LEXEMES,
  ...FILTER_LEXEMES,
  ...ENVELOPE_LEXEMES,
  ...MODULATION_LEXEMES,
  ...SOUND_DESIGN_LEXEMES,
  ...TIMBRE_DESCRIPTORS_LEXEME,
];

// Batch metadata
export const BATCH_74_METADATA = {
  batchNumber: 74,
  name: 'Synthesis, Sound Design, and Modulation',
  categories: [
    'synthesis',
    'sound_design',
    'modulation',
    'filters',
    'oscillators',
    'envelopes',
    'timbre'
  ],
  lexemeCount: SYNTHESIS_SOUND_DESIGN_LEXEMES.length,
  description: 'Comprehensive vocabulary for synthesis methods, oscillators, filters, envelopes, modulation, and sound design techniques'
} as const;
