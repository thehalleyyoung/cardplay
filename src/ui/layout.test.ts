/**
 * @fileoverview Tests for Layout System.
 */

import { describe, it, expect } from 'vitest';
import {
  // Panel
  DEFAULT_PANEL_CONSTRAINTS,
  DEFAULT_PANEL_STATE,
  clampPanelSize,
  calculateResizeDelta,
  
  // Split Pane
  DEFAULT_SPLIT_PANE_STATE,
  calculateSplitPaneSizes,
  handleSplitPaneDrag,
  
  // Dock Layout
  createDockLayoutState,
  addDockPanel,
  removeDockPanel,
  
  // Tab Panel
  createTabPanelState,
  addTab,
  removeTab,
  reorderTabs,
  
  // Floating Panel
  DEFAULT_FLOATING_PANEL,
  createFloatingPanelManager,
  bringToFront,
  moveFloatingPanel,
  resizeFloatingPanel,
  
  // Sidebar
  DEFAULT_SIDEBAR_STATE,
  toggleSidebar,
  getSidebarWidth,
  
  // Toolbar
  toolbarButton,
  toolbarToggle,
  toolbarSeparator,
  toolbarSpacer,
  
  // Scroll Area
  getScrollBarVisibility,
  getScrollBarThumbSize,
  getScrollBarThumbPosition,
  
  // Grid
  DEFAULT_GRID_STATE,
  calculateGridItemBounds,
  
  // Layout Persistence
  LAYOUT_SCHEMA_VERSION,
  serializeLayout,
  deserializeLayout,
  
  // Breakpoints
  DEFAULT_BREAKPOINTS,
  getCurrentBreakpoint,
  matchesBreakpoint,
  
  // Focus Navigation
  findNextFocusable,
} from './layout';

// ============================================================================
// PANEL TESTS
// ============================================================================

describe('Panel', () => {
  describe('DEFAULT_PANEL_CONSTRAINTS', () => {
    it('should have valid defaults', () => {
      expect(DEFAULT_PANEL_CONSTRAINTS.minWidth).toBe(100);
      expect(DEFAULT_PANEL_CONSTRAINTS.maxWidth).toBe(Infinity);
    });
  });

  describe('clampPanelSize', () => {
    it('should clamp to minimum', () => {
      const result = clampPanelSize(50, 50, DEFAULT_PANEL_CONSTRAINTS);
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it('should clamp to maximum', () => {
      const constraints = { ...DEFAULT_PANEL_CONSTRAINTS, maxWidth: 200, maxHeight: 200 };
      const result = clampPanelSize(300, 300, constraints);
      expect(result.width).toBe(200);
      expect(result.height).toBe(200);
    });

    it('should not clamp values within range', () => {
      const result = clampPanelSize(150, 150, DEFAULT_PANEL_CONSTRAINTS);
      expect(result.width).toBe(150);
      expect(result.height).toBe(150);
    });
  });

  describe('calculateResizeDelta', () => {
    it('should calculate east resize', () => {
      const delta = calculateResizeDelta(0, 0, 10, 0, 'e');
      expect(delta.deltaWidth).toBe(10);
      expect(delta.deltaHeight).toBe(0);
      expect(delta.deltaX).toBe(0);
    });

    it('should calculate west resize', () => {
      const delta = calculateResizeDelta(0, 0, -10, 0, 'w');
      expect(delta.deltaWidth).toBe(10);
      expect(delta.deltaX).toBe(-10);
    });

    it('should calculate south resize', () => {
      const delta = calculateResizeDelta(0, 0, 0, 20, 's');
      expect(delta.deltaHeight).toBe(20);
    });

    it('should calculate corner resize', () => {
      const delta = calculateResizeDelta(0, 0, 10, 10, 'se');
      expect(delta.deltaWidth).toBe(10);
      expect(delta.deltaHeight).toBe(10);
    });
  });
});

// ============================================================================
// SPLIT PANE TESTS
// ============================================================================

describe('Split Pane', () => {
  describe('calculateSplitPaneSizes', () => {
    it('should calculate sizes for uncollapsed pane', () => {
      const sizes = calculateSplitPaneSizes(600, DEFAULT_SPLIT_PANE_STATE);
      expect(sizes.primary).toBe(250);
      expect(sizes.secondary).toBe(600 - 250 - 4);
    });

    it('should calculate sizes for collapsed pane', () => {
      const state = { ...DEFAULT_SPLIT_PANE_STATE, collapsed: true };
      const sizes = calculateSplitPaneSizes(600, state);
      expect(sizes.primary).toBe(0);
    });

    it('should respect min size', () => {
      const state = { ...DEFAULT_SPLIT_PANE_STATE, primarySize: 50 };
      const sizes = calculateSplitPaneSizes(600, state);
      expect(sizes.primary).toBe(100); // minSize
    });
  });

  describe('handleSplitPaneDrag', () => {
    it('should update size on drag', () => {
      const newState = handleSplitPaneDrag(DEFAULT_SPLIT_PANE_STATE, 50, 600);
      expect(newState.primarySize).toBe(300);
    });

    it('should clamp to min size', () => {
      const newState = handleSplitPaneDrag(DEFAULT_SPLIT_PANE_STATE, -200, 600);
      expect(newState.primarySize).toBe(100);
    });

    it('should clamp to max size', () => {
      const newState = handleSplitPaneDrag(DEFAULT_SPLIT_PANE_STATE, 300, 600);
      // Max is clamped by both primaryMaxSize (500) and secondary min (100)
      // containerSize=600, secondaryMinSize=100, gutterSize=4
      // maxAllowed = 600 - 100 - 4 = 496
      expect(newState.primarySize).toBe(496);
    });
  });
});

// ============================================================================
// DOCK LAYOUT TESTS
// ============================================================================

describe('Dock Layout', () => {
  describe('createDockLayoutState', () => {
    it('should create empty state', () => {
      const state = createDockLayoutState();
      expect(state.root).toBeNull();
      expect(state.panels.size).toBe(0);
    });
  });

  describe('addDockPanel', () => {
    it('should add first panel', () => {
      const state = createDockLayoutState();
      const panel = { id: 'p1', title: 'Panel 1', content: '', closable: true };
      
      const newState = addDockPanel(state, panel, 'center');
      
      expect(newState.panels.get('p1')).toBeDefined();
      expect(newState.root).not.toBeNull();
    });

    it('should add panel to left', () => {
      let state = createDockLayoutState();
      const panel1 = { id: 'p1', title: 'Panel 1', content: '', closable: true };
      const panel2 = { id: 'p2', title: 'Panel 2', content: '', closable: true };
      
      state = addDockPanel(state, panel1, 'center');
      state = addDockPanel(state, panel2, 'left');
      
      expect(state.panels.size).toBe(2);
      expect(state.root?.type).toBe('split');
    });
  });

  describe('removeDockPanel', () => {
    it('should remove panel', () => {
      let state = createDockLayoutState();
      const panel = { id: 'p1', title: 'Panel 1', content: '', closable: true };
      
      state = addDockPanel(state, panel, 'center');
      state = removeDockPanel(state, 'p1');
      
      expect(state.panels.size).toBe(0);
      expect(state.root).toBeNull();
    });
  });
});

// ============================================================================
// TAB PANEL TESTS
// ============================================================================

describe('Tab Panel', () => {
  describe('createTabPanelState', () => {
    it('should create empty state', () => {
      const state = createTabPanelState();
      expect(state.tabs).toEqual([]);
      expect(state.activeTab).toBe('');
    });

    it('should activate first tab', () => {
      const tabs = [
        { id: 't1', title: 'Tab 1', closable: true },
        { id: 't2', title: 'Tab 2', closable: true },
      ];
      const state = createTabPanelState(tabs);
      expect(state.activeTab).toBe('t1');
    });
  });

  describe('addTab', () => {
    it('should add tab and activate it', () => {
      const state = createTabPanelState();
      const tab = { id: 't1', title: 'Tab 1', closable: true };
      
      const newState = addTab(state, tab);
      
      expect(newState.tabs.length).toBe(1);
      expect(newState.activeTab).toBe('t1');
    });

    it('should add tab at specific index', () => {
      const tabs = [
        { id: 't1', title: 'Tab 1', closable: true },
        { id: 't3', title: 'Tab 3', closable: true },
      ];
      const state = createTabPanelState(tabs);
      const tab = { id: 't2', title: 'Tab 2', closable: true };
      
      const newState = addTab(state, tab, 1);
      
      expect(newState.tabs[1]!.id).toBe('t2');
    });
  });

  describe('removeTab', () => {
    it('should remove tab', () => {
      const tabs = [
        { id: 't1', title: 'Tab 1', closable: true },
        { id: 't2', title: 'Tab 2', closable: true },
      ];
      let state = createTabPanelState(tabs);
      
      state = removeTab(state, 't1');
      
      expect(state.tabs.length).toBe(1);
    });

    it('should activate adjacent tab when active is removed', () => {
      const tabs = [
        { id: 't1', title: 'Tab 1', closable: true },
        { id: 't2', title: 'Tab 2', closable: true },
      ];
      let state = createTabPanelState(tabs);
      
      state = removeTab(state, 't1');
      
      expect(state.activeTab).toBe('t2');
    });
  });

  describe('reorderTabs', () => {
    it('should reorder tabs', () => {
      const tabs = [
        { id: 't1', title: 'Tab 1', closable: true },
        { id: 't2', title: 'Tab 2', closable: true },
        { id: 't3', title: 'Tab 3', closable: true },
      ];
      const state = createTabPanelState(tabs);
      
      const newState = reorderTabs(state, 0, 2);
      
      expect(newState.tabs[2]!.id).toBe('t1');
    });
  });
});

// ============================================================================
// FLOATING PANEL TESTS
// ============================================================================

describe('Floating Panel', () => {
  describe('createFloatingPanelManager', () => {
    it('should create empty manager', () => {
      const manager = createFloatingPanelManager();
      expect(manager.panels.size).toBe(0);
      expect(manager.nextZIndex).toBe(1000);
    });
  });

  describe('bringToFront', () => {
    it('should update z-index', () => {
      let manager = createFloatingPanelManager();
      const panel = { ...DEFAULT_FLOATING_PANEL, id: 'p1', title: 'Panel 1' };
      manager.panels.set('p1', panel);
      
      manager = bringToFront(manager, 'p1');
      
      expect(manager.panels.get('p1')?.zIndex).toBe(1000);
      expect(manager.nextZIndex).toBe(1001);
    });
  });

  describe('moveFloatingPanel', () => {
    it('should update position', () => {
      let manager = createFloatingPanelManager();
      const panel = { ...DEFAULT_FLOATING_PANEL, id: 'p1', title: 'Panel 1' };
      manager.panels.set('p1', panel);
      
      manager = moveFloatingPanel(manager, 'p1', 200, 150);
      
      expect(manager.panels.get('p1')?.x).toBe(200);
      expect(manager.panels.get('p1')?.y).toBe(150);
    });
  });

  describe('resizeFloatingPanel', () => {
    it('should update size', () => {
      let manager = createFloatingPanelManager();
      const panel = { ...DEFAULT_FLOATING_PANEL, id: 'p1', title: 'Panel 1' };
      manager.panels.set('p1', panel);
      
      manager = resizeFloatingPanel(manager, 'p1', 400, 300);
      
      expect(manager.panels.get('p1')?.width).toBe(400);
      expect(manager.panels.get('p1')?.height).toBe(300);
    });

    it('should respect minimum size', () => {
      let manager = createFloatingPanelManager();
      const panel = { ...DEFAULT_FLOATING_PANEL, id: 'p1', title: 'Panel 1', minWidth: 150 };
      manager.panels.set('p1', panel);
      
      manager = resizeFloatingPanel(manager, 'p1', 50, 50);
      
      expect(manager.panels.get('p1')?.width).toBe(150);
    });
  });
});

// ============================================================================
// SIDEBAR TESTS
// ============================================================================

describe('Sidebar', () => {
  describe('toggleSidebar', () => {
    it('should toggle collapsed state', () => {
      let state = DEFAULT_SIDEBAR_STATE;
      
      state = toggleSidebar(state);
      expect(state.collapsed).toBe(true);
      
      state = toggleSidebar(state);
      expect(state.collapsed).toBe(false);
    });
  });

  describe('getSidebarWidth', () => {
    it('should return full width when expanded', () => {
      expect(getSidebarWidth(DEFAULT_SIDEBAR_STATE)).toBe(240);
    });

    it('should return collapsed width when collapsed', () => {
      const state = { ...DEFAULT_SIDEBAR_STATE, collapsed: true };
      expect(getSidebarWidth(state)).toBe(48);
    });
  });
});

// ============================================================================
// TOOLBAR TESTS
// ============================================================================

describe('Toolbar', () => {
  it('should create button', () => {
    const btn = toolbarButton('save', 'save', 'Save file');
    expect(btn.type).toBe('button');
    expect(btn.icon).toBe('save');
  });

  it('should create toggle', () => {
    const toggle = toolbarToggle('bold', 'bold', 'Bold', true);
    expect(toggle.type).toBe('toggle');
    expect(toggle.pressed).toBe(true);
  });

  it('should create separator', () => {
    const sep = toolbarSeparator();
    expect(sep.type).toBe('separator');
  });

  it('should create spacer', () => {
    const spacer = toolbarSpacer();
    expect(spacer.type).toBe('spacer');
  });
});

// ============================================================================
// SCROLL AREA TESTS
// ============================================================================

describe('Scroll Area', () => {
  describe('getScrollBarVisibility', () => {
    it('should show vertical scrollbar when content is taller', () => {
      const state = {
        scrollTop: 0,
        scrollLeft: 0,
        scrollHeight: 1000,
        scrollWidth: 400,
        clientHeight: 400,
        clientWidth: 400,
      };
      
      const visibility = getScrollBarVisibility(state);
      
      expect(visibility.vertical).toBe(true);
      expect(visibility.horizontal).toBe(false);
    });
  });

  describe('getScrollBarThumbSize', () => {
    it('should calculate thumb size based on ratio', () => {
      const size = getScrollBarThumbSize(200, 1000, 200);
      expect(size).toBeCloseTo(40);
    });

    it('should respect minimum thumb size', () => {
      const size = getScrollBarThumbSize(10, 1000, 200, 30);
      expect(size).toBe(30);
    });

    it('should return 0 when no scroll needed', () => {
      const size = getScrollBarThumbSize(400, 200, 400);
      expect(size).toBe(0);
    });
  });

  describe('getScrollBarThumbPosition', () => {
    it('should calculate position at start', () => {
      const pos = getScrollBarThumbPosition(0, 200, 1000, 200, 40);
      expect(pos).toBe(0);
    });

    it('should calculate position at end', () => {
      const pos = getScrollBarThumbPosition(800, 200, 1000, 200, 40);
      expect(pos).toBe(160);
    });
  });
});

// ============================================================================
// GRID TESTS
// ============================================================================

describe('Grid', () => {
  describe('calculateGridItemBounds', () => {
    it('should calculate single cell bounds', () => {
      const item = { id: 'item1', column: 0, row: 0, columnSpan: 1, rowSpan: 1 };
      const bounds = calculateGridItemBounds(item, 400, 200, 4, 2, 8);
      
      expect(bounds.x).toBe(0);
      expect(bounds.y).toBe(0);
      expect(bounds.width).toBe(94); // (400 - 3*8) / 4
    });

    it('should calculate multi-cell bounds', () => {
      const item = { id: 'item1', column: 0, row: 0, columnSpan: 2, rowSpan: 1 };
      const bounds = calculateGridItemBounds(item, 400, 200, 4, 2, 8);
      
      // Width = 2 cells + 1 gap
      expect(bounds.width).toBe(94 * 2 + 8);
    });
  });
});

// ============================================================================
// LAYOUT PERSISTENCE TESTS
// ============================================================================

describe('Layout Persistence', () => {
  describe('serializeLayout', () => {
    it('should serialize layout to JSON', () => {
      const json = serializeLayout([], DEFAULT_SIDEBAR_STATE, {});
      const parsed = JSON.parse(json);
      
      expect(parsed.version).toBe(LAYOUT_SCHEMA_VERSION);
      expect(parsed.timestamp).toBeDefined();
    });
  });

  describe('deserializeLayout', () => {
    it('should deserialize valid JSON', () => {
      const json = serializeLayout([], DEFAULT_SIDEBAR_STATE, {});
      const layout = deserializeLayout(json);
      
      expect(layout).not.toBeNull();
      expect(layout?.sidebar).toEqual(DEFAULT_SIDEBAR_STATE);
    });

    it('should return null for invalid JSON', () => {
      const layout = deserializeLayout('invalid');
      expect(layout).toBeNull();
    });

    it('should return null for wrong version', () => {
      const json = JSON.stringify({ version: 999, panels: [], sidebar: {}, splitPanes: {} });
      const layout = deserializeLayout(json);
      expect(layout).toBeNull();
    });
  });
});

// ============================================================================
// BREAKPOINTS TESTS
// ============================================================================

describe('Breakpoints', () => {
  describe('getCurrentBreakpoint', () => {
    it('should return xs for small screens', () => {
      expect(getCurrentBreakpoint(320)).toBe('xs');
    });

    it('should return md for medium screens', () => {
      expect(getCurrentBreakpoint(800)).toBe('md');
    });

    it('should return xxl for large screens', () => {
      expect(getCurrentBreakpoint(1500)).toBe('xxl');
    });
  });

  describe('matchesBreakpoint', () => {
    it('should match larger breakpoints', () => {
      expect(matchesBreakpoint(1000, 'md')).toBe(true);
      expect(matchesBreakpoint(1000, 'lg')).toBe(true);
    });

    it('should not match smaller than width', () => {
      expect(matchesBreakpoint(500, 'lg')).toBe(false);
    });
  });
});

// ============================================================================
// FOCUS NAVIGATION TESTS
// ============================================================================

describe('Focus Navigation', () => {
  describe('findNextFocusable', () => {
    const elements = [
      { id: 'a', x: 0, y: 0, width: 100, height: 50 },
      { id: 'b', x: 100, y: 0, width: 100, height: 50 },
      { id: 'c', x: 0, y: 50, width: 100, height: 50 },
      { id: 'd', x: 100, y: 50, width: 100, height: 50 },
    ];

    it('should find next element', () => {
      expect(findNextFocusable(elements, 'a', 'next')).toBe('b');
    });

    it('should wrap around on next', () => {
      expect(findNextFocusable(elements, 'd', 'next')).toBe('a');
    });

    it('should find previous element', () => {
      expect(findNextFocusable(elements, 'b', 'prev')).toBe('a');
    });

    it('should find element to the right', () => {
      expect(findNextFocusable(elements, 'a', 'right')).toBe('b');
    });

    it('should find element below', () => {
      expect(findNextFocusable(elements, 'a', 'down')).toBe('c');
    });

    it('should return null when no element in direction', () => {
      expect(findNextFocusable(elements, 'a', 'up')).toBeNull();
    });
  });
});

// ============================================================================
// DEFAULTS TESTS
// ============================================================================

describe('Defaults', () => {
  it('should have valid DEFAULT_PANEL_STATE', () => {
    expect(DEFAULT_PANEL_STATE.width).toBe(300);
    expect(DEFAULT_PANEL_STATE.resizable).toBe(true);
  });

  it('should have valid DEFAULT_SPLIT_PANE_STATE', () => {
    expect(DEFAULT_SPLIT_PANE_STATE.gutterSize).toBe(4);
  });

  it('should have valid DEFAULT_FLOATING_PANEL', () => {
    expect(DEFAULT_FLOATING_PANEL.zIndex).toBe(1000);
  });

  it('should have valid DEFAULT_SIDEBAR_STATE', () => {
    expect(DEFAULT_SIDEBAR_STATE.collapsedWidth).toBe(48);
  });

  it('should have valid DEFAULT_GRID_STATE', () => {
    expect(DEFAULT_GRID_STATE.columns).toBe(12);
  });

  it('should have valid DEFAULT_BREAKPOINTS', () => {
    expect(DEFAULT_BREAKPOINTS.md).toBe(768);
  });
});
