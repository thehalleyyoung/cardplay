/**
 * @fileoverview ComposerDeck Layout - RapidComposer-Style Composition Interface
 * 
 * The main layout orchestrator for the ComposerDeck workflow, combining:
 * - Arranger sections bar (song structure)
 * - Chord track panel (harmonic progression)
 * - Session grid (Ableton-style clips)
 * - Score notation card (bottom panel)
 * 
 * Inspired by RapidComposer's phrase-based composition with CardPlay's
 * card system and Ableton's session/clip organization.
 * 
 * @module @cardplay/ui/composer-deck-layout
 */

import type { Tick } from '../types/primitives';
import type { ClipId } from '../state/types';
import type { SongPart } from '../cards/arranger';
import type { ChordSymbolInput } from '../cards/score-notation';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Panel identifiers in the ComposerDeck.
 */
export type ComposerDeckPanelId =
  | 'arranger-sections'
  | 'chord-track'
  | 'session-grid'
  | 'notation'
  | 'deck-bar'
  | 'transport';

/**
 * Panel visibility configuration.
 */
export interface PanelVisibility {
  readonly arrangeSections: boolean;
  readonly chordTrack: boolean;
  readonly sessionGrid: boolean;
  readonly notation: boolean;
  readonly deckBar: boolean;
  readonly transport: boolean;
}

/**
 * Panel heights in pixels (for resizable panels).
 */
export interface PanelHeights {
  readonly arrangerSections: number;
  readonly chordTrack: number;
  readonly sessionGrid: number;
  readonly notation: number;
}

/**
 * Scroll sync state across panels.
 */
export interface ScrollSyncState {
  /** Current horizontal scroll position in bars */
  readonly scrollBar: number;
  /** Visible bar range */
  readonly visibleStartBar: number;
  readonly visibleEndBar: number;
  /** Pixels per bar (zoom level) */
  readonly pixelsPerBar: number;
  /** Whether scroll is locked between panels */
  readonly syncLocked: boolean;
}

/**
 * Selection state for the ComposerDeck.
 */
export interface ComposerDeckSelection {
  /** Selected clip ID (in session grid) */
  readonly selectedClipId: ClipId | null;
  /** Selected track index */
  readonly selectedTrackIndex: number | null;
  /** Selected scene index */
  readonly selectedSceneIndex: number | null;
  /** Selected section ID (in arranger) */
  readonly selectedSectionId: string | null;
  /** Selected chord index */
  readonly selectedChordIndex: number | null;
  /** Selected bar range (for notation) */
  readonly selectedBarRange: { start: number; end: number } | null;
}

/**
 * Playback state for the ComposerDeck.
 */
export interface ComposerDeckPlayback {
  /** Whether playing */
  readonly isPlaying: boolean;
  /** Whether recording */
  readonly isRecording: boolean;
  /** Current playback position in bars */
  readonly currentBar: number;
  /** Current playback position in ticks */
  readonly currentTick: Tick;
  /** Loop enabled */
  readonly loopEnabled: boolean;
  /** Loop start bar */
  readonly loopStartBar: number;
  /** Loop end bar */
  readonly loopEndBar: number;
  /** Current tempo */
  readonly tempo: number;
  /** Time signature */
  readonly timeSignature: { numerator: number; denominator: number };
}

/**
 * Full ComposerDeck state.
 */
export interface ComposerDeckState {
  /** Panel visibility */
  readonly panelVisibility: PanelVisibility;
  /** Panel heights */
  readonly panelHeights: PanelHeights;
  /** Scroll sync state */
  readonly scrollSync: ScrollSyncState;
  /** Selection state */
  readonly selection: ComposerDeckSelection;
  /** Playback state */
  readonly playback: ComposerDeckPlayback;
  /** Song structure (sections) */
  readonly songStructure: readonly SongPart[];
  /** Chord progression */
  readonly chordProgression: readonly ChordSymbolInput[];
  /** Total song length in bars */
  readonly totalBars: number;
  /** Whether in edit mode */
  readonly editMode: boolean;
}

/**
 * ComposerDeck configuration.
 */
export interface ComposerDeckConfig {
  /** Minimum panel height */
  readonly minPanelHeight: number;
  /** Maximum panel height */
  readonly maxPanelHeight: number;
  /** Default pixels per bar */
  readonly defaultPixelsPerBar: number;
  /** Minimum pixels per bar (zoom out limit) */
  readonly minPixelsPerBar: number;
  /** Maximum pixels per bar (zoom in limit) */
  readonly maxPixelsPerBar: number;
  /** Snap to bar boundaries */
  readonly snapToBars: boolean;
  /** Show beat grid lines */
  readonly showBeatGrid: boolean;
  /** Show bar numbers */
  readonly showBarNumbers: boolean;
  /** Auto-scroll during playback */
  readonly followPlayback: boolean;
  /** Ticks per quarter note */
  readonly ticksPerQuarter: number;
}

// ============================================================================
// DEFAULTS
// ============================================================================

/**
 * Default panel visibility.
 */
export const DEFAULT_PANEL_VISIBILITY: PanelVisibility = {
  arrangeSections: true,
  chordTrack: true,
  sessionGrid: true,
  notation: true,
  deckBar: true,
  transport: true,
};

/**
 * Default panel heights.
 */
export const DEFAULT_PANEL_HEIGHTS: PanelHeights = {
  arrangerSections: 48,
  chordTrack: 64,
  sessionGrid: 300,
  notation: 250,
};

/**
 * Default scroll sync state.
 */
export const DEFAULT_SCROLL_SYNC: ScrollSyncState = {
  scrollBar: 0,
  visibleStartBar: 0,
  visibleEndBar: 16,
  pixelsPerBar: 80,
  syncLocked: true,
};

/**
 * Default selection state.
 */
export const DEFAULT_SELECTION: ComposerDeckSelection = {
  selectedClipId: null,
  selectedTrackIndex: null,
  selectedSceneIndex: null,
  selectedSectionId: null,
  selectedChordIndex: null,
  selectedBarRange: null,
};

/**
 * Default playback state.
 */
export const DEFAULT_PLAYBACK: ComposerDeckPlayback = {
  isPlaying: false,
  isRecording: false,
  currentBar: 0,
  currentTick: 0 as Tick,
  loopEnabled: false,
  loopStartBar: 0,
  loopEndBar: 4,
  tempo: 120,
  timeSignature: { numerator: 4, denominator: 4 },
};

/**
 * Default ComposerDeck state.
 */
export const DEFAULT_COMPOSER_DECK_STATE: ComposerDeckState = {
  panelVisibility: DEFAULT_PANEL_VISIBILITY,
  panelHeights: DEFAULT_PANEL_HEIGHTS,
  scrollSync: DEFAULT_SCROLL_SYNC,
  selection: DEFAULT_SELECTION,
  playback: DEFAULT_PLAYBACK,
  songStructure: [],
  chordProgression: [],
  totalBars: 32,
  editMode: true,
};

/**
 * Default configuration.
 */
export const DEFAULT_COMPOSER_DECK_CONFIG: ComposerDeckConfig = {
  minPanelHeight: 48,
  maxPanelHeight: 600,
  defaultPixelsPerBar: 80,
  minPixelsPerBar: 20,
  maxPixelsPerBar: 200,
  snapToBars: true,
  showBeatGrid: true,
  showBarNumbers: true,
  followPlayback: true,
  ticksPerQuarter: 480,
};

// ============================================================================
// LAYOUT CALCULATION
// ============================================================================

/**
 * Calculate the total height of all visible panels.
 */
export function calculateTotalPanelHeight(
  heights: PanelHeights,
  visibility: PanelVisibility
): number {
  let total = 0;
  if (visibility.arrangeSections) total += heights.arrangerSections;
  if (visibility.chordTrack) total += heights.chordTrack;
  if (visibility.sessionGrid) total += heights.sessionGrid;
  if (visibility.notation) total += heights.notation;
  return total;
}

/**
 * Calculate panel positions (top offset for each panel).
 */
export function calculatePanelPositions(
  heights: PanelHeights,
  visibility: PanelVisibility
): Record<ComposerDeckPanelId, number> {
  let currentTop = 0;
  const positions: Record<string, number> = {};
  
  positions['deck-bar'] = 0;
  currentTop += 48; // Deck bar height
  
  if (visibility.arrangeSections) {
    positions['arranger-sections'] = currentTop;
    currentTop += heights.arrangerSections;
  } else {
    positions['arranger-sections'] = -1;
  }
  
  if (visibility.chordTrack) {
    positions['chord-track'] = currentTop;
    currentTop += heights.chordTrack;
  } else {
    positions['chord-track'] = -1;
  }
  
  if (visibility.sessionGrid) {
    positions['session-grid'] = currentTop;
    currentTop += heights.sessionGrid;
  } else {
    positions['session-grid'] = -1;
  }
  
  if (visibility.notation) {
    positions['notation'] = currentTop;
    currentTop += heights.notation;
  } else {
    positions['notation'] = -1;
  }
  
  positions['transport'] = currentTop;
  
  return positions as Record<ComposerDeckPanelId, number>;
}

/**
 * Convert bar position to pixel position.
 */
export function barToPixel(bar: number, pixelsPerBar: number, scrollBar: number): number {
  return (bar - scrollBar) * pixelsPerBar;
}

/**
 * Convert pixel position to bar position.
 */
export function pixelToBar(pixel: number, pixelsPerBar: number, scrollBar: number): number {
  return (pixel / pixelsPerBar) + scrollBar;
}

/**
 * Convert tick position to bar position.
 */
export function tickToBar(
  tick: Tick,
  ticksPerQuarter: number,
  timeSignature: { numerator: number; denominator: number }
): number {
  const ticksPerBar = ticksPerQuarter * timeSignature.numerator * (4 / timeSignature.denominator);
  return tick / ticksPerBar;
}

/**
 * Convert bar position to tick position.
 */
export function barToTick(
  bar: number,
  ticksPerQuarter: number,
  timeSignature: { numerator: number; denominator: number }
): Tick {
  const ticksPerBar = ticksPerQuarter * timeSignature.numerator * (4 / timeSignature.denominator);
  return Math.round(bar * ticksPerBar) as Tick;
}

/**
 * Calculate visible bar range from scroll state.
 */
export function calculateVisibleBars(
  containerWidth: number,
  pixelsPerBar: number,
  scrollBar: number
): { start: number; end: number } {
  const visibleBars = containerWidth / pixelsPerBar;
  return {
    start: scrollBar,
    end: scrollBar + visibleBars,
  };
}

// ============================================================================
// STATE UPDATES
// ============================================================================

/**
 * Update panel visibility.
 */
export function setPanelVisible(
  state: ComposerDeckState,
  panelId: ComposerDeckPanelId,
  visible: boolean
): ComposerDeckState {
  const key = panelIdToVisibilityKey(panelId);
  if (!key) return state;
  
  return {
    ...state,
    panelVisibility: {
      ...state.panelVisibility,
      [key]: visible,
    },
  };
}

/**
 * Map panel ID to visibility key.
 */
function panelIdToVisibilityKey(panelId: ComposerDeckPanelId): keyof PanelVisibility | null {
  switch (panelId) {
    case 'arranger-sections': return 'arrangeSections';
    case 'chord-track': return 'chordTrack';
    case 'session-grid': return 'sessionGrid';
    case 'notation': return 'notation';
    case 'deck-bar': return 'deckBar';
    case 'transport': return 'transport';
    default: return null;
  }
}

/**
 * Update panel height.
 */
export function setPanelHeight(
  state: ComposerDeckState,
  panelId: ComposerDeckPanelId,
  height: number,
  config: ComposerDeckConfig = DEFAULT_COMPOSER_DECK_CONFIG
): ComposerDeckState {
  const key = panelIdToHeightKey(panelId);
  if (!key) return state;
  
  const clampedHeight = Math.max(
    config.minPanelHeight,
    Math.min(config.maxPanelHeight, height)
  );
  
  return {
    ...state,
    panelHeights: {
      ...state.panelHeights,
      [key]: clampedHeight,
    },
  };
}

/**
 * Map panel ID to height key.
 */
function panelIdToHeightKey(panelId: ComposerDeckPanelId): keyof PanelHeights | null {
  switch (panelId) {
    case 'arranger-sections': return 'arrangerSections';
    case 'chord-track': return 'chordTrack';
    case 'session-grid': return 'sessionGrid';
    case 'notation': return 'notation';
    default: return null;
  }
}

/**
 * Update scroll position.
 */
export function setScrollPosition(
  state: ComposerDeckState,
  scrollBar: number,
  containerWidth: number
): ComposerDeckState {
  const { start, end } = calculateVisibleBars(
    containerWidth,
    state.scrollSync.pixelsPerBar,
    scrollBar
  );
  
  return {
    ...state,
    scrollSync: {
      ...state.scrollSync,
      scrollBar,
      visibleStartBar: start,
      visibleEndBar: end,
    },
  };
}

/**
 * Update zoom level (pixels per bar).
 */
export function setZoomLevel(
  state: ComposerDeckState,
  pixelsPerBar: number,
  containerWidth: number,
  config: ComposerDeckConfig = DEFAULT_COMPOSER_DECK_CONFIG
): ComposerDeckState {
  const clampedPixelsPerBar = Math.max(
    config.minPixelsPerBar,
    Math.min(config.maxPixelsPerBar, pixelsPerBar)
  );
  
  const { start, end } = calculateVisibleBars(
    containerWidth,
    clampedPixelsPerBar,
    state.scrollSync.scrollBar
  );
  
  return {
    ...state,
    scrollSync: {
      ...state.scrollSync,
      pixelsPerBar: clampedPixelsPerBar,
      visibleStartBar: start,
      visibleEndBar: end,
    },
  };
}

/**
 * Select a clip.
 */
export function selectClip(
  state: ComposerDeckState,
  clipId: ClipId | null
): ComposerDeckState {
  return {
    ...state,
    selection: {
      ...state.selection,
      selectedClipId: clipId,
    },
  };
}

/**
 * Select a section.
 */
export function selectSection(
  state: ComposerDeckState,
  sectionId: string | null
): ComposerDeckState {
  return {
    ...state,
    selection: {
      ...state.selection,
      selectedSectionId: sectionId,
    },
  };
}

/**
 * Select a chord.
 */
export function selectChord(
  state: ComposerDeckState,
  chordIndex: number | null
): ComposerDeckState {
  return {
    ...state,
    selection: {
      ...state.selection,
      selectedChordIndex: chordIndex,
    },
  };
}

/**
 * Set selected bar range.
 */
export function setSelectedBarRange(
  state: ComposerDeckState,
  startBar: number,
  endBar: number
): ComposerDeckState {
  return {
    ...state,
    selection: {
      ...state.selection,
      selectedBarRange: { start: startBar, end: endBar },
    },
  };
}

/**
 * Clear all selections.
 */
export function clearSelection(state: ComposerDeckState): ComposerDeckState {
  return {
    ...state,
    selection: DEFAULT_SELECTION,
  };
}

/**
 * Update playback position.
 */
export function setPlaybackPosition(
  state: ComposerDeckState,
  tick: Tick,
  config: ComposerDeckConfig = DEFAULT_COMPOSER_DECK_CONFIG
): ComposerDeckState {
  const bar = tickToBar(tick, config.ticksPerQuarter, state.playback.timeSignature);
  
  return {
    ...state,
    playback: {
      ...state.playback,
      currentTick: tick,
      currentBar: bar,
    },
  };
}

/**
 * Set playing state.
 */
export function setPlaying(
  state: ComposerDeckState,
  isPlaying: boolean
): ComposerDeckState {
  return {
    ...state,
    playback: {
      ...state.playback,
      isPlaying,
    },
  };
}

/**
 * Set recording state.
 */
export function setRecording(
  state: ComposerDeckState,
  isRecording: boolean
): ComposerDeckState {
  return {
    ...state,
    playback: {
      ...state.playback,
      isRecording,
    },
  };
}

/**
 * Set loop range.
 */
export function setLoopRange(
  state: ComposerDeckState,
  startBar: number,
  endBar: number,
  enabled: boolean = true
): ComposerDeckState {
  return {
    ...state,
    playback: {
      ...state.playback,
      loopEnabled: enabled,
      loopStartBar: startBar,
      loopEndBar: endBar,
    },
  };
}

/**
 * Set tempo.
 */
export function setTempo(
  state: ComposerDeckState,
  tempo: number
): ComposerDeckState {
  return {
    ...state,
    playback: {
      ...state.playback,
      tempo: Math.max(20, Math.min(400, tempo)),
    },
  };
}

/**
 * Set time signature.
 */
export function setTimeSignature(
  state: ComposerDeckState,
  numerator: number,
  denominator: number
): ComposerDeckState {
  return {
    ...state,
    playback: {
      ...state.playback,
      timeSignature: { numerator, denominator },
    },
  };
}

// ============================================================================
// SONG STRUCTURE OPERATIONS
// ============================================================================

/**
 * Add a section to the song structure.
 */
export function addSection(
  state: ComposerDeckState,
  section: SongPart
): ComposerDeckState {
  return {
    ...state,
    songStructure: [...state.songStructure, section],
    totalBars: calculateTotalBarsFromStructure([...state.songStructure, section]),
  };
}

/**
 * Remove a section from the song structure.
 */
export function removeSection(
  state: ComposerDeckState,
  sectionId: string
): ComposerDeckState {
  const newStructure = state.songStructure.filter(s => s.id !== sectionId);
  return {
    ...state,
    songStructure: newStructure,
    totalBars: calculateTotalBarsFromStructure(newStructure),
    selection: state.selection.selectedSectionId === sectionId
      ? { ...state.selection, selectedSectionId: null }
      : state.selection,
  };
}

/**
 * Update a section in the song structure.
 */
export function updateSection(
  state: ComposerDeckState,
  sectionId: string,
  changes: Partial<Omit<SongPart, 'id'>>
): ComposerDeckState {
  const newStructure = state.songStructure.map(s =>
    s.id === sectionId ? { ...s, ...changes } : s
  );
  return {
    ...state,
    songStructure: newStructure,
    totalBars: calculateTotalBarsFromStructure(newStructure),
  };
}

/**
 * Reorder sections in the song structure.
 */
export function reorderSections(
  state: ComposerDeckState,
  fromIndex: number,
  toIndex: number
): ComposerDeckState {
  const newStructure = [...state.songStructure];
  const [moved] = newStructure.splice(fromIndex, 1);
  if (moved) {
    newStructure.splice(toIndex, 0, moved);
  }
  return {
    ...state,
    songStructure: newStructure,
  };
}

/**
 * Calculate total bars from song structure.
 */
export function calculateTotalBarsFromStructure(structure: readonly SongPart[]): number {
  return structure.reduce((total, part) => total + part.lengthBars * part.repeat, 0);
}

/**
 * Get section at a given bar position.
 */
export function getSectionAtBar(
  structure: readonly SongPart[],
  bar: number
): { section: SongPart; barInSection: number } | null {
  let currentBar = 0;
  
  for (const section of structure) {
    const sectionLength = section.lengthBars * section.repeat;
    if (bar >= currentBar && bar < currentBar + sectionLength) {
      return {
        section,
        barInSection: bar - currentBar,
      };
    }
    currentBar += sectionLength;
  }
  
  return null;
}

/**
 * Get bar range for a section.
 */
export function getSectionBarRange(
  structure: readonly SongPart[],
  sectionId: string
): { start: number; end: number } | null {
  let currentBar = 0;
  
  for (const section of structure) {
    const sectionLength = section.lengthBars * section.repeat;
    if (section.id === sectionId) {
      return {
        start: currentBar,
        end: currentBar + sectionLength,
      };
    }
    currentBar += sectionLength;
  }
  
  return null;
}

// ============================================================================
// CHORD OPERATIONS
// ============================================================================

/**
 * Add a chord to the progression.
 */
export function addChord(
  state: ComposerDeckState,
  chord: ChordSymbolInput
): ComposerDeckState {
  return {
    ...state,
    chordProgression: [...state.chordProgression, chord],
  };
}

/**
 * Remove a chord from the progression.
 */
export function removeChord(
  state: ComposerDeckState,
  index: number
): ComposerDeckState {
  const newProgression = state.chordProgression.filter((_, i) => i !== index);
  return {
    ...state,
    chordProgression: newProgression,
    selection: state.selection.selectedChordIndex === index
      ? { ...state.selection, selectedChordIndex: null }
      : state.selection,
  };
}

/**
 * Update a chord in the progression.
 */
export function updateChord(
  state: ComposerDeckState,
  index: number,
  changes: Partial<ChordSymbolInput>
): ComposerDeckState {
  const newProgression = state.chordProgression.map((c, i) =>
    i === index ? { ...c, ...changes } : c
  );
  return {
    ...state,
    chordProgression: newProgression,
  };
}

/**
 * Get chord at a given tick position.
 */
export function getChordAtTick(
  chords: readonly ChordSymbolInput[],
  tick: Tick
): ChordSymbolInput | null {
  // Find the chord that starts at or before the given tick
  let lastChord: ChordSymbolInput | null = null;
  
  for (const chord of chords) {
    if (chord.startTick <= tick) {
      lastChord = chord;
    } else {
      break;
    }
  }
  
  return lastChord;
}

// ============================================================================
// RENDER HELPERS
// ============================================================================

/**
 * Get grid lines for rendering.
 */
export function getGridLines(
  visibleStartBar: number,
  visibleEndBar: number,
  pixelsPerBar: number,
  timeSignature: { numerator: number; denominator: number },
  showBeats: boolean = true
): Array<{ x: number; type: 'bar' | 'beat'; bar: number; beat?: number }> {
  const lines: Array<{ x: number; type: 'bar' | 'beat'; bar: number; beat?: number }> = [];
  
  const startBar = Math.floor(visibleStartBar);
  const endBar = Math.ceil(visibleEndBar);
  
  for (let bar = startBar; bar <= endBar; bar++) {
    // Bar line
    const barX = (bar - visibleStartBar) * pixelsPerBar;
    lines.push({ x: barX, type: 'bar', bar });
    
    // Beat lines
    if (showBeats) {
      const pixelsPerBeat = pixelsPerBar / timeSignature.numerator;
      for (let beat = 1; beat < timeSignature.numerator; beat++) {
        const beatX = barX + beat * pixelsPerBeat;
        lines.push({ x: beatX, type: 'beat', bar, beat });
      }
    }
  }
  
  return lines;
}

/**
 * Get playhead position in pixels.
 */
export function getPlayheadPosition(
  currentBar: number,
  scrollBar: number,
  pixelsPerBar: number
): number {
  return (currentBar - scrollBar) * pixelsPerBar;
}

/**
 * Check if playhead is visible.
 */
export function isPlayheadVisible(
  currentBar: number,
  visibleStartBar: number,
  visibleEndBar: number
): boolean {
  return currentBar >= visibleStartBar && currentBar <= visibleEndBar;
}

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

/**
 * Keyboard shortcut definitions for ComposerDeck.
 */
export const COMPOSER_DECK_SHORTCUTS = {
  // Playback
  'Space': 'togglePlayback',
  'Enter': 'toggleRecording',
  'Home': 'goToStart',
  'End': 'goToEnd',
  
  // Navigation
  'ArrowLeft': 'previousBar',
  'ArrowRight': 'nextBar',
  'Shift+ArrowLeft': 'previousSection',
  'Shift+ArrowRight': 'nextSection',
  'PageUp': 'pageUp',
  'PageDown': 'pageDown',
  
  // Selection
  'Tab': 'nextClip',
  'Shift+Tab': 'previousClip',
  'Escape': 'clearSelection',
  
  // Editing
  'Delete': 'deleteSelected',
  'Backspace': 'deleteSelected',
  'Ctrl+D': 'duplicateSelected',
  'Ctrl+C': 'copySelected',
  'Ctrl+V': 'paste',
  'Ctrl+X': 'cutSelected',
  'Ctrl+Z': 'undo',
  'Ctrl+Shift+Z': 'redo',
  
  // Zoom
  'Ctrl+=': 'zoomIn',
  'Ctrl+-': 'zoomOut',
  'Ctrl+0': 'zoomFit',
  
  // Panels
  '1': 'toggleArrangerSections',
  '2': 'toggleChordTrack',
  '3': 'toggleSessionGrid',
  '4': 'toggleNotation',
  
  // Generators
  'G': 'generatePhrase',
  'Ctrl+G': 'regenerateVariation',
  'Ctrl+Enter': 'acceptGenerated',
} as const;

export type ComposerDeckShortcutAction = typeof COMPOSER_DECK_SHORTCUTS[keyof typeof COMPOSER_DECK_SHORTCUTS];
