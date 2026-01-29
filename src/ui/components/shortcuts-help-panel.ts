/**
 * @fileoverview Shortcuts Help Panel
 * 
 * Displays active board shortcuts and global shortcuts in a helpful panel.
 * Part of Phase J (J018) - helping users discover and learn shortcuts.
 * 
 * Features:
 * - Lists all active shortcuts by category
 * - Shows both global and board-specific shortcuts
 * - Keyboard-accessible and screen reader friendly
 * - Dark theme compatible
 * 
 * @module @cardplay/ui/components/shortcuts-help-panel
 */

import type { Board } from '../../boards/types';
import { KeyboardShortcutManager, type KeyboardShortcut, type ShortcutCategory } from '../keyboard-shortcuts';

export interface ShortcutsHelpPanelConfig {
  board?: Board;
  onClose?: () => void;
}

export class ShortcutsHelpPanel {
  private container: HTMLElement;
  private config: ShortcutsHelpPanelConfig;

  constructor(config: ShortcutsHelpPanelConfig = {}) {
    this.config = config;
    this.container = document.createElement('div');
    this.render();
  }

  getElement(): HTMLElement {
    return this.container;
  }

  private render(): void {
    this.container.className = 'shortcuts-help-panel';
    this.container.setAttribute('role', 'dialog');
    this.container.setAttribute('aria-labelledby', 'shortcuts-help-title');
    
    const shortcuts = this.getShortcuts();
    const categories = this.groupByCategory(shortcuts);
    
    this.container.innerHTML = `
      <div class="shortcuts-help-header">
        <h2 id="shortcuts-help-title">Keyboard Shortcuts</h2>
        ${this.config.board ? `<div class="shortcuts-help-board-name">${this.config.board.name}</div>` : ''}
        <button class="shortcuts-help-close" aria-label="Close shortcuts help">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="shortcuts-help-content">
        ${this.renderCategories(categories)}
      </div>
    `;
    
    const closeButton = this.container.querySelector('.shortcuts-help-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        if (this.config.onClose) {
          this.config.onClose();
        }
      });
    }
    
    // ESC to close
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.config.onClose) {
        this.config.onClose();
      }
    });
    
    this.injectStyles();
  }

  private getShortcuts(): KeyboardShortcut[] {
    const manager = KeyboardShortcutManager.getInstance();
    return Array.from(manager.getAllShortcuts());
  }

  private groupByCategory(shortcuts: KeyboardShortcut[]): Map<ShortcutCategory, KeyboardShortcut[]> {
    const groups = new Map<ShortcutCategory, KeyboardShortcut[]>();
    
    for (const shortcut of shortcuts) {
      const category = shortcut.category;
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(shortcut);
    }
    
    return groups;
  }

  private renderCategories(categories: Map<ShortcutCategory, KeyboardShortcut[]>): string {
    const categoryOrder: ShortcutCategory[] = [
      'edit',
      'transport',
      'navigation',
      'selection',
      'view',
      'file',
      'custom',
    ];
    
    const categoryLabels: Record<ShortcutCategory, string> = {
      edit: 'Editing',
      transport: 'Transport',
      navigation: 'Navigation',
      selection: 'Selection',
      view: 'View',
      file: 'File',
      custom: 'Board-Specific',
    };
    
    let html = '';
    
    for (const category of categoryOrder) {
      const shortcuts = categories.get(category);
      if (!shortcuts || shortcuts.length === 0) continue;
      
      html += `
        <div class="shortcuts-help-category">
          <h3 class="shortcuts-help-category-title">${categoryLabels[category]}</h3>
          <div class="shortcuts-help-list">
            ${shortcuts.map(s => this.renderShortcut(s)).join('')}
          </div>
        </div>
      `;
    }
    
    if (html === '') {
      html = '<div class="shortcuts-help-empty">No shortcuts available</div>';
    }
    
    return html;
  }

  private renderShortcut(shortcut: KeyboardShortcut): string {
    const keys = this.formatKeyCombo(shortcut.key, shortcut.modifiers);
    return `
      <div class="shortcuts-help-item">
        <div class="shortcuts-help-keys">${keys}</div>
        <div class="shortcuts-help-description">${shortcut.description}</div>
      </div>
    `;
  }

  private formatKeyCombo(key: string, modifiers: KeyboardShortcut['modifiers']): string {
    const parts: string[] = [];
    
    const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
    
    if (modifiers.ctrl) parts.push(isMac ? 'Ctrl' : 'Ctrl');
    if (modifiers.shift) parts.push('Shift');
    if (modifiers.alt) parts.push(isMac ? 'Option' : 'Alt');
    if (modifiers.meta) parts.push(isMac ? '⌘' : 'Win');
    
    parts.push(key.toUpperCase());
    
    return parts.map(p => `<kbd>${p}</kbd>`).join('<span class="shortcuts-help-plus">+</span>');
  }

  private injectStyles(): void {
    const styleId = 'cardplay-shortcuts-help-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .shortcuts-help-panel {
        background: var(--background-primary, #1a1a1a);
        color: var(--text-primary, #ffffff);
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        max-width: 600px;
        max-height: 80vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      
      .shortcuts-help-header {
        padding: 1.5rem;
        border-bottom: 1px solid var(--border-primary, #333);
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      
      .shortcuts-help-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        flex: 1;
      }
      
      .shortcuts-help-board-name {
        font-size: 0.875rem;
        color: var(--text-secondary, #aaa);
      }
      
      .shortcuts-help-close {
        background: none;
        border: none;
        color: var(--text-secondary, #aaa);
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      
      .shortcuts-help-close:hover {
        background: var(--background-secondary, #2a2a2a);
        color: var(--text-primary, #fff);
      }
      
      .shortcuts-help-close:focus {
        outline: 2px solid var(--focus-ring, #4a9eff);
        outline-offset: 2px;
      }
      
      .shortcuts-help-content {
        padding: 1.5rem;
        overflow-y: auto;
        flex: 1;
      }
      
      .shortcuts-help-category {
        margin-bottom: 2rem;
      }
      
      .shortcuts-help-category:last-child {
        margin-bottom: 0;
      }
      
      .shortcuts-help-category-title {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--board-accent, var(--accent-primary, #4a9eff));
      }
      
      .shortcuts-help-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      
      .shortcuts-help-item {
        display: grid;
        grid-template-columns: 180px 1fr;
        gap: 1rem;
        align-items: center;
        padding: 0.5rem;
        border-radius: 4px;
        transition: background 0.2s;
      }
      
      .shortcuts-help-item:hover {
        background: var(--background-secondary, #2a2a2a);
      }
      
      .shortcuts-help-keys {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        flex-wrap: wrap;
      }
      
      .shortcuts-help-keys kbd {
        background: var(--background-tertiary, #333);
        border: 1px solid var(--border-primary, #444);
        border-radius: 4px;
        padding: 0.25rem 0.5rem;
        font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
        font-size: 0.875rem;
        font-weight: 500;
        box-shadow: 0 1px 2px rgba(0,0,0,0.2);
      }
      
      .shortcuts-help-plus {
        color: var(--text-secondary, #aaa);
        font-size: 0.75rem;
        margin: 0 0.125rem;
      }
      
      .shortcuts-help-description {
        color: var(--text-secondary, #ccc);
        font-size: 0.875rem;
      }
      
      .shortcuts-help-empty {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--text-secondary, #aaa);
      }
      
      @media (max-width: 640px) {
        .shortcuts-help-panel {
          max-width: 100%;
          max-height: 100vh;
          border-radius: 0;
        }
        
        .shortcuts-help-item {
          grid-template-columns: 1fr;
          gap: 0.5rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  destroy(): void {
    this.container.remove();
  }
}

/**
 * Helper to open shortcuts help in a modal
 */
export function openShortcutsHelp(board: Board | undefined): ShortcutsHelpPanel {
  const config: ShortcutsHelpPanelConfig = {};
  
  if (board) {
    config.board = board;
  }
  
  const panel = new ShortcutsHelpPanel(config);
  
  // Set close handler after creation
  (panel as any).config.onClose = () => {
    panel.destroy();
  };
  
  // Mount in modal root
  const modalRoot = document.getElementById('modal-root') || document.body;
  modalRoot.appendChild(panel.getElement());
  
  // Focus the panel
  panel.getElement().focus();
  
  return panel;
}
