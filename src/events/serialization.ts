/**
 * @fileoverview JSON serialization for events.
 * 
 * @module @cardplay/core/events/serialization
 * @see cardplay2.md Section 1.1
 */

import { asTick, asTickDuration } from '../types/primitives';
import { asEventId } from '../types/event-id';
import { type EventMeta } from '../types/event-meta';
import { asEventKind, getEventKindEntry } from '../types/event-kind';
import { type Trigger, createTrigger, type TriggerOffsetMode } from '../types/trigger';
import { type Event, createEvent } from '../types/event';
import { type Lane, type Control, type Point, type Interpolation, type Target } from '../types/lane';

// ============================================================================
// JSON TYPES
// ============================================================================

/**
 * JSON representation of an Event.
 */
export interface EventJSON {
  id: string;
  kind: string;
  start: number;
  duration: number;
  payload: unknown;
  triggers?: TriggerJSON[];
  automation?: LaneJSON[];
  tags?: string[];
  meta?: EventMetaJSON;
}

/**
 * JSON representation of a Trigger.
 */
export interface TriggerJSON {
  offset: number;
  offsetMode: string;
  action: string;
  payload?: unknown;
  priority?: number;
  enabled?: boolean;
}

/**
 * JSON representation of a Lane.
 */
export interface LaneJSON {
  target: TargetJSON;
  points: PointJSON[];
  interpolation?: string;
  bypassed?: boolean;
  color?: string;
  name?: string;
}

/**
 * JSON representation of a Target.
 */
export interface TargetJSON {
  path: string;
  min?: number;
  max?: number;
  default?: unknown;
  unit?: string;
}

/**
 * JSON representation of a Point.
 */
export interface PointJSON {
  tick: number;
  value: unknown;
  interpolation?: string;
  curve?: number;
  controlPoints?: [number, number, number, number];
  locked?: boolean;
}

/**
 * JSON representation of EventMeta.
 */
export interface EventMetaJSON {
  label?: string;
  color?: string;
  sourceCardId?: string;
  sourceContainerId?: string;
  author?: string;
  payloadSchemaId?: string;
  lineage?: Array<{
    cardId: string;
    timestamp: number;
    description?: string;
  }>;
}

// ============================================================================
// SERIALIZATION
// ============================================================================

/**
 * Serialization options.
 */
export interface SerializeOptions {
  /** Include metadata */
  includeMeta?: boolean;
  /** Pretty print */
  pretty?: boolean;
}

/**
 * Serializes an event to JSON.
 */
export function eventToJSON<P>(
  event: Event<P>,
  options: SerializeOptions = {}
): EventJSON {
  const { includeMeta = true } = options;
  
  const json: EventJSON = {
    id: event.id,
    kind: event.kind,
    start: event.start,
    duration: event.duration,
    payload: event.payload,
  };
  
  if (event.triggers && event.triggers.length > 0) {
    json.triggers = event.triggers.map(triggerToJSON);
  }
  
  if (event.automation && event.automation.length > 0) {
    json.automation = event.automation.map(laneToJSON);
  }
  
  if (event.tags && event.tags.size > 0) {
    json.tags = Array.from(event.tags);
  }
  
  if (includeMeta && event.meta) {
    json.meta = metaToJSON(event.meta);
  }
  
  return json;
}

/**
 * Serializes a trigger to JSON.
 */
function triggerToJSON<P>(trigger: Trigger<P>): TriggerJSON {
  const json: TriggerJSON = {
    offset: trigger.offset,
    offsetMode: trigger.offsetMode,
    action: trigger.action,
  };
  
  if (trigger.payload !== undefined) {
    json.payload = trigger.payload;
  }
  if (trigger.priority !== undefined) {
    json.priority = trigger.priority;
  }
  if (trigger.enabled !== true) {
    json.enabled = trigger.enabled;
  }
  
  return json;
}

/**
 * Serializes a lane to JSON.
 */
function laneToJSON<T>(lane: Lane<T>): LaneJSON {
  const json: LaneJSON = {
    target: {
      path: lane.target.path,
    },
    points: lane.points.map(pointToJSON),
  };
  
  if (lane.target.min !== undefined) json.target.min = lane.target.min;
  if (lane.target.max !== undefined) json.target.max = lane.target.max;
  if (lane.target.default !== undefined) json.target.default = lane.target.default;
  if (lane.target.unit !== undefined) json.target.unit = lane.target.unit;
  
  if (lane.interpolation !== undefined) json.interpolation = lane.interpolation;
  if (lane.bypassed !== undefined) json.bypassed = lane.bypassed;
  if (lane.color !== undefined) json.color = lane.color;
  if (lane.name !== undefined) json.name = lane.name;
  
  return json;
}

/**
 * Serializes a point to JSON.
 */
function pointToJSON<T>(point: Point<T>): PointJSON {
  const json: PointJSON = {
    tick: point.tick,
    value: point.value,
  };
  
  if (point.interpolation !== undefined) json.interpolation = point.interpolation;
  if (point.curve !== undefined) json.curve = point.curve;
  if (point.controlPoints !== undefined) json.controlPoints = [...point.controlPoints];
  if (point.locked !== undefined) json.locked = point.locked;
  
  return json;
}

/**
 * Serializes metadata to JSON.
 */
function metaToJSON(meta: EventMeta): EventMetaJSON {
  const json: EventMetaJSON = {};
  
  if (meta.label !== undefined) json.label = meta.label;
  if (meta.color !== undefined) json.color = meta.color;
  if (meta.sourceCardId !== undefined) json.sourceCardId = meta.sourceCardId;
  if (meta.sourceContainerId !== undefined) json.sourceContainerId = meta.sourceContainerId;
  if (meta.author !== undefined) json.author = meta.author;
  if (meta.payloadSchemaId !== undefined) json.payloadSchemaId = meta.payloadSchemaId;
  if (meta.lineage !== undefined) {
    json.lineage = meta.lineage.map(entry => ({
      cardId: entry.cardId,
      timestamp: entry.timestamp,
      ...(entry.description !== undefined && { description: entry.description }),
    }));
  }
  
  return json;
}

// ============================================================================
// DESERIALIZATION
// ============================================================================

/**
 * Deserialization options.
 */
export interface DeserializeOptions {
  /** Validate event kind is registered */
  validateKind?: boolean;
  /** Schema for payload validation */
  payloadSchema?: unknown;
}

/**
 * Deserializes an event from JSON.
 */
export function eventFromJSON<P>(
  json: EventJSON,
  options: DeserializeOptions = {}
): Event<P> {
  const { validateKind = false } = options;
  
  // Validate required fields
  if (typeof json.id !== 'string') {
    throw new TypeError('Event id must be a string');
  }
  if (typeof json.kind !== 'string') {
    throw new TypeError('Event kind must be a string');
  }
  if (typeof json.start !== 'number' || json.start < 0) {
    throw new TypeError('Event start must be a non-negative number');
  }
  if (typeof json.duration !== 'number' || json.duration < 0) {
    throw new TypeError('Event duration must be a non-negative number');
  }
  
  const kind = asEventKind(json.kind);
  
  if (validateKind && !getEventKindEntry(kind)) {
    throw new TypeError(`Unknown event kind: ${json.kind}`);
  }
  
  const createOptions: Parameters<typeof createEvent<P>>[0] = {
    id: asEventId(json.id),
    kind,
    start: asTick(json.start),
    duration: asTickDuration(json.duration),
    payload: json.payload as P,
  };
  
  if (json.triggers) {
    createOptions.triggers = json.triggers.map(t => triggerFromJSON<P>(t));
  }
  
  if (json.automation) {
    createOptions.automation = json.automation.map(l => laneFromJSON<Control>(l));
  }
  
  if (json.tags) {
    createOptions.tags = json.tags;
  }
  
  if (json.meta) {
    createOptions.meta = metaFromJSON(json.meta);
  }
  
  return createEvent(createOptions);
}

/**
 * Deserializes a trigger from JSON.
 */
function triggerFromJSON<P>(json: TriggerJSON): Trigger<P> {
  const options: {
    offset: number;
    offsetMode: TriggerOffsetMode;
    action: string;
    payload: P;
    priority?: number;
    enabled?: boolean;
  } = {
    offset: json.offset,
    offsetMode: json.offsetMode as TriggerOffsetMode,
    action: json.action,
    payload: json.payload as P,
  };
  
  if (json.priority !== undefined) options.priority = json.priority;
  if (json.enabled !== undefined) options.enabled = json.enabled;
  
  return createTrigger<P>(options);
}

/**
 * Deserializes a lane from JSON.
 */
function laneFromJSON<T>(json: LaneJSON): Lane<T> {
  const target: Target<T> = {
    path: json.target.path,
  };
  if (json.target.min !== undefined) (target as { min: number }).min = json.target.min;
  if (json.target.max !== undefined) (target as { max: number }).max = json.target.max;
  if (json.target.default !== undefined) (target as { default: T }).default = json.target.default as T;
  if (json.target.unit !== undefined) (target as { unit: string }).unit = json.target.unit;
  
  const points: Point<T>[] = json.points.map(p => {
    const point: Point<T> = {
      tick: asTick(p.tick),
      value: p.value as T,
    };
    if (p.interpolation !== undefined) (point as { interpolation: Interpolation }).interpolation = p.interpolation as Interpolation;
    if (p.curve !== undefined) (point as { curve: number }).curve = p.curve;
    if (p.controlPoints !== undefined) (point as { controlPoints: readonly [number, number, number, number] }).controlPoints = [...p.controlPoints];
    if (p.locked !== undefined) (point as { locked: boolean }).locked = p.locked;
    return point;
  });
  
  const lane: Lane<T> = {
    target,
    points,
  };
  
  if (json.interpolation !== undefined) (lane as { interpolation: Interpolation }).interpolation = json.interpolation as Interpolation;
  if (json.bypassed !== undefined) (lane as { bypassed: boolean }).bypassed = json.bypassed;
  if (json.color !== undefined) (lane as { color: string }).color = json.color;
  if (json.name !== undefined) (lane as { name: string }).name = json.name;
  
  return lane;
}

/**
 * Deserializes metadata from JSON.
 */
function metaFromJSON(json: EventMetaJSON): EventMeta {
  const meta: EventMeta = {};
  
  if (json.label !== undefined) (meta as { label: string }).label = json.label;
  if (json.color !== undefined) (meta as { color: string }).color = json.color;
  if (json.sourceCardId !== undefined) (meta as { sourceCardId: string }).sourceCardId = json.sourceCardId;
  if (json.sourceContainerId !== undefined) (meta as { sourceContainerId: string }).sourceContainerId = json.sourceContainerId;
  if (json.author !== undefined) (meta as { author: string }).author = json.author;
  if (json.payloadSchemaId !== undefined) (meta as { payloadSchemaId: string }).payloadSchemaId = json.payloadSchemaId;
  if (json.lineage !== undefined) {
    (meta as { lineage: EventMeta['lineage'] }).lineage = json.lineage.map(entry => {
      const lineageEntry: { cardId: string; timestamp: number; description?: string } = {
        cardId: entry.cardId,
        timestamp: entry.timestamp,
      };
      if (entry.description !== undefined) lineageEntry.description = entry.description;
      return lineageEntry;
    });
  }
  
  return meta;
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Serializes multiple events to JSON.
 */
export function eventsToJSON<P>(
  events: readonly Event<P>[],
  options: SerializeOptions = {}
): EventJSON[] {
  return events.map(e => eventToJSON(e, options));
}

/**
 * Deserializes multiple events from JSON.
 */
export function eventsFromJSON<P>(
  jsonArray: EventJSON[],
  options: DeserializeOptions = {}
): Event<P>[] {
  return jsonArray.map(json => eventFromJSON<P>(json, options));
}

/**
 * Serializes an event to a JSON string.
 */
export function eventToJSONString<P>(
  event: Event<P>,
  options: SerializeOptions = {}
): string {
  const json = eventToJSON(event, options);
  return options.pretty ? JSON.stringify(json, null, 2) : JSON.stringify(json);
}

/**
 * Deserializes an event from a JSON string.
 */
export function eventFromJSONString<P>(
  jsonString: string,
  options: DeserializeOptions = {}
): Event<P> {
  const json = JSON.parse(jsonString) as EventJSON;
  return eventFromJSON<P>(json, options);
}
