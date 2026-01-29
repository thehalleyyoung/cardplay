/**
 * @fileoverview Generator Actions
 * 
 * Actions for working with generators in assisted/directed boards.
 * G075-G078: Generate, Regenerate, Freeze, Humanize, Quantize.
 * 
 * @module @cardplay/boards/generators/actions
 */

import type { EventStreamId, ClipId } from '../../state/types';
import type { Event } from '../../types/event';
import { createEvent } from '../../types/event';
import { asTick, asTickDuration } from '../../types/primitives';
import { getSharedEventStore } from '../../state/event-store';
import { getClipRegistry } from '../../state/clip-registry';
import { getUndoStack } from '../../state/undo-stack';

// ============================================================================
// GENERATOR RESULT
// ============================================================================

/**
 * Result of a generation action.
 */
export interface GenerationResult {
  /** Stream that was generated into */
  streamId: EventStreamId;
  
  /** Clip that was created/updated (if applicable) */
  clipId?: ClipId;
  
  /** Number of events generated */
  eventCount: number;
  
  /** Event IDs that were generated */
  eventIds: string[];
  
  /** Whether action was successful */
  success: boolean;
  
  /** Error message if failed */
  error?: string;
}

// ============================================================================
// G075: GENERATE INTO NEW CLIP
// ============================================================================

/**
 * Options for generating into a new clip.
 */
export interface GenerateIntoNewClipOptions {
  /** Track/slot to place the clip */
  trackId: string;
  sceneId?: string;
  
  /** Clip name */
  clipName?: string;
  
  /** Generator to use */
  generator: string;
  
  /** Generator parameters */
  params?: Record<string, unknown>;
  
  /** Length in ticks */
  length: number;
}

/**
 * G075: Generates events into a new clip.
 * Creates a new stream + clip and assigns to the specified track/slot.
 */
export async function generateIntoNewClip(
  options: GenerateIntoNewClipOptions
): Promise<GenerationResult> {
  const {
    // trackId and sceneId are for future use when we have session integration
    clipName = 'Generated Clip',
    generator,
    params = {},
    length,
  } = options;

  try {
    const store = getSharedEventStore();
    const registry = getClipRegistry();

    // Create new stream
    const streamId = store.createStream(clipName);

    // Generate events (stub - would call actual generator)
    const events = await generateEvents(generator, params, length);
    
    // Mark events as generated
    const markedEvents = markEventsAsGenerated(events, generator);

    // Add events to stream with undo
    getUndoStack().push({
      type: 'batch',
      description: `Generate ${generator} clip`,
      redo: () => {
        markedEvents.forEach(event => store.addEvents(streamId, [event]));
      },
      undo: () => {
        markedEvents.forEach(event => store.removeEvents(streamId, [event.id]));
      },
    });

    // Create clip
    const clip = registry.createClip({
      streamId,
      name: clipName,
      duration: asTick(length),
      loop: true,
      loopStart: asTick(0),
      loopEnd: asTick(length),
    });

    return {
      streamId,
      clipId: clip.id,
      eventCount: markedEvents.length,
      eventIds: markedEvents.map(e => e.id),
      success: true,
    };
  } catch (error) {
    return {
      streamId: '' as EventStreamId,
      eventCount: 0,
      eventIds: [],
      success: false,
      error: error instanceof Error ? error.message : 'Generation failed',
    };
  }
}

// ============================================================================
// G076: REGENERATE
// ============================================================================

/**
 * Options for regenerating a clip/stream.
 */
export interface RegenerateOptions {
  /** Stream to regenerate */
  streamId: EventStreamId;
  
  /** Generator to use (from event metadata if not specified) */
  generator?: string;
  
  /** Generator parameters */
  params?: Record<string, unknown>;
  
  /** Preserve length */
  preserveLength?: boolean;
  
  /** Replace all events or only generated ones */
  replaceMode?: 'all' | 'generated-only';
}

/**
 * G076: Regenerates events in a stream.
 * Replaces generated events with new ones (with undo support).
 */
export async function regenerateStream(
  options: RegenerateOptions
): Promise<GenerationResult> {
  const {
    streamId,
    generator,
    params = {},
    preserveLength = true,
    replaceMode = 'generated-only',
  } = options;

  try {
    const store = getSharedEventStore();
    const stream = store.getStream(streamId);

    if (!stream) {
      return {
        streamId,
        eventCount: 0,
        eventIds: [],
        success: false,
        error: 'Stream not found',
      };
    }

    // Find events to replace
    const eventsToReplace = replaceMode === 'all'
      ? stream.events
      : stream.events.filter(e => {
          const meta = e.meta as Record<string, unknown> | undefined;
          return meta?.generated === true;
        });

    // Determine generator from existing events if not specified
    const generatorToUse = generator ?? inferGenerator(eventsToReplace);

    // Calculate length
    const length = preserveLength
      ? Math.max(...stream.events.map(e => e.start + (e.duration ?? 0)))
      : undefined;

    // Generate new events
    const newEvents = await generateEvents(generatorToUse, params, length);
    const markedEvents = markEventsAsGenerated(newEvents, generatorToUse);

    // Replace with undo
    
    getUndoStack().push({
      type: 'batch',
      description: `Regenerate with ${generatorToUse}`,
      redo: () => {
        // Remove old events
        store.removeEvents(streamId, eventsToReplace.map(e => e.id));
        // Add new events
        markedEvents.forEach(event => store.addEvents(streamId, [event]));
      },
      undo: () => {
        // Remove new events
        store.removeEvents(streamId, markedEvents.map(e => e.id));
        // Restore old events
        eventsToReplace.forEach(event => store.addEvents(streamId, [event]));
      },
    });

    return {
      streamId,
      eventCount: markedEvents.length,
      eventIds: markedEvents.map(e => e.id),
      success: true,
    };
  } catch (error) {
    return {
      streamId,
      eventCount: 0,
      eventIds: [],
      success: false,
      error: error instanceof Error ? error.message : 'Regeneration failed',
    };
  }
}

// ============================================================================
// G077: FREEZE
// ============================================================================

/**
 * Options for freezing events.
 */
export interface FreezeOptions {
  /** Stream containing events */
  streamId: EventStreamId;
  
  /** Specific event IDs to freeze (or all generated if not specified) */
  eventIds?: string[];
  
  /** Whether to convert to fully manual (remove generated flag) */
  convertToManual?: boolean;
}

/**
 * G077: Freezes generated events.
 * Marks events as frozen (won't be regenerated) or converts to manual.
 */
export function freezeEvents(options: FreezeOptions): GenerationResult {
  const {
    streamId,
    eventIds,
    convertToManual = false,
  } = options;

  try {
    const store = getSharedEventStore();
    const stream = store.getStream(streamId);

    if (!stream) {
      return {
        streamId,
        eventCount: 0,
        eventIds: [],
        success: false,
        error: 'Stream not found',
      };
    }

    // Find events to freeze
    const eventsToFreeze = eventIds
      ? stream.events.filter(e => eventIds.includes(e.id))
      : stream.events.filter(e => {
          const meta = e.meta as Record<string, unknown> | undefined;
          return meta?.generated === true;
        });

    // Mark as frozen or convert to manual
    const frozenEvents = convertToManual
      ? markEventsAsManual(eventsToFreeze)
      : markEventsAsFrozen(eventsToFreeze);

    // Update with undo
    getUndoStack().push({
      type: 'batch',
      description: convertToManual ? 'Convert to manual' : 'Freeze events',
      redo: () => {
        frozenEvents.forEach(event => {
          store.removeEvents(streamId, [event.id]);
          store.addEvents(streamId, [event]);
        });
      },
      undo: () => {
        eventsToFreeze.forEach(event => {
          store.removeEvents(streamId, [event.id]);
          store.addEvents(streamId, [event]);
        });
      },
    });

    return {
      streamId,
      eventCount: frozenEvents.length,
      eventIds: frozenEvents.map(e => e.id),
      success: true,
    };
  } catch (error) {
    return {
      streamId,
      eventCount: 0,
      eventIds: [],
      success: false,
      error: error instanceof Error ? error.message : 'Freeze failed',
    };
  }
}

// ============================================================================
// G078: HUMANIZE & QUANTIZE
// ============================================================================

/**
 * Options for humanizing events.
 */
export interface HumanizeOptions {
  /** Stream containing events */
  streamId: EventStreamId;
  
  /** Event IDs to humanize (or all if not specified) */
  eventIds?: string[];
  
  /** Timing variance in ticks */
  timingVariance?: number;
  
  /** Velocity variance (0-127) */
  velocityVariance?: number;
  
  /** Duration variance as percentage */
  durationVariance?: number;
}

/**
 * G078: Humanizes events by adding subtle timing/velocity variations.
 */
export function humanizeEvents(options: HumanizeOptions): GenerationResult {
  const {
    streamId,
    eventIds,
    timingVariance = 5,
    velocityVariance = 10,
    durationVariance = 0.05,
  } = options;

  try {
    const store = getSharedEventStore();
    const stream = store.getStream(streamId);

    if (!stream) {
      return {
        streamId,
        eventCount: 0,
        eventIds: [],
        success: false,
        error: 'Stream not found',
      };
    }

    // Find events to humanize
    const eventsToHumanize = eventIds
      ? stream.events.filter(e => eventIds.includes(e.id))
      : stream.events;

    // Apply humanization with proper typing
    const humanizedEvents = eventsToHumanize.map(event => {
      const payload = event.payload as any;
      return createEvent({
        id: event.id,
        kind: event.kind,
        start: asTick(event.start + Math.floor((Math.random() - 0.5) * timingVariance * 2)),
        duration: asTickDuration(event.duration + Math.floor((Math.random() - 0.5) * event.duration * durationVariance * 2)),
        payload: {
          ...payload,
          velocity: payload?.velocity
            ? Math.max(1, Math.min(127, payload.velocity + Math.floor((Math.random() - 0.5) * velocityVariance * 2)))
            : payload?.velocity,
        },
        ...(event.meta && { meta: event.meta }),
      });
    });

    // Update with undo
    getUndoStack().push({
      type: 'batch',
      description: 'Humanize events',
      redo: () => {
        humanizedEvents.forEach(event => {
          store.removeEvents(streamId, [event.id]);
          store.addEvents(streamId, [event]);
        });
      },
      undo: () => {
        eventsToHumanize.forEach(event => {
          store.removeEvents(streamId, [event.id]);
          store.addEvents(streamId, [event]);
        });
      },
    });

    return {
      streamId,
      eventCount: humanizedEvents.length,
      eventIds: humanizedEvents.map(e => e.id),
      success: true,
    };
  } catch (error) {
    return {
      streamId,
      eventCount: 0,
      eventIds: [],
      success: false,
      error: error instanceof Error ? error.message : 'Humanize failed',
    };
  }
}

/**
 * Options for quantizing events.
 */
export interface QuantizeOptions {
  /** Stream containing events */
  streamId: EventStreamId;
  
  /** Event IDs to quantize (or all if not specified) */
  eventIds?: string[];
  
  /** Quantize grid in ticks */
  gridSize: number;
  
  /** Strength (0-1, where 1 = snap fully to grid) */
  strength?: number;
}

/**
 * G078: Quantizes events to a rhythmic grid.
 */
export function quantizeEvents(options: QuantizeOptions): GenerationResult {
  const {
    streamId,
    eventIds,
    gridSize,
    strength = 1.0,
  } = options;

  try {
    const store = getSharedEventStore();
    const stream = store.getStream(streamId);

    if (!stream) {
      return {
        streamId,
        eventCount: 0,
        eventIds: [],
        success: false,
        error: 'Stream not found',
      };
    }

    // Find events to quantize
    const eventsToQuantize = eventIds
      ? stream.events.filter(e => eventIds.includes(e.id))
      : stream.events;

    // Apply quantization
    const quantizedEvents = eventsToQuantize.map(event => {
      const nearestGrid = Math.round(event.start / gridSize) * gridSize;
      const offset = nearestGrid - event.start;
      const newStart = event.start + offset * strength;
      
      return createEvent({
        id: event.id,
        kind: event.kind,
        start: asTick(Math.round(newStart)),
        duration: event.duration,
        payload: event.payload,
        ...(event.meta && { meta: event.meta }),
      });
    });

    // Update with undo
    getUndoStack().push({
      type: 'batch',
      description: 'Quantize events',
      redo: () => {
        quantizedEvents.forEach(event => {
          store.removeEvents(streamId, [event.id]);
          store.addEvents(streamId, [event]);
        });
      },
      undo: () => {
        eventsToQuantize.forEach(event => {
          store.removeEvents(streamId, [event.id]);
          store.addEvents(streamId, [event]);
        });
      },
    });

    return {
      streamId,
      eventCount: quantizedEvents.length,
      eventIds: quantizedEvents.map(e => e.id),
      success: true,
    };
  } catch (error) {
    return {
      streamId,
      eventCount: 0,
      eventIds: [],
      success: false,
      error: error instanceof Error ? error.message : 'Quantize failed',
    };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Stub for actual event generation (would integrate with generator system).
 */
async function generateEvents(
  _generator: string,
  _params: Record<string, unknown>,
  _length?: number
): Promise<Event<unknown>[]> {
  // TODO: Integrate with actual generator system
  // For now, return empty array as stub
  return [];
}

/**
 * Infers the generator name from event metadata.
 */
function inferGenerator(events: readonly Event<unknown>[]): string {
  for (const event of events) {
    const meta = event.meta as Record<string, unknown> | undefined;
    if (meta?.generator && typeof meta.generator === 'string') {
      return meta.generator;
    }
  }
  return 'default';
}

/**
 * Marks events as generated (stub - delegates to event-styling).
 */
function markEventsAsGenerated(events: readonly Event<unknown>[], generator: string): Event<unknown>[] {
  return events.map(event => createEvent({
    id: event.id,
    kind: event.kind,
    start: event.start,
    duration: event.duration,
    payload: event.payload,
    meta: {
      ...(event.meta ?? {}),
      label: `Generated by ${generator}`,
      sourceCardId: generator,
    },
  }));
}

/**
 * Marks events as frozen (stub - delegates to event-styling).
 */
function markEventsAsFrozen(events: readonly Event<unknown>[]): Event<unknown>[] {
  return events.map(event => createEvent({
    id: event.id,
    kind: event.kind,
    start: event.start,
    duration: event.duration,
    payload: event.payload,
    meta: {
      ...(event.meta ?? {}),
      label: `${event.meta?.label ?? 'Event'} (frozen)`,
    },
  }));
}

/**
 * Marks events as manual (stub - delegates to event-styling).
 */
function markEventsAsManual(events: readonly Event<unknown>[]): Event<unknown>[] {
  return events.map(event => {
    // Create clean meta without generator-specific fields
    const cleanMeta: Record<string, unknown> = {};
    const source = event.meta;
    if (source?.color) (cleanMeta as any).color = source.color;
    if (source?.author) (cleanMeta as any).author = source.author;
    if (source?.lineage) (cleanMeta as any).lineage = source.lineage;
    
    return createEvent({
      id: event.id,
      kind: event.kind,
      start: event.start,
      duration: event.duration,
      payload: event.payload,
      ...(Object.keys(cleanMeta).length > 0 && { meta: cleanMeta }),
    });
  });
}
