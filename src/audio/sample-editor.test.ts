/**
 * @fileoverview Tests for Sample Editor Module
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateWaveformOverview,
  calculateSampleStats,
  findZeroCrossings,
  findNearestZeroCrossing,
  findLoopPoints,
  calculateLoopCrossfade,
  detectTransients,
  createSlicesFromTransients,
  normalizeSample,
  removeDcOffset,
  applyFade,
  reverseSample,
  trimSilence,
  cropSample,
  applyGain,
  pitchShiftByResampling,
  timeStretchByResampling,
  MIN_LOOP_LENGTH,
  ZERO_CROSSING_THRESHOLD,
} from './sample-editor';

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Create a sine wave sample.
 */
function createSineWave(
  frequency: number,
  sampleRate: number,
  duration: number,
  amplitude: number = 1
): Float32Array {
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    samples[i] = amplitude * Math.sin(2 * Math.PI * frequency * t);
  }
  
  return samples;
}

/**
 * Create samples with a DC offset.
 */
function createWithDcOffset(samples: Float32Array, offset: number): Float32Array {
  const result = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    result[i] = samples[i] + offset;
  }
  return result;
}

/**
 * Create a sample with transients (drum-like).
 */
function createTransientSample(
  sampleRate: number,
  numHits: number,
  hitInterval: number
): Float32Array {
  const duration = hitInterval * (numHits + 1);
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  
  for (let hit = 0; hit < numHits; hit++) {
    const hitPosition = Math.floor((hit + 0.5) * hitInterval * sampleRate);
    const decay = Math.floor(0.1 * sampleRate);
    
    for (let i = 0; i < decay && hitPosition + i < numSamples; i++) {
      const envelope = Math.exp(-i / (decay * 0.2));
      samples[hitPosition + i] = envelope * 0.8 * Math.sin(2 * Math.PI * 200 * i / sampleRate);
    }
  }
  
  return samples;
}

/**
 * Create a sample with silence at start and end.
 */
function createWithSilence(
  samples: Float32Array,
  silenceStart: number,
  silenceEnd: number
): Float32Array {
  const result = new Float32Array(samples.length + silenceStart + silenceEnd);
  result.fill(0, 0, silenceStart);
  result.set(samples, silenceStart);
  result.fill(0, silenceStart + samples.length);
  return result;
}

// ============================================================================
// WAVEFORM ANALYSIS TESTS
// ============================================================================

describe('Waveform Analysis', () => {
  describe('generateWaveformOverview', () => {
    it('should generate overview with correct number of segments', () => {
      const samples = createSineWave(440, 44100, 1);
      const overview = generateWaveformOverview(samples, 44100, 100);
      
      expect(overview.peaks.length).toBe(100);
      expect(overview.troughs.length).toBe(100);
      expect(overview.rms.length).toBe(100);
      expect(overview.totalSamples).toBe(44100);
      expect(overview.duration).toBe(1);
    });
    
    it('should calculate correct peak and trough values for sine wave', () => {
      const samples = createSineWave(10, 1000, 1, 0.5); // Low frequency for clear peaks
      const overview = generateWaveformOverview(samples, 1000, 10);
      
      // Peaks should be around 0.5, troughs around -0.5
      const maxPeak = Math.max(...overview.peaks);
      const minTrough = Math.min(...overview.troughs);
      
      expect(maxPeak).toBeGreaterThan(0.4);
      expect(minTrough).toBeLessThan(-0.4);
    });
    
    it('should calculate RMS values', () => {
      const samples = createSineWave(100, 1000, 1, 1);
      const overview = generateWaveformOverview(samples, 1000, 10);
      
      // RMS of sine wave is amplitude / sqrt(2) ≈ 0.707
      for (let i = 0; i < overview.rms.length; i++) {
        expect(overview.rms[i]).toBeGreaterThan(0.5);
        expect(overview.rms[i]).toBeLessThan(1);
      }
    });
  });
  
  describe('calculateSampleStats', () => {
    it('should calculate correct peak for sine wave', () => {
      const samples = createSineWave(440, 44100, 0.1, 0.8);
      const stats = calculateSampleStats(samples, 44100);
      
      expect(stats.peak).toBeCloseTo(0.8, 1);
    });
    
    it('should calculate correct RMS', () => {
      const samples = createSineWave(440, 44100, 1, 1);
      const stats = calculateSampleStats(samples, 44100);
      
      // RMS of sine wave is 1 / sqrt(2) ≈ 0.707
      expect(stats.rms).toBeCloseTo(0.707, 1);
    });
    
    it('should detect DC offset', () => {
      const samples = createSineWave(440, 44100, 1, 1);
      const offsetSamples = createWithDcOffset(samples, 0.3);
      const stats = calculateSampleStats(offsetSamples, 44100);
      
      expect(stats.dcOffset).toBeCloseTo(0.3, 1);
    });
    
    it('should report correct duration and sample count', () => {
      const samples = createSineWave(440, 44100, 0.5);
      const stats = calculateSampleStats(samples, 44100);
      
      expect(stats.duration).toBeCloseTo(0.5, 2);
      expect(stats.sampleCount).toBe(22050);
      expect(stats.sampleRate).toBe(44100);
    });
  });
});

// ============================================================================
// ZERO CROSSING TESTS
// ============================================================================

describe('Zero Crossing Detection', () => {
  describe('findZeroCrossings', () => {
    it('should find zero crossings in sine wave', () => {
      const samples = createSineWave(10, 1000, 1); // 10Hz = 10 full cycles
      const crossings = findZeroCrossings(samples);
      
      // Should find approximately 20 crossings (2 per cycle)
      expect(crossings.length).toBeGreaterThan(15);
      expect(crossings.length).toBeLessThan(25);
    });
    
    it('should respect start and end bounds', () => {
      const samples = createSineWave(10, 1000, 1);
      const crossings = findZeroCrossings(samples, 100, 200);
      
      crossings.forEach(c => {
        expect(c).toBeGreaterThan(100);
        expect(c).toBeLessThan(200);
      });
    });
    
    it('should return empty for DC signal', () => {
      const samples = new Float32Array(1000).fill(0.5);
      const crossings = findZeroCrossings(samples);
      
      expect(crossings.length).toBe(0);
    });
  });
  
  describe('findNearestZeroCrossing', () => {
    it('should find nearest zero crossing', () => {
      const samples = createSineWave(10, 1000, 1);
      const crossings = findZeroCrossings(samples);
      
      if (crossings.length > 0) {
        const targetCrossing = crossings[5];
        const nearby = targetCrossing + 10; // 10 samples away
        const found = findNearestZeroCrossing(samples, nearby, 50);
        
        expect(Math.abs(found - targetCrossing)).toBeLessThan(15);
      }
    });
    
    it('should return original position if no crossing found', () => {
      const samples = new Float32Array(100).fill(0.5);
      const position = 50;
      const found = findNearestZeroCrossing(samples, position, 10);
      
      expect(found).toBe(position);
    });
  });
});

// ============================================================================
// LOOP DETECTION TESTS
// ============================================================================

describe('Loop Detection', () => {
  describe('findLoopPoints', () => {
    it('should find loop points in periodic signal', () => {
      const samples = createSineWave(100, 44100, 2); // 2 seconds of 100Hz
      const suggestions = findLoopPoints(samples, 44100, {
        minLoopLength: 4410, // 0.1s
        numSuggestions: 3,
      });
      
      expect(suggestions.length).toBeGreaterThan(0);
      
      suggestions.forEach(s => {
        expect(s.end - s.start).toBeGreaterThanOrEqual(MIN_LOOP_LENGTH);
        expect(s.quality).toBeGreaterThanOrEqual(0);
        expect(s.quality).toBeLessThanOrEqual(1);
      });
    });
    
    it('should prefer zero crossings when enabled', () => {
      const samples = createSineWave(100, 44100, 1);
      const suggestions = findLoopPoints(samples, 44100, {
        preferZeroCrossing: true,
        numSuggestions: 1,
      });
      
      if (suggestions.length > 0) {
        expect(suggestions[0].isZeroCrossing).toBe(true);
      }
    });
  });
  
  describe('calculateLoopCrossfade', () => {
    it('should create crossfade of correct length', () => {
      const samples = createSineWave(100, 44100, 1);
      const loopStart = 4410;
      const loopEnd = 22050;
      const crossfadeSamples = 100;
      
      const result = calculateLoopCrossfade(samples, loopStart, loopEnd, crossfadeSamples);
      
      expect(result.length).toBe(loopEnd - loopStart);
    });
  });
});

// ============================================================================
// TRANSIENT DETECTION TESTS
// ============================================================================

describe('Transient Detection', () => {
  describe('detectTransients', () => {
    it('should detect transients in drum-like sample', () => {
      const samples = createTransientSample(44100, 4, 0.5);
      const transients = detectTransients(samples, 44100, {
        sensitivity: 0.7,
        minInterval: 0.1,
      });
      
      // Should detect approximately 4 hits
      expect(transients.length).toBeGreaterThanOrEqual(2);
      expect(transients.length).toBeLessThanOrEqual(6);
    });
    
    it('should provide strength and time info', () => {
      const samples = createTransientSample(44100, 2, 0.5);
      const transients = detectTransients(samples, 44100);
      
      transients.forEach(t => {
        expect(t.position).toBeGreaterThanOrEqual(0);
        expect(t.strength).toBeGreaterThanOrEqual(0);
        expect(t.strength).toBeLessThanOrEqual(1);
        expect(t.time).toBe(t.position / 44100);
      });
    });
    
    it('should respect minimum interval', () => {
      const samples = createTransientSample(44100, 10, 0.1);
      const minInterval = 0.2; // 200ms
      const transients = detectTransients(samples, 44100, { minInterval });
      
      for (let i = 1; i < transients.length; i++) {
        const interval = transients[i].time - transients[i - 1].time;
        expect(interval).toBeGreaterThanOrEqual(minInterval * 0.9); // Allow small tolerance
      }
    });
  });
  
  describe('createSlicesFromTransients', () => {
    it('should create slices from transients', () => {
      const samples = createTransientSample(44100, 3, 0.5);
      const transients = detectTransients(samples, 44100);
      const slices = createSlicesFromTransients(samples, 44100, transients, 36);
      
      expect(slices.length).toBe(transients.length);
      
      slices.forEach((slice, i) => {
        expect(slice.id).toBe(`slice-${i}`);
        expect(slice.start).toBe(transients[i].position);
        expect(slice.suggestedNote).toBe(36 + i);
        expect(slice.duration).toBeGreaterThan(0);
      });
    });
    
    it('should extend last slice to end of sample', () => {
      const samples = createTransientSample(44100, 2, 0.5);
      const transients = detectTransients(samples, 44100);
      const slices = createSlicesFromTransients(samples, 44100, transients);
      
      if (slices.length > 0) {
        const lastSlice = slices[slices.length - 1];
        expect(lastSlice.end).toBe(samples.length);
      }
    });
  });
});

// ============================================================================
// SAMPLE OPERATIONS TESTS
// ============================================================================

describe('Sample Operations', () => {
  describe('normalizeSample', () => {
    it('should normalize to peak level', () => {
      const samples = createSineWave(440, 44100, 0.1, 0.5);
      const normalized = normalizeSample(samples, 'peak', 0);
      
      const maxAbs = Math.max(...normalized.map(Math.abs));
      expect(maxAbs).toBeCloseTo(1, 1);
    });
    
    it('should normalize to target dB level', () => {
      const samples = createSineWave(440, 44100, 0.1, 1);
      const normalized = normalizeSample(samples, 'peak', -6);
      
      const maxAbs = Math.max(...normalized.map(Math.abs));
      expect(maxAbs).toBeCloseTo(0.5, 1); // -6dB ≈ 0.5
    });
    
    it('should not exceed -1 to 1 range', () => {
      const samples = createSineWave(440, 44100, 0.1, 0.1);
      const normalized = normalizeSample(samples, 'peak', 12); // +12dB
      
      normalized.forEach(s => {
        expect(s).toBeGreaterThanOrEqual(-1);
        expect(s).toBeLessThanOrEqual(1);
      });
    });
  });
  
  describe('removeDcOffset', () => {
    it('should remove DC offset', () => {
      const samples = createSineWave(440, 44100, 0.1);
      const withOffset = createWithDcOffset(samples, 0.3);
      const cleaned = removeDcOffset(withOffset);
      
      const stats = calculateSampleStats(cleaned, 44100);
      expect(Math.abs(stats.dcOffset)).toBeLessThan(0.01);
    });
    
    it('should not affect centered signal', () => {
      const samples = createSineWave(440, 44100, 0.1);
      const cleaned = removeDcOffset(samples);
      
      // Should be very similar
      for (let i = 0; i < samples.length; i++) {
        expect(Math.abs(cleaned[i] - samples[i])).toBeLessThan(0.01);
      }
    });
  });
  
  describe('applyFade', () => {
    it('should apply linear fade in', () => {
      const samples = new Float32Array(100).fill(1);
      const faded = applyFade(samples, 50, 0, 'linear');
      
      expect(faded[0]).toBeCloseTo(0, 3);
      expect(faded[25]).toBeCloseTo(0.5, 1);
      expect(faded[50]).toBeCloseTo(1, 1);
      expect(faded[99]).toBeCloseTo(1, 1);
    });
    
    it('should apply linear fade out', () => {
      const samples = new Float32Array(100).fill(1);
      const faded = applyFade(samples, 0, 50, 'linear');
      
      expect(faded[0]).toBeCloseTo(1, 1);
      expect(faded[50]).toBeCloseTo(1, 1);
      expect(faded[74]).toBeCloseTo(0.5, 1);
      expect(faded[99]).toBeCloseTo(0, 3);
    });
    
    it('should apply s-curve fade', () => {
      const samples = new Float32Array(100).fill(1);
      const faded = applyFade(samples, 100, 0, 's-curve');
      
      // S-curve starts slow
      expect(faded[10]).toBeLessThan(0.15);
      // S-curve ends slow
      expect(faded[90]).toBeGreaterThan(0.85);
    });
  });
  
  describe('reverseSample', () => {
    it('should reverse sample', () => {
      const samples = new Float32Array([1, 2, 3, 4, 5]);
      const reversed = reverseSample(samples);
      
      expect([...reversed]).toEqual([5, 4, 3, 2, 1]);
    });
    
    it('should preserve sample values', () => {
      const samples = createSineWave(100, 1000, 0.1);
      const reversed = reverseSample(samples);
      
      expect(reversed.length).toBe(samples.length);
      expect(reversed[0]).toBe(samples[samples.length - 1]);
      expect(reversed[reversed.length - 1]).toBe(samples[0]);
    });
  });
  
  describe('trimSilence', () => {
    it('should trim silence from start and end', () => {
      const content = createSineWave(440, 1000, 0.1, 0.5);
      const withSilence = createWithSilence(content, 100, 100);
      const { samples, trimStart, trimEnd } = trimSilence(withSilence);
      
      expect(samples.length).toBeLessThan(withSilence.length);
      expect(trimStart).toBeGreaterThan(50);
      expect(trimEnd).toBeGreaterThan(50);
    });
    
    it('should not trim non-silent sample', () => {
      const samples = createSineWave(440, 1000, 0.1, 0.5);
      const { samples: trimmed, trimStart, trimEnd } = trimSilence(samples);
      
      // Allow some trimming due to sine wave starting near zero
      expect(trimmed.length).toBeGreaterThan(samples.length * 0.8);
    });
  });
  
  describe('cropSample', () => {
    it('should crop to specified range', () => {
      const samples = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const cropped = cropSample(samples, 2, 7, false);
      
      expect(cropped.length).toBe(5);
      expect([...cropped]).toEqual([3, 4, 5, 6, 7]);
    });
    
    it('should clamp to valid range', () => {
      const samples = new Float32Array([1, 2, 3, 4, 5]);
      const cropped = cropSample(samples, -10, 100, false);
      
      expect(cropped.length).toBe(5);
    });
  });
  
  describe('applyGain', () => {
    it('should apply positive gain', () => {
      const samples = createSineWave(440, 1000, 0.1, 0.5);
      const gained = applyGain(samples, 6); // +6dB ≈ 2x
      
      // Peak should be approximately doubled
      const originalPeak = Math.max(...samples.map(Math.abs));
      const gainedPeak = Math.max(...gained.map(Math.abs));
      
      expect(gainedPeak).toBeGreaterThan(originalPeak * 1.5);
    });
    
    it('should apply negative gain', () => {
      const samples = createSineWave(440, 1000, 0.1, 1);
      const gained = applyGain(samples, -6); // -6dB ≈ 0.5x
      
      const gainedPeak = Math.max(...gained.map(Math.abs));
      expect(gainedPeak).toBeCloseTo(0.5, 1);
    });
    
    it('should clip at -1 to 1', () => {
      const samples = createSineWave(440, 1000, 0.1, 1);
      const gained = applyGain(samples, 20); // +20dB
      
      gained.forEach(s => {
        expect(s).toBeGreaterThanOrEqual(-1);
        expect(s).toBeLessThanOrEqual(1);
      });
    });
  });
});

// ============================================================================
// PITCH/TIME MANIPULATION TESTS
// ============================================================================

describe('Pitch and Time Manipulation', () => {
  describe('pitchShiftByResampling', () => {
    it('should shorten sample when pitching up', () => {
      const samples = createSineWave(440, 44100, 1);
      const pitched = pitchShiftByResampling(samples, 12); // +1 octave
      
      // Should be roughly half length
      expect(pitched.length).toBeCloseTo(samples.length / 2, -2);
    });
    
    it('should lengthen sample when pitching down', () => {
      const samples = createSineWave(440, 44100, 1);
      const pitched = pitchShiftByResampling(samples, -12); // -1 octave
      
      // Should be roughly double length
      expect(pitched.length).toBeCloseTo(samples.length * 2, -2);
    });
    
    it('should not change length for zero semitones', () => {
      const samples = createSineWave(440, 44100, 0.1);
      const pitched = pitchShiftByResampling(samples, 0);
      
      expect(pitched.length).toBe(samples.length);
    });
  });
  
  describe('timeStretchByResampling', () => {
    it('should lengthen sample when stretching', () => {
      const samples = createSineWave(440, 44100, 0.5);
      const stretched = timeStretchByResampling(samples, 2);
      
      expect(stretched.length).toBeCloseTo(samples.length * 2, -1);
    });
    
    it('should shorten sample when compressing', () => {
      const samples = createSineWave(440, 44100, 1);
      const compressed = timeStretchByResampling(samples, 0.5);
      
      expect(compressed.length).toBeCloseTo(samples.length / 2, -1);
    });
    
    it('should interpolate values correctly', () => {
      const samples = new Float32Array([0, 1, 0, -1, 0]);
      const stretched = timeStretchByResampling(samples, 2);
      
      // Should have smooth interpolation
      expect(stretched.length).toBe(10);
      expect(stretched[0]).toBe(0);
      expect(stretched[2]).toBe(1);
    });
  });
});
