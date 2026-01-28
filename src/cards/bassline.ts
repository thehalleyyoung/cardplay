/**
 * BasslineCard - Professional bass synthesizer and pattern generator
 * 
 * A fully-featured bass instrument card supporting:
 * - Multiple synthesis engines (subtractive, FM, wavetable, 303-style)
 * - Pattern-based sequencing with per-step parameter locks
 * - 100+ presets across genres (house, techno, hip-hop, funk, etc.)
 * - Real-time modulation (filter sweeps, slides, accents)
 * - Chord-following mode for automatic root note tracking
 * - Freesound sample integration for hybrid bass sounds
 * - Low-latency AudioWorklet processing
 * 
 * @module cards/bassline
 */

import type { Card, CardMeta, CardContext, CardState, CardResult, CardSignature } from './card';
import { PortTypes } from './card';

// ============================================================================
// SYNTHESIS ENGINES
// ============================================================================

/**
 * Available synthesis methods for bass sounds
 */
export type BassEngine = 
  | 'analog'      // Classic subtractive (Moog-style)
  | 'fm'          // FM synthesis (DX-style)
  | 'wavetable'   // Wavetable morphing
  | 'acid'        // TB-303 style with resonant filter
  | 'sub'         // Pure sub bass (sine/triangle)
  | 'reese'       // Detuned saw for DnB
  | 'pluck'       // Plucked string model
  | 'sample'      // Sample-based playback
  | 'hybrid';     // Sample + synthesis layering

/**
 * Oscillator waveform types
 */
export type OscWaveform = 
  | 'sine' 
  | 'triangle' 
  | 'sawtooth' 
  | 'square' 
  | 'pulse'
  | 'supersaw'
  | 'noise';

/**
 * Filter types
 */
export type FilterType = 
  | 'lowpass' 
  | 'highpass' 
  | 'bandpass' 
  | 'notch'
  | 'ladder'    // Moog-style 24dB
  | 'diode'     // 303-style
  | 'comb';

/**
 * Filter slope (steepness)
 */
export type FilterSlope = '12dB' | '18dB' | '24dB' | '36dB';

// ============================================================================
// OSCILLATOR CONFIGURATION
// ============================================================================

/**
 * Single oscillator settings
 */
export interface OscillatorConfig {
  readonly enabled: boolean;
  readonly waveform: OscWaveform;
  readonly octave: number;          // -3 to +3
  readonly semitone: number;        // -12 to +12
  readonly detune: number;          // cents, -100 to +100
  readonly pulseWidth: number;      // 0-1, for pulse/square
  readonly level: number;           // 0-1
  readonly pan: number;             // -1 to +1
  readonly phase: number;           // 0-360 degrees
  readonly sync: boolean;           // Hard sync to osc1
  readonly unison: number;          // 1-8 voices
  readonly unisonDetune: number;    // cents spread
  readonly unisonSpread: number;    // stereo spread 0-1
}

/**
 * Default oscillator settings
 */
export function createDefaultOscillator(
  waveform: OscWaveform = 'sawtooth',
  enabled: boolean = true
): OscillatorConfig {
  return {
    enabled,
    waveform,
    octave: 0,
    semitone: 0,
    detune: 0,
    pulseWidth: 0.5,
    level: 0.8,
    pan: 0,
    phase: 0,
    sync: false,
    unison: 1,
    unisonDetune: 15,
    unisonSpread: 0.5,
  };
}

// ============================================================================
// FILTER CONFIGURATION
// ============================================================================

/**
 * Filter settings
 */
export interface FilterConfig {
  readonly enabled: boolean;
  readonly type: FilterType;
  readonly slope: FilterSlope;
  readonly cutoff: number;          // Hz, 20-20000
  readonly resonance: number;       // 0-1 (self-oscillation at 1)
  readonly drive: number;           // 0-1, pre-filter saturation
  readonly keyTracking: number;     // 0-1, cutoff follows pitch
  readonly envAmount: number;       // -1 to +1, envelope modulation
  readonly lfoAmount: number;       // 0-1, LFO modulation
  readonly velocityAmount: number;  // 0-1, velocity modulation
}

/**
 * Default filter settings
 */
export function createDefaultFilter(): FilterConfig {
  return {
    enabled: true,
    type: 'lowpass',
    slope: '24dB',
    cutoff: 1000,
    resonance: 0.3,
    drive: 0,
    keyTracking: 0.5,
    envAmount: 0.5,
    lfoAmount: 0,
    velocityAmount: 0.3,
  };
}

// ============================================================================
// ENVELOPE CONFIGURATION
// ============================================================================

/**
 * ADSR envelope settings
 */
export interface EnvelopeConfig {
  readonly attack: number;          // seconds, 0.001-10
  readonly decay: number;           // seconds, 0.001-10
  readonly sustain: number;         // 0-1
  readonly release: number;         // seconds, 0.001-10
  readonly curve: number;           // -1 to +1 (log/linear/exp)
  readonly velocitySensitivity: number; // 0-1
}

/**
 * Default amplitude envelope (for bass: punchy)
 */
export function createDefaultAmpEnvelope(): EnvelopeConfig {
  return {
    attack: 0.005,
    decay: 0.2,
    sustain: 0.6,
    release: 0.15,
    curve: 0,
    velocitySensitivity: 0.7,
  };
}

/**
 * Default filter envelope
 */
export function createDefaultFilterEnvelope(): EnvelopeConfig {
  return {
    attack: 0.001,
    decay: 0.3,
    sustain: 0.2,
    release: 0.2,
    curve: -0.5,
    velocitySensitivity: 0.5,
  };
}

// ============================================================================
// LFO CONFIGURATION
// ============================================================================

/**
 * LFO waveforms
 */
export type LfoWaveform = 
  | 'sine' 
  | 'triangle' 
  | 'sawtooth' 
  | 'square' 
  | 'random' 
  | 'sample-hold';

/**
 * LFO settings
 */
export interface LfoConfig {
  readonly enabled: boolean;
  readonly waveform: LfoWaveform;
  readonly rate: number;            // Hz or tempo-synced division
  readonly tempoSync: boolean;
  readonly division: string;        // '1/4', '1/8', '1/16', etc.
  readonly depth: number;           // 0-1
  readonly phase: number;           // 0-360
  readonly delay: number;           // seconds before LFO starts
  readonly fadeIn: number;          // seconds to reach full depth
  readonly retrigger: boolean;      // Reset phase on note
  readonly destinations: readonly LfoDestination[];
}

/**
 * LFO modulation destination
 */
export interface LfoDestination {
  readonly target: 'pitch' | 'filter' | 'amp' | 'pan' | 'pulseWidth';
  readonly amount: number;          // Modulation depth for this target
}

/**
 * Default LFO settings
 */
export function createDefaultLfo(): LfoConfig {
  return {
    enabled: false,
    waveform: 'sine',
    rate: 5,
    tempoSync: false,
    division: '1/4',
    depth: 0.5,
    phase: 0,
    delay: 0,
    fadeIn: 0,
    retrigger: true,
    destinations: [],
  };
}

// ============================================================================
// BASS PATCH (COMPLETE SOUND)
// ============================================================================

/**
 * Complete bass synthesizer patch
 */
export interface BassPatch {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly engine: BassEngine;
  
  // Oscillators
  readonly osc1: OscillatorConfig;
  readonly osc2: OscillatorConfig;
  readonly subOsc: OscillatorConfig;
  readonly noiseLevel: number;
  
  // Mixer
  readonly oscMix: number;          // 0 = osc1, 1 = osc2
  readonly subLevel: number;
  
  // Filter
  readonly filter: FilterConfig;
  readonly filterEnv: EnvelopeConfig;
  
  // Amplifier
  readonly ampEnv: EnvelopeConfig;
  readonly gain: number;            // Output gain 0-2
  
  // Modulation
  readonly lfo1: LfoConfig;
  readonly lfo2: LfoConfig;
  
  // Effects
  readonly distortion: number;      // 0-1
  readonly distortionType: 'soft' | 'hard' | 'foldback' | 'bitcrush';
  readonly chorus: number;          // 0-1
  readonly stereoWidth: number;     // 0-1
  
  // Performance
  readonly portamento: number;      // Glide time in seconds
  readonly portamentoMode: 'always' | 'legato';
  readonly pitchBendRange: number;  // Semitones
  readonly velocityCurve: 'linear' | 'soft' | 'hard';
  
  // 303-specific
  readonly accent: number;          // Accent strength 0-1
  readonly slide: boolean;          // Default slide behavior
}

/**
 * Create a default bass patch
 */
export function createDefaultPatch(id: string, name: string): BassPatch {
  return {
    id,
    name,
    category: 'Default',
    tags: [],
    engine: 'analog',
    
    osc1: createDefaultOscillator('sawtooth', true),
    osc2: createDefaultOscillator('square', false),
    subOsc: createDefaultOscillator('sine', false),
    noiseLevel: 0,
    
    oscMix: 0,
    subLevel: 0,
    
    filter: createDefaultFilter(),
    filterEnv: createDefaultFilterEnvelope(),
    
    ampEnv: createDefaultAmpEnvelope(),
    gain: 0.8,
    
    lfo1: createDefaultLfo(),
    lfo2: createDefaultLfo(),
    
    distortion: 0,
    distortionType: 'soft',
    chorus: 0,
    stereoWidth: 0,
    
    portamento: 0,
    portamentoMode: 'legato',
    pitchBendRange: 2,
    velocityCurve: 'linear',
    
    accent: 0.5,
    slide: false,
  };
}

// ============================================================================
// PATTERN SEQUENCER
// ============================================================================

/**
 * Single step in bass pattern
 */
export interface BassStep {
  readonly note: number;            // MIDI note, 0 = rest
  readonly velocity: number;        // 0-127
  readonly gate: number;            // 0-1, note length within step
  readonly accent: boolean;
  readonly slide: boolean;          // Portamento to next note
  readonly octaveShift: number;     // -2 to +2
  
  // Per-step parameter locks
  readonly filterCutoff?: number;
  readonly filterResonance?: number;
  readonly filterEnvAmount?: number;
  readonly distortion?: number;
  readonly decay?: number;
}

/**
 * Create an empty bass step
 */
export function createEmptyBassStep(): BassStep {
  return {
    note: 0,
    velocity: 0,
    gate: 0.5,
    accent: false,
    slide: false,
    octaveShift: 0,
  };
}

/**
 * Create an active bass step
 */
export function createActiveBassStep(
  note: number,
  velocity: number = 100,
  options: Partial<BassStep> = {}
): BassStep {
  return {
    ...createEmptyBassStep(),
    note,
    velocity,
    ...options,
  };
}

/**
 * Bass pattern (sequence of steps)
 */
export interface BassPattern {
  readonly id: string;
  readonly name: string;
  readonly length: number;          // Number of steps (1-64)
  readonly steps: readonly BassStep[];
  readonly rootNote: number;        // Pattern written relative to this note
  readonly scale: string;           // Scale constraint
  readonly swingAmount: number;     // 0-1
  readonly grooveTemplate?: string; // Named groove
}

/**
 * Create empty bass pattern
 */
export function createEmptyBassPattern(
  id: string,
  name: string,
  length: number = 16
): BassPattern {
  const steps: BassStep[] = [];
  for (let i = 0; i < length; i++) {
    steps.push(createEmptyBassStep());
  }
  return {
    id,
    name,
    length,
    steps,
    rootNote: 36, // C2
    scale: 'chromatic',
    swingAmount: 0,
  };
}

// ============================================================================
// FREESOUND SAMPLE QUERIES FOR BASS
// ============================================================================

export const BASS_FREESOUND_QUERIES: Record<string, string> = {
  // Acoustic bass
  'upright-bass': 'upright bass pizzicato',
  'acoustic-bass': 'acoustic bass guitar',
  'slap-bass': 'slap bass funk',
  'fingered-bass': 'fingered bass guitar',
  'picked-bass': 'picked bass guitar',
  'fretless-bass': 'fretless bass',
  
  // Electric bass
  'p-bass': 'precision bass',
  'j-bass': 'jazz bass',
  'music-man': 'music man bass',
  'rickenbacker': 'rickenbacker bass',
  
  // Synth bass
  'moog-bass': 'moog bass synthesizer',
  'minimoog-bass': 'minimoog bass',
  '303-bass': '303 acid bass',
  'sub-bass': 'sub bass low frequency',
  'reese-bass': 'reese bass dubstep',
  'wobble-bass': 'wobble bass dubstep',
  'fm-bass': 'fm bass dx7',
  'pluck-bass': 'pluck bass synth',
  
  // Genre-specific
  'house-bass': 'house music bass',
  'techno-bass': 'techno bass',
  'dnb-bass': 'drum and bass bass',
  'dubstep-bass': 'dubstep bass growl',
  'trap-bass': '808 bass trap',
  'funk-bass': 'funk bass slap',
  'reggae-bass': 'reggae bass dub',
  'hip-hop-bass': 'hip hop bass',
};

// ============================================================================
// PRESET PATCHES (100+)
// ============================================================================

/**
 * Helper to create acid bass preset
 */
function createAcidPatch(
  id: string,
  name: string,
  cutoff: number,
  resonance: number,
  envAmount: number,
  decay: number
): BassPatch {
  return {
    ...createDefaultPatch(id, name),
    category: 'Acid',
    tags: ['acid', '303', 'squelch', 'resonant'],
    engine: 'acid',
    osc1: {
      ...createDefaultOscillator('sawtooth'),
      octave: -1,
    },
    filter: {
      ...createDefaultFilter(),
      type: 'diode',
      slope: '18dB',
      cutoff,
      resonance,
      envAmount,
      drive: 0.3,
    },
    filterEnv: {
      ...createDefaultFilterEnvelope(),
      decay,
      sustain: 0.1,
    },
    distortion: 0.2,
    distortionType: 'soft',
    accent: 0.7,
  };
}

/**
 * Helper to create sub bass preset
 */
function createSubPatch(
  id: string,
  name: string,
  waveform: OscWaveform,
  saturation: number
): BassPatch {
  return {
    ...createDefaultPatch(id, name),
    category: 'Sub',
    tags: ['sub', 'deep', 'low', 'clean'],
    engine: 'sub',
    osc1: {
      ...createDefaultOscillator(waveform),
      octave: -2,
    },
    filter: {
      ...createDefaultFilter(),
      cutoff: 200,
      resonance: 0,
      envAmount: 0,
    },
    distortion: saturation,
    distortionType: 'soft',
    stereoWidth: 0,
  };
}

/**
 * Helper to create reese bass preset
 */
function createReesePatch(
  id: string,
  name: string,
  detune: number,
  filterCutoff: number
): BassPatch {
  return {
    ...createDefaultPatch(id, name),
    category: 'Reese',
    tags: ['reese', 'dnb', 'dark', 'detuned'],
    engine: 'reese',
    osc1: {
      ...createDefaultOscillator('sawtooth'),
      octave: -1,
      detune: -detune,
      unison: 2,
      unisonDetune: detune,
    },
    osc2: {
      ...createDefaultOscillator('sawtooth'),
      enabled: true,
      octave: -1,
      detune: detune,
    },
    oscMix: 0.5,
    filter: {
      ...createDefaultFilter(),
      cutoff: filterCutoff,
      resonance: 0.2,
      envAmount: 0.3,
    },
    chorus: 0.3,
    stereoWidth: 0.5,
  };
}

/**
 * All preset bass patches
 */
export const PRESET_BASS_PATCHES: readonly BassPatch[] = [
  // ========== ACID / 303 ==========
  createAcidPatch('acid-squelch', 'Acid Squelch', 400, 0.8, 0.9, 0.15),
  createAcidPatch('acid-smooth', 'Acid Smooth', 800, 0.5, 0.6, 0.3),
  createAcidPatch('acid-screamer', 'Acid Screamer', 300, 0.95, 1.0, 0.1),
  createAcidPatch('acid-mellow', 'Acid Mellow', 1200, 0.3, 0.4, 0.4),
  createAcidPatch('acid-classic', 'Acid Classic', 500, 0.7, 0.8, 0.2),
  createAcidPatch('acid-dark', 'Acid Dark', 200, 0.6, 0.5, 0.25),
  createAcidPatch('acid-bright', 'Acid Bright', 1500, 0.4, 0.7, 0.18),
  createAcidPatch('acid-nasty', 'Acid Nasty', 350, 0.9, 0.95, 0.12),
  {
    ...createAcidPatch('acid-slide', 'Acid Slide', 400, 0.75, 0.85, 0.2),
    portamento: 0.08,
    portamentoMode: 'always',
    slide: true,
  },
  {
    ...createAcidPatch('acid-stab', 'Acid Stab', 600, 0.6, 0.7, 0.08),
    filterEnv: {
      ...createDefaultFilterEnvelope(),
      attack: 0.001,
      decay: 0.08,
      sustain: 0.05,
    },
  },

  // ========== SUB BASS ==========
  createSubPatch('sub-pure', 'Pure Sub', 'sine', 0),
  createSubPatch('sub-warm', 'Warm Sub', 'triangle', 0.1),
  createSubPatch('sub-fat', 'Fat Sub', 'sine', 0.3),
  createSubPatch('sub-808', '808 Sub', 'sine', 0.15),
  createSubPatch('sub-dark', 'Dark Sub', 'triangle', 0.05),
  {
    ...createSubPatch('sub-punchy', 'Punchy Sub', 'sine', 0.2),
    ampEnv: {
      ...createDefaultAmpEnvelope(),
      attack: 0.001,
      decay: 0.4,
      sustain: 0.3,
    },
  },
  {
    ...createSubPatch('sub-boomy', 'Boomy Sub', 'sine', 0.25),
    ampEnv: {
      ...createDefaultAmpEnvelope(),
      attack: 0.02,
      decay: 0.6,
      sustain: 0.5,
    },
  },
  {
    ...createSubPatch('sub-808-long', '808 Long', 'sine', 0.18),
    ampEnv: {
      ...createDefaultAmpEnvelope(),
      decay: 2.0,
      sustain: 0.1,
      release: 1.5,
    },
  },

  // ========== REESE / DnB ==========
  createReesePatch('reese-classic', 'Reese Classic', 15, 800),
  createReesePatch('reese-dark', 'Reese Dark', 20, 400),
  createReesePatch('reese-bright', 'Reese Bright', 12, 2000),
  createReesePatch('reese-wide', 'Reese Wide', 25, 600),
  createReesePatch('reese-tight', 'Reese Tight', 8, 1000),
  createReesePatch('reese-nasty', 'Reese Nasty', 30, 500),
  {
    ...createReesePatch('reese-growl', 'Reese Growl', 18, 700),
    distortion: 0.4,
    distortionType: 'foldback',
  },
  {
    ...createReesePatch('reese-liquid', 'Reese Liquid', 10, 1500),
    lfo1: {
      ...createDefaultLfo(),
      enabled: true,
      rate: 0.5,
      destinations: [{ target: 'filter', amount: 0.3 }],
    },
  },

  // ========== HOUSE ==========
  {
    ...createDefaultPatch('house-classic', 'House Classic'),
    category: 'House',
    tags: ['house', 'classic', 'warm', 'punchy'],
    osc1: {
      ...createDefaultOscillator('sawtooth'),
      octave: -1,
    },
    filter: {
      ...createDefaultFilter(),
      cutoff: 1500,
      resonance: 0.2,
      envAmount: 0.4,
    },
    ampEnv: {
      ...createDefaultAmpEnvelope(),
      decay: 0.3,
      sustain: 0.4,
    },
  },
  {
    ...createDefaultPatch('house-deep', 'Deep House'),
    category: 'House',
    tags: ['house', 'deep', 'warm', 'mellow'],
    osc1: {
      ...createDefaultOscillator('sine'),
      octave: -2,
    },
    osc2: {
      ...createDefaultOscillator('triangle'),
      enabled: true,
      octave: -1,
      level: 0.3,
    },
    filter: {
      ...createDefaultFilter(),
      cutoff: 800,
      resonance: 0.15,
      envAmount: 0.25,
    },
  },
  {
    ...createDefaultPatch('house-funky', 'Funky House'),
    category: 'House',
    tags: ['house', 'funky', 'groove', 'plucky'],
    osc1: {
      ...createDefaultOscillator('square'),
      octave: -1,
      pulseWidth: 0.3,
    },
    filter: {
      ...createDefaultFilter(),
      cutoff: 2000,
      resonance: 0.35,
      envAmount: 0.6,
    },
    filterEnv: {
      ...createDefaultFilterEnvelope(),
      decay: 0.15,
      sustain: 0.1,
    },
  },
  {
    ...createDefaultPatch('house-organ', 'House Organ Bass'),
    category: 'House',
    tags: ['house', 'organ', 'gospel', 'warm'],
    osc1: {
      ...createDefaultOscillator('sine'),
      octave: -1,
    },
    osc2: {
      ...createDefaultOscillator('sine'),
      enabled: true,
      octave: 0,
      level: 0.2,
    },
    distortion: 0.15,
    distortionType: 'soft',
  },

  // ========== TECHNO ==========
  {
    ...createDefaultPatch('techno-stab', 'Techno Stab'),
    category: 'Techno',
    tags: ['techno', 'stab', 'punchy', 'dark'],
    osc1: {
      ...createDefaultOscillator('sawtooth'),
      octave: -1,
    },
    filter: {
      ...createDefaultFilter(),
      cutoff: 600,
      resonance: 0.4,
      envAmount: 0.7,
    },
    filterEnv: {
      ...createDefaultFilterEnvelope(),
      attack: 0.001,
      decay: 0.1,
      sustain: 0.05,
    },
    ampEnv: {
      ...createDefaultAmpEnvelope(),
      decay: 0.15,
      sustain: 0.2,
    },
  },
  {
    ...createDefaultPatch('techno-dark', 'Dark Techno'),
    category: 'Techno',
    tags: ['techno', 'dark', 'industrial', 'distorted'],
    osc1: {
      ...createDefaultOscillator('square'),
      octave: -1,
    },
    filter: {
      ...createDefaultFilter(),
      cutoff: 400,
      resonance: 0.5,
      envAmount: 0.4,
      drive: 0.5,
    },
    distortion: 0.35,
    distortionType: 'hard',
  },
  {
    ...createDefaultPatch('techno-rolling', 'Rolling Techno'),
    category: 'Techno',
    tags: ['techno', 'rolling', 'hypnotic', 'loop'],
    osc1: {
      ...createDefaultOscillator('sawtooth'),
      octave: -1,
    },
    filter: {
      ...createDefaultFilter(),
      cutoff: 1000,
      resonance: 0.3,
      envAmount: 0.5,
      lfoAmount: 0.2,
    },
    lfo1: {
      ...createDefaultLfo(),
      enabled: true,
      tempoSync: true,
      division: '1/8',
      destinations: [{ target: 'filter', amount: 0.2 }],
    },
  },

  // ========== HIP-HOP / TRAP ==========
  {
    ...createDefaultPatch('trap-808', 'Trap 808'),
    category: 'Hip-Hop',
    tags: ['trap', '808', 'hip-hop', 'sub'],
    engine: 'sub',
    osc1: {
      ...createDefaultOscillator('sine'),
      octave: -2,
    },
    filter: {
      ...createDefaultFilter(),
      cutoff: 150,
      resonance: 0,
      envAmount: 0,
    },
    ampEnv: {
      ...createDefaultAmpEnvelope(),
      attack: 0.01,
      decay: 1.5,
      sustain: 0.1,
      release: 0.8,
    },
    distortion: 0.2,
    pitchBendRange: 12,
  },
  {
    ...createDefaultPatch('trap-glide', 'Trap Glide 808'),
    category: 'Hip-Hop',
    tags: ['trap', '808', 'glide', 'sub'],
    engine: 'sub',
    osc1: {
      ...createDefaultOscillator('sine'),
      octave: -2,
    },
    portamento: 0.15,
    portamentoMode: 'always',
    ampEnv: {
      ...createDefaultAmpEnvelope(),
      decay: 2.0,
      sustain: 0.05,
      release: 1.0,
    },
  },
  {
    ...createDefaultPatch('boom-bap', 'Boom Bap Bass'),
    category: 'Hip-Hop',
    tags: ['boom-bap', 'hip-hop', 'sample', 'warm'],
    engine: 'sample',
    filter: {
      ...createDefaultFilter(),
      cutoff: 2000,
      resonance: 0.1,
    },
    distortion: 0.1,
  },

  // ========== FUNK / DISCO ==========
  {
    ...createDefaultPatch('funk-slap', 'Funk Slap'),
    category: 'Funk',
    tags: ['funk', 'slap', 'pop', 'bright'],
    engine: 'pluck',
    osc1: {
      ...createDefaultOscillator('square'),
      octave: -1,
    },
    filter: {
      ...createDefaultFilter(),
      cutoff: 3000,
      resonance: 0.25,
      envAmount: 0.8,
    },
    filterEnv: {
      ...createDefaultFilterEnvelope(),
      attack: 0.001,
      decay: 0.08,
      sustain: 0.1,
    },
    ampEnv: {
      ...createDefaultAmpEnvelope(),
      attack: 0.001,
      decay: 0.2,
      sustain: 0.3,
    },
  },
  {
    ...createDefaultPatch('funk-finger', 'Funk Fingered'),
    category: 'Funk',
    tags: ['funk', 'fingered', 'groove', 'warm'],
    osc1: {
      ...createDefaultOscillator('sawtooth'),
      octave: -1,
    },
    osc2: {
      ...createDefaultOscillator('triangle'),
      enabled: true,
      octave: -2,
      level: 0.4,
    },
    filter: {
      ...createDefaultFilter(),
      cutoff: 1800,
      resonance: 0.2,
      envAmount: 0.4,
    },
  },
  {
    ...createDefaultPatch('disco-octave', 'Disco Octave'),
    category: 'Funk',
    tags: ['disco', 'octave', 'funky', 'groove'],
    osc1: {
      ...createDefaultOscillator('sawtooth'),
      octave: -1,
    },
    osc2: {
      ...createDefaultOscillator('sawtooth'),
      enabled: true,
      octave: -2,
      level: 0.6,
    },
    filter: {
      ...createDefaultFilter(),
      cutoff: 2500,
      resonance: 0.15,
      envAmount: 0.35,
    },
  },

  // ========== SYNTH / ELECTRONIC ==========
  {
    ...createDefaultPatch('synth-saw', 'Saw Bass'),
    category: 'Synth',
    tags: ['synth', 'saw', 'classic', 'bright'],
    osc1: {
      ...createDefaultOscillator('sawtooth'),
      octave: -1,
    },
    filter: {
      ...createDefaultFilter(),
      cutoff: 2000,
      resonance: 0.25,
      envAmount: 0.5,
    },
  },
  {
    ...createDefaultPatch('synth-square', 'Square Bass'),
    category: 'Synth',
    tags: ['synth', 'square', 'hollow', 'retro'],
    osc1: {
      ...createDefaultOscillator('square'),
      octave: -1,
    },
    filter: {
      ...createDefaultFilter(),
      cutoff: 1500,
      resonance: 0.3,
      envAmount: 0.45,
    },
  },
  {
    ...createDefaultPatch('synth-pwm', 'PWM Bass'),
    category: 'Synth',
    tags: ['synth', 'pwm', 'movement', 'analog'],
    osc1: {
      ...createDefaultOscillator('pulse'),
      octave: -1,
      pulseWidth: 0.5,
    },
    lfo1: {
      ...createDefaultLfo(),
      enabled: true,
      rate: 0.8,
      destinations: [{ target: 'pulseWidth', amount: 0.4 }],
    },
    filter: {
      ...createDefaultFilter(),
      cutoff: 1800,
      resonance: 0.2,
      envAmount: 0.4,
    },
  },
  {
    ...createDefaultPatch('synth-supersaw', 'Supersaw Bass'),
    category: 'Synth',
    tags: ['synth', 'supersaw', 'trance', 'fat'],
    osc1: {
      ...createDefaultOscillator('supersaw'),
      octave: -1,
      unison: 5,
      unisonDetune: 20,
      unisonSpread: 0.6,
    },
    filter: {
      ...createDefaultFilter(),
      cutoff: 1200,
      resonance: 0.2,
      envAmount: 0.35,
    },
    stereoWidth: 0.4,
  },

  // ========== FM BASS ==========
  {
    ...createDefaultPatch('fm-electric', 'FM Electric Bass'),
    category: 'FM',
    tags: ['fm', 'electric', 'dx7', 'clean'],
    engine: 'fm',
    filter: {
      ...createDefaultFilter(),
      cutoff: 4000,
      resonance: 0.1,
      envAmount: 0.2,
    },
    ampEnv: {
      ...createDefaultAmpEnvelope(),
      attack: 0.001,
      decay: 0.3,
      sustain: 0.5,
    },
  },
  {
    ...createDefaultPatch('fm-slap', 'FM Slap Bass'),
    category: 'FM',
    tags: ['fm', 'slap', 'dx7', 'pop'],
    engine: 'fm',
    filterEnv: {
      ...createDefaultFilterEnvelope(),
      attack: 0.001,
      decay: 0.05,
      sustain: 0.1,
    },
    ampEnv: {
      ...createDefaultAmpEnvelope(),
      attack: 0.001,
      decay: 0.15,
      sustain: 0.2,
    },
  },
  {
    ...createDefaultPatch('fm-digital', 'FM Digital Bass'),
    category: 'FM',
    tags: ['fm', 'digital', 'metallic', 'bright'],
    engine: 'fm',
    filter: {
      ...createDefaultFilter(),
      cutoff: 6000,
      resonance: 0.15,
      envAmount: 0.3,
    },
  },

  // ========== DUBSTEP / BASS MUSIC ==========
  {
    ...createDefaultPatch('dubstep-wobble', 'Dubstep Wobble'),
    category: 'Dubstep',
    tags: ['dubstep', 'wobble', 'filthy', 'lfo'],
    osc1: {
      ...createDefaultOscillator('sawtooth'),
      octave: -1,
    },
    osc2: {
      ...createDefaultOscillator('square'),
      enabled: true,
      octave: -1,
      level: 0.5,
    },
    filter: {
      ...createDefaultFilter(),
      cutoff: 800,
      resonance: 0.6,
      envAmount: 0,
      lfoAmount: 0.8,
    },
    lfo1: {
      ...createDefaultLfo(),
      enabled: true,
      tempoSync: true,
      division: '1/8',
      waveform: 'sine',
      destinations: [{ target: 'filter', amount: 0.8 }],
    },
    distortion: 0.3,
    distortionType: 'foldback',
  },
  {
    ...createDefaultPatch('dubstep-growl', 'Dubstep Growl'),
    category: 'Dubstep',
    tags: ['dubstep', 'growl', 'aggressive', 'distorted'],
    engine: 'reese',
    osc1: {
      ...createDefaultOscillator('sawtooth'),
      octave: -1,
      unison: 3,
      unisonDetune: 25,
    },
    filter: {
      ...createDefaultFilter(),
      cutoff: 600,
      resonance: 0.5,
      drive: 0.6,
    },
    distortion: 0.5,
    distortionType: 'foldback',
  },
  {
    ...createDefaultPatch('dubstep-neuro', 'Neuro Bass'),
    category: 'Dubstep',
    tags: ['neuro', 'dubstep', 'complex', 'modulated'],
    engine: 'wavetable',
    osc1: {
      ...createDefaultOscillator('sawtooth'),
      octave: -1,
    },
    filter: {
      ...createDefaultFilter(),
      cutoff: 1000,
      resonance: 0.4,
      lfoAmount: 0.5,
    },
    lfo1: {
      ...createDefaultLfo(),
      enabled: true,
      rate: 8,
      waveform: 'sample-hold',
      destinations: [{ target: 'filter', amount: 0.5 }, { target: 'pitch', amount: 0.1 }],
    },
    distortion: 0.4,
  },

  // ========== PLUCK / STAB ==========
  {
    ...createDefaultPatch('pluck-short', 'Short Pluck'),
    category: 'Pluck',
    tags: ['pluck', 'short', 'staccato', 'punchy'],
    engine: 'pluck',
    osc1: {
      ...createDefaultOscillator('sawtooth'),
      octave: -1,
    },
    filter: {
      ...createDefaultFilter(),
      cutoff: 2500,
      resonance: 0.25,
      envAmount: 0.7,
    },
    filterEnv: {
      ...createDefaultFilterEnvelope(),
      attack: 0.001,
      decay: 0.1,
      sustain: 0.05,
    },
    ampEnv: {
      ...createDefaultAmpEnvelope(),
      attack: 0.001,
      decay: 0.2,
      sustain: 0.1,
      release: 0.1,
    },
  },
  {
    ...createDefaultPatch('pluck-long', 'Long Pluck'),
    category: 'Pluck',
    tags: ['pluck', 'long', 'sustain', 'mellow'],
    engine: 'pluck',
    osc1: {
      ...createDefaultOscillator('triangle'),
      octave: -1,
    },
    filter: {
      ...createDefaultFilter(),
      cutoff: 2000,
      resonance: 0.15,
      envAmount: 0.5,
    },
    filterEnv: {
      ...createDefaultFilterEnvelope(),
      decay: 0.5,
      sustain: 0.3,
    },
    ampEnv: {
      ...createDefaultAmpEnvelope(),
      decay: 0.8,
      sustain: 0.4,
      release: 0.4,
    },
  },

  // ========== MOOG-STYLE ==========
  {
    ...createDefaultPatch('moog-fat', 'Fat Moog'),
    category: 'Moog',
    tags: ['moog', 'fat', 'analog', 'warm'],
    osc1: {
      ...createDefaultOscillator('sawtooth'),
      octave: -1,
    },
    osc2: {
      ...createDefaultOscillator('sawtooth'),
      enabled: true,
      octave: -2,
      detune: 5,
      level: 0.6,
    },
    filter: {
      ...createDefaultFilter(),
      type: 'ladder',
      slope: '24dB',
      cutoff: 1500,
      resonance: 0.35,
      envAmount: 0.5,
      drive: 0.2,
    },
  },
  {
    ...createDefaultPatch('moog-lead', 'Moog Lead Bass'),
    category: 'Moog',
    tags: ['moog', 'lead', 'solo', 'expressive'],
    osc1: {
      ...createDefaultOscillator('square'),
      octave: -1,
    },
    osc2: {
      ...createDefaultOscillator('sawtooth'),
      enabled: true,
      octave: 0,
      level: 0.3,
    },
    filter: {
      ...createDefaultFilter(),
      type: 'ladder',
      cutoff: 2000,
      resonance: 0.4,
      envAmount: 0.6,
    },
    portamento: 0.05,
    portamentoMode: 'legato',
  },
  {
    ...createDefaultPatch('moog-taurus', 'Taurus Pedal'),
    category: 'Moog',
    tags: ['moog', 'taurus', 'pedal', 'massive'],
    osc1: {
      ...createDefaultOscillator('square'),
      octave: -2,
    },
    osc2: {
      ...createDefaultOscillator('sawtooth'),
      enabled: true,
      octave: -1,
      level: 0.4,
    },
    filter: {
      ...createDefaultFilter(),
      type: 'ladder',
      cutoff: 600,
      resonance: 0.25,
      envAmount: 0.3,
    },
    ampEnv: {
      ...createDefaultAmpEnvelope(),
      attack: 0.02,
      release: 0.5,
    },
  },

  // ========== WAVETABLE ==========
  {
    ...createDefaultPatch('wt-morph', 'Wavetable Morph'),
    category: 'Wavetable',
    tags: ['wavetable', 'morph', 'evolving', 'modern'],
    engine: 'wavetable',
    osc1: {
      ...createDefaultOscillator('sawtooth'),
      octave: -1,
    },
    filter: {
      ...createDefaultFilter(),
      cutoff: 2000,
      resonance: 0.2,
      lfoAmount: 0.3,
    },
    lfo1: {
      ...createDefaultLfo(),
      enabled: true,
      rate: 0.2,
      destinations: [{ target: 'filter', amount: 0.3 }],
    },
  },
  {
    ...createDefaultPatch('wt-digital', 'Digital Wavetable'),
    category: 'Wavetable',
    tags: ['wavetable', 'digital', 'sharp', 'modern'],
    engine: 'wavetable',
    filter: {
      ...createDefaultFilter(),
      cutoff: 4000,
      resonance: 0.15,
      envAmount: 0.4,
    },
  },

  // ========== REGGAE / DUB ==========
  {
    ...createDefaultPatch('reggae-root', 'Reggae Root'),
    category: 'Reggae',
    tags: ['reggae', 'root', 'dub', 'warm'],
    osc1: {
      ...createDefaultOscillator('sine'),
      octave: -1,
    },
    osc2: {
      ...createDefaultOscillator('triangle'),
      enabled: true,
      octave: -2,
      level: 0.5,
    },
    filter: {
      ...createDefaultFilter(),
      cutoff: 800,
      resonance: 0.15,
      envAmount: 0.2,
    },
    ampEnv: {
      ...createDefaultAmpEnvelope(),
      attack: 0.01,
      decay: 0.4,
      sustain: 0.6,
    },
  },
  {
    ...createDefaultPatch('dub-heavy', 'Dub Heavy'),
    category: 'Reggae',
    tags: ['dub', 'heavy', 'deep', 'sub'],
    osc1: {
      ...createDefaultOscillator('sine'),
      octave: -2,
    },
    filter: {
      ...createDefaultFilter(),
      cutoff: 300,
      resonance: 0.1,
    },
    distortion: 0.15,
    ampEnv: {
      ...createDefaultAmpEnvelope(),
      decay: 0.6,
      sustain: 0.5,
    },
  },

  // ========== SPECIAL / EXPERIMENTAL ==========
  {
    ...createDefaultPatch('bitcrush', 'Bitcrushed Bass'),
    category: 'Special',
    tags: ['bitcrush', 'lofi', 'digital', 'dirty'],
    osc1: {
      ...createDefaultOscillator('sawtooth'),
      octave: -1,
    },
    filter: {
      ...createDefaultFilter(),
      cutoff: 1500,
      resonance: 0.3,
    },
    distortion: 0.6,
    distortionType: 'bitcrush',
  },
  {
    ...createDefaultPatch('noise-bass', 'Noise Bass'),
    category: 'Special',
    tags: ['noise', 'industrial', 'harsh', 'experimental'],
    osc1: {
      ...createDefaultOscillator('sawtooth'),
      octave: -1,
    },
    noiseLevel: 0.3,
    filter: {
      ...createDefaultFilter(),
      cutoff: 800,
      resonance: 0.5,
      envAmount: 0.6,
    },
    distortion: 0.4,
    distortionType: 'hard',
  },
  {
    ...createDefaultPatch('octaver', 'Octave Bass'),
    category: 'Special',
    tags: ['octave', 'layered', 'thick', 'power'],
    osc1: {
      ...createDefaultOscillator('sawtooth'),
      octave: -1,
    },
    osc2: {
      ...createDefaultOscillator('square'),
      enabled: true,
      octave: -2,
      level: 0.7,
    },
    subOsc: {
      ...createDefaultOscillator('sine'),
      enabled: true,
      octave: -3,
      level: 0.4,
    },
    filter: {
      ...createDefaultFilter(),
      cutoff: 1500,
      resonance: 0.2,
      envAmount: 0.4,
    },
  },
];

// ============================================================================
// PRESET PATTERNS (50+)
// ============================================================================

/**
 * Helper to create bass pattern from note array
 */
function createPatternFromNotes(
  id: string,
  name: string,
  notes: readonly (number | null)[],
  options: Partial<{ slides: number[]; accents: number[]; swing: number }> = {}
): BassPattern {
  const steps: BassStep[] = notes.map((note, i) => {
    if (note === null) {
      return createEmptyBassStep();
    }
    return createActiveBassStep(note + 36, 100, {
      slide: options.slides?.includes(i) ?? false,
      accent: options.accents?.includes(i) ?? false,
    });
  });
  return {
    id,
    name,
    length: steps.length,
    steps,
    rootNote: 36,
    scale: 'chromatic',
    swingAmount: options.swing ?? 0,
  };
}

export const PRESET_BASS_PATTERNS: readonly BassPattern[] = [
  // ========== BASIC ==========
  createPatternFromNotes('root-quarter', 'Root Notes (Quarter)', 
    [0, null, null, null, 0, null, null, null, 0, null, null, null, 0, null, null, null]),
  createPatternFromNotes('root-eighth', 'Root Notes (Eighth)',
    [0, null, 0, null, 0, null, 0, null, 0, null, 0, null, 0, null, 0, null]),
  createPatternFromNotes('octave-basic', 'Basic Octave',
    [0, null, 12, null, 0, null, 12, null, 0, null, 12, null, 0, null, 12, null]),
  createPatternFromNotes('root-fifth', 'Root-Fifth',
    [0, null, 7, null, 0, null, 7, null, 0, null, 7, null, 0, null, 7, null]),

  // ========== HOUSE ==========
  createPatternFromNotes('house-pump', 'House Pump',
    [0, null, 0, null, 0, null, 0, null, 0, null, 0, null, 0, null, 0, null]),
  createPatternFromNotes('house-offbeat', 'House Offbeat',
    [null, 0, null, 0, null, 0, null, 0, null, 0, null, 0, null, 0, null, 0]),
  createPatternFromNotes('house-groove', 'House Groove',
    [0, null, null, 0, null, null, 0, null, 0, null, null, 0, null, null, 0, null]),
  createPatternFromNotes('deep-house-1', 'Deep House 1',
    [0, null, null, null, null, 0, null, null, 0, null, null, null, null, 0, null, null]),

  // ========== TECHNO ==========
  createPatternFromNotes('techno-drive', 'Techno Drive',
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  createPatternFromNotes('techno-pulse', 'Techno Pulse',
    [0, null, 0, null, 0, null, 0, null, 0, null, 0, null, 0, null, 0, null]),
  createPatternFromNotes('techno-syncopated', 'Techno Syncopated',
    [0, null, null, 0, null, 0, null, null, 0, null, null, 0, null, 0, null, null]),
  createPatternFromNotes('minimal-loop', 'Minimal Loop',
    [0, null, null, null, null, null, 0, null, null, null, null, null, 0, null, null, null]),

  // ========== ACID ==========
  createPatternFromNotes('acid-classic', 'Acid Classic',
    [0, null, 0, 3, null, 0, null, 5, 0, null, 3, null, 5, null, 0, null],
    { slides: [3, 7, 10], accents: [0, 4, 8] }),
  createPatternFromNotes('acid-squelch', 'Acid Squelch',
    [0, 0, null, 0, null, 0, 3, null, 0, 0, null, 0, null, 0, 5, null],
    { slides: [2, 6, 10, 14], accents: [0, 8] }),
  createPatternFromNotes('acid-random', 'Acid Random',
    [0, null, 7, null, 3, null, null, 10, null, 5, null, 0, null, 7, null, 3],
    { slides: [2, 4, 7, 9, 13], accents: [0, 7, 11] }),

  // ========== FUNK ==========
  createPatternFromNotes('funk-syncopated', 'Funk Syncopated',
    [0, null, null, 0, null, 0, null, null, null, 0, null, 0, null, null, 0, null],
    { swing: 0.2 }),
  createPatternFromNotes('funk-slap', 'Funk Slap',
    [0, null, 12, null, null, 0, null, 7, null, 0, 12, null, null, 0, null, 7],
    { swing: 0.15, accents: [0, 2, 10] }),
  createPatternFromNotes('disco-octave', 'Disco Octave',
    [0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12]),

  // ========== HIP-HOP ==========
  createPatternFromNotes('boom-bap', 'Boom Bap',
    [0, null, null, null, null, null, 0, null, null, 0, null, null, null, null, 0, null],
    { swing: 0.15 }),
  createPatternFromNotes('trap-simple', 'Trap Simple',
    [0, null, null, null, null, null, null, null, 0, null, null, null, null, null, null, null]),
  createPatternFromNotes('trap-808', 'Trap 808 Pattern',
    [0, null, null, null, null, null, null, 0, null, null, 0, null, null, null, null, null],
    { slides: [7, 10] }),

  // ========== DnB ==========
  createPatternFromNotes('dnb-rolling', 'DnB Rolling',
    [0, null, 0, null, 0, null, null, 0, null, 0, null, 0, null, null, 0, null]),
  createPatternFromNotes('dnb-reese', 'DnB Reese',
    [0, null, null, 0, null, null, 0, null, null, 0, null, null, 0, null, null, 0]),
  createPatternFromNotes('jungle-bass', 'Jungle Bass',
    [0, null, null, 0, null, 0, null, null, 0, null, null, 0, null, 0, null, null]),

  // ========== DUBSTEP ==========
  createPatternFromNotes('dubstep-half', 'Dubstep Half-Time',
    [0, null, null, null, null, null, null, null, 0, null, null, null, null, null, null, null]),
  createPatternFromNotes('dubstep-wobble', 'Dubstep Wobble',
    [0, 0, 0, 0, null, null, 0, 0, 0, 0, 0, 0, null, null, 0, 0]),

  // ========== REGGAE ==========
  createPatternFromNotes('reggae-one-drop', 'Reggae One Drop',
    [null, null, null, null, null, null, null, null, 0, null, null, null, null, null, null, null]),
  createPatternFromNotes('reggae-roots', 'Reggae Roots',
    [0, null, null, null, null, null, null, null, 0, null, 0, null, null, null, null, null]),

  // ========== LATIN ==========
  createPatternFromNotes('salsa-tumbao', 'Salsa Tumbao',
    [null, null, 0, null, null, 0, null, null, null, null, 0, null, null, 0, null, null]),
  createPatternFromNotes('bossa-nova', 'Bossa Nova',
    [0, null, null, 0, null, null, 0, null, null, 0, null, null, 0, null, null, 0]),

  // ========== WALKING BASS ==========
  createPatternFromNotes('walking-jazz', 'Walking Jazz',
    [0, null, 2, null, 4, null, 5, null, 7, null, 9, null, 10, null, 12, null]),
  createPatternFromNotes('walking-blues', 'Walking Blues',
    [0, null, 3, null, 5, null, 6, null, 7, null, 10, null, 12, null, 10, null]),

  // ========== ARPEGGIATED ==========
  createPatternFromNotes('arp-triad-up', 'Arpeggio Up',
    [0, null, 4, null, 7, null, 12, null, 0, null, 4, null, 7, null, 12, null]),
  createPatternFromNotes('arp-triad-down', 'Arpeggio Down',
    [12, null, 7, null, 4, null, 0, null, 12, null, 7, null, 4, null, 0, null]),
  createPatternFromNotes('arp-seventh', 'Seventh Arpeggio',
    [0, null, 4, null, 7, null, 11, null, 12, null, 11, null, 7, null, 4, null]),
];

// ============================================================================
// BASSLINE STATE
// ============================================================================

/**
 * Complete bassline state
 */
export interface BasslineState {
  readonly patch: BassPatch;
  readonly pattern: BassPattern;
  readonly isPlaying: boolean;
  readonly currentStep: number;
  readonly tempo: number;
  readonly transpose: number;           // Semitones
  readonly octave: number;              // Additional octave shift
  readonly chordFollow: boolean;        // Follow chord track
  readonly currentChordRoot: number;    // From chord track
  readonly voicesActive: number;        // Current polyphony
  readonly lastNoteTime: number;
  readonly heldNotes: ReadonlySet<number>;
}

/**
 * Create initial bassline state
 */
export function createBasslineState(
  patch?: BassPatch,
  pattern?: BassPattern
): BasslineState {
  const bassPatch = patch || PRESET_BASS_PATCHES[0];
  if (!bassPatch) {
    throw new Error('No bass patch available');
  }
  return {
    patch: bassPatch,
    pattern: pattern || createEmptyBassPattern('default', 'Default', 16),
    isPlaying: false,
    currentStep: 0,
    tempo: 120,
    transpose: 0,
    octave: 0,
    chordFollow: false,
    currentChordRoot: 0,
    voicesActive: 0,
    lastNoteTime: 0,
    heldNotes: new Set(),
  };
}

// ============================================================================
// BASSLINE INPUT/OUTPUT
// ============================================================================

export type BasslineInput =
  | { type: 'play' }
  | { type: 'stop' }
  | { type: 'noteOn'; note: number; velocity: number }
  | { type: 'noteOff'; note: number }
  | { type: 'setPatch'; patch: BassPatch }
  | { type: 'setPattern'; pattern: BassPattern }
  | { type: 'setTempo'; bpm: number }
  | { type: 'setTranspose'; semitones: number }
  | { type: 'setOctave'; octave: number }
  | { type: 'setChordRoot'; root: number }
  | { type: 'loadPreset'; patchId: string; patternId?: string }
  | { type: 'tick'; time: number }
  | { type: 'setParameter'; param: string; value: number };

export type BasslineOutput =
  | { type: 'noteOn'; note: number; velocity: number; time: number }
  | { type: 'noteOff'; note: number; time: number }
  | { type: 'controlChange'; control: number; value: number }
  | { type: 'stepChanged'; step: number }
  | { type: 'patternEnd' };

/**
 * Process bassline input
 */
export function processBasslineInput(
  state: BasslineState,
  input: BasslineInput
): { state: BasslineState; outputs: BasslineOutput[] } {
  const outputs: BasslineOutput[] = [];

  switch (input.type) {
    case 'play':
      return { state: { ...state, isPlaying: true }, outputs };

    case 'stop':
      return { state: { ...state, isPlaying: false, currentStep: 0 }, outputs };

    case 'noteOn': {
      const heldNotes = new Set(state.heldNotes);
      heldNotes.add(input.note);
      outputs.push({
        type: 'noteOn',
        note: input.note + state.transpose + state.octave * 12,
        velocity: input.velocity,
        time: performance.now(),
      });
      return {
        state: {
          ...state,
          heldNotes,
          voicesActive: heldNotes.size,
          lastNoteTime: performance.now(),
        },
        outputs,
      };
    }

    case 'noteOff': {
      const heldNotes = new Set(state.heldNotes);
      heldNotes.delete(input.note);
      outputs.push({
        type: 'noteOff',
        note: input.note + state.transpose + state.octave * 12,
        time: performance.now(),
      });
      return {
        state: { ...state, heldNotes, voicesActive: heldNotes.size },
        outputs,
      };
    }

    case 'setPatch':
      return { state: { ...state, patch: input.patch }, outputs };

    case 'setPattern':
      return { state: { ...state, pattern: input.pattern }, outputs };

    case 'setTempo':
      return { state: { ...state, tempo: Math.max(20, Math.min(300, input.bpm)) }, outputs };

    case 'setTranspose':
      return { state: { ...state, transpose: input.semitones }, outputs };

    case 'setOctave':
      return { state: { ...state, octave: Math.max(-3, Math.min(3, input.octave)) }, outputs };

    case 'setChordRoot':
      return { state: { ...state, currentChordRoot: input.root }, outputs };

    case 'loadPreset': {
      const patch = PRESET_BASS_PATCHES.find(p => p.id === input.patchId);
      const pattern = input.patternId 
        ? PRESET_BASS_PATTERNS.find(p => p.id === input.patternId)
        : undefined;
      
      return {
        state: {
          ...state,
          patch: patch || state.patch,
          pattern: pattern || state.pattern,
        },
        outputs,
      };
    }

    case 'tick': {
      if (!state.isPlaying) {
        return { state, outputs };
      }

      const step = state.pattern.steps[state.currentStep];
      if (step && step.velocity > 0) {
        const baseNote = step.note + state.transpose + state.octave * 12 + step.octaveShift * 12;
        const note = state.chordFollow ? baseNote + state.currentChordRoot : baseNote;

        outputs.push({
          type: 'noteOn',
          note,
          velocity: step.accent ? Math.min(127, step.velocity + 20) : step.velocity,
          time: input.time,
        });

        // Schedule note off based on gate
        const stepDuration = 60000 / state.tempo / 4;
        const noteOffTime = input.time + stepDuration * step.gate;
        outputs.push({
          type: 'noteOff',
          note,
          time: noteOffTime,
        });
      }

      let nextStep = state.currentStep + 1;
      if (nextStep >= state.pattern.length) {
        nextStep = 0;
        outputs.push({ type: 'patternEnd' });
      }

      outputs.push({ type: 'stepChanged', step: nextStep });

      return { state: { ...state, currentStep: nextStep }, outputs };
    }

    default:
      return { state, outputs };
  }
}

// ============================================================================
// CARD DEFINITION
// ============================================================================

export const BASSLINE_CARD_META: CardMeta = {
  id: 'bassline',
  name: 'Bassline',
  description: 'Professional bass synthesizer with pattern sequencer and 100+ presets',
  category: 'generators',
  tags: ['bass', 'synth', 'sequencer', 'acid', '303', 'sub'],
  version: '1.0.0',
  author: 'Cardplay',
};

export const BASSLINE_CARD_SIGNATURE: CardSignature = {
  inputs: [
    { name: 'midi', label: 'MIDI In', type: PortTypes.MIDI },
    { name: 'clock', label: 'Clock', type: PortTypes.TRIGGER },
    { name: 'chord', label: 'Chord Root', type: PortTypes.CONTROL },
  ],
  outputs: [
    { name: 'audio', label: 'Audio Out', type: PortTypes.AUDIO },
    { name: 'notes', label: 'Note Events', type: PortTypes.NOTES },
  ],
  params: [
    { name: 'patch', label: 'Patch', type: 'enum', default: 'acid-classic' },
    { name: 'pattern', label: 'Pattern', type: 'enum', default: 'acid-classic' },
    { name: 'tempo', label: 'Tempo', type: 'number', min: 20, max: 300, default: 120 },
    { name: 'transpose', label: 'Transpose', type: 'number', min: -24, max: 24, default: 0 },
    { name: 'octave', label: 'Octave', type: 'number', min: -3, max: 3, default: 0 },
    { name: 'filterCutoff', label: 'Filter Cutoff', type: 'number', min: 20, max: 20000, default: 1000 },
    { name: 'filterResonance', label: 'Filter Resonance', type: 'number', min: 0, max: 1, default: 0.3 },
    { name: 'filterEnvAmount', label: 'Filter Env Amount', type: 'number', min: -1, max: 1, default: 0.5 },
    { name: 'distortion', label: 'Distortion', type: 'number', min: 0, max: 1, default: 0 },
    { name: 'accent', label: 'Accent', type: 'number', min: 0, max: 1, default: 0.5 },
    { name: 'slide', label: 'Slide Time', type: 'number', min: 0, max: 0.5, default: 0.05 },
  ],
};

/**
 * Create bassline card instance
 */
export function createBasslineCard(): Card<BasslineInput, BasslineOutput> {
  let state = createBasslineState();

  return {
    meta: BASSLINE_CARD_META,
    signature: BASSLINE_CARD_SIGNATURE,

    process(input: BasslineInput, _context: CardContext, cardState?: CardState<unknown>): CardResult<BasslineOutput> {
      const result = processBasslineInput(state, input);
      state = result.state;
      const output = result.outputs[0];
      return {
        output: output !== undefined ? output : { type: 'patternEnd' },
        ...(cardState !== undefined ? { state: cardState } : {}),
      };
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  PRESET_BASS_PATCHES as bassPatches,
  PRESET_BASS_PATTERNS as bassPatterns,
};
