/**
 * @fileoverview Layout Adapter
 *
 * Maps Board.layout to BoardLayoutRuntime.
 *
 * B093-B095: Implement layout runtime creation and merging.
 *
 * @module @cardplay/boards/layout/adapter
 */

import type { Board, BoardLayout } from '../types';
import type {
  BoardLayoutRuntime,
  DockNodeRuntime,
  PanelRuntime,
} from './runtime-types';

// ============================================================================
// DEFAULT LAYOUT RUNTIME
// ============================================================================

/**
 * Creates default layout runtime from board definition.
 *
 * B094: Stable initial layout implementation.
 *
 * @param board Board definition
 * @returns Default layout runtime
 */
export function createDefaultLayoutRuntime(board: Board): BoardLayoutRuntime {
  const layout = board.layout;
  const panels = new Map<string, PanelRuntime>();

  // Create panel runtimes from layout definition
  layout.panels.forEach(panelDef => {
    const panelRuntime: PanelRuntime = {
      id: panelDef.id,
      position: panelDef.position,
      size: panelDef.defaultWidth ? `${panelDef.defaultWidth}px` : '300px',
      collapsed: false,
      activeTabId: null, // Will be set when decks are rendered
      tabOrder: [],
      scrollTop: 0,
      scrollLeft: 0,
      visible: true,
    };
    panels.set(panelDef.id, panelRuntime);
  });

  // Build dock tree (simple flat structure for now)
  // TODO: Parse layout.orientation and create proper splits
  const root = createSimpleDockTree(layout, panels);

  return {
    root,
    panels,
    timestamp: Date.now(),
  };
}

/**
 * Creates a simple dock tree from layout panels.
 * 
 * B121: Handles top/bottom panels and multiple panels per side.
 * Panels are ordered according to their position in layout.panels.
 */
function createSimpleDockTree(
  layout: BoardLayout,
  panels: Map<string, PanelRuntime>
): DockNodeRuntime {
  // Group panels by position, preserving order from layout.panels
  const topPanels = layout.panels.filter(p => p.position === 'top');
  const bottomPanels = layout.panels.filter(p => p.position === 'bottom');
  const leftPanels = layout.panels.filter(p => p.position === 'left');
  const rightPanels = layout.panels.filter(p => p.position === 'right');
  const centerPanels = layout.panels.filter(p => p.position === 'center');

  // Helper to create a vertical stack of panels
  const createStack = (panelDefs: typeof layout.panels): DockNodeRuntime | null => {
    const children: DockNodeRuntime[] = [];
    for (const def of panelDefs) {
      const panel = panels.get(def.id);
      if (panel) {
        children.push(panel);
      }
    }
    if (children.length === 0) return null;
    if (children.length === 1) return children[0]!;
    return {
      type: 'split-vertical' as const,
      children,
      ratio: 1 / children.length,
    };
  };

  // Build main horizontal row: left | center | right
  const horizontalChildren: DockNodeRuntime[] = [];
  
  // Left panel stack
  const leftStack = createStack(leftPanels);
  if (leftStack) horizontalChildren.push(leftStack);
  
  // Center panel stack (always include at least one)
  const centerStack = createStack(centerPanels);
  if (centerStack) {
    horizontalChildren.push(centerStack);
  } else {
    // If no center panels, create a placeholder
    const defaultPanel = panels.values().next().value;
    if (defaultPanel) {
      horizontalChildren.push(defaultPanel);
    }
  }
  
  // Right panel stack
  const rightStack = createStack(rightPanels);
  if (rightStack) horizontalChildren.push(rightStack);

  // Create horizontal split for left/center/right
  let mainRow: DockNodeRuntime;
  if (horizontalChildren.length === 1) {
    mainRow = horizontalChildren[0]!;
  } else if (horizontalChildren.length === 0) {
    // Fallback: create minimal panel
    mainRow = {
      id: 'default',
      position: 'center',
      size: '100%',
      collapsed: false,
      activeTabId: null,
      tabOrder: [],
      scrollTop: 0,
      scrollLeft: 0,
      visible: true,
    };
  } else {
    mainRow = {
      type: 'split-horizontal' as const,
      children: horizontalChildren,
      ratio: 0.5,
    };
  }

  // B121: Handle top/bottom panels by wrapping main row in vertical splits
  const verticalChildren: DockNodeRuntime[] = [];
  
  // Top panels
  const topStack = createStack(topPanels);
  if (topStack) verticalChildren.push(topStack);
  
  // Main content (left | center | right)
  verticalChildren.push(mainRow);
  
  // Bottom panels
  const bottomStack = createStack(bottomPanels);
  if (bottomStack) verticalChildren.push(bottomStack);

  // Wrap in vertical split if top or bottom panels exist
  if (verticalChildren.length === 1) {
    return verticalChildren[0]!;
  }

  return {
    type: 'split-vertical',
    children: verticalChildren,
    ratio: 0.5,
  };
}

// ============================================================================
// MERGE PERSISTED LAYOUT
// ============================================================================

/**
 * Merges persisted layout state with board defaults.
 *
 * B095: Apply safe overrides from persisted state.
 *
 * @param board Board definition
 * @param persisted Persisted layout runtime (from storage)
 * @returns Merged layout runtime
 */
export function mergePersistedLayout(
  board: Board,
  persisted: BoardLayoutRuntime
): BoardLayoutRuntime {
  // Start with default layout
  const defaultLayout = createDefaultLayoutRuntime(board);

  // Merge persisted panel states
  const panels = new Map(defaultLayout.panels);

  persisted.panels.forEach((persistedPanel, panelId) => {
    const defaultPanel = panels.get(panelId);
    if (defaultPanel) {
      // Merge panel state (safe overrides)
      panels.set(panelId, {
        ...defaultPanel,
        size: persistedPanel.size,
        collapsed: persistedPanel.collapsed,
        activeTabId: persistedPanel.activeTabId,
        tabOrder: persistedPanel.tabOrder,
        scrollTop: persistedPanel.scrollTop,
        scrollLeft: persistedPanel.scrollLeft,
        visible: persistedPanel.visible,
      });
    }
  });

  // Use persisted root if compatible, otherwise use default
  // (MVP: just use default root, panels will have persisted state)
  return {
    root: defaultLayout.root,
    panels,
    timestamp: Date.now(),
  };
}

/**
 * Resets a panel to its default state.
 */
export function resetPanelState(
  board: Board,
  panelId: string
): PanelRuntime | null {
  const panelDef = board.layout.panels.find(p => p.id === panelId);
  if (!panelDef) {
    return null;
  }

  return {
    id: panelDef.id,
    position: panelDef.position,
    size: panelDef.defaultWidth ? `${panelDef.defaultWidth}px` : '300px',
    collapsed: false,
    activeTabId: null,
    tabOrder: [],
    scrollTop: 0,
    scrollLeft: 0,
    visible: true,
  };
}
