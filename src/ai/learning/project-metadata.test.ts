/**
 * @fileoverview Project Metadata Tests
 *
 * M372-M374: Tests for project metadata, search/filtering, favorites.
 *
 * @module @cardplay/ai/learning/project-metadata.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createProjectMetadata,
  getProjectMetadata,
  updateProjectMetadata,
  deleteProjectMetadata,
  searchProjects,
  toggleProjectFavorite,
  getProjectCollections,
  getProjectGenres,
  getAllProjectTags,
  getProjectMetadataCount,
  resetProjectMetadata,
  exportProjectMetadata,
  importProjectMetadata,
} from './project-metadata';

describe('ProjectMetadata', () => {
  beforeEach(() => {
    resetProjectMetadata();
  });

  // ===========================================================================
  // M372: Project metadata CRUD
  // ===========================================================================

  describe('create and retrieve (M372)', () => {
    it('creates project metadata with all fields', () => {
      const p = createProjectMetadata('My Song', {
        genre: 'lofi',
        subGenre: 'hip-hop',
        tempo: 85,
        key: { root: 'C', mode: 'minor' },
        timeSignature: { numerator: 4, denominator: 4 },
        tags: ['chill', 'study'],
        rating: 4,
      });

      expect(p.projectId).toBeTruthy();
      expect(p.name).toBe('My Song');
      expect(p.genre).toBe('lofi');
      expect(p.tempo).toBe(85);
      expect(p.key).toEqual({ root: 'C', mode: 'minor' });
      expect(p.tags).toContain('chill');
      expect(p.rating).toBe(4);
      expect(p.favorite).toBe(false);
    });

    it('creates project with default values', () => {
      const p = createProjectMetadata('Untitled');
      expect(p.genre).toBe('');
      expect(p.tempo).toBeNull();
      expect(p.key).toBeNull();
      expect(p.timeSignature).toEqual({ numerator: 4, denominator: 4 });
      expect(p.tags).toEqual([]);
      expect(p.rating).toBeNull();
    });

    it('retrieves project by ID', () => {
      const p = createProjectMetadata('Test');
      const retrieved = getProjectMetadata(p.projectId);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.name).toBe('Test');
    });

    it('returns null for unknown ID', () => {
      expect(getProjectMetadata('nonexistent')).toBeNull();
    });
  });

  describe('update and delete (M372)', () => {
    it('updates project metadata fields', () => {
      const p = createProjectMetadata('Original', { genre: 'house' });
      const updated = updateProjectMetadata(p.projectId, {
        name: 'Renamed',
        genre: 'techno',
        tempo: 130,
      });
      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('Renamed');
      expect(updated!.genre).toBe('techno');
      expect(updated!.tempo).toBe(130);
    });

    it('update returns null for unknown project', () => {
      expect(updateProjectMetadata('nope', { name: 'x' })).toBeNull();
    });

    it('deletes project metadata', () => {
      const p = createProjectMetadata('Deletable');
      expect(deleteProjectMetadata(p.projectId)).toBe(true);
      expect(getProjectMetadata(p.projectId)).toBeNull();
    });

    it('delete returns false for unknown project', () => {
      expect(deleteProjectMetadata('nope')).toBe(false);
    });
  });

  // ===========================================================================
  // M373: Search and filtering
  // ===========================================================================

  describe('search and filter (M373)', () => {
    beforeEach(() => {
      createProjectMetadata('Lo-fi Beats', { genre: 'lofi', tempo: 85, tags: ['chill', 'study'], key: { root: 'C', mode: 'minor' } });
      createProjectMetadata('Techno Banger', { genre: 'techno', tempo: 140, tags: ['club', 'dark'], key: { root: 'A', mode: 'minor' } });
      createProjectMetadata('Film Score', { genre: 'cinematic', tempo: 90, tags: ['epic', 'orchestra'], key: { root: 'D', mode: 'major' } });
      createProjectMetadata('Jazz Standard', { genre: 'jazz', tempo: 120, tags: ['swing', 'standards'], rating: 5 });
    });

    it('returns all projects when no criteria', () => {
      const results = searchProjects();
      expect(results).toHaveLength(4);
    });

    it('filters by genre', () => {
      const results = searchProjects({ genre: 'techno' });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Techno Banger');
    });

    it('filters by tags', () => {
      const results = searchProjects({ tags: ['chill'] });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Lo-fi Beats');
    });

    it('filters by text query across name, genre, tags', () => {
      const results = searchProjects({ query: 'film' });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Film Score');
    });

    it('filters by tempo range', () => {
      const results = searchProjects({ tempoRange: { min: 100, max: 150 } });
      expect(results).toHaveLength(2); // techno 140 + jazz 120
    });

    it('filters by key root', () => {
      const results = searchProjects({ keyRoot: 'C' });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Lo-fi Beats');
    });

    it('filters by key mode', () => {
      const results = searchProjects({ keyMode: 'minor' });
      expect(results).toHaveLength(2); // lofi + techno
    });

    it('filters by minimum rating', () => {
      const results = searchProjects({ minRating: 4 });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Jazz Standard');
    });

    it('sorts by name ascending', () => {
      const results = searchProjects({ sortBy: 'name', sortDirection: 'asc' });
      expect(results[0].name).toBe('Film Score');
      expect(results[results.length - 1].name).toBe('Techno Banger');
    });

    it('sorts by tempo descending', () => {
      const results = searchProjects({ sortBy: 'tempo', sortDirection: 'desc' });
      expect(results[0].tempo).toBe(140);
    });

    it('combines multiple filters', () => {
      const results = searchProjects({
        keyMode: 'minor',
        tempoRange: { min: 80, max: 100 },
      });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Lo-fi Beats');
    });
  });

  // ===========================================================================
  // M374: Favorites and collections
  // ===========================================================================

  describe('favorites and collections (M374)', () => {
    it('toggles favorite status', () => {
      const p = createProjectMetadata('Fav Test');
      expect(p.favorite).toBe(false);
      toggleProjectFavorite(p.projectId);
      expect(getProjectMetadata(p.projectId)!.favorite).toBe(true);
      toggleProjectFavorite(p.projectId);
      expect(getProjectMetadata(p.projectId)!.favorite).toBe(false);
    });

    it('filters favorites only', () => {
      const p1 = createProjectMetadata('NotFav');
      const p2 = createProjectMetadata('IsFav');
      toggleProjectFavorite(p2.projectId);
      const results = searchProjects({ favoritesOnly: true });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('IsFav');
    });

    it('tracks collections', () => {
      createProjectMetadata('A', { collection: 'Album 1' });
      createProjectMetadata('B', { collection: 'Album 1' });
      createProjectMetadata('C', { collection: 'Album 2' });
      createProjectMetadata('D');

      const collections = getProjectCollections();
      expect(collections).toEqual(['Album 1', 'Album 2']);
    });

    it('filters by collection', () => {
      createProjectMetadata('A', { collection: 'My EP' });
      createProjectMetadata('B', { collection: 'My EP' });
      createProjectMetadata('C');

      const results = searchProjects({ collection: 'My EP' });
      expect(results).toHaveLength(2);
    });
  });

  // ===========================================================================
  // Aggregation helpers
  // ===========================================================================

  describe('aggregation helpers', () => {
    it('returns unique genres', () => {
      createProjectMetadata('A', { genre: 'house' });
      createProjectMetadata('B', { genre: 'techno' });
      createProjectMetadata('C', { genre: 'house' });
      expect(getProjectGenres()).toEqual(['house', 'techno']);
    });

    it('returns unique tags', () => {
      createProjectMetadata('A', { tags: ['dark', 'club'] });
      createProjectMetadata('B', { tags: ['club', 'deep'] });
      expect(getAllProjectTags()).toEqual(['club', 'dark', 'deep']);
    });
  });

  // ===========================================================================
  // Export / Import
  // ===========================================================================

  describe('export and import', () => {
    it('round-trips through export/import', () => {
      createProjectMetadata('A', { genre: 'house', tempo: 128 });
      createProjectMetadata('B', { genre: 'jazz', tempo: 120 });
      const exported = exportProjectMetadata();
      expect(exported).toHaveLength(2);

      resetProjectMetadata();
      expect(getProjectMetadataCount()).toBe(0);

      const imported = importProjectMetadata(exported);
      expect(imported).toBe(2);
      expect(getProjectMetadataCount()).toBe(2);
    });
  });
});
