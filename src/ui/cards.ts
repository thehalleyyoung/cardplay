/**
 * @fileoverview Card UI Components.
 * 
 * This module provides the card-based UI framework for the modular synthesis
 * interface, implementing the "card/deck" paradigm where each functional unit
 * (oscillator, filter, effect, etc.) is represented as a card that can be
 * connected, arranged, and manipulated.
 */

// ============================================================================
// CARD SURFACE
// ============================================================================

/**
 * Card size presets.
 */
export type CardSize = 'small' | 'medium' | 'large' | 'custom';

/**
 * Card visual style.
 */
export type CardStyle = 'default' | 'minimal' | 'rounded' | 'sharp' | 'gradient';

/**
 * Card state.
 */
export type CardState = 'normal' | 'selected' | 'focused' | 'disabled' | 'error' | 'loading';

/**
 * Card port direction.
 */
export type PortDirection = 'input' | 'output';

/**
 * Card port data type.
 */
export type PortType = 'audio' | 'midi' | 'control' | 'trigger' | 'data';

/**
 * Card surface configuration.
 */
export interface CardSurfaceConfig {
  /** Card ID */
  readonly id: string;
  /** Card type identifier */
  readonly type: string;
  /** Display title */
  readonly title: string;
  /** Initial size */
  readonly size: CardSize;
  /** Custom dimensions if size is 'custom' */
  readonly width: number;
  readonly height: number;
  /** Minimum dimensions */
  readonly minWidth: number;
  readonly minHeight: number;
  /** Maximum dimensions */
  readonly maxWidth: number;
  readonly maxHeight: number;
  /** Visual style */
  readonly style: CardStyle;
  /** Whether card is resizable */
  readonly resizable: boolean;
  /** Whether card is draggable */
  readonly draggable: boolean;
  /** Whether card can be minimized */
  readonly minimizable: boolean;
  /** Whether card can be maximized */
  readonly maximizable: boolean;
  /** Whether card can be closed */
  readonly closable: boolean;
  /** Card color (hue 0-360) */
  readonly hue: number;
  /** Card saturation (0-100) */
  readonly saturation: number;
  /** Z-index layer */
  readonly zIndex: number;
}

/**
 * Default card surface config.
 */
export const DEFAULT_CARD_SURFACE_CONFIG: CardSurfaceConfig = {
  id: '',
  type: 'generic',
  title: 'Card',
  size: 'medium',
  width: 280,
  height: 200,
  minWidth: 120,
  minHeight: 80,
  maxWidth: 800,
  maxHeight: 600,
  style: 'default',
  resizable: true,
  draggable: true,
  minimizable: true,
  maximizable: false,
  closable: true,
  hue: 220,
  saturation: 60,
  zIndex: 0,
};

/**
 * Size presets in pixels.
 */
export const CARD_SIZE_PRESETS: Record<Exclude<CardSize, 'custom'>, { width: number; height: number }> = {
  small: { width: 160, height: 120 },
  medium: { width: 280, height: 200 },
  large: { width: 400, height: 300 },
};

/**
 * Get card dimensions from size preset.
 */
export function getCardDimensions(
  config: CardSurfaceConfig
): { width: number; height: number } {
  if (config.size === 'custom') {
    return { width: config.width, height: config.height };
  }
  return CARD_SIZE_PRESETS[config.size];
}

/**
 * Card surface state.
 */
export interface CardSurfaceState {
  /** Current state */
  readonly state: CardState;
  /** Position */
  readonly x: number;
  readonly y: number;
  /** Current dimensions */
  readonly width: number;
  readonly height: number;
  /** Whether minimized */
  readonly minimized: boolean;
  /** Whether maximized */
  readonly maximized: boolean;
  /** Whether being dragged */
  readonly dragging: boolean;
  /** Whether being resized */
  readonly resizing: boolean;
  /** Resize handle active */
  readonly resizeHandle: ResizeHandle | null;
  /** Pre-maximize bounds */
  readonly preMaximizeBounds: { x: number; y: number; width: number; height: number } | null;
}

/**
 * Resize handle positions.
 */
export type ResizeHandle = 
  | 'n' | 's' | 'e' | 'w' 
  | 'ne' | 'nw' | 'se' | 'sw';

/**
 * Create initial card surface state.
 */
export function createCardSurfaceState(
  config: CardSurfaceConfig,
  x: number = 0,
  y: number = 0
): CardSurfaceState {
  const dims = getCardDimensions(config);
  return {
    state: 'normal',
    x,
    y,
    width: dims.width,
    height: dims.height,
    minimized: false,
    maximized: false,
    dragging: false,
    resizing: false,
    resizeHandle: null,
    preMaximizeBounds: null,
  };
}

/**
 * Update card position.
 */
export function moveCard(
  state: CardSurfaceState,
  x: number,
  y: number
): CardSurfaceState {
  return { ...state, x, y };
}

/**
 * Resize card.
 */
export function resizeCard(
  state: CardSurfaceState,
  width: number,
  height: number,
  config: CardSurfaceConfig
): CardSurfaceState {
  const clampedWidth = Math.max(config.minWidth, Math.min(config.maxWidth, width));
  const clampedHeight = Math.max(config.minHeight, Math.min(config.maxHeight, height));
  return { ...state, width: clampedWidth, height: clampedHeight };
}

/**
 * Start dragging card.
 */
export function startDrag(state: CardSurfaceState): CardSurfaceState {
  return { ...state, dragging: true };
}

/**
 * End dragging card.
 */
export function endDrag(state: CardSurfaceState): CardSurfaceState {
  return { ...state, dragging: false };
}

/**
 * Start resizing card.
 */
export function startResize(
  state: CardSurfaceState,
  handle: ResizeHandle
): CardSurfaceState {
  return { ...state, resizing: true, resizeHandle: handle };
}

/**
 * End resizing card.
 */
export function endResize(state: CardSurfaceState): CardSurfaceState {
  return { ...state, resizing: false, resizeHandle: null };
}

/**
 * Toggle card minimized state.
 */
export function toggleMinimize(state: CardSurfaceState): CardSurfaceState {
  return { ...state, minimized: !state.minimized };
}

/**
 * Toggle card maximized state.
 */
export function toggleMaximize(
  state: CardSurfaceState,
  containerWidth: number,
  containerHeight: number
): CardSurfaceState {
  if (state.maximized) {
    // Restore previous bounds
    if (state.preMaximizeBounds) {
      return {
        ...state,
        x: state.preMaximizeBounds.x,
        y: state.preMaximizeBounds.y,
        width: state.preMaximizeBounds.width,
        height: state.preMaximizeBounds.height,
        maximized: false,
        preMaximizeBounds: null,
      };
    }
    return { ...state, maximized: false };
  } else {
    // Save current bounds and maximize
    return {
      ...state,
      preMaximizeBounds: { x: state.x, y: state.y, width: state.width, height: state.height },
      x: 0,
      y: 0,
      width: containerWidth,
      height: containerHeight,
      maximized: true,
    };
  }
}

/**
 * Set card state.
 */
export function setCardState(
  state: CardSurfaceState,
  cardState: CardState
): CardSurfaceState {
  return { ...state, state: cardState };
}

// ============================================================================
// CARD HEADER
// ============================================================================

/**
 * Card header button.
 */
export interface CardHeaderButton {
  /** Button ID */
  readonly id: string;
  /** Button icon name */
  readonly icon: string;
  /** Button tooltip */
  readonly tooltip: string;
  /** Whether button is enabled */
  readonly enabled: boolean;
  /** Whether button is active/toggled */
  readonly active: boolean;
}

/**
 * Card header configuration.
 */
export interface CardHeaderConfig {
  /** Show title */
  readonly showTitle: boolean;
  /** Editable title */
  readonly editableTitle: boolean;
  /** Show menu button */
  readonly showMenu: boolean;
  /** Show minimize button */
  readonly showMinimize: boolean;
  /** Show maximize button */
  readonly showMaximize: boolean;
  /** Show close button */
  readonly showClose: boolean;
  /** Custom buttons */
  readonly buttons: readonly CardHeaderButton[];
  /** Header height */
  readonly height: number;
  /** Show drag handle */
  readonly showDragHandle: boolean;
}

/**
 * Default header config.
 */
export const DEFAULT_CARD_HEADER_CONFIG: CardHeaderConfig = {
  showTitle: true,
  editableTitle: true,
  showMenu: true,
  showMinimize: true,
  showMaximize: false,
  showClose: true,
  buttons: [],
  height: 32,
  showDragHandle: true,
};

/**
 * Card header state.
 */
export interface CardHeaderState {
  /** Current title */
  readonly title: string;
  /** Whether title is being edited */
  readonly editing: boolean;
  /** Draft title during editing */
  readonly draftTitle: string;
  /** Whether menu is open */
  readonly menuOpen: boolean;
}

/**
 * Create initial header state.
 */
export function createCardHeaderState(title: string): CardHeaderState {
  return {
    title,
    editing: false,
    draftTitle: '',
    menuOpen: false,
  };
}

/**
 * Start editing title.
 */
export function startTitleEdit(state: CardHeaderState): CardHeaderState {
  return { ...state, editing: true, draftTitle: state.title };
}

/**
 * Update draft title.
 */
export function updateDraftTitle(
  state: CardHeaderState,
  draft: string
): CardHeaderState {
  return { ...state, draftTitle: draft };
}

/**
 * Confirm title edit.
 */
export function confirmTitleEdit(state: CardHeaderState): CardHeaderState {
  return { ...state, title: state.draftTitle, editing: false, draftTitle: '' };
}

/**
 * Cancel title edit.
 */
export function cancelTitleEdit(state: CardHeaderState): CardHeaderState {
  return { ...state, editing: false, draftTitle: '' };
}

/**
 * Toggle menu open state.
 */
export function toggleCardMenu(state: CardHeaderState): CardHeaderState {
  return { ...state, menuOpen: !state.menuOpen };
}

// ============================================================================
// CARD TOOLBAR
// ============================================================================

/**
 * Toolbar button type.
 */
export type ToolbarButtonType = 'button' | 'toggle' | 'dropdown' | 'separator';

/**
 * Toolbar button.
 */
export interface ToolbarButton {
  /** Button ID */
  readonly id: string;
  /** Button type */
  readonly type: ToolbarButtonType;
  /** Icon name */
  readonly icon: string;
  /** Label (optional) */
  readonly label: string;
  /** Tooltip */
  readonly tooltip: string;
  /** Whether enabled */
  readonly enabled: boolean;
  /** Whether active (for toggle) */
  readonly active: boolean;
  /** Dropdown options (for dropdown type) */
  readonly options: readonly { id: string; label: string }[];
  /** Selected option (for dropdown) */
  readonly selectedOption: string;
}

/**
 * Card toolbar config.
 */
export interface CardToolbarConfig {
  /** Toolbar buttons */
  readonly buttons: readonly ToolbarButton[];
  /** Toolbar height */
  readonly height: number;
  /** Show labels */
  readonly showLabels: boolean;
  /** Icon size */
  readonly iconSize: number;
  /** Button spacing */
  readonly spacing: number;
}

/**
 * Default toolbar config.
 */
export const DEFAULT_CARD_TOOLBAR_CONFIG: CardToolbarConfig = {
  buttons: [],
  height: 28,
  showLabels: false,
  iconSize: 16,
  spacing: 4,
};

/**
 * Create a toolbar button.
 */
export function createToolbarButton(
  id: string,
  icon: string,
  tooltip: string,
  type: ToolbarButtonType = 'button'
): ToolbarButton {
  return {
    id,
    type,
    icon,
    label: '',
    tooltip,
    enabled: true,
    active: false,
    options: [],
    selectedOption: '',
  };
}

/**
 * Toggle toolbar button active state.
 */
export function toggleToolbarButton(
  buttons: readonly ToolbarButton[],
  buttonId: string
): readonly ToolbarButton[] {
  return buttons.map(b => 
    b.id === buttonId && b.type === 'toggle' 
      ? { ...b, active: !b.active } 
      : b
  );
}

/**
 * Select dropdown option.
 */
export function selectToolbarOption(
  buttons: readonly ToolbarButton[],
  buttonId: string,
  optionId: string
): readonly ToolbarButton[] {
  return buttons.map(b =>
    b.id === buttonId && b.type === 'dropdown'
      ? { ...b, selectedOption: optionId }
      : b
  );
}

// ============================================================================
// CARD CONTENT
// ============================================================================

/**
 * Content overflow behavior.
 */
export type ContentOverflow = 'visible' | 'hidden' | 'scroll' | 'auto';

/**
 * Content layout mode.
 */
export type ContentLayout = 'flow' | 'grid' | 'flex-row' | 'flex-column' | 'absolute';

/**
 * Card content config.
 */
export interface CardContentConfig {
  /** Overflow behavior */
  readonly overflow: ContentOverflow;
  /** Layout mode */
  readonly layout: ContentLayout;
  /** Padding */
  readonly padding: number;
  /** Grid columns (for grid layout) */
  readonly gridColumns: number;
  /** Gap between items */
  readonly gap: number;
  /** Scrollbar style */
  readonly scrollbarStyle: 'default' | 'thin' | 'hidden';
}

/**
 * Default content config.
 */
export const DEFAULT_CARD_CONTENT_CONFIG: CardContentConfig = {
  overflow: 'auto',
  layout: 'flow',
  padding: 8,
  gridColumns: 2,
  gap: 8,
  scrollbarStyle: 'thin',
};

/**
 * Content scroll state.
 */
export interface ContentScrollState {
  /** Scroll position X */
  readonly scrollX: number;
  /** Scroll position Y */
  readonly scrollY: number;
  /** Content width */
  readonly contentWidth: number;
  /** Content height */
  readonly contentHeight: number;
  /** Viewport width */
  readonly viewportWidth: number;
  /** Viewport height */
  readonly viewportHeight: number;
}

/**
 * Create initial scroll state.
 */
export function createContentScrollState(): ContentScrollState {
  return {
    scrollX: 0,
    scrollY: 0,
    contentWidth: 0,
    contentHeight: 0,
    viewportWidth: 0,
    viewportHeight: 0,
  };
}

/**
 * Update scroll position.
 */
export function updateScroll(
  state: ContentScrollState,
  scrollX: number,
  scrollY: number
): ContentScrollState {
  const maxScrollX = Math.max(0, state.contentWidth - state.viewportWidth);
  const maxScrollY = Math.max(0, state.contentHeight - state.viewportHeight);
  return {
    ...state,
    scrollX: Math.max(0, Math.min(maxScrollX, scrollX)),
    scrollY: Math.max(0, Math.min(maxScrollY, scrollY)),
  };
}

/**
 * Check if content is scrollable.
 */
export function isScrollable(state: ContentScrollState): { x: boolean; y: boolean } {
  return {
    x: state.contentWidth > state.viewportWidth,
    y: state.contentHeight > state.viewportHeight,
  };
}

// ============================================================================
// CARD PORTS
// ============================================================================

/**
 * Port configuration.
 */
export interface CardPortConfig {
  /** Port ID */
  readonly id: string;
  /** Port name */
  readonly name: string;
  /** Port direction */
  readonly direction: PortDirection;
  /** Port data type */
  readonly type: PortType;
  /** Whether port accepts multiple connections */
  readonly multiple: boolean;
  /** Port position (0-1, relative to card edge) */
  readonly position: number;
  /** Port side */
  readonly side: 'left' | 'right' | 'top' | 'bottom';
  /** Port color (optional, uses type default if not specified) */
  readonly color: string | null;
}

/**
 * Default port colors by type.
 */
export const PORT_TYPE_COLORS: Record<PortType, string> = {
  audio: '#4CAF50',
  midi: '#2196F3',
  control: '#FF9800',
  trigger: '#E91E63',
  data: '#9C27B0',
};

/**
 * Get port color.
 */
export function getPortColor(port: CardPortConfig): string {
  return port.color ?? PORT_TYPE_COLORS[port.type];
}

/**
 * Port state.
 */
export interface CardPortState {
  /** Connected port IDs */
  readonly connections: readonly string[];
  /** Current value (for display) */
  readonly value: number | null;
  /** Whether port is being hovered */
  readonly hovered: boolean;
  /** Whether port is being dragged from */
  readonly dragging: boolean;
  /** Whether a compatible connection is being dragged over */
  readonly dropTarget: boolean;
}

/**
 * Create initial port state.
 */
export function createCardPortState(): CardPortState {
  return {
    connections: [],
    value: null,
    hovered: false,
    dragging: false,
    dropTarget: false,
  };
}

/**
 * Add connection to port.
 */
export function addPortConnection(
  state: CardPortState,
  targetPortId: string,
  multiple: boolean
): CardPortState {
  if (!multiple && state.connections.length > 0) {
    return { ...state, connections: [targetPortId] };
  }
  if (state.connections.includes(targetPortId)) {
    return state;
  }
  return { ...state, connections: [...state.connections, targetPortId] };
}

/**
 * Remove connection from port.
 */
export function removePortConnection(
  state: CardPortState,
  targetPortId: string
): CardPortState {
  return {
    ...state,
    connections: state.connections.filter(id => id !== targetPortId),
  };
}

/**
 * Check if ports are compatible for connection.
 */
export function arePortsCompatible(
  source: CardPortConfig,
  target: CardPortConfig
): boolean {
  // Must be opposite directions
  if (source.direction === target.direction) {
    return false;
  }
  
  // Must be same type
  if (source.type !== target.type) {
    return false;
  }
  
  return true;
}

/**
 * Calculate port screen position.
 */
export function getPortScreenPosition(
  port: CardPortConfig,
  cardBounds: { x: number; y: number; width: number; height: number }
): { x: number; y: number } {
  switch (port.side) {
    case 'left':
      return { x: cardBounds.x, y: cardBounds.y + cardBounds.height * port.position };
    case 'right':
      return { x: cardBounds.x + cardBounds.width, y: cardBounds.y + cardBounds.height * port.position };
    case 'top':
      return { x: cardBounds.x + cardBounds.width * port.position, y: cardBounds.y };
    case 'bottom':
      return { x: cardBounds.x + cardBounds.width * port.position, y: cardBounds.y + cardBounds.height };
  }
}

// ============================================================================
// CARD CONNECTIONS (CABLES)
// ============================================================================

/**
 * Cable visual style.
 */
export type CableStyle = 'straight' | 'bezier' | 'step' | 'arc';

/**
 * Connection configuration.
 */
export interface ConnectionConfig {
  /** Unique connection ID */
  readonly id: string;
  /** Source card ID */
  readonly sourceCardId: string;
  /** Source port ID */
  readonly sourcePortId: string;
  /** Target card ID */
  readonly targetCardId: string;
  /** Target port ID */
  readonly targetPortId: string;
  /** Cable visual style */
  readonly style: CableStyle;
  /** Cable color (null = use port type color) */
  readonly color: string | null;
  /** Cable thickness */
  readonly thickness: number;
  /** Whether cable is animated */
  readonly animated: boolean;
}

/**
 * Default connection config.
 */
export const DEFAULT_CONNECTION_CONFIG: Omit<ConnectionConfig, 'id' | 'sourceCardId' | 'sourcePortId' | 'targetCardId' | 'targetPortId'> = {
  style: 'bezier',
  color: null,
  thickness: 2,
  animated: false,
};

/**
 * Connection state.
 */
export interface ConnectionState {
  /** Whether connection is selected */
  readonly selected: boolean;
  /** Whether connection is hovered */
  readonly hovered: boolean;
  /** Current signal level (0-1, for animation) */
  readonly signalLevel: number;
}

/**
 * Create initial connection state.
 */
export function createConnectionState(): ConnectionState {
  return {
    selected: false,
    hovered: false,
    signalLevel: 0,
  };
}

/**
 * Generate bezier control points for cable.
 */
export function generateCablePoints(
  start: { x: number; y: number },
  end: { x: number; y: number },
  style: CableStyle
): { cx1: number; cy1: number; cx2: number; cy2: number } {
  const dx = end.x - start.x;
  
  switch (style) {
    case 'straight':
      return {
        cx1: start.x + dx * 0.5,
        cy1: start.y,
        cx2: start.x + dx * 0.5,
        cy2: end.y,
      };
      
    case 'bezier': {
      const curvature = Math.min(Math.abs(dx) * 0.5, 100);
      return {
        cx1: start.x + curvature,
        cy1: start.y,
        cx2: end.x - curvature,
        cy2: end.y,
      };
    }
    
    case 'step':
      return {
        cx1: start.x + dx * 0.5,
        cy1: start.y,
        cx2: start.x + dx * 0.5,
        cy2: end.y,
      };
      
    case 'arc': {
      const arcHeight = Math.min(Math.abs(dx) * 0.3, 50);
      const midY = (start.y + end.y) / 2 - arcHeight;
      return {
        cx1: start.x + dx * 0.25,
        cy1: midY,
        cx2: start.x + dx * 0.75,
        cy2: midY,
      };
    }
  }
}

/**
 * Generate SVG path for cable.
 */
export function generateCablePath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  style: CableStyle
): string {
  if (style === 'straight') {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }
  
  if (style === 'step') {
    const midX = (start.x + end.x) / 2;
    return `M ${start.x} ${start.y} H ${midX} V ${end.y} H ${end.x}`;
  }
  
  const { cx1, cy1, cx2, cy2 } = generateCablePoints(start, end, style);
  return `M ${start.x} ${start.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${end.x} ${end.y}`;
}

// ============================================================================
// CARD PREVIEW
// ============================================================================

/**
 * Card preview configuration.
 */
export interface CardPreviewConfig {
  /** Preview width */
  readonly width: number;
  /** Preview height */
  readonly height: number;
  /** Scale factor */
  readonly scale: number;
  /** Show title */
  readonly showTitle: boolean;
  /** Show ports */
  readonly showPorts: boolean;
  /** Border radius */
  readonly borderRadius: number;
}

/**
 * Default preview config.
 */
export const DEFAULT_CARD_PREVIEW_CONFIG: CardPreviewConfig = {
  width: 80,
  height: 60,
  scale: 0.25,
  showTitle: true,
  showPorts: false,
  borderRadius: 4,
};

// ============================================================================
// CARD BADGE
// ============================================================================

/**
 * Badge type.
 */
export type BadgeType = 'info' | 'success' | 'warning' | 'error' | 'custom';

/**
 * Badge position.
 */
export type BadgePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * Card badge configuration.
 */
export interface CardBadgeConfig {
  /** Badge ID */
  readonly id: string;
  /** Badge type */
  readonly type: BadgeType;
  /** Badge label or count */
  readonly label: string;
  /** Badge position */
  readonly position: BadgePosition;
  /** Custom color */
  readonly color: string | null;
  /** Icon name */
  readonly icon: string | null;
  /** Whether badge pulses */
  readonly pulsing: boolean;
}

/**
 * Badge type colors.
 */
export const BADGE_TYPE_COLORS: Record<BadgeType, string> = {
  info: '#2196F3',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#f44336',
  custom: '#9C27B0',
};

/**
 * Get badge color.
 */
export function getBadgeColor(badge: CardBadgeConfig): string {
  return badge.color ?? BADGE_TYPE_COLORS[badge.type];
}

// ============================================================================
// CARD MENU
// ============================================================================

/**
 * Card menu item type.
 */
export type CardMenuItemType = 'item' | 'submenu' | 'separator' | 'checkbox' | 'radio';

/**
 * Card menu item.
 */
export interface CardMenuItem {
  /** Item ID */
  readonly id: string;
  /** Item type */
  readonly type: CardMenuItemType;
  /** Item label */
  readonly label: string;
  /** Icon name */
  readonly icon: string | null;
  /** Keyboard shortcut */
  readonly shortcut: string | null;
  /** Whether item is enabled */
  readonly enabled: boolean;
  /** Whether item is checked (checkbox/radio) */
  readonly checked: boolean;
  /** Radio group name */
  readonly radioGroup: string | null;
  /** Submenu items */
  readonly submenu: readonly CardMenuItem[];
}

/**
 * Create menu item.
 */
export function createMenuItem(
  id: string,
  label: string,
  options: Partial<Omit<CardMenuItem, 'id' | 'label'>> = {}
): CardMenuItem {
  return {
    id,
    label,
    type: options.type ?? 'item',
    icon: options.icon ?? null,
    shortcut: options.shortcut ?? null,
    enabled: options.enabled ?? true,
    checked: options.checked ?? false,
    radioGroup: options.radioGroup ?? null,
    submenu: options.submenu ?? [],
  };
}

/**
 * Create separator.
 */
export function createMenuSeparator(): CardMenuItem {
  return {
    id: `separator-${Date.now()}-${Math.random()}`,
    type: 'separator',
    label: '',
    icon: null,
    shortcut: null,
    enabled: true,
    checked: false,
    radioGroup: null,
    submenu: [],
  };
}

/**
 * Card menu state.
 */
export interface CardMenuState {
  /** Whether menu is open */
  readonly open: boolean;
  /** Menu position */
  readonly x: number;
  readonly y: number;
  /** Focused item ID */
  readonly focusedId: string | null;
  /** Open submenu ID */
  readonly openSubmenuId: string | null;
}

/**
 * Create initial menu state.
 */
export function createCardMenuState(): CardMenuState {
  return {
    open: false,
    x: 0,
    y: 0,
    focusedId: null,
    openSubmenuId: null,
  };
}

/**
 * Open menu at position.
 */
export function openMenu(
  state: CardMenuState,
  x: number,
  y: number
): CardMenuState {
  return { ...state, open: true, x, y, focusedId: null, openSubmenuId: null };
}

/**
 * Close menu.
 */
export function closeMenu(state: CardMenuState): CardMenuState {
  return { ...state, open: false, focusedId: null, openSubmenuId: null };
}

// ============================================================================
// CARD STACK (Layered/Tabbed Cards)
// ============================================================================

/**
 * Stack layout mode.
 */
export type StackMode = 'tabs' | 'cascade' | 'overlay';

/**
 * Card stack configuration.
 */
export interface CardStackConfig {
  /** Stack mode */
  readonly mode: StackMode;
  /** Maximum visible cards (cascade mode) */
  readonly maxVisible: number;
  /** Cascade offset */
  readonly cascadeOffset: { x: number; y: number };
  /** Tab bar position */
  readonly tabPosition: 'top' | 'bottom' | 'left' | 'right';
  /** Allow reordering */
  readonly reorderable: boolean;
}

/**
 * Default stack config.
 */
export const DEFAULT_CARD_STACK_CONFIG: CardStackConfig = {
  mode: 'tabs',
  maxVisible: 5,
  cascadeOffset: { x: 20, y: 20 },
  tabPosition: 'top',
  reorderable: true,
};

/**
 * Card stack state.
 */
export interface CardStackState {
  /** Card IDs in stack order */
  readonly cards: readonly string[];
  /** Active card ID */
  readonly activeId: string | null;
  /** Dragging card ID (for reordering) */
  readonly draggingId: string | null;
  /** Drop target index */
  readonly dropIndex: number | null;
}

/**
 * Create initial stack state.
 */
export function createCardStackState(
  cardIds: readonly string[] = []
): CardStackState {
  return {
    cards: cardIds,
    activeId: cardIds[0] ?? null,
    draggingId: null,
    dropIndex: null,
  };
}

/**
 * Add card to stack.
 */
export function addToStack(
  state: CardStackState,
  cardId: string
): CardStackState {
  if (state.cards.includes(cardId)) {
    return state;
  }
  return {
    ...state,
    cards: [...state.cards, cardId],
    activeId: state.activeId ?? cardId,
  };
}

/**
 * Remove card from stack.
 */
export function removeFromStack(
  state: CardStackState,
  cardId: string
): CardStackState {
  const newCards = state.cards.filter(id => id !== cardId);
  return {
    ...state,
    cards: newCards,
    activeId: state.activeId === cardId 
      ? newCards[0] ?? null 
      : state.activeId,
  };
}

/**
 * Set active card in stack.
 */
export function setActiveCard(
  state: CardStackState,
  cardId: string
): CardStackState {
  if (!state.cards.includes(cardId)) {
    return state;
  }
  return { ...state, activeId: cardId };
}

/**
 * Reorder card in stack.
 */
export function reorderStack(
  state: CardStackState,
  fromIndex: number,
  toIndex: number
): CardStackState {
  if (fromIndex < 0 || fromIndex >= state.cards.length) return state;
  if (toIndex < 0 || toIndex >= state.cards.length) return state;
  
  const cards = [...state.cards];
  const [removed] = cards.splice(fromIndex, 1);
  cards.splice(toIndex, 0, removed!);
  
  return { ...state, cards };
}

// ============================================================================
// CARD SEARCH/FILTER
// ============================================================================

/**
 * Search filter configuration.
 */
export interface CardSearchConfig {
  /** Placeholder text */
  readonly placeholder: string;
  /** Minimum characters to search */
  readonly minChars: number;
  /** Debounce delay in ms */
  readonly debounceMs: number;
  /** Search fields */
  readonly searchFields: readonly string[];
  /** Show clear button */
  readonly showClear: boolean;
  /** Case sensitive */
  readonly caseSensitive: boolean;
}

/**
 * Default search config.
 */
export const DEFAULT_CARD_SEARCH_CONFIG: CardSearchConfig = {
  placeholder: 'Search cards...',
  minChars: 1,
  debounceMs: 150,
  searchFields: ['title', 'type', 'tags'],
  showClear: true,
  caseSensitive: false,
};

/**
 * Card search state.
 */
export interface CardSearchState {
  /** Current query */
  readonly query: string;
  /** Active filter */
  readonly filter: string | null;
  /** Matching card IDs */
  readonly results: readonly string[];
  /** Is searching */
  readonly searching: boolean;
}

/**
 * Create initial search state.
 */
export function createCardSearchState(): CardSearchState {
  return {
    query: '',
    filter: null,
    results: [],
    searching: false,
  };
}

/**
 * Update search query.
 */
export function updateSearchQuery(
  state: CardSearchState,
  query: string
): CardSearchState {
  return { ...state, query, searching: query.length > 0 };
}

/**
 * Set search results.
 */
export function setSearchResults(
  state: CardSearchState,
  results: readonly string[]
): CardSearchState {
  return { ...state, results, searching: false };
}

/**
 * Clear search.
 */
export function clearSearch(state: CardSearchState): CardSearchState {
  return { ...state, query: '', filter: null, results: [], searching: false };
}

// ============================================================================
// CARD CATEGORY
// ============================================================================

/**
 * Card category.
 */
export interface CardCategory {
  /** Category ID */
  readonly id: string;
  /** Category name */
  readonly name: string;
  /** Category icon */
  readonly icon: string;
  /** Category color */
  readonly color: string;
  /** Card type patterns that belong to this category */
  readonly patterns: readonly string[];
  /** Whether category is expanded */
  readonly expanded: boolean;
}

/**
 * Default card categories.
 */
export const DEFAULT_CARD_CATEGORIES: readonly CardCategory[] = [
  { id: 'generators', name: 'Generators', icon: 'wave', color: '#4CAF50', patterns: ['osc*', 'sampler*', 'noise*'], expanded: true },
  { id: 'effects', name: 'Effects', icon: 'effect', color: '#2196F3', patterns: ['filter*', 'delay*', 'reverb*', 'distortion*'], expanded: true },
  { id: 'modulators', name: 'Modulators', icon: 'lfo', color: '#FF9800', patterns: ['lfo*', 'envelope*', 'seq*'], expanded: true },
  { id: 'utilities', name: 'Utilities', icon: 'tool', color: '#9C27B0', patterns: ['mixer*', 'gain*', 'pan*', 'meter*'], expanded: true },
  { id: 'midi', name: 'MIDI', icon: 'midi', color: '#E91E63', patterns: ['midi*', 'keyboard*', 'arp*'], expanded: true },
];

/**
 * Check if card type matches category.
 */
export function matchesCategory(cardType: string, category: CardCategory): boolean {
  return category.patterns.some(pattern => {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$', 'i');
    return regex.test(cardType);
  });
}

/**
 * Get category for card type.
 */
export function getCategoryForType(
  cardType: string,
  categories: readonly CardCategory[] = DEFAULT_CARD_CATEGORIES
): CardCategory | null {
  return categories.find(cat => matchesCategory(cardType, cat)) ?? null;
}

// ============================================================================
// CARD FOCUS/KEYBOARD NAVIGATION
// ============================================================================

/**
 * Focus navigation direction.
 */
export type CardNavigationDirection = 'next' | 'prev' | 'up' | 'down' | 'left' | 'right';

/**
 * Card focus state.
 */
export interface CardFocusState {
  /** Focused card ID */
  readonly focusedCardId: string | null;
  /** Focused element within card */
  readonly focusedElement: string | null;
  /** Focus trap active */
  readonly trapped: boolean;
  /** Last focus before trap */
  readonly lastFocus: { cardId: string; element: string } | null;
}

/**
 * Create initial focus state.
 */
export function createCardFocusState(): CardFocusState {
  return {
    focusedCardId: null,
    focusedElement: null,
    trapped: false,
    lastFocus: null,
  };
}

/**
 * Focus card.
 */
export function focusCard(
  state: CardFocusState,
  cardId: string
): CardFocusState {
  return { ...state, focusedCardId: cardId, focusedElement: null };
}

/**
 * Focus element within card.
 */
export function focusElement(
  state: CardFocusState,
  element: string
): CardFocusState {
  return { ...state, focusedElement: element };
}

/**
 * Trap focus in card.
 */
export function trapFocus(state: CardFocusState): CardFocusState {
  if (state.focusedCardId === null) return state;
  return {
    ...state,
    trapped: true,
    lastFocus: state.focusedCardId 
      ? { cardId: state.focusedCardId, element: state.focusedElement ?? '' }
      : null,
  };
}

/**
 * Release focus trap.
 */
export function releaseFocusTrap(state: CardFocusState): CardFocusState {
  if (state.lastFocus) {
    return {
      ...state,
      trapped: false,
      focusedCardId: state.lastFocus.cardId,
      focusedElement: state.lastFocus.element,
      lastFocus: null,
    };
  }
  return { ...state, trapped: false, lastFocus: null };
}
