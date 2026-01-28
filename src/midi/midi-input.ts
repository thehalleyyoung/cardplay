/**
 * @fileoverview MIDI Input Handler - MIDI learn and routing.
 * 
 * Handles:
 * - MIDI device enumeration and connection
 * - MIDI learn mode for parameter mapping
 * - MIDI message routing to parameters
 * - CC, note, and pitch bend handling
 * - Integration with ParameterResolver
 * 
 * @module @cardplay/midi/midi-input
 * @see INTEGRATION_FIXES_CHECKLIST.md Phase G.2
 */

import { getParameterResolver } from '../state/parameter-resolver';

// ============================================================================
// TYPES
// ============================================================================

/**
 * MIDI message type.
 */
export type MidiMessageType =
  | 'note-on'
  | 'note-off'
  | 'control-change'
  | 'program-change'
  | 'pitch-bend'
  | 'aftertouch'
  | 'channel-aftertouch'
  | 'sysex';

/**
 * MIDI message.
 */
export interface MidiMessage {
  readonly type: MidiMessageType;
  readonly channel: number;
  readonly data1: number;
  readonly data2: number;
  readonly timestamp: number;
  readonly raw: Uint8Array;
}

/**
 * Note message.
 */
export interface NoteMessage {
  readonly note: number;
  readonly velocity: number;
  readonly channel: number;
  readonly timestamp: number;
}

/**
 * CC message.
 */
export interface CCMessage {
  readonly cc: number;
  readonly value: number;
  readonly channel: number;
  readonly timestamp: number;
}

/**
 * MIDI mapping.
 */
export interface MidiMapping {
  readonly id: string;
  readonly parameterPath: string;
  readonly messageType: 'cc' | 'note' | 'pitch-bend' | 'aftertouch';
  readonly channel: number; // 0-15, or -1 for omni
  readonly cc?: number; // For CC mappings
  readonly note?: number; // For note mappings
  readonly minValue: number;
  readonly maxValue: number;
  readonly invert: boolean;
  readonly device?: string;
}

/**
 * MIDI device info.
 */
export interface MidiDeviceInfo {
  readonly id: string;
  readonly name: string;
  readonly manufacturer: string;
  readonly type: 'input' | 'output';
  readonly state: 'connected' | 'disconnected';
}

/**
 * MIDI learn state.
 */
export interface MidiLearnState {
  readonly active: boolean;
  readonly targetParameter: string | null;
  readonly lastMessage: MidiMessage | null;
}

/**
 * Callback types.
 */
export type MidiMessageCallback = (message: MidiMessage) => void;
export type NoteCallback = (message: NoteMessage) => void;
export type CCCallback = (message: CCMessage) => void;
export type LearnCallback = (state: MidiLearnState) => void;

// ============================================================================
// MIDI INPUT HANDLER
// ============================================================================

/**
 * MidiInputHandler manages MIDI input, learning, and mapping.
 */
export class MidiInputHandler {
  private static instance: MidiInputHandler;

  // State
  private midiAccess: MIDIAccess | null = null;
  private inputs = new Map<string, MIDIInput>();
  private devices: MidiDeviceInfo[] = [];
  private mappings = new Map<string, MidiMapping>();

  // MIDI Learn
  private learnState: MidiLearnState = {
    active: false,
    targetParameter: null,
    lastMessage: null,
  };

  // Callbacks
  private messageCallbacks = new Set<MidiMessageCallback>();
  private noteOnCallbacks = new Set<NoteCallback>();
  private noteOffCallbacks = new Set<NoteCallback>();
  private ccCallbacks = new Set<CCCallback>();
  private learnCallbacks = new Set<LearnCallback>();

  // Active notes (for tracking)
  private activeNotes = new Map<string, NoteMessage>();

  private constructor() {}

  static getInstance(): MidiInputHandler {
    if (!MidiInputHandler.instance) {
      MidiInputHandler.instance = new MidiInputHandler();
    }
    return MidiInputHandler.instance;
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  /**
   * Initializes MIDI access.
   */
  async initialize(): Promise<boolean> {
    if (!navigator.requestMIDIAccess) {
      console.warn('Web MIDI API not supported');
      return false;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });

      // Listen for device changes
      this.midiAccess.addEventListener('statechange', (event) => {
        this.handleStateChange(event as MIDIConnectionEvent);
      });

      // Set up existing inputs
      this.refreshDevices();

      return true;
    } catch (error) {
      console.error('MIDI access denied:', error);
      return false;
    }
  }

  /**
   * Refreshes device list.
   */
  refreshDevices(): void {
    if (!this.midiAccess) return;

    this.devices = [];
    this.inputs.clear();

    // Enumerate inputs
    for (const [id, input] of this.midiAccess.inputs) {
      this.devices.push({
        id,
        name: input.name ?? 'Unknown',
        manufacturer: input.manufacturer ?? 'Unknown',
        type: 'input',
        state: input.state,
      });

      if (input.state === 'connected') {
        this.connectInput(input);
      }
    }

    // Enumerate outputs (for info only)
    for (const [id, output] of this.midiAccess.outputs) {
      this.devices.push({
        id,
        name: output.name ?? 'Unknown',
        manufacturer: output.manufacturer ?? 'Unknown',
        type: 'output',
        state: output.state,
      });
    }
  }

  private connectInput(input: MIDIInput): void {
    this.inputs.set(input.id, input);

    input.onmidimessage = (event: MIDIMessageEvent) => {
      this.handleMidiMessage(event, input.id);
    };
  }

  private handleStateChange(_event: MIDIConnectionEvent): void {
    this.refreshDevices();
  }

  // ==========================================================================
  // DEVICE ACCESS
  // ==========================================================================

  /**
   * Gets all devices.
   */
  getDevices(): readonly MidiDeviceInfo[] {
    return this.devices;
  }

  /**
   * Gets input devices.
   */
  getInputDevices(): readonly MidiDeviceInfo[] {
    return this.devices.filter(d => d.type === 'input');
  }

  /**
   * Gets connected input devices.
   */
  getConnectedInputs(): readonly MidiDeviceInfo[] {
    return this.devices.filter(d => d.type === 'input' && d.state === 'connected');
  }

  // ==========================================================================
  // MESSAGE HANDLING
  // ==========================================================================

  private handleMidiMessage(event: MIDIMessageEvent, deviceId: string): void {
    if (!event.data || event.data.length === 0) return;

    const message = this.parseMidiMessage(event.data, event.timeStamp);
    if (!message) return;

    // Notify general listeners
    for (const callback of this.messageCallbacks) {
      try {
        callback(message);
      } catch (e) {
        console.error('MIDI message callback error:', e);
      }
    }

    // Handle MIDI learn
    if (this.learnState.active) {
      this.handleMidiLearn(message, deviceId);
    }

    // Route to specific handlers
    switch (message.type) {
      case 'note-on':
        this.handleNoteOn(message);
        break;
      case 'note-off':
        this.handleNoteOff(message);
        break;
      case 'control-change':
        this.handleControlChange(message, deviceId);
        break;
      case 'pitch-bend':
        this.handlePitchBend(message, deviceId);
        break;
    }
  }

  private parseMidiMessage(data: Uint8Array, timestamp: number): MidiMessage | null {
    if (data.length === 0) return null;

    const status = data[0] ?? 0;
    const messageType = status & 0xF0;
    const channel = status & 0x0F;
    const data1 = data.length > 1 ? (data[1] ?? 0) : 0;
    const data2 = data.length > 2 ? (data[2] ?? 0) : 0;

    let type: MidiMessageType;

    switch (messageType) {
      case 0x80:
        type = 'note-off';
        break;
      case 0x90:
        type = data2 > 0 ? 'note-on' : 'note-off';
        break;
      case 0xA0:
        type = 'aftertouch';
        break;
      case 0xB0:
        type = 'control-change';
        break;
      case 0xC0:
        type = 'program-change';
        break;
      case 0xD0:
        type = 'channel-aftertouch';
        break;
      case 0xE0:
        type = 'pitch-bend';
        break;
      case 0xF0:
        type = 'sysex';
        break;
      default:
        return null;
    }

    return {
      type,
      channel,
      data1,
      data2,
      timestamp,
      raw: data,
    };
  }

  private handleNoteOn(message: MidiMessage): void {
    const note: NoteMessage = {
      note: message.data1,
      velocity: message.data2,
      channel: message.channel,
      timestamp: message.timestamp,
    };

    // Track active notes
    const key = `${message.channel}-${message.data1}`;
    this.activeNotes.set(key, note);

    // Notify listeners
    for (const callback of this.noteOnCallbacks) {
      try {
        callback(note);
      } catch (e) {
        console.error('Note on callback error:', e);
      }
    }

    // Check for note mappings
    this.applyNoteMappings(message.channel, message.data1, message.data2);
  }

  private handleNoteOff(message: MidiMessage): void {
    const note: NoteMessage = {
      note: message.data1,
      velocity: message.data2,
      channel: message.channel,
      timestamp: message.timestamp,
    };

    // Remove from active notes
    const key = `${message.channel}-${message.data1}`;
    this.activeNotes.delete(key);

    // Notify listeners
    for (const callback of this.noteOffCallbacks) {
      try {
        callback(note);
      } catch (e) {
        console.error('Note off callback error:', e);
      }
    }
  }

  private handleControlChange(message: MidiMessage, deviceId: string): void {
    const cc: CCMessage = {
      cc: message.data1,
      value: message.data2,
      channel: message.channel,
      timestamp: message.timestamp,
    };

    // Notify listeners
    for (const callback of this.ccCallbacks) {
      try {
        callback(cc);
      } catch (e) {
        console.error('CC callback error:', e);
      }
    }

    // Apply CC mappings
    this.applyCCMappings(message.channel, message.data1, message.data2, deviceId);
  }

  private handlePitchBend(message: MidiMessage, deviceId: string): void {
    // Pitch bend is 14-bit
    const value = (message.data2 << 7) | message.data1;
    const normalized = value / 16383; // 0-1

    this.applyPitchBendMappings(message.channel, normalized, deviceId);
  }

  // ==========================================================================
  // MIDI LEARN
  // ==========================================================================

  /**
   * Starts MIDI learn mode.
   */
  startLearn(parameterPath: string): void {
    this.learnState = {
      active: true,
      targetParameter: parameterPath,
      lastMessage: null,
    };

    // Notify parameter resolver
    getParameterResolver().setMidiLearnMode(parameterPath);

    this.notifyLearnChange();
  }

  /**
   * Cancels MIDI learn mode.
   */
  cancelLearn(): void {
    this.learnState = {
      active: false,
      targetParameter: null,
      lastMessage: null,
    };

    getParameterResolver().cancelMidiLearnMode();

    this.notifyLearnChange();
  }

  /**
   * Gets current learn state.
   */
  getLearnState(): MidiLearnState {
    return this.learnState;
  }

  private handleMidiLearn(message: MidiMessage, deviceId: string): void {
    // Only learn from CC, pitch bend, or notes
    if (
      message.type !== 'control-change' &&
      message.type !== 'pitch-bend' &&
      message.type !== 'note-on'
    ) {
      return;
    }

    this.learnState = {
      ...this.learnState,
      lastMessage: message,
    };

    // Create mapping
    if (this.learnState.targetParameter) {
      const mappingId = `${deviceId}-${message.channel}-${message.type}-${message.data1}`;
      let mapping: MidiMapping;

      if (message.type === 'control-change') {
        mapping = {
          id: mappingId,
          parameterPath: this.learnState.targetParameter,
          messageType: 'cc',
          channel: message.channel,
          cc: message.data1,
          minValue: 0,
          maxValue: 1,
          invert: false,
          device: deviceId,
        };
      } else if (message.type === 'pitch-bend') {
        mapping = {
          id: mappingId,
          parameterPath: this.learnState.targetParameter,
          messageType: 'pitch-bend',
          channel: message.channel,
          minValue: 0,
          maxValue: 1,
          invert: false,
          device: deviceId,
        };
      } else {
        // Note mapping
        mapping = {
          id: mappingId,
          parameterPath: this.learnState.targetParameter,
          messageType: 'note',
          channel: message.channel,
          note: message.data1,
          minValue: 0,
          maxValue: 1,
          invert: false,
          device: deviceId,
        };
      }

      this.addMapping(mapping);

      // Complete learn
      getParameterResolver().completeMidiLearn(
        message.channel,
        message.type === 'control-change' ? message.data1 : undefined
      );

      this.learnState = {
        active: false,
        targetParameter: null,
        lastMessage: message,
      };
    }

    this.notifyLearnChange();
  }

  // ==========================================================================
  // MAPPINGS
  // ==========================================================================

  /**
   * Adds a MIDI mapping.
   */
  addMapping(mapping: MidiMapping): void {
    this.mappings.set(mapping.id, mapping);
  }

  /**
   * Removes a mapping.
   */
  removeMapping(id: string): void {
    this.mappings.delete(id);
  }

  /**
   * Gets all mappings.
   */
  getMappings(): readonly MidiMapping[] {
    return Array.from(this.mappings.values());
  }

  /**
   * Gets mappings for a parameter.
   */
  getMappingsForParameter(parameterPath: string): readonly MidiMapping[] {
    return Array.from(this.mappings.values()).filter(
      m => m.parameterPath === parameterPath
    );
  }

  /**
   * Clears all mappings.
   */
  clearMappings(): void {
    this.mappings.clear();
  }

  private applyCCMappings(channel: number, cc: number, value: number, deviceId: string): void {
    for (const mapping of this.mappings.values()) {
      if (mapping.messageType !== 'cc') continue;
      if (mapping.cc !== cc) continue;
      if (mapping.channel !== -1 && mapping.channel !== channel) continue;
      if (mapping.device && mapping.device !== deviceId) continue;

      const normalized = this.applyMapping(value / 127, mapping);

      // Send to parameter resolver
      getParameterResolver().setMidiValue(
        mapping.parameterPath,
        normalized,
        channel,
        cc
      );
    }
  }

  private applyNoteMappings(channel: number, note: number, velocity: number): void {
    for (const mapping of this.mappings.values()) {
      if (mapping.messageType !== 'note') continue;
      if (mapping.note !== note) continue;
      if (mapping.channel !== -1 && mapping.channel !== channel) continue;

      const normalized = this.applyMapping(velocity / 127, mapping);

      getParameterResolver().setMidiValue(
        mapping.parameterPath,
        normalized,
        channel
      );
    }
  }

  private applyPitchBendMappings(channel: number, normalized: number, deviceId: string): void {
    for (const mapping of this.mappings.values()) {
      if (mapping.messageType !== 'pitch-bend') continue;
      if (mapping.channel !== -1 && mapping.channel !== channel) continue;
      if (mapping.device && mapping.device !== deviceId) continue;

      const value = this.applyMapping(normalized, mapping);

      getParameterResolver().setMidiValue(
        mapping.parameterPath,
        value,
        channel
      );
    }
  }

  private applyMapping(normalized: number, mapping: MidiMapping): number {
    let value = normalized;

    if (mapping.invert) {
      value = 1 - value;
    }

    // Scale to mapping range
    return mapping.minValue + value * (mapping.maxValue - mapping.minValue);
  }

  // ==========================================================================
  // SUBSCRIPTIONS
  // ==========================================================================

  /**
   * Subscribes to all MIDI messages.
   */
  onMessage(callback: MidiMessageCallback): () => void {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  /**
   * Subscribes to note on messages.
   */
  onNoteOn(callback: NoteCallback): () => void {
    this.noteOnCallbacks.add(callback);
    return () => this.noteOnCallbacks.delete(callback);
  }

  /**
   * Subscribes to note off messages.
   */
  onNoteOff(callback: NoteCallback): () => void {
    this.noteOffCallbacks.add(callback);
    return () => this.noteOffCallbacks.delete(callback);
  }

  /**
   * Subscribes to CC messages.
   */
  onCC(callback: CCCallback): () => void {
    this.ccCallbacks.add(callback);
    return () => this.ccCallbacks.delete(callback);
  }

  /**
   * Subscribes to learn state changes.
   */
  onLearnChange(callback: LearnCallback): () => void {
    this.learnCallbacks.add(callback);
    callback(this.learnState);
    return () => this.learnCallbacks.delete(callback);
  }

  private notifyLearnChange(): void {
    for (const callback of this.learnCallbacks) {
      try {
        callback(this.learnState);
      } catch (e) {
        console.error('Learn callback error:', e);
      }
    }
  }

  // ==========================================================================
  // ACTIVE NOTES
  // ==========================================================================

  /**
   * Gets currently active notes.
   */
  getActiveNotes(): readonly NoteMessage[] {
    return Array.from(this.activeNotes.values());
  }

  /**
   * Checks if a note is active.
   */
  isNoteActive(channel: number, note: number): boolean {
    return this.activeNotes.has(`${channel}-${note}`);
  }

  /**
   * Sends all notes off.
   */
  allNotesOff(): void {
    for (const note of this.activeNotes.values()) {
      for (const callback of this.noteOffCallbacks) {
        callback(note);
      }
    }
    this.activeNotes.clear();
  }

  // ==========================================================================
  // SERIALIZATION
  // ==========================================================================

  /**
   * Exports mappings as JSON.
   */
  exportMappings(): string {
    return JSON.stringify(Array.from(this.mappings.values()), null, 2);
  }

  /**
   * Imports mappings from JSON.
   */
  importMappings(json: string): void {
    const mappings: MidiMapping[] = JSON.parse(json);
    this.mappings.clear();
    for (const mapping of mappings) {
      this.mappings.set(mapping.id, mapping);
    }
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  dispose(): void {
    // Disconnect all inputs
    for (const input of this.inputs.values()) {
      input.onmidimessage = null;
    }
    this.inputs.clear();

    // Clear callbacks
    this.messageCallbacks.clear();
    this.noteOnCallbacks.clear();
    this.noteOffCallbacks.clear();
    this.ccCallbacks.clear();
    this.learnCallbacks.clear();

    // Clear state
    this.mappings.clear();
    this.activeNotes.clear();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Gets the MIDI input handler singleton.
 */
export function getMidiInput(): MidiInputHandler {
  return MidiInputHandler.getInstance();
}

/**
 * Initializes MIDI input.
 */
export async function initializeMidi(): Promise<boolean> {
  return getMidiInput().initialize();
}
