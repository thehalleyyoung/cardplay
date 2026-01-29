/**
 * @fileoverview Board Switching Logic
 *
 * Core logic for switching between boards.
 *
 * B080-B084: Implement switchBoard function.
 *
 * @module @cardplay/boards/switching/switch-board
 */

import { getBoardRegistry } from '../registry';
import { getBoardStateStore } from '../store/store';
import { getBoardContextStore } from '../context/store';
import { applyBoardTheme, clearBoardTheme } from '../ui/theme-applier';
import type { BoardSwitchOptions } from './types';
import { DEFAULT_SWITCH_OPTIONS } from './types';
// Reserved for future use:
// import { createMigrationPlan } from './migration-plan';

// ============================================================================
// BOARD SWITCHING
// ============================================================================

/**
 * Switches to a different board.
 *
 * B080-B084: Complete switchBoard implementation.
 *
 * @param boardId Target board ID
 * @param options Switch options
 * @returns true if successful, false if board not found
 */
export function switchBoard(
  boardId: string,
  options: BoardSwitchOptions = {}
): boolean {
  const opts = { ...DEFAULT_SWITCH_OPTIONS, ...options };
  const registry = getBoardRegistry();
  const stateStore = getBoardStateStore();
  const contextStore = getBoardContextStore();

  // B081: Validate board exists
  const targetBoard = registry.get(boardId);
  if (!targetBoard) {
    console.error(`Cannot switch to board "${boardId}": board not found in registry`);
    return false;
  }

  // Get current board (may be null for first switch)
  const state = stateStore.getState();
  const currentBoardId = state.currentBoardId;
  const currentBoard = currentBoardId ? (registry.get(currentBoardId) ?? null) : null;

  // B083: Call onDeactivate lifecycle hook for current board
  if (opts.callLifecycleHooks && currentBoard?.onDeactivate) {
    try {
      currentBoard.onDeactivate();
    } catch (error) {
      console.error('Error in board onDeactivate hook:', error);
    }
  }
  
  // Clear current board theme
  if (currentBoard) {
    clearBoardTheme();
  }

  // Create migration plan (reserved for future use)
  // const migrationPlan = createMigrationPlan(currentBoard, targetBoard);

  // B082: Update BoardStateStore
  stateStore.setCurrentBoard(boardId);

  // Handle layout reset if requested
  if (opts.resetLayout) {
    stateStore.resetLayoutState(boardId);
  }

  // Handle deck state reset if requested
  if (opts.resetDecks) {
    stateStore.resetDeckState(boardId);
  }

  // B084: Preserve active context by default
  if (!opts.preserveActiveContext) {
    // Reset context to board defaults (if any)
    // For now, keep stream/clip IDs but update view type to board primary
    if (targetBoard.primaryView) {
      contextStore.setActiveViewType(targetBoard.primaryView);
    }
  }
  
  // C080: Clear selection if requested
  if (opts.clearSelection) {
    const { getSelectionStore } = require('../../state/selection-store');
    const selectionStore = getSelectionStore();
    selectionStore.clearSelection();
  }

  // Preserve transport by default (no action needed if preserving)
  if (!opts.preserveTransport) {
    // Reset transport state
    contextStore.setPlaying(false);
    contextStore.setTransportPosition(0);
  }

  // B083: Call onActivate lifecycle hook for target board
  if (opts.callLifecycleHooks && targetBoard.onActivate) {
    try {
      targetBoard.onActivate();
    } catch (error) {
      console.error('Error in board onActivate hook:', error);
    }
  }
  
  // Apply new board theme
  applyBoardTheme(targetBoard);

  return true;
}

/**
 * Switches to the previous board (from recent list).
 */
export function switchToPreviousBoard(): boolean {
  const stateStore = getBoardStateStore();
  const state = stateStore.getState();
  
  // Get second item in recent list (first is current board)
  const previousBoardId = state.recentBoardIds[1];
  
  if (!previousBoardId) {
    console.warn('No previous board to switch to');
    return false;
  }

  return switchBoard(previousBoardId);
}

/**
 * Switches to the next board in the recent list.
 */
export function switchToNextBoard(): boolean {
  const stateStore = getBoardStateStore();
  const state = stateStore.getState();
  const registry = getBoardRegistry();
  
  // Get all registered boards
  const allBoards = registry.list();
  
  if (allBoards.length === 0) {
    return false;
  }

  // Find current board index
  const currentIndex = allBoards.findIndex(b => b.id === state.currentBoardId);
  
  // Get next board (wrap around)
  const nextIndex = (currentIndex + 1) % allBoards.length;
  const nextBoard = allBoards[nextIndex]!;

  return switchBoard(nextBoard.id);
}
