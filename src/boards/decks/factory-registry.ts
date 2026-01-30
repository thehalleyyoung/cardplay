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
import { normalizeDeckType } from '../../canon/legacy-aliases';

// ============================================================================
// FACTORY REGISTRY
// ============================================================================

/**
 * Registry for deck factories.
 *
 * B103-B105: Factory registration and retrieval.
 * Change 153: Map keyed by DeckType (canonical).
 */
export class DeckFactoryRegistry {
  private factories = new Map<DeckType, DeckFactory>();

  /**
   * Registers a deck factory.
   *
   * B104: Implement registerFactory with duplicate guards.
   * Canonicalizes deck type via normalizeDeckType.
   *
   * @param deckType Deck type (may be legacy or canonical)
   * @param factory Factory implementation
   */
  registerFactory(deckType: DeckType, factory: DeckFactory): void {
    const canonicalType = normalizeDeckType(deckType);
    
    if (this.factories.has(canonicalType)) {
      console.warn(`Deck factory for "${canonicalType}" already registered, replacing`);
    }

    if (normalizeDeckType(factory.deckType) !== canonicalType) {
      throw new Error(
        `Factory deckType "${factory.deckType}" does not match registration key "${deckType}" (canonical: "${canonicalType}")`
      );
    }

    this.factories.set(canonicalType, factory);
  }

  /**
   * Gets a deck factory.
   *
   * B105: Implement getFactory.
   * Canonicalizes deck type via normalizeDeckType.
   *
   * @param deckType Deck type (may be legacy or canonical)
   * @returns Factory or undefined
   */
  getFactory(deckType: DeckType): DeckFactory | undefined {
    const canonicalType = normalizeDeckType(deckType);
    return this.factories.get(canonicalType);
  }

  /**
   * Checks if a factory is registered.
   *
   * B105: Implement hasFactory.
   * Canonicalizes deck type via normalizeDeckType.
   *
   * @param deckType Deck type (may be legacy or canonical)
   * @returns true if factory is registered
   */
  hasFactory(deckType: DeckType): boolean {
    const canonicalType = normalizeDeckType(deckType);
    return this.factories.has(canonicalType);
  }

  /**
   * Gets all registered deck types.
   */
  getRegisteredTypes(): DeckType[] {
    return Array.from(this.factories.keys()) as DeckType[];
  }

  /**
   * Change 196: Report missing factory with actionable diagnostics.
   * Returns diagnostic message if factory is missing, null if present.
   */
  getMissingFactoryDiagnostic(deckType: DeckType): string | null {
    const canonicalType = normalizeDeckType(deckType);
    if (this.factories.has(canonicalType)) {
      return null;
    }
    
    const registered = this.getRegisteredTypes();
    const similar = registered.filter(t => 
      t.includes(deckType.split('-')[0] || '') || 
      deckType.includes(t.split('-')[0] || '')
    );
    
    let message = `Missing factory for deck type: "${canonicalType}"\n`;
    message += `  → Add factory file: src/boards/decks/factories/${canonicalType}-factory.ts\n`;
    message += `  → Register in: src/boards/decks/factories/index.ts\n`;
    
    if (similar.length > 0) {
      message += `  → Similar registered types: ${similar.join(', ')}\n`;
    }
    
    return message;
  }

  /**
   * Unregisters a deck factory (for testing).
   * Canonicalizes deck type via normalizeDeckType.
   */
  unregisterFactory(deckType: DeckType): void {
    const canonicalType = normalizeDeckType(deckType);
    this.factories.delete(canonicalType);
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
