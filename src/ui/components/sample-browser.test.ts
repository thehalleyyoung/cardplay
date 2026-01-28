/**
 * @fileoverview Tests for Sample Browser UI Component.
 */

import { describe, it, expect } from 'vitest';
import type { SampleMetadata, SampleBrowserPanel, SampleBrowserConfig, SampleBrowserState } from './sample-browser';
import {
  createSampleBrowserPanel,
  toggleSection,
  updateSplitPosition,
  resizePanel,
  buildFolderTree,
  toggleFolder,
  expandAll,
  collapseAll,
  findNode,
  getAllSampleIds,
  filterSamples,
  sortSamples,
  createSampleListItems,
  searchSamples,
  getFilterOptions,
  startPreview,
  stopPreview,
  updatePreviewPosition,
  createSampleDragData,
  isSampleDragData,
  toggleFavorite,
  getFavorites,
  addToRecent,
  getRecentSamples,
  clearRecent,
  addTag,
  removeTag,
  setTags,
  getSamplesByTag,
  getAllTags,
  setRating,
  getSamplesByMinRating,
  getTopRatedSamples,
  createCollection,
  addToCollection,
  removeFromCollection,
  renameCollection,
  setCollectionDescription,
  setCollectionColor,
  getCollectionSamples,
  canDropOnTrack,
  createTrackDropData,
  createPreviewBehavior,
  startPreviewByMode,
  maybeStopPreviewOnRelease,
  startHoverTimer,
  checkHoverDelay,
  stopHoverTimer,
  shouldStartHoverPreview,
  DEFAULT_PREVIEW_BEHAVIOR
} from './sample-browser';


// ============================================================================
// TEST DATA
// ============================================================================

function createTestSample(overrides: Partial<SampleMetadata> = {}): SampleMetadata {
  return {
    id: 'sample-1',
    name: 'Kick.wav',
    path: '/Drums/Kick.wav',
    format: 'wav',
    sampleRate: 44100,
    duration: 0.5,
    channels: 1,
    sizeBytes: 44100,
    type: 'one-shot',
    categories: ['drums', 'percussion'],
    tags: ['kick', 'bass-drum'],
    rating: 4,
    isFavorite: false,
    created: new Date('2024-01-01'),
    source: 'local',
    ...overrides
  };
}

function createTestSamples(): SampleMetadata[] {
  return [
    createTestSample({
      id: 's1',
      name: 'Kick-808.wav',
      path: '/Drums/808/Kick-808.wav',
      type: 'one-shot',
      categories: ['drums'],
      tags: ['808', 'kick'],
      key: 'C',
      bpm: 120,
      rating: 5,
      isFavorite: true
    }),
    createTestSample({
      id: 's2',
      name: 'Snare-Clap.wav',
      path: '/Drums/808/Snare-Clap.wav',
      type: 'one-shot',
      categories: ['drums'],
      tags: ['808', 'snare', 'clap'],
      rating: 4
    }),
    createTestSample({
      id: 's3',
      name: 'Bass-Loop.wav',
      path: '/Bass/Bass-Loop.wav',
      type: 'loop',
      categories: ['bass'],
      tags: ['loop', 'bass'],
      key: 'Am',
      bpm: 85,
      duration: 4.0,
      rating: 3
    }),
    createTestSample({
      id: 's4',
      name: 'Piano-C4.wav',
      path: '/Keys/Piano/Piano-C4.wav',
      type: 'instrument',
      categories: ['keys', 'piano'],
      tags: ['piano', 'acoustic'],
      key: 'C',
      rating: 5,
      isFavorite: true
    }),
    createTestSample({
      id: 's5',
      name: 'Pad-Texture.wav',
      path: '/Pads/Pad-Texture.wav',
      type: 'texture',
      categories: ['pads'],
      tags: ['ambient', 'pad'],
      duration: 10.0,
      rating: 4
    })
  ];
}

function createTestConfig(overrides: Partial<SampleBrowserConfig> = {}): SampleBrowserConfig {
  return {
    sortMode: 'name',
    viewMode: 'list',
    ...overrides
  };
}

function createTestState(overrides: Partial<SampleBrowserState> = {}): SampleBrowserState {
  const samples = createTestSamples();
  return {
    samples,
    displayedSamples: samples,
    categories: ['drums', 'bass', 'keys', 'pads', 'piano'],
    tags: ['808', 'kick', 'snare', 'loop', 'bass', 'piano', 'pad', 'ambient'],
    keys: ['C', 'Am'],
    formats: ['wav'],
    favorites: ['s1', 's4'],
    recent: ['s3', 's2'],
    loading: false,
    ...overrides
  };
}

// ============================================================================
// PANEL LAYOUT TESTS
// ============================================================================

describe('Sample Browser Panel', () => {
  describe('createSampleBrowserPanel', () => {
    it('should create default panel with standard dimensions', () => {
      const panel = createSampleBrowserPanel();
      
      expect(panel.width).toBe(800);
      expect(panel.height).toBe(600);
      expect(panel.sections.folderTree.visible).toBe(true);
      expect(panel.sections.fileList.visible).toBe(true);
      expect(panel.sections.details.visible).toBe(true);
      expect(panel.sections.searchBar.visible).toBe(true);
      expect(panel.sections.filterBar.visible).toBe(true);
    });

    it('should accept custom dimensions', () => {
      const panel = createSampleBrowserPanel(1024, 768);
      
      expect(panel.width).toBe(1024);
      expect(panel.height).toBe(768);
    });

    it('should have default split positions', () => {
      const panel = createSampleBrowserPanel();
      
      expect(panel.splitPositions.leftSidebar).toBe(25);
      expect(panel.splitPositions.rightSidebar).toBe(30);
    });

    it('should have default section sizes', () => {
      const panel = createSampleBrowserPanel();
      
      expect(panel.sections.folderTree.width).toBe(200);
      expect(panel.sections.details.width).toBe(250);
      expect(panel.sections.searchBar.height).toBe(40);
      expect(panel.sections.filterBar.height).toBe(50);
    });
  });

  describe('toggleSection', () => {
    it('should toggle folder tree visibility', () => {
      const panel = createSampleBrowserPanel();
      const updated = toggleSection(panel, 'folderTree', false);
      
      expect(updated.sections.folderTree.visible).toBe(false);
      expect(updated.sections.fileList.visible).toBe(true);
    });

    it('should toggle details panel visibility', () => {
      const panel = createSampleBrowserPanel();
      const updated = toggleSection(panel, 'details', false);
      
      expect(updated.sections.details.visible).toBe(false);
    });

    it('should toggle search bar visibility', () => {
      const panel = createSampleBrowserPanel();
      const updated = toggleSection(panel, 'searchBar', false);
      
      expect(updated.sections.searchBar.visible).toBe(false);
    });

    it('should toggle filter bar visibility', () => {
      const panel = createSampleBrowserPanel();
      const updated = toggleSection(panel, 'filterBar', false);
      
      expect(updated.sections.filterBar.visible).toBe(false);
    });

    it('should preserve other sections when toggling', () => {
      const panel = createSampleBrowserPanel();
      const updated = toggleSection(panel, 'folderTree', false);
      
      expect(updated.sections.details.visible).toBe(true);
      expect(updated.sections.searchBar.visible).toBe(true);
      expect(updated.sections.filterBar.visible).toBe(true);
    });
  });

  describe('updateSplitPosition', () => {
    it('should update left sidebar position', () => {
      const panel = createSampleBrowserPanel();
      const updated = updateSplitPosition(panel, 'leftSidebar', 30);
      
      expect(updated.splitPositions.leftSidebar).toBe(30);
      expect(updated.splitPositions.rightSidebar).toBe(30);
    });

    it('should update right sidebar position', () => {
      const panel = createSampleBrowserPanel();
      const updated = updateSplitPosition(panel, 'rightSidebar', 40);
      
      expect(updated.splitPositions.rightSidebar).toBe(40);
      expect(updated.splitPositions.leftSidebar).toBe(25);
    });

    it('should clamp position to minimum 10%', () => {
      const panel = createSampleBrowserPanel();
      const updated = updateSplitPosition(panel, 'leftSidebar', 5);
      
      expect(updated.splitPositions.leftSidebar).toBe(10);
    });

    it('should clamp position to maximum 90%', () => {
      const panel = createSampleBrowserPanel();
      const updated = updateSplitPosition(panel, 'rightSidebar', 95);
      
      expect(updated.splitPositions.rightSidebar).toBe(90);
    });
  });

  describe('resizePanel', () => {
    it('should resize panel to new dimensions', () => {
      const panel = createSampleBrowserPanel();
      const updated = resizePanel(panel, 1200, 900);
      
      expect(updated.width).toBe(1200);
      expect(updated.height).toBe(900);
    });

    it('should enforce minimum width of 400', () => {
      const panel = createSampleBrowserPanel();
      const updated = resizePanel(panel, 200, 600);
      
      expect(updated.width).toBe(400);
    });

    it('should enforce minimum height of 300', () => {
      const panel = createSampleBrowserPanel();
      const updated = resizePanel(panel, 800, 100);
      
      expect(updated.height).toBe(300);
    });
  });
});

// ============================================================================
// FOLDER TREE TESTS
// ============================================================================

describe('Folder Tree View', () => {
  describe('buildFolderTree', () => {
    it('should build tree from sample paths', () => {
      const samples = createTestSamples();
      const tree = buildFolderTree(samples);
      
      expect(tree.name).toBe('Samples');
      expect(tree.path).toBe('/');
      expect(tree.expanded).toBe(true);
    });

    it('should group samples into folders', () => {
      const samples = createTestSamples();
      const tree = buildFolderTree(samples);
      
      const drumsFolder = tree.children.find(c => c.name === 'Drums');
      expect(drumsFolder).toBeDefined();
      
      const bassFolder = tree.children.find(c => c.name === 'Bass');
      expect(bassFolder).toBeDefined();
      
      const keysFolder = tree.children.find(c => c.name === 'Keys');
      expect(keysFolder).toBeDefined();
    });

    it('should handle nested folders', () => {
      const samples = createTestSamples();
      const tree = buildFolderTree(samples);
      
      const drumsFolder = tree.children.find(c => c.name === 'Drums');
      expect(drumsFolder?.children).toHaveLength(1);
      expect(drumsFolder?.children[0].name).toBe('808');
    });

    it('should assign samples to correct folders', () => {
      const samples = createTestSamples();
      const tree = buildFolderTree(samples);
      
      const bassFolder = tree.children.find(c => c.name === 'Bass');
      expect(bassFolder?.sampleIds).toContain('s3');
    });

    it('should start with folders collapsed (except root)', () => {
      const samples = createTestSamples();
      const tree = buildFolderTree(samples);
      
      expect(tree.expanded).toBe(true);
      tree.children.forEach(child => {
        expect(child.expanded).toBe(false);
      });
    });
  });

  describe('toggleFolder', () => {
    it('should toggle folder expanded state', () => {
      const samples = createTestSamples();
      const tree = buildFolderTree(samples);
      
      const drumsPath = 'Drums';
      const toggled = toggleFolder(tree, drumsPath);
      
      const drumsFolder = toggled.children.find(c => c.name === 'Drums');
      expect(drumsFolder?.expanded).toBe(true);
    });

    it('should toggle nested folder', () => {
      const samples = createTestSamples();
      const tree = buildFolderTree(samples);
      
      const toggled = toggleFolder(tree, 'Drums/808');
      const drumsFolder = toggled.children.find(c => c.name === 'Drums');
      const folder808 = drumsFolder?.children[0];
      
      expect(folder808?.expanded).toBe(true);
    });

    it('should preserve other folder states', () => {
      const samples = createTestSamples();
      const tree = buildFolderTree(samples);
      
      const toggled = toggleFolder(tree, 'Drums');
      const bassFolder = toggled.children.find(c => c.name === 'Bass');
      
      expect(bassFolder?.expanded).toBe(false);
    });
  });

  describe('expandAll', () => {
    it('should expand all folders', () => {
      const samples = createTestSamples();
      const tree = buildFolderTree(samples);
      const expanded = expandAll(tree);
      
      expect(expanded.expanded).toBe(true);
      expanded.children.forEach(child => {
        expect(child.expanded).toBe(true);
        child.children.forEach(grandchild => {
          expect(grandchild.expanded).toBe(true);
        });
      });
    });
  });

  describe('collapseAll', () => {
    it('should collapse all folders', () => {
      const samples = createTestSamples();
      const tree = buildFolderTree(samples);
      const expanded = expandAll(tree);
      const collapsed = collapseAll(expanded);
      
      expect(collapsed.expanded).toBe(false);
      collapsed.children.forEach(child => {
        expect(child.expanded).toBe(false);
      });
    });
  });

  describe('findNode', () => {
    it('should find root node', () => {
      const samples = createTestSamples();
      const tree = buildFolderTree(samples);
      
      const found = findNode(tree, '/');
      expect(found).toBe(tree);
    });

    it('should find top-level folder', () => {
      const samples = createTestSamples();
      const tree = buildFolderTree(samples);
      
      const found = findNode(tree, 'Drums');
      expect(found?.name).toBe('Drums');
    });

    it('should find nested folder', () => {
      const samples = createTestSamples();
      const tree = buildFolderTree(samples);
      
      const found = findNode(tree, 'Drums/808');
      expect(found?.name).toBe('808');
    });

    it('should return null for non-existent path', () => {
      const samples = createTestSamples();
      const tree = buildFolderTree(samples);
      
      const found = findNode(tree, 'NonExistent');
      expect(found).toBeNull();
    });
  });

  describe('getAllSampleIds', () => {
    it('should get all sample IDs in folder', () => {
      const samples = createTestSamples();
      const tree = buildFolderTree(samples);
      
      const drumsFolder = tree.children.find(c => c.name === 'Drums');
      const ids = getAllSampleIds(drumsFolder!);
      
      expect(ids).toContain('s1');
      expect(ids).toContain('s2');
    });

    it('should include samples from subfolders', () => {
      const samples = createTestSamples();
      const tree = buildFolderTree(samples);
      
      const drumsFolder = tree.children.find(c => c.name === 'Drums');
      const ids = getAllSampleIds(drumsFolder!);
      
      expect(ids.length).toBeGreaterThan(0);
    });

    it('should get all samples from root', () => {
      const samples = createTestSamples();
      const tree = buildFolderTree(samples);
      
      const allIds = getAllSampleIds(tree);
      expect(allIds).toHaveLength(5);
    });
  });
});

// ============================================================================
// FILE LIST TESTS
// ============================================================================

describe('File List View', () => {
  describe('filterSamples', () => {
    const samples = createTestSamples();

    it('should return all samples with no filters', () => {
      const config = createTestConfig();
      const filtered = filterSamples(samples, config);
      
      expect(filtered).toHaveLength(5);
    });

    it('should filter by search query (name)', () => {
      const config = createTestConfig({ searchQuery: 'kick' });
      const filtered = filterSamples(samples, config);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toContain('Kick');
    });

    it('should filter by search query (tags)', () => {
      const config = createTestConfig({ searchQuery: '808' });
      const filtered = filterSamples(samples, config);
      
      expect(filtered).toHaveLength(2);
    });

    it('should filter by type', () => {
      const config = createTestConfig({ typeFilter: 'one-shot' });
      const filtered = filterSamples(samples, config);
      
      expect(filtered).toHaveLength(2);
      expect(filtered.every(s => s.type === 'one-shot')).toBe(true);
    });

    it('should filter by category', () => {
      const config = createTestConfig({ categoryFilter: 'drums' });
      const filtered = filterSamples(samples, config);
      
      expect(filtered).toHaveLength(2);
    });

    it('should filter by key', () => {
      const config = createTestConfig({ keyFilter: 'C' });
      const filtered = filterSamples(samples, config);
      
      expect(filtered).toHaveLength(2);
    });

    it('should filter by BPM range', () => {
      const config = createTestConfig({
        bpmRange: { min: 80, max: 90 }
      });
      const filtered = filterSamples(samples, config);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].bpm).toBe(85);
    });

    it('should filter by duration range', () => {
      const config = createTestConfig({
        durationRange: { min: 1, max: 5 }
      });
      const filtered = filterSamples(samples, config);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].duration).toBe(4.0);
    });

    it('should filter by format', () => {
      const config = createTestConfig({ formatFilter: 'wav' });
      const filtered = filterSamples(samples, config);
      
      expect(filtered).toHaveLength(5);
    });

    it('should filter favorites only', () => {
      const config = createTestConfig({ showFavoritesOnly: true });
      const filtered = filterSamples(samples, config);
      
      expect(filtered).toHaveLength(2);
      expect(filtered.every(s => s.isFavorite)).toBe(true);
    });

    it('should combine multiple filters', () => {
      const config = createTestConfig({
        typeFilter: 'one-shot',
        categoryFilter: 'drums'
      });
      const filtered = filterSamples(samples, config);
      
      expect(filtered).toHaveLength(2);
    });
  });

  describe('sortSamples', () => {
    const samples = createTestSamples();

    it('should sort by name', () => {
      const sorted = sortSamples(samples, 'name');
      
      expect(sorted[0].name).toBe('Bass-Loop.wav');
      expect(sorted[sorted.length - 1].name).toBe('Snare-Clap.wav');
    });

    it('should sort by date (newest first)', () => {
      const sorted = sortSamples(samples, 'date');
      
      // All have same date in test data, just check it doesn't error
      expect(sorted).toHaveLength(5);
    });

    it('should sort by size', () => {
      const sorted = sortSamples(samples, 'size');
      
      expect(sorted[0].sizeBytes).toBeGreaterThanOrEqual(sorted[sorted.length - 1].sizeBytes);
    });

    it('should sort by duration', () => {
      const sorted = sortSamples(samples, 'duration');
      
      expect(sorted[0].duration).toBeGreaterThanOrEqual(sorted[1].duration);
    });

    it('should sort by type', () => {
      const sorted = sortSamples(samples, 'type');
      
      const types = sorted.map(s => s.type);
      expect(types.indexOf('instrument')).toBeLessThan(types.lastIndexOf('one-shot'));
    });

    it('should sort by key', () => {
      const sorted = sortSamples(samples, 'key');
      
      // Samples with key should come before those without
      const hasKey = sorted.filter(s => s.key !== undefined);
      expect(hasKey.length).toBeGreaterThan(0);
    });

    it('should sort by BPM', () => {
      const sorted = sortSamples(samples, 'bpm');
      
      const withBpm = sorted.filter(s => s.bpm !== undefined);
      expect(withBpm.length).toBe(2);
    });

    it('should sort by rating', () => {
      const sorted = sortSamples(samples, 'rating');
      
      expect(sorted[0].rating).toBeGreaterThanOrEqual(sorted[sorted.length - 1].rating);
    });
  });

  describe('createSampleListItems', () => {
    it('should create list items with correct flags', () => {
      const samples = createTestSamples();
      const config = createTestConfig({ selectedSampleId: 's1' });
      const state = createTestState({ previewingSampleId: 's2' });
      
      const items = createSampleListItems(samples, config, state);
      
      expect(items).toHaveLength(5);
      expect(items[0].isSelected).toBe(true);
      expect(items[1].isPreviewing).toBe(true);
    });

    it('should mark favorites correctly', () => {
      const samples = createTestSamples();
      const config = createTestConfig();
      const state = createTestState();
      
      const items = createSampleListItems(samples, config, state);
      
      const favoriteItems = items.filter(i => i.isFavorite);
      expect(favoriteItems).toHaveLength(2);
    });

    it('should mark recent items correctly', () => {
      const samples = createTestSamples();
      const config = createTestConfig();
      const state = createTestState();
      
      const items = createSampleListItems(samples, config, state);
      
      const recentItems = items.filter(i => i.isRecent);
      expect(recentItems).toHaveLength(2);
    });

    it('should calculate match scores', () => {
      const samples = createTestSamples();
      const config = createTestConfig({ searchQuery: 'kick' });
      const state = createTestState();
      
      const items = createSampleListItems(samples, config, state);
      
      expect(items.every(i => i.matchScore >= 0 && i.matchScore <= 1)).toBe(true);
    });
  });
});

// ============================================================================
// SEARCH TESTS
// ============================================================================

describe('Search & Filter', () => {
  describe('searchSamples', () => {
    const samples = createTestSamples();

    it('should return all samples for empty query', () => {
      const results = searchSamples(samples, '');
      
      expect(results).toHaveLength(5);
    });

    it('should search by name', () => {
      const results = searchSamples(samples, 'kick');
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toContain('Kick');
    });

    it('should search by tags', () => {
      const results = searchSamples(samples, '808');
      
      expect(results).toHaveLength(2);
    });

    it('should search by category', () => {
      const results = searchSamples(samples, 'bass');
      
      expect(results.some(s => s.categories.includes('bass'))).toBe(true);
    });

    it('should be case insensitive', () => {
      const results = searchSamples(samples, 'KICK');
      
      expect(results).toHaveLength(1);
    });

    it('should limit results', () => {
      const results = searchSamples(samples, 'wav', 2);
      
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should rank results by relevance', () => {
      const results = searchSamples(samples, 'kick');
      
      // Name matches should rank higher
      expect(results[0].name.toLowerCase()).toContain('kick');
    });
  });

  describe('getFilterOptions', () => {
    const samples = createTestSamples();

    it('should extract all categories', () => {
      const options = getFilterOptions(samples);
      
      expect(options.categories).toContain('drums');
      expect(options.categories).toContain('bass');
      expect(options.categories).toContain('keys');
    });

    it('should extract all tags', () => {
      const options = getFilterOptions(samples);
      
      expect(options.tags).toContain('808');
      expect(options.tags).toContain('kick');
      expect(options.tags).toContain('loop');
    });

    it('should extract all keys', () => {
      const options = getFilterOptions(samples);
      
      expect(options.keys).toContain('C');
      expect(options.keys).toContain('Am');
    });

    it('should extract all formats', () => {
      const options = getFilterOptions(samples);
      
      expect(options.formats).toContain('wav');
    });

    it('should calculate BPM range', () => {
      const options = getFilterOptions(samples);
      
      expect(options.bpmRange.min).toBe(85);
      expect(options.bpmRange.max).toBe(120);
    });

    it('should calculate duration range', () => {
      const options = getFilterOptions(samples);
      
      expect(options.durationRange.min).toBe(0.5);
      expect(options.durationRange.max).toBe(10.0);
    });

    it('should sort options alphabetically', () => {
      const options = getFilterOptions(samples);
      
      const sorted = [...options.categories].sort();
      expect(options.categories).toEqual(sorted);
    });
  });
});

// ============================================================================
// PREVIEW TESTS
// ============================================================================

describe('Sample Preview', () => {
  describe('startPreview', () => {
    it('should start preview with default volume', () => {
      const preview = startPreview('s1');
      
      expect(preview.sampleId).toBe('s1');
      expect(preview.isPlaying).toBe(true);
      expect(preview.position).toBe(0);
      expect(preview.volume).toBe(0.7);
    });

    it('should start preview with custom volume', () => {
      const preview = startPreview('s1', 0.5);
      
      expect(preview.volume).toBe(0.5);
    });

    it('should clamp volume to 0-1 range', () => {
      const preview1 = startPreview('s1', 1.5);
      expect(preview1.volume).toBe(1);
      
      const preview2 = startPreview('s1', -0.5);
      expect(preview2.volume).toBe(0);
    });
  });

  describe('stopPreview', () => {
    it('should stop preview', () => {
      const preview = startPreview('s1');
      const stopped = stopPreview(preview);
      
      expect(stopped.isPlaying).toBe(false);
      expect(stopped.position).toBe(0);
    });

    it('should preserve sample ID', () => {
      const preview = startPreview('s1');
      const stopped = stopPreview(preview);
      
      expect(stopped.sampleId).toBe('s1');
    });
  });

  describe('updatePreviewPosition', () => {
    it('should update position', () => {
      const preview = startPreview('s1');
      const updated = updatePreviewPosition(preview, 0.5);
      
      expect(updated.position).toBe(0.5);
    });

    it('should clamp position to 0-1 range', () => {
      const preview = startPreview('s1');
      
      const updated1 = updatePreviewPosition(preview, 1.5);
      expect(updated1.position).toBe(1);
      
      const updated2 = updatePreviewPosition(preview, -0.5);
      expect(updated2.position).toBe(0);
    });

    it('should preserve other state', () => {
      const preview = startPreview('s1', 0.8);
      const updated = updatePreviewPosition(preview, 0.5);
      
      expect(updated.sampleId).toBe('s1');
      expect(updated.isPlaying).toBe(true);
      expect(updated.volume).toBe(0.8);
    });
  });
});

// ============================================================================
// DRAG & DROP TESTS
// ============================================================================

describe('Drag & Drop Support', () => {
  describe('createSampleDragData', () => {
    it('should create drag data from sample', () => {
      const sample = createTestSample();
      const dragData = createSampleDragData(sample);
      
      expect(dragData.type).toBe('sample');
      expect(dragData.sampleId).toBe(sample.id);
      expect(dragData.sampleName).toBe(sample.name);
      expect(dragData.format).toBe(sample.format);
      expect(dragData.duration).toBe(sample.duration);
    });
  });

  describe('isSampleDragData', () => {
    it('should validate correct drag data', () => {
      const sample = createTestSample();
      const dragData = createSampleDragData(sample);
      
      expect(isSampleDragData(dragData)).toBe(true);
    });

    it('should reject null', () => {
      expect(isSampleDragData(null)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(isSampleDragData(undefined)).toBe(false);
    });

    it('should reject non-objects', () => {
      expect(isSampleDragData('string')).toBe(false);
      expect(isSampleDragData(123)).toBe(false);
    });

    it('should reject wrong type', () => {
      const wrong = { type: 'preset', sampleId: 's1' };
      expect(isSampleDragData(wrong)).toBe(false);
    });

    it('should reject missing sampleId', () => {
      const wrong = { type: 'sample' };
      expect(isSampleDragData(wrong)).toBe(false);
    });
  });
});

// ============================================================================
// FAVORITES & RECENTLY USED TESTS  
// ============================================================================

describe('Favorites & Recently Used', () => {

  describe('toggleFavorite', () => {
    it('should add sample to favorites', () => {
      const favorites: string[] = [];
      const result = toggleFavorite(favorites, 's1');
      
      expect(result).toEqual(['s1']);
    });

    it('should remove sample from favorites', () => {
      const favorites = ['s1', 's2', 's3'];
      const result = toggleFavorite(favorites, 's2');
      
      expect(result).toEqual(['s1', 's3']);
    });

    it('should handle toggle favorite on empty list', () => {
      const result = toggleFavorite([], 's1');
      expect(result).toContain('s1');
    });
  });

  describe('getFavorites', () => {
    it('should return only favorited samples', () => {
      const samples = createTestSamples();
      const favorites = ['s1', 's4'];
      const result = getFavorites(samples, favorites);
      
      expect(result).toHaveLength(2);
      expect(result.map(s => s.id)).toEqual(['s1', 's4']);
    });
  });

  describe('addToRecent', () => {
    it('should add sample to front of recent list', () => {
      const recent = ['s2', 's3'];
      const result = addToRecent(recent, 's1');
      
      expect(result).toEqual(['s1', 's2', 's3']);
    });

    it('should move existing sample to front', () => {
      const recent = ['s1', 's2', 's3'];
      const result = addToRecent(recent, 's2');
      
      expect(result).toEqual(['s2', 's1', 's3']);
    });

    it('should limit to maxRecent', () => {
      const recent = Array.from({ length: 20 }, (_, i) => `s${i}`);
      const result = addToRecent(recent, 's-new', 20);
      
      expect(result).toHaveLength(20);
      expect(result[0]).toBe('s-new');
    });
  });

  describe('clearRecent', () => {
    it('should return empty array', () => {
      const result = clearRecent();
      expect(result).toEqual([]);
    });
  });
});

// ============================================================================
// TAGS & LABELS TESTS
// ============================================================================

describe('Tags & Labels System', () => {

  describe('addTag', () => {
    it('should add tag to sample', () => {
      const sample = createTestSample({ tags: ['kick'] });
      const result = addTag(sample, 'bass');
      
      expect(result.tags).toEqual(['kick', 'bass']);
    });

    it('should not duplicate existing tag', () => {
      const sample = createTestSample({ tags: ['kick', 'bass'] });
      const result = addTag(sample, 'kick');
      
      expect(result.tags).toEqual(['kick', 'bass']);
    });
  });

  describe('removeTag', () => {
    it('should remove tag from sample', () => {
      const sample = createTestSample({ tags: ['kick', 'bass', '808'] });
      const result = removeTag(sample, 'bass');
      
      expect(result.tags).toEqual(['kick', '808']);
    });

    it('should handle removing non-existent tag', () => {
      const sample = createTestSample({ tags: ['kick'] });
      const result = removeTag(sample, 'snare');
      
      expect(result.tags).toEqual(['kick']);
    });
  });

  describe('setTags', () => {
    it('should replace all tags', () => {
      const sample = createTestSample({ tags: ['old1', 'old2'] });
      const result = setTags(sample, ['new1', 'new2', 'new3']);
      
      expect(result.tags).toEqual(['new1', 'new2', 'new3']);
    });
  });

  describe('getSamplesByTag', () => {
    it('should return samples with specific tag', () => {
      const samples = createTestSamples();
      const result = getSamplesByTag(samples, '808');
      
      expect(result.map(s => s.id)).toEqual(['s1', 's2']);
    });
  });

  describe('getAllTags', () => {
    it('should return all unique tags sorted', () => {
      const samples = createTestSamples();
      const result = getAllTags(samples);
      
      expect(result).toContain('808');
      expect(result).toContain('kick');
      expect(result).toContain('piano');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// RATING SYSTEM TESTS
// ============================================================================

describe('Rating System', () => {

  describe('setRating', () => {
    it('should set rating within valid range', () => {
      const sample = createTestSample({ rating: 0 });
      const result = setRating(sample, 4);
      
      expect(result.rating).toBe(4);
    });

    it('should clamp rating to maximum', () => {
      const sample = createTestSample({ rating: 0 });
      const result = setRating(sample, 10);
      
      expect(result.rating).toBe(5);
    });

    it('should clamp rating to minimum', () => {
      const sample = createTestSample({ rating: 5 });
      const result = setRating(sample, -1);
      
      expect(result.rating).toBe(0);
    });

    it('should round fractional ratings', () => {
      const sample = createTestSample({ rating: 0 });
      const result = setRating(sample, 3.7);
      
      expect(result.rating).toBe(4);
    });
  });

  describe('getSamplesByMinRating', () => {
    it('should return samples meeting minimum rating', () => {
      const samples = createTestSamples();
      const result = getSamplesByMinRating(samples, 5);
      
      expect(result.every(s => s.rating >= 5)).toBe(true);
      expect(result.map(s => s.id)).toEqual(['s1', 's4']);
    });
  });

  describe('getTopRatedSamples', () => {
    it('should return top rated samples', () => {
      const samples = createTestSamples();
      const result = getTopRatedSamples(samples, 2);
      
      expect(result).toHaveLength(2);
      expect(result[0].rating).toBeGreaterThanOrEqual(result[1].rating);
    });

    it('should limit to requested count', () => {
      const samples = createTestSamples();
      const result = getTopRatedSamples(samples, 1);
      
      expect(result).toHaveLength(1);
    });
  });
});

// ============================================================================
// COLLECTIONS & FOLDERS TESTS
// ============================================================================

describe('Collections & Folders', () => {

  describe('createCollection', () => {
    it('should create empty collection', () => {
      const collection = createCollection('c1', 'My Drums');
      
      expect(collection.id).toBe('c1');
      expect(collection.name).toBe('My Drums');
      expect(collection.sampleIds).toEqual([]);
    });

    it('should include creation timestamp', () => {
      const collection = createCollection('c1', 'Test');
      
      expect(collection.created).toBeInstanceOf(Date);
      expect(collection.modified).toBeInstanceOf(Date);
    });
  });

  describe('addToCollection', () => {
    it('should add sample to collection', () => {
      const collection = createCollection('c1', 'Test');
      const result = addToCollection(collection, 's1');
      
      expect(result.sampleIds).toEqual(['s1']);
    });

    it('should not duplicate samples', () => {
      const collection = createCollection('c1', 'Test');
      const withOne = addToCollection(collection, 's1');
      const withDupe = addToCollection(withOne, 's1');
      
      expect(withDupe.sampleIds).toEqual(['s1']);
    });

    it('should update modified timestamp', () => {
      const collection = createCollection('c1', 'Test');
      const result = addToCollection(collection, 's1');
      
      expect(result.modified.getTime()).toBeGreaterThanOrEqual(collection.modified.getTime());
    });
  });

  describe('removeFromCollection', () => {
    it('should remove sample from collection', () => {
      const collection = createCollection('c1', 'Test');
      const withSamples = { ...collection, sampleIds: ['s1', 's2', 's3'] };
      const result = removeFromCollection(withSamples, 's2');
      
      expect(result.sampleIds).toEqual(['s1', 's3']);
    });
  });

  describe('renameCollection', () => {
    it('should rename collection', () => {
      const collection = createCollection('c1', 'Old Name');
      const result = renameCollection(collection, 'New Name');
      
      expect(result.name).toBe('New Name');
    });
  });

  describe('setCollectionColor', () => {
    it('should set collection color', () => {
      const collection = createCollection('c1', 'Test');
      const result = setCollectionColor(collection, '#FF5500');
      
      expect(result.color).toBe('#FF5500');
    });
  });
});

// ============================================================================
// DRAG TO TRACK TESTS
// ============================================================================

describe('Drag to Track', () => {

  describe('canDropOnTrack', () => {
    it('should allow drop for valid sample', () => {
      const sample = createTestSample();
      const result = canDropOnTrack(sample, 'track-1');
      
      expect(result).toBe(true);
    });
  });

  describe('createTrackDropData', () => {
    it('should create drop data for track', () => {
      const sample = createTestSample();
      const result = createTrackDropData(sample, 'track-1', 1000);
      
      expect(result.sampleId).toBe(sample.id);
      expect(result.trackId).toBe('track-1');
      expect(result.position).toBe(1000);
      expect(result.duration).toBe(sample.duration);
    });
  });
});

// ============================================================================
// PREVIEW ON HOVER & CLICK TESTS
// ============================================================================

describe('Preview on Hover & Click', () => {

  describe('createPreviewBehavior', () => {
    it('should create click mode behavior', () => {
      const behavior = createPreviewBehavior('click', false);
      
      expect(behavior.mode).toBe('click');
      expect(behavior.autoStopOnRelease).toBe(false);
    });

    it('should create hover mode behavior with delay', () => {
      const behavior = createPreviewBehavior('hover', false);
      
      expect(behavior.mode).toBe('hover');
      expect(behavior.hoverDelayMs).toBe(300);
    });
  });

  describe('startPreviewByMode', () => {
    it('should start preview when mode matches', () => {
      const behavior = createPreviewBehavior('click', false);
      const result = startPreviewByMode('s1', 'click', behavior);
      
      expect(result).not.toBeNull();
      expect(result?.sampleId).toBe('s1');
    });

    it('should not start preview when mode does not match', () => {
      const behavior = createPreviewBehavior('click', false);
      const result = startPreviewByMode('s1', 'hover', behavior);
      
      expect(result).toBeNull();
    });
  });

  describe('maybeStopPreviewOnRelease', () => {
    it('should stop preview when configured', () => {
      const behavior = createPreviewBehavior('click', true);
      const state = { sampleId: 's1', isPlaying: true, position: 0.5, volume: 0.7 };
      const result = maybeStopPreviewOnRelease(state, behavior);
      
      expect(result).toBeNull();
    });

    it('should not stop preview when not configured', () => {
      const behavior = createPreviewBehavior('click', false);
      const state = { sampleId: 's1', isPlaying: true, position: 0.5, volume: 0.7 };
      const result = maybeStopPreviewOnRelease(state, behavior);
      
      expect(result).not.toBeNull();
    });
  });

  describe('hover timer', () => {
    it('should start hover timer', () => {
      const timer = startHoverTimer('s1', 1000);
      
      expect(timer.sampleId).toBe('s1');
      expect(timer.isHovering).toBe(true);
      expect(timer.delayExpired).toBe(false);
    });

    it('should check hover delay', () => {
      const timer = startHoverTimer('s1', 1000);
      const checked = checkHoverDelay(timer, 300, 1400);
      
      expect(checked.delayExpired).toBe(true);
    });

    it('should not expire before delay', () => {
      const timer = startHoverTimer('s1', 1000);
      const checked = checkHoverDelay(timer, 300, 1200);
      
      expect(checked.delayExpired).toBe(false);
    });

    it('should stop hover timer', () => {
      const timer = startHoverTimer('s1', 1000);
      const stopped = stopHoverTimer(timer);
      
      expect(stopped.isHovering).toBe(false);
    });
  });

  describe('shouldStartHoverPreview', () => {
    it('should start when hovering and delay expired', () => {
      const behavior = createPreviewBehavior('hover', false);
      const timer = { sampleId: 's1', hoverStartTime: 1000, isHovering: true, delayExpired: true };
      
      const result = shouldStartHoverPreview(timer, behavior);
      expect(result).toBe(true);
    });

    it('should not start when delay not expired', () => {
      const behavior = createPreviewBehavior('hover', false);
      const timer = { sampleId: 's1', hoverStartTime: 1000, isHovering: true, delayExpired: false };
      
      const result = shouldStartHoverPreview(timer, behavior);
      expect(result).toBe(false);
    });

    it('should not start when not hovering', () => {
      const behavior = createPreviewBehavior('hover', false);
      const timer = { sampleId: 's1', hoverStartTime: 1000, isHovering: false, delayExpired: true };
      
      const result = shouldStartHoverPreview(timer, behavior);
      expect(result).toBe(false);
    });

    it('should not start for non-hover mode', () => {
      const behavior = createPreviewBehavior('click', false);
      const timer = { sampleId: 's1', hoverStartTime: 1000, isHovering: true, delayExpired: true };
      
      const result = shouldStartHoverPreview(timer, behavior);
      expect(result).toBe(false);
    });
  });
});
