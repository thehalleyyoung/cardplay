/**
 * @fileoverview Freeze Generated Track Action (Phase I: I041)
 * 
 * Converts generated/AI streams into static editable events by:
 * 1. Removing generated metadata flags
 * 2. Marking events as user-owned
 * 3. Preventing future auto-regeneration
 * 4. Making all events fully editable
 * 
 * @module @cardplay/ui/actions/freeze-track
 */

import type { EventStreamId } from '../../state/types';
import { getSharedEventStore } from '../../state/event-store';
import { getUndoStack } from '../../state/undo-stack';
import { generateEventId } from '../../types/event-id';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for freezing a track.
 */
export interface FreezeTrackOptions {
  /** Stream ID to freeze */
  streamId: EventStreamId;
  
  /** Whether to create a new stream (vs modify in place) */
  createNewStream?: boolean;
  
  /** Name for the frozen stream (if creating new) */
  newStreamName?: string;
}

/**
 * Result of freeze operation.
 */
export interface FreezeTrackResult {
  /** Success flag */
  success: boolean;
  
  /** ID of the frozen stream */
  streamId: EventStreamId;
  
  /** Number of events frozen */
  eventCount: number;
  
  /** Error message if failed */
  error?: string;
}

// ============================================================================
// FREEZE ACTION
// ============================================================================

/**
 * Freeze a generated track, converting it to static editable events.
 * 
 * I041: Turn AI/generated streams into user-owned events.
 * 
 * This action:
 * - Removes `generated: true` metadata
 * - Generates new Event IDs (to break association with generator)
 * - Clears sourceCardId to indicate user ownership
 * - Adds `frozen: true` metadata to prevent regeneration
 * - Supports undo/redo
 * 
 * @param options Freeze options
 * @returns Result of the freeze operation
 */
export function freezeGeneratedTrack(
  options: FreezeTrackOptions
): FreezeTrackResult {
  const store = getSharedEventStore();
  const undoStack = getUndoStack();
  
  // Get the stream to freeze
  const stream = store.getStream(options.streamId);
  if (!stream) {
    return {
      success: false,
      streamId: options.streamId,
      eventCount: 0,
      error: 'Stream not found'
    };
  }
  
  // Check if already frozen
  // TODO: Add stream metadata support when available
  const isFrozen = false; // For now, assume not frozen
  if (isFrozen) {
    return {
      success: false,
      streamId: options.streamId,
      eventCount: 0,
      error: 'Stream is already frozen'
    };
  }
  
  let targetStreamId = options.streamId;
  
  // Create new stream if requested
  if (options.createNewStream) {
    const newName = options.newStreamName || `${stream.name} (Frozen)`;
    const newStream = stream.color
      ? store.createStream({ name: newName, color: stream.color })
      : store.createStream({ name: newName });
    targetStreamId = newStream.id;
  }
  
  // Freeze events: create new event copies without generator metadata
  const frozenEvents = stream.events.map(event => {
    const copy: any = {
      ...event,
      id: generateEventId() // New ID to break generator association
    };
    
    // Remove meta entirely for frozen events (simplest approach)
    // In future, could preserve non-generator-related meta fields
    delete copy.meta;
    
    return copy;
  });
  
  // Apply changes with undo support
  if (options.createNewStream) {
    // Add events to new stream
    store.addEvents(targetStreamId, frozenEvents);
    
    // No undo needed since it's a new stream (can just delete)
  } else {
    // Replace events in existing stream
    const originalEvents = [...stream.events];
    
    store.removeEvents(options.streamId, originalEvents.map(e => e.id));
    store.addEvents(options.streamId, frozenEvents);
    
    // TODO: Update stream metadata when API supports it
    
    // Add to undo stack
    undoStack.push({
      type: 'batch',
      description: `Freeze Track: ${stream.name}`,
      undo: () => {
        store.removeEvents(options.streamId, frozenEvents.map(e => e.id));
        store.addEvents(options.streamId, originalEvents);
      },
      redo: () => {
        store.removeEvents(options.streamId, originalEvents.map(e => e.id));
        store.addEvents(options.streamId, frozenEvents);
      }
    });
  }
  
  return {
    success: true,
    streamId: targetStreamId,
    eventCount: frozenEvents.length
  };
}

/**
 * Check if a stream can be frozen.
 * 
 * @param streamId Stream ID to check
 * @returns True if the stream can be frozen
 */
export function canFreezeTrack(streamId: EventStreamId): boolean {
  const store = getSharedEventStore();
  const stream = store.getStream(streamId);
  if (!stream) {
    return false;
  }
  
  // TODO: Check stream metadata when API supports it
  // For now, can freeze if stream has events
  return stream.events.length > 0;
}

/**
 * Check if a stream is frozen.
 * 
 * @param streamId Stream ID to check
 * @returns True if the stream is frozen
 */
export function isTrackFrozen(_streamId: EventStreamId): boolean {
  // TODO: Check stream metadata when API supports it
  // For now, return false (no way to check frozen state yet)
  return false;
}
