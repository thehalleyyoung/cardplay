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
 * Unique symbol for branding deck instance IDs.
 * @internal
 */
declare const __deckIdBrand: unique symbol;

/**
 * Deck instance ID (distinct from DeckType).
 * 
 * DeckId identifies a specific deck instance within a board.
 * DeckType identifies the kind of deck.
 * 
 * @example
 * // A board may have multiple decks of the same type:
 * const deck1: BoardDeck = { id: 'main-pattern' as DeckId, type: 'pattern-deck', ... };
 * const deck2: BoardDeck = { id: 'alt-pattern' as DeckId, type: 'pattern-deck', ... };
 */
export type DeckId = string & { readonly [__deckIdBrand]?: never };

/**
 * Create a DeckId from a string.
 */
export function asDeckId(id: string): DeckId {
  return id as DeckId;
}

/**
 * Unique symbol for branding panel IDs.
 * @internal
 */
declare const __panelIdBrand: unique symbol;

/**
 * Panel ID for referencing panels in board layouts.
 * 
 * @example
 * const panelId: PanelId = 'main-editor' as PanelId;
 */
export type PanelId = string & { readonly [__panelIdBrand]?: never };

/**
 * Create a PanelId from a string.
 */
export function asPanelId(id: string): PanelId {
  return id as PanelId;
}

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
  | 'modulation-matrix-deck' // Modulation matrix (M178)
  | 'track-groups-deck'     // Track groups for organizing stems (M258)
  | 'mix-bus-deck'          // Mix bus for group processing (M259)
  | 'reference-track-deck'  // Reference track A/B comparison (M260)
  | 'spectrum-analyzer-deck' // Spectrum analyzer (M179)
  | 'waveform-editor-deck'; // Waveform editor (M180)

/**
 * Deck card layout style.
 */
export type DeckCardLayout =
  | 'stack'      // Stacked cards (one visible at a time)
  | 'tabs'       // Tabbed interface
  | 'split'      // Split view (multiple visible)
  | 'floating'   // Floating cards
  | 'grid';      // Grid layout using DeckLayoutAdapter (slot-grid runtime)

/**
 * Deck definition within a board.
 */
export interface BoardDeck {
  /** Unique deck instance ID */
  readonly id: DeckId;
  /** The type of deck */
  readonly type: DeckType;
  /** Layout style for cards within this deck */
  readonly cardLayout: DeckCardLayout;
  /** Which panel this deck belongs to */
  readonly panelId?: PanelId;
  /** Whether cards can be reordered */
  readonly allowReordering: boolean;
  /** Whether cards can be dragged out */
  readonly allowDragOut: boolean;
  /** Per-deck control level override */
  readonly controlLevelOverride?: ControlLevel;
  /** Default cards to show */
  readonly initialCardIds?: readonly string[];
}

// ============================================================================
// CONNECTIONS
// ============================================================================

/**
 * Change 228: Canonical ConnectionType union.
 * 
 * Used across routing graph, deck layout, and UI.
 * Extension connection types should be namespaced (e.g., 'myext:custom').
 */
export type ConnectionType = 
  | 'audio'       // Audio signal
  | 'midi'        // MIDI data
  | 'modulation'  // Control/modulation signals
  | 'trigger';    // Trigger/gate signals

/**
 * Routing connection between decks.
 */
export interface BoardConnection {
  readonly sourceId: string;
  readonly sourcePort: string;
  readonly targetId: string;
  readonly targetPort: string;
  readonly connectionType: ConnectionType;
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
// ONTOLOGY SELECTION
// ============================================================================

/**
 * Ontology selection for a board.
 * 
 * Boards can support one or multiple ontologies. AI tools and theory decks
 * must respect the board's ontology constraints.
 * 
 * @see Change 139 in to_fix_repo_plan_500.md
 * 
 * Note: OntologySelection type is defined later (~line 491) after OntologyId
 */

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
  /**
   * @deprecated Use `layout.panels` instead. This property is kept for
   * backwards compatibility but will be removed in a future version.
   * See Change 119 in to_fix_repo_plan_500.md
   */
  readonly panels?: readonly PanelDefinition[];
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

  // Ontology selection (Change 139)
  /**
   * Which ontology pack(s) this board supports.
   * AI decks must respect this selection; only ontology-compatible
   * tools/cards are allowed.
   * Defaults to ['western-12tet'] if omitted.
   */
  readonly ontology?: OntologySelection;

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
// ONTOLOGY SELECTION (Change 139)
// ============================================================================

/**
 * Built-in ontology identifiers.
 * Extension ontologies use namespaced IDs (e.g., 'carnatic:22-shruti').
 */
export type BuiltinOntologyId =
  | 'western-12tet'      // Standard 12-tone equal temperament
  | 'western-just'       // Just intonation
  | 'microtonal';        // Generic microtonal support

/**
 * Ontology ID — either a built-in or a namespaced extension ontology.
 */
export type OntologyId = BuiltinOntologyId | (string & {});

/**
 * Per-board ontology selection.
 * Can be a single ontology or a list for multi-ontology boards.
 */
export type OntologySelection = OntologyId | readonly OntologyId[];

/**
 * Default ontology applied when board.ontology is omitted.
 */
export const DEFAULT_ONTOLOGY: OntologyId = 'western-12tet';

/**
 * Get the effective ontology IDs for a board.
 */
export function getBoardOntologies(board: Board): readonly OntologyId[] {
  if (!board.ontology) return [DEFAULT_ONTOLOGY];
  if (typeof board.ontology === 'string') return [board.ontology];
  if (Array.isArray(board.ontology)) return board.ontology;
  // Handle { primary, fallback } structure
  const withFallback = board.ontology as { primary: OntologyId; fallback?: readonly OntologyId[] };
  return [withFallback.primary, ...(withFallback.fallback || [])];
}

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

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get panels from a board, preferring layout.panels over deprecated panels property.
 * 
 * @param board - Board to get panels from
 * @returns The board's panel definitions
 */
export function getBoardPanels(board: Board): readonly PanelDefinition[] {
  // Prefer layout.panels (canonical location)
  if (board.layout.panels.length > 0) {
    return board.layout.panels;
  }
  // Fall back to deprecated top-level panels property
  return board.panels ?? [];
}
