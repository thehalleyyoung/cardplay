/**
 * @fileoverview Events barrel export.
 * 
 * @module @cardplay/core/events
 */

export {
  // Temporal queries
  eventOverlaps,
  eventContains,
  eventContainsTick,
  getOverlapDuration,
  getEventGap,
  eventsAdjacent,
  // Operations
  splitEvent,
  mergeEvents,
  stretchEvent,
  shiftEvent,
  quantizeEvent,
  normalizeEvent,
  resizeEvent,
  trimEvent,
  moveEvent,
  // Comparison
  compareEventsByStart,
  compareEventsByEnd,
  compareEventsByDuration,
  // Types
  type StretchAnchor,
  type QuantizeOptions,
} from './operations';

export {
  // Serialization
  eventToJSON,
  eventFromJSON,
  eventsToJSON,
  eventsFromJSON,
  eventToJSONString,
  eventFromJSONString,
  // Types
  type EventJSON,
  type TriggerJSON,
  type LaneJSON,
  type PointJSON,
  type EventMetaJSON,
  type SerializeOptions,
  type DeserializeOptions,
} from './serialization';
