/**
 * @fileoverview Time Conversion Utilities
 * 
 * Provides utilities for converting between ticks, seconds, and musical time.
 * All conversions use the canonical PPQ from primitives.ts.
 * 
 * @module @cardplay/types/time-conversion
 * @see cardplay/docs/canon/ids.md (PPQ section)
 * @see to_fix_repo_plan_500.md Change 305-306
 */

import { PPQ, type Tick, type TickDuration, asTick, asTickDuration } from './primitives';

// ============================================================================
// TIME CONVERSION
// ============================================================================

/**
 * Convert ticks to seconds.
 * 
 * @param tick - Position in ticks
 * @param bpm - Tempo in beats per minute
 * @param ppq - Pulses per quarter (defaults to canonical PPQ=960)
 * @returns Time in seconds
 * 
 * @example
 * ```ts
 * const seconds = ticksToSeconds(1920, 120); // 1 second at 120 BPM
 * ```
 */
export function ticksToSeconds(
  tick: number | Tick,
  bpm: number,
  ppq: number = PPQ
): number {
  if (bpm <= 0) {
    throw new Error(`BPM must be positive, got ${bpm}`);
  }
  if (ppq <= 0) {
    throw new Error(`PPQ must be positive, got ${ppq}`);
  }
  
  // seconds per beat = 60 / bpm
  // beats = ticks / ppq
  // seconds = beats * secondsPerBeat
  const secondsPerBeat = 60 / bpm;
  const beats = tick / ppq;
  return beats * secondsPerBeat;
}

/**
 * Convert seconds to ticks.
 * 
 * @param seconds - Time in seconds
 * @param bpm - Tempo in beats per minute
 * @param ppq - Pulses per quarter (defaults to canonical PPQ=960)
 * @returns Position in ticks
 * 
 * @example
 * ```ts
 * const ticks = secondsToTicks(1, 120); // 1920 ticks at 120 BPM with PPQ=960
 * ```
 */
export function secondsToTicks(
  seconds: number,
  bpm: number,
  ppq: number = PPQ
): Tick {
  if (bpm <= 0) {
    throw new Error(`BPM must be positive, got ${bpm}`);
  }
  if (ppq <= 0) {
    throw new Error(`PPQ must be positive, got ${ppq}`);
  }
  
  // beats per second = bpm / 60
  // beats = seconds * beatsPerSecond
  // ticks = beats * ppq
  const beatsPerSecond = bpm / 60;
  const beats = seconds * beatsPerSecond;
  return asTick(Math.round(beats * ppq));
}

/**
 * Convert a duration in ticks to seconds.
 * 
 * @param duration - Duration in ticks
 * @param bpm - Tempo in beats per minute
 * @param ppq - Pulses per quarter (defaults to canonical PPQ=960)
 * @returns Duration in seconds
 */
export function tickDurationToSeconds(
  duration: number | TickDuration,
  bpm: number,
  ppq: number = PPQ
): number {
  return ticksToSeconds(duration, bpm, ppq);
}

/**
 * Convert a duration in seconds to ticks.
 * 
 * @param seconds - Duration in seconds
 * @param bpm - Tempo in beats per minute
 * @param ppq - Pulses per quarter (defaults to canonical PPQ=960)
 * @returns Duration in ticks
 */
export function secondsToTickDuration(
  seconds: number,
  bpm: number,
  ppq: number = PPQ
): TickDuration {
  const tick = secondsToTicks(seconds, bpm, ppq);
  return asTickDuration(tick);
}

// ============================================================================
// MUSICAL TIME CONVERSION
// ============================================================================

/**
 * Musical time representation (bars, beats, ticks).
 */
export interface MusicalTime {
  /** Bar number (0-indexed) */
  bars: number;
  /** Beat within bar (0-indexed) */
  beats: number;
  /** Ticks within beat */
  ticks: number;
}

/**
 * Time signature for conversions.
 */
export interface TimeSignature {
  /** Numerator (beats per bar) */
  numerator: number;
  /** Denominator (beat unit, e.g., 4 for quarter note) */
  denominator: number;
}

/**
 * Convert ticks to musical time (bars, beats, ticks).
 * 
 * @param tick - Position in ticks
 * @param timeSignature - Time signature
 * @param ppq - Pulses per quarter (defaults to canonical PPQ=960)
 * @returns Musical time position
 */
export function ticksToMusicalTime(
  tick: number | Tick,
  timeSignature: TimeSignature = { numerator: 4, denominator: 4 },
  ppq: number = PPQ
): MusicalTime {
  // Adjust PPQ based on denominator (e.g., 8 = half the ticks per beat)
  const ticksPerBeat = (ppq * 4) / timeSignature.denominator;
  const ticksPerBar = ticksPerBeat * timeSignature.numerator;
  
  const totalTicks = Number(tick);
  const bars = Math.floor(totalTicks / ticksPerBar);
  const remainingAfterBars = totalTicks % ticksPerBar;
  const beats = Math.floor(remainingAfterBars / ticksPerBeat);
  const ticks = Math.round(remainingAfterBars % ticksPerBeat);
  
  return { bars, beats, ticks };
}

/**
 * Convert musical time to ticks.
 * 
 * @param musicalTime - Position in bars/beats/ticks
 * @param timeSignature - Time signature
 * @param ppq - Pulses per quarter (defaults to canonical PPQ=960)
 * @returns Position in ticks
 */
export function musicalTimeToTicks(
  musicalTime: MusicalTime,
  timeSignature: TimeSignature = { numerator: 4, denominator: 4 },
  ppq: number = PPQ
): Tick {
  const ticksPerBeat = (ppq * 4) / timeSignature.denominator;
  const ticksPerBar = ticksPerBeat * timeSignature.numerator;
  
  const totalTicks = 
    musicalTime.bars * ticksPerBar +
    musicalTime.beats * ticksPerBeat +
    musicalTime.ticks;
    
  return asTick(Math.round(totalTicks));
}

// ============================================================================
// NOTE VALUE HELPERS
// ============================================================================

/**
 * Get the tick duration for a note value.
 * 
 * @param noteValue - Note value (1 = whole, 2 = half, 4 = quarter, etc.)
 * @param ppq - Pulses per quarter (defaults to canonical PPQ=960)
 * @returns Duration in ticks
 */
export function noteValueToTicks(
  noteValue: 1 | 2 | 4 | 8 | 16 | 32 | 64,
  ppq: number = PPQ
): TickDuration {
  // Quarter note = ppq ticks
  // Whole = 4 * ppq, half = 2 * ppq, eighth = ppq / 2, etc.
  const quarterNoteTicks = ppq;
  const ticks = (quarterNoteTicks * 4) / noteValue;
  return asTickDuration(ticks);
}

/**
 * Get common note value durations at the canonical PPQ.
 */
export const NOTE_DURATIONS = {
  /** Whole note (4 beats) */
  get whole() { return noteValueToTicks(1); },
  /** Half note (2 beats) */
  get half() { return noteValueToTicks(2); },
  /** Quarter note (1 beat) */
  get quarter() { return noteValueToTicks(4); },
  /** Eighth note (half beat) */
  get eighth() { return noteValueToTicks(8); },
  /** Sixteenth note (quarter beat) */
  get sixteenth() { return noteValueToTicks(16); },
  /** Thirty-second note */
  get thirtySecond() { return noteValueToTicks(32); },
  /** Sixty-fourth note */
  get sixtyFourth() { return noteValueToTicks(64); },
} as const;

/**
 * Get a dotted note duration (1.5x the original).
 * 
 * @param baseTicks - Base note duration in ticks
 * @returns Dotted duration in ticks
 */
export function dottedDuration(baseTicks: number | TickDuration): TickDuration {
  return asTickDuration(Math.round(Number(baseTicks) * 1.5));
}

/**
 * Get a triplet note duration (2/3 of the original).
 * 
 * @param baseTicks - Base note duration in ticks
 * @returns Triplet duration in ticks
 */
export function tripletDuration(baseTicks: number | TickDuration): TickDuration {
  return asTickDuration(Math.round(Number(baseTicks) * 2 / 3));
}
