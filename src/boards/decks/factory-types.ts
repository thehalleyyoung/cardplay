/**
 * @fileoverview Deck Factory Types
 *
 * Defines the DeckFactory interface and context.
 *
 * B101-B102: Define DeckFactory interface.
 *
 * @module @cardplay/boards/decks/factory-types
 */

import type { BoardDeck } from '../types';
import type { ActiveContext } from '../context/types';

// ============================================================================
// DECK INSTANCE
// ============================================================================

/**
 * Runtime instance of a deck.
 * Decks are UI components that render into panels.
 */
export interface DeckInstance {
  /** Deck ID (unique within board) */
  id: string;

  /** Deck type */
  type: string;

  /** Display title */
  title: string;

  /** Render function (returns DOM element or React element) */
  render: () => HTMLElement | null;

  /** Mount function (called when deck is added to DOM) */
  mount?: (container: HTMLElement) => void;

  /** Unmount function (called when deck is removed from DOM) */
  unmount?: () => void;

  /** Update function (called when context changes) */
  update?: (context: ActiveContext) => void;

  /** Cleanup function (called when deck instance is destroyed) */
  destroy?: () => void;
}

// ============================================================================
// DECK FACTORY CONTEXT
// ============================================================================

/**
 * Context passed to deck factories during creation.
 */
export interface DeckFactoryContext {
  /** Active context (stream, clip, track, etc.) */
  activeContext: ActiveContext;

  /** Board ID (for accessing per-board settings) */
  boardId: string;

  /** Deck definition from board */
  deckDef: BoardDeck;
}

// ============================================================================
// DECK FACTORY
// ============================================================================

/**
 * Factory for creating deck instances.
 *
 * B102: Define create(deckDef, ctx) returning DeckInstance.
 */
export interface DeckFactory {
  /**
   * Deck type this factory creates.
   */
  deckType: string;

  /**
   * Creates a deck instance.
   *
   * @param deckDef Deck definition from board
   * @param ctx Factory context
   * @returns Deck instance
   */
  create(deckDef: BoardDeck, ctx: DeckFactoryContext): DeckInstance;

  /**
   * Optional: Validates deck definition.
   * Returns error message if invalid, or null if valid.
   */
  validate?(deckDef: BoardDeck): string | null;
}
