/**
 * @fileoverview Stack Component System
 * 
 * Container component for organizing cards:
 * - Header with collapse/expand
 * - Card count badge
 * - Drag handle for reordering stacks
 * - Context menu integration
 * - Virtual scrolling for large stacks
 * - Add-card button
 * - Filter and search
 * 
 * @module @cardplay/ui/components/stack-component
 */

import { CardComponent } from './card-component';

// ============================================================================
// TYPES
// ============================================================================

/** Stack state */
export type StackState = 'idle' | 'collapsed' | 'dragging' | 'locked' | 'loading';

/** Stack orientation */
export type StackOrientation = 'horizontal' | 'vertical';

/** Stack overflow behavior */
export type StackOverflow = 'scroll' | 'wrap' | 'hidden';

/** Card filter function */
export type CardFilter = (card: CardComponent) => boolean;

/** Stack sort function */
export type CardSort = (a: CardComponent, b: CardComponent) => number;

/** Stack event */
export interface StackEvent {
  type: 'card-add' | 'card-remove' | 'card-move' | 'collapse' | 'expand' | 'reorder';
  stackId: string;
  cardId?: string;
  index?: number;
}

/** Stack lifecycle hooks */
export interface StackLifecycle {
  onMount?: () => void;
  onUnmount?: () => void;
  onCollapse?: () => void;
  onExpand?: () => void;
  onCardAdd?: (card: CardComponent, index: number) => void;
  onCardRemove?: (card: CardComponent, index: number) => void;
  onCardMove?: (card: CardComponent, fromIndex: number, toIndex: number) => void;
  onReorder?: (newIndex: number) => void;
  onContextMenu?: (e: MouseEvent) => void;
  onDragStart?: (e: PointerEvent) => void;
  onDragEnd?: (e: PointerEvent) => void;
}

/** Stack options */
export interface StackOptions {
  id: string;
  name: string;
  type: string;
  
  // Appearance
  icon?: string;
  color?: string;
  orientation?: StackOrientation;
  
  // Capacity
  maxCards?: number;
  minCards?: number;
  
  // Behavior
  collapsible?: boolean;
  initiallyCollapsed?: boolean;
  lockable?: boolean;
  locked?: boolean;
  reorderable?: boolean;
  
  // Overflow
  overflow?: StackOverflow;
  virtualScroll?: boolean;
  virtualScrollThreshold?: number;
  
  // Card acceptance
  acceptsTypes?: string[];
  
  // Add card
  showAddButton?: boolean;
  addButtonLabel?: string;
  onAddClick?: () => void;
  
  // Filter/Search
  showSearch?: boolean;
  searchPlaceholder?: string;
  
  // Lifecycle
  lifecycle?: StackLifecycle;
  
  // Accessibility
  ariaLabel?: string;
}

/** Virtual scroll state */
interface VirtualScrollState {
  scrollTop: number;
  viewportHeight: number;
  itemHeight: number;
  overscan: number;
  startIndex: number;
  endIndex: number;
  totalHeight: number;
}

// ============================================================================
// STACK COMPONENT
// ============================================================================

/**
 * Stack component for organizing cards
 */
export class StackComponent {
  // Identity
  readonly id: string;
  readonly name: string;
  readonly type: string;
  
  // DOM
  private container: HTMLElement;
  private header: HTMLElement;
  private content: HTMLElement;
  private cardContainer: HTMLElement;
  private addButton: HTMLElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private countBadge: HTMLElement;
  private lockIndicator: HTMLElement | null = null;
  private cpuIndicator: HTMLElement | null = null;
  private emptyState: HTMLElement;
  private loadingOverlay: HTMLElement;
  
  // State
  private _state: StackState = 'idle';
  private _collapsed: boolean = false;
  private _locked: boolean = false;
  private _loading: boolean = false;
  
  // Cards
  private cards: CardComponent[] = [];
  private filteredCards: CardComponent[] = [];
  private cardElements: Map<string, HTMLElement> = new Map();
  
  // Filter/Search
  private currentFilter: CardFilter | null = null;
  private searchQuery: string = '';
  private currentSort: CardSort | null = null;
  
  // Options
  private options: StackOptions;
  
  // Drag state
  private isDragging = false;
  private dragStartY = 0;
  
  // Virtual scroll
  private virtualScroll: VirtualScrollState | null = null;
  private scrollTimeout: number | null = null;
  
  // Performance
  private cpuUsage: number = 0;
  
  constructor(options: StackOptions) {
    this.id = options.id;
    this.name = options.name;
    this.type = options.type;
    this.options = {
      orientation: 'vertical',
      maxCards: 50,
      collapsible: true,
      initiallyCollapsed: false,
      lockable: false,
      locked: false,
      reorderable: true,
      overflow: 'scroll',
      virtualScroll: false,
      virtualScrollThreshold: 30,
      showAddButton: true,
      addButtonLabel: 'Add Card',
      showSearch: false,
      searchPlaceholder: 'Search cards...',
      ...options
    };
    
    this._collapsed = this.options.initiallyCollapsed ?? false;
    this._locked = this.options.locked ?? false;
    
    // Create DOM
    this.container = this.createContainer();
    this.header = this.createHeader();
    this.content = this.createContent();
    this.cardContainer = this.createCardContainer();
    this.countBadge = this.createCountBadge();
    this.emptyState = this.createEmptyState();
    this.loadingOverlay = this.createLoadingOverlay();
    
    this.assembleDOM();
    this.setupEventListeners();
    this.setupAccessibility();
    
    // Initial state
    this.updateCollapsedState();
    this.updateCountBadge();
    this.updateEmptyState();
    
    // Call mount lifecycle
    this.options.lifecycle?.onMount?.();
  }
  
  // ===========================================================================
  // DOM CREATION
  // ===========================================================================
  
  private createContainer(): HTMLElement {
    const el = document.createElement('div');
    el.className = `stack-component stack-${this.options.orientation}`;
    el.dataset.stackId = this.id;
    el.dataset.stackType = this.type;
    el.dataset.stackState = this._state;
    el.style.setProperty('--stack-color', this.options.color ?? '#6366f1');
    
    return el;
  }
  
  private createHeader(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'stack-header';
    
    // Drag handle (for reordering stacks)
    if (this.options.reorderable) {
      const dragHandle = document.createElement('div');
      dragHandle.className = 'stack-drag-handle';
      dragHandle.innerHTML = this.getIconSVG('grip');
      dragHandle.title = 'Drag to reorder';
      el.appendChild(dragHandle);
    }
    
    // Icon
    if (this.options.icon) {
      const icon = document.createElement('span');
      icon.className = 'stack-icon';
      icon.innerHTML = this.getIconSVG(this.options.icon);
      el.appendChild(icon);
    }
    
    // Name
    const name = document.createElement('span');
    name.className = 'stack-name';
    name.textContent = this.name;
    el.appendChild(name);
    
    // Spacer
    const spacer = document.createElement('div');
    spacer.className = 'stack-header-spacer';
    el.appendChild(spacer);
    
    // Count badge (added separately)
    
    // Actions
    const actions = document.createElement('div');
    actions.className = 'stack-header-actions';
    
    // Lock indicator
    if (this.options.lockable) {
      this.lockIndicator = document.createElement('button');
      this.lockIndicator.className = 'stack-action-btn stack-lock-btn';
      this.lockIndicator.innerHTML = this.getIconSVG(this._locked ? 'lock' : 'unlock');
      this.lockIndicator.title = this._locked ? 'Unlock' : 'Lock';
      this.lockIndicator.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleLock();
      });
      actions.appendChild(this.lockIndicator);
    }
    
    // Collapse toggle
    if (this.options.collapsible) {
      const collapseBtn = document.createElement('button');
      collapseBtn.className = 'stack-action-btn stack-collapse-btn';
      collapseBtn.innerHTML = this.getIconSVG(this._collapsed ? 'chevron-right' : 'chevron-down');
      collapseBtn.title = this._collapsed ? 'Expand' : 'Collapse';
      collapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleCollapse();
      });
      actions.appendChild(collapseBtn);
    }
    
    el.appendChild(actions);
    
    return el;
  }
  
  private createContent(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'stack-content';
    
    return el;
  }
  
  private createCardContainer(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'stack-cards';
    
    if (this.options.overflow === 'scroll') {
      el.classList.add('stack-cards-scroll');
    } else if (this.options.overflow === 'wrap') {
      el.classList.add('stack-cards-wrap');
    }
    
    return el;
  }
  
  private createCountBadge(): HTMLElement {
    const el = document.createElement('span');
    el.className = 'stack-count-badge';
    el.textContent = '0';
    return el;
  }
  
  private createAddButton(): HTMLElement {
    const el = document.createElement('button');
    el.className = 'stack-add-btn';
    el.innerHTML = `${this.getIconSVG('plus')} <span>${this.options.addButtonLabel}</span>`;
    el.title = this.options.addButtonLabel!;
    
    el.addEventListener('click', () => {
      this.options.onAddClick?.();
      this.container.dispatchEvent(new CustomEvent('stack-add-click', {
        bubbles: true,
        detail: { stackId: this.id }
      }));
    });
    
    return el;
  }
  
  private createSearchInput(): HTMLInputElement {
    const el = document.createElement('input');
    el.type = 'text';
    el.className = 'stack-search-input';
    el.placeholder = this.options.searchPlaceholder!;
    
    el.addEventListener('input', () => {
      this.searchQuery = el.value;
      this.applyFilter();
    });
    
    return el;
  }
  
  private createEmptyState(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'stack-empty-state';
    
    const icon = document.createElement('div');
    icon.className = 'stack-empty-icon';
    icon.innerHTML = this.getIconSVG('inbox');
    el.appendChild(icon);
    
    const text = document.createElement('p');
    text.className = 'stack-empty-text';
    text.textContent = 'No cards in this stack';
    el.appendChild(text);
    
    const hint = document.createElement('p');
    hint.className = 'stack-empty-hint';
    hint.textContent = 'Drag cards here or click Add';
    el.appendChild(hint);
    
    return el;
  }
  
  private createLoadingOverlay(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'stack-loading-overlay';
    
    const spinner = document.createElement('div');
    spinner.className = 'stack-loading-spinner';
    el.appendChild(spinner);
    
    return el;
  }
  
  private assembleDOM(): void {
    // Header with count badge
    this.header.insertBefore(this.countBadge, this.header.querySelector('.stack-header-spacer'));
    this.container.appendChild(this.header);
    
    // Search (if enabled)
    if (this.options.showSearch) {
      this.searchInput = this.createSearchInput();
      const searchContainer = document.createElement('div');
      searchContainer.className = 'stack-search-container';
      searchContainer.appendChild(this.searchInput);
      this.content.appendChild(searchContainer);
    }
    
    // Card container
    this.cardContainer.appendChild(this.emptyState);
    this.content.appendChild(this.cardContainer);
    
    // Add button (if enabled)
    if (this.options.showAddButton) {
      this.addButton = this.createAddButton();
      this.content.appendChild(this.addButton);
    }
    
    // Loading overlay
    this.content.appendChild(this.loadingOverlay);
    
    this.container.appendChild(this.content);
  }
  
  // ===========================================================================
  // EVENT HANDLING
  // ===========================================================================
  
  private setupEventListeners(): void {
    // Header click to toggle collapse
    this.header.addEventListener('click', () => {
      if (this.options.collapsible) {
        this.toggleCollapse();
      }
    });
    
    // Context menu
    this.container.addEventListener('contextmenu', (e) => this.onContextMenu(e));
    
    // Drag handle for stack reordering
    const dragHandle = this.header.querySelector('.stack-drag-handle');
    if (dragHandle) {
      dragHandle.addEventListener('pointerdown', (e) => this.onStackDragStart(e as PointerEvent));
    }
    
    // Card container scroll (for virtual scroll)
    this.cardContainer.addEventListener('scroll', () => this.onScroll());
    
    // Card events (delegated)
    this.cardContainer.addEventListener('card-select', (e) => this.onCardSelect(e as CustomEvent));
    this.cardContainer.addEventListener('card-close', (e) => this.onCardClose(e as CustomEvent));
    
    // Drop zone
    this.cardContainer.addEventListener('dragover', (e) => this.onDragOver(e));
    this.cardContainer.addEventListener('drop', (e) => this.onDrop(e));
    this.cardContainer.addEventListener('dragleave', () => this.onDragLeave());
  }
  
  private onContextMenu(e: MouseEvent): void {
    e.preventDefault();
    this.options.lifecycle?.onContextMenu?.(e);
  }
  
  private onScroll(): void {
    if (this.virtualScroll && this.options.virtualScroll) {
      // Debounce scroll updates
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }
      
      this.scrollTimeout = window.setTimeout(() => {
        this.updateVirtualScroll();
      }, 16);
    }
  }
  
  private onCardSelect(_e: CustomEvent): void {
    // Could be used to track selection within stack
  }
  
  private onCardClose(e: CustomEvent): void {
    const cardId = e.detail.cardId;
    this.removeCardById(cardId);
  }
  
  // ===========================================================================
  // STACK DRAG (REORDERING)
  // ===========================================================================
  
  private onStackDragStart(e: PointerEvent): void {
    if (e.button !== 0 || this._locked) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    this.isDragging = true;
    this._state = 'dragging';
    this.container.dataset.stackState = 'dragging';
    
    this.dragStartY = e.clientY;
    
    const handle = e.target as HTMLElement;
    handle.setPointerCapture(e.pointerId);
    
    handle.addEventListener('pointermove', this.onStackDragMove);
    handle.addEventListener('pointerup', this.onStackDragEnd);
    handle.addEventListener('pointercancel', this.onStackDragEnd);
    
    this.options.lifecycle?.onDragStart?.(e);
  }
  
  private onStackDragMove = (e: PointerEvent): void => {
    if (!this.isDragging) return;
    
    const dy = e.clientY - this.dragStartY;
    this.container.style.transform = `translateY(${dy}px)`;
  };
  
  private onStackDragEnd = (e: PointerEvent): void => {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this._state = 'idle';
    this.container.dataset.stackState = 'idle';
    this.container.style.transform = '';
    
    const handle = e.target as HTMLElement;
    handle.releasePointerCapture(e.pointerId);
    
    handle.removeEventListener('pointermove', this.onStackDragMove);
    handle.removeEventListener('pointerup', this.onStackDragEnd);
    handle.removeEventListener('pointercancel', this.onStackDragEnd);
    
    this.options.lifecycle?.onDragEnd?.(e);
  };
  
  // ===========================================================================
  // DROP ZONE
  // ===========================================================================
  
  private onDragOver(e: DragEvent): void {
    if (this._locked) return;
    
    e.preventDefault();
    this.cardContainer.classList.add('stack-drop-active');
  }
  
  private onDrop(e: DragEvent): void {
    if (this._locked) return;
    
    e.preventDefault();
    this.cardContainer.classList.remove('stack-drop-active');
    
    // Handle dropped card data
    const data = e.dataTransfer?.getData('application/cardplay-card');
    if (data) {
      const cardData = JSON.parse(data);
      this.container.dispatchEvent(new CustomEvent('stack-card-drop', {
        bubbles: true,
        detail: { stackId: this.id, cardData }
      }));
    }
  }
  
  private onDragLeave(): void {
    this.cardContainer.classList.remove('stack-drop-active');
  }
  
  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================
  
  private setupAccessibility(): void {
    this.container.setAttribute('role', 'region');
    this.container.setAttribute('aria-label', this.options.ariaLabel ?? `${this.name} stack`);
    
    this.cardContainer.setAttribute('role', 'listbox');
    this.cardContainer.setAttribute('aria-label', `Cards in ${this.name}`);
    this.cardContainer.setAttribute('aria-multiselectable', 'true');
  }
  
  // ===========================================================================
  // CARD MANAGEMENT
  // ===========================================================================
  
  /**
   * Add a card to the stack
   */
  addCard(card: CardComponent, index?: number): boolean {
    if (this._locked) return false;
    
    // Check capacity
    if (this.options.maxCards && this.cards.length >= this.options.maxCards) {
      return false;
    }
    
    // Check type acceptance
    if (this.options.acceptsTypes && !this.options.acceptsTypes.includes(card.type)) {
      return false;
    }
    
    // Insert at index or end
    const insertIndex = index ?? this.cards.length;
    this.cards.splice(insertIndex, 0, card);
    
    // Add to DOM
    const cardEl = card.getElement();
    this.cardElements.set(card.id, cardEl);
    
    if (insertIndex >= this.cardContainer.children.length - 1) {
      // Insert before empty state
      this.cardContainer.insertBefore(cardEl, this.emptyState);
    } else {
      const beforeEl = this.cardContainer.children[insertIndex];
      this.cardContainer.insertBefore(cardEl, beforeEl ?? null);
    }
    
    // Animate entrance
    card.animate('enter');
    
    // Update state
    this.applyFilter();
    this.updateCountBadge();
    this.updateEmptyState();
    this.checkVirtualScrollNeeded();
    
    // Lifecycle
    this.options.lifecycle?.onCardAdd?.(card, insertIndex);
    
    // Emit event
    this.container.dispatchEvent(new CustomEvent('stack-card-add', {
      bubbles: true,
      detail: { stackId: this.id, cardId: card.id, index: insertIndex }
    }));
    
    return true;
  }
  
  /**
   * Remove a card from the stack
   */
  removeCard(card: CardComponent): boolean {
    return this.removeCardById(card.id);
  }
  
  /**
   * Remove a card by ID
   */
  removeCardById(cardId: string): boolean {
    if (this._locked) return false;
    
    const index = this.cards.findIndex(c => c.id === cardId);
    if (index === -1) return false;
    
    const card = this.cards[index];
    if (!card) return false;
    this.cards.splice(index, 1);
    
    // Remove from DOM
    const cardEl = this.cardElements.get(cardId);
    if (cardEl) {
      cardEl.remove();
      this.cardElements.delete(cardId);
    }
    
    // Update state
    this.applyFilter();
    this.updateCountBadge();
    this.updateEmptyState();
    this.checkVirtualScrollNeeded();
    
    // Lifecycle
    this.options.lifecycle?.onCardRemove?.(card, index);
    
    // Emit event
    this.container.dispatchEvent(new CustomEvent('stack-card-remove', {
      bubbles: true,
      detail: { stackId: this.id, cardId, index }
    }));
    
    return true;
  }
  
  /**
   * Move a card within the stack
   */
  moveCard(fromIndex: number, toIndex: number): boolean {
    if (this._locked) return false;
    if (fromIndex < 0 || fromIndex >= this.cards.length) return false;
    if (toIndex < 0 || toIndex >= this.cards.length) return false;
    if (fromIndex === toIndex) return false;
    
    const card = this.cards[fromIndex];
    if (!card) return false;
    this.cards.splice(fromIndex, 1);
    this.cards.splice(toIndex, 0, card);
    
    // Update DOM order
    const cardEl = this.cardElements.get(card.id);
    if (cardEl) {
      const targetEl = this.cardContainer.children[toIndex];
      if (targetEl) {
        this.cardContainer.insertBefore(cardEl, targetEl);
      } else {
        this.cardContainer.insertBefore(cardEl, this.emptyState);
      }
    }
    
    // Lifecycle
    this.options.lifecycle?.onCardMove?.(card, fromIndex, toIndex);
    
    // Emit event
    this.container.dispatchEvent(new CustomEvent('stack-card-move', {
      bubbles: true,
      detail: { stackId: this.id, cardId: card.id, fromIndex, toIndex }
    }));
    
    return true;
  }
  
  /**
   * Get card at index
   */
  getCardAt(index: number): CardComponent | null {
    return this.cards[index] ?? null;
  }
  
  /**
   * Get card by ID
   */
  getCardById(cardId: string): CardComponent | null {
    return this.cards.find(c => c.id === cardId) ?? null;
  }
  
  /**
   * Get all cards
   */
  getCards(): CardComponent[] {
    return [...this.cards];
  }
  
  /**
   * Get filtered cards
   */
  getFilteredCards(): CardComponent[] {
    return [...this.filteredCards];
  }
  
  /**
   * Get card count
   */
  getCardCount(): number {
    return this.cards.length;
  }
  
  /**
   * Get filtered card count
   */
  getFilteredCardCount(): number {
    return this.filteredCards.length;
  }
  
  /**
   * Check if stack is full
   */
  isFull(): boolean {
    return this.options.maxCards !== undefined && this.cards.length >= this.options.maxCards;
  }
  
  /**
   * Check if stack is empty
   */
  isEmpty(): boolean {
    return this.cards.length === 0;
  }
  
  /**
   * Clear all cards
   */
  clearCards(): void {
    if (this._locked) return;
    
    const cardsCopy = [...this.cards];
    
    for (const card of cardsCopy) {
      this.removeCard(card);
    }
  }
  
  // ===========================================================================
  // FILTER & SEARCH
  // ===========================================================================
  
  /**
   * Set filter function
   */
  setFilter(filter: CardFilter | null): void {
    this.currentFilter = filter;
    this.applyFilter();
  }
  
  /**
   * Set sort function
   */
  setSort(sort: CardSort | null): void {
    this.currentSort = sort;
    this.applyFilter();
  }
  
  /**
   * Set search query
   */
  setSearchQuery(query: string): void {
    this.searchQuery = query;
    if (this.searchInput) {
      this.searchInput.value = query;
    }
    this.applyFilter();
  }
  
  /**
   * Apply current filter and search
   */
  private applyFilter(): void {
    // Start with all cards
    let result = [...this.cards];
    
    // Apply search
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(card => {
        const title = (card as any).options?.title?.toLowerCase() ?? '';
        const type = card.type.toLowerCase();
        return title.includes(query) || type.includes(query);
      });
    }
    
    // Apply custom filter
    if (this.currentFilter) {
      result = result.filter(this.currentFilter);
    }
    
    // Apply sort
    if (this.currentSort) {
      result.sort(this.currentSort);
    }
    
    this.filteredCards = result;
    
    // Update visibility
    for (const card of this.cards) {
      const el = this.cardElements.get(card.id);
      if (el) {
        const visible = this.filteredCards.includes(card);
        el.style.display = visible ? '' : 'none';
      }
    }
    
    this.updateEmptyState();
  }
  
  // ===========================================================================
  // COLLAPSE
  // ===========================================================================
  
  /**
   * Toggle collapsed state
   */
  toggleCollapse(): void {
    if (!this.options.collapsible) return;
    
    this._collapsed = !this._collapsed;
    this.updateCollapsedState();
    
    if (this._collapsed) {
      this.options.lifecycle?.onCollapse?.();
    } else {
      this.options.lifecycle?.onExpand?.();
    }
  }
  
  /**
   * Set collapsed state
   */
  setCollapsed(collapsed: boolean): void {
    if (!this.options.collapsible) return;
    
    this._collapsed = collapsed;
    this.updateCollapsedState();
    
    if (this._collapsed) {
      this.options.lifecycle?.onCollapse?.();
    } else {
      this.options.lifecycle?.onExpand?.();
    }
  }
  
  private updateCollapsedState(): void {
    this.container.classList.toggle('stack-collapsed', this._collapsed);
    this.container.dataset.stackState = this._collapsed ? 'collapsed' : this._state;
    
    const collapseBtn = this.header.querySelector('.stack-collapse-btn');
    if (collapseBtn) {
      collapseBtn.innerHTML = this.getIconSVG(this._collapsed ? 'chevron-right' : 'chevron-down');
      collapseBtn.setAttribute('title', this._collapsed ? 'Expand' : 'Collapse');
    }
    
    // Hide content when collapsed
    this.content.style.display = this._collapsed ? 'none' : '';
  }
  
  // ===========================================================================
  // LOCK
  // ===========================================================================
  
  /**
   * Toggle locked state
   */
  toggleLock(): void {
    if (!this.options.lockable) return;
    
    this._locked = !this._locked;
    this.updateLockState();
  }
  
  /**
   * Set locked state
   */
  setLocked(locked: boolean): void {
    if (!this.options.lockable) return;
    
    this._locked = locked;
    this.updateLockState();
  }
  
  private updateLockState(): void {
    this.container.classList.toggle('stack-locked', this._locked);
    
    if (this._locked) {
      this._state = 'locked';
    } else if (this._collapsed) {
      this._state = 'collapsed';
    } else {
      this._state = 'idle';
    }
    
    this.container.dataset.stackState = this._state;
    
    if (this.lockIndicator) {
      this.lockIndicator.innerHTML = this.getIconSVG(this._locked ? 'lock' : 'unlock');
      this.lockIndicator.setAttribute('title', this._locked ? 'Unlock' : 'Lock');
    }
    
    // Disable add button when locked
    if (this.addButton) {
      (this.addButton as HTMLButtonElement).disabled = this._locked;
    }
  }
  
  // ===========================================================================
  // LOADING
  // ===========================================================================
  
  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    this._loading = loading;
    this.container.classList.toggle('stack-loading', loading);
    this.loadingOverlay.style.display = loading ? 'flex' : 'none';
    
    if (loading) {
      this._state = 'loading';
    } else if (this._locked) {
      this._state = 'locked';
    } else if (this._collapsed) {
      this._state = 'collapsed';
    } else {
      this._state = 'idle';
    }
    
    this.container.dataset.stackState = this._state;
  }
  
  // ===========================================================================
  // VIRTUAL SCROLL
  // ===========================================================================
  
  private checkVirtualScrollNeeded(): void {
    const threshold = this.options.virtualScrollThreshold ?? 30;
    
    if (this.options.virtualScroll && this.cards.length > threshold) {
      this.enableVirtualScroll();
    } else if (this.virtualScroll) {
      this.disableVirtualScroll();
    }
  }
  
  private enableVirtualScroll(): void {
    if (this.virtualScroll) return;
    
    // Estimate item height
    const itemHeight = this.options.orientation === 'vertical' ? 100 : 80;
    
    this.virtualScroll = {
      scrollTop: 0,
      viewportHeight: this.cardContainer.clientHeight,
      itemHeight,
      overscan: 3,
      startIndex: 0,
      endIndex: 0,
      totalHeight: this.cards.length * itemHeight
    };
    
    this.updateVirtualScroll();
  }
  
  private disableVirtualScroll(): void {
    this.virtualScroll = null;
    
    // Show all cards
    for (const el of this.cardElements.values()) {
      el.style.display = '';
      el.style.position = '';
      el.style.top = '';
    }
    
    this.cardContainer.style.height = '';
  }
  
  private updateVirtualScroll(): void {
    if (!this.virtualScroll) return;
    
    const { itemHeight, overscan, totalHeight } = this.virtualScroll;
    
    this.virtualScroll.scrollTop = this.cardContainer.scrollTop;
    this.virtualScroll.viewportHeight = this.cardContainer.clientHeight;
    
    const startIndex = Math.max(0, Math.floor(this.virtualScroll.scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      this.cards.length - 1,
      Math.ceil((this.virtualScroll.scrollTop + this.virtualScroll.viewportHeight) / itemHeight) + overscan
    );
    
    this.virtualScroll.startIndex = startIndex;
    this.virtualScroll.endIndex = endIndex;
    
    // Set container height for scroll
    this.cardContainer.style.height = `${totalHeight}px`;
    
    // Position visible cards
    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      if (!card) continue;
      const el = this.cardElements.get(card.id);
      
      if (el) {
        const visible = i >= startIndex && i <= endIndex;
        el.style.display = visible ? '' : 'none';
        
        if (visible) {
          el.style.position = 'absolute';
          el.style.top = `${i * itemHeight}px`;
        }
      }
    }
  }
  
  // ===========================================================================
  // CPU USAGE
  // ===========================================================================
  
  /**
   * Get current CPU usage
   */
  getCpuUsage(): number {
    return this.cpuUsage;
  }
  
  /**
   * Update CPU usage indicator
   */
  setCpuUsage(percent: number): void {
    this.cpuUsage = percent;
    
    if (!this.cpuIndicator) {
      this.cpuIndicator = document.createElement('span');
      this.cpuIndicator.className = 'stack-cpu-indicator';
      const spacer = this.header.querySelector('.stack-header-spacer');
      spacer?.parentNode?.insertBefore(this.cpuIndicator, spacer);
    }
    
    this.cpuIndicator.textContent = `${percent.toFixed(1)}%`;
    this.cpuIndicator.classList.toggle('stack-cpu-high', percent > 50);
    this.cpuIndicator.classList.toggle('stack-cpu-critical', percent > 80);
  }
  
  // ===========================================================================
  // UI UPDATES
  // ===========================================================================
  
  private updateCountBadge(): void {
    const count = this.cards.length;
    this.countBadge.textContent = String(count);
    this.countBadge.title = `${count} card${count !== 1 ? 's' : ''}`;
    
    // Show max indicator if near capacity
    if (this.options.maxCards) {
      const remaining = this.options.maxCards - count;
      if (remaining <= 3) {
        this.countBadge.textContent = `${count}/${this.options.maxCards}`;
        this.countBadge.classList.toggle('stack-count-full', remaining === 0);
      }
    }
  }
  
  private updateEmptyState(): void {
    const showEmpty = this.filteredCards.length === 0;
    this.emptyState.style.display = showEmpty ? 'flex' : 'none';
    
    // Update empty state message based on filter
    const text = this.emptyState.querySelector('.stack-empty-text');
    const hint = this.emptyState.querySelector('.stack-empty-hint');
    
    if (text && hint) {
      if (this.cards.length === 0) {
        text.textContent = 'No cards in this stack';
        hint.textContent = 'Drag cards here or click Add';
      } else {
        text.textContent = 'No matching cards';
        hint.textContent = 'Try a different search or filter';
      }
    }
  }
  
  // ===========================================================================
  // NAMING
  // ===========================================================================
  
  /**
   * Set stack name
   */
  setName(name: string): void {
    (this as any).name = name;
    const nameEl = this.header.querySelector('.stack-name');
    if (nameEl) {
      nameEl.textContent = name;
    }
  }
  
  /**
   * Enable inline name editing
   */
  editName(): void {
    const nameEl = this.header.querySelector('.stack-name') as HTMLElement;
    if (!nameEl) return;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'stack-name-input';
    input.value = this.name;
    
    input.addEventListener('blur', () => {
      this.setName(input.value || this.name);
      nameEl.style.display = '';
      input.remove();
    });
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        input.blur();
      } else if (e.key === 'Escape') {
        input.value = this.name;
        input.blur();
      }
    });
    
    nameEl.style.display = 'none';
    nameEl.parentNode?.insertBefore(input, nameEl);
    input.focus();
    input.select();
  }
  
  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================
  
  /**
   * Dispose stack
   */
  dispose(): void {
    this.options.lifecycle?.onUnmount?.();
    
    // Dispose all cards
    for (const card of this.cards) {
      card.dispose();
    }
    
    this.cards = [];
    this.filteredCards = [];
    this.cardElements.clear();
    
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    
    this.container.remove();
  }
  
  // ===========================================================================
  // DOM ACCESS
  // ===========================================================================
  
  getElement(): HTMLElement {
    return this.container;
  }
  
  getHeaderElement(): HTMLElement {
    return this.header;
  }
  
  getContentElement(): HTMLElement {
    return this.content;
  }
  
  getCardContainerElement(): HTMLElement {
    return this.cardContainer;
  }
  
  // ===========================================================================
  // EXPORT
  // ===========================================================================
  
  /**
   * Export stack data
   */
  export(): {
    id: string;
    name: string;
    type: string;
    collapsed: boolean;
    locked: boolean;
    cardIds: string[];
  } {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      collapsed: this._collapsed,
      locked: this._locked,
      cardIds: this.cards.map(c => c.id)
    };
  }
  
  // ===========================================================================
  // HELPERS
  // ===========================================================================
  
  private getIconSVG(name: string): string {
    const icons: Record<string, string> = {
      'grip': '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/><circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="12" r="1.5"/></svg>',
      'chevron-down': '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M4.5 6l3.5 3.5L11.5 6" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>',
      'chevron-right': '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M6 4.5l3.5 3.5L6 11.5" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>',
      'lock': '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="7" width="10" height="7" rx="1" stroke="currentColor" fill="none"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" fill="none"/></svg>',
      'unlock': '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="7" width="10" height="7" rx="1" stroke="currentColor" fill="none"/><path d="M5 7V5a3 3 0 015.5-1.5" stroke="currentColor" fill="none"/></svg>',
      'plus': '<svg width="16" height="16" viewBox="0 0 16 16"><line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" stroke-width="1.5"/><line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" stroke-width="1.5"/></svg>',
      'inbox': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22,12 16,12 14,15 10,15 8,12 2,12"/><path d="M5.45,5.11L2,12v6a2,2,0,0,0,2,2H20a2,2,0,0,0,2-2V12l-3.45-6.89A2,2,0,0,0,16.76,4H7.24A2,2,0,0,0,5.45,5.11Z"/></svg>',
    };
    
    return icons[name] ?? `<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" stroke="currentColor" fill="none"/></svg>`;
  }
  
  // ===========================================================================
  // GETTERS
  // ===========================================================================
  
  get state(): StackState { return this._state; }
  get collapsed(): boolean { return this._collapsed; }
  get locked(): boolean { return this._locked; }
  get loading(): boolean { return this._loading; }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createStack(options: StackOptions): StackComponent {
  return new StackComponent(options);
}

// ============================================================================
// CSS
// ============================================================================

export const STACK_COMPONENT_CSS = `
.stack-component {
  display: flex;
  flex-direction: column;
  background: var(--surface-1, #12121a);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  overflow: hidden;
}

.stack-component.stack-horizontal .stack-cards {
  flex-direction: row;
}

.stack-component.stack-collapsed {
  /* Header only visible when collapsed */
}

.stack-component.stack-locked {
  opacity: 0.8;
}

.stack-component.stack-loading {
  pointer-events: none;
}

/* Header */
.stack-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  user-select: none;
}

.stack-header:hover {
  background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%);
}

.stack-drag-handle {
  cursor: grab;
  color: var(--text-muted, #64748b);
  padding: 2px;
  border-radius: 4px;
}

.stack-drag-handle:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary, #94a3b8);
}

.stack-drag-handle:active {
  cursor: grabbing;
}

.stack-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: var(--stack-color, #6366f1);
}

.stack-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #f8fafc);
}

.stack-name-input {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #f8fafc);
  background: var(--surface-2, #1a1a2e);
  border: 1px solid var(--stack-color, #6366f1);
  border-radius: 4px;
  padding: 2px 6px;
  outline: none;
}

.stack-count-badge {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted, #64748b);
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 8px;
  border-radius: 10px;
}

.stack-count-badge.stack-count-full {
  background: rgba(239, 68, 68, 0.2);
  color: var(--accent-error, #ef4444);
}

.stack-cpu-indicator {
  font-size: 10px;
  font-family: var(--font-mono, monospace);
  color: var(--text-muted, #64748b);
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.03);
}

.stack-cpu-indicator.stack-cpu-high {
  color: var(--accent-warning, #f59e0b);
  background: rgba(245, 158, 11, 0.1);
}

.stack-cpu-indicator.stack-cpu-critical {
  color: var(--accent-error, #ef4444);
  background: rgba(239, 68, 68, 0.1);
}

.stack-header-spacer {
  flex: 1;
}

.stack-header-actions {
  display: flex;
  gap: 4px;
}

.stack-action-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text-muted, #64748b);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.1s ease, color 0.1s ease;
}

.stack-action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary, #f8fafc);
}

/* Content */
.stack-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  position: relative;
}

/* Search */
.stack-search-container {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.stack-search-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text-primary, #f8fafc);
  background: var(--surface-2, #1a1a2e);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  outline: none;
  transition: border-color 0.15s ease;
}

.stack-search-input:focus {
  border-color: var(--stack-color, #6366f1);
}

.stack-search-input::placeholder {
  color: var(--text-muted, #64748b);
}

/* Cards container */
.stack-cards {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  overflow: auto;
  position: relative;
}

.stack-cards-scroll {
  overflow-y: auto;
  overflow-x: hidden;
}

.stack-cards-wrap {
  flex-wrap: wrap;
}

.stack-cards.stack-drop-active {
  background: rgba(99, 102, 241, 0.05);
  outline: 2px dashed var(--stack-color, #6366f1);
  outline-offset: -4px;
}

/* Add button */
.stack-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 0 12px 12px;
  padding: 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary, #94a3b8);
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.stack-add-btn:hover {
  color: var(--text-primary, #f8fafc);
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--stack-color, #6366f1);
}

.stack-add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Empty state */
.stack-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 16px;
  text-align: center;
}

.stack-empty-icon {
  color: var(--text-muted, #64748b);
  opacity: 0.5;
}

.stack-empty-text {
  font-size: 14px;
  color: var(--text-secondary, #94a3b8);
  margin: 0;
}

.stack-empty-hint {
  font-size: 12px;
  color: var(--text-muted, #64748b);
  margin: 0;
}

/* Loading overlay */
.stack-loading-overlay {
  position: absolute;
  inset: 0;
  display: none;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.stack-loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--stack-color, #6366f1);
  border-radius: 50%;
  animation: stackSpin 0.8s linear infinite;
}

@keyframes stackSpin {
  to { transform: rotate(360deg); }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .stack-header,
  .stack-action-btn,
  .stack-search-input,
  .stack-add-btn {
    transition: none;
  }
  
  .stack-loading-spinner {
    animation: none;
  }
}
`;
