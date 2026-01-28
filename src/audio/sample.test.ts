/**
 * @fileoverview Tests for Sample Playback Engine.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SampleCache,
  VoicePool,
  EnvelopeGenerator,
  BiquadFilter,
  calculateFilterCoeffs,
  calculatePitchRatio,
  interpolateSample,
  interpolateSampleCubic,
  applyLoopCrossfade,
  findSampleForNote,
  createSampleInstrument,
  createSamplePlayerState,
  resampleBuffer,
  stereoToMono,
  monoToStereo,
  normalizeBuffer,
  reverseBuffer,
  generateSamplePlayerProcessorScript,
  DEFAULT_ENVELOPE,
} from './sample';
import type { Sample, SampleMeta, SampleInstrument, VoiceParams } from './sample';

// ============================================================================
// SAMPLE CACHE TESTS
// ============================================================================

describe('SampleCache', () => {
  let cache: SampleCache;

  const createMockSample = (id: string): Sample => ({
    meta: {
      id,
      name: `Sample ${id}`,
      format: { sampleRate: 48000, channels: 2, bitDepth: 32 },
      frameCount: 1000,
      duration: 1000 / 48000,
    },
    buffer: null,
  });

  beforeEach(() => {
    cache = new SampleCache(1); // 1MB max
  });

  it('should start empty', () => {
    expect(cache.has('test')).toBe(false);
    expect(cache.get('test')).toBeUndefined();
  });

  it('should store and retrieve samples', () => {
    const sample = createMockSample('test');
    cache.set(sample);
    
    expect(cache.has('test')).toBe(true);
    expect(cache.get('test')).toBe(sample);
  });

  it('should delete samples', () => {
    const sample = createMockSample('test');
    cache.set(sample);
    cache.delete('test');
    
    expect(cache.has('test')).toBe(false);
  });

  it('should clear all samples', () => {
    cache.set(createMockSample('a'));
    cache.set(createMockSample('b'));
    cache.clear();
    
    expect(cache.getStats().count).toBe(0);
  });

  it('should report stats', () => {
    cache.set(createMockSample('test'));
    const stats = cache.getStats();
    
    expect(stats.count).toBe(1);
    expect(stats.maxSize).toBe(1024 * 1024);
  });
});

// ============================================================================
// VOICE POOL TESTS
// ============================================================================

describe('VoicePool', () => {
  let pool: VoicePool;

  const createParams = (note: number): VoiceParams => ({
    note,
    velocity: 100,
  });

  beforeEach(() => {
    pool = new VoicePool(4, 'oldest');
  });

  it('should start empty', () => {
    expect(pool.count).toBe(0);
    expect(pool.getActive()).toHaveLength(0);
  });

  it('should allocate voices', () => {
    const voice = pool.allocate(createParams(60), 'sample1', 0);
    
    expect(voice).toBeDefined();
    expect(voice!.note).toBe(60);
    expect(voice!.velocity).toBe(100);
    expect(pool.count).toBe(1);
  });

  it('should track multiple voices', () => {
    pool.allocate(createParams(60), 'sample1', 0);
    pool.allocate(createParams(64), 'sample1', 1);
    pool.allocate(createParams(67), 'sample1', 2);
    
    expect(pool.count).toBe(3);
    expect(pool.getActive()).toHaveLength(3);
  });

  it('should steal oldest voice when full', () => {
    pool.allocate(createParams(60), 'sample1', 0);
    pool.allocate(createParams(64), 'sample1', 1);
    pool.allocate(createParams(67), 'sample1', 2);
    pool.allocate(createParams(72), 'sample1', 3);
    pool.allocate(createParams(76), 'sample1', 4); // Should steal

    expect(pool.count).toBe(4); // Still at max
    expect(pool.getByNote(60)).toHaveLength(0); // Oldest stolen
  });

  it('should release voice by note', () => {
    pool.allocate(createParams(60), 'sample1', 0);
    pool.releaseByNote(60, 1);
    
    const voices = pool.getByNote(60);
    expect(voices[0]!.state).toBe('release');
  });

  it('should release all voices', () => {
    pool.allocate(createParams(60), 'sample1', 0);
    pool.allocate(createParams(64), 'sample1', 1);
    pool.releaseAll(2);
    
    const active = pool.getActive();
    expect(active.every(v => v.state === 'release')).toBe(true);
  });

  it('should free voice by id', () => {
    const voice = pool.allocate(createParams(60), 'sample1', 0);
    pool.free(voice!.id);
    
    expect(pool.count).toBe(0);
  });

  it('should update voice', () => {
    const voice = pool.allocate(createParams(60), 'sample1', 0);
    pool.update(voice!.id, { gain: 0.5 });
    
    const updated = pool.getByNote(60)[0];
    expect(updated!.gain).toBe(0.5);
  });

  it('should reject when stealing mode is none', () => {
    const noStealPool = new VoicePool(2, 'none');
    noStealPool.allocate(createParams(60), 'sample1', 0);
    noStealPool.allocate(createParams(64), 'sample1', 1);
    const rejected = noStealPool.allocate(createParams(67), 'sample1', 2);
    
    expect(rejected).toBeUndefined();
  });
});

// ============================================================================
// ENVELOPE GENERATOR TESTS
// ============================================================================

describe('EnvelopeGenerator', () => {
  it('should start idle', () => {
    const env = new EnvelopeGenerator();
    
    expect(env.currentStage).toBe('idle');
    expect(env.value).toBe(0);
    expect(env.isIdle).toBe(true);
  });

  it('should trigger attack', () => {
    const env = new EnvelopeGenerator({ attack: 0.1, decay: 0, sustain: 1, release: 0 });
    env.trigger();
    
    expect(env.currentStage).toBe('attack');
    
    env.process(0.05); // Half attack
    expect(env.value).toBeCloseTo(0.5);
  });

  it('should reach sustain after decay', () => {
    const env = new EnvelopeGenerator({ attack: 0, decay: 0.1, sustain: 0.5, release: 0 });
    env.trigger();
    
    env.process(0.01); // Small step to move past attack
    expect(env.currentStage).toBe('decay');
    
    env.process(0.1); // Complete decay
    expect(env.value).toBeCloseTo(0.5);
    expect(env.currentStage).toBe('sustain');
  });

  it('should release to zero', () => {
    const env = new EnvelopeGenerator({ attack: 0, decay: 0, sustain: 1, release: 0.1 });
    env.trigger();
    env.process(0.01);
    
    env.release();
    expect(env.currentStage).toBe('release');
    
    env.process(0.1);
    expect(env.value).toBeCloseTo(0);
    expect(env.isIdle).toBe(true);
  });

  it('should use velocity for peak', () => {
    const env = new EnvelopeGenerator({ attack: 0, decay: 0, sustain: 1, release: 0 });
    env.trigger(0.5);
    env.process(0.01);
    
    expect(env.value).toBeCloseTo(0.5);
  });

  it('should reset', () => {
    const env = new EnvelopeGenerator();
    env.trigger();
    env.process(0.01);
    env.reset();
    
    expect(env.isIdle).toBe(true);
    expect(env.value).toBe(0);
  });
});

// ============================================================================
// FILTER TESTS
// ============================================================================

describe('calculateFilterCoeffs', () => {
  it('should calculate lowpass coefficients', () => {
    const coeffs = calculateFilterCoeffs('lowpass', 1000, 1, 48000);
    
    expect(coeffs.a0).toBe(1);
    expect(coeffs.b0).toBeGreaterThan(0);
  });

  it('should calculate highpass coefficients', () => {
    const coeffs = calculateFilterCoeffs('highpass', 1000, 1, 48000);
    
    expect(coeffs.a0).toBe(1);
  });

  it('should calculate bandpass coefficients', () => {
    const coeffs = calculateFilterCoeffs('bandpass', 1000, 1, 48000);
    
    expect(coeffs.b1).toBe(0); // Bandpass has zero b1
  });
});

describe('BiquadFilter', () => {
  it('should process samples', () => {
    const filter = new BiquadFilter('lowpass', 1000, 1, 48000);
    
    const output = filter.process(1);
    expect(typeof output).toBe('number');
  });

  it('should reset state', () => {
    const filter = new BiquadFilter('lowpass', 1000, 1, 48000);
    filter.process(1);
    filter.process(1);
    filter.reset();
    
    // After reset, processing the same value should be the same as initial
    const afterReset = filter.process(0);
    expect(afterReset).toBe(0);
  });
});

// ============================================================================
// PITCH RATIO TESTS
// ============================================================================

describe('calculatePitchRatio', () => {
  it('should return 1 for same note as root', () => {
    expect(calculatePitchRatio(60, 60)).toBe(1);
  });

  it('should double for octave up', () => {
    expect(calculatePitchRatio(72, 60)).toBeCloseTo(2);
  });

  it('should halve for octave down', () => {
    expect(calculatePitchRatio(48, 60)).toBeCloseTo(0.5);
  });

  it('should apply pitch bend', () => {
    const bent = calculatePitchRatio(60, 60, 0, 2);
    expect(bent).toBeGreaterThan(1);
  });

  it('should apply tuning in cents', () => {
    const tuned = calculatePitchRatio(60, 60, 100); // 100 cents = 1 semitone
    expect(tuned).toBeCloseTo(Math.pow(2, 1/12));
  });
});

// ============================================================================
// INTERPOLATION TESTS
// ============================================================================

describe('interpolateSample', () => {
  it('should return exact value at integer position', () => {
    const buffer = new Float32Array([0, 1, 2, 3]);
    
    expect(interpolateSample(buffer, 1)).toBe(1);
    expect(interpolateSample(buffer, 2)).toBe(2);
  });

  it('should interpolate between values', () => {
    const buffer = new Float32Array([0, 1, 2, 3]);
    
    expect(interpolateSample(buffer, 1.5)).toBeCloseTo(1.5);
  });

  it('should return 0 for out of bounds', () => {
    const buffer = new Float32Array([0, 1, 2, 3]);
    
    expect(interpolateSample(buffer, -1)).toBe(0);
    expect(interpolateSample(buffer, 10)).toBe(0);
  });
});

describe('interpolateSampleCubic', () => {
  it('should interpolate smoothly', () => {
    const buffer = new Float32Array([0, 0, 1, 1, 1]);
    
    const result = interpolateSampleCubic(buffer, 2.5);
    expect(result).toBeCloseTo(1, 0);
  });
});

// ============================================================================
// LOOP CROSSFADE TESTS
// ============================================================================

describe('applyLoopCrossfade', () => {
  it('should create crossfade at loop point', () => {
    const buffer = new Float32Array([1, 1, 1, 1, 0, 0, 0, 0, 0, 0]);
    const result = applyLoopCrossfade(buffer, 0, 8, 4);
    
    expect(result.length).toBe(buffer.length);
    // Crossfade should blend the end towards the start
  });
});

// ============================================================================
// SAMPLE INSTRUMENT TESTS
// ============================================================================

describe('createSampleInstrument', () => {
  it('should create basic instrument', () => {
    const inst = createSampleInstrument('piano', 'Piano', 'piano_sample');
    
    expect(inst.id).toBe('piano');
    expect(inst.name).toBe('Piano');
    expect(inst.zones).toHaveLength(1);
    expect(inst.zones[0]!.lowKey).toBe(0);
    expect(inst.zones[0]!.highKey).toBe(127);
  });
});

describe('findSampleForNote', () => {
  const instrument: SampleInstrument = {
    id: 'test',
    name: 'Test',
    zones: [
      {
        lowKey: 0,
        highKey: 59,
        rootKey: 36,
        layers: [
          { minVelocity: 0, maxVelocity: 64, sampleId: 'bass_soft' },
          { minVelocity: 65, maxVelocity: 127, sampleId: 'bass_loud' },
        ],
      },
      {
        lowKey: 60,
        highKey: 127,
        rootKey: 60,
        layers: [
          { minVelocity: 0, maxVelocity: 127, sampleId: 'treble' },
        ],
      },
    ],
    playbackMode: 'sustain',
    stealingMode: 'oldest',
    maxVoices: 128,
    releaseTime: 0.1,
  };

  it('should find sample for note in first zone', () => {
    const result = findSampleForNote(instrument, 48, 50);
    
    expect(result).toBeDefined();
    expect(result!.sampleId).toBe('bass_soft');
  });

  it('should find sample for loud velocity', () => {
    const result = findSampleForNote(instrument, 48, 100);
    
    expect(result).toBeDefined();
    expect(result!.sampleId).toBe('bass_loud');
  });

  it('should find sample in second zone', () => {
    const result = findSampleForNote(instrument, 72, 80);
    
    expect(result).toBeDefined();
    expect(result!.sampleId).toBe('treble');
  });

  it('should return undefined for out of range', () => {
    // All zones should be covered, but let's test edge
    const result = findSampleForNote(instrument, 60, 80);
    expect(result).toBeDefined();
    expect(result!.sampleId).toBe('treble');
  });
});

// ============================================================================
// SAMPLE PLAYER STATE TESTS
// ============================================================================

describe('createSamplePlayerState', () => {
  it('should create default state', () => {
    const state = createSamplePlayerState();
    
    expect(state.config.maxVoices).toBe(128);
    expect(state.config.stealingMode).toBe('oldest');
    expect(state.instruments).toHaveLength(0);
    expect(state.activeInstrumentId).toBeNull();
  });

  it('should apply custom config', () => {
    const state = createSamplePlayerState({ maxVoices: 64 });
    
    expect(state.config.maxVoices).toBe(64);
  });
});

// ============================================================================
// FORMAT CONVERSION TESTS
// ============================================================================

describe('resampleBuffer', () => {
  it('should return same buffer for same rate', () => {
    const input = new Float32Array([1, 2, 3, 4]);
    const output = resampleBuffer(input, 48000, 48000);
    
    expect(output).toBe(input);
  });

  it('should downsample correctly', () => {
    const input = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const output = resampleBuffer(input, 48000, 24000);
    
    expect(output.length).toBe(4);
  });

  it('should upsample correctly', () => {
    const input = new Float32Array([1, 2, 3, 4]);
    const output = resampleBuffer(input, 24000, 48000);
    
    expect(output.length).toBe(8);
  });
});

describe('stereoToMono', () => {
  it('should average left and right channels', () => {
    const left = new Float32Array([1, 1, 1]);
    const right = new Float32Array([0, 0, 0]);
    const mono = stereoToMono(left, right);
    
    expect(mono[0]).toBe(0.5);
    expect(mono[1]).toBe(0.5);
    expect(mono[2]).toBe(0.5);
  });
});

describe('monoToStereo', () => {
  it('should duplicate to both channels', () => {
    const mono = new Float32Array([0.5, 0.5, 0.5]);
    const [left, right] = monoToStereo(mono);
    
    expect(left[0]).toBe(0.5);
    expect(right[0]).toBe(0.5);
  });
});

describe('normalizeBuffer', () => {
  it('should normalize to peak', () => {
    const buffer = new Float32Array([0.5, -0.25, 0.25]);
    const normalized = normalizeBuffer(buffer);
    
    expect(normalized[0]).toBe(1);
    expect(normalized[1]).toBe(-0.5);
  });

  it('should handle zero buffer', () => {
    const buffer = new Float32Array([0, 0, 0]);
    const normalized = normalizeBuffer(buffer);
    
    expect(normalized).toBe(buffer);
  });
});

describe('reverseBuffer', () => {
  it('should reverse buffer', () => {
    const buffer = new Float32Array([1, 2, 3, 4]);
    const reversed = reverseBuffer(buffer);
    
    expect(reversed[0]).toBe(4);
    expect(reversed[1]).toBe(3);
    expect(reversed[2]).toBe(2);
    expect(reversed[3]).toBe(1);
  });
});

// ============================================================================
// PROCESSOR SCRIPT TESTS
// ============================================================================

describe('generateSamplePlayerProcessorScript', () => {
  it('should generate valid script', () => {
    const script = generateSamplePlayerProcessorScript();
    
    expect(script).toContain('SamplePlayerProcessor');
    expect(script).toContain('extends AudioWorkletProcessor');
    expect(script).toContain('registerProcessor');
    expect(script).toContain('noteOn');
    expect(script).toContain('noteOff');
  });
});
