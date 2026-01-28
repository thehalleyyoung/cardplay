/**
 * @fileoverview Tests for Card UI Components.
 */

import { describe, it, expect } from 'vitest';
import {
  // Card Surface
  DEFAULT_CARD_SURFACE_CONFIG,
  CARD_SIZE_PRESETS,
  getCardDimensions,
  createCardSurfaceState,
  moveCard,
  resizeCard,
  startDrag,
  endDrag,
  startResize,
  endResize,
  toggleMinimize,
  toggleMaximize,
  setCardState,
  
  // Card Header
  DEFAULT_CARD_HEADER_CONFIG,
  createCardHeaderState,
  startTitleEdit,
  updateDraftTitle,
  confirmTitleEdit,
  cancelTitleEdit,
  toggleCardMenu,
  
  // Card Toolbar
  DEFAULT_CARD_TOOLBAR_CONFIG,
  createToolbarButton,
  toggleToolbarButton,
  selectToolbarOption,
  
  // Card Content
  DEFAULT_CARD_CONTENT_CONFIG,
  createContentScrollState,
  updateScroll,
  isScrollable,
  
  // Card Ports
  PORT_TYPE_COLORS,
  getPortColor,
  createCardPortState,
  addPortConnection,
  removePortConnection,
  arePortsCompatible,
  getPortScreenPosition,
  
  // Connections
  DEFAULT_CONNECTION_CONFIG,
  createConnectionState,
  generateCablePoints,
  generateCablePath,
  
  // Card Preview
  DEFAULT_CARD_PREVIEW_CONFIG,
  
  // Card Badge
  BADGE_TYPE_COLORS,
  getBadgeColor,
  
  // Card Menu
  createMenuItem,
  createMenuSeparator,
  createCardMenuState,
  openMenu,
  closeMenu,
  
  // Card Stack
  DEFAULT_CARD_STACK_CONFIG,
  createCardStackState,
  addToStack,
  removeFromStack,
  setActiveCard,
  reorderStack,
  
  // Card Search
  DEFAULT_CARD_SEARCH_CONFIG,
  createCardSearchState,
  updateSearchQuery,
  setSearchResults,
  clearSearch,
  
  // Card Category
  DEFAULT_CARD_CATEGORIES,
  matchesCategory,
  getCategoryForType,
  
  // Card Focus
  createCardFocusState,
  focusCard,
  focusElement,
  trapFocus,
  releaseFocusTrap,
} from './cards';

// ============================================================================
// CARD SURFACE TESTS
// ============================================================================

describe('Card Surface', () => {
  describe('DEFAULT_CARD_SURFACE_CONFIG', () => {
    it('should have valid defaults', () => {
      expect(DEFAULT_CARD_SURFACE_CONFIG.size).toBe('medium');
      expect(DEFAULT_CARD_SURFACE_CONFIG.resizable).toBe(true);
      expect(DEFAULT_CARD_SURFACE_CONFIG.draggable).toBe(true);
    });
  });

  describe('CARD_SIZE_PRESETS', () => {
    it('should have all size presets', () => {
      expect(CARD_SIZE_PRESETS.small).toEqual({ width: 160, height: 120 });
      expect(CARD_SIZE_PRESETS.medium).toEqual({ width: 280, height: 200 });
      expect(CARD_SIZE_PRESETS.large).toEqual({ width: 400, height: 300 });
    });
  });

  describe('getCardDimensions', () => {
    it('should return preset dimensions', () => {
      const dims = getCardDimensions(DEFAULT_CARD_SURFACE_CONFIG);
      expect(dims).toEqual(CARD_SIZE_PRESETS.medium);
    });

    it('should return custom dimensions', () => {
      const config = { ...DEFAULT_CARD_SURFACE_CONFIG, size: 'custom' as const, width: 500, height: 400 };
      const dims = getCardDimensions(config);
      expect(dims).toEqual({ width: 500, height: 400 });
    });
  });

  describe('createCardSurfaceState', () => {
    it('should create initial state', () => {
      const state = createCardSurfaceState(DEFAULT_CARD_SURFACE_CONFIG);
      
      expect(state.state).toBe('normal');
      expect(state.x).toBe(0);
      expect(state.y).toBe(0);
      expect(state.width).toBe(280);
      expect(state.height).toBe(200);
      expect(state.minimized).toBe(false);
      expect(state.maximized).toBe(false);
    });

    it('should accept initial position', () => {
      const state = createCardSurfaceState(DEFAULT_CARD_SURFACE_CONFIG, 100, 200);
      expect(state.x).toBe(100);
      expect(state.y).toBe(200);
    });
  });

  describe('moveCard', () => {
    it('should update position', () => {
      let state = createCardSurfaceState(DEFAULT_CARD_SURFACE_CONFIG);
      state = moveCard(state, 150, 250);
      
      expect(state.x).toBe(150);
      expect(state.y).toBe(250);
    });
  });

  describe('resizeCard', () => {
    it('should update dimensions', () => {
      let state = createCardSurfaceState(DEFAULT_CARD_SURFACE_CONFIG);
      state = resizeCard(state, 400, 300, DEFAULT_CARD_SURFACE_CONFIG);
      
      expect(state.width).toBe(400);
      expect(state.height).toBe(300);
    });

    it('should clamp to min dimensions', () => {
      let state = createCardSurfaceState(DEFAULT_CARD_SURFACE_CONFIG);
      state = resizeCard(state, 50, 30, DEFAULT_CARD_SURFACE_CONFIG);
      
      expect(state.width).toBe(DEFAULT_CARD_SURFACE_CONFIG.minWidth);
      expect(state.height).toBe(DEFAULT_CARD_SURFACE_CONFIG.minHeight);
    });

    it('should clamp to max dimensions', () => {
      let state = createCardSurfaceState(DEFAULT_CARD_SURFACE_CONFIG);
      state = resizeCard(state, 1000, 800, DEFAULT_CARD_SURFACE_CONFIG);
      
      expect(state.width).toBe(DEFAULT_CARD_SURFACE_CONFIG.maxWidth);
      expect(state.height).toBe(DEFAULT_CARD_SURFACE_CONFIG.maxHeight);
    });
  });

  describe('drag operations', () => {
    it('should track drag state', () => {
      let state = createCardSurfaceState(DEFAULT_CARD_SURFACE_CONFIG);
      expect(state.dragging).toBe(false);
      
      state = startDrag(state);
      expect(state.dragging).toBe(true);
      
      state = endDrag(state);
      expect(state.dragging).toBe(false);
    });
  });

  describe('resize operations', () => {
    it('should track resize state', () => {
      let state = createCardSurfaceState(DEFAULT_CARD_SURFACE_CONFIG);
      expect(state.resizing).toBe(false);
      
      state = startResize(state, 'se');
      expect(state.resizing).toBe(true);
      expect(state.resizeHandle).toBe('se');
      
      state = endResize(state);
      expect(state.resizing).toBe(false);
      expect(state.resizeHandle).toBe(null);
    });
  });

  describe('toggleMinimize', () => {
    it('should toggle minimized state', () => {
      let state = createCardSurfaceState(DEFAULT_CARD_SURFACE_CONFIG);
      
      state = toggleMinimize(state);
      expect(state.minimized).toBe(true);
      
      state = toggleMinimize(state);
      expect(state.minimized).toBe(false);
    });
  });

  describe('toggleMaximize', () => {
    it('should maximize and save previous bounds', () => {
      let state = createCardSurfaceState(DEFAULT_CARD_SURFACE_CONFIG, 100, 100);
      
      state = toggleMaximize(state, 1920, 1080);
      
      expect(state.maximized).toBe(true);
      expect(state.x).toBe(0);
      expect(state.y).toBe(0);
      expect(state.width).toBe(1920);
      expect(state.height).toBe(1080);
      expect(state.preMaximizeBounds).toEqual({ x: 100, y: 100, width: 280, height: 200 });
    });

    it('should restore previous bounds on unmaximize', () => {
      let state = createCardSurfaceState(DEFAULT_CARD_SURFACE_CONFIG, 100, 100);
      state = toggleMaximize(state, 1920, 1080);
      state = toggleMaximize(state, 1920, 1080);
      
      expect(state.maximized).toBe(false);
      expect(state.x).toBe(100);
      expect(state.y).toBe(100);
      expect(state.width).toBe(280);
      expect(state.height).toBe(200);
    });
  });

  describe('setCardState', () => {
    it('should update card state', () => {
      let state = createCardSurfaceState(DEFAULT_CARD_SURFACE_CONFIG);
      
      state = setCardState(state, 'selected');
      expect(state.state).toBe('selected');
      
      state = setCardState(state, 'disabled');
      expect(state.state).toBe('disabled');
    });
  });
});

// ============================================================================
// CARD HEADER TESTS
// ============================================================================

describe('Card Header', () => {
  describe('DEFAULT_CARD_HEADER_CONFIG', () => {
    it('should have valid defaults', () => {
      expect(DEFAULT_CARD_HEADER_CONFIG.showTitle).toBe(true);
      expect(DEFAULT_CARD_HEADER_CONFIG.editableTitle).toBe(true);
      expect(DEFAULT_CARD_HEADER_CONFIG.height).toBe(32);
    });
  });

  describe('createCardHeaderState', () => {
    it('should create initial state', () => {
      const state = createCardHeaderState('My Card');
      
      expect(state.title).toBe('My Card');
      expect(state.editing).toBe(false);
      expect(state.draftTitle).toBe('');
      expect(state.menuOpen).toBe(false);
    });
  });

  describe('title editing', () => {
    it('should start editing', () => {
      let state = createCardHeaderState('Original');
      state = startTitleEdit(state);
      
      expect(state.editing).toBe(true);
      expect(state.draftTitle).toBe('Original');
    });

    it('should update draft', () => {
      let state = createCardHeaderState('Original');
      state = startTitleEdit(state);
      state = updateDraftTitle(state, 'New Title');
      
      expect(state.draftTitle).toBe('New Title');
      expect(state.title).toBe('Original');
    });

    it('should confirm edit', () => {
      let state = createCardHeaderState('Original');
      state = startTitleEdit(state);
      state = updateDraftTitle(state, 'New Title');
      state = confirmTitleEdit(state);
      
      expect(state.title).toBe('New Title');
      expect(state.editing).toBe(false);
    });

    it('should cancel edit', () => {
      let state = createCardHeaderState('Original');
      state = startTitleEdit(state);
      state = updateDraftTitle(state, 'New Title');
      state = cancelTitleEdit(state);
      
      expect(state.title).toBe('Original');
      expect(state.editing).toBe(false);
    });
  });

  describe('toggleCardMenu', () => {
    it('should toggle menu state', () => {
      let state = createCardHeaderState('Card');
      
      state = toggleCardMenu(state);
      expect(state.menuOpen).toBe(true);
      
      state = toggleCardMenu(state);
      expect(state.menuOpen).toBe(false);
    });
  });
});

// ============================================================================
// CARD TOOLBAR TESTS
// ============================================================================

describe('Card Toolbar', () => {
  describe('DEFAULT_CARD_TOOLBAR_CONFIG', () => {
    it('should have valid defaults', () => {
      expect(DEFAULT_CARD_TOOLBAR_CONFIG.height).toBe(28);
      expect(DEFAULT_CARD_TOOLBAR_CONFIG.iconSize).toBe(16);
    });
  });

  describe('createToolbarButton', () => {
    it('should create button with defaults', () => {
      const button = createToolbarButton('play', 'play-icon', 'Play');
      
      expect(button.id).toBe('play');
      expect(button.type).toBe('button');
      expect(button.enabled).toBe(true);
      expect(button.active).toBe(false);
    });

    it('should create toggle button', () => {
      const button = createToolbarButton('mute', 'mute-icon', 'Mute', 'toggle');
      expect(button.type).toBe('toggle');
    });
  });

  describe('toggleToolbarButton', () => {
    it('should toggle button state', () => {
      const buttons = [
        createToolbarButton('btn1', 'icon1', 'Button 1', 'toggle'),
        createToolbarButton('btn2', 'icon2', 'Button 2', 'toggle'),
      ];
      
      const updated = toggleToolbarButton(buttons, 'btn1');
      
      expect(updated[0]!.active).toBe(true);
      expect(updated[1]!.active).toBe(false);
    });

    it('should not toggle non-toggle buttons', () => {
      const buttons = [createToolbarButton('btn1', 'icon1', 'Button 1', 'button')];
      const updated = toggleToolbarButton(buttons, 'btn1');
      
      expect(updated[0]!.active).toBe(false);
    });
  });

  describe('selectToolbarOption', () => {
    it('should select dropdown option', () => {
      const buttons = [{
        ...createToolbarButton('mode', 'mode-icon', 'Mode', 'dropdown'),
        options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
      }];
      
      const updated = selectToolbarOption(buttons, 'mode', 'b');
      expect(updated[0]!.selectedOption).toBe('b');
    });
  });
});

// ============================================================================
// CARD CONTENT TESTS
// ============================================================================

describe('Card Content', () => {
  describe('DEFAULT_CARD_CONTENT_CONFIG', () => {
    it('should have valid defaults', () => {
      expect(DEFAULT_CARD_CONTENT_CONFIG.overflow).toBe('auto');
      expect(DEFAULT_CARD_CONTENT_CONFIG.layout).toBe('flow');
      expect(DEFAULT_CARD_CONTENT_CONFIG.padding).toBe(8);
    });
  });

  describe('createContentScrollState', () => {
    it('should create initial state', () => {
      const state = createContentScrollState();
      
      expect(state.scrollX).toBe(0);
      expect(state.scrollY).toBe(0);
    });
  });

  describe('updateScroll', () => {
    it('should update scroll position', () => {
      let state = createContentScrollState();
      state = { ...state, contentWidth: 500, contentHeight: 400, viewportWidth: 200, viewportHeight: 150 };
      state = updateScroll(state, 100, 50);
      
      expect(state.scrollX).toBe(100);
      expect(state.scrollY).toBe(50);
    });

    it('should clamp scroll to bounds', () => {
      let state = createContentScrollState();
      state = { ...state, contentWidth: 500, contentHeight: 400, viewportWidth: 200, viewportHeight: 150 };
      state = updateScroll(state, 1000, 1000);
      
      expect(state.scrollX).toBe(300); // 500 - 200
      expect(state.scrollY).toBe(250); // 400 - 150
    });
  });

  describe('isScrollable', () => {
    it('should detect scrollability', () => {
      const state = {
        ...createContentScrollState(),
        contentWidth: 500,
        contentHeight: 400,
        viewportWidth: 200,
        viewportHeight: 500,
      };
      
      const result = isScrollable(state);
      
      expect(result.x).toBe(true);
      expect(result.y).toBe(false);
    });
  });
});

// ============================================================================
// CARD PORT TESTS
// ============================================================================

describe('Card Ports', () => {
  describe('PORT_TYPE_COLORS', () => {
    it('should have colors for all types', () => {
      expect(PORT_TYPE_COLORS.audio).toBeDefined();
      expect(PORT_TYPE_COLORS.midi).toBeDefined();
      expect(PORT_TYPE_COLORS.control).toBeDefined();
      expect(PORT_TYPE_COLORS.trigger).toBeDefined();
      expect(PORT_TYPE_COLORS.data).toBeDefined();
    });
  });

  describe('getPortColor', () => {
    it('should return custom color if set', () => {
      const port = { type: 'audio', color: '#FF0000' } as any;
      expect(getPortColor(port)).toBe('#FF0000');
    });

    it('should return type color if no custom color', () => {
      const port = { type: 'audio', color: null } as any;
      expect(getPortColor(port)).toBe(PORT_TYPE_COLORS.audio);
    });
  });

  describe('createCardPortState', () => {
    it('should create initial state', () => {
      const state = createCardPortState();
      
      expect(state.connections).toEqual([]);
      expect(state.value).toBe(null);
      expect(state.hovered).toBe(false);
    });
  });

  describe('addPortConnection', () => {
    it('should add connection', () => {
      let state = createCardPortState();
      state = addPortConnection(state, 'port-1', true);
      
      expect(state.connections).toContain('port-1');
    });

    it('should allow multiple connections', () => {
      let state = createCardPortState();
      state = addPortConnection(state, 'port-1', true);
      state = addPortConnection(state, 'port-2', true);
      
      expect(state.connections.length).toBe(2);
    });

    it('should replace connection if not multiple', () => {
      let state = createCardPortState();
      state = addPortConnection(state, 'port-1', false);
      state = addPortConnection(state, 'port-2', false);
      
      expect(state.connections).toEqual(['port-2']);
    });

    it('should not add duplicate connections', () => {
      let state = createCardPortState();
      state = addPortConnection(state, 'port-1', true);
      state = addPortConnection(state, 'port-1', true);
      
      expect(state.connections.length).toBe(1);
    });
  });

  describe('removePortConnection', () => {
    it('should remove connection', () => {
      let state = createCardPortState();
      state = addPortConnection(state, 'port-1', true);
      state = addPortConnection(state, 'port-2', true);
      state = removePortConnection(state, 'port-1');
      
      expect(state.connections).toEqual(['port-2']);
    });
  });

  describe('arePortsCompatible', () => {
    it('should return true for compatible ports', () => {
      const source = { direction: 'output', type: 'audio' } as any;
      const target = { direction: 'input', type: 'audio' } as any;
      
      expect(arePortsCompatible(source, target)).toBe(true);
    });

    it('should return false for same direction', () => {
      const source = { direction: 'output', type: 'audio' } as any;
      const target = { direction: 'output', type: 'audio' } as any;
      
      expect(arePortsCompatible(source, target)).toBe(false);
    });

    it('should return false for different types', () => {
      const source = { direction: 'output', type: 'audio' } as any;
      const target = { direction: 'input', type: 'midi' } as any;
      
      expect(arePortsCompatible(source, target)).toBe(false);
    });
  });

  describe('getPortScreenPosition', () => {
    const bounds = { x: 100, y: 100, width: 200, height: 100 };

    it('should calculate left port position', () => {
      const port = { side: 'left', position: 0.5 } as any;
      const pos = getPortScreenPosition(port, bounds);
      
      expect(pos.x).toBe(100);
      expect(pos.y).toBe(150);
    });

    it('should calculate right port position', () => {
      const port = { side: 'right', position: 0.5 } as any;
      const pos = getPortScreenPosition(port, bounds);
      
      expect(pos.x).toBe(300);
      expect(pos.y).toBe(150);
    });

    it('should calculate top port position', () => {
      const port = { side: 'top', position: 0.5 } as any;
      const pos = getPortScreenPosition(port, bounds);
      
      expect(pos.x).toBe(200);
      expect(pos.y).toBe(100);
    });

    it('should calculate bottom port position', () => {
      const port = { side: 'bottom', position: 0.5 } as any;
      const pos = getPortScreenPosition(port, bounds);
      
      expect(pos.x).toBe(200);
      expect(pos.y).toBe(200);
    });
  });
});

// ============================================================================
// CONNECTION TESTS
// ============================================================================

describe('Connections', () => {
  describe('DEFAULT_CONNECTION_CONFIG', () => {
    it('should have valid defaults', () => {
      expect(DEFAULT_CONNECTION_CONFIG.style).toBe('bezier');
      expect(DEFAULT_CONNECTION_CONFIG.thickness).toBe(2);
    });
  });

  describe('createConnectionState', () => {
    it('should create initial state', () => {
      const state = createConnectionState();
      
      expect(state.selected).toBe(false);
      expect(state.hovered).toBe(false);
      expect(state.signalLevel).toBe(0);
    });
  });

  describe('generateCablePoints', () => {
    it('should generate bezier points', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 200, y: 100 };
      
      const points = generateCablePoints(start, end, 'bezier');
      
      expect(points.cx1).toBeGreaterThan(0);
      expect(points.cx2).toBeLessThan(200);
    });
  });

  describe('generateCablePath', () => {
    it('should generate straight path', () => {
      const path = generateCablePath({ x: 0, y: 0 }, { x: 100, y: 100 }, 'straight');
      expect(path).toContain('M 0 0');
      expect(path).toContain('L 100 100');
    });

    it('should generate bezier path', () => {
      const path = generateCablePath({ x: 0, y: 0 }, { x: 100, y: 100 }, 'bezier');
      expect(path).toContain('M 0 0');
      expect(path).toContain('C');
    });

    it('should generate step path', () => {
      const path = generateCablePath({ x: 0, y: 0 }, { x: 100, y: 100 }, 'step');
      expect(path).toContain('H');
      expect(path).toContain('V');
    });
  });
});

// ============================================================================
// CARD BADGE TESTS
// ============================================================================

describe('Card Badge', () => {
  describe('BADGE_TYPE_COLORS', () => {
    it('should have colors for all types', () => {
      expect(BADGE_TYPE_COLORS.info).toBeDefined();
      expect(BADGE_TYPE_COLORS.success).toBeDefined();
      expect(BADGE_TYPE_COLORS.warning).toBeDefined();
      expect(BADGE_TYPE_COLORS.error).toBeDefined();
    });
  });

  describe('getBadgeColor', () => {
    it('should return custom color if set', () => {
      const badge = { type: 'info', color: '#FF0000' } as any;
      expect(getBadgeColor(badge)).toBe('#FF0000');
    });

    it('should return type color if no custom color', () => {
      const badge = { type: 'success', color: null } as any;
      expect(getBadgeColor(badge)).toBe(BADGE_TYPE_COLORS.success);
    });
  });
});

// ============================================================================
// CARD MENU TESTS
// ============================================================================

describe('Card Menu', () => {
  describe('createMenuItem', () => {
    it('should create menu item with defaults', () => {
      const item = createMenuItem('edit', 'Edit');
      
      expect(item.id).toBe('edit');
      expect(item.label).toBe('Edit');
      expect(item.type).toBe('item');
      expect(item.enabled).toBe(true);
    });

    it('should create menu item with options', () => {
      const item = createMenuItem('delete', 'Delete', { 
        icon: 'trash', 
        shortcut: 'Cmd+D',
        enabled: false 
      });
      
      expect(item.icon).toBe('trash');
      expect(item.shortcut).toBe('Cmd+D');
      expect(item.enabled).toBe(false);
    });
  });

  describe('createMenuSeparator', () => {
    it('should create separator', () => {
      const sep = createMenuSeparator();
      
      expect(sep.type).toBe('separator');
      expect(sep.label).toBe('');
    });
  });

  describe('menu state', () => {
    it('should open at position', () => {
      let state = createCardMenuState();
      state = openMenu(state, 100, 200);
      
      expect(state.open).toBe(true);
      expect(state.x).toBe(100);
      expect(state.y).toBe(200);
    });

    it('should close menu', () => {
      let state = createCardMenuState();
      state = openMenu(state, 100, 200);
      state = closeMenu(state);
      
      expect(state.open).toBe(false);
    });
  });
});

// ============================================================================
// CARD STACK TESTS
// ============================================================================

describe('Card Stack', () => {
  describe('DEFAULT_CARD_STACK_CONFIG', () => {
    it('should have valid defaults', () => {
      expect(DEFAULT_CARD_STACK_CONFIG.mode).toBe('tabs');
      expect(DEFAULT_CARD_STACK_CONFIG.reorderable).toBe(true);
    });
  });

  describe('createCardStackState', () => {
    it('should create empty stack', () => {
      const state = createCardStackState();
      
      expect(state.cards).toEqual([]);
      expect(state.activeId).toBe(null);
    });

    it('should create stack with cards', () => {
      const state = createCardStackState(['a', 'b', 'c']);
      
      expect(state.cards).toEqual(['a', 'b', 'c']);
      expect(state.activeId).toBe('a');
    });
  });

  describe('addToStack', () => {
    it('should add card', () => {
      let state = createCardStackState(['a']);
      state = addToStack(state, 'b');
      
      expect(state.cards).toEqual(['a', 'b']);
    });

    it('should not add duplicate', () => {
      let state = createCardStackState(['a', 'b']);
      state = addToStack(state, 'a');
      
      expect(state.cards).toEqual(['a', 'b']);
    });

    it('should set active if first card', () => {
      let state = createCardStackState();
      state = addToStack(state, 'a');
      
      expect(state.activeId).toBe('a');
    });
  });

  describe('removeFromStack', () => {
    it('should remove card', () => {
      let state = createCardStackState(['a', 'b', 'c']);
      state = removeFromStack(state, 'b');
      
      expect(state.cards).toEqual(['a', 'c']);
    });

    it('should update active if removed', () => {
      let state = createCardStackState(['a', 'b']);
      state = removeFromStack(state, 'a');
      
      expect(state.activeId).toBe('b');
    });
  });

  describe('setActiveCard', () => {
    it('should set active card', () => {
      let state = createCardStackState(['a', 'b', 'c']);
      state = setActiveCard(state, 'c');
      
      expect(state.activeId).toBe('c');
    });

    it('should not set if card not in stack', () => {
      let state = createCardStackState(['a', 'b']);
      state = setActiveCard(state, 'd');
      
      expect(state.activeId).toBe('a');
    });
  });

  describe('reorderStack', () => {
    it('should reorder cards', () => {
      let state = createCardStackState(['a', 'b', 'c']);
      state = reorderStack(state, 0, 2);
      
      expect(state.cards).toEqual(['b', 'c', 'a']);
    });

    it('should handle invalid indices', () => {
      let state = createCardStackState(['a', 'b', 'c']);
      state = reorderStack(state, -1, 5);
      
      expect(state.cards).toEqual(['a', 'b', 'c']);
    });
  });
});

// ============================================================================
// CARD SEARCH TESTS
// ============================================================================

describe('Card Search', () => {
  describe('DEFAULT_CARD_SEARCH_CONFIG', () => {
    it('should have valid defaults', () => {
      expect(DEFAULT_CARD_SEARCH_CONFIG.minChars).toBe(1);
      expect(DEFAULT_CARD_SEARCH_CONFIG.debounceMs).toBe(150);
    });
  });

  describe('createCardSearchState', () => {
    it('should create initial state', () => {
      const state = createCardSearchState();
      
      expect(state.query).toBe('');
      expect(state.results).toEqual([]);
      expect(state.searching).toBe(false);
    });
  });

  describe('updateSearchQuery', () => {
    it('should update query', () => {
      let state = createCardSearchState();
      state = updateSearchQuery(state, 'test');
      
      expect(state.query).toBe('test');
      expect(state.searching).toBe(true);
    });

    it('should not set searching for empty query', () => {
      let state = createCardSearchState();
      state = updateSearchQuery(state, '');
      
      expect(state.searching).toBe(false);
    });
  });

  describe('setSearchResults', () => {
    it('should set results', () => {
      let state = createCardSearchState();
      state = updateSearchQuery(state, 'osc');
      state = setSearchResults(state, ['osc1', 'osc2']);
      
      expect(state.results).toEqual(['osc1', 'osc2']);
      expect(state.searching).toBe(false);
    });
  });

  describe('clearSearch', () => {
    it('should clear search state', () => {
      let state = createCardSearchState();
      state = updateSearchQuery(state, 'test');
      state = setSearchResults(state, ['a', 'b']);
      state = clearSearch(state);
      
      expect(state.query).toBe('');
      expect(state.results).toEqual([]);
    });
  });
});

// ============================================================================
// CARD CATEGORY TESTS
// ============================================================================

describe('Card Category', () => {
  describe('DEFAULT_CARD_CATEGORIES', () => {
    it('should have categories', () => {
      expect(DEFAULT_CARD_CATEGORIES.length).toBeGreaterThan(0);
      expect(DEFAULT_CARD_CATEGORIES.some(c => c.id === 'generators')).toBe(true);
      expect(DEFAULT_CARD_CATEGORIES.some(c => c.id === 'effects')).toBe(true);
    });
  });

  describe('matchesCategory', () => {
    it('should match pattern with wildcard', () => {
      const category = DEFAULT_CARD_CATEGORIES.find(c => c.id === 'generators')!;
      
      expect(matchesCategory('oscillator', category)).toBe(true);
      expect(matchesCategory('osc-saw', category)).toBe(true);
    });

    it('should not match unrelated type', () => {
      const category = DEFAULT_CARD_CATEGORIES.find(c => c.id === 'generators')!;
      
      expect(matchesCategory('filter', category)).toBe(false);
    });
  });

  describe('getCategoryForType', () => {
    it('should find category', () => {
      const category = getCategoryForType('filter-lowpass');
      
      expect(category).not.toBe(null);
      expect(category!.id).toBe('effects');
    });

    it('should return null for unknown type', () => {
      const category = getCategoryForType('unknown-type');
      expect(category).toBe(null);
    });
  });
});

// ============================================================================
// CARD FOCUS TESTS
// ============================================================================

describe('Card Focus', () => {
  describe('createCardFocusState', () => {
    it('should create initial state', () => {
      const state = createCardFocusState();
      
      expect(state.focusedCardId).toBe(null);
      expect(state.trapped).toBe(false);
    });
  });

  describe('focusCard', () => {
    it('should focus card', () => {
      let state = createCardFocusState();
      state = focusCard(state, 'card-1');
      
      expect(state.focusedCardId).toBe('card-1');
    });
  });

  describe('focusElement', () => {
    it('should focus element within card', () => {
      let state = createCardFocusState();
      state = focusCard(state, 'card-1');
      state = focusElement(state, 'knob-freq');
      
      expect(state.focusedElement).toBe('knob-freq');
    });
  });

  describe('trapFocus', () => {
    it('should trap focus and save last', () => {
      let state = createCardFocusState();
      state = focusCard(state, 'card-1');
      state = focusElement(state, 'knob');
      state = trapFocus(state);
      
      expect(state.trapped).toBe(true);
      expect(state.lastFocus).toEqual({ cardId: 'card-1', element: 'knob' });
    });

    it('should not trap if no card focused', () => {
      let state = createCardFocusState();
      state = trapFocus(state);
      
      expect(state.trapped).toBe(false);
    });
  });

  describe('releaseFocusTrap', () => {
    it('should restore last focus', () => {
      let state = createCardFocusState();
      state = focusCard(state, 'card-1');
      state = focusElement(state, 'knob');
      state = trapFocus(state);
      state = focusCard(state, 'card-2');
      state = releaseFocusTrap(state);
      
      expect(state.trapped).toBe(false);
      expect(state.focusedCardId).toBe('card-1');
      expect(state.focusedElement).toBe('knob');
    });
  });
});

// ============================================================================
// DEFAULTS TESTS
// ============================================================================

describe('Default Configurations', () => {
  it('should have valid DEFAULT_CARD_PREVIEW_CONFIG', () => {
    expect(DEFAULT_CARD_PREVIEW_CONFIG.width).toBe(80);
    expect(DEFAULT_CARD_PREVIEW_CONFIG.height).toBe(60);
  });
});
