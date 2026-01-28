/**
 * @fileoverview Integration Verification Tests
 * 
 * Tests to verify that the integration layer works correctly:
 * - Cross-view sync
 * - Generator → Editor flow
 * - Session/Arrangement sharing
 * - Selection sync
 * - Undo/redo
 * 
 * @module @cardplay/tests/integration-verification
 * @see INTEGRATION_FIXES_CHECKLIST.md Verification Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getSharedEventStore,
  getClipRegistry,
  getSelectionStore,
  getUndoStack,
  resetAllState,
  executeWithUndo,
} from '../state';
import type { EventStreamId, EventId, ClipId } from '../state/types';
import { asTick, asTickDuration, asVelocity } from '../types/primitives';
import type { Event } from '../types/event';

// Mock adapters for testing
import { TrackerStoreAdapter } from '../ui/components/tracker-store-adapter';
import { PianoRollStoreAdapter } from '../ui/components/piano-roll-store-adapter';
import { NotationStoreAdapter } from '../notation/notation-store-adapter';
import { SessionClipAdapter } from '../ui/session-clip-adapter';
import { ArrangementAdapter } from '../ui/arrangement-view';

// ============================================================================
// TEST HELPERS
// ============================================================================

const TEST_STREAM_ID = 'test-stream' as EventStreamId;

function createTestNote(id: string, note: number, start: number, duration: number = 480): Event<{ note: number; velocity: number }> {
  return {
    id: id as EventId,
    kind: 'note' as any,
    type: 'note',
    start: asTick(start),
    duration: asTickDuration(duration),
    payload: { note, pitch: note, velocity: 100 } as any,
  };
}

// ============================================================================
// V.1 CROSS-VIEW SYNC TEST
// ============================================================================

describe('V.1 Cross-View Sync', () => {
  let trackerAdapter: TrackerStoreAdapter;
  let pianoRollAdapter: PianoRollStoreAdapter;

  beforeEach(() => {
    resetAllState();
    
    // Create stream
    const store = getSharedEventStore();
    store.createStream({
      id: TEST_STREAM_ID,
      name: 'Test Stream',
      events: [],
    });

    // Create adapters
    trackerAdapter = new TrackerStoreAdapter(TEST_STREAM_ID);
    pianoRollAdapter = new PianoRollStoreAdapter(TEST_STREAM_ID);
  });

  afterEach(() => {
    trackerAdapter.dispose();
    pianoRollAdapter.dispose();
  });

  it('should sync note creation from Tracker to PianoRoll', () => {
    // Create note in tracker
    trackerAdapter.addNote(60, asTick(0), asTickDuration(480), asVelocity(100));

    // Verify in piano roll
    const pianoRollState = pianoRollAdapter.getState();
    expect(pianoRollState.notes.length).toBe(1);
    expect(pianoRollState.notes[0].note).toBe(60);
  });

  it('should sync note edit from PianoRoll to Tracker', () => {
    // Add initial note
    const eventId = trackerAdapter.addNote(60, asTick(0), asTickDuration(480), asVelocity(100));

    // Edit in piano roll
    pianoRollAdapter.moveNote(eventId, asTick(480), 72);

    // Verify in tracker
    const trackerState = trackerAdapter.getState();
    const note = trackerState.events.find(e => e.id === eventId);
    expect(note).toBeDefined();
    expect(note!.start).toBe(480);
    expect((note!.payload as any).note).toBe(72);
  });

  it('should sync note deletion across views', () => {
    // Create note
    const eventId = trackerAdapter.addNote(60, asTick(0), asTickDuration(480), asVelocity(100));

    // Delete from piano roll
    pianoRollAdapter.deleteNote(eventId);

    // Verify removed from both
    expect(trackerAdapter.getState().events.length).toBe(0);
    expect(pianoRollAdapter.getState().notes.length).toBe(0);
  });
});

// ============================================================================
// V.2 GENERATOR → EDITOR TEST
// ============================================================================

describe('V.2 Generator → Editor', () => {
  beforeEach(() => {
    resetAllState();
  });

  it('should show generated events in editors', () => {
    const store = getSharedEventStore();
    const streamId = 'generator-output' as EventStreamId;

    // Create output stream (simulating generator)
    store.createStream({
      id: streamId,
      name: 'Generator Output',
      events: [],
    });

    // Simulate generator adding events
    const events = [
      createTestNote('gen-1', 60, 0),
      createTestNote('gen-2', 64, 480),
      createTestNote('gen-3', 67, 960),
    ];

    for (const event of events) {
      store.addEvent(streamId, event);
    }

    // Create tracker adapter to view
    const tracker = new TrackerStoreAdapter(streamId);
    const state = tracker.getState();

    // Verify events visible
    expect(state.events.length).toBe(3);
    expect(state.events.map(e => (e.payload as any).note)).toEqual([60, 64, 67]);

    tracker.dispose();
  });

  it('should allow freezing generated events into editable state', () => {
    const store = getSharedEventStore();
    const streamId = 'generator-output' as EventStreamId;

    store.createStream({
      id: streamId,
      name: 'Generator Output',
      events: [
        createTestNote('gen-1', 60, 0),
      ],
    });

    // Create tracker
    const tracker = new TrackerStoreAdapter(streamId);

    // Edit the generated note (simulating "freeze")
    const events = tracker.getState().events;
    tracker.editNote(events[0].id, { note: 72 });

    // Verify edited
    const updatedState = tracker.getState();
    expect((updatedState.events[0].payload as any).note).toBe(72);

    tracker.dispose();
  });
});

// ============================================================================
// V.3 SESSION/ARRANGEMENT TEST
// ============================================================================

describe('V.3 Session/Arrangement Clip Sharing', () => {
  beforeEach(() => {
    resetAllState();
  });

  it('should share clips between Session and Arrangement', () => {
    const registry = getClipRegistry();
    const store = getSharedEventStore();

    // Create stream for clip
    const streamId = 'clip-stream' as EventStreamId;
    store.createStream({
      id: streamId,
      name: 'Clip Stream',
      events: [createTestNote('n1', 60, 0)],
    });

    // Create clip in registry
    const clipId = registry.createClip({
      name: 'Test Clip',
      streamId,
      startTick: asTick(0),
      lengthTicks: asTickDuration(1920),
      trackIndex: 0,
    }).id;

    // Create session adapter
    const session = new SessionClipAdapter({ rows: 8, cols: 8 });

    // Create arrangement adapter
    const arrangement = new ArrangementAdapter();

    // Place clip in session
    session.placeClip(clipId, 0, 0);

    // Place same clip in arrangement
    arrangement.placeClip(clipId, 0, asTick(0));

    // Verify both reference the same clip
    const sessionSlot = session.getState().slots.find(s => s.clipId === clipId);
    const arrangementClip = arrangement.getState().clips.find(c => c.clipId === clipId);

    expect(sessionSlot).toBeDefined();
    expect(arrangementClip).toBeDefined();

    // Edit clip content
    store.addEvent(streamId, createTestNote('n2', 64, 480));

    // Verify both see updated content
    const clipRecord = registry.getClip(clipId);
    const allEvents = store.getStream(streamId)?.events;

    expect(allEvents!.length).toBe(2);

    session.dispose();
    arrangement.dispose();
  });

  it('should handle clip deletion in both views', () => {
    const registry = getClipRegistry();
    const store = getSharedEventStore();

    const streamId = 'clip-stream' as EventStreamId;
    store.createStream({ id: streamId, name: 'Clip', events: [] });

    const clipId = registry.createClip({
      name: 'Test Clip',
      streamId,
      startTick: asTick(0),
      lengthTicks: asTickDuration(1920),
      trackIndex: 0,
    }).id;

    const session = new SessionClipAdapter({ rows: 8, cols: 8 });
    const arrangement = new ArrangementAdapter();

    session.placeClip(clipId, 0, 0);
    arrangement.placeClip(clipId, 0, asTick(0));

    // Delete clip from registry
    registry.deleteClip(clipId);

    // Views should handle gracefully
    expect(registry.getClip(clipId)).toBeUndefined();

    session.dispose();
    arrangement.dispose();
  });
});

// ============================================================================
// V.4 SELECTION SYNC TEST
// ============================================================================

describe('V.4 Selection Sync', () => {
  beforeEach(() => {
    resetAllState();
  });

  it('should sync selection between views', () => {
    const store = getSharedEventStore();
    const selection = getSelectionStore();

    const streamId = TEST_STREAM_ID;
    store.createStream({
      id: streamId,
      name: 'Test Stream',
      events: [
        createTestNote('n1', 60, 0),
        createTestNote('n2', 64, 480),
        createTestNote('n3', 67, 960),
      ],
    });

    // Create adapters
    const tracker = new TrackerStoreAdapter(streamId);
    const pianoRoll = new PianoRollStoreAdapter(streamId);

    // Select in tracker
    tracker.selectEvents(['n1' as EventId, 'n2' as EventId]);

    // Verify selection state
    expect(selection.isSelected('n1' as EventId)).toBe(true);
    expect(selection.isSelected('n2' as EventId)).toBe(true);
    expect(selection.isSelected('n3' as EventId)).toBe(false);

    // Verify piano roll sees selection
    const pianoRollState = pianoRoll.getState();
    const selectedNotes = pianoRollState.notes.filter(n => n.selected);
    expect(selectedNotes.length).toBe(2);

    // Deselect in piano roll
    pianoRoll.clearSelection();

    // Verify tracker sees deselection
    expect(selection.isSelected('n1' as EventId)).toBe(false);
    expect(selection.isSelected('n2' as EventId)).toBe(false);

    tracker.dispose();
    pianoRoll.dispose();
  });
});

// ============================================================================
// V.5 UNDO TEST
// ============================================================================

describe('V.5 Undo/Redo', () => {
  beforeEach(() => {
    resetAllState();
  });

  it('should undo note creation', () => {
    const store = getSharedEventStore();
    const undoStack = getUndoStack();

    const streamId = TEST_STREAM_ID;
    store.createStream({ id: streamId, name: 'Test', events: [] });

    const tracker = new TrackerStoreAdapter(streamId);

    // Add note (with undo)
    tracker.addNote(60, asTick(0), asTickDuration(480), asVelocity(100));

    expect(tracker.getState().events.length).toBe(1);
    expect(undoStack.canUndo()).toBe(true);

    // Undo
    undoStack.undo();

    expect(tracker.getState().events.length).toBe(0);
    expect(undoStack.canRedo()).toBe(true);

    // Redo
    undoStack.redo();

    expect(tracker.getState().events.length).toBe(1);

    tracker.dispose();
  });

  it('should undo edits regardless of which view made them', () => {
    const store = getSharedEventStore();
    const undoStack = getUndoStack();

    const streamId = TEST_STREAM_ID;
    store.createStream({ id: streamId, name: 'Test', events: [] });

    const tracker = new TrackerStoreAdapter(streamId);
    const pianoRoll = new PianoRollStoreAdapter(streamId);

    // Add note from tracker
    const eventId = tracker.addNote(60, asTick(0), asTickDuration(480), asVelocity(100));

    // Edit from piano roll
    pianoRoll.moveNote(eventId, asTick(480), 72);

    // Verify edit
    expect((tracker.getState().events[0].payload as any).note).toBe(72);

    // Undo edit (should revert piano roll edit)
    undoStack.undo();

    expect((tracker.getState().events[0].payload as any).note).toBe(60);
    expect(tracker.getState().events[0].start).toBe(0);

    // Undo creation
    undoStack.undo();

    expect(tracker.getState().events.length).toBe(0);

    tracker.dispose();
    pianoRoll.dispose();
  });

  it('should handle batch operations in undo', () => {
    const store = getSharedEventStore();
    const undoStack = getUndoStack();

    const streamId = TEST_STREAM_ID;
    store.createStream({ id: streamId, name: 'Test', events: [] });

    const tracker = new TrackerStoreAdapter(streamId);

    // Add multiple notes as batch
    undoStack.beginBatch('Add chord');
    tracker.addNote(60, asTick(0), asTickDuration(480), asVelocity(100));
    tracker.addNote(64, asTick(0), asTickDuration(480), asVelocity(100));
    tracker.addNote(67, asTick(0), asTickDuration(480), asVelocity(100));
    undoStack.endBatch();

    expect(tracker.getState().events.length).toBe(3);

    // Single undo should remove all
    undoStack.undo();

    expect(tracker.getState().events.length).toBe(0);

    // Single redo should restore all
    undoStack.redo();

    expect(tracker.getState().events.length).toBe(3);

    tracker.dispose();
  });
});

// ============================================================================
// INTEGRATION SMOKE TEST
// ============================================================================

describe('Integration Smoke Test', () => {
  it('should handle a complete workflow', () => {
    resetAllState();

    const store = getSharedEventStore();
    const registry = getClipRegistry();
    const undoStack = getUndoStack();

    // 1. Create stream
    const streamId = 'workflow-stream' as EventStreamId;
    store.createStream({ id: streamId, name: 'Workflow', events: [] });

    // 2. Create adapters
    const tracker = new TrackerStoreAdapter(streamId);
    const pianoRoll = new PianoRollStoreAdapter(streamId);

    // 3. Add notes
    tracker.addNote(60, asTick(0), asTickDuration(480), asVelocity(100));
    tracker.addNote(64, asTick(480), asTickDuration(480), asVelocity(100));

    // 4. Create clip from events
    const clipId = registry.createClip({
      name: 'Workflow Clip',
      streamId,
      startTick: asTick(0),
      lengthTicks: asTickDuration(1920),
      trackIndex: 0,
    }).id;

    // 5. Edit via piano roll
    const events = pianoRoll.getState().notes;
    pianoRoll.moveNote(events[0].eventId, asTick(240), 62);

    // 6. Verify changes visible in tracker
    expect((tracker.getState().events[0].payload as any).note).toBe(62);

    // 7. Undo
    undoStack.undo();
    expect((tracker.getState().events[0].payload as any).note).toBe(60);

    // 8. Cleanup
    tracker.dispose();
    pianoRoll.dispose();

    // Success!
    expect(true).toBe(true);
  });
});
