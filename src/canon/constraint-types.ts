/**
 * @fileoverview Canonical Music Constraint Types
 * 
 * Defines canonical builtin MusicConstraint type strings as specified in
 * `cardplay/docs/canon/ids.md`.
 * 
 * @module @cardplay/canon/constraint-types
 * @see cardplay/docs/canon/ids.md (MusicConstraint Type Strings section)
 * @see to_fix_repo_plan_500.md Change 076
 */

// ============================================================================
// CANONICAL CONSTRAINT TYPES
// ============================================================================

/**
 * Key/Tonality constraint types.
 */
export const KEY_CONSTRAINT_TYPES = [
  'key',              // Key constraint: { key, mode }
  'tonality_model',   // Analysis model: { model: TonalityModel }
] as const;

/**
 * Meter/Rhythm constraint types.
 */
export const METER_CONSTRAINT_TYPES = [
  'meter',            // Time signature: { numerator, denominator }
  'tempo',            // Tempo: { bpm, allowRubato }
] as const;

/**
 * Harmony constraint types.
 */
export const HARMONY_CONSTRAINT_TYPES = [
  'cadence',          // Cadence: { cadenceType, position }
  'chord_progression',// Progression: { progression: ChordSymbol[] }
  'harmonic_rhythm',  // Rate: { beatsPerChord }
  'avoid_parallel',   // Voice leading: { intervals: number[] }
] as const;

/**
 * Melody constraint types.
 */
export const MELODY_CONSTRAINT_TYPES = [
  'range',            // Pitch range: { low, high }
  'contour',          // Shape: { shape: 'ascending' | 'descending' | 'arch' | ... }
  'density',          // Note density: { notesPerBeat }
] as const;

/**
 * Style/Culture constraint types.
 */
export const STYLE_CONSTRAINT_TYPES = [
  'culture',          // Culture tag: { culture: CultureTag }
  'style',            // Style tag: { style: StyleTag }
  'schema',           // Galant schema: { schemaName }
] as const;

/**
 * Carnatic music constraint types.
 */
export const CARNATIC_CONSTRAINT_TYPES = [
  'raga',             // Raga: { raga: RagaName }
  'tala',             // Tala: { tala: TalaName, jati? }
  'gamaka_density',   // Ornaments: { density: 'light' | 'medium' | 'heavy' }
  'eduppu',           // Starting beat: { eduppu: 'sama' | 'vishama' | ... }
] as const;

/**
 * Celtic music constraint types.
 */
export const CELTIC_CONSTRAINT_TYPES = [
  'tune_type',        // Tune form: { type: 'jig' | 'reel' | ... }
  'tune_form',        // Structure: { form: 'AABB' | 'AABA' | ... }
] as const;

/**
 * Chinese music constraint types.
 */
export const CHINESE_CONSTRAINT_TYPES = [
  'chinese_mode',     // Mode: { mode: ChinesModeName }
  'heterophony',      // Texture: { enabled: boolean }
] as const;

/**
 * Film/Media constraint types.
 */
export const FILM_CONSTRAINT_TYPES = [
  'film_device',      // Scoring device: { device: FilmDeviceName }
] as const;

/**
 * All builtin constraint types.
 */
export const BUILTIN_CONSTRAINT_TYPES = [
  ...KEY_CONSTRAINT_TYPES,
  ...METER_CONSTRAINT_TYPES,
  ...HARMONY_CONSTRAINT_TYPES,
  ...MELODY_CONSTRAINT_TYPES,
  ...STYLE_CONSTRAINT_TYPES,
  ...CARNATIC_CONSTRAINT_TYPES,
  ...CELTIC_CONSTRAINT_TYPES,
  ...CHINESE_CONSTRAINT_TYPES,
  ...FILM_CONSTRAINT_TYPES,
] as const;

/**
 * Builtin constraint type (union).
 */
export type BuiltinConstraintType = typeof BUILTIN_CONSTRAINT_TYPES[number];

/**
 * Set for O(1) lookup.
 */
export const BUILTIN_CONSTRAINT_TYPE_SET = new Set<string>(BUILTIN_CONSTRAINT_TYPES);

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Check if a string is a builtin constraint type.
 */
export function isBuiltinConstraintType(value: string): value is BuiltinConstraintType {
  return BUILTIN_CONSTRAINT_TYPE_SET.has(value);
}

/**
 * Check if a constraint type is namespaced (extension type).
 */
export function isNamespacedConstraintType(value: string): boolean {
  return value.includes(':');
}

/**
 * Validate a constraint type string.
 * Returns true for builtin types and properly namespaced extension types.
 * 
 * @param value - The constraint type to validate
 * @returns True if valid
 */
export function isValidConstraintType(value: string): boolean {
  return isBuiltinConstraintType(value) || isNamespacedConstraintType(value);
}

/**
 * Parse a namespaced constraint type.
 * 
 * @param value - The constraint type string
 * @returns Parsed result or null if invalid
 */
export function parseConstraintType(value: string): {
  namespace: string | null;
  type: string;
} {
  if (isNamespacedConstraintType(value)) {
    const colonIndex = value.indexOf(':');
    return {
      namespace: value.substring(0, colonIndex),
      type: value.substring(colonIndex + 1),
    };
  }
  return {
    namespace: null,
    type: value,
  };
}

// ============================================================================
// CONSTRAINT CATEGORIES
// ============================================================================

/**
 * Constraint category.
 */
export type ConstraintCategory =
  | 'key'
  | 'meter'
  | 'harmony'
  | 'melody'
  | 'style'
  | 'carnatic'
  | 'celtic'
  | 'chinese'
  | 'film'
  | 'extension';

/**
 * Get the category of a constraint type.
 */
export function getConstraintCategory(constraintType: string): ConstraintCategory {
  if ((KEY_CONSTRAINT_TYPES as readonly string[]).includes(constraintType)) {
    return 'key';
  }
  if ((METER_CONSTRAINT_TYPES as readonly string[]).includes(constraintType)) {
    return 'meter';
  }
  if ((HARMONY_CONSTRAINT_TYPES as readonly string[]).includes(constraintType)) {
    return 'harmony';
  }
  if ((MELODY_CONSTRAINT_TYPES as readonly string[]).includes(constraintType)) {
    return 'melody';
  }
  if ((STYLE_CONSTRAINT_TYPES as readonly string[]).includes(constraintType)) {
    return 'style';
  }
  if ((CARNATIC_CONSTRAINT_TYPES as readonly string[]).includes(constraintType)) {
    return 'carnatic';
  }
  if ((CELTIC_CONSTRAINT_TYPES as readonly string[]).includes(constraintType)) {
    return 'celtic';
  }
  if ((CHINESE_CONSTRAINT_TYPES as readonly string[]).includes(constraintType)) {
    return 'chinese';
  }
  if ((FILM_CONSTRAINT_TYPES as readonly string[]).includes(constraintType)) {
    return 'film';
  }
  return 'extension';
}
