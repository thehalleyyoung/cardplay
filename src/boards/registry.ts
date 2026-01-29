/**
 * @fileoverview Board Registry
 * 
 * Central registry for all available boards. Boards must be registered
 * before they can be used. Supports filtering, searching, and recommendations.
 * 
 * @module @cardplay/boards/registry
 */

import type { Board, ControlLevel, BoardDifficulty } from './types';
import { assertValidBoard } from './validate';

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
   * @throws {Error} if board is invalid or ID already exists
   */
  register(board: Board): void {
    // B033: Run validateBoard during registration
    assertValidBoard(board);

    // B032: Throw on duplicate ID
    if (this.boards.has(board.id)) {
      throw new Error(`Board with ID "${board.id}" is already registered`);
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
   * Filters boards by control level.
   */
  getByControlLevel(level: ControlLevel): Board[] {
    return this.list().filter(b => b.controlLevel === level);
  }
  
  /**
   * Searches boards by text (name, description, tags).
   */
  search(text: string): Board[] {
    const query = text.toLowerCase().trim();
    if (!query) return this.list();
    
    return this.list().filter(board => {
      // Search in name
      if (board.name.toLowerCase().includes(query)) return true;
      
      // Search in description
      if (board.description.toLowerCase().includes(query)) return true;
      
      // Search in tags
      if (board.tags?.some(tag => tag.toLowerCase().includes(query))) return true;
      
      // Search in category
      if (board.category?.toLowerCase().includes(query)) return true;
      
      return false;
    });
  }
  
  /**
   * Filters boards by difficulty level.
   */
  getByDifficulty(difficulty: BoardDifficulty): Board[] {
    return this.list().filter(b => b.difficulty === difficulty);
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
   */
  unregister(boardId: string): boolean {
    const board = this.boards.get(boardId);
    const deleted = this.boards.delete(boardId);
    if (deleted && board) {
      this.notify({ type: 'unregister', board });
    }
    return deleted;
  }
  
  /**
   * Clears all boards and listeners (for testing).
   */
  clear(): void {
    this.boards.clear();
    this.listeners.clear();
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
