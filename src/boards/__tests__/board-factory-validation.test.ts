/**
 * @fileoverview Board Factory Validation Tests
 * 
 * B134: Asserts each DeckType referenced by any builtin board has a registered factory.
 * 
 * @module @cardplay/boards/__tests__/board-factory-validation.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { DECK_TYPES } from '../../canon';
import { getDeckFactoryRegistry } from '../decks/factory-registry';
import { registerBuiltinDeckFactories } from '../decks/factories';

// Import all builtin boards
import { basicTrackerBoard } from '../builtins/basic-tracker-board';
import { trackerHarmonyBoard } from '../builtins/tracker-harmony-board';
import { trackerPhrasesBoard } from '../builtins/tracker-phrases-board';
import { basicSessionBoard } from '../builtins/basic-session-board';
import { basicSamplerBoard } from '../builtins/basic-sampler-board';
import { notationBoardManual } from '../builtins/notation-board-manual';
import { notationHarmonyBoard } from '../builtins/notation-harmony-board';
import { aiArrangerBoard } from '../builtins/ai-arranger-board';
import { aiCompositionBoard } from '../builtins/ai-composition-board';
import { generativeAmbientBoard } from '../builtins/generative-ambient-board';
import { composerBoard } from '../builtins/composer-board';
import { producerBoard } from '../builtins/producer-board';
import { livePerformanceBoard } from '../builtins/live-performance-board';
import { livePerformanceTrackerBoard } from '../builtins/live-performance-tracker-board';
import { modularRoutingBoard } from '../builtins/modular-routing-board';
import { sessionGeneratorsBoard } from '../builtins/session-generators-board';

import type { Board, DeckType } from '../types';

// ============================================================================
// BUILTIN BOARDS COLLECTION
// ============================================================================

const ALL_BUILTIN_BOARDS: Board[] = [
  basicTrackerBoard,
  trackerHarmonyBoard,
  trackerPhrasesBoard,
  basicSessionBoard,
  basicSamplerBoard,
  notationBoardManual,
  notationHarmonyBoard,
  aiArrangerBoard,
  aiCompositionBoard,
  generativeAmbientBoard,
  composerBoard,
  producerBoard,
  livePerformanceBoard,
  livePerformanceTrackerBoard,
  modularRoutingBoard,
  sessionGeneratorsBoard,
];

// ============================================================================
// FACTORY VALIDATION
// ============================================================================

describe('B134: Board Factory Validation', () => {
  // Register all builtin deck factories before tests
  beforeAll(() => {
    registerBuiltinDeckFactories();
  });

  /**
   * Collect all unique deck types from all builtin boards.
   */
  function getAllReferencedDeckTypes(): Set<DeckType> {
    const types = new Set<DeckType>();
    for (const board of ALL_BUILTIN_BOARDS) {
      for (const deck of board.decks) {
        types.add(deck.type as DeckType);
      }
    }
    return types;
  }

  it('collects deck types from all builtin boards', () => {
    const types = getAllReferencedDeckTypes();
    expect(types.size).toBeGreaterThan(0);
    console.log(`Found ${types.size} unique deck types across ${ALL_BUILTIN_BOARDS.length} boards`);
  });

  it('all referenced deck types are canonical', () => {
    const types = getAllReferencedDeckTypes();
    const canonicalTypes = new Set(DECK_TYPES);
    
    for (const type of types) {
      expect(
        canonicalTypes.has(type),
        `Deck type "${type}" is not in canonical DECK_TYPES`
      ).toBe(true);
    }
  });

  it('all referenced deck types have registered factories', () => {
    const types = getAllReferencedDeckTypes();
    const registry = getDeckFactoryRegistry();
    
    const missingFactories: string[] = [];
    
    for (const type of types) {
      const factory = registry.getFactory(type);
      if (!factory) {
        missingFactories.push(type);
      }
    }
    
    // Log missing factories for debugging
    if (missingFactories.length > 0) {
      console.warn('Missing factories for deck types:', missingFactories);
    }
    
    // This assertion may initially fail if factories aren't registered yet
    // Change expectation to warn rather than fail during development
    expect(
      missingFactories,
      `Missing factories for: ${missingFactories.join(', ')}`
    ).toHaveLength(0);
  });
});

// ============================================================================
// HELPER: assertBoardFactories
// ============================================================================

/**
 * B134: Asserts all deck types in a board have registered factories.
 * Use this in board-specific tests.
 */
export function assertBoardFactories(board: Board): void {
  const registry = getFactoryRegistry();
  
  for (const deck of board.decks) {
    const factory = registry.get(deck.type as DeckType);
    if (!factory) {
      throw new Error(
        `Board "${board.id}" references deck type "${deck.type}" which has no registered factory`
      );
    }
  }
}
