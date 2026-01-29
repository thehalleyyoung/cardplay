/**
 * @fileoverview Tests for Board Switch Integration
 * 
 * @module @cardplay/boards/integration/board-switch-integration.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initBoardSwitchIntegration,
  onBoardSwitch,
  getCurrentVisibleDecks,
  getCurrentAllowedCards,
  isCardCurrentlyAllowed,
  isDeckCurrentlyVisible,
  recomputeCurrentBoardGating,
} from './board-switch-integration';
import { getBoardRegistry } from '../registry';
import { getBoardStateStore } from '../store/store';
import { registerBuiltinBoards } from '../builtins/register';
import { registerBuiltinDeckFactories } from '../decks/factories';

describe('Board Switch Integration (D066-D068)', () => {
  let cleanup: (() => void) | null = null;

  beforeEach(() => {
    // Clear stores
    localStorage.clear();
    
    // Register factories and boards
    registerBuiltinDeckFactories();
    registerBuiltinBoards();
    
    // Initialize integration
    cleanup = initBoardSwitchIntegration();
  });

  afterEach(() => {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
    localStorage.clear();
  });

  describe('D066: Visible Decks Recomputation', () => {
    it('should compute visible decks for current board', () => {
      const store = getBoardStateStore();
      const registry = getBoardRegistry();
      
      // Switch to basic tracker board (manual)
      const trackerBoard = registry.get('basic-tracker');
      expect(trackerBoard).toBeDefined();
      
      store.setCurrentBoard('basic-tracker');
      
      // Get visible decks
      const visibleDecks = getCurrentVisibleDecks();
      
      // Manual boards should have core decks but not phrase/generator decks
      expect(visibleDecks.length).toBeGreaterThan(0);
      expect(visibleDecks).toContain('pattern-deck');
      expect(visibleDecks).not.toContain('phrases-deck'); // Hidden on manual boards
    });

    it('should update visible decks when board switches', () => {
      const store = getBoardStateStore();
      const registry = getBoardRegistry();
      
      // Start with manual board
      store.setCurrentBoard('basic-tracker');
      const manualDecks = getCurrentVisibleDecks();
      
      // Switch to assisted board
      const phraseBoard = registry.get('tracker-phrases');
      if (phraseBoard) {
        store.setCurrentBoard('tracker-phrases');
        const assistedDecks = getCurrentVisibleDecks();
        
        // Assisted board should have phrase deck
        expect(assistedDecks).toContain('phrases-deck');
        expect(manualDecks).not.toContain('phrases-deck');
      }
    });

    it('should cache visible decks for performance', () => {
      const store = getBoardStateStore();
      
      store.setCurrentBoard('basic-tracker');
      
      // First call computes
      const decks1 = getCurrentVisibleDecks();
      
      // Second call should return same array (cached)
      const decks2 = getCurrentVisibleDecks();
      
      expect(decks1).toBe(decks2); // Same reference = cached
    });
  });

  describe('D067: Allowed Cards Recomputation', () => {
    it('should compute allowed cards for current board', () => {
      const store = getBoardStateStore();
      
      store.setCurrentBoard('basic-tracker');
      
      const allowedCards = getCurrentAllowedCards();
      
      // Manual boards should allow manual cards
      expect(Array.isArray(allowedCards)).toBe(true);
    });

    it('should update allowed cards when board switches', () => {
      const store = getBoardStateStore();
      
      // Manual board has fewer allowed cards
      store.setCurrentBoard('basic-tracker');
      const manualCards = getCurrentAllowedCards();
      
      // Generative board may have more
      store.setCurrentBoard('ai-arranger');
      const generativeCards = getCurrentAllowedCards();
      
      // Arrays should be different (different gating rules)
      expect(manualCards).not.toEqual(generativeCards);
    });

    it('should provide card-specific check method', () => {
      const store = getBoardStateStore();
      
      store.setCurrentBoard('basic-tracker');
      
      // isCardCurrentlyAllowed uses cached results
      const allowed = isCardCurrentlyAllowed('some-card-id');
      expect(typeof allowed).toBe('boolean');
    });
  });

  describe('D068: Cache Invalidation', () => {
    it('should clear cache when board switches', () => {
      const store = getBoardStateStore();
      
      // Set initial board
      store.setCurrentBoard('basic-tracker');
      const decks1 = getCurrentVisibleDecks();
      
      // Switch to different board
      store.setCurrentBoard('notation-board-manual');
      const decks2 = getCurrentVisibleDecks();
      
      // Should be different references (cache was cleared)
      expect(decks1).not.toBe(decks2);
    });

    it('should recompute on force refresh', () => {
      const store = getBoardStateStore();
      
      store.setCurrentBoard('basic-tracker');
      const decks1 = getCurrentVisibleDecks();
      
      // Force recomputation (D069)
      recomputeCurrentBoardGating();
      const decks2 = getCurrentVisibleDecks();
      
      // Should be different reference (recomputed)
      expect(decks1).not.toBe(decks2);
      // But same content
      expect(decks1).toEqual(decks2);
    });
  });

  describe('Board Switch Listeners', () => {
    it('should notify listeners on board switch', async () => {
      const store = getBoardStateStore();
      const registry = getBoardRegistry();
      
      const listener = vi.fn();
      const unsubscribe = onBoardSwitch(listener);
      
      // Switch boards
      store.setCurrentBoard('basic-tracker');
      
      // Wait for async notification
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(listener).toHaveBeenCalled();
      const [newBoard, previousBoard] = listener.mock.calls[0];
      expect(newBoard?.id).toBe('basic-tracker');
      
      unsubscribe();
    });

    it('should allow unsubscribe', async () => {
      const store = getBoardStateStore();
      
      const listener = vi.fn();
      const unsubscribe = onBoardSwitch(listener);
      
      // Unsubscribe immediately
      unsubscribe();
      
      // Switch boards
      store.setCurrentBoard('basic-tracker');
      
      // Wait
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Listener should not have been called
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('isDeckCurrentlyVisible', () => {
    it('should check deck visibility using cached results', () => {
      const store = getBoardStateStore();
      
      store.setCurrentBoard('basic-tracker');
      
      // Core decks should be visible
      expect(isDeckCurrentlyVisible('pattern-deck')).toBe(true);
      
      // Phrase deck should not be visible on manual board
      expect(isDeckCurrentlyVisible('phrases-deck')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle no active board gracefully', () => {
      // Don't set any board
      
      const decks = getCurrentVisibleDecks();
      const cards = getCurrentAllowedCards();
      
      expect(decks).toEqual([]);
      expect(cards).toEqual([]);
    });

    it('should handle board switch to same board', async () => {
      const store = getBoardStateStore();
      
      const listener = vi.fn();
      onBoardSwitch(listener);
      
      store.setCurrentBoard('basic-tracker');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const callCount1 = listener.mock.calls.length;
      
      // Switch to same board (no-op)
      store.setCurrentBoard('basic-tracker');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const callCount2 = listener.mock.calls.length;
      
      // Should not notify again for same board
      expect(callCount2).toBe(callCount1);
    });
  });
});
