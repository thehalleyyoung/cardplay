/**
 * Clip Operations: Consolidation, Freeze, and Bounce
 *
 * Implements M261-M263:
 * - M261: Clip consolidation (merge clips to audio)
 * - M262: Freeze track (render to audio, disable plugins)
 * - M263: Bounce in place (render selection to clip)
 */

import { generateClipId as generateClipIdFromSSOT } from '../state/types';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

/** A time range in samples or beats */
export interface TimeRange {
  start: number;
  end: number;
  unit: 'samples' | 'beats';
}

/** A clip on a track */
export interface Clip {
  id: string;
  trackId: string;
  name: string;
  start: number;
  end: number;
  offset: number; // Offset into source audio
  gain: number;
  fadeIn: number;
  fadeOut: number;
  muted: boolean;
  sourceType: 'audio' | 'midi';
  sourceData?: AudioBuffer | MidiData;
}

/** MIDI data structure */
export interface MidiData {
  notes: MidiNote[];
  controllers: MidiController[];
}

export interface MidiNote {
  pitch: number;
  velocity: number;
  start: number;
  duration: number;
}

export interface MidiController {
  controller: number;
  value: number;
  time: number;
}

/** Plugin state for freeze/restore */
export interface PluginState {
  pluginId: string;
  enabled: boolean;
  parameters: Record<string, number>;
}

/**
 * Track model for freeze/unfreeze operations.
 * 
 * Renamed from `Track` to disambiguate from ArrangementTrack in arrangement-panel.
 * Use this for track state during freeze/bounce operations.
 */
export interface FreezeTrackModel {
  id: string;
  name: string;
  clips: Clip[];
  plugins: PluginState[];
  frozen: boolean;
  frozenAudio?: AudioBuffer;
  frozenPluginStates?: PluginState[];
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
}

/** @deprecated Use FreezeTrackModel instead */
export type Track = FreezeTrackModel;

/** Result of consolidation operation */
export interface ConsolidationResult {
  success: boolean;
  newClip: Clip | null;
  originalClips: Clip[];
  message: string;
  timing: {
    startTime: number;
    endTime: number;
    duration: number;
  };
}

/** Result of freeze operation */
export interface FreezeResult {
  success: boolean;
  trackId: string;
  originalPluginCount: number;
  message: string;
  cpuSavingsEstimate: number; // Percentage
}

/** Result of bounce operation */
export interface BounceResult {
  success: boolean;
  newClip: Clip | null;
  range: TimeRange;
  message: string;
  includedPlugins: boolean;
  includedAutomation: boolean;
}

/** Options for consolidation */
export interface ConsolidateOptions {
  normalizeGain: boolean;
  includeFades: boolean;
  preserveOriginals: boolean;
  outputFormat: 'wav' | 'aiff' | 'flac';
  bitDepth: 16 | 24 | 32;
  sampleRate: number;
}

/** Options for freeze */
export interface FreezeOptions {
  includeInstrument: boolean;
  includeEffects: boolean;
  tailLengthMs: number;
  bitDepth: 16 | 24 | 32;
}

/** Options for bounce */
export interface BounceOptions {
  range: TimeRange;
  includePlugins: boolean;
  includeAutomation: boolean;
  replaceOriginal: boolean;
  normalize: boolean;
  outputName?: string;
}

// --------------------------------------------------------------------------
// Utilities
// --------------------------------------------------------------------------

/**
 * Generate unique ID for clips.
 * Change 327: Delegates to SSOT generateClipId from state/types.
 */
function generateClipId(): string {
  return generateClipIdFromSSOT();
}

/**
 * Calculate the time range covered by a set of clips
 */
export function calculateClipsTimeRange(clips: Clip[]): TimeRange | null {
  if (clips.length === 0) return null;
  
  const start = Math.min(...clips.map(c => c.start));
  const end = Math.max(...clips.map(c => c.end));
  
  return { start, end, unit: 'samples' };
}

/**
 * Check if two clips overlap
 */
export function clipsOverlap(a: Clip, b: Clip): boolean {
  return a.start < b.end && a.end > b.start;
}

/**
 * Sort clips by start time
 */
export function sortClipsByStart(clips: Clip[]): Clip[] {
  return [...clips].sort((a, b) => a.start - b.start);
}

/**
 * Merge overlapping clips into contiguous regions
 */
export function mergeOverlappingRegions(clips: Clip[]): TimeRange[] {
  if (clips.length === 0) return [];
  
  const sorted = sortClipsByStart(clips);
  const regions: TimeRange[] = [];
  
  if (sorted.length === 0) return regions;
  
  let currentStart = sorted[0]!.start;
  let currentEnd = sorted[0]!.end;
  
  for (let i = 1; i < sorted.length; i++) {
    const clip = sorted[i]!;
    
    if (clip.start <= currentEnd) {
      // Overlapping or adjacent - extend current region
      currentEnd = Math.max(currentEnd, clip.end);
    } else {
      // Gap - save current region and start new one
      regions.push({ start: currentStart, end: currentEnd, unit: 'samples' });
      currentStart = clip.start;
      currentEnd = clip.end;
    }
  }
  
  // Don't forget the last region
  regions.push({ start: currentStart, end: currentEnd, unit: 'samples' });
  
  return regions;
}

// --------------------------------------------------------------------------
// M261: Clip Consolidation
// --------------------------------------------------------------------------

/**
 * Consolidate multiple clips into a single audio clip.
 * This is a simulation since we don't have real audio processing.
 */
export function consolidateClips(
  clips: Clip[],
  options: Partial<ConsolidateOptions> = {}
): ConsolidationResult {
  const defaults: ConsolidateOptions = {
    normalizeGain: false,
    includeFades: true,
    preserveOriginals: false,
    outputFormat: 'wav',
    bitDepth: 24,
    sampleRate: 48000,
  };
  
  const opts = { ...defaults, ...options };
  
  // Validate input
  if (clips.length === 0) {
    return {
      success: false,
      newClip: null,
      originalClips: [],
      message: 'No clips provided for consolidation',
      timing: { startTime: 0, endTime: 0, duration: 0 },
    };
  }
  
  // Check all clips are from same track
  const trackIds = new Set(clips.map(c => c.trackId));
  if (trackIds.size > 1) {
    return {
      success: false,
      newClip: null,
      originalClips: clips,
      message: 'Cannot consolidate clips from different tracks',
      timing: { startTime: 0, endTime: 0, duration: 0 },
    };
  }
  
  // Filter out muted clips unless explicitly included
  const activeClips = clips.filter(c => !c.muted);
  if (activeClips.length === 0) {
    return {
      success: false,
      newClip: null,
      originalClips: clips,
      message: 'All clips are muted',
      timing: { startTime: 0, endTime: 0, duration: 0 },
    };
  }
  
  // Calculate time range
  const range = calculateClipsTimeRange(activeClips);
  if (!range) {
    throw new Error('Cannot calculate time range for clips');
  }
  
  const firstClip = activeClips[0]!;
  const lastClip = activeClips[activeClips.length - 1]!;
  
  // Create consolidated clip
  const newClip: Clip = {
    id: generateClipId(),
    trackId: firstClip.trackId,
    name: `Consolidated_${new Date().toISOString().slice(0, 10)}`,
    start: range.start,
    end: range.end,
    offset: 0,
    gain: opts.normalizeGain 
      ? 1.0 
      : Math.max(...activeClips.map(c => c.gain)),
    fadeIn: opts.includeFades 
      ? firstClip.fadeIn 
      : 0,
    fadeOut: opts.includeFades 
      ? lastClip.fadeOut 
      : 0,
    muted: false,
    sourceType: 'audio',
    // In real implementation, sourceData would be rendered audio
  };
  
  return {
    success: true,
    newClip,
    originalClips: clips,
    message: `Successfully consolidated ${activeClips.length} clips`,
    timing: {
      startTime: range.start,
      endTime: range.end,
      duration: range.end - range.start,
    },
  };
}

/**
 * Consolidate clips and update track
 */
export function consolidateClipsOnTrack(
  track: Track,
  clipIds: string[],
  options: Partial<ConsolidateOptions> = {}
): { track: Track; result: ConsolidationResult } {
  const clips = track.clips.filter(c => clipIds.includes(c.id));
  const result = consolidateClips(clips, options);
  
  if (!result.success || !result.newClip) {
    return { track, result };
  }
  
  // Remove old clips and add new one
  let newClips = track.clips;
  
  if (!options.preserveOriginals) {
    newClips = track.clips.filter(c => !clipIds.includes(c.id));
  }
  
  newClips = [...newClips, result.newClip];
  newClips = sortClipsByStart(newClips);
  
  return {
    track: { ...track, clips: newClips },
    result,
  };
}

// --------------------------------------------------------------------------
// M262: Freeze Track
// --------------------------------------------------------------------------

/**
 * Freeze a track by rendering all plugins to audio.
 * Disables plugins and stores frozen audio.
 */
export function freezeTrack(
  track: Track,
  _options: Partial<FreezeOptions> = {} // Prefix with _ to indicate intentionally unused for future
): { track: Track; result: FreezeResult } {
  // Options will be used when implementing actual freeze rendering
  // const defaults: FreezeOptions = {
  //   includeInstrument: true,
  //   includeEffects: true,
  //   tailLengthMs: 1000,
  //   bitDepth: 24,
  // };
  
  // Check if already frozen
  if (track.frozen) {
    return {
      track,
      result: {
        success: false,
        trackId: track.id,
        originalPluginCount: track.plugins.length,
        message: 'Track is already frozen',
        cpuSavingsEstimate: 0,
      },
    };
  }
  
  // Count enabled plugins that will be disabled
  const enabledPlugins = track.plugins.filter(p => p.enabled);
  if (enabledPlugins.length === 0 && track.clips.length === 0) {
    return {
      track,
      result: {
        success: false,
        trackId: track.id,
        originalPluginCount: 0,
        message: 'Track has no plugins or clips to freeze',
        cpuSavingsEstimate: 0,
      },
    };
  }
  
  // Store original plugin states for unfreeze
  const frozenPluginStates = track.plugins.map(p => ({ ...p }));
  
  // Disable all plugins
  const disabledPlugins = track.plugins.map(p => ({
    ...p,
    enabled: false,
  }));
  
  // Create frozen track (omit frozenAudio instead of setting to undefined)
  const frozenTrack: Track = {
    ...track,
    frozen: true,
    frozenPluginStates,
    plugins: disabledPlugins,
    // frozenAudio omitted - in real implementation, would be rendered buffer
  };
  
  // Estimate CPU savings (rough: 3-5% per plugin)
  const cpuSavingsEstimate = enabledPlugins.length * 4;
  
  return {
    track: frozenTrack,
    result: {
      success: true,
      trackId: track.id,
      originalPluginCount: enabledPlugins.length,
      message: `Frozen track with ${enabledPlugins.length} plugins`,
      cpuSavingsEstimate: Math.min(cpuSavingsEstimate, 50),
    },
  };
}

/**
 * Unfreeze a track, restoring original plugin states
 */
export function unfreezeTrack(track: Track): { track: Track; success: boolean; message: string } {
  if (!track.frozen) {
    return {
      track,
      success: false,
      message: 'Track is not frozen',
    };
  }
  
  if (!track.frozenPluginStates) {
    return {
      track,
      success: false,
      message: 'No frozen plugin states to restore',
    };
  }
  
  // Create unfrozen track (omit optional fields instead of setting to undefined)
  const { frozenPluginStates, frozenAudio, ...baseTrack } = track;
  const unfrozenTrack: Track = {
    ...baseTrack,
    frozen: false,
    plugins: frozenPluginStates,
  };
  
  return {
    track: unfrozenTrack,
    success: true,
    message: 'Track unfrozen, plugins restored',
  };
}

// --------------------------------------------------------------------------
// M263: Bounce In Place
// --------------------------------------------------------------------------

/**
 * Bounce a selection in place, rendering to audio.
 */
export function bounceInPlace(
  track: Track,
  options: BounceOptions
): { track: Track; result: BounceResult } {
  const { range, includePlugins, includeAutomation, replaceOriginal, normalize, outputName } = options;
  
  // Find clips in range
  const clipsInRange = track.clips.filter(
    c => c.start < range.end && c.end > range.start
  );
  
  if (clipsInRange.length === 0) {
    return {
      track,
      result: {
        success: false,
        newClip: null,
        range,
        message: 'No clips in selection range',
        includedPlugins: includePlugins,
        includedAutomation: includeAutomation,
      },
    };
  }
  
  // Create bounced clip
  const bouncedClip: Clip = {
    id: generateClipId(),
    trackId: track.id,
    name: outputName || `Bounced_${new Date().toISOString().slice(0, 10)}`,
    start: range.start,
    end: range.end,
    offset: 0,
    gain: normalize ? 1.0 : 1.0, // Would calculate from content
    fadeIn: 0,
    fadeOut: 0,
    muted: false,
    sourceType: 'audio',
    // In real implementation, sourceData would be rendered audio
  };
  
  // Update track clips
  let newClips = track.clips;
  
  if (replaceOriginal) {
    // Remove clips that are fully within range
    newClips = track.clips.filter(c => c.start >= range.end || c.end <= range.start);
    
    // Trim clips that partially overlap
    newClips = newClips.map(c => {
      if (c.end > range.start && c.start < range.start) {
        // Clip extends past start of range - trim end
        return { ...c, end: range.start };
      }
      if (c.start < range.end && c.end > range.end) {
        // Clip extends past end of range - trim start
        const trimAmount = range.end - c.start;
        return { 
          ...c, 
          start: range.end,
          offset: c.offset + trimAmount,
        };
      }
      return c;
    });
  }
  
  newClips = [...newClips, bouncedClip];
  newClips = sortClipsByStart(newClips);
  
  return {
    track: { ...track, clips: newClips },
    result: {
      success: true,
      newClip: bouncedClip,
      range,
      message: `Bounced ${clipsInRange.length} clips in place`,
      includedPlugins: includePlugins,
      includedAutomation: includeAutomation,
    },
  };
}

/**
 * Bounce selected clips to a new clip
 */
export function bounceSelectedClips(
  track: Track,
  clipIds: string[],
  options: Partial<Omit<BounceOptions, 'range'>> = {}
): { track: Track; result: BounceResult } {
  const clips = track.clips.filter(c => clipIds.includes(c.id));
  
  if (clips.length === 0) {
    return {
      track,
      result: {
        success: false,
        newClip: null,
        range: { start: 0, end: 0, unit: 'samples' },
        message: 'No clips selected',
        includedPlugins: options.includePlugins ?? false,
        includedAutomation: options.includeAutomation ?? false,
      },
    };
  }
  
  const range = calculateClipsTimeRange(clips)!;
  
  const bounceOptions: BounceOptions = {
    range,
    includePlugins: options.includePlugins ?? true,
    includeAutomation: options.includeAutomation ?? true,
    replaceOriginal: options.replaceOriginal ?? true,
    normalize: options.normalize ?? false,
    ...(options.outputName && { outputName: options.outputName }),
  };
  
  return bounceInPlace(track, bounceOptions);
}

// --------------------------------------------------------------------------
// Batch Operations
// --------------------------------------------------------------------------

/**
 * Freeze multiple tracks at once
 */
export function freezeTracks(
  tracks: Track[],
  options: Partial<FreezeOptions> = {}
): { tracks: Track[]; results: FreezeResult[] } {
  const results: FreezeResult[] = [];
  const newTracks: Track[] = [];
  
  for (const track of tracks) {
    const { track: frozenTrack, result } = freezeTrack(track, options);
    newTracks.push(frozenTrack);
    results.push(result);
  }
  
  return { tracks: newTracks, results };
}

/**
 * Unfreeze multiple tracks at once
 */
export function unfreezeTracks(
  tracks: Track[]
): { tracks: Track[]; successes: number } {
  const newTracks: Track[] = [];
  let successes = 0;
  
  for (const track of tracks) {
    const { track: unfrozenTrack, success } = unfreezeTrack(track);
    newTracks.push(unfrozenTrack);
    if (success) successes++;
  }
  
  return { tracks: newTracks, successes };
}

// --------------------------------------------------------------------------
// Export Store for state management
// --------------------------------------------------------------------------

export class ClipOperationsStore {
  private tracks: Map<string, Track> = new Map();
  private history: Array<{ action: string; trackId: string; timestamp: number }> = [];
  
  /** Add or update a track */
  setTrack(track: Track): void {
    this.tracks.set(track.id, track);
  }
  
  /** Get a track by ID */
  getTrack(trackId: string): Track | undefined {
    return this.tracks.get(trackId);
  }
  
  /** Get all tracks */
  getAllTracks(): Track[] {
    return Array.from(this.tracks.values());
  }
  
  /** Consolidate clips on a track */
  consolidate(
    trackId: string,
    clipIds: string[],
    options: Partial<ConsolidateOptions> = {}
  ): ConsolidationResult {
    const track = this.tracks.get(trackId);
    if (!track) {
      return {
        success: false,
        newClip: null,
        originalClips: [],
        message: `Track ${trackId} not found`,
        timing: { startTime: 0, endTime: 0, duration: 0 },
      };
    }
    
    const { track: updatedTrack, result } = consolidateClipsOnTrack(track, clipIds, options);
    
    if (result.success) {
      this.tracks.set(trackId, updatedTrack);
      this.history.push({ action: 'consolidate', trackId, timestamp: Date.now() });
    }
    
    return result;
  }
  
  /** Freeze a track */
  freeze(trackId: string, options: Partial<FreezeOptions> = {}): FreezeResult {
    const track = this.tracks.get(trackId);
    if (!track) {
      return {
        success: false,
        trackId,
        originalPluginCount: 0,
        message: `Track ${trackId} not found`,
        cpuSavingsEstimate: 0,
      };
    }
    
    const { track: frozenTrack, result } = freezeTrack(track, options);
    
    if (result.success) {
      this.tracks.set(trackId, frozenTrack);
      this.history.push({ action: 'freeze', trackId, timestamp: Date.now() });
    }
    
    return result;
  }
  
  /** Unfreeze a track */
  unfreeze(trackId: string): { success: boolean; message: string } {
    const track = this.tracks.get(trackId);
    if (!track) {
      return { success: false, message: `Track ${trackId} not found` };
    }
    
    const { track: unfrozenTrack, success, message } = unfreezeTrack(track);
    
    if (success) {
      this.tracks.set(trackId, unfrozenTrack);
      this.history.push({ action: 'unfreeze', trackId, timestamp: Date.now() });
    }
    
    return { success, message };
  }
  
  /** Bounce in place */
  bounce(trackId: string, options: BounceOptions): BounceResult {
    const track = this.tracks.get(trackId);
    if (!track) {
      return {
        success: false,
        newClip: null,
        range: options.range,
        message: `Track ${trackId} not found`,
        includedPlugins: options.includePlugins,
        includedAutomation: options.includeAutomation,
      };
    }
    
    const { track: bouncedTrack, result } = bounceInPlace(track, options);
    
    if (result.success) {
      this.tracks.set(trackId, bouncedTrack);
      this.history.push({ action: 'bounce', trackId, timestamp: Date.now() });
    }
    
    return result;
  }
  
  /** Get operation history */
  getHistory(): Array<{ action: string; trackId: string; timestamp: number }> {
    return [...this.history];
  }
  
  /** Clear all tracks */
  clear(): void {
    this.tracks.clear();
    this.history = [];
  }
}

// Singleton instance
export const clipOperationsStore = new ClipOperationsStore();
