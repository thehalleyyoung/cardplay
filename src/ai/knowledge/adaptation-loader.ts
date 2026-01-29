/**
 * @fileoverview Adaptation KB Loader
 *
 * Loads the adaptation.pl knowledge base for skill-level-based
 * suggestion adaptation.
 *
 * L344: Adaptive rules for suggestions based on user skill level
 *
 * @module @cardplay/ai/knowledge/adaptation-loader
 */

import { getPrologAdapter, PrologAdapter } from '../engine/prolog-adapter';

// The adaptation KB as a string (loaded at build time via ?raw)
import adaptationKB from './adaptation.pl?raw';

// Track KB load per adapter instance (important for tests / multi-adapter usage).
let loadedAdapters: WeakSet<PrologAdapter> = new WeakSet();
let loadPromises: WeakMap<PrologAdapter, Promise<void>> = new WeakMap();

/**
 * Load the adaptation knowledge base.
 *
 * @param adapter - Optional Prolog adapter instance
 * @returns Promise that resolves when KB is loaded
 */
export async function loadAdaptationKB(
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
    .loadProgram(adaptationKB)
    .then(() => {
      loadedAdapters.add(adapter);
      loadPromises.delete(adapter);
    });
  loadPromises.set(adapter, promise);
  await promise;
}

/**
 * Check if the adaptation KB is loaded.
 */
export function isAdaptationLoaded(adapter: PrologAdapter = getPrologAdapter()): boolean {
  return loadedAdapters.has(adapter);
}

/**
 * Reset the loader state (for testing).
 */
export function resetAdaptationLoader(): void {
  loadedAdapters = new WeakSet();
  loadPromises = new WeakMap();
}

/**
 * Get raw source of the adaptation KB.
 */
export function getAdaptationSource(): string {
  return adaptationKB;
}
