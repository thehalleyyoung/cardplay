/**
 * @fileoverview Freesound API Integration
 * 
 * Provides access to the Freesound.org sample library with:
 * - Creative Commons 0 licensed samples
 * - Search by instrument, tags, and attributes
 * - Batch download for multi-sample instruments
 * - Preview playback before download
 * - Automatic sample pack organization
 * 
 * @module @cardplay/core/audio/freesound
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Freesound API token */
export const FREESOUND_API_TOKEN = 'V7fHSA9OZ83ldrhvUqWwN2Pqs15mE34ndBPHS1td';

/** Freesound API base URL */
export const FREESOUND_API_BASE = 'https://freesound.org/apiv2';

/** Default page size for search results */
export const DEFAULT_PAGE_SIZE = 15;

/** Maximum page size */
export const MAX_PAGE_SIZE = 150;

/** Common instrument search terms */
export const INSTRUMENT_SEARCH_TERMS: Record<string, string[]> = {
  violin: ['violin', 'fiddle', 'strings'],
  viola: ['viola', 'strings'],
  cello: ['cello', 'violoncello', 'strings'],
  'double-bass': ['double bass', 'contrabass', 'upright bass'],
  piano: ['piano', 'grand piano', 'upright piano'],
  guitar: ['guitar', 'acoustic guitar', 'nylon guitar'],
  'electric-guitar': ['electric guitar', 'e-guitar'],
  bass: ['bass guitar', 'electric bass', 'e-bass'],
  trumpet: ['trumpet', 'brass'],
  trombone: ['trombone', 'brass'],
  'french-horn': ['french horn', 'horn', 'brass'],
  tuba: ['tuba', 'brass'],
  flute: ['flute', 'woodwind'],
  clarinet: ['clarinet', 'woodwind'],
  oboe: ['oboe', 'woodwind'],
  bassoon: ['bassoon', 'woodwind'],
  saxophone: ['saxophone', 'sax'],
  'alto-sax': ['alto sax', 'alto saxophone'],
  'tenor-sax': ['tenor sax', 'tenor saxophone'],
  drums: ['drums', 'drum kit', 'percussion'],
  kick: ['kick', 'bass drum', 'kick drum'],
  snare: ['snare', 'snare drum'],
  hihat: ['hi-hat', 'hihat', 'hi hat', 'cymbal'],
  'ride-cymbal': ['ride cymbal', 'ride', 'cymbal'],
  'crash-cymbal': ['crash cymbal', 'crash', 'cymbal'],
  tom: ['tom', 'tom-tom', 'floor tom'],
  marimba: ['marimba', 'mallet', 'percussion'],
  vibraphone: ['vibraphone', 'vibes', 'mallet'],
  xylophone: ['xylophone', 'mallet', 'percussion'],
  glockenspiel: ['glockenspiel', 'bells', 'mallet'],
  harp: ['harp', 'concert harp'],
  organ: ['organ', 'pipe organ', 'church organ'],
  harpsichord: ['harpsichord', 'clavecin'],
  synth: ['synth', 'synthesizer'],
  voice: ['voice', 'vocal', 'choir'],
  choir: ['choir', 'choral', 'voices'],
};

/** Note name regex for detecting pitch from filename */
export const NOTE_REGEX = /(?:^|[_\-\s])([A-Ga-g])([#b]?)(\d)(?:[_\-\s]|$)/;

/** Velocity/dynamics markers */
export const VELOCITY_MARKERS = {
  pp: 30,
  p: 50,
  mp: 70,
  mf: 85,
  f: 100,
  ff: 115,
  fff: 127,
  piano: 50,
  forte: 100,
  soft: 40,
  hard: 110,
  gentle: 35,
  loud: 115,
};

// ============================================================================
// TYPES
// ============================================================================

/**
 * Freesound license types
 */
export type FreesoundLicense = 
  | 'Creative Commons 0'
  | 'Attribution'
  | 'Attribution Noncommercial';

/**
 * Freesound sample preview URLs
 */
export interface FreesoundPreviews {
  readonly 'preview-hq-mp3'?: string;
  readonly 'preview-lq-mp3'?: string;
  readonly 'preview-hq-ogg'?: string;
  readonly 'preview-lq-ogg'?: string;
}

/**
 * Freesound sample analysis data
 */
export interface FreesoundAnalysis {
  readonly lowlevel?: {
    readonly pitch?: {
      readonly mean: number;
      readonly var: number;
    };
    readonly pitch_salience?: {
      readonly mean: number;
    };
    readonly spectral_centroid?: {
      readonly mean: number;
    };
  };
  readonly rhythm?: {
    readonly bpm?: number;
    readonly onset_rate?: number;
  };
  readonly tonal?: {
    readonly key_key?: string;
    readonly key_scale?: string;
    readonly tuning_frequency?: number;
  };
}

/**
 * Freesound sample result
 */
export interface FreesoundSample {
  readonly id: number;
  readonly name: string;
  readonly tags: readonly string[];
  readonly description?: string;
  readonly username: string;
  readonly url: string;
  readonly previews: FreesoundPreviews;
  readonly download?: string;
  readonly license: string;
  readonly duration?: number;
  readonly samplerate?: number;
  readonly bitdepth?: number;
  readonly channels?: number;
  readonly filesize?: number;
  readonly num_downloads?: number;
  readonly avg_rating?: number;
  readonly num_ratings?: number;
  readonly analysis?: FreesoundAnalysis;
  readonly ac_analysis?: {
    readonly ac_note_midi?: number;
    readonly ac_note_name?: string;
    readonly ac_tempo?: number;
    readonly ac_single_event?: boolean;
    readonly ac_tonality?: string;
  };
}

/**
 * Freesound search response
 */
export interface FreesoundSearchResponse {
  readonly count: number;
  readonly next: string | null;
  readonly previous: string | null;
  readonly results: readonly FreesoundSample[];
}

/**
 * Freesound pack info
 */
export interface FreesoundPack {
  readonly id: number;
  readonly name: string;
  readonly username: string;
  readonly num_sounds: number;
  readonly num_downloads: number;
}

/**
 * Search filters
 */
export interface FreesoundSearchFilters {
  /** Minimum duration in seconds */
  readonly minDuration?: number;
  /** Maximum duration in seconds */
  readonly maxDuration?: number;
  /** Required tags */
  readonly tags?: readonly string[];
  /** Minimum sample rate */
  readonly minSampleRate?: number;
  /** Is single event (one-shot) */
  readonly singleEvent?: boolean;
  /** Specific pack ID */
  readonly packId?: number;
  /** Has MIDI note analysis */
  readonly hasPitchAnalysis?: boolean;
  /** Sort order */
  readonly sort?: 'score' | 'duration_desc' | 'duration_asc' | 'created_desc' | 'created_asc' | 'downloads_desc' | 'rating_desc';
}

/**
 * Organized sample pack for instrument creation
 */
export interface SamplePack {
  readonly name: string;
  readonly instrument: string;
  readonly samples: readonly OrganizedSample[];
  readonly pitchRange: { low: number; high: number };
  readonly velocityLayers: number;
  readonly roundRobinCount: number;
}

/**
 * Sample with detected/inferred pitch
 */
export interface OrganizedSample {
  readonly freesoundId: number;
  readonly name: string;
  readonly previewUrl: string;
  downloadUrl?: string;
  readonly midiNote: number;
  readonly midiNoteConfidence: number;
  readonly velocity: number;
  readonly roundRobinIndex: number;
  readonly fineTuneCents: number;
  readonly duration: number;
}

/**
 * Downloaded and decoded sample
 */
export interface LoadedSample {
  readonly freesoundId: number;
  readonly name: string;
  readonly midiNote: number;
  readonly velocity: number;
  readonly fineTuneCents: number;
  readonly audioBuffer: AudioBuffer;
  readonly duration: number;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Build a Freesound API URL with parameters.
 */
export function buildApiUrl(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined>
): string {
  const url = new URL(`${FREESOUND_API_BASE}${endpoint}`);
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }
  
  url.searchParams.set('token', FREESOUND_API_TOKEN);
  return url.toString();
}

/**
 * Search for samples on Freesound.
 */
export async function searchFreesound(
  query: string,
  filters?: FreesoundSearchFilters,
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<FreesoundSearchResponse> {
  // Build filter string
  const filterParts: string[] = [
    'license:"Creative Commons 0"',
  ];
  
  if (filters?.minDuration !== undefined) {
    filterParts.push(`duration:[${filters.minDuration} TO *]`);
  }
  if (filters?.maxDuration !== undefined) {
    filterParts.push(`duration:[* TO ${filters.maxDuration}]`);
  }
  if (filters?.minSampleRate !== undefined) {
    filterParts.push(`samplerate:[${filters.minSampleRate} TO *]`);
  }
  if (filters?.tags && filters.tags.length > 0) {
    filterParts.push(`tag:(${filters.tags.join(' OR ')})`);
  }
  if (filters?.singleEvent !== undefined) {
    filterParts.push(`ac_single_event:${filters.singleEvent}`);
  }
  if (filters?.packId !== undefined) {
    filterParts.push(`pack:${filters.packId}`);
  }
  if (filters?.hasPitchAnalysis) {
    filterParts.push('ac_note_midi:[0 TO 127]');
  }

  const filterString = filterParts.join(' ');
  
  // Fields to request
  const fields = [
    'id', 'name', 'tags', 'description', 'username', 'url', 'previews', 'download',
    'license', 'duration', 'samplerate', 'bitdepth', 'channels', 'filesize',
    'num_downloads', 'avg_rating', 'num_ratings', 'ac_analysis',
  ].join(',');

  const url = buildApiUrl('/search/text/', {
    query,
    filter: filterString,
    fields,
    page,
    page_size: Math.min(pageSize, MAX_PAGE_SIZE),
    sort: filters?.sort ?? 'score',
  });

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Freesound API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a single sample by ID with full analysis.
 */
export async function getSample(id: number): Promise<FreesoundSample> {
  const fields = [
    'id', 'name', 'tags', 'description', 'username', 'url', 'previews', 'download',
    'license', 'duration', 'samplerate', 'bitdepth', 'channels', 'filesize',
    'num_downloads', 'avg_rating', 'num_ratings', 'analysis', 'ac_analysis',
  ].join(',');

  const url = buildApiUrl(`/sounds/${id}/`, { fields });
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Freesound API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get analysis data for a sample.
 */
export async function getSampleAnalysis(id: number): Promise<FreesoundAnalysis> {
  const url = buildApiUrl(`/sounds/${id}/analysis/`, {});
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Freesound API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Search for packs (collections of samples).
 */
export async function searchPacks(
  query: string,
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<{ count: number; results: readonly FreesoundPack[] }> {
  const url = buildApiUrl('/packs/search/', {
    query,
    page,
    page_size: Math.min(pageSize, MAX_PAGE_SIZE),
  });

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Freesound API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get samples from a pack.
 */
export async function getPackSamples(
  packId: number,
  page: number = 1,
  pageSize: number = MAX_PAGE_SIZE
): Promise<FreesoundSearchResponse> {
  const fields = [
    'id', 'name', 'tags', 'description', 'username', 'url', 'previews', 'download',
    'license', 'duration', 'samplerate', 'bitdepth', 'channels', 'filesize',
    'ac_analysis',
  ].join(',');

  const url = buildApiUrl(`/packs/${packId}/sounds/`, {
    fields,
    page,
    page_size: Math.min(pageSize, MAX_PAGE_SIZE),
  });

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Freesound API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Search for one-shot instrument samples.
 */
export async function searchInstrumentSamples(
  instrument: string,
  options: {
    maxDuration?: number;
    minCount?: number;
    preferPacks?: boolean;
  } = {}
): Promise<FreesoundSearchResponse> {
  // Get search terms for the instrument
  const searchTerms = INSTRUMENT_SEARCH_TERMS[instrument] ?? [instrument];
  const query = searchTerms.join(' OR ');

  const filters: FreesoundSearchFilters = {
    maxDuration: options.maxDuration ?? 10,
    singleEvent: true,
    hasPitchAnalysis: true,
    sort: 'downloads_desc',
  };

  return searchFreesound(query, filters, 1, MAX_PAGE_SIZE);
}

// ============================================================================
// PITCH DETECTION FROM FILENAME / METADATA
// ============================================================================

/** Note name to semitone offset (C = 0) */
const NOTE_TO_SEMITONE: Record<string, number> = {
  'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11,
  'c': 0, 'd': 2, 'e': 4, 'f': 5, 'g': 7, 'a': 9, 'b': 11,
};

/**
 * Parse note name to MIDI note number.
 * Examples: "C4" -> 60, "A#3" -> 58, "Bb5" -> 82
 */
export function parseNoteName(noteName: string): number | null {
  const match = noteName.match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
  if (!match) return null;

  const note = match[1];
  const accidental = match[2];
  const octaveStr = match[3];
  if (!note || !octaveStr) return null;
  
  const octave = parseInt(octaveStr, 10);
  
  let semitone = NOTE_TO_SEMITONE[note];
  if (semitone === undefined) return null;

  if (accidental === '#') semitone += 1;
  else if (accidental === 'b') semitone -= 1;

  // MIDI note: C4 = 60
  return (octave + 1) * 12 + semitone;
}

/**
 * Convert MIDI note to note name.
 */
export function midiToNoteName(midiNote: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNote / 12) - 1;
  const note = noteNames[midiNote % 12];
  return `${note}${octave}`;
}

/**
 * Detect MIDI note from sample filename.
 */
export function detectNoteFromFilename(filename: string): { note: number; confidence: number } | null {
  // Try standard patterns: violin_C4_mf.wav, piano-A#3-loud.wav
  const match = filename.match(NOTE_REGEX);
  if (match) {
    const note = match[1];
    const accidental = match[2] || '';
    const octaveStr = match[3];
    if (note && octaveStr) {
      const midiNote = parseNoteName(`${note}${accidental}${octaveStr}`);
      if (midiNote !== null) {
        return { note: midiNote, confidence: 0.95 };
      }
    }
  }

  // Try other patterns: 60_piano.wav (MIDI note number)
  const midiMatch = filename.match(/(?:^|[_\-\s])(\d{1,3})(?:[_\-\s]|\.)/);
  if (midiMatch && midiMatch[1]) {
    const num = parseInt(midiMatch[1], 10);
    if (num >= 21 && num <= 108) {
      return { note: num, confidence: 0.6 };
    }
  }

  return null;
}

/**
 * Detect velocity from filename.
 */
export function detectVelocityFromFilename(filename: string): number {
  const lowerName = filename.toLowerCase();
  
  // Order matters - longer patterns first to avoid partial matches (fff before ff, ff before f, etc.)
  const velocityPatterns: [RegExp, number][] = [
    [/(?:^|[_\-\s])fff(?:[_\-\s]|$|\.)/, 127],
    [/(?:^|[_\-\s])ppp(?:[_\-\s]|$|\.)/, 20],
    [/(?:^|[_\-\s])ff(?:[_\-\s]|$|\.)/, 115],
    [/(?:^|[_\-\s])pp(?:[_\-\s]|$|\.)/, 30],
    [/(?:^|[_\-\s])mf(?:[_\-\s]|$|\.)/, 85],
    [/(?:^|[_\-\s])mp(?:[_\-\s]|$|\.)/, 70],
    [/(?:^|[_\-\s])f(?:[_\-\s]|$|\.)/, 100],
    [/(?:^|[_\-\s])p(?:[_\-\s]|$|\.)/, 50],
    [/(?:^|[_\-\s])soft(?:[_\-\s]|$|\.)/, 40],
    [/(?:^|[_\-\s])hard(?:[_\-\s]|$|\.)/, 110],
    [/(?:^|[_\-\s])gentle(?:[_\-\s]|$|\.)/, 35],
    [/(?:^|[_\-\s])loud(?:[_\-\s]|$|\.)/, 115],
    // Note: "piano" and "forte" are not included as they conflict with instrument names
  ];
  
  for (const [pattern, velocity] of velocityPatterns) {
    if (pattern.test(lowerName)) {
      return velocity;
    }
  }

  // Check for velocity number pattern: v100, vel64
  const velMatch = lowerName.match(/(?:v|vel|velocity)[\s_-]?(\d{1,3})/);
  if (velMatch && velMatch[1]) {
    const vel = parseInt(velMatch[1], 10);
    if (vel >= 1 && vel <= 127) {
      return vel;
    }
  }

  // Check for layer number (1-8) and map to velocity ranges
  const layerMatch = lowerName.match(/(?:layer|l)[\s_-]?(\d)/);
  if (layerMatch && layerMatch[1]) {
    const layer = parseInt(layerMatch[1], 10);
    return Math.round(16 + (layer - 1) * 16); // Maps 1-8 to ~16-127
  }

  return 100; // Default velocity
}

/**
 * Detect round-robin index from filename.
 */
export function detectRoundRobinFromFilename(filename: string): number {
  const lowerName = filename.toLowerCase();
  
  // Check for RR pattern: rr1, rr_2, round-robin-3
  const rrMatch = lowerName.match(/(?:rr|round[\s_-]?robin)[\s_-]?(\d)/);
  if (rrMatch && rrMatch[1]) {
    return parseInt(rrMatch[1], 10) - 1; // 0-indexed
  }

  // Check for variation pattern: var1, variation_2
  const varMatch = lowerName.match(/(?:var|variation)[\s_-]?(\d)/);
  if (varMatch && varMatch[1]) {
    return parseInt(varMatch[1], 10) - 1;
  }

  // Check for simple suffix: _1, _2, _3
  const suffixMatch = filename.match(/_(\d)(?:\.\w+)?$/);
  if (suffixMatch && suffixMatch[1]) {
    return parseInt(suffixMatch[1], 10) - 1;
  }

  return 0;
}

// ============================================================================
// SAMPLE ORGANIZATION
// ============================================================================

/**
 * Organize Freesound samples into a structured sample pack.
 */
export function organizeSamples(
  samples: readonly FreesoundSample[],
  instrumentName: string
): SamplePack {
  const organized: OrganizedSample[] = [];
  
  for (const sample of samples) {
    // Try to get pitch from Freesound's analysis
    let midiNote: number | null = null;
    let confidence = 0;
    let fineTuneCents = 0;

    if (sample.ac_analysis?.ac_note_midi !== undefined) {
      midiNote = Math.round(sample.ac_analysis.ac_note_midi);
      confidence = 0.9;
      // Calculate fine tune from the fractional part
      fineTuneCents = Math.round((sample.ac_analysis.ac_note_midi - midiNote) * 100);
    }

    // Try filename detection as fallback
    if (midiNote === null) {
      const detected = detectNoteFromFilename(sample.name);
      if (detected) {
        midiNote = detected.note;
        confidence = detected.confidence;
      }
    }

    // Skip samples without detected pitch
    if (midiNote === null) {
      continue;
    }

    // Detect velocity and round-robin
    const velocity = detectVelocityFromFilename(sample.name);
    const roundRobinIndex = detectRoundRobinFromFilename(sample.name);

    // Get preview URL
    const previewUrl = sample.previews['preview-hq-mp3'] 
      ?? sample.previews['preview-hq-ogg']
      ?? sample.previews['preview-lq-mp3']
      ?? '';

    const organizedSample: OrganizedSample = {
      freesoundId: sample.id,
      name: sample.name,
      previewUrl,
      midiNote,
      midiNoteConfidence: confidence,
      velocity,
      roundRobinIndex,
      fineTuneCents,
      duration: sample.duration ?? 0,
    };
    
    if (sample.download !== undefined) {
      organizedSample.downloadUrl = sample.download;
    }
    
    organized.push(organizedSample);
  }

  // Sort by MIDI note
  organized.sort((a, b) => a.midiNote - b.midiNote);

  // Calculate pitch range
  const pitchRange = {
    low: organized.length > 0 ? organized[0]!.midiNote : 60,
    high: organized.length > 0 ? organized[organized.length - 1]!.midiNote : 60,
  };

  // Count velocity layers
  const velocitySet = new Set(organized.map(s => Math.floor(s.velocity / 16)));
  
  // Count round-robin
  const rrSet = new Set(organized.map(s => s.roundRobinIndex));

  return {
    name: `${instrumentName} Pack`,
    instrument: instrumentName,
    samples: organized,
    pitchRange,
    velocityLayers: velocitySet.size,
    roundRobinCount: rrSet.size,
  };
}

/**
 * Find the best sample to use for a target MIDI note.
 * Uses nearest neighbor with preference for lower samples (pitch up).
 */
export function findBestSampleForNote(
  pack: SamplePack,
  targetNote: number,
  velocity: number = 100
): OrganizedSample | null {
  if (pack.samples.length === 0) return null;

  // Find samples within the velocity range
  const velocityThreshold = 32;
  let candidates = pack.samples.filter(s => 
    Math.abs(s.velocity - velocity) <= velocityThreshold
  );

  // Fall back to all samples if no velocity match
  if (candidates.length === 0) {
    candidates = [...pack.samples];
  }

  // Find nearest pitch
  let best: OrganizedSample | null = null;
  let bestDistance = Infinity;

  for (const sample of candidates) {
    const distance = Math.abs(sample.midiNote - targetNote);
    // Prefer pitching up (lower samples) over pitching down
    const adjustedDistance = sample.midiNote <= targetNote 
      ? distance 
      : distance + 0.1;
    
    if (adjustedDistance < bestDistance) {
      bestDistance = adjustedDistance;
      best = sample;
    }
  }

  return best;
}

/**
 * Generate a full keyboard mapping from a sample pack.
 * Creates zones for all 128 MIDI notes using pitch shifting.
 */
export function generateKeyboardMapping(
  pack: SamplePack,
  options: {
    lowNote?: number;
    highNote?: number;
    maxPitchShift?: number;
  } = {}
): Map<number, { sample: OrganizedSample; pitchShiftSemitones: number }> {
  const lowNote = options.lowNote ?? 21;  // A0
  const highNote = options.highNote ?? 108; // C8
  const maxPitchShift = options.maxPitchShift ?? 12; // Max 1 octave shift

  const mapping = new Map<number, { sample: OrganizedSample; pitchShiftSemitones: number }>();

  if (pack.samples.length === 0) return mapping;

  for (let note = lowNote; note <= highNote; note++) {
    const best = findBestSampleForNote(pack, note);
    if (best) {
      const pitchShift = note - best.midiNote;
      
      // Only map if within pitch shift range
      if (Math.abs(pitchShift) <= maxPitchShift) {
        mapping.set(note, {
          sample: best,
          pitchShiftSemitones: pitchShift,
        });
      }
    }
  }

  return mapping;
}

// ============================================================================
// AUDIO LOADING
// ============================================================================

/**
 * Download and decode a sample preview.
 */
export async function downloadSamplePreview(
  sample: OrganizedSample,
  audioContext: AudioContext
): Promise<LoadedSample> {
  const response = await fetch(sample.previewUrl);
  if (!response.ok) {
    throw new Error(`Failed to download sample: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  return {
    freesoundId: sample.freesoundId,
    name: sample.name,
    midiNote: sample.midiNote,
    velocity: sample.velocity,
    fineTuneCents: sample.fineTuneCents,
    audioBuffer,
    duration: audioBuffer.duration,
  };
}

/**
 * Download multiple samples in parallel with progress callback.
 */
export async function downloadSamplePack(
  pack: SamplePack,
  audioContext: AudioContext,
  onProgress?: (loaded: number, total: number) => void
): Promise<LoadedSample[]> {
  const loaded: LoadedSample[] = [];
  const total = pack.samples.length;
  let completed = 0;

  // Download in batches of 4 to avoid overwhelming the browser
  const batchSize = 4;
  for (let i = 0; i < pack.samples.length; i += batchSize) {
    const batch = pack.samples.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(sample => downloadSamplePreview(sample, audioContext))
    );

    for (const result of results) {
      completed++;
      if (result.status === 'fulfilled') {
        loaded.push(result.value);
      }
      onProgress?.(completed, total);
    }
  }

  return loaded;
}

// ============================================================================
// SAMPLER PRESET GENERATION
// ============================================================================

/**
 * Generate sampler zones from loaded samples.
 */
export function generateSamplerZones(
  samples: readonly LoadedSample[],
  keyboardMapping: Map<number, { sample: OrganizedSample; pitchShiftSemitones: number }>
): import('../cards/sampler').SampleZone[] {
  const zones: import('../cards/sampler').SampleZone[] = [];

  // Group consecutive notes with the same source sample into zones
  let currentZone: {
    sample: LoadedSample;
    lowKey: number;
    highKey: number;
    rootKey: number;
  } | null = null;

  const sortedEntries = [...keyboardMapping.entries()].sort((a, b) => a[0] - b[0]);

  for (const [note, mapping] of sortedEntries) {
    const loadedSample = samples.find(s => s.freesoundId === mapping.sample.freesoundId);
    if (!loadedSample) continue;

    if (currentZone && currentZone.sample.freesoundId === loadedSample.freesoundId) {
      // Extend current zone
      currentZone.highKey = note;
    } else {
      // Save previous zone
      if (currentZone) {
        zones.push(createZoneFromMapping(currentZone, zones.length));
      }
      // Start new zone
      currentZone = {
        sample: loadedSample,
        lowKey: note,
        highKey: note,
        rootKey: loadedSample.midiNote,
      };
    }
  }

  // Don't forget the last zone
  if (currentZone) {
    zones.push(createZoneFromMapping(currentZone, zones.length));
  }

  return zones;
}

/**
 * Create a sampler zone from mapping data.
 */
function createZoneFromMapping(
  mapping: { sample: LoadedSample; lowKey: number; highKey: number; rootKey: number },
  index: number
): import('../cards/sampler').SampleZone {
  return {
    id: `zone-${index}`,
    keyLow: mapping.lowKey,
    keyHigh: mapping.highKey,
    rootKey: mapping.rootKey,
    velocityLow: 0,
    velocityHigh: 127,
    sample: {
      id: `sample-${mapping.sample.freesoundId}`,
      name: mapping.sample.name,
      sampleRate: 44100, // Will be updated from actual buffer
      length: 0,
      rootNote: mapping.rootKey,
      startPoint: 0,
      endPoint: 0,
      loopStart: 0,
      loopEnd: 0,
      loopMode: 'noLoop' as const,
      loopCrossfade: 0,
      fineTune: mapping.sample.fineTuneCents,
      volumeDb: 0,
      pan: 0,
    },
    roundRobinSamples: [],
    roundRobinIndex: 0,
    volume: 1,
    pan: 0,
    transpose: 0,
    fineTune: mapping.sample.fineTuneCents,
    playbackMode: 'sustain' as const,
    fixedPitch: false,
    envelope: null,
    outputBus: 0,
    muted: false,
    solo: false,
    exclusiveGroup: null,
  };
}

// ============================================================================
// HIGH-LEVEL INSTRUMENT BUILDER
// ============================================================================

/**
 * Build a complete sampler instrument from a Freesound search.
 */
export async function buildInstrumentFromFreesound(
  instrumentName: string,
  audioContext: AudioContext,
  options: {
    maxSamples?: number;
    maxDuration?: number;
    onProgress?: (stage: string, progress: number) => void;
  } = {}
): Promise<{
  pack: SamplePack;
  samples: LoadedSample[];
  zones: import('../cards/sampler').SampleZone[];
  keyboardMapping: Map<number, { sample: OrganizedSample; pitchShiftSemitones: number }>;
}> {
  const { maxSamples = 20, maxDuration = 5, onProgress } = options;

  // Stage 1: Search for samples
  onProgress?.('Searching for samples...', 0);
  const searchResult = await searchInstrumentSamples(instrumentName, {
    maxDuration,
  });

  // Stage 2: Organize samples
  onProgress?.('Organizing samples...', 0.2);
  const allSamples = searchResult.results.slice(0, maxSamples * 2); // Get extra for filtering
  const pack = organizeSamples(allSamples, instrumentName);

  // Limit to requested count
  const limitedPack: SamplePack = {
    ...pack,
    samples: pack.samples.slice(0, maxSamples),
  };

  // Stage 3: Generate keyboard mapping
  onProgress?.('Mapping to keyboard...', 0.3);
  const keyboardMapping = generateKeyboardMapping(limitedPack);

  // Stage 4: Download samples
  onProgress?.('Downloading samples...', 0.4);
  const samples = await downloadSamplePack(
    limitedPack,
    audioContext,
    (loaded, total) => {
      onProgress?.('Downloading samples...', 0.4 + (loaded / total) * 0.5);
    }
  );

  // Stage 5: Generate zones
  onProgress?.('Creating zones...', 0.95);
  const zones = generateSamplerZones(samples, keyboardMapping);

  onProgress?.('Complete!', 1);

  return {
    pack: limitedPack,
    samples,
    zones,
    keyboardMapping,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  searchFreesound,
  getSample,
  getSampleAnalysis,
  searchPacks,
  getPackSamples,
  searchInstrumentSamples,
  parseNoteName,
  midiToNoteName,
  detectNoteFromFilename,
  detectVelocityFromFilename,
  detectRoundRobinFromFilename,
  organizeSamples,
  findBestSampleForNote,
  generateKeyboardMapping,
  downloadSamplePreview,
  downloadSamplePack,
  generateSamplerZones,
  buildInstrumentFromFreesound,
  FREESOUND_API_TOKEN,
  INSTRUMENT_SEARCH_TERMS,
};
