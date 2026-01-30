/**
 * @fileoverview Tool Visibility Logic
 * 
 * Computes which deck types should be visible based on board tool configuration.
 * 
 * @module @cardplay/boards/gating/tool-visibility
 */

import type { Board, DeckType } from '../types';

// ============================================================================
// VISIBLE DECK TYPES
// ============================================================================

/**
 * Computes which deck types should be visible for a board.
 * Deck visibility is determined by tool modes and control level.
 */
export function computeVisibleDeckTypes(board: Board): readonly DeckType[] {
  const visible: DeckType[] = [];
  
  // Core decks are always visible (editors, properties, transport)
  const coreDecks: DeckType[] = [
    'pattern-deck',
    'notation-deck',
    'piano-roll-deck',
    'session-deck',
    'arrangement-deck',
    'properties-deck',
  ];
  
  visible.push(...coreDecks);
  
  // Manual decks are always visible (instruments, effects, mixer, routing)
  const manualDecks: DeckType[] = [
    'instruments-deck',
    'effects-deck',
    'mixer-deck',
    'routing-deck',
    'automation-deck',
    'samples-deck',
    'sample-manager-deck',
    'modulation-matrix-deck',
  ];
  
  visible.push(...manualDecks);
  
  // Tool-dependent decks
  const tools = board.compositionTools;
  
  // Phrase database deck
  if (tools.phraseDatabase.enabled && tools.phraseDatabase.mode !== 'hidden') {
    visible.push('phrases-deck');
  }
  
  // Harmony explorer deck
  if (tools.harmonyExplorer.enabled && tools.harmonyExplorer.mode !== 'hidden') {
    visible.push('harmony-deck');
  }
  
  // Generator deck
  if (tools.phraseGenerators.enabled && tools.phraseGenerators.mode !== 'hidden') {
    visible.push('generators-deck');
  }
  
  // Arranger deck (part of arrangerCard tool)
  if (tools.arrangerCard.enabled && tools.arrangerCard.mode !== 'hidden') {
    visible.push('arranger-deck');
  }
  
  // AI composer deck
  if (tools.aiComposer.enabled && tools.aiComposer.mode !== 'hidden') {
    // AI composer is integrated via command palette or inline
    // May add ai-advisor-deck for Prolog integration
    visible.push('ai-advisor-deck');
  }
  
  // Remove duplicates and return
  return [...new Set(visible)];
}

/**
 * Checks if a specific deck type should be visible on a board.
 */
export function isDeckTypeVisible(board: Board, deckType: DeckType): boolean {
  const visible = computeVisibleDeckTypes(board);
  return visible.includes(deckType);
}

/**
 * Filters a board's deck definitions to only visible ones.
 */
export function filterVisibleDecks(board: Board): typeof board.decks {
  const visibleTypes = new Set(computeVisibleDeckTypes(board));
  return board.decks.filter(deck => visibleTypes.has(deck.type));
}
