/**
 * @fileoverview Board Migration Plan
 *
 * Defines migration behavior when switching boards (deck mappings, view migrations).
 *
 * B085-B089: Define board migration planning logic.
 *
 * @module @cardplay/boards/switching/migration-plan
 */

import type { Board, DeckType, ViewType } from '../types';

// ============================================================================
// MIGRATION PLAN
// ============================================================================

/**
 * Plan for migrating state when switching boards.
 */
export interface BoardMigrationPlan {
  /**
   * Deck-to-deck mapping rules.
   * Maps source deck type to target deck type.
   */
  deckMappings: Map<DeckType, DeckType>;

  /**
   * View type migration.
   * Maps source view type to target view type.
   */
  viewMapping: Map<ViewType, ViewType>;

  /**
   * Decks to close (not present in target board).
   */
  decksToClose: Set<DeckType>;

  /**
   * Decks to open (new in target board).
   */
  decksToOpen: Set<DeckType>;
}

// ============================================================================
// MIGRATION HEURISTICS
// ============================================================================

/**
 * Creates a migration plan from source to target board.
 *
 * B087-B088: Default migration heuristics.
 *
 * @param sourceBoard Source board (or null for new project)
 * @param targetBoard Target board
 * @returns Migration plan
 */
export function createMigrationPlan(
  sourceBoard: Board | null,
  targetBoard: Board
): BoardMigrationPlan {
  const deckMappings = new Map<DeckType, DeckType>();
  const viewMapping = new Map<ViewType, ViewType>();
  const decksToClose = new Set<DeckType>();
  const decksToOpen = new Set<DeckType>();

  // If no source board, just open target decks
  if (!sourceBoard) {
    targetBoard.decks.forEach(deck => {
      decksToOpen.add(deck.type);
    });

    return {
      deckMappings,
      viewMapping,
      decksToClose,
      decksToOpen,
    };
  }

  // B087: Keep matching DeckType decks open (identity mapping)
  const sourceDeckTypes = new Set(sourceBoard.decks.map(d => d.type));
  const targetDeckTypes = new Set(targetBoard.decks.map(d => d.type));

  // Decks in both: keep open (identity mapping)
  sourceDeckTypes.forEach(deckType => {
    if (targetDeckTypes.has(deckType)) {
      deckMappings.set(deckType, deckType);
    } else {
      // B088: Target lacks this deck type, close it
      decksToClose.add(deckType);
    }
  });

  // Decks only in target: open them
  targetDeckTypes.forEach(deckType => {
    if (!sourceDeckTypes.has(deckType)) {
      decksToOpen.add(deckType);
    }
  });

  // B089: Map primary view type
  if (sourceBoard.primaryView && targetBoard.primaryView) {
    // If target has same view type, keep it
    if (targetBoard.primaryView === sourceBoard.primaryView) {
      viewMapping.set(sourceBoard.primaryView, targetBoard.primaryView);
    } else {
      // Otherwise, switch to target's primary view
      viewMapping.set(sourceBoard.primaryView, targetBoard.primaryView);
    }
  }

  return {
    deckMappings,
    viewMapping,
    decksToClose,
    decksToOpen,
  };
}

/**
 * Checks if a deck type should be preserved when switching boards.
 */
export function shouldPreserveDeck(
  deckType: DeckType,
  plan: BoardMigrationPlan
): boolean {
  // Preserve if mapped (kept open)
  return plan.deckMappings.has(deckType);
}

/**
 * Checks if a view type should be switched when changing boards.
 */
export function shouldSwitchView(
  currentView: ViewType,
  plan: BoardMigrationPlan
): ViewType | null {
  // Return mapped view, or null if no mapping (keep current)
  return plan.viewMapping.get(currentView) || null;
}
