/**
 * GOFAI NL Unit Parser — Typed Unit Expressions
 *
 * Parses unit expressions like "96 BPM", "+7 semitones", "two bars",
 * "half a beat", "a few dB", returning strongly typed values with
 * canonical unit identifiers.
 *
 * ## Supported Dimensions
 *
 * - **Time**: bars, beats, measures, ticks, seconds, milliseconds
 * - **Pitch**: semitones, cents, octaves, Hz, kHz
 * - **Dynamics**: dB, decibels, velocity
 * - **Tempo**: BPM
 * - **Percentage**: %, percent
 * - **Spatial**: degrees (panning)
 * - **MIDI**: MIDI note numbers, velocity values
 *
 * ## Design
 *
 * The unit parser works post-tokenization: it takes a sequence of tokens
 * and identifies number+unit pairs, returning typed UnitExpression values.
 * It integrates with the number parser for the numeric part and the
 * normalizer for unit name canonicalization.
 *
 * @module gofai/nl/tokenizer/unit-parser
 * @see gofai_goalA.md Step 105
 */

import type { ParsedNumber } from './number-parser';
import { parseNumber } from './number-parser';

// =============================================================================
// UNIT EXPRESSION — the result of unit parsing
// =============================================================================

/**
 * A parsed unit expression: a numeric value with a typed unit.
 */
export interface UnitExpression {
  /** The numeric value */
  readonly value: ParsedNumber;

  /** The canonical unit */
  readonly unit: CanonicalUnit;

  /** Whether the value is relative (+7 semitones) or absolute (96 BPM) */
  readonly mode: ValueMode;

  /** The original text */
  readonly original: string;
}

/**
 * Whether the value is relative or absolute.
 */
export type ValueMode =
  | 'absolute'    // "96 BPM" — set to this value
  | 'relative'    // "+7 semitones" — change by this amount
  | 'factor'      // "double the tempo" — multiply by this
  | 'percentage'; // "50%" — percentage of current value

// =============================================================================
// CANONICAL UNIT — the unit type system
// =============================================================================

/**
 * A canonical unit identifier with its dimension.
 */
export interface CanonicalUnit {
  /** The canonical unit ID */
  readonly id: string;

  /** The display name */
  readonly displayName: string;

  /** The dimension this unit measures */
  readonly dimension: UnitDimension;

  /** The plural form */
  readonly plural: string;

  /** The abbreviation */
  readonly abbreviation: string;
}

/**
 * Dimensions that units can measure.
 */
export type UnitDimension =
  | 'time_musical'  // bars, beats, measures
  | 'time_absolute' // seconds, milliseconds
  | 'time_ticks'    // MIDI ticks
  | 'pitch'         // semitones, cents, octaves
  | 'frequency'     // Hz, kHz
  | 'dynamics'      // dB, velocity
  | 'tempo'         // BPM
  | 'percentage'    // %
  | 'spatial'       // degrees (panning angle)
  | 'midi'          // MIDI values
  | 'ratio'         // ratios (compression, etc.)
  | 'dimensionless'; // pure numbers

/**
 * All canonical units.
 */
export const CANONICAL_UNITS: readonly CanonicalUnit[] = [
  // Musical time
  { id: 'bars', displayName: 'bar', dimension: 'time_musical', plural: 'bars', abbreviation: 'bar' },
  { id: 'beats', displayName: 'beat', dimension: 'time_musical', plural: 'beats', abbreviation: 'bt' },
  { id: 'measures', displayName: 'measure', dimension: 'time_musical', plural: 'measures', abbreviation: 'meas' },
  { id: 'ticks', displayName: 'tick', dimension: 'time_musical', plural: 'ticks', abbreviation: 'tk' },

  // Absolute time
  { id: 'seconds', displayName: 'second', dimension: 'time_absolute', plural: 'seconds', abbreviation: 's' },
  { id: 'milliseconds', displayName: 'millisecond', dimension: 'time_absolute', plural: 'milliseconds', abbreviation: 'ms' },

  // Pitch intervals
  { id: 'semitones', displayName: 'semitone', dimension: 'pitch', plural: 'semitones', abbreviation: 'st' },
  { id: 'cents', displayName: 'cent', dimension: 'pitch', plural: 'cents', abbreviation: 'ct' },
  { id: 'octaves', displayName: 'octave', dimension: 'pitch', plural: 'octaves', abbreviation: 'oct' },
  { id: 'whole_tones', displayName: 'whole tone', dimension: 'pitch', plural: 'whole tones', abbreviation: 'wt' },

  // Frequency
  { id: 'hertz', displayName: 'Hz', dimension: 'frequency', plural: 'Hz', abbreviation: 'Hz' },
  { id: 'kilohertz', displayName: 'kHz', dimension: 'frequency', plural: 'kHz', abbreviation: 'kHz' },

  // Dynamics
  { id: 'decibels', displayName: 'dB', dimension: 'dynamics', plural: 'dB', abbreviation: 'dB' },
  { id: 'velocity', displayName: 'velocity', dimension: 'dynamics', plural: 'velocity', abbreviation: 'vel' },

  // Tempo
  { id: 'bpm', displayName: 'BPM', dimension: 'tempo', plural: 'BPM', abbreviation: 'BPM' },

  // Percentage
  { id: 'percent', displayName: '%', dimension: 'percentage', plural: '%', abbreviation: '%' },

  // Spatial
  { id: 'degrees', displayName: 'degree', dimension: 'spatial', plural: 'degrees', abbreviation: '°' },

  // MIDI
  { id: 'midi_note', displayName: 'MIDI note', dimension: 'midi', plural: 'MIDI notes', abbreviation: 'MIDI' },

  // Ratio
  { id: 'ratio', displayName: 'ratio', dimension: 'ratio', plural: 'ratio', abbreviation: ':' },

  // Dimensionless
  { id: 'count', displayName: 'count', dimension: 'dimensionless', plural: 'counts', abbreviation: '#' },
  { id: 'steps', displayName: 'step', dimension: 'dimensionless', plural: 'steps', abbreviation: 'step' },
];

// Build unit lookup by various name forms
const _unitLookup = new Map<string, CanonicalUnit>();
for (const u of CANONICAL_UNITS) {
  _unitLookup.set(u.id, u);
  _unitLookup.set(u.displayName.toLowerCase(), u);
  _unitLookup.set(u.plural.toLowerCase(), u);
  _unitLookup.set(u.abbreviation.toLowerCase(), u);
}

/**
 * Unit name aliases — maps various spellings to canonical unit IDs.
 */
export const UNIT_ALIASES: Readonly<Record<string, string>> = {
  // Time
  'bar': 'bars',
  'bars': 'bars',
  'measure': 'bars',
  'measures': 'bars',
  'meas': 'bars',
  'beat': 'beats',
  'beats': 'beats',
  'bt': 'beats',
  'tick': 'ticks',
  'ticks': 'ticks',
  'tk': 'ticks',
  's': 'seconds',
  'sec': 'seconds',
  'secs': 'seconds',
  'second': 'seconds',
  'seconds': 'seconds',
  'ms': 'milliseconds',
  'msec': 'milliseconds',
  'millisecond': 'milliseconds',
  'milliseconds': 'milliseconds',

  // Pitch
  'st': 'semitones',
  'semitone': 'semitones',
  'semitones': 'semitones',
  'half step': 'semitones',
  'half steps': 'semitones',
  'half-step': 'semitones',
  'half-steps': 'semitones',
  'halfstep': 'semitones',
  'halfsteps': 'semitones',
  'ct': 'cents',
  'cent': 'cents',
  'cents': 'cents',
  'oct': 'octaves',
  'octave': 'octaves',
  'octaves': 'octaves',
  'wt': 'whole_tones',
  'whole tone': 'whole_tones',
  'whole tones': 'whole_tones',
  'whole step': 'whole_tones',
  'whole steps': 'whole_tones',

  // Frequency
  'hz': 'hertz',
  'hertz': 'hertz',
  'khz': 'kilohertz',
  'kilohertz': 'kilohertz',

  // Dynamics
  'db': 'decibels',
  'decibel': 'decibels',
  'decibels': 'decibels',
  'vel': 'velocity',
  'velocity': 'velocity',

  // Tempo
  'bpm': 'bpm',
  'beats per minute': 'bpm',

  // Percentage
  '%': 'percent',
  'percent': 'percent',
  'pct': 'percent',

  // MIDI
  'midi': 'midi_note',

  // Steps
  'step': 'steps',
  'steps': 'steps',

  // Ratio
  'ratio': 'ratio',
  ':1': 'ratio',
};

/**
 * Look up a canonical unit by name.
 */
export function lookupUnit(name: string): CanonicalUnit | undefined {
  const lower = name.toLowerCase();

  // Direct lookup
  const direct = _unitLookup.get(lower);
  if (direct) return direct;

  // Alias lookup
  const aliasId = UNIT_ALIASES[lower];
  if (aliasId) return _unitLookup.get(aliasId);

  return undefined;
}

// =============================================================================
// UNIT EXPRESSION PARSING
// =============================================================================

/**
 * Parse a unit expression from text.
 * Handles: "96 BPM", "+7 semitones", "two bars", "half a beat", "3dB"
 */
export function parseUnitExpression(text: string): UnitExpression | null {
  const trimmed = text.trim();

  // Detect relative mode: starts with + or -
  let mode: ValueMode = 'absolute';
  let workText = trimmed;

  if (workText.startsWith('+')) {
    mode = 'relative';
    workText = workText.slice(1).trim();
  } else if (workText.startsWith('-')) {
    mode = 'relative';
    // Keep the - for negative parsing
  }

  // Try "number + unit" pattern
  const result = tryNumberUnit(workText, mode);
  if (result) return result;

  // Try "number" + "unit" (no space, like "3dB", "96BPM")
  const attached = tryAttachedUnit(workText, mode);
  if (attached) return attached;

  // Try percentage: "50%"
  const pct = tryPercentage(workText);
  if (pct) return pct;

  // Try ratio: "4:1"
  const ratio = tryRatio(workText);
  if (ratio) return ratio;

  return null;
}

/**
 * Try to parse "number unit" pattern.
 */
function tryNumberUnit(text: string, mode: ValueMode): UnitExpression | null {
  // Split into parts and try to find a unit word at the end
  const parts = text.split(/\s+/);
  if (parts.length < 2) return null;

  // Try last word as unit
  const lastWord = parts[parts.length - 1]!;
  const unit = lookupUnit(lastWord);
  if (!unit) {
    // Try last two words as unit ("half steps", "whole tones")
    if (parts.length >= 3) {
      const lastTwo = parts.slice(-2).join(' ');
      const unit2 = lookupUnit(lastTwo);
      if (unit2) {
        const numText = parts.slice(0, -2).join(' ');
        const num = parseNumber(numText);
        if (num) {
          return { value: num, unit: unit2, mode, original: text };
        }
      }
    }
    return null;
  }

  const numText = parts.slice(0, -1).join(' ');
  const num = parseNumber(numText);
  if (!num) return null;

  return { value: num, unit, mode, original: text };
}

/**
 * Try to parse attached number+unit like "3dB", "96BPM", "7st".
 */
function tryAttachedUnit(text: string, mode: ValueMode): UnitExpression | null {
  // Match: digits followed by letters
  const match = /^([+-]?\d+(?:\.\d+)?)\s*([a-zA-Z%°]+)$/.exec(text);
  if (!match) return null;

  const numStr = match[1]!;
  const unitStr = match[2]!;

  const num = parseNumber(numStr);
  if (!num) return null;

  const unit = lookupUnit(unitStr);
  if (!unit) return null;

  // Detect relative from sign
  if (numStr.startsWith('+') || numStr.startsWith('-')) {
    mode = 'relative';
  }

  return { value: num, unit, mode, original: text };
}

/**
 * Try to parse percentage: "50%", "75 percent"
 */
function tryPercentage(text: string): UnitExpression | null {
  // "50%"
  const pctMatch = /^([+-]?\d+(?:\.\d+)?)%$/.exec(text);
  if (pctMatch) {
    const num = parseNumber(pctMatch[1]!);
    if (num) {
      const unit = lookupUnit('%')!;
      const mode: ValueMode = pctMatch[1]!.startsWith('+') || pctMatch[1]!.startsWith('-')
        ? 'relative'
        : 'percentage';
      return { value: num, unit, mode, original: text };
    }
  }

  // "50 percent"
  if (text.endsWith(' percent') || text.endsWith(' pct')) {
    const numText = text.replace(/\s+(percent|pct)$/, '');
    const num = parseNumber(numText);
    if (num) {
      const unit = lookupUnit('%')!;
      return { value: num, unit, mode: 'percentage', original: text };
    }
  }

  return null;
}

/**
 * Try to parse ratio: "4:1", "2:1", "10:1"
 */
function tryRatio(text: string): UnitExpression | null {
  const match = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(text);
  if (!match) return null;

  const numerator = parseFloat(match[1]!);
  const denominator = parseFloat(match[2]!);
  if (isNaN(numerator) || isNaN(denominator) || denominator === 0) return null;

  const value = numerator / denominator;
  const num = parseNumber(String(value));
  if (!num) return null;

  const unit = lookupUnit('ratio')!;
  return { value: num, unit, mode: 'absolute', original: text };
}

// =============================================================================
// BATCH UNIT PARSING — find unit expressions in token stream
// =============================================================================

/**
 * A unit expression found in a token stream.
 */
export interface FoundUnitExpression {
  /** The parsed unit expression */
  readonly expression: UnitExpression;

  /** Start token index */
  readonly startTokenIndex: number;

  /** End token index (exclusive) */
  readonly endTokenIndex: number;

  /** The original text */
  readonly text: string;
}

/**
 * Find all unit expressions in a list of token texts.
 */
export function findUnitExpressions(tokenTexts: readonly string[]): readonly FoundUnitExpression[] {
  const results: FoundUnitExpression[] = [];
  const consumed = new Set<number>();

  // Try windows of 4, 3, 2, 1 tokens
  for (let windowSize = 4; windowSize >= 1; windowSize--) {
    for (let i = 0; i <= tokenTexts.length - windowSize; i++) {
      // Skip if any token in window is already consumed
      let skip = false;
      for (let j = i; j < i + windowSize; j++) {
        if (consumed.has(j)) { skip = true; break; }
      }
      if (skip) continue;

      const slice = tokenTexts.slice(i, i + windowSize);
      const combined = slice.join(' ');
      const expr = parseUnitExpression(combined);

      if (expr) {
        results.push({
          expression: expr,
          startTokenIndex: i,
          endTokenIndex: i + windowSize,
          text: combined,
        });
        for (let j = i; j < i + windowSize; j++) consumed.add(j);
      }
    }
  }

  return results.sort((a, b) => a.startTokenIndex - b.startTokenIndex);
}

// =============================================================================
// UNIT CONVERSION
// =============================================================================

/**
 * Conversion factors between units in the same dimension.
 * Maps from_unit → to_unit → factor (multiply to convert).
 */
export const UNIT_CONVERSIONS: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  // Pitch
  'semitones': { 'cents': 100, 'octaves': 1 / 12, 'whole_tones': 0.5 },
  'cents': { 'semitones': 0.01, 'octaves': 1 / 1200 },
  'octaves': { 'semitones': 12, 'cents': 1200 },
  'whole_tones': { 'semitones': 2, 'cents': 200 },

  // Time
  'seconds': { 'milliseconds': 1000 },
  'milliseconds': { 'seconds': 0.001 },

  // Frequency
  'hertz': { 'kilohertz': 0.001 },
  'kilohertz': { 'hertz': 1000 },
};

/**
 * Convert a value from one unit to another.
 * Returns null if conversion is not possible.
 */
export function convertUnit(
  value: number,
  fromUnit: string,
  toUnit: string,
): number | null {
  if (fromUnit === toUnit) return value;

  const conversions = UNIT_CONVERSIONS[fromUnit];
  if (!conversions) return null;

  const factor = conversions[toUnit];
  if (factor === undefined) return null;

  return value * factor;
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format a unit expression for display.
 */
export function formatUnitExpression(expr: UnitExpression): string {
  const sign = expr.mode === 'relative' ? '+' : '';
  const numStr = formatNumberForUnit(expr.value);
  return `${sign}${numStr} ${expr.unit.abbreviation}`;
}

/**
 * Format a number for unit display.
 */
function formatNumberForUnit(n: ParsedNumber): string {
  switch (n.type) {
    case 'exact':
      return String(n.value);
    case 'range':
      return `${n.min}–${n.max}`;
    case 'vague':
      return `~${n.estimate}`;
    case 'fraction':
      return `${n.numerator}/${n.denominator}`;
    case 'multiple':
      return `×${n.factor}`;
    case 'ordinal':
      return `#${n.position}`;
    case 'time_signature':
      return `${n.numerator}/${n.denominator}`;
  }
}

/**
 * Format a canonical unit for display.
 */
export function formatUnit(unit: CanonicalUnit): string {
  return `${unit.displayName} (${unit.abbreviation}) [${unit.dimension}]`;
}

// =============================================================================
// STATISTICS
// =============================================================================

export interface UnitParserStats {
  readonly totalCanonicalUnits: number;
  readonly totalAliases: number;
  readonly totalConversions: number;
  readonly byDimension: Readonly<Record<string, number>>;
}

export function getUnitParserStats(): UnitParserStats {
  const byDim: Record<string, number> = {};
  for (const u of CANONICAL_UNITS) {
    byDim[u.dimension] = (byDim[u.dimension] ?? 0) + 1;
  }

  let totalConversions = 0;
  for (const from of Object.values(UNIT_CONVERSIONS)) {
    totalConversions += Object.keys(from).length;
  }

  return {
    totalCanonicalUnits: CANONICAL_UNITS.length,
    totalAliases: Object.keys(UNIT_ALIASES).length,
    totalConversions,
    byDimension: byDim,
  };
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const UNIT_PARSER_RULES = [
  'Rule UNIT-001: Unit expressions consist of a number followed by a unit. ' +
  'Both "96 BPM" (spaced) and "3dB" (attached) are recognized.',

  'Rule UNIT-002: Values prefixed with "+" or "-" are relative (changes). ' +
  'Values without a sign are absolute (set to this value).',

  'Rule UNIT-003: Word numbers are supported as the numeric part: ' +
  '"two bars", "half a beat", "a few dB".',

  'Rule UNIT-004: Unit names are canonicalized via the UNIT_ALIASES table. ' +
  'Multiple spellings ("semitones", "half steps", "st") all resolve to the same unit.',

  'Rule UNIT-005: Percentages ("50%", "75 percent") are parsed as a special ' +
  'value mode that means "percentage of current value".',

  'Rule UNIT-006: Ratios ("4:1") are parsed as the ratio dimension. ' +
  'Common in compression settings.',

  'Rule UNIT-007: Time signatures ("4/4", "6/8") are handled by the number ' +
  'parser, not the unit parser. They are not unit expressions.',

  'Rule UNIT-008: Unit conversion is supported between compatible units ' +
  '(e.g., semitones ↔ cents ↔ octaves). Incompatible conversions return null.',

  'Rule UNIT-009: Multi-word units ("half steps", "whole tones", "beats per minute") ' +
  'are recognized by trying multiple token windows.',

  'Rule UNIT-010: The unit parser is deterministic: the same input always ' +
  'produces the same unit expression.',

  'Rule UNIT-011: Unknown unit names are not silently dropped. If the number ' +
  'part parses but the unit does not, no UnitExpression is returned.',

  'Rule UNIT-012: Every canonical unit has an ID, display name, plural, ' +
  'abbreviation, and dimension. This is the SSOT for unit vocabulary.',
] as const;
