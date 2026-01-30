/**
 * @fileoverview Card Component System
 * 
 * Base card component with full lifecycle management:
 * - DOM structure (header, body, footer)
 * - State management (selected, focused, dragging)
 * - Resize handles and constraints
 * - Context menu integration
 * - Accessibility (ARIA, keyboard navigation)
 * - Animation system (enter, exit, move)
 * - Connection ports (audio, MIDI, modulation)
 * 
 * @module @cardplay/ui/components/card-component
 */

import { validateConnection } from '../../boards/gating/validate-connection';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Card UI state (visual/interaction state).
 * 
 * This is the canonical UI-level CardState for visual/interaction states.
 * Note: Different from core CardState<S> generic in cards/card.ts which handles stateful card data.
 */
export type CardState = 
  | 'idle'
  | 'selected'
  | 'focused'
  | 'dragging'
  | 'resizing'
  | 'loading'
  | 'error'
  | 'disabled';

/** Card size */
export type CardSize = 'small' | 'medium' | 'large' | 'custom';

/**
 * UI port type (legacy: encodes direction in type name).
 * 
 * Change 201: Renamed from PortType to UIPortType to avoid conflict with canonical PortType.
 * @deprecated Use UIPortDirection + UICanonicalPortType instead (Changes 070-071)
 */
export type UIPortType = 'audio_in' | 'audio_out' | 'midi_in' | 'midi_out' | 'mod_in' | 'mod_out' | 'trigger_in' | 'trigger_out';

/**
 * Change 070: UI port direction (separate from type).
 */
export type UIPortDirection = 'in' | 'out';

/**
 * Change 070: UI canonical port type (without direction encoding).
 * Maps to canonical PortType from canon/port-types.ts
 */
export type UICanonicalPortType = 'audio' | 'midi' | 'notes' | 'control' | 'trigger' | 'gate' | 'clock' | 'transport' | 'modulation';

/**
 * Change 071: New port model with separate direction and type.
 */
export interface PortSpec {
  direction: UIPortDirection;
  type: UICanonicalPortType;
}

/**
 * Change 071: Convert legacy UIPortType to PortSpec.
 */
export function parseUIPortType(legacyType: UIPortType): PortSpec {
  const parts = legacyType.split('_');
  if (parts.length === 2 && parts[0] && parts[1] && (parts[1] === 'in' || parts[1] === 'out')) {
    const typeMap: Record<string, UICanonicalPortType> = {
      'audio': 'audio',
      'midi': 'midi',
      'mod': 'modulation',
      'trigger': 'trigger',
    };
    return {
      direction: parts[1] as UIPortDirection,
      type: typeMap[parts[0]] || 'control',
    };
  }
  // Fallback
  return { direction: 'in', type: 'control' };
}

/**
 * Change 071: Convert PortSpec to legacy UIPortType (for backward compat).
 */
export function formatUIPortType(spec: PortSpec): UIPortType {
  const typeMap: Record<UICanonicalPortType, string> = {
    'audio': 'audio',
    'midi': 'midi',
    'notes': 'midi', // Notes use midi CSS
    'control': 'mod',
    'trigger': 'trigger',
    'gate': 'trigger', // Gate uses trigger CSS
    'clock': 'trigger', // Clock uses trigger CSS
    'transport': 'trigger', // Transport uses trigger CSS
    'modulation': 'mod',
  };
  const prefix = typeMap[spec.type] || 'mod';
  return `${prefix}_${spec.direction}` as UIPortType;
}

/** 
 * Port definition (legacy - uses UIPortType).
 * @deprecated Use PortDefinitionV2 with PortSpec (Changes 070-071)
 */
export interface PortDefinition {
  id: string;
  type: UIPortType;
  label: string;
  position: 'top' | 'right' | 'bottom' | 'left';
  offset: number;  // Percentage along edge (0-100)
  connected: boolean;
  highlighted: boolean;
}

/**
 * Change 071: Port definition with separate direction and type.
 */
export interface PortDefinitionV2 {
  id: string;
  direction: UIPortDirection;
  portType: UICanonicalPortType;
  label: string;
  position: 'top' | 'right' | 'bottom' | 'left';
  offset: number;  // Percentage along edge (0-100)
  connected: boolean;
  highlighted: boolean;
}

/** Card badge */
export interface CardBadge {
  id: string;
  type: 'status' | 'count' | 'warning' | 'error' | 'info';
  value: string | number;
  color?: string;
  tooltip?: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/** Card animation */
export type CardAnimation = 
  | 'enter'
  | 'exit'
  | 'move'
  | 'scale'
  | 'shake'
  | 'pulse'
  | 'none';

/** Resize handle position */
export type ResizeHandle = 
  | 'n' | 's' | 'e' | 'w'
  | 'ne' | 'nw' | 'se' | 'sw';

/** Card lifecycle hooks */
export interface CardLifecycle {
  onMount?: () => void;
  onUnmount?: () => void;
  onSelect?: () => void;
  onDeselect?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onDragStart?: (e: PointerEvent) => void;
  onDrag?: (e: PointerEvent) => void;
  onDragEnd?: (e: PointerEvent) => void;
  onResize?: (width: number, height: number) => void;
  onContextMenu?: (e: MouseEvent) => void;
  onDoubleClick?: (e: MouseEvent) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
}

/** Card options */
export interface CardOptions {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  icon?: string;
  color?: string;
  
  // Dimensions
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  
  // State
  initialState?: CardState;
  resizable?: boolean;
  draggable?: boolean;
  collapsible?: boolean;
  closable?: boolean;
  
  // Ports
  ports?: PortDefinition[];
  
  // Badges
  badges?: CardBadge[];
  
  // Content
  renderHeader?: (card: CardComponent) => HTMLElement | null;
  renderBody?: (card: CardComponent) => HTMLElement | null;
  renderFooter?: (card: CardComponent) => HTMLElement | null;
  
  // Lifecycle
  lifecycle?: CardLifecycle;
  
  // Accessibility
  ariaLabel?: string;
  ariaDescription?: string;
}

// ============================================================================
// CARD COMPONENT
// ============================================================================

/**
 * Base card component.
 *
 * Change 256: Renamed from CardComponent to UICardComponent to match canon
 * "Card Systems" naming. CardComponent alias preserved for backward compat.
 */
export class UICardComponent {
  // Identity
  readonly id: string;
  readonly type: string;
  
  // DOM
  private container: HTMLElement;
  private header: HTMLElement;
  private body: HTMLElement;
  private footer: HTMLElement;
  private portElements: Map<string, HTMLElement> = new Map();
  private badgeElements: Map<string, HTMLElement> = new Map();
  private resizeHandles: Map<ResizeHandle, HTMLElement> = new Map();
  private focusRing: HTMLElement;
  private dragGhost: HTMLElement | null = null;
  
  // State
  private _state: CardState = 'idle';
  private _collapsed: boolean = false;
  private _selected: boolean = false;
  private _focused: boolean = false;
  
  // Dimensions
  private _width: number;
  private _height: number;
  private _minWidth: number;
  private _minHeight: number;
  private _maxWidth: number;
  private _maxHeight: number;
  
  // Options
  private options: CardOptions;
  private ports: Map<string, PortDefinition> = new Map();
  private badges: Map<string, CardBadge> = new Map();
  
  // Animation
  private animationFrame: number | null = null;
  
  // Drag state
  private isDragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  
  // Resize state
  private isResizing = false;
  private resizeHandle: ResizeHandle | null = null;
  private resizeStartWidth = 0;
  private resizeStartHeight = 0;
  private resizeStartX = 0;
  private resizeStartY = 0;
  
  constructor(options: CardOptions) {
    this.id = options.id;
    this.type = options.type;
    this.options = options;
    
    this._width = options.width;
    this._height = options.height;
    this._minWidth = options.minWidth ?? 80;
    this._minHeight = options.minHeight ?? 60;
    this._maxWidth = options.maxWidth ?? 800;
    this._maxHeight = options.maxHeight ?? 600;
    this._state = options.initialState ?? 'idle';
    
    // Initialize ports
    if (options.ports) {
      for (const port of options.ports) {
        this.ports.set(port.id, { ...port });
      }
    }
    
    // Initialize badges
    if (options.badges) {
      for (const badge of options.badges) {
        this.badges.set(badge.id, { ...badge });
      }
    }
    
    // Create DOM
    this.container = this.createContainer();
    this.header = this.createHeader();
    this.body = this.createBody();
    this.footer = this.createFooter();
    this.focusRing = this.createFocusRing();
    
    this.assembleDOM();
    this.setupEventListeners();
    this.setupAccessibility();
    
    // Call mount lifecycle
    this.options.lifecycle?.onMount?.();
  }
  
  // ===========================================================================
  // DOM CREATION
  // ===========================================================================
  
  private createContainer(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'card-component';
    el.dataset.cardId = this.id;
    el.dataset.cardType = this.type;
    el.dataset.cardState = this._state;
    
    el.style.width = `${this._width}px`;
    el.style.height = `${this._height}px`;
    el.style.setProperty('--card-color', this.options.color ?? '#6366f1');
    
    return el;
  }
  
  private createHeader(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'card-header';
    
    // Icon
    if (this.options.icon) {
      const icon = document.createElement('span');
      icon.className = 'card-icon';
      icon.innerHTML = this.getIconSVG(this.options.icon);
      el.appendChild(icon);
    }
    
    // Title
    const titleContainer = document.createElement('div');
    titleContainer.className = 'card-title-container';
    
    const title = document.createElement('span');
    title.className = 'card-title';
    title.textContent = this.options.title;
    titleContainer.appendChild(title);
    
    if (this.options.subtitle) {
      const subtitle = document.createElement('span');
      subtitle.className = 'card-subtitle';
      subtitle.textContent = this.options.subtitle;
      titleContainer.appendChild(subtitle);
    }
    
    el.appendChild(titleContainer);
    
    // Header actions
    const actions = document.createElement('div');
    actions.className = 'card-header-actions';
    
    if (this.options.collapsible) {
      const collapseBtn = document.createElement('button');
      collapseBtn.className = 'card-action-btn card-collapse-btn';
      collapseBtn.innerHTML = this.getIconSVG('chevron-down');
      collapseBtn.title = 'Collapse';
      collapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleCollapse();
      });
      actions.appendChild(collapseBtn);
    }
    
    if (this.options.closable) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'card-action-btn card-close-btn';
      closeBtn.innerHTML = this.getIconSVG('x');
      closeBtn.title = 'Close';
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.close();
      });
      actions.appendChild(closeBtn);
    }
    
    el.appendChild(actions);
    
    // Custom header content
    if (this.options.renderHeader) {
      const custom = this.options.renderHeader(this);
      if (custom) {
        el.appendChild(custom);
      }
    }
    
    return el;
  }
  
  private createBody(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'card-body';
    
    if (this.options.renderBody) {
      const content = this.options.renderBody(this);
      if (content) {
        el.appendChild(content);
      }
    }
    
    return el;
  }
  
  private createFooter(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'card-footer';
    
    if (this.options.renderFooter) {
      const content = this.options.renderFooter(this);
      if (content) {
        el.appendChild(content);
      }
    }
    
    return el;
  }
  
  private createFocusRing(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'card-focus-ring';
    return el;
  }
  
  private createPortElement(port: PortDefinition | PortDefinitionV2): HTMLElement {
    const el = document.createElement('div');
    // Change 207: Support both legacy port type class and canonical direction+type classes
    if ('direction' in port && 'portType' in port) {
      // New PortDefinitionV2 model
      const legacyCssClass = formatUIPortType({ direction: port.direction, type: port.portType });
      el.className = `card-port card-port-${legacyCssClass} card-port-type-${port.portType} card-port-dir-${port.direction}`;
      el.dataset.portId = port.id;
      el.dataset.portType = port.portType;
      el.dataset.portDirection = port.direction;
    } else {
      // Legacy PortDefinition
      el.className = `card-port card-port-${port.type}`;
      el.dataset.portId = port.id;
      el.dataset.portType = port.type;
    }
    el.title = port.label;
    
    // Position the port
    this.positionPort(el, port);
    
    // Port indicator
    const indicator = document.createElement('div');
    indicator.className = 'card-port-indicator';
    el.appendChild(indicator);
    
    // Port label (shown on hover)
    const label = document.createElement('span');
    label.className = 'card-port-label';
    label.textContent = port.label;
    el.appendChild(label);
    
    return el;
  }
  
  private positionPort(el: HTMLElement, port: PortDefinition): void {
    el.classList.add(`card-port-${port.position}`);
    
    switch (port.position) {
      case 'top':
        el.style.left = `${port.offset}%`;
        el.style.top = '0';
        el.style.transform = 'translate(-50%, -50%)';
        break;
      case 'bottom':
        el.style.left = `${port.offset}%`;
        el.style.bottom = '0';
        el.style.transform = 'translate(-50%, 50%)';
        break;
      case 'left':
        el.style.top = `${port.offset}%`;
        el.style.left = '0';
        el.style.transform = 'translate(-50%, -50%)';
        break;
      case 'right':
        el.style.top = `${port.offset}%`;
        el.style.right = '0';
        el.style.transform = 'translate(50%, -50%)';
        break;
    }
  }
  
  private createBadgeElement(badge: CardBadge): HTMLElement {
    const el = document.createElement('div');
    el.className = `card-badge card-badge-${badge.type} card-badge-${badge.position}`;
    el.dataset.badgeId = badge.id;
    
    if (badge.color) {
      el.style.backgroundColor = badge.color;
    }
    
    if (badge.tooltip) {
      el.title = badge.tooltip;
    }
    
    const value = document.createElement('span');
    value.className = 'card-badge-value';
    value.textContent = String(badge.value);
    el.appendChild(value);
    
    return el;
  }
  
  private createResizeHandles(): void {
    if (!this.options.resizable) return;
    
    const handles: ResizeHandle[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
    
    for (const handle of handles) {
      const el = document.createElement('div');
      el.className = `card-resize-handle card-resize-${handle}`;
      el.dataset.handle = handle;
      
      el.addEventListener('pointerdown', (e) => this.onResizeStart(e, handle));
      
      this.resizeHandles.set(handle, el);
      this.container.appendChild(el);
    }
  }
  
  private assembleDOM(): void {
    this.container.appendChild(this.focusRing);
    this.container.appendChild(this.header);
    this.container.appendChild(this.body);
    
    // Only add footer if it has content
    if (this.footer.children.length > 0) {
      this.container.appendChild(this.footer);
    }
    
    // Add ports
    for (const port of Array.from(this.ports.values())) {
      const el = this.createPortElement(port);
      this.portElements.set(port.id, el);
      this.container.appendChild(el);
    }
    
    // Add badges
    for (const badge of Array.from(this.badges.values())) {
      const el = this.createBadgeElement(badge);
      this.badgeElements.set(badge.id, el);
      this.container.appendChild(el);
    }
    
    // Add resize handles
    this.createResizeHandles();
  }
  
  // ===========================================================================
  // EVENT HANDLING
  // ===========================================================================
  
  private setupEventListeners(): void {
    // Click to select
    this.container.addEventListener('click', (e) => this.onClick(e));
    
    // Double-click
    this.container.addEventListener('dblclick', (e) => this.onDoubleClick(e));
    
    // Context menu
    this.container.addEventListener('contextmenu', (e) => this.onContextMenu(e));
    
    // Keyboard
    this.container.addEventListener('keydown', (e) => this.onKeyDown(e));
    
    // Focus/blur
    this.container.addEventListener('focus', () => this.onFocus());
    this.container.addEventListener('blur', () => this.onBlur());
    
    // Drag (on header)
    if (this.options.draggable !== false) {
      this.header.addEventListener('pointerdown', (e) => this.onDragStart(e));
    }
    
    // Port interactions
    for (const [portId, el] of Array.from(this.portElements)) {
      el.addEventListener('pointerenter', () => this.onPortHover(portId, true));
      el.addEventListener('pointerleave', () => this.onPortHover(portId, false));
      el.addEventListener('pointerdown', (e) => this.onPortDragStart(e, portId));
    }
  }
  
  private onClick(e: MouseEvent): void {
    e.stopPropagation();
    
    if (e.shiftKey) {
      // Multi-select
      this.toggleSelected();
    } else {
      // Single select
      this.select();
    }
  }
  
  private onDoubleClick(e: MouseEvent): void {
    e.stopPropagation();
    this.options.lifecycle?.onDoubleClick?.(e);
  }
  
  private onContextMenu(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.options.lifecycle?.onContextMenu?.(e);
  }
  
  private onKeyDown(e: KeyboardEvent): void {
    this.options.lifecycle?.onKeyDown?.(e);
    
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.options.lifecycle?.onDoubleClick?.(new MouseEvent('dblclick'));
        break;
      case 'Delete':
      case 'Backspace':
        if (!e.target || (e.target as HTMLElement).tagName !== 'INPUT') {
          e.preventDefault();
          this.close();
        }
        break;
      case 'Escape':
        e.preventDefault();
        this.deselect();
        this.blur();
        break;
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        // Let parent handle navigation
        break;
    }
  }
  
  private onFocus(): void {
    this._focused = true;
    this.container.dataset.cardState = this.computeState();
    this.options.lifecycle?.onFocus?.();
  }
  
  private onBlur(): void {
    this._focused = false;
    this.container.dataset.cardState = this.computeState();
    this.options.lifecycle?.onBlur?.();
  }
  
  // ===========================================================================
  // DRAG HANDLING
  // ===========================================================================
  
  private onDragStart(e: PointerEvent): void {
    if (e.button !== 0) return; // Left click only
    if ((e.target as HTMLElement).closest('.card-action-btn')) return;
    
    e.preventDefault();
    
    this.isDragging = true;
    this._state = 'dragging';
    this.container.dataset.cardState = 'dragging';

    const rect = this.container.getBoundingClientRect();
    this.dragOffsetX = e.clientX - rect.left;
    this.dragOffsetY = e.clientY - rect.top;
    
    // Create drag ghost
    this.createDragGhost();
    
    // Capture pointer
    this.header.setPointerCapture(e.pointerId);
    
    // Add move/up listeners
    this.header.addEventListener('pointermove', this.onDragMove);
    this.header.addEventListener('pointerup', this.onDragEnd);
    this.header.addEventListener('pointercancel', this.onDragEnd);
    
    this.options.lifecycle?.onDragStart?.(e);
  }
  
  private onDragMove = (e: PointerEvent): void => {
    if (!this.isDragging) return;
    
    // Update ghost position
    if (this.dragGhost) {
      this.dragGhost.style.left = `${e.clientX - this.dragOffsetX}px`;
      this.dragGhost.style.top = `${e.clientY - this.dragOffsetY}px`;
    }
    
    this.options.lifecycle?.onDrag?.(e);
  };
  
  private onDragEnd = (e: PointerEvent): void => {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this._state = this._selected ? 'selected' : 'idle';
    this.container.dataset.cardState = this.computeState();
    
    // Remove ghost
    this.removeDragGhost();
    
    // Release pointer
    this.header.releasePointerCapture(e.pointerId);
    
    // Remove listeners
    this.header.removeEventListener('pointermove', this.onDragMove);
    this.header.removeEventListener('pointerup', this.onDragEnd);
    this.header.removeEventListener('pointercancel', this.onDragEnd);
    
    this.options.lifecycle?.onDragEnd?.(e);
  };
  
  private createDragGhost(): void {
    this.dragGhost = this.container.cloneNode(true) as HTMLElement;
    this.dragGhost.className = 'card-drag-ghost';
    this.dragGhost.style.position = 'fixed';
    this.dragGhost.style.pointerEvents = 'none';
    this.dragGhost.style.opacity = '0.7';
    this.dragGhost.style.zIndex = '10000';
    
    const rect = this.container.getBoundingClientRect();
    this.dragGhost.style.left = `${rect.left}px`;
    this.dragGhost.style.top = `${rect.top}px`;
    this.dragGhost.style.width = `${rect.width}px`;
    this.dragGhost.style.height = `${rect.height}px`;
    
    document.body.appendChild(this.dragGhost);
  }
  
  private removeDragGhost(): void {
    if (this.dragGhost) {
      this.dragGhost.remove();
      this.dragGhost = null;
    }
  }
  
  // ===========================================================================
  // RESIZE HANDLING
  // ===========================================================================
  
  private onResizeStart(e: PointerEvent, handle: ResizeHandle): void {
    if (e.button !== 0) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    this.isResizing = true;
    this.resizeHandle = handle;
    this._state = 'resizing';
    this.container.dataset.cardState = 'resizing';
    
    this.resizeStartWidth = this._width;
    this.resizeStartHeight = this._height;
    this.resizeStartX = e.clientX;
    this.resizeStartY = e.clientY;
    
    const handleEl = this.resizeHandles.get(handle);
    if (handleEl) {
      handleEl.setPointerCapture(e.pointerId);
      handleEl.addEventListener('pointermove', this.onResizeMove);
      handleEl.addEventListener('pointerup', this.onResizeEnd);
      handleEl.addEventListener('pointercancel', this.onResizeEnd);
    }
  }
  
  private onResizeMove = (e: PointerEvent): void => {
    if (!this.isResizing || !this.resizeHandle) return;
    
    const dx = e.clientX - this.resizeStartX;
    const dy = e.clientY - this.resizeStartY;
    
    let newWidth = this.resizeStartWidth;
    let newHeight = this.resizeStartHeight;
    
    // Calculate new dimensions based on handle
    if (this.resizeHandle.includes('e')) {
      newWidth = this.resizeStartWidth + dx;
    }
    if (this.resizeHandle.includes('w')) {
      newWidth = this.resizeStartWidth - dx;
    }
    if (this.resizeHandle.includes('s')) {
      newHeight = this.resizeStartHeight + dy;
    }
    if (this.resizeHandle.includes('n')) {
      newHeight = this.resizeStartHeight - dy;
    }
    
    // Apply constraints
    newWidth = Math.max(this._minWidth, Math.min(this._maxWidth, newWidth));
    newHeight = Math.max(this._minHeight, Math.min(this._maxHeight, newHeight));
    
    this.setSize(newWidth, newHeight);
  };
  
  private onResizeEnd = (e: PointerEvent): void => {
    if (!this.isResizing) return;
    
    this.isResizing = false;
    this._state = this._selected ? 'selected' : 'idle';
    this.container.dataset.cardState = this.computeState();
    
    const handleEl = this.resizeHandles.get(this.resizeHandle!);
    if (handleEl) {
      handleEl.releasePointerCapture(e.pointerId);
      handleEl.removeEventListener('pointermove', this.onResizeMove);
      handleEl.removeEventListener('pointerup', this.onResizeEnd);
      handleEl.removeEventListener('pointercancel', this.onResizeEnd);
    }
    
    this.resizeHandle = null;
    this.options.lifecycle?.onResize?.(this._width, this._height);
  };
  
  // ===========================================================================
  // PORT HANDLING
  // ===========================================================================
  
  /**
   * Change 208: Port hover now checks canonical compatibility when a drag
   * is in progress, highlighting only compatible targets using validateConnection().
   */
  private onPortHover(portId: string, isHovering: boolean): void {
    const port = this.ports.get(portId);
    const el = this.portElements.get(portId);

    if (port && el) {
      port.highlighted = isHovering;
      el.classList.toggle('card-port-highlighted', isHovering);
      // If a connection drag is active, also apply compatibility styling
      if (isHovering && this.activeDragSourcePort) {
        const sourceSpec = this.resolvePortSpec(this.activeDragSourcePort);
        const targetSpec = this.resolvePortSpec(port);
        if (sourceSpec && targetSpec) {
          // Must have opposite directions (output -> input)
          const oppositeDirection = sourceSpec.direction !== targetSpec.direction;
          // Check type compatibility using canonical validation
          const validation = validateConnection(sourceSpec.type, targetSpec.type);
          const compatible = oppositeDirection && validation.allowed;
          
          el.classList.toggle('card-port-compatible', compatible);
          el.classList.toggle('card-port-incompatible', !compatible);
        }
      } else if (!isHovering) {
        el.classList.remove('card-port-compatible', 'card-port-incompatible');
      }
    }
  }

  /** Resolve a port definition to a canonical PortSpec (Change 208). */
  private resolvePortSpec(port: PortDefinition | PortDefinitionV2): PortSpec | null {
    if ('direction' in port && 'portType' in port) {
      return { direction: port.direction, type: port.portType };
    }
    if ('type' in port && typeof port.type === 'string') {
      return parseUIPortType(port.type as UIPortType);
    }
    return null;
  }

  /** Active drag source port reference (set externally during connection drag). */
  private activeDragSourcePort: (PortDefinition | PortDefinitionV2) | null = null;
  
  private onPortDragStart(e: PointerEvent, portId: string): void {
    e.stopPropagation();
    // Emit event for connection creation
    this.container.dispatchEvent(new CustomEvent('port-drag-start', {
      bubbles: true,
      detail: { cardId: this.id, portId }
    }));
  }
  
  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================
  
  private setupAccessibility(): void {
    this.container.setAttribute('role', 'option');
    this.container.setAttribute('tabindex', '0');
    this.container.setAttribute('aria-selected', String(this._selected));
    
    if (this.options.ariaLabel) {
      this.container.setAttribute('aria-label', this.options.ariaLabel);
    } else {
      this.container.setAttribute('aria-label', `${this.type} card: ${this.options.title}`);
    }
    
    if (this.options.ariaDescription) {
      this.container.setAttribute('aria-description', this.options.ariaDescription);
    }
  }
  
  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================
  
  private computeState(): CardState {
    if (this.isDragging) return 'dragging';
    if (this.isResizing) return 'resizing';
    if (this._state === 'loading') return 'loading';
    if (this._state === 'error') return 'error';
    if (this._state === 'disabled') return 'disabled';
    if (this._focused) return 'focused';
    if (this._selected) return 'selected';
    return 'idle';
  }
  
  select(): void {
    if (this._selected) return;
    
    this._selected = true;
    this.container.dataset.cardState = this.computeState();
    this.container.setAttribute('aria-selected', 'true');
    this.options.lifecycle?.onSelect?.();
    
    this.container.dispatchEvent(new CustomEvent('card-select', {
      bubbles: true,
      detail: { cardId: this.id }
    }));
  }
  
  deselect(): void {
    if (!this._selected) return;
    
    this._selected = false;
    this.container.dataset.cardState = this.computeState();
    this.container.setAttribute('aria-selected', 'false');
    this.options.lifecycle?.onDeselect?.();
    
    this.container.dispatchEvent(new CustomEvent('card-deselect', {
      bubbles: true,
      detail: { cardId: this.id }
    }));
  }
  
  toggleSelected(): void {
    if (this._selected) {
      this.deselect();
    } else {
      this.select();
    }
  }
  
  focus(): void {
    this.container.focus();
  }
  
  blur(): void {
    this.container.blur();
  }
  
  setLoading(loading: boolean): void {
    this._state = loading ? 'loading' : 'idle';
    this.container.dataset.cardState = this.computeState();
    this.container.classList.toggle('card-loading', loading);
  }
  
  setError(error: boolean, message?: string): void {
    this._state = error ? 'error' : 'idle';
    this.container.dataset.cardState = this.computeState();
    this.container.classList.toggle('card-error', error);
    
    if (error && message) {
      this.container.setAttribute('aria-invalid', 'true');
      this.container.setAttribute('aria-errormessage', message);
    } else {
      this.container.removeAttribute('aria-invalid');
      this.container.removeAttribute('aria-errormessage');
    }
  }
  
  setDisabled(disabled: boolean): void {
    this._state = disabled ? 'disabled' : 'idle';
    this.container.dataset.cardState = this.computeState();
    this.container.classList.toggle('card-disabled', disabled);
    this.container.setAttribute('aria-disabled', String(disabled));
    
    if (disabled) {
      this.container.removeAttribute('tabindex');
    } else {
      this.container.setAttribute('tabindex', '0');
    }
  }
  
  // ===========================================================================
  // COLLAPSE
  // ===========================================================================
  
  toggleCollapse(): void {
    this._collapsed = !this._collapsed;
    this.container.classList.toggle('card-collapsed', this._collapsed);
    
    const collapseBtn = this.container.querySelector('.card-collapse-btn');
    if (collapseBtn) {
      collapseBtn.innerHTML = this.getIconSVG(this._collapsed ? 'chevron-right' : 'chevron-down');
      collapseBtn.setAttribute('title', this._collapsed ? 'Expand' : 'Collapse');
    }
    
    // Animate height
    if (this._collapsed) {
      this.body.style.display = 'none';
      this.footer.style.display = 'none';
    } else {
      this.body.style.display = '';
      this.footer.style.display = '';
    }
  }
  
  // ===========================================================================
  // ANIMATION
  // ===========================================================================
  
  animate(animation: CardAnimation, duration = 300): Promise<void> {
    return new Promise((resolve) => {
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }
      
      this.container.classList.add(`card-animation-${animation}`);
      
      setTimeout(() => {
        this.container.classList.remove(`card-animation-${animation}`);
        resolve();
      }, duration);
    });
  }
  
  // ===========================================================================
  // BADGES
  // ===========================================================================
  
  setBadge(id: string, value: string | number): void {
    const badge = this.badges.get(id);
    const el = this.badgeElements.get(id);
    
    if (badge && el) {
      badge.value = value;
      const valueEl = el.querySelector('.card-badge-value');
      if (valueEl) {
        valueEl.textContent = String(value);
      }
    }
  }
  
  removeBadge(id: string): void {
    const el = this.badgeElements.get(id);
    if (el) {
      el.remove();
      this.badgeElements.delete(id);
      this.badges.delete(id);
    }
  }
  
  addBadge(badge: CardBadge): void {
    if (this.badges.has(badge.id)) {
      this.setBadge(badge.id, badge.value);
      return;
    }
    
    this.badges.set(badge.id, badge);
    const el = this.createBadgeElement(badge);
    this.badgeElements.set(badge.id, el);
    this.container.appendChild(el);
  }
  
  // ===========================================================================
  // PORTS
  // ===========================================================================
  
  setPortConnected(portId: string, connected: boolean): void {
    const port = this.ports.get(portId);
    const el = this.portElements.get(portId);
    
    if (port && el) {
      port.connected = connected;
      el.classList.toggle('card-port-connected', connected);
    }
  }
  
  getPortPosition(portId: string): { x: number; y: number } | null {
    const el = this.portElements.get(portId);
    if (!el) return null;
    
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }
  
  // ===========================================================================
  // SIZE
  // ===========================================================================
  
  setSize(width: number, height: number): void {
    this._width = Math.max(this._minWidth, Math.min(this._maxWidth, width));
    this._height = Math.max(this._minHeight, Math.min(this._maxHeight, height));
    
    this.container.style.width = `${this._width}px`;
    this.container.style.height = `${this._height}px`;
  }
  
  getSize(): { width: number; height: number } {
    return { width: this._width, height: this._height };
  }
  
  // ===========================================================================
  // CONTENT
  // ===========================================================================
  
  setTitle(title: string): void {
    this.options.title = title;
    const titleEl = this.header.querySelector('.card-title');
    if (titleEl) {
      titleEl.textContent = title;
    }
  }
  
  setSubtitle(subtitle: string): void {
    this.options.subtitle = subtitle;
    let subtitleEl = this.header.querySelector('.card-subtitle') as HTMLElement;
    
    if (!subtitleEl) {
      subtitleEl = document.createElement('span');
      subtitleEl.className = 'card-subtitle';
      const container = this.header.querySelector('.card-title-container');
      container?.appendChild(subtitleEl);
    }
    
    subtitleEl.textContent = subtitle;
  }
  
  setBodyContent(content: HTMLElement | string): void {
    this.body.innerHTML = '';
    
    if (typeof content === 'string') {
      this.body.innerHTML = content;
    } else {
      this.body.appendChild(content);
    }
  }
  
  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================
  
  close(): void {
    this.animate('exit').then(() => {
      this.dispose();
      this.container.dispatchEvent(new CustomEvent('card-close', {
        bubbles: true,
        detail: { cardId: this.id }
      }));
    });
  }
  
  dispose(): void {
    this.options.lifecycle?.onUnmount?.();
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    this.removeDragGhost();
    this.container.remove();
    
    this.portElements.clear();
    this.badgeElements.clear();
    this.resizeHandles.clear();
  }
  
  // ===========================================================================
  // DOM ACCESS
  // ===========================================================================
  
  getElement(): HTMLElement {
    return this.container;
  }
  
  getHeaderElement(): HTMLElement {
    return this.header;
  }
  
  getBodyElement(): HTMLElement {
    return this.body;
  }
  
  getFooterElement(): HTMLElement {
    return this.footer;
  }
  
  // ===========================================================================
  // THUMBNAIL
  // ===========================================================================
  
  async generateThumbnail(width = 120, height = 90): Promise<string> {
    // Use html2canvas or similar library
    // For now, return a placeholder
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = this.options.color ?? '#6366f1';
      ctx.fillRect(0, 0, width, height);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.options.title, width / 2, height / 2);
    }
    
    return canvas.toDataURL('image/png');
  }
  
  // ===========================================================================
  // HELPERS
  // ===========================================================================
  
  private getIconSVG(name: string): string {
    const icons: Record<string, string> = {
      'chevron-down': '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4.5 6l3.5 3.5L11.5 6" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>',
      'chevron-right': '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6 4.5l3.5 3.5L6 11.5" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>',
      'x': '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5"/></svg>',
      'piano': '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" fill="none"/><line x1="5" y1="3" x2="5" y2="9" stroke="currentColor"/><line x1="8" y1="3" x2="8" y2="9" stroke="currentColor"/><line x1="11" y1="3" x2="11" y2="9" stroke="currentColor"/></svg>',
    };
    
    return icons[name] ?? `<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" stroke="currentColor" fill="none"/></svg>`;
  }
  
  // ===========================================================================
  // GETTERS
  // ===========================================================================
  
  get state(): CardState { return this._state; }
  get selected(): boolean { return this._selected; }
  get focused(): boolean { return this._focused; }
  get collapsed(): boolean { return this._collapsed; }
  get width(): number { return this._width; }
  get height(): number { return this._height; }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createCard(options: CardOptions): CardComponent {
  return new CardComponent(options);
}

// ============================================================================
// CSS
// ============================================================================

export const CARD_COMPONENT_CSS = `
.card-component {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--surface-2, #1a1a2e);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  user-select: none;
}

.card-component:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.card-component[data-card-state="selected"] {
  border-color: var(--card-color, #6366f1);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3);
}

.card-component[data-card-state="focused"] {
  outline: none;
}

.card-component[data-card-state="focused"] .card-focus-ring {
  opacity: 1;
}

.card-component[data-card-state="dragging"] {
  opacity: 0.5;
  cursor: grabbing;
}

.card-component[data-card-state="loading"] {
  pointer-events: none;
}

.card-component[data-card-state="loading"]::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-component[data-card-state="error"] {
  border-color: var(--accent-error, #ef4444);
}

.card-component[data-card-state="disabled"] {
  opacity: 0.5;
  pointer-events: none;
}

.card-component.card-collapsed {
  height: auto !important;
}

/* Focus ring */
.card-focus-ring {
  position: absolute;
  inset: -2px;
  border: 2px solid var(--card-color, #6366f1);
  border-radius: 10px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

/* Header */
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: grab;
}

.card-header:active {
  cursor: grabbing;
}

.card-icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  color: var(--card-color, #6366f1);
}

.card-title-container {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary, #f8fafc);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-subtitle {
  font-size: 11px;
  color: var(--text-muted, #64748b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-header-actions {
  display: flex;
  gap: 4px;
}

.card-action-btn {
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text-muted, #64748b);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.1s ease, color 0.1s ease;
}

.card-action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary, #f8fafc);
}

.card-close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: var(--accent-error, #ef4444);
}

/* Body */
.card-body {
  flex: 1;
  padding: 12px;
  overflow: auto;
}

/* Footer */
.card-footer {
  padding: 8px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 11px;
  color: var(--text-muted, #64748b);
}

/* Ports */
.card-port {
  position: absolute;
  width: 12px;
  height: 12px;
  cursor: crosshair;
  z-index: 10;
}

.card-port-indicator {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid currentColor;
  background: var(--surface-2, #1a1a2e);
  transition: transform 0.1s ease, background 0.1s ease;
}

/* Legacy direction-encoded port type classes */
.card-port-audio_in,
.card-port-audio_out,
.card-port-type-audio {
  color: var(--stack-instrument, #6366f1);
}

.card-port-midi_in,
.card-port-midi_out,
.card-port-type-midi,
.card-port-type-notes {
  color: var(--stack-midi, #22c55e);
}

.card-port-mod_in,
.card-port-mod_out,
.card-port-type-modulation,
.card-port-type-control {
  color: var(--accent-warning, #f59e0b);
}

.card-port-trigger_in,
.card-port-trigger_out,
.card-port-type-trigger,
.card-port-type-gate,
.card-port-type-clock,
.card-port-type-transport {
  color: var(--accent-info, #ec4899);
}

.card-port:hover .card-port-indicator,
.card-port-highlighted .card-port-indicator {
  transform: scale(1.3);
  background: currentColor;
}

.card-port-connected .card-port-indicator {
  background: currentColor;
}

.card-port-label {
  position: absolute;
  white-space: nowrap;
  font-size: 10px;
  color: var(--text-secondary, #94a3b8);
  background: var(--surface-3, #242438);
  padding: 2px 6px;
  border-radius: 4px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.card-port:hover .card-port-label {
  opacity: 1;
}

.card-port-top .card-port-label { bottom: 100%; margin-bottom: 4px; }
.card-port-bottom .card-port-label { top: 100%; margin-top: 4px; }
.card-port-left .card-port-label { left: 100%; margin-left: 4px; }
.card-port-right .card-port-label { right: 100%; margin-right: 4px; }

/* Badges */
.card-badge {
  position: absolute;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  color: white;
  pointer-events: none;
}

.card-badge-top-left { top: -6px; left: -6px; }
.card-badge-top-right { top: -6px; right: -6px; }
.card-badge-bottom-left { bottom: -6px; left: -6px; }
.card-badge-bottom-right { bottom: -6px; right: -6px; }

.card-badge-status { background: var(--accent-info, #06b6d4); }
.card-badge-count { background: var(--accent-primary, #6366f1); }
.card-badge-warning { background: var(--accent-warning, #f59e0b); }
.card-badge-error { background: var(--accent-error, #ef4444); }
.card-badge-info { background: var(--accent-info, #06b6d4); }

/* Resize handles */
.card-resize-handle {
  position: absolute;
  z-index: 20;
}

.card-resize-n, .card-resize-s { left: 8px; right: 8px; height: 6px; cursor: ns-resize; }
.card-resize-e, .card-resize-w { top: 8px; bottom: 8px; width: 6px; cursor: ew-resize; }
.card-resize-n { top: -3px; }
.card-resize-s { bottom: -3px; }
.card-resize-e { right: -3px; }
.card-resize-w { left: -3px; }

.card-resize-ne, .card-resize-nw, .card-resize-se, .card-resize-sw {
  width: 12px;
  height: 12px;
}

.card-resize-ne { top: -3px; right: -3px; cursor: nesw-resize; }
.card-resize-nw { top: -3px; left: -3px; cursor: nwse-resize; }
.card-resize-se { bottom: -3px; right: -3px; cursor: nwse-resize; }
.card-resize-sw { bottom: -3px; left: -3px; cursor: nesw-resize; }

/* Animations */
.card-animation-enter {
  animation: cardEnter 0.3s ease forwards;
}

.card-animation-exit {
  animation: cardExit 0.3s ease forwards;
}

.card-animation-shake {
  animation: cardShake 0.3s ease;
}

.card-animation-pulse {
  animation: cardPulse 0.5s ease;
}

@keyframes cardEnter {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes cardExit {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.9);
  }
}

@keyframes cardShake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}

@keyframes cardPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

/* Drag ghost */
.card-drag-ghost {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .card-component,
  .card-port-indicator,
  .card-action-btn {
    transition: none;
  }
  
  .card-animation-enter,
  .card-animation-exit,
  .card-animation-shake,
  .card-animation-pulse {
    animation: none;
  }
}
`;

/**
 * Change 256: Backward compatibility alias.
 * @deprecated Use UICardComponent instead.
 */
export const CardComponent = UICardComponent;
