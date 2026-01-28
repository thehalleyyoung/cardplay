/**
 * @fileoverview Tests for Voice<P> and Pitch System.
 */

import { describe, it, expect } from 'vitest';
import {
  // MIDI Pitch
  createMIDIPitch,
  isMIDIPitch,
  
  // Microtonal Pitch
  createMicrotonalPitch,
  isMicrotonalPitch,
  
  // Just Intonation
  createJustPitch,
  isJustPitch,
  
  // Carnatic Swara
  createSwaraPitch,
  isSwaraPitch,
  
  // Arabic Maqam
  createMaqamPitch,
  isMaqamPitch,
  
  // Gamelan
  createGamelanPitch,
  isGamelanPitch,
  
  // Voice
  Articulation,
  
  // Note Event
  createNote,
  
  // Pitch Operations
  pitchToMIDI,
  midiToPitch,
  transposePitch,
  pitchEquals,
  pitchDistance,
  quantizePitch,
  noteToString,
} from './voice';

// ============================================================================
// MIDI PITCH TESTS
// ============================================================================

describe('MIDIPitch', () => {
  it('should create a valid MIDI pitch', () => {
    const pitch = createMIDIPitch(60);
    expect(pitch.value).toBe(60);
    expect(pitch.system).toBe('midi');
    expect(isMIDIPitch(pitch)).toBe(true);
  });

  it('should convert to MIDI', () => {
    const pitch = createMIDIPitch(69); // A4
    expect(pitch.toMIDI()).toBe(69);
  });

  it('should convert to cents', () => {
    const pitch = createMIDIPitch(69); // A4
    expect(pitch.toCents()).toBe(0); // A4 is reference
    
    const c4 = createMIDIPitch(60);
    expect(c4.toCents()).toBe(-900); // 9 semitones below A4
  });

  it('should throw on invalid range', () => {
    expect(() => createMIDIPitch(-1)).toThrow(RangeError);
    expect(() => createMIDIPitch(128)).toThrow(RangeError);
  });

  it('should round fractional MIDI notes', () => {
    const pitch = createMIDIPitch(60.7);
    expect(pitch.value).toBe(61);
  });
});

// ============================================================================
// MICROTONAL PITCH TESTS
// ============================================================================

describe('MicrotonalPitch', () => {
  it('should create a microtonal pitch', () => {
    const pitch = createMicrotonalPitch(50, 440); // 50 cents above A4
    expect(pitch.cents).toBe(50);
    expect(pitch.reference).toBe(440);
    expect(pitch.system).toBe('microtonal');
    expect(isMicrotonalPitch(pitch)).toBe(true);
  });

  it('should convert to MIDI', () => {
    const pitch = createMicrotonalPitch(100, 440); // 100 cents = 1 semitone
    expect(pitch.toMIDI()).toBe(70); // A#4
  });

  it('should use default reference', () => {
    const pitch = createMicrotonalPitch(0);
    expect(pitch.reference).toBe(440);
  });
});

// ============================================================================
// JUST INTONATION TESTS
// ============================================================================

describe('JustPitch', () => {
  it('should create a just pitch', () => {
    const pitch = createJustPitch(3, 2, 60); // Perfect fifth above C4
    expect(pitch.ratio).toEqual([3, 2]);
    expect(pitch.referenceMidi).toBe(60);
    expect(pitch.system).toBe('just');
    expect(isJustPitch(pitch)).toBe(true);
  });

  it('should calculate correct cents for perfect fifth', () => {
    const pitch = createJustPitch(3, 2, 60);
    // Perfect fifth in just intonation is about 702 cents
    expect(Math.round(pitch.toMIDI() * 100) / 100).toBeCloseTo(67.02, 1);
  });

  it('should use default reference', () => {
    const pitch = createJustPitch(2, 1); // Octave
    expect(pitch.referenceMidi).toBe(60);
  });
});

// ============================================================================
// SWARA PITCH TESTS
// ============================================================================

describe('SwaraPitch', () => {
  it('should create a swara pitch', () => {
    const pitch = createSwaraPitch('Sa', 0, 1);
    expect(pitch.swara).toBe('Sa');
    expect(pitch.shruti).toBe(0);
    expect(pitch.octave).toBe(1);
    expect(pitch.system).toBe('swara');
    expect(isSwaraPitch(pitch)).toBe(true);
  });

  it('should include raga when provided', () => {
    const pitch = createSwaraPitch('Ga', 4, 1, 'Shankarabharanam');
    expect(pitch.raga).toBe('Shankarabharanam');
  });

  it('should convert to MIDI', () => {
    const sa = createSwaraPitch('Sa', 0, 1);
    expect(sa.toMIDI()).toBe(60); // Sa = C4
  });
});

// ============================================================================
// MAQAM PITCH TESTS
// ============================================================================

describe('MaqamPitch', () => {
  it('should create a maqam pitch', () => {
    const pitch = createMaqamPitch('Rast', 0, 4);
    expect(pitch.note).toBe('Rast');
    expect(pitch.quarterTone).toBe(0);
    expect(pitch.octave).toBe(4);
    expect(pitch.system).toBe('maqam');
    expect(isMaqamPitch(pitch)).toBe(true);
  });

  it('should include maqam when provided', () => {
    const pitch = createMaqamPitch('Sika', 0, 4, 'Bayati');
    expect(pitch.maqam).toBe('Bayati');
  });

  it('should handle quarter tones', () => {
    const sika = createMaqamPitch('Sika', 0, 4);
    const sikaUp = createMaqamPitch('Sika', 1, 4);
    expect(sikaUp.toMIDI() - sika.toMIDI()).toBe(0.5);
  });
});

// ============================================================================
// GAMELAN PITCH TESTS
// ============================================================================

describe('GamelanPitch', () => {
  it('should create a gamelan pitch', () => {
    const pitch = createGamelanPitch('slendro', 1, 'mid');
    expect(pitch.laras).toBe('slendro');
    expect(pitch.tone).toBe(1);
    expect(pitch.register).toBe('mid');
    expect(pitch.system).toBe('gamelan');
    expect(isGamelanPitch(pitch)).toBe(true);
  });

  it('should handle different registers', () => {
    const low = createGamelanPitch('slendro', 1, 'low');
    const mid = createGamelanPitch('slendro', 1, 'mid');
    const high = createGamelanPitch('slendro', 1, 'high');
    
    expect(mid.toMIDI() - low.toMIDI()).toBe(12); // Octave
    expect(high.toMIDI() - mid.toMIDI()).toBe(12); // Octave
  });
});

// ============================================================================
// NOTE EVENT TESTS
// ============================================================================

describe('createNote', () => {
  it('should create a note with defaults', () => {
    const pitch = createMIDIPitch(60);
    const note = createNote({ pitch });
    
    expect(note.kind).toBe('note');
    expect(note.start).toBe(0);
    expect(note.duration).toBe(480);
    expect(note.payload.pitch).toBe(pitch);
    expect(note.payload.velocity).toBe(100);
  });

  it('should apply custom options', () => {
    const pitch = createMIDIPitch(64);
    const note = createNote({
      pitch,
      start: 960,
      duration: 240,
      velocity: 80,
      channel: 2,
      articulation: Articulation.Staccato,
    });
    
    expect(note.start).toBe(960);
    expect(note.duration).toBe(240);
    expect(note.payload.velocity).toBe(80);
    expect(note.payload.channel).toBe(2);
    expect(note.payload.articulation).toBe(Articulation.Staccato);
  });

  it('should include envelope when provided', () => {
    const pitch = createMIDIPitch(60);
    const envelope = { attack: 10, decay: 50, sustain: 0.7, release: 100 };
    const note = createNote({ pitch, envelope });
    
    expect(note.payload.envelope).toEqual(envelope);
  });
});

// ============================================================================
// PITCH OPERATIONS TESTS
// ============================================================================

describe('pitchToMIDI', () => {
  it('should convert any pitch to MIDI', () => {
    expect(pitchToMIDI(createMIDIPitch(60))).toBe(60);
    expect(pitchToMIDI(createMicrotonalPitch(100))).toBe(70);
  });
});

describe('midiToPitch', () => {
  it('should create MIDI pitch by default', () => {
    const pitch = midiToPitch(60);
    expect(isMIDIPitch(pitch)).toBe(true);
    expect(pitch.value).toBe(60);
  });

  it('should create microtonal pitch when specified', () => {
    const pitch = midiToPitch(69, 'microtonal');
    expect(isMicrotonalPitch(pitch)).toBe(true);
    expect(pitch.cents).toBe(0); // A4
  });
});

describe('transposePitch', () => {
  it('should transpose MIDI pitch', () => {
    const pitch = createMIDIPitch(60);
    const transposed = transposePitch(pitch, 5);
    expect(transposed.toMIDI()).toBe(65);
  });

  it('should transpose microtonal pitch', () => {
    const pitch = createMicrotonalPitch(0);
    const transposed = transposePitch(pitch, 2);
    expect(transposed.cents).toBe(200);
  });

  it('should handle negative transposition', () => {
    const pitch = createMIDIPitch(60);
    const transposed = transposePitch(pitch, -12);
    expect(transposed.toMIDI()).toBe(48);
  });
});

describe('pitchEquals', () => {
  it('should compare MIDI pitches', () => {
    const a = createMIDIPitch(60);
    const b = createMIDIPitch(60);
    const c = createMIDIPitch(61);
    
    expect(pitchEquals(a, b)).toBe(true);
    expect(pitchEquals(a, c)).toBe(false);
  });

  it('should compare microtonal pitches', () => {
    const a = createMicrotonalPitch(50);
    const b = createMicrotonalPitch(50);
    const c = createMicrotonalPitch(51);
    
    expect(pitchEquals(a, b)).toBe(true);
    expect(pitchEquals(a, c)).toBe(false);
  });

  it('should compare just pitches', () => {
    const a = createJustPitch(3, 2, 60);
    const b = createJustPitch(3, 2, 60);
    const c = createJustPitch(4, 3, 60);
    
    expect(pitchEquals(a, b)).toBe(true);
    expect(pitchEquals(a, c)).toBe(false);
  });
});

describe('pitchDistance', () => {
  it('should calculate distance in cents', () => {
    const a = createMIDIPitch(60);
    const b = createMIDIPitch(72);
    
    expect(pitchDistance(a, b)).toBe(1200); // Octave
  });
});

describe('quantizePitch', () => {
  it('should quantize to major scale', () => {
    const majorScale = [0, 2, 4, 5, 7, 9, 11];
    
    // C# should quantize to C or D
    const cSharp = createMIDIPitch(61);
    const quantized = quantizePitch(cSharp, majorScale);
    expect([60, 62]).toContain(quantized.toMIDI());
  });

  it('should handle different roots', () => {
    const majorScale = [0, 2, 4, 5, 7, 9, 11];
    
    // A with G root - A is degree 2 (whole step from G) which is in G major
    const a4 = createMIDIPitch(69);
    const quantized = quantizePitch(a4, majorScale, 7); // G major
    // A is a major second above G, which is in the major scale
    expect(quantized.toMIDI()).toBe(69);
  });
});

describe('noteToString', () => {
  it('should format MIDI pitch', () => {
    const pitch = createMIDIPitch(60);
    expect(noteToString(pitch)).toBe('C4');
    
    const a4 = createMIDIPitch(69);
    expect(noteToString(a4)).toBe('A4');
  });

  it('should format just pitch with ratio', () => {
    const pitch = createJustPitch(3, 2, 60);
    expect(noteToString(pitch)).toContain('(3/2)');
  });

  it('should format swara pitch', () => {
    const pitch = createSwaraPitch('Sa', 0, 1);
    expect(noteToString(pitch)).toBe('Sa');
    
    const low = createSwaraPitch('Sa', 0, 0);
    expect(noteToString(low)).toBe('Sa.');
    
    const high = createSwaraPitch('Sa', 0, 2);
    expect(noteToString(high)).toBe('Sa\'');
  });

  it('should format maqam pitch', () => {
    const pitch = createMaqamPitch('Rast', 0, 4);
    expect(noteToString(pitch)).toBe('Rast4');
    
    const up = createMaqamPitch('Sika', 1, 4);
    expect(noteToString(up)).toBe('Sika↑4');
  });

  it('should format gamelan pitch', () => {
    const pitch = createGamelanPitch('slendro', 1, 'mid');
    expect(noteToString(pitch)).toBe('S1');
    
    const high = createGamelanPitch('pelog', 3, 'high');
    expect(noteToString(high)).toBe('P3\'');
  });
});
