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
import { initBoardSwitcher } from '../ui/components/board-switcher';
import { KeyboardShortcutManager } from '../ui/keyboard-shortcuts';
import { getBoardStateStore } from './store/store';
import { getBoardRegistry } from './registry';
import { initBoardSwitchIntegration } from './integration/board-switch-integration';

/**
 * Initialize the board system.
 * 
 * This function:
 * 1. Registers all builtin deck factories
 * 2. Registers all builtin board definitions
 * 3. Initializes board switcher UI (C051, C055)
 * 4. Sets up keyboard shortcuts (Cmd+B)
 * 5. Initializes board switch integration (D066-D068)
 * 6. Ensures a default board is selected
 * 
 * Call this once during app startup, before any boards are accessed.
 * 
 * @returns Cleanup function to call on shutdown
 * 
 * @example
 * ```ts
 * import { initializeBoardSystem } from '@cardplay/boards/init';
 * 
 * // At app startup:
 * const cleanup = initializeBoardSystem();
 * 
 * // On shutdown:
 * cleanup();
 * ```
 */
export function initializeBoardSystem(): () => void {
  // Step 1: Register deck factories
  // These are needed before boards can be validated/created
  registerBuiltinDeckFactories();
  
  // Step 2: Register builtin boards with validation (B148)
  // This validates each board and ensures all deck types have factories
  try {
    registerBuiltinBoards();
  } catch (error) {
    console.error('[BoardSystem] Failed to register builtin boards:', error);
    // Continue with whatever boards were successfully registered
  }
  
  // Step 3: Initialize board switcher to listen for Cmd+B (C051, C055)
  const unsubSwitcher = initBoardSwitcher();
  
  // Step 4: Start keyboard shortcut manager (C051)
  const shortcutManager = KeyboardShortcutManager.getInstance();
  shortcutManager.start();
  
  // Step 5: Initialize board switch integration (D066-D068)
  // This sets up automatic recomputation of visible decks and allowed cards
  const unsubIntegration = initBoardSwitchIntegration();
  
  // Step 6: Ensure at least one board exists (B147)
  const registry = getBoardRegistry();
  const boards = registry.list();
  if (boards.length === 0) {
    throw new Error('No boards registered! Cannot initialize board system.');
  }
  
  // Step 7: Set default board if none selected (B146)
  const store = getBoardStateStore();
  const state = store.getState();
  if (!state.currentBoardId || !registry.get(state.currentBoardId)) {
    const defaultBoard = boards.find(b => b.id === 'basic-tracker') || boards[0];
    if (defaultBoard) {
      store.setCurrentBoard(defaultBoard.id);
    }
  }
  
  // Step 8: Apply initial board theme
  const currentBoardId = store.getState().currentBoardId;
  if (currentBoardId) {
    const currentBoard = registry.get(currentBoardId);
    if (currentBoard) {
      // Import theme applier dynamically to avoid circular deps
      import('./ui/theme-applier').then(({ applyBoardTheme }) => {
        applyBoardTheme(currentBoard);
      });
    }
  }
  
  console.log(`[BoardSystem] Initialized with ${boards.length} boards`);
  
  // Return cleanup function
  return () => {
    unsubSwitcher();
    unsubIntegration();
    shortcutManager.stop();
    
    // Clean up theme on shutdown
    import('./ui/theme-applier').then(({ clearBoardTheme }) => {
      clearBoardTheme();
    });
  };
}

/**
 * Get the current board ID from the store.
 */
export function getCurrentBoardId(): string | null {
  return getBoardStateStore().getState().currentBoardId;
}

/**
 * Get the current board definition from the registry.
 */
export function getCurrentBoard() {
  const boardId = getCurrentBoardId();
  if (!boardId) return null;
  
  return getBoardRegistry().get(boardId);
}

/**
 * Re-export key initialization functions for convenience.
 */
export { registerBuiltinBoards } from './builtins/register';
export { registerBuiltinDeckFactories } from './decks/factories';

