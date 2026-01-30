/**
 * @fileoverview Virtual List Component for Performance
 * 
 * Implements efficient virtualization for large lists (tracker rows, piano roll notes, etc.)
 * Only renders visible items plus a small buffer, dramatically improving performance
 * for lists with thousands of items.
 * 
 * Implements P050 from roadmap: Virtualization for large lists
 * 
 * @module @cardplay/ui/components/virtual-list
 */

// ============================================================================
// TYPES
// ============================================================================

export interface VirtualListConfig<T> {
  readonly items: readonly T[];
  readonly itemHeight: number;
  readonly overscan?: number; // Number of items to render above/below viewport (default: 3)
  readonly renderItem: (item: T, index: number) => HTMLElement;
  readonly onScroll?: (scrollTop: number, visibleRange: [number, number]) => void;
  readonly className?: string;
}

interface VisibleRange {
  readonly start: number;
  readonly end: number;
}

// ============================================================================
// VIRTUAL LIST COMPONENT
// ============================================================================

/**
 * Virtual list component that only renders visible items.
 * 
 * Usage:
 * ```typescript
 * const list = new VirtualList(container, {
 *   items: myLargeArray,
 *   itemHeight: 32,
 *   overscan: 5,
 *   renderItem: (item, index) => {
 *     const el = document.createElement('div');
 *     el.textContent = item.name;
 *     return el;
 *   }
 * });
 * ```
 */
export class VirtualList<T> {
  private container: HTMLElement;
  private config: VirtualListConfig<T>;
  private scrollContainer: HTMLElement;
  private contentContainer: HTMLElement;
  private spacerTop: HTMLElement;
  private spacerBottom: HTMLElement;
  private renderedItems = new Map<number, HTMLElement>();
  private currentRange: VisibleRange = { start: 0, end: 0 };
  private scrollListener: (() => void) | null = null;

  constructor(container: HTMLElement, config: VirtualListConfig<T>) {
    this.container = container;
    this.config = config;

    this.scrollContainer = this.createScrollContainer();
    this.spacerTop = this.createSpacer();
    this.contentContainer = this.createContentContainer();
    this.spacerBottom = this.createSpacer();

    this.scrollContainer.appendChild(this.spacerTop);
    this.scrollContainer.appendChild(this.contentContainer);
    this.scrollContainer.appendChild(this.spacerBottom);
    this.container.appendChild(this.scrollContainer);

    this.scrollListener = this.handleScroll.bind(this);
    this.scrollContainer.addEventListener('scroll', this.scrollListener);

    this.render();
  }

  destroy(): void {
    if (this.scrollListener) {
      this.scrollContainer.removeEventListener('scroll', this.scrollListener);
      this.scrollListener = null;
    }
    this.renderedItems.clear();
    this.container.innerHTML = '';
  }

  /**
   * Updates the items and re-renders visible portion.
   */
  updateItems(items: readonly T[]): void {
    this.config = { ...this.config, items };
    this.renderedItems.clear();
    // Force clear content container for clean re-render
    this.contentContainer.innerHTML = '';
    this.currentRange = { start: 0, end: 0 };
    this.render();
  }

  /**
   * Updates a single item without full re-render.
   */
  updateItem(index: number, item: T): void {
    const element = this.renderedItems.get(index);
    if (element) {
      const newElement = this.config.renderItem(item, index);
      element.replaceWith(newElement);
      this.renderedItems.set(index, newElement);
    }
  }

  /**
   * Scrolls to a specific item index.
   */
  scrollToIndex(index: number, behavior: ScrollBehavior = 'smooth'): void {
    const scrollTop = index * this.config.itemHeight;
    // Use scrollTop directly for jsdom compatibility
    if (typeof this.scrollContainer.scrollTo === 'function') {
      this.scrollContainer.scrollTo({ top: scrollTop, behavior });
    } else {
      this.scrollContainer.scrollTop = scrollTop;
    }
  }

  /**
   * Gets the currently visible range of items.
   */
  getVisibleRange(): VisibleRange {
    return this.currentRange;
  }

  private createScrollContainer(): HTMLElement {
    const el = document.createElement('div');
    el.className = `virtual-list-scroll ${this.config.className || ''}`;
    el.style.cssText = `
      position: relative;
      overflow-y: auto;
      overflow-x: hidden;
      height: 100%;
      width: 100%;
    `;
    return el;
  }

  private createContentContainer(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'virtual-list-content';
    el.style.cssText = `
      position: relative;
    `;
    return el;
  }

  private createSpacer(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'virtual-list-spacer';
    el.style.cssText = `
      width: 1px;
      pointer-events: none;
    `;
    return el;
  }

  private handleScroll(): void {
    this.render();
    
    if (this.config.onScroll) {
      this.config.onScroll(
        this.scrollContainer.scrollTop,
        [this.currentRange.start, this.currentRange.end]
      );
    }
  }

  private render(): void {
    const range = this.calculateVisibleRange();
    
    // Only re-render if range changed
    if (range.start === this.currentRange.start && range.end === this.currentRange.end) {
      return;
    }
    
    this.currentRange = range;

    // Update spacer heights
    const topHeight = range.start * this.config.itemHeight;
    const bottomHeight = (this.config.items.length - range.end) * this.config.itemHeight;
    this.spacerTop.style.height = `${topHeight}px`;
    this.spacerBottom.style.height = `${bottomHeight}px`;

    // Remove items outside visible range
    const keysToRemove: number[] = [];
    for (const [index] of this.renderedItems) {
      if (index < range.start || index >= range.end) {
        keysToRemove.push(index);
      }
    }
    keysToRemove.forEach(index => {
      const element = this.renderedItems.get(index);
      if (element && element.parentElement) {
        element.remove();
      }
      this.renderedItems.delete(index);
    });

    // Add new visible items
    const fragment = document.createDocumentFragment();
    const newElements: Array<[number, HTMLElement]> = [];
    
    for (let i = range.start; i < range.end; i++) {
      if (!this.renderedItems.has(i)) {
        const item = this.config.items[i];
        if (item !== undefined) {
          const element = this.config.renderItem(item, i);
          element.dataset.virtualIndex = String(i);
          newElements.push([i, element]);
          fragment.appendChild(element);
        }
      }
    }

    if (fragment.hasChildNodes()) {
      this.contentContainer.appendChild(fragment);
      newElements.forEach(([index, element]) => {
        this.renderedItems.set(index, element);
      });
    }
  }

  private calculateVisibleRange(): VisibleRange {
    const scrollTop = this.scrollContainer.scrollTop;
    const viewportHeight = this.scrollContainer.clientHeight;
    const overscan = this.config.overscan ?? 3;

    const startIndex = Math.floor(scrollTop / this.config.itemHeight);
    const endIndex = Math.ceil((scrollTop + viewportHeight) / this.config.itemHeight);

    const start = Math.max(0, startIndex - overscan);
    const end = Math.min(this.config.items.length, endIndex + overscan);

    return { start, end };
  }
}

// ============================================================================
// VIRTUAL GRID (2D VIRTUALIZATION)
// ============================================================================

export interface VirtualGridConfig<T> {
  readonly items: readonly T[];
  readonly rowHeight: number;
  readonly columnWidth: number;
  readonly columns: number;
  readonly overscan?: number;
  readonly renderItem: (item: T, row: number, col: number) => HTMLElement;
  readonly onScroll?: (scrollTop: number, visibleRowRange: [number, number]) => void;
  readonly className?: string;
}

/**
 * Virtual grid component for 2D data (e.g., piano roll, session grid).
 * Virtualizes both rows and columns for maximum performance.
 */
export class VirtualGrid<T> {
  private container: HTMLElement;
  private config: VirtualGridConfig<T>;
  private scrollContainer: HTMLElement;
  private contentContainer: HTMLElement;
  private spacerTop: HTMLElement;
  private spacerBottom: HTMLElement;
  private renderedCells = new Map<string, HTMLElement>();
  private currentRowRange: VisibleRange = { start: 0, end: 0 };
  private scrollListener: (() => void) | null = null;

  constructor(container: HTMLElement, config: VirtualGridConfig<T>) {
    this.container = container;
    this.config = config;

    this.scrollContainer = this.createScrollContainer();
    this.spacerTop = this.createSpacer();
    this.contentContainer = this.createContentContainer();
    this.spacerBottom = this.createSpacer();

    this.scrollContainer.appendChild(this.spacerTop);
    this.scrollContainer.appendChild(this.contentContainer);
    this.scrollContainer.appendChild(this.spacerBottom);
    this.container.appendChild(this.scrollContainer);

    this.scrollListener = this.handleScroll.bind(this);
    this.scrollContainer.addEventListener('scroll', this.scrollListener);

    this.render();
  }

  destroy(): void {
    if (this.scrollListener) {
      this.scrollContainer.removeEventListener('scroll', this.scrollListener);
      this.scrollListener = null;
    }
    this.renderedCells.clear();
    this.container.innerHTML = '';
  }

  updateItems(items: readonly T[]): void {
    this.config = { ...this.config, items };
    this.renderedCells.clear();
    this.render();
  }

  scrollToRow(row: number, behavior: ScrollBehavior = 'smooth'): void {
    const scrollTop = row * this.config.rowHeight;
    // Use scrollTop directly for jsdom compatibility
    if (typeof this.scrollContainer.scrollTo === 'function') {
      this.scrollContainer.scrollTo({ top: scrollTop, behavior });
    } else {
      this.scrollContainer.scrollTop = scrollTop;
    }
  }

  private createScrollContainer(): HTMLElement {
    const el = document.createElement('div');
    el.className = `virtual-grid-scroll ${this.config.className || ''}`;
    el.style.cssText = `
      position: relative;
      overflow-y: auto;
      overflow-x: hidden;
      height: 100%;
      width: 100%;
    `;
    return el;
  }

  private createContentContainer(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'virtual-grid-content';
    el.style.cssText = `
      position: relative;
      display: grid;
      grid-template-columns: repeat(${this.config.columns}, ${this.config.columnWidth}px);
      grid-auto-rows: ${this.config.rowHeight}px;
    `;
    return el;
  }

  private createSpacer(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'virtual-grid-spacer';
    el.style.cssText = `
      width: 1px;
      grid-column: 1 / -1;
      pointer-events: none;
    `;
    return el;
  }

  private handleScroll(): void {
    this.render();
    
    if (this.config.onScroll) {
      this.config.onScroll(
        this.scrollContainer.scrollTop,
        [this.currentRowRange.start, this.currentRowRange.end]
      );
    }
  }

  private render(): void {
    const rowRange = this.calculateVisibleRowRange();
    
    if (rowRange.start === this.currentRowRange.start && rowRange.end === this.currentRowRange.end) {
      return;
    }
    
    this.currentRowRange = rowRange;

    const totalRows = Math.ceil(this.config.items.length / this.config.columns);
    const topHeight = rowRange.start * this.config.rowHeight;
    const bottomHeight = (totalRows - rowRange.end) * this.config.rowHeight;
    this.spacerTop.style.height = `${topHeight}px`;
    this.spacerBottom.style.height = `${bottomHeight}px`;

    // Remove cells outside visible range
    const keysToRemove: string[] = [];
    for (const [key] of this.renderedCells) {
      const parts = key.split(',');
      const row = parseInt(parts[0] || '0');
      if (row < rowRange.start || row >= rowRange.end) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      const element = this.renderedCells.get(key);
      if (element && element.parentElement) {
        element.remove();
      }
      this.renderedCells.delete(key);
    });

    // Add new visible cells
    const fragment = document.createDocumentFragment();
    const newCells: Array<[string, HTMLElement]> = [];
    
    for (let row = rowRange.start; row < rowRange.end; row++) {
      for (let col = 0; col < this.config.columns; col++) {
        const key = `${row},${col}`;
        if (!this.renderedCells.has(key)) {
          const itemIndex = row * this.config.columns + col;
          const item = this.config.items[itemIndex];
          if (item !== undefined) {
            const element = this.config.renderItem(item, row, col);
            element.dataset.virtualRow = String(row);
            element.dataset.virtualCol = String(col);
            newCells.push([key, element]);
            fragment.appendChild(element);
          }
        }
      }
    }

    if (fragment.hasChildNodes()) {
      this.contentContainer.appendChild(fragment);
      newCells.forEach(([key, element]) => {
        this.renderedCells.set(key, element);
      });
    }
  }

  private calculateVisibleRowRange(): VisibleRange {
    const scrollTop = this.scrollContainer.scrollTop;
    const viewportHeight = this.scrollContainer.clientHeight;
    const overscan = this.config.overscan ?? 3;

    const totalRows = Math.ceil(this.config.items.length / this.config.columns);
    const startRow = Math.floor(scrollTop / this.config.rowHeight);
    const endRow = Math.ceil((scrollTop + viewportHeight) / this.config.rowHeight);

    const start = Math.max(0, startRow - overscan);
    const end = Math.min(totalRows, endRow + overscan);

    return { start, end };
  }
}
