/**
 * @fileoverview Deck Template Preview & Editor System.
 * 
 * Provides visual preview and interactive editing for deck templates:
 * - Template preview generation
 * - Interactive template editor
 * - Visual slot configuration
 * - Connection routing editor
 * - Parameter configuration UI
 * 
 * @module @cardplay/user-cards/template-preview
 */

import type { DeckTemplate, TemplateSlot, TemplateConnection, TemplateParam } from './deck-templates';

// ============================================================================
// PREVIEW TYPES
// ============================================================================

/**
 * Template preview configuration.
 */
export interface TemplatePreview {
  /** Template ID */
  templateId: string;
  /** Canvas dimensions */
  width: number;
  /** Canvas dimensions */
  height: number;
  /** Rendered elements */
  elements: PreviewElement[];
  /** Preview style */
  style: PreviewStyle;
  /** Animation enabled */
  animated: boolean;
}

/**
 * Preview element (slot or connection).
 */
export type PreviewElement = PreviewSlot | PreviewConnection;

/**
 * Rendered slot element.
 */
export interface PreviewSlot {
  type: 'slot';
  id: string;
  label: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  cardId?: string;
  optional: boolean;
  ports: Array<{
    id: string;
    name: string;
    type: 'input' | 'output';
    position: { x: number; y: number };
  }>;
  style: SlotStyle;
}

/**
 * Rendered connection element.
 */
export interface PreviewConnection {
  type: 'connection';
  from: string;
  to: string;
  fromPort: string;
  toPort: string;
  path: string; // SVG path data
  style: ConnectionStyle;
}

/**
 * Slot visual style.
 */
export interface SlotStyle {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  textColor: string;
  fontSize: number;
  opacity: number;
  shadow?: string;
}

/**
 * Connection visual style.
 */
export interface ConnectionStyle {
  strokeColor: string;
  strokeWidth: number;
  strokeDasharray?: string;
  opacity: number;
  animated?: boolean;
}

/**
 * Overall preview style theme.
 */
export interface PreviewStyle {
  theme: 'light' | 'dark' | 'high-contrast';
  gridEnabled: boolean;
  gridColor: string;
  gridSpacing: number;
  backgroundColor: string;
  slotDefaults: SlotStyle;
  connectionDefaults: ConnectionStyle;
  highlightColor: string;
  selectionColor: string;
}

/**
 * Preview export options.
 */
export interface PreviewExportOptions {
  /** Export format */
  format: 'svg' | 'png' | 'json';
  /** For PNG: pixel ratio */
  pixelRatio?: number;
  /** Include template metadata */
  includeMetadata?: boolean;
  /** Transparent background */
  transparentBackground?: boolean;
}

// ============================================================================
// EDITOR TYPES
// ============================================================================

/**
 * Template editor state.
 */
export interface TemplateEditorState {
  /** Template being edited */
  template: DeckTemplate;
  /** Selected elements */
  selectedSlots: Set<string>;
  /** Selected connections */
  selectedConnections: Set<number>;
  /** Clipboard */
  clipboard: {
    slots: TemplateSlot[];
    connections: TemplateConnection[];
  } | null;
  /** Undo stack */
  undoStack: DeckTemplate[];
  /** Redo stack */
  redoStack: DeckTemplate[];
  /** Editing mode */
  mode: 'select' | 'add-slot' | 'connect' | 'pan';
  /** View transform */
  viewTransform: {
    offsetX: number;
    offsetY: number;
    scale: number;
  };
  /** Snap to grid */
  snapToGrid: boolean;
  /** Grid size */
  gridSize: number;
}

/**
 * Editor action.
 */
export type EditorAction =
  | { type: 'add-slot'; slot: TemplateSlot }
  | { type: 'remove-slot'; slotId: string }
  | { type: 'move-slot'; slotId: string; position: { x: number; y: number } }
  | { type: 'update-slot'; slotId: string; updates: Partial<TemplateSlot> }
  | { type: 'add-connection'; connection: TemplateConnection }
  | { type: 'remove-connection'; index: number }
  | { type: 'add-param'; param: TemplateParam }
  | { type: 'remove-param'; paramName: string }
  | { type: 'update-param'; paramName: string; updates: Partial<TemplateParam> }
  | { type: 'select-slots'; slotIds: string[] }
  | { type: 'select-connections'; indices: number[] }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'copy' }
  | { type: 'paste'; position: { x: number; y: number } }
  | { type: 'set-mode'; mode: TemplateEditorState['mode'] }
  | { type: 'set-view-transform'; transform: Partial<TemplateEditorState['viewTransform']> }
  | { type: 'toggle-snap-to-grid' };

// ============================================================================
// PREVIEW GENERATOR
// ============================================================================

/**
 * Generates a visual preview of a template.
 */
export class TemplatePreviewGenerator {
  private defaultStyle: PreviewStyle = {
    theme: 'dark',
    gridEnabled: true,
    gridColor: '#333333',
    gridSpacing: 50,
    backgroundColor: '#1a1a1a',
    slotDefaults: {
      backgroundColor: '#2a2a2a',
      borderColor: '#4a4a4a',
      borderWidth: 2,
      borderRadius: 8,
      textColor: '#ffffff',
      fontSize: 14,
      opacity: 1,
      shadow: '0 2px 8px rgba(0,0,0,0.3)',
    },
    connectionDefaults: {
      strokeColor: '#6a9fb5',
      strokeWidth: 2,
      opacity: 0.8,
      animated: false,
    },
    highlightColor: '#ffaa00',
    selectionColor: '#4488ff',
  };
  
  /**
   * Generates preview for a template.
   */
  generatePreview(
    template: DeckTemplate,
    options: {
      width?: number;
      height?: number;
      style?: Partial<PreviewStyle>;
      animated?: boolean;
    } = {}
  ): TemplatePreview {
    const style: PreviewStyle = { ...this.defaultStyle, ...options.style };
    
    // Calculate canvas dimensions
    const bounds = this.calculateBounds(template.slots);
    const padding = 50;
    const width = options.width ?? Math.max(800, bounds.maxX + padding * 2);
    const height = options.height ?? Math.max(600, bounds.maxY + padding * 2);
    
    // Generate slot elements
    const slotElements: PreviewSlot[] = template.slots.map(slot => this.renderSlot(slot, style));
    
    // Generate connection elements
    const connectionElements: PreviewConnection[] = template.connections.map(conn =>
      this.renderConnection(conn, slotElements, style)
    );
    
    return {
      templateId: template.id,
      width,
      height,
      elements: [...slotElements, ...connectionElements],
      style,
      animated: options.animated ?? false,
    };
  }
  
  /**
   * Exports preview to specified format.
   */
  async exportPreview(
    preview: TemplatePreview,
    options: PreviewExportOptions
  ): Promise<string | Blob> {
    switch (options.format) {
      case 'svg':
        return this.exportToSVG(preview, options);
      case 'png':
        return this.exportToPNG(preview, options);
      case 'json':
        return JSON.stringify(preview, null, 2);
    }
  }
  
  private calculateBounds(slots: TemplateSlot[]): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } {
    if (slots.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
    
    const positions = slots.map(s => s.position);
    const slotWidth = 120;
    const slotHeight = 80;
    
    return {
      minX: Math.min(...positions.map(p => p.x)),
      minY: Math.min(...positions.map(p => p.y)),
      maxX: Math.max(...positions.map(p => p.x)) + slotWidth,
      maxY: Math.max(...positions.map(p => p.y)) + slotHeight,
    };
  }
  
  private renderSlot(slot: TemplateSlot, style: PreviewStyle): PreviewSlot {
    const slotWidth = 120;
    const slotHeight = 80;
    const gridSize = 100;
    
    // Calculate pixel position from grid position
    const pixelX = slot.position.x * gridSize;
    const pixelY = slot.position.y * gridSize;
    
    // Generate ports
    const ports = [
      {
        id: `${slot.id}-in`,
        name: 'in',
        type: 'input' as const,
        position: { x: pixelX, y: pixelY + slotHeight / 2 },
      },
      {
        id: `${slot.id}-out`,
        name: 'out',
        type: 'output' as const,
        position: { x: pixelX + slotWidth, y: pixelY + slotHeight / 2 },
      },
    ];
    
    return {
      type: 'slot',
      id: slot.id,
      label: slot.label,
      position: { x: pixelX, y: pixelY },
      size: { width: slotWidth, height: slotHeight },
      cardId: slot.defaultCard ?? '',
      optional: slot.optional ?? false,
      ports,
      style: {
        ...style.slotDefaults,
        opacity: slot.optional ? 0.7 : 1,
      },
    };
  }
  
  private renderConnection(
    conn: TemplateConnection,
    slots: PreviewSlot[],
    style: PreviewStyle
  ): PreviewConnection {
    const fromSlot = slots.find(s => s.id === conn.from);
    const toSlot = slots.find(s => s.id === conn.to);
    
    if (!fromSlot || !toSlot) {
      return {
        type: 'connection',
        from: conn.from,
        to: conn.to,
        fromPort: conn.fromPort,
        toPort: conn.toPort,
        path: '',
        style: style.connectionDefaults,
      };
    }
    
    const fromPort = fromSlot.ports.find(p => p.type === 'output');
    const toPort = toSlot.ports.find(p => p.type === 'input');
    
    if (!fromPort || !toPort) {
      return {
        type: 'connection',
        from: conn.from,
        to: conn.to,
        fromPort: conn.fromPort,
        toPort: conn.toPort,
        path: '',
        style: style.connectionDefaults,
      };
    }
    
    // Generate bezier curve
    const path = this.generateConnectionPath(fromPort.position, toPort.position);
    
    return {
      type: 'connection',
      from: conn.from,
      to: conn.to,
      fromPort: conn.fromPort,
      toPort: conn.toPort,
      path,
      style: style.connectionDefaults,
    };
  }
  
  private generateConnectionPath(
    from: { x: number; y: number },
    to: { x: number; y: number }
  ): string {
    const dx = to.x - from.x;
    const controlOffset = Math.abs(dx) * 0.5;
    
    const cp1x = from.x + controlOffset;
    const cp1y = from.y;
    const cp2x = to.x - controlOffset;
    const cp2y = to.y;
    
    return `M ${from.x},${from.y} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${to.x},${to.y}`;
  }
  
  private exportToSVG(preview: TemplatePreview, _options: PreviewExportOptions): string {
    const { width, height, elements, style } = preview;
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Background
    svg += `<rect width="${width}" height="${height}" fill="${style.backgroundColor}"/>`;
    
    // Grid
    if (style.gridEnabled) {
      svg += this.generateGridSVG(width, height, style);
    }
    
    // Connections first (so they're behind slots)
    for (const element of elements) {
      if (element.type === 'connection') {
        svg += this.connectionToSVG(element);
      }
    }
    
    // Slots
    for (const element of elements) {
      if (element.type === 'slot') {
        svg += this.slotToSVG(element);
      }
    }
    
    svg += '</svg>';
    return svg;
  }
  
  private generateGridSVG(width: number, height: number, style: PreviewStyle): string {
    let grid = '<g class="grid">';
    const spacing = style.gridSpacing;
    
    // Vertical lines
    for (let x = 0; x <= width; x += spacing) {
      grid += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${style.gridColor}" stroke-width="1"/>`;
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += spacing) {
      grid += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${style.gridColor}" stroke-width="1"/>`;
    }
    
    grid += '</g>';
    return grid;
  }
  
  private slotToSVG(slot: PreviewSlot): string {
    const { position, size, label, style } = slot;
    
    return `
      <g class="slot" id="${slot.id}">
        <rect
          x="${position.x}"
          y="${position.y}"
          width="${size.width}"
          height="${size.height}"
          rx="${style.borderRadius}"
          fill="${style.backgroundColor}"
          stroke="${style.borderColor}"
          stroke-width="${style.borderWidth}"
          opacity="${style.opacity}"
        />
        <text
          x="${position.x + size.width / 2}"
          y="${position.y + size.height / 2}"
          font-size="${style.fontSize}"
          fill="${style.textColor}"
          text-anchor="middle"
          dominant-baseline="middle"
        >${label}</text>
        ${slot.ports.map(p => `<circle cx="${p.position.x}" cy="${p.position.y}" r="4" fill="${style.borderColor}"/>`).join('')}
      </g>
    `;
  }
  
  private connectionToSVG(conn: PreviewConnection): string {
    const { path, style } = conn;
    
    return `
      <path
        d="${path}"
        stroke="${style.strokeColor}"
        stroke-width="${style.strokeWidth}"
        fill="none"
        opacity="${style.opacity}"
        ${style.strokeDasharray ? `stroke-dasharray="${style.strokeDasharray}"` : ''}
      />
    `;
  }
  
  private async exportToPNG(preview: TemplatePreview, _options: PreviewExportOptions): Promise<Blob> {
    // Would use canvas API to render PNG
    // For now, return placeholder
    const svg = this.exportToSVG(preview, { format: 'svg' });
    return new Blob([svg], { type: 'image/svg+xml' });
  }
}

// ============================================================================
// TEMPLATE EDITOR
// ============================================================================

/**
 * Template editor with undo/redo and clipboard.
 */
export class TemplateEditor {
  private state: TemplateEditorState;
  private listeners: Set<(state: TemplateEditorState) => void> = new Set();
  
  constructor(template: DeckTemplate) {
    this.state = {
      template: JSON.parse(JSON.stringify(template)),
      selectedSlots: new Set(),
      selectedConnections: new Set(),
      clipboard: null,
      undoStack: [],
      redoStack: [],
      mode: 'select',
      viewTransform: { offsetX: 0, offsetY: 0, scale: 1 },
      snapToGrid: true,
      gridSize: 50,
    };
  }
  
  /**
   * Gets current editor state.
   */
  getState(): TemplateEditorState {
    return this.state;
  }
  
  /**
   * Gets current template.
   */
  getTemplate(): DeckTemplate {
    return this.state.template;
  }
  
  /**
   * Subscribes to state changes.
   */
  subscribe(listener: (state: TemplateEditorState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  /**
   * Dispatches an editor action.
   */
  dispatch(action: EditorAction): void {
    const previousTemplate = JSON.parse(JSON.stringify(this.state.template));
    
    switch (action.type) {
      case 'add-slot':
        this.state.template.slots.push(action.slot);
        this.pushUndo(previousTemplate);
        break;
        
      case 'remove-slot':
        this.state.template.slots = this.state.template.slots.filter(s => s.id !== action.slotId);
        this.state.template.connections = this.state.template.connections.filter(
          c => c.from !== action.slotId && c.to !== action.slotId
        );
        this.pushUndo(previousTemplate);
        break;
        
      case 'move-slot': {
        const slot = this.state.template.slots.find(s => s.id === action.slotId);
        if (slot) {
          slot.position = this.state.snapToGrid
            ? this.snapToGrid(action.position)
            : action.position;
          this.pushUndo(previousTemplate);
        }
        break;
      }
        
      case 'update-slot': {
        const slot = this.state.template.slots.find(s => s.id === action.slotId);
        if (slot) {
          Object.assign(slot, action.updates);
          this.pushUndo(previousTemplate);
        }
        break;
      }
        
      case 'add-connection':
        this.state.template.connections.push(action.connection);
        this.pushUndo(previousTemplate);
        break;
        
      case 'remove-connection':
        this.state.template.connections.splice(action.index, 1);
        this.pushUndo(previousTemplate);
        break;
        
      case 'add-param':
        this.state.template.params.push(action.param);
        this.pushUndo(previousTemplate);
        break;
        
      case 'remove-param':
        this.state.template.params = this.state.template.params.filter(p => p.name !== action.paramName);
        this.pushUndo(previousTemplate);
        break;
        
      case 'update-param': {
        const param = this.state.template.params.find(p => p.name === action.paramName);
        if (param) {
          Object.assign(param, action.updates);
          this.pushUndo(previousTemplate);
        }
        break;
      }
        
      case 'select-slots':
        this.state.selectedSlots = new Set(action.slotIds);
        break;
        
      case 'select-connections':
        this.state.selectedConnections = new Set(action.indices);
        break;
        
      case 'undo':
        this.undo();
        break;
        
      case 'redo':
        this.redo();
        break;
        
      case 'copy':
        this.copy();
        break;
        
      case 'paste':
        this.paste(action.position);
        this.pushUndo(previousTemplate);
        break;
        
      case 'set-mode':
        this.state.mode = action.mode;
        break;
        
      case 'set-view-transform':
        Object.assign(this.state.viewTransform, action.transform);
        break;
        
      case 'toggle-snap-to-grid':
        this.state.snapToGrid = !this.state.snapToGrid;
        break;
    }
    
    this.notifyListeners();
  }
  
  private pushUndo(template: DeckTemplate): void {
    this.state.undoStack.push(template);
    this.state.redoStack = []; // Clear redo on new action
  }
  
  private undo(): void {
    const previous = this.state.undoStack.pop();
    if (previous) {
      this.state.redoStack.push(JSON.parse(JSON.stringify(this.state.template)));
      this.state.template = previous;
    }
  }
  
  private redo(): void {
    const next = this.state.redoStack.pop();
    if (next) {
      this.state.undoStack.push(JSON.parse(JSON.stringify(this.state.template)));
      this.state.template = next;
    }
  }
  
  private copy(): void {
    const selectedSlots = this.state.template.slots.filter(s => this.state.selectedSlots.has(s.id));
    const selectedConnections = this.state.template.connections.filter((_c, i) => 
      this.state.selectedConnections.has(i)
    );
    
    this.state.clipboard = {
      slots: JSON.parse(JSON.stringify(selectedSlots)),
      connections: JSON.parse(JSON.stringify(selectedConnections)),
    };
  }
  
  private paste(position: { x: number; y: number }): void {
    if (!this.state.clipboard) return;
    
    const { slots, connections } = this.state.clipboard;
    
    // Calculate offset
    if (slots.length > 0) {
      const minX = Math.min(...slots.map(s => s.position.x));
      const minY = Math.min(...slots.map(s => s.position.y));
      const offsetX = position.x - minX;
      const offsetY = position.y - minY;
      
      // Create new slot IDs
      const idMap = new Map<string, string>();
      for (const slot of slots) {
        const newId = `${slot.id}_copy_${Date.now()}`;
        idMap.set(slot.id, newId);
        
        const newSlot = {
          ...slot,
          id: newId,
          position: {
            x: slot.position.x + offsetX,
            y: slot.position.y + offsetY,
          },
        };
        
        this.state.template.slots.push(newSlot);
      }
      
      // Update connections with new IDs
      for (const conn of connections) {
        const newFrom = idMap.get(conn.from);
        const newTo = idMap.get(conn.to);
        
        if (newFrom && newTo) {
          this.state.template.connections.push({
            ...conn,
            from: newFrom,
            to: newTo,
          });
        }
      }
    }
  }
  
  private snapToGrid(position: { x: number; y: number }): { x: number; y: number } {
    const { gridSize } = this.state;
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize,
    };
  }
  
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const defaultPreviewGenerator = new TemplatePreviewGenerator();

/**
 * Creates a template editor instance.
 */
export function createTemplateEditor(template: DeckTemplate): TemplateEditor {
  return new TemplateEditor(template);
}
