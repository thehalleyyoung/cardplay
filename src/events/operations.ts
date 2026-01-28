/**
 * @fileoverview Event operations for temporal manipulations.
 * 
 * @module @cardplay/core/events/operations
 * @see cardplay2.md Section 1.1
 */

import {
  type Tick,
  type TickDuration,
  type QuantizeMode,
  asTick,
  asTickDuration,
  quantizeTick,
} from '../types/primitives';
import { type Event, createEvent, updateEvent, eventEnd } from '../types/event';

// ============================================================================
// TEMPORAL QUERIES
// ============================================================================

/**
 * Checks if two events overlap temporally.
 */
export function eventOverlaps<P>(a: Event<P>, b: Event<P>): boolean {
  const aEnd = eventEnd(a);
  const bEnd = eventEnd(b);
  return a.start < bEnd && aEnd > b.start;
}

/**
 * Checks if event A contains event B.
 */
export function eventContains<P>(a: Event<P>, b: Event<P>): boolean {
  const aEnd = eventEnd(a);
  const bEnd = eventEnd(b);
  return a.start <= b.start && aEnd >= bEnd;
}

/**
 * Checks if an event contains a tick.
 */
export function eventContainsTick<P>(event: Event<P>, tick: Tick, inclusive = true): boolean {
  const end = eventEnd(event);
  if (inclusive) {
    return tick >= event.start && tick <= end;
  }
  return tick >= event.start && tick < end;
}

/**
 * Gets the overlap duration between two events.
 */
export function getOverlapDuration<P>(a: Event<P>, b: Event<P>): TickDuration {
  if (!eventOverlaps(a, b)) return asTickDuration(0);
  
  const start = Math.max(a.start, b.start);
  const end = Math.min(eventEnd(a), eventEnd(b));
  return asTickDuration(end - start);
}

/**
 * Gets the gap between two events.
 */
export function getEventGap<P>(a: Event<P>, b: Event<P>): TickDuration {
  const aEnd = eventEnd(a);
  const bEnd = eventEnd(b);
  
  if (aEnd <= b.start) {
    return asTickDuration(b.start - aEnd);
  }
  if (bEnd <= a.start) {
    return asTickDuration(a.start - bEnd);
  }
  return asTickDuration(0); // Overlapping
}

/**
 * Checks if two events are adjacent (no gap, no overlap).
 */
export function eventsAdjacent<P>(a: Event<P>, b: Event<P>): boolean {
  return eventEnd(a) === b.start || eventEnd(b) === a.start;
}

// ============================================================================
// SPLIT OPERATION
// ============================================================================

/**
 * Splits an event at a tick position.
 */
export function splitEvent<P>(
  event: Event<P>,
  splitTick: Tick
): [Event<P>, Event<P>] {
  if (splitTick <= event.start || splitTick >= eventEnd(event)) {
    throw new RangeError(`Split tick ${splitTick} must be within event bounds [${event.start}, ${eventEnd(event)})`);
  }
  
  const leftDuration = asTickDuration(splitTick - event.start);
  const rightDuration = asTickDuration(eventEnd(event) - splitTick);
  
  const left = createEvent({
    kind: event.kind,
    start: event.start,
    duration: leftDuration,
    payload: event.payload,
    ...(event.meta !== undefined && { meta: event.meta }),
    ...(event.tags !== undefined && { tags: event.tags }),
  });
  
  const right = createEvent({
    kind: event.kind,
    start: splitTick,
    duration: rightDuration,
    payload: event.payload,
    ...(event.meta !== undefined && { meta: event.meta }),
    ...(event.tags !== undefined && { tags: event.tags }),
  });
  
  return [left, right];
}

// ============================================================================
// MERGE OPERATION
// ============================================================================

/**
 * Merges two adjacent events with compatible payloads.
 */
export function mergeEvents<P>(
  a: Event<P>,
  b: Event<P>,
  payloadMerger?: (a: P, b: P) => P
): Event<P> {
  // Ensure a comes before b
  const [first, second] = a.start <= b.start ? [a, b] : [b, a];
  
  // Check adjacency
  if (!eventsAdjacent(first, second)) {
    throw new Error('Events must be adjacent to merge');
  }
  
  // Check same kind
  if (first.kind !== second.kind) {
    throw new Error('Events must have the same kind to merge');
  }
  
  const mergedPayload = payloadMerger
    ? payloadMerger(first.payload, second.payload)
    : first.payload;
  
  return createEvent({
    kind: first.kind,
    start: first.start,
    duration: asTickDuration(first.duration + second.duration),
    payload: mergedPayload,
    ...(first.meta !== undefined && { meta: first.meta }),
    ...(first.tags !== undefined && { tags: first.tags }),
  });
}

// ============================================================================
// STRETCH OPERATION
// ============================================================================

/**
 * Stretch anchor points.
 */
export type StretchAnchor = 'start' | 'center' | 'end';

/**
 * Stretches an event by a factor.
 */
export function stretchEvent<P>(
  event: Event<P>,
  factor: number,
  anchor: StretchAnchor = 'start'
): Event<P> {
  if (factor <= 0) {
    throw new RangeError(`Stretch factor must be positive, got ${factor}`);
  }
  
  const newDuration = asTickDuration(Math.max(1, Math.round(event.duration * factor)));
  const durationDelta = newDuration - event.duration;
  
  let newStart: Tick;
  switch (anchor) {
    case 'start':
      newStart = event.start;
      break;
    case 'center':
      newStart = asTick(Math.max(0, event.start - Math.floor(durationDelta / 2)));
      break;
    case 'end':
      newStart = asTick(Math.max(0, event.start - durationDelta));
      break;
  }
  
  return updateEvent(event, { start: newStart, duration: newDuration });
}

// ============================================================================
// SHIFT OPERATION
// ============================================================================

/**
 * Shifts an event by a tick delta.
 */
export function shiftEvent<P>(
  event: Event<P>,
  delta: number,
  clampToZero = true
): Event<P> {
  let newStart = event.start + delta;
  
  if (clampToZero && newStart < 0) {
    newStart = 0;
  } else if (newStart < 0) {
    throw new RangeError(`Shifted start would be negative: ${newStart}`);
  }
  
  return updateEvent(event, { start: asTick(newStart) });
}

// ============================================================================
// QUANTIZE OPERATION
// ============================================================================

/**
 * Quantize options.
 */
export interface QuantizeOptions {
  grid: number;
  quantizeStart?: boolean;
  quantizeEnd?: boolean;
  quantizeDuration?: boolean;
  strength?: number;
  mode?: QuantizeMode;
}

/**
 * Quantizes an event to a grid.
 */
export function quantizeEvent<P>(
  event: Event<P>,
  options: QuantizeOptions
): Event<P> {
  const {
    grid,
    quantizeStart = true,
    quantizeEnd = false,
    quantizeDuration = false,
    strength = 1,
    mode = 'nearest',
  } = options;
  
  if (grid <= 0) {
    throw new RangeError(`Grid must be positive, got ${grid}`);
  }
  
  let newStart = event.start;
  let newDuration = event.duration;
  
  if (quantizeStart) {
    const quantizedStart = quantizeTick(event.start, grid, mode);
    newStart = asTick(Math.round(event.start + (quantizedStart - event.start) * strength));
  }
  
  if (quantizeEnd) {
    const originalEnd = event.start + event.duration;
    // Use 'ceil' for end to prevent events from shrinking to nothing
    const endMode = mode === 'nearest' ? 'ceil' : mode;
    const quantizedEnd = quantizeTick(asTick(originalEnd), grid, endMode);
    const newEnd = Math.round(originalEnd + (quantizedEnd - originalEnd) * strength);
    newDuration = asTickDuration(Math.max(1, newEnd - newStart));
  } else if (quantizeDuration) {
    const quantizedDuration = Math.round(event.duration / grid) * grid || grid;
    newDuration = asTickDuration(
      Math.round(event.duration + (quantizedDuration - event.duration) * strength)
    );
  }
  
  return updateEvent(event, {
    start: newStart,
    duration: newDuration,
  });
}

// ============================================================================
// NORMALIZE OPERATION
// ============================================================================

/**
 * Normalizes an event ensuring valid bounds.
 */
export function normalizeEvent<P>(event: Event<P>): Event<P> {
  let { start, duration } = event;
  
  // Ensure non-negative start
  if (start < 0) {
    start = asTick(0);
  }
  
  // Ensure positive duration
  if (duration < 1) {
    duration = asTickDuration(1);
  }
  
  if (start === event.start && duration === event.duration) {
    return event;
  }
  
  return updateEvent(event, { start, duration });
}

// ============================================================================
// RESIZE OPERATION
// ============================================================================

/**
 * Resizes an event to a new duration.
 */
export function resizeEvent<P>(
  event: Event<P>,
  newDuration: TickDuration | number,
  anchor: StretchAnchor = 'start'
): Event<P> {
  const duration = typeof newDuration === 'number' ? asTickDuration(newDuration) : newDuration;
  const durationDelta = duration - event.duration;
  
  let newStart: Tick;
  switch (anchor) {
    case 'start':
      newStart = event.start;
      break;
    case 'center':
      newStart = asTick(Math.max(0, event.start - Math.floor(durationDelta / 2)));
      break;
    case 'end':
      newStart = asTick(Math.max(0, event.start - durationDelta));
      break;
  }
  
  return updateEvent(event, { start: newStart, duration });
}

// ============================================================================
// TRIM OPERATION
// ============================================================================

/**
 * Trims an event to fit within a range.
 */
export function trimEvent<P>(
  event: Event<P>,
  rangeStart: Tick,
  rangeEnd: Tick
): Event<P> | null {
  const end = eventEnd(event);
  
  // Completely outside range
  if (end <= rangeStart || event.start >= rangeEnd) {
    return null;
  }
  
  // Calculate new bounds
  const newStart = asTick(Math.max(event.start, rangeStart));
  const newEnd = Math.min(end, rangeEnd);
  const newDuration = asTickDuration(newEnd - newStart);
  
  if (newDuration <= 0) {
    return null;
  }
  
  // No change needed
  if (newStart === event.start && newDuration === event.duration) {
    return event;
  }
  
  return updateEvent(event, { start: newStart, duration: newDuration });
}

// ============================================================================
// MOVE OPERATION
// ============================================================================

/**
 * Moves an event to a new start position.
 */
export function moveEvent<P>(event: Event<P>, newStart: Tick | number): Event<P> {
  const start = typeof newStart === 'number' ? asTick(newStart) : newStart;
  return updateEvent(event, { start });
}

// ============================================================================
// COMPARISON
// ============================================================================

/**
 * Compares events by start time.
 */
export function compareEventsByStart<P>(a: Event<P>, b: Event<P>): number {
  return a.start - b.start;
}

/**
 * Compares events by end time.
 */
export function compareEventsByEnd<P>(a: Event<P>, b: Event<P>): number {
  return eventEnd(a) - eventEnd(b);
}

/**
 * Compares events by duration.
 */
export function compareEventsByDuration<P>(a: Event<P>, b: Event<P>): number {
  return a.duration - b.duration;
}
