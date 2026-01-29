/**
 * @fileoverview Deck Runtime Types
 *
 * Runtime state for individual decks (persisted per-board state).
 *
 * B099-B100: Define per-deck state persistence.
 *
 * @module @cardplay/boards/decks/runtime-types
 */

import type { DeckType } from '../types';

// ============================================================================
// DECK RUNTIME STATE
// ============================================================================

/**
 * Runtime state for a single deck (persisted per-board).
 *
 * B100: Include active tab, scroll positions, focused item, filters/search.
 */
export interface DeckRuntimeState {
  /** Deck ID */
  deckId: string;

  /** Deck type */
  deckType: DeckType;

  /** Active tab ID (for tabbed decks) */
  activeTabId: string | null;

  /** Scroll position (vertical) */
  scrollTop: number;

  /** Scroll position (horizontal) */
  scrollLeft: number;

  /** Focused item ID (for keyboard navigation) */
  focusedItemId: string | null;

  /** Search query (for searchable decks) */
  searchQuery: string;

  /** Active filters (for filterable decks) */
  filters: Record<string, unknown>;

  /** Zoom level (for zoomable decks like notation) */
  zoom: number;

  /** Collapsed state (for collapsible sections) */
  collapsedSections: Set<string>;

  /** Custom deck-specific state */
  customState: Record<string, unknown>;

  /** Last update timestamp */
  timestamp: number;
}

/**
 * Default deck runtime state.
 */
export const DEFAULT_DECK_RUNTIME_STATE: Omit<DeckRuntimeState, 'deckId' | 'deckType'> = {
  activeTabId: null,
  scrollTop: 0,
  scrollLeft: 0,
  focusedItemId: null,
  searchQuery: '',
  filters: {},
  zoom: 1.0,
  collapsedSections: new Set(),
  customState: {},
  timestamp: Date.now(),
};

// ============================================================================
// DECK COLLECTION STATE
// ============================================================================

/**
 * Collection of deck runtime states for a board.
 */
export interface BoardDeckStates {
  /** Deck states by deck ID */
  decks: ReadonlyMap<string, DeckRuntimeState>;

  /** Last update timestamp */
  timestamp: number;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Creates a default deck runtime state.
 */
export function createDefaultDeckRuntimeState(
  deckId: string,
  deckType: DeckType
): DeckRuntimeState {
  return {
    ...DEFAULT_DECK_RUNTIME_STATE,
    deckId,
    deckType,
    collapsedSections: new Set(),
    timestamp: Date.now(),
  };
}

/**
 * Serializes deck runtime state for storage.
 */
export function serializeDeckRuntimeState(state: DeckRuntimeState): Record<string, unknown> {
  return {
    deckId: state.deckId,
    deckType: state.deckType,
    activeTabId: state.activeTabId,
    scrollTop: state.scrollTop,
    scrollLeft: state.scrollLeft,
    focusedItemId: state.focusedItemId,
    searchQuery: state.searchQuery,
    filters: state.filters,
    zoom: state.zoom,
    collapsedSections: Array.from(state.collapsedSections),
    customState: state.customState,
    timestamp: state.timestamp,
  };
}

/**
 * Deserializes deck runtime state from storage.
 */
export function deserializeDeckRuntimeState(obj: Record<string, unknown>): DeckRuntimeState {
  return {
    deckId: typeof obj.deckId === 'string' ? obj.deckId : '',
    deckType: typeof obj.deckType === 'string' ? (obj.deckType as DeckType) : 'pattern-deck',
    activeTabId: typeof obj.activeTabId === 'string' ? obj.activeTabId : null,
    scrollTop: typeof obj.scrollTop === 'number' ? obj.scrollTop : 0,
    scrollLeft: typeof obj.scrollLeft === 'number' ? obj.scrollLeft : 0,
    focusedItemId: typeof obj.focusedItemId === 'string' ? obj.focusedItemId : null,
    searchQuery: typeof obj.searchQuery === 'string' ? obj.searchQuery : '',
    filters: typeof obj.filters === 'object' && obj.filters ? (obj.filters as Record<string, unknown>) : {},
    zoom: typeof obj.zoom === 'number' ? obj.zoom : 1.0,
    collapsedSections: Array.isArray(obj.collapsedSections)
      ? new Set(obj.collapsedSections.filter(s => typeof s === 'string'))
      : new Set(),
    customState: typeof obj.customState === 'object' && obj.customState ? (obj.customState as Record<string, unknown>) : {},
    timestamp: typeof obj.timestamp === 'number' ? obj.timestamp : Date.now(),
  };
}
