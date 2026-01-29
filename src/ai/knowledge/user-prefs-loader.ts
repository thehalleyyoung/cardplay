/**
 * @fileoverview User Preferences KB Loader
 *
 * Loads the user-prefs.pl dynamic knowledge base into the Prolog engine.
 * This KB stores learned user preferences as asserted/retracted facts.
 *
 * L325: User preferences dynamic Prolog KB
 *
 * @module @cardplay/ai/knowledge/user-prefs-loader
 */

import { getPrologAdapter, PrologAdapter } from '../engine/prolog-adapter';

// The user-prefs KB as a string (loaded at build time via ?raw)
import userPrefsKB from './user-prefs.pl?raw';

// Track KB load per adapter instance (important for tests / multi-adapter usage).
let loadedAdapters: WeakSet<PrologAdapter> = new WeakSet();
let loadPromises: WeakMap<PrologAdapter, Promise<void>> = new WeakMap();

/**
 * Load the user preferences knowledge base.
 *
 * @param adapter - Optional Prolog adapter instance
 * @returns Promise that resolves when KB is loaded
 */
export async function loadUserPrefsKB(
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
    .loadProgram(userPrefsKB)
    .then(() => {
      loadedAdapters.add(adapter);
      loadPromises.delete(adapter);
    });
  loadPromises.set(adapter, promise);
  await promise;
}

/**
 * Check if the user preferences KB is loaded.
 */
export function isUserPrefsLoaded(adapter: PrologAdapter = getPrologAdapter()): boolean {
  return loadedAdapters.has(adapter);
}

/**
 * Reset the loader state (for testing).
 */
export function resetUserPrefsLoader(): void {
  loadedAdapters = new WeakSet();
  loadPromises = new WeakMap();
}

/**
 * Get raw source of the user-prefs KB.
 */
export function getUserPrefsSource(): string {
  return userPrefsKB;
}
