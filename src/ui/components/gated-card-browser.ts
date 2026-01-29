/**
 * @fileoverview Gated Card Browser Component
 *
 * D031-D037: UI integration for card gating system.
 * 
 * Shows available cards filtered by board gating rules, with
 * optional "show disabled" mode to reveal why cards are unavailable.
 *
 * @module @cardplay/ui/components/gated-card-browser
 */

import { getBoardStateStore } from '../../boards/store/store';
import { getBoardRegistry } from '../../boards/registry';
import { isCardAllowed } from '../../boards/gating/is-card-allowed';
import { whyNotAllowed } from '../../boards/gating/why-not';
import type { Board } from '../../boards/types';
import type { CardMeta } from '../../cards/card';

// ============================================================================
// TYPES
// ============================================================================

/** Gated card browser options */
export interface GatedCardBrowserOptions {
  /** Container element */
  container: HTMLElement;
  /** Card source (all available cards) */
  cards: CardMeta[];
  /** Callback when card is selected */
  onCardSelect: (card: CardMeta) => void;
  /** Show search input */
  showSearch?: boolean;
  /** Show category filters */
  showCategories?: boolean;
  /** Initial show-disabled state */
  initialShowDisabled?: boolean;
}

// ============================================================================
// GATED CARD BROWSER
// ============================================================================

/**
 * Card browser with board gating integration.
 * 
 * D031: Filter out decks not visible per board
 * D032: Consult isCardAllowed before showing cards
 * D033: Hide disallowed cards by default
 * D034: Add "Show disabled" toggle
 * D035: Show whyNotAllowed tooltip on disabled cards
 * D036: Prevent disallowed drops (handled by drop-handlers.ts)
 */
export class GatedCardBrowser {
  private container: HTMLElement;
  private cards: CardMeta[];
  private onCardSelect: (card: CardMeta) => void;
  private options: Required<GatedCardBrowserOptions>;
  
  private currentBoard: Board | undefined;
  private showDisabled = false;
  private searchQuery = '';
  private selectedCategory: string | null = null;
  
  // DOM elements
  private searchInput: HTMLInputElement | null = null;
  private showDisabledToggle: HTMLInputElement | null = null;
  private categoryFilters: HTMLElement | null = null;
  private cardList: HTMLElement | null = null;
  
  constructor(options: GatedCardBrowserOptions) {
    this.container = options.container;
    this.cards = options.cards;
    this.onCardSelect = options.onCardSelect;
    this.options = {
      ...options,
      showSearch: options.showSearch ?? true,
      showCategories: options.showCategories ?? true,
      initialShowDisabled: options.initialShowDisabled ?? false,
    };
    
    this.showDisabled = this.options.initialShowDisabled;
    this.loadCurrentBoard();
    this.render();
  }
  
  // ===========================================================================
  // BOARD STATE
  // ===========================================================================
  
  private loadCurrentBoard(): void {
    const boardState = getBoardStateStore().getState();
    const boardId = boardState.currentBoardId;
    if (boardId) {
      this.currentBoard = getBoardRegistry().get(boardId);
    }
  }
  
  // ===========================================================================
  // CARD FILTERING
  // ===========================================================================
  
  /**
   * D032: Consult isCardAllowed before showing cards
   */
  private filterCards(): CardMeta[] {
    let filtered = this.cards;
    
    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(card => 
        card.name.toLowerCase().includes(query) ||
        card.description?.toLowerCase().includes(query) ||
        card.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(card => card.category === this.selectedCategory);
    }
    
    // D033: Hide disallowed cards by default (unless showing disabled)
    if (!this.showDisabled && this.currentBoard) {
      filtered = filtered.filter(card => isCardAllowed(this.currentBoard!, card));
    }
    
    return filtered;
  }
  
  /**
   * Get unique categories from cards
   */
  private getCategories(): string[] {
    const categories = new Set<string>();
    this.cards.forEach(card => categories.add(card.category));
    return Array.from(categories).sort();
  }
  
  // ===========================================================================
  // RENDERING
  // ===========================================================================
  
  private render(): void {
    this.container.innerHTML = '';
    this.container.className = 'gated-card-browser';
    
    // Header with search and controls
    const header = this.createHeader();
    this.container.appendChild(header);
    
    // Category filters
    if (this.options.showCategories) {
      const categories = this.createCategoryFilters();
      this.container.appendChild(categories);
    }
    
    // Card list
    const list = this.createCardList();
    this.container.appendChild(list);
    
    // Apply styles
    this.injectStyles();
  }
  
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'card-browser-header';
    
    // D034: Show disabled toggle
    const controls = document.createElement('div');
    controls.className = 'browser-controls';
    
    const toggleLabel = document.createElement('label');
    toggleLabel.className = 'show-disabled-toggle';
    
    this.showDisabledToggle = document.createElement('input');
    this.showDisabledToggle.type = 'checkbox';
    this.showDisabledToggle.checked = this.showDisabled;
    this.showDisabledToggle.addEventListener('change', () => {
      this.showDisabled = this.showDisabledToggle!.checked;
      this.updateCardList();
    });
    
    const toggleText = document.createElement('span');
    toggleText.textContent = 'Show disabled';
    toggleText.style.marginLeft = '6px';
    toggleText.style.fontSize = '13px';
    
    toggleLabel.appendChild(this.showDisabledToggle);
    toggleLabel.appendChild(toggleText);
    controls.appendChild(toggleLabel);
    header.appendChild(controls);
    
    // Search input
    if (this.options.showSearch) {
      this.searchInput = document.createElement('input');
      this.searchInput.type = 'text';
      this.searchInput.placeholder = 'Search cards...';
      this.searchInput.className = 'browser-search';
      this.searchInput.addEventListener('input', () => {
        this.searchQuery = this.searchInput!.value;
        this.updateCardList();
      });
      header.appendChild(this.searchInput);
    }
    
    return header;
  }
  
  private createCategoryFilters(): HTMLElement {
    const categoryFilters = document.createElement('div');
    categoryFilters.className = 'category-filters';
    this.categoryFilters = categoryFilters;
    
    const categories = this.getCategories();
    
    // "All" button
    const allBtn = this.createCategoryButton('All', null);
    categoryFilters.appendChild(allBtn);
    
    // Category buttons
    categories.forEach(category => {
      const btn = this.createCategoryButton(category, category);
      categoryFilters.appendChild(btn);
    });
    
    return categoryFilters;
  }
  
  private createCategoryButton(label: string, category: string | null): HTMLElement {
    const btn = document.createElement('button');
    btn.className = 'category-btn';
    btn.textContent = label;
    btn.dataset.category = category ?? 'all';
    
    if (this.selectedCategory === category) {
      btn.classList.add('active');
    }
    
    btn.addEventListener('click', () => {
      this.selectedCategory = category;
      this.updateCategoryButtons();
      this.updateCardList();
    });
    
    return btn;
  }
  
  private updateCategoryButtons(): void {
    const categoryFilters = this.categoryFilters;
    if (!categoryFilters) return;
    
    const buttons = categoryFilters.querySelectorAll('.category-btn');
    buttons.forEach(btn => {
      const category = btn.getAttribute('data-category');
      if (category === 'all' && this.selectedCategory === null) {
        btn.classList.add('active');
      } else if (category === this.selectedCategory) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
  
  private createCardList(): HTMLElement {
    this.cardList = document.createElement('div');
    this.cardList.className = 'card-list';
    
    this.updateCardList();
    
    return this.cardList;
  }
  
  private updateCardList(): void {
    const cardList = this.cardList;
    if (!cardList) return;
    
    cardList.innerHTML = '';
    const filtered = this.filterCards();
    
    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = this.searchQuery 
        ? 'No cards match your search'
        : 'No cards available';
      cardList.appendChild(empty);
      return;
    }
    
    filtered.forEach(card => {
      const item = this.createCardItem(card);
      cardList.appendChild(item);
    });
  }
  
  /**
   * Create a card item with gating awareness
   * 
   * D032: Check if allowed
   * D035: Show why-not tooltip for disabled cards
   */
  private createCardItem(card: CardMeta): HTMLElement {
    const item = document.createElement('div');
    item.className = 'card-item';
    item.dataset.cardId = card.id;
    
    // Check if card is allowed on current board
    const allowed = this.currentBoard 
      ? isCardAllowed(this.currentBoard, card)
      : true;
    
    if (!allowed) {
      item.classList.add('disabled');
    }
    
    // Icon
    if (card.icon) {
      const icon = document.createElement('span');
      icon.className = 'card-icon';
      icon.textContent = card.icon;
      item.appendChild(icon);
    }
    
    // Info
    const info = document.createElement('div');
    info.className = 'card-info';
    
    const name = document.createElement('div');
    name.className = 'card-name';
    name.textContent = card.name;
    info.appendChild(name);
    
    if (card.description) {
      const desc = document.createElement('div');
      desc.className = 'card-description';
      desc.textContent = card.description;
      info.appendChild(desc);
    }
    
    item.appendChild(info);
    
    // D035: Show why-not tooltip for disabled cards
    if (!allowed && this.currentBoard) {
      const reason = whyNotAllowed(this.currentBoard, card);
      if (reason) {
        item.title = reason;
        
        const badge = document.createElement('span');
        badge.className = 'disabled-badge';
        badge.textContent = '🚫';
        badge.title = reason;
        item.appendChild(badge);
      }
    }
    
    // Click handler (only for allowed cards)
    if (allowed) {
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => {
        this.onCardSelect(card);
      });
      
      // Drag support
      item.draggable = true;
      item.addEventListener('dragstart', (e) => {
        const dataTransfer = e.dataTransfer;
        if (!dataTransfer) return;
        dataTransfer.effectAllowed = 'copy';
        dataTransfer.setData('application/x-card-template', JSON.stringify({
          id: card.id,
          type: card.category,
          name: card.name,
        }));
      });
    }
    
    return item;
  }
  
  private injectStyles(): void {
    const styleId = 'gated-card-browser-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .gated-card-browser {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: #1e1e1e;
        color: #e0e0e0;
      }
      
      .card-browser-header {
        padding: 12px;
        border-bottom: 1px solid #3e3e3e;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .browser-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .show-disabled-toggle {
        display: flex;
        align-items: center;
        cursor: pointer;
        user-select: none;
      }
      
      .show-disabled-toggle input[type="checkbox"] {
        cursor: pointer;
      }
      
      .browser-search {
        width: 100%;
        padding: 8px;
        background: #2a2a2a;
        border: 1px solid #3e3e3e;
        border-radius: 4px;
        color: #e0e0e0;
        font-size: 13px;
      }
      
      .browser-search:focus {
        outline: none;
        border-color: #6366f1;
      }
      
      .category-filters {
        display: flex;
        gap: 4px;
        padding: 8px 12px;
        border-bottom: 1px solid #3e3e3e;
        overflow-x: auto;
      }
      
      .category-btn {
        padding: 6px 12px;
        background: #2a2a2a;
        border: 1px solid #3e3e3e;
        border-radius: 4px;
        color: #e0e0e0;
        font-size: 12px;
        cursor: pointer;
        white-space: nowrap;
      }
      
      .category-btn:hover {
        background: #363636;
      }
      
      .category-btn.active {
        background: #6366f1;
        border-color: #6366f1;
      }
      
      .card-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
      }
      
      .card-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: #2a2a2a;
        border: 1px solid #3e3e3e;
        border-radius: 4px;
        margin-bottom: 8px;
        transition: all 0.2s;
      }
      
      .card-item:hover:not(.disabled) {
        background: #363636;
        border-color: #6366f1;
      }
      
      .card-item.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .card-icon {
        font-size: 24px;
        flex-shrink: 0;
      }
      
      .card-info {
        flex: 1;
        min-width: 0;
      }
      
      .card-name {
        font-weight: 500;
        font-size: 14px;
        margin-bottom: 2px;
      }
      
      .card-description {
        font-size: 12px;
        color: #a0a0a0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .disabled-badge {
        flex-shrink: 0;
        font-size: 16px;
      }
      
      .empty-state {
        padding: 40px 20px;
        text-align: center;
        color: #808080;
        font-size: 14px;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // ===========================================================================
  // PUBLIC API
  // ===========================================================================
  
  /**
   * Refresh the browser (e.g., after board switch)
   * D038: Ensure gating updates live when board switches
   */
  public refresh(): void {
    this.loadCurrentBoard();
    this.updateCardList();
  }
  
  /**
   * Set cards
   */
  public setCards(cards: CardMeta[]): void {
    this.cards = cards;
    this.updateCardList();
  }
  
  /**
   * Destroy the browser
   */
  public destroy(): void {
    this.container.innerHTML = '';
  }
}

/**
 * D037: Board-level capabilities UI panel (dev-only)
 * Shows visible decks and enabled tools for debugging
 */
export function createCapabilitiesDebugPanel(board: Board): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'capabilities-debug-panel';
  panel.style.cssText = `
    position: fixed;
    top: 60px;
    right: 20px;
    width: 300px;
    max-height: 400px;
    overflow: auto;
    background: #1e1e1e;
    border: 1px solid #6366f1;
    border-radius: 8px;
    padding: 16px;
    z-index: 10000;
    font-family: monospace;
    font-size: 12px;
    color: #e0e0e0;
  `;
  
  const title = document.createElement('h3');
  title.textContent = 'Board Capabilities (Dev)';
  title.style.margin = '0 0 12px 0';
  title.style.fontSize = '14px';
  title.style.fontWeight = 'bold';
  panel.appendChild(title);
  
  // Board info
  const boardInfo = document.createElement('div');
  boardInfo.style.marginBottom = '12px';
  boardInfo.innerHTML = `
    <strong>Board:</strong> ${board.name}<br>
    <strong>Level:</strong> ${board.controlLevel}<br>
    <strong>Decks:</strong> ${board.decks.length}
  `;
  panel.appendChild(boardInfo);
  
  // Tool config
  const toolsHeader = document.createElement('div');
  toolsHeader.textContent = 'Enabled Tools:';
  toolsHeader.style.fontWeight = 'bold';
  toolsHeader.style.marginTop = '12px';
  toolsHeader.style.marginBottom = '6px';
  panel.appendChild(toolsHeader);
  
  const toolsList = document.createElement('ul');
  toolsList.style.margin = '0';
  toolsList.style.paddingLeft = '20px';
  
  Object.entries(board.compositionTools).forEach(([tool, config]) => {
    if (config.enabled) {
      const item = document.createElement('li');
      item.textContent = `${tool}: ${config.mode}`;
      toolsList.appendChild(item);
    }
  });
  
  if (toolsList.children.length === 0) {
    const item = document.createElement('li');
    item.textContent = 'None (full manual)';
    item.style.color = '#808080';
    toolsList.appendChild(item);
  }
  
  panel.appendChild(toolsList);
  
  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: none;
    color: #e0e0e0;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  closeBtn.addEventListener('click', () => panel.remove());
  panel.appendChild(closeBtn);
  
  return panel;
}
