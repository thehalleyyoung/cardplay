/**
 * @fileoverview Deck Pack Registry
 * 
 * Implements O031-O032:
 * - Central registry for deck packs
 * - Search and discovery
 * - Installation tracking
 * 
 * @module @cardplay/boards/deck-packs/registry
 */

import type { DeckPack, DeckPackSearchOptions, DeckPackInstallation } from './types';

// --------------------------------------------------------------------------
// Registry Implementation
// --------------------------------------------------------------------------

class DeckPackRegistry {
  private packs = new Map<string, DeckPack>();
  private installations = new Map<string, DeckPackInstallation[]>(); // boardId -> installations

  /**
   * Register a deck pack
   */
  register(pack: DeckPack): void {
    if (this.packs.has(pack.id)) {
      throw new Error(`Deck pack "${pack.id}" is already registered`);
    }
    this.packs.set(pack.id, pack);
  }

  /**
   * Get a deck pack by ID
   */
  get(packId: string): DeckPack | undefined {
    return this.packs.get(packId);
  }

  /**
   * List all registered deck packs
   */
  list(): DeckPack[] {
    return Array.from(this.packs.values());
  }

  /**
   * Search deck packs with filters
   */
  search(options: DeckPackSearchOptions = {}): DeckPack[] {
    let results = this.list();

    // Filter by category
    if (options.category) {
      results = results.filter(p => p.category === options.category);
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      results = results.filter(p =>
        options.tags!.some(tag => p.tags.includes(tag))
      );
    }

    // Filter by persona
    if (options.persona) {
      results = results.filter(p =>
        p.targetPersonas?.includes(options.persona as any)
      );
    }

    // Filter by difficulty
    if (options.difficulty) {
      results = results.filter(p => p.difficulty === options.difficulty);
    }

    // Text search
    if (options.query) {
      const query = options.query.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return results;
  }

  /**
   * Get deck packs by category
   */
  getByCategory(category: DeckPack['category']): DeckPack[] {
    return this.list().filter(p => p.category === category);
  }

  /**
   * Record a deck pack installation
   */
  recordInstallation(installation: DeckPackInstallation): void {
    const installations = this.installations.get(installation.boardId) || [];
    installations.push(installation);
    this.installations.set(installation.boardId, installations);
  }

  /**
   * Get installations for a board
   */
  getInstallations(boardId: string): DeckPackInstallation[] {
    return this.installations.get(boardId) || [];
  }

  /**
   * Check if a pack is installed on a board
   */
  isInstalled(packId: string, boardId: string): boolean {
    const installations = this.getInstallations(boardId);
    return installations.some(i => i.packId === packId);
  }

  /**
   * Clear all registrations (for testing)
   */
  clear(): void {
    this.packs.clear();
    this.installations.clear();
  }
}

// --------------------------------------------------------------------------
// Singleton
// --------------------------------------------------------------------------

let deckPackRegistry: DeckPackRegistry | null = null;

export function getDeckPackRegistry(): DeckPackRegistry {
  if (!deckPackRegistry) {
    deckPackRegistry = new DeckPackRegistry();
  }
  return deckPackRegistry;
}

/**
 * Reset the singleton (for testing)
 */
export function resetDeckPackRegistry(): void {
  deckPackRegistry = null;
}
