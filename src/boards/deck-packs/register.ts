/**
 * @fileoverview Deck Pack Registration
 * 
 * Registers all builtin deck packs
 * 
 * @module @cardplay/boards/deck-packs/register
 */

import { getDeckPackRegistry } from './registry';
import { builtinDeckPacks } from './builtins';

/**
 * Register all builtin deck packs
 */
export function registerBuiltinDeckPacks(): void {
  const registry = getDeckPackRegistry();
  
  for (const pack of builtinDeckPacks) {
    try {
      registry.register(pack);
    } catch (error) {
      console.warn(`Failed to register deck pack "${pack.id}":`, error);
    }
  }
}
