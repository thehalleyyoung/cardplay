/**
 * GOFAI Units — Measurement Units and Conversions
 *
 * This module defines the canonical vocabulary for units of measurement
 * used in music editing commands.
 *
 * @module gofai/canon/units
 */

import {
  type MeasurementUnit,
  type UnitId,
  type UnitCategory,
  type VocabularyTable,
  createUnitId,
  createVocabularyTable,
} from './types';

// =============================================================================
// Time Units
// =============================================================================

const UNIT_BAR: MeasurementUnit = {
  id: createUnitId('bar'),
  name: 'Bar',
  abbreviations: ['bars', 'measure', 'measures', 'm'],
  category: 'time',
};

const UNIT_BEAT: MeasurementUnit = {
  id: createUnitId('beat'),
  name: 'Beat',
  abbreviations: ['beats', 'b'],
  category: 'time',
  baseUnit: createUnitId('bar'),
  conversionFactor: 0.25, // 4/4 time default
};

const UNIT_TICK: MeasurementUnit = {
  id: createUnitId('tick'),
  name: 'Tick',
  abbreviations: ['ticks', 't'],
  category: 'time',
  baseUnit: createUnitId('beat'),
  conversionFactor: 1 / 960, // PPQ = 960
};

const UNIT_SECOND: MeasurementUnit = {
  id: createUnitId('second'),
  name: 'Second',
  abbreviations: ['seconds', 'sec', 's'],
  category: 'time',
};

const UNIT_MILLISECOND: MeasurementUnit = {
  id: createUnitId('millisecond'),
  name: 'Millisecond',
  abbreviations: ['milliseconds', 'ms'],
  category: 'time',
  baseUnit: createUnitId('second'),
  conversionFactor: 0.001,
};

// =============================================================================
// Pitch Units
// =============================================================================

const UNIT_SEMITONE: MeasurementUnit = {
  id: createUnitId('semitone'),
  name: 'Semitone',
  abbreviations: ['semitones', 'st', 'half step', 'half steps'],
  category: 'pitch',
};

const UNIT_CENT: MeasurementUnit = {
  id: createUnitId('cent'),
  name: 'Cent',
  abbreviations: ['cents', 'c'],
  category: 'pitch',
  baseUnit: createUnitId('semitone'),
  conversionFactor: 0.01,
};

const UNIT_OCTAVE: MeasurementUnit = {
  id: createUnitId('octave'),
  name: 'Octave',
  abbreviations: ['octaves', 'oct'],
  category: 'pitch',
  baseUnit: createUnitId('semitone'),
  conversionFactor: 12,
};

const UNIT_TONE: MeasurementUnit = {
  id: createUnitId('tone'),
  name: 'Tone',
  abbreviations: ['tones', 'whole step', 'whole steps'],
  category: 'pitch',
  baseUnit: createUnitId('semitone'),
  conversionFactor: 2,
};

// =============================================================================
// Tempo Units
// =============================================================================

const UNIT_BPM: MeasurementUnit = {
  id: createUnitId('bpm'),
  name: 'BPM',
  abbreviations: ['beats per minute'],
  category: 'tempo',
  validRange: [20, 300],
};

const UNIT_BPM_CHANGE: MeasurementUnit = {
  id: createUnitId('bpm_change'),
  name: 'BPM Change',
  abbreviations: ['bpm change', 'tempo change'],
  category: 'tempo',
  validRange: [-100, 100],
};

// =============================================================================
// Dynamic Units
// =============================================================================

const UNIT_DECIBEL: MeasurementUnit = {
  id: createUnitId('decibel'),
  name: 'Decibel',
  abbreviations: ['decibels', 'dB', 'db'],
  category: 'dynamic',
};

const UNIT_VELOCITY: MeasurementUnit = {
  id: createUnitId('velocity'),
  name: 'Velocity',
  abbreviations: ['vel', 'v'],
  category: 'dynamic',
  validRange: [0, 127],
};

// =============================================================================
// Ratio Units
// =============================================================================

const UNIT_PERCENT: MeasurementUnit = {
  id: createUnitId('percent'),
  name: 'Percent',
  abbreviations: ['%', 'pct'],
  category: 'ratio',
  validRange: [0, 100],
};

const UNIT_PERCENTAGE: MeasurementUnit = {
  id: createUnitId('percentage'),
  name: 'Percentage',
  abbreviations: ['%', 'pct', 'percent'],
  category: 'ratio',
  validRange: [0, 100],
};

const UNIT_RATIO: MeasurementUnit = {
  id: createUnitId('ratio'),
  name: 'Ratio',
  abbreviations: ['ratio'],
  category: 'ratio',
};

const UNIT_LEVEL: MeasurementUnit = {
  id: createUnitId('level'),
  name: 'Level',
  abbreviations: ['level', 'lvl'],
  category: 'dynamic',
  validRange: [0, 1],
};

const UNIT_FACTOR: MeasurementUnit = {
  id: createUnitId('factor'),
  name: 'Factor',
  abbreviations: ['x', 'times'],
  category: 'ratio',
};

// =============================================================================
// Frequency Units
// =============================================================================

const UNIT_HERTZ: MeasurementUnit = {
  id: createUnitId('hertz'),
  name: 'Hertz',
  abbreviations: ['Hz', 'hz', 'hertz'],
  category: 'frequency',
};

const UNIT_KILOHERTZ: MeasurementUnit = {
  id: createUnitId('kilohertz'),
  name: 'Kilohertz',
  abbreviations: ['kHz', 'khz', 'k'],
  category: 'frequency',
  baseUnit: createUnitId('hertz'),
  conversionFactor: 1000,
};

// =============================================================================
// Unit Table
// =============================================================================

/**
 * All core measurement units.
 */
export const CORE_UNITS: readonly MeasurementUnit[] = [
  // Time
  UNIT_BAR,
  UNIT_BEAT,
  UNIT_TICK,
  UNIT_SECOND,
  UNIT_MILLISECOND,
  // Pitch
  UNIT_SEMITONE,
  UNIT_CENT,
  UNIT_OCTAVE,
  UNIT_TONE,
  // Tempo
  UNIT_BPM,
  // Dynamic
  UNIT_DECIBEL,
  UNIT_VELOCITY,
  // Ratio
  UNIT_PERCENT,
  UNIT_FACTOR,
  // Frequency
  UNIT_HERTZ,
  UNIT_KILOHERTZ,
];

/**
 * Unit vocabulary table.
 */
export const UNITS_TABLE: VocabularyTable<MeasurementUnit> = createVocabularyTable(
  CORE_UNITS.map(u => ({
    ...u,
    variants: u.abbreviations,
  }))
);

// =============================================================================
// Unit Utilities
// =============================================================================

/**
 * Get a unit by ID.
 */
export function getUnitById(id: UnitId): MeasurementUnit | undefined {
  return UNITS_TABLE.byId.get(id);
}

/**
 * Get a unit by name or abbreviation.
 */
export function getUnitByName(name: string): MeasurementUnit | undefined {
  return UNITS_TABLE.byVariant.get(name.toLowerCase());
}

/**
 * Check if a string refers to a unit.
 */
export function isUnit(name: string): boolean {
  return UNITS_TABLE.byVariant.has(name.toLowerCase());
}

/**
 * Get all units in a category.
 */
export function getUnitsByCategory(category: UnitCategory): readonly MeasurementUnit[] {
  return CORE_UNITS.filter(u => u.category === category);
}

// =============================================================================
// Value Parsing
// =============================================================================

/**
 * A parsed value with unit.
 */
export interface ParsedValue {
  /** The numeric value */
  readonly value: number;

  /** The unit of measurement */
  readonly unit: MeasurementUnit;

  /** Whether the value is relative (e.g., "+2 semitones") */
  readonly isRelative: boolean;

  /** Direction for relative values */
  readonly direction?: 'increase' | 'decrease';
}

/**
 * Parse a value string with optional unit.
 *
 * Examples:
 * - "2 bars" → { value: 2, unit: bar, isRelative: false }
 * - "+7 semitones" → { value: 7, unit: semitone, isRelative: true, direction: 'increase' }
 * - "-3dB" → { value: 3, unit: decibel, isRelative: true, direction: 'decrease' }
 * - "96 BPM" → { value: 96, unit: bpm, isRelative: false }
 * - "120%" → { value: 120, unit: percent, isRelative: false }
 */
export function parseValue(input: string): ParsedValue | undefined {
  const normalized = input.trim().toLowerCase();

  // Match patterns like "+3dB", "-2 semitones", "96 BPM", "120%"
  const pattern = /^([+-])?(\d+(?:\.\d+)?)\s*(.+)?$/;
  const match = normalized.match(pattern);

  if (!match) {
    return undefined;
  }

  const sign = match[1];
  const numericValueStr = match[2];
  const unitString = match[3]?.trim();

  if (!numericValueStr || !unitString) {
    return undefined;
  }

  const numericValue = parseFloat(numericValueStr);

  // Determine relativity and direction
  const isRelative = sign !== undefined;
  const direction: ParsedValue['direction'] = sign === '+'
    ? 'increase'
    : sign === '-'
      ? 'decrease'
      : undefined;

  // Look up unit
  const unit = getUnitByName(unitString);
  if (!unit) {
    return undefined; // Unknown unit
  }

  // Validate range if applicable
  if (unit.validRange) {
    const [min, max] = unit.validRange;
    if (numericValue < min || numericValue > max) {
      // Value out of range - still return it but caller may want to warn
    }
  }

  // Build result with only defined properties
  if (direction !== undefined) {
    return {
      value: numericValue,
      unit,
      isRelative,
      direction,
    };
  } else {
    return {
      value: numericValue,
      unit,
      isRelative,
    };
  }
}

/**
 * Convert a value to a different unit (if compatible).
 */
export function convertValue(
  value: number,
  fromUnit: MeasurementUnit,
  toUnit: MeasurementUnit
): number | undefined {
  // Must be same category
  if (fromUnit.category !== toUnit.category) {
    return undefined;
  }

  // Direct conversion via base unit
  if (fromUnit.baseUnit === toUnit.id) {
    // from is the smaller unit, multiply by conversion factor
    return value * (fromUnit.conversionFactor ?? 1);
  }

  if (toUnit.baseUnit === fromUnit.id) {
    // to is the smaller unit, divide by conversion factor
    return value / (toUnit.conversionFactor ?? 1);
  }

  if (fromUnit.baseUnit && fromUnit.baseUnit === toUnit.baseUnit) {
    // Both convert via same base unit
    const fromFactor = fromUnit.conversionFactor ?? 1;
    const toFactor = toUnit.conversionFactor ?? 1;
    return (value * fromFactor) / toFactor;
  }

  if (fromUnit.id === toUnit.id) {
    // Same unit, no conversion needed
    return value;
  }

  // No conversion path found
  return undefined;
}

/**
 * Format a value with its unit.
 */
export function formatValue(value: number, unit: MeasurementUnit): string {
  // Use appropriate precision
  const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(2);

  // Use primary abbreviation if available
  const unitStr = unit.abbreviations[0] || unit.name;

  return `${formatted} ${unitStr}`;
}

// =============================================================================
// Word Number Parsing
// =============================================================================

/**
 * Word numbers mapping.
 */
const WORD_NUMBERS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  'a couple': 2,
  'a few': 3,
  several: 4,
  half: 0.5,
  quarter: 0.25,
};

/**
 * Parse a word number to its numeric value.
 */
export function parseWordNumber(word: string): number | undefined {
  return WORD_NUMBERS[word.toLowerCase()];
}

/**
 * Parse a number (word or digit).
 */
export function parseNumber(input: string): number | undefined {
  const normalized = input.trim().toLowerCase();

  // Try word number first
  const wordNum = parseWordNumber(normalized);
  if (wordNum !== undefined) {
    return wordNum;
  }

  // Try parsing as numeric
  const num = parseFloat(normalized);
  if (!isNaN(num)) {
    return num;
  }

  return undefined;
}

// =============================================================================
// Duration Expressions
// =============================================================================

/**
 * Parse a duration expression like "two bars", "8 beats", "half a bar".
 */
export function parseDuration(input: string): ParsedValue | undefined {
  const normalized = input.trim().toLowerCase();

  // Handle "half a bar", "quarter of a beat", etc.
  const fractionPattern = /^(half|quarter|third)\s+(a\s+|of\s+a\s+)?(.+)$/;
  const fractionMatch = normalized.match(fractionPattern);

  if (fractionMatch) {
    const fractionWord = fractionMatch[1];
    const unitStr = fractionMatch[3];
    
    if (!fractionWord || !unitStr) {
      return undefined;
    }
    
    const fraction =
      fractionWord === 'half' ? 0.5 : fractionWord === 'quarter' ? 0.25 : 1 / 3;
    const unit = getUnitByName(unitStr);

    if (unit && unit.category === 'time') {
      return {
        value: fraction,
        unit,
        isRelative: false,
      };
    }
  }

  // Handle "two bars", "8 beats", etc.
  const numberPattern = /^(\w+|\d+(?:\.\d+)?)\s+(.+)$/;
  const numberMatch = normalized.match(numberPattern);

  if (numberMatch) {
    const numStr = numberMatch[1];
    const unitStr = numberMatch[2];
    
    if (!numStr || !unitStr) {
      return undefined;
    }

    const value = parseNumber(numStr);
    const unit = getUnitByName(unitStr);

    if (value !== undefined && unit && unit.category === 'time') {
      return {
        value,
        unit,
        isRelative: false,
      };
    }
  }

  return undefined;
}

// =============================================================================
// Unit Refinement Constraints (Step 061 - Extended)
// =============================================================================

/**
 * Refinement constraints for unit values.
 * These define valid ranges and validation rules (Step 045 from gofai_goalB.md).
 */
export interface UnitRefinement {
  readonly unitId: UnitId;
  readonly minValue?: number;
  readonly maxValue?: number;
  readonly allowZero: boolean;
  readonly allowNegative: boolean;
  readonly precision?: number;
  readonly validator?: (value: number) => UnitValidationResult;
}

export type UnitValidationResult =
  | { readonly valid: true }
  | { readonly valid: false; readonly reason: string; readonly suggestion?: string };

/**
 * Tempo refinements: BPM must be positive and within reasonable range.
 */
export const BPM_REFINEMENT: UnitRefinement = {
  unitId: createUnitId('bpm'),
  minValue: 20,
  maxValue: 300,
  allowZero: false,
  allowNegative: false,
  precision: 2,
  validator: (value: number): UnitValidationResult => {
    if (value <= 0) {
      return {
        valid: false,
        reason: 'BPM must be positive',
        suggestion: 'Use a tempo between 20 and 300 BPM'
      };
    }
    if (value < 20) {
      return {
        valid: false,
        reason: 'BPM too slow for typical music',
        suggestion: 'Consider using 20-300 BPM range'
      };
    }
    if (value > 300) {
      return {
        valid: false,
        reason: 'BPM too fast for typical music',
        suggestion: 'Consider using 20-300 BPM range'
      };
    }
    return { valid: true };
  }
};

/**
 * Stereo width refinements: 0-1 normalized range.
 */
export const WIDTH_REFINEMENT: UnitRefinement = {
  unitId: createUnitId('ratio'),
  minValue: 0,
  maxValue: 1,
  allowZero: true,
  allowNegative: false,
  precision: 3,
  validator: (value: number): UnitValidationResult => {
    if (value < 0 || value > 1) {
      return {
        valid: false,
        reason: 'Width must be between 0 and 1',
        suggestion: 'Use 0 for mono, 1 for full stereo'
      };
    }
    return { valid: true };
  }
};

/**
 * Decibel refinements: typical range -96 to +12 dB.
 */
export const DECIBEL_REFINEMENT: UnitRefinement = {
  unitId: createUnitId('decibel'),
  minValue: -96,
  maxValue: 12,
  allowZero: true,
  allowNegative: true,
  precision: 1,
  validator: (value: number): UnitValidationResult => {
    if (value < -96) {
      return {
        valid: false,
        reason: 'Volume too low (below -96 dB)',
        suggestion: 'Use -96 dB for silence'
      };
    }
    if (value > 12) {
      return {
        valid: false,
        reason: 'Volume too high (above +12 dB)',
        suggestion: 'Avoid clipping by staying below +12 dB'
      };
    }
    return { valid: true };
  }
};

/**
 * Percentage refinements: 0-100% standard range.
 */
export const PERCENTAGE_REFINEMENT: UnitRefinement = {
  unitId: createUnitId('percentage'),
  minValue: 0,
  maxValue: 100,
  allowZero: true,
  allowNegative: false,
  precision: 1,
  validator: (value: number): UnitValidationResult => {
    if (value < 0 || value > 100) {
      return {
        valid: false,
        reason: 'Percentage must be between 0 and 100',
        suggestion: 'Use 0-100% range'
      };
    }
    return { valid: true };
  }
};

/**
 * Frequency refinements: 20 Hz - 20 kHz for audio.
 */
export const FREQUENCY_REFINEMENT: UnitRefinement = {
  unitId: createUnitId('hertz'),
  minValue: 20,
  maxValue: 20000,
  allowZero: false,
  allowNegative: false,
  precision: 1,
  validator: (value: number): UnitValidationResult => {
    if (value <= 0) {
      return {
        valid: false,
        reason: 'Frequency must be positive',
        suggestion: 'Use 20-20000 Hz for audible range'
      };
    }
    if (value < 20) {
      return {
        valid: false,
        reason: 'Frequency below human hearing range',
        suggestion: 'Use frequencies above 20 Hz'
      };
    }
    if (value > 20000) {
      return {
        valid: false,
        reason: 'Frequency above human hearing range',
        suggestion: 'Use frequencies below 20 kHz'
      };
    }
    return { valid: true };
  }
};

/**
 * Semitone refinements: typical range -24 to +24.
 */
export const SEMITONE_REFINEMENT: UnitRefinement = {
  unitId: createUnitId('semitone'),
  minValue: -24,
  maxValue: 24,
  allowZero: true,
  allowNegative: true,
  precision: 2,
  validator: (value: number): UnitValidationResult => {
    if (Math.abs(value) > 24) {
      return {
        valid: false,
        reason: 'Pitch shift beyond typical range',
        suggestion: 'Keep within ±24 semitones (2 octaves)'
      };
    }
    return { valid: true };
  }
};

/**
 * Bar position refinements: must be positive.
 */
export const BAR_REFINEMENT: UnitRefinement = {
  unitId: createUnitId('bar'),
  minValue: 1,
  maxValue: 9999,
  allowZero: false,
  allowNegative: false,
  precision: 3,
  validator: (value: number): UnitValidationResult => {
    if (value < 1) {
      return {
        valid: false,
        reason: 'Bar numbers start at 1',
        suggestion: 'Use bar 1 or higher'
      };
    }
    if (value > 9999) {
      return {
        valid: false,
        reason: 'Bar number unreasonably large',
        suggestion: 'Check if this is the intended bar number'
      };
    }
    return { valid: true };
  }
};

/**
 * Registry of all unit refinements.
 */
export const UNIT_REFINEMENTS: ReadonlyMap<UnitId, UnitRefinement> = new Map([
  [createUnitId('bpm'), BPM_REFINEMENT],
  [createUnitId('ratio'), WIDTH_REFINEMENT],
  [createUnitId('decibel'), DECIBEL_REFINEMENT],
  [createUnitId('percentage'), PERCENTAGE_REFINEMENT],
  [createUnitId('hertz'), FREQUENCY_REFINEMENT],
  [createUnitId('semitone'), SEMITONE_REFINEMENT],
  [createUnitId('bar'), BAR_REFINEMENT],
]);

/**
 * Get refinement constraints for a unit.
 */
export function getUnitRefinement(unitId: UnitId): UnitRefinement | undefined {
  return UNIT_REFINEMENTS.get(unitId);
}

/**
 * Validate a value against unit refinements.
 */
export function validateUnitValue(unitId: UnitId, value: number): UnitValidationResult {
  const refinement = getUnitRefinement(unitId);
  if (!refinement) {
    return { valid: true };
  }

  if (value === 0 && !refinement.allowZero) {
    return {
      valid: false,
      reason: `${unitId} cannot be zero`,
      suggestion: 'Use a non-zero value'
    };
  }

  if (value < 0 && !refinement.allowNegative) {
    return {
      valid: false,
      reason: `${unitId} cannot be negative`,
      suggestion: 'Use a positive value'
    };
  }

  if (refinement.minValue !== undefined && value < refinement.minValue) {
    return {
      valid: false,
      reason: `${unitId} value ${value} is below minimum ${refinement.minValue}`,
      suggestion: `Use a value >= ${refinement.minValue}`
    };
  }

  if (refinement.maxValue !== undefined && value > refinement.maxValue) {
    return {
      valid: false,
      reason: `${unitId} value ${value} exceeds maximum ${refinement.maxValue}`,
      suggestion: `Use a value <= ${refinement.maxValue}`
    };
  }

  if (refinement.validator) {
    return refinement.validator(value);
  }

  return { valid: true };
}

/**
 * Round value to unit precision.
 */
export function roundToUnitPrecision(unitId: UnitId, value: number): number {
  const refinement = getUnitRefinement(unitId);
  if (!refinement || refinement.precision === undefined) {
    return value;
  }

  const factor = Math.pow(10, refinement.precision);
  return Math.round(value * factor) / factor;
}

/**
 * Check if two units are compatible for conversion.
 */
export function areUnitsCompatible(unit1: UnitId, unit2: UnitId): boolean {
  const u1 = ALL_UNITS_FLAT.find(u => u.id === unit1);
  const u2 = ALL_UNITS_FLAT.find(u => u.id === unit2);
  
  if (!u1 || !u2) {
    return false;
  }

  return u1.category === u2.category;
}

/**
 * Get the base unit for a given unit.
 */
export function getBaseUnit(unitId: UnitId): UnitId {
  const unit = ALL_UNITS_FLAT.find(u => u.id === unitId);
  if (!unit) {
    return unitId;
  }

  if (unit.baseUnit) {
    return getBaseUnit(unit.baseUnit);
  }

  return unitId;
}

/**
 * Format a value with its unit for display.
 */
export function formatUnitValue(value: number, unitId: UnitId): string {
  const unit = ALL_UNITS_FLAT.find(u => u.id === unitId);
  if (!unit) {
    return `${value}`;
  }

  const rounded = roundToUnitPrecision(unitId, value);
  const abbrev = unit.abbreviations[0] || unit.name;
  
  return `${rounded} ${abbrev}`;
}

/**
 * Parse a string value with unit.
 */
export function parseUnitValueString(input: string): { value: number; unitId: UnitId } | undefined {
  const match = input.match(/^([-+]?[0-9]*\.?[0-9]+)\s*([a-zA-Z%]+)$/);
  if (!match) {
    return undefined;
  }

  const value = parseFloat(match[1]);
  const unitStr = match[2].toLowerCase();

  const unit = ALL_UNITS_FLAT.find(u => 
    u.abbreviations.some(abbr => abbr.toLowerCase() === unitStr) ||
    u.name.toLowerCase() === unitStr
  );

  if (!unit) {
    return undefined;
  }

  return { value, unitId: unit.id };
}

/**
 * All units flattened for lookup.
 */
const ALL_UNITS_FLAT: readonly MeasurementUnit[] = [
  UNIT_BAR,
  UNIT_BEAT,
  UNIT_TICK,
  UNIT_SECOND,
  UNIT_MILLISECOND,
  UNIT_SEMITONE,
  UNIT_CENT,
  UNIT_OCTAVE,
  UNIT_TONE,
  UNIT_BPM,
  UNIT_BPM_CHANGE,
  UNIT_DECIBEL,
  UNIT_PERCENT,
  UNIT_LEVEL,
  UNIT_HERTZ,
  UNIT_KILOHERTZ,
  UNIT_RATIO,
  UNIT_PERCENTAGE,
];
