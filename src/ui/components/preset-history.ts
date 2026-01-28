/**
 * @fileoverview Preset History and Favorites System.
 * 
 * Provides history tracking and favorites management for presets.
 * 
 * @module @cardplay/core/ui/components/preset-history
 */

import type { Preset } from '../../cards/presets';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Preset history entry.
 */
export interface PresetHistoryEntry {
  /** Preset that was active */
  readonly preset: Preset;
  /** Timestamp when preset was loaded */
  readonly timestamp: number;
  /** Card ID this preset was used with */
  readonly cardId: string;
  /** Parameter overrides at the time (if any) */
  readonly overrides?: Readonly<Record<string, unknown>>;
  /** Whether this entry is from manual selection or undo/redo */
  readonly source: 'manual' | 'undo' | 'redo';
}

/**
 * Preset history state.
 */
export interface PresetHistoryState {
  /** History entries (most recent first) */
  readonly entries: readonly PresetHistoryEntry[];
  /** Maximum history size */
  readonly maxSize: number;
  /** Current position in history for undo/redo (-1 = at latest) */
  readonly currentPosition: number;
  /** Grouped entries by card ID */
  readonly byCard: Readonly<Record<string, readonly PresetHistoryEntry[]>>;
}

/**
 * Preset favorites state.
 */
export interface PresetFavoritesState {
  /** Favorite preset IDs by card ID */
  readonly favorites: Readonly<Record<string, readonly string[]>>;
  /** Favorite tags/categories (user-defined) */
  readonly tags: Readonly<Record<string, readonly string[]>>;
  /** Last modified timestamp */
  readonly lastModified: number;
}

/**
 * Combined preset history and favorites state.
 */
export interface PresetHistoryAndFavoritesState {
  readonly history: PresetHistoryState;
  readonly favorites: PresetFavoritesState;
}

// ============================================================================
// HISTORY STATE MANAGEMENT
// ============================================================================

/**
 * Create initial preset history state.
 */
export function createPresetHistoryState(maxSize: number = 100): PresetHistoryState {
  return Object.freeze({
    entries: [],
    maxSize,
    currentPosition: -1,
    byCard: {},
  });
}

/**
 * Add entry to history.
 */
export function addToHistory(
  state: PresetHistoryState,
  entry: Omit<PresetHistoryEntry, 'timestamp' | 'source'>
): PresetHistoryState {
  const newEntry: PresetHistoryEntry = {
    ...entry,
    timestamp: Date.now(),
    source: 'manual',
  };

  // If we're not at the latest position, remove all entries after current position
  const entries = state.currentPosition >= 0
    ? state.entries.slice(state.currentPosition)
    : state.entries;

  // Add new entry at the beginning
  const newEntries = [newEntry, ...entries].slice(0, state.maxSize);

  // Update byCard grouping
  const byCard: Record<string, PresetHistoryEntry[]> = {};
  for (const e of newEntries) {
    if (!byCard[e.cardId]) {
      byCard[e.cardId] = [];
    }
    byCard[e.cardId]!.push(e);
  }

  return Object.freeze({
    ...state,
    entries: newEntries,
    currentPosition: -1,
    byCard: Object.freeze(byCard as Record<string, readonly PresetHistoryEntry[]>),
  });
}

/**
 * Undo to previous preset in history.
 */
export function undoHistory(state: PresetHistoryState): {
  state: PresetHistoryState;
  entry?: PresetHistoryEntry;
} {
  const newPosition = Math.min(state.currentPosition + 1, state.entries.length - 1);
  
  if (newPosition === state.currentPosition) {
    return { state }; // Already at oldest
  }

  const entry = state.entries[newPosition];
  if (!entry) {
    return { state };
  }

  return {
    state: Object.freeze({
      ...state,
      currentPosition: newPosition,
    }),
    entry,
  };
}

/**
 * Redo to next preset in history.
 */
export function redoHistory(state: PresetHistoryState): {
  state: PresetHistoryState;
  entry?: PresetHistoryEntry;
} {
  const newPosition = Math.max(state.currentPosition - 1, -1);
  
  if (newPosition === state.currentPosition) {
    return { state }; // Already at latest
  }

  const entry = newPosition >= 0 ? state.entries[newPosition] : state.entries[0];
  if (!entry) {
    return { state };
  }

  return {
    state: Object.freeze({
      ...state,
      currentPosition: newPosition,
    }),
    entry,
  };
}

/**
 * Get recent history entries (optionally filtered by card).
 */
export function getRecentHistory(
  state: PresetHistoryState,
  cardId?: string,
  limit: number = 10
): readonly PresetHistoryEntry[] {
  if (cardId) {
    return (state.byCard[cardId] ?? []).slice(0, limit);
  }
  return state.entries.slice(0, limit);
}

/**
 * Check if can undo.
 */
export function canUndo(state: PresetHistoryState): boolean {
  return state.currentPosition < state.entries.length - 1;
}

/**
 * Check if can redo.
 */
export function canRedo(state: PresetHistoryState): boolean {
  return state.currentPosition > -1;
}

/**
 * Clear history.
 */
export function clearHistory(state: PresetHistoryState): PresetHistoryState {
  return Object.freeze({
    ...state,
    entries: [],
    currentPosition: -1,
    byCard: {},
  });
}

/**
 * Clear history for specific card.
 */
export function clearHistoryForCard(
  state: PresetHistoryState,
  cardId: string
): PresetHistoryState {
  const entries = state.entries.filter(e => e.cardId !== cardId);
  
  // Recalculate byCard
  const byCard: Record<string, PresetHistoryEntry[]> = {};
  for (const e of entries) {
    if (!byCard[e.cardId]) {
      byCard[e.cardId] = [];
    }
    byCard[e.cardId]!.push(e);
  }

  return Object.freeze({
    ...state,
    entries,
    byCard: Object.freeze(byCard as Record<string, readonly PresetHistoryEntry[]>),
    currentPosition: Math.min(state.currentPosition, entries.length - 1),
  });
}

// ============================================================================
// FAVORITES STATE MANAGEMENT
// ============================================================================

/**
 * Create initial preset favorites state.
 */
export function createPresetFavoritesState(): PresetFavoritesState {
  return Object.freeze({
    favorites: {},
    tags: {},
    lastModified: Date.now(),
  });
}

/**
 * Add preset to favorites.
 */
export function addFavorite(
  state: PresetFavoritesState,
  cardId: string,
  presetId: string
): PresetFavoritesState {
  const cardFavorites = state.favorites[cardId] ?? [];
  
  // Don't add if already favorited
  if (cardFavorites.includes(presetId)) {
    return state;
  }

  const newFavorites = [...cardFavorites, presetId];

  return Object.freeze({
    ...state,
    favorites: Object.freeze({
      ...state.favorites,
      [cardId]: newFavorites,
    }),
    lastModified: Date.now(),
  });
}

/**
 * Remove preset from favorites.
 */
export function removeFavorite(
  state: PresetFavoritesState,
  cardId: string,
  presetId: string
): PresetFavoritesState {
  const cardFavorites = state.favorites[cardId] ?? [];
  const newFavorites = cardFavorites.filter(id => id !== presetId);

  if (newFavorites.length === cardFavorites.length) {
    return state; // Wasn't favorited
  }

  return Object.freeze({
    ...state,
    favorites: Object.freeze({
      ...state.favorites,
      [cardId]: newFavorites,
    }),
    lastModified: Date.now(),
  });
}

/**
 * Toggle favorite status.
 */
export function toggleFavoriteStatus(
  state: PresetFavoritesState,
  cardId: string,
  presetId: string
): PresetFavoritesState {
  const cardFavorites = state.favorites[cardId] ?? [];
  
  if (cardFavorites.includes(presetId)) {
    return removeFavorite(state, cardId, presetId);
  } else {
    return addFavorite(state, cardId, presetId);
  }
}

/**
 * Check if preset is favorited.
 */
export function isFavorite(
  state: PresetFavoritesState,
  cardId: string,
  presetId: string
): boolean {
  const cardFavorites = state.favorites[cardId] ?? [];
  return cardFavorites.includes(presetId);
}

/**
 * Get favorites for card.
 */
export function getFavorites(
  state: PresetFavoritesState,
  cardId: string
): readonly string[] {
  return state.favorites[cardId] ?? [];
}

/**
 * Get all favorite preset IDs across all cards.
 */
export function getAllFavorites(state: PresetFavoritesState): readonly string[] {
  const allFavorites = new Set<string>();
  for (const cardFavorites of Object.values(state.favorites)) {
    for (const presetId of cardFavorites) {
      allFavorites.add(presetId);
    }
  }
  return Array.from(allFavorites);
}

/**
 * Add tag to preset favorite.
 */
export function addTagToFavorite(
  state: PresetFavoritesState,
  presetId: string,
  tag: string
): PresetFavoritesState {
  const presetTags = state.tags[presetId] ?? [];
  
  if (presetTags.includes(tag)) {
    return state;
  }

  return Object.freeze({
    ...state,
    tags: Object.freeze({
      ...state.tags,
      [presetId]: [...presetTags, tag],
    }),
    lastModified: Date.now(),
  });
}

/**
 * Remove tag from preset favorite.
 */
export function removeTagFromFavorite(
  state: PresetFavoritesState,
  presetId: string,
  tag: string
): PresetFavoritesState {
  const presetTags = state.tags[presetId] ?? [];
  const newTags = presetTags.filter(t => t !== tag);

  if (newTags.length === presetTags.length) {
    return state;
  }

  return Object.freeze({
    ...state,
    tags: Object.freeze({
      ...state.tags,
      [presetId]: newTags,
    }),
    lastModified: Date.now(),
  });
}

/**
 * Get tags for preset.
 */
export function getTagsForPreset(
  state: PresetFavoritesState,
  presetId: string
): readonly string[] {
  return state.tags[presetId] ?? [];
}

/**
 * Get all unique tags.
 */
export function getAllTags(state: PresetFavoritesState): readonly string[] {
  const allTags = new Set<string>();
  for (const tags of Object.values(state.tags)) {
    for (const tag of tags) {
      allTags.add(tag);
    }
  }
  return Array.from(allTags).sort();
}

/**
 * Search favorites by tag.
 */
export function searchFavoritesByTag(
  state: PresetFavoritesState,
  tag: string
): readonly string[] {
  const results: string[] = [];
  for (const [presetId, tags] of Object.entries(state.tags)) {
    if (tags.includes(tag)) {
      results.push(presetId);
    }
  }
  return results;
}

// ============================================================================
// PERSISTENCE
// ============================================================================

/**
 * Serialize history to JSON (for session storage).
 */
export function historyToJSON(state: PresetHistoryState): string {
  return JSON.stringify({
    entries: state.entries,
    maxSize: state.maxSize,
    currentPosition: state.currentPosition,
  });
}

/**
 * Deserialize history from JSON.
 */
export function historyFromJSON(json: string): PresetHistoryState {
  const data = JSON.parse(json);
  
  // Rebuild byCard grouping
  const byCard: Record<string, PresetHistoryEntry[]> = {};
  for (const entry of data.entries) {
    if (!byCard[entry.cardId]) {
      byCard[entry.cardId] = [];
    }
    byCard[entry.cardId]!.push(entry);
  }

  return Object.freeze({
    entries: data.entries,
    maxSize: data.maxSize,
    currentPosition: data.currentPosition,
    byCard: Object.freeze(byCard as Record<string, readonly PresetHistoryEntry[]>),
  });
}

/**
 * Serialize favorites to JSON (for local storage).
 */
export function favoritesToJSON(state: PresetFavoritesState): string {
  return JSON.stringify({
    favorites: state.favorites,
    tags: state.tags,
    lastModified: state.lastModified,
  });
}

/**
 * Deserialize favorites from JSON.
 */
export function favoritesFromJSON(json: string): PresetFavoritesState {
  const data = JSON.parse(json);
  return Object.freeze({
    favorites: Object.freeze(data.favorites),
    tags: Object.freeze(data.tags),
    lastModified: data.lastModified,
  });
}

/**
 * Save history to session storage.
 */
export function saveHistoryToSession(state: PresetHistoryState): void {
  try {
    const json = historyToJSON(state);
    sessionStorage.setItem('cardplay-preset-history', json);
  } catch (e) {
    console.error('Failed to save preset history:', e);
  }
}

/**
 * Load history from session storage.
 */
export function loadHistoryFromSession(): PresetHistoryState | undefined {
  try {
    const json = sessionStorage.getItem('cardplay-preset-history');
    if (json) {
      return historyFromJSON(json);
    }
  } catch (e) {
    console.error('Failed to load preset history:', e);
  }
  return undefined;
}

/**
 * Save favorites to local storage.
 */
export function saveFavoritesToLocal(state: PresetFavoritesState): void {
  try {
    const json = favoritesToJSON(state);
    localStorage.setItem('cardplay-preset-favorites', json);
  } catch (e) {
    console.error('Failed to save preset favorites:', e);
  }
}

/**
 * Load favorites from local storage.
 */
export function loadFavoritesFromLocal(): PresetFavoritesState | undefined {
  try {
    const json = localStorage.getItem('cardplay-preset-favorites');
    if (json) {
      return favoritesFromJSON(json);
    }
  } catch (e) {
    console.error('Failed to load preset favorites:', e);
  }
  return undefined;
}

// ============================================================================
// CSS
// ============================================================================

/**
 * CSS for preset history and favorites UI.
 */
export const PRESET_HISTORY_CSS = `
.preset-history {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  max-height: 300px;
  overflow-y: auto;
}

.preset-history__item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--color-surface-elevated);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 150ms;
  position: relative;
}

.preset-history__item:hover {
  background: var(--color-surface-hover);
}

.preset-history__item--current {
  background: var(--color-primary-alpha);
  border-left: 3px solid var(--color-primary);
  padding-left: calc(var(--spacing-sm) - 3px);
}

.preset-history__icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--color-text-muted);
}

.preset-history__content {
  flex: 1;
  min-width: 0;
}

.preset-history__name {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preset-history__timestamp {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.preset-history__controls {
  display: flex;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--color-surface-elevated);
  border-radius: var(--radius-sm);
  justify-content: center;
}

.preset-history__button {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: all 150ms;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.preset-history__button:hover:not(:disabled) {
  background: var(--color-surface-hover);
  border-color: var(--color-primary);
}

.preset-history__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preset-favorites__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--spacing-sm);
}

.preset-favorites__item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--color-surface-elevated);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 150ms;
  position: relative;
}

.preset-favorites__item:hover {
  background: var(--color-surface-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px var(--color-shadow);
}

.preset-favorites__star {
  position: absolute;
  top: var(--spacing-xs);
  right: var(--spacing-xs);
  color: var(--color-orange);
  font-size: 16px;
}

.preset-favorites__name {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preset-favorites__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.preset-favorites__tag {
  padding: 2px var(--spacing-xs);
  background: var(--color-primary-alpha);
  color: var(--color-primary);
  border-radius: var(--radius-xs);
  font-size: 10px;
  font-weight: var(--font-semibold);
}

.preset-favorites__empty {
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}
`;

/**
 * Apply preset history CSS to document.
 */
export function applyPresetHistoryCSS(): void {
  const styleId = 'cardplay-preset-history-css';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = PRESET_HISTORY_CSS;
    document.head.appendChild(style);
  }
}
