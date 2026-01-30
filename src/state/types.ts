/**
 * @fileoverview State module types.
 * 
 * Core types for the shared state system that enables
 * cross-view synchronization and unified data management.
 * 
 * @module @cardplay/state/types
 */

import type { Event } from '../types/event';
export type { EventId } from '../types/event-id';
import type { ContainerId } from '../containers/container';
import { type Tick, asTick } from '../types/primitives';

// ============================================================================
// EVENT STREAM TYPES
// ============================================================================

/**
 * Unique identifier for an event stream in the store.
 */
export type EventStreamId = string & { readonly __eventStreamId?: unique symbol };

/**
 * Creates a typed EventStreamId.
 */
export function asEventStreamId(id: string): EventStreamId {
  return id as EventStreamId;
}

/**
 * Generates a unique EventStreamId.
 */
export function generateEventStreamId(): EventStreamId {
  return `stream_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` as EventStreamId;
}

/**
 * Record of an event stream stored in the SharedEventStore.
 */
export interface EventStreamRecord<P = unknown> {
  /** Unique stream identifier */
  readonly id: EventStreamId;
  /** Human-readable name */
  readonly name: string;
  /** Events in temporal order */
  readonly events: readonly Event<P>[];
  /** Associated container ID (if any) */
  readonly containerId?: ContainerId;
  /** Display color */
  readonly color?: string;
  /** Whether stream is muted */
  readonly muted: boolean;
  /** Whether stream is soloed */
  readonly soloed: boolean;
  /** Whether stream is locked (prevent edits) */
  readonly locked: boolean;
  /** Stream metadata */
  readonly meta?: EventStreamMeta;
  /** Last modified timestamp */
  readonly lastModified: number;
}

/**
 * Stream metadata.
 */
export interface EventStreamMeta {
  /** Source card ID that generated this stream */
  readonly sourceCardId?: string;
  /** Whether events are generated (vs user-created) */
  readonly generated?: boolean;
  /** Instrument/sound this stream is associated with */
  readonly instrument?: string;
  /** MIDI channel (0-15) */
  readonly midiChannel?: number;
}

/**
 * Options for creating an event stream record.
 */
export interface CreateEventStreamOptions<P = unknown> {
  readonly id?: EventStreamId;
  readonly name: string;
  readonly events?: readonly Event<P>[];
  readonly containerId?: ContainerId;
  readonly color?: string;
  readonly muted?: boolean;
  readonly soloed?: boolean;
  readonly locked?: boolean;
  readonly meta?: EventStreamMeta;
}

/**
 * Creates a new EventStreamRecord with defaults.
 */
export function createEventStreamRecord<P = unknown>(
  options: CreateEventStreamOptions<P>
): EventStreamRecord<P> {
  return {
    id: options.id ?? generateEventStreamId(),
    name: options.name,
    events: options.events ?? [],
    ...(options.containerId !== undefined && { containerId: options.containerId }),
    ...(options.color !== undefined && { color: options.color }),
    muted: options.muted ?? false,
    soloed: options.soloed ?? false,
    locked: options.locked ?? false,
    ...(options.meta !== undefined && { meta: options.meta }),
    lastModified: Date.now(),
  };
}

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

/**
 * Unique identifier for a subscription.
 */
export type SubscriptionId = string & { readonly __subscriptionId?: unique symbol };

/**
 * Generates a unique SubscriptionId.
 */
export function generateSubscriptionId(): SubscriptionId {
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` as SubscriptionId;
}

/**
 * Callback for stream change notifications.
 */
export type EventStreamCallback<P = unknown> = (
  stream: EventStreamRecord<P>,
  changeType: StreamChangeType
) => void;

/**
 * Type of change that occurred to a stream.
 */
export type StreamChangeType =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'events-added'
  | 'events-removed'
  | 'events-modified'
  | 'meta-changed';

/**
 * Subscription to stream changes.
 */
export interface EventStreamSubscription {
  readonly id: SubscriptionId;
  readonly streamId: EventStreamId | '*';  // '*' = all streams
  readonly callback: EventStreamCallback;
  readonly active: boolean;
}

// ============================================================================
// SELECTION TYPES
// ============================================================================

/**
 * Set of selected event IDs.
 */
export type SelectionSet = ReadonlySet<string>;

/**
 * Selection state for cross-view synchronization.
 */
export interface SelectionState {
  /** Currently selected event IDs */
  readonly selected: SelectionSet;
  /** Primary (focus) event ID */
  readonly primary: string | null;
  /** Stream ID the selection belongs to */
  readonly streamId: EventStreamId | null;
  /** Selection anchor for shift-click selection */
  readonly anchor: string | null;
}

/**
 * Creates an empty SelectionState.
 */
export function createEmptySelection(): SelectionState {
  return {
    selected: new Set(),
    primary: null,
    streamId: null,
    anchor: null,
  };
}

// ============================================================================
// UNDO TYPES
// ============================================================================

/**
 * Types of undoable actions.
 */
export type UndoActionType =
  | 'stream-create'
  | 'stream-delete'
  | 'stream-update'
  | 'events-add'
  | 'events-remove'
  | 'events-modify'
  | 'event:add'
  | 'event:delete'
  | 'event:update'
  | 'clip-create'
  | 'clip-delete'
  | 'clip-update'
  | 'clip:place'
  | 'clip:remove'
  | 'clip:move'
  | 'automation:add'
  | 'automation:move'
  | 'automation:remove'
  | 'sample:trigger'
  | 'selection-change'
  | 'routing:add-node'
  | 'routing:remove-node'
  | 'routing:update-node'
  | 'routing:connect'
  | 'routing:disconnect'
  | 'routing:disconnect-node'
  | 'batch';

/**
 * An undoable action.
 */
export interface UndoAction {
  readonly type: UndoActionType;
  readonly timestamp: number;
  readonly description: string;
  readonly undo: () => void;
  readonly redo: () => void;
}

/**
 * Batch of undoable actions (treated as single undo step).
 */
export interface UndoBatch extends UndoAction {
  readonly type: 'batch';
  readonly actions: readonly UndoAction[];
}

// ============================================================================
// CLIP TYPES
// ============================================================================

/**
 * Unique identifier for a clip in the registry.
 */
export type ClipId = string & { readonly __clipId?: unique symbol };

/**
 * Generates a unique ClipId.
 */
export function generateClipId(): ClipId {
  return `clip_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` as ClipId;
}

/**
 * Record of a clip stored in the ClipRegistry.
 */
export interface ClipRecord {
  /** Unique clip identifier */
  readonly id: ClipId;
  /** Human-readable name */
  readonly name: string;
  /** Event stream this clip references */
  readonly streamId: EventStreamId;
  /** @deprecated legacy: clip start tick */
  readonly startTick: Tick;
  /** Clip duration in ticks */
  readonly duration: Tick;
  /** @deprecated legacy alias for duration */
  readonly length: Tick;
  /** @deprecated legacy alias for duration */
  readonly lengthTicks: Tick;
  /** Display color */
  readonly color?: string;
  /** Whether clip loops */
  readonly loop: boolean;
  /** @deprecated legacy alias for loop */
  readonly loopEnabled: boolean;
  /** Loop start offset (for partial loops) */
  readonly loopStart?: Tick;
  /** Loop end offset */
  readonly loopEnd?: Tick;
  /** Playback speed multiplier */
  readonly speed: number;
  /** Pitch shift in semitones */
  readonly pitchShift: number;
  /** Last modified timestamp */
  readonly lastModified: number;
}

/**
 * Options for creating a clip record.
 */
export interface CreateClipOptions {
  readonly name: string;
  readonly streamId: EventStreamId;
  readonly duration?: Tick;
  /** @deprecated legacy: clip start tick */
  readonly startTick?: Tick;
  /** @deprecated legacy alias for duration */
  readonly length?: Tick;
  /** @deprecated legacy alias for duration */
  readonly lengthTicks?: Tick;
  readonly color?: string;
  readonly loop?: boolean;
  /** @deprecated legacy alias for loop */
  readonly loopEnabled?: boolean;
  readonly loopStart?: Tick;
  readonly loopEnd?: Tick;
  readonly speed?: number;
  readonly pitchShift?: number;
}

/**
 * Creates a new ClipRecord with defaults.
 */
export function createClipRecord(options: CreateClipOptions): ClipRecord {
  const duration = options.duration ?? options.lengthTicks ?? options.length ?? asTick(0);
  const loop = options.loop ?? options.loopEnabled ?? false;

  return {
    id: generateClipId(),
    name: options.name,
    streamId: options.streamId,
    startTick: options.startTick ?? asTick(0),
    duration,
    length: duration,
    lengthTicks: duration,
    ...(options.color !== undefined && { color: options.color }),
    loop,
    loopEnabled: loop,
    ...(options.loopStart !== undefined && { loopStart: options.loopStart }),
    ...(options.loopEnd !== undefined && { loopEnd: options.loopEnd }),
    speed: options.speed ?? 1.0,
    pitchShift: options.pitchShift ?? 0,
    lastModified: Date.now(),
  };
}

// ============================================================================
// ROUTING TYPES
// ============================================================================

/** @deprecated legacy alias */
export type RoutingNodeId = string;

/**
 * Node in the shared routing graph.
 */
export interface RoutingNode {
  readonly id: string;
  readonly cardId: string;
  readonly type: 'instrument' | 'effect' | 'mixer' | 'send' | 'return' | 'master';
  readonly position: { x: number; y: number };
  readonly enabled: boolean;
  readonly bypassed: boolean;
}

/**
 * Connection in the shared routing graph.
 */
export interface RoutingConnection {
  readonly id: string;
  readonly sourceId: string;
  readonly sourcePort: string;
  readonly targetId: string;
  readonly targetPort: string;
  readonly type: 'audio' | 'midi' | 'modulation' | 'sidechain';
  readonly gain: number;
}

/**
 * Edge in the routing graph (alias with from/to naming).
 * Used by routing-graph.ts for backwards compatibility.
 */
export interface RoutingEdge {
  readonly id: string;
  readonly from: string;
  readonly to: string;
}

/**
 * Shared routing graph structure.
 */
export interface RoutingGraph {
  readonly nodes: ReadonlyMap<string, RoutingNode>;
  readonly connections: ReadonlyMap<string, RoutingConnection>;
  readonly lastModified: number;
}

/**
 * Creates an empty routing graph.
 */
export function createEmptyRoutingGraph(): RoutingGraph {
  return {
    nodes: new Map(),
    connections: new Map(),
    lastModified: Date.now(),
  };
}

// ============================================================================
// COLLABORATION TYPES (Change 340)
// ============================================================================

/**
 * Types of changes for collaboration/export metadata.
 * 
 * These are DISTINCT from DeckType values to avoid confusion.
 * Use these when tracking change history for export/sync.
 */
export type ExportChangeType =
  | 'export:stream-added'
  | 'export:stream-removed'
  | 'export:stream-modified'
  | 'export:clip-added'
  | 'export:clip-removed'
  | 'export:clip-modified'
  | 'export:routing-added'
  | 'export:routing-removed'
  | 'export:routing-modified'
  | 'export:spec-updated'
  | 'export:settings-changed'
  | 'export:undo-checkpoint';

/**
 * Metadata for an export change record.
 */
export interface ExportChangeRecord {
  readonly type: ExportChangeType;
  readonly timestamp: number;
  readonly entityId: string;
  readonly description: string;
  readonly userId?: string;
  readonly sessionId?: string;
}

