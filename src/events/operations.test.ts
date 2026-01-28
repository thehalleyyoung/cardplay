/**
 * @fileoverview Tests for event operations.
 */

import { describe, it, expect } from 'vitest';
import {
  createEvent,
  asTick,
  asTickDuration,
  EventKinds,
} from '../types';
import {
  eventOverlaps,
  eventContains,
  eventContainsTick,
  getOverlapDuration,
  eventsAdjacent,
  splitEvent,
  mergeEvents,
  stretchEvent,
  shiftEvent,
  quantizeEvent,
  normalizeEvent,
  resizeEvent,
  trimEvent,
} from './operations';
import type { Event } from '../types';

// ============================================================================
// HELPERS
// ============================================================================

interface NotePayload {
  pitch: number;
  velocity: number;
}

const createNote = (start: number, duration: number): Event<NotePayload> => {
  return createEvent({
    kind: EventKinds.NOTE,
    start: asTick(start),
    duration: asTickDuration(duration),
    payload: { pitch: 60, velocity: 100 },
  });
};

// ============================================================================
// TEMPORAL QUERIES
// ============================================================================

describe('Temporal queries', () => {
  describe('eventOverlaps', () => {
    it('should detect overlapping events', () => {
      const a = createNote(0, 100);
      const b = createNote(50, 100);
      expect(eventOverlaps(a, b)).toBe(true);
    });

    it('should return false for non-overlapping events', () => {
      const a = createNote(0, 100);
      const b = createNote(200, 100);
      expect(eventOverlaps(a, b)).toBe(false);
    });

    it('should return false for adjacent events', () => {
      const a = createNote(0, 100);
      const b = createNote(100, 100);
      expect(eventOverlaps(a, b)).toBe(false);
    });
  });

  describe('eventContains', () => {
    it('should detect containment', () => {
      const outer = createNote(0, 200);
      const inner = createNote(50, 100);
      expect(eventContains(outer, inner)).toBe(true);
    });

    it('should return false when not contained', () => {
      const a = createNote(0, 100);
      const b = createNote(50, 100);
      expect(eventContains(a, b)).toBe(false);
    });
  });

  describe('eventContainsTick', () => {
    it('should detect tick inside event', () => {
      const event = createNote(100, 200);
      expect(eventContainsTick(event, asTick(150))).toBe(true);
    });

    it('should handle boundary ticks', () => {
      const event = createNote(100, 200);
      expect(eventContainsTick(event, asTick(100), true)).toBe(true);
      expect(eventContainsTick(event, asTick(300), true)).toBe(true);
      expect(eventContainsTick(event, asTick(300), false)).toBe(false);
    });
  });

  describe('getOverlapDuration', () => {
    it('should calculate overlap duration', () => {
      const a = createNote(0, 100);
      const b = createNote(50, 100);
      expect(getOverlapDuration(a, b)).toBe(50);
    });

    it('should return 0 for non-overlapping', () => {
      const a = createNote(0, 100);
      const b = createNote(200, 100);
      expect(getOverlapDuration(a, b)).toBe(0);
    });
  });

  describe('eventsAdjacent', () => {
    it('should detect adjacent events', () => {
      const a = createNote(0, 100);
      const b = createNote(100, 100);
      expect(eventsAdjacent(a, b)).toBe(true);
    });

    it('should return false for non-adjacent', () => {
      const a = createNote(0, 100);
      const b = createNote(200, 100);
      expect(eventsAdjacent(a, b)).toBe(false);
    });
  });
});

// ============================================================================
// SPLIT OPERATION
// ============================================================================

describe('splitEvent', () => {
  it('should split at tick position', () => {
    const event = createNote(0, 200);
    const [left, right] = splitEvent(event, asTick(100));
    
    expect(left.start).toBe(0);
    expect(left.duration).toBe(100);
    expect(right.start).toBe(100);
    expect(right.duration).toBe(100);
  });

  it('should preserve payload', () => {
    const event = createNote(0, 200);
    const [left, right] = splitEvent(event, asTick(100));
    
    expect(left.payload).toEqual(event.payload);
    expect(right.payload).toEqual(event.payload);
  });

  it('should generate new IDs', () => {
    const event = createNote(0, 200);
    const [left, right] = splitEvent(event, asTick(100));
    
    expect(left.id).not.toBe(event.id);
    expect(right.id).not.toBe(event.id);
    expect(left.id).not.toBe(right.id);
  });

  it('should throw on invalid split position', () => {
    const event = createNote(0, 200);
    expect(() => splitEvent(event, asTick(0))).toThrow(RangeError);
    expect(() => splitEvent(event, asTick(200))).toThrow(RangeError);
    expect(() => splitEvent(event, asTick(300))).toThrow(RangeError);
  });
});

// ============================================================================
// MERGE OPERATION
// ============================================================================

describe('mergeEvents', () => {
  it('should merge adjacent events', () => {
    const a = createNote(0, 100);
    const b = createNote(100, 100);
    const merged = mergeEvents(a, b);
    
    expect(merged.start).toBe(0);
    expect(merged.duration).toBe(200);
  });

  it('should use first event payload by default', () => {
    const a = createEvent({
      kind: EventKinds.NOTE,
      start: 0,
      duration: 100,
      payload: { pitch: 60, velocity: 100 },
    });
    const b = createEvent({
      kind: EventKinds.NOTE,
      start: 100,
      duration: 100,
      payload: { pitch: 62, velocity: 80 },
    });
    const merged = mergeEvents(a, b);
    
    expect(merged.payload).toEqual({ pitch: 60, velocity: 100 });
  });

  it('should use custom payload merger', () => {
    const a = createNote(0, 100);
    const b = createEvent({
      kind: EventKinds.NOTE,
      start: 100,
      duration: 100,
      payload: { pitch: 62, velocity: 80 },
    });
    const merged = mergeEvents(a, b, (pa, pb) => ({
      pitch: pa.pitch,
      velocity: Math.max(pa.velocity, pb.velocity),
    }));
    
    expect(merged.payload.velocity).toBe(100);
  });

  it('should throw on non-adjacent events', () => {
    const a = createNote(0, 100);
    const b = createNote(200, 100);
    expect(() => mergeEvents(a, b)).toThrow();
  });

  it('should throw on different kinds', () => {
    const a = createNote(0, 100);
    const b = createEvent({
      kind: EventKinds.MARKER,
      start: 100,
      duration: 100,
      payload: { name: 'test' },
    });
    expect(() => mergeEvents(a, b)).toThrow();
  });
});

// ============================================================================
// STRETCH OPERATION
// ============================================================================

describe('stretchEvent', () => {
  it('should stretch by factor with start anchor', () => {
    const event = createNote(100, 200);
    const stretched = stretchEvent(event, 2, 'start');
    
    expect(stretched.start).toBe(100);
    expect(stretched.duration).toBe(400);
  });

  it('should stretch with center anchor', () => {
    const event = createNote(100, 200);
    const stretched = stretchEvent(event, 2, 'center');
    
    expect(stretched.duration).toBe(400);
    expect(stretched.start).toBe(0); // Moved left
  });

  it('should stretch with end anchor', () => {
    const event = createNote(200, 200);
    const stretched = stretchEvent(event, 2, 'end');
    
    expect(stretched.duration).toBe(400);
    expect(stretched.start).toBe(0);
  });

  it('should throw on invalid factor', () => {
    const event = createNote(0, 100);
    expect(() => stretchEvent(event, 0)).toThrow(RangeError);
    expect(() => stretchEvent(event, -1)).toThrow(RangeError);
  });

  it('should preserve minimum duration', () => {
    const event = createNote(0, 100);
    const stretched = stretchEvent(event, 0.001, 'start');
    expect(stretched.duration).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// SHIFT OPERATION
// ============================================================================

describe('shiftEvent', () => {
  it('should shift forward', () => {
    const event = createNote(100, 200);
    const shifted = shiftEvent(event, 50);
    
    expect(shifted.start).toBe(150);
    expect(shifted.duration).toBe(200);
  });

  it('should shift backward', () => {
    const event = createNote(100, 200);
    const shifted = shiftEvent(event, -50);
    
    expect(shifted.start).toBe(50);
  });

  it('should clamp to zero', () => {
    const event = createNote(50, 200);
    const shifted = shiftEvent(event, -100, true);
    
    expect(shifted.start).toBe(0);
  });

  it('should throw on negative result when not clamping', () => {
    const event = createNote(50, 200);
    expect(() => shiftEvent(event, -100, false)).toThrow(RangeError);
  });
});

// ============================================================================
// QUANTIZE OPERATION
// ============================================================================

describe('quantizeEvent', () => {
  const grid = 240; // Quarter-note at 960 PPQ / 4

  it('should quantize start to grid', () => {
    const event = createNote(50, 100);
    const quantized = quantizeEvent(event, { grid, quantizeStart: true });
    
    expect(quantized.start).toBe(0);
  });

  it('should quantize end to grid', () => {
    const event = createNote(0, 100);
    const quantized = quantizeEvent(event, { 
      grid, 
      quantizeStart: false, 
      quantizeEnd: true 
    });
    
    expect(quantized.duration).toBe(240);
  });

  it('should apply partial strength', () => {
    const event = createNote(60, 100);
    const quantized = quantizeEvent(event, { 
      grid, 
      quantizeStart: true, 
      strength: 0.5 
    });
    
    expect(quantized.start).toBe(30);
  });

  it('should throw on invalid grid', () => {
    const event = createNote(0, 100);
    expect(() => quantizeEvent(event, { grid: 0 })).toThrow(RangeError);
    expect(() => quantizeEvent(event, { grid: -1 })).toThrow(RangeError);
  });
});

// ============================================================================
// NORMALIZE OPERATION
// ============================================================================

describe('normalizeEvent', () => {
  it('should ensure minimum duration', () => {
    const event = createEvent({
      kind: EventKinds.NOTE,
      start: 0,
      duration: 0,
      payload: { pitch: 60, velocity: 100 },
    });
    const normalized = normalizeEvent(event);
    
    expect(normalized.duration).toBe(1);
  });
});

// ============================================================================
// RESIZE OPERATION
// ============================================================================

describe('resizeEvent', () => {
  it('should resize with start anchor', () => {
    const event = createNote(100, 200);
    const resized = resizeEvent(event, 300, 'start');
    
    expect(resized.start).toBe(100);
    expect(resized.duration).toBe(300);
  });

  it('should resize with end anchor', () => {
    const event = createNote(100, 200);
    const resized = resizeEvent(event, 300, 'end');
    
    expect(resized.start).toBe(0);
    expect(resized.duration).toBe(300);
  });
});

// ============================================================================
// TRIM OPERATION
// ============================================================================

describe('trimEvent', () => {
  it('should trim to range', () => {
    const event = createNote(0, 200);
    const trimmed = trimEvent(event, asTick(50), asTick(150));
    
    expect(trimmed).not.toBeNull();
    expect(trimmed!.start).toBe(50);
    expect(trimmed!.duration).toBe(100);
  });

  it('should return null when outside range', () => {
    const event = createNote(0, 100);
    const trimmed = trimEvent(event, asTick(200), asTick(300));
    
    expect(trimmed).toBeNull();
  });

  it('should return original when fully inside range', () => {
    const event = createNote(100, 100);
    const trimmed = trimEvent(event, asTick(0), asTick(300));
    
    expect(trimmed).toBe(event);
  });

  it('should handle edge cases', () => {
    const event = createNote(100, 100);
    
    // Just touching at start
    const trimmed1 = trimEvent(event, asTick(0), asTick(100));
    expect(trimmed1).toBeNull();
    
    // Just touching at end
    const trimmed2 = trimEvent(event, asTick(200), asTick(300));
    expect(trimmed2).toBeNull();
  });
});
