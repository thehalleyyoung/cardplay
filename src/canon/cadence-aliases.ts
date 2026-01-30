/**
 * @fileoverview Cadence Type Aliases and Normalization
 * 
 * Reconciles CadenceType vocabulary between code, docs, and Prolog KB.
 * Provides canonical cadence names and legacy abbreviation mappings.
 * 
 * SSOT: cardplay/docs/canon/ids.md → CadenceType section
 * 
 * @module @cardplay/canon/cadence-aliases
 */

// ============================================================================
// CANONICAL CADENCE TYPES
// ============================================================================

/**
 * Canonical cadence types from docs/canon/ids.md.
 * These are the authoritative cadence identifiers.
 */
export const CANONICAL_CADENCE_TYPES = [
  'perfect_authentic',    // PAC: V → I, soprano on tonic
  'imperfect_authentic',  // IAC: V → I, soprano not on tonic
  'half',                 // HC: ends on V
  'plagal',               // PC: IV → I
  'deceptive',            // DC: V → vi (or other)
  'phrygian_half',        // PHC: iv6 → V in minor
  'evaded',               // Cadence avoided/interrupted
] as const;

export type CanonicalCadenceType = typeof CANONICAL_CADENCE_TYPES[number];

/**
 * Extended cadence types used in code for advanced analysis.
 * These go beyond basic cadence vocabulary.
 */
export const EXTENDED_CADENCE_TYPES = [
  // Western extended
  'picardy',             // Minor → major final chord
  'backdoor',            // bVII → I
  // Galant
  'galant_meyer',        // Meyer schema cadence
  'galant_quiescenza',   // Quiescenza schema cadence
  // Modal
  'modal_bvii_i',        // bVII → I (Aeolian/Mixolydian)
  'modal_iv_i',          // IV → I (plagal modal)
  // Film/Cinematic
  'cinematic_bvi_bvii_i', // bVI → bVII → I (Epic cadence)
  // Carnatic
  'carnatic_arudi',      // Carnatic cadential pattern
] as const;

export type ExtendedCadenceType = typeof EXTENDED_CADENCE_TYPES[number];

/**
 * All valid cadence types (canonical + extended).
 */
export const ALL_CADENCE_TYPES = [
  ...CANONICAL_CADENCE_TYPES,
  ...EXTENDED_CADENCE_TYPES,
] as const;

export type AnyCadenceType = typeof ALL_CADENCE_TYPES[number];

// ============================================================================
// LEGACY ABBREVIATION ALIASES
// ============================================================================

/**
 * Common abbreviations for cadence types.
 * Maps abbreviations (case-insensitive) to canonical types.
 */
export const CADENCE_ABBREVIATION_ALIASES: Readonly<Record<string, CanonicalCadenceType>> = {
  // Standard abbreviations (uppercase)
  'PAC': 'perfect_authentic',
  'IAC': 'imperfect_authentic',
  'HC': 'half',
  'PC': 'plagal',
  'DC': 'deceptive',
  'PHC': 'phrygian_half',
  
  // Lowercase variants
  'pac': 'perfect_authentic',
  'iac': 'imperfect_authentic',
  'hc': 'half',
  'pc': 'plagal',
  'dc': 'deceptive',
  'phc': 'phrygian_half',
  
  // Alternative names
  'authentic': 'perfect_authentic',      // Default to PAC
  'perfect': 'perfect_authentic',
  'imperfect': 'imperfect_authentic',
  'half_cadence': 'half',
  'plagal_cadence': 'plagal',
  'amen': 'plagal',                       // Church music term
  'deceptive_cadence': 'deceptive',
  'interrupted': 'deceptive',             // British terminology
  'phrygian': 'phrygian_half',
  'evaded_cadence': 'evaded',
  'avoided': 'evaded',
};

// ============================================================================
// NORMALIZATION
// ============================================================================

/**
 * Normalize a cadence type to its canonical form.
 * 
 * @param cadence - Cadence name (possibly legacy/abbreviation)
 * @returns Canonical cadence type, or null if unrecognized
 * 
 * @example
 * normalizeCadenceType('PAC')           // → 'perfect_authentic'
 * normalizeCadenceType('authentic')     // → 'perfect_authentic'
 * normalizeCadenceType('half')          // → 'half' (already canonical)
 * normalizeCadenceType('unknown_cad')   // → null
 */
export function normalizeCadenceType(cadence: string): CanonicalCadenceType | null {
  const trimmed = cadence.trim();
  
  // Check if already canonical
  if (CANONICAL_CADENCE_TYPES.includes(trimmed as CanonicalCadenceType)) {
    return trimmed as CanonicalCadenceType;
  }
  
  // Check abbreviation aliases (case-sensitive for uppercase abbrevs)
  if (Object.prototype.hasOwnProperty.call(CADENCE_ABBREVIATION_ALIASES, trimmed)) {
    return CADENCE_ABBREVIATION_ALIASES[trimmed] ?? null;
  }
  
  // Check lowercase
  const lower = trimmed.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(CADENCE_ABBREVIATION_ALIASES, lower)) {
    return CADENCE_ABBREVIATION_ALIASES[lower] ?? null;
  }
  
  return null;
}

/**
 * Check if a cadence type is a canonical cadence.
 */
export function isCanonicalCadenceType(cadence: string): cadence is CanonicalCadenceType {
  return CANONICAL_CADENCE_TYPES.includes(cadence as CanonicalCadenceType);
}

/**
 * Check if a cadence type is an extended cadence.
 */
export function isExtendedCadenceType(cadence: string): cadence is ExtendedCadenceType {
  return EXTENDED_CADENCE_TYPES.includes(cadence as ExtendedCadenceType);
}

/**
 * Check if a cadence type is valid (canonical, extended, or abbreviation).
 */
export function isValidCadenceType(cadence: string): boolean {
  const trimmed = cadence.trim();
  return (
    CANONICAL_CADENCE_TYPES.includes(trimmed as CanonicalCadenceType) ||
    EXTENDED_CADENCE_TYPES.includes(trimmed as ExtendedCadenceType) ||
    trimmed in CADENCE_ABBREVIATION_ALIASES ||
    trimmed.toLowerCase() in CADENCE_ABBREVIATION_ALIASES
  );
}

/**
 * Get the standard abbreviation for a canonical cadence type.
 * 
 * @example
 * getCadenceAbbreviation('perfect_authentic') // → 'PAC'
 * getCadenceAbbreviation('half')              // → 'HC'
 */
export function getCadenceAbbreviation(cadence: CanonicalCadenceType): string {
  const abbrevMap: Record<CanonicalCadenceType, string> = {
    'perfect_authentic': 'PAC',
    'imperfect_authentic': 'IAC',
    'half': 'HC',
    'plagal': 'PC',
    'deceptive': 'DC',
    'phrygian_half': 'PHC',
    'evaded': 'EV',  // Non-standard, but useful
  };
  return abbrevMap[cadence];
}

/**
 * Get all known aliases/abbreviations for a canonical cadence type.
 */
export function getCadenceAliases(canonicalCadence: CanonicalCadenceType): string[] {
  const aliases: string[] = [];
  for (const [alias, canonical] of Object.entries(CADENCE_ABBREVIATION_ALIASES)) {
    if (canonical === canonicalCadence) {
      aliases.push(alias);
    }
  }
  return aliases;
}

// ============================================================================
// CADENCE CATEGORIES
// ============================================================================

/**
 * Cadence types that resolve to tonic.
 */
export const CONCLUSIVE_CADENCES: CanonicalCadenceType[] = [
  'perfect_authentic',
  'imperfect_authentic',
  'plagal',
];

/**
 * Cadence types that don't fully resolve.
 */
export const INCONCLUSIVE_CADENCES: CanonicalCadenceType[] = [
  'half',
  'phrygian_half',
  'deceptive',
  'evaded',
];

/**
 * Get the resolution category of a cadence.
 */
export function getCadenceResolution(cadence: CanonicalCadenceType): 'conclusive' | 'inconclusive' {
  return CONCLUSIVE_CADENCES.includes(cadence) ? 'conclusive' : 'inconclusive';
}
