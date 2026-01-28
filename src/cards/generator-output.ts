/**
 * @fileoverview Generator Output Interface - Connect generator cards to SharedEventStore.
 * 
 * This module provides the interface for generator cards (Arranger, DrumMachine,
 * Sequencer, Melody, Arpeggiator, Bassline) to write their output to the shared
 * event store, making generated events visible in all editor views.
 * 
 * @module @cardplay/cards/generator-output
 * @see INTEGRATION_FIXES_CHECKLIST.md Phase C.1
 */

import type { Event } from '../types/event';
import { updateEvent } from '../types/event';
import type {
  EventStreamId,
  EventId,
  SubscriptionId,
} from '../state/types';
import {
  getSharedEventStore,
  executeWithUndo,
} from '../state';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Generator card types.
 */
export type GeneratorType =
  | 'arranger'
  | 'drum-machine'
  | 'sequencer'
  | 'melody'
  | 'arpeggiator'
  | 'bassline';

/**
 * Configuration for generator output.
 */
export interface GeneratorOutputConfig {
  /** Unique ID for this generator instance */
  readonly generatorId: string;
  /** Type of generator */
  readonly generatorType: GeneratorType;
  /** Output stream ID (created if doesn't exist) */
  readonly outputStreamId: EventStreamId;
  /** Whether output is currently enabled */
  readonly enabled: boolean;
  /** Whether generated events should auto-replace previous output */
  readonly autoReplace: boolean;
  /** Tag to identify generated events */
  readonly generatorTag: string;
}

/**
 * Metadata attached to generated events.
 */
export interface GeneratedEventMetadata {
  /** ID of the generator that created this event */
  readonly generatorId: string;
  /** Type of generator */
  readonly generatorType: GeneratorType;
  /** Whether event has been "frozen" (converted to user-editable) */
  readonly frozen: boolean;
  /** Original generator tag */
  readonly generatorTag: string;
  /** Generation timestamp */
  readonly generatedAt: number;
}

/**
 * Callback for generator output changes.
 */
export type GeneratorOutputCallback = (events: readonly Event<unknown>[]) => void;

// ============================================================================
// GENERATOR OUTPUT MANAGER
// ============================================================================

/**
 * Manages output from a generator card to the SharedEventStore.
 * 
 * Usage:
 * ```typescript
 * const output = new GeneratorOutputManager({
 *   generatorId: 'arranger-1',
 *   generatorType: 'arranger',
 *   outputStreamId: 'arranger-1-output',
 *   enabled: true,
 *   autoReplace: true,
 *   generatorTag: 'arranger-1',
 * });
 * 
 * // Write generated events
 * output.writeEvents(generatedEvents);
 * 
 * // Freeze output (convert to user-editable)
 * output.freezeOutput();
 * 
 * output.dispose();
 * ```
 */
export class GeneratorOutputManager {
  private config: GeneratorOutputConfig;
  private subscriptionId: SubscriptionId | null = null;
  private outputCallbacks = new Set<GeneratorOutputCallback>();
  private disposed = false;

  constructor(config: GeneratorOutputConfig) {
    this.config = config;

    // Ensure output stream exists
    const store = getSharedEventStore();
    if (!store.getStream(config.outputStreamId)) {
      store.createStream({
        id: config.outputStreamId,
        name: config.outputStreamId,
        events: [],
      });
    }

    // Subscribe to our own output for callbacks
    this.subscriptionId = store.subscribeToStream(config.outputStreamId, (events) => {
      for (const callback of this.outputCallbacks) {
        try {
          callback(events);
        } catch (e) {
          console.error('Generator output callback error:', e);
        }
      }
    });
  }

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================

  /**
   * Gets current configuration.
   */
  getConfig(): GeneratorOutputConfig {
    return this.config;
  }

  /**
   * Updates configuration.
   */
  setConfig(updates: Partial<GeneratorOutputConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Enables output.
   */
  enable(): void {
    this.config = { ...this.config, enabled: true };
  }

  /**
   * Disables output.
   */
  disable(): void {
    this.config = { ...this.config, enabled: false };
  }

  // ==========================================================================
  // WRITE OPERATIONS
  // ==========================================================================

  /**
   * Writes generated events to the output stream.
   * If autoReplace is true, clears previous generated events first.
   */
  writeEvents(events: readonly Event<unknown>[]): void {
    if (!this.config.enabled) return;

    const store = getSharedEventStore();
    const { outputStreamId, autoReplace } = this.config;

    // Tag events with generator metadata
    const taggedEvents = events.map(e => this.tagEvent(e));

    if (autoReplace) {
      // Remove previous generated events from this generator
      const existingEvents = store.getStream(outputStreamId)?.events ?? [];
      const nonGeneratedEvents = existingEvents.filter(
        e => !this.isOwnEvent(e)
      );

      // Replace with new events
      store.setStream(outputStreamId, [...nonGeneratedEvents, ...taggedEvents]);
    } else {
      // Just add new events
      store.addEvents(outputStreamId, taggedEvents);
    }
  }

  /**
   * Writes events with undo support.
   */
  writeEventsWithUndo(events: readonly Event<unknown>[], description?: string): void {
    if (!this.config.enabled) return;

    const store = getSharedEventStore();
    const { outputStreamId, generatorType } = this.config;

    const taggedEvents = events.map(e => this.tagEvent(e));
    const eventIds = taggedEvents.map(e => e.id as EventId);

    executeWithUndo({
      type: 'event:add',
      description: description ?? `Generate ${generatorType} events`,
      execute: () => {
        store.addEvents(outputStreamId, taggedEvents);
        return eventIds;
      },
      undo: (ids) => {
        store.removeEvents(outputStreamId, ids);
      },
      redo: () => {
        store.addEvents(outputStreamId, taggedEvents);
      },
    });
  }

  /**
   * Clears all events from this generator.
   */
  clearOutput(): void {
    const store = getSharedEventStore();
    const { outputStreamId } = this.config;

    const existingEvents = store.getStream(outputStreamId)?.events ?? [];
    const nonGeneratedEvents = existingEvents.filter(
      e => !this.isOwnEvent(e)
    );

    store.setStream(outputStreamId, nonGeneratedEvents);
  }

  /**
   * Clears output with undo support.
   */
  clearOutputWithUndo(): void {
    const store = getSharedEventStore();
    const { outputStreamId, generatorType } = this.config;

    const existingEvents = store.getStream(outputStreamId)?.events ?? [];
    const generatedEvents = existingEvents.filter(e => this.isOwnEvent(e));

    if (generatedEvents.length === 0) return;

    executeWithUndo({
      type: 'event:delete',
      description: `Clear ${generatorType} output`,
      execute: () => {
        const ids = generatedEvents.map(e => e.id as EventId);
        store.removeEvents(outputStreamId, ids);
        return generatedEvents;
      },
      undo: (deleted) => {
        store.addEvents(outputStreamId, deleted);
      },
      redo: () => {
        const ids = generatedEvents.map(e => e.id as EventId);
        store.removeEvents(outputStreamId, ids);
      },
    });
  }

  // ==========================================================================
  // FREEZE OPERATIONS
  // ==========================================================================

  /**
   * "Freezes" generated events, converting them to user-editable events.
   * This removes the generator tag and marks them as frozen.
   */
  freezeOutput(): void {
    const store = getSharedEventStore();
    const { outputStreamId } = this.config;

    store.updateStream(outputStreamId, (stream) => ({
      events: stream.events.map(e => {
        if (!this.isOwnEvent(e)) return e;
        return this.freezeEvent(e);
      })
    }));
  }

  /**
   * Freezes output with undo support.
   */
  freezeOutputWithUndo(): void {
    const store = getSharedEventStore();
    const { outputStreamId, generatorType } = this.config;

    const existingEvents = store.getStream(outputStreamId)?.events ?? [];
    const generatedEvents = existingEvents.filter(e => this.isOwnEvent(e));

    if (generatedEvents.length === 0) return;

    const frozenEvents = generatedEvents.map(e => this.freezeEvent(e));

    executeWithUndo({
      type: 'event:update',
      description: `Freeze ${generatorType} output`,
      execute: () => {
        store.updateStream(outputStreamId, (stream) => ({
          events: stream.events.map(e => {
            const frozen = frozenEvents.find(f => f.id === e.id);
            return frozen ?? e;
          })
        }));
        return generatedEvents;
      },
      undo: (originals) => {
        store.updateStream(outputStreamId, (stream) => ({
          events: stream.events.map(e => {
            const original = originals.find(o => o.id === e.id);
            return original ?? e;
          })
        }));
      },
      redo: () => {
        store.updateStream(outputStreamId, (stream) => ({
          events: stream.events.map(e => {
            const frozen = frozenEvents.find(f => f.id === e.id);
            return frozen ?? e;
          })
        }));
      },
    });
  }

  // ==========================================================================
  // QUERY
  // ==========================================================================

  /**
   * Gets all events from this generator's output stream.
   */
  getOutputEvents(): readonly Event<unknown>[] {
    const store = getSharedEventStore();
    return store.getStream(this.config.outputStreamId)?.events ?? [];
  }

  /**
   * Gets only the events generated by this generator.
   */
  getGeneratedEvents(): readonly Event<unknown>[] {
    return this.getOutputEvents().filter(e => this.isOwnEvent(e));
  }

  /**
   * Gets count of generated events.
   */
  getGeneratedEventCount(): number {
    return this.getGeneratedEvents().length;
  }

  /**
   * Checks if any events have been generated.
   */
  hasOutput(): boolean {
    return this.getGeneratedEventCount() > 0;
  }

  // ==========================================================================
  // SUBSCRIPTIONS
  // ==========================================================================

  /**
   * Subscribes to output changes.
   */
  onOutput(callback: GeneratorOutputCallback): () => void {
    this.outputCallbacks.add(callback);
    return () => {
      this.outputCallbacks.delete(callback);
    };
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  /**
   * Disposes the manager.
   */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    if (this.subscriptionId) {
      getSharedEventStore().unsubscribe(this.subscriptionId);
    }

    this.outputCallbacks.clear();
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  /**
   * Tags an event with generator metadata.
   */
  private tagEvent(event: Event<unknown>): Event<unknown> {
    const metadata: GeneratedEventMetadata = {
      generatorId: this.config.generatorId,
      generatorType: this.config.generatorType,
      frozen: false,
      generatorTag: this.config.generatorTag,
      generatedAt: Date.now(),
    };

    return updateEvent(event, {
      payload: {
        ...(event.payload as object),
        __generatorMetadata: metadata,
      },
    });
  }

  /**
   * Removes generator metadata (freezes event).
   */
  private freezeEvent(event: Event<unknown>): Event<unknown> {
    const payload = event.payload as Record<string, unknown>;
    const metadata = payload.__generatorMetadata as GeneratedEventMetadata | undefined;

    if (!metadata) return event;

    const frozenMetadata: GeneratedEventMetadata = {
      ...metadata,
      frozen: true,
    };

    return updateEvent(event, {
      payload: {
        ...payload,
        __generatorMetadata: frozenMetadata,
      },
    });
  }

  /**
   * Checks if event was generated by this generator.
   */
  private isOwnEvent(event: Event<unknown>): boolean {
    const payload = event.payload as Record<string, unknown>;
    const metadata = payload.__generatorMetadata as GeneratedEventMetadata | undefined;

    if (!metadata) return false;
    if (metadata.frozen) return false;

    return metadata.generatorId === this.config.generatorId;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Creates a generator output manager.
 */
export function createGeneratorOutput(config: GeneratorOutputConfig): GeneratorOutputManager {
  return new GeneratorOutputManager(config);
}

/**
 * Quick helper to write events to a stream as generated.
 */
export function writeGeneratedEvents(
  streamId: EventStreamId,
  events: readonly Event<unknown>[],
  generatorId: string,
  generatorType: GeneratorType
): void {
  const output = new GeneratorOutputManager({
    generatorId,
    generatorType,
    outputStreamId: streamId,
    enabled: true,
    autoReplace: false,
    generatorTag: generatorId,
  });

  output.writeEvents(events);
  output.dispose();
}

/**
 * Helper to freeze all generated events in a stream.
 */
export function freezeAllGeneratedEvents(streamId: EventStreamId): void {
  const store = getSharedEventStore();

  store.updateStream(streamId, (stream) => ({
    events: stream.events.map(e => {
      const payload = e.payload as Record<string, unknown>;
      const metadata = payload.__generatorMetadata as GeneratedEventMetadata | undefined;

      if (!metadata || metadata.frozen) return e;

      return updateEvent(e, {
        payload: {
          ...payload,
          __generatorMetadata: { ...metadata, frozen: true },
        },
      });
    })
  }));
}

/**
 * Checks if an event is generated (not user-created).
 */
export function isGeneratedEvent(event: Event<unknown>): boolean {
  const payload = event.payload as Record<string, unknown>;
  const metadata = payload.__generatorMetadata as GeneratedEventMetadata | undefined;
  return metadata !== undefined && !metadata.frozen;
}

/**
 * Gets the generator ID that created an event.
 */
export function getEventGeneratorId(event: Event<unknown>): string | undefined {
  const payload = event.payload as Record<string, unknown>;
  const metadata = payload.__generatorMetadata as GeneratedEventMetadata | undefined;
  return metadata?.generatorId;
}
