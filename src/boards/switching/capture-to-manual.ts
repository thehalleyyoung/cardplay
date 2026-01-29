/**
 * @fileoverview Capture to Manual Board Action (Phase H: H021)
 * 
 * Allows users to "capture" generated content from a generative/directed board
 * and switch to a manual board with the same streams active, enabling manual editing.
 * 
 * Use cases:
 * - Generated a nice arrangement with AI Arranger, now want to tweak manually
 * - Created ambient layers, want to freeze and edit in tracker
 * - Composed with AI, want to refine in notation editor
 * 
 * @module @cardplay/boards/switching/capture-to-manual
 */

import { getBoardRegistry } from '../registry';
import { switchBoard } from './switch-board';
import type { BoardId } from '../types';
import { getBoardContextStore } from '../context/store';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for capture to manual board.
 */
export interface CaptureToManualOptions {
  /**
   * Target manual board ID.
   * If not specified, will pick the best match based on current primary view.
   */
  targetBoardId?: BoardId;
  
  /**
   * Whether to freeze all generated layers before switching.
   * Default: true (recommended to prevent regeneration on switch back)
   */
  freezeGeneratedLayers?: boolean;
  
  /**
   * Whether to preserve deck tabs on switch.
   * Default: true (keep pattern/clip tabs open)
   */
  preserveDeckTabs?: boolean;
}

/**
 * Result of capture to manual operation.
 */
export interface CaptureToManualResult {
  /** Whether the operation succeeded */
  success: boolean;
  
  /** Target board that was switched to */
  targetBoardId?: BoardId;
  
  /** Error message if operation failed */
  error?: string;
  
  /** Active stream IDs preserved */
  preservedStreamIds?: string[];
}

// ============================================================================
// BOARD SELECTION
// ============================================================================

/**
 * Get the best manual board for the current primary view.
 */
function getBestManualBoard(currentPrimaryView?: string): string | null {
  const registry = getBoardRegistry();
  
  // Map primary view to recommended manual board
  const viewToBoard: Record<string, BoardId> = {
    'tracker': 'basic-tracker' as BoardId,
    'notation': 'notation-manual' as BoardId,
    'session': 'basic-session' as BoardId,
    'sampler': 'basic-sampler' as BoardId,
    'arranger': 'basic-session' as BoardId, // Arranger -> Session for manual clip launching
    'composer': 'notation-manual' as BoardId // Composer -> Notation for manual score editing
  };
  
  const recommendedId = currentPrimaryView ? viewToBoard[currentPrimaryView] : undefined;
  
  if (recommendedId && registry.get(recommendedId)) {
    return recommendedId;
  }
  
  // Fallback: find any manual board
  const manualBoards = registry.list().filter(board => 
    board.controlLevel === 'full-manual'
  );
  
  return manualBoards.length > 0 ? (manualBoards[0]?.id ?? null) : null;
}

// ============================================================================
// CAPTURE TO MANUAL ACTION
// ============================================================================

/**
 * H021: Capture to manual board.
 * 
 * Switches from a generative/directed board to a manual board,
 * preserving active stream context so the user can continue
 * editing the generated content manually.
 * 
 * @param options - Capture options
 * @returns Result of the capture operation
 */
export function captureToManualBoard(
  options: CaptureToManualOptions = {}
): CaptureToManualResult {
  const {
    targetBoardId,
    freezeGeneratedLayers = true
  } = options;
  
  const registry = getBoardRegistry();
  const contextStore = getBoardContextStore();
  const context = contextStore.getContext();
  
  // Get current board
  const currentBoardId = registry.list()[0]?.id; // Simplified; in real app get from BoardStateStore
  const currentBoard = currentBoardId ? registry.get(currentBoardId) : null;
  
  if (!currentBoard) {
    return {
      success: false,
      error: 'No active board found'
    };
  }
  
  // Only allow capture from generative/directed boards
  if (currentBoard.controlLevel === 'full-manual' || currentBoard.controlLevel === 'manual-with-hints') {
    return {
      success: false,
      error: 'Capture is only available from generative or directed boards'
    };
  }
  
  // Determine target board
  const fallbackTarget = getBestManualBoard(currentBoard.primaryView);
  const target = targetBoardId || fallbackTarget;
  
  if (!target) {
    return {
      success: false,
      error: 'No suitable manual board found for capture'
    };
  }
  
  const targetBoard = registry.get(target);
  if (!targetBoard) {
    return {
      success: false,
      error: `Target board not found: ${target}`
    };
  }
  
  if (targetBoard.controlLevel !== 'full-manual') {
    return {
      success: false,
      error: 'Target board must be a manual board'
    };
  }
  
  // Freeze generated layers if requested
  if (freezeGeneratedLayers) {
    // TODO: Call freeze actions on any generative layers
    // For MVP, just log the intent
    console.info('Freezing generated layers before capture...');
  }
  
  // Collect active stream IDs to preserve
  const preservedStreamIds: string[] = [];
  if (context.activeStreamId) {
    preservedStreamIds.push(context.activeStreamId as string);
  }
  
  // Switch to target board (switchBoard expects string)
  try {
    switchBoard(target as string, {
      resetLayout: false, // Keep layout familiar
      resetDecks: false, // Keep deck tabs open
      preserveActiveContext: true, // Critical: preserve stream/clip context
      preserveTransport: true // Keep playback state
    });
    
    console.info('Captured to manual board:', {
      from: currentBoard.name,
      to: targetBoard.name,
      preservedStreams: preservedStreamIds
    });
    
    // Show success message
    // TODO: Integrate with notification system
    console.info(`✨ Captured to ${targetBoard.name}. Your generated content is now editable.`);
    
    return {
      success: true,
      targetBoardId: target,
      preservedStreamIds
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during capture'
    };
  }
}

// ============================================================================
// UI HELPER
// ============================================================================

/**
 * Check if "Capture to Manual" CTA should be shown.
 * 
 * Show the CTA if:
 * - Current board is generative or directed
 * - There's active content (streams/clips)
 * - A suitable manual board exists
 */
export function shouldShowCaptureToManualCTA(): boolean {
  const registry = getBoardRegistry();
  const contextStore = getBoardContextStore();
  const context = contextStore.getContext();
  
  // Get current board (simplified)
  const list = registry.list();
  if (list.length === 0) {
    return false;
  }
  const currentBoardId = list[0]!.id;
  const currentBoard = registry.get(currentBoardId);
  
  if (!currentBoard) {
    return false;
  }
  
  // Only show for generative/directed boards
  if (currentBoard.controlLevel !== 'directed' && currentBoard.controlLevel !== 'generative') {
    return false;
  }
  
  // Must have active content
  if (!context.activeStreamId && !context.activeClipId) {
    return false;
  }
  
  // Must have a target manual board
  const targetBoardId = getBestManualBoard(currentBoard.primaryView);
  if (!targetBoardId) {
    return false;
  }
  
  return true;
}

/**
 * Get the target manual board name for display in CTA.
 */
export function getCaptureTargetBoardName(): string | null {
  const registry = getBoardRegistry();
  const list = registry.list();
  if (list.length === 0) {
    return null;
  }
  const currentBoardId = list[0]!.id;
  const currentBoard = registry.get(currentBoardId);
  
  if (!currentBoard) {
    return null;
  }
  
  const targetBoardId = getBestManualBoard(currentBoard.primaryView);
  if (!targetBoardId) {
    return null;
  }
  
  const targetBoard = registry.get(targetBoardId);
  return targetBoard ? targetBoard.name : null;
}
