/**
 * @fileoverview Sample Slicer Module
 * 
 * Provides sample chopping and slicing capabilities:
 * - Grid-based slicing (fixed time divisions)
 * - Transient-based slicing (automatic onset detection)
 * - Manual slice marker editing
 * - Slice export to individual samples
 * - Slice mapping to sampler zones
 * - Warp markers for tempo synchronization
 * 
 * @module @cardplay/core/audio/sample-slicer
 */

import { detectTransients } from './sample-editor.js';
import type { SliceRegion } from './sample-editor.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Slice marker with user-editable position and properties.
 */
export interface SliceMarker {
  /** Unique marker ID */
  readonly id: string;
  /** Sample position */
  readonly position: number;
  /** User-assigned label */
  readonly label?: string;
  /** Suggested MIDI note for mapping */
  readonly suggestedNote?: number;
  /** Whether this marker is locked (protected from auto-operations) */
  readonly locked: boolean;
  /** Color for visualization (hex) */
  readonly color?: string;
}

/**
 * Slice grid configuration for fixed-time slicing.
 */
export interface SliceGridConfig {
  /** Grid division type */
  readonly type: 'bars' | 'beats' | 'subdivisions' | 'samples' | 'milliseconds';
  /** Number of divisions */
  readonly divisions: number;
  /** Tempo in BPM (for musical divisions) */
  readonly tempo?: number;
  /** Time signature numerator (for musical divisions) */
  readonly timeSignatureNumerator?: number;
  /** Time signature denominator (for musical divisions) */
  readonly timeSignatureDenominator?: number;
  /** Swing amount (0-1, for musical divisions) */
  readonly swing?: number;
  /** Snap to zero crossings */
  readonly snapToZeroCrossings: boolean;
}

/**
 * Warp marker for tempo synchronization.
 */
export interface WarpMarker {
  /** Unique marker ID */
  readonly id: string;
  /** Sample position */
  readonly position: number;
  /** Musical time (beats) this position corresponds to */
  readonly beat: number;
  /** User-assigned label */
  readonly label?: string;
  /** Whether this marker is locked */
  readonly locked: boolean;
}

/**
 * Tempo sync configuration using warp markers.
 */
export interface TempoSyncConfig {
  /** Enable tempo synchronization */
  readonly enabled: boolean;
  /** Target tempo in BPM */
  readonly targetTempo: number;
  /** Warp markers defining timing */
  readonly warpMarkers: readonly WarpMarker[];
  /** Interpolation method between warp markers */
  readonly interpolation: 'linear' | 'smooth' | 'stepped';
  /** Preserve formants during time-stretching */
  readonly preserveFormants: boolean;
}

/**
 * Pitch lock configuration.
 */
export interface PitchLockConfig {
  /** Enable pitch locking */
  readonly enabled: boolean;
  /** Lock pitch to specific MIDI note */
  readonly lockToNote?: number;
  /** Preserve formants during pitch shifting */
  readonly preserveFormants: boolean;
  /** Fine tune in cents */
  readonly fineTuneCents: number;
}

/**
 * Complete slice configuration for a sample.
 */
export interface SampleSliceConfiguration {
  /** Sample ID */
  readonly sampleId: string;
  /** Sample rate (for calculations) */
  readonly sampleRate: number;
  /** Total length in samples */
  readonly lengthSamples: number;
  /** Slice markers */
  readonly markers: readonly SliceMarker[];
  /** Warp markers */
  readonly warpMarkers: readonly WarpMarker[];
  /** Tempo sync configuration */
  readonly tempoSync: TempoSyncConfig;
  /** Pitch lock configuration */
  readonly pitchLock: PitchLockConfig;
}

/**
 * Result of a slicing operation.
 */
export interface SliceResult {
  /** Generated slice markers */
  readonly markers: readonly SliceMarker[];
  /** Slice regions derived from markers */
  readonly regions: readonly SliceRegion[];
  /** Metadata about the operation */
  readonly metadata: {
    readonly method: 'grid' | 'transient' | 'manual';
    readonly timestamp: number;
    readonly parameters: Record<string, unknown>;
  };
}

// ============================================================================
// GRID SLICING
// ============================================================================

/**
 * Generate slice markers based on grid configuration.
 */
export function sliceByGrid(
  lengthSamples: number,
  sampleRate: number,
  config: SliceGridConfig
): SliceMarker[] {
  const markers: SliceMarker[] = [];
  let positions: number[] = [];

  switch (config.type) {
    case 'samples':
      // Fixed sample intervals
      positions = generateFixedPositions(lengthSamples, config.divisions);
      break;

    case 'milliseconds':
      // Fixed time intervals
      const samplesPerMs = sampleRate / 1000;
      const intervalSamples = Math.floor(config.divisions * samplesPerMs);
      positions = generateFixedPositions(lengthSamples, Math.floor(lengthSamples / intervalSamples));
      break;

    case 'bars':
    case 'beats':
    case 'subdivisions':
      // Musical divisions
      if (!config.tempo) {
        throw new Error('Tempo required for musical grid slicing');
      }
      positions = generateMusicalPositions(
        lengthSamples,
        sampleRate,
        config
      );
      break;
  }

  // Apply zero-crossing snap if enabled
  if (config.snapToZeroCrossings && positions.length > 0) {
    // Note: Would need access to audio samples for actual zero-crossing detection
    // For now, we return the raw positions
  }

  // Convert positions to markers
  for (let i = 0; i < positions.length; i++) {
    const position = positions[i];
    if (position !== undefined) {
      markers.push({
        id: `grid-marker-${i}`,
        position,
        label: `Slice ${i + 1}`,
        suggestedNote: 36 + i, // Start from C1
        locked: false,
      });
    }
  }

  return markers;
}

/**
 * Generate evenly-spaced positions.
 */
function generateFixedPositions(lengthSamples: number, divisions: number): number[] {
  const positions: number[] = [];
  const interval = lengthSamples / divisions;

  for (let i = 0; i < divisions; i++) {
    positions.push(Math.floor(i * interval));
  }

  return positions;
}

/**
 * Generate musically-aligned positions.
 */
function generateMusicalPositions(
  lengthSamples: number,
  sampleRate: number,
  config: SliceGridConfig
): number[] {
  if (!config.tempo) {
    return [];
  }

  const positions: number[] = [];
  const beatsPerSecond = config.tempo / 60;
  const samplesPerBeat = sampleRate / beatsPerSecond;

  const timeSignatureNumerator = config.timeSignatureNumerator ?? 4;
  const timeSignatureDenominator = config.timeSignatureDenominator ?? 4;
  const samplesPerBar = samplesPerBeat * (timeSignatureNumerator * (4 / timeSignatureDenominator));

  let divisionMultiplier = 1;

  switch (config.type) {
    case 'bars':
      divisionMultiplier = 1;
      break;
    case 'beats':
      divisionMultiplier = timeSignatureNumerator;
      break;
    case 'subdivisions':
      divisionMultiplier = timeSignatureNumerator * config.divisions;
      break;
  }

  const intervalSamples = samplesPerBar / divisionMultiplier;
  const swing = config.swing ?? 0;

  let currentPosition = 0;
  let beatIndex = 0;

  while (currentPosition < lengthSamples) {
    positions.push(Math.floor(currentPosition));

    // Apply swing to alternating beats
    const isOffBeat = beatIndex % 2 === 1;
    const swingOffset = isOffBeat ? swing * intervalSamples * 0.5 : 0;

    currentPosition += intervalSamples + swingOffset;
    beatIndex++;
  }

  return positions;
}

// ============================================================================
// TRANSIENT SLICING
// ============================================================================

/**
 * Generate slice markers based on transient detection.
 */
export function sliceByTransients(
  samples: Float32Array,
  sampleRate: number,
  sensitivity: number = 0.1,
  minSliceLength: number = 0.05 // 50ms minimum
): SliceMarker[] {
  const transients = detectTransients(samples, sampleRate, { sensitivity });
  const minSliceSamples = Math.floor(minSliceLength * sampleRate);

  const markers: SliceMarker[] = [];
  let lastPosition = 0;

  for (let i = 0; i < transients.length; i++) {
    const transient = transients[i];
    if (!transient) continue;

    // Enforce minimum slice length
    if (transient.position - lastPosition >= minSliceSamples) {
      markers.push({
        id: `transient-marker-${i}`,
        position: transient.position,
        label: `T${i + 1}`,
        suggestedNote: 36 + (i % 48), // Cycle through 4 octaves
        locked: false,
        color: getTransientColor(transient.strength),
      });
      lastPosition = transient.position;
    }
  }

  return markers;
}

/**
 * Get color for transient marker based on strength.
 */
function getTransientColor(strength: number): string {
  // Map strength (0-1) to color (green to red)
  const hue = (1 - strength) * 120; // 120=green, 0=red
  return `hsl(${hue}, 80%, 50%)`;
}

// ============================================================================
// SLICE REGIONS
// ============================================================================

/**
 * Convert slice markers to regions.
 */
export function markersToRegions(
  markers: readonly SliceMarker[],
  lengthSamples: number,
  sampleRate: number
): SliceRegion[] {
  if (markers.length === 0) {
    return [];
  }

  // Sort markers by position
  const sortedMarkers = [...markers].sort((a, b) => a.position - b.position);

  const regions: SliceRegion[] = [];

  for (let i = 0; i < sortedMarkers.length; i++) {
    const marker = sortedMarkers[i];
    const nextMarker = sortedMarkers[i + 1];
    if (!marker) continue;
    
    const start = marker.position;
    const end = nextMarker ? nextMarker.position : lengthSamples;

    regions.push({
      id: marker.id,
      start,
      end,
      suggestedNote: marker.suggestedNote ?? 60,
      duration: (end - start) / sampleRate,
    });
  }

  return regions;
}

// ============================================================================
// MARKER MANIPULATION
// ============================================================================

/**
 * Add a slice marker at a specific position.
 */
export function addMarker(
  config: SampleSliceConfiguration,
  position: number,
  label?: string
): SampleSliceConfiguration {
  // Clamp position
  const clampedPosition = Math.max(0, Math.min(position, config.lengthSamples - 1));

  // Check if marker already exists at this position (within tolerance)
  const tolerance = 100; // samples
  const existingMarker = config.markers.find(
    m => Math.abs(m.position - clampedPosition) < tolerance
  );

  if (existingMarker) {
    return config; // Don't add duplicate
  }

  const newMarker: SliceMarker = {
    id: `marker-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    position: clampedPosition,
    label: label ?? `Marker ${config.markers.length + 1}`,
    suggestedNote: 36 + (config.markers.length % 48),
    locked: false,
  };

  return {
    ...config,
    markers: [...config.markers, newMarker].sort((a, b) => a.position - b.position),
  };
}

/**
 * Remove a slice marker by ID.
 */
export function removeMarker(
  config: SampleSliceConfiguration,
  markerId: string
): SampleSliceConfiguration {
  return {
    ...config,
    markers: config.markers.filter(m => m.id !== markerId),
  };
}

/**
 * Move a slice marker to a new position.
 */
export function moveMarker(
  config: SampleSliceConfiguration,
  markerId: string,
  newPosition: number
): SampleSliceConfiguration {
  const clampedPosition = Math.max(0, Math.min(newPosition, config.lengthSamples - 1));

  return {
    ...config,
    markers: config.markers
      .map(m => m.id === markerId ? { ...m, position: clampedPosition } : m)
      .sort((a, b) => a.position - b.position),
  };
}

/**
 * Toggle marker lock status.
 */
export function toggleMarkerLock(
  config: SampleSliceConfiguration,
  markerId: string
): SampleSliceConfiguration {
  return {
    ...config,
    markers: config.markers.map(m =>
      m.id === markerId ? { ...m, locked: !m.locked } : m
    ),
  };
}

/**
 * Clear all unlocked markers.
 */
export function clearUnlockedMarkers(
  config: SampleSliceConfiguration
): SampleSliceConfiguration {
  return {
    ...config,
    markers: config.markers.filter(m => m.locked),
  };
}

// ============================================================================
// WARP MARKERS
// ============================================================================

/**
 * Add a warp marker at a specific position.
 */
export function addWarpMarker(
  config: SampleSliceConfiguration,
  position: number,
  beat: number,
  label?: string
): SampleSliceConfiguration {
  const clampedPosition = Math.max(0, Math.min(position, config.lengthSamples - 1));

  const newMarker: WarpMarker = {
    id: `warp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    position: clampedPosition,
    beat,
    label: label ?? `Beat ${beat}`,
    locked: false,
  };

  return {
    ...config,
    warpMarkers: [...config.warpMarkers, newMarker].sort((a, b) => a.position - b.position),
  };
}

/**
 * Remove a warp marker by ID.
 */
export function removeWarpMarker(
  config: SampleSliceConfiguration,
  markerId: string
): SampleSliceConfiguration {
  return {
    ...config,
    warpMarkers: config.warpMarkers.filter(m => m.id !== markerId),
  };
}

/**
 * Calculate tempo from warp markers.
 */
export function calculateTempoFromWarpMarkers(
  warpMarkers: readonly WarpMarker[],
  sampleRate: number
): number | null {
  if (warpMarkers.length < 2) {
    return null;
  }

  // Sort by beat
  const sorted = [...warpMarkers].sort((a, b) => a.beat - b.beat);

  // Calculate average BPM across all marker pairs
  let totalBpm = 0;
  let count = 0;

  for (let i = 0; i < sorted.length - 1; i++) {
    const m1 = sorted[i];
    const m2 = sorted[i + 1];
    if (!m1 || !m2) continue;

    const beatDuration = m2.beat - m1.beat;
    const sampleDuration = m2.position - m1.position;
    const secondsDuration = sampleDuration / sampleRate;

    if (secondsDuration > 0 && beatDuration > 0) {
      const bpm = (beatDuration / secondsDuration) * 60;
      totalBpm += bpm;
      count++;
    }
  }

  return count > 0 ? totalBpm / count : null;
}

// ============================================================================
// SLICE EXPORT
// ============================================================================

/**
 * Extract a slice region as a separate Float32Array.
 */
export function extractSlice(
  samples: Float32Array,
  region: SliceRegion,
  fadeInSamples: number = 0,
  fadeOutSamples: number = 0
): Float32Array {
  const sliceLength = region.end - region.start;
  const slice = new Float32Array(sliceLength);

  // Copy samples
  for (let i = 0; i < sliceLength; i++) {
    const sample = samples[region.start + i];
    if (sample !== undefined) {
      slice[i] = sample;
    }
  }

  // Apply fade-in
  if (fadeInSamples > 0) {
    const actualFadeIn = Math.min(fadeInSamples, sliceLength);
    for (let i = 0; i < actualFadeIn; i++) {
      const factor = i / actualFadeIn;
      const current = slice[i];
      if (current !== undefined) {
        slice[i] = current * factor;
      }
    }
  }

  // Apply fade-out
  if (fadeOutSamples > 0) {
    const actualFadeOut = Math.min(fadeOutSamples, sliceLength);
    const fadeStart = sliceLength - actualFadeOut;
    for (let i = 0; i < actualFadeOut; i++) {
      const factor = (actualFadeOut - i) / actualFadeOut;
      const current = slice[fadeStart + i];
      if (current !== undefined) {
        slice[fadeStart + i] = current * factor;
      }
    }
  }

  return slice;
}

/**
 * Export all slices as separate buffers.
 */
export function exportSlices(
  samples: Float32Array,
  config: SampleSliceConfiguration,
  fadeInMs: number = 5,
  fadeOutMs: number = 5
): Array<{ region: SliceRegion; samples: Float32Array }> {
  const regions = markersToRegions(config.markers, config.lengthSamples, config.sampleRate);
  const fadeInSamples = Math.floor((fadeInMs / 1000) * config.sampleRate);
  const fadeOutSamples = Math.floor((fadeOutMs / 1000) * config.sampleRate);

  return regions.map(region => ({
    region,
    samples: extractSlice(samples, region, fadeInSamples, fadeOutSamples),
  }));
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a default slice configuration.
 */
export function createSliceConfiguration(
  sampleId: string,
  sampleRate: number,
  lengthSamples: number
): SampleSliceConfiguration {
  return {
    sampleId,
    sampleRate,
    lengthSamples,
    markers: [],
    warpMarkers: [],
    tempoSync: {
      enabled: false,
      targetTempo: 120,
      warpMarkers: [],
      interpolation: 'linear',
      preserveFormants: true,
    },
    pitchLock: {
      enabled: false,
      preserveFormants: true,
      fineTuneCents: 0,
    },
  };
}

/**
 * Perform a complete grid-based slicing operation.
 */
export function performGridSlicing(
  config: SampleSliceConfiguration,
  gridConfig: SliceGridConfig
): SliceResult {
  const markers = sliceByGrid(config.lengthSamples, config.sampleRate, gridConfig);
  const regions = markersToRegions(markers, config.lengthSamples, config.sampleRate);

  return {
    markers,
    regions,
    metadata: {
      method: 'grid',
      timestamp: Date.now(),
      parameters: gridConfig as unknown as Record<string, unknown>,
    },
  };
}

/**
 * Perform a complete transient-based slicing operation.
 */
export function performTransientSlicing(
  samples: Float32Array,
  config: SampleSliceConfiguration,
  sensitivity: number = 0.1,
  minSliceLength: number = 0.05
): SliceResult {
  const markers = sliceByTransients(samples, config.sampleRate, sensitivity, minSliceLength);
  const regions = markersToRegions(markers, config.lengthSamples, config.sampleRate);

  return {
    markers,
    regions,
    metadata: {
      method: 'transient',
      timestamp: Date.now(),
      parameters: { sensitivity, minSliceLength },
    },
  };
}
