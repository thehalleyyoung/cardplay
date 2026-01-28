/**
 * @fileoverview Wavetable Voice Engine
 * 
 * Complete voice architecture for wavetable synthesis that can
 * render sounds from unified presets.
 * 
 * @module @cardplay/core/audio/wavetable-voice
 */

import type {
  UnifiedPreset,
  UnifiedOscillator,
  UnifiedFilter,
  UnifiedEnvelope,
  UnifiedLFO,
  ModSource,
  ModDestination,
} from './unified-preset';

import {
  type Wavetable,
  interpolateFrame,
} from './wavetable-core';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum number of voices */
export const MAX_VOICES = 64;

/** Maximum unison voices per oscillator */
export const MAX_UNISON = 16;

/** Voice steal modes */
export type VoiceStealMode = 'oldest' | 'quietest' | 'lowest' | 'highest';

/** Default sample rate */
const DEFAULT_SAMPLE_RATE = 48000;

// ============================================================================
// ENVELOPE GENERATOR
// ============================================================================

/**
 * Envelope stage.
 */
type EnvelopeStage = 'idle' | 'delay' | 'attack' | 'hold' | 'decay' | 'sustain' | 'release';

/**
 * ADSR Envelope Generator.
 */
export class EnvelopeGenerator {
  private stage: EnvelopeStage = 'idle';
  private value = 0;
  private stageTime = 0;
  private releaseValue = 0;
  
  // Parameters (in samples)
  private delaySamples = 0;
  private attackSamples = 0;
  private holdSamples = 0;
  private decaySamples = 0;
  private sustain = 0.7;
  private releaseSamples = 0;
  
  // Curves
  private attackCurve = 0;
  private decayCurve = 0;
  private releaseCurve = 0;
  
  private sampleRate: number;
  
  constructor(sampleRate = DEFAULT_SAMPLE_RATE) {
    this.sampleRate = sampleRate;
  }
  
  /**
   * Configure envelope from unified settings.
   */
  configure(env: UnifiedEnvelope): void {
    this.delaySamples = env.delay * this.sampleRate;
    this.attackSamples = Math.max(1, env.attack * this.sampleRate);
    this.holdSamples = env.hold * this.sampleRate;
    this.decaySamples = Math.max(1, env.decay * this.sampleRate);
    this.sustain = env.sustain;
    this.releaseSamples = Math.max(1, env.release * this.sampleRate);
    this.attackCurve = env.attackCurve;
    this.decayCurve = env.decayCurve;
    this.releaseCurve = env.releaseCurve;
  }
  
  /**
   * Trigger the envelope (note on).
   */
  trigger(): void {
    this.stage = this.delaySamples > 0 ? 'delay' : 'attack';
    this.stageTime = 0;
    this.value = 0;
  }
  
  /**
   * Release the envelope (note off).
   */
  release(): void {
    if (this.stage !== 'idle') {
      this.stage = 'release';
      this.releaseValue = this.value;
      this.stageTime = 0;
    }
  }
  
  /**
   * Force envelope to idle.
   */
  reset(): void {
    this.stage = 'idle';
    this.value = 0;
    this.stageTime = 0;
  }
  
  /**
   * Check if envelope is active.
   */
  isActive(): boolean {
    return this.stage !== 'idle';
  }
  
  /**
   * Check if envelope is in release or idle.
   */
  isReleasing(): boolean {
    return this.stage === 'release' || this.stage === 'idle';
  }
  
  /**
   * Apply curve to linear position.
   */
  private applyCurve(linear: number, curve: number): number {
    if (curve === 0) return linear;
    if (curve > 0) {
      // Exponential (fast start, slow end)
      return 1 - Math.pow(1 - linear, 1 + curve * 3);
    } else {
      // Logarithmic (slow start, fast end)
      return Math.pow(linear, 1 - curve * 3);
    }
  }
  
  /**
   * Process one sample.
   */
  process(): number {
    switch (this.stage) {
      case 'idle':
        return 0;
        
      case 'delay':
        this.stageTime++;
        if (this.stageTime >= this.delaySamples) {
          this.stage = 'attack';
          this.stageTime = 0;
        }
        return 0;
        
      case 'attack': {
        const progress = this.stageTime / this.attackSamples;
        this.value = this.applyCurve(progress, this.attackCurve);
        this.stageTime++;
        if (this.stageTime >= this.attackSamples) {
          this.value = 1;
          this.stage = this.holdSamples > 0 ? 'hold' : 'decay';
          this.stageTime = 0;
        }
        return this.value;
      }
      
      case 'hold':
        this.stageTime++;
        if (this.stageTime >= this.holdSamples) {
          this.stage = 'decay';
          this.stageTime = 0;
        }
        return 1;
        
      case 'decay': {
        const progress = this.stageTime / this.decaySamples;
        const curved = this.applyCurve(progress, this.decayCurve);
        this.value = 1 - curved * (1 - this.sustain);
        this.stageTime++;
        if (this.stageTime >= this.decaySamples) {
          this.value = this.sustain;
          this.stage = 'sustain';
        }
        return this.value;
      }
      
      case 'sustain':
        return this.sustain;
        
      case 'release': {
        const progress = this.stageTime / this.releaseSamples;
        const curved = this.applyCurve(progress, this.releaseCurve);
        this.value = this.releaseValue * (1 - curved);
        this.stageTime++;
        if (this.stageTime >= this.releaseSamples) {
          this.value = 0;
          this.stage = 'idle';
        }
        return this.value;
      }
    }
  }
  
  /**
   * Get current value without advancing.
   */
  getValue(): number {
    return this.value;
  }
}

// ============================================================================
// LFO
// ============================================================================

/**
 * Low Frequency Oscillator.
 */
export class LFOProcessor {
  private phase = 0;
  private rateHz = 1;
  private shape: UnifiedLFO['shape'] = 'sine';
  private pulseWidth = 0.5;
  private smooth = 0;
  private lastValue = 0;
  private delayRemaining = 0;
  private fadeInRemaining = 0;
  private fadeInTotal = 0;
  
  private sampleRate: number;
  
  constructor(sampleRate = DEFAULT_SAMPLE_RATE) {
    this.sampleRate = sampleRate;
  }
  
  /**
   * Configure from unified settings.
   */
  configure(lfo: UnifiedLFO): void {
    this.rateHz = lfo.rateHz;
    this.shape = lfo.shape;
    this.phase = lfo.phase;
    this.pulseWidth = lfo.pulseWidth;
    this.smooth = lfo.smooth;
    this.delayRemaining = lfo.delay * this.sampleRate;
    this.fadeInRemaining = lfo.fadeIn * this.sampleRate;
    this.fadeInTotal = this.fadeInRemaining;
  }
  
  /**
   * Trigger LFO (reset phase if in trigger mode).
   */
  trigger(): void {
    this.phase = 0;
    this.delayRemaining = 0; // Reset on retrigger
    this.fadeInRemaining = this.fadeInTotal;
  }
  
  /**
   * Process one sample.
   */
  process(): number {
    // Handle delay
    if (this.delayRemaining > 0) {
      this.delayRemaining--;
      return 0;
    }
    
    // Generate raw waveform
    let value: number;
    
    switch (this.shape) {
      case 'sine':
        value = Math.sin(this.phase * Math.PI * 2);
        break;
      case 'triangle':
        value = 1 - 4 * Math.abs(Math.round(this.phase) - this.phase);
        break;
      case 'saw-up':
        value = 2 * this.phase - 1;
        break;
      case 'saw-down':
        value = 1 - 2 * this.phase;
        break;
      case 'square':
        value = this.phase < this.pulseWidth ? 1 : -1;
        break;
      case 'pulse':
        value = this.phase < this.pulseWidth ? 1 : -1;
        break;
      case 'random':
        value = Math.random() * 2 - 1;
        break;
      case 'sample-hold':
        if (this.phase < this.rateHz / this.sampleRate) {
          this.lastValue = Math.random() * 2 - 1;
        }
        value = this.lastValue;
        break;
      default:
        value = Math.sin(this.phase * Math.PI * 2);
    }
    
    // Apply smoothing
    if (this.smooth > 0) {
      value = this.lastValue + (value - this.lastValue) * (1 - this.smooth);
    }
    this.lastValue = value;
    
    // Apply fade-in
    if (this.fadeInRemaining > 0) {
      const fadeAmount = 1 - (this.fadeInRemaining / this.fadeInTotal);
      value *= fadeAmount;
      this.fadeInRemaining--;
    }
    
    // Advance phase
    this.phase += this.rateHz / this.sampleRate;
    while (this.phase >= 1) this.phase -= 1;
    
    return value;
  }
  
  /**
   * Get current value.
   */
  getValue(): number {
    return this.lastValue;
  }
}

// ============================================================================
// FILTER
// ============================================================================

/**
 * State Variable Filter (SVF) with multiple modes.
 */
export class SVFilter {
  private ic1eq = 0;
  private ic2eq = 0;
  private cutoff = 1000;
  private resonance = 0;
  private drive = 0;
  private filterType: UnifiedFilter['filterType'] = 'lp24';
  
  private sampleRate: number;
  
  constructor(sampleRate = DEFAULT_SAMPLE_RATE) {
    this.sampleRate = sampleRate;
  }
  
  /**
   * Configure from unified settings.
   */
  configure(filter: UnifiedFilter): void {
    this.filterType = filter.filterType;
    this.resonance = filter.resonance;
    this.drive = filter.drive;
    
    // Convert normalized cutoff to Hz
    if (filter.cutoffNormalized) {
      this.cutoff = 20 + filter.cutoff * 19980; // 20Hz to 20kHz
    } else {
      this.cutoff = filter.cutoff;
    }
  }
  
  /**
   * Set cutoff frequency in Hz.
   */
  setCutoff(hz: number): void {
    this.cutoff = Math.max(20, Math.min(20000, hz));
  }
  
  /**
   * Set cutoff from normalized value (0-1).
   */
  setCutoffNormalized(norm: number): void {
    this.cutoff = 20 * Math.pow(1000, norm);
  }
  
  /**
   * Reset filter state.
   */
  reset(): void {
    this.ic1eq = 0;
    this.ic2eq = 0;
  }
  
  /**
   * Process one sample.
   */
  process(input: number): number {
    if (this.filterType === 'off') return input;
    
    // Apply drive/saturation
    if (this.drive > 0) {
      input = Math.tanh(input * (1 + this.drive * 4));
    }
    
    // SVF coefficients
    const g = Math.tan(Math.PI * this.cutoff / this.sampleRate);
    const k = 2 - 2 * this.resonance;
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;
    
    // Process
    const v3 = input - this.ic2eq;
    const v1 = a1 * this.ic1eq + a2 * v3;
    const v2 = this.ic2eq + a2 * this.ic1eq + a3 * v3;
    
    this.ic1eq = 2 * v1 - this.ic1eq;
    this.ic2eq = 2 * v2 - this.ic2eq;
    
    // Output based on filter type
    switch (this.filterType) {
      case 'lp12':
      case 'lp24':
      case 'lp48':
      case 'ladder':
      case 'diode':
        return v2; // Low-pass
      case 'hp12':
      case 'hp24':
      case 'hp48':
        return input - k * v1 - v2; // High-pass
      case 'bp12':
      case 'bp24':
        return v1; // Band-pass
      case 'notch':
        return input - k * v1; // Notch
      case 'peak':
        return v2 - (input - k * v1 - v2); // Peak
      default:
        return v2;
    }
  }
}

// ============================================================================
// UNISON OSCILLATOR
// ============================================================================

/**
 * Single unison voice state.
 */
interface UnisonVoiceState {
  phase: number;
  frequency: number;
  detuneOffset: number;
  panOffset: number;
}

/**
 * Unison oscillator with multiple detuned voices.
 */
export class UnisonOscillator {
  private voices: UnisonVoiceState[] = [];
  private wavetable: Wavetable | null = null;
  private framePosition = 0;
  private level = 1;
  private pan = 0;
  
  private config: UnifiedOscillator;
  private sampleRate: number;
  
  constructor(sampleRate = DEFAULT_SAMPLE_RATE) {
    this.sampleRate = sampleRate;
    this.config = {
      index: 0,
      enabled: true,
      waveformType: 'wavetable',
      wavetableId: null,
      wavetablePosition: 0,
      wavetableModDepth: 0,
      octave: 0,
      semitone: 0,
      cents: 0,
      level: 1,
      pan: 0,
      phase: 0,
      phaseRandom: 0,
      unison: { voices: 1, detune: 0, spread: 0.5, blend: 0.5 },
      shape: 0.5,
      distortion: 0,
      distortionType: 'none',
      fmSource: -1,
      fmDepth: 0,
      toFilter1: true,
      toFilter2: false,
    };
  }
  
  /**
   * Configure from unified settings.
   */
  configure(osc: UnifiedOscillator): void {
    this.config = osc;
    this.level = osc.level;
    this.pan = osc.pan;
    this.framePosition = osc.wavetablePosition;
    
    // Create unison voices
    const numVoices = Math.max(1, Math.min(MAX_UNISON, osc.unison.voices));
    this.voices = [];
    
    for (let i = 0; i < numVoices; i++) {
      // Calculate detune spread
      let detuneOffset = 0;
      let panOffset = 0;
      
      if (numVoices > 1) {
        const position = (i / (numVoices - 1)) * 2 - 1; // -1 to +1
        detuneOffset = position * osc.unison.detune; // In cents
        panOffset = position * osc.unison.spread;
      }
      
      // Apply phase randomization
      const phase = osc.phaseRandom > 0 
        ? Math.random() * osc.phaseRandom 
        : osc.phase;
      
      this.voices.push({
        phase,
        frequency: 440,
        detuneOffset,
        panOffset,
      });
    }
  }
  
  /**
   * Set the wavetable to use.
   */
  setWavetable(wt: Wavetable | null): void {
    this.wavetable = wt;
  }
  
  /**
   * Set base frequency.
   */
  setFrequency(hz: number): void {
    // Apply pitch offsets
    const pitchOffset = this.config.octave * 12 + this.config.semitone + this.config.cents / 100;
    const basePitched = hz * Math.pow(2, pitchOffset / 12);
    
    for (const voice of this.voices) {
      voice.frequency = basePitched * Math.pow(2, voice.detuneOffset / 1200);
    }
  }
  
  /**
   * Set wavetable frame position (0-1).
   */
  setFramePosition(pos: number): void {
    this.framePosition = Math.max(0, Math.min(1, pos));
  }
  
  /**
   * Reset oscillator state.
   */
  reset(): void {
    for (const voice of this.voices) {
      voice.phase = this.config.phaseRandom > 0 
        ? Math.random() * this.config.phaseRandom 
        : this.config.phase;
    }
  }
  
  /**
   * Process and return stereo output.
   */
  process(fmInput = 0): [number, number] {
    if (!this.config.enabled || !this.wavetable || this.voices.length === 0) {
      return [0, 0];
    }
    
    let sumL = 0;
    let sumR = 0;
    const numVoices = this.voices.length;
    
    for (const voice of this.voices) {
      // Apply FM
      let freq = voice.frequency;
      if (this.config.fmDepth > 0) {
        freq *= 1 + fmInput * this.config.fmDepth;
      }
      
      // Read from wavetable
      const sample = interpolateFrame(
        this.wavetable,
        this.framePosition,
        voice.phase * this.wavetable.frameSize,
        'linear',
        'linear'
      );
      
      // Apply distortion
      let output = sample;
      if (this.config.distortion > 0) {
        const drive = 1 + this.config.distortion * 10;
        switch (this.config.distortionType) {
          case 'soft':
            output = Math.tanh(output * drive);
            break;
          case 'hard':
            output = Math.max(-1, Math.min(1, output * drive));
            break;
          case 'fold':
            output = output * drive;
            while (Math.abs(output) > 1) {
              output = output > 1 ? 2 - output : -2 - output;
            }
            break;
          case 'bit': {
            const bits = Math.max(2, 16 - Math.floor(this.config.distortion * 14));
            const levels = Math.pow(2, bits);
            output = Math.round(output * levels) / levels;
            break;
          }
        }
      }
      
      // Apply per-voice pan
      const voicePan = this.pan + voice.panOffset;
      const panL = Math.cos((voicePan + 1) * Math.PI / 4);
      const panR = Math.sin((voicePan + 1) * Math.PI / 4);
      
      sumL += output * panL;
      sumR += output * panR;
      
      // Advance phase
      voice.phase += freq / this.sampleRate;
      while (voice.phase >= 1) voice.phase -= 1;
    }
    
    // Normalize and apply level
    const norm = this.level / Math.sqrt(numVoices);
    return [sumL * norm, sumR * norm];
  }
}

// ============================================================================
// VOICE
// ============================================================================

/**
 * Voice state.
 */
export type VoiceState = 'idle' | 'playing' | 'releasing' | 'stealing';

/**
 * Complete synthesizer voice.
 */
export class WavetableVoice {
  /** Voice state */
  state: VoiceState = 'idle';
  /** MIDI note number */
  note = 60;
  /** Note velocity */
  velocity = 1;
  /** Voice age (for stealing) */
  age = 0;
  
  // Oscillators
  private oscillators: UnisonOscillator[] = [];
  
  // Filters
  private filters: SVFilter[] = [];
  
  // Envelopes
  private ampEnv: EnvelopeGenerator;
  private filterEnv: EnvelopeGenerator;
  private modEnvs: EnvelopeGenerator[] = [];
  
  // LFOs (per-voice instances)
  private lfos: LFOProcessor[] = [];
  
  // Modulation values (updated each sample)
  private modValues: Map<ModSource, number> = new Map();
  
  // Output accumulators
  private outputL = 0;
  private outputR = 0;
  
  // private sampleRate: number; // Reserved for rate tracking
  private preset: UnifiedPreset | null = null;
  
  constructor(sampleRate = DEFAULT_SAMPLE_RATE) {
    // this.sampleRate = sampleRate; // Reserved for future features
    
    // Create components
    for (let i = 0; i < 3; i++) {
      this.oscillators.push(new UnisonOscillator(sampleRate));
    }
    
    for (let i = 0; i < 2; i++) {
      this.filters.push(new SVFilter(sampleRate));
    }
    
    this.ampEnv = new EnvelopeGenerator(sampleRate);
    this.filterEnv = new EnvelopeGenerator(sampleRate);
    
    for (let i = 0; i < 4; i++) {
      this.modEnvs.push(new EnvelopeGenerator(sampleRate));
    }
    
    for (let i = 0; i < 8; i++) {
      this.lfos.push(new LFOProcessor(sampleRate));
    }
  }
  
  /**
   * Load preset into voice.
   */
  loadPreset(preset: UnifiedPreset): void {
    this.preset = preset;
    
    // Configure oscillators
    for (let i = 0; i < 3; i++) {
      if (preset.oscillators[i]) {
        this.oscillators[i]!.configure(preset.oscillators[i]!);
      }
    }
    
    // Configure filters
    for (let i = 0; i < 2; i++) {
      if (preset.filters[i]) {
        this.filters[i]!.configure(preset.filters[i]!);
      }
    }
    
    // Configure envelopes
    const ampEnvConfig = preset.envelopes.find(e => e.id === 'amp');
    if (ampEnvConfig) this.ampEnv.configure(ampEnvConfig);
    
    const filterEnvConfig = preset.envelopes.find(e => e.id === 'filter');
    if (filterEnvConfig) this.filterEnv.configure(filterEnvConfig);
    
    const modEnvConfigs = preset.envelopes.filter(e => e.id.startsWith('mod'));
    for (let i = 0; i < Math.min(4, modEnvConfigs.length); i++) {
      this.modEnvs[i]!.configure(modEnvConfigs[i]!);
    }
    
    // Configure LFOs
    for (let i = 0; i < Math.min(8, preset.lfos.length); i++) {
      if (preset.lfos[i]?.enabled) {
        this.lfos[i]!.configure(preset.lfos[i]!);
      }
    }
  }
  
  /**
   * Set wavetables for oscillators.
   */
  setWavetables(wavetables: (Wavetable | null)[]): void {
    for (let i = 0; i < Math.min(3, wavetables.length); i++) {
      this.oscillators[i]!.setWavetable(wavetables[i]!);
    }
  }
  
  /**
   * Trigger note on.
   */
  noteOn(note: number, velocity: number): void {
    this.note = note;
    this.velocity = velocity;
    this.state = 'playing';
    this.age = 0;
    
    // Calculate frequency
    const freq = 440 * Math.pow(2, (note - 69) / 12);
    
    // Set oscillator frequencies
    for (const osc of this.oscillators) {
      osc.setFrequency(freq);
      osc.reset();
    }
    
    // Reset filters
    for (const filter of this.filters) {
      filter.reset();
    }
    
    // Trigger envelopes
    this.ampEnv.trigger();
    this.filterEnv.trigger();
    for (const env of this.modEnvs) {
      env.trigger();
    }
    
    // Trigger LFOs
    for (const lfo of this.lfos) {
      lfo.trigger();
    }
    
    // Initialize mod values
    this.modValues.set('velocity', velocity);
    this.modValues.set('keytrack', (note - 60) / 60); // Normalized keytrack
  }
  
  /**
   * Trigger note off.
   */
  noteOff(): void {
    if (this.state === 'playing') {
      this.state = 'releasing';
      this.ampEnv.release();
      this.filterEnv.release();
      for (const env of this.modEnvs) {
        env.release();
      }
    }
  }
  
  /**
   * Force voice to stop.
   */
  kill(): void {
    this.state = 'idle';
    this.ampEnv.reset();
    this.filterEnv.reset();
    for (const env of this.modEnvs) {
      env.reset();
    }
  }
  
  /**
   * Check if voice is active.
   */
  isActive(): boolean {
    return this.state !== 'idle';
  }
  
  /**
   * Update modulation values.
   */
  private updateModulations(): void {
    // Envelopes
    this.modValues.set('env_amp', this.ampEnv.getValue());
    this.modValues.set('env_filter', this.filterEnv.getValue());
    for (let i = 0; i < 4; i++) {
      this.modValues.set(`env_mod${i + 1}` as ModSource, this.modEnvs[i]!.getValue());
    }
    
    // LFOs
    for (let i = 0; i < 8; i++) {
      this.modValues.set(`lfo_${i + 1}` as ModSource, this.lfos[i]!.getValue());
    }
  }
  
  /**
   * Get modulation value for a destination.
   */
  private getModulationFor(dest: ModDestination): number {
    if (!this.preset) return 0;
    
    let total = 0;
    
    for (const route of this.preset.modulations) {
      if (route.destination === dest) {
        const sourceValue = this.modValues.get(route.source) ?? 0;
        let amount = route.amount;
        
        // Apply bipolar scaling
        if (!route.bipolar) {
          amount = (sourceValue + 1) / 2 * route.amount;
        } else {
          amount = sourceValue * route.amount;
        }
        
        total += amount;
      }
    }
    
    return total;
  }
  
  /**
   * Process one sample, returning stereo output.
   */
  process(): [number, number] {
    if (this.state === 'idle') {
      return [0, 0];
    }
    
    this.age++;
    
    // Process envelopes
    const ampEnvValue = this.ampEnv.process();
    this.filterEnv.process();
    for (const env of this.modEnvs) {
      env.process();
    }
    
    // Process LFOs
    for (const lfo of this.lfos) {
      lfo.process();
    }
    
    // Update mod values
    this.updateModulations();
    
    // Check if voice has finished
    if (!this.ampEnv.isActive()) {
      this.state = 'idle';
      return [0, 0];
    }
    
    // Process oscillators
    let oscL = 0;
    let oscR = 0;
    
    for (let i = 0; i < 3; i++) {
      // Apply wavetable position modulation
      const positionMod = this.getModulationFor(`osc${i + 1}_wavetable` as ModDestination);
      const basePos = this.preset?.oscillators[i]?.wavetablePosition ?? 0;
      this.oscillators[i]!.setFramePosition(basePos + positionMod);
      
      // Process oscillator
      const [l, r] = this.oscillators[i]!.process(0);
      oscL += l;
      oscR += r;
    }
    
    // Apply filters
    let filteredL = oscL;
    let filteredR = oscR;
    
    for (let i = 0; i < 2; i++) {
      const filter = this.filters[i]!;
      const filterConfig = this.preset?.filters[i];
      
      if (filterConfig?.enabled) {
        // Apply cutoff modulation
        const cutoffMod = this.getModulationFor(`filter${i + 1}_cutoff` as ModDestination);
        const envMod = this.filterEnv.getValue() * (filterConfig.envDepth);
        
        const baseCutoff = filterConfig.cutoffNormalized 
          ? filterConfig.cutoff 
          : filterConfig.cutoff / 20000;
        
        filter.setCutoffNormalized(Math.max(0, Math.min(1, baseCutoff + cutoffMod + envMod)));
        
        // Process filter (mono for now, could do stereo)
        filteredL = filter.process(filteredL);
        filteredR = filter.process(filteredR);
      }
    }
    
    // Apply amplitude envelope and velocity
    const amp = ampEnvValue * this.velocity;
    this.outputL = filteredL * amp;
    this.outputR = filteredR * amp;
    
    return [this.outputL, this.outputR];
  }
  
  /**
   * Get current output level (for voice stealing decisions).
   */
  getOutputLevel(): number {
    return Math.abs(this.outputL) + Math.abs(this.outputR);
  }
}

// ============================================================================
// VOICE POOL
// ============================================================================

/**
 * Pool of voices for polyphonic playback.
 */
export class VoicePool {
  private voices: WavetableVoice[] = [];
  private activeNotes: Map<number, WavetableVoice> = new Map();
  private stealMode: VoiceStealMode = 'oldest';
  
  private preset: UnifiedPreset | null = null;
  private wavetables: (Wavetable | null)[] = [null, null, null];
  
  constructor(
    maxVoices = 16,
    sampleRate = DEFAULT_SAMPLE_RATE
  ) {
    for (let i = 0; i < maxVoices; i++) {
      this.voices.push(new WavetableVoice(sampleRate));
    }
  }
  
  /**
   * Load preset into all voices.
   */
  loadPreset(preset: UnifiedPreset): void {
    this.preset = preset;
    for (const voice of this.voices) {
      voice.loadPreset(preset);
    }
  }
  
  /**
   * Set wavetables for all voices.
   */
  setWavetables(wavetables: (Wavetable | null)[]): void {
    this.wavetables = wavetables;
    for (const voice of this.voices) {
      voice.setWavetables(wavetables);
    }
  }
  
  /**
   * Set voice steal mode.
   */
  setStealMode(mode: VoiceStealMode): void {
    this.stealMode = mode;
  }
  
  /**
   * Find a free voice or steal one.
   */
  private allocateVoice(): WavetableVoice {
    // First, look for idle voice
    for (const voice of this.voices) {
      if (!voice.isActive()) {
        return voice;
      }
    }
    
    // Need to steal a voice
    let victim = this.voices[0]!;
    
    switch (this.stealMode) {
      case 'oldest':
        for (const voice of this.voices) {
          if (voice.age > victim.age) {
            victim = voice;
          }
        }
        break;
        
      case 'quietest':
        for (const voice of this.voices) {
          if (voice.getOutputLevel() < victim.getOutputLevel()) {
            victim = voice;
          }
        }
        break;
        
      case 'lowest':
        for (const voice of this.voices) {
          if (voice.note < victim.note) {
            victim = voice;
          }
        }
        break;
        
      case 'highest':
        for (const voice of this.voices) {
          if (voice.note > victim.note) {
            victim = voice;
          }
        }
        break;
    }
    
    // Remove from active notes
    this.activeNotes.delete(victim.note);
    victim.kill();
    
    return victim;
  }
  
  /**
   * Trigger note on.
   */
  noteOn(note: number, velocity: number): void {
    // Check if note is already playing
    const existing = this.activeNotes.get(note);
    if (existing) {
      existing.noteOff();
    }
    
    const voice = this.allocateVoice();
    
    if (this.preset) {
      voice.loadPreset(this.preset);
    }
    voice.setWavetables(this.wavetables);
    voice.noteOn(note, velocity);
    
    this.activeNotes.set(note, voice);
  }
  
  /**
   * Trigger note off.
   */
  noteOff(note: number): void {
    const voice = this.activeNotes.get(note);
    if (voice) {
      voice.noteOff();
      // Don't remove from map until voice is idle
    }
  }
  
  /**
   * All notes off.
   */
  allNotesOff(): void {
    for (const voice of this.voices) {
      voice.noteOff();
    }
  }
  
  /**
   * Kill all voices immediately.
   */
  panic(): void {
    for (const voice of this.voices) {
      voice.kill();
    }
    this.activeNotes.clear();
  }
  
  /**
   * Process one sample, returning stereo output.
   */
  process(): [number, number] {
    let sumL = 0;
    let sumR = 0;
    
    for (const voice of this.voices) {
      if (voice.isActive()) {
        const [l, r] = voice.process();
        sumL += l;
        sumR += r;
      }
    }
    
    // Clean up finished notes from active map
    for (const [note, voice] of this.activeNotes) {
      if (!voice.isActive()) {
        this.activeNotes.delete(note);
      }
    }
    
    return [sumL, sumR];
  }
  
  /**
   * Process a block of samples.
   */
  processBlock(outputL: Float32Array, outputR: Float32Array): void {
    const len = outputL.length;
    
    for (let i = 0; i < len; i++) {
      const [l, r] = this.process();
      outputL[i] = l;
      outputR[i] = r;
    }
  }
  
  /**
   * Get number of active voices.
   */
  getActiveVoiceCount(): number {
    let count = 0;
    for (const voice of this.voices) {
      if (voice.isActive()) count++;
    }
    return count;
  }
}

// ============================================================================
// WAVETABLE INSTRUMENT
// ============================================================================

/**
 * Complete wavetable instrument with preset loading.
 */
export class WavetableInstrument {
  private voicePool: VoicePool;
  private preset: UnifiedPreset | null = null;
  private wavetableCache: Map<string, Wavetable> = new Map();
  
  private masterVolume = 0.8;
  private masterPan = 0;
  
  // private sampleRate: number; // Reserved for rate tracking
  
  constructor(maxVoices = 16, sampleRate = DEFAULT_SAMPLE_RATE) {
    // this.sampleRate = sampleRate; // Reserved for future features
    this.voicePool = new VoicePool(maxVoices, sampleRate);
  }
  
  /**
   * Load a preset.
   */
  async loadPreset(
    preset: UnifiedPreset,
    wavetableLoader?: (id: string) => Promise<Wavetable | null>
  ): Promise<void> {
    this.preset = preset;
    this.masterVolume = preset.masterVolume;
    this.masterPan = preset.masterPan;
    
    // Load wavetables for oscillators
    const wavetables: (Wavetable | null)[] = [];
    
    for (const osc of preset.oscillators) {
      if (osc.wavetableId && wavetableLoader) {
        // Check cache first
        let wt = this.wavetableCache.get(osc.wavetableId);
        
        if (!wt) {
          wt = await wavetableLoader(osc.wavetableId) ?? undefined;
          if (wt) {
            this.wavetableCache.set(osc.wavetableId, wt);
          }
        }
        
        wavetables.push(wt ?? null);
      } else {
        wavetables.push(null);
      }
    }
    
    this.voicePool.loadPreset(preset);
    this.voicePool.setWavetables(wavetables);
  }
  
  /**
   * Manually add a wavetable to the cache.
   */
  addWavetable(id: string, wavetable: Wavetable): void {
    this.wavetableCache.set(id, wavetable);
  }
  
  /**
   * Note on.
   */
  noteOn(note: number, velocity = 1): void {
    this.voicePool.noteOn(note, velocity);
  }
  
  /**
   * Note off.
   */
  noteOff(note: number): void {
    this.voicePool.noteOff(note);
  }
  
  /**
   * All notes off.
   */
  allNotesOff(): void {
    this.voicePool.allNotesOff();
  }
  
  /**
   * Panic - kill all voices immediately.
   */
  panic(): void {
    this.voicePool.panic();
  }
  
  /**
   * Set master volume.
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }
  
  /**
   * Set master pan.
   */
  setMasterPan(pan: number): void {
    this.masterPan = Math.max(-1, Math.min(1, pan));
  }
  
  /**
   * Process a block of samples.
   */
  processBlock(outputL: Float32Array, outputR: Float32Array): void {
    const len = outputL.length;
    const tempL = new Float32Array(len);
    const tempR = new Float32Array(len);
    
    // Process voice pool
    this.voicePool.processBlock(tempL, tempR);
    
    // Apply master volume and pan
    const panL = Math.cos((this.masterPan + 1) * Math.PI / 4);
    const panR = Math.sin((this.masterPan + 1) * Math.PI / 4);
    
    for (let i = 0; i < len; i++) {
      outputL[i] = tempL[i]! * this.masterVolume * panL;
      outputR[i] = tempR[i]! * this.masterVolume * panR;
    }
  }
  
  /**
   * Get current preset.
   */
  getPreset(): UnifiedPreset | null {
    return this.preset;
  }
  
  /**
   * Get active voice count.
   */
  getActiveVoiceCount(): number {
    return this.voicePool.getActiveVoiceCount();
  }
}
