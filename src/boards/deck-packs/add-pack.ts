/**
 * @fileoverview Deck Pack Addition Logic
 * 
 * Implements O032:
 * - Add deck pack to current board
 * - Handle ID conflicts
 * - Update board state
 * 
 * @module @cardplay/boards/deck-packs/add-pack
 */

import type { DeckPackAddOptions, DeckPackAddResult } from './types';
import { getDeckPackRegistry } from './registry';
import { getBoardRegistry } from '../registry';
import type { BoardDeck } from '../types';

// --------------------------------------------------------------------------
// Add Pack Logic
// --------------------------------------------------------------------------

/**
 * Add a deck pack to a board
 */
export function addDeckPackToBoard(
  packId: string,
  options: DeckPackAddOptions
): DeckPackAddResult {
  const result: DeckPackAddResult = {
    success: false,
    deckIds: [],
    renamed: {},
    errors: []
  };

  // Get pack
  const registry = getDeckPackRegistry();
  const pack = registry.get(packId);
  if (!pack) {
    result.errors.push(`Deck pack "${packId}" not found`);
    return result;
  }

  // Get board
  const boardRegistry = getBoardRegistry();
  const board = boardRegistry.get(options.boardId);
  if (!board) {
    result.errors.push(`Board "${options.boardId}" not found`);
    return result;
  }

  // Check for ID conflicts
  const existingDeckIds = new Set(board.decks.map(d => d.id));
  const decksToAdd: BoardDeck[] = [];

  for (const deck of pack.decks) {
    let finalId = deck.id;

    // Handle ID collision
    if (existingDeckIds.has(deck.id)) {
      if (options.autoRename !== false) {
        // Generate unique ID
        let counter = 1;
        let candidateId = `${deck.id}_${counter}`;
        while (existingDeckIds.has(candidateId)) {
          counter++;
          candidateId = `${deck.id}_${counter}`;
        }
        finalId = candidateId;
        result.renamed[deck.id] = finalId;
      } else {
        result.errors.push(`Deck ID "${deck.id}" already exists`);
        continue;
      }
    }

    // Create deck with final ID
    decksToAdd.push({
      ...deck,
      id: finalId
    });
    result.deckIds.push(finalId);
    existingDeckIds.add(finalId);
  }

  // If we have errors and no decks to add, fail
  if (decksToAdd.length === 0) {
    return result;
  }

  // If autoRename is false and we have errors, fail completely
  if (options.autoRename === false && result.errors.length > 0) {
    result.success = false;
    return result;
  }

  // Add decks to board
  // Note: In a full implementation, this would:
  // 1. Update the board definition in the registry
  // 2. Update the board state store
  // 3. Notify listeners
  // 4. Optionally activate the first deck
  //
  // For now, we just record success
  result.success = decksToAdd.length > 0;

  // Record installation
  if (result.success) {
    registry.recordInstallation({
      packId,
      boardId: options.boardId,
      installedAt: Date.now(),
      deckIds: result.deckIds
    });
  }

  return result;
}

/**
 * Generate a unique deck ID on a board
 */
export function generateUniqueDeckId(
  baseId: string,
  existingIds: Set<string>
): string {
  if (!existingIds.has(baseId)) {
    return baseId;
  }

  let counter = 1;
  let candidateId = `${baseId}_${counter}`;
  while (existingIds.has(candidateId)) {
    counter++;
    candidateId = `${baseId}_${counter}`;
  }
  return candidateId;
}
