/**
 * @fileoverview Board System Initialization
 * 
 * Bootstraps the board system by registering all builtin boards and deck factories.
 * Call this once during app initialization.
 * 
 * @module @cardplay/boards/init
 */

import { registerBuiltinBoards } from './builtins/register';
import { registerBuiltinDeckFactories } from './decks/factories';

/**
 * Initialize the board system.
 * 
 * This function:
 * 1. Registers all builtin deck factories
 * 2. Registers all builtin board definitions
 * 
 * Call this once during app startup, before any boards are accessed.
 * 
 * @example
 * ```ts
 * import { initializeBoardSystem } from '@cardplay/boards/init';
 * 
 * // At app startup:
 * initializeBoardSystem();
 * 
 * // Now boards can be accessed:
 * import { getBoardRegistry } from '@cardplay/boards/registry';
 * const boards = getBoardRegistry().list();
 * ```
 */
export function initializeBoardSystem(): void {
  // Step 1: Register deck factories
  // These are needed before boards can be validated/created
  registerBuiltinDeckFactories();
  
  // Step 2: Register builtin boards
  // This validates each board and ensures all deck types have factories
  registerBuiltinBoards();
  
  console.log('[BoardSystem] Initialized: deck factories and builtin boards registered');
}

/**
 * Re-export key initialization functions for convenience.
 */
export { registerBuiltinBoards } from './builtins/register';
export { registerBuiltinDeckFactories } from './decks/factories';
