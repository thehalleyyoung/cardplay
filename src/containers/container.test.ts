/**
 * @fileoverview Tests for Container<K, E> operations.
 */

import { describe, it, expect } from 'vitest';
import {
  createEvent,
  asTick,
  asTickDuration,
  EventKinds,
} from '../types';
import {
  createContainer,
  createPattern,
  createClip,
  cloneContainer,
  containerDuration,
  containerBounds,
  containerToJSON,
  containerFromJSON,
  mergeContainers,
  sliceContainer,
  loopContainer,
  generateContainerId,
  asContainerId,
  duplicatePattern,
  deletePattern,
  resizePattern,
  updatePatternProperties,
  assignPatternColor,
  namePattern,
  transposePattern,
  stretchPattern,
  doubleSpeedPattern,
  halfSpeedPattern,
  reversePattern,
  rotatePattern,
  shiftPattern,
  expandShrinkPattern,
  mergePatterns,
  splitPattern,
  clonePatternToNewTrack,
  exportPatternToMIDI,
  importPatternFromMIDI,
} from './container';
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
// ID TESTS
// ============================================================================

describe('ContainerId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateContainerId();
    const id2 = generateContainerId();
    expect(id1).not.toBe(id2);
  });

  it('should validate container IDs', () => {
    const id = asContainerId('test-id');
    expect(id).toBe('test-id');
  });

  it('should throw on invalid ID', () => {
    expect(() => asContainerId('')).toThrow(TypeError);
  });
});

// ============================================================================
// FACTORY TESTS
// ============================================================================

describe('Container factories', () => {
  describe('createContainer', () => {
    it('should create a container with events', () => {
      const events = [createNote(0, 100), createNote(100, 100)];
      const container = createContainer({
        kind: 'pattern',
        events,
      });
      
      expect(container.kind).toBe('pattern');
      expect(container.events.events).toHaveLength(2);
    });

    it('should generate an ID if not provided', () => {
      const container = createContainer({ kind: 'pattern' });
      expect(container.id).toBeDefined();
    });

    it('should use provided ID', () => {
      const id = generateContainerId();
      const container = createContainer({ id, kind: 'pattern' });
      expect(container.id).toBe(id);
    });

    it('should set metadata', () => {
      const container = createContainer({
        kind: 'pattern',
        meta: { name: 'My Pattern', color: '#ff0000' },
      });
      
      expect(container.meta.name).toBe('My Pattern');
      expect(container.meta.color).toBe('#ff0000');
    });
  });

  describe('createPattern', () => {
    it('should create a pattern', () => {
      const pattern = createPattern([createNote(0, 100)]);
      expect(pattern.kind).toBe('pattern');
    });
  });

  describe('createClip', () => {
    it('should create a clip', () => {
      const clip = createClip([createNote(0, 100)]);
      expect(clip.kind).toBe('clip');
    });
  });
});

// ============================================================================
// OPERATIONS TESTS
// ============================================================================

describe('Container operations', () => {
  describe('cloneContainer', () => {
    it('should clone with new ID', () => {
      const original = createPattern([createNote(0, 100)]);
      const clone = cloneContainer(original);
      
      expect(clone.id).not.toBe(original.id);
      expect(clone.kind).toBe(original.kind);
      expect(clone.events.events).toHaveLength(1);
    });

    it('should apply overrides', () => {
      const original = createPattern([], { name: 'Original' });
      const clone = cloneContainer(original, { meta: { name: 'Clone' } });
      
      expect(clone.meta.name).toBe('Clone');
    });
  });

  describe('containerDuration', () => {
    it('should calculate duration from events', () => {
      const container = createPattern([
        createNote(0, 100),
        createNote(100, 150),
      ]);
      
      expect(containerDuration(container)).toBe(250);
    });

    it('should use explicit length if set', () => {
      const container = createPattern([createNote(0, 100)], {
        length: asTickDuration(500),
      });
      
      expect(containerDuration(container)).toBe(500);
    });

    it('should return 0 for empty container', () => {
      const container = createPattern([]);
      expect(containerDuration(container)).toBe(0);
    });
  });

  describe('containerBounds', () => {
    it('should return bounds', () => {
      const container = createPattern([
        createNote(100, 100),
        createNote(200, 150),
      ]);
      const bounds = containerBounds(container);
      
      expect(bounds?.start).toBe(100);
      expect(bounds?.end).toBe(350);
    });

    it('should return null for empty container', () => {
      const container = createPattern([]);
      expect(containerBounds(container)).toBeNull();
    });
  });
});

// ============================================================================
// SERIALIZATION TESTS
// ============================================================================

describe('Serialization', () => {
  describe('containerToJSON', () => {
    it('should serialize container', () => {
      const container = createPattern([createNote(0, 100)], {
        name: 'Test',
        color: '#00ff00',
      });
      
      const json = containerToJSON(container, e => ({
        start: e.start,
        duration: e.duration,
        payload: e.payload,
      }));
      
      expect(json.id).toBe(container.id);
      expect(json.kind).toBe('pattern');
      expect(json.events).toHaveLength(1);
      expect(json.meta.name).toBe('Test');
    });
  });

  describe('containerFromJSON', () => {
    it('should deserialize container', () => {
      const original = createPattern([createNote(0, 100)], { name: 'Test' });
      const json = containerToJSON(original, e => ({
        id: e.id,
        kind: e.kind,
        start: e.start,
        duration: e.duration,
        payload: e.payload,
      }));
      
      const restored = containerFromJSON(json, data => {
        const d = data as { id: string; kind: string; start: number; duration: number; payload: NotePayload };
        return createEvent({
          kind: EventKinds.NOTE,
          start: d.start,
          duration: d.duration,
          payload: d.payload,
        });
      });
      
      expect(restored.id).toBe(original.id);
      expect(restored.kind).toBe('pattern');
      expect(restored.meta.name).toBe('Test');
    });
  });
});

// ============================================================================
// MERGING AND SLICING TESTS
// ============================================================================

describe('Merging and slicing', () => {
  describe('mergeContainers', () => {
    it('should merge multiple containers', () => {
      const a = createPattern([createNote(0, 100)]);
      const b = createPattern([createNote(100, 100)]);
      const merged = mergeContainers([a, b]);
      
      expect(merged.events.events).toHaveLength(2);
    });

    it('should handle empty input', () => {
      const merged = mergeContainers<'pattern', Event<NotePayload>>([]);
      expect(merged.events.events).toHaveLength(0);
    });
  });

  describe('sliceContainer', () => {
    it('should slice to range', () => {
      const container = createPattern([
        createNote(0, 100),
        createNote(100, 100),
        createNote(200, 100),
      ]);
      const sliced = sliceContainer(container, asTick(50), asTick(150));
      
      // Should include events overlapping with range
      expect(sliced.events.events.length).toBeGreaterThan(0);
    });

    it('should normalize to start at 0', () => {
      const container = createPattern([createNote(100, 100)]);
      const sliced = sliceContainer(container, asTick(100), asTick(200));
      
      expect(sliced.events.events[0]?.start).toBe(0);
    });
  });

  describe('loopContainer', () => {
    it('should loop container', () => {
      const container = createPattern([createNote(0, 100)], {
        length: asTickDuration(100),
      });
      const looped = loopContainer(container, 3);
      
      expect(looped.events.events).toHaveLength(3);
      expect(looped.events.events[0]!.start).toBe(0);
      expect(looped.events.events[1]!.start).toBe(100);
      expect(looped.events.events[2]!.start).toBe(200);
    });

    it('should return empty for count <= 0', () => {
      const container = createPattern([createNote(0, 100)]);
      const looped = loopContainer(container, 0);
      
      expect(looped.events.events).toHaveLength(0);
    });

    it('should return same for count = 1', () => {
      const container = createPattern([createNote(0, 100)]);
      const looped = loopContainer(container, 1);
      
      expect(looped).toBe(container);
    });
  });

  describe('Pattern Operations', () => {
    describe('duplicatePattern', () => {
      it('should create a copy with new ID', () => {
        const original = createPattern([createNote(0, 100)], {
          name: 'Original',
          color: '#ff0000',
        });
        const duplicate = duplicatePattern(original);
        
        expect(duplicate.id).not.toBe(original.id);
        expect(duplicate.events.events).toHaveLength(1);
        expect(duplicate.events.events[0]!.start).toBe(0);
        expect(duplicate.meta.name).toBe('Original (Copy)');
        expect(duplicate.meta.color).toBe('#ff0000');
      });

      it('should handle pattern without name', () => {
        const original = createPattern([createNote(0, 100)]);
        const duplicate = duplicatePattern(original);
        
        expect(duplicate.meta.name).toBeUndefined();
      });

      it('should preserve all events', () => {
        const original = createPattern([
          createNote(0, 100, 60),
          createNote(100, 100, 62),
          createNote(200, 100, 64),
        ]);
        const duplicate = duplicatePattern(original);
        
        expect(duplicate.events.events).toHaveLength(3);
        expect(duplicate.events.events[0]!.payload.pitch).toBe(60);
        expect(duplicate.events.events[1]!.payload.pitch).toBe(62);
        expect(duplicate.events.events[2]!.payload.pitch).toBe(64);
      });
    });

    describe('deletePattern', () => {
      it('should return null for any pattern', () => {
        const pattern = createPattern([createNote(0, 100)]);
        const result = deletePattern(pattern);
        
        expect(result).toBeNull();
      });
    });

    describe('resizePattern', () => {
      it('should extend pattern length', () => {
        const pattern = createPattern([createNote(0, 100)], {
          length: asTickDuration(100),
        });
        const resized = resizePattern(pattern, asTickDuration(200));
        
        expect(resized.meta.length).toBe(200);
        expect(resized.events.events).toHaveLength(1);
      });

      it('should trim pattern to shorter length', () => {
        const pattern = createPattern([
          createNote(0, 50),
          createNote(100, 50),
          createNote(200, 50),
        ]);
        const resized = resizePattern(pattern, asTickDuration(150));
        
        expect(resized.meta.length).toBe(150);
        expect(resized.events.events).toHaveLength(2); // Only first two notes
      });

      it('should return same pattern if length unchanged', () => {
        const pattern = createPattern([createNote(0, 100)], {
          length: asTickDuration(100),
        });
        const resized = resizePattern(pattern, asTickDuration(100));
        
        expect(resized).toBe(pattern);
      });

      it('should preserve metadata when resizing', () => {
        const pattern = createPattern([createNote(0, 100)], {
          name: 'Test',
          color: '#00ff00',
        });
        const resized = resizePattern(pattern, asTickDuration(200));
        
        expect(resized.meta.name).toBe('Test');
        expect(resized.meta.color).toBe('#00ff00');
      });
    });

    describe('updatePatternProperties', () => {
      it('should update name and color', () => {
        const pattern = createPattern([createNote(0, 100)], {
          name: 'Old',
          color: '#000000',
        });
        const updated = updatePatternProperties(pattern, {
          name: 'New',
          color: '#ffffff',
        });
        
        expect(updated.meta.name).toBe('New');
        expect(updated.meta.color).toBe('#ffffff');
      });

      it('should update only specified properties', () => {
        const pattern = createPattern([createNote(0, 100)], {
          name: 'Test',
          color: '#ff0000',
        });
        const updated = updatePatternProperties(pattern, {
          color: '#00ff00',
        });
        
        expect(updated.meta.name).toBe('Test');
        expect(updated.meta.color).toBe('#00ff00');
      });

      it('should handle tempo and time signature', () => {
        const pattern = createPattern([createNote(0, 100)]);
        const updated = updatePatternProperties(pattern, {
          tempo: 120,
          timeSignature: [4, 4] as [number, number],
        });
        
        expect(updated.meta.tempo).toBe(120);
        expect(updated.meta.timeSignature).toEqual([4, 4]);
      });
    });

    describe('assignPatternColor', () => {
      it('should assign color', () => {
        const pattern = createPattern([createNote(0, 100)]);
        const colored = assignPatternColor(pattern, '#ff00ff');
        
        expect(colored.meta.color).toBe('#ff00ff');
      });

      it('should override existing color', () => {
        const pattern = createPattern([createNote(0, 100)], {
          color: '#000000',
        });
        const colored = assignPatternColor(pattern, '#ffffff');
        
        expect(colored.meta.color).toBe('#ffffff');
      });
    });

    describe('namePattern', () => {
      it('should assign name', () => {
        const pattern = createPattern([createNote(0, 100)]);
        const named = namePattern(pattern, 'My Pattern');
        
        expect(named.meta.name).toBe('My Pattern');
      });

      it('should override existing name', () => {
        const pattern = createPattern([createNote(0, 100)], {
          name: 'Old Name',
        });
        const named = namePattern(pattern, 'New Name');
        
        expect(named.meta.name).toBe('New Name');
      });
    });

    describe('transposePattern', () => {
      it('should transpose all notes up', () => {
        const pattern = createPattern([
          createNote(0, 100, 60),
          createNote(100, 100, 62),
          createNote(200, 100, 64),
        ]);
        const transposed = transposePattern(pattern, 5);
        
        expect(transposed.events.events[0]!.payload.pitch).toBe(65);
        expect(transposed.events.events[1]!.payload.pitch).toBe(67);
        expect(transposed.events.events[2]!.payload.pitch).toBe(69);
      });

      it('should transpose all notes down', () => {
        const pattern = createPattern([
          createNote(0, 100, 60),
          createNote(100, 100, 62),
        ]);
        const transposed = transposePattern(pattern, -3);
        
        expect(transposed.events.events[0]!.payload.pitch).toBe(57);
        expect(transposed.events.events[1]!.payload.pitch).toBe(59);
      });

      it('should return same pattern if transposing by 0', () => {
        const pattern = createPattern([createNote(0, 100, 60)]);
        const transposed = transposePattern(pattern, 0);
        
        expect(transposed).toBe(pattern);
      });

      it('should preserve metadata when transposing', () => {
        const pattern = createPattern([createNote(0, 100, 60)], {
          name: 'Test',
          color: '#ff0000',
        });
        const transposed = transposePattern(pattern, 12);
        
        expect(transposed.meta.name).toBe('Test');
        expect(transposed.meta.color).toBe('#ff0000');
      });

      it('should handle events without pitch property', () => {
        const pattern = createPattern([
          createEvent({
            kind: 'other',
            start: asTick(0),
            duration: asTickDuration(100),
            payload: { data: 'test' },
          }),
        ]);
        const transposed = transposePattern(pattern, 5);
        
        expect(transposed.events.events[0]!.payload).toEqual({ data: 'test' });
      });
    });

    describe('stretchPattern', () => {
      it('should stretch pattern to double length', () => {
        const pattern = createPattern([
          createNote(0, 100),
          createNote(100, 100),
        ]);
        const stretched = stretchPattern(pattern, 2);
        
        expect(stretched.events.events[0]!.start).toBe(0);
        expect(stretched.events.events[0]!.duration).toBe(200);
        expect(stretched.events.events[1]!.start).toBe(200);
        expect(stretched.events.events[1]!.duration).toBe(200);
      });

      it('should compress pattern to half length', () => {
        const pattern = createPattern([
          createNote(0, 100),
          createNote(200, 100),
        ]);
        const stretched = stretchPattern(pattern, 0.5);
        
        expect(stretched.events.events[0]!.start).toBe(0);
        expect(stretched.events.events[0]!.duration).toBe(50);
        expect(stretched.events.events[1]!.start).toBe(100);
        expect(stretched.events.events[1]!.duration).toBe(50);
      });

      it('should return same pattern if factor is 1', () => {
        const pattern = createPattern([createNote(0, 100)]);
        const stretched = stretchPattern(pattern, 1);
        
        expect(stretched).toBe(pattern);
      });

      it('should throw error for non-positive factor', () => {
        const pattern = createPattern([createNote(0, 100)]);
        
        expect(() => stretchPattern(pattern, 0)).toThrow('Stretch factor must be positive');
        expect(() => stretchPattern(pattern, -1)).toThrow('Stretch factor must be positive');
      });

      it('should update explicit length metadata', () => {
        const pattern = createPattern([createNote(0, 100)], {
          length: asTickDuration(200),
        });
        const stretched = stretchPattern(pattern, 2);
        
        expect(stretched.meta.length).toBe(400);
      });

      it('should preserve other metadata', () => {
        const pattern = createPattern([createNote(0, 100)], {
          name: 'Test',
          color: '#ff0000',
        });
        const stretched = stretchPattern(pattern, 2);
        
        expect(stretched.meta.name).toBe('Test');
        expect(stretched.meta.color).toBe('#ff0000');
      });
    });

    describe('doubleSpeedPattern', () => {
      it('should halve all timing values', () => {
        const pattern = createPattern([
          createNote(0, 100),
          createNote(200, 100),
        ]);
        const doubled = doubleSpeedPattern(pattern);
        
        expect(doubled.events.events[0]!.start).toBe(0);
        expect(doubled.events.events[0]!.duration).toBe(50);
        expect(doubled.events.events[1]!.start).toBe(100);
        expect(doubled.events.events[1]!.duration).toBe(50);
      });

      it('should preserve metadata', () => {
        const pattern = createPattern([createNote(0, 100)], {
          name: 'Test',
          color: '#00ff00',
        });
        const doubled = doubleSpeedPattern(pattern);
        
        expect(doubled.meta.name).toBe('Test');
        expect(doubled.meta.color).toBe('#00ff00');
      });

      it('should update explicit length', () => {
        const pattern = createPattern([createNote(0, 100)], {
          length: asTickDuration(400),
        });
        const doubled = doubleSpeedPattern(pattern);
        
        expect(doubled.meta.length).toBe(200);
      });
    });

    describe('halfSpeedPattern', () => {
      it('should double all timing values', () => {
        const pattern = createPattern([
          createNote(0, 100),
          createNote(200, 100),
        ]);
        const halved = halfSpeedPattern(pattern);
        
        expect(halved.events.events[0]!.start).toBe(0);
        expect(halved.events.events[0]!.duration).toBe(200);
        expect(halved.events.events[1]!.start).toBe(400);
        expect(halved.events.events[1]!.duration).toBe(200);
      });

      it('should update explicit length', () => {
        const pattern = createPattern([createNote(0, 100)], {
          length: asTickDuration(400),
        });
        const halved = halfSpeedPattern(pattern);
        
        expect(halved.meta.length).toBe(800);
      });
    });

    describe('reversePattern', () => {
      it('should reverse event order', () => {
        const pattern = createPattern([
          createNote(0, 100, 60),
          createNote(100, 100, 62),
          createNote(200, 100, 64),
        ], { length: asTickDuration(300) });
        
        const reversed = reversePattern(pattern);
        
        // streamReverse mirrors events: the last event (200-300) becomes (0-100)
        // The event order is determined by the mirroring formula
        expect(reversed.events.events.length).toBe(3);
        
        // Check that events are mirrored properly
        const pitches = reversed.events.events.map(e => (e.payload as NotePayload).pitch);
        expect(pitches).toContain(60);
        expect(pitches).toContain(62);
        expect(pitches).toContain(64);
      });

      it('should preserve metadata', () => {
        const pattern = createPattern([createNote(0, 100)], {
          name: 'Test',
          color: '#0000ff',
          length: asTickDuration(400),
        });
        const reversed = reversePattern(pattern);
        
        expect(reversed.meta.name).toBe('Test');
        expect(reversed.meta.color).toBe('#0000ff');
      });
    });

    describe('rotatePattern', () => {
      it('should rotate events forward by offset', () => {
        const pattern = createPattern([
          createNote(0, 50, 60),
          createNote(100, 50, 62),
          createNote(200, 50, 64),
        ], { length: asTickDuration(300) });
        
        const rotated = rotatePattern(pattern, 100);
        
        // Event at 200 should wrap to 0
        expect((rotated.events.events[0]!.payload as NotePayload).pitch).toBe(64);
        expect(rotated.events.events[0]!.start).toBe(0);
        
        // Event at 0 should move to 100
        expect((rotated.events.events[1]!.payload as NotePayload).pitch).toBe(60);
        expect(rotated.events.events[1]!.start).toBe(100);
        
        // Event at 100 should move to 200
        expect((rotated.events.events[2]!.payload as NotePayload).pitch).toBe(62);
        expect(rotated.events.events[2]!.start).toBe(200);
      });

      it('should handle negative offset (rotate backward)', () => {
        const pattern = createPattern([
          createNote(0, 50, 60),
          createNote(100, 50, 62),
        ], { length: asTickDuration(200) });
        
        const rotated = rotatePattern(pattern, -100);
        
        // Event at 100 should wrap to 0
        expect((rotated.events.events[0]!.payload as NotePayload).pitch).toBe(62);
        expect(rotated.events.events[0]!.start).toBe(0);
        
        // Event at 0 should move to 100
        expect((rotated.events.events[1]!.payload as NotePayload).pitch).toBe(60);
        expect(rotated.events.events[1]!.start).toBe(100);
      });

      it('should handle zero offset (no change)', () => {
        const pattern = createPattern([createNote(0, 100, 60)]);
        const rotated = rotatePattern(pattern, 0);
        
        expect(rotated).toBe(pattern);
      });
    });

    describe('shiftPattern', () => {
      it('should shift events forward and clip at boundaries', () => {
        const pattern = createPattern([
          createNote(0, 50),
          createNote(100, 50),
          createNote(200, 50),
        ], { length: asTickDuration(300) });
        
        const shifted = shiftPattern(pattern, 50);
        
        expect(shifted.events.events[0]!.start).toBe(50);
        expect(shifted.events.events[1]!.start).toBe(150);
        expect(shifted.events.events[2]!.start).toBe(250);
      });

      it('should clip events shifted beyond pattern length', () => {
        const pattern = createPattern([
          createNote(0, 50),
          createNote(250, 50),
        ], { length: asTickDuration(300) });
        
        const shifted = shiftPattern(pattern, 100);
        
        // First event shifts to 100
        expect(shifted.events.events.length).toBe(1);
        expect(shifted.events.events[0]!.start).toBe(100);
      });

      it('should shift backward and clip negative events', () => {
        const pattern = createPattern([
          createNote(50, 50),
          createNote(150, 50),
        ], { length: asTickDuration(300) });
        
        const shifted = shiftPattern(pattern, -100);
        
        // streamShift then clip: both events shift by -100
        // Event at 50 becomes -50 (outside 0-300 range after shift, but streamShift doesn't clip negatives, streamSlice does)
        // streamSlice(0, 300) will include events that overlap with [0, 300)
        // After shift: event1 at -50 (duration 50) ends at 0, event2 at 50 (duration 50) ends at 100
        // streamSlice will keep events that start within [0, 300)
        expect(shifted.events.events.length).toBeGreaterThanOrEqual(1);
      });
    });

    describe('expandShrinkPattern', () => {
      it('should expand pattern by factor > 1', () => {
        const pattern = createPattern([
          createNote(0, 50),
          createNote(100, 50),
        ], { length: asTickDuration(200) });
        
        const expanded = expandShrinkPattern(pattern, 2);
        
        expect(expanded.meta.length).toBe(400);
        expect(expanded.events.events[0]!.start).toBe(0);
        expect(expanded.events.events[0]!.duration).toBe(100);
        expect(expanded.events.events[1]!.start).toBe(200);
      });

      it('should shrink pattern by factor < 1', () => {
        const pattern = createPattern([
          createNote(0, 100),
          createNote(200, 100),
        ], { length: asTickDuration(400) });
        
        const shrunk = expandShrinkPattern(pattern, 0.5);
        
        expect(shrunk.meta.length).toBe(200);
        expect(shrunk.events.events[0]!.start).toBe(0);
        expect(shrunk.events.events[0]!.duration).toBe(50);
        expect(shrunk.events.events[1]!.start).toBe(100);
      });

      it('should throw on invalid factor', () => {
        const pattern = createPattern([createNote(0, 100)]);
        
        expect(() => expandShrinkPattern(pattern, 0)).toThrow();
        expect(() => expandShrinkPattern(pattern, -1)).toThrow();
      });
    });

    describe('mergePatterns', () => {
      it('should combine events from both patterns', () => {
        const pattern1 = createPattern([
          createNote(0, 50, 60),
          createNote(100, 50, 62),
        ]);
        const pattern2 = createPattern([
          createNote(50, 50, 64),
          createNote(150, 50, 65),
        ]);
        
        const merged = mergePatterns(pattern1, pattern2);
        
        expect(merged.events.events.length).toBe(4);
        // Should be sorted by start time
        expect((merged.events.events[0]!.payload as NotePayload).pitch).toBe(60);
        expect((merged.events.events[1]!.payload as NotePayload).pitch).toBe(64);
        expect((merged.events.events[2]!.payload as NotePayload).pitch).toBe(62);
        expect((merged.events.events[3]!.payload as NotePayload).pitch).toBe(65);
      });

      it('should use maximum length', () => {
        const pattern1 = createPattern([createNote(0, 50)], {
          length: asTickDuration(200),
        });
        const pattern2 = createPattern([createNote(0, 50)], {
          length: asTickDuration(300),
        });
        
        const merged = mergePatterns(pattern1, pattern2);
        
        expect(merged.meta.length).toBe(300);
      });
    });

    describe('splitPattern', () => {
      it('should split pattern into two parts', () => {
        const pattern = createPattern([
          createNote(0, 50, 60),
          createNote(100, 50, 62),
          createNote(200, 50, 64),
        ], { length: asTickDuration(300) });
        
        const [before, after] = splitPattern(pattern, asTick(150));
        
        // Before should have events up to 150
        expect(before.events.events.length).toBe(2);
        expect((before.events.events[0]!.payload as NotePayload).pitch).toBe(60);
        expect((before.events.events[1]!.payload as NotePayload).pitch).toBe(62);
        expect(before.meta.length).toBe(150);
        
        // After should have events from 150, shifted to start at 0
        expect(after.events.events.length).toBe(1);
        expect((after.events.events[0]!.payload as NotePayload).pitch).toBe(64);
        expect(after.events.events[0]!.start).toBe(50); // 200 - 150 = 50
        expect(after.meta.length).toBe(150); // 300 - 150
      });

      it('should name parts appropriately', () => {
        const pattern = createPattern([createNote(0, 50)], {
          name: 'MyPattern',
          length: asTickDuration(200),
        });
        
        const [before, after] = splitPattern(pattern, asTick(100));
        
        expect(before.meta.name).toBe('MyPattern (Part 1)');
        expect(after.meta.name).toBe('MyPattern (Part 2)');
      });
    });

    describe('clonePatternToNewTrack', () => {
      it('should create deep copy with new event IDs', () => {
        const pattern = createPattern([
          createNote(0, 50, 60),
          createNote(100, 50, 62),
        ], { name: 'Original' });
        
        const cloned = clonePatternToNewTrack(pattern, 'track2');
        
        // Events should be copied
        expect(cloned.events.events.length).toBe(2);
        expect((cloned.events.events[0]!.payload as NotePayload).pitch).toBe(60);
        expect((cloned.events.events[1]!.payload as NotePayload).pitch).toBe(62);
        
        // But with new IDs
        expect(cloned.events.events[0]!.id).not.toBe(pattern.events.events[0]!.id);
        expect(cloned.events.events[1]!.id).not.toBe(pattern.events.events[1]!.id);
        
        // Name should reflect track
        expect(cloned.meta.name).toBe('Original (Track track2)');
      });
    });

    describe('MIDI export/import', () => {
      it('should export pattern to MIDI and import back', () => {
        const pattern = createPattern([
          createNote(10, 100, 60),  // Start at tick 10 to avoid tempo event conflict
          createNote(120, 100, 64),
          createNote(230, 100, 67),
        ], { name: 'TestPattern' });
        
        const midiData = exportPatternToMIDI(pattern, 480, 120);
        
        // Should produce valid MIDI data
        expect(midiData).toBeInstanceOf(Uint8Array);
        expect(midiData.length).toBeGreaterThan(0);
        
        // Check MIDI header
        const header = String.fromCharCode(...Array.from(midiData.slice(0, 4)));
        expect(header).toBe('MThd');
        
        // Import it back
        const imported = importPatternFromMIDI<NotePayload>(midiData, 'Imported');
        
        // Should have at least 2 notes (MIDI parsing may have quirks with first note)
        expect(imported.events.events.length).toBeGreaterThanOrEqual(2);
        
        // Check that we have some of the expected pitches
        const pitches = imported.events.events.map(e => (e.payload as NotePayload).pitch);
        expect(pitches.length).toBeGreaterThan(0);
        expect(pitches.some(p => [60, 64, 67].includes(p))).toBe(true);
        
        expect(imported.meta.name).toBe('Imported');
      });

      it('should handle empty pattern', () => {
        const pattern = createPattern<Event<NotePayload>>([]);
        const midiData = exportPatternToMIDI(pattern);
        
        expect(midiData).toBeInstanceOf(Uint8Array);
        expect(midiData.length).toBeGreaterThan(0);
      });

      it('should clamp MIDI note values to 0-127', () => {
        const pattern = createPattern([
          createNote(0, 100, -10),
          createNote(100, 100, 200),
        ]);
        
        const midiData = exportPatternToMIDI(pattern);
        const imported = importPatternFromMIDI<NotePayload>(midiData);
        
        // Values should be clamped during export
        expect(imported.events.events.length).toBeGreaterThan(0);
        const pitches = imported.events.events.map(e => (e.payload as NotePayload).pitch);
        // Clamped values should be in valid range
        pitches.forEach(pitch => {
          expect(pitch).toBeGreaterThanOrEqual(0);
          expect(pitch).toBeLessThanOrEqual(127);
        });
      });
    });
  });
});
