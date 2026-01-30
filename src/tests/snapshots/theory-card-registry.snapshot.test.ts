/**
 * @fileoverview Theory Card Registry Snapshot Tests
 * 
 * Change 495: Snapshot test for theory card registry output.
 * Ensures theory card IDs/schemas stay stable.
 * 
 * @module @cardplay/src/tests/snapshots/theory-card-registry.snapshot.test
 */

import { describe, it, expect } from 'vitest';
import { getTheoryCardRegistry } from '../../ai/theory/theory-card-registry';

describe('Theory Card Registry Snapshots', () => {
  it('should match registered theory card IDs snapshot', () => {
    const registry = getTheoryCardRegistry();
    const cardIds = registry.getAllIds().slice().sort();

    expect(cardIds).toMatchSnapshot();
  });

  it('should match theory card metadata snapshot', () => {
    const registry = getTheoryCardRegistry();
    const cardIds = registry.getAllIds();

    const metadata = cardIds.map(cardId => {
      const card = registry.get(cardId);
      
      return {
        cardId,
        hasNamespace: cardId.includes(':'),
        namespace: cardId.includes(':') ? cardId.split(':')[0] : null,
        name: cardId.includes(':') ? cardId.split(':')[1] : cardId,
        hasCard: !!card,
        hasDisplayName: !!card?.displayName,
        hasDescription: !!card?.description,
        hasCategory: !!card?.category,
      };
    }).sort((a, b) => a.cardId.localeCompare(b.cardId));

    expect(metadata).toMatchSnapshot();
  });

  it('should validate all theory cards use namespaced IDs', () => {
    const registry = getTheoryCardRegistry();
    const cardIds = registry.getAllIds();

    const nonNamespacedIds = cardIds.filter(id => !id.includes(':'));

    // All theory cards should use namespace (typically 'theory:')
    expect(nonNamespacedIds).toEqual([]);
  });

  it('should match theory card categories snapshot', () => {
    const registry = getTheoryCardRegistry();
    const cardIds = registry.getAllIds();

    const categories = new Set<string>();
    
    for (const cardId of cardIds) {
      const card = registry.get(cardId);
      if (card?.category) {
        categories.add(card.category);
      }
    }

    const sortedCategories = Array.from(categories).sort();
    expect(sortedCategories).toMatchSnapshot();
  });

  it('should validate theory card namespaces', () => {
    const registry = getTheoryCardRegistry();
    const cardIds = registry.getAllIds();

    const namespaces = new Set<string>();
    
    for (const cardId of cardIds) {
      if (cardId.includes(':')) {
        const namespace = cardId.split(':')[0];
        namespaces.add(namespace);
      }
    }

    const sortedNamespaces = Array.from(namespaces).sort();
    
    // Should primarily be 'theory:', but may include extension namespaces
    expect(sortedNamespaces).toMatchSnapshot();
  });

  it('should match builtin theory cards snapshot', () => {
    const registry = getTheoryCardRegistry();
    const cardIds = registry.getAllIds();

    // Builtin theory cards use 'theory:' namespace
    const builtinCards = cardIds
      .filter(id => id.startsWith('theory:'))
      .sort();

    expect(builtinCards).toMatchSnapshot();
  });

  it('should validate theory card IDs are unique', () => {
    const registry = getTheoryCardRegistry();
    const cardIds = registry.getAllIds();
    const uniqueIds = [...new Set(cardIds)];

    // All card IDs should be unique
    expect(cardIds.length).toBe(uniqueIds.length);
  });

  it('should validate theory card ID format', () => {
    const registry = getTheoryCardRegistry();
    const cardIds = registry.getAllIds();

    const invalidIds = cardIds.filter(id => {
      // Should be namespace:name format
      if (!id.includes(':')) return true;
      
      const [namespace, name] = id.split(':');
      
      // Namespace and name should be lowercase with hyphens/underscores
      const validNamespace = /^[a-z0-9-_]+$/.test(namespace);
      const validName = /^[a-z0-9-_]+$/.test(name);
      
      return !validNamespace || !validName;
    });

    expect(invalidIds).toEqual([]);
  });

  it('should match theory card constraint types snapshot', () => {
    const registry = getTheoryCardRegistry();
    const cardIds = registry.getAllIds();

    const constraintTypes = new Set<string>();
    
    for (const cardId of cardIds) {
      const card = registry.get(cardId);
      // If card has constraint-related metadata, collect it
      if (card && 'constraintTypes' in card) {
        const types = (card as any).constraintTypes;
        if (Array.isArray(types)) {
          types.forEach(t => constraintTypes.add(t));
        }
      }
    }

    const sortedTypes = Array.from(constraintTypes).sort();
    expect(sortedTypes).toMatchSnapshot();
  });
});
