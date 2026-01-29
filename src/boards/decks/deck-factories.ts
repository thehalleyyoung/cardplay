/**
 * @fileoverview Deck Factories
 *
 * Registers factories for each DeckType.
 *
 * E011-E013: Create deck instances using factories + gating visibility.
 *
 * @module @cardplay/boards/decks/deck-factories
 */

import type { Board, BoardDeck, DeckType } from '../types';
import type { ActiveContext } from '../context/types';
import type { DeckFactory, DeckFactoryContext, DeckInstance } from './factory-types';
import { getDeckFactoryRegistry } from './factory-registry';

// ============================================================================
// CREATE DECK INSTANCES
// ============================================================================

/**
 * Creates deck instances for a board.
 *
 * E012: Use deck factories + gating visibility.
 */
export function createDeckInstances(
  board: Board,
  activeContext: ActiveContext
): DeckInstance[] {
  const registry = getDeckFactoryRegistry();
  const instances: DeckInstance[] = [];

  for (const deckDef of board.decks) {
    const factory = registry.getFactory(deckDef.type);
    if (!factory) {
      console.warn(`No factory registered for deck type: ${deckDef.type}`);
      continue;
    }

    // Create context
    const ctx: DeckFactoryContext = {
      activeContext,
      boardId: board.id,
      deckDef,
    };

    // Validate deck definition
    if (factory.validate) {
      const error = factory.validate(deckDef);
      if (error) {
        console.warn(`Invalid deck definition for ${deckDef.id}: ${error}`);
        continue;
      }
    }

    // Create instance
    try {
      const instance = factory.create(deckDef, ctx);
      instances.push(instance);
    } catch (err) {
      console.error(`Failed to create deck ${deckDef.id}:`, err);
    }
  }

  return instances;
}

/**
 * Validates that all deck types in a board have registered factories.
 *
 * E013: Validate board factories at runtime.
 */
export function validateBoardFactories(board: Board): string[] {
  const registry = getDeckFactoryRegistry();
  const errors: string[] = [];

  for (const deckDef of board.decks) {
    if (!registry.hasFactory(deckDef.type)) {
      errors.push(`Missing factory for deck type: ${deckDef.type} (deck: ${deckDef.id})`);
    }
  }

  return errors;
}

// ============================================================================
// STUB FACTORY
// ============================================================================

/**
 * Creates a stub factory for testing.
 */
export function createStubFactory(deckType: DeckType): DeckFactory {
  return {
    deckType,
    create(deckDef: BoardDeck, _ctx: DeckFactoryContext): DeckInstance {
      return {
        id: deckDef.id,
        type: deckDef.type,
        title: deckType,
        render: () => {
          const div = document.createElement('div');
          div.className = 'deck-stub';
          div.textContent = `Stub deck: ${deckType}`;
          return div;
        },
      };
    },
  };
}

/**
 * Registers stub factories for all known deck types.
 * Used for testing and development.
 */
export function registerStubFactories(): void {
  const registry = getDeckFactoryRegistry();
  const deckTypes: DeckType[] = [
    'pattern-deck',
    'piano-roll-deck',
    'notation-deck',
    'arrangement-deck',
    'session-deck',
    'instruments-deck',
    'effects-deck',
    'samples-deck',
    'phrases-deck',
    'harmony-deck',
    'generators-deck',
    'mixer-deck',
    'routing-deck',
    'automation-deck',
    'properties-deck',
    'ai-advisor-deck',
  ];

  for (const deckType of deckTypes) {
    if (!registry.hasFactory(deckType)) {
      registry.registerFactory(deckType, createStubFactory(deckType));
    }
  }
}
