/**
 * @fileoverview Manual Board Gating Smoke Tests (D045-D048)
 * 
 * Tests verifying that board gating correctly restricts deck visibility:
 * - D045: Manual board exposes no phrase/generator/AI decks
 * - D046: Assisted board exposes phrase library but not AI composer
 * - D047: Directed board exposes generator + arranger decks
 * - D048: Generative board exposes all decks (subject to board definition)
 * 
 * @module @cardplay/boards/builtins/manual-board-gating-smoke.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getBoardRegistry } from '../registry';
import { registerBuiltinBoards } from '../builtins/register';
import { computeVisibleDeckTypes } from '../gating/tool-visibility';

describe('Manual Board Gating Smoke Tests', () => {
  beforeEach(() => {
    registerBuiltinBoards();
  });

  describe('D045: Manual board exposes no phrase/generator/AI decks', () => {
    it('basic-tracker should hide generative decks', () => {
      const registry = getBoardRegistry();
      const board = registry.get('basic-tracker');
      expect(board).toBeDefined();
      
      const visibleDecks = computeVisibleDeckTypes(board!);
      
      // Should NOT include generative deck types
      expect(visibleDecks).not.toContain('phrases-deck');
      expect(visibleDecks).not.toContain('generators-deck');
      expect(visibleDecks).not.toContain('arranger-deck');
      expect(visibleDecks).not.toContain('ai-advisor-deck');
      
      // SHOULD include manual deck types
      expect(visibleDecks).toContain('pattern-deck');
      expect(visibleDecks).toContain('instruments-deck');
    });

    it('notation-board-manual should hide generative decks', () => {
      const registry = getBoardRegistry();
      const board = registry.get('notation-board-manual');
      expect(board).toBeDefined();
      
      const visibleDecks = computeVisibleDeckTypes(board!);
      
      // Should NOT include any AI/generator decks
      expect(visibleDecks).not.toContain('phrases-deck');
      expect(visibleDecks).not.toContain('generators-deck');
      expect(visibleDecks).not.toContain('arranger-deck');
      expect(visibleDecks).not.toContain('ai-advisor-deck');
      
      // SHOULD include manual editing decks
      expect(visibleDecks).toContain('notation-deck');
      expect(visibleDecks).toContain('instruments-deck');
    });

    it('basic-sampler should hide generative decks', () => {
      const registry = getBoardRegistry();
      const board = registry.get('basic-sampler');
      expect(board).toBeDefined();
      
      const visibleDecks = computeVisibleDeckTypes(board!);
      
      // Should NOT include generative tools
      expect(visibleDecks).not.toContain('phrases-deck');
      expect(visibleDecks).not.toContain('generators-deck');
      expect(visibleDecks).not.toContain('arranger-deck');
      expect(visibleDecks).not.toContain('ai-advisor-deck');
      
      // SHOULD include sampler-specific decks
      expect(visibleDecks).toContain('samples-deck');
      expect(visibleDecks).toContain('arrangement-deck');
    });

    it('basic-session should hide generative decks', () => {
      const registry = getBoardRegistry();
      const board = registry.get('basic-session');
      expect(board).toBeDefined();
      
      const visibleDecks = computeVisibleDeckTypes(board!);
      
      // Should NOT include generative tools
      expect(visibleDecks).not.toContain('phrases-deck');
      expect(visibleDecks).not.toContain('generators-deck');
      expect(visibleDecks).not.toContain('arranger-deck');
      expect(visibleDecks).not.toContain('ai-advisor-deck');
      
      // SHOULD include manual session decks
      expect(visibleDecks).toContain('session-deck');
      expect(visibleDecks).toContain('mixer-deck');
    });
  });

  describe('D046: Assisted board exposes phrase library but not AI composer', () => {
    it('tracker-phrases should show phrase library but hide AI', () => {
      const registry = getBoardRegistry();
      const board = registry.get('tracker-phrases');
      expect(board).toBeDefined();
      
      const visibleDecks = computeVisibleDeckTypes(board!);
      
      // SHOULD include phrase library (assisted tool)
      expect(visibleDecks).toContain('phrases-deck');
      
      // Should NOT include AI composer or full generators
      expect(visibleDecks).not.toContain('ai-advisor-deck');
      // Assisted boards typically hide autonomous generators
      expect(visibleDecks).not.toContain('arranger-deck');
    });

    it('tracker-harmony should show harmony display but hide generators', () => {
      const registry = getBoardRegistry();
      const board = registry.get('tracker-harmony');
      expect(board).toBeDefined();
      
      const visibleDecks = computeVisibleDeckTypes(board!);
      
      // SHOULD include harmony display (hints)
      expect(visibleDecks).toContain('harmony-deck');
      
      // Should NOT include phrase library (not enabled)
      expect(visibleDecks).not.toContain('phrases-deck');
      
      // Should NOT include AI composer or generators
      expect(visibleDecks).not.toContain('ai-advisor-deck');
      expect(visibleDecks).not.toContain('generators-deck');
    });

    it('session-generators should show generators but not AI composer', () => {
      const registry = getBoardRegistry();
      const board = registry.get('session-generators');
      expect(board).toBeDefined();
      
      const visibleDecks = computeVisibleDeckTypes(board!);
      
      // SHOULD include on-demand generators
      expect(visibleDecks).toContain('generators-deck');
      
      // Should NOT include AI composer (higher autonomy)
      expect(visibleDecks).not.toContain('ai-advisor-deck');
    });

    it('notation-harmony should show harmony but not full AI', () => {
      const registry = getBoardRegistry();
      const board = registry.get('notation-harmony');
      expect(board).toBeDefined();
      
      const visibleDecks = computeVisibleDeckTypes(board!);
      
      // SHOULD include harmony tools
      expect(visibleDecks).toContain('harmony-deck');
      
      // Should NOT include AI composer
      expect(visibleDecks).not.toContain('ai-advisor-deck');
      
      // Should NOT include autonomous generators
      expect(visibleDecks).not.toContain('generators-deck');
    });
  });

  describe('D047: Directed board exposes generator + arranger decks', () => {
    it('ai-arranger should show arranger and generators', () => {
      const registry = getBoardRegistry();
      const board = registry.get('ai-arranger');
      expect(board).toBeDefined();
      
      const visibleDecks = computeVisibleDeckTypes(board!);
      
      // SHOULD include arranger (directed tool)
      expect(visibleDecks).toContain('arranger-deck');
      
      // SHOULD include generators (on-demand for directed)
      expect(visibleDecks).toContain('generators-deck');
      
      // Should also include clip-session for launching arranged parts
      expect(visibleDecks).toContain('session-deck');
    });

    it('ai-composition should show AI composer and notation', () => {
      const registry = getBoardRegistry();
      const board = registry.get('ai-composition');
      expect(board).toBeDefined();
      
      const visibleDecks = computeVisibleDeckTypes(board!);
      
      // SHOULD include AI composer (command palette)
      expect(visibleDecks).toContain('ai-advisor-deck');
      
      // SHOULD include notation for editing drafts
      expect(visibleDecks).toContain('notation-deck');
      
      // SHOULD include generators for iterative drafts
      expect(visibleDecks).toContain('generators-deck');
    });
  });

  describe('D048: Generative board exposes all decks', () => {
    it('generative-ambient should show continuous generators', () => {
      const registry = getBoardRegistry();
      const board = registry.get('generative-ambient');
      expect(board).toBeDefined();
      
      const visibleDecks = computeVisibleDeckTypes(board!);
      
      // SHOULD include generator (continuous mode)
      expect(visibleDecks).toContain('generators-deck');
      
      // SHOULD include timeline for capturing moments
      expect(visibleDecks).toContain('arrangement-deck');
      
      // SHOULD include mixer for balancing layers
      expect(visibleDecks).toContain('mixer-deck');
      
      // May optionally include properties for constraints
      expect(visibleDecks).toContain('properties-deck');
    });
  });

  describe('Board Control Level Verification', () => {
    it('all manual boards should have full-manual control level', () => {
      const registry = getBoardRegistry();
      
      const manualBoardIds = [
        'basic-tracker',
        'notation-board-manual',
        'basic-sampler',
        'basic-session',
      ];
      
      for (const boardId of manualBoardIds) {
        const board = registry.get(boardId);
        expect(board, `Board ${boardId} should exist`).toBeDefined();
        expect(board!.controlLevel, `Board ${boardId} should be full-manual`).toBe('full-manual');
      }
    });

    it('all assisted boards should have manual-with-hints or assisted control level', () => {
      const registry = getBoardRegistry();
      
      const assistedBoardIds = [
        'tracker-harmony',
        'tracker-phrases',
        'session-generators',
        'notation-harmony',
      ];
      
      for (const boardId of assistedBoardIds) {
        const board = registry.get(boardId);
        expect(board, `Board ${boardId} should exist`).toBeDefined();
        const level = board!.controlLevel;
        expect(
          level === 'manual-with-hints' || level === 'assisted',
          `Board ${boardId} should be assisted (got ${level})`
        ).toBe(true);
      }
    });

    it('all directed boards should have directed control level', () => {
      const registry = getBoardRegistry();
      
      const directedBoardIds = [
        'ai-arranger',
        'ai-composition',
      ];
      
      for (const boardId of directedBoardIds) {
        const board = registry.get(boardId);
        expect(board, `Board ${boardId} should exist`).toBeDefined();
        expect(board!.controlLevel, `Board ${boardId} should be directed`).toBe('directed');
      }
    });

    it('all generative boards should have generative control level', () => {
      const registry = getBoardRegistry();
      
      const generativeBoardIds = [
        'generative-ambient',
      ];
      
      for (const boardId of generativeBoardIds) {
        const board = registry.get(boardId);
        expect(board, `Board ${boardId} should exist`).toBeDefined();
        expect(board!.controlLevel, `Board ${boardId} should be generative`).toBe('generative');
      }
    });
  });
});
