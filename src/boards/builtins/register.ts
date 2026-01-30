/**
 * @fileoverview Builtin Board Registration
 * 
 * Registers all builtin board definitions with the board registry.
 * Should be called once at app initialization.
 * 
 * @module @cardplay/boards/builtins/register
 */

import { getBoardRegistry } from '../registry';
import { basicTrackerBoard } from './basic-tracker-board';
import { pianoRollProducerBoard } from './piano-roll-producer-board';
import { trackerPhrasesBoard } from './tracker-phrases-board';
import { trackerHarmonyBoard } from './tracker-harmony-board';
import { notationBoardManual } from './notation-board-manual';
import { basicSessionBoard } from './basic-session-board';
import { basicSamplerBoard } from './basic-sampler-board';
import { livePerformanceTrackerBoard } from './live-performance-tracker-board';
import { modularRoutingBoard } from './modular-routing-board';
import { producerBoard } from './producer-board';
import { sessionGeneratorsBoard } from './session-generators-board';
import { notationHarmonyBoard } from './notation-harmony-board';
import { aiArrangerBoard } from './ai-arranger-board';
import { aiCompositionBoard } from './ai-composition-board';
import { generativeAmbientBoard } from './generative-ambient-board';
import { composerBoard } from './composer-board';
import { livePerformanceBoard } from './live-performance-board';

/**
 * Get all builtin board definitions.
 *
 * @returns Array of all builtin board definitions
 */
export function getAllBuiltinBoards() {
  return [
    // Phase F: Manual Boards
    basicTrackerBoard,
    pianoRollProducerBoard,
    notationBoardManual,
    basicSessionBoard,
    basicSamplerBoard,
    
    // M147: Live Performance Board (tracker-based)
    livePerformanceTrackerBoard,
    
    // M177: Modular Routing Board
    modularRoutingBoard,
    
    // Phase G: Assisted Boards
    trackerPhrasesBoard,
    trackerHarmonyBoard,
    sessionGeneratorsBoard,
    notationHarmonyBoard,
    
    // Phase H: Generative Boards
    aiArrangerBoard,
    aiCompositionBoard,
    generativeAmbientBoard,
    
    // Phase I: Hybrid Boards
    composerBoard,
    producerBoard,
    livePerformanceBoard,
  ];
}

/**
 * Register all builtin boards.
 *
 * Call this once during app initialization to populate the board registry
 * with all built-in board definitions. Can be called multiple times safely
 * (already-registered boards are skipped).
 *
 * Change 428: Marks boards as builtin so they use un-namespaced IDs.
 *
 * @throws {Error} If any board fails validation
 */
export function registerBuiltinBoards(): void {
  const registry = getBoardRegistry();

  // Helper to safely register as builtin (skip if already exists)
  const safeRegister = (board: any) => {
    if (!registry.get(board.id)) {
      registry.register(board, { isBuiltin: true });
    }
  };

  // Register all builtin boards
  for (const board of getAllBuiltinBoards()) {
    safeRegister(board);
  }
}
