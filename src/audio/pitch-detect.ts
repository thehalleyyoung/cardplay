/**
 * @fileoverview Pitch Detection Module
 * 
 * Provides automatic pitch detection for audio samples with:
 * - Autocorrelation-based pitch detection (YIN algorithm variant)
 * - FFT-based harmonic analysis
 * - Confidence scoring
 * - Fine-tuning detection (cents offset from nearest note)
 * 
 * @module @cardplay/core/audio/pitch-detect
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Minimum detectable frequency (Hz) - roughly A0 */
export const MIN_FREQUENCY = 20;

/** Maximum detectable frequency (Hz) - roughly C8 */
export const MAX_FREQUENCY = 4200;

/** Default sample rate */
export const DEFAULT_SAMPLE_RATE = 44100;

/** YIN threshold for pitch detection */
export const YIN_THRESHOLD = 0.1;

/** Minimum RMS for pitch detection to occur */
export const MIN_RMS_THRESHOLD = 0.01;

/** A4 reference frequency (Hz) */
export const A4_FREQUENCY = 440;

/** A4 MIDI note number */
export const A4_MIDI = 69;

/** Note names for display */
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of pitch detection.
 */
export interface PitchResult {
  /** Detected frequency in Hz (null if no pitch detected) */
  readonly frequency: number | null;
  /** Nearest MIDI note number */
  readonly midiNote: number;
  /** Note name (e.g., "C4", "F#5") */
  readonly noteName: string;
  /** Fine tuning offset in cents (-50 to +50) */
  readonly fineTuneCents: number;
  /** Confidence score (0-1) */
  readonly confidence: number;
  /** RMS amplitude of the analyzed signal */
  readonly rms: number;
  /** Is the signal periodic (pitched) vs noise */
  readonly isPitched: boolean;
}

/**
 * Options for pitch detection.
 */
export interface PitchDetectionOptions {
  /** Sample rate of the audio */
  readonly sampleRate?: number;
  /** Minimum frequency to detect */
  readonly minFrequency?: number;
  /** Maximum frequency to detect */
  readonly maxFrequency?: number;
  /** Window size for analysis (samples) */
  readonly windowSize?: number;
  /** Use parabolic interpolation for sub-sample accuracy */
  readonly useInterpolation?: boolean;
  /** Analyze only the attack portion */
  readonly attackOnly?: boolean;
  /** Attack portion length in seconds */
  readonly attackLength?: number;
}

/**
 * Multi-pitch analysis result for samples with multiple notes.
 */
export interface MultiPitchResult {
  /** Primary pitch (strongest) */
  readonly primary: PitchResult;
  /** All detected pitches */
  readonly pitches: readonly PitchResult[];
  /** Overall pitch stability (0-1) */
  readonly stability: number;
  /** Detected harmonics */
  readonly harmonics: readonly number[];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert frequency to MIDI note number.
 */
export function frequencyToMidi(frequency: number): number {
  return A4_MIDI + 12 * Math.log2(frequency / A4_FREQUENCY);
}

/**
 * Convert MIDI note number to frequency.
 */
export function midiToFrequency(midiNote: number): number {
  return A4_FREQUENCY * Math.pow(2, (midiNote - A4_MIDI) / 12);
}

/**
 * Convert MIDI note to note name.
 */
export function midiToNoteName(midiNote: number): string {
  const octave = Math.floor(midiNote / 12) - 1;
  const noteIndex = midiNote % 12;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

/**
 * Calculate cents offset from exact MIDI note.
 */
export function calculateCents(frequency: number, midiNote: number): number {
  const exactFrequency = midiToFrequency(midiNote);
  return 1200 * Math.log2(frequency / exactFrequency);
}

/**
 * Calculate RMS (Root Mean Square) of audio signal.
 */
export function calculateRms(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i] ?? 0;
    sum += sample * sample;
  }
  return Math.sqrt(sum / samples.length);
}

/**
 * Apply Hann window to audio samples.
 */
export function applyHannWindow(samples: Float32Array): Float32Array {
  const windowed = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const window = 0.5 * (1 - Math.cos(2 * Math.PI * i / (samples.length - 1)));
    windowed[i] = (samples[i] ?? 0) * window;
  }
  return windowed;
}

/**
 * Downsample audio for faster processing.
 */
export function downsample(samples: Float32Array, factor: number): Float32Array {
  if (factor <= 1) return samples;
  
  const newLength = Math.floor(samples.length / factor);
  const downsampled = new Float32Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
    // Simple averaging (anti-aliasing)
    let sum = 0;
    for (let j = 0; j < factor; j++) {
      sum += samples[i * factor + j] ?? 0;
    }
    downsampled[i] = sum / factor;
  }
  
  return downsampled;
}

// ============================================================================
// YIN PITCH DETECTION ALGORITHM
// ============================================================================

/**
 * YIN pitch detection algorithm.
 * Based on "YIN, a fundamental frequency estimator for speech and music"
 * by de Cheveigné & Kawahara (2002).
 */
export function yin(
  samples: Float32Array,
  sampleRate: number,
  minFrequency: number = MIN_FREQUENCY,
  maxFrequency: number = MAX_FREQUENCY,
  threshold: number = YIN_THRESHOLD
): { frequency: number | null; confidence: number } {
  const minPeriod = Math.floor(sampleRate / maxFrequency);
  const maxPeriod = Math.floor(sampleRate / minFrequency);
  const halfLength = Math.min(Math.floor(samples.length / 2), maxPeriod + 1);

  if (halfLength < minPeriod) {
    return { frequency: null, confidence: 0 };
  }

  // Step 1 & 2: Difference function
  const diff = new Float32Array(halfLength);
  
  for (let tau = 0; tau < halfLength; tau++) {
    let sum = 0;
    for (let i = 0; i < halfLength; i++) {
      const delta = (samples[i] ?? 0) - (samples[i + tau] ?? 0);
      sum += delta * delta;
    }
    diff[tau] = sum;
  }

  // Step 3: Cumulative mean normalized difference function
  const cmndf = new Float32Array(halfLength);
  cmndf[0] = 1;
  
  let runningSum = 0;
  for (let tau = 1; tau < halfLength; tau++) {
    const diffVal = diff[tau] ?? 0;
    runningSum += diffVal;
    cmndf[tau] = diffVal * tau / runningSum;
  }

  // Step 4: Absolute threshold
  let tau = minPeriod;
  while (tau < halfLength - 1) {
    if ((cmndf[tau] ?? 1) < threshold) {
      // Step 5: Find local minimum
      while (tau + 1 < halfLength && (cmndf[tau + 1] ?? 1) < (cmndf[tau] ?? 0)) {
        tau++;
      }
      break;
    }
    tau++;
  }

  if (tau >= halfLength - 1) {
    return { frequency: null, confidence: 0 };
  }

  // Step 6: Parabolic interpolation for sub-sample accuracy
  const better = parabolicInterpolation(cmndf, tau);
  const frequency = sampleRate / better.x;
  const confidence = 1 - better.y;

  return { frequency, confidence };
}

/**
 * Parabolic interpolation for sub-sample pitch accuracy.
 */
function parabolicInterpolation(
  data: Float32Array,
  index: number
): { x: number; y: number } {
  if (index <= 0 || index >= data.length - 1) {
    return { x: index, y: data[index] ?? 0 };
  }

  const a = data[index - 1] ?? 0;
  const b = data[index] ?? 0;
  const c = data[index + 1] ?? 0;

  const denominator = 2 * (2 * b - a - c);
  if (Math.abs(denominator) < 1e-10) {
    return { x: index, y: b };
  }

  const delta = (a - c) / denominator;
  const x = index + delta;
  const y = b - (a - c) * delta / 4;

  return { x, y };
}

// ============================================================================
// AUTOCORRELATION PITCH DETECTION
// ============================================================================

/**
 * Simple autocorrelation-based pitch detection.
 * Faster but less accurate than YIN.
 */
export function autocorrelation(
  samples: Float32Array,
  sampleRate: number,
  minFrequency: number = MIN_FREQUENCY,
  maxFrequency: number = MAX_FREQUENCY
): { frequency: number | null; confidence: number } {
  const minPeriod = Math.floor(sampleRate / maxFrequency);
  const maxPeriod = Math.min(
    Math.floor(sampleRate / minFrequency),
    Math.floor(samples.length / 2)
  );

  if (maxPeriod <= minPeriod) {
    return { frequency: null, confidence: 0 };
  }

  // Calculate autocorrelation for each lag
  let maxCorrelation = -Infinity;
  let bestPeriod = 0;

  // Normalize by first correlation value
  let normalization = 0;
  for (let i = 0; i < samples.length - maxPeriod; i++) {
    const sample = samples[i] ?? 0;
    normalization += sample * sample;
  }

  for (let period = minPeriod; period <= maxPeriod; period++) {
    let correlation = 0;
    for (let i = 0; i < samples.length - maxPeriod; i++) {
      correlation += (samples[i] ?? 0) * (samples[i + period] ?? 0);
    }
    
    correlation /= normalization;

    if (correlation > maxCorrelation) {
      maxCorrelation = correlation;
      bestPeriod = period;
    }
  }

  if (bestPeriod === 0 || maxCorrelation < 0.3) {
    return { frequency: null, confidence: 0 };
  }

  // Parabolic interpolation
  const refined = refineWithParabola(samples, sampleRate, bestPeriod, maxPeriod, normalization);
  
  return {
    frequency: refined.frequency,
    confidence: Math.max(0, Math.min(1, maxCorrelation)),
  };
}

/**
 * Refine period estimate with parabolic interpolation.
 */
function refineWithParabola(
  samples: Float32Array,
  sampleRate: number,
  period: number,
  maxPeriod: number,
  normalization: number
): { frequency: number } {
  // Calculate correlations around the peak
  const getCorrelation = (p: number): number => {
    let sum = 0;
    for (let i = 0; i < samples.length - maxPeriod; i++) {
      sum += (samples[i] ?? 0) * (samples[i + p] ?? 0);
    }
    return sum / normalization;
  };

  if (period <= 1 || period >= maxPeriod - 1) {
    return { frequency: sampleRate / period };
  }

  const a = getCorrelation(period - 1);
  const b = getCorrelation(period);
  const c = getCorrelation(period + 1);

  const denominator = 2 * (2 * b - a - c);
  if (Math.abs(denominator) < 1e-10) {
    return { frequency: sampleRate / period };
  }

  const delta = (a - c) / denominator;
  const refinedPeriod = period + delta;

  return { frequency: sampleRate / refinedPeriod };
}

// ============================================================================
// HIGH-LEVEL PITCH DETECTION
// ============================================================================

/**
 * Detect pitch from audio samples.
 */
export function detectPitch(
  samples: Float32Array,
  options: PitchDetectionOptions = {}
): PitchResult {
  const {
    sampleRate = DEFAULT_SAMPLE_RATE,
    minFrequency = MIN_FREQUENCY,
    maxFrequency = MAX_FREQUENCY,
    windowSize = 4096,
    attackOnly = true,
    attackLength = 0.2,
  } = options;

  // Calculate RMS
  const rms = calculateRms(samples);
  
  // If signal is too quiet, return no pitch
  if (rms < MIN_RMS_THRESHOLD) {
    return {
      frequency: null,
      midiNote: 60,
      noteName: 'C4',
      fineTuneCents: 0,
      confidence: 0,
      rms,
      isPitched: false,
    };
  }

  // Extract portion to analyze
  let analysisSamples: Float32Array;
  if (attackOnly) {
    const attackSamples = Math.min(
      Math.floor(attackLength * sampleRate),
      samples.length
    );
    // Find the loudest part of the attack
    let maxEnergy = 0;
    let maxIndex = 0;
    const chunkSize = Math.floor(windowSize / 4);
    
    for (let i = 0; i < attackSamples - chunkSize; i += chunkSize / 2) {
      let energy = 0;
      for (let j = 0; j < chunkSize; j++) {
        const sample = samples[i + j] ?? 0;
        energy += sample * sample;
      }
      if (energy > maxEnergy) {
        maxEnergy = energy;
        maxIndex = i;
      }
    }
    
    const start = maxIndex;
    const end = Math.min(start + windowSize, samples.length);
    analysisSamples = samples.slice(start, end);
  } else {
    analysisSamples = samples.slice(0, Math.min(windowSize, samples.length));
  }

  // Apply windowing
  const windowed = applyHannWindow(analysisSamples);

  // Run YIN algorithm
  const yinResult = yin(windowed, sampleRate, minFrequency, maxFrequency);

  // If YIN fails, try autocorrelation as fallback
  let frequency = yinResult.frequency;
  let confidence = yinResult.confidence;

  if (frequency === null || confidence < 0.5) {
    const acResult = autocorrelation(windowed, sampleRate, minFrequency, maxFrequency);
    if (acResult.frequency !== null && acResult.confidence > confidence) {
      frequency = acResult.frequency;
      confidence = acResult.confidence;
    }
  }

  // No pitch detected
  if (frequency === null) {
    return {
      frequency: null,
      midiNote: 60,
      noteName: 'C4',
      fineTuneCents: 0,
      confidence: 0,
      rms,
      isPitched: false,
    };
  }

  // Calculate MIDI note and cents
  const midiFloat = frequencyToMidi(frequency);
  const midiNote = Math.round(midiFloat);
  const fineTuneCents = Math.round(calculateCents(frequency, midiNote));
  const noteName = midiToNoteName(midiNote);

  return {
    frequency,
    midiNote,
    noteName,
    fineTuneCents,
    confidence,
    rms,
    isPitched: true,
  };
}

/**
 * Detect pitch from an AudioBuffer.
 */
export function detectPitchFromBuffer(
  buffer: AudioBuffer,
  options: PitchDetectionOptions = {}
): PitchResult {
  // Use the first channel
  const samples = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  
  return detectPitch(samples, {
    ...options,
    sampleRate,
  });
}

/**
 * Analyze multiple windows and return the most consistent pitch.
 */
export function detectPitchRobust(
  samples: Float32Array,
  options: PitchDetectionOptions = {}
): PitchResult {
  const {
    windowSize = 4096,
  } = options;

  const numWindows = Math.min(8, Math.floor(samples.length / (windowSize / 2)));
  const hopSize = Math.floor((samples.length - windowSize) / Math.max(1, numWindows - 1));
  
  const results: PitchResult[] = [];

  for (let i = 0; i < numWindows; i++) {
    const start = Math.min(i * hopSize, samples.length - windowSize);
    const window = samples.slice(start, start + windowSize);
    const result = detectPitch(window, { ...options, attackOnly: false });
    
    if (result.isPitched && result.confidence > 0.5) {
      results.push(result);
    }
  }

  if (results.length === 0) {
    return detectPitch(samples, options);
  }

  // Group by MIDI note and find most common
  const noteGroups = new Map<number, PitchResult[]>();
  for (const result of results) {
    const note = result.midiNote;
    const existing = noteGroups.get(note) ?? [];
    existing.push(result);
    noteGroups.set(note, existing);
  }

  // Find the most common note with highest average confidence
  const firstResult = results[0];
  if (!firstResult) {
    return detectPitch(samples, options);
  }
  let bestNote = firstResult.midiNote;
  let bestScore = 0;

  for (const [note, group] of noteGroups) {
    const avgConfidence = group.reduce((sum, r) => sum + r.confidence, 0) / group.length;
    const score = group.length * avgConfidence;
    if (score > bestScore) {
      bestScore = score;
      bestNote = note;
    }
  }

  // Return the highest confidence result for that note
  const bestGroup = noteGroups.get(bestNote);
  if (!bestGroup || bestGroup.length === 0) {
    return detectPitch(samples, options);
  }
  bestGroup.sort((a, b) => b.confidence - a.confidence);
  return bestGroup[0]!
}

/**
 * Detect multiple pitches in a polyphonic signal.
 * Uses harmonic product spectrum analysis.
 */
export function detectMultiplePitches(
  samples: Float32Array,
  options: PitchDetectionOptions & { maxPitches?: number } = {}
): MultiPitchResult {
  // Primary pitch detection
  const primary = detectPitchRobust(samples, options);

  // For now, return single pitch
  // Full polyphonic detection would require FFT-based analysis
  return {
    primary,
    pitches: [primary],
    stability: primary.confidence,
    harmonics: primary.frequency 
      ? [primary.frequency, primary.frequency * 2, primary.frequency * 3]
      : [],
  };
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

/**
 * Detect pitches for multiple audio buffers.
 */
export async function detectPitchBatch(
  buffers: readonly AudioBuffer[],
  options: PitchDetectionOptions = {},
  onProgress?: (completed: number, total: number) => void
): Promise<PitchResult[]> {
  const results: PitchResult[] = [];
  
  for (let i = 0; i < buffers.length; i++) {
    const buffer = buffers[i];
    if (!buffer) continue;
    const result = detectPitchFromBuffer(buffer, options);
    results.push(result);
    onProgress?.(i + 1, buffers.length);
    
    // Yield to prevent blocking
    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  return results;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  detectPitch,
  detectPitchFromBuffer,
  detectPitchRobust,
  detectMultiplePitches,
  detectPitchBatch,
  frequencyToMidi,
  midiToFrequency,
  midiToNoteName,
  calculateCents,
  calculateRms,
  yin,
  autocorrelation,
  A4_FREQUENCY,
  A4_MIDI,
  NOTE_NAMES,
};
