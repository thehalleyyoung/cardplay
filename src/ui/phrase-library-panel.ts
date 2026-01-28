/**
 * @fileoverview Phrase Library Panel - Card-Based Musical Phrase Browser
 * 
 * A library of reusable musical phrases organized as cards. Supports:
 * - Browse phrases by category, style, instrument
 * - Drag & drop phrases to session grid/clips
 * - Auto-adapt phrases to current chord/scale context
 * - Preview phrases in notation before committing
 * - Save current notation selection as new phrase
 * 
 * @module @cardplay/ui/phrase-library-panel
 */

import type { Tick, TickDuration } from '../types/primitives';
import type { ScoreNoteInput, ChordSymbolInput } from '../cards/score-notation';
import type { ClipId } from '../state/types';

// ============================================================================
// PHRASE TYPES
// ============================================================================

/**
 * Unique identifier for a phrase in the library.
 */
export type PhraseId = string & { readonly __phraseId?: unique symbol };

/**
 * Creates a typed PhraseId.
 */
export function asPhraseId(id: string): PhraseId {
  return id as PhraseId;
}

/**
 * Musical phrase stored in the library.
 */
export interface PhraseRecord {
  /** Unique phrase identifier */
  readonly id: PhraseId;
  /** Display name */
  readonly name: string;
  /** Category (bass, melody, rhythm, fill, etc.) */
  readonly category: PhraseCategory;
  /** Tags for filtering */
  readonly tags: readonly string[];
  /** Note events */
  readonly notes: readonly ScoreNoteInput[];
  /** Original chord context (for adaptation) */
  readonly sourceChord?: ChordSymbolInput;
  /** Duration in ticks */
  readonly durationTicks: TickDuration;
  /** Duration in bars (for display) */
  readonly durationBars: number;
  /** Time signature the phrase was created in */
  readonly timeSignature: { numerator: number; denominator: number };
  /** Tempo range this phrase works well in */
  readonly tempoRange?: { min: number; max: number };
  /** Instrument/voice this phrase is for */
  readonly instrument?: string;
  /** Whether this is a user-created phrase */
  readonly userCreated: boolean;
  /** Preview image/thumbnail path */
  readonly thumbnail?: string;
  /** Creation timestamp */
  readonly createdAt: number;
  /** Last used timestamp */
  readonly lastUsedAt?: number;
  /** Usage count */
  readonly usageCount: number;
  /** Favorite flag */
  readonly favorite: boolean;
}

/**
 * Phrase categories for organization.
 */
export type PhraseCategory =
  | 'melody'
  | 'bass'
  | 'rhythm'
  | 'chord'
  | 'fill'
  | 'intro'
  | 'outro'
  | 'transition'
  | 'riff'
  | 'arpeggio'
  | 'ostinato'
  | 'hook'
  | 'custom';

/**
 * Category display information.
 */
export const PHRASE_CATEGORIES: Record<PhraseCategory, { label: string; icon: string; color: string }> = {
  melody: { label: 'Melody', icon: '🎵', color: '#4CAF50' },
  bass: { label: 'Bass', icon: '🎸', color: '#2196F3' },
  rhythm: { label: 'Rhythm', icon: '🥁', color: '#FF9800' },
  chord: { label: 'Chords', icon: '🎹', color: '#9C27B0' },
  fill: { label: 'Fill', icon: '✨', color: '#E91E63' },
  intro: { label: 'Intro', icon: '🎬', color: '#00BCD4' },
  outro: { label: 'Outro', icon: '🎪', color: '#795548' },
  transition: { label: 'Transition', icon: '↔️', color: '#607D8B' },
  riff: { label: 'Riff', icon: '🔥', color: '#F44336' },
  arpeggio: { label: 'Arpeggio', icon: '🌊', color: '#3F51B5' },
  ostinato: { label: 'Ostinato', icon: '🔄', color: '#009688' },
  hook: { label: 'Hook', icon: '🪝', color: '#FF5722' },
  custom: { label: 'Custom', icon: '📝', color: '#9E9E9E' },
};

/**
 * Sort options for phrase library.
 */
export type PhraseSortOption =
  | 'name'
  | 'category'
  | 'duration'
  | 'recent'
  | 'popular'
  | 'favorite';

/**
 * Filter criteria for phrase browsing.
 */
export interface PhraseFilter {
  /** Filter by category */
  readonly categories?: readonly PhraseCategory[];
  /** Filter by tags */
  readonly tags?: readonly string[];
  /** Filter by duration range (bars) */
  readonly durationRange?: { min: number; max: number };
  /** Filter by instrument */
  readonly instrument?: string;
  /** Show only favorites */
  readonly favoritesOnly?: boolean;
  /** Show only user-created */
  readonly userCreatedOnly?: boolean;
  /** Text search */
  readonly searchText?: string;
}

// ============================================================================
// LIBRARY STATE
// ============================================================================

/**
 * Phrase library panel state.
 */
export interface PhraseLibraryState {
  /** All phrases in library */
  readonly phrases: readonly PhraseRecord[];
  /** Current filter */
  readonly filter: PhraseFilter;
  /** Current sort option */
  readonly sortOption: PhraseSortOption;
  /** Sort direction */
  readonly sortAscending: boolean;
  /** Selected phrase for preview */
  readonly selectedPhraseId: PhraseId | null;
  /** Phrase being dragged */
  readonly draggedPhraseId: PhraseId | null;
  /** View mode */
  readonly viewMode: 'grid' | 'list';
  /** Grid columns (for grid view) */
  readonly gridColumns: number;
  /** Expanded categories (for category grouping) */
  readonly expandedCategories: readonly PhraseCategory[];
  /** Group by category */
  readonly groupByCategory: boolean;
  /** Preview playback state */
  readonly previewPlaying: boolean;
  /** Current chord context (for adaptation preview) */
  readonly currentChordContext?: ChordSymbolInput;
  /** Current key context */
  readonly keyContext?: { root: string; mode: 'major' | 'minor' };
}

/**
 * Create initial phrase library state.
 */
export function createPhraseLibraryState(): PhraseLibraryState {
  return {
    phrases: [],
    filter: {},
    sortOption: 'recent',
    sortAscending: false,
    selectedPhraseId: null,
    draggedPhraseId: null,
    viewMode: 'grid',
    gridColumns: 4,
    expandedCategories: Object.keys(PHRASE_CATEGORIES) as PhraseCategory[],
    groupByCategory: true,
    previewPlaying: false,
  };
}

// ============================================================================
// PHRASE LIBRARY OPERATIONS
// ============================================================================

/**
 * Filter phrases based on criteria.
 */
export function filterPhrases(
  phrases: readonly PhraseRecord[],
  filter: PhraseFilter
): readonly PhraseRecord[] {
  return phrases.filter(phrase => {
    // Category filter
    if (filter.categories && filter.categories.length > 0) {
      if (!filter.categories.includes(phrase.category)) return false;
    }
    
    // Tags filter
    if (filter.tags && filter.tags.length > 0) {
      const hasTag = filter.tags.some(tag => phrase.tags.includes(tag));
      if (!hasTag) return false;
    }
    
    // Duration range filter
    if (filter.durationRange) {
      if (phrase.durationBars < filter.durationRange.min ||
          phrase.durationBars > filter.durationRange.max) {
        return false;
      }
    }
    
    // Instrument filter
    if (filter.instrument && phrase.instrument !== filter.instrument) {
      return false;
    }
    
    // Favorites only
    if (filter.favoritesOnly && !phrase.favorite) {
      return false;
    }
    
    // User created only
    if (filter.userCreatedOnly && !phrase.userCreated) {
      return false;
    }
    
    // Text search
    if (filter.searchText) {
      const searchLower = filter.searchText.toLowerCase();
      const nameMatch = phrase.name.toLowerCase().includes(searchLower);
      const tagMatch = phrase.tags.some(tag => tag.toLowerCase().includes(searchLower));
      if (!nameMatch && !tagMatch) return false;
    }
    
    return true;
  });
}

/**
 * Sort phrases based on option.
 */
export function sortPhrases(
  phrases: readonly PhraseRecord[],
  sortOption: PhraseSortOption,
  ascending: boolean
): readonly PhraseRecord[] {
  const sorted = [...phrases].sort((a, b) => {
    let comparison = 0;
    
    switch (sortOption) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
      case 'duration':
        comparison = a.durationBars - b.durationBars;
        break;
      case 'recent':
        comparison = (b.lastUsedAt ?? b.createdAt) - (a.lastUsedAt ?? a.createdAt);
        break;
      case 'popular':
        comparison = b.usageCount - a.usageCount;
        break;
      case 'favorite':
        comparison = (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0);
        break;
    }
    
    return ascending ? comparison : -comparison;
  });
  
  return sorted;
}

/**
 * Group phrases by category.
 */
export function groupPhrasesByCategory(
  phrases: readonly PhraseRecord[]
): Map<PhraseCategory, readonly PhraseRecord[]> {
  const groups = new Map<PhraseCategory, PhraseRecord[]>();
  
  for (const phrase of phrases) {
    const existing = groups.get(phrase.category);
    if (existing) {
      existing.push(phrase);
    } else {
      groups.set(phrase.category, [phrase]);
    }
  }
  
  return groups;
}

/**
 * Get all unique tags from phrases.
 */
export function getAllTags(phrases: readonly PhraseRecord[]): readonly string[] {
  const tagSet = new Set<string>();
  for (const phrase of phrases) {
    for (const tag of phrase.tags) {
      tagSet.add(tag);
    }
  }
  return [...tagSet].sort();
}

/**
 * Get all unique instruments from phrases.
 */
export function getAllInstruments(phrases: readonly PhraseRecord[]): readonly string[] {
  const instrumentSet = new Set<string>();
  for (const phrase of phrases) {
    if (phrase.instrument) {
      instrumentSet.add(phrase.instrument);
    }
  }
  return [...instrumentSet].sort();
}

// ============================================================================
// PHRASE CRUD OPERATIONS
// ============================================================================

/**
 * Create a new phrase from note events.
 */
export function createPhrase(
  name: string,
  category: PhraseCategory,
  notes: readonly ScoreNoteInput[],
  options: {
    tags?: readonly string[];
    sourceChord?: ChordSymbolInput;
    timeSignature?: { numerator: number; denominator: number };
    tempoRange?: { min: number; max: number };
    instrument?: string;
  } = {}
): PhraseRecord {
  const id = `phrase_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` as PhraseId;
  
  // Calculate duration from notes
  let maxEndTick = 0;
  for (const note of notes) {
    const endTick = (note.startTick as number) + (note.durationTick as number);
    if (endTick > maxEndTick) maxEndTick = endTick;
  }
  
  const timeSignature = options.timeSignature ?? { numerator: 4, denominator: 4 };
  const ticksPerBar = 480 * (timeSignature.numerator / timeSignature.denominator) * 4;
  const durationBars = Math.ceil(maxEndTick / ticksPerBar);
  
  // Build phrase record, handling optional fields for exactOptionalPropertyTypes
  const phrase: PhraseRecord = {
    id,
    name,
    category,
    tags: options.tags ?? [],
    notes,
    durationTicks: maxEndTick as TickDuration,
    durationBars,
    timeSignature,
    userCreated: true,
    createdAt: Date.now(),
    usageCount: 0,
    favorite: false,
  };
  
  // Add optional fields only if defined
  if (options.sourceChord !== undefined) {
    (phrase as { sourceChord: ChordSymbolInput }).sourceChord = options.sourceChord;
  }
  if (options.tempoRange !== undefined) {
    (phrase as { tempoRange: { min: number; max: number } }).tempoRange = options.tempoRange;
  }
  if (options.instrument !== undefined) {
    (phrase as { instrument: string }).instrument = options.instrument;
  }
  
  return phrase;
}

/**
 * Update phrase metadata.
 */
export function updatePhrase(
  phrase: PhraseRecord,
  updates: Partial<Pick<PhraseRecord, 'name' | 'category' | 'tags' | 'instrument' | 'favorite'>>
): PhraseRecord {
  return {
    ...phrase,
    ...updates,
  };
}

/**
 * Record phrase usage (updates lastUsedAt and usageCount).
 */
export function recordPhraseUsage(phrase: PhraseRecord): PhraseRecord {
  return {
    ...phrase,
    lastUsedAt: Date.now(),
    usageCount: phrase.usageCount + 1,
  };
}

/**
 * Toggle phrase favorite status.
 */
export function togglePhraseFavorite(phrase: PhraseRecord): PhraseRecord {
  return {
    ...phrase,
    favorite: !phrase.favorite,
  };
}

// ============================================================================
// DRAG & DROP OPERATIONS
// ============================================================================

/**
 * Drag data when dragging a phrase.
 */
export interface PhraseDragData {
  /** Phrase being dragged */
  readonly phrase: PhraseRecord;
  /** Adapted notes (if chord context available) */
  readonly adaptedNotes?: readonly ScoreNoteInput[];
  /** Source chord (if adapted) */
  readonly targetChord?: ChordSymbolInput;
}

/**
 * Drop target information.
 */
export interface PhraseDropTarget {
  /** Target type */
  readonly type: 'clip' | 'track' | 'notation';
  /** Target clip ID (if dropping to clip) */
  readonly clipId?: ClipId;
  /** Target track index (if dropping to track) */
  readonly trackIndex?: number;
  /** Target position in ticks */
  readonly positionTick: Tick;
  /** Whether to replace existing content */
  readonly replace: boolean;
}

/**
 * Start dragging a phrase.
 */
export function startPhraseDrag(
  state: PhraseLibraryState,
  phraseId: PhraseId
): PhraseLibraryState {
  return {
    ...state,
    draggedPhraseId: phraseId,
  };
}

/**
 * End dragging a phrase.
 */
export function endPhraseDrag(state: PhraseLibraryState): PhraseLibraryState {
  return {
    ...state,
    draggedPhraseId: null,
  };
}

/**
 * Create drag data for a phrase.
 */
export function createPhraseDragData(
  phrase: PhraseRecord,
  targetChord?: ChordSymbolInput
): PhraseDragData {
  const result: PhraseDragData = { phrase };
  
  // Will be populated by phrase adapter if chord context available
  if (targetChord !== undefined) {
    return {
      ...result,
      targetChord,
    };
  }
  
  return result;
}

// ============================================================================
// PHRASE PREVIEW
// ============================================================================

/**
 * Preview configuration.
 */
export interface PhrasePreviewConfig {
  /** Play preview at this tempo */
  readonly tempo: number;
  /** Play preview transposed to this root */
  readonly transposeTo?: string;
  /** Play preview adapted to this chord */
  readonly adaptToChord?: ChordSymbolInput;
  /** Loop preview */
  readonly loop: boolean;
}

/**
 * Select a phrase for preview.
 */
export function selectPhraseForPreview(
  state: PhraseLibraryState,
  phraseId: PhraseId | null
): PhraseLibraryState {
  return {
    ...state,
    selectedPhraseId: phraseId,
    previewPlaying: false,
  };
}

/**
 * Start preview playback.
 */
export function startPreviewPlayback(state: PhraseLibraryState): PhraseLibraryState {
  return {
    ...state,
    previewPlaying: true,
  };
}

/**
 * Stop preview playback.
 */
export function stopPreviewPlayback(state: PhraseLibraryState): PhraseLibraryState {
  return {
    ...state,
    previewPlaying: false,
  };
}

// ============================================================================
// VIEW STATE OPERATIONS
// ============================================================================

/**
 * Set view mode.
 */
export function setViewMode(
  state: PhraseLibraryState,
  viewMode: 'grid' | 'list'
): PhraseLibraryState {
  return {
    ...state,
    viewMode,
  };
}

/**
 * Set grid columns.
 */
export function setGridColumns(
  state: PhraseLibraryState,
  columns: number
): PhraseLibraryState {
  return {
    ...state,
    gridColumns: Math.max(1, Math.min(8, columns)),
  };
}

/**
 * Toggle category grouping.
 */
export function toggleGroupByCategory(state: PhraseLibraryState): PhraseLibraryState {
  return {
    ...state,
    groupByCategory: !state.groupByCategory,
  };
}

/**
 * Toggle category expansion.
 */
export function toggleCategoryExpansion(
  state: PhraseLibraryState,
  category: PhraseCategory
): PhraseLibraryState {
  const expanded = state.expandedCategories.includes(category)
    ? state.expandedCategories.filter(c => c !== category)
    : [...state.expandedCategories, category];
  
  return {
    ...state,
    expandedCategories: expanded,
  };
}

/**
 * Expand all categories.
 */
export function expandAllCategories(state: PhraseLibraryState): PhraseLibraryState {
  return {
    ...state,
    expandedCategories: Object.keys(PHRASE_CATEGORIES) as PhraseCategory[],
  };
}

/**
 * Collapse all categories.
 */
export function collapseAllCategories(state: PhraseLibraryState): PhraseLibraryState {
  return {
    ...state,
    expandedCategories: [],
  };
}

// ============================================================================
// FILTER STATE OPERATIONS
// ============================================================================

/**
 * Set filter.
 */
export function setFilter(
  state: PhraseLibraryState,
  filter: PhraseFilter
): PhraseLibraryState {
  return {
    ...state,
    filter,
  };
}

/**
 * Update filter partially.
 */
export function updateFilter(
  state: PhraseLibraryState,
  filterUpdate: Partial<PhraseFilter>
): PhraseLibraryState {
  return {
    ...state,
    filter: {
      ...state.filter,
      ...filterUpdate,
    },
  };
}

/**
 * Clear all filters.
 */
export function clearFilter(state: PhraseLibraryState): PhraseLibraryState {
  return {
    ...state,
    filter: {},
  };
}

/**
 * Set search text.
 */
export function setSearchText(
  state: PhraseLibraryState,
  searchText: string
): PhraseLibraryState {
  const newFilter = { ...state.filter };
  if (searchText) {
    newFilter.searchText = searchText;
  } else {
    delete newFilter.searchText;
  }
  
  return {
    ...state,
    filter: newFilter,
  };
}

/**
 * Toggle category filter.
 */
export function toggleCategoryFilter(
  state: PhraseLibraryState,
  category: PhraseCategory
): PhraseLibraryState {
  const currentCategories = state.filter.categories ?? [];
  const newCategories = currentCategories.includes(category)
    ? currentCategories.filter(c => c !== category)
    : [...currentCategories, category];
  
  const newFilter = { ...state.filter };
  if (newCategories.length > 0) {
    newFilter.categories = newCategories;
  } else {
    delete newFilter.categories;
  }
  
  return {
    ...state,
    filter: newFilter,
  };
}

/**
 * Toggle tag filter.
 */
export function toggleTagFilter(
  state: PhraseLibraryState,
  tag: string
): PhraseLibraryState {
  const currentTags = state.filter.tags ?? [];
  const newTags = currentTags.includes(tag)
    ? currentTags.filter(t => t !== tag)
    : [...currentTags, tag];
  
  const newFilter = { ...state.filter };
  if (newTags.length > 0) {
    newFilter.tags = newTags;
  } else {
    delete newFilter.tags;
  }
  
  return {
    ...state,
    filter: newFilter,
  };
}

// ============================================================================
// SORT STATE OPERATIONS
// ============================================================================

/**
 * Set sort option.
 */
export function setSortOption(
  state: PhraseLibraryState,
  sortOption: PhraseSortOption
): PhraseLibraryState {
  // Toggle direction if same option selected
  const toggleDirection = state.sortOption === sortOption;
  
  return {
    ...state,
    sortOption,
    sortAscending: toggleDirection ? !state.sortAscending : false,
  };
}

// ============================================================================
// CHORD CONTEXT
// ============================================================================

/**
 * Set current chord context for adaptation preview.
 */
export function setChordContext(
  state: PhraseLibraryState,
  chord: ChordSymbolInput | undefined
): PhraseLibraryState {
  if (chord === undefined) {
    const { currentChordContext: _, ...rest } = state;
    return rest as PhraseLibraryState;
  }
  return {
    ...state,
    currentChordContext: chord,
  };
}

/**
 * Set key context.
 */
export function setKeyContext(
  state: PhraseLibraryState,
  keyContext: { root: string; mode: 'major' | 'minor' } | undefined
): PhraseLibraryState {
  if (keyContext === undefined) {
    const { keyContext: _, ...rest } = state;
    return rest as PhraseLibraryState;
  }
  return {
    ...state,
    keyContext,
  };
}

// ============================================================================
// LIBRARY MANAGEMENT
// ============================================================================

/**
 * Add phrase to library.
 */
export function addPhraseToLibrary(
  state: PhraseLibraryState,
  phrase: PhraseRecord
): PhraseLibraryState {
  return {
    ...state,
    phrases: [...state.phrases, phrase],
  };
}

/**
 * Remove phrase from library.
 */
export function removePhraseFromLibrary(
  state: PhraseLibraryState,
  phraseId: PhraseId
): PhraseLibraryState {
  return {
    ...state,
    phrases: state.phrases.filter(p => p.id !== phraseId),
    selectedPhraseId: state.selectedPhraseId === phraseId ? null : state.selectedPhraseId,
  };
}

/**
 * Update phrase in library.
 */
export function updatePhraseInLibrary(
  state: PhraseLibraryState,
  phraseId: PhraseId,
  updates: Partial<Pick<PhraseRecord, 'name' | 'category' | 'tags' | 'instrument' | 'favorite'>>
): PhraseLibraryState {
  return {
    ...state,
    phrases: state.phrases.map(p =>
      p.id === phraseId ? { ...p, ...updates } : p
    ),
  };
}

/**
 * Import phrases from JSON.
 */
export function importPhrases(
  state: PhraseLibraryState,
  phrases: readonly PhraseRecord[]
): PhraseLibraryState {
  // Deduplicate by ID
  const existingIds = new Set(state.phrases.map(p => p.id));
  const newPhrases = phrases.filter(p => !existingIds.has(p.id));
  
  return {
    ...state,
    phrases: [...state.phrases, ...newPhrases],
  };
}

/**
 * Export phrases to JSON-compatible format.
 */
export function exportPhrases(
  phrases: readonly PhraseRecord[]
): readonly PhraseRecord[] {
  // Already in serializable format
  return phrases;
}

// ============================================================================
// COMPUTED VALUES
// ============================================================================

/**
 * Get filtered and sorted phrases.
 */
export function getDisplayPhrases(state: PhraseLibraryState): readonly PhraseRecord[] {
  const filtered = filterPhrases(state.phrases, state.filter);
  return sortPhrases(filtered, state.sortOption, state.sortAscending);
}

/**
 * Get selected phrase.
 */
export function getSelectedPhrase(state: PhraseLibraryState): PhraseRecord | null {
  if (!state.selectedPhraseId) return null;
  return state.phrases.find(p => p.id === state.selectedPhraseId) ?? null;
}

/**
 * Get dragged phrase.
 */
export function getDraggedPhrase(state: PhraseLibraryState): PhraseRecord | null {
  if (!state.draggedPhraseId) return null;
  return state.phrases.find(p => p.id === state.draggedPhraseId) ?? null;
}

/**
 * Get phrase count by category.
 */
export function getPhraseCounts(
  state: PhraseLibraryState
): Map<PhraseCategory, number> {
  const counts = new Map<PhraseCategory, number>();
  
  for (const phrase of state.phrases) {
    const current = counts.get(phrase.category) ?? 0;
    counts.set(phrase.category, current + 1);
  }
  
  return counts;
}

// ============================================================================
// PHRASE LIBRARY PANEL ADAPTER
// ============================================================================

/**
 * Phrase library panel adapter interface.
 * Connects the panel to external systems (notation, clips, etc.)
 */
export interface PhraseLibraryAdapter {
  /** Get current chord context from notation */
  getCurrentChordContext(): ChordSymbolInput | null;
  
  /** Get current key context from notation */
  getKeyContext(): { root: string; mode: 'major' | 'minor' } | null;
  
  /** Preview phrase in notation panel */
  previewInNotation(phrase: PhraseRecord, adapted?: readonly ScoreNoteInput[]): void;
  
  /** Clear notation preview */
  clearNotationPreview(): void;
  
  /** Drop phrase to clip */
  dropToClip(clipId: ClipId, phrase: PhraseRecord, positionTick: Tick): void;
  
  /** Save current notation selection as phrase */
  saveSelectionAsPhrase(name: string, category: PhraseCategory): PhraseRecord | null;
  
  /** Start audio preview */
  startAudioPreview(phrase: PhraseRecord): void;
  
  /** Stop audio preview */
  stopAudioPreview(): void;
}

/**
 * Phrase library panel controller.
 * Manages state and coordinates with external systems.
 */
export class PhraseLibraryController {
  private state: PhraseLibraryState;
  private adapter: PhraseLibraryAdapter | null = null;
  private listeners: Set<(state: PhraseLibraryState) => void> = new Set();
  
  constructor(initialPhrases: readonly PhraseRecord[] = []) {
    this.state = {
      ...createPhraseLibraryState(),
      phrases: initialPhrases,
    };
  }
  
  /**
   * Set the adapter for external system integration.
   */
  setAdapter(adapter: PhraseLibraryAdapter): void {
    this.adapter = adapter;
  }
  
  /**
   * Get current state.
   */
  getState(): PhraseLibraryState {
    return this.state;
  }
  
  /**
   * Subscribe to state changes.
   */
  subscribe(listener: (state: PhraseLibraryState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  /**
   * Update state and notify listeners.
   */
  private updateState(newState: PhraseLibraryState): void {
    this.state = newState;
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
  
  /**
   * Select a phrase.
   */
  selectPhrase(phraseId: PhraseId | null): void {
    this.updateState(selectPhraseForPreview(this.state, phraseId));
    
    // Preview in notation if adapter available
    if (this.adapter && phraseId) {
      const phrase = getSelectedPhrase(this.state);
      if (phrase) {
        this.adapter.previewInNotation(phrase);
      }
    } else if (this.adapter) {
      this.adapter.clearNotationPreview();
    }
  }
  
  /**
   * Start dragging a phrase.
   */
  startDrag(phraseId: PhraseId): void {
    this.updateState(startPhraseDrag(this.state, phraseId));
  }
  
  /**
   * End dragging.
   */
  endDrag(): void {
    this.updateState(endPhraseDrag(this.state));
  }
  
  /**
   * Handle drop to target.
   */
  handleDrop(target: PhraseDropTarget): void {
    const phrase = getDraggedPhrase(this.state);
    if (!phrase || !this.adapter) return;
    
    if (target.type === 'clip' && target.clipId) {
      this.adapter.dropToClip(target.clipId, phrase, target.positionTick);
    }
    
    // Record usage
    this.updateState({
      ...this.state,
      phrases: this.state.phrases.map(p =>
        p.id === phrase.id ? recordPhraseUsage(p) : p
      ),
    });
    
    this.endDrag();
  }
  
  /**
   * Toggle preview playback.
   */
  togglePreview(): void {
    if (this.state.previewPlaying) {
      this.updateState(stopPreviewPlayback(this.state));
      this.adapter?.stopAudioPreview();
    } else {
      const phrase = getSelectedPhrase(this.state);
      if (phrase) {
        this.updateState(startPreviewPlayback(this.state));
        this.adapter?.startAudioPreview(phrase);
      }
    }
  }
  
  /**
   * Save current selection as phrase.
   */
  saveAsPhrase(name: string, category: PhraseCategory): PhraseRecord | null {
    if (!this.adapter) return null;
    
    const phrase = this.adapter.saveSelectionAsPhrase(name, category);
    if (phrase) {
      this.updateState(addPhraseToLibrary(this.state, phrase));
    }
    
    return phrase;
  }
  
  /**
   * Delete a phrase.
   */
  deletePhrase(phraseId: PhraseId): void {
    this.updateState(removePhraseFromLibrary(this.state, phraseId));
  }
  
  /**
   * Toggle phrase favorite.
   */
  toggleFavorite(phraseId: PhraseId): void {
    this.updateState(updatePhraseInLibrary(this.state, phraseId, {
      favorite: !this.state.phrases.find(p => p.id === phraseId)?.favorite,
    }));
  }
  
  /**
   * Set filter.
   */
  setFilter(filter: PhraseFilter): void {
    this.updateState(setFilter(this.state, filter));
  }
  
  /**
   * Set search text.
   */
  search(text: string): void {
    this.updateState(setSearchText(this.state, text));
  }
  
  /**
   * Set sort option.
   */
  setSort(option: PhraseSortOption): void {
    this.updateState(setSortOption(this.state, option));
  }
  
  /**
   * Set view mode.
   */
  setViewMode(mode: 'grid' | 'list'): void {
    this.updateState(setViewMode(this.state, mode));
  }
  
  /**
   * Toggle category grouping.
   */
  toggleGrouping(): void {
    this.updateState(toggleGroupByCategory(this.state));
  }
  
  /**
   * Toggle category expansion.
   */
  toggleCategory(category: PhraseCategory): void {
    this.updateState(toggleCategoryExpansion(this.state, category));
  }
  
  /**
   * Import phrases.
   */
  import(phrases: readonly PhraseRecord[]): void {
    this.updateState(importPhrases(this.state, phrases));
  }
  
  /**
   * Export phrases.
   */
  export(): readonly PhraseRecord[] {
    return exportPhrases(this.state.phrases);
  }
  
  /**
   * Update chord context.
   */
  updateChordContext(): void {
    if (this.adapter) {
      const chord = this.adapter.getCurrentChordContext();
      this.updateState(setChordContext(this.state, chord ?? undefined));
    }
  }
  
  /**
   * Update key context.
   */
  updateKeyContext(): void {
    if (this.adapter) {
      const key = this.adapter.getKeyContext();
      this.updateState(setKeyContext(this.state, key ?? undefined));
    }
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let phraseLibraryControllerInstance: PhraseLibraryController | null = null;

/**
 * Get the phrase library controller singleton.
 */
export function getPhraseLibraryController(): PhraseLibraryController {
  if (!phraseLibraryControllerInstance) {
    phraseLibraryControllerInstance = new PhraseLibraryController();
  }
  return phraseLibraryControllerInstance;
}

/**
 * Reset phrase library controller (for testing).
 */
export function resetPhraseLibraryController(): void {
  phraseLibraryControllerInstance = null;
}
