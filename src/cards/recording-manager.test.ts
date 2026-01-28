/**
 * @fileoverview Tests for Recording Manager.
 * 
 * Ensures that cards work correctly in both real-time playback
 * and recording modes for viewing in editors.
 */

import { describe, it, expect } from 'vitest';
import {
  createRecordingBuffer,
  addEventToBuffer,
  stopRecording,
  bufferToStream,
  createRecordingState,
  startRecordingBuffer,
  stopRecordingBuffer,
  recordEvent,
  updateRecordingState,
  getBuffer,
  removeBuffer,
  shouldCaptureEvents,
  shouldOutputRealtime,
  getEffectiveMode,
  routeOutput,
  checkRecordingSupport,
  recordMIDICC,
  recordAftertouch,
  recordPitchBend,
  recordModWheel,
  recordExpression,
  createRetrospectiveBuffer,
  addToRetrospectiveBuffer,
  captureRetrospective,
  clearRetrospectiveBuffer,
  type RecordingMode,
  type RecordedEvent,
  type MIDICCEvent,
  type AftertouchEvent,
  type PitchBendEvent,
  type ModWheelEvent,
  type ExpressionEvent,
} from './recording-manager';
import { createCardContext } from './card';
import type { Event } from '../events';
import type { Tick } from '../types/primitives';

describe('Recording Manager', () => {
  // ============================================================================
  // RECORDING BUFFER TESTS
  // ============================================================================

  describe('createRecordingBuffer', () => {
    it('creates a new recording buffer with default mode', () => {
      const buffer = createRecordingBuffer('test-buffer', 0 as Tick);
      expect(buffer.id).toBe('test-buffer');
      expect(buffer.startTick).toBe(0);
      expect(buffer.events).toEqual([]);
      expect(buffer.active).toBe(true);
      expect(buffer.mode).toBe('recording');
    });

    it('creates buffer with custom mode', () => {
      const buffer = createRecordingBuffer('test', 100 as Tick, 'both');
      expect(buffer.mode).toBe('both');
      expect(buffer.startTick).toBe(100);
    });
  });

  describe('addEventToBuffer', () => {
    it('adds event with recording metadata', () => {
      const buffer = createRecordingBuffer<{ pitch: number }>('test', 0 as Tick);
      const event: Event<{ pitch: number }> = {
        id: 'evt1',
        kind: 'note',
        start: 10 as Tick,
        duration: 5 as Tick,
        payload: { pitch: 60 },
      };

      const updated = addEventToBuffer(buffer, event, 100 as Tick, 'card-123');
      
      expect(updated.events).toHaveLength(1);
      const recorded = updated.events[0] as RecordedEvent<{ pitch: number }>;
      expect(recorded.id).toBe('evt1');
      expect(recorded.recordedAt).toBe(100);
      expect(recorded.sourceCardId).toBe('card-123');
      expect(recorded.payload.pitch).toBe(60);
    });

    it('does not add events to inactive buffer', () => {
      const buffer = createRecordingBuffer('test', 0 as Tick);
      const stopped = stopRecording(buffer);
      const event: Event = {
        id: 'evt1',
        kind: 'note',
        start: 10 as Tick,
        duration: 5 as Tick,
        payload: {},
      };

      const result = addEventToBuffer(stopped, event, 100 as Tick, 'card-123');
      expect(result.events).toHaveLength(0);
    });

    it('preserves immutability', () => {
      const buffer = createRecordingBuffer('test', 0 as Tick);
      const event: Event = {
        id: 'evt1',
        kind: 'note',
        start: 10 as Tick,
        duration: 5 as Tick,
        payload: {},
      };

      const updated = addEventToBuffer(buffer, event, 100 as Tick, 'card-123');
      expect(buffer.events).toHaveLength(0);
      expect(updated.events).toHaveLength(1);
    });
  });

  describe('stopRecording', () => {
    it('marks buffer as inactive', () => {
      const buffer = createRecordingBuffer('test', 0 as Tick);
      const stopped = stopRecording(buffer);
      expect(stopped.active).toBe(false);
      expect(buffer.active).toBe(true); // Original unchanged
    });
  });

  describe('bufferToStream', () => {
    it('converts buffer to sorted stream', () => {
      let buffer = createRecordingBuffer<{ value: number }>('test', 0 as Tick);
      
      const event1: Event<{ value: number }> = {
        id: 'evt1',
        kind: 'note',
        start: 20 as Tick,
        duration: 5 as Tick,
        payload: { value: 1 },
      };
      const event2: Event<{ value: number }> = {
        id: 'evt2',
        kind: 'note',
        start: 10 as Tick,
        duration: 5 as Tick,
        payload: { value: 2 },
      };

      buffer = addEventToBuffer(buffer, event1, 100 as Tick, 'card-123');
      buffer = addEventToBuffer(buffer, event2, 110 as Tick, 'card-123');

      const stream = bufferToStream(buffer);
      expect(stream.events).toHaveLength(2);
      expect(stream.events[0]?.id).toBe('evt2'); // Earlier start time
      expect(stream.events[1]?.id).toBe('evt1');
    });
  });

  // ============================================================================
  // RECORDING STATE TESTS
  // ============================================================================

  describe('createRecordingState', () => {
    it('creates initial state', () => {
      const state = createRecordingState();
      expect(state.buffers).toEqual([]);
      expect(state.recording).toBe(false);
      expect(state.currentTick).toBe(0);
    });

    it('accepts initial tick', () => {
      const state = createRecordingState(500 as Tick);
      expect(state.currentTick).toBe(500);
    });
  });

  describe('startRecordingBuffer', () => {
    it('adds new buffer to state', () => {
      const state = createRecordingState(100 as Tick);
      const updated = startRecordingBuffer(state, 'buffer1');
      
      expect(updated.buffers).toHaveLength(1);
      expect(updated.buffers[0]?.id).toBe('buffer1');
      expect(updated.buffers[0]?.startTick).toBe(100);
    });

    it('supports multiple buffers', () => {
      let state = createRecordingState();
      state = startRecordingBuffer(state, 'buffer1');
      state = startRecordingBuffer(state, 'buffer2');
      
      expect(state.buffers).toHaveLength(2);
    });
  });

  describe('stopRecordingBuffer', () => {
    it('stops specific buffer', () => {
      let state = createRecordingState();
      state = startRecordingBuffer(state, 'buffer1');
      state = startRecordingBuffer(state, 'buffer2');
      
      const stopped = stopRecordingBuffer(state, 'buffer1');
      expect(stopped.buffers[0]?.active).toBe(false);
      expect(stopped.buffers[1]?.active).toBe(true);
    });
  });

  describe('recordEvent', () => {
    it('adds event to specific buffer', () => {
      let state = createRecordingState(100 as Tick);
      state = startRecordingBuffer(state, 'buffer1');
      
      const event: Event = {
        id: 'evt1',
        kind: 'note',
        start: 10 as Tick,
        duration: 5 as Tick,
        payload: { pitch: 60 },
      };

      const updated = recordEvent(state, 'buffer1', event, 'card-123');
      const buffer = getBuffer(updated, 'buffer1');
      
      expect(buffer?.events).toHaveLength(1);
      expect(buffer?.events[0]?.id).toBe('evt1');
    });
  });

  describe('updateRecordingState', () => {
    it('syncs state with transport', () => {
      const state = createRecordingState();
      const transport = {
        playing: true,
        recording: true,
        tempo: 120,
        timeSignature: [4, 4] as const,
        looping: false,
      };

      const updated = updateRecordingState(state, transport, 200 as Tick);
      expect(updated.recording).toBe(true);
      expect(updated.currentTick).toBe(200);
    });
  });

  describe('getBuffer', () => {
    it('retrieves buffer by ID', () => {
      let state = createRecordingState();
      state = startRecordingBuffer(state, 'target');
      state = startRecordingBuffer(state, 'other');
      
      const buffer = getBuffer(state, 'target');
      expect(buffer?.id).toBe('target');
    });

    it('returns undefined for missing buffer', () => {
      const state = createRecordingState();
      const buffer = getBuffer(state, 'nonexistent');
      expect(buffer).toBeUndefined();
    });
  });

  describe('removeBuffer', () => {
    it('removes buffer by ID', () => {
      let state = createRecordingState();
      state = startRecordingBuffer(state, 'buffer1');
      state = startRecordingBuffer(state, 'buffer2');
      
      const updated = removeBuffer(state, 'buffer1');
      expect(updated.buffers).toHaveLength(1);
      expect(updated.buffers[0]?.id).toBe('buffer2');
    });
  });

  // ============================================================================
  // RECORDING MODE DETECTION
  // ============================================================================

  describe('shouldCaptureEvents', () => {
    it('returns true when transport is recording', () => {
      const context = createCardContext(
        0 as Tick,
        {
          playing: true,
          recording: true,
          tempo: 120,
          timeSignature: [4, 4] as const,
          looping: false,
        },
        { sampleRate: 48000, bufferSize: 128 }
      );

      expect(shouldCaptureEvents(context)).toBe(true);
    });

    it('returns false when transport is not recording', () => {
      const context = createCardContext(
        0 as Tick,
        {
          playing: true,
          recording: false,
          tempo: 120,
          timeSignature: [4, 4] as const,
          looping: false,
        },
        { sampleRate: 48000, bufferSize: 128 }
      );

      expect(shouldCaptureEvents(context)).toBe(false);
    });
  });

  describe('shouldOutputRealtime', () => {
    it('outputs realtime in playback mode always', () => {
      const context = createCardContext(
        0 as Tick,
        {
          playing: true,
          recording: false,
          tempo: 120,
          timeSignature: [4, 4] as const,
          looping: false,
        },
        { sampleRate: 48000, bufferSize: 128 }
      );

      expect(shouldOutputRealtime(context, 'playback')).toBe(true);
    });

    it('suppresses realtime in pure recording mode', () => {
      const context = createCardContext(
        0 as Tick,
        {
          playing: true,
          recording: true,
          tempo: 120,
          timeSignature: [4, 4] as const,
          looping: false,
        },
        { sampleRate: 48000, bufferSize: 128 }
      );

      expect(shouldOutputRealtime(context, 'recording')).toBe(false);
    });

    it('outputs realtime in both mode even when recording', () => {
      const context = createCardContext(
        0 as Tick,
        {
          playing: true,
          recording: true,
          tempo: 120,
          timeSignature: [4, 4] as const,
          looping: false,
        },
        { sampleRate: 48000, bufferSize: 128 }
      );

      expect(shouldOutputRealtime(context, 'both')).toBe(true);
    });
  });

  describe('getEffectiveMode', () => {
    it('returns playback when not recording', () => {
      const context = createCardContext(
        0 as Tick,
        {
          playing: true,
          recording: false,
          tempo: 120,
          timeSignature: [4, 4] as const,
          looping: false,
        },
        { sampleRate: 48000, bufferSize: 128 }
      );

      expect(getEffectiveMode(context, 'both')).toBe('playback');
      expect(getEffectiveMode(context, 'recording')).toBe('playback');
    });

    it('respects card mode when recording', () => {
      const context = createCardContext(
        0 as Tick,
        {
          playing: true,
          recording: true,
          tempo: 120,
          timeSignature: [4, 4] as const,
          looping: false,
        },
        { sampleRate: 48000, bufferSize: 128 }
      );

      expect(getEffectiveMode(context, 'both')).toBe('both');
      expect(getEffectiveMode(context, 'recording')).toBe('recording');
    });
  });

  // ============================================================================
  // OUTPUT ROUTING
  // ============================================================================

  describe('routeOutput', () => {
    it('routes to realtime only in playback mode', () => {
      const context = createCardContext(
        0 as Tick,
        {
          playing: true,
          recording: false,
          tempo: 120,
          timeSignature: [4, 4] as const,
          looping: false,
        },
        { sampleRate: 48000, bufferSize: 128 }
      );

      const routed = routeOutput({ value: 42 }, context, 'playback');
      expect(routed.realtime).toEqual({ value: 42 });
      expect(routed.recorded).toBeUndefined();
      expect(routed.eventsCaptured).toBe(false);
    });

    it('routes to recorded only in recording mode', () => {
      const context = createCardContext(
        0 as Tick,
        {
          playing: true,
          recording: true,
          tempo: 120,
          timeSignature: [4, 4] as const,
          looping: false,
        },
        { sampleRate: 48000, bufferSize: 128 }
      );

      const routed = routeOutput({ value: 42 }, context, 'recording');
      expect(routed.realtime).toBeUndefined();
      expect(routed.recorded).toEqual({ value: 42 });
      expect(routed.eventsCaptured).toBe(true);
    });

    it('routes to both in both mode', () => {
      const context = createCardContext(
        0 as Tick,
        {
          playing: true,
          recording: true,
          tempo: 120,
          timeSignature: [4, 4] as const,
          looping: false,
        },
        { sampleRate: 48000, bufferSize: 128 }
      );

      const routed = routeOutput({ value: 42 }, context, 'both');
      expect(routed.realtime).toEqual({ value: 42 });
      expect(routed.recorded).toEqual({ value: 42 });
      expect(routed.eventsCaptured).toBe(true);
    });
  });

  // ============================================================================
  // RECORDING SUPPORT VALIDATION
  // ============================================================================

  describe('checkRecordingSupport', () => {
    it('detects full support with audio and event outputs', () => {
      const signature = {
        outputs: [
          { name: 'audio', type: 'audio' },
          { name: 'notes', type: 'notes' },
        ],
      };

      const support = checkRecordingSupport(signature);
      expect(support.outputsEvents).toBe(true);
      expect(support.outputsAudio).toBe(true);
      expect(support.supportedModes).toContain('playback');
      expect(support.supportedModes).toContain('recording');
      expect(support.supportedModes).toContain('both');
    });

    it('detects audio-only (no recording support)', () => {
      const signature = {
        outputs: [
          { name: 'audio', type: 'audio' },
        ],
      };

      const support = checkRecordingSupport(signature);
      expect(support.outputsEvents).toBe(false);
      expect(support.outputsAudio).toBe(true);
      expect(support.supportedModes).toEqual(['playback']);
    });

    it('detects events-only support', () => {
      const signature = {
        outputs: [
          { name: 'events', type: 'stream' },
        ],
      };

      const support = checkRecordingSupport(signature);
      expect(support.outputsEvents).toBe(true);
      expect(support.outputsAudio).toBe(false);
      expect(support.supportedModes).toContain('recording');
    });

    it('handles cards with no outputs', () => {
      const signature = {
        outputs: [],
      };

      const support = checkRecordingSupport(signature);
      expect(support.outputsEvents).toBe(false);
      expect(support.outputsAudio).toBe(false);
      expect(support.supportedModes).toEqual(['playback']);
    });
  });

  // ============================================================================
  // MIDI CC RECORDING TESTS
  // ============================================================================

  describe('MIDI CC Recording', () => {
    it('records MIDI CC events', () => {
      let state = createRecordingState(100 as Tick);
      state = startRecordingBuffer(state, 'midi-buffer', 'recording');

      const ccEvent: MIDICCEvent = {
        ccNumber: 7,
        value: 100,
        channel: 0,
      };

      state = recordMIDICC(state, 'midi-buffer', ccEvent, 'midi-input-card');

      const buffer = getBuffer(state, 'midi-buffer');
      expect(buffer).toBeDefined();
      expect(buffer!.events).toHaveLength(1);
      
      const recorded = buffer!.events[0];
      expect(recorded.kind).toBe('midi-cc');
      expect(recorded.recordedAt).toBe(100);
      expect(recorded.sourceCardId).toBe('midi-input-card');
      expect((recorded.payload as MIDICCEvent).ccNumber).toBe(7);
      expect((recorded.payload as MIDICCEvent).value).toBe(100);
    });

    it('records multiple CC events sequentially', () => {
      let state = createRecordingState(0 as Tick);
      state = startRecordingBuffer(state, 'midi-buffer');

      for (let i = 0; i < 5; i++) {
        state = { ...state, currentTick: (i * 10) as Tick };
        state = recordMIDICC(state, 'midi-buffer', {
          ccNumber: 1,
          value: i * 20,
          channel: 0,
        }, 'controller');
      }

      const buffer = getBuffer(state, 'midi-buffer');
      expect(buffer!.events).toHaveLength(5);
      expect(buffer!.events[0].recordedAt).toBe(0);
      expect(buffer!.events[4].recordedAt).toBe(40);
    });
  });

  describe('Aftertouch Recording', () => {
    it('records aftertouch events', () => {
      let state = createRecordingState(50 as Tick);
      state = startRecordingBuffer(state, 'at-buffer');

      const aftertouch: AftertouchEvent = {
        pressure: 80,
        channel: 0,
      };

      state = recordAftertouch(state, 'at-buffer', aftertouch, 'keyboard');

      const buffer = getBuffer(state, 'at-buffer');
      expect(buffer!.events).toHaveLength(1);
      expect(buffer!.events[0].kind).toBe('aftertouch');
      expect((buffer!.events[0].payload as AftertouchEvent).pressure).toBe(80);
    });
  });

  describe('Pitch Bend Recording', () => {
    it('records pitch bend events', () => {
      let state = createRecordingState(200 as Tick);
      state = startRecordingBuffer(state, 'pb-buffer');

      const pitchBend: PitchBendEvent = {
        value: 4096, // Half-way up
        channel: 0,
      };

      state = recordPitchBend(state, 'pb-buffer', pitchBend, 'synth');

      const buffer = getBuffer(state, 'pb-buffer');
      expect(buffer!.events).toHaveLength(1);
      expect(buffer!.events[0].kind).toBe('pitch-bend');
      expect((buffer!.events[0].payload as PitchBendEvent).value).toBe(4096);
    });

    it('records negative pitch bend', () => {
      let state = createRecordingState(0 as Tick);
      state = startRecordingBuffer(state, 'pb-buffer');

      state = recordPitchBend(state, 'pb-buffer', {
        value: -4096,
        channel: 0,
      }, 'synth');

      const buffer = getBuffer(state, 'pb-buffer');
      expect((buffer!.events[0].payload as PitchBendEvent).value).toBe(-4096);
    });
  });

  describe('Mod Wheel Recording', () => {
    it('records mod wheel events', () => {
      let state = createRecordingState(150 as Tick);
      state = startRecordingBuffer(state, 'mw-buffer');

      const modWheel: ModWheelEvent = {
        value: 64,
        channel: 0,
      };

      state = recordModWheel(state, 'mw-buffer', modWheel, 'controller');

      const buffer = getBuffer(state, 'mw-buffer');
      expect(buffer!.events).toHaveLength(1);
      expect(buffer!.events[0].kind).toBe('mod-wheel');
      expect((buffer!.events[0].payload as ModWheelEvent).value).toBe(64);
    });
  });

  describe('Expression Recording', () => {
    it('records expression events', () => {
      let state = createRecordingState(300 as Tick);
      state = startRecordingBuffer(state, 'ex-buffer');

      const expression: ExpressionEvent = {
        value: 120,
        channel: 0,
      };

      state = recordExpression(state, 'ex-buffer', expression, 'controller');

      const buffer = getBuffer(state, 'ex-buffer');
      expect(buffer!.events).toHaveLength(1);
      expect(buffer!.events[0].kind).toBe('expression');
      expect((buffer!.events[0].payload as ExpressionEvent).value).toBe(120);
    });
  });

  // ============================================================================
  // RETROSPECTIVE RECORDING TESTS
  // ============================================================================

  describe('Retrospective Recording', () => {
    it('creates retrospective buffer with default size', () => {
      const buffer = createRetrospectiveBuffer('retro');
      expect(buffer.id).toBe('retro');
      expect(buffer.maxEvents).toBe(1000);
      expect(buffer.events).toEqual([]);
      expect(buffer.enabled).toBe(true);
    });

    it('creates retrospective buffer with custom size', () => {
      const buffer = createRetrospectiveBuffer('retro', 500);
      expect(buffer.maxEvents).toBe(500);
    });

    it('adds events to retrospective buffer', () => {
      const buffer = createRetrospectiveBuffer<{ pitch: number }>('retro', 10);
      const event: Event<{ pitch: number }> = {
        id: 'evt1',
        kind: 'note',
        start: 10 as Tick,
        duration: 5 as Tick,
        payload: { pitch: 60 },
      };

      const updated = addToRetrospectiveBuffer(buffer, event, 100 as Tick, 'card-1');

      expect(updated.events).toHaveLength(1);
      expect(updated.events[0].recordedAt).toBe(100);
      expect(updated.events[0].sourceCardId).toBe('card-1');
    });

    it('maintains ring buffer with maxEvents limit', () => {
      let buffer = createRetrospectiveBuffer('retro', 5);

      // Add 10 events
      for (let i = 0; i < 10; i++) {
        const event: Event = {
          id: `evt${i}`,
          kind: 'note',
          start: i as Tick,
          duration: 1 as Tick,
          payload: {},
        };
        buffer = addToRetrospectiveBuffer(buffer, event, i as Tick, 'card');
      }

      // Should only keep last 5
      expect(buffer.events).toHaveLength(5);
      expect(buffer.events[0].id).toBe('evt5');
      expect(buffer.events[4].id).toBe('evt9');
    });

    it('does not add events when disabled', () => {
      const buffer = createRetrospectiveBuffer('retro', 10);
      const disabled = { ...buffer, enabled: false };
      
      const event: Event = {
        id: 'evt1',
        kind: 'note',
        start: 0 as Tick,
        duration: 1 as Tick,
        payload: {},
      };

      const result = addToRetrospectiveBuffer(disabled, event, 0 as Tick, 'card');
      expect(result.events).toHaveLength(0);
    });

    it('captures events from retrospective buffer by time range', () => {
      let buffer = createRetrospectiveBuffer<{ value: number }>('retro', 100);

      // Add events at different times
      for (let i = 0; i < 10; i++) {
        const event: Event<{ value: number }> = {
          id: `evt${i}`,
          kind: 'note',
          start: (i * 10) as Tick,
          duration: 1 as Tick,
          payload: { value: i },
        };
        buffer = addToRetrospectiveBuffer(buffer, event, (i * 10) as Tick, 'card');
      }

      // Capture events from tick 20 to 50
      const captured = captureRetrospective(buffer, 20 as Tick, 50 as Tick);

      expect(captured).toHaveLength(4); // Events at 20, 30, 40, 50
      expect(captured[0].recordedAt).toBe(20);
      expect(captured[3].recordedAt).toBe(50);
    });

    it('returns empty array when no events in time range', () => {
      let buffer = createRetrospectiveBuffer('retro', 100);
      
      const event: Event = {
        id: 'evt1',
        kind: 'note',
        start: 10 as Tick,
        duration: 1 as Tick,
        payload: {},
      };
      buffer = addToRetrospectiveBuffer(buffer, event, 10 as Tick, 'card');

      const captured = captureRetrospective(buffer, 100 as Tick, 200 as Tick);
      expect(captured).toHaveLength(0);
    });

    it('clears retrospective buffer', () => {
      let buffer = createRetrospectiveBuffer('retro', 10);
      
      // Add some events
      for (let i = 0; i < 5; i++) {
        const event: Event = {
          id: `evt${i}`,
          kind: 'note',
          start: i as Tick,
          duration: 1 as Tick,
          payload: {},
        };
        buffer = addToRetrospectiveBuffer(buffer, event, i as Tick, 'card');
      }

      expect(buffer.events).toHaveLength(5);

      const cleared = clearRetrospectiveBuffer(buffer);
      expect(cleared.events).toHaveLength(0);
      expect(cleared.enabled).toBe(true);
    });
  });
});
