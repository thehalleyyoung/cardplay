/**
 * @fileoverview Event Store Tests
 *
 * Change 315: Tests for legacy event alias ingestion and normalization.
 * Change 316: Tests for JSON-safe tags.
 *
 * @module @cardplay/state/event-store.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createEventStore, type SharedEventStore } from './event-store';
import { createEvent, createNoteEvent } from '../types/event';
import { EventKinds } from '../types/event-kind';
import { asTick, asTickDuration } from '../types/primitives';

describe('SharedEventStore', () => {
  let store: SharedEventStore;

  beforeEach(() => {
    store = createEventStore();
  });

  describe('stream CRUD', () => {
    it('creates and retrieves a stream', () => {
      const stream = store.createStream({ name: 'test-stream' });
      if (typeof stream === 'string') return; // legacy overload
      const retrieved = store.getStream(stream.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(stream.id);
    });

    it('deletes a stream', () => {
      const stream = store.createStream({ name: 'test-stream' });
      if (typeof stream === 'string') return;
      expect(store.deleteStream(stream.id)).toBe(true);
      expect(store.getStream(stream.id)).toBeUndefined();
    });
  });

  describe('event operations', () => {
    it('adds and retrieves events', () => {
      const stream = store.createStream({ name: 'events-test' });
      if (typeof stream === 'string') return;

      const note = createNoteEvent(0, 480, 60, 100);
      store.addEvents(stream.id, [note]);

      const retrieved = store.getStream(stream.id);
      expect(retrieved?.events).toHaveLength(1);
      expect(retrieved?.events[0]?.kind).toBe(EventKinds.NOTE);
    });
  });

  describe('Change 314: legacy event normalization at boundary', () => {
    it('normalizes legacy events with type/tick/durationTick fields', () => {
      const stream = store.createStream({ name: 'legacy-test' });
      if (typeof stream === 'string') return;

      // Legacy-shaped event with `type` instead of `kind`, `tick` instead of `start`
      const legacyEvent = {
        id: 'legacy-1',
        type: 'note',
        tick: 960,
        durationTick: 480,
        payload: { pitch: 60, velocity: 100 },
      } as any;

      store.addEvents(stream.id, [legacyEvent]);

      const retrieved = store.getStream(stream.id);
      expect(retrieved?.events).toHaveLength(1);

      const event = retrieved?.events[0];
      // Should have canonical fields populated
      expect(event?.kind).toBe('note');
      expect(event?.start).toBe(960);
      expect(event?.duration).toBe(480);
    });

    it('passes through canonical events unchanged', () => {
      const stream = store.createStream({ name: 'canonical-test' });
      if (typeof stream === 'string') return;

      const note = createNoteEvent(asTick(0), asTickDuration(480), 60, 100);
      store.addEvents(stream.id, [note]);

      const retrieved = store.getStream(stream.id);
      expect(retrieved?.events[0]?.id).toBe(note.id);
    });
  });

  describe('Change 316: JSON-safe tags', () => {
    it('stores tags as arrays, not Sets', () => {
      const event = createEvent({
        kind: EventKinds.NOTE,
        start: 0,
        duration: 480,
        payload: { pitch: 60, velocity: 100 },
        tags: ['lead', 'melody'],
      });

      expect(Array.isArray(event.tags)).toBe(true);
      expect(event.tags).toContain('lead');
      expect(event.tags).toContain('melody');
    });

    it('converts Set-like iterables to arrays', () => {
      const event = createEvent({
        kind: EventKinds.NOTE,
        start: 0,
        duration: 480,
        payload: { pitch: 60, velocity: 100 },
        tags: new Set(['a', 'b', 'c']),
      });

      expect(Array.isArray(event.tags)).toBe(true);
      expect(event.tags).toHaveLength(3);
    });

    it('tags survive JSON round-trip', () => {
      const event = createEvent({
        kind: EventKinds.NOTE,
        start: 0,
        duration: 480,
        payload: { pitch: 60, velocity: 100 },
        tags: ['percussion', 'accent'],
      });

      const json = JSON.stringify(event);
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed.tags)).toBe(true);
      expect(parsed.tags).toContain('percussion');
      expect(parsed.tags).toContain('accent');
    });
  });
});
