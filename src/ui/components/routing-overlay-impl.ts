/**
 * @fileoverview Routing Overlay Component (J021-J036)
 * 
 * Visual overlay for the routing graph, showing audio/MIDI/modulation connections
 * between decks, cards, and tracks. Supports interactive editing with drag-to-connect,
 * validation, and undo integration.
 * 
 * @module @cardplay/ui/components/routing-overlay
 */

import type { RoutingNodeInfo, RoutingEdgeInfo, EdgeType } from '../../state/routing-graph';
import { getRoutingGraph } from '../../state/routing-graph';

// Type aliases for cleaner code
type RoutingGraph = ReturnType<typeof getRoutingGraph>;
type RoutingNode = RoutingNodeInfo;
type RoutingConnection = RoutingEdgeInfo;
type ConnectionType = EdgeType;

/**
 * Routing overlay display options
 */
export interface RoutingOverlayOptions {
  /** Show routing graph overlay */
  visible: boolean;
  /** Mini-map mode for dense graphs */
  miniMapMode: boolean;
  /** Connection type filter */
  filterByType?: ConnectionType;
  /** Highlight specific nodes */
  highlightNodes?: string[];
  /** Respect reduced motion preference */
  reducedMotion?: boolean;
}

/**
 * Routing overlay state
 */
export interface RoutingOverlayState {
  /** Currently selected connection */
  selectedConnection: RoutingConnection | null;
  /** Currently dragging from port */
  dragFrom: { nodeId: string; portId: string; type: ConnectionType } | null;
  /** Hover target port */
  hoverPort: { nodeId: string; portId: string } | null;
  /** Pan/zoom state */
  transform: {
    x: number;
    y: number;
    scale: number;
  };
}

/**
 * Port position for rendering
 */
export interface PortPosition {
  x: number;
  y: number;
  type: 'input' | 'output';
  portType: ConnectionType;
}

/**
 * Routing overlay component - visualizes routing graph over the board (J021)
 */
export class RoutingOverlay {
  private container: HTMLElement;
  private svg: SVGSVGElement;
  private nodesGroup: SVGGElement;
  private connectionsGroup: SVGGElement;
  private options: RoutingOverlayOptions;
  private state: RoutingOverlayState;
  private graph: RoutingGraph | null = null;
  private nodePositions = new Map<string, { x: number; y: number }>();
  private portPositions = new Map<string, PortPosition>();

  constructor(container: HTMLElement, options: Partial<RoutingOverlayOptions> = {}) {
    this.container = container;
    this.options = {
      visible: false,
      miniMapMode: false,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      ...options
    };
    
    this.state = {
      selectedConnection: null,
      dragFrom: null,
      hoverPort: null,
      transform: { x: 0, y: 0, scale: 1 }
    };

    this.svg = this.createSVG();
    this.connectionsGroup = this.createGroup('connections');
    this.nodesGroup = this.createGroup('nodes');
    
    this.svg.appendChild(this.connectionsGroup);
    this.svg.appendChild(this.nodesGroup);
    
    if (this.options.visible) {
      this.container.appendChild(this.svg);
    }

    this.attachEventListeners();
  }

  /**
   * J021: Set routing graph to visualize
   */
  setGraph(graph: RoutingGraph): void {
    this.graph = graph;
    this.computeNodeLayout();
    this.render();
  }

  /**
   * J027: Toggle routing overlay visibility
   */
  setVisible(visible: boolean): void {
    this.options.visible = visible;
    
    if (visible && !this.svg.parentElement) {
      this.container.appendChild(this.svg);
      this.render();
    } else if (!visible && this.svg.parentElement) {
      this.container.removeChild(this.svg);
    }
  }

  /**
   * J028: Toggle mini-map mode for dense graphs
   */
  setMiniMapMode(enabled: boolean): void {
    this.options.miniMapMode = enabled;
    this.updateViewBox();
    this.render();
  }

  /**
   * J022: Render nodes for decks/cards/tracks
   */
  private renderNodes(): void {
    if (!this.graph) return;

    // Clear existing nodes
    while (this.nodesGroup.firstChild) {
      this.nodesGroup.removeChild(this.nodesGroup.firstChild);
    }

    const nodes = this.graph.getNodes();
    
    for (const node of nodes) {
      const pos = this.nodePositions.get(node.id) || { x: 0, y: 0 };
      const nodeElement = this.createNodeElement(node, pos);
      this.nodesGroup.appendChild(nodeElement);
    }
  }

  /**
   * J023: Render connections by type with color coding
   */
  private renderConnections(): void {
    if (!this.graph) return;

    // Clear existing connections
    while (this.connectionsGroup.firstChild) {
      this.connectionsGroup.removeChild(this.connectionsGroup.firstChild);
    }

    const connections = this.graph.getEdges();
    
    for (const connection of connections) {
      const path = this.createConnectionPath(connection);
      if (path) {
        this.connectionsGroup.appendChild(path);
      }
    }
  }

  /**
   * Create connection path element with color coding by type (J023)
   */
  private createConnectionPath(connection: RoutingConnection): SVGPathElement | null {
    // connection.from and connection.to are strings like "nodeId:portId"
    const sourcePort = this.portPositions.get(connection.from);
    const targetPort = this.portPositions.get(connection.to);
    
    if (!sourcePort || !targetPort) return null;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // Bezier curve from source to target
    const d = this.computeBezierPath(sourcePort, targetPort);
    path.setAttribute('d', d);
    
    // Color by connection type (J023)
    const color = this.getConnectionColor(connection.type);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('class', `connection connection-${connection.type}`);
    
    // Selected state
    if (this.state.selectedConnection?.id === connection.id) {
      path.setAttribute('stroke-width', '3');
      path.setAttribute('filter', 'drop-shadow(0 0 4px currentColor)');
    }

    // Interactive
    path.style.cursor = 'pointer';
    path.addEventListener('click', () => this.selectConnection(connection));
    
    return path;
  }

  /**
   * Create node element (J022)
   */
  private createNodeElement(node: RoutingNode, pos: { x: number; y: number }): SVGGElement {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
    g.setAttribute('class', `node node-${node.type}`);

    // Node background
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', this.options.miniMapMode ? '60' : '120');
    rect.setAttribute('height', this.options.miniMapMode ? '30' : '60');
    rect.setAttribute('rx', '4');
    rect.setAttribute('fill', 'var(--color-surface-container)');
    rect.setAttribute('stroke', 'var(--color-outline)');
    rect.setAttribute('stroke-width', '1');
    g.appendChild(rect);

    // Node label
    if (!this.options.miniMapMode) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', '60');
      text.setAttribute('y', '35');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', 'var(--color-on-surface)');
      text.setAttribute('font-size', '12');
      text.textContent = node.name || node.id;
      g.appendChild(text);
    }

    // Input ports
    node.inputs.forEach((port, i) => {
      const portElement = this.createPortElement(port, 'input', i, node.inputs.length);
      g.appendChild(portElement);
      
      // Store port position
      const portKey = `${node.id}:${port.id}`;
      this.portPositions.set(portKey, {
        x: pos.x,
        y: pos.y + (i + 0.5) * ((this.options.miniMapMode ? 30 : 60) / node.inputs.length),
        type: 'input',
        portType: port.type
      });
    });

    // Output ports
    node.outputs.forEach((port, i) => {
      const portElement = this.createPortElement(port, 'output', i, node.outputs.length);
      g.appendChild(portElement);
      
      // Store port position
      const portKey = `${node.id}:${port.id}`;
      this.portPositions.set(portKey, {
        x: pos.x + (this.options.miniMapMode ? 60 : 120),
        y: pos.y + (i + 0.5) * ((this.options.miniMapMode ? 30 : 60) / node.outputs.length),
        type: 'output',
        portType: port.type
      });
    });

    // Make draggable (for layout adjustment)
    this.makeNodeDraggable(g, node.id);

    return g;
  }

  /**
   * Create port element
   */
  private createPortElement(
    port: { id: string; type: ConnectionType; label?: string },
    direction: 'input' | 'output',
    index: number,
    total: number
  ): SVGCircleElement {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    
    const nodeWidth = this.options.miniMapMode ? 60 : 120;
    const nodeHeight = this.options.miniMapMode ? 30 : 60;
    const x = direction === 'input' ? 0 : nodeWidth;
    const y = (index + 0.5) * (nodeHeight / total);
    
    circle.setAttribute('cx', x.toString());
    circle.setAttribute('cy', y.toString());
    circle.setAttribute('r', '4');
    circle.setAttribute('fill', this.getConnectionColor(port.type));
    circle.setAttribute('stroke', 'var(--color-surface)');
    circle.setAttribute('stroke-width', '2');
    circle.setAttribute('class', `port port-${direction} port-${port.type}`);
    circle.style.cursor = 'pointer';

    // J024: Click to connect
    circle.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handlePortClick(port.id, port.type, direction);
    });

    // Hover state (J024)
    circle.addEventListener('mouseenter', () => {
      circle.setAttribute('r', '6');
    });
    circle.addEventListener('mouseleave', () => {
      circle.setAttribute('r', '4');
    });

    return circle;
  }

  /**
   * J024: Handle port click for click-to-connect
   */
  private handlePortClick(portId: string, type: ConnectionType, direction: 'input' | 'output'): void {
    const parts = portId.split(':');
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      console.warn('Invalid port ID format:', portId);
      return;
    }
    
    const nodeId: string = parts[0];
    const port: string = parts[1];
    
    if (!this.state.dragFrom) {
      // First click - start connection
      if (direction === 'output') {
        this.state.dragFrom = { nodeId, portId: port, type };
        this.render();
      }
    } else {
      // Second click - complete connection
      if (direction === 'input' && this.state.dragFrom.type === type) {
        // Create connection
        if (this.graph) {
          try {
            // J026: Connection created with undo support via routing graph
            this.graph.connect(
              this.state.dragFrom.nodeId,
              this.state.dragFrom.portId,
              nodeId,
              port,
              type
            );
            
            this.state.dragFrom = null;
            this.render();
          } catch (error) {
            // Show error feedback (J032)
            console.warn('Connection failed:', error);
            this.state.dragFrom = null;
            this.render();
          }
        }
      } else {
        // Incompatible - cancel
        this.state.dragFrom = null;
        this.render();
      }
    }
  }

  /**
   * J032: Visual feedback for incompatible connections (shake + tooltip)
   * Reserved for future drag validation feedback
   */
  /*
  private showIncompatibleFeedback(_portElement: SVGElement, _reason: string): void {
    // TODO: Implement when drag validation is added (J032)
    // Shake animation + tooltip with reason
  }
  */

  /**
   * Get connection color by type (J023)
   */
  private getConnectionColor(type: ConnectionType): string {
    switch (type) {
      case 'audio':
        return 'var(--connection-audio, #10b981)';
      case 'midi':
        return 'var(--connection-midi, #6366f1)';
      case 'cv':
        return 'var(--connection-modulation, #f59e0b)';
      case 'trigger':
        return 'var(--connection-trigger, #ec4899)';
      case 'parameter':
        return 'var(--connection-parameter, #a855f7)';
      default:
        return 'var(--color-outline)';
    }
  }

  /**
   * Compute Bezier path for connection
   */
  private computeBezierPath(source: PortPosition, target: PortPosition): string {
    const dx = target.x - source.x;
    const controlPointOffset = Math.min(Math.abs(dx) * 0.5, 100);
    
    return `M ${source.x} ${source.y} C ${source.x + controlPointOffset} ${source.y}, ${target.x - controlPointOffset} ${target.y}, ${target.x} ${target.y}`;
  }

  /**
   * Compute node layout using force-directed layout
   */
  private computeNodeLayout(): void {
    if (!this.graph) return;

    const nodes = this.graph.getNodes();
    
    // Simple grid layout for MVP
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const spacing = this.options.miniMapMode ? 100 : 200;
    
    nodes.forEach((node, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      this.nodePositions.set(node.id, {
        x: 50 + col * spacing,
        y: 50 + row * spacing
      });
    });
  }

  /**
   * Select connection (J031)
   */
  private selectConnection(connection: RoutingConnection): void {
    this.state.selectedConnection = connection;
    this.render();
    
    // Emit event for connection inspector panel (J031)
    this.dispatchEvent('connection-selected', { connection });
  }

  /**
   * Make node draggable for layout adjustment
   */
  private makeNodeDraggable(element: SVGGElement, nodeId: string): void {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let nodeStartX = 0;
    let nodeStartY = 0;

    element.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const pos = this.nodePositions.get(nodeId) || { x: 0, y: 0 };
      nodeStartX = pos.x;
      nodeStartY = pos.y;
      element.style.cursor = 'grabbing';
      e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const dx = (e.clientX - startX) / this.state.transform.scale;
      const dy = (e.clientY - startY) / this.state.transform.scale;
      
      this.nodePositions.set(nodeId, {
        x: nodeStartX + dx,
        y: nodeStartY + dy
      });
      
      this.render();
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        element.style.cursor = 'pointer';
      }
    });

    element.style.cursor = 'pointer';
  }

  /**
   * Update SVG viewBox for zoom/pan
   */
  private updateViewBox(): void {
    const { x, y, scale } = this.state.transform;
    const width = this.container.clientWidth / scale;
    const height = this.container.clientHeight / scale;
    
    this.svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
  }

  /**
   * Render full overlay
   */
  private render(): void {
    if (!this.options.visible || !this.graph) return;
    
    this.renderConnections();
    this.renderNodes();
  }

  /**
   * Create SVG element
   */
  private createSVG(): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'routing-overlay');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'auto';
    svg.style.zIndex = '1000';
    
    return svg;
  }

  /**
   * Create SVG group
   */
  private createGroup(id: string): SVGGElement {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('id', id);
    return g;
  }

  /**
   * Show tooltip - J032: Visual feedback system
   * Reserved for future use - will be integrated with connection validation feedback
   */
  /*
  private showTooltip(element: SVGElement, text: string, type: 'info' | 'error' = 'info'): void {
    const tooltip = document.createElement('div');
    tooltip.className = `routing-tooltip routing-tooltip--${type}`;
    tooltip.textContent = text;
    tooltip.style.position = 'absolute';
    tooltip.style.padding = '4px 8px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '12px';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '10000';
    tooltip.style.backgroundColor = type === 'error' ? 'var(--color-error, #dc2626)' : 'var(--color-info, #3b82f6)';
    tooltip.style.color = 'white';
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top - 30}px`;
    tooltip.style.transform = 'translateX(-50%)';
    
    document.body.appendChild(tooltip);
    
    // Auto-remove after 2 seconds
    setTimeout(() => {
      tooltip.remove();
    }, 2000);
  }
  */

  /**
   * Dispatch custom event
   */
  private dispatchEvent(name: string, detail: unknown): void {
    this.container.dispatchEvent(new CustomEvent(`routing-overlay:${name}`, { detail }));
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    // Pan/zoom support
    let isPanning = false;
    let panStartX = 0;
    let panStartY = 0;

    this.svg.addEventListener('mousedown', (e) => {
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        isPanning = true;
        panStartX = e.clientX;
        panStartY = e.clientY;
        this.svg.style.cursor = 'grabbing';
        e.preventDefault();
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!isPanning) return;
      
      const dx = (e.clientX - panStartX) / this.state.transform.scale;
      const dy = (e.clientY - panStartY) / this.state.transform.scale;
      
      this.state.transform.x -= dx;
      this.state.transform.y -= dy;
      
      panStartX = e.clientX;
      panStartY = e.clientY;
      
      this.updateViewBox();
    });

    document.addEventListener('mouseup', () => {
      if (isPanning) {
        isPanning = false;
        this.svg.style.cursor = 'default';
      }
    });

    // Zoom support
    this.svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = this.state.transform.scale * delta;
      
      if (newScale >= 0.1 && newScale <= 5) {
        this.state.transform.scale = newScale;
        this.updateViewBox();
      }
    });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.svg.parentElement) {
      this.container.removeChild(this.svg);
    }
    this.nodePositions.clear();
    this.portPositions.clear();
  }
}

/**
 * J033: Inject routing overlay styles with reduced motion and high contrast support
 */
export function injectRoutingOverlayStyles(): void {
  if (typeof document === 'undefined') return;
  
  const styleId = 'routing-overlay-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
/* Routing Overlay Styles (J021-J036) */
.routing-overlay {
  --connection-audio: #10b981;
  --connection-midi: #6366f1;
  --connection-modulation: #f59e0b;
  --connection-trigger: #ec4899;
}

.connection {
  transition: stroke-width 0.2s ease;
}

.connection:hover {
  stroke-width: 3px !important;
}

.node {
  transition: transform 0.2s ease;
}

.port {
  transition: r 0.2s ease;
}

/* Shake animation for incompatible connections (J032) */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

/* High contrast support (J033) */
@media (prefers-contrast: more) {
  .connection {
    stroke-width: 3px !important;
  }
  
  .node rect {
    stroke-width: 2px !important;
  }
  
  .port {
    stroke-width: 3px !important;
  }
}

/* Reduced motion support (J033) */
@media (prefers-reduced-motion: reduce) {
  .connection,
  .node,
  .port {
    transition: none !important;
  }
}
`;
  
  document.head.appendChild(style);
}
