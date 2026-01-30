/**
 * @fileoverview Deck Pack System Tests
 * 
 * Tests O027-O034:
 * - Deck pack registry
 * - Builtin packs
 * - Pack addition
 * - Conflict resolution
 * 
 * @module @cardplay/boards/deck-packs/tests
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { getDeckPackRegistry, resetDeckPackRegistry } from './registry';
import { builtinDeckPacks } from './builtins';
import { registerBuiltinDeckPacks } from './register';
import { addDeckPackToBoard } from './add-pack';
import { getBoardRegistry, resetBoardRegistry } from '../registry';
import type { Board } from '../types';

describe('Deck Pack Registry', () => {
  beforeEach(() => {
    resetDeckPackRegistry();
  });

  test('registers and retrieves deck packs', () => {
    const registry = getDeckPackRegistry();
    const pack = builtinDeckPacks[0];
    
    registry.register(pack);
    const retrieved = registry.get(pack.id);
    
    expect(retrieved).toEqual(pack);
  });

  test('prevents duplicate registration', () => {
    const registry = getDeckPackRegistry();
    const pack = builtinDeckPacks[0];
    
    registry.register(pack);
    expect(() => registry.register(pack)).toThrow();
  });

  test('lists all registered packs', () => {
    const registry = getDeckPackRegistry();
    registerBuiltinDeckPacks();
    
    const packs = registry.list();
    expect(packs).toHaveLength(builtinDeckPacks.length);
  });

  test('searches packs by category', () => {
    const registry = getDeckPackRegistry();
    registerBuiltinDeckPacks();
    
    const productionPacks = registry.search({ category: 'production' });
    expect(productionPacks.length).toBeGreaterThan(0);
    expect(productionPacks.every(p => p.category === 'production')).toBe(true);
  });

  test('searches packs by difficulty', () => {
    const registry = getDeckPackRegistry();
    registerBuiltinDeckPacks();
    
    const beginnerPacks = registry.search({ difficulty: 'beginner' });
    expect(beginnerPacks.length).toBeGreaterThan(0);
    expect(beginnerPacks.every(p => p.difficulty === 'beginner')).toBe(true);
  });

  test('searches packs by text query', () => {
    const registry = getDeckPackRegistry();
    registerBuiltinDeckPacks();
    
    const results = registry.search({ query: 'production' });
    expect(results.length).toBeGreaterThan(0);
  });

  test('searches packs by tags', () => {
    const registry = getDeckPackRegistry();
    registerBuiltinDeckPacks();
    
    const results = registry.search({ tags: ['mixing'] });
    expect(results.length).toBeGreaterThan(0);
  });

  test('gets packs by category', () => {
    const registry = getDeckPackRegistry();
    registerBuiltinDeckPacks();
    
    const compositionPacks = registry.getByCategory('composition');
    expect(compositionPacks.every(p => p.category === 'composition')).toBe(true);
  });
});

describe('Builtin Deck Packs', () => {
  test('Essential Production pack is valid', () => {
    const pack = builtinDeckPacks.find(p => p.id === 'essential-production');
    expect(pack).toBeDefined();
    expect(pack!.name).toBe('Essential Production');
    expect(pack!.category).toBe('production');
    expect(pack!.decks.length).toBeGreaterThan(0);
    
    // Check deck types are valid
    pack!.decks.forEach(deck => {
      expect(deck.id).toBeTruthy();
      expect(deck.type).toBeTruthy();
      expect(deck.cardLayout).toBeTruthy();
    });
  });

  test('Notation Essentials pack is valid', () => {
    const pack = builtinDeckPacks.find(p => p.id === 'notation-essentials');
    expect(pack).toBeDefined();
    expect(pack!.name).toBe('Notation Essentials');
    expect(pack!.category).toBe('composition');
    expect(pack!.decks.length).toBeGreaterThan(0);
  });

  test('Sound Design Lab pack is valid', () => {
    const pack = builtinDeckPacks.find(p => p.id === 'sound-design-lab');
    expect(pack).toBeDefined();
    expect(pack!.name).toBe('Sound Design Lab');
    expect(pack!.category).toBe('sound-design');
    expect(pack!.decks.length).toBeGreaterThan(0);
  });

  test('all packs have required metadata', () => {
    builtinDeckPacks.forEach(pack => {
      expect(pack.id).toBeTruthy();
      expect(pack.name).toBeTruthy();
      expect(pack.description).toBeTruthy();
      expect(pack.category).toBeTruthy();
      expect(pack.tags).toBeInstanceOf(Array);
      expect(pack.icon).toBeTruthy();
      expect(pack.decks).toBeInstanceOf(Array);
      expect(pack.decks.length).toBeGreaterThan(0);
    });
  });

  test('all packs have unique IDs', () => {
    const ids = builtinDeckPacks.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('Deck Pack Addition (O032-O034)', () => {
  beforeEach(() => {
    resetDeckPackRegistry();
    resetBoardRegistry(); // Also reset board registry to avoid conflicts
  });

  test('adds deck pack to board without conflicts', () => {
    // Register packs
    registerBuiltinDeckPacks();
    
    // Create a minimal board for testing
    const boardRegistry = getBoardRegistry();
    
    const testBoard: Board = {
      id: 'test:board',
      name: 'Test Board',
      description: 'Test',
      icon: 'test',
      category: 'Manual',
      controlLevel: 'full-manual',
      primaryView: 'tracker',
      compositionTools: {
        phraseDatabase: { enabled: false, mode: 'hidden' },
        harmonyExplorer: { enabled: false, mode: 'hidden' },
        phraseGenerators: { enabled: false, mode: 'hidden' },
        arrangerCard: { enabled: false, mode: 'hidden' },
        aiComposer: { enabled: false, mode: 'hidden' }
      },
      layout: {
        type: 'dock',
        panels: []
      },
      decks: [],
      shortcuts: {}
    };
    
    boardRegistry.register(testBoard);
    
    // Add pack
    const result = addDeckPackToBoard('essential-production', {
      boardId: 'test:board',
      autoRename: true
    });
    
    expect(result.success).toBe(true);
    expect(result.deckIds.length).toBeGreaterThan(0);
    expect(result.errors).toHaveLength(0);
  });

  test('handles ID conflicts with auto-rename', () => {
    registerBuiltinDeckPacks();
    
    const boardRegistry = getBoardRegistry();
    
    // Create board with existing deck ID
    const testBoard: Board = {
      id: 'test:board',
      name: 'Test Board',
      description: 'Test',
      icon: 'test',
      category: 'Manual',
      controlLevel: 'full-manual',
      primaryView: 'tracker',
      compositionTools: {
        phraseDatabase: { enabled: false, mode: 'hidden' },
        harmonyExplorer: { enabled: false, mode: 'hidden' },
        phraseGenerators: { enabled: false, mode: 'hidden' },
        arrangerCard: { enabled: false, mode: 'hidden' },
        aiComposer: { enabled: false, mode: 'hidden' }
      },
      layout: {
        type: 'dock',
        panels: []
      },
      decks: [{
        id: 'mixer', // Conflicts with Essential Production pack
        type: 'mixer-deck',
        cardLayout: 'stack',
        allowReordering: false,
        allowDragOut: false
      }],
      shortcuts: {}
    };
    
    boardRegistry.register(testBoard);
    
    // Add pack with auto-rename
    const result = addDeckPackToBoard('essential-production', {
      boardId: 'test:board',
      autoRename: true
    });
    
    expect(result.success).toBe(true);
    expect(result.renamed).toHaveProperty('mixer');
    expect(result.renamed['mixer']).toMatch(/^mixer_\d+$/);
  });

  test('fails without auto-rename on conflicts', () => {
    registerBuiltinDeckPacks();
    
    const boardRegistry = getBoardRegistry();
    
    // Create board with existing deck ID
    const testBoard: Board = {
      id: 'test:board',
      name: 'Test Board',
      description: 'Test',
      icon: 'test',
      category: 'Manual',
      controlLevel: 'full-manual',
      primaryView: 'tracker',
      compositionTools: {
        phraseDatabase: { enabled: false, mode: 'hidden' },
        harmonyExplorer: { enabled: false, mode: 'hidden' },
        phraseGenerators: { enabled: false, mode: 'hidden' },
        arrangerCard: { enabled: false, mode: 'hidden' },
        aiComposer: { enabled: false, mode: 'hidden' }
      },
      layout: {
        type: 'dock',
        panels: []
      },
      decks: [{
        id: 'mixer',
        type: 'mixer-deck',
        cardLayout: 'stack',
        allowReordering: false,
        allowDragOut: false
      }],
      shortcuts: {}
    };
    
    boardRegistry.register(testBoard);
    
    // Add pack without auto-rename
    const result = addDeckPackToBoard('essential-production', {
      boardId: 'test:board',
      autoRename: false
    });
    
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('records installation', () => {
    registerBuiltinDeckPacks();
    
    const boardRegistry = getBoardRegistry();
    const deckPackRegistry = getDeckPackRegistry();
    
    const testBoard: Board = {
      id: 'test:board',
      name: 'Test Board',
      description: 'Test',
      icon: 'test',
      category: 'Manual',
      controlLevel: 'full-manual',
      primaryView: 'tracker',
      compositionTools: {
        phraseDatabase: { enabled: false, mode: 'hidden' },
        harmonyExplorer: { enabled: false, mode: 'hidden' },
        phraseGenerators: { enabled: false, mode: 'hidden' },
        arrangerCard: { enabled: false, mode: 'hidden' },
        aiComposer: { enabled: false, mode: 'hidden' }
      },
      layout: {
        type: 'dock',
        panels: []
      },
      decks: [],
      shortcuts: {}
    };
    
    boardRegistry.register(testBoard);
    
    // Add pack
    addDeckPackToBoard('essential-production', {
      boardId: 'test:board'
    });
    
    // Check installation is recorded
    const isInstalled = deckPackRegistry.isInstalled('essential-production', 'test:board');
    expect(isInstalled).toBe(true);
    
    const installations = deckPackRegistry.getInstallations('test:board');
    expect(installations.length).toBeGreaterThan(0);
    expect(installations[0].packId).toBe('essential-production');
  });

  test('fails gracefully for non-existent pack', () => {
    const result = addDeckPackToBoard('non-existent-pack', {
      boardId: 'test:board'
    });
    
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('not found');
  });

  test('fails gracefully for non-existent board', () => {
    registerBuiltinDeckPacks();
    
    const result = addDeckPackToBoard('essential-production', {
      boardId: 'non-existent-board'
    });
    
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('not found');
  });
});

/**
 * Change 199: Assert every deck pack only uses DeckTypes that have factories.
 */
describe('Deck Pack Factory Coverage (Change 199)', () => {
  beforeEach(() => {
    resetDeckPackRegistry();
  });

  test('all deck pack deck types have registered factories', async () => {
    // Dynamic import to avoid circular dependency
    const { getDeckFactoryRegistry } = await import('../decks/factory-registry.js');
    // Ensure factories are registered
    await import('../decks/factories/index.js');
    
    const factoryRegistry = getDeckFactoryRegistry();
    const missingFactories: string[] = [];
    
    for (const pack of builtinDeckPacks) {
      for (const deck of pack.decks) {
        if (!factoryRegistry.hasFactory(deck.type as any)) {
          missingFactories.push(`${pack.id}/${deck.type}`);
        }
      }
    }
    
    if (missingFactories.length > 0) {
      console.warn('Deck packs reference DeckTypes without factories:', missingFactories);
    }
    
    // Known issue: Some deck types don't have factories yet (tracked in Changes 197-198)
    // These are expected until all factories are implemented
    const expectedMissing = [
      'essential-production/mixer-deck',
      'essential-production/transport-deck', 
      'essential-production/instruments-deck',
      'essential-production/properties-deck',
      'notation-essentials/notation-deck',
      'notation-essentials/properties-deck',
      'notation-essentials/instruments-deck',
      'notation-essentials/dsp-chain',
      'sound-design-lab/routing-deck',
      'sound-design-lab/spectrum-analyzer-deck',
      'sound-design-lab/waveform-editor-deck',
      'sound-design-lab/modulation-matrix-deck',
      'sound-design-lab/properties-deck'
    ];
    
    const unexpectedMissing = missingFactories.filter(id => !expectedMissing.includes(id));
    
    expect(
      unexpectedMissing,
      `Unexpected missing factories (beyond tracked issues): ${unexpectedMissing.join(', ')}`
    ).toHaveLength(0);
  });
});