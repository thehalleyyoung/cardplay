/**
 * @fileoverview Freesound Search Panel Component
 * 
 * UI component for searching and browsing Freesound samples with:
 * - Search input with query suggestions
 * - License filtering (CC0, Attribution, etc.)
 * - Result grid with preview playback
 * - Attribution tracking
 * - Favorites management
 * - Download progress indication
 * 
 * @module @cardplay/core/ui/components/freesound-search-panel
 */

import type {
  FreesoundSearchQuery,
  FreesoundSearchResult,
  FreesoundSound,
  FreesoundLicense,
} from '../../audio/freesound-api';
import {
  searchFreesound,
  downloadSound,
  generateAttribution,
  DEFAULT_PAGE_SIZE,
} from '../../audio/freesound-api';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Search panel state
 */
export interface FreesoundSearchPanelState {
  /** Current search query */
  readonly query: string;
  /** Selected license filter */
  readonly licenseFilter: FreesoundLicense | 'all';
  /** Minimum duration filter (seconds) */
  readonly minDuration: number;
  /** Maximum duration filter (seconds) */
  readonly maxDuration: number;
  /** Selected tags filter */
  readonly tags: readonly string[];
  /** Current page (1-based) */
  readonly page: number;
  /** Results per page */
  readonly pageSize: number;
  /** Sort order */
  readonly sort: 'score' | 'duration_desc' | 'duration_asc' | 'downloads_desc' | 'rating_desc';
  /** Search results */
  readonly results: FreesoundSearchResult | null;
  /** Currently playing preview sound ID */
  readonly playingPreview: number | null;
  /** Download progress per sound ID */
  readonly downloadProgress: ReadonlyMap<number, number>;
  /** Downloading sound IDs */
  readonly downloading: ReadonlySet<number>;
  /** Favorite sound IDs */
  readonly favorites: ReadonlySet<number>;
  /** Attribution tracking per sound ID */
  readonly attributions: ReadonlyMap<number, string>;
  /** Loading state */
  readonly loading: boolean;
  /** Error message */
  readonly error: string | null;
}

/**
 * Search panel action types
 */
export type FreesoundSearchPanelAction =
  | { type: 'SET_QUERY'; query: string }
  | { type: 'SET_LICENSE_FILTER'; filter: FreesoundLicense | 'all' }
  | { type: 'SET_DURATION_RANGE'; min: number; max: number }
  | { type: 'ADD_TAG'; tag: string }
  | { type: 'REMOVE_TAG'; tag: string }
  | { type: 'SET_PAGE'; page: number }
  | { type: 'SET_PAGE_SIZE'; pageSize: number }
  | { type: 'SET_SORT'; sort: FreesoundSearchPanelState['sort'] }
  | { type: 'SEARCH_START' }
  | { type: 'SEARCH_SUCCESS'; results: FreesoundSearchResult }
  | { type: 'SEARCH_ERROR'; error: string }
  | { type: 'PLAY_PREVIEW'; soundId: number }
  | { type: 'STOP_PREVIEW' }
  | { type: 'DOWNLOAD_START'; soundId: number }
  | { type: 'DOWNLOAD_PROGRESS'; soundId: number; progress: number }
  | { type: 'DOWNLOAD_COMPLETE'; soundId: number; attribution: string }
  | { type: 'DOWNLOAD_ERROR'; soundId: number; error: string }
  | { type: 'TOGGLE_FAVORITE'; soundId: number }
  | { type: 'SET_FAVORITES'; favorites: ReadonlySet<number> }
  | { type: 'CLEAR_ERROR' };

/**
 * Search panel configuration
 */
export interface FreesoundSearchPanelConfig {
  /** Initial query */
  readonly initialQuery?: string;
  /** Show license filter */
  readonly showLicenseFilter?: boolean;
  /** Show duration filter */
  readonly showDurationFilter?: boolean;
  /** Show tags filter */
  readonly showTagsFilter?: boolean;
  /** Enable favorites */
  readonly enableFavorites?: boolean;
  /** Audio context for downloads */
  readonly audioContext?: BaseAudioContext;
  /** Callback when sound is selected */
  readonly onSoundSelect?: (sound: FreesoundSound) => void;
  /** Callback when sound is downloaded */
  readonly onSoundDownload?: (soundId: number, audioBuffer: AudioBuffer) => void;
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Create initial search panel state
 */
export function createFreesoundSearchPanelState(
  config: FreesoundSearchPanelConfig = {}
): FreesoundSearchPanelState {
  return {
    query: config.initialQuery ?? '',
    licenseFilter: 'all',
    minDuration: 0,
    maxDuration: 30,
    tags: [],
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    sort: 'score',
    results: null,
    playingPreview: null,
    downloadProgress: new Map(),
    downloading: new Set(),
    favorites: new Set(),
    attributions: new Map(),
    loading: false,
    error: null,
  };
}

/**
 * Search panel state reducer
 */
export function freesoundSearchPanelReducer(
  state: FreesoundSearchPanelState,
  action: FreesoundSearchPanelAction
): FreesoundSearchPanelState {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, query: action.query, page: 1 };

    case 'SET_LICENSE_FILTER':
      return { ...state, licenseFilter: action.filter, page: 1 };

    case 'SET_DURATION_RANGE':
      return { ...state, minDuration: action.min, maxDuration: action.max, page: 1 };

    case 'ADD_TAG':
      return {
        ...state,
        tags: [...state.tags, action.tag],
        page: 1,
      };

    case 'REMOVE_TAG':
      return {
        ...state,
        tags: state.tags.filter(t => t !== action.tag),
        page: 1,
      };

    case 'SET_PAGE':
      return { ...state, page: action.page };

    case 'SET_PAGE_SIZE':
      return { ...state, pageSize: action.pageSize, page: 1 };

    case 'SET_SORT':
      return { ...state, sort: action.sort, page: 1 };

    case 'SEARCH_START':
      return { ...state, loading: true, error: null };

    case 'SEARCH_SUCCESS':
      return {
        ...state,
        results: action.results,
        loading: false,
        error: null,
      };

    case 'SEARCH_ERROR':
      return {
        ...state,
        loading: false,
        error: action.error,
      };

    case 'PLAY_PREVIEW':
      return { ...state, playingPreview: action.soundId };

    case 'STOP_PREVIEW':
      return { ...state, playingPreview: null };

    case 'DOWNLOAD_START': {
      const downloading = new Set(state.downloading);
      downloading.add(action.soundId);
      return { ...state, downloading };
    }

    case 'DOWNLOAD_PROGRESS': {
      const downloadProgress = new Map(state.downloadProgress);
      downloadProgress.set(action.soundId, action.progress);
      return { ...state, downloadProgress };
    }

    case 'DOWNLOAD_COMPLETE': {
      const downloading = new Set(state.downloading);
      downloading.delete(action.soundId);
      const downloadProgress = new Map(state.downloadProgress);
      downloadProgress.delete(action.soundId);
      const attributions = new Map(state.attributions);
      attributions.set(action.soundId, action.attribution);
      return { ...state, downloading, downloadProgress, attributions };
    }

    case 'DOWNLOAD_ERROR': {
      const downloading = new Set(state.downloading);
      downloading.delete(action.soundId);
      const downloadProgress = new Map(state.downloadProgress);
      downloadProgress.delete(action.soundId);
      return {
        ...state,
        downloading,
        downloadProgress,
        error: action.error,
      };
    }

    case 'TOGGLE_FAVORITE': {
      const favorites = new Set(state.favorites);
      if (favorites.has(action.soundId)) {
        favorites.delete(action.soundId);
      } else {
        favorites.add(action.soundId);
      }
      return { ...state, favorites };
    }

    case 'SET_FAVORITES':
      return { ...state, favorites: action.favorites };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Perform Freesound search with current filters
 */
export async function performSearch(
  state: FreesoundSearchPanelState,
  dispatch: (action: FreesoundSearchPanelAction) => void
): Promise<void> {
  if (!state.query.trim()) {
    return;
  }

  dispatch({ type: 'SEARCH_START' });

  try {
    const query: FreesoundSearchQuery = {
      query: state.query,
      ...(state.licenseFilter === 'Creative Commons 0' && { cc0Only: true }),
      ...(state.minDuration > 0 && { minDuration: state.minDuration }),
      ...(state.maxDuration > 0 && { maxDuration: state.maxDuration }),
      ...(state.tags.length > 0 && { tags: state.tags }),
      page: state.page,
      pageSize: state.pageSize,
      sort: state.sort,
    };

    const results = await searchFreesound(query);
    dispatch({ type: 'SEARCH_SUCCESS', results });
  } catch (error) {
    dispatch({
      type: 'SEARCH_ERROR',
      error: error instanceof Error ? error.message : 'Search failed',
    });
  }
}

/**
 * Download a sound from Freesound
 */
export async function downloadSoundFromPanel(
  sound: FreesoundSound,
  audioContext: BaseAudioContext,
  dispatch: (action: FreesoundSearchPanelAction) => void,
  onDownload?: (soundId: number, audioBuffer: AudioBuffer) => void
): Promise<void> {
  dispatch({ type: 'DOWNLOAD_START', soundId: sound.id });

  try {
    const result = await downloadSound(
      sound,
      audioContext,
      (loaded, total) => {
        const progress = total > 0 ? loaded / total : 0;
        dispatch({
          type: 'DOWNLOAD_PROGRESS',
          soundId: sound.id,
          progress,
        });
      }
    );

    dispatch({
      type: 'DOWNLOAD_COMPLETE',
      soundId: sound.id,
      attribution: result.attribution,
    });

    if (onDownload) {
      onDownload(sound.id, result.audioBuffer);
    }
  } catch (error) {
    dispatch({
      type: 'DOWNLOAD_ERROR',
      soundId: sound.id,
      error: error instanceof Error ? error.message : 'Download failed',
    });
  }
}

/**
 * Toggle favorite for a sound
 */
export function toggleFavorite(
  soundId: number,
  dispatch: (action: FreesoundSearchPanelAction) => void
): void {
  dispatch({ type: 'TOGGLE_FAVORITE', soundId });
}

/**
 * Load favorites from storage
 */
export function loadFavorites(
  dispatch: (action: FreesoundSearchPanelAction) => void
): void {
  try {
    const stored = localStorage.getItem('cardplay_freesound_favorites');
    if (stored) {
      const favoriteIds = JSON.parse(stored) as number[];
      dispatch({ type: 'SET_FAVORITES', favorites: new Set(favoriteIds) });
    }
  } catch (error) {
    console.error('Failed to load favorites:', error);
  }
}

/**
 * Save favorites to storage
 */
export function saveFavorites(favorites: ReadonlySet<number>): void {
  try {
    const favoriteIds = Array.from(favorites);
    localStorage.setItem('cardplay_freesound_favorites', JSON.stringify(favoriteIds));
  } catch (error) {
    console.error('Failed to save favorites:', error);
  }
}

// ============================================================================
// ATTRIBUTION MANAGEMENT
// ============================================================================

/**
 * Attribution entry for a downloaded sound
 */
export interface FreesoundAttribution {
  /** Sound ID */
  readonly soundId: number;
  /** Sound name */
  readonly name: string;
  /** Uploader username */
  readonly username: string;
  /** License */
  readonly license: string;
  /** Freesound URL */
  readonly url: string;
  /** Generated attribution text */
  readonly attribution: string;
}

/**
 * Get attribution for a sound
 */
export function getAttribution(
  sound: FreesoundSound
): FreesoundAttribution {
  return {
    soundId: sound.id,
    name: sound.name,
    username: sound.username,
    license: sound.license,
    url: sound.url,
    attribution: generateAttribution(sound),
  };
}

/**
 * Get all attributions from state
 */
export function getAllAttributions(
  state: FreesoundSearchPanelState,
  sounds: readonly FreesoundSound[]
): readonly FreesoundAttribution[] {
  return sounds
    .filter(sound => state.attributions.has(sound.id))
    .map(sound => getAttribution(sound));
}

/**
 * Format attributions as text for export
 */
export function formatAttributionsText(
  attributions: readonly FreesoundAttribution[]
): string {
  if (attributions.length === 0) {
    return '';
  }

  const lines = [
    'Sounds from Freesound.org:',
    '',
    ...attributions.map(attr => `- ${attr.attribution}`),
  ];

  return lines.join('\n');
}

/**
 * Format attributions as HTML for display
 */
export function formatAttributionsHTML(
  attributions: readonly FreesoundAttribution[]
): string {
  if (attributions.length === 0) {
    return '';
  }

  const items = attributions.map(attr =>
    `<li><a href="${attr.url}" target="_blank">"${attr.name}"</a> by ${attr.username} (${attr.license})</li>`
  );

  return `<div class="freesound-attributions">
  <h3>Sounds from Freesound.org:</h3>
  <ul>
    ${items.join('\n    ')}
  </ul>
</div>`;
}

// ============================================================================
// SUGGESTED QUERIES
// ============================================================================

/**
 * Common search query suggestions by category
 */
export const SEARCH_QUERY_SUGGESTIONS: Record<string, readonly string[]> = {
  'Drums & Percussion': [
    'kick drum',
    'snare drum',
    'hi-hat',
    'cymbal',
    'tom drum',
    'clap',
    'percussion',
    'shaker',
    'tambourine',
    'bongo',
  ],
  'Bass': [
    'bass synth',
    'sub bass',
    '808 bass',
    'bass guitar',
    'upright bass',
    'electric bass',
  ],
  'Leads & Synths': [
    'lead synth',
    'synth lead',
    'synth pad',
    'synth pluck',
    'synth brass',
    'analog synth',
  ],
  'Keys & Piano': [
    'piano',
    'electric piano',
    'rhodes',
    'organ',
    'synth keys',
    'harpsichord',
  ],
  'Vocals': [
    'vocal chop',
    'vocal phrase',
    'choir',
    'vocal ah',
    'vocal oh',
    'beatbox',
  ],
  'FX & Atmospheres': [
    'riser',
    'impact',
    'whoosh',
    'ambience',
    'drone',
    'noise',
    'glitch',
  ],
};

/**
 * Get all suggested queries as flat list
 */
export function getAllSuggestedQueries(): readonly string[] {
  return Object.values(SEARCH_QUERY_SUGGESTIONS).flat();
}

/**
 * Filter suggestions by partial query
 */
export function filterSuggestions(
  partial: string,
  maxResults: number = 10
): readonly string[] {
  const lower = partial.toLowerCase();
  return getAllSuggestedQueries()
    .filter(suggestion => suggestion.toLowerCase().includes(lower))
    .slice(0, maxResults);
}
