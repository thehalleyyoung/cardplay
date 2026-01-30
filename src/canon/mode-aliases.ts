/**
 * @fileoverview Mode Name Aliases and Normalization
 * 
 * Reconciles ModeName vocabulary between code, docs, and Prolog KB.
 * Provides canonical mode names and legacy alias mappings.
 * 
 * SSOT: cardplay/docs/canon/ids.md → ModeName section
 * 
 * @module @cardplay/canon/mode-aliases
 */

// ============================================================================
// CANONICAL MODE NAMES
// ============================================================================

/**
 * Canonical mode names from docs/canon/ids.md.
 * These are the authoritative mode identifiers.
 */
export const CANONICAL_MODE_NAMES = [
  // Western church modes
  'ionian',
  'dorian',
  'phrygian',
  'lydian',
  'mixolydian',
  'aeolian',
  'locrian',
  // Extended modes
  'harmonic_minor',
  'melodic_minor',
  'pentatonic_major',
  'pentatonic_minor',
  'blues',
  'whole_tone',
  'diminished',
] as const;

export type CanonicalModeName = typeof CANONICAL_MODE_NAMES[number];

/**
 * Extended mode names used in code that are aliases or equivalents.
 * These map to canonical modes.
 */
export const MODE_ALIASES: Readonly<Record<string, CanonicalModeName>> = {
  // Common equivalents
  'major': 'ionian',           // Major scale = Ionian mode
  'minor': 'aeolian',          // Natural minor = Aeolian mode
  'natural_minor': 'aeolian',  // Natural minor = Aeolian mode
  
  // Symmetric scale naming variations
  'octatonic': 'diminished',   // Octatonic = Diminished scale (half-whole pattern)
  'dim': 'diminished',         // Abbreviation
  
  // Chromatic is not in canon docs - treat as special case
  // 'chromatic' maps to itself if we add it as extended
  
  // Pentatonic abbreviations
  'pent_major': 'pentatonic_major',
  'pent_minor': 'pentatonic_minor',
  'pentatonic': 'pentatonic_major',  // Default to major pentatonic
  
  // Historical naming
  'church_ionian': 'ionian',
  'church_dorian': 'dorian',
  'church_phrygian': 'phrygian',
  'church_lydian': 'lydian',
  'church_mixolydian': 'mixolydian',
  'church_aeolian': 'aeolian',
  'church_locrian': 'locrian',
  
  // Jazz naming
  'altered': 'locrian',  // Approximate - altered dominant often taught as locrian variant
};

/**
 * Extended mode names that are valid in code but not in canon docs.
 * These should be used sparingly and documented.
 */
export const EXTENDED_MODE_NAMES = [
  'major',          // Alias for ionian, widely used
  'natural_minor',  // Alias for aeolian, widely used
  'octatonic',      // Alias for diminished, used in jazz theory
  'chromatic',      // All 12 semitones - not technically a mode
] as const;

export type ExtendedModeName = typeof EXTENDED_MODE_NAMES[number];

/**
 * All valid mode names (canonical + extended).
 */
export const ALL_MODE_NAMES = [
  ...CANONICAL_MODE_NAMES,
  ...EXTENDED_MODE_NAMES,
] as const;

export type AnyModeName = typeof ALL_MODE_NAMES[number];

// ============================================================================
// NORMALIZATION
// ============================================================================

/**
 * Normalize a mode name to its canonical form.
 * 
 * @param mode - Mode name (possibly legacy/alias)
 * @returns Canonical mode name, or null if unrecognized
 * 
 * @example
 * normalizeModeName('major')        // → 'ionian'
 * normalizeModeName('octatonic')    // → 'diminished'
 * normalizeModeName('dorian')       // → 'dorian' (already canonical)
 * normalizeModeName('unknown_mode') // → null
 */
export function normalizeModeName(mode: string): CanonicalModeName | null {
  const lower = mode.toLowerCase().trim();
  
  // Check if already canonical
  if (CANONICAL_MODE_NAMES.includes(lower as CanonicalModeName)) {
    return lower as CanonicalModeName;
  }
  
  // Check aliases
  if (Object.prototype.hasOwnProperty.call(MODE_ALIASES, lower)) {
    return MODE_ALIASES[lower] ?? null;
  }
  
  return null;
}

/**
 * Check if a mode name is a canonical mode.
 */
export function isCanonicalModeName(mode: string): mode is CanonicalModeName {
  return CANONICAL_MODE_NAMES.includes(mode as CanonicalModeName);
}

/**
 * Check if a mode name is valid (canonical or extended).
 */
export function isValidModeName(mode: string): boolean {
  const lower = mode.toLowerCase().trim();
  return (
    CANONICAL_MODE_NAMES.includes(lower as CanonicalModeName) ||
    EXTENDED_MODE_NAMES.includes(lower as ExtendedModeName) ||
    lower in MODE_ALIASES
  );
}

/**
 * Get all equivalent names for a canonical mode.
 * Useful for fuzzy matching and search.
 * 
 * @example
 * getModeAliases('ionian') // → ['major', 'church_ionian']
 */
export function getModeAliases(canonicalMode: CanonicalModeName): string[] {
  const aliases: string[] = [];
  for (const [alias, canonical] of Object.entries(MODE_ALIASES)) {
    if (canonical === canonicalMode) {
      aliases.push(alias);
    }
  }
  return aliases;
}

// ============================================================================
// MODE CATEGORIES
// ============================================================================

export const CHURCH_MODES: CanonicalModeName[] = [
  'ionian', 'dorian', 'phrygian', 'lydian',
  'mixolydian', 'aeolian', 'locrian',
];

export const MINOR_MODES: CanonicalModeName[] = [
  'aeolian', 'harmonic_minor', 'melodic_minor',
];

export const PENTATONIC_MODES: CanonicalModeName[] = [
  'pentatonic_major', 'pentatonic_minor',
];

export const SYMMETRIC_SCALES: CanonicalModeName[] = [
  'whole_tone', 'diminished',
];

/**
 * Get the category of a mode.
 */
export function getModeCategory(mode: CanonicalModeName): 'church' | 'minor' | 'pentatonic' | 'symmetric' | 'other' {
  if (CHURCH_MODES.includes(mode)) return 'church';
  if (MINOR_MODES.includes(mode)) return 'minor';
  if (PENTATONIC_MODES.includes(mode)) return 'pentatonic';
  if (SYMMETRIC_SCALES.includes(mode)) return 'symmetric';
  return 'other';
}
