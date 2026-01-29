/**
 * @fileoverview Gating Debug Overlay
 *
 * D071-D072: Visual overlay showing gating status for debugging
 * 
 * Shows current board, enabled tools, visible decks, and card filtering rules
 * in a floating dev panel. Hidden in production builds.
 *
 * @module @cardplay/ui/components/gating-debug-overlay
 */

import { getBoardStateStore } from '../../boards/store/store';
import { getBoardRegistry } from '../../boards/registry';
import { computeBoardCapabilities } from '../../boards/gating/capabilities';
import type { Board } from '../../boards/types';

// ============================================================================
// GATING DEBUG OVERLAY
// ============================================================================

/**
 * D071: Gating debug overlay showing current board + enabled tools
 * D072: Hidden in production builds (controlled by env var or build flag)
 */
export class GatingDebugOverlay {
  private container: HTMLElement | null = null;
  private isVisible = false;
  private updateInterval: number | null = null;
  
  constructor() {
    if (this.isProductionBuild()) {
      console.log('[GatingDebugOverlay] Disabled in production build');
      return;
    }
    
    this.createOverlay();
    this.setupKeyboardShortcut();
  }
  
  // ===========================================================================
  // BUILD CHECK
  // ===========================================================================
  
  /**
   * D072: Check if we're in production build
   */
  private isProductionBuild(): boolean {
    // Check environment variables
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'production';
    }
    
    // Check for __DEV__ global (common convention)
    if (typeof (globalThis as any).__DEV__ !== 'undefined') {
      return !(globalThis as any).__DEV__;
    }
    
    // Default to dev mode if we can't determine
    return false;
  }
  
  // ===========================================================================
  // OVERLAY CREATION
  // ===========================================================================
  
  private createOverlay(): void {
    this.container = document.createElement('div');
    this.container.className = 'gating-debug-overlay';
    this.container.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      width: 350px;
      max-height: 600px;
      overflow: auto;
      background: rgba(0, 0, 0, 0.95);
      border: 2px solid #6366f1;
      border-radius: 8px;
      padding: 16px;
      z-index: 99999;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #e0e0e0;
      display: none;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    `;
    
    document.body.appendChild(this.container);
    this.updateContent();
  }
  
  // ===========================================================================
  // KEYBOARD SHORTCUT
  // ===========================================================================
  
  private setupKeyboardShortcut(): void {
    // Ctrl+Shift+G to toggle overlay
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'G') {
        e.preventDefault();
        this.toggle();
      }
    });
  }
  
  // ===========================================================================
  // CONTENT UPDATES
  // ===========================================================================
  
  private updateContent(): void {
    if (!this.container) return;
    
    const boardState = getBoardStateStore().getState();
    const boardId = boardState.currentBoardId;
    const board = boardId ? getBoardRegistry().get(boardId) : undefined;
    
    if (!board) {
      this.container.innerHTML = `
        <div style="color: #f87171;">
          <strong>⚠ No Board Active</strong>
        </div>
      `;
      return;
    }
    
    const capabilities = computeBoardCapabilities(board);
    
    this.container.innerHTML = `
      ${this.renderHeader(board)}
      ${this.renderBoardInfo(board)}
      ${this.renderToolConfig(board)}
      ${this.renderCapabilities(capabilities)}
      ${this.renderDecks(board)}
      ${this.renderFooter()}
    `;
  }
  
  private renderHeader(_board: Board): string {
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3e3e3e;">
        <strong style="color: #6366f1; font-size: 14px;">🔍 Gating Debug</strong>
        <button onclick="this.closest('.gating-debug-overlay').style.display='none'" 
                style="background: none; border: none; color: #e0e0e0; font-size: 18px; cursor: pointer; padding: 0; width: 24px; height: 24px;">×</button>
      </div>
    `;
  }
  
  private renderBoardInfo(board: Board): string {
    return `
      <div style="margin-bottom: 16px;">
        <div style="color: #a0a0a0; font-size: 11px; margin-bottom: 4px;">CURRENT BOARD</div>
        <div style="font-weight: bold; color: #4ade80;">${board.name}</div>
        <div style="font-size: 11px; color: #a0a0a0; margin-top: 2px;">ID: ${board.id}</div>
        <div style="margin-top: 8px;">
          <span style="display: inline-block; padding: 2px 8px; background: ${this.getControlLevelColor(board.controlLevel)}; color: #000; border-radius: 3px; font-size: 11px; font-weight: bold;">
            ${board.controlLevel}
          </span>
        </div>
      </div>
    `;
  }
  
  private renderToolConfig(board: Board): string {
    const tools = Object.entries(board.compositionTools)
      .filter(([_, config]) => config.enabled)
      .map(([tool, config]) => `
        <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #2a2a2a;">
          <span style="color: #a0a0a0;">${tool}</span>
          <span style="color: #4ade80; font-weight: bold;">${config.mode}</span>
        </div>
      `)
      .join('');
    
    if (!tools) {
      return `
        <div style="margin-bottom: 16px;">
          <div style="color: #a0a0a0; font-size: 11px; margin-bottom: 4px;">ENABLED TOOLS</div>
          <div style="color: #808080; font-style: italic;">None (Full Manual)</div>
        </div>
      `;
    }
    
    return `
      <div style="margin-bottom: 16px;">
        <div style="color: #a0a0a0; font-size: 11px; margin-bottom: 8px;">ENABLED TOOLS</div>
        <div style="font-size: 11px;">
          ${tools}
        </div>
      </div>
    `;
  }
  
  private renderCapabilities(capabilities: any): string {
    const flags = Object.entries(capabilities)
      .filter(([key]) => key.startsWith('can'))
      .map(([key, value]) => `
        <div style="display: flex; align-items: center; padding: 2px 0;">
          <span style="color: ${value ? '#4ade80' : '#f87171'}; margin-right: 6px;">
            ${value ? '✓' : '✗'}
          </span>
          <span style="color: #a0a0a0; font-size: 11px;">${key}</span>
        </div>
      `)
      .join('');
    
    return `
      <div style="margin-bottom: 16px;">
        <div style="color: #a0a0a0; font-size: 11px; margin-bottom: 8px;">CAPABILITIES</div>
        <div>
          ${flags}
        </div>
      </div>
    `;
  }
  
  private renderDecks(board: Board): string {
    const decks = board.decks
      .map(deck => `
        <div style="padding: 4px 0; border-bottom: 1px solid #2a2a2a;">
          <div style="color: #e0e0e0; font-weight: bold; font-size: 11px;">${deck.id}</div>
          <div style="color: #808080; font-size: 10px;">Type: ${deck.type}</div>
          <div style="color: #808080; font-size: 10px;">Layout: ${deck.cardLayout}</div>
        </div>
      `)
      .join('');
    
    return `
      <div style="margin-bottom: 16px;">
        <div style="color: #a0a0a0; font-size: 11px; margin-bottom: 8px;">DECKS (${board.decks.length})</div>
        <div style="max-height: 200px; overflow-y: auto; font-size: 11px;">
          ${decks || '<div style="color: #808080; font-style: italic;">No decks</div>'}
        </div>
      </div>
    `;
  }
  
  private renderFooter(): string {
    return `
      <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #3e3e3e; font-size: 10px; color: #808080;">
        Press <kbd style="background: #2a2a2a; padding: 2px 6px; border-radius: 3px;">Ctrl+Shift+G</kbd> to toggle
      </div>
    `;
  }
  
  private getControlLevelColor(level: string): string {
    const colors: Record<string, string> = {
      'full-manual': '#818cf8',
      'manual-with-hints': '#60a5fa',
      'assisted': '#34d399',
      'directed': '#fbbf24',
      'generative': '#f87171',
      'collaborative': '#a78bfa',
    };
    return colors[level] || '#808080';
  }
  
  // ===========================================================================
  // PUBLIC API
  // ===========================================================================
  
  /**
   * Toggle overlay visibility
   */
  public toggle(): void {
    if (!this.container) return;
    
    this.isVisible = !this.isVisible;
    this.container.style.display = this.isVisible ? 'block' : 'none';
    
    if (this.isVisible) {
      this.startAutoUpdate();
      this.updateContent();
    } else {
      this.stopAutoUpdate();
    }
  }
  
  /**
   * Show overlay
   */
  public show(): void {
    if (!this.container) return;
    this.isVisible = true;
    this.container.style.display = 'block';
    this.startAutoUpdate();
    this.updateContent();
  }
  
  /**
   * Hide overlay
   */
  public hide(): void {
    if (!this.container) return;
    this.isVisible = false;
    this.container.style.display = 'none';
    this.stopAutoUpdate();
  }
  
  /**
   * Force content refresh
   */
  public refresh(): void {
    this.updateContent();
  }
  
  /**
   * Start auto-updating (1 second interval)
   */
  private startAutoUpdate(): void {
    if (this.updateInterval !== null) return;
    
    this.updateInterval = window.setInterval(() => {
      this.updateContent();
    }, 1000);
  }
  
  /**
   * Stop auto-updating
   */
  private stopAutoUpdate(): void {
    if (this.updateInterval !== null) {
      window.clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  /**
   * Destroy overlay and clean up
   */
  public destroy(): void {
    this.stopAutoUpdate();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let overlayInstance: GatingDebugOverlay | null = null;

/**
 * Get or create the gating debug overlay singleton
 */
export function getGatingDebugOverlay(): GatingDebugOverlay {
  if (!overlayInstance) {
    overlayInstance = new GatingDebugOverlay();
  }
  return overlayInstance;
}

/**
 * Initialize overlay on app startup (dev mode only)
 */
export function initGatingDebugOverlay(): void {
  if (typeof window !== 'undefined') {
    // Create overlay instance (will self-disable in production)
    getGatingDebugOverlay();
    
    // Log helper message in dev console
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
      console.log(
        '%c[CardPlay Dev] %cGating debug overlay available: Press Ctrl+Shift+G',
        'color: #6366f1; font-weight: bold',
        'color: #a0a0a0'
      );
    }
  }
}
