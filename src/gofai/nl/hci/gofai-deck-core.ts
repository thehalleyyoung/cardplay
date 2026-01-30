/**
 * GOFAI Deck Core — HCI Components for the GOFAI NL Pipeline
 *
 * Implements Steps 351–360 of the GOFAI roadmap:
 *   351: GOFAI Deck UI (three-pane layout)
 *   352: Inline Scope Visualization
 *   353: Inline Entity Chips
 *   354: Apply Gating UI
 *   355: Quick Actions Bar
 *   356: Clarification Modal
 *   357: Ask Fewer Questions Toggle
 *   358: Strict Mode Toggle
 *   359: Keyboard-first Workflows
 *   360: Accessibility Semantics
 *
 * @module gofai/nl/hci/gofai-deck-core
 */

// =============================================================================
// STEP 351 — GOFAI DECK UI
// Three panes: English input, CPL viewer, Plan/Diff preview
// =============================================================================

// ---------------------------------------------------------------------------
// 351 Types
// ---------------------------------------------------------------------------

/** The three pane types supported in a GOFAI deck */
export type PaneType = 'input' | 'cpl-viewer' | 'plan-diff';

/** Unique identifier for a deck instance */
export type DeckId = string;

/** Unique identifier for a pane instance */
export type PaneId = string;

/** Named layout presets */
export type LayoutPresetName =
  | 'standard'
  | 'compact'
  | 'input-only'
  | 'cpl-only'
  | 'diff-only'
  | 'split-horizontal'
  | 'split-vertical'
  | 'floating'
  | 'overlay'
  | 'full-width'
  | 'focus-input'
  | 'focus-cpl';

/** Direction for split layouts */
export type SplitDirection = 'horizontal' | 'vertical';

/** Collapse state of a pane */
export type CollapseState = 'expanded' | 'collapsed' | 'minimized';

/** Theme variant */
export type ThemeVariant = 'light' | 'dark' | 'high-contrast' | 'auto';

/** Font sizing preset */
export type FontSizePreset = 'small' | 'medium' | 'large' | 'x-large';

/** Individual pane theme overrides */
export interface PaneThemeOverride {
  readonly bgColor: string;
  readonly fgColor: string;
  readonly borderColor: string;
  readonly fontFamily: string;
  readonly fontSize: number;
}

/** Global deck theme */
export interface DeckTheme {
  readonly variant: ThemeVariant;
  readonly fontSizePreset: FontSizePreset;
  readonly borderRadius: number;
  readonly gapPx: number;
  readonly paneBorderWidth: number;
  readonly headerHeightPx: number;
  readonly scrollbarWidth: number;
  readonly accentColor: string;
  readonly surfaceColor: string;
  readonly textColor: string;
  readonly mutedColor: string;
  readonly errorColor: string;
  readonly warningColor: string;
  readonly successColor: string;
}

/** State of an individual pane */
export interface PaneState {
  readonly paneId: PaneId;
  readonly paneType: PaneType;
  readonly collapseState: CollapseState;
  readonly widthPercent: number;
  readonly heightPercent: number;
  readonly minWidthPx: number;
  readonly minHeightPx: number;
  readonly isResizing: boolean;
  readonly isFocused: boolean;
  readonly scrollTop: number;
  readonly scrollLeft: number;
  readonly contentVersion: number;
  readonly lastUpdatedMs: number;
}

/** A single pane descriptor */
export interface DeckPane {
  readonly id: PaneId;
  readonly type: PaneType;
  readonly label: string;
  readonly order: number;
  readonly visible: boolean;
  readonly initialWidthPercent: number;
  readonly initialHeightPercent: number;
  readonly minWidthPx: number;
  readonly minHeightPx: number;
  readonly collapsible: boolean;
  readonly resizable: boolean;
  readonly closable: boolean;
}

/** Layout specification */
export interface DeckLayout {
  readonly presetName: LayoutPresetName;
  readonly splitDirection: SplitDirection;
  readonly panes: readonly DeckPane[];
  readonly gapPx: number;
  readonly paddingPx: number;
  readonly allowReorder: boolean;
  readonly allowFloat: boolean;
  readonly snapToGrid: boolean;
  readonly gridColumns: number;
  readonly gridRows: number;
}

/** Configuration for the deck */
export interface DeckConfig {
  readonly deckId: DeckId;
  readonly layout: DeckLayout;
  readonly theme: DeckTheme;
  readonly autoSaveIntervalMs: number;
  readonly showPaneHeaders: boolean;
  readonly showStatusBar: boolean;
  readonly animateTransitions: boolean;
  readonly transitionDurationMs: number;
  readonly enableDragResize: boolean;
  readonly enableKeyboardNav: boolean;
  readonly maxUndoHistory: number;
}

/** Top-level GOFAI deck specification */
export interface GOFAIDeckSpec {
  readonly config: DeckConfig;
  readonly paneStates: readonly PaneState[];
  readonly activePane: PaneId;
  readonly isDirty: boolean;
  readonly lastSavedMs: number;
  readonly version: number;
  readonly sessionId: string;
}

/** Resize event between two adjacent panes */
export interface PaneResizeEvent {
  readonly leftPaneId: PaneId;
  readonly rightPaneId: PaneId;
  readonly deltaXPercent: number;
  readonly deltaYPercent: number;
  readonly timestamp: number;
}

/** Deck snapshot for undo/redo */
export interface DeckSnapshot {
  readonly snapshotId: string;
  readonly timestamp: number;
  readonly paneStates: readonly PaneState[];
  readonly activePane: PaneId;
  readonly description: string;
}

/** Render output for a pane */
export interface PaneRenderResult {
  readonly paneId: PaneId;
  readonly htmlContent: string;
  readonly ariaLabel: string;
  readonly tabIndex: number;
  readonly width: string;
  readonly height: string;
  readonly style: Record<string, string>;
}

/** Render output for the whole deck */
export interface DeckRenderResult {
  readonly deckId: DeckId;
  readonly panes: readonly PaneRenderResult[];
  readonly statusBarHtml: string;
  readonly totalWidthPx: number;
  readonly totalHeightPx: number;
}

// ---------------------------------------------------------------------------
// 351 Constants
// ---------------------------------------------------------------------------

const DEFAULT_THEME: DeckTheme = {
  variant: 'light',
  fontSizePreset: 'medium',
  borderRadius: 6,
  gapPx: 8,
  paneBorderWidth: 1,
  headerHeightPx: 36,
  scrollbarWidth: 10,
  accentColor: '#3b82f6',
  surfaceColor: '#ffffff',
  textColor: '#1e293b',
  mutedColor: '#94a3b8',
  errorColor: '#ef4444',
  warningColor: '#f59e0b',
  successColor: '#22c55e',
};

const DARK_THEME: DeckTheme = {
  variant: 'dark',
  fontSizePreset: 'medium',
  borderRadius: 6,
  gapPx: 8,
  paneBorderWidth: 1,
  headerHeightPx: 36,
  scrollbarWidth: 10,
  accentColor: '#60a5fa',
  surfaceColor: '#1e293b',
  textColor: '#e2e8f0',
  mutedColor: '#64748b',
  errorColor: '#f87171',
  warningColor: '#fbbf24',
  successColor: '#4ade80',
};

const HIGH_CONTRAST_THEME: DeckTheme = {
  variant: 'high-contrast',
  fontSizePreset: 'large',
  borderRadius: 0,
  gapPx: 4,
  paneBorderWidth: 3,
  headerHeightPx: 44,
  scrollbarWidth: 14,
  accentColor: '#ffff00',
  surfaceColor: '#000000',
  textColor: '#ffffff',
  mutedColor: '#cccccc',
  errorColor: '#ff0000',
  warningColor: '#ffff00',
  successColor: '#00ff00',
};

/** Font size mappings for presets */
const FONT_SIZE_MAP: Record<FontSizePreset, number> = {
  small: 12,
  medium: 14,
  large: 16,
  'x-large': 20,
};

// ---------------------------------------------------------------------------
// 351 Functions
// ---------------------------------------------------------------------------

/** Create a default pane state */
export function createPaneState(
  paneId: PaneId,
  paneType: PaneType,
  widthPercent: number,
  heightPercent: number,
): PaneState {
  return {
    paneId,
    paneType,
    collapseState: 'expanded',
    widthPercent,
    heightPercent,
    minWidthPx: 120,
    minHeightPx: 80,
    isResizing: false,
    isFocused: false,
    scrollTop: 0,
    scrollLeft: 0,
    contentVersion: 0,
    lastUpdatedMs: Date.now(),
  };
}

/** Create a deck pane descriptor */
export function createDeckPane(
  id: PaneId,
  type: PaneType,
  label: string,
  order: number,
  widthPercent: number,
): DeckPane {
  return {
    id,
    type,
    label,
    order,
    visible: true,
    initialWidthPercent: widthPercent,
    initialHeightPercent: 100,
    minWidthPx: 120,
    minHeightPx: 80,
    collapsible: true,
    resizable: true,
    closable: false,
  };
}

/** Create the standard 3-pane layout */
export function createStandardLayout(): DeckLayout {
  return {
    presetName: 'standard',
    splitDirection: 'horizontal',
    panes: [
      createDeckPane('input-pane', 'input', 'English Input', 0, 33),
      createDeckPane('cpl-pane', 'cpl-viewer', 'CPL Viewer', 1, 34),
      createDeckPane('diff-pane', 'plan-diff', 'Plan / Diff', 2, 33),
    ],
    gapPx: 8,
    paddingPx: 12,
    allowReorder: true,
    allowFloat: false,
    snapToGrid: false,
    gridColumns: 12,
    gridRows: 1,
  };
}

/** Create a compact 2-pane layout */
export function createCompactLayout(): DeckLayout {
  return {
    presetName: 'compact',
    splitDirection: 'horizontal',
    panes: [
      createDeckPane('input-pane', 'input', 'English Input', 0, 50),
      createDeckPane('cpl-pane', 'cpl-viewer', 'CPL Viewer', 1, 50),
    ],
    gapPx: 4,
    paddingPx: 8,
    allowReorder: true,
    allowFloat: false,
    snapToGrid: false,
    gridColumns: 12,
    gridRows: 1,
  };
}

/** Create a single-pane layout for a given pane type */
export function createSinglePaneLayout(
  paneType: PaneType,
  presetName: LayoutPresetName,
): DeckLayout {
  const labelMap: Record<PaneType, string> = {
    'input': 'English Input',
    'cpl-viewer': 'CPL Viewer',
    'plan-diff': 'Plan / Diff',
  };
  return {
    presetName,
    splitDirection: 'horizontal',
    panes: [
      createDeckPane(`${paneType}-pane`, paneType, labelMap[paneType], 0, 100),
    ],
    gapPx: 0,
    paddingPx: 8,
    allowReorder: false,
    allowFloat: false,
    snapToGrid: false,
    gridColumns: 1,
    gridRows: 1,
  };
}

/** Create a split layout (horizontal or vertical) */
export function createSplitLayout(direction: SplitDirection): DeckLayout {
  const presetName: LayoutPresetName =
    direction === 'horizontal' ? 'split-horizontal' : 'split-vertical';
  const widthPercent = direction === 'horizontal' ? 50 : 100;
  const heightPercent = direction === 'horizontal' ? 100 : 50;
  return {
    presetName,
    splitDirection: direction,
    panes: [
      {
        ...createDeckPane('input-pane', 'input', 'English Input', 0, widthPercent),
        initialHeightPercent: heightPercent,
      },
      {
        ...createDeckPane('cpl-pane', 'cpl-viewer', 'CPL + Diff', 1, widthPercent),
        initialHeightPercent: heightPercent,
      },
    ],
    gapPx: 6,
    paddingPx: 8,
    allowReorder: true,
    allowFloat: false,
    snapToGrid: false,
    gridColumns: direction === 'horizontal' ? 2 : 1,
    gridRows: direction === 'horizontal' ? 1 : 2,
  };
}

/** Create a floating-panes layout */
export function createFloatingLayout(): DeckLayout {
  return {
    presetName: 'floating',
    splitDirection: 'horizontal',
    panes: [
      createDeckPane('input-pane', 'input', 'English Input', 0, 45),
      createDeckPane('cpl-pane', 'cpl-viewer', 'CPL Viewer', 1, 45),
      createDeckPane('diff-pane', 'plan-diff', 'Plan / Diff', 2, 30),
    ],
    gapPx: 0,
    paddingPx: 0,
    allowReorder: true,
    allowFloat: true,
    snapToGrid: true,
    gridColumns: 12,
    gridRows: 8,
  };
}

/** Create an overlay layout */
export function createOverlayLayout(): DeckLayout {
  return {
    presetName: 'overlay',
    splitDirection: 'horizontal',
    panes: [
      createDeckPane('input-pane', 'input', 'English Input', 0, 100),
      createDeckPane('cpl-pane', 'cpl-viewer', 'CPL Viewer', 1, 60),
      createDeckPane('diff-pane', 'plan-diff', 'Plan / Diff', 2, 60),
    ],
    gapPx: 0,
    paddingPx: 0,
    allowReorder: false,
    allowFloat: true,
    snapToGrid: false,
    gridColumns: 1,
    gridRows: 1,
  };
}

/** Resolve a layout preset name to a DeckLayout */
export function resolveLayoutPreset(name: LayoutPresetName): DeckLayout {
  switch (name) {
    case 'standard': return createStandardLayout();
    case 'compact': return createCompactLayout();
    case 'input-only': return createSinglePaneLayout('input', 'input-only');
    case 'cpl-only': return createSinglePaneLayout('cpl-viewer', 'cpl-only');
    case 'diff-only': return createSinglePaneLayout('plan-diff', 'diff-only');
    case 'split-horizontal': return createSplitLayout('horizontal');
    case 'split-vertical': return createSplitLayout('vertical');
    case 'floating': return createFloatingLayout();
    case 'overlay': return createOverlayLayout();
    case 'full-width': return createStandardLayout(); // same shape, full width
    case 'focus-input': return createSinglePaneLayout('input', 'focus-input');
    case 'focus-cpl': return createSinglePaneLayout('cpl-viewer', 'focus-cpl');
  }
}

/** Resolve a theme variant to a DeckTheme */
export function resolveTheme(variant: ThemeVariant): DeckTheme {
  switch (variant) {
    case 'light': return DEFAULT_THEME;
    case 'dark': return DARK_THEME;
    case 'high-contrast': return HIGH_CONTRAST_THEME;
    case 'auto': return DEFAULT_THEME; // would detect OS preference at runtime
  }
}

/** Create a full DeckConfig from minimal inputs */
export function createDeckConfig(
  deckId: DeckId,
  presetName: LayoutPresetName,
  themeVariant: ThemeVariant,
): DeckConfig {
  return {
    deckId,
    layout: resolveLayoutPreset(presetName),
    theme: resolveTheme(themeVariant),
    autoSaveIntervalMs: 5000,
    showPaneHeaders: true,
    showStatusBar: true,
    animateTransitions: true,
    transitionDurationMs: 200,
    enableDragResize: true,
    enableKeyboardNav: true,
    maxUndoHistory: 50,
  };
}

/** Create a full GOFAIDeckSpec from a config */
export function createDeckSpec(config: DeckConfig): GOFAIDeckSpec {
  const paneStates: PaneState[] = config.layout.panes.map((pane) =>
    createPaneState(pane.id, pane.type, pane.initialWidthPercent, pane.initialHeightPercent),
  );
  const firstPane = config.layout.panes[0];
  const activePane: PaneId = firstPane !== undefined ? firstPane.id : 'input-pane';
  return {
    config,
    paneStates,
    activePane,
    isDirty: false,
    lastSavedMs: Date.now(),
    version: 1,
    sessionId: `session-${Date.now()}`,
  };
}

/** Apply a resize event to a deck spec, returning updated spec */
export function applyPaneResize(
  spec: GOFAIDeckSpec,
  event: PaneResizeEvent,
): GOFAIDeckSpec {
  const updatedStates = spec.paneStates.map((ps) => {
    if (ps.paneId === event.leftPaneId) {
      const newWidth = Math.max(5, ps.widthPercent + event.deltaXPercent);
      return { ...ps, widthPercent: newWidth, lastUpdatedMs: event.timestamp };
    }
    if (ps.paneId === event.rightPaneId) {
      const newWidth = Math.max(5, ps.widthPercent - event.deltaXPercent);
      return { ...ps, widthPercent: newWidth, lastUpdatedMs: event.timestamp };
    }
    return ps;
  });
  return { ...spec, paneStates: updatedStates, isDirty: true };
}

/** Toggle collapse state of a pane */
export function togglePaneCollapse(
  spec: GOFAIDeckSpec,
  paneId: PaneId,
): GOFAIDeckSpec {
  const updatedStates = spec.paneStates.map((ps) => {
    if (ps.paneId === paneId) {
      const nextState: CollapseState =
        ps.collapseState === 'expanded' ? 'collapsed' : 'expanded';
      return { ...ps, collapseState: nextState, lastUpdatedMs: Date.now() };
    }
    return ps;
  });
  return { ...spec, paneStates: updatedStates, isDirty: true };
}

/** Set the active (focused) pane */
export function setActivePane(
  spec: GOFAIDeckSpec,
  paneId: PaneId,
): GOFAIDeckSpec {
  const updatedStates = spec.paneStates.map((ps) => ({
    ...ps,
    isFocused: ps.paneId === paneId,
  }));
  return { ...spec, paneStates: updatedStates, activePane: paneId };
}

/** Create a snapshot for undo/redo */
export function createDeckSnapshot(
  spec: GOFAIDeckSpec,
  description: string,
): DeckSnapshot {
  return {
    snapshotId: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    paneStates: [...spec.paneStates],
    activePane: spec.activePane,
    description,
  };
}

/** Restore a deck spec from a snapshot */
export function restoreFromSnapshot(
  spec: GOFAIDeckSpec,
  snapshot: DeckSnapshot,
): GOFAIDeckSpec {
  return {
    ...spec,
    paneStates: snapshot.paneStates,
    activePane: snapshot.activePane,
    isDirty: true,
  };
}

/** Render a single pane to a PaneRenderResult */
export function renderPane(
  paneState: PaneState,
  theme: DeckTheme,
): PaneRenderResult {
  const fontSize = FONT_SIZE_MAP[theme.fontSizePreset];
  const labelMap: Record<PaneType, string> = {
    'input': 'English Input Pane',
    'cpl-viewer': 'CPL Viewer Pane',
    'plan-diff': 'Plan and Diff Preview Pane',
  };
  const width =
    paneState.collapseState === 'collapsed'
      ? '40px'
      : `${paneState.widthPercent}%`;
  const height =
    paneState.collapseState === 'minimized'
      ? `${theme.headerHeightPx}px`
      : `${paneState.heightPercent}%`;
  return {
    paneId: paneState.paneId,
    htmlContent: `<div class="gofai-pane gofai-pane--${paneState.paneType}"></div>`,
    ariaLabel: labelMap[paneState.paneType],
    tabIndex: paneState.isFocused ? 0 : -1,
    width,
    height,
    style: {
      'font-size': `${fontSize}px`,
      'border-radius': `${theme.borderRadius}px`,
      'border': `${theme.paneBorderWidth}px solid ${theme.mutedColor}`,
      'background': theme.surfaceColor,
      'color': theme.textColor,
    },
  };
}

/** Render the full deck to a DeckRenderResult */
export function renderDeck(spec: GOFAIDeckSpec): DeckRenderResult {
  const theme = spec.config.theme;
  const panes = spec.paneStates.map((ps) => renderPane(ps, theme));
  const dirtyIndicator = spec.isDirty ? ' (unsaved)' : '';
  return {
    deckId: spec.config.deckId,
    panes,
    statusBarHtml: `<div class="gofai-status">GOFAI Deck v${spec.version}${dirtyIndicator}</div>`,
    totalWidthPx: 1200,
    totalHeightPx: 800,
  };
}

/** Switch layout preset on an existing deck spec */
export function switchLayout(
  spec: GOFAIDeckSpec,
  presetName: LayoutPresetName,
): GOFAIDeckSpec {
  const newLayout = resolveLayoutPreset(presetName);
  const newConfig: DeckConfig = { ...spec.config, layout: newLayout };
  const newPaneStates: PaneState[] = newLayout.panes.map((pane) => {
    const existing = spec.paneStates.find((ps) => ps.paneType === pane.type);
    if (existing !== undefined) {
      return {
        ...existing,
        paneId: pane.id,
        widthPercent: pane.initialWidthPercent,
        heightPercent: pane.initialHeightPercent,
        lastUpdatedMs: Date.now(),
      };
    }
    return createPaneState(
      pane.id,
      pane.type,
      pane.initialWidthPercent,
      pane.initialHeightPercent,
    );
  });
  const firstNewPane = newLayout.panes[0];
  const activePane: PaneId = firstNewPane !== undefined ? firstNewPane.id : spec.activePane;
  return {
    ...spec,
    config: newConfig,
    paneStates: newPaneStates,
    activePane,
    isDirty: true,
  };
}

/** Validate that pane widths sum to approximately 100% */
export function validatePaneWidths(spec: GOFAIDeckSpec): {
  readonly valid: boolean;
  readonly totalPercent: number;
  readonly message: string;
} {
  const total = spec.paneStates.reduce((sum, ps) => sum + ps.widthPercent, 0);
  const valid = Math.abs(total - 100) < 2;
  return {
    valid,
    totalPercent: total,
    message: valid
      ? 'Pane widths are valid.'
      : `Pane widths sum to ${total.toFixed(1)}%, expected ~100%.`,
  };
}

/** Get all layout preset names */
export function getAllLayoutPresetNames(): readonly LayoutPresetName[] {
  return [
    'standard', 'compact', 'input-only', 'cpl-only', 'diff-only',
    'split-horizontal', 'split-vertical', 'floating', 'overlay',
    'full-width', 'focus-input', 'focus-cpl',
  ] as const;
}

// =============================================================================
// STEP 352 — INLINE SCOPE VISUALIZATION
// Hovering "chorus" highlights the bound section in timeline and editors
// =============================================================================

// ---------------------------------------------------------------------------
// 352 Types
// ---------------------------------------------------------------------------

/** Scope entity kind */
export type ScopeKind =
  | 'section'
  | 'track'
  | 'measure'
  | 'beat'
  | 'note'
  | 'chord'
  | 'phrase'
  | 'region'
  | 'clip'
  | 'bus'
  | 'send'
  | 'automation-lane'
  | 'marker'
  | 'loop'
  | 'parameter';

/** Named highlight style presets */
export type HighlightStyleName =
  | 'section-highlight'
  | 'track-highlight'
  | 'measure-highlight'
  | 'beat-highlight'
  | 'note-highlight'
  | 'chord-highlight'
  | 'phrase-highlight'
  | 'region-highlight'
  | 'clip-highlight'
  | 'bus-highlight'
  | 'send-highlight'
  | 'automation-highlight'
  | 'marker-highlight'
  | 'loop-highlight'
  | 'parameter-highlight'
  | 'error-highlight'
  | 'warning-highlight'
  | 'selection-highlight'
  | 'hover-highlight'
  | 'focus-highlight';

/** Visual styling for a highlight region */
export interface HighlightStyle {
  readonly name: HighlightStyleName;
  readonly bgColor: string;
  readonly borderColor: string;
  readonly borderWidth: number;
  readonly borderStyle: 'solid' | 'dashed' | 'dotted' | 'double';
  readonly opacity: number;
  readonly blendMode: string;
  readonly cornerRadius: number;
  readonly animationMs: number;
  readonly pulseOnHover: boolean;
  readonly glowPx: number;
  readonly glowColor: string;
}

/** A region in the timeline or editor that gets highlighted */
export interface HighlightRegion {
  readonly regionId: string;
  readonly scopeKind: ScopeKind;
  readonly startOffsetPx: number;
  readonly endOffsetPx: number;
  readonly topOffsetPx: number;
  readonly heightPx: number;
  readonly layerIndex: number;
  readonly label: string;
  readonly style: HighlightStyle;
}

/** Describes a scope that can be visualized */
export interface ScopeHighlight {
  readonly scopeId: string;
  readonly scopeKind: ScopeKind;
  readonly entityName: string;
  readonly displayLabel: string;
  readonly regions: readonly HighlightRegion[];
  readonly isActive: boolean;
  readonly isPrimary: boolean;
  readonly sourceSpanStart: number;
  readonly sourceSpanEnd: number;
  readonly nestingDepth: number;
  readonly parentScopeId: string | null;
  readonly childScopeIds: readonly string[];
}

/** Configuration for scope visualization */
export interface ScopeVizConfig {
  readonly enabled: boolean;
  readonly showOnHover: boolean;
  readonly showOnClick: boolean;
  readonly showNested: boolean;
  readonly maxNestingDepth: number;
  readonly showLabels: boolean;
  readonly labelPosition: 'top' | 'bottom' | 'inline' | 'tooltip';
  readonly showConnectors: boolean;
  readonly connectorStyle: 'line' | 'arrow' | 'bracket';
  readonly fadeInMs: number;
  readonly fadeOutMs: number;
  readonly highlightEditorText: boolean;
  readonly highlightTimeline: boolean;
  readonly highlightMixer: boolean;
  readonly dimNonHighlighted: boolean;
  readonly dimOpacity: number;
}

/** Hover state tracking for scope visualization */
export interface ScopeHoverState {
  readonly hoveredScopeId: string | null;
  readonly hoveredRegionId: string | null;
  readonly mouseX: number;
  readonly mouseY: number;
  readonly hoverStartMs: number;
  readonly isTooltipVisible: boolean;
  readonly tooltipContent: string;
  readonly lockedScopeIds: readonly string[];
}

/** Connection line between input text and timeline region */
export interface ScopeConnector {
  readonly connectorId: string;
  readonly sourceScopeId: string;
  readonly sourceX: number;
  readonly sourceY: number;
  readonly targetX: number;
  readonly targetY: number;
  readonly style: 'line' | 'arrow' | 'bracket';
  readonly color: string;
  readonly width: number;
  readonly opacity: number;
}

// ---------------------------------------------------------------------------
// 352 Constants
// ---------------------------------------------------------------------------

/** Predefined highlight styles for each scope kind */
const SCOPE_HIGHLIGHT_STYLES: Record<ScopeKind, HighlightStyle> = {
  section: {
    name: 'section-highlight',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3b82f6',
    borderWidth: 2,
    borderStyle: 'solid',
    opacity: 1.0,
    blendMode: 'normal',
    cornerRadius: 4,
    animationMs: 200,
    pulseOnHover: true,
    glowPx: 4,
    glowColor: 'rgba(59, 130, 246, 0.3)',
  },
  track: {
    name: 'track-highlight',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
    borderWidth: 2,
    borderStyle: 'solid',
    opacity: 1.0,
    blendMode: 'normal',
    cornerRadius: 4,
    animationMs: 200,
    pulseOnHover: true,
    glowPx: 4,
    glowColor: 'rgba(16, 185, 129, 0.3)',
  },
  measure: {
    name: 'measure-highlight',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderStyle: 'dashed',
    opacity: 1.0,
    blendMode: 'normal',
    cornerRadius: 2,
    animationMs: 150,
    pulseOnHover: false,
    glowPx: 2,
    glowColor: 'rgba(245, 158, 11, 0.2)',
  },
  beat: {
    name: 'beat-highlight',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderStyle: 'dotted',
    opacity: 0.8,
    blendMode: 'normal',
    cornerRadius: 2,
    animationMs: 100,
    pulseOnHover: false,
    glowPx: 1,
    glowColor: 'rgba(239, 68, 68, 0.15)',
  },
  note: {
    name: 'note-highlight',
    bgColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: '#a855f7',
    borderWidth: 1,
    borderStyle: 'solid',
    opacity: 1.0,
    blendMode: 'normal',
    cornerRadius: 3,
    animationMs: 150,
    pulseOnHover: true,
    glowPx: 3,
    glowColor: 'rgba(168, 85, 247, 0.25)',
  },
  chord: {
    name: 'chord-highlight',
    bgColor: 'rgba(236, 72, 153, 0.12)',
    borderColor: '#ec4899',
    borderWidth: 1,
    borderStyle: 'solid',
    opacity: 0.9,
    blendMode: 'normal',
    cornerRadius: 3,
    animationMs: 150,
    pulseOnHover: false,
    glowPx: 2,
    glowColor: 'rgba(236, 72, 153, 0.2)',
  },
  phrase: {
    name: 'phrase-highlight',
    bgColor: 'rgba(14, 165, 233, 0.12)',
    borderColor: '#0ea5e9',
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 1.0,
    blendMode: 'normal',
    cornerRadius: 6,
    animationMs: 200,
    pulseOnHover: true,
    glowPx: 5,
    glowColor: 'rgba(14, 165, 233, 0.2)',
  },
  region: {
    name: 'region-highlight',
    bgColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: '#22c55e',
    borderWidth: 2,
    borderStyle: 'solid',
    opacity: 1.0,
    blendMode: 'normal',
    cornerRadius: 4,
    animationMs: 200,
    pulseOnHover: true,
    glowPx: 4,
    glowColor: 'rgba(34, 197, 94, 0.25)',
  },
  clip: {
    name: 'clip-highlight',
    bgColor: 'rgba(251, 146, 60, 0.12)',
    borderColor: '#fb923c',
    borderWidth: 1,
    borderStyle: 'solid',
    opacity: 0.9,
    blendMode: 'normal',
    cornerRadius: 3,
    animationMs: 150,
    pulseOnHover: false,
    glowPx: 2,
    glowColor: 'rgba(251, 146, 60, 0.2)',
  },
  bus: {
    name: 'bus-highlight',
    bgColor: 'rgba(99, 102, 241, 0.12)',
    borderColor: '#6366f1',
    borderWidth: 2,
    borderStyle: 'solid',
    opacity: 1.0,
    blendMode: 'normal',
    cornerRadius: 4,
    animationMs: 200,
    pulseOnHover: true,
    glowPx: 4,
    glowColor: 'rgba(99, 102, 241, 0.25)',
  },
  send: {
    name: 'send-highlight',
    bgColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: '#f43f5e',
    borderWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.8,
    blendMode: 'normal',
    cornerRadius: 3,
    animationMs: 150,
    pulseOnHover: false,
    glowPx: 2,
    glowColor: 'rgba(244, 63, 94, 0.15)',
  },
  'automation-lane': {
    name: 'automation-highlight',
    bgColor: 'rgba(20, 184, 166, 0.1)',
    borderColor: '#14b8a6',
    borderWidth: 1,
    borderStyle: 'dotted',
    opacity: 0.85,
    blendMode: 'normal',
    cornerRadius: 2,
    animationMs: 150,
    pulseOnHover: false,
    glowPx: 2,
    glowColor: 'rgba(20, 184, 166, 0.15)',
  },
  marker: {
    name: 'marker-highlight',
    bgColor: 'rgba(217, 70, 239, 0.12)',
    borderColor: '#d946ef',
    borderWidth: 2,
    borderStyle: 'solid',
    opacity: 1.0,
    blendMode: 'normal',
    cornerRadius: 8,
    animationMs: 200,
    pulseOnHover: true,
    glowPx: 6,
    glowColor: 'rgba(217, 70, 239, 0.3)',
  },
  loop: {
    name: 'loop-highlight',
    bgColor: 'rgba(132, 204, 22, 0.12)',
    borderColor: '#84cc16',
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 1.0,
    blendMode: 'normal',
    cornerRadius: 4,
    animationMs: 250,
    pulseOnHover: true,
    glowPx: 5,
    glowColor: 'rgba(132, 204, 22, 0.25)',
  },
  parameter: {
    name: 'parameter-highlight',
    bgColor: 'rgba(156, 163, 175, 0.1)',
    borderColor: '#9ca3af',
    borderWidth: 1,
    borderStyle: 'solid',
    opacity: 0.7,
    blendMode: 'normal',
    cornerRadius: 2,
    animationMs: 100,
    pulseOnHover: false,
    glowPx: 1,
    glowColor: 'rgba(156, 163, 175, 0.1)',
  },
};

const DEFAULT_SCOPE_VIZ_CONFIG: ScopeVizConfig = {
  enabled: true,
  showOnHover: true,
  showOnClick: true,
  showNested: true,
  maxNestingDepth: 5,
  showLabels: true,
  labelPosition: 'top',
  showConnectors: true,
  connectorStyle: 'arrow',
  fadeInMs: 150,
  fadeOutMs: 200,
  highlightEditorText: true,
  highlightTimeline: true,
  highlightMixer: true,
  dimNonHighlighted: true,
  dimOpacity: 0.3,
};

// ---------------------------------------------------------------------------
// 352 Functions
// ---------------------------------------------------------------------------

/** Get the highlight style for a scope kind */
export function getHighlightStyleForKind(kind: ScopeKind): HighlightStyle {
  return SCOPE_HIGHLIGHT_STYLES[kind];
}

/** Create a highlight region for a scope */
export function createHighlightRegion(
  regionId: string,
  scopeKind: ScopeKind,
  startPx: number,
  endPx: number,
  topPx: number,
  heightPx: number,
  label: string,
  layerIndex: number,
): HighlightRegion {
  return {
    regionId,
    scopeKind,
    startOffsetPx: startPx,
    endOffsetPx: endPx,
    topOffsetPx: topPx,
    heightPx,
    layerIndex,
    label,
    style: SCOPE_HIGHLIGHT_STYLES[scopeKind],
  };
}

/** Create a scope highlight from entity info */
export function createScopeHighlight(
  scopeId: string,
  kind: ScopeKind,
  entityName: string,
  regions: readonly HighlightRegion[],
  sourceStart: number,
  sourceEnd: number,
): ScopeHighlight {
  return {
    scopeId,
    scopeKind: kind,
    entityName,
    displayLabel: `${kind}: ${entityName}`,
    regions,
    isActive: false,
    isPrimary: true,
    sourceSpanStart: sourceStart,
    sourceSpanEnd: sourceEnd,
    nestingDepth: 0,
    parentScopeId: null,
    childScopeIds: [],
  };
}

/** Create a default hover state */
export function createDefaultHoverState(): ScopeHoverState {
  return {
    hoveredScopeId: null,
    hoveredRegionId: null,
    mouseX: 0,
    mouseY: 0,
    hoverStartMs: 0,
    isTooltipVisible: false,
    tooltipContent: '',
    lockedScopeIds: [],
  };
}

/** Get default scope viz config */
export function getDefaultScopeVizConfig(): ScopeVizConfig {
  return DEFAULT_SCOPE_VIZ_CONFIG;
}

/** Update hover state when mouse enters a scope */
export function handleScopeHoverEnter(
  state: ScopeHoverState,
  scopeId: string,
  regionId: string,
  mouseX: number,
  mouseY: number,
  tooltipContent: string,
): ScopeHoverState {
  return {
    ...state,
    hoveredScopeId: scopeId,
    hoveredRegionId: regionId,
    mouseX,
    mouseY,
    hoverStartMs: Date.now(),
    isTooltipVisible: true,
    tooltipContent,
  };
}

/** Update hover state when mouse leaves a scope */
export function handleScopeHoverLeave(
  state: ScopeHoverState,
): ScopeHoverState {
  return {
    ...state,
    hoveredScopeId: null,
    hoveredRegionId: null,
    isTooltipVisible: false,
    tooltipContent: '',
  };
}

/** Toggle lock on a scope (clicking pins it) */
export function toggleScopeLock(
  state: ScopeHoverState,
  scopeId: string,
): ScopeHoverState {
  const isLocked = state.lockedScopeIds.includes(scopeId);
  const lockedScopeIds = isLocked
    ? state.lockedScopeIds.filter((id) => id !== scopeId)
    : [...state.lockedScopeIds, scopeId];
  return { ...state, lockedScopeIds };
}

/** Compute highlight regions for a set of scopes, filtering by config */
export function computeVisibleHighlights(
  scopes: readonly ScopeHighlight[],
  config: ScopeVizConfig,
  hoverState: ScopeHoverState,
): readonly HighlightRegion[] {
  if (!config.enabled) return [];

  const activeScopes = scopes.filter((scope) => {
    if (hoverState.lockedScopeIds.includes(scope.scopeId)) return true;
    if (config.showOnHover && hoverState.hoveredScopeId === scope.scopeId) return true;
    if (scope.isActive) return true;
    return false;
  });

  const depthFiltered = activeScopes.filter(
    (scope) => scope.nestingDepth <= config.maxNestingDepth,
  );

  const allRegions: HighlightRegion[] = [];
  for (const scope of depthFiltered) {
    for (const region of scope.regions) {
      allRegions.push(region);
    }
  }

  return allRegions.sort((a, b) => a.layerIndex - b.layerIndex);
}

/** Compute connector lines between input text spans and timeline regions */
export function computeScopeConnectors(
  scopes: readonly ScopeHighlight[],
  config: ScopeVizConfig,
  _inputPaneRect: { readonly x: number; readonly y: number; readonly width: number; readonly height: number },
  _timelinePaneRect: { readonly x: number; readonly y: number; readonly width: number; readonly height: number },
): readonly ScopeConnector[] {
  if (!config.showConnectors) return [];

  const connectors: ScopeConnector[] = [];
  for (const scope of scopes) {
    if (!scope.isActive && scope.regions.length === 0) continue;
    const firstRegion = scope.regions[0];
    if (firstRegion === undefined) continue;
    const style = SCOPE_HIGHLIGHT_STYLES[scope.scopeKind];
    connectors.push({
      connectorId: `conn-${scope.scopeId}`,
      sourceScopeId: scope.scopeId,
      sourceX: scope.sourceSpanStart,
      sourceY: 0,
      targetX: firstRegion.startOffsetPx,
      targetY: firstRegion.topOffsetPx,
      style: config.connectorStyle,
      color: style.borderColor,
      width: 1.5,
      opacity: 0.6,
    });
  }

  return connectors;
}

/** Build a CSS string for a highlight style */
export function highlightStyleToCSS(style: HighlightStyle): string {
  const lines: string[] = [
    `background-color: ${style.bgColor};`,
    `border: ${style.borderWidth}px ${style.borderStyle} ${style.borderColor};`,
    `border-radius: ${style.cornerRadius}px;`,
    `opacity: ${style.opacity};`,
    `mix-blend-mode: ${style.blendMode};`,
    `transition: all ${style.animationMs}ms ease;`,
  ];
  if (style.glowPx > 0) {
    lines.push(`box-shadow: 0 0 ${style.glowPx}px ${style.glowColor};`);
  }
  return lines.join(' ');
}

/** Compute nesting structure for a set of scopes */
export function computeScopeNesting(
  scopes: readonly ScopeHighlight[],
): readonly ScopeHighlight[] {
  const sorted = [...scopes].sort(
    (a, b) =>
      (a.sourceSpanStart - b.sourceSpanStart) ||
      (b.sourceSpanEnd - a.sourceSpanEnd),
  );

  const result: ScopeHighlight[] = [];
  const stack: ScopeHighlight[] = [];

  for (const scope of sorted) {
    while (stack.length > 0) {
      const top = stack[stack.length - 1];
      if (top !== undefined && top.sourceSpanEnd >= scope.sourceSpanEnd) break;
      stack.pop();
    }

    const parent = stack.length > 0 ? stack[stack.length - 1] : undefined;
    const parentId = parent !== undefined ? parent.scopeId : null;
    const depth = stack.length;

    const updated: ScopeHighlight = {
      ...scope,
      nestingDepth: depth,
      parentScopeId: parentId,
    };
    result.push(updated);
    stack.push(updated);
  }

  return result;
}

/** Filter scopes by kind */
export function filterScopesByKind(
  scopes: readonly ScopeHighlight[],
  kinds: readonly ScopeKind[],
): readonly ScopeHighlight[] {
  return scopes.filter((s) => kinds.includes(s.scopeKind));
}

/** Activate a scope highlight */
export function activateScope(
  scope: ScopeHighlight,
): ScopeHighlight {
  return { ...scope, isActive: true };
}

/** Deactivate a scope highlight */
export function deactivateScope(
  scope: ScopeHighlight,
): ScopeHighlight {
  return { ...scope, isActive: false };
}

// =============================================================================
// STEP 353 — INLINE ENTITY CHIPS
// Resolved referents appear as chips that can be clicked to change binding
// =============================================================================

// ---------------------------------------------------------------------------
// 353 Types
// ---------------------------------------------------------------------------

/** Entity type for chips */
export type ChipEntityType =
  | 'section'
  | 'track'
  | 'instrument'
  | 'effect'
  | 'parameter'
  | 'note'
  | 'chord'
  | 'region'
  | 'bus'
  | 'send'
  | 'automation'
  | 'marker'
  | 'tempo'
  | 'time-signature'
  | 'key-signature'
  | 'clip';

/** Chip size variant */
export type ChipSize = 'xs' | 'sm' | 'md' | 'lg';

/** Chip variant (affects color scheme) */
export type ChipVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'muted';

/** Icon position within a chip */
export type ChipIconPosition = 'left' | 'right' | 'none';

/** Interaction mode for entity chip */
export type ChipInteractionMode =
  | 'click-to-select'
  | 'click-to-rebind'
  | 'click-to-navigate'
  | 'hover-preview'
  | 'drag-to-reorder'
  | 'disabled'
  | 'read-only';

/** Visual style of an entity chip */
export interface ChipStyle {
  readonly variant: ChipVariant;
  readonly size: ChipSize;
  readonly bgColor: string;
  readonly textColor: string;
  readonly borderColor: string;
  readonly borderRadius: number;
  readonly iconPosition: ChipIconPosition;
  readonly iconGlyph: string;
  readonly paddingHPx: number;
  readonly paddingVPx: number;
  readonly fontWeight: number;
  readonly fontSize: number;
  readonly maxWidthPx: number;
  readonly truncateLabel: boolean;
  readonly showTooltip: boolean;
  readonly hoverBgColor: string;
  readonly activeBgColor: string;
  readonly disabledOpacity: number;
}

/** Interaction specification for a chip */
export interface ChipInteraction {
  readonly mode: ChipInteractionMode;
  readonly onClickAction: string;
  readonly onHoverAction: string;
  readonly onDragAction: string;
  readonly rebindTargets: readonly string[];
  readonly navigateTarget: string;
  readonly confirmBeforeRebind: boolean;
  readonly showRebindMenu: boolean;
  readonly previewOnHover: boolean;
}

/** Configuration for entity chips */
export interface ChipConfig {
  readonly defaultSize: ChipSize;
  readonly defaultVariant: ChipVariant;
  readonly defaultInteractionMode: ChipInteractionMode;
  readonly showIcons: boolean;
  readonly showTooltips: boolean;
  readonly animateTransitions: boolean;
  readonly transitionMs: number;
  readonly maxChipsPerLine: number;
  readonly chipGapPx: number;
  readonly enableDrag: boolean;
  readonly enableKeyboardNav: boolean;
  readonly groupByType: boolean;
}

/** An entity chip instance */
export interface EntityChip {
  readonly chipId: string;
  readonly entityType: ChipEntityType;
  readonly entityId: string;
  readonly label: string;
  readonly sublabel: string;
  readonly style: ChipStyle;
  readonly interaction: ChipInteraction;
  readonly isSelected: boolean;
  readonly isHovered: boolean;
  readonly isDragging: boolean;
  readonly order: number;
  readonly groupId: string;
  readonly boundScopeId: string;
  readonly alternateBindings: readonly string[];
}

/** A group of related chips */
export interface ChipGroup {
  readonly groupId: string;
  readonly label: string;
  readonly entityType: ChipEntityType;
  readonly chips: readonly EntityChip[];
  readonly isCollapsed: boolean;
}

/** Rebind menu entry */
export interface RebindOption {
  readonly optionId: string;
  readonly label: string;
  readonly entityId: string;
  readonly entityType: ChipEntityType;
  readonly confidence: number;
  readonly isDefault: boolean;
  readonly description: string;
}

/** Rebind menu state */
export interface RebindMenuState {
  readonly isOpen: boolean;
  readonly chipId: string;
  readonly options: readonly RebindOption[];
  readonly selectedIndex: number;
  readonly filterText: string;
  readonly positionX: number;
  readonly positionY: number;
}

// ---------------------------------------------------------------------------
// 353 Constants
// ---------------------------------------------------------------------------

/** Style presets for each entity type */
const CHIP_STYLE_PRESETS: Record<ChipEntityType, ChipStyle> = {
  section: {
    variant: 'primary',
    size: 'md',
    bgColor: '#dbeafe',
    textColor: '#1e40af',
    borderColor: '#93c5fd',
    borderRadius: 12,
    iconPosition: 'left',
    iconGlyph: '\u00A7',
    paddingHPx: 10,
    paddingVPx: 4,
    fontWeight: 600,
    fontSize: 13,
    maxWidthPx: 200,
    truncateLabel: true,
    showTooltip: true,
    hoverBgColor: '#bfdbfe',
    activeBgColor: '#93c5fd',
    disabledOpacity: 0.5,
  },
  track: {
    variant: 'success',
    size: 'md',
    bgColor: '#d1fae5',
    textColor: '#065f46',
    borderColor: '#6ee7b7',
    borderRadius: 12,
    iconPosition: 'left',
    iconGlyph: '\u266B',
    paddingHPx: 10,
    paddingVPx: 4,
    fontWeight: 600,
    fontSize: 13,
    maxWidthPx: 200,
    truncateLabel: true,
    showTooltip: true,
    hoverBgColor: '#a7f3d0',
    activeBgColor: '#6ee7b7',
    disabledOpacity: 0.5,
  },
  instrument: {
    variant: 'info',
    size: 'md',
    bgColor: '#e0e7ff',
    textColor: '#3730a3',
    borderColor: '#a5b4fc',
    borderRadius: 12,
    iconPosition: 'left',
    iconGlyph: '\u266A',
    paddingHPx: 10,
    paddingVPx: 4,
    fontWeight: 500,
    fontSize: 13,
    maxWidthPx: 200,
    truncateLabel: true,
    showTooltip: true,
    hoverBgColor: '#c7d2fe',
    activeBgColor: '#a5b4fc',
    disabledOpacity: 0.5,
  },
  effect: {
    variant: 'warning',
    size: 'md',
    bgColor: '#fef3c7',
    textColor: '#92400e',
    borderColor: '#fcd34d',
    borderRadius: 12,
    iconPosition: 'left',
    iconGlyph: 'fx',
    paddingHPx: 10,
    paddingVPx: 4,
    fontWeight: 500,
    fontSize: 13,
    maxWidthPx: 200,
    truncateLabel: true,
    showTooltip: true,
    hoverBgColor: '#fde68a',
    activeBgColor: '#fcd34d',
    disabledOpacity: 0.5,
  },
  parameter: {
    variant: 'muted',
    size: 'sm',
    bgColor: '#f1f5f9',
    textColor: '#475569',
    borderColor: '#cbd5e1',
    borderRadius: 8,
    iconPosition: 'left',
    iconGlyph: '\u2699',
    paddingHPx: 8,
    paddingVPx: 3,
    fontWeight: 400,
    fontSize: 12,
    maxWidthPx: 160,
    truncateLabel: true,
    showTooltip: true,
    hoverBgColor: '#e2e8f0',
    activeBgColor: '#cbd5e1',
    disabledOpacity: 0.5,
  },
  note: {
    variant: 'secondary',
    size: 'sm',
    bgColor: '#f3e8ff',
    textColor: '#6b21a8',
    borderColor: '#c4b5fd',
    borderRadius: 10,
    iconPosition: 'left',
    iconGlyph: '\u2669',
    paddingHPx: 8,
    paddingVPx: 3,
    fontWeight: 500,
    fontSize: 12,
    maxWidthPx: 140,
    truncateLabel: true,
    showTooltip: true,
    hoverBgColor: '#e9d5ff',
    activeBgColor: '#c4b5fd',
    disabledOpacity: 0.5,
  },
  chord: {
    variant: 'secondary',
    size: 'md',
    bgColor: '#fce7f3',
    textColor: '#9d174d',
    borderColor: '#f9a8d4',
    borderRadius: 12,
    iconPosition: 'left',
    iconGlyph: '\u266E',
    paddingHPx: 10,
    paddingVPx: 4,
    fontWeight: 600,
    fontSize: 13,
    maxWidthPx: 180,
    truncateLabel: true,
    showTooltip: true,
    hoverBgColor: '#fbcfe8',
    activeBgColor: '#f9a8d4',
    disabledOpacity: 0.5,
  },
  region: {
    variant: 'success',
    size: 'md',
    bgColor: '#dcfce7',
    textColor: '#166534',
    borderColor: '#86efac',
    borderRadius: 12,
    iconPosition: 'left',
    iconGlyph: '\u25A0',
    paddingHPx: 10,
    paddingVPx: 4,
    fontWeight: 500,
    fontSize: 13,
    maxWidthPx: 200,
    truncateLabel: true,
    showTooltip: true,
    hoverBgColor: '#bbf7d0',
    activeBgColor: '#86efac',
    disabledOpacity: 0.5,
  },
  bus: {
    variant: 'info',
    size: 'md',
    bgColor: '#e0f2fe',
    textColor: '#075985',
    borderColor: '#7dd3fc',
    borderRadius: 12,
    iconPosition: 'left',
    iconGlyph: '\u21C4',
    paddingHPx: 10,
    paddingVPx: 4,
    fontWeight: 500,
    fontSize: 13,
    maxWidthPx: 180,
    truncateLabel: true,
    showTooltip: true,
    hoverBgColor: '#bae6fd',
    activeBgColor: '#7dd3fc',
    disabledOpacity: 0.5,
  },
  send: {
    variant: 'default',
    size: 'sm',
    bgColor: '#fff1f2',
    textColor: '#9f1239',
    borderColor: '#fda4af',
    borderRadius: 10,
    iconPosition: 'left',
    iconGlyph: '\u2192',
    paddingHPx: 8,
    paddingVPx: 3,
    fontWeight: 500,
    fontSize: 12,
    maxWidthPx: 160,
    truncateLabel: true,
    showTooltip: true,
    hoverBgColor: '#ffe4e6',
    activeBgColor: '#fda4af',
    disabledOpacity: 0.5,
  },
  automation: {
    variant: 'default',
    size: 'sm',
    bgColor: '#f0fdfa',
    textColor: '#134e4a',
    borderColor: '#5eead4',
    borderRadius: 8,
    iconPosition: 'left',
    iconGlyph: '\u2248',
    paddingHPx: 8,
    paddingVPx: 3,
    fontWeight: 400,
    fontSize: 12,
    maxWidthPx: 160,
    truncateLabel: true,
    showTooltip: true,
    hoverBgColor: '#ccfbf1',
    activeBgColor: '#5eead4',
    disabledOpacity: 0.5,
  },
  marker: {
    variant: 'warning',
    size: 'sm',
    bgColor: '#faf5ff',
    textColor: '#581c87',
    borderColor: '#d8b4fe',
    borderRadius: 10,
    iconPosition: 'left',
    iconGlyph: '\u25B6',
    paddingHPx: 8,
    paddingVPx: 3,
    fontWeight: 500,
    fontSize: 12,
    maxWidthPx: 140,
    truncateLabel: true,
    showTooltip: true,
    hoverBgColor: '#f3e8ff',
    activeBgColor: '#d8b4fe',
    disabledOpacity: 0.5,
  },
  tempo: {
    variant: 'muted',
    size: 'sm',
    bgColor: '#f8fafc',
    textColor: '#334155',
    borderColor: '#94a3b8',
    borderRadius: 8,
    iconPosition: 'left',
    iconGlyph: '\u23F1',
    paddingHPx: 8,
    paddingVPx: 3,
    fontWeight: 400,
    fontSize: 12,
    maxWidthPx: 120,
    truncateLabel: false,
    showTooltip: false,
    hoverBgColor: '#f1f5f9',
    activeBgColor: '#94a3b8',
    disabledOpacity: 0.5,
  },
  'time-signature': {
    variant: 'muted',
    size: 'sm',
    bgColor: '#f8fafc',
    textColor: '#334155',
    borderColor: '#94a3b8',
    borderRadius: 8,
    iconPosition: 'left',
    iconGlyph: '\u2154',
    paddingHPx: 8,
    paddingVPx: 3,
    fontWeight: 400,
    fontSize: 12,
    maxWidthPx: 100,
    truncateLabel: false,
    showTooltip: false,
    hoverBgColor: '#f1f5f9',
    activeBgColor: '#94a3b8',
    disabledOpacity: 0.5,
  },
  'key-signature': {
    variant: 'muted',
    size: 'sm',
    bgColor: '#f8fafc',
    textColor: '#334155',
    borderColor: '#94a3b8',
    borderRadius: 8,
    iconPosition: 'left',
    iconGlyph: '\u266F',
    paddingHPx: 8,
    paddingVPx: 3,
    fontWeight: 400,
    fontSize: 12,
    maxWidthPx: 120,
    truncateLabel: false,
    showTooltip: false,
    hoverBgColor: '#f1f5f9',
    activeBgColor: '#94a3b8',
    disabledOpacity: 0.5,
  },
  clip: {
    variant: 'default',
    size: 'md',
    bgColor: '#fff7ed',
    textColor: '#9a3412',
    borderColor: '#fdba74',
    borderRadius: 12,
    iconPosition: 'left',
    iconGlyph: '\u25AC',
    paddingHPx: 10,
    paddingVPx: 4,
    fontWeight: 500,
    fontSize: 13,
    maxWidthPx: 200,
    truncateLabel: true,
    showTooltip: true,
    hoverBgColor: '#ffedd5',
    activeBgColor: '#fdba74',
    disabledOpacity: 0.5,
  },
};

const DEFAULT_CHIP_CONFIG: ChipConfig = {
  defaultSize: 'md',
  defaultVariant: 'default',
  defaultInteractionMode: 'click-to-rebind',
  showIcons: true,
  showTooltips: true,
  animateTransitions: true,
  transitionMs: 150,
  maxChipsPerLine: 10,
  chipGapPx: 6,
  enableDrag: false,
  enableKeyboardNav: true,
  groupByType: true,
};

// ---------------------------------------------------------------------------
// 353 Functions
// ---------------------------------------------------------------------------

/** Get the chip style preset for an entity type */
export function getChipStyleForEntityType(entityType: ChipEntityType): ChipStyle {
  return CHIP_STYLE_PRESETS[entityType];
}

/** Get default chip config */
export function getDefaultChipConfig(): ChipConfig {
  return DEFAULT_CHIP_CONFIG;
}

/** Create a default chip interaction */
export function createChipInteraction(
  mode: ChipInteractionMode,
  rebindTargets: readonly string[],
): ChipInteraction {
  return {
    mode,
    onClickAction: mode === 'click-to-rebind' ? 'open-rebind-menu' : 'select',
    onHoverAction: 'preview',
    onDragAction: mode === 'drag-to-reorder' ? 'reorder' : 'none',
    rebindTargets,
    navigateTarget: '',
    confirmBeforeRebind: true,
    showRebindMenu: mode === 'click-to-rebind',
    previewOnHover: true,
  };
}

/** Create an entity chip */
export function createEntityChip(
  chipId: string,
  entityType: ChipEntityType,
  entityId: string,
  label: string,
  sublabel: string,
  order: number,
  boundScopeId: string,
  alternateBindings: readonly string[],
): EntityChip {
  return {
    chipId,
    entityType,
    entityId,
    label,
    sublabel,
    style: CHIP_STYLE_PRESETS[entityType],
    interaction: createChipInteraction('click-to-rebind', alternateBindings),
    isSelected: false,
    isHovered: false,
    isDragging: false,
    order,
    groupId: `group-${entityType}`,
    boundScopeId,
    alternateBindings,
  };
}

/** Create a chip group */
export function createChipGroup(
  entityType: ChipEntityType,
  label: string,
  chips: readonly EntityChip[],
): ChipGroup {
  return {
    groupId: `group-${entityType}`,
    label,
    entityType,
    chips,
    isCollapsed: false,
  };
}

/** Group a set of chips by entity type */
export function groupChipsByType(
  chips: readonly EntityChip[],
): readonly ChipGroup[] {
  const grouped = new Map<ChipEntityType, EntityChip[]>();
  for (const chip of chips) {
    const existing = grouped.get(chip.entityType);
    if (existing !== undefined) {
      existing.push(chip);
    } else {
      grouped.set(chip.entityType, [chip]);
    }
  }
  const groups: ChipGroup[] = [];
  grouped.forEach((typeChips, entityType) => {
    groups.push(createChipGroup(entityType, entityType, typeChips));
  });
  return groups;
}

/** Select a chip */
export function selectChip(chip: EntityChip): EntityChip {
  return { ...chip, isSelected: true };
}

/** Deselect a chip */
export function deselectChip(chip: EntityChip): EntityChip {
  return { ...chip, isSelected: false };
}

/** Set chip hover state */
export function setChipHovered(chip: EntityChip, hovered: boolean): EntityChip {
  return { ...chip, isHovered: hovered };
}

/** Create a rebind option */
export function createRebindOption(
  optionId: string,
  label: string,
  entityId: string,
  entityType: ChipEntityType,
  confidence: number,
  isDefault: boolean,
  description: string,
): RebindOption {
  return { optionId, label, entityId, entityType, confidence, isDefault, description };
}

/** Open a rebind menu for a chip */
export function openRebindMenu(
  chip: EntityChip,
  options: readonly RebindOption[],
  posX: number,
  posY: number,
): RebindMenuState {
  return {
    isOpen: true,
    chipId: chip.chipId,
    options,
    selectedIndex: 0,
    filterText: '',
    positionX: posX,
    positionY: posY,
  };
}

/** Close the rebind menu */
export function closeRebindMenu(state: RebindMenuState): RebindMenuState {
  return { ...state, isOpen: false };
}

/** Navigate rebind menu selection */
export function navigateRebindMenu(
  state: RebindMenuState,
  direction: 'up' | 'down',
): RebindMenuState {
  if (!state.isOpen || state.options.length === 0) return state;
  const delta = direction === 'down' ? 1 : -1;
  const newIndex = Math.max(0, Math.min(state.options.length - 1, state.selectedIndex + delta));
  return { ...state, selectedIndex: newIndex };
}

/** Filter rebind menu by text */
export function filterRebindMenu(
  state: RebindMenuState,
  filterText: string,
): RebindMenuState {
  return { ...state, filterText, selectedIndex: 0 };
}

/** Get filtered options from rebind menu state */
export function getFilteredRebindOptions(
  state: RebindMenuState,
): readonly RebindOption[] {
  if (state.filterText.length === 0) return state.options;
  const lower = state.filterText.toLowerCase();
  return state.options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(lower) ||
      opt.description.toLowerCase().includes(lower),
  );
}

/** Render a chip to HTML string */
export function renderChipHTML(chip: EntityChip): string {
  const s = chip.style;
  const stateClasses: string[] = [];
  if (chip.isSelected) stateClasses.push('selected');
  if (chip.isHovered) stateClasses.push('hovered');
  if (chip.isDragging) stateClasses.push('dragging');
  if (chip.interaction.mode === 'disabled') stateClasses.push('disabled');

  const iconHtml = s.iconPosition !== 'none'
    ? `<span class="chip-icon">${s.iconGlyph}</span>`
    : '';

  const classStr = `entity-chip entity-chip--${chip.entityType} ${stateClasses.join(' ')}`;
  return [
    `<span class="${classStr}" data-chip-id="${chip.chipId}" data-entity-id="${chip.entityId}"`,
    ` role="button" tabindex="0" aria-label="${chip.label} (${chip.entityType})">`,
    iconHtml,
    `<span class="chip-label">${chip.label}</span>`,
    chip.sublabel ? `<span class="chip-sublabel">${chip.sublabel}</span>` : '',
    `</span>`,
  ].join('');
}

/** Render a chip group to HTML */
export function renderChipGroupHTML(group: ChipGroup): string {
  const chipsHtml = group.chips.map((c) => renderChipHTML(c)).join('\n');
  return [
    `<div class="chip-group chip-group--${group.entityType}" data-group-id="${group.groupId}">`,
    `  <div class="chip-group-label">${group.label}</div>`,
    `  <div class="chip-group-chips">${chipsHtml}</div>`,
    `</div>`,
  ].join('\n');
}

// =============================================================================
// STEP 354 — APPLY GATING UI
// Disabled until required clarifications resolved and plan preflight passes
// =============================================================================

// ---------------------------------------------------------------------------
// 354 Types
// ---------------------------------------------------------------------------

/** Types of preflight checks */
export type PreflightCheckType =
  | 'clarifications-resolved'
  | 'plan-valid'
  | 'no-destructive-ops'
  | 'scope-bounded'
  | 'undo-available'
  | 'backup-exists'
  | 'no-conflicts'
  | 'permissions-ok'
  | 'resources-available'
  | 'syntax-valid'
  | 'type-check-passed'
  | 'user-confirmed';

/** Severity of a gate condition */
export type GateSeverity = 'blocker' | 'warning' | 'info';

/** Status of a preflight check */
export type PreflightStatus = 'passed' | 'failed' | 'skipped' | 'pending' | 'running';

/** Overall gate state */
export type GateState = 'locked' | 'unlocked' | 'override' | 'bypassed';

/** A single preflight check result */
export interface PreflightCheck {
  readonly checkId: string;
  readonly checkType: PreflightCheckType;
  readonly label: string;
  readonly description: string;
  readonly status: PreflightStatus;
  readonly severity: GateSeverity;
  readonly message: string;
  readonly details: readonly string[];
  readonly startedMs: number;
  readonly completedMs: number;
  readonly durationMs: number;
  readonly canBypass: boolean;
  readonly bypassReason: string;
}

/** A condition that must be met for the gate to open */
export interface GateCondition {
  readonly conditionId: string;
  readonly label: string;
  readonly description: string;
  readonly severity: GateSeverity;
  readonly isMet: boolean;
  readonly relatedCheckIds: readonly string[];
  readonly failureMessage: string;
  readonly resolution: string;
  readonly autoResolvable: boolean;
}

/** The apply gate — aggregates all conditions */
export interface ApplyGate {
  readonly gateId: string;
  readonly state: GateState;
  readonly conditions: readonly GateCondition[];
  readonly checks: readonly PreflightCheck[];
  readonly blockerCount: number;
  readonly warningCount: number;
  readonly infoCount: number;
  readonly allBlockersResolved: boolean;
  readonly lastCheckedMs: number;
  readonly isRunning: boolean;
  readonly progressPercent: number;
}

/** Configuration for the apply gating system */
export interface ApplyConfig {
  readonly autoRunPreflight: boolean;
  readonly runOnEveryChange: boolean;
  readonly allowBypassBlockers: boolean;
  readonly allowBypassWarnings: boolean;
  readonly showDetailsOnFailure: boolean;
  readonly showProgressBar: boolean;
  readonly timeoutMs: number;
  readonly retryCount: number;
  readonly retryDelayMs: number;
  readonly requireExplicitConfirm: boolean;
  readonly showApplyPreview: boolean;
  readonly enabledChecks: readonly PreflightCheckType[];
}

/** Result of running all preflight checks */
export interface PreflightResult {
  readonly allPassed: boolean;
  readonly blockersFailed: number;
  readonly warningsFailed: number;
  readonly totalChecks: number;
  readonly passedChecks: number;
  readonly failedChecks: number;
  readonly skippedChecks: number;
  readonly durationMs: number;
  readonly checks: readonly PreflightCheck[];
  readonly message: string;
}

/** Apply button state */
export interface ApplyButtonState {
  readonly enabled: boolean;
  readonly label: string;
  readonly tooltip: string;
  readonly variant: 'primary' | 'warning' | 'danger' | 'disabled';
  readonly showSpinner: boolean;
  readonly showBadge: boolean;
  readonly badgeCount: number;
  readonly badgeSeverity: GateSeverity;
}

// ---------------------------------------------------------------------------
// 354 Constants
// ---------------------------------------------------------------------------

const DEFAULT_APPLY_CONFIG: ApplyConfig = {
  autoRunPreflight: true,
  runOnEveryChange: false,
  allowBypassBlockers: false,
  allowBypassWarnings: true,
  showDetailsOnFailure: true,
  showProgressBar: true,
  timeoutMs: 10000,
  retryCount: 2,
  retryDelayMs: 500,
  requireExplicitConfirm: true,
  showApplyPreview: true,
  enabledChecks: [
    'clarifications-resolved',
    'plan-valid',
    'no-destructive-ops',
    'scope-bounded',
    'undo-available',
    'backup-exists',
    'no-conflicts',
    'permissions-ok',
    'resources-available',
    'syntax-valid',
    'type-check-passed',
    'user-confirmed',
  ],
};

/** Labels for each preflight check type */
const PREFLIGHT_CHECK_LABELS: Record<PreflightCheckType, string> = {
  'clarifications-resolved': 'All clarifications resolved',
  'plan-valid': 'Plan passes validation',
  'no-destructive-ops': 'No destructive operations',
  'scope-bounded': 'Changes are scope-bounded',
  'undo-available': 'Undo point available',
  'backup-exists': 'Backup exists',
  'no-conflicts': 'No conflicting edits',
  'permissions-ok': 'Permissions verified',
  'resources-available': 'Resources available',
  'syntax-valid': 'CPL syntax valid',
  'type-check-passed': 'Type checking passed',
  'user-confirmed': 'User confirmed',
};

/** Descriptions for each preflight check type */
const PREFLIGHT_CHECK_DESCRIPTIONS: Record<PreflightCheckType, string> = {
  'clarifications-resolved': 'Ensures all ambiguities have been resolved before applying.',
  'plan-valid': 'Validates the edit plan against the current project state.',
  'no-destructive-ops': 'Checks that no irreversible operations are included.',
  'scope-bounded': 'Verifies that changes stay within the intended scope.',
  'undo-available': 'Confirms that an undo point has been created.',
  'backup-exists': 'Verifies that a project backup exists.',
  'no-conflicts': 'Checks for conflicting edits from other sources.',
  'permissions-ok': 'Verifies file and track permissions.',
  'resources-available': 'Checks that required audio resources are available.',
  'syntax-valid': 'Validates CPL syntax before compilation.',
  'type-check-passed': 'Runs the CPL type checker on the plan.',
  'user-confirmed': 'Requires explicit user confirmation before applying.',
};

/** Default severity for each check type */
const PREFLIGHT_CHECK_SEVERITY: Record<PreflightCheckType, GateSeverity> = {
  'clarifications-resolved': 'blocker',
  'plan-valid': 'blocker',
  'no-destructive-ops': 'warning',
  'scope-bounded': 'warning',
  'undo-available': 'blocker',
  'backup-exists': 'warning',
  'no-conflicts': 'blocker',
  'permissions-ok': 'blocker',
  'resources-available': 'warning',
  'syntax-valid': 'blocker',
  'type-check-passed': 'blocker',
  'user-confirmed': 'info',
};

// ---------------------------------------------------------------------------
// 354 Functions
// ---------------------------------------------------------------------------

/** Get default apply config */
export function getDefaultApplyConfig(): ApplyConfig {
  return DEFAULT_APPLY_CONFIG;
}

/** Create a preflight check for a given type */
export function createPreflightCheck(
  checkType: PreflightCheckType,
  status: PreflightStatus,
  message: string,
  details: readonly string[],
): PreflightCheck {
  const now = Date.now();
  return {
    checkId: `pfc-${checkType}-${now}`,
    checkType,
    label: PREFLIGHT_CHECK_LABELS[checkType],
    description: PREFLIGHT_CHECK_DESCRIPTIONS[checkType],
    status,
    severity: PREFLIGHT_CHECK_SEVERITY[checkType],
    message,
    details,
    startedMs: now,
    completedMs: status === 'pending' || status === 'running' ? 0 : now,
    durationMs: 0,
    canBypass: PREFLIGHT_CHECK_SEVERITY[checkType] !== 'blocker',
    bypassReason: '',
  };
}

/** Create a gate condition */
export function createGateCondition(
  conditionId: string,
  label: string,
  description: string,
  severity: GateSeverity,
  isMet: boolean,
  relatedCheckIds: readonly string[],
): GateCondition {
  return {
    conditionId,
    label,
    description,
    severity,
    isMet,
    relatedCheckIds,
    failureMessage: isMet ? '' : `Condition not met: ${label}`,
    resolution: isMet ? '' : `Resolve: ${description}`,
    autoResolvable: false,
  };
}

/** Create an apply gate from conditions and checks */
export function createApplyGate(
  gateId: string,
  conditions: readonly GateCondition[],
  checks: readonly PreflightCheck[],
): ApplyGate {
  const blockerCount = conditions.filter((c) => c.severity === 'blocker' && !c.isMet).length;
  const warningCount = conditions.filter((c) => c.severity === 'warning' && !c.isMet).length;
  const infoCount = conditions.filter((c) => c.severity === 'info' && !c.isMet).length;
  const allBlockersResolved = blockerCount === 0;
  const state: GateState = allBlockersResolved ? 'unlocked' : 'locked';
  return {
    gateId,
    state,
    conditions,
    checks,
    blockerCount,
    warningCount,
    infoCount,
    allBlockersResolved,
    lastCheckedMs: Date.now(),
    isRunning: false,
    progressPercent: 100,
  };
}

/** Run all preflight checks and produce a result */
export function runPreflightChecks(
  checkTypes: readonly PreflightCheckType[],
  checkStatuses: Map<PreflightCheckType, PreflightStatus>,
  checkMessages: Map<PreflightCheckType, string>,
): PreflightResult {
  const startTime = Date.now();
  const checks: PreflightCheck[] = [];

  for (const ct of checkTypes) {
    const status = checkStatuses.get(ct);
    const resolvedStatus: PreflightStatus = status !== undefined ? status : 'pending';
    const msg = checkMessages.get(ct);
    const resolvedMsg = msg !== undefined ? msg : '';
    checks.push(createPreflightCheck(ct, resolvedStatus, resolvedMsg, []));
  }

  const passedChecks = checks.filter((c) => c.status === 'passed').length;
  const failedChecks = checks.filter((c) => c.status === 'failed').length;
  const skippedChecks = checks.filter((c) => c.status === 'skipped').length;
  const blockersFailed = checks.filter(
    (c) => c.status === 'failed' && c.severity === 'blocker',
  ).length;
  const warningsFailed = checks.filter(
    (c) => c.status === 'failed' && c.severity === 'warning',
  ).length;
  const allPassed = failedChecks === 0;
  const endTime = Date.now();

  return {
    allPassed,
    blockersFailed,
    warningsFailed,
    totalChecks: checks.length,
    passedChecks,
    failedChecks,
    skippedChecks,
    durationMs: endTime - startTime,
    checks,
    message: allPassed
      ? 'All preflight checks passed.'
      : `${failedChecks} check(s) failed (${blockersFailed} blockers).`,
  };
}

/** Compute apply button state from a gate */
export function computeApplyButtonState(gate: ApplyGate): ApplyButtonState {
  if (gate.isRunning) {
    return {
      enabled: false,
      label: 'Checking...',
      tooltip: 'Running preflight checks',
      variant: 'disabled',
      showSpinner: true,
      showBadge: false,
      badgeCount: 0,
      badgeSeverity: 'info',
    };
  }

  if (gate.state === 'locked') {
    return {
      enabled: false,
      label: 'Apply',
      tooltip: `${gate.blockerCount} blocker(s) must be resolved`,
      variant: 'disabled',
      showSpinner: false,
      showBadge: true,
      badgeCount: gate.blockerCount,
      badgeSeverity: 'blocker',
    };
  }

  if (gate.warningCount > 0) {
    return {
      enabled: true,
      label: 'Apply (with warnings)',
      tooltip: `${gate.warningCount} warning(s)`,
      variant: 'warning',
      showSpinner: false,
      showBadge: true,
      badgeCount: gate.warningCount,
      badgeSeverity: 'warning',
    };
  }

  return {
    enabled: true,
    label: 'Apply',
    tooltip: 'All checks passed. Ready to apply.',
    variant: 'primary',
    showSpinner: false,
    showBadge: false,
    badgeCount: 0,
    badgeSeverity: 'info',
  };
}

/** Check if a specific check type passed */
export function isCheckPassed(
  result: PreflightResult,
  checkType: PreflightCheckType,
): boolean {
  const found = result.checks.find((c) => c.checkType === checkType);
  return found !== undefined && found.status === 'passed';
}

/** Get all failed checks from a preflight result */
export function getFailedChecks(
  result: PreflightResult,
): readonly PreflightCheck[] {
  return result.checks.filter((c) => c.status === 'failed');
}

/** Get all blocker checks from a preflight result */
export function getBlockerChecks(
  result: PreflightResult,
): readonly PreflightCheck[] {
  return result.checks.filter((c) => c.severity === 'blocker');
}

/** Update a gate after a check completes */
export function updateGateCheck(
  gate: ApplyGate,
  checkId: string,
  newStatus: PreflightStatus,
  newMessage: string,
): ApplyGate {
  const updatedChecks = gate.checks.map((c) => {
    if (c.checkId === checkId) {
      return {
        ...c,
        status: newStatus,
        message: newMessage,
        completedMs: Date.now(),
        durationMs: Date.now() - c.startedMs,
      };
    }
    return c;
  });

  const updatedConditions = gate.conditions.map((cond) => {
    if (cond.relatedCheckIds.includes(checkId)) {
      const relatedChecks = updatedChecks.filter((uc) =>
        cond.relatedCheckIds.includes(uc.checkId),
      );
      const allPassed = relatedChecks.every((rc) => rc.status === 'passed');
      return { ...cond, isMet: allPassed };
    }
    return cond;
  });

  return createApplyGate(gate.gateId, updatedConditions, updatedChecks);
}

/** Bypass a check (only for non-blockers unless override allowed) */
export function bypassCheck(
  gate: ApplyGate,
  checkId: string,
  reason: string,
  config: ApplyConfig,
): ApplyGate {
  const check = gate.checks.find((c) => c.checkId === checkId);
  if (check === undefined) return gate;
  if (check.severity === 'blocker' && !config.allowBypassBlockers) return gate;
  if (check.severity === 'warning' && !config.allowBypassWarnings) return gate;

  const updatedChecks = gate.checks.map((c) => {
    if (c.checkId === checkId) {
      return { ...c, status: 'skipped' as PreflightStatus, bypassReason: reason };
    }
    return c;
  });

  const updatedConditions = gate.conditions.map((cond) => {
    if (cond.relatedCheckIds.includes(checkId)) {
      return { ...cond, isMet: true };
    }
    return cond;
  });

  return createApplyGate(gate.gateId, updatedConditions, updatedChecks);
}

/** Render the gate status as an HTML string */
export function renderGateStatusHTML(gate: ApplyGate): string {
  const btnState = computeApplyButtonState(gate);
  const checksHtml = gate.checks.map((c) => {
    const icon = c.status === 'passed' ? '\u2713' : c.status === 'failed' ? '\u2717' : '\u25CB';
    return `<div class="gate-check gate-check--${c.status}" data-check="${c.checkId}">${icon} ${c.label}</div>`;
  }).join('\n');

  return [
    `<div class="apply-gate apply-gate--${gate.state}">`,
    `  <div class="gate-checks">${checksHtml}</div>`,
    `  <button class="apply-btn apply-btn--${btnState.variant}" ${btnState.enabled ? '' : 'disabled'}>`,
    `    ${btnState.showSpinner ? '<span class="spinner"></span>' : ''}`,
    `    ${btnState.label}`,
    `    ${btnState.showBadge ? `<span class="badge">${btnState.badgeCount}</span>` : ''}`,
    `  </button>`,
    `</div>`,
  ].join('\n');
}

/** Get a summary message for a gate */
export function getGateSummary(gate: ApplyGate): string {
  if (gate.isRunning) return 'Running preflight checks...';
  if (gate.state === 'locked') {
    return `Blocked: ${gate.blockerCount} blocker(s) remaining.`;
  }
  if (gate.warningCount > 0) {
    return `Ready with ${gate.warningCount} warning(s).`;
  }
  return 'All checks passed. Ready to apply.';
}

// =============================================================================
// STEP 355 — QUICK ACTIONS BAR
// Undo, redo, explain, compare plans, export report
// =============================================================================

// ---------------------------------------------------------------------------
// 355 Types
// ---------------------------------------------------------------------------

/** Action category */
export type ActionCategory =
  | 'edit'
  | 'navigation'
  | 'view'
  | 'analysis'
  | 'export'
  | 'help'
  | 'settings';

/** Modifier key */
export type ModifierKey = 'ctrl' | 'shift' | 'alt' | 'meta';

/** Action state */
export type ActionState = 'enabled' | 'disabled' | 'hidden' | 'active';

/** A keyboard shortcut for an action */
export interface ActionShortcut {
  readonly key: string;
  readonly modifiers: readonly ModifierKey[];
  readonly displayString: string;
  readonly platform: 'mac' | 'windows' | 'universal';
}

/** Configuration for a quick action */
export interface ActionConfig {
  readonly showInBar: boolean;
  readonly showInMenu: boolean;
  readonly showTooltip: boolean;
  readonly showShortcut: boolean;
  readonly confirmBefore: boolean;
  readonly confirmMessage: string;
  readonly successMessage: string;
  readonly failureMessage: string;
  readonly iconOnly: boolean;
  readonly groupSeparatorAfter: boolean;
}

/** A quick action */
export interface QuickAction {
  readonly actionId: string;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
  readonly category: ActionCategory;
  readonly shortcut: ActionShortcut;
  readonly secondaryShortcut: ActionShortcut | null;
  readonly state: ActionState;
  readonly config: ActionConfig;
  readonly order: number;
}

/** Action bar configuration */
export interface ActionBar {
  readonly barId: string;
  readonly actions: readonly QuickAction[];
  readonly position: 'top' | 'bottom' | 'left' | 'right';
  readonly orientation: 'horizontal' | 'vertical';
  readonly showLabels: boolean;
  readonly showShortcuts: boolean;
  readonly compactMode: boolean;
  readonly maxVisibleActions: number;
  readonly overflowMenuLabel: string;
}

/** Action execution result */
export interface ActionResult {
  readonly actionId: string;
  readonly success: boolean;
  readonly message: string;
  readonly timestamp: number;
  readonly undoable: boolean;
}

/** Action history entry */
export interface ActionHistoryEntry {
  readonly entryId: string;
  readonly actionId: string;
  readonly label: string;
  readonly timestamp: number;
  readonly result: ActionResult;
  readonly undone: boolean;
}

/** Action bar state */
export interface ActionBarState {
  readonly barId: string;
  readonly history: readonly ActionHistoryEntry[];
  readonly undoIndex: number;
  readonly lastActionId: string;
  readonly isExecuting: boolean;
  readonly currentActionId: string;
}

// ---------------------------------------------------------------------------
// 355 Constants — Quick Action definitions
// ---------------------------------------------------------------------------

function makeShortcut(key: string, modifiers: readonly ModifierKey[], display: string): ActionShortcut {
  return { key, modifiers, displayString: display, platform: 'universal' };
}

function makeDefaultActionConfig(showInBar: boolean, separatorAfter: boolean): ActionConfig {
  return {
    showInBar,
    showInMenu: true,
    showTooltip: true,
    showShortcut: true,
    confirmBefore: false,
    confirmMessage: '',
    successMessage: '',
    failureMessage: '',
    iconOnly: false,
    groupSeparatorAfter: separatorAfter,
  };
}

function makeAction(
  actionId: string,
  label: string,
  description: string,
  icon: string,
  category: ActionCategory,
  shortcut: ActionShortcut,
  order: number,
  showInBar: boolean,
  separatorAfter: boolean,
): QuickAction {
  return {
    actionId,
    label,
    description,
    icon,
    category,
    shortcut,
    secondaryShortcut: null,
    state: 'enabled',
    config: makeDefaultActionConfig(showInBar, separatorAfter),
    order,
  };
}

/** All built-in quick actions */
const BUILTIN_ACTIONS: readonly QuickAction[] = [
  makeAction('undo', 'Undo', 'Undo the last action', '\u21A9', 'edit',
    makeShortcut('z', ['ctrl'], 'Ctrl+Z'), 1, true, false),
  makeAction('redo', 'Redo', 'Redo the last undone action', '\u21AA', 'edit',
    makeShortcut('z', ['ctrl', 'shift'], 'Ctrl+Shift+Z'), 2, true, true),
  makeAction('explain', 'Explain', 'Explain the current plan in plain English', '\u2139',
    'analysis', makeShortcut('e', ['ctrl', 'shift'], 'Ctrl+Shift+E'), 3, true, false),
  makeAction('compare-plans', 'Compare Plans', 'Compare the current plan with alternatives',
    '\u2194', 'analysis', makeShortcut('d', ['ctrl', 'shift'], 'Ctrl+Shift+D'), 4, true, false),
  makeAction('export-report', 'Export Report', 'Export a report of the current session',
    '\u2913', 'export', makeShortcut('r', ['ctrl', 'shift'], 'Ctrl+Shift+R'), 5, true, true),
  makeAction('copy-cpl', 'Copy CPL', 'Copy CPL output to clipboard', '\u2398', 'edit',
    makeShortcut('c', ['ctrl', 'shift'], 'Ctrl+Shift+C'), 6, true, false),
  makeAction('paste-input', 'Paste Input', 'Paste text into the input pane', '\u2399', 'edit',
    makeShortcut('v', ['ctrl'], 'Ctrl+V'), 7, false, false),
  makeAction('select-all', 'Select All', 'Select all text in the active pane', '\u2610', 'edit',
    makeShortcut('a', ['ctrl'], 'Ctrl+A'), 8, false, true),
  makeAction('focus-input', 'Focus Input', 'Focus the English input pane', '\u270E', 'navigation',
    makeShortcut('1', ['ctrl'], 'Ctrl+1'), 9, true, false),
  makeAction('focus-cpl', 'Focus CPL', 'Focus the CPL viewer pane', '\u2261', 'navigation',
    makeShortcut('2', ['ctrl'], 'Ctrl+2'), 10, true, false),
  makeAction('focus-diff', 'Focus Diff', 'Focus the Plan/Diff pane', '\u2637', 'navigation',
    makeShortcut('3', ['ctrl'], 'Ctrl+3'), 11, true, true),
  makeAction('toggle-layout', 'Toggle Layout', 'Cycle through layout presets', '\u229E', 'view',
    makeShortcut('l', ['ctrl', 'shift'], 'Ctrl+Shift+L'), 12, true, false),
  makeAction('toggle-theme', 'Toggle Theme', 'Switch between light and dark theme', '\u263D',
    'view', makeShortcut('t', ['ctrl', 'shift'], 'Ctrl+Shift+T'), 13, true, true),
  makeAction('show-shortcuts', 'Shortcuts', 'Show keyboard shortcut reference', '\u2328', 'help',
    makeShortcut('/', ['ctrl'], 'Ctrl+/'), 14, true, false),
  makeAction('show-help', 'Help', 'Open the help panel', '\u2753', 'help',
    makeShortcut('h', ['ctrl', 'shift'], 'Ctrl+Shift+H'), 15, true, false),
  makeAction('clear-input', 'Clear Input', 'Clear the English input pane', '\u2715', 'edit',
    makeShortcut('k', ['ctrl', 'shift'], 'Ctrl+Shift+K'), 16, false, false),
  makeAction('reparse', 'Reparse', 'Reparse the current input', '\u21BB', 'analysis',
    makeShortcut('p', ['ctrl', 'shift'], 'Ctrl+Shift+P'), 17, true, false),
  makeAction('zoom-in', 'Zoom In', 'Increase font size', '\u002B', 'view',
    makeShortcut('=', ['ctrl'], 'Ctrl+='), 18, false, false),
  makeAction('zoom-out', 'Zoom Out', 'Decrease font size', '\u2212', 'view',
    makeShortcut('-', ['ctrl'], 'Ctrl+-'), 19, false, false),
  makeAction('zoom-reset', 'Reset Zoom', 'Reset to default font size', '\u25CE', 'view',
    makeShortcut('0', ['ctrl'], 'Ctrl+0'), 20, false, true),
] as const;

// ---------------------------------------------------------------------------
// 355 Functions
// ---------------------------------------------------------------------------

/** Get all builtin quick actions */
export function getBuiltinActions(): readonly QuickAction[] {
  return BUILTIN_ACTIONS;
}

/** Create an action bar with default configuration */
export function createActionBar(
  barId: string,
  position: 'top' | 'bottom' | 'left' | 'right',
  showLabels: boolean,
): ActionBar {
  const barActions = BUILTIN_ACTIONS.filter((a) => a.config.showInBar);
  return {
    barId,
    actions: barActions,
    position,
    orientation: position === 'left' || position === 'right' ? 'vertical' : 'horizontal',
    showLabels,
    showShortcuts: true,
    compactMode: false,
    maxVisibleActions: 12,
    overflowMenuLabel: 'More...',
  };
}

/** Create an empty action bar state */
export function createActionBarState(barId: string): ActionBarState {
  return {
    barId,
    history: [],
    undoIndex: -1,
    lastActionId: '',
    isExecuting: false,
    currentActionId: '',
  };
}

/** Find an action by ID */
export function findActionById(
  actions: readonly QuickAction[],
  actionId: string,
): QuickAction | null {
  const found = actions.find((a) => a.actionId === actionId);
  return found !== undefined ? found : null;
}

/** Find an action by keyboard shortcut */
export function findActionByShortcut(
  actions: readonly QuickAction[],
  key: string,
  modifiers: readonly ModifierKey[],
): QuickAction | null {
  const found = actions.find((a) => {
    if (a.shortcut.key === key && modifiersMatch(a.shortcut.modifiers, modifiers)) return true;
    if (a.secondaryShortcut !== null) {
      if (a.secondaryShortcut.key === key && modifiersMatch(a.secondaryShortcut.modifiers, modifiers)) return true;
    }
    return false;
  });
  return found !== undefined ? found : null;
}

/** Check if two modifier key sets are equal */
function modifiersMatch(
  a: readonly ModifierKey[],
  b: readonly ModifierKey[],
): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  for (let i = 0; i < sortedA.length; i++) {
    const itemA = sortedA[i];
    const itemB = sortedB[i];
    if (itemA !== itemB) return false;
  }
  return true;
}

/** Execute an action (simulated — returns result) */
export function executeAction(
  action: QuickAction,
  state: ActionBarState,
): { readonly result: ActionResult; readonly newState: ActionBarState } {
  if (action.state !== 'enabled') {
    const result: ActionResult = {
      actionId: action.actionId,
      success: false,
      message: `Action "${action.label}" is ${action.state}.`,
      timestamp: Date.now(),
      undoable: false,
    };
    return { result, newState: state };
  }

  const result: ActionResult = {
    actionId: action.actionId,
    success: true,
    message: action.config.successMessage || `Executed: ${action.label}`,
    timestamp: Date.now(),
    undoable: action.category === 'edit',
  };

  const entry: ActionHistoryEntry = {
    entryId: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    actionId: action.actionId,
    label: action.label,
    timestamp: Date.now(),
    result,
    undone: false,
  };

  const trimmedHistory = state.undoIndex >= 0
    ? state.history.slice(0, state.undoIndex + 1)
    : state.history;

  const newState: ActionBarState = {
    ...state,
    history: [...trimmedHistory, entry],
    undoIndex: trimmedHistory.length,
    lastActionId: action.actionId,
    isExecuting: false,
    currentActionId: '',
  };

  return { result, newState };
}

/** Undo the last action in the history */
export function undoLastAction(
  state: ActionBarState,
): ActionBarState {
  if (state.undoIndex < 0 || state.history.length === 0) return state;
  const entry = state.history[state.undoIndex];
  if (entry === undefined) return state;
  const updatedHistory = state.history.map((h, i) =>
    i === state.undoIndex ? { ...h, undone: true } : h,
  );
  return {
    ...state,
    history: updatedHistory,
    undoIndex: state.undoIndex - 1,
  };
}

/** Redo the next action in the history */
export function redoNextAction(
  state: ActionBarState,
): ActionBarState {
  const nextIndex = state.undoIndex + 1;
  const nextEntry = state.history[nextIndex];
  if (nextEntry === undefined) return state;
  const updatedHistory = state.history.map((h, i) =>
    i === nextIndex ? { ...h, undone: false } : h,
  );
  return {
    ...state,
    history: updatedHistory,
    undoIndex: nextIndex,
  };
}

/** Get visible actions for the bar (respecting max count) */
export function getVisibleBarActions(bar: ActionBar): {
  readonly visible: readonly QuickAction[];
  readonly overflow: readonly QuickAction[];
} {
  const enabled = bar.actions.filter((a) => a.state !== 'hidden');
  if (enabled.length <= bar.maxVisibleActions) {
    return { visible: enabled, overflow: [] };
  }
  return {
    visible: enabled.slice(0, bar.maxVisibleActions),
    overflow: enabled.slice(bar.maxVisibleActions),
  };
}

/** Filter actions by category */
export function filterActionsByCategory(
  actions: readonly QuickAction[],
  category: ActionCategory,
): readonly QuickAction[] {
  return actions.filter((a) => a.category === category);
}

/** Set the state of an action */
export function setActionState(
  action: QuickAction,
  newState: ActionState,
): QuickAction {
  return { ...action, state: newState };
}

/** Render the action bar as HTML */
export function renderActionBarHTML(bar: ActionBar): string {
  const { visible, overflow } = getVisibleBarActions(bar);
  const btnHtml = visible.map((a) => {
    const shortcutLabel = bar.showShortcuts ? ` (${a.shortcut.displayString})` : '';
    const label = bar.showLabels ? a.label : '';
    const tooltip = `${a.description}${shortcutLabel}`;
    const disabledAttr = a.state === 'disabled' ? ' disabled' : '';
    return [
      `<button class="action-btn action-btn--${a.category}" data-action="${a.actionId}"`,
      ` title="${tooltip}"${disabledAttr} aria-label="${a.description}">`,
      `  <span class="action-icon">${a.icon}</span>`,
      bar.showLabels ? `  <span class="action-label">${label}</span>` : '',
      `</button>`,
    ].join('');
  }).join('\n');

  const overflowHtml = overflow.length > 0
    ? `<button class="action-btn action-btn--overflow" aria-label="${bar.overflowMenuLabel}">\u22EE</button>`
    : '';

  return [
    `<div class="action-bar action-bar--${bar.position} action-bar--${bar.orientation}"`,
    ` data-bar-id="${bar.barId}" role="toolbar" aria-label="Quick Actions">`,
    btnHtml,
    overflowHtml,
    `</div>`,
  ].join('\n');
}

/** Get action history summary */
export function getActionHistorySummary(
  state: ActionBarState,
  maxEntries: number,
): readonly string[] {
  const recent = state.history.slice(-maxEntries);
  return recent.map((entry) => {
    const undoMarker = entry.undone ? ' [undone]' : '';
    const statusMarker = entry.result.success ? '\u2713' : '\u2717';
    return `${statusMarker} ${entry.label}${undoMarker} (${new Date(entry.timestamp).toLocaleTimeString()})`;
  });
}

/** Check if undo is available */
export function canUndo(state: ActionBarState): boolean {
  return state.undoIndex >= 0 && state.history.length > 0;
}

/** Check if redo is available */
export function canRedo(state: ActionBarState): boolean {
  const nextIndex = state.undoIndex + 1;
  return nextIndex < state.history.length;
}
