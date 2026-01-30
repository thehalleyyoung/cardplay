/**
 * @fileoverview Board Context Store
 *
 * Singleton store for active context (current stream, clip, deck, etc.).
 * Context persists across board switches.
 * 
 * B130: Context is namespaced by boardId and panelId to prevent cross-board leakage.
 *
 * @module @cardplay/boards/context/store
 */

import type { ActiveContext, ActiveContextListener, BoardContextId } from './types';
import { DEFAULT_ACTIVE_CONTEXT, createBoardContextId } from './types';
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
    currentKey: typeof obj.currentKey === 'string' ? obj.currentKey : null,
    currentChord: typeof obj.currentChord === 'string' ? obj.currentChord : null,
    chordStreamId: typeof obj.chordStreamId === 'string' ? obj.chordStreamId : null,
  };
}

// ============================================================================
// BOARD CONTEXT STORE
// ============================================================================

/**
 * BoardContextStore manages the active context across all boards.
 *
 * B068-B071: Complete implementation of active context management.
 * B130: Context is namespaced by boardId and panelId to prevent cross-board leakage.
 */
export class BoardContextStore {
  private context: ActiveContext;
  private listeners: Set<ActiveContextListener> = new Set();
  private boardContexts: Map<BoardContextId, Partial<ActiveContext>> = new Map();
  private currentBoardId: BoardContextId | null = null;

  constructor() {
    // B071: Load from localStorage
    this.context = loadContext();
  }

  // ============================================================================
  // B130: BOARD-SCOPED CONTEXT MANAGEMENT
  // ============================================================================

  /**
   * B130: Sets the current board context ID.
   * This determines which namespaced context is active.
   */
  setCurrentBoard(boardId: string): void {
    this.currentBoardId = createBoardContextId(boardId);
    
    // Merge board-specific context with global context
    const boardContext = this.boardContexts.get(this.currentBoardId);
    if (boardContext) {
      this.context = {
        ...this.context,
        ...boardContext,
      };
      this.notify();
    }
  }

  /**
   * B130: Gets the current board context ID.
   */
  getCurrentBoardId(): BoardContextId | null {
    return this.currentBoardId;
  }

  /**
   * B130: Resets context for a specific board.
   * Used during board switches to prevent leakage.
   */
  resetBoardContext(boardId: string): void {
    const contextId = createBoardContextId(boardId);
    this.boardContexts.delete(contextId);
    
    if (this.currentBoardId === contextId) {
      this.context = { ...DEFAULT_ACTIVE_CONTEXT };
      this.notify();
    }
  }

  /**
   * B130: Updates context and persists to board-specific namespace.
   */
  private updateBoardContext(updates: Partial<ActiveContext>): void {
    if (this.currentBoardId) {
      const existingBoardContext = this.boardContexts.get(this.currentBoardId) || {};
      this.boardContexts.set(this.currentBoardId, {
        ...existingBoardContext,
        ...updates,
      });
    }
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
   * B130: Updates both global and board-scoped context.
   */
  setActiveStream(streamId: string | null): void {
    this.context = {
      ...this.context,
      activeStreamId: streamId,
    };
    this.updateBoardContext({ activeStreamId: streamId });
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
   * B130: Updates both global and board-scoped context.
   */
  setActiveClip(clipId: string | null): void {
    this.context = {
      ...this.context,
      activeClipId: clipId,
    };
    this.updateBoardContext({ activeClipId: clipId });
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
   * B130: Updates both global and board-scoped context.
   */
  setActiveTrack(trackId: string | null): void {
    this.context = {
      ...this.context,
      activeTrackId: trackId,
    };
    this.updateBoardContext({ activeTrackId: trackId });
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
  // HARMONY CONTEXT (G014-G015)
  // ============================================================================

  /**
   * Sets the current musical key.
   * Used by harmony-assisted boards to provide context.
   */
  setCurrentKey(key: string | null): void {
    this.context = {
      ...this.context,
      currentKey: key,
    };
    this.notify();
  }

  /**
   * Gets the current musical key.
   */
  getCurrentKey(): string | null {
    return this.context.currentKey;
  }

  /**
   * Sets the current chord.
   * Used by harmony-assisted boards to provide context.
   */
  setCurrentChord(chord: string | null): void {
    this.context = {
      ...this.context,
      currentChord: chord,
    };
    this.notify();
  }

  /**
   * Gets the current chord.
   */
  getCurrentChord(): string | null {
    return this.context.currentChord;
  }

  /**
   * Sets the chord stream ID (dedicated stream for chord progression).
   * Used by boards that need to store/edit chord progressions.
   */
  setChordStreamId(streamId: string | null): void {
    this.context = {
      ...this.context,
      chordStreamId: streamId,
    };
    this.notify();
  }

  /**
   * Gets the chord stream ID.
   */
  getChordStreamId(): string | null {
    return this.context.chordStreamId;
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
  
  // ============================================================================
  // B130: NAMESPACED CONTEXT MANAGEMENT
  // ============================================================================
  
  /**
   * B130: Per-board context storage to prevent cross-board leakage.
   */
  private perBoardContext: Map<BoardContextId, Partial<ActiveContext>> = new Map();
  
  /**
   * B130: Current board context ID.
   */
  private currentBoardContextId: BoardContextId | null = null;
  
  /**
   * B130: Set the current board context.
   * This namespaces subsequent context operations to this board.
   */
  setCurrentBoardContext(boardId: string): void {
    const contextId = createBoardContextId(boardId);
    this.currentBoardContextId = contextId;
    
    // Load per-board context if available
    const boardContext = this.perBoardContext.get(contextId);
    if (boardContext) {
      this.context = {
        ...DEFAULT_ACTIVE_CONTEXT,
        ...boardContext,
      };
    }
  }
  
  /**
   * B130: Save current context to per-board storage.
   * Call before switching boards to preserve state.
   */
  saveCurrentBoardContext(): void {
    if (!this.currentBoardContextId) return;
    
    // Save relevant fields to per-board storage
    this.perBoardContext.set(this.currentBoardContextId, {
      activeStreamId: this.context.activeStreamId,
      activeClipId: this.context.activeClipId,
      activeTrackId: this.context.activeTrackId,
      activeDeckId: this.context.activeDeckId,
      selectedEventIds: [...this.context.selectedEventIds],
    });
  }
  
  /**
   * B130: Get context for a specific board without switching.
   */
  getBoardContext(boardId: string): Partial<ActiveContext> | undefined {
    const contextId = createBoardContextId(boardId);
    return this.perBoardContext.get(contextId);
  }
  
  /**
   * B130: Clear all per-board context (for testing).
   */
  clearAllBoardContexts(): void {
    this.perBoardContext.clear();
    this.currentBoardContextId = null;
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
