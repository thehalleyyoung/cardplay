/**
 * @fileoverview Capture to Manual Board Action (H021)
 * 
 * Workflow action for transitioning from generative boards to manual boards
 * while preserving generated content as editable material.
 * 
 * @module @cardplay/boards/builtins/capture-to-manual-action
 */

import { getBoardRegistry } from '../registry';
import { switchBoard } from '../switching/switch-board';
import { getBoardContextStore } from '../context/store';
import type { BoardId } from '../types';

/**
 * Recommended manual boards for different generative board contexts.
 */
const MANUAL_BOARD_RECOMMENDATIONS: Record<string, BoardId> = {
  'ai-arranger': 'basic-session', // From arranger → session for clip editing
  'ai-composition': 'notation-manual', // From AI composer → notation for score editing
  'generative-ambient': 'basic-sampler', // From ambient → sampler for sound design
  'session-generators': 'basic-tracker', // From generators → tracker for pattern editing
  'tracker-harmony': 'basic-tracker', // Already close to manual
  'notation-harmony': 'notation-manual' // Already close to manual
};

/**
 * Capture to manual board action.
 * 
 * H021: Transitions from a generative/directed board to a recommended manual board
 * while preserving the active context (streams, clips, selection).
 * 
 * This allows users to:
 * 1. Generate content with AI assistance
 * 2. Capture the results
 * 3. Switch to a manual board for detailed editing
 * 4. Keep all the generated events/clips as editable material
 * 
 * @param currentBoardId - Current board (generative/directed)
 * @param targetBoardId - Optional specific manual board to switch to
 * @returns Success flag and target board ID
 */
export function captureToManualBoard(
  currentBoardId: BoardId,
  targetBoardId?: BoardId
): { success: boolean; targetBoardId?: BoardId; reason?: string } {
  const registry = getBoardRegistry();
  const currentBoard = registry.get(currentBoardId);
  
  if (!currentBoard) {
    return {
      success: false,
      reason: 'Current board not found'
    };
  }
  
  // Determine target board
  const target = targetBoardId ?? MANUAL_BOARD_RECOMMENDATIONS[currentBoardId];
  
  if (!target) {
    return {
      success: false,
      reason: 'No recommended manual board for this workflow'
    };
  }
  
  const targetBoard = registry.get(target);
  
  if (!targetBoard) {
    return {
      success: false,
      reason: `Target board ${target} not found`
    };
  }
  
  // Verify target is indeed manual
  if (targetBoard.controlLevel !== 'full-manual') {
    return {
      success: false,
      reason: `Target board ${target} is not a manual board (control level: ${targetBoard.controlLevel})`
    };
  }
  
  // Get current context before switching
  const contextStore = getBoardContextStore();
  const context = contextStore.getContext();
  
  // Switch to manual board while preserving context
  const switched = switchBoard(target, {
    preserveActiveContext: true, // Keep active stream/clip
    resetLayout: false, // Keep layout customizations if any
    resetDecks: false // Keep deck states
  });
  
  if (!switched) {
    return {
      success: false,
      reason: 'Failed to switch boards'
    };
  }
  
  // Log the capture for user awareness
  console.info(`[Capture] Switched from ${currentBoard.name} → ${targetBoard.name}`);
  console.info(`[Capture] Active context preserved:`, {
    streamId: context.activeStreamId,
    clipId: context.activeClipId,
    trackId: context.activeTrackId
  });
  
  return {
    success: true,
    targetBoardId: target
  };
}

/**
 * Get recommended manual board for a given board.
 * 
 * @param boardId - Board to get recommendation for
 * @returns Recommended manual board ID or null
 */
export function getRecommendedManualBoard(boardId: BoardId): BoardId | null {
  return MANUAL_BOARD_RECOMMENDATIONS[boardId] ?? null;
}

/**
 * Check if capture action is available for a board.
 * 
 * @param boardId - Board to check
 * @returns True if board supports capture to manual
 */
export function canCaptureToManual(boardId: BoardId): boolean {
  const registry = getBoardRegistry();
  const board = registry.get(boardId);
  
  if (!board) {
    return false;
  }
  
  // Only directed/generative boards support capture
  if (board.controlLevel !== 'directed' && board.controlLevel !== 'generative') {
    return false;
  }
  
  // Must have a recommended manual board
  return MANUAL_BOARD_RECOMMENDATIONS[boardId] !== undefined;
}

/**
 * Get capture button text for a board.
 * 
 * @param boardId - Board to get text for
 * @returns Button text or null if capture not supported
 */
export function getCaptureButtonText(boardId: BoardId): string | null {
  if (!canCaptureToManual(boardId)) {
    return null;
  }
  
  const targetBoard = getRecommendedManualBoard(boardId);
  
  if (!targetBoard) {
    return null;
  }
  
  const registry = getBoardRegistry();
  const target = registry.get(targetBoard);
  
  return target ? `Edit Manually in ${target.name}` : 'Edit Manually';
}
