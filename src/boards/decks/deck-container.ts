/**
 * @fileoverview Deck Container Component
 *
 * Renders a deck with header, body, and tabs based on card layout.
 *
 * E003-E010: Deck container with multiple layout modes.
 *
 * @module @cardplay/boards/decks/deck-container
 */

import type { DeckInstance } from './factory-types';
import type { BoardDeck } from '../types';
import type { DeckRuntimeState } from './runtime-types';

// ============================================================================
// TYPES
// ============================================================================

export interface DeckContainerOptions {
  deck: BoardDeck;
  instance: DeckInstance;
  state: DeckRuntimeState;
  onClose?: () => void;
  onStateChange?: (state: Partial<DeckRuntimeState>) => void;
}

// ============================================================================
// DECK CONTAINER
// ============================================================================

/**
 * Creates a deck container element.
 *
 * E003-E010: Support tabs, stack, split, floating layouts.
 */
export class DeckContainer {
  private element: HTMLElement;
  private headerElement: HTMLElement;
  private bodyElement: HTMLElement;
  private options: DeckContainerOptions;

  constructor(options: DeckContainerOptions) {
    this.options = options;
    this.element = document.createElement('div');
    this.element.className = 'deck-container';
    this.element.setAttribute('data-deck-id', options.deck.id);
    this.element.setAttribute('data-deck-type', options.deck.type);

    // Create header
    this.headerElement = this.createHeader();
    this.element.appendChild(this.headerElement);

    // Create body
    this.bodyElement = document.createElement('div');
    this.bodyElement.className = 'deck-body';
    this.element.appendChild(this.bodyElement);

    // Render deck content
    this.renderDeckContent();

    // Apply styles
    this.injectStyles();
  }

  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'deck-header';

    // Title
    const title = document.createElement('h3');
    title.className = 'deck-title';
    title.textContent = this.options.instance.title;
    header.appendChild(title);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'deck-actions';

    // Add button
    const addBtn = document.createElement('button');
    addBtn.className = 'deck-action-btn';
    addBtn.textContent = '+';
    addBtn.title = 'Add item';
    addBtn.setAttribute('aria-label', 'Add item');
    actions.appendChild(addBtn);

    // Overflow menu button
    const menuBtn = document.createElement('button');
    menuBtn.className = 'deck-action-btn';
    menuBtn.textContent = '⋮';
    menuBtn.title = 'More actions';
    menuBtn.setAttribute('aria-label', 'More actions');
    menuBtn.onclick = (e) => this.showContextMenu(e);
    actions.appendChild(menuBtn);

    // Close button
    if (this.options.onClose) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'deck-action-btn';
      closeBtn.textContent = '×';
      closeBtn.title = 'Close deck';
      closeBtn.setAttribute('aria-label', 'Close deck');
      closeBtn.onclick = () => this.options.onClose?.();
      actions.appendChild(closeBtn);
    }

    header.appendChild(actions);

    return header;
  }

  /**
   * Shows context menu for deck actions.
   * E009: Deck-level context menu (move to panel, reset state).
   */
  private showContextMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    // Remove any existing context menu
    const existingMenu = document.querySelector('.deck-context-menu');
    if (existingMenu) {
      existingMenu.remove();
    }

    // Create context menu
    const menu = document.createElement('div');
    menu.className = 'deck-context-menu';
    menu.style.position = 'fixed';
    menu.style.left = `${event.clientX}px`;
    menu.style.top = `${event.clientY}px`;

    // Menu items
    const menuItems = [
      {
        label: 'Move to Left Panel',
        action: () => this.moveDeckToPanel('left'),
      },
      {
        label: 'Move to Right Panel',
        action: () => this.moveDeckToPanel('right'),
      },
      {
        label: 'Move to Bottom Panel',
        action: () => this.moveDeckToPanel('bottom'),
      },
      { separator: true },
      {
        label: 'Reset State',
        action: () => this.resetDeckState(),
      },
      {
        label: 'Reset Layout',
        action: () => this.resetDeckLayout(),
      },
    ];

    menuItems.forEach(item => {
      if ('separator' in item) {
        const separator = document.createElement('div');
        separator.className = 'deck-context-menu-separator';
        menu.appendChild(separator);
      } else {
        const menuItem = document.createElement('div');
        menuItem.className = 'deck-context-menu-item';
        menuItem.textContent = item.label;
        menuItem.onclick = () => {
          item.action();
          menu.remove();
        };
        menu.appendChild(menuItem);
      }
    });

    // Add to document
    document.body.appendChild(menu);

    // Close menu on outside click
    const closeMenu = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
  }

  private moveDeckToPanel(panel: 'left' | 'right' | 'bottom'): void {
    console.log(`Moving deck ${this.options.deck.id} to ${panel} panel`);
    // This would be implemented by the board host
    // For now, just log the action
  }

  private resetDeckState(): void {
    console.log(`Resetting state for deck ${this.options.deck.id}`);
    // Reset to default state
    if (this.options.onStateChange) {
      this.options.onStateChange({
        scrollTop: 0,
        scrollLeft: 0,
        focusedItemId: null,
        searchQuery: '',
        zoom: 1.0,
      });
    }
  }

  private resetDeckLayout(): void {
    console.log(`Resetting layout for deck ${this.options.deck.id}`);
    // Re-render with default layout
    this.renderDeckContent();
  }

  private renderDeckContent(): void {
    // Clear body
    this.bodyElement.innerHTML = '';

    // Render based on card layout
    const layout = this.options.deck.cardLayout || 'tabs';

    switch (layout) {
      case 'tabs':
        this.renderTabsLayout();
        break;
      case 'stack':
        this.renderStackLayout();
        break;
      case 'split':
        this.renderSplitLayout();
        break;
      case 'floating':
        this.renderFloatingLayout();
        break;
      default:
        this.renderDefaultLayout();
    }
  }

  private renderTabsLayout(): void {
    // E004: Tab bar + active tab content
    const tabBar = document.createElement('div');
    tabBar.className = 'deck-tabs';
    this.bodyElement.appendChild(tabBar);

    const tabContent = document.createElement('div');
    tabContent.className = 'deck-tab-content';
    this.bodyElement.appendChild(tabContent);

    // Render deck instance in tab content
    const rendered = this.options.instance.render();
    if (rendered) {
      tabContent.appendChild(rendered);
    }

    // Mount if needed
    if (this.options.instance.mount) {
      this.options.instance.mount(tabContent);
    }
  }

  private renderStackLayout(): void {
    // E005: StackComponent inside
    const stackContainer = document.createElement('div');
    stackContainer.className = 'deck-stack';
    this.bodyElement.appendChild(stackContainer);

    // Render deck instance
    const rendered = this.options.instance.render();
    if (rendered) {
      stackContainer.appendChild(rendered);
    }

    // Mount if needed
    if (this.options.instance.mount) {
      this.options.instance.mount(stackContainer);
    }
  }

  private renderSplitLayout(): void {
    // E006: Two child panes
    const splitContainer = document.createElement('div');
    splitContainer.className = 'deck-split';
    this.bodyElement.appendChild(splitContainer);

    const leftPane = document.createElement('div');
    leftPane.className = 'deck-split-pane';
    splitContainer.appendChild(leftPane);

    const rightPane = document.createElement('div');
    rightPane.className = 'deck-split-pane';
    splitContainer.appendChild(rightPane);

    // Render deck instance in left pane
    const rendered = this.options.instance.render();
    if (rendered) {
      leftPane.appendChild(rendered);
    }

    // Mount if needed
    if (this.options.instance.mount) {
      this.options.instance.mount(leftPane);
    }
  }

  private renderFloatingLayout(): void {
    // E007: Draggable/resizable wrapper
    const floatingContainer = document.createElement('div');
    floatingContainer.className = 'deck-floating';
    floatingContainer.style.position = 'absolute';
    floatingContainer.style.left = '50px';
    floatingContainer.style.top = '50px';
    floatingContainer.style.width = '400px';
    floatingContainer.style.height = '300px';
    this.bodyElement.appendChild(floatingContainer);

    // Render deck instance
    const rendered = this.options.instance.render();
    if (rendered) {
      floatingContainer.appendChild(rendered);
    }

    // Mount if needed
    if (this.options.instance.mount) {
      this.options.instance.mount(floatingContainer);
    }
  }

  private renderDefaultLayout(): void {
    // Default: render deck directly
    const rendered = this.options.instance.render();
    if (rendered) {
      this.bodyElement.appendChild(rendered);
    }

    // Mount if needed
    if (this.options.instance.mount) {
      this.options.instance.mount(this.bodyElement);
    }
  }

  private injectStyles(): void {
    const styleId = 'deck-container-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .deck-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--panel-bg, #1e1e1e);
        border: 1px solid var(--border-color, #3e3e3e);
        border-radius: 4px;
        overflow: hidden;
      }

      .deck-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background: var(--header-bg, #2a2a2a);
        border-bottom: 1px solid var(--border-color, #3e3e3e);
      }

      .deck-title {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary, #e0e0e0);
      }

      .deck-actions {
        display: flex;
        gap: 4px;
      }

      .deck-action-btn {
        background: transparent;
        border: none;
        color: var(--text-secondary, #999);
        font-size: 18px;
        padding: 4px 8px;
        cursor: pointer;
        border-radius: 4px;
        transition: background 0.2s;
      }

      .deck-action-btn:hover {
        background: var(--hover-bg, #3a3a3a);
        color: var(--text-primary, #e0e0e0);
      }

      .deck-action-btn:focus {
        outline: 2px solid var(--focus-color, #4a9eff);
        outline-offset: 2px;
      }

      .deck-body {
        flex: 1;
        overflow: auto;
        position: relative;
      }

      .deck-tabs {
        display: flex;
        gap: 2px;
        padding: 4px;
        background: var(--tabs-bg, #252525);
        border-bottom: 1px solid var(--border-color, #3e3e3e);
      }

      .deck-tab-content {
        flex: 1;
        overflow: auto;
      }

      .deck-stack {
        height: 100%;
        overflow: auto;
      }

      .deck-split {
        display: flex;
        height: 100%;
      }

      .deck-split-pane {
        flex: 1;
        overflow: auto;
      }

      .deck-floating {
        border: 1px solid var(--border-color, #3e3e3e);
        border-radius: 4px;
        background: var(--panel-bg, #1e1e1e);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      }
    `;
    document.head.appendChild(style);
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public destroy(): void {
    // Unmount deck instance
    if (this.options.instance.unmount) {
      this.options.instance.unmount();
    }

    // Destroy deck instance
    if (this.options.instance.destroy) {
      this.options.instance.destroy();
    }

    // Remove element
    this.element.remove();
  }

  public updateState(state: Partial<DeckRuntimeState>): void {
    // Update internal state
    Object.assign(this.options.state, state);

    // Notify parent
    if (this.options.onStateChange) {
      this.options.onStateChange(state);
    }
  }

  /**
   * Gets current deck state for persistence.
   * E010: Persist deck UI state via BoardStateStore.perBoardDeckState.
   */
  public getState(): DeckRuntimeState {
    return this.options.state;
  }

  /**
   * Restores deck state from persisted data.
   * E010: Persist deck UI state via BoardStateStore.perBoardDeckState.
   */
  public restoreState(state: Partial<DeckRuntimeState>): void {
    this.updateState(state);

    // Re-render if needed
    if (state.activeTabId !== undefined || state.zoom !== undefined) {
      this.renderDeckContent();
    }

    // Restore scroll position
    if (state.scrollTop !== undefined || state.scrollLeft !== undefined) {
      this.bodyElement.scrollTop = state.scrollTop ?? 0;
      this.bodyElement.scrollLeft = state.scrollLeft ?? 0;
    }
  }

  /**
   * Captures current UI state for persistence.
   * E010: Persist deck UI state via BoardStateStore.perBoardDeckState.
   */
  public captureCurrentState(): Partial<DeckRuntimeState> {
    return {
      scrollTop: this.bodyElement.scrollTop,
      scrollLeft: this.bodyElement.scrollLeft,
      activeTabId: this.options.state.activeTabId,
      zoom: this.options.state.zoom,
      searchQuery: this.options.state.searchQuery,
      filters: this.options.state.filters,
      collapsedSections: this.options.state.collapsedSections,
      timestamp: Date.now(),
    };
  }

  /**
   * Sets the active tab index.
   * E077: Support for tab switching with state persistence.
   */
  public setActiveTab(index: number): void {
    this.updateState({ activeTabId: `tab-${index}` });
    this.renderDeckContent();
  }

  /**
   * Sets the scroll position.
   * E077: Support for scroll position persistence.
   */
  public setScrollPosition(position: { x: number; y: number }): void {
    this.updateState({ scrollLeft: position.x, scrollTop: position.y });
    this.bodyElement.scrollLeft = position.x;
    this.bodyElement.scrollTop = position.y;
  }

  /**
   * Sets the focused item.
   * E077: Support for focused item persistence.
   */
  public setFocusedItem(itemId: string | null): void {
    this.updateState({ focusedItemId: itemId });
  }

  /**
   * Sets the filter state.
   * E077: Support for filter state persistence.
   */
  public setFilterState(filterState: { search: string; tags: string[] }): void {
    this.updateState({ 
      searchQuery: filterState.search,
      filters: { tags: filterState.tags }
    });
  }
}

/**
 * Creates a deck container element.
 */
export function createDeckContainer(options: DeckContainerOptions): DeckContainer {
  return new DeckContainer(options);
}
