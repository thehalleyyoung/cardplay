/**
 * Reference Track Player System
 * 
 * Implements M293: Add reference track player to mixer deck.
 * Allows importing and comparing reference tracks against the current mix.
 */

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

/** Reference track metadata */
export interface ReferenceTrack {
  id: string;
  name: string;
  filePath: string;
  duration: number; // seconds
  sampleRate: number;
  bitDepth: number;
  channels: number;
  waveformData?: Float32Array;
  importedAt: number;
  tags: string[];
}

/** Reference track playback state */
export interface ReferencePlaybackState {
  isPlaying: boolean;
  currentTime: number; // seconds
  loop: boolean;
  loopStart: number; // seconds
  loopEnd: number; // seconds
  volume: number; // 0-1
  muted: boolean;
}

/** A/B comparison mode */
export type CompareMode = 'off' | 'reference' | 'mix' | 'split';

/** Comparison settings */
export interface CompareSettings {
  mode: CompareMode;
  splitPosition: number; // 0-1 (for split mode)
  autoMatchLevel: boolean;
  referenceGainOffset: number; // dB
  syncToMixPosition: boolean;
}

/** Level matching result */
export interface LevelMatch {
  referenceLevel: number; // dB
  mixLevel: number; // dB
  offset: number; // dB to apply to reference
}

/** Reference library entry */
export interface ReferenceLibraryEntry {
  track: ReferenceTrack;
  category: string;
  notes: string;
  isFavorite: boolean;
}

// --------------------------------------------------------------------------
// Default configurations
// --------------------------------------------------------------------------

export const DEFAULT_PLAYBACK_STATE: ReferencePlaybackState = {
  isPlaying: false,
  currentTime: 0,
  loop: false,
  loopStart: 0,
  loopEnd: 0,
  volume: 1,
  muted: false,
};

export const DEFAULT_COMPARE_SETTINGS: CompareSettings = {
  mode: 'off',
  splitPosition: 0.5,
  autoMatchLevel: true,
  referenceGainOffset: 0,
  syncToMixPosition: false,
};

// --------------------------------------------------------------------------
// Category presets
// --------------------------------------------------------------------------

export const REFERENCE_CATEGORIES = [
  'Pop',
  'Rock',
  'Hip-Hop',
  'Electronic',
  'Classical',
  'Jazz',
  'Country',
  'R&B',
  'Metal',
  'Acoustic',
  'Ambient',
  'Other',
] as const;

export type ReferenceCategory = typeof REFERENCE_CATEGORIES[number];

// --------------------------------------------------------------------------
// Utility functions
// --------------------------------------------------------------------------

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract file name from path
 */
export function extractFileName(filePath: string): string {
  const parts = filePath.split(/[/\\]/);
  const fileName = parts[parts.length - 1] || filePath;
  return fileName.replace(/\.[^/.]+$/, '');
}

/**
 * Format duration as MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate RMS level of samples
 */
export function calculateRMSLevel(samples: Float32Array): number {
  if (samples.length === 0) return -Infinity;
  
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    if (sample !== undefined) {
      sum += sample * sample;
    }
  }
  
  const rms = Math.sqrt(sum / samples.length);
  return rms > 0 ? 20 * Math.log10(rms) : -Infinity;
}

/**
 * Match levels between reference and mix
 */
export function matchLevels(
  referenceSamples: Float32Array,
  mixSamples: Float32Array
): LevelMatch {
  const referenceLevel = calculateRMSLevel(referenceSamples);
  const mixLevel = calculateRMSLevel(mixSamples);
  
  return {
    referenceLevel,
    mixLevel,
    offset: mixLevel - referenceLevel,
  };
}

/**
 * Apply gain to samples
 */
export function applyGain(samples: Float32Array, gainDb: number): Float32Array {
  const gain = Math.pow(10, gainDb / 20);
  const output = new Float32Array(samples.length);
  
  for (let i = 0; i < samples.length; i++) {
    output[i] = samples[i] * gain;
  }
  
  return output;
}

/**
 * Create split comparison output
 */
export function createSplitOutput(
  referenceSamples: Float32Array,
  mixSamples: Float32Array,
  splitPosition: number,
  channelCount: number = 2
): Float32Array {
  const length = Math.min(referenceSamples.length, mixSamples.length);
  const output = new Float32Array(length);
  
  const splitSample = Math.floor((length / channelCount) * splitPosition) * channelCount;
  
  for (let i = 0; i < length; i++) {
    if (i < splitSample) {
      const refSample = referenceSamples[i];
      output[i] = refSample !== undefined ? refSample : 0;
    } else {
      const mixSample = mixSamples[i];
      output[i] = mixSample !== undefined ? mixSample : 0;
    }
  }
  
  return output;
}

/**
 * Validate reference track file
 */
export function validateReferenceFile(filePath: string): { valid: boolean; error?: string } {
  const supportedExtensions = ['.wav', '.aiff', '.aif', '.flac', '.mp3', '.ogg', '.m4a'];
  const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
  
  if (!supportedExtensions.includes(ext)) {
    return { valid: false, error: `Unsupported file format: ${ext}` };
  }
  
  return { valid: true };
}

// --------------------------------------------------------------------------
// Reference Player Store
// --------------------------------------------------------------------------

export class ReferencePlayerStore {
  private tracks: Map<string, ReferenceTrack> = new Map();
  private library: Map<string, ReferenceLibraryEntry> = new Map();
  private activeTrackId: string | null = null;
  private playbackState: ReferencePlaybackState = { ...DEFAULT_PLAYBACK_STATE };
  private compareSettings: CompareSettings = { ...DEFAULT_COMPARE_SETTINGS };
  private listeners: Set<() => void> = new Set();
  
  // --------------------------------------------------------------------------
  // Track Management
  // --------------------------------------------------------------------------
  
  /**
   * Import a reference track
   */
  importTrack(filePath: string, options?: Partial<ReferenceTrack>): ReferenceTrack {
    const validation = validateReferenceFile(filePath);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    const track: ReferenceTrack = {
      id: generateId(),
      name: extractFileName(filePath),
      filePath,
      duration: options?.duration ?? 0,
      sampleRate: options?.sampleRate ?? 44100,
      bitDepth: options?.bitDepth ?? 16,
      channels: options?.channels ?? 2,
      ...(options?.waveformData !== undefined && { waveformData: options.waveformData }),
      importedAt: Date.now(),
      tags: options?.tags ?? [],
    };
    
    this.tracks.set(track.id, track);
    this.notifyListeners();
    
    return track;
  }
  
  /**
   * Remove a reference track
   */
  removeTrack(id: string): boolean {
    if (this.activeTrackId === id) {
      this.stop();
      this.activeTrackId = null;
    }
    
    this.library.delete(id);
    const deleted = this.tracks.delete(id);
    
    if (deleted) {
      this.notifyListeners();
    }
    
    return deleted;
  }
  
  /**
   * Get all tracks
   */
  getTracks(): ReferenceTrack[] {
    return Array.from(this.tracks.values());
  }
  
  /**
   * Get track by ID
   */
  getTrack(id: string): ReferenceTrack | undefined {
    return this.tracks.get(id);
  }
  
  /**
   * Set active track
   */
  setActiveTrack(id: string | null): void {
    if (id !== null && !this.tracks.has(id)) {
      throw new Error(`Track not found: ${id}`);
    }
    
    this.stop();
    this.activeTrackId = id;
    this.playbackState.currentTime = 0;
    
    // Set loop end to track duration
    if (id !== null) {
      const track = this.tracks.get(id);
      if (track) {
        this.playbackState.loopEnd = track.duration;
      }
    }
    
    this.notifyListeners();
  }
  
  /**
   * Get active track
   */
  getActiveTrack(): ReferenceTrack | null {
    return this.activeTrackId ? this.tracks.get(this.activeTrackId) ?? null : null;
  }
  
  // --------------------------------------------------------------------------
  // Playback Control
  // --------------------------------------------------------------------------
  
  /**
   * Start playback
   */
  play(): void {
    if (this.activeTrackId === null) return;
    
    this.playbackState.isPlaying = true;
    this.notifyListeners();
  }
  
  /**
   * Pause playback
   */
  pause(): void {
    this.playbackState.isPlaying = false;
    this.notifyListeners();
  }
  
  /**
   * Stop playback
   */
  stop(): void {
    this.playbackState.isPlaying = false;
    this.playbackState.currentTime = 0;
    this.notifyListeners();
  }
  
  /**
   * Toggle playback
   */
  togglePlayback(): void {
    if (this.playbackState.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }
  
  /**
   * Seek to position
   */
  seek(time: number): void {
    const track = this.getActiveTrack();
    if (!track) return;
    
    this.playbackState.currentTime = Math.max(0, Math.min(time, track.duration));
    this.notifyListeners();
  }
  
  /**
   * Set volume
   */
  setVolume(volume: number): void {
    this.playbackState.volume = Math.max(0, Math.min(1, volume));
    this.notifyListeners();
  }
  
  /**
   * Toggle mute
   */
  toggleMute(): void {
    this.playbackState.muted = !this.playbackState.muted;
    this.notifyListeners();
  }
  
  /**
   * Set loop
   */
  setLoop(enabled: boolean, start?: number, end?: number): void {
    this.playbackState.loop = enabled;
    
    if (start !== undefined) {
      this.playbackState.loopStart = start;
    }
    if (end !== undefined) {
      this.playbackState.loopEnd = end;
    }
    
    this.notifyListeners();
  }
  
  /**
   * Get playback state
   */
  getPlaybackState(): ReferencePlaybackState {
    return { ...this.playbackState };
  }
  
  // --------------------------------------------------------------------------
  // Comparison Control
  // --------------------------------------------------------------------------
  
  /**
   * Set compare mode
   */
  setCompareMode(mode: CompareMode): void {
    this.compareSettings.mode = mode;
    this.notifyListeners();
  }
  
  /**
   * Set split position
   */
  setSplitPosition(position: number): void {
    this.compareSettings.splitPosition = Math.max(0, Math.min(1, position));
    this.notifyListeners();
  }
  
  /**
   * Toggle auto level matching
   */
  toggleAutoMatchLevel(): void {
    this.compareSettings.autoMatchLevel = !this.compareSettings.autoMatchLevel;
    this.notifyListeners();
  }
  
  /**
   * Set reference gain offset
   */
  setReferenceGainOffset(gainDb: number): void {
    this.compareSettings.referenceGainOffset = gainDb;
    this.notifyListeners();
  }
  
  /**
   * Toggle sync to mix position
   */
  toggleSyncToMixPosition(): void {
    this.compareSettings.syncToMixPosition = !this.compareSettings.syncToMixPosition;
    this.notifyListeners();
  }
  
  /**
   * Get compare settings
   */
  getCompareSettings(): CompareSettings {
    return { ...this.compareSettings };
  }
  
  // --------------------------------------------------------------------------
  // Library Management
  // --------------------------------------------------------------------------
  
  /**
   * Add track to library
   */
  addToLibrary(
    trackId: string,
    category: string = 'Other',
    notes: string = ''
  ): ReferenceLibraryEntry {
    const track = this.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track not found: ${trackId}`);
    }
    
    const entry: ReferenceLibraryEntry = {
      track,
      category,
      notes,
      isFavorite: false,
    };
    
    this.library.set(trackId, entry);
    this.notifyListeners();
    
    return entry;
  }
  
  /**
   * Update library entry
   */
  updateLibraryEntry(
    trackId: string,
    updates: Partial<Omit<ReferenceLibraryEntry, 'track'>>
  ): void {
    const entry = this.library.get(trackId);
    if (!entry) return;
    
    Object.assign(entry, updates);
    this.notifyListeners();
  }
  
  /**
   * Toggle favorite
   */
  toggleFavorite(trackId: string): void {
    const entry = this.library.get(trackId);
    if (!entry) return;
    
    entry.isFavorite = !entry.isFavorite;
    this.notifyListeners();
  }
  
  /**
   * Get library entries
   */
  getLibrary(): ReferenceLibraryEntry[] {
    return Array.from(this.library.values());
  }
  
  /**
   * Get library entries by category
   */
  getLibraryByCategory(category: string): ReferenceLibraryEntry[] {
    return Array.from(this.library.values()).filter(e => e.category === category);
  }
  
  /**
   * Get favorites
   */
  getFavorites(): ReferenceLibraryEntry[] {
    return Array.from(this.library.values()).filter(e => e.isFavorite);
  }
  
  // --------------------------------------------------------------------------
  // Subscriptions
  // --------------------------------------------------------------------------
  
  /**
   * Subscribe to updates
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(l => l());
  }
  
  // --------------------------------------------------------------------------
  // Clear
  // --------------------------------------------------------------------------
  
  /**
   * Clear all tracks and reset state
   */
  clear(): void {
    this.tracks.clear();
    this.library.clear();
    this.activeTrackId = null;
    this.playbackState = { ...DEFAULT_PLAYBACK_STATE };
    this.compareSettings = { ...DEFAULT_COMPARE_SETTINGS };
    this.notifyListeners();
  }
}

// Singleton instance
export const referencePlayerStore = new ReferencePlayerStore();
