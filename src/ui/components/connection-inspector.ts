/**
 * @fileoverview Connection Inspector (J031)
 * 
 * Shows details of selected routing connections and allows editing.
 * 
 * @module @cardplay/ui/components/connection-inspector
 */

import { getRoutingGraph } from '../../state/routing-graph';
import { getUndoStack } from '../../state/undo-stack';
import type { UndoAction } from '../../state/types';

/**
 * J031: Connection inspector panel showing selected connection details
 */
export class ConnectionInspector {
  private container: HTMLElement;
  private panel: HTMLElement | null = null;
  private currentConnectionId: string | null = null;
  private cleanupFn: (() => void) | undefined;

  constructor(container: HTMLElement) {
    this.container = container;
    this.setupPanel();
    this.subscribeToRoutingGraph();
  }

  private setupPanel(): void {
    this.panel = document.createElement('div');
    this.panel.className = 'connection-inspector';
    this.panel.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      width: 300px;
      background: #2a2a2a;
      border: 1px solid #444;
      border-radius: 8px;
      padding: 16px;
      display: none;
      z-index: 1001;
      color: #fff;
      font-family: sans-serif;
    `;
    this.container.appendChild(this.panel);
  }

  private subscribeToRoutingGraph(): void {
    // TODO: Subscribe to routing graph changes
  }

  setConnection(connectionId: string | null): void {
    this.currentConnectionId = connectionId;
    if (this.panel) {
      this.panel.style.display = connectionId ? 'block' : 'none';
    }
    this.render();
  }

  private render(): void {
    if (!this.panel || !this.currentConnectionId) return;

    const graph = getRoutingGraph();
    const connection = graph.getState().edges.find(e => e.id === this.currentConnectionId);
    
    if (!connection) {
      this.panel.style.display = 'none';
      return;
    }

    const sourceNode = graph.getState().nodes.get(connection.from);
    const targetNode = graph.getState().nodes.get(connection.to);

    this.panel.innerHTML = `
      <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">
        Connection Details
      </h3>
      
      <div style="margin-bottom: 12px;">
        <div style="font-size: 11px; color: #999; margin-bottom: 4px;">Type</div>
        <div style="padding: 4px 8px; background: ${this.getTypeColor(connection.type)}; border-radius: 4px; display: inline-block;">
          ${connection.type}
        </div>
      </div>

      <div style="margin-bottom: 12px;">
        <div style="font-size: 11px; color: #999; margin-bottom: 4px;">Source</div>
        <div style="font-size: 13px;">${sourceNode?.name || connection.from}</div>
        <div style="font-size: 11px; color: #999;">Port: ${connection.sourcePort}</div>
      </div>

      <div style="margin-bottom: 12px;">
        <div style="font-size: 11px; color: #999; margin-bottom: 4px;">Target</div>
        <div style="font-size: 13px;">${targetNode?.name || connection.to}</div>
        <div style="font-size: 11px; color: #999;">Port: ${connection.targetPort}</div>
      </div>

      ${connection.gain !== undefined ? `
        <div style="margin-bottom: 12px;">
          <div style="font-size: 11px; color: #999; margin-bottom: 4px;">Gain</div>
          <input 
            type="range" 
            min="0" 
            max="2" 
            step="0.01" 
            value="${connection.gain}"
            style="width: 100%;"
            data-property="gain"
          />
          <div style="font-size: 11px; text-align: center;">${(connection.gain * 100).toFixed(0)}%</div>
        </div>
      ` : ''}

      <button 
        class="connection-inspector-delete"
        style="
          width: 100%;
          padding: 8px;
          background: #e74c3c;
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          font-size: 13px;
        "
      >
        Delete Connection
      </button>
    `;

    const deleteBtn = this.panel.querySelector('.connection-inspector-delete');
    deleteBtn?.addEventListener('click', () => this.deleteConnection());

    const gainInput = this.panel.querySelector('[data-property="gain"]') as HTMLInputElement;
    gainInput?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.updateConnectionGain(parseFloat(target.value));
    });
  }

  private getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      audio: '#4a9eff',
      midi: '#9b59b6',
      modulation: '#e74c3c',
      sidechain: '#2ecc71',
    };
    return colors[type] || '#888';
  }

  private deleteConnection(): void {
    if (!this.currentConnectionId) return;

    const graph = getRoutingGraph();
    const connection = graph.getState().edges.find(e => e.id === this.currentConnectionId);
    if (!connection) return;

    const action: UndoAction = {
      type: 'routing:disconnect',
      timestamp: Date.now(),
      undo: () => {
        graph.connect(connection.from, connection.sourcePort, connection.to, connection.targetPort, connection.type);
      },
      redo: () => {
        graph.disconnect(this.currentConnectionId!);
      },
      description: 'Delete routing connection',
    };

    getUndoStack().push(action);
    this.setConnection(null);
  }

  private updateConnectionGain(gain: number): void {
    if (!this.currentConnectionId) return;

    const graph = getRoutingGraph();
    const connection = graph.getState().edges.find(e => e.id === this.currentConnectionId);
    if (!connection) return;

    const oldGain = connection.gain ?? 1.0;
    
    const action: UndoAction = {
      type: 'routing:connect',
      timestamp: Date.now(),
      undo: () => {
        graph.setEdgeGain(this.currentConnectionId!, oldGain);
      },
      redo: () => {
        graph.setEdgeGain(this.currentConnectionId!, gain);
      },
      description: `Set connection gain to ${(gain * 100).toFixed(0)}%`,
    };

    getUndoStack().push(action);
  }

  destroy(): void {
    if (this.cleanupFn) {
      this.cleanupFn();
    }
    if (this.panel?.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }
  }
}

export function injectConnectionInspectorStyles(): void {
  const styleId = 'connection-inspector-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .connection-inspector button:hover {
      opacity: 0.9;
    }
    
    .connection-inspector button:active {
      opacity: 0.8;
    }
  `;
  
  document.head.appendChild(style);
}
