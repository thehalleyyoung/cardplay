/**
 * @fileoverview Preset Browser UI Component.
 * 
 * Provides UI for browsing, searching, and selecting presets.
 * 
 * @module @cardplay/core/ui/components/preset-browser
 */

import type { Preset } from '../../cards/presets';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Preset browser configuration.
 */
export interface PresetBrowserConfig {
  /** Card ID whose presets to browse */
  readonly cardId: string;
  /** Currently selected preset ID */
  readonly selectedPresetId?: string;
  /** Search query */
  readonly searchQuery?: string;
  /** Category filter */
  readonly categoryFilter?: string;
  /** Show only factory presets */
  readonly showFactoryOnly?: boolean;
  /** Show only user presets */
  readonly showUserOnly?: boolean;
  /** Favorites filter */
  readonly showFavoritesOnly?: boolean;
  /** Sort mode */
  readonly sortMode: PresetSortMode;
  /** View mode */
  readonly viewMode: PresetViewMode;
  /** Enable preview on hover */
  readonly hoverPreview?: boolean;
  /** Callback when preset selected */
  readonly onSelect?: (presetId: string) => void;
  /** Callback when preset favorited */
  readonly onFavorite?: (presetId: string, favorited: boolean) => void;
  /** Callback when preset deleted (user presets only) */
  readonly onDelete?: (presetId: string) => void;
  /** Callback when preset renamed */
  readonly onRename?: (presetId: string, newName: string) => void;
  /** Callback when search query changes */
  readonly onSearchChange?: (query: string) => void;
  /** Callback when category filter changes */
  readonly onCategoryChange?: (category: string | undefined) => void;
}

/**
 * Sort modes for preset list.
 */
export type PresetSortMode = 
  | 'name'        // Alphabetical by name
  | 'category'    // Grouped by category
  | 'recent'      // Recently modified first
  | 'favorites';  // Favorites first

/**
 * View modes for preset display.
 */
export type PresetViewMode = 
  | 'list'        // Compact list view
  | 'grid'        // Grid with thumbnails
  | 'tree';       // Hierarchical tree view

/**
 * Preset browser state.
 */
export interface PresetBrowserState {
  /** All presets */
  readonly presets: readonly Preset[];
  /** Filtered/sorted presets for display */
  readonly displayedPresets: readonly Preset[];
  /** Available categories */
  readonly categories: readonly string[];
  /** Favorite preset IDs */
  readonly favorites: readonly string[];
  /** Recently selected preset IDs (up to 10) */
  readonly recent: readonly string[];
  /** Currently playing preview preset ID */
  readonly previewingPresetId?: string | undefined;
  /** Loading state */
  readonly loading: boolean;
  /** Error message */
  readonly error?: string | undefined;
}

/**
 * Preset list item display info.
 */
export interface PresetListItem {
  readonly preset: Preset;
  readonly isSelected: boolean;
  readonly isFavorite: boolean;
  readonly isRecent: boolean;
  readonly isPreviewing: boolean;
  readonly badge?: PresetBadgeType | undefined;
}

/**
 * Badge types for preset items.
 */
export type PresetBadgeType = 
  | 'factory'     // Factory preset
  | 'modified'    // User preset derived from factory
  | 'new'         // Recently created
  | 'popular';    // High usage count

// ============================================================================
// PRESET FILTERING
// ============================================================================

/**
 * Filter presets based on browser config.
 */
export function filterPresets(
  presets: readonly Preset[],
  config: PresetBrowserConfig,
  favorites: readonly string[]
): readonly Preset[] {
  let filtered = [...presets];

  // Text search
  if (config.searchQuery && config.searchQuery.trim().length > 0) {
    const query = config.searchQuery.toLowerCase();
    filtered = filtered.filter(preset => 
      preset.name.toLowerCase().includes(query) ||
      preset.category.toLowerCase().includes(query) ||
      preset.tags.some(tag => tag.toLowerCase().includes(query)) ||
      (preset.description && preset.description.toLowerCase().includes(query))
    );
  }

  // Category filter
  if (config.categoryFilter) {
    filtered = filtered.filter(preset => preset.category === config.categoryFilter);
  }

  // Factory/user filter
  if (config.showFactoryOnly) {
    filtered = filtered.filter(preset => preset.isFactory);
  } else if (config.showUserOnly) {
    filtered = filtered.filter(preset => !preset.isFactory);
  }

  // Favorites filter
  if (config.showFavoritesOnly) {
    filtered = filtered.filter(preset => favorites.includes(preset.id));
  }

  return filtered;
}

/**
 * Sort presets based on sort mode.
 */
export function sortPresets(
  presets: readonly Preset[],
  sortMode: PresetSortMode,
  favorites: readonly string[],
  _recent: readonly string[]
): readonly Preset[] {
  const sorted = [...presets];

  switch (sortMode) {
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;

    case 'category':
      sorted.sort((a, b) => {
        const catCompare = a.category.localeCompare(b.category);
        if (catCompare !== 0) return catCompare;
        return a.name.localeCompare(b.name);
      });
      break;

    case 'recent':
      sorted.sort((a, b) => b.modifiedAt - a.modifiedAt);
      break;

    case 'favorites':
      sorted.sort((a, b) => {
        const aFav = favorites.includes(a.id) ? 1 : 0;
        const bFav = favorites.includes(b.id) ? 1 : 0;
        if (bFav !== aFav) return bFav - aFav;
        return a.name.localeCompare(b.name);
      });
      break;
  }

  return sorted;
}

/**
 * Extract unique categories from presets.
 */
export function extractCategories(presets: readonly Preset[]): readonly string[] {
  const categories = new Set<string>();
  for (const preset of presets) {
    categories.add(preset.category);
  }
  return Array.from(categories).sort();
}

// ============================================================================
// PRESET BROWSER STATE MANAGEMENT
// ============================================================================

/**
 * Create initial preset browser state.
 */
export function createPresetBrowserState(presets: readonly Preset[]): PresetBrowserState {
  return Object.freeze({
    presets,
    displayedPresets: presets,
    categories: extractCategories(presets),
    favorites: [],
    recent: [],
    loading: false,
  });
}

/**
 * Update displayed presets based on config.
 */
export function updateDisplayedPresets(
  state: PresetBrowserState,
  config: PresetBrowserConfig
): PresetBrowserState {
  const filtered = filterPresets(state.presets, config, state.favorites);
  const sorted = sortPresets(filtered, config.sortMode, state.favorites, state.recent);

  return Object.freeze({
    ...state,
    displayedPresets: sorted,
  });
}

/**
 * Toggle favorite status for a preset.
 */
export function toggleFavorite(
  state: PresetBrowserState,
  presetId: string
): PresetBrowserState {
  const favorites = [...state.favorites];
  const index = favorites.indexOf(presetId);

  if (index >= 0) {
    favorites.splice(index, 1);
  } else {
    favorites.push(presetId);
  }

  return Object.freeze({
    ...state,
    favorites,
  });
}

/**
 * Add preset to recent list.
 */
export function addToRecent(
  state: PresetBrowserState,
  presetId: string
): PresetBrowserState {
  const recent = [presetId, ...state.recent.filter(id => id !== presetId)].slice(0, 10);

  return Object.freeze({
    ...state,
    recent,
  });
}

/**
 * Update presets in state.
 */
export function updatePresets(
  state: PresetBrowserState,
  presets: readonly Preset[]
): PresetBrowserState {
  return Object.freeze({
    ...state,
    presets,
    categories: extractCategories(presets),
  });
}

/**
 * Set preview state.
 */
export function setPreviewingPreset(
  state: PresetBrowserState,
  presetId: string | undefined
): PresetBrowserState {
  return Object.freeze({
    ...state,
    previewingPresetId: presetId,
  });
}

/**
 * Set loading state.
 */
export function setLoading(
  state: PresetBrowserState,
  loading: boolean
): PresetBrowserState {
  return Object.freeze({
    ...state,
    loading,
  });
}

/**
 * Set error state.
 */
export function setError(
  state: PresetBrowserState,
  error: string | undefined
): PresetBrowserState {
  return Object.freeze({
    ...state,
    error,
  });
}

// ============================================================================
// PRESET LIST ITEM GENERATION
// ============================================================================

/**
 * Create preset list items for display.
 */
export function createPresetListItems(
  state: PresetBrowserState,
  selectedPresetId?: string
): readonly PresetListItem[] {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  return state.displayedPresets.map(preset => {
    const isNew = preset.createdAt > weekAgo && !preset.isFactory;
    const isModified = !preset.isFactory && preset.parentPresetId !== undefined;

    let badge: PresetBadgeType | undefined;
    if (preset.isFactory) {
      badge = 'factory';
    } else if (isModified) {
      badge = 'modified';
    } else if (isNew) {
      badge = 'new';
    }

    return Object.freeze({
      preset,
      isSelected: preset.id === selectedPresetId,
      isFavorite: state.favorites.includes(preset.id),
      isRecent: state.recent.includes(preset.id),
      isPreviewing: preset.id === state.previewingPresetId,
      badge,
    });
  });
}

// ============================================================================
// PRESET BROWSER CSS
// ============================================================================

/**
 * CSS for preset browser component.
 */
export const PRESET_BROWSER_CSS = `
.preset-browser {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.preset-browser__header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-elevated);
}

.preset-browser__search {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.preset-browser__search-input {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-input);
  color: var(--color-text);
  font-size: var(--text-sm);
}

.preset-browser__search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.preset-browser__filters {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.preset-browser__filter-button {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: all 150ms;
}

.preset-browser__filter-button:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-primary);
}

.preset-browser__filter-button--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.preset-browser__controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preset-browser__view-mode {
  display: flex;
  gap: var(--spacing-xs);
}

.preset-browser__view-button {
  padding: var(--spacing-xs);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 150ms;
}

.preset-browser__view-button:hover {
  background: var(--color-surface-hover);
}

.preset-browser__view-button--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.preset-browser__content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm);
}

.preset-browser__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.preset-browser__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--spacing-sm);
}

.preset-browser__tree {
  display: flex;
  flex-direction: column;
}

.preset-browser__category {
  margin-bottom: var(--spacing-md);
}

.preset-browser__category-header {
  padding: var(--spacing-sm);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--spacing-xs);
}

.preset-browser__item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 150ms;
  position: relative;
}

.preset-browser__item:hover {
  background: var(--color-surface-hover);
}

.preset-browser__item--selected {
  background: var(--color-primary-alpha);
  border-left: 3px solid var(--color-primary);
  padding-left: calc(var(--spacing-md) - 3px);
}

.preset-browser__item--previewing {
  animation: preset-preview-pulse 1s ease-in-out infinite;
}

@keyframes preset-preview-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.preset-browser__item-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preset-browser__item-content {
  flex: 1;
  min-width: 0;
}

.preset-browser__item-name {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preset-browser__item-description {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: var(--spacing-xxs);
}

.preset-browser__item-badge {
  padding: 2px var(--spacing-xs);
  border-radius: var(--radius-xs);
  font-size: 10px;
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.preset-browser__item-badge--factory {
  background: var(--color-blue-alpha);
  color: var(--color-blue);
}

.preset-browser__item-badge--modified {
  background: var(--color-purple-alpha);
  color: var(--color-purple);
}

.preset-browser__item-badge--new {
  background: var(--color-green-alpha);
  color: var(--color-green);
}

.preset-browser__item-actions {
  display: flex;
  gap: var(--spacing-xs);
  opacity: 0;
  transition: opacity 150ms;
}

.preset-browser__item:hover .preset-browser__item-actions {
  opacity: 1;
}

.preset-browser__item-action {
  padding: var(--spacing-xs);
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: var(--radius-xs);
  transition: all 150ms;
}

.preset-browser__item-action:hover {
  background: var(--color-surface-elevated);
  color: var(--color-text);
}

.preset-browser__item-action--favorite {
  color: var(--color-orange);
}

.preset-browser__item-action--delete {
  color: var(--color-red);
}

.preset-browser__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--color-text-muted);
  text-align: center;
}

.preset-browser__empty-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.preset-browser__empty-text {
  font-size: var(--text-md);
  margin-bottom: var(--spacing-sm);
}

.preset-browser__empty-hint {
  font-size: var(--text-sm);
  opacity: 0.7;
}

.preset-browser__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-elevated);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.preset-browser__count {
  font-weight: var(--font-medium);
  color: var(--color-text);
}
`;

/**
 * Apply preset browser CSS to document.
 */
export function applyPresetBrowserCSS(): void {
  const styleId = 'cardplay-preset-browser-css';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = PRESET_BROWSER_CSS;
    document.head.appendChild(style);
  }
}
