/**
 * @fileoverview Board State Inspector (C091-C093)
 * 
 * Dev-only panel for inspecting and debugging board state/layout persistence.
 * 
 * @module @cardplay/ui/components/board-state-inspector
 */

import { getBoardStateStore } from '../../boards/store/store';
import { getBoardContextStore } from '../../boards/context/store';
import { getBoardRegistry } from '../../boards/registry';

/**
 * C091-C093: Board state inspector dev panel
 */
export class BoardStateInspector {
  private container: HTMLElement;
  private panel: HTMLElement | null = null;
  private visible = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.setupPanel();
    this.setupKeyboardShortcut();
  }

  private setupPanel(): void {
    this.panel = document.createElement('div');
    this.panel.className = 'board-state-inspector';
    this.panel.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 500px;
      background: #1a1a1a;
      border-left: 1px solid #333;
      z-index: 10000;
      display: none;
      flex-direction: column;
      color: #fff;
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 12px;
      overflow: hidden;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px;
      background: #252525;
      border-bottom: 1px solid #333;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    header.innerHTML = `
      <h3 style="margin: 0; font-size: 14px; font-weight: 600;">🔍 Board State Inspector</h3>
      <button id="closeInspector" style="background: none; border: none; color: #999; cursor: pointer; font-size: 18px;">×</button>
    `;
    this.panel.appendChild(header);

    // Content area
    const content = document.createElement('div');
    content.id = 'inspectorContent';
    content.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    `;
    this.panel.appendChild(content);

    // Actions footer
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 16px;
      background: #252525;
      border-top: 1px solid #333;
      display: flex;
      gap: 8px;
    `;
    footer.innerHTML = `
      <button id="copyBoardState" style="flex: 1; padding: 8px; background: #3b82f6; border: none; border-radius: 4px; color: white; cursor: pointer;">Copy Board State JSON</button>
      <button id="copyLayoutState" style="flex: 1; padding: 8px; background: #10b981; border: none; border-radius: 4px; color: white; cursor: pointer;">Copy Layout JSON</button>
      <button id="refreshInspector" style="padding: 8px 16px; background: #6b7280; border: none; border-radius: 4px; color: white; cursor: pointer;">↻</button>
    `;
    this.panel.appendChild(footer);

    // Event listeners
    header.querySelector('#closeInspector')!.addEventListener('click', () => this.hide());
    footer.querySelector('#copyBoardState')!.addEventListener('click', () => this.copyBoardState());
    footer.querySelector('#copyLayoutState')!.addEventListener('click', () => this.copyLayoutState());
    footer.querySelector('#refreshInspector')!.addEventListener('click', () => this.render());

    this.container.appendChild(this.panel);
  }

  private setupKeyboardShortcut(): void {
    // Cmd+Shift+I to toggle inspector (dev only)
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  toggle(): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show(): void {
    if (!this.panel) return;
    this.visible = true;
    this.panel.style.display = 'flex';
    this.render();
  }

  hide(): void {
    if (!this.panel) return;
    this.visible = false;
    this.panel.style.display = 'none';
  }

  private render(): void {
    if (!this.panel) return;

    const content = this.panel.querySelector('#inspectorContent');
    if (!content) return;

    const store = getBoardStateStore();
    const contextStore = getBoardContextStore();
    const registry = getBoardRegistry();
    const state = store.getState();
    const context = contextStore.getContext();

    content.innerHTML = `
      <div style="margin-bottom: 24px;">
        <h4 style="margin: 0 0 8px 0; color: #3b82f6; font-size: 13px;">Current Board</h4>
        <div style="background: #252525; padding: 12px; border-radius: 4px;">
          <div><span style="color: #999;">ID:</span> ${state.currentBoardId || 'none'}</div>
          ${state.currentBoardId ? `
            <div><span style="color: #999;">Name:</span> ${registry.get(state.currentBoardId)?.name || 'Unknown'}</div>
            <div><span style="color: #999;">Control Level:</span> ${registry.get(state.currentBoardId)?.controlLevel || 'unknown'}</div>
          ` : ''}
        </div>
      </div>

      <div style="margin-bottom: 24px;">
        <h4 style="margin: 0 0 8px 0; color: #10b981; font-size: 13px;">Active Context</h4>
        <div style="background: #252525; padding: 12px; border-radius: 4px; font-size: 11px;">
          <div><span style="color: #999;">Stream:</span> ${context.activeStreamId || 'none'}</div>
          <div><span style="color: #999;">Clip:</span> ${context.activeClipId || 'none'}</div>
          <div><span style="color: #999;">Track:</span> ${context.activeTrackId || 'none'}</div>
          <div><span style="color: #999;">Deck:</span> ${context.activeDeckId || 'none'}</div>
          <div><span style="color: #999;">View:</span> ${context.activeViewType || 'none'}</div>
        </div>
      </div>

      <div style="margin-bottom: 24px;">
        <h4 style="margin: 0 0 8px 0; color: #f59e0b; font-size: 13px;">Recent Boards</h4>
        <div style="background: #252525; padding: 12px; border-radius: 4px;">
          ${state.recentBoardIds.length > 0 
            ? state.recentBoardIds.map(id => `<div>• ${registry.get(id)?.name || id}</div>`).join('')
            : '<div style="color: #666;">No recent boards</div>'}
        </div>
      </div>

      <div style="margin-bottom: 24px;">
        <h4 style="margin: 0 0 8px 0; color: #ec4899; font-size: 13px;">Favorite Boards</h4>
        <div style="background: #252525; padding: 12px; border-radius: 4px;">
          ${state.favoriteBoardIds.length > 0
            ? state.favoriteBoardIds.map(id => `<div>⭐ ${registry.get(id)?.name || id}</div>`).join('')
            : '<div style="color: #666;">No favorites</div>'}
        </div>
      </div>

      <div style="margin-bottom: 24px;">
        <h4 style="margin: 0 0 8px 0; color: #8b5cf6; font-size: 13px;">Persisted Board State</h4>
        <div style="background: #252525; padding: 12px; border-radius: 4px;">
          <div><span style="color: #999;">Version:</span> ${state.version}</div>
          <div><span style="color: #999;">First Run Completed:</span> ${state.firstRunCompleted ? 'Yes' : 'No'}</div>
          <div><span style="color: #999;">Last Opened:</span> ${state.lastOpenedAt ? new Date(state.lastOpenedAt).toLocaleString() : 'Never'}</div>
          <div><span style="color: #999;">Layout States:</span> ${Object.keys(state.perBoardLayout).length} boards</div>
          <div><span style="color: #999;">Deck States:</span> ${Object.keys(state.perBoardDeckState).length} boards</div>
        </div>
      </div>

      <div>
        <h4 style="margin: 0 0 8px 0; color: #14b8a6; font-size: 13px;">Registered Boards (${registry.list().length})</h4>
        <div style="background: #252525; padding: 12px; border-radius: 4px; max-height: 200px; overflow-y: auto;">
          ${registry.list().map(board => `
            <div style="margin-bottom: 8px; padding: 8px; background: #1a1a1a; border-radius: 4px;">
              <div style="font-weight: 600;">${board.name}</div>
              <div style="font-size: 10px; color: #666;">
                ${board.id} • ${board.controlLevel} • ${board.decks.length} decks
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private copyBoardState(): void {
    const store = getBoardStateStore();
    const state = store.getState();
    const json = JSON.stringify(state, null, 2);
    
    navigator.clipboard.writeText(json).then(() => {
      this.showCopyNotification('Board state copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      this.showCopyNotification('Failed to copy (see console)', true);
    });
  }

  private copyLayoutState(): void {
    const store = getBoardStateStore();
    const state = store.getState();
    const currentBoardId = state.currentBoardId;
    
    if (!currentBoardId) {
      this.showCopyNotification('No active board', true);
      return;
    }
    
    const layoutState = state.perBoardLayout[currentBoardId];
    const json = JSON.stringify(layoutState, null, 2);
    
    navigator.clipboard.writeText(json).then(() => {
      this.showCopyNotification('Layout state copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      this.showCopyNotification('Failed to copy (see console)', true);
    });
  }

  private showCopyNotification(message: string, isError = false): void {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 524px;
      background: ${isError ? '#ef4444' : '#10b981'};
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-family: sans-serif;
      z-index: 10001;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  destroy(): void {
    if (this.panel) {
      this.panel.remove();
    }
  }
}

/**
 * Initialize the board state inspector (dev mode only).
 */
export function initBoardStateInspector(): BoardStateInspector | null {
  // Only enable in development
  if (import.meta.env.PROD) {
    return null;
  }

  const rootContainer = document.getElementById('root') || document.body;
  return new BoardStateInspector(rootContainer);
}
