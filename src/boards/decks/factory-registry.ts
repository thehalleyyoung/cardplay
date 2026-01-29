/**
 * @fileoverview Deck Factory Registry
 *
 * Registry for deck factories (keyed by DeckType).
 *
 * B103-B106: Implement factory registry.
 *
 * @module @cardplay/boards/decks/factory-registry
 */

import type { DeckFactory } from './factory-types';
import type { DeckType, Board } from '../types';

// ============================================================================
// FACTORY REGISTRY
// ============================================================================

/**
 * Registry for deck factories.
 *
 * B103-B105: Factory registration and retrieval.
 */
export class DeckFactoryRegistry {
  private factories = new Map<string, DeckFactory>();

  /**
   * Registers a deck factory.
   *
   * B104: Implement registerFactory with duplicate guards.
   *
   * @param deckType Deck type
   * @param factory Factory implementation
   */
  registerFactory(deckType: DeckType, factory: DeckFactory): void {
    if (this.factories.has(deckType)) {
      console.warn(`Deck factory for "${deckType}" already registered, replacing`);
    }

    if (factory.deckType !== deckType) {
      throw new Error(
        `Factory deckType "${factory.deckType}" does not match registration key "${deckType}"`
      );
    }

    this.factories.set(deckType, factory);
  }

  /**
   * Gets a deck factory.
   *
   * B105: Implement getFactory.
   *
   * @param deckType Deck type
   * @returns Factory or undefined
   */
  getFactory(deckType: DeckType): DeckFactory | undefined {
    return this.factories.get(deckType);
  }

  /**
   * Checks if a factory is registered.
   *
   * B105: Implement hasFactory.
   *
   * @param deckType Deck type
   * @returns true if factory is registered
   */
  hasFactory(deckType: DeckType): boolean {
    return this.factories.has(deckType);
  }

  /**
   * Gets all registered deck types.
   */
  getRegisteredTypes(): DeckType[] {
    return Array.from(this.factories.keys()) as DeckType[];
  }

  /**
   * Unregisters a deck factory (for testing).
   */
  unregisterFactory(deckType: DeckType): void {
    this.factories.delete(deckType);
  }

  /**
   * Clears all factories (for testing).
   */
  clear(): void {
    this.factories.clear();
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validates that all deck types in a board have registered factories.
 *
 * B106: Add validateBoardFactories.
 *
 * @param board Board definition
 * @param registry Factory registry
 * @returns Array of missing deck types (empty if all present)
 */
export function validateBoardFactories(
  board: Board,
  registry: DeckFactoryRegistry
): DeckType[] {
  const missingTypes: DeckType[] = [];

  for (const deck of board.decks) {
    if (!registry.hasFactory(deck.type)) {
      missingTypes.push(deck.type);
    }
  }

  return missingTypes;
}

/**
 * Throws an error if any deck types in a board are missing factories.
 */
export function assertBoardFactories(
  board: Board,
  registry: DeckFactoryRegistry
): void {
  const missing = validateBoardFactories(board, registry);

  if (missing.length > 0) {
    throw new Error(
      `Board "${board.id}" requires deck factories for: ${missing.join(', ')}`
    );
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let factoryRegistryInstance: DeckFactoryRegistry | null = null;

/**
 * Gets the singleton DeckFactoryRegistry instance.
 */
export function getDeckFactoryRegistry(): DeckFactoryRegistry {
  if (!factoryRegistryInstance) {
    factoryRegistryInstance = new DeckFactoryRegistry();
  }
  return factoryRegistryInstance;
}

/**
 * Resets the deck factory registry (for testing).
 */
export function resetDeckFactoryRegistry(): void {
  factoryRegistryInstance = null;
}
