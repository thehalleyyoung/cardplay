/**
 * @fileoverview Tests for Audio Transform Cards.
 */

import { describe, it, expect } from 'vitest';
import {
  type AudioBuffer,
  createAudioBuffer,
  applyInvert,
  applyMono,
  applyMonoToStereo,
  applyWidth,
  applyDelayComp,
  applyNormalize,
  findPeakLevel,
  findFirstSound,
  findLastSound,
  applyTrim,
  calculateFadeGain,
  applyFade,
  INVERT_CARD,
  MONO_CARD,
  STEREO_CARD,
  WIDTH_CARD,
  DELAY_COMP_CARD,
  NORMALIZE_CARD,
  TRIM_CARD,
  FADE_CARD,
  DEFAULT_INVERT_PARAMS,
  DEFAULT_MONO_PARAMS,
  DEFAULT_FADE_PARAMS,
} from './audio-transforms';
import { createCardContext, type Transport, type EngineRef } from './card';

// ============================================================================
// TEST HELPERS
// ============================================================================

function createTestContext() {
  const transport: Transport = {
    playing: true,
    recording: false,
    tempo: 120,
    timeSignature: [4, 4],
    looping: false,
  };
  
  const engine: EngineRef = {
    sampleRate: 48000,
    bufferSize: 256,
  };
  
  return createCardContext(0 as any, transport, engine);
}

function createTestBuffer(length: number, channels: number = 2): AudioBuffer {
  const buffer = createAudioBuffer(length, channels, 48000);
  
  // Fill with test signal (sine wave at 440Hz for channel 0, 880Hz for channel 1)
  for (let ch = 0; ch < channels; ch++) {
    const freq = 440 * (ch + 1);
    const channel = buffer.channels[ch] as Float32Array;
    for (let i = 0; i < length; i++) {
      channel[i] = Math.sin(2 * Math.PI * freq * i / 48000);
    }
  }
  
  return buffer;
}

// ============================================================================
// INVERT TESTS
// ============================================================================

describe('applyInvert', () => {
  it('should invert left channel only', () => {
    const input = createTestBuffer(100);
    const result = applyInvert(input, { invertLeft: true, invertRight: false });
    
    expect(result.channels[0][0]).toBe(-input.channels[0][0]);
    expect(result.channels[1][0]).toBe(input.channels[1][0]);
  });
  
  it('should invert right channel only', () => {
    const input = createTestBuffer(100);
    const result = applyInvert(input, { invertLeft: false, invertRight: true });
    
    expect(result.channels[0][0]).toBe(input.channels[0][0]);
    expect(result.channels[1][0]).toBe(-input.channels[1][0]);
  });
  
  it('should invert both channels', () => {
    const input = createTestBuffer(100);
    const result = applyInvert(input, { invertLeft: true, invertRight: true });
    
    expect(result.channels[0][0]).toBe(-input.channels[0][0]);
    expect(result.channels[1][0]).toBe(-input.channels[1][0]);
  });
  
  it('should not modify input when no inversion', () => {
    const input = createTestBuffer(100);
    const result = applyInvert(input, DEFAULT_INVERT_PARAMS);
    
    expect(result.channels[0][0]).toBe(input.channels[0][0]);
    expect(result.channels[1][0]).toBe(input.channels[1][0]);
  });
});

describe('INVERT_CARD', () => {
  it('should have correct metadata', () => {
    expect(INVERT_CARD.meta.id).toBe('audio.invert');
    expect(INVERT_CARD.meta.name).toBe('Invert');
    expect(INVERT_CARD.meta.category).toBe('utilities');
  });
  
  it('should have correct signature', () => {
    expect(INVERT_CARD.signature.inputs).toHaveLength(1);
    expect(INVERT_CARD.signature.outputs).toHaveLength(1);
    expect(INVERT_CARD.signature.params).toHaveLength(2);
  });
  
  it('should process audio', () => {
    const input = createTestBuffer(100);
    const context = createTestContext();
    const result = INVERT_CARD.process(input, context);
    
    expect(result.output).toBeDefined();
    expect(result.output.channels).toHaveLength(2);
  });
});

// ============================================================================
// MONO TESTS
// ============================================================================

describe('applyMono', () => {
  it('should sum stereo to mono', () => {
    const input = createTestBuffer(100);
    const result = applyMono(input, 'sum');
    
    expect(result.channels).toHaveLength(1);
    expect(result.channels[0][0]).toBeCloseTo((input.channels[0][0] + input.channels[1][0]) * 0.5);
  });
  
  it('should extract left channel', () => {
    const input = createTestBuffer(100);
    const result = applyMono(input, 'left');
    
    expect(result.channels).toHaveLength(1);
    expect(result.channels[0][0]).toBe(input.channels[0][0]);
  });
  
  it('should extract right channel', () => {
    const input = createTestBuffer(100);
    const result = applyMono(input, 'right');
    
    expect(result.channels).toHaveLength(1);
    expect(result.channels[0][0]).toBe(input.channels[1][0]);
  });
  
  it('should pass through already mono input', () => {
    const input = createTestBuffer(100, 1);
    const result = applyMono(input, 'sum');
    
    expect(result).toBe(input);
  });
});

describe('MONO_CARD', () => {
  it('should have correct metadata', () => {
    expect(MONO_CARD.meta.id).toBe('audio.mono');
    expect(MONO_CARD.meta.name).toBe('Mono');
  });
});

// ============================================================================
// STEREO TESTS
// ============================================================================

describe('applyMonoToStereo', () => {
  it('should convert mono to stereo', () => {
    const input = createTestBuffer(100, 1);
    const result = applyMonoToStereo(input, 1.0);
    
    expect(result.channels).toHaveLength(2);
    expect(result.channels[0][0]).toBe(input.channels[0][0]);
    expect(result.channels[1][0]).toBe(input.channels[0][0]);
  });
  
  it('should pass through already stereo input', () => {
    const input = createTestBuffer(100, 2);
    const result = applyMonoToStereo(input, 1.0);
    
    expect(result).toBe(input);
  });
});

describe('STEREO_CARD', () => {
  it('should have correct metadata', () => {
    expect(STEREO_CARD.meta.id).toBe('audio.stereo');
    expect(STEREO_CARD.meta.name).toBe('Stereo');
  });
});

// ============================================================================
// WIDTH TESTS
// ============================================================================

describe('applyWidth', () => {
  it('should narrow stereo image (width < 1)', () => {
    const input = createTestBuffer(100);
    const result = applyWidth(input, 0.5);
    
    expect(result.channels).toHaveLength(2);
    // Stereo image should be narrower
    const originalDiff = Math.abs(input.channels[0][50] - input.channels[1][50]);
    const narrowDiff = Math.abs(result.channels[0][50] - result.channels[1][50]);
    expect(narrowDiff).toBeLessThan(originalDiff);
  });
  
  it('should widen stereo image (width > 1)', () => {
    const input = createTestBuffer(100);
    const result = applyWidth(input, 1.5);
    
    expect(result.channels).toHaveLength(2);
    // Stereo image should be wider
    const originalDiff = Math.abs(input.channels[0][50] - input.channels[1][50]);
    const wideDiff = Math.abs(result.channels[0][50] - result.channels[1][50]);
    expect(wideDiff).toBeGreaterThan(originalDiff);
  });
  
  it('should collapse to mono (width = 0)', () => {
    const input = createTestBuffer(100);
    const result = applyWidth(input, 0);
    
    expect(result.channels[0][50]).toBeCloseTo(result.channels[1][50]);
  });
});

describe('WIDTH_CARD', () => {
  it('should have correct metadata', () => {
    expect(WIDTH_CARD.meta.id).toBe('audio.width');
    expect(WIDTH_CARD.meta.name).toBe('Width');
  });
});

// ============================================================================
// DELAY COMP TESTS
// ============================================================================

describe('applyDelayComp', () => {
  it('should add delay samples', () => {
    const input = createTestBuffer(100);
    const result = applyDelayComp(input, 50);
    
    expect(result.length).toBe(150);
    expect(result.channels[0][0]).toBe(0);
    expect(result.channels[0][49]).toBe(0);
    expect(result.channels[0][50]).toBe(input.channels[0][0]);
  });
  
  it('should pass through with zero delay', () => {
    const input = createTestBuffer(100);
    const result = applyDelayComp(input, 0);
    
    expect(result).toBe(input);
  });
});

describe('DELAY_COMP_CARD', () => {
  it('should have correct metadata', () => {
    expect(DELAY_COMP_CARD.meta.id).toBe('audio.delay-comp');
    expect(DELAY_COMP_CARD.meta.name).toBe('Delay Comp');
  });
});

// ============================================================================
// NORMALIZE TESTS
// ============================================================================

describe('findPeakLevel', () => {
  it('should find peak level', () => {
    const buffer = createAudioBuffer(100, 2, 48000);
    (buffer.channels[0] as Float32Array)[50] = 0.8;
    (buffer.channels[1] as Float32Array)[60] = -0.9;
    
    const peak = findPeakLevel(buffer);
    expect(peak).toBeCloseTo(0.9, 1);
  });
  
  it('should return 0 for silent buffer', () => {
    const buffer = createAudioBuffer(100, 2, 48000);
    const peak = findPeakLevel(buffer);
    expect(peak).toBe(0);
  });
});

describe('applyNormalize', () => {
  it('should normalize to target level', () => {
    const buffer = createAudioBuffer(100, 2, 48000);
    (buffer.channels[0] as Float32Array)[50] = 0.5;
    
    const result = applyNormalize(buffer, 1.0);
    const peak = findPeakLevel(result);
    expect(peak).toBeCloseTo(1.0);
  });
  
  it('should pass through silent buffer', () => {
    const buffer = createAudioBuffer(100, 2, 48000);
    const result = applyNormalize(buffer, 1.0);
    expect(result).toBe(buffer);
  });
});

describe('NORMALIZE_CARD', () => {
  it('should have correct metadata', () => {
    expect(NORMALIZE_CARD.meta.id).toBe('audio.normalize');
    expect(NORMALIZE_CARD.meta.name).toBe('Normalize');
  });
});

// ============================================================================
// TRIM TESTS
// ============================================================================

describe('findFirstSound', () => {
  it('should find first sample above threshold', () => {
    const buffer = createAudioBuffer(100, 2, 48000);
    (buffer.channels[0] as Float32Array).fill(0);
    (buffer.channels[0] as Float32Array)[20] = 0.5;
    
    const first = findFirstSound(buffer, 0.1);
    expect(first).toBe(20);
  });
  
  it('should return length for silent buffer', () => {
    const buffer = createAudioBuffer(100, 2, 48000);
    const first = findFirstSound(buffer, 0.1);
    expect(first).toBe(100);
  });
});

describe('findLastSound', () => {
  it('should find last sample above threshold', () => {
    const buffer = createAudioBuffer(100, 2, 48000);
    (buffer.channels[0] as Float32Array).fill(0);
    (buffer.channels[0] as Float32Array)[80] = 0.5;
    
    const last = findLastSound(buffer, 0.1);
    expect(last).toBe(80);
  });
  
  it('should return 0 for silent buffer', () => {
    const buffer = createAudioBuffer(100, 2, 48000);
    const last = findLastSound(buffer, 0.1);
    expect(last).toBe(0);
  });
});

describe('applyTrim', () => {
  it('should remove silence from start and end', () => {
    const buffer = createAudioBuffer(100, 2, 48000);
    (buffer.channels[0] as Float32Array).fill(0);
    for (let i = 30; i < 70; i++) {
      (buffer.channels[0] as Float32Array)[i] = 0.5;
    }
    
    const result = applyTrim(buffer, 0.1, 5);
    expect(result.length).toBeLessThan(buffer.length);
    expect(result.length).toBeGreaterThan(0);
  });
  
  it('should return empty buffer for all silence', () => {
    const buffer = createAudioBuffer(100, 2, 48000);
    const result = applyTrim(buffer, 0.1, 5);
    expect(result.length).toBe(0);
  });
});

describe('TRIM_CARD', () => {
  it('should have correct metadata', () => {
    expect(TRIM_CARD.meta.id).toBe('audio.trim');
    expect(TRIM_CARD.meta.name).toBe('Trim');
  });
});

// ============================================================================
// FADE TESTS
// ============================================================================

describe('calculateFadeGain', () => {
  it('should calculate linear fade', () => {
    expect(calculateFadeGain(0, 'linear')).toBe(0);
    expect(calculateFadeGain(0.5, 'linear')).toBe(0.5);
    expect(calculateFadeGain(1, 'linear')).toBe(1);
  });
  
  it('should calculate exponential fade', () => {
    expect(calculateFadeGain(0, 'exponential')).toBe(0);
    expect(calculateFadeGain(0.5, 'exponential')).toBe(0.25);
    expect(calculateFadeGain(1, 'exponential')).toBe(1);
  });
  
  it('should calculate s-curve fade', () => {
    const mid = calculateFadeGain(0.5, 's-curve');
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });
  
  it('should calculate logarithmic fade', () => {
    expect(calculateFadeGain(0, 'logarithmic')).toBe(0);
    expect(calculateFadeGain(0.25, 'logarithmic')).toBe(0.5);
    expect(calculateFadeGain(1, 'logarithmic')).toBe(1);
  });
});

describe('applyFade', () => {
  it('should apply fade in', () => {
    const buffer = createTestBuffer(1000);
    const result = applyFade(buffer, {
      ...DEFAULT_FADE_PARAMS,
      fadeIn: true,
      fadeOut: false,
      fadeInMs: 10,
    }, 48000);
    
    // First sample should be silent or very quiet
    expect(Math.abs(result.channels[0][0])).toBeLessThan(0.1);
    // Later samples should be at full volume
    expect(Math.abs(result.channels[0][500])).toBeGreaterThan(0.3);
  });
  
  it('should apply fade out', () => {
    const buffer = createTestBuffer(1000);
    const result = applyFade(buffer, {
      ...DEFAULT_FADE_PARAMS,
      fadeIn: false,
      fadeOut: true,
      fadeOutMs: 10,
    }, 48000);
    
    // Early samples should be at full volume
    expect(Math.abs(result.channels[0][100])).toBeGreaterThan(0.3);
    // Last sample should be silent or very quiet
    expect(Math.abs(result.channels[0][999])).toBeLessThan(0.1);
  });
  
  it('should apply both fades', () => {
    const buffer = createTestBuffer(1000);
    const result = applyFade(buffer, {
      ...DEFAULT_FADE_PARAMS,
      fadeIn: true,
      fadeOut: true,
      fadeInMs: 10,
      fadeOutMs: 10,
    }, 48000);
    
    // First and last samples should be quiet
    expect(Math.abs(result.channels[0][0])).toBeLessThan(0.1);
    expect(Math.abs(result.channels[0][999])).toBeLessThan(0.1);
    // Middle should be at full volume
    expect(Math.abs(result.channels[0][500])).toBeGreaterThan(0.3);
  });
});

describe('FADE_CARD', () => {
  it('should have correct metadata', () => {
    expect(FADE_CARD.meta.id).toBe('audio.fade');
    expect(FADE_CARD.meta.name).toBe('Fade');
  });
  
  it('should have correct signature', () => {
    expect(FADE_CARD.signature.params).toHaveLength(6);
  });
});
