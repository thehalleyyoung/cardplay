/**
 * @fileoverview Sample Editor Module
 * 
 * Provides sample editing capabilities for the sampler:
 * - Waveform analysis and visualization data
 * - Loop point detection and editing
 * - Sample normalization and gain adjustment
 * - Transient detection for slicing
 * - Zero-crossing finder for clean edits
 * - Sample trimming and cropping
 * - Reverse and fade operations
 * 
 * @module @cardplay/core/audio/sample-editor
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Minimum loop length in samples */
export const MIN_LOOP_LENGTH = 64;

/** Zero-crossing threshold */
export const ZERO_CROSSING_THRESHOLD = 0.01;

/** Silence threshold for trimming */
export const SILENCE_THRESHOLD = 0.001;

/** Minimum RMS for onset detection */
export const ONSET_THRESHOLD = 0.1;

/** Attack time for onset detection (seconds) */
export const ONSET_ATTACK_TIME = 0.01;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Waveform overview data for visualization.
 */
export interface WaveformOverview {
  /** Peak values (positive) */
  readonly peaks: Float32Array;
  /** Trough values (negative) */
  readonly troughs: Float32Array;
  /** RMS values per segment */
  readonly rms: Float32Array;
  /** Samples per segment */
  readonly samplesPerSegment: number;
  /** Total sample count */
  readonly totalSamples: number;
  /** Duration in seconds */
  readonly duration: number;
}

/**
 * Loop point suggestion.
 */
export interface LoopSuggestion {
  /** Loop start sample */
  readonly start: number;
  /** Loop end sample */
  readonly end: number;
  /** Quality score (0-1) */
  readonly quality: number;
  /** Is zero-crossing based */
  readonly isZeroCrossing: boolean;
}

/**
 * Transient/onset detection result.
 */
export interface TransientInfo {
  /** Sample position */
  readonly position: number;
  /** Transient strength (0-1) */
  readonly strength: number;
  /** Time in seconds */
  readonly time: number;
}

/**
 * Slice region from transient detection.
 */
export interface SliceRegion {
  /** Region ID */
  readonly id: string;
  /** Start sample */
  readonly start: number;
  /** End sample */
  readonly end: number;
  /** Suggested MIDI note (for drum mapping) */
  readonly suggestedNote: number;
  /** Duration in seconds */
  readonly duration: number;
}

/**
 * Sample statistics.
 */
export interface SampleStats {
  /** Peak amplitude */
  readonly peak: number;
  /** RMS level */
  readonly rms: number;
  /** LUFS (approximation) */
  readonly lufs: number;
  /** DC offset */
  readonly dcOffset: number;
  /** Zero crossing rate */
  readonly zeroCrossingRate: number;
  /** Duration in seconds */
  readonly duration: number;
  /** Sample count */
  readonly sampleCount: number;
  /** Sample rate */
  readonly sampleRate: number;
}

/**
 * Fade curve type.
 */
export type FadeCurve = 'linear' | 'exponential' | 'logarithmic' | 's-curve';

/**
 * Normalization mode.
 */
export type NormalizeMode = 'peak' | 'rms' | 'lufs';

// ============================================================================
// WAVEFORM ANALYSIS
// ============================================================================

/**
 * Generate waveform overview data for visualization.
 */
export function generateWaveformOverview(
  samples: Float32Array,
  sampleRate: number,
  numSegments: number = 1000
): WaveformOverview {
  const totalSamples = samples.length;
  const samplesPerSegment = Math.max(1, Math.floor(totalSamples / numSegments));
  const actualSegments = Math.ceil(totalSamples / samplesPerSegment);
  
  const peaks = new Float32Array(actualSegments);
  const troughs = new Float32Array(actualSegments);
  const rms = new Float32Array(actualSegments);
  
  for (let i = 0; i < actualSegments; i++) {
    const start = i * samplesPerSegment;
    const end = Math.min(start + samplesPerSegment, totalSamples);
    
    let peak = 0;
    let trough = 0;
    let sumSquares = 0;
    
    for (let j = start; j < end; j++) {
      const sample = samples[j]!;
      if (sample > peak) peak = sample;
      if (sample < trough) trough = sample;
      sumSquares += sample * sample;
    }
    
    peaks[i] = peak;
    troughs[i] = trough;
    rms[i] = Math.sqrt(sumSquares / (end - start));
  }
  
  return {
    peaks,
    troughs,
    rms,
    samplesPerSegment,
    totalSamples,
    duration: totalSamples / sampleRate,
  };
}

/**
 * Calculate sample statistics.
 */
export function calculateSampleStats(
  samples: Float32Array,
  sampleRate: number
): SampleStats {
  let peak = 0;
  let sumSquares = 0;
  let sum = 0;
  let zeroCrossings = 0;
  let prevSample = 0;
  
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i]!;
    const absSample = Math.abs(sample);
    
    if (absSample > peak) peak = absSample;
    sumSquares += sample * sample;
    sum += sample;
    
    // Zero crossing detection
    if (i > 0 && ((prevSample >= 0 && sample < 0) || (prevSample < 0 && sample >= 0))) {
      zeroCrossings++;
    }
    prevSample = sample;
  }
  
  const rms = Math.sqrt(sumSquares / samples.length);
  const dcOffset = sum / samples.length;
  const zeroCrossingRate = zeroCrossings / (samples.length / sampleRate);
  
  // Approximate LUFS (simplified K-weighting)
  const lufs = 20 * Math.log10(rms) - 0.691; // Simplified approximation
  
  return {
    peak,
    rms,
    lufs,
    dcOffset,
    zeroCrossingRate,
    duration: samples.length / sampleRate,
    sampleCount: samples.length,
    sampleRate,
  };
}

// ============================================================================
// ZERO-CROSSING DETECTION
// ============================================================================

/**
 * Find zero crossings in the sample.
 */
export function findZeroCrossings(
  samples: Float32Array,
  startSample: number = 0,
  endSample?: number
): number[] {
  const end = endSample ?? samples.length;
  const crossings: number[] = [];
  
  for (let i = startSample + 1; i < end; i++) {
    const prev = samples[i - 1]!;
    const curr = samples[i]!;
    
    // Positive to negative or negative to positive crossing
    if ((prev >= 0 && curr < 0) || (prev < 0 && curr >= 0)) {
      // Check if crossing is near actual zero
      if (Math.abs(prev) < ZERO_CROSSING_THRESHOLD || Math.abs(curr) < ZERO_CROSSING_THRESHOLD) {
        crossings.push(i);
      }
    }
  }
  
  return crossings;
}

/**
 * Find nearest zero crossing to a given position.
 */
export function findNearestZeroCrossing(
  samples: Float32Array,
  position: number,
  searchRadius: number = 100
): number {
  const start = Math.max(0, position - searchRadius);
  const end = Math.min(samples.length - 1, position + searchRadius);
  
  let nearest = position;
  let minDistance = Infinity;
  
  for (let i = start + 1; i < end; i++) {
    const prev = samples[i - 1]!;
    const curr = samples[i]!;
    
    if ((prev >= 0 && curr < 0) || (prev < 0 && curr >= 0)) {
      const distance = Math.abs(i - position);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = i;
      }
    }
  }
  
  return nearest;
}

// ============================================================================
// LOOP DETECTION
// ============================================================================

/**
 * Find suggested loop points for a sample.
 */
export function findLoopPoints(
  samples: Float32Array,
  sampleRate: number,
  options: {
    minLoopLength?: number;
    maxLoopLength?: number;
    preferZeroCrossing?: boolean;
    numSuggestions?: number;
  } = {}
): LoopSuggestion[] {
  const {
    minLoopLength = Math.floor(sampleRate * 0.1), // 100ms min
    maxLoopLength = Math.floor(samples.length * 0.9),
    preferZeroCrossing = true,
    numSuggestions = 5,
  } = options;
  
  const suggestions: LoopSuggestion[] = [];
  
  // Find zero crossings for potential loop points
  if (preferZeroCrossing) {
    findZeroCrossings(samples); // Called for side effect of zero-crossing detection
  }
  
  // Use autocorrelation to find good loop lengths
  const windowSize = Math.min(2048, Math.floor(samples.length / 4));
  const correlations: { position: number; correlation: number }[] = [];
  
  // Analyze the sustain portion (middle 50% of sample)
  const sustainStart = Math.floor(samples.length * 0.25);
  const sustainEnd = Math.floor(samples.length * 0.75);
  
  for (let lag = minLoopLength; lag < maxLoopLength; lag += 16) {
    let correlation = 0;
    let count = 0;
    
    for (let i = sustainStart; i < Math.min(sustainStart + windowSize, sustainEnd - lag); i++) {
      correlation += samples[i]! * samples[i + lag]!;
      count++;
    }
    
    if (count > 0) {
      correlation /= count;
      correlations.push({ position: lag, correlation });
    }
  }
  
  // Sort by correlation
  correlations.sort((a, b) => b.correlation - a.correlation);
  
  // Take top candidates
  for (const candidate of correlations.slice(0, numSuggestions * 2)) {
    let loopEnd = sustainStart + candidate.position;
    let loopStart = sustainStart;
    
    // Snap to zero crossings if preferred
    if (preferZeroCrossing) {
      loopStart = findNearestZeroCrossing(samples, loopStart, 200);
      loopEnd = findNearestZeroCrossing(samples, loopEnd, 200);
    }
    
    // Validate loop
    if (loopEnd - loopStart >= MIN_LOOP_LENGTH && loopEnd < samples.length) {
      suggestions.push({
        start: loopStart,
        end: loopEnd,
        quality: Math.max(0, Math.min(1, candidate.correlation)),
        isZeroCrossing: preferZeroCrossing,
      });
    }
    
    if (suggestions.length >= numSuggestions) break;
  }
  
  return suggestions;
}

/**
 * Calculate crossfade samples for smooth looping.
 */
export function calculateLoopCrossfade(
  samples: Float32Array,
  loopStart: number,
  loopEnd: number,
  crossfadeSamples: number
): Float32Array {
  const loopLength = loopEnd - loopStart;
  const result = new Float32Array(loopLength);
  const fadeLength = Math.min(crossfadeSamples, Math.floor(loopLength / 2));
  
  // Copy loop region
  for (let i = 0; i < loopLength; i++) {
    result[i] = samples[loopStart + i]!;
  }
  
  // Apply crossfade at loop point
  for (let i = 0; i < fadeLength; i++) {
    const fadeIn = i / fadeLength;
    const fadeOut = 1 - fadeIn;
    
    // Blend end with beginning
    const endIdx = loopLength - fadeLength + i;
    
    result[endIdx] = samples[loopEnd - fadeLength + i]! * fadeOut + samples[loopStart + i]! * fadeIn;
  }
  
  return result;
}

// ============================================================================
// TRANSIENT DETECTION
// ============================================================================

/**
 * Detect transients/onsets in the sample.
 */
export function detectTransients(
  samples: Float32Array,
  sampleRate: number,
  options: {
    sensitivity?: number;
    minInterval?: number;
    hopSize?: number;
  } = {}
): TransientInfo[] {
  const {
    sensitivity = 0.5,
    minInterval = 0.05, // 50ms minimum between transients
    hopSize = 256,
  } = options;
  
  const transients: TransientInfo[] = [];
  const minIntervalSamples = Math.floor(minInterval * sampleRate);
  const threshold = ONSET_THRESHOLD * (1 - sensitivity);
  
  // Calculate energy envelope
  const numFrames = Math.floor(samples.length / hopSize);
  const energy = new Float32Array(numFrames);
  
  for (let i = 0; i < numFrames; i++) {
    let sum = 0;
    const start = i * hopSize;
    const end = Math.min(start + hopSize, samples.length);
    
    for (let j = start; j < end; j++) {
      sum += samples[j]! * samples[j]!;
    }
    energy[i] = Math.sqrt(sum / hopSize);
  }
  
  // Detect onsets as positive energy changes
  let lastTransient = -minIntervalSamples;
  
  for (let i = 1; i < numFrames; i++) {
    const diff = energy[i]! - energy[i - 1]!;
    const position = i * hopSize;
    
    if (diff > threshold && (position - lastTransient) >= minIntervalSamples) {
      transients.push({
        position,
        strength: Math.min(1, diff / 0.5),
        time: position / sampleRate,
      });
      lastTransient = position;
    }
  }
  
  return transients;
}

/**
 * Create slice regions from transients.
 */
export function createSlicesFromTransients(
  samples: Float32Array,
  sampleRate: number,
  transients: readonly TransientInfo[],
  startNote: number = 36 // C2 for drum kit
): SliceRegion[] {
  const slices: SliceRegion[] = [];
  
  for (let i = 0; i < transients.length; i++) {
    const start = transients[i]!.position;
    const end = i < transients.length - 1 
      ? transients[i + 1]!.position 
      : samples.length;
    
    slices.push({
      id: `slice-${i}`,
      start,
      end,
      suggestedNote: startNote + i,
      duration: (end - start) / sampleRate,
    });
  }
  
  return slices;
}

// ============================================================================
// SAMPLE EDITING OPERATIONS
// ============================================================================

/**
 * Normalize sample to target level.
 */
export function normalizeSample(
  samples: Float32Array,
  mode: NormalizeMode = 'peak',
  targetDb: number = 0
): Float32Array {
  const result = new Float32Array(samples.length);
  const stats = calculateSampleStats(samples, 44100);
  
  let currentLevel: number;
  switch (mode) {
    case 'peak':
      currentLevel = stats.peak;
      break;
    case 'rms':
      currentLevel = stats.rms;
      break;
    case 'lufs':
      currentLevel = Math.pow(10, stats.lufs / 20);
      break;
  }
  
  const targetLinear = Math.pow(10, targetDb / 20);
  const gain = currentLevel > 0 ? targetLinear / currentLevel : 1;
  
  for (let i = 0; i < samples.length; i++) {
    result[i] = Math.max(-1, Math.min(1, samples[i]! * gain));
  }
  
  return result;
}

/**
 * Remove DC offset from sample.
 */
export function removeDcOffset(samples: Float32Array): Float32Array {
  const result = new Float32Array(samples.length);
  
  // Calculate DC offset
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i]!;
  }
  const dcOffset = sum / samples.length;
  
  // Remove offset
  for (let i = 0; i < samples.length; i++) {
    result[i] = samples[i]! - dcOffset;
  }
  
  return result;
}

/**
 * Apply fade to sample.
 */
export function applyFade(
  samples: Float32Array,
  fadeInSamples: number,
  fadeOutSamples: number,
  curve: FadeCurve = 'linear'
): Float32Array {
  const result = new Float32Array(samples);
  
  // Calculate curve function
  const getCurveFactor = (t: number, isIn: boolean): number => {
    switch (curve) {
      case 'linear':
        return t;
      case 'exponential':
        return isIn ? t * t : Math.sqrt(t);
      case 'logarithmic':
        return isIn ? Math.sqrt(t) : t * t;
      case 's-curve':
        return t * t * (3 - 2 * t);
    }
  };
  
  // Apply fade in
  for (let i = 0; i < fadeInSamples && i < samples.length; i++) {
    const t = i / fadeInSamples;
    result[i] = result[i]! * getCurveFactor(t, true);
  }
  
  // Apply fade out
  for (let i = 0; i < fadeOutSamples && i < samples.length; i++) {
    const idx = samples.length - 1 - i;
    const t = i / fadeOutSamples;
    result[idx] = result[idx]! * getCurveFactor(t, false);
  }
  
  return result;
}

/**
 * Reverse sample.
 */
export function reverseSample(samples: Float32Array): Float32Array {
  const result = new Float32Array(samples.length);
  
  for (let i = 0; i < samples.length; i++) {
    result[i] = samples[samples.length - 1 - i]!;
  }
  
  return result;
}

/**
 * Trim silence from start and end of sample.
 */
export function trimSilence(
  samples: Float32Array,
  threshold: number = SILENCE_THRESHOLD
): { samples: Float32Array; trimStart: number; trimEnd: number } {
  let start = 0;
  let end = samples.length;
  
  // Find first non-silent sample
  while (start < samples.length && Math.abs(samples[start]!) < threshold) {
    start++;
  }
  
  // Find last non-silent sample
  while (end > start && Math.abs(samples[end - 1]!) < threshold) {
    end--;
  }
  
  // Snap to zero crossings
  start = findNearestZeroCrossing(samples, start, 100);
  end = findNearestZeroCrossing(samples, end, 100);
  
  const result = samples.slice(start, end);
  
  return {
    samples: result,
    trimStart: start,
    trimEnd: samples.length - end,
  };
}

/**
 * Crop sample to specified range.
 */
export function cropSample(
  samples: Float32Array,
  startSample: number,
  endSample: number,
  snapToZeroCrossing: boolean = true
): Float32Array {
  let start = Math.max(0, startSample);
  let end = Math.min(samples.length, endSample);
  
  if (snapToZeroCrossing) {
    start = findNearestZeroCrossing(samples, start, 50);
    end = findNearestZeroCrossing(samples, end, 50);
  }
  
  return samples.slice(start, end);
}

/**
 * Apply gain to sample.
 */
export function applyGain(samples: Float32Array, gainDb: number): Float32Array {
  const result = new Float32Array(samples.length);
  const gainLinear = Math.pow(10, gainDb / 20);
  
  for (let i = 0; i < samples.length; i++) {
    result[i] = Math.max(-1, Math.min(1, samples[i]! * gainLinear));
  }
  
  return result;
}

// ============================================================================
// SAMPLE PITCH SHIFTING (Basic)
// ============================================================================

/**
 * Simple pitch shift by resampling (no time stretch).
 * For high-quality pitch shifting, use a proper algorithm like WSOLA or phase vocoder.
 */
export function pitchShiftByResampling(
  samples: Float32Array,
  semitones: number
): Float32Array {
  const ratio = Math.pow(2, semitones / 12);
  const newLength = Math.floor(samples.length / ratio);
  const result = new Float32Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
    const srcPos = i * ratio;
    const srcIdx = Math.floor(srcPos);
    const frac = srcPos - srcIdx;
    
    if (srcIdx + 1 < samples.length) {
      // Linear interpolation
      result[i] = samples[srcIdx]! * (1 - frac) + samples[srcIdx + 1]! * frac;
    } else if (srcIdx < samples.length) {
      result[i] = samples[srcIdx]!;
    }
  }
  
  return result;
}

/**
 * Simple time stretch by resampling (changes pitch).
 * For high-quality time stretching, use WSOLA or phase vocoder.
 */
export function timeStretchByResampling(
  samples: Float32Array,
  ratio: number
): Float32Array {
  const newLength = Math.floor(samples.length * ratio);
  const result = new Float32Array(newLength);
  
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
  
  return result;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Waveform analysis
  generateWaveformOverview,
  calculateSampleStats,
  
  // Zero crossing
  findZeroCrossings,
  findNearestZeroCrossing,
  
  // Loop detection
  findLoopPoints,
  calculateLoopCrossfade,
  
  // Transient detection
  detectTransients,
  createSlicesFromTransients,
  
  // Sample operations
  normalizeSample,
  removeDcOffset,
  applyFade,
  reverseSample,
  trimSilence,
  cropSample,
  applyGain,
  
  // Pitch/time
  pitchShiftByResampling,
  timeStretchByResampling,
};
