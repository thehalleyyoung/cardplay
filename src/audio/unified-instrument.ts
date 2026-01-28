/**
 * @fileoverview Unified Instrument Framework
 * 
 * Provides a common interface for Sampler and Wavetable instruments,
 * enabling layering, splitting, morphing, and unified control.
 * 
 * Features:
 * - Common Instrument interface
 * - Voice management API
 * - Modulation matrix interface
 * - Filter and effects chain API
 * - Instrument layering and splitting
 * - Crossfade and velocity switching
 * - CPU/memory management
 * - Undo/redo state management
 * 
 * @module @cardplay/core/audio/unified-instrument
 */

import { UnifiedPreset } from './unified-preset';

// ============================================================================
// CONSTANTS
// ============================================================================

export const MAX_LAYERS = 4;
export const MAX_SPLITS = 8;
export const MAX_VELOCITY_LAYERS = 8;
export const MAX_VOICES_PER_INSTRUMENT = 64;
export const MAX_INSTRUMENTS_IN_STACK = 4;
export const DEFAULT_CPU_BUDGET = 0.7; // 70% of available CPU
export const DEFAULT_MEMORY_BUDGET_MB = 512;

// ============================================================================
// INSTRUMENT TYPES
// ============================================================================

/** Instrument type enumeration */
export type InstrumentType = 
  | 'sampler' 
  | 'wavetable' 
  | 'hybrid' 
  | 'additive' 
  | 'fm' 
  | 'granular';

/** Instrument state */
export type InstrumentState = 
  | 'idle' 
  | 'loading' 
  | 'ready' 
  | 'playing' 
  | 'suspended' 
  | 'error';

/** Voice state */
export type VoiceState = 
  | 'idle' 
  | 'attack' 
  | 'sustain' 
  | 'release' 
  | 'stolen';

/** Voice stealing mode */
export type VoiceStealingMode = 
  | 'oldest' 
  | 'quietest' 
  | 'lowest' 
  | 'highest' 
  | 'none';

/** Split mode */
export type SplitMode = 
  | 'none' 
  | 'key' 
  | 'velocity' 
  | 'key_velocity' 
  | 'round_robin' 
  | 'random';

/** Layer mode */
export type LayerMode = 
  | 'parallel' 
  | 'serial' 
  | 'velocity_switch' 
  | 'key_switch' 
  | 'crossfade';

/** Crossfade curve */
export type CrossfadeCurve = 
  | 'linear' 
  | 'equal_power' 
  | 'logarithmic' 
  | 'exponential';

// ============================================================================
// VOICE INTERFACES
// ============================================================================

/** Voice parameters */
export interface VoiceParams {
  note: number;
  velocity: number;
  channel: number;
  timestamp: number;
  pan: number;
  expression: number;
  pitchBend: number;
  modWheel: number;
  aftertouch: number;
  // MPE
  pressure: number;
  slide: number;
  mpeNote: number;
}

/** Active voice info */
export interface ActiveVoice {
  id: number;
  state: VoiceState;
  params: VoiceParams;
  startTime: number;
  releaseTime: number | null;
  amplitude: number;
  frequency: number;
  instrumentIndex: number;
  layerIndex: number;
}

/** Voice event */
export interface VoiceEvent {
  type: 'note_on' | 'note_off' | 'steal' | 'release' | 'finished';
  voiceId: number;
  note: number;
  velocity: number;
  timestamp: number;
}

// ============================================================================
// MODULATION INTERFACES
// ============================================================================

/** Modulation source */
export type ModSource =
  | 'velocity'
  | 'keytrack'
  | 'aftertouch'
  | 'mod_wheel'
  | 'pitch_bend'
  | 'expression'
  | 'breath'
  | 'env_amp'
  | 'env_filter'
  | 'env_mod1'
  | 'env_mod2'
  | 'lfo_1'
  | 'lfo_2'
  | 'lfo_3'
  | 'lfo_4'
  | 'step_seq'
  | 'mseg'
  | 'random'
  | 'constant'
  | 'macro_1'
  | 'macro_2'
  | 'macro_3'
  | 'macro_4'
  | 'macro_5'
  | 'macro_6'
  | 'macro_7'
  | 'macro_8'
  | 'mpe_pressure'
  | 'mpe_slide'
  | 'mpe_note';

/** Modulation destination */
export type ModDestination =
  | 'osc1_pitch'
  | 'osc1_level'
  | 'osc1_pan'
  | 'osc1_wt_pos'
  | 'osc2_pitch'
  | 'osc2_level'
  | 'osc2_pan'
  | 'osc2_wt_pos'
  | 'osc3_pitch'
  | 'osc3_level'
  | 'osc3_pan'
  | 'osc3_wt_pos'
  | 'filter1_cutoff'
  | 'filter1_resonance'
  | 'filter1_drive'
  | 'filter2_cutoff'
  | 'filter2_resonance'
  | 'filter2_drive'
  | 'amp_level'
  | 'amp_pan'
  | 'lfo1_rate'
  | 'lfo1_depth'
  | 'lfo2_rate'
  | 'lfo2_depth'
  | 'fx_mix'
  | 'fx_param1'
  | 'fx_param2'
  | 'sample_start'
  | 'sample_loop_start'
  | 'sample_loop_end'
  | 'grain_position'
  | 'grain_size'
  | 'grain_density';

/** Modulation routing */
export interface ModulationRouting {
  id: string;
  source: ModSource;
  destination: ModDestination;
  amount: number;
  bipolar: boolean;
  enabled: boolean;
  curve: 'linear' | 'exponential' | 'logarithmic' | 's_curve';
  sourceMin: number;
  sourceMax: number;
}

/** Macro control */
export interface MacroControl {
  id: number;
  name: string;
  value: number;
  defaultValue: number;
  min: number;
  max: number;
  targets: Array<{
    destination: ModDestination;
    amount: number;
    bipolar: boolean;
  }>;
}

// ============================================================================
// SPLIT & LAYER INTERFACES
// ============================================================================

/** Key range for splits */
export interface KeyRange {
  low: number;
  high: number;
  rootNote: number;
  crossfadeWidth: number; // semitones
}

/** Velocity range for splits */
export interface VelocityRange {
  low: number;
  high: number;
  crossfadeWidth: number;
}

/** Instrument layer */
export interface InstrumentLayer {
  id: string;
  instrumentId: string;
  enabled: boolean;
  volume: number;
  pan: number;
  transpose: number;
  detune: number; // cents
  keyRange: KeyRange;
  velocityRange: VelocityRange;
  layerMode: LayerMode;
  crossfadeCurve: CrossfadeCurve;
  // Triggering
  triggerOnNoteOn: boolean;
  triggerOnNoteOff: boolean;
  releaseTriggerDecay: number;
}

/** Instrument split */
export interface InstrumentSplit {
  id: string;
  name: string;
  splits: Array<{
    instrumentId: string;
    keyRange: KeyRange;
    velocityRange: VelocityRange;
  }>;
  crossfadeEnabled: boolean;
  crossfadeCurve: CrossfadeCurve;
}

// ============================================================================
// FILTER INTERFACES
// ============================================================================

/** Common filter types */
export type CommonFilterType =
  | 'lp6'
  | 'lp12'
  | 'lp18'
  | 'lp24'
  | 'hp6'
  | 'hp12'
  | 'hp18'
  | 'hp24'
  | 'bp6'
  | 'bp12'
  | 'notch'
  | 'peak'
  | 'allpass'
  | 'comb_pos'
  | 'comb_neg'
  | 'formant';

/** Filter configuration */
export interface FilterConfig {
  enabled: boolean;
  type: CommonFilterType;
  cutoff: number;
  resonance: number;
  drive: number;
  keytrack: number;
  envAmount: number;
  envVelocity: number;
  mix: number;
}

/** Dual filter configuration */
export interface DualFilterConfig {
  filter1: FilterConfig;
  filter2: FilterConfig;
  routing: 'serial' | 'parallel' | 'split';
  morphAmount: number; // blend between filter 1 and 2
}

// ============================================================================
// EFFECTS INTERFACES
// ============================================================================

/** Effect type */
export type EffectType =
  | 'eq'
  | 'compressor'
  | 'distortion'
  | 'chorus'
  | 'flanger'
  | 'phaser'
  | 'delay'
  | 'reverb'
  | 'filter'
  | 'bitcrusher'
  | 'waveshaper'
  | 'limiter'
  | 'stereo_widener';

/** Effect slot */
export interface EffectSlot {
  id: string;
  type: EffectType;
  enabled: boolean;
  mix: number;
  params: Record<string, number>;
}

/** Effects chain configuration */
export interface EffectsChainConfig {
  slots: EffectSlot[];
  masterVolume: number;
  masterPan: number;
  masterLimiter: boolean;
}

// ============================================================================
// INSTRUMENT INTERFACE
// ============================================================================

/** Instrument metrics */
export interface InstrumentMetrics {
  activeVoices: number;
  maxVoices: number;
  cpuUsage: number;
  memoryUsageMB: number;
  sampleRate: number;
  latencyMs: number;
  voicesStolen: number;
  lastUpdateTime: number;
}

/** Instrument snapshot for undo */
export interface InstrumentSnapshot {
  id: string;
  timestamp: number;
  preset: UnifiedPreset;
  voiceStates: Map<number, VoiceState>;
  modulations: ModulationRouting[];
  macros: MacroControl[];
  filterConfig: DualFilterConfig;
  effectsConfig: EffectsChainConfig;
  layers: InstrumentLayer[];
}

/** Instrument event listener */
export type InstrumentEventType = 
  | 'voice_start' 
  | 'voice_end' 
  | 'preset_change' 
  | 'state_change' 
  | 'parameter_change'
  | 'modulation_change'
  | 'cpu_overload'
  | 'memory_warning';

export interface InstrumentEvent {
  type: InstrumentEventType;
  instrumentId: string;
  timestamp: number;
  data: unknown;
}

export type InstrumentEventListener = (event: InstrumentEvent) => void;

/**
 * Base Instrument Interface
 * 
 * All instrument types (Sampler, Wavetable, Hybrid) implement this interface.
 */
export interface Instrument {
  // Identity
  readonly id: string;
  readonly type: InstrumentType;
  readonly name: string;
  
  // State
  getState(): InstrumentState;
  getMetrics(): InstrumentMetrics;
  
  // Lifecycle
  initialize(): Promise<void>;
  dispose(): void;
  suspend(): void;
  resume(): void;
  
  // Preset
  loadPreset(preset: UnifiedPreset): Promise<void>;
  savePreset(): UnifiedPreset;
  getPreset(): UnifiedPreset | null;
  
  // Voice management
  noteOn(note: number, velocity: number, channel?: number): number; // returns voiceId
  noteOff(note: number, channel?: number): void;
  allNotesOff(): void;
  allSoundsOff(): void;
  getActiveVoices(): ActiveVoice[];
  setMaxVoices(max: number): void;
  setVoiceStealingMode(mode: VoiceStealingMode): void;
  
  // Parameters
  setParameter(name: string, value: number): void;
  getParameter(name: string): number;
  getParameterInfo(name: string): { min: number; max: number; default: number; name: string } | null;
  getParameterList(): string[];
  
  // Modulation
  setModulation(routing: ModulationRouting): void;
  removeModulation(id: string): void;
  getModulations(): ModulationRouting[];
  setMacro(index: number, value: number): void;
  getMacro(index: number): number;
  getMacroConfig(index: number): MacroControl | null;
  
  // Filter
  setFilterConfig(config: DualFilterConfig): void;
  getFilterConfig(): DualFilterConfig;
  
  // Effects
  setEffectsConfig(config: EffectsChainConfig): void;
  getEffectsConfig(): EffectsChainConfig;
  
  // Audio processing
  process(outputL: Float32Array, outputR: Float32Array): void;
  processBlock(outputL: Float32Array, outputR: Float32Array, offset: number, length: number): void;
  
  // MIDI
  processMIDI(data: Uint8Array, timestamp: number): void;
  setPitchBendRange(semitones: number): void;
  
  // MPE
  setMPEEnabled(enabled: boolean): void;
  isMPEEnabled(): boolean;
  
  // Events
  addEventListener(type: InstrumentEventType, listener: InstrumentEventListener): void;
  removeEventListener(type: InstrumentEventType, listener: InstrumentEventListener): void;
  
  // Undo/Redo
  saveSnapshot(): InstrumentSnapshot;
  restoreSnapshot(snapshot: InstrumentSnapshot): void;
  
  // Freeze/Bounce
  freeze(durationSeconds: number): Promise<Float32Array>;
  bounceToSample(note: number, velocity: number, durationSeconds: number): Promise<Float32Array>;
  
  // Clone
  clone(): Promise<Instrument>;
}

// ============================================================================
// LAYERED INSTRUMENT
// ============================================================================

/**
 * Configuration for layered/split instrument
 */
export interface LayeredInstrumentConfig {
  id: string;
  name: string;
  layers: InstrumentLayer[];
  splitMode: SplitMode;
  layerMode: LayerMode;
  crossfadeCurve: CrossfadeCurve;
  maxVoices: number;
  cpuBudget: number;
  memoryBudgetMB: number;
}

/** Default layered config */
export const DEFAULT_LAYERED_CONFIG: LayeredInstrumentConfig = {
  id: '',
  name: 'Layered Instrument',
  layers: [],
  splitMode: 'none',
  layerMode: 'parallel',
  crossfadeCurve: 'equal_power',
  maxVoices: 64,
  cpuBudget: DEFAULT_CPU_BUDGET,
  memoryBudgetMB: DEFAULT_MEMORY_BUDGET_MB,
};

/**
 * Layered Instrument - combines multiple instruments
 */
export class LayeredInstrument implements Instrument {
  readonly id: string;
  readonly type: InstrumentType = 'hybrid';
  readonly name: string;
  
  private instruments: Map<string, Instrument> = new Map();
  private layers: InstrumentLayer[] = [];
  private config: LayeredInstrumentConfig;
  private state: InstrumentState = 'idle';
  private sampleRate: number;
  private currentPreset: UnifiedPreset | null = null;
  
  // Voice tracking
  private activeVoices: Map<number, ActiveVoice> = new Map();
  private voiceIdCounter = 0;
  private maxVoices: number;
  private voiceStealingMode: VoiceStealingMode = 'oldest';
  
  // Modulation
  private modulations: ModulationRouting[] = [];
  private macros: MacroControl[] = [];
  
  // Filter & Effects
  private filterConfig: DualFilterConfig;
  private effectsConfig: EffectsChainConfig;
  
  // Events
  private eventListeners: Map<InstrumentEventType, Set<InstrumentEventListener>> = new Map();
  
  // Undo
  private undoStack: InstrumentSnapshot[] = [];
  private redoStack: InstrumentSnapshot[] = [];
  private maxUndoLevels = 50;
  
  // Temp buffers
  private tempL: Float32Array;
  private tempR: Float32Array;
  
  constructor(config: Partial<LayeredInstrumentConfig>, sampleRate = 44100) {
    this.config = { ...DEFAULT_LAYERED_CONFIG, ...config };
    this.id = this.config.id || `layered_${Date.now()}`;
    this.name = this.config.name;
    this.sampleRate = sampleRate;
    this.maxVoices = this.config.maxVoices;
    
    // Initialize filter config
    this.filterConfig = {
      filter1: {
        enabled: true,
        type: 'lp12',
        cutoff: 20000,
        resonance: 0,
        drive: 0,
        keytrack: 0,
        envAmount: 0,
        envVelocity: 0,
        mix: 1,
      },
      filter2: {
        enabled: false,
        type: 'hp12',
        cutoff: 20,
        resonance: 0,
        drive: 0,
        keytrack: 0,
        envAmount: 0,
        envVelocity: 0,
        mix: 1,
      },
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
    
    // Allocate temp buffers
    this.tempL = new Float32Array(512);
    this.tempR = new Float32Array(512);
  }
  
  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================
  
  async initialize(): Promise<void> {
    this.state = 'loading';
    
    // Initialize all child instruments
    for (const instrument of this.instruments.values()) {
      await instrument.initialize();
    }
    
    this.state = 'ready';
    this.emitEvent('state_change', { state: this.state });
  }
  
  dispose(): void {
    this.allSoundsOff();
    
    for (const instrument of this.instruments.values()) {
      instrument.dispose();
    }
    
    this.instruments.clear();
    this.activeVoices.clear();
    this.eventListeners.clear();
    this.state = 'idle';
  }
  
  suspend(): void {
    this.state = 'suspended';
    for (const instrument of this.instruments.values()) {
      instrument.suspend();
    }
    this.emitEvent('state_change', { state: this.state });
  }
  
  resume(): void {
    this.state = 'ready';
    for (const instrument of this.instruments.values()) {
      instrument.resume();
    }
    this.emitEvent('state_change', { state: this.state });
  }
  
  getState(): InstrumentState {
    return this.state;
  }
  
  getMetrics(): InstrumentMetrics {
    let totalCpu = 0;
    let totalMemory = 0;
    
    for (const instrument of this.instruments.values()) {
      const metrics = instrument.getMetrics();
      totalCpu += metrics.cpuUsage;
      totalMemory += metrics.memoryUsageMB;
    }
    
    return {
      activeVoices: this.activeVoices.size,
      maxVoices: this.maxVoices,
      cpuUsage: totalCpu,
      memoryUsageMB: totalMemory,
      sampleRate: this.sampleRate,
      latencyMs: 512 / this.sampleRate * 1000,
      voicesStolen: 0,
      lastUpdateTime: Date.now(),
    };
  }
  
  // ===========================================================================
  // INSTRUMENT MANAGEMENT
  // ===========================================================================
  
  /**
   * Add an instrument to the layered instrument
   */
  addInstrument(instrument: Instrument, layer?: Partial<InstrumentLayer>): void {
    this.instruments.set(instrument.id, instrument);
    
    const layerConfig: InstrumentLayer = {
      id: `layer_${Date.now()}`,
      instrumentId: instrument.id,
      enabled: true,
      volume: 1,
      pan: 0,
      transpose: 0,
      detune: 0,
      keyRange: { low: 0, high: 127, rootNote: 60, crossfadeWidth: 0 },
      velocityRange: { low: 0, high: 127, crossfadeWidth: 0 },
      layerMode: 'parallel',
      crossfadeCurve: 'equal_power',
      triggerOnNoteOn: true,
      triggerOnNoteOff: false,
      releaseTriggerDecay: 0.3,
      ...layer,
    };
    
    this.layers.push(layerConfig);
  }
  
  /**
   * Remove an instrument
   */
  removeInstrument(instrumentId: string): void {
    const instrument = this.instruments.get(instrumentId);
    if (instrument) {
      instrument.dispose();
      this.instruments.delete(instrumentId);
      this.layers = this.layers.filter(l => l.instrumentId !== instrumentId);
    }
  }
  
  /**
   * Get layer configuration
   */
  getLayer(layerId: string): InstrumentLayer | undefined {
    return this.layers.find(l => l.id === layerId);
  }
  
  /**
   * Update layer configuration
   */
  updateLayer(layerId: string, updates: Partial<InstrumentLayer>): void {
    const layer = this.layers.find(l => l.id === layerId);
    if (layer) {
      Object.assign(layer, updates);
    }
  }
  
  /**
   * Get all layers
   */
  getLayers(): InstrumentLayer[] {
    return [...this.layers];
  }
  
  // ===========================================================================
  // PRESET
  // ===========================================================================
  
  async loadPreset(preset: UnifiedPreset): Promise<void> {
    this.currentPreset = preset;
    
    // Distribute preset to layers based on oscillator configuration
    // This is a simplified distribution - in practice would be more sophisticated
    for (const [_index, instrument] of [...this.instruments.values()].entries()) {
      await instrument.loadPreset(preset);
    }
    
    this.emitEvent('preset_change', { preset });
  }
  
  savePreset(): UnifiedPreset {
    if (this.currentPreset) {
      return { ...this.currentPreset };
    }
    
    // Create a new preset from current state
    return {
      id: `preset_${Date.now()}`,
      name: this.name,
      source: 'custom',
      originalPath: '',
      category: 'other',
      subCategory: 'generic',
      characters: [],
      tags: [],
      author: 'User',
      description: null,
      oscillators: [],
      filters: [],
      envelopes: [],
      lfos: [],
      modulations: [],
      effects: [],
      macros: [],
      masterVolume: this.effectsConfig.masterVolume,
      masterPan: 0,
      masterPitch: 0,
      polyphony: this.maxVoices,
      portamento: 0,
      portamentoMode: 'off',
      voiceMode: 'poly',
      pitchBendRange: 2,
      cpuEstimate: 1,
      needsHQInterpolation: false,
    };
  }
  
  getPreset(): UnifiedPreset | null {
    return this.currentPreset;
  }
  
  // ===========================================================================
  // VOICE MANAGEMENT
  // ===========================================================================
  
  noteOn(note: number, velocity: number, channel = 0): number {
    const voiceId = this.voiceIdCounter++;
    const timestamp = Date.now();
    
    // Check voice limit
    if (this.activeVoices.size >= this.maxVoices) {
      this.stealVoice();
    }
    
    // Determine which layers should trigger
    const triggeredLayers = this.getTriggeredLayers(note, velocity, true);
    
    // Create voice record
    const voice: ActiveVoice = {
      id: voiceId,
      state: 'attack',
      params: {
        note,
        velocity,
        channel,
        timestamp,
        pan: 0,
        expression: 1,
        pitchBend: 0,
        modWheel: 0,
        aftertouch: 0,
        pressure: 0,
        slide: 0,
        mpeNote: note,
      },
      startTime: timestamp,
      releaseTime: null,
      amplitude: velocity / 127,
      frequency: 440 * Math.pow(2, (note - 69) / 12),
      instrumentIndex: 0,
      layerIndex: 0,
    };
    
    this.activeVoices.set(voiceId, voice);
    
    // Trigger note on each relevant layer
    for (const layer of triggeredLayers) {
      const instrument = this.instruments.get(layer.instrumentId);
      if (instrument && layer.enabled && layer.triggerOnNoteOn) {
        const layerVelocity = this.calculateLayerVelocity(velocity, layer);
        const layerNote = note + layer.transpose;
        instrument.noteOn(layerNote, layerVelocity, channel);
      }
    }
    
    this.state = 'playing';
    this.emitEvent('voice_start', { voiceId, note, velocity });
    
    return voiceId;
  }
  
  noteOff(note: number, channel = 0): void {
    // Find voices for this note
    for (const [voiceId, voice] of this.activeVoices) {
      if (voice.params.note === note && voice.params.channel === channel) {
        voice.state = 'release';
        voice.releaseTime = Date.now();
        
        // Note off to all layers
        for (const layer of this.layers) {
          const instrument = this.instruments.get(layer.instrumentId);
          if (instrument && layer.enabled) {
            const layerNote = note + layer.transpose;
            instrument.noteOff(layerNote, channel);
            
            // Handle release trigger
            if (layer.triggerOnNoteOff) {
              const velocity = Math.floor(voice.params.velocity * layer.releaseTriggerDecay);
              instrument.noteOn(layerNote, velocity, channel);
            }
          }
        }
        
        this.emitEvent('voice_end', { voiceId, note });
      }
    }
    
    // Clean up finished voices
    this.cleanupFinishedVoices();
  }
  
  allNotesOff(): void {
    for (const [, voice] of this.activeVoices) {
      voice.state = 'release';
      voice.releaseTime = Date.now();
    }
    
    for (const instrument of this.instruments.values()) {
      instrument.allNotesOff();
    }
    
    this.cleanupFinishedVoices();
  }
  
  allSoundsOff(): void {
    this.activeVoices.clear();
    
    for (const instrument of this.instruments.values()) {
      instrument.allSoundsOff();
    }
    
    this.state = 'ready';
  }
  
  getActiveVoices(): ActiveVoice[] {
    return Array.from(this.activeVoices.values());
  }
  
  setMaxVoices(max: number): void {
    this.maxVoices = Math.max(1, Math.min(MAX_VOICES_PER_INSTRUMENT, max));
  }
  
  setVoiceStealingMode(mode: VoiceStealingMode): void {
    this.voiceStealingMode = mode;
  }
  
  private stealVoice(): void {
    if (this.activeVoices.size === 0) return;
    
    let victimId: number | null = null;
    let victimVoice: ActiveVoice | null = null;
    
    switch (this.voiceStealingMode) {
      case 'oldest':
        for (const [id, voice] of this.activeVoices) {
          if (!victimVoice || voice.startTime < victimVoice.startTime) {
            victimId = id;
            victimVoice = voice;
          }
        }
        break;
        
      case 'quietest':
        for (const [id, voice] of this.activeVoices) {
          if (!victimVoice || voice.amplitude < victimVoice.amplitude) {
            victimId = id;
            victimVoice = voice;
          }
        }
        break;
        
      case 'lowest':
        for (const [id, voice] of this.activeVoices) {
          if (!victimVoice || voice.params.note < victimVoice.params.note) {
            victimId = id;
            victimVoice = voice;
          }
        }
        break;
        
      case 'highest':
        for (const [id, voice] of this.activeVoices) {
          if (!victimVoice || voice.params.note > victimVoice.params.note) {
            victimId = id;
            victimVoice = voice;
          }
        }
        break;
        
      case 'none':
        return;
    }
    
    if (victimId !== null) {
      this.activeVoices.delete(victimId);
    }
  }
  
  private getTriggeredLayers(note: number, velocity: number, isNoteOn: boolean): InstrumentLayer[] {
    return this.layers.filter(layer => {
      if (!layer.enabled) return false;
      if (isNoteOn && !layer.triggerOnNoteOn) return false;
      if (!isNoteOn && !layer.triggerOnNoteOff) return false;
      
      // Check key range
      if (note < layer.keyRange.low || note > layer.keyRange.high) return false;
      
      // Check velocity range
      if (velocity < layer.velocityRange.low || velocity > layer.velocityRange.high) return false;
      
      return true;
    });
  }
  
  private calculateLayerVelocity(velocity: number, layer: InstrumentLayer): number {
    let layerVelocity = velocity;
    
    // Apply velocity crossfade
    const velRange = layer.velocityRange;
    if (velRange.crossfadeWidth > 0) {
      if (velocity < velRange.low + velRange.crossfadeWidth) {
        const fade = (velocity - velRange.low) / velRange.crossfadeWidth;
        layerVelocity = Math.floor(velocity * this.applyCrossfade(fade, layer.crossfadeCurve));
      } else if (velocity > velRange.high - velRange.crossfadeWidth) {
        const fade = (velRange.high - velocity) / velRange.crossfadeWidth;
        layerVelocity = Math.floor(velocity * this.applyCrossfade(fade, layer.crossfadeCurve));
      }
    }
    
    return Math.max(1, Math.min(127, Math.floor(layerVelocity * layer.volume)));
  }
  
  private applyCrossfade(t: number, curve: CrossfadeCurve): number {
    t = Math.max(0, Math.min(1, t));
    
    switch (curve) {
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
  
  private cleanupFinishedVoices(): void {
    const now = Date.now();
    const maxReleaseTime = 5000; // 5 seconds max release
    
    for (const [voiceId, voice] of this.activeVoices) {
      if (voice.state === 'release' && voice.releaseTime) {
        if (now - voice.releaseTime > maxReleaseTime) {
          this.activeVoices.delete(voiceId);
        }
      }
    }
    
    if (this.activeVoices.size === 0) {
      this.state = 'ready';
    }
  }
  
  // ===========================================================================
  // PARAMETERS
  // ===========================================================================
  
  setParameter(name: string, value: number): void {
    // Distribute to all instruments
    for (const instrument of this.instruments.values()) {
      instrument.setParameter(name, value);
    }
    
    this.emitEvent('parameter_change', { name, value });
  }
  
  getParameter(name: string): number {
    // Return from first instrument
    const first = this.instruments.values().next().value;
    return first?.getParameter(name) ?? 0;
  }
  
  getParameterInfo(name: string): { min: number; max: number; default: number; name: string } | null {
    const first = this.instruments.values().next().value;
    return first?.getParameterInfo(name) ?? null;
  }
  
  getParameterList(): string[] {
    const first = this.instruments.values().next().value;
    return first?.getParameterList() ?? [];
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
    
    // Apply to all instruments
    for (const instrument of this.instruments.values()) {
      instrument.setModulation(routing);
    }
    
    this.emitEvent('modulation_change', { routing });
  }
  
  removeModulation(id: string): void {
    this.modulations = this.modulations.filter(m => m.id !== id);
    
    for (const instrument of this.instruments.values()) {
      instrument.removeModulation(id);
    }
  }
  
  getModulations(): ModulationRouting[] {
    return [...this.modulations];
  }
  
  setMacro(index: number, value: number): void {
    const macro = this.macros[index];
    if (index >= 0 && index < this.macros.length && macro) {
      macro.value = Math.max(0, Math.min(1, value));
      
      // Apply macro targets
      for (const target of macro.targets) {
        const modValue = target.bipolar 
          ? (value - 0.5) * 2 * target.amount
          : value * target.amount;
        this.setParameter(target.destination, modValue);
      }
    }
  }
  
  getMacro(index: number): number {
    return this.macros[index]?.value ?? 0;
  }
  
  getMacroConfig(index: number): MacroControl | null {
    return this.macros[index] ?? null;
  }
  
  // ===========================================================================
  // FILTER
  // ===========================================================================
  
  setFilterConfig(config: DualFilterConfig): void {
    this.filterConfig = config;
  }
  
  getFilterConfig(): DualFilterConfig {
    return { ...this.filterConfig };
  }
  
  // ===========================================================================
  // EFFECTS
  // ===========================================================================
  
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
    // Clear output
    for (let i = offset; i < offset + length; i++) {
      outputL[i] = 0;
      outputR[i] = 0;
    }
    
    // Ensure temp buffers are large enough
    if (this.tempL.length < length) {
      this.tempL = new Float32Array(length);
      this.tempR = new Float32Array(length);
    }
    
    // Process each layer
    for (const layer of this.layers) {
      if (!layer.enabled) continue;
      
      const instrument = this.instruments.get(layer.instrumentId);
      if (!instrument) continue;
      
      // Clear temp buffers
      this.tempL.fill(0);
      this.tempR.fill(0);
      
      // Process instrument
      instrument.processBlock(this.tempL, this.tempR, 0, length);
      
      // Apply layer volume and pan, mix to output
      const volume = layer.volume;
      const panL = Math.cos((layer.pan + 1) * Math.PI / 4);
      const panR = Math.sin((layer.pan + 1) * Math.PI / 4);
      
      for (let i = 0; i < length; i++) {
        const outIdxL = offset + i;
        const outIdxR = offset + i;
        const currL = outputL[outIdxL];
        const currR = outputR[outIdxR];
        if (currL !== undefined) outputL[outIdxL] = currL + (this.tempL[i] ?? 0) * volume * panL;
        if (currR !== undefined) outputR[outIdxR] = currR + (this.tempR[i] ?? 0) * volume * panR;
      }
    }
    
    // Apply master volume
    const masterVol = this.effectsConfig.masterVolume;
    for (let i = offset; i < offset + length; i++) {
      const valL = outputL[i];
      const valR = outputR[i];
      if (valL !== undefined) outputL[i] = valL * masterVol;
      if (valR !== undefined) outputR[i] = valR * masterVol;
    }
    
    // Apply master limiter (simple soft clipper)
    if (this.effectsConfig.masterLimiter) {
      for (let i = offset; i < offset + length; i++) {
        outputL[i] = Math.tanh(outputL[i] ?? 0);
        outputR[i] = Math.tanh(outputR[i] ?? 0);
      }
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
        if (data.length >= 3) {
          const note = data[1] ?? 0;
          const velocity = data[2] ?? 0;
          if (velocity > 0) {
            this.noteOn(note, velocity, channel);
          } else {
            this.noteOff(note, channel);
          }
        }
        break;
        
      case 0x80: // Note Off
        if (data.length >= 3) {
          const note = data[1] ?? 0;
          this.noteOff(note, channel);
        }
        break;
        
      case 0xb0: // Control Change
        if (data.length >= 3) {
          const cc = data[1] ?? 0;
          const value = data[2] ?? 0;
          this.handleControlChange(cc, value, channel);
        }
        break;
        
      case 0xe0: // Pitch Bend
        if (data.length >= 3) {
          const bend = (((data[2] ?? 0) << 7) | (data[1] ?? 0)) - 8192;
          this.handlePitchBend(bend / 8192, channel);
        }
        break;
        
      case 0xd0: // Channel Aftertouch
        if (data.length >= 2) {
          this.handleAftertouch((data[1] ?? 0) / 127, channel);
        }
        break;
    }
  }
  
  private handleControlChange(cc: number, value: number, channel: number): void {
    const normalized = value / 127;
    
    switch (cc) {
      case 1: // Mod wheel
        for (const voice of this.activeVoices.values()) {
          if (voice.params.channel === channel) {
            voice.params.modWheel = normalized;
          }
        }
        break;
        
      case 7: // Volume
        this.effectsConfig.masterVolume = normalized;
        break;
        
      case 10: // Pan
        this.effectsConfig.masterPan = normalized * 2 - 1;
        break;
        
      case 11: // Expression
        for (const voice of this.activeVoices.values()) {
          if (voice.params.channel === channel) {
            voice.params.expression = normalized;
          }
        }
        break;
        
      case 64: // Sustain pedal
        if (value < 64) {
          // Pedal up - release sustained notes
          for (const [, voice] of this.activeVoices) {
            if (voice.state === 'sustain' && voice.params.channel === channel) {
              this.noteOff(voice.params.note, channel);
            }
          }
        }
        break;
        
      case 74: // MPE Slide
        for (const voice of this.activeVoices.values()) {
          if (voice.params.channel === channel) {
            voice.params.slide = normalized;
          }
        }
        break;
        
      case 120: // All Sound Off
        this.allSoundsOff();
        break;
        
      case 123: // All Notes Off
        this.allNotesOff();
        break;
    }
  }
  
  private handlePitchBend(bend: number, channel: number): void {
    for (const voice of this.activeVoices.values()) {
      if (voice.params.channel === channel) {
        voice.params.pitchBend = bend;
      }
    }
  }
  
  private handleAftertouch(pressure: number, channel: number): void {
    for (const voice of this.activeVoices.values()) {
      if (voice.params.channel === channel) {
        voice.params.aftertouch = pressure;
        voice.params.pressure = pressure;
      }
    }
  }
  
  setPitchBendRange(semitones: number): void {
    for (const instrument of this.instruments.values()) {
      instrument.setPitchBendRange(semitones);
    }
  }
  
  // ===========================================================================
  // MPE
  // ===========================================================================
  
  private mpeEnabled = false;
  
  setMPEEnabled(enabled: boolean): void {
    this.mpeEnabled = enabled;
    for (const instrument of this.instruments.values()) {
      instrument.setMPEEnabled(enabled);
    }
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
  
  private emitEvent(type: InstrumentEventType, data: unknown): void {
    const event: InstrumentEvent = {
      type,
      instrumentId: this.id,
      timestamp: Date.now(),
      data,
    };
    
    this.eventListeners.get(type)?.forEach(listener => {
      try {
        listener(event);
      } catch (e) {
        console.error('Instrument event listener error:', e);
      }
    });
  }
  
  // ===========================================================================
  // UNDO/REDO
  // ===========================================================================
  
  saveSnapshot(): InstrumentSnapshot {
    const voiceStateMap = new Map<number, VoiceState>();
    for (const [id, voice] of this.activeVoices) {
      voiceStateMap.set(id, voice.state);
    }
    const snapshot: InstrumentSnapshot = {
      id: `snapshot_${Date.now()}`,
      timestamp: Date.now(),
      preset: this.savePreset(),
      voiceStates: voiceStateMap,
      modulations: [...this.modulations],
      macros: this.macros.map(m => ({ ...m, targets: [...m.targets] })),
      filterConfig: { ...this.filterConfig },
      effectsConfig: { 
        ...this.effectsConfig, 
        slots: this.effectsConfig.slots.map(s => ({ ...s })) 
      },
      layers: this.layers.map(l => ({ ...l })),
    };
    
    // Add to undo stack
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxUndoLevels) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    
    return snapshot;
  }
  
  restoreSnapshot(snapshot: InstrumentSnapshot): void {
    // Save current state for redo
    const currentSnapshot = this.saveSnapshot();
    this.undoStack.pop(); // Remove the one we just added
    this.redoStack.push(currentSnapshot);
    
    // Restore state
    this.currentPreset = snapshot.preset;
    this.modulations = [...snapshot.modulations];
    this.macros = snapshot.macros.map(m => ({ ...m, targets: [...m.targets] }));
    this.filterConfig = { ...snapshot.filterConfig };
    this.effectsConfig = { 
      ...snapshot.effectsConfig,
      slots: snapshot.effectsConfig.slots.map(s => ({ ...s }))
    };
    this.layers = snapshot.layers.map(l => ({ ...l }));
  }
  
  // ===========================================================================
  // FREEZE/BOUNCE
  // ===========================================================================
  
  async freeze(durationSeconds: number): Promise<Float32Array> {
    const numSamples = Math.ceil(durationSeconds * this.sampleRate);
    const left = new Float32Array(numSamples);
    const right = new Float32Array(numSamples);
    
    // Render audio
    this.processBlock(left, right, 0, numSamples);
    
    // Interleave to stereo
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
    
    // Trigger note
    this.noteOn(note, velocity);
    
    // Calculate note-off time (80% of duration for release tail)
    const noteOffSample = Math.floor(numSamples * 0.8);
    
    // Process in blocks
    const blockSize = 512;
    for (let i = 0; i < numSamples; i += blockSize) {
      const len = Math.min(blockSize, numSamples - i);
      
      // Note off at appropriate time
      if (i >= noteOffSample && i < noteOffSample + blockSize) {
        this.noteOff(note);
      }
      
      this.processBlock(left, right, i, len);
    }
    
    // Interleave to stereo
    const stereo = new Float32Array(numSamples * 2);
    for (let i = 0; i < numSamples; i++) {
      stereo[i * 2] = left[i] ?? 0;
      stereo[i * 2 + 1] = right[i] ?? 0;
    }
    
    return stereo;
  }
  
  // ===========================================================================
  // CLONE
  // ===========================================================================
  
  async clone(): Promise<Instrument> {
    const cloned = new LayeredInstrument({
      ...this.config,
      id: `${this.id}_clone_${Date.now()}`,
      name: `${this.name} (Copy)`,
    }, this.sampleRate);
    
    // Clone each instrument
    for (const [id, instrument] of this.instruments) {
      const clonedInstrument = await instrument.clone();
      const layer = this.layers.find(l => l.instrumentId === id);
      cloned.addInstrument(clonedInstrument, layer);
    }
    
    // Copy state
    cloned.modulations = [...this.modulations];
    cloned.macros = this.macros.map(m => ({ ...m, targets: [...m.targets] }));
    cloned.filterConfig = { ...this.filterConfig };
    cloned.effectsConfig = { 
      ...this.effectsConfig,
      slots: this.effectsConfig.slots.map(s => ({ ...s }))
    };
    
    return cloned;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createLayeredInstrument(
  config: Partial<LayeredInstrumentConfig>,
  sampleRate = 44100
): LayeredInstrument {
  return new LayeredInstrument(config, sampleRate);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a key split configuration
 */
export function createKeySplit(
  splitPoint: number,
  lowInstrumentId: string,
  highInstrumentId: string,
  crossfadeWidth = 0
): InstrumentSplit {
  return {
    id: `split_${Date.now()}`,
    name: `Key Split at ${splitPoint}`,
    splits: [
      {
        instrumentId: lowInstrumentId,
        keyRange: { 
          low: 0, 
          high: splitPoint + crossfadeWidth, 
          rootNote: 60, 
          crossfadeWidth 
        },
        velocityRange: { low: 0, high: 127, crossfadeWidth: 0 },
      },
      {
        instrumentId: highInstrumentId,
        keyRange: { 
          low: splitPoint - crossfadeWidth, 
          high: 127, 
          rootNote: 60, 
          crossfadeWidth 
        },
        velocityRange: { low: 0, high: 127, crossfadeWidth: 0 },
      },
    ],
    crossfadeEnabled: crossfadeWidth > 0,
    crossfadeCurve: 'equal_power',
  };
}

/**
 * Create a velocity split configuration
 */
export function createVelocitySplit(
  splitPoint: number,
  lowInstrumentId: string,
  highInstrumentId: string,
  crossfadeWidth = 0
): InstrumentSplit {
  return {
    id: `split_${Date.now()}`,
    name: `Velocity Split at ${splitPoint}`,
    splits: [
      {
        instrumentId: lowInstrumentId,
        keyRange: { low: 0, high: 127, rootNote: 60, crossfadeWidth: 0 },
        velocityRange: { 
          low: 0, 
          high: splitPoint + crossfadeWidth, 
          crossfadeWidth 
        },
      },
      {
        instrumentId: highInstrumentId,
        keyRange: { low: 0, high: 127, rootNote: 60, crossfadeWidth: 0 },
        velocityRange: { 
          low: splitPoint - crossfadeWidth, 
          high: 127, 
          crossfadeWidth 
        },
      },
    ],
    crossfadeEnabled: crossfadeWidth > 0,
    crossfadeCurve: 'equal_power',
  };
}

/**
 * Calculate equal power crossfade gains
 */
export function calculateEqualPowerCrossfade(position: number): { gainA: number; gainB: number } {
  const angle = position * Math.PI / 2;
  return {
    gainA: Math.cos(angle),
    gainB: Math.sin(angle),
  };
}
