/**
 * @fileoverview Preset Tagging System (M217–M224)
 *
 * Client-side system for tagging, searching, and managing preset favorites
 * and collections. All data is stored locally (no network).
 *
 * M217: Implement preset tagging system (genre, mood, type, character).
 * M218: Implement preset search by tags and characteristics.
 * M219: Implement preset favorites and collections.
 * M223: Add preset rating/review system (local only).
 * M224: Add preset comparison mode (A/B testing).
 *
 * @module @cardplay/ai/learning/preset-tagging
 */

// =============================================================================
// Types
// =============================================================================

/** A preset review with text and rating. */
export interface PresetReview {
  readonly id: string;
  readonly presetId: string;
  readonly rating: number;         // 1–5
  readonly text: string;
  readonly pros?: string[];
  readonly cons?: string[];
  readonly createdAt: number;
  readonly updatedAt: number;
}

/** A/B comparison session. */
export interface PresetComparison {
  readonly id: string;
  readonly presetA: string;
  readonly presetB: string;
  readonly winner?: 'A' | 'B' | 'tie';
  readonly notes?: string;
  readonly criteria?: ComparisonCriteria;
  readonly createdAt: number;
  readonly completedAt?: number;
}

/** Criteria for comparing presets. */
export interface ComparisonCriteria {
  readonly warmth?: 'A' | 'B' | 'tie';
  readonly brightness?: 'A' | 'B' | 'tie';
  readonly punch?: 'A' | 'B' | 'tie';
  readonly clarity?: 'A' | 'B' | 'tie';
  readonly character?: 'A' | 'B' | 'tie';
  readonly usability?: 'A' | 'B' | 'tie';
}

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
  private reviews: Map<string, PresetReview> = new Map();
  private comparisons: Map<string, PresetComparison> = new Map();
  private reviewIdCounter = 0;
  private comparisonIdCounter = 0;

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
  // M223: Reviews
  // ---------------------------------------------------------------------------

  /**
   * Add a review for a preset.
   */
  addReview(presetId: string, rating: number, text: string, pros?: string[], cons?: string[]): PresetReview {
    const id = `review_${++this.reviewIdCounter}`;
    const now = Date.now();
    const review: PresetReview = {
      id,
      presetId,
      rating: Math.max(1, Math.min(5, Math.round(rating))),
      text,
      ...(pros !== undefined && { pros }),
      ...(cons !== undefined && { cons }),
      createdAt: now,
      updatedAt: now,
    };
    this.reviews.set(id, review);
    
    // Also update the preset's rating (average of all reviews)
    this.updatePresetRatingFromReviews(presetId);
    
    return review;
  }

  /**
   * Update a review.
   */
  updateReview(reviewId: string, updates: { rating?: number; text?: string; pros?: string[]; cons?: string[] }): PresetReview | null {
    const existing = this.reviews.get(reviewId);
    if (!existing) return null;
    
    const updated: PresetReview = {
      ...existing,
      rating: updates.rating != null ? Math.max(1, Math.min(5, Math.round(updates.rating))) : existing.rating,
      text: updates.text ?? existing.text,
      ...(updates.pros !== undefined && { pros: updates.pros }),
      ...(updates.cons !== undefined && { cons: updates.cons }),
      updatedAt: Date.now(),
    };
    this.reviews.set(reviewId, updated);
    
    // Update preset rating
    this.updatePresetRatingFromReviews(updated.presetId);
    
    return updated;
  }

  /**
   * Delete a review.
   */
  deleteReview(reviewId: string): boolean {
    const review = this.reviews.get(reviewId);
    if (!review) return false;
    
    const deleted = this.reviews.delete(reviewId);
    if (deleted) {
      this.updatePresetRatingFromReviews(review.presetId);
    }
    return deleted;
  }

  /**
   * Get all reviews for a preset.
   */
  getReviewsForPreset(presetId: string): readonly PresetReview[] {
    return Array.from(this.reviews.values())
      .filter(r => r.presetId === presetId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get review statistics for a preset.
   */
  getReviewStats(presetId: string): { count: number; avgRating: number; distribution: Record<number, number> } {
    const reviews = this.getReviewsForPreset(presetId);
    if (reviews.length === 0) {
      return { count: 0, avgRating: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    }
    
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;
    for (const review of reviews) {
      distribution[review.rating] = (distribution[review.rating] ?? 0) + 1;
      total += review.rating;
    }
    
    return {
      count: reviews.length,
      avgRating: total / reviews.length,
      distribution,
    };
  }

  /**
   * Update preset rating based on review average.
   */
  private updatePresetRatingFromReviews(presetId: string): void {
    const preset = this.presets.get(presetId);
    if (!preset) return;
    
    const stats = this.getReviewStats(presetId);
    const newRating = stats.count > 0 ? Math.round(stats.avgRating) : 0;
    
    if (preset.rating !== newRating) {
      this.presets.set(presetId, {
        ...preset,
        rating: newRating,
        updatedAt: Date.now(),
      });
    }
  }

  // ---------------------------------------------------------------------------
  // M224: A/B Comparison
  // ---------------------------------------------------------------------------

  /**
   * Start a new A/B comparison session.
   */
  startComparison(presetAId: string, presetBId: string): PresetComparison {
    const id = `comparison_${++this.comparisonIdCounter}`;
    const comparison: PresetComparison = {
      id,
      presetA: presetAId,
      presetB: presetBId,
      createdAt: Date.now(),
    };
    this.comparisons.set(id, comparison);
    return comparison;
  }

  /**
   * Complete a comparison with a winner.
   */
  completeComparison(
    comparisonId: string,
    winner: 'A' | 'B' | 'tie',
    notes?: string,
    criteria?: ComparisonCriteria
  ): PresetComparison | null {
    const existing = this.comparisons.get(comparisonId);
    if (!existing) return null;
    
    const completed: PresetComparison = {
      ...existing,
      winner,
      ...(notes !== undefined && { notes }),
      ...(criteria !== undefined && { criteria }),
      completedAt: Date.now(),
    };
    this.comparisons.set(comparisonId, completed);
    return completed;
  }

  /**
   * Get comparison by ID.
   */
  getComparison(comparisonId: string): PresetComparison | undefined {
    return this.comparisons.get(comparisonId);
  }

  /**
   * Get all comparisons involving a preset.
   */
  getComparisonsForPreset(presetId: string): readonly PresetComparison[] {
    return Array.from(this.comparisons.values())
      .filter(c => c.presetA === presetId || c.presetB === presetId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get comparison history (all completed comparisons).
   */
  getComparisonHistory(): readonly PresetComparison[] {
    return Array.from(this.comparisons.values())
      .filter(c => c.completedAt != null)
      .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  }

  /**
   * Get win/loss record for a preset.
   */
  getPresetRecord(presetId: string): { wins: number; losses: number; ties: number } {
    let wins = 0, losses = 0, ties = 0;
    
    for (const comparison of this.comparisons.values()) {
      if (!comparison.winner) continue;
      
      if (comparison.presetA === presetId) {
        if (comparison.winner === 'A') wins++;
        else if (comparison.winner === 'B') losses++;
        else ties++;
      } else if (comparison.presetB === presetId) {
        if (comparison.winner === 'B') wins++;
        else if (comparison.winner === 'A') losses++;
        else ties++;
      }
    }
    
    return { wins, losses, ties };
  }

  /**
   * Delete a comparison.
   */
  deleteComparison(comparisonId: string): boolean {
    return this.comparisons.delete(comparisonId);
  }

  // ---------------------------------------------------------------------------
  // Export / Import
  // ---------------------------------------------------------------------------

  /**
   * Export all preset data including reviews and comparisons.
   */
  exportData(): {
    presets: TaggedPreset[];
    collections: Array<{ id: string; name: string; description: string; createdAt: number }>;
    reviews: PresetReview[];
    comparisons: PresetComparison[];
  } {
    return {
      presets: Array.from(this.presets.values()),
      collections: Array.from(this.collections.entries()).map(([id, c]) => ({ id, ...c })),
      reviews: Array.from(this.reviews.values()),
      comparisons: Array.from(this.comparisons.values()),
    };
  }

  /**
   * Import preset data (merges with existing).
   */
  importData(data: {
    presets: TaggedPreset[];
    collections: Array<{ id: string; name: string; description: string; createdAt: number }>;
    reviews?: PresetReview[];
    comparisons?: PresetComparison[];
  }): void {
    for (const preset of data.presets) {
      this.presets.set(preset.id, preset);
    }
    for (const col of data.collections) {
      this.collections.set(col.id, { name: col.name, description: col.description, createdAt: col.createdAt });
    }
    if (data.reviews) {
      for (const review of data.reviews) {
        this.reviews.set(review.id, review);
      }
    }
    if (data.comparisons) {
      for (const comparison of data.comparisons) {
        this.comparisons.set(comparison.id, comparison);
      }
    }
  }

  /**
   * Clear all data.
   */
  clear(): void {
    this.presets.clear();
    this.collections.clear();
    this.reviews.clear();
    this.comparisons.clear();
    this.reviewIdCounter = 0;
    this.comparisonIdCounter = 0;
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
