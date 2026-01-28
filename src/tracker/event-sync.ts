/**
 * @fileoverview Tracker ↔ Event Store Bidirectional Sync
 * 
 * Ensures that any edits made outside the tracker (piano roll, notation,
 * generators, MIDI input, etc.) are reflected in the tracker view, and
 * vice versa. Uses SharedEventStore as the single source of truth.
 * 
 * Design Principles:
 * 1. SharedEventStore is THE canonical data - tracker is a VIEW
 * 2. Tracker rows are computed from events, not stored separately
 * 3. Effect commands that don't map to events are stored as event metadata
 * 4. Sub-row timing preserved via delay column
 * 5. Changes propagate automatically via subscriptions
 * 
 * @module @cardplay/tracker/event-sync
 */

import { type Event, createEvent } from '../types/event';
import { EventKinds } from '../types/event-kind';
import { asMidiNote, asVelocity } from '../types/primitives';
import { asEventId } from '../types/event-id';
import type { EventStreamId, SubscriptionId, EventId } from '../state/types';
import { getSharedEventStore, executeWithUndo } from '../state';
import type {
  TrackerRow,
  NoteCell,
  EffectCell,
  EffectCommand,
} from './types';
import {
  asEffectCode,
  asEffectParam,
  emptyNoteCell,
  emptyEffectCell,
  SpecialNote,
} from './types';
import { FX } from './effects';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Extended event payload that includes tracker-specific data.
 */
export interface TrackerEventPayload {
  // Standard note data
  type: 'note' | 'automation' | 'trigger' | 'control';
  pitch?: number;
  velocity?: number;
  pan?: number;
  instrument?: number;
  
  // Tracker-specific metadata (preserved through round-trip)
  trackerEffects?: EffectCommand[];  // Effects that don't map to event properties
  trackerDelay?: number;             // Sub-row delay (0-255)
  trackerColumn?: number;            // Original column for polyphonic tracks
  
  // Source tracking
  sourceEditor?: 'tracker' | 'pianoroll' | 'notation' | 'generator' | 'midi' | 'automation';
  originalEventId?: string;          // For tracking edits
}

/**
 * Configuration for the sync adapter.
 */
export interface TrackerSyncConfig {
  /** Pulses per quarter note */
  ppq: number;
  /** Rows per beat (determines quantization) */
  rowsPerBeat: number;
  /** Preserve sub-row timing in delay column */
  preserveSubRowTiming: boolean;
  /** Auto-insert note-offs */
  autoNoteOff: boolean;
  /** Maximum effect columns to use */
  maxEffectColumns: number;
}

/**
 * Computed tracker view from events.
 */
export interface ComputedTrackerView {
  /** Rows computed from events */
  rows: TrackerRow[];
  /** Event ID to row mapping */
  eventToRow: Map<EventId, number>;
  /** Row to event IDs mapping (multiple events can be on same row) */
  rowToEvents: Map<number, EventId[]>;
  /** Dirty flag (needs re-render) */
  dirty: boolean;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: TrackerSyncConfig = {
  ppq: 480,
  rowsPerBeat: 4,
  preserveSubRowTiming: true,
  autoNoteOff: true,
  maxEffectColumns: 4,
};

// ============================================================================
// TRACKER EVENT SYNC
// ============================================================================

/**
 * TrackerEventSync - Bidirectional sync between tracker and event store.
 * 
 * The tracker view is COMPUTED from events, not stored. This ensures
 * any edit from any source is immediately visible in the tracker.
 */
export class TrackerEventSync {
  private config: TrackerSyncConfig;
  
  // Stream subscriptions
  private subscriptions: Map<EventStreamId, SubscriptionId> = new Map();
  
  // Computed views per stream
  private views: Map<EventStreamId, ComputedTrackerView> = new Map();
  
  // View subscribers
  private viewSubscribers: Map<EventStreamId, Set<(view: ComputedTrackerView) => void>> = new Map();
  
  // Batch edit flag to prevent circular updates
  private isInternalEdit: boolean = false;
  
  constructor(config: Partial<TrackerSyncConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  // ========== STREAM BINDING ==========
  
  /**
   * Bind a track to an event stream for bidirectional sync.
   */
  bindStream(streamId: EventStreamId, patternLength: number): void {
    if (this.subscriptions.has(streamId)) return;
    
    // Initial computation
    this.computeView(streamId, patternLength);
    
    // Subscribe to changes
    const store = getSharedEventStore();
    const subId = store.subscribe(streamId, () => {
      if (!this.isInternalEdit) {
        this.computeView(streamId, patternLength);
        this.notifyViewSubscribers(streamId);
      }
    });
    
    this.subscriptions.set(streamId, subId);
  }
  
  /**
   * Unbind a stream.
   */
  unbindStream(streamId: EventStreamId): void {
    const subId = this.subscriptions.get(streamId);
    if (subId) {
      getSharedEventStore().unsubscribe(subId);
      this.subscriptions.delete(streamId);
    }
    this.views.delete(streamId);
    this.viewSubscribers.delete(streamId);
  }
  
  /**
   * Subscribe to view changes for a stream.
   */
  subscribeToView(
    streamId: EventStreamId, 
    callback: (view: ComputedTrackerView) => void
  ): () => void {
    let subscribers = this.viewSubscribers.get(streamId);
    if (!subscribers) {
      subscribers = new Set();
      this.viewSubscribers.set(streamId, subscribers);
    }
    subscribers.add(callback);
    
    // Immediately call with current view
    const view = this.views.get(streamId);
    if (view) {
      callback(view);
    }
    
    return () => subscribers!.delete(callback);
  }
  
  // ========== VIEW COMPUTATION ==========
  
  /**
   * Compute tracker view from events.
   * This is the core function that converts events → tracker rows.
   */
  private computeView(streamId: EventStreamId, patternLength: number): void {
    const store = getSharedEventStore();
    const stream = store.getStream(streamId);
    
    if (!stream) {
      this.views.set(streamId, {
        rows: this.createEmptyRows(patternLength),
        eventToRow: new Map(),
        rowToEvents: new Map(),
        dirty: false,
      });
      return;
    }
    
    const ticksPerRow = this.config.ppq / this.config.rowsPerBeat;
    const rows: TrackerRow[] = this.createEmptyRows(patternLength);
    const eventToRow = new Map<EventId, number>();
    const rowToEvents = new Map<number, EventId[]>();
    
    // Group events by their quantized row
    const eventsByRow = new Map<number, Event<TrackerEventPayload>[]>();
    
    for (const event of stream.events) {
      const payload = event.payload as TrackerEventPayload;
      const tick = event.startTick as number;
      
      // Calculate row and sub-row delay
      const exactRow = tick / ticksPerRow;
      const quantizedRow = Math.floor(exactRow);
      const subRowTick = tick - (quantizedRow * ticksPerRow);
      const delay = this.config.preserveSubRowTiming 
        ? Math.round((subRowTick / ticksPerRow) * 255)
        : 0;
      
      if (quantizedRow >= 0 && quantizedRow < patternLength) {
        if (!eventsByRow.has(quantizedRow)) {
          eventsByRow.set(quantizedRow, []);
        }
        eventsByRow.get(quantizedRow)!.push({
          ...event,
          payload: { ...payload, trackerDelay: delay },
        } as Event<TrackerEventPayload>);
        
        eventToRow.set(event.id, quantizedRow);
        
        if (!rowToEvents.has(quantizedRow)) {
          rowToEvents.set(quantizedRow, []);
        }
        rowToEvents.get(quantizedRow)!.push(event.id);
      }
    }
    
    // Convert events to tracker rows
    for (const [rowIdx, events] of eventsByRow) {
      // Sort by delay (sub-row timing)
      events.sort((a, b) => {
        const delayA = (a.payload as TrackerEventPayload).trackerDelay ?? 0;
        const delayB = (b.payload as TrackerEventPayload).trackerDelay ?? 0;
        return delayA - delayB;
      });
      
      // Primary note (first note event)
      const noteEvent = events.find(e => 
        (e.payload as TrackerEventPayload).type === 'note' &&
        (e.payload as TrackerEventPayload).pitch !== undefined
      );
      
      if (noteEvent) {
        const payload = noteEvent.payload as TrackerEventPayload;
        const noteCellData: Partial<NoteCell> = { note: asMidiNote(payload.pitch ?? 60) };
        if (payload.instrument !== undefined) (noteCellData as any).instrument = payload.instrument;
        if (payload.velocity !== undefined) (noteCellData as any).volume = asVelocity(payload.velocity);
        if (payload.pan !== undefined) (noteCellData as any).pan = payload.pan;
        if (payload.trackerDelay !== undefined) (noteCellData as any).delay = payload.trackerDelay;

        rows[rowIdx] = {
          note: noteCellData as NoteCell,
          effects: this.buildEffectCells(events, noteEvent),
        };
      }
      
      // Handle note-offs (look for events ending at this row)
      // This is done by checking if a note's duration ends here
    }
    
    // Add note-offs for notes that end
    if (this.config.autoNoteOff) {
      this.insertNoteOffs(rows, stream.events, ticksPerRow, patternLength);
    }
    
    this.views.set(streamId, {
      rows,
      eventToRow,
      rowToEvents,
      dirty: false,
    });
  }
  
  /**
   * Build effect cells from events.
   */
  private buildEffectCells(
    events: Event<TrackerEventPayload>[],
    primaryNote: Event<TrackerEventPayload>
  ): EffectCell[] {
    const effects: EffectCell[] = [];
    const payload = primaryNote.payload as TrackerEventPayload;
    
    // Add stored tracker effects
    if (payload.trackerEffects) {
      for (const cmd of payload.trackerEffects) {
        effects.push({ effects: [cmd] });
      }
    }
    
    // Handle other events on same row (automation, triggers, etc.)
    for (const event of events) {
      if (event.id === primaryNote.id) continue;
      
      const evtPayload = event.payload as TrackerEventPayload;
      
      if (evtPayload.type === 'automation') {
        // Convert automation to effect command
        effects.push({
          effects: [{
            code: asEffectCode(FX.AUTO_POINT),
            param: asEffectParam(evtPayload.velocity ?? 0),
          }],
        });
      } else if (evtPayload.type === 'trigger') {
        // Generator/card triggers
        effects.push({
          effects: [{
            code: asEffectCode(FX.GEN_TRIGGER),
            param: asEffectParam(evtPayload.velocity ?? 0),
          }],
        });
      }
    }
    
    // Pad to minimum columns
    while (effects.length < this.config.maxEffectColumns) {
      effects.push(emptyEffectCell());
    }
    
    return effects.slice(0, this.config.maxEffectColumns);
  }
  
  /**
   * Insert note-off markers where notes end.
   */
  private insertNoteOffs(
    rows: TrackerRow[],
    events: readonly Event<any>[],
    ticksPerRow: number,
    patternLength: number
  ): void {
    for (const event of events) {
      const payload = event.payload as TrackerEventPayload;
      if (payload.type !== 'note') continue;
      
      const startTick = event.startTick as number;
      const duration = event.duration as number;
      const endTick = startTick + duration;
      
      const endRow = Math.floor(endTick / ticksPerRow);
      
      // Only add note-off if:
      // 1. End row is within pattern
      // 2. End row doesn't already have a note
      // 3. There's a gap before next note on same pitch
      if (endRow > 0 && endRow < patternLength) {
        const row = rows[endRow];
        if (!row) continue;

        if (row.note.note === SpecialNote.Empty) {
          rows[endRow] = {
            ...row,
            note: { note: SpecialNote.NoteOff },
            effects: row.effects,
          };
        }
      }
    }
  }
  
  /**
   * Create empty rows.
   */
  private createEmptyRows(length: number): TrackerRow[] {
    return Array.from({ length }, () => ({
      note: emptyNoteCell(),
      effects: Array.from({ length: this.config.maxEffectColumns }, () => emptyEffectCell()),
    }));
  }
  
  // ========== TRACKER → EVENT STORE ==========
  
  /**
   * Apply a tracker edit to the event store.
   * This converts tracker row changes back to events.
   */
  setNote(
    streamId: EventStreamId,
    rowIndex: number,
    note: NoteCell,
    patternLength: number
  ): void {
    const store = getSharedEventStore();
    const view = this.views.get(streamId);
    const ticksPerRow = this.config.ppq / this.config.rowsPerBeat;
    
    this.isInternalEdit = true;
    
    try {
      executeWithUndo({
        description: 'Tracker note edit',
        execute: () => {
          const removed: Event<TrackerEventPayload>[] = [];
          const added: Event<TrackerEventPayload>[] = [];

          // Remove existing events at this row.
          const existingEventIds = view?.rowToEvents.get(rowIndex) ?? [];
          if (existingEventIds.length > 0) {
            const existingIdSet = new Set(existingEventIds);
            const streamEvents = store.getStream(streamId)?.events ?? [];
            for (const evt of streamEvents) {
              if (existingIdSet.has(evt.id)) {
                removed.push(evt as Event<TrackerEventPayload>);
              }
            }
            store.removeEvents(streamId, removed.map(e => e.id));
          }

          // Add new event if note is valid.
          if (note.note >= 0 && note.note <= 127) {
            const baseTick = rowIndex * ticksPerRow;
            const delayTicks =
              note.delay === undefined ? 0 : Math.round((note.delay / 255) * ticksPerRow);

            // Find duration (until next note or end of pattern)
            const duration = ticksPerRow;
            // TODO: Look ahead to find actual note end

            const payload: TrackerEventPayload = {
              type: 'note',
              pitch: note.note as number,
              ...(note.volume === undefined ? {} : { velocity: Number(note.volume) }),
              ...(note.pan === undefined ? {} : { pan: note.pan }),
              ...(note.instrument === undefined ? {} : { instrument: Number(note.instrument) }),
              ...(note.delay === undefined ? {} : { trackerDelay: note.delay }),
              sourceEditor: 'tracker',
            };

            const event = createEvent<TrackerEventPayload>({
              id: asEventId(`tracker-${streamId}-${rowIndex}-${Date.now()}`),
              kind: EventKinds.NOTE,
              start: baseTick + delayTicks,
              duration,
              payload,
            });

            store.addEvents(streamId, [event]);
            added.push(event);
          }

          return { removed, added };
        },
        undo: ({ removed, added }) => {
          if (added.length > 0) {
            store.removeEvents(streamId, added.map(e => e.id));
          }
          if (removed.length > 0) {
            store.addEvents(streamId, removed);
          }
        },
        redo: ({ removed, added }) => {
          if (removed.length > 0) {
            store.removeEvents(streamId, removed.map(e => e.id));
          }
          if (added.length > 0) {
            store.addEvents(streamId, added);
          }
        },
      });
      
      // Recompute view
      this.computeView(streamId, patternLength);
      this.notifyViewSubscribers(streamId);
      
    } finally {
      this.isInternalEdit = false;
    }
  }
  
  /**
   * Apply effect changes to the event store.
   */
  setEffect(
    streamId: EventStreamId,
    rowIndex: number,
    effectColumn: number,
    effect: EffectCell,
    patternLength: number
  ): void {
    const store = getSharedEventStore();
    const view = this.views.get(streamId);
    
    if (!view) return;
    
    this.isInternalEdit = true;
    
    try {
      // Find the event at this row
      const eventIds = view.rowToEvents.get(rowIndex);
      if (!eventIds || eventIds.length === 0) {
        // No event to attach effects to - effects are metadata on notes
        // Could create a control event for standalone effects
        return;
      }

      const eventId = eventIds[0]!;
      const stream = store.getStream(streamId);
      const existingEvent = stream?.events.find(e => e.id === eventId);

      if (!existingEvent) return;
      
      executeWithUndo({
        description: 'Tracker effect edit',
        execute: () => {
          const beforePayload = existingEvent.payload as TrackerEventPayload;
          const trackerEffects = [...(beforePayload.trackerEffects ?? [])];

          // Update or add effect at column.
          if (effect.effects.length > 0) {
            const first = effect.effects[0];
            if (first) {
              trackerEffects[effectColumn] = first;
            }
          } else {
            trackerEffects.splice(effectColumn, 1);
          }

          // Process effects that map to event properties.
          let newVelocity = beforePayload.velocity;
          let newPan = beforePayload.pan;

          for (const cmd of effect.effects) {
            if (cmd.code === FX.SET_VOLUME) {
              newVelocity = cmd.param as number;
            } else if (cmd.code === FX.SET_PAN) {
              newPan = cmd.param as number;
            }
          }

          const afterPayload: TrackerEventPayload = {
            ...beforePayload,
            ...(newVelocity === undefined ? {} : { velocity: newVelocity }),
            ...(newPan === undefined ? {} : { pan: newPan }),
            trackerEffects: trackerEffects.filter((e): e is EffectCommand => e !== undefined),
          };

          store.updateEvent(streamId, eventId, { payload: afterPayload });
          return { beforePayload, afterPayload };
        },
        undo: ({ beforePayload }) => {
          store.updateEvent(streamId, eventId, { payload: beforePayload });
        },
        redo: ({ afterPayload }) => {
          store.updateEvent(streamId, eventId, { payload: afterPayload });
        },
      });
      
      this.computeView(streamId, patternLength);
      this.notifyViewSubscribers(streamId);
      
    } finally {
      this.isInternalEdit = false;
    }
  }
  
  /**
   * Clear a row (remove all events at that row).
   */
  clearRow(streamId: EventStreamId, rowIndex: number, patternLength: number): void {
    const store = getSharedEventStore();
    const view = this.views.get(streamId);
    
    if (!view) return;
    
    this.isInternalEdit = true;
    
    try {
      const eventIds = view.rowToEvents.get(rowIndex);
      if (eventIds) {
        executeWithUndo({
          description: 'Tracker clear row',
          execute: () => {
            const streamEvents = store.getStream(streamId)?.events ?? [];
            const idSet = new Set(eventIds);
            const removed: Event<unknown>[] = [];
            for (const evt of streamEvents) {
              if (idSet.has(evt.id)) {
                removed.push(evt);
              }
            }
            if (removed.length > 0) {
              store.removeEvents(streamId, removed.map(e => e.id));
            }
            return removed;
          },
          undo: (removed) => {
            if (removed.length > 0) {
              store.addEvents(streamId, removed);
            }
          },
          redo: (removed) => {
            if (removed.length > 0) {
              store.removeEvents(streamId, removed.map(e => e.id));
            }
          },
        });
      }
      
      this.computeView(streamId, patternLength);
      this.notifyViewSubscribers(streamId);
      
    } finally {
      this.isInternalEdit = false;
    }
  }
  
  // ========== BATCH OPERATIONS ==========
  
  /**
   * Transpose events in a range.
   */
  transpose(
    streamId: EventStreamId,
    startRow: number,
    endRow: number,
    semitones: number,
    patternLength: number
  ): void {
    const store = getSharedEventStore();
    const view = this.views.get(streamId);
    
    if (!view) return;
    
    this.isInternalEdit = true;
    
    try {
      executeWithUndo({
        description: `Transpose ${semitones} semitones`,
        execute: () => {
          const before = new Map<EventId, TrackerEventPayload>();
          const after = new Map<EventId, TrackerEventPayload>();

          const streamEvents = store.getStream(streamId)?.events ?? [];
          const eventsById = new Map(streamEvents.map(e => [e.id, e] as const));

          for (let row = startRow; row <= endRow; row++) {
            const eventIds = view.rowToEvents.get(row);
            if (!eventIds) continue;

            for (const eventId of eventIds) {
              const event = eventsById.get(eventId);
              if (!event) continue;

              const payload = event.payload as TrackerEventPayload;
              if (payload.type === 'note' && payload.pitch !== undefined) {
                const newPitch = Math.max(0, Math.min(127, payload.pitch + semitones));
                before.set(eventId, payload);
                after.set(eventId, { ...payload, pitch: newPitch });
              }
            }
          }

          const updates = new Map<EventId, Partial<Event<TrackerEventPayload>>>();
          for (const [eventId, payload] of after) {
            updates.set(eventId, { payload });
          }
          if (updates.size > 0) {
            store.updateEvents<TrackerEventPayload>(streamId, updates);
          }
          return { before, after };
        },
        undo: ({ before }) => {
          const updates = new Map<EventId, Partial<Event<TrackerEventPayload>>>();
          for (const [eventId, payload] of before) {
            updates.set(eventId, { payload });
          }
          if (updates.size > 0) {
            store.updateEvents<TrackerEventPayload>(streamId, updates);
          }
        },
        redo: ({ after }) => {
          const updates = new Map<EventId, Partial<Event<TrackerEventPayload>>>();
          for (const [eventId, payload] of after) {
            updates.set(eventId, { payload });
          }
          if (updates.size > 0) {
            store.updateEvents<TrackerEventPayload>(streamId, updates);
          }
        },
      });
      
      this.computeView(streamId, patternLength);
      this.notifyViewSubscribers(streamId);
      
    } finally {
      this.isInternalEdit = false;
    }
  }
  
  /**
   * Scale velocities in a range.
   */
  scaleVelocity(
    streamId: EventStreamId,
    startRow: number,
    endRow: number,
    multiplier: number,
    patternLength: number
  ): void {
    const store = getSharedEventStore();
    const view = this.views.get(streamId);
    
    if (!view) return;
    
    this.isInternalEdit = true;
    
    try {
      executeWithUndo({
        description: `Scale velocity ${multiplier}x`,
        execute: () => {
          const before = new Map<EventId, TrackerEventPayload>();
          const after = new Map<EventId, TrackerEventPayload>();

          const streamEvents = store.getStream(streamId)?.events ?? [];
          const eventsById = new Map(streamEvents.map(e => [e.id, e] as const));

          for (let row = startRow; row <= endRow; row++) {
            const eventIds = view.rowToEvents.get(row);
            if (!eventIds) continue;

            for (const eventId of eventIds) {
              const event = eventsById.get(eventId);
              if (!event) continue;

              const payload = event.payload as TrackerEventPayload;
              if (payload.velocity !== undefined) {
                const newVelocity = Math.max(
                  0,
                  Math.min(127, Math.round(payload.velocity * multiplier))
                );
                before.set(eventId, payload);
                after.set(eventId, { ...payload, velocity: newVelocity });
              }
            }
          }

          const updates = new Map<EventId, Partial<Event<TrackerEventPayload>>>();
          for (const [eventId, payload] of after) {
            updates.set(eventId, { payload });
          }
          if (updates.size > 0) {
            store.updateEvents<TrackerEventPayload>(streamId, updates);
          }
          return { before, after };
        },
        undo: ({ before }) => {
          const updates = new Map<EventId, Partial<Event<TrackerEventPayload>>>();
          for (const [eventId, payload] of before) {
            updates.set(eventId, { payload });
          }
          if (updates.size > 0) {
            store.updateEvents<TrackerEventPayload>(streamId, updates);
          }
        },
        redo: ({ after }) => {
          const updates = new Map<EventId, Partial<Event<TrackerEventPayload>>>();
          for (const [eventId, payload] of after) {
            updates.set(eventId, { payload });
          }
          if (updates.size > 0) {
            store.updateEvents<TrackerEventPayload>(streamId, updates);
          }
        },
      });
      
      this.computeView(streamId, patternLength);
      this.notifyViewSubscribers(streamId);
      
    } finally {
      this.isInternalEdit = false;
    }
  }
  
  // ========== VIEW ACCESS ==========
  
  /**
   * Get computed view for a stream.
   */
  getView(streamId: EventStreamId): ComputedTrackerView | undefined {
    return this.views.get(streamId);
  }
  
  /**
   * Get row at index from computed view.
   */
  getRow(streamId: EventStreamId, rowIndex: number): TrackerRow | undefined {
    const view = this.views.get(streamId);
    return view?.rows[rowIndex];
  }
  
  /**
   * Force recompute of a view.
   */
  recomputeView(streamId: EventStreamId, patternLength: number): void {
    this.computeView(streamId, patternLength);
    this.notifyViewSubscribers(streamId);
  }
  
  // ========== INTERNAL ==========
  
  private notifyViewSubscribers(streamId: EventStreamId): void {
    const subscribers = this.viewSubscribers.get(streamId);
    const view = this.views.get(streamId);
    
    if (subscribers && view) {
      for (const callback of subscribers) {
        callback(view);
      }
    }
  }
  
  /**
   * Dispose all subscriptions.
   */
  dispose(): void {
    const store = getSharedEventStore();
    for (const [, subId] of this.subscriptions) {
      store.unsubscribe(subId);
    }
    this.subscriptions.clear();
    this.views.clear();
    this.viewSubscribers.clear();
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let syncInstance: TrackerEventSync | null = null;

/**
 * Get or create the tracker event sync singleton.
 */
export function getTrackerEventSync(config?: Partial<TrackerSyncConfig>): TrackerEventSync {
  if (!syncInstance) {
    syncInstance = new TrackerEventSync(config);
  }
  return syncInstance;
}

/**
 * Reset the tracker event sync (for testing).
 */
export function resetTrackerEventSync(): void {
  if (syncInstance) {
    syncInstance.dispose();
    syncInstance = null;
  }
}

// ============================================================================
// HELPER: Convert Piano Roll edit to tracker-compatible event
// ============================================================================

/**
 * Enhance an event with tracker metadata when created from other editors.
 * Call this when creating events from piano roll, notation, etc.
 */
export function enhanceEventForTracker(
  event: Event<any>,
  source: TrackerEventPayload['sourceEditor']
): Event<TrackerEventPayload> {
  const existingPayload = event.payload as Partial<TrackerEventPayload>;
  
  return {
    ...event,
    payload: {
      type: existingPayload.type ?? 'note',
      sourceEditor: source,
      ...(existingPayload.pitch !== undefined && { pitch: existingPayload.pitch }),
      ...(existingPayload.velocity !== undefined && { velocity: existingPayload.velocity }),
      ...(existingPayload.pan !== undefined && { pan: existingPayload.pan }),
      ...(existingPayload.instrument !== undefined && { instrument: existingPayload.instrument }),
      ...(existingPayload.trackerEffects !== undefined && { trackerEffects: existingPayload.trackerEffects }),
      ...(existingPayload.trackerDelay !== undefined && { trackerDelay: existingPayload.trackerDelay }),
      ...(existingPayload.trackerColumn !== undefined && { trackerColumn: existingPayload.trackerColumn }),
    } as TrackerEventPayload,
  };
}
