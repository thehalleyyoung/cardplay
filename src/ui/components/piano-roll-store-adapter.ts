/**
 * @fileoverview Piano Roll SharedEventStore Adapter - Connects PianoRollPanel to shared state.
 * 
 * This adapter bridges the existing PianoRollPanel to the SharedEventStore.
 * Similar to tracker-store-adapter.ts, it enables:
 * - Reading events from SharedEventStore
 * - Writing edits back with undo support
 * - Selection synchronization via SelectionStore
 * 
 * @module @cardplay/ui/components/piano-roll-store-adapter
 * @see INTEGRATION_FIXES_CHECKLIST.md Phase B.2
 */

import type { Event } from '../../types/event';
import type { Tick, TickDuration } from '../../types/primitives';
import { asTick } from '../../types/primitives';
import { createNoteEvent, updateEvent } from '../../types/event';
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
  PianoRollConfig,
  NoteRect,
  VelocityBar,
} from './piano-roll-panel';
import { createPianoRollConfig } from './piano-roll-panel';

/** @deprecated legacy alias */
export type NoteRectangle = NoteRect;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Piano roll state that uses SharedEventStore for event storage.
 */
export interface PianoRollSharedState {
  /** Configuration */
  readonly config: PianoRollConfig;
  /** Horizontal scroll position (ticks) */
  readonly scrollX: Tick;
  /** Vertical scroll position (pitch) */
  readonly scrollPitch: number;
  /** Playhead position (ticks) */
  readonly playhead: Tick;
  /** Visible tick range */
  readonly visibleRange: {
    readonly start: Tick;
    readonly end: Tick;
  };
  /** Current edit mode */
  readonly mode: 'select' | 'draw' | 'erase' | 'velocity';
  /** Stream ID in SharedEventStore */
  readonly streamId: EventStreamId;
  /** Ghost track IDs (other tracks shown faintly) */
  readonly ghostTracks: readonly EventStreamId[];
}

/**
 * Callback for piano roll state changes.
 */
export type PianoRollStateCallback = (state: PianoRollSharedState) => void;

/**
 * Options for creating a piano roll adapter.
 */
export interface PianoRollAdapterOptions {
  /** Stream ID to use */
  streamId?: EventStreamId;
  /** Initial events */
  initialEvents?: readonly Event<unknown>[];
  /** Configuration overrides */
  config?: Partial<PianoRollConfig>;
  /** Ghost track IDs */
  ghostTracks?: readonly EventStreamId[];
}

// ============================================================================
// PIANO ROLL STORE ADAPTER
// ============================================================================

/**
 * PianoRollStoreAdapter connects a PianoRollPanel to the SharedEventStore.
 * 
 * Usage:
 * ```typescript
 * const adapter = new PianoRollStoreAdapter({ streamId: 'track-1-events' });
 * 
 * // Subscribe to state changes
 * adapter.subscribe((state) => {
 *   renderPianoRoll(state, adapter.getNoteRects());
 * });
 * 
 * // Edit operations sync to store with undo
 * adapter.createNote(100, 60, 480); // Add C4 at tick 100
 * adapter.moveNote(noteId, 200, 62); // Move to tick 200, D4
 * 
 * // Selection syncs with other views
 * adapter.selectNote(noteId);
 * 
 * // Cleanup
 * adapter.dispose();
 * ```
 */
export class PianoRollStoreAdapter {
  private state: PianoRollSharedState;
  private stateSubscriptions = new Set<PianoRollStateCallback>();
  private storeSubscriptionId: SubscriptionId | null = null;
  private selectionSubscriptionId: SubscriptionId | null = null;
  private ghostSubscriptionIds: SubscriptionId[] = [];
  private disposed = false;

  constructor(optionsOrStreamId: PianoRollAdapterOptions | EventStreamId = {}) {
    const options: PianoRollAdapterOptions =
      typeof optionsOrStreamId === 'string' ? { streamId: optionsOrStreamId } : optionsOrStreamId;

    const store = getSharedEventStore();

    // Create or get stream
    let streamId: EventStreamId;
    if (options.streamId) {
      streamId = options.streamId;
      if (!store.getStream(streamId)) {
        store.createStream({
          id: streamId,
          name: `piano-roll-${Date.now()}`,
          events: options.initialEvents ?? [],
        });
      } else if (options.initialEvents) {
        store.setStream(streamId, [...options.initialEvents]);
      }
    } else {
      streamId = store.createStream({
        name: `piano-roll-${Date.now()}`,
        events: options.initialEvents ?? [],
      }).id;
    }

    // Create initial state
    this.state = Object.freeze({
      config: createPianoRollConfig(options.config),
      scrollX: asTick(0),
      scrollPitch: 60, // Middle C
      playhead: asTick(0),
      visibleRange: { start: asTick(0), end: asTick(1920) }, // 4 bars at 480 TPB
      mode: 'select',
      streamId,
      ghostTracks: options.ghostTracks ?? [],
    });

    // Subscribe to store changes
    this.storeSubscriptionId = store.subscribe(streamId, () => {
      this.notifyStateChange();
    });

    // Subscribe to selection changes
    const selection = getSelectionStore();
    this.selectionSubscriptionId = selection.subscribe(streamId, () => {
      this.notifyStateChange();
    });

    // Subscribe to ghost tracks
    this.subscribeToGhostTracks();
  }

  // ==========================================================================
  // STATE ACCESS
  // ==========================================================================

  /**
   * Gets current state.
   */
  getState(): PianoRollSharedState & { readonly notes: readonly (NoteRect & { readonly note: number })[] } {
    return Object.freeze({
      ...this.state,
      notes: this.getNoteRects().map(n => Object.freeze({ ...(n as NoteRect), note: n.pitch })),
    });
  }

  /**
   * Gets events from shared store.
   */
  getEvents(): readonly Event<unknown>[] {
    const store = getSharedEventStore();
    return store.getStream(this.state.streamId)?.events ?? [];
  }

  /**
   * Gets note rectangles for rendering.
   */
  getNoteRects(): readonly NoteRect[] {
    const events = this.getEvents();
    const selection = getSelectionStore();
    const selectedIds = selection.getSelection(this.state.streamId).eventIds;
    const { config } = this.state;

	    return events
	      .filter(e => isNoteEvent(e))
	      .map(e => {
	        const payload = e.payload as { pitch: number; velocity?: number };
	        const pitch = payload.pitch;
	        const velocity = payload.velocity ?? 100;

	        return Object.freeze({
	          eventId: e.id,
	          pitch,
	          start: e.start as Tick,
	          duration: e.duration,
	          x: tickToPixel(e.start as Tick, config),
	          y: pitchToPixel(pitch, config),
	          width: tickToPixel(asTick(e.duration as number), config),
	          height: config.keyboard.keyHeight,
	          velocity,
	          selected: selectedIds.includes(e.id as EventId),
	          editing: false,
	          muted: false,
	          color: velocityToColor(velocity),
	        });
	      });
	  }

  /**
   * Gets velocity bars for velocity lane.
   */
  getVelocityBars(): readonly VelocityBar[] {
    const events = this.getEvents();
    const selection = getSelectionStore();
    const selectedIds = selection.getSelection(this.state.streamId).eventIds;
    const { config } = this.state;

    return events
      .filter(e => isNoteEvent(e))
      .map(e => {
        const payload = e.payload as { velocity?: number };
        const velocity = payload.velocity ?? 100;

        return Object.freeze({
          noteId: e.id,
          x: tickToPixel(e.start as Tick, config),
          width: Math.max(4, tickToPixel(asTick(e.duration as number), config)),
          height: (velocity / 127) * (config.velocityLane?.height ?? 60),
          velocity,
          selected: selectedIds.includes(e.id as EventId),
          color: velocityToColor(velocity),
        });
      });
  }

  /**
   * Gets ghost notes from other tracks.
   */
  getGhostNotes(): readonly NoteRect[] {
    const store = getSharedEventStore();
    const { config, ghostTracks } = this.state;
	    const ghostNotes: NoteRect[] = [];

	    for (const ghostId of ghostTracks) {
	      const events = store.getStream(ghostId)?.events ?? [];

	      for (const e of events) {
	        if (!isNoteEvent(e)) continue;

        const payload = e.payload as { pitch: number; velocity?: number };
        const pitch = payload.pitch;

	        ghostNotes.push(Object.freeze({
	          eventId: e.id,
	          pitch,
	          start: e.start as Tick,
	          duration: e.duration,
	          x: tickToPixel(e.start as Tick, config),
	          y: pitchToPixel(pitch, config),
	          width: tickToPixel(asTick(e.duration as number), config),
	          height: config.keyboard.keyHeight,
	          velocity: payload.velocity ?? 100,
	          selected: false,
	          editing: false,
	          muted: false,
	          color: 'rgba(128, 128, 128, 0.3)',
	        }));
	      }
	    }

    return ghostNotes;
  }

  // ==========================================================================
  // SUBSCRIPTIONS
  // ==========================================================================

  /**
   * Subscribes to state changes.
   */
  subscribe(callback: PianoRollStateCallback): () => void {
    this.stateSubscriptions.add(callback);
    callback(this.state);

    return () => {
      this.stateSubscriptions.delete(callback);
    };
  }

  private notifyStateChange(): void {
    for (const callback of this.stateSubscriptions) {
      try {
        callback(this.state);
      } catch (e) {
        console.error('Piano roll state callback error:', e);
      }
    }
  }

  private subscribeToGhostTracks(): void {
    const store = getSharedEventStore();

    for (const ghostId of this.state.ghostTracks) {
      const subId = store.subscribe(ghostId, () => {
        this.notifyStateChange();
      });
      this.ghostSubscriptionIds.push(subId);
    }
  }

  // ==========================================================================
  // COORDINATE CONVERSION
  // ==========================================================================

  /**
   * Converts pixel X to tick.
   */
  pixelToTick(x: number): Tick {
    const { config, scrollX } = this.state;
    const ticks = (scrollX as number) + Math.round(x / config.timeGrid.pixelsPerTick);
    return snapToGrid(asTick(Math.max(0, ticks)), this.state);
  }

  /**
   * Converts pixel Y to pitch.
   */
  pixelToPitch(y: number): number {
    const { config } = this.state;
    const keyboard = config.keyboard;
    const pitchFromTop = keyboard.maxPitch - Math.floor(y / keyboard.keyHeight);
    return Math.max(0, Math.min(127, pitchFromTop));
  }

  /**
   * Finds note at pixel position.
   */
  getNoteAtPosition(x: number, y: number): NoteRect | undefined {
    const rects = this.getNoteRects();
    return rects.find(r =>
      x >= r.x && x < r.x + r.width &&
      y >= r.y && y < r.y + r.height
    );
  }

  // ==========================================================================
  // EDIT OPERATIONS WITH UNDO
  // ==========================================================================

  /**
   * Creates a note at position.
   */
  createNote(tick: Tick, pitch: number, duration?: TickDuration, velocity?: number): void {
    const store = getSharedEventStore();
    const streamId = this.state.streamId;
    const { config } = this.state;

    const noteDuration = duration ?? config.timeGrid.snapTo;
    const noteVelocity = velocity ?? 100;

    const note = createNoteEvent(tick, noteDuration, pitch, noteVelocity);

    executeWithUndo({
      type: 'event:add',
      description: `Add note ${pitchToName(pitch)}`,
      execute: () => {
        store.addEvents(streamId, [note]);
        return note.id as EventId;
      },
      undo: (id) => {
        store.removeEvents(streamId, [id]);
      },
      redo: () => {
        store.addEvents(streamId, [note]);
      },
    });
  }

  /**
   * Creates note at pixel position.
   */
  createNoteAtPixel(x: number, y: number): void {
    const tick = this.pixelToTick(x);
    const pitch = this.pixelToPitch(y);
    this.createNote(tick, pitch);
  }

  /**
   * Deletes a note by event ID.
   */
  deleteNote(eventId: string): void {
    const store = getSharedEventStore();
    const streamId = this.state.streamId;
    const events = this.getEvents();
    const note = events.find(e => e.id === eventId);

    if (!note) return;

    executeWithUndo({
      type: 'events-remove',
      description: 'Delete note',
      execute: () => {
        store.removeEvents(streamId, [eventId as EventId]);
        return note;
      },
      undo: (deleted) => {
        store.addEvents(streamId, [deleted]);
      },
      redo: () => {
        store.removeEvents(streamId, [eventId as EventId]);
      },
    });
  }

  /**
   * Moves a note to new position.
   */
  moveNote(eventId: string, newTick: Tick, newPitch: number): void {
    const store = getSharedEventStore();
    const streamId = this.state.streamId;
    const events = this.getEvents();
    const note = events.find(e => e.id === eventId);

    if (!note) return;

    const payload = note.payload as { pitch: number };
    const oldTick = note.start;
    const oldPitch = payload.pitch;

    executeWithUndo({
      type: 'events-modify',
      description: 'Move note',
      execute: () => {
        store.updateEvent(streamId, eventId as EventId, {
          start: newTick,
          payload: { ...(note.payload as object), pitch: newPitch, note: newPitch },
        } as any);
        return { oldTick, oldPitch, oldPayload: note.payload };
      },
      undo: ({ oldTick: ot, oldPitch: op, oldPayload }) => {
        store.updateEvent(streamId, eventId as EventId, {
          start: ot,
          payload: { ...(oldPayload as object), pitch: op, note: op },
        } as any);
      },
      redo: () => {
        store.updateEvent(streamId, eventId as EventId, {
          start: newTick,
          payload: { ...(note.payload as object), pitch: newPitch, note: newPitch },
        } as any);
      },
    });
  }

  /**
   * Resizes a note (changes duration).
   */
  resizeNote(eventId: string, newDuration: TickDuration): void {
    const store = getSharedEventStore();
    const streamId = this.state.streamId;
    const events = this.getEvents();
    const note = events.find(e => e.id === eventId);

    if (!note) return;

    const oldDuration = note.duration;
    const targetId = eventId as EventId;

    executeWithUndo({
      type: 'event:update',
      description: 'Resize note',
      execute: () => {
        const updated = updateEvent(note, { duration: newDuration });
        store.updateStream(streamId, (stream) => ({
          events: stream.events.map(e => (e.id === targetId ? updated : e)),
        }));
        return oldDuration;
      },
      undo: (oldDur) => {
        const restored = updateEvent(note, { duration: oldDur });
        store.updateStream(streamId, (stream) => ({
          events: stream.events.map(e => (e.id === targetId ? restored : e)),
        }));
      },
      redo: () => {
        const updated = updateEvent(note, { duration: newDuration });
        store.updateStream(streamId, (stream) => ({
          events: stream.events.map(e => (e.id === targetId ? updated : e)),
        }));
      },
    });
  }

  /**
   * Sets velocity for a note.
   */
  setNoteVelocity(eventId: string, velocity: number): void {
    const store = getSharedEventStore();
    const streamId = this.state.streamId;
    const events = this.getEvents();
    const note = events.find(e => e.id === eventId);

    if (!note) return;

    const payload = note.payload as { velocity?: number };
    const oldVelocity = payload.velocity ?? 100;
    const newVelocity = Math.max(0, Math.min(127, velocity));
    const targetId = eventId as EventId;

    executeWithUndo({
      type: 'event:update',
      description: `Set velocity to ${newVelocity}`,
      execute: () => {
        const updated = updateEvent(note, {
          payload: { ...note.payload as object, velocity: newVelocity },
        });
        store.updateStream(streamId, (stream) => ({
          events: stream.events.map(e => (e.id === targetId ? updated : e)),
        }));
        return oldVelocity;
      },
      undo: (oldVel) => {
        const restored = updateEvent(note, {
          payload: { ...note.payload as object, velocity: oldVel },
        });
        store.updateStream(streamId, (stream) => ({
          events: stream.events.map(e => (e.id === targetId ? restored : e)),
        }));
      },
      redo: () => {
        const updated = updateEvent(note, {
          payload: { ...note.payload as object, velocity: newVelocity },
        });
        store.updateStream(streamId, (stream) => ({
          events: stream.events.map(e => (e.id === targetId ? updated : e)),
        }));
      },
    });
  }

  /**
   * Transposes selected notes.
   */
  transposeSelection(semitones: number): void {
    const store = getSharedEventStore();
    const streamId = this.state.streamId;
    const selectedIds = this.getSelectedNoteIds();

    if (selectedIds.length === 0) return;

    const events = this.getEvents();
    const notesToTranspose = events.filter(e => selectedIds.includes(e.id as EventId));

    // Store original pitches for undo
    const originalPitches = new Map(
      notesToTranspose.map(e => [e.id, (e.payload as { pitch: number }).pitch])
    );

    executeWithUndo({
      type: 'event:update',
      description: `Transpose ${semitones > 0 ? '+' : ''}${semitones} semitones`,
      execute: () => {
        store.updateStream(streamId, (stream) => ({
          events: stream.events.map(e => {
            if (!selectedIds.includes(e.id as EventId)) return e;
            const payload = e.payload as { pitch: number };
            const newPitch = Math.max(0, Math.min(127, payload.pitch + semitones));
            return updateEvent(e, { payload: { ...payload, pitch: newPitch } });
          }),
        }));
        return originalPitches;
      },
      undo: (originals) => {
        store.updateStream(streamId, (stream) => ({
          events: stream.events.map(e => {
            const origPitch = originals.get(e.id);
            if (origPitch === undefined) return e;
            const payload = e.payload as { pitch: number };
            return updateEvent(e, { payload: { ...payload, pitch: origPitch } });
          }),
        }));
      },
      redo: () => {
        store.updateStream(streamId, (stream) => ({
          events: stream.events.map(e => {
            if (!selectedIds.includes(e.id as EventId)) return e;
            const payload = e.payload as { pitch: number };
            const newPitch = Math.max(0, Math.min(127, payload.pitch + semitones));
            return updateEvent(e, { payload: { ...payload, pitch: newPitch } });
          }),
        }));
      },
    });
  }

  // ==========================================================================
  // SELECTION OPERATIONS
  // ==========================================================================

  /**
   * Selects a note.
   */
  selectNote(eventId: string, addToSelection: boolean = false): void {
    const selection = getSelectionStore();
    const streamId = this.state.streamId;

    if (addToSelection) {
      selection.select(streamId, [eventId as EventId]);
    } else {
      selection.setSelection(streamId, [eventId as EventId]);
    }
  }

  /**
   * Selects notes in rectangle (pixels).
   */
  selectInRect(x1: number, y1: number, x2: number, y2: number): void {
    const selection = getSelectionStore();
    const streamId = this.state.streamId;
    const rects = this.getNoteRects();

    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    const selectedIds = rects
      .filter(r =>
        r.x < maxX && r.x + r.width > minX &&
        r.y < maxY && r.y + r.height > minY
      )
      .map(r => r.eventId as EventId);

    selection.setSelection(streamId, selectedIds);
  }

  /**
   * Clears selection.
   */
  clearSelection(): void {
    const selection = getSelectionStore();
    selection.setSelection(this.state.streamId, []);
  }

  /**
   * Gets selected note IDs.
   */
  getSelectedNoteIds(): readonly EventId[] {
    const selection = getSelectionStore();
    return selection.getSelection(this.state.streamId).eventIds as readonly EventId[];
  }

  /**
   * Deletes selected notes.
   */
  deleteSelection(): void {
    const store = getSharedEventStore();
    const streamId = this.state.streamId;
    const selectedIds = this.getSelectedNoteIds();

    if (selectedIds.length === 0) return;

    const events = this.getEvents();
    const deletedNotes = events.filter(e => selectedIds.includes(e.id as EventId));

    executeWithUndo({
      type: 'event:delete',
      description: `Delete ${deletedNotes.length} notes`,
      execute: () => {
        store.removeEvents(streamId, selectedIds);
        this.clearSelection();
        return deletedNotes;
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
   * Duplicates selected notes.
   */
  duplicateSelection(offsetTicks: number = 480): void {
    const store = getSharedEventStore();
    const streamId = this.state.streamId;
    const selectedIds = this.getSelectedNoteIds();

    if (selectedIds.length === 0) return;

    const events = this.getEvents();
    const notesToDuplicate = events.filter(e => selectedIds.includes(e.id as EventId));

    // Create duplicates with offset
    const duplicates = notesToDuplicate.map(e => {
      const payload = e.payload as { pitch: number; velocity?: number };
      return createNoteEvent(
        asTick(e.start + offsetTicks),
        e.duration,
        payload.pitch,
        payload.velocity ?? 100
      );
    });

    const duplicateIds = duplicates.map(e => e.id as EventId);

    executeWithUndo({
      type: 'event:add',
      description: `Duplicate ${duplicates.length} notes`,
      execute: () => {
        store.addEvents(streamId, duplicates);
        // Select the new duplicates
        const selection = getSelectionStore();
        selection.setSelection(streamId, duplicateIds);
        return duplicateIds;
      },
      undo: (ids) => {
        store.removeEvents(streamId, ids);
        // Restore original selection
        const selection = getSelectionStore();
        selection.setSelection(streamId, selectedIds);
      },
      redo: () => {
        store.addEvents(streamId, duplicates);
        const selection = getSelectionStore();
        selection.setSelection(streamId, duplicateIds);
      },
    });
  }

  // ==========================================================================
  // VIEW OPERATIONS
  // ==========================================================================

  /**
   * Sets edit mode.
   */
  setMode(mode: 'select' | 'draw' | 'erase' | 'velocity'): void {
    this.state = Object.freeze({
      ...this.state,
      mode,
    });
    this.notifyStateChange();
  }

  /**
   * Sets horizontal zoom.
   */
  setZoomX(pixelsPerTick: number): void {
    this.state = Object.freeze({
      ...this.state,
      config: {
        ...this.state.config,
        timeGrid: {
          ...this.state.config.timeGrid,
          pixelsPerTick: Math.max(0.5, Math.min(20, pixelsPerTick)),
        },
      },
    });
    this.notifyStateChange();
  }

  /**
   * Sets vertical zoom.
   */
  setZoomY(keyHeight: number): void {
    this.state = Object.freeze({
      ...this.state,
      config: {
        ...this.state.config,
        keyboard: {
          ...this.state.config.keyboard,
          keyHeight: Math.max(4, Math.min(32, keyHeight)),
        },
      },
    });
    this.notifyStateChange();
  }

  /**
   * Scrolls horizontally.
   */
  scrollHorizontal(deltaTicks: number): void {
    const newX = Math.max(0, (this.state.scrollX as number) + deltaTicks);
    this.state = Object.freeze({
      ...this.state,
      scrollX: asTick(newX),
    });
    this.notifyStateChange();
  }

  /**
   * Scrolls vertically.
   */
  scrollVertical(deltaPitch: number): void {
    const { config } = this.state;
    const newPitch = Math.max(
      config.keyboard.minPitch,
      Math.min(config.keyboard.maxPitch, this.state.scrollPitch + deltaPitch)
    );
    this.state = Object.freeze({
      ...this.state,
      scrollPitch: newPitch,
    });
    this.notifyStateChange();
  }

  /**
   * Sets playhead position.
   */
  setPlayhead(tick: Tick): void {
    this.state = Object.freeze({
      ...this.state,
      playhead: tick,
    });
    this.notifyStateChange();
  }

  /**
   * Sets snap grid.
   */
  setSnapTo(snapTo: TickDuration): void {
    this.state = Object.freeze({
      ...this.state,
      config: {
        ...this.state.config,
        timeGrid: {
          ...this.state.config.timeGrid,
          snapTo,
        },
      },
    });
    this.notifyStateChange();
  }

  /**
   * Adds a ghost track.
   */
  addGhostTrack(streamId: EventStreamId): void {
    if (this.state.ghostTracks.includes(streamId)) return;

    const store = getSharedEventStore();
    const subId = store.subscribe(streamId, () => this.notifyStateChange());
    this.ghostSubscriptionIds.push(subId);

    this.state = Object.freeze({
      ...this.state,
      ghostTracks: [...this.state.ghostTracks, streamId],
    });
    this.notifyStateChange();
  }

  /**
   * Removes a ghost track.
   */
  removeGhostTrack(streamId: EventStreamId): void {
    const index = this.state.ghostTracks.indexOf(streamId);
    if (index === -1) return;

    // Unsubscribe
    if (this.ghostSubscriptionIds[index]) {
      getSharedEventStore().unsubscribe(this.ghostSubscriptionIds[index]);
      this.ghostSubscriptionIds.splice(index, 1);
    }

    this.state = Object.freeze({
      ...this.state,
      ghostTracks: this.state.ghostTracks.filter(id => id !== streamId),
    });
    this.notifyStateChange();
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  /**
   * Disposes adapter.
   */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    const store = getSharedEventStore();
    const selection = getSelectionStore();

    if (this.storeSubscriptionId) {
      store.unsubscribe(this.storeSubscriptionId);
    }
    if (this.selectionSubscriptionId) {
      selection.unsubscribe(this.selectionSubscriptionId);
    }
    for (const id of this.ghostSubscriptionIds) {
      store.unsubscribe(id);
    }

    this.stateSubscriptions.clear();
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Checks if event is a note event.
 */
function isNoteEvent(event: Event<unknown>): boolean {
  return 'pitch' in (event.payload as object);
}

/**
 * Converts tick to pixel X.
 */
function tickToPixel(tick: Tick, config: PianoRollConfig): number {
  return (tick as number) * config.timeGrid.pixelsPerTick;
}

/**
 * Converts pitch to pixel Y.
 */
function pitchToPixel(pitch: number, config: PianoRollConfig): number {
  const keyboard = config.keyboard;
  return (keyboard.maxPitch - pitch) * keyboard.keyHeight;
}

/**
 * Converts velocity to color.
 */
function velocityToColor(velocity: number): string {
  const ratio = velocity / 127;
  const r = Math.round(ratio * 255);
  const b = Math.round((1 - ratio) * 255);
  return `rgb(${r}, 80, ${b})`;
}

/**
 * Converts MIDI pitch to note name.
 */
function pitchToName(pitch: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(pitch / 12) - 1;
  const note = noteNames[pitch % 12];
  return `${note}${octave}`;
}

/**
 * Snaps tick to grid.
 */
function snapToGrid(tick: Tick, state: PianoRollSharedState): Tick {
  const snapTo = state.config.timeGrid.snapTo as number;
  if (snapTo <= 0) return tick;

  const snapped = Math.round((tick as number) / snapTo) * snapTo;
  return asTick(snapped);
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Creates a PianoRollStoreAdapter.
 */
export function createPianoRollAdapter(options?: PianoRollAdapterOptions): PianoRollStoreAdapter {
  return new PianoRollStoreAdapter(options);
}
