/**
 * @fileoverview Tests for Stream<E> operations.
 */

import { describe, it, expect } from 'vitest';
import {
  createEvent,
  asTick,
  asTickDuration,
  EventKinds,
  generateEventId,
} from '../types';
import {
  createStream,
  emptyStream,
  streamAppend,
  streamInsert,
  streamRemove,
  streamUpdate,
  streamFilter,
  streamMap,
  streamFlatMap,
  streamSlice,
  streamMerge,
  streamSplit,
  streamQuantize,
  streamShift,
  streamStretch,
  streamReverse,
  streamRetrograde,
  streamInvert,
  streamTranspose,
  streamBounds,
  streamDuration,
  streamEventsAt,
  streamFindOverlapping,
  streamGetById,
  streamIsEmpty,
  streamLength,
  streamTrim,
  streamNormalize,
  streamGroupBy,
  streamGroupByKind,
} from './stream';
import type { Event } from '../types';

// ============================================================================
// HELPERS
// ============================================================================

interface NotePayload {
  pitch: number;
  velocity: number;
}

const createNote = (start: number, duration: number, pitch = 60): Event<NotePayload> => {
  return createEvent({
    kind: EventKinds.NOTE,
    start: asTick(start),
    duration: asTickDuration(duration),
    payload: { pitch, velocity: 100 },
  });
};

// ============================================================================
// FACTORY TESTS
// ============================================================================

describe('Stream factories', () => {
  describe('createStream', () => {
    it('should create an empty stream', () => {
      const stream = createStream<Event<NotePayload>>([]);
      expect(stream.events).toHaveLength(0);
    });

    it('should sort events by start tick', () => {
      const events = [
        createNote(200, 100),
        createNote(0, 100),
        createNote(100, 100),
      ];
      const stream = createStream(events);
      
      expect(stream.events[0]!.start).toBe(0);
      expect(stream.events[1]!.start).toBe(100);
      expect(stream.events[2]!.start).toBe(200);
    });

    it('should preserve metadata', () => {
      const stream = createStream([], { name: 'Test', color: '#ff0000' });
      expect(stream.meta?.name).toBe('Test');
      expect(stream.meta?.color).toBe('#ff0000');
    });
  });

  describe('emptyStream', () => {
    it('should create an empty stream', () => {
      const stream = emptyStream<Event<NotePayload>>();
      expect(streamIsEmpty(stream)).toBe(true);
    });
  });
});

// ============================================================================
// BASIC OPERATIONS TESTS
// ============================================================================

describe('Basic operations', () => {
  describe('streamAppend', () => {
    it('should append and maintain order', () => {
      const stream = createStream([createNote(100, 100)]);
      const appended = streamAppend(stream, createNote(0, 100));
      
      expect(appended.events).toHaveLength(2);
      expect(appended.events[0]!.start).toBe(0);
      expect(appended.events[1]!.start).toBe(100);
    });
  });

  describe('streamInsert', () => {
    it('should insert at correct position', () => {
      const stream = createStream([
        createNote(0, 100),
        createNote(200, 100),
      ]);
      const inserted = streamInsert(stream, createNote(100, 100));
      
      expect(inserted.events).toHaveLength(3);
      expect(inserted.events[1]!.start).toBe(100);
    });
  });

  describe('streamRemove', () => {
    it('should remove event by ID', () => {
      const event1 = createNote(0, 100);
      const event2 = createNote(100, 100);
      const stream = createStream([event1, event2]);
      const removed = streamRemove(stream, event1.id);
      
      expect(removed.events).toHaveLength(1);
      expect(removed.events[0]!.id).toBe(event2.id);
    });
  });

  describe('streamUpdate', () => {
    it('should update event by ID', () => {
      const event = createNote(0, 100, 60);
      const stream = createStream([event]);
      const updated = streamUpdate(stream, event.id, e => 
        createEvent({
          ...e,
          payload: { ...e.payload, pitch: 72 },
        })
      );
      
      expect(updated.events[0]!.payload.pitch).toBe(72);
    });
  });

  describe('streamFilter', () => {
    it('should filter events by predicate', () => {
      const stream = createStream([
        createNote(0, 100, 60),
        createNote(100, 100, 72),
        createNote(200, 100, 60),
      ]);
      const filtered = streamFilter(stream, e => e.payload.pitch === 60);
      
      expect(filtered.events).toHaveLength(2);
    });
  });

  describe('streamMap', () => {
    it('should map events', () => {
      const stream = createStream([
        createNote(0, 100, 60),
        createNote(100, 100, 64),
      ]);
      const mapped = streamMap(stream, e => 
        createEvent({
          ...e,
          payload: { ...e.payload, pitch: e.payload.pitch + 12 },
        })
      );
      
      expect(mapped.events[0]!.payload.pitch).toBe(72);
      expect(mapped.events[1]!.payload.pitch).toBe(76);
    });
  });

  describe('streamFlatMap', () => {
    it('should flatMap events', () => {
      const stream = createStream([createNote(0, 100, 60)]);
      const flatMapped = streamFlatMap(stream, e => [
        e,
        createNote(e.start + 100, 100, e.payload.pitch + 4),
      ]);
      
      expect(flatMapped.events).toHaveLength(2);
    });
  });
});

// ============================================================================
// TEMPORAL OPERATIONS TESTS
// ============================================================================

describe('Temporal operations', () => {
  describe('streamSlice', () => {
    it('should slice by tick range', () => {
      const stream = createStream([
        createNote(0, 100),
        createNote(100, 100),
        createNote(200, 100),
        createNote(300, 100),
      ]);
      const sliced = streamSlice(stream, asTick(50), asTick(250));
      
      expect(sliced.events).toHaveLength(3); // 0-100, 100-200, 200-300 overlap
    });
  });

  describe('streamMerge', () => {
    it('should merge two streams', () => {
      const a = createStream([createNote(0, 100)]);
      const b = createStream([createNote(50, 100)]);
      const merged = streamMerge(a, b);
      
      expect(merged.events).toHaveLength(2);
      expect(merged.events[0]!.start).toBe(0);
      expect(merged.events[1]!.start).toBe(50);
    });
  });

  describe('streamSplit', () => {
    it('should split by predicate', () => {
      const stream = createStream([
        createNote(0, 100, 60),
        createNote(100, 100, 72),
        createNote(200, 100, 60),
      ]);
      const [high, low] = streamSplit(stream, e => e.payload.pitch > 65);
      
      expect(high.events).toHaveLength(1);
      expect(low.events).toHaveLength(2);
    });
  });

  describe('streamQuantize', () => {
    it('should quantize all events', () => {
      const stream = createStream([
        createNote(30, 100),  // Closer to 0
        createNote(160, 100), // Closer to 200
      ]);
      const quantized = streamQuantize(stream, { grid: 100 });
      
      expect(quantized.events[0]!.start).toBe(0);
      expect(quantized.events[1]!.start).toBe(200);
    });
  });

  describe('streamShift', () => {
    it('should shift all events', () => {
      const stream = createStream([
        createNote(0, 100),
        createNote(100, 100),
      ]);
      const shifted = streamShift(stream, 50);
      
      expect(shifted.events[0]!.start).toBe(50);
      expect(shifted.events[1]!.start).toBe(150);
    });

    it('should clamp to zero', () => {
      const stream = createStream([createNote(50, 100)]);
      const shifted = streamShift(stream, -100, true);
      
      expect(shifted.events[0]!.start).toBe(0);
    });
  });

  describe('streamStretch', () => {
    it('should stretch all events', () => {
      const stream = createStream([
        createNote(0, 100),
        createNote(100, 100),
      ]);
      const stretched = streamStretch(stream, 2);
      
      expect(stretched.events[0]!.start).toBe(0);
      expect(stretched.events[0]!.duration).toBe(200);
      expect(stretched.events[1]!.start).toBe(200);
    });
  });

  describe('streamReverse', () => {
    it('should reverse temporal order', () => {
      const stream = createStream([
        createNote(0, 100),
        createNote(200, 100),
      ]);
      const reversed = streamReverse(stream);
      
      // Original: [0-100, 200-300], Duration: 300
      // Reversed: event at 0 moves to end, event at 200 moves to start
      expect(reversed.events.length).toBe(2);
    });
  });
});

// ============================================================================
// PITCH OPERATIONS TESTS
// ============================================================================

describe('Pitch operations', () => {
  describe('streamRetrograde', () => {
    it('should reverse pitch order', () => {
      const stream = createStream([
        createNote(0, 100, 60),
        createNote(100, 100, 64),
        createNote(200, 100, 67),
      ]);
      const retrograded = streamRetrograde(stream);
      
      expect(retrograded.events[0]!.payload.pitch).toBe(67);
      expect(retrograded.events[1]!.payload.pitch).toBe(64);
      expect(retrograded.events[2]!.payload.pitch).toBe(60);
    });
  });

  describe('streamInvert', () => {
    it('should invert pitches around axis', () => {
      const stream = createStream([
        createNote(0, 100, 60),
        createNote(100, 100, 64),
      ]);
      const inverted = streamInvert(stream, 62);
      
      // 60 inverts to 64, 64 inverts to 60
      expect(inverted.events[0]!.payload.pitch).toBe(64);
      expect(inverted.events[1]!.payload.pitch).toBe(60);
    });

    it('should use midpoint as default axis', () => {
      const stream = createStream([
        createNote(0, 100, 60),
        createNote(100, 100, 72),
      ]);
      const inverted = streamInvert(stream);
      
      // Axis = 66, so 60 -> 72, 72 -> 60
      expect(inverted.events[0]!.payload.pitch).toBe(72);
      expect(inverted.events[1]!.payload.pitch).toBe(60);
    });
  });

  describe('streamTranspose', () => {
    it('should transpose all pitches', () => {
      const stream = createStream([
        createNote(0, 100, 60),
        createNote(100, 100, 64),
      ]);
      const transposed = streamTranspose(stream, 12);
      
      expect(transposed.events[0]!.payload.pitch).toBe(72);
      expect(transposed.events[1]!.payload.pitch).toBe(76);
    });
  });
});

// ============================================================================
// QUERY OPERATIONS TESTS
// ============================================================================

describe('Query operations', () => {
  describe('streamBounds', () => {
    it('should return bounds', () => {
      const stream = createStream([
        createNote(100, 100),
        createNote(200, 150),
      ]);
      const bounds = streamBounds(stream);
      
      expect(bounds?.start).toBe(100);
      expect(bounds?.end).toBe(350);
    });

    it('should return null for empty stream', () => {
      const stream = emptyStream<Event<NotePayload>>();
      expect(streamBounds(stream)).toBeNull();
    });
  });

  describe('streamDuration', () => {
    it('should return duration', () => {
      const stream = createStream([
        createNote(100, 100),
        createNote(200, 150),
      ]);
      expect(streamDuration(stream)).toBe(250);
    });
  });

  describe('streamEventsAt', () => {
    it('should find events at tick', () => {
      const stream = createStream([
        createNote(0, 100),
        createNote(50, 100),
        createNote(200, 100),
      ]);
      const atTick = streamEventsAt(stream, asTick(75));
      
      expect(atTick).toHaveLength(2);
    });
  });

  describe('streamFindOverlapping', () => {
    it('should find overlapping pairs', () => {
      const stream = createStream([
        createNote(0, 100),
        createNote(50, 100),
        createNote(200, 100),
      ]);
      const overlaps = streamFindOverlapping(stream);
      
      expect(overlaps).toHaveLength(1);
    });
  });

  describe('streamGetById', () => {
    it('should find event by ID', () => {
      const event = createNote(0, 100);
      const stream = createStream([event]);
      
      expect(streamGetById(stream, event.id)).toBe(event);
    });

    it('should return undefined if not found', () => {
      const stream = createStream([createNote(0, 100)]);
      expect(streamGetById(stream, generateEventId())).toBeUndefined();
    });
  });

  describe('streamLength', () => {
    it('should return event count', () => {
      const stream = createStream([
        createNote(0, 100),
        createNote(100, 100),
      ]);
      expect(streamLength(stream)).toBe(2);
    });
  });
});

// ============================================================================
// TRIM AND NORMALIZE TESTS
// ============================================================================

describe('Trim and normalize', () => {
  describe('streamTrim', () => {
    it('should trim events to range', () => {
      const stream = createStream([
        createNote(0, 100),
        createNote(50, 100),
        createNote(200, 100),
      ]);
      const trimmed = streamTrim(stream, asTick(25), asTick(125));
      
      expect(trimmed.events).toHaveLength(2);
    });
  });

  describe('streamNormalize', () => {
    it('should normalize to start at 0', () => {
      const stream = createStream([
        createNote(100, 100),
        createNote(200, 100),
      ]);
      const normalized = streamNormalize(stream);
      
      expect(normalized.events[0]!.start).toBe(0);
      expect(normalized.events[1]!.start).toBe(100);
    });
  });
});

// ============================================================================
// GROUPING TESTS
// ============================================================================

describe('Grouping', () => {
  describe('streamGroupBy', () => {
    it('should group by key function', () => {
      const stream = createStream([
        createNote(0, 100, 60),
        createNote(100, 100, 72),
        createNote(200, 100, 60),
      ]);
      const groups = streamGroupBy(stream, e => e.payload.pitch);
      
      expect(groups.size).toBe(2);
      expect(groups.get(60)?.events).toHaveLength(2);
      expect(groups.get(72)?.events).toHaveLength(1);
    });
  });

  describe('streamGroupByKind', () => {
    it('should group by event kind', () => {
      const note = createNote(0, 100);
      const marker = createEvent({
        kind: EventKinds.MARKER,
        start: 50,
        duration: 0,
        payload: { name: 'verse' },
      });
      const stream = createStream([note, marker]);
      const groups = streamGroupByKind(stream);
      
      expect(groups.size).toBe(2);
      expect(groups.get('note')?.events).toHaveLength(1);
      expect(groups.get('marker')?.events).toHaveLength(1);
    });
  });
});
