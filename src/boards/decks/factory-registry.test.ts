/**
 * @fileoverview Deck Factory Registry Tests
 * 
 * B127: Tests for factory registration.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeckFactoryRegistry, validateBoardFactories } from './factory-registry';
import type { DeckFactory } from './factory-types';
import type { Board, DeckType } from '../types';

describe('DeckFactoryRegistry', () => {
  let registry: DeckFactoryRegistry;

  const createMockFactory = (deckType: DeckType): DeckFactory => ({
    deckType,
    name: `${deckType} Factory`,
    version: '1.0.0',
    create: () => ({
      id: `test-${deckType}-1` as any, // Change 155: Use DeckId for instances
      type: deckType,
      title: 'Test Instance',
      render: () => {
        const div = document.createElement('div');
        div.textContent = 'Test Deck';
        return div;
      },
      destroy: () => {},
    }),
  });

  beforeEach(() => {
    registry = new DeckFactoryRegistry();
  });

  describe('registerFactory', () => {
    it('should register a factory', () => {
      // Change 154: Use canonical DeckType 'pattern-deck'
      const factory = createMockFactory('pattern-deck');
      
      registry.registerFactory('pattern-deck', factory);
      
      expect(registry.hasFactory('pattern-deck')).toBe(true);
    });

    it('should retrieve registered factory', () => {
      // Change 154: Use canonical DeckType 'piano-roll-deck'
      const factory = createMockFactory('piano-roll-deck');
      
      registry.registerFactory('piano-roll-deck', factory);
      const retrieved = registry.getFactory('piano-roll-deck');
      
      expect(retrieved).toBe(factory);
    });

    it('should warn when replacing existing factory', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Change 154: Use canonical DeckType 'notation-deck'
      const factory1 = createMockFactory('notation-deck');
      const factory2 = createMockFactory('notation-deck');
      
      registry.registerFactory('notation-deck', factory1);
      registry.registerFactory('notation-deck', factory2);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('already registered')
      );
      
      consoleSpy.mockRestore();
    });

    it('should replace existing factory', () => {
      // Change 154: Use canonical DeckType 'arrangement-deck' (not 'timeline')
      const factory1 = createMockFactory('arrangement-deck');
      const factory2 = createMockFactory('arrangement-deck');
      
      registry.registerFactory('arrangement-deck', factory1);
      registry.registerFactory('arrangement-deck', factory2);
      
      const retrieved = registry.getFactory('arrangement-deck');
      expect(retrieved).toBe(factory2);
    });

    it('should throw when factory deckType does not match key', () => {
      // Change 154: Use canonical DeckTypes
      const factory = createMockFactory('pattern-deck');
      
      expect(() => {
        registry.registerFactory('piano-roll-deck', factory);
      }).toThrow('does not match registration key');
    });

    it('should register multiple different factories', () => {
      // Change 154: Use canonical DeckTypes
      const factory1 = createMockFactory('pattern-deck');
      const factory2 = createMockFactory('piano-roll-deck');
      const factory3 = createMockFactory('notation-deck');
      
      registry.registerFactory('pattern-deck', factory1);
      registry.registerFactory('piano-roll-deck', factory2);
      registry.registerFactory('notation-deck', factory3);
      
      expect(registry.hasFactory('pattern-deck')).toBe(true);
      expect(registry.hasFactory('piano-roll-deck')).toBe(true);
      expect(registry.hasFactory('notation-deck')).toBe(true);
    });
  });

  describe('getFactory', () => {
    it('should return undefined for unregistered factory', () => {
      // Change 154: Use canonical DeckType
      const factory = registry.getFactory('pattern-deck');
      expect(factory).toBeUndefined();
    });

    it('should return correct factory for registered type', () => {
      // Change 154: Use canonical DeckTypes
      const patternFactory = createMockFactory('pattern-deck');
      const pianoFactory = createMockFactory('piano-roll-deck');
      
      registry.registerFactory('pattern-deck', patternFactory);
      registry.registerFactory('piano-roll-deck', pianoFactory);
      
      expect(registry.getFactory('pattern-deck')).toBe(patternFactory);
      expect(registry.getFactory('piano-roll-deck')).toBe(pianoFactory);
    });
  });

  describe('hasFactory', () => {
    it('should return false for unregistered factory', () => {
      // Change 154: Use canonical DeckType
      expect(registry.hasFactory('pattern-deck')).toBe(false);
    });

    it('should return true for registered factory', () => {
      // Change 154: Use canonical DeckType
      const factory = createMockFactory('pattern-deck');
      registry.registerFactory('pattern-deck', factory);
      
      expect(registry.hasFactory('pattern-deck')).toBe(true);
    });

    it('should return false after unregistering', () => {
      // Change 154: Use canonical DeckType
      const factory = createMockFactory('pattern-deck');
      registry.registerFactory('pattern-deck', factory);
      registry.unregisterFactory('pattern-deck');
      
      expect(registry.hasFactory('pattern-deck')).toBe(false);
    });
  });

  describe('getRegisteredTypes', () => {
    it('should return empty array when no factories registered', () => {
      const types = registry.getRegisteredTypes();
      expect(types).toEqual([]);
    });

    it('should return all registered types', () => {
      // Change 154: Use canonical DeckTypes
      registry.registerFactory('pattern-deck', createMockFactory('pattern-deck'));
      registry.registerFactory('piano-roll-deck', createMockFactory('piano-roll-deck'));
      registry.registerFactory('notation-deck', createMockFactory('notation-deck'));
      
      const types = registry.getRegisteredTypes();
      
      expect(types).toContain('pattern-deck');
      expect(types).toContain('piano-roll-deck');
      expect(types).toContain('notation-deck');
      expect(types.length).toBe(3);
    });

    it('should not include unregistered types', () => {
      // Change 154: Use canonical DeckType
      registry.registerFactory('pattern-deck', createMockFactory('pattern-deck'));
      registry.unregisterFactory('pattern-deck');
      
      const types = registry.getRegisteredTypes();
      expect(types).not.toContain('pattern-deck');
    });
  });

  describe('unregisterFactory', () => {
    it('should remove factory from registry', () => {
      // Change 154: Use canonical DeckType
      const factory = createMockFactory('pattern-deck');
      registry.registerFactory('pattern-deck', factory);
      
      registry.unregisterFactory('pattern-deck');
      
      expect(registry.hasFactory('pattern-deck')).toBe(false);
    });

    it('should not throw when unregistering nonexistent factory', () => {
      expect(() => {
        registry.unregisterFactory('nonexistent' as DeckType);
      }).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all factories', () => {
      // Change 154: Use canonical DeckTypes
      registry.registerFactory('pattern-deck', createMockFactory('pattern-deck'));
      registry.registerFactory('piano-roll-deck', createMockFactory('piano-roll-deck'));
      
      registry.clear();
      
      expect(registry.getRegisteredTypes()).toEqual([]);
    });
  });
});

describe('validateBoardFactories', () => {
  let registry: DeckFactoryRegistry;

  const createTestBoard = (deckTypes: DeckType[]): Board => ({
    id: 'test-board',
    name: 'Test Board',
    description: 'Test board',
    icon: '🎹',
    category: 'testing',
    version: '1.0.0',
    controlLevel: 'full-manual',
    compositionTools: {
      phraseDatabase: { enabled: false, mode: 'hidden' },
      harmonyExplorer: { enabled: false, mode: 'hidden' },
      phraseGenerators: { enabled: false, mode: 'hidden' },
      arrangerCard: { enabled: false, mode: 'hidden' },
      aiComposer: { enabled: false, mode: 'hidden' },
    },
    primaryView: 'tracker',
    layout: {
      type: 'dock',
      panels: [],
    },
    decks: deckTypes.map(type => ({
      id: `${type}-deck`,
      type,
      cardLayout: 'tabs',
      allowReordering: true,
      allowDragOut: true,
    })),
    difficulty: 'beginner',
    tags: ['test'],
  });

  const createMockFactory = (deckType: DeckType): DeckFactory => ({
    deckType,
    name: `${deckType} Factory`,
    version: '1.0.0',
    create: () => ({
      id: `test-${deckType}-1` as any, // Change 155: Use DeckId for instances
      type: deckType,
      title: 'Test',
      render: () => document.createElement('div'),
      destroy: () => {},
    }),
  });

  beforeEach(() => {
    registry = new DeckFactoryRegistry();
  });

  describe('validation', () => {
    it('should validate board with all factories registered', () => {
      // Change 154: Use canonical DeckTypes
      const board = createTestBoard(['pattern-deck', 'piano-roll-deck']);
      
      registry.registerFactory('pattern-deck', createMockFactory('pattern-deck'));
      registry.registerFactory('piano-roll-deck', createMockFactory('piano-roll-deck'));
      
      const missingFactories = validateBoardFactories(board, registry);
      
      expect(missingFactories).toEqual([]);
    });

    it('should detect missing factories', () => {
      // Change 154: Use canonical DeckTypes
      const board = createTestBoard(['pattern-deck', 'piano-roll-deck', 'notation-deck']);
      
      registry.registerFactory('pattern-deck', createMockFactory('pattern-deck'));
      // piano-roll-deck and notation-deck not registered
      
      const missingFactories = validateBoardFactories(board, registry);
      
      expect(missingFactories).toContain('piano-roll-deck');
      expect(missingFactories).toContain('notation-deck');
      expect(missingFactories.length).toBe(2);
    });

    it('should return empty array for board with no decks', () => {
      const board = createTestBoard([]);
      
      const missingFactories = validateBoardFactories(board, registry);
      
      expect(missingFactories).toEqual([]);
    });

    it('should handle duplicate deck types in board', () => {
      // Change 154: Use canonical DeckType
      const board = createTestBoard(['pattern-deck', 'pattern-deck']);
      
      registry.registerFactory('pattern-deck', createMockFactory('pattern-deck'));
      
      const missingFactories = validateBoardFactories(board, registry);
      
      expect(missingFactories).toEqual([]);
    });

    it('should detect all missing factories', () => {
      // Change 154: Use canonical DeckTypes
      const board = createTestBoard([
        'pattern-deck',
        'piano-roll-deck',
        'notation-deck',
        'arrangement-deck',
      ]);
      
      // Register none
      
      const missingFactories = validateBoardFactories(board, registry);
      
      expect(missingFactories.length).toBe(4);
    });

    it('should validate partially registered factories', () => {
      // Change 154: Use canonical DeckTypes
      const board = createTestBoard([
        'pattern-deck',
        'piano-roll-deck',
        'notation-deck',
      ]);
      
      registry.registerFactory('piano-roll-deck', createMockFactory('piano-roll-deck'));
      
      const missingFactories = validateBoardFactories(board, registry);
      
      expect(missingFactories).toContain('pattern-deck');
      expect(missingFactories).toContain('notation-deck');
      expect(missingFactories).not.toContain('piano-roll-deck');
    });
  });

  describe('error messages', () => {
    it('should provide helpful error message', () => {
      // Change 154: Use canonical DeckType
      const board = createTestBoard(['pattern-deck']);
      
      const missingFactories = validateBoardFactories(board, registry);
      
      expect(missingFactories.length).toBeGreaterThan(0);
      expect(missingFactories).toContain('pattern-deck');
    });

    it('should list all missing factories', () => {
      // Change 154: Use canonical DeckTypes
      const board = createTestBoard(['pattern-deck', 'piano-roll-deck']);
      
      const missingFactories = validateBoardFactories(board, registry);
      
      expect(missingFactories).toContain('pattern-deck');
      expect(missingFactories).toContain('piano-roll-deck');
      expect(missingFactories.length).toBe(2);
    });

    it('should return empty array when valid', () => {
      // Change 154: Use canonical DeckType
      const board = createTestBoard(['pattern-deck']);
      
      registry.registerFactory('pattern-deck', createMockFactory('pattern-deck'));
      
      const missingFactories = validateBoardFactories(board, registry);
      
      expect(missingFactories).toEqual([]);
    });
  });
});
