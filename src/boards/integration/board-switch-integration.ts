/**
 * @fileoverview Board Switch Integration
 * 
 * Integrates board switching with deck visibility, card gating, and UI updates.
 * 
 * D066-D068: Complete board switching integration.
 * 
 * @module @cardplay/boards/integration/board-switch-integration
 */

import { getBoardRegistry } from '../registry';
import { getBoardStateStore } from '../store/store';
import { computeVisibleDeckTypes } from '../gating/tool-visibility';
import { getAllowedCardEntries } from '../gating/get-allowed-cards';
import type { Board } from '../types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Listener for board switch events.
 */
export type BoardSwitchListener = (board: Board | null, previousBoard: Board | null) => void;

// ============================================================================
// STATE
// ============================================================================

const listeners: BoardSwitchListener[] = [];
let cachedVisibleDecks: Map<string, readonly string[]> = new Map();
let cachedAllowedCards: Map<string, readonly string[]> = new Map();
let currentBoardId: string | null = null;

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * D066: Initializes board switch integration.
 * 
 * Call this once at app startup to set up subscriptions.
 * 
 * @returns Cleanup function to unsubscribe
 */
export function initBoardSwitchIntegration(): () => void {
  const store = getBoardStateStore();
  const registry = getBoardRegistry();
  
  // Subscribe to board state changes
  const unsubscribe = store.subscribe((state) => {
    const newBoardId = state.currentBoardId;
    
    // Check if board actually changed
    if (newBoardId === currentBoardId) {
      return;
    }
    
    const previousBoard = currentBoardId ? registry.get(currentBoardId) : null;
    const newBoard = newBoardId ? registry.get(newBoardId) : null;
    
    currentBoardId = newBoardId;
    
    // D068: Clear cached gating results for both boards
    if (previousBoard) {
      clearCachedGatingResults(previousBoard.id);
    }
    if (newBoard) {
      clearCachedGatingResults(newBoard.id);
    }
    
    // D066: Recompute visible decks for new board
    if (newBoard) {
      const visibleDecks = computeVisibleDeckTypes(newBoard);
      cachedVisibleDecks.set(newBoard.id, visibleDecks as readonly string[]);
    }
    
    // D067: Recompute allowed cards for new board
    if (newBoard) {
      const allowedCards = getAllowedCardEntries(newBoard);
      cachedAllowedCards.set(newBoard.id, allowedCards.map(e => e.card.meta.id));
    }
    
    // Notify listeners (for UI updates)
    notifyListeners(newBoard ?? null, previousBoard ?? null);
  });
  
  // Initialize with current board
  const initialState = store.getState();
  if (initialState.currentBoardId) {
    const initialBoard = registry.get(initialState.currentBoardId);
    if (initialBoard) {
      currentBoardId = initialBoard.id;
      const visibleDecks = computeVisibleDeckTypes(initialBoard);
      cachedVisibleDecks.set(initialBoard.id, visibleDecks as readonly string[]);
      const allowedCards = getAllowedCardEntries(initialBoard);
      cachedAllowedCards.set(initialBoard.id, allowedCards.map(e => e.card.meta.id));
    }
  }
  
  return () => {
    unsubscribe();
    listeners.length = 0;
    cachedVisibleDecks.clear();
    cachedAllowedCards.clear();
  };
}

/**
 * D066: Subscribe to board switch events.
 * 
 * Listeners are called when the active board changes, allowing UI
 * components to recompute visible decks and allowed cards.
 * 
 * @param listener Callback function
 * @returns Unsubscribe function
 */
export function onBoardSwitch(listener: BoardSwitchListener): () => void {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index >= 0) {
      listeners.splice(index, 1);
    }
  };
}

/**
 * D066: Gets visible deck types for the current board (cached).
 * 
 * Results are computed on board switch and cached for performance.
 * 
 * @returns Array of visible deck type IDs
 */
export function getCurrentVisibleDecks(): readonly string[] {
  if (!currentBoardId) {
    return [];
  }
  
  return cachedVisibleDecks.get(currentBoardId) ?? [];
}

/**
 * D067: Gets allowed card IDs for the current board (cached).
 * 
 * Results are computed on board switch and cached for performance.
 * 
 * @returns Array of allowed card IDs
 */
export function getCurrentAllowedCards(): readonly string[] {
  if (!currentBoardId) {
    return [];
  }
  
  return cachedAllowedCards.get(currentBoardId) ?? [];
}

/**
 * D068: Checks if a card is allowed on the current board.
 * 
 * Uses cached results for performance.
 * 
 * @param cardId Card ID to check
 * @returns true if card is allowed
 */
export function isCardCurrentlyAllowed(cardId: string): boolean {
  const allowedCards = getCurrentAllowedCards();
  return allowedCards.includes(cardId);
}

/**
 * D066: Checks if a deck type is visible on the current board.
 * 
 * Uses cached results for performance.
 * 
 * @param deckTypeId Deck type ID to check
 * @returns true if deck type is visible
 */
export function isDeckCurrentlyVisible(deckTypeId: string): boolean {
  const visibleDecks = getCurrentVisibleDecks();
  return visibleDecks.includes(deckTypeId);
}

/**
 * D069: Forces recomputation of gating results for the current board.
 * 
 * Normally not needed (automatic on board switch), but useful for testing
 * or when tool configuration changes dynamically.
 */
export function recomputeCurrentBoardGating(): void {
  if (!currentBoardId) {
    return;
  }
  
  const registry = getBoardRegistry();
  const board = registry.get(currentBoardId);
  
  if (!board) {
    return;
  }
  
  // Recompute and update caches
  const visibleDecks = computeVisibleDeckTypes(board);
  cachedVisibleDecks.set(board.id, visibleDecks as readonly string[]);
  
  const allowedCards = getAllowedCardEntries(board);
  cachedAllowedCards.set(board.id, allowedCards.map(e => e.card.meta.id));
  
  // Notify listeners of "change" (same board, updated gating)
  notifyListeners(board, board);
}

// ============================================================================
// INTERNAL
// ============================================================================

/**
 * D068: Clears cached gating results for a board.
 */
function clearCachedGatingResults(boardId: string): void {
  cachedVisibleDecks.delete(boardId);
  cachedAllowedCards.delete(boardId);
}

/**
 * Notifies all listeners of a board switch.
 */
function notifyListeners(newBoard: Board | null, previousBoard: Board | null): void {
  for (const listener of listeners) {
    try {
      listener(newBoard, previousBoard);
    } catch (error) {
      console.error('Error in board switch listener:', error);
    }
  }
}
