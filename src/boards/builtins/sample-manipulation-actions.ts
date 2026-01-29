/**
 * @fileoverview Sample Manipulation Actions (Phase F: F074-F075)
 * 
 * Actions for sample manipulation in the Basic Sampler Board:
 * - F074: Grid chop (split sample into equal slices)
 * - F074: Manual slice markers (user-defined chop points)
 * - F075: Time stretch (change duration without affecting pitch)
 * - F075: Pitch shift (change pitch without affecting duration)
 * 
 * All actions integrated with undo stack and parameter resolver.
 * 
 * @module @cardplay/boards/builtins/sample-manipulation-actions
 */

import type { ClipId } from '../../state/types';
import { getClipRegistry } from '../../state/clip-registry';
import { getUndoStack } from '../../state/undo-stack';
import { asTick } from '../../types/primitives';

// ============================================================================
// SAMPLE REFERENCE
// ============================================================================

/**
 * Reference to an audio sample asset.
 */
export interface SampleReference {
  /** Unique sample ID */
  id: string;
  
  /** Sample name */
  name: string;
  
  /** File path or URL */
  path: string;
  
  /** Sample rate */
  sampleRate: number;
  
  /** Channel count */
  channels: number;
  
  /** Duration in seconds */
  durationSeconds: number;
  
  /** Duration in samples */
  durationSamples: number;
  
  /** Optional waveform data for preview */
  waveformData?: Float32Array;
}

// ============================================================================
// F074: CHOP ACTIONS
// ============================================================================

/**
 * Slice marker in a sample.
 */
export interface SliceMarker {
  /** Position in samples */
  position: number;
  
  /** Position as fraction of total duration (0-1) */
  positionNormalized: number;
  
  /** Optional label */
  label?: string;
  
  /** Whether this is a beat/grid marker */
  isBeatMarker: boolean;
}

/**
 * Chop settings.
 */
export interface ChopSettings {
  /** Sample to chop */
  sampleRef: SampleReference;
  
  /** Slice markers */
  markers: SliceMarker[];
  
  /** Create clips for each slice */
  createClips: boolean;
  
  /** Apply fade in/out to slices */
  applyFades: boolean;
  
  /** Fade duration in samples */
  fadeSamples: number;
}

/**
 * Result of chop operation.
 */
export interface ChopResult {
  /** Original sample reference */
  originalSample: SampleReference;
  
  /** Slice references */
  slices: Array<{
    index: number;
    startSample: number;
    endSample: number;
    durationSamples: number;
    clipId?: ClipId;
  }>;
  
  /** Clip IDs created (if createClips was true) */
  clipIds: ClipId[];
}

/**
 * F074: Grid chop - split sample into equal slices.
 * 
 * @param sampleRef - Sample to chop
 * @param sliceCount - Number of equal slices
 * @param createClips - Whether to create clips for each slice
 * @returns Chop result with slice information
 */
export function gridChop(
  sampleRef: SampleReference,
  sliceCount: number,
  createClips: boolean = true
): ChopResult {
  if (sliceCount < 2) {
    throw new Error('Slice count must be at least 2');
  }
  
  const sliceDuration = sampleRef.durationSamples / sliceCount;
  const markers: SliceMarker[] = [];
  
  // Create evenly spaced markers
  for (let i = 1; i < sliceCount; i++) {
    const position = Math.floor(i * sliceDuration);
    markers.push({
      position,
      positionNormalized: position / sampleRef.durationSamples,
      isBeatMarker: true
    });
  }
  
  return chopWithMarkers({
    sampleRef,
    markers,
    createClips,
    applyFades: true,
    fadeSamples: 100 // ~2ms at 48kHz
  });
}

/**
 * F074: Manual chop - split sample at specific markers.
 * 
 * @param sampleRef - Sample to chop
 * @param markers - User-defined slice markers
 * @param createClips - Whether to create clips for each slice
 * @returns Chop result with slice information
 */
export function manualChop(
  sampleRef: SampleReference,
  markers: SliceMarker[],
  createClips: boolean = true
): ChopResult {
  return chopWithMarkers({
    sampleRef,
    markers: [...markers].sort((a, b) => a.position - b.position),
    createClips,
    applyFades: true,
    fadeSamples: 100
  });
}

/**
 * Internal: Chop with markers.
 */
function chopWithMarkers(settings: ChopSettings): ChopResult {
  const { sampleRef, markers, createClips } = settings;
  const registry = getClipRegistry();
  
  // Build slice ranges
  const slices: ChopResult['slices'] = [];
  let prevMarker = 0;
  
  for (const marker of markers) {
    slices.push({
      index: slices.length,
      startSample: prevMarker,
      endSample: marker.position,
      durationSamples: marker.position - prevMarker
    });
    prevMarker = marker.position;
  }
  
  // Add final slice
  slices.push({
    index: slices.length,
    startSample: prevMarker,
    endSample: sampleRef.durationSamples,
    durationSamples: sampleRef.durationSamples - prevMarker
  });
  
  // Create clips if requested
  const clipIds: ClipId[] = [];
  
  if (createClips) {
    for (const slice of slices) {
      // Create a new stream for this slice (stub - would reference sub-region of sample)
      // For MVP, just create empty clips with calculated durations
      
      // Estimate ticks based on sample rate and tempo (assume 120 BPM, 480 PPQ)
      const ticksPerSecond = (120 / 60) * 480;
      const durationSeconds = slice.durationSamples / sampleRef.sampleRate;
      const durationTicks = Math.floor(durationSeconds * ticksPerSecond);
      
      const clip = registry.createClip({
        name: `${sampleRef.name} [${slice.index + 1}]`,
        streamId: 'sample-slice-stream' as any, // TODO: Create proper sample stream
        duration: asTick(durationTicks),
        loop: false,
        color: '#FF5722' // Deep orange for chopped samples
      });
      
      slice.clipId = clip.id;
      clipIds.push(clip.id);
    }
  }
  
  // Wrap in undo
  getUndoStack().push({
    type: 'batch',
    description: `Chop "${sampleRef.name}" into ${slices.length} slices`,
    undo: () => {
      // Remove created clips
      clipIds.forEach(clipId => {
        // TODO: Remove clip from registry
        console.info('Remove clip:', clipId);
      });
    },
    redo: () => {
      // Re-create clips
      console.warn('Chop redo not fully implemented');
    }
  });
  
  const result: ChopResult = {
    originalSample: sampleRef,
    slices,
    clipIds
  };
  
  console.info('Chop complete:', result);
  
  return result;
}

// ============================================================================
// F075: TIME STRETCH
// ============================================================================

/**
 * Time stretch settings.
 */
export interface TimeStretchSettings {
  /** Sample to stretch */
  sampleRef: SampleReference;
  
  /** Target duration in seconds */
  targetDuration: number;
  
  /** Stretch algorithm */
  algorithm: 'rubberband' | 'paulstretch' | 'phase-vocoder';
  
  /** Preserve formants */
  preserveFormants: boolean;
  
  /** Quality (0-1, higher = better but slower) */
  quality: number;
}

/**
 * F075: Time stretch - change duration without affecting pitch.
 * 
 * Stub implementation - would integrate with audio processing library.
 */
export async function timeStretch(
  settings: TimeStretchSettings
): Promise<SampleReference> {
  const { sampleRef, targetDuration } = settings;
  
  // Calculate stretch factor
  const stretchFactor = targetDuration / sampleRef.durationSeconds;
  
  console.info('Time stretch:', {
    sample: sampleRef.name,
    originalDuration: sampleRef.durationSeconds,
    targetDuration,
    stretchFactor
  });
  
  // TODO: Integrate with audio processing (Web Audio API, audio worklet, or external library)
  // For MVP, return reference to "stretched" sample (would be processed)
  
  const stretchedSample: SampleReference = {
    ...sampleRef,
    id: `${sampleRef.id}-stretched-${stretchFactor.toFixed(2)}`,
    name: `${sampleRef.name} (${Math.round(stretchFactor * 100)}%)`,
    durationSeconds: targetDuration,
    durationSamples: Math.floor(targetDuration * sampleRef.sampleRate)
  };
  
  // Wrap in undo
  getUndoStack().push({
    type: 'batch',
    description: `Time stretch "${sampleRef.name}" to ${targetDuration.toFixed(2)}s`,
    undo: () => {
      console.info('Undo time stretch');
      // Would remove stretched sample reference
    },
    redo: () => {
      console.info('Redo time stretch');
      // Would re-create stretched sample
    }
  });
  
  return stretchedSample;
}

// ============================================================================
// F075: PITCH SHIFT
// ============================================================================

/**
 * Pitch shift settings.
 */
export interface PitchShiftSettings {
  /** Sample to pitch shift */
  sampleRef: SampleReference;
  
  /** Pitch shift in semitones */
  semitones: number;
  
  /** Pitch shift in cents (100 cents = 1 semitone) */
  cents: number;
  
  /** Preserve duration (time stretch to compensate) */
  preserveDuration: boolean;
  
  /** Algorithm */
  algorithm: 'granular' | 'phase-vocoder' | 'resampling';
  
  /** Quality (0-1) */
  quality: number;
}

/**
 * F075: Pitch shift - change pitch without affecting duration.
 * 
 * Stub implementation - would integrate with audio processing library.
 */
export async function pitchShift(
  settings: PitchShiftSettings
): Promise<SampleReference> {
  const { sampleRef, semitones, cents } = settings;
  
  const totalCents = (semitones * 100) + cents;
  const pitchRatio = Math.pow(2, totalCents / 1200);
  
  console.info('Pitch shift:', {
    sample: sampleRef.name,
    semitones,
    cents,
    totalCents,
    pitchRatio
  });
  
  // TODO: Integrate with audio processing
  // For MVP, return reference to "pitch shifted" sample
  
  const shiftedSample: SampleReference = {
    ...sampleRef,
    id: `${sampleRef.id}-pitched-${totalCents}`,
    name: `${sampleRef.name} (${semitones >= 0 ? '+' : ''}${semitones}st)`,
    // Duration unchanged if preserveDuration is true
    durationSeconds: settings.preserveDuration ? 
      sampleRef.durationSeconds : 
      sampleRef.durationSeconds / pitchRatio,
    durationSamples: settings.preserveDuration ?
      sampleRef.durationSamples :
      Math.floor(sampleRef.durationSamples / pitchRatio)
  };
  
  // Wrap in undo
  getUndoStack().push({
    type: 'batch',
    description: `Pitch shift "${sampleRef.name}" by ${semitones}st`,
    undo: () => {
      console.info('Undo pitch shift');
      // Would remove shifted sample reference
    },
    redo: () => {
      console.info('Redo pitch shift');
      // Would re-create shifted sample
    }
  });
  
  return shiftedSample;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Detect beat markers in a sample using onset detection.
 * 
 * Stub implementation - would use audio analysis.
 */
export async function detectBeatMarkers(
  _sampleRef: SampleReference,
  _sensitivity: number = 0.5
): Promise<SliceMarker[]> {
  console.warn('Beat detection not implemented - returning empty array');
  return [];
}

/**
 * Snap markers to nearest beat grid.
 */
export function snapMarkersToGrid(
  markers: SliceMarker[],
  bpm: number,
  sampleRate: number
): SliceMarker[] {
  const samplesPerBeat = (60 / bpm) * sampleRate;
  
  return markers.map(marker => ({
    ...marker,
    position: Math.round(marker.position / samplesPerBeat) * samplesPerBeat,
    positionNormalized: (Math.round(marker.position / samplesPerBeat) * samplesPerBeat) / 
      (marker.position / marker.positionNormalized)
  }));
}
