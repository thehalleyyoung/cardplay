/**
 * @fileoverview Board Registry
 * 
 * Central registry for all available boards. Boards must be registered
 * before they can be used. Supports filtering, searching, and recommendations.
 * 
 * @module @cardplay/boards/registry
 */

import type { Board, ControlLevel, BoardDifficulty, UserType } from './types';
import { assertValidBoard } from './validate';
import { getRecommendedBoardIds } from './recommendations';
import { isNamespacedId } from '../canon/id-validation';

// ============================================================================
// BOARD REGISTRY
// ============================================================================

/**
 * BoardRegistry manages the collection of available boards.
 */
/**
 * Listener callback for board registration events.
 * L124: Used to update KB when boards are registered/unregistered.
 */
export type BoardRegistryListener = (event: BoardRegistryEvent) => void;

/**
 * Board registry event.
 * L124: Fired when boards are registered or unregistered.
 */
export interface BoardRegistryEvent {
  readonly type: 'register' | 'unregister';
  readonly board: Board;
}

export class BoardRegistry {
  private boards: Map<string, Board> = new Map();
  private listeners: Set<BoardRegistryListener> = new Set();
  // Change 428: Track builtin board IDs to enforce namespacing for extensions
  private builtinBoardIds: Set<string> = new Set();

  /**
   * Subscribe to registry events (register/unregister).
   * L124: Allows KB to stay in sync with dynamic board changes.
   * @returns Unsubscribe function.
   */
  subscribe(listener: BoardRegistryListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of a registry event.
   */
  private notify(event: BoardRegistryEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Listener errors must not break registration
      }
    }
  }

  /**
   * Registers a new board.
   * 
   * Change 428: Implements extension points for board definitions.
   * - Builtin boards use un-namespaced IDs (must be registered with isBuiltin=true)
   * - Extension boards must use namespaced IDs (namespace:name format)
   * 
   * @param board - The board to register
   * @param options - Registration options
   * @throws {Error} if board is invalid, ID already exists, or namespacing rules violated
   */
  register(board: Board, options: { isBuiltin?: boolean } = {}): void {
    // B033: Run validateBoard during registration
    assertValidBoard(board);

    // B032: Throw on duplicate ID
    if (this.boards.has(board.id)) {
      throw new Error(`Board with ID "${board.id}" is already registered`);
    }
    
    // Change 428: Enforce namespacing rules
    const isBuiltin = options.isBuiltin ?? false;
    const hasNamespace = isNamespacedId(board.id);
    
    if (isBuiltin) {
      // Builtin boards should NOT have namespace (but we allow it for flexibility)
      if (hasNamespace) {
        console.warn(`Builtin board '${board.id}' uses namespaced ID - this is unusual but allowed`);
      }
      this.builtinBoardIds.add(board.id);
    } else {
      // Extension boards MUST have namespace
      if (!hasNamespace) {
        throw new Error(
          `Extension board '${board.id}' must use namespaced ID (e.g., 'your-pack:${board.id}'). ` +
          `Only builtin boards can use un-namespaced IDs.`
        );
      }
      
      // Cannot override builtins
      if (this.builtinBoardIds.has(board.id)) {
        throw new Error(
          `Cannot register extension board '${board.id}': conflicts with builtin board`
        );
      }
    }

    this.boards.set(board.id, board);

    // L124: Notify listeners (KB update, etc.)
    this.notify({ type: 'register', board });
  }
  
  /**
   * Gets a board by ID.
   */
  get(boardId: string): Board | undefined {
    return this.boards.get(boardId);
  }
  
  /**
   * Lists all boards, sorted by category and name.
   */
  list(): Board[] {
    return Array.from(this.boards.values()).sort((a, b) => {
      // Sort by category first, then name
      const categoryCompare = (a.category ?? '').localeCompare(b.category ?? '');
      if (categoryCompare !== 0) return categoryCompare;
      return a.name.localeCompare(b.name);
    });
  }
  
  /**
   * Gets all boards (alias for list()).
   * Used by tests and devtools.
   */
  getAll(): Board[] {
    return this.list();
  }
  
  /**
   * Filters boards by control level.
   */
  getByControlLevel(level: ControlLevel): Board[] {
    return this.list().filter(b => b.controlLevel === level);
  }
  
  /**
   * Searches boards by text (name, description, tags).
   * C085: Fuzzy match implementation (prefix + contains, no deps).
   */
  search(text: string): Board[] {
    const query = text.toLowerCase().trim();
    if (!query) return this.list();
    
    const boards = this.list();
    const prefixMatches: Board[] = [];
    const containsMatches: Board[] = [];
    
    for (const board of boards) {
      let matched = false;
      let isPrefix = false;
      
      // Check name (highest priority)
      const name = board.name.toLowerCase();
      if (name.startsWith(query)) {
        isPrefix = true;
        matched = true;
      } else if (name.includes(query)) {
        matched = true;
      }
      
      // Check description (medium priority)
      if (!matched) {
        const desc = board.description.toLowerCase();
        if (desc.startsWith(query)) {
          isPrefix = true;
          matched = true;
        } else if (desc.includes(query)) {
          matched = true;
        }
      }
      
      // Check tags (lower priority)
      if (!matched && board.tags) {
        for (const tag of board.tags) {
          const tagLower = tag.toLowerCase();
          if (tagLower.startsWith(query)) {
            isPrefix = true;
            matched = true;
            break;
          } else if (tagLower.includes(query)) {
            matched = true;
            break;
          }
        }
      }
      
      // Check category (lowest priority)
      if (!matched && board.category) {
        const category = board.category.toLowerCase();
        if (category.startsWith(query)) {
          isPrefix = true;
          matched = true;
        } else if (category.includes(query)) {
          matched = true;
        }
      }
      
      // Add to appropriate list
      if (matched) {
        if (isPrefix) {
          prefixMatches.push(board);
        } else {
          containsMatches.push(board);
        }
      }
    }
    
    // Return prefix matches first, then contains matches
    return [...prefixMatches, ...containsMatches];
  }
  
  /**
   * Filters boards by difficulty level.
   */
  getByDifficulty(difficulty: BoardDifficulty): Board[] {
    return this.list().filter(b => b.difficulty === difficulty);
  }
  
  /**
   * Gets recommended boards for a user type.
   */
  getByUserType(userType: UserType): Board[] {
    const ids = getRecommendedBoardIds(userType);
    return ids.map(id => this.get(id)).filter((b): b is Board => b !== undefined);
  }
  
  /**
   * Gets the count of registered boards.
   */
  count(): number {
    return this.boards.size;
  }
  
  /**
   * Checks if a board ID is registered.
   */
  has(boardId: string): boolean {
    return this.boards.has(boardId);
  }
  
  /**
   * Unregisters a board (for testing/dynamic registration).
   * L124: Fires unregister event so KB can be updated.
   * Change 428: Prevents unregistering builtin boards unless forced.
   */
  unregister(boardId: string, options: { force?: boolean } = {}): boolean {
    // Change 428: Protect builtin boards from accidental unregistration
    if (this.builtinBoardIds.has(boardId) && !options.force) {
      throw new Error(
        `Cannot unregister builtin board '${boardId}' without force option`
      );
    }
    
    const board = this.boards.get(boardId);
    const deleted = this.boards.delete(boardId);
    if (deleted && board) {
      this.builtinBoardIds.delete(boardId);
      this.notify({ type: 'unregister', board });
    }
    return deleted;
  }
  
  /**
   * Clears all boards and listeners (for testing).
   * Change 428: Also clears builtin tracking.
   */
  clear(): void {
    this.boards.clear();
    this.listeners.clear();
    this.builtinBoardIds.clear();
  }
  
  /**
   * Gets the list of builtin board IDs.
   * Change 428: Helper for extension validation.
   */
  getBuiltinBoardIds(): string[] {
    return Array.from(this.builtinBoardIds);
  }
  
  /**
   * Checks if a board ID is a builtin.
   * Change 428: Helper for extension validation.
   */
  isBuiltin(boardId: string): boolean {
    return this.builtinBoardIds.has(boardId);
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let registryInstance: BoardRegistry | null = null;

/**
 * Gets the singleton board registry.
 */
export function getBoardRegistry(): BoardRegistry {
  if (!registryInstance) {
    registryInstance = new BoardRegistry();
  }
  return registryInstance;
}

/**
 * Resets the board registry (for testing).
 */
export function resetBoardRegistry(): void {
  registryInstance = null;
}
