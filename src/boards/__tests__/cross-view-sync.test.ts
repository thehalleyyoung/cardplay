/**
 * @fileoverview Cross-view synchronization integration tests
 * 
 * Tests that edits in one view (tracker/piano roll/notation) are reflected
 * in other views through the shared event store.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSharedEventStore } from '../../state/event-store';
import { createSelectionStore } from '../../state/selection-state';
import { generateEventId } from '../../types/event-id';
import { asTick, asTickDuration } from '../../types/primitives';
import { EventKinds } from '../../types/event-kind';
import type { EventStreamId } from '../../state/types';

describe('Cross-view Synchronization', () => {
  let testStreamId: EventStreamId;
  let selectionStore: ReturnType<typeof createSelectionStore>;

  beforeEach(() => {
    // Create a test stream
    const store = getSharedEventStore();
    const result = store.createStream({ name: 'Test Stream' });
    testStreamId = result.id;
    
    // Create fresh selection store
    selectionStore = createSelectionStore();
  });

  it('A055: should reflect tracker edits in piano roll view', () => {
    const store = getSharedEventStore();
    
    // Simulate tracker adding a note
    const noteId = generateEventId();
    store.addEvents(testStreamId, [{
      id: noteId,
      kind: EventKinds.NOTE,
      start: asTick(0),
      duration: asTickDuration(480),
      payload: { note: 60, velocity: 100 }
    }]);
    
    // Verify the note appears in the stream (which piano roll would read)
    const stream = store.getStream(testStreamId);
    expect(stream).toBeDefined();
    expect(stream?.events).toHaveLength(1);
    expect(stream?.events[0].id).toBe(noteId);
    expect(stream?.events[0].payload.note).toBe(60);
  });

  it('A056: should reflect piano roll edits in notation view', () => {
    const store = getSharedEventStore();
    
    // Simulate piano roll adding a note
    const noteId = generateEventId();
    store.addEvents(testStreamId, [{
      id: noteId,
      kind: EventKinds.NOTE,
      start: asTick(480),
      duration: asTickDuration(240),
      payload: { note: 64, velocity: 80 }
    }]);
    
    // Verify the note appears in the stream (which notation would read)
    const stream = store.getStream(testStreamId);
    expect(stream).toBeDefined();
    expect(stream?.events).toHaveLength(1);
    expect(stream?.events[0].payload.note).toBe(64);
    
    // Simulate piano roll editing the note
    store.updateEvent(testStreamId, noteId, {
      payload: { note: 67, velocity: 80 }
    });
    
    // Verify notation would see the updated note
    const updatedStream = store.getStream(testStreamId);
    expect(updatedStream?.events[0].payload.note).toBe(67);
  });

  it('A057: should sync selection across tracker/piano roll/notation using event IDs', () => {
    const store = getSharedEventStore();
    
    // Add multiple notes to the stream
    const note1 = generateEventId();
    const note2 = generateEventId();
    const note3 = generateEventId();
    
    store.addEvents(testStreamId, [
      {
        id: note1,
        kind: EventKinds.NOTE,
        start: asTick(0),
        duration: asTickDuration(480),
        payload: { note: 60, velocity: 100 }
      },
      {
        id: note2,
        kind: EventKinds.NOTE,
        start: asTick(480),
        duration: asTickDuration(480),
        payload: { note: 64, velocity: 100 }
      },
      {
        id: note3,
        kind: EventKinds.NOTE,
        start: asTick(960),
        duration: asTickDuration(480),
        payload: { note: 67, velocity: 100 }
      }
    ]);
    
    // Simulate notation selecting the second note (by event ID)
    selectionStore.setSelection([note2]);
    
    // Verify tracker/piano roll would see the same selection
    const selection = selectionStore.getState();
    expect(selection.selected.has(note2)).toBe(true);
    expect(selection.selected.size).toBe(1);
    
    // Simulate tracker adding to selection
    selectionStore.setSelection([note2, note3]);
    
    // Verify all views see the updated selection
    const updatedSelection = selectionStore.getState();
    expect(updatedSelection.selected.has(note2)).toBe(true);
    expect(updatedSelection.selected.has(note3)).toBe(true);
    expect(updatedSelection.selected.size).toBe(2);
  });

  it('should handle concurrent edits from multiple views', () => {
    const store = getSharedEventStore();
    
    // Simulate tracker and piano roll editing at the same time
    const note1 = generateEventId();
    const note2 = generateEventId();
    
    // Tracker adds a note
    store.addEvents(testStreamId, [{
      id: note1,
      kind: EventKinds.NOTE,
      start: asTick(0),
      duration: asTickDuration(480),
      payload: { note: 60, velocity: 100 }
    }]);
    
    // Piano roll adds another note
    store.addEvents(testStreamId, [{
      id: note2,
      kind: EventKinds.NOTE,
      start: asTick(480),
      duration: asTickDuration(480),
      payload: { note: 64, velocity: 100 }
    }]);
    
    // Both views should see both notes
    const stream = store.getStream(testStreamId);
    expect(stream?.events).toHaveLength(2);
    expect(stream?.events.find(e => e.id === note1)).toBeDefined();
    expect(stream?.events.find(e => e.id === note2)).toBeDefined();
  });

  it('should maintain event identity across views', () => {
    const store = getSharedEventStore();
    
    // Add a note
    const noteId = generateEventId();
    store.addEvents(testStreamId, [{
      id: noteId,
      kind: EventKinds.NOTE,
      start: asTick(0),
      duration: asTickDuration(480),
      payload: { note: 60, velocity: 100 }
    }]);
    
    // Get the event from different "view" perspectives
    const stream1 = store.getStream(testStreamId);
    const event1 = stream1?.events[0];
    
    const stream2 = store.getStream(testStreamId);
    const event2 = stream2?.events[0];
    
    // Event IDs should be stable across views
    expect(event1?.id).toBe(noteId);
    expect(event2?.id).toBe(noteId);
    expect(event1?.id).toBe(event2?.id);
  });
});
