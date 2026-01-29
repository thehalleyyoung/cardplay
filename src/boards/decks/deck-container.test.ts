/**
 * @fileoverview Tests for Deck Container Component
 *
 * E077: Unit tests for deck-container state persistence and tab switching.
 *
 * @module @cardplay/boards/decks/deck-container.test
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeckContainer } from './deck-container';
import type { BoardDeck } from '../types';
import type { DeckInstance } from './factory-types';
import type { DeckRuntimeState } from './runtime-types';

describe('DeckContainer', () => {
  let mockDeck: BoardDeck;
  let mockInstance: DeckInstance;
  let mockState: DeckRuntimeState;
  let container: DeckContainer;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '<div id="test-root"></div>';

    // Mock deck definition
    mockDeck = {
      id: 'test-deck',
      type: 'pattern-editor',
      cardLayout: 'tabs',
      allowReordering: true,
      allowDragOut: true,
    };

    // Mock deck instance
    const mockElement = document.createElement('div');
    mockElement.textContent = 'Mock Deck Content';

    mockInstance = {
      id: 'test-deck',
      type: 'pattern-editor',
      title: 'Test Deck',
      element: mockElement,
      destroy: vi.fn(),
    };

    // Mock runtime state
    mockState = {
      activeTab: 0,
      activeSplit: 'left',
      scrollPosition: { x: 0, y: 0 },
      focusedItem: null,
      activeCards: [],
      filterState: { search: '', tags: [] },
    };
  });

  describe('Initialization', () => {
    it('should create a deck container element', () => {
      container = new DeckContainer({
        deck: mockDeck,
        instance: mockInstance,
        state: mockState,
      });

      const element = container.getElement();
      expect(element.classList.contains('deck-container')).toBe(true);
      expect(element.getAttribute('data-deck-id')).toBe('test-deck');
      expect(element.getAttribute('data-deck-type')).toBe('pattern-editor');
    });

    it('should render deck header with title', () => {
      container = new DeckContainer({
        deck: mockDeck,
        instance: mockInstance,
        state: mockState,
      });

      const element = container.getElement();
      const title = element.querySelector('.deck-title');
      expect(title?.textContent).toBe('Test Deck');
    });

    it('should render deck content in body', () => {
      container = new DeckContainer({
        deck: mockDeck,
        instance: mockInstance,
        state: mockState,
      });

      const element = container.getElement();
      const body = element.querySelector('.deck-body');
      expect(body?.textContent).toContain('Mock Deck Content');
    });
  });

  describe('Tab Switching', () => {
    beforeEach(() => {
      mockState.activeCards = ['card-1', 'card-2', 'card-3'];
    });

    it('should render tabs when cardLayout is tabs', () => {
      container = new DeckContainer({
        deck: { ...mockDeck, cardLayout: 'tabs' },
        instance: mockInstance,
        state: mockState,
      });

      const element = container.getElement();
      const tabs = element.querySelectorAll('.deck-tab');
      expect(tabs.length).toBe(3);
    });

    it('should highlight active tab based on state', () => {
      mockState.activeTab = 1;
      container = new DeckContainer({
        deck: { ...mockDeck, cardLayout: 'tabs' },
        instance: mockInstance,
        state: mockState,
      });

      const element = container.getElement();
      const tabs = element.querySelectorAll('.deck-tab');
      expect(tabs[1]?.classList.contains('deck-tab--active')).toBe(true);
      expect(tabs[0]?.classList.contains('deck-tab--active')).toBe(false);
    });

    it('should call onStateChange when tab is clicked', () => {
      const onStateChange = vi.fn();
      container = new DeckContainer({
        deck: { ...mockDeck, cardLayout: 'tabs' },
        instance: mockInstance,
        state: mockState,
        onStateChange,
      });

      const element = container.getElement();
      const tabs = element.querySelectorAll('.deck-tab');
      (tabs[2] as HTMLElement).click();

      expect(onStateChange).toHaveBeenCalledWith({
        activeTab: 2,
      });
    });

    it('should persist active tab to runtime state', () => {
      const onStateChange = vi.fn();
      container = new DeckContainer({
        deck: { ...mockDeck, cardLayout: 'tabs' },
        instance: mockInstance,
        state: mockState,
        onStateChange,
      });

      // Switch tab
      container.setActiveTab(2);

      expect(onStateChange).toHaveBeenCalledWith({
        activeTab: 2,
      });
    });
  });

  describe('State Persistence', () => {
    it('should persist scroll position', () => {
      const onStateChange = vi.fn();
      container = new DeckContainer({
        deck: mockDeck,
        instance: mockInstance,
        state: mockState,
        onStateChange,
      });

      const newScrollPosition = { x: 100, y: 200 };
      container.setScrollPosition(newScrollPosition);

      expect(onStateChange).toHaveBeenCalledWith({
        scrollPosition: newScrollPosition,
      });
    });

    it('should persist focused item', () => {
      const onStateChange = vi.fn();
      container = new DeckContainer({
        deck: mockDeck,
        instance: mockInstance,
        state: mockState,
        onStateChange,
      });

      container.setFocusedItem('item-123');

      expect(onStateChange).toHaveBeenCalledWith({
        focusedItem: 'item-123',
      });
    });

    it('should persist filter state', () => {
      const onStateChange = vi.fn();
      container = new DeckContainer({
        deck: mockDeck,
        instance: mockInstance,
        state: mockState,
        onStateChange,
      });

      const newFilterState = {
        search: 'melody',
        tags: ['instrument', 'lead'],
      };
      container.setFilterState(newFilterState);

      expect(onStateChange).toHaveBeenCalledWith({
        filterState: newFilterState,
      });
    });

    it('should restore state from persisted runtime state', () => {
      const persistedState: DeckRuntimeState = {
        activeTab: 2,
        activeSplit: 'right',
        scrollPosition: { x: 50, y: 100 },
        focusedItem: 'item-456',
        activeCards: ['card-1', 'card-2', 'card-3'],
        filterState: { search: 'bass', tags: ['low'] },
      };

      container = new DeckContainer({
        deck: { ...mockDeck, cardLayout: 'tabs' },
        instance: mockInstance,
        state: persistedState,
      });

      const element = container.getElement();
      const tabs = element.querySelectorAll('.deck-tab');
      expect(tabs[2]?.classList.contains('deck-tab--active')).toBe(true);
    });
  });

  describe('Layout Modes', () => {
    it('should render stack layout', () => {
      container = new DeckContainer({
        deck: { ...mockDeck, cardLayout: 'stack' },
        instance: mockInstance,
        state: mockState,
      });

      const element = container.getElement();
      expect(element.classList.contains('deck-container--stack')).toBe(true);
    });

    it('should render split layout', () => {
      container = new DeckContainer({
        deck: { ...mockDeck, cardLayout: 'split' },
        instance: mockInstance,
        state: mockState,
      });

      const element = container.getElement();
      expect(element.classList.contains('deck-container--split')).toBe(true);
    });

    it('should render floating layout', () => {
      container = new DeckContainer({
        deck: { ...mockDeck, cardLayout: 'floating' },
        instance: mockInstance,
        state: mockState,
      });

      const element = container.getElement();
      expect(element.classList.contains('deck-container--floating')).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should call deck instance destroy on cleanup', () => {
      container = new DeckContainer({
        deck: mockDeck,
        instance: mockInstance,
        state: mockState,
      });

      container.destroy();

      expect(mockInstance.destroy).toHaveBeenCalled();
    });

    it('should remove element from DOM on destroy', () => {
      const root = document.getElementById('test-root')!;
      container = new DeckContainer({
        deck: mockDeck,
        instance: mockInstance,
        state: mockState,
      });

      root.appendChild(container.getElement());
      expect(root.children.length).toBe(1);

      container.destroy();
      expect(root.children.length).toBe(0);
    });
  });

  describe('Close Action', () => {
    it('should call onClose callback when close button is clicked', () => {
      const onClose = vi.fn();
      container = new DeckContainer({
        deck: mockDeck,
        instance: mockInstance,
        state: mockState,
        onClose,
      });

      const element = container.getElement();
      const closeBtn = element.querySelector('.deck-close') as HTMLElement;
      closeBtn?.click();

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Context Menu', () => {
    it('should show context menu on right click', () => {
      container = new DeckContainer({
        deck: mockDeck,
        instance: mockInstance,
        state: mockState,
      });

      const element = container.getElement();
      const header = element.querySelector('.deck-header') as HTMLElement;

      const contextMenuEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        button: 2,
      });
      header.dispatchEvent(contextMenuEvent);

      // Context menu should appear (implementation-dependent)
      // This is a basic test - real implementation may vary
      expect(contextMenuEvent.defaultPrevented).toBe(true);
    });
  });
});
