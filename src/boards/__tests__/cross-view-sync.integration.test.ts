/**
 * @fileoverview Cross-View Synchronization Integration Tests
 * 
 * Tests that verify event edits in one view (tracker, piano roll, notation)
 * appear correctly in other views. Tests H022, I024, K009.
 * 
 * @module @cardplay/boards/__tests__/cross-view-sync
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getSharedEventStore } from '../../state/event-store';
import { getSelectionStore } from '../../state/selection-state';
import { getBoardRegistry } from '../registry';
import { switchBoard } from '../switching/switch-board';
import { registerBuiltinBoards } from '../builtins/register';
import { createEvent } from '../../types/event';
import { EventKinds } from '../../types/event-kind';
import { asTick, asTickDuration } from '../../types/primitives';
import type { EventStreamId } from '../../state/types';

describe('Cross-View Synchronization', () => {
  let streamId: EventStreamId;

  beforeEach(() => {
    // Register builtin boards
    registerBuiltinBoards();

    // Create a test stream
    const store = getSharedEventStore();
    streamId = store.createStream('Test Stream');
  });

  describe('H022: Arranger generates events visible in tracker/piano roll', () => {
    it('should show generated events in all views', () => {
      const store = getSharedEventStore();

      // Simulate arranger generating events
      const generatedEvents = [
        createEvent({
          kind: EventKinds.NOTE,
          start: asTick(0),
          duration: asTickDuration(480),
          payload: { note: 60, velocity: 100, generated: true }
        }),
        createEvent({
          kind: EventKinds.NOTE,
          start: asTick(480),
          duration: asTickDuration(480),
          payload: { note: 62, velocity: 100, generated: true }
        }),
        createEvent({
          kind: EventKinds.NOTE,
          start: asTick(960),
          duration: asTickDuration(480),
          payload: { note: 64, velocity: 100, generated: true }
        })
      ];

      // Add events to stream
      store.addEvents(streamId, generatedEvents);

      // Verify events exist in stream
      const stream = store.getStream(streamId);
      expect(stream).toBeDefined();
      expect(stream!.events).toHaveLength(3);

      // Verify events have correct properties
      const events = stream!.events;
      expect(events[0]!.payload.note).toBe(60);
      expect(events[1]!.payload.note).toBe(62);
      expect(events[2]!.payload.note).toBe(64);

      // Verify all events marked as generated
      expect(events.every((e) => e.payload.generated === true)).toBe(true);
    });

    it('should preserve generated flag when editing', () => {
      const store = getSharedEventStore();

      // Add generated event
      const event = createEvent({
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(480),
        payload: { note: 60, velocity: 100, generated: true }
      });

      store.addEvents(streamId, [event]);

      // Edit the event (e.g., change velocity)
      const updatedEvent = {
        ...event,
        payload: { ...event.payload, velocity: 80 }
      };

      store.updateEvent(streamId, event.id, updatedEvent);

      // Verify generated flag persists
      const stream = store.getStream(streamId);
      const storedEvent = stream!.events.find((e) => e.id === event.id);
      expect(storedEvent?.payload.generated).toBe(true);
      expect(storedEvent?.payload.velocity).toBe(80);
    });
  });

  describe('I024: Session clip selection updates notation/tracker editor', () => {
    it('should update active context when selecting clip', () => {
      const store = getSharedEventStore();
      
      // Add event to stream
      const event = createEvent({
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(480),
        payload: { note: 60, velocity: 100 }
      });

      store.addEvents(streamId, [event]);

      // Switch to session board
      const registry = getBoardRegistry();
      const sessionBoard = registry.search('session')[0];
      expect(sessionBoard).toBeDefined();

      switchBoard(sessionBoard!.id, {
        preserveActiveContext: true
      });

      // Simulate selecting a clip (would set active stream context)
      // In real implementation, session grid would do this
      const selectionStore = getSelectionStore();
      selectionStore.setSelection([event.id], streamId);

      // Verify selection is set
      const selection = selectionStore.getState();
      expect(selection.selected.has(event.id)).toBe(true);
    });

    it('should maintain selection across board switches', () => {
      const store = getSharedEventStore();
      const selectionStore = getSelectionStore();

      // Add events
      const events = [
        createEvent({
          kind: EventKinds.NOTE,
          start: asTick(0),
          duration: asTickDuration(480),
          payload: { note: 60, velocity: 100 }
        }),
        createEvent({
          kind: EventKinds.NOTE,
          start: asTick(480),
          duration: asTickDuration(480),
          payload: { note: 62, velocity: 100 }
        })
      ];

      store.addEvents(streamId, events);

      // Select events
      selectionStore.setSelection(events.map((e) => e.id), streamId);

      // Switch boards
      const registry = getBoardRegistry();
      const trackerBoard = registry.search('tracker')[0];
      expect(trackerBoard).toBeDefined();

      switchBoard(trackerBoard!.id, {
        preserveActiveContext: true,
        clearSelection: false // Don't clear selection
      });

      // Verify selection persists
      const selection = selectionStore.getState();
      expect(selection.selected.size).toBe(2);
      expect(selection.selected.has(events[0]!.id)).toBe(true);
      expect(selection.selected.has(events[1]!.id)).toBe(true);
    });
  });

  describe('K009: Edit same stream in tracker and notation', () => {
    it('should show edits from tracker in notation', () => {
      const store = getSharedEventStore();

      // Add event via "tracker"
      const trackerEvent = createEvent({
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(480),
        payload: { note: 60, velocity: 100 }
      });

      store.addEvents(streamId, [trackerEvent]);

      // Switch to notation board
      const registry = getBoardRegistry();
      const notationBoard = registry.search('notation')[0];
      expect(notationBoard).toBeDefined();

      switchBoard(notationBoard!.id, {
        preserveActiveContext: true
      });

      // Verify event visible in notation (same stream)
      const stream = store.getStream(streamId);
      expect(stream!.events).toHaveLength(1);
      expect(stream!.events[0]!.id).toBe(trackerEvent.id);
    });

    it('should show edits from notation in tracker', () => {
      const store = getSharedEventStore();

      // Add event via "notation"
      const notationEvent = createEvent({
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(480),
        payload: { note: 60, velocity: 100, staff: 0, voice: 0 }
      });

      store.addEvents(streamId, [notationEvent]);

      // Switch to tracker board
      const registry = getBoardRegistry();
      const trackerBoard = registry.search('tracker')[0];
      expect(trackerBoard).toBeDefined();

      switchBoard(trackerBoard!.id, {
        preserveActiveContext: true
      });

      // Verify event visible in tracker (same stream)
      const stream = store.getStream(streamId);
      expect(stream!.events).toHaveLength(1);
      expect(stream!.events[0]!.id).toBe(notationEvent.id);
      // Tracker might not care about staff/voice, but event should be present
    });

    it('should handle concurrent edits without corruption', () => {
      const store = getSharedEventStore();

      // Add initial events
      const events = [
        createEvent({
          kind: EventKinds.NOTE,
          start: asTick(0),
          duration: asTickDuration(480),
          payload: { note: 60, velocity: 100 }
        }),
        createEvent({
          kind: EventKinds.NOTE,
          start: asTick(480),
          duration: asTickDuration(480),
          payload: { note: 62, velocity: 100 }
        })
      ];

      store.addEvents(streamId, events);

      // Edit first event (tracker edit)
      const updatedEvent1 = {
        ...events[0]!,
        payload: { ...events[0]!.payload, velocity: 80 }
      };
      store.updateEvent(streamId, events[0]!.id, updatedEvent1);

      // Edit second event (notation edit)
      const updatedEvent2 = {
        ...events[1]!,
        payload: { ...events[1]!.payload, note: 64 }
      };
      store.updateEvent(streamId, events[1]!.id, updatedEvent2);

      // Verify both edits applied
      const stream = store.getStream(streamId);
      const stored1 = stream!.events.find((e) => e.id === events[0]!.id);
      const stored2 = stream!.events.find((e) => e.id === events[1]!.id);

      expect(stored1?.payload.velocity).toBe(80);
      expect(stored2?.payload.note).toBe(64);
    });
  });

  describe('Selection synchronization', () => {
    it('should sync selection across tracker/piano roll/notation', () => {
      const store = getSharedEventStore();
      const selectionStore = getSelectionStore();

      // Add events
      const events = [
        createEvent({
          kind: EventKinds.NOTE,
          start: asTick(0),
          duration: asTickDuration(480),
          payload: { note: 60, velocity: 100 }
        }),
        createEvent({
          kind: EventKinds.NOTE,
          start: asTick(480),
          duration: asTickDuration(480),
          payload: { note: 62, velocity: 100 }
        }),
        createEvent({
          kind: EventKinds.NOTE,
          start: asTick(960),
          duration: asTickDuration(480),
          payload: { note: 64, velocity: 100 }
        })
      ];

      store.addEvents(streamId, events);

      // Select events (simulating user selection)
      selectionStore.setSelection([events[0]!.id, events[2]!.id], streamId); // Select first and third

      // Verify selection state
      const selection = selectionStore.getState();
      expect(selection.selected.size).toBe(2);
      expect(selection.selected.has(events[0]!.id)).toBe(true);
      expect(selection.selected.has(events[2]!.id)).toBe(true);
      expect(selection.selected.has(events[1]!.id)).toBe(false);
    });

    it('should clear selection when switching with clearSelection option', () => {
      const store = getSharedEventStore();
      const selectionStore = getSelectionStore();

      // Add and select events
      const event = createEvent({
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(480),
        payload: { note: 60, velocity: 100 }
      });

      store.addEvents(streamId, [event]);
      selectionStore.setSelection([event.id], streamId);

      // Switch with clearSelection: true
      const registry = getBoardRegistry();
      const notationBoard = registry.search('notation')[0];
      expect(notationBoard).toBeDefined();

      switchBoard(notationBoard!.id, {
        clearSelection: true
      });

      // Verify selection cleared
      const selection = selectionStore.getState();
      expect(selection.selected.size).toBe(0);
    });
  });
});
