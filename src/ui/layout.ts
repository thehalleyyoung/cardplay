/**
 * @fileoverview Layout System.
 * 
 * Provides a complete layout infrastructure with:
 * - Resizable panels
 * - Split panes (horizontal/vertical)
 * - Dock layout with drag-to-dock
 * - Tab panels with closable tabs
 * - Floating/draggable panels
 * - Virtual scrolling and scroll areas
 * - Layout persistence
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Layout direction.
 */
export type LayoutDirection = 'horizontal' | 'vertical';

/**
 * Resize direction.
 */
export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/**
 * Dock position.
 */
export type DockPosition = 'left' | 'right' | 'top' | 'bottom' | 'center';

/**
 * Panel visibility state.
 */
export type PanelVisibility = 'visible' | 'hidden' | 'minimized' | 'maximized';

// ============================================================================
// PANEL COMPONENT
// ============================================================================

/**
 * Panel constraints.
 */
export interface PanelConstraints {
  readonly minWidth: number;
  readonly maxWidth: number;
  readonly minHeight: number;
  readonly maxHeight: number;
}

/**
 * Default panel constraints.
 */
export const DEFAULT_PANEL_CONSTRAINTS: PanelConstraints = {
  minWidth: 100,
  maxWidth: Infinity,
  minHeight: 100,
  maxHeight: Infinity,
};

/**
 * Panel state.
 */
export interface PanelState {
  readonly id: string;
  readonly title: string;
  readonly width: number;
  readonly height: number;
  readonly x: number;
  readonly y: number;
  readonly visibility: PanelVisibility;
  readonly zIndex: number;
  readonly constraints: PanelConstraints;
  readonly resizable: boolean;
  readonly collapsible: boolean;
  readonly closable: boolean;
}

/**
 * Default panel state.
 */
export const DEFAULT_PANEL_STATE: Omit<PanelState, 'id' | 'title'> = {
  width: 300,
  height: 200,
  x: 0,
  y: 0,
  visibility: 'visible',
  zIndex: 1,
  constraints: DEFAULT_PANEL_CONSTRAINTS,
  resizable: true,
  collapsible: true,
  closable: true,
};

/**
 * Clamp panel size to constraints.
 */
export function clampPanelSize(
  width: number,
  height: number,
  constraints: PanelConstraints
): { width: number; height: number } {
  return {
    width: Math.max(constraints.minWidth, Math.min(constraints.maxWidth, width)),
    height: Math.max(constraints.minHeight, Math.min(constraints.maxHeight, height)),
  };
}

/**
 * Calculate resize delta.
 */
export function calculateResizeDelta(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  direction: ResizeDirection
): { deltaWidth: number; deltaHeight: number; deltaX: number; deltaY: number } {
  const dx = currentX - startX;
  const dy = currentY - startY;

  let deltaWidth = 0;
  let deltaHeight = 0;
  let deltaX = 0;
  let deltaY = 0;

  if (direction.includes('e')) deltaWidth = dx;
  if (direction.includes('w')) { deltaWidth = -dx; deltaX = dx; }
  if (direction.includes('s')) deltaHeight = dy;
  if (direction.includes('n')) { deltaHeight = -dy; deltaY = dy; }

  return { deltaWidth, deltaHeight, deltaX, deltaY };
}

// ============================================================================
// SPLIT PANE COMPONENT
// ============================================================================

/**
 * Split pane state.
 */
export interface SplitPaneState {
  readonly direction: LayoutDirection;
  readonly primarySize: number;
  readonly primaryMinSize: number;
  readonly primaryMaxSize: number;
  readonly secondaryMinSize: number;
  readonly collapsed: boolean;
  readonly collapsedSize: number;
  readonly gutterSize: number;
}

/**
 * Default split pane state.
 */
export const DEFAULT_SPLIT_PANE_STATE: SplitPaneState = {
  direction: 'horizontal',
  primarySize: 250,
  primaryMinSize: 100,
  primaryMaxSize: 500,
  secondaryMinSize: 100,
  collapsed: false,
  collapsedSize: 0,
  gutterSize: 4,
};

/**
 * Calculate split pane sizes.
 */
export function calculateSplitPaneSizes(
  containerSize: number,
  state: SplitPaneState
): { primary: number; secondary: number } {
  if (state.collapsed) {
    return {
      primary: state.collapsedSize,
      secondary: containerSize - state.collapsedSize - state.gutterSize,
    };
  }

  const primary = Math.max(
    state.primaryMinSize,
    Math.min(state.primaryMaxSize, state.primarySize)
  );
  
  const secondary = Math.max(
    state.secondaryMinSize,
    containerSize - primary - state.gutterSize
  );

  return { primary, secondary };
}

/**
 * Handle split pane drag.
 */
export function handleSplitPaneDrag(
  state: SplitPaneState,
  dragDelta: number,
  containerSize: number
): SplitPaneState {
  const newSize = state.primarySize + dragDelta;
  const maxAllowed = containerSize - state.secondaryMinSize - state.gutterSize;
  const clampedSize = Math.max(
    state.primaryMinSize,
    Math.min(state.primaryMaxSize, Math.min(maxAllowed, newSize))
  );

  return { ...state, primarySize: clampedSize };
}

// ============================================================================
// DOCK LAYOUT COMPONENT
// ============================================================================

/**
 * Dock panel definition.
 */
export interface DockPanel {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly icon?: string;
  readonly closable: boolean;
}

/**
 * Dock layout node types.
 */
export type DockNodeType = 'tab' | 'split' | 'panel';

/**
 * Dock tab node - contains multiple panels in tabs.
 */
export interface DockTabNode {
  readonly type: 'tab';
  readonly id: string;
  readonly panels: readonly string[];
  readonly activePanel: string;
}

/**
 * Dock split node - contains two children.
 */
export interface DockSplitNode {
  readonly type: 'split';
  readonly id: string;
  readonly direction: LayoutDirection;
  readonly children: readonly [DockNode, DockNode];
  readonly ratio: number;
}

/**
 * Dock panel node - single panel reference.
 */
export interface DockPanelNode {
  readonly type: 'panel';
  readonly id: string;
  readonly panelId: string;
}

/**
 * Dock node union.
 */
export type DockNode = DockTabNode | DockSplitNode | DockPanelNode;

/**
 * Dock layout state.
 */
export interface DockLayoutState {
  readonly root: DockNode | null;
  readonly panels: Map<string, DockPanel>;
  readonly floatingPanels: readonly string[];
}

/**
 * Create dock layout state.
 */
export function createDockLayoutState(): DockLayoutState {
  return {
    root: null,
    panels: new Map(),
    floatingPanels: [],
  };
}

/**
 * Add panel to dock layout.
 */
export function addDockPanel(
  state: DockLayoutState,
  panel: DockPanel,
  position: DockPosition,
  targetNodeId?: string
): DockLayoutState {
  const newPanels = new Map(state.panels);
  newPanels.set(panel.id, panel);

  if (!state.root) {
    // First panel
    return {
      ...state,
      panels: newPanels,
      root: { type: 'panel', id: `node-${panel.id}`, panelId: panel.id },
    };
  }

  // Add to existing layout
  const newPanelNode: DockPanelNode = {
    type: 'panel',
    id: `node-${panel.id}`,
    panelId: panel.id,
  };

  let newRoot: DockNode;

  if (position === 'center' || !targetNodeId) {
    // Wrap in tab node if center
    if (state.root.type === 'tab') {
      newRoot = {
        ...state.root,
        panels: [...state.root.panels, panel.id],
      };
    } else {
      newRoot = {
        type: 'split',
        id: `split-${Date.now()}`,
        direction: position === 'left' || position === 'right' ? 'horizontal' : 'vertical',
        children: position === 'left' || position === 'top' 
          ? [newPanelNode, state.root]
          : [state.root, newPanelNode],
        ratio: 0.5,
      };
    }
  } else {
    newRoot = {
      type: 'split',
      id: `split-${Date.now()}`,
      direction: position === 'left' || position === 'right' ? 'horizontal' : 'vertical',
      children: position === 'left' || position === 'top'
        ? [newPanelNode, state.root]
        : [state.root, newPanelNode],
      ratio: 0.25,
    };
  }

  return { ...state, panels: newPanels, root: newRoot };
}

/**
 * Remove panel from dock layout.
 */
export function removeDockPanel(
  state: DockLayoutState,
  panelId: string
): DockLayoutState {
  const newPanels = new Map(state.panels);
  newPanels.delete(panelId);

  const removeFromNode = (node: DockNode): DockNode | null => {
    if (node.type === 'panel') {
      return node.panelId === panelId ? null : node;
    }
    
    if (node.type === 'tab') {
      const newPanelList = node.panels.filter(p => p !== panelId);
      if (newPanelList.length === 0) return null;
      return {
        ...node,
        panels: newPanelList,
        activePanel: node.activePanel === panelId 
          ? newPanelList[0]! 
          : node.activePanel,
      };
    }
    
    if (node.type === 'split') {
      const left = removeFromNode(node.children[0]);
      const right = removeFromNode(node.children[1]);
      
      if (!left && !right) return null;
      if (!left) return right;
      if (!right) return left;
      
      return { ...node, children: [left, right] };
    }
    
    return node;
  };

  return {
    ...state,
    panels: newPanels,
    root: state.root ? removeFromNode(state.root) : null,
  };
}

// ============================================================================
// TAB PANEL COMPONENT
// ============================================================================

/**
 * Tab panel item.
 */
export interface TabPanelItem {
  readonly id: string;
  readonly title: string;
  readonly icon?: string;
  readonly closable: boolean;
  readonly dirty?: boolean;
}

/**
 * Tab panel state.
 */
export interface TabPanelState {
  readonly tabs: readonly TabPanelItem[];
  readonly activeTab: string;
  readonly scrollOffset: number;
}

/**
 * Create tab panel state.
 */
export function createTabPanelState(tabs: readonly TabPanelItem[] = []): TabPanelState {
  return {
    tabs,
    activeTab: tabs[0]?.id ?? '',
    scrollOffset: 0,
  };
}

/**
 * Add tab to panel.
 */
export function addTab(
  state: TabPanelState,
  tab: TabPanelItem,
  index?: number
): TabPanelState {
  const newTabs = index !== undefined
    ? [...state.tabs.slice(0, index), tab, ...state.tabs.slice(index)]
    : [...state.tabs, tab];
  
  return { ...state, tabs: newTabs, activeTab: tab.id };
}

/**
 * Remove tab from panel.
 */
export function removeTab(
  state: TabPanelState,
  tabId: string
): TabPanelState {
  const newTabs = state.tabs.filter(t => t.id !== tabId);
  const removedIndex = state.tabs.findIndex(t => t.id === tabId);
  
  let newActiveTab = state.activeTab;
  if (state.activeTab === tabId && newTabs.length > 0) {
    // Activate adjacent tab
    newActiveTab = newTabs[Math.min(removedIndex, newTabs.length - 1)]!.id;
  }
  
  return { ...state, tabs: newTabs, activeTab: newActiveTab };
}

/**
 * Reorder tabs.
 */
export function reorderTabs(
  state: TabPanelState,
  fromIndex: number,
  toIndex: number
): TabPanelState {
  const newTabs = [...state.tabs];
  const [removed] = newTabs.splice(fromIndex, 1);
  if (removed) {
    newTabs.splice(toIndex, 0, removed);
  }
  return { ...state, tabs: newTabs };
}

// ============================================================================
// FLOATING PANEL COMPONENT
// ============================================================================

/**
 * Floating panel state.
 */
export interface FloatingPanelState {
  readonly id: string;
  readonly title: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly minWidth: number;
  readonly minHeight: number;
  readonly zIndex: number;
  readonly pinned: boolean;
  readonly resizing: boolean;
  readonly dragging: boolean;
}

/**
 * Default floating panel state.
 */
export const DEFAULT_FLOATING_PANEL: Omit<FloatingPanelState, 'id' | 'title'> = {
  x: 100,
  y: 100,
  width: 300,
  height: 200,
  minWidth: 150,
  minHeight: 100,
  zIndex: 1000,
  pinned: false,
  resizing: false,
  dragging: false,
};

/**
 * Floating panel manager state.
 */
export interface FloatingPanelManager {
  readonly panels: Map<string, FloatingPanelState>;
  readonly nextZIndex: number;
}

/**
 * Create floating panel manager.
 */
export function createFloatingPanelManager(): FloatingPanelManager {
  return {
    panels: new Map(),
    nextZIndex: 1000,
  };
}

/**
 * Bring panel to front.
 */
export function bringToFront(
  manager: FloatingPanelManager,
  panelId: string
): FloatingPanelManager {
  const panel = manager.panels.get(panelId);
  if (!panel) return manager;

  const newPanels = new Map(manager.panels);
  newPanels.set(panelId, { ...panel, zIndex: manager.nextZIndex });

  return {
    panels: newPanels,
    nextZIndex: manager.nextZIndex + 1,
  };
}

/**
 * Move floating panel.
 */
export function moveFloatingPanel(
  manager: FloatingPanelManager,
  panelId: string,
  x: number,
  y: number
): FloatingPanelManager {
  const panel = manager.panels.get(panelId);
  if (!panel) return manager;

  const newPanels = new Map(manager.panels);
  newPanels.set(panelId, { ...panel, x, y });

  return { ...manager, panels: newPanels };
}

/**
 * Resize floating panel.
 */
export function resizeFloatingPanel(
  manager: FloatingPanelManager,
  panelId: string,
  width: number,
  height: number
): FloatingPanelManager {
  const panel = manager.panels.get(panelId);
  if (!panel) return manager;

  const newPanels = new Map(manager.panels);
  newPanels.set(panelId, {
    ...panel,
    width: Math.max(panel.minWidth, width),
    height: Math.max(panel.minHeight, height),
  });

  return { ...manager, panels: newPanels };
}

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================

/**
 * Sidebar state.
 */
export interface SidebarState {
  readonly position: 'left' | 'right';
  readonly width: number;
  readonly minWidth: number;
  readonly maxWidth: number;
  readonly collapsed: boolean;
  readonly collapsedWidth: number;
}

/**
 * Default sidebar state.
 */
export const DEFAULT_SIDEBAR_STATE: SidebarState = {
  position: 'left',
  width: 240,
  minWidth: 150,
  maxWidth: 400,
  collapsed: false,
  collapsedWidth: 48,
};

/**
 * Toggle sidebar collapsed state.
 */
export function toggleSidebar(state: SidebarState): SidebarState {
  return { ...state, collapsed: !state.collapsed };
}

/**
 * Get sidebar width.
 */
export function getSidebarWidth(state: SidebarState): number {
  return state.collapsed ? state.collapsedWidth : state.width;
}

// ============================================================================
// TOOLBAR COMPONENT
// ============================================================================

/**
 * Toolbar item type.
 */
export type ToolbarItemType = 'button' | 'toggle' | 'dropdown' | 'separator' | 'spacer' | 'custom';

/**
 * Toolbar item.
 */
export interface ToolbarItem {
  readonly type: ToolbarItemType;
  readonly id: string;
  readonly icon?: string;
  readonly label?: string;
  readonly tooltip?: string;
  readonly disabled?: boolean;
  readonly pressed?: boolean;
  readonly items?: readonly ToolbarItem[];
}

/**
 * Create toolbar button.
 */
export function toolbarButton(
  id: string,
  icon: string,
  tooltip: string,
  disabled: boolean = false
): ToolbarItem {
  return { type: 'button', id, icon, tooltip, disabled };
}

/**
 * Create toolbar toggle.
 */
export function toolbarToggle(
  id: string,
  icon: string,
  tooltip: string,
  pressed: boolean = false
): ToolbarItem {
  return { type: 'toggle', id, icon, tooltip, pressed };
}

/**
 * Create toolbar separator.
 */
export function toolbarSeparator(): ToolbarItem {
  return { type: 'separator', id: `sep-${Date.now()}` };
}

/**
 * Create toolbar spacer.
 */
export function toolbarSpacer(): ToolbarItem {
  return { type: 'spacer', id: `space-${Date.now()}` };
}

// ============================================================================
// SCROLL AREA
// ============================================================================

/**
 * Scroll area state.
 */
export interface ScrollAreaState {
  readonly scrollTop: number;
  readonly scrollLeft: number;
  readonly scrollHeight: number;
  readonly scrollWidth: number;
  readonly clientHeight: number;
  readonly clientWidth: number;
}

/**
 * Calculate scroll bar visibility.
 */
export function getScrollBarVisibility(
  state: ScrollAreaState
): { vertical: boolean; horizontal: boolean } {
  return {
    vertical: state.scrollHeight > state.clientHeight,
    horizontal: state.scrollWidth > state.clientWidth,
  };
}

/**
 * Calculate scroll bar thumb size.
 */
export function getScrollBarThumbSize(
  containerSize: number,
  contentSize: number,
  trackSize: number,
  minThumbSize: number = 30
): number {
  if (contentSize <= containerSize) return 0;
  
  const ratio = containerSize / contentSize;
  return Math.max(minThumbSize, trackSize * ratio);
}

/**
 * Calculate scroll bar thumb position.
 */
export function getScrollBarThumbPosition(
  scrollOffset: number,
  containerSize: number,
  contentSize: number,
  trackSize: number,
  thumbSize: number
): number {
  if (contentSize <= containerSize) return 0;
  
  const maxScroll = contentSize - containerSize;
  const scrollRatio = scrollOffset / maxScroll;
  const maxThumbPosition = trackSize - thumbSize;
  
  return scrollRatio * maxThumbPosition;
}

// ============================================================================
// GRID LAYOUT
// ============================================================================

/**
 * Grid item.
 */
export interface GridItem {
  readonly id: string;
  readonly column: number;
  readonly row: number;
  readonly columnSpan: number;
  readonly rowSpan: number;
}

/**
 * Grid layout state.
 */
export interface GridLayoutState {
  readonly columns: number;
  readonly rows: number;
  readonly gap: number;
  readonly items: readonly GridItem[];
}

/**
 * Default grid layout state.
 */
export const DEFAULT_GRID_STATE: GridLayoutState = {
  columns: 12,
  rows: 1,
  gap: 8,
  items: [],
};

/**
 * Calculate grid item bounds.
 */
export function calculateGridItemBounds(
  item: GridItem,
  containerWidth: number,
  containerHeight: number,
  columns: number,
  rows: number,
  gap: number
): { x: number; y: number; width: number; height: number } {
  const cellWidth = (containerWidth - gap * (columns - 1)) / columns;
  const cellHeight = (containerHeight - gap * (rows - 1)) / rows;

  return {
    x: item.column * (cellWidth + gap),
    y: item.row * (cellHeight + gap),
    width: item.columnSpan * cellWidth + (item.columnSpan - 1) * gap,
    height: item.rowSpan * cellHeight + (item.rowSpan - 1) * gap,
  };
}

// ============================================================================
// LAYOUT PERSISTENCE
// ============================================================================

/**
 * Persisted layout state.
 */
export interface PersistedLayout {
  readonly version: number;
  readonly panels: readonly PanelState[];
  readonly sidebar: SidebarState;
  readonly splitPanes: Record<string, SplitPaneState>;
  readonly timestamp: number;
}

/**
 * Current layout schema version.
 */
export const LAYOUT_SCHEMA_VERSION = 1;

/**
 * Serialize layout to JSON.
 */
export function serializeLayout(
  panels: readonly PanelState[],
  sidebar: SidebarState,
  splitPanes: Record<string, SplitPaneState>
): string {
  const layout: PersistedLayout = {
    version: LAYOUT_SCHEMA_VERSION,
    panels,
    sidebar,
    splitPanes,
    timestamp: Date.now(),
  };
  return JSON.stringify(layout);
}

/**
 * Deserialize layout from JSON.
 */
export function deserializeLayout(json: string): PersistedLayout | null {
  try {
    const parsed = JSON.parse(json) as PersistedLayout;
    
    if (parsed.version !== LAYOUT_SCHEMA_VERSION) {
      return null; // Incompatible version
    }
    
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Save layout to local storage.
 */
export function saveLayout(
  key: string,
  panels: readonly PanelState[],
  sidebar: SidebarState,
  splitPanes: Record<string, SplitPaneState>
): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const serialized = serializeLayout(panels, sidebar, splitPanes);
    localStorage.setItem(key, serialized);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load layout from local storage.
 */
export function loadLayout(key: string): PersistedLayout | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const json = localStorage.getItem(key);
    if (!json) return null;
    return deserializeLayout(json);
  } catch {
    return null;
  }
}

// ============================================================================
// RESPONSIVE BREAKPOINTS
// ============================================================================

/**
 * Breakpoint definitions.
 */
export interface Breakpoints {
  readonly xs: number;
  readonly sm: number;
  readonly md: number;
  readonly lg: number;
  readonly xl: number;
  readonly xxl: number;
}

/**
 * Default breakpoints.
 */
export const DEFAULT_BREAKPOINTS: Breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
};

/**
 * Breakpoint name.
 */
export type BreakpointName = keyof Breakpoints;

/**
 * Get current breakpoint.
 */
export function getCurrentBreakpoint(
  width: number,
  breakpoints: Breakpoints = DEFAULT_BREAKPOINTS
): BreakpointName {
  if (width >= breakpoints.xxl) return 'xxl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
}

/**
 * Check if width matches breakpoint.
 */
export function matchesBreakpoint(
  width: number,
  breakpoint: BreakpointName,
  breakpoints: Breakpoints = DEFAULT_BREAKPOINTS
): boolean {
  return width >= breakpoints[breakpoint];
}

// ============================================================================
// KEYBOARD NAVIGATION
// ============================================================================

/**
 * Focus direction.
 */
export type FocusDirection = 'up' | 'down' | 'left' | 'right' | 'next' | 'prev';

/**
 * Focusable element.
 */
export interface FocusableElement {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Find next focusable element.
 */
export function findNextFocusable(
  elements: readonly FocusableElement[],
  currentId: string,
  direction: FocusDirection
): string | null {
  const current = elements.find(e => e.id === currentId);
  if (!current) return elements[0]?.id ?? null;

  const currentIndex = elements.findIndex(e => e.id === currentId);

  if (direction === 'next') {
    const nextIndex = (currentIndex + 1) % elements.length;
    return elements[nextIndex]?.id ?? null;
  }

  if (direction === 'prev') {
    const prevIndex = (currentIndex - 1 + elements.length) % elements.length;
    return elements[prevIndex]?.id ?? null;
  }

  // Directional navigation
  const candidates = elements.filter(e => {
    if (e.id === currentId) return false;
    
    const centerX = e.x + e.width / 2;
    const centerY = e.y + e.height / 2;
    const currentCenterX = current.x + current.width / 2;
    const currentCenterY = current.y + current.height / 2;

    switch (direction) {
      case 'up': return centerY < currentCenterY;
      case 'down': return centerY > currentCenterY;
      case 'left': return centerX < currentCenterX;
      case 'right': return centerX > currentCenterX;
      default: return false;
    }
  });

  if (candidates.length === 0) return null;

  // Find closest in direction
  return candidates.reduce((closest, candidate) => {
    const currentCenterX = current.x + current.width / 2;
    const currentCenterY = current.y + current.height / 2;
    
    const closestDist = Math.hypot(
      (closest.x + closest.width / 2) - currentCenterX,
      (closest.y + closest.height / 2) - currentCenterY
    );
    
    const candidateDist = Math.hypot(
      (candidate.x + candidate.width / 2) - currentCenterX,
      (candidate.y + candidate.height / 2) - currentCenterY
    );
    
    return candidateDist < closestDist ? candidate : closest;
  }).id;
}

// ============================================================================
// CARD/DECK LAYOUT INTEGRATION (4.3)
// ============================================================================

/**
 * Card layout mode.
 */
export type CardLayoutMode = 
  | 'flow'      // Cards flow in a grid
  | 'rack'      // Cards in a single row/column like a rack
  | 'canvas'    // Free-form canvas positioning
  | 'stack'     // Cards stacked vertically/horizontally
  | 'grid'      // Fixed grid positions
  | 'masonry';  // Pinterest-style auto-layout

/**
 * Card position in layout.
 */
export interface CardLayoutPosition {
  /** Card ID */
  readonly cardId: string;
  /** X position (pixels or grid units) */
  x: number;
  /** Y position (pixels or grid units) */
  y: number;
  /** Width (pixels or grid units) */
  width: number;
  /** Height (pixels or grid units) */
  height: number;
  /** Z-index for layering */
  zIndex: number;
  /** Whether card is collapsed/minimized */
  collapsed: boolean;
  /** Custom rotation (degrees) */
  rotation: number;
  /** Scale factor */
  scale: number;
  /** Opacity (0-1) */
  opacity: number;
  /** Locked position */
  locked: boolean;
}

/**
 * Card connection in layout.
 */
export interface CardLayoutConnection {
  /** Connection ID */
  readonly id: string;
  /** Source card ID */
  readonly sourceCardId: string;
  /** Source port name */
  readonly sourcePort: string;
  /** Target card ID */
  readonly targetCardId: string;
  /** Target port name */
  readonly targetPort: string;
  /** Connection type for styling */
  readonly connectionType: 'audio' | 'midi' | 'control' | 'trigger';
  /** Control points for curved cables */
  controlPoints?: { x: number; y: number }[];
}

/**
 * Deck (group of cards) in layout.
 */
export interface DeckLayout {
  /** Deck ID */
  readonly id: string;
  /** Deck name */
  readonly name: string;
  /** Cards in this deck (ordered) */
  readonly cardIds: readonly string[];
  /** Layout mode for cards in deck */
  readonly mode: CardLayoutMode;
  /** Deck position */
  x: number;
  y: number;
  /** Deck size */
  width: number;
  height: number;
  /** Whether deck is expanded */
  expanded: boolean;
  /** Color for deck background */
  color?: string;
  /** Grid columns (for grid mode) */
  gridColumns?: number;
  /** Spacing between cards */
  spacing: number;
}

/**
 * Complete card layout state.
 */
export interface CardLayoutState {
  /** Layout mode */
  readonly mode: CardLayoutMode;
  /** Card positions */
  readonly cards: Map<string, CardLayoutPosition>;
  /** Connections between cards */
  readonly connections: Map<string, CardLayoutConnection>;
  /** Decks */
  readonly decks: Map<string, DeckLayout>;
  /** Grid cell size (for grid mode) */
  readonly gridCellSize: number;
  /** Snap to grid */
  readonly snapToGrid: boolean;
  /** Show connection cables */
  readonly showConnections: boolean;
  /** Selected card IDs */
  readonly selectedCards: Set<string>;
  /** Viewport position */
  readonly viewportX: number;
  readonly viewportY: number;
  /** Viewport zoom */
  readonly viewportZoom: number;
}

/**
 * Create initial card layout state.
 */
export function createCardLayoutState(mode: CardLayoutMode = 'flow'): CardLayoutState {
  return {
    mode,
    cards: new Map(),
    connections: new Map(),
    decks: new Map(),
    gridCellSize: 20,
    snapToGrid: true,
    showConnections: true,
    selectedCards: new Set(),
    viewportX: 0,
    viewportY: 0,
    viewportZoom: 1,
  };
}

/**
 * Create a card layout position.
 */
export function createCardLayoutPosition(
  cardId: string,
  x: number = 0,
  y: number = 0,
  options: Partial<CardLayoutPosition> = {}
): CardLayoutPosition {
  return {
    cardId,
    x,
    y,
    width: 300,
    height: 200,
    zIndex: 1,
    collapsed: false,
    rotation: 0,
    scale: 1,
    opacity: 1,
    locked: false,
    ...options,
  };
}

/**
 * Add a card to the layout.
 */
export function addCardToLayout(
  state: CardLayoutState,
  cardId: string,
  x?: number,
  y?: number
): CardLayoutState {
  const newCards = new Map(state.cards);
  
  // Auto-position if not specified
  let posX = x ?? 0;
  let posY = y ?? 0;
  
  if (x === undefined || y === undefined) {
    // Find a free position
    const existingPositions = Array.from(state.cards.values());
    if (existingPositions.length > 0) {
      switch (state.mode) {
        case 'flow':
        case 'rack':
          // Place at end of row/column
          const lastCard = existingPositions[existingPositions.length - 1]!;
          posX = lastCard.x + lastCard.width + 20;
          posY = lastCard.y;
          break;
        case 'stack':
          // Place below last card
          const stackLast = existingPositions[existingPositions.length - 1]!;
          posX = stackLast.x;
          posY = stackLast.y + stackLast.height + 10;
          break;
        default:
          // Find non-overlapping position
          posX = existingPositions.length * 50;
          posY = existingPositions.length * 50;
      }
    }
  }
  
  // Snap to grid if enabled
  if (state.snapToGrid) {
    posX = Math.round(posX / state.gridCellSize) * state.gridCellSize;
    posY = Math.round(posY / state.gridCellSize) * state.gridCellSize;
  }
  
  newCards.set(cardId, createCardLayoutPosition(cardId, posX, posY));
  
  return { ...state, cards: newCards };
}

/**
 * Remove a card from the layout.
 */
export function removeCardFromLayout(
  state: CardLayoutState,
  cardId: string
): CardLayoutState {
  const newCards = new Map(state.cards);
  const newConnections = new Map(state.connections);
  const newSelectedCards = new Set(state.selectedCards);
  
  newCards.delete(cardId);
  newSelectedCards.delete(cardId);
  
  // Remove connections involving this card
  for (const [connId, conn] of Array.from(newConnections)) {
    if (conn.sourceCardId === cardId || conn.targetCardId === cardId) {
      newConnections.delete(connId);
    }
  }
  
  // Remove from decks
  const newDecks = new Map(state.decks);
  for (const [deckId, deck] of Array.from(newDecks)) {
    if (deck.cardIds.includes(cardId)) {
      newDecks.set(deckId, {
        ...deck,
        cardIds: deck.cardIds.filter(id => id !== cardId),
      });
    }
  }
  
  return { ...state, cards: newCards, connections: newConnections, decks: newDecks, selectedCards: newSelectedCards };
}

/**
 * Move a card to a new position.
 */
export function moveCard(
  state: CardLayoutState,
  cardId: string,
  newX: number,
  newY: number
): CardLayoutState {
  const card = state.cards.get(cardId);
  if (!card || card.locked) return state;
  
  let x = newX;
  let y = newY;
  
  // Snap to grid
  if (state.snapToGrid) {
    x = Math.round(x / state.gridCellSize) * state.gridCellSize;
    y = Math.round(y / state.gridCellSize) * state.gridCellSize;
  }
  
  const newCards = new Map(state.cards);
  newCards.set(cardId, { ...card, x, y });
  
  return { ...state, cards: newCards };
}

/**
 * Resize a card.
 */
export function resizeCard(
  state: CardLayoutState,
  cardId: string,
  newWidth: number,
  newHeight: number
): CardLayoutState {
  const card = state.cards.get(cardId);
  if (!card || card.locked) return state;
  
  let width = Math.max(100, newWidth);
  let height = Math.max(80, newHeight);
  
  // Snap to grid
  if (state.snapToGrid) {
    width = Math.round(width / state.gridCellSize) * state.gridCellSize;
    height = Math.round(height / state.gridCellSize) * state.gridCellSize;
  }
  
  const newCards = new Map(state.cards);
  newCards.set(cardId, { ...card, width, height });
  
  return { ...state, cards: newCards };
}

/**
 * Add a connection between cards.
 */
export function addCardConnection(
  state: CardLayoutState,
  sourceCardId: string,
  sourcePort: string,
  targetCardId: string,
  targetPort: string,
  connectionType: CardLayoutConnection['connectionType'] = 'audio'
): CardLayoutState {
  const id = `${sourceCardId}:${sourcePort}->${targetCardId}:${targetPort}`;
  
  // Check if connection already exists
  if (state.connections.has(id)) return state;
  
  const newConnections = new Map(state.connections);
  newConnections.set(id, {
    id,
    sourceCardId,
    sourcePort,
    targetCardId,
    targetPort,
    connectionType,
  });
  
  return { ...state, connections: newConnections };
}

/**
 * Remove a connection.
 */
export function removeCardConnection(
  state: CardLayoutState,
  connectionId: string
): CardLayoutState {
  const newConnections = new Map(state.connections);
  newConnections.delete(connectionId);
  return { ...state, connections: newConnections };
}

/**
 * Create a deck from selected cards.
 */
export function createDeckFromSelection(
  state: CardLayoutState,
  deckName: string,
  mode: CardLayoutMode = 'stack'
): CardLayoutState {
  if (state.selectedCards.size === 0) return state;
  
  const deckId = `deck-${Date.now()}`;
  const cardIds = Array.from(state.selectedCards);
  
  // Calculate deck bounds from cards
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const cardId of cardIds) {
    const card = state.cards.get(cardId);
    if (card) {
      minX = Math.min(minX, card.x);
      minY = Math.min(minY, card.y);
      maxX = Math.max(maxX, card.x + card.width);
      maxY = Math.max(maxY, card.y + card.height);
    }
  }
  
  const deck: DeckLayout = {
    id: deckId,
    name: deckName,
    cardIds,
    mode,
    x: minX - 10,
    y: minY - 30, // Space for deck header
    width: maxX - minX + 20,
    height: maxY - minY + 40,
    expanded: true,
    spacing: 10,
  };
  
  const newDecks = new Map(state.decks);
  newDecks.set(deckId, deck);
  
  return { ...state, decks: newDecks };
}

/**
 * Auto-layout cards using specified algorithm.
 */
export function autoLayoutCards(
  state: CardLayoutState,
  containerWidth: number,
  _containerHeight: number
): CardLayoutState {
  const cards = Array.from(state.cards.values()).filter(c => !c.locked);
  if (cards.length === 0) return state;
  
  const newCards = new Map(state.cards);
  const spacing = state.gridCellSize;
  
  switch (state.mode) {
    case 'flow': {
      // Flow layout - wrapping rows
      let x = spacing;
      let y = spacing;
      let rowHeight = 0;
      
      for (const card of cards) {
        if (x + card.width > containerWidth) {
          x = spacing;
          y += rowHeight + spacing;
          rowHeight = 0;
        }
        
        newCards.set(card.cardId, { ...card, x, y });
        x += card.width + spacing;
        rowHeight = Math.max(rowHeight, card.height);
      }
      break;
    }
    
    case 'rack': {
      // Single row
      let x = spacing;
      const y = spacing;
      
      for (const card of cards) {
        newCards.set(card.cardId, { ...card, x, y });
        x += card.width + spacing;
      }
      break;
    }
    
    case 'stack': {
      // Vertical stack
      const x = spacing;
      let y = spacing;
      
      for (const card of cards) {
        newCards.set(card.cardId, { ...card, x, y });
        y += card.height + spacing;
      }
      break;
    }
    
    case 'grid': {
      // Fixed grid
      const cols = Math.floor(containerWidth / (300 + spacing));
      let col = 0;
      let row = 0;
      
      for (const card of cards) {
        const x = col * (300 + spacing) + spacing;
        const y = row * (200 + spacing) + spacing;
        newCards.set(card.cardId, { ...card, x, y, width: 300, height: 200 });
        
        col++;
        if (col >= cols) {
          col = 0;
          row++;
        }
      }
      break;
    }
    
    case 'masonry': {
      // Pinterest-style masonry layout
      const cols = Math.max(1, Math.floor(containerWidth / (300 + spacing)));
      const colHeights = new Array(cols).fill(spacing);
      
      for (const card of cards) {
        // Find shortest column
        const minCol = colHeights.indexOf(Math.min(...colHeights));
        const x = minCol * (300 + spacing) + spacing;
        const y = colHeights[minCol]!;
        
        newCards.set(card.cardId, { ...card, x, y, width: 300 });
        colHeights[minCol] = y + card.height + spacing;
      }
      break;
    }
    
    case 'canvas':
    default:
      // Don't auto-layout in canvas mode
      break;
  }
  
  return { ...state, cards: newCards };
}

/**
 * Calculate cable path between two cards.
 */
export function calculateCablePath(
  sourceCard: CardLayoutPosition,
  sourcePortIndex: number,
  targetCard: CardLayoutPosition,
  targetPortIndex: number,
  portHeight: number = 20
): { start: { x: number; y: number }; end: { x: number; y: number }; controlPoints: { x: number; y: number }[] } {
  // Source port on right side of card
  const startX = sourceCard.x + sourceCard.width;
  const startY = sourceCard.y + portHeight * (sourcePortIndex + 0.5);
  
  // Target port on left side of card
  const endX = targetCard.x;
  const endY = targetCard.y + portHeight * (targetPortIndex + 0.5);
  
  // Bezier control points for smooth curve
  const controlPoints = [
    { x: startX + 50, y: startY },
    { x: endX - 50, y: endY },
  ];
  
  return {
    start: { x: startX, y: startY },
    end: { x: endX, y: endY },
    controlPoints,
  };
}

/**
 * Generate SVG path for a cable connection.
 */
export function generateCableSVGPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  controlPoints: { x: number; y: number }[]
): string {
  if (controlPoints.length === 2) {
    // Cubic bezier
    return `M${start.x},${start.y} C${controlPoints[0]!.x},${controlPoints[0]!.y} ${controlPoints[1]!.x},${controlPoints[1]!.y} ${end.x},${end.y}`;
  }
  // Straight line fallback
  return `M${start.x},${start.y} L${end.x},${end.y}`;
}

/**
 * Select cards within a rectangle.
 */
export function selectCardsInRect(
  state: CardLayoutState,
  rect: { x: number; y: number; width: number; height: number },
  addToSelection: boolean = false
): CardLayoutState {
  const newSelectedCards = addToSelection 
    ? new Set(state.selectedCards) 
    : new Set<string>();
  
  for (const [cardId, card] of Array.from(state.cards)) {
    // Check if card overlaps with selection rect
    const overlaps = 
      card.x < rect.x + rect.width &&
      card.x + card.width > rect.x &&
      card.y < rect.y + rect.height &&
      card.y + card.height > rect.y;
    
    if (overlaps) {
      newSelectedCards.add(cardId);
    }
  }
  
  return { ...state, selectedCards: newSelectedCards };
}

/**
 * Bring card to front.
 */
export function bringCardToFront(state: CardLayoutState, cardId: string): CardLayoutState {
  const card = state.cards.get(cardId);
  if (!card) return state;
  
  // Find max z-index
  const maxZ = Math.max(...Array.from(state.cards.values()).map(c => c.zIndex));
  
  const newCards = new Map(state.cards);
  newCards.set(cardId, { ...card, zIndex: maxZ + 1 });
  
  return { ...state, cards: newCards };
}

/**
 * Align selected cards.
 */
export function alignSelectedCards(
  state: CardLayoutState,
  alignment: 'left' | 'right' | 'top' | 'bottom' | 'centerH' | 'centerV'
): CardLayoutState {
  if (state.selectedCards.size < 2) return state;
  
  const selectedCards = Array.from(state.selectedCards).map(id => state.cards.get(id)!).filter(Boolean);
  const newCards = new Map(state.cards);
  
  let targetValue: number;
  
  switch (alignment) {
    case 'left':
      targetValue = Math.min(...selectedCards.map(c => c.x));
      for (const card of selectedCards) {
        if (!card.locked) newCards.set(card.cardId, { ...card, x: targetValue });
      }
      break;
    case 'right':
      targetValue = Math.max(...selectedCards.map(c => c.x + c.width));
      for (const card of selectedCards) {
        if (!card.locked) newCards.set(card.cardId, { ...card, x: targetValue - card.width });
      }
      break;
    case 'top':
      targetValue = Math.min(...selectedCards.map(c => c.y));
      for (const card of selectedCards) {
        if (!card.locked) newCards.set(card.cardId, { ...card, y: targetValue });
      }
      break;
    case 'bottom':
      targetValue = Math.max(...selectedCards.map(c => c.y + c.height));
      for (const card of selectedCards) {
        if (!card.locked) newCards.set(card.cardId, { ...card, y: targetValue - card.height });
      }
      break;
    case 'centerH':
      targetValue = selectedCards.reduce((sum, c) => sum + c.x + c.width / 2, 0) / selectedCards.length;
      for (const card of selectedCards) {
        if (!card.locked) newCards.set(card.cardId, { ...card, x: targetValue - card.width / 2 });
      }
      break;
    case 'centerV':
      targetValue = selectedCards.reduce((sum, c) => sum + c.y + c.height / 2, 0) / selectedCards.length;
      for (const card of selectedCards) {
        if (!card.locked) newCards.set(card.cardId, { ...card, y: targetValue - card.height / 2 });
      }
      break;
  }
  
  return { ...state, cards: newCards };
}

/**
 * Distribute selected cards evenly.
 */
export function distributeSelectedCards(
  state: CardLayoutState,
  direction: 'horizontal' | 'vertical'
): CardLayoutState {
  if (state.selectedCards.size < 3) return state;
  
  const selectedCards = Array.from(state.selectedCards)
    .map(id => state.cards.get(id)!)
    .filter(Boolean)
    .sort((a, b) => direction === 'horizontal' ? a.x - b.x : a.y - b.y);
  
  const newCards = new Map(state.cards);
  
  if (direction === 'horizontal') {
    const minX = selectedCards[0]!.x;
    const maxX = selectedCards[selectedCards.length - 1]!.x;
    const totalWidth = selectedCards.reduce((sum, c) => sum + c.width, 0);
    const spacing = (maxX - minX + selectedCards[selectedCards.length - 1]!.width - totalWidth) / (selectedCards.length - 1);
    
    let x = minX;
    for (const card of selectedCards) {
      if (!card.locked) newCards.set(card.cardId, { ...card, x });
      x += card.width + spacing;
    }
  } else {
    const minY = selectedCards[0]!.y;
    const maxY = selectedCards[selectedCards.length - 1]!.y;
    const totalHeight = selectedCards.reduce((sum, c) => sum + c.height, 0);
    const spacing = (maxY - minY + selectedCards[selectedCards.length - 1]!.height - totalHeight) / (selectedCards.length - 1);
    
    let y = minY;
    for (const card of selectedCards) {
      if (!card.locked) newCards.set(card.cardId, { ...card, y });
      y += card.height + spacing;
    }
  }
  
  return { ...state, cards: newCards };
}
