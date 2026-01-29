/**
 * @fileoverview Board State Store
 *
 * Singleton store for board preferences, layout, and user state.
 * Automatically persists to localStorage.
 *
 * @module @cardplay/boards/store/store
 */

import type { BoardState, BoardStateListener, LayoutState, DeckState } from './types';
import { DEFAULT_BOARD_STATE, DEFAULT_LAYOUT_STATE, DEFAULT_DECK_STATE } from './types';
import { loadBoardState, saveBoardState } from './storage';

// ============================================================================
// BOARD STATE STORE
// ============================================================================

/**
 * BoardStateStore manages persisted board preferences and layout.
 *
 * B052-B064: Complete implementation of board state management.
 */
export class BoardStateStore {
  private state: BoardState;
  private listeners: Set<BoardStateListener> = new Set();

  constructor() {
    // B053: Load initial state from storage
    this.state = loadBoardState();
  }

  // ============================================================================
  // CORE STATE ACCESS (B053)
  // ============================================================================

  /**
   * Gets the current state (immutable copy).
   */
  getState(): Readonly<BoardState> {
    return { ...this.state };
  }

  /**
   * Subscribes to state changes.
   * Returns unsubscribe function.
   */
  subscribe(listener: BoardStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notifies all listeners and persists state.
   */
  private notify(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
    saveBoardState(this.state);
  }

  // ============================================================================
  // CURRENT BOARD (B054)
  // ============================================================================

  /**
   * Sets the current active board.
   * Automatically updates recentBoardIds.
   */
  setCurrentBoard(boardId: string): void {
    this.state = {
      ...this.state,
      currentBoardId: boardId,
      lastOpenedAt: Date.now(),
    };

    // Also add to recent list
    this.addRecentBoard(boardId);
  }

  /**
   * Gets the current board ID.
   */
  getCurrentBoardId(): string | null {
    return this.state.currentBoardId;
  }

  // ============================================================================
  // RECENT BOARDS (B055)
  // ============================================================================

  /**
   * Adds a board to the recent list.
   * Maintains max length of 10, removes duplicates.
   */
  addRecentBoard(boardId: string): void {
    const maxRecent = 10;

    // Remove if already exists
    const filtered = this.state.recentBoardIds.filter(id => id !== boardId);

    // Add to front
    const updated = [boardId, ...filtered].slice(0, maxRecent);

    this.state = {
      ...this.state,
      recentBoardIds: updated,
    };

    this.notify();
  }

  /**
   * Gets recent board IDs (most recent first).
   */
  getRecentBoardIds(): readonly string[] {
    return this.state.recentBoardIds;
  }

  /**
   * Clears recent boards list.
   */
  clearRecentBoards(): void {
    this.state = {
      ...this.state,
      recentBoardIds: [],
    };
    this.notify();
  }

  // ============================================================================
  // FAVORITE BOARDS (B056)
  // ============================================================================

  /**
   * Toggles a board's favorite status.
   */
  toggleFavorite(boardId: string): void {
    const favorites = new Set(this.state.favoriteBoardIds);

    if (favorites.has(boardId)) {
      favorites.delete(boardId);
    } else {
      favorites.add(boardId);
    }

    this.state = {
      ...this.state,
      favoriteBoardIds: Array.from(favorites),
    };

    this.notify();
  }

  /**
   * Checks if a board is favorited.
   */
  isFavorite(boardId: string): boolean {
    return this.state.favoriteBoardIds.includes(boardId);
  }

  /**
   * Gets all favorite board IDs.
   */
  getFavoriteBoardIds(): readonly string[] {
    return this.state.favoriteBoardIds;
  }

  // ============================================================================
  // FIRST RUN (B057)
  // ============================================================================

  /**
   * Marks first-run experience as completed.
   */
  setFirstRunCompleted(): void {
    this.state = {
      ...this.state,
      firstRunCompleted: true,
    };
    this.notify();
  }

  /**
   * Checks if first-run experience is completed.
   */
  isFirstRunCompleted(): boolean {
    return this.state.firstRunCompleted;
  }

  // ============================================================================
  // LAYOUT STATE (B058-B060)
  // ============================================================================

  /**
   * Gets layout state for a board.
   */
  getLayoutState(boardId: string): LayoutState {
    return this.state.perBoardLayout[boardId] ?? { ...DEFAULT_LAYOUT_STATE };
  }

  /**
   * Sets layout state for a board.
   */
  setLayoutState(boardId: string, layoutState: LayoutState): void {
    this.state = {
      ...this.state,
      perBoardLayout: {
        ...this.state.perBoardLayout,
        [boardId]: layoutState,
      },
    };
    this.notify();
  }

  /**
   * Updates panel sizes for a board.
   */
  updatePanelSizes(boardId: string, panelSizes: Record<string, number>): void {
    const layout = this.getLayoutState(boardId);
    this.setLayoutState(boardId, {
      ...layout,
      panelSizes: {
        ...layout.panelSizes,
        ...panelSizes,
      },
    });
  }

  /**
   * Toggles panel collapsed state.
   */
  togglePanelCollapsed(boardId: string, panelId: string): void {
    const layout = this.getLayoutState(boardId);
    const collapsed = new Set(layout.collapsedPanels);

    if (collapsed.has(panelId)) {
      collapsed.delete(panelId);
    } else {
      collapsed.add(panelId);
    }

    this.setLayoutState(boardId, {
      ...layout,
      collapsedPanels: Array.from(collapsed),
    });
  }

  /**
   * Resets layout state for a board (remove customization).
   */
  resetLayoutState(boardId: string): void {
    const { [boardId]: _, ...remaining } = this.state.perBoardLayout;

    this.state = {
      ...this.state,
      perBoardLayout: remaining,
    };
    this.notify();
  }

  // ============================================================================
  // DECK STATE (B061-B063)
  // ============================================================================

  /**
   * Gets deck state for a board.
   */
  getDeckState(boardId: string): DeckState {
    return this.state.perBoardDeckState[boardId] ?? { ...DEFAULT_DECK_STATE };
  }

  /**
   * Sets deck state for a board.
   */
  setDeckState(boardId: string, deckState: DeckState): void {
    this.state = {
      ...this.state,
      perBoardDeckState: {
        ...this.state.perBoardDeckState,
        [boardId]: deckState,
      },
    };
    this.notify();
  }

  /**
   * Sets active card for a deck.
   */
  setActiveCard(boardId: string, deckId: string, cardId: string): void {
    const deckState = this.getDeckState(boardId);
    this.setDeckState(boardId, {
      ...deckState,
      activeCards: {
        ...deckState.activeCards,
        [deckId]: cardId,
      },
    });
  }

  /**
   * Gets active card for a deck.
   */
  getActiveCard(boardId: string, deckId: string): string | undefined {
    const deckState = this.getDeckState(boardId);
    return deckState.activeCards[deckId];
  }

  /**
   * Sets scroll position for a deck.
   */
  setScrollPosition(boardId: string, deckId: string, position: number): void {
    const deckState = this.getDeckState(boardId);
    this.setDeckState(boardId, {
      ...deckState,
      scrollPositions: {
        ...deckState.scrollPositions,
        [deckId]: position,
      },
    });
  }

  /**
   * Gets scroll position for a deck.
   */
  getScrollPosition(boardId: string, deckId: string): number {
    const deckState = this.getDeckState(boardId);
    return deckState.scrollPositions[deckId] ?? 0;
  }

  /**
   * Resets deck state for a board (remove customization).
   */
  resetDeckState(boardId: string): void {
    const { [boardId]: _, ...remaining } = this.state.perBoardDeckState;

    this.state = {
      ...this.state,
      perBoardDeckState: remaining,
    };
    this.notify();
  }

  // ============================================================================
  // TRACK CONTROL LEVELS (J041-J045)
  // ============================================================================

  /**
   * Gets track control levels for a board.
   * J041: Per-track control level data model.
   */
  getTrackControlLevels(boardId: string): Record<string, string> {
    return this.state.perBoardTrackControlLevels[boardId]?.levels ?? {};
  }

  /**
   * Gets control level for a specific track/stream.
   * J041: Track ID → control level mapping.
   */
  getTrackControlLevel(boardId: string, streamId: string): string | undefined {
    const levels = this.state.perBoardTrackControlLevels[boardId];
    return levels?.levels[streamId] ?? levels?.defaultLevel;
  }

  /**
   * Sets control level for a specific track/stream.
   * J041: Update per-track control level with persistence.
   */
  setTrackControlLevel(boardId: string, streamId: string, controlLevel: string): void {
    const current = this.state.perBoardTrackControlLevels[boardId] ?? { levels: {} };
    
    this.state = {
      ...this.state,
      perBoardTrackControlLevels: {
        ...this.state.perBoardTrackControlLevels,
        [boardId]: {
          ...current,
          levels: {
            ...current.levels,
            [streamId]: controlLevel,
          },
        },
      },
    };
    this.notify();
  }

  /**
   * Sets default control level for new tracks in a board.
   * J041: Default control level for hybrid boards.
   */
  setDefaultTrackControlLevel(boardId: string, controlLevel: string): void {
    const current = this.state.perBoardTrackControlLevels[boardId] ?? { levels: {} };
    
    this.state = {
      ...this.state,
      perBoardTrackControlLevels: {
        ...this.state.perBoardTrackControlLevels,
        [boardId]: {
          ...current,
          defaultLevel: controlLevel,
        },
      },
    };
    this.notify();
  }

  /**
   * Removes control level override for a track (fallback to default).
   * J041: Reset individual track to board default.
   */
  resetTrackControlLevel(boardId: string, streamId: string): void {
    const current = this.state.perBoardTrackControlLevels[boardId];
    if (!current) return;

    const { [streamId]: _, ...remainingLevels } = current.levels;
    
    this.state = {
      ...this.state,
      perBoardTrackControlLevels: {
        ...this.state.perBoardTrackControlLevels,
        [boardId]: {
          ...current,
          levels: remainingLevels,
        },
      },
    };
    this.notify();
  }

  /**
   * Resets all track control levels for a board.
   * J041: Clear all per-track overrides.
   */
  resetAllTrackControlLevels(boardId: string): void {
    const { [boardId]: _, ...remaining } = this.state.perBoardTrackControlLevels;
    
    this.state = {
      ...this.state,
      perBoardTrackControlLevels: remaining,
    };
    this.notify();
  }

  // ============================================================================
  // BOARD RESET ACTIONS (C068-C070)
  // ============================================================================

  /**
   * C068: Reset layout for a board (clears persisted per-board layout).
   * 
   * This restores the board to its default layout as defined in the
   * board definition.
   */
  resetBoardLayout(boardId: string): void {
    this.resetLayoutState(boardId);
  }

  /**
   * C069: Reset board state for a board (clears persisted deck state + layout state).
   * 
   * This resets both layout and deck customizations for a specific board.
   */
  resetBoardState(boardId: string): void {
    this.resetLayoutState(boardId);
    this.resetDeckState(boardId);
    this.resetAllTrackControlLevels(boardId);
  }

  /**
   * C070: Reset all board preferences (clears board state store key entirely).
   * 
   * This is a nuclear option that resets all boards to defaults.
   * Use with caution!
   */
  resetAllBoardPreferences(): void {
    this.reset();
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Gets last opened timestamp.
   */
  getLastOpenedAt(): number | null {
    return this.state.lastOpenedAt;
  }

  /**
   * Resets all state to defaults (for testing/troubleshooting).
   */
  reset(): void {
    this.state = { ...DEFAULT_BOARD_STATE };
    this.notify();
  }
}

// ============================================================================
// SINGLETON (B064)
// ============================================================================

let storeInstance: BoardStateStore | null = null;

/**
 * Gets the singleton BoardStateStore instance.
 */
export function getBoardStateStore(): BoardStateStore {
  if (!storeInstance) {
    storeInstance = new BoardStateStore();
  }
  return storeInstance;
}

/**
 * Resets the board state store (for testing).
 */
export function resetBoardStateStore(): void {
  storeInstance = null;
}
