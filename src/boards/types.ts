/**
 * @fileoverview Board System Core Types
 * 
 * Defines the type-level foundation for the Board-Centric Architecture.
 * Boards parameterize which cards/tools are available, creating a typed
 * environment that prevents UI confusion and ensures consistency.
 * 
 * @module @cardplay/boards/types
 */

// ============================================================================
// CONTROL LEVEL
// ============================================================================

/**
 * Control level defines the degree of automation/AI involvement.
 * This determines which card types and tool modes are available.
 * 
 * @see cardplayui.md Part I: The Control Spectrum
 */
export type ControlLevel =
  | 'full-manual'           // You control everything
  | 'manual-with-hints'     // Manual + suggestions
  | 'assisted'              // Your ideas + tool execution
  | 'collaborative'         // 50/50 with AI
  | 'directed'              // You direct, AI creates
  | 'generative';           // AI creates, you curate

// ============================================================================
// VIEW AND DIFFICULTY
// ============================================================================

/**
 * Primary view type for a board.
 */
export type ViewType =
  | 'tracker'
  | 'notation'
  | 'session'
  | 'arranger'
  | 'composer'
  | 'sampler';

/**
 * Board difficulty level (for onboarding/recommendations).
 */
export type BoardDifficulty =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'expert';

// ============================================================================
// TOOLS AND MODES
// ============================================================================

/**
 * Composition tool kinds available in CardPlay.
 */
export type ToolKind =
  | 'phraseDatabase'
  | 'harmonyExplorer'
  | 'phraseGenerators'
  | 'arrangerCard'
  | 'aiComposer';

/**
 * Tool mode mapping: each tool kind has specific modes.
 */
export type ToolMode<K extends ToolKind> =
  K extends 'phraseDatabase' ? 'hidden' | 'browse-only' | 'drag-drop' | 'auto-suggest' :
  K extends 'harmonyExplorer' ? 'hidden' | 'display-only' | 'suggest' | 'auto-apply' :
  K extends 'phraseGenerators' ? 'hidden' | 'on-demand' | 'continuous' :
  K extends 'arrangerCard' ? 'hidden' | 'manual-trigger' | 'chord-follow' | 'autonomous' :
  K extends 'aiComposer' ? 'hidden' | 'command-palette' | 'inline-suggest' | 'autonomous' :
  never;

/**
 * Configuration for a single tool.
 */
export interface ToolConfig<K extends ToolKind> {
  readonly enabled: boolean;
  readonly mode: ToolMode<K>;
}

/**
 * Complete composition tool configuration for a board.
 */
export interface CompositionToolConfig {
  readonly phraseDatabase: ToolConfig<'phraseDatabase'>;
  readonly harmonyExplorer: ToolConfig<'harmonyExplorer'>;
  readonly phraseGenerators: ToolConfig<'phraseGenerators'>;
  readonly arrangerCard: ToolConfig<'arrangerCard'>;
  readonly aiComposer: ToolConfig<'aiComposer'>;
}

/**
 * UI behavior determined by tool mode (type-level).
 */
export type UIBehavior<K extends ToolKind, M extends ToolMode<K>> = {
  canDrag: M extends 'drag-drop' | 'auto-suggest' ? true : false;
  canAutoSuggest: M extends 'auto-suggest' | 'continuous' | 'autonomous' ? true : false;
  showsInPanel: M extends 'hidden' ? false : true;
  requiresUserTrigger: M extends 'on-demand' | 'manual-trigger' | 'command-palette' ? true : false;
};

// ============================================================================
// PANELS AND LAYOUT
// ============================================================================

/**
 * Panel roles within a board layout.
 */
export type PanelRole =
  | 'browser'       // File/clip/phrase browser
  | 'composition'   // Main composition area
  | 'properties'    // Properties inspector
  | 'mixer'         // Audio mixer
  | 'timeline'      // Arrangement timeline
  | 'toolbar'       // Toolbar actions
  | 'transport';    // Transport controls

/**
 * Panel position within the board.
 */
export type PanelPosition =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'center';

/**
 * Panel definition within a board layout.
 */
export interface PanelDefinition {
  readonly id: string;
  readonly role: PanelRole;
  readonly position: PanelPosition;
  readonly defaultWidth?: number;
  readonly defaultHeight?: number;
  readonly collapsible?: boolean;
  readonly resizable?: boolean;
}

/**
 * Board layout configuration.
 */
export interface BoardLayout {
  readonly type: 'dock' | 'grid' | 'custom';
  readonly panels: readonly PanelDefinition[];
  readonly orientation?: 'horizontal' | 'vertical';
}

// ============================================================================
// DECKS
// ============================================================================

/**
 * Deck types available in boards.
 */
export type DeckType =
  | 'pattern-deck'          // Tracker pattern editor
  | 'notation-deck'         // Notation editor
  | 'piano-roll-deck'       // Piano roll editor
  | 'session-deck'          // Session view clips
  | 'arrangement-deck'      // Timeline arrangement
  | 'instruments-deck'      // Instrument rack
  | 'dsp-chain'             // DSP effect chain (E042)
  | 'effects-deck'          // Effect rack
  | 'samples-deck'          // Sample browser
  | 'phrases-deck'          // Phrase library
  | 'harmony-deck'          // Harmony explorer
  | 'generators-deck'       // Generator cards
  | 'mixer-deck'            // Mixer channels
  | 'routing-deck'          // Routing graph
  | 'automation-deck'       // Automation lanes
  | 'properties-deck'       // Properties inspector
  | 'transport-deck'        // Transport controls (E060)
  | 'arranger-deck'         // Arranger sections (E057)
  | 'ai-advisor-deck'       // AI Advisor panel (L299)
  | 'sample-manager-deck'   // Sample manager / organizer (M100)
  | 'modulation-matrix-deck'; // Modulation matrix (M178)

/**
 * Deck card layout style.
 */
export type DeckCardLayout =
  | 'stack'      // Stacked cards (one visible at a time)
  | 'tabs'       // Tabbed interface
  | 'split'      // Split view (multiple visible)
  | 'floating';  // Floating cards

/**
 * Deck definition within a board.
 */
export interface BoardDeck {
  readonly id: string;
  readonly type: DeckType;
  readonly cardLayout: DeckCardLayout;
  readonly allowReordering: boolean;
  readonly allowDragOut: boolean;
  readonly controlLevelOverride?: ControlLevel;  // Per-deck control level
  readonly initialCardIds?: readonly string[];    // Default cards to show
}

// ============================================================================
// CONNECTIONS
// ============================================================================

/**
 * Routing connection between decks.
 */
export interface BoardConnection {
  readonly sourceId: string;
  readonly sourcePort: string;
  readonly targetId: string;
  readonly targetPort: string;
  readonly connectionType: 'audio' | 'midi' | 'modulation' | 'trigger';
}

// ============================================================================
// THEME AND SHORTCUTS
// ============================================================================

/**
 * Board theme configuration.
 */
export interface BoardTheme {
  readonly colors?: {
    readonly primary?: string;
    readonly secondary?: string;
    readonly accent?: string;
    readonly background?: string;
  };
  readonly typography?: {
    readonly fontFamily?: string;
    readonly fontSize?: number;
  };
  readonly controlIndicators?: {
    readonly showHints?: boolean;
    readonly showSuggestions?: boolean;
    readonly showGenerative?: boolean;
  };
}

/**
 * Keyboard shortcut mapping.
 */
export type BoardShortcutMap = Record<string, string>;

// ============================================================================
// BOARD POLICY
// ============================================================================

/**
 * Board policy defines what users can customize.
 * Some boards are fixed (presets), others are flexible (power users).
 */
export interface BoardPolicy {
  /** Whether users can toggle tool modes at runtime */
  readonly allowToolToggles: boolean;
  
  /** Whether users can override control level per track/deck */
  readonly allowControlLevelOverridePerTrack: boolean;
  
  /** Whether users can add/remove decks */
  readonly allowDeckCustomization: boolean;
  
  /** Whether users can rearrange panels */
  readonly allowLayoutCustomization: boolean;
}

/**
 * Default board policy (locked preset).
 */
export const DEFAULT_BOARD_POLICY: BoardPolicy = {
  allowToolToggles: false,
  allowControlLevelOverridePerTrack: false,
  allowDeckCustomization: false,
  allowLayoutCustomization: true, // Layout customization typically allowed
};

/**
 * Flexible board policy (power user).
 */
export const FLEXIBLE_BOARD_POLICY: BoardPolicy = {
  allowToolToggles: true,
  allowControlLevelOverridePerTrack: true,
  allowDeckCustomization: true,
  allowLayoutCustomization: true,
};

// ============================================================================
// BOARD DEFINITION
// ============================================================================

/**
 * Board ID type alias for type safety.
 */
export type BoardId = string;

/**
 * Complete Board definition matching cardplayui.md §2.1.
 */
export interface Board {
  // Identity
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  
  // Control philosophy
  readonly controlLevel: ControlLevel;
  readonly philosophy: string;
  
  // Layout
  readonly layout: BoardLayout;
  readonly panels: readonly PanelDefinition[];
  readonly decks: readonly BoardDeck[];
  
  // Tools configuration
  readonly compositionTools: CompositionToolConfig;
  
  // Routing and defaults
  readonly connections: readonly BoardConnection[];
  readonly defaultCards?: readonly string[];
  
  // Interaction
  readonly shortcuts?: BoardShortcutMap;
  readonly theme?: BoardTheme;
  readonly policy?: BoardPolicy;  // Customization policy (defaults to DEFAULT_BOARD_POLICY)

  // View configuration
  readonly primaryView?: ViewType;

  // Lifecycle hooks (optional)
  readonly onActivate?: () => void | Promise<void>;
  readonly onDeactivate?: () => void | Promise<void>;

  // Metadata
  readonly author: string;
  readonly version: string;
  readonly difficulty: BoardDifficulty;
  readonly tags?: readonly string[];
  readonly category?: string;
}

/**
 * Generic board with type parameters for typed environments.
 */
export type TypedBoard<
  L extends ControlLevel = ControlLevel,
  C extends CompositionToolConfig = CompositionToolConfig,
  V extends ViewType = ViewType
> = Board & {
  readonly controlLevel: L;
  readonly compositionTools: C;
  readonly primaryView: V;
};

// ============================================================================
// CARD TAXONOMY
// ============================================================================

/**
 * Card kind taxonomy (by control level).
 */
export type CardKind =
  | 'manual'          // Manual editing only
  | 'hint'            // Display hints/suggestions (no auto-apply)
  | 'assisted'        // On-demand generation/assistance
  | 'collaborative'   // Inline suggestions (accept/reject)
  | 'generative';     // Autonomous generation

/**
 * Type-level card filter based on control level.
 * More permissive levels include all cards from less permissive levels.
 */
export type CardFilter<L extends ControlLevel, _C extends CompositionToolConfig = CompositionToolConfig> =
  L extends 'full-manual' ? 'manual' :
  L extends 'manual-with-hints' ? 'manual' | 'hint' :
  L extends 'assisted' ? 'manual' | 'hint' | 'assisted' :
  L extends 'collaborative' ? 'manual' | 'hint' | 'assisted' | 'collaborative' :
  L extends 'directed' | 'generative' ? 'manual' | 'hint' | 'assisted' | 'collaborative' | 'generative' :
  never;

/**
 * Runtime representation of allowed card kinds.
 */
export type AllowedCardKinds = ReadonlySet<CardKind>;

/**
 * Runtime representation of allowed tool modes.
 */
export type AllowedToolModes<K extends ToolKind> = ReadonlySet<ToolMode<K>>;

// ============================================================================
// BOARD CATEGORIES
// ============================================================================

/**
 * Board category for organization.
 */
export interface BoardCategory {
  readonly category: string;
  readonly description: string;
  readonly boards: readonly string[];  // Board IDs
}

/**
 * User type for board recommendations.
 */
export type UserType =
  | 'notation-composer'
  | 'tracker-user'
  | 'producer'
  | 'live-performer'
  | 'sound-designer'
  | 'ai-explorer'
  | 'beginner';
