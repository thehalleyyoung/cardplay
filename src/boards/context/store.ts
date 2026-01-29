/**
 * @fileoverview Board Context Store
 *
 * Singleton store for active context (current stream, clip, deck, etc.).
 * Context persists across board switches.
 *
 * @module @cardplay/boards/context/store
 */

import type { ActiveContext, ActiveContextListener } from './types';
import { DEFAULT_ACTIVE_CONTEXT } from './types';
import type { ViewType } from '../types';

// ============================================================================
// STORAGE KEY
// ============================================================================

const STORAGE_KEY = 'cardplay.activeContext.v1';

// ============================================================================
// STORAGE HELPERS
// ============================================================================

/**
 * Loads active context from localStorage.
 */
function loadContext(): ActiveContext {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { ...DEFAULT_ACTIVE_CONTEXT };
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_ACTIVE_CONTEXT };

    const parsed = JSON.parse(raw);
    return validateContext(parsed);
  } catch (error) {
    console.warn('Failed to load active context:', error);
    return { ...DEFAULT_ACTIVE_CONTEXT };
  }
}

/**
 * Saves active context to localStorage (debounced).
 */
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function saveContext(context: ActiveContext): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return; // No-op in non-browser environments
  }
  
  if (saveTimeout !== null) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    try {
      const serialized = JSON.stringify(context);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      console.error('Failed to save active context:', error);
    }
    saveTimeout = null;
  }, 500); // 500ms debounce
}

/**
 * Validates and fills in defaults for raw context.
 */
function validateContext(raw: unknown): ActiveContext {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_ACTIVE_CONTEXT };
  }

  const obj = raw as Record<string, unknown>;

  return {
    activeStreamId: typeof obj.activeStreamId === 'string' ? obj.activeStreamId : null,
    activeClipId: typeof obj.activeClipId === 'string' ? obj.activeClipId : null,
    activeTrackId: typeof obj.activeTrackId === 'string' ? obj.activeTrackId : null,
    activeDeckId: typeof obj.activeDeckId === 'string' ? obj.activeDeckId : null,
    activeViewType: typeof obj.activeViewType === 'string' ? (obj.activeViewType as ViewType) : null,
    selectedEventIds: Array.isArray(obj.selectedEventIds) ? obj.selectedEventIds.filter(id => typeof id === 'string') : [],
    isPlaying: typeof obj.isPlaying === 'boolean' ? obj.isPlaying : false,
    transportPosition: typeof obj.transportPosition === 'number' ? obj.transportPosition : 0,
    lastUpdatedAt: typeof obj.lastUpdatedAt === 'number' ? obj.lastUpdatedAt : Date.now(),
  };
}

// ============================================================================
// BOARD CONTEXT STORE
// ============================================================================

/**
 * BoardContextStore manages the active context across all boards.
 *
 * B068-B071: Complete implementation of active context management.
 */
export class BoardContextStore {
  private context: ActiveContext;
  private listeners: Set<ActiveContextListener> = new Set();

  constructor() {
    // B071: Load from localStorage
    this.context = loadContext();
  }

  // ============================================================================
  // CORE ACCESS
  // ============================================================================

  /**
   * Gets the current context (immutable copy).
   */
  getContext(): Readonly<ActiveContext> {
    return { ...this.context };
  }

  /**
   * Subscribes to context changes.
   * Returns unsubscribe function.
   *
   * B070: Subscribe implementation.
   */
  subscribe(listener: ActiveContextListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notifies all listeners and persists context.
   */
  private notify(): void {
    this.context = {
      ...this.context,
      lastUpdatedAt: Date.now(),
    };

    const context = this.getContext();
    this.listeners.forEach(listener => listener(context));
    saveContext(this.context);
  }

  // ============================================================================
  // ACTIVE STREAM (B069)
  // ============================================================================

  /**
   * Sets the active stream ID.
   */
  setActiveStream(streamId: string | null): void {
    this.context = {
      ...this.context,
      activeStreamId: streamId,
    };
    this.notify();
  }

  /**
   * Gets the active stream ID.
   */
  getActiveStreamId(): string | null {
    return this.context.activeStreamId;
  }

  // ============================================================================
  // ACTIVE CLIP (B069)
  // ============================================================================

  /**
   * Sets the active clip ID.
   */
  setActiveClip(clipId: string | null): void {
    this.context = {
      ...this.context,
      activeClipId: clipId,
    };
    this.notify();
  }

  /**
   * Gets the active clip ID.
   */
  getActiveClipId(): string | null {
    return this.context.activeClipId;
  }

  // ============================================================================
  // ACTIVE TRACK
  // ============================================================================

  /**
   * Sets the active track ID.
   */
  setActiveTrack(trackId: string | null): void {
    this.context = {
      ...this.context,
      activeTrackId: trackId,
    };
    this.notify();
  }

  /**
   * Gets the active track ID.
   */
  getActiveTrackId(): string | null {
    return this.context.activeTrackId;
  }

  // ============================================================================
  // ACTIVE DECK
  // ============================================================================

  /**
   * Sets the active deck ID.
   */
  setActiveDeck(deckId: string | null): void {
    this.context = {
      ...this.context,
      activeDeckId: deckId,
    };
    this.notify();
  }

  /**
   * Gets the active deck ID.
   */
  getActiveDeckId(): string | null {
    return this.context.activeDeckId;
  }

  // ============================================================================
  // ACTIVE VIEW TYPE
  // ============================================================================

  /**
   * Sets the active view type.
   */
  setActiveViewType(viewType: ViewType | null): void {
    this.context = {
      ...this.context,
      activeViewType: viewType,
    };
    this.notify();
  }

  /**
   * Gets the active view type.
   */
  getActiveViewType(): ViewType | null {
    return this.context.activeViewType;
  }

  // ============================================================================
  // SELECTION
  // ============================================================================

  /**
   * Sets the selected event IDs.
   */
  setSelectedEventIds(eventIds: readonly string[]): void {
    this.context = {
      ...this.context,
      selectedEventIds: eventIds,
    };
    this.notify();
  }

  /**
   * Gets the selected event IDs.
   */
  getSelectedEventIds(): readonly string[] {
    return this.context.selectedEventIds;
  }

  // ============================================================================
  // TRANSPORT
  // ============================================================================

  /**
   * Sets the transport playing state.
   */
  setPlaying(isPlaying: boolean): void {
    this.context = {
      ...this.context,
      isPlaying,
    };
    this.notify();
  }

  /**
   * Gets the transport playing state.
   */
  isPlaying(): boolean {
    return this.context.isPlaying;
  }

  /**
   * Sets the transport position.
   */
  setTransportPosition(position: number): void {
    this.context = {
      ...this.context,
      transportPosition: position,
    };
    this.notify();
  }

  /**
   * Gets the transport position.
   */
  getTransportPosition(): number {
    return this.context.transportPosition;
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Resets context to defaults.
   */
  reset(): void {
    this.context = { ...DEFAULT_ACTIVE_CONTEXT };
    this.notify();
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let contextStoreInstance: BoardContextStore | null = null;

/**
 * Gets the singleton BoardContextStore instance.
 */
export function getBoardContextStore(): BoardContextStore {
  if (!contextStoreInstance) {
    contextStoreInstance = new BoardContextStore();
  }
  return contextStoreInstance;
}

/**
 * Resets the board context store (for testing).
 */
export function resetBoardContextStore(): void {
  contextStoreInstance = null;
}
