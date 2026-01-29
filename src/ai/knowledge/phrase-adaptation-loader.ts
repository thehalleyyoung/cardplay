/**
 * @fileoverview Phrase Adaptation KB Loader
 * 
 * Loads the phrase-adaptation.pl knowledge base into the Prolog engine.
 * 
 * L221-L222: Phrase adaptation Prolog integration
 * 
 * @module @cardplay/ai/knowledge/phrase-adaptation-loader
 */

import { getPrologAdapter, PrologAdapter } from '../engine/prolog-adapter';

// The phrase adaptation KB as a string (loaded at build time or inlined)
import phraseAdaptationKB from './phrase-adaptation.pl?raw';

// Track if KB is loaded
let kbLoaded = false;
let loadPromise: Promise<void> | null = null;

/**
 * Load the phrase adaptation knowledge base.
 * 
 * @param adapter - Optional Prolog adapter instance
 * @returns Promise that resolves when KB is loaded
 */
export async function loadPhraseAdaptationKB(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<void> {
  if (kbLoaded) {
    return;
  }
  
  if (loadPromise) {
    return loadPromise;
  }
  
  loadPromise = adapter.loadProgram(phraseAdaptationKB).then(() => {});
  await loadPromise;
  kbLoaded = true;
}

/**
 * Check if the phrase adaptation KB is loaded.
 */
export function isPhraseAdaptationLoaded(): boolean {
  return kbLoaded;
}

/**
 * Reset the loader state (for testing).
 */
export function resetPhraseAdaptationLoader(): void {
  kbLoaded = false;
  loadPromise = null;
}
