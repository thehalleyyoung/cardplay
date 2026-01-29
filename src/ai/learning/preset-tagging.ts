/**
 * @fileoverview Preset Tagging System (M217–M219)
 *
 * Client-side system for tagging, searching, and managing preset favorites
 * and collections. All data is stored locally (no network).
 *
 * M217: Implement preset tagging system (genre, mood, type, character).
 * M218: Implement preset search by tags and characteristics.
 * M219: Implement preset favorites and collections.
 *
 * @module @cardplay/ai/learning/preset-tagging
 */

// =============================================================================
// Types
// =============================================================================

/** A tagged preset with metadata. */
export interface TaggedPreset {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly author: string;
  readonly genre?: string;
  readonly mood?: string;
  readonly character?: string;
  readonly favorite: boolean;
  readonly rating: number;         // 0–5
  readonly collection?: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

/** Criteria for searching presets. */
export interface PresetSearchCriteria {
  readonly query?: string;
  readonly category?: string;
  readonly tags?: readonly string[];
  readonly genre?: string;
  readonly mood?: string;
  readonly character?: string;
  readonly favoritesOnly?: boolean;
  readonly minRating?: number;
  readonly collection?: string;
  readonly sortBy?: 'name' | 'rating' | 'createdAt' | 'updatedAt';
  readonly sortDirection?: 'asc' | 'desc';
  readonly limit?: number;
}

/** Result of a preset search. */
export interface PresetSearchResult {
  readonly presets: readonly TaggedPreset[];
  readonly total: number;
}

/** Summary of preset tag usage. */
export interface TagUsageSummary {
  readonly tag: string;
  readonly count: number;
}

/** Collection definition. */
export interface PresetCollection {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly presetCount: number;
  readonly createdAt: number;
}

// =============================================================================
// Preset Tagging Store
// =============================================================================

/**
 * In-memory preset tagging store.
 *
 * Provides CRUD operations for preset metadata, tag management,
 * search, favorites, and collections. All local-only.
 */
export class PresetTaggingStore {
  private presets: Map<string, TaggedPreset> = new Map();
  private collections: Map<string, { name: string; description: string; createdAt: number }> = new Map();

  // ---------------------------------------------------------------------------
  // M217: Tagging
  // ---------------------------------------------------------------------------

  /**
   * Register a preset with metadata and tags.
   */
  addPreset(preset: Omit<TaggedPreset, 'createdAt' | 'updatedAt'>): TaggedPreset {
    const now = Date.now();
    const full: TaggedPreset = {
      ...preset,
      createdAt: now,
      updatedAt: now,
    };
    this.presets.set(preset.id, full);
    return full;
  }

  /**
   * Update tags for a preset.
   */
  updateTags(presetId: string, tags: readonly string[]): TaggedPreset | null {
    const existing = this.presets.get(presetId);
    if (!existing) return null;
    const updated: TaggedPreset = { ...existing, tags, updatedAt: Date.now() };
    this.presets.set(presetId, updated);
    return updated;
  }

  /**
   * Add a tag to a preset (idempotent).
   */
  addTag(presetId: string, tag: string): TaggedPreset | null {
    const existing = this.presets.get(presetId);
    if (!existing) return null;
    if (existing.tags.includes(tag)) return existing;
    return this.updateTags(presetId, [...existing.tags, tag]);
  }

  /**
   * Remove a tag from a preset.
   */
  removeTag(presetId: string, tag: string): TaggedPreset | null {
    const existing = this.presets.get(presetId);
    if (!existing) return null;
    return this.updateTags(presetId, existing.tags.filter((t) => t !== tag));
  }

  /**
   * Batch-tag multiple presets.
   */
  batchTag(presetIds: readonly string[], tag: string): number {
    let count = 0;
    for (const id of presetIds) {
      if (this.addTag(id, tag)) count++;
    }
    return count;
  }

  /**
   * Update preset metadata (genre, mood, character, category).
   */
  updateMetadata(
    presetId: string,
    metadata: Partial<Pick<TaggedPreset, 'genre' | 'mood' | 'character' | 'category' | 'author'>>
  ): TaggedPreset | null {
    const existing = this.presets.get(presetId);
    if (!existing) return null;
    const updated: TaggedPreset = { ...existing, ...metadata, updatedAt: Date.now() };
    this.presets.set(presetId, updated);
    return updated;
  }

  /**
   * Get a preset by ID.
   */
  getPreset(presetId: string): TaggedPreset | null {
    return this.presets.get(presetId) ?? null;
  }

  /**
   * Delete a preset.
   */
  deletePreset(presetId: string): boolean {
    return this.presets.delete(presetId);
  }

  /**
   * Get all unique tags with usage counts.
   */
  getTagUsage(): TagUsageSummary[] {
    const counts = new Map<string, number>();
    for (const preset of this.presets.values()) {
      for (const tag of preset.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }

  // ---------------------------------------------------------------------------
  // M218: Search
  // ---------------------------------------------------------------------------

  /**
   * Search presets by criteria.
   */
  searchPresets(criteria: PresetSearchCriteria): PresetSearchResult {
    let results = Array.from(this.presets.values());

    // Filter by text query (matches name, tags, category, genre, mood, character)
    if (criteria.query) {
      const q = criteria.query.toLowerCase();
      results = results.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        (p.genre && p.genre.toLowerCase().includes(q)) ||
        (p.mood && p.mood.toLowerCase().includes(q)) ||
        (p.character && p.character.toLowerCase().includes(q))
      );
    }

    // Filter by category
    if (criteria.category) {
      results = results.filter((p) => p.category === criteria.category);
    }

    // Filter by tags (all specified tags must be present)
    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter((p) =>
        criteria.tags!.every((t) => p.tags.includes(t))
      );
    }

    // Filter by genre
    if (criteria.genre) {
      results = results.filter((p) => p.genre === criteria.genre);
    }

    // Filter by mood
    if (criteria.mood) {
      results = results.filter((p) => p.mood === criteria.mood);
    }

    // Filter by character
    if (criteria.character) {
      results = results.filter((p) => p.character === criteria.character);
    }

    // Filter favorites only
    if (criteria.favoritesOnly) {
      results = results.filter((p) => p.favorite);
    }

    // Filter minimum rating
    if (criteria.minRating != null) {
      results = results.filter((p) => p.rating >= criteria.minRating!);
    }

    // Filter by collection
    if (criteria.collection) {
      results = results.filter((p) => p.collection === criteria.collection);
    }

    const total = results.length;

    // Sort
    const sortBy = criteria.sortBy ?? 'name';
    const dir = criteria.sortDirection === 'desc' ? -1 : 1;
    results.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return dir * a.name.localeCompare(b.name);
        case 'rating':
          return dir * (a.rating - b.rating);
        case 'createdAt':
          return dir * (a.createdAt - b.createdAt);
        case 'updatedAt':
          return dir * (a.updatedAt - b.updatedAt);
        default:
          return 0;
      }
    });

    // Limit
    if (criteria.limit != null && criteria.limit > 0) {
      results = results.slice(0, criteria.limit);
    }

    return { presets: results, total };
  }

  // ---------------------------------------------------------------------------
  // M219: Favorites & Collections
  // ---------------------------------------------------------------------------

  /**
   * Toggle favorite status for a preset.
   */
  toggleFavorite(presetId: string): TaggedPreset | null {
    const existing = this.presets.get(presetId);
    if (!existing) return null;
    const updated: TaggedPreset = {
      ...existing,
      favorite: !existing.favorite,
      updatedAt: Date.now(),
    };
    this.presets.set(presetId, updated);
    return updated;
  }

  /**
   * Set rating for a preset (0–5).
   */
  setRating(presetId: string, rating: number): TaggedPreset | null {
    const existing = this.presets.get(presetId);
    if (!existing) return null;
    const clamped = Math.max(0, Math.min(5, Math.round(rating)));
    const updated: TaggedPreset = {
      ...existing,
      rating: clamped,
      updatedAt: Date.now(),
    };
    this.presets.set(presetId, updated);
    return updated;
  }

  /**
   * Create a collection.
   */
  createCollection(id: string, name: string, description = ''): PresetCollection {
    const col = { name, description, createdAt: Date.now() };
    this.collections.set(id, col);
    return {
      id,
      name,
      description,
      presetCount: this.getCollectionPresetCount(id),
      createdAt: col.createdAt,
    };
  }

  /**
   * Assign a preset to a collection.
   */
  assignToCollection(presetId: string, collectionId: string): TaggedPreset | null {
    const existing = this.presets.get(presetId);
    if (!existing) return null;
    const updated: TaggedPreset = {
      ...existing,
      collection: collectionId,
      updatedAt: Date.now(),
    };
    this.presets.set(presetId, updated);
    return updated;
  }

  /**
   * Remove a preset from its collection.
   */
  removeFromCollection(presetId: string): TaggedPreset | null {
    const existing = this.presets.get(presetId);
    if (!existing) return null;
    const { collection: _, ...rest } = existing;
    const updated: TaggedPreset = {
      ...rest,
      updatedAt: Date.now(),
    };
    this.presets.set(presetId, updated);
    return updated;
  }

  /**
   * List all collections.
   */
  listCollections(): PresetCollection[] {
    return Array.from(this.collections.entries()).map(([id, col]) => ({
      id,
      name: col.name,
      description: col.description,
      presetCount: this.getCollectionPresetCount(id),
      createdAt: col.createdAt,
    }));
  }

  /**
   * Delete a collection (does not delete presets, just unassigns them).
   */
  deleteCollection(collectionId: string): boolean {
    if (!this.collections.has(collectionId)) return false;
    // Unassign all presets from this collection
    for (const [id, preset] of this.presets.entries()) {
      if (preset.collection === collectionId) {
        const { collection: _, ...rest } = preset;
        this.presets.set(id, { ...rest, updatedAt: Date.now() });
      }
    }
    return this.collections.delete(collectionId);
  }

  /**
   * Get favorites list.
   */
  getFavorites(): readonly TaggedPreset[] {
    return Array.from(this.presets.values()).filter((p) => p.favorite);
  }

  // ---------------------------------------------------------------------------
  // Export / Import
  // ---------------------------------------------------------------------------

  /**
   * Export all preset data.
   */
  exportData(): { presets: TaggedPreset[]; collections: Array<{ id: string; name: string; description: string; createdAt: number }> } {
    return {
      presets: Array.from(this.presets.values()),
      collections: Array.from(this.collections.entries()).map(([id, c]) => ({ id, ...c })),
    };
  }

  /**
   * Import preset data (merges with existing).
   */
  importData(data: { presets: TaggedPreset[]; collections: Array<{ id: string; name: string; description: string; createdAt: number }> }): void {
    for (const preset of data.presets) {
      this.presets.set(preset.id, preset);
    }
    for (const col of data.collections) {
      this.collections.set(col.id, { name: col.name, description: col.description, createdAt: col.createdAt });
    }
  }

  /**
   * Clear all data.
   */
  clear(): void {
    this.presets.clear();
    this.collections.clear();
  }

  /**
   * Get total preset count.
   */
  get size(): number {
    return this.presets.size;
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private getCollectionPresetCount(collectionId: string): number {
    let count = 0;
    for (const preset of this.presets.values()) {
      if (preset.collection === collectionId) count++;
    }
    return count;
  }
}

// =============================================================================
// Singleton
// =============================================================================

let _store: PresetTaggingStore | null = null;

/**
 * Get the global preset tagging store.
 */
export function getPresetTaggingStore(): PresetTaggingStore {
  if (!_store) {
    _store = new PresetTaggingStore();
  }
  return _store;
}
