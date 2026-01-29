/**
 * @fileoverview Board Layout Knowledge Base Loader
 * 
 * Loads the board-layout.pl Prolog knowledge base into the Prolog engine.
 * This provides predicates for:
 * - Board types and control levels
 * - Deck types and compatibility
 * - Workflow recommendations
 * - Layout suggestions
 * 
 * @module @cardplay/ai/knowledge/board-layout-loader
 */

import { getPrologAdapter, PrologAdapter } from '../engine/prolog-adapter';

// Import the Prolog source file as a string
import boardLayoutPl from './board-layout.pl?raw';

/**
 * Whether the board layout KB has been loaded.
 */
let loadedAdapters: WeakSet<PrologAdapter> = new WeakSet();

/**
 * Load the board layout knowledge base into the Prolog engine.
 * Safe to call multiple times - will only load once.
 */
export async function loadBoardLayoutKB(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<void> {
  if (loadedAdapters.has(adapter)) {
    return;
  }
  
  await adapter.loadProgram(boardLayoutPl, 'board-layout-kb');
  loadedAdapters.add(adapter);
}

/**
 * Check if the board layout KB is loaded.
 */
export function isBoardLayoutLoaded(adapter: PrologAdapter = getPrologAdapter()): boolean {
  return loadedAdapters.has(adapter);
}

/**
 * Reset the loaded state (for testing).
 */
export function resetBoardLayoutLoader(): void {
  loadedAdapters = new WeakSet();
}

/**
 * Get the raw Prolog source for the board layout KB.
 */
export function getBoardLayoutSource(): string {
  return boardLayoutPl;
}
