/**
 * Register Built-in Sample Packs
 */

import { getSamplePackRegistry } from './registry';
import { builtinSamplePacks } from './builtins';

/**
 * Register all built-in sample packs
 */
export function registerBuiltinSamplePacks(): void {
  const registry = getSamplePackRegistry();
  
  for (const pack of builtinSamplePacks) {
    try {
      registry.register(pack);
    } catch (error) {
      console.warn(`Failed to register sample pack "${pack.id}":`, error);
    }
  }
}
