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

// Track if KB is loaded
let kbLoaded = false;
let loadPromise: Promise<void> | null = null;

/**
 * Load the adaptation knowledge base.
 *
 * @param adapter - Optional Prolog adapter instance
 * @returns Promise that resolves when KB is loaded
 */
export async function loadAdaptationKB(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<void> {
  if (kbLoaded) {
    return;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = adapter.loadProgram(adaptationKB).then(() => {});
  await loadPromise;
  kbLoaded = true;
}

/**
 * Check if the adaptation KB is loaded.
 */
export function isAdaptationLoaded(): boolean {
  return kbLoaded;
}

/**
 * Reset the loader state (for testing).
 */
export function resetAdaptationLoader(): void {
  kbLoaded = false;
  loadPromise = null;
}

/**
 * Get raw source of the adaptation KB.
 */
export function getAdaptationSource(): string {
  return adaptationKB;
}
