/**
 * @fileoverview Tests for MIDI Input Handler
 */

import { describe, it, expect, vi } from 'vitest';
import {
  applyVelocityCurve,
  parseNoteMessage,
  parseAftertouchMessage,
  parsePitchBendMessage,
  parseControlChangeMessage,
  parseProgramChangeMessage,
  parseSysexMessage,
  parseMTCMessage,
  parseClockMessage,
  parseSongPositionMessage,
  parseActiveSensingMessage,
  MIDIInputHandler,
  isModWheelMessage,
  isSustainPedalMessage,
  isSustainPressed,
  isBankSelectMessage,
  isNRPNMessage,
  isRPNMessage,
  isAllNotesOffMessage,
  isAllSoundOffMessage,
  isPanicMessage,
  isClockMessage,
  isClockControlMessage,
  CC_MOD_WHEEL,
  CC_SUSTAIN_PEDAL,
  DEFAULT_VELOCITY_CONFIG,
} from './midi-input-handler';
import { createMapping } from './midi-mapping';
import type { MIDIMessage, MIDIDeviceInfo } from './web-midi';

const createTestDevice = (): MIDIDeviceInfo => ({
  id: 'test-device',
  name: 'Test Device',
  manufacturer: 'Test',
  type: 'input',
  state: 'connected',
  connection: 'open',
  enabled: true,
  latency: 0,
});

const createTestMessage = (
  type: string,
  channel: number,
  data1: number,
  data2: number,
  timestamp: number = 0
): MIDIMessage => ({
  type: type as any,
  channel,
  data1,
  data2,
  raw: new Uint8Array([0, data1, data2]),
  timestamp,
});

describe('MIDI Input Handler', () => {
  describe('applyVelocityCurve', () => {
    it('preserves note off (velocity 0)', () => {
      expect(applyVelocityCurve(0, DEFAULT_VELOCITY_CONFIG)).toBe(0);
      expect(
        applyVelocityCurve(0, { ...DEFAULT_VELOCITY_CONFIG, curve: 'soft' })
      ).toBe(0);
    });

    it('applies linear curve', () => {
      const config = { ...DEFAULT_VELOCITY_CONFIG, curve: 'linear' as const };
      expect(applyVelocityCurve(64, config)).toBe(64);
      expect(applyVelocityCurve(127, config)).toBe(127);
    });

    it('applies soft curve', () => {
      const config = { ...DEFAULT_VELOCITY_CONFIG, curve: 'soft' as const };
      const result = applyVelocityCurve(64, config);
      expect(result).toBeGreaterThan(64);
      expect(result).toBeLessThanOrEqual(127);
    });

    it('applies hard curve', () => {
      const config = { ...DEFAULT_VELOCITY_CONFIG, curve: 'hard' as const };
      const result = applyVelocityCurve(64, config);
      expect(result).toBeLessThan(64);
      expect(result).toBeGreaterThanOrEqual(1);
    });

    it('applies fixed velocity', () => {
      const config = {
        ...DEFAULT_VELOCITY_CONFIG,
        curve: 'fixed' as const,
        fixedValue: 100,
      };
      expect(applyVelocityCurve(30, config)).toBe(100);
      expect(applyVelocityCurve(80, config)).toBe(100);
      expect(applyVelocityCurve(127, config)).toBe(100);
    });

    it('respects min/max velocity', () => {
      const config = {
        ...DEFAULT_VELOCITY_CONFIG,
        minVelocity: 40,
        maxVelocity: 100,
      };
      const result1 = applyVelocityCurve(1, config);
      const result2 = applyVelocityCurve(127, config);
      expect(result1).toBeGreaterThanOrEqual(40);
      expect(result2).toBeLessThanOrEqual(100);
    });
  });

  describe('parseNoteMessage', () => {
    const device = createTestDevice();

    it('parses note on', () => {
      const message = createTestMessage('noteon', 0, 60, 100);
      const event = parseNoteMessage(message, device);

      expect(event.note).toBe(60);
      expect(event.velocity).toBe(100);
      expect(event.channel).toBe(0);
      expect(event.isNoteOn).toBe(true);
      expect(event.device).toBe(device);
    });

    it('parses note off', () => {
      const message = createTestMessage('noteoff', 0, 60, 0);
      const event = parseNoteMessage(message, device);

      expect(event.note).toBe(60);
      expect(event.velocity).toBe(0);
      expect(event.isNoteOn).toBe(false);
    });

    it('treats note on with velocity 0 as note off', () => {
      const message = createTestMessage('noteon', 0, 60, 0);
      const event = parseNoteMessage(message, device);

      expect(event.velocity).toBe(0);
      expect(event.isNoteOn).toBe(false);
    });

    it('applies velocity curve', () => {
      const message = createTestMessage('noteon', 0, 60, 64);
      const config = { ...DEFAULT_VELOCITY_CONFIG, curve: 'soft' as const };
      const event = parseNoteMessage(message, device, config);

      expect(event.velocity).toBeGreaterThan(64);
    });
  });

  describe('parseAftertouchMessage', () => {
    const device = createTestDevice();

    it('parses channel aftertouch', () => {
      const message = createTestMessage('channelaftertouch', 0, 80, 0);
      const event = parseAftertouchMessage(message, device);

      expect(event.note).toBe(-1);
      expect(event.pressure).toBe(80);
      expect(event.channel).toBe(0);
      expect(event.isPolyphonic).toBe(false);
    });

    it('parses polyphonic aftertouch', () => {
      const message = createTestMessage('polyaftertouch', 0, 60, 90);
      const event = parseAftertouchMessage(message, device);

      expect(event.note).toBe(60);
      expect(event.pressure).toBe(90);
      expect(event.isPolyphonic).toBe(true);
    });
  });

  describe('parsePitchBendMessage', () => {
    const device = createTestDevice();

    it('parses pitch bend center', () => {
      const message = createTestMessage('pitchbend', 0, 0, 64);
      const event = parsePitchBendMessage(message, device);

      expect(event.value).toBe(0);
      expect(event.normalized).toBe(0);
    });

    it('parses pitch bend max up', () => {
      const message = createTestMessage('pitchbend', 0, 127, 127);
      const event = parsePitchBendMessage(message, device);

      expect(event.value).toBe(8191);
      expect(event.normalized).toBeCloseTo(1.0, 2);
    });

    it('parses pitch bend max down', () => {
      const message = createTestMessage('pitchbend', 0, 0, 0);
      const event = parsePitchBendMessage(message, device);

      expect(event.value).toBe(-8192);
      expect(event.normalized).toBe(-1.0);
    });
  });

  describe('parseControlChangeMessage', () => {
    const device = createTestDevice();

    it('parses CC message', () => {
      const message = createTestMessage('controlchange', 0, 1, 64);
      const event = parseControlChangeMessage(message, device);

      expect(event.controller).toBe(1);
      expect(event.value).toBe(64);
      expect(event.normalized).toBeCloseTo(0.504, 2);
      expect(event.name).toBe('Modulation Wheel');
    });

    it('includes CC name if known', () => {
      const message = createTestMessage('controlchange', 0, CC_MOD_WHEEL, 64);
      const event = parseControlChangeMessage(message, device);

      expect(event.name).toBe('Modulation Wheel');
    });

    it('omits CC name if unknown', () => {
      const message = createTestMessage('controlchange', 0, 50, 64);
      const event = parseControlChangeMessage(message, device);

      expect(event.name).toBeUndefined();
    });
  });

  describe('parseProgramChangeMessage', () => {
    const device = createTestDevice();

    it('parses program change', () => {
      const message = createTestMessage('programchange', 0, 42, 0);
      const event = parseProgramChangeMessage(message, device);

      expect(event.program).toBe(42);
      expect(event.channel).toBe(0);
    });
  });

  describe('MIDIInputHandler', () => {
    it('calls note callback', () => {
      const onNote = vi.fn();
      const handler = new MIDIInputHandler({ onNote });
      const device = createTestDevice();
      const message = createTestMessage('noteon', 0, 60, 100);

      handler.handleMessage(message, device);

      expect(onNote).toHaveBeenCalledTimes(1);
      expect(onNote).toHaveBeenCalledWith(
        expect.objectContaining({
          note: 60,
          velocity: 100,
          isNoteOn: true,
        })
      );
    });

    it('calls aftertouch callback', () => {
      const onAftertouch = vi.fn();
      const handler = new MIDIInputHandler({ onAftertouch });
      const device = createTestDevice();
      const message = createTestMessage('channelaftertouch', 0, 80, 0);

      handler.handleMessage(message, device);

      expect(onAftertouch).toHaveBeenCalledTimes(1);
      expect(onAftertouch).toHaveBeenCalledWith(
        expect.objectContaining({
          pressure: 80,
          isPolyphonic: false,
        })
      );
    });

    it('calls pitch bend callback', () => {
      const onPitchBend = vi.fn();
      const handler = new MIDIInputHandler({ onPitchBend });
      const device = createTestDevice();
      const message = createTestMessage('pitchbend', 0, 0, 64);

      handler.handleMessage(message, device);

      expect(onPitchBend).toHaveBeenCalledTimes(1);
      expect(onPitchBend).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 0,
          normalized: 0,
        })
      );
    });

    it('calls control change callback', () => {
      const onControlChange = vi.fn();
      const handler = new MIDIInputHandler({ onControlChange });
      const device = createTestDevice();
      const message = createTestMessage('controlchange', 0, 1, 64);

      handler.handleMessage(message, device);

      expect(onControlChange).toHaveBeenCalledTimes(1);
      expect(onControlChange).toHaveBeenCalledWith(
        expect.objectContaining({
          controller: 1,
          value: 64,
        })
      );
    });

    it('calls program change callback', () => {
      const onProgramChange = vi.fn();
      const handler = new MIDIInputHandler({ onProgramChange });
      const device = createTestDevice();
      const message = createTestMessage('programchange', 0, 42, 0);

      handler.handleMessage(message, device);

      expect(onProgramChange).toHaveBeenCalledTimes(1);
      expect(onProgramChange).toHaveBeenCalledWith(
        expect.objectContaining({
          program: 42,
        })
      );
    });

    it('calls parameter update callback for mapped CC', () => {
      const onParameterUpdate = vi.fn();
      const mapping = createMapping('param1', 'Test Param', 1, {
        min: 0,
        max: 100,
        default: 50,
        step: 0,
      });
      const handler = new MIDIInputHandler({ onParameterUpdate }, [mapping]);
      const device = createTestDevice();
      const message = createTestMessage('controlchange', 0, 1, 64);

      handler.handleMessage(message, device);

      expect(onParameterUpdate).toHaveBeenCalledTimes(1);
      expect(onParameterUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          parameterId: 'param1',
          parameterName: 'Test Param',
          value: expect.any(Number),
        })
      );
    });

    it('updates mappings dynamically', () => {
      const onParameterUpdate = vi.fn();
      const handler = new MIDIInputHandler({ onParameterUpdate });
      const device = createTestDevice();
      const message = createTestMessage('controlchange', 0, 1, 64);

      // No mappings initially
      handler.handleMessage(message, device);
      expect(onParameterUpdate).not.toHaveBeenCalled();

      // Add mapping
      const mapping = createMapping('param1', 'Test Param', 1, {
        min: 0,
        max: 100,
        default: 50,
        step: 0,
      });
      handler.setMappings([mapping]);

      // Should now trigger callback
      handler.handleMessage(message, device);
      expect(onParameterUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('convenience functions', () => {
    it('identifies mod wheel messages', () => {
      const modMessage = createTestMessage('controlchange', 0, CC_MOD_WHEEL, 64);
      const otherMessage = createTestMessage('controlchange', 0, 10, 64);

      expect(isModWheelMessage(modMessage)).toBe(true);
      expect(isModWheelMessage(otherMessage)).toBe(false);
    });

    it('identifies sustain pedal messages', () => {
      const sustainMessage = createTestMessage('controlchange', 0, CC_SUSTAIN_PEDAL, 127);
      const otherMessage = createTestMessage('controlchange', 0, 10, 64);

      expect(isSustainPedalMessage(sustainMessage)).toBe(true);
      expect(isSustainPedalMessage(otherMessage)).toBe(false);
    });

    it('detects sustain pressed', () => {
      expect(isSustainPressed(0)).toBe(false);
      expect(isSustainPressed(63)).toBe(false);
      expect(isSustainPressed(64)).toBe(true);
      expect(isSustainPressed(127)).toBe(true);
    });
  });

  describe('Bank Select Handling', () => {
    it('tracks bank select MSB', () => {
      const handler = new MIDIInputHandler();
      const device = createTestDevice();
      
      const onProgramChange = vi.fn();
      handler.setCallbacks({ onProgramChange });
      
      // Send bank select MSB
      const bankMSB = createTestMessage('controlchange', 0, 0, 5);
      handler.handleMessage(bankMSB, device);
      
      // Send program change
      const pc = createTestMessage('programchange', 0, 10, 0);
      handler.handleMessage(pc, device);
      
      expect(onProgramChange).toHaveBeenCalledWith(
        expect.objectContaining({
          program: 10,
          bankMSB: 5,
        })
      );
    });

    it('tracks bank select LSB', () => {
      const handler = new MIDIInputHandler();
      const device = createTestDevice();
      
      const onProgramChange = vi.fn();
      handler.setCallbacks({ onProgramChange });
      
      // Send bank select LSB
      const bankLSB = createTestMessage('controlchange', 0, 32, 7);
      handler.handleMessage(bankLSB, device);
      
      // Send program change
      const pc = createTestMessage('programchange', 0, 10, 0);
      handler.handleMessage(pc, device);
      
      expect(onProgramChange).toHaveBeenCalledWith(
        expect.objectContaining({
          program: 10,
          bankLSB: 7,
        })
      );
    });

    it('tracks both bank MSB and LSB', () => {
      const handler = new MIDIInputHandler();
      const device = createTestDevice();
      
      const onProgramChange = vi.fn();
      handler.setCallbacks({ onProgramChange });
      
      // Send bank select MSB and LSB
      const bankMSB = createTestMessage('controlchange', 0, 0, 5);
      const bankLSB = createTestMessage('controlchange', 0, 32, 7);
      handler.handleMessage(bankMSB, device);
      handler.handleMessage(bankLSB, device);
      
      // Send program change
      const pc = createTestMessage('programchange', 0, 10, 0);
      handler.handleMessage(pc, device);
      
      expect(onProgramChange).toHaveBeenCalledWith(
        expect.objectContaining({
          program: 10,
          bankMSB: 5,
          bankLSB: 7,
        })
      );
    });
  });

  describe('NRPN/RPN Handling', () => {
    it('handles NRPN messages', () => {
      const handler = new MIDIInputHandler();
      const device = createTestDevice();
      
      const onNRPNRPN = vi.fn();
      handler.setCallbacks({ onNRPNRPN });
      
      // Send NRPN MSB
      const nrpnMSB = createTestMessage('controlchange', 0, 99, 1);
      handler.handleMessage(nrpnMSB, device);
      
      // Send NRPN LSB
      const nrpnLSB = createTestMessage('controlchange', 0, 98, 2);
      handler.handleMessage(nrpnLSB, device);
      
      // Send data entry MSB
      const dataMSB = createTestMessage('controlchange', 0, 6, 64);
      handler.handleMessage(dataMSB, device);
      
      expect(onNRPNRPN).toHaveBeenCalledWith(
        expect.objectContaining({
          isNRPN: true,
          parameter: (1 << 7) | 2,
          value: 64 << 7,
        })
      );
    });

    it('handles RPN messages', () => {
      const handler = new MIDIInputHandler();
      const device = createTestDevice();
      
      const onNRPNRPN = vi.fn();
      handler.setCallbacks({ onNRPNRPN });
      
      // Send RPN MSB
      const rpnMSB = createTestMessage('controlchange', 0, 101, 0);
      handler.handleMessage(rpnMSB, device);
      
      // Send RPN LSB  
      const rpnLSB = createTestMessage('controlchange', 0, 100, 0);
      handler.handleMessage(rpnLSB, device);
      
      // Send data entry MSB
      const dataMSB = createTestMessage('controlchange', 0, 6, 64);
      handler.handleMessage(dataMSB, device);
      
      expect(onNRPNRPN).toHaveBeenCalledWith(
        expect.objectContaining({
          isNRPN: false,
          parameter: 0,
          value: 64 << 7,
        })
      );
    });
  });

  describe('System Messages', () => {
    it('handles sysex messages', () => {
      const handler = new MIDIInputHandler();
      const device = createTestDevice();
      
      const onSysex = vi.fn();
      handler.setCallbacks({ onSysex });
      
      // Create sysex message: F0 7E 00 01 02 F7 (1-byte manufacturer ID)
      const sysexMessage: MIDIMessage = {
        type: 'sysex',
        channel: 0,
        data1: 0,
        data2: 0,
        raw: new Uint8Array([0xF0, 0x7E, 0x01, 0x02, 0xF7]),
        timestamp: 1000,
      };
      
      handler.handleMessage(sysexMessage, device);
      
      expect(onSysex).toHaveBeenCalledWith(
        expect.objectContaining({
          manufacturerId: [0x7E],
          timestamp: 1000,
        })
      );
    });

    it('handles MTC quarter frame messages', () => {
      const handler = new MIDIInputHandler();
      const device = createTestDevice();
      
      const onMTC = vi.fn();
      handler.setCallbacks({ onMTC });
      
      const mtcMessage: MIDIMessage = {
        type: 'timecode',
        channel: 0,
        data1: 0x35, // Type 3, value 5
        data2: 0,
        raw: new Uint8Array([0xF1, 0x35]),
        timestamp: 1000,
      };
      
      handler.handleMessage(mtcMessage, device);
      
      expect(onMTC).toHaveBeenCalledWith(
        expect.objectContaining({
          messageType: 3,
          value: 5,
        })
      );
    });

    it('handles clock messages', () => {
      const handler = new MIDIInputHandler();
      const device = createTestDevice();
      
      const onClock = vi.fn();
      handler.setCallbacks({ onClock });
      
      const clockMessage: MIDIMessage = {
        type: 'clock',
        channel: 0,
        data1: 0,
        data2: 0,
        raw: new Uint8Array([0xF8]),
        timestamp: 1000,
      };
      
      handler.handleMessage(clockMessage, device);
      
      expect(onClock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'clock',
        })
      );
    });

    it('handles clock control messages', () => {
      const handler = new MIDIInputHandler();
      const device = createTestDevice();
      
      const onClock = vi.fn();
      handler.setCallbacks({ onClock });
      
      // Start
      const startMessage: MIDIMessage = {
        type: 'start',
        channel: 0,
        data1: 0,
        data2: 0,
        raw: new Uint8Array([0xFA]),
        timestamp: 1000,
      };
      handler.handleMessage(startMessage, device);
      
      expect(onClock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'start',
        })
      );
      
      onClock.mockClear();
      
      // Continue
      const continueMessage: MIDIMessage = {
        type: 'continue',
        channel: 0,
        data1: 0,
        data2: 0,
        raw: new Uint8Array([0xFB]),
        timestamp: 1000,
      };
      handler.handleMessage(continueMessage, device);
      
      expect(onClock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'continue',
        })
      );
      
      onClock.mockClear();
      
      // Stop
      const stopMessage: MIDIMessage = {
        type: 'stop',
        channel: 0,
        data1: 0,
        data2: 0,
        raw: new Uint8Array([0xFC]),
        timestamp: 1000,
      };
      handler.handleMessage(stopMessage, device);
      
      expect(onClock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'stop',
        })
      );
    });

    it('handles song position pointer', () => {
      const handler = new MIDIInputHandler();
      const device = createTestDevice();
      
      const onSongPosition = vi.fn();
      handler.setCallbacks({ onSongPosition });
      
      // Position 256 = LSB: 0, MSB: 2
      const sppMessage: MIDIMessage = {
        type: 'songposition',
        channel: 0,
        data1: 0,
        data2: 2,
        raw: new Uint8Array([0xF2, 0, 2]),
        timestamp: 1000,
      };
      
      handler.handleMessage(sppMessage, device);
      
      expect(onSongPosition).toHaveBeenCalledWith(
        expect.objectContaining({
          position: 256,
        })
      );
    });

    it('handles active sensing', () => {
      const handler = new MIDIInputHandler();
      const device = createTestDevice();
      
      const onActiveSensing = vi.fn();
      handler.setCallbacks({ onActiveSensing });
      
      const asMessage: MIDIMessage = {
        type: 'activesensing',
        channel: 0,
        data1: 0,
        data2: 0,
        raw: new Uint8Array([0xFE]),
        timestamp: 1000,
      };
      
      handler.handleMessage(asMessage, device);
      
      expect(onActiveSensing).toHaveBeenCalled();
    });
  });
});
