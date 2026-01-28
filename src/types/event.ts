/**
 * @fileoverview Core Event<P> type and factory functions.
 * 
 * @module @cardplay/core/types/event
 * @see cardplay2.md Section 1.1 - Event<P>
 */

import { type Tick, type TickDuration, asTick, asTickDuration, addTicks } from './primitives';
import { type EventId, generateEventId } from './event-id';
import { type EventMeta } from './event-meta';
import { type EventKind, EventKinds } from './event-kind';
import { type Trigger } from './trigger';
import { type Lane, type Control } from './lane';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Core event type with parametric payload.
 * 
 * @template P - Payload type
 */
export interface Event<P> {
  /** Unique identifier */
  readonly id: EventId;
  /** Event kind/type */
  readonly kind: EventKind;
  /** @deprecated legacy alias for kind */
  readonly type?: EventKind;
  /** Start position in ticks */
  readonly start: Tick;
  /** @deprecated legacy alias for start */
  readonly tick?: Tick;
  /** @deprecated legacy alias for start */
  readonly startTick?: Tick;
  /** Duration in ticks */
  readonly duration: TickDuration;
  /** @deprecated legacy alias for duration */
  readonly durationTick?: TickDuration;
  /** Type-safe payload */
  readonly payload: P;
  /** Sub-event triggers */
  readonly triggers?: readonly Trigger<P>[];
  /** Automation lanes */
  readonly automation?: readonly Lane<Control>[];
  /** Tags for filtering */
  readonly tags?: Readonly<Set<string>>;
  /** Metadata */
  readonly meta?: EventMeta;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for Event<P>.
 */
export function isEvent<P>(value: unknown): value is Event<P> {
  if (value === null || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.kind === 'string' &&
    typeof obj.start === 'number' &&
    typeof obj.duration === 'number' &&
    'payload' in obj
  );
}

// ============================================================================
// FACTORIES
// ============================================================================

/**
 * Options for creating an event.
 */
export interface CreateEventOptions<P> {
  id?: EventId;
  kind: EventKind;
  start: Tick | number;
  duration: TickDuration | number;
  payload: P;
  triggers?: readonly Trigger<P>[];
  automation?: readonly Lane<Control>[];
  tags?: Iterable<string>;
  meta?: EventMeta;
}

/**
 * Creates a new Event.
 */
export function createEvent<P>(options: CreateEventOptions<P>): Event<P> {
  const start = typeof options.start === 'number' ? asTick(options.start) : options.start;
  const duration = typeof options.duration === 'number' ? asTickDuration(options.duration) : options.duration;
  
  const event: Event<P> = {
    id: options.id ?? generateEventId(),
    kind: options.kind,
    start,
    duration,
    payload: options.payload,
  };

  // Legacy aliases for older callsites across the repo.
  (event as { type: EventKind }).type = event.kind;
  (event as { tick: Tick }).tick = event.start;
  (event as { startTick: Tick }).startTick = event.start;
  (event as { durationTick: TickDuration }).durationTick = event.duration;
  
  if (options.triggers !== undefined && options.triggers.length > 0) {
    (event as { triggers: readonly Trigger<P>[] }).triggers = [...options.triggers];
  }
  if (options.automation !== undefined && options.automation.length > 0) {
    (event as { automation: readonly Lane<Control>[] }).automation = [...options.automation];
  }
  if (options.tags !== undefined) {
    (event as { tags: Readonly<Set<string>> }).tags = new Set(options.tags);
  }
  if (options.meta !== undefined) {
    (event as { meta: EventMeta }).meta = options.meta;
  }
  
  return Object.freeze(event);
}

/**
 * Creates a note event.
 */
export function createNoteEvent(
  start: Tick | number,
  duration: TickDuration | number,
  pitch: number,
  velocity: number = 100
): Event<{ pitch: number; velocity: number }> {
  return createEvent({
    kind: EventKinds.NOTE,
    start,
    duration,
    payload: { pitch, velocity },
  });
}

// ============================================================================
// CLONE AND UPDATE
// ============================================================================

/**
 * Clones an event with a new ID.
 */
export function cloneEvent<P>(
  event: Event<P>,
  overrides?: Partial<Omit<Event<P>, 'id'>>
): Event<P> {
  const triggers = overrides?.triggers ?? event.triggers;
  const automation = overrides?.automation ?? event.automation;
  const tags = overrides?.tags ?? event.tags;
  const meta = overrides?.meta ?? event.meta;
  
  return createEvent({
    kind: overrides?.kind ?? event.kind,
    start: overrides?.start ?? event.start,
    duration: overrides?.duration ?? event.duration,
    payload: overrides?.payload ?? event.payload,
    ...(triggers !== undefined && { triggers }),
    ...(automation !== undefined && { automation }),
    ...(tags !== undefined && { tags }),
    ...(meta !== undefined && { meta }),
  });
}

/**
 * Updates an event preserving its ID.
 */
export function updateEvent<P>(
  event: Event<P>,
  updates: Partial<Omit<Event<P>, 'id'>>
): Event<P> {
  const triggers = updates.triggers ?? event.triggers;
  const automation = updates.automation ?? event.automation;
  const tags = updates.tags ?? event.tags;
  const meta = updates.meta ?? event.meta;
  
  return createEvent({
    id: event.id,
    kind: updates.kind ?? event.kind,
    start: updates.start ?? event.start,
    duration: updates.duration ?? event.duration,
    payload: updates.payload ?? event.payload,
    ...(triggers !== undefined && { triggers }),
    ...(automation !== undefined && { automation }),
    ...(tags !== undefined && { tags }),
    ...(meta !== undefined && { meta }),
  });
}

/**
 * Updates just the payload of an event.
 */
export function updateEventPayload<P extends object>(
  event: Event<P>,
  payloadUpdates: Partial<P>
): Event<P> {
  return updateEvent(event, {
    payload: { ...event.payload, ...payloadUpdates },
  });
}

// ============================================================================
// COMPUTED PROPERTIES
// ============================================================================

/**
 * Gets the end tick of an event.
 */
export function eventEnd<P>(event: Event<P>): Tick {
  return addTicks(event.start, event.duration);
}

/**
 * Gets the midpoint tick of an event.
 */
export function eventMidpoint<P>(event: Event<P>): Tick {
  return asTick(event.start + Math.floor(event.duration / 2));
}

/**
 * Checks if an event is instantaneous (zero duration).
 */
export function isInstantaneous<P>(event: Event<P>): boolean {
  return event.duration === 0;
}

// ============================================================================
// EQUALITY
// ============================================================================

/**
 * Deep equality check for events.
 */
export function eventEquals<P>(a: Event<P>, b: Event<P>): boolean {
  if (a.id !== b.id) return false;
  if (a.kind !== b.kind) return false;
  if (a.start !== b.start) return false;
  if (a.duration !== b.duration) return false;
  if (JSON.stringify(a.payload) !== JSON.stringify(b.payload)) return false;
  return true;
}

/**
 * Checks if two events have the same ID.
 */
export function eventIdEquals<P>(a: Event<P>, b: Event<P>): boolean {
  return a.id === b.id;
}

/**
 * Checks if two events have the same position (start and duration).
 */
export function eventPositionEquals<P>(a: Event<P>, b: Event<P>): boolean {
  return a.start === b.start && a.duration === b.duration;
}
