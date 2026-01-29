/**
 * @fileoverview Board State Storage
 * 
 * localStorage persistence for board state.
 * 
 * @module @cardplay/boards/store/storage
 */

import type { BoardState, LayoutState, DeckState } from './types';
import { DEFAULT_BOARD_STATE } from './types';

// ============================================================================
// STORAGE KEY
// ============================================================================

const STORAGE_KEY = 'cardplay.boardState.v1';

// ============================================================================
// STORAGE FUNCTIONS
// ============================================================================

/**
 * Loads board state from localStorage.
 * Returns default state if not found or invalid.
 */
export function loadBoardState(): BoardState {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { ...DEFAULT_BOARD_STATE };
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_BOARD_STATE };
    
    const parsed = JSON.parse(raw);
    return validateAndMigrate(parsed);
  } catch (error) {
    console.warn('Failed to load board state:', error);
    return { ...DEFAULT_BOARD_STATE };
  }
}

/**
 * Saves board state to localStorage.
 * Debounced to avoid excessive writes.
 */
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export function saveBoardState(state: BoardState): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return; // No-op in non-browser environments
  }
  
  if (saveTimeout !== null) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(() => {
    try {
      const serialized = JSON.stringify(state);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      console.error('Failed to save board state:', error);
    }
    saveTimeout = null;
  }, 500); // 500ms debounce
}

/**
 * Clears board state from localStorage.
 */
export function clearBoardState(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return; // No-op in non-browser environments
  }
  localStorage.removeItem(STORAGE_KEY);
}

// ============================================================================
// VALIDATION AND MIGRATION
// ============================================================================

/**
 * Validates and migrates raw state to current schema.
 */
function validateAndMigrate(raw: unknown): BoardState {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_BOARD_STATE };
  }
  
  const obj = raw as Record<string, unknown>;
  
  // Version check
  const version = typeof obj.version === 'number' ? obj.version : 1;
  
  if (version !== 1) {
    console.warn(`Unknown board state version: ${version}, using defaults`);
    return { ...DEFAULT_BOARD_STATE };
  }
  
  // Validate and fill in defaults
  return {
    version: 1,
    currentBoardId: typeof obj.currentBoardId === 'string' ? obj.currentBoardId : null,
    recentBoardIds: Array.isArray(obj.recentBoardIds) ? obj.recentBoardIds.filter(id => typeof id === 'string') : [],
    favoriteBoardIds: Array.isArray(obj.favoriteBoardIds) ? obj.favoriteBoardIds.filter(id => typeof id === 'string') : [],
    perBoardLayout: typeof obj.perBoardLayout === 'object' && obj.perBoardLayout !== null ? obj.perBoardLayout as Record<string, LayoutState | undefined> : {},
    perBoardDeckState: typeof obj.perBoardDeckState === 'object' && obj.perBoardDeckState !== null ? obj.perBoardDeckState as Record<string, DeckState | undefined> : {},
    perBoardTrackControlLevels: typeof obj.perBoardTrackControlLevels === 'object' && obj.perBoardTrackControlLevels !== null ? obj.perBoardTrackControlLevels as Record<string, import('./types').TrackControlLevels | undefined> : {},
    firstRunCompleted: typeof obj.firstRunCompleted === 'boolean' ? obj.firstRunCompleted : false,
    lastOpenedAt: typeof obj.lastOpenedAt === 'number' ? obj.lastOpenedAt : null,
  };
}
