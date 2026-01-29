/**
 * @fileoverview Card Allowance Logic
 * 
 * Determines whether a card is allowed on a board based on control level
 * and tool configuration.
 * 
 * @module @cardplay/boards/gating/is-card-allowed
 */

import type { CardMeta } from '../../cards/card';
import type { Board, ControlLevel } from '../types';
import { classifyCard, isCardKindAllowed } from './card-kinds';

// ============================================================================
// CARD ALLOWANCE
// ============================================================================

/**
 * Checks if a card is allowed on a board.
 * 
 * Considers:
 * - Board control level
 * - Tool configuration (which tools are enabled/hidden)
 * - Deck-level control level overrides (if applicable)
 */
export function isCardAllowed(
  board: Board,
  meta: CardMeta,
  deckId?: string
): boolean {
  // Determine effective control level
  const controlLevel = getEffectiveControlLevel(board, deckId);
  
  // Check if card kind is allowed at this control level
  const allowed = isCardKindAllowed(meta, controlLevel);
  if (!allowed) return false;
  
  // Additional tool-specific checks
  const cardKinds = classifyCard(meta);
  
  // Phrase cards require phraseDatabase tool
  if (cardKinds.includes('assisted') && hasPhraseTag(meta)) {
    const tool = board.compositionTools.phraseDatabase;
    if (!tool.enabled || tool.mode === 'hidden') {
      return false;
    }
  }
  
  // Generator cards require phraseGenerators tool
  if (cardKinds.includes('generative')) {
    const tool = board.compositionTools.phraseGenerators;
    if (!tool.enabled || tool.mode === 'hidden') {
      return false;
    }
  }
  
  // Harmony hint cards require harmonyExplorer tool
  if (cardKinds.includes('hint') && hasHarmonyTag(meta)) {
    const tool = board.compositionTools.harmonyExplorer;
    if (!tool.enabled || tool.mode === 'hidden') {
      return false;
    }
  }
  
  return true;
}

/**
 * Gets the effective control level for a card.
 * Checks for deck-level overrides first, then falls back to board level.
 */
function getEffectiveControlLevel(
  board: Board,
  deckId?: string
): ControlLevel {
  if (deckId) {
    const deck = board.decks.find(d => d.id === deckId);
    if (deck?.controlLevelOverride) {
      return deck.controlLevelOverride;
    }
  }
  return board.controlLevel;
}

/**
 * Checks if a card has phrase-related tags.
 */
function hasPhraseTag(meta: CardMeta): boolean {
  const phraseTags = ['phrase', 'template', 'library'];
  return meta.tags?.some(tag => phraseTags.includes(tag)) ?? false;
}

/**
 * Checks if a card has harmony-related tags.
 */
function hasHarmonyTag(meta: CardMeta): boolean {
  const harmonyTags = ['harmony', 'scale', 'chord', 'key'];
  return meta.tags?.some(tag => harmonyTags.includes(tag)) ?? false;
}

// ============================================================================
// BATCH FILTERING
// ============================================================================

/**
 * Filters a list of card metas to only allowed ones.
 */
export function filterAllowedCards(
  board: Board,
  cards: readonly CardMeta[],
  deckId?: string
): readonly CardMeta[] {
  return cards.filter(meta => isCardAllowed(board, meta, deckId));
}

/**
 * Partitions cards into allowed and disallowed.
 */
export function partitionCardsByAllowance(
  board: Board,
  cards: readonly CardMeta[],
  deckId?: string
): {
  readonly allowed: readonly CardMeta[];
  readonly disallowed: readonly CardMeta[];
} {
  const allowed: CardMeta[] = [];
  const disallowed: CardMeta[] = [];
  
  for (const meta of cards) {
    if (isCardAllowed(board, meta, deckId)) {
      allowed.push(meta);
    } else {
      disallowed.push(meta);
    }
  }
  
  return { allowed, disallowed };
}
