/**
 * @fileoverview Web MIDI API Integration
 * 
 * Provides low-latency MIDI input/output support via Web MIDI API with:
 * - MIDI device detection and enumeration
 * - Permission request UI helpers
 * - Device connect/disconnect listeners
 * - Device naming and aliasing
 * - Device persistence across sessions
 * - MIDI message parsing and routing
 * - Latency calibration
 * - Clock source selection
 * - MIDI thru functionality
 * 
 * @module @cardplay/core/audio/web-midi
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * MIDI device type
 */
export type MIDIDeviceType = 'input' | 'output';

/**
 * MIDI device state
 */
export type MIDIDeviceState = 'connected' | 'disconnected';

/**
 * MIDI device connection
 */
export type MIDIDeviceConnection = 'open' | 'closed' | 'pending';

/**
 * MIDI message type
 */
export type MIDIMessageType =
  | 'noteoff'
  | 'noteon'
  | 'polyaftertouch'
  | 'controlchange'
  | 'programchange'
  | 'channelaftertouch'
  | 'pitchbend'
  | 'sysex'
  | 'timecode'
  | 'songposition'
  | 'songselect'
  | 'tunerequest'
  | 'clock'
  | 'start'
  | 'continue'
  | 'stop'
  | 'activesensing'
  | 'reset';

/**
 * Parsed MIDI message
 */
export interface MIDIMessage {
  /** Message type */
  readonly type: MIDIMessageType;
  /** MIDI channel (0-15) */
  readonly channel: number;
  /** First data byte (note number, CC number, etc.) */
  readonly data1: number;
  /** Second data byte (velocity, CC value, etc.) */
  readonly data2: number;
  /** Raw message data */
  readonly raw: Uint8Array;
  /** Timestamp in high-resolution time */
  readonly timestamp: number;
}

/**
 * MIDI device info with extensions
 */
export interface MIDIDeviceInfo {
  /** Device ID (from Web MIDI API) */
  readonly id: string;
  /** Device name */
  readonly name: string;
  /** Device manufacturer */
  readonly manufacturer: string;
  /** Device type */
  readonly type: MIDIDeviceType;
  /** Device state */
  readonly state: MIDIDeviceState;
  /** Device connection */
  readonly connection: MIDIDeviceConnection;
  /** User-assigned alias (optional) */
  readonly alias?: string;
  /** Whether device is enabled */
  readonly enabled: boolean;
  /** Latency in milliseconds (calibrated) */
  readonly latency: number;
}

/**
 * MIDI system configuration
 */
export interface MIDISystemConfig {
  /** Whether MIDI is supported */
  readonly supported: boolean;
  /** Whether MIDI access has been granted */
  readonly granted: boolean;
  /** Available input devices */
  readonly inputs: readonly MIDIDeviceInfo[];
  /** Available output devices */
  readonly outputs: readonly MIDIDeviceInfo[];
  /** Selected clock source device ID */
  readonly clockSource: string | null;
  /** Whether MIDI thru is enabled */
  readonly thruEnabled: boolean;
  /** MIDI thru routing (input ID → output ID) */
  readonly thruRouting: ReadonlyMap<string, string>;
}

/**
 * MIDI message handler callback
 */
export type MIDIMessageHandler = (message: MIDIMessage, device: MIDIDeviceInfo) => void;

/**
 * MIDI device change handler callback
 */
export type MIDIDeviceChangeHandler = (devices: readonly MIDIDeviceInfo[], type: MIDIDeviceType) => void;

// ============================================================================
// WEB MIDI API DETECTION
// ============================================================================

/**
 * Check if Web MIDI API is supported in this browser.
 */
export function isWebMIDISupported(): boolean {
  return typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
}

/**
 * Request MIDI access from browser.
 * 
 * This will trigger a permission prompt if not already granted.
 * 
 * @param sysex - Whether to request sysex access (default: false)
 * @returns Promise resolving to MIDIAccess or null if denied/unsupported
 */
export async function requestMIDIAccess(sysex: boolean = false): Promise<MIDIAccess | null> {
  if (!isWebMIDISupported()) {
    return null;
  }

  try {
    return await navigator.requestMIDIAccess({ sysex });
  } catch (error) {
    console.error('MIDI access request failed:', error);
    return null;
  }
}

// ============================================================================
// DEVICE ENUMERATION
// ============================================================================

/**
 * Convert Web MIDI API MIDIInput to device info
 */
function inputToDeviceInfo(
  input: MIDIInput,
  aliases: ReadonlyMap<string, string>,
  enabledDevices: ReadonlySet<string>,
  latencies: ReadonlyMap<string, number>
): MIDIDeviceInfo {
  const alias = aliases.get(input.id);
  return {
    id: input.id,
    name: input.name ?? 'Unknown Input',
    manufacturer: input.manufacturer ?? 'Unknown',
    type: 'input',
    state: input.state,
    connection: input.connection,
    ...(alias !== undefined && { alias }),
    enabled: enabledDevices.has(input.id),
    latency: latencies.get(input.id) ?? 0,
  };
}

/**
 * Convert Web MIDI API MIDIOutput to device info
 */
function outputToDeviceInfo(
  output: MIDIOutput,
  aliases: ReadonlyMap<string, string>,
  enabledDevices: ReadonlySet<string>,
  latencies: ReadonlyMap<string, number>
): MIDIDeviceInfo {
  const alias = aliases.get(output.id);
  return {
    id: output.id,
    name: output.name ?? 'Unknown Output',
    manufacturer: output.manufacturer ?? 'Unknown',
    type: 'output',
    state: output.state,
    connection: output.connection,
    ...(alias !== undefined && { alias }),
    enabled: enabledDevices.has(output.id),
    latency: latencies.get(output.id) ?? 0,
  };
}

/**
 * Enumerate all MIDI input devices
 */
export function enumerateInputs(
  midiAccess: MIDIAccess,
  aliases: ReadonlyMap<string, string> = new Map(),
  enabledDevices: ReadonlySet<string> = new Set(),
  latencies: ReadonlyMap<string, number> = new Map()
): readonly MIDIDeviceInfo[] {
  const devices: MIDIDeviceInfo[] = [];

  for (const input of midiAccess.inputs.values()) {
    devices.push(inputToDeviceInfo(input, aliases, enabledDevices, latencies));
  }

  return devices;
}

/**
 * Enumerate all MIDI output devices
 */
export function enumerateOutputs(
  midiAccess: MIDIAccess,
  aliases: ReadonlyMap<string, string> = new Map(),
  enabledDevices: ReadonlySet<string> = new Set(),
  latencies: ReadonlyMap<string, number> = new Map()
): readonly MIDIDeviceInfo[] {
  const devices: MIDIDeviceInfo[] = [];

  for (const output of midiAccess.outputs.values()) {
    devices.push(outputToDeviceInfo(output, aliases, enabledDevices, latencies));
  }

  return devices;
}

/**
 * Enumerate all MIDI devices (inputs and outputs)
 */
export function enumerateAllDevices(
  midiAccess: MIDIAccess,
  aliases: ReadonlyMap<string, string> = new Map(),
  enabledDevices: ReadonlySet<string> = new Set(),
  latencies: ReadonlyMap<string, number> = new Map()
): { inputs: readonly MIDIDeviceInfo[]; outputs: readonly MIDIDeviceInfo[] } {
  return {
    inputs: enumerateInputs(midiAccess, aliases, enabledDevices, latencies),
    outputs: enumerateOutputs(midiAccess, aliases, enabledDevices, latencies),
  };
}

// ============================================================================
// DEVICE MANAGEMENT
// ============================================================================

/**
 * Get MIDI input device by ID
 */
export function getInputDevice(
  midiAccess: MIDIAccess,
  deviceId: string
): MIDIInput | null {
  return midiAccess.inputs.get(deviceId) ?? null;
}

/**
 * Get MIDI output device by ID
 */
export function getOutputDevice(
  midiAccess: MIDIAccess,
  deviceId: string
): MIDIOutput | null {
  return midiAccess.outputs.get(deviceId) ?? null;
}

/**
 * Open a MIDI input device for receiving messages
 */
export async function openInputDevice(
  midiAccess: MIDIAccess,
  deviceId: string
): Promise<MIDIInput | null> {
  const input = getInputDevice(midiAccess, deviceId);
  if (!input) {
    return null;
  }

  try {
    await input.open();
    return input;
  } catch (error) {
    console.error('Failed to open MIDI input:', error);
    return null;
  }
}

/**
 * Open a MIDI output device for sending messages
 */
export async function openOutputDevice(
  midiAccess: MIDIAccess,
  deviceId: string
): Promise<MIDIOutput | null> {
  const output = getOutputDevice(midiAccess, deviceId);
  if (!output) {
    return null;
  }

  try {
    await output.open();
    return output;
  } catch (error) {
    console.error('Failed to open MIDI output:', error);
    return null;
  }
}

/**
 * Close a MIDI input device
 */
export async function closeInputDevice(
  midiAccess: MIDIAccess,
  deviceId: string
): Promise<void> {
  const input = getInputDevice(midiAccess, deviceId);
  if (input) {
    await input.close();
  }
}

/**
 * Close a MIDI output device
 */
export async function closeOutputDevice(
  midiAccess: MIDIAccess,
  deviceId: string
): Promise<void> {
  const output = getOutputDevice(midiAccess, deviceId);
  if (output) {
    await output.close();
  }
}

// ============================================================================
// MIDI MESSAGE PARSING
// ============================================================================

/**
 * Parse MIDI message status byte to get type and channel
 */
export function parseMIDIStatus(status: number): { type: MIDIMessageType; channel: number } {
  const messageType = status & 0xf0;
  const channel = status & 0x0f;

  let type: MIDIMessageType;

  switch (messageType) {
    case 0x80:
      type = 'noteoff';
      break;
    case 0x90:
      type = 'noteon';
      break;
    case 0xa0:
      type = 'polyaftertouch';
      break;
    case 0xb0:
      type = 'controlchange';
      break;
    case 0xc0:
      type = 'programchange';
      break;
    case 0xd0:
      type = 'channelaftertouch';
      break;
    case 0xe0:
      type = 'pitchbend';
      break;
    case 0xf0:
      // System messages
      switch (status) {
        case 0xf0:
          type = 'sysex';
          break;
        case 0xf1:
          type = 'timecode';
          break;
        case 0xf2:
          type = 'songposition';
          break;
        case 0xf3:
          type = 'songselect';
          break;
        case 0xf6:
          type = 'tunerequest';
          break;
        case 0xf8:
          type = 'clock';
          break;
        case 0xfa:
          type = 'start';
          break;
        case 0xfb:
          type = 'continue';
          break;
        case 0xfc:
          type = 'stop';
          break;
        case 0xfe:
          type = 'activesensing';
          break;
        case 0xff:
          type = 'reset';
          break;
        default:
          type = 'sysex';
      }
      break;
    default:
      type = 'sysex';
  }

  return { type, channel };
}

/**
 * Parse MIDI message from Web MIDI API event
 */
export function parseMIDIMessage(event: MIDIMessageEvent): MIDIMessage {
  const data = event.data;
  if (!data || data.length === 0) {
    throw new Error('Invalid MIDI message: empty data');
  }
  const status = data[0];
  if (status === undefined) {
    throw new Error('Invalid MIDI message: missing status byte');
  }
  const { type, channel } = parseMIDIStatus(status);

  return {
    type,
    channel,
    data1: data[1] ?? 0,
    data2: data[2] ?? 0,
    raw: data,
    timestamp: event.timeStamp,
  };
}

// ============================================================================
// DEVICE PERSISTENCE
// ============================================================================

/**
 * Storage key for device aliases
 */
const DEVICE_ALIASES_KEY = 'cardplay_midi_device_aliases';

/**
 * Storage key for enabled devices
 */
const ENABLED_DEVICES_KEY = 'cardplay_midi_enabled_devices';

/**
 * Storage key for device latencies
 */
const DEVICE_LATENCIES_KEY = 'cardplay_midi_device_latencies';

/**
 * Storage key for clock source
 */
const CLOCK_SOURCE_KEY = 'cardplay_midi_clock_source';

/**
 * Storage key for MIDI thru enabled
 */
const THRU_ENABLED_KEY = 'cardplay_midi_thru_enabled';

/**
 * Storage key for MIDI thru routing
 */
const THRU_ROUTING_KEY = 'cardplay_midi_thru_routing';

/**
 * Load device aliases from storage
 */
export function loadDeviceAliases(): ReadonlyMap<string, string> {
  try {
    const stored = localStorage.getItem(DEVICE_ALIASES_KEY);
    if (stored) {
      const data = JSON.parse(stored) as Record<string, string>;
      return new Map(Object.entries(data));
    }
  } catch (error) {
    console.error('Failed to load device aliases:', error);
  }
  return new Map();
}

/**
 * Save device aliases to storage
 */
export function saveDeviceAliases(aliases: ReadonlyMap<string, string>): void {
  try {
    const data = Object.fromEntries(aliases);
    localStorage.setItem(DEVICE_ALIASES_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save device aliases:', error);
  }
}

/**
 * Set device alias
 */
export function setDeviceAlias(
  aliases: ReadonlyMap<string, string>,
  deviceId: string,
  alias: string
): ReadonlyMap<string, string> {
  const newAliases = new Map(aliases);
  if (alias.trim()) {
    newAliases.set(deviceId, alias);
  } else {
    newAliases.delete(deviceId);
  }
  saveDeviceAliases(newAliases);
  return newAliases;
}

/**
 * Load enabled devices from storage
 */
export function loadEnabledDevices(): ReadonlySet<string> {
  try {
    const stored = localStorage.getItem(ENABLED_DEVICES_KEY);
    if (stored) {
      const data = JSON.parse(stored) as string[];
      return new Set(data);
    }
  } catch (error) {
    console.error('Failed to load enabled devices:', error);
  }
  return new Set();
}

/**
 * Save enabled devices to storage
 */
export function saveEnabledDevices(enabled: ReadonlySet<string>): void {
  try {
    const data = Array.from(enabled);
    localStorage.setItem(ENABLED_DEVICES_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save enabled devices:', error);
  }
}

/**
 * Toggle device enabled state
 */
export function toggleDeviceEnabled(
  enabled: ReadonlySet<string>,
  deviceId: string
): ReadonlySet<string> {
  const newEnabled = new Set(enabled);
  if (newEnabled.has(deviceId)) {
    newEnabled.delete(deviceId);
  } else {
    newEnabled.add(deviceId);
  }
  saveEnabledDevices(newEnabled);
  return newEnabled;
}

/**
 * Load device latencies from storage
 */
export function loadDeviceLatencies(): ReadonlyMap<string, number> {
  try {
    const stored = localStorage.getItem(DEVICE_LATENCIES_KEY);
    if (stored) {
      const data = JSON.parse(stored) as Record<string, number>;
      return new Map(Object.entries(data));
    }
  } catch (error) {
    console.error('Failed to load device latencies:', error);
  }
  return new Map();
}

/**
 * Save device latencies to storage
 */
export function saveDeviceLatencies(latencies: ReadonlyMap<string, number>): void {
  try {
    const data = Object.fromEntries(latencies);
    localStorage.setItem(DEVICE_LATENCIES_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save device latencies:', error);
  }
}

/**
 * Set device latency
 */
export function setDeviceLatency(
  latencies: ReadonlyMap<string, number>,
  deviceId: string,
  latency: number
): ReadonlyMap<string, number> {
  const newLatencies = new Map(latencies);
  newLatencies.set(deviceId, latency);
  saveDeviceLatencies(newLatencies);
  return newLatencies;
}

/**
 * Load clock source from storage
 */
export function loadClockSource(): string | null {
  try {
    return localStorage.getItem(CLOCK_SOURCE_KEY);
  } catch (error) {
    console.error('Failed to load clock source:', error);
    return null;
  }
}

/**
 * Save clock source to storage
 */
export function saveClockSource(deviceId: string | null): void {
  try {
    if (deviceId) {
      localStorage.setItem(CLOCK_SOURCE_KEY, deviceId);
    } else {
      localStorage.removeItem(CLOCK_SOURCE_KEY);
    }
  } catch (error) {
    console.error('Failed to save clock source:', error);
  }
}

/**
 * Load MIDI thru enabled state from storage
 */
export function loadThruEnabled(): boolean {
  try {
    const stored = localStorage.getItem(THRU_ENABLED_KEY);
    return stored === 'true';
  } catch (error) {
    console.error('Failed to load thru enabled:', error);
    return false;
  }
}

/**
 * Save MIDI thru enabled state to storage
 */
export function saveThruEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(THRU_ENABLED_KEY, String(enabled));
  } catch (error) {
    console.error('Failed to save thru enabled:', error);
  }
}

/**
 * Load MIDI thru routing from storage
 */
export function loadThruRouting(): ReadonlyMap<string, string> {
  try {
    const stored = localStorage.getItem(THRU_ROUTING_KEY);
    if (stored) {
      const data = JSON.parse(stored) as Record<string, string>;
      return new Map(Object.entries(data));
    }
  } catch (error) {
    console.error('Failed to load thru routing:', error);
  }
  return new Map();
}

/**
 * Save MIDI thru routing to storage
 */
export function saveThruRouting(routing: ReadonlyMap<string, string>): void {
  try {
    const data = Object.fromEntries(routing);
    localStorage.setItem(THRU_ROUTING_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save thru routing:', error);
  }
}

/**
 * Set MIDI thru routing for an input device
 */
export function setThruRouting(
  routing: ReadonlyMap<string, string>,
  inputId: string,
  outputId: string | null
): ReadonlyMap<string, string> {
  const newRouting = new Map(routing);
  if (outputId) {
    newRouting.set(inputId, outputId);
  } else {
    newRouting.delete(inputId);
  }
  saveThruRouting(newRouting);
  return newRouting;
}

// ============================================================================
// DEVICE LISTENERS
// ============================================================================

/**
 * Listen for MIDI device state changes (connect/disconnect)
 */
export function listenForDeviceChanges(
  midiAccess: MIDIAccess,
  onInputsChange: MIDIDeviceChangeHandler,
  onOutputsChange: MIDIDeviceChangeHandler,
  aliases: ReadonlyMap<string, string> = new Map(),
  enabledDevices: ReadonlySet<string> = new Set(),
  latencies: ReadonlyMap<string, number> = new Map()
): () => void {
  const handler = () => {
    const inputs = enumerateInputs(midiAccess, aliases, enabledDevices, latencies);
    const outputs = enumerateOutputs(midiAccess, aliases, enabledDevices, latencies);
    onInputsChange(inputs, 'input');
    onOutputsChange(outputs, 'output');
  };

  midiAccess.addEventListener('statechange', handler);

  return () => {
    midiAccess.removeEventListener('statechange', handler);
  };
}

/**
 * Listen for MIDI messages from an input device
 */
export function listenForMessages(
  input: MIDIInput,
  handler: MIDIMessageHandler,
  deviceInfo: MIDIDeviceInfo
): () => void {
  const listener = (event: MIDIMessageEvent) => {
    const message = parseMIDIMessage(event);
    handler(message, deviceInfo);
  };

  input.addEventListener('midimessage', listener);

  return () => {
    input.removeEventListener('midimessage', listener);
  };
}

// ============================================================================
// LATENCY CALIBRATION
// ============================================================================

/**
 * Latency calibration state
 */
export interface LatencyCalibrationState {
  /** Whether calibration is in progress */
  readonly active: boolean;
  /** Number of samples collected */
  readonly samples: number;
  /** Target number of samples */
  readonly targetSamples: number;
  /** Measured latencies (ms) */
  readonly measurements: readonly number[];
  /** Calculated average latency (ms) */
  readonly averageLatency: number;
}

/**
 * Create initial latency calibration state
 */
export function createLatencyCalibrationState(): LatencyCalibrationState {
  return {
    active: false,
    samples: 0,
    targetSamples: 10,
    measurements: [],
    averageLatency: 0,
  };
}

/**
 * Start latency calibration
 */
export function startLatencyCalibration(
  targetSamples: number = 10
): LatencyCalibrationState {
  return {
    active: true,
    samples: 0,
    targetSamples,
    measurements: [],
    averageLatency: 0,
  };
}

/**
 * Record latency measurement
 */
export function recordLatencyMeasurement(
  state: LatencyCalibrationState,
  latency: number
): LatencyCalibrationState {
  const measurements = [...state.measurements, latency];
  const samples = measurements.length;
  const averageLatency = measurements.reduce((sum, l) => sum + l, 0) / samples;

  return {
    ...state,
    samples,
    measurements,
    averageLatency,
    active: samples < state.targetSamples,
  };
}

/**
 * Complete latency calibration
 */
export function completeLatencyCalibration(
  state: LatencyCalibrationState
): number {
  return state.averageLatency;
}

// ============================================================================
// DEVICE STATUS DISPLAY
// ============================================================================

/**
 * Device status information for display
 */
export interface MIDIDeviceStatus {
  /** Device ID */
  readonly id: string;
  /** Device display name (alias or name) */
  readonly displayName: string;
  /** Connection status */
  readonly connected: boolean;
  /** Whether device is open and receiving/sending */
  readonly active: boolean;
  /** Number of messages received/sent in last second */
  readonly messageRate: number;
  /** Last message timestamp */
  readonly lastMessageTime: number;
  /** Average latency (for inputs) */
  readonly latency: number;
  /** Error message if any */
  readonly error: string | null;
}

/**
 * Create device status from device info
 */
export function createDeviceStatus(
  device: MIDIDeviceInfo,
  messageRate: number = 0,
  lastMessageTime: number = 0,
  error: string | null = null
): MIDIDeviceStatus {
  return {
    id: device.id,
    displayName: device.alias || device.name,
    connected: device.state === 'connected',
    active: device.connection === 'open',
    messageRate,
    lastMessageTime,
    latency: device.latency,
    error,
  };
}

// ============================================================================
// INPUT MONITORING
// ============================================================================

/**
 * Input monitor state for a device
 */
export interface InputMonitorState {
  /** Device ID */
  readonly deviceId: string;
  /** Whether monitoring is active */
  readonly active: boolean;
  /** Message count in current window */
  readonly messageCount: number;
  /** Window start time */
  readonly windowStart: number;
  /** Window duration in milliseconds */
  readonly windowDuration: number;
  /** Recent messages (limited buffer) */
  readonly recentMessages: readonly MIDIMessage[];
  /** Maximum buffer size */
  readonly maxBufferSize: number;
}

/**
 * Create initial input monitor state
 */
export function createInputMonitorState(
  deviceId: string,
  windowDuration: number = 1000,
  maxBufferSize: number = 100
): InputMonitorState {
  return {
    deviceId,
    active: true,
    messageCount: 0,
    windowStart: Date.now(),
    windowDuration,
    recentMessages: [],
    maxBufferSize,
  };
}

/**
 * Update input monitor with new message
 */
export function updateInputMonitor(
  state: InputMonitorState,
  message: MIDIMessage
): InputMonitorState {
  const now = Date.now();
  const windowElapsed = now - state.windowStart;
  
  // Reset window if duration exceeded
  if (windowElapsed >= state.windowDuration) {
    return {
      ...state,
      messageCount: 1,
      windowStart: now,
      recentMessages: [message].slice(-state.maxBufferSize),
    };
  }
  
  // Add message to buffer
  const recentMessages = [...state.recentMessages, message].slice(-state.maxBufferSize);
  
  return {
    ...state,
    messageCount: state.messageCount + 1,
    recentMessages,
  };
}

/**
 * Calculate messages per second
 */
export function getInputMessageRate(state: InputMonitorState): number {
  const now = Date.now();
  const windowElapsed = now - state.windowStart;
  if (windowElapsed === 0) return 0;
  return (state.messageCount / windowElapsed) * 1000;
}

// ============================================================================
// OUTPUT TEST
// ============================================================================

/**
 * Test pattern type for output testing
 */
export type MIDITestPattern =
  | 'note-on-off'
  | 'all-notes'
  | 'chromatic-scale'
  | 'control-sweep'
  | 'pitch-bend'
  | 'clock-pulses';

/**
 * Send test pattern to output device
 */
export function sendTestPattern(
  output: MIDIOutput,
  pattern: MIDITestPattern,
  channel: number = 0
): void {
  const timestamp = performance.now();
  
  switch (pattern) {
    case 'note-on-off':
      // Send middle C on and off
      output.send([0x90 | channel, 60, 100], timestamp);
      output.send([0x80 | channel, 60, 0], timestamp + 500);
      break;
      
    case 'all-notes':
      // Send all notes off
      output.send([0xB0 | channel, 123, 0], timestamp);
      break;
      
    case 'chromatic-scale':
      // Play chromatic scale C4-C5
      for (let note = 60; note <= 72; note++) {
        const noteTimestamp = timestamp + (note - 60) * 100;
        output.send([0x90 | channel, note, 100], noteTimestamp);
        output.send([0x80 | channel, note, 0], noteTimestamp + 80);
      }
      break;
      
    case 'control-sweep':
      // Sweep modulation wheel
      for (let value = 0; value <= 127; value += 8) {
        output.send([0xB0 | channel, 1, value], timestamp + value * 10);
      }
      break;
      
    case 'pitch-bend':
      // Bend pitch up and down
      const centerBend = 8192;
      for (let i = 0; i <= 20; i++) {
        const bend = centerBend + Math.sin(i / 5) * 4096;
        const lsb = Math.floor(bend) & 0x7F;
        const msb = (Math.floor(bend) >> 7) & 0x7F;
        output.send([0xE0 | channel, lsb, msb], timestamp + i * 50);
      }
      break;
      
    case 'clock-pulses':
      // Send 24 clock pulses (one beat)
      for (let i = 0; i < 24; i++) {
        output.send([0xF8], timestamp + i * 20);
      }
      break;
  }
}

/**
 * Test output device responsiveness
 */
export async function testOutputLatency(
  output: MIDIOutput,
  channel: number = 0
): Promise<number> {
  const startTime = performance.now();
  
  // Send note on
  output.send([0x90 | channel, 60, 100]);
  
  // Wait a bit for device to process
  await new Promise(resolve => setTimeout(resolve, 10));
  
  // Send note off
  output.send([0x80 | channel, 60, 0]);
  
  const endTime = performance.now();
  return endTime - startTime;
}

// ============================================================================
// VIRTUAL MIDI PORTS
// ============================================================================

/**
 * Virtual MIDI port (software-based)
 */
export interface VirtualMIDIPort {
  /** Port ID */
  readonly id: string;
  /** Port name */
  readonly name: string;
  /** Port type */
  readonly type: MIDIDeviceType;
  /** Whether port is open */
  readonly open: boolean;
  /** Message handlers */
  readonly handlers: readonly MIDIMessageHandler[];
}

/**
 * Virtual MIDI port registry
 */
const virtualPorts = new Map<string, VirtualMIDIPort>();

/**
 * Create virtual MIDI port
 */
export function createVirtualMIDIPort(
  name: string,
  type: MIDIDeviceType
): VirtualMIDIPort {
  const id = `virtual-${type}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  const port: VirtualMIDIPort = {
    id,
    name,
    type,
    open: true,
    handlers: [],
  };
  
  virtualPorts.set(id, port);
  return port;
}

/**
 * Get all virtual MIDI ports
 */
export function getVirtualMIDIPorts(
  type?: MIDIDeviceType
): readonly VirtualMIDIPort[] {
  const ports = Array.from(virtualPorts.values());
  if (type !== undefined) {
    return ports.filter(p => p.type === type);
  }
  return ports;
}

/**
 * Send message to virtual port
 */
export function sendToVirtualPort(
  portId: string,
  message: MIDIMessage
): void {
  const port = virtualPorts.get(portId);
  if (!port || !port.open || port.type !== 'input') {
    return;
  }
  
  // Create device info for virtual port
  const deviceInfo: MIDIDeviceInfo = {
    id: port.id,
    name: port.name,
    manufacturer: 'Cardplay Virtual',
    type: 'input',
    state: 'connected',
    connection: 'open',
    enabled: true,
    latency: 0,
  };
  
  // Call all handlers
  for (const handler of port.handlers) {
    handler(message, deviceInfo);
  }
}

/**
 * Add message handler to virtual port
 */
export function addVirtualPortHandler(
  portId: string,
  handler: MIDIMessageHandler
): () => void {
  const port = virtualPorts.get(portId);
  if (!port) {
    return () => {};
  }
  
  const handlers = [...port.handlers, handler];
  virtualPorts.set(portId, { ...port, handlers });
  
  // Return cleanup function
  return () => {
    const currentPort = virtualPorts.get(portId);
    if (!currentPort) return;
    
    const filteredHandlers = currentPort.handlers.filter(h => h !== handler);
    virtualPorts.set(portId, { ...currentPort, handlers: filteredHandlers });
  };
}

/**
 * Close virtual port
 */
export function closeVirtualPort(portId: string): void {
  const port = virtualPorts.get(portId);
  if (!port) return;
  
  virtualPorts.set(portId, { ...port, open: false, handlers: [] });
}

/**
 * Delete virtual port
 */
export function deleteVirtualPort(portId: string): void {
  virtualPorts.delete(portId);
}

// ============================================================================
// MIDI LOG VIEWER DATA
// ============================================================================

/**
 * MIDI log entry for viewer
 */
export interface MIDILogEntry {
  /** Entry ID */
  readonly id: string;
  /** Timestamp */
  readonly timestamp: number;
  /** Device ID */
  readonly deviceId: string;
  /** Device name */
  readonly deviceName: string;
  /** Message */
  readonly message: MIDIMessage;
  /** Direction (in/out) */
  readonly direction: 'in' | 'out';
}

/**
 * MIDI log viewer state
 */
export interface MIDILogViewerState {
  /** Log entries */
  readonly entries: readonly MIDILogEntry[];
  /** Maximum entries */
  readonly maxEntries: number;
  /** Filter by device ID (null = all) */
  readonly filterDeviceId: string | null;
  /** Filter by message type (null = all) */
  readonly filterMessageType: MIDIMessageType | null;
  /** Whether logging is paused */
  readonly paused: boolean;
}

/**
 * Create initial log viewer state
 */
export function createMIDILogViewerState(
  maxEntries: number = 1000
): MIDILogViewerState {
  return {
    entries: [],
    maxEntries,
    filterDeviceId: null,
    filterMessageType: null,
    paused: false,
  };
}

/**
 * Add entry to MIDI log
 */
export function addMIDILogEntry(
  state: MIDILogViewerState,
  deviceId: string,
  deviceName: string,
  message: MIDIMessage,
  direction: 'in' | 'out'
): MIDILogViewerState {
  if (state.paused) {
    return state;
  }
  
  const entry: MIDILogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    timestamp: message.timestamp,
    deviceId,
    deviceName,
    message,
    direction,
  };
  
  const entries = [...state.entries, entry].slice(-state.maxEntries);
  
  return { ...state, entries };
}

/**
 * Get filtered log entries
 */
export function getFilteredMIDILogEntries(
  state: MIDILogViewerState
): readonly MIDILogEntry[] {
  let entries = state.entries;
  
  if (state.filterDeviceId !== null) {
    entries = entries.filter(e => e.deviceId === state.filterDeviceId);
  }
  
  if (state.filterMessageType !== null) {
    entries = entries.filter(e => e.message.type === state.filterMessageType);
  }
  
  return entries;
}

/**
 * Clear MIDI log
 */
export function clearMIDILog(
  state: MIDILogViewerState
): MIDILogViewerState {
  return { ...state, entries: [] };
}

// ============================================================================
// MIDI LEARN SYSTEM
// ============================================================================

/**
 * MIDI learn target (parameter to be controlled)
 */
export interface MIDILearnTarget {
  /** Target ID */
  readonly id: string;
  /** Target name */
  readonly name: string;
  /** Card ID (if parameter belongs to card) */
  readonly cardId?: string;
  /** Parameter path */
  readonly parameterPath: string;
  /** Value range */
  readonly range: readonly [number, number];
}

/**
 * MIDI learn binding (CC/note → parameter)
 */
export interface MIDILearnBinding {
  /** Binding ID */
  readonly id: string;
  /** Device ID */
  readonly deviceId: string;
  /** MIDI channel (0-15, null = omni) */
  readonly channel: number | null;
  /** Message type */
  readonly messageType: MIDIMessageType;
  /** CC number (for controlchange) or note number (for noteon) */
  readonly ccOrNote: number;
  /** Target */
  readonly target: MIDILearnTarget;
  /** Minimum MIDI value (0-127) */
  readonly midiMin: number;
  /** Maximum MIDI value (0-127) */
  readonly midiMax: number;
}

/**
 * MIDI learn state
 */
export interface MIDILearnState {
  /** Whether learn mode is active */
  readonly active: boolean;
  /** Current target being learned */
  readonly target: MIDILearnTarget | null;
  /** All bindings */
  readonly bindings: readonly MIDILearnBinding[];
  /** Last received message (during learn) */
  readonly lastMessage: MIDIMessage | null;
  /** Last received device (during learn) */
  readonly lastDevice: MIDIDeviceInfo | null;
}

/**
 * Create initial MIDI learn state
 */
export function createMIDILearnState(): MIDILearnState {
  return {
    active: false,
    target: null,
    bindings: [],
    lastMessage: null,
    lastDevice: null,
  };
}

/**
 * Start MIDI learn for target
 */
export function startMIDILearn(
  state: MIDILearnState,
  target: MIDILearnTarget
): MIDILearnState {
  return {
    ...state,
    active: true,
    target,
    lastMessage: null,
    lastDevice: null,
  };
}

/**
 * Capture MIDI message during learn
 */
export function captureMIDILearnMessage(
  state: MIDILearnState,
  message: MIDIMessage,
  device: MIDIDeviceInfo
): MIDILearnState {
  if (!state.active || !state.target) {
    return state;
  }
  
  // Only capture CC and note messages
  if (message.type !== 'controlchange' && message.type !== 'noteon') {
    return state;
  }
  
  return {
    ...state,
    lastMessage: message,
    lastDevice: device,
  };
}

/**
 * Complete MIDI learn and create binding
 */
export function completeMIDILearn(
  state: MIDILearnState
): MIDILearnState {
  if (!state.active || !state.target || !state.lastMessage || !state.lastDevice) {
    return { ...state, active: false, target: null };
  }
  
  const binding: MIDILearnBinding = {
    id: `binding-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    deviceId: state.lastDevice.id,
    channel: state.lastMessage.channel,
    messageType: state.lastMessage.type,
    ccOrNote: state.lastMessage.data1,
    target: state.target,
    midiMin: 0,
    midiMax: 127,
  };
  
  const bindings = [...state.bindings, binding];
  
  return {
    ...state,
    active: false,
    target: null,
    bindings,
    lastMessage: null,
    lastDevice: null,
  };
}

/**
 * Cancel MIDI learn
 */
export function cancelMIDILearn(
  state: MIDILearnState
): MIDILearnState {
  return {
    ...state,
    active: false,
    target: null,
    lastMessage: null,
    lastDevice: null,
  };
}

/**
 * Remove MIDI learn binding
 */
export function removeMIDILearnBinding(
  state: MIDILearnState,
  bindingId: string
): MIDILearnState {
  const bindings = state.bindings.filter(b => b.id !== bindingId);
  return { ...state, bindings };
}

/**
 * Apply MIDI message to learned parameters
 */
export function applyMIDILearnMessage(
  state: MIDILearnState,
  message: MIDIMessage,
  deviceId: string
): ReadonlyMap<string, number> {
  const parameterValues = new Map<string, number>();
  
  for (const binding of state.bindings) {
    // Check if message matches binding
    if (binding.deviceId !== deviceId) continue;
    if (binding.messageType !== message.type) continue;
    if (binding.channel !== null && binding.channel !== message.channel) continue;
    if (binding.ccOrNote !== message.data1) continue;
    
    // Map MIDI value to parameter range
    const midiValue = message.data2;
    const midiRange = binding.midiMax - binding.midiMin;
    const midiNormalized = (midiValue - binding.midiMin) / midiRange;
    const [paramMin, paramMax] = binding.target.range;
    const paramValue = paramMin + midiNormalized * (paramMax - paramMin);
    
    parameterValues.set(binding.target.parameterPath, paramValue);
  }
  
  return parameterValues;
}

// ============================================================================
// PERSISTENCE FOR NEW FEATURES
// ============================================================================

/**
 * Save MIDI learn bindings to localStorage
 */
export function saveMIDILearnBindings(bindings: readonly MIDILearnBinding[]): void {
  try {
    const data = JSON.stringify(Array.from(bindings));
    localStorage.setItem('cardplay-midi-learn-bindings', data);
  } catch (error) {
    console.error('Failed to save MIDI learn bindings:', error);
  }
}

/**
 * Load MIDI learn bindings from localStorage
 */
export function loadMIDILearnBindings(): readonly MIDILearnBinding[] {
  try {
    const data = localStorage.getItem('cardplay-midi-learn-bindings');
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    
    return parsed as MIDILearnBinding[];
  } catch (error) {
    console.error('Failed to load MIDI learn bindings:', error);
    return [];
  }
}
