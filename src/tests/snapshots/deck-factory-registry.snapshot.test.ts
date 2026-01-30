/**
 * @fileoverview Deck Factory Registry Snapshot Tests
 * 
 * Change 492: Snapshot test for deck factory registry output.
 * Ensures factory registration changes are intentional.
 * 
 * @module @cardplay/src/tests/snapshots/deck-factory-registry.snapshot.test
 */

import { describe, it, expect } from 'vitest';
import { getDeckFactoryRegistry } from '../../boards/decks/factory-registry';

describe('Deck Factory Registry Snapshots', () => {
  it('should match registered deck types snapshot', () => {
    const registry = getDeckFactoryRegistry();
    const deckTypes = registry.getRegisteredDeckTypes().sort();

    expect(deckTypes).toMatchSnapshot();
  });

  it('should match factory metadata snapshot', () => {
    const registry = getDeckFactoryRegistry();
    const deckTypes = registry.getRegisteredDeckTypes();

    const metadata = deckTypes.map(deckType => {
      const factory = registry.getFactory(deckType);
      
      return {
        deckType,
        hasFactory: !!factory,
        supportsSlotGrid: factory?.supportsSlotGrid ?? false,
        defaultTitle: factory?.getDefaultTitle?.() ?? deckType,
        requiresPanelId: factory?.requiresPanelId ?? true,
      };
    }).sort((a, b) => a.deckType.localeCompare(b.deckType));

    expect(metadata).toMatchSnapshot();
  });

  it('should validate no legacy deck type registrations', () => {
    const registry = getDeckFactoryRegistry();
    const deckTypes = registry.getRegisteredDeckTypes();

    const legacyPatterns = [
      /^pattern-editor$/,
      /^piano-roll$/,
      /^notation-score$/,
      /^timeline$/,
      /^session$/,
      /^arrangement$/,
      /^mixer$/,
    ];

    const legacyTypes = deckTypes.filter(dt =>
      legacyPatterns.some(pattern => pattern.test(dt))
    );

    expect(legacyTypes).toEqual([]);
  });

  it('should validate all canonical deck types have factories', () => {
    const registry = getDeckFactoryRegistry();
    const deckTypes = registry.getRegisteredDeckTypes();

    // Canonical deck types that must have factories
    const requiredDeckTypes = [
      'pattern-deck',
      'piano-roll-deck',
      'notation-deck',
      'session-deck',
      'arrangement-deck',
      'mixer-deck',
      'transport-deck',
    ];

    const missingFactories = requiredDeckTypes.filter(dt => !deckTypes.includes(dt));

    expect(missingFactories).toEqual([]);
  });

  it('should match factory capabilities snapshot', () => {
    const registry = getDeckFactoryRegistry();
    const deckTypes = registry.getRegisteredDeckTypes();

    const capabilities = deckTypes.map(deckType => {
      const factory = registry.getFactory(deckType);
      
      return {
        deckType,
        canCreateInstances: !!factory?.createInstance,
        hasDefaultTitle: !!factory?.getDefaultTitle,
        hasDefaultIcon: !!factory?.getDefaultIcon,
        supportsSlotGrid: factory?.supportsSlotGrid ?? false,
        supportsTabbing: factory?.supportsTabbing ?? true,
        supportsFloating: factory?.supportsFloating ?? false,
      };
    }).sort((a, b) => a.deckType.localeCompare(b.deckType));

    expect(capabilities).toMatchSnapshot();
  });
});
