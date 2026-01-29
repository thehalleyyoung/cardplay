/**
 * @fileoverview UI Event Bus (C055)
 * 
 * Single event bus for opening/closing board modals and coordinating UI state.
 * Avoids cross-import tangles by providing a central communication channel.
 * 
 * @module @cardplay/ui/ui-event-bus
 */

// ============================================================================
// TYPES
// ============================================================================

export type UIEventType = 
  | 'board-switcher:open'
  | 'board-switcher:close'
  | 'board-browser:open'
  | 'board-browser:close'
  | 'help-panel:open'
  | 'help-panel:close'
  | 'first-run:open'
  | 'first-run:close'
  | 'command-palette:open'
  | 'command-palette:close';

export interface UIEvent {
  type: UIEventType;
  data?: unknown;
}

export type UIEventListener = (event: UIEvent) => void;

// ============================================================================
// UI EVENT BUS
// ============================================================================

/**
 * UIEventBus coordinates UI modal and panel state without tight coupling.
 * 
 * Usage:
 * ```typescript
 * // Open board switcher from anywhere
 * getUIEventBus().emit({ type: 'board-switcher:open' });
 * 
 * // Listen for events in a component
 * const unsub = getUIEventBus().on('board-switcher:open', (event) => {
 *   // Handle event
 * });
 * ```
 */
export class UIEventBus {
  private static instance: UIEventBus;
  private listeners = new Map<UIEventType, Set<UIEventListener>>();

  private constructor() {}

  static getInstance(): UIEventBus {
    if (!UIEventBus.instance) {
      UIEventBus.instance = new UIEventBus();
    }
    return UIEventBus.instance;
  }

  /**
   * Emit a UI event to all listeners
   */
  emit(event: UIEvent): void {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (error) {
          console.error(`UI event listener error for ${event.type}:`, error);
        }
      }
    }
  }

  /**
   * Listen for a specific UI event type
   * @returns Unsubscribe function
   */
  on(type: UIEventType, listener: UIEventListener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    
    this.listeners.get(type)!.add(listener);
    
    return () => {
      this.listeners.get(type)?.delete(listener);
    };
  }

  /**
   * Listen for an event once
   */
  once(type: UIEventType, listener: UIEventListener): () => void {
    const wrappedListener: UIEventListener = (event) => {
      listener(event);
      unsub();
    };
    
    const unsub = this.on(type, wrappedListener);
    return unsub;
  }

  /**
   * Remove all listeners for a type (or all if no type specified)
   */
  clear(type?: UIEventType): void {
    if (type) {
      this.listeners.delete(type);
    } else {
      this.listeners.clear();
    }
  }
}

/**
 * Get the singleton UI event bus
 */
export function getUIEventBus(): UIEventBus {
  return UIEventBus.getInstance();
}

/**
 * Emit a UI event (convenience function)
 */
export function emitUIEvent(type: UIEventType, data?: unknown): void {
  getUIEventBus().emit({ type, data });
}

/**
 * Listen for a UI event (convenience function)
 */
export function onUIEvent(type: UIEventType, listener: UIEventListener): () => void {
  return getUIEventBus().on(type, listener);
}
