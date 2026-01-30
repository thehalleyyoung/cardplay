/**
 * @fileoverview Legacy Alias Mappings
 * 
 * Centralized mappings for legacy values to their canonical equivalents.
 * Use these for migrating old data and providing deprecation warnings.
 * 
 * @module @cardplay/canon/legacy-aliases
 * @see cardplay/docs/canon/legacy-type-aliases.md
 * @see to_fix_repo_plan_500.md Change 054
 */

import type { DeckType, CadenceType, ModeName } from './ids';
import type { DeckCardLayout } from '../boards/types';

// ============================================================================
// DECK TYPE ALIASES
// ============================================================================

/**
 * Mapping from legacy deck type strings to canonical DeckType values.
 */
export const LEGACY_DECK_TYPE_ALIASES: Record<string, DeckType> = {
  // Missing -deck suffix
  'pattern-editor': 'pattern-deck',
  'notation-score': 'notation-deck',
  'piano-roll': 'piano-roll-deck',
  'session': 'session-deck',
  'arrangement': 'arrangement-deck',
  'mixer': 'mixer-deck',
  'harmony': 'harmony-deck',
  'generators': 'generators-deck',
  'transport': 'transport-deck',
  'properties': 'properties-deck',
  'routing': 'routing-deck',
  'automation': 'automation-deck',
  'effects': 'effects-deck',
  'samples': 'samples-deck',
  'phrases': 'phrases-deck',
  'instruments': 'instruments-deck',
  
  // Alternative names
  'timeline': 'arrangement-deck',
  'sequencer': 'pattern-deck',
  'score': 'notation-deck',
  'clips': 'session-deck',
  'fx': 'effects-deck',
  'audio': 'samples-deck',
};

/**
 * Set of deprecated deck type strings that emit warnings.
 */
export const DEPRECATED_DECK_TYPES = new Set(Object.keys(LEGACY_DECK_TYPE_ALIASES));

// ============================================================================
// CADENCE ALIASES
// ============================================================================

/**
 * Mapping from cadence abbreviations to canonical CadenceType values.
 */
export const CADENCE_ABBREVIATIONS: Record<string, CadenceType> = {
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
};

// ============================================================================
// MODE ALIASES
// ============================================================================

/**
 * Mapping from alternative mode names to canonical ModeName values.
 */
export const MODE_ALIASES: Record<string, ModeName> = {
  // Major/minor equivalents
  'major': 'ionian',
  'minor': 'aeolian',
  'natural_minor': 'aeolian',
  
  // Alternative spellings
  'octatonic': 'diminished',
  'half_whole': 'diminished',
  'whole_half': 'diminished',
  'chromatic': 'whole_tone', // Note: not strictly accurate but often confused
  
  // Pentatonic variants
  'pentatonic': 'pentatonic_major',
  'penta_major': 'pentatonic_major',
  'penta_minor': 'pentatonic_minor',
};

// ============================================================================
// PORT TYPE ALIASES
// ============================================================================

/**
 * Mapping from legacy port types to canonical or namespaced equivalents.
 */
export const LEGACY_PORT_TYPE_ALIASES: Record<string, string> = {
  // Legacy generic types -> suggest namespacing
  'number': 'data:number',
  'string': 'data:string',
  'boolean': 'data:boolean',
  'any': 'data:any',
  'stream': 'data:stream',
  'container': 'data:container',
  'pattern': 'data:pattern',
};

// ============================================================================
// NORMALIZERS
// ============================================================================

let deprecationWarningsEmitted = new Set<string>();

/**
 * Normalize a deck type string to its canonical value.
 * Emits a deprecation warning once per legacy value.
 * 
 * @param value - The deck type string (may be legacy or canonical)
 * @returns The canonical DeckType value
 */
export function normalizeDeckType(value: string): DeckType {
  // Check if it's already canonical
  const canonicalDeckTypes = new Set([
    'pattern-deck', 'notation-deck', 'piano-roll-deck', 'session-deck',
    'arrangement-deck', 'instruments-deck', 'dsp-chain', 'effects-deck',
    'samples-deck', 'sample-manager-deck', 'phrases-deck', 'harmony-deck',
    'generators-deck', 'mixer-deck', 'mix-bus-deck', 'routing-deck',
    'automation-deck', 'properties-deck', 'transport-deck', 'arranger-deck',
    'ai-advisor-deck', 'modulation-matrix-deck', 'track-groups-deck',
    'reference-track-deck', 'spectrum-analyzer-deck', 'waveform-editor-deck',
  ]);

  if (canonicalDeckTypes.has(value)) {
    return value as DeckType;
  }

  // Check for legacy alias
  const canonical = LEGACY_DECK_TYPE_ALIASES[value];
  if (canonical) {
    // Emit deprecation warning once
    const warningKey = `deckType:${value}`;
    if (!deprecationWarningsEmitted.has(warningKey)) {
      deprecationWarningsEmitted.add(warningKey);
      console.warn(
        `[CardPlay] Deprecated DeckType "${value}" - use "${canonical}" instead. ` +
        `See docs/canon/ids.md for canonical values.`
      );
    }
    return canonical;
  }

  // Unknown deck type - return as-is but warn
  console.warn(`[CardPlay] Unknown DeckType "${value}" - not in canonical set`);
  return value as DeckType;
}

/**
 * Normalize a cadence abbreviation to its canonical value.
 * 
 * @param value - The cadence value (may be abbreviation or canonical)
 * @returns The canonical CadenceType value
 */
export function normalizeCadenceType(value: string): CadenceType {
  const canonical = CADENCE_ABBREVIATIONS[value];
  return canonical || (value as CadenceType);
}

/**
 * Normalize a mode name to its canonical value.
 * 
 * @param value - The mode name (may be alias or canonical)
 * @returns The canonical ModeName value
 */
export function normalizeModeName(value: string): ModeName {
  const canonical = MODE_ALIASES[value];
  return canonical || (value as ModeName);
}

/**
 * Normalize a port type to canonical or namespaced value.
 * 
 * @param value - The port type (may be legacy or canonical)
 * @returns The canonical port type or namespaced equivalent
 */
export function normalizePortType(value: string): string {
  const canonical = LEGACY_PORT_TYPE_ALIASES[value];
  if (canonical) {
    const warningKey = `portType:${value}`;
    if (!deprecationWarningsEmitted.has(warningKey)) {
      deprecationWarningsEmitted.add(warningKey);
      console.warn(
        `[CardPlay] Legacy PortType "${value}" - consider using "${canonical}" ` +
        `or namespacing as "<namespace>:${value}". See docs/canon/port-vocabulary.md.`
      );
    }
    return canonical;
  }
  return value;
}

/**
 * Normalize a deck card layout value.
 * Handles any legacy layout values if they exist in persisted state.
 * 
 * Change 064 from to_fix_repo_plan_500.md
 * 
 * @param value - The layout value (may be legacy or canonical)
 * @returns The canonical DeckCardLayout value
 */
export function normalizeDeckCardLayout(value: string): DeckCardLayout {
  // All current values are canonical, but we handle unknown values gracefully
  const canonical: Record<string, DeckCardLayout> = {
    'stack': 'stack',
    'tabs': 'tabs',
    'split': 'split',
    'floating': 'floating',
    'grid': 'grid',
  };
  
  const normalized = canonical[value];
  if (normalized) {
    return normalized;
  }
  
  // Unknown layout - warn and default to tabs
  console.warn(`[CardPlay] Unknown DeckCardLayout "${value}" - defaulting to "tabs"`);
  return 'tabs';
}

/**
 * Reset deprecation warning tracking (for testing).
 */
export function resetDeprecationWarnings(): void {
  deprecationWarningsEmitted = new Set();
}
// ============================================================================
// INTENTIONAL LOCAL COPIES (not legacy - by design)
// ============================================================================

/**
 * Documents intentional local copies of branded types for circular dependency avoidance.
 * These are NOT legacy aliases but explicitly maintained parallel definitions.
 * 
 * @see to_fix_repo_plan_500.md Change 310
 * 
 * Known intentional copies:
 * 
 * - `cardplay/src/tracker/types.ts` Tick, TickDuration, MidiNote, Velocity
 *   Reason: Tracker module is self-contained to avoid circular deps and ensure portability
 *   Note: These must be compatible with `cardplay/src/types/primitives.ts` branded types
 * 
 * When adding new local copies, document them here with:
 * 1. File path
 * 2. Type name(s)
 * 3. Justification for isolation
 * 4. Compatibility requirements
 */
export const INTENTIONAL_LOCAL_COPIES = {
  'tracker/types.ts': {
    types: ['Tick', 'TickDuration', 'MidiNote', 'Velocity'],
    reason: 'Tracker module is self-contained to avoid circular dependencies and ensure portability',
    mustBeCompatibleWith: 'types/primitives.ts',
  },
} as const;