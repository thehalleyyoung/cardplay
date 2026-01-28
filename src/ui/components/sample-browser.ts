/**
 * @fileoverview Sample Browser UI Component.
 * 
 * Provides UI for browsing, searching, and selecting audio samples.
 * Supports local files, Freesound integration, and sample library management.
 * 
 * @module @cardplay/core/ui/components/sample-browser
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Sample metadata for browser display.
 */
export interface SampleMetadata {
  /** Unique sample ID */
  readonly id: string;
  /** Display name */
  readonly name: string;
  /** File path or URL */
  readonly path: string;
  /** File format (wav, mp3, flac, etc.) */
  readonly format: string;
  /** Sample rate in Hz */
  readonly sampleRate: number;
  /** Duration in seconds */
  readonly duration: number;
  /** Number of channels (1 = mono, 2 = stereo) */
  readonly channels: number;
  /** File size in bytes */
  readonly sizeBytes: number;
  /** Sample type */
  readonly type: SampleType;
  /** Musical key (if detected) */
  readonly key?: string;
  /** Tempo in BPM (if detected) */
  readonly bpm?: number;
  /** Category tags */
  readonly categories: readonly string[];
  /** User-defined tags */
  readonly tags: readonly string[];
  /** Star rating (0-5) */
  readonly rating: number;
  /** Is favorited */
  readonly isFavorite: boolean;
  /** Creation/import timestamp */
  readonly created: Date;
  /** Last access timestamp */
  readonly lastAccessed?: Date;
  /** Waveform thumbnail data (base64 PNG) */
  readonly waveformThumbnail?: string;
  /** Source (local, freesound, recorded, etc.) */
  readonly source: SampleSource;
  /** Freesound metadata if from Freesound */
  readonly freesound?: FreesoundMetadata;
}

/**
 * Sample type classification.
 */
export type SampleType = 
  | 'one-shot'      // Single hit (drum, sfx)
  | 'loop'          // Rhythmic loop
  | 'phrase'        // Melodic/harmonic loop
  | 'texture'       // Ambient/pad
  | 'vocal'         // Vocal sample
  | 'fx'            // Sound effect
  | 'instrument';   // Instrument note

/**
 * Sample source.
 */
export type SampleSource = 
  | 'local'         // User file upload
  | 'freesound'     // Freesound.org
  | 'recorded'      // Direct recording
  | 'synthesis'     // Generated from synth
  | 'import';       // Imported from project

/**
 * Freesound API metadata.
 */
export interface FreesoundMetadata {
  /** Freesound sample ID */
  readonly id: number;
  /** Original author username */
  readonly username: string;
  /** License type */
  readonly license: string;
  /** Freesound URL */
  readonly url: string;
  /** Download URL (requires auth) */
  readonly downloadUrl: string;
  /** Preview URLs (HQ/LQ MP3) */
  readonly previewUrls: {
    readonly hq: string;
    readonly lq: string;
  };
  /** Freesound tags */
  readonly freesoundTags: readonly string[];
  /** Description */
  readonly description?: string;
}

/**
 * Sample browser configuration.
 */
export interface SampleBrowserConfig {
  /** Currently selected sample ID */
  readonly selectedSampleId?: string;
  /** Search query */
  readonly searchQuery?: string;
  /** Filter by sample type */
  readonly typeFilter?: SampleType;
  /** Filter by category */
  readonly categoryFilter?: string;
  /** Filter by musical key */
  readonly keyFilter?: string;
  /** Filter by BPM range */
  readonly bpmRange?: { min: number; max: number };
  /** Filter by duration range (seconds) */
  readonly durationRange?: { min: number; max: number };
  /** Filter by format */
  readonly formatFilter?: string;
  /** Show only favorites */
  readonly showFavoritesOnly?: boolean;
  /** Show only recent */
  readonly showRecentOnly?: boolean;
  /** Sort mode */
  readonly sortMode: SampleSortMode;
  /** View mode */
  readonly viewMode: SampleViewMode;
  /** Enable preview on hover */
  readonly hoverPreview?: boolean;
  /** Preview volume (0-1) */
  readonly previewVolume?: number;
  /** Callback when sample selected */
  readonly onSelect?: (sampleId: string) => void;
  /** Callback when sample favorited */
  readonly onFavorite?: (sampleId: string, favorited: boolean) => void;
  /** Callback when sample deleted */
  readonly onDelete?: (sampleId: string) => void;
  /** Callback when sample rated */
  readonly onRate?: (sampleId: string, rating: number) => void;
  /** Callback when sample tagged */
  readonly onTag?: (sampleId: string, tags: readonly string[]) => void;
  /** Callback when search query changes */
  readonly onSearchChange?: (query: string) => void;
  /** Callback when drag initiated */
  readonly onDragStart?: (sampleId: string) => void;
}

/**
 * Sort modes for sample list.
 */
export type SampleSortMode = 
  | 'name'        // Alphabetical by name
  | 'date'        // Newest first
  | 'size'        // File size
  | 'duration'    // Duration
  | 'type'        // Grouped by type
  | 'key'         // Grouped by key
  | 'bpm'         // Grouped by tempo
  | 'rating'      // Highest rated first
  | 'recent';     // Recently accessed

/**
 * View modes for sample display.
 */
export type SampleViewMode = 
  | 'list'        // Compact list view
  | 'grid'        // Grid with waveforms
  | 'tree';       // Hierarchical folder tree

/**
 * Sample browser state.
 */
export interface SampleBrowserState {
  /** All samples */
  readonly samples: readonly SampleMetadata[];
  /** Filtered/sorted samples for display */
  readonly displayedSamples: readonly SampleMetadata[];
  /** Available categories */
  readonly categories: readonly string[];
  /** Available tags */
  readonly tags: readonly string[];
  /** Available keys */
  readonly keys: readonly string[];
  /** Available formats */
  readonly formats: readonly string[];
  /** Favorite sample IDs */
  readonly favorites: readonly string[];
  /** Recently accessed sample IDs (up to 20) */
  readonly recent: readonly string[];
  /** Currently playing preview sample ID */
  readonly previewingSampleId?: string;
  /** Preview playback position (0-1) */
  readonly previewPosition?: number;
  /** Loading state */
  readonly loading: boolean;
  /** Error message */
  readonly error?: string;
  /** Folder tree structure */
  readonly folderTree?: FolderNode;
}

/**
 * Folder tree node for hierarchical view.
 */
export interface FolderNode {
  /** Folder name */
  readonly name: string;
  /** Full path */
  readonly path: string;
  /** Child folders */
  readonly children: readonly FolderNode[];
  /** Samples in this folder */
  readonly sampleIds: readonly string[];
  /** Is expanded in UI */
  readonly expanded: boolean;
}

/**
 * Sample list item display info.
 */
export interface SampleListItem {
  readonly sample: SampleMetadata;
  readonly isSelected: boolean;
  readonly isFavorite: boolean;
  readonly isRecent: boolean;
  readonly isPreviewing: boolean;
  readonly matchScore: number; // Relevance for search results (0-1)
}

// ============================================================================
// SAMPLE BROWSER PANEL
// ============================================================================

/**
 * Sample browser panel layout configuration.
 */
export interface SampleBrowserPanel {
  /** Panel dimensions */
  readonly width: number;
  readonly height: number;
  /** Sections */
  readonly sections: {
    /** Folder tree (left sidebar) */
    readonly folderTree: {
      readonly visible: boolean;
      readonly width: number;
    };
    /** File list (center) */
    readonly fileList: {
      readonly visible: boolean;
      readonly scrollY: number;
    };
    /** Details panel (right sidebar) */
    readonly details: {
      readonly visible: boolean;
      readonly width: number;
    };
    /** Search bar (top) */
    readonly searchBar: {
      readonly visible: boolean;
      readonly height: number;
    };
    /** Filter bar (below search) */
    readonly filterBar: {
      readonly visible: boolean;
      readonly height: number;
    };
  };
  /** Split pane positions */
  readonly splitPositions: {
    readonly leftSidebar: number;  // % from left
    readonly rightSidebar: number; // % from right
  };
}

/**
 * Creates default sample browser panel layout.
 */
export function createSampleBrowserPanel(
  width: number = 800,
  height: number = 600
): SampleBrowserPanel {
  return {
    width,
    height,
    sections: {
      folderTree: {
        visible: true,
        width: 200
      },
      fileList: {
        visible: true,
        scrollY: 0
      },
      details: {
        visible: true,
        width: 250
      },
      searchBar: {
        visible: true,
        height: 40
      },
      filterBar: {
        visible: true,
        height: 50
      }
    },
    splitPositions: {
      leftSidebar: 25,
      rightSidebar: 30
    }
  };
}

/**
 * Updates panel section visibility.
 */
export function toggleSection(
  panel: SampleBrowserPanel,
  section: 'folderTree' | 'details' | 'searchBar' | 'filterBar',
  visible: boolean
): SampleBrowserPanel {
  return {
    ...panel,
    sections: {
      ...panel.sections,
      [section]: {
        ...panel.sections[section],
        visible
      }
    }
  };
}

/**
 * Updates split pane positions.
 */
export function updateSplitPosition(
  panel: SampleBrowserPanel,
  position: 'leftSidebar' | 'rightSidebar',
  percent: number
): SampleBrowserPanel {
  return {
    ...panel,
    splitPositions: {
      ...panel.splitPositions,
      [position]: Math.max(10, Math.min(90, percent))
    }
  };
}

/**
 * Resizes panel dimensions.
 */
export function resizePanel(
  panel: SampleBrowserPanel,
  width: number,
  height: number
): SampleBrowserPanel {
  return {
    ...panel,
    width: Math.max(400, width),
    height: Math.max(300, height)
  };
}

// ============================================================================
// FOLDER TREE VIEW
// ============================================================================

/**
 * Builds folder tree from sample paths.
 */
export function buildFolderTree(samples: readonly SampleMetadata[]): FolderNode {
  const rootSampleIds: string[] = [];
  const root: FolderNode = {
    name: 'Samples',
    path: '/',
    children: [],
    sampleIds: rootSampleIds,
    expanded: true
  };

  // Group samples by folder path
  const folderMap = new Map<string, { sampleIds: string[], subfolders: Set<string> }>();
  
  for (const sample of samples) {
    const pathParts = sample.path.split('/').filter(p => p);
    let currentPath = '';
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      const folder = pathParts[i];
      if (!folder) continue; // Skip if somehow undefined
      
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${folder}` : folder;
      
      if (!folderMap.has(currentPath)) {
        folderMap.set(currentPath, { sampleIds: [], subfolders: new Set() });
      }
      
      if (parentPath) {
        const parentData = folderMap.get(parentPath);
        if (parentData) {
          parentData.subfolders.add(currentPath);
        }
      }
    }
    
    // Add sample to its parent folder
    if (pathParts.length > 1) {
      const folderPath = pathParts.slice(0, -1).join('/');
      const folderData = folderMap.get(folderPath);
      if (folderData) {
        folderData.sampleIds.push(sample.id);
      }
    } else {
      rootSampleIds.push(sample.id);
    }
  }

  // Convert flat map to tree structure
  function buildNode(path: string, name: string): FolderNode {
    const data = folderMap.get(path) || { sampleIds: [], subfolders: new Set() };
    
    const children = Array.from(data.subfolders).map(childPath => {
      const childName = childPath.split('/').pop()!;
      return buildNode(childPath, childName);
    });
    
    return {
      name,
      path,
      children,
      sampleIds: data.sampleIds,
      expanded: false
    };
  }

  // Build root children
  const rootFolders = Array.from(folderMap.keys())
    .filter(path => !path.includes('/'))
    .map(path => buildNode(path, path));

  return {
    ...root,
    children: rootFolders
  };
}

/**
 * Toggles folder expanded state.
 */
export function toggleFolder(tree: FolderNode, path: string): FolderNode {
  if (tree.path === path) {
    return { ...tree, expanded: !tree.expanded };
  }
  
  return {
    ...tree,
    children: tree.children.map(child => toggleFolder(child, path))
  };
}

/**
 * Expands all folders.
 */
export function expandAll(tree: FolderNode): FolderNode {
  return {
    ...tree,
    expanded: true,
    children: tree.children.map(expandAll)
  };
}

/**
 * Collapses all folders.
 */
export function collapseAll(tree: FolderNode): FolderNode {
  return {
    ...tree,
    expanded: false,
    children: tree.children.map(collapseAll)
  };
}

/**
 * Finds node by path.
 */
export function findNode(tree: FolderNode, path: string): FolderNode | null {
  if (tree.path === path) return tree;
  
  for (const child of tree.children) {
    const found = findNode(child, path);
    if (found) return found;
  }
  
  return null;
}

/**
 * Gets all sample IDs in folder and subfolders.
 */
export function getAllSampleIds(node: FolderNode): string[] {
  const ids = [...node.sampleIds];
  for (const child of node.children) {
    ids.push(...getAllSampleIds(child));
  }
  return ids;
}

// ============================================================================
// FILE LIST VIEW
// ============================================================================

/**
 * Filters samples based on criteria.
 */
export function filterSamples(
  samples: readonly SampleMetadata[],
  config: SampleBrowserConfig
): readonly SampleMetadata[] {
  let filtered = [...samples];

  // Search query
  if (config.searchQuery) {
    const query = config.searchQuery.toLowerCase();
    filtered = filtered.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.tags.some(t => t.toLowerCase().includes(query)) ||
      s.categories.some(c => c.toLowerCase().includes(query))
    );
  }

  // Type filter
  if (config.typeFilter) {
    filtered = filtered.filter(s => s.type === config.typeFilter);
  }

  // Category filter
  if (config.categoryFilter) {
    filtered = filtered.filter(s => s.categories.includes(config.categoryFilter!));
  }

  // Key filter
  if (config.keyFilter) {
    filtered = filtered.filter(s => s.key === config.keyFilter);
  }

  // BPM range
  if (config.bpmRange) {
    filtered = filtered.filter(s =>
      s.bpm !== undefined &&
      s.bpm >= config.bpmRange!.min &&
      s.bpm <= config.bpmRange!.max
    );
  }

  // Duration range
  if (config.durationRange) {
    filtered = filtered.filter(s =>
      s.duration >= config.durationRange!.min &&
      s.duration <= config.durationRange!.max
    );
  }

  // Format filter
  if (config.formatFilter) {
    filtered = filtered.filter(s => s.format === config.formatFilter);
  }

  // Favorites only
  if (config.showFavoritesOnly) {
    filtered = filtered.filter(s => s.isFavorite);
  }

  // Recent only
  if (config.showRecentOnly) {
    filtered = filtered.filter(s => s.lastAccessed !== undefined);
  }

  return filtered;
}

/**
 * Sorts samples based on sort mode.
 */
export function sortSamples(
  samples: readonly SampleMetadata[],
  sortMode: SampleSortMode
): readonly SampleMetadata[] {
  const sorted = [...samples];

  switch (sortMode) {
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'date':
      sorted.sort((a, b) => b.created.getTime() - a.created.getTime());
      break;
    case 'size':
      sorted.sort((a, b) => b.sizeBytes - a.sizeBytes);
      break;
    case 'duration':
      sorted.sort((a, b) => b.duration - a.duration);
      break;
    case 'type':
      sorted.sort((a, b) => {
        const typeCompare = a.type.localeCompare(b.type);
        return typeCompare !== 0 ? typeCompare : a.name.localeCompare(b.name);
      });
      break;
    case 'key':
      sorted.sort((a, b) => {
        if (!a.key && !b.key) return a.name.localeCompare(b.name);
        if (!a.key) return 1;
        if (!b.key) return -1;
        const keyCompare = a.key.localeCompare(b.key);
        return keyCompare !== 0 ? keyCompare : a.name.localeCompare(b.name);
      });
      break;
    case 'bpm':
      sorted.sort((a, b) => {
        if (a.bpm === undefined && b.bpm === undefined) return a.name.localeCompare(b.name);
        if (a.bpm === undefined) return 1;
        if (b.bpm === undefined) return -1;
        return a.bpm - b.bpm;
      });
      break;
    case 'rating':
      sorted.sort((a, b) => {
        const ratingCompare = b.rating - a.rating;
        return ratingCompare !== 0 ? ratingCompare : a.name.localeCompare(b.name);
      });
      break;
    case 'recent':
      sorted.sort((a, b) => {
        if (!a.lastAccessed && !b.lastAccessed) return 0;
        if (!a.lastAccessed) return 1;
        if (!b.lastAccessed) return -1;
        return b.lastAccessed.getTime() - a.lastAccessed.getTime();
      });
      break;
  }

  return sorted;
}

/**
 * Creates sample list items for display.
 */
export function createSampleListItems(
  samples: readonly SampleMetadata[],
  config: SampleBrowserConfig,
  state: SampleBrowserState
): readonly SampleListItem[] {
  return samples.map(sample => ({
    sample,
    isSelected: sample.id === config.selectedSampleId,
    isFavorite: state.favorites.includes(sample.id),
    isRecent: state.recent.includes(sample.id),
    isPreviewing: sample.id === state.previewingSampleId,
    matchScore: calculateMatchScore(sample, config.searchQuery)
  }));
}

/**
 * Calculates search match score (0-1).
 */
function calculateMatchScore(sample: SampleMetadata, query?: string): number {
  if (!query) return 1;

  const lowerQuery = query.toLowerCase();
  let score = 0;

  // Name match (highest weight)
  if (sample.name.toLowerCase().includes(lowerQuery)) {
    score += 0.5;
    if (sample.name.toLowerCase().startsWith(lowerQuery)) {
      score += 0.2;
    }
  }

  // Category match
  if (sample.categories.some(c => c.toLowerCase().includes(lowerQuery))) {
    score += 0.2;
  }

  // Tag match
  if (sample.tags.some(t => t.toLowerCase().includes(lowerQuery))) {
    score += 0.1;
  }

  return Math.min(1, score);
}

// ============================================================================
// SEARCH & FILTER
// ============================================================================

/**
 * Performs instant search on samples.
 */
export function searchSamples(
  samples: readonly SampleMetadata[],
  query: string,
  maxResults: number = 50
): readonly SampleMetadata[] {
  if (!query.trim()) return samples;

  const results = samples
    .map(sample => ({
      sample,
      score: calculateMatchScore(sample, query)
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(({ sample }) => sample);

  return results;
}

/**
 * Gets available filter options from sample collection.
 */
export function getFilterOptions(samples: readonly SampleMetadata[]): {
  categories: readonly string[];
  tags: readonly string[];
  keys: readonly string[];
  formats: readonly string[];
  bpmRange: { min: number; max: number };
  durationRange: { min: number; max: number };
} {
  const categories = new Set<string>();
  const tags = new Set<string>();
  const keys = new Set<string>();
  const formats = new Set<string>();
  let minBpm = Infinity;
  let maxBpm = -Infinity;
  let minDuration = Infinity;
  let maxDuration = -Infinity;

  for (const sample of samples) {
    sample.categories.forEach(c => categories.add(c));
    sample.tags.forEach(t => tags.add(t));
    if (sample.key) keys.add(sample.key);
    formats.add(sample.format);
    
    if (sample.bpm !== undefined) {
      minBpm = Math.min(minBpm, sample.bpm);
      maxBpm = Math.max(maxBpm, sample.bpm);
    }
    
    minDuration = Math.min(minDuration, sample.duration);
    maxDuration = Math.max(maxDuration, sample.duration);
  }

  return {
    categories: Array.from(categories).sort(),
    tags: Array.from(tags).sort(),
    keys: Array.from(keys).sort(),
    formats: Array.from(formats).sort(),
    bpmRange: {
      min: isFinite(minBpm) ? minBpm : 0,
      max: isFinite(maxBpm) ? maxBpm : 200
    },
    durationRange: {
      min: isFinite(minDuration) ? minDuration : 0,
      max: isFinite(maxDuration) ? maxDuration : 60
    }
  };
}

// ============================================================================
// SAMPLE PREVIEW
// ============================================================================

/**
 * Preview playback state.
 */
export interface PreviewState {
  readonly sampleId: string;
  readonly isPlaying: boolean;
  readonly position: number; // 0-1
  readonly volume: number;   // 0-1
  readonly startTime?: number; // AudioContext time
}

/**
 * Starts sample preview.
 */
export function startPreview(sampleId: string, volume: number = 0.7): PreviewState {
  return {
    sampleId,
    isPlaying: true,
    position: 0,
    volume: Math.max(0, Math.min(1, volume))
  };
}

/**
 * Stops sample preview.
 */
export function stopPreview(state: PreviewState): PreviewState {
  return {
    ...state,
    isPlaying: false,
    position: 0
  };
}

/**
 * Updates preview position.
 */
export function updatePreviewPosition(state: PreviewState, position: number): PreviewState {
  return {
    ...state,
    position: Math.max(0, Math.min(1, position))
  };
}

// ============================================================================
// DRAG & DROP SUPPORT
// ============================================================================

/**
 * Sample drag data for drag-drop operations.
 */
export interface SampleDragData {
  readonly type: 'sample';
  readonly sampleId: string;
  readonly sampleName: string;
  readonly format: string;
  readonly duration: number;
}

/**
 * Creates drag data for sample.
 */
export function createSampleDragData(sample: SampleMetadata): SampleDragData {
  return {
    type: 'sample',
    sampleId: sample.id,
    sampleName: sample.name,
    format: sample.format,
    duration: sample.duration
  };
}

/**
 * Validates if drag data is a sample.
 */
export function isSampleDragData(data: unknown): data is SampleDragData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    data.type === 'sample' &&
    'sampleId' in data &&
    typeof data.sampleId === 'string'
  );
}

// ============================================================================
// FAVORITES & RECENTLY USED
// ============================================================================

/**
 * Toggles favorite status for a sample.
 */
export function toggleFavorite(
  favorites: readonly string[],
  sampleId: string
): readonly string[] {
  const index = favorites.indexOf(sampleId);
  if (index >= 0) {
    return favorites.filter((_, i) => i !== index);
  }
  return [...favorites, sampleId];
}

/**
 * Gets favorite samples.
 */
export function getFavorites(
  samples: readonly SampleMetadata[],
  favorites: readonly string[]
): readonly SampleMetadata[] {
  return samples.filter(s => favorites.includes(s.id));
}

/**
 * Adds sample to recently used list.
 */
export function addToRecent(
  recent: readonly string[],
  sampleId: string,
  maxRecent: number = 20
): readonly string[] {
  const filtered = recent.filter(id => id !== sampleId);
  const updated = [sampleId, ...filtered];
  return updated.slice(0, maxRecent);
}

/**
 * Gets recently used samples.
 */
export function getRecentSamples(
  samples: readonly SampleMetadata[],
  recent: readonly string[]
): readonly SampleMetadata[] {
  const sampleMap = new Map(samples.map(s => [s.id, s]));
  return recent
    .map(id => sampleMap.get(id))
    .filter((s): s is SampleMetadata => s !== undefined);
}

/**
 * Clears recently used list.
 */
export function clearRecent(): readonly string[] {
  return [];
}

// ============================================================================
// TAGS & LABELS SYSTEM
// ============================================================================

/**
 * Adds tag to sample.
 */
export function addTag(
  sample: SampleMetadata,
  tag: string
): SampleMetadata {
  if (sample.tags.includes(tag)) return sample;
  return {
    ...sample,
    tags: [...sample.tags, tag]
  };
}

/**
 * Removes tag from sample.
 */
export function removeTag(
  sample: SampleMetadata,
  tag: string
): SampleMetadata {
  return {
    ...sample,
    tags: sample.tags.filter(t => t !== tag)
  };
}

/**
 * Sets all tags for sample.
 */
export function setTags(
  sample: SampleMetadata,
  tags: readonly string[]
): SampleMetadata {
  return {
    ...sample,
    tags
  };
}

/**
 * Gets samples with specific tag.
 */
export function getSamplesByTag(
  samples: readonly SampleMetadata[],
  tag: string
): readonly SampleMetadata[] {
  return samples.filter(s => s.tags.includes(tag));
}

/**
 * Gets all unique tags from samples.
 */
export function getAllTags(samples: readonly SampleMetadata[]): readonly string[] {
  const tagSet = new Set<string>();
  for (const sample of samples) {
    for (const tag of sample.tags) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet).sort();
}

// ============================================================================
// RATING SYSTEM
// ============================================================================

/**
 * Sets rating for sample (0-5 stars).
 */
export function setRating(
  sample: SampleMetadata,
  rating: number
): SampleMetadata {
  return {
    ...sample,
    rating: Math.max(0, Math.min(5, Math.round(rating)))
  };
}

/**
 * Gets samples with minimum rating.
 */
export function getSamplesByMinRating(
  samples: readonly SampleMetadata[],
  minRating: number
): readonly SampleMetadata[] {
  return samples.filter(s => s.rating >= minRating);
}

/**
 * Gets top-rated samples.
 */
export function getTopRatedSamples(
  samples: readonly SampleMetadata[],
  count: number = 10
): readonly SampleMetadata[] {
  return [...samples]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, count);
}

// ============================================================================
// COLLECTIONS & FOLDERS
// ============================================================================

/**
 * Sample collection (user-defined group).
 */
export interface SampleCollection {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly sampleIds: readonly string[];
  readonly color?: string;
  readonly created: Date;
  readonly modified: Date;
}

/**
 * Creates a new empty collection.
 */
export function createCollection(
  id: string,
  name: string,
  description?: string
): SampleCollection {
  const now = new Date();
  return {
    id,
    name,
    ...(description !== undefined ? { description } : {}),
    sampleIds: [],
    created: now,
    modified: now
  };
}

/**
 * Adds sample to collection.
 */
export function addToCollection(
  collection: SampleCollection,
  sampleId: string
): SampleCollection {
  if (collection.sampleIds.includes(sampleId)) return collection;
  return {
    ...collection,
    sampleIds: [...collection.sampleIds, sampleId],
    modified: new Date()
  };
}

/**
 * Removes sample from collection.
 */
export function removeFromCollection(
  collection: SampleCollection,
  sampleId: string
): SampleCollection {
  return {
    ...collection,
    sampleIds: collection.sampleIds.filter(id => id !== sampleId),
    modified: new Date()
  };
}

/**
 * Renames collection.
 */
export function renameCollection(
  collection: SampleCollection,
  name: string
): SampleCollection {
  return {
    ...collection,
    name,
    modified: new Date()
  };
}

/**
 * Sets collection description.
 */
export function setCollectionDescription(
  collection: SampleCollection,
  description: string
): SampleCollection {
  return {
    ...collection,
    description,
    modified: new Date()
  };
}

/**
 * Sets collection color.
 */
export function setCollectionColor(
  collection: SampleCollection,
  color: string
): SampleCollection {
  return {
    ...collection,
    color,
    modified: new Date()
  };
}

/**
 * Gets samples in collection.
 */
export function getCollectionSamples(
  samples: readonly SampleMetadata[],
  collection: SampleCollection
): readonly SampleMetadata[] {
  const sampleMap = new Map(samples.map(s => [s.id, s]));
  return collection.sampleIds
    .map(id => sampleMap.get(id))
    .filter((s): s is SampleMetadata => s !== undefined);
}

// ============================================================================
// DRAG TO TRACK
// ============================================================================

/**
 * Track drag target information.
 */
export interface TrackDragTarget {
  readonly trackId: string;
  readonly position: number; // Position in ticks
  readonly canAccept: boolean;
}

/**
 * Validates if sample can be dropped on track.
 */
export function canDropOnTrack(
  sample: SampleMetadata,
  _trackId: string
): boolean {
  return sample.format !== undefined && sample.path !== undefined;
}

/**
 * Creates drop data for track.
 */
export function createTrackDropData(
  sample: SampleMetadata,
  trackId: string,
  position: number
): {
  sampleId: string;
  trackId: string;
  position: number;
  duration: number;
} {
  return {
    sampleId: sample.id,
    trackId,
    position,
    duration: sample.duration
  };
}

// ============================================================================
// PREVIEW ON HOVER & CLICK
// ============================================================================

/**
 * Preview mode configuration.
 */
export type PreviewMode = 'hover' | 'click' | 'manual';

/**
 * Preview behavior configuration.
 */
export interface PreviewBehavior {
  readonly mode: PreviewMode;
  readonly autoStopOnRelease: boolean;
  readonly hoverDelayMs: number;
  readonly volume: number;
  readonly loopPreview: boolean;
}

/**
 * Default preview behavior.
 */
export const DEFAULT_PREVIEW_BEHAVIOR: PreviewBehavior = {
  mode: 'click',
  autoStopOnRelease: false,
  hoverDelayMs: 300,
  volume: 0.7,
  loopPreview: false
};

/**
 * Creates preview behavior configuration.
 */
export function createPreviewBehavior(
  mode: PreviewMode = 'click',
  autoStopOnRelease: boolean = false
): PreviewBehavior {
  return {
    mode,
    autoStopOnRelease,
    hoverDelayMs: mode === 'hover' ? 300 : 0,
    volume: 0.7,
    loopPreview: false
  };
}

/**
 * Starts preview based on interaction mode.
 */
export function startPreviewByMode(
  sampleId: string,
  mode: PreviewMode,
  behavior: PreviewBehavior
): PreviewState | null {
  if (mode !== behavior.mode) return null;
  return startPreview(sampleId, behavior.volume);
}

/**
 * Stops preview on release if configured.
 */
export function maybeStopPreviewOnRelease(
  state: PreviewState,
  behavior: PreviewBehavior
): PreviewState | null {
  if (!behavior.autoStopOnRelease) return state;
  return null;
}

/**
 * Preview hover state.
 */
export interface PreviewHoverState {
  readonly sampleId: string;
  readonly hoverStartTime: number;
  readonly isHovering: boolean;
  readonly delayExpired: boolean;
}

/**
 * Starts hover timer for preview.
 */
export function startHoverTimer(
  sampleId: string,
  currentTime: number = Date.now()
): PreviewHoverState {
  return {
    sampleId,
    hoverStartTime: currentTime,
    isHovering: true,
    delayExpired: false
  };
}

/**
 * Checks if hover delay has expired.
 */
export function checkHoverDelay(
  hoverState: PreviewHoverState,
  delayMs: number,
  currentTime: number = Date.now()
): PreviewHoverState {
  const elapsed = currentTime - hoverState.hoverStartTime;
  return {
    ...hoverState,
    delayExpired: elapsed >= delayMs
  };
}

/**
 * Stops hover timer.
 */
export function stopHoverTimer(
  hoverState: PreviewHoverState
): PreviewHoverState {
  return {
    ...hoverState,
    isHovering: false
  };
}

/**
 * Should start preview based on hover state.
 */
export function shouldStartHoverPreview(
  hoverState: PreviewHoverState,
  behavior: PreviewBehavior
): boolean {
  return (
    behavior.mode === 'hover' &&
    hoverState.isHovering &&
    hoverState.delayExpired
  );
}
