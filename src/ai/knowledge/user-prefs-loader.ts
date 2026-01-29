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

// Track if KB is loaded
let kbLoaded = false;
let loadPromise: Promise<void> | null = null;

/**
 * Load the user preferences knowledge base.
 *
 * @param adapter - Optional Prolog adapter instance
 * @returns Promise that resolves when KB is loaded
 */
export async function loadUserPrefsKB(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<void> {
  if (kbLoaded) {
    return;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = adapter.loadProgram(userPrefsKB).then(() => {});
  await loadPromise;
  kbLoaded = true;
}

/**
 * Check if the user preferences KB is loaded.
 */
export function isUserPrefsLoaded(): boolean {
  return kbLoaded;
}

/**
 * Reset the loader state (for testing).
 */
export function resetUserPrefsLoader(): void {
  kbLoaded = false;
  loadPromise = null;
}

/**
 * Get raw source of the user-prefs KB.
 */
export function getUserPrefsSource(): string {
  return userPrefsKB;
}
