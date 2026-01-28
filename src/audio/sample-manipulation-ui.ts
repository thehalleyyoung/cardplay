/**
 * @fileoverview Sample Manipulation UI Module
 * 
 * Provides in-browser sample manipulation UI and operations:
 * - Trimming with visual waveform editor
 * - Fade in/out with curve selection
 * - Normalization with mode selection
 * - Reverse with preview
 * - Time-stretch and pitch-shift
 * - Sample rate and bit depth conversion
 * - Batch processing
 * - Slice editor with transient detection
 * - Warp markers for tempo sync
 * 
 * @module @cardplay/core/audio/sample-manipulation-ui
 */

import {
  normalizeSample,
  applyFade,
  reverseSample,
  trimSilence,
  cropSample,
  applyGain,
  pitchShiftByResampling,
  timeStretchByResampling,
  detectTransients,
  createSlicesFromTransients,
  findNearestZeroCrossing,
  generateWaveformOverview,
  calculateSampleStats,
  removeDcOffset,
  type NormalizeMode,
  type FadeCurve,
  type SliceRegion,
  type WaveformOverview,
  type SampleStats,
} from './sample-editor';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Sample manipulation operation type.
 */
export type ManipulationOperation =
  | 'trim'
  | 'fade'
  | 'normalize'
  | 'reverse'
  | 'time-stretch'
  | 'pitch-shift'
  | 'convert-rate'
  | 'convert-depth'
  | 'convert-channels'
  | 'gain'
  | 'dc-remove'
  | 'slice'
  | 'crop'
  | 'save-as-new';

/**
 * Trim operation parameters.
 */
export interface TrimParams {
  /** Auto-detect silence threshold */
  autoDetect: boolean;
  /** Silence threshold (0-1) */
  threshold?: number;
  /** Snap to zero crossings */
  snapToZero?: boolean;
}

/**
 * Fade operation parameters.
 */
export interface FadeParams {
  /** Fade in duration in samples */
  fadeInSamples: number;
  /** Fade out duration in samples */
  fadeOutSamples: number;
  /** Fade curve type */
  curve: FadeCurve;
}

/**
 * Normalize operation parameters.
 */
export interface NormalizeParams {
  /** Normalization mode */
  mode: NormalizeMode;
  /** Target level in dB */
  targetDb: number;
}

/**
 * Time stretch parameters.
 */
export interface TimeStretchParams {
  /** Stretch ratio (1.0 = original, 2.0 = double length) */
  ratio: number;
  /** Preserve pitch */
  preservePitch: boolean;
}

/**
 * Pitch shift parameters.
 */
export interface PitchShiftParams {
  /** Semitones to shift (-12 to +12) */
  semitones: number;
  /** Preserve duration */
  preserveDuration: boolean;
}

/**
 * Sample rate conversion parameters.
 */
export interface ConvertRateParams {
  /** Target sample rate */
  targetRate: number;
  /** Quality (0-4) */
  quality: number;
}

/**
 * Bit depth conversion parameters.
 */
export interface ConvertDepthParams {
  /** Target bit depth (8, 16, 24, 32) */
  targetDepth: number;
  /** Dither */
  dither: boolean;
}

/**
 * Channel conversion parameters.
 */
export interface ConvertChannelsParams {
  /** Target channel count */
  targetChannels: number;
  /** Mono mixdown method */
  mixMethod: 'average' | 'left' | 'right';
}

/**
 * Crop operation parameters.
 */
export interface CropParams {
  /** Start sample position */
  startSample: number;
  /** End sample position */
  endSample: number;
  /** Snap to zero crossings */
  snapToZero: boolean;
}

/**
 * Slice operation parameters.
 */
export interface SliceParams {
  /** Slice mode */
  mode: 'transient' | 'grid' | 'manual';
  /** Transient sensitivity (0-1) */
  sensitivity?: number;
  /** Grid division (beats) */
  gridDivision?: number;
  /** Manual slice positions */
  positions?: number[];
  /** Start MIDI note for mapping */
  startNote?: number;
}

/**
 * Warp marker for tempo sync.
 */
export interface WarpMarker {
  /** Position in samples */
  position: number;
  /** Beat position in project tempo */
  beat: number;
  /** Is locked */
  locked: boolean;
}

/**
 * Manipulation operation parameters union.
 */
export type ManipulationParams =
  | TrimParams
  | FadeParams
  | NormalizeParams
  | TimeStretchParams
  | PitchShiftParams
  | ConvertRateParams
  | ConvertDepthParams
  | ConvertChannelsParams
  | CropParams
  | SliceParams
  | SaveAsNewParams
  | { gainDb: number }
  | Record<string, never>;

/**
 * Manipulation result.
 */
export interface ManipulationResult {
  /** Result samples (undefined if operation was slice or save-as-new) */
  samples?: Float32Array;
  /** Slice regions (for slice operations) */
  slices?: SliceRegion[];
  /** Sample rate */
  sampleRate: number;
  /** Statistics */
  stats: SampleStats;
  /** Metadata */
  metadata?: Record<string, unknown>;
  /** Saved sample info (for save-as-new operations) */
  savedInfo?: {
    name: string;
    id: string;
  };
}

/**
 * Save as new sample operation.
 */
export interface SaveAsNewParams {
  /** New sample name */
  name: string;
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Batch processing job.
 */
export interface BatchJob {
  /** Job ID */
  id: string;
  /** Sample data */
  samples: Float32Array;
  /** Sample rate */
  sampleRate: number;
  /** Operations to apply in sequence */
  operations: Array<{
    type: ManipulationOperation;
    params: ManipulationParams;
  }>;
  /** Original filename */
  filename?: string;
}

/**
 * Batch processing result.
 */
export interface BatchResult {
  /** Job ID */
  jobId: string;
  /** Success */
  success: boolean;
  /** Result */
  result?: ManipulationResult;
  /** Error message */
  error?: string;
  /** Processing time (ms) */
  duration: number;
}

/**
 * Undo state for sample editing.
 */
export interface UndoState {
  /** Operation that was performed */
  operation: ManipulationOperation;
  /** Parameters */
  params: ManipulationParams;
  /** Previous samples */
  previousSamples: Float32Array;
  /** Previous sample rate */
  previousRate: number;
  /** Timestamp */
  timestamp: number;
}

// ============================================================================
// IN-BROWSER MANIPULATION API
// ============================================================================

/**
 * Apply trimming operation.
 */
export function performTrim(
  samples: Float32Array,
  sampleRate: number,
  params: TrimParams
): ManipulationResult {
  let result: Float32Array;
  
  if (params.autoDetect) {
    const trimResult = trimSilence(samples, params.threshold);
    result = trimResult.samples;
  } else {
    // Manual trim requires crop params
    result = samples;
  }
  
  return {
    samples: result,
    sampleRate,
    stats: calculateSampleStats(result, sampleRate),
  };
}

/**
 * Apply fade operation.
 */
export function performFade(
  samples: Float32Array,
  sampleRate: number,
  params: FadeParams
): ManipulationResult {
  const result = applyFade(
    samples,
    params.fadeInSamples,
    params.fadeOutSamples,
    params.curve
  );
  
  return {
    samples: result,
    sampleRate,
    stats: calculateSampleStats(result, sampleRate),
  };
}

/**
 * Apply normalization.
 */
export function performNormalize(
  samples: Float32Array,
  sampleRate: number,
  params: NormalizeParams
): ManipulationResult {
  const result = normalizeSample(samples, params.mode, params.targetDb);
  
  return {
    samples: result,
    sampleRate,
    stats: calculateSampleStats(result, sampleRate),
  };
}

/**
 * Apply reverse operation.
 */
export function performReverse(
  samples: Float32Array,
  sampleRate: number
): ManipulationResult {
  const result = reverseSample(samples);
  
  return {
    samples: result,
    sampleRate,
    stats: calculateSampleStats(result, sampleRate),
  };
}

/**
 * Apply time stretch operation.
 */
export function performTimeStretch(
  samples: Float32Array,
  sampleRate: number,
  params: TimeStretchParams
): ManipulationResult {
  const result = timeStretchByResampling(samples, params.ratio);
  
  return {
    samples: result,
    sampleRate,
    stats: calculateSampleStats(result, sampleRate),
    metadata: {
      originalLength: samples.length,
      stretchRatio: params.ratio,
    },
  };
}

/**
 * Apply pitch shift operation.
 */
export function performPitchShift(
  samples: Float32Array,
  sampleRate: number,
  params: PitchShiftParams
): ManipulationResult {
  const result = pitchShiftByResampling(samples, params.semitones);
  
  return {
    samples: result,
    sampleRate,
    stats: calculateSampleStats(result, sampleRate),
    metadata: {
      semitones: params.semitones,
    },
  };
}

/**
 * Convert sample rate.
 */
export function performConvertRate(
  samples: Float32Array,
  sampleRate: number,
  params: ConvertRateParams
): ManipulationResult {
  const ratio = params.targetRate / sampleRate;
  const newLength = Math.floor(samples.length * ratio);
  const result = new Float32Array(newLength);
  
  // Linear interpolation (basic quality)
  // For higher quality, would use sinc interpolation
  for (let i = 0; i < newLength; i++) {
    const srcPos = i / ratio;
    const srcIdx = Math.floor(srcPos);
    const frac = srcPos - srcIdx;
    
    if (srcIdx + 1 < samples.length) {
      result[i] = samples[srcIdx]! * (1 - frac) + samples[srcIdx + 1]! * frac;
    } else if (srcIdx < samples.length) {
      result[i] = samples[srcIdx]!;
    }
  }
  
  return {
    samples: result,
    sampleRate: params.targetRate,
    stats: calculateSampleStats(result, params.targetRate),
    metadata: {
      originalRate: sampleRate,
      targetRate: params.targetRate,
    },
  };
}

/**
 * Convert bit depth.
 */
export function performConvertDepth(
  samples: Float32Array,
  sampleRate: number,
  params: ConvertDepthParams
): ManipulationResult {
  const result = new Float32Array(samples.length);
  
  // Calculate quantization levels
  const levels = Math.pow(2, params.targetDepth);
  const stepSize = 2.0 / levels;
  
  for (let i = 0; i < samples.length; i++) {
    let sample = samples[i]!;
    
    // Apply dither if requested
    if (params.dither) {
      const ditherAmount = stepSize / 3;
      sample += (Math.random() - 0.5) * ditherAmount;
    }
    
    // Quantize
    const quantized = Math.round(sample / stepSize) * stepSize;
    result[i] = Math.max(-1, Math.min(1, quantized));
  }
  
  return {
    samples: result,
    sampleRate,
    stats: calculateSampleStats(result, sampleRate),
    metadata: {
      targetDepth: params.targetDepth,
      dither: params.dither,
    },
  };
}

/**
 * Convert channel count.
 */
export function performConvertChannels(
  samples: Float32Array,
  sampleRate: number,
  params: ConvertChannelsParams
): ManipulationResult {
  // This is a simplified mono implementation
  // Real implementation would handle multi-channel properly
  let result = samples;
  
  if (params.targetChannels === 1) {
    // Already mono
    result = samples;
  } else if (params.targetChannels === 2) {
    // Duplicate to stereo
    result = new Float32Array(samples.length * 2);
    for (let i = 0; i < samples.length; i++) {
      result[i * 2] = samples[i]!;
      result[i * 2 + 1] = samples[i]!;
    }
  }
  
  return {
    samples: result,
    sampleRate,
    stats: calculateSampleStats(result, sampleRate),
    metadata: {
      targetChannels: params.targetChannels,
    },
  };
}

/**
 * Apply crop operation.
 */
export function performCrop(
  samples: Float32Array,
  sampleRate: number,
  params: CropParams
): ManipulationResult {
  const result = cropSample(
    samples,
    params.startSample,
    params.endSample,
    params.snapToZero
  );
  
  return {
    samples: result,
    sampleRate,
    stats: calculateSampleStats(result, sampleRate),
    metadata: {
      originalLength: samples.length,
      cropStart: params.startSample,
      cropEnd: params.endSample,
    },
  };
}

/**
 * Apply gain adjustment.
 */
export function performGain(
  samples: Float32Array,
  sampleRate: number,
  gainDb: number
): ManipulationResult {
  const result = applyGain(samples, gainDb);
  
  return {
    samples: result,
    sampleRate,
    stats: calculateSampleStats(result, sampleRate),
    metadata: {
      gainDb,
    },
  };
}

/**
 * Remove DC offset.
 */
export function performDcRemove(
  samples: Float32Array,
  sampleRate: number
): ManipulationResult {
  const result = removeDcOffset(samples);
  
  return {
    samples: result,
    sampleRate,
    stats: calculateSampleStats(result, sampleRate),
  };
}

/**
 * Perform slice operation.
 */
export function performSlice(
  samples: Float32Array,
  sampleRate: number,
  params: SliceParams
): ManipulationResult {
  let slices: SliceRegion[];
  
  if (params.mode === 'transient') {
    const transients = detectTransients(samples, sampleRate, {
      sensitivity: params.sensitivity ?? 0.5,
    });
    slices = createSlicesFromTransients(
      samples,
      sampleRate,
      transients,
      params.startNote
    );
  } else if (params.mode === 'grid') {
    // Grid-based slicing
    const beatsPerSample = (params.gridDivision ?? 1) * sampleRate * 60 / 120; // Assume 120 BPM
    const numSlices = Math.floor(samples.length / beatsPerSample);
    slices = [];
    
    for (let i = 0; i < numSlices; i++) {
      const start = Math.floor(i * beatsPerSample);
      const end = Math.floor((i + 1) * beatsPerSample);
      
      slices.push({
        id: `slice-grid-${i}`,
        start: findNearestZeroCrossing(samples, start, 100),
        end: findNearestZeroCrossing(samples, end, 100),
        suggestedNote: (params.startNote ?? 36) + i,
        duration: (end - start) / sampleRate,
      });
    }
  } else {
    // Manual slicing
    const positions = params.positions ?? [];
    slices = [];
    
    for (let i = 0; i < positions.length; i++) {
      const start = positions[i]!;
      const end = i < positions.length - 1 ? positions[i + 1]! : samples.length;
      
      slices.push({
        id: `slice-manual-${i}`,
        start,
        end,
        suggestedNote: (params.startNote ?? 36) + i,
        duration: (end - start) / sampleRate,
      });
    }
  }
  
  return {
    slices,
    sampleRate,
    stats: calculateSampleStats(samples, sampleRate),
  };
}

/**
 * Save sample as new.
 * This returns the original samples with metadata for saving.
 * Actual persistence is handled by the sample manager.
 */
export function performSaveAsNew(
  samples: Float32Array,
  sampleRate: number,
  params: SaveAsNewParams
): ManipulationResult {
  const id = `sample-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    samples,
    sampleRate,
    stats: calculateSampleStats(samples, sampleRate),
    savedInfo: {
      name: params.name,
      id,
    },
    metadata: {
      ...params.metadata,
      savedAt: Date.now(),
    },
  };
}

/**
 * Apply manipulation operation.
 */
export function applyManipulation(
  samples: Float32Array,
  sampleRate: number,
  operation: ManipulationOperation,
  params: ManipulationParams
): ManipulationResult {
  switch (operation) {
    case 'trim':
      return performTrim(samples, sampleRate, params as TrimParams);
    case 'fade':
      return performFade(samples, sampleRate, params as FadeParams);
    case 'normalize':
      return performNormalize(samples, sampleRate, params as NormalizeParams);
    case 'reverse':
      return performReverse(samples, sampleRate);
    case 'time-stretch':
      return performTimeStretch(samples, sampleRate, params as TimeStretchParams);
    case 'pitch-shift':
      return performPitchShift(samples, sampleRate, params as PitchShiftParams);
    case 'convert-rate':
      return performConvertRate(samples, sampleRate, params as ConvertRateParams);
    case 'convert-depth':
      return performConvertDepth(samples, sampleRate, params as ConvertDepthParams);
    case 'convert-channels':
      return performConvertChannels(samples, sampleRate, params as ConvertChannelsParams);
    case 'crop':
      return performCrop(samples, sampleRate, params as CropParams);
    case 'gain':
      return performGain(samples, sampleRate, (params as { gainDb: number }).gainDb);
    case 'dc-remove':
      return performDcRemove(samples, sampleRate);
    case 'slice':
      return performSlice(samples, sampleRate, params as SliceParams);
    case 'save-as-new':
      return performSaveAsNew(samples, sampleRate, params as SaveAsNewParams);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

/**
 * Process batch jobs.
 */
export async function processBatch(jobs: BatchJob[]): Promise<BatchResult[]> {
  const results: BatchResult[] = [];
  
  for (const job of jobs) {
    const startTime = performance.now();
    
    try {
      let currentSamples = job.samples;
      let currentRate = job.sampleRate;
      let finalResult: ManipulationResult | undefined;
      
      // Apply operations in sequence
      for (const op of job.operations) {
        const result = applyManipulation(
          currentSamples,
          currentRate,
          op.type,
          op.params
        );
        
        if (result.samples) {
          currentSamples = result.samples;
          currentRate = result.sampleRate;
        }
        finalResult = result;
      }
      
      const duration = performance.now() - startTime;
      
      // Ensure we have a result
      if (!finalResult) {
        throw new Error('No operations produced a result');
      }
      
      results.push({
        jobId: job.id,
        success: true,
        result: finalResult,
        duration,
      });
    } catch (error) {
      const duration = performance.now() - startTime;
      
      results.push({
        jobId: job.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
    }
  }
  
  return results;
}

// ============================================================================
// UNDO/REDO SYSTEM
// ============================================================================

/**
 * Create undo state.
 */
export function createUndoState(
  operation: ManipulationOperation,
  params: ManipulationParams,
  samples: Float32Array,
  sampleRate: number
): UndoState {
  return {
    operation,
    params,
    previousSamples: new Float32Array(samples),
    previousRate: sampleRate,
    timestamp: Date.now(),
  };
}

/**
 * Apply undo state.
 */
export function applyUndo(
  undoState: UndoState
): { samples: Float32Array; sampleRate: number } {
  return {
    samples: undoState.previousSamples,
    sampleRate: undoState.previousRate,
  };
}

// ============================================================================
// WAVEFORM VISUALIZATION HELPERS
// ============================================================================

/**
 * Generate waveform for UI display.
 */
export function generateWaveformForUI(
  samples: Float32Array,
  sampleRate: number,
  width: number = 1000
): WaveformOverview {
  return generateWaveformOverview(samples, sampleRate, width);
}

/**
 * Get sample region for zoom.
 */
export function getSampleRegion(
  samples: Float32Array,
  startFraction: number,
  endFraction: number
): Float32Array {
  const start = Math.floor(samples.length * startFraction);
  const end = Math.floor(samples.length * endFraction);
  return samples.slice(start, end);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Operations
  performTrim,
  performFade,
  performNormalize,
  performReverse,
  performTimeStretch,
  performPitchShift,
  performConvertRate,
  performConvertDepth,
  performConvertChannels,
  performCrop,
  performGain,
  performDcRemove,
  performSlice,
  performSaveAsNew,
  applyManipulation,
  
  // Batch processing
  processBatch,
  
  // Undo/redo
  createUndoState,
  applyUndo,
  
  // Visualization
  generateWaveformForUI,
  getSampleRegion,
};
