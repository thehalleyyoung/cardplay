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
  /**
   * Tags for filtering.
   * Change 316: Stored as readonly string[] for JSON safety.
   * Use getEventTags() helper for Set-based lookups.
   */
  readonly tags?: readonly string[];
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
    // Change 316: Store as sorted array for JSON safety and determinism
    const tagArray = Array.from(options.tags).sort();
    (event as { tags: readonly string[] }).tags = tagArray;
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

// ============================================================================
// TAG HELPERS
// ============================================================================

/**
 * Gets event tags as a Set for efficient lookups.
 * Change 316: Tags are stored as arrays for JSON safety; use this for Set ops.
 */
export function getEventTags<P>(event: Event<P>): ReadonlySet<string> {
  return new Set(event.tags ?? []);
}

/**
 * Checks if an event has a specific tag.
 */
export function hasEventTag<P>(event: Event<P>, tag: string): boolean {
  return event.tags?.includes(tag) ?? false;
}

// ============================================================================
// LEGACY NORMALIZATION
// ============================================================================

/**
 * Legacy event shape (uses `type`, `tick`, etc.)
 * Change 075: Define legacy shape for ingestion.
 */
export interface LegacyEventShape<P> {
  id?: string;
  type?: string;
  kind?: EventKind;
  tick?: number;
  startTick?: number;
  start?: number;
  durationTick?: number;
  duration?: number;
  payload?: P;
  triggers?: readonly Trigger<P>[];
  automation?: readonly Lane<Control>[];
  tags?: Iterable<string> | Set<string> | readonly string[];
  meta?: EventMeta;
}

/**
 * Normalizes a legacy event shape to the canonical Event format.
 * 
 * Change 075: Add normalizeEvent() for ingesting legacy shapes.
 * 
 * Maps legacy field names to canonical ones:
 * - `type` → `kind`
 * - `tick` → `start`
 * - `startTick` → `start`
 * - `durationTick` → `duration`
 * 
 * @param legacy Legacy event shape to normalize
 * @returns Canonical Event<P>
 * 
 * @example
 * ```ts
 * // Legacy shape from older serialization
 * const legacyNote = {
 *   id: 'note-1',
 *   type: 'note',
 *   tick: 480,
 *   durationTick: 240,
 *   payload: { pitch: 60, velocity: 100 }
 * };
 * 
 * // Normalize to canonical shape
 * const canonicalNote = normalizeEvent(legacyNote);
 * // { id: 'note-1', kind: 'note', start: 480, duration: 240, payload: { ... } }
 * ```
 */
export function normalizeEvent<P>(legacy: LegacyEventShape<P>): Event<P> {
  // Determine kind: prefer `kind`, fall back to `type`
  const kind = (legacy.kind ?? legacy.type ?? 'unknown') as EventKind;
  
  // Determine start: prefer `start`, fall back to `tick` or `startTick`
  const start = legacy.start ?? legacy.tick ?? legacy.startTick ?? 0;
  
  // Determine duration: prefer `duration`, fall back to `durationTick`
  const duration = legacy.duration ?? legacy.durationTick ?? 0;
  
  // Payload is required
  if (legacy.payload === undefined) {
    throw new Error('normalizeEvent: payload is required');
  }
  
  return createEvent({
    id: legacy.id as EventId | undefined,
    kind,
    start,
    duration,
    payload: legacy.payload,
    triggers: legacy.triggers,
    automation: legacy.automation,
    tags: legacy.tags,
    meta: legacy.meta,
  });
}

/**
 * Checks if a value looks like a legacy event shape.
 * 
 * @param value Value to check
 * @returns true if value has legacy field names (type, tick, etc.)
 */
export function isLegacyEventShape(value: unknown): value is LegacyEventShape<unknown> {
  if (value === null || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  
  // Has legacy-only field names
  const hasLegacyFields = 'type' in obj || 'tick' in obj || 
                          'startTick' in obj || 'durationTick' in obj;
  
  // Has required payload
  const hasPayload = 'payload' in obj;
  
  return hasLegacyFields && hasPayload;
}

/**
 * Normalizes a value that may be either a legacy or canonical event.
 * 
 * @param value Event or legacy event shape
 * @returns Canonical Event<P>
 */
export function ensureCanonicalEvent<P>(value: Event<P> | LegacyEventShape<P>): Event<P> {
  if (isEvent(value)) {
    return value;
  }
  return normalizeEvent(value as LegacyEventShape<P>);
}
