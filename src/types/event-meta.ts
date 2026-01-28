/**
 * @fileoverview EventMeta type for event metadata and lineage tracking.
 * 
 * @module @cardplay/core/types/event-meta
 * @see cardplay2.md Section 1.1 - EventMeta
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Lineage entry tracking event transformations.
 */
export interface LineageEntry {
  /** Card that created/modified this event */
  readonly cardId: string;
  /** Timestamp of the transformation */
  readonly timestamp: number;
  /** Optional description of the transformation */
  readonly description?: string;
}

/**
 * Metadata associated with an event.
 * 
 * Provides:
 * - Visual properties (label, color)
 * - Origin tracking (sourceCardId, sourceContainerId)
 * - Transformation history (lineage)
 * - Schema validation reference (payloadSchemaId)
 */
export interface EventMeta {
  /** Human-readable label */
  readonly label?: string;
  /** Display color (CSS color string) */
  readonly color?: string;
  /** ID of the card that created this event */
  readonly sourceCardId?: string;
  /** ID of the container this event belongs to */
  readonly sourceContainerId?: string;
  /** Author/creator identifier */
  readonly author?: string;
  /** Schema ID for payload validation */
  readonly payloadSchemaId?: string;
  /** Transformation history */
  readonly lineage?: readonly LineageEntry[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Empty metadata object.
 */
export const EMPTY_META: EventMeta = Object.freeze({});

// ============================================================================
// FACTORIES
// ============================================================================

/**
 * Creates EventMeta with the given properties.
 */
export function createEventMeta(props: Partial<EventMeta> = {}): EventMeta {
  const meta: EventMeta = {};
  
  if (props.label !== undefined) (meta as { label: string }).label = props.label;
  if (props.color !== undefined) (meta as { color: string }).color = props.color;
  if (props.sourceCardId !== undefined) (meta as { sourceCardId: string }).sourceCardId = props.sourceCardId;
  if (props.sourceContainerId !== undefined) (meta as { sourceContainerId: string }).sourceContainerId = props.sourceContainerId;
  if (props.author !== undefined) (meta as { author: string }).author = props.author;
  if (props.payloadSchemaId !== undefined) (meta as { payloadSchemaId: string }).payloadSchemaId = props.payloadSchemaId;
  if (props.lineage !== undefined) (meta as { lineage: readonly LineageEntry[] }).lineage = [...props.lineage];
  
  return Object.freeze(meta);
}

/**
 * Adds a lineage entry to metadata.
 */
export function addLineageEntry(
  meta: EventMeta,
  cardId: string,
  description?: string
): EventMeta {
  const entry: LineageEntry = {
    cardId,
    timestamp: Date.now(),
  };
  if (description !== undefined) {
    (entry as { description: string }).description = description;
  }
  
  return createEventMeta({
    ...meta,
    lineage: [...(meta.lineage ?? []), entry],
  });
}

/**
 * Merges two EventMeta objects.
 */
export function mergeEventMeta(a: EventMeta, b: EventMeta): EventMeta {
  return createEventMeta({
    ...a,
    ...b,
    lineage: [...(a.lineage ?? []), ...(b.lineage ?? [])],
  });
}
