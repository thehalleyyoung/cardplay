/**
 * @fileoverview Tests for time conversion utilities.
 * 
 * @see to_fix_repo_plan_500.md Change 305-306
 */

import { describe, it, expect } from 'vitest';
import {
  ticksToSeconds,
  secondsToTicks,
  tickDurationToSeconds,
  secondsToTickDuration,
  ticksToMusicalTime,
  musicalTimeToTicks,
  noteValueToTicks,
  NOTE_DURATIONS,
  dottedDuration,
  tripletDuration,
} from '../time-conversion';
import { PPQ, asTick, asTickDuration } from '../primitives';

describe('time-conversion', () => {
  describe('ticksToSeconds', () => {
    it('should convert ticks to seconds at 120 BPM', () => {
      // At 120 BPM, 1 beat = 0.5 seconds
      // 960 ticks (1 beat) = 0.5 seconds
      expect(ticksToSeconds(PPQ, 120)).toBe(0.5);
      expect(ticksToSeconds(PPQ * 2, 120)).toBe(1);
      expect(ticksToSeconds(PPQ * 4, 120)).toBe(2);
    });

    it('should convert ticks to seconds at 60 BPM', () => {
      // At 60 BPM, 1 beat = 1 second
      expect(ticksToSeconds(PPQ, 60)).toBe(1);
      expect(ticksToSeconds(PPQ * 2, 60)).toBe(2);
    });

    it('should handle Tick branded types', () => {
      const tick = asTick(PPQ);
      expect(ticksToSeconds(tick, 120)).toBe(0.5);
    });

    it('should throw on invalid BPM', () => {
      expect(() => ticksToSeconds(PPQ, 0)).toThrow('BPM must be positive');
      expect(() => ticksToSeconds(PPQ, -60)).toThrow('BPM must be positive');
    });

    it('should handle custom PPQ', () => {
      // Legacy 480 PPQ
      expect(ticksToSeconds(480, 120, 480)).toBe(0.5);
    });
  });

  describe('secondsToTicks', () => {
    it('should convert seconds to ticks at 120 BPM', () => {
      expect(secondsToTicks(0.5, 120)).toBe(PPQ);
      expect(secondsToTicks(1, 120)).toBe(PPQ * 2);
    });

    it('should convert seconds to ticks at 60 BPM', () => {
      expect(secondsToTicks(1, 60)).toBe(PPQ);
      expect(secondsToTicks(2, 60)).toBe(PPQ * 2);
    });

    it('should return branded Tick type', () => {
      const tick = secondsToTicks(1, 120);
      // TypeScript will verify this is a Tick type
      expect(typeof tick).toBe('number');
    });
  });

  describe('tickDurationToSeconds / secondsToTickDuration', () => {
    it('should convert duration to seconds', () => {
      const duration = asTickDuration(PPQ);
      expect(tickDurationToSeconds(duration, 120)).toBe(0.5);
    });

    it('should convert seconds to duration', () => {
      const duration = secondsToTickDuration(0.5, 120);
      expect(duration).toBe(PPQ);
    });
  });

  describe('ticksToMusicalTime', () => {
    it('should convert to bars/beats/ticks in 4/4', () => {
      const result = ticksToMusicalTime(0);
      expect(result).toEqual({ bars: 0, beats: 0, ticks: 0 });
    });

    it('should handle one bar in 4/4', () => {
      const ticksPerBar = PPQ * 4; // 4 beats per bar
      const result = ticksToMusicalTime(ticksPerBar);
      expect(result).toEqual({ bars: 1, beats: 0, ticks: 0 });
    });

    it('should handle partial bars', () => {
      const result = ticksToMusicalTime(PPQ * 2 + 240); // 2 beats + 240 ticks
      expect(result).toEqual({ bars: 0, beats: 2, ticks: 240 });
    });

    it('should handle 3/4 time signature', () => {
      const ticksPerBar = PPQ * 3; // 3 beats per bar
      const result = ticksToMusicalTime(ticksPerBar, { numerator: 3, denominator: 4 });
      expect(result).toEqual({ bars: 1, beats: 0, ticks: 0 });
    });

    it('should handle 6/8 time signature', () => {
      // In 6/8, each beat is an eighth note
      const ticksPerBeat = PPQ / 2; // 480 ticks per eighth
      const ticksPerBar = ticksPerBeat * 6; // 2880 ticks per bar
      const result = ticksToMusicalTime(ticksPerBar, { numerator: 6, denominator: 8 });
      expect(result).toEqual({ bars: 1, beats: 0, ticks: 0 });
    });
  });

  describe('musicalTimeToTicks', () => {
    it('should convert bars/beats/ticks to ticks', () => {
      const result = musicalTimeToTicks({ bars: 1, beats: 0, ticks: 0 });
      expect(result).toBe(PPQ * 4);
    });

    it('should handle complex musical time', () => {
      const result = musicalTimeToTicks({ bars: 2, beats: 3, ticks: 120 });
      // 2 bars * 4 beats * PPQ + 3 beats * PPQ + 120
      expect(result).toBe(2 * 4 * PPQ + 3 * PPQ + 120);
    });

    it('should round-trip with ticksToMusicalTime', () => {
      const originalTicks = asTick(5760); // Random tick value
      const musical = ticksToMusicalTime(originalTicks);
      const backToTicks = musicalTimeToTicks(musical);
      expect(backToTicks).toBe(originalTicks);
    });
  });

  describe('noteValueToTicks', () => {
    it('should return correct ticks for note values', () => {
      expect(noteValueToTicks(1)).toBe(PPQ * 4);   // Whole note
      expect(noteValueToTicks(2)).toBe(PPQ * 2);   // Half note
      expect(noteValueToTicks(4)).toBe(PPQ);       // Quarter note
      expect(noteValueToTicks(8)).toBe(PPQ / 2);   // Eighth note
      expect(noteValueToTicks(16)).toBe(PPQ / 4);  // Sixteenth note
      expect(noteValueToTicks(32)).toBe(PPQ / 8);  // Thirty-second note
      expect(noteValueToTicks(64)).toBe(PPQ / 16); // Sixty-fourth note
    });
  });

  describe('NOTE_DURATIONS', () => {
    it('should provide correct durations', () => {
      expect(NOTE_DURATIONS.whole).toBe(PPQ * 4);
      expect(NOTE_DURATIONS.half).toBe(PPQ * 2);
      expect(NOTE_DURATIONS.quarter).toBe(PPQ);
      expect(NOTE_DURATIONS.eighth).toBe(PPQ / 2);
      expect(NOTE_DURATIONS.sixteenth).toBe(PPQ / 4);
      expect(NOTE_DURATIONS.thirtySecond).toBe(PPQ / 8);
      expect(NOTE_DURATIONS.sixtyFourth).toBe(PPQ / 16);
    });
  });

  describe('dottedDuration', () => {
    it('should return 1.5x the base duration', () => {
      const quarter = PPQ;
      expect(dottedDuration(quarter)).toBe(Math.round(quarter * 1.5));
    });

    it('should handle TickDuration type', () => {
      const duration = asTickDuration(PPQ);
      expect(dottedDuration(duration)).toBe(Math.round(PPQ * 1.5));
    });
  });

  describe('tripletDuration', () => {
    it('should return 2/3 of the base duration', () => {
      const quarter = PPQ;
      expect(tripletDuration(quarter)).toBe(Math.round(quarter * 2 / 3));
    });

    it('should handle common triplet values', () => {
      // Eighth note triplets: 3 in the space of 2 eighths
      const eighth = PPQ / 2;
      const tripletEighth = tripletDuration(eighth);
      expect(tripletEighth).toBe(Math.round(eighth * 2 / 3));
    });
  });
});
