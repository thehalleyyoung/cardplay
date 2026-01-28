/**
 * @fileoverview Notation SharedEventStore Adapter - Connects notation renderer to shared state.
 * 
 * Provides bidirectional conversion between Event<Voice<P>> and NotationEvent,
 * with write-back support when notation is edited.
 * 
 * @module @cardplay/notation/notation-store-adapter
 * @see INTEGRATION_FIXES_CHECKLIST.md Phase B.3, B.4
 */

import type { Event } from '../types/event';
import type { Voice, Pitch, Articulation } from '../voices/voice';
import { Articulation as Art } from '../voices/voice';
import type { Tick } from '../types/primitives';
import { asTick, asTickDuration } from '../types/primitives';
import { createEvent, updateEvent } from '../types/event';
import { EventKinds } from '../types/event-kind';
import type {
  EventStreamId,
  EventId,
  SubscriptionId,
} from '../state/types';
import {
  getSharedEventStore,
  getSelectionStore,
  executeWithUndo,
} from '../state';
import type {
  NotationEvent,
  NotationMeasure,
  NoteDuration,
  KeySignature,
  TimeSignature,
  ArticulationType,
} from './types';
import {
  eventsToNotation,
} from './event-bridge';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Notation adapter state.
 */
export interface NotationAdapterState {
  /** Stream ID being rendered */
  readonly streamId: EventStreamId;
  /** Time signature */
  readonly timeSignature: TimeSignature;
  /** Key signature */
  readonly keySignature: KeySignature;
  /** Ticks per quarter note */
  readonly ticksPerQuarter: number;
  /** Visible measure range */
  readonly visibleMeasures: {
    readonly start: number;
    readonly end: number;
  };
  /** Playhead position (ticks) */
  readonly playhead: Tick;
  /** Current voice filter (0 = all voices) */
  readonly voiceFilter: number;
}

/**
 * Callback for notation state changes.
 */
export type NotationStateCallback = (state: NotationAdapterState) => void;

/**
 * Options for creating notation adapter.
 */
export interface NotationAdapterOptions {
  /** Stream ID to use */
  streamId?: EventStreamId;
  /** Initial events */
  initialEvents?: readonly Event<unknown>[];
  /** Time signature */
  timeSignature?: TimeSignature;
  /** Key signature */
  keySignature?: KeySignature;
  /** Ticks per quarter note */
  ticksPerQuarter?: number;
}

// ============================================================================
// NOTATION TO EVENT CONVERSION (WRITE-BACK)
// ============================================================================

/**
 * Converts NotationNote to Event payload.
 * This enables writing notation edits back to the SharedEventStore.
 */
export interface NotePayload {
  readonly pitch: number;
  readonly velocity: number;
  readonly articulation?: Articulation;
}

/**
 * Converts a NotationEvent back to Event<Voice<P>> format.
 * Used when notation is edited and needs to write back to store.
 */
export function notationToEvent(
  notationEvent: NotationEvent,
  ticksPerQuarter: number = 480
): Event<NotePayload>[] {
  const events: Event<NotePayload>[] = [];
  
  // Convert duration to ticks
  const durationTicks = noteDurationToTicks(notationEvent.duration, ticksPerQuarter);
  
  // Each note in the chord becomes a separate event
  for (const note of notationEvent.notes) {
    const articulation = mapNotationArticulation(notationEvent.articulations?.[0]);
    const event = createEvent<NotePayload>({
      kind: EventKinds.NOTE,
      start: asTick(notationEvent.tick),
      duration: asTickDuration(durationTicks),
      payload: {
        pitch: note.pitch,
        velocity: 100, // Default velocity
        ...(articulation === undefined ? {} : { articulation }),
      },
    });
    
    // Preserve original ID if it exists
    if (note.id) {
      (event as any).id = note.id;
    }
    
    events.push(event);
  }
  
  return events;
}

/**
 * Converts NoteDuration to ticks.
 */
function noteDurationToTicks(duration: NoteDuration, ticksPerQuarter: number): number {
  const baseValue = getDurationBaseValue(duration.base);
  let ticks = baseValue * ticksPerQuarter;
  
  if (duration.dots) {
    // Each dot adds half of the previous value
    let dotValue = ticks / 2;
    for (let i = 0; i < duration.dots; i++) {
      ticks += dotValue;
      dotValue /= 2;
    }
  }
  
  return Math.round(ticks);
}

/**
 * Gets base duration value in quarter notes.
 */
function getDurationBaseValue(type: NoteDuration['base']): number {
  switch (type) {
    case 'whole': return 4;
    case 'half': return 2;
    case 'quarter': return 1;
    case 'eighth': return 0.5;
    case '16th': return 0.25;
    case '32nd': return 0.125;
    case '64th': return 0.0625;
    default: return 1;
  }
}

/**
 * Maps notation articulation to Voice articulation.
 */
function mapNotationArticulation(articulation?: ArticulationType): Articulation | undefined {
  if (!articulation) return undefined;
  
  switch (articulation) {
    case 'staccato': return Art.Staccato;
    case 'accent': return Art.Accent;
    case 'tenuto': return Art.Tenuto;
    case 'marcato': return Art.Marcato;
    default: return undefined;
  }
}

// ============================================================================
// NOTATION STORE ADAPTER
// ============================================================================

/**
 * NotationStoreAdapter connects notation rendering to SharedEventStore.
 * 
 * Usage:
 * ```typescript
 * const adapter = new NotationStoreAdapter({ streamId: 'track-1' });
 * 
 * // Get notation events for rendering
 * const notationEvents = adapter.getNotationEvents();
 * 
 * // Subscribe to changes
 * adapter.subscribe((state) => {
 *   renderNotation(adapter.getNotationEvents());
 * });
 * 
 * // Write back edits from notation
 * adapter.updateNoteFromNotation(eventId, { pitch: 64, duration: ... });
 * 
 * adapter.dispose();
 * ```
 */
export class NotationStoreAdapter {
  private state: NotationAdapterState;
  private stateSubscriptions = new Set<NotationStateCallback>();
  private storeSubscriptionId: SubscriptionId | null = null;
  private selectionSubscriptionId: SubscriptionId | null = null;
  private disposed = false;

  constructor(options: NotationAdapterOptions = {}) {
    const store = getSharedEventStore();

    // Create or get stream
    const streamId = options.streamId ?? store.createStream(`notation-${Date.now()}`);

    // Initialize stream if needed
    if (!store.getStream(streamId) && options.initialEvents) {
      store.setStream(streamId, [...options.initialEvents]);
    }

    const defaultKeySignature: KeySignature = { root: 'C', mode: 'major', accidentals: 0 };

    // Create initial state
    this.state = Object.freeze({
      streamId,
      timeSignature: options.timeSignature ?? { numerator: 4, denominator: 4 },
      keySignature: options.keySignature ?? defaultKeySignature,
      ticksPerQuarter: options.ticksPerQuarter ?? 480,
      visibleMeasures: { start: 0, end: 8 },
      playhead: asTick(0),
      voiceFilter: 0,
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
  }

  // ==========================================================================
  // STATE ACCESS
  // ==========================================================================

  /**
   * Gets current state.
   */
  getState(): NotationAdapterState {
    return this.state;
  }

  /**
   * Gets raw events from store.
   */
  getEvents(): readonly Event<unknown>[] {
    const store = getSharedEventStore();
    return store.getStream(this.state.streamId)?.events ?? [];
  }

  /**
   * Gets events converted to NotationEvent format for rendering.
   */
  getNotationEvents(): readonly NotationEvent[] {
    const events = this.getEvents() as readonly Event<Voice<Pitch>>[];
    return eventsToNotation(events, {
      ticksPerQuarter: this.state.ticksPerQuarter,
      keySignature: this.state.keySignature,
    });
  }

  /**
   * Gets measures with events organized by measure.
   */
  getMeasures(): readonly NotationMeasure[] {
    const { timeSignature, ticksPerQuarter, visibleMeasures } = this.state;
    const ticksPerMeasure = ticksPerQuarter * 4 * (timeSignature.numerator / timeSignature.denominator);
    
    const notationEvents = this.getNotationEvents();
    const measures: NotationMeasure[] = [];

    for (let i = visibleMeasures.start; i < visibleMeasures.end; i++) {
      const measureStart = i * ticksPerMeasure;
      const measureEnd = (i + 1) * ticksPerMeasure;

      const eventsInMeasure = notationEvents.filter(
        e => e.tick >= measureStart && e.tick < measureEnd
      );

      const eventsByVoice = new Map<number, NotationEvent[]>();
      for (const evt of eventsInMeasure) {
        const existing = eventsByVoice.get(evt.voice) ?? [];
        eventsByVoice.set(evt.voice, [...existing, evt]);
      }

      measures.push({
        number: i + 1,
        events: eventsByVoice,
        timeSignature,
        keySignature: this.state.keySignature,
      });
    }

    return measures;
  }

  /**
   * Gets selected event IDs.
   */
  getSelectedEventIds(): readonly EventId[] {
    const selection = getSelectionStore();
    return selection.getSelection(this.state.streamId).eventIds.map(id => id as EventId);
  }

  // ==========================================================================
  // SUBSCRIPTIONS
  // ==========================================================================

  /**
   * Subscribes to state changes.
   */
  subscribe(callback: NotationStateCallback): () => void {
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
        console.error('Notation state callback error:', e);
      }
    }
  }

  // ==========================================================================
  // WRITE-BACK OPERATIONS (Notation → Store)
  // ==========================================================================

  /**
   * Adds a note from notation input.
   */
  addNoteFromNotation(
    tick: Tick,
    pitch: number,
    duration: NoteDuration
  ): void {
    const store = getSharedEventStore();
    const streamId = this.state.streamId;
    const { ticksPerQuarter } = this.state;

    const durationTicks = noteDurationToTicks(duration, ticksPerQuarter);
    const note = createEvent<NotePayload>({
      kind: EventKinds.NOTE,
      start: tick,
      duration: asTickDuration(durationTicks),
      payload: { pitch, velocity: 100 },
    });

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
   * Updates a note from notation edit.
   */
  updateNoteFromNotation(
    eventId: string,
    updates: {
      pitch?: number;
      tick?: Tick;
      duration?: NoteDuration;
    }
  ): void {
    const store = getSharedEventStore();
    const streamId = this.state.streamId;
    const { ticksPerQuarter } = this.state;
    const events = this.getEvents();
    const event = events.find(e => e.id === eventId);

    if (!event) return;

    const oldPitch = (event.payload as any).pitch;
    const oldTick = event.start;
    const oldDuration = event.duration;

    const newPitch = updates.pitch ?? oldPitch;
    const newTick = updates.tick ?? oldTick;
    const newDuration = updates.duration 
      ? asTickDuration(noteDurationToTicks(updates.duration, ticksPerQuarter))
      : oldDuration;

    executeWithUndo({
      type: 'event:update',
      description: 'Edit note',
      execute: () => {
        const updated = updateEvent(event, {
          start: newTick,
          duration: newDuration,
          payload: { ...(event.payload as object), pitch: newPitch },
        });
        store.updateStream(streamId, (stream) => ({
          events: stream.events.map(e => e.id === eventId ? updated : e)
        }));
        return { oldPitch, oldTick, oldDuration };
      },
      undo: ({ oldPitch: op, oldTick: ot, oldDuration: od }) => {
        const restored = updateEvent(event, {
          start: ot,
          duration: od,
          payload: { ...(event.payload as object), pitch: op },
        });
        store.updateStream(streamId, (stream) => ({
          events: stream.events.map(e => e.id === eventId ? restored : e)
        }));
      },
      redo: () => {
        const updated = updateEvent(event, {
          start: newTick,
          duration: newDuration,
          payload: { ...(event.payload as object), pitch: newPitch },
        });
        store.updateStream(streamId, (stream) => ({
          events: stream.events.map(e => e.id === eventId ? updated : e)
        }));
      },
    });
  }

  /**
   * Deletes a note from notation.
   */
  deleteNoteFromNotation(eventId: string): void {
    const store = getSharedEventStore();
    const streamId = this.state.streamId;
    const events = this.getEvents();
    const event = events.find(e => e.id === eventId);

    if (!event) return;

    executeWithUndo({
      type: 'event:delete',
      description: 'Delete note',
      execute: () => {
        store.removeEvents(streamId, [eventId as EventId]);
        return event;
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
   * Transposes selected notes.
   */
  transposeSelectedNotes(semitones: number): void {
    const store = getSharedEventStore();
    const streamId = this.state.streamId;
    const selectedIds = this.getSelectedEventIds();

    if (selectedIds.length === 0) return;

    const events = this.getEvents();
    const selectedEvents = events.filter(e => selectedIds.includes(e.id as EventId));

    const originalPitches = new Map(
      selectedEvents.map(e => [e.id, (e.payload as any).pitch])
    );

    executeWithUndo({
      type: 'event:update',
      description: `Transpose ${semitones > 0 ? '+' : ''}${semitones}`,
      execute: () => {
        store.updateStream(streamId, (stream) => ({
          events: stream.events.map(e => {
            if (!selectedIds.includes(e.id as EventId)) return e;
            const payload = e.payload as { pitch: number };
            const newPitch = Math.max(0, Math.min(127, payload.pitch + semitones));
            return updateEvent(e, { payload: { ...payload, pitch: newPitch } });
          })
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
          })
        }));
      },
      redo: () => {
        store.updateStream(streamId, (stream) => ({
          events: stream.events.map(e => {
            if (!selectedIds.includes(e.id as EventId)) return e;
            const payload = e.payload as { pitch: number };
            const newPitch = Math.max(0, Math.min(127, payload.pitch + semitones));
            return updateEvent(e, { payload: { ...payload, pitch: newPitch } });
          })
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
   * Clears selection.
   */
  clearSelection(): void {
    const selection = getSelectionStore();
    selection.setSelection(this.state.streamId, []);
  }

  /**
   * Deletes selected notes.
   */
  deleteSelection(): void {
    const store = getSharedEventStore();
    const streamId = this.state.streamId;
    const selectedIds = this.getSelectedEventIds();

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

  // ==========================================================================
  // VIEW OPERATIONS
  // ==========================================================================

  /**
   * Sets time signature.
   */
  setTimeSignature(timeSignature: TimeSignature): void {
    this.state = Object.freeze({
      ...this.state,
      timeSignature,
    });
    this.notifyStateChange();
  }

  /**
   * Sets key signature.
   */
  setKeySignature(keySignature: KeySignature): void {
    this.state = Object.freeze({
      ...this.state,
      keySignature,
    });
    this.notifyStateChange();
  }

  /**
   * Sets visible measure range.
   */
  setVisibleMeasures(start: number, end: number): void {
    this.state = Object.freeze({
      ...this.state,
      visibleMeasures: { start, end },
    });
    this.notifyStateChange();
  }

  /**
   * Scrolls measures.
   */
  scrollMeasures(delta: number): void {
    const { visibleMeasures } = this.state;
    const newStart = Math.max(0, visibleMeasures.start + delta);
    const newEnd = newStart + (visibleMeasures.end - visibleMeasures.start);
    this.setVisibleMeasures(newStart, newEnd);
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
   * Sets voice filter.
   */
  setVoiceFilter(voice: number): void {
    this.state = Object.freeze({
      ...this.state,
      voiceFilter: voice,
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
// FACTORY
// ============================================================================

/**
 * Creates a NotationStoreAdapter.
 */
export function createNotationAdapter(options?: NotationAdapterOptions): NotationStoreAdapter {
  return new NotationStoreAdapter(options);
}
