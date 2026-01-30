/**
 * @fileoverview SharedEventStore - Single source of truth for event streams.
 * 
 * **SSOT:** This is the canonical store for all event streams and events.
 * All editors (Tracker, Piano Roll, Notation) read from and write to this store.
 * Changes are broadcast to all subscribers for real-time synchronization.
 * 
 * @module @cardplay/state/event-store
 * @see cardplay/docs/canon/ssot-stores.md
 */

import type { Event } from '../types/event';
import { updateEvent, ensureCanonicalEvent, isLegacyEventShape } from '../types/event';
import type { EventId } from '../types/event-id';
import type { Tick } from '../types/primitives';
import {
  type EventStreamId,
  type EventStreamRecord,
  type CreateEventStreamOptions,
  type StreamChangeType,
  type EventStreamCallback,
  type SubscriptionId,
  type EventStreamSubscription,
  generateSubscriptionId,
  createEventStreamRecord,
} from './types';

// Re-export types for external consumers
export type { EventStreamId, EventStreamRecord, CreateEventStreamOptions, SubscriptionId };

// ============================================================================
// SHARED EVENT STORE INTERFACE
// ============================================================================

/**
 * SharedEventStore provides centralized storage for all event streams.
 * 
 * This is THE single source of truth for event data in the application.
 * All editors must read from and write to this store.
 */
export interface SharedEventStore {
  // --- Stream CRUD ---
  
  /**
   * Creates a new event stream.
   */
  createStream<P = unknown>(options: CreateEventStreamOptions<P>): EventStreamRecord<P>;
  /** @deprecated legacy overload: returns the created stream ID */
  createStream(name: string): EventStreamId;
  
  /**
   * Gets a stream by ID.
   */
  getStream<P = unknown>(id: EventStreamId): EventStreamRecord<P> | undefined;
  
  /**
   * Gets all streams.
   */
  getAllStreams(): readonly EventStreamRecord[];

  /** @deprecated legacy helper: returns all stream IDs */
  listStreamIds(): readonly EventStreamId[];
  
  /**
   * Updates a stream using an updater function.
   */
  updateStream<P = unknown>(
    id: EventStreamId,
    updater: (stream: EventStreamRecord<P>) => Partial<EventStreamRecord<P>>
  ): EventStreamRecord<P> | undefined;
  
  /**
   * Deletes a stream.
   */
  deleteStream(id: EventStreamId): boolean;
  
  // --- Event Operations ---
  
  /**
   * Adds events to a stream.
   */
  addEvents<P = unknown>(
    streamId: EventStreamId,
    events: readonly Event<P>[]
  ): boolean;

  /** @deprecated legacy helper */
  addEvent<P = unknown>(streamId: EventStreamId, event: Event<P>): boolean;
  
  /**
   * Removes events from a stream by ID.
   */
  removeEvents(
    streamId: EventStreamId,
    eventIds: readonly EventId[]
  ): boolean;

  /** @deprecated legacy helper */
  deleteEvent(streamId: EventStreamId, eventId: EventId): boolean;

  /** @deprecated legacy helper */
  clearStream(streamId: EventStreamId): boolean;
  
  /**
   * Updates a single event in a stream.
   */
  updateEvent<P = unknown>(
    streamId: EventStreamId,
    eventId: EventId,
    changes: Partial<Event<P>>
  ): boolean;
  
  /**
   * Updates multiple events in a stream.
   */
  updateEvents<P = unknown>(
    streamId: EventStreamId,
    updates: ReadonlyMap<EventId, Partial<Event<P>>>
  ): boolean;
  
  /**
   * Gets events in a time range.
   */
  getEventsInRange<P = unknown>(
    streamId: EventStreamId,
    start: Tick,
    end: Tick
  ): readonly Event<P>[];
  
  // --- Subscriptions ---
  
  /**
   * Subscribes to changes on a specific stream.
   */
  subscribe<P = unknown>(
    streamId: EventStreamId,
    callback: EventStreamCallback<P>
  ): SubscriptionId;

  /** @deprecated legacy helper: callback receives event array only */
  subscribeToStream<P = unknown>(
    streamId: EventStreamId,
    callback: (events: readonly Event<P>[]) => void
  ): SubscriptionId;
  
  /**
   * Subscribes to changes on all streams.
   */
  subscribeAll(callback: EventStreamCallback): SubscriptionId;
  
  /**
   * Unsubscribes from changes.
   */
  unsubscribe(subscriptionId: SubscriptionId): boolean;

  /** @deprecated legacy helper */
  unsubscribeFromStream(streamId: EventStreamId, subscriptionId: SubscriptionId): boolean;

  /** @deprecated legacy helper */
  setStream<P = unknown>(streamId: EventStreamId, events: readonly Event<P>[]): boolean;
  
  // --- Batch Operations ---
  
  /**
   * Begins a batch operation (multiple changes as one undo step).
   */
  beginBatch(): void;
  
  /**
   * Commits a batch operation.
   */
  commitBatch(): void;
  
  /**
   * Cancels a batch operation (rolls back changes).
   */
  cancelBatch(): void;
  
  /**
   * Gets the current version number for invalidation tracking.
   */
  getVersion(): number;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/**
 * Internal state for the store.
 */
interface StoreState {
  streams: Map<EventStreamId, EventStreamRecord>;
  subscriptions: Map<SubscriptionId, EventStreamSubscription>;
  batchDepth: number;
  batchChanges: Map<EventStreamId, StreamChangeType[]>;
  version: number;  // Incremented on every mutation for invalidation tracking
}

/**
 * Creates a new SharedEventStore instance.
 */
export function createEventStore(): SharedEventStore {
  const state: StoreState = {
    streams: new Map(),
    subscriptions: new Map(),
    batchDepth: 0,
    batchChanges: new Map(),
    version: 0,
  };
  
  // --- Internal helpers ---
  
  function notify(streamId: EventStreamId, changeType: StreamChangeType): void {
    // Increment version on every mutation
    state.version++;
    
    // If in batch mode, accumulate changes
    if (state.batchDepth > 0) {
      const existing = state.batchChanges.get(streamId) ?? [];
      state.batchChanges.set(streamId, [...existing, changeType]);
      return;
    }
    
    const stream = state.streams.get(streamId);
    if (!stream) return;
    
    // Notify specific stream subscribers
    for (const sub of state.subscriptions.values()) {
      if (sub.active && (sub.streamId === streamId || sub.streamId === '*')) {
        try {
          sub.callback(stream, changeType);
        } catch (e) {
          console.error('Subscription callback error:', e);
        }
      }
    }
  }
  
  function sortEventsByStart<P>(events: readonly Event<P>[]): Event<P>[] {
    return [...events].sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
  }
  
  // --- Store implementation ---
  
  function createStreamImpl<P = unknown>(
    optionsOrName: CreateEventStreamOptions<P> | string
  ): EventStreamRecord<P> | EventStreamId {
    const options: CreateEventStreamOptions<P> =
      typeof optionsOrName === 'string' ? { name: optionsOrName } : optionsOrName;

    const record = createEventStreamRecord(options);
    state.streams.set(record.id, record as EventStreamRecord);
    notify(record.id, 'created');
    return typeof optionsOrName === 'string' ? record.id : record;
  }

  const store: SharedEventStore = {
    createStream: createStreamImpl as SharedEventStore['createStream'],
    
    getStream<P = unknown>(id: EventStreamId): EventStreamRecord<P> | undefined {
      return state.streams.get(id) as EventStreamRecord<P> | undefined;
    },
    
    getAllStreams(): readonly EventStreamRecord[] {
      return Array.from(state.streams.values());
    },

    listStreamIds(): readonly EventStreamId[] {
      return Array.from(state.streams.keys());
    },
    
    updateStream<P = unknown>(
      id: EventStreamId,
      updater: (stream: EventStreamRecord<P>) => Partial<EventStreamRecord<P>>
    ): EventStreamRecord<P> | undefined {
      const existing = state.streams.get(id) as EventStreamRecord<P> | undefined;
      if (!existing) return undefined;
      
      const changes = updater(existing);
      const updated: EventStreamRecord<P> = {
        ...existing,
        ...changes,
        lastModified: Date.now(),
      };
      
      state.streams.set(id, updated as EventStreamRecord);
      notify(id, 'updated');
      return updated;
    },
    
    deleteStream(id: EventStreamId): boolean {
      const existed = state.streams.has(id);
      if (existed) {
        state.streams.delete(id);
        notify(id, 'deleted');
      }
      return existed;
    },
    
    addEvents<P = unknown>(
      streamId: EventStreamId,
      events: readonly Event<P>[]
    ): boolean {
      const stream = state.streams.get(streamId) as EventStreamRecord<P> | undefined;
      if (!stream || stream.locked) return false;

      // Change 314: Normalize legacy event shapes at the boundary
      const normalized = events.map(e =>
        isLegacyEventShape(e) ? ensureCanonicalEvent(e) as Event<P> : e
      );

      const combined = [...stream.events, ...normalized] as Event<P>[];
      const sorted = sortEventsByStart(combined);
      
      const updated: EventStreamRecord<P> = {
        ...stream,
        events: sorted,
        lastModified: Date.now(),
      };
      
      state.streams.set(streamId, updated as EventStreamRecord);
      notify(streamId, 'events-added');
      return true;
    },

    addEvent<P = unknown>(streamId: EventStreamId, event: Event<P>): boolean {
      return store.addEvents(streamId, [event]);
    },
    
    removeEvents(
      streamId: EventStreamId,
      eventIds: readonly EventId[]
    ): boolean {
      const stream = state.streams.get(streamId);
      if (!stream || stream.locked) return false;
      
      const idSet = new Set(eventIds);
      const filtered = stream.events.filter(e => !idSet.has(e.id));
      
      if (filtered.length === stream.events.length) {
        return false; // Nothing removed
      }
      
      const updated: EventStreamRecord = {
        ...stream,
        events: filtered,
        lastModified: Date.now(),
      };
      
      state.streams.set(streamId, updated);
      notify(streamId, 'events-removed');
      return true;
    },

    deleteEvent(streamId: EventStreamId, eventId: EventId): boolean {
      return store.removeEvents(streamId, [eventId]);
    },

    clearStream(streamId: EventStreamId): boolean {
      const existing = state.streams.get(streamId);
      if (!existing || existing.locked) return false;
      const updated: EventStreamRecord = {
        ...existing,
        events: [],
        lastModified: Date.now(),
      };
      state.streams.set(streamId, updated);
      notify(streamId, 'events-modified');
      return true;
    },
    
    updateEvent<P = unknown>(
      streamId: EventStreamId,
      eventId: EventId,
      changes: Partial<Event<P>>
    ): boolean {
      const stream = state.streams.get(streamId) as EventStreamRecord<P> | undefined;
      if (!stream || stream.locked) return false;
      
      let found = false;
      const updatedEvents = stream.events.map(e => {
        if (e.id === eventId) {
          found = true;
          return updateEvent(e, changes as Partial<Event<unknown>>) as Event<P>;
        }
        return e;
      });
      
      if (!found) return false;
      
      const sorted = sortEventsByStart(updatedEvents);
      
      const updated: EventStreamRecord<P> = {
        ...stream,
        events: sorted,
        lastModified: Date.now(),
      };
      
      state.streams.set(streamId, updated as EventStreamRecord);
      notify(streamId, 'events-modified');
      return true;
    },
    
    updateEvents<P = unknown>(
      streamId: EventStreamId,
      updates: ReadonlyMap<EventId, Partial<Event<P>>>
    ): boolean {
      const stream = state.streams.get(streamId) as EventStreamRecord<P> | undefined;
      if (!stream || stream.locked) return false;
      
      let anyUpdated = false;
      const updatedEvents = stream.events.map(e => {
        const changes = updates.get(e.id);
        if (changes) {
          anyUpdated = true;
          return updateEvent(e, changes as Partial<Event<unknown>>) as Event<P>;
        }
        return e;
      });
      
      if (!anyUpdated) return false;
      
      const sorted = sortEventsByStart(updatedEvents);
      
      const updated: EventStreamRecord<P> = {
        ...stream,
        events: sorted,
        lastModified: Date.now(),
      };
      
      state.streams.set(streamId, updated as EventStreamRecord);
      notify(streamId, 'events-modified');
      return true;
    },
    
    getEventsInRange<P = unknown>(
      streamId: EventStreamId,
      start: Tick,
      end: Tick
    ): readonly Event<P>[] {
      const stream = state.streams.get(streamId) as EventStreamRecord<P> | undefined;
      if (!stream) return [];
      
      return stream.events.filter(e => {
        const eventEnd = e.start + e.duration;
        return e.start < end && eventEnd > start;
      });
    },
    
    subscribe<P = unknown>(
      streamId: EventStreamId,
      callback: EventStreamCallback<P>
    ): SubscriptionId {
      const id = generateSubscriptionId();
      const subscription: EventStreamSubscription = {
        id,
        streamId,
        callback: callback as EventStreamCallback,
        active: true,
      };
      state.subscriptions.set(id, subscription);
      return id;
    },

    subscribeToStream<P = unknown>(
      streamId: EventStreamId,
      callback: (events: readonly Event<P>[]) => void
    ): SubscriptionId {
      return store.subscribe<P>(streamId, (stream) => {
        callback(stream.events);
      });
    },
    
    subscribeAll(callback: EventStreamCallback): SubscriptionId {
      const id = generateSubscriptionId();
      const subscription: EventStreamSubscription = {
        id,
        streamId: '*',
        callback,
        active: true,
      };
      state.subscriptions.set(id, subscription);
      return id;
    },
    
    unsubscribe(subscriptionId: SubscriptionId): boolean {
      return state.subscriptions.delete(subscriptionId);
    },

    unsubscribeFromStream(_streamId: EventStreamId, subscriptionId: SubscriptionId): boolean {
      return store.unsubscribe(subscriptionId);
    },

    setStream<P = unknown>(streamId: EventStreamId, events: readonly Event<P>[]): boolean {
      const existing = state.streams.get(streamId) as EventStreamRecord<P> | undefined;
      if (!existing || existing.locked) return false;
      const updated: EventStreamRecord<P> = {
        ...existing,
        events: sortEventsByStart(events as readonly Event<P>[]),
        lastModified: Date.now(),
      };
      state.streams.set(streamId, updated as EventStreamRecord);
      notify(streamId, 'events-modified');
      return true;
    },
    
    beginBatch(): void {
      state.batchDepth++;
    },
    
    commitBatch(): void {
      if (state.batchDepth > 0) {
        state.batchDepth--;
        
        if (state.batchDepth === 0) {
          // Flush accumulated changes
          for (const [streamId, changes] of state.batchChanges) {
            // Pick most significant change type
            const changeType = changes.includes('deleted') ? 'deleted' :
                              changes.includes('created') ? 'created' :
                              changes.includes('events-added') || changes.includes('events-removed') 
                                ? 'events-modified' : 'updated';
            
            const stream = state.streams.get(streamId);
            if (stream) {
              for (const sub of state.subscriptions.values()) {
                if (sub.active && (sub.streamId === streamId || sub.streamId === '*')) {
                  try {
                    sub.callback(stream, changeType);
                  } catch (e) {
                    console.error('Subscription callback error:', e);
                  }
                }
              }
            }
          }
          state.batchChanges.clear();
        }
      }
    },
    
    cancelBatch(): void {
      if (state.batchDepth > 0) {
        state.batchDepth = 0;
        state.batchChanges.clear();
        // Note: This doesn't actually roll back changes.
        // For true rollback, we'd need to store snapshots at batch start.
      }
    },
    
    getVersion(): number {
      return state.version;
    },
  };
  
  return store;
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let _sharedStore: SharedEventStore | null = null;

/**
 * Gets the shared event store singleton.
 * Creates it if it doesn't exist.
 */
export function getSharedEventStore(): SharedEventStore {
  if (!_sharedStore) {
    _sharedStore = createEventStore();
  }
  return _sharedStore;
}

/**
 * Resets the shared event store (for testing).
 */
export function resetSharedEventStore(): void {
  _sharedStore = null;
}
