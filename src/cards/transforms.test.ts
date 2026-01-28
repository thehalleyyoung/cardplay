/**
 * @fileoverview Tests for Transform Cards.
 * 
 * Comprehensive tests covering:
 * - Transpose (pitch shifting, octave wrapping)
 * - Quantize (grid snap, swing, humanize)
 * - Humanize (timing, velocity, duration variation)
 * - Scale Constrain (modes, velocity reduction)
 * - Velocity Curve (curve types)
 * - Time Stretch (factor application)
 * - Pattern Transform (reverse, invert, echo, stutter)
 * - Chord Voicing (spread, inversion)
 * - Utility functions (merge, dedupe, split)
 */

import { describe, it, expect } from 'vitest';
import {
  // Types
  MidiNoteEvent,
  ScaleDefinition,
  SCALES,
  
  // Transpose
  TransposeState,
  DEFAULT_TRANSPOSE_STATE,
  transposeNote,
  transposeEvents,
  
  // Quantize
  QuantizeGrid,
  QuantizeState,
  DEFAULT_QUANTIZE_STATE,
  gridToTicks,
  quantizeTime,
  quantizeEvents,
  
  // Humanize
  HumanizeState,
  DEFAULT_HUMANIZE_STATE,
  seededRandom,
  humanizeEvents,
  
  // Scale Constrain
  ScaleConstrainMode,
  ScaleConstrainState,
  DEFAULT_SCALE_CONSTRAIN_STATE,
  getScaleNoteClasses,
  isNoteInScale,
  findNearestScaleNote,
  constrainToScale,
  
  // Velocity Curve
  VelocityCurveType,
  VelocityCurveState,
  DEFAULT_VELOCITY_CURVE_STATE,
  applyVelocityCurve,
  applyVelocityCurveToEvents,
  
  // Time Stretch
  TimeStretchState,
  DEFAULT_TIME_STRETCH_STATE,
  timeStretchEvents,
  
  // Pattern Transform
  PatternTransformType,
  PatternTransformState,
  DEFAULT_PATTERN_TRANSFORM_STATE,
  reversePattern,
  invertPattern,
  rotatePattern,
  shufflePattern,
  echoPattern,
  stutterPattern,
  transformPattern,
  
  // Chord Voicing
  VoicingSpread,
  ChordVoicingState,
  DEFAULT_CHORD_VOICING_STATE,
  applyVoicingSpread,
  applyInversion,
  transformChordVoicing,
  
  // Utilities
  mergeOverlappingNotes,
  removeDuplicateNotes,
  splitLongNotes,
} from './transforms';

// ============================================================================
// TEST FIXTURES
// ============================================================================

function createTestEvent(
  note: number,
  startTime: number,
  duration: number = 100,
  velocity: number = 100
): MidiNoteEvent {
  return { note, startTime, duration, velocity, channel: 0 };
}

function createTestSequence(): readonly MidiNoteEvent[] {
  return [
    createTestEvent(60, 0, 100),
    createTestEvent(62, 100, 100),
    createTestEvent(64, 200, 100),
    createTestEvent(65, 300, 100),
  ];
}

// ============================================================================
// SCALES TESTS
// ============================================================================

describe('Scales', () => {
  it('should have all common scales defined', () => {
    const expectedScales = [
      'major', 'minor', 'harmonicMinor', 'melodicMinor',
      'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian',
      'pentatonicMajor', 'pentatonicMinor', 'blues',
      'wholeNote', 'chromatic', 'diminished', 'augmented',
    ];
    
    for (const scale of expectedScales) {
      expect(SCALES[scale]).toBeDefined();
      expect(SCALES[scale]!.name).toBeDefined();
      expect(SCALES[scale]!.intervals.length).toBeGreaterThan(0);
    }
  });
  
  it('should have correct major scale intervals', () => {
    expect(SCALES.major!.intervals).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });
  
  it('should have correct minor scale intervals', () => {
    expect(SCALES.minor!.intervals).toEqual([0, 2, 3, 5, 7, 8, 10]);
  });
  
  it('should have 12 notes in chromatic scale', () => {
    expect(SCALES.chromatic!.intervals.length).toBe(12);
  });
  
  it('should have 5 notes in pentatonic scales', () => {
    expect(SCALES.pentatonicMajor!.intervals.length).toBe(5);
    expect(SCALES.pentatonicMinor!.intervals.length).toBe(5);
  });
  
  it('should have 6 notes in whole tone scale', () => {
    expect(SCALES.wholeNote!.intervals.length).toBe(6);
  });
});

// ============================================================================
// TRANSPOSE TESTS
// ============================================================================

describe('Transpose', () => {
  describe('Default State', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_TRANSPOSE_STATE.semitones).toBe(0);
      expect(DEFAULT_TRANSPOSE_STATE.octaves).toBe(0);
      expect(DEFAULT_TRANSPOSE_STATE.constrainToRange).toBe(true);
      expect(DEFAULT_TRANSPOSE_STATE.minNote).toBe(0);
      expect(DEFAULT_TRANSPOSE_STATE.maxNote).toBe(127);
    });
  });
  
  describe('transposeNote', () => {
    it('should transpose up by semitones', () => {
      const result = transposeNote(60, { ...DEFAULT_TRANSPOSE_STATE, semitones: 5 });
      expect(result).toBe(65);
    });
    
    it('should transpose down by semitones', () => {
      const result = transposeNote(60, { ...DEFAULT_TRANSPOSE_STATE, semitones: -5 });
      expect(result).toBe(55);
    });
    
    it('should transpose by octaves', () => {
      const result = transposeNote(60, { ...DEFAULT_TRANSPOSE_STATE, octaves: 1 });
      expect(result).toBe(72);
    });
    
    it('should combine semitones and octaves', () => {
      const result = transposeNote(60, { ...DEFAULT_TRANSPOSE_STATE, semitones: 5, octaves: 1 });
      expect(result).toBe(77); // 60 + 12 + 5
    });
    
    it('should clamp to max note', () => {
      const result = transposeNote(120, { ...DEFAULT_TRANSPOSE_STATE, semitones: 20 });
      expect(result).toBe(127);
    });
    
    it('should clamp to min note', () => {
      const result = transposeNote(10, { ...DEFAULT_TRANSPOSE_STATE, semitones: -20 });
      expect(result).toBe(0);
    });
    
    it('should respect custom range', () => {
      const state: TransposeState = {
        ...DEFAULT_TRANSPOSE_STATE,
        semitones: 24,
        minNote: 36,
        maxNote: 96,
      };
      const result = transposeNote(80, state);
      expect(result).toBe(96);
    });
    
    it('should wrap octave when enabled', () => {
      const state: TransposeState = {
        ...DEFAULT_TRANSPOSE_STATE,
        semitones: 20,
        maxNote: 72,
        wrapOctave: true,
      };
      const result = transposeNote(60, state);
      expect(result).toBeLessThanOrEqual(72);
      expect((result - 60) % 12).toBe(8); // Same note class (C + 20 = E)
    });
    
    it('should not constrain when disabled', () => {
      const state: TransposeState = {
        ...DEFAULT_TRANSPOSE_STATE,
        semitones: 100,
        constrainToRange: false,
      };
      const result = transposeNote(60, state);
      expect(result).toBe(160);
    });
  });
  
  describe('transposeEvents', () => {
    it('should transpose all events', () => {
      const events = createTestSequence();
      const state: TransposeState = { ...DEFAULT_TRANSPOSE_STATE, semitones: 5 };
      const result = transposeEvents(events, state);
      
      expect(result.length).toBe(4);
      expect(result[0]!.note).toBe(65);
      expect(result[1]!.note).toBe(67);
      expect(result[2]!.note).toBe(69);
      expect(result[3]!.note).toBe(70);
    });
    
    it('should preserve other event properties', () => {
      const events = [createTestEvent(60, 100, 200, 80)];
      const result = transposeEvents(events, { ...DEFAULT_TRANSPOSE_STATE, semitones: 5 });
      
      expect(result[0]!.startTime).toBe(100);
      expect(result[0]!.duration).toBe(200);
      expect(result[0]!.velocity).toBe(80);
      expect(result[0]!.channel).toBe(0);
    });
  });
});

// ============================================================================
// QUANTIZE TESTS
// ============================================================================

describe('Quantize', () => {
  describe('Default State', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_QUANTIZE_STATE.grid).toBe(0.0625); // 16th
      expect(DEFAULT_QUANTIZE_STATE.strength).toBe(1);
      expect(DEFAULT_QUANTIZE_STATE.swing).toBe(0);
      expect(DEFAULT_QUANTIZE_STATE.quantizeStart).toBe(true);
      expect(DEFAULT_QUANTIZE_STATE.quantizeEnd).toBe(false);
    });
  });
  
  describe('gridToTicks', () => {
    it('should convert whole note', () => {
      expect(gridToTicks(1, 480)).toBe(1920); // 4 beats * 480
    });
    
    it('should convert quarter note', () => {
      expect(gridToTicks(0.25, 480)).toBe(480);
    });
    
    it('should convert 16th note', () => {
      expect(gridToTicks(0.0625, 480)).toBe(120);
    });
    
    it('should convert triplet eighth', () => {
      const ticks = gridToTicks('triplet-8', 480);
      expect(ticks).toBeCloseTo(160); // 240 * 2/3
    });
    
    it('should convert triplet 16th', () => {
      const ticks = gridToTicks('triplet-16', 480);
      expect(ticks).toBeCloseTo(80); // 120 * 2/3
    });
  });
  
  describe('quantizeTime', () => {
    it('should snap to nearest grid point', () => {
      const result = quantizeTime(125, 120, 1); // Slightly past 16th note
      expect(result).toBe(120);
    });
    
    it('should apply partial strength', () => {
      const result = quantizeTime(125, 120, 0.5); // 50% strength
      // Original: 125, Target: 120, Diff: -5, Half: -2.5
      expect(result).toBeCloseTo(122.5);
    });
    
    it('should not quantize at strength 0', () => {
      const result = quantizeTime(125, 120, 0);
      expect(result).toBe(125);
    });
    
    it('should apply swing on off-beats', () => {
      const result = quantizeTime(120, 120, 1, 0.5, true);
      // Swing adds 50% * 0.5 * 120 = 30 ticks
      expect(result).toBe(150);
    });
    
    it('should not swing on-beats', () => {
      const result = quantizeTime(0, 120, 1, 0.5, false);
      expect(result).toBe(0);
    });
  });
  
  describe('quantizeEvents', () => {
    it('should quantize event start times', () => {
      const events = [createTestEvent(60, 125)];
      const state: QuantizeState = { ...DEFAULT_QUANTIZE_STATE, grid: 0.0625 };
      const result = quantizeEvents(events, state, 480);
      
      expect(result[0]!.startTime).toBe(120);
    });
    
    it('should preserve duration when not quantizing end', () => {
      const events = [createTestEvent(60, 125, 100)];
      const state: QuantizeState = { 
        ...DEFAULT_QUANTIZE_STATE, 
        grid: 0.0625,
        quantizeEnd: false,
      };
      const result = quantizeEvents(events, state, 480);
      
      expect(result[0]!.duration).toBe(100);
    });
    
    it('should quantize end times when enabled', () => {
      const events = [createTestEvent(60, 0, 125)];
      const state: QuantizeState = { 
        ...DEFAULT_QUANTIZE_STATE, 
        grid: 0.0625,
        quantizeEnd: true,
      };
      const result = quantizeEvents(events, state, 480);
      
      // End was 125, quantized to 120, duration = 120
      expect(result[0]!.duration).toBe(120);
    });
    
    it('should ensure minimum duration of 1', () => {
      const events = [createTestEvent(60, 118, 4)];
      const state: QuantizeState = { 
        ...DEFAULT_QUANTIZE_STATE, 
        grid: 0.0625,
        quantizeEnd: true,
      };
      const result = quantizeEvents(events, state, 480);
      
      expect(result[0]!.duration).toBeGreaterThanOrEqual(1);
    });
  });
});

// ============================================================================
// HUMANIZE TESTS
// ============================================================================

describe('Humanize', () => {
  describe('Default State', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_HUMANIZE_STATE.timingVariation).toBe(0.1);
      expect(DEFAULT_HUMANIZE_STATE.velocityVariation).toBe(0.15);
      expect(DEFAULT_HUMANIZE_STATE.durationVariation).toBe(0.1);
    });
  });
  
  describe('seededRandom', () => {
    it('should produce consistent results with same seed', () => {
      const rand1 = seededRandom(12345);
      const rand2 = seededRandom(12345);
      
      expect(rand1()).toBeCloseTo(rand2());
      expect(rand1()).toBeCloseTo(rand2());
      expect(rand1()).toBeCloseTo(rand2());
    });
    
    it('should produce different results with different seeds', () => {
      const rand1 = seededRandom(12345);
      const rand2 = seededRandom(54321);
      
      expect(rand1()).not.toBeCloseTo(rand2());
    });
    
    it('should produce values between 0 and 1', () => {
      const rand = seededRandom(12345);
      for (let i = 0; i < 100; i++) {
        const val = rand();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(1);
      }
    });
  });
  
  describe('humanizeEvents', () => {
    it('should vary timing', () => {
      const events = createTestSequence();
      const state: HumanizeState = { 
        ...DEFAULT_HUMANIZE_STATE, 
        timingVariation: 0.5,
        velocityVariation: 0,
        durationVariation: 0,
      };
      const result = humanizeEvents(events, state);
      
      // At least some events should have different timing
      const timingChanged = result.some((e, i) => 
        Math.abs(e.startTime - events[i]!.startTime) > 0.1
      );
      expect(timingChanged).toBe(true);
    });
    
    it('should vary velocity', () => {
      const events = createTestSequence();
      const state: HumanizeState = { 
        ...DEFAULT_HUMANIZE_STATE, 
        timingVariation: 0,
        velocityVariation: 0.5,
        durationVariation: 0,
      };
      const result = humanizeEvents(events, state);
      
      const velocityChanged = result.some((e, i) => 
        e.velocity !== events[i]!.velocity
      );
      expect(velocityChanged).toBe(true);
    });
    
    it('should vary duration', () => {
      const events = createTestSequence();
      const state: HumanizeState = { 
        ...DEFAULT_HUMANIZE_STATE, 
        timingVariation: 0,
        velocityVariation: 0,
        durationVariation: 0.5,
      };
      const result = humanizeEvents(events, state);
      
      const durationChanged = result.some((e, i) => 
        Math.abs(e.duration - events[i]!.duration) > 0.1
      );
      expect(durationChanged).toBe(true);
    });
    
    it('should produce consistent results with seed', () => {
      const events = createTestSequence();
      const state: HumanizeState = { 
        ...DEFAULT_HUMANIZE_STATE, 
        seed: 12345,
      };
      
      const result1 = humanizeEvents(events, state);
      const result2 = humanizeEvents(events, state);
      
      expect(result1[0]!.startTime).toBeCloseTo(result2[0]!.startTime);
      expect(result1[0]!.velocity).toBe(result2[0]!.velocity);
    });
    
    it('should clamp velocity to valid range', () => {
      const events = [createTestEvent(60, 0, 100, 1)];
      const state: HumanizeState = { 
        ...DEFAULT_HUMANIZE_STATE, 
        velocityVariation: 1,
        seed: 99999, // Ensure we get negative offset
      };
      const result = humanizeEvents(events, state);
      
      expect(result[0]!.velocity).toBeGreaterThanOrEqual(1);
      expect(result[0]!.velocity).toBeLessThanOrEqual(127);
    });
    
    it('should ensure minimum duration', () => {
      const events = [createTestEvent(60, 0, 1, 100)];
      const state: HumanizeState = { 
        ...DEFAULT_HUMANIZE_STATE, 
        durationVariation: 1,
      };
      const result = humanizeEvents(events, state);
      
      expect(result[0]!.duration).toBeGreaterThanOrEqual(1);
    });
  });
});

// ============================================================================
// SCALE CONSTRAIN TESTS
// ============================================================================

describe('Scale Constrain', () => {
  describe('Default State', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_SCALE_CONSTRAIN_STATE.root).toBe(0);
      expect(DEFAULT_SCALE_CONSTRAIN_STATE.scale).toBe('major');
      expect(DEFAULT_SCALE_CONSTRAIN_STATE.mode).toBe('nearest');
    });
  });
  
  describe('getScaleNoteClasses', () => {
    it('should return C major notes', () => {
      const notes = getScaleNoteClasses(0, 'major');
      expect(notes).toEqual([0, 2, 4, 5, 7, 9, 11]);
    });
    
    it('should transpose to D major', () => {
      const notes = getScaleNoteClasses(2, 'major');
      expect(notes).toEqual([2, 4, 6, 7, 9, 11, 1]); // D E F# G A B C#
    });
    
    it('should wrap around 12', () => {
      const notes = getScaleNoteClasses(11, 'major'); // B major
      expect(notes.every(n => n >= 0 && n < 12)).toBe(true);
    });
  });
  
  describe('isNoteInScale', () => {
    it('should return true for C in C major', () => {
      expect(isNoteInScale(60, 0, 'major')).toBe(true);
    });
    
    it('should return true for E in C major', () => {
      expect(isNoteInScale(64, 0, 'major')).toBe(true);
    });
    
    it('should return false for C# in C major', () => {
      expect(isNoteInScale(61, 0, 'major')).toBe(false);
    });
    
    it('should work across octaves', () => {
      expect(isNoteInScale(48, 0, 'major')).toBe(true); // C3
      expect(isNoteInScale(72, 0, 'major')).toBe(true); // C5
      expect(isNoteInScale(49, 0, 'major')).toBe(false); // C#3
    });
  });
  
  describe('findNearestScaleNote', () => {
    it('should return same note if in scale', () => {
      expect(findNearestScaleNote(60, 0, 'major', 'nearest')).toBe(60);
    });
    
    it('should find nearest scale note', () => {
      // C# should go to C or D
      const result = findNearestScaleNote(61, 0, 'major', 'nearest');
      expect([60, 62]).toContain(result);
    });
    
    it('should find lower scale note', () => {
      const result = findNearestScaleNote(61, 0, 'major', 'lower');
      expect(result).toBe(60);
    });
    
    it('should find higher scale note', () => {
      const result = findNearestScaleNote(61, 0, 'major', 'higher');
      expect(result).toBe(62);
    });
  });
  
  describe('constrainToScale', () => {
    it('should constrain notes to scale', () => {
      const events = [
        createTestEvent(60, 0),  // C - in scale
        createTestEvent(61, 100), // C# - not in scale
        createTestEvent(62, 200), // D - in scale
      ];
      
      const result = constrainToScale(events, DEFAULT_SCALE_CONSTRAIN_STATE);
      
      expect(result[0]!.note).toBe(60);
      expect([60, 62]).toContain(result[1]!.note); // Should be C or D
      expect(result[2]!.note).toBe(62);
    });
    
    it('should remove notes in remove mode', () => {
      const events = [
        createTestEvent(60, 0),  // C - in scale
        createTestEvent(61, 100), // C# - not in scale
        createTestEvent(62, 200), // D - in scale
      ];
      
      const state: ScaleConstrainState = {
        ...DEFAULT_SCALE_CONSTRAIN_STATE,
        mode: 'remove',
      };
      
      const result = constrainToScale(events, state);
      
      expect(result.length).toBe(2);
      expect(result[0]!.note).toBe(60);
      expect(result[1]!.note).toBe(62);
    });
    
    it('should reduce velocity when enabled', () => {
      const events = [createTestEvent(61, 0, 100, 100)];
      
      const state: ScaleConstrainState = {
        ...DEFAULT_SCALE_CONSTRAIN_STATE,
        applyToVelocity: true,
        velocityReduction: 0.2,
      };
      
      const result = constrainToScale(events, state);
      
      expect(result[0]!.velocity).toBe(80); // 100 * 0.8
    });
    
    it('should not reduce velocity for in-scale notes', () => {
      const events = [createTestEvent(60, 0, 100, 100)]; // C is in scale
      
      const state: ScaleConstrainState = {
        ...DEFAULT_SCALE_CONSTRAIN_STATE,
        applyToVelocity: true,
        velocityReduction: 0.2,
      };
      
      const result = constrainToScale(events, state);
      
      expect(result[0]!.velocity).toBe(100);
    });
  });
});

// ============================================================================
// VELOCITY CURVE TESTS
// ============================================================================

describe('Velocity Curve', () => {
  describe('Default State', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_VELOCITY_CURVE_STATE.curveType).toBe('linear');
      expect(DEFAULT_VELOCITY_CURVE_STATE.inputMin).toBe(0);
      expect(DEFAULT_VELOCITY_CURVE_STATE.inputMax).toBe(127);
      expect(DEFAULT_VELOCITY_CURVE_STATE.outputMin).toBe(0);
      expect(DEFAULT_VELOCITY_CURVE_STATE.outputMax).toBe(127);
    });
  });
  
  describe('applyVelocityCurve', () => {
    it('should pass through with linear curve', () => {
      const result = applyVelocityCurve(64, DEFAULT_VELOCITY_CURVE_STATE);
      expect(result).toBe(64);
    });
    
    it('should return fixed velocity', () => {
      const state: VelocityCurveState = {
        ...DEFAULT_VELOCITY_CURVE_STATE,
        curveType: 'fixed',
        fixedVelocity: 100,
      };
      
      expect(applyVelocityCurve(50, state)).toBe(100);
      expect(applyVelocityCurve(127, state)).toBe(100);
    });
    
    it('should apply exponential curve', () => {
      const state: VelocityCurveState = {
        ...DEFAULT_VELOCITY_CURVE_STATE,
        curveType: 'exponential',
        curvature: 2,
      };
      
      // At 50% input, exponential^2 = 25%
      const result = applyVelocityCurve(64, state);
      expect(result).toBeLessThan(64);
    });
    
    it('should apply logarithmic curve', () => {
      const state: VelocityCurveState = {
        ...DEFAULT_VELOCITY_CURVE_STATE,
        curveType: 'logarithmic',
        curvature: 2,
      };
      
      // At 50% input, logarithmic = 70.7%
      const result = applyVelocityCurve(64, state);
      expect(result).toBeGreaterThan(64);
    });
    
    it('should apply S-curve', () => {
      const state: VelocityCurveState = {
        ...DEFAULT_VELOCITY_CURVE_STATE,
        curveType: 'scurve',
      };
      
      // S-curve should be close to linear at extremes
      const low = applyVelocityCurve(10, state);
      const high = applyVelocityCurve(120, state);
      const mid = applyVelocityCurve(64, state);
      
      expect(low).toBeLessThan(mid);
      expect(mid).toBeLessThan(high);
    });
    
    it('should map to output range', () => {
      const state: VelocityCurveState = {
        ...DEFAULT_VELOCITY_CURVE_STATE,
        outputMin: 50,
        outputMax: 100,
      };
      
      const low = applyVelocityCurve(0, state);
      const high = applyVelocityCurve(127, state);
      
      expect(low).toBe(50);
      expect(high).toBe(100);
    });
    
    it('should clamp to valid velocity range', () => {
      const state: VelocityCurveState = {
        ...DEFAULT_VELOCITY_CURVE_STATE,
        outputMin: 0,
        outputMax: 200,
      };
      
      const result = applyVelocityCurve(127, state);
      expect(result).toBeLessThanOrEqual(127);
      expect(result).toBeGreaterThanOrEqual(1);
    });
  });
  
  describe('applyVelocityCurveToEvents', () => {
    it('should apply curve to all events', () => {
      const events = [
        createTestEvent(60, 0, 100, 50),
        createTestEvent(62, 100, 100, 100),
      ];
      
      const state: VelocityCurveState = {
        ...DEFAULT_VELOCITY_CURVE_STATE,
        curveType: 'fixed',
        fixedVelocity: 80,
      };
      
      const result = applyVelocityCurveToEvents(events, state);
      
      expect(result[0]!.velocity).toBe(80);
      expect(result[1]!.velocity).toBe(80);
    });
  });
});

// ============================================================================
// TIME STRETCH TESTS
// ============================================================================

describe('Time Stretch', () => {
  describe('Default State', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_TIME_STRETCH_STATE.factor).toBe(1);
      expect(DEFAULT_TIME_STRETCH_STATE.preservePitch).toBe(true);
    });
  });
  
  describe('timeStretchEvents', () => {
    it('should double time at factor 2', () => {
      const events = [createTestEvent(60, 100, 50)];
      const result = timeStretchEvents(events, 2);
      
      expect(result[0]!.startTime).toBe(200);
      expect(result[0]!.duration).toBe(100);
    });
    
    it('should halve time at factor 0.5', () => {
      const events = [createTestEvent(60, 100, 50)];
      const result = timeStretchEvents(events, 0.5);
      
      expect(result[0]!.startTime).toBe(50);
      expect(result[0]!.duration).toBe(25);
    });
    
    it('should not change at factor 1', () => {
      const events = createTestSequence();
      const result = timeStretchEvents(events, 1);
      
      for (let i = 0; i < events.length; i++) {
        expect(result[i]!.startTime).toBe(events[i]!.startTime);
        expect(result[i]!.duration).toBe(events[i]!.duration);
      }
    });
    
    it('should preserve note and velocity', () => {
      const events = [createTestEvent(72, 100, 50, 80)];
      const result = timeStretchEvents(events, 2);
      
      expect(result[0]!.note).toBe(72);
      expect(result[0]!.velocity).toBe(80);
    });
  });
});

// ============================================================================
// PATTERN TRANSFORM TESTS
// ============================================================================

describe('Pattern Transform', () => {
  describe('Default State', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_PATTERN_TRANSFORM_STATE.type).toBe('reverse');
      expect(DEFAULT_PATTERN_TRANSFORM_STATE.invertCenter).toBe(60);
      expect(DEFAULT_PATTERN_TRANSFORM_STATE.echoCount).toBe(3);
    });
  });
  
  describe('reversePattern', () => {
    it('should reverse event order', () => {
      const events = createTestSequence();
      const result = reversePattern(events);
      
      // Check that notes are now in reverse order
      expect(result[0]!.note).toBe(65); // Was last
      expect(result[3]!.note).toBe(60); // Was first
    });
    
    it('should handle empty array', () => {
      const result = reversePattern([]);
      expect(result).toEqual([]);
    });
    
    it('should handle single event', () => {
      const events = [createTestEvent(60, 50, 100)];
      const result = reversePattern(events);
      
      expect(result.length).toBe(1);
      expect(result[0]!.note).toBe(60);
    });
  });
  
  describe('invertPattern', () => {
    it('should invert around center note', () => {
      const events = [createTestEvent(72, 0)]; // C5
      const result = invertPattern(events, 60); // Center at C4
      
      // 60 + (60 - 72) = 48 (C3)
      expect(result[0]!.note).toBe(48);
    });
    
    it('should keep center note unchanged', () => {
      const events = [createTestEvent(60, 0)];
      const result = invertPattern(events, 60);
      
      expect(result[0]!.note).toBe(60);
    });
    
    it('should clamp to valid range', () => {
      const events = [createTestEvent(0, 0)];
      const result = invertPattern(events, 60);
      
      expect(result[0]!.note).toBeLessThanOrEqual(127);
      expect(result[0]!.note).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('rotatePattern', () => {
    it('should rotate notes by 1 step', () => {
      const events = createTestSequence();
      const result = rotatePattern(events, 1);
      
      // Notes should be rotated
      expect(result[0]!.note).toBe(62); // Was at index 1
      expect(result[3]!.note).toBe(60); // Was at index 0
    });
    
    it('should handle empty array', () => {
      const result = rotatePattern([], 1);
      expect(result).toEqual([]);
    });
  });
  
  describe('shufflePattern', () => {
    it('should contain same notes', () => {
      const events = createTestSequence();
      const result = shufflePattern(events);
      
      const originalNotes = events.map(e => e.note).sort();
      const shuffledNotes = result.map(e => e.note).sort();
      
      expect(shuffledNotes).toEqual(originalNotes);
    });
    
    it('should preserve timing', () => {
      const events = createTestSequence();
      const result = shufflePattern(events);
      
      const originalTimes = events.map(e => e.startTime).sort();
      const shuffledTimes = result.map(e => e.startTime).sort();
      
      expect(shuffledTimes).toEqual(originalTimes);
    });
  });
  
  describe('echoPattern', () => {
    it('should add echo copies', () => {
      const events = [createTestEvent(60, 0, 50, 100)];
      const result = echoPattern(events, 3, 100, 0.7);
      
      expect(result.length).toBe(4); // Original + 3 echoes
    });
    
    it('should delay echoes', () => {
      const events = [createTestEvent(60, 0, 50, 100)];
      const result = echoPattern(events, 3, 100, 0.7);
      
      expect(result[0]!.startTime).toBe(0);
      expect(result[1]!.startTime).toBe(100);
      expect(result[2]!.startTime).toBe(200);
      expect(result[3]!.startTime).toBe(300);
    });
    
    it('should decay velocity', () => {
      const events = [createTestEvent(60, 0, 50, 100)];
      const result = echoPattern(events, 3, 100, 0.7);
      
      expect(result[0]!.velocity).toBe(100);
      expect(result[1]!.velocity).toBe(70);
      expect(result[2]!.velocity).toBe(49);
      expect(result[3]!.velocity).toBe(34);
    });
  });
  
  describe('stutterPattern', () => {
    it('should create repeated notes', () => {
      const events = [createTestEvent(60, 0, 100, 100)];
      const result = stutterPattern(events, 4, 4);
      
      expect(result.length).toBe(4);
    });
    
    it('should divide duration', () => {
      const events = [createTestEvent(60, 0, 100, 100)];
      const result = stutterPattern(events, 4, 4);
      
      // Each stutter is 100/4 * 0.9 = 22.5
      expect(result[0]!.duration).toBeCloseTo(22.5);
    });
    
    it('should decay velocity slightly', () => {
      const events = [createTestEvent(60, 0, 100, 100)];
      const result = stutterPattern(events, 4, 4);
      
      expect(result[0]!.velocity).toBe(100);
      expect(result[1]!.velocity).toBe(90);
      expect(result[2]!.velocity).toBe(80);
      expect(result[3]!.velocity).toBe(70);
    });
  });
  
  describe('transformPattern', () => {
    it('should apply reverse', () => {
      const events = createTestSequence();
      const state: PatternTransformState = { ...DEFAULT_PATTERN_TRANSFORM_STATE, type: 'reverse' };
      const result = transformPattern(events, state);
      
      expect(result[0]!.note).toBe(65);
    });
    
    it('should apply invert', () => {
      const events = [createTestEvent(72, 0)];
      const state: PatternTransformState = { 
        ...DEFAULT_PATTERN_TRANSFORM_STATE, 
        type: 'invert',
        invertCenter: 60,
      };
      const result = transformPattern(events, state);
      
      expect(result[0]!.note).toBe(48);
    });
    
    it('should apply retrograde (reverse + invert)', () => {
      const events = createTestSequence();
      const state: PatternTransformState = { 
        ...DEFAULT_PATTERN_TRANSFORM_STATE, 
        type: 'retrograde',
        invertCenter: 60,
      };
      const result = transformPattern(events, state);
      
      expect(result.length).toBe(4);
    });
    
    it('should apply expand', () => {
      const events = [createTestEvent(60, 100, 50)];
      const state: PatternTransformState = { ...DEFAULT_PATTERN_TRANSFORM_STATE, type: 'expand' };
      const result = transformPattern(events, state);
      
      expect(result[0]!.startTime).toBe(200);
      expect(result[0]!.duration).toBe(100);
    });
    
    it('should apply compress', () => {
      const events = [createTestEvent(60, 100, 50)];
      const state: PatternTransformState = { ...DEFAULT_PATTERN_TRANSFORM_STATE, type: 'compress' };
      const result = transformPattern(events, state);
      
      expect(result[0]!.startTime).toBe(50);
      expect(result[0]!.duration).toBe(25);
    });
  });
});

// ============================================================================
// CHORD VOICING TESTS
// ============================================================================

describe('Chord Voicing', () => {
  describe('Default State', () => {
    it('should have correct defaults', () => {
      expect(DEFAULT_CHORD_VOICING_STATE.spread).toBe('close');
      expect(DEFAULT_CHORD_VOICING_STATE.inversion).toBe(0);
      expect(DEFAULT_CHORD_VOICING_STATE.addBass).toBe(false);
    });
  });
  
  describe('applyVoicingSpread', () => {
    it('should keep close voicing sorted', () => {
      const notes = [64, 60, 67];
      const result = applyVoicingSpread(notes, 'close');
      
      expect(result).toEqual([60, 64, 67]);
    });
    
    it('should open every other note', () => {
      const notes = [60, 64, 67];
      const result = applyVoicingSpread(notes, 'open');
      
      expect(result[0]).toBe(60);
      expect(result[1]).toBe(76); // 64 + 12
      expect(result[2]).toBe(67);
    });
    
    it('should apply drop2', () => {
      const notes = [60, 64, 67, 72]; // C E G C
      const result = applyVoicingSpread(notes, 'drop2');
      
      // Second from top (G) drops an octave
      expect(result).toContain(55); // G down an octave
    });
    
    it('should apply quartal voicing', () => {
      const notes = [60, 64, 67];
      const result = applyVoicingSpread(notes, 'quartal');
      
      // Built in perfect 4ths from root
      expect(result[0]).toBe(60);
      expect(result[1]).toBe(65); // 60 + 5
      expect(result[2]).toBe(70); // 60 + 10
    });
  });
  
  describe('applyInversion', () => {
    it('should not change root position', () => {
      const notes = [60, 64, 67];
      const result = applyInversion(notes, 0);
      
      expect(result).toEqual([60, 64, 67]);
    });
    
    it('should apply first inversion', () => {
      const notes = [60, 64, 67];
      const result = applyInversion(notes, 1);
      
      // Root moves up an octave
      expect(result).toEqual([64, 67, 72]);
    });
    
    it('should apply second inversion', () => {
      const notes = [60, 64, 67];
      const result = applyInversion(notes, 2);
      
      // Root and third move up
      expect(result).toEqual([67, 72, 76]);
    });
  });
  
  describe('transformChordVoicing', () => {
    it('should combine spread and inversion', () => {
      const notes = [60, 64, 67];
      const state: ChordVoicingState = {
        ...DEFAULT_CHORD_VOICING_STATE,
        spread: 'close',
        inversion: 1,
      };
      
      const result = transformChordVoicing(notes, state);
      
      expect(result).toEqual([64, 67, 72]);
    });
    
    it('should apply octave offset', () => {
      const notes = [60, 64, 67];
      const state: ChordVoicingState = {
        ...DEFAULT_CHORD_VOICING_STATE,
        octave: 1,
      };
      
      const result = transformChordVoicing(notes, state);
      
      expect(result).toEqual([72, 76, 79]);
    });
    
    it('should add bass note', () => {
      const notes = [60, 64, 67];
      const state: ChordVoicingState = {
        ...DEFAULT_CHORD_VOICING_STATE,
        addBass: true,
        bassOctave: -1,
      };
      
      const result = transformChordVoicing(notes, state);
      
      expect(result[0]).toBe(48); // Bass note
      expect(result.length).toBe(4);
    });
    
    it('should limit voices', () => {
      const notes = [60, 64, 67, 72];
      const state: ChordVoicingState = {
        ...DEFAULT_CHORD_VOICING_STATE,
        voiceLimit: 3,
      };
      
      const result = transformChordVoicing(notes, state);
      
      expect(result.length).toBe(3);
    });
    
    it('should clamp to MIDI range', () => {
      const notes = [120, 124, 127];
      const state: ChordVoicingState = {
        ...DEFAULT_CHORD_VOICING_STATE,
        octave: 1,
      };
      
      const result = transformChordVoicing(notes, state);
      
      expect(result.every(n => n <= 127 && n >= 0)).toBe(true);
    });
    
    it('should remove duplicates', () => {
      const notes = [60, 60, 64, 67];
      const result = transformChordVoicing(notes, DEFAULT_CHORD_VOICING_STATE);
      
      expect(new Set(result).size).toBe(result.length);
    });
  });
});

// ============================================================================
// UTILITY FUNCTION TESTS
// ============================================================================

describe('Utility Functions', () => {
  describe('mergeOverlappingNotes', () => {
    it('should merge overlapping notes of same pitch', () => {
      const events = [
        createTestEvent(60, 0, 100),
        createTestEvent(60, 50, 100),
      ];
      
      const result = mergeOverlappingNotes(events);
      
      expect(result.length).toBe(1);
      expect(result[0]!.duration).toBe(150); // 0 to 150
    });
    
    it('should not merge non-overlapping notes', () => {
      const events = [
        createTestEvent(60, 0, 50),
        createTestEvent(60, 100, 50),
      ];
      
      const result = mergeOverlappingNotes(events);
      
      expect(result.length).toBe(2);
    });
    
    it('should not merge different pitches', () => {
      const events = [
        createTestEvent(60, 0, 100),
        createTestEvent(62, 50, 100),
      ];
      
      const result = mergeOverlappingNotes(events);
      
      expect(result.length).toBe(2);
    });
    
    it('should keep higher velocity', () => {
      const events = [
        createTestEvent(60, 0, 100, 80),
        createTestEvent(60, 50, 100, 100),
      ];
      
      const result = mergeOverlappingNotes(events);
      
      expect(result[0]!.velocity).toBe(100);
    });
  });
  
  describe('removeDuplicateNotes', () => {
    it('should remove duplicates at same time', () => {
      const events = [
        createTestEvent(60, 0),
        createTestEvent(60, 0),
        createTestEvent(62, 0),
      ];
      
      const result = removeDuplicateNotes(events);
      
      expect(result.length).toBe(2);
    });
    
    it('should keep notes at different times', () => {
      const events = [
        createTestEvent(60, 0),
        createTestEvent(60, 100),
      ];
      
      const result = removeDuplicateNotes(events);
      
      expect(result.length).toBe(2);
    });
  });
  
  describe('splitLongNotes', () => {
    it('should split notes exceeding max duration', () => {
      const events = [createTestEvent(60, 0, 300)];
      const result = splitLongNotes(events, 100);
      
      expect(result.length).toBe(3);
    });
    
    it('should not split short notes', () => {
      const events = [createTestEvent(60, 0, 50)];
      const result = splitLongNotes(events, 100);
      
      expect(result.length).toBe(1);
    });
    
    it('should apply gap between splits', () => {
      const events = [createTestEvent(60, 0, 250)];
      const result = splitLongNotes(events, 100, 10);
      
      expect(result[0]!.startTime).toBe(0);
      expect(result[1]!.startTime).toBe(110); // 100 + 10 gap
    });
    
    it('should preserve other properties', () => {
      const events = [createTestEvent(72, 0, 200, 80)];
      const result = splitLongNotes(events, 100);
      
      expect(result[0]!.note).toBe(72);
      expect(result[0]!.velocity).toBe(80);
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Transform Integration', () => {
  it('should chain transpose and quantize', () => {
    const events = [createTestEvent(60, 125)];
    
    // Transpose up 5 semitones
    const transposed = transposeEvents(events, {
      ...DEFAULT_TRANSPOSE_STATE,
      semitones: 5,
    });
    
    // Quantize to 16th notes
    const quantized = quantizeEvents(transposed, DEFAULT_QUANTIZE_STATE, 480);
    
    expect(quantized[0]!.note).toBe(65);
    expect(quantized[0]!.startTime).toBe(120);
  });
  
  it('should chain humanize and constrain to scale', () => {
    const events = createTestSequence();
    
    // Humanize
    const humanized = humanizeEvents(events, {
      ...DEFAULT_HUMANIZE_STATE,
      seed: 12345,
    });
    
    // Constrain to scale
    const constrained = constrainToScale(humanized, DEFAULT_SCALE_CONSTRAIN_STATE);
    
    // All notes should be in C major
    for (const event of constrained) {
      expect(isNoteInScale(event.note, 0, 'major')).toBe(true);
    }
  });
  
  it('should combine echo and velocity curve', () => {
    const events = [createTestEvent(60, 0, 50, 100)];
    
    // Add echoes
    const echoed = echoPattern(events, 3, 100, 0.7);
    
    // Apply velocity curve to boost low velocities
    const curved = applyVelocityCurveToEvents(echoed, {
      ...DEFAULT_VELOCITY_CURVE_STATE,
      curveType: 'logarithmic',
      curvature: 2,
    });
    
    // All velocities should be boosted
    for (const event of curved) {
      expect(event.velocity).toBeGreaterThan(0);
    }
  });
  
  it('should combine transforms for complex processing', () => {
    const events = createTestSequence();
    
    // 1. Transpose
    let processed = transposeEvents(events, {
      ...DEFAULT_TRANSPOSE_STATE,
      semitones: 5,
    });
    
    // 2. Constrain to scale
    processed = constrainToScale(processed, {
      ...DEFAULT_SCALE_CONSTRAIN_STATE,
      root: 5, // F
      scale: 'major',
    });
    
    // 3. Apply velocity curve
    processed = applyVelocityCurveToEvents(processed, {
      ...DEFAULT_VELOCITY_CURVE_STATE,
      outputMin: 60,
      outputMax: 120,
    });
    
    // 4. Quantize
    processed = quantizeEvents(processed, {
      ...DEFAULT_QUANTIZE_STATE,
      swing: 0.2,
    }, 480);
    
    expect(processed.length).toBe(4);
    
    // All notes should be in F major
    for (const event of processed) {
      expect(isNoteInScale(event.note, 5, 'major')).toBe(true);
      expect(event.velocity).toBeGreaterThanOrEqual(60);
      expect(event.velocity).toBeLessThanOrEqual(120);
    }
  });
});
