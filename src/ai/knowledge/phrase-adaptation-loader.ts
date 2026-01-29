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

// Track KB load per adapter instance (important for tests / multi-adapter usage).
let loadedAdapters: WeakSet<PrologAdapter> = new WeakSet();
let loadPromises: WeakMap<PrologAdapter, Promise<void>> = new WeakMap();

/**
 * Load the phrase adaptation knowledge base.
 * 
 * @param adapter - Optional Prolog adapter instance
 * @returns Promise that resolves when KB is loaded
 */
export async function loadPhraseAdaptationKB(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<void> {
  if (loadedAdapters.has(adapter)) {
    return;
  }
  
  const existing = loadPromises.get(adapter);
  if (existing) {
    return existing;
  }

  const promise = adapter
    .loadProgram(phraseAdaptationKB)
    .then(() => {
      loadedAdapters.add(adapter);
      loadPromises.delete(adapter);
    });
  loadPromises.set(adapter, promise);
  await promise;
}

/**
 * Check if the phrase adaptation KB is loaded.
 */
export function isPhraseAdaptationLoaded(
  adapter: PrologAdapter = getPrologAdapter()
): boolean {
  return loadedAdapters.has(adapter);
}

/**
 * Reset the loader state (for testing).
 */
export function resetPhraseAdaptationLoader(): void {
  loadedAdapters = new WeakSet();
  loadPromises = new WeakMap();
}
