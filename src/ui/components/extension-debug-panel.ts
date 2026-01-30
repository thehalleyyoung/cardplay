/**
 * @fileoverview Extension Debug Panel
 * 
 * Provides debugging tools for extension developers including:
 * - Extension lifecycle inspection
 * - Permission usage tracking
 * - Error logging and stack traces
 * - Performance profiling
 * - Hot reload support
 * 
 * Implements O123: Extension debugging tools
 * 
 * @module @cardplay/ui/components/extension-debug-panel
 */

import { ExtensionManifest, ExtensionPermission } from '../../extensions/types';

// ============================================================================
// TYPES
// ============================================================================

export interface ExtensionDebugInfo {
  readonly manifest: ExtensionManifest;
  readonly loadedAt: Date;
  readonly loadTime: number; // milliseconds
  readonly errors: readonly ExtensionError[];
  readonly permissionUsage: ReadonlyMap<ExtensionPermission, number>;
  readonly performanceMetrics: ExtensionPerformanceMetrics;
  readonly hotReloadCount: number;
}

export interface ExtensionError {
  readonly timestamp: Date;
  readonly message: string;
  readonly stack?: string;
  readonly recoverable: boolean;
}

export interface ExtensionPerformanceMetrics {
  readonly initTime: number;
  readonly avgCallTime: number;
  readonly totalCalls: number;
  readonly memoryUsage?: number; // bytes
}

export interface DebugPanelConfig {
  readonly showPerformance: boolean;
  readonly showPermissions: boolean;
  readonly showErrors: boolean;
  readonly autoRefresh: boolean;
  readonly refreshInterval: number; // milliseconds
}

// ============================================================================
// DEBUG PANEL
// ============================================================================

/**
 * Extension Debug Panel Component
 * 
 * Beautiful browser UI for debugging extensions during development.
 * Shows real-time stats, error logs, and performance metrics.
 */
export class ExtensionDebugPanel {
  private element: HTMLElement;
  private config: DebugPanelConfig;
  private debugInfo = new Map<string, ExtensionDebugInfo>();
  private refreshInterval: number | null = null;
  private errorListeners = new Set<(extensionId: string, error: ExtensionError) => void>();

  constructor(parent: HTMLElement, config: Partial<DebugPanelConfig> = {}) {
    this.config = {
      showPerformance: true,
      showPermissions: true,
      showErrors: true,
      autoRefresh: true,
      refreshInterval: 1000,
      ...config,
    };

    this.element = this.createElement();
    parent.appendChild(this.element);

    if (this.config.autoRefresh) {
      this.startAutoRefresh();
    }
  }

  // --------------------------------------------------------------------------
  // EXTENSION TRACKING
  // --------------------------------------------------------------------------

  /**
   * Registers an extension for debugging.
   */
  registerExtension(info: ExtensionDebugInfo): void {
    this.debugInfo.set(info.manifest.id, info);
    this.render();
  }

  /**
   * Unregisters an extension from debugging.
   */
  unregisterExtension(extensionId: string): void {
    this.debugInfo.delete(extensionId);
    this.render();
  }

  /**
   * Updates debug info for an extension.
   */
  updateExtension(extensionId: string, updates: Partial<ExtensionDebugInfo>): void {
    const current = this.debugInfo.get(extensionId);
    if (current) {
      this.debugInfo.set(extensionId, { ...current, ...updates });
      this.render();
    }
  }

  /**
   * Records an error for an extension.
   */
  logError(extensionId: string, error: ExtensionError): void {
    const info = this.debugInfo.get(extensionId);
    if (info) {
      this.debugInfo.set(extensionId, {
        ...info,
        errors: [...info.errors, error],
      });
      this.render();

      // Notify error listeners
      this.errorListeners.forEach((listener) => listener(extensionId, error));
    }
  }

  /**
   * Records permission usage for an extension.
   */
  recordPermissionUse(extensionId: string, permission: ExtensionPermission): void {
    const info = this.debugInfo.get(extensionId);
    if (info) {
      const usage = new Map(info.permissionUsage);
      usage.set(permission, (usage.get(permission) || 0) + 1);
      this.debugInfo.set(extensionId, {
        ...info,
        permissionUsage: usage,
      });
      if (!this.config.autoRefresh) {
        this.render();
      }
    }
  }

  /**
   * Subscribes to extension errors.
   */
  onError(listener: (extensionId: string, error: ExtensionError) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  // --------------------------------------------------------------------------
  // RENDERING
  // --------------------------------------------------------------------------

  private createElement(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'extension-debug-panel';
    panel.style.cssText = `
      font-family: var(--font-mono, monospace);
      font-size: 12px;
      background: var(--color-surface-0, #1a1a1a);
      color: var(--color-text-primary, #e0e0e0);
      border: 1px solid var(--color-border, #333);
      border-radius: 8px;
      padding: 16px;
      max-height: 600px;
      overflow-y: auto;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    `;

    return panel;
  }

  private render(): void {
    const extensions = Array.from(this.debugInfo.values());

    this.element.innerHTML = `
      <div class="debug-header" style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--color-border, #333);
      ">
        <h3 style="margin: 0; font-size: 14px; font-weight: 600;">
          Extension Debugger
        </h3>
        <div class="debug-controls" style="display: flex; gap: 8px;">
          ${this.renderControls()}
        </div>
      </div>

      <div class="extension-list">
        ${extensions.length === 0
          ? this.renderEmptyState()
          : extensions.map((info) => this.renderExtension(info)).join('')
        }
      </div>
    `;

    this.attachEventListeners();
  }

  private renderControls(): string {
    return `
      <button class="debug-control" data-action="refresh" style="
        padding: 4px 8px;
        background: var(--color-surface-1, #2a2a2a);
        border: 1px solid var(--color-border, #444);
        border-radius: 4px;
        color: var(--color-text-primary, #e0e0e0);
        cursor: pointer;
        font-size: 11px;
      ">
        🔄 Refresh
      </button>
      <button class="debug-control" data-action="clear" style="
        padding: 4px 8px;
        background: var(--color-surface-1, #2a2a2a);
        border: 1px solid var(--color-border, #444);
        border-radius: 4px;
        color: var(--color-text-primary, #e0e0e0);
        cursor: pointer;
        font-size: 11px;
      ">
        🗑️ Clear Errors
      </button>
      <label style="
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        cursor: pointer;
      ">
        <input
          type="checkbox"
          class="debug-control"
          data-action="auto-refresh"
          ${this.config.autoRefresh ? 'checked' : ''}
        />
        Auto-refresh
      </label>
    `;
  }

  private renderEmptyState(): string {
    return `
      <div style="
        text-align: center;
        padding: 32px;
        color: var(--color-text-secondary, #888);
      ">
        <div style="font-size: 32px; margin-bottom: 8px;">🔌</div>
        <div>No extensions loaded</div>
        <div style="font-size: 11px; margin-top: 4px;">
          Load an extension to see debug information
        </div>
      </div>
    `;
  }

  private renderExtension(info: ExtensionDebugInfo): string {
    const hasErrors = info.errors.length > 0;
    const errorColor = hasErrors ? 'var(--color-error, #ff4444)' : 'var(--color-success, #44ff44)';

    return `
      <div class="extension-debug-item" data-extension-id="${info.manifest.id}" style="
        margin-bottom: 16px;
        padding: 12px;
        background: var(--color-surface-1, #222);
        border: 1px solid ${errorColor};
        border-radius: 6px;
      ">
        <div class="extension-header" style="
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 12px;
        ">
          <div>
            <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">
              ${info.manifest.name}
              <span style="
                color: var(--color-text-secondary, #888);
                font-weight: normal;
                font-size: 11px;
              ">
                v${info.manifest.version}
              </span>
            </div>
            <div style="
              font-size: 11px;
              color: var(--color-text-secondary, #888);
            ">
              ${info.manifest.id}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; color: var(--color-text-secondary, #888);">
              Loaded ${this.formatTime(info.loadTime)}
            </div>
            ${info.hotReloadCount > 0
              ? `<div style="font-size: 11px; color: var(--color-accent, #4a9eff);">
                   🔥 Hot reloaded ${info.hotReloadCount}x
                 </div>`
              : ''
            }
          </div>
        </div>

        ${this.config.showPerformance ? this.renderPerformance(info.performanceMetrics) : ''}
        ${this.config.showPermissions ? this.renderPermissions(info) : ''}
        ${this.config.showErrors ? this.renderErrors(info.errors) : ''}
      </div>
    `;
  }

  private renderPerformance(metrics: ExtensionPerformanceMetrics): string {
    return `
      <div class="performance-metrics" style="
        margin-bottom: 8px;
        padding: 8px;
        background: var(--color-surface-0, #1a1a1a);
        border-radius: 4px;
      ">
        <div style="
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 6px;
          color: var(--color-text-secondary, #888);
        ">
          Performance
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
          <div>
            <span style="color: var(--color-text-secondary, #888);">Init:</span>
            <span style="color: var(--color-text-primary, #e0e0e0);">
              ${metrics.initTime.toFixed(2)}ms
            </span>
          </div>
          <div>
            <span style="color: var(--color-text-secondary, #888);">Avg call:</span>
            <span style="color: var(--color-text-primary, #e0e0e0);">
              ${metrics.avgCallTime.toFixed(2)}ms
            </span>
          </div>
          <div>
            <span style="color: var(--color-text-secondary, #888);">Calls:</span>
            <span style="color: var(--color-text-primary, #e0e0e0);">
              ${metrics.totalCalls}
            </span>
          </div>
          ${metrics.memoryUsage !== undefined
            ? `<div>
                 <span style="color: var(--color-text-secondary, #888);">Memory:</span>
                 <span style="color: var(--color-text-primary, #e0e0e0);">
                   ${this.formatBytes(metrics.memoryUsage)}
                 </span>
               </div>`
            : ''
          }
        </div>
      </div>
    `;
  }

  private renderPermissions(info: ExtensionDebugInfo): string {
    const permissions = Array.from(info.permissionUsage.entries());

    return `
      <div class="permissions-usage" style="
        margin-bottom: 8px;
        padding: 8px;
        background: var(--color-surface-0, #1a1a1a);
        border-radius: 4px;
      ">
        <div style="
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 6px;
          color: var(--color-text-secondary, #888);
        ">
          Permission Usage
        </div>
        ${permissions.length === 0
          ? '<div style="font-size: 11px; color: var(--color-text-secondary, #888);">No permissions used yet</div>'
          : permissions.map(([perm, count]) => `
              <div style="
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                margin-bottom: 4px;
              ">
                <span style="color: var(--color-text-primary, #e0e0e0);">${perm}</span>
                <span style="
                  color: var(--color-accent, #4a9eff);
                  font-weight: 600;
                ">${count} calls</span>
              </div>
            `).join('')
        }
      </div>
    `;
  }

  private renderErrors(errors: readonly ExtensionError[]): string {
    if (errors.length === 0) {
      return `
        <div style="
          padding: 8px;
          background: var(--color-surface-0, #1a1a1a);
          border-radius: 4px;
          font-size: 11px;
          color: var(--color-success, #44ff44);
        ">
          ✓ No errors
        </div>
      `;
    }

    return `
      <div class="error-log" style="
        padding: 8px;
        background: var(--color-surface-0, #1a1a1a);
        border-radius: 4px;
      ">
        <div style="
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 6px;
          color: var(--color-error, #ff4444);
        ">
          Errors (${errors.length})
        </div>
        ${errors.slice(-5).reverse().map((error) => `
          <div class="error-item" style="
            margin-bottom: 8px;
            padding: 6px;
            background: rgba(255, 68, 68, 0.1);
            border-left: 2px solid var(--color-error, #ff4444);
            border-radius: 2px;
          ">
            <div style="
              font-size: 11px;
              color: var(--color-error, #ff4444);
              margin-bottom: 4px;
            ">
              ${this.escapeHTML(error.message)}
            </div>
            <div style="
              font-size: 10px;
              color: var(--color-text-secondary, #888);
            ">
              ${error.timestamp.toLocaleTimeString()}
              ${error.recoverable ? '(recoverable)' : '(fatal)'}
            </div>
            ${error.stack
              ? `<details style="margin-top: 4px;">
                   <summary style="
                     font-size: 10px;
                     color: var(--color-text-secondary, #888);
                     cursor: pointer;
                   ">Stack trace</summary>
                   <pre style="
                     margin: 4px 0 0 0;
                     padding: 4px;
                     background: rgba(0, 0, 0, 0.3);
                     border-radius: 2px;
                     font-size: 9px;
                     overflow-x: auto;
                   ">${this.escapeHTML(error.stack)}</pre>
                 </details>`
              : ''
            }
          </div>
        `).join('')}
        ${errors.length > 5
          ? `<div style="
               font-size: 10px;
               color: var(--color-text-secondary, #888);
               text-align: center;
             ">
               ... and ${errors.length - 5} more
             </div>`
          : ''
        }
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // EVENT HANDLING
  // --------------------------------------------------------------------------

  private attachEventListeners(): void {
    this.element.querySelectorAll('.debug-control').forEach((control) => {
      const button = control as HTMLElement;
      const action = button.dataset.action;

      if (action === 'refresh') {
        button.onclick = () => this.render();
      } else if (action === 'clear') {
        button.onclick = () => this.clearErrors();
      } else if (action === 'auto-refresh') {
        const checkbox = control as HTMLInputElement;
        checkbox.onchange = () => {
          this.config = { ...this.config, autoRefresh: checkbox.checked };
          if (checkbox.checked) {
            this.startAutoRefresh();
          } else {
            this.stopAutoRefresh();
          }
        };
      }
    });
  }

  private clearErrors(): void {
    this.debugInfo.forEach((info, id) => {
      this.debugInfo.set(id, { ...info, errors: [] });
    });
    this.render();
  }

  // --------------------------------------------------------------------------
  // AUTO-REFRESH
  // --------------------------------------------------------------------------

  private startAutoRefresh(): void {
    if (this.refreshInterval !== null) {
      return;
    }

    this.refreshInterval = window.setInterval(
      () => this.render(),
      this.config.refreshInterval
    );
  }

  private stopAutoRefresh(): void {
    if (this.refreshInterval !== null) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // --------------------------------------------------------------------------
  // UTILITIES
  // --------------------------------------------------------------------------

  private formatTime(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  private escapeHTML(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --------------------------------------------------------------------------
  // LIFECYCLE
  // --------------------------------------------------------------------------

  destroy(): void {
    this.stopAutoRefresh();
    this.errorListeners.clear();
    this.debugInfo.clear();
    this.element.remove();
  }
}
