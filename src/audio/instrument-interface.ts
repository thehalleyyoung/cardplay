/**
 * @fileoverview Instrument Interface - Standardized interface for all instruments.
 * 
 * All instruments (Sampler, Wavetable, FM Synth, etc.) implement this interface
 * for uniform handling of note events and voice allocation.
 * 
 * @module @cardplay/audio/instrument-interface
 * @see INTEGRATION_FIXES_CHECKLIST.md Phase F.1
 */

import type { Event } from '../types/event';
import type { Tick } from '../types/primitives';
import { addTicks } from '../types/primitives';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Voice state in an instrument.
 */
export type VoiceState = 'idle' | 'attack' | 'sustain' | 'release';

/**
 * Voice allocation mode.
 */
export type VoiceAllocationMode = 
  | 'polyphonic'   // Multiple simultaneous voices
  | 'monophonic'   // Single voice with retrigger
  | 'legato'       // Single voice without retrigger
  | 'unison';      // All voices play same note

/**
 * Voice information.
 */
export interface VoiceInfo {
  readonly id: number;
  readonly state: VoiceState;
  readonly pitch: number;
  readonly velocity: number;
  readonly startTime: number;
  readonly releaseTime?: number;
}

/**
 * Note event for instrument processing.
 */
export interface NoteEvent {
  /** Note type */
  readonly type: 'noteOn' | 'noteOff' | 'aftertouch';
  /** MIDI pitch (0-127) */
  readonly pitch: number;
  /** Velocity (0-127) */
  readonly velocity: number;
  /** Aftertouch pressure (0-127), only for aftertouch events */
  readonly pressure?: number;
  /** Event timestamp (audio context time) */
  readonly time: number;
}

/**
 * Instrument parameter descriptor.
 */
export interface InstrumentParameter {
  readonly id: string;
  readonly name: string;
  readonly type: 'float' | 'int' | 'bool' | 'enum';
  readonly min?: number;
  readonly max?: number;
  readonly default: number | boolean | string;
  readonly unit?: string;
  readonly enumValues?: readonly string[];
  /** Parameter category for UI grouping */
  readonly category?: string;
  /** Whether parameter can be automated */
  readonly automatable: boolean;
  /** Whether parameter can be MIDI learned */
  readonly midiLearnable: boolean;
}

/**
 * Instrument preset.
 */
export interface InstrumentPreset {
  readonly id: string;
  readonly name: string;
  readonly category?: string;
  readonly parameters: Readonly<Record<string, number | boolean | string>>;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Instrument output configuration.
 */
export interface InstrumentOutputConfig {
  /** Number of output channels (1=mono, 2=stereo, etc.) */
  readonly channels: number;
  /** Output gain in dB */
  readonly gain: number;
  /** Pan position (-1 to 1) */
  readonly pan: number;
}

// ============================================================================
// INSTRUMENT INTERFACE
// ============================================================================

/**
 * InstrumentCard interface - all instruments implement this.
 * 
 * @template P - Payload type for events this instrument processes
 */
export interface InstrumentCard<P = unknown> {
  /** Unique instrument type identifier */
  readonly instrumentType: string;
  
  /** Unique instance identifier */
  readonly instanceId: string;
  
  // ========== LIFECYCLE ==========
  
  /**
   * Initializes the instrument with audio context.
   */
  initialize(audioContext: AudioContext): Promise<void>;
  
  /**
   * Disposes the instrument and releases resources.
   */
  dispose(): void;
  
  /**
   * Returns true if instrument is initialized.
   */
  isInitialized(): boolean;
  
  // ========== NOTE PROCESSING ==========
  
  /**
   * Processes a note event.
   */
  processNoteEvent(event: NoteEvent): void;
  
  /**
   * Processes a note-on event.
   */
  noteOn(pitch: number, velocity: number, time?: number): void;
  
  /**
   * Processes a note-off event.
   */
  noteOff(pitch: number, time?: number): void;
  
  /**
   * Processes aftertouch for a note.
   */
  aftertouch(pitch: number, pressure: number, time?: number): void;
  
  /**
   * Processes channel pressure (all notes).
   */
  channelPressure(pressure: number, time?: number): void;
  
  /**
   * Sends all notes off.
   */
  allNotesOff(time?: number): void;
  
  /**
   * Sends all sound off (immediate silence).
   */
  allSoundOff(): void;
  
  // ========== VOICE MANAGEMENT ==========
  
  /**
   * Gets maximum polyphony.
   */
  getMaxVoices(): number;
  
  /**
   * Sets maximum polyphony.
   */
  setMaxVoices(count: number): void;
  
  /**
   * Gets voice allocation mode.
   */
  getVoiceAllocationMode(): VoiceAllocationMode;
  
  /**
   * Sets voice allocation mode.
   */
  setVoiceAllocationMode(mode: VoiceAllocationMode): void;
  
  /**
   * Gets info about all active voices.
   */
  getActiveVoices(): readonly VoiceInfo[];
  
  /**
   * Gets number of currently active voices.
   */
  getActiveVoiceCount(): number;
  
  // ========== PARAMETERS ==========
  
  /**
   * Gets all parameter descriptors.
   */
  getParameterDescriptors(): readonly InstrumentParameter[];
  
  /**
   * Gets a parameter value.
   */
  getParameter(id: string): number | boolean | string | undefined;
  
  /**
   * Sets a parameter value.
   */
  setParameter(id: string, value: number | boolean | string, time?: number): void;
  
  /**
   * Sets multiple parameters at once.
   */
  setParameters(params: Record<string, number | boolean | string>, time?: number): void;
  
  /**
   * Resets all parameters to defaults.
   */
  resetParameters(): void;
  
  // ========== PRESETS ==========
  
  /**
   * Gets available presets.
   */
  getPresets(): readonly InstrumentPreset[];
  
  /**
   * Loads a preset by ID.
   */
  loadPreset(presetId: string): void;
  
  /**
   * Saves current settings as a preset.
   */
  savePreset(name: string, category?: string): InstrumentPreset;
  
  /**
   * Gets current preset ID (if any).
   */
  getCurrentPresetId(): string | undefined;
  
  // ========== AUDIO OUTPUT ==========
  
  /**
   * Gets the audio output node.
   */
  getOutputNode(): AudioNode;
  
  /**
   * Gets output configuration.
   */
  getOutputConfig(): InstrumentOutputConfig;
  
  /**
   * Sets output gain in dB.
   */
  setOutputGain(gainDb: number): void;
  
  /**
   * Sets output pan.
   */
  setOutputPan(pan: number): void;
  
  // ========== EVENT STREAM INTEGRATION ==========
  
  /**
   * Processes events from an event stream.
   */
  processEvents(events: readonly Event<P>[], currentTime: number): void;
  
  /**
   * Schedules events from an event stream.
   */
  scheduleEvents(events: readonly Event<P>[], startTime: number, tickToTime: (tick: Tick) => number): void;
}

// ============================================================================
// BASE IMPLEMENTATION
// ============================================================================

/**
 * Base class for instrument implementations.
 */
export abstract class InstrumentBase<P = unknown> implements InstrumentCard<P> {
  abstract readonly instrumentType: string;
  readonly instanceId: string;
  
  protected audioContext: AudioContext | null = null;
  protected outputGain: GainNode | null = null;
  protected stereoPanner: StereoPannerNode | null = null;
  
  protected maxVoices: number = 16;
  protected voiceAllocationMode: VoiceAllocationMode = 'polyphonic';
  protected outputConfig: InstrumentOutputConfig = {
    channels: 2,
    gain: 0,
    pan: 0,
  };
  
  protected currentPresetId: string | undefined;
  protected presets: InstrumentPreset[] = [];
  protected parameterValues: Map<string, number | boolean | string> = new Map();

  constructor(instanceId: string) {
    this.instanceId = instanceId;
  }

  // ========== LIFECYCLE ==========

  async initialize(audioContext: AudioContext): Promise<void> {
    this.audioContext = audioContext;
    
    // Create output chain
    this.outputGain = audioContext.createGain();
    this.stereoPanner = audioContext.createStereoPanner();
    
    this.outputGain.connect(this.stereoPanner);
    
    // Initialize subclass
    await this.initializeInstrument(audioContext);
  }

  protected abstract initializeInstrument(audioContext: AudioContext): Promise<void>;

  dispose(): void {
    this.allSoundOff();
    this.disposeInstrument();
    
    this.outputGain?.disconnect();
    this.stereoPanner?.disconnect();
    this.outputGain = null;
    this.stereoPanner = null;
    this.audioContext = null;
  }

  protected abstract disposeInstrument(): void;

  isInitialized(): boolean {
    return this.audioContext !== null;
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

  abstract noteOn(pitch: number, velocity: number, time?: number): void;
  abstract noteOff(pitch: number, time?: number): void;
  
  aftertouch(_pitch: number, _pressure: number, _time?: number): void {
    // Override in subclass if supported
  }
  
  channelPressure(_pressure: number, _time?: number): void {
    // Override in subclass if supported
  }
  
  abstract allNotesOff(time?: number): void;
  abstract allSoundOff(): void;

  // ========== VOICE MANAGEMENT ==========

  getMaxVoices(): number {
    return this.maxVoices;
  }

  setMaxVoices(count: number): void {
    this.maxVoices = Math.max(1, Math.min(64, count));
  }

  getVoiceAllocationMode(): VoiceAllocationMode {
    return this.voiceAllocationMode;
  }

  setVoiceAllocationMode(mode: VoiceAllocationMode): void {
    this.voiceAllocationMode = mode;
  }

  abstract getActiveVoices(): readonly VoiceInfo[];

  getActiveVoiceCount(): number {
    return this.getActiveVoices().length;
  }

  // ========== PARAMETERS ==========

  abstract getParameterDescriptors(): readonly InstrumentParameter[];

  getParameter(id: string): number | boolean | string | undefined {
    return this.parameterValues.get(id);
  }

  setParameter(id: string, value: number | boolean | string, time?: number): void {
    this.parameterValues.set(id, value);
    this.applyParameter(id, value, time);
  }

  protected abstract applyParameter(id: string, value: number | boolean | string, time?: number): void;

  setParameters(params: Record<string, number | boolean | string>, time?: number): void {
    for (const [id, value] of Object.entries(params)) {
      this.setParameter(id, value, time);
    }
  }

  resetParameters(): void {
    const descriptors = this.getParameterDescriptors();
    for (const param of descriptors) {
      this.setParameter(param.id, param.default);
    }
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
  }

  savePreset(name: string, category?: string): InstrumentPreset {
    const params: Record<string, number | boolean | string> = {};
    for (const [id, value] of this.parameterValues) {
      params[id] = value;
    }

    const preset: InstrumentPreset = {
      id: `preset-${Date.now()}`,
      name,
      ...(category === undefined ? {} : { category }),
      parameters: params,
    };

    this.presets.push(preset);
    return preset;
  }

  getCurrentPresetId(): string | undefined {
    return this.currentPresetId;
  }

  // ========== AUDIO OUTPUT ==========

  getOutputNode(): AudioNode {
    if (!this.stereoPanner) {
      throw new Error('Instrument not initialized');
    }
    return this.stereoPanner;
  }

  getOutputConfig(): InstrumentOutputConfig {
    return this.outputConfig;
  }

  setOutputGain(gainDb: number): void {
    this.outputConfig = { ...this.outputConfig, gain: gainDb };
    if (this.outputGain && this.audioContext) {
      const linearGain = Math.pow(10, gainDb / 20);
      this.outputGain.gain.setValueAtTime(linearGain, this.audioContext.currentTime);
    }
  }

  setOutputPan(pan: number): void {
    this.outputConfig = { ...this.outputConfig, pan: Math.max(-1, Math.min(1, pan)) };
    if (this.stereoPanner && this.audioContext) {
      this.stereoPanner.pan.setValueAtTime(this.outputConfig.pan, this.audioContext.currentTime);
    }
  }

  // ========== EVENT STREAM INTEGRATION ==========

  processEvents(events: readonly Event<P>[], currentTime: number): void {
    for (const event of events) {
      const payload = event.payload as { pitch?: number; velocity?: number };
      if (typeof payload.pitch === 'number') {
        this.noteOn(payload.pitch, payload.velocity ?? 100, currentTime);
        // Schedule note off
        const noteOffTime = currentTime + (event.duration / 480); // Assuming 480 TPQ
        this.noteOff(payload.pitch, noteOffTime);
      }
    }
  }

  scheduleEvents(
    events: readonly Event<P>[],
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
}

// ============================================================================
// INSTRUMENT REGISTRY
// ============================================================================

/**
 * Registry of available instrument types.
 */
export interface InstrumentRegistry {
  /**
   * Registers an instrument factory.
   */
  register(type: string, factory: (id: string) => InstrumentCard): void;

  /**
   * Creates an instrument instance.
   */
  create(type: string, instanceId: string): InstrumentCard | undefined;

  /**
   * Gets all registered instrument types.
   */
  getTypes(): readonly string[];

  /**
   * Checks if a type is registered.
   */
  hasType(type: string): boolean;

  /**
   * Clears all registered instruments.
   */
  clear(): void;
}

/**
 * Creates an instrument registry.
 */
export function createInstrumentRegistry(): InstrumentRegistry {
  const factories = new Map<string, (id: string) => InstrumentCard>();

  return {
    register(type: string, factory: (id: string) => InstrumentCard): void {
      factories.set(type, factory);
    },

    create(type: string, instanceId: string): InstrumentCard | undefined {
      const factory = factories.get(type);
      return factory?.(instanceId);
    },

    getTypes(): readonly string[] {
      return Array.from(factories.keys());
    },

    hasType(type: string): boolean {
      return factories.has(type);
    },

    clear(): void {
      factories.clear();
    },
  };
}

// Singleton registry
let _registry: InstrumentRegistry | null = null;

export function getInstrumentRegistry(): InstrumentRegistry {
  if (!_registry) {
    _registry = createInstrumentRegistry();
  }
  return _registry;
}

export function resetInstrumentRegistry(): void {
  _registry = null;
}
