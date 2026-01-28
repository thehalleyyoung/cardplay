/**
 * @fileoverview Wavetable Effects Section - Surge-Compatible FX Chain
 * 
 * Implements comprehensive effects for wavetable synthesis:
 * - EQ (parametric, graphic)
 * - Distortion (tube, tape, digital, foldback)
 * - Modulation (chorus, phaser, flanger, rotary)
 * - Time-based (delay, reverb)
 * - Special (combulator, frequency shifter, vocoder)
 * - Master effects (compressor, limiter, stereo)
 * 
 * @module @cardplay/core/audio/wavetable-effects
 */

// ============================================================================
// EFFECT TYPES
// ============================================================================

/** Effect type enumeration */
export type WavetableEffectType =
  // EQ
  | 'eq_parametric'
  | 'eq_graphic'
  // Distortion
  | 'dist_tube'
  | 'dist_tape'
  | 'dist_digital'
  | 'dist_foldback'
  | 'waveshaper'
  // Modulation
  | 'chorus'
  | 'ensemble'
  | 'phaser'
  | 'flanger'
  | 'rotary'
  | 'tremolo'
  | 'vibrato'
  // Time-based
  | 'delay_stereo'
  | 'delay_pingpong'
  | 'delay_tape'
  | 'delay_ducking'
  | 'reverb_room'
  | 'reverb_hall'
  | 'reverb_plate'
  | 'reverb_spring'
  | 'reverb_shimmer'
  // Special
  | 'combulator'
  | 'freq_shifter'
  | 'ring_mod'
  | 'vocoder'
  | 'resonator'
  // Dynamics
  | 'compressor'
  | 'limiter'
  | 'gate'
  // Stereo
  | 'stereo_widener'
  | 'stereo_narrower'
  | 'mid_side';

/** Effect slot position */
export type EffectPosition = 'pre_filter' | 'post_filter' | 'post_amp' | 'global';

/** Effect slot */
export interface WavetableEffectSlot {
  id: string;
  type: WavetableEffectType;
  enabled: boolean;
  position: EffectPosition;
  mix: number;
  params: Record<string, number>;
}

// ============================================================================
// PARAMETRIC EQ
// ============================================================================

/** EQ band type */
export type EqBandType = 'peak' | 'lowshelf' | 'highshelf' | 'lowpass' | 'highpass' | 'notch';

/** EQ band configuration */
export interface EqBandConfig {
  enabled: boolean;
  type: EqBandType;
  frequency: number;
  gain: number;
  q: number;
}

/** Parametric EQ configuration */
export interface ParametricEqConfig {
  bands: EqBandConfig[];
  outputGain: number;
}

/** Default 4-band parametric EQ */
export const DEFAULT_PARAMETRIC_EQ: ParametricEqConfig = {
  bands: [
    { enabled: true, type: 'lowshelf', frequency: 100, gain: 0, q: 0.7 },
    { enabled: true, type: 'peak', frequency: 500, gain: 0, q: 1.0 },
    { enabled: true, type: 'peak', frequency: 2000, gain: 0, q: 1.0 },
    { enabled: true, type: 'highshelf', frequency: 8000, gain: 0, q: 0.7 },
  ],
  outputGain: 0,
};

// ============================================================================
// DISTORTION
// ============================================================================

/** Distortion configuration */
export interface DistortionConfig {
  drive: number;        // 0-1
  tone: number;         // -1 to 1 (dark to bright)
  mix: number;          // 0-1 dry/wet
  outputLevel: number;  // dB
  type: 'tube' | 'tape' | 'digital' | 'foldback';
  asymmetry: number;    // 0-1
  bias: number;         // -1 to 1
}

/** Default distortion */
export const DEFAULT_DISTORTION: DistortionConfig = {
  drive: 0.3,
  tone: 0,
  mix: 1,
  outputLevel: 0,
  type: 'tube',
  asymmetry: 0,
  bias: 0,
};

// ============================================================================
// WAVESHAPER
// ============================================================================

/** Waveshaper configuration */
export interface WaveshaperConfig {
  drive: number;
  curve: Float32Array | null;  // Custom transfer function
  mix: number;
  asymmetry: number;
  preFilter: number;    // Hz highpass before
  postFilter: number;   // Hz lowpass after
}

/** Default waveshaper */
export const DEFAULT_WAVESHAPER: WaveshaperConfig = {
  drive: 0.5,
  curve: null,
  mix: 1,
  asymmetry: 0,
  preFilter: 20,
  postFilter: 20000,
};

// ============================================================================
// CHORUS
// ============================================================================

/** Chorus configuration */
export interface WtChorusConfig {
  rate: number;         // Hz
  depth: number;        // 0-1
  feedback: number;     // -1 to 1
  voices: number;       // 2-8
  spread: number;       // 0-1 stereo
  mix: number;
  hiCut: number;        // Hz
  delay: number;        // ms base delay
  tempoSync: boolean;
  syncDivision: string;
}

/** Default chorus */
export const DEFAULT_WT_CHORUS: WtChorusConfig = {
  rate: 0.5,
  depth: 0.5,
  feedback: 0,
  voices: 2,
  spread: 0.5,
  mix: 0.5,
  hiCut: 8000,
  delay: 7,
  tempoSync: false,
  syncDivision: '1/4',
};

// ============================================================================
// PHASER
// ============================================================================

/** Phaser configuration */
export interface WtPhaserConfig {
  rate: number;          // Hz
  depth: number;         // 0-1
  feedback: number;      // -1 to 1
  stages: number;        // 4, 6, 8, 12
  centerFreq: number;    // Hz
  spread: number;        // Octaves
  mix: number;
  stereoPhase: number;   // degrees
  tempoSync: boolean;
  syncDivision: string;
}

/** Default phaser */
export const DEFAULT_WT_PHASER: WtPhaserConfig = {
  rate: 0.3,
  depth: 0.5,
  feedback: 0.5,
  stages: 6,
  centerFreq: 1000,
  spread: 1,
  mix: 0.5,
  stereoPhase: 90,
  tempoSync: false,
  syncDivision: '1/4',
};

// ============================================================================
// FLANGER
// ============================================================================

/** Flanger configuration */
export interface WtFlangerConfig {
  rate: number;
  depth: number;
  feedback: number;      // -1 to 1 (negative = through-zero)
  delay: number;         // ms center
  mix: number;
  stereoPhase: number;
  tempoSync: boolean;
  syncDivision: string;
  throughZero: boolean;
}

/** Default flanger */
export const DEFAULT_WT_FLANGER: WtFlangerConfig = {
  rate: 0.2,
  depth: 0.5,
  feedback: 0.5,
  delay: 5,
  mix: 0.5,
  stereoPhase: 90,
  tempoSync: false,
  syncDivision: '1/4',
  throughZero: false,
};

// ============================================================================
// ROTARY SPEAKER
// ============================================================================

/** Rotary speaker configuration */
export interface RotaryConfig {
  speed: 'slow' | 'fast' | 'stop';
  slowRate: number;      // Hz
  fastRate: number;      // Hz
  acceleration: number;  // seconds to change speed
  hornLevel: number;     // dB
  drumLevel: number;     // dB
  hornDistance: number;  // 0-1
  drumDistance: number;  // 0-1
  mix: number;
}

/** Default rotary */
export const DEFAULT_ROTARY: RotaryConfig = {
  speed: 'slow',
  slowRate: 0.7,
  fastRate: 6.5,
  acceleration: 2,
  hornLevel: 0,
  drumLevel: -3,
  hornDistance: 0.5,
  drumDistance: 0.5,
  mix: 1,
};

// ============================================================================
// DELAY
// ============================================================================

/** Delay configuration */
export interface WtDelayConfig {
  timeL: number;         // ms
  timeR: number;         // ms
  feedback: number;      // 0-1
  crossFeedback: number; // 0-1
  lowCut: number;        // Hz
  highCut: number;       // Hz
  modRate: number;       // Hz
  modDepth: number;      // 0-1
  saturation: number;    // 0-1
  mix: number;
  tempoSync: boolean;
  syncDivisionL: string;
  syncDivisionR: string;
  pingPong: boolean;
  duckAmount: number;    // 0-1
  duckThreshold: number; // dB
}

/** Default delay */
export const DEFAULT_WT_DELAY: WtDelayConfig = {
  timeL: 375,
  timeR: 500,
  feedback: 0.4,
  crossFeedback: 0,
  lowCut: 200,
  highCut: 8000,
  modRate: 0.5,
  modDepth: 0,
  saturation: 0,
  mix: 0.3,
  tempoSync: false,
  syncDivisionL: '1/4',
  syncDivisionR: '3/8',
  pingPong: false,
  duckAmount: 0,
  duckThreshold: -20,
};

// ============================================================================
// REVERB
// ============================================================================

/** Reverb type */
export type ReverbType = 'room' | 'hall' | 'plate' | 'spring' | 'shimmer';

/** Reverb configuration */
export interface WtReverbConfig {
  type: ReverbType;
  size: number;          // 0-1
  decay: number;         // seconds
  predelay: number;      // ms
  damping: number;       // 0-1
  diffusion: number;     // 0-1
  modulation: number;    // 0-1
  lowCut: number;        // Hz
  highCut: number;       // Hz
  earlyLevel: number;    // dB
  tailLevel: number;     // dB
  width: number;         // 0-1
  mix: number;
  // Shimmer-specific
  shimmerPitch: number;  // semitones
  shimmerMix: number;    // 0-1
}

/** Default reverb */
export const DEFAULT_WT_REVERB: WtReverbConfig = {
  type: 'hall',
  size: 0.5,
  decay: 2,
  predelay: 20,
  damping: 0.5,
  diffusion: 0.7,
  modulation: 0.2,
  lowCut: 100,
  highCut: 10000,
  earlyLevel: 0,
  tailLevel: 0,
  width: 1,
  mix: 0.3,
  shimmerPitch: 12,
  shimmerMix: 0,
};

// ============================================================================
// COMBULATOR
// ============================================================================

/** Combulator (comb filter bank) configuration */
export interface CombulatorConfig {
  freq1: number;         // Hz
  freq2: number;         // Hz  
  freq3: number;         // Hz
  feedback: number;      // 0-1
  mix1: number;          // 0-1
  mix2: number;          // 0-1
  mix3: number;          // 0-1
  centerFreq: number;    // Hz (for tone control)
  width: number;         // 0-1
  mix: number;
}

/** Default combulator */
export const DEFAULT_COMBULATOR: CombulatorConfig = {
  freq1: 200,
  freq2: 400,
  freq3: 800,
  feedback: 0.7,
  mix1: 1,
  mix2: 1,
  mix3: 1,
  centerFreq: 1000,
  width: 0.5,
  mix: 0.5,
};

// ============================================================================
// FREQUENCY SHIFTER
// ============================================================================

/** Frequency shifter configuration */
export interface FreqShifterConfig {
  shift: number;         // Hz
  feedback: number;      // 0-1
  mix: number;
  direction: 'up' | 'down' | 'both';
  balance: number;       // -1 to 1 (up vs down)
}

/** Default frequency shifter */
export const DEFAULT_FREQ_SHIFTER: FreqShifterConfig = {
  shift: 0,
  feedback: 0,
  mix: 0.5,
  direction: 'both',
  balance: 0,
};

// ============================================================================
// RING MODULATOR
// ============================================================================

/** Ring modulator configuration */
export interface WtRingModConfig {
  frequency: number;     // Hz
  waveform: 'sine' | 'triangle' | 'square' | 'sawtooth';
  mix: number;
  lowCut: number;        // Hz
  highCut: number;       // Hz
}

/** Default ring modulator */
export const DEFAULT_WT_RING_MOD: WtRingModConfig = {
  frequency: 440,
  waveform: 'sine',
  mix: 0.5,
  lowCut: 20,
  highCut: 20000,
};

// ============================================================================
// VOCODER
// ============================================================================

/** Vocoder configuration */
export interface VocoderConfig {
  bands: number;         // 8, 16, 32
  attack: number;        // ms
  release: number;       // ms
  formantShift: number;  // semitones
  carrierMix: number;    // 0-1 (noise vs internal)
  brightness: number;    // 0-1
  mix: number;
}

/** Default vocoder */
export const DEFAULT_VOCODER: VocoderConfig = {
  bands: 16,
  attack: 5,
  release: 50,
  formantShift: 0,
  carrierMix: 0,
  brightness: 0.5,
  mix: 1,
};

// ============================================================================
// RESONATOR
// ============================================================================

/** Resonator (tuned comb filter bank) configuration */
export interface ResonatorConfig {
  frequency: number;     // Hz base frequency
  structure: number;     // 0-1 (harmonic vs inharmonic)
  brightness: number;    // 0-1
  damping: number;       // 0-1
  voices: number;        // 1-8 parallel resonators
  detune: number;        // cents between voices
  mix: number;
}

/** Default resonator */
export const DEFAULT_RESONATOR: ResonatorConfig = {
  frequency: 220,
  structure: 1,
  brightness: 0.5,
  damping: 0.5,
  voices: 4,
  detune: 0,
  mix: 0.5,
};

// ============================================================================
// COMPRESSOR
// ============================================================================

/** Compressor configuration */
export interface WtCompressorConfig {
  threshold: number;     // dB
  ratio: number;         // 1:1 to inf:1
  attack: number;        // ms
  release: number;       // ms
  knee: number;          // dB
  makeupGain: number;    // dB
  autoMakeup: boolean;
  mix: number;           // parallel compression
  sidechain: boolean;
  sidechainHpf: number;  // Hz
  lookahead: number;     // ms
}

/** Default compressor */
export const DEFAULT_WT_COMPRESSOR: WtCompressorConfig = {
  threshold: -18,
  ratio: 4,
  attack: 10,
  release: 100,
  knee: 6,
  makeupGain: 0,
  autoMakeup: false,
  mix: 1,
  sidechain: false,
  sidechainHpf: 20,
  lookahead: 0,
};

// ============================================================================
// LIMITER
// ============================================================================

/** Limiter configuration */
export interface WtLimiterConfig {
  threshold: number;     // dB
  ceiling: number;       // dB
  release: number;       // ms
  lookahead: number;     // ms
  stereoLink: boolean;
}

/** Default limiter */
export const DEFAULT_WT_LIMITER: WtLimiterConfig = {
  threshold: -1,
  ceiling: -0.1,
  release: 50,
  lookahead: 1,
  stereoLink: true,
};

// ============================================================================
// STEREO WIDENER
// ============================================================================

/** Stereo widener configuration */
export interface StereoWidenerConfig {
  width: number;         // 0-2 (1 = normal)
  midSideBalance: number; // -1 to 1
  bassWidth: number;     // 0-1 (mono bass)
  bassCrossover: number; // Hz
  haasDelay: number;     // ms
}

/** Default stereo widener */
export const DEFAULT_STEREO_WIDENER: StereoWidenerConfig = {
  width: 1,
  midSideBalance: 0,
  bassWidth: 0,
  bassCrossover: 200,
  haasDelay: 0,
};

// ============================================================================
// EFFECT PROCESSOR INTERFACE
// ============================================================================

/** Effect processor interface */
export interface WtEffectProcessor {
  process(inputL: Float32Array, inputR: Float32Array, outputL: Float32Array, outputR: Float32Array): void;
  setParam(name: string, value: number): void;
  getParam(name: string): number;
  reset(): void;
  getType(): WavetableEffectType;
}

// ============================================================================
// EQ PROCESSOR
// ============================================================================

interface BiquadState {
  x1: number; x2: number; y1: number; y2: number;
}

interface BiquadCoeffs {
  b0: number; b1: number; b2: number; a1: number; a2: number;
}

function calculateEqCoeffs(
  type: EqBandType,
  freq: number,
  gain: number,
  q: number,
  sampleRate: number
): BiquadCoeffs {
  const w0 = 2 * Math.PI * freq / sampleRate;
  const cos_w0 = Math.cos(w0);
  const sin_w0 = Math.sin(w0);
  const A = Math.pow(10, gain / 40);
  const alpha = sin_w0 / (2 * q);

  let b0 = 0, b1 = 0, b2 = 0, a0 = 1, a1 = 0, a2 = 0;

  switch (type) {
    case 'peak':
      b0 = 1 + alpha * A;
      b1 = -2 * cos_w0;
      b2 = 1 - alpha * A;
      a0 = 1 + alpha / A;
      a1 = -2 * cos_w0;
      a2 = 1 - alpha / A;
      break;

    case 'lowshelf': {
      const sqA = Math.sqrt(A);
      b0 = A * ((A + 1) - (A - 1) * cos_w0 + 2 * sqA * alpha);
      b1 = 2 * A * ((A - 1) - (A + 1) * cos_w0);
      b2 = A * ((A + 1) - (A - 1) * cos_w0 - 2 * sqA * alpha);
      a0 = (A + 1) + (A - 1) * cos_w0 + 2 * sqA * alpha;
      a1 = -2 * ((A - 1) + (A + 1) * cos_w0);
      a2 = (A + 1) + (A - 1) * cos_w0 - 2 * sqA * alpha;
      break;
    }

    case 'highshelf': {
      const sqA = Math.sqrt(A);
      b0 = A * ((A + 1) + (A - 1) * cos_w0 + 2 * sqA * alpha);
      b1 = -2 * A * ((A - 1) + (A + 1) * cos_w0);
      b2 = A * ((A + 1) + (A - 1) * cos_w0 - 2 * sqA * alpha);
      a0 = (A + 1) - (A - 1) * cos_w0 + 2 * sqA * alpha;
      a1 = 2 * ((A - 1) - (A + 1) * cos_w0);
      a2 = (A + 1) - (A - 1) * cos_w0 - 2 * sqA * alpha;
      break;
    }

    case 'lowpass':
      b0 = (1 - cos_w0) / 2;
      b1 = 1 - cos_w0;
      b2 = (1 - cos_w0) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cos_w0;
      a2 = 1 - alpha;
      break;

    case 'highpass':
      b0 = (1 + cos_w0) / 2;
      b1 = -(1 + cos_w0);
      b2 = (1 + cos_w0) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cos_w0;
      a2 = 1 - alpha;
      break;

    case 'notch':
      b0 = 1;
      b1 = -2 * cos_w0;
      b2 = 1;
      a0 = 1 + alpha;
      a1 = -2 * cos_w0;
      a2 = 1 - alpha;
      break;
  }

  return {
    b0: b0 / a0,
    b1: b1 / a0,
    b2: b2 / a0,
    a1: a1 / a0,
    a2: a2 / a0,
  };
}

/**
 * Parametric EQ processor
 */
export class ParametricEqProcessor implements WtEffectProcessor {
  private config: ParametricEqConfig;
  private sampleRate: number;
  private statesL: BiquadState[] = [];
  private statesR: BiquadState[] = [];
  private coeffs: BiquadCoeffs[] = [];

  constructor(sampleRate: number, config?: Partial<ParametricEqConfig>) {
    this.sampleRate = sampleRate;
    this.config = { ...DEFAULT_PARAMETRIC_EQ, ...config };
    this.initBands();
  }

  private initBands(): void {
    this.statesL = [];
    this.statesR = [];
    this.coeffs = [];

    for (const band of this.config.bands) {
      this.statesL.push({ x1: 0, x2: 0, y1: 0, y2: 0 });
      this.statesR.push({ x1: 0, x2: 0, y1: 0, y2: 0 });
      this.coeffs.push(
        calculateEqCoeffs(band.type, band.frequency, band.gain, band.q, this.sampleRate)
      );
    }
  }

  private processBiquad(
    input: number,
    coeffs: BiquadCoeffs,
    state: BiquadState
  ): number {
    const output = coeffs.b0 * input + coeffs.b1 * state.x1 + coeffs.b2 * state.x2
                 - coeffs.a1 * state.y1 - coeffs.a2 * state.y2;
    state.x2 = state.x1;
    state.x1 = input;
    state.y2 = state.y1;
    state.y1 = output;
    return output;
  }

  process(
    inputL: Float32Array,
    inputR: Float32Array,
    outputL: Float32Array,
    outputR: Float32Array
  ): void {
    const outputGain = Math.pow(10, this.config.outputGain / 20);

    for (let i = 0; i < inputL.length; i++) {
      let sampleL = inputL[i] ?? 0;
      let sampleR = inputR[i] ?? 0;

      for (let b = 0; b < this.config.bands.length; b++) {
        const band = this.config.bands[b];
        const coeff = this.coeffs[b];
        const stateL = this.statesL[b];
        const stateR = this.statesR[b];
        if (band?.enabled && coeff && stateL && stateR) {
          sampleL = this.processBiquad(sampleL, coeff, stateL);
          sampleR = this.processBiquad(sampleR, coeff, stateR);
        }
      }

      outputL[i] = sampleL * outputGain;
      outputR[i] = sampleR * outputGain;
    }
  }

  setParam(name: string, value: number): void {
    if (name === 'outputGain') {
      this.config.outputGain = value;
    } else {
      // Parse band parameter: band0_frequency, band0_gain, etc.
      const match = name.match(/band(\d+)_(\w+)/);
      if (match && match[1] !== undefined && match[2] !== undefined) {
        const bandIndex = parseInt(match[1]);
        const param: string = match[2];
        const band = this.config.bands[bandIndex];
        if (band && param) {
          (band as unknown as Record<string, number | boolean | string>)[param] = value;
          this.coeffs[bandIndex] = calculateEqCoeffs(
            band.type,
            band.frequency,
            band.gain,
            band.q,
            this.sampleRate
          );
        }
      }
    }
  }

  getParam(name: string): number {
    if (name === 'outputGain') return this.config.outputGain;
    const match = name.match(/band(\d+)_(\w+)/);
    if (match && match[1] !== undefined && match[2] !== undefined) {
      const bandIndex = parseInt(match[1]);
      const param: string = match[2];
      const band = this.config.bands[bandIndex];
      if (band && param) {
        return (band as unknown as Record<string, number>)[param] ?? 0;
      }
    }
    return 0;
  }

  reset(): void {
    for (const state of this.statesL) {
      state.x1 = state.x2 = state.y1 = state.y2 = 0;
    }
    for (const state of this.statesR) {
      state.x1 = state.x2 = state.y1 = state.y2 = 0;
    }
  }

  getType(): WavetableEffectType {
    return 'eq_parametric';
  }
}

// ============================================================================
// DISTORTION PROCESSOR
// ============================================================================

/**
 * Distortion processor
 */
export class DistortionProcessor implements WtEffectProcessor {
  private config: DistortionConfig;
  private sampleRate: number;
  // Tone filter state
  private toneStateL = { y1: 0 };
  private toneStateR = { y1: 0 };

  constructor(sampleRate: number, config?: Partial<DistortionConfig>) {
    this.sampleRate = sampleRate;
    this.config = { ...DEFAULT_DISTORTION, ...config };
  }

  private saturate(input: number, bias: number): number {
    const biased = input + bias;
    const drive = this.config.drive * 10 + 1;
    const driven = biased * drive;

    switch (this.config.type) {
      case 'tube': {
        // Asymmetric tube saturation
        const k = 2 * this.config.drive;
        const sign = Math.sign(driven);
        const abs = Math.abs(driven);
        const shaped = (1 + k) * abs / (1 + k * abs);
        return sign * shaped * (1 + this.config.asymmetry * (driven > 0 ? 0.2 : -0.1));
      }

      case 'tape': {
        // Tape saturation with soft limiting
        if (driven >= 0) {
          return Math.tanh(driven) * (1 + this.config.asymmetry * 0.1);
        } else {
          return Math.tanh(driven * 0.9) * (1 - this.config.asymmetry * 0.1);
        }
      }

      case 'digital': {
        // Hard clipping
        return Math.max(-1, Math.min(1, driven));
      }

      case 'foldback': {
        // Wave folding
        let folded = driven;
        const threshold = 1;
        while (Math.abs(folded) > threshold) {
          if (folded > threshold) {
            folded = 2 * threshold - folded;
          } else if (folded < -threshold) {
            folded = -2 * threshold - folded;
          }
        }
        return folded;
      }

      default:
        return Math.tanh(driven);
    }
  }

  process(
    inputL: Float32Array,
    inputR: Float32Array,
    outputL: Float32Array,
    outputR: Float32Array
  ): void {
    const outputGain = Math.pow(10, this.config.outputLevel / 20);
    const mix = this.config.mix;
    const dry = 1 - mix;

    // Tone filter coefficient
    const toneFreq = 1000 * Math.pow(10, this.config.tone);
    const toneCoeff = Math.exp(-2 * Math.PI * toneFreq / this.sampleRate);

    for (let i = 0; i < inputL.length; i++) {
      const inL = inputL[i] ?? 0;
      const inR = inputR[i] ?? 0;

      // Saturate
      let wetL = this.saturate(inL, this.config.bias);
      let wetR = this.saturate(inR, this.config.bias);

      // Apply tone filter (one-pole lowpass)
      this.toneStateL.y1 = (1 - toneCoeff) * wetL + toneCoeff * this.toneStateL.y1;
      this.toneStateR.y1 = (1 - toneCoeff) * wetR + toneCoeff * this.toneStateR.y1;

      if (this.config.tone < 0) {
        // Dark: use filtered
        wetL = this.toneStateL.y1;
        wetR = this.toneStateR.y1;
      } else {
        // Bright: blend
        wetL = wetL * (0.5 + this.config.tone * 0.5) + this.toneStateL.y1 * (0.5 - this.config.tone * 0.5);
        wetR = wetR * (0.5 + this.config.tone * 0.5) + this.toneStateR.y1 * (0.5 - this.config.tone * 0.5);
      }

      outputL[i] = (inL * dry + wetL * mix) * outputGain;
      outputR[i] = (inR * dry + wetR * mix) * outputGain;
    }
  }

  setParam(name: string, value: number): void {
    (this.config as any)[name] = value;
  }

  getParam(name: string): number {
    return (this.config as any)[name] ?? 0;
  }

  reset(): void {
    this.toneStateL.y1 = 0;
    this.toneStateR.y1 = 0;
  }

  getType(): WavetableEffectType {
    return `dist_${this.config.type}` as WavetableEffectType;
  }
}

// ============================================================================
// REVERB PROCESSOR (Algorithmic)
// ============================================================================

/**
 * Algorithmic reverb processor
 */
export class WtReverbProcessor implements WtEffectProcessor {
  private config: WtReverbConfig;
  private sampleRate: number;

  // Comb filter delays (Schroeder)
  private combDelays = [1557, 1617, 1491, 1422, 1277, 1356, 1188, 1116];
  private combBuffers: Float32Array[] = [];
  private combIndices: number[] = [];
  private combFilters: number[] = [];

  // Allpass delays
  private apDelays = [225, 556, 441, 341];
  private apBuffers: Float32Array[] = [];
  private apIndices: number[] = [];

  constructor(sampleRate: number, config?: Partial<WtReverbConfig>) {
    this.sampleRate = sampleRate;
    this.config = { ...DEFAULT_WT_REVERB, ...config };
    this.initBuffers();
  }

  private initBuffers(): void {
    const scale = (this.sampleRate / 44100) * (0.5 + this.config.size * 1.5);

    this.combBuffers = [];
    this.combIndices = [];
    this.combFilters = [];

    for (const delay of this.combDelays) {
      const size = Math.floor(delay * scale);
      this.combBuffers.push(new Float32Array(size));
      this.combIndices.push(0);
      this.combFilters.push(0);
    }

    this.apBuffers = [];
    this.apIndices = [];

    for (const delay of this.apDelays) {
      const size = Math.floor(delay * scale);
      this.apBuffers.push(new Float32Array(size));
      this.apIndices.push(0);
    }
  }

  process(
    inputL: Float32Array,
    inputR: Float32Array,
    outputL: Float32Array,
    outputR: Float32Array
  ): void {
    const mix = this.config.mix;
    const dry = 1 - mix;
    const feedback = Math.pow(10, -3 / (this.config.decay * this.sampleRate / 1000));
    const damping = this.config.damping;
    const diffusion = this.config.diffusion * 0.5;

    for (let i = 0; i < inputL.length; i++) {
      const inL = inputL[i] ?? 0;
      const inR = inputR[i] ?? 0;
      const input = (inL + inR) * 0.5;
      let sum = 0;

      // Process parallel comb filters
      for (let c = 0; c < this.combBuffers.length; c++) {
        const buffer = this.combBuffers[c];
        const idx = this.combIndices[c];
        if (!buffer || idx === undefined) continue;

        const delayed = buffer[idx] ?? 0;

        // Damping filter
        const prevFilter = this.combFilters[c] ?? 0;
        this.combFilters[c] = delayed * (1 - damping) + prevFilter * damping;

        // Write back with feedback
        buffer[idx] = input + (this.combFilters[c] ?? 0) * feedback;

        this.combIndices[c] = (idx + 1) % buffer.length;
        sum += delayed;
      }

      sum /= this.combBuffers.length;

      // Process series allpass filters
      for (let a = 0; a < this.apBuffers.length; a++) {
        const buffer = this.apBuffers[a];
        const idx = this.apIndices[a];
        if (!buffer || idx === undefined) continue;

        const delayed = buffer[idx] ?? 0;
        buffer[idx] = sum + delayed * diffusion;
        sum = delayed - sum * diffusion;

        this.apIndices[a] = (idx + 1) % buffer.length;
      }

      // Create stereo spread
      const width = this.config.width;
      const wetL = sum * (0.5 + width * 0.5);
      const wetR = sum * (0.5 + width * 0.5);

      outputL[i] = inL * dry + wetL * mix;
      outputR[i] = inR * dry + wetR * mix;
    }
  }

  setParam(name: string, value: number): void {
    (this.config as any)[name] = value;
    if (name === 'size') {
      this.initBuffers();
    }
  }

  getParam(name: string): number {
    return (this.config as any)[name] ?? 0;
  }

  reset(): void {
    for (const buffer of this.combBuffers) buffer.fill(0);
    for (const buffer of this.apBuffers) buffer.fill(0);
    this.combIndices.fill(0);
    this.apIndices.fill(0);
    this.combFilters.fill(0);
  }

  getType(): WavetableEffectType {
    return `reverb_${this.config.type}` as WavetableEffectType;
  }
}

// ============================================================================
// EFFECTS CHAIN
// ============================================================================

/**
 * Wavetable effects chain manager
 */
export class WavetableEffectChain {
  private sampleRate: number;
  private slots: WavetableEffectSlot[] = [];
  private processors: Map<string, WtEffectProcessor> = new Map();
  private maxSlots = 8;

  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
  }

  /**
   * Add effect to chain
   */
  addEffect(
    type: WavetableEffectType,
    position: EffectPosition,
    params?: Record<string, number>
  ): string {
    if (this.slots.length >= this.maxSlots) {
      throw new Error(`Maximum effects (${this.maxSlots}) reached`);
    }

    const id = `fx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const slot: WavetableEffectSlot = {
      id,
      type,
      enabled: true,
      position,
      mix: 1,
      params: params ?? {},
    };

    this.slots.push(slot);
    this.createProcessor(slot);

    return id;
  }

  /**
   * Create processor for slot
   */
  private createProcessor(slot: WavetableEffectSlot): void {
    let processor: WtEffectProcessor | null = null;

    switch (slot.type) {
      case 'eq_parametric':
        processor = new ParametricEqProcessor(this.sampleRate);
        break;

      case 'dist_tube':
      case 'dist_tape':
      case 'dist_digital':
      case 'dist_foldback':
        processor = new DistortionProcessor(this.sampleRate, {
          type: slot.type.replace('dist_', '') as DistortionConfig['type'],
        });
        break;

      case 'reverb_room':
      case 'reverb_hall':
      case 'reverb_plate':
      case 'reverb_spring':
      case 'reverb_shimmer':
        processor = new WtReverbProcessor(this.sampleRate, {
          type: slot.type.replace('reverb_', '') as ReverbType,
        });
        break;
    }

    if (processor) {
      // Apply initial params
      for (const [name, value] of Object.entries(slot.params)) {
        processor.setParam(name, value);
      }
      this.processors.set(slot.id, processor);
    }
  }

  /**
   * Remove effect
   */
  removeEffect(id: string): boolean {
    const index = this.slots.findIndex(s => s.id === id);
    if (index === -1) return false;

    this.slots.splice(index, 1);
    this.processors.delete(id);
    return true;
  }

  /**
   * Set effect enabled
   */
  setEffectEnabled(id: string, enabled: boolean): void {
    const slot = this.slots.find(s => s.id === id);
    if (slot) slot.enabled = enabled;
  }

  /**
   * Set effect parameter
   */
  setEffectParam(id: string, name: string, value: number): void {
    const slot = this.slots.find(s => s.id === id);
    const processor = this.processors.get(id);

    if (slot) slot.params[name] = value;
    if (processor) processor.setParam(name, value);
  }

  /**
   * Set effect mix
   */
  setEffectMix(id: string, mix: number): void {
    const slot = this.slots.find(s => s.id === id);
    if (slot) slot.mix = Math.max(0, Math.min(1, mix));
  }

  /**
   * Process audio through chain at specified position
   */
  process(
    position: EffectPosition,
    inputL: Float32Array,
    inputR: Float32Array,
    outputL: Float32Array,
    outputR: Float32Array
  ): void {
    // Copy input to output initially
    outputL.set(inputL);
    outputR.set(inputR);

    const tempL = new Float32Array(inputL.length);
    const tempR = new Float32Array(inputR.length);

    for (const slot of this.slots) {
      if (!slot.enabled || slot.position !== position) continue;

      const processor = this.processors.get(slot.id);
      if (!processor) continue;

      // Process through effect
      processor.process(outputL, outputR, tempL, tempR);

      // Apply mix
      const wet = slot.mix;
      const dry = 1 - wet;

      for (let i = 0; i < outputL.length; i++) {
        outputL[i] = (outputL[i] ?? 0) * dry + (tempL[i] ?? 0) * wet;
        outputR[i] = (outputR[i] ?? 0) * dry + (tempR[i] ?? 0) * wet;
      }
    }
  }

  /**
   * Reset all effects
   */
  reset(): void {
    for (const processor of this.processors.values()) {
      processor.reset();
    }
  }

  /**
   * Get all slots
   */
  getSlots(): WavetableEffectSlot[] {
    return [...this.slots];
  }

  /**
   * Get slots by position
   */
  getSlotsByPosition(position: EffectPosition): WavetableEffectSlot[] {
    return this.slots.filter(s => s.position === position);
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createWtEffectChain(sampleRate: number): WavetableEffectChain {
  return new WavetableEffectChain(sampleRate);
}

export function createParametricEq(
  sampleRate: number,
  config?: Partial<ParametricEqConfig>
): ParametricEqProcessor {
  return new ParametricEqProcessor(sampleRate, config);
}

export function createDistortion(
  sampleRate: number,
  config?: Partial<DistortionConfig>
): DistortionProcessor {
  return new DistortionProcessor(sampleRate, config);
}

export function createWtReverb(
  sampleRate: number,
  config?: Partial<WtReverbConfig>
): WtReverbProcessor {
  return new WtReverbProcessor(sampleRate, config);
}
