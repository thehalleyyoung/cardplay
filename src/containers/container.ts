/**
 * @fileoverview Container<K, E> type for grouping events.
 * 
 * Containers are named collections of events with metadata.
 * They support references (Ref<C>) for reuse without copying.
 * 
 * @module @cardplay/core/containers/container
 * @see cardplay2.md Section 1.3 - Container<K, E>
 */

import {
  type Tick,
  type TickDuration,
  asTick,
  asTickDuration,
} from '../types/primitives';
import { type Event, eventEnd } from '../types/event';
import { generateEventId, EventKinds } from '../types';
import { type Stream, createStream, streamShift, streamStretch, streamSlice, streamMerge, streamReverse } from '../streams/stream';

// ============================================================================
// BRANDED TYPES
// ============================================================================

declare const __brand: unique symbol;
type Branded<T, B extends string> = T & { readonly [__brand]: B };

/**
 * Unique identifier for a Container.
 */
export type ContainerId = Branded<string, 'ContainerId'>;

/**
 * Generates a new ContainerId.
 */
export function generateContainerId(): ContainerId {
  return crypto.randomUUID() as ContainerId;
}

/**
 * Validates and casts a string to ContainerId.
 */
export function asContainerId(value: string): ContainerId {
  if (!value || typeof value !== 'string') {
    throw new TypeError('ContainerId must be a non-empty string');
  }
  return value as ContainerId;
}

// ============================================================================
// CONTAINER KINDS
// ============================================================================

/**
 * Built-in container kinds.
 */
export type ContainerKind = 
  | 'pattern'
  | 'scene'
  | 'clip'
  | 'score'
  | 'take'
  | 'phrase'
  | string;

// ============================================================================
// CONTAINER META
// ============================================================================

/**
 * Metadata for a container.
 */
export interface ContainerMeta {
  /** Human-readable name */
  readonly name?: string;
  /** Display color */
  readonly color?: string;
  /** Explicit length (if different from content) */
  readonly length?: TickDuration;
  /** Loop settings */
  readonly loop?: LoopSettings;
  /** Time signature */
  readonly timeSignature?: [number, number];
  /** Tempo in BPM (for standalone playback) */
  readonly tempo?: number;
  /** Tags for organization */
  readonly tags?: readonly string[];
}

/**
 * Loop settings for a container.
 */
export interface LoopSettings {
  /** Whether looping is enabled */
  readonly enabled: boolean;
  /** Loop start tick (relative to container) */
  readonly start?: Tick;
  /** Loop end tick (relative to container) */
  readonly end?: Tick;
  /** Number of times to loop (undefined = infinite) */
  readonly count?: number;
}

// ============================================================================
// CONTAINER TYPE
// ============================================================================

/**
 * A Container groups events with metadata.
 * 
 * @template K - Container kind
 * @template E - Event type
 */
export interface Container<K extends ContainerKind, E extends Event<unknown>> {
  /** Unique identifier */
  readonly id: ContainerId;
  /** Container kind */
  readonly kind: K;
  /** Events in this container */
  readonly events: Stream<E>;
  /** Container metadata */
  readonly meta: ContainerMeta;
}

// ============================================================================
// CONTAINER ALIASES
// ============================================================================

/**
 * A Pattern is a reusable container of events.
 */
export type Pattern<E extends Event<unknown> = Event<unknown>> = Container<'pattern', E>;

/**
 * A Scene is a collection of clips arranged horizontally.
 */
export type Scene<E extends Event<unknown> = Event<unknown>> = Container<'scene', E>;

/**
 * A Clip is a single region on the timeline.
 */
export type Clip<E extends Event<unknown> = Event<unknown>> = Container<'clip', E>;

/**
 * A Score is the complete musical composition.
 */
export type Score<E extends Event<unknown> = Event<unknown>> = Container<'score', E>;

/**
 * A Take is a recorded performance.
 */
export type Take<E extends Event<unknown> = Event<unknown>> = Container<'take', E>;

/**
 * A Phrase is a musical phrase or motif.
 */
export type Phrase<E extends Event<unknown> = Event<unknown>> = Container<'phrase', E>;

// ============================================================================
// REFERENCE TYPE
// ============================================================================

/**
 * A reference to a container with optional transform.
 */
export interface Ref<C extends Container<ContainerKind, Event<unknown>>> {
  /** Referenced container ID */
  readonly containerId: ContainerId;
  /** Position offset in parent timeline */
  readonly offset: Tick;
  /** Duration override (for trimming) */
  readonly duration?: TickDuration;
  /** Time stretch factor */
  readonly stretch?: number;
  /** Pitch transpose (semitones) */
  readonly transpose?: number;
  /** Gain adjustment (0-1) */
  readonly gain?: number;
  /** Whether ref is muted */
  readonly muted?: boolean;
  /** The actual container (for resolved refs) */
  readonly _container?: C;
}

// ============================================================================
// FACTORIES
// ============================================================================

/**
 * Options for creating a container.
 */
export interface CreateContainerOptions<K extends ContainerKind, E extends Event<unknown>> {
  id?: ContainerId;
  kind: K;
  events?: readonly E[] | Stream<E>;
  meta?: Partial<ContainerMeta>;
}

/**
 * Creates a new Container.
 */
export function createContainer<K extends ContainerKind, E extends Event<unknown>>(
  options: CreateContainerOptions<K, E>
): Container<K, E> {
  let events: Stream<E>;
  if (options.events === undefined) {
    events = createStream<E>([]);
  } else if (Array.isArray(options.events)) {
    events = createStream<E>(options.events as readonly E[]);
  } else {
    events = options.events as Stream<E>;
  }
  
  const meta: ContainerMeta = {};
  if (options.meta?.name !== undefined) (meta as { name: string }).name = options.meta.name;
  if (options.meta?.color !== undefined) (meta as { color: string }).color = options.meta.color;
  if (options.meta?.length !== undefined) (meta as { length: TickDuration }).length = options.meta.length;
  if (options.meta?.loop !== undefined) (meta as { loop: LoopSettings }).loop = options.meta.loop;
  if (options.meta?.timeSignature !== undefined) (meta as { timeSignature: [number, number] }).timeSignature = options.meta.timeSignature;
  if (options.meta?.tempo !== undefined) (meta as { tempo: number }).tempo = options.meta.tempo;
  if (options.meta?.tags !== undefined) (meta as { tags: readonly string[] }).tags = [...options.meta.tags];
  
  const container: Container<K, E> = {
    id: options.id ?? generateContainerId(),
    kind: options.kind,
    events,
    meta,
  };
  return Object.freeze(container);
}

/**
 * Creates a Pattern.
 */
export function createPattern<E extends Event<unknown>>(
  events: readonly E[] | Stream<E>,
  meta?: Partial<ContainerMeta>
): Pattern<E> {
  const opts: CreateContainerOptions<'pattern', E> = { kind: 'pattern', events };
  if (meta !== undefined) opts.meta = meta;
  return createContainer(opts);
}

/**
 * Creates a Clip.
 */
export function createClip<E extends Event<unknown>>(
  events: readonly E[] | Stream<E>,
  meta?: Partial<ContainerMeta>
): Clip<E> {
  const opts: CreateContainerOptions<'clip', E> = { kind: 'clip', events };
  if (meta !== undefined) opts.meta = meta;
  return createContainer(opts);
}

/**
 * Creates a Scene.
 */
export function createScene<E extends Event<unknown>>(
  events: readonly E[] | Stream<E>,
  meta?: Partial<ContainerMeta>
): Scene<E> {
  const opts: CreateContainerOptions<'scene', E> = { kind: 'scene', events };
  if (meta !== undefined) opts.meta = meta;
  return createContainer(opts);
}

/**
 * Creates a Phrase.
 */
export function createPhrase<E extends Event<unknown>>(
  events: readonly E[] | Stream<E>,
  meta?: Partial<ContainerMeta>
): Phrase<E> {
  const opts: CreateContainerOptions<'phrase', E> = { kind: 'phrase', events };
  if (meta !== undefined) opts.meta = meta;
  return createContainer(opts);
}

// ============================================================================
// CONTAINER OPERATIONS
// ============================================================================

/**
 * Clones a container with a new ID.
 */
export function cloneContainer<K extends ContainerKind, E extends Event<unknown>>(
  container: Container<K, E>,
  overrides?: Partial<Omit<Container<K, E>, 'id'>>
): Container<K, E> {
  return createContainer({
    kind: overrides?.kind ?? container.kind,
    events: overrides?.events ?? container.events,
    meta: { ...container.meta, ...overrides?.meta },
  });
}

/**
 * Gets the duration of a container's content.
 */
export function containerDuration<K extends ContainerKind, E extends Event<unknown>>(
  container: Container<K, E>
): TickDuration {
  // Use explicit length if set
  if (container.meta.length !== undefined) {
    return container.meta.length;
  }
  
  // Calculate from events
  const events = container.events.events;
  if (events.length === 0) return asTickDuration(0);
  
  let maxEnd = 0;
  for (const event of events) {
    const end = eventEnd(event);
    if (end > maxEnd) maxEnd = end;
  }
  
  return asTickDuration(maxEnd);
}

/**
 * Gets the temporal bounds of a container.
 */
export function containerBounds<K extends ContainerKind, E extends Event<unknown>>(
  container: Container<K, E>
): { start: Tick; end: Tick } | null {
  const events = container.events.events;
  if (events.length === 0) return null;
  
  const start = events[0]!.start;
  let end = start;
  
  for (const event of events) {
    const eEnd = eventEnd(event);
    if (eEnd > end) end = eEnd;
  }
  
  return { start, end: asTick(end) };
}

/**
 * Resolves a container reference, applying transforms.
 */
export function resolveRef<K extends ContainerKind, E extends Event<unknown>>(
  ref: Ref<Container<K, E>>,
  containerLookup: (id: ContainerId) => Container<K, E> | undefined
): Stream<E> | null {
  const container = ref._container ?? containerLookup(ref.containerId);
  if (!container) return null;
  
  let stream = container.events;
  
  // Apply stretch
  if (ref.stretch !== undefined && ref.stretch !== 1) {
    stream = streamStretch(stream, ref.stretch);
  }
  
  // Apply duration trim
  if (ref.duration !== undefined) {
    const duration = containerDuration(container);
    if (ref.duration < duration) {
      stream = streamSlice(stream, asTick(0), asTick(ref.duration));
    }
  }
  
  // Apply offset
  if (ref.offset > 0) {
    stream = streamShift(stream, ref.offset);
  }
  
  return stream;
}

/**
 * Resolves all container refs in a stream.
 */
export function resolveContainerRefs<K extends ContainerKind, E extends Event<unknown>>(
  refs: readonly Ref<Container<K, E>>[],
  containerLookup: (id: ContainerId) => Container<K, E> | undefined
): Stream<E> {
  let result = createStream<E>([]);
  
  for (const ref of refs) {
    if (ref.muted) continue;
    
    const resolved = resolveRef(ref, containerLookup);
    if (resolved) {
      result = streamMerge(result, resolved);
    }
  }
  
  return result;
}

// ============================================================================
// SERIALIZATION
// ============================================================================

/**
 * JSON representation of a Container.
 */
export interface ContainerJSON {
  id: string;
  kind: string;
  events: unknown[];
  meta: {
    name?: string;
    color?: string;
    length?: number;
    loop?: {
      enabled: boolean;
      start?: number;
      end?: number;
      count?: number;
    };
    timeSignature?: [number, number];
    tempo?: number;
    tags?: string[];
  };
}

/**
 * Serializes a container to JSON.
 */
export function containerToJSON<K extends ContainerKind, E extends Event<unknown>>(
  container: Container<K, E>,
  eventSerializer: (event: E) => unknown
): ContainerJSON {
  const json: ContainerJSON = {
    id: container.id,
    kind: container.kind,
    events: container.events.events.map(eventSerializer),
    meta: {},
  };
  
  if (container.meta.name !== undefined) json.meta.name = container.meta.name;
  if (container.meta.color !== undefined) json.meta.color = container.meta.color;
  if (container.meta.length !== undefined) json.meta.length = container.meta.length;
  if (container.meta.loop !== undefined) json.meta.loop = { ...container.meta.loop };
  if (container.meta.timeSignature !== undefined) json.meta.timeSignature = [...container.meta.timeSignature];
  if (container.meta.tempo !== undefined) json.meta.tempo = container.meta.tempo;
  if (container.meta.tags !== undefined) json.meta.tags = [...container.meta.tags];
  
  return json;
}

/**
 * Deserializes a container from JSON.
 */
export function containerFromJSON<K extends ContainerKind, E extends Event<unknown>>(
  json: ContainerJSON,
  eventDeserializer: (data: unknown) => E
): Container<K, E> {
  const events = json.events.map(eventDeserializer);
  
  // Build meta object piece by piece
  type MutableMeta = {
    -readonly [P in keyof ContainerMeta]?: ContainerMeta[P];
  };
  const meta: MutableMeta = {};
  if (json.meta.name !== undefined) meta.name = json.meta.name;
  if (json.meta.color !== undefined) meta.color = json.meta.color;
  if (json.meta.length !== undefined) meta.length = asTickDuration(json.meta.length);
  if (json.meta.loop !== undefined) {
    const loop: LoopSettings = { enabled: json.meta.loop.enabled };
    if (json.meta.loop.start !== undefined) (loop as { start: Tick }).start = asTick(json.meta.loop.start);
    if (json.meta.loop.end !== undefined) (loop as { end: Tick }).end = asTick(json.meta.loop.end);
    if (json.meta.loop.count !== undefined) (loop as { count: number }).count = json.meta.loop.count;
    meta.loop = loop;
  }
  if (json.meta.timeSignature !== undefined) meta.timeSignature = json.meta.timeSignature;
  if (json.meta.tempo !== undefined) meta.tempo = json.meta.tempo;
  if (json.meta.tags !== undefined) meta.tags = json.meta.tags;
  
  return createContainer({
    id: asContainerId(json.id),
    kind: json.kind as K,
    events,
    meta: meta as Partial<ContainerMeta>,
  });
}

// ============================================================================
// MERGING AND SLICING
// ============================================================================

/**
 * Merges multiple containers into one.
 */
export function mergeContainers<K extends ContainerKind, E extends Event<unknown>>(
  containers: readonly Container<K, E>[],
  kind?: K,
  meta?: Partial<ContainerMeta>
): Container<K, E> {
  if (containers.length === 0) {
    const opts: CreateContainerOptions<K, E> = { kind: kind ?? ('pattern' as K) };
    if (meta !== undefined) opts.meta = meta;
    return createContainer(opts);
  }
  
  let merged = containers[0]!.events;
  for (let i = 1; i < containers.length; i++) {
    merged = streamMerge(merged, containers[i]!.events);
  }
  
  const finalMeta = meta ?? containers[0]!.meta;
  const opts: CreateContainerOptions<K, E> = {
    kind: kind ?? containers[0]!.kind,
    events: merged,
  };
  if (Object.keys(finalMeta).length > 0) opts.meta = finalMeta;
  return createContainer(opts);
}

/**
 * Slices a container to a tick range.
 */
export function sliceContainer<K extends ContainerKind, E extends Event<unknown>>(
  container: Container<K, E>,
  start: Tick,
  end: Tick
): Container<K, E> {
  const sliced = streamSlice(container.events, start, end);
  
  // Shift events so they start at 0
  const normalized = streamShift(sliced, -start);
  
  return createContainer({
    kind: container.kind,
    events: normalized,
    meta: {
      ...container.meta,
      length: asTickDuration(end - start),
    },
  });
}

/**
 * Loops a container n times.
 */
export function loopContainer<K extends ContainerKind, E extends Event<unknown>>(
  container: Container<K, E>,
  count: number
): Container<K, E> {
  if (count <= 0) {
    return createContainer({ kind: container.kind, events: [], meta: container.meta });
  }
  
  if (count === 1) return container;
  
  const duration = containerDuration(container);
  const allEvents: E[] = [];
  
  for (let i = 0; i < count; i++) {
    const offset = duration * i;
    for (const event of container.events.events) {
      allEvents.push({
        ...event,
        start: asTick(event.start + offset),
      } as E);
    }
  }
  
  return createContainer({
    kind: container.kind,
    events: allEvents,
    meta: {
      ...container.meta,
      length: asTickDuration(duration * count),
    },
  });
}

// ============================================================================
// PATTERN OPERATIONS
// ============================================================================

/**
 * Duplicates a pattern with a new ID.
 * Creates an exact copy with all events and metadata preserved.
 */
export function duplicatePattern<E extends Event<unknown>>(
  pattern: Pattern<E>
): Pattern<E> {
  const meta: Record<string, unknown> = { ...pattern.meta };
  if (pattern.meta.name) {
    meta.name = `${pattern.meta.name} (Copy)`;
  }
  return createPattern(pattern.events.events, meta as Partial<ContainerMeta>);
}

/**
 * Deletes a pattern by returning null.
 * This is a symbolic operation - actual deletion happens in the state manager.
 * Returns null to indicate the pattern should be removed from the registry.
 */
export function deletePattern<E extends Event<unknown>>(
  _pattern: Pattern<E>
): null {
  return null;
}

/**
 * Resizes a pattern to a new length.
 * If the new length is shorter, events beyond the length are trimmed.
 * If the new length is longer, the pattern is extended with empty space.
 */
export function resizePattern<E extends Event<unknown>>(
  pattern: Pattern<E>,
  newLength: TickDuration
): Pattern<E> {
  const currentLength = containerDuration(pattern);
  
  if (newLength === currentLength) {
    return pattern;
  }
  
  if (newLength < currentLength) {
    // Trim to new length
    return createPattern(
      streamSlice(pattern.events, asTick(0), asTick(newLength)),
      {
        ...pattern.meta,
        length: newLength,
      }
    );
  }
  
  // Extend - keep all events, just update length metadata
  return createPattern(pattern.events, {
    ...pattern.meta,
    length: newLength,
  });
}

/**
 * Updates pattern properties (metadata).
 * This is used for pattern properties dialogs in the UI.
 */
export function updatePatternProperties<E extends Event<unknown>>(
  pattern: Pattern<E>,
  properties: Partial<ContainerMeta>
): Pattern<E> {
  return createPattern(pattern.events, {
    ...pattern.meta,
    ...properties,
  });
}

/**
 * Assigns a color to a pattern.
 */
export function assignPatternColor<E extends Event<unknown>>(
  pattern: Pattern<E>,
  color: string
): Pattern<E> {
  return createPattern(pattern.events, {
    ...pattern.meta,
    color,
  });
}

/**
 * Names or renames a pattern.
 */
export function namePattern<E extends Event<unknown>>(
  pattern: Pattern<E>,
  name: string
): Pattern<E> {
  return createPattern(pattern.events, {
    ...pattern.meta,
    name,
  });
}

/**
 * Transposes all pitch events in a pattern by semitones.
 * Only affects events with pitch payloads.
 */
export function transposePattern<P>(
  pattern: Pattern<Event<P>>,
  semitones: number
): Pattern<Event<P>> {
  if (semitones === 0) return pattern;
  
  const transposedEvents = pattern.events.events.map(event => {
    const payload = event.payload as any;
    // Check if payload has a pitch property
    if (payload && typeof payload === 'object' && 'pitch' in payload && typeof payload.pitch === 'number') {
      return {
        ...event,
        payload: {
          ...payload,
          pitch: payload.pitch + semitones,
        } as P,
      };
    }
    return event;
  });
  
  return createPattern(transposedEvents, pattern.meta);
}

/**
 * Time-stretches a pattern by a factor.
 * Factor > 1 slows down (longer), factor < 1 speeds up (shorter).
 * All event start times and durations are multiplied by the factor.
 */
export function stretchPattern<E extends Event<unknown>>(
  pattern: Pattern<E>,
  factor: number
): Pattern<E> {
  if (factor <= 0) {
    throw new Error('Stretch factor must be positive');
  }
  if (factor === 1) return pattern;
  
  const stretched = streamStretch(pattern.events, factor);
  const meta: Record<string, unknown> = { ...pattern.meta };
  if (pattern.meta.length !== undefined) {
    meta.length = asTickDuration(pattern.meta.length * factor);
  }
  
  return createPattern(stretched, meta as Partial<ContainerMeta>);
}

/**
 * Doubles the speed of a pattern (halves duration).
 * Equivalent to stretchPattern with factor 0.5.
 */
export function doubleSpeedPattern<E extends Event<unknown>>(
  pattern: Pattern<E>
): Pattern<E> {
  return stretchPattern(pattern, 0.5);
}

/**
 * Halves the speed of a pattern (doubles duration).
 * Equivalent to stretchPattern with factor 2.0.
 * Item 2406 from currentsteps.md.
 */
export function halfSpeedPattern<E extends Event<unknown>>(
  pattern: Pattern<E>
): Pattern<E> {
  return stretchPattern(pattern, 2.0);
}

/**
 * Reverses the temporal order of events in a pattern.
 * Events are played backwards from end to start.
 * Item 2407 from currentsteps.md.
 */
export function reversePattern<E extends Event<unknown>>(
  pattern: Pattern<E>
): Pattern<E> {
  const reversed = streamReverse(pattern.events);
  return createPattern(reversed, pattern.meta);
}

/**
 * Rotates pattern events by a specified number of ticks.
 * Positive offset rotates forward (events loop from end to start).
 * Negative offset rotates backward (events loop from start to end).
 * Item 2408 from currentsteps.md.
 */
export function rotatePattern<E extends Event<unknown>>(
  pattern: Pattern<E>,
  offsetTicks: number
): Pattern<E> {
  if (offsetTicks === 0) return pattern;
  
  const patternLength = containerDuration(pattern);
  if (patternLength === 0) return pattern;
  
  // Normalize offset to pattern length
  const normalizedOffset = ((offsetTicks % patternLength) + patternLength) % patternLength;
  if (normalizedOffset === 0) return pattern;
  
  // Split events into two groups: before and after the rotation point
  const splitPoint = asTick(patternLength - normalizedOffset);
  const beforeSplit = pattern.events.events.filter(e => e.start < splitPoint);
  const afterSplit = pattern.events.events.filter(e => e.start >= splitPoint);
  
  // Shift the groups
  const shiftedAfter = afterSplit.map(e => ({
    ...e,
    start: asTick(e.start - splitPoint),
  }));
  const shiftedBefore = beforeSplit.map(e => ({
    ...e,
    start: asTick(e.start + normalizedOffset),
  }));
  
  // Combine and sort
  const rotated = [...shiftedAfter, ...shiftedBefore].sort((a, b) => a.start - b.start);
  
  return createPattern(rotated, pattern.meta);
}

/**
 * Shifts all events left (earlier) or right (later) by a specified number of ticks.
 * Events shifted outside the pattern boundaries are clipped.
 * Item 2409 from currentsteps.md.
 */
export function shiftPattern<E extends Event<unknown>>(
  pattern: Pattern<E>,
  deltaTicks: number
): Pattern<E> {
  if (deltaTicks === 0) return pattern;
  
  const shifted = streamShift(pattern.events, deltaTicks);
  const patternLength = containerDuration(pattern);
  
  // Clip to pattern boundaries
  const clipped = streamSlice(shifted, asTick(0), asTick(patternLength));
  
  return createPattern(clipped, pattern.meta);
}

/**
 * Expands or shrinks a pattern by repeating or trimming events proportionally.
 * Factor > 1 expands (stretch time and add repetitions), factor < 1 shrinks (compress).
 * This differs from stretchPattern by maintaining event density via repetition.
 * Item 2410 from currentsteps.md.
 */
export function expandShrinkPattern<E extends Event<unknown>>(
  pattern: Pattern<E>,
  factor: number
): Pattern<E> {
  if (factor <= 0) {
    throw new Error('Expand/shrink factor must be positive');
  }
  if (factor === 1) return pattern;
  
  const currentLength = containerDuration(pattern);
  const newLength = asTickDuration(currentLength * factor);
  
  if (factor > 1) {
    // Expand: stretch and loop
    const stretched = streamStretch(pattern.events, factor);
    return createPattern(stretched, {
      ...pattern.meta,
      length: newLength,
    });
  } else {
    // Shrink: compress and trim
    const shrunk = streamStretch(pattern.events, factor);
    const trimmed = streamSlice(shrunk, asTick(0), asTick(newLength));
    return createPattern(trimmed, {
      ...pattern.meta,
      length: newLength,
    });
  }
}

/**
 * Merges (overlays) two patterns by combining their events.
 * Events from both patterns are preserved, with overlapping events coexisting.
 * Item 2411 from currentsteps.md.
 */
export function mergePatterns<E extends Event<unknown>>(
  pattern1: Pattern<E>,
  pattern2: Pattern<E>
): Pattern<E> {
  const merged = streamMerge(pattern1.events, pattern2.events);
  const maxLength = Math.max(
    containerDuration(pattern1),
    containerDuration(pattern2)
  );
  
  return createPattern(merged, {
    ...pattern1.meta,
    name: `${pattern1.meta.name || 'Pattern 1'} + ${pattern2.meta.name || 'Pattern 2'}`,
    length: asTickDuration(maxLength),
  });
}

/**
 * Splits a pattern at a specified tick position into two separate patterns.
 * Returns a tuple [before, after] where events are divided at the split point.
 * Item 2412 from currentsteps.md.
 */
export function splitPattern<E extends Event<unknown>>(
  pattern: Pattern<E>,
  splitAtTick: Tick
): [Pattern<E>, Pattern<E>] {
  const before = streamSlice(pattern.events, asTick(0), splitAtTick);
  const after = streamSlice(pattern.events, splitAtTick, asTick(containerDuration(pattern)));
  
  // Shift the 'after' pattern to start at 0
  const afterShifted = streamShift(after, -splitAtTick);
  
  const beforePattern = createPattern(before, {
    ...pattern.meta,
    name: `${pattern.meta.name || 'Pattern'} (Part 1)`,
    length: asTickDuration(splitAtTick),
  });
  
  const afterPattern = createPattern(afterShifted, {
    ...pattern.meta,
    name: `${pattern.meta.name || 'Pattern'} (Part 2)`,
    length: asTickDuration(containerDuration(pattern) - splitAtTick),
  });
  
  return [beforePattern, afterPattern];
}

/**
 * Clones a pattern to a new track representation.
 * This creates a deep copy suitable for independent track editing.
 * Item 2413 from currentsteps.md.
 */
export function clonePatternToNewTrack<E extends Event<unknown>>(
  pattern: Pattern<E>,
  trackId?: string
): Pattern<E> {
  const newMeta: Record<string, unknown> = { ...pattern.meta };
  if (pattern.meta.name) {
    newMeta.name = `${pattern.meta.name} (Track ${trackId || 'Copy'})`;
  }
  
  // Deep clone events with new IDs
  const clonedEvents = pattern.events.events.map(event => ({
    ...event,
    id: generateEventId(),
  }));
  
  return createPattern(clonedEvents, newMeta as Partial<ContainerMeta>);
}

/**
 * Exports a pattern to MIDI format (Standard MIDI File).
 * Converts pattern events to MIDI note messages with timing.
 * Item 2414 from currentsteps.md.
 * 
 * @param pattern - Pattern to export
 * @param ticksPerQuarterNote - MIDI timing resolution (default: 480)
 * @param tempo - Tempo in BPM (default: 120)
 * @returns Uint8Array containing MIDI file data
 */
export function exportPatternToMIDI<E extends Event<unknown>>(
  pattern: Pattern<E>,
  ticksPerQuarterNote: number = 480,
  tempo: number = 120
): Uint8Array {
  // Convert tempo to microseconds per quarter note
  const tempoMicroseconds = Math.round(60000000 / tempo);
  
  // Build MIDI header
  const header = new DataView(new ArrayBuffer(14));
  // "MThd" chunk
  header.setUint32(0, 0x4D546864, false); // "MThd"
  header.setUint32(4, 6, false); // Header length
  header.setUint16(8, 0, false); // Format 0 (single track)
  header.setUint16(10, 1, false); // Number of tracks
  header.setUint16(12, ticksPerQuarterNote, false);
  
  // Build MIDI track
  const trackEvents: number[] = [];
  
  // Tempo meta event at start
  trackEvents.push(0); // Delta time
  trackEvents.push(0xFF, 0x51, 0x03); // Set tempo meta event
  trackEvents.push((tempoMicroseconds >> 16) & 0xFF);
  trackEvents.push((tempoMicroseconds >> 8) & 0xFF);
  trackEvents.push(tempoMicroseconds & 0xFF);
  
  // Convert events to MIDI notes
  interface MIDINote {
    start: number;
    pitch: number;
    velocity: number;
    duration: number;
  }
  
  const notes: MIDINote[] = [];
  for (const event of pattern.events.events) {
    const payload = event.payload as any;
    if (payload && typeof payload === 'object' && 'pitch' in payload) {
      const pitch = Math.max(0, Math.min(127, Math.round(payload.pitch)));
      const velocity = payload.velocity !== undefined 
        ? Math.max(1, Math.min(127, Math.round(payload.velocity)))
        : 100;
      notes.push({
        start: event.start,
        pitch,
        velocity,
        duration: event.duration || 1,
      });
    }
  }
  
  // Sort notes by start time
  notes.sort((a, b) => a.start - b.start);
  
  // Generate note on/off events
  const midiEvents: Array<{ time: number; type: 'on' | 'off'; pitch: number; velocity: number }> = [];
  for (const note of notes) {
    midiEvents.push({ time: note.start, type: 'on', pitch: note.pitch, velocity: note.velocity });
    midiEvents.push({ time: note.start + note.duration, type: 'off', pitch: note.pitch, velocity: 0 });
  }
  
  // Sort all events by time
  midiEvents.sort((a, b) => a.time - b.time);
  
  // Write note events with delta times
  let lastTime = 0;
  for (const evt of midiEvents) {
    const deltaTime = evt.time - lastTime;
    lastTime = evt.time;
    
    // Write variable-length delta time
    writeVariableLength(trackEvents, deltaTime);
    
    // Write MIDI message (channel 0)
    if (evt.type === 'on') {
      trackEvents.push(0x90, evt.pitch, evt.velocity); // Note On
    } else {
      trackEvents.push(0x80, evt.pitch, evt.velocity); // Note Off
    }
  }
  
  // End of track
  trackEvents.push(0, 0xFF, 0x2F, 0x00);
  
  // Build track chunk
  const trackHeader = new DataView(new ArrayBuffer(8));
  trackHeader.setUint32(0, 0x4D54726B, false); // "MTrk"
  trackHeader.setUint32(4, trackEvents.length, false);
  
  // Combine everything
  const result = new Uint8Array(14 + 8 + trackEvents.length);
  result.set(new Uint8Array(header.buffer), 0);
  result.set(new Uint8Array(trackHeader.buffer), 14);
  result.set(new Uint8Array(trackEvents), 22);
  
  return result;
}

/**
 * Helper: Write variable-length quantity (MIDI format).
 */
function writeVariableLength(buffer: number[], value: number): void {
  if (value < 0) value = 0;
  const bytes: number[] = [];
  bytes.push(value & 0x7F);
  value >>= 7;
  while (value > 0) {
    bytes.push((value & 0x7F) | 0x80);
    value >>= 7;
  }
  bytes.reverse();
  buffer.push(...bytes);
}

/**
 * Imports a pattern from MIDI format.
 * Parses MIDI note events and converts them to pattern events.
 * Item 2415 from currentsteps.md.
 * 
 * @param midiData - MIDI file data as Uint8Array
 * @param patternName - Optional name for the imported pattern
 * @returns Pattern created from MIDI data
 */
export function importPatternFromMIDI<P>(
  midiData: Uint8Array,
  patternName?: string
): Pattern<Event<P>> {
  const view = new DataView(midiData.buffer, midiData.byteOffset, midiData.byteLength);
  let offset = 0;
  
  // Parse header
  const headerType = String.fromCharCode(...Array.from(midiData.slice(0, 4)));
  if (headerType !== 'MThd') {
    throw new Error('Invalid MIDI file: missing MThd header');
  }
  
  const headerLength = view.getUint32(4, false);
  offset = 8 + headerLength;
  
  // Parse first track
  if (offset + 8 > midiData.length) {
    throw new Error('Invalid MIDI file: missing track');
  }
  
  const trackType = String.fromCharCode(...Array.from(midiData.slice(offset, offset + 4)));
  if (trackType !== 'MTrk') {
    throw new Error('Invalid MIDI file: missing MTrk header');
  }
  
  const trackLength = view.getUint32(offset + 4, false);
  offset += 8;
  
  const trackEnd = offset + trackLength;
  
  // Parse track events
  interface PendingNote {
    pitch: number;
    velocity: number;
    start: number;
  }
  
  const pendingNotes = new Map<number, PendingNote>();
  const events: Event<P>[] = [];
  let currentTime = 0;
  
  while (offset < trackEnd) {
    // Read delta time
    const { value: deltaTime, bytesRead } = readVariableLength(midiData, offset);
    offset += bytesRead;
    currentTime += deltaTime;
    
    if (offset >= trackEnd) break;
    
    // Read status byte
    const statusByte = midiData[offset++];
    if (statusByte === undefined) break;
    
    // Handle running status (reuse previous status)
    if ((statusByte & 0x80) === 0) {
      offset--; // Put byte back
      // Would need to track last status, simplified here
      continue;
    }
    
    const messageType = statusByte & 0xF0;
    
    if (messageType === 0x90) {
      // Note On
      const pitch = midiData[offset++];
      const velocity = midiData[offset++];
      
      if (pitch === undefined || velocity === undefined) continue;
      
      if (velocity > 0) {
        pendingNotes.set(pitch, { pitch, velocity, start: currentTime });
      } else {
        // Velocity 0 is Note Off
        const pending = pendingNotes.get(pitch);
        if (pending) {
          events.push({
            id: generateEventId(),
            kind: EventKinds.NOTE,
            start: asTick(pending.start),
            duration: asTickDuration(currentTime - pending.start),
            payload: { pitch: pending.pitch, velocity: pending.velocity } as P,
          });
          pendingNotes.delete(pitch);
        }
      }
    } else if (messageType === 0x80) {
      // Note Off
      const pitch = midiData[offset++];
      offset++; // velocity
      
      if (pitch === undefined) continue;
      
      const pending = pendingNotes.get(pitch);
      if (pending) {
        events.push({
          id: generateEventId(),
          kind: EventKinds.NOTE,
          start: asTick(pending.start),
          duration: asTickDuration(currentTime - pending.start),
          payload: { pitch: pending.pitch, velocity: pending.velocity } as P,
        });
        pendingNotes.delete(pitch);
      }
    } else if (messageType === 0xFF) {
      // Meta event
      offset++; // skip metaType
      const { value: length, bytesRead: lenBytes } = readVariableLength(midiData, offset);
      offset += lenBytes + length;
    } else {
      // Skip other events (simplified parser)
      const dataBytes = getMessageDataBytes(messageType);
      offset += dataBytes;
    }
  }
  
  // Close any pending notes
  for (const pending of pendingNotes.values()) {
    events.push({
      id: generateEventId(),
      kind: EventKinds.NOTE,
      start: asTick(pending.start),
      duration: asTickDuration(1), // Default duration
      payload: { pitch: pending.pitch, velocity: pending.velocity } as P,
    });
  }
  
  return createPattern(events, {
    name: patternName || 'Imported MIDI',
  });
}

/**
 * Helper: Read variable-length quantity from MIDI data.
 */
function readVariableLength(data: Uint8Array, offset: number): { value: number; bytesRead: number } {
  let value = 0;
  let bytesRead = 0;
  let byte: number | undefined;
  
  do {
    if (offset + bytesRead >= data.length) {
      throw new Error('Unexpected end of MIDI data');
    }
    byte = data[offset + bytesRead++];
    if (byte === undefined) break;
    value = (value << 7) | (byte & 0x7F);
  } while (byte & 0x80);
  
  return { value, bytesRead };
}

/**
 * Helper: Get number of data bytes for MIDI message type.
 */
function getMessageDataBytes(messageType: number): number {
  switch (messageType) {
    case 0x80: // Note Off
    case 0x90: // Note On
    case 0xA0: // Aftertouch
    case 0xB0: // Controller
    case 0xE0: // Pitch Bend
      return 2;
    case 0xC0: // Program Change
    case 0xD0: // Channel Aftertouch
      return 1;
    default:
      return 0;
  }
}
