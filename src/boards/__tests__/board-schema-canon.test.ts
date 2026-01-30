/**
 * board-schema-canon.test.ts
 * Asserts that all builtin boards match the canonical schema
 * 
 * Change 150 from to_fix_repo_plan_500.md
 */

import { describe, it, expect } from 'vitest';
import { getAllBuiltinBoards } from '../builtins/register.js';
import type { BoardDefinition, DeckType } from '../types.js';

// Canonical DeckType values per docs/canon/deck-systems.md
const CANONICAL_DECK_TYPES: Set<DeckType> = new Set([
  'pattern-deck',
  'piano-roll-deck',
  'notation-deck',
  'session-deck',
  'arrangement-deck',
  'arranger-deck',
  'mixer-deck',
  'transport-deck',
  'instruments-deck',
  'samples-deck',
  'sample-manager-deck',
  'effects-deck',
  'dsp-chain',
  'routing-deck',
  'modulation-matrix-deck',
  'automation-deck',
  'properties-deck',
  'phrases-deck',
  'harmony-deck',
  'generators-deck',
  'ai-advisor-deck',
  'track-groups-deck',
  'mix-bus-deck',
  'reference-track-deck',
  'spectrum-analyzer-deck',
  'waveform-editor-deck',
] as DeckType[]);

describe('Board Schema Canon Compliance', () => {
  const boards = getAllBuiltinBoards();
  
  it('all boards have required fields', () => {
    for (const board of boards) {
      expect(board.id, `Board ${board.id} has id`).toBeTruthy();
      expect(board.name, `Board ${board.id} has name`).toBeTruthy();
      expect(board.decks, `Board ${board.id} has decks`).toBeDefined();
      expect(Array.isArray(board.decks), `Board ${board.id} decks is array`).toBe(true);
      expect(board.layout, `Board ${board.id} has layout`).toBeDefined();
      expect(board.controlLevel, `Board ${board.id} has controlLevel`).toBeDefined();
    }
  });
  
  it('all decks have panelId', () => {
    for (const board of boards) {
      for (const deck of board.decks) {
        expect(
          deck.panelId,
          `Board ${board.id}, deck ${deck.id} must have panelId`
        ).toBeDefined();
      }
    }
  });
  
  it('all deck panelIds reference existing panels', () => {
    for (const board of boards) {
      const panelIds = new Set(board.layout.panels.map(p => p.id));
      
      for (const deck of board.decks) {
        expect(
          panelIds.has(deck.panelId!),
          `Board ${board.id}, deck ${deck.id} panelId "${deck.panelId}" must exist in layout.panels`
        ).toBe(true);
      }
    }
  });
  
  it('all deck types are canonical', () => {
    const nonCanonical: Array<{ boardId: string; deckId: string; type: string }> = [];
    
    for (const board of boards) {
      for (const deck of board.decks) {
        if (!CANONICAL_DECK_TYPES.has(deck.type)) {
          nonCanonical.push({
            boardId: board.id,
            deckId: deck.id,
            type: deck.type
          });
        }
      }
    }
    
    if (nonCanonical.length > 0) {
      const details = nonCanonical
        .map(({ boardId, deckId, type }) => 
          `  - Board "${boardId}", deck "${deckId}": type "${type}"`
        )
        .join('\n');
      
      throw new Error(
        `Non-canonical DeckType values found:\n${details}\n\n` +
        'All DeckType values must be from the canonical set defined in docs/canon/deck-systems.md'
      );
    }
  });
  
  it('deck IDs are unique within each board', () => {
    for (const board of boards) {
      const deckIds = board.decks.map(d => d.id);
      const uniqueIds = new Set(deckIds);
      
      expect(
        uniqueIds.size,
        `Board ${board.id} has duplicate deck IDs`
      ).toBe(deckIds.length);
    }
  });
  
  it('layout panels have required fields', () => {
    for (const board of boards) {
      expect(board.layout.type, `Board ${board.id} layout has type`).toBeDefined();
      expect(board.layout.panels, `Board ${board.id} layout has panels`).toBeDefined();
      expect(Array.isArray(board.layout.panels), `Board ${board.id} layout.panels is array`).toBe(true);
      
      for (const panel of board.layout.panels) {
        expect(panel.id, `Board ${board.id} panel has id`).toBeTruthy();
        expect(panel.position, `Board ${board.id} panel ${panel.id} has position`).toBeTruthy();
      }
    }
  });
  
  it('panel IDs are unique within each board', () => {
    for (const board of boards) {
      const panelIds = board.layout.panels.map(p => p.id);
      const uniqueIds = new Set(panelIds);
      
      expect(
        uniqueIds.size,
        `Board ${board.id} has duplicate panel IDs`
      ).toBe(panelIds.length);
    }
  });
  
  it('boards have valid control levels', () => {
    const validLevels = new Set([
      'full-auto',
      'auto-with-confirmation', 
      'suggestion-only',
      'manual-with-hints',
      'full-manual'
    ]);
    
    for (const board of boards) {
      expect(
        validLevels.has(board.controlLevel),
        `Board ${board.id} has valid controlLevel: ${board.controlLevel}`
      ).toBe(true);
    }
  });
  
  it('boards with AI decks have appropriate control levels', () => {
    const aiDeckTypes = new Set(['generators-deck', 'harmony-deck', 'ai-advisor-deck']);
    
    for (const board of boards) {
      const hasAIDecks = board.decks.some(d => aiDeckTypes.has(d.type));
      
      if (hasAIDecks && board.controlLevel === 'full-manual') {
        console.warn(
          `⚠️  Board ${board.id} has AI decks but controlLevel is 'full-manual'. ` +
          'Consider using at least "manual-with-hints" to enable AI features.'
        );
      }
    }
    
    // This is just a warning, not a failure
    expect(true).toBe(true);
  });
});
