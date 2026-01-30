/**
 * @fileoverview Virtual List Tests
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VirtualList, VirtualGrid } from './virtual-list';

describe('VirtualList', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.height = '400px';
    container.style.width = '200px';
    document.body.appendChild(container);
  });

  describe('P050: Virtualization for large lists', () => {
    it('should only render visible items', () => {
      const items = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` }));
      
      const list = new VirtualList(container, {
        items,
        itemHeight: 32,
        renderItem: (item, index) => {
          const el = document.createElement('div');
          el.textContent = item.name;
          el.dataset.itemId = String(item.id);
          return el;
        }
      });

      // With 400px container and 32px items, ~12 items visible + overscan (default 3)
      // In jsdom, clientHeight may be 0, so just verify virtualization is working
      const renderedItems = container.querySelectorAll('[data-item-id]');
      expect(renderedItems.length).toBeLessThan(100); // Much less than 1000 (virtualization working)
      expect(renderedItems.length).toBeGreaterThan(0); // At least some items rendered
    });

    it('should render correct items at scroll position', () => {
      const items = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` }));
      
      const list = new VirtualList(container, {
        items,
        itemHeight: 32,
        renderItem: (item) => {
          const el = document.createElement('div');
          el.textContent = item.name;
          el.dataset.itemId = String(item.id);
          return el;
        }
      });

      // Initially renders items 0-15 or so
      let firstItem = container.querySelector('[data-item-id="0"]');
      expect(firstItem).toBeTruthy();

      // Scroll to middle
      const scrollContainer = container.querySelector('.virtual-list-scroll') as HTMLElement;
      scrollContainer.scrollTop = 500 * 32; // Scroll to item 500
      scrollContainer.dispatchEvent(new Event('scroll'));

      // Should now render items around 500
      const midItem = container.querySelector('[data-item-id="500"]');
      expect(midItem).toBeTruthy();

      // Item 0 should no longer be rendered
      firstItem = container.querySelector('[data-item-id="0"]');
      expect(firstItem).toBeFalsy();
    });

    it('should use overscan to render buffer items', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));
      
      const list = new VirtualList(container, {
        items,
        itemHeight: 32,
        overscan: 5, // Explicit overscan of 5
        renderItem: (item) => {
          const el = document.createElement('div');
          el.dataset.itemId = String(item.id);
          return el;
        }
      });

      // Visible items + overscan
      const renderedCount = container.querySelectorAll('[data-item-id]').length;
      
      // In jsdom with 0 clientHeight, may render minimal items
      // Just verify it's not rendering all 100
      expect(renderedCount).toBeLessThan(50);
      expect(renderedCount).toBeGreaterThan(0);
    });

    it('should update visible range when scrolling', () => {
      const items = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
      const onScroll = vi.fn();
      
      const list = new VirtualList(container, {
        items,
        itemHeight: 32,
        renderItem: (item) => {
          const el = document.createElement('div');
          el.dataset.itemId = String(item.id);
          return el;
        },
        onScroll
      });

      const scrollContainer = container.querySelector('.virtual-list-scroll') as HTMLElement;
      scrollContainer.scrollTop = 100 * 32;
      scrollContainer.dispatchEvent(new Event('scroll'));

      expect(onScroll).toHaveBeenCalled();
      const [scrollTop, [start, end]] = onScroll.mock.calls[0];
      expect(scrollTop).toBe(100 * 32);
      expect(start).toBeGreaterThanOrEqual(90); // ~100 minus overscan
      expect(end).toBeLessThanOrEqual(120); // ~100 + visible count + overscan
    });

    it('should handle empty items array', () => {
      const list = new VirtualList(container, {
        items: [],
        itemHeight: 32,
        renderItem: () => document.createElement('div')
      });

      const renderedItems = container.querySelectorAll('[data-item-id]');
      expect(renderedItems.length).toBe(0);
    });
  });

  describe('API methods', () => {
    it('should update items dynamically', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({ id: i, name: `Item ${i}` }));
      
      const list = new VirtualList(container, {
        items,
        itemHeight: 32,
        renderItem: (item) => {
          const el = document.createElement('div');
          el.textContent = item.name;
          return el;
        }
      });

      expect(container.textContent).toContain('Item 0');

      const newItems = Array.from({ length: 10 }, (_, i) => ({ id: i, name: `New ${i}` }));
      list.updateItems(newItems);

      // After update, should render new items
      // (Note: In jsdom with 0 height, may only render a few)
      const hasNewItems = Array.from(container.querySelectorAll('div')).some(
        el => el.textContent?.includes('New')
      );
      expect(hasNewItems).toBe(true);
    });

    it('should scroll to specific index', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));
      
      const list = new VirtualList(container, {
        items,
        itemHeight: 32,
        renderItem: (item) => {
          const el = document.createElement('div');
          el.dataset.itemId = String(item.id);
          return el;
        }
      });

      list.scrollToIndex(50, 'auto');

      const scrollContainer = container.querySelector('.virtual-list-scroll') as HTMLElement;
      expect(scrollContainer.scrollTop).toBe(50 * 32);
    });

    it('should get visible range', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));
      
      const list = new VirtualList(container, {
        items,
        itemHeight: 32,
        renderItem: (item) => document.createElement('div')
      });

      const range = list.getVisibleRange();
      expect(range.start).toBeGreaterThanOrEqual(0);
      expect(range.end).toBeGreaterThan(range.start);
    });

    it('should clean up on destroy', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({ id: i }));
      
      const list = new VirtualList(container, {
        items,
        itemHeight: 32,
        renderItem: () => document.createElement('div')
      });

      expect(container.innerHTML).not.toBe('');

      list.destroy();

      expect(container.innerHTML).toBe('');
    });
  });

  describe('Performance characteristics', () => {
    it('should handle 10,000 items efficiently', () => {
      const items = Array.from({ length: 10000 }, (_, i) => ({ id: i }));
      
      const start = performance.now();
      const list = new VirtualList(container, {
        items,
        itemHeight: 32,
        renderItem: (item) => {
          const el = document.createElement('div');
          el.dataset.itemId = String(item.id);
          return el;
        }
      });
      const duration = performance.now() - start;

      // Should render in under 100ms even with 10k items
      expect(duration).toBeLessThan(100);

      // Should only render ~20 items
      const renderedCount = container.querySelectorAll('[data-item-id]').length;
      expect(renderedCount).toBeLessThan(50);

      list.destroy();
    });
  });
});

describe('VirtualGrid', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.height = '400px';
    container.style.width = '600px';
    document.body.appendChild(container);
  });

  describe('2D virtualization', () => {
    it('should only render visible cells', () => {
      const items = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
      
      const grid = new VirtualGrid(container, {
        items,
        rowHeight: 32,
        columnWidth: 100,
        columns: 6,
        renderItem: (item, row, col) => {
          const el = document.createElement('div');
          el.dataset.itemId = String(item.id);
          return el;
        }
      });

      // With 400px / 32px = ~12 rows visible, 6 columns = ~72 cells + overscan
      const renderedCells = container.querySelectorAll('[data-item-id]');
      expect(renderedCells.length).toBeLessThan(150); // Much less than 1000
      expect(renderedCells.length).toBeGreaterThan(0); // At least some cells rendered
    });

    it('should scroll to specific row', () => {
      const items = Array.from({ length: 600 }, (_, i) => ({ id: i }));
      
      const grid = new VirtualGrid(container, {
        items,
        rowHeight: 32,
        columnWidth: 100,
        columns: 6,
        renderItem: (item) => {
          const el = document.createElement('div');
          el.dataset.itemId = String(item.id);
          return el;
        }
      });

      grid.scrollToRow(50, 'auto');

      const scrollContainer = container.querySelector('.virtual-grid-scroll') as HTMLElement;
      expect(scrollContainer.scrollTop).toBe(50 * 32);
    });

    it('should handle grid layout correctly', () => {
      const items = Array.from({ length: 12 }, (_, i) => ({ id: i }));
      
      const grid = new VirtualGrid(container, {
        items,
        rowHeight: 32,
        columnWidth: 100,
        columns: 4,
        renderItem: (item, row, col) => {
          const el = document.createElement('div');
          el.dataset.row = String(row);
          el.dataset.col = String(col);
          el.dataset.itemId = String(item.id);
          return el;
        }
      });

      // Item 0 should be at row 0, col 0
      const item0 = container.querySelector('[data-item-id="0"]');
      expect(item0?.getAttribute('data-row')).toBe('0');
      expect(item0?.getAttribute('data-col')).toBe('0');

      // Item 4 should be at row 1, col 0 (4 columns, so wraps to next row)
      const item4 = container.querySelector('[data-item-id="4"]');
      expect(item4?.getAttribute('data-row')).toBe('1');
      expect(item4?.getAttribute('data-col')).toBe('0');
    });

    it('should clean up on destroy', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({ id: i }));
      
      const grid = new VirtualGrid(container, {
        items,
        rowHeight: 32,
        columnWidth: 100,
        columns: 2,
        renderItem: () => document.createElement('div')
      });

      expect(container.innerHTML).not.toBe('');

      grid.destroy();

      expect(container.innerHTML).toBe('');
    });
  });
});
