/**
 * @fileoverview Sampler Filter Module - Multi-Mode Filter with Multiple Topologies
 * 
 * Implements a comprehensive filter section for the sampler including:
 * - Multiple filter types (LP, HP, BP, BR, Peak, Comb, Formant)
 * - Various filter slopes (6, 12, 18, 24, 36, 48 dB/oct)
 * - Classic analog filter emulations (Moog Ladder, MS-20, etc.)
 * - Dual filter configurations (serial, parallel, morph)
 * - Per-voice filter with full modulation support
 * 
 * @module @cardplay/core/audio/sampler-filter
 */

// ============================================================================
// FILTER TYPE DEFINITIONS
// ============================================================================

/** Filter type enumeration */
export type SamplerFilterType =
  | 'off'
  | 'lp6' | 'lp12' | 'lp18' | 'lp24' | 'lp36' | 'lp48'   // Low-pass
  | 'hp6' | 'hp12' | 'hp18' | 'hp24' | 'hp36' | 'hp48'   // High-pass
  | 'bp6' | 'bp12' | 'bp24'                               // Band-pass
  | 'br6' | 'br12' | 'br24'                               // Band-reject (notch)
  | 'peak'                                                 // Peak/Bell
  | 'shelf_lo' | 'shelf_hi'                               // Shelving
  | 'comb' | 'comb_neg'                                   // Comb filter
  | 'formant'                                              // Formant filter
  | 'ladder'                                               // Moog ladder
  | 'ms20'                                                 // Korg MS-20
  | 'diode'                                                // Diode ladder
  | 'svf'                                                  // State variable
  | 'phaser';                                              // All-pass phaser

/** Filter routing mode */
export type FilterRoutingMode = 'serial' | 'parallel' | 'morph' | 'stereo';

/** Saturation mode for filter drive */
export type SaturationMode = 'off' | 'soft' | 'hard' | 'tape' | 'tube' | 'fold';

// ============================================================================
// FILTER CONFIGURATION
// ============================================================================

/** Single filter configuration */
export interface FilterConfig {
  enabled: boolean;
  type: SamplerFilterType;
  cutoff: number;           // 20-20000 Hz
  resonance: number;        // 0-1 (self-oscillation at 1)
  drive: number;            // 0-1 (pre-saturation)
  saturationMode: SaturationMode;
  keytrack: number;         // 0-200% (0 = no tracking, 100 = full tracking)
  velocityTrack: number;    // -1 to 1 (velocity to cutoff)
  envDepth: number;         // -1 to 1 (envelope to cutoff)
  envSource: number;        // Envelope index (0-5)
  lfoDepth: number;         // -1 to 1 (LFO to cutoff)
  lfoSource: number;        // LFO index (0-7)
  pan: number;              // -1 to 1 (stereo pan)
  mix: number;              // 0-1 (dry/wet)
  gain: number;             // -24 to +24 dB
}

/** Dual filter configuration */
export interface DualFilterConfig {
  filter1: FilterConfig;
  filter2: FilterConfig;
  routing: FilterRoutingMode;
  morphPosition: number;    // 0-1 for morph mode
  balance: number;          // 0-1 for parallel mode
  splitFrequency: number;   // For stereo mode
}

/** Formant vowel preset */
export interface FormantVowel {
  name: string;
  formants: [number, number, number, number, number];  // F1-F5 frequencies
  bandwidths: [number, number, number, number, number]; // Bandwidths
  gains: [number, number, number, number, number];      // Gains in dB
}

// ============================================================================
// FORMANT VOWEL PRESETS
// ============================================================================

/** Common vowel formant data */
export const FORMANT_VOWELS: Record<string, FormantVowel> = {
  'a': {
    name: 'A (father)',
    formants: [730, 1090, 2440, 3400, 4500],
    bandwidths: [90, 110, 170, 250, 300],
    gains: [0, -8, -14, -20, -24],
  },
  'e': {
    name: 'E (bed)',
    formants: [530, 1840, 2480, 3400, 4500],
    bandwidths: [60, 100, 120, 250, 300],
    gains: [0, -4, -10, -18, -22],
  },
  'i': {
    name: 'I (beet)',
    formants: [270, 2290, 3010, 3400, 4500],
    bandwidths: [60, 90, 100, 250, 300],
    gains: [0, -2, -8, -16, -20],
  },
  'o': {
    name: 'O (boat)',
    formants: [570, 840, 2410, 3400, 4500],
    bandwidths: [80, 70, 160, 250, 300],
    gains: [0, -10, -18, -22, -26],
  },
  'u': {
    name: 'U (boot)',
    formants: [300, 870, 2240, 3400, 4500],
    bandwidths: [50, 60, 90, 250, 300],
    gains: [0, -12, -20, -24, -28],
  },
  'ae': {
    name: 'AE (cat)',
    formants: [660, 1720, 2410, 3400, 4500],
    bandwidths: [70, 100, 140, 250, 300],
    gains: [0, -6, -12, -18, -22],
  },
};

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/** Default single filter config */
export const DEFAULT_FILTER_CONFIG: FilterConfig = {
  enabled: true,
  type: 'lp24',
  cutoff: 10000,
  resonance: 0,
  drive: 0,
  saturationMode: 'off',
  keytrack: 0,
  velocityTrack: 0,
  envDepth: 0,
  envSource: 1, // Filter envelope
  lfoDepth: 0,
  lfoSource: 0,
  pan: 0,
  mix: 1,
  gain: 0,
};

/** Default dual filter config */
export const DEFAULT_DUAL_FILTER_CONFIG: DualFilterConfig = {
  filter1: { ...DEFAULT_FILTER_CONFIG },
  filter2: { ...DEFAULT_FILTER_CONFIG, enabled: false, type: 'hp24', cutoff: 100 },
  routing: 'serial',
  morphPosition: 0.5,
  balance: 0.5,
  splitFrequency: 1000,
};

// ============================================================================
// FILTER STATE
// ============================================================================

/** Biquad filter state (for IIR filters) */
interface BiquadState {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

/** SVF (State Variable Filter) state */
interface SvfState {
  ic1eq: number;
  ic2eq: number;
}

/** Ladder filter state */
interface LadderState {
  stage: [number, number, number, number];
  delay: [number, number, number, number];
}

/** Comb filter state */
interface CombState {
  buffer: Float32Array;
  writeIndex: number;
}

/** Formant filter state (5 parallel biquads) */
interface FormantState {
  biquads: [BiquadState, BiquadState, BiquadState, BiquadState, BiquadState];
}

/** Unified filter state */
type FilterState = 
  | { type: 'biquad'; state: BiquadState[] }
  | { type: 'svf'; state: SvfState }
  | { type: 'ladder'; state: LadderState }
  | { type: 'comb'; state: CombState }
  | { type: 'formant'; state: FormantState };

// ============================================================================
// BIQUAD COEFFICIENTS
// ============================================================================

/** Biquad filter coefficients */
interface BiquadCoeffs {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

/**
 * Calculate biquad coefficients for various filter types
 */
function calculateBiquadCoeffs(
  type: 'lp' | 'hp' | 'bp' | 'br' | 'peak' | 'shelf_lo' | 'shelf_hi' | 'ap',
  fc: number,
  q: number,
  gain: number,
  sampleRate: number
): BiquadCoeffs {
  const w0 = 2 * Math.PI * fc / sampleRate;
  const cosw0 = Math.cos(w0);
  const sinw0 = Math.sin(w0);
  const alpha = sinw0 / (2 * q);
  const A = Math.pow(10, gain / 40);
  
  let b0 = 0, b1 = 0, b2 = 0, a0 = 1, a1 = 0, a2 = 0;
  
  switch (type) {
    case 'lp':
      b0 = (1 - cosw0) / 2;
      b1 = 1 - cosw0;
      b2 = (1 - cosw0) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cosw0;
      a2 = 1 - alpha;
      break;
      
    case 'hp':
      b0 = (1 + cosw0) / 2;
      b1 = -(1 + cosw0);
      b2 = (1 + cosw0) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cosw0;
      a2 = 1 - alpha;
      break;
      
    case 'bp':
      b0 = alpha;
      b1 = 0;
      b2 = -alpha;
      a0 = 1 + alpha;
      a1 = -2 * cosw0;
      a2 = 1 - alpha;
      break;
      
    case 'br':
      b0 = 1;
      b1 = -2 * cosw0;
      b2 = 1;
      a0 = 1 + alpha;
      a1 = -2 * cosw0;
      a2 = 1 - alpha;
      break;
      
    case 'peak':
      b0 = 1 + alpha * A;
      b1 = -2 * cosw0;
      b2 = 1 - alpha * A;
      a0 = 1 + alpha / A;
      a1 = -2 * cosw0;
      a2 = 1 - alpha / A;
      break;
      
    case 'shelf_lo': {
      const sqrtA = Math.sqrt(A);
      b0 = A * ((A + 1) - (A - 1) * cosw0 + 2 * sqrtA * alpha);
      b1 = 2 * A * ((A - 1) - (A + 1) * cosw0);
      b2 = A * ((A + 1) - (A - 1) * cosw0 - 2 * sqrtA * alpha);
      a0 = (A + 1) + (A - 1) * cosw0 + 2 * sqrtA * alpha;
      a1 = -2 * ((A - 1) + (A + 1) * cosw0);
      a2 = (A + 1) + (A - 1) * cosw0 - 2 * sqrtA * alpha;
      break;
    }
    
    case 'shelf_hi': {
      const sqrtA = Math.sqrt(A);
      b0 = A * ((A + 1) + (A - 1) * cosw0 + 2 * sqrtA * alpha);
      b1 = -2 * A * ((A - 1) + (A + 1) * cosw0);
      b2 = A * ((A + 1) + (A - 1) * cosw0 - 2 * sqrtA * alpha);
      a0 = (A + 1) - (A - 1) * cosw0 + 2 * sqrtA * alpha;
      a1 = 2 * ((A - 1) - (A + 1) * cosw0);
      a2 = (A + 1) - (A - 1) * cosw0 - 2 * sqrtA * alpha;
      break;
    }
    
    case 'ap':
      b0 = 1 - alpha;
      b1 = -2 * cosw0;
      b2 = 1 + alpha;
      a0 = 1 + alpha;
      a1 = -2 * cosw0;
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

// ============================================================================
// SAMPLER FILTER CLASS
// ============================================================================

/**
 * Multi-mode filter for sampler voices
 */
export class SamplerFilter {
  private config: FilterConfig;
  private sampleRate: number;
  private state: FilterState | null = null;
  
  // Smoothed parameters
  private cutoffSmooth = 10000;
  private resonanceSmooth = 0;
  private driveSmooth = 0;
  
  // Coefficients
  private biquadCoeffs: BiquadCoeffs[] = [];
  
  constructor(sampleRate: number, config?: Partial<FilterConfig>) {
    this.sampleRate = sampleRate;
    this.config = { ...DEFAULT_FILTER_CONFIG, ...config };
    this.initState();
  }
  
  /**
   * Initialize filter state based on type
   */
  private initState(): void {
    const type = this.config.type;
    
    if (type === 'off') {
      this.state = null;
      return;
    }
    
    // Determine number of biquad stages needed
    const stages = this.getStageCount(type);
    
    if (type.startsWith('lp') || type.startsWith('hp') || 
        type.startsWith('bp') || type.startsWith('br') ||
        type === 'peak' || type === 'shelf_lo' || type === 'shelf_hi' ||
        type === 'phaser') {
      this.state = {
        type: 'biquad',
        state: Array.from({ length: stages }, () => ({
          x1: 0, x2: 0, y1: 0, y2: 0
        }))
      };
      this.biquadCoeffs = [];
      this.updateCoefficients();
    } else if (type === 'svf') {
      this.state = {
        type: 'svf',
        state: { ic1eq: 0, ic2eq: 0 }
      };
    } else if (type === 'ladder' || type === 'ms20' || type === 'diode') {
      this.state = {
        type: 'ladder',
        state: {
          stage: [0, 0, 0, 0],
          delay: [0, 0, 0, 0]
        }
      };
    } else if (type === 'comb' || type === 'comb_neg') {
      const maxDelay = Math.ceil(this.sampleRate / 20); // Min freq ~20Hz
      this.state = {
        type: 'comb',
        state: {
          buffer: new Float32Array(maxDelay),
          writeIndex: 0
        }
      };
    } else if (type === 'formant') {
      this.state = {
        type: 'formant',
        state: {
          biquads: [
            { x1: 0, x2: 0, y1: 0, y2: 0 },
            { x1: 0, x2: 0, y1: 0, y2: 0 },
            { x1: 0, x2: 0, y1: 0, y2: 0 },
            { x1: 0, x2: 0, y1: 0, y2: 0 },
            { x1: 0, x2: 0, y1: 0, y2: 0 },
          ]
        }
      };
    }
  }
  
  /**
   * Get number of biquad stages for filter type
   */
  private getStageCount(type: SamplerFilterType): number {
    if (type.endsWith('6')) return 1;
    if (type.endsWith('12')) return 2;
    if (type.endsWith('18')) return 3;
    if (type.endsWith('24')) return 4;
    if (type.endsWith('36')) return 6;
    if (type.endsWith('48')) return 8;
    if (type === 'phaser') return 4;
    return 2; // Default
  }
  
  /**
   * Update biquad coefficients
   */
  private updateCoefficients(): void {
    if (this.state?.type !== 'biquad') return;
    
    const type = this.config.type;
    const fc = Math.min(Math.max(this.cutoffSmooth, 20), this.sampleRate * 0.49);
    const q = 0.5 + this.resonanceSmooth * 10; // Q from 0.5 to 10.5
    
    let filterType: 'lp' | 'hp' | 'bp' | 'br' | 'peak' | 'shelf_lo' | 'shelf_hi' | 'ap' = 'lp';
    
    if (type.startsWith('lp')) filterType = 'lp';
    else if (type.startsWith('hp')) filterType = 'hp';
    else if (type.startsWith('bp')) filterType = 'bp';
    else if (type.startsWith('br')) filterType = 'br';
    else if (type === 'peak') filterType = 'peak';
    else if (type === 'shelf_lo') filterType = 'shelf_lo';
    else if (type === 'shelf_hi') filterType = 'shelf_hi';
    else if (type === 'phaser') filterType = 'ap';
    
    const stages = this.state.state.length;
    this.biquadCoeffs = [];
    
    for (let i = 0; i < stages; i++) {
      this.biquadCoeffs.push(
        calculateBiquadCoeffs(filterType, fc, q, this.config.gain, this.sampleRate)
      );
    }
  }
  
  /**
   * Set filter configuration
   */
  setConfig(config: Partial<FilterConfig>): void {
    const typeChanged = config.type !== undefined && config.type !== this.config.type;
    Object.assign(this.config, config);
    
    if (typeChanged) {
      this.initState();
    }
  }
  
  /**
   * Set cutoff frequency with optional modulation
   */
  setCutoff(cutoff: number, modulation = 0): void {
    // Modulation is -1 to 1, affects cutoff exponentially
    const modFactor = Math.pow(2, modulation * 5); // ±5 octaves
    this.cutoffSmooth = Math.min(Math.max(cutoff * modFactor, 20), 20000);
    
    if (this.state?.type === 'biquad') {
      this.updateCoefficients();
    }
  }
  
  /**
   * Set resonance
   */
  setResonance(resonance: number): void {
    this.resonanceSmooth = Math.min(Math.max(resonance, 0), 0.99);
    
    if (this.state?.type === 'biquad') {
      this.updateCoefficients();
    }
  }
  
  /**
   * Set drive amount
   */
  setDrive(drive: number): void {
    this.driveSmooth = Math.min(Math.max(drive, 0), 1);
  }
  
  /**
   * Reset filter state
   */
  reset(): void {
    this.initState();
  }
  
  /**
   * Process a single sample
   */
  process(input: number): number {
    if (!this.config.enabled || !this.state) {
      return input;
    }
    
    // Apply drive/saturation
    let sample = this.applySaturation(input * (1 + this.driveSmooth * 3));
    
    // Process through filter
    switch (this.state.type) {
      case 'biquad':
        sample = this.processBiquad(sample);
        break;
      case 'svf':
        sample = this.processSvf(sample);
        break;
      case 'ladder':
        sample = this.processLadder(sample);
        break;
      case 'comb':
        sample = this.processComb(sample);
        break;
      case 'formant':
        sample = this.processFormant(sample);
        break;
    }
    
    // Apply mix
    const output = input * (1 - this.config.mix) + sample * this.config.mix;
    
    // Apply output gain
    return output * Math.pow(10, this.config.gain / 20);
  }
  
  /**
   * Process block of samples
   */
  processBlock(input: Float32Array, output: Float32Array): void {
    for (let i = 0; i < input.length; i++) {
      output[i] = this.process(input[i]!);
    }
  }
  
  /**
   * Process through biquad cascade
   */
  private processBiquad(input: number): number {
    if (this.state?.type !== 'biquad') return input;
    
    let sample = input;
    
    for (let i = 0; i < this.state.state.length; i++) {
      const coeffs = this.biquadCoeffs[i];
      const state = this.state.state[i];
      
      if (!coeffs || !state) continue;
      
      const output = coeffs.b0 * sample + coeffs.b1 * state.x1 + coeffs.b2 * state.x2
                   - coeffs.a1 * state.y1 - coeffs.a2 * state.y2;
      
      state.x2 = state.x1;
      state.x1 = sample;
      state.y2 = state.y1;
      state.y1 = output;
      
      sample = output;
    }
    
    return sample;
  }
  
  /**
   * Process through state variable filter
   */
  private processSvf(input: number): number {
    if (this.state?.type !== 'svf') return input;
    
    const fc = Math.min(this.cutoffSmooth, this.sampleRate * 0.49);
    const g = Math.tan(Math.PI * fc / this.sampleRate);
    const k = 2 - 2 * this.resonanceSmooth;
    
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;
    
    const v3 = input - this.state.state.ic2eq;
    const v1 = a1 * this.state.state.ic1eq + a2 * v3;
    const v2 = this.state.state.ic2eq + a2 * this.state.state.ic1eq + a3 * v3;
    
    this.state.state.ic1eq = 2 * v1 - this.state.state.ic1eq;
    this.state.state.ic2eq = 2 * v2 - this.state.state.ic2eq;
    
    // Return based on config - LP for now
    return v2;
  }
  
  /**
   * Process through Moog-style ladder filter
   */
  private processLadder(input: number): number {
    if (this.state?.type !== 'ladder') return input;
    
    const fc = Math.min(this.cutoffSmooth, this.sampleRate * 0.49);
    const f = 2 * Math.sin(Math.PI * fc / this.sampleRate);
    const k = this.resonanceSmooth * 4; // Resonance 0-4
    
    // Feedback
    const feedback = k * this.state.state.stage[3];
    const u = this.applySaturation(input - feedback);
    
    // 4 cascaded one-pole filters
    for (let i = 0; i < 4; i++) {
      const prev = i === 0 ? u : this.state.state.stage[i - 1]!;
      this.state.state.stage[i]! += f * (this.applySaturation(prev) - this.state.state.stage[i]!);
    }
    
    return this.state.state.stage[3]!;
  }
  
  /**
   * Process through comb filter
   */
  private processComb(input: number): number {
    if (this.state?.type !== 'comb') return input;
    
    // Comb filter: delay line with feedback
    const fc = Math.max(this.cutoffSmooth, 20);
    const delaySamples = Math.floor(this.sampleRate / fc);
    const feedback = this.resonanceSmooth * 0.98;
    
    const buffer = this.state.state.buffer;
    const bufferSize = buffer.length;
    
    // Read from delay line
    let readIndex = this.state.state.writeIndex - delaySamples;
    if (readIndex < 0) readIndex += bufferSize;
    
    const delayed = buffer[readIndex] ?? 0;
    
    // Calculate output
    const sign = this.config.type === 'comb_neg' ? -1 : 1;
    const output = input + sign * delayed * feedback;
    
    // Write to delay line
    buffer[this.state.state.writeIndex] = output;
    this.state.state.writeIndex = (this.state.state.writeIndex + 1) % bufferSize;
    
    return output;
  }
  
  /**
   * Process through formant filter
   */
  private processFormant(input: number): number {
    if (this.state?.type !== 'formant') return input;
    
    // Select vowel based on cutoff position (0-1 range maps to vowels)
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    const normalizedCutoff = (this.cutoffSmooth - 200) / (2000 - 200);
    const vowelIndex = Math.floor(normalizedCutoff * (vowels.length - 1));
    const vowelMix = (normalizedCutoff * (vowels.length - 1)) - vowelIndex;
    
    const vowel1 = FORMANT_VOWELS[vowels[Math.min(vowelIndex, vowels.length - 1)]!];
    const vowel2 = FORMANT_VOWELS[vowels[Math.min(vowelIndex + 1, vowels.length - 1)]!];
    
    if (!vowel1 || !vowel2) return input;
    
    let output = 0;
    
    // Process through 5 parallel bandpass filters
    for (let i = 0; i < 5; i++) {
      const formantFreq = vowel1.formants[i]! * (1 - vowelMix) + vowel2.formants[i]! * vowelMix;
      const bandwidth = vowel1.bandwidths[i]! * (1 - vowelMix) + vowel2.bandwidths[i]! * vowelMix;
      const gainDb = vowel1.gains[i]! * (1 - vowelMix) + vowel2.gains[i]! * vowelMix;
      
      const q = formantFreq / bandwidth;
      const coeffs = calculateBiquadCoeffs('bp', formantFreq, q, 0, this.sampleRate);
      const state = this.state.state.biquads[i];
      
      if (!state) continue;
      
      const filtered = coeffs.b0 * input + coeffs.b1 * state.x1 + coeffs.b2 * state.x2
                     - coeffs.a1 * state.y1 - coeffs.a2 * state.y2;
      
      state.x2 = state.x1;
      state.x1 = input;
      state.y2 = state.y1;
      state.y1 = filtered;
      
      output += filtered * Math.pow(10, gainDb / 20);
    }
    
    return output;
  }
  
  /**
   * Apply saturation based on mode
   */
  private applySaturation(input: number): number {
    switch (this.config.saturationMode) {
      case 'off':
        return input;
        
      case 'soft':
        // Soft clipping (tanh)
        return Math.tanh(input);
        
      case 'hard':
        // Hard clipping
        return Math.max(-1, Math.min(1, input));
        
      case 'tape':
        // Tape-style asymmetric saturation
        if (input >= 0) {
          return 1 - Math.exp(-input);
        } else {
          return -1 + Math.exp(input);
        }
        
      case 'tube':
        // Tube-style soft saturation
        const k = 2 * this.driveSmooth / (1 - this.driveSmooth);
        return (1 + k) * input / (1 + k * Math.abs(input));
        
      case 'fold':
        // Wave folding
        let folded = input;
        while (Math.abs(folded) > 1) {
          if (folded > 1) folded = 2 - folded;
          else if (folded < -1) folded = -2 - folded;
        }
        return folded;
        
      default:
        return input;
    }
  }
  
  /**
   * Get current configuration
   */
  getConfig(): FilterConfig {
    return { ...this.config };
  }
}

// ============================================================================
// DUAL FILTER CLASS
// ============================================================================

/**
 * Dual filter with routing options
 */
export class DualSamplerFilter {
  private filter1: SamplerFilter;
  private filter2: SamplerFilter;
  private config: DualFilterConfig;
  // private sampleRate: number; // Stored for potential future use
  
  constructor(sampleRate: number, config?: Partial<DualFilterConfig>) {
    // this.sampleRate = sampleRate; // Reserved for future features
    this.config = { ...DEFAULT_DUAL_FILTER_CONFIG, ...config };
    
    this.filter1 = new SamplerFilter(sampleRate, this.config.filter1);
    this.filter2 = new SamplerFilter(sampleRate, this.config.filter2);
  }
  
  /**
   * Set dual filter configuration
   */
  setConfig(config: Partial<DualFilterConfig>): void {
    if (config.filter1) {
      this.filter1.setConfig(config.filter1);
      Object.assign(this.config.filter1, config.filter1);
    }
    if (config.filter2) {
      this.filter2.setConfig(config.filter2);
      Object.assign(this.config.filter2, config.filter2);
    }
    if (config.routing !== undefined) this.config.routing = config.routing;
    if (config.morphPosition !== undefined) this.config.morphPosition = config.morphPosition;
    if (config.balance !== undefined) this.config.balance = config.balance;
    if (config.splitFrequency !== undefined) this.config.splitFrequency = config.splitFrequency;
  }
  
  /**
   * Set cutoff for both filters with offset
   */
  setCutoff(cutoff: number, offset = 0, modulation = 0): void {
    this.filter1.setCutoff(cutoff, modulation);
    this.filter2.setCutoff(cutoff * Math.pow(2, offset / 12), modulation);
  }
  
  /**
   * Set resonance for both filters
   */
  setResonance(resonance: number): void {
    this.filter1.setResonance(resonance);
    this.filter2.setResonance(resonance);
  }
  
  /**
   * Reset both filters
   */
  reset(): void {
    this.filter1.reset();
    this.filter2.reset();
  }
  
  /**
   * Process a single sample
   */
  process(input: number): number {
    const f1Enabled = this.config.filter1.enabled;
    const f2Enabled = this.config.filter2.enabled;
    
    if (!f1Enabled && !f2Enabled) {
      return input;
    }
    
    if (!f2Enabled) {
      return this.filter1.process(input);
    }
    
    if (!f1Enabled) {
      return this.filter2.process(input);
    }
    
    switch (this.config.routing) {
      case 'serial':
        return this.filter2.process(this.filter1.process(input));
        
      case 'parallel': {
        const out1 = this.filter1.process(input);
        const out2 = this.filter2.process(input);
        return out1 * (1 - this.config.balance) + out2 * this.config.balance;
      }
        
      case 'morph': {
        const out1 = this.filter1.process(input);
        const out2 = this.filter2.process(input);
        return out1 * (1 - this.config.morphPosition) + out2 * this.config.morphPosition;
      }
        
      case 'stereo':
        // In mono context, blend based on split frequency
        return input; // Would need stereo output for full implementation
        
      default:
        return input;
    }
  }
  
  /**
   * Process block
   */
  processBlock(input: Float32Array, output: Float32Array): void {
    for (let i = 0; i < input.length; i++) {
      output[i] = this.process(input[i]!);
    }
  }
  
  /**
   * Get configuration
   */
  getConfig(): DualFilterConfig {
    return {
      filter1: this.filter1.getConfig(),
      filter2: this.filter2.getConfig(),
      routing: this.config.routing,
      morphPosition: this.config.morphPosition,
      balance: this.config.balance,
      splitFrequency: this.config.splitFrequency,
    };
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a sampler filter
 */
export function createSamplerFilter(
  sampleRate: number,
  config?: Partial<FilterConfig>
): SamplerFilter {
  return new SamplerFilter(sampleRate, config);
}

/**
 * Create a dual sampler filter
 */
export function createDualSamplerFilter(
  sampleRate: number,
  config?: Partial<DualFilterConfig>
): DualSamplerFilter {
  return new DualSamplerFilter(sampleRate, config);
}

/**
 * Create default filter config
 */
export function createFilterConfig(overrides?: Partial<FilterConfig>): FilterConfig {
  return { ...DEFAULT_FILTER_CONFIG, ...overrides };
}

/**
 * Create default dual filter config
 */
export function createDualFilterConfig(overrides?: Partial<DualFilterConfig>): DualFilterConfig {
  return { ...DEFAULT_DUAL_FILTER_CONFIG, ...overrides };
}
