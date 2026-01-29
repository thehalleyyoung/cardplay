/**
 * @fileoverview Routing Overlay (J021-J036)
 * 
 * Visualizes and edits the routing graph over the board.
 * Shows audio/MIDI/modulation connections between decks.
 * 
 * @module @cardplay/ui/components/routing-overlay
 */

import type { RoutingNodeInfo, RoutingEdgeInfo } from '../../state/routing-graph';
import { getRoutingGraph } from '../../state/routing-graph';
import { getUndoStack } from '../../state/undo-stack';
import type { UndoAction } from '../../state/types';

interface RoutingOverlayState {
  visible: boolean;
  miniMapMode: boolean;
  selectedNode: string | null;
  selectedConnection: string | null;
  draggingConnection: { fromNode: string; fromPort: string } | null;
}

/**
 * J021-J033: Routing overlay visualization and editing
 */
export class RoutingOverlay {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: RoutingOverlayState;
  private cleanupFn: (() => void) | undefined;

  constructor(container: HTMLElement) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'routing-overlay-canvas';
    this.ctx = this.canvas.getContext('2d')!;
    
    this.state = {
      visible: false,
      miniMapMode: false,
      selectedNode: null,
      selectedConnection: null,
      draggingConnection: null,
    };

    this.setupCanvas();
    this.setupEventListeners();
    this.subscribeToRoutingGraph();
  }

  private setupCanvas(): void {
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'auto';
    this.canvas.style.zIndex = '1000';
    
    // J051: Add ARIA attributes for accessibility
    this.canvas.setAttribute('role', 'application');
    this.canvas.setAttribute('aria-label', 'Routing graph editor');
    this.canvas.setAttribute('aria-description', 'Visualizes and edits audio/MIDI routing connections. Use arrow keys to navigate, Enter to select, Delete to remove connections.');
    this.canvas.setAttribute('tabindex', '0');
    
    this.container.appendChild(this.canvas);
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // J051: Add keyboard navigation support
    this.canvas.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.canvas.addEventListener('focus', this.handleFocus.bind(this));
    this.canvas.addEventListener('blur', this.handleBlur.bind(this));
    
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private subscribeToRoutingGraph(): void {
    // TODO: Subscribe to routing graph changes
    // For now, just render on demand
  }

  private handleClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const node = this.findNodeAt(x, y);
    if (node) {
      this.state.selectedNode = node.id;
      this.state.selectedConnection = null;
      this.render();
      return;
    }

    const connection = this.findConnectionAt(x, y);
    if (connection) {
      this.state.selectedConnection = connection.id;
      this.state.selectedNode = null;
      this.render();
      return;
    }

    this.state.selectedNode = null;
    this.state.selectedConnection = null;
    this.render();
  }

  private handleMouseDown(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const node = this.findNodeAt(x, y);
    if (node) {
      this.state.draggingConnection = {
        fromNode: node.id,
        fromPort: 'output',
      };
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    if (this.state.draggingConnection) {
      this.render();
      
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      this.drawTempConnection(
        this.getNodePosition(this.state.draggingConnection.fromNode),
        { x, y }
      );
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    if (!this.state.draggingConnection) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const targetNode = this.findNodeAt(x, y);
    if (targetNode && targetNode.id !== this.state.draggingConnection.fromNode) {
      this.createConnection(this.state.draggingConnection.fromNode, targetNode.id);
    }

    this.state.draggingConnection = null;
    this.render();
  }

  private handleResize(): void {
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
    if (this.state.visible) {
      this.render();
    }
  }

  private findNodeAt(x: number, y: number): RoutingNodeInfo | null {
    const graph = getRoutingGraph();
    const state = graph.getState();
    
    for (const [_id, node] of state.nodes) {
      const pos = this.getNodePosition(node.id);
      const size = 60;
      if (x >= pos.x - size/2 && x <= pos.x + size/2 &&
          y >= pos.y - size/2 && y <= pos.y + size/2) {
        return node;
      }
    }
    
    return null;
  }

  private findConnectionAt(x: number, y: number): RoutingEdgeInfo | null {
    const graph = getRoutingGraph();
    const state = graph.getState();
    
    for (const conn of state.edges) {
      const source = this.getNodePosition(conn.from);
      const target = this.getNodePosition(conn.to);
      
      const distance = this.distanceToLine(x, y, source, target);
      if (distance < 10) {
        return conn;
      }
    }
    
    return null;
  }

  private distanceToLine(x: number, y: number, p1: {x: number, y: number}, p2: {x: number, y: number}): number {
    const A = x - p1.x;
    const B = y - p1.y;
    const C = p2.x - p1.x;
    const D = p2.y - p1.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = p1.x;
      yy = p1.y;
    } else if (param > 1) {
      xx = p2.x;
      yy = p2.y;
    } else {
      xx = p1.x + param * C;
      yy = p1.y + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getNodePosition(nodeId: string): {x: number, y: number} {
    const graph = getRoutingGraph();
    const state = graph.getState();
    const node = state.nodes.get(nodeId);
    
    if (node?.position) {
      return node.position;
    }
    
    // Fallback: hash-based position
    const hash = nodeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const x = (hash % 500) + 100;
    const y = ((hash * 17) % 400) + 100;
    return { x, y };
  }

  private createConnection(sourceId: string, targetId: string): void {
    const graph = getRoutingGraph();
    const state = graph.getState();
    const sourceNode = state.nodes.get(sourceId);
    const targetNode = state.nodes.get(targetId);
    
    if (!sourceNode || !targetNode) return;

    // Create connection and track edge ID for undo
    let edgeId: string | undefined;

    const action: UndoAction = {
      type: 'routing:connect',
      timestamp: Date.now(),
      undo: () => {
        if (edgeId) {
          graph.disconnect(edgeId);
        }
      },
      redo: () => {
        const edge = graph.connect(sourceId, 'output', targetId, 'input', 'audio');
        edgeId = edge.id;
      },
      description: `Connect ${sourceId} to ${targetId}`,
    };

    // Execute the initial connection
    const initialEdge = graph.connect(sourceId, 'output', targetId, 'input', 'audio');
    edgeId = initialEdge.id;
    
    getUndoStack().push(action);
  }

  private drawTempConnection(from: {x: number, y: number}, to: {x: number, y: number}): void {
    this.ctx.strokeStyle = '#888';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  private render(): void {
    if (!this.state.visible) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    const graph = getRoutingGraph();
    const state = graph.getState();

    for (const conn of state.edges) {
      this.drawConnection(conn);
    }

    for (const [_id, node] of state.nodes) {
      this.drawNode(node);
    }
  }

  private drawNode(node: RoutingNodeInfo): void {
    const pos = this.getNodePosition(node.id);
    const size = this.state.miniMapMode ? 30 : 60;
    const isSelected = node.id === this.state.selectedNode;

    this.ctx.fillStyle = isSelected ? '#4a9eff' : '#333';
    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = 2;
    
    this.ctx.beginPath();
    this.ctx.roundRect(pos.x - size/2, pos.y - size/2, size, size, 8);
    this.ctx.fill();
    this.ctx.stroke();

    if (!this.state.miniMapMode) {
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '12px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(node.name, pos.x, pos.y + 5);
    }
  }

  private drawConnection(conn: RoutingEdgeInfo): void {
    const source = this.getNodePosition(conn.from);
    const target = this.getNodePosition(conn.to);
    const isSelected = conn.id === this.state.selectedConnection;

    const colorMap: Record<string, string> = {
      audio: '#4a9eff',
      midi: '#9b59b6',
      modulation: '#e74c3c',
      sidechain: '#2ecc71',
    };

    this.ctx.strokeStyle = isSelected ? '#fff' : (colorMap[conn.type] || '#888');
    this.ctx.lineWidth = isSelected ? 3 : 2;
    
    this.ctx.beginPath();
    this.ctx.moveTo(source.x, source.y);
    
    const midX = (source.x + target.x) / 2;
    this.ctx.bezierCurveTo(
      midX, source.y,
      midX, target.y,
      target.x, target.y
    );
    
    this.ctx.stroke();
  }

  setVisible(visible: boolean): void {
    this.state.visible = visible;
    this.canvas.style.display = visible ? 'block' : 'none';
    if (visible) {
      this.render();
    }
  }

  setMiniMapMode(enabled: boolean): void {
    this.state.miniMapMode = enabled;
    if (this.state.visible) {
      this.render();
    }
  }

  /**
   * J051: Handle keyboard navigation
   */
  private handleKeyDown(e: KeyboardEvent): void {
    const graph = getRoutingGraph();
    const state = graph.getState();
    
    // Delete key: remove selected connection
    if (e.key === 'Delete' && this.state.selectedConnection) {
      e.preventDefault();
      const conn = Array.from(state.edges).find(c => c.id === this.state.selectedConnection);
      if (conn) {
        const action: UndoAction = {
          type: 'routing:disconnect',
          timestamp: Date.now(),
          undo: () => {
            graph.connect(conn.from, conn.sourcePort, conn.to, conn.targetPort, conn.type);
          },
          redo: () => {
            graph.disconnect(conn.id);
          },
          description: `Disconnect ${conn.from} from ${conn.to}`,
        };
        
        graph.disconnect(conn.id);
        getUndoStack().push(action);
        this.state.selectedConnection = null;
        this.render();
        this.announceChange('Connection deleted');
      }
    }
    
    // Arrow keys: navigate between nodes
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      this.navigateNodes(e.key);
    }
    
    // Enter: focus selected node details
    if (e.key === 'Enter' && this.state.selectedNode) {
      e.preventDefault();
      this.announceChange(`Node ${this.state.selectedNode} selected`);
    }
    
    // Escape: clear selection
    if (e.key === 'Escape') {
      e.preventDefault();
      this.state.selectedNode = null;
      this.state.selectedConnection = null;
      this.render();
      this.announceChange('Selection cleared');
    }
  }

  /**
   * J051: Navigate between nodes with arrow keys
   */
  private navigateNodes(key: string): void {
    const graph = getRoutingGraph();
    const state = graph.getState();
    const nodes = Array.from(state.nodes.values());
    
    if (nodes.length === 0) return;
    
    if (!this.state.selectedNode) {
      // Select first node if none selected
      const firstNode = nodes[0];
      if (!firstNode) return;
      this.state.selectedNode = firstNode.id;
      this.render();
      this.announceChange(`Node ${firstNode.name} selected`);
      return;
    }
    
    const currentIndex = nodes.findIndex(n => n.id === this.state.selectedNode);
    if (currentIndex === -1) return;
    
    let nextIndex = currentIndex;
    
    switch (key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + nodes.length) % nodes.length;
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % nodes.length;
        break;
    }
    
    const nextNode = nodes[nextIndex];
    if (!nextNode) return;
    this.state.selectedNode = nextNode.id;
    this.state.selectedConnection = null;
    this.render();
    this.announceChange(`Node ${nextNode.name} selected`);
  }

  /**
   * J051: Announce changes for screen readers
   */
  private announceChange(message: string): void {
    // Update canvas aria-label with current state
    this.canvas.setAttribute('aria-label', `Routing graph editor. ${message}`);
    
    // Create a live region for announcements if it doesn't exist
    let liveRegion = document.getElementById('routing-overlay-announcements');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'routing-overlay-announcements';
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }
    
    liveRegion.textContent = message;
  }

  /**
   * J051: Handle focus - show visual focus indicator
   */
  private handleFocus(): void {
    this.canvas.style.outline = '2px solid var(--color-focus, #4a9eff)';
    this.canvas.style.outlineOffset = '2px';
  }

  /**
   * J051: Handle blur - remove visual focus indicator
   */
  private handleBlur(): void {
    this.canvas.style.outline = 'none';
  }

  destroy(): void {
    if (this.cleanupFn) {
      this.cleanupFn();
    }
    window.removeEventListener('resize', this.handleResize.bind(this));
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

export function injectRoutingOverlayStyles(): void {
  const styleId = 'routing-overlay-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .routing-overlay-canvas {
      cursor: crosshair;
    }
    
    .routing-overlay-canvas:active {
      cursor: grabbing;
    }
  `;
  
  document.head.appendChild(style);
}
