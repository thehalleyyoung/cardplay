/**
 * @fileoverview Tests for Preset Tagging System (M217–M224)
 *
 * M217: Preset tagging (genre, mood, type, character)
 * M218: Preset search by tags and characteristics
 * M219: Preset favorites and collections
 * M220: Preset search finds relevant sounds quickly
 * M221: Tagging system is consistent and useful
 * M223: Preset rating/review system (local only)
 * M224: Preset comparison mode (A/B testing)
 *
 * @module @cardplay/ai/learning/preset-tagging.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PresetTaggingStore } from './preset-tagging';
import type { TaggedPreset, ComparisonCriteria } from './preset-tagging';

describe('PresetTaggingStore', () => {
  let store: PresetTaggingStore;

  beforeEach(() => {
    store = new PresetTaggingStore();
  });

  // ===========================================================================
  // M217: Tagging
  // ===========================================================================
  describe('M217: Tagging', () => {
    it('adds a preset with tags', () => {
      const preset = store.addPreset({
        id: 'p1',
        name: 'Warm Pad',
        category: 'pad',
        tags: ['warm', 'ambient'],
        author: 'user',
        genre: 'ambient',
        mood: 'calm',
        character: 'warm',
        favorite: false,
        rating: 0,
      });
      expect(preset.id).toBe('p1');
      expect(preset.tags).toEqual(['warm', 'ambient']);
      expect(preset.createdAt).toBeGreaterThan(0);
      expect(store.size).toBe(1);
    });

    it('updates tags for a preset', () => {
      store.addPreset({
        id: 'p1',
        name: 'Warm Pad',
        category: 'pad',
        tags: ['warm'],
        author: 'user',
        favorite: false,
        rating: 0,
      });
      const updated = store.updateTags('p1', ['warm', 'lush', 'evolving']);
      expect(updated).not.toBeNull();
      expect(updated!.tags).toEqual(['warm', 'lush', 'evolving']);
    });

    it('adds a tag idempotently', () => {
      store.addPreset({
        id: 'p1',
        name: 'Lead',
        category: 'lead',
        tags: ['bright'],
        author: 'user',
        favorite: false,
        rating: 0,
      });
      store.addTag('p1', 'bright'); // already exists
      store.addTag('p1', 'aggressive');
      const preset = store.getPreset('p1');
      expect(preset!.tags).toEqual(['bright', 'aggressive']);
    });

    it('removes a tag', () => {
      store.addPreset({
        id: 'p1',
        name: 'Bass',
        category: 'bass',
        tags: ['sub', 'heavy', 'dark'],
        author: 'user',
        favorite: false,
        rating: 0,
      });
      store.removeTag('p1', 'heavy');
      const preset = store.getPreset('p1');
      expect(preset!.tags).toEqual(['sub', 'dark']);
    });

    it('batch-tags multiple presets', () => {
      store.addPreset({ id: 'p1', name: 'Pad A', category: 'pad', tags: [], author: 'user', favorite: false, rating: 0 });
      store.addPreset({ id: 'p2', name: 'Pad B', category: 'pad', tags: [], author: 'user', favorite: false, rating: 0 });
      store.addPreset({ id: 'p3', name: 'Lead', category: 'lead', tags: [], author: 'user', favorite: false, rating: 0 });
      const count = store.batchTag(['p1', 'p2', 'p3'], 'electronic');
      expect(count).toBe(3);
      expect(store.getPreset('p1')!.tags).toContain('electronic');
      expect(store.getPreset('p3')!.tags).toContain('electronic');
    });

    it('updates metadata', () => {
      store.addPreset({ id: 'p1', name: 'Sound', category: 'pad', tags: [], author: 'user', favorite: false, rating: 0 });
      store.updateMetadata('p1', { genre: 'ambient', mood: 'dreamy', character: 'warm' });
      const preset = store.getPreset('p1');
      expect(preset!.genre).toBe('ambient');
      expect(preset!.mood).toBe('dreamy');
      expect(preset!.character).toBe('warm');
    });

    it('returns tag usage counts', () => {
      store.addPreset({ id: 'p1', name: 'A', category: 'pad', tags: ['warm', 'ambient'], author: 'user', favorite: false, rating: 0 });
      store.addPreset({ id: 'p2', name: 'B', category: 'pad', tags: ['warm', 'lush'], author: 'user', favorite: false, rating: 0 });
      store.addPreset({ id: 'p3', name: 'C', category: 'lead', tags: ['bright'], author: 'user', favorite: false, rating: 0 });
      const usage = store.getTagUsage();
      expect(usage[0].tag).toBe('warm');
      expect(usage[0].count).toBe(2);
    });

    it('deletes a preset', () => {
      store.addPreset({ id: 'p1', name: 'A', category: 'pad', tags: [], author: 'user', favorite: false, rating: 0 });
      expect(store.deletePreset('p1')).toBe(true);
      expect(store.size).toBe(0);
      expect(store.getPreset('p1')).toBeNull();
    });
  });

  // ===========================================================================
  // M218: Search
  // ===========================================================================
  describe('M218: Search', () => {
    function seed(): void {
      store.addPreset({ id: 'p1', name: 'Warm Pad', category: 'pad', tags: ['warm', 'ambient'], author: 'user', genre: 'ambient', mood: 'calm', character: 'warm', favorite: true, rating: 5 });
      store.addPreset({ id: 'p2', name: 'Growl Bass', category: 'bass', tags: ['aggressive', 'heavy'], author: 'user', genre: 'dubstep', mood: 'dark', character: 'metallic', favorite: false, rating: 4 });
      store.addPreset({ id: 'p3', name: 'Bright Lead', category: 'lead', tags: ['bright', 'sharp'], author: 'user', genre: 'pop', mood: 'uplifting', character: 'digital', favorite: true, rating: 3 });
      store.addPreset({ id: 'p4', name: 'Dark Pad', category: 'pad', tags: ['dark', 'ambient', 'evolving'], author: 'user', genre: 'ambient', mood: 'dark', character: 'warm', favorite: false, rating: 4 });
    }

    it('searches by text query', () => {
      seed();
      const result = store.searchPresets({ query: 'pad' });
      expect(result.total).toBe(2);
    });

    it('searches by category', () => {
      seed();
      const result = store.searchPresets({ category: 'bass' });
      expect(result.total).toBe(1);
      expect(result.presets[0].name).toBe('Growl Bass');
    });

    it('searches by tags (all must match)', () => {
      seed();
      const result = store.searchPresets({ tags: ['ambient'] });
      expect(result.total).toBe(2);

      const result2 = store.searchPresets({ tags: ['ambient', 'evolving'] });
      expect(result2.total).toBe(1);
      expect(result2.presets[0].id).toBe('p4');
    });

    it('searches by genre', () => {
      seed();
      const result = store.searchPresets({ genre: 'ambient' });
      expect(result.total).toBe(2);
    });

    it('searches by mood', () => {
      seed();
      const result = store.searchPresets({ mood: 'dark' });
      expect(result.total).toBe(2);
    });

    it('searches by character', () => {
      seed();
      const result = store.searchPresets({ character: 'warm' });
      expect(result.total).toBe(2);
    });

    it('filters favorites only', () => {
      seed();
      const result = store.searchPresets({ favoritesOnly: true });
      expect(result.total).toBe(2);
    });

    it('filters by minimum rating', () => {
      seed();
      const result = store.searchPresets({ minRating: 4 });
      expect(result.total).toBe(3); // rating 5, 4, 4
    });

    it('combines multiple filters', () => {
      seed();
      const result = store.searchPresets({ genre: 'ambient', mood: 'dark' });
      expect(result.total).toBe(1);
      expect(result.presets[0].id).toBe('p4');
    });

    it('sorts by rating descending', () => {
      seed();
      const result = store.searchPresets({ sortBy: 'rating', sortDirection: 'desc' });
      expect(result.presets[0].rating).toBe(5);
    });

    it('limits results', () => {
      seed();
      const result = store.searchPresets({ limit: 2 });
      expect(result.presets.length).toBe(2);
      expect(result.total).toBe(4);
    });

    it('finds presets quickly with combined criteria', () => {
      // Simulate larger library
      for (let i = 0; i < 100; i++) {
        store.addPreset({
          id: `preset-${i}`,
          name: `Preset ${i}`,
          category: i % 3 === 0 ? 'pad' : i % 3 === 1 ? 'lead' : 'bass',
          tags: i % 2 === 0 ? ['even', 'tag-a'] : ['odd', 'tag-b'],
          author: 'user',
          genre: i % 4 === 0 ? 'ambient' : 'electronic',
          favorite: i % 5 === 0,
          rating: i % 6,
        });
      }
      const result = store.searchPresets({ category: 'pad', tags: ['even'], genre: 'ambient' });
      expect(result.total).toBeGreaterThan(0);
      result.presets.forEach((p) => {
        expect(p.category).toBe('pad');
        expect(p.tags).toContain('even');
        expect(p.genre).toBe('ambient');
      });
    });
  });

  // ===========================================================================
  // M219: Favorites & Collections
  // ===========================================================================
  describe('M219: Favorites & Collections', () => {
    it('toggles favorite', () => {
      store.addPreset({ id: 'p1', name: 'Sound', category: 'pad', tags: [], author: 'user', favorite: false, rating: 0 });
      const toggled = store.toggleFavorite('p1');
      expect(toggled!.favorite).toBe(true);
      const toggledBack = store.toggleFavorite('p1');
      expect(toggledBack!.favorite).toBe(false);
    });

    it('sets rating clamped to 0-5', () => {
      store.addPreset({ id: 'p1', name: 'Sound', category: 'pad', tags: [], author: 'user', favorite: false, rating: 0 });
      store.setRating('p1', 4);
      expect(store.getPreset('p1')!.rating).toBe(4);
      store.setRating('p1', 10);
      expect(store.getPreset('p1')!.rating).toBe(5);
      store.setRating('p1', -3);
      expect(store.getPreset('p1')!.rating).toBe(0);
    });

    it('creates and lists collections', () => {
      store.createCollection('col1', 'My Pads', 'Favorite pad sounds');
      store.createCollection('col2', 'Bass Library', 'All bass presets');
      const collections = store.listCollections();
      expect(collections.length).toBe(2);
      expect(collections[0].name).toBe('My Pads');
    });

    it('assigns presets to collections', () => {
      store.addPreset({ id: 'p1', name: 'Pad', category: 'pad', tags: [], author: 'user', favorite: false, rating: 0 });
      store.addPreset({ id: 'p2', name: 'Lead', category: 'lead', tags: [], author: 'user', favorite: false, rating: 0 });
      store.createCollection('col1', 'My Sounds');
      store.assignToCollection('p1', 'col1');
      store.assignToCollection('p2', 'col1');

      const result = store.searchPresets({ collection: 'col1' });
      expect(result.total).toBe(2);

      const collections = store.listCollections();
      expect(collections[0].presetCount).toBe(2);
    });

    it('removes preset from collection', () => {
      store.addPreset({ id: 'p1', name: 'Pad', category: 'pad', tags: [], author: 'user', favorite: false, rating: 0 });
      store.createCollection('col1', 'My Sounds');
      store.assignToCollection('p1', 'col1');
      store.removeFromCollection('p1');
      expect(store.getPreset('p1')!.collection).toBeUndefined();
    });

    it('deletes collection and unassigns presets', () => {
      store.addPreset({ id: 'p1', name: 'Pad', category: 'pad', tags: [], author: 'user', favorite: false, rating: 0 });
      store.createCollection('col1', 'My Sounds');
      store.assignToCollection('p1', 'col1');
      store.deleteCollection('col1');
      expect(store.getPreset('p1')!.collection).toBeUndefined();
      expect(store.listCollections().length).toBe(0);
    });

    it('gets favorites list', () => {
      store.addPreset({ id: 'p1', name: 'A', category: 'pad', tags: [], author: 'user', favorite: true, rating: 0 });
      store.addPreset({ id: 'p2', name: 'B', category: 'bass', tags: [], author: 'user', favorite: false, rating: 0 });
      store.addPreset({ id: 'p3', name: 'C', category: 'lead', tags: [], author: 'user', favorite: true, rating: 0 });
      expect(store.getFavorites().length).toBe(2);
    });
  });

  // ===========================================================================
  // Export / Import
  // ===========================================================================
  describe('Export / Import', () => {
    it('exports and imports data', () => {
      store.addPreset({ id: 'p1', name: 'Pad', category: 'pad', tags: ['warm'], author: 'user', favorite: true, rating: 5 });
      store.createCollection('col1', 'Favorites');
      store.assignToCollection('p1', 'col1');

      const exported = store.exportData();
      expect(exported.presets.length).toBe(1);
      expect(exported.collections.length).toBe(1);

      const store2 = new PresetTaggingStore();
      store2.importData(exported);
      expect(store2.size).toBe(1);
      expect(store2.getPreset('p1')!.favorite).toBe(true);
      expect(store2.listCollections().length).toBe(1);
    });

    it('clears all data', () => {
      store.addPreset({ id: 'p1', name: 'A', category: 'pad', tags: [], author: 'user', favorite: false, rating: 0 });
      store.createCollection('col1', 'Col');
      store.clear();
      expect(store.size).toBe(0);
      expect(store.listCollections().length).toBe(0);
    });
  });

  // ===========================================================================
  // M223: Reviews
  // ===========================================================================
  describe('M223: Preset rating/review system', () => {
    beforeEach(() => {
      store.addPreset({ id: 'p1', name: 'Test Preset', category: 'pad', tags: [], author: 'user', favorite: false, rating: 0 });
    });

    it('adds a review for a preset', () => {
      const review = store.addReview('p1', 4, 'Great warm sound!', ['Warm', 'Rich'], ['CPU heavy']);
      expect(review.id).toMatch(/^review_/);
      expect(review.presetId).toBe('p1');
      expect(review.rating).toBe(4);
      expect(review.text).toBe('Great warm sound!');
      expect(review.pros).toEqual(['Warm', 'Rich']);
      expect(review.cons).toEqual(['CPU heavy']);
    });

    it('updates preset rating based on review average', () => {
      store.addReview('p1', 5, 'Excellent!');
      store.addReview('p1', 3, 'Okay.');
      store.addReview('p1', 4, 'Good.');
      
      const preset = store.getPreset('p1');
      // Average is 4, should round to 4
      expect(preset!.rating).toBe(4);
    });

    it('updates a review', () => {
      const review = store.addReview('p1', 3, 'Initial review');
      // Wait a tiny bit to ensure different timestamp
      const updated = store.updateReview(review.id, { rating: 5, text: 'Changed my mind!' });
      
      expect(updated).not.toBeNull();
      expect(updated!.rating).toBe(5);
      expect(updated!.text).toBe('Changed my mind!');
      // updatedAt should be >= createdAt (may be same millisecond)
      expect(updated!.updatedAt).toBeGreaterThanOrEqual(updated!.createdAt);
    });

    it('deletes a review and updates preset rating', () => {
      const r1 = store.addReview('p1', 5, 'Great!');
      store.addReview('p1', 1, 'Bad!');
      
      // Before delete: avg = 3
      expect(store.getPreset('p1')!.rating).toBe(3);
      
      store.deleteReview(r1.id);
      
      // After delete: only 1-star review remains
      expect(store.getPreset('p1')!.rating).toBe(1);
    });

    it('gets reviews for a preset', () => {
      store.addReview('p1', 5, 'Review 1');
      store.addReview('p1', 4, 'Review 2');
      store.addReview('p1', 3, 'Review 3');
      
      const reviews = store.getReviewsForPreset('p1');
      expect(reviews).toHaveLength(3);
      // All reviews belong to p1
      expect(reviews.every(r => r.presetId === 'p1')).toBe(true);
    });

    it('gets review statistics', () => {
      store.addReview('p1', 5, 'A');
      store.addReview('p1', 5, 'B');
      store.addReview('p1', 4, 'C');
      store.addReview('p1', 3, 'D');
      
      const stats = store.getReviewStats('p1');
      expect(stats.count).toBe(4);
      expect(stats.avgRating).toBeCloseTo(4.25);
      expect(stats.distribution[5]).toBe(2);
      expect(stats.distribution[4]).toBe(1);
      expect(stats.distribution[3]).toBe(1);
    });

    it('clamps rating to 1-5 range', () => {
      const r1 = store.addReview('p1', 10, 'Too high');
      const r2 = store.addReview('p1', -5, 'Too low');
      
      expect(r1.rating).toBe(5);
      expect(r2.rating).toBe(1);
    });
  });

  // ===========================================================================
  // M224: A/B Comparison
  // ===========================================================================
  describe('M224: Preset comparison mode (A/B testing)', () => {
    beforeEach(() => {
      store.addPreset({ id: 'pA', name: 'Preset A', category: 'pad', tags: [], author: 'user', favorite: false, rating: 0 });
      store.addPreset({ id: 'pB', name: 'Preset B', category: 'pad', tags: [], author: 'user', favorite: false, rating: 0 });
      store.addPreset({ id: 'pC', name: 'Preset C', category: 'pad', tags: [], author: 'user', favorite: false, rating: 0 });
    });

    it('starts a comparison session', () => {
      const comparison = store.startComparison('pA', 'pB');
      
      expect(comparison.id).toMatch(/^comparison_/);
      expect(comparison.presetA).toBe('pA');
      expect(comparison.presetB).toBe('pB');
      expect(comparison.winner).toBeUndefined();
      expect(comparison.completedAt).toBeUndefined();
    });

    it('completes a comparison with a winner', () => {
      const comp = store.startComparison('pA', 'pB');
      const completed = store.completeComparison(comp.id, 'A', 'Preset A had more warmth');
      
      expect(completed).not.toBeNull();
      expect(completed!.winner).toBe('A');
      expect(completed!.notes).toBe('Preset A had more warmth');
      expect(completed!.completedAt).toBeGreaterThan(0);
    });

    it('completes a comparison with criteria', () => {
      const comp = store.startComparison('pA', 'pB');
      const criteria: ComparisonCriteria = {
        warmth: 'A',
        brightness: 'B',
        punch: 'A',
        clarity: 'tie',
        character: 'A',
        usability: 'B',
      };
      
      const completed = store.completeComparison(comp.id, 'A', 'Close match', criteria);
      
      expect(completed!.criteria).toEqual(criteria);
    });

    it('gets comparison by ID', () => {
      const comp = store.startComparison('pA', 'pB');
      const retrieved = store.getComparison(comp.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved!.presetA).toBe('pA');
    });

    it('gets comparisons for a preset', () => {
      store.startComparison('pA', 'pB');
      store.startComparison('pA', 'pC');
      store.startComparison('pB', 'pC');
      
      const compsA = store.getComparisonsForPreset('pA');
      const compsC = store.getComparisonsForPreset('pC');
      
      expect(compsA).toHaveLength(2);
      expect(compsC).toHaveLength(2);
    });

    it('gets comparison history (completed only)', () => {
      const c1 = store.startComparison('pA', 'pB');
      const c2 = store.startComparison('pA', 'pC');
      store.startComparison('pB', 'pC'); // Not completed
      
      store.completeComparison(c1.id, 'A');
      store.completeComparison(c2.id, 'B');
      
      const history = store.getComparisonHistory();
      expect(history).toHaveLength(2);
    });

    it('tracks win/loss record for a preset', () => {
      const c1 = store.startComparison('pA', 'pB');
      const c2 = store.startComparison('pA', 'pC');
      const c3 = store.startComparison('pB', 'pA');
      const c4 = store.startComparison('pC', 'pA');
      
      store.completeComparison(c1.id, 'A'); // pA wins
      store.completeComparison(c2.id, 'A'); // pA wins
      store.completeComparison(c3.id, 'B'); // pA wins (as B)
      store.completeComparison(c4.id, 'tie'); // tie
      
      const record = store.getPresetRecord('pA');
      expect(record.wins).toBe(3);
      expect(record.losses).toBe(0);
      expect(record.ties).toBe(1);
    });

    it('deletes a comparison', () => {
      const comp = store.startComparison('pA', 'pB');
      expect(store.getComparison(comp.id)).toBeDefined();
      
      const deleted = store.deleteComparison(comp.id);
      expect(deleted).toBe(true);
      expect(store.getComparison(comp.id)).toBeUndefined();
    });
  });
});
