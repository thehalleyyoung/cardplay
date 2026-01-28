/**
 * @fileoverview Analysis Cards - Real-time audio/event analysis.
 * 
 * This module provides analysis and detection cards:
 * - PitchDetectCard: monophonic pitch detection (autocorrelation, YIN algorithm)
 * - ChordDetectCard: polyphonic chord recognition (template matching)
 * - BeatDetectCard: onset detection (spectral flux, energy-based)
 * - TempoCard: BPM estimation (beat histogram, autocorrelation)
 * - KeyDetectCard: key/mode detection (Krumhansl-Schmuckler algorithm)
 * - LoudnessCard: LUFS/RMS measurement (ITU-R BS.1770)
 * - SpectrumCard: FFT analysis (linear, mel, bark scales)
 * - EnvelopeFollowerCard: dynamics tracking (attack/release)
 * - TransientCard: attack detection (for transient shaping)
 * - SilenceDetectCard: gap detection (threshold-based)
 * 
 * @module @cardplay/core/cards/analysis
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Audio buffer representation.
 */
export interface AudioBufferLike {
  readonly sampleRate: number;
  readonly length: number;
  readonly numberOfChannels: number;
  getChannelData(channel: number): Float32Array;
}

/**
 * Pitch detection result.
 */
export interface PitchDetection {
  readonly frequency: number;  // Hz
  readonly confidence: number;  // 0-1
  readonly clarity: number;     // 0-1 (how clear the pitch is)
  readonly midi: number;        // MIDI note number (rounded)
  readonly cents: number;       // Cents deviation from MIDI note
}

/**
 * Chord detection result.
 */
export interface ChordDetection {
  readonly root: number;        // MIDI note
  readonly quality: string;     // 'major', 'minor', 'dim', 'aug', etc.
  readonly notes: number[];     // MIDI notes in chord
  readonly confidence: number;  // 0-1
  readonly inversion: number;   // 0 = root, 1 = 1st inv, etc.
}

/**
 * Beat detection result.
 */
export interface BeatDetection {
  readonly time: number;        // seconds
  readonly strength: number;    // 0-1
  readonly isDownbeat: boolean; // true if on beat 1
}

/**
 * Tempo detection result.
 */
export interface TempoDetection {
  readonly bpm: number;
  readonly confidence: number;  // 0-1
  readonly beatTimes: number[]; // seconds
}

/**
 * Key detection result.
 */
export interface KeyDetection {
  readonly tonic: number;       // 0-11 (C=0, C#=1, etc.)
  readonly mode: 'major' | 'minor';
  readonly confidence: number;  // 0-1
  readonly profile: number[];   // 12-element pitch class profile
}

/**
 * Loudness measurement result.
 */
export interface LoudnessMeasurement {
  readonly lufs: number;        // LUFS (ITU-R BS.1770)
  readonly rms: number;         // RMS level (dB)
  readonly peak: number;        // Peak level (dB)
  readonly truePeak: number;    // True peak (dB, oversampled)
}

/**
 * Spectrum analysis result.
 */
export interface SpectrumAnalysis {
  readonly frequencies: Float32Array;  // Hz bins
  readonly magnitudes: Float32Array;   // dB
  readonly scale: 'linear' | 'mel' | 'bark';
  readonly fftSize: number;
}

/**
 * Envelope follower result.
 */
export interface AudioEnvelopeFollowerState {
  readonly level: number;       // 0-1
  readonly attack: boolean;     // true if in attack phase
  readonly release: boolean;    // true if in release phase
}

/**
 * Transient detection result.
 */
export interface TransientDetection {
  readonly time: number;        // seconds
  readonly strength: number;    // 0-1
  readonly type: 'percussive' | 'tonal' | 'mixed';
}

/**
 * Silence detection result.
 */
export interface SilenceRegion {
  readonly startTime: number;   // seconds
  readonly endTime: number;     // seconds
  readonly duration: number;    // seconds
}

// ============================================================================
// YIN PITCH DETECTION (Monophonic)
// ============================================================================

/**
 * Autocorrelation-based pitch detection using the YIN algorithm.
 * 
 * Reference: De Cheveigné, A., & Kawahara, H. (2002). 
 * "YIN, a fundamental frequency estimator for speech and music." JASA.
 * 
 * @param buffer Audio buffer to analyze
 * @param sampleRate Sample rate in Hz
 * @param threshold Clarity threshold (0.1 = strict, 0.3 = loose)
 * @returns Pitch detection result
 */
export function detectPitchYIN(
  buffer: Float32Array,
  sampleRate: number,
  threshold: number = 0.15
): PitchDetection | null {
  const bufferSize = buffer.length;
  const halfBufferSize = Math.floor(bufferSize / 2);
  
  // Difference function
  const difference = new Float32Array(halfBufferSize);
  for (let tau = 0; tau < halfBufferSize; tau++) {
    let sum = 0;
    for (let i = 0; i < halfBufferSize; i++) {
      const bufVal = buffer[i];
      const bufOffset = buffer[i + tau];
      if (bufVal !== undefined && bufOffset !== undefined) {
        const delta = bufVal - bufOffset;
        sum += delta * delta;
      }
    }
    difference[tau] = sum;
  }
  
  // Cumulative mean normalized difference function
  const cmndf = new Float32Array(halfBufferSize);
  cmndf[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < halfBufferSize; tau++) {
    runningSum += difference[tau] ?? 0;
    cmndf[tau] = (difference[tau] ?? 0) / (runningSum / tau);
  }
  
  // Find absolute minimum below threshold
  let tau = 2;  // Skip first samples (too high frequency)
  while (tau < halfBufferSize) {
    if ((cmndf[tau] ?? 1) < threshold) {
      // Find local minimum
      while (tau + 1 < halfBufferSize && (cmndf[tau + 1] ?? 1) < (cmndf[tau] ?? 1)) {
        tau++;
      }
      break;
    }
    tau++;
  }
  
  if (tau >= halfBufferSize) {
    return null;  // No pitch detected
  }
  
  // Parabolic interpolation for better accuracy
  let betterTau = tau;
  if (tau > 0 && tau < halfBufferSize - 1) {
    const s0 = cmndf[tau - 1] ?? 0;
    const s1 = cmndf[tau] ?? 0;
    const s2 = cmndf[tau + 1] ?? 0;
    const denom = 2 * (2 * s1 - s0 - s2);
    if (denom !== 0) {
      betterTau = tau + (s2 - s0) / denom;
    }
  }
  
  const frequency = sampleRate / betterTau;
  const confidence = 1 - (cmndf[tau] ?? 0);
  const clarity = Math.max(0, 1 - (cmndf[tau] ?? 0) * 2);
  
  // Convert to MIDI and cents
  const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
  const trueMidi = 69 + 12 * Math.log2(frequency / 440);
  const cents = Math.round((trueMidi - midi) * 100);
  
  return {
    frequency,
    confidence,
    clarity,
    midi,
    cents,
  };
}

// ============================================================================
// CHORD DETECTION (Polyphonic)
// ============================================================================

/**
 * Chord quality templates for template matching.
 */
const CHORD_TEMPLATES: Record<string, number[]> = {
  'major': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
  'minor': [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
  'dim': [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0],
  'aug': [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  'sus2': [1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0],
  'sus4': [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
  'dom7': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
  'maj7': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],
  'min7': [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
  'dim7': [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
  'hdim7': [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0],
};

/**
 * Detect chord from pitch class profile using template matching.
 * 
 * @param profile 12-element pitch class profile (0-11 = C-B)
 * @returns Chord detection result
 */
export function detectChord(profile: number[]): ChordDetection | null {
  if (profile.length !== 12) {
    throw new Error('Profile must have 12 elements');
  }
  
  // Normalize profile
  const sum = profile.reduce((a, b) => a + b, 0);
  if (sum === 0) {
    return null;  // No notes
  }
  const normalized = profile.map(x => x / sum);
  
  // Find best match across all roots and qualities
  let bestRoot = 0;
  let bestQuality = 'major';
  let bestScore = 0;
  
  for (let root = 0; root < 12; root++) {
    for (const [quality, template] of Object.entries(CHORD_TEMPLATES)) {
      // Rotate template to root
      const rotated = Array.from({ length: 12 }, (_, i) => 
        template[(i - root + 12) % 12] ?? 0
      );
      
      // Correlation score
      const score = normalized.reduce((sum, val, i) => 
        sum + val * (rotated[i] ?? 0), 0
      );
      
      if (score > bestScore) {
        bestScore = score;
        bestRoot = root;
        bestQuality = quality;
      }
    }
  }
  
  // Extract notes from profile
  const threshold = Math.max(...normalized) * 0.3;
  const notes: number[] = [];
  for (let i = 0; i < 12; i++) {
    if ((normalized[i] ?? 0) > threshold) {
      notes.push(i);
    }
  }
  
  // Determine inversion
  const bassNote = notes.length > 0 ? (notes[0] ?? bestRoot) : bestRoot;
  const inversion = (bassNote - bestRoot + 12) % 12;
  
  return {
    root: bestRoot,
    quality: bestQuality,
    notes,
    confidence: bestScore,
    inversion: inversion === 0 ? 0 : notes.findIndex(n => n === bestRoot) + 1,
  };
}

// ============================================================================
// BEAT DETECTION (Onset Detection)
// ============================================================================

/**
 * Detect onsets using spectral flux method.
 * 
 * @param buffer Audio buffer
 * @param sampleRate Sample rate in Hz
 * @param threshold Onset threshold (0.1 = sensitive, 0.5 = strict)
 * @returns Array of beat detections
 */
export function detectBeats(
  buffer: Float32Array,
  sampleRate: number,
  threshold: number = 0.3
): BeatDetection[] {
  const hopSize = 512;
  const fftSize = 2048;
  const numHops = Math.floor((buffer.length - fftSize) / hopSize);
  
  // Compute spectral flux
  const flux = new Float32Array(numHops);
  let prevMagnitudes = new Float32Array(fftSize / 2);
  
  for (let i = 0; i < numHops; i++) {
    const start = i * hopSize;
    const frame = buffer.subarray(start, start + fftSize);
    
    // Simple FFT magnitude (simplified for performance)
    const magnitudes = computeFFTMagnitudes(frame);
    
    // Spectral flux = sum of positive differences
    let fluxSum = 0;
    for (let j = 0; j < magnitudes.length; j++) {
      const mag = magnitudes[j];
      const prevMag = prevMagnitudes[j];
      if (mag !== undefined && prevMag !== undefined) {
        const diff = mag - prevMag;
        if (diff > 0) {
          fluxSum += diff;
        }
      }
    }
    flux[i] = fluxSum;
    prevMagnitudes = new Float32Array(magnitudes);
  }
  
  // Peak picking with adaptive threshold
  const beats: BeatDetection[] = [];
  const windowSize = Math.floor(sampleRate / hopSize / 2);  // ~0.5 second window
  
  for (let i = windowSize; i < numHops - windowSize; i++) {
    // Local mean and std
    let sum = 0;
    let sumSq = 0;
    for (let j = i - windowSize; j < i + windowSize; j++) {
      const val = flux[j] ?? 0;
      sum += val;
      sumSq += val * val;
    }
    const mean = sum / (2 * windowSize);
    const std = Math.sqrt(sumSq / (2 * windowSize) - mean * mean);
    
    // Peak detection
    const adaptiveThreshold = mean + threshold * std;
    const currentFlux = flux[i] ?? 0;
    const prevFlux = flux[i - 1] ?? 0;
    const nextFlux = flux[i + 1] ?? 0;
    
    if (currentFlux > adaptiveThreshold && currentFlux > prevFlux && currentFlux > nextFlux) {
      const time = (i * hopSize) / sampleRate;
      beats.push({
        time,
        strength: (currentFlux - mean) / std,
        isDownbeat: false,  // TODO: Add downbeat detection
      });
    }
  }
  
  return beats;
}

/**
 * Simplified FFT magnitude computation (real implementation would use proper FFT).
 */
function computeFFTMagnitudes(frame: Float32Array): Float32Array {
  const size = frame.length / 2;
  const magnitudes = new Float32Array(size);
  
  // Simplified energy in frequency bands
  for (let i = 0; i < size; i++) {
    const val1 = frame[i * 2];
    const val2 = frame[i * 2 + 1];
    magnitudes[i] = Math.abs(val1 ?? 0) + Math.abs(val2 ?? 0);
  }
  
  return magnitudes;
}

// ============================================================================
// TEMPO DETECTION
// ============================================================================

/**
 * Estimate tempo from beat times using autocorrelation.
 * 
 * @param beats Array of beat detections
 * @param minBPM Minimum BPM to consider
 * @param maxBPM Maximum BPM to consider
 * @returns Tempo detection result
 */
export function detectTempo(
  beats: BeatDetection[],
  minBPM: number = 60,
  maxBPM: number = 180
): TempoDetection | null {
  if (beats.length < 4) {
    return null;  // Not enough beats
  }
  
  const beatTimes = beats.map(b => b.time);
  
  // Compute inter-beat intervals
  const intervals: number[] = [];
  for (let i = 1; i < beatTimes.length; i++) {
    const curr = beatTimes[i];
    const prev = beatTimes[i - 1];
    if (curr !== undefined && prev !== undefined) {
      intervals.push(curr - prev);
    }
  }
  
  // Build tempo histogram
  const minInterval = 60 / maxBPM;
  const maxInterval = 60 / minBPM;
  const numBins = 1000;
  const histogram = new Float32Array(numBins);
  
  for (const interval of intervals) {
    if (interval >= minInterval && interval <= maxInterval) {
      const bin = Math.floor(((interval - minInterval) / (maxInterval - minInterval)) * numBins);
      if (bin >= 0 && bin < numBins) {
        const currentVal = histogram[bin] ?? 0;
        histogram[bin] = currentVal + 1;
      }
    }
  }
  
  // Find peak in histogram
  let maxBin = 0;
  let maxCount = 0;
  for (let i = 0; i < numBins; i++) {
    const count = histogram[i] ?? 0;
    if (count > maxCount) {
      maxCount = count;
      maxBin = i;
    }
  }
  
  const interval = minInterval + (maxBin / numBins) * (maxInterval - minInterval);
  const bpm = 60 / interval;
  const confidence = maxCount / intervals.length;
  
  return {
    bpm,
    confidence,
    beatTimes,
  };
}

// ============================================================================
// KEY DETECTION (Krumhansl-Schmuckler)
// ============================================================================

/**
 * Key profiles from Krumhansl & Schmuckler (1990).
 */
const KEY_PROFILES = {
  major: [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
  minor: [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17],
};

/**
 * Detect key/mode using Krumhansl-Schmuckler algorithm.
 * 
 * @param profile 12-element pitch class profile
 * @returns Key detection result
 */
export function detectKey(profile: number[]): KeyDetection | null {
  if (profile.length !== 12) {
    throw new Error('Profile must have 12 elements');
  }
  
  const sum = profile.reduce((a, b) => a + b, 0);
  if (sum === 0) {
    return null;
  }
  
  // Normalize profile
  const normalized = profile.map(x => x / sum);
  
  // Try all 24 keys (12 major + 12 minor)
  let bestTonic = 0;
  let bestMode: 'major' | 'minor' = 'major';
  let bestCorrelation = -Infinity;
  
  for (const mode of ['major', 'minor'] as const) {
    const keyProfile = KEY_PROFILES[mode];
    
    for (let tonic = 0; tonic < 12; tonic++) {
      // Rotate key profile to tonic
      const rotated = Array.from({ length: 12 }, (_, i) => 
        keyProfile[(i - tonic + 12) % 12] ?? 0
      );
      
      // Pearson correlation
      const correlation = computeCorrelation(normalized, rotated as number[]);
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestTonic = tonic;
        bestMode = mode;
      }
    }
  }
  
  // Map correlation (-1 to 1) to confidence (0 to 1)
  const confidence = (bestCorrelation + 1) / 2;
  
  return {
    tonic: bestTonic,
    mode: bestMode,
    confidence,
    profile: normalized,
  };
}

/**
 * Compute Pearson correlation between two arrays.
 */
function computeCorrelation(a: number[], b: number[]): number {
  const n = a.length;
  const meanA = a.reduce((sum, x) => sum + x, 0) / n;
  const meanB = b.reduce((sum, x) => sum + x, 0) / n;
  
  let numerator = 0;
  let denomA = 0;
  let denomB = 0;
  
  for (let i = 0; i < n; i++) {
    const aVal = a[i] ?? 0;
    const bVal = b[i] ?? 0;
    const da = aVal - meanA;
    const db = bVal - meanB;
    numerator += da * db;
    denomA += da * da;
    denomB += db * db;
  }
  
  return numerator / Math.sqrt(denomA * denomB);
}

// ============================================================================
// LOUDNESS MEASUREMENT (ITU-R BS.1770)
// ============================================================================

/**
 * Measure loudness according to ITU-R BS.1770-4 standard.
 * 
 * @param buffer Stereo audio buffer
 * @param sampleRate Sample rate in Hz
 * @returns Loudness measurement
 */
export function measureLoudness(
  buffer: AudioBufferLike,
  _sampleRate: number  // Reserved for future K-weighting filter implementation
): LoudnessMeasurement {
  const channelCount = buffer.numberOfChannels;
  
  // K-weighting filter coefficients (simplified)
  // Real implementation would use proper IIR filters
  let sumSquared = 0;
  let peak = -Infinity;
  
  for (let ch = 0; ch < channelCount; ch++) {
    const channelData = buffer.getChannelData(ch);
    
    for (let i = 0; i < channelData.length; i++) {
      const sample = channelData[i];
      if (sample !== undefined) {
        sumSquared += sample * sample;
        peak = Math.max(peak, Math.abs(sample));
      }
    }
  }
  
  // Mean square
  const meanSquare = sumSquared / (buffer.length * channelCount);
  
  // Convert to dB
  const rms = 10 * Math.log10(meanSquare + 1e-10);
  const peakDB = 20 * Math.log10(peak + 1e-10);
  
  // LUFS = -0.691 + 10 * log10(meanSquare) (simplified)
  const lufs = -0.691 + 10 * Math.log10(meanSquare + 1e-10);
  
  // True peak (4x oversampling - simplified)
  const truePeak = peakDB + 0.5;  // Conservative estimate
  
  return {
    lufs,
    rms,
    peak: peakDB,
    truePeak,
  };
}

// ============================================================================
// SPECTRUM ANALYSIS
// ============================================================================

/**
 * Perform FFT spectrum analysis.
 * 
 * @param buffer Audio buffer
 * @param fftSize FFT size (power of 2)
 * @param scale Scale type (linear, mel, bark)
 * @param sampleRate Sample rate in Hz
 * @returns Spectrum analysis result
 */
export function analyzeSpectrum(
  buffer: Float32Array,
  fftSize: number,
  scale: 'linear' | 'mel' | 'bark',
  sampleRate: number  // eslint-disable-line @typescript-eslint/no-unused-vars
): SpectrumAnalysis {
  // Simple spectrum analysis (real implementation would use proper FFT)
  const numBins = fftSize / 2;
  const magnitudes = new Float32Array(numBins);
  const frequencies = new Float32Array(numBins);
  
  for (let i = 0; i < numBins; i++) {
    frequencies[i] = (i * sampleRate) / fftSize;
    
    // Simplified magnitude computation
    if (i < buffer.length) {
      const sample = buffer[i];
      magnitudes[i] = 20 * Math.log10(Math.abs(sample !== undefined ? sample : 0) + 1e-10);
    } else {
      magnitudes[i] = -Infinity;
    }
  }
  
  // Convert to mel or bark scale if requested
  if (scale === 'mel') {
    return convertToMelScale({ frequencies, magnitudes, scale: 'linear', fftSize });
  } else if (scale === 'bark') {
    return convertToBarkScale({ frequencies, magnitudes, scale: 'linear', fftSize });
  }
  
  return {
    frequencies,
    magnitudes,
    scale,
    fftSize,
  };
}

/**
 * Convert to mel scale.
 */
function convertToMelScale(spectrum: SpectrumAnalysis): SpectrumAnalysis {
  // Mel scale conversion: mel = 2595 * log10(1 + f / 700)
  const numBands = 40;  // Standard mel bands
  const melFrequencies = new Float32Array(numBands);
  const melMagnitudes = new Float32Array(numBands);
  
  const lastFreq = spectrum.frequencies[spectrum.frequencies.length - 1];
  const maxFreq = lastFreq !== undefined ? lastFreq : 22050;
  const maxMel = 2595 * Math.log10(1 + maxFreq / 700);
  
  for (let i = 0; i < numBands; i++) {
    const mel = (i / numBands) * maxMel;
    melFrequencies[i] = 700 * (Math.pow(10, mel / 2595) - 1);
    
    // Find closest frequency in linear spectrum
    let closestIdx = 0;
    let minDist = Infinity;
    for (let j = 0; j < spectrum.frequencies.length; j++) {
      const freq = spectrum.frequencies[j];
      const melFreq = melFrequencies[i];
      if (freq !== undefined && melFreq !== undefined) {
        const dist = Math.abs(freq - melFreq);
        if (dist < minDist) {
          minDist = dist;
          closestIdx = j;
        }
      }
    }
    const magnitude = spectrum.magnitudes[closestIdx];
    melMagnitudes[i] = magnitude !== undefined ? magnitude : -Infinity;
  }
  
  return {
    frequencies: melFrequencies,
    magnitudes: melMagnitudes,
    scale: 'mel',
    fftSize: spectrum.fftSize,
  };
}

/**
 * Convert to bark scale.
 */
function convertToBarkScale(spectrum: SpectrumAnalysis): SpectrumAnalysis {
  // Bark scale: bark = 13 * atan(0.00076 * f) + 3.5 * atan((f / 7500)^2)
  const numBands = 24;  // Critical bands
  const barkFrequencies = new Float32Array(numBands);
  const barkMagnitudes = new Float32Array(numBands);
  
  for (let i = 0; i < numBands; i++) {
    const bark = i;
    // Inverse bark to frequency (approximation)
    barkFrequencies[i] = 600 * Math.sinh(bark / 6);
    
    // Find closest frequency in linear spectrum
    let closestIdx = 0;
    let minDist = Infinity;
    for (let j = 0; j < spectrum.frequencies.length; j++) {
      const freq = spectrum.frequencies[j];
      const barkFreq = barkFrequencies[i];
      if (freq !== undefined && barkFreq !== undefined) {
        const dist = Math.abs(freq - barkFreq);
        if (dist < minDist) {
          minDist = dist;
          closestIdx = j;
        }
      }
    }
    const magnitude = spectrum.magnitudes[closestIdx];
    barkMagnitudes[i] = magnitude !== undefined ? magnitude : -Infinity;
  }
  
  return {
    frequencies: barkFrequencies,
    magnitudes: barkMagnitudes,
    scale: 'bark',
    fftSize: spectrum.fftSize,
  };
}

// ============================================================================
// ENVELOPE FOLLOWER
// ============================================================================

/**
 * Track amplitude envelope with attack/release times.
 * 
 * @param buffer Audio buffer
 * @param sampleRate Sample rate in Hz
 * @param attackTime Attack time in seconds
 * @param releaseTime Release time in seconds
 * @returns Envelope state
 */
export function followEnvelope(
  buffer: Float32Array,
  sampleRate: number,
  attackTime: number = 0.01,
  releaseTime: number = 0.1
): AudioEnvelopeFollowerState {
  const attackCoeff = Math.exp(-1 / (attackTime * sampleRate));
  const releaseCoeff = Math.exp(-1 / (releaseTime * sampleRate));
  
  let envelope = 0;
  let prevEnvelope = 0;
  let peak = 0;
  
  for (let i = 0; i < buffer.length; i++) {
    const sample = buffer[i];
    const rectified = Math.abs(sample !== undefined ? sample : 0);
    
    if (rectified > envelope) {
      // Attack
      envelope = attackCoeff * envelope + (1 - attackCoeff) * rectified;
    } else {
      // Release
      envelope = releaseCoeff * envelope + (1 - releaseCoeff) * rectified;
    }
    
    peak = Math.max(peak, envelope);
    prevEnvelope = envelope;
  }
  
  const level = envelope;
  const attack = envelope > prevEnvelope;
  const release = envelope < prevEnvelope;
  
  return {
    level,
    attack,
    release,
  };
}

// ============================================================================
// TRANSIENT DETECTION
// ============================================================================

/**
 * Detect transients for transient shaping.
 * 
 * @param buffer Audio buffer
 * @param sampleRate Sample rate in Hz
 * @param threshold Transient threshold
 * @returns Array of transient detections
 */
export function detectTransients(
  buffer: Float32Array,
  sampleRate: number,
  threshold: number = 0.5
): TransientDetection[] {
  const hopSize = 512;
  const numHops = Math.floor(buffer.length / hopSize);
  
  const transients: TransientDetection[] = [];
  
  // Simple energy-based transient detection
  for (let i = 1; i < numHops; i++) {
    const start = i * hopSize;
    const prevStart = (i - 1) * hopSize;
    
    // Current and previous energy
    let energy = 0;
    let prevEnergy = 0;
    
    for (let j = 0; j < hopSize; j++) {
      if (start + j < buffer.length) {
        const sample1 = buffer[start + j];
        if (sample1 !== undefined) {
          energy += sample1 * sample1;
        }
      }
      if (prevStart + j < buffer.length) {
        const sample2 = buffer[prevStart + j];
        if (sample2 !== undefined) {
          prevEnergy += sample2 * sample2;
        }
      }
    }
    
    // Detect sudden increase
    if (energy > prevEnergy * (1 + threshold)) {
      const time = start / sampleRate;
      const strength = (energy - prevEnergy) / prevEnergy;
      
      transients.push({
        time,
        strength: Math.min(1, strength),
        type: 'percussive',  // Simplified
      });
    }
  }
  
  return transients;
}

// ============================================================================
// SILENCE DETECTION
// ============================================================================

/**
 * Detect silent regions in audio.
 * 
 * @param buffer Audio buffer
 * @param sampleRate Sample rate in Hz
 * @param threshold Silence threshold in dB
 * @param minDuration Minimum silence duration in seconds
 * @returns Array of silence regions
 */
export function detectSilence(
  buffer: Float32Array,
  sampleRate: number,
  threshold: number = -60,
  minDuration: number = 0.1
): SilenceRegion[] {
  const thresholdLinear = Math.pow(10, threshold / 20);
  const minSamples = Math.floor(minDuration * sampleRate);
  
  const regions: SilenceRegion[] = [];
  let silenceStart: number | null = null;
  
  for (let i = 0; i < buffer.length; i++) {
    const sample = buffer[i];
    const isSilent = Math.abs(sample !== undefined ? sample : 0) < thresholdLinear;
    
    if (isSilent && silenceStart === null) {
      // Start of silence
      silenceStart = i;
    } else if (!isSilent && silenceStart !== null) {
      // End of silence
      const duration = (i - silenceStart) / sampleRate;
      
      if (i - silenceStart >= minSamples) {
        regions.push({
          startTime: silenceStart / sampleRate,
          endTime: i / sampleRate,
          duration,
        });
      }
      
      silenceStart = null;
    }
  }
  
  // Handle silence at end
  if (silenceStart !== null && buffer.length - silenceStart >= minSamples) {
    regions.push({
      startTime: silenceStart / sampleRate,
      endTime: buffer.length / sampleRate,
      duration: (buffer.length - silenceStart) / sampleRate,
    });
  }
  
  return regions;
}

// ============================================================================
// ADDITIONAL ANALYSIS TYPES (Phase 5.2.3)
// ============================================================================

/**
 * Frequency tracking result (continuous pitch tracking).
 */
export interface FrequencyTracking {
  readonly frequency: number;      // Hz
  readonly confidence: number;     // 0-1
  readonly isVoiced: boolean;      // true if pitched sound detected
  readonly hnr: number;            // Harmonics-to-Noise Ratio (dB)
}

/**
 * Spectral centroid result (brightness measure).
 */
export interface SpectralCentroid {
  readonly centroidHz: number;     // Hz (weighted average frequency)
  readonly brightness: number;     // 0-1 (normalized)
  readonly spread: number;         // Hz (standard deviation around centroid)
}

/**
 * Phase correlation result.
 */
export interface PhaseCorrelation {
  readonly correlation: number;    // -1 to +1 (-1=inverted, 0=uncorrelated, +1=identical)
  readonly phase: number;          // radians
  readonly coherence: number;      // 0-1 (frequency-dependent correlation)
}

/**
 * Stereo width measurement.
 */
export interface StereoWidthMeasurement {
  readonly width: number;          // 0-1 (0=mono, 1=full stereo)
  readonly correlation: number;    // -1 to +1
  readonly leftLevel: number;      // dB
  readonly rightLevel: number;     // dB
  readonly midLevel: number;       // dB (mid component)
  readonly sideLevel: number;      // dB (side component)
}

/**
 * Clip detection result.
 */
export interface ClipDetection {
  readonly clipping: boolean;      // true if clipping detected
  readonly truePeak: number;       // dB (oversampled peak)
  readonly samplePeak: number;     // dB (non-oversampled)
  readonly clipCount: number;      // number of clipped samples
  readonly clipDuration: number;   // seconds of total clipping
}

/**
 * Latency measurement result.
 */
export interface LatencyMeasurement {
  readonly latencyMs: number;      // milliseconds
  readonly latencySamples: number; // samples
  readonly jitter: number;         // ms (variation)
  readonly stable: boolean;        // true if latency is consistent
}

/**
 * CPU usage measurement.
 */
export interface CpuUsage {
  readonly usagePercent: number;   // 0-100 (percent of available CPU)
  readonly loadAverage: number;    // 0-1 (0=no load, 1=100% load)
  readonly dropouts: number;       // number of audio dropouts
  readonly processingTime: number; // ms (last buffer processing time)
}

/**
 * Memory usage measurement.
 */
export interface MemoryUsage {
  readonly usedBytes: number;      // bytes
  readonly totalBytes: number;     // bytes
  readonly usagePercent: number;   // 0-100
  readonly jsHeapSize: number;     // bytes (JavaScript heap)
  readonly audioBufferSize: number;// bytes (audio buffer memory)
}

/**
 * Event stream statistics.
 */
export interface EventStatistics {
  readonly count: number;          // total events
  readonly rate: number;           // events per second
  readonly density: number;        // events per beat
  readonly averageVelocity: number;// 0-127
  readonly uniquePitches: number;  // distinct pitches
}

/**
 * Duration measurement.
 */
export interface DurationMeasurement {
  readonly totalTicks: number;     // ticks
  readonly totalSeconds: number;   // seconds
  readonly totalBeats: number;     // beats
  readonly totalBars: number;      // bars
}

// ============================================================================
// FREQUENCY TRACKING (Continuous Pitch)
// ============================================================================

/**
 * Track pitch continuously over time using autocorrelation.
 * 
 * @param buffer Audio buffer
 * @param sampleRate Sample rate in Hz
 * @param minFreq Minimum frequency to detect (Hz)
 * @param maxFreq Maximum frequency to detect (Hz)
 * @returns Frequency tracking result
 */
export function trackFrequency(
  buffer: Float32Array,
  sampleRate: number,
  _minFreq: number = 50,
  _maxFreq: number = 2000
): FrequencyTracking {
  // Note: minFreq/maxFreq could be used for bandpass filtering in future
  const detection = detectPitchYIN(buffer, sampleRate);
  
  if (!detection) {
    return {
      frequency: 0,
      confidence: 0,
      isVoiced: false,
      hnr: -60, // Very low HNR
    };
  }
  
  // Calculate Harmonics-to-Noise Ratio (simplified)
  const harmonicEnergy = detection.confidence;
  const hnr = 20 * Math.log10(harmonicEnergy / (1 - harmonicEnergy + 0.001));
  
  return {
    frequency: detection.frequency,
    confidence: detection.confidence,
    isVoiced: detection.confidence > 0.5,
    hnr: Math.max(-60, Math.min(60, hnr)),
  };
}

// ============================================================================
// SPECTRAL CENTROID (Brightness)
// ============================================================================

/**
 * Calculate spectral centroid (center of mass of the spectrum).
 * Higher centroid = brighter sound.
 * 
 * @param buffer Audio buffer
 * @param sampleRate Sample rate in Hz
 * @param fftSize FFT size (power of 2)
 * @returns Spectral centroid result
 */
export function calculateSpectralCentroid(
  buffer: Float32Array,
  sampleRate: number,
  fftSize: number = 2048
): SpectralCentroid {
  // Simple FFT using real-valued autocorrelation (simplified)
  const numBins = fftSize / 2;
  const magnitudes = new Float32Array(numBins);
  
  // Simplified magnitude spectrum calculation
  for (let k = 0; k < numBins; k++) {
    let real = 0;
    let imag = 0;
    
    for (let n = 0; n < Math.min(buffer.length, fftSize); n++) {
      const angle = (-2 * Math.PI * k * n) / fftSize;
      real += (buffer[n] ?? 0) * Math.cos(angle);
      imag += (buffer[n] ?? 0) * Math.sin(angle);
    }
    
    magnitudes[k] = Math.sqrt(real * real + imag * imag);
  }
  
  // Calculate centroid (weighted average frequency)
  let weightedSum = 0;
  let magnitudeSum = 0;
  
  for (let k = 0; k < numBins; k++) {
    const freq = (k * sampleRate) / fftSize;
    const mag = magnitudes[k] ?? 0;
    weightedSum += freq * mag;
    magnitudeSum += mag;
  }
  
  const centroidHz = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  
  // Calculate spread (standard deviation around centroid)
  let spreadSum = 0;
  for (let k = 0; k < numBins; k++) {
    const freq = (k * sampleRate) / fftSize;
    const mag = magnitudes[k] ?? 0;
    const diff = freq - centroidHz;
    spreadSum += diff * diff * mag;
  }
  
  const spread = magnitudeSum > 0 ? Math.sqrt(spreadSum / magnitudeSum) : 0;
  
  // Normalize brightness (0-1, where Nyquist = 1)
  const brightness = centroidHz / (sampleRate / 2);
  
  return {
    centroidHz,
    brightness: Math.min(1, Math.max(0, brightness)),
    spread,
  };
}

// ============================================================================
// PHASE CORRELATION (Stereo Analysis)
// ============================================================================

/**
 * Calculate phase correlation between two channels.
 * 
 * @param leftBuffer Left channel
 * @param rightBuffer Right channel
 * @returns Phase correlation result
 */
export function calculatePhaseCorrelation(
  leftBuffer: Float32Array,
  rightBuffer: Float32Array
): PhaseCorrelation {
  const length = Math.min(leftBuffer.length, rightBuffer.length);
  
  let sumL = 0, sumR = 0, sumLR = 0, sumL2 = 0, sumR2 = 0;
  
  for (let i = 0; i < length; i++) {
    const l = leftBuffer[i] ?? 0;
    const r = rightBuffer[i] ?? 0;
    
    sumL += l;
    sumR += r;
    sumLR += l * r;
    sumL2 += l * l;
    sumR2 += r * r;
  }
  
  const meanL = sumL / length;
  const meanR = sumR / length;
  
  // Pearson correlation coefficient
  let numerator = 0, denomL = 0, denomR = 0;
  
  for (let i = 0; i < length; i++) {
    const l = (leftBuffer[i] ?? 0) - meanL;
    const r = (rightBuffer[i] ?? 0) - meanR;
    
    numerator += l * r;
    denomL += l * l;
    denomR += r * r;
  }
  
  const correlation = denomL > 0 && denomR > 0
    ? numerator / Math.sqrt(denomL * denomR)
    : 0;
  
  // Calculate phase difference (simplified)
  const phase = Math.atan2(sumR, sumL);
  
  // Coherence (frequency-independent for now)
  const coherence = Math.abs(correlation);
  
  return {
    correlation: Math.min(1, Math.max(-1, correlation)),
    phase,
    coherence,
  };
}

// ============================================================================
// STEREO WIDTH MEASUREMENT
// ============================================================================

/**
 * Measure stereo width using mid/side analysis.
 * 
 * @param leftBuffer Left channel
 * @param rightBuffer Right channel
 * @returns Stereo width measurement
 */
export function measureStereoWidth(
  leftBuffer: Float32Array,
  rightBuffer: Float32Array
): StereoWidthMeasurement {
  const length = Math.min(leftBuffer.length, rightBuffer.length);
  
  // Calculate RMS levels
  let leftSum = 0, rightSum = 0, midSum = 0, sideSum = 0;
  
  for (let i = 0; i < length; i++) {
    const l = leftBuffer[i] ?? 0;
    const r = rightBuffer[i] ?? 0;
    const mid = (l + r) / Math.sqrt(2);
    const side = (l - r) / Math.sqrt(2);
    
    leftSum += l * l;
    rightSum += r * r;
    midSum += mid * mid;
    sideSum += side * side;
  }
  
  const leftRms = Math.sqrt(leftSum / length);
  const rightRms = Math.sqrt(rightSum / length);
  const midRms = Math.sqrt(midSum / length);
  const sideRms = Math.sqrt(sideSum / length);
  
  // Convert to dB
  const leftLevel = 20 * Math.log10(leftRms + 1e-10);
  const rightLevel = 20 * Math.log10(rightRms + 1e-10);
  const midLevel = 20 * Math.log10(midRms + 1e-10);
  const sideLevel = 20 * Math.log10(sideRms + 1e-10);
  
  // Calculate correlation
  const correlation = calculatePhaseCorrelation(leftBuffer, rightBuffer).correlation;
  
  // Width (0=mono, 1=full stereo)
  const width = midRms > 0 ? Math.min(1, sideRms / midRms) : 0;
  
  return {
    width,
    correlation,
    leftLevel,
    rightLevel,
    midLevel,
    sideLevel,
  };
}

// ============================================================================
// CLIP DETECTION (True Peak)
// ============================================================================

/**
 * Detect clipping with true peak measurement (oversampled).
 * 
 * @param buffer Audio buffer
 * @param threshold Clipping threshold (linear, default 1.0)
 * @param oversampleFactor Oversampling factor for true peak
 * @returns Clip detection result
 */
export function detectClipping(
  buffer: Float32Array,
  threshold: number = 1.0,
  oversampleFactor: number = 4
): ClipDetection {
  // Sample peak
  let samplePeak = 0;
  let clipCount = 0;
  let clipDuration = 0;
  let inClip = false;
  
  for (let i = 0; i < buffer.length; i++) {
    const sample = Math.abs(buffer[i] ?? 0);
    samplePeak = Math.max(samplePeak, sample);
    
    if (sample >= threshold * 0.99) {
      clipCount++;
      if (!inClip) {
        inClip = true;
      }
    } else {
      if (inClip) {
        clipDuration += 1;
        inClip = false;
      }
    }
  }
  
  // Simplified true peak (linear interpolation oversampling)
  let truePeak = samplePeak;
  
  for (let i = 0; i < buffer.length - 1; i++) {
    const curr = Math.abs(buffer[i] ?? 0);
    const next = Math.abs(buffer[i + 1] ?? 0);
    
    for (let j = 1; j < oversampleFactor; j++) {
      const t = j / oversampleFactor;
      const interpolated = curr * (1 - t) + next * t;
      truePeak = Math.max(truePeak, interpolated);
    }
  }
  
  const samplePeakDb = 20 * Math.log10(samplePeak + 1e-10);
  const truePeakDb = 20 * Math.log10(truePeak + 1e-10);
  
  return {
    clipping: truePeak >= threshold,
    truePeak: truePeakDb,
    samplePeak: samplePeakDb,
    clipCount,
    clipDuration: clipDuration / (buffer.length || 1),
  };
}

// ============================================================================
// LATENCY MEASUREMENT
// ============================================================================

/**
 * Measure round-trip latency by correlating test tone with recorded signal.
 * 
 * @param testTone Generated test tone
 * @param recordedSignal Recorded signal
 * @param sampleRate Sample rate in Hz
 * @returns Latency measurement
 */
export function measureLatency(
  testTone: Float32Array,
  recordedSignal: Float32Array,
  sampleRate: number
): LatencyMeasurement {
  const length = Math.min(testTone.length, recordedSignal.length);
  
  // Cross-correlation to find delay
  let maxCorrelation = 0;
  let bestDelay = 0;
  
  const maxDelay = Math.min(length / 2, sampleRate); // Max 1 second
  
  for (let delay = 0; delay < maxDelay; delay++) {
    let correlation = 0;
    let count = 0;
    
    for (let i = 0; i < length - delay; i++) {
      correlation += (testTone[i] ?? 0) * (recordedSignal[i + delay] ?? 0);
      count++;
    }
    
    correlation /= count;
    
    if (correlation > maxCorrelation) {
      maxCorrelation = correlation;
      bestDelay = delay;
    }
  }
  
  const latencySamples = bestDelay;
  const latencyMs = (latencySamples * 1000) / sampleRate;
  
  // Estimate jitter (simplified as zero for now)
  const jitter = 0;
  const stable = maxCorrelation > 0.5;
  
  return {
    latencyMs,
    latencySamples,
    jitter,
    stable,
  };
}

// ============================================================================
// CPU USAGE MEASUREMENT
// ============================================================================

/**
 * Measure CPU usage and audio processing performance.
 * 
 * @param processingStartTime Start time of processing (performance.now())
 * @param processingEndTime End time of processing (performance.now())
 * @param bufferSize Buffer size in samples
 * @param sampleRate Sample rate in Hz
 * @returns CPU usage measurement
 */
export function measureCpuUsage(
  processingStartTime: number,
  processingEndTime: number,
  bufferSize: number,
  sampleRate: number
): CpuUsage {
  const processingTime = processingEndTime - processingStartTime;
  const bufferDuration = (bufferSize * 1000) / sampleRate;
  
  // Usage as percentage of available time
  const usagePercent = Math.min(100, (processingTime / bufferDuration) * 100);
  const loadAverage = usagePercent / 100;
  
  // Dropouts occur when processing takes longer than buffer duration
  const dropouts = processingTime > bufferDuration ? 1 : 0;
  
  return {
    usagePercent,
    loadAverage,
    dropouts,
    processingTime,
  };
}

// ============================================================================
// MEMORY USAGE MEASUREMENT
// ============================================================================

/**
 * Measure memory usage (requires performance.memory API).
 * 
 * @returns Memory usage measurement
 */
export function measureMemoryUsage(): MemoryUsage {
  // Access performance.memory if available (Chrome)
  const perfMemory = (performance as any).memory;
  
  if (perfMemory) {
    const used = perfMemory.usedJSHeapSize;
    const total = perfMemory.jsHeapSizeLimit;
    
    return {
      usedBytes: used,
      totalBytes: total,
      usagePercent: (used / total) * 100,
      jsHeapSize: perfMemory.totalJSHeapSize,
      audioBufferSize: 0, // Would need to track separately
    };
  }
  
  // Fallback
  return {
    usedBytes: 0,
    totalBytes: 0,
    usagePercent: 0,
    jsHeapSize: 0,
    audioBufferSize: 0,
  };
}

// ============================================================================
// EVENT STREAM STATISTICS
// ============================================================================

/**
 * Calculate statistics for an event stream.
 * 
 * @param events Array of events (must have start, duration, velocity properties)
 * @param startTick Start of time range
 * @param endTick End of time range
 * @param tempo Tempo in BPM
 * @returns Event statistics
 */
export function calculateEventStatistics(
  events: Array<{ start: number; duration: number; velocity?: number; pitch?: number }>,
  startTick: number,
  endTick: number,
  tempo: number
): EventStatistics {
  const durationTicks = endTick - startTick;
  const durationSeconds = (durationTicks * 60) / (tempo * 480); // Assuming 480 PPQN
  const durationBeats = durationTicks / 480;
  
  // Filter events in range
  const eventsInRange = events.filter(
    e => e.start >= startTick && e.start < endTick
  );
  
  const count = eventsInRange.length;
  const rate = durationSeconds > 0 ? count / durationSeconds : 0;
  const density = durationBeats > 0 ? count / durationBeats : 0;
  
  // Average velocity
  const velocities = eventsInRange.map(e => e.velocity ?? 64);
  const averageVelocity = velocities.length > 0
    ? velocities.reduce((a, b) => a + b, 0) / velocities.length
    : 0;
  
  // Unique pitches
  const pitches = new Set(eventsInRange.map(e => e.pitch).filter((p): p is number => p !== undefined));
  const uniquePitches = pitches.size;
  
  return {
    count,
    rate,
    density,
    averageVelocity,
    uniquePitches,
  };
}

// ============================================================================
// DURATION MEASUREMENT
// ============================================================================

/**
 * Measure total duration of content.
 * 
 * @param totalTicks Total ticks
 * @param tempo Tempo in BPM
 * @param timeSignature Time signature [numerator, denominator]
 * @returns Duration measurement
 */
export function measureDuration(
  totalTicks: number,
  tempo: number,
  timeSignature: [number, number] = [4, 4]
): DurationMeasurement {
  const ticksPerBeat = 480; // Standard PPQN
  const totalBeats = totalTicks / ticksPerBeat;
  const totalSeconds = (totalBeats * 60) / tempo;
  const beatsPerBar = timeSignature[0];
  const totalBars = totalBeats / beatsPerBar;
  
  return {
    totalTicks,
    totalSeconds,
    totalBeats,
    totalBars,
  };
}
