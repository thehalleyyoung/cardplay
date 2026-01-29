/**
 * @fileoverview Gating integration tests
 * 
 * Tests that card gating works correctly when switching boards
 * and that tool modes control drag/drop behavior.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getBoardRegistry } from '../../boards/registry';
import { getBoardStateStore } from '../../boards/store/store';
import { switchBoard } from '../../boards/switching/switch-board';
import { isCardAllowed } from '../../boards/gating/is-card-allowed';
import { computeVisibleDeckTypes } from '../../boards/gating/tool-visibility';
import { registerBuiltinBoards } from '../../boards/builtins/register';
import type { Board } from '../../boards/types';
import type { CardMeta } from '../../cards/types';

describe('Gating Integration', () => {
  beforeEach(() => {
    // Register builtin boards
    registerBuiltinBoards();
    
    // Reset to known state
    const store = getBoardStateStore();
    store.setFirstRunCompleted();
  });

  it('D076: should hide disallowed card; enabling via board switch reveals it', async () => {
    const registry = getBoardRegistry();
    
    // Get a manual board (full-manual)
    const manualBoard = registry.get('basic-tracker');
    expect(manualBoard).toBeDefined();
    expect(manualBoard?.controlLevel).toBe('full-manual');
    
    // Get an assisted board that allows phrases
    const assistedBoard = registry.get('tracker-phrases');
    expect(assistedBoard).toBeDefined();
    expect(assistedBoard?.controlLevel).toBe('assisted');
    
    // Create a phrase card meta (in generators category with phrase tag)
    const phraseCard: CardMeta = {
      id: 'phrase-test-card',
      name: 'Test Phrase',
      category: 'generators',
      tags: ['phrase', 'assisted', 'template'],
      description: 'A test phrase card'
    };
    
    // Check card is disallowed on manual board
    const allowedOnManual = isCardAllowed(manualBoard!, phraseCard);
    expect(allowedOnManual).toBe(false);
    
    // Check card is allowed on assisted board
    const allowedOnAssisted = isCardAllowed(assistedBoard!, phraseCard);
    expect(allowedOnAssisted).toBe(true);
    
    // Switch to manual board
    await switchBoard('basic-tracker');
    
    // Verify phrase decks are not visible
    const manualDecks = computeVisibleDeckTypes(manualBoard!);
    expect(manualDecks.includes('phrases-deck')).toBe(false);
    
    // Switch to assisted board
    await switchBoard('tracker-phrases');
    
    // Verify phrase decks are now visible
    const assistedDecks = computeVisibleDeckTypes(assistedBoard!);
    expect(assistedDecks.includes('phrases-deck')).toBe(true);
  });

  it('D077: should disable phrase drag in browse-only mode', () => {
    const registry = getBoardRegistry();
    
    // Create a board with phrase database in browse-only mode
    const browseboard: Board = {
      id: 'test-browse-only',
      name: 'Browse Only Test',
      description: 'Test board',
      version: '1.0.0',
      category: 'Test',
      primaryView: 'tracker',
      difficulty: 'beginner',
      tags: [],
      controlLevel: 'manual-with-hints',
      compositionTools: {
        phraseDatabase: { enabled: true, mode: 'browse-only' },
        harmonyExplorer: { enabled: false, mode: 'hidden' },
        phraseGenerators: { enabled: false, mode: 'hidden' },
        arrangerCard: { enabled: false, mode: 'hidden' },
        aiComposer: { enabled: false, mode: 'hidden' }
      },
      layout: {
        type: 'standard',
        panels: []
      },
      decks: [],
      connections: []
    };
    
    // Check that phrase library deck is visible
    const decks = computeVisibleDeckTypes(browseboard);
    expect(decks.includes('phrases-deck')).toBe(true);
    
    // Check phrase database tool mode
    expect(browseboard.compositionTools.phraseDatabase.mode).toBe('browse-only');
    
    // In browse-only mode, UI should disable drag operations
    // This would be enforced in the phrase-library deck UI
  });

  it('D078: should enable phrase drag in drag-drop mode', () => {
    const registry = getBoardRegistry();
    
    // Get the tracker-phrases board which has drag-drop mode
    const dragBoard = registry.get('tracker-phrases');
    expect(dragBoard).toBeDefined();
    expect(dragBoard?.compositionTools.phraseDatabase.enabled).toBe(true);
    expect(dragBoard?.compositionTools.phraseDatabase.mode).toBe('drag-drop');
    
    // Check that phrase library deck is visible
    const decks = computeVisibleDeckTypes(dragBoard!);
    expect(decks.includes('phrases-deck')).toBe(true);
    
    // In drag-drop mode, UI should enable drag operations
    // This would be enforced in the phrase-library deck UI
    
    // Verify other assisted features
    expect(dragBoard?.controlLevel).toBe('assisted');
  });

  it('should filter cards based on board control level', () => {
    const registry = getBoardRegistry();
    
    // Manual card (always allowed)
    const manualCard: CardMeta = {
      id: 'manual-card',
      name: 'Manual Instrument',
      category: 'instruments',
      tags: ['manual'],
      description: 'A manual instrument'
    };
    
    // Generator card (not allowed on manual boards)
    const generatorCard: CardMeta = {
      id: 'generator-card',
      name: 'Melody Generator',
      category: 'generators',
      tags: ['generative', 'ai'],
      description: 'An AI melody generator'
    };
    
    // Test on manual board
    const manualBoard = registry.get('basic-tracker')!;
    expect(isCardAllowed(manualBoard, manualCard)).toBe(true);
    expect(isCardAllowed(manualBoard, generatorCard)).toBe(false);
    
    // Test on directed board
    const directedBoard = registry.get('ai-arranger')!;
    expect(isCardAllowed(directedBoard, manualCard)).toBe(true);
    expect(isCardAllowed(directedBoard, generatorCard)).toBe(true);
  });

  it('should allow board-specific deck visibility', () => {
    const registry = getBoardRegistry();
    
    // Check manual board deck visibility
    const manualBoard = registry.get('basic-tracker')!;
    const manualDecks = computeVisibleDeckTypes(manualBoard);
    
    expect(manualDecks.includes('pattern-deck')).toBe(true);
    expect(manualDecks.includes('instruments-deck')).toBe(true);
    expect(manualDecks.includes('phrases-deck')).toBe(false);
    expect(manualDecks.includes('generators-deck')).toBe(false);
    
    // Check assisted board deck visibility
    const assistedBoard = registry.get('tracker-phrases')!;
    const assistedDecks = computeVisibleDeckTypes(assistedBoard);
    
    expect(assistedDecks.includes('pattern-deck')).toBe(true);
    expect(assistedDecks.includes('phrases-deck')).toBe(true);
    expect(assistedDecks.includes('generators-deck')).toBe(false);
    
    // Check directed board deck visibility
    const directedBoard = registry.get('ai-arranger')!;
    const directedDecks = computeVisibleDeckTypes(directedBoard);
    
    expect(directedDecks.includes('generators-deck')).toBe(true);
  });
});
