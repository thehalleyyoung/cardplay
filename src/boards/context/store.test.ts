/**
 * @fileoverview Board Context Store Tests
 * 
 * B123: Tests for active context persistence.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BoardContextStore } from './store';
import type { ActiveContext } from './types';

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

describe('BoardContextStore', () => {
  let store: BoardContextStore;

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    store = new BoardContextStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize with default context', () => {
      const context = store.getContext();
      
      expect(context.activeStreamId).toBeNull();
      expect(context.activeClipId).toBeNull();
      expect(context.activeTrackId).toBeNull();
      expect(context.activeDeckId).toBeNull();
      expect(context.activeViewType).toBeNull();
    });

    it('should load persisted context from localStorage', () => {
      const persistedContext: ActiveContext = {
        activeStreamId: 'stream-1',
        activeClipId: 'clip-1',
        activeTrackId: 'track-1',
        activeDeckId: 'deck-1',
        activeViewType: 'tracker',
      };

      localStorage.setItem('cardplay.activeContext.v1', JSON.stringify(persistedContext));

      const newStore = new BoardContextStore();
      const context = newStore.getContext();

      expect(context.activeStreamId).toBe('stream-1');
      expect(context.activeClipId).toBe('clip-1');
      expect(context.activeTrackId).toBe('track-1');
      expect(context.activeDeckId).toBe('deck-1');
      expect(context.activeViewType).toBe('tracker');
    });
  });

  describe('stream management', () => {
    it('should set active stream', () => {
      store.setActiveStream('stream-1');

      const context = store.getContext();
      expect(context.activeStreamId).toBe('stream-1');
    });

    it('should persist active stream to localStorage', async () => {
      store.setActiveStream('stream-1');

      // Fast-forward through debounce
      vi.advanceTimersByTime(600);

      const stored = localStorage.getItem('cardplay.activeContext.v1');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.activeStreamId).toBe('stream-1');
    });

    it('should allow clearing active stream', () => {
      store.setActiveStream('stream-1');
      store.setActiveStream(null);

      const context = store.getContext();
      expect(context.activeStreamId).toBeNull();
    });
  });

  describe('clip management', () => {
    it('should set active clip', () => {
      store.setActiveClip('clip-1');

      const context = store.getContext();
      expect(context.activeClipId).toBe('clip-1');
    });

    it('should persist active clip to localStorage', async () => {
      store.setActiveClip('clip-1');

      vi.advanceTimersByTime(600);

      const stored = localStorage.getItem('cardplay.activeContext.v1');
      const parsed = JSON.parse(stored!);
      expect(parsed.activeClipId).toBe('clip-1');
    });

    it('should allow clearing active clip', () => {
      store.setActiveClip('clip-1');
      store.setActiveClip(null);

      const context = store.getContext();
      expect(context.activeClipId).toBeNull();
    });
  });

  describe('track management', () => {
    it('should set active track', () => {
      store.setActiveTrack('track-1');

      const context = store.getContext();
      expect(context.activeTrackId).toBe('track-1');
    });

    it('should persist active track to localStorage', async () => {
      store.setActiveTrack('track-1');

      vi.advanceTimersByTime(600);

      const stored = localStorage.getItem('cardplay.activeContext.v1');
      const parsed = JSON.parse(stored!);
      expect(parsed.activeTrackId).toBe('track-1');
    });
  });

  describe('deck management', () => {
    it('should set active deck', () => {
      store.setActiveDeck('deck-1');

      const context = store.getContext();
      expect(context.activeDeckId).toBe('deck-1');
    });

    it('should persist active deck to localStorage', async () => {
      store.setActiveDeck('deck-1');

      vi.advanceTimersByTime(600);

      const stored = localStorage.getItem('cardplay.activeContext.v1');
      const parsed = JSON.parse(stored!);
      expect(parsed.activeDeckId).toBe('deck-1');
    });
  });

  describe('view type management', () => {
    it('should set active view type', () => {
      store.setActiveViewType('notation');

      const context = store.getContext();
      expect(context.activeViewType).toBe('notation');
    });

    it('should persist active view type to localStorage', async () => {
      store.setActiveViewType('piano-roll');

      vi.advanceTimersByTime(600);

      const stored = localStorage.getItem('cardplay.activeContext.v1');
      const parsed = JSON.parse(stored!);
      expect(parsed.activeViewType).toBe('piano-roll');
    });
  });

  describe('subscription', () => {
    it('should notify listeners on stream change', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.setActiveStream('stream-1');

      expect(listener).toHaveBeenCalled();
      const calledContext = listener.mock.calls[0][0] as ActiveContext;
      expect(calledContext.activeStreamId).toBe('stream-1');
    });

    it('should notify listeners on clip change', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.setActiveClip('clip-1');

      expect(listener).toHaveBeenCalled();
      const calledContext = listener.mock.calls[0][0] as ActiveContext;
      expect(calledContext.activeClipId).toBe('clip-1');
    });

    it('should unsubscribe correctly', () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      unsubscribe();
      store.setActiveStream('stream-1');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should support multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      store.subscribe(listener1);
      store.subscribe(listener2);

      store.setActiveStream('stream-1');

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('debounced persistence', () => {
    it('should debounce multiple rapid updates', () => {
      store.setActiveStream('stream-1');
      store.setActiveStream('stream-2');
      store.setActiveStream('stream-3');

      // Before debounce completes
      vi.advanceTimersByTime(400);
      let stored = localStorage.getItem('cardplay.activeContext.v1');
      expect(stored).toBeNull();

      // After debounce completes
      vi.advanceTimersByTime(200);
      stored = localStorage.getItem('cardplay.activeContext.v1');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.activeStreamId).toBe('stream-3');
    });

    it('should save only once after burst of updates', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      
      // Clear any pending saves from beforeEach
      vi.runAllTimers();
      setItemSpy.mockClear(); // Clear calls from initialization
      
      for (let i = 0; i < 10; i++) {
        store.setActiveStream(`stream-${i}`);
      }

      vi.advanceTimersByTime(600);

      // Should have called setItem only once
      const contextCalls = setItemSpy.mock.calls.filter(
        call => call[0] === 'cardplay.activeContext.v1'
      );
      expect(contextCalls.length).toBe(1);

      setItemSpy.mockRestore();
    });
  });

  describe('cross-board persistence', () => {
    it('should persist context across store instances', () => {
      store.setActiveStream('stream-1');
      store.setActiveClip('clip-1');
      store.setActiveTrack('track-1');

      vi.advanceTimersByTime(600);

      // Simulate app restart by creating new store
      const newStore = new BoardContextStore();
      const context = newStore.getContext();

      expect(context.activeStreamId).toBe('stream-1');
      expect(context.activeClipId).toBe('clip-1');
      expect(context.activeTrackId).toBe('track-1');
    });

    it('should preserve context when board switches', () => {
      // Set context in one board
      store.setActiveStream('stream-1');
      store.setActiveClip('clip-1');

      // Simulate board switch (context should remain)
      const context = store.getContext();
      expect(context.activeStreamId).toBe('stream-1');
      expect(context.activeClipId).toBe('clip-1');
    });
  });

  describe('corrupt data handling', () => {
    it('should fallback to default on invalid JSON', () => {
      localStorage.setItem('cardplay.activeContext.v1', 'not valid json {{{');

      const newStore = new BoardContextStore();
      const context = newStore.getContext();

      expect(context.activeStreamId).toBeNull();
      expect(context.activeClipId).toBeNull();
    });

    it('should fallback to default on null value', () => {
      localStorage.setItem('cardplay.activeContext.v1', 'null');

      const newStore = new BoardContextStore();
      const context = newStore.getContext();

      expect(context.activeStreamId).toBeNull();
    });

    it('should handle missing fields gracefully', () => {
      const incompleteContext = {
        activeStreamId: 'stream-1',
        // Missing other fields
      };

      localStorage.setItem('cardplay.activeContext.v1', JSON.stringify(incompleteContext));

      const newStore = new BoardContextStore();
      const context = newStore.getContext();

      expect(context.activeStreamId).toBe('stream-1');
      expect(context.activeClipId).toBeNull();
      expect(context.activeTrackId).toBeNull();
    });
  });
});
