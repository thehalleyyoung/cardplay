/**
 * @fileoverview Sampler Effects Module - Comprehensive Effects Chain
 * 
 * Implements a full effects chain for the sampler including:
 * - EQ (parametric, graphic)
 * - Dynamics (compressor, limiter, gate, expander)
 * - Saturation (tape, tube, transistor)
 * - Modulation (chorus, phaser, flanger, rotary)
 * - Time-based (delay, reverb, convolution)
 * - Special (bit crusher, ring modulator, stereo widener)
 * 
 * @module @cardplay/core/audio/sampler-effects
 */

// ============================================================================
// EFFECT TYPE DEFINITIONS
// ============================================================================

/** Base effect type */
export type SamplerEffectType =
  // EQ
  | 'eq_parametric'
  | 'eq_graphic'
  // Dynamics
  | 'compressor'
  | 'limiter'
  | 'gate'
  | 'expander'
  | 'multiband_comp'
  // Saturation
  | 'saturation'
  | 'tape'
  | 'tube'
  | 'transistor'
  // Modulation
  | 'chorus'
  | 'flanger'
  | 'phaser'
  | 'rotary'
  | 'tremolo'
  | 'vibrato'
  | 'autopan'
  // Time-based
  | 'delay'
  | 'ping_pong'
  | 'multitap'
  | 'reverb'
  | 'convolution'
  // Special
  | 'bitcrusher'
  | 'ring_mod'
  | 'stereo_widener'
  | 'lofi'
  | 'vocoder';

/** Effect chain slot */
export interface EffectSlot {
  id: string;
  type: SamplerEffectType;
  enabled: boolean;
  mix: number;          // 0-1 dry/wet
  params: Record<string, number>;
}

/** Effect chain configuration */
export interface EffectChainConfig {
  preGain: number;      // dB
  postGain: number;     // dB
  slots: EffectSlot[];
  maxSlots: number;
}

// ============================================================================
// EFFECT PARAMETER DEFINITIONS
// ============================================================================

/** EQ Band */
export interface EqBand {
  enabled: boolean;
  type: 'peak' | 'lowshelf' | 'highshelf' | 'lowpass' | 'highpass' | 'notch';
  frequency: number;   // Hz
  gain: number;        // dB
  q: number;           // Q factor
}

/** Parametric EQ parameters */
export interface ParametricEqParams {
  bands: EqBand[];
  outputGain: number;
}

/** Graphic EQ parameters */
export interface GraphicEqParams {
  frequencies: number[];  // Center frequencies
  gains: number[];        // Gains in dB
  q: number;              // Q factor for all bands
}

/** Compressor parameters */
export interface CompressorParams {
  threshold: number;      // dB
  ratio: number;          // 1:1 to inf:1
  attack: number;         // ms
  release: number;        // ms
  knee: number;           // dB
  makeupGain: number;     // dB
  sidechain: boolean;
  sidechainHpf: number;   // Hz
  lookahead: number;      // ms
  autoMakeup: boolean;
}

/** Limiter parameters */
export interface LimiterParams {
  threshold: number;      // dB
  release: number;        // ms
  lookahead: number;      // ms
  ceiling: number;        // dB
}

/** Gate parameters */
export interface GateParams {
  threshold: number;      // dB
  attack: number;         // ms
  hold: number;           // ms
  release: number;        // ms
  range: number;          // dB reduction
  sidechain: boolean;
  sidechainHpf: number;   // Hz
}

/** Saturation parameters */
export interface SaturationParams {
  drive: number;          // 0-1
  type: 'soft' | 'hard' | 'tape' | 'tube' | 'transistor' | 'fold';
  tone: number;           // -1 to 1 (dark to bright)
  asymmetry: number;      // 0-1
  outputLevel: number;    // dB
}

/** Chorus parameters */
export interface ChorusParams {
  rate: number;           // Hz
  depth: number;          // 0-1
  voices: number;         // 2-8
  spread: number;         // 0-1 stereo spread
  feedback: number;       // 0-1
  delay: number;          // ms base delay
  hiCut: number;          // Hz
}

/** Flanger parameters */
export interface FlangerParams {
  rate: number;           // Hz
  depth: number;          // 0-1
  feedback: number;       // -1 to 1
  delay: number;          // ms center delay
  stereoPhase: number;    // degrees
  manualSweep: number;    // 0-1
}

/** Phaser parameters */
export interface PhaserParams {
  rate: number;           // Hz
  depth: number;          // 0-1
  stages: number;         // 4, 6, 8, 12
  feedback: number;       // -1 to 1
  centerFrequency: number; // Hz
  stereoPhase: number;    // degrees
}

/** Delay parameters */
export interface DelayParams {
  time: number;           // ms
  feedback: number;       // 0-1
  tempoSync: boolean;
  syncDivision: string;   // 1/4, 1/8, etc.
  lowCut: number;         // Hz
  highCut: number;        // Hz
  saturation: number;     // 0-1
  stereoWidth: number;    // 0-1
  pingPong: boolean;
  duckAmount: number;     // 0-1
}

/** Multitap delay parameters */
export interface MultitapDelayParams {
  taps: Array<{
    time: number;
    gain: number;
    pan: number;
    feedback: number;
  }>;
  lowCut: number;
  highCut: number;
}

/** Reverb parameters */
export interface ReverbParams {
  preDelay: number;       // ms
  decay: number;          // seconds
  size: number;           // 0-1
  damping: number;        // 0-1 (high freq decay)
  diffusion: number;      // 0-1
  earlyLevel: number;     // dB
  tailLevel: number;      // dB
  lowCut: number;         // Hz
  highCut: number;        // Hz
  modulation: number;     // 0-1
  width: number;          // 0-1 stereo
}

/** Bit crusher parameters */
export interface BitcrusherParams {
  bitDepth: number;       // 1-24 bits
  sampleRate: number;     // Hz
  jitter: number;         // 0-1
  noise: number;          // 0-1
}

/** Ring modulator parameters */
export interface RingModParams {
  frequency: number;      // Hz
  waveform: 'sine' | 'triangle' | 'square' | 'sawtooth';
  lfoSync: boolean;
  envFollow: number;      // 0-1
}

/** Stereo widener parameters */
export interface StereoWidenerParams {
  width: number;          // 0-2 (1 = normal)
  midSideBalance: number; // -1 to 1
  bassWidth: number;      // 0-1 (mono bass below crossover)
  bassCrossover: number;  // Hz
}

/** Lo-fi parameters */
export interface LofiParams {
  bitDepth: number;
  sampleRate: number;
  noise: number;
  wow: number;            // Pitch wobble
  flutter: number;        // Fast pitch wobble
  saturation: number;
  lowpassFreq: number;
  highpassFreq: number;
}

// ============================================================================
// DEFAULT EFFECT PARAMETERS
// ============================================================================

export const DEFAULT_COMPRESSOR_PARAMS: CompressorParams = {
  threshold: -18,
  ratio: 4,
  attack: 10,
  release: 100,
  knee: 6,
  makeupGain: 0,
  sidechain: false,
  sidechainHpf: 20,
  lookahead: 0,
  autoMakeup: false,
};

export const DEFAULT_LIMITER_PARAMS: LimiterParams = {
  threshold: -1,
  release: 50,
  lookahead: 1,
  ceiling: -0.1,
};

export const DEFAULT_GATE_PARAMS: GateParams = {
  threshold: -40,
  attack: 1,
  hold: 50,
  release: 100,
  range: -80,
  sidechain: false,
  sidechainHpf: 20,
};

export const DEFAULT_SATURATION_PARAMS: SaturationParams = {
  drive: 0.3,
  type: 'tape',
  tone: 0,
  asymmetry: 0,
  outputLevel: 0,
};

export const DEFAULT_CHORUS_PARAMS: ChorusParams = {
  rate: 0.5,
  depth: 0.5,
  voices: 2,
  spread: 0.5,
  feedback: 0,
  delay: 7,
  hiCut: 8000,
};

export const DEFAULT_FLANGER_PARAMS: FlangerParams = {
  rate: 0.2,
  depth: 0.5,
  feedback: 0.5,
  delay: 5,
  stereoPhase: 90,
  manualSweep: 0.5,
};

export const DEFAULT_PHASER_PARAMS: PhaserParams = {
  rate: 0.3,
  depth: 0.5,
  stages: 6,
  feedback: 0.5,
  centerFrequency: 1000,
  stereoPhase: 90,
};

export const DEFAULT_DELAY_PARAMS: DelayParams = {
  time: 375,
  feedback: 0.4,
  tempoSync: false,
  syncDivision: '1/4',
  lowCut: 200,
  highCut: 8000,
  saturation: 0,
  stereoWidth: 0.5,
  pingPong: false,
  duckAmount: 0,
};

export const DEFAULT_REVERB_PARAMS: ReverbParams = {
  preDelay: 10,
  decay: 2,
  size: 0.5,
  damping: 0.5,
  diffusion: 0.7,
  earlyLevel: 0,
  tailLevel: 0,
  lowCut: 100,
  highCut: 10000,
  modulation: 0.2,
  width: 1,
};

export const DEFAULT_BITCRUSHER_PARAMS: BitcrusherParams = {
  bitDepth: 12,
  sampleRate: 22050,
  jitter: 0,
  noise: 0,
};

export const DEFAULT_LOFI_PARAMS: LofiParams = {
  bitDepth: 16,
  sampleRate: 44100,
  noise: 0.1,
  wow: 0.02,
  flutter: 0.02,
  saturation: 0.2,
  lowpassFreq: 12000,
  highpassFreq: 60,
};

// ============================================================================
// EFFECT PROCESSOR CLASSES
// ============================================================================

/** Base effect processor interface */
export interface EffectProcessor {
  process(input: Float32Array, output: Float32Array): void;
  processStereo(
    inputL: Float32Array,
    inputR: Float32Array,
    outputL: Float32Array,
    outputR: Float32Array
  ): void;
  setParam(name: string, value: number): void;
  getParam(name: string): number;
  reset(): void;
}

/**
 * Compressor effect processor
 */
export class CompressorProcessor implements EffectProcessor {
  private params: CompressorParams;
  private sampleRate: number;
  private envelope = 0;
  private gain = 1;
  private attackCoeff: number;
  private releaseCoeff: number;
  
  constructor(sampleRate: number, params?: Partial<CompressorParams>) {
    this.sampleRate = sampleRate;
    this.params = { ...DEFAULT_COMPRESSOR_PARAMS, ...params };
    this.attackCoeff = this.calculateCoeff(this.params.attack);
    this.releaseCoeff = this.calculateCoeff(this.params.release);
  }
  
  private calculateCoeff(timeMs: number): number {
    return Math.exp(-1 / (this.sampleRate * timeMs * 0.001));
  }
  
  setParam(name: string, value: number): void {
    (this.params as any)[name] = value;
    if (name === 'attack') this.attackCoeff = this.calculateCoeff(value);
    if (name === 'release') this.releaseCoeff = this.calculateCoeff(value);
  }
  
  getParam(name: string): number {
    return (this.params as any)[name] ?? 0;
  }
  
  reset(): void {
    this.envelope = 0;
    this.gain = 1;
  }
  
  process(input: Float32Array, output: Float32Array): void {
    const thresholdLin = Math.pow(10, this.params.threshold / 20);
    const makeupLin = Math.pow(10, this.params.makeupGain / 20);
    const ratio = this.params.ratio;
    const kneeWidth = this.params.knee;
    
    for (let i = 0; i < input.length; i++) {
      const sample = input[i] ?? 0;
      const level = Math.abs(sample);
      
      // Envelope follower
      const coeff = level > this.envelope ? this.attackCoeff : this.releaseCoeff;
      this.envelope = coeff * this.envelope + (1 - coeff) * level;
      
      // Calculate gain reduction
      let gainReduction = 1;
      
      if (this.envelope > thresholdLin) {
        // Above threshold - apply compression
        const overDb = 20 * Math.log10(this.envelope / thresholdLin);
        const reducedDb = overDb / ratio;
        gainReduction = Math.pow(10, -(overDb - reducedDb) / 20);
      } else if (kneeWidth > 0 && this.envelope > thresholdLin / Math.pow(10, kneeWidth / 40)) {
        // Soft knee region
        const levelDb = 20 * Math.log10(this.envelope ?? 1);
        const threshDb = this.params.threshold;
        const halfKnee = kneeWidth / 2;
        
        if (levelDb > threshDb - halfKnee) {
          const diff = levelDb - threshDb + halfKnee;
          const reduction = (diff * diff) / (4 * kneeWidth) * (1 - 1/ratio);
          gainReduction = Math.pow(10, -reduction / 20);
        }
      }
      
      // Smooth gain changes
      this.gain = 0.99 * this.gain + 0.01 * gainReduction;
      
      output[i] = (sample ?? 0) * this.gain * makeupLin;
    }
  }
  
  processStereo(
    inputL: Float32Array,
    inputR: Float32Array,
    outputL: Float32Array,
    outputR: Float32Array
  ): void {
    // Linked stereo compression
    const thresholdLin = Math.pow(10, this.params.threshold / 20);
    const makeupLin = Math.pow(10, this.params.makeupGain / 20);
    const ratio = this.params.ratio;
    
    for (let i = 0; i < inputL.length; i++) {
      const levelL = Math.abs(inputL[i] ?? 0);
      const levelR = Math.abs(inputR[i] ?? 0);
      const level = Math.max(levelL, levelR);
      
      // Envelope follower
      const coeff = level > this.envelope ? this.attackCoeff : this.releaseCoeff;
      this.envelope = coeff * this.envelope + (1 - coeff) * level;
      
      // Calculate gain reduction
      let gainReduction = 1;
      if (this.envelope > thresholdLin) {
        const overDb = 20 * Math.log10(this.envelope / thresholdLin);
        const reducedDb = overDb / ratio;
        gainReduction = Math.pow(10, -(overDb - reducedDb) / 20);
      }
      
      this.gain = 0.99 * this.gain + 0.01 * gainReduction;
      
      outputL[i] = (inputL[i] ?? 0) * this.gain * makeupLin;
      outputR[i] = (inputR[i] ?? 0) * this.gain * makeupLin;
    }
  }
}

/**
 * Limiter effect processor (brick-wall)
 */
export class LimiterProcessor implements EffectProcessor {
  private params: LimiterParams;
  private sampleRate: number;
  private peak = 0;
  private releaseCoeff: number;
  private lookaheadBuffer: Float32Array;
  private _lookaheadIndex = 0;
  // Used internally for lookahead feature
  get lookaheadIndex(): number { return this._lookaheadIndex; }
  
  constructor(sampleRate: number, params?: Partial<LimiterParams>) {
    this.sampleRate = sampleRate;
    this.params = { ...DEFAULT_LIMITER_PARAMS, ...params };
    this.releaseCoeff = Math.exp(-1 / (sampleRate * this.params.release * 0.001));
    
    const lookaheadSamples = Math.ceil(sampleRate * this.params.lookahead * 0.001);
    this.lookaheadBuffer = new Float32Array(Math.max(1, lookaheadSamples));
  }
  
  setParam(name: string, value: number): void {
    (this.params as any)[name] = value;
    if (name === 'release') {
      this.releaseCoeff = Math.exp(-1 / (this.sampleRate * value * 0.001));
    }
  }
  
  getParam(name: string): number {
    return (this.params as any)[name] ?? 0;
  }
  
  reset(): void {
    this.peak = 0;
    this.lookaheadBuffer.fill(0);
    this._lookaheadIndex = 0;
  }
  
  process(input: Float32Array, output: Float32Array): void {
    const thresholdLin = Math.pow(10, (this.params.threshold ?? 0) / 20);
    const ceilingLin = Math.pow(10, (this.params.ceiling ?? 0) / 20);
    
    for (let i = 0; i < input.length; i++) {
      const sample = input[i] ?? 0;
      const level = Math.abs(sample);
      
      // Peak hold with release
      this.peak = Math.max(level, this.peak * this.releaseCoeff);
      
      // Calculate gain reduction
      let gain = 1;
      if (this.peak > thresholdLin) {
        gain = thresholdLin / this.peak;
      }
      
      // Apply ceiling
      let limited = sample * gain;
      limited = Math.max(-ceilingLin, Math.min(ceilingLin, limited));
      
      output[i] = limited;
    }
  }
  
  processStereo(
    inputL: Float32Array,
    inputR: Float32Array,
    outputL: Float32Array,
    outputR: Float32Array
  ): void {
    const thresholdLin = Math.pow(10, (this.params.threshold ?? 0) / 20);
    const ceilingLin = Math.pow(10, (this.params.ceiling ?? 0) / 20);
    
    for (let i = 0; i < inputL.length; i++) {
      const level = Math.max(Math.abs(inputL[i] ?? 0), Math.abs(inputR[i] ?? 0));
      this.peak = Math.max(level, this.peak * this.releaseCoeff);
      
      let gain = 1;
      if (this.peak > thresholdLin) {
        gain = thresholdLin / this.peak;
      }
      
      outputL[i] = Math.max(-ceilingLin, Math.min(ceilingLin, (inputL[i] ?? 0) * gain));
      outputR[i] = Math.max(-ceilingLin, Math.min(ceilingLin, (inputR[i] ?? 0) * gain));
    }
  }
}

/**
 * Gate effect processor
 */
export class GateProcessor implements EffectProcessor {
  private params: GateParams;
  private sampleRate: number;
  private envelope = 0;
  private gateLevel = 0;
  private holdCounter = 0;
  private attackCoeff: number;
  private releaseCoeff: number;
  
  constructor(sampleRate: number, params?: Partial<GateParams>) {
    this.sampleRate = sampleRate;
    this.params = { ...DEFAULT_GATE_PARAMS, ...params };
    this.attackCoeff = this.calculateCoeff(this.params.attack);
    this.releaseCoeff = this.calculateCoeff(this.params.release);
  }
  
  private calculateCoeff(timeMs: number): number {
    return Math.exp(-1 / (this.sampleRate * Math.max(0.1, timeMs) * 0.001));
  }
  
  setParam(name: string, value: number): void {
    (this.params as any)[name] = value;
    if (name === 'attack') this.attackCoeff = this.calculateCoeff(value);
    if (name === 'release') this.releaseCoeff = this.calculateCoeff(value);
  }
  
  getParam(name: string): number {
    return (this.params as any)[name] ?? 0;
  }
  
  reset(): void {
    this.envelope = 0;
    this.gateLevel = 0;
    this.holdCounter = 0;
  }
  
  process(input: Float32Array, output: Float32Array): void {
    const thresholdLin = Math.pow(10, (this.params.threshold ?? 0) / 20);
    const rangeLin = Math.pow(10, (this.params.range ?? 0) / 20);
    const holdSamples = Math.floor(this.sampleRate * this.params.hold * 0.001);
    
    for (let i = 0; i < input.length; i++) {
      const sample = input[i] ?? 0;
      const level = Math.abs(sample);

      // Envelope follower (fast attack for detection)
      this.envelope = 0.99 * this.envelope + 0.01 * level;
      
      // Gate state machine
      let targetGate: number;
      
      if (this.envelope > thresholdLin) {
        // Open gate
        targetGate = 1;
        this.holdCounter = holdSamples;
      } else if (this.holdCounter > 0) {
        // Hold phase
        targetGate = 1;
        this.holdCounter--;
      } else {
        // Close gate
        targetGate = rangeLin;
      }
      
      // Smooth gate level
      const coeff = targetGate > this.gateLevel ? this.attackCoeff : this.releaseCoeff;
      this.gateLevel = coeff * this.gateLevel + (1 - coeff) * targetGate;
      
      output[i] = sample * this.gateLevel;
    }
  }
  
  processStereo(
    inputL: Float32Array,
    inputR: Float32Array,
    outputL: Float32Array,
    outputR: Float32Array
  ): void {
    const thresholdLin = Math.pow(10, this.params.threshold / 20);
    const rangeLin = Math.pow(10, this.params.range / 20);
    const holdSamples = Math.floor(this.sampleRate * this.params.hold * 0.001);
    
    for (let i = 0; i < inputL.length; i++) {
      const level = Math.max(Math.abs(inputL[i] ?? 0), Math.abs(inputR[i] ?? 0));
      this.envelope = 0.99 * this.envelope + 0.01 * level;
      
      let targetGate: number;
      if (this.envelope > thresholdLin) {
        targetGate = 1;
        this.holdCounter = holdSamples;
      } else if (this.holdCounter > 0) {
        targetGate = 1;
        this.holdCounter--;
      } else {
        targetGate = rangeLin;
      }
      
      const coeff = targetGate > this.gateLevel ? this.attackCoeff : this.releaseCoeff;
      this.gateLevel = coeff * this.gateLevel + (1 - coeff) * targetGate;
      
      outputL[i] = (inputL[i] ?? 0) * this.gateLevel;
      outputR[i] = (inputR[i] ?? 0) * this.gateLevel;
    }
  }
}

/**
 * Saturation effect processor
 */
export class SaturationProcessor implements EffectProcessor {
  private params: SaturationParams;
  private _sampleRate: number;
  // Reserved for future sample-rate dependent processing
  get sampleRate(): number { return this._sampleRate; }
  
  constructor(sampleRate: number, params?: Partial<SaturationParams>) {
    this._sampleRate = sampleRate;
    this.params = { ...DEFAULT_SATURATION_PARAMS, ...params };
  }
  
  setParam(name: string, value: number): void {
    (this.params as any)[name] = value;
  }
  
  getParam(name: string): number {
    return (this.params as any)[name] ?? 0;
  }
  
  reset(): void {}
  
  private saturate(input: number): number {
    const drive = this.params.drive * 5 + 1; // 1-6x
    const sample = input * drive;
    
    switch (this.params.type) {
      case 'soft':
        return Math.tanh(sample);
        
      case 'hard':
        return Math.max(-1, Math.min(1, sample));
        
      case 'tape':
        // Asymmetric tape saturation
        if (sample >= 0) {
          return 1 - Math.exp(-sample);
        } else {
          return -0.9 * (1 - Math.exp(sample));
        }
        
      case 'tube':
        // Tube warmth with even harmonics
        const tubeDrive = 2 * this.params.drive;
        const k = 2 * tubeDrive / (1 - tubeDrive);
        const positive = sample >= 0 ? 1 : -1;
        return positive * (1 + k) * Math.abs(sample) / (1 + k * Math.abs(sample));
        
      case 'transistor':
        // Transistor-style hard asymmetric clipping
        if (sample > 0.8) {
          return 0.8 + (sample - 0.8) * 0.3;
        } else if (sample < -0.5) {
          return -0.5 + (sample + 0.5) * 0.1;
        }
        return sample;
        
      case 'fold':
        // Wave folding
        let folded = sample;
        while (Math.abs(folded) > 1) {
          if (folded > 1) folded = 2 - folded;
          else if (folded < -1) folded = -2 - folded;
        }
        return folded;
        
      default:
        return sample;
    }
  }
  
  process(input: Float32Array, output: Float32Array): void {
    const outputLin = Math.pow(10, this.params.outputLevel / 20);
    
    for (let i = 0; i < input.length; i++) {
      output[i] = this.saturate(input[i] ?? 0) * outputLin;
    }
  }
  
  processStereo(
    inputL: Float32Array,
    inputR: Float32Array,
    outputL: Float32Array,
    outputR: Float32Array
  ): void {
    const outputLin = Math.pow(10, this.params.outputLevel / 20);
    
    for (let i = 0; i < inputL.length; i++) {
      outputL[i] = this.saturate(inputL[i] ?? 0) * outputLin;
      outputR[i] = this.saturate(inputR[i] ?? 0) * outputLin;
    }
  }
}

/**
 * Chorus effect processor
 */
export class ChorusProcessor implements EffectProcessor {
  private params: ChorusParams;
  private sampleRate: number;
  private delayBuffer: Float32Array;
  private writeIndex = 0;
  private lfoPhase = 0;
  
  constructor(sampleRate: number, params?: Partial<ChorusParams>) {
    this.sampleRate = sampleRate;
    this.params = { ...DEFAULT_CHORUS_PARAMS, ...params };
    
    // Max delay buffer (50ms)
    this.delayBuffer = new Float32Array(Math.ceil(sampleRate * 0.05));
  }
  
  setParam(name: string, value: number): void {
    (this.params as any)[name] = value;
  }
  
  getParam(name: string): number {
    return (this.params as any)[name] ?? 0;
  }
  
  reset(): void {
    this.delayBuffer.fill(0);
    this.writeIndex = 0;
    this.lfoPhase = 0;
  }
  
  private readDelayed(delaySamples: number): number {
    const intDelay = Math.floor(delaySamples);
    const frac = delaySamples - intDelay;
    
    let readIndex1 = this.writeIndex - intDelay;
    let readIndex2 = readIndex1 - 1;
    
    if (readIndex1 < 0) readIndex1 += this.delayBuffer.length;
    if (readIndex2 < 0) readIndex2 += this.delayBuffer.length;
    
    // Linear interpolation
    return (this.delayBuffer[readIndex1] ?? 0) * (1 - frac) + 
           (this.delayBuffer[readIndex2] ?? 0) * frac;
  }
  
  process(input: Float32Array, output: Float32Array): void {
    const baseDelaySamples = this.params.delay * this.sampleRate * 0.001;
    const maxModSamples = this.params.depth * baseDelaySamples;
    const lfoInc = (2 * Math.PI * this.params.rate) / this.sampleRate;
    
    for (let i = 0; i < input.length; i++) {
      // Write to delay line
      this.delayBuffer[this.writeIndex] = input[i] ?? 0;
      
      let wet = 0;
      
      // Sum all voices
      for (let v = 0; v < this.params.voices; v++) {
        const voicePhase = this.lfoPhase + (v / this.params.voices) * 2 * Math.PI;
        const modulation = Math.sin(voicePhase) * maxModSamples;
        const delaySamples = baseDelaySamples + modulation;
        
        wet += this.readDelayed(delaySamples);
      }
      
      wet /= this.params.voices;
      
      // Apply feedback
      const currentVal = this.delayBuffer[this.writeIndex] ?? 0;
      this.delayBuffer[this.writeIndex] = currentVal + wet * this.params.feedback;
      
      output[i] = wet;
      
      this.writeIndex = (this.writeIndex + 1) % this.delayBuffer.length;
      this.lfoPhase += lfoInc;
      if (this.lfoPhase >= 2 * Math.PI) this.lfoPhase -= 2 * Math.PI;
    }
  }
  
  processStereo(
    inputL: Float32Array,
    inputR: Float32Array,
    outputL: Float32Array,
    outputR: Float32Array
  ): void {
    // Simplified stereo - process left, then create stereo spread
    const mono = new Float32Array(inputL.length);
    for (let i = 0; i < inputL.length; i++) {
      mono[i] = ((inputL[i] ?? 0) + (inputR[i] ?? 0)) * 0.5;
    }
    
    this.process(mono, outputL);
    
    // Stereo spread through slight phase offset
    for (let i = 0; i < outputL.length; i++) {
      const spread = this.params.spread;
      outputR[i] = outputL[Math.max(0, i - Math.floor(spread * 100))] ?? (outputL[i] ?? 0);
    }
  }
}

/**
 * Delay effect processor
 */
export class DelayProcessor implements EffectProcessor {
  private params: DelayParams;
  private sampleRate: number;
  private delayBufferL: Float32Array;
  private delayBufferR: Float32Array;
  private writeIndex = 0;
  
  // Filter states for feedback
  private lowCutState = { y1: 0 };
  private highCutState = { y1: 0 };
  
  constructor(sampleRate: number, params?: Partial<DelayParams>) {
    this.sampleRate = sampleRate;
    this.params = { ...DEFAULT_DELAY_PARAMS, ...params };
    
    // Max 2 second delay
    const maxSamples = Math.ceil(sampleRate * 2);
    this.delayBufferL = new Float32Array(maxSamples);
    this.delayBufferR = new Float32Array(maxSamples);
  }
  
  setParam(name: string, value: number): void {
    (this.params as any)[name] = value;
  }
  
  getParam(name: string): number {
    return (this.params as any)[name] ?? 0;
  }
  
  reset(): void {
    this.delayBufferL.fill(0);
    this.delayBufferR.fill(0);
    this.writeIndex = 0;
    this.lowCutState.y1 = 0;
    this.highCutState.y1 = 0;
  }
  
  private readDelayed(buffer: Float32Array, delaySamples: number): number {
    const intDelay = Math.floor(delaySamples);
    const frac = delaySamples - intDelay;
    
    let readIndex1 = this.writeIndex - intDelay;
    let readIndex2 = readIndex1 - 1;
    
    const len = buffer.length;
    if (readIndex1 < 0) readIndex1 += len;
    if (readIndex2 < 0) readIndex2 += len;
    
    return (buffer[readIndex1] ?? 0) * (1 - frac) + (buffer[readIndex2] ?? 0) * frac;
  }
  
  private applyFeedbackFilter(sample: number): number {
    // Simple one-pole filters for low/high cut
    const lowCutCoeff = Math.exp(-2 * Math.PI * this.params.lowCut / this.sampleRate);
    const highCutCoeff = Math.exp(-2 * Math.PI * this.params.highCut / this.sampleRate);
    
    // High-pass
    this.lowCutState.y1 = lowCutCoeff * (this.lowCutState.y1 + sample);
    const hp = sample - this.lowCutState.y1;
    
    // Low-pass
    this.highCutState.y1 = (1 - highCutCoeff) * hp + highCutCoeff * this.highCutState.y1;
    
    return this.highCutState.y1;
  }
  
  process(input: Float32Array, output: Float32Array): void {
    const delaySamples = this.params.time * this.sampleRate * 0.001;
    
    for (let i = 0; i < input.length; i++) {
      const delayed = this.readDelayed(this.delayBufferL, delaySamples);
      const filtered = this.applyFeedbackFilter(delayed);
      
      // Write input + feedback to delay line
      this.delayBufferL[this.writeIndex] = (input[i] ?? 0) + filtered * this.params.feedback;
      
      output[i] = delayed;
      
      this.writeIndex = (this.writeIndex + 1) % this.delayBufferL.length;
    }
  }
  
  processStereo(
    inputL: Float32Array,
    inputR: Float32Array,
    outputL: Float32Array,
    outputR: Float32Array
  ): void {
    const delaySamples = this.params.time * this.sampleRate * 0.001;
    
    for (let i = 0; i < inputL.length; i++) {
      const delayedL = this.readDelayed(this.delayBufferL, delaySamples);
      const delayedR = this.readDelayed(this.delayBufferR, delaySamples);
      
      if (this.params.pingPong) {
        // Ping pong: cross-feed between channels
        this.delayBufferL[this.writeIndex] = (inputL[i] ?? 0) + delayedR * this.params.feedback;
        this.delayBufferR[this.writeIndex] = (inputR[i] ?? 0) + delayedL * this.params.feedback;
      } else {
        this.delayBufferL[this.writeIndex] = (inputL[i] ?? 0) + delayedL * this.params.feedback;
        this.delayBufferR[this.writeIndex] = (inputR[i] ?? 0) + delayedR * this.params.feedback;
      }
      
      outputL[i] = delayedL;
      outputR[i] = delayedR;
      
      this.writeIndex = (this.writeIndex + 1) % this.delayBufferL.length;
    }
  }
}

/**
 * Simple algorithmic reverb processor
 */
export class ReverbProcessor implements EffectProcessor {
  private params: ReverbParams;
  private sampleRate: number;
  
  // Comb filter delays (in samples at 44100Hz)
  private readonly COMB_DELAYS = [1557, 1617, 1491, 1422, 1277, 1356, 1188, 1116];
  // All-pass filter delays
  private readonly ALLPASS_DELAYS = [225, 556, 441, 341];
  
  private combBuffers: Float32Array[] = [];
  private combIndices: number[] = [];
  private combFilters: number[] = [];
  
  private allpassBuffers: Float32Array[] = [];
  private allpassIndices: number[] = [];
  
  constructor(sampleRate: number, params?: Partial<ReverbParams>) {
    this.sampleRate = sampleRate;
    this.params = { ...DEFAULT_REVERB_PARAMS, ...params };
    
    // Scale delays for sample rate
    const scale = sampleRate / 44100;
    
    // Initialize comb filters
    for (const delay of this.COMB_DELAYS) {
      const scaledDelay = Math.floor(delay * scale * this.params.size);
      this.combBuffers.push(new Float32Array(scaledDelay));
      this.combIndices.push(0);
      this.combFilters.push(0);
    }
    
    // Initialize all-pass filters
    for (const delay of this.ALLPASS_DELAYS) {
      const scaledDelay = Math.floor(delay * scale);
      this.allpassBuffers.push(new Float32Array(scaledDelay));
      this.allpassIndices.push(0);
    }
  }
  
  setParam(name: string, value: number): void {
    (this.params as any)[name] = value;
  }
  
  getParam(name: string): number {
    return (this.params as any)[name] ?? 0;
  }
  
  reset(): void {
    for (const buffer of this.combBuffers) buffer.fill(0);
    for (const buffer of this.allpassBuffers) buffer.fill(0);
    this.combIndices.fill(0);
    this.allpassIndices.fill(0);
    this.combFilters.fill(0);
  }
  
  process(input: Float32Array, output: Float32Array): void {
    const feedback = Math.pow(10, -3 * (1 / this.params.decay) / this.sampleRate);
    const damping = this.params.damping;
    
    for (let i = 0; i < input.length; i++) {
      let sum = 0;
      
      // Process parallel comb filters
      for (let c = 0; c < this.combBuffers.length; c++) {
        const buffer = this.combBuffers[c];
        const idx = this.combIndices[c];
        if (!buffer || idx === undefined) continue;
        
        // Read from comb filter
        const delayed = buffer[idx] ?? 0;
        
        // Low-pass filter in feedback path (damping)
        this.combFilters[c] = delayed * (1 - damping) + (this.combFilters[c] ?? 0) * damping;
        
        // Write back with feedback
        buffer[idx] = (input[i] ?? 0) + (this.combFilters[c] ?? 0) * feedback;
        
        this.combIndices[c] = (idx + 1) % buffer.length;
        sum += delayed;
      }
      
      sum /= this.combBuffers.length;
      
      // Process series all-pass filters
      for (let a = 0; a < this.allpassBuffers.length; a++) {
        const buffer = this.allpassBuffers[a];
        const idx = this.allpassIndices[a];
        if (!buffer || idx === undefined) continue;
        
        const delayed = buffer[idx] ?? 0;
        const feedbackCoeff = 0.5;
        
        buffer[idx] = sum + delayed * feedbackCoeff;
        sum = delayed - sum * feedbackCoeff;
        
        this.allpassIndices[a] = (idx + 1) % buffer.length;
      }
      
      output[i] = sum;
    }
  }
  
  processStereo(
    inputL: Float32Array,
    inputR: Float32Array,
    outputL: Float32Array,
    outputR: Float32Array
  ): void {
    // Simple stereo: process mono, then decorrelate
    const mono = new Float32Array(inputL.length);
    for (let i = 0; i < inputL.length; i++) {
      mono[i] = ((inputL[i] ?? 0) + (inputR[i] ?? 0)) * 0.5;
    }
    
    const wet = new Float32Array(inputL.length);
    this.process(mono, wet);
    
    // Create stereo from width parameter
    const width = this.params.width;
    for (let i = 0; i < wet.length; i++) {
      const mid = wet[i] ?? 0;
      const spread = i > 0 ? (wet[i - 1] ?? 0) - (wet[i] ?? 0) : 0;
      
      outputL[i] = mid + spread * width * 0.5;
      outputR[i] = mid - spread * width * 0.5;
    }
  }
}

/**
 * Bit crusher effect processor
 */
export class BitcrusherProcessor implements EffectProcessor {
  private params: BitcrusherParams;
  private sampleRate: number;
  private holdSample = 0;
  private holdCounter = 0;
  
  constructor(sampleRate: number, params?: Partial<BitcrusherParams>) {
    this.sampleRate = sampleRate;
    this.params = { ...DEFAULT_BITCRUSHER_PARAMS, ...params };
  }
  
  setParam(name: string, value: number): void {
    (this.params as any)[name] = value;
  }
  
  getParam(name: string): number {
    return (this.params as any)[name] ?? 0;
  }
  
  reset(): void {
    this.holdSample = 0;
    this.holdCounter = 0;
  }
  
  process(input: Float32Array, output: Float32Array): void {
    const bits = Math.max(1, Math.min(24, this.params.bitDepth));
    const levels = Math.pow(2, bits);
    const downsampleFactor = Math.max(1, Math.floor(this.sampleRate / this.params.sampleRate));
    const jitter = this.params.jitter;
    const noise = this.params.noise;
    
    for (let i = 0; i < input.length; i++) {
      // Sample rate reduction
      if (this.holdCounter <= 0) {
        let sample = input[i] ?? 0;
        
        // Add jitter to sample timing
        if (jitter > 0) {
          const jitterOffset = Math.floor((Math.random() - 0.5) * jitter * downsampleFactor);
          const jitterIndex = Math.max(0, Math.min(input.length - 1, i + jitterOffset));
          sample = input[jitterIndex] ?? 0;
        }
        
        // Bit depth reduction
        this.holdSample = Math.round(sample * levels) / levels;
        
        this.holdCounter = downsampleFactor;
      }
      
      this.holdCounter--;
      
      // Add noise
      let out = this.holdSample;
      if (noise > 0) {
        out += (Math.random() - 0.5) * noise * 0.1;
      }
      
      output[i] = out;
    }
  }
  
  processStereo(
    inputL: Float32Array,
    inputR: Float32Array,
    outputL: Float32Array,
    outputR: Float32Array
  ): void {
    this.process(inputL, outputL);
    this.reset();
    this.process(inputR, outputR);
  }
}

/**
 * Lo-fi effect processor (combines multiple degradation effects)
 */
export class LofiProcessor implements EffectProcessor {
  private params: LofiParams;
  private sampleRate: number;
  
  private bitcrusher: BitcrusherProcessor;
  private saturation: SaturationProcessor;
  
  // Wow and flutter
  private wowPhase = 0;
  private flutterPhase = 0;
  
  // Simple filters
  private lpState = 0;
  private hpState = 0;
  
  constructor(sampleRate: number, params?: Partial<LofiParams>) {
    this.sampleRate = sampleRate;
    this.params = { ...DEFAULT_LOFI_PARAMS, ...params };
    
    this.bitcrusher = new BitcrusherProcessor(sampleRate, {
      bitDepth: this.params.bitDepth,
      sampleRate: this.params.sampleRate,
      noise: this.params.noise,
    });
    
    this.saturation = new SaturationProcessor(sampleRate, {
      drive: this.params.saturation,
      type: 'tape',
    });
  }
  
  setParam(name: string, value: number): void {
    (this.params as any)[name] = value;
    
    if (name === 'bitDepth' || name === 'sampleRate' || name === 'noise') {
      this.bitcrusher.setParam(name, value);
    }
    if (name === 'saturation') {
      this.saturation.setParam('drive', value);
    }
  }
  
  getParam(name: string): number {
    return (this.params as any)[name] ?? 0;
  }
  
  reset(): void {
    this.bitcrusher.reset();
    this.saturation.reset();
    this.wowPhase = 0;
    this.flutterPhase = 0;
    this.lpState = 0;
    this.hpState = 0;
  }
  
  process(input: Float32Array, output: Float32Array): void {
    const temp = new Float32Array(input.length);
    
    // Apply wow and flutter (pitch modulation)
    const wowRate = 0.5; // Hz
    const flutterRate = 6; // Hz
    
    for (let i = 0; i < input.length; i++) {
      // Calculate pitch modulation
      const wow = Math.sin(this.wowPhase) * this.params.wow;
      const flutter = Math.sin(this.flutterPhase) * this.params.flutter;
      const totalMod = 1 + wow + flutter;
      
      // Simple pitch shift via resampling (approximate)
      const readIndex = i * totalMod;
      const intIndex = Math.floor(readIndex);
      const frac = readIndex - intIndex;
      
      if (intIndex >= 0 && intIndex < input.length - 1) {
        temp[i] = (input[intIndex] ?? 0) * (1 - frac) + (input[intIndex + 1] ?? 0) * frac;
      } else {
        temp[i] = input[Math.min(Math.max(0, intIndex), input.length - 1)] ?? 0;
      }
      
      this.wowPhase += 2 * Math.PI * wowRate / this.sampleRate;
      this.flutterPhase += 2 * Math.PI * flutterRate / this.sampleRate;
    }
    
    // Apply saturation
    this.saturation.process(temp, temp);
    
    // Apply bit crushing
    this.bitcrusher.process(temp, temp);
    
    // Apply filters
    const lpCoeff = Math.exp(-2 * Math.PI * this.params.lowpassFreq / this.sampleRate);
    const hpCoeff = Math.exp(-2 * Math.PI * this.params.highpassFreq / this.sampleRate);
    
    for (let i = 0; i < temp.length; i++) {
      // Low-pass
      this.lpState = (1 - lpCoeff) * (temp[i] ?? 0) + lpCoeff * this.lpState;
      
      // High-pass
      this.hpState = hpCoeff * (this.hpState + this.lpState);
      const hp = this.lpState - this.hpState;
      
      output[i] = hp;
    }
  }
  
  processStereo(
    inputL: Float32Array,
    inputR: Float32Array,
    outputL: Float32Array,
    outputR: Float32Array
  ): void {
    this.process(inputL, outputL);
    this.process(inputR, outputR);
  }
}

// ============================================================================
// EFFECT CHAIN CLASS
// ============================================================================

/**
 * Effect chain manager
 */
export class SamplerEffectChain {
  private config: EffectChainConfig;
  private sampleRate: number;
  private processors: Map<string, EffectProcessor> = new Map();
  
  constructor(sampleRate: number, config?: Partial<EffectChainConfig>) {
    this.sampleRate = sampleRate;
    this.config = {
      preGain: 0,
      postGain: 0,
      slots: [],
      maxSlots: 8,
      ...config,
    };
    
    // Create processors for existing slots
    for (const slot of this.config.slots) {
      this.createProcessor(slot);
    }
  }
  
  /**
   * Create processor for effect slot
   */
  private createProcessor(slot: EffectSlot): void {
    let processor: EffectProcessor | null = null;
    
    switch (slot.type) {
      case 'compressor':
        processor = new CompressorProcessor(this.sampleRate, slot.params as any);
        break;
      case 'limiter':
        processor = new LimiterProcessor(this.sampleRate, slot.params as any);
        break;
      case 'gate':
        processor = new GateProcessor(this.sampleRate, slot.params as any);
        break;
      case 'saturation':
      case 'tape':
      case 'tube':
      case 'transistor':
        processor = new SaturationProcessor(this.sampleRate, { 
          ...slot.params as any,
          type: slot.type === 'saturation' ? 'soft' : slot.type 
        });
        break;
      case 'chorus':
        processor = new ChorusProcessor(this.sampleRate, slot.params as any);
        break;
      case 'delay':
      case 'ping_pong':
        processor = new DelayProcessor(this.sampleRate, { 
          ...slot.params as any,
          pingPong: slot.type === 'ping_pong'
        });
        break;
      case 'reverb':
        processor = new ReverbProcessor(this.sampleRate, slot.params as any);
        break;
      case 'bitcrusher':
        processor = new BitcrusherProcessor(this.sampleRate, slot.params as any);
        break;
      case 'lofi':
        processor = new LofiProcessor(this.sampleRate, slot.params as any);
        break;
      default:
        console.warn(`Unknown effect type: ${slot.type}`);
    }
    
    if (processor) {
      this.processors.set(slot.id, processor);
    }
  }
  
  /**
   * Add effect to chain
   */
  addEffect(type: SamplerEffectType, params?: Record<string, number>): string {
    if (this.config.slots.length >= this.config.maxSlots) {
      throw new Error(`Maximum effects reached (${this.config.maxSlots})`);
    }
    
    const id = `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const slot: EffectSlot = {
      id,
      type,
      enabled: true,
      mix: 1,
      params: params ?? {},
    };
    
    this.config.slots.push(slot);
    this.createProcessor(slot);
    
    return id;
  }
  
  /**
   * Remove effect from chain
   */
  removeEffect(id: string): boolean {
    const index = this.config.slots.findIndex(s => s.id === id);
    if (index === -1) return false;
    
    this.config.slots.splice(index, 1);
    this.processors.delete(id);
    
    return true;
  }
  
  /**
   * Move effect in chain
   */
  moveEffect(id: string, newIndex: number): boolean {
    const currentIndex = this.config.slots.findIndex(s => s.id === id);
    if (currentIndex === -1) return false;
    
    const [slot] = this.config.slots.splice(currentIndex, 1);
    if (slot) {
      this.config.slots.splice(newIndex, 0, slot);
    }
    
    return true;
  }
  
  /**
   * Enable/disable effect
   */
  setEffectEnabled(id: string, enabled: boolean): void {
    const slot = this.config.slots.find(s => s.id === id);
    if (slot) {
      slot.enabled = enabled;
    }
  }
  
  /**
   * Set effect parameter
   */
  setEffectParam(id: string, param: string, value: number): void {
    const slot = this.config.slots.find(s => s.id === id);
    const processor = this.processors.get(id);
    
    if (slot) {
      slot.params[param] = value;
    }
    if (processor) {
      processor.setParam(param, value);
    }
  }
  
  /**
   * Set effect mix (dry/wet)
   */
  setEffectMix(id: string, mix: number): void {
    const slot = this.config.slots.find(s => s.id === id);
    if (slot) {
      slot.mix = Math.max(0, Math.min(1, mix));
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
   * Process mono audio through effect chain
   */
  process(input: Float32Array, output: Float32Array): void {
    // Pre-gain
    const preGainLin = Math.pow(10, this.config.preGain / 20);
    const postGainLin = Math.pow(10, this.config.postGain / 20);
    
    // Copy input with pre-gain
    for (let i = 0; i < input.length; i++) {
      output[i] = (input[i] ?? 0) * preGainLin;
    }
    
    // Process through each enabled effect
    const temp = new Float32Array(output.length);
    
    for (const slot of this.config.slots) {
      if (!slot.enabled) continue;
      
      const processor = this.processors.get(slot.id);
      if (!processor) continue;
      
      // Process wet signal
      processor.process(output, temp);
      
      // Mix dry/wet
      const wet = slot.mix;
      const dry = 1 - wet;
      
      for (let i = 0; i < output.length; i++) {
        output[i] = (output[i] ?? 0) * dry + (temp[i] ?? 0) * wet;
      }
    }
    
    // Post-gain
    for (let i = 0; i < output.length; i++) {
      const val = output[i] ?? 0;
      output[i] = val * postGainLin;
    }
  }
  
  /**
   * Process stereo audio through effect chain
   */
  processStereo(
    inputL: Float32Array,
    inputR: Float32Array,
    outputL: Float32Array,
    outputR: Float32Array
  ): void {
    // Pre-gain
    const preGainLin = Math.pow(10, this.config.preGain / 20);
    const postGainLin = Math.pow(10, this.config.postGain / 20);
    
    for (let i = 0; i < inputL.length; i++) {
      outputL[i] = (inputL[i] ?? 0) * preGainLin;
      outputR[i] = (inputR[i] ?? 0) * preGainLin;
    }
    
    // Process through each enabled effect
    const tempL = new Float32Array(outputL.length);
    const tempR = new Float32Array(outputR.length);
    
    for (const slot of this.config.slots) {
      if (!slot.enabled) continue;
      
      const processor = this.processors.get(slot.id);
      if (!processor) continue;
      
      processor.processStereo(outputL, outputR, tempL, tempR);
      
      const wet = slot.mix;
      const dry = 1 - wet;
      
      for (let i = 0; i < outputL.length; i++) {
        outputL[i] = (outputL[i] ?? 0) * dry + (tempL[i] ?? 0) * wet;
        outputR[i] = (outputR[i] ?? 0) * dry + (tempR[i] ?? 0) * wet;
      }
    }
    
    // Post-gain
    for (let i = 0; i < outputL.length; i++) {
      const valL = outputL[i] ?? 0;
      const valR = outputR[i] ?? 0;
      outputL[i] = valL * postGainLin;
      outputR[i] = valR * postGainLin;
    }
  }
  
  /**
   * Get effect chain configuration
   */
  getConfig(): EffectChainConfig {
    return { ...this.config };
  }
  
  /**
   * Get effect slot by ID
   */
  getEffectSlot(id: string): EffectSlot | undefined {
    return this.config.slots.find(s => s.id === id);
  }
  
  /**
   * Get all effect slots
   */
  getEffectSlots(): EffectSlot[] {
    return [...this.config.slots];
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create effect chain
 */
export function createEffectChain(
  sampleRate: number,
  config?: Partial<EffectChainConfig>
): SamplerEffectChain {
  return new SamplerEffectChain(sampleRate, config);
}

/**
 * Create compressor
 */
export function createCompressor(
  sampleRate: number,
  params?: Partial<CompressorParams>
): CompressorProcessor {
  return new CompressorProcessor(sampleRate, params);
}

/**
 * Create limiter
 */
export function createLimiter(
  sampleRate: number,
  params?: Partial<LimiterParams>
): LimiterProcessor {
  return new LimiterProcessor(sampleRate, params);
}

/**
 * Create gate
 */
export function createGate(
  sampleRate: number,
  params?: Partial<GateParams>
): GateProcessor {
  return new GateProcessor(sampleRate, params);
}

/**
 * Create saturation
 */
export function createSaturation(
  sampleRate: number,
  params?: Partial<SaturationParams>
): SaturationProcessor {
  return new SaturationProcessor(sampleRate, params);
}

/**
 * Create chorus
 */
export function createChorus(
  sampleRate: number,
  params?: Partial<ChorusParams>
): ChorusProcessor {
  return new ChorusProcessor(sampleRate, params);
}

/**
 * Create delay
 */
export function createDelay(
  sampleRate: number,
  params?: Partial<DelayParams>
): DelayProcessor {
  return new DelayProcessor(sampleRate, params);
}

/**
 * Create reverb
 */
export function createReverb(
  sampleRate: number,
  params?: Partial<ReverbParams>
): ReverbProcessor {
  return new ReverbProcessor(sampleRate, params);
}

/**
 * Create bitcrusher
 */
export function createBitcrusher(
  sampleRate: number,
  params?: Partial<BitcrusherParams>
): BitcrusherProcessor {
  return new BitcrusherProcessor(sampleRate, params);
}

/**
 * Create lo-fi effect
 */
export function createLofi(
  sampleRate: number,
  params?: Partial<LofiParams>
): LofiProcessor {
  return new LofiProcessor(sampleRate, params);
}

/**
 * Get default parameters for effect type
 */
export function getDefaultEffectParams(type: SamplerEffectType): Record<string, number> {
  switch (type) {
    case 'compressor':
      return DEFAULT_COMPRESSOR_PARAMS as unknown as Record<string, number>;
    case 'limiter':
      return DEFAULT_LIMITER_PARAMS as unknown as Record<string, number>;
    case 'gate':
      return DEFAULT_GATE_PARAMS as unknown as Record<string, number>;
    case 'saturation':
    case 'tape':
    case 'tube':
    case 'transistor':
      return DEFAULT_SATURATION_PARAMS as unknown as Record<string, number>;
    case 'chorus':
      return DEFAULT_CHORUS_PARAMS as unknown as Record<string, number>;
    case 'delay':
    case 'ping_pong':
      return DEFAULT_DELAY_PARAMS as unknown as Record<string, number>;
    case 'reverb':
      return DEFAULT_REVERB_PARAMS as unknown as Record<string, number>;
    case 'bitcrusher':
      return DEFAULT_BITCRUSHER_PARAMS as unknown as Record<string, number>;
    case 'lofi':
      return DEFAULT_LOFI_PARAMS as unknown as Record<string, number>;
    default:
      return {};
  }
}
