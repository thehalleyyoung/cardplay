/**
 * @fileoverview State Module - Central shared state for CardPlay.
 * 
 * This module provides the unified state layer that all views read from
 * and write to. This is the foundation of the "four views of same data" model.
 * 
 * ## Usage
 * 
 * ```typescript
 * import {
 *   getSharedEventStore,
 *   getSelectionStore,
 *   getClipRegistry,
 *   getUndoStack,
 * } from '@cardplay/state';
 * 
 * // Get the shared event store
 * const store = getSharedEventStore();
 * const streamId = store.createStream('track-1-events');
 * 
 * // Subscribe to changes
 * store.subscribe(streamId, (events) => {
 *   console.log('Events updated:', events);
 * });
 * 
 * // Get selection state
 * const selection = getSelectionStore();
 * selection.select(streamId, [eventId1, eventId2]);
 * 
 * // Get clip registry
 * const clips = getClipRegistry();
 * const clipId = clips.createClip(streamId, 0, 4);
 * 
 * // Get undo stack
 * const undo = getUndoStack();
 * undo.push({
 *   type: 'event:add',
 *   description: 'Add note C4',
 *   undo: () => store.removeEvents(streamId, [noteId]),
 *   redo: () => store.addEvents(streamId, [note]),
 * });
 * ```
 * 
 * @module @cardplay/state
 */

import { resetSharedEventStore } from './event-store';
import { resetSelectionStore } from './selection-state';
import { resetClipRegistry } from './clip-registry';
import { getUndoStack, resetUndoStack } from './undo-stack';
import type { UndoActionType } from './types';

// Types
export type {
  EventStreamId,
  EventStreamRecord,
  SelectionState,
  ClipId,
  ClipRecord,
  RoutingNodeId,
  RoutingNode,
  RoutingConnection,
  RoutingGraph,
  SubscriptionId,
  UndoActionType,
  UndoAction,
  UndoBatch,
} from './types';

export type { EventId } from '../types/event-id';

export {
  createEventStreamRecord,
  createClipRecord,
  createEmptySelection,
  generateSubscriptionId,
} from './types';

// Event Store
export type {
  SharedEventStore,
} from './event-store';

export {
  createEventStore,
  createEventStore as createSharedEventStore,
  getSharedEventStore,
  resetSharedEventStore,
} from './event-store';

// Selection State
export type {
  SelectionCallback,
  SelectionStore,
} from './selection-state';

export {
  createSelectionStore,
  getSelectionStore,
  resetSelectionStore,
} from './selection-state';

// Clip Registry
export type {
  ClipRegistry,
  ClipCallback,
  ClipChangeType,
} from './clip-registry';

export {
  createClipRegistry,
  getClipRegistry,
  resetClipRegistry,
} from './clip-registry';

// Routing Graph
export type { RoutingGraphStore } from './routing-graph';

export {
  getRoutingGraph,
  resetRoutingGraph,
  /** @deprecated legacy export name */
  getRoutingGraph as getRoutingGraphStore,
} from './routing-graph';

// Undo Stack
export type {
  UndoStackCallback,
  CreateUndoActionOptions,
  UndoStack,
} from './undo-stack';

export {
  createUndoStack,
  getUndoStack,
  resetUndoStack,
} from './undo-stack';

// SSOT - Single Source of Truth utilities (Change 344)
export type {
  SSOTStores,
  ProjectResetCallback,
} from './ssot';

export {
  getSSOTStores,
  onProjectReset,
  resetProject,
  validateSSOTConsistency,
} from './ssot';

// ============================================================================
// CONVENIENCE RE-EXPORTS
// ============================================================================

/**
 * Resets all state stores (for testing).
 */
export function resetAllState(): void {
  resetSharedEventStore();
  resetSelectionStore();
  resetClipRegistry();
  resetUndoStack();
}

// ============================================================================
// INTEGRATION HELPERS
// ============================================================================

/**
 * Creates a standard edit operation with undo support.
 * 
 * @example
 * ```typescript
 * import { createEditOperation, getSharedEventStore, getUndoStack } from '@cardplay/state';
 * 
 * const store = getSharedEventStore();
 * const undo = getUndoStack();
 * 
 * // Add a note with undo support
 * const op = createEditOperation({
 *   description: 'Add note C4',
 *   execute: () => {
 *     const noteId = store.addEvents(streamId, [note])[0];
 *     return noteId;
 *   },
 *   undo: (noteId) => {
 *     store.removeEvents(streamId, [noteId]);
 *   },
 *   redo: (noteId) => {
 *     store.addEvents(streamId, [note]);
 *   },
 * });
 * 
 * const noteId = op.execute();
 * undo.push(op.toUndoAction(noteId));
 * ```
 */
export interface EditOperation<T> {
  readonly description: string;
  execute(): T;
  toUndoAction(result: T): {
    type: UndoActionType;
    description: string;
    undo: () => void;
    redo: () => void;
  };
}

export interface CreateEditOperationOptions<T> {
  readonly type?: UndoActionType;
  readonly description: string;
  readonly execute: () => T;
  readonly undo: (result: T) => void;
  readonly redo: (result: T) => void;
}

export function createEditOperation<T>(options: CreateEditOperationOptions<T>): EditOperation<T> {
  return {
    description: options.description,
    execute: options.execute,
    toUndoAction(result: T) {
      return {
        type: options.type ?? 'events-modify',
        description: options.description,
        undo: () => options.undo(result),
        redo: () => options.redo(result),
      };
    },
  };
}

/**
 * Helper to execute an operation with undo registration in one call.
 */
export function executeWithUndo<T>(options: CreateEditOperationOptions<T>): T {
  const undo = getUndoStack();
  
  const op = createEditOperation(options);
  const result = op.execute();
  undo.push(op.toUndoAction(result));
  
  return result;
}
