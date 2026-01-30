/**
 * @fileoverview Board Registry Snapshot Tests
 * 
 * Change 491: Snapshot test for board registry output.
 * Ensures board metadata changes are intentional and reviewed.
 * 
 * @module @cardplay/src/tests/snapshots/board-registry.snapshot.test
 */

import { describe, it, expect } from 'vitest';
import { getBoardRegistry } from '../../boards/registry';

describe('Board Registry Snapshots', () => {
  it('should match board registry snapshot', () => {
    const registry = getBoardRegistry();
    const boards = registry.getAll();

    // Create stable snapshot structure
    const snapshot = boards.map(board => ({
      id: board.id,
      name: board.name,
      description: board.description,
      author: board.author,
      version: board.version,
      difficulty: board.difficulty,
      primaryView: board.primaryView,
      tags: [...board.tags].sort(),
      deckCount: board.decks.length,
      deckTypes: board.decks.map(d => d.type).sort(),
      panelCount: board.layout.panels.length,
      panelPositions: board.layout.panels.map(p => p.position).sort(),
      hasPolicy: !!board.policy,
      controlLevel: board.controlLevel,
    })).sort((a, b) => a.id.localeCompare(b.id));

    expect(snapshot).toMatchSnapshot();
  });

  it('should match builtin board IDs snapshot', () => {
    const registry = getBoardRegistry();
    const boards = registry.getAll();
    
    const builtinIds = boards
      .filter(b => !b.id.includes(':')) // Builtins don't have namespace
      .map(b => b.id)
      .sort();

    expect(builtinIds).toMatchSnapshot();
  });

  it('should match board deck type usage snapshot', () => {
    const registry = getBoardRegistry();
    const boards = registry.getAll();

    // Track which DeckTypes are used by which boards
    const deckTypeUsage = new Map<string, string[]>();
    
    for (const board of boards) {
      for (const deck of board.decks) {
        if (!deckTypeUsage.has(deck.type)) {
          deckTypeUsage.set(deck.type, []);
        }
        deckTypeUsage.get(deck.type)!.push(board.id);
      }
    }

    const snapshot = Array.from(deckTypeUsage.entries())
      .map(([deckType, boardIds]) => ({
        deckType,
        boardIds: boardIds.sort(),
        usageCount: boardIds.length,
      }))
      .sort((a, b) => a.deckType.localeCompare(b.deckType));

    expect(snapshot).toMatchSnapshot();
  });

  it('should match board metadata completeness snapshot', () => {
    const registry = getBoardRegistry();
    const boards = registry.getAll();

    const completeness = boards.map(board => ({
      id: board.id,
      hasDescription: !!board.description,
      hasAuthor: !!board.author,
      hasVersion: !!board.version,
      hasDifficulty: !!board.difficulty,
      hasTags: board.tags.size > 0,
      allDecksHavePanelId: board.decks.every(d => !!d.panelId),
      allDecksHaveFactories: true, // Would need factory registry check
    })).sort((a, b) => a.id.localeCompare(b.id));

    expect(completeness).toMatchSnapshot();
  });

  it('should validate no duplicate board IDs', () => {
    const registry = getBoardRegistry();
    const boards = registry.getAll();
    const ids = boards.map(b => b.id);
    const uniqueIds = new Set(ids);

    expect(ids.length).toBe(uniqueIds.size);
  });

  it('should validate all board deck types are canonical', () => {
    const registry = getBoardRegistry();
    const boards = registry.getAll();

    const invalidDeckTypes: string[] = [];
    
    for (const board of boards) {
      for (const deck of board.decks) {
        // Check for legacy deck type patterns
        if (deck.type.match(/pattern-editor|piano-roll|notation-score|timeline|session|arrangement|mixer/)) {
          // These should use -deck suffix
          if (!deck.type.endsWith('-deck')) {
            invalidDeckTypes.push(`${board.id}: ${deck.type}`);
          }
        }
      }
    }

    expect(invalidDeckTypes).toEqual([]);
  });

  it('should validate all decks reference valid panels', () => {
    const registry = getBoardRegistry();
    const boards = registry.getAll();

    const invalidPanelRefs: string[] = [];
    
    for (const board of boards) {
      const validPanelIds = new Set(board.layout.panels.map(p => p.id));
      
      for (const deck of board.decks) {
        if (deck.panelId && !validPanelIds.has(deck.panelId)) {
          invalidPanelRefs.push(`${board.id}: deck ${deck.id} references invalid panel ${deck.panelId}`);
        }
      }
    }

    expect(invalidPanelRefs).toEqual([]);
  });
});
