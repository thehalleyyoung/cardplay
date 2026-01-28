/**
 * @fileoverview Effect Cards - Built-in audio effect processors.
 * 
 * This module provides ready-to-use effect cards including:
 * - Reverb (room, hall, plate, spring)
 * - Delay (stereo, ping-pong, tape, multi-tap)
 * - Modulation (chorus, flanger, phaser)
 * - Dynamics (compressor, limiter, gate, expander)
 * - EQ (parametric, graphic, tilt)
 * - Distortion (overdrive, fuzz, bitcrush)
 * - Filters (lowpass, highpass, bandpass, notch)
 * - Spatial (stereo width, panner, rotary)
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

/**
 * Effect bypass state.
 */
export interface EffectBypass {
  readonly bypassed: boolean;
  readonly wetDry: number; // 0 = dry, 1 = wet
}

/**
 * Default bypass state.
 */
export const DEFAULT_BYPASS: EffectBypass = {
  bypassed: false,
  wetDry: 1,
};

/**
 * Base effect state.
 */
export interface BaseEffectState extends EffectBypass {
  readonly id: string;
  readonly type: string;
}

// ============================================================================
// REVERB
// ============================================================================

/**
 * Reverb type.
 */
export type ReverbType = 'room' | 'hall' | 'plate' | 'spring' | 'chamber' | 'cathedral';

/**
 * Reverb preset parameters.
 */
export interface ReverbPreset {
  readonly decayTime: number;    // Seconds
  readonly preDelay: number;     // Milliseconds
  readonly damping: number;      // 0-1 (high freq damping)
  readonly diffusion: number;    // 0-1
  readonly density: number;      // 0-1
  readonly earlyReflections: number; // 0-1
}

/**
 * Reverb presets by type.
 */
export const REVERB_PRESETS: Record<ReverbType, ReverbPreset> = {
  room: {
    decayTime: 0.8,
    preDelay: 10,
    damping: 0.5,
    diffusion: 0.7,
    density: 0.8,
    earlyReflections: 0.6,
  },
  hall: {
    decayTime: 2.5,
    preDelay: 20,
    damping: 0.3,
    diffusion: 0.9,
    density: 0.9,
    earlyReflections: 0.4,
  },
  plate: {
    decayTime: 1.5,
    preDelay: 5,
    damping: 0.2,
    diffusion: 0.95,
    density: 0.95,
    earlyReflections: 0.2,
  },
  spring: {
    decayTime: 1.2,
    preDelay: 30,
    damping: 0.6,
    diffusion: 0.5,
    density: 0.6,
    earlyReflections: 0.8,
  },
  chamber: {
    decayTime: 1.8,
    preDelay: 15,
    damping: 0.4,
    diffusion: 0.8,
    density: 0.85,
    earlyReflections: 0.5,
  },
  cathedral: {
    decayTime: 5.0,
    preDelay: 40,
    damping: 0.2,
    diffusion: 0.95,
    density: 0.95,
    earlyReflections: 0.3,
  },
};

/**
 * Reverb state.
 */
export interface ReverbState extends BaseEffectState {
  readonly type: 'reverb';
  readonly reverbType: ReverbType;
  readonly decayTime: number;
  readonly preDelay: number;
  readonly damping: number;
  readonly diffusion: number;
  readonly density: number;
  readonly earlyReflections: number;
  readonly lowCut: number;     // Hz
  readonly highCut: number;    // Hz
  readonly modRate: number;    // Hz
  readonly modDepth: number;   // 0-1
}

/**
 * Default reverb state.
 */
export const DEFAULT_REVERB_STATE: ReverbState = {
  id: 'reverb-1',
  type: 'reverb',
  bypassed: false,
  wetDry: 0.3,
  reverbType: 'hall',
  ...REVERB_PRESETS.hall,
  lowCut: 100,
  highCut: 8000,
  modRate: 0.5,
  modDepth: 0.1,
};

/**
 * Create reverb with preset.
 */
export function createReverb(
  reverbType: ReverbType,
  wetDry: number = 0.3
): ReverbState {
  const preset = REVERB_PRESETS[reverbType];
  return {
    ...DEFAULT_REVERB_STATE,
    reverbType,
    ...preset,
    wetDry,
  };
}

// ============================================================================
// DELAY
// ============================================================================

/**
 * Delay type.
 */
export type DelayType = 'mono' | 'stereo' | 'ping-pong' | 'tape' | 'multi-tap' | 'reverse';

/**
 * Delay tap definition.
 */
export interface DelayTap {
  readonly time: number;     // ms or beats
  readonly feedback: number; // 0-1
  readonly pan: number;      // -1 to 1
  readonly level: number;    // 0-1
  readonly lowCut: number;   // Hz
  readonly highCut: number;  // Hz
}

/**
 * Delay sync mode.
 */
export type DelaySyncMode = 'ms' | 'beat' | 'dotted' | 'triplet';

/**
 * Delay state.
 */
export interface DelayState extends BaseEffectState {
  readonly type: 'delay';
  readonly delayType: DelayType;
  readonly time: number;           // ms or beat division
  readonly feedback: number;       // 0-1
  readonly syncMode: DelaySyncMode;
  readonly synced: boolean;
  readonly taps: readonly DelayTap[];
  readonly stereoWidth: number;    // 0-1
  readonly pingPongSpread: number; // 0-1
  readonly lowCut: number;         // Hz
  readonly highCut: number;        // Hz
  readonly modRate: number;        // Hz (for tape)
  readonly modDepth: number;       // 0-1
  readonly saturation: number;     // 0-1 (for tape)
  readonly flutter: number;        // 0-1 (for tape)
}

/**
 * Default delay state.
 */
export const DEFAULT_DELAY_STATE: DelayState = {
  id: 'delay-1',
  type: 'delay',
  bypassed: false,
  wetDry: 0.4,
  delayType: 'stereo',
  time: 375, // ~1/4 note at 160 BPM
  feedback: 0.4,
  syncMode: 'beat',
  synced: true,
  taps: [],
  stereoWidth: 0.5,
  pingPongSpread: 1,
  lowCut: 200,
  highCut: 6000,
  modRate: 0.3,
  modDepth: 0,
  saturation: 0,
  flutter: 0,
};

/**
 * Calculate delay time from tempo and note value.
 */
export function calculateDelayTime(
  bpm: number,
  noteValue: number, // 1 = whole, 0.5 = half, 0.25 = quarter, etc.
  mode: DelaySyncMode
): number {
  const beatMs = (60 * 1000) / bpm;
  const baseTime = beatMs * (noteValue * 4); // Convert to beats
  
  switch (mode) {
    case 'ms':
      return noteValue; // Direct ms value
    case 'beat':
      return baseTime;
    case 'dotted':
      return baseTime * 1.5;
    case 'triplet':
      return baseTime * (2 / 3);
    default:
      return baseTime;
  }
}

/**
 * Create multi-tap delay.
 */
export function createMultiTapDelay(
  baseTime: number,
  tapCount: number,
  feedbackDecay: number = 0.8
): readonly DelayTap[] {
  return Array.from({ length: tapCount }, (_, i) => ({
    time: baseTime * (i + 1),
    feedback: Math.pow(feedbackDecay, i + 1),
    pan: (i % 2 === 0 ? -1 : 1) * (0.3 + (i * 0.1)),
    level: Math.pow(0.9, i),
    lowCut: 200 + (i * 100),
    highCut: 8000 - (i * 500),
  }));
}

// ============================================================================
// CHORUS
// ============================================================================

/**
 * Chorus state.
 */
export interface ChorusState extends BaseEffectState {
  readonly type: 'chorus';
  readonly rate: number;       // Hz (LFO rate)
  readonly depth: number;      // 0-1
  readonly feedback: number;   // 0-1
  readonly delay: number;      // ms
  readonly stereoWidth: number; // 0-1
  readonly voices: number;     // 1-4
  readonly waveform: 'sine' | 'triangle';
}

/**
 * Default chorus state.
 */
export const DEFAULT_CHORUS_STATE: ChorusState = {
  id: 'chorus-1',
  type: 'chorus',
  bypassed: false,
  wetDry: 0.5,
  rate: 0.5,
  depth: 0.5,
  feedback: 0.2,
  delay: 7,
  stereoWidth: 0.8,
  voices: 2,
  waveform: 'sine',
};

/**
 * Chorus preset type.
 */
export type ChorusPreset = 'subtle' | 'warm' | 'wide' | 'shimmer' | 'vintage';

/**
 * Chorus presets.
 */
export const CHORUS_PRESETS: Record<ChorusPreset, Partial<ChorusState>> = {
  subtle: { rate: 0.3, depth: 0.3, delay: 5, voices: 2, stereoWidth: 0.5 },
  warm: { rate: 0.5, depth: 0.5, delay: 10, voices: 2, stereoWidth: 0.7 },
  wide: { rate: 0.4, depth: 0.6, delay: 8, voices: 4, stereoWidth: 1 },
  shimmer: { rate: 1.5, depth: 0.4, delay: 6, voices: 4, stereoWidth: 0.9 },
  vintage: { rate: 0.8, depth: 0.7, delay: 12, voices: 2, stereoWidth: 0.6, feedback: 0.3 },
};

// ============================================================================
// FLANGER
// ============================================================================

/**
 * Flanger state.
 */
export interface FlangerState extends BaseEffectState {
  readonly type: 'flanger';
  readonly rate: number;       // Hz
  readonly depth: number;      // 0-1
  readonly feedback: number;   // -1 to 1 (negative = inverted)
  readonly delay: number;      // ms (center delay)
  readonly stereoWidth: number;
  readonly manual: number;     // 0-1 (manual sweep position)
  readonly waveform: 'sine' | 'triangle';
}

/**
 * Default flanger state.
 */
export const DEFAULT_FLANGER_STATE: FlangerState = {
  id: 'flanger-1',
  type: 'flanger',
  bypassed: false,
  wetDry: 0.5,
  rate: 0.2,
  depth: 0.7,
  feedback: 0.5,
  delay: 2,
  stereoWidth: 0.7,
  manual: 0.5,
  waveform: 'sine',
};

// ============================================================================
// PHASER
// ============================================================================

/**
 * Phaser state.
 */
export interface PhaserState extends BaseEffectState {
  readonly type: 'phaser';
  readonly rate: number;       // Hz
  readonly depth: number;      // 0-1
  readonly feedback: number;   // -1 to 1
  readonly stages: number;     // 2, 4, 6, 8, 10, 12
  readonly centerFreq: number; // Hz
  readonly stereoWidth: number;
  readonly waveform: 'sine' | 'triangle';
}

/**
 * Default phaser state.
 */
export const DEFAULT_PHASER_STATE: PhaserState = {
  id: 'phaser-1',
  type: 'phaser',
  bypassed: false,
  wetDry: 0.5,
  rate: 0.5,
  depth: 0.6,
  feedback: 0.5,
  stages: 4,
  centerFreq: 1000,
  stereoWidth: 0.5,
  waveform: 'sine',
};

// ============================================================================
// COMPRESSOR
// ============================================================================

/**
 * Compressor knee type.
 */
export type CompressorKnee = 'hard' | 'soft';

/**
 * Compressor detection mode.
 */
export type CompressorDetection = 'peak' | 'rms';

/**
 * Compressor state.
 */
export interface CompressorState extends BaseEffectState {
  readonly type: 'compressor';
  readonly threshold: number;   // dB
  readonly ratio: number;       // 1:1 to infinity
  readonly attack: number;      // ms
  readonly release: number;     // ms
  readonly knee: CompressorKnee;
  readonly kneeWidth: number;   // dB (for soft knee)
  readonly detection: CompressorDetection;
  readonly makeupGain: number;  // dB
  readonly autoMakeup: boolean;
  readonly sidechain: boolean;
  readonly sidechainHPF: number; // Hz
  readonly lookahead: number;    // ms
}

/**
 * Default compressor state.
 */
export const DEFAULT_COMPRESSOR_STATE: CompressorState = {
  id: 'compressor-1',
  type: 'compressor',
  bypassed: false,
  wetDry: 1,
  threshold: -20,
  ratio: 4,
  attack: 10,
  release: 100,
  knee: 'soft',
  kneeWidth: 6,
  detection: 'rms',
  makeupGain: 0,
  autoMakeup: true,
  sidechain: false,
  sidechainHPF: 80,
  lookahead: 0,
};

/**
 * Compressor preset type.
 */
export type CompressorPreset = 'gentle' | 'vocal' | 'drums' | 'bass' | 'master' | 'limiter';

/**
 * Compressor presets.
 */
export const COMPRESSOR_PRESETS: Record<CompressorPreset, Partial<CompressorState>> = {
  gentle: { threshold: -20, ratio: 2, attack: 20, release: 200, knee: 'soft' },
  vocal: { threshold: -18, ratio: 3, attack: 5, release: 100, knee: 'soft' },
  drums: { threshold: -15, ratio: 4, attack: 1, release: 50, knee: 'hard' },
  bass: { threshold: -12, ratio: 4, attack: 10, release: 100, knee: 'soft', sidechainHPF: 120 },
  master: { threshold: -6, ratio: 2, attack: 10, release: 200, knee: 'soft', autoMakeup: false },
  limiter: { threshold: -3, ratio: 20, attack: 0.1, release: 50, knee: 'hard', lookahead: 5 },
};

/**
 * Calculate gain reduction.
 */
export function calculateGainReduction(
  inputLevel: number,
  threshold: number,
  ratio: number,
  knee: CompressorKnee,
  kneeWidth: number
): number {
  if (knee === 'hard') {
    if (inputLevel <= threshold) return 0;
    return (inputLevel - threshold) * (1 - 1 / ratio);
  }
  
  // Soft knee
  const halfKnee = kneeWidth / 2;
  const kneeStart = threshold - halfKnee;
  const kneeEnd = threshold + halfKnee;
  
  if (inputLevel <= kneeStart) return 0;
  if (inputLevel >= kneeEnd) {
    return (inputLevel - threshold) * (1 - 1 / ratio);
  }
  
  // In knee region - interpolate
  const kneeAmount = (inputLevel - kneeStart) / kneeWidth;
  const effectiveRatio = 1 + (ratio - 1) * kneeAmount;
  return (inputLevel - threshold) * (1 - 1 / effectiveRatio) * kneeAmount;
}

// ============================================================================
// LIMITER
// ============================================================================

/**
 * Limiter state.
 */
export interface LimiterState extends BaseEffectState {
  readonly type: 'limiter';
  readonly ceiling: number;    // dB
  readonly release: number;    // ms
  readonly lookahead: number;  // ms
  readonly truePeak: boolean;
}

/**
 * Default limiter state.
 */
export const DEFAULT_LIMITER_STATE: LimiterState = {
  id: 'limiter-1',
  type: 'limiter',
  bypassed: false,
  wetDry: 1,
  ceiling: -0.3,
  release: 100,
  lookahead: 5,
  truePeak: true,
};

// ============================================================================
// GATE
// ============================================================================

/**
 * Gate state.
 */
export interface GateState extends BaseEffectState {
  readonly type: 'gate';
  readonly threshold: number;   // dB
  readonly range: number;       // dB reduction when closed
  readonly attack: number;      // ms
  readonly hold: number;        // ms
  readonly release: number;     // ms
  readonly lookahead: number;   // ms
  readonly sidechain: boolean;
  readonly sidechainHPF: number;
  readonly sidechainLPF: number;
}

/**
 * Default gate state.
 */
export const DEFAULT_GATE_STATE: GateState = {
  id: 'gate-1',
  type: 'gate',
  bypassed: false,
  wetDry: 1,
  threshold: -40,
  range: -80,
  attack: 0.5,
  hold: 50,
  release: 100,
  lookahead: 0,
  sidechain: false,
  sidechainHPF: 20,
  sidechainLPF: 20000,
};

// ============================================================================
// PARAMETRIC EQ
// ============================================================================

/**
 * EQ band type.
 */
export type EQBandType = 'lowShelf' | 'highShelf' | 'lowCut' | 'highCut' | 'peak' | 'notch';

/**
 * EQ band.
 */
export interface EQBand {
  readonly id: string;
  readonly enabled: boolean;
  readonly type: EQBandType;
  readonly frequency: number;  // Hz
  readonly gain: number;       // dB
  readonly q: number;          // Quality factor
}

/**
 * Default EQ band.
 */
export const DEFAULT_EQ_BAND: EQBand = {
  id: 'band-1',
  enabled: true,
  type: 'peak',
  frequency: 1000,
  gain: 0,
  q: 1,
};

/**
 * Parametric EQ state.
 */
export interface ParametricEQState extends BaseEffectState {
  readonly type: 'eq';
  readonly bands: readonly EQBand[];
  readonly outputGain: number; // dB
  readonly autoGain: boolean;
}

/**
 * Default 4-band EQ state.
 */
export const DEFAULT_PARAMETRIC_EQ_STATE: ParametricEQState = {
  id: 'eq-1',
  type: 'eq',
  bypassed: false,
  wetDry: 1,
  bands: [
    { id: 'low', enabled: true, type: 'lowShelf', frequency: 100, gain: 0, q: 0.7 },
    { id: 'lowMid', enabled: true, type: 'peak', frequency: 500, gain: 0, q: 1 },
    { id: 'highMid', enabled: true, type: 'peak', frequency: 2000, gain: 0, q: 1 },
    { id: 'high', enabled: true, type: 'highShelf', frequency: 8000, gain: 0, q: 0.7 },
  ],
  outputGain: 0,
  autoGain: false,
};

/**
 * Create EQ band.
 */
export function createEQBand(
  type: EQBandType,
  frequency: number,
  gain: number = 0,
  q: number = 1
): EQBand {
  return {
    id: `band-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    enabled: true,
    type,
    frequency,
    gain,
    q,
  };
}

/**
 * Set EQ band gain.
 */
export function setEQBandGain(
  state: ParametricEQState,
  bandId: string,
  gain: number
): ParametricEQState {
  return {
    ...state,
    bands: state.bands.map(band =>
      band.id === bandId ? { ...band, gain } : band
    ),
  };
}

/**
 * Set EQ band frequency.
 */
export function setEQBandFrequency(
  state: ParametricEQState,
  bandId: string,
  frequency: number
): ParametricEQState {
  return {
    ...state,
    bands: state.bands.map(band =>
      band.id === bandId ? { ...band, frequency } : band
    ),
  };
}

// ============================================================================
// GRAPHIC EQ
// ============================================================================

/**
 * Graphic EQ preset frequencies.
 */
export const GRAPHIC_EQ_FREQUENCIES = {
  10: [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000],
  31: [20, 25, 31, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500,
       630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300,
       8000, 10000, 12500, 16000, 20000],
} as const;

/**
 * Graphic EQ state.
 */
export interface GraphicEQState extends BaseEffectState {
  readonly type: 'graphicEq';
  readonly bandCount: 10 | 31;
  readonly gains: readonly number[]; // dB values for each band
  readonly outputGain: number;
}

/**
 * Default 10-band graphic EQ state.
 */
export const DEFAULT_GRAPHIC_EQ_STATE: GraphicEQState = {
  id: 'graphic-eq-1',
  type: 'graphicEq',
  bypassed: false,
  wetDry: 1,
  bandCount: 10,
  gains: Array(10).fill(0),
  outputGain: 0,
};

/**
 * Set graphic EQ band gain.
 */
export function setGraphicEQGain(
  state: GraphicEQState,
  bandIndex: number,
  gain: number
): GraphicEQState {
  const gains = [...state.gains];
  gains[bandIndex] = Math.max(-12, Math.min(12, gain));
  return { ...state, gains };
}

// ============================================================================
// DISTORTION
// ============================================================================

/**
 * Distortion type.
 */
export type DistortionType = 'overdrive' | 'distortion' | 'fuzz' | 'bitcrush' | 'wavefold';

/**
 * Distortion state.
 */
export interface DistortionState extends BaseEffectState {
  readonly type: 'distortion';
  readonly distortionType: DistortionType;
  readonly drive: number;       // 0-1
  readonly tone: number;        // 0-1 (post filter)
  readonly output: number;      // dB
  readonly asymmetry: number;   // -1 to 1
  // Bitcrush specific
  readonly bitDepth: number;    // 1-16
  readonly sampleRate: number;  // Hz
  // Wavefold specific
  readonly foldAmount: number;  // 1-8
}

/**
 * Default distortion state.
 */
export const DEFAULT_DISTORTION_STATE: DistortionState = {
  id: 'distortion-1',
  type: 'distortion',
  bypassed: false,
  wetDry: 1,
  distortionType: 'overdrive',
  drive: 0.5,
  tone: 0.5,
  output: 0,
  asymmetry: 0,
  bitDepth: 16,
  sampleRate: 44100,
  foldAmount: 1,
};

/**
 * Distortion presets.
 */
export const DISTORTION_PRESETS: Record<DistortionType, Partial<DistortionState>> = {
  overdrive: { drive: 0.4, tone: 0.6, asymmetry: 0.1 },
  distortion: { drive: 0.7, tone: 0.4, asymmetry: 0 },
  fuzz: { drive: 0.9, tone: 0.3, asymmetry: 0.3 },
  bitcrush: { drive: 0.2, bitDepth: 8, sampleRate: 11025 },
  wavefold: { drive: 0.5, foldAmount: 3 },
};

/**
 * Apply soft clipping distortion curve.
 */
export function applySoftClipping(input: number, drive: number): number {
  const x = input * (1 + drive * 10);
  // Soft clipping using tanh
  return Math.tanh(x);
}

/**
 * Apply hard clipping distortion curve.
 */
export function applyHardClipping(input: number, drive: number): number {
  const x = input * (1 + drive * 10);
  return Math.max(-1, Math.min(1, x));
}

/**
 * Apply bitcrushing.
 */
export function applyBitcrush(input: number, bitDepth: number): number {
  const levels = Math.pow(2, bitDepth);
  return Math.round(input * levels) / levels;
}

// ============================================================================
// FILTER
// ============================================================================

/**
 * Filter type.
 */
export type FilterType = 'lowpass' | 'highpass' | 'bandpass' | 'notch' | 'allpass' | 'peaking';

/**
 * Filter slope.
 */
export type FilterSlope = 12 | 24 | 36 | 48; // dB/octave

/**
 * Filter state.
 */
export interface FilterState extends BaseEffectState {
  readonly type: 'filter';
  readonly filterType: FilterType;
  readonly frequency: number;  // Hz
  readonly resonance: number;  // 0-1 (Q)
  readonly gain: number;       // dB (for peaking)
  readonly slope: FilterSlope;
  readonly drive: number;      // 0-1 (saturation before filter)
  // Modulation
  readonly envAmount: number;  // -1 to 1
  readonly lfoAmount: number;  // 0-1
  readonly lfoRate: number;    // Hz
  readonly keyTrack: number;   // 0-1
}

/**
 * Default filter state.
 */
export const DEFAULT_FILTER_STATE: FilterState = {
  id: 'filter-1',
  type: 'filter',
  bypassed: false,
  wetDry: 1,
  filterType: 'lowpass',
  frequency: 1000,
  resonance: 0.5,
  gain: 0,
  slope: 24,
  drive: 0,
  envAmount: 0,
  lfoAmount: 0,
  lfoRate: 1,
  keyTrack: 0,
};

/**
 * Calculate filter cutoff with modulation.
 */
export function calculateFilterCutoff(
  baseCutoff: number,
  envValue: number,
  envAmount: number,
  lfoValue: number,
  lfoAmount: number,
  midiNote: number,
  keyTrack: number
): number {
  // Convert to log scale for modulation
  const logCutoff = Math.log2(baseCutoff);
  
  // Apply envelope (-/+ 4 octaves max)
  const envMod = envValue * envAmount * 4;
  
  // Apply LFO (+/- 2 octaves max)
  const lfoMod = lfoValue * lfoAmount * 2;
  
  // Apply key tracking (0 = no tracking, 1 = follows pitch)
  const keyMod = keyTrack * ((midiNote - 60) / 12); // Octaves from middle C
  
  const modLogCutoff = logCutoff + envMod + lfoMod + keyMod;
  
  // Convert back to Hz and clamp
  return Math.max(20, Math.min(20000, Math.pow(2, modLogCutoff)));
}

// ============================================================================
// STEREO WIDTH
// ============================================================================

/**
 * Stereo width state.
 */
export interface StereoWidthState extends BaseEffectState {
  readonly type: 'stereoWidth';
  readonly width: number;       // 0 = mono, 1 = normal, 2 = extra wide
  readonly midGain: number;     // dB
  readonly sideGain: number;    // dB
  readonly bassMonoBelow: number; // Hz (mono frequencies below this)
}

/**
 * Default stereo width state.
 */
export const DEFAULT_STEREO_WIDTH_STATE: StereoWidthState = {
  id: 'stereo-width-1',
  type: 'stereoWidth',
  bypassed: false,
  wetDry: 1,
  width: 1,
  midGain: 0,
  sideGain: 0,
  bassMonoBelow: 100,
};

/**
 * Calculate mid/side from stereo.
 */
export function stereoToMidSide(left: number, right: number): { mid: number; side: number } {
  return {
    mid: (left + right) * 0.5,
    side: (left - right) * 0.5,
  };
}

/**
 * Calculate stereo from mid/side.
 */
export function midSideToStereo(mid: number, side: number): { left: number; right: number } {
  return {
    left: mid + side,
    right: mid - side,
  };
}

/**
 * Apply stereo width.
 */
export function applyStereoWidth(
  left: number,
  right: number,
  width: number
): { left: number; right: number } {
  const { mid, side } = stereoToMidSide(left, right);
  const wideSide = side * width;
  return midSideToStereo(mid, wideSide);
}

// ============================================================================
// PANNER
// ============================================================================

/**
 * Panning law.
 */
export type PanLaw = 'linear' | 'constantPower' | 'minus3dB' | 'minus4.5dB' | 'minus6dB';

/**
 * Panner state.
 */
export interface PannerState extends BaseEffectState {
  readonly type: 'panner';
  readonly pan: number;        // -1 to 1
  readonly panLaw: PanLaw;
  // Auto-pan
  readonly autoPanEnabled: boolean;
  readonly autoPanRate: number; // Hz
  readonly autoPanDepth: number; // 0-1
  readonly autoPanWaveform: 'sine' | 'triangle' | 'square';
}

/**
 * Default panner state.
 */
export const DEFAULT_PANNER_STATE: PannerState = {
  id: 'panner-1',
  type: 'panner',
  bypassed: false,
  wetDry: 1,
  pan: 0,
  panLaw: 'constantPower',
  autoPanEnabled: false,
  autoPanRate: 1,
  autoPanDepth: 1,
  autoPanWaveform: 'sine',
};

/**
 * Calculate pan gains.
 */
export function calculatePanGains(
  pan: number,
  law: PanLaw
): { leftGain: number; rightGain: number } {
  // Normalize pan from -1..1 to 0..1
  const p = (pan + 1) * 0.5;
  
  switch (law) {
    case 'linear':
      return { leftGain: 1 - p, rightGain: p };
      
    case 'constantPower':
      // -3dB center
      return {
        leftGain: Math.cos(p * Math.PI * 0.5),
        rightGain: Math.sin(p * Math.PI * 0.5),
      };
      
    case 'minus3dB':
      const sqrt2inv = 1 / Math.sqrt(2);
      return {
        leftGain: sqrt2inv + (1 - sqrt2inv) * (1 - p),
        rightGain: sqrt2inv + (1 - sqrt2inv) * p,
      };
      
    case 'minus4.5dB':
      const center = 0.595; // ~-4.5dB
      return {
        leftGain: center + (1 - center) * (1 - p),
        rightGain: center + (1 - center) * p,
      };
      
    case 'minus6dB':
      return {
        leftGain: 0.5 + 0.5 * (1 - p),
        rightGain: 0.5 + 0.5 * p,
      };
      
    default:
      return { leftGain: 1, rightGain: 1 };
  }
}

// ============================================================================
// ROTARY SPEAKER
// ============================================================================

/**
 * Rotary speaker state.
 */
export interface RotaryState extends BaseEffectState {
  readonly type: 'rotary';
  readonly speed: 'slow' | 'fast' | 'stop';
  readonly slowRate: number;    // Hz
  readonly fastRate: number;    // Hz
  readonly rampTime: number;    // ms (time to change speed)
  readonly hornLevel: number;   // 0-1
  readonly drumLevel: number;   // 0-1
  readonly hornDistance: number; // 0-1 (doppler effect)
  readonly drumDistance: number; // 0-1
  readonly micDistance: number;  // 0-1 (room sound)
}

/**
 * Default rotary state.
 */
export const DEFAULT_ROTARY_STATE: RotaryState = {
  id: 'rotary-1',
  type: 'rotary',
  bypassed: false,
  wetDry: 1,
  speed: 'slow',
  slowRate: 0.8,
  fastRate: 6.5,
  rampTime: 1500,
  hornLevel: 0.8,
  drumLevel: 0.6,
  hornDistance: 0.5,
  drumDistance: 0.3,
  micDistance: 0.4,
};

// ============================================================================
// EFFECT CHAIN
// ============================================================================

/**
 * Effect chain state.
 */
export interface EffectChainState {
  readonly id: string;
  readonly effects: readonly BaseEffectState[];
  readonly inputGain: number;  // dB
  readonly outputGain: number; // dB
  readonly bypassed: boolean;
}

/**
 * Default effect chain state.
 */
export const DEFAULT_EFFECT_CHAIN_STATE: EffectChainState = {
  id: 'chain-1',
  effects: [],
  inputGain: 0,
  outputGain: 0,
  bypassed: false,
};

/**
 * Add effect to chain.
 */
export function addEffectToChain(
  chain: EffectChainState,
  effect: BaseEffectState,
  index?: number
): EffectChainState {
  const effects = [...chain.effects];
  if (index !== undefined) {
    effects.splice(index, 0, effect);
  } else {
    effects.push(effect);
  }
  return { ...chain, effects };
}

/**
 * Remove effect from chain.
 */
export function removeEffectFromChain(
  chain: EffectChainState,
  effectId: string
): EffectChainState {
  return {
    ...chain,
    effects: chain.effects.filter(e => e.id !== effectId),
  };
}

/**
 * Move effect in chain.
 */
export function moveEffectInChain(
  chain: EffectChainState,
  effectId: string,
  newIndex: number
): EffectChainState {
  const effects = [...chain.effects];
  const currentIndex = effects.findIndex(e => e.id === effectId);
  
  if (currentIndex === -1) return chain;
  
  const [effect] = effects.splice(currentIndex, 1);
  effects.splice(newIndex, 0, effect!);
  
  return { ...chain, effects };
}

/**
 * Toggle effect bypass in chain.
 */
export function toggleEffectBypass(
  chain: EffectChainState,
  effectId: string
): EffectChainState {
  return {
    ...chain,
    effects: chain.effects.map(e =>
      e.id === effectId ? { ...e, bypassed: !e.bypassed } : e
    ),
  };
}
