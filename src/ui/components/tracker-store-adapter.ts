/**
 * @fileoverview Tracker SharedEventStore Adapter - Connects TrackerPanel to shared state.
 * 
 * This adapter provides the bridge between TrackerPanel's functional state management
 * and the SharedEventStore singleton. It enables:
 * - Reading events from SharedEventStore instead of local state
 * - Writing edits back to SharedEventStore with undo support
 * - Selection synchronization via SelectionStore
 * - Real-time updates when events change elsewhere
 * 
 * @module @cardplay/ui/components/tracker-store-adapter
 * @see INTEGRATION_FIXES_CHECKLIST.md Phase B.1
 */

import type { Event } from '../../types/event';
import type { Tick, TickDuration } from '../../types/primitives';
import { asTick, asTickDuration } from '../../types/primitives';
import { createEvent, updateEvent } from '../../types/event';
import { EventKinds } from '../../types/event-kind';
import type {
  EventStreamId,
  EventId,
  SubscriptionId,
} from '../../state/types';
import {
  getSharedEventStore,
  getSelectionStore,
  executeWithUndo,
} from '../../state';
import type {
  TrackerPanelConfig,
  TrackerCursor,
  TrackerSelection,
} from './tracker-panel';
import { createTrackerPanelConfig } from './tracker-panel';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Tracker state that uses SharedEventStore for event storage.
 * Replaces the `stream` field with `streamId`.
 */
export interface TrackerSharedState {
  /** Configuration */
  readonly config: TrackerPanelConfig;
  /** Current cursor position */
  readonly cursor: TrackerCursor;
  /** Current selection (if any) */
  readonly selection?: TrackerSelection;
  /** Scroll position (top row) */
  readonly scrollRow: number;
  /** Scroll position (left pixel) */
  readonly scrollX: number;
  /** Playhead position (row index) */
  readonly playheadRow: number;
  /** Stream ID in SharedEventStore (replaces local stream) */
  readonly streamId: EventStreamId;
}

/**
 * Callback for when tracker state changes.
 */
export type TrackerStateCallback = (state: TrackerSharedState) => void;

/**
 * Options for creating a shared tracker adapter.
 */
export interface TrackerAdapterOptions {
  /** Stream ID to use (created if doesn't exist) */
  streamId?: EventStreamId;
  /** Initial events (only used if creating new stream) */
  initialEvents?: readonly Event<unknown>[];
  /** Tracker configuration */
  config?: Partial<TrackerPanelConfig>;
}

// ============================================================================
// TRACKER ADAPTER CLASS
// ============================================================================

/**
 * TrackerStoreAdapter connects a TrackerPanel to the SharedEventStore.
 * 
 * Usage:
 * ```typescript
 * const adapter = new TrackerStoreAdapter({ streamId: 'track-1-events' });
 * 
 * // Subscribe to state changes
 * adapter.subscribe((state) => {
 *   renderTracker(state);
 * });
 * 
 * // Edit operations automatically sync to store with undo
 * adapter.enterNote(60, 100); // Adds C4 at cursor
 * adapter.setVelocity(80);    // Changes velocity
 * 
 * // Cleanup
 * adapter.dispose();
 * ```
 */
export class TrackerStoreAdapter {
  private state: TrackerSharedState;
  private stateSubscriptions = new Set<TrackerStateCallback>();
  private storeSubscriptionId: SubscriptionId | null = null;
  private selectionSubscriptionId: SubscriptionId | null = null;
  private disposed = false;

  constructor(optionsOrStreamId: TrackerAdapterOptions | EventStreamId = {}) {
    const options: TrackerAdapterOptions =
      typeof optionsOrStreamId === 'string' ? { streamId: optionsOrStreamId } : optionsOrStreamId;

    const store = getSharedEventStore();
    
    // Create or get stream
    let streamId: EventStreamId;
    if (options.streamId) {
      streamId = options.streamId;
      if (!store.getStream(streamId)) {
        store.createStream({
          id: streamId,
          name: `tracker-${Date.now()}`,
          events: options.initialEvents ?? [],
        });
      } else if (options.initialEvents) {
        store.setStream(streamId, [...options.initialEvents]);
      }
    } else {
      streamId = store.createStream({
        name: `tracker-${Date.now()}`,
        events: options.initialEvents ?? [],
      }).id;
    }
    
    // Create initial state
    const fullConfig = createTrackerPanelConfig(options.config);
    const firstTrack = fullConfig.tracks[0];

    const initialState: TrackerSharedState = {
      config: fullConfig,
      cursor: {
        row: 0,
        trackId: firstTrack?.id ?? 'track-1',
        column: 'note',
      },
      scrollRow: 0,
      scrollX: 0,
      playheadRow: 0,
      streamId,
    };

    this.state = Object.freeze(initialState);
    
    // Subscribe to store changes
    this.storeSubscriptionId = store.subscribe(streamId, () => {
      this.notifyStateChange();
    });
    
    // Subscribe to selection changes
    const selection = getSelectionStore();
    this.selectionSubscriptionId = selection.subscribe(streamId, (selectedIds) => {
      // Update selection state based on SelectionStore
      this.updateSelectionFromStore(selectedIds);
    });
  }
  
  // ==========================================================================
  // STATE ACCESS
  // ==========================================================================
  
  /**
   * Gets the current tracker state.
   */
  getState(): TrackerSharedState & { readonly events: readonly Event<unknown>[] } {
    return Object.freeze({
      ...this.state,
      events: this.getEvents(),
    });
  }
  
  /**
   * Gets events from the shared store.
   */
  getEvents(): readonly Event<unknown>[] {
    const store = getSharedEventStore();
    return store.getStream(this.state.streamId)?.events ?? [];
  }
  
  /**
   * Gets the stream ID.
   */
  getStreamId(): EventStreamId {
    return this.state.streamId;
  }
  
  // ==========================================================================
  // SUBSCRIPTIONS
  // ==========================================================================
  
  /**
   * Subscribes to state changes.
   */
  subscribe(callback: TrackerStateCallback): () => void {
    this.stateSubscriptions.add(callback);
    
    // Immediately call with current state
    callback(this.state);
    
    return () => {
      this.stateSubscriptions.delete(callback);
    };
  }
  
  /**
   * Notifies all subscribers of state change.
   */
  private notifyStateChange(): void {
    for (const callback of this.stateSubscriptions) {
      try {
        callback(this.state);
      } catch (e) {
        console.error('Tracker state callback error:', e);
      }
    }
  }
  
  // ==========================================================================
  // CURSOR OPERATIONS
  // ==========================================================================

  /**
   * Legacy helper used by integration tests: add a note event at a tick.
   */
  addNote(note: number, start: Tick, duration: TickDuration, velocity: number): EventId {
    const store = getSharedEventStore();
    const streamId = this.state.streamId;

    const event = createEvent({
      kind: EventKinds.NOTE,
      start,
      duration,
      payload: { pitch: note, note, velocity },
    });

    executeWithUndo({
      type: 'events-add',
      description: `Add note ${note}`,
      execute: () => {
        store.addEvent(streamId, event);
        return event;
      },
      undo: (e) => {
        store.removeEvents(streamId, [e.id]);
      },
      redo: (e) => {
        store.addEvent(streamId, e);
      },
    });

    return event.id as EventId;
  }

  /**
   * Legacy helper used by integration tests: edit a note's payload/start/duration.
   */
  editNote(eventId: EventId, changes: Partial<{ note: number; pitch: number; velocity: number; start: Tick; duration: TickDuration }>): void {
    const store = getSharedEventStore();
    const streamId = this.state.streamId;
    const events = this.getEvents();
    const existing = events.find(e => e.id === eventId);
    if (!existing) return;

    const existingPayload = (existing.payload ?? {}) as Record<string, unknown>;
    const nextNote = changes.note ?? changes.pitch;
    const nextPayload: Record<string, unknown> = {
      ...existingPayload,
      ...(nextNote !== undefined ? { note: nextNote, pitch: nextNote } : {}),
      ...(changes.velocity !== undefined ? { velocity: changes.velocity } : {}),
    };

    const prev = existing;
    const nextStart = changes.start ?? existing.start;
    const nextDuration = changes.duration ?? existing.duration;

    executeWithUndo({
      type: 'events-modify',
      description: 'Edit note',
      execute: () => {
        store.updateEvent(streamId, eventId, {
          start: nextStart,
          duration: nextDuration,
          payload: nextPayload,
        } as any);
        return prev;
      },
      undo: (before) => {
        store.updateEvent(streamId, eventId, {
          start: before.start,
          duration: before.duration,
          payload: before.payload as any,
        } as any);
      },
      redo: () => {
        store.updateEvent(streamId, eventId, {
          start: nextStart,
          duration: nextDuration,
          payload: nextPayload,
        } as any);
      },
    });
  }

  /**
   * Legacy helper used by integration tests: select events in the shared SelectionStore.
   */
  selectEvents(eventIds: readonly EventId[]): void {
    const selection = getSelectionStore();
    selection.setSelection(this.state.streamId, eventIds as unknown as readonly string[]);
    this.notifyStateChange();
  }
  
  /**
   * Moves cursor to a new position.
   */
  moveCursor(row: number, trackId?: string, column?: string): void {
    this.state = Object.freeze({
      ...this.state,
      cursor: {
        row: Math.max(0, Math.min(row, this.state.config.patternLength - 1)),
        trackId: trackId ?? this.state.cursor.trackId,
        column: (column ?? this.state.cursor.column) as any,
      },
    });
    this.notifyStateChange();
  }
  
  /**
   * Moves cursor up by specified rows.
   */
  cursorUp(rows: number = 1): void {
    this.moveCursor(this.state.cursor.row - rows);
  }
  
  /**
   * Moves cursor down by specified rows.
   */
  cursorDown(rows: number = 1): void {
    this.moveCursor(this.state.cursor.row + rows);
  }
  
  // ==========================================================================
  // EDIT OPERATIONS (WITH UNDO)
  // ==========================================================================
  
  /**
   * Enters a note at the current cursor position with undo support.
   */
  enterNote(
    pitch: number,
    velocity: number = 100,
    duration?: TickDuration
  ): void {
    const store = getSharedEventStore();
    const streamId = this.state.streamId;
    const { cursor, config } = this.state;
    const rowTick = asTick(cursor.row);
    const noteDuration = duration ?? asTickDuration(config.rowsPerBeat);
    
    // Find existing event at this position
    const events = this.getEvents();
    const existingEvent = events.find(e => e.start === rowTick);
    
    // Create new note event
    const newEvent = createEvent({
      kind: EventKinds.NOTE,
      start: rowTick,
      duration: noteDuration,
      payload: { pitch, note: pitch, velocity },
    });
    
    executeWithUndo({
      type: 'event:add',
      description: `Add note ${pitchToName(pitch)}`,
      execute: () => {
        if (existingEvent) {
          store.removeEvents(streamId, [existingEvent.id as EventId]);
        }
        store.addEvents(streamId, [newEvent]);
        return { newEventId: newEvent.id, removedEvent: existingEvent };
      },
      undo: (result) => {
        store.removeEvents(streamId, [newEvent.id as EventId]);
        if (result.removedEvent) {
          store.addEvents(streamId, [result.removedEvent]);
        }
      },
      redo: (result) => {
        if (result.removedEvent) {
          store.removeEvents(streamId, [result.removedEvent.id as EventId]);
        }
        store.addEvents(streamId, [newEvent]);
      },
    });
    
    // Move cursor down after entering note
    this.cursorDown();
  }
  
  /**
   * Deletes the event at the current cursor position.
   */
  deleteNote(): void {
    const store = getSharedEventStore();
    const streamId = this.state.streamId;
    const { cursor } = this.state;
    const rowTick = asTick(cursor.row);
    
    // Find event at cursor
    const events = this.getEvents();
    const event = events.find(e => e.start === rowTick);
    
    if (!event) return;
    
    executeWithUndo({
      type: 'event:delete',
      description: `Delete note`,
      execute: () => {
        store.removeEvents(streamId, [event.id as EventId]);
        return event;
      },
      undo: (removedEvent) => {
        store.addEvents(streamId, [removedEvent]);
      },
      redo: (removedEvent) => {
        store.removeEvents(streamId, [removedEvent.id as EventId]);
      },
    });
  }
  
  /**
   * Sets velocity for the event at cursor.
   */
  setVelocity(velocity: number): void {
    const store = getSharedEventStore();
    const streamId = this.state.streamId;
    const { cursor } = this.state;
    const rowTick = asTick(cursor.row);
    
    const events = this.getEvents();
    const event = events.find(e => e.start === rowTick);
    
    if (!event) return;
    
    const oldVelocity = (event.payload as any)?.velocity ?? 100;
    const newVelocity = Math.max(0, Math.min(127, velocity));
    
    executeWithUndo({
      type: 'event:update',
      description: `Set velocity to ${newVelocity}`,
      execute: () => {
        const payload = event.payload as Record<string, unknown>;
        const updated = updateEvent(event, {
          payload: { ...payload, velocity: newVelocity },
        });
        store.updateStream(streamId, (stream) => ({
          events: stream.events.map(e => (e.id === event.id ? updated : e)),
        }));
        return oldVelocity;
      },
      undo: (prevVelocity) => {
        const payload = event.payload as Record<string, unknown>;
        const restored = updateEvent(event, {
          payload: { ...payload, velocity: prevVelocity },
        });
        store.updateStream(streamId, (stream) => ({
          events: stream.events.map(e => (e.id === event.id ? restored : e)),
        }));
      },
      redo: () => {
        const payload = event.payload as Record<string, unknown>;
        const updated = updateEvent(event, {
          payload: { ...payload, velocity: newVelocity },
        });
        store.updateStream(streamId, (stream) => ({
          events: stream.events.map(e => (e.id === event.id ? updated : e)),
        }));
      },
    });
  }
  
  /**
   * Sets duration for the event at cursor.
   */
  setDuration(duration: TickDuration | number): void {
    const store = getSharedEventStore();
    const streamId = this.state.streamId;
    const { cursor } = this.state;
    const rowTick = asTick(cursor.row);
    
    const events = this.getEvents();
    const event = events.find(e => e.start === rowTick);
    
    if (!event) return;
    
    const oldDuration = event.duration;
    const newDuration = typeof duration === 'number' ? asTickDuration(duration) : duration;
    
    executeWithUndo({
      type: 'event:update',
      description: `Set duration to ${newDuration}`,
      execute: () => {
        const updated = updateEvent(event, { duration: newDuration });
        store.updateStream(streamId, (stream) => ({
          events: stream.events.map(e => (e.id === event.id ? updated : e)),
        }));
        return oldDuration;
      },
      undo: (prevDuration) => {
        const restored = updateEvent(event, { duration: prevDuration });
        store.updateStream(streamId, (stream) => ({
          events: stream.events.map(e => (e.id === event.id ? restored : e)),
        }));
      },
      redo: () => {
        const updated = updateEvent(event, { duration: newDuration });
        store.updateStream(streamId, (stream) => ({
          events: stream.events.map(e => (e.id === event.id ? updated : e)),
        }));
      },
    });
  }
  
  /**
   * Transposes note at cursor by semitones.
   */
  transpose(semitones: number): void {
    const store = getSharedEventStore();
    const streamId = this.state.streamId;
    const { cursor } = this.state;
    const rowTick = asTick(cursor.row);
    
    const events = this.getEvents();
    const event = events.find(e => e.start === rowTick);
    
    if (!event || !('pitch' in (event.payload as object))) return;
    
    const payload = event.payload as Record<string, unknown> & { pitch: number };
    const oldPitch = payload.pitch;
    const newPitch = Math.max(0, Math.min(127, oldPitch + semitones));
    
    executeWithUndo({
      type: 'event:update',
      description: `Transpose ${semitones > 0 ? '+' : ''}${semitones} semitones`,
      execute: () => {
        const updated = updateEvent(event, {
          payload: { ...payload, pitch: newPitch, note: newPitch },
        });
        store.updateStream(streamId, (stream) => ({
          events: stream.events.map(e => (e.id === event.id ? updated : e)),
        }));
        return oldPitch;
      },
      undo: (prevPitch) => {
        const restored = updateEvent(event, {
          payload: { ...payload, pitch: prevPitch, note: prevPitch },
        });
        store.updateStream(streamId, (stream) => ({
          events: stream.events.map(e => (e.id === event.id ? restored : e)),
        }));
      },
      redo: () => {
        const updated = updateEvent(event, {
          payload: { ...payload, pitch: newPitch, note: newPitch },
        });
        store.updateStream(streamId, (stream) => ({
          events: stream.events.map(e => (e.id === event.id ? updated : e)),
        }));
      },
    });
  }
  
  /**
   * Transposes by octave (12 semitones).
   */
  transposeOctave(octaves: number): void {
    this.transpose(octaves * 12);
  }
  
  // ==========================================================================
  // SELECTION OPERATIONS
  // ==========================================================================
  
  /**
   * Selects events by row range.
   */
  selectRange(startRow: number, endRow: number): void {
    const selection = getSelectionStore();
    const streamId = this.state.streamId;
    const events = this.getEvents();
    
    // Find events in range
    const startTick = asTick(Math.min(startRow, endRow));
    const endTick = asTick(Math.max(startRow, endRow) + 1);
    
    const eventIds = events
      .filter(e => e.start >= startTick && e.start < endTick)
      .map(e => e.id as EventId);
    
    selection.setSelection(streamId, eventIds);
    
    // Update local selection state
    const selectionState: TrackerSelection = {
      startRow: Math.min(startRow, endRow),
      endRow: Math.max(startRow, endRow),
      startTrack: this.state.cursor.trackId,
      endTrack: this.state.cursor.trackId,
      startColumn: 'note',
      endColumn: 'note',
      isBlock: true,
    };
    this.state = Object.freeze({
      ...this.state,
      selection: selectionState,
    });
    this.notifyStateChange();
  }
  
  /**
   * Clears selection.
   */
  clearSelection(): void {
    const selection = getSelectionStore();
    selection.setSelection(this.state.streamId, []);

    const { selection: _selection, ...rest } = this.state;
    this.state = Object.freeze(rest);
    this.notifyStateChange();
  }
  
  /**
   * Gets selected event IDs.
   */
  getSelectedEventIds(): readonly EventId[] {
    const selection = getSelectionStore();
    return selection.getSelection(this.state.streamId).eventIds as readonly EventId[];
  }
  
  /**
   * Updates local selection from SelectionStore.
   */
  private updateSelectionFromStore(selectedIds: readonly string[]): void {
    if (selectedIds.length === 0) {
      if (this.state.selection) {
        const { selection: _selection, ...rest } = this.state;
        this.state = Object.freeze(rest);
        this.notifyStateChange();
      }
      return;
    }
    
    // Calculate row range from selected events
    const events = this.getEvents();
    const selectedEvents = events.filter(e => selectedIds.includes(e.id as unknown as string));
    
    if (selectedEvents.length === 0) return;
    
    const rows = selectedEvents.map(e => e.start as number);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    
    const selectionState: TrackerSelection = {
      startRow: minRow,
      endRow: maxRow,
      startTrack: this.state.cursor.trackId,
      endTrack: this.state.cursor.trackId,
      startColumn: 'note',
      endColumn: 'note',
      isBlock: selectedEvents.length > 1,
    };

    this.state = Object.freeze({
      ...this.state,
      selection: selectionState,
    });
    this.notifyStateChange();
  }
  
  // ==========================================================================
  // CLIPBOARD OPERATIONS
  // ==========================================================================
  
  /**
   * Copies selected events to clipboard (returns events).
   */
  copySelection(): readonly Event<unknown>[] {
    const selectedIds = this.getSelectedEventIds();
    const events = this.getEvents();
    return events.filter(e => selectedIds.includes(e.id as EventId));
  }
  
  /**
   * Cuts selected events (copies and deletes).
   */
  cutSelection(): readonly Event<unknown>[] {
    const copied = this.copySelection();
    this.deleteSelection();
    return copied;
  }
  
  /**
   * Deletes selected events.
   */
  deleteSelection(): void {
    const store = getSharedEventStore();
    const streamId = this.state.streamId;
    const selectedIds = this.getSelectedEventIds();
    
    if (selectedIds.length === 0) return;
    
    const events = this.getEvents();
    const deletedEvents = events.filter(e => selectedIds.includes(e.id as EventId));
    
    executeWithUndo({
      type: 'event:delete',
      description: `Delete ${deletedEvents.length} notes`,
      execute: () => {
        store.removeEvents(streamId, selectedIds);
        this.clearSelection();
        return deletedEvents;
      },
      undo: (deleted) => {
        store.addEvents(streamId, deleted);
      },
      redo: () => {
        store.removeEvents(streamId, selectedIds);
      },
    });
  }
  
  /**
   * Pastes events at cursor position.
   */
  paste(events: readonly Event<unknown>[]): void {
    if (events.length === 0) return;
    
    const store = getSharedEventStore();
    const streamId = this.state.streamId;
    const { cursor } = this.state;
    const cursorTick = asTick(cursor.row);
    
    // Calculate offset from first event
    const minStart = Math.min(...events.map(e => e.start as number));
    const offset = (cursorTick as number) - minStart;
    
    // Create new events at offset positions with new IDs
    const pastedEvents = events.map(e => {
      const payload = e.payload as { pitch?: number; note?: number; velocity?: number };
      const pitch = payload.pitch ?? payload.note ?? 60;
      const velocity = payload.velocity ?? 100;

      return createEvent({
        kind: EventKinds.NOTE,
        start: asTick((e.start as number) + offset),
        duration: e.duration,
        payload: { pitch, note: pitch, velocity },
      });
    });
    
    executeWithUndo({
      type: 'event:add',
      description: `Paste ${pastedEvents.length} notes`,
      execute: () => {
        store.addEvents(streamId, pastedEvents);
        return pastedEvents.map(e => e.id as EventId);
      },
      undo: (ids) => {
        store.removeEvents(streamId, ids);
      },
      redo: () => {
        store.addEvents(streamId, pastedEvents);
      },
    });
  }
  
  // ==========================================================================
  // SCROLL OPERATIONS
  // ==========================================================================
  
  /**
   * Scrolls to a specific row.
   */
  scrollToRow(row: number): void {
    this.state = Object.freeze({
      ...this.state,
      scrollRow: Math.max(0, row),
    });
    this.notifyStateChange();
  }
  
  /**
   * Scrolls horizontally.
   */
  scrollToX(x: number): void {
    this.state = Object.freeze({
      ...this.state,
      scrollX: Math.max(0, x),
    });
    this.notifyStateChange();
  }
  
  /**
   * Updates playhead position.
   */
  setPlayhead(row: number): void {
    this.state = Object.freeze({
      ...this.state,
      playheadRow: Math.max(0, row),
    });
    this.notifyStateChange();
  }
  
  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================
  
  /**
   * Disposes the adapter and cleans up subscriptions.
   */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    
    // Unsubscribe from stores
    if (this.storeSubscriptionId) {
      getSharedEventStore().unsubscribe(this.storeSubscriptionId);
    }
    if (this.selectionSubscriptionId) {
      getSelectionStore().unsubscribe(this.selectionSubscriptionId);
    }
    
    // Clear local subscriptions
    this.stateSubscriptions.clear();
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Converts MIDI pitch to note name.
 */
function pitchToName(pitch: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(pitch / 12) - 1;
  const note = noteNames[pitch % 12];
  return `${note}${octave}`;
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Creates a TrackerStoreAdapter.
 * 
 * @example
 * ```typescript
 * const adapter = createTrackerAdapter({
 *   streamId: 'track-1',
 *   config: { patternLength: 64 },
 * });
 * 
 * adapter.subscribe((state) => {
 *   renderTracker(state, adapter.getEvents());
 * });
 * ```
 */
export function createTrackerAdapter(options?: TrackerAdapterOptions): TrackerStoreAdapter {
  return new TrackerStoreAdapter(options);
}
