/**
 * @fileoverview Sampler Instrument Adapter - Implements InstrumentCard interface for Sampler.
 * 
 * Adapts the existing Sampler card to the standardized InstrumentCard interface
 * for uniform handling in the integration layer.
 * 
 * @module @cardplay/cards/sampler-instrument-adapter
 * @see INTEGRATION_FIXES_CHECKLIST.md Phase F.2
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
} from '../audio/instrument-interface';
import type { Event } from '../types/event';
import type { Tick } from '../types/primitives';
import { addTicks } from '../types/primitives';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Sampler-specific configuration.
 */
export interface SamplerConfig {
  /** Maximum polyphony */
  maxVoices: number;
  /** Default velocity curve */
  velocityCurve: 'linear' | 'soft' | 'hard' | 'fixed';
  /** Global pitch offset in semitones */
  pitchOffset: number;
  /** Global fine-tuning in cents */
  fineTune: number;
  /** Glide/portamento time in seconds */
  glideTime: number;
  /** Legato mode enabled */
  legato: boolean;
}

/**
 * Sample zone for multi-sample playback.
 */
export interface SampleZone {
  readonly id: string;
  readonly sampleBuffer: AudioBuffer | null;
  readonly keyRangeLow: number;   // MIDI note 0-127
  readonly keyRangeHigh: number;  // MIDI note 0-127
  readonly velocityLow: number;   // 0-127
  readonly velocityHigh: number;  // 0-127
  readonly rootKey: number;       // MIDI note 0-127
  readonly fineTune: number;      // cents -100 to +100
  readonly gain: number;          // dB
  readonly pan: number;           // -1 to +1
  readonly loopStart?: number;    // sample frames
  readonly loopEnd?: number;      // sample frames
  readonly loopEnabled: boolean;
}

/**
 * Internal voice state for sampler.
 */
interface SamplerVoice {
  id: number;
  state: VoiceState;
  pitch: number;
  velocity: number;
  startTime: number;
  releaseTime?: number;
  zoneId: string;
  sourceNode: AudioBufferSourceNode | null;
  gainNode: GainNode | null;
  pannerNode: StereoPannerNode | null;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const DEFAULT_CONFIG: SamplerConfig = {
  maxVoices: 64,
  velocityCurve: 'linear',
  pitchOffset: 0,
  fineTune: 0,
  glideTime: 0,
  legato: false,
};

// ============================================================================
// SAMPLER INSTRUMENT ADAPTER
// ============================================================================

/**
 * SamplerInstrumentAdapter - Adapts Sampler to InstrumentCard interface.
 */
export class SamplerInstrumentAdapter implements InstrumentCard {
  readonly instrumentType = 'sampler';
  readonly instanceId: string;
  
  // Audio
  private audioContext: AudioContext | null = null;
  private outputNode: GainNode | null = null;
  private initialized = false;
  
  // Configuration
  private config: SamplerConfig = { ...DEFAULT_CONFIG };
  private voiceAllocationMode: VoiceAllocationMode = 'polyphonic';
  
  // Zones
  private zones: Map<string, SampleZone> = new Map();
  
  // Voices
  private voices: Map<number, SamplerVoice> = new Map();
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
    this.instanceId = instanceId ?? `sampler-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.initializeParameterDescriptors();
    this.initializePresets();
  }
  
  // ========== LIFECYCLE ==========
  
  async initialize(audioContext: AudioContext): Promise<void> {
    if (this.initialized) return;
    
    this.audioContext = audioContext;
    
    // Create output chain
    this.outputNode = audioContext.createGain();
    this.outputNode.gain.value = Math.pow(10, this.outputConfig.gain / 20);
    this.outputNode.connect(audioContext.destination);
    
    this.initialized = true;
    this.notifySubscribers();
  }
  
  dispose(): void {
    this.allSoundOff();
    
    // Disconnect all nodes
    if (this.outputNode) {
      this.outputNode.disconnect();
      this.outputNode = null;
    }
    
    this.audioContext = null;
    this.initialized = false;
    this.voices.clear();
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
    
    // Find matching zone
    const zone = this.findZoneForNote(pitch, velocity);
    if (!zone || !zone.sampleBuffer) return;
    
    // Handle voice allocation
    if (this.voiceAllocationMode === 'monophonic' || this.voiceAllocationMode === 'legato') {
      // Kill existing voices
      if (this.voiceAllocationMode === 'monophonic') {
        this.allNotesOff(now);
      }
    } else if (this.voices.size >= this.config.maxVoices) {
      // Steal oldest voice
      this.stealOldestVoice(now);
    }
    
    // Create new voice
    const voiceId = this.nextVoiceId++;
    const voice = this.createVoice(voiceId, pitch, velocity, zone, now);
    this.voices.set(voiceId, voice);
    
    this.notifySubscribers();
  }
  
  noteOff(pitch: number, time?: number): void {
    if (!this.audioContext) return;
    
    const now = time ?? this.audioContext.currentTime;
    
    // Find voices with matching pitch
    for (const [id, voice] of this.voices) {
      if (voice.pitch === pitch && voice.state !== 'release') {
        this.releaseVoice(id, now);
      }
    }
    
    this.notifySubscribers();
  }
  
  aftertouch(pitch: number, pressure: number, time?: number): void {
    // Apply aftertouch modulation to matching voices
    for (const voice of this.voices.values()) {
      if (voice.pitch === pitch && voice.gainNode) {
        const modAmount = pressure / 127;
        // Example: modulate gain slightly
        const baseGain = this.velocityToGain(voice.velocity);
        voice.gainNode.gain.setValueAtTime(
          baseGain * (1 + modAmount * 0.1),
          time ?? this.audioContext?.currentTime ?? 0
        );
      }
    }
  }
  
  channelPressure(pressure: number, time?: number): void {
    // Apply to all active voices
    for (const voice of this.voices.values()) {
      if (voice.gainNode) {
        const modAmount = pressure / 127;
        const baseGain = this.velocityToGain(voice.velocity);
        voice.gainNode.gain.setValueAtTime(
          baseGain * (1 + modAmount * 0.1),
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
    // Immediate silence - stop all source nodes
    for (const voice of this.voices.values()) {
      if (voice.sourceNode) {
        try {
          voice.sourceNode.stop();
          voice.sourceNode.disconnect();
        } catch {
          // May already be stopped
        }
      }
      if (voice.gainNode) voice.gainNode.disconnect();
      if (voice.pannerNode) voice.pannerNode.disconnect();
    }
    this.voices.clear();
    this.notifySubscribers();
  }
  
  // ========== VOICE MANAGEMENT ==========
  
  getMaxVoices(): number {
    return this.config.maxVoices;
  }
  
  setMaxVoices(count: number): void {
    this.config.maxVoices = Math.max(1, Math.min(128, count));
    // Trim voices if needed
    while (this.voices.size > this.config.maxVoices) {
      this.stealOldestVoice(this.audioContext?.currentTime ?? 0);
    }
  }
  
  getVoiceAllocationMode(): VoiceAllocationMode {
    return this.voiceAllocationMode;
  }
  
  setVoiceAllocationMode(mode: VoiceAllocationMode): void {
    this.voiceAllocationMode = mode;
    if (mode === 'monophonic' || mode === 'legato') {
      // Keep only newest voice
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
  
  // ========== ZONES ==========
  
  /**
   * Add a sample zone to the sampler.
   */
  addZone(zone: SampleZone): void {
    this.zones.set(zone.id, zone);
    this.notifySubscribers();
  }
  
  /**
   * Remove a sample zone.
   */
  removeZone(zoneId: string): void {
    this.zones.delete(zoneId);
    this.notifySubscribers();
  }
  
  /**
   * Get all zones.
   */
  getZones(): readonly SampleZone[] {
    return Array.from(this.zones.values());
  }
  
  /**
   * Load sample into a zone.
   */
  async loadSample(zoneId: string, audioBuffer: AudioBuffer): Promise<void> {
    const zone = this.zones.get(zoneId);
    if (zone) {
      this.zones.set(zoneId, { ...zone, sampleBuffer: audioBuffer });
      this.notifySubscribers();
    }
  }
  
  // ========== SUBSCRIPTION ==========
  
  /**
   * Subscribe to state changes.
   */
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
        default: 20000,
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
        id: 'pitchOffset',
        name: 'Pitch Offset',
        type: 'float',
        min: -24,
        max: 24,
        default: 0,
        unit: 'st',
        category: 'pitch',
        automatable: true,
        midiLearnable: true,
      },
      {
        id: 'fineTune',
        name: 'Fine Tune',
        type: 'float',
        min: -100,
        max: 100,
        default: 0,
        unit: 'ct',
        category: 'pitch',
        automatable: true,
        midiLearnable: true,
      },
      {
        id: 'glideTime',
        name: 'Glide Time',
        type: 'float',
        min: 0,
        max: 2,
        default: 0,
        unit: 's',
        category: 'pitch',
        automatable: true,
        midiLearnable: true,
      },
      {
        id: 'velocityCurve',
        name: 'Velocity Curve',
        type: 'enum',
        default: 'linear',
        enumValues: ['linear', 'soft', 'hard', 'fixed'],
        category: 'response',
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
        id: 'default',
        name: 'Default',
        category: 'Basic',
        parameters: Object.fromEntries(
          this.parameterDescriptors.map(p => [p.id, p.default])
        ),
      },
      {
        id: 'pad',
        name: 'Soft Pad',
        category: 'Pads',
        parameters: {
          volume: 0,
          pan: 0,
          attack: 0.5,
          decay: 0.3,
          sustain: 0.7,
          release: 1.0,
          filterCutoff: 8000,
          filterResonance: 0.2,
          pitchOffset: 0,
          fineTune: 0,
          glideTime: 0.1,
          velocityCurve: 'soft',
        },
      },
      {
        id: 'pluck',
        name: 'Pluck',
        category: 'Plucks',
        parameters: {
          volume: 0,
          pan: 0,
          attack: 0.001,
          decay: 0.3,
          sustain: 0,
          release: 0.2,
          filterCutoff: 5000,
          filterResonance: 0.3,
          pitchOffset: 0,
          fineTune: 0,
          glideTime: 0,
          velocityCurve: 'linear',
        },
      },
    ];
  }
  
  private findZoneForNote(pitch: number, velocity: number): SampleZone | null {
    for (const zone of this.zones.values()) {
      if (
        pitch >= zone.keyRangeLow &&
        pitch <= zone.keyRangeHigh &&
        velocity >= zone.velocityLow &&
        velocity <= zone.velocityHigh
      ) {
        return zone;
      }
    }
    return null;
  }
  
  private createVoice(
    id: number,
    pitch: number,
    velocity: number,
    zone: SampleZone,
    startTime: number
  ): SamplerVoice {
    if (!this.audioContext || !this.outputNode || !zone.sampleBuffer) {
      return {
        id,
        state: 'idle',
        pitch,
        velocity,
        startTime,
        zoneId: zone.id,
        sourceNode: null,
        gainNode: null,
        pannerNode: null,
      };
    }
    
    // Create audio nodes
    const sourceNode = this.audioContext.createBufferSource();
    sourceNode.buffer = zone.sampleBuffer;
    
    // Calculate playback rate for pitch
    const pitchDiff = pitch - zone.rootKey + this.config.pitchOffset + zone.fineTune / 100;
    sourceNode.playbackRate.value = Math.pow(2, pitchDiff / 12);
    
    // Loop settings
    if (zone.loopEnabled && zone.loopStart !== undefined && zone.loopEnd !== undefined) {
      sourceNode.loop = true;
      sourceNode.loopStart = zone.loopStart / zone.sampleBuffer.sampleRate;
      sourceNode.loopEnd = zone.loopEnd / zone.sampleBuffer.sampleRate;
    }
    
    // Gain node with velocity
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0;
    
    // Apply envelope
    const attack = (this.parameters.get('attack') as number) ?? 0.01;
    const targetGain = this.velocityToGain(velocity) * Math.pow(10, zone.gain / 20);
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(targetGain, startTime + attack);
    
    // Panner node
    const pannerNode = this.audioContext.createStereoPanner();
    pannerNode.pan.value = zone.pan + (this.outputConfig.pan ?? 0);
    
    // Connect chain
    sourceNode.connect(gainNode);
    gainNode.connect(pannerNode);
    pannerNode.connect(this.outputNode);
    
    // Start playback
    sourceNode.start(startTime);
    
    // Handle voice ending
    sourceNode.onended = () => {
      this.voices.delete(id);
      this.notifySubscribers();
    };
    
    return {
      id,
      state: 'attack',
      pitch,
      velocity,
      startTime,
      zoneId: zone.id,
      sourceNode,
      gainNode,
      pannerNode,
    };
  }
  
  private releaseVoice(voiceId: number, time: number): void {
    const voice = this.voices.get(voiceId);
    if (!voice || !voice.gainNode) return;
    
    const release = (this.parameters.get('release') as number) ?? 0.3;
    
    voice.state = 'release';
    voice.releaseTime = time;
    
    // Apply release envelope
    voice.gainNode.gain.cancelScheduledValues(time);
    voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, time);
    voice.gainNode.gain.linearRampToValueAtTime(0, time + release);
    
    // Stop source after release
    if (voice.sourceNode) {
      voice.sourceNode.stop(time + release + 0.01);
    }
  }
  
  private stealOldestVoice(time: number): void {
    let oldest: SamplerVoice | null = null;
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
  
  private velocityToGain(velocity: number): number {
    const normalized = velocity / 127;
    const curve = this.config.velocityCurve;
    
    switch (curve) {
      case 'soft':
        return Math.sqrt(normalized);
      case 'hard':
        return normalized * normalized;
      case 'fixed':
        return 1;
      case 'linear':
      default:
        return normalized;
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
      case 'pitchOffset':
        this.config.pitchOffset = value as number;
        // Update active voices
        for (const voice of this.voices.values()) {
          if (voice.sourceNode) {
            const zone = this.zones.get(voice.zoneId);
            if (zone) {
              const pitchDiff = voice.pitch - zone.rootKey + (value as number) + zone.fineTune / 100;
              voice.sourceNode.playbackRate.setValueAtTime(Math.pow(2, pitchDiff / 12), now);
            }
          }
        }
        break;
      case 'glideTime':
        this.config.glideTime = value as number;
        break;
      case 'velocityCurve':
        this.config.velocityCurve = value as 'linear' | 'soft' | 'hard' | 'fixed';
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
 * Creates a new SamplerInstrumentAdapter instance.
 */
export function createSamplerInstrument(instanceId?: string): SamplerInstrumentAdapter {
  return new SamplerInstrumentAdapter(instanceId);
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { InstrumentCard, InstrumentParameter, InstrumentPreset, NoteEvent };
