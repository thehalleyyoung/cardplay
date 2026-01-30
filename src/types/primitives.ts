/**
 * @fileoverview Core primitive types for the Cardplay event system.
 * 
 * Provides branded types for type-safe tick arithmetic:
 * - Tick: Absolute position in time (non-negative integer)
 * - TickDuration: Length of time (non-negative integer)
 * - PPQ: Pulses per quarter note (960 for professional resolution)
 * 
 * @module @cardplay/core/types/primitives
 * @see cardplay2.md Section 1.1 - Tick, TickDuration
 */

// ============================================================================
// BRANDED TYPE UTILITIES
// ============================================================================

declare const __brand: unique symbol;

/**
 * Creates a branded type for nominal typing.
 * Prevents accidental mixing of semantically different number types.
 */
type Branded<T, B extends string> = T & { readonly [__brand]: B };

// ============================================================================
// TICK TYPES
// ============================================================================

/**
 * Absolute position in musical time.
 * 
 * Branded number type representing a position in ticks from the timeline origin.
 * Always non-negative. One beat = PPQ ticks.
 * 
 * @example
 * ```ts
 * const start = asTick(960);  // 1 beat from origin
 * const end = asTick(1920);   // 2 beats from origin
 * ```
 */
export type Tick = Branded<number, 'Tick'>;

/**
 * Duration in musical time.
 * 
 * Branded number type representing a length in ticks.
 * Always non-negative. Semantically different from Tick (position vs length).
 * 
 * @example
 * ```ts
 * const quarterNote = asTickDuration(960);
 * const eighthNote = asTickDuration(480);
 * ```
 */
export type TickDuration = Branded<number, 'TickDuration'>;

/**
 * Pulses Per Quarter note - the temporal resolution.
 * 
 * **THIS IS THE SINGLE SOURCE OF TRUTH FOR PPQ**.
 * All tick↔time conversions throughout the codebase must import PPQ from this module.
 * 
 * @see cardplay/docs/canon/ids.md - PPQ section
 * @see to_fix_repo_plan_500.md Change 309
 * 
 * 960 PPQ provides:
 * - Clean division for common note values (1/2, 1/4, 1/8, 1/16, 1/32, 1/64)
 * - Support for triplets and quintuplets
 * - Sub-millisecond precision at typical tempos
 * - Industry-standard resolution used by major DAWs
 * 
 * Common note durations at PPQ=960:
 * - Whole note: 3840 ticks (960 * 4)
 * - Half note: 1920 ticks (960 * 2)
 * - Quarter note: 960 ticks
 * - Eighth note: 480 ticks (960 / 2)
 * - Sixteenth note: 240 ticks (960 / 4)
 * - Thirty-second: 120 ticks (960 / 8)
 * - Triplet eighth: 320 ticks (960 / 3)
 */
export const PPQ = 960 as const;

// ============================================================================
// MIDI PRIMITIVES
// ============================================================================

/** MIDI note number (0-127). */
export type MidiNote = Branded<number, 'MidiNote'>;

/** MIDI velocity (0-127). */
export type Velocity = Branded<number, 'Velocity'>;

export function asMidiNote(value: number): MidiNote {
  const v = Math.max(0, Math.min(127, Math.floor(value)));
  return v as MidiNote;
}

export function asVelocity(value: number): Velocity {
  const v = Math.max(0, Math.min(127, Math.floor(value)));
  return v as Velocity;
}

// ============================================================================
// TICK FACTORIES
// ============================================================================

/**
 * Creates a Tick from a number with validation.
 * 
 * @param value - The numeric value (must be non-negative integer)
 * @returns A branded Tick value
 * @throws {RangeError} If value is negative or not an integer
 * 
 * @example
 * ```ts
 * const tick = asTick(480);  // Half beat
 * asTick(-1);  // Throws RangeError
 * ```
 */
export function asTick(value: number): Tick {
  if (value < 0) {
    throw new RangeError(`Tick must be non-negative, got ${value}`);
  }
  if (!Number.isInteger(value)) {
    throw new RangeError(`Tick must be an integer, got ${value}`);
  }
  return value as Tick;
}

/**
 * Creates a TickDuration from a number with validation.
 * 
 * @param value - The numeric value (must be non-negative integer)
 * @returns A branded TickDuration value
 * @throws {RangeError} If value is negative or not an integer
 * 
 * @example
 * ```ts
 * const duration = asTickDuration(960);  // One beat
 * asTickDuration(-100);  // Throws RangeError
 * ```
 */
export function asTickDuration(value: number): TickDuration {
  if (value < 0) {
    throw new RangeError(`TickDuration must be non-negative, got ${value}`);
  }
  if (!Number.isInteger(value)) {
    throw new RangeError(`TickDuration must be an integer, got ${value}`);
  }
  return value as TickDuration;
}

// ============================================================================
// TICK ARITHMETIC
// ============================================================================

/**
 * Adds a duration to a tick position.
 * 
 * @param tick - Starting position
 * @param duration - Duration to add
 * @returns New tick position
 */
export function addTicks(tick: Tick, duration: TickDuration): Tick {
  return asTick(tick + duration);
}

/**
 * Subtracts a duration from a tick position.
 * 
 * @param tick - Starting position
 * @param duration - Duration to subtract
 * @returns New tick position (clamped to 0)
 */
export function subtractTicks(tick: Tick, duration: TickDuration): Tick {
  return asTick(Math.max(0, tick - duration));
}

/**
 * Calculates the duration between two tick positions.
 * 
 * @param start - Start position
 * @param end - End position
 * @returns Duration (absolute difference)
 */
export function tickDelta(start: Tick, end: Tick): TickDuration {
  return asTickDuration(Math.abs(end - start));
}

/**
 * Quantization mode for snapping ticks to grid.
 */
export type QuantizeMode = 'floor' | 'ceil' | 'nearest';

/**
 * Quantizes a tick to a grid.
 * 
 * @param tick - The tick to quantize
 * @param grid - Grid size in ticks
 * @param mode - Quantization mode (default: 'nearest')
 * @returns Quantized tick position
 * 
 * @example
 * ```ts
 * quantizeTick(asTick(100), 240);  // -> 0 (nearest)
 * quantizeTick(asTick(200), 240, 'ceil');  // -> 240
 * ```
 */
export function quantizeTick(
  tick: Tick,
  grid: number,
  mode: QuantizeMode = 'nearest'
): Tick {
  if (grid <= 0) {
    throw new RangeError(`Grid must be positive, got ${grid}`);
  }
  
  switch (mode) {
    case 'floor':
      return asTick(Math.floor(tick / grid) * grid);
    case 'ceil':
      return asTick(Math.ceil(tick / grid) * grid);
    case 'nearest':
    default:
      return asTick(Math.round(tick / grid) * grid);
  }
}

// ============================================================================
// BEAT/BAR CONVERSIONS
// ============================================================================

/**
 * Converts beats to ticks.
 * 
 * @param beats - Number of beats
 * @param ppq - Pulses per quarter (default: PPQ)
 * @returns Tick count
 */
export function beatsToTicks(beats: number, ppq: number = PPQ): TickDuration {
  return asTickDuration(Math.round(beats * ppq));
}

/**
 * Converts ticks to beats.
 * 
 * @param ticks - Tick count
 * @param ppq - Pulses per quarter (default: PPQ)
 * @returns Beat count
 */
export function ticksToBeats(ticks: Tick | TickDuration, ppq: number = PPQ): number {
  return ticks / ppq;
}

/**
 * Converts bars to ticks.
 * 
 * @param bars - Number of bars
 * @param beatsPerBar - Beats per bar (default: 4)
 * @param ppq - Pulses per quarter (default: PPQ)
 * @returns Tick count
 */
export function barsToTicks(
  bars: number,
  beatsPerBar: number = 4,
  ppq: number = PPQ
): TickDuration {
  return asTickDuration(Math.round(bars * beatsPerBar * ppq));
}

/**
 * Converts ticks to bars.
 * 
 * @param ticks - Tick count
 * @param beatsPerBar - Beats per bar (default: 4)
 * @param ppq - Pulses per quarter (default: PPQ)
 * @returns Bar count
 */
export function ticksToBars(
  ticks: Tick | TickDuration,
  beatsPerBar: number = 4,
  ppq: number = PPQ
): number {
  return ticks / (beatsPerBar * ppq);
}

/**
 * Returns common grid sizes in ticks.
 * 
 * @param ppq - Pulses per quarter (default: PPQ)
 * @returns Object with named grid sizes
 */
export function getGridSizes(ppq: number = PPQ) {
  return {
    whole: ppq * 4,
    half: ppq * 2,
    quarter: ppq,
    eighth: ppq / 2,
    sixteenth: ppq / 4,
    thirtySecond: ppq / 8,
    sixtyFourth: ppq / 16,
    tripletQuarter: Math.round(ppq * 2 / 3),
    tripletEighth: Math.round(ppq / 3),
    tripletSixteenth: Math.round(ppq / 6),
  } as const;
}
