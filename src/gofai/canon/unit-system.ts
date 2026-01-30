/**
 * GOFAI Unit System — Typed Musical Units with Conversions
 *
 * Step 061 from gofai_goalB.md: "Create a single 'unit system' type layer:
 * Bpm, Semitones, Bars, Beats, Ticks, with conversion rules and refinements."
 *
 * This module provides a strongly-typed unit system for musical quantities
 * with safe conversions, refinement types (valid ranges), and clear semantics.
 *
 * Philosophy: Units should be types, not numbers. This prevents bugs like
 * "passing bars where beats expected" and enables compile-time validation.
 *
 * @module gofai/canon/unit-system
 */

// =============================================================================
// Base Unit Types (Branded Types for Type Safety)
// =============================================================================

/**
 * Beats per minute (tempo).
 * Valid range: 20-400 BPM (human-performable range).
 */
export type Bpm = number & { readonly __brand: 'Bpm' };

/**
 * Create a BPM value with validation.
 */
export function bpm(value: number): Bpm {
  if (!Number.isFinite(value)) {
    throw new TypeError(`BPM must be finite, got: ${value}`);
  }
  if (value < 20) {
    throw new RangeError(`BPM too slow: ${value} (minimum is 20)`);
  }
  if (value > 400) {
    throw new RangeError(`BPM too fast: ${value} (maximum is 400)`);
  }
  return value as Bpm;
}

/**
 * Semitones (pitch interval).
 * Valid range: -127 to +127 (MIDI pitch range).
 */
export type Semitones = number & { readonly __brand: 'Semitones' };

/**
 * Create a semitone value with validation.
 */
export function semitones(value: number): Semitones {
  if (!Number.isFinite(value)) {
    throw new TypeError(`Semitones must be finite, got: ${value}`);
  }
  if (value < -127) {
    throw new RangeError(`Semitones too low: ${value} (minimum is -127)`);
  }
  if (value > 127) {
    throw new RangeError(`Semitones too high: ${value} (maximum is 127)`);
  }
  return value as Semitones;
}

/**
 * Cents (pitch microtonal interval, 1/100th of a semitone).
 * Valid range: -12700 to +12700 cents.
 */
export type Cents = number & { readonly __brand: 'Cents' };

/**
 * Create a cents value with validation.
 */
export function cents(value: number): Cents {
  if (!Number.isFinite(value)) {
    throw new TypeError(`Cents must be finite, got: ${value}`);
  }
  if (value < -12700) {
    throw new RangeError(`Cents too low: ${value} (minimum is -12700)`);
  }
  if (value > 12700) {
    throw new RangeError(`Cents too high: ${value} (maximum is 12700)`);
  }
  return value as Cents;
}

/**
 * Bars (measures in musical notation).
 * Must be positive.
 */
export type Bars = number & { readonly __brand: 'Bars' };

/**
 * Create a bars value with validation.
 */
export function bars(value: number): Bars {
  if (!Number.isFinite(value)) {
    throw new TypeError(`Bars must be finite, got: ${value}`);
  }
  if (value < 0) {
    throw new RangeError(`Bars must be non-negative, got: ${value}`);
  }
  return value as Bars;
}

/**
 * Beats (quarter notes or beat units).
 * Must be positive.
 */
export type Beats = number & { readonly __brand: 'Beats' };

/**
 * Create a beats value with validation.
 */
export function beats(value: number): Beats {
  if (!Number.isFinite(value)) {
    throw new TypeError(`Beats must be finite, got: ${value}`);
  }
  if (value < 0) {
    throw new RangeError(`Beats must be non-negative, got: ${value}`);
  }
  return value as Beats;
}

/**
 * Ticks (PPQN - pulses per quarter note, atomic time unit).
 * Must be non-negative integer.
 */
export type Ticks = number & { readonly __brand: 'Ticks' };

/**
 * Create a ticks value with validation.
 */
export function ticks(value: number): Ticks {
  if (!Number.isFinite(value)) {
    throw new TypeError(`Ticks must be finite, got: ${value}`);
  }
  if (!Number.isInteger(value)) {
    throw new TypeError(`Ticks must be an integer, got: ${value}`);
  }
  if (value < 0) {
    throw new RangeError(`Ticks must be non-negative, got: ${value}`);
  }
  return value as Ticks;
}

/**
 * Milliseconds (time duration).
 * Must be non-negative.
 */
export type Milliseconds = number & { readonly __brand: 'Milliseconds' };

/**
 * Create a milliseconds value with validation.
 */
export function milliseconds(value: number): Milliseconds {
  if (!Number.isFinite(value)) {
    throw new TypeError(`Milliseconds must be finite, got: ${value}`);
  }
  if (value < 0) {
    throw new RangeError(`Milliseconds must be non-negative, got: ${value}`);
  }
  return value as Milliseconds;
}

/**
 * Seconds (time duration).
 * Must be non-negative.
 */
export type Seconds = number & { readonly __brand: 'Seconds' };

/**
 * Create a seconds value with validation.
 */
export function seconds(value: number): Seconds {
  if (!Number.isFinite(value)) {
    throw new TypeError(`Seconds must be finite, got: ${value}`);
  }
  if (value < 0) {
    throw new RangeError(`Seconds must be non-negative, got: ${value}`);
  }
  return value as Seconds;
}

/**
 * Hertz (frequency).
 * Must be positive.
 */
export type Hertz = number & { readonly __brand: 'Hertz' };

/**
 * Create a hertz value with validation.
 */
export function hertz(value: number): Hertz {
  if (!Number.isFinite(value)) {
    throw new TypeError(`Hertz must be finite, got: ${value}`);
  }
  if (value <= 0) {
    throw new RangeError(`Hertz must be positive, got: ${value}`);
  }
  return value as Hertz;
}

/**
 * Decibels (amplitude ratio, logarithmic scale).
 */
export type Decibels = number & { readonly __brand: 'Decibels' };

/**
 * Create a decibels value with validation.
 */
export function decibels(value: number): Decibels {
  if (!Number.isFinite(value)) {
    throw new TypeError(`Decibels must be finite, got: ${value}`);
  }
  return value as Decibels;
}

/**
 * Percentage (0-100 scale).
 */
export type Percentage = number & { readonly __brand: 'Percentage' };

/**
 * Create a percentage value with validation.
 */
export function percentage(value: number): Percentage {
  if (!Number.isFinite(value)) {
    throw new TypeError(`Percentage must be finite, got: ${value}`);
  }
  if (value < 0) {
    throw new RangeError(`Percentage must be at least 0, got: ${value}`);
  }
  if (value > 100) {
    throw new RangeError(`Percentage must be at most 100, got: ${value}`);
  }
  return value as Percentage;
}

/**
 * Normalized value (0.0-1.0 range).
 */
export type Normalized = number & { readonly __brand: 'Normalized' };

/**
 * Create a normalized value with validation.
 */
export function normalized(value: number): Normalized {
  if (!Number.isFinite(value)) {
    throw new TypeError(`Normalized value must be finite, got: ${value}`);
  }
  if (value < 0) {
    throw new RangeError(`Normalized value must be at least 0, got: ${value}`);
  }
  if (value > 1) {
    throw new RangeError(`Normalized value must be at most 1, got: ${value}`);
  }
  return value as Normalized;
}

// =============================================================================
// Musical Context for Conversions
// =============================================================================

/**
 * Musical context needed for unit conversions.
 */
export interface MusicalContext {
  /** Current tempo in BPM */
  readonly tempo: Bpm;

  /** Time signature numerator (beats per bar) */
  readonly timeSignatureNumerator: number;

  /** Time signature denominator (beat unit) */
  readonly timeSignatureDenominator: number;

  /** PPQN (pulses/ticks per quarter note) */
  readonly ticksPerQuarterNote: number;
}

/**
 * Default musical context (4/4 time, 120 BPM, 480 PPQN).
 */
export const DEFAULT_MUSICAL_CONTEXT: MusicalContext = {
  tempo: bpm(120),
  timeSignatureNumerator: 4,
  timeSignatureDenominator: 4,
  ticksPerQuarterNote: 480,
};

// =============================================================================
// Unit Conversions
// =============================================================================

/**
 * Convert bars to beats.
 */
export function barsToBeats(
  value: Bars,
  context: MusicalContext = DEFAULT_MUSICAL_CONTEXT
): Beats {
  const beatsPerBar = context.timeSignatureNumerator;
  return beats(value * beatsPerBar);
}

/**
 * Convert beats to bars.
 */
export function beatsToBars(
  value: Beats,
  context: MusicalContext = DEFAULT_MUSICAL_CONTEXT
): Bars {
  const beatsPerBar = context.timeSignatureNumerator;
  return bars(value / beatsPerBar);
}

/**
 * Convert beats to ticks.
 */
export function beatsToTicks(
  value: Beats,
  context: MusicalContext = DEFAULT_MUSICAL_CONTEXT
): Ticks {
  return ticks(Math.round(value * context.ticksPerQuarterNote));
}

/**
 * Convert ticks to beats.
 */
export function ticksToBeats(
  value: Ticks,
  context: MusicalContext = DEFAULT_MUSICAL_CONTEXT
): Beats {
  return beats(value / context.ticksPerQuarterNote);
}

/**
 * Convert bars to ticks.
 */
export function barsToTicks(
  value: Bars,
  context: MusicalContext = DEFAULT_MUSICAL_CONTEXT
): Ticks {
  return beatsToTicks(barsToBeats(value, context), context);
}

/**
 * Convert ticks to bars.
 */
export function ticksToBars(
  value: Ticks,
  context: MusicalContext = DEFAULT_MUSICAL_CONTEXT
): Bars {
  return beatsToBars(ticksToBeats(value, context), context);
}

/**
 * Convert beats to milliseconds (tempo-dependent).
 */
export function beatsToMilliseconds(
  value: Beats,
  tempo: Bpm
): Milliseconds {
  // Milliseconds per beat = 60000 / BPM
  const msPerBeat = 60000 / tempo;
  return milliseconds(value * msPerBeat);
}

/**
 * Convert milliseconds to beats (tempo-dependent).
 */
export function millisecondsToBeats(
  value: Milliseconds,
  tempo: Bpm
): Beats {
  // Beats = ms / (60000 / BPM) = ms * BPM / 60000
  return beats((value * tempo) / 60000);
}

/**
 * Convert ticks to milliseconds (tempo-dependent).
 */
export function ticksToMilliseconds(
  value: Ticks,
  context: MusicalContext = DEFAULT_MUSICAL_CONTEXT
): Milliseconds {
  const b = ticksToBeats(value, context);
  return beatsToMilliseconds(b, context.tempo);
}

/**
 * Convert milliseconds to ticks (tempo-dependent).
 */
export function millisecondsToTicks(
  value: Milliseconds,
  context: MusicalContext = DEFAULT_MUSICAL_CONTEXT
): Ticks {
  const b = millisecondsToBeats(value, context.tempo);
  return beatsToTicks(b, context);
}

/**
 * Convert seconds to milliseconds.
 */
export function secondsToMilliseconds(value: Seconds): Milliseconds {
  return milliseconds(value * 1000);
}

/**
 * Convert milliseconds to seconds.
 */
export function millisecondsToSeconds(value: Milliseconds): Seconds {
  return seconds(value / 1000);
}

/**
 * Convert semitones to cents.
 */
export function semitonesToCents(value: Semitones): Cents {
  return cents(value * 100);
}

/**
 * Convert cents to semitones.
 */
export function centsToSemitones(value: Cents): Semitones {
  return semitones(value / 100);
}

/**
 * Convert semitones to frequency ratio.
 */
export function semitonesToRatio(value: Semitones): number {
  return Math.pow(2, value / 12);
}

/**
 * Convert frequency ratio to semitones.
 */
export function ratioToSemitones(ratio: number): Semitones {
  if (ratio <= 0) {
    throw new RangeError(`Frequency ratio must be positive, got: ${ratio}`);
  }
  return semitones(12 * Math.log2(ratio));
}

/**
 * Convert MIDI note number to frequency in Hz (A440 tuning).
 */
export function midiNoteToFrequency(midiNote: number): Hertz {
  // A4 (MIDI 69) = 440 Hz
  // Frequency = 440 * 2^((note - 69) / 12)
  return hertz(440 * Math.pow(2, (midiNote - 69) / 12));
}

/**
 * Convert frequency to MIDI note number (A440 tuning).
 */
export function frequencyToMidiNote(freq: Hertz): number {
  // Note = 69 + 12 * log2(freq / 440)
  return 69 + 12 * Math.log2(freq / 440);
}

/**
 * Convert percentage to normalized value.
 */
export function percentageToNormalized(value: Percentage): Normalized {
  return normalized(value / 100);
}

/**
 * Convert normalized value to percentage.
 */
export function normalizedToPercentage(value: Normalized): Percentage {
  return percentage(value * 100);
}

/**
 * Convert amplitude ratio to decibels.
 */
export function amplitudeToDecibels(amplitude: number): Decibels {
  if (amplitude <= 0) {
    return decibels(-Infinity);
  }
  return decibels(20 * Math.log10(amplitude));
}

/**
 * Convert decibels to amplitude ratio.
 */
export function decibelsToAmplitude(db: Decibels): number {
  if (!Number.isFinite(db)) {
    return 0;
  }
  return Math.pow(10, db / 20);
}

/**
 * Convert power ratio to decibels.
 */
export function powerToDecibels(power: number): Decibels {
  if (power <= 0) {
    return decibels(-Infinity);
  }
  return decibels(10 * Math.log10(power));
}

/**
 * Convert decibels to power ratio.
 */
export function decibelsToPower(db: Decibels): number {
  if (!Number.isFinite(db)) {
    return 0;
  }
  return Math.pow(10, db / 10);
}

// =============================================================================
// Quantity Type (Unit + Value)
// =============================================================================

/**
 * A quantity with explicit units.
 */
export type Quantity<TUnit extends string> = {
  readonly value: number;
  readonly unit: TUnit;
};

/**
 * Unit types supported by Quantity.
 */
export type UnitType =
  | 'bpm'
  | 'semitones'
  | 'cents'
  | 'bars'
  | 'beats'
  | 'ticks'
  | 'milliseconds'
  | 'seconds'
  | 'hertz'
  | 'decibels'
  | 'percentage'
  | 'normalized';

/**
 * Create a quantity with explicit units.
 */
export function quantity<TUnit extends UnitType>(
  value: number,
  unit: TUnit
): Quantity<TUnit> {
  return { value, unit };
}

/**
 * Parse a quantity from a string (e.g., "120 bpm", "2 bars", "440 Hz").
 */
export function parseQuantity(input: string): Quantity<UnitType> | null {
  const trimmed = input.trim().toLowerCase();

  // Try to match: number + optional whitespace + unit
  const match = trimmed.match(/^([+-]?\d+(?:\.\d+)?)\s*([a-z%]+)$/i);
  if (!match) return null;

  const valueStr = match[1];
  const unitStr = match[2];

  if (!valueStr || !unitStr) return null;

  const value = parseFloat(valueStr);
  if (!Number.isFinite(value)) return null;

  // Normalize unit strings
  const unitNormalized = normalizeUnit(unitStr);
  if (!unitNormalized) return null;

  return { value, unit: unitNormalized };
}

/**
 * Normalize unit string to canonical form.
 */
function normalizeUnit(unit: string): UnitType | null {
  const lower = unit.toLowerCase();

  switch (lower) {
    case 'bpm':
    case 'beats per minute':
      return 'bpm';

    case 'semitone':
    case 'semitones':
    case 'st':
      return 'semitones';

    case 'cent':
    case 'cents':
      return 'cents';

    case 'bar':
    case 'bars':
    case 'measure':
    case 'measures':
      return 'bars';

    case 'beat':
    case 'beats':
    case 'quarter':
    case 'quarters':
      return 'beats';

    case 'tick':
    case 'ticks':
    case 'pulse':
    case 'pulses':
      return 'ticks';

    case 'ms':
    case 'millisecond':
    case 'milliseconds':
      return 'milliseconds';

    case 's':
    case 'sec':
    case 'second':
    case 'seconds':
      return 'seconds';

    case 'hz':
    case 'hertz':
      return 'hertz';

    case 'db':
    case 'decibel':
    case 'decibels':
      return 'decibels';

    case '%':
    case 'percent':
    case 'percentage':
      return 'percentage';

    case 'normalized':
    case 'norm':
      return 'normalized';

    default:
      return null;
  }
}

/**
 * Format a quantity as a human-readable string.
 */
export function formatQuantity(q: Quantity<UnitType>): string {
  const unitName = getUnitDisplayName(q.unit);

  // Format value with appropriate precision
  let valueStr: string;
  if (Number.isInteger(q.value)) {
    valueStr = q.value.toString();
  } else {
    valueStr = q.value.toFixed(2);
  }

  return `${valueStr} ${unitName}`;
}

/**
 * Get display name for a unit.
 */
function getUnitDisplayName(unit: UnitType): string {
  switch (unit) {
    case 'bpm':
      return 'BPM';
    case 'semitones':
      return 'semitones';
    case 'cents':
      return 'cents';
    case 'bars':
      return 'bars';
    case 'beats':
      return 'beats';
    case 'ticks':
      return 'ticks';
    case 'milliseconds':
      return 'ms';
    case 'seconds':
      return 's';
    case 'hertz':
      return 'Hz';
    case 'decibels':
      return 'dB';
    case 'percentage':
      return '%';
    case 'normalized':
      return '';
    default:
      return unit;
  }
}

// =============================================================================
// Refinement Predicates
// =============================================================================

/**
 * Check if a BPM value is in a standard tempo range.
 */
export function isStandardTempo(value: Bpm): boolean {
  return value >= 60 && value <= 180;
}

/**
 * Check if a BPM value is considered "slow".
 */
export function isSlowTempo(value: Bpm): boolean {
  return value < 80;
}

/**
 * Check if a BPM value is considered "fast".
 */
export function isFastTempo(value: Bpm): boolean {
  return value > 140;
}

/**
 * Check if a semitone interval is within typical melody range.
 */
export function isMelodicInterval(value: Semitones): boolean {
  return Math.abs(value) <= 12; // Within an octave
}

/**
 * Check if a pitch is within typical human vocal range.
 */
export function isVocalPitchRange(midiNote: number): boolean {
  return midiNote >= 48 && midiNote <= 84; // C3 to C6
}

/**
 * Check if a frequency is within typical audible range.
 */
export function isAudibleFrequency(freq: Hertz): boolean {
  return freq >= 20 && freq <= 20000;
}

/**
 * Check if a duration is "short" (less than a beat).
 */
export function isShortDuration(duration: Beats): boolean {
  return duration < 1;
}

/**
 * Check if a duration is "long" (more than a bar).
 */
export function isLongDuration(duration: Beats, context: MusicalContext): boolean {
  const beatsPerBar = context.timeSignatureNumerator;
  return duration > beatsPerBar;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Snap a tick value to the nearest grid division.
 */
export function snapToGrid(
  value: Ticks,
  gridDivision: Ticks,
  context: MusicalContext = DEFAULT_MUSICAL_CONTEXT
): Ticks {
  if (gridDivision <= 0) {
    throw new RangeError(`Grid division must be positive, got: ${gridDivision}`);
  }
  return ticks(Math.round(value / gridDivision) * gridDivision);
}

/**
 * Calculate swing ratio from a percentage.
 * Swing 0% = straight 16ths
 * Swing 50% = triplet feel
 * Swing 100% = full dotted 8th swing
 */
export function swingRatio(swingPercentage: Percentage): number {
  return 1 + (swingPercentage / 100) * 0.5;
}

/**
 * Apply swing to an even subdivision tick.
 */
export function applySwing(
  tick: Ticks,
  subdivision: Ticks,
  swingPercentage: Percentage,
  context: MusicalContext = DEFAULT_MUSICAL_CONTEXT
): Ticks {
  const ratio = swingRatio(swingPercentage);
  const beatIndex = Math.floor(tick / subdivision);

  if (beatIndex % 2 === 0) {
    // Even subdivisions stay put
    return tick;
  } else {
    // Odd subdivisions get delayed
    const prevBeat = beatIndex * subdivision;
    const nextBeat = (beatIndex + 1) * subdivision;
    const delayed = prevBeat + (nextBeat - prevBeat) * ratio;
    return ticks(Math.round(delayed));
  }
}

/**
 * Calculate humanization offset (random deviation from grid).
 */
export function humanizeOffset(
  maxDeviation: Ticks,
  randomSeed?: number
): Ticks {
  // Use deterministic random if seed provided
  const rand = randomSeed !== undefined
    ? deterministicRandom(randomSeed)
    : Math.random();

  // Gaussian-like distribution (sum of 3 uniform randoms)
  const r1 = Math.random();
  const r2 = Math.random();
  const r3 = Math.random();
  const gaussian = (r1 + r2 + r3) / 3;

  // Map to [-maxDeviation, +maxDeviation]
  const offset = (gaussian - 0.5) * 2 * maxDeviation;
  return ticks(Math.round(offset));
}

/**
 * Simple deterministic pseudo-random generator.
 */
function deterministicRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Calculate tempo change factor for time stretching.
 */
export function tempoChangeFactor(
  originalTempo: Bpm,
  newTempo: Bpm
): number {
  return newTempo / originalTempo;
}

/**
 * Calculate new duration after tempo change.
 */
export function adjustDurationForTempo(
  duration: Beats,
  originalTempo: Bpm,
  newTempo: Bpm
): Beats {
  const factor = tempoChangeFactor(originalTempo, newTempo);
  return beats(duration / factor);
}

// =============================================================================
// Range Types
// =============================================================================

/**
 * A range of values with the same unit.
 */
export interface UnitRange<T> {
  readonly min: T;
  readonly max: T;
}

/**
 * Check if a value is within a range (inclusive).
 */
export function isInRange<T extends number>(
  value: T,
  range: UnitRange<T>
): boolean {
  return value >= range.min && value <= range.max;
}

/**
 * Clamp a value to a range.
 */
export function clamp<T extends number>(
  value: T,
  range: UnitRange<T>
): T {
  if (value < range.min) return range.min;
  if (value > range.max) return range.max;
  return value;
}

/**
 * Standard tempo ranges.
 */
export const TEMPO_RANGES = {
  grave: { min: bpm(20), max: bpm(40) },
  largo: { min: bpm(40), max: bpm(60) },
  adagio: { min: bpm(60), max: bpm(80) },
  andante: { min: bpm(80), max: bpm(108) },
  moderato: { min: bpm(108), max: bpm(120) },
  allegro: { min: bpm(120), max: bpm(168) },
  presto: { min: bpm(168), max: bpm(200) },
  prestissimo: { min: bpm(200), max: bpm(400) },
} as const;

/**
 * Get tempo marking name for a BPM value.
 */
export function getTempoMarking(tempo: Bpm): string {
  for (const [marking, range] of Object.entries(TEMPO_RANGES)) {
    if (isInRange(tempo, range)) {
      return marking;
    }
  }
  return 'unknown';
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard for Bpm.
 */
export function isBpm(value: unknown): value is Bpm {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 20 &&
    value <= 400
  );
}

/**
 * Type guard for Semitones.
 */
export function isSemitones(value: unknown): value is Semitones {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= -127 &&
    value <= 127
  );
}

/**
 * Type guard for Ticks.
 */
export function isTicks(value: unknown): value is Ticks {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0
  );
}

/**
 * Type guard for Normalized.
 */
export function isNormalized(value: unknown): value is Normalized {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1
  );
}

/**
 * Type guard for Percentage.
 */
export function isPercentage(value: unknown): value is Percentage {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
  );
}
