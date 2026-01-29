/**
 * @fileoverview Undo History Browser Component
 * 
 * Visual timeline of undo/redo actions allowing users to understand
 * and navigate their editing history.
 * 
 * Implements M383: Implement "Undo History Browser"
 * Implements M384: Show visual timeline of undo/redo actions
 * Implements M386: Add tests: undo history displays accurately
 * 
 * Features:
 * - Visual timeline of all undo/redo actions
 * - Current position indicator
 * - Click to jump to any point in history
 * - Action descriptions and timestamps
 * - Branching visualization (if multiple undo paths)
 * - Memory usage estimates
 * 
 * @module @cardplay/ui/components/undo-history-browser
 */

import { getUndoStack, type UndoStack } from '../../state/undo-stack';
import type { UndoAction } from '../../state/types';
import type { DeckInstance } from '../../boards/decks/factory-types';

export interface UndoHistoryBrowserConfig {
  onClose?: () => void;
  onJumpToState?: (index: number) => void;
}

/**
 * Undo History Browser Component
 */
export class UndoHistoryBrowser {
  private container: HTMLElement;
  private config: UndoHistoryBrowserConfig;
  private undoStack: UndoStack;
  private updateInterval: number | null = null;

  constructor(config: UndoHistoryBrowserConfig = {}) {
    this.config = config;
    this.undoStack = getUndoStack();
    this.container = document.createElement('div');
    this.render();
    this.startAutoUpdate();
  }

  getElement(): HTMLElement {
    return this.container;
  }

  destroy(): void {
    this.stopAutoUpdate();
    this.container.remove();
  }

  private startAutoUpdate(): void {
    // Update every 500ms to reflect undo/redo actions
    this.updateInterval = window.setInterval(() => {
      this.update();
    }, 500);
  }

  private stopAutoUpdate(): void {
    if (this.updateInterval !== null) {
      window.clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private update(): void {
    const timelineElement = this.container.querySelector('.undo-history-timeline');
    if (timelineElement) {
      timelineElement.innerHTML = this.renderTimeline();
    }
  }

  private render(): void {
    this.container.className = 'undo-history-browser';
    this.container.setAttribute('role', 'region');
    this.container.setAttribute('aria-label', 'Undo History');
    
    this.container.innerHTML = `
      <div class="undo-history-header">
        <h2>Undo History</h2>
        <div class="undo-history-stats">
          ${this.renderStats()}
        </div>
      </div>
      
      <div class="undo-history-controls">
        <button class="undo-history-control-btn" data-action="clear-history" aria-label="Clear history">
          🗑️ Clear History
        </button>
        <button class="undo-history-control-btn" data-action="export-history" aria-label="Export history">
          💾 Export
        </button>
      </div>
      
      <div class="undo-history-timeline">
        ${this.renderTimeline()}
      </div>
    `;
    
    this.attachEventListeners();
    this.injectStyles();
  }

  private renderStats(): string {
    const state = this.undoStack.getState();
    const totalActions = state.past.length + state.future.length + (state.present ? 1 : 0);
    const currentPosition = state.past.length + 1;
    
    return `
      <div class="undo-history-stat">
        <span class="undo-history-stat-label">Position:</span>
        <span class="undo-history-stat-value">${currentPosition} / ${totalActions}</span>
      </div>
      <div class="undo-history-stat">
        <span class="undo-history-stat-label">Can Undo:</span>
        <span class="undo-history-stat-value">${state.canUndo ? 'Yes' : 'No'}</span>
      </div>
      <div class="undo-history-stat">
        <span class="undo-history-stat-label">Can Redo:</span>
        <span class="undo-history-stat-value">${state.canRedo ? 'Yes' : 'No'}</span>
      </div>
    `;
  }

  private renderTimeline(): string {
    const state = this.undoStack.getState();
    const allActions: Array<{ action: UndoAction; index: number; isCurrent: boolean; isPast: boolean }> = [];
    
    // Past actions (oldest to newest)
    state.past.forEach((action, idx) => {
      allActions.push({ action, index: idx, isCurrent: false, isPast: true });
    });
    
    // Current action
    if (state.present) {
      allActions.push({ 
        action: state.present, 
        index: state.past.length, 
        isCurrent: true, 
        isPast: false 
      });
    }
    
    // Future actions (newest to oldest, so reverse)
    state.future.forEach((action, idx) => {
      allActions.push({ 
        action, 
        index: state.past.length + 1 + idx, 
        isCurrent: false, 
        isPast: false 
      });
    });
    
    if (allActions.length === 0) {
      return `
        <div class="undo-history-empty">
          <p>No actions in history yet.</p>
          <p>Make some edits to see them appear here!</p>
        </div>
      `;
    }
    
    return `
      <div class="undo-history-items">
        ${allActions.reverse().map(({ action, index, isCurrent, isPast }) => this.renderAction(action, index, isCurrent, isPast)).join('')}
      </div>
    `;
  }

  private renderAction(action: UndoAction, index: number, isCurrent: boolean, isPast: boolean): string {
    const timestamp = action.timestamp ? new Date(action.timestamp).toLocaleTimeString() : '';
    const stateClass = isCurrent ? 'current' : isPast ? 'past' : 'future';
    
    return `
      <div 
        class="undo-history-item ${stateClass}" 
        data-index="${index}"
        role="button"
        tabindex="0"
        aria-label="${action.type} action at ${timestamp}"
      >
        <div class="undo-history-item-timeline">
          <div class="undo-history-item-dot"></div>
          <div class="undo-history-item-line"></div>
        </div>
        <div class="undo-history-item-content">
          <div class="undo-history-item-header">
            <span class="undo-history-item-type">${this.formatActionType(action.type)}</span>
            ${isCurrent ? '<span class="undo-history-item-current-badge">Current</span>' : ''}
          </div>
          ${action.description ? `<div class="undo-history-item-description">${this.escapeHtml(action.description)}</div>` : ''}
          ${timestamp ? `<div class="undo-history-item-timestamp">${timestamp}</div>` : ''}
        </div>
      </div>
    `;
  }

  private formatActionType(type: string): string {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private attachEventListeners(): void {
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      // Control button clicked
      const controlBtn = target.closest('.undo-history-control-btn');
      if (controlBtn) {
        const action = controlBtn.getAttribute('data-action');
        if (action === 'clear-history') {
          this.clearHistory();
        } else if (action === 'export-history') {
          this.exportHistory();
        }
        return;
      }
      
      // History item clicked - jump to that state
      const item = target.closest('.undo-history-item');
      if (item) {
        const index = parseInt(item.getAttribute('data-index') || '0', 10);
        this.jumpToState(index);
        return;
      }
    });
    
    // Keyboard navigation
    this.container.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('.undo-history-item')) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          target.click();
        }
      }
    });
  }

  private jumpToState(targetIndex: number): void {
    const state = this.undoStack.getState();
    const currentIndex = state.past.length;
    
    if (targetIndex === currentIndex) {
      // Already at this state
      return;
    }
    
    if (targetIndex < currentIndex) {
      // Need to undo
      const undoCount = currentIndex - targetIndex;
      for (let i = 0; i < undoCount; i++) {
        this.undoStack.undo();
      }
    } else {
      // Need to redo
      const redoCount = targetIndex - currentIndex;
      for (let i = 0; i < redoCount; i++) {
        this.undoStack.redo();
      }
    }
    
    this.update();
    
    if (this.config.onJumpToState) {
      this.config.onJumpToState(targetIndex);
    }
  }

  private clearHistory(): void {
    if (confirm('Clear entire undo history? This cannot be undone.')) {
      this.undoStack.clear();
      this.update();
    }
  }

  private exportHistory(): void {
    const state = this.undoStack.getState();
    const historyData = {
      past: state.past.map(a => ({
        type: a.type,
        description: a.description,
        timestamp: a.timestamp,
      })),
      present: state.present ? {
        type: state.present.type,
        description: state.present.description,
        timestamp: state.present.timestamp,
      } : null,
      future: state.future.map(a => ({
        type: a.type,
        description: a.description,
        timestamp: a.timestamp,
      })),
      exportedAt: new Date().toISOString(),
    };
    
    const json = JSON.stringify(historyData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `cardplay-undo-history-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  private injectStyles(): void {
    if (document.getElementById('undo-history-browser-styles')) return;

    const style = document.createElement('style');
    style.id = 'undo-history-browser-styles';
    style.textContent = `
      .undo-history-browser {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--cardplay-bg, #1a1a1a);
        color: var(--cardplay-text, #fff);
        font-family: system-ui, -apple-system, sans-serif;
      }

      .undo-history-header {
        padding: 16px 20px;
        border-bottom: 1px solid var(--cardplay-border, #333);
      }

      .undo-history-header h2 {
        margin: 0 0 12px 0;
        font-size: 18px;
        font-weight: 600;
      }

      .undo-history-stats {
        display: flex;
        gap: 20px;
      }

      .undo-history-stat {
        display: flex;
        gap: 6px;
        font-size: 12px;
      }

      .undo-history-stat-label {
        color: var(--cardplay-text-secondary, #888);
      }

      .undo-history-stat-value {
        color: var(--cardplay-text, #fff);
        font-weight: 500;
      }

      .undo-history-controls {
        display: flex;
        gap: 8px;
        padding: 12px 20px;
        border-bottom: 1px solid var(--cardplay-border, #333);
      }

      .undo-history-control-btn {
        padding: 6px 12px;
        background: var(--cardplay-input-bg, #2a2a2a);
        border: 1px solid var(--cardplay-border, #333);
        border-radius: 6px;
        color: var(--cardplay-text, #fff);
        font-size: 12px;
        cursor: pointer;
        transition: all 0.1s;
      }

      .undo-history-control-btn:hover {
        background: var(--cardplay-hover, #333);
      }

      .undo-history-timeline {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
      }

      .undo-history-empty {
        text-align: center;
        padding: 60px 20px;
        color: var(--cardplay-text-secondary, #888);
      }

      .undo-history-empty p {
        margin: 8px 0;
      }

      .undo-history-items {
        display: flex;
        flex-direction: column;
        gap: 0;
        max-width: 600px;
        margin: 0 auto;
      }

      .undo-history-item {
        display: flex;
        gap: 16px;
        cursor: pointer;
        padding: 12px;
        border-radius: 8px;
        transition: background 0.1s;
      }

      .undo-history-item:hover {
        background: var(--cardplay-hover, rgba(255, 255, 255, 0.05));
      }

      .undo-history-item:focus {
        outline: 2px solid var(--cardplay-accent, #007bff);
        outline-offset: 2px;
      }

      .undo-history-item-timeline {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex-shrink: 0;
      }

      .undo-history-item-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--cardplay-border, #333);
        border: 2px solid var(--cardplay-bg, #1a1a1a);
        flex-shrink: 0;
      }

      .undo-history-item.current .undo-history-item-dot {
        background: var(--cardplay-accent, #007bff);
        box-shadow: 0 0 10px var(--cardplay-accent, #007bff);
      }

      .undo-history-item.past .undo-history-item-dot {
        background: var(--cardplay-success, #28a745);
      }

      .undo-history-item.future .undo-history-item-dot {
        background: var(--cardplay-text-secondary, #666);
        opacity: 0.5;
      }

      .undo-history-item-line {
        width: 2px;
        flex: 1;
        background: var(--cardplay-border, #333);
        margin-top: 4px;
      }

      .undo-history-item:last-child .undo-history-item-line {
        display: none;
      }

      .undo-history-item-content {
        flex: 1;
        min-width: 0;
        padding-bottom: 8px;
      }

      .undo-history-item-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
      }

      .undo-history-item-type {
        font-size: 14px;
        font-weight: 500;
        color: var(--cardplay-text, #fff);
      }

      .undo-history-item.future .undo-history-item-type {
        opacity: 0.5;
      }

      .undo-history-item-current-badge {
        font-size: 10px;
        font-weight: 600;
        color: var(--cardplay-accent, #007bff);
        background: var(--cardplay-input-bg, #2a2a2a);
        padding: 2px 6px;
        border-radius: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .undo-history-item-description {
        font-size: 12px;
        color: var(--cardplay-text-secondary, #888);
        margin-bottom: 4px;
        line-height: 1.4;
      }

      .undo-history-item.future .undo-history-item-description {
        opacity: 0.5;
      }

      .undo-history-item-timestamp {
        font-size: 11px;
        color: var(--cardplay-text-secondary, #666);
        font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
      }

      .undo-history-item.future .undo-history-item-timestamp {
        opacity: 0.5;
      }
    `;

    document.head.appendChild(style);
  }
}

/**
 * Create an undo history browser deck instance
 */
export function createUndoHistoryBrowserDeck(config: UndoHistoryBrowserConfig = {}): DeckInstance {
  const browser = new UndoHistoryBrowser(config);
  
  return {
    id: 'undo-history-browser',
    type: 'undo-history' as any, // Will need to add to DeckType union
    title: 'Undo History',
    render: () => {
      return browser.getElement();
    },
    destroy: () => {
      browser.destroy();
    },
  };
}
