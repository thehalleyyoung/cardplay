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
import { trackerPhrasesBoard } from './stub-tracker-phrases';
import { trackerHarmonyBoard } from './tracker-harmony-board';
import { notationBoardManual } from './notation-board-manual';
import { basicSessionBoard } from './basic-session-board';
import { livePerformanceTrackerBoard } from './live-performance-tracker-board';
import { modularRoutingBoard } from './modular-routing-board';

/**
 * Register all builtin boards.
 *
 * Call this once during app initialization to populate the board registry
 * with all built-in board definitions.
 *
 * @throws {Error} If any board fails validation or has duplicate ID
 */
export function registerBuiltinBoards(): void {
  const registry = getBoardRegistry();

  // Phase F: Manual Boards
  registry.register(basicTrackerBoard);
  registry.register(pianoRollProducerBoard);
  registry.register(notationBoardManual);
  registry.register(basicSessionBoard);

  // M147: Live Performance Board
  registry.register(livePerformanceTrackerBoard);

  // M177: Modular Routing Board
  registry.register(modularRoutingBoard);

  // Phase G: Assisted Boards
  registry.register(trackerPhrasesBoard);
  registry.register(trackerHarmonyBoard);

  // Phase G: (other assisted boards - not yet implemented)
  // registry.register(sessionGeneratorsBoard);
  // registry.register(notationHarmonyBoard);

  // Phase H: Generative Boards (not yet implemented)
  // registry.register(aiArrangerBoard);
  // registry.register(aiCompositionBoard);
  // registry.register(generativeAmbientBoard);

  // Phase I: Hybrid Boards (not yet implemented)
  // registry.register(composerBoard);
  // registry.register(producerBoard);
}
