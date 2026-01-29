/**
 * @fileoverview Connection Inspector Panel (J031)
 * 
 * Shows details about a selected routing connection including:
 * - Connection type (audio/MIDI/modulation/trigger)
 * - Source and target nodes/ports
 * - Connection parameters (gain, pan, etc.)
 * - Validation status
 * 
 * @module @cardplay/ui/components/connection-inspector
 */

import type { RoutingEdgeInfo } from '../../state/routing-graph';

// Type alias for cleaner code
type RoutingConnection = RoutingEdgeInfo;

/**
 * Connection inspector panel options
 */
export interface ConnectionInspectorOptions {
  /** Show advanced parameters */
  showAdvanced?: boolean;
  /** Allow inline editing */
  allowEditing?: boolean;
  /** Callback when connection is modified */
  onModify?: (connection: RoutingConnection, changes: Partial<RoutingConnection>) => void;
  /** Callback when connection is deleted */
  onDelete?: (connectionId: string) => void;
}

/**
 * Connection Inspector Panel Component (J031)
 * 
 * Displays detailed information about a selected routing connection
 * and allows editing connection parameters.
 */
export class ConnectionInspector {
  private container: HTMLElement;
  private options: ConnectionInspectorOptions;
  private currentConnection: RoutingConnection | null = null;

  constructor(container: HTMLElement, options: ConnectionInspectorOptions = {}) {
    this.container = container;
    this.options = {
      showAdvanced: false,
      allowEditing: true,
      ...options
    };

    this.render();
  }

  /**
   * Set the connection to inspect
   */
  setConnection(connection: RoutingConnection | null): void {
    this.currentConnection = connection;
    this.render();
  }

  /**
   * Render the inspector panel
   */
  private render(): void {
    // Clear container
    this.container.innerHTML = '';

    if (!this.currentConnection) {
      this.renderEmptyState();
      return;
    }

    const panel = this.createPanel();
    this.container.appendChild(panel);
  }

  /**
   * Render empty state when no connection selected
   */
  private renderEmptyState(): void {
    const empty = document.createElement('div');
    empty.className = 'connection-inspector-empty';
    empty.innerHTML = `
      <div class="empty-state">
        <p class="empty-icon">🔌</p>
        <p class="empty-text">No connection selected</p>
        <p class="empty-hint">Click a connection in the routing overlay to inspect it</p>
      </div>
    `;
    this.container.appendChild(empty);
  }

  /**
   * Create inspector panel
   */
  private createPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'connection-inspector-panel';

    // Header
    const header = this.createHeader();
    panel.appendChild(header);

    // Connection details
    const details = this.createDetails();
    panel.appendChild(details);

    // Parameters (if applicable)
    if (this.currentConnection && this.hasParameters(this.currentConnection)) {
      const params = this.createParameters();
      panel.appendChild(params);
    }

    // Actions
    const actions = this.createActions();
    panel.appendChild(actions);

    return panel;
  }

  /**
   * Create header section
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'inspector-header';

    const type = this.currentConnection!.type;
    const icon = this.getConnectionIcon(type);
    const color = this.getConnectionColor(type);

    header.innerHTML = `
      <div class="connection-type-badge" style="background: ${color}20; color: ${color}">
        <span class="connection-icon">${icon}</span>
        <span class="connection-type-label">${type.toUpperCase()}</span>
      </div>
      <h3 class="inspector-title">Connection Details</h3>
    `;

    return header;
  }

  /**
   * Create details section
   */
  private createDetails(): HTMLElement {
    const details = document.createElement('div');
    details.className = 'inspector-details';

    const conn = this.currentConnection!;
    
    // Parse from/to as they are strings like "nodeId:portId"
    const [fromNode, fromPort] = conn.from.split(':');
    const [toNode, toPort] = conn.to.split(':');

    details.innerHTML = `
      <div class="detail-group">
        <label class="detail-label">Source</label>
        <div class="detail-value">
          <span class="node-name">${fromNode || conn.from}</span>
          ${fromPort ? `<span class="port-name">${fromPort}</span>` : ''}
        </div>
      </div>

      <div class="detail-group">
        <label class="detail-label">Target</label>
        <div class="detail-value">
          <span class="node-name">${toNode || conn.to}</span>
          ${toPort ? `<span class="port-name">${toPort}</span>` : ''}
        </div>
      </div>

      <div class="detail-group">
        <label class="detail-label">Connection ID</label>
        <div class="detail-value">
          <code class="connection-id">${conn.id}</code>
        </div>
      </div>
    `;

    return details;
  }

  /**
   * Create parameters section
   */
  private createParameters(): HTMLElement {
    const params = document.createElement('div');
    params.className = 'inspector-parameters';

    const conn = this.currentConnection!;
    
    // Example parameters (actual params depend on connection type and metadata)
    params.innerHTML = `
      <h4 class="parameters-title">Parameters</h4>
      
      ${conn.type === 'audio' ? `
        <div class="parameter-group">
          <label class="parameter-label">Gain</label>
          <input 
            type="range" 
            class="parameter-slider" 
            min="-60" 
            max="12" 
            step="0.1" 
            value="0"
            ${!this.options.allowEditing ? 'disabled' : ''}
          />
          <span class="parameter-value">0.0 dB</span>
        </div>

        <div class="parameter-group">
          <label class="parameter-label">Pan</label>
          <input 
            type="range" 
            class="parameter-slider" 
            min="-1" 
            max="1" 
            step="0.01" 
            value="0"
            ${!this.options.allowEditing ? 'disabled' : ''}
          />
          <span class="parameter-value">Center</span>
        </div>
      ` : ''}

      ${conn.type === 'cv' ? `
        <div class="parameter-group">
          <label class="parameter-label">Amount</label>
          <input 
            type="range" 
            class="parameter-slider" 
            min="-1" 
            max="1" 
            step="0.01" 
            value="1"
            ${!this.options.allowEditing ? 'disabled' : ''}
          />
          <span class="parameter-value">100%</span>
        </div>

        <div class="parameter-group">
          <label class="parameter-label">Curve</label>
          <select class="parameter-select" ${!this.options.allowEditing ? 'disabled' : ''}>
            <option value="linear">Linear</option>
            <option value="exponential">Exponential</option>
            <option value="logarithmic">Logarithmic</option>
          </select>
        </div>
      ` : ''}
    `;

    return params;
  }

  /**
   * Create actions section
   */
  private createActions(): HTMLElement {
    const actions = document.createElement('div');
    actions.className = 'inspector-actions';

    const disconnectBtn = document.createElement('button');
    disconnectBtn.className = 'action-button action-button-danger';
    disconnectBtn.textContent = 'Disconnect';
    disconnectBtn.disabled = !this.options.allowEditing;
    disconnectBtn.addEventListener('click', () => this.handleDisconnect());

    const duplicateBtn = document.createElement('button');
    duplicateBtn.className = 'action-button action-button-secondary';
    duplicateBtn.textContent = 'Duplicate';
    duplicateBtn.disabled = !this.options.allowEditing;

    actions.appendChild(disconnectBtn);
    actions.appendChild(duplicateBtn);

    return actions;
  }

  /**
   * Handle disconnect action
   */
  private handleDisconnect(): void {
    if (!this.currentConnection) return;
    
    if (this.options.onDelete) {
      this.options.onDelete(this.currentConnection.id);
    }

    this.setConnection(null);
  }

  /**
   * Check if connection has editable parameters
   */
  private hasParameters(connection: RoutingConnection): boolean {
    return connection.type === 'audio' || connection.type === 'cv';
  }

  /**
   * Get connection icon by type
   */
  private getConnectionIcon(type: string): string {
    switch (type) {
      case 'audio':
        return '🔊';
      case 'midi':
        return '🎹';
      case 'cv':
        return '〰️';
      case 'trigger':
        return '⚡';
      case 'parameter':
        return '🎛️';
      default:
        return '🔌';
    }
  }

  /**
   * Get connection color by type
   */
  private getConnectionColor(type: string): string {
    switch (type) {
      case 'audio':
        return '#10b981';
      case 'midi':
        return '#6366f1';
      case 'cv':
        return '#f59e0b';
      case 'trigger':
        return '#ec4899';
      case 'parameter':
        return '#a855f7';
      default:
        return 'var(--color-outline)';
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.container.innerHTML = '';
  }
}

/**
 * Inject connection inspector styles
 */
export function injectConnectionInspectorStyles(): void {
  if (typeof document === 'undefined') return;
  
  const styleId = 'connection-inspector-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
/* Connection Inspector Styles (J031) */
.connection-inspector-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-surface-container);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-outline);
}

.connection-inspector-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 2rem;
}

.empty-state {
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.empty-text {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-on-surface);
  margin-bottom: 0.25rem;
}

.empty-hint {
  font-size: 0.875rem;
  color: var(--color-on-surface-variant);
}

.inspector-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-outline-variant);
}

.connection-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.connection-icon {
  font-size: 1rem;
}

.inspector-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-on-surface);
  margin: 0;
}

.inspector-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-value {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  font-size: 0.875rem;
  color: var(--color-on-surface);
}

.node-name {
  font-weight: 600;
}

.port-name {
  font-size: 0.75rem;
  color: var(--color-on-surface-variant);
}

.connection-id {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: var(--color-surface-container-highest);
  border-radius: var(--radius-sm);
  color: var(--color-primary);
}

.inspector-parameters {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-outline-variant);
}

.parameters-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-on-surface);
  margin: 0;
}

.parameter-group {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  align-items: center;
  gap: 0.75rem;
}

.parameter-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-on-surface);
}

.parameter-slider {
  width: 100%;
}

.parameter-value {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-primary);
  text-align: right;
  min-width: 60px;
}

.parameter-select {
  grid-column: 2 / 4;
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-on-surface);
  font-size: 0.875rem;
}

.inspector-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-outline-variant);
}

.action-button {
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button-danger {
  background: var(--color-error);
  color: var(--color-on-error);
}

.action-button-danger:hover:not(:disabled) {
  background: var(--color-error-container);
}

.action-button-secondary {
  background: var(--color-surface-container-highest);
  color: var(--color-on-surface);
  border: 1px solid var(--color-outline);
}

.action-button-secondary:hover:not(:disabled) {
  background: var(--color-surface-container-high);
}

/* High contrast support */
@media (prefers-contrast: more) {
  .connection-inspector-panel {
    border-width: 2px;
  }
  
  .connection-type-badge {
    border: 2px solid currentColor;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .action-button {
    transition: none;
  }
}
`;
  
  document.head.appendChild(style);
}
