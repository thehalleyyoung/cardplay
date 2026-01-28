/**
 * @fileoverview MIDI Device Manager Panel Component
 * 
 * UI component for managing MIDI devices with:
 * - Permission request button
 * - Device enumeration display (inputs/outputs)
 * - Device connect/disconnect status
 * - Device naming/aliasing
 * - Device enable/disable toggles
 * - Latency calibration per device
 * - Clock source selection
 * - MIDI thru configuration
 * 
 * @module @cardplay/core/ui/components/midi-device-panel
 */

import type {
  MIDIDeviceInfo,
  MIDIMessageHandler,
  LatencyCalibrationState,
} from '../../audio/web-midi';
import {
  isWebMIDISupported,
  requestMIDIAccess,
  enumerateAllDevices,
  openInputDevice,
  closeInputDevice,
  listenForDeviceChanges,
  listenForMessages,
  loadDeviceAliases,
  setDeviceAlias,
  loadEnabledDevices,
  toggleDeviceEnabled,
  loadDeviceLatencies,
  setDeviceLatency,
  loadClockSource,
  saveClockSource,
  loadThruEnabled,
  saveThruEnabled,
  loadThruRouting,
  setThruRouting,
  createLatencyCalibrationState,
  startLatencyCalibration,
  recordLatencyMeasurement,
  completeLatencyCalibration,
} from '../../audio/web-midi';

// ============================================================================
// TYPES
// ============================================================================

/**
 * MIDI panel state
 */
export interface MIDIDevicePanelState {
  /** Whether Web MIDI is supported */
  readonly supported: boolean;
  /** Whether MIDI access has been requested */
  readonly accessRequested: boolean;
  /** Whether MIDI access has been granted */
  readonly accessGranted: boolean;
  /** MIDI access object */
  readonly midiAccess: MIDIAccess | null;
  /** Input devices */
  readonly inputs: readonly MIDIDeviceInfo[];
  /** Output devices */
  readonly outputs: readonly MIDIDeviceInfo[];
  /** Device aliases (device ID → alias) */
  readonly aliases: ReadonlyMap<string, string>;
  /** Enabled devices (device IDs) */
  readonly enabledDevices: ReadonlySet<string>;
  /** Device latencies (device ID → ms) */
  readonly latencies: ReadonlyMap<string, number>;
  /** Selected clock source device ID */
  readonly clockSource: string | null;
  /** Whether MIDI thru is enabled */
  readonly thruEnabled: boolean;
  /** MIDI thru routing (input ID → output ID) */
  readonly thruRouting: ReadonlyMap<string, string>;
  /** Device being edited for alias */
  readonly editingAlias: string | null;
  /** Device being calibrated for latency */
  readonly calibrating: string | null;
  /** Calibration state */
  readonly calibrationState: LatencyCalibrationState;
  /** Active message listeners */
  readonly messageListeners: ReadonlyMap<string, () => void>;
  /** Device change listener cleanup */
  readonly deviceChangeCleanup: (() => void) | null;
  /** Error message */
  readonly error: string | null;
}

/**
 * MIDI panel action types
 */
export type MIDIDevicePanelAction =
  | { type: 'REQUEST_ACCESS_START' }
  | { type: 'REQUEST_ACCESS_SUCCESS'; midiAccess: MIDIAccess }
  | { type: 'REQUEST_ACCESS_ERROR'; error: string }
  | { type: 'DEVICES_CHANGED'; inputs: readonly MIDIDeviceInfo[]; outputs: readonly MIDIDeviceInfo[] }
  | { type: 'SET_ALIAS'; deviceId: string; alias: string }
  | { type: 'START_EDIT_ALIAS'; deviceId: string }
  | { type: 'CANCEL_EDIT_ALIAS' }
  | { type: 'TOGGLE_DEVICE_ENABLED'; deviceId: string }
  | { type: 'SET_CLOCK_SOURCE'; deviceId: string | null }
  | { type: 'TOGGLE_THRU_ENABLED' }
  | { type: 'SET_THRU_ROUTING'; inputId: string; outputId: string | null }
  | { type: 'START_CALIBRATION'; deviceId: string }
  | { type: 'RECORD_LATENCY_SAMPLE'; latency: number }
  | { type: 'COMPLETE_CALIBRATION' }
  | { type: 'CANCEL_CALIBRATION' }
  | { type: 'MESSAGE_LISTENER_ADDED'; deviceId: string; cleanup: () => void }
  | { type: 'MESSAGE_LISTENER_REMOVED'; deviceId: string }
  | { type: 'DEVICE_CHANGE_LISTENER_SET'; cleanup: () => void }
  | { type: 'CLEAR_ERROR' };

/**
 * MIDI panel configuration
 */
export interface MIDIDevicePanelConfig {
  /** Whether to request sysex access */
  readonly requestSysex?: boolean;
  /** Callback when message is received */
  readonly onMessage?: MIDIMessageHandler;
  /** Callback when devices change */
  readonly onDevicesChange?: (inputs: readonly MIDIDeviceInfo[], outputs: readonly MIDIDeviceInfo[]) => void;
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Create initial MIDI panel state
 */
export function createMIDIDevicePanelState(): MIDIDevicePanelState {
  return {
    supported: isWebMIDISupported(),
    accessRequested: false,
    accessGranted: false,
    midiAccess: null,
    inputs: [],
    outputs: [],
    aliases: loadDeviceAliases(),
    enabledDevices: loadEnabledDevices(),
    latencies: loadDeviceLatencies(),
    clockSource: loadClockSource(),
    thruEnabled: loadThruEnabled(),
    thruRouting: loadThruRouting(),
    editingAlias: null,
    calibrating: null,
    calibrationState: createLatencyCalibrationState(),
    messageListeners: new Map(),
    deviceChangeCleanup: null,
    error: null,
  };
}

/**
 * MIDI panel state reducer
 */
export function midiDevicePanelReducer(
  state: MIDIDevicePanelState,
  action: MIDIDevicePanelAction
): MIDIDevicePanelState {
  switch (action.type) {
    case 'REQUEST_ACCESS_START':
      return { ...state, accessRequested: true, error: null };

    case 'REQUEST_ACCESS_SUCCESS':
      return {
        ...state,
        accessGranted: true,
        midiAccess: action.midiAccess,
        error: null,
      };

    case 'REQUEST_ACCESS_ERROR':
      return {
        ...state,
        accessGranted: false,
        error: action.error,
      };

    case 'DEVICES_CHANGED':
      return {
        ...state,
        inputs: action.inputs,
        outputs: action.outputs,
      };

    case 'SET_ALIAS': {
      const aliases = setDeviceAlias(state.aliases, action.deviceId, action.alias);
      return {
        ...state,
        aliases,
        editingAlias: null,
      };
    }

    case 'START_EDIT_ALIAS':
      return { ...state, editingAlias: action.deviceId };

    case 'CANCEL_EDIT_ALIAS':
      return { ...state, editingAlias: null };

    case 'TOGGLE_DEVICE_ENABLED': {
      const enabledDevices = toggleDeviceEnabled(state.enabledDevices, action.deviceId);
      return { ...state, enabledDevices };
    }

    case 'SET_CLOCK_SOURCE':
      saveClockSource(action.deviceId);
      return { ...state, clockSource: action.deviceId };

    case 'TOGGLE_THRU_ENABLED': {
      const thruEnabled = !state.thruEnabled;
      saveThruEnabled(thruEnabled);
      return { ...state, thruEnabled };
    }

    case 'SET_THRU_ROUTING': {
      const thruRouting = setThruRouting(state.thruRouting, action.inputId, action.outputId);
      return { ...state, thruRouting };
    }

    case 'START_CALIBRATION':
      return {
        ...state,
        calibrating: action.deviceId,
        calibrationState: startLatencyCalibration(),
      };

    case 'RECORD_LATENCY_SAMPLE': {
      const calibrationState = recordLatencyMeasurement(state.calibrationState, action.latency);
      return { ...state, calibrationState };
    }

    case 'COMPLETE_CALIBRATION': {
      if (!state.calibrating) {
        return state;
      }
      const averageLatency = completeLatencyCalibration(state.calibrationState);
      const latencies = setDeviceLatency(state.latencies, state.calibrating, averageLatency);
      return {
        ...state,
        latencies,
        calibrating: null,
        calibrationState: createLatencyCalibrationState(),
      };
    }

    case 'CANCEL_CALIBRATION':
      return {
        ...state,
        calibrating: null,
        calibrationState: createLatencyCalibrationState(),
      };

    case 'MESSAGE_LISTENER_ADDED': {
      const messageListeners = new Map(state.messageListeners);
      messageListeners.set(action.deviceId, action.cleanup);
      return { ...state, messageListeners };
    }

    case 'MESSAGE_LISTENER_REMOVED': {
      const cleanup = state.messageListeners.get(action.deviceId);
      if (cleanup) {
        cleanup();
      }
      const messageListeners = new Map(state.messageListeners);
      messageListeners.delete(action.deviceId);
      return { ...state, messageListeners };
    }

    case 'DEVICE_CHANGE_LISTENER_SET':
      // Cleanup previous listener if exists
      if (state.deviceChangeCleanup) {
        state.deviceChangeCleanup();
      }
      return { ...state, deviceChangeCleanup: action.cleanup };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Request MIDI access
 */
export async function requestAccess(
  config: MIDIDevicePanelConfig,
  dispatch: (action: MIDIDevicePanelAction) => void
): Promise<void> {
  dispatch({ type: 'REQUEST_ACCESS_START' });

  try {
    const midiAccess = await requestMIDIAccess(config.requestSysex ?? false);

    if (!midiAccess) {
      dispatch({
        type: 'REQUEST_ACCESS_ERROR',
        error: 'MIDI access denied or not supported',
      });
      return;
    }

    dispatch({ type: 'REQUEST_ACCESS_SUCCESS', midiAccess });

    // Initial device enumeration
    const state = createMIDIDevicePanelState();
    const { inputs, outputs } = enumerateAllDevices(
      midiAccess,
      state.aliases,
      state.enabledDevices,
      state.latencies
    );
    dispatch({ type: 'DEVICES_CHANGED', inputs, outputs });

    // Set up device change listener
    const cleanup = listenForDeviceChanges(
      midiAccess,
      (inputs) => {
        dispatch({ type: 'DEVICES_CHANGED', inputs, outputs: [] });
        if (config.onDevicesChange) {
          config.onDevicesChange(inputs, outputs);
        }
      },
      (outputs) => {
        dispatch({ type: 'DEVICES_CHANGED', inputs: [], outputs });
        if (config.onDevicesChange) {
          config.onDevicesChange(inputs, outputs);
        }
      },
      state.aliases,
      state.enabledDevices,
      state.latencies
    );
    dispatch({ type: 'DEVICE_CHANGE_LISTENER_SET', cleanup });

    // Open enabled input devices and set up message listeners
    for (const input of inputs) {
      if (input.enabled) {
        const device = await openInputDevice(midiAccess, input.id);
        if (device && config.onMessage) {
          const listenerCleanup = listenForMessages(device, config.onMessage, input);
          dispatch({
            type: 'MESSAGE_LISTENER_ADDED',
            deviceId: input.id,
            cleanup: listenerCleanup,
          });
        }
      }
    }
  } catch (error) {
    dispatch({
      type: 'REQUEST_ACCESS_ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Toggle device enabled state and manage listeners
 */
export async function toggleDevice(
  state: MIDIDevicePanelState,
  deviceId: string,
  config: MIDIDevicePanelConfig,
  dispatch: (action: MIDIDevicePanelAction) => void
): Promise<void> {
  const device = [...state.inputs, ...state.outputs].find(d => d.id === deviceId);
  if (!device || !state.midiAccess) {
    return;
  }

  dispatch({ type: 'TOGGLE_DEVICE_ENABLED', deviceId });

  const wasEnabled = state.enabledDevices.has(deviceId);
  const nowEnabled = !wasEnabled;

  if (device.type === 'input') {
    if (nowEnabled) {
      // Open device and add message listener
      const input = await openInputDevice(state.midiAccess, deviceId);
      if (input && config.onMessage) {
        const cleanup = listenForMessages(input, config.onMessage, device);
        dispatch({ type: 'MESSAGE_LISTENER_ADDED', deviceId, cleanup });
      }
    } else {
      // Remove message listener and close device
      dispatch({ type: 'MESSAGE_LISTENER_REMOVED', deviceId });
      await closeInputDevice(state.midiAccess, deviceId);
    }
  }
}

/**
 * Start latency calibration for a device
 */
export function startCalibration(
  deviceId: string,
  dispatch: (action: MIDIDevicePanelAction) => void
): void {
  dispatch({ type: 'START_CALIBRATION', deviceId });
}

/**
 * Record a latency measurement during calibration
 */
export function recordLatencySample(
  latency: number,
  dispatch: (action: MIDIDevicePanelAction) => void
): void {
  dispatch({ type: 'RECORD_LATENCY_SAMPLE', latency });
}

/**
 * Complete latency calibration
 */
export function finishCalibration(
  dispatch: (action: MIDIDevicePanelAction) => void
): void {
  dispatch({ type: 'COMPLETE_CALIBRATION' });
}

/**
 * Cancel latency calibration
 */
export function cancelCalibration(
  dispatch: (action: MIDIDevicePanelAction) => void
): void {
  dispatch({ type: 'CANCEL_CALIBRATION' });
}

/**
 * Set device alias
 */
export function setAlias(
  deviceId: string,
  alias: string,
  dispatch: (action: MIDIDevicePanelAction) => void
): void {
  dispatch({ type: 'SET_ALIAS', deviceId, alias });
}

/**
 * Set clock source device
 */
export function setClockSource(
  deviceId: string | null,
  dispatch: (action: MIDIDevicePanelAction) => void
): void {
  dispatch({ type: 'SET_CLOCK_SOURCE', deviceId });
}

/**
 * Toggle MIDI thru enabled
 */
export function toggleThru(
  dispatch: (action: MIDIDevicePanelAction) => void
): void {
  dispatch({ type: 'TOGGLE_THRU_ENABLED' });
}

/**
 * Set MIDI thru routing
 */
export function setRouting(
  inputId: string,
  outputId: string | null,
  dispatch: (action: MIDIDevicePanelAction) => void
): void {
  dispatch({ type: 'SET_THRU_ROUTING', inputId, outputId });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get device display name (alias or name)
 */
export function getDeviceDisplayName(device: MIDIDeviceInfo): string {
  return device.alias || device.name;
}

/**
 * Get device status description
 */
export function getDeviceStatusDescription(device: MIDIDeviceInfo): string {
  if (device.state === 'disconnected') {
    return 'Disconnected';
  }
  if (!device.enabled) {
    return 'Disabled';
  }
  return 'Active';
}

/**
 * Get clock source device name
 */
export function getClockSourceName(
  clockSource: string | null,
  devices: readonly MIDIDeviceInfo[]
): string {
  if (!clockSource) {
    return 'Internal';
  }
  const device = devices.find(d => d.id === clockSource);
  return device ? getDeviceDisplayName(device) : 'Unknown';
}

/**
 * Get thru routing description for an input device
 */
export function getThruRoutingDescription(
  inputId: string,
  thruRouting: ReadonlyMap<string, string>,
  outputs: readonly MIDIDeviceInfo[]
): string {
  const outputId = thruRouting.get(inputId);
  if (!outputId) {
    return 'None';
  }
  const output = outputs.find(d => d.id === outputId);
  return output ? getDeviceDisplayName(output) : 'Unknown';
}

/**
 * Format latency value for display
 */
export function formatLatency(ms: number): string {
  return `${ms.toFixed(1)} ms`;
}

/**
 * Get calibration progress percentage
 */
export function getCalibrationProgress(state: LatencyCalibrationState): number {
  return state.targetSamples > 0
    ? (state.samples / state.targetSamples) * 100
    : 0;
}

/**
 * Cleanup all listeners when unmounting
 */
export function cleanupAll(state: MIDIDevicePanelState): void {
  // Cleanup device change listener
  if (state.deviceChangeCleanup) {
    state.deviceChangeCleanup();
  }

  // Cleanup all message listeners
  for (const cleanup of state.messageListeners.values()) {
    cleanup();
  }
}
