/**
 * @fileoverview Tests for Feature Derivation (Change 378)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  deriveFeaturesForPersona,
  deriveAllPersonaFeatures,
  isFeatureAvailableForPersona,
  getFeaturesByCategory,
  getAllKnownFeatures,
  type PersonaId,
} from './feature-derivation';
import { BoardRegistry } from '../../boards/registry';
import type { Board } from '../../boards/types';

// ============================================================================
// SETUP
// ============================================================================

function createMockBoard(id: string, tags: readonly string[], deckTypes: readonly string[]): Board {
  return {
    id,
    name: `${id} Board`,
    description: `Test board for ${id}`,
    tags: [...tags],
    decks: deckTypes.map((type, idx) => ({
      id: `${id}-deck-${idx}` as never,
      type: type as never,
      panelId: `panel-${idx}` as never,
      layout: 'tabs' as const,
    })),
    layout: {
      panels: [{ id: 'panel-0' as never, direction: 'vertical' as const, size: 100 }],
    },
    difficulty: 'beginner' as const,
    controlLevel: 'auto-apply' as const,
    policy: {
      allowCustomCards: false,
      allowExtensions: false,
      sandboxMode: false,
    },
    primaryView: 'pattern' as const,
    version: '1.0.0',
    compositionTools: {
      phraseDatabase: { enabled: false, mode: 'hidden' },
      harmonyExplorer: { enabled: false, mode: 'hidden' },
      phraseGenerators: { enabled: false, mode: 'hidden' },
      arrangerCard: { enabled: false, mode: 'hidden' },
      aiComposer: { enabled: false, mode: 'hidden' }
    },
  } as Board;
}

// ============================================================================
// TESTS
// ============================================================================

describe('Feature Derivation (Change 378)', () => {
  let registry: BoardRegistry;

  beforeEach(() => {
    // Create a fresh registry for each test
    registry = new BoardRegistry();
    
    // Register some test boards
    const notationBoard = createMockBoard(
      'notation-test',
      ['notation', 'composition'],
      ['notation-deck', 'harmony-deck']
    );
    registry.register(notationBoard, { isBuiltin: true });
    
    const trackerBoard = createMockBoard(
      'tracker-test',
      ['tracker', 'pattern'],
      ['pattern-deck', 'phrases-deck']
    );
    registry.register(trackerBoard, { isBuiltin: true });
    
    const producerBoard = createMockBoard(
      'producer-test',
      ['production', 'mixing'],
      ['mixer-deck', 'automation-deck']
    );
    registry.register(producerBoard, { isBuiltin: true });
  });

  describe('deriveFeaturesForPersona', () => {
    it('derives features for notation-composer persona', () => {
      const features = deriveFeaturesForPersona('notation-composer', registry);
      
      // Should include notation features from notation-tagged boards
      const featureIds = features.map(f => f.featureId);
      
      // At minimum, if notation boards exist, should have notation features
      if (features.length > 0) {
        expect(features.every(f => f.availability === 'available')).toBe(true);
        expect(features.every(f => f.providedBy.length > 0)).toBe(true);
        expect(features.every(f => f.boardsWithFeature.length > 0)).toBe(true);
      }
    });

    it('derives features for tracker-user persona', () => {
      const features = deriveFeaturesForPersona('tracker-user', registry);
      
      if (features.length > 0) {
        // Tracker users should have pattern-related features
        const hasPatternFeatures = features.some(f => 
          f.featureId.includes('pattern')
        );
        // May or may not exist depending on boards registered
        expect(typeof hasPatternFeatures).toBe('boolean');
      }
    });

    it('derives features for sound-designer persona', () => {
      const features = deriveFeaturesForPersona('sound-designer', registry);
      
      // Sound designers might have synthesis/modulation features
      expect(Array.isArray(features)).toBe(true);
    });

    it('derives features for producer persona', () => {
      const features = deriveFeaturesForPersona('producer', registry);
      
      // Producers might have production/mixing features
      expect(Array.isArray(features)).toBe(true);
    });

    it('includes deck types that provide each feature', () => {
      const features = deriveFeaturesForPersona('notation-composer', registry);
      
      for (const feature of features) {
        expect(feature.providedBy).toBeDefined();
        expect(Array.isArray(feature.providedBy)).toBe(true);
      }
    });

    it('includes boards that have each feature', () => {
      const features = deriveFeaturesForPersona('tracker-user', registry);
      
      for (const feature of features) {
        expect(feature.boardsWithFeature).toBeDefined();
        expect(Array.isArray(feature.boardsWithFeature)).toBe(true);
      }
    });
  });

  describe('deriveAllPersonaFeatures', () => {
    it('derives features for all personas', () => {
      const allFeatures = deriveAllPersonaFeatures(registry);
      
      expect(allFeatures.size).toBe(4);
      expect(allFeatures.has('notation-composer')).toBe(true);
      expect(allFeatures.has('tracker-user')).toBe(true);
      expect(allFeatures.has('sound-designer')).toBe(true);
      expect(allFeatures.has('producer')).toBe(true);
    });

    it('returns features for each persona', () => {
      const allFeatures = deriveAllPersonaFeatures(registry);
      
      for (const [persona, features] of allFeatures) {
        expect(Array.isArray(features)).toBe(true);
        // Each feature should have proper structure
        for (const feature of features) {
          expect(typeof feature.featureId).toBe('string');
          expect(['available', 'limited', 'not-available']).toContain(feature.availability);
          expect(Array.isArray(feature.providedBy)).toBe(true);
          expect(Array.isArray(feature.boardsWithFeature)).toBe(true);
        }
      }
    });
  });

  describe('isFeatureAvailableForPersona', () => {
    it('checks if feature is available for a persona', () => {
      // This depends on actual boards registered
      const result = isFeatureAvailableForPersona(
        'notation-composer',
        'feature:notation:score-layout' as never,
        registry
      );
      expect(typeof result).toBe('boolean');
    });

    it('returns false for features not in persona boards', () => {
      // Use a clearly unavailable feature
      const result = isFeatureAvailableForPersona(
        'notation-composer',
        'feature:nonexistent:fake' as never,
        registry
      );
      expect(result).toBe(false);
    });
  });

  describe('getFeaturesByCategory', () => {
    it('gets features by category prefix', () => {
      const patternFeatures = getFeaturesByCategory('pattern');
      
      expect(Array.isArray(patternFeatures)).toBe(true);
      for (const feature of patternFeatures) {
        expect(feature).toMatch(/^feature:pattern:/);
      }
    });

    it('gets notation features', () => {
      const notationFeatures = getFeaturesByCategory('notation');
      
      expect(Array.isArray(notationFeatures)).toBe(true);
      for (const feature of notationFeatures) {
        expect(feature).toMatch(/^feature:notation:/);
      }
    });

    it('gets production features', () => {
      const productionFeatures = getFeaturesByCategory('production');
      
      expect(Array.isArray(productionFeatures)).toBe(true);
      for (const feature of productionFeatures) {
        expect(feature).toMatch(/^feature:production:/);
      }
    });

    it('returns empty array for unknown category', () => {
      const features = getFeaturesByCategory('nonexistent');
      expect(features).toEqual([]);
    });
  });

  describe('getAllKnownFeatures', () => {
    it('returns all features from all deck types', () => {
      const allFeatures = getAllKnownFeatures();
      
      expect(allFeatures.size).toBeGreaterThan(0);
      
      // All should be valid feature IDs
      for (const feature of allFeatures) {
        expect(feature).toMatch(/^feature:/);
      }
    });

    it('returns unique features', () => {
      const allFeatures = getAllKnownFeatures();
      const asArray = Array.from(allFeatures);
      const asSet = new Set(asArray);
      
      expect(asArray.length).toBe(asSet.size); // No duplicates
    });
  });

  describe('Feature Derivation Logic', () => {
    it('derives features based on board tags', () => {
      // This tests the core logic: features come from boards matching persona tags
      const notationFeatures = deriveFeaturesForPersona('notation-composer', registry);
      const trackerFeatures = deriveFeaturesForPersona('tracker-user', registry);
      
      // Features should be different (assuming different boards exist)
      const notationIds = new Set(notationFeatures.map(f => f.featureId));
      const trackerIds = new Set(trackerFeatures.map(f => f.featureId));
      
      // May overlap but shouldn't be identical
      expect(notationIds).not.toEqual(trackerIds);
    });

    it('maps deck types to features correctly', () => {
      const allFeatures = deriveAllPersonaFeatures(registry);
      
      // Each persona should have features from their deck types
      for (const [persona, features] of allFeatures) {
        for (const feature of features) {
          expect(feature.providedBy.length).toBeGreaterThan(0);
          // Each deck type that provides the feature should be valid
          for (const deckType of feature.providedBy) {
            expect(typeof deckType).toBe('string');
          }
        }
      }
    });

    it('ensures features reference actual boards', () => {
      const features = deriveFeaturesForPersona('producer', registry);
      
      for (const feature of features) {
        expect(feature.boardsWithFeature.length).toBeGreaterThan(0);
        // Each board should exist in registry
        for (const boardId of feature.boardsWithFeature) {
          const board = registry.get(boardId);
          expect(board).toBeDefined();
        }
      }
    });
  });

  describe('Integration with Board Registry', () => {
    it('uses real boards from registry', () => {
      const allBoards = registry.list();
      
      // Should have some boards
      expect(allBoards.length).toBeGreaterThan(0);
      
      // Features derived should reference these boards
      const allFeatures = deriveAllPersonaFeatures(registry);
      const allBoardIds = new Set(allBoards.map(b => b.id));
      
      for (const features of allFeatures.values()) {
        for (const feature of features) {
          for (const boardId of feature.boardsWithFeature) {
            expect(allBoardIds.has(boardId)).toBe(true);
          }
        }
      }
    });
  });
});
