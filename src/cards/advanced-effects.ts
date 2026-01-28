/**
 * @fileoverview Advanced Effect Cards - Professional audio processing.
 * 
 * This module provides advanced effect cards including:
 * - ConvolutionCard: Impulse response-based reverb and spaces
 * - GranularCard: Grain-based processing with freeze/scatter
 * - SpectralCard: FFT-based spectral effects
 * - VocoderCard: Carrier/modulator vocoding
 * - MultibandCard: Multi-band processing (3/4 bands)
 * - SaturatorCard: Harmonic saturation and warmth
 * 
 * @module @cardplay/cards/advanced-effects
 */

import type { Event } from '../types/event';
import type { NotePayload, Pitch } from '../voices/voice';
import type { Card, CardMeta, CardSignature, CardContext, CardResult } from './card';
import { PortTypes } from './card';

// ============================================================================
// CONVOLUTION CARD - IR REVERB
// ============================================================================

/**
 * Impulse response data structure.
 */
export interface ImpulseResponse {
  /** Display name */
  readonly name: string;
  /** Audio buffer data (interleaved L/R) */
  readonly buffer: Float32Array;
  /** Sample rate */
  readonly sampleRate: number;
  /** Number of channels (1=mono, 2=stereo) */
  readonly channels: 1 | 2;
  /** Length in samples */
  readonly length: number;
  /** Metadata */
  readonly metadata?: {
    readonly category?: 'room' | 'hall' | 'chamber' | 'church' | 'plate' | 'spring' | 'creative';
    readonly duration?: number; // RT60 decay time in seconds
    readonly source?: string;
  };
}

/**
 * Built-in impulse responses (placeholder - would load from assets).
 */
export const BUILTIN_IMPULSES: Record<string, ImpulseResponse> = {
  'small-room': {
    name: 'Small Room',
    buffer: new Float32Array(48000), // Placeholder
    sampleRate: 48000,
    channels: 2,
    length: 48000,
    metadata: { category: 'room', duration: 0.3 },
  },
  'large-hall': {
    name: 'Large Hall',
    buffer: new Float32Array(144000), // Placeholder
    sampleRate: 48000,
    channels: 2,
    length: 144000,
    metadata: { category: 'hall', duration: 2.5 },
  },
  'plate': {
    name: 'Plate Reverb',
    buffer: new Float32Array(96000), // Placeholder
    sampleRate: 48000,
    channels: 2,
    length: 96000,
    metadata: { category: 'plate', duration: 1.5 },
  },
};

/**
 * Convolution card state.
 */
export interface ConvolutionState {
  /** Currently loaded IR */
  impulseResponse: ImpulseResponse | null;
  /** Wet/dry mix (0=dry, 1=wet) */
  wetDry: number;
  /** Pre-delay in ms */
  preDelay: number;
  /** Decay multiplier (0.1-2.0) */
  decay: number;
  /** High-frequency damping (0-1) */
  damping: number;
  /** Input gain */
  inputGain: number;
  /** Output gain */
  outputGain: number;
  /** Whether card is bypassed */
  bypassed: boolean;
}

/**
 * Default convolution state.
 */
export const DEFAULT_CONVOLUTION_STATE: ConvolutionState = {
  impulseResponse: BUILTIN_IMPULSES['small-room'] ?? null,
  wetDry: 0.3,
  preDelay: 0,
  decay: 1.0,
  damping: 0.5,
  inputGain: 1.0,
  outputGain: 1.0,
  bypassed: false,
};

/**
 * Loads an impulse response from a URL or file.
 */
export async function loadImpulseResponse(url: string): Promise<ImpulseResponse> {
  // In a real implementation, this would decode audio file
  // For now, return a placeholder
  return {
    name: url.split('/').pop() || 'Custom IR',
    buffer: new Float32Array(48000),
    sampleRate: 48000,
    channels: 2,
    length: 48000,
  };
}

/**
 * Creates a convolution reverb card.
 */
export function createConvolutionCard<E extends Event<NotePayload<Pitch>>>(
  meta: CardMeta
): Card<readonly E[], readonly E[]> {
  const state: ConvolutionState = { ...DEFAULT_CONVOLUTION_STATE };

  return {
    meta,
    signature: {
      inputs: [
        { name: 'audio', type: PortTypes.AUDIO, optional: false },
        { name: 'sidechain', type: PortTypes.AUDIO, optional: true },
      ],
      outputs: [
        { name: 'audio', type: PortTypes.AUDIO, optional: false },
      ],
      params: [],
    } as CardSignature,
    process: (input: readonly E[], _context: CardContext): CardResult<readonly E[]> => {
      // In a real implementation, this would:
      // 1. Apply pre-delay
      // 2. Convolve input with IR using partitioned convolution
      // 3. Apply damping filter to wet signal
      // 4. Mix wet/dry based on wetDry parameter
      // 5. Apply output gain
      
      // For now, pass through (actual convolution happens in audio engine)
      return {
        output: input,
        state: { value: state, version: 0 },
      };
    },
  };
}

// ============================================================================
// GRANULAR CARD - GRAIN PROCESSING
// ============================================================================

/**
 * Grain synthesis mode.
 */
export type GrainMode = 'normal' | 'freeze' | 'scatter' | 'reverse' | 'random';

/**
 * Granular card state.
 */
export interface GranularState {
  /** Grain size in ms */
  grainSize: number;
  /** Grain density (grains/sec) */
  density: number;
  /** Pitch shift (semitones) */
  pitch: number;
  /** Time stretch factor */
  timeStretch: number;
  /** Random pitch variation (cents) */
  pitchVariation: number;
  /** Random position variation (ms) */
  positionVariation: number;
  /** Grain envelope shape (0=rectangular, 1=triangular, 2=gaussian) */
  envelopeShape: number;
  /** Processing mode */
  mode: GrainMode;
  /** Freeze position (for freeze mode) */
  freezePosition: number;
  /** Stereo spread (0-1) */
  stereoSpread: number;
  /** Wet/dry mix */
  wetDry: number;
  /** Whether card is bypassed */
  bypassed: boolean;
}

/**
 * Default granular state.
 */
export const DEFAULT_GRANULAR_STATE: GranularState = {
  grainSize: 100,
  density: 20,
  pitch: 0,
  timeStretch: 1.0,
  pitchVariation: 0,
  positionVariation: 0,
  envelopeShape: 2, // Gaussian
  mode: 'normal',
  freezePosition: 0,
  stereoSpread: 0.5,
  wetDry: 1.0,
  bypassed: false,
};

/**
 * Creates a granular processing card.
 */
export function createGranularCard<E extends Event<NotePayload<Pitch>>>(
  meta: CardMeta
): Card<readonly E[], readonly E[]> {
  const state: GranularState = { ...DEFAULT_GRANULAR_STATE };

  return {
    meta,
    signature: {
      inputs: [
        { name: 'audio', type: PortTypes.AUDIO, optional: false },
      ],
      outputs: [
        { name: 'audio', type: PortTypes.AUDIO, optional: false },
      ],
      params: [],
    } as CardSignature,
    process: (input: readonly E[], _context: CardContext): CardResult<readonly E[]> => {
      // In a real implementation, this would:
      // 1. Extract grains from input buffer at density rate
      // 2. Apply envelope shape to each grain
      // 3. Pitch shift grains using resampling or FFT
      // 4. Position grains with time stretch
      // 5. Add randomization for variation
      // 6. Handle freeze mode (repeat same grain)
      // 7. Apply stereo spread
      // 8. Mix wet/dry
      
      // For now, pass through
      return {
        output: input,
        state: { value: state, version: 0 },
      };
    },
  };
}

// ============================================================================
// SPECTRAL CARD - FFT EFFECTS
// ============================================================================

/**
 * Spectral processing mode.
 */
export type SpectralMode = 
  | 'freeze'      // Freeze spectrum
  | 'blur'        // Smear frequencies
  | 'shift'       // Frequency shift
  | 'stretch'     // Spectral stretch
  | 'filter'      // Spectral filter
  | 'morph'       // Morph between states
  | 'gate'        // Spectral gate
  | 'exciter';    // Harmonic exciter

/**
 * Spectral card state.
 */
export interface SpectralState {
  /** Processing mode */
  mode: SpectralMode;
  /** FFT size (512, 1024, 2048, 4096, 8192) */
  fftSize: number;
  /** Window overlap (0.25, 0.5, 0.75) */
  overlap: number;
  /** Mode-specific amount (0-1) */
  amount: number;
  /** Frequency shift (Hz) - for shift mode */
  frequencyShift: number;
  /** Blur kernel size - for blur mode */
  blurSize: number;
  /** Gate threshold (dB) - for gate mode */
  gateThreshold: number;
  /** Freeze hold - for freeze mode */
  freezeHold: boolean;
  /** Wet/dry mix */
  wetDry: number;
  /** Whether card is bypassed */
  bypassed: boolean;
}

/**
 * Default spectral state.
 */
export const DEFAULT_SPECTRAL_STATE: SpectralState = {
  mode: 'freeze',
  fftSize: 2048,
  overlap: 0.75,
  amount: 0.5,
  frequencyShift: 0,
  blurSize: 3,
  gateThreshold: -40,
  freezeHold: false,
  wetDry: 0.5,
  bypassed: false,
};

/**
 * Creates a spectral processing card.
 */
export function createSpectralCard<E extends Event<NotePayload<Pitch>>>(
  meta: CardMeta
): Card<readonly E[], readonly E[]> {
  const state: SpectralState = { ...DEFAULT_SPECTRAL_STATE };
  // Note: frozenSpectrum would be used in actual FFT implementation for freeze mode

  return {
    meta,
    signature: {
      inputs: [
        { name: 'audio', type: PortTypes.AUDIO, optional: false },
      ],
      outputs: [
        { name: 'audio', type: PortTypes.AUDIO, optional: false },
      ],
      params: [],
    } as CardSignature,
    process: (input: readonly E[], _context: CardContext): CardResult<readonly E[]> => {
      // In a real implementation, this would:
      // 1. Perform FFT on overlapping windows
      // 2. Convert to magnitude/phase representation
      // 3. Apply spectral processing based on mode:
      //    - freeze: Hold current magnitude spectrum
      //    - blur: Convolve magnitude with blur kernel
      //    - shift: Shift all frequencies by offset
      //    - stretch: Resample magnitude spectrum
      //    - filter: Apply spectral filter
      //    - gate: Zero magnitudes below threshold
      // 4. Reconstruct with phase vocoder
      // 5. Overlap-add to output
      // 6. Mix wet/dry
      
      return {
        output: input,
        state: { value: state, version: 0 },
      };
    },
  };
}

// ============================================================================
// VOCODER CARD - CARRIER/MODULATOR
// ============================================================================

/**
 * Vocoder card state.
 */
export interface VocoderState {
  /** Number of frequency bands (8, 16, 24, 32) */
  bands: number;
  /** Low frequency (Hz) */
  lowFreq: number;
  /** High frequency (Hz) */
  highFreq: number;
  /** Band spacing (linear, logarithmic) */
  bandSpacing: 'linear' | 'logarithmic';
  /** Envelope follower attack (ms) */
  attack: number;
  /** Envelope follower release (ms) */
  release: number;
  /** Formant shift (semitones) */
  formantShift: number;
  /** Q factor for bandpass filters */
  qFactor: number;
  /** Gate threshold (dB) */
  gateThreshold: number;
  /** Carrier/modulator mix */
  carrierModulatorMix: number;
  /** Output gain */
  outputGain: number;
  /** Whether card is bypassed */
  bypassed: boolean;
}

/**
 * Default vocoder state.
 */
export const DEFAULT_VOCODER_STATE: VocoderState = {
  bands: 16,
  lowFreq: 100,
  highFreq: 8000,
  bandSpacing: 'logarithmic',
  attack: 5,
  release: 50,
  formantShift: 0,
  qFactor: 10,
  gateThreshold: -60,
  carrierModulatorMix: 0.5,
  outputGain: 1.0,
  bypassed: false,
};

/**
 * Creates a vocoder card.
 */
export function createVocoderCard<E extends Event<NotePayload<Pitch>>>(
  meta: CardMeta
): Card<readonly E[], readonly E[]> {
  const state: VocoderState = { ...DEFAULT_VOCODER_STATE };

  return {
    meta,
    signature: {
      inputs: [
        { name: 'carrier', type: PortTypes.AUDIO, optional: false },
        { name: 'modulator', type: PortTypes.AUDIO, optional: false },
      ],
      outputs: [
        { name: 'audio', type: PortTypes.AUDIO, optional: false },
      ],
      params: [],
    } as CardSignature,
    process: (input: readonly E[], _context: CardContext): CardResult<readonly E[]> => {
      // In a real implementation, this would:
      // 1. Create bandpass filter bank (logarithmic spacing)
      // 2. Split carrier into frequency bands
      // 3. Split modulator into same frequency bands
      // 4. Extract envelope from each modulator band (rectify + lowpass)
      // 5. Apply modulator envelopes to carrier bands
      // 6. Sum all bands
      // 7. Apply gate, formant shift, output gain
      
      return {
        output: input,
        state: { value: state, version: 0 },
      };
    },
  };
}

// ============================================================================
// MULTIBAND CARD - SPLIT PROCESSING
// ============================================================================

/**
 * Multiband crossover type.
 */
export type CrossoverType = 'butterworth' | 'linkwitz-riley' | 'bessel';

/**
 * Multiband card state.
 */
export interface MultibandState {
  /** Number of bands (3 or 4) */
  bands: 3 | 4;
  /** Crossover frequencies (Hz) */
  crossovers: readonly number[];
  /** Crossover type */
  crossoverType: CrossoverType;
  /** Crossover slope (6, 12, 18, 24, 48 dB/oct) */
  crossoverSlope: number;
  /** Per-band gains (dB) */
  bandGains: readonly number[];
  /** Per-band solo states */
  bandSolos: readonly boolean[];
  /** Per-band mute states */
  bandMutes: readonly boolean[];
  /** Master output gain */
  outputGain: number;
  /** Whether card is bypassed */
  bypassed: boolean;
}

/**
 * Default multiband state (3-band).
 */
export const DEFAULT_MULTIBAND_STATE: MultibandState = {
  bands: 3,
  crossovers: [200, 2000],
  crossoverType: 'linkwitz-riley',
  crossoverSlope: 24,
  bandGains: [0, 0, 0],
  bandSolos: [false, false, false],
  bandMutes: [false, false, false],
  outputGain: 0,
  bypassed: false,
};

/**
 * Creates a multiband processing card.
 */
export function createMultibandCard<E extends Event<NotePayload<Pitch>>>(
  meta: CardMeta
): Card<readonly E[], readonly E[]> {
  const state: MultibandState = { ...DEFAULT_MULTIBAND_STATE };

  return {
    meta,
    signature: {
      inputs: [
        { name: 'audio', type: PortTypes.AUDIO, optional: false },
      ],
      outputs: [
        { name: 'audio', type: PortTypes.AUDIO, optional: false },
        { name: 'band1', type: PortTypes.AUDIO, optional: true },
        { name: 'band2', type: PortTypes.AUDIO, optional: true },
        { name: 'band3', type: PortTypes.AUDIO, optional: true },
        { name: 'band4', type: PortTypes.AUDIO, optional: true },
      ],
      params: [],
    } as CardSignature,
    process: (input: readonly E[], _context: CardContext): CardResult<readonly E[]> => {
      // In a real implementation, this would:
      // 1. Design complementary crossover filters
      // 2. Split input into frequency bands
      // 3. Apply per-band processing (gain, solo, mute)
      // 4. Sum bands to main output
      // 5. Provide individual band outputs for external processing
      // 6. Ensure phase-coherent reconstruction
      
      return {
        output: input,
        state: { value: state, version: 0 },
      };
    },
  };
}

// ============================================================================
// SATURATOR CARD - HARMONIC SATURATION
// ============================================================================

/**
 * Saturation curve type.
 */
export type SaturationCurve = 
  | 'soft-clip'     // Soft clipping
  | 'hard-clip'     // Hard clipping
  | 'tube'          // Tube-style warmth
  | 'tape'          // Tape saturation
  | 'transistor'    // Transistor distortion
  | 'foldback'      // Foldback distortion
  | 'asymmetric'    // Asymmetric clipping
  | 'waveshaper';   // Custom waveshaper

/**
 * Saturator card state.
 */
export interface SaturatorState {
  /** Saturation curve type */
  curve: SaturationCurve;
  /** Drive amount (dB) */
  drive: number;
  /** Bias (asymmetry) */
  bias: number;
  /** Pre-filter frequency (Hz) */
  preFilterFreq: number;
  /** Post-filter frequency (Hz) */
  postFilterFreq: number;
  /** Dry/wet mix */
  dryWet: number;
  /** Output gain (dB) */
  outputGain: number;
  /** Oversampling (1, 2, 4, 8x) */
  oversampling: number;
  /** Whether card is bypassed */
  bypassed: boolean;
}

/**
 * Default saturator state.
 */
export const DEFAULT_SATURATOR_STATE: SaturatorState = {
  curve: 'tube',
  drive: 0,
  bias: 0,
  preFilterFreq: 20000,
  postFilterFreq: 20000,
  dryWet: 1.0,
  outputGain: 0,
  oversampling: 2,
  bypassed: false,
};

/**
 * Saturation curve functions.
 */
export const SATURATION_CURVES: Record<SaturationCurve, (x: number, drive: number) => number> = {
  'soft-clip': (x, drive) => {
    const scaled = x * (1 + drive);
    return Math.tanh(scaled);
  },
  'hard-clip': (x, drive) => {
    const scaled = x * (1 + drive);
    return Math.max(-1, Math.min(1, scaled));
  },
  'tube': (x, drive) => {
    const scaled = x * (1 + drive * 2);
    // Tube-style asymmetric soft clipping
    if (scaled > 0) {
      return scaled / (1 + Math.abs(scaled));
    } else {
      return scaled / (1 + Math.abs(scaled) * 0.7);
    }
  },
  'tape': (x, drive) => {
    const scaled = x * (1 + drive);
    // Tape saturation (soft knee, compression)
    return Math.sign(scaled) * (1 - Math.exp(-Math.abs(scaled)));
  },
  'transistor': (x, drive) => {
    const scaled = x * (1 + drive * 3);
    // Transistor clipping (harder knee)
    const abs = Math.abs(scaled);
    if (abs < 0.33) return 2 * scaled;
    if (abs < 0.67) return Math.sign(scaled) * (3 - Math.pow(2 - 3 * abs, 2)) / 3;
    return Math.sign(scaled);
  },
  'foldback': (x, drive) => {
    const scaled = x * (1 + drive * 4);
    // Foldback distortion
    const abs = Math.abs(scaled);
    if (abs <= 1) return scaled;
    return Math.sign(scaled) * (2 - abs);
  },
  'asymmetric': (x, drive) => {
    const scaled = x * (1 + drive * 2);
    // Asymmetric clipping
    if (scaled > 0) {
      return Math.tanh(scaled * 1.5);
    } else {
      return Math.tanh(scaled * 0.5);
    }
  },
  'waveshaper': (x, drive) => {
    // Custom waveshaper (Chebyshev-like)
    const scaled = x * (1 + drive);
    return scaled * (1.5 - 0.5 * scaled * scaled);
  },
};

/**
 * Creates a saturator card.
 */
export function createSaturatorCard<E extends Event<NotePayload<Pitch>>>(
  meta: CardMeta
): Card<readonly E[], readonly E[]> {
  const state: SaturatorState = { ...DEFAULT_SATURATOR_STATE };

  return {
    meta,
    signature: {
      inputs: [
        { name: 'audio', type: PortTypes.AUDIO, optional: false },
      ],
      outputs: [
        { name: 'audio', type: PortTypes.AUDIO, optional: false },
      ],
      params: [],
    } as CardSignature,
    process: (input: readonly E[], _context: CardContext): CardResult<readonly E[]> => {
      // In a real implementation, this would:
      // 1. Upsample by oversampling factor
      // 2. Apply pre-filter (bandlimit)
      // 3. Add bias (DC offset for asymmetry)
      // 4. Apply saturation curve
      // 5. Remove bias
      // 6. Apply post-filter
      // 7. Downsample
      // 8. Mix dry/wet
      // 9. Apply output gain
      
      return {
        output: input,
        state: { value: state, version: 0 },
      };
    },
  };
}

// All exports are done inline with 'export function' declarations above.
