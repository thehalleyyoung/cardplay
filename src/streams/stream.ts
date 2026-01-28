/**
 * @fileoverview Stream<E> type for ordered collections of events.
 * 
 * A Stream maintains events in temporal order (sorted by start tick).
 * All operations preserve this ordering invariant.
 * 
 * @module @cardplay/core/streams/stream
 * @see cardplay2.md Section 1.2 - Stream<E>
 */

import {
  type Tick,
  type TickDuration,
  asTick,
  asTickDuration,
} from '../types/primitives';
import {
  type Event,
  type EventId,
  eventEnd,
  updateEvent,
} from '../types';
import {
  eventOverlaps,
  shiftEvent,
  stretchEvent,
  quantizeEvent,
  trimEvent,
  type StretchAnchor,
  type QuantizeOptions,
} from '../events/operations';

// ============================================================================
// TYPES
// ============================================================================

/**
 * A Stream is an ordered collection of events.
 * 
 * Events are always sorted by start tick.
 * The Stream type preserves the event type parameter.
 * 
 * @template E - Event type (must extend Event<unknown>)
 */
export interface Stream<E extends Event<unknown>> {
  /** Events sorted by start tick */
  readonly events: readonly E[];
  /** Stream metadata */
  readonly meta?: StreamMeta;
}

/**
 * Stream metadata.
 */
export interface StreamMeta {
  /** Human-readable name */
  readonly name?: string;
  /** Display color */
  readonly color?: string;
  /** Source identifier */
  readonly sourceId?: string;
}

/**
 * Alias for a stream of events with a specific payload type.
 */
export type EventStream<P> = Stream<Event<P>>;

// ============================================================================
// FACTORIES
// ============================================================================

/**
 * Creates a new Stream from an array of events.
 * 
 * Events are automatically sorted by start tick.
 * 
 * @template E - Event type
 * @param events - Array of events (will be sorted)
 * @param meta - Optional stream metadata
 * @returns A new Stream
 */
export function createStream<E extends Event<unknown>>(
  events: readonly E[],
  meta?: StreamMeta
): Stream<E> {
  // Sort by start tick, then by ID for stability
  const sorted = [...events].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  
  const stream: Stream<E> = { events: sorted };
  if (meta !== undefined) {
    (stream as { meta: StreamMeta }).meta = meta;
  }
  
  return Object.freeze(stream);
}

/**
 * Creates an empty stream.
 */
export function emptyStream<E extends Event<unknown>>(meta?: StreamMeta): Stream<E> {
  return createStream<E>([], meta);
}

// ============================================================================
// BASIC OPERATIONS
// ============================================================================

/**
 * Appends an event to a stream, maintaining sort order.
 */
export function streamAppend<E extends Event<unknown>>(
  stream: Stream<E>,
  event: E
): Stream<E> {
  return createStream([...stream.events, event], stream.meta);
}

/**
 * Inserts an event at the correct position in a stream.
 */
export function streamInsert<E extends Event<unknown>>(
  stream: Stream<E>,
  event: E
): Stream<E> {
  // Binary search for insertion point
  const events = stream.events;
  let left = 0;
  let right = events.length;
  
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (events[mid]!.start <= event.start) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  
  const newEvents = [...events.slice(0, left), event, ...events.slice(left)];
  return createStream(newEvents, stream.meta);
}

/**
 * Removes an event by ID from a stream.
 */
export function streamRemove<E extends Event<unknown>>(
  stream: Stream<E>,
  id: EventId
): Stream<E> {
  const events = stream.events.filter(e => e.id !== id);
  return createStream(events, stream.meta);
}

/**
 * Updates an event in a stream by ID using a mapper function.
 */
export function streamUpdate<E extends Event<unknown>>(
  stream: Stream<E>,
  id: EventId,
  mapper: (event: E) => E
): Stream<E> {
  const events = stream.events.map(e => 
    e.id === id ? mapper(e) : e
  );
  return createStream(events, stream.meta);
}

/**
 * Filters events in a stream by a predicate.
 */
export function streamFilter<E extends Event<unknown>>(
  stream: Stream<E>,
  predicate: (event: E, index: number) => boolean
): Stream<E> {
  const events = stream.events.filter(predicate);
  return createStream(events, stream.meta);
}

/**
 * Maps events in a stream, preserving temporal order.
 */
export function streamMap<E extends Event<unknown>, F extends Event<unknown>>(
  stream: Stream<E>,
  mapper: (event: E, index: number) => F
): Stream<F> {
  const events = stream.events.map(mapper);
  return createStream(events, stream.meta);
}

/**
 * FlatMaps events in a stream.
 */
export function streamFlatMap<E extends Event<unknown>, F extends Event<unknown>>(
  stream: Stream<E>,
  mapper: (event: E, index: number) => readonly F[]
): Stream<F> {
  const events = stream.events.flatMap(mapper);
  return createStream(events, stream.meta);
}

// ============================================================================
// TEMPORAL OPERATIONS
// ============================================================================

/**
 * Slices a stream to a tick range.
 * 
 * Includes events that overlap with the range.
 */
export function streamSlice<E extends Event<unknown>>(
  stream: Stream<E>,
  start: Tick,
  end: Tick
): Stream<E> {
  const events = stream.events.filter(e => {
    const eEnd = eventEnd(e);
    return e.start < end && eEnd > start;
  });
  return createStream(events, stream.meta);
}

/**
 * Merges two streams, maintaining sort order.
 */
export function streamMerge<E extends Event<unknown>>(
  a: Stream<E>,
  b: Stream<E>
): Stream<E> {
  return createStream([...a.events, ...b.events], a.meta);
}

/**
 * Splits a stream by a predicate into two streams.
 */
export function streamSplit<E extends Event<unknown>>(
  stream: Stream<E>,
  predicate: (event: E, index: number) => boolean
): [Stream<E>, Stream<E>] {
  const passing: E[] = [];
  const failing: E[] = [];
  
  stream.events.forEach((e, i) => {
    if (predicate(e, i)) {
      passing.push(e);
    } else {
      failing.push(e);
    }
  });
  
  return [
    createStream(passing, stream.meta),
    createStream(failing, stream.meta),
  ];
}

/**
 * Quantizes all events in a stream to a grid.
 */
export function streamQuantize<E extends Event<unknown>>(
  stream: Stream<E>,
  options: QuantizeOptions
): Stream<E> {
  const events = stream.events.map(e => quantizeEvent(e, options) as E);
  return createStream(events, stream.meta);
}

/**
 * Shifts all events in a stream by a tick delta.
 */
export function streamShift<E extends Event<unknown>>(
  stream: Stream<E>,
  delta: number,
  clampToZero = true
): Stream<E> {
  const events = stream.events.map(e => shiftEvent(e, delta, clampToZero) as E);
  return createStream(events, stream.meta);
}

/**
 * Stretches all events in a stream.
 */
export function streamStretch<E extends Event<unknown>>(
  stream: Stream<E>,
  factor: number,
  anchor: StretchAnchor = 'start',
  anchorTick?: Tick
): Stream<E> {
  const streamAnchor = anchorTick ?? (stream.events[0]?.start ?? asTick(0));
  
  const events = stream.events.map(e => {
    // First stretch the event itself
    const stretched = stretchEvent(e, factor, anchor);
    
    // Then adjust position relative to anchor
    const relativePos = e.start - streamAnchor;
    const newRelativePos = Math.round(relativePos * factor);
    const newStart = asTick(Math.max(0, streamAnchor + newRelativePos));
    
    return updateEvent(stretched, { start: newStart }) as E;
  });
  
  return createStream(events, stream.meta);
}

/**
 * Reverses the temporal order of events in a stream.
 * 
 * Events are mirrored around the stream's midpoint.
 */
export function streamReverse<E extends Event<unknown>>(
  stream: Stream<E>
): Stream<E> {
  if (stream.events.length === 0) return stream;
  
  const bounds = streamBounds(stream);
  if (!bounds) return stream;
  
  const { start, end } = bounds;
  
  const events = stream.events.map(e => {
    // Mirror: new_start = end - (event_end - start)
    const eEnd = eventEnd(e);
    const newStart = asTick(Math.max(0, end - (eEnd - start)));
    return updateEvent(e, { start: newStart }) as E;
  });
  
  return createStream(events, stream.meta);
}

// ============================================================================
// PITCH OPERATIONS
// ============================================================================

/**
 * Payload with pitch for pitch operations.
 */
interface PitchPayload {
  pitch: number;
}

/**
 * Retrogrades pitch content (reverses pitch order).
 * 
 * Keeps event positions but swaps pitches.
 */
export function streamRetrograde<P extends PitchPayload>(
  stream: Stream<Event<P>>
): Stream<Event<P>> {
  const events = stream.events;
  if (events.length <= 1) return stream;
  
  // Extract pitches in reverse order
  const pitches = events.map(e => e.payload.pitch).reverse();
  
  // Apply reversed pitches to events
  const retrograded = events.map((e, i) => 
    updateEvent(e, { 
      payload: { ...e.payload, pitch: pitches[i]! } 
    })
  );
  
  return createStream(retrograded, stream.meta);
}

/**
 * Inverts pitches around an axis.
 */
export function streamInvert<P extends PitchPayload>(
  stream: Stream<Event<P>>,
  axis?: number
): Stream<Event<P>> {
  if (stream.events.length === 0) return stream;
  
  // Default axis: midpoint of pitch range
  let invertAxis = axis;
  if (invertAxis === undefined) {
    const pitches = stream.events.map(e => e.payload.pitch);
    const min = Math.min(...pitches);
    const max = Math.max(...pitches);
    invertAxis = (min + max) / 2;
  }
  
  const events = stream.events.map(e => {
    const newPitch = Math.round(2 * invertAxis! - e.payload.pitch);
    return updateEvent(e, { 
      payload: { ...e.payload, pitch: newPitch } 
    });
  });
  
  return createStream(events, stream.meta);
}

/**
 * Transposes all pitches by an interval.
 */
export function streamTranspose<P extends PitchPayload>(
  stream: Stream<Event<P>>,
  interval: number
): Stream<Event<P>> {
  const events = stream.events.map(e => 
    updateEvent(e, { 
      payload: { ...e.payload, pitch: e.payload.pitch + interval } 
    })
  );
  return createStream(events, stream.meta);
}

// ============================================================================
// QUERY OPERATIONS
// ============================================================================

/**
 * Gets the temporal bounds of a stream.
 */
export function streamBounds<E extends Event<unknown>>(
  stream: Stream<E>
): { start: Tick; end: Tick } | null {
  if (stream.events.length === 0) return null;
  
  const start = stream.events[0]!.start;
  let end = start;
  
  for (const event of stream.events) {
    const eEnd = eventEnd(event);
    if (eEnd > end) end = eEnd;
  }
  
  return { start, end: asTick(end) };
}

/**
 * Gets the total duration of a stream.
 */
export function streamDuration<E extends Event<unknown>>(
  stream: Stream<E>
): TickDuration {
  const bounds = streamBounds(stream);
  if (!bounds) return asTickDuration(0);
  return asTickDuration(bounds.end - bounds.start);
}

/**
 * Gets events at a specific tick.
 */
export function streamEventsAt<E extends Event<unknown>>(
  stream: Stream<E>,
  tick: Tick,
  inclusive = true
): readonly E[] {
  return stream.events.filter(e => {
    const end = eventEnd(e);
    if (inclusive) {
      return tick >= e.start && tick <= end;
    }
    return tick >= e.start && tick < end;
  });
}

/**
 * Finds overlapping events in a stream.
 */
export function streamFindOverlapping<E extends Event<unknown>>(
  stream: Stream<E>
): readonly [E, E][] {
  const overlaps: [E, E][] = [];
  const events = stream.events;
  
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i]!;
      const b = events[j]!;
      
      // Early exit: if b starts after a ends, no more overlaps with a
      if (b.start >= eventEnd(a)) break;
      
      if (eventOverlaps(a, b)) {
        overlaps.push([a, b]);
      }
    }
  }
  
  return overlaps;
}

/**
 * Gets an event by ID.
 */
export function streamGetById<E extends Event<unknown>>(
  stream: Stream<E>,
  id: EventId
): E | undefined {
  return stream.events.find(e => e.id === id);
}

/**
 * Checks if a stream is empty.
 */
export function streamIsEmpty<E extends Event<unknown>>(
  stream: Stream<E>
): boolean {
  return stream.events.length === 0;
}

/**
 * Gets the number of events in a stream.
 */
export function streamLength<E extends Event<unknown>>(
  stream: Stream<E>
): number {
  return stream.events.length;
}

// ============================================================================
// TRIMMING AND NORMALIZATION
// ============================================================================

/**
 * Trims all events in a stream to fit within a range.
 */
export function streamTrim<E extends Event<unknown>>(
  stream: Stream<E>,
  start: Tick,
  end: Tick
): Stream<E> {
  const events: E[] = [];
  
  for (const event of stream.events) {
    const trimmed = trimEvent(event, start, end);
    if (trimmed !== null) {
      events.push(trimmed as E);
    }
  }
  
  return createStream(events, stream.meta);
}

/**
 * Normalizes a stream so it starts at tick 0.
 */
export function streamNormalize<E extends Event<unknown>>(
  stream: Stream<E>
): Stream<E> {
  const bounds = streamBounds(stream);
  if (!bounds || bounds.start === 0) return stream;
  
  return streamShift(stream, -bounds.start);
}

// ============================================================================
// GROUPING
// ============================================================================

/**
 * Groups events by a key function.
 */
export function streamGroupBy<E extends Event<unknown>, K extends string | number>(
  stream: Stream<E>,
  keyFn: (event: E) => K
): Map<K, Stream<E>> {
  const groups = new Map<K, E[]>();
  
  for (const event of stream.events) {
    const key = keyFn(event);
    const group = groups.get(key);
    if (group) {
      group.push(event);
    } else {
      groups.set(key, [event]);
    }
  }
  
  const result = new Map<K, Stream<E>>();
  for (const [key, events] of groups) {
    result.set(key, createStream(events, stream.meta));
  }
  
  return result;
}

/**
 * Groups events by their kind.
 */
export function streamGroupByKind<E extends Event<unknown>>(
  stream: Stream<E>
): Map<string, Stream<E>> {
  return streamGroupBy(stream, e => e.kind as string);
}
