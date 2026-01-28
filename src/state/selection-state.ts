/**
 * @fileoverview Selection State - Shared selection across all views.
 * 
 * Enables selection synchronization: select in Tracker → selected in Piano Roll.
 * 
 * @module @cardplay/state/selection-state
 */

import type {
  SelectionState,
  EventStreamId,
  SubscriptionId,
} from './types';
import { createEmptySelection, generateSubscriptionId } from './types';

// ============================================================================
// SELECTION STORE INTERFACE
// ============================================================================

/**
 * Callback for selection change notifications.
 */
export type SelectionCallback = (state: SelectionState, previousState: SelectionState) => void;

/**
 * Selection store for cross-view selection synchronization.
 */
export interface SelectionStore {
  /**
   * Gets current selection state.
   */
  getState(): SelectionState;
  
  /**
   * Selects events (adds to selection).
   */
  select(eventIds: readonly string[], streamId?: EventStreamId): void;
  /** @deprecated legacy arg order: (streamId, eventIds) */
  select(streamId: EventStreamId, eventIds: readonly string[]): void;
  
  /**
   * Deselects events (removes from selection).
   */
  deselect(eventIds: readonly string[]): void;
  
  /**
   * Toggles selection for events.
   */
  toggle(eventIds: readonly string[], streamId?: EventStreamId): void;
  /** @deprecated legacy arg order: (streamId, eventIds) */
  toggle(streamId: EventStreamId, eventIds: readonly string[]): void;
  
  /**
   * Sets selection to exactly these events.
   */
  setSelection(eventIds: readonly string[], streamId?: EventStreamId): void;
  /** @deprecated legacy arg order: (streamId, eventIds) */
  setSelection(streamId: EventStreamId, eventIds: readonly string[]): void;
  
  /**
   * Clears all selection.
   */
  clearSelection(): void;
  
  /**
   * Sets the primary (focus) event.
   */
  setPrimary(eventId: string | null): void;
  
  /**
   * Sets the anchor for shift-click selection.
   */
  setAnchor(eventId: string | null): void;
  
  /**
   * Checks if an event is selected.
   */
  isSelected(eventId: string): boolean;
  
  /**
   * Gets all selected event IDs.
   */
  getSelectedIds(): readonly string[];
  
  /**
   * Gets selection count.
   */
  getSelectionCount(): number;
  
  /**
   * Subscribes to selection changes.
   */
  subscribe(callback: SelectionCallback): SubscriptionId;
  /** @deprecated legacy subscription: (streamId, selectedIdsCallback) */
  subscribe(streamId: EventStreamId, callback: (selectedIds: readonly string[]) => void): SubscriptionId;
  
  /**
   * Unsubscribes from selection changes.
   */
  unsubscribe(subscriptionId: SubscriptionId): boolean;

  /** @deprecated legacy helper for stream-scoped selection */
  getSelection(streamId: EventStreamId): { readonly eventIds: readonly string[]; readonly primary: string | null };
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/**
 * Creates a new SelectionStore instance.
 */
export function createSelectionStore(): SelectionStore {
  let state: SelectionState = createEmptySelection();
  const subscriptions = new Map<SubscriptionId, SelectionCallback>();
  
  function notify(previousState: SelectionState): void {
    for (const callback of subscriptions.values()) {
      try {
        callback(state, previousState);
      } catch (e) {
        console.error('Selection callback error:', e);
      }
    }
  }
  
  const store: SelectionStore = {
    getState(): SelectionState {
      return state;
    },
    
    select(
      arg1: readonly string[] | EventStreamId,
      arg2?: EventStreamId | readonly string[]
    ): void {
      const eventIds = typeof arg1 === 'string' ? (arg2 as readonly string[]) : arg1;
      const streamId = typeof arg1 === 'string' ? arg1 : (arg2 as EventStreamId | undefined);

      const previousState = state;
      const newSelected = new Set(state.selected);
      for (const id of eventIds) {
        newSelected.add(id);
      }
      
      state = {
        ...state,
        selected: newSelected,
        streamId: streamId ?? state.streamId,
        primary: state.primary ?? eventIds[0] ?? null,
      };
      
      notify(previousState);
    },
    
    deselect(eventIds: readonly string[]): void {
      const previousState = state;
      const newSelected = new Set(state.selected);
      for (const id of eventIds) {
        newSelected.delete(id);
      }
      
      // Clear primary if it was deselected
      const primary = state.primary && newSelected.has(state.primary) ? state.primary : null;
      
      state = {
        ...state,
        selected: newSelected,
        primary,
      };
      
      notify(previousState);
    },
    
    toggle(
      arg1: readonly string[] | EventStreamId,
      arg2?: EventStreamId | readonly string[]
    ): void {
      const eventIds = typeof arg1 === 'string' ? (arg2 as readonly string[]) : arg1;
      const streamId = typeof arg1 === 'string' ? arg1 : (arg2 as EventStreamId | undefined);

      const previousState = state;
      const newSelected = new Set(state.selected);
      
      for (const id of eventIds) {
        if (newSelected.has(id)) {
          newSelected.delete(id);
        } else {
          newSelected.add(id);
        }
      }
      
      const primary = state.primary && newSelected.has(state.primary) 
        ? state.primary 
        : (newSelected.size > 0 ? Array.from(newSelected)[0] : null);
      
      state = {
        ...state,
        selected: newSelected,
        streamId: streamId ?? state.streamId,
        primary: primary ?? null,
      };
      
      notify(previousState);
    },
    
    setSelection(
      arg1: readonly string[] | EventStreamId,
      arg2?: EventStreamId | readonly string[]
    ): void {
      const eventIds = typeof arg1 === 'string' ? (arg2 as readonly string[]) : arg1;
      const streamId = typeof arg1 === 'string' ? arg1 : (arg2 as EventStreamId | undefined);

      const previousState = state;
      
      state = {
        selected: new Set(eventIds),
        primary: eventIds[0] ?? null,
        streamId: streamId ?? null,
        anchor: eventIds[0] ?? null,
      };
      
      notify(previousState);
    },
    
    clearSelection(): void {
      const previousState = state;
      state = createEmptySelection();
      notify(previousState);
    },
    
    setPrimary(eventId: string | null): void {
      if (state.primary === eventId) return;
      
      const previousState = state;
      state = {
        ...state,
        primary: eventId,
      };
      notify(previousState);
    },
    
    setAnchor(eventId: string | null): void {
      if (state.anchor === eventId) return;
      
      const previousState = state;
      state = {
        ...state,
        anchor: eventId,
      };
      notify(previousState);
    },
    
    isSelected(eventId: string): boolean {
      return state.selected.has(eventId);
    },
    
    getSelectedIds(): readonly string[] {
      return Array.from(state.selected);
    },
    
    getSelectionCount(): number {
      return state.selected.size;
    },
    
    subscribe(
      arg1: SelectionCallback | EventStreamId,
      arg2?: (selectedIds: readonly string[]) => void
    ): SubscriptionId {
      const id = generateSubscriptionId();
      if (typeof arg1 === 'string') {
        const streamId = arg1;
        const selectedIdsCallback = arg2 ?? (() => {});
        const wrapper: SelectionCallback = (next) => {
          if (next.streamId === streamId) {
            selectedIdsCallback(Array.from(next.selected));
          }
        };
        subscriptions.set(id, wrapper);
        if (state.streamId === streamId) {
          selectedIdsCallback(Array.from(state.selected));
        }
      } else {
        subscriptions.set(id, arg1);
      }
      return id;
    },
    
    unsubscribe(subscriptionId: SubscriptionId): boolean {
      return subscriptions.delete(subscriptionId);
    },

    getSelection(streamId: EventStreamId): { readonly eventIds: readonly string[]; readonly primary: string | null } {
      if (state.streamId !== streamId) {
        return { eventIds: [], primary: null };
      }
      return { eventIds: Array.from(state.selected), primary: state.primary };
    },
  };
  
  return store;
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let _selectionStore: SelectionStore | null = null;

/**
 * Gets the shared selection store singleton.
 */
export function getSelectionStore(): SelectionStore {
  if (!_selectionStore) {
    _selectionStore = createSelectionStore();
  }
  return _selectionStore;
}

/**
 * Resets the selection store (for testing).
 */
export function resetSelectionStore(): void {
  _selectionStore = null;
}
