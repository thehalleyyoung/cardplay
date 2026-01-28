/**
 * @fileoverview Hybrid Instrument Modes
 * 
 * Implements various hybrid synthesis modes combining:
 * - Sampler + Wavetable
 * - Sample attack + Wavetable sustain
 * - Wavetable attack + Sample sustain
 * - Granular + Wavetable
 * - FM + Sample
 * - Additive + Sample
 * 
 * @module @cardplay/core/audio/hybrid-instrument
 */

import { 
  Instrument, 
  InstrumentType, 
  InstrumentState,
  InstrumentMetrics,
  ActiveVoice,
  VoiceState,
  VoiceStealingMode,
  ModulationRouting,
  MacroControl,
  DualFilterConfig,
  EffectsChainConfig,
  InstrumentEventType,
  InstrumentEventListener,
  InstrumentSnapshot,
  CrossfadeCurve,
} from './unified-instrument';
import { UnifiedPreset, createInitPreset } from './unified-preset';

// ============================================================================
// HYBRID MODE TYPES
// ============================================================================

/** Hybrid synthesis mode */
export type HybridMode =
  | 'sample_wt_parallel'      // Both play simultaneously
  | 'sample_wt_crossfade'     // Crossfade based on control
  | 'sample_attack_wt_sustain' // Sample for attack, wavetable for sustain
  | 'wt_attack_sample_sustain' // Wavetable for attack, sample for sustain
  | 'sample_layer_wt_layer'    // Layered with independent controls
  | 'velocity_split'           // Low velocity = sample, high = wavetable
  | 'key_split'                // Low keys = sample, high = wavetable
  | 'release_sample'           // Main wavetable, release triggers sample
  | 'granular_wt'              // Granular processing of wavetable
  | 'fm_sample'                // FM modulation with sample carriers
  | 'additive_sample';         // Additive resynthesis with sample layer

/** Hybrid voice state */
export interface HybridVoiceState {
  voiceId: number;
  note: number;
  velocity: number;
  state: VoiceState;
  startTime: number;
  releaseTime: number | null;
  
  // Component states
  samplerActive: boolean;
  wavetableActive: boolean;
  
  // Phase tracking
  attackPhase: number;  // 0-1
  sustainPhase: number; // 0-1
  releasePhase: number; // 0-1
  
  // Crossfade
  crossfadePosition: number; // 0-1 (sample to wavetable)
  
  // Per-voice modulation
  morphPosition: number;
  filterCutoff: number;
  
  // Granular state (if applicable)
  grainPosition: number;
  grainDensity: number;
  grainSize: number;
}

/** Hybrid configuration */
export interface HybridConfig {
  mode: HybridMode;
  
  // Crossfade settings
  crossfadeTime: number; // seconds
  crossfadeCurve: CrossfadeCurve;
  crossfadeControl: 'time' | 'velocity' | 'keytrack' | 'modwheel' | 'aftertouch' | 'macro';
  crossfadeMacroIndex: number;
  
  // Attack/Sustain transition
  attackToSustainTime: number; // seconds
  attackToSustainCurve: CrossfadeCurve;
  
  // Velocity split
  velocitySplitPoint: number; // 0-127
  velocityCrossfadeWidth: number; // 0-127
  
  // Key split
  keySplitPoint: number; // 0-127
  keyCrossfadeWidth: number; // semitones
  
  // Morph control
  morphSource: 'lfo' | 'env' | 'velocity' | 'keytrack' | 'modwheel' | 'macro';
  morphMacroIndex: number;
  morphDepth: number;
  
  // Release sample
  releaseSampleEnabled: boolean;
  releaseSampleDecay: number; // 0-1
  releaseSampleOffset: number; // seconds
  
  // Granular settings
  granularEnabled: boolean;
  granularDensity: number; // grains per second
  granularSize: number; // seconds
  granularPitch: number; // semitones
  granularSpread: number; // stereo spread
  granularRandom: number; // position randomization
  
  // FM settings
  fmEnabled: boolean;
  fmRatio: number;
  fmDepth: number;
  fmEnvAmount: number;
}

/** Default hybrid config */
export const DEFAULT_HYBRID_CONFIG: HybridConfig = {
  mode: 'sample_wt_parallel',
  crossfadeTime: 0.5,
  crossfadeCurve: 'equal_power',
  crossfadeControl: 'modwheel',
  crossfadeMacroIndex: 0,
  attackToSustainTime: 0.1,
  attackToSustainCurve: 'equal_power',
  velocitySplitPoint: 64,
  velocityCrossfadeWidth: 20,
  keySplitPoint: 60,
  keyCrossfadeWidth: 6,
  morphSource: 'modwheel',
  morphMacroIndex: 1,
  morphDepth: 1,
  releaseSampleEnabled: false,
  releaseSampleDecay: 0.5,
  releaseSampleOffset: 0,
  granularEnabled: false,
  granularDensity: 20,
  granularSize: 0.05,
  granularPitch: 0,
  granularSpread: 0.5,
  granularRandom: 0.1,
  fmEnabled: false,
  fmRatio: 2,
  fmDepth: 0,
  fmEnvAmount: 0.5,
};

// ============================================================================
// HYBRID VOICE
// ============================================================================

/**
 * Hybrid synthesis voice
 */
export class HybridVoice {
  private state: HybridVoiceState;
  private config: HybridConfig;
  private sampleRate: number;
  
  // Component oscillators (simplified for this implementation)
  private samplerPhase = 0;
  private wavetablePhase = 0;
  private frequency = 440;
  
  // Envelopes
  private ampEnvValue = 0;
  private attackEnvValue = 0;
  
  // Sample data reference
  private sampleData: Float32Array | null = null;
  private sampleLength = 0;
  private sampleLoopStart = 0;
  private sampleLoopEnd = 0;
  
  // Wavetable data reference
  private wavetableFrames: Float32Array[] = [];
  private wavetableFrameCount = 0;
  private wavetableFrameSize = 2048;
  
  // Granular state
  private grains: Array<{
    position: number;
    phase: number;
    pan: number;
    pitch: number;
    envelope: number;
  }> = [];
  private grainTimer = 0;
  
  constructor(sampleRate: number, config: HybridConfig) {
    this.sampleRate = sampleRate;
    this.config = config;
    
    this.state = {
      voiceId: 0,
      note: 60,
      velocity: 100,
      state: 'idle',
      startTime: 0,
      releaseTime: null,
      samplerActive: false,
      wavetableActive: false,
      attackPhase: 0,
      sustainPhase: 0,
      releasePhase: 0,
      crossfadePosition: 0.5,
      morphPosition: 0.5,
      filterCutoff: 1,
      grainPosition: 0,
      grainDensity: config.granularDensity,
      grainSize: config.granularSize,
    };
  }
  
  /**
   * Set sample data
   */
  setSampleData(data: Float32Array, loopStart?: number, loopEnd?: number): void {
    this.sampleData = data;
    this.sampleLength = data.length;
    this.sampleLoopStart = loopStart ?? 0;
    this.sampleLoopEnd = loopEnd ?? data.length;
  }
  
  /**
   * Set wavetable data
   */
  setWavetableData(frames: Float32Array[]): void {
    this.wavetableFrames = frames;
    this.wavetableFrameCount = frames.length;
    this.wavetableFrameSize = frames[0]?.length ?? 2048;
  }
  
  /**
   * Trigger note on
   */
  noteOn(note: number, velocity: number): void {
    this.state.note = note;
    this.state.velocity = velocity;
    this.state.state = 'attack';
    this.state.startTime = Date.now();
    this.state.releaseTime = null;
    
    this.frequency = 440 * Math.pow(2, (note - 69) / 12);
    this.samplerPhase = 0;
    this.wavetablePhase = Math.random();
    
    this.ampEnvValue = 0;
    this.attackEnvValue = 0;
    this.state.attackPhase = 0;
    this.state.sustainPhase = 0;
    this.state.releasePhase = 0;
    
    // Determine which components are active based on mode
    this.updateActiveComponents(velocity);
    
    // Initialize crossfade position
    this.initializeCrossfade(velocity);
  }
  
  /**
   * Trigger note off
   */
  noteOff(): void {
    if (this.state.state !== 'idle') {
      this.state.state = 'release';
      this.state.releaseTime = Date.now();
      this.state.releasePhase = 0;
    }
  }
  
  /**
   * Check if voice is active
   */
  isActive(): boolean {
    return this.state.state !== 'idle';
  }
  
  /**
   * Get voice state
   */
  getState(): HybridVoiceState {
    return { ...this.state };
  }
  
  /**
   * Process one sample
   */
  process(modWheelValue: number = 0): number {
    if (this.state.state === 'idle') return 0;
    
    // Update envelopes
    this.updateEnvelopes();
    
    // Update crossfade if needed
    this.updateCrossfade(modWheelValue);
    
    let output = 0;
    
    switch (this.config.mode) {
      case 'sample_wt_parallel':
        output = this.processSampleWtParallel();
        break;
        
      case 'sample_wt_crossfade':
        output = this.processSampleWtCrossfade();
        break;
        
      case 'sample_attack_wt_sustain':
        output = this.processSampleAttackWtSustain();
        break;
        
      case 'wt_attack_sample_sustain':
        output = this.processWtAttackSampleSustain();
        break;
        
      case 'velocity_split':
        output = this.processVelocitySplit();
        break;
        
      case 'key_split':
        output = this.processKeySplit();
        break;
        
      case 'release_sample':
        output = this.processReleaseSample();
        break;
        
      case 'granular_wt':
        output = this.processGranularWt();
        break;
        
      case 'fm_sample':
        output = this.processFmSample();
        break;
        
      default:
        output = this.processSampleWtParallel();
    }
    
    // Apply amp envelope
    output *= this.ampEnvValue * (this.state.velocity / 127);
    
    // Check if voice should stop
    if (this.state.state === 'release' && this.ampEnvValue < 0.001) {
      this.state.state = 'idle';
    }
    
    return output;
  }
  
  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================
  
  private updateActiveComponents(velocity: number): void {
    switch (this.config.mode) {
      case 'sample_wt_parallel':
      case 'sample_wt_crossfade':
      case 'sample_layer_wt_layer':
        this.state.samplerActive = true;
        this.state.wavetableActive = true;
        break;
        
      case 'sample_attack_wt_sustain':
        this.state.samplerActive = true;
        this.state.wavetableActive = false;
        break;
        
      case 'wt_attack_sample_sustain':
        this.state.samplerActive = false;
        this.state.wavetableActive = true;
        break;
        
      case 'velocity_split':
        this.state.samplerActive = velocity < this.config.velocitySplitPoint + this.config.velocityCrossfadeWidth;
        this.state.wavetableActive = velocity > this.config.velocitySplitPoint - this.config.velocityCrossfadeWidth;
        break;
        
      case 'key_split':
        this.state.samplerActive = this.state.note < this.config.keySplitPoint + this.config.keyCrossfadeWidth;
        this.state.wavetableActive = this.state.note > this.config.keySplitPoint - this.config.keyCrossfadeWidth;
        break;
        
      case 'release_sample':
        this.state.samplerActive = false;
        this.state.wavetableActive = true;
        break;
        
      case 'granular_wt':
      case 'fm_sample':
        this.state.samplerActive = true;
        this.state.wavetableActive = true;
        break;
    }
  }
  
  private initializeCrossfade(velocity: number): void {
    switch (this.config.crossfadeControl) {
      case 'velocity':
        this.state.crossfadePosition = velocity / 127;
        break;
        
      case 'keytrack':
        this.state.crossfadePosition = this.state.note / 127;
        break;
        
      default:
        this.state.crossfadePosition = 0.5;
    }
  }
  
  private updateCrossfade(modWheelValue: number): void {
    switch (this.config.crossfadeControl) {
      case 'modwheel':
        this.state.crossfadePosition = modWheelValue;
        break;
        
      case 'time':
        // Time-based crossfade handled in mode processors
        break;
    }
  }
  
  private updateEnvelopes(): void {
    const attackTime = 0.01; // Simple fixed attack
    const decayTime = 0.2;
    const sustainLevel = 0.7;
    const releaseTime = 0.3;
    
    switch (this.state.state) {
      case 'attack':
        this.state.attackPhase += 1 / (attackTime * this.sampleRate);
        if (this.state.attackPhase >= 1) {
          this.state.attackPhase = 1;
          this.state.state = 'sustain';
        }
        this.ampEnvValue = this.state.attackPhase;
        break;
        
      case 'sustain':
        this.state.sustainPhase += 1 / (decayTime * this.sampleRate);
        if (this.state.sustainPhase >= 1) {
          this.state.sustainPhase = 1;
        }
        this.ampEnvValue = 1 - (1 - sustainLevel) * this.state.sustainPhase;
        break;
        
      case 'release':
        this.state.releasePhase += 1 / (releaseTime * this.sampleRate);
        if (this.state.releasePhase >= 1) {
          this.state.releasePhase = 1;
          this.ampEnvValue = 0;
        } else {
          this.ampEnvValue *= (1 - this.state.releasePhase);
        }
        break;
    }
    
    // Attack envelope for transitions
    this.attackEnvValue = Math.min(1, this.state.attackPhase / (this.config.attackToSustainTime * this.sampleRate / 1000));
  }
  
  private readSample(): number {
    if (!this.sampleData || this.sampleLength === 0) return 0;
    
    const sampleIndex = Math.floor(this.samplerPhase);
    if (sampleIndex >= this.sampleLength) {
      // Loop
      this.samplerPhase = this.sampleLoopStart + (this.samplerPhase - this.sampleLoopEnd);
    }
    
    // Linear interpolation
    const idx0 = Math.floor(this.samplerPhase) % this.sampleLength;
    const idx1 = (idx0 + 1) % this.sampleLength;
    const frac = this.samplerPhase - Math.floor(this.samplerPhase);
    
    const sample = (this.sampleData?.[idx0] ?? 0) * (1 - frac) + (this.sampleData?.[idx1] ?? 0) * frac;
    
    // Advance phase based on frequency ratio
    const pitchRatio = this.frequency / 440; // Assuming sample is at A4
    this.samplerPhase += pitchRatio;
    
    return sample;
  }
  
  private readWavetable(): number {
    if (this.wavetableFrameCount === 0) return 0;
    
    // Get morph position between frames
    const framePos = this.state.morphPosition * (this.wavetableFrameCount - 1);
    const frame0 = Math.floor(framePos);
    const frame1 = Math.min(frame0 + 1, this.wavetableFrameCount - 1);
    const frameMix = framePos - frame0;
    
    const wt0 = this.wavetableFrames[frame0];
    const wt1 = this.wavetableFrames[frame1];
    
    if (!wt0 || !wt1) return 0;
    
    // Read from frames with interpolation
    const samplePos = this.wavetablePhase * this.wavetableFrameSize;
    const s0 = Math.floor(samplePos);
    const s1 = (s0 + 1) % this.wavetableFrameSize;
    const frac = samplePos - s0;
    
    const val0 = (wt0[s0] ?? 0) * (1 - frac) + (wt0[s1] ?? 0) * frac;
    const val1 = (wt1[s0] ?? 0) * (1 - frac) + (wt1[s1] ?? 0) * frac;
    const sample = val0 * (1 - frameMix) + val1 * frameMix;
    
    // Advance phase
    const phaseInc = this.frequency / this.sampleRate;
    this.wavetablePhase = (this.wavetablePhase + phaseInc) % 1;
    
    return sample;
  }
  
  private applyCrossfadeCurve(t: number): number {
    t = Math.max(0, Math.min(1, t));
    
    switch (this.config.crossfadeCurve) {
      case 'linear':
        return t;
      case 'equal_power':
        return Math.sqrt(t);
      case 'logarithmic':
        return Math.log10(1 + t * 9);
      case 'exponential':
        return t * t;
      default:
        return t;
    }
  }
  
  // ===========================================================================
  // MODE PROCESSORS
  // ===========================================================================
  
  private processSampleWtParallel(): number {
    const sampleOut = this.readSample();
    const wtOut = this.readWavetable();
    return (sampleOut + wtOut) * 0.5;
  }
  
  private processSampleWtCrossfade(): number {
    const sampleOut = this.readSample();
    const wtOut = this.readWavetable();
    
    const wtGain = this.applyCrossfadeCurve(this.state.crossfadePosition);
    const sampleGain = this.applyCrossfadeCurve(1 - this.state.crossfadePosition);
    
    return sampleOut * sampleGain + wtOut * wtGain;
  }
  
  private processSampleAttackWtSustain(): number {
    const sampleOut = this.readSample();
    const wtOut = this.readWavetable();
    
    // Transition from sample to wavetable based on attack envelope
    const wtGain = this.applyCrossfadeCurve(this.attackEnvValue);
    const sampleGain = this.applyCrossfadeCurve(1 - this.attackEnvValue);
    
    return sampleOut * sampleGain + wtOut * wtGain;
  }
  
  private processWtAttackSampleSustain(): number {
    const sampleOut = this.readSample();
    const wtOut = this.readWavetable();
    
    // Transition from wavetable to sample based on attack envelope
    const sampleGain = this.applyCrossfadeCurve(this.attackEnvValue);
    const wtGain = this.applyCrossfadeCurve(1 - this.attackEnvValue);
    
    return sampleOut * sampleGain + wtOut * wtGain;
  }
  
  private processVelocitySplit(): number {
    const velocity = this.state.velocity;
    const splitPoint = this.config.velocitySplitPoint;
    const width = this.config.velocityCrossfadeWidth;
    
    let sampleGain = 0;
    let wtGain = 0;
    
    if (velocity <= splitPoint - width) {
      sampleGain = 1;
      wtGain = 0;
    } else if (velocity >= splitPoint + width) {
      sampleGain = 0;
      wtGain = 1;
    } else {
      const t = (velocity - (splitPoint - width)) / (width * 2);
      wtGain = this.applyCrossfadeCurve(t);
      sampleGain = this.applyCrossfadeCurve(1 - t);
    }
    
    const sampleOut = this.state.samplerActive ? this.readSample() : 0;
    const wtOut = this.state.wavetableActive ? this.readWavetable() : 0;
    
    return sampleOut * sampleGain + wtOut * wtGain;
  }
  
  private processKeySplit(): number {
    const note = this.state.note;
    const splitPoint = this.config.keySplitPoint;
    const width = this.config.keyCrossfadeWidth;
    
    let sampleGain = 0;
    let wtGain = 0;
    
    if (note <= splitPoint - width) {
      sampleGain = 1;
      wtGain = 0;
    } else if (note >= splitPoint + width) {
      sampleGain = 0;
      wtGain = 1;
    } else {
      const t = (note - (splitPoint - width)) / (width * 2);
      wtGain = this.applyCrossfadeCurve(t);
      sampleGain = this.applyCrossfadeCurve(1 - t);
    }
    
    const sampleOut = this.state.samplerActive ? this.readSample() : 0;
    const wtOut = this.state.wavetableActive ? this.readWavetable() : 0;
    
    return sampleOut * sampleGain + wtOut * wtGain;
  }
  
  private processReleaseSample(): number {
    const wtOut = this.readWavetable();
    
    // During release, trigger sample
    if (this.state.state === 'release' && this.config.releaseSampleEnabled) {
      if (!this.state.samplerActive) {
        this.state.samplerActive = true;
        this.samplerPhase = this.config.releaseSampleOffset * this.sampleRate;
      }
      
      const sampleOut = this.readSample();
      const releaseMix = this.config.releaseSampleDecay * (1 - this.state.releasePhase);
      return wtOut * (1 - releaseMix) + sampleOut * releaseMix;
    }
    
    return wtOut;
  }
  
  private processGranularWt(): number {
    if (!this.config.granularEnabled) {
      return this.readWavetable();
    }
    
    // Update grain timer
    this.grainTimer += 1;
    const grainInterval = this.sampleRate / this.config.granularDensity;
    
    // Spawn new grain
    if (this.grainTimer >= grainInterval) {
      this.grainTimer = 0;
      
      const grain = {
        position: this.state.grainPosition + (Math.random() - 0.5) * this.config.granularRandom,
        phase: 0,
        pan: (Math.random() - 0.5) * this.config.granularSpread,
        pitch: this.config.granularPitch + (Math.random() - 0.5) * 1, // ±0.5 semitone random
        envelope: 0,
      };
      
      this.grains.push(grain);
      
      // Limit grain count
      if (this.grains.length > 32) {
        this.grains.shift();
      }
    }
    
    // Process all active grains
    let output = 0;
    const grainSamples = this.config.granularSize * this.sampleRate;
    
    this.grains = this.grains.filter(grain => {
      grain.phase += 1;
      
      if (grain.phase >= grainSamples) {
        return false; // Remove finished grain
      }
      
      // Gaussian-ish envelope
      const t = grain.phase / grainSamples;
      const env = Math.sin(t * Math.PI);
      
      // Read from wavetable at grain position
      const framePos = Math.max(0, Math.min(1, grain.position)) * (this.wavetableFrameCount - 1);
      const frame = Math.floor(framePos);
      const wt = this.wavetableFrames[frame];
      
      if (wt) {
        const pitchRatio = Math.pow(2, grain.pitch / 12);
        const samplePos = (grain.phase * pitchRatio * this.frequency / this.sampleRate) % 1;
        const idx = Math.floor(samplePos * this.wavetableFrameSize);
        output += (wt[idx] ?? 0) * env;
      }
      
      return true;
    });
    
    // Advance grain position slowly
    this.state.grainPosition = (this.state.grainPosition + 0.0001) % 1;
    
    return output / Math.max(1, this.grains.length) * 2;
  }
  
  private processFmSample(): number {
    if (!this.config.fmEnabled) {
      return this.processSampleWtParallel();
    }
    
    // Wavetable as modulator
    const modulator = this.readWavetable();
    
    // FM modulation
    const fmAmount = this.config.fmDepth * (1 + this.config.fmEnvAmount * (1 - this.attackEnvValue));
    const modPhase = modulator * fmAmount * this.config.fmRatio;
    
    // Apply to sample playback
    if (!this.sampleData || this.sampleLength === 0) return modulator;
    
    const modulatedPhase = this.samplerPhase + modPhase * this.sampleLength / 10;
    const idx = Math.floor(Math.abs(modulatedPhase)) % this.sampleLength;
    const sample = this.sampleData[idx] ?? 0;
    
    // Advance base phase
    const pitchRatio = this.frequency / 440;
    this.samplerPhase += pitchRatio;
    if (this.samplerPhase >= this.sampleLoopEnd) {
      this.samplerPhase = this.sampleLoopStart;
    }
    
    return sample;
  }
}

// ============================================================================
// HYBRID INSTRUMENT
// ============================================================================

/**
 * Full hybrid instrument implementation
 */
export class HybridInstrument implements Instrument {
  readonly id: string;
  readonly type: InstrumentType = 'hybrid';
  readonly name: string;
  
  private config: HybridConfig;
  private sampleRate: number;
  private state: InstrumentState = 'idle';
  
  // Voices
  private voices: HybridVoice[] = [];
  private activeVoiceCount = 0;
  private maxVoices = 32;
  private voiceStealingMode: VoiceStealingMode = 'oldest';
  
  // Sample data
  private sampleData: Float32Array | null = null;
  private sampleLoopStart = 0;
  private sampleLoopEnd = 0;
  
  // Wavetable data
  private wavetableFrames: Float32Array[] = [];
  
  // Modulation
  private modulations: ModulationRouting[] = [];
  private macros: MacroControl[] = [];
  
  // Current values
  private modWheelValue = 0;
  private masterVolume = 0.7;
  
  // Filter & Effects (simplified)
  private filterConfig: DualFilterConfig;
  private effectsConfig: EffectsChainConfig;
  
  // Events
  private eventListeners: Map<InstrumentEventType, Set<InstrumentEventListener>> = new Map();
  
  // Preset
  private currentPreset: UnifiedPreset | null = null;
  
  constructor(config: Partial<HybridConfig> = {}, sampleRate = 44100) {
    this.config = { ...DEFAULT_HYBRID_CONFIG, ...config };
    this.sampleRate = sampleRate;
    this.id = `hybrid_${Date.now()}`;
    this.name = 'Hybrid Instrument';
    
    // Pre-allocate voices
    for (let i = 0; i < this.maxVoices; i++) {
      this.voices.push(new HybridVoice(sampleRate, this.config));
    }
    
    // Initialize macros
    for (let i = 0; i < 8; i++) {
      this.macros.push({
        id: i,
        name: `Macro ${i + 1}`,
        value: 0,
        defaultValue: 0,
        min: 0,
        max: 1,
        targets: [],
      });
    }
    
    // Initialize filter config
    this.filterConfig = {
      filter1: { enabled: true, type: 'lp12', cutoff: 20000, resonance: 0, drive: 0, keytrack: 0, envAmount: 0, envVelocity: 0, mix: 1 },
      filter2: { enabled: false, type: 'hp12', cutoff: 20, resonance: 0, drive: 0, keytrack: 0, envAmount: 0, envVelocity: 0, mix: 1 },
      routing: 'serial',
      morphAmount: 0,
    };
    
    // Initialize effects config
    this.effectsConfig = {
      slots: [],
      masterVolume: 0.7,
      masterPan: 0,
      masterLimiter: true,
    };
  }
  
  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================
  
  async initialize(): Promise<void> {
    this.state = 'ready';
  }
  
  dispose(): void {
    this.allSoundsOff();
    this.state = 'idle';
  }
  
  suspend(): void {
    this.state = 'suspended';
  }
  
  resume(): void {
    this.state = 'ready';
  }
  
  getState(): InstrumentState {
    return this.state;
  }
  
  getMetrics(): InstrumentMetrics {
    return {
      activeVoices: this.activeVoiceCount,
      maxVoices: this.maxVoices,
      cpuUsage: this.activeVoiceCount / this.maxVoices,
      memoryUsageMB: (this.sampleData?.length ?? 0) * 4 / (1024 * 1024),
      sampleRate: this.sampleRate,
      latencyMs: 512 / this.sampleRate * 1000,
      voicesStolen: 0,
      lastUpdateTime: Date.now(),
    };
  }
  
  // ===========================================================================
  // DATA LOADING
  // ===========================================================================
  
  /**
   * Set sample data
   */
  setSampleData(data: Float32Array, loopStart?: number, loopEnd?: number): void {
    this.sampleData = data;
    this.sampleLoopStart = loopStart ?? 0;
    this.sampleLoopEnd = loopEnd ?? data.length;
    
    // Update all voices
    for (const voice of this.voices) {
      voice.setSampleData(data, this.sampleLoopStart, this.sampleLoopEnd);
    }
  }
  
  /**
   * Set wavetable data
   */
  setWavetableData(frames: Float32Array[]): void {
    this.wavetableFrames = frames;
    
    // Update all voices
    for (const voice of this.voices) {
      voice.setWavetableData(frames);
    }
  }
  
  /**
   * Set hybrid mode
   */
  setHybridMode(mode: HybridMode): void {
    this.config.mode = mode;
    
    // Recreate voices with new config
    this.voices = [];
    for (let i = 0; i < this.maxVoices; i++) {
      const voice = new HybridVoice(this.sampleRate, this.config);
      if (this.sampleData) {
        voice.setSampleData(this.sampleData, this.sampleLoopStart, this.sampleLoopEnd);
      }
      if (this.wavetableFrames.length > 0) {
        voice.setWavetableData(this.wavetableFrames);
      }
      this.voices.push(voice);
    }
  }
  
  /**
   * Get hybrid mode
   */
  getHybridMode(): HybridMode {
    return this.config.mode;
  }
  
  /**
   * Get hybrid config
   */
  getHybridConfig(): HybridConfig {
    return { ...this.config };
  }
  
  /**
   * Update hybrid config
   */
  updateHybridConfig(updates: Partial<HybridConfig>): void {
    this.config = { ...this.config, ...updates };
  }
  
  // ===========================================================================
  // PRESET
  // ===========================================================================
  
  async loadPreset(preset: UnifiedPreset): Promise<void> {
    this.currentPreset = preset;
    this.masterVolume = preset.masterVolume;
  }
  
  savePreset(): UnifiedPreset {
    if (this.currentPreset) {
      return this.currentPreset;
    }
    const initPreset = createInitPreset();
    initPreset.masterVolume = this.masterVolume;
    return initPreset;
  }
  
  getPreset(): UnifiedPreset | null {
    return this.currentPreset;
  }
  
  // ===========================================================================
  // VOICE MANAGEMENT
  // ===========================================================================
  
  noteOn(note: number, velocity: number, _channel = 0): number {
    // Find free voice
    let voice = this.voices.find(v => !v.isActive());
    
    if (!voice) {
      // Voice stealing
      voice = this.stealVoice();
    }
    
    if (voice) {
      voice.noteOn(note, velocity);
      this.activeVoiceCount++;
      this.state = 'playing';
    }
    
    return 0; // Voice ID (simplified)
  }
  
  noteOff(note: number, _channel = 0): void {
    for (const voice of this.voices) {
      const state = voice.getState();
      if (state.note === note && state.state !== 'idle' && state.state !== 'release') {
        voice.noteOff();
      }
    }
  }
  
  allNotesOff(): void {
    for (const voice of this.voices) {
      voice.noteOff();
    }
  }
  
  allSoundsOff(): void {
    // Recreate voices to reset completely
    this.voices = [];
    for (let i = 0; i < this.maxVoices; i++) {
      const voice = new HybridVoice(this.sampleRate, this.config);
      if (this.sampleData) {
        voice.setSampleData(this.sampleData, this.sampleLoopStart, this.sampleLoopEnd);
      }
      if (this.wavetableFrames.length > 0) {
        voice.setWavetableData(this.wavetableFrames);
      }
      this.voices.push(voice);
    }
    this.activeVoiceCount = 0;
    this.state = 'ready';
  }
  
  private stealVoice(): HybridVoice | undefined {
    if (this.voiceStealingMode === 'none') return undefined;
    
    let oldest: HybridVoice | undefined;
    let oldestTime = Infinity;
    
    for (const voice of this.voices) {
      const state = voice.getState();
      if (state.startTime < oldestTime) {
        oldest = voice;
        oldestTime = state.startTime;
      }
    }
    
    return oldest;
  }
  
  getActiveVoices(): ActiveVoice[] {
    return this.voices
      .filter(v => v.isActive())
      .map((v, i) => {
        const state = v.getState();
        return {
          id: i,
          state: state.state,
          params: {
            note: state.note,
            velocity: state.velocity,
            channel: 0,
            timestamp: state.startTime,
            pan: 0,
            expression: 1,
            pitchBend: 0,
            modWheel: this.modWheelValue,
            aftertouch: 0,
            pressure: 0,
            slide: 0,
            mpeNote: state.note,
          },
          startTime: state.startTime,
          releaseTime: state.releaseTime,
          amplitude: state.velocity / 127,
          frequency: 440 * Math.pow(2, (state.note - 69) / 12),
          instrumentIndex: 0,
          layerIndex: 0,
        };
      });
  }
  
  setMaxVoices(max: number): void {
    this.maxVoices = Math.max(1, Math.min(64, max));
  }
  
  setVoiceStealingMode(mode: VoiceStealingMode): void {
    this.voiceStealingMode = mode;
  }
  
  // ===========================================================================
  // PARAMETERS
  // ===========================================================================
  
  setParameter(name: string, value: number): void {
    switch (name) {
      case 'modwheel':
        this.modWheelValue = value;
        break;
      case 'crossfade':
        this.config.crossfadeTime = value;
        break;
      case 'morph':
        this.config.morphDepth = value;
        break;
    }
  }
  
  getParameter(name: string): number {
    switch (name) {
      case 'modwheel':
        return this.modWheelValue;
      case 'crossfade':
        return this.config.crossfadeTime;
      case 'morph':
        return this.config.morphDepth;
      default:
        return 0;
    }
  }
  
  getParameterInfo(_name: string): { min: number; max: number; default: number; name: string } | null {
    return null;
  }
  
  getParameterList(): string[] {
    return ['modwheel', 'crossfade', 'morph'];
  }
  
  // ===========================================================================
  // MODULATION
  // ===========================================================================
  
  setModulation(routing: ModulationRouting): void {
    const existing = this.modulations.findIndex(m => m.id === routing.id);
    if (existing >= 0) {
      this.modulations[existing] = routing;
    } else {
      this.modulations.push(routing);
    }
  }
  
  removeModulation(id: string): void {
    this.modulations = this.modulations.filter(m => m.id !== id);
  }
  
  getModulations(): ModulationRouting[] {
    return [...this.modulations];
  }
  
  setMacro(index: number, value: number): void {
    const macro = this.macros[index];
    if (macro && index >= 0 && index < this.macros.length) {
      macro.value = Math.max(0, Math.min(1, value));
    }
  }
  
  getMacro(index: number): number {
    return this.macros[index]?.value ?? 0;
  }
  
  getMacroConfig(index: number): MacroControl | null {
    return this.macros[index] ?? null;
  }
  
  // ===========================================================================
  // FILTER & EFFECTS
  // ===========================================================================
  
  setFilterConfig(config: DualFilterConfig): void {
    this.filterConfig = config;
  }
  
  getFilterConfig(): DualFilterConfig {
    return { ...this.filterConfig };
  }
  
  setEffectsConfig(config: EffectsChainConfig): void {
    this.effectsConfig = config;
  }
  
  getEffectsConfig(): EffectsChainConfig {
    return { ...this.effectsConfig };
  }
  
  // ===========================================================================
  // AUDIO PROCESSING
  // ===========================================================================
  
  process(outputL: Float32Array, outputR: Float32Array): void {
    this.processBlock(outputL, outputR, 0, outputL.length);
  }
  
  processBlock(outputL: Float32Array, outputR: Float32Array, offset: number, length: number): void {
    // Count active voices
    this.activeVoiceCount = 0;
    
    for (let i = offset; i < offset + length; i++) {
      let sampleL = 0;
      let sampleR = 0;
      
      for (const voice of this.voices) {
        if (voice.isActive()) {
          const sample = voice.process(this.modWheelValue);
          sampleL += sample;
          sampleR += sample;
        }
      }
      
      outputL[i] = sampleL * this.masterVolume;
      outputR[i] = sampleR * this.masterVolume;
    }
    
    // Count active voices
    for (const voice of this.voices) {
      if (voice.isActive()) {
        this.activeVoiceCount++;
      }
    }
    
    if (this.activeVoiceCount === 0 && this.state === 'playing') {
      this.state = 'ready';
    }
  }
  
  // ===========================================================================
  // MIDI
  // ===========================================================================
  
  processMIDI(data: Uint8Array, _timestamp: number): void {
    if (data.length < 1) return;
    
    const byte0 = data[0];
    if (byte0 === undefined) return;
    const status = byte0 & 0xf0;
    const channel = byte0 & 0x0f;
    
    switch (status) {
      case 0x90: // Note On
        if (data.length >= 3 && (data[2] ?? 0) > 0) {
          this.noteOn(data[1] ?? 0, data[2] ?? 0, channel);
        } else if (data.length >= 3) {
          this.noteOff(data[1] ?? 0, channel);
        }
        break;
      case 0x80: // Note Off
        if (data.length >= 3) {
          this.noteOff(data[1] ?? 0, channel);
        }
        break;
      case 0xb0: // CC
        if (data.length >= 3 && (data[1] ?? 0) === 1) {
          this.modWheelValue = (data[2] ?? 0) / 127;
        }
        break;
    }
  }
  
  setPitchBendRange(_semitones: number): void {
    // Not implemented in this simplified version
  }
  
  // ===========================================================================
  // MPE
  // ===========================================================================
  
  private mpeEnabled = false;
  
  setMPEEnabled(enabled: boolean): void {
    this.mpeEnabled = enabled;
  }
  
  isMPEEnabled(): boolean {
    return this.mpeEnabled;
  }
  
  // ===========================================================================
  // EVENTS
  // ===========================================================================
  
  addEventListener(type: InstrumentEventType, listener: InstrumentEventListener): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(listener);
  }
  
  removeEventListener(type: InstrumentEventType, listener: InstrumentEventListener): void {
    this.eventListeners.get(type)?.delete(listener);
  }
  
  // ===========================================================================
  // UNDO/REDO & FREEZE
  // ===========================================================================
  
  saveSnapshot(): InstrumentSnapshot {
    return {
      id: `snapshot_${Date.now()}`,
      timestamp: Date.now(),
      preset: this.savePreset(),
      voiceStates: new Map(),
      modulations: [...this.modulations],
      macros: this.macros.map(m => ({ ...m, targets: [...m.targets] })),
      filterConfig: { ...this.filterConfig },
      effectsConfig: { ...this.effectsConfig, slots: this.effectsConfig.slots.map(s => ({ ...s })) },
      layers: [],
    };
  }
  
  restoreSnapshot(snapshot: InstrumentSnapshot): void {
    this.currentPreset = snapshot.preset;
    this.modulations = [...snapshot.modulations];
  }
  
  async freeze(durationSeconds: number): Promise<Float32Array> {
    const numSamples = Math.ceil(durationSeconds * this.sampleRate);
    const left = new Float32Array(numSamples);
    const right = new Float32Array(numSamples);
    this.processBlock(left, right, 0, numSamples);
    
    const stereo = new Float32Array(numSamples * 2);
    for (let i = 0; i < numSamples; i++) {
      stereo[i * 2] = left[i] ?? 0;
      stereo[i * 2 + 1] = right[i] ?? 0;
    }
    return stereo;
  }
  
  async bounceToSample(note: number, velocity: number, durationSeconds: number): Promise<Float32Array> {
    const numSamples = Math.ceil(durationSeconds * this.sampleRate);
    const left = new Float32Array(numSamples);
    const right = new Float32Array(numSamples);
    
    this.noteOn(note, velocity);
    const noteOffSample = Math.floor(numSamples * 0.8);
    
    const blockSize = 512;
    for (let i = 0; i < numSamples; i += blockSize) {
      const len = Math.min(blockSize, numSamples - i);
      if (i >= noteOffSample && i < noteOffSample + blockSize) {
        this.noteOff(note);
      }
      this.processBlock(left, right, i, len);
    }
    
    const stereo = new Float32Array(numSamples * 2);
    for (let i = 0; i < numSamples; i++) {
      stereo[i * 2] = left[i] ?? 0;
      stereo[i * 2 + 1] = right[i] ?? 0;
    }
    return stereo;
  }
  
  async clone(): Promise<Instrument> {
    const cloned = new HybridInstrument(this.config, this.sampleRate);
    if (this.sampleData) {
      cloned.setSampleData(this.sampleData, this.sampleLoopStart, this.sampleLoopEnd);
    }
    if (this.wavetableFrames.length > 0) {
      cloned.setWavetableData(this.wavetableFrames);
    }
    return cloned;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createHybridInstrument(
  config?: Partial<HybridConfig>,
  sampleRate = 44100
): HybridInstrument {
  return new HybridInstrument(config, sampleRate);
}

/**
 * Available hybrid modes with descriptions
 */
export const HYBRID_MODE_DESCRIPTIONS: Record<HybridMode, string> = {
  'sample_wt_parallel': 'Sample and wavetable play simultaneously',
  'sample_wt_crossfade': 'Crossfade between sample and wavetable using mod wheel',
  'sample_attack_wt_sustain': 'Sample plays during attack, crossfades to wavetable for sustain',
  'wt_attack_sample_sustain': 'Wavetable plays during attack, crossfades to sample for sustain',
  'sample_layer_wt_layer': 'Independent layers with separate controls',
  'velocity_split': 'Low velocity triggers sample, high velocity triggers wavetable',
  'key_split': 'Low keys play sample, high keys play wavetable',
  'release_sample': 'Wavetable for main sound, sample triggered on note release',
  'granular_wt': 'Granular processing of wavetable frames',
  'fm_sample': 'Wavetable modulates sample playback via FM',
  'additive_sample': 'Additive synthesis blended with sample layer',
};
