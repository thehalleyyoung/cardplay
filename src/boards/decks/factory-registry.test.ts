/**
 * @fileoverview Deck Factory Registry Tests
 * 
 * B127: Tests for factory registration.
 */

import { describe, it, expect, beforeEach } from 'vitest';
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
      id: 'test-instance',
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
      const factory = createMockFactory('pattern-editor');
      
      registry.registerFactory('pattern-editor', factory);
      
      expect(registry.hasFactory('pattern-editor')).toBe(true);
    });

    it('should retrieve registered factory', () => {
      const factory = createMockFactory('piano-roll');
      
      registry.registerFactory('piano-roll', factory);
      const retrieved = registry.getFactory('piano-roll');
      
      expect(retrieved).toBe(factory);
    });

    it('should warn when replacing existing factory', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const factory1 = createMockFactory('notation-score');
      const factory2 = createMockFactory('notation-score');
      
      registry.registerFactory('notation-score', factory1);
      registry.registerFactory('notation-score', factory2);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('already registered')
      );
      
      consoleSpy.mockRestore();
    });

    it('should replace existing factory', () => {
      const factory1 = createMockFactory('timeline');
      const factory2 = createMockFactory('timeline');
      
      registry.registerFactory('timeline', factory1);
      registry.registerFactory('timeline', factory2);
      
      const retrieved = registry.getFactory('timeline');
      expect(retrieved).toBe(factory2);
    });

    it('should throw when factory deckType does not match key', () => {
      const factory = createMockFactory('pattern-editor');
      
      expect(() => {
        registry.registerFactory('piano-roll', factory);
      }).toThrow('does not match registration key');
    });

    it('should register multiple different factories', () => {
      const factory1 = createMockFactory('pattern-editor');
      const factory2 = createMockFactory('piano-roll');
      const factory3 = createMockFactory('notation-score');
      
      registry.registerFactory('pattern-editor', factory1);
      registry.registerFactory('piano-roll', factory2);
      registry.registerFactory('notation-score', factory3);
      
      expect(registry.hasFactory('pattern-editor')).toBe(true);
      expect(registry.hasFactory('piano-roll')).toBe(true);
      expect(registry.hasFactory('notation-score')).toBe(true);
    });
  });

  describe('getFactory', () => {
    it('should return undefined for unregistered factory', () => {
      const factory = registry.getFactory('pattern-editor');
      expect(factory).toBeUndefined();
    });

    it('should return correct factory for registered type', () => {
      const patternFactory = createMockFactory('pattern-editor');
      const pianoFactory = createMockFactory('piano-roll');
      
      registry.registerFactory('pattern-editor', patternFactory);
      registry.registerFactory('piano-roll', pianoFactory);
      
      expect(registry.getFactory('pattern-editor')).toBe(patternFactory);
      expect(registry.getFactory('piano-roll')).toBe(pianoFactory);
    });
  });

  describe('hasFactory', () => {
    it('should return false for unregistered factory', () => {
      expect(registry.hasFactory('pattern-editor')).toBe(false);
    });

    it('should return true for registered factory', () => {
      const factory = createMockFactory('pattern-editor');
      registry.registerFactory('pattern-editor', factory);
      
      expect(registry.hasFactory('pattern-editor')).toBe(true);
    });

    it('should return false after unregistering', () => {
      const factory = createMockFactory('pattern-editor');
      registry.registerFactory('pattern-editor', factory);
      registry.unregisterFactory('pattern-editor');
      
      expect(registry.hasFactory('pattern-editor')).toBe(false);
    });
  });

  describe('getRegisteredTypes', () => {
    it('should return empty array when no factories registered', () => {
      const types = registry.getRegisteredTypes();
      expect(types).toEqual([]);
    });

    it('should return all registered types', () => {
      registry.registerFactory('pattern-editor', createMockFactory('pattern-editor'));
      registry.registerFactory('piano-roll', createMockFactory('piano-roll'));
      registry.registerFactory('notation-score', createMockFactory('notation-score'));
      
      const types = registry.getRegisteredTypes();
      
      expect(types).toContain('pattern-editor');
      expect(types).toContain('piano-roll');
      expect(types).toContain('notation-score');
      expect(types.length).toBe(3);
    });

    it('should not include unregistered types', () => {
      registry.registerFactory('pattern-editor', createMockFactory('pattern-editor'));
      registry.unregisterFactory('pattern-editor');
      
      const types = registry.getRegisteredTypes();
      expect(types).not.toContain('pattern-editor');
    });
  });

  describe('unregisterFactory', () => {
    it('should remove factory from registry', () => {
      const factory = createMockFactory('pattern-editor');
      registry.registerFactory('pattern-editor', factory);
      
      registry.unregisterFactory('pattern-editor');
      
      expect(registry.hasFactory('pattern-editor')).toBe(false);
    });

    it('should not throw when unregistering nonexistent factory', () => {
      expect(() => {
        registry.unregisterFactory('nonexistent' as DeckType);
      }).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all factories', () => {
      registry.registerFactory('pattern-editor', createMockFactory('pattern-editor'));
      registry.registerFactory('piano-roll', createMockFactory('piano-roll'));
      
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
      id: 'test',
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
      const board = createTestBoard(['pattern-editor', 'piano-roll']);
      
      registry.registerFactory('pattern-editor', createMockFactory('pattern-editor'));
      registry.registerFactory('piano-roll', createMockFactory('piano-roll'));
      
      const result = validateBoardFactories(board, registry);
      
      expect(result.valid).toBe(true);
      expect(result.missingFactories).toEqual([]);
    });

    it('should detect missing factories', () => {
      const board = createTestBoard(['pattern-editor', 'piano-roll', 'notation-score']);
      
      registry.registerFactory('pattern-editor', createMockFactory('pattern-editor'));
      // piano-roll and notation-score not registered
      
      const result = validateBoardFactories(board, registry);
      
      expect(result.valid).toBe(false);
      expect(result.missingFactories).toContain('piano-roll');
      expect(result.missingFactories).toContain('notation-score');
    });

    it('should return empty array for board with no decks', () => {
      const board = createTestBoard([]);
      
      const result = validateBoardFactories(board, registry);
      
      expect(result.valid).toBe(true);
      expect(result.missingFactories).toEqual([]);
    });

    it('should handle duplicate deck types in board', () => {
      const board = createTestBoard(['pattern-editor', 'pattern-editor']);
      
      registry.registerFactory('pattern-editor', createMockFactory('pattern-editor'));
      
      const result = validateBoardFactories(board, registry);
      
      expect(result.valid).toBe(true);
      expect(result.missingFactories).toEqual([]);
    });

    it('should detect all missing factories', () => {
      const board = createTestBoard([
        'pattern-editor',
        'piano-roll',
        'notation-score',
        'timeline',
      ]);
      
      // Register none
      
      const result = validateBoardFactories(board, registry);
      
      expect(result.valid).toBe(false);
      expect(result.missingFactories.length).toBe(4);
    });

    it('should validate partially registered factories', () => {
      const board = createTestBoard([
        'pattern-editor',
        'piano-roll',
        'notation-score',
      ]);
      
      registry.registerFactory('piano-roll', createMockFactory('piano-roll'));
      
      const result = validateBoardFactories(board, registry);
      
      expect(result.valid).toBe(false);
      expect(result.missingFactories).toContain('pattern-editor');
      expect(result.missingFactories).toContain('notation-score');
      expect(result.missingFactories).not.toContain('piano-roll');
    });
  });

  describe('error messages', () => {
    it('should provide helpful error message', () => {
      const board = createTestBoard(['pattern-editor']);
      
      const result = validateBoardFactories(board, registry);
      
      expect(result.valid).toBe(false);
      expect(result.message).toBeTruthy();
      expect(result.message).toContain('pattern-editor');
    });

    it('should list all missing factories in message', () => {
      const board = createTestBoard(['pattern-editor', 'piano-roll']);
      
      const result = validateBoardFactories(board, registry);
      
      expect(result.message).toContain('pattern-editor');
      expect(result.message).toContain('piano-roll');
    });

    it('should provide success message when valid', () => {
      const board = createTestBoard(['pattern-editor']);
      
      registry.registerFactory('pattern-editor', createMockFactory('pattern-editor'));
      
      const result = validateBoardFactories(board, registry);
      
      expect(result.valid).toBe(true);
      expect(result.message).toBeTruthy();
    });
  });
});
