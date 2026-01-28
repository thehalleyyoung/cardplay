/**
 * @fileoverview Wavetable Instrument Adapter - Implements InstrumentCard interface for Wavetable.
 * 
 * Adapts the existing Wavetable synthesizer to the standardized InstrumentCard interface
 * for uniform handling in the integration layer.
 * 
 * @module @cardplay/audio/wavetable-instrument-adapter
 * @see INTEGRATION_FIXES_CHECKLIST.md Phase F.3
 */

import type {
  InstrumentCard,
  InstrumentParameter,
  InstrumentPreset,
  InstrumentOutputConfig,
  NoteEvent,
  VoiceInfo,
  VoiceAllocationMode,
  VoiceState,
} from './instrument-interface';
import type { Event } from '../types/event';
import type { Tick } from '../types/primitives';
import { addTicks } from '../types/primitives';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Wavetable oscillator shape types.
 */
export type WavetableShape = 
  | 'sine'
  | 'triangle'
  | 'saw'
  | 'square'
  | 'pulse'
  | 'noise'
  | 'custom';

/**
 * Filter types for wavetable synth.
 */
export type WavetableFilterType = 
  | 'lowpass'
  | 'highpass'
  | 'bandpass'
  | 'notch'
  | 'lowshelf'
  | 'highshelf'
  | 'peaking';

/**
 * LFO destination targets.
 */
export type LFOTarget = 
  | 'pitch'
  | 'filter'
  | 'amplitude'
  | 'wavetablePosition'
  | 'pan';

/**
 * Wavetable frame data.
 */
export interface WavetableFrame {
  readonly index: number;
  readonly samples: Float32Array;
  readonly name?: string;
}

/**
 * Wavetable data containing multiple frames.
 */
export interface WavetableData {
  readonly id: string;
  readonly name: string;
  readonly frameSize: number;
  readonly frames: readonly WavetableFrame[];
}

/**
 * Internal voice state for wavetable synth.
 */
interface WavetableVoice {
  id: number;
  state: VoiceState;
  pitch: number;
  velocity: number;
  startTime: number;
  releaseTime?: number;
  oscillator: OscillatorNode | null;
  filter: BiquadFilterNode | null;
  gainNode: GainNode | null;
  pannerNode: StereoPannerNode | null;
  phase: number;
  wavetablePosition: number;
}

// ============================================================================
// WAVETABLE GENERATION
// ============================================================================

/**
 * Generate basic wavetable data for common shapes.
 */
function generateBasicWavetable(shape: WavetableShape, frameSize: number = 2048): Float32Array {
  const samples = new Float32Array(frameSize);
  
  switch (shape) {
    case 'sine':
      for (let i = 0; i < frameSize; i++) {
        samples[i] = Math.sin((2 * Math.PI * i) / frameSize);
      }
      break;
      
    case 'triangle':
      for (let i = 0; i < frameSize; i++) {
        const phase = i / frameSize;
        samples[i] = phase < 0.5
          ? 4 * phase - 1
          : 3 - 4 * phase;
      }
      break;
      
    case 'saw':
      for (let i = 0; i < frameSize; i++) {
        samples[i] = 2 * (i / frameSize) - 1;
      }
      break;
      
    case 'square':
      for (let i = 0; i < frameSize; i++) {
        samples[i] = i < frameSize / 2 ? 1 : -1;
      }
      break;
      
    case 'pulse':
      for (let i = 0; i < frameSize; i++) {
        samples[i] = i < frameSize / 4 ? 1 : -1;
      }
      break;
      
    case 'noise':
      for (let i = 0; i < frameSize; i++) {
        samples[i] = Math.random() * 2 - 1;
      }
      break;
      
    default:
      // Default to sine
      for (let i = 0; i < frameSize; i++) {
        samples[i] = Math.sin((2 * Math.PI * i) / frameSize);
      }
  }
  
  return samples;
}

// ============================================================================
// WAVETABLE INSTRUMENT ADAPTER
// ============================================================================

/**
 * WavetableInstrumentAdapter - Adapts Wavetable synth to InstrumentCard interface.
 */
export class WavetableInstrumentAdapter implements InstrumentCard {
  readonly instrumentType = 'wavetable';
  readonly instanceId: string;
  
  // Audio
  private audioContext: AudioContext | null = null;
  private outputNode: GainNode | null = null;
  private initialized = false;
  
  // Wavetables
  private wavetables: Map<string, WavetableData> = new Map();
  private currentWavetableId: string | null = null;
  private periodicWaves: Map<string, PeriodicWave[]> = new Map();
  
  // Voice management
  private maxVoices = 16;
  private voiceAllocationMode: VoiceAllocationMode = 'polyphonic';
  private voices: Map<number, WavetableVoice> = new Map();
  private nextVoiceId = 0;
  
  // Parameters
  private parameters: Map<string, number | boolean | string> = new Map();
  private parameterDescriptors: InstrumentParameter[] = [];
  
  // Presets
  private presets: InstrumentPreset[] = [];
  private currentPresetId: string | null = null;
  
  // Output
  private outputConfig: InstrumentOutputConfig = {
    channels: 2,
    gain: 0,
    pan: 0,
  };
  
  // Subscribers
  private subscribers: Set<() => void> = new Set();
  
  constructor(instanceId?: string) {
    this.instanceId = instanceId ?? `wavetable-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.initializeParameterDescriptors();
    this.initializePresets();
    this.initializeDefaultWavetables();
  }
  
  // ========== LIFECYCLE ==========
  
  async initialize(audioContext: AudioContext): Promise<void> {
    if (this.initialized) return;
    
    this.audioContext = audioContext;
    
    // Create output chain
    this.outputNode = audioContext.createGain();
    this.outputNode.gain.value = Math.pow(10, this.outputConfig.gain / 20);
    this.outputNode.connect(audioContext.destination);
    
    // Create periodic waves for each wavetable
    await this.createPeriodicWaves();
    
    this.initialized = true;
    this.notifySubscribers();
  }
  
  dispose(): void {
    this.allSoundOff();
    
    if (this.outputNode) {
      this.outputNode.disconnect();
      this.outputNode = null;
    }
    
    this.audioContext = null;
    this.initialized = false;
    this.voices.clear();
    this.periodicWaves.clear();
    this.subscribers.clear();
  }
  
  isInitialized(): boolean {
    return this.initialized;
  }
  
  // ========== NOTE PROCESSING ==========
  
  processNoteEvent(event: NoteEvent): void {
    switch (event.type) {
      case 'noteOn':
        this.noteOn(event.pitch, event.velocity, event.time);
        break;
      case 'noteOff':
        this.noteOff(event.pitch, event.time);
        break;
      case 'aftertouch':
        this.aftertouch(event.pitch, event.pressure ?? 0, event.time);
        break;
    }
  }
  
  noteOn(pitch: number, velocity: number, time?: number): void {
    if (!this.audioContext || !this.outputNode) return;
    
    const now = time ?? this.audioContext.currentTime;
    
    // Handle voice allocation
    if (this.voiceAllocationMode === 'monophonic' || this.voiceAllocationMode === 'legato') {
      if (this.voiceAllocationMode === 'monophonic') {
        this.allNotesOff(now);
      }
    } else if (this.voices.size >= this.maxVoices) {
      this.stealOldestVoice(now);
    }
    
    // Create new voice
    const voiceId = this.nextVoiceId++;
    const voice = this.createVoice(voiceId, pitch, velocity, now);
    this.voices.set(voiceId, voice);
    
    this.notifySubscribers();
  }
  
  noteOff(pitch: number, time?: number): void {
    if (!this.audioContext) return;
    
    const now = time ?? this.audioContext.currentTime;
    
    for (const [id, voice] of this.voices) {
      if (voice.pitch === pitch && voice.state !== 'release') {
        this.releaseVoice(id, now);
      }
    }
    
    this.notifySubscribers();
  }
  
  aftertouch(pitch: number, pressure: number, time?: number): void {
    for (const voice of this.voices.values()) {
      if (voice.pitch === pitch && voice.filter) {
        // Apply aftertouch to filter cutoff
        const baseCutoff = (this.parameters.get('filterCutoff') as number) ?? 5000;
        const modAmount = pressure / 127;
        voice.filter.frequency.setValueAtTime(
          baseCutoff * (1 + modAmount * 0.5),
          time ?? this.audioContext?.currentTime ?? 0
        );
      }
    }
  }
  
  channelPressure(pressure: number, time?: number): void {
    for (const voice of this.voices.values()) {
      if (voice.filter) {
        const baseCutoff = (this.parameters.get('filterCutoff') as number) ?? 5000;
        const modAmount = pressure / 127;
        voice.filter.frequency.setValueAtTime(
          baseCutoff * (1 + modAmount * 0.5),
          time ?? this.audioContext?.currentTime ?? 0
        );
      }
    }
  }
  
  allNotesOff(time?: number): void {
    const now = time ?? this.audioContext?.currentTime ?? 0;
    for (const id of this.voices.keys()) {
      this.releaseVoice(id, now);
    }
    this.notifySubscribers();
  }
  
  allSoundOff(): void {
    for (const voice of this.voices.values()) {
      if (voice.oscillator) {
        try {
          voice.oscillator.stop();
          voice.oscillator.disconnect();
        } catch {
          // May already be stopped
        }
      }
      if (voice.filter) voice.filter.disconnect();
      if (voice.gainNode) voice.gainNode.disconnect();
      if (voice.pannerNode) voice.pannerNode.disconnect();
    }
    this.voices.clear();
    this.notifySubscribers();
  }
  
  // ========== VOICE MANAGEMENT ==========
  
  getMaxVoices(): number {
    return this.maxVoices;
  }
  
  setMaxVoices(count: number): void {
    this.maxVoices = Math.max(1, Math.min(64, count));
    while (this.voices.size > this.maxVoices) {
      this.stealOldestVoice(this.audioContext?.currentTime ?? 0);
    }
  }
  
  getVoiceAllocationMode(): VoiceAllocationMode {
    return this.voiceAllocationMode;
  }
  
  setVoiceAllocationMode(mode: VoiceAllocationMode): void {
    this.voiceAllocationMode = mode;
    if (mode === 'monophonic' || mode === 'legato') {
      while (this.voices.size > 1) {
        this.stealOldestVoice(this.audioContext?.currentTime ?? 0);
      }
    }
  }
  
  getActiveVoices(): readonly VoiceInfo[] {
    return Array.from(this.voices.values()).map(v => ({
      id: v.id,
      state: v.state,
      pitch: v.pitch,
      velocity: v.velocity,
      startTime: v.startTime,
      ...(v.releaseTime === undefined ? {} : { releaseTime: v.releaseTime }),
    }));
  }
  
  getActiveVoiceCount(): number {
    return this.voices.size;
  }
  
  // ========== PARAMETERS ==========
  
  getParameterDescriptors(): readonly InstrumentParameter[] {
    return this.parameterDescriptors;
  }
  
  getParameter(id: string): number | boolean | string | undefined {
    return this.parameters.get(id);
  }
  
  setParameter(id: string, value: number | boolean | string, time?: number): void {
    this.parameters.set(id, value);
    this.applyParameter(id, value, time);
    this.notifySubscribers();
  }
  
  setParameters(params: Record<string, number | boolean | string>, time?: number): void {
    for (const [id, value] of Object.entries(params)) {
      this.parameters.set(id, value);
      this.applyParameter(id, value, time);
    }
    this.notifySubscribers();
  }
  
  resetParameters(): void {
    for (const desc of this.parameterDescriptors) {
      this.parameters.set(desc.id, desc.default);
    }
    this.notifySubscribers();
  }
  
  // ========== PRESETS ==========
  
  getPresets(): readonly InstrumentPreset[] {
    return this.presets;
  }
  
  loadPreset(presetId: string): void {
    const preset = this.presets.find(p => p.id === presetId);
    if (!preset) return;
    
    this.setParameters(preset.parameters as Record<string, number | boolean | string>);
    this.currentPresetId = presetId;
    this.notifySubscribers();
  }
  
  savePreset(name: string, category?: string): InstrumentPreset {
    const preset: InstrumentPreset = {
      id: `preset-${Date.now()}`,
      name,
      ...(category === undefined ? {} : { category }),
      parameters: Object.fromEntries(this.parameters),
    };
    this.presets.push(preset);
    return preset;
  }
  
  getCurrentPresetId(): string | undefined {
    return this.currentPresetId ?? undefined;
  }
  
  // ========== OUTPUT ==========
  
  getOutputConfig(): InstrumentOutputConfig {
    return this.outputConfig;
  }

  setOutputGain(gainDb: number): void {
    this.setOutputConfig({ gain: gainDb });
  }

  setOutputPan(pan: number): void {
    const clamped = Math.max(-1, Math.min(1, pan));
    this.outputConfig = { ...this.outputConfig, pan: clamped };

    for (const voice of this.voices.values()) {
      if (voice.pannerNode) {
        voice.pannerNode.pan.value = clamped;
      }
    }

    this.notifySubscribers();
  }
  
  setOutputConfig(config: Partial<InstrumentOutputConfig>): void {
    this.outputConfig = { ...this.outputConfig, ...config };
    
    if (this.outputNode) {
      this.outputNode.gain.value = Math.pow(10, this.outputConfig.gain / 20);
    }
    
    this.notifySubscribers();
  }
  
  getOutputNode(): AudioNode {
    if (!this.outputNode) {
      throw new Error('Instrument not initialized');
    }
    return this.outputNode;
  }

  processEvents(events: readonly Event<unknown>[], currentTime: number): void {
    for (const event of events) {
      const payload = event.payload as { pitch?: number; velocity?: number };
      if (typeof payload.pitch === 'number') {
        this.noteOn(payload.pitch, payload.velocity ?? 100, currentTime);
        const noteOffTime = currentTime + (event.duration / 480);
        this.noteOff(payload.pitch, noteOffTime);
      }
    }
  }

  scheduleEvents(
    events: readonly Event<unknown>[],
    startTime: number,
    tickToTime: (tick: Tick) => number
  ): void {
    for (const event of events) {
      const payload = event.payload as { pitch?: number; velocity?: number };
      if (typeof payload.pitch !== 'number') continue;

      const noteOnTime = startTime + tickToTime(event.start);
      const noteOffTime = startTime + tickToTime(addTicks(event.start, event.duration));

      this.noteOn(payload.pitch, payload.velocity ?? 100, noteOnTime);
      this.noteOff(payload.pitch, noteOffTime);
    }
  }
  
  // ========== WAVETABLES ==========
  
  /**
   * Load a wavetable.
   */
  loadWavetable(wavetable: WavetableData): void {
    this.wavetables.set(wavetable.id, wavetable);
    if (!this.currentWavetableId) {
      this.currentWavetableId = wavetable.id;
    }
    if (this.audioContext) {
      this.createPeriodicWavesForTable(wavetable.id);
    }
    this.notifySubscribers();
  }
  
  /**
   * Select current wavetable.
   */
  selectWavetable(wavetableId: string): void {
    if (this.wavetables.has(wavetableId)) {
      this.currentWavetableId = wavetableId;
      this.notifySubscribers();
    }
  }
  
  /**
   * Get available wavetables.
   */
  getWavetables(): readonly WavetableData[] {
    return Array.from(this.wavetables.values());
  }
  
  /**
   * Get wavetable position (for morphing between frames).
   */
  getWavetablePosition(): number {
    return (this.parameters.get('wavetablePosition') as number) ?? 0;
  }
  
  /**
   * Set wavetable position (0-1).
   */
  setWavetablePosition(position: number, time?: number): void {
    this.setParameter('wavetablePosition', Math.max(0, Math.min(1, position)), time);
  }
  
  // ========== SUBSCRIPTION ==========
  
  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
  
  // ========== PRIVATE METHODS ==========
  
  private initializeParameterDescriptors(): void {
    this.parameterDescriptors = [
      {
        id: 'volume',
        name: 'Volume',
        type: 'float',
        min: -60,
        max: 12,
        default: 0,
        unit: 'dB',
        category: 'output',
        automatable: true,
        midiLearnable: true,
      },
      {
        id: 'pan',
        name: 'Pan',
        type: 'float',
        min: -1,
        max: 1,
        default: 0,
        category: 'output',
        automatable: true,
        midiLearnable: true,
      },
      {
        id: 'wavetablePosition',
        name: 'Wavetable Position',
        type: 'float',
        min: 0,
        max: 1,
        default: 0,
        category: 'oscillator',
        automatable: true,
        midiLearnable: true,
      },
      {
        id: 'detune',
        name: 'Detune',
        type: 'float',
        min: -100,
        max: 100,
        default: 0,
        unit: 'ct',
        category: 'oscillator',
        automatable: true,
        midiLearnable: true,
      },
      {
        id: 'unisonVoices',
        name: 'Unison Voices',
        type: 'int',
        min: 1,
        max: 8,
        default: 1,
        category: 'oscillator',
        automatable: false,
        midiLearnable: false,
      },
      {
        id: 'unisonDetune',
        name: 'Unison Detune',
        type: 'float',
        min: 0,
        max: 100,
        default: 10,
        unit: 'ct',
        category: 'oscillator',
        automatable: true,
        midiLearnable: true,
      },
      {
        id: 'attack',
        name: 'Attack',
        type: 'float',
        min: 0,
        max: 10,
        default: 0.01,
        unit: 's',
        category: 'envelope',
        automatable: true,
        midiLearnable: true,
      },
      {
        id: 'decay',
        name: 'Decay',
        type: 'float',
        min: 0,
        max: 10,
        default: 0.1,
        unit: 's',
        category: 'envelope',
        automatable: true,
        midiLearnable: true,
      },
      {
        id: 'sustain',
        name: 'Sustain',
        type: 'float',
        min: 0,
        max: 1,
        default: 0.8,
        category: 'envelope',
        automatable: true,
        midiLearnable: true,
      },
      {
        id: 'release',
        name: 'Release',
        type: 'float',
        min: 0,
        max: 10,
        default: 0.3,
        unit: 's',
        category: 'envelope',
        automatable: true,
        midiLearnable: true,
      },
      {
        id: 'filterCutoff',
        name: 'Filter Cutoff',
        type: 'float',
        min: 20,
        max: 20000,
        default: 5000,
        unit: 'Hz',
        category: 'filter',
        automatable: true,
        midiLearnable: true,
      },
      {
        id: 'filterResonance',
        name: 'Filter Resonance',
        type: 'float',
        min: 0,
        max: 1,
        default: 0,
        category: 'filter',
        automatable: true,
        midiLearnable: true,
      },
      {
        id: 'filterEnvAmount',
        name: 'Filter Env Amount',
        type: 'float',
        min: -1,
        max: 1,
        default: 0,
        category: 'filter',
        automatable: true,
        midiLearnable: true,
      },
      {
        id: 'filterType',
        name: 'Filter Type',
        type: 'enum',
        default: 'lowpass',
        enumValues: ['lowpass', 'highpass', 'bandpass', 'notch'],
        category: 'filter',
        automatable: false,
        midiLearnable: false,
      },
      {
        id: 'lfoRate',
        name: 'LFO Rate',
        type: 'float',
        min: 0.01,
        max: 20,
        default: 1,
        unit: 'Hz',
        category: 'lfo',
        automatable: true,
        midiLearnable: true,
      },
      {
        id: 'lfoAmount',
        name: 'LFO Amount',
        type: 'float',
        min: 0,
        max: 1,
        default: 0,
        category: 'lfo',
        automatable: true,
        midiLearnable: true,
      },
      {
        id: 'lfoTarget',
        name: 'LFO Target',
        type: 'enum',
        default: 'pitch',
        enumValues: ['pitch', 'filter', 'amplitude', 'wavetablePosition', 'pan'],
        category: 'lfo',
        automatable: false,
        midiLearnable: false,
      },
    ];
    
    // Set defaults
    for (const desc of this.parameterDescriptors) {
      this.parameters.set(desc.id, desc.default);
    }
  }
  
  private initializePresets(): void {
    this.presets = [
      {
        id: 'init',
        name: 'Init',
        category: 'Basic',
        parameters: Object.fromEntries(
          this.parameterDescriptors.map(p => [p.id, p.default])
        ),
      },
      {
        id: 'supersaw',
        name: 'Super Saw',
        category: 'Leads',
        parameters: {
          volume: 0,
          pan: 0,
          wavetablePosition: 0.3,
          detune: 0,
          unisonVoices: 7,
          unisonDetune: 15,
          attack: 0.01,
          decay: 0.2,
          sustain: 0.7,
          release: 0.3,
          filterCutoff: 8000,
          filterResonance: 0.2,
          filterEnvAmount: 0.3,
          filterType: 'lowpass',
          lfoRate: 0.5,
          lfoAmount: 0.1,
          lfoTarget: 'filter',
        },
      },
      {
        id: 'pad',
        name: 'Warm Pad',
        category: 'Pads',
        parameters: {
          volume: 0,
          pan: 0,
          wavetablePosition: 0.2,
          detune: 5,
          unisonVoices: 4,
          unisonDetune: 8,
          attack: 0.8,
          decay: 0.5,
          sustain: 0.6,
          release: 1.5,
          filterCutoff: 3000,
          filterResonance: 0.1,
          filterEnvAmount: 0.2,
          filterType: 'lowpass',
          lfoRate: 0.2,
          lfoAmount: 0.05,
          lfoTarget: 'wavetablePosition',
        },
      },
      {
        id: 'bass',
        name: 'Sub Bass',
        category: 'Bass',
        parameters: {
          volume: 0,
          pan: 0,
          wavetablePosition: 0,
          detune: 0,
          unisonVoices: 1,
          unisonDetune: 0,
          attack: 0.01,
          decay: 0.3,
          sustain: 0.5,
          release: 0.2,
          filterCutoff: 500,
          filterResonance: 0.3,
          filterEnvAmount: 0.5,
          filterType: 'lowpass',
          lfoRate: 0,
          lfoAmount: 0,
          lfoTarget: 'pitch',
        },
      },
      {
        id: 'pluck',
        name: 'Digital Pluck',
        category: 'Plucks',
        parameters: {
          volume: 0,
          pan: 0,
          wavetablePosition: 0.5,
          detune: 0,
          unisonVoices: 2,
          unisonDetune: 5,
          attack: 0.001,
          decay: 0.4,
          sustain: 0,
          release: 0.3,
          filterCutoff: 6000,
          filterResonance: 0.4,
          filterEnvAmount: 0.6,
          filterType: 'lowpass',
          lfoRate: 0,
          lfoAmount: 0,
          lfoTarget: 'pitch',
        },
      },
    ];
  }
  
  private initializeDefaultWavetables(): void {
    // Create basic wavetables
    const shapes: WavetableShape[] = ['sine', 'triangle', 'saw', 'square'];
    const frameSize = 2048;
    
    for (const shape of shapes) {
      const samples = generateBasicWavetable(shape, frameSize);
      const wavetable: WavetableData = {
        id: shape,
        name: shape.charAt(0).toUpperCase() + shape.slice(1),
        frameSize,
        frames: [{ index: 0, samples, name: shape }],
      };
      this.wavetables.set(shape, wavetable);
    }
    
    // Create a morphing wavetable with multiple frames
    const morphFrames: WavetableFrame[] = shapes.map((shape, i) => ({
      index: i,
      samples: generateBasicWavetable(shape, frameSize),
      name: shape,
    }));
    
    const morphTable: WavetableData = {
      id: 'morph',
      name: 'Basic Morph',
      frameSize,
      frames: morphFrames,
    };
    this.wavetables.set('morph', morphTable);
    
    // Set default wavetable
    this.currentWavetableId = 'saw';
  }
  
  private async createPeriodicWaves(): Promise<void> {
    if (!this.audioContext) return;
    
    for (const tableId of this.wavetables.keys()) {
      this.createPeriodicWavesForTable(tableId);
    }
  }
  
  private createPeriodicWavesForTable(tableId: string): void {
    if (!this.audioContext) return;
    
    const table = this.wavetables.get(tableId);
    if (!table) return;
    
    const waves: PeriodicWave[] = [];
    
    for (const frame of table.frames) {
      // Convert samples to frequency domain
      const real = new Float32Array(frame.samples.length / 2);
      const imag = new Float32Array(frame.samples.length / 2);
      
      // Simple DFT for first harmonics
      const N = frame.samples.length;
      const numHarmonics = Math.min(256, N / 2);
      
      for (let k = 0; k < numHarmonics; k++) {
        let realSum = 0;
        let imagSum = 0;
        for (let n = 0; n < N; n++) {
          const angle = (2 * Math.PI * k * n) / N;
          const sample = frame.samples[n] ?? 0;
          realSum += sample * Math.cos(angle);
          imagSum -= sample * Math.sin(angle);
        }
        real[k] = realSum / N;
        imag[k] = imagSum / N;
      }
      
      const wave = this.audioContext.createPeriodicWave(real, imag, {
        disableNormalization: false,
      });
      waves.push(wave);
    }
    
    this.periodicWaves.set(tableId, waves);
  }
  
  private createVoice(
    id: number,
    pitch: number,
    velocity: number,
    startTime: number
  ): WavetableVoice {
    if (!this.audioContext || !this.outputNode) {
      return {
        id,
        state: 'idle',
        pitch,
        velocity,
        startTime,
        oscillator: null,
        filter: null,
        gainNode: null,
        pannerNode: null,
        phase: 0,
        wavetablePosition: this.getWavetablePosition(),
      };
    }
    
    // Create oscillator
    const oscillator = this.audioContext.createOscillator();
    oscillator.frequency.value = 440 * Math.pow(2, (pitch - 69) / 12);
    
    // Apply detune
    const detune = (this.parameters.get('detune') as number) ?? 0;
    oscillator.detune.value = detune;
    
    // Set wavetable
    const waves = this.periodicWaves.get(this.currentWavetableId ?? 'saw');
    if (waves && waves.length > 0) {
      const position = this.getWavetablePosition();
      const frameIndex = Math.floor(position * (waves.length - 1));
      const wave = waves[Math.min(frameIndex, waves.length - 1)];
      if (wave) {
        oscillator.setPeriodicWave(wave);
      }
    }
    
    // Create filter
    const filter = this.audioContext.createBiquadFilter();
    const filterType = (this.parameters.get('filterType') as string) ?? 'lowpass';
    filter.type = filterType as BiquadFilterType;
    filter.frequency.value = (this.parameters.get('filterCutoff') as number) ?? 5000;
    filter.Q.value = ((this.parameters.get('filterResonance') as number) ?? 0) * 20;
    
    // Create gain node
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0;
    
    // Apply ADSR envelope
    const attack = (this.parameters.get('attack') as number) ?? 0.01;
    const targetGain = (velocity / 127) * Math.pow(10, this.outputConfig.gain / 20);
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(targetGain, startTime + attack);
    
    // Create panner
    const pannerNode = this.audioContext.createStereoPanner();
    pannerNode.pan.value = this.outputConfig.pan;
    
    // Connect chain
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(pannerNode);
    pannerNode.connect(this.outputNode);
    
    // Start oscillator
    oscillator.start(startTime);
    
    return {
      id,
      state: 'attack',
      pitch,
      velocity,
      startTime,
      oscillator,
      filter,
      gainNode,
      pannerNode,
      phase: 0,
      wavetablePosition: this.getWavetablePosition(),
    };
  }
  
  private releaseVoice(voiceId: number, time: number): void {
    const voice = this.voices.get(voiceId);
    if (!voice || !voice.gainNode || !voice.oscillator) return;
    
    const release = (this.parameters.get('release') as number) ?? 0.3;
    
    voice.state = 'release';
    voice.releaseTime = time;
    
    // Apply release envelope
    voice.gainNode.gain.cancelScheduledValues(time);
    voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, time);
    voice.gainNode.gain.linearRampToValueAtTime(0, time + release);
    
    // Stop oscillator after release
    voice.oscillator.stop(time + release + 0.01);
    
    // Clean up after release
    setTimeout(() => {
      this.voices.delete(voiceId);
      this.notifySubscribers();
    }, (release + 0.1) * 1000);
  }
  
  private stealOldestVoice(time: number): void {
    let oldest: WavetableVoice | null = null;
    let oldestTime = Infinity;
    
    for (const voice of this.voices.values()) {
      if (voice.startTime < oldestTime) {
        oldestTime = voice.startTime;
        oldest = voice;
      }
    }
    
    if (oldest) {
      this.releaseVoice(oldest.id, time);
    }
  }
  
  private applyParameter(id: string, value: number | boolean | string, time?: number): void {
    const now = time ?? this.audioContext?.currentTime ?? 0;
    
    switch (id) {
      case 'volume':
        if (this.outputNode) {
          this.outputNode.gain.setValueAtTime(Math.pow(10, (value as number) / 20), now);
        }
        break;
        
      case 'filterCutoff':
        for (const voice of this.voices.values()) {
          if (voice.filter) {
            voice.filter.frequency.setValueAtTime(value as number, now);
          }
        }
        break;
        
      case 'filterResonance':
        for (const voice of this.voices.values()) {
          if (voice.filter) {
            voice.filter.Q.setValueAtTime((value as number) * 20, now);
          }
        }
        break;
        
      case 'detune':
        for (const voice of this.voices.values()) {
          if (voice.oscillator) {
            voice.oscillator.detune.setValueAtTime(value as number, now);
          }
        }
        break;
        
      case 'wavetablePosition':
        // Update wavetable frame for active voices
        const waves = this.periodicWaves.get(this.currentWavetableId ?? 'saw');
        if (waves && waves.length > 1) {
          const frameIndex = Math.floor((value as number) * (waves.length - 1));
          for (const voice of this.voices.values()) {
            if (voice.oscillator) {
              const wave = waves[Math.min(frameIndex, waves.length - 1)];
              if (wave) {
                voice.oscillator.setPeriodicWave(wave);
              }
            }
          }
        }
        break;
    }
  }
  
  private notifySubscribers(): void {
    for (const callback of this.subscribers) {
      callback();
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Creates a new WavetableInstrumentAdapter instance.
 */
export function createWavetableInstrument(instanceId?: string): WavetableInstrumentAdapter {
  return new WavetableInstrumentAdapter(instanceId);
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { InstrumentCard, InstrumentParameter, InstrumentPreset, NoteEvent };
