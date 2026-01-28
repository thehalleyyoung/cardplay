/**
 * @fileoverview Wavetable Core Engine
 * 
 * Surge-compatible wavetable synthesizer with:
 * - Multi-frame wavetable storage and interpolation
 * - Linear and cubic interpolation between frames
 * - Anti-aliased playback with MIP-mapping
 * - Real-time morph control with modulation
 * - FM/RM/AM between wavetables
 * - Wavetable generation and export
 * 
 * @module @cardplay/core/audio/wavetable-core
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default wavetable frame size (power of 2) */
export const DEFAULT_FRAME_SIZE = 2048;

/** Minimum frame size (power of 2) */
export const MIN_FRAME_SIZE = 64;

/** Maximum frame size (power of 2) */
export const MAX_FRAME_SIZE = 8192;

/** Maximum number of frames in a wavetable */
export const MAX_FRAMES = 256;

/** Number of MIP-map levels for anti-aliasing */
export const MIP_LEVELS = 10;

/** Minimum frequency for lowest MIP level */
export const MIP_MIN_FREQ = 20;

/** Standard sample rates for MIP calculation */
export const STANDARD_SAMPLE_RATES = [44100, 48000, 88200, 96000] as const;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Interpolation mode for reading between samples.
 */
export type InterpolationMode = 'none' | 'linear' | 'cubic' | 'sinc';

/**
 * Interpolation mode for morphing between frames.
 */
export type FrameInterpolation = 'none' | 'linear' | 'cubic' | 'spectral';

/**
 * A single wavetable frame (one cycle of audio).
 */
export interface WavetableFrame {
  /** Raw sample data (power-of-2 length) */
  samples: Float32Array;
  /** Frame index within the wavetable */
  index: number;
  /** Optional metadata (name, tags) */
  name?: string;
}

/**
 * MIP-mapped version of a wavetable for anti-aliased playback.
 */
export interface MipMappedWavetable {
  /** Array of progressively lower-resolution frames */
  levels: Float32Array[];
  /** Frequency thresholds for each level */
  thresholds: number[];
}

/**
 * A complete wavetable containing multiple frames.
 */
export interface Wavetable {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** All frames in the wavetable */
  frames: WavetableFrame[];
  /** Number of samples per frame */
  frameSize: number;
  /** Total number of frames */
  frameCount: number;
  /** Author/source information */
  author?: string;
  /** Category for organization */
  category?: string;
  /** Tags for search */
  tags?: string[];
  /** Sample rate the wavetable was designed for */
  sampleRate?: number;
  /** Whether MIP-maps have been generated */
  hasMipMaps?: boolean;
  /** MIP-mapped versions of each frame */
  mipMaps?: MipMappedWavetable[];
}

/**
 * Wavetable oscillator state.
 */
export interface WavetableOscillatorState {
  /** Current phase (0-1) */
  phase: number;
  /** Current frame position (0 to frameCount-1, can be fractional) */
  framePosition: number;
  /** Current frequency in Hz */
  frequency: number;
  /** Current detune in cents */
  detune: number;
  /** Phase increment per sample */
  phaseIncrement: number;
}

/**
 * Wavetable oscillator parameters.
 */
export interface WavetableOscillatorParams {
  /** Frequency in Hz */
  frequency: number;
  /** Detune in cents */
  detune: number;
  /** Frame position (0-1 normalized) */
  framePosition: number;
  /** Gain/level (0-1) */
  gain: number;
  /** Pan position (-1 to 1) */
  pan: number;
  /** Sample interpolation mode */
  interpolation: InterpolationMode;
  /** Frame interpolation mode */
  frameInterpolation: FrameInterpolation;
  /** Phase offset (0-1) */
  phaseOffset: number;
  /** Use MIP-mapping for anti-aliasing */
  useMipMap: boolean;
  /** Formant preservation amount (0-1) */
  formantPreserve: number;
}

/**
 * Wavetable slot for multi-wavetable oscillators.
 */
export interface WavetableSlot {
  /** The loaded wavetable */
  wavetable: Wavetable | null;
  /** Blend amount (0-1) when blending with other slots */
  blend: number;
  /** Frame offset for this slot */
  frameOffset: number;
  /** Mute this slot */
  muted: boolean;
}

/**
 * Wavetable modulation options.
 */
export interface WavetableModulation {
  /** FM depth (0-1) */
  fmDepth: number;
  /** FM ratio (carrier:modulator) */
  fmRatio: number;
  /** Ring modulation depth (0-1) */
  rmDepth: number;
  /** Amplitude modulation depth (0-1) */
  amDepth: number;
  /** Sync enable */
  sync: boolean;
  /** Sync ratio */
  syncRatio: number;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_OSCILLATOR_PARAMS: WavetableOscillatorParams = {
  frequency: 440,
  detune: 0,
  framePosition: 0,
  gain: 1,
  pan: 0,
  interpolation: 'linear',
  frameInterpolation: 'linear',
  phaseOffset: 0,
  useMipMap: true,
  formantPreserve: 0,
};

export const DEFAULT_MODULATION: WavetableModulation = {
  fmDepth: 0,
  fmRatio: 1,
  rmDepth: 0,
  amDepth: 0,
  sync: false,
  syncRatio: 1,
};

// ============================================================================
// WAVETABLE GENERATION
// ============================================================================

/**
 * Generate a basic waveform as a single-frame wavetable.
 */
export function generateBasicWaveform(
  waveform: 'sine' | 'saw' | 'square' | 'triangle' | 'pulse25' | 'pulse10',
  frameSize: number = DEFAULT_FRAME_SIZE
): Float32Array {
  const samples = new Float32Array(frameSize);
  
  switch (waveform) {
    case 'sine':
      for (let i = 0; i < frameSize; i++) {
        samples[i] = Math.sin((i / frameSize) * Math.PI * 2);
      }
      break;
      
    case 'saw':
      // Bandlimited saw using additive synthesis
      for (let i = 0; i < frameSize; i++) {
        let sample = 0;
        const phase = i / frameSize;
        // Add harmonics up to Nyquist (approximation)
        for (let h = 1; h <= Math.min(64, frameSize / 4); h++) {
          sample += Math.sin(phase * Math.PI * 2 * h) / h;
        }
        samples[i] = sample * (2 / Math.PI);
      }
      break;
      
    case 'square':
      // Bandlimited square using odd harmonics
      for (let i = 0; i < frameSize; i++) {
        let sample = 0;
        const phase = i / frameSize;
        for (let h = 1; h <= Math.min(63, frameSize / 4); h += 2) {
          sample += Math.sin(phase * Math.PI * 2 * h) / h;
        }
        samples[i] = sample * (4 / Math.PI);
      }
      break;
      
    case 'triangle':
      // Bandlimited triangle using odd harmonics with alternating signs
      for (let i = 0; i < frameSize; i++) {
        let sample = 0;
        const phase = i / frameSize;
        for (let h = 1, sign = 1; h <= Math.min(63, frameSize / 4); h += 2, sign *= -1) {
          sample += sign * Math.sin(phase * Math.PI * 2 * h) / (h * h);
        }
        samples[i] = sample * (8 / (Math.PI * Math.PI));
      }
      break;
      
    case 'pulse25':
      // 25% duty cycle pulse
      for (let i = 0; i < frameSize; i++) {
        const phase = i / frameSize;
        samples[i] = phase < 0.25 ? 1 : -1;
      }
      break;
      
    case 'pulse10':
      // 10% duty cycle pulse
      for (let i = 0; i < frameSize; i++) {
        const phase = i / frameSize;
        samples[i] = phase < 0.1 ? 1 : -1;
      }
      break;
  }
  
  return samples;
}

/**
 * Generate a wavetable from harmonic specification.
 */
export function generateFromHarmonics(
  harmonics: number[],
  phases?: number[],
  frameSize: number = DEFAULT_FRAME_SIZE
): Float32Array {
  const samples = new Float32Array(frameSize);
  
  for (let i = 0; i < frameSize; i++) {
    let sample = 0;
    const t = i / frameSize;
    
    for (let h = 0; h < harmonics.length; h++) {
      const amp = harmonics[h] ?? 0;
      const phase = phases?.[h] ?? 0;
      sample += amp * Math.sin((t * (h + 1) * Math.PI * 2) + phase);
    }
    
    samples[i] = sample;
  }
  
  // Normalize
  let maxAbs = 0;
  for (let i = 0; i < frameSize; i++) {
    maxAbs = Math.max(maxAbs, Math.abs(samples[i]!));
  }
  if (maxAbs > 0) {
    for (let i = 0; i < frameSize; i++) {
      samples[i]! /= maxAbs;
    }
  }
  
  return samples;
}

/**
 * Generate a wavetable by morphing between two waveforms.
 */
export function generateMorphTable(
  startWaveform: Float32Array,
  endWaveform: Float32Array,
  frameCount: number,
  frameSize: number = DEFAULT_FRAME_SIZE
): Wavetable {
  const frames: WavetableFrame[] = [];
  
  for (let f = 0; f < frameCount; f++) {
    const t = frameCount > 1 ? f / (frameCount - 1) : 0;
    const samples = new Float32Array(frameSize);
    
    for (let i = 0; i < frameSize; i++) {
      // Resample if needed
      const startIdx = (i / frameSize) * startWaveform.length;
      const endIdx = (i / frameSize) * endWaveform.length;
      
      const startSample = interpolateSample(startWaveform, startIdx, 'linear');
      const endSample = interpolateSample(endWaveform, endIdx, 'linear');
      
      samples[i] = startSample * (1 - t) + endSample * t;
    }
    
    frames.push({
      samples,
      index: f,
      name: `Frame ${f + 1}`,
    });
  }
  
  return {
    id: `morph-${Date.now()}`,
    name: 'Morph Table',
    frames,
    frameSize,
    frameCount,
  };
}

/**
 * Generate PWM (pulse width modulation) wavetable.
 */
export function generatePWMTable(
  frameCount: number = 64,
  frameSize: number = DEFAULT_FRAME_SIZE
): Wavetable {
  const frames: WavetableFrame[] = [];
  
  for (let f = 0; f < frameCount; f++) {
    // Pulse width from 5% to 95%
    const pulseWidth = 0.05 + (f / (frameCount - 1)) * 0.9;
    const samples = new Float32Array(frameSize);
    
    // Bandlimited pulse using additive synthesis
    for (let i = 0; i < frameSize; i++) {
      let sample = 0;
      const phase = i / frameSize;
      
      // DC offset for pulse
      sample = pulseWidth * 2 - 1;
      
      // Add harmonics
      for (let h = 1; h <= Math.min(64, frameSize / 4); h++) {
        const harmAmp = (2 / (h * Math.PI)) * Math.sin(h * Math.PI * pulseWidth);
        sample += harmAmp * Math.cos(phase * Math.PI * 2 * h);
      }
      
      samples[i] = sample;
    }
    
    // Normalize
    let maxAbs = 0;
    for (let i = 0; i < frameSize; i++) {
      maxAbs = Math.max(maxAbs, Math.abs(samples[i]!));
    }
    if (maxAbs > 0) {
      for (let i = 0; i < frameSize; i++) {
        samples[i]! /= maxAbs;
      }
    }
    
    frames.push({
      samples,
      index: f,
      name: `PW ${Math.round(pulseWidth * 100)}%`,
    });
  }
  
  return {
    id: 'pwm-table',
    name: 'PWM',
    frames,
    frameSize,
    frameCount,
    category: 'Basic',
    tags: ['pwm', 'pulse', 'classic'],
  };
}

/**
 * Generate a supersaw-style wavetable with varying detune.
 */
export function generateSupersawTable(
  frameCount: number = 64,
  frameSize: number = DEFAULT_FRAME_SIZE,
  voiceCount: number = 7
): Wavetable {
  const frames: WavetableFrame[] = [];
  
  for (let f = 0; f < frameCount; f++) {
    // Detune spread from 0 to 50 cents
    const maxDetune = (f / (frameCount - 1)) * 50;
    const samples = new Float32Array(frameSize);
    
    for (let i = 0; i < frameSize; i++) {
      let sample = 0;
      
      for (let v = 0; v < voiceCount; v++) {
        // Spread voices evenly across detune range
        const detuneCents = ((v - (voiceCount - 1) / 2) / ((voiceCount - 1) / 2)) * maxDetune;
        const detuneRatio = Math.pow(2, detuneCents / 1200);
        
        // Generate saw wave at this detuned frequency
        const phase = ((i / frameSize) * detuneRatio) % 1;
        const sawSample = phase * 2 - 1;
        
        sample += sawSample / voiceCount;
      }
      
      samples[i] = sample;
    }
    
    frames.push({
      samples,
      index: f,
      name: `Detune ${Math.round(maxDetune)}¢`,
    });
  }
  
  return {
    id: 'supersaw-table',
    name: 'Supersaw',
    frames,
    frameSize,
    frameCount,
    category: 'Basic',
    tags: ['supersaw', 'trance', 'detuned'],
  };
}

/**
 * Generate formant wavetable (vowel-like sounds).
 */
export function generateFormantTable(
  frameSize: number = DEFAULT_FRAME_SIZE
): Wavetable {
  // Vowel formant frequencies (F1, F2, F3)
  const vowels: Record<string, [number, number, number]> = {
    'A': [730, 1090, 2440],
    'E': [530, 1840, 2480],
    'I': [390, 1990, 2550],
    'O': [570, 840, 2410],
    'U': [440, 1020, 2240],
  };
  
  const vowelNames = Object.keys(vowels);
  const frames: WavetableFrame[] = [];
  
  for (let v = 0; v < vowelNames.length; v++) {
    const vowel = vowelNames[v]!;
    const formants = vowels[vowel]!;
    const samples = new Float32Array(frameSize);
    
    // Generate using additive synthesis targeting formant frequencies
    const baseFreq = 100; // Assume base frequency for formant calculation
    
    for (let i = 0; i < frameSize; i++) {
      let sample = 0;
      const t = i / frameSize;
      
      // Generate harmonics with formant envelope
      for (let h = 1; h <= 64; h++) {
        const freq = h * baseFreq;
        
        // Calculate formant envelope
        let formantGain = 0;
        for (const f of formants) {
          const distance = Math.abs(freq - f);
          const bandwidth = f * 0.1; // 10% bandwidth
          formantGain += Math.exp(-(distance * distance) / (2 * bandwidth * bandwidth));
        }
        
        sample += formantGain * Math.sin(t * h * Math.PI * 2) / h;
      }
      
      samples[i] = sample;
    }
    
    // Normalize
    let maxAbs = 0;
    for (let i = 0; i < frameSize; i++) {
      maxAbs = Math.max(maxAbs, Math.abs(samples[i]!));
    }
    if (maxAbs > 0) {
      for (let i = 0; i < frameSize; i++) {
        samples[i]! /= maxAbs;
      }
    }
    
    frames.push({
      samples,
      index: v,
      name: `Vowel ${vowel}`,
    });
  }
  
  return {
    id: 'formant-table',
    name: 'Vowels',
    frames,
    frameSize,
    frameCount: frames.length,
    category: 'Vocal',
    tags: ['formant', 'vowel', 'vocal'],
  };
}

// ============================================================================
// INTERPOLATION
// ============================================================================

/**
 * Interpolate a sample from an array at a fractional index.
 */
export function interpolateSample(
  samples: Float32Array,
  index: number,
  mode: InterpolationMode
): number {
  const len = samples.length;
  const i0 = Math.floor(index) % len;
  
  if (mode === 'none') {
    return samples[i0] ?? 0;
  }
  
  const frac = index - Math.floor(index);
  const i1 = (i0 + 1) % len;
  
  if (mode === 'linear') {
    return (samples[i0] ?? 0) * (1 - frac) + (samples[i1] ?? 0) * frac;
  }
  
  if (mode === 'cubic') {
    const im1 = (i0 - 1 + len) % len;
    const i2 = (i0 + 2) % len;
    
    const y0 = samples[im1] ?? 0;
    const y1 = samples[i0] ?? 0;
    const y2 = samples[i1] ?? 0;
    const y3 = samples[i2] ?? 0;
    
    // Cubic Hermite interpolation
    const c0 = y1;
    const c1 = 0.5 * (y2 - y0);
    const c2 = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3;
    const c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);
    
    return ((c3 * frac + c2) * frac + c1) * frac + c0;
  }
  
  if (mode === 'sinc') {
    // 8-point sinc interpolation
    let result = 0;
    const sincLength = 4;
    
    for (let j = -sincLength + 1; j <= sincLength; j++) {
      const idx = (i0 + j + len) % len;
      const x = frac - j;
      
      // Sinc function with Blackman window
      let sincVal: number;
      if (Math.abs(x) < 0.0001) {
        sincVal = 1;
      } else {
        sincVal = Math.sin(Math.PI * x) / (Math.PI * x);
        // Blackman window
        const windowPos = (x + sincLength) / (2 * sincLength);
        sincVal *= 0.42 - 0.5 * Math.cos(2 * Math.PI * windowPos) + 
                   0.08 * Math.cos(4 * Math.PI * windowPos);
      }
      
      result += (samples[idx] ?? 0) * sincVal;
    }
    
    return result;
  }
  
  return samples[i0] ?? 0;
}

/**
 * Interpolate between wavetable frames.
 */
export function interpolateFrame(
  wavetable: Wavetable,
  framePosition: number,
  sampleIndex: number,
  frameInterpolation: FrameInterpolation,
  sampleInterpolation: InterpolationMode
): number {
  const { frames, frameCount } = wavetable;
  
  if (frameCount === 0) return 0;
  if (frameCount === 1) {
    return interpolateSample(frames[0]!.samples, sampleIndex, sampleInterpolation);
  }
  
  // Normalize frame position to 0-(frameCount-1)
  const pos = framePosition * (frameCount - 1);
  const f0 = Math.floor(pos);
  const frac = pos - f0;
  
  // Clamp to valid range
  const f0Clamped = Math.max(0, Math.min(frameCount - 1, f0));
  const f1Clamped = Math.max(0, Math.min(frameCount - 1, f0 + 1));
  
  if (frameInterpolation === 'none' || frac === 0) {
    return interpolateSample(frames[f0Clamped]!.samples, sampleIndex, sampleInterpolation);
  }
  
  const sample0 = interpolateSample(frames[f0Clamped]!.samples, sampleIndex, sampleInterpolation);
  const sample1 = interpolateSample(frames[f1Clamped]!.samples, sampleIndex, sampleInterpolation);
  
  if (frameInterpolation === 'linear') {
    return sample0 * (1 - frac) + sample1 * frac;
  }
  
  if (frameInterpolation === 'cubic') {
    const fm1 = Math.max(0, f0 - 1);
    const f2 = Math.min(frameCount - 1, f0 + 2);
    
    const y0 = interpolateSample(frames[fm1]!.samples, sampleIndex, sampleInterpolation);
    const y1 = sample0;
    const y2 = sample1;
    const y3 = interpolateSample(frames[f2]!.samples, sampleIndex, sampleInterpolation);
    
    // Cubic Hermite
    const c0 = y1;
    const c1 = 0.5 * (y2 - y0);
    const c2 = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3;
    const c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);
    
    return ((c3 * frac + c2) * frac + c1) * frac + c0;
  }
  
  // Spectral interpolation would require FFT - fall back to linear
  return sample0 * (1 - frac) + sample1 * frac;
}

// ============================================================================
// MIP-MAPPING FOR ANTI-ALIASING
// ============================================================================

/**
 * Generate MIP-mapped versions of a frame for anti-aliased playback.
 */
export function generateMipMaps(
  frame: Float32Array,
  sampleRate: number = 48000
): MipMappedWavetable {
  const levels: Float32Array[] = [frame];
  const thresholds: number[] = [sampleRate / 2]; // Nyquist
  
  let currentFrame = frame;
  let currentThreshold = sampleRate / 4;
  
  while (currentFrame.length > MIN_FRAME_SIZE && levels.length < MIP_LEVELS) {
    // Low-pass filter and downsample by 2
    const newSize = currentFrame.length / 2;
    const newFrame = new Float32Array(newSize);
    
    for (let i = 0; i < newSize; i++) {
      // Simple averaging filter (2-tap)
      const i2 = i * 2;
      newFrame[i] = (currentFrame[i2]! + currentFrame[i2 + 1]!) / 2;
    }
    
    levels.push(newFrame);
    thresholds.push(currentThreshold);
    
    currentFrame = newFrame;
    currentThreshold /= 2;
  }
  
  return { levels, thresholds };
}

/**
 * Generate MIP-maps for an entire wavetable.
 */
export function generateWavetableMipMaps(
  wavetable: Wavetable,
  sampleRate: number = 48000
): Wavetable {
  const mipMaps: MipMappedWavetable[] = [];
  
  for (const frame of wavetable.frames) {
    mipMaps.push(generateMipMaps(frame.samples, sampleRate));
  }
  
  return {
    ...wavetable,
    hasMipMaps: true,
    mipMaps,
    sampleRate,
  };
}

/**
 * Select the appropriate MIP level for a given frequency.
 */
export function selectMipLevel(
  mipMap: MipMappedWavetable,
  frequency: number,
  sampleRate: number
): number {
  const nyquist = sampleRate / 2;
  const harmonicsNeeded = nyquist / frequency;
  
  for (let level = 0; level < mipMap.levels.length; level++) {
    const frameSize = mipMap.levels[level]!.length;
    // Each level can represent fewer harmonics
    if (frameSize / 2 <= harmonicsNeeded || level === mipMap.levels.length - 1) {
      return level;
    }
  }
  
  return 0;
}

/**
 * Read a sample from a MIP-mapped frame with automatic level selection.
 */
export function readMipMappedSample(
  mipMap: MipMappedWavetable,
  phase: number,
  frequency: number,
  sampleRate: number,
  interpolation: InterpolationMode
): number {
  const level = selectMipLevel(mipMap, frequency, sampleRate);
  const frame = mipMap.levels[level]!;
  const sampleIndex = phase * frame.length;
  
  return interpolateSample(frame, sampleIndex, interpolation);
}

// ============================================================================
// WAVETABLE OSCILLATOR
// ============================================================================

/**
 * Create initial oscillator state.
 */
export function createOscillatorState(): WavetableOscillatorState {
  return {
    phase: 0,
    framePosition: 0,
    frequency: 440,
    detune: 0,
    phaseIncrement: 0,
  };
}

/**
 * Process a single sample from a wavetable oscillator.
 */
export function processWavetableOscillator(
  wavetable: Wavetable,
  state: WavetableOscillatorState,
  params: WavetableOscillatorParams,
  sampleRate: number
): number {
  if (wavetable.frameCount === 0) return 0;
  
  // Calculate actual frequency with detune
  const detuneRatio = Math.pow(2, params.detune / 1200);
  const actualFrequency = params.frequency * detuneRatio;
  
  // Update state
  state.frequency = params.frequency;
  state.detune = params.detune;
  state.phaseIncrement = actualFrequency / sampleRate;
  state.framePosition = params.framePosition;
  
  // Calculate sample index
  const sampleIndex = (state.phase + params.phaseOffset) * wavetable.frameSize;
  
  // Read sample with or without MIP-mapping
  let sample: number;
  
  if (params.useMipMap && wavetable.hasMipMaps && wavetable.mipMaps) {
    // Interpolate between MIP-mapped frames
    const pos = params.framePosition * (wavetable.frameCount - 1);
    const f0 = Math.floor(pos);
    const frac = pos - f0;
    const f0Clamped = Math.max(0, Math.min(wavetable.frameCount - 1, f0));
    const f1Clamped = Math.max(0, Math.min(wavetable.frameCount - 1, f0 + 1));
    
    const s0 = readMipMappedSample(
      wavetable.mipMaps[f0Clamped]!,
      state.phase + params.phaseOffset,
      actualFrequency,
      sampleRate,
      params.interpolation
    );
    
    if (frac > 0 && f0Clamped !== f1Clamped) {
      const s1 = readMipMappedSample(
        wavetable.mipMaps[f1Clamped]!,
        state.phase + params.phaseOffset,
        actualFrequency,
        sampleRate,
        params.interpolation
      );
      sample = s0 * (1 - frac) + s1 * frac;
    } else {
      sample = s0;
    }
  } else {
    sample = interpolateFrame(
      wavetable,
      params.framePosition,
      sampleIndex,
      params.frameInterpolation,
      params.interpolation
    );
  }
  
  // Advance phase
  state.phase += state.phaseIncrement;
  if (state.phase >= 1) {
    state.phase -= 1;
  }
  
  return sample * params.gain;
}

/**
 * Process a block of samples from a wavetable oscillator.
 */
export function processWavetableBlock(
  wavetable: Wavetable,
  state: WavetableOscillatorState,
  params: WavetableOscillatorParams,
  output: Float32Array,
  sampleRate: number,
  framePositionMod?: Float32Array
): void {
  const blockSize = output.length;
  
  for (let i = 0; i < blockSize; i++) {
    // Apply frame position modulation if provided
    const effectiveParams = framePositionMod
      ? { ...params, framePosition: Math.max(0, Math.min(1, params.framePosition + framePositionMod[i]!)) }
      : params;
    
    output[i] = processWavetableOscillator(wavetable, state, effectiveParams, sampleRate);
  }
}

// ============================================================================
// WAVETABLE MODULATION (FM/RM/AM)
// ============================================================================

/**
 * Apply FM between two wavetable oscillators.
 */
export function applyFM(
  carrierPhase: number,
  modulatorOutput: number,
  fmDepth: number,
  fmRatio: number
): number {
  return carrierPhase + modulatorOutput * fmDepth * fmRatio;
}

/**
 * Apply ring modulation between two oscillator outputs.
 */
export function applyRM(
  carrier: number,
  modulator: number,
  rmDepth: number
): number {
  const rm = carrier * modulator;
  return carrier * (1 - rmDepth) + rm * rmDepth;
}

/**
 * Apply amplitude modulation.
 */
export function applyAM(
  carrier: number,
  modulator: number,
  amDepth: number
): number {
  const modAmount = (modulator + 1) * 0.5; // Convert to unipolar
  return carrier * (1 - amDepth + amDepth * modAmount);
}

/**
 * Apply hard sync between oscillators.
 */
export function applySync(
  slaveState: WavetableOscillatorState,
  masterPhase: number,
  previousMasterPhase: number
): void {
  // Detect master zero-crossing
  if (masterPhase < previousMasterPhase) {
    slaveState.phase = 0;
  }
}

// ============================================================================
// WAVETABLE UTILITIES
// ============================================================================

/**
 * Create an empty wavetable with the specified frame count.
 */
export function createEmptyWavetable(
  frameCount: number,
  frameSize: number = DEFAULT_FRAME_SIZE,
  name: string = 'Empty'
): Wavetable {
  const frames: WavetableFrame[] = [];
  
  for (let i = 0; i < frameCount; i++) {
    frames.push({
      samples: new Float32Array(frameSize),
      index: i,
    });
  }
  
  return {
    id: `empty-${Date.now()}`,
    name,
    frames,
    frameSize,
    frameCount,
  };
}

/**
 * Create a wavetable from a single waveform.
 */
export function createSingleFrameWavetable(
  samples: Float32Array,
  name: string = 'Single'
): Wavetable {
  return {
    id: `single-${Date.now()}`,
    name,
    frames: [{
      samples,
      index: 0,
    }],
    frameSize: samples.length,
    frameCount: 1,
  };
}

/**
 * Normalize all frames in a wavetable to -1 to 1 range.
 */
export function normalizeWavetable(wavetable: Wavetable): Wavetable {
  const normalizedFrames: WavetableFrame[] = [];
  
  // Find global max
  let globalMax = 0;
  for (const frame of wavetable.frames) {
    for (let i = 0; i < frame.samples.length; i++) {
      globalMax = Math.max(globalMax, Math.abs(frame.samples[i]!));
    }
  }
  
  if (globalMax === 0) globalMax = 1;
  
  for (const frame of wavetable.frames) {
    const normalized = new Float32Array(frame.samples.length);
    for (let i = 0; i < frame.samples.length; i++) {
      normalized[i] = frame.samples[i]! / globalMax;
    }
    normalizedFrames.push({
      ...frame,
      samples: normalized,
    });
  }
  
  return {
    ...wavetable,
    frames: normalizedFrames,
  };
}

/**
 * Resample a wavetable to a different frame size.
 */
export function resampleWavetable(
  wavetable: Wavetable,
  newFrameSize: number
): Wavetable {
  const resampledFrames: WavetableFrame[] = [];
  
  for (const frame of wavetable.frames) {
    const newSamples = new Float32Array(newFrameSize);
    
    for (let i = 0; i < newFrameSize; i++) {
      const sourceIndex = (i / newFrameSize) * frame.samples.length;
      newSamples[i] = interpolateSample(frame.samples, sourceIndex, 'cubic');
    }
    
    resampledFrames.push({
      ...frame,
      samples: newSamples,
    });
  }
  
  return {
    ...wavetable,
    frames: resampledFrames,
    frameSize: newFrameSize,
  };
}

/**
 * Extract harmonics from a frame using DFT.
 */
export function analyzeHarmonics(
  frame: Float32Array,
  maxHarmonics: number = 64
): { amplitudes: number[]; phases: number[] } {
  const N = frame.length;
  const amplitudes: number[] = [];
  const phases: number[] = [];
  
  for (let k = 1; k <= maxHarmonics; k++) {
    let real = 0;
    let imag = 0;
    
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      real += frame[n]! * Math.cos(angle);
      imag -= frame[n]! * Math.sin(angle);
    }
    
    real /= N / 2;
    imag /= N / 2;
    
    amplitudes.push(Math.sqrt(real * real + imag * imag));
    phases.push(Math.atan2(imag, real));
  }
  
  return { amplitudes, phases };
}

/**
 * Get wavetable info as a string.
 */
export function getWavetableInfo(wavetable: Wavetable): string {
  return `Wavetable: ${wavetable.name}
  ID: ${wavetable.id}
  Frames: ${wavetable.frameCount}
  Frame Size: ${wavetable.frameSize}
  MIP-mapped: ${wavetable.hasMipMaps ? 'Yes' : 'No'}
  Category: ${wavetable.category ?? 'None'}
  Tags: ${wavetable.tags?.join(', ') ?? 'None'}`;
}

// ============================================================================
// FACTORY WAVETABLES
// ============================================================================

/**
 * Create a factory set of basic wavetables.
 */
export function createFactoryWavetables(): Wavetable[] {
  return [
    // Basic waveforms as single-frame wavetables
    createSingleFrameWavetable(generateBasicWaveform('sine'), 'Sine'),
    createSingleFrameWavetable(generateBasicWaveform('saw'), 'Saw'),
    createSingleFrameWavetable(generateBasicWaveform('square'), 'Square'),
    createSingleFrameWavetable(generateBasicWaveform('triangle'), 'Triangle'),
    
    // Morphing wavetables
    generateMorphTable(
      generateBasicWaveform('sine'),
      generateBasicWaveform('saw'),
      64
    ),
    generateMorphTable(
      generateBasicWaveform('triangle'),
      generateBasicWaveform('square'),
      64
    ),
    
    // Special wavetables
    generatePWMTable(),
    generateSupersawTable(),
    generateFormantTable(),
  ];
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Constants
  DEFAULT_FRAME_SIZE,
  MIN_FRAME_SIZE,
  MAX_FRAME_SIZE,
  MAX_FRAMES,
  MIP_LEVELS,
  
  // Defaults
  DEFAULT_OSCILLATOR_PARAMS,
  DEFAULT_MODULATION,
  
  // Generation
  generateBasicWaveform,
  generateFromHarmonics,
  generateMorphTable,
  generatePWMTable,
  generateSupersawTable,
  generateFormantTable,
  
  // Interpolation
  interpolateSample,
  interpolateFrame,
  
  // MIP-mapping
  generateMipMaps,
  generateWavetableMipMaps,
  selectMipLevel,
  readMipMappedSample,
  
  // Oscillator
  createOscillatorState,
  processWavetableOscillator,
  processWavetableBlock,
  
  // Modulation
  applyFM,
  applyRM,
  applyAM,
  applySync,
  
  // Utilities
  createEmptyWavetable,
  createSingleFrameWavetable,
  normalizeWavetable,
  resampleWavetable,
  analyzeHarmonics,
  getWavetableInfo,
  createFactoryWavetables,
};
