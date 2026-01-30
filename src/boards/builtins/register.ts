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

  // Phase F: Manual Boards
  safeRegister(basicTrackerBoard);          // F031-F060
  safeRegister(pianoRollProducerBoard);
  safeRegister(notationBoardManual);        // F001-F030
  safeRegister(basicSessionBoard);          // F091-F120
  safeRegister(basicSamplerBoard);          // F061-F090

  // M147: Live Performance Board (tracker-based)
  safeRegister(livePerformanceTrackerBoard);

  // M177: Modular Routing Board
  safeRegister(modularRoutingBoard);

  // Phase G: Assisted Boards
  safeRegister(trackerPhrasesBoard);        // G031-G060: Tracker + Phrases
  safeRegister(trackerHarmonyBoard);        // G001-G030: Tracker + Harmony
  safeRegister(sessionGeneratorsBoard);     // G061-G090: Session + Generators
  safeRegister(notationHarmonyBoard);       // G091-G120: Notation + Harmony

  // Phase H: Generative Boards
  safeRegister(aiArrangerBoard);            // H001-H025: AI Arranger
  safeRegister(aiCompositionBoard);         // H026-H050: AI Composition
  safeRegister(generativeAmbientBoard);     // H051-H075: Generative Ambient

  // Phase I: Hybrid Boards
  safeRegister(composerBoard);              // I001-I025: Composer Board (Hybrid)
  safeRegister(producerBoard);              // I026-I050: Producer Board (Hybrid)
  safeRegister(livePerformanceBoard);       // I051-I075: Live Performance Board (Hybrid)
}
