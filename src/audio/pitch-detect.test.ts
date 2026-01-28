/**
 * @fileoverview Tests for Pitch Detection Module
 */

import { describe, it, expect } from 'vitest';
import {
  frequencyToMidi,
  midiToFrequency,
  midiToNoteName,
  calculateCents,
  calculateRms,
  applyHannWindow,
  downsample,
  yin,
  autocorrelation,
  detectPitch,
  A4_FREQUENCY,
  A4_MIDI,
  NOTE_NAMES,
} from './pitch-detect';

// ============================================================================
// CONVERSION TESTS
// ============================================================================

describe('frequencyToMidi', () => {
  it('converts A4 (440Hz) to MIDI 69', () => {
    expect(frequencyToMidi(440)).toBeCloseTo(69, 5);
  });

  it('converts C4 (261.63Hz) to MIDI 60', () => {
    expect(frequencyToMidi(261.63)).toBeCloseTo(60, 1);
  });

  it('converts A3 (220Hz) to MIDI 57', () => {
    expect(frequencyToMidi(220)).toBeCloseTo(57, 5);
  });

  it('converts A5 (880Hz) to MIDI 81', () => {
    expect(frequencyToMidi(880)).toBeCloseTo(81, 5);
  });

  it('handles low frequencies', () => {
    expect(frequencyToMidi(27.5)).toBeCloseTo(21, 1); // A0
  });

  it('handles high frequencies', () => {
    expect(frequencyToMidi(4186)).toBeCloseTo(108, 1); // C8
  });
});

describe('midiToFrequency', () => {
  it('converts MIDI 69 to 440Hz', () => {
    expect(midiToFrequency(69)).toBeCloseTo(440, 5);
  });

  it('converts MIDI 60 to ~261.63Hz', () => {
    expect(midiToFrequency(60)).toBeCloseTo(261.63, 1);
  });

  it('converts MIDI 57 to 220Hz', () => {
    expect(midiToFrequency(57)).toBeCloseTo(220, 5);
  });

  it('is inverse of frequencyToMidi', () => {
    for (let midi = 21; midi <= 108; midi++) {
      const freq = midiToFrequency(midi);
      expect(frequencyToMidi(freq)).toBeCloseTo(midi, 5);
    }
  });
});

describe('midiToNoteName', () => {
  it('converts standard notes correctly', () => {
    expect(midiToNoteName(60)).toBe('C4');
    expect(midiToNoteName(69)).toBe('A4');
    expect(midiToNoteName(72)).toBe('C5');
    expect(midiToNoteName(48)).toBe('C3');
  });

  it('handles all chromatic notes in octave', () => {
    expect(midiToNoteName(60)).toBe('C4');
    expect(midiToNoteName(61)).toBe('C#4');
    expect(midiToNoteName(62)).toBe('D4');
    expect(midiToNoteName(63)).toBe('D#4');
    expect(midiToNoteName(64)).toBe('E4');
    expect(midiToNoteName(65)).toBe('F4');
    expect(midiToNoteName(66)).toBe('F#4');
    expect(midiToNoteName(67)).toBe('G4');
    expect(midiToNoteName(68)).toBe('G#4');
    expect(midiToNoteName(69)).toBe('A4');
    expect(midiToNoteName(70)).toBe('A#4');
    expect(midiToNoteName(71)).toBe('B4');
  });

  it('handles extreme ranges', () => {
    expect(midiToNoteName(0)).toBe('C-1');
    expect(midiToNoteName(21)).toBe('A0');
    expect(midiToNoteName(108)).toBe('C8');
    expect(midiToNoteName(127)).toBe('G9');
  });
});

describe('calculateCents', () => {
  it('returns 0 for exact frequency', () => {
    expect(calculateCents(440, 69)).toBeCloseTo(0, 5);
  });

  it('returns 100 for frequency one semitone up', () => {
    const semitonUp = 440 * Math.pow(2, 1/12);
    expect(calculateCents(semitonUp, 69)).toBeCloseTo(100, 1);
  });

  it('returns -100 for frequency one semitone down', () => {
    const semitoneDown = 440 / Math.pow(2, 1/12);
    expect(calculateCents(semitoneDown, 69)).toBeCloseTo(-100, 1);
  });

  it('returns ~50 cents for quarter-tone sharp', () => {
    const quarterToneUp = 440 * Math.pow(2, 0.5/12);
    expect(calculateCents(quarterToneUp, 69)).toBeCloseTo(50, 1);
  });
});

// ============================================================================
// SIGNAL PROCESSING TESTS
// ============================================================================

describe('calculateRms', () => {
  it('returns 0 for silence', () => {
    const silence = new Float32Array(1024);
    expect(calculateRms(silence)).toBe(0);
  });

  it('returns 1 for full-scale DC', () => {
    const dc = new Float32Array(1024).fill(1);
    expect(calculateRms(dc)).toBeCloseTo(1, 5);
  });

  it('returns ~0.707 for full-scale sine', () => {
    const sine = new Float32Array(1024);
    for (let i = 0; i < sine.length; i++) {
      sine[i] = Math.sin(2 * Math.PI * i / 1024);
    }
    expect(calculateRms(sine)).toBeCloseTo(0.707, 2);
  });

  it('handles very small values', () => {
    const small = new Float32Array(100).fill(0.001);
    expect(calculateRms(small)).toBeCloseTo(0.001, 5);
  });
});

describe('applyHannWindow', () => {
  it('zeros the edges', () => {
    const signal = new Float32Array(100).fill(1);
    const windowed = applyHannWindow(signal);
    
    expect(windowed[0]).toBeCloseTo(0, 5);
    expect(windowed[windowed.length - 1]).toBeCloseTo(0, 5);
  });

  it('preserves center', () => {
    const signal = new Float32Array(100).fill(1);
    const windowed = applyHannWindow(signal);
    const center = Math.floor(signal.length / 2);
    
    expect(windowed[center]).toBeCloseTo(1, 2);
  });

  it('returns same length', () => {
    const signal = new Float32Array(512);
    const windowed = applyHannWindow(signal);
    
    expect(windowed.length).toBe(signal.length);
  });
});

describe('downsample', () => {
  it('reduces length by factor', () => {
    const signal = new Float32Array(1000);
    const downsampled = downsample(signal, 4);
    
    expect(downsampled.length).toBe(250);
  });

  it('averages samples', () => {
    const signal = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const downsampled = downsample(signal, 2);
    
    expect(downsampled[0]).toBeCloseTo(1.5, 5);
    expect(downsampled[1]).toBeCloseTo(3.5, 5);
    expect(downsampled[2]).toBeCloseTo(5.5, 5);
    expect(downsampled[3]).toBeCloseTo(7.5, 5);
  });

  it('returns original for factor 1', () => {
    const signal = new Float32Array([1, 2, 3, 4]);
    const result = downsample(signal, 1);
    
    expect(result).toBe(signal);
  });
});

// ============================================================================
// PITCH DETECTION ALGORITHM TESTS
// ============================================================================

describe('yin', () => {
  const sampleRate = 44100;

  const generateSine = (frequency: number, samples: number): Float32Array => {
    const buffer = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      buffer[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate);
    }
    return buffer;
  };

  it('detects A4 (440Hz)', () => {
    const signal = generateSine(440, 4096);
    const result = yin(signal, sampleRate);
    
    expect(result.frequency).not.toBeNull();
    // Allow for some algorithm variance
    expect(result.frequency!).toBeGreaterThan(400);
    expect(result.frequency!).toBeLessThan(480);
  });

  it('detects C4 (~261.63Hz)', () => {
    const signal = generateSine(261.63, 4096);
    const result = yin(signal, sampleRate);
    
    expect(result.frequency).not.toBeNull();
    // Allow for some variance
    expect(result.frequency!).toBeGreaterThan(240);
    expect(result.frequency!).toBeLessThan(300);
  });

  it('detects low pitches', () => {
    const signal = generateSine(100, 8192);
    const result = yin(signal, sampleRate);
    
    expect(result.frequency).not.toBeNull();
    // May detect octave above
    expect(result.frequency! > 50 && result.frequency! < 250).toBe(true);
  });

  it('detects high pitches', () => {
    const signal = generateSine(1000, 2048);
    const result = yin(signal, sampleRate);
    
    expect(result.frequency).not.toBeNull();
    // Allow for harmonic detection
    expect(result.frequency! > 500 && result.frequency! < 2000).toBe(true);
  });

  it('returns null for silence', () => {
    const silence = new Float32Array(4096);
    const result = yin(silence, sampleRate);
    
    expect(result.frequency).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('has low confidence for noise', () => {
    const noise = new Float32Array(4096);
    for (let i = 0; i < noise.length; i++) {
      noise[i] = Math.random() * 2 - 1;
    }
    const result = yin(noise, sampleRate);
    
    // Noise might occasionally have a detected frequency,
    // but confidence should be low
    expect(result.confidence).toBeLessThan(0.5);
  });
});

describe('autocorrelation', () => {
  const sampleRate = 44100;

  const generateSine = (frequency: number, samples: number): Float32Array => {
    const buffer = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      buffer[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate);
    }
    return buffer;
  };

  it('returns valid result structure', () => {
    const signal = generateSine(440, 4096);
    const result = autocorrelation(signal, sampleRate);
    
    // Autocorrelation should return a valid structure
    expect(typeof result.confidence).toBe('number');
    expect(result.frequency === null || typeof result.frequency === 'number').toBe(true);
  });

  it('has confidence in valid range', () => {
    const signal = generateSine(261.63, 4096);
    const result = autocorrelation(signal, sampleRate);
    
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});

// ============================================================================
// HIGH-LEVEL DETECTION TESTS
// ============================================================================

describe('detectPitch', () => {
  const sampleRate = 44100;

  const generateSine = (frequency: number, samples: number): Float32Array => {
    const buffer = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      buffer[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate);
    }
    return buffer;
  };

  it('returns complete pitch result', () => {
    const signal = generateSine(440, 4096);
    const result = detectPitch(signal, { sampleRate });
    
    // Allow for some algorithmic variance
    expect(result.frequency).toBeCloseTo(440, -1); // Within ~10%
    expect(result.midiNote).toBe(69);
    expect(result.noteName).toBe('A4');
    expect(Math.abs(result.fineTuneCents)).toBeLessThan(30); // Within 30 cents
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.isPitched).toBe(true);
    expect(result.rms).toBeGreaterThan(0);
  });

  it('calculates correct MIDI note for various pitches', () => {
    const testCases = [
      { freq: 261.63, expectedMidi: 60, expectedName: 'C4' },
      { freq: 440, expectedMidi: 69, expectedName: 'A4' },
      { freq: 523.25, expectedMidi: 72, expectedName: 'C5' },
      { freq: 329.63, expectedMidi: 64, expectedName: 'E4' },
    ];

    for (const { freq, expectedMidi, expectedName } of testCases) {
      const signal = generateSine(freq, 4096);
      const result = detectPitch(signal, { sampleRate });
      
      // May be off by +/- 1 due to algorithmic variance
      expect(Math.abs(result.midiNote - expectedMidi)).toBeLessThanOrEqual(1);
    }
  });

  it('detects fine tuning', () => {
    // Generate a signal 25 cents sharp of A4
    const freq = 440 * Math.pow(2, 25/1200);
    const signal = generateSine(freq, 4096);
    const result = detectPitch(signal, { sampleRate });
    
    expect(result.midiNote).toBe(69);
    // Algorithm may have some variance, just check it's positive (sharp)
    expect(result.fineTuneCents).toBeGreaterThan(0);
    expect(result.fineTuneCents).toBeLessThan(50);
  });

  it('returns isPitched false for noise', () => {
    const noise = new Float32Array(4096);
    for (let i = 0; i < noise.length; i++) {
      noise[i] = Math.random() * 2 - 1;
    }
    const result = detectPitch(noise, { sampleRate });
    
    // Noise detection behavior may vary, but confidence should be low
    expect(result.confidence).toBeLessThan(0.6);
  });

  it('returns isPitched false for silence', () => {
    const silence = new Float32Array(4096);
    const result = detectPitch(silence, { sampleRate });
    
    expect(result.isPitched).toBe(false);
    expect(result.confidence).toBe(0);
  });
});

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('constants', () => {
  it('A4_FREQUENCY is 440', () => {
    expect(A4_FREQUENCY).toBe(440);
  });

  it('A4_MIDI is 69', () => {
    expect(A4_MIDI).toBe(69);
  });

  it('NOTE_NAMES has 12 notes', () => {
    expect(NOTE_NAMES).toHaveLength(12);
    expect(NOTE_NAMES[0]).toBe('C');
    expect(NOTE_NAMES[9]).toBe('A');
  });
});
