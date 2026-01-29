/**
 * @fileoverview Why Not Allowed
 * 
 * Provides human-readable explanations for why a card is not allowed.
 * 
 * @module @cardplay/boards/gating/why-not
 */

import type { CardMeta } from '../../cards/card';
import type { Board } from '../types';
import { classifyCard, getAllowedKindsForControlLevel } from './card-kinds';
import { isCardAllowed } from './is-card-allowed';

// ============================================================================
// DENIAL REASONS
// ============================================================================

/**
 * Returns a human-readable reason why a card is not allowed.
 * Returns null if the card is allowed.
 */
export function whyNotAllowed(
  board: Board,
  meta: CardMeta,
  deckId?: string
): string | null {
  // If card is allowed, no reason needed
  if (isCardAllowed(board, meta, deckId)) {
    return null;
  }
  
  const cardKinds = classifyCard(meta);
  const controlLevel = board.controlLevel; // TODO: Check deck override
  const allowedKinds = getAllowedKindsForControlLevel(controlLevel);
  
  // Check if card kind is fundamentally disallowed
  const hasAllowedKind = cardKinds.some(kind => allowedKinds.includes(kind));
  if (!hasAllowedKind) {
    const kindLabel = cardKinds[0];
    return `${kindLabel} cards are not available in ${controlLevel} boards. Switch to a board with higher AI involvement to use this card.`;
  }
  
  // Check tool-specific reasons
  const tools = board.compositionTools;
  
  // Phrase database
  if (hasPhraseTag(meta)) {
    if (!tools.phraseDatabase.enabled) {
      return 'Phrase library is disabled on this board.';
    }
    if (tools.phraseDatabase.mode === 'hidden') {
      return 'Phrase library is hidden on this board. Switch to "Tracker + Phrases" or similar to access phrases.';
    }
    if (tools.phraseDatabase.mode === 'browse-only') {
      return 'Phrase drag/drop is disabled. This board only allows browsing phrases.';
    }
  }
  
  // Generators
  if (cardKinds.includes('generative')) {
    if (!tools.phraseGenerators.enabled) {
      return 'Generators are disabled on this board.';
    }
    if (tools.phraseGenerators.mode === 'hidden') {
      return 'Generators are hidden on this board. Switch to "Session + Generators" or "AI Arranger" to use generators.';
    }
  }
  
  // Harmony hints
  if (hasHarmonyTag(meta)) {
    if (!tools.harmonyExplorer.enabled) {
      return 'Harmony tools are disabled on this board.';
    }
    if (tools.harmonyExplorer.mode === 'hidden') {
      return 'Harmony tools are hidden on this board. Switch to "Tracker + Harmony" or "Notation + Harmony" to use harmony hints.';
    }
  }
  
  // AI composer
  if (cardKinds.includes('collaborative') || hasAITag(meta)) {
    if (!tools.aiComposer.enabled) {
      return 'AI composition tools are disabled on this board.';
    }
    if (tools.aiComposer.mode === 'hidden') {
      return 'AI composition is hidden on this board. Switch to "AI Composition" or "Composer" board to use AI features.';
    }
  }
  
  // Generic fallback
  return 'This card is not available on the current board due to control level or tool restrictions.';
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

/**
 * Checks if a card has AI-related tags.
 */
function hasAITag(meta: CardMeta): boolean {
  const aiTags = ['ai', 'copilot', 'composer', 'assistant'];
  return meta.tags?.some(tag => aiTags.includes(tag)) ?? false;
}
