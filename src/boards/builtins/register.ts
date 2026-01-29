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
  registry.register(basicTrackerBoard);          // F031-F060
  registry.register(pianoRollProducerBoard);
  registry.register(notationBoardManual);        // F001-F030
  registry.register(basicSessionBoard);          // F091-F120
  registry.register(basicSamplerBoard);          // F061-F090

  // M147: Live Performance Board (tracker-based)
  registry.register(livePerformanceTrackerBoard);

  // M177: Modular Routing Board
  registry.register(modularRoutingBoard);

  // Phase G: Assisted Boards
  registry.register(trackerPhrasesBoard);        // G031-G060: Tracker + Phrases
  registry.register(trackerHarmonyBoard);        // G001-G030: Tracker + Harmony
  registry.register(sessionGeneratorsBoard);     // G061-G090: Session + Generators
  registry.register(notationHarmonyBoard);       // G091-G120: Notation + Harmony

  // Phase H: Generative Boards
  registry.register(aiArrangerBoard);            // H001-H025: AI Arranger
  registry.register(aiCompositionBoard);         // H026-H050: AI Composition
  registry.register(generativeAmbientBoard);     // H051-H075: Generative Ambient

  // Phase I: Hybrid Boards
  registry.register(composerBoard);              // I001-I025: Composer Board (Hybrid)
  registry.register(producerBoard);              // I026-I050: Producer Board (Hybrid)
  registry.register(livePerformanceBoard);       // I051-I075: Live Performance Board (Hybrid)
}
