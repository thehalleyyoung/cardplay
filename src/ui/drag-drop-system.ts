/**
 * @fileoverview Drag & Drop System
 * 
 * Comprehensive drag-drop implementation for CardPlay UI.
 * Bridges Phase 4 layout system with Phase 43 components.
 * 
 * Features:
 * - Card dragging with preview
 * - Stack reordering
 * - Cross-stack card moves
 * - Connection creation by dragging
 * - Touch support
 * - Accessibility (keyboard drag)
 * - Snap to grid
 * - Drop zone highlighting
 * 
 * Complements: cardplayui.md Section 10 (Interaction Patterns)
 * Used by: card-component.ts, stack-component.ts
 * 
 * @module @cardplay/ui/drag-drop-system
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Draggable item type
 */
export type DragItemType = 
  | 'card'
  | 'stack'
  | 'connection'
  | 'port'
  | 'resize-handle'
  | 'external';

/**
 * Drop effect
 */
export type DropEffect = 'none' | 'copy' | 'move' | 'link';

/**
 * Drag source data
 */
export interface DragSource {
  type: DragItemType;
  id: string;
  data: Record<string, unknown>;
  element: HTMLElement;
  origin: { x: number; y: number };
}

/**
 * Drop target data
 */
export interface DropTarget {
  type: DragItemType | 'zone';
  id: string;
  element: HTMLElement;
  acceptsTypes: DragItemType[];
  bounds: DOMRect;
}

/**
 * Drag state
 */
export interface DragState {
  isDragging: boolean;
  source: DragSource | null;
  currentPosition: { x: number; y: number };
  delta: { x: number; y: number };
  modifiers: {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
    meta: boolean;
  };
  hoveredTarget: DropTarget | null;
  possibleTargets: DropTarget[];
  dropEffect: DropEffect;
  preview: HTMLElement | null;
}

/**
 * Drag event detail
 */
export interface DragEventDetail {
  source: DragSource;
  position: { x: number; y: number };
  delta: { x: number; y: number };
  modifiers: DragState['modifiers'];
}

/**
 * Drop event detail
 */
export interface DropEventDetail {
  source: DragSource;
  target: DropTarget;
  position: { x: number; y: number };
  effect: DropEffect;
}

/**
 * Drag manager options
 */
export interface DragManagerOptions {
  container: HTMLElement;
  gridSize?: number;
  snapToGrid?: boolean;
  threshold?: number;  // Minimum distance before drag starts
  previewOpacity?: number;
  constrainToContainer?: boolean;
  enableTouch?: boolean;
  enableKeyboardDrag?: boolean;
}

// ============================================================================
// DRAG MANAGER
// ============================================================================

/**
 * Manages all drag-drop operations
 */
export class DragManager {
  private container: HTMLElement;
  private options: Required<DragManagerOptions>;
  
  // State
  private state: DragState = {
    isDragging: false,
    source: null,
    currentPosition: { x: 0, y: 0 },
    delta: { x: 0, y: 0 },
    modifiers: { shift: false, ctrl: false, alt: false, meta: false },
    hoveredTarget: null,
    possibleTargets: [],
    dropEffect: 'none',
    preview: null,
  };
  
  // Registered elements
  private sources: Map<string, DragSource> = new Map();
  private targets: Map<string, DropTarget> = new Map();
  
  // Touch tracking
  private touchId: number | null = null;
  
  // Keyboard drag
  private keyboardDragActive = false;
  private keyboardDragPosition = { x: 0, y: 0 };
  
  constructor(options: DragManagerOptions) {
    this.container = options.container;
    this.options = {
      gridSize: options.gridSize ?? 8,
      snapToGrid: options.snapToGrid ?? true,
      threshold: options.threshold ?? 5,
      previewOpacity: options.previewOpacity ?? 0.6,
      constrainToContainer: options.constrainToContainer ?? true,
      enableTouch: options.enableTouch ?? true,
      enableKeyboardDrag: options.enableKeyboardDrag ?? true,
      container: options.container,
    };
    
    this.setupEventListeners();
  }
  
  // ===========================================================================
  // REGISTRATION
  // ===========================================================================
  
  /**
   * Register a draggable element
   */
  registerDraggable(
    element: HTMLElement,
    type: DragItemType,
    id: string,
    data: Record<string, unknown> = {}
  ): void {
    const source: DragSource = {
      type,
      id,
      data,
      element,
      origin: { x: 0, y: 0 },
    };
    
    this.sources.set(id, source);
    
    element.setAttribute('draggable', 'false'); // We handle our own drag
    element.setAttribute('data-draggable', 'true');
    element.setAttribute('data-draggable-id', id);
    element.setAttribute('data-draggable-type', type);
    element.style.cursor = 'grab';
  }
  
  /**
   * Unregister a draggable
   */
  unregisterDraggable(id: string): void {
    this.sources.delete(id);
  }
  
  /**
   * Register a drop target
   */
  registerDropTarget(
    element: HTMLElement,
    type: DragItemType | 'zone',
    id: string,
    acceptsTypes: DragItemType[]
  ): void {
    const target: DropTarget = {
      type,
      id,
      element,
      acceptsTypes,
      bounds: element.getBoundingClientRect(),
    };
    
    this.targets.set(id, target);
    
    element.setAttribute('data-drop-target', 'true');
    element.setAttribute('data-drop-target-id', id);
  }
  
  /**
   * Unregister a drop target
   */
  unregisterDropTarget(id: string): void {
    this.targets.delete(id);
  }
  
  /**
   * Update target bounds (after layout changes)
   */
  updateTargetBounds(id: string): void {
    const target = this.targets.get(id);
    if (target) {
      target.bounds = target.element.getBoundingClientRect();
    }
  }
  
  /**
   * Update all target bounds
   */
  updateAllBounds(): void {
    for (const target of this.targets.values()) {
      target.bounds = target.element.getBoundingClientRect();
    }
  }
  
  // ===========================================================================
  // EVENT SETUP
  // ===========================================================================
  
  private setupEventListeners(): void {
    // Mouse events
    this.container.addEventListener('pointerdown', this.onPointerDown);
    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);
    document.addEventListener('pointercancel', this.onPointerCancel);
    
    // Keyboard events (for modifiers and keyboard drag)
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    
    // Touch events (if enabled)
    if (this.options.enableTouch) {
      this.container.addEventListener('touchstart', this.onTouchStart, { passive: false });
      document.addEventListener('touchmove', this.onTouchMove, { passive: false });
      document.addEventListener('touchend', this.onTouchEnd);
      document.addEventListener('touchcancel', this.onTouchCancel);
    }
  }
  
  // ===========================================================================
  // POINTER HANDLING
  // ===========================================================================
  
  private onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0) return; // Left click only
    
    const draggableEl = this.findDraggableAncestor(e.target as HTMLElement);
    if (!draggableEl) return;
    
    const id = draggableEl.dataset.draggableId;
    if (!id) return;
    
    const source = this.sources.get(id);
    if (!source) return;
    
    // Start potential drag
    source.origin = { x: e.clientX, y: e.clientY };
    this.state.source = source;
    this.state.currentPosition = { x: e.clientX, y: e.clientY };
    this.state.delta = { x: 0, y: 0 };
    
    // Capture pointer
    draggableEl.setPointerCapture(e.pointerId);
    
    e.preventDefault();
  };
  
  private onPointerMove = (e: PointerEvent): void => {
    if (!this.state.source) return;
    
    const dx = e.clientX - this.state.source.origin.x;
    const dy = e.clientY - this.state.source.origin.y;
    
    // Check threshold
    if (!this.state.isDragging) {
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < this.options.threshold) return;
      
      this.startDrag();
    }
    
    // Update position
    let x = e.clientX;
    let y = e.clientY;
    
    // Snap to grid
    if (this.options.snapToGrid) {
      const gridX = Math.round((x - this.state.source.origin.x) / this.options.gridSize) * this.options.gridSize;
      const gridY = Math.round((y - this.state.source.origin.y) / this.options.gridSize) * this.options.gridSize;
      x = this.state.source.origin.x + gridX;
      y = this.state.source.origin.y + gridY;
    }
    
    // Constrain to container
    if (this.options.constrainToContainer) {
      const containerRect = this.container.getBoundingClientRect();
      x = Math.max(containerRect.left, Math.min(containerRect.right, x));
      y = Math.max(containerRect.top, Math.min(containerRect.bottom, y));
    }
    
    this.state.currentPosition = { x, y };
    this.state.delta = { x: x - this.state.source.origin.x, y: y - this.state.source.origin.y };
    this.state.modifiers = {
      shift: e.shiftKey,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      meta: e.metaKey,
    };
    
    this.updatePreview();
    this.updateHoveredTarget();
    this.dispatchDragMove();
  };
  
  private onPointerUp = (_e: PointerEvent): void => {
    if (!this.state.source) return;
    
    if (this.state.isDragging) {
      this.endDrag();
    } else {
      // Was just a click, not a drag
      this.resetState();
    }
  };
  
  private onPointerCancel = (_e: PointerEvent): void => {
    this.cancelDrag();
  };
  
  // ===========================================================================
  // TOUCH HANDLING
  // ===========================================================================
  
  private onTouchStart = (e: TouchEvent): void => {
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    if (!touch) return;
    
    const draggableEl = this.findDraggableAncestor(e.target as HTMLElement);
    if (!draggableEl) return;
    
    const id = draggableEl.dataset.draggableId;
    if (!id) return;
    
    const source = this.sources.get(id);
    if (!source) return;
    
    this.touchId = touch.identifier;
    source.origin = { x: touch.clientX, y: touch.clientY };
    this.state.source = source;
    this.state.currentPosition = { x: touch.clientX, y: touch.clientY };
    
    e.preventDefault();
  };
  
  private onTouchMove = (e: TouchEvent): void => {
    if (this.touchId === null || !this.state.source) return;
    
    const touch = Array.from(e.touches).find(t => t.identifier === this.touchId);
    if (!touch) return;
    
    const dx = touch.clientX - this.state.source.origin.x;
    const dy = touch.clientY - this.state.source.origin.y;
    
    if (!this.state.isDragging) {
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < this.options.threshold) return;
      
      this.startDrag();
    }
    
    this.state.currentPosition = { x: touch.clientX, y: touch.clientY };
    this.state.delta = { x: dx, y: dy };
    
    this.updatePreview();
    this.updateHoveredTarget();
    this.dispatchDragMove();
    
    e.preventDefault();
  };
  
  private onTouchEnd = (_e: TouchEvent): void => {
    if (this.touchId === null) return;
    
    if (this.state.isDragging) {
      this.endDrag();
    }
    
    this.touchId = null;
    this.resetState();
  };
  
  private onTouchCancel = (_e: TouchEvent): void => {
    this.cancelDrag();
    this.touchId = null;
  };
  
  // ===========================================================================
  // KEYBOARD HANDLING
  // ===========================================================================
  
  private onKeyDown = (e: KeyboardEvent): void => {
    // Update modifiers during drag
    if (this.state.isDragging) {
      this.state.modifiers = {
        shift: e.shiftKey,
        ctrl: e.ctrlKey,
        alt: e.altKey,
        meta: e.metaKey,
      };
      
      // Escape cancels drag
      if (e.key === 'Escape') {
        this.cancelDrag();
        return;
      }
    }
    
    // Keyboard drag (for accessibility)
    if (this.options.enableKeyboardDrag && this.keyboardDragActive) {
      const step = e.shiftKey ? this.options.gridSize * 4 : this.options.gridSize;
      
      switch (e.key) {
        case 'ArrowUp':
          this.keyboardDragPosition.y -= step;
          this.updateKeyboardDrag();
          e.preventDefault();
          break;
        case 'ArrowDown':
          this.keyboardDragPosition.y += step;
          this.updateKeyboardDrag();
          e.preventDefault();
          break;
        case 'ArrowLeft':
          this.keyboardDragPosition.x -= step;
          this.updateKeyboardDrag();
          e.preventDefault();
          break;
        case 'ArrowRight':
          this.keyboardDragPosition.x += step;
          this.updateKeyboardDrag();
          e.preventDefault();
          break;
        case 'Enter':
        case ' ':
          this.endDrag();
          this.keyboardDragActive = false;
          e.preventDefault();
          break;
        case 'Escape':
          this.cancelDrag();
          this.keyboardDragActive = false;
          e.preventDefault();
          break;
      }
    }
  };
  
  private onKeyUp = (e: KeyboardEvent): void => {
    if (this.state.isDragging) {
      this.state.modifiers = {
        shift: e.shiftKey,
        ctrl: e.ctrlKey,
        alt: e.altKey,
        meta: e.metaKey,
      };
    }
  };
  
  /**
   * Start keyboard drag (called by accessibility system)
   */
  startKeyboardDrag(id: string): boolean {
    const source = this.sources.get(id);
    if (!source) return false;
    
    const rect = source.element.getBoundingClientRect();
    source.origin = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    
    this.state.source = source;
    this.keyboardDragPosition = { ...source.origin };
    this.keyboardDragActive = true;
    
    this.startDrag();
    
    return true;
  }
  
  private updateKeyboardDrag(): void {
    if (!this.state.source) return;
    
    this.state.currentPosition = { ...this.keyboardDragPosition };
    this.state.delta = {
      x: this.keyboardDragPosition.x - this.state.source.origin.x,
      y: this.keyboardDragPosition.y - this.state.source.origin.y,
    };
    
    this.updatePreview();
    this.updateHoveredTarget();
    this.dispatchDragMove();
  }
  
  // ===========================================================================
  // DRAG LIFECYCLE
  // ===========================================================================
  
  private startDrag(): void {
    if (!this.state.source) return;
    
    this.state.isDragging = true;
    this.state.possibleTargets = this.findPossibleTargets(this.state.source.type);
    
    // Create preview
    this.createPreview();
    
    // Add dragging class
    this.state.source.element.classList.add('dragging');
    this.container.classList.add('has-drag');
    
    // Highlight possible targets
    for (const target of this.state.possibleTargets) {
      target.element.classList.add('drop-possible');
    }
    
    // Dispatch event
    this.container.dispatchEvent(new CustomEvent('drag-start', {
      bubbles: true,
      detail: {
        source: this.state.source,
        position: this.state.currentPosition,
        delta: this.state.delta,
        modifiers: this.state.modifiers,
      } as DragEventDetail,
    }));
  }
  
  private endDrag(): void {
    if (!this.state.source) return;
    
    // Check for valid drop
    if (this.state.hoveredTarget && this.canDrop(this.state.source, this.state.hoveredTarget)) {
      // Dispatch drop event
      this.container.dispatchEvent(new CustomEvent('drop', {
        bubbles: true,
        detail: {
          source: this.state.source,
          target: this.state.hoveredTarget,
          position: this.state.currentPosition,
          effect: this.state.dropEffect,
        } as DropEventDetail,
      }));
    } else {
      // No valid drop, revert
      this.container.dispatchEvent(new CustomEvent('drag-cancel', {
        bubbles: true,
        detail: {
          source: this.state.source,
          position: this.state.currentPosition,
          delta: this.state.delta,
          modifiers: this.state.modifiers,
        } as DragEventDetail,
      }));
    }
    
    this.cleanupDrag();
    this.resetState();
  }
  
  private cancelDrag(): void {
    if (!this.state.isDragging || !this.state.source) return;
    
    this.container.dispatchEvent(new CustomEvent('drag-cancel', {
      bubbles: true,
      detail: {
        source: this.state.source,
        position: this.state.currentPosition,
        delta: this.state.delta,
        modifiers: this.state.modifiers,
      } as DragEventDetail,
    }));
    
    this.cleanupDrag();
    this.resetState();
  }
  
  private cleanupDrag(): void {
    // Remove preview
    this.state.preview?.remove();
    
    // Remove classes
    this.state.source?.element.classList.remove('dragging');
    this.container.classList.remove('has-drag');
    
    for (const target of this.state.possibleTargets) {
      target.element.classList.remove('drop-possible', 'drop-hover', 'drop-invalid');
    }
    
    this.state.hoveredTarget?.element.classList.remove('drop-hover');
  }
  
  private resetState(): void {
    this.state = {
      isDragging: false,
      source: null,
      currentPosition: { x: 0, y: 0 },
      delta: { x: 0, y: 0 },
      modifiers: { shift: false, ctrl: false, alt: false, meta: false },
      hoveredTarget: null,
      possibleTargets: [],
      dropEffect: 'none',
      preview: null,
    };
  }
  
  // ===========================================================================
  // PREVIEW
  // ===========================================================================
  
  private createPreview(): void {
    if (!this.state.source) return;
    
    const original = this.state.source.element;
    const rect = original.getBoundingClientRect();
    
    const preview = original.cloneNode(true) as HTMLElement;
    preview.classList.add('drag-preview');
    preview.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      opacity: ${this.options.previewOpacity};
      pointer-events: none;
      z-index: 10000;
      transform-origin: center center;
      transition: transform 0.1s ease;
    `;
    
    document.body.appendChild(preview);
    this.state.preview = preview;
  }
  
  private updatePreview(): void {
    if (!this.state.preview || !this.state.source) return;
    
    const original = this.state.source.element.getBoundingClientRect();
    const x = original.left + this.state.delta.x;
    const y = original.top + this.state.delta.y;
    
    this.state.preview.style.left = `${x}px`;
    this.state.preview.style.top = `${y}px`;
    
    // Scale effect based on modifiers
    if (this.state.modifiers.shift) {
      this.state.preview.style.transform = 'scale(1.05)';
    } else {
      this.state.preview.style.transform = '';
    }
  }
  
  // ===========================================================================
  // DROP TARGETS
  // ===========================================================================
  
  private findPossibleTargets(sourceType: DragItemType): DropTarget[] {
    const possible: DropTarget[] = [];
    
    for (const target of this.targets.values()) {
      if (target.acceptsTypes.includes(sourceType)) {
        possible.push(target);
      }
    }
    
    return possible;
  }
  
  private updateHoveredTarget(): void {
    const { x, y } = this.state.currentPosition;
    
    // Find target under pointer
    let newTarget: DropTarget | null = null;
    
    for (const target of this.state.possibleTargets) {
      const bounds = target.bounds;
      
      if (x >= bounds.left && x <= bounds.right &&
          y >= bounds.top && y <= bounds.bottom) {
        newTarget = target;
        break;
      }
    }
    
    // Update hovered state
    if (newTarget !== this.state.hoveredTarget) {
      // Leave old target
      if (this.state.hoveredTarget) {
        this.state.hoveredTarget.element.classList.remove('drop-hover');
        this.container.dispatchEvent(new CustomEvent('drag-leave', {
          bubbles: true,
          detail: { target: this.state.hoveredTarget },
        }));
      }
      
      // Enter new target
      this.state.hoveredTarget = newTarget;
      
      if (newTarget) {
        const canDrop = this.canDrop(this.state.source!, newTarget);
        
        newTarget.element.classList.add('drop-hover');
        newTarget.element.classList.toggle('drop-invalid', !canDrop);
        
        this.state.dropEffect = canDrop 
          ? (this.state.modifiers.alt ? 'copy' : 'move')
          : 'none';
        
        this.container.dispatchEvent(new CustomEvent('drag-enter', {
          bubbles: true,
          detail: { target: newTarget, canDrop },
        }));
      }
    }
  }
  
  private canDrop(source: DragSource, target: DropTarget): boolean {
    // Can't drop on self
    if (source.id === target.id) return false;
    
    // Check accepts
    if (!target.acceptsTypes.includes(source.type)) return false;
    
    // Additional validation can be done via event
    const event = new CustomEvent('can-drop', {
      bubbles: true,
      cancelable: true,
      detail: { source, target },
    });
    
    this.container.dispatchEvent(event);
    return !event.defaultPrevented;
  }
  
  private dispatchDragMove(): void {
    this.container.dispatchEvent(new CustomEvent('drag-move', {
      bubbles: true,
      detail: {
        source: this.state.source,
        position: this.state.currentPosition,
        delta: this.state.delta,
        modifiers: this.state.modifiers,
      } as DragEventDetail,
    }));
  }
  
  // ===========================================================================
  // HELPERS
  // ===========================================================================
  
  private findDraggableAncestor(element: HTMLElement): HTMLElement | null {
    let current: HTMLElement | null = element;
    
    while (current && current !== this.container) {
      if (current.dataset.draggable === 'true') {
        return current;
      }
      current = current.parentElement;
    }
    
    return null;
  }
  
  /**
   * Get current drag state (for UI updates)
   */
  getDragState(): Readonly<DragState> {
    return { ...this.state };
  }
  
  /**
   * Check if currently dragging
   */
  isDragging(): boolean {
    return this.state.isDragging;
  }
  
  // ===========================================================================
  // CLEANUP
  // ===========================================================================
  
  dispose(): void {
    this.container.removeEventListener('pointerdown', this.onPointerDown);
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
    document.removeEventListener('pointercancel', this.onPointerCancel);
    
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    
    if (this.options.enableTouch) {
      this.container.removeEventListener('touchstart', this.onTouchStart);
      document.removeEventListener('touchmove', this.onTouchMove);
      document.removeEventListener('touchend', this.onTouchEnd);
      document.removeEventListener('touchcancel', this.onTouchCancel);
    }
    
    this.cleanupDrag();
    this.sources.clear();
    this.targets.clear();
  }
}

// ============================================================================
// CSS FOR DRAG-DROP
// ============================================================================

export const DRAG_DROP_CSS = `
/* Draggable elements */
[data-draggable="true"] {
  cursor: grab;
  user-select: none;
  touch-action: none;
}

[data-draggable="true"]:active {
  cursor: grabbing;
}

[data-draggable="true"].dragging {
  opacity: 0.4;
  cursor: grabbing;
}

/* Drag preview */
.drag-preview {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border-radius: inherit;
}

/* Container during drag */
.has-drag {
  cursor: grabbing;
}

/* Drop targets */
[data-drop-target="true"] {
  transition: all 0.15s ease;
}

[data-drop-target="true"].drop-possible {
  outline: 2px dashed var(--cardplay-accent, #6366f1);
  outline-offset: 2px;
}

[data-drop-target="true"].drop-hover {
  outline: 2px solid var(--cardplay-accent, #6366f1);
  outline-offset: 2px;
  background: var(--cardplay-accent-dim, rgba(99, 102, 241, 0.1));
}

[data-drop-target="true"].drop-invalid {
  outline-color: var(--color-error, #ef4444);
  background: rgba(239, 68, 68, 0.1);
}

/* Connection drag */
.connection-drag-line {
  stroke: var(--cardplay-connection-audio, #6366f1);
  stroke-width: 2;
  stroke-dasharray: 5 5;
  fill: none;
  pointer-events: none;
}

/* Port highlight during connection drag */
[data-port].port-compatible {
  box-shadow: 0 0 0 3px var(--cardplay-accent, #6366f1);
  animation: port-pulse 1s infinite;
}

@keyframes port-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
`;

// ============================================================================
// CONNECTION DRAG HELPER
// ============================================================================

/**
 * Helper for dragging connections between ports
 */
export class ConnectionDragHelper {
  private container: HTMLElement;
  private svg: SVGSVGElement | null = null;
  private line: SVGLineElement | null = null;
  private sourcePort: HTMLElement | null = null;
  private isDragging = false;
  
  constructor(container: HTMLElement) {
    this.container = container;
    this.createSVG();
  }
  
  private createSVG(): void {
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
    `;
    
    this.line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    this.line.classList.add('connection-drag-line');
    this.svg.appendChild(this.line);
  }
  
  /**
   * Start connection drag from a port
   */
  start(port: HTMLElement): void {
    if (!this.svg || !this.line) return;
    
    this.sourcePort = port;
    this.isDragging = true;
    
    const rect = port.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    
    const x = rect.left + rect.width / 2 - containerRect.left;
    const y = rect.top + rect.height / 2 - containerRect.top;
    
    this.line.setAttribute('x1', String(x));
    this.line.setAttribute('y1', String(y));
    this.line.setAttribute('x2', String(x));
    this.line.setAttribute('y2', String(y));
    
    this.container.appendChild(this.svg);
    
    // Highlight compatible ports
    this.highlightCompatiblePorts(port);
  }
  
  /**
   * Update connection line end position
   */
  update(clientX: number, clientY: number): void {
    if (!this.isDragging || !this.line) return;
    
    const containerRect = this.container.getBoundingClientRect();
    const x = clientX - containerRect.left;
    const y = clientY - containerRect.top;
    
    this.line.setAttribute('x2', String(x));
    this.line.setAttribute('y2', String(y));
  }
  
  /**
   * End connection drag
   */
  end(targetPort?: HTMLElement): { source: HTMLElement; target: HTMLElement } | null {
    const result = targetPort && this.sourcePort
      ? { source: this.sourcePort, target: targetPort }
      : null;
    
    this.cancel();
    return result;
  }
  
  /**
   * Cancel connection drag
   */
  cancel(): void {
    this.isDragging = false;
    this.sourcePort = null;
    this.svg?.remove();
    
    // Remove port highlights
    document.querySelectorAll('.port-compatible').forEach(el => {
      el.classList.remove('port-compatible');
    });
  }
  
  private highlightCompatiblePorts(sourcePort: HTMLElement): void {
    const sourceType = sourcePort.dataset.portType;
    const sourceDirection = sourcePort.dataset.portDirection;
    
    // Find compatible ports (opposite direction, same type)
    const targetDirection = sourceDirection === 'output' ? 'input' : 'output';
    
    this.container.querySelectorAll(`[data-port][data-port-direction="${targetDirection}"]`)
      .forEach(port => {
        const el = port as HTMLElement;
        if (el.dataset.portType === sourceType || sourceType === 'any' || el.dataset.portType === 'any') {
          el.classList.add('port-compatible');
        }
      });
  }
  
  /**
   * Check if currently dragging
   */
  isActive(): boolean {
    return this.isDragging;
  }
  
  dispose(): void {
    this.cancel();
    this.svg = null;
    this.line = null;
  }
}

// ============================================================================
// FACTORIES
// ============================================================================

export function createDragManager(options: DragManagerOptions): DragManager {
  return new DragManager(options);
}

export function createConnectionDragHelper(container: HTMLElement): ConnectionDragHelper {
  return new ConnectionDragHelper(container);
}
