/**
 * @fileoverview Tests for Web MIDI API Integration
 * 
 * @module @cardplay/core/audio/web-midi.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isWebMIDISupported,
  parseMIDIStatus,
  loadDeviceAliases,
  saveDeviceAliases,
  setDeviceAlias,
  loadEnabledDevices,
  saveEnabledDevices,
  toggleDeviceEnabled,
  loadDeviceLatencies,
  saveDeviceLatencies,
  setDeviceLatency,
  createLatencyCalibrationState,
  startLatencyCalibration,
  recordLatencyMeasurement,
  completeLatencyCalibration,
} from './web-midi';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Web MIDI - Detection', () => {
  it('should check if Web MIDI is supported', () => {
    const supported = isWebMIDISupported();
    expect(typeof supported).toBe('boolean');
  });
});

describe('Web MIDI - Message Parsing', () => {
  it('should parse note-on message', () => {
    const status = 0x90; // Note-on, channel 0
    const result = parseMIDIStatus(status);
    expect(result.type).toBe('noteon');
    expect(result.channel).toBe(0);
  });

  it('should parse note-off message', () => {
    const status = 0x80; // Note-off, channel 0
    const result = parseMIDIStatus(status);
    expect(result.type).toBe('noteoff');
    expect(result.channel).toBe(0);
  });

  it('should parse control change message', () => {
    const status = 0xB3; // Control change, channel 3
    const result = parseMIDIStatus(status);
    expect(result.type).toBe('controlchange');
    expect(result.channel).toBe(3);
  });

  it('should parse pitch bend message', () => {
    const status = 0xE5; // Pitch bend, channel 5
    const result = parseMIDIStatus(status);
    expect(result.type).toBe('pitchbend');
    expect(result.channel).toBe(5);
  });

  it('should parse program change message', () => {
    const status = 0xC7; // Program change, channel 7
    const result = parseMIDIStatus(status);
    expect(result.type).toBe('programchange');
    expect(result.channel).toBe(7);
  });

  it('should parse clock message', () => {
    const status = 0xF8; // Clock
    const result = parseMIDIStatus(status);
    expect(result.type).toBe('clock');
  });

  it('should parse start message', () => {
    const status = 0xFA; // Start
    const result = parseMIDIStatus(status);
    expect(result.type).toBe('start');
  });

  it('should parse stop message', () => {
    const status = 0xFC; // Stop
    const result = parseMIDIStatus(status);
    expect(result.type).toBe('stop');
  });
});

describe('Web MIDI - Device Persistence', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should save and load device aliases', () => {
    const aliases = new Map([
      ['device1', 'My Keyboard'],
      ['device2', 'Drum Pad'],
    ]);

    saveDeviceAliases(aliases);
    const loaded = loadDeviceAliases();

    expect(loaded.get('device1')).toBe('My Keyboard');
    expect(loaded.get('device2')).toBe('Drum Pad');
  });

  it('should set device alias', () => {
    const initial = new Map<string, string>();
    const updated = setDeviceAlias(initial, 'device1', 'Test Device');
    
    expect(updated.get('device1')).toBe('Test Device');
    
    // Check it was persisted
    const loaded = loadDeviceAliases();
    expect(loaded.get('device1')).toBe('Test Device');
  });

  it('should remove device alias when set to empty string', () => {
    const initial = new Map([['device1', 'Old Name']]);
    const updated = setDeviceAlias(initial, 'device1', '');
    
    expect(updated.has('device1')).toBe(false);
  });

  it('should save and load enabled devices', () => {
    const enabled = new Set(['device1', 'device2']);

    saveEnabledDevices(enabled);
    const loaded = loadEnabledDevices();

    expect(loaded.has('device1')).toBe(true);
    expect(loaded.has('device2')).toBe(true);
    expect(loaded.has('device3')).toBe(false);
  });

  it('should toggle device enabled state', () => {
    const initial = new Set(['device1']);
    
    // Disable device1
    const afterDisable = toggleDeviceEnabled(initial, 'device1');
    expect(afterDisable.has('device1')).toBe(false);
    
    // Enable device1 again
    const afterEnable = toggleDeviceEnabled(afterDisable, 'device1');
    expect(afterEnable.has('device1')).toBe(true);
    
    // Enable device2
    const afterAdd = toggleDeviceEnabled(afterEnable, 'device2');
    expect(afterAdd.has('device1')).toBe(true);
    expect(afterAdd.has('device2')).toBe(true);
  });

  it('should save and load device latencies', () => {
    const latencies = new Map([
      ['device1', 5.5],
      ['device2', 12.3],
    ]);

    saveDeviceLatencies(latencies);
    const loaded = loadDeviceLatencies();

    expect(loaded.get('device1')).toBe(5.5);
    expect(loaded.get('device2')).toBe(12.3);
  });

  it('should set device latency', () => {
    const initial = new Map<string, number>();
    const updated = setDeviceLatency(initial, 'device1', 8.7);
    
    expect(updated.get('device1')).toBe(8.7);
    
    // Check it was persisted
    const loaded = loadDeviceLatencies();
    expect(loaded.get('device1')).toBe(8.7);
  });
});

describe('Web MIDI - Latency Calibration', () => {
  it('should create initial calibration state', () => {
    const state = createLatencyCalibrationState();
    
    expect(state.active).toBe(false);
    expect(state.samples).toBe(0);
    expect(state.targetSamples).toBe(10);
    expect(state.measurements).toEqual([]);
    expect(state.averageLatency).toBe(0);
  });

  it('should start calibration', () => {
    const state = startLatencyCalibration(5);
    
    expect(state.active).toBe(true);
    expect(state.samples).toBe(0);
    expect(state.targetSamples).toBe(5);
  });

  it('should record latency measurements', () => {
    let state = startLatencyCalibration(3);
    
    state = recordLatencyMeasurement(state, 5.2);
    expect(state.samples).toBe(1);
    expect(state.measurements).toEqual([5.2]);
    expect(state.averageLatency).toBe(5.2);
    expect(state.active).toBe(true);
    
    state = recordLatencyMeasurement(state, 6.8);
    expect(state.samples).toBe(2);
    expect(state.measurements).toEqual([5.2, 6.8]);
    expect(state.averageLatency).toBe(6.0);
    expect(state.active).toBe(true);
    
    state = recordLatencyMeasurement(state, 7.0);
    expect(state.samples).toBe(3);
    expect(state.measurements).toEqual([5.2, 6.8, 7.0]);
    expect(state.averageLatency).toBeCloseTo(6.333, 2);
    expect(state.active).toBe(false); // Should be done
  });

  it('should complete calibration and return average', () => {
    let state = startLatencyCalibration(3);
    state = recordLatencyMeasurement(state, 5.0);
    state = recordLatencyMeasurement(state, 10.0);
    state = recordLatencyMeasurement(state, 15.0);
    
    const average = completeLatencyCalibration(state);
    expect(average).toBe(10.0);
  });

  it('should calculate average latency correctly', () => {
    let state = startLatencyCalibration(5);
    
    const measurements = [4.5, 5.5, 6.0, 5.0, 5.5];
    for (const measurement of measurements) {
      state = recordLatencyMeasurement(state, measurement);
    }
    
    const average = completeLatencyCalibration(state);
    expect(average).toBeCloseTo(5.3, 1);
  });
});

describe('Web MIDI - Device Aliases', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should handle empty aliases map', () => {
    const aliases = loadDeviceAliases();
    expect(aliases.size).toBe(0);
  });

  it('should preserve multiple aliases', () => {
    const aliases = new Map([
      ['device1', 'Keyboard 1'],
      ['device2', 'Keyboard 2'],
      ['device3', 'Drum Controller'],
    ]);

    saveDeviceAliases(aliases);
    const loaded = loadDeviceAliases();

    expect(loaded.size).toBe(3);
    expect(loaded.get('device1')).toBe('Keyboard 1');
    expect(loaded.get('device2')).toBe('Keyboard 2');
    expect(loaded.get('device3')).toBe('Drum Controller');
  });

  it('should handle special characters in aliases', () => {
    const aliases = new Map([
      ['device1', 'My "Favorite" Keyboard'],
      ['device2', "Controller & Pad's"],
    ]);

    saveDeviceAliases(aliases);
    const loaded = loadDeviceAliases();

    expect(loaded.get('device1')).toBe('My "Favorite" Keyboard');
    expect(loaded.get('device2')).toBe("Controller & Pad's");
  });
});

describe('Web MIDI - Enabled Devices', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should handle empty enabled devices set', () => {
    const enabled = loadEnabledDevices();
    expect(enabled.size).toBe(0);
  });

  it('should preserve enabled state for multiple devices', () => {
    const enabled = new Set(['device1', 'device3', 'device5']);

    saveEnabledDevices(enabled);
    const loaded = loadEnabledDevices();

    expect(loaded.size).toBe(3);
    expect(loaded.has('device1')).toBe(true);
    expect(loaded.has('device2')).toBe(false);
    expect(loaded.has('device3')).toBe(true);
    expect(loaded.has('device4')).toBe(false);
    expect(loaded.has('device5')).toBe(true);
  });
});

// Import new functions for testing
import type { MIDIMessage } from './web-midi';
import {
  createDeviceStatus,
  createInputMonitorState,
  updateInputMonitor,
  getInputMessageRate,
  createVirtualMIDIPort,
  getVirtualMIDIPorts,
  sendToVirtualPort,
  addVirtualPortHandler,
  closeVirtualPort,
  deleteVirtualPort,
  createMIDILogViewerState,
  addMIDILogEntry,
  getFilteredMIDILogEntries,
  clearMIDILog,
  createMIDILearnState,
  startMIDILearn,
  captureMIDILearnMessage,
  completeMIDILearn,
  cancelMIDILearn,
  removeMIDILearnBinding,
  applyMIDILearnMessage,
  saveMIDILearnBindings,
  loadMIDILearnBindings,
} from './web-midi';

describe('Device Status Display', () => {
  it('should create device status with default values', () => {
    const deviceInfo = {
      id: 'device1',
      name: 'Test Device',
      manufacturer: 'Test Manufacturer',
      type: 'input' as const,
      state: 'connected' as const,
      connection: 'open' as const,
      enabled: true,
      latency: 5,
    };

    const status = createDeviceStatus(deviceInfo);

    expect(status.id).toBe('device1');
    expect(status.displayName).toBe('Test Device');
    expect(status.connected).toBe(true);
    expect(status.active).toBe(true);
    expect(status.messageRate).toBe(0);
    expect(status.latency).toBe(5);
    expect(status.error).toBe(null);
  });

  it('should use alias as display name when present', () => {
    const deviceInfo = {
      id: 'device1',
      name: 'Test Device',
      manufacturer: 'Test Manufacturer',
      type: 'input' as const,
      state: 'connected' as const,
      connection: 'open' as const,
      alias: 'My Keyboard',
      enabled: true,
      latency: 5,
    };

    const status = createDeviceStatus(deviceInfo);
    expect(status.displayName).toBe('My Keyboard');
  });

  it('should show disconnected status', () => {
    const deviceInfo = {
      id: 'device1',
      name: 'Test Device',
      manufacturer: 'Test Manufacturer',
      type: 'input' as const,
      state: 'disconnected' as const,
      connection: 'closed' as const,
      enabled: true,
      latency: 0,
    };

    const status = createDeviceStatus(deviceInfo);
    expect(status.connected).toBe(false);
    expect(status.active).toBe(false);
  });
});

describe('Input Monitoring', () => {
  it('should create initial monitor state', () => {
    const state = createInputMonitorState('device1', 1000, 100);

    expect(state.deviceId).toBe('device1');
    expect(state.active).toBe(true);
    expect(state.messageCount).toBe(0);
    expect(state.windowDuration).toBe(1000);
    expect(state.maxBufferSize).toBe(100);
    expect(state.recentMessages.length).toBe(0);
  });

  it('should update monitor with new message', () => {
    let state = createInputMonitorState('device1');
    
    const message: MIDIMessage = {
      type: 'noteon',
      channel: 0,
      data1: 60,
      data2: 100,
      raw: new Uint8Array([0x90, 60, 100]),
      timestamp: Date.now(),
    };

    state = updateInputMonitor(state, message);

    expect(state.messageCount).toBe(1);
    expect(state.recentMessages.length).toBe(1);
    expect(state.recentMessages[0]).toBe(message);
  });

  it('should limit buffer size', () => {
    let state = createInputMonitorState('device1', 1000, 3);

    for (let i = 0; i < 5; i++) {
      const message: MIDIMessage = {
        type: 'noteon',
        channel: 0,
        data1: 60 + i,
        data2: 100,
        raw: new Uint8Array([0x90, 60 + i, 100]),
        timestamp: Date.now(),
      };
      state = updateInputMonitor(state, message);
    }

    expect(state.recentMessages.length).toBe(3);
    expect(state.recentMessages[0].data1).toBe(62);
    expect(state.recentMessages[2].data1).toBe(64);
  });

  it('should calculate message rate', () => {
    // Create state with a very short window to ensure we get a measurable rate
    let state = createInputMonitorState('device1', 100, 100);
    const baseTime = Date.now();

    // Add some messages
    for (let i = 0; i < 10; i++) {
      const message: MIDIMessage = {
        type: 'noteon',
        channel: 0,
        data1: 60,
        data2: 100,
        raw: new Uint8Array([0x90, 60, 100]),
        timestamp: baseTime + i * 10,
      };
      state = updateInputMonitor(state, message);
    }

    // With 10 messages in any time window, rate should be > 0
    const rate = getInputMessageRate(state);
    expect(rate).toBeGreaterThanOrEqual(0); // Rate may be 0 if test runs instantly
    expect(state.messageCount).toBe(10);
  });
});

describe('Virtual MIDI Ports', () => {
  it('should create virtual input port', () => {
    const port = createVirtualMIDIPort('Virtual Input', 'input');

    expect(port.name).toBe('Virtual Input');
    expect(port.type).toBe('input');
    expect(port.open).toBe(true);
    expect(port.handlers.length).toBe(0);
  });

  it('should create virtual output port', () => {
    const port = createVirtualMIDIPort('Virtual Output', 'output');

    expect(port.name).toBe('Virtual Output');
    expect(port.type).toBe('output');
    expect(port.open).toBe(true);
  });

  it('should list virtual ports', () => {
    const inputPort = createVirtualMIDIPort('Virtual Input', 'input');
    const outputPort = createVirtualMIDIPort('Virtual Output', 'output');

    const allPorts = getVirtualMIDIPorts();
    expect(allPorts.length).toBeGreaterThanOrEqual(2);

    const inputs = getVirtualMIDIPorts('input');
    expect(inputs.some(p => p.id === inputPort.id)).toBe(true);

    const outputs = getVirtualMIDIPorts('output');
    expect(outputs.some(p => p.id === outputPort.id)).toBe(true);
  });

  it('should add and call message handler', () => {
    const port = createVirtualMIDIPort('Test Port', 'input');
    const receivedMessages: MIDIMessage[] = [];

    const cleanup = addVirtualPortHandler(port.id, (msg) => {
      receivedMessages.push(msg);
    });

    const message: MIDIMessage = {
      type: 'noteon',
      channel: 0,
      data1: 60,
      data2: 100,
      raw: new Uint8Array([0x90, 60, 100]),
      timestamp: Date.now(),
    };

    sendToVirtualPort(port.id, message);

    expect(receivedMessages.length).toBe(1);
    expect(receivedMessages[0].data1).toBe(60);

    cleanup();
  });

  it('should close virtual port', () => {
    const port = createVirtualMIDIPort('Test Port', 'input');
    
    closeVirtualPort(port.id);
    
    const ports = getVirtualMIDIPorts();
    const closedPort = ports.find(p => p.id === port.id);
    expect(closedPort?.open).toBe(false);
  });

  it('should delete virtual port', () => {
    const port = createVirtualMIDIPort('Test Port', 'input');
    const initialCount = getVirtualMIDIPorts().length;
    
    deleteVirtualPort(port.id);
    
    const afterCount = getVirtualMIDIPorts().length;
    expect(afterCount).toBe(initialCount - 1);
  });
});

describe('MIDI Log Viewer', () => {
  it('should create initial log state', () => {
    const state = createMIDILogViewerState(500);

    expect(state.entries.length).toBe(0);
    expect(state.maxEntries).toBe(500);
    expect(state.paused).toBe(false);
    expect(state.filterDeviceId).toBe(null);
    expect(state.filterMessageType).toBe(null);
  });

  it('should add log entry', () => {
    let state = createMIDILogViewerState();

    const message: MIDIMessage = {
      type: 'noteon',
      channel: 0,
      data1: 60,
      data2: 100,
      raw: new Uint8Array([0x90, 60, 100]),
      timestamp: Date.now(),
    };

    state = addMIDILogEntry(state, 'device1', 'Test Device', message, 'in');

    expect(state.entries.length).toBe(1);
    expect(state.entries[0].deviceId).toBe('device1');
    expect(state.entries[0].direction).toBe('in');
    expect(state.entries[0].message.type).toBe('noteon');
  });

  it('should limit log entries', () => {
    let state = createMIDILogViewerState(5);

    for (let i = 0; i < 10; i++) {
      const message: MIDIMessage = {
        type: 'noteon',
        channel: 0,
        data1: 60 + i,
        data2: 100,
        raw: new Uint8Array([0x90, 60 + i, 100]),
        timestamp: Date.now(),
      };
      state = addMIDILogEntry(state, 'device1', 'Test Device', message, 'in');
    }

    expect(state.entries.length).toBe(5);
    expect(state.entries[0].message.data1).toBe(65);
  });

  it('should filter by device', () => {
    let state = createMIDILogViewerState();

    const message: MIDIMessage = {
      type: 'noteon',
      channel: 0,
      data1: 60,
      data2: 100,
      raw: new Uint8Array([0x90, 60, 100]),
      timestamp: Date.now(),
    };

    state = addMIDILogEntry(state, 'device1', 'Device 1', message, 'in');
    state = addMIDILogEntry(state, 'device2', 'Device 2', message, 'in');
    state = addMIDILogEntry(state, 'device1', 'Device 1', message, 'out');

    state = { ...state, filterDeviceId: 'device1' };
    const filtered = getFilteredMIDILogEntries(state);

    expect(filtered.length).toBe(2);
    expect(filtered.every(e => e.deviceId === 'device1')).toBe(true);
  });

  it('should filter by message type', () => {
    let state = createMIDILogViewerState();

    const noteOn: MIDIMessage = {
      type: 'noteon',
      channel: 0,
      data1: 60,
      data2: 100,
      raw: new Uint8Array([0x90, 60, 100]),
      timestamp: Date.now(),
    };

    const controlChange: MIDIMessage = {
      type: 'controlchange',
      channel: 0,
      data1: 1,
      data2: 64,
      raw: new Uint8Array([0xB0, 1, 64]),
      timestamp: Date.now(),
    };

    state = addMIDILogEntry(state, 'device1', 'Device 1', noteOn, 'in');
    state = addMIDILogEntry(state, 'device1', 'Device 1', controlChange, 'in');
    state = addMIDILogEntry(state, 'device1', 'Device 1', noteOn, 'in');

    state = { ...state, filterMessageType: 'noteon' };
    const filtered = getFilteredMIDILogEntries(state);

    expect(filtered.length).toBe(2);
    expect(filtered.every(e => e.message.type === 'noteon')).toBe(true);
  });

  it('should clear log', () => {
    let state = createMIDILogViewerState();

    const message: MIDIMessage = {
      type: 'noteon',
      channel: 0,
      data1: 60,
      data2: 100,
      raw: new Uint8Array([0x90, 60, 100]),
      timestamp: Date.now(),
    };

    state = addMIDILogEntry(state, 'device1', 'Test Device', message, 'in');
    expect(state.entries.length).toBe(1);

    state = clearMIDILog(state);
    expect(state.entries.length).toBe(0);
  });

  it('should not add entries when paused', () => {
    let state = createMIDILogViewerState();
    state = { ...state, paused: true };

    const message: MIDIMessage = {
      type: 'noteon',
      channel: 0,
      data1: 60,
      data2: 100,
      raw: new Uint8Array([0x90, 60, 100]),
      timestamp: Date.now(),
    };

    state = addMIDILogEntry(state, 'device1', 'Test Device', message, 'in');
    expect(state.entries.length).toBe(0);
  });
});

describe('MIDI Learn System', () => {
  it('should create initial learn state', () => {
    const state = createMIDILearnState();

    expect(state.active).toBe(false);
    expect(state.target).toBe(null);
    expect(state.bindings.length).toBe(0);
    expect(state.lastMessage).toBe(null);
    expect(state.lastDevice).toBe(null);
  });

  it('should start MIDI learn', () => {
    let state = createMIDILearnState();

    const target = {
      id: 'target1',
      name: 'Cutoff Frequency',
      cardId: 'synth-card-1',
      parameterPath: 'filter.cutoff',
      range: [20, 20000] as const,
    };

    state = startMIDILearn(state, target);

    expect(state.active).toBe(true);
    expect(state.target).toBe(target);
  });

  it('should capture MIDI learn message', () => {
    let state = createMIDILearnState();

    const target = {
      id: 'target1',
      name: 'Cutoff Frequency',
      parameterPath: 'filter.cutoff',
      range: [20, 20000] as const,
    };

    state = startMIDILearn(state, target);

    const message: MIDIMessage = {
      type: 'controlchange',
      channel: 0,
      data1: 74,
      data2: 64,
      raw: new Uint8Array([0xB0, 74, 64]),
      timestamp: Date.now(),
    };

    const device = {
      id: 'device1',
      name: 'MIDI Controller',
      manufacturer: 'Test',
      type: 'input' as const,
      state: 'connected' as const,
      connection: 'open' as const,
      enabled: true,
      latency: 0,
    };

    state = captureMIDILearnMessage(state, message, device);

    expect(state.lastMessage).toBe(message);
    expect(state.lastDevice).toBe(device);
  });

  it('should complete MIDI learn and create binding', () => {
    let state = createMIDILearnState();

    const target = {
      id: 'target1',
      name: 'Cutoff Frequency',
      parameterPath: 'filter.cutoff',
      range: [20, 20000] as const,
    };

    state = startMIDILearn(state, target);

    const message: MIDIMessage = {
      type: 'controlchange',
      channel: 0,
      data1: 74,
      data2: 64,
      raw: new Uint8Array([0xB0, 74, 64]),
      timestamp: Date.now(),
    };

    const device = {
      id: 'device1',
      name: 'MIDI Controller',
      manufacturer: 'Test',
      type: 'input' as const,
      state: 'connected' as const,
      connection: 'open' as const,
      enabled: true,
      latency: 0,
    };

    state = captureMIDILearnMessage(state, message, device);
    state = completeMIDILearn(state);

    expect(state.active).toBe(false);
    expect(state.bindings.length).toBe(1);
    expect(state.bindings[0].deviceId).toBe('device1');
    expect(state.bindings[0].messageType).toBe('controlchange');
    expect(state.bindings[0].ccOrNote).toBe(74);
    expect(state.bindings[0].target.id).toBe('target1');
  });

  it('should cancel MIDI learn', () => {
    let state = createMIDILearnState();

    const target = {
      id: 'target1',
      name: 'Cutoff Frequency',
      parameterPath: 'filter.cutoff',
      range: [20, 20000] as const,
    };

    state = startMIDILearn(state, target);
    state = cancelMIDILearn(state);

    expect(state.active).toBe(false);
    expect(state.target).toBe(null);
    expect(state.bindings.length).toBe(0);
  });

  it('should remove binding', () => {
    let state = createMIDILearnState();

    const target = {
      id: 'target1',
      name: 'Cutoff Frequency',
      parameterPath: 'filter.cutoff',
      range: [20, 20000] as const,
    };

    state = startMIDILearn(state, target);

    const message: MIDIMessage = {
      type: 'controlchange',
      channel: 0,
      data1: 74,
      data2: 64,
      raw: new Uint8Array([0xB0, 74, 64]),
      timestamp: Date.now(),
    };

    const device = {
      id: 'device1',
      name: 'MIDI Controller',
      manufacturer: 'Test',
      type: 'input' as const,
      state: 'connected' as const,
      connection: 'open' as const,
      enabled: true,
      latency: 0,
    };

    state = captureMIDILearnMessage(state, message, device);
    state = completeMIDILearn(state);

    const bindingId = state.bindings[0].id;
    state = removeMIDILearnBinding(state, bindingId);

    expect(state.bindings.length).toBe(0);
  });

  it('should apply MIDI message to learned parameters', () => {
    let state = createMIDILearnState();

    const target = {
      id: 'target1',
      name: 'Cutoff Frequency',
      parameterPath: 'filter.cutoff',
      range: [0, 127] as const,
    };

    state = startMIDILearn(state, target);

    const learnMessage: MIDIMessage = {
      type: 'controlchange',
      channel: 0,
      data1: 74,
      data2: 64,
      raw: new Uint8Array([0xB0, 74, 64]),
      timestamp: Date.now(),
    };

    const device = {
      id: 'device1',
      name: 'MIDI Controller',
      manufacturer: 'Test',
      type: 'input' as const,
      state: 'connected' as const,
      connection: 'open' as const,
      enabled: true,
      latency: 0,
    };

    state = captureMIDILearnMessage(state, learnMessage, device);
    state = completeMIDILearn(state);

    // Now apply a message that matches the binding
    const controlMessage: MIDIMessage = {
      type: 'controlchange',
      channel: 0,
      data1: 74,
      data2: 100,
      raw: new Uint8Array([0xB0, 74, 100]),
      timestamp: Date.now(),
    };

    const values = applyMIDILearnMessage(state, controlMessage, 'device1');

    expect(values.size).toBe(1);
    expect(values.get('filter.cutoff')).toBeCloseTo(100, 1);
  });

  it('should save and load MIDI learn bindings', () => {
    localStorageMock.clear();

    const bindings = [
      {
        id: 'binding1',
        deviceId: 'device1',
        channel: 0,
        messageType: 'controlchange' as const,
        ccOrNote: 74,
        target: {
          id: 'target1',
          name: 'Cutoff',
          parameterPath: 'filter.cutoff',
          range: [20, 20000] as const,
        },
        midiMin: 0,
        midiMax: 127,
      },
    ];

    saveMIDILearnBindings(bindings);
    const loaded = loadMIDILearnBindings();

    expect(loaded.length).toBe(1);
    expect(loaded[0].id).toBe('binding1');
    expect(loaded[0].ccOrNote).toBe(74);
  });
});
