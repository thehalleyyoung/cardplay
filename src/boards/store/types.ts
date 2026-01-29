/**
 * @fileoverview Board State Store Types
 * 
 * Defines the persisted state schema for board preferences and layout.
 * 
 * @module @cardplay/boards/store/types
 */

// ============================================================================
// BOARD STATE SCHEMA
// ============================================================================

/**
 * Persisted board state schema.
 * Saved to localStorage for persistence across sessions.
 */
export interface BoardState {
  /** Schema version for migrations */
  readonly version: number;
  
  /** Currently active board ID */
  currentBoardId: string | null;
  
  /** Recently used board IDs (ordered by recency) */
  recentBoardIds: readonly string[];
  
  /** Favorite board IDs */
  favoriteBoardIds: readonly string[];
  
  /** Per-board layout state (panel sizes, collapsed, etc.) */
  perBoardLayout: Record<string, LayoutState | undefined>;
  
  /** Per-board deck state (active tabs, scroll positions, etc.) */
  perBoardDeckState: Record<string, DeckState | undefined>;
  
  /** Per-board per-track control levels (J041: hybrid boards) */
  perBoardTrackControlLevels: Record<string, TrackControlLevels | undefined>;
  
  /** First-run experience completed */
  firstRunCompleted: boolean;
  
  /** Last time any board was opened */
  lastOpenedAt: number | null;
}

/**
 * Persisted layout state for a board.
 */
export interface LayoutState {
  /** Panel sizes (panel ID → size in pixels) */
  panelSizes: Record<string, number>;
  
  /** Collapsed panels */
  collapsedPanels: readonly string[];
  
  /** Custom layout tree (if modified from default) */
  customTree?: unknown;  // JSON-serializable layout tree
}

/**
 * Persisted deck state for a board.
 */
export interface DeckState {
  /** Active card IDs per deck (deck ID → card ID) */
  activeCards: Record<string, string>;
  
  /** Scroll positions per deck */
  scrollPositions: Record<string, number>;
  
  /** Focused items per deck */
  focusedItems: Record<string, string>;
  
  /** Search/filter state per deck */
  filterState: Record<string, string>;
  
  /** Per-deck custom settings (E030: notation zoom, page config, etc.) */
  deckSettings: Record<string, DeckSettings>;
}

/**
 * Per-deck custom settings.
 */
export interface DeckSettings {
  /** Notation deck settings (E030) */
  notation?: NotationDeckSettings;
  
  /** Mixer deck settings (E046) */
  mixer?: MixerDeckSettings;
  
  /** Other deck-specific settings can be added here */
  [key: string]: unknown;
}

/**
 * Notation deck engraving settings.
 * E030: Persist zoom, page config, staff config per board.
 */
export interface NotationDeckSettings {
  /** Zoom level (percentage, default 100) */
  zoom?: number;
  
  /** Page width in pixels */
  pageWidth?: number;
  
  /** Page height in pixels */
  pageHeight?: number;
  
  /** Staff spacing in pixels */
  staffSpacing?: number;
  
  /** Show measure numbers */
  showMeasureNumbers?: boolean;
  
  /** Show bar lines */
  showBarLines?: boolean;
  
  /** Clef type per staff */
  clefs?: string[];
}

/**
 * Per-track control levels for hybrid boards.
 * J041: Defines per-track control level (track ID → control level).
 * Allows mixing manual + assisted + generative tracks in one board.
 */
export interface TrackControlLevels {
  /** Map of stream ID to control level */
  levels: Record<string, string>;  // streamId → ControlLevel
  
  /** Default control level for new tracks */
  defaultLevel?: string;  // ControlLevel
}

/**
 * Mixer deck settings.
 * E046: Track strip visibility and layout preferences.
 */
export interface MixerDeckSettings {
  /** Visible meter types (peak, RMS, etc.) */
  meterTypes?: string[];
  
  /** Show automation lanes */
  showAutomation?: boolean;
  
  /** Compact mode */
  compactMode?: boolean;
  
  /** Strip width in pixels */
  stripWidth?: number;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

/**
 * Default board state (for first run).
 */
export const DEFAULT_BOARD_STATE: BoardState = {
  version: 1,
  currentBoardId: null,
  recentBoardIds: [],
  favoriteBoardIds: [],
  perBoardLayout: {},
  perBoardDeckState: {},
  perBoardTrackControlLevels: {},
  firstRunCompleted: false,
  lastOpenedAt: null,
};

/**
 * Default layout state.
 */
export const DEFAULT_LAYOUT_STATE: LayoutState = {
  panelSizes: {},
  collapsedPanels: [],
};

/**
 * Default deck state.
 */
export const DEFAULT_DECK_STATE: DeckState = {
  activeCards: {},
  scrollPositions: {},
  focusedItems: {},
  filterState: {},
  deckSettings: {},
};

// ============================================================================
// STATE LISTENER
// ============================================================================

/**
 * Callback for state changes.
 */
export type BoardStateListener = (state: BoardState) => void;
