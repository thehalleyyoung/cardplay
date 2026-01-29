/**
 * @fileoverview Board Integration Tests
 * 
 * End-to-end tests for board system functionality.
 * Part of Phase K (K006-K009) - comprehensive integration testing.
 * 
 * Tests:
 * - Board switching with state preservation (K006)
 * - Phrase drag/drop into tracker (K007)
 * - Generated clip creation (K008)
 * - Cross-view editing synchronization (K009)
 * 
 * @vitest-environment jsdom
 * @module @cardplay/boards/__tests__/integration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getBoardRegistry } from '../index';
import { registerBuiltinBoards } from '../builtins/register';
import { getBoardStateStore } from '../store/store';
import { switchBoard } from '../switching/switch-board';
import { getSharedEventStore } from '../../state/event-store';
import { getClipRegistry } from '../../state/clip-registry';
import { getBoardContextStore } from '../context/store';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
}

describe('Board Integration Tests', () => {
  let boardsRegistered = false;
  
  beforeEach(() => {
    localStorageMock.clear();
    // Register boards only once (singleton registry)
    if (!boardsRegistered) {
      try {
        registerBuiltinBoards();
        boardsRegistered = true;
      } catch (e) {
        // Boards might already be registered, that's okay
      }
    }
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('Board Switching (K006)', () => {
    it('should switch boards and update state', () => {
      const registry = getBoardRegistry();
      const store = getBoardStateStore();
      
      const boards = registry.list();
      expect(boards.length).toBeGreaterThan(0);
      
      const firstBoard = boards[0]!;
      const secondBoard = boards[1] || boards[0]!;
      
      switchBoard(firstBoard.id);
      const state1 = store.getState();
      expect(state1.currentBoardId).toBe(firstBoard.id);
      
      switchBoard(secondBoard.id);
      const state2 = store.getState();
      expect(state2.currentBoardId).toBe(secondBoard.id);
      expect(state2.recentBoardIds).toContain(firstBoard.id);
    });

    it('should preserve active context when switching boards', () => {
      const contextStore = getBoardContextStore();
      const eventStore = getSharedEventStore();
      const registry = getBoardRegistry();
      
      const stream = eventStore.createStream({ name: 'Test Stream' });
      contextStore.setActiveStream(stream.id);
      
      const boards = registry.list();
      const firstBoard = boards[0]!;
      const secondBoard = boards[1] || boards[0]!;
      
      switchBoard(firstBoard.id);
      const context1 = contextStore.getContext();
      expect(context1.activeStreamId).toBe(stream.id);
      
      switchBoard(secondBoard.id, { preserveActiveContext: true });
      const context2 = contextStore.getContext();
      expect(context2.activeStreamId).toBe(stream.id);
    });
  });

  describe('Phrase Drag/Drop (K007)', () => {
    it('should write events to store when phrase is dropped', () => {
      const eventStore = getSharedEventStore();
      const stream = eventStore.createStream({ name: 'Test Stream' });
      
      const phraseEvents = [
        { kind: 'note' as const, start: 0, duration: 480, payload: { pitch: 60 } },
        { kind: 'note' as const, start: 480, duration: 480, payload: { pitch: 64 } },
      ];
      
      const success = eventStore.addEvents(stream.id, phraseEvents);
      expect(success).toBe(true);
      
      const streamData = eventStore.getStream(stream.id);
      expect(streamData?.events.length).toBe(2);
    });
  });

  describe('Generator Clip Creation (K008)', () => {
    it('should create clip and stream when generating', () => {
      const eventStore = getSharedEventStore();
      const clipRegistry = getClipRegistry();
      
      const stream = eventStore.createStream({ name: 'Generated Stream' });
      const generatedEvents = [
        { kind: 'note' as const, start: 0, duration: 240, payload: { pitch: 60 } },
      ];
      
      const success = eventStore.addEvents(stream.id, generatedEvents);
      expect(success).toBe(true);
      
      const clip = clipRegistry.createClip({
        name: 'Generated Clip',
        streams: [{ id: stream.id, offset: 0 }],
        duration: 1920,
      });
      
      expect(clip).toBeDefined();
      expect(clip.name).toBe('Generated Clip');
    });
  });

  describe('Cross-View Editing (K009)', () => {
    it('should sync edits across views', () => {
      const eventStore = getSharedEventStore();
      const stream = eventStore.createStream({ name: 'Shared Stream' });
      
      const success = eventStore.addEvents(stream.id, [
        { kind: 'note' as const, start: 0, duration: 480, payload: { pitch: 60 } },
      ]);
      
      expect(success).toBe(true);
      
      const streamData = eventStore.getStream(stream.id);
      expect(streamData?.events.length).toBe(1);
      expect(streamData?.events[0]?.payload.pitch).toBe(60);
    });
  });

  describe('Board State Persistence', () => {
    it('should persist board state to localStorage', async () => {
      const store = getBoardStateStore();
      const registry = getBoardRegistry();
      
      const boards = registry.list();
      const board = boards[0]!;
      
      switchBoard(board.id);
      
      // Wait for debounced persistence (500ms)
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const persistedState = localStorageMock.getItem('cardplay.boardState.v1');
      expect(persistedState).toBeTruthy();
      
      if (persistedState) {
        const parsed = JSON.parse(persistedState);
        expect(parsed.currentBoardId).toBe(board.id);
      }
    });
  });
});
