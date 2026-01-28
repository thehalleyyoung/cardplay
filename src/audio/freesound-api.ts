/**
 * @fileoverview Freesound API Integration
 * 
 * Provides integration with Freesound.org API for sample discovery and download.
 * Uses Creative Commons 0 (public domain) license filter by default.
 * 
 * @module @cardplay/core/audio/freesound-api
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const FREESOUND_API_BASE = 'https://freesound.org/apiv2';
const FREESOUND_API_KEY = 'V7fHSA9OZ83ldrhvUqWwN2Pqs15mE34ndBPHS1td';

/** Default page size for search results */
export const DEFAULT_PAGE_SIZE = 15;

/** Maximum results to fetch */
export const MAX_RESULTS = 150;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Freesound license type.
 */
export type FreesoundLicense =
  | 'Creative Commons 0'
  | 'Attribution'
  | 'Attribution Noncommercial';

/**
 * Freesound sound resource.
 */
export interface FreesoundSound {
  /** Sound ID */
  readonly id: number;
  /** Sound name */
  readonly name: string;
  /** Tags */
  readonly tags: readonly string[];
  /** Description */
  readonly description: string;
  /** Username of uploader */
  readonly username: string;
  /** License */
  readonly license: string;
  /** Duration in seconds */
  readonly duration: number;
  /** Sample rate */
  readonly samplerate: number;
  /** Number of channels */
  readonly channels: number;
  /** File size in bytes */
  readonly filesize: number;
  /** Bit depth */
  readonly bitdepth: number;
  /** Bit rate (kbps) */
  readonly bitrate: number;
  /** File type (wav, mp3, etc) */
  readonly type: string;
  /** Preview URLs */
  readonly previews: {
    readonly 'preview-lq-mp3': string;
    readonly 'preview-lq-ogg': string;
    readonly 'preview-hq-mp3': string;
    readonly 'preview-hq-ogg': string;
  };
  /** Sound URL on Freesound */
  readonly url: string;
  /** Download URL (requires authentication) */
  readonly download?: string;
}

/**
 * Freesound search query configuration.
 */
export interface FreesoundSearchQuery {
  /** Search query string */
  readonly query: string;
  /** Filter by Creative Commons 0 license */
  readonly cc0Only?: boolean;
  /** Minimum duration in seconds */
  readonly minDuration?: number;
  /** Maximum duration in seconds */
  readonly maxDuration?: number;
  /** Filter by tags (all must match) */
  readonly tags?: readonly string[];
  /** Page number (1-based) */
  readonly page?: number;
  /** Results per page */
  readonly pageSize?: number;
  /** Sort order */
  readonly sort?: 'score' | 'duration_desc' | 'duration_asc' | 'downloads_desc' | 'rating_desc';
}

/**
 * Freesound search result.
 */
export interface FreesoundSearchResult {
  /** Total count of matching sounds */
  readonly count: number;
  /** Next page URL (if available) */
  readonly next: string | null;
  /** Previous page URL (if available) */
  readonly previous: string | null;
  /** Results for this page */
  readonly results: readonly FreesoundSound[];
}

/**
 * Freesound download progress callback.
 */
export type FreesoundDownloadProgressCallback = (loaded: number, total: number) => void;

/**
 * Downloaded sound with audio buffer.
 */
export interface DownloadedSound {
  /** Freesound sound metadata */
  readonly sound: FreesoundSound;
  /** Audio buffer */
  readonly audioBuffer: AudioBuffer;
  /** Attribution text */
  readonly attribution: string;
}

// ============================================================================
// SEARCH API
// ============================================================================

/**
 * Build query parameters for Freesound API.
 */
function buildSearchParams(query: FreesoundSearchQuery): URLSearchParams {
  const params = new URLSearchParams();

  params.set('query', query.query);
  params.set('token', FREESOUND_API_KEY);
  params.set('fields', 'id,name,tags,description,username,license,duration,samplerate,channels,filesize,bitdepth,bitrate,type,previews,url,download');

  // License filter
  if (query.cc0Only !== false) {
    params.set('filter', 'license:"Creative Commons 0"');
  }

  // Duration filter
  if (query.minDuration !== undefined || query.maxDuration !== undefined) {
    const durationFilter: string[] = [];
    if (query.minDuration !== undefined) {
      durationFilter.push(`duration:[${query.minDuration} TO *]`);
    }
    if (query.maxDuration !== undefined) {
      durationFilter.push(`duration:[* TO ${query.maxDuration}]`);
    }
    if (durationFilter.length > 0) {
      const existing = params.get('filter');
      const combined = existing ? `${existing} ${durationFilter.join(' ')}` : durationFilter.join(' ');
      params.set('filter', combined);
    }
  }

  // Tag filter
  if (query.tags && query.tags.length > 0) {
    const tagFilter = query.tags.map(tag => `tag:${tag}`).join(' ');
    const existing = params.get('filter');
    const combined = existing ? `${existing} ${tagFilter}` : tagFilter;
    params.set('filter', combined);
  }

  // Pagination
  params.set('page', String(query.page ?? 1));
  params.set('page_size', String(query.pageSize ?? DEFAULT_PAGE_SIZE));

  // Sort
  if (query.sort) {
    params.set('sort', query.sort);
  }

  return params;
}

/**
 * Search Freesound for samples.
 */
export async function searchFreesound(
  query: FreesoundSearchQuery
): Promise<FreesoundSearchResult> {
  const params = buildSearchParams(query);
  const url = `${FREESOUND_API_BASE}/search/text/?${params.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Freesound API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return {
    count: data.count,
    next: data.next,
    previous: data.previous,
    results: data.results,
  };
}

/**
 * Get a specific sound by ID.
 */
export async function getSound(soundId: number): Promise<FreesoundSound> {
  const url = `${FREESOUND_API_BASE}/sounds/${soundId}/?token=${FREESOUND_API_KEY}&fields=id,name,tags,description,username,license,duration,samplerate,channels,filesize,bitdepth,bitrate,type,previews,url,download`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Freesound API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Search similar sounds by ID.
 */
export async function searchSimilar(
  soundId: number,
  maxResults: number = 10
): Promise<readonly FreesoundSound[]> {
  const url = `${FREESOUND_API_BASE}/sounds/${soundId}/similar/?token=${FREESOUND_API_KEY}&page_size=${maxResults}&fields=id,name,tags,description,username,license,duration,samplerate,channels,filesize,bitdepth,bitrate,type,previews,url,download`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Freesound API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.results;
}

// ============================================================================
// DOWNLOAD API
// ============================================================================

/**
 * Download and decode audio from Freesound preview URL.
 */
export async function downloadSound(
  sound: FreesoundSound,
  audioContext: BaseAudioContext,
  onProgress?: FreesoundDownloadProgressCallback
): Promise<DownloadedSound> {
  // Use HQ preview
  const previewUrl = sound.previews['preview-hq-mp3'];

  const response = await fetch(previewUrl);

  if (!response.ok) {
    throw new Error(`Failed to download sound: ${response.status} ${response.statusText}`);
  }

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
    loaded += value.length;

    if (onProgress && total > 0) {
      onProgress(loaded, total);
    }
  }

  // Combine chunks
  const audioData = new Uint8Array(loaded);
  let position = 0;
  for (const chunk of chunks) {
    audioData.set(chunk, position);
    position += chunk.length;
  }

  // Decode audio
  const audioBuffer = await audioContext.decodeAudioData(audioData.buffer);

  // Generate attribution
  const attribution = generateAttribution(sound);

  return {
    sound,
    audioBuffer,
    attribution,
  };
}

/**
 * Batch download multiple sounds.
 */
export async function downloadSounds(
  sounds: readonly FreesoundSound[],
  audioContext: BaseAudioContext,
  onProgress?: (soundIndex: number, loaded: number, total: number) => void
): Promise<readonly DownloadedSound[]> {
  const results: DownloadedSound[] = [];

  for (let i = 0; i < sounds.length; i++) {
    const sound = sounds[i];
    if (!sound) continue;
    const downloaded = await downloadSound(
      sound,
      audioContext,
      onProgress ? (loaded, total) => onProgress(i, loaded, total) : undefined
    );
    results.push(downloaded);
  }

  return results;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate attribution text for a Freesound sound.
 */
export function generateAttribution(sound: FreesoundSound): string {
  return `"${sound.name}" by ${sound.username} (${sound.license}) - ${sound.url}`;
}

/**
 * Check if a sound is Creative Commons 0 (public domain).
 */
export function isCC0(sound: FreesoundSound): boolean {
  return sound.license === 'Creative Commons 0';
}

/**
 * Format duration as MM:SS.
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size in human-readable form.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Detect musical key from tags or description (heuristic).
 */
export function detectKey(sound: FreesoundSound): string | null {
  const keyRegex = /\b([A-G][#b]?)\s*(major|minor|maj|min|m)?\b/i;
  const tagsText = sound.tags.join(' ');
  const searchText = `${sound.name} ${sound.description} ${tagsText}`.toLowerCase();

  const match = keyRegex.exec(searchText);
  if (match) {
    const note = match[1];
    const mode = match[2];
    if (!note) return null;
    const upperNote = note.toUpperCase();
    const modeStr = mode ? (mode.toLowerCase().startsWith('min') ? 'minor' : 'major') : null;
    return modeStr ? `${upperNote} ${modeStr}` : upperNote;
  }

  return null;
}

/**
 * Detect tempo/BPM from tags or description (heuristic).
 */
export function detectTempo(sound: FreesoundSound): number | null {
  const bpmRegex = /\b(\d{2,3})\s*bpm\b/i;
  const tagsText = sound.tags.join(' ');
  const searchText = `${sound.name} ${sound.description} ${tagsText}`.toLowerCase();

  const match = bpmRegex.exec(searchText);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }

  return null;
}

/**
 * Check if a sound is a drum/percussion sound (heuristic).
 */
export function isDrumSound(sound: FreesoundSound): boolean {
  const drumKeywords = [
    'kick', 'snare', 'hihat', 'hi-hat', 'cymbal', 'tom', 'clap',
    'percussion', 'drum', 'beat', 'hat', 'ride', 'crash'
  ];

  const tagsText = sound.tags.join(' ').toLowerCase();
  const nameText = sound.name.toLowerCase();

  return drumKeywords.some(keyword =>
    tagsText.includes(keyword) || nameText.includes(keyword)
  );
}

/**
 * Check if a sound is a musical note/instrument sound.
 */
export function isMusicalSound(sound: FreesoundSound): boolean {
  const musicalKeywords = [
    'note', 'chord', 'melody', 'bass', 'synth', 'piano', 'guitar',
    'strings', 'pad', 'lead', 'pluck', 'organ', 'bell', 'key'
  ];

  const tagsText = sound.tags.join(' ').toLowerCase();
  const nameText = sound.name.toLowerCase();

  return musicalKeywords.some(keyword =>
    tagsText.includes(keyword) || nameText.includes(keyword)
  );
}

// ============================================================================
// PRESET QUERIES
// ============================================================================

/**
 * Common preset search queries.
 */
export const PRESET_QUERIES = {
  /** Kick drums */
  kick: {
    query: 'kick drum',
    cc0Only: true,
    minDuration: 0.1,
    maxDuration: 2.0,
    tags: ['single-note'],
  },

  /** Snare drums */
  snare: {
    query: 'snare drum',
    cc0Only: true,
    minDuration: 0.1,
    maxDuration: 2.0,
    tags: ['single-note'],
  },

  /** Hi-hats */
  hihat: {
    query: 'hihat',
    cc0Only: true,
    minDuration: 0.05,
    maxDuration: 1.0,
    tags: ['single-note'],
  },

  /** Percussion loops */
  percussionLoop: {
    query: 'percussion loop',
    cc0Only: true,
    minDuration: 1.0,
    maxDuration: 10.0,
    tags: ['loop'],
  },

  /** Bass notes */
  bass: {
    query: 'bass note',
    cc0Only: true,
    minDuration: 0.5,
    maxDuration: 5.0,
    tags: ['single-note'],
  },

  /** Synth pads */
  synthPad: {
    query: 'synth pad',
    cc0Only: true,
    minDuration: 1.0,
    maxDuration: 10.0,
  },

  /** Piano notes */
  piano: {
    query: 'piano',
    cc0Only: true,
    minDuration: 0.5,
    maxDuration: 5.0,
    tags: ['single-note'],
  },

  /** Guitar plucks */
  guitar: {
    query: 'guitar',
    cc0Only: true,
    minDuration: 0.5,
    maxDuration: 5.0,
    tags: ['single-note'],
  },

  /** Ambient textures */
  ambient: {
    query: 'ambient',
    cc0Only: true,
    minDuration: 5.0,
    maxDuration: 60.0,
  },

  /** Vocal samples */
  vocal: {
    query: 'vocal',
    cc0Only: true,
    minDuration: 0.5,
    maxDuration: 10.0,
  },
} as const satisfies Record<string, FreesoundSearchQuery>;
