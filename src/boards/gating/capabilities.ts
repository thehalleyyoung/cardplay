/**
 * @fileoverview Board Capabilities Computation.
 * 
 * Computes all runtime capabilities for a board including:
 * - Visible decks
 * - Allowed cards
 * - Allowed actions
 * - Cross-card control permissions
 * 
 * @module @cardplay/boards/gating/capabilities
 */

import type { Board, DeckType } from '../types';
import { computeVisibleDeckTypes } from './tool-visibility';
import { getAllowedCardIds } from './get-allowed-cards';
import { type BoardCardKind } from './card-kinds';

/**
 * Board capability flags.
 */
export interface BoardCapabilities {
  /** Deck types that should be visible */
  visibleDeckTypes: readonly DeckType[];
  
  /** Card IDs that are allowed */
  allowedCardIds: string[];
  
  /** Card kinds that are allowed */
  allowedCardKinds: BoardCardKind[];
  
  /** Whether phrases can be dragged */
  canDragPhrases: boolean;
  
  /** Whether auto-suggestions are enabled */
  canAutoSuggest: boolean;
  
  /** Whether AI can be invoked */
  canInvokeAI: boolean;
  
  /** Whether cards can control other cards */
  canControlOtherCards: boolean;
  
  /** Whether harmony hints are shown */
  canShowHarmonyHints: boolean;
  
  /** Whether generation is continuous */
  canGenerateContinuously: boolean;
  
  /** Whether user can freeze generated content */
  canFreezeGenerated: boolean;
  
  /** Whether user can regenerate content */
  canRegenerateContent: boolean;
}

/**
 * Computes all capabilities for a board.
 * 
 * This is the single entry point for determining what actions
 * and features are available on a given board.
 * 
 * @param board - The board to compute capabilities for
 * @returns Complete set of board capabilities
 * 
 * @example
 * ```ts
 * const board = getBoardRegistry().get('basic-tracker');
 * const caps = computeBoardCapabilities(board);
 * 
 * if (caps.canDragPhrases) {
 *   enablePhraseDrag();
 * }
 * 
 * if (caps.canInvokeAI) {
 *   showAIComposerButton();
 * }
 * ```
 */
export function computeBoardCapabilities(board: Board): BoardCapabilities {
  const { controlLevel, compositionTools } = board;
  
  // Visible decks based on tool configuration
  const visibleDeckTypes = computeVisibleDeckTypes(board);
  
  // Allowed cards based on control level + tool config
  const allowedCardIds = getAllowedCardIds(board);
  
  // Allowed card kinds (manual, hint, assisted, generative)
  const allowedCardKinds = computeAllowedCardKinds(board);
  
  // Phrase capabilities
  const phraseMode = compositionTools.phraseDatabase?.mode ?? 'hidden';
  const canDragPhrases = phraseMode === 'drag-drop';
  
  // Harmony capabilities
  const harmonyMode = compositionTools.harmonyExplorer?.mode ?? 'hidden';
  const canShowHarmonyHints = harmonyMode !== 'hidden';
  const canAutoSuggest = harmonyMode === 'suggest';
  
  // Generator capabilities
  const generatorMode = compositionTools.phraseGenerators?.mode ?? 'hidden';
  const canRegenerateContent = generatorMode === 'on-demand' || generatorMode === 'continuous';
  const canGenerateContinuously = generatorMode === 'continuous';
  
  // AI composer capabilities
  const aiMode = compositionTools.aiComposer?.mode ?? 'hidden';
  const canInvokeAI = aiMode !== 'hidden';
  
  // Control capabilities based on control level
  const canControlOtherCards = computeCanControlOtherCards(controlLevel);
  const canFreezeGenerated = computeCanFreezeGenerated(controlLevel);
  
  return {
    visibleDeckTypes,
    allowedCardIds,
    allowedCardKinds,
    canDragPhrases,
    canAutoSuggest,
    canInvokeAI,
    canControlOtherCards,
    canShowHarmonyHints,
    canGenerateContinuously,
    canFreezeGenerated,
    canRegenerateContent,
  };
}

/**
 * Computes which card kinds are allowed based on control level and tools.
 */
function computeAllowedCardKinds(board: Board): BoardCardKind[] {
  const { controlLevel, compositionTools } = board;
  
  const kinds: BoardCardKind[] = [];
  
  // Manual is always allowed
  kinds.push('manual');
  
  // Hints allowed in manual-with-hints and above
  if (controlLevel !== 'full-manual') {
    kinds.push('hint');
  }
  
  // Assisted allowed in assisted and above
  if (controlLevel === 'assisted' || controlLevel === 'directed' || 
      controlLevel === 'collaborative' || controlLevel === 'generative') {
    kinds.push('assisted');
  }
  
  // Collaborative allowed in collaborative boards
  if (controlLevel === 'collaborative') {
    kinds.push('collaborative');
  }
  
  // Generative allowed in directed and generative boards
  if (controlLevel === 'directed' || controlLevel === 'generative') {
    kinds.push('generative');
  }
  
  // Filter based on tool availability
  const phraseEnabled = compositionTools.phraseDatabase?.enabled ?? false;
  const generatorEnabled = compositionTools.phraseGenerators?.enabled ?? false;
  const aiEnabled = compositionTools.aiComposer?.enabled ?? false;
  
  if (!phraseEnabled && kinds.includes('assisted')) {
    // Remove assisted if phrases are disabled
    const idx = kinds.indexOf('assisted');
    if (idx !== -1) kinds.splice(idx, 1);
  }
  
  if (!generatorEnabled && !aiEnabled && kinds.includes('generative')) {
    // Remove generative if no generators/AI
    const idx = kinds.indexOf('generative');
    if (idx !== -1) kinds.splice(idx, 1);
  }
  
  return kinds;
}

/**
 * Determines if cards can control other cards.
 */
function computeCanControlOtherCards(controlLevel: string): boolean {
  // Only collaborative and generative boards allow cross-card control
  return controlLevel === 'collaborative' || controlLevel === 'generative';
}

/**
 * Determines if generated content can be frozen.
 */
function computeCanFreezeGenerated(controlLevel: string): boolean {
  // All boards with generation support freezing
  return controlLevel === 'assisted' || 
         controlLevel === 'directed' || 
         controlLevel === 'collaborative' || 
         controlLevel === 'generative';
}

/**
 * Checks if a specific capability is enabled.
 * 
 * @param board - The board
 * @param capability - The capability key to check
 * @returns True if the capability is enabled
 * 
 * @example
 * ```ts
 * const board = getBoardRegistry().get('session-generators');
 * 
 * if (hasCapability(board, 'canDragPhrases')) {
 *   showPhrasePalette();
 * }
 * ```
 */
export function hasCapability(
  board: Board,
  capability: keyof BoardCapabilities
): boolean {
  const caps = computeBoardCapabilities(board);
  const value = caps[capability];
  
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  
  return false;
}

/**
 * Gets a human-readable summary of board capabilities.
 * 
 * @param board - The board
 * @returns Description of what the board can do
 * 
 * @example
 * ```ts
 * const summary = getCapabilitiesSummary(board);
 * // "Manual editing with phrase drag-drop and harmony hints"
 * ```
 */
export function getCapabilitiesSummary(board: Board): string {
  const caps = computeBoardCapabilities(board);
  const parts: string[] = [];
  
  // Control level
  parts.push(board.controlLevel.replace(/-/g, ' '));
  
  // Key features
  if (caps.canDragPhrases) parts.push('phrase drag-drop');
  if (caps.canShowHarmonyHints) parts.push('harmony hints');
  if (caps.canAutoSuggest) parts.push('auto-suggestions');
  if (caps.canInvokeAI) parts.push('AI composition');
  if (caps.canGenerateContinuously) parts.push('continuous generation');
  
  return parts.join(', ');
}
