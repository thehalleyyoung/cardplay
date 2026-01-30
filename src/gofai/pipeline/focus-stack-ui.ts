/**
 * GOFAI Pipeline — Focus Stack UI Exposure
 *
 * Defines how the UI exposes the current focus stack
 * (board → deck → selection) as an explicit context panel.
 *
 * The focus stack is the implicit scope that determines what
 * "it", "this", and unscoped commands refer to. Making it
 * visible and interactive prevents confusion and supports
 * the "no magic" principle.
 *
 * ## Design Principles
 *
 * 1. **Always visible** — The focus stack is displayed at all times,
 *    not just when disambiguation is needed.
 * 2. **Editable** — The user can click levels to change scope.
 * 3. **Breadcrumb navigation** — Each level links to its entity.
 * 4. **Badge counts** — Show how many entities exist at each level.
 * 5. **Highlights** — When the user types a command, highlight
 *    which focus stack level will be affected.
 * 6. **History** — Show recent focus changes for "go back".
 *
 * @module gofai/pipeline/focus-stack-ui
 * @see gofai_goalA.md Step 084
 * @see gofaimusicplus.md — board annotations, deck-level scope
 */

// =============================================================================
// FOCUS LEVEL — one level in the focus stack
// =============================================================================

/**
 * A level in the focus stack.
 */
export interface FocusLevel {
  /** Depth in the stack (0 = board, 1 = deck, 2 = track/layer, etc.) */
  readonly depth: number;

  /** Type of entity at this level */
  readonly entityType: FocusEntityType;

  /** Display name */
  readonly displayName: string;

  /** Entity ID */
  readonly entityId: string;

  /** Short label (for breadcrumb) */
  readonly shortLabel: string;

  /** Icon identifier */
  readonly icon: FocusLevelIcon;

  /** How many child entities exist */
  readonly childCount: number;

  /** Whether this level is the "active" focus */
  readonly isActive: boolean;

  /** Whether the user explicitly set this focus */
  readonly isExplicit: boolean;

  /** Metadata about this level */
  readonly metadata: FocusLevelMetadata;
}

/**
 * Entity types that can appear in the focus stack.
 */
export type FocusEntityType =
  | 'board'
  | 'deck'
  | 'track'
  | 'section'
  | 'card'
  | 'parameter'
  | 'event_selection'
  | 'time_range';

/**
 * Icons for focus levels.
 */
export type FocusLevelIcon =
  | 'board'           // Grid/layout icon
  | 'deck'            // Stack/deck icon
  | 'track'           // Waveform/track icon
  | 'section'         // Section bracket icon
  | 'card'            // Card/note icon
  | 'parameter'       // Knob/slider icon
  | 'selection'       // Selection highlight icon
  | 'time_range'      // Time range icon
  | 'global';         // Globe/all icon

/**
 * Metadata for a focus level.
 */
export interface FocusLevelMetadata {
  /** When this focus was last activated */
  readonly lastActivated: number;

  /** How many times this entity has been focused */
  readonly focusCount: number;

  /** Time range this level covers (if applicable) */
  readonly timeRange?: {
    readonly startBar: number;
    readonly endBar: number;
  };

  /** Number of events in this scope */
  readonly eventCount?: number;

  /** Additional info for display */
  readonly info?: string;
}

// =============================================================================
// FOCUS STACK — the complete stack
// =============================================================================

/**
 * The complete focus stack state for UI display.
 */
export interface FocusStackState {
  /** All levels in the stack (ordered from broadest to narrowest) */
  readonly levels: readonly FocusLevel[];

  /** The deepest active level (the "current focus") */
  readonly activeDepth: number;

  /** Whether the stack has been explicitly set by the user */
  readonly isExplicit: boolean;

  /** How the current focus was determined */
  readonly focusSource: FocusSource;

  /** When the focus last changed */
  readonly lastChanged: number;

  /** The "effective scope" summary for display */
  readonly effectiveScopeLabel: string;

  /** Focus history (recent changes) */
  readonly history: readonly FocusHistoryEntry[];
}

/**
 * How the current focus was determined.
 */
export type FocusSource =
  | 'user_click'       // User clicked on an entity
  | 'user_selection'   // User made a selection
  | 'user_navigation'  // User navigated (scroll, zoom)
  | 'command_scope'    // A command specified a scope
  | 'salience'         // Salience-based (most recently mentioned)
  | 'default'          // System default
  | 'restored'         // Restored from undo/redo
  | 'inherited';       // Inherited from parent

/**
 * An entry in the focus history.
 */
export interface FocusHistoryEntry {
  /** The focus level that was active */
  readonly level: FocusLevel;

  /** When this focus was active */
  readonly timestamp: number;

  /** What caused the focus change */
  readonly source: FocusSource;

  /** Turn number */
  readonly turnNumber: number;
}

// =============================================================================
// FOCUS PANEL — UI panel layout types
// =============================================================================

/**
 * Configuration for the focus stack panel.
 */
export interface FocusPanelConfig {
  /** Where to position the panel */
  readonly position: PanelPosition;

  /** Whether the panel is collapsible */
  readonly collapsible: boolean;

  /** Whether the panel is collapsed by default */
  readonly defaultCollapsed: boolean;

  /** Maximum depth to display (deeper levels are nested) */
  readonly maxDisplayDepth: number;

  /** Whether to show event counts at each level */
  readonly showEventCounts: boolean;

  /** Whether to show time ranges */
  readonly showTimeRanges: boolean;

  /** Whether to show focus history */
  readonly showHistory: boolean;

  /** Maximum history entries to show */
  readonly maxHistoryEntries: number;

  /** Whether to show the "scope preview" when typing */
  readonly showScopePreview: boolean;

  /** Whether to highlight affected levels during command input */
  readonly highlightOnInput: boolean;
}

export type PanelPosition =
  | 'left_sidebar'
  | 'right_sidebar'
  | 'top_bar'
  | 'bottom_bar'
  | 'floating';

/**
 * Default configuration.
 */
export const DEFAULT_FOCUS_PANEL_CONFIG: FocusPanelConfig = {
  position: 'left_sidebar',
  collapsible: true,
  defaultCollapsed: false,
  maxDisplayDepth: 5,
  showEventCounts: true,
  showTimeRanges: true,
  showHistory: true,
  maxHistoryEntries: 10,
  showScopePreview: true,
  highlightOnInput: true,
};

// =============================================================================
// BREADCRUMB — breadcrumb navigation component
// =============================================================================

/**
 * A breadcrumb item for focus stack navigation.
 */
export interface FocusBreadcrumb {
  /** Display label */
  readonly label: string;

  /** Short label (for narrow widths) */
  readonly shortLabel: string;

  /** Depth level */
  readonly depth: number;

  /** Entity type */
  readonly entityType: FocusEntityType;

  /** Entity ID (for click navigation) */
  readonly entityId: string;

  /** Whether this is the current (deepest) level */
  readonly isCurrent: boolean;

  /** Badge text (e.g., event count) */
  readonly badge?: string;

  /** Tooltip text */
  readonly tooltip: string;
}

/**
 * Build breadcrumbs from a focus stack.
 */
export function buildBreadcrumbs(stack: FocusStackState): readonly FocusBreadcrumb[] {
  return stack.levels.map(level => ({
    label: level.displayName,
    shortLabel: level.shortLabel,
    depth: level.depth,
    entityType: level.entityType,
    entityId: level.entityId,
    isCurrent: level.depth === stack.activeDepth,
    badge: level.metadata.eventCount !== undefined
      ? `${level.metadata.eventCount}`
      : undefined,
    tooltip: buildLevelTooltip(level),
  }));
}

/**
 * Build tooltip for a focus level.
 */
function buildLevelTooltip(level: FocusLevel): string {
  const parts: string[] = [
    `${level.displayName} (${level.entityType})`,
  ];

  if (level.childCount > 0) {
    parts.push(`${level.childCount} children`);
  }

  if (level.metadata.timeRange) {
    parts.push(`Bars ${level.metadata.timeRange.startBar}–${level.metadata.timeRange.endBar}`);
  }

  if (level.metadata.eventCount !== undefined) {
    parts.push(`${level.metadata.eventCount} events`);
  }

  if (level.isExplicit) {
    parts.push('Explicitly focused');
  }

  return parts.join(' · ');
}

// =============================================================================
// SCOPE PREVIEW — what the current scope will affect
// =============================================================================

/**
 * A scope preview shown during command input.
 *
 * When the user starts typing a command, the UI shows a preview
 * of what scope will be affected based on the focus stack.
 */
export interface ScopePreview {
  /** The command being typed */
  readonly partialCommand: string;

  /** What scope is currently implied */
  readonly impliedScope: ImpliedScope;

  /** Whether the user has overridden the default scope */
  readonly isOverridden: boolean;

  /** What would be affected */
  readonly affectedEntities: readonly AffectedEntity[];

  /** Total event count that would be affected */
  readonly totalEvents: number;

  /** Visual highlights for the scope */
  readonly highlights: readonly ScopeHighlight[];
}

/**
 * The implied scope for a command.
 */
export interface ImpliedScope {
  /** Which focus level provides the scope */
  readonly sourceLevel: number;

  /** How the scope was determined */
  readonly source: FocusSource;

  /** Sections included */
  readonly sections: readonly string[];

  /** Layers included */
  readonly layers: readonly string[];

  /** Time range */
  readonly timeRange?: {
    readonly startBar: number;
    readonly endBar: number;
  };

  /** Description */
  readonly description: string;
}

/**
 * An entity that would be affected by the current command.
 */
export interface AffectedEntity {
  /** Entity type */
  readonly entityType: FocusEntityType;

  /** Entity ID */
  readonly entityId: string;

  /** Display name */
  readonly displayName: string;

  /** How it is affected */
  readonly effectType: 'modified' | 'preserved' | 'added' | 'removed';
}

/**
 * A visual highlight for scope preview.
 */
export interface ScopeHighlight {
  /** What to highlight */
  readonly target: HighlightTarget;

  /** Highlight style */
  readonly style: HighlightStyle;

  /** Duration of highlight (ms, 0 = persistent) */
  readonly duration: number;
}

export type HighlightTarget =
  | { readonly kind: 'focus_level'; readonly depth: number }
  | { readonly kind: 'section'; readonly sectionName: string }
  | { readonly kind: 'layer'; readonly layerName: string }
  | { readonly kind: 'time_range'; readonly startBar: number; readonly endBar: number }
  | { readonly kind: 'events'; readonly eventCount: number };

export type HighlightStyle =
  | 'active_scope'     // Primary scope highlight (blue)
  | 'affected'         // Will be modified (yellow)
  | 'preserved'        // Will be preserved (green)
  | 'warning'          // Potential issue (orange)
  | 'error';           // Invalid scope (red)

// =============================================================================
// FOCUS STACK INTERACTIONS — user actions on the panel
// =============================================================================

/**
 * Actions the user can take on the focus panel.
 */
export type FocusPanelAction =
  | { readonly type: 'click_level'; readonly depth: number }
  | { readonly type: 'expand_level'; readonly depth: number }
  | { readonly type: 'collapse_level'; readonly depth: number }
  | { readonly type: 'navigate_parent' }
  | { readonly type: 'navigate_child'; readonly childId: string }
  | { readonly type: 'clear_focus' }
  | { readonly type: 'restore_history'; readonly historyIndex: number }
  | { readonly type: 'toggle_panel' }
  | { readonly type: 'pin_focus' }
  | { readonly type: 'unpin_focus' }
  | { readonly type: 'set_scope_override'; readonly scope: ImpliedScope }
  | { readonly type: 'clear_scope_override' };

/**
 * Result of a focus panel action.
 */
export interface FocusPanelActionResult {
  /** Updated focus stack state */
  readonly newState: FocusStackState;

  /** Whether the action was successful */
  readonly success: boolean;

  /** User-facing message */
  readonly message?: string;

  /** Whether to trigger a UI refresh */
  readonly requiresRefresh: boolean;
}

// =============================================================================
// FOCUS STACK BUILDING — constructing focus state from project world
// =============================================================================

/**
 * Build a focus stack from the current project state.
 */
export interface FocusStackBuilder {
  /** Set the current board */
  setBoard(boardId: string, boardName: string): FocusStackBuilder;

  /** Set the current deck */
  setDeck(deckId: string, deckName: string): FocusStackBuilder;

  /** Set the current track/layer */
  setTrack(trackId: string, trackName: string): FocusStackBuilder;

  /** Set the current section */
  setSection(sectionId: string, sectionName: string, startBar: number, endBar: number): FocusStackBuilder;

  /** Set the current card */
  setCard(cardId: string, cardName: string): FocusStackBuilder;

  /** Set the current event selection */
  setEventSelection(eventCount: number): FocusStackBuilder;

  /** Set the current time range */
  setTimeRange(startBar: number, endBar: number): FocusStackBuilder;

  /** Build the focus stack */
  build(): FocusStackState;
}

/**
 * Create a new focus stack builder.
 */
export function createFocusStackBuilder(): FocusStackBuilder {
  const levels: FocusLevel[] = [];
  let activeDepth = 0;
  const now = Date.now();

  const builder: FocusStackBuilder = {
    setBoard(boardId, boardName) {
      levels.push({
        depth: 0,
        entityType: 'board',
        displayName: boardName,
        entityId: boardId,
        shortLabel: boardName.length > 10 ? boardName.slice(0, 8) + '..' : boardName,
        icon: 'board',
        childCount: 0,
        isActive: false,
        isExplicit: true,
        metadata: { lastActivated: now, focusCount: 1 },
      });
      activeDepth = 0;
      return builder;
    },

    setDeck(deckId, deckName) {
      levels.push({
        depth: 1,
        entityType: 'deck',
        displayName: deckName,
        entityId: deckId,
        shortLabel: deckName.length > 10 ? deckName.slice(0, 8) + '..' : deckName,
        icon: 'deck',
        childCount: 0,
        isActive: false,
        isExplicit: true,
        metadata: { lastActivated: now, focusCount: 1 },
      });
      activeDepth = 1;
      return builder;
    },

    setTrack(trackId, trackName) {
      levels.push({
        depth: 2,
        entityType: 'track',
        displayName: trackName,
        entityId: trackId,
        shortLabel: trackName.length > 8 ? trackName.slice(0, 6) + '..' : trackName,
        icon: 'track',
        childCount: 0,
        isActive: false,
        isExplicit: true,
        metadata: { lastActivated: now, focusCount: 1 },
      });
      activeDepth = 2;
      return builder;
    },

    setSection(sectionId, sectionName, startBar, endBar) {
      levels.push({
        depth: 3,
        entityType: 'section',
        displayName: sectionName,
        entityId: sectionId,
        shortLabel: sectionName.length > 8 ? sectionName.slice(0, 6) + '..' : sectionName,
        icon: 'section',
        childCount: 0,
        isActive: false,
        isExplicit: true,
        metadata: {
          lastActivated: now,
          focusCount: 1,
          timeRange: { startBar, endBar },
        },
      });
      activeDepth = 3;
      return builder;
    },

    setCard(cardId, cardName) {
      levels.push({
        depth: 4,
        entityType: 'card',
        displayName: cardName,
        entityId: cardId,
        shortLabel: cardName.length > 8 ? cardName.slice(0, 6) + '..' : cardName,
        icon: 'card',
        childCount: 0,
        isActive: false,
        isExplicit: true,
        metadata: { lastActivated: now, focusCount: 1 },
      });
      activeDepth = 4;
      return builder;
    },

    setEventSelection(eventCount) {
      levels.push({
        depth: 5,
        entityType: 'event_selection',
        displayName: `${eventCount} events selected`,
        entityId: 'selection',
        shortLabel: `${eventCount} sel`,
        icon: 'selection',
        childCount: eventCount,
        isActive: false,
        isExplicit: true,
        metadata: {
          lastActivated: now,
          focusCount: 1,
          eventCount,
        },
      });
      activeDepth = 5;
      return builder;
    },

    setTimeRange(startBar, endBar) {
      levels.push({
        depth: 5,
        entityType: 'time_range',
        displayName: `Bars ${startBar}–${endBar}`,
        entityId: `range:${startBar}:${endBar}`,
        shortLabel: `${startBar}–${endBar}`,
        icon: 'time_range',
        childCount: 0,
        isActive: false,
        isExplicit: true,
        metadata: {
          lastActivated: now,
          focusCount: 1,
          timeRange: { startBar, endBar },
        },
      });
      activeDepth = 5;
      return builder;
    },

    build() {
      // Mark the deepest level as active
      const builtLevels = levels.map((level, _i) => ({
        ...level,
        isActive: level.depth === activeDepth,
      }));

      const effectiveLabel = builtLevels.length > 0
        ? builtLevels.map(l => l.shortLabel).join(' → ')
        : 'Global';

      return {
        levels: builtLevels,
        activeDepth,
        isExplicit: builtLevels.some(l => l.isExplicit),
        focusSource: 'user_click',
        lastChanged: now,
        effectiveScopeLabel: effectiveLabel,
        history: [],
      };
    },
  };

  return builder;
}

// =============================================================================
// FOCUS STACK DISPLAY TEMPLATES
// =============================================================================

/**
 * A display template for rendering a focus level.
 */
export interface FocusLevelTemplate {
  /** Entity type this template applies to */
  readonly entityType: FocusEntityType;

  /** Label format string (with {name}, {id}, {count} placeholders) */
  readonly labelFormat: string;

  /** Short label format */
  readonly shortLabelFormat: string;

  /** Badge format */
  readonly badgeFormat: string;

  /** Color for this entity type (CSS color) */
  readonly color: string;

  /** Description of this level type */
  readonly levelDescription: string;
}

/**
 * Display templates for each entity type.
 */
export const FOCUS_LEVEL_TEMPLATES: readonly FocusLevelTemplate[] = [
  {
    entityType: 'board',
    labelFormat: '{name}',
    shortLabelFormat: '{name}',
    badgeFormat: '{count} decks',
    color: '#6366f1', // Indigo
    levelDescription: 'The current board / workspace',
  },
  {
    entityType: 'deck',
    labelFormat: '{name}',
    shortLabelFormat: '{name}',
    badgeFormat: '{count} cards',
    color: '#8b5cf6', // Purple
    levelDescription: 'The current deck in the focused board',
  },
  {
    entityType: 'track',
    labelFormat: '{name}',
    shortLabelFormat: '{name}',
    badgeFormat: '{count} events',
    color: '#0ea5e9', // Sky blue
    levelDescription: 'The current track/layer',
  },
  {
    entityType: 'section',
    labelFormat: '{name} (bars {startBar}–{endBar})',
    shortLabelFormat: '{name}',
    badgeFormat: '{count} bars',
    color: '#10b981', // Emerald
    levelDescription: 'The current section of the song',
  },
  {
    entityType: 'card',
    labelFormat: '{name}',
    shortLabelFormat: '{name}',
    badgeFormat: '{count} params',
    color: '#f59e0b', // Amber
    levelDescription: 'The current card being edited',
  },
  {
    entityType: 'parameter',
    labelFormat: '{name}',
    shortLabelFormat: '{name}',
    badgeFormat: '',
    color: '#ef4444', // Red
    levelDescription: 'A specific parameter',
  },
  {
    entityType: 'event_selection',
    labelFormat: '{count} events selected',
    shortLabelFormat: '{count} sel',
    badgeFormat: '',
    color: '#f97316', // Orange
    levelDescription: 'The current note/event selection',
  },
  {
    entityType: 'time_range',
    labelFormat: 'Bars {startBar}–{endBar}',
    shortLabelFormat: '{startBar}–{endBar}',
    badgeFormat: '',
    color: '#14b8a6', // Teal
    levelDescription: 'A selected time range',
  },
];

const _templateByType = new Map<FocusEntityType, FocusLevelTemplate>(
  FOCUS_LEVEL_TEMPLATES.map(t => [t.entityType, t])
);

/**
 * Get the display template for an entity type.
 */
export function getFocusLevelTemplate(entityType: FocusEntityType): FocusLevelTemplate | undefined {
  return _templateByType.get(entityType);
}

// =============================================================================
// FORMATTING UTILITIES
// =============================================================================

/**
 * Format a focus stack as a single-line string.
 */
export function formatFocusStackInline(stack: FocusStackState): string {
  if (stack.levels.length === 0) return 'No focus (global)';
  return stack.levels.map(l => l.shortLabel).join(' → ');
}

/**
 * Format a focus stack as a multi-line display.
 */
export function formatFocusStackMultiline(stack: FocusStackState): string {
  if (stack.levels.length === 0) return 'No focus (global scope)';

  return stack.levels.map(level => {
    const indent = '  '.repeat(level.depth);
    const marker = level.isActive ? '▶' : '○';
    const badge = level.metadata.eventCount !== undefined
      ? ` [${level.metadata.eventCount} events]`
      : '';
    const explicit = level.isExplicit ? '' : ' (inferred)';
    return `${indent}${marker} ${level.displayName}${badge}${explicit}`;
  }).join('\n');
}

/**
 * Format a scope preview as a user-facing string.
 */
export function formatScopePreview(preview: ScopePreview): string {
  const scope = preview.impliedScope;
  const parts: string[] = [];

  if (scope.sections.length > 0) {
    parts.push(`Sections: ${scope.sections.join(', ')}`);
  }
  if (scope.layers.length > 0) {
    parts.push(`Layers: ${scope.layers.join(', ')}`);
  }
  if (scope.timeRange) {
    parts.push(`Bars ${scope.timeRange.startBar}–${scope.timeRange.endBar}`);
  }
  parts.push(`${preview.totalEvents} events affected`);

  if (preview.isOverridden) {
    parts.push('(scope overridden by command)');
  }

  return parts.join(' · ');
}

/**
 * Format a focus history entry.
 */
export function formatFocusHistoryEntry(entry: FocusHistoryEntry): string {
  const timeAgo = Math.floor((Date.now() - entry.timestamp) / 1000);
  const timeStr = timeAgo < 60
    ? `${timeAgo}s ago`
    : `${Math.floor(timeAgo / 60)}m ago`;
  return `[Turn ${entry.turnNumber}] ${entry.level.displayName} (${entry.source}) ${timeStr}`;
}

// =============================================================================
// SCOPE INFERENCE — how focus stack determines implied scope
// =============================================================================

/**
 * Rules for how the focus stack determines the implied scope
 * for a command that doesn't explicitly specify one.
 */
export interface ScopeInferenceRule {
  /** Rule ID */
  readonly id: string;
  /** When this rule applies */
  readonly condition: ScopeInferenceCondition;
  /** What scope it produces */
  readonly result: ScopeInferenceResult;
  /** Priority (higher = checked first) */
  readonly priority: number;
  /** Description */
  readonly description: string;
  /** Example */
  readonly example: string;
}

export type ScopeInferenceCondition =
  | { readonly kind: 'has_selection' }
  | { readonly kind: 'has_section_focus' }
  | { readonly kind: 'has_track_focus' }
  | { readonly kind: 'has_deck_focus' }
  | { readonly kind: 'has_board_focus' }
  | { readonly kind: 'has_time_range' }
  | { readonly kind: 'no_focus' }
  | { readonly kind: 'command_type'; readonly commandType: string };

export type ScopeInferenceResult =
  | { readonly kind: 'use_selection' }
  | { readonly kind: 'use_section' }
  | { readonly kind: 'use_track' }
  | { readonly kind: 'use_time_range' }
  | { readonly kind: 'use_deck_scope' }
  | { readonly kind: 'use_global' }
  | { readonly kind: 'ask_user' };

/**
 * Canonical scope inference rules.
 */
export const SCOPE_INFERENCE_RULES: readonly ScopeInferenceRule[] = [
  {
    id: 'selection-first',
    condition: { kind: 'has_selection' },
    result: { kind: 'use_selection' },
    priority: 100,
    description: 'If there is an active event selection, use it as the scope.',
    example: 'User selects 4 notes, then says "make these louder" → affects 4 selected notes.',
  },
  {
    id: 'time-range-priority',
    condition: { kind: 'has_time_range' },
    result: { kind: 'use_time_range' },
    priority: 90,
    description: 'If there is an active time range selection, use it as the scope.',
    example: 'User highlights bars 17–24, then says "make it brighter" → affects bars 17–24.',
  },
  {
    id: 'section-focus',
    condition: { kind: 'has_section_focus' },
    result: { kind: 'use_section' },
    priority: 70,
    description: 'If a section is focused, use it as the scope.',
    example: 'User clicks on Chorus 2, then says "add reverb" → reverb added in Chorus 2.',
  },
  {
    id: 'track-focus',
    condition: { kind: 'has_track_focus' },
    result: { kind: 'use_track' },
    priority: 60,
    description: 'If a track is focused (but no section), use the track as scope.',
    example: 'User clicks on the Bass track, then says "tighten it" → tightens the bass across all sections.',
  },
  {
    id: 'deck-focus',
    condition: { kind: 'has_deck_focus' },
    result: { kind: 'use_deck_scope' },
    priority: 40,
    description: 'If only a deck is focused, use the deck\'s default scope.',
    example: 'User is on the Mixer deck, then says "wider" → applies to the mixer\'s scope.',
  },
  {
    id: 'no-focus-ask',
    condition: { kind: 'no_focus' },
    result: { kind: 'ask_user' },
    priority: 10,
    description: 'If no focus exists, ask the user to specify a scope.',
    example: 'User opens a fresh project and says "make it brighter" → system asks "Where?".',
  },
  {
    id: 'structural-commands-global',
    condition: { kind: 'command_type', commandType: 'structure' },
    result: { kind: 'use_global' },
    priority: 110,
    description: 'Structural commands (add section, change form) always apply globally.',
    example: '"Add a bridge" → applies to the whole song structure.',
  },
];

/**
 * Resolve the implied scope using the inference rules.
 */
export function resolveImpliedScope(
  stack: FocusStackState,
  commandType?: string
): ScopeInferenceResult {
  // Sort rules by priority (highest first)
  const sorted = [...SCOPE_INFERENCE_RULES].sort((a, b) => b.priority - a.priority);

  for (const rule of sorted) {
    if (conditionMet(stack, rule.condition, commandType)) {
      return rule.result;
    }
  }

  // Fallback: ask user
  return { kind: 'ask_user' };
}

/**
 * Check if a scope inference condition is met.
 */
function conditionMet(
  stack: FocusStackState,
  condition: ScopeInferenceCondition,
  commandType?: string
): boolean {
  switch (condition.kind) {
    case 'has_selection':
      return stack.levels.some(l => l.entityType === 'event_selection');
    case 'has_section_focus':
      return stack.levels.some(l => l.entityType === 'section');
    case 'has_track_focus':
      return stack.levels.some(l => l.entityType === 'track');
    case 'has_deck_focus':
      return stack.levels.some(l => l.entityType === 'deck');
    case 'has_board_focus':
      return stack.levels.some(l => l.entityType === 'board');
    case 'has_time_range':
      return stack.levels.some(l => l.entityType === 'time_range');
    case 'no_focus':
      return stack.levels.length === 0;
    case 'command_type':
      return commandType === condition.commandType;
  }
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const FOCUS_STACK_UI_RULES = [
  // Rule 1: Always visible
  'Rule FS-001: The focus stack panel MUST be visible at all times. ' +
  'It can be collapsed but never hidden. The user should always know ' +
  'what scope their next command will affect.',

  // Rule 2: Breadcrumb navigation
  'Rule FS-002: The focus stack is displayed as a breadcrumb path: ' +
  'Board → Deck → Track → Section → Selection. Each level is clickable ' +
  'to navigate to and focus that entity.',

  // Rule 3: Active level highlighting
  'Rule FS-003: The deepest (most specific) level is highlighted as the ' +
  '"active" level. This is what "it", "this", and unscoped commands ' +
  'refer to by default.',

  // Rule 4: Scope preview on input
  'Rule FS-004: When the user starts typing a command, the panel shows a ' +
  'preview of what scope will be affected. If the command overrides the ' +
  'focus scope, this is shown with a different highlight.',

  // Rule 5: Focus source attribution
  'Rule FS-005: Each focus level shows how it was determined: user click, ' +
  'user selection, command scope, salience, or default. Inferred focuses ' +
  'are visually distinct from explicit focuses.',

  // Rule 6: History and "go back"
  'Rule FS-006: The panel maintains a bounded history of recent focus ' +
  'changes. The user can click a history entry to restore a previous ' +
  'focus state.',

  // Rule 7: Scope inference rules are explicit
  'Rule FS-007: The rules for inferring scope from focus stack are explicit ' +
  'and ordered by priority. Selection > time range > section > track > ' +
  'deck > ask user.',

  // Rule 8: Structural commands use global scope
  'Rule FS-008: Structural commands (add/remove sections, change form) ' +
  'always use global scope, regardless of current focus. This prevents ' +
  'accidental scoping of structure changes.',

  // Rule 9: Badge counts update in real-time
  'Rule FS-009: Event counts and entity counts in the focus panel update ' +
  'in real-time as the user makes changes. This provides immediate ' +
  'feedback on the scope of edits.',

  // Rule 10: Pinnable focus
  'Rule FS-010: The user can "pin" the current focus to prevent it from ' +
  'changing when they navigate. This is useful for repeated edits to ' +
  'the same scope.',
] as const;
