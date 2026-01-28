/**
 * @fileoverview MIDI Input Handling System
 * 
 * Processes MIDI messages and routes them to appropriate handlers:
 * - Note on/off with velocity sensitivity
 * - Channel aftertouch (channel pressure)
 * - Polyphonic aftertouch (key pressure)
 * - Pitch bend
 * - Mod wheel (CC #1)
 * - All CC messages
 * - Program change
 * - System messages
 * 
 * @module @cardplay/core/audio/midi-input-handler
 */

import type { MIDIMessage, MIDIDeviceInfo } from './web-midi';
import type { MIDIParameterMapping } from './midi-mapping';
import { findMatchingMappings, mapMIDIToParameter } from './midi-mapping';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Note event (note on or off)
 */
export interface NoteEvent {
  /** Note number (0-127) */
  readonly note: number;
  /** Velocity (0-127, 0 = note off) */
  readonly velocity: number;
  /** MIDI channel (0-15) */
  readonly channel: number;
  /** Timestamp in high-resolution time */
  readonly timestamp: number;
  /** Device that sent the message */
  readonly device: MIDIDeviceInfo;
  /** Whether this is a note on (vs note off) */
  readonly isNoteOn: boolean;
}

/**
 * Aftertouch event (channel or polyphonic)
 */
export interface AftertouchEvent {
  /** Note number (for poly AT) or -1 (for channel AT) */
  readonly note: number;
  /** Pressure value (0-127) */
  readonly pressure: number;
  /** MIDI channel (0-15) */
  readonly channel: number;
  /** Timestamp in high-resolution time */
  readonly timestamp: number;
  /** Device that sent the message */
  readonly device: MIDIDeviceInfo;
  /** Whether this is polyphonic (vs channel) */
  readonly isPolyphonic: boolean;
}

/**
 * Pitch bend event
 */
export interface PitchBendEvent {
  /** Pitch bend value (-8192 to +8191, center = 0) */
  readonly value: number;
  /** Normalized pitch bend value (-1.0 to +1.0, center = 0) */
  readonly normalized: number;
  /** MIDI channel (0-15) */
  readonly channel: number;
  /** Timestamp in high-resolution time */
  readonly timestamp: number;
  /** Device that sent the message */
  readonly device: MIDIDeviceInfo;
}

/**
 * Control change event
 */
export interface ControlChangeEvent {
  /** CC number (0-127) */
  readonly controller: number;
  /** CC value (0-127) */
  readonly value: number;
  /** Normalized CC value (0.0 to 1.0) */
  readonly normalized: number;
  /** MIDI channel (0-15) */
  readonly channel: number;
  /** Timestamp in high-resolution time */
  readonly timestamp: number;
  /** Device that sent the message */
  readonly device: MIDIDeviceInfo;
  /** CC name (if known) */
  readonly name?: string;
}

/**
 * Program change event
 */
export interface ProgramChangeEvent {
  /** Program number (0-127) */
  readonly program: number;
  /** Bank MSB (if bank select was sent) */
  readonly bankMSB?: number;
  /** Bank LSB (if bank select was sent) */
  readonly bankLSB?: number;
  /** MIDI channel (0-15) */
  readonly channel: number;
  /** Timestamp in high-resolution time */
  readonly timestamp: number;
  /** Device that sent the message */
  readonly device: MIDIDeviceInfo;
}

/**
 * NRPN/RPN message event
 */
export interface NRPNRPNEvent {
  /** Whether this is NRPN (vs RPN) */
  readonly isNRPN: boolean;
  /** Parameter number (0-16383) */
  readonly parameter: number;
  /** Value (0-16383) */
  readonly value: number;
  /** MIDI channel (0-15) */
  readonly channel: number;
  /** Timestamp in high-resolution time */
  readonly timestamp: number;
  /** Device that sent the message */
  readonly device: MIDIDeviceInfo;
}

/**
 * Sysex message event
 */
export interface SysexEvent {
  /** Manufacturer ID (1-3 bytes) */
  readonly manufacturerId: readonly number[];
  /** Raw sysex data (excluding F0 and F7) */
  readonly data: Readonly<Uint8Array>;
  /** Timestamp in high-resolution time */
  readonly timestamp: number;
  /** Device that sent the message */
  readonly device: MIDIDeviceInfo;
}

/**
 * MIDI Time Code (MTC) quarter frame event
 */
export interface MTCEvent {
  /** Message type (0-7) */
  readonly messageType: number;
  /** Value (0-15) */
  readonly value: number;
  /** Timestamp in high-resolution time */
  readonly timestamp: number;
  /** Device that sent the message */
  readonly device: MIDIDeviceInfo;
}

/**
 * MIDI Clock event
 */
export interface ClockEvent {
  /** Clock type ('clock' | 'start' | 'stop' | 'continue') */
  readonly type: 'clock' | 'start' | 'stop' | 'continue';
  /** Timestamp in high-resolution time */
  readonly timestamp: number;
  /** Device that sent the message */
  readonly device: MIDIDeviceInfo;
}

/**
 * Song position pointer event
 */
export interface SongPositionEvent {
  /** Position in MIDI beats (sixteenth notes) */
  readonly position: number;
  /** Timestamp in high-resolution time */
  readonly timestamp: number;
  /** Device that sent the message */
  readonly device: MIDIDeviceInfo;
}

/**
 * Active sensing event
 */
export interface ActiveSensingEvent {
  /** Timestamp in high-resolution time */
  readonly timestamp: number;
  /** Device that sent the message */
  readonly device: MIDIDeviceInfo;
}

/**
 * Parameter value update from MIDI mapping
 */
export interface ParameterUpdate {
  /** Parameter ID */
  readonly parameterId: string;
  /** Parameter name */
  readonly parameterName: string;
  /** New value */
  readonly value: number;
  /** Mapping that triggered this update */
  readonly mapping: MIDIParameterMapping;
  /** Original MIDI message */
  readonly midiMessage: MIDIMessage;
  /** Device that sent the message */
  readonly device: MIDIDeviceInfo;
}

/**
 * MIDI input handler callbacks
 */
export interface MIDIInputCallbacks {
  /** Called on note on/off */
  onNote?: (event: NoteEvent) => void;
  /** Called on aftertouch */
  onAftertouch?: (event: AftertouchEvent) => void;
  /** Called on pitch bend */
  onPitchBend?: (event: PitchBendEvent) => void;
  /** Called on control change */
  onControlChange?: (event: ControlChangeEvent) => void;
  /** Called on program change */
  onProgramChange?: (event: ProgramChangeEvent) => void;
  /** Called on NRPN/RPN message */
  onNRPNRPN?: (event: NRPNRPNEvent) => void;
  /** Called on sysex message */
  onSysex?: (event: SysexEvent) => void;
  /** Called on MIDI Time Code quarter frame */
  onMTC?: (event: MTCEvent) => void;
  /** Called on MIDI clock/start/stop/continue */
  onClock?: (event: ClockEvent) => void;
  /** Called on song position pointer */
  onSongPosition?: (event: SongPositionEvent) => void;
  /** Called on active sensing */
  onActiveSensing?: (event: ActiveSensingEvent) => void;
  /** Called when a mapped parameter should be updated */
  onParameterUpdate?: (update: ParameterUpdate) => void;
}

/**
 * Velocity sensitivity curve
 */
export type VelocityCurve = 'linear' | 'soft' | 'medium' | 'hard' | 'fixed';

/**
 * Velocity sensitivity configuration
 */
export interface VelocityConfig {
  /** Velocity curve type */
  readonly curve: VelocityCurve;
  /** Fixed velocity value (if curve === 'fixed') */
  readonly fixedValue: number;
  /** Minimum output velocity */
  readonly minVelocity: number;
  /** Maximum output velocity */
  readonly maxVelocity: number;
}

// ============================================================================
// WELL-KNOWN CC NUMBERS
// ============================================================================

export const CC_BANK_SELECT_MSB = 0;
export const CC_MOD_WHEEL = 1;
export const CC_BREATH_CONTROLLER = 2;
export const CC_FOOT_CONTROLLER = 4;
export const CC_PORTAMENTO_TIME = 5;
export const CC_DATA_ENTRY_MSB = 6;
export const CC_CHANNEL_VOLUME = 7;
export const CC_BALANCE = 8;
export const CC_PAN = 10;
export const CC_EXPRESSION = 11;
export const CC_EFFECT_CONTROL_1 = 12;
export const CC_EFFECT_CONTROL_2 = 13;
export const CC_GENERAL_PURPOSE_1 = 16;
export const CC_GENERAL_PURPOSE_2 = 17;
export const CC_GENERAL_PURPOSE_3 = 18;
export const CC_GENERAL_PURPOSE_4 = 19;
export const CC_BANK_SELECT_LSB = 32;
export const CC_SUSTAIN_PEDAL = 64;
export const CC_PORTAMENTO = 65;
export const CC_SOSTENUTO = 66;
export const CC_SOFT_PEDAL = 67;
export const CC_LEGATO_FOOTSWITCH = 68;
export const CC_HOLD_2 = 69;
export const CC_SOUND_CONTROLLER_1 = 70; // Sound Variation
export const CC_SOUND_CONTROLLER_2 = 71; // Timbre/Harmonic Intensity
export const CC_SOUND_CONTROLLER_3 = 72; // Release Time
export const CC_SOUND_CONTROLLER_4 = 73; // Attack Time
export const CC_SOUND_CONTROLLER_5 = 74; // Brightness
export const CC_SOUND_CONTROLLER_6 = 75; // Decay Time
export const CC_SOUND_CONTROLLER_7 = 76; // Vibrato Rate
export const CC_SOUND_CONTROLLER_8 = 77; // Vibrato Depth
export const CC_SOUND_CONTROLLER_9 = 78; // Vibrato Delay
export const CC_SOUND_CONTROLLER_10 = 79;
export const CC_GENERAL_PURPOSE_5 = 80;
export const CC_GENERAL_PURPOSE_6 = 81;
export const CC_GENERAL_PURPOSE_7 = 82;
export const CC_GENERAL_PURPOSE_8 = 83;
export const CC_PORTAMENTO_CONTROL = 84;
export const CC_EFFECTS_1_DEPTH = 91; // Reverb Send
export const CC_EFFECTS_2_DEPTH = 92; // Tremolo Depth
export const CC_EFFECTS_3_DEPTH = 93; // Chorus Send
export const CC_EFFECTS_4_DEPTH = 94; // Celeste Depth
export const CC_EFFECTS_5_DEPTH = 95; // Phaser Depth
export const CC_DATA_INCREMENT = 96;
export const CC_DATA_DECREMENT = 97;
export const CC_NRPN_LSB = 98;
export const CC_NRPN_MSB = 99;
export const CC_RPN_LSB = 100;
export const CC_RPN_MSB = 101;
export const CC_ALL_SOUND_OFF = 120;
export const CC_RESET_ALL_CONTROLLERS = 121;
export const CC_LOCAL_CONTROL = 122;
export const CC_ALL_NOTES_OFF = 123;

/**
 * System message status bytes
 */
export const SYSEX_START = 0xF0;
export const SYSEX_END = 0xF7;
export const MTC_QUARTER_FRAME = 0xF1;
export const SONG_POSITION_POINTER = 0xF2;
export const SONG_SELECT = 0xF3;
export const TUNE_REQUEST = 0xF6;
export const CLOCK_TICK = 0xF8;
export const CLOCK_START = 0xFA;
export const CLOCK_CONTINUE = 0xFB;
export const CLOCK_STOP = 0xFC;
export const ACTIVE_SENSING = 0xFE;
export const SYSTEM_RESET = 0xFF;

/**
 * CC number to name mapping
 */
export const CC_NAMES: ReadonlyMap<number, string> = new Map([
  [CC_BANK_SELECT_MSB, 'Bank Select'],
  [CC_MOD_WHEEL, 'Modulation Wheel'],
  [CC_BREATH_CONTROLLER, 'Breath Controller'],
  [CC_FOOT_CONTROLLER, 'Foot Controller'],
  [CC_PORTAMENTO_TIME, 'Portamento Time'],
  [CC_DATA_ENTRY_MSB, 'Data Entry'],
  [CC_CHANNEL_VOLUME, 'Volume'],
  [CC_BALANCE, 'Balance'],
  [CC_PAN, 'Pan'],
  [CC_EXPRESSION, 'Expression'],
  [CC_EFFECT_CONTROL_1, 'Effect Control 1'],
  [CC_EFFECT_CONTROL_2, 'Effect Control 2'],
  [CC_SUSTAIN_PEDAL, 'Sustain Pedal'],
  [CC_PORTAMENTO, 'Portamento'],
  [CC_SOSTENUTO, 'Sostenuto'],
  [CC_SOFT_PEDAL, 'Soft Pedal'],
  [CC_EFFECTS_1_DEPTH, 'Reverb Send'],
  [CC_EFFECTS_3_DEPTH, 'Chorus Send'],
  [CC_ALL_SOUND_OFF, 'All Sound Off'],
  [CC_RESET_ALL_CONTROLLERS, 'Reset All Controllers'],
  [CC_ALL_NOTES_OFF, 'All Notes Off'],
]);

// ============================================================================
// VELOCITY SENSITIVITY
// ============================================================================

/**
 * Default velocity configuration
 */
export const DEFAULT_VELOCITY_CONFIG: VelocityConfig = {
  curve: 'linear',
  fixedValue: 100,
  minVelocity: 1,
  maxVelocity: 127,
};

/**
 * Apply velocity sensitivity curve to input velocity
 */
export function applyVelocityCurve(
  inputVelocity: number,
  config: VelocityConfig
): number {
  if (inputVelocity === 0) {
    return 0; // Always preserve note off
  }

  // Normalize to 0-1
  let normalized = inputVelocity / 127;

  // Apply curve
  switch (config.curve) {
    case 'linear':
      // No change
      break;

    case 'soft':
      // Softer response (square root)
      normalized = Math.sqrt(normalized);
      break;

    case 'medium':
      // Medium response (slight curve)
      normalized = Math.pow(normalized, 0.75);
      break;

    case 'hard':
      // Harder response (square)
      normalized = normalized * normalized;
      break;

    case 'fixed':
      return config.fixedValue;
  }

  // Scale to output range
  const { minVelocity, maxVelocity } = config;
  const scaled = minVelocity + normalized * (maxVelocity - minVelocity);

  // Clamp and round
  return Math.max(1, Math.min(127, Math.round(scaled)));
}

// ============================================================================
// MESSAGE PARSING
// ============================================================================

/**
 * Parse a note on/off message into a NoteEvent
 */
export function parseNoteMessage(
  message: MIDIMessage,
  device: MIDIDeviceInfo,
  velocityConfig: VelocityConfig = DEFAULT_VELOCITY_CONFIG
): NoteEvent {
  const isNoteOn = message.type === 'noteon' && message.data2 > 0;
  const rawVelocity = isNoteOn ? message.data2 : 0;
  const velocity = applyVelocityCurve(rawVelocity, velocityConfig);

  return {
    note: message.data1,
    velocity,
    channel: message.channel,
    timestamp: message.timestamp,
    device,
    isNoteOn,
  };
}

/**
 * Parse an aftertouch message into an AftertouchEvent
 */
export function parseAftertouchMessage(
  message: MIDIMessage,
  device: MIDIDeviceInfo
): AftertouchEvent {
  const isPolyphonic = message.type === 'polyaftertouch';

  return {
    note: isPolyphonic ? message.data1 : -1,
    pressure: isPolyphonic ? message.data2 : message.data1,
    channel: message.channel,
    timestamp: message.timestamp,
    device,
    isPolyphonic,
  };
}

/**
 * Parse a pitch bend message into a PitchBendEvent
 */
export function parsePitchBendMessage(
  message: MIDIMessage,
  device: MIDIDeviceInfo
): PitchBendEvent {
  // Pitch bend is a 14-bit value split across data1 (LSB) and data2 (MSB)
  const value14bit = message.data1 | (message.data2 << 7);

  // Convert to signed range: -8192 to +8191 (center = 8192)
  const value = value14bit - 8192;

  // Normalize to -1.0 to +1.0
  const normalized = value / 8192;

  return {
    value,
    normalized,
    channel: message.channel,
    timestamp: message.timestamp,
    device,
  };
}

/**
 * Parse a control change message into a ControlChangeEvent
 */
export function parseControlChangeMessage(
  message: MIDIMessage,
  device: MIDIDeviceInfo
): ControlChangeEvent {
  const controller = message.data1;
  const value = message.data2;
  const normalized = value / 127;
  const name = CC_NAMES.get(controller);

  return {
    controller,
    value,
    normalized,
    channel: message.channel,
    timestamp: message.timestamp,
    device,
    ...(name !== undefined && { name }),
  };
}

/**
 * Parse a program change message into a ProgramChangeEvent
 */
export function parseProgramChangeMessage(
  message: MIDIMessage,
  device: MIDIDeviceInfo,
  bankMSB?: number,
  bankLSB?: number
): ProgramChangeEvent {
  return {
    program: message.data1,
    channel: message.channel,
    timestamp: message.timestamp,
    device,
    ...(bankMSB !== undefined && { bankMSB }),
    ...(bankLSB !== undefined && { bankLSB }),
  };
}

/**
 * Parse a sysex message into a SysexEvent
 */
export function parseSysexMessage(
  message: MIDIMessage,
  device: MIDIDeviceInfo
): SysexEvent {
  const raw = message.raw;
  
  // Sysex format: F0 [manufacturer ID] [data...] F7
  // Manufacturer ID can be 1 byte (00-7F) or 3 bytes (00 xx xx)
  let manufacturerId: number[];
  let dataStart: number;
  
  if (raw.length >= 4 && raw[1] === 0x00) {
    // 3-byte manufacturer ID
    manufacturerId = [raw[1]!, raw[2]!, raw[3]!];
    dataStart = 4;
  } else if (raw.length >= 2) {
    // 1-byte manufacturer ID
    manufacturerId = [raw[1]!];
    dataStart = 2;
  } else {
    // Invalid sysex, use empty manufacturer ID
    manufacturerId = [];
    dataStart = 1;
  }
  
  // Extract data (excluding F0, manufacturer ID, and F7)
  const dataEnd = raw[raw.length - 1] === SYSEX_END ? raw.length - 1 : raw.length;
  const data = raw.slice(dataStart, dataEnd);
  
  return {
    manufacturerId,
    data,
    timestamp: message.timestamp,
    device,
  };
}

/**
 * Parse a MIDI Time Code quarter frame message
 */
export function parseMTCMessage(
  message: MIDIMessage,
  device: MIDIDeviceInfo
): MTCEvent {
  const data = message.data1;
  const messageType = (data >> 4) & 0x07;
  const value = data & 0x0F;
  
  return {
    messageType,
    value,
    timestamp: message.timestamp,
    device,
  };
}

/**
 * Parse a song position pointer message
 */
export function parseSongPositionMessage(
  message: MIDIMessage,
  device: MIDIDeviceInfo
): SongPositionEvent {
  // Song position is a 14-bit value split across data1 (LSB) and data2 (MSB)
  const position = message.data1 | (message.data2 << 7);
  
  return {
    position,
    timestamp: message.timestamp,
    device,
  };
}

/**
 * Parse a clock message (clock/start/stop/continue)
 */
export function parseClockMessage(
  message: MIDIMessage,
  device: MIDIDeviceInfo
): ClockEvent {
  let type: ClockEvent['type'];
  
  switch (message.type) {
    case 'clock':
      type = 'clock';
      break;
    case 'start':
      type = 'start';
      break;
    case 'stop':
      type = 'stop';
      break;
    case 'continue':
      type = 'continue';
      break;
    default:
      type = 'clock';
  }
  
  return {
    type,
    timestamp: message.timestamp,
    device,
  };
}

/**
 * Parse an active sensing message
 */
export function parseActiveSensingMessage(
  message: MIDIMessage,
  device: MIDIDeviceInfo
): ActiveSensingEvent {
  return {
    timestamp: message.timestamp,
    device,
  };
}

// ============================================================================
// MAIN INPUT HANDLER
// ============================================================================

/**
 * NRPN/RPN state per channel
 */
interface NRPNRPNState {
  /** Parameter number MSB */
  paramMSB: number;
  /** Parameter number LSB */
  paramLSB: number;
  /** Value MSB */
  valueMSB: number;
  /** Value LSB */
  valueLSB: number;
  /** Whether this is NRPN (vs RPN) */
  isNRPN: boolean;
}

/**
 * Bank select state per channel
 */
interface BankSelectState {
  /** Bank MSB (CC 0) */
  bankMSB?: number;
  /** Bank LSB (CC 32) */
  bankLSB?: number;
}

/**
 * MIDI input handler class
 */
export class MIDIInputHandler {
  private callbacks: MIDIInputCallbacks;
  private mappings: readonly MIDIParameterMapping[];
  private velocityConfig: VelocityConfig;
  
  // State tracking for multi-message protocols
  private nrpnrpnState: Map<number, NRPNRPNState> = new Map();
  private bankSelectState: Map<number, BankSelectState> = new Map();

  constructor(
    callbacks: MIDIInputCallbacks = {},
    mappings: readonly MIDIParameterMapping[] = [],
    velocityConfig: VelocityConfig = DEFAULT_VELOCITY_CONFIG
  ) {
    this.callbacks = callbacks;
    this.mappings = mappings;
    this.velocityConfig = velocityConfig;
  }

  /**
   * Update callbacks
   */
  setCallbacks(callbacks: MIDIInputCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Update mappings
   */
  setMappings(mappings: readonly MIDIParameterMapping[]): void {
    this.mappings = mappings;
  }

  /**
   * Update velocity configuration
   */
  setVelocityConfig(config: VelocityConfig): void {
    this.velocityConfig = config;
  }

  /**
   * Handle a MIDI message
   */
  handleMessage(message: MIDIMessage, device: MIDIDeviceInfo): void {
    // Route to specific handlers based on message type
    switch (message.type) {
      case 'noteon':
      case 'noteoff':
        this.handleNoteMessage(message, device);
        break;

      case 'polyaftertouch':
      case 'channelaftertouch':
        this.handleAftertouchMessage(message, device);
        break;

      case 'pitchbend':
        this.handlePitchBendMessage(message, device);
        break;

      case 'controlchange':
        this.handleControlChangeMessage(message, device);
        break;

      case 'programchange':
        this.handleProgramChangeMessage(message, device);
        break;

      case 'sysex':
        this.handleSysexMessage(message, device);
        break;

      case 'timecode':
        this.handleMTCMessage(message, device);
        break;

      case 'clock':
      case 'start':
      case 'stop':
      case 'continue':
        this.handleClockMessage(message, device);
        break;

      case 'songposition':
        this.handleSongPositionMessage(message, device);
        break;

      case 'activesensing':
        this.handleActiveSensingMessage(message, device);
        break;

      default:
        break;
    }

    // Check for parameter mappings
    this.handleParameterMappings(message, device);
  }

  /**
   * Handle note on/off messages
   */
  private handleNoteMessage(message: MIDIMessage, device: MIDIDeviceInfo): void {
    if (!this.callbacks.onNote) {
      return;
    }

    const event = parseNoteMessage(message, device, this.velocityConfig);
    this.callbacks.onNote(event);
  }

  /**
   * Handle aftertouch messages
   */
  private handleAftertouchMessage(message: MIDIMessage, device: MIDIDeviceInfo): void {
    if (!this.callbacks.onAftertouch) {
      return;
    }

    const event = parseAftertouchMessage(message, device);
    this.callbacks.onAftertouch(event);
  }

  /**
   * Handle pitch bend messages
   */
  private handlePitchBendMessage(message: MIDIMessage, device: MIDIDeviceInfo): void {
    if (!this.callbacks.onPitchBend) {
      return;
    }

    const event = parsePitchBendMessage(message, device);
    this.callbacks.onPitchBend(event);
  }

  /**
   * Handle control change messages
   */
  private handleControlChangeMessage(message: MIDIMessage, device: MIDIDeviceInfo): void {
    const channel = message.channel;
    const controller = message.data1;
    const value = message.data2;
    
    // Handle bank select (CC 0 and CC 32)
    if (controller === CC_BANK_SELECT_MSB) {
      const state = this.bankSelectState.get(channel) || {};
      state.bankMSB = value;
      this.bankSelectState.set(channel, state);
    } else if (controller === CC_BANK_SELECT_LSB) {
      const state = this.bankSelectState.get(channel) || {};
      state.bankLSB = value;
      this.bankSelectState.set(channel, state);
    }
    
    // Handle NRPN/RPN (CC 98-101, CC 6, CC 38)
    if (controller === CC_NRPN_LSB || controller === CC_NRPN_MSB) {
      const state = this.nrpnrpnState.get(channel) || {
        paramMSB: 0,
        paramLSB: 0,
        valueMSB: 0,
        valueLSB: 0,
        isNRPN: true,
      };
      state.isNRPN = true;
      
      if (controller === CC_NRPN_MSB) {
        state.paramMSB = value;
      } else {
        state.paramLSB = value;
      }
      
      this.nrpnrpnState.set(channel, state);
    } else if (controller === CC_RPN_LSB || controller === CC_RPN_MSB) {
      const state = this.nrpnrpnState.get(channel) || {
        paramMSB: 0,
        paramLSB: 0,
        valueMSB: 0,
        valueLSB: 0,
        isNRPN: false,
      };
      state.isNRPN = false;
      
      if (controller === CC_RPN_MSB) {
        state.paramMSB = value;
      } else {
        state.paramLSB = value;
      }
      
      this.nrpnrpnState.set(channel, state);
    } else if (controller === CC_DATA_ENTRY_MSB) {
      // Data entry for NRPN/RPN
      const state = this.nrpnrpnState.get(channel);
      if (state) {
        state.valueMSB = value;
        this.nrpnrpnState.set(channel, state);
        
        // Fire NRPN/RPN event
        if (this.callbacks.onNRPNRPN) {
          const parameter = (state.paramMSB << 7) | state.paramLSB;
          const paramValue = (state.valueMSB << 7) | state.valueLSB;
          
          const event: NRPNRPNEvent = {
            isNRPN: state.isNRPN,
            parameter,
            value: paramValue,
            channel,
            timestamp: message.timestamp,
            device,
          };
          
          this.callbacks.onNRPNRPN(event);
        }
      }
    } else if (controller === CC_DATA_ENTRY_MSB + 32) { // CC 38 (Data Entry LSB)
      // Data entry LSB for NRPN/RPN
      const state = this.nrpnrpnState.get(channel);
      if (state) {
        state.valueLSB = value;
        this.nrpnrpnState.set(channel, state);
      }
    }
    
    // Handle special CC messages (All Notes Off, etc.)
    if (controller === CC_ALL_NOTES_OFF || controller === CC_ALL_SOUND_OFF) {
      // Fire control change event for these
      if (this.callbacks.onControlChange) {
        const event = parseControlChangeMessage(message, device);
        this.callbacks.onControlChange(event);
      }
    } else if (this.callbacks.onControlChange) {
      // Fire control change event for all other CCs
      const event = parseControlChangeMessage(message, device);
      this.callbacks.onControlChange(event);
    }
  }

  /**
   * Handle program change messages
   */
  private handleProgramChangeMessage(message: MIDIMessage, device: MIDIDeviceInfo): void {
    if (!this.callbacks.onProgramChange) {
      return;
    }

    const channel = message.channel;
    const bankState = this.bankSelectState.get(channel);
    
    const event = parseProgramChangeMessage(
      message,
      device,
      bankState?.bankMSB,
      bankState?.bankLSB
    );
    
    this.callbacks.onProgramChange(event);
    
    // Clear bank select state after program change
    this.bankSelectState.delete(channel);
  }

  /**
   * Handle sysex messages
   */
  private handleSysexMessage(message: MIDIMessage, device: MIDIDeviceInfo): void {
    if (!this.callbacks.onSysex) {
      return;
    }

    const event = parseSysexMessage(message, device);
    this.callbacks.onSysex(event);
  }

  /**
   * Handle MIDI Time Code messages
   */
  private handleMTCMessage(message: MIDIMessage, device: MIDIDeviceInfo): void {
    if (!this.callbacks.onMTC) {
      return;
    }

    const event = parseMTCMessage(message, device);
    this.callbacks.onMTC(event);
  }

  /**
   * Handle MIDI clock messages (clock/start/stop/continue)
   */
  private handleClockMessage(message: MIDIMessage, device: MIDIDeviceInfo): void {
    if (!this.callbacks.onClock) {
      return;
    }

    const event = parseClockMessage(message, device);
    this.callbacks.onClock(event);
  }

  /**
   * Handle song position pointer messages
   */
  private handleSongPositionMessage(message: MIDIMessage, device: MIDIDeviceInfo): void {
    if (!this.callbacks.onSongPosition) {
      return;
    }

    const event = parseSongPositionMessage(message, device);
    this.callbacks.onSongPosition(event);
  }

  /**
   * Handle active sensing messages
   */
  private handleActiveSensingMessage(message: MIDIMessage, device: MIDIDeviceInfo): void {
    if (!this.callbacks.onActiveSensing) {
      return;
    }

    const event = parseActiveSensingMessage(message, device);
    this.callbacks.onActiveSensing(event);
  }

  /**
   * Handle parameter mappings
   */
  private handleParameterMappings(message: MIDIMessage, device: MIDIDeviceInfo): void {
    if (!this.callbacks.onParameterUpdate) {
      return;
    }

    const matchingMappings = findMatchingMappings(
      message,
      this.mappings,
      device.id
    );

    for (const mapping of matchingMappings) {
      // Get MIDI value (data2 for CC, data2 for notes)
      const midiValue = mapping.isNote ? message.data2 : message.data2;

      // Map to parameter value
      const value = mapMIDIToParameter(midiValue, mapping);

      // Create update
      const update: ParameterUpdate = {
        parameterId: mapping.parameterId,
        parameterName: mapping.parameterName,
        value,
        mapping,
        midiMessage: message,
        device,
      };

      this.callbacks.onParameterUpdate(update);
    }
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create a MIDI input handler with callbacks
 */
export function createMIDIInputHandler(
  callbacks: MIDIInputCallbacks,
  mappings: readonly MIDIParameterMapping[] = [],
  velocityConfig: VelocityConfig = DEFAULT_VELOCITY_CONFIG
): MIDIInputHandler {
  return new MIDIInputHandler(callbacks, mappings, velocityConfig);
}

/**
 * Check if a message is a mod wheel message
 */
export function isModWheelMessage(message: MIDIMessage): boolean {
  return message.type === 'controlchange' && message.data1 === CC_MOD_WHEEL;
}

/**
 * Check if a message is a sustain pedal message
 */
export function isSustainPedalMessage(message: MIDIMessage): boolean {
  return message.type === 'controlchange' && message.data1 === CC_SUSTAIN_PEDAL;
}

/**
 * Check if sustain is pressed (value >= 64)
 */
export function isSustainPressed(value: number): boolean {
  return value >= 64;
}

/**
 * Check if a message is a bank select message
 */
export function isBankSelectMessage(message: MIDIMessage): boolean {
  return (
    message.type === 'controlchange' &&
    (message.data1 === CC_BANK_SELECT_MSB || message.data1 === CC_BANK_SELECT_LSB)
  );
}

/**
 * Check if a message is an NRPN message
 */
export function isNRPNMessage(message: MIDIMessage): boolean {
  return (
    message.type === 'controlchange' &&
    (message.data1 === CC_NRPN_LSB || message.data1 === CC_NRPN_MSB)
  );
}

/**
 * Check if a message is an RPN message
 */
export function isRPNMessage(message: MIDIMessage): boolean {
  return (
    message.type === 'controlchange' &&
    (message.data1 === CC_RPN_LSB || message.data1 === CC_RPN_MSB)
  );
}

/**
 * Check if a message is an All Notes Off message
 */
export function isAllNotesOffMessage(message: MIDIMessage): boolean {
  return message.type === 'controlchange' && message.data1 === CC_ALL_NOTES_OFF;
}

/**
 * Check if a message is an All Sound Off message
 */
export function isAllSoundOffMessage(message: MIDIMessage): boolean {
  return message.type === 'controlchange' && message.data1 === CC_ALL_SOUND_OFF;
}

/**
 * Check if a message is a panic message (All Notes Off or All Sound Off)
 */
export function isPanicMessage(message: MIDIMessage): boolean {
  return isAllNotesOffMessage(message) || isAllSoundOffMessage(message);
}

/**
 * Check if a message is a clock message
 */
export function isClockMessage(message: MIDIMessage): boolean {
  return message.type === 'clock';
}

/**
 * Check if a message is a clock control message (start/stop/continue)
 */
export function isClockControlMessage(message: MIDIMessage): boolean {
  return (
    message.type === 'start' || message.type === 'stop' || message.type === 'continue'
  );
}

// Types are already exported via export declarations above
