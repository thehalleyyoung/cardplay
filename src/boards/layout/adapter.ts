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
  SplitNodeRuntime,
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
 * (MVP: left-center-right split)
 */
function createSimpleDockTree(
  layout: BoardLayout,
  panels: Map<string, PanelRuntime>
): DockNodeRuntime {
  const leftPanels = layout.panels.filter(p => p.position === 'left');
  const rightPanels = layout.panels.filter(p => p.position === 'right');
  const centerPanels = layout.panels.filter(p => p.position === 'center');

  // For MVP, create a simple 3-column layout: left | center | right

  const children: DockNodeRuntime[] = [];

  // Add left panels
  if (leftPanels.length > 0) {
    const leftPanel = panels.get(leftPanels[0]!.id);
    if (leftPanel) {
      children.push(leftPanel);
    }
  }

  // Add center panels
  if (centerPanels.length > 0) {
    const centerPanel = panels.get(centerPanels[0]!.id);
    if (centerPanel) {
      children.push(centerPanel);
    }
  }

  // Add right panels
  if (rightPanels.length > 0) {
    const rightPanel = panels.get(rightPanels[0]!.id);
    if (rightPanel) {
      children.push(rightPanel);
    }
  }

  // If only one child, return it directly
  if (children.length === 1) {
    return children[0]!;
  }

  // If no children, return a default center panel
  if (children.length === 0) {
    // Find or create a default panel
    const defaultPanel = panels.values().next().value;
    if (defaultPanel) {
      return defaultPanel;
    }
    // Last resort: create a minimal panel
    return {
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
  }

  // Create horizontal split
  const root: SplitNodeRuntime = {
    type: 'split-horizontal',
    children,
    ratio: 0.5,
  };

  return root;
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
