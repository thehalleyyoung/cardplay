/**
 * @fileoverview Deck Factory Types
 *
 * Defines the DeckFactory interface and context.
 *
 * B101-B102: Define DeckFactory interface.
 * Changes 151-152: Use DeckType and DeckId branded types.
 *
 * @module @cardplay/boards/decks/factory-types
 */

import type { BoardDeck, DeckType, DeckId, PanelId } from '../types';
import type { ActiveContext } from '../context/types';

// ============================================================================
// DECK INSTANCE
// ============================================================================

/**
 * Runtime instance of a deck.
 * Decks are UI components that render into panels.
 * 
 * Changes 151-152: Use DeckId (instance) and DeckType branded types.
 * Change 187: Add panelId field.
 */
export interface DeckInstance {
  /** Deck ID (unique within board) - Change 152 */
  id: DeckId;

  /** Deck type - Change 151 */
  type: DeckType;

  /** Display title */
  title: string;
  
  /** Panel this deck belongs to - Change 187 */
  panelId?: PanelId;

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
 * Change 151: Use DeckType branded type.
 */
export interface DeckFactory {
  /**
   * Deck type this factory creates - Change 151
   */
  deckType: DeckType;

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
