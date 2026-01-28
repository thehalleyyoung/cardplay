/**
 * @fileoverview Tests for Card Registry & Discovery.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Version handling
  parseVersion,
  formatVersion,
  compareVersions,
  isVersionCompatible,
  
  // Registry
  getCardRegistry,
  resetCardRegistry,
  registerCard,
  getCard,
  findCards,
  listCardsByCategory,
  getCardDependencies,
  
  // Validation
  validateCardSignature,
  
  // Migration
  migrateCardParams,
  
  // Compatibility
  arePortsCompatible,
  detectCardConflicts,
  
  // Lazy loading
  createLazyCard,
  loadLazyCard,
  
  // Analytics
  getCardUsageStats,
} from './registry';
import {
  createCard,
  createCardMeta,
  createSignature,
  createPort,
  createParam,
  PortTypes,
  pureCard,
} from './card';
import type { CardVersion } from './registry';

// ============================================================================
// VERSION TESTS
// ============================================================================

describe('Version handling', () => {
  describe('parseVersion', () => {
    it('should parse basic version', () => {
      const v = parseVersion('1.2.3');
      expect(v.major).toBe(1);
      expect(v.minor).toBe(2);
      expect(v.patch).toBe(3);
      expect(v.prerelease).toBeUndefined();
    });

    it('should parse version with prerelease', () => {
      const v = parseVersion('1.0.0-alpha.1');
      expect(v.major).toBe(1);
      expect(v.prerelease).toBe('alpha.1');
    });

    it('should throw on invalid version', () => {
      expect(() => parseVersion('invalid')).toThrow();
      expect(() => parseVersion('1.2')).toThrow();
    });
  });

  describe('formatVersion', () => {
    it('should format basic version', () => {
      expect(formatVersion({ major: 1, minor: 2, patch: 3 })).toBe('1.2.3');
    });

    it('should format with prerelease', () => {
      expect(formatVersion({ major: 1, minor: 0, patch: 0, prerelease: 'beta' })).toBe('1.0.0-beta');
    });
  });

  describe('compareVersions', () => {
    it('should compare major versions', () => {
      expect(compareVersions(parseVersion('2.0.0'), parseVersion('1.0.0'))).toBeGreaterThan(0);
      expect(compareVersions(parseVersion('1.0.0'), parseVersion('2.0.0'))).toBeLessThan(0);
    });

    it('should compare minor versions', () => {
      expect(compareVersions(parseVersion('1.2.0'), parseVersion('1.1.0'))).toBeGreaterThan(0);
    });

    it('should compare patch versions', () => {
      expect(compareVersions(parseVersion('1.0.2'), parseVersion('1.0.1'))).toBeGreaterThan(0);
    });

    it('should handle prerelease', () => {
      expect(compareVersions(parseVersion('1.0.0'), parseVersion('1.0.0-alpha'))).toBeGreaterThan(0);
    });
  });

  describe('isVersionCompatible', () => {
    it('should check compatibility', () => {
      expect(isVersionCompatible(parseVersion('1.2.0'), parseVersion('1.1.0'))).toBe(true);
      expect(isVersionCompatible(parseVersion('2.0.0'), parseVersion('1.0.0'))).toBe(false);
    });
  });
});

// ============================================================================
// REGISTRY TESTS
// ============================================================================

describe('CardRegistry', () => {
  beforeEach(() => {
    resetCardRegistry();
  });

  describe('register/get', () => {
    it('should register and retrieve a card', () => {
      const card = pureCard<number, number>(
        createCardMeta('test', 'Test Card', 'transforms'),
        createSignature([], []),
        (x) => x * 2
      );
      
      registerCard(card);
      
      const retrieved = getCard<number, number>('test');
      expect(retrieved).toBe(card);
    });

    it('should return undefined for unknown card', () => {
      expect(getCard('unknown')).toBeUndefined();
    });
  });

  describe('findCards', () => {
    beforeEach(() => {
      registerCard(pureCard(
        createCardMeta('transpose', 'Transpose Notes', 'transforms', { tags: ['pitch', 'midi'] }),
        createSignature([createPort('in', PortTypes.NOTES)], [createPort('out', PortTypes.NOTES)]),
        (x) => x
      ));
      
      registerCard(pureCard(
        createCardMeta('reverb', 'Reverb Effect', 'effects', { tags: ['audio', 'space'] }),
        createSignature([createPort('in', PortTypes.AUDIO)], [createPort('out', PortTypes.AUDIO)]),
        (x) => x
      ));
      
      registerCard(pureCard(
        createCardMeta('delay', 'Delay Effect', 'effects', { tags: ['audio', 'time'] }),
        createSignature([createPort('in', PortTypes.AUDIO)], [createPort('out', PortTypes.AUDIO)]),
        (x) => x
      ));
    });

    it('should find by text search', () => {
      const results = findCards({ text: 'transpose' });
      expect(results).toHaveLength(1);
      expect(results[0]!.card.meta.id).toBe('transpose');
    });

    it('should find by category', () => {
      const results = findCards({ category: 'effects' });
      expect(results).toHaveLength(2);
    });

    it('should find by tags', () => {
      const results = findCards({ tags: ['audio'] });
      expect(results).toHaveLength(2);
    });

    it('should find by input type', () => {
      const results = findCards({ inputType: PortTypes.NOTES });
      expect(results).toHaveLength(1);
    });

    it('should limit results', () => {
      const results = findCards({ limit: 1 });
      expect(results).toHaveLength(1);
    });
  });

  describe('listByCategory', () => {
    it('should group cards by category', () => {
      registerCard(pureCard(
        createCardMeta('a', 'A', 'transforms'),
        createSignature([], []),
        (x) => x
      ));
      registerCard(pureCard(
        createCardMeta('b', 'B', 'effects'),
        createSignature([], []),
        (x) => x
      ));
      
      const byCategory = listCardsByCategory();
      expect(byCategory.get('transforms')).toHaveLength(1);
      expect(byCategory.get('effects')).toHaveLength(1);
    });
  });

  describe('dependencies', () => {
    it('should track dependencies', () => {
      registerCard(pureCard(
        createCardMeta('base', 'Base', 'transforms'),
        createSignature([], []),
        (x) => x
      ));
      registerCard(pureCard(
        createCardMeta('derived', 'Derived', 'transforms'),
        createSignature([], []),
        (x) => x
      ), ['base']);
      
      expect(getCardDependencies('derived')).toEqual(['base']);
    });

    it('should find dependents', () => {
      registerCard(pureCard(
        createCardMeta('base', 'Base', 'transforms'),
        createSignature([], []),
        (x) => x
      ));
      registerCard(pureCard(
        createCardMeta('derived', 'Derived', 'transforms'),
        createSignature([], []),
        (x) => x
      ), ['base']);
      
      const registry = getCardRegistry();
      expect(registry.getDependents('base')).toEqual(['derived']);
    });
  });

  describe('usage tracking', () => {
    it('should track usage', () => {
      registerCard(pureCard(
        createCardMeta('test', 'Test', 'transforms'),
        createSignature([], []),
        (x) => x
      ));
      
      const registry = getCardRegistry();
      registry.markUsed('test');
      registry.markUsed('test');
      
      const entry = registry.getEntry('test');
      expect(entry?.usageCount).toBe(2);
      expect(entry?.lastUsedAt).toBeGreaterThan(0);
    });

    it('should get recently used', () => {
      registerCard(pureCard(
        createCardMeta('a', 'A', 'transforms'),
        createSignature([], []),
        (x) => x
      ));
      registerCard(pureCard(
        createCardMeta('b', 'B', 'transforms'),
        createSignature([], []),
        (x) => x
      ));
      
      const registry = getCardRegistry();
      registry.markUsed('b');
      registry.markUsed('a');
      
      const recent = registry.getRecentlyUsed();
      expect(recent[0]!.card.meta.id).toBe('a');
    });
  });

  describe('favorites', () => {
    it('should toggle favorites', () => {
      registerCard(pureCard(
        createCardMeta('test', 'Test', 'transforms'),
        createSignature([], []),
        (x) => x
      ));
      
      const registry = getCardRegistry();
      expect(registry.toggleFavorite('test')).toBe(true);
      expect(registry.getEntry('test')?.isFavorite).toBe(true);
      expect(registry.toggleFavorite('test')).toBe(false);
    });

    it('should get favorites', () => {
      registerCard(pureCard(
        createCardMeta('a', 'A', 'transforms'),
        createSignature([], []),
        (x) => x
      ));
      registerCard(pureCard(
        createCardMeta('b', 'B', 'transforms'),
        createSignature([], []),
        (x) => x
      ));
      
      const registry = getCardRegistry();
      registry.toggleFavorite('b');
      
      const favorites = registry.getFavorites();
      expect(favorites).toHaveLength(1);
      expect(favorites[0]!.card.meta.id).toBe('b');
    });
  });
});

// ============================================================================
// VALIDATION TESTS
// ============================================================================

describe('validateCardSignature', () => {
  it('should validate a valid signature', () => {
    const signature = createSignature(
      [createPort('in', PortTypes.NOTES)],
      [createPort('out', PortTypes.NOTES)],
      [createParam('transpose', 'integer', 0)]
    );
    
    const result = validateCardSignature(signature);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect duplicate port names', () => {
    const signature = createSignature(
      [createPort('in', PortTypes.NOTES), createPort('in', PortTypes.AUDIO)],
      []
    );
    
    const result = validateCardSignature(signature);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Duplicate input'))).toBe(true);
  });

  it('should warn about missing ports', () => {
    const signature = createSignature([], []);
    
    const result = validateCardSignature(signature);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// MIGRATION TESTS
// ============================================================================

describe('migrateCardParams', () => {
  it('should apply migrations in order', () => {
    const migrations = [
      {
        version: parseVersion('1.1.0'),
        migrate: (params: Record<string, unknown>) => ({
          ...params,
          newParam: 'added',
        }),
      },
      {
        version: parseVersion('1.2.0'),
        migrate: (params: Record<string, unknown>) => ({
          ...params,
          renamed: params['old'],
          old: undefined,
        }),
      },
    ];
    
    const result = migrateCardParams(
      { old: 'value' },
      parseVersion('1.0.0'),
      parseVersion('1.2.0'),
      migrations
    );
    
    expect(result.newParam).toBe('added');
    expect(result.renamed).toBe('value');
  });

  it('should skip migrations outside range', () => {
    const migrations = [
      {
        version: parseVersion('2.0.0'),
        migrate: () => ({ shouldNotApply: true }),
      },
    ];
    
    const result = migrateCardParams(
      { original: true },
      parseVersion('1.0.0'),
      parseVersion('1.5.0'),
      migrations
    );
    
    expect(result.original).toBe(true);
    expect(result.shouldNotApply).toBeUndefined();
  });
});

// ============================================================================
// COMPATIBILITY TESTS
// ============================================================================

describe('arePortsCompatible', () => {
  it('should match exact types', () => {
    expect(arePortsCompatible(
      createPort('out', PortTypes.NOTES),
      createPort('in', PortTypes.NOTES)
    )).toBe(true);
  });

  it('should match with ANY type', () => {
    expect(arePortsCompatible(
      createPort('out', PortTypes.NOTES),
      createPort('in', PortTypes.ANY)
    )).toBe(true);
  });

  it('should match compatible types', () => {
    expect(arePortsCompatible(
      createPort('out', PortTypes.NOTES),
      createPort('in', PortTypes.MIDI)
    )).toBe(true);
  });

  it('should reject incompatible types', () => {
    expect(arePortsCompatible(
      createPort('out', PortTypes.AUDIO),
      createPort('in', PortTypes.NOTES)
    )).toBe(false);
  });
});

describe('detectCardConflicts', () => {
  it('should detect duplicate IDs', () => {
    const cardA = pureCard(
      createCardMeta('same-id', 'Card A', 'transforms'),
      createSignature([], []),
      (x) => x
    );
    const cardB = pureCard(
      createCardMeta('same-id', 'Card B', 'effects'),
      createSignature([], []),
      (x) => x
    );
    
    const conflicts = detectCardConflicts(cardA, cardB);
    expect(conflicts.some(c => c.includes('Duplicate card ID'))).toBe(true);
  });

  it('should detect duplicate names in same category', () => {
    const cardA = pureCard(
      createCardMeta('id-a', 'Same Name', 'transforms'),
      createSignature([], []),
      (x) => x
    );
    const cardB = pureCard(
      createCardMeta('id-b', 'Same Name', 'transforms'),
      createSignature([], []),
      (x) => x
    );
    
    const conflicts = detectCardConflicts(cardA, cardB);
    expect(conflicts.some(c => c.includes('Duplicate card name'))).toBe(true);
  });
});

// ============================================================================
// LAZY LOADING TESTS
// ============================================================================

describe('Lazy loading', () => {
  it('should create lazy card reference', () => {
    const meta = createCardMeta('lazy', 'Lazy Card', 'transforms');
    const lazy = createLazyCard(meta, async () =>
      pureCard(meta, createSignature([], []), (x) => x)
    );
    
    expect(lazy.id).toBe('lazy');
    expect(lazy.loaded).toBeUndefined();
  });

  it('should load lazy card', async () => {
    const meta = createCardMeta('lazy', 'Lazy Card', 'transforms');
    const lazy = createLazyCard(meta, async () =>
      pureCard(meta, createSignature([], []), (x: number) => x * 2)
    );
    
    const card = await loadLazyCard(lazy);
    expect(card.meta.id).toBe('lazy');
    expect(lazy.loaded).toBe(card);
    
    // Should return cached card
    const card2 = await loadLazyCard(lazy);
    expect(card2).toBe(card);
  });
});

// ============================================================================
// ANALYTICS TESTS
// ============================================================================

describe('Analytics', () => {
  beforeEach(() => {
    resetCardRegistry();
  });

  it('should get usage stats', () => {
    registerCard(pureCard(
      createCardMeta('a', 'A', 'transforms'),
      createSignature([], []),
      (x) => x
    ));
    registerCard(pureCard(
      createCardMeta('b', 'B', 'transforms'),
      createSignature([], []),
      (x) => x
    ));
    
    const registry = getCardRegistry();
    registry.markUsed('b');
    registry.markUsed('b');
    registry.markUsed('a');
    
    const stats = getCardUsageStats();
    expect(stats[0]!.cardId).toBe('b');
    expect(stats[0]!.usageCount).toBe(2);
  });
});
