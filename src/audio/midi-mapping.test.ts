/**
 * @fileoverview Tests for MIDI Mapping System
 */

import { describe, it, expect } from 'vitest';
import {
  applyCurve,
  mapMIDIToParameter,
  mapParameterToMIDI,
  messageMatchesMapping,
  findMatchingMappings,
  createMapping,
  updateMapping,
  removeMapping,
  addMapping,
  replaceMapping,
  createPreset,
  updatePreset,
  presetToJSON,
  presetFromJSON,
  findDeviceProfile,
  FACTORY_DEVICE_PROFILES,
  createLearnState,
  startLearn,
  stopLearn,
  processLearnMessage,
  createMappingFromLearn,
} from './midi-mapping';
import type { MIDIMessage, MIDIDeviceInfo } from './web-midi';

describe('MIDI Mapping System', () => {
  describe('applyCurve', () => {
    it('applies linear curve', () => {
      expect(applyCurve(0, 'linear')).toBe(0);
      expect(applyCurve(0.5, 'linear')).toBe(0.5);
      expect(applyCurve(1, 'linear')).toBe(1);
    });

    it('applies logarithmic curve', () => {
      const result = applyCurve(0.5, 'log');
      expect(result).toBeGreaterThan(0.5);
      expect(result).toBeLessThan(1);
    });

    it('applies exponential curve', () => {
      const result = applyCurve(0.5, 'exp');
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(0.5);
    });

    it('applies custom curve', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 0.5, y: 0.25 },
        { x: 1, y: 1 },
      ];
      expect(applyCurve(0.5, 'custom', points)).toBe(0.25);
      expect(applyCurve(0.25, 'custom', points)).toBeCloseTo(0.125);
    });

    it('clamps input to 0-1', () => {
      expect(applyCurve(-0.5, 'linear')).toBe(0);
      expect(applyCurve(1.5, 'linear')).toBe(1);
    });
  });

  describe('mapMIDIToParameter', () => {
    it('maps MIDI value to parameter range', () => {
      const mapping = createMapping('param1', 'Test Param', 1, {
        min: 0,
        max: 100,
        default: 50,
        step: 0,
      });

      expect(mapMIDIToParameter(0, mapping)).toBe(0);
      expect(mapMIDIToParameter(64, mapping)).toBeCloseTo(50.39, 1);
      expect(mapMIDIToParameter(127, mapping)).toBe(100);
    });

    it('applies step quantization', () => {
      const mapping = createMapping('param1', 'Test Param', 1, {
        min: 0,
        max: 100,
        default: 50,
        step: 10,
      });

      expect(mapMIDIToParameter(0, mapping)).toBe(0);
      expect(mapMIDIToParameter(64, mapping)).toBe(50);
      expect(mapMIDIToParameter(127, mapping)).toBe(100);
    });

    it('applies inversion', () => {
      const mapping = createMapping(
        'param1',
        'Test Param',
        1,
        { min: 0, max: 100, default: 50, step: 0 },
        { inverted: true }
      );

      expect(mapMIDIToParameter(0, mapping)).toBe(100);
      expect(mapMIDIToParameter(127, mapping)).toBe(0);
    });

    it('applies curve', () => {
      const linearMapping = createMapping(
        'param1',
        'Test Param',
        1,
        { min: 0, max: 100, default: 50, step: 0 },
        { curve: 'linear' }
      );

      const logMapping = createMapping(
        'param1',
        'Test Param',
        1,
        { min: 0, max: 100, default: 50, step: 0 },
        { curve: 'log' }
      );

      const linearResult = mapMIDIToParameter(64, linearMapping);
      const logResult = mapMIDIToParameter(64, logMapping);

      // Log curve should give higher values at mid-range than linear
      expect(logResult).toBeGreaterThan(linearResult);
    });
  });

  describe('messageMatchesMapping', () => {
    const createTestMessage = (
      type: string,
      channel: number,
      data1: number,
      data2: number
    ): MIDIMessage => ({
      type: type as any,
      channel,
      data1,
      data2,
      raw: new Uint8Array([0, data1, data2]),
      timestamp: 0,
    });

    it('matches CC message', () => {
      const mapping = createMapping('param1', 'Test', 1, {
        min: 0,
        max: 100,
        default: 50,
        step: 0,
      });

      const message = createTestMessage('controlchange', 0, 1, 64);
      expect(messageMatchesMapping(message, mapping)).toBe(true);
    });

    it('matches note message', () => {
      const mapping = createMapping(
        'param1',
        'Test',
        60,
        { min: 0, max: 127, default: 64, step: 0 },
        { isNote: true }
      );

      const message = createTestMessage('noteon', 0, 60, 100);
      expect(messageMatchesMapping(message, mapping)).toBe(true);
    });

    it('respects channel filtering', () => {
      const mapping = createMapping(
        'param1',
        'Test',
        1,
        { min: 0, max: 100, default: 50, step: 0 },
        { channel: 0 }
      );

      const matchMessage = createTestMessage('controlchange', 0, 1, 64);
      const noMatchMessage = createTestMessage('controlchange', 1, 1, 64);

      expect(messageMatchesMapping(matchMessage, mapping)).toBe(true);
      expect(messageMatchesMapping(noMatchMessage, mapping)).toBe(false);
    });

    it('supports omni channel', () => {
      const mapping = createMapping(
        'param1',
        'Test',
        1,
        { min: 0, max: 100, default: 50, step: 0 },
        { channel: -1 } // Omni
      );

      const message1 = createTestMessage('controlchange', 0, 1, 64);
      const message2 = createTestMessage('controlchange', 5, 1, 64);
      const message3 = createTestMessage('controlchange', 15, 1, 64);

      expect(messageMatchesMapping(message1, mapping)).toBe(true);
      expect(messageMatchesMapping(message2, mapping)).toBe(true);
      expect(messageMatchesMapping(message3, mapping)).toBe(true);
    });

    it('ignores disabled mappings', () => {
      const mapping = createMapping(
        'param1',
        'Test',
        1,
        { min: 0, max: 100, default: 50, step: 0 },
        { enabled: false }
      );

      const message = createTestMessage('controlchange', 0, 1, 64);
      expect(messageMatchesMapping(message, mapping)).toBe(false);
    });
  });

  describe('mapping management', () => {
    it('creates mapping with defaults', () => {
      const mapping = createMapping('param1', 'Test Param', 1, {
        min: 0,
        max: 100,
        default: 50,
        step: 0,
      });

      expect(mapping.parameterId).toBe('param1');
      expect(mapping.parameterName).toBe('Test Param');
      expect(mapping.ccNumber).toBe(1);
      expect(mapping.channel).toBe(-1); // Omni
      expect(mapping.curve).toBe('linear');
      expect(mapping.enabled).toBe(true);
    });

    it('updates mapping', () => {
      const mapping = createMapping('param1', 'Test', 1, {
        min: 0,
        max: 100,
        default: 50,
        step: 0,
      });

      const updated = updateMapping(mapping, { channel: 5, inverted: true });

      expect(updated.channel).toBe(5);
      expect(updated.inverted).toBe(true);
      expect(updated.parameterId).toBe('param1'); // Other fields unchanged
    });

    it('adds mapping to list', () => {
      const mappings: any[] = [];
      const mapping = createMapping('param1', 'Test', 1, {
        min: 0,
        max: 100,
        default: 50,
        step: 0,
      });

      const updated = addMapping(mappings, mapping);
      expect(updated).toHaveLength(1);
      expect(updated[0]).toBe(mapping);
    });

    it('removes mapping from list', () => {
      const mapping1 = createMapping('param1', 'Test', 1, {
        min: 0,
        max: 100,
        default: 50,
        step: 0,
      });
      const mapping2 = createMapping('param2', 'Test', 2, {
        min: 0,
        max: 100,
        default: 50,
        step: 0,
      });

      const mappings = [mapping1, mapping2];
      const updated = removeMapping(mappings, mapping1.id);

      expect(updated).toHaveLength(1);
      expect(updated[0]).toBe(mapping2);
    });

    it('replaces mapping in list', () => {
      const mapping1 = createMapping('param1', 'Test', 1, {
        min: 0,
        max: 100,
        default: 50,
        step: 0,
      });
      const mapping2 = createMapping('param2', 'Test', 2, {
        min: 0,
        max: 100,
        default: 50,
        step: 0,
      });

      const mappings = [mapping1, mapping2];
      const newMapping = updateMapping(mapping1, { channel: 5 });
      const updated = replaceMapping(mappings, mapping1.id, newMapping);

      expect(updated).toHaveLength(2);
      expect(updated[0].channel).toBe(5);
      expect(updated[1]).toBe(mapping2);
    });
  });

  describe('preset management', () => {
    it('creates preset', () => {
      const mappings = [
        createMapping('param1', 'Test', 1, {
          min: 0,
          max: 100,
          default: 50,
          step: 0,
        }),
      ];

      const preset = createPreset('My Preset', 'Test preset', mappings);

      expect(preset.name).toBe('My Preset');
      expect(preset.description).toBe('Test preset');
      expect(preset.mappings).toBe(mappings);
      expect(preset.isFactory).toBe(false);
    });

    it('serializes and deserializes preset', () => {
      const mappings = [
        createMapping('param1', 'Test', 1, {
          min: 0,
          max: 100,
          default: 50,
          step: 0,
        }),
      ];

      const preset = createPreset('My Preset', 'Test preset', mappings);
      const json = presetToJSON(preset);
      const deserialized = presetFromJSON(json);

      expect(deserialized).not.toBeNull();
      expect(deserialized!.name).toBe(preset.name);
      expect(deserialized!.mappings).toHaveLength(1);
    });

    it('handles invalid JSON', () => {
      expect(presetFromJSON('invalid json')).toBeNull();
      expect(presetFromJSON('{}')).toBeNull();
      expect(presetFromJSON('{"id": "test"}')).toBeNull();
    });
  });

  describe('device profiles', () => {
    it('finds device profile by name pattern', () => {
      const device: MIDIDeviceInfo = {
        id: 'test',
        name: 'MPK mini 3',
        manufacturer: 'AKAI Professional',
        type: 'input',
        state: 'connected',
        connection: 'open',
        enabled: true,
        latency: 0,
      };

      const profile = findDeviceProfile(device);
      expect(profile).not.toBeNull();
      expect(profile!.id).toBe('akai-mpk-mini');
    });

    it('returns generic profile for unknown device', () => {
      const device: MIDIDeviceInfo = {
        id: 'test',
        name: 'Unknown Device',
        manufacturer: 'Unknown',
        type: 'input',
        state: 'connected',
        connection: 'open',
        enabled: true,
        latency: 0,
      };

      const profile = findDeviceProfile(device);
      expect(profile).not.toBeNull();
      expect(profile!.id).toBe('generic-keyboard');
    });
  });

  describe('MIDI learn', () => {
    it('starts learn mode', () => {
      const state = createLearnState();
      const learning = startLearn(state, 'param1', 'Test Param');

      expect(learning.active).toBe(true);
      expect(learning.targetParameter).toBe('param1');
      expect(learning.targetParameterName).toBe('Test Param');
    });

    it('stops learn mode', () => {
      const state = createLearnState();
      const learning = startLearn(state, 'param1', 'Test Param');
      const stopped = stopLearn(learning);

      expect(stopped.active).toBe(false);
      expect(stopped.targetParameter).toBeNull();
    });

    it('processes learn message', () => {
      const state = createLearnState();
      const learning = startLearn(state, 'param1', 'Test Param');

      const message: MIDIMessage = {
        type: 'controlchange',
        channel: 0,
        data1: 1,
        data2: 64,
        raw: new Uint8Array([0xb0, 1, 64]),
        timestamp: 0,
      };

      const processed = processLearnMessage(learning, message);

      expect(processed.lastMessage).toBe(message);
    });

    it('creates mapping from learn', () => {
      const state = createLearnState();
      const learning = startLearn(state, 'param1', 'Test Param');

      const message: MIDIMessage = {
        type: 'controlchange',
        channel: 0,
        data1: 1,
        data2: 64,
        raw: new Uint8Array([0xb0, 1, 64]),
        timestamp: 0,
      };

      const processed = processLearnMessage(learning, message);
      const mapping = createMappingFromLearn(
        processed,
        { min: 0, max: 100, default: 50, step: 0 },
        'device-id'
      );

      expect(mapping).not.toBeNull();
      expect(mapping!.parameterId).toBe('param1');
      expect(mapping!.ccNumber).toBe(1);
      expect(mapping!.channel).toBe(0);
      expect(mapping!.deviceId).toBe('device-id');
    });

    it('does not create mapping without message', () => {
      const state = createLearnState();
      const learning = startLearn(state, 'param1', 'Test Param');

      const mapping = createMappingFromLearn(
        learning,
        { min: 0, max: 100, default: 50, step: 0 },
        null
      );

      expect(mapping).toBeNull();
    });
  });
});
