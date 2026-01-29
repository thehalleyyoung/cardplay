/**
 * @fileoverview Phase H Smoke Tests (H022-H023)
 * 
 * Tests for generative boards:
 * - H022: Arranger generates events visible in tracker/piano roll
 * - H023: Freeze prevents regeneration and is undoable
 * 
 * @module @cardplay/boards/builtins/phase-h-smoke.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSharedEventStore } from '../../state/event-store';
import { getClipRegistry } from '../../state/clip-registry';
import { getUndoStack } from '../../state/undo-stack';
import { getBoardRegistry } from '../registry';
import { registerBuiltinBoards } from './register';
import { generateIntoNewClip, freezeEvents, regenerateStream } from '../generators/actions';
import { createEvent } from '../../types/event';
import { EventKinds } from '../../types/event-kind';
import { asTick, asTickDuration } from '../../types/primitives';

describe('Phase H Smoke Tests', () => {
  beforeEach(() => {
    // Clear stores
    const store = getSharedEventStore();
    const clipRegistry = getClipRegistry();
    const undo = getUndoStack();
    
    // Clear all streams and clips
    for (const stream of store.getAllStreams()) {
      stream.events.forEach(event => {
        store.removeEvents(stream.id, [event.id]);
      });
    }
    clipRegistry.clearAll?.();
    undo.clear?.();
    
    // Register builtin boards (idempotent)
    registerBuiltinBoards();
  });

  describe('H022: Arranger generates events visible in tracker/piano roll', () => {
    it('should generate events visible across views', async () => {
      const store = getSharedEventStore();
      
      // Generate into new clip
      const result = await generateIntoNewClip({
        trackId: 'track-1',
        generator: 'melody',
        params: {},
        length: 960, // 4 beats
      });
      
      // Should succeed
      expect(result.success).toBe(true);
      expect(result.streamId).toBeTruthy();
      expect(result.eventCount).toBeGreaterThan(0);
      
      // Stream should exist and be accessible
      const stream = store.getStream(result.streamId);
      expect(stream).toBeDefined();
      
      // Events should be in the stream (viewable by tracker/piano roll/notation)
      expect(stream!.events.length).toBeGreaterThan(0);
      
      // Clip should be registered (viewable by session/timeline)
      if (result.clipId) {
        const registry = getClipRegistry();
        const clip = registry.getClip(result.clipId);
        expect(clip).toBeDefined();
        expect(clip!.streamId).toBe(result.streamId);
      }
    });

    it('should preserve generated events when switching boards', async () => {
      const store = getSharedEventStore();
      const boardRegistry = getBoardRegistry();
      
      // Start on AI arranger board
      const arrangerBoard = boardRegistry.get('ai-arranger');
      expect(arrangerBoard).toBeDefined();
      
      // Generate events
      const result = await generateIntoNewClip({
        trackId: 'track-1',
        generator: 'bass',
        params: {},
        length: 960,
      });
      
      expect(result.success).toBe(true);
      const eventCountAfterGenerate = store.getStream(result.streamId)!.events.length;
      
      // Switch to basic tracker board (manual)
      const trackerBoard = boardRegistry.get('basic-tracker');
      expect(trackerBoard).toBeDefined();
      
      // Events should still exist in stream (stores are shared)
      const stream = store.getStream(result.streamId);
      expect(stream).toBeDefined();
      expect(stream!.events.length).toBe(eventCountAfterGenerate);
      
      // Manual board can now edit these events
      const firstEvent = stream!.events[0];
      expect(firstEvent).toBeDefined();
    });

    it('should allow manual editing of generated events', async () => {
      const store = getSharedEventStore();
      
      // Generate events
      const result = await generateIntoNewClip({
        trackId: 'track-1',
        generator: 'drums',
        params: {},
        length: 480,
      });
      
      expect(result.success).toBe(true);
      
      // Manually add an event (like tracker would)
      const manualEvent = createEvent({
        kind: EventKinds.NOTE,
        start: asTick(100),
        duration: asTickDuration(50),
        payload: { note: 60, velocity: 100 },
      });
      
      store.addEvents(result.streamId, [manualEvent]);
      
      // Stream should now have generated + manual events
      const stream = store.getStream(result.streamId);
      expect(stream!.events.length).toBe(result.eventCount + 1);
      
      // Should be able to find the manual event
      const foundManual = stream!.events.find(e => e.id === manualEvent.id);
      expect(foundManual).toBeDefined();
    });
  });

  describe('H023: Freeze prevents regeneration and is undoable', () => {
    it('should freeze generated events', async () => {
      const store = getSharedEventStore();
      
      // Generate events
      const genResult = await generateIntoNewClip({
        trackId: 'track-1',
        generator: 'melody',
        params: {},
        length: 960,
      });
      
      expect(genResult.success).toBe(true);
      const originalEvents = [...store.getStream(genResult.streamId)!.events];
      
      // Freeze the events
      const freezeResult = freezeEvents({
        streamId: genResult.streamId,
        convertToManual: true,
      });
      
      expect(freezeResult.success).toBe(true);
      expect(freezeResult.eventCount).toBe(genResult.eventCount);
      
      // Events should still exist
      const stream = store.getStream(genResult.streamId);
      expect(stream!.events.length).toBe(genResult.eventCount);
      
      // Events should be marked differently (metadata changed)
      // Original events had generator metadata, frozen ones should not
      const frozenEvent = stream!.events[0];
      const originalEvent = originalEvents.find(e => e.id === frozenEvent.id);
      
      // This is a basic check - actual implementation may vary
      expect(frozenEvent.start).toBe(originalEvent!.start);
      expect(frozenEvent.duration).toBe(originalEvent!.duration);
    });

    it('should prevent regeneration after freeze', async () => {
      const store = getSharedEventStore();
      
      // Generate events
      const genResult = await generateIntoNewClip({
        trackId: 'track-1',
        generator: 'arp',
        params: { seed: 42 },
        length: 960,
      });
      
      // Freeze all events
      const freezeResult = freezeEvents({
        streamId: genResult.streamId,
        convertToManual: true,
      });
      
      expect(freezeResult.success).toBe(true);
      const frozenEvents = [...store.getStream(genResult.streamId)!.events];
      
      // Try to regenerate (should only affect non-frozen events)
      const regenResult = await regenerateStream({
        streamId: genResult.streamId,
        generator: 'arp',
        params: { seed: 99 },
        replaceMode: 'generated-only',
      });
      
      // Should "succeed" but with 0 events replaced (all were frozen)
      expect(regenResult.success).toBe(true);
      // Since all events are frozen/manual, none should be replaced
      const currentEvents = store.getStream(genResult.streamId)!.events;
      
      // Events should be unchanged
      expect(currentEvents.length).toBe(frozenEvents.length);
      currentEvents.forEach((event, i) => {
        expect(event.id).toBe(frozenEvents[i].id);
      });
    });

    it('should make freeze action undoable', async () => {
      const store = getSharedEventStore();
      const undo = getUndoStack();
      
      // Generate events
      const genResult = await generateIntoNewClip({
        trackId: 'track-1',
        generator: 'bass',
        params: {},
        length: 480,
      });
      
      const originalEvents = [...store.getStream(genResult.streamId)!.events];
      
      // Freeze events
      freezeEvents({
        streamId: genResult.streamId,
        convertToManual: false, // Just freeze, don't convert
      });
      
      const frozenEvents = [...store.getStream(genResult.streamId)!.events];
      
      // Undo freeze
      undo.undo();
      
      // Events should be back to original state
      const currentEvents = store.getStream(genResult.streamId)!.events;
      expect(currentEvents.length).toBe(originalEvents.length);
      
      // Check that events match original
      currentEvents.forEach((event, i) => {
        expect(event.id).toBe(originalEvents[i].id);
        expect(event.start).toBe(originalEvents[i].start);
      });
    });

    it('should support selective freeze (specific event IDs)', async () => {
      const store = getSharedEventStore();
      
      // Generate events
      const genResult = await generateIntoNewClip({
        trackId: 'track-1',
        generator: 'drums',
        params: {},
        length: 960,
      });
      
      const allEvents = store.getStream(genResult.streamId)!.events;
      expect(allEvents.length).toBeGreaterThan(0);
      
      // Freeze only first half of events
      const halfCount = Math.ceil(allEvents.length / 2);
      const eventIdsToFreeze = allEvents.slice(0, halfCount).map(e => e.id);
      
      const freezeResult = freezeEvents({
        streamId: genResult.streamId,
        eventIds: eventIdsToFreeze,
        convertToManual: true,
      });
      
      expect(freezeResult.success).toBe(true);
      expect(freezeResult.eventCount).toBe(halfCount);
      
      // Try to regenerate (should only replace unfrozen events)
      await regenerateStream({
        streamId: genResult.streamId,
        replaceMode: 'generated-only',
      });
      
      // Frozen events should still be present with original IDs
      const currentEvents = store.getStream(genResult.streamId)!.events;
      const frozenStillPresent = eventIdsToFreeze.filter(id =>
        currentEvents.some(e => e.id === id)
      );
      
      expect(frozenStillPresent.length).toBe(halfCount);
    });
  });
});
