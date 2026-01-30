/**
 * @fileoverview Board State Storage
 * 
 * localStorage persistence for board state.
 * 
 * @module @cardplay/boards/store/storage
 */

import type { BoardState, LayoutState, DeckState } from './types';
import { DEFAULT_BOARD_STATE } from './types';
import { normalizeDeckType } from '../../canon/legacy-aliases';

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
 * 
 * Change 147: Maps old persisted deck keys like 'pattern-editor' to new DeckId keys.
 * Change 148: Maps old persisted deck type strings like 'piano-roll' to canonical DeckType.
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
  
  // Migrate perBoardDeckState keys (Change 147)
  let perBoardDeckState: Record<string, DeckState | undefined> = {};
  if (typeof obj.perBoardDeckState === 'object' && obj.perBoardDeckState !== null) {
    const oldState = obj.perBoardDeckState as Record<string, unknown>;
    for (const [key, value] of Object.entries(oldState)) {
      // If key looks like a legacy deck type, migrate to DeckId format
      const migrated = migrateDeckStateKey(key, value);
      perBoardDeckState = { ...perBoardDeckState, ...migrated };
    }
  }
  
  // Validate and fill in defaults
  return {
    version: 1,
    currentBoardId: typeof obj.currentBoardId === 'string' ? obj.currentBoardId : null,
    recentBoardIds: Array.isArray(obj.recentBoardIds) ? obj.recentBoardIds.filter(id => typeof id === 'string') : [],
    favoriteBoardIds: Array.isArray(obj.favoriteBoardIds) ? obj.favoriteBoardIds.filter(id => typeof id === 'string') : [],
    perBoardLayout: typeof obj.perBoardLayout === 'object' && obj.perBoardLayout !== null ? obj.perBoardLayout as Record<string, LayoutState | undefined> : {},
    perBoardDeckState,
    perBoardTrackControlLevels: typeof obj.perBoardTrackControlLevels === 'object' && obj.perBoardTrackControlLevels !== null ? obj.perBoardTrackControlLevels as Record<string, import('./types').TrackControlLevels | undefined> : {},
    firstRunCompleted: typeof obj.firstRunCompleted === 'boolean' ? obj.firstRunCompleted : false,
    lastOpenedAt: typeof obj.lastOpenedAt === 'number' ? obj.lastOpenedAt : null,
  };
}

/**
 * Migrates a deck state key from legacy format to current format.
 * 
 * Change 147: 'pattern-editor' → 'main-pattern' (DeckId)
 * Change 148: Normalizes deck type strings within the state
 */
function migrateDeckStateKey(
  key: string,
  value: unknown
): Record<string, DeckState | undefined> {
  if (!value || typeof value !== 'object') {
    return { [key]: undefined };
  }
  
  const deckState = value as Record<string, unknown>;
  
  // If the key is a legacy deck type string, try to migrate it
  const legacyTypes = ['pattern-editor', 'notation-score', 'piano-roll', 'timeline', 'session'];
  if (legacyTypes.includes(key)) {
    // Migrate to a DeckId format
    // Use a sensible default mapping
    const deckIdMap: Record<string, string> = {
      'pattern-editor': 'main-pattern',
      'notation-score': 'main-notation',
      'piano-roll': 'main-piano-roll',
      'timeline': 'main-arrangement',
      'session': 'main-session',
    };
    
    const newKey = deckIdMap[key] || key;
    console.info(`Migrating deck state key: ${key} → ${newKey}`);
    
    // Also normalize any deck type fields within the state (Change 148)
    const migratedState = migrateDeckStateValues(deckState);
    
    return { [newKey]: migratedState as unknown as DeckState };
  }
  
  // Not a legacy key, but still normalize values
  const migratedState = migrateDeckStateValues(deckState);
  return { [key]: migratedState as unknown as DeckState };
}

/**
 * Normalizes deck type strings within a deck state object.
 * 
 * Change 148: Maps 'piano-roll' → 'piano-roll-deck', etc.
 */
function migrateDeckStateValues(
  deckState: Record<string, unknown>
): Record<string, unknown> {
  const migrated: Record<string, unknown> = { ...deckState };
  
  // Normalize 'type' field if present
  if (typeof migrated.type === 'string') {
    const normalized = normalizeDeckType(migrated.type);
    if (normalized !== migrated.type) {
      console.info(`Normalizing deck type: ${migrated.type} → ${normalized}`);
      migrated.type = normalized;
    }
  }
  
  // Normalize 'deckType' field if present
  if (typeof migrated.deckType === 'string') {
    const normalized = normalizeDeckType(migrated.deckType);
    if (normalized !== migrated.deckType) {
      console.info(`Normalizing deckType: ${migrated.deckType} → ${normalized}`);
      migrated.deckType = normalized;
    }
  }
  
  return migrated;
}
