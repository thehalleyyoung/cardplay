/**
 * @fileoverview Undo Stack - Unified undo/redo across all views.
 * 
 * All editors use this central undo stack, so undo works regardless
 * of which view made the change.
 * 
 * @module @cardplay/state/undo-stack
 */

import type {
  UndoAction,
  UndoBatch,
  UndoActionType,
  SubscriptionId,
} from './types';
import { generateSubscriptionId } from './types';

// ============================================================================
// UNDO STACK INTERFACE
// ============================================================================

/**
 * Callback for undo stack change notifications.
 */
export type UndoStackCallback = (canUndo: boolean, canRedo: boolean) => void;

/**
 * Options for creating an undo action.
 */
export interface CreateUndoActionOptions {
  readonly type: UndoActionType;
  readonly description: string;
  readonly undo: () => void;
  readonly redo: () => void;
}

/**
 * UndoStack provides centralized undo/redo functionality.
 */
export interface UndoStack {
  /**
   * Pushes an action onto the undo stack.
   */
  push(action: CreateUndoActionOptions): void;
  
  /**
   * Undoes the last action.
   */
  undo(): boolean;
  
  /**
   * Redoes the last undone action.
   */
  redo(): boolean;
  
  /**
   * Returns true if undo is available.
   */
  canUndo(): boolean;
  
  /**
   * Returns true if redo is available.
   */
  canRedo(): boolean;
  
  /**
   * Gets the description of the next undo action.
   */
  getUndoDescription(): string | null;
  
  /**
   * Gets the description of the next redo action.
   */
  getRedoDescription(): string | null;
  
  /**
   * Gets undo history (most recent first).
   */
  getUndoHistory(limit?: number): readonly UndoAction[];
  
  /**
   * Gets redo history (most recent first).
   */
  getRedoHistory(limit?: number): readonly UndoAction[];
  
  /**
   * Clears all undo/redo history.
   */
  clear(): void;
  
  /**
   * Begins a batch operation (multiple actions as one undo step).
   */
  beginBatch(description: string): void;
  
  /**
   * Commits a batch operation.
   */
  commitBatch(): void;

  /** @deprecated legacy alias for commitBatch() */
  endBatch(): void;
  
  /**
   * Cancels a batch operation.
   */
  cancelBatch(): void;
  
  /**
   * Returns true if currently in a batch operation.
   */
  isInBatch(): boolean;
  
  /**
   * Subscribes to undo stack changes.
   */
  subscribe(callback: UndoStackCallback): SubscriptionId;
  
  /**
   * Unsubscribes from undo stack changes.
   */
  unsubscribe(subscriptionId: SubscriptionId): boolean;
  
  /**
   * Gets the current state of the undo stack.
   * @returns Object with past, present, future actions and can undo/redo flags
   */
  getState(): {
    past: readonly UndoAction[];
    present: UndoAction | null;
    future: readonly UndoAction[];
    canUndo: boolean;
    canRedo: boolean;
  };
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/**
 * Maximum undo history size.
 */
const MAX_UNDO_HISTORY = 100;

/**
 * Creates a new UndoStack instance.
 */
export function createUndoStack(): UndoStack {
  const undoStack: UndoAction[] = [];
  const redoStack: UndoAction[] = [];
  const subscriptions = new Map<SubscriptionId, UndoStackCallback>();
  
  // Batch state
  let batchDescription: string | null = null;
  let batchActions: UndoAction[] = [];
  
  function notify(): void {
    const canUndoNow = undoStack.length > 0;
    const canRedoNow = redoStack.length > 0;
    
    for (const callback of subscriptions.values()) {
      try {
        callback(canUndoNow, canRedoNow);
      } catch (e) {
        console.error('Undo callback error:', e);
      }
    }
  }
  
  const stack: UndoStack = {
    push(options: CreateUndoActionOptions): void {
      const action: UndoAction = {
        type: options.type,
        timestamp: Date.now(),
        description: options.description,
        undo: options.undo,
        redo: options.redo,
      };
      
      // If in batch mode, accumulate actions
      if (batchDescription !== null) {
        batchActions.push(action);
        return;
      }
      
      // Clear redo stack on new action
      redoStack.length = 0;
      
      // Add to undo stack
      undoStack.push(action);
      
      // Limit history size
      while (undoStack.length > MAX_UNDO_HISTORY) {
        undoStack.shift();
      }
      
      notify();
    },
    
    undo(): boolean {
      if (undoStack.length === 0) return false;
      
      const action = undoStack.pop()!;
      
      try {
        action.undo();
        redoStack.push(action);
        notify();
        return true;
      } catch (e) {
        console.error('Undo error:', e);
        // Put action back on stack since undo failed
        undoStack.push(action);
        return false;
      }
    },
    
    redo(): boolean {
      if (redoStack.length === 0) return false;
      
      const action = redoStack.pop()!;
      
      try {
        action.redo();
        undoStack.push(action);
        notify();
        return true;
      } catch (e) {
        console.error('Redo error:', e);
        // Put action back on stack since redo failed
        redoStack.push(action);
        return false;
      }
    },
    
    canUndo(): boolean {
      return undoStack.length > 0;
    },
    
    canRedo(): boolean {
      return redoStack.length > 0;
    },
    
    getUndoDescription(): string | null {
      if (undoStack.length === 0) return null;
      return undoStack[undoStack.length - 1]!.description;
    },

    getRedoDescription(): string | null {
      if (redoStack.length === 0) return null;
      return redoStack[redoStack.length - 1]!.description;
    },
    
    getUndoHistory(limit: number = 10): readonly UndoAction[] {
      return undoStack.slice(-limit).reverse();
    },
    
    getRedoHistory(limit: number = 10): readonly UndoAction[] {
      return redoStack.slice(-limit).reverse();
    },
    
    clear(): void {
      undoStack.length = 0;
      redoStack.length = 0;
      notify();
    },
    
    beginBatch(description: string): void {
      if (batchDescription !== null) {
        console.warn('Already in batch mode');
        return;
      }
      batchDescription = description;
      batchActions = [];
    },
    
    commitBatch(): void {
      if (batchDescription === null) {
        console.warn('Not in batch mode');
        return;
      }
      
      if (batchActions.length === 0) {
        batchDescription = null;
        return;
      }
      
      // Create composite undo/redo functions
      const actionsToCommit = [...batchActions];
      const description = batchDescription;
      
      const batchUndo: UndoBatch = {
        type: 'batch',
        timestamp: Date.now(),
        description,
        actions: actionsToCommit,
        undo: () => {
          // Undo in reverse order
          for (let i = actionsToCommit.length - 1; i >= 0; i--) {
            actionsToCommit[i]!.undo();
          }
        },
        redo: () => {
          // Redo in forward order
          for (const action of actionsToCommit) {
            action.redo();
          }
        },
      };
      
      // Clear batch state
      batchDescription = null;
      batchActions = [];
      
      // Clear redo stack
      redoStack.length = 0;
      
      // Add batch to undo stack
      undoStack.push(batchUndo);
      
      // Limit history size
      while (undoStack.length > MAX_UNDO_HISTORY) {
        undoStack.shift();
      }
      
      notify();
    },

    endBatch(): void {
      stack.commitBatch();
    },
    
    cancelBatch(): void {
      batchDescription = null;
      batchActions = [];
    },
    
    isInBatch(): boolean {
      return batchDescription !== null;
    },
    
    subscribe(callback: UndoStackCallback): SubscriptionId {
      const id = generateSubscriptionId();
      subscriptions.set(id, callback);
      return id;
    },
    
    unsubscribe(subscriptionId: SubscriptionId): boolean {
      return subscriptions.delete(subscriptionId);
    },
    
    getState() {
      return {
        past: [...undoStack] as readonly UndoAction[],
        present: undoStack.length > 0 ? (undoStack[undoStack.length - 1] ?? null) : null,
        future: [...redoStack] as readonly UndoAction[],
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
      };
    },
  };
  
  return stack;
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let _undoStack: UndoStack | null = null;

/**
 * Gets the shared undo stack singleton.
 */
export function getUndoStack(): UndoStack {
  if (!_undoStack) {
    _undoStack = createUndoStack();
  }
  return _undoStack;
}

/**
 * Resets the undo stack (for testing).
 */
export function resetUndoStack(): void {
  _undoStack = null;
}
