/**
 * @fileoverview Card Allowance Query System.
 * 
 * Provides APIs to query and filter the card registry based on
 * board gating rules.
 * 
 * @module @cardplay/boards/gating/get-allowed-cards
 */

import type { Board } from '../types';
import type { CardRegistryEntry } from '../../cards/registry';
import type { CardMeta } from '../../cards/card';
import { getCardRegistry } from '../../cards/registry';
import { isCardAllowed } from './is-card-allowed';

/**
 * Gets all card registry entries filtered by board gating rules.
 * 
 * @param board - The board to filter cards for
 * @returns Array of allowed card entries
 * 
 * @example
 * ```ts
 * const board = getBoardRegistry().get('basic-tracker');
 * const allowedCards = getAllowedCardEntries(board);
 * // Only manual cards are included
 * ```
 */
export function getAllowedCardEntries(board: Board): CardRegistryEntry[] {
  const registry = getCardRegistry();
  // Use find with empty query to get all entries
  const allEntries = registry.find({});
  
  return allEntries.filter(entry => 
    isCardAllowed(board, entry.card.meta)
  );
}

/**
 * Gets all card registry entries, optionally including disabled ones.
 * 
 * @param board - The board to filter cards for
 * @param includeDisabled - If true, returns all cards regardless of gating
 * @returns Array of card entries
 * 
 * @example
 * ```ts
 * const board = getBoardRegistry().get('basic-tracker');
 * const allCards = getAllCardEntries(board, true);
 * // All cards returned, regardless of board rules
 * ```
 */
export function getAllCardEntries(
  board: Board,
  includeDisabled: boolean = false
): CardRegistryEntry[] {
  const registry = getCardRegistry();
  const allEntries = registry.find({});
  
  if (includeDisabled) {
    return allEntries.slice(); // Return copy
  }
  
  return allEntries.filter(entry =>
    isCardAllowed(board, entry.card.meta)
  );
}

/**
 * Gets card metadata for all allowed cards.
 * 
 * @param board - The board to filter cards for
 * @returns Array of allowed card metadata
 * 
 * @example
 * ```ts
 * const board = getBoardRegistry().get('notation-board');
 * const allowedMeta = getAllowedCardMeta(board);
 * // Only manual instrument/effect metadata
 * ```
 */
export function getAllowedCardMeta(board: Board): CardMeta[] {
  return getAllowedCardEntries(board).map(entry => entry.card.meta);
}

/**
 * Gets card IDs for all allowed cards.
 * 
 * @param board - The board to filter cards for
 * @returns Array of allowed card IDs
 * 
 * @example
 * ```ts
 * const board = getBoardRegistry().get('session-generators');
 * const allowedIds = getAllowedCardIds(board);
 * // Manual + generator card IDs
 * ```
 */
export function getAllowedCardIds(board: Board): string[] {
  return getAllowedCardMeta(board).map(meta => meta.id);
}

/**
 * Checks if a specific card ID is allowed on the board.
 * 
 * @param board - The board to check
 * @param cardId - The card ID to check
 * @returns True if the card is allowed
 * 
 * @example
 * ```ts
 * const board = getBoardRegistry().get('basic-tracker');
 * const allowed = isCardIdAllowed(board, 'sampler-instrument');
 * // true (manual instrument)
 * 
 * const blocked = isCardIdAllowed(board, 'melody-generator');
 * // false (generative)
 * ```
 */
export function isCardIdAllowed(board: Board, cardId: string): boolean {
  const registry = getCardRegistry();
  const card = registry.get(cardId);
  
  if (!card) {
    return false;
  }
  
  return isCardAllowed(board, card.meta);
}

/**
 * Groups allowed cards by category.
 * 
 * @param board - The board to filter cards for
 * @returns Map of category to card entries
 * 
 * @example
 * ```ts
 * const board = getBoardRegistry().get('producer-board');
 * const grouped = groupAllowedCardsByCategory(board);
 * 
 * const effects = grouped.get('effects');
 * // All allowed effect cards
 * ```
 */
export function groupAllowedCardsByCategory(
  board: Board
): Map<string, CardRegistryEntry[]> {
  const allowedEntries = getAllowedCardEntries(board);
  const grouped = new Map<string, CardRegistryEntry[]>();
  
  for (const entry of allowedEntries) {
    const category = entry.card.meta.category;
    const existing = grouped.get(category) ?? [];
    grouped.set(category, [...existing, entry]);
  }
  
  return grouped;
}

/**
 * Searches allowed cards by name, description, or tags.
 * 
 * @param board - The board to filter cards for
 * @param query - Search query string
 * @returns Array of matching card entries
 * 
 * @example
 * ```ts
 * const board = getBoardRegistry().get('notation-board');
 * const results = searchAllowedCards(board, 'piano');
 * // Only manual piano instruments (no generators)
 * ```
 */
export function searchAllowedCards(
  board: Board,
  query: string
): CardRegistryEntry[] {
  const allowedEntries = getAllowedCardEntries(board);
  const lowerQuery = query.toLowerCase();
  
  return allowedEntries.filter(entry => {
    const { name, description, tags } = entry.card.meta;
    
    if (name.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    if (description?.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    if (tags?.some(tag => tag.toLowerCase().includes(lowerQuery))) {
      return true;
    }
    
    return false;
  });
}
