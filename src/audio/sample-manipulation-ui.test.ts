/**
 * @fileoverview Tests for Sample Manipulation UI Module
 */

import { describe, it, expect } from 'vitest';
import {
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
  processBatch,
  createUndoState,
  applyUndo,
  generateWaveformForUI,
  getSampleRegion,
  type TrimParams,
  type FadeParams,
  type NormalizeParams,
  type TimeStretchParams,
  type PitchShiftParams,
  type ConvertRateParams,
  type ConvertDepthParams,
  type ConvertChannelsParams,
  type CropParams,
  type SliceParams,
  type BatchJob,
} from './sample-manipulation-ui';

// ============================================================================
// TEST UTILITIES
// ============================================================================

function createSineWave(
  frequency: number,
  sampleRate: number,
  duration: number
): Float32Array {
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    samples[i] = Math.sin(2 * Math.PI * frequency * t);
  }
  
  return samples;
}

function createWithSilence(
  samples: Float32Array,
  silenceStart: number,
  silenceEnd: number
): Float32Array {
  const result = new Float32Array(samples.length + silenceStart + silenceEnd);
  result.set(samples, silenceStart);
  return result;
}

function createTransientSample(
  sampleRate: number,
  numHits: number
): Float32Array {
  const samples = new Float32Array(sampleRate * 2);
  const hitInterval = Math.floor(sampleRate / numHits);
  
  for (let i = 0; i < numHits; i++) {
    const pos = i * hitInterval;
    samples[pos] = 0.8;
    if (pos + 1 < samples.length) samples[pos + 1] = 0.4;
    if (pos + 2 < samples.length) samples[pos + 2] = 0.2;
  }
  
  return samples;
}

// ============================================================================
// TRIM TESTS
// ============================================================================

describe('performTrim', () => {
  it('should trim silence from sample', () => {
    const samples = createSineWave(440, 44100, 0.1);
    const withSilence = createWithSilence(samples, 1000, 1000);
    
    const result = performTrim(withSilence, 44100, {
      autoDetect: true,
      threshold: 0.01,
    });
    
    expect(result.samples).toBeDefined();
    expect(result.samples!.length).toBeLessThan(withSilence.length);
    expect(result.samples!.length).toBeGreaterThan(samples.length * 0.8);
  });
  
  it('should include stats in result', () => {
    const samples = createSineWave(440, 44100, 0.1);
    
    const result = performTrim(samples, 44100, {
      autoDetect: false,
    });
    
    expect(result.stats).toBeDefined();
    expect(result.stats.sampleCount).toBe(samples.length);
  });
});

// ============================================================================
// FADE TESTS
// ============================================================================

describe('performFade', () => {
  it('should apply linear fade', () => {
    const samples = createSineWave(440, 44100, 0.1);
    
    const result = performFade(samples, 44100, {
      fadeInSamples: 1000,
      fadeOutSamples: 1000,
      curve: 'linear',
    });
    
    expect(result.samples).toBeDefined();
    expect(result.samples!.length).toBe(samples.length);
    expect(Math.abs(result.samples![0]!)).toBeLessThan(0.1);
    expect(Math.abs(result.samples![result.samples!.length - 1]!)).toBeLessThan(0.1);
  });
  
  it('should apply exponential fade', () => {
    const samples = createSineWave(440, 44100, 0.1);
    
    const result = performFade(samples, 44100, {
      fadeInSamples: 1000,
      fadeOutSamples: 1000,
      curve: 'exponential',
    });
    
    expect(result.samples).toBeDefined();
    expect(result.samples!.length).toBe(samples.length);
  });
});

// ============================================================================
// NORMALIZE TESTS
// ============================================================================

describe('performNormalize', () => {
  it('should normalize to peak', () => {
    const samples = new Float32Array([0.1, 0.2, -0.3, 0.5]);
    
    const result = performNormalize(samples, 44100, {
      mode: 'peak',
      targetDb: 0,
    });
    
    expect(result.samples).toBeDefined();
    const peak = Math.max(...Array.from(result.samples!).map(Math.abs));
    expect(peak).toBeCloseTo(1.0, 1);
  });
  
  it('should normalize to RMS', () => {
    const samples = createSineWave(440, 44100, 0.1);
    
    const result = performNormalize(samples, 44100, {
      mode: 'rms',
      targetDb: -6,
    });
    
    expect(result.samples).toBeDefined();
    expect(result.stats.rms).toBeGreaterThan(0);
  });
});

// ============================================================================
// REVERSE TESTS
// ============================================================================

describe('performReverse', () => {
  it('should reverse sample', () => {
    const samples = new Float32Array([1, 2, 3, 4, 5]);
    
    const result = performReverse(samples, 44100);
    
    expect(result.samples).toBeDefined();
    expect(result.samples![0]).toBe(5);
    expect(result.samples![1]).toBe(4);
    expect(result.samples![4]).toBe(1);
  });
  
  it('should preserve length', () => {
    const samples = createSineWave(440, 44100, 0.1);
    
    const result = performReverse(samples, 44100);
    
    expect(result.samples!.length).toBe(samples.length);
  });
});

// ============================================================================
// TIME STRETCH TESTS
// ============================================================================

describe('performTimeStretch', () => {
  it('should stretch time by 2x', () => {
    const samples = createSineWave(440, 44100, 0.1);
    
    const result = performTimeStretch(samples, 44100, {
      ratio: 2.0,
      preservePitch: false,
    });
    
    expect(result.samples).toBeDefined();
    expect(result.samples!.length).toBeCloseTo(samples.length * 2, -100);
    expect(result.metadata?.stretchRatio).toBe(2.0);
  });
  
  it('should shrink time by 0.5x', () => {
    const samples = createSineWave(440, 44100, 0.1);
    
    const result = performTimeStretch(samples, 44100, {
      ratio: 0.5,
      preservePitch: false,
    });
    
    expect(result.samples).toBeDefined();
    expect(result.samples!.length).toBeCloseTo(samples.length * 0.5, -100);
  });
});

// ============================================================================
// PITCH SHIFT TESTS
// ============================================================================

describe('performPitchShift', () => {
  it('should shift pitch up by 12 semitones', () => {
    const samples = createSineWave(440, 44100, 0.1);
    
    const result = performPitchShift(samples, 44100, {
      semitones: 12,
      preserveDuration: false,
    });
    
    expect(result.samples).toBeDefined();
    expect(result.samples!.length).toBeLessThan(samples.length);
    expect(result.metadata?.semitones).toBe(12);
  });
  
  it('should shift pitch down by 12 semitones', () => {
    const samples = createSineWave(440, 44100, 0.1);
    
    const result = performPitchShift(samples, 44100, {
      semitones: -12,
      preserveDuration: false,
    });
    
    expect(result.samples).toBeDefined();
    expect(result.samples!.length).toBeGreaterThan(samples.length);
  });
});

// ============================================================================
// SAMPLE RATE CONVERSION TESTS
// ============================================================================

describe('performConvertRate', () => {
  it('should convert 44100 to 48000', () => {
    const samples = createSineWave(440, 44100, 0.1);
    
    const result = performConvertRate(samples, 44100, {
      targetRate: 48000,
      quality: 2,
    });
    
    expect(result.samples).toBeDefined();
    expect(result.sampleRate).toBe(48000);
    expect(result.samples!.length).toBeCloseTo((samples.length * 48000) / 44100, -10);
  });
  
  it('should convert 48000 to 44100', () => {
    const samples = createSineWave(440, 48000, 0.1);
    
    const result = performConvertRate(samples, 48000, {
      targetRate: 44100,
      quality: 2,
    });
    
    expect(result.sampleRate).toBe(44100);
  });
});

// ============================================================================
// BIT DEPTH CONVERSION TESTS
// ============================================================================

describe('performConvertDepth', () => {
  it('should quantize to 8-bit', () => {
    const samples = createSineWave(440, 44100, 0.01);
    
    const result = performConvertDepth(samples, 44100, {
      targetDepth: 8,
      dither: false,
    });
    
    expect(result.samples).toBeDefined();
    expect(result.metadata?.targetDepth).toBe(8);
  });
  
  it('should apply dither when requested', () => {
    const samples = createSineWave(440, 44100, 0.01);
    
    const result = performConvertDepth(samples, 44100, {
      targetDepth: 8,
      dither: true,
    });
    
    expect(result.metadata?.dither).toBe(true);
  });
});

// ============================================================================
// CHANNEL CONVERSION TESTS
// ============================================================================

describe('performConvertChannels', () => {
  it('should keep mono as mono', () => {
    const samples = createSineWave(440, 44100, 0.1);
    
    const result = performConvertChannels(samples, 44100, {
      targetChannels: 1,
      mixMethod: 'average',
    });
    
    expect(result.samples!.length).toBe(samples.length);
  });
  
  it('should convert mono to stereo', () => {
    const samples = createSineWave(440, 44100, 0.1);
    
    const result = performConvertChannels(samples, 44100, {
      targetChannels: 2,
      mixMethod: 'average',
    });
    
    expect(result.samples!.length).toBe(samples.length * 2);
  });
});

// ============================================================================
// CROP TESTS
// ============================================================================

describe('performCrop', () => {
  it('should crop to specified range', () => {
    const samples = createSineWave(440, 44100, 0.1);
    const start = 1000;
    const end = 3000;
    
    const result = performCrop(samples, 44100, {
      startSample: start,
      endSample: end,
      snapToZero: false,
    });
    
    expect(result.samples!.length).toBeCloseTo(end - start, -50);
  });
  
  it('should include metadata about crop', () => {
    const samples = createSineWave(440, 44100, 0.1);
    
    const result = performCrop(samples, 44100, {
      startSample: 1000,
      endSample: 3000,
      snapToZero: false,
    });
    
    expect(result.metadata?.cropStart).toBe(1000);
    expect(result.metadata?.cropEnd).toBe(3000);
  });
});

// ============================================================================
// GAIN TESTS
// ============================================================================

describe('performGain', () => {
  it('should apply positive gain', () => {
    const samples = new Float32Array([0.1, 0.2, 0.3]);
    
    const result = performGain(samples, 44100, 6);
    
    expect(result.samples![0]!).toBeGreaterThan(samples[0]!);
  });
  
  it('should apply negative gain', () => {
    const samples = new Float32Array([0.5, 0.6, 0.7]);
    
    const result = performGain(samples, 44100, -6);
    
    expect(result.samples![0]!).toBeLessThan(samples[0]!);
  });
});

// ============================================================================
// DC REMOVE TESTS
// ============================================================================

describe('performDcRemove', () => {
  it('should remove DC offset', () => {
    const samples = new Float32Array([1.5, 1.6, 1.7, 1.8]);
    
    const result = performDcRemove(samples, 44100);
    
    let sum = 0;
    for (let i = 0; i < result.samples!.length; i++) {
      sum += result.samples![i]!;
    }
    const average = sum / result.samples!.length;
    
    expect(Math.abs(average)).toBeLessThan(0.01);
  });
});

// ============================================================================
// SAVE AS NEW TESTS
// ============================================================================

describe('performSaveAsNew', () => {
  it('should save sample with new name', () => {
    const samples = createSineWave(440, 44100, 0.1);
    
    const result = performSaveAsNew(samples, 44100, {
      name: 'My New Sample',
    });
    
    expect(result.savedInfo).toBeDefined();
    expect(result.savedInfo!.name).toBe('My New Sample');
    expect(result.savedInfo!.id).toBeDefined();
  });
  
  it('should preserve original samples', () => {
    const samples = createSineWave(440, 44100, 0.1);
    
    const result = performSaveAsNew(samples, 44100, {
      name: 'Test',
      metadata: { category: 'synth' },
    });
    
    expect(result.samples).toBeDefined();
    expect(result.samples!.length).toBe(samples.length);
    expect(result.metadata?.category).toBe('synth');
  });
});

// ============================================================================
// SLICE TESTS
// ============================================================================

describe('performSlice', () => {
  it('should slice by transients', () => {
    const samples = createTransientSample(44100, 4);
    
    const result = performSlice(samples, 44100, {
      mode: 'transient',
      sensitivity: 0.5,
      startNote: 36,
    });
    
    expect(result.slices).toBeDefined();
    expect(result.slices!.length).toBeGreaterThan(0);
  });
  
  it('should slice by grid', () => {
    const samples = createSineWave(440, 44100, 1.0);
    
    const result = performSlice(samples, 44100, {
      mode: 'grid',
      gridDivision: 0.25,
      startNote: 36,
    });
    
    expect(result.slices).toBeDefined();
    expect(result.slices!.length).toBeGreaterThan(0);
  });
  
  it('should slice manually', () => {
    const samples = createSineWave(440, 44100, 1.0);
    
    const result = performSlice(samples, 44100, {
      mode: 'manual',
      positions: [0, 11025, 22050, 33075],
      startNote: 36,
    });
    
    expect(result.slices!.length).toBe(4);
  });
});

// ============================================================================
// APPLY MANIPULATION TESTS
// ============================================================================

describe('applyManipulation', () => {
  it('should apply trim operation', () => {
    const samples = createSineWave(440, 44100, 0.1);
    
    const result = applyManipulation(samples, 44100, 'trim', {
      autoDetect: false,
    });
    
    expect(result.samples).toBeDefined();
  });
  
  it('should apply reverse operation', () => {
    const samples = new Float32Array([1, 2, 3, 4]);
    
    const result = applyManipulation(samples, 44100, 'reverse', {});
    
    expect(result.samples![0]).toBe(4);
  });
  
  it('should throw on unknown operation', () => {
    const samples = createSineWave(440, 44100, 0.1);
    
    expect(() => {
      applyManipulation(samples, 44100, 'unknown' as any, {});
    }).toThrow();
  });
});

// ============================================================================
// BATCH PROCESSING TESTS
// ============================================================================

describe('processBatch', () => {
  it('should process single job', async () => {
    const samples = createSineWave(440, 44100, 0.1);
    
    const jobs: BatchJob[] = [
      {
        id: 'job1',
        samples,
        sampleRate: 44100,
        operations: [
          { type: 'normalize', params: { mode: 'peak', targetDb: 0 } },
        ],
      },
    ];
    
    const results = await processBatch(jobs);
    
    expect(results.length).toBe(1);
    expect(results[0]!.success).toBe(true);
    expect(results[0]!.result).toBeDefined();
  });
  
  it('should process multiple jobs', async () => {
    const samples1 = createSineWave(440, 44100, 0.1);
    const samples2 = createSineWave(880, 44100, 0.1);
    
    const jobs: BatchJob[] = [
      {
        id: 'job1',
        samples: samples1,
        sampleRate: 44100,
        operations: [{ type: 'reverse', params: {} }],
      },
      {
        id: 'job2',
        samples: samples2,
        sampleRate: 44100,
        operations: [{ type: 'normalize', params: { mode: 'peak', targetDb: 0 } }],
      },
    ];
    
    const results = await processBatch(jobs);
    
    expect(results.length).toBe(2);
    expect(results[0]!.success).toBe(true);
    expect(results[1]!.success).toBe(true);
  });
  
  it('should chain multiple operations', async () => {
    const samples = createSineWave(440, 44100, 0.1);
    
    const jobs: BatchJob[] = [
      {
        id: 'job1',
        samples,
        sampleRate: 44100,
        operations: [
          { type: 'normalize', params: { mode: 'peak', targetDb: -3 } },
          { type: 'reverse', params: {} },
          { type: 'fade', params: { fadeInSamples: 100, fadeOutSamples: 100, curve: 'linear' } },
        ],
      },
    ];
    
    const results = await processBatch(jobs);
    
    expect(results[0]!.success).toBe(true);
  });
  
  it('should handle errors gracefully', async () => {
    const samples = createSineWave(440, 44100, 0.1);
    
    const jobs: BatchJob[] = [
      {
        id: 'job1',
        samples,
        sampleRate: 44100,
        operations: [
          { type: 'unknown' as any, params: {} },
        ],
      },
    ];
    
    const results = await processBatch(jobs);
    
    expect(results[0]!.success).toBe(false);
    expect(results[0]!.error).toBeDefined();
  });
});

// ============================================================================
// UNDO/REDO TESTS
// ============================================================================

describe('createUndoState and applyUndo', () => {
  it('should create undo state', () => {
    const samples = createSineWave(440, 44100, 0.1);
    
    const undoState = createUndoState('normalize', { mode: 'peak', targetDb: 0 }, samples, 44100);
    
    expect(undoState.operation).toBe('normalize');
    expect(undoState.previousSamples.length).toBe(samples.length);
    expect(undoState.previousRate).toBe(44100);
  });
  
  it('should apply undo state', () => {
    const samples = createSineWave(440, 44100, 0.1);
    const undoState = createUndoState('reverse', {}, samples, 44100);
    
    const restored = applyUndo(undoState);
    
    expect(restored.samples.length).toBe(samples.length);
    expect(restored.sampleRate).toBe(44100);
  });
});

// ============================================================================
// WAVEFORM VISUALIZATION TESTS
// ============================================================================

describe('generateWaveformForUI', () => {
  it('should generate waveform overview', () => {
    const samples = createSineWave(440, 44100, 0.1);
    
    const waveform = generateWaveformForUI(samples, 44100, 500);
    
    expect(waveform.peaks).toBeDefined();
    expect(waveform.troughs).toBeDefined();
    expect(waveform.rms).toBeDefined();
    expect(waveform.peaks.length).toBeGreaterThan(0);
  });
});

describe('getSampleRegion', () => {
  it('should get sample region', () => {
    const samples = createSineWave(440, 44100, 1.0);
    
    const region = getSampleRegion(samples, 0.25, 0.75);
    
    expect(region.length).toBeCloseTo(samples.length * 0.5, -100);
  });
  
  it('should handle edge cases', () => {
    const samples = createSineWave(440, 44100, 1.0);
    
    const fullRegion = getSampleRegion(samples, 0, 1);
    
    expect(fullRegion.length).toBe(samples.length);
  });
});
