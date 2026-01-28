/**
 * @fileoverview Tests for Event<P> core types and operations.
 */

import { describe, it, expect } from 'vitest';
import {
  // Primitives
  asTick,
  asTickDuration,
  PPQ,
  addTicks,
  subtractTicks,
  quantizeTick,
  beatsToTicks,
  ticksToBeats,
  getGridSizes,
  // Event ID
  generateEventId,
  asEventId,
  extractTimestamp,
  compareEventIds,
  // Event Kind
  EventKinds,
  asEventKind,
  // Event
  createEvent,
  cloneEvent,
  updateEvent,
  isEvent,
  eventEnd,
  eventMidpoint,
  isInstantaneous,
  eventEquals,
  // Trigger
  createTrigger,
  createAbsoluteTrigger,
  createRelativeTrigger,
  resolveTriggerTick,
} from '../types';

// ============================================================================
// TEST PAYLOADS
// ============================================================================

interface NotePayload {
  pitch: number;
  velocity: number;
}

// ============================================================================
// PRIMITIVES TESTS
// ============================================================================

describe('Tick primitives', () => {
  describe('asTick', () => {
    it('should create a Tick from a valid number', () => {
      const tick = asTick(100);
      expect(tick).toBe(100);
    });

    it('should throw on negative value', () => {
      expect(() => asTick(-1)).toThrow(RangeError);
    });

    it('should throw on non-integer', () => {
      expect(() => asTick(1.5)).toThrow(RangeError);
    });
  });

  describe('asTickDuration', () => {
    it('should create a TickDuration from a valid number', () => {
      const duration = asTickDuration(960);
      expect(duration).toBe(960);
    });

    it('should throw on negative value', () => {
      expect(() => asTickDuration(-1)).toThrow(RangeError);
    });
  });

  describe('tick arithmetic', () => {
    it('should add ticks correctly', () => {
      const result = addTicks(asTick(100), asTickDuration(50));
      expect(result).toBe(150);
    });

    it('should subtract ticks and clamp to zero', () => {
      const result = subtractTicks(asTick(30), asTickDuration(50));
      expect(result).toBe(0);
    });
  });

  describe('quantizeTick', () => {
    it('should quantize to nearest grid', () => {
      expect(quantizeTick(asTick(100), 240)).toBe(0);
      expect(quantizeTick(asTick(200), 240)).toBe(240);
    });

    it('should quantize floor', () => {
      expect(quantizeTick(asTick(200), 240, 'floor')).toBe(0);
    });

    it('should quantize ceil', () => {
      expect(quantizeTick(asTick(100), 240, 'ceil')).toBe(240);
    });
  });

  describe('beat conversions', () => {
    it('should convert beats to ticks', () => {
      expect(beatsToTicks(1)).toBe(PPQ);
      expect(beatsToTicks(4)).toBe(PPQ * 4);
    });

    it('should convert ticks to beats', () => {
      expect(ticksToBeats(asTick(PPQ))).toBe(1);
      expect(ticksToBeats(asTick(PPQ * 2))).toBe(2);
    });
  });

  describe('getGridSizes', () => {
    it('should return correct grid sizes', () => {
      const grids = getGridSizes();
      expect(grids.quarter).toBe(PPQ);
      expect(grids.eighth).toBe(PPQ / 2);
      expect(grids.sixteenth).toBe(PPQ / 4);
    });
  });
});

// ============================================================================
// EVENT ID TESTS
// ============================================================================

describe('EventId', () => {
  describe('generateEventId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateEventId();
      const id2 = generateEventId();
      expect(id1).not.toBe(id2);
    });

    it('should generate valid UUID format', () => {
      const id = generateEventId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });
  });

  describe('asEventId', () => {
    it('should accept valid UUID', () => {
      const id = asEventId('01234567-89ab-cdef-0123-456789abcdef');
      expect(id).toBe('01234567-89ab-cdef-0123-456789abcdef');
    });

    it('should throw on invalid format', () => {
      expect(() => asEventId('not-a-uuid')).toThrow(TypeError);
    });
  });

  describe('extractTimestamp', () => {
    it('should extract timestamp from UUID v7', () => {
      const before = Date.now();
      const id = generateEventId();
      const after = Date.now();
      const timestamp = extractTimestamp(id);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('compareEventIds', () => {
    it('should compare IDs chronologically', () => {
      const id1 = generateEventId();
      const id2 = generateEventId();
      expect(compareEventIds(id1, id2)).toBe(-1);
      expect(compareEventIds(id2, id1)).toBe(1);
      expect(compareEventIds(id1, id1)).toBe(0);
    });
  });
});

// ============================================================================
// EVENT TESTS
// ============================================================================

describe('Event', () => {
  const createNote = (start: number, duration: number): Event<NotePayload> => {
    return createEvent({
      kind: EventKinds.NOTE,
      start: asTick(start),
      duration: asTickDuration(duration),
      payload: { pitch: 60, velocity: 100 },
    });
  };

  describe('createEvent', () => {
    it('should create an event with required fields', () => {
      const event = createNote(0, 480);
      expect(event.kind).toBe(EventKinds.NOTE);
      expect(event.start).toBe(0);
      expect(event.duration).toBe(480);
      expect(event.payload).toEqual({ pitch: 60, velocity: 100 });
    });

    it('should generate an ID if not provided', () => {
      const event = createNote(0, 480);
      expect(event.id).toBeDefined();
      expect(event.id).toMatch(/^[0-9a-f-]+$/);
    });

    it('should use provided ID', () => {
      const id = generateEventId();
      const event = createEvent({
        id,
        kind: EventKinds.NOTE,
        start: 0,
        duration: 480,
        payload: { pitch: 60, velocity: 100 },
      });
      expect(event.id).toBe(id);
    });
  });

  describe('cloneEvent', () => {
    it('should create a copy with a new ID', () => {
      const original = createNote(0, 480);
      const clone = cloneEvent(original);
      
      expect(clone.id).not.toBe(original.id);
      expect(clone.kind).toBe(original.kind);
      expect(clone.start).toBe(original.start);
      expect(clone.duration).toBe(original.duration);
      expect(clone.payload).toEqual(original.payload);
    });

    it('should apply overrides', () => {
      const original = createNote(0, 480);
      const clone = cloneEvent(original, { start: asTick(960) });
      
      expect(clone.start).toBe(960);
      expect(clone.duration).toBe(original.duration);
    });
  });

  describe('updateEvent', () => {
    it('should preserve ID when updating', () => {
      const original = createNote(0, 480);
      const updated = updateEvent(original, { start: asTick(960) });
      
      expect(updated.id).toBe(original.id);
      expect(updated.start).toBe(960);
    });
  });

  describe('isEvent', () => {
    it('should return true for valid events', () => {
      const event = createNote(0, 480);
      expect(isEvent(event)).toBe(true);
    });

    it('should return false for non-events', () => {
      expect(isEvent(null)).toBe(false);
      expect(isEvent({})).toBe(false);
      expect(isEvent({ id: '123' })).toBe(false);
    });
  });

  describe('computed properties', () => {
    it('should calculate eventEnd', () => {
      const event = createNote(100, 200);
      expect(eventEnd(event)).toBe(300);
    });

    it('should calculate eventMidpoint', () => {
      const event = createNote(100, 200);
      expect(eventMidpoint(event)).toBe(200);
    });

    it('should detect instantaneous events', () => {
      const instant = createEvent({
        kind: EventKinds.MARKER,
        start: 0,
        duration: 0,
        payload: { name: 'verse' },
      });
      expect(isInstantaneous(instant)).toBe(true);
      
      const note = createNote(0, 480);
      expect(isInstantaneous(note)).toBe(false);
    });
  });

  describe('eventEquals', () => {
    it('should return true for identical events', () => {
      const event = createNote(0, 480);
      expect(eventEquals(event, event)).toBe(true);
    });

    it('should return false for different events', () => {
      const a = createNote(0, 480);
      const b = createNote(0, 480);
      expect(eventEquals(a, b)).toBe(false); // Different IDs
    });
  });
});

// ============================================================================
// TRIGGER TESTS
// ============================================================================

describe('Trigger', () => {
  describe('createTrigger', () => {
    it('should create an absolute trigger', () => {
      const trigger = createAbsoluteTrigger(100, 'vibrato');
      expect(trigger.offset).toBe(100);
      expect(trigger.offsetMode).toBe('absolute');
      expect(trigger.action).toBe('vibrato');
      expect(trigger.enabled).toBe(true);
    });

    it('should create a relative trigger', () => {
      const trigger = createRelativeTrigger(0.5, 'crescendo');
      expect(trigger.offset).toBe(0.5);
      expect(trigger.offsetMode).toBe('relative');
    });

    it('should throw on invalid relative offset', () => {
      expect(() => createRelativeTrigger(1.5, 'test')).toThrow(RangeError);
      expect(() => createRelativeTrigger(-0.1, 'test')).toThrow(RangeError);
    });
  });

  describe('resolveTriggerTick', () => {
    it('should resolve absolute offset', () => {
      const trigger = createAbsoluteTrigger(100, 'test');
      const tick = resolveTriggerTick(trigger, asTick(0), asTickDuration(480));
      expect(tick).toBe(100);
    });

    it('should resolve relative offset', () => {
      const trigger = createRelativeTrigger(0.5, 'test');
      const tick = resolveTriggerTick(trigger, asTick(0), asTickDuration(480));
      expect(tick).toBe(240);
    });
  });
});
