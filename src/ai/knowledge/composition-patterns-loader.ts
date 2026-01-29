/**
 * @fileoverview Composition Patterns Knowledge Base Loader
 * 
 * Loads the composition-patterns.pl Prolog knowledge base into the Prolog engine.
 * This provides predicates for:
 * - Genre characteristics and tempo ranges
 * - Arrangement structures and section ordering
 * - Drum and bass patterns
 * - Compositional techniques
 * 
 * @module @cardplay/ai/knowledge/composition-patterns-loader
 */

import { getPrologAdapter, PrologAdapter } from '../engine/prolog-adapter';

// Import the Prolog source file as a string
import compositionPatternsPl from './composition-patterns.pl?raw';

/**
 * Whether the composition patterns KB has been loaded.
 */
let loadedAdapters: WeakSet<PrologAdapter> = new WeakSet();

/**
 * Load the composition patterns knowledge base into the Prolog engine.
 * Safe to call multiple times - will only load once.
 */
export async function loadCompositionPatternsKB(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<void> {
  if (loadedAdapters.has(adapter)) {
    return;
  }
  
  await adapter.loadProgram(compositionPatternsPl, 'composition-patterns-kb');
  loadedAdapters.add(adapter);
}

/**
 * Check if the composition patterns KB is loaded.
 */
export function isCompositionPatternsLoaded(
  adapter: PrologAdapter = getPrologAdapter()
): boolean {
  return loadedAdapters.has(adapter);
}

/**
 * Reset the loaded state (for testing).
 */
export function resetCompositionPatternsLoader(): void {
  loadedAdapters = new WeakSet();
}

/**
 * Get the raw Prolog source for the composition patterns KB.
 */
export function getCompositionPatternsSource(): string {
  return compositionPatternsPl;
}
