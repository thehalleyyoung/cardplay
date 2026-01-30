/**
 * @fileoverview Board State Store Tests
 * 
 * B121: Tests for BoardStateStore persistence round-trips.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BoardStateStore } from './store';
import type { BoardState } from './types';

// Mock localStorage and window
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

// @ts-expect-error - mocking global
global.window = { localStorage: localStorageMock };
global.localStorage = localStorageMock as Storage;

describe('BoardStateStore', () => {
  let store: BoardStateStore;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.useFakeTimers();
    store = new BoardStateStore();
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const state = store.getState();
      expect(state.version).toBe(1);
      expect(state.currentBoardId).toBeNull();
      expect(state.recentBoardIds).toEqual([]);
      expect(state.favoriteBoardIds).toEqual([]);
      expect(state.firstRunCompleted).toBe(false);
    });

    it('should load persisted state from localStorage', () => {
      const persistedState: BoardState = {
        version: 1,
        currentBoardId: 'test-board',
        recentBoardIds: ['test-board'],
        favoriteBoardIds: ['fav-board'],
        perBoardLayout: {},
        perBoardDeckState: {},
        firstRunCompleted: true,
        lastOpenedAt: Date.now(),
      };
      localStorage.setItem('cardplay.boardState.v1', JSON.stringify(persistedState));

      const newStore = new BoardStateStore();
      const state = newStore.getState();

      expect(state.currentBoardId).toBe('test-board');
      expect(state.recentBoardIds).toEqual(['test-board']);
      expect(state.favoriteBoardIds).toEqual(['fav-board']);
      expect(state.firstRunCompleted).toBe(true);
    });
  });

  describe('current board management', () => {
    it('should set current board and update recent list', () => {
      store.setCurrentBoard('board-1');
      const state = store.getState();

      expect(state.currentBoardId).toBe('board-1');
      expect(state.recentBoardIds).toContain('board-1');
      expect(state.lastOpenedAt).toBeGreaterThan(0);
    });

    it('should persist current board to localStorage', () => {
      store.setCurrentBoard('board-1');

      vi.advanceTimersByTime(600); // Wait for debounce
      const stored = localStorage.getItem('cardplay.boardState.v1');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.currentBoardId).toBe('board-1');
    });
  });

  describe('recent boards', () => {
    it('should add board to recent list', () => {
      store.addRecentBoard('board-1');
      store.addRecentBoard('board-2');

      const state = store.getState();
      expect(state.recentBoardIds).toEqual(['board-2', 'board-1']);
    });

    it('should limit recent boards to max length', () => {
      for (let i = 0; i < 15; i++) {
        store.addRecentBoard(`board-${i}`);
      }

      const state = store.getState();
      expect(state.recentBoardIds.length).toBeLessThanOrEqual(10);
    });

    it('should move existing board to front of recent list', () => {
      store.addRecentBoard('board-1');
      store.addRecentBoard('board-2');
      store.addRecentBoard('board-1');

      const state = store.getState();
      expect(state.recentBoardIds[0]).toBe('board-1');
      expect(state.recentBoardIds.length).toBe(2);
    });

    it('should persist recent boards', () => {
      store.addRecentBoard('board-1');
      store.addRecentBoard('board-2');

      vi.advanceTimersByTime(600); // Wait for debounce
      const stored = localStorage.getItem('cardplay.boardState.v1');
      const parsed = JSON.parse(stored!);
      expect(parsed.recentBoardIds).toEqual(['board-2', 'board-1']);
    });
  });

  describe('favorite boards', () => {
    it('should toggle favorite on', () => {
      store.toggleFavorite('board-1');

      const state = store.getState();
      expect(state.favoriteBoardIds).toContain('board-1');
    });

    it('should toggle favorite off', () => {
      store.toggleFavorite('board-1');
      store.toggleFavorite('board-1');

      const state = store.getState();
      expect(state.favoriteBoardIds).not.toContain('board-1');
    });

    it('should persist favorites', () => {
      store.toggleFavorite('board-1');

      vi.advanceTimersByTime(600); // Wait for debounce
      const stored = localStorage.getItem('cardplay.boardState.v1');
      const parsed = JSON.parse(stored!);
      expect(parsed.favoriteBoardIds).toContain('board-1');
    });
  });

  describe('first run state', () => {
    it('should mark first run complete', () => {
      store.setFirstRunCompleted();

      const state = store.getState();
      expect(state.firstRunCompleted).toBe(true);
    });

    it('should persist first run completed', () => {
      store.setFirstRunCompleted();

      vi.advanceTimersByTime(600); // Wait for debounce
      const stored = localStorage.getItem('cardplay.boardState.v1');
      const parsed = JSON.parse(stored!);
      expect(parsed.firstRunCompleted).toBe(true);
    });
  });

  describe('layout state', () => {
    it('should get default layout state for unknown board', () => {
      const layout = store.getLayoutState('unknown-board');
      expect(layout).toBeDefined();
      expect(layout.panelSizes).toBeDefined();
    });

    it('should set and get layout state', () => {
      const layoutState = {
        panelSizes: { left: 300, right: 400 },
        collapsedPanels: ['left'],
        activeTabIds: { center: 'tab-1' },
      };

      store.setLayoutState('board-1', layoutState);
      const retrieved = store.getLayoutState('board-1');

      expect(retrieved.panelSizes).toEqual(layoutState.panelSizes);
      expect(retrieved.collapsedPanels).toEqual(layoutState.collapsedPanels);
    });

    it('should persist layout state', () => {
      const layoutState = {
        panelSizes: { left: 300 },
        collapsedPanels: [],
        activeTabIds: {},
      };

      store.setLayoutState('board-1', layoutState);

      vi.advanceTimersByTime(600); // Wait for debounce
      const stored = localStorage.getItem('cardplay.boardState.v1');
      const parsed = JSON.parse(stored!);
      expect(parsed.perBoardLayout['board-1']).toEqual(layoutState);
    });

    it('should reset layout state', () => {
      store.setLayoutState('board-1', {
        panelSizes: { left: 300 },
        collapsedPanels: [],
        activeTabIds: {},
      });

      store.resetLayoutState('board-1');
      const layout = store.getLayoutState('board-1');

      // Should return default
      expect(layout.panelSizes).toEqual({});
    });
  });

  describe('deck state', () => {
    it('should get default deck state for unknown board', () => {
      const deckState = store.getDeckState('unknown-board');
      expect(deckState).toBeDefined();
      expect(deckState.activeCards).toBeDefined();
    });

    it('should set and get deck state', () => {
      const deckState = {
        activeCards: { 'deck-1': 'tab-1' },
        scrollPositions: { 'deck-2': { x: 0, y: 100 } },
        focusedItems: {},
        filterState: {},
      };

      store.setDeckState('board-1', deckState);
      const retrieved = store.getDeckState('board-1');

      expect(retrieved.activeCards).toEqual(deckState.activeCards);
      expect(retrieved.scrollPositions).toEqual(deckState.scrollPositions);
    });

    it('should persist deck state', () => {
      const deckState = {
        activeCards: { 'deck-1': 'tab-1' },
        scrollPositions: {},
        focusedItems: {},
        filterState: {},
      };

      store.setDeckState('board-1', deckState);
      vi.advanceTimersByTime(600); // Wait for debounce

      vi.advanceTimersByTime(600); // Wait for debounce
      const stored = localStorage.getItem('cardplay.boardState.v1');
      const parsed = JSON.parse(stored!);
      expect(parsed.perBoardDeckState['board-1']).toEqual(deckState);
    });

    it('should reset deck state', () => {
      store.setDeckState('board-1', {
        activeCards: { 'deck-1': 'card-1' },
        scrollPositions: {},
        focusedItems: {},
        filterState: {},
      });

      store.resetDeckState('board-1');
      const deckState = store.getDeckState('board-1');

      // Should return default
      expect(deckState.activeCards).toEqual({});
    });
  });

  describe('subscription', () => {
    it('should notify listeners on state changes', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.setCurrentBoard('board-1');

      expect(listener).toHaveBeenCalled();
      const calledState = listener.mock.calls[0][0] as BoardState;
      expect(calledState.currentBoardId).toBe('board-1');
    });

    it('should unsubscribe correctly', () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      unsubscribe();
      store.setCurrentBoard('board-1');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should support multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      store.subscribe(listener1);
      store.subscribe(listener2);

      store.setCurrentBoard('board-1');

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('persistence round-trip', () => {
    it('should persist and restore complete state', () => {
      // Set up complex state
      store.setCurrentBoard('board-1');
      store.addRecentBoard('board-2');
      store.toggleFavorite('board-3');
      store.setFirstRunCompleted();
      store.setLayoutState('board-1', {
        panelSizes: { left: 300 },
        collapsedPanels: ['right'],
        activeTabIds: {},
      });
      store.setDeckState('board-1', {
        activeCards: { 'deck-1': 'tab-1' },
        scrollPositions: {},
        focusedItems: {},
        filterState: {},
      });
      
      vi.advanceTimersByTime(600); // Wait for debounce

      // Create new store instance (simulates page reload)
      const newStore = new BoardStateStore();
      const state = newStore.getState();

      // Verify all state was restored
      expect(state.currentBoardId).toBe('board-1');
      expect(state.recentBoardIds).toContain('board-1');
      expect(state.recentBoardIds).toContain('board-2');
      expect(state.favoriteBoardIds).toContain('board-3');
      expect(state.firstRunCompleted).toBe(true);
      expect(state.perBoardLayout['board-1']).toBeDefined();
      expect(state.perBoardDeckState['board-1']).toBeDefined();
    });
  });
});
