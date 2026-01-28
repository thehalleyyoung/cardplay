/**
 * @fileoverview Types barrel export.
 * 
 * @module @cardplay/core/types
 */

// Primitives
export {
  type Tick,
  type TickDuration,
  type MidiNote,
  type Velocity,
  type QuantizeMode,
  PPQ,
  asTick,
  asTickDuration,
  asMidiNote,
  asVelocity,
  addTicks,
  subtractTicks,
  tickDelta,
  quantizeTick,
  beatsToTicks,
  ticksToBeats,
  barsToTicks,
  ticksToBars,
  getGridSizes,
} from './primitives';

// Event ID
export {
  type EventId,
  generateEventId,
  asEventId,
  extractTimestamp,
  compareEventIds,
  NIL_EVENT_ID,
} from './event-id';

// Event Meta
export {
  type EventMeta,
  type LineageEntry,
  EMPTY_META,
  createEventMeta,
  addLineageEntry,
  mergeEventMeta,
} from './event-meta';

// Event Kind
export {
  type EventKind,
  type EventKindEntry,
  EventKinds,
  asEventKind,
  registerEventKind,
  getEventKindEntry,
  listEventKinds,
  isRegisteredKind,
} from './event-kind';

// Trigger
export {
  type Trigger,
  type TriggerOffsetMode,
  type CreateTriggerOptions,
  createTrigger,
  createAbsoluteTrigger,
  createRelativeTrigger,
  createFromEndTrigger,
  resolveTriggerTick,
  isTriggerInBounds,
  adjustTriggerForResize,
  cloneTrigger,
} from './trigger';

// Lane
export {
  type Lane,
  type Point,
  type Target,
  type Interpolation,
  type Control,
  type AutomationLane,
  type Expression,
  type Modulation,
  type ModulationLane,
  type ExpressionLane,
  type BlendMode,
  type AutomationPayload,
  asControl,
  clampControl,
  createLane,
  createPoint,
  laneValueAt,
  addPointToLane,
  removePointFromLane,
  laneSlice,
  laneMerge,
  laneQuantize,
  laneSimplify,
  laneBounds,
  createExpression,
  createModulation,
  applyModulation,
  combineModulations,
  laneToEvents,
  eventsToLane,
} from './lane';

// Event
export {
  type Event,
  type CreateEventOptions,
  isEvent,
  createEvent,
  createNoteEvent,
  cloneEvent,
  updateEvent,
  updateEventPayload,
  eventEnd,
  eventMidpoint,
  isInstantaneous,
  eventEquals,
  eventIdEquals,
  eventPositionEquals,
} from './event';
