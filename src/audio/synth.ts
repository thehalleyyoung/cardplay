/**
 * @fileoverview Synthesizer Engine.
 * 
 * Provides a complete virtual analog synthesizer with:
 * - Multiple oscillator types (saw, square, triangle, sine, noise)
 * - Wavetable oscillator support
 * - FM synthesis
 * - Subtractive filtering (LP, HP, BP)
 * - ADSR envelopes for amplitude and filter
 * - LFO modulation
 * - Effects (chorus, phaser, delay, reverb)
 */

// ============================================================================
// OSCILLATOR TYPES
// ============================================================================

/**
 * Basic oscillator waveform types.
 */
export type OscillatorWaveform = 
  | 'sine'
  | 'triangle'
  | 'sawtooth'
  | 'square'
  | 'pulse'    // Variable duty cycle
  | 'noise'    // White noise
  | 'wavetable';

/**
 * Oscillator parameters.
 */
export interface OscillatorParams {
  readonly waveform: OscillatorWaveform;
  readonly frequency: number;
  readonly detune: number;          // Cents (-100 to 100)
  readonly pulseWidth?: number;     // For pulse wave (0-1)
  readonly gain: number;            // 0-1
  readonly pan?: number;            // -1 to 1
}

/**
 * Default oscillator parameters.
 */
export const DEFAULT_OSCILLATOR: OscillatorParams = {
  waveform: 'sawtooth',
  frequency: 440,
  detune: 0,
  gain: 1,
};

// ============================================================================
// WAVETABLE
// ============================================================================

/**
 * Wavetable definition.
 */
export interface Wavetable {
  readonly name: string;
  readonly frames: readonly Float32Array[];
  readonly samplesPerFrame: number;
}

/**
 * Creates a single-cycle wavetable from frames.
 */
export function createWavetable(
  name: string,
  frames: readonly Float32Array[]
): Wavetable {
  return {
    name,
    frames,
    samplesPerFrame: frames[0]?.length ?? 0,
  };
}

/**
 * Generates a basic wavetable for a waveform.
 */
export function generateBasicWavetable(
  waveform: OscillatorWaveform,
  samples: number = 2048
): Float32Array {
  const buffer = new Float32Array(samples);
  
  switch (waveform) {
    case 'sine':
      for (let i = 0; i < samples; i++) {
        buffer[i] = Math.sin(2 * Math.PI * i / samples);
      }
      break;
      
    case 'triangle':
      for (let i = 0; i < samples; i++) {
        const phase = i / samples;
        buffer[i] = 4 * Math.abs(phase - 0.5) - 1;
      }
      break;
      
    case 'sawtooth':
      for (let i = 0; i < samples; i++) {
        buffer[i] = 2 * (i / samples) - 1;
      }
      break;
      
    case 'square':
      for (let i = 0; i < samples; i++) {
        buffer[i] = i < samples / 2 ? 1 : -1;
      }
      break;
      
    case 'pulse':
      for (let i = 0; i < samples; i++) {
        buffer[i] = i < samples / 4 ? 1 : -1;
      }
      break;
      
    case 'noise':
      for (let i = 0; i < samples; i++) {
        buffer[i] = Math.random() * 2 - 1;
      }
      break;
      
    default:
      buffer.fill(0);
  }
  
  return buffer;
}

// ============================================================================
// OSCILLATOR
// ============================================================================

/**
 * Basic oscillator implementation.
 */
export class Oscillator {
  private phase = 0;
  private params: OscillatorParams;
  private readonly sampleRate: number;
  private wavetable: Float32Array | null = null;

  constructor(params: Partial<OscillatorParams> = {}, sampleRate: number = 48000) {
    this.params = { ...DEFAULT_OSCILLATOR, ...params };
    this.sampleRate = sampleRate;
    
    if (this.params.waveform !== 'noise' && this.params.waveform !== 'wavetable') {
      this.wavetable = generateBasicWavetable(this.params.waveform);
    }
  }

  /**
   * Sets oscillator parameters.
   */
  setParams(params: Partial<OscillatorParams>): void {
    const prev = this.params;
    this.params = { ...this.params, ...params };
    
    // Regenerate wavetable if waveform changed
    if (params.waveform !== undefined && params.waveform !== prev.waveform) {
      if (params.waveform !== 'noise' && params.waveform !== 'wavetable') {
        this.wavetable = generateBasicWavetable(params.waveform);
      }
    }
  }

  /**
   * Sets the wavetable directly.
   */
  setWavetable(wavetable: Float32Array): void {
    this.wavetable = wavetable;
  }

  /**
   * Generates a single sample.
   */
  process(): number {
    const frequency = this.params.frequency * Math.pow(2, this.params.detune / 1200);
    const phaseIncrement = frequency / this.sampleRate;
    
    let sample: number;
    
    if (this.params.waveform === 'noise') {
      sample = Math.random() * 2 - 1;
    } else if (this.wavetable) {
      // Wavetable lookup
      const tableSize = this.wavetable.length;
      const index = this.phase * tableSize;
      const i0 = Math.floor(index) % tableSize;
      const i1 = (i0 + 1) % tableSize;
      const frac = index - Math.floor(index);
      
      sample = this.wavetable[i0]! * (1 - frac) + this.wavetable[i1]! * frac;
      
      // Apply pulse width modulation for pulse wave
      if (this.params.waveform === 'pulse' && this.params.pulseWidth !== undefined) {
        sample = this.phase < this.params.pulseWidth ? 1 : -1;
      }
    } else {
      sample = 0;
    }
    
    // Advance phase
    this.phase += phaseIncrement;
    if (this.phase >= 1) {
      this.phase -= 1;
    }
    
    return sample * this.params.gain;
  }

  /**
   * Processes a block of samples.
   */
  processBlock(output: Float32Array): void {
    for (let i = 0; i < output.length; i++) {
      output[i] = this.process();
    }
  }

  /**
   * Resets the oscillator phase.
   */
  reset(): void {
    this.phase = 0;
  }

  /**
   * Gets current phase.
   */
  getPhase(): number {
    return this.phase;
  }

  /**
   * Sets phase (for sync).
   */
  setPhase(phase: number): void {
    this.phase = phase % 1;
  }
}

// ============================================================================
// LFO
// ============================================================================

/**
 * LFO waveform types.
 */
export type LFOWaveform = 'sine' | 'triangle' | 'sawtooth' | 'square' | 'sample-hold';

/**
 * LFO parameters.
 */
export interface LFOParams {
  readonly waveform: LFOWaveform;
  readonly frequency: number;       // Hz (0.01 - 100)
  readonly depth: number;           // 0-1
  readonly phase?: number;          // Initial phase (0-1)
  readonly sync?: boolean;          // Sync to tempo
  readonly retrigger?: boolean;     // Retrigger on note
}

/**
 * Default LFO parameters.
 */
export const DEFAULT_LFO: LFOParams = {
  waveform: 'sine',
  frequency: 1,
  depth: 0.5,
};

/**
 * Low Frequency Oscillator.
 */
export class LFO {
  private phase: number;
  private params: LFOParams;
  private readonly sampleRate: number;
  private sampleHoldValue = 0;

  constructor(params: Partial<LFOParams> = {}, sampleRate: number = 48000) {
    this.params = { ...DEFAULT_LFO, ...params };
    this.phase = this.params.phase ?? 0;
    this.sampleRate = sampleRate;
  }

  /**
   * Sets LFO parameters.
   */
  setParams(params: Partial<LFOParams>): void {
    this.params = { ...this.params, ...params };
  }

  /**
   * Generates the next LFO value.
   */
  process(): number {
    const phaseIncrement = this.params.frequency / this.sampleRate;
    let value: number;
    
    switch (this.params.waveform) {
      case 'sine':
        value = Math.sin(2 * Math.PI * this.phase);
        break;
        
      case 'triangle':
        value = 4 * Math.abs(this.phase - 0.5) - 1;
        break;
        
      case 'sawtooth':
        value = 2 * this.phase - 1;
        break;
        
      case 'square':
        value = this.phase < 0.5 ? 1 : -1;
        break;
        
      case 'sample-hold':
        if (this.phase + phaseIncrement >= 1) {
          this.sampleHoldValue = Math.random() * 2 - 1;
        }
        value = this.sampleHoldValue;
        break;
    }
    
    // Advance phase
    this.phase += phaseIncrement;
    if (this.phase >= 1) {
      this.phase -= 1;
    }
    
    return value * this.params.depth;
  }

  /**
   * Retriggers the LFO.
   */
  retrigger(): void {
    this.phase = this.params.phase ?? 0;
  }

  /**
   * Resets the LFO.
   */
  reset(): void {
    this.phase = this.params.phase ?? 0;
    this.sampleHoldValue = 0;
  }
}

// ============================================================================
// FM SYNTHESIS
// ============================================================================

/**
 * FM operator parameters.
 */
export interface FMOperatorParams {
  readonly ratio: number;           // Frequency ratio to carrier
  readonly detune: number;          // Fine tuning in cents
  readonly level: number;           // Output level (0-1)
  readonly feedback?: number;       // Self-feedback (0-1)
}

/**
 * FM algorithm connection type.
 */
export type FMConnection = 
  | 'serial'      // Op1 -> Op2 -> Op3 -> Op4
  | 'parallel'    // All operators to output
  | 'stack'       // Op1 + (Op2 -> Op3 + Op4)
  | 'custom';     // Custom matrix

/**
 * FM synthesis parameters.
 */
export interface FMSynthParams {
  readonly algorithm: FMConnection;
  readonly operators: readonly FMOperatorParams[];
  readonly modMatrix?: readonly (readonly number[])[];  // Modulation matrix
}

/**
 * FM Operator.
 */
export class FMOperator {
  private phase = 0;
  private readonly params: FMOperatorParams;
  private readonly sampleRate: number;
  private prevOutput = 0;

  constructor(params: FMOperatorParams, sampleRate: number = 48000) {
    this.params = params;
    this.sampleRate = sampleRate;
  }

  /**
   * Processes the operator with modulation input.
   */
  process(baseFrequency: number, modulation: number = 0): number {
    const frequency = baseFrequency * this.params.ratio * 
      Math.pow(2, this.params.detune / 1200);
    
    // Apply feedback
    const feedback = this.params.feedback !== undefined 
      ? this.prevOutput * this.params.feedback * Math.PI
      : 0;
    
    const output = Math.sin(2 * Math.PI * this.phase + modulation * Math.PI * 2 + feedback);
    this.prevOutput = output;
    
    // Advance phase
    this.phase += frequency / this.sampleRate;
    if (this.phase >= 1) {
      this.phase -= 1;
    }
    
    return output * this.params.level;
  }

  /**
   * Resets the operator.
   */
  reset(): void {
    this.phase = 0;
    this.prevOutput = 0;
  }
}

/**
 * FM Synthesizer voice.
 */
export class FMVoice {
  private readonly operators: FMOperator[];
  private readonly params: FMSynthParams;

  constructor(params: FMSynthParams, sampleRate: number = 48000) {
    this.params = params;
    this.operators = params.operators.map(op => new FMOperator(op, sampleRate));
  }

  /**
   * Processes the FM voice.
   */
  process(frequency: number): number {
    switch (this.params.algorithm) {
      case 'serial':
        return this.processSerial(frequency);
        
      case 'parallel':
        return this.processParallel(frequency);
        
      case 'stack':
        return this.processStack(frequency);
        
      default:
        return this.processParallel(frequency);
    }
  }

  /**
   * Serial algorithm: Op1 -> Op2 -> Op3 -> Op4.
   */
  private processSerial(frequency: number): number {
    let mod = 0;
    for (const op of this.operators) {
      mod = op.process(frequency, mod);
    }
    return mod;
  }

  /**
   * Parallel algorithm: All operators sum to output.
   */
  private processParallel(frequency: number): number {
    let sum = 0;
    for (const op of this.operators) {
      sum += op.process(frequency, 0);
    }
    return sum / this.operators.length;
  }

  /**
   * Stack algorithm: Op1 + (Op2 -> Op3 + Op4).
   */
  private processStack(frequency: number): number {
    if (this.operators.length < 4) {
      return this.processParallel(frequency);
    }
    
    const op1 = this.operators[0]!.process(frequency, 0);
    const op2 = this.operators[1]!.process(frequency, 0);
    const op3 = this.operators[2]!.process(frequency, op2);
    const op4 = this.operators[3]!.process(frequency, op2);
    
    return (op1 + op3 + op4) / 3;
  }

  /**
   * Resets all operators.
   */
  reset(): void {
    for (const op of this.operators) {
      op.reset();
    }
  }
}

// ============================================================================
// FILTER TYPES (Extended from sample.ts)
// ============================================================================

/**
 * Synth filter type.
 */
export type SynthFilterType = 'lowpass' | 'highpass' | 'bandpass' | 'notch' | 'allpass';

/**
 * Synth filter mode.
 */
export type SynthFilterMode = '12db' | '24db' | '48db';

/**
 * Synth filter parameters.
 */
export interface SynthFilterParams {
  readonly type: SynthFilterType;
  readonly mode: SynthFilterMode;
  readonly cutoff: number;          // Hz
  readonly resonance: number;       // 0-1 (maps to Q)
  readonly drive?: number;          // Saturation (0-1)
  readonly keyTracking?: number;    // Keyboard tracking (0-1)
}

/**
 * Default filter parameters.
 */
export const DEFAULT_FILTER: SynthFilterParams = {
  type: 'lowpass',
  mode: '12db',
  cutoff: 20000,
  resonance: 0,
};

// ============================================================================
// SYNTH VOICE
// ============================================================================

/**
 * Synth voice configuration.
 */
export interface SynthVoiceConfig {
  readonly oscillators: readonly OscillatorParams[];
  readonly filter: SynthFilterParams;
  readonly ampEnvelope: {
    readonly attack: number;
    readonly decay: number;
    readonly sustain: number;
    readonly release: number;
  };
  readonly filterEnvelope: {
    readonly attack: number;
    readonly decay: number;
    readonly sustain: number;
    readonly release: number;
    readonly amount: number;        // Mod amount (octaves)
  };
  readonly lfo?: LFOParams;
  readonly unison?: {
    readonly voices: number;
    readonly detune: number;        // Cents
    readonly spread: number;        // Stereo spread (0-1)
  };
  readonly portamento?: number;     // Time in seconds
}

/**
 * Default synth voice configuration.
 */
export const DEFAULT_SYNTH_VOICE: SynthVoiceConfig = {
  oscillators: [DEFAULT_OSCILLATOR],
  filter: DEFAULT_FILTER,
  ampEnvelope: {
    attack: 0.001,
    decay: 0.1,
    sustain: 0.8,
    release: 0.3,
  },
  filterEnvelope: {
    attack: 0.001,
    decay: 0.2,
    sustain: 0.3,
    release: 0.3,
    amount: 2,
  },
};

/**
 * Synth voice state.
 */
export interface SynthVoiceState {
  readonly note: number;
  readonly velocity: number;
  readonly gate: boolean;
  readonly ampEnvValue: number;
  readonly filterEnvValue: number;
}

// ============================================================================
// EFFECTS
// ============================================================================

/**
 * Delay parameters.
 */
export interface DelayParams {
  readonly time: number;            // Delay time in seconds
  readonly feedback: number;        // Feedback (0-1)
  readonly mix: number;             // Wet/dry mix (0-1)
  readonly sync?: boolean;          // Sync to tempo
}

/**
 * Default delay parameters.
 */
export const DEFAULT_DELAY: DelayParams = {
  time: 0.25,
  feedback: 0.3,
  mix: 0.3,
};

/**
 * Simple delay line.
 */
export class DelayLine {
  private readonly buffer: Float32Array;
  private writeIndex = 0;
  private readonly sampleRate: number;
  private params: DelayParams;

  constructor(maxTime: number, sampleRate: number = 48000, params: Partial<DelayParams> = {}) {
    this.sampleRate = sampleRate;
    this.buffer = new Float32Array(Math.ceil(maxTime * sampleRate));
    this.params = { ...DEFAULT_DELAY, ...params };
  }

  /**
   * Sets delay parameters.
   */
  setParams(params: Partial<DelayParams>): void {
    this.params = { ...this.params, ...params };
  }

  /**
   * Processes a sample through the delay.
   */
  process(input: number): number {
    const delaySamples = Math.floor(this.params.time * this.sampleRate);
    const readIndex = (this.writeIndex - delaySamples + this.buffer.length) % this.buffer.length;
    
    const delayed = this.buffer[readIndex]!;
    this.buffer[this.writeIndex] = input + delayed * this.params.feedback;
    
    this.writeIndex = (this.writeIndex + 1) % this.buffer.length;
    
    return input * (1 - this.params.mix) + delayed * this.params.mix;
  }

  /**
   * Clears the delay buffer.
   */
  clear(): void {
    this.buffer.fill(0);
  }
}

/**
 * Chorus parameters.
 */
export interface ChorusParams {
  readonly rate: number;            // LFO rate (Hz)
  readonly depth: number;           // Modulation depth (0-1)
  readonly mix: number;             // Wet/dry mix (0-1)
  readonly voices?: number;         // Number of chorus voices
}

/**
 * Default chorus parameters.
 */
export const DEFAULT_CHORUS: ChorusParams = {
  rate: 1.5,
  depth: 0.5,
  mix: 0.5,
};

/**
 * Simple chorus effect.
 */
export class Chorus {
  private readonly buffer: Float32Array;
  private writeIndex = 0;
  private readonly lfo: LFO;
  private readonly sampleRate: number;
  private params: ChorusParams;
  private readonly baseDelay = 0.015; // 15ms base delay

  constructor(sampleRate: number = 48000, params: Partial<ChorusParams> = {}) {
    this.sampleRate = sampleRate;
    this.params = { ...DEFAULT_CHORUS, ...params };
    this.buffer = new Float32Array(Math.ceil(0.05 * sampleRate)); // 50ms max
    this.lfo = new LFO({ waveform: 'sine', frequency: this.params.rate, depth: 1 }, sampleRate);
  }

  /**
   * Sets chorus parameters.
   */
  setParams(params: Partial<ChorusParams>): void {
    this.params = { ...this.params, ...params };
    if (params.rate !== undefined) {
      this.lfo.setParams({ frequency: params.rate });
    }
  }

  /**
   * Processes a sample through the chorus.
   */
  process(input: number): number {
    const lfoValue = this.lfo.process();
    const modulatedDelay = this.baseDelay + this.baseDelay * this.params.depth * lfoValue;
    const delaySamples = modulatedDelay * this.sampleRate;
    
    const readIndex = (this.writeIndex - delaySamples + this.buffer.length) % this.buffer.length;
    const i0 = Math.floor(readIndex);
    const frac = readIndex - i0;
    
    const s0 = this.buffer[i0 % this.buffer.length]!;
    const s1 = this.buffer[(i0 + 1) % this.buffer.length]!;
    const delayed = s0 + (s1 - s0) * frac;
    
    this.buffer[this.writeIndex] = input;
    this.writeIndex = (this.writeIndex + 1) % this.buffer.length;
    
    return input * (1 - this.params.mix) + delayed * this.params.mix;
  }

  /**
   * Clears the chorus buffer.
   */
  clear(): void {
    this.buffer.fill(0);
    this.lfo.reset();
  }
}

/**
 * Reverb parameters.
 */
export interface ReverbParams {
  readonly roomSize: number;        // 0-1
  readonly damping: number;         // 0-1
  readonly mix: number;             // Wet/dry mix (0-1)
  readonly predelay?: number;       // Predelay in ms
}

/**
 * Default reverb parameters.
 */
export const DEFAULT_REVERB: ReverbParams = {
  roomSize: 0.5,
  damping: 0.5,
  mix: 0.3,
};

/**
 * Comb filter for reverb.
 */
export class CombFilter {
  private readonly buffer: Float32Array;
  private index = 0;
  private filterState = 0;

  constructor(
    delaySamples: number,
    private feedback: number,
    private damping: number
  ) {
    this.buffer = new Float32Array(delaySamples);
  }

  process(input: number): number {
    const output = this.buffer[this.index]!;
    
    this.filterState = output * (1 - this.damping) + this.filterState * this.damping;
    this.buffer[this.index] = input + this.filterState * this.feedback;
    
    this.index = (this.index + 1) % this.buffer.length;
    return output;
  }

  setFeedback(feedback: number): void {
    this.feedback = feedback;
  }

  setDamping(damping: number): void {
    this.damping = damping;
  }

  clear(): void {
    this.buffer.fill(0);
    this.filterState = 0;
  }
}

/**
 * All-pass filter for reverb.
 */
export class AllpassFilter {
  private readonly buffer: Float32Array;
  private index = 0;

  constructor(delaySamples: number, private readonly feedback: number = 0.5) {
    this.buffer = new Float32Array(delaySamples);
  }

  process(input: number): number {
    const buffered = this.buffer[this.index]!;
    const output = -input + buffered;
    
    this.buffer[this.index] = input + buffered * this.feedback;
    this.index = (this.index + 1) % this.buffer.length;
    
    return output;
  }

  clear(): void {
    this.buffer.fill(0);
  }
}

/**
 * Simple Freeverb-style reverb.
 */
export class Reverb {
  private readonly combs: CombFilter[];
  private readonly allpasses: AllpassFilter[];
  private params: ReverbParams;

  // Freeverb delay lengths (in samples at 44100Hz, scaled to sample rate)
  private static readonly COMB_LENGTHS = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  private static readonly ALLPASS_LENGTHS = [556, 441, 341, 225];

  constructor(sampleRate: number = 48000, params: Partial<ReverbParams> = {}) {
    this.params = { ...DEFAULT_REVERB, ...params };
    
    const scale = sampleRate / 44100;
    
    this.combs = Reverb.COMB_LENGTHS.map(len => 
      new CombFilter(
        Math.floor(len * scale),
        0.84,
        this.params.damping
      )
    );
    
    this.allpasses = Reverb.ALLPASS_LENGTHS.map(len =>
      new AllpassFilter(Math.floor(len * scale), 0.5)
    );
    
    this.updateFeedback();
  }

  /**
   * Sets reverb parameters.
   */
  setParams(params: Partial<ReverbParams>): void {
    this.params = { ...this.params, ...params };
    this.updateFeedback();
  }

  /**
   * Updates feedback based on room size.
   */
  private updateFeedback(): void {
    const feedback = 0.7 + this.params.roomSize * 0.28;
    for (const comb of this.combs) {
      comb.setFeedback(feedback);
      comb.setDamping(this.params.damping);
    }
  }

  /**
   * Processes a sample through the reverb.
   */
  process(input: number): number {
    // Sum comb filters
    let sum = 0;
    for (const comb of this.combs) {
      sum += comb.process(input);
    }
    sum /= this.combs.length;
    
    // Series allpass filters
    for (const allpass of this.allpasses) {
      sum = allpass.process(sum);
    }
    
    return input * (1 - this.params.mix) + sum * this.params.mix;
  }

  /**
   * Clears the reverb.
   */
  clear(): void {
    for (const comb of this.combs) {
      comb.clear();
    }
    for (const allpass of this.allpasses) {
      allpass.clear();
    }
  }
}

// ============================================================================
// COMPRESSOR
// ============================================================================

/**
 * Compressor parameters.
 */
export interface CompressorParams {
  readonly threshold: number;       // dB
  readonly ratio: number;           // Compression ratio
  readonly attack: number;          // Attack time in seconds
  readonly release: number;         // Release time in seconds
  readonly makeup: number;          // Makeup gain in dB
  readonly knee?: number;           // Soft knee width in dB
}

/**
 * Default compressor parameters.
 */
export const DEFAULT_COMPRESSOR: CompressorParams = {
  threshold: -24,
  ratio: 4,
  attack: 0.01,
  release: 0.1,
  makeup: 0,
};

/**
 * Simple compressor.
 */
export class Compressor {
  private envelope = 0;
  private params: CompressorParams;
  private readonly sampleRate: number;

  constructor(sampleRate: number = 48000, params: Partial<CompressorParams> = {}) {
    this.sampleRate = sampleRate;
    this.params = { ...DEFAULT_COMPRESSOR, ...params };
  }

  /**
   * Sets compressor parameters.
   */
  setParams(params: Partial<CompressorParams>): void {
    this.params = { ...this.params, ...params };
  }

  /**
   * Processes a sample through the compressor.
   */
  process(input: number): number {
    const inputDb = 20 * Math.log10(Math.abs(input) + 1e-10);
    
    // Calculate target gain reduction
    let gainReduction = 0;
    if (inputDb > this.params.threshold) {
      const overshoot = inputDb - this.params.threshold;
      gainReduction = overshoot - overshoot / this.params.ratio;
    }
    
    // Apply envelope
    const targetEnv = Math.max(gainReduction, 0);
    const attackCoef = Math.exp(-1 / (this.params.attack * this.sampleRate));
    const releaseCoef = Math.exp(-1 / (this.params.release * this.sampleRate));
    
    if (targetEnv > this.envelope) {
      this.envelope = attackCoef * this.envelope + (1 - attackCoef) * targetEnv;
    } else {
      this.envelope = releaseCoef * this.envelope + (1 - releaseCoef) * targetEnv;
    }
    
    // Apply gain
    const gainDb = -this.envelope + this.params.makeup;
    const gain = Math.pow(10, gainDb / 20);
    
    return input * gain;
  }

  /**
   * Resets the compressor.
   */
  reset(): void {
    this.envelope = 0;
  }
}

// ============================================================================
// EQ
// ============================================================================

/**
 * EQ band parameters.
 */
export interface EQBandParams {
  readonly frequency: number;       // Hz
  readonly gain: number;            // dB
  readonly q: number;               // Q factor
  readonly type: 'lowshelf' | 'highshelf' | 'peaking';
}

/**
 * 3-band parametric EQ.
 */
export interface EQParams {
  readonly low: EQBandParams;
  readonly mid: EQBandParams;
  readonly high: EQBandParams;
}

/**
 * Default EQ parameters.
 */
export const DEFAULT_EQ: EQParams = {
  low: { frequency: 100, gain: 0, q: 0.7, type: 'lowshelf' },
  mid: { frequency: 1000, gain: 0, q: 1, type: 'peaking' },
  high: { frequency: 8000, gain: 0, q: 0.7, type: 'highshelf' },
};

// ============================================================================
// SYNTH PROCESSOR SCRIPT
// ============================================================================

/**
 * Generates the synth processor script.
 */
export function generateSynthProcessorScript(): string {
  return `
/**
 * SynthProcessor - AudioWorklet for synthesis.
 * Generated by Cardplay audio engine.
 */
class SynthProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    this.voices = new Map();
    this.nextVoiceId = 0;
    this.config = {
      maxVoices: 16,
      waveform: 'sawtooth',
    };
    
    this.port.onmessage = this.handleMessage.bind(this);
  }

  handleMessage(event) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'noteOn':
        this.startVoice(data);
        break;
      case 'noteOff':
        this.releaseVoice(data.note);
        break;
      case 'config':
        Object.assign(this.config, data);
        break;
    }
  }

  startVoice(params) {
    if (this.voices.size >= this.config.maxVoices) {
      // Steal oldest voice
      const oldest = this.voices.keys().next().value;
      this.voices.delete(oldest);
    }
    
    const id = this.nextVoiceId++;
    const frequency = 440 * Math.pow(2, (params.note - 69) / 12);
    
    this.voices.set(id, {
      id,
      note: params.note,
      velocity: params.velocity,
      frequency,
      phase: 0,
      state: 'attack',
      envelope: { value: 0, time: 0 },
    });
  }

  releaseVoice(note) {
    for (const [id, voice] of this.voices) {
      if (voice.note === note && voice.state !== 'release') {
        voice.state = 'release';
        voice.envelope.time = 0;
      }
    }
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output) return true;

    const left = output[0];
    const right = output[1] || left;
    if (!left) return true;

    left.fill(0);
    if (right !== left) right.fill(0);

    const voicesToRemove = [];

    for (const [id, voice] of this.voices) {
      for (let i = 0; i < left.length; i++) {
        // Generate oscillator sample
        const sample = this.generateSample(voice);
        
        // Process envelope
        this.processEnvelope(voice, 1 / sampleRate);
        
        if (voice.envelope.value <= 0.001 && voice.state === 'release') {
          voicesToRemove.push(id);
          break;
        }

        const finalGain = (voice.velocity / 127) * voice.envelope.value * 0.2;
        left[i] += sample * finalGain;
        right[i] += sample * finalGain;
      }
    }

    for (const id of voicesToRemove) {
      this.voices.delete(id);
    }

    return true;
  }

  generateSample(voice) {
    const phaseIncrement = voice.frequency / sampleRate;
    let sample;

    switch (this.config.waveform) {
      case 'sine':
        sample = Math.sin(2 * Math.PI * voice.phase);
        break;
      case 'sawtooth':
        sample = 2 * voice.phase - 1;
        break;
      case 'square':
        sample = voice.phase < 0.5 ? 1 : -1;
        break;
      case 'triangle':
        sample = 4 * Math.abs(voice.phase - 0.5) - 1;
        break;
      default:
        sample = 0;
    }

    voice.phase += phaseIncrement;
    if (voice.phase >= 1) voice.phase -= 1;

    return sample;
  }

  processEnvelope(voice, deltaTime) {
    voice.envelope.time += deltaTime;
    
    const attack = 0.01;
    const decay = 0.1;
    const sustain = 0.8;
    const release = 0.3;

    switch (voice.state) {
      case 'attack':
        voice.envelope.value = voice.envelope.time / attack;
        if (voice.envelope.value >= 1) {
          voice.envelope.value = 1;
          voice.state = 'decay';
          voice.envelope.time = 0;
        }
        break;
      case 'decay':
        voice.envelope.value = 1 - (1 - sustain) * (voice.envelope.time / decay);
        if (voice.envelope.time >= decay) {
          voice.envelope.value = sustain;
          voice.state = 'sustain';
        }
        break;
      case 'sustain':
        voice.envelope.value = sustain;
        break;
      case 'release':
        voice.envelope.value = sustain * (1 - voice.envelope.time / release);
        if (voice.envelope.time >= release) {
          voice.envelope.value = 0;
        }
        break;
    }
  }
}

registerProcessor('synth-processor', SynthProcessor);
`;
}
