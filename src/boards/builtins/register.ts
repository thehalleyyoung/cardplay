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
  registry.register(basicSamplerBoard);

  // M147: Live Performance Board
  registry.register(livePerformanceTrackerBoard);

  // M177: Modular Routing Board
  registry.register(modularRoutingBoard);

  // Phase G: Assisted Boards
  registry.register(trackerPhrasesBoard);       // G031-G060: Tracker + Phrases
  registry.register(trackerHarmonyBoard);       // G001-G030: Tracker + Harmony
  registry.register(sessionGeneratorsBoard);    // G061-G090: Session + Generators
  registry.register(notationHarmonyBoard);      // G091-G120: Notation + Harmony

  // Phase H: Generative Boards
  registry.register(aiArrangerBoard);           // H001-H025: AI Arranger
  registry.register(aiCompositionBoard);        // H026-H050: AI Composition
  registry.register(generativeAmbientBoard);    // H051-H075: Generative Ambient

  // M257: Producer Board
  registry.register(producerBoard);

  // Phase I: Hybrid Boards (not yet implemented)
  // registry.register(composerBoard);
}
