/**
 * @fileoverview Board State Migrations Tests
 * 
 * B122: Tests for older board state schemas migrating to current version.
 */

import { describe, it, expect, beforeEach } from 'vitest';
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

global.localStorage = localStorageMock as Storage;

// Mock window if it doesn't exist
if (typeof window === 'undefined') {
  (global as any).window = { localStorage: localStorageMock };
}

describe('BoardState Migrations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('V1 schema (current)', () => {
    it('should load V1 schema without migration', () => {
      const v1State: BoardState = {
        version: 1,
        currentBoardId: 'test-board',
        recentBoardIds: ['test-board'],
        favoriteBoardIds: [],
        perBoardLayout: {},
        perBoardDeckState: {},
        firstRunCompleted: true,
        lastOpenedAt: Date.now(),
      };

      localStorage.setItem('cardplay.boardState.v1', JSON.stringify(v1State));

      const store = new BoardStateStore();
      const state = store.getState();

      expect(state.version).toBe(1);
      expect(state.currentBoardId).toBe('test-board');
    });
  });

  describe('Missing fields migration', () => {
    it('should add missing recentBoardIds array', () => {
      const incompleteState = {
        version: 1,
        currentBoardId: 'test-board',
        favoriteBoardIds: [],
        perBoardLayout: {},
        perBoardDeckState: {},
        firstRunCompleted: true,
        lastOpenedAt: Date.now(),
      };

      localStorage.setItem('cardplay.boardState.v1', JSON.stringify(incompleteState));

      const store = new BoardStateStore();
      const state = store.getState();

      expect(state.recentBoardIds).toEqual([]);
    });

    it('should add missing favoriteBoardIds array', () => {
      const incompleteState = {
        version: 1,
        currentBoardId: 'test-board',
        recentBoardIds: ['test-board'],
        perBoardLayout: {},
        perBoardDeckState: {},
        firstRunCompleted: true,
        lastOpenedAt: Date.now(),
      };

      localStorage.setItem('cardplay.boardState.v1', JSON.stringify(incompleteState));

      const store = new BoardStateStore();
      const state = store.getState();

      expect(state.favoriteBoardIds).toEqual([]);
    });

    it('should add missing perBoardLayout map', () => {
      const incompleteState = {
        version: 1,
        currentBoardId: 'test-board',
        recentBoardIds: [],
        favoriteBoardIds: [],
        perBoardDeckState: {},
        firstRunCompleted: true,
        lastOpenedAt: Date.now(),
      };

      localStorage.setItem('cardplay.boardState.v1', JSON.stringify(incompleteState));

      const store = new BoardStateStore();
      const state = store.getState();

      expect(state.perBoardLayout).toEqual({});
    });

    it('should add missing firstRunCompleted flag', () => {
      const incompleteState = {
        version: 1,
        currentBoardId: 'test-board',
        recentBoardIds: [],
        favoriteBoardIds: [],
        perBoardLayout: {},
        perBoardDeckState: {},
        lastOpenedAt: Date.now(),
      };

      localStorage.setItem('cardplay.boardState.v1', JSON.stringify(incompleteState));

      const store = new BoardStateStore();
      const state = store.getState();

      expect(state.firstRunCompleted).toBe(false);
    });

    it('should handle completely empty state', () => {
      localStorage.setItem('cardplay.boardState.v1', '{}');

      const store = new BoardStateStore();
      const state = store.getState();

      expect(state.version).toBe(1);
      expect(state.currentBoardId).toBeNull();
      expect(state.recentBoardIds).toEqual([]);
      expect(state.favoriteBoardIds).toEqual([]);
      expect(state.firstRunCompleted).toBe(false);
    });
  });

  describe('Corrupt data handling', () => {
    it('should fallback to default on invalid JSON', () => {
      localStorage.setItem('cardplay.boardState.v1', 'not valid json {{{');

      const store = new BoardStateStore();
      const state = store.getState();

      expect(state.version).toBe(1);
      expect(state.currentBoardId).toBeNull();
    });

    it('should fallback to default on null value', () => {
      localStorage.setItem('cardplay.boardState.v1', 'null');

      const store = new BoardStateStore();
      const state = store.getState();

      expect(state.version).toBe(1);
      expect(state.currentBoardId).toBeNull();
    });

    it('should handle invalid array values', () => {
      const invalidState = {
        version: 1,
        currentBoardId: 'test-board',
        recentBoardIds: 'not-an-array',
        favoriteBoardIds: null,
        perBoardLayout: {},
        perBoardDeckState: {},
        firstRunCompleted: true,
        lastOpenedAt: Date.now(),
      };

      localStorage.setItem('cardplay.boardState.v1', JSON.stringify(invalidState));

      const store = new BoardStateStore();
      const state = store.getState();

      expect(Array.isArray(state.recentBoardIds)).toBe(true);
      expect(Array.isArray(state.favoriteBoardIds)).toBe(true);
    });

    it('should handle invalid object values', () => {
      const invalidState = {
        version: 1,
        currentBoardId: 'test-board',
        recentBoardIds: [],
        favoriteBoardIds: [],
        perBoardLayout: 'not-an-object',
        perBoardDeckState: null,
        firstRunCompleted: true,
        lastOpenedAt: Date.now(),
      };

      localStorage.setItem('cardplay.boardState.v1', JSON.stringify(invalidState));

      const store = new BoardStateStore();
      const state = store.getState();

      expect(typeof state.perBoardLayout).toBe('object');
      expect(typeof state.perBoardDeckState).toBe('object');
    });
  });

  describe('Version upgrade paths', () => {
    it('should preserve data when version matches', () => {
      const currentState: BoardState = {
        version: 1,
        currentBoardId: 'my-board',
        recentBoardIds: ['board-1', 'board-2'],
        favoriteBoardIds: ['fav-1'],
        perBoardLayout: { 'my-board': { panelSizes: {}, collapsedPanels: [], panelTabOrder: {}, panelActiveTab: {} } },
        perBoardDeckState: { 'my-board': { activeCards: {}, scrollPositions: {}, focusedItems: {}, filterState: {}, deckSettings: {} } },
        perBoardTrackControlLevels: {},
        firstRunCompleted: true,
        lastOpenedAt: 123456,
      };

      localStorage.setItem('cardplay.boardState.v1', JSON.stringify(currentState));

      const store = new BoardStateStore();
      const state = store.getState();

      expect(state).toEqual(currentState);
    });
  });
});
