/**
 * @fileoverview Tests for serialization.
 */

import { describe, it, expect } from 'vitest';
import {
  createEvent,
  asTick,
  asTickDuration,
  EventKinds,
  createAbsoluteTrigger,
} from '../types';
import {
  eventToJSON,
  eventFromJSON,
  eventsToJSON,
  eventsFromJSON,
  eventToJSONString,
  eventFromJSONString,
} from './serialization';

// ============================================================================
// HELPERS
// ============================================================================

interface NotePayload {
  pitch: number;
  velocity: number;
}

const createNote = (start: number, duration: number): ReturnType<typeof createEvent<NotePayload>> => {
  return createEvent({
    kind: EventKinds.NOTE,
    start: asTick(start),
    duration: asTickDuration(duration),
    payload: { pitch: 60, velocity: 100 },
  });
};

// ============================================================================
// SERIALIZATION TESTS
// ============================================================================

describe('Serialization', () => {
  describe('eventToJSON', () => {
    it('should serialize basic event', () => {
      const event = createNote(0, 480);
      const json = eventToJSON(event);
      
      expect(json.id).toBe(event.id);
      expect(json.kind).toBe('note');
      expect(json.start).toBe(0);
      expect(json.duration).toBe(480);
      expect(json.payload).toEqual({ pitch: 60, velocity: 100 });
    });

    it('should serialize triggers', () => {
      const event = createEvent({
        kind: EventKinds.NOTE,
        start: 0,
        duration: 480,
        payload: { pitch: 60, velocity: 100 },
        triggers: [createAbsoluteTrigger(50, 'vibrato', { rate: 5 })],
      });
      const json = eventToJSON(event);
      
      expect(json.triggers).toBeDefined();
      expect(json.triggers!.length).toBe(1);
      expect(json.triggers![0]!.action).toBe('vibrato');
    });

    it('should serialize tags', () => {
      const event = createEvent({
        kind: EventKinds.NOTE,
        start: 0,
        duration: 480,
        payload: { pitch: 60, velocity: 100 },
        tags: ['melody', 'verse'],
      });
      const json = eventToJSON(event);
      
      expect(json.tags).toEqual(['melody', 'verse']);
    });

    it('should serialize metadata', () => {
      const event = createEvent({
        kind: EventKinds.NOTE,
        start: 0,
        duration: 480,
        payload: { pitch: 60, velocity: 100 },
        meta: { label: 'C4', color: '#ff0000' },
      });
      const json = eventToJSON(event);
      
      expect(json.meta).toBeDefined();
      expect(json.meta!.label).toBe('C4');
      expect(json.meta!.color).toBe('#ff0000');
    });
  });

  describe('eventFromJSON', () => {
    it('should deserialize basic event', () => {
      const original = createNote(0, 480);
      const json = eventToJSON(original);
      const restored = eventFromJSON<NotePayload>(json);
      
      expect(restored.id).toBe(original.id);
      expect(restored.kind).toBe(original.kind);
      expect(restored.start).toBe(original.start);
      expect(restored.duration).toBe(original.duration);
      expect(restored.payload).toEqual(original.payload);
    });

    it('should validate required fields', () => {
      expect(() => eventFromJSON({ } as any)).toThrow(TypeError);
      expect(() => eventFromJSON({ id: '123' } as any)).toThrow(TypeError);
    });

    it('should validate start/duration', () => {
      expect(() => eventFromJSON({
        id: '00000000-0000-0000-0000-000000000000',
        kind: 'note',
        start: -1,
        duration: 100,
        payload: {},
      })).toThrow(TypeError);
    });
  });

  describe('round-trip', () => {
    it('should preserve all fields through serialization', () => {
      const event = createEvent({
        kind: EventKinds.NOTE,
        start: 100,
        duration: 200,
        payload: { pitch: 64, velocity: 80 },
        triggers: [createAbsoluteTrigger(50, 'test', null)],
        tags: ['test'],
        meta: { label: 'E4', color: '#00ff00', author: 'test-user' },
      });
      
      const json = eventToJSON(event);
      const restored = eventFromJSON<NotePayload>(json);
      
      expect(restored.start).toBe(event.start);
      expect(restored.duration).toBe(event.duration);
      expect(restored.payload).toEqual(event.payload);
      expect(restored.triggers!.length).toBe(1);
      expect(Array.from(restored.tags!)).toEqual(['test']);
      expect(restored.meta!.label).toBe('E4');
    });
  });

  describe('batch operations', () => {
    it('should serialize multiple events', () => {
      const events = [
        createNote(0, 100),
        createNote(100, 100),
        createNote(200, 100),
      ];
      const json = eventsToJSON(events);
      
      expect(json.length).toBe(3);
      expect(json[0]!.start).toBe(0);
      expect(json[1]!.start).toBe(100);
      expect(json[2]!.start).toBe(200);
    });

    it('should deserialize multiple events', () => {
      const events = [
        createNote(0, 100),
        createNote(100, 100),
      ];
      const json = eventsToJSON(events);
      const restored = eventsFromJSON<NotePayload>(json);
      
      expect(restored.length).toBe(2);
      expect(restored[0]!.id).toBe(events[0]!.id);
      expect(restored[1]!.id).toBe(events[1]!.id);
    });
  });

  describe('string serialization', () => {
    it('should serialize to JSON string', () => {
      const event = createNote(0, 480);
      const str = eventToJSONString(event);
      
      expect(typeof str).toBe('string');
      expect(JSON.parse(str)).toBeDefined();
    });

    it('should deserialize from JSON string', () => {
      const event = createNote(0, 480);
      const str = eventToJSONString(event);
      const restored = eventFromJSONString<NotePayload>(str);
      
      expect(restored.id).toBe(event.id);
    });

    it('should support pretty printing', () => {
      const event = createNote(0, 480);
      const pretty = eventToJSONString(event, { pretty: true });
      const compact = eventToJSONString(event);
      
      expect(pretty.length).toBeGreaterThan(compact.length);
      expect(pretty).toContain('\n');
    });
  });
});
