/**
 * @fileoverview Shortcuts Help View (J018)
 * 
 * Displays active keyboard shortcuts for the current board and active deck.
 * Organized by category with search/filter capabilities.
 * 
 * @module @cardplay/ui/components/shortcuts-help
 */

import type { Board } from '../../boards/types';

/**
 * Shortcut display info
 */
export interface ShortcutDisplay {
  key: string;
  label: string;
  description: string;
  category: string;
}

/**
 * Shortcuts help panel options
 */
export interface ShortcutsHelpOptions {
  /** Current active board */
  board?: Board;
  /** Show platform-specific keys (Cmd vs Ctrl) */
  platformSpecific?: boolean;
  /** Allow search/filtering */
  searchable?: boolean;
}

/**
 * Shortcuts Help View Component (J018)
 * 
 * Lists all active shortcuts for the current board and deck,
 * organized by category for easy reference.
 */
export class ShortcutsHelp {
  private container: HTMLElement;
  private options: ShortcutsHelpOptions;
  private shortcuts: ShortcutDisplay[] = [];
  private filteredShortcuts: ShortcutDisplay[] = [];
  private searchTerm = '';

  constructor(container: HTMLElement, options: ShortcutsHelpOptions = {}) {
    this.container = container;
    this.options = {
      platformSpecific: true,
      searchable: true,
      ...options
    };

    this.loadShortcuts();
    this.render();
  }

  /**
   * Set the active board to show shortcuts for
   */
  setBoard(board: Board): void {
    this.options.board = board;
    this.loadShortcuts();
    this.render();
  }

  /**
   * Filter shortcuts by search term
   */
  search(term: string): void {
    this.searchTerm = term.toLowerCase();
    this.filterShortcuts();
    this.render();
  }

  /**
   * Load shortcuts from board and global registry
   */
  private loadShortcuts(): void {
    this.shortcuts = [];

    // Global shortcuts
    this.addGlobalShortcuts();

    // Board-specific shortcuts
    if (this.options.board) {
      this.addBoardShortcuts(this.options.board);
    }

    // Deck-specific shortcuts (would come from active deck context)
    // TODO: Add deck shortcuts when deck context is available

    this.filteredShortcuts = [...this.shortcuts];
  }

  /**
   * Add global shortcuts (J014, J017)
   */
  private addGlobalShortcuts(): void {
    const isMac = this.options.platformSpecific && navigator.platform.includes('Mac');
    const mod = isMac ? 'Cmd' : 'Ctrl';

    this.shortcuts.push(
      // Board switching (J014)
      {
        key: `${mod}+B`,
        label: 'Switch Board',
        description: 'Open board switcher to change boards',
        category: 'Navigation'
      },
      
      // Undo/Redo
      {
        key: `${mod}+Z`,
        label: 'Undo',
        description: 'Undo last action',
        category: 'Edit'
      },
      {
        key: `${mod}+Shift+Z`,
        label: 'Redo',
        description: 'Redo last undone action',
        category: 'Edit'
      },
      
      // Transport (J017)
      {
        key: 'Space',
        label: 'Play/Pause',
        description: 'Toggle playback',
        category: 'Transport'
      },
      {
        key: 'Enter',
        label: 'Play from Start',
        description: 'Start playback from beginning',
        category: 'Transport'
      },
      {
        key: 'Esc',
        label: 'Stop',
        description: 'Stop playback',
        category: 'Transport'
      },

      // View
      {
        key: `${mod}+/`,
        label: 'Show Shortcuts',
        description: 'Open this shortcuts help panel',
        category: 'View'
      }
    );
  }

  /**
   * Add board-specific shortcuts
   */
  private addBoardShortcuts(board: Board): void {
    if (!board.shortcuts) return;

    const isMac = this.options.platformSpecific && navigator.platform.includes('Mac');
    const mod = isMac ? 'Cmd' : 'Ctrl';

    // Convert board shortcuts map to display format
    for (const [keys, action] of Object.entries(board.shortcuts)) {
      // Format keys with platform-specific modifiers
      const formattedKeys = keys.replace(/mod/gi, mod);
      
      this.shortcuts.push({
        key: formattedKeys,
        label: this.formatActionLabel(action),
        description: this.getActionDescription(action),
        category: this.getActionCategory(action, board)
      });
    }

    // Deck tab switching (J015)
    for (let i = 1; i <= 9; i++) {
      this.shortcuts.push({
        key: `${mod}+${i}`,
        label: `Switch to Deck ${i}`,
        description: `Activate deck tab ${i} in active container`,
        category: 'Navigation'
      });
    }

    // AI Composer shortcut (J016) - only for boards with AI composer
    if (board.compositionTools.aiComposer?.enabled) {
      this.shortcuts.push({
        key: `${mod}+K`,
        label: 'AI Command Palette',
        description: 'Open AI composition command palette',
        category: 'AI Tools'
      });
    }
  }

  /**
   * Filter shortcuts based on search term
   */
  private filterShortcuts(): void {
    if (!this.searchTerm) {
      this.filteredShortcuts = [...this.shortcuts];
      return;
    }

    this.filteredShortcuts = this.shortcuts.filter(shortcut =>
      shortcut.key.toLowerCase().includes(this.searchTerm) ||
      shortcut.label.toLowerCase().includes(this.searchTerm) ||
      shortcut.description.toLowerCase().includes(this.searchTerm) ||
      shortcut.category.toLowerCase().includes(this.searchTerm)
    );
  }

  /**
   * Render the shortcuts help panel
   */
  private render(): void {
    this.container.innerHTML = '';

    const panel = document.createElement('div');
    panel.className = 'shortcuts-help-panel';

    // Header
    const header = this.createHeader();
    panel.appendChild(header);

    // Search (if enabled)
    if (this.options.searchable) {
      const search = this.createSearchBox();
      panel.appendChild(search);
    }

    // Shortcuts list by category
    const list = this.createShortcutsList();
    panel.appendChild(list);

    this.container.appendChild(panel);
  }

  /**
   * Create header section
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'shortcuts-header';

    const title = document.createElement('h2');
    title.className = 'shortcuts-title';
    title.textContent = 'Keyboard Shortcuts';
    header.appendChild(title);

    if (this.options.board) {
      const boardName = document.createElement('p');
      boardName.className = 'shortcuts-board-name';
      boardName.textContent = `Board: ${this.options.board.name}`;
      header.appendChild(boardName);
    }

    return header;
  }

  /**
   * Create search box
   */
  private createSearchBox(): HTMLElement {
    const searchContainer = document.createElement('div');
    searchContainer.className = 'shortcuts-search';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search shortcuts...';
    searchInput.className = 'shortcuts-search-input';
    searchInput.value = this.searchTerm;
    searchInput.addEventListener('input', (e) => {
      this.search((e.target as HTMLInputElement).value);
    });

    searchContainer.appendChild(searchInput);
    return searchContainer;
  }

  /**
   * Create shortcuts list organized by category
   */
  private createShortcutsList(): HTMLElement {
    const list = document.createElement('div');
    list.className = 'shortcuts-list';

    // Group by category
    const categories = new Map<string, ShortcutDisplay[]>();
    
    for (const shortcut of this.filteredShortcuts) {
      if (!categories.has(shortcut.category)) {
        categories.set(shortcut.category, []);
      }
      categories.get(shortcut.category)!.push(shortcut);
    }

    // Render each category
    const categoryOrder = ['Navigation', 'Edit', 'Transport', 'View', 'AI Tools', 'Custom'];
    
    for (const category of categoryOrder) {
      const shortcuts = categories.get(category);
      if (!shortcuts || shortcuts.length === 0) continue;

      const categorySection = this.createCategorySection(category, shortcuts);
      list.appendChild(categorySection);
    }

    // Render remaining categories not in order
    for (const [category, shortcuts] of categories) {
      if (categoryOrder.includes(category)) continue;
      
      const categorySection = this.createCategorySection(category, shortcuts);
      list.appendChild(categorySection);
    }

    // Empty state if no results
    if (this.filteredShortcuts.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'shortcuts-empty';
      empty.textContent = 'No shortcuts found';
      list.appendChild(empty);
    }

    return list;
  }

  /**
   * Create category section
   */
  private createCategorySection(category: string, shortcuts: ShortcutDisplay[]): HTMLElement {
    const section = document.createElement('div');
    section.className = 'shortcuts-category';

    const categoryTitle = document.createElement('h3');
    categoryTitle.className = 'shortcuts-category-title';
    categoryTitle.textContent = category;
    section.appendChild(categoryTitle);

    const shortcutsList = document.createElement('dl');
    shortcutsList.className = 'shortcuts-category-list';

    for (const shortcut of shortcuts) {
      const item = this.createShortcutItem(shortcut);
      shortcutsList.appendChild(item);
    }

    section.appendChild(shortcutsList);
    return section;
  }

  /**
   * Create shortcut item
   */
  private createShortcutItem(shortcut: ShortcutDisplay): HTMLElement {
    const item = document.createElement('div');
    item.className = 'shortcut-item';

    const dt = document.createElement('dt');
    dt.className = 'shortcut-keys';
    
    // Parse and render keys
    const keys = shortcut.key.split('+');
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]?.trim() || '';
      const kbd = document.createElement('kbd');
      kbd.className = 'shortcut-key';
      kbd.textContent = key;
      dt.appendChild(kbd);
      
      if (i < keys.length - 1) {
        const plus = document.createElement('span');
        plus.className = 'shortcut-plus';
        plus.textContent = '+';
        dt.appendChild(plus);
      }
    }

    const dd = document.createElement('dd');
    dd.className = 'shortcut-description';
    
    const label = document.createElement('span');
    label.className = 'shortcut-label';
    label.textContent = shortcut.label;
    dd.appendChild(label);

    const desc = document.createElement('span');
    desc.className = 'shortcut-desc';
    desc.textContent = shortcut.description;
    dd.appendChild(desc);

    item.appendChild(dt);
    item.appendChild(dd);

    return item;
  }

  /**
   * Format action label from action string
   */
  private formatActionLabel(action: string): string {
    // Convert kebab-case or snake_case to Title Case
    return action
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  /**
   * Get action description
   */
  private getActionDescription(action: string): string {
    // TODO: Load from i18n or description map
    return `Perform ${this.formatActionLabel(action).toLowerCase()}`;
  }

  /**
   * Get action category
   */
  private getActionCategory(action: string, _board: Board): string {
    // Infer category from action name or board context
    if (action.includes('generate') || action.includes('ai')) {
      return 'AI Tools';
    }
    if (action.includes('play') || action.includes('stop') || action.includes('tempo')) {
      return 'Transport';
    }
    if (action.includes('undo') || action.includes('redo') || action.includes('copy') || action.includes('paste')) {
      return 'Edit';
    }
    if (action.includes('zoom') || action.includes('view') || action.includes('show')) {
      return 'View';
    }
    if (action.includes('deck') || action.includes('board') || action.includes('tab')) {
      return 'Navigation';
    }
    return 'Custom';
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.container.innerHTML = '';
  }
}

/**
 * Inject shortcuts help styles
 */
export function injectShortcutsHelpStyles(): void {
  if (typeof document === 'undefined') return;
  
  const styleId = 'shortcuts-help-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
/* Shortcuts Help Styles (J018) */
.shortcuts-help-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
}

.shortcuts-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--color-outline-variant);
}

.shortcuts-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-on-surface);
  margin: 0;
}

.shortcuts-board-name {
  font-size: 0.875rem;
  color: var(--color-on-surface-variant);
  margin: 0;
}

.shortcuts-search {
  margin-bottom: 1rem;
}

.shortcuts-search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-on-surface);
  font-size: 1rem;
}

.shortcuts-search-input:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.shortcuts-category {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.shortcuts-category-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-on-surface);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-outline-variant);
}

.shortcuts-category-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 0;
}

.shortcut-item {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 1rem;
  align-items: start;
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  transition: background 0.2s ease;
}

.shortcut-item:hover {
  background: var(--color-surface-container);
}

.shortcut-keys {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;
  margin: 0;
}

.shortcut-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.5rem;
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-sm);
  background: var(--color-surface-container);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-on-surface);
}

.shortcut-plus {
  font-size: 0.75rem;
  color: var(--color-on-surface-variant);
  margin: 0 0.125rem;
}

.shortcut-description {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0;
}

.shortcut-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-on-surface);
}

.shortcut-desc {
  font-size: 0.8125rem;
  color: var(--color-on-surface-variant);
}

.shortcuts-empty {
  padding: 3rem;
  text-align: center;
  color: var(--color-on-surface-variant);
  font-style: italic;
}

/* Responsive */
@media (max-width: 640px) {
  .shortcut-item {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
}

/* High contrast support */
@media (prefers-contrast: more) {
  .shortcut-key {
    border-width: 2px;
  }
  
  .shortcuts-category-title {
    border-bottom-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .shortcut-item {
    transition: none;
  }
}
`;
  
  document.head.appendChild(style);
}
