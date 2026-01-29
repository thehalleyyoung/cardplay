/**
 * @fileoverview Tests for Preset Tagging System (M217–M221)
 *
 * M217: Preset tagging (genre, mood, type, character)
 * M218: Preset search by tags and characteristics
 * M219: Preset favorites and collections
 * M220: Preset search finds relevant sounds quickly
 * M221: Tagging system is consistent and useful
 *
 * @module @cardplay/ai/learning/preset-tagging.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PresetTaggingStore } from './preset-tagging';
import type { TaggedPreset } from './preset-tagging';

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
});
