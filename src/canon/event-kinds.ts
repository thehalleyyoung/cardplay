/**
 * @fileoverview Canonical Event Kinds
 * 
 * Defines canonical builtin EventKinds and naming conventions.
 * Includes explicit legacy alias mapping for normalization.
 * 
 * @module @cardplay/canon/event-kinds
 * @see cardplay/docs/event-kind-schemas.md
 * @see to_fix_repo_plan_500.md Change 073
 */

// ============================================================================
// CANONICAL EVENT KINDS
// ============================================================================

/**
 * Canonical builtin event kind values.
 * 
 * Naming convention: camelCase for single-word, camelCase for compound.
 */
export type CanonicalEventKind =
  // Music events
  | 'note'          // Musical note event
  | 'automation'    // Automation point event
  | 'tempo'         // Tempo change event
  | 'signature'     // Time signature change event
  
  // Control events
  | 'control'       // Control change event
  | 'program'       // Program change event
  | 'pitchBend'     // Pitch bend event
  
  // Structural events
  | 'marker'        // Marker/label event
  | 'trigger'       // Trigger/action event
  
  // Media events
  | 'audio'         // Audio region event
  | 'midiClip'      // MIDI clip event
  | 'patternRef';   // Pattern reference event

/**
 * Object accessor for canonical event kinds.
 */
export const CANONICAL_EVENT_KINDS = {
  note: 'note' as CanonicalEventKind,
  automation: 'automation' as CanonicalEventKind,
  tempo: 'tempo' as CanonicalEventKind,
  signature: 'signature' as CanonicalEventKind,
  control: 'control' as CanonicalEventKind,
  program: 'program' as CanonicalEventKind,
  pitchBend: 'pitchBend' as CanonicalEventKind,
  marker: 'marker' as CanonicalEventKind,
  trigger: 'trigger' as CanonicalEventKind,
  audio: 'audio' as CanonicalEventKind,
  midiClip: 'midiClip' as CanonicalEventKind,
  patternRef: 'patternRef' as CanonicalEventKind,
} as const;

/**
 * Array of all canonical event kinds.
 */
export const CANONICAL_EVENT_KIND_LIST: readonly CanonicalEventKind[] = [
  'note', 'automation', 'tempo', 'signature',
  'control', 'program', 'pitchBend',
  'marker', 'trigger',
  'audio', 'midiClip', 'patternRef',
] as const;

/**
 * Set for O(1) lookup.
 */
export const CANONICAL_EVENT_KIND_SET = new Set<string>(CANONICAL_EVENT_KIND_LIST);

/**
 * Check if a string is a canonical event kind.
 */
export function isCanonicalEventKind(value: string): value is CanonicalEventKind {
  return CANONICAL_EVENT_KIND_SET.has(value);
}

// ============================================================================
// LEGACY ALIASES
// ============================================================================

/**
 * Legacy event kind aliases mapped to canonical values.
 * 
 * Covers various naming inconsistencies:
 * - snake_case vs camelCase
 * - Different capitalizations
 * - Alternative names
 */
export const LEGACY_EVENT_KIND_ALIASES: Record<string, CanonicalEventKind> = {
  // snake_case variants
  'pitch_bend': 'pitchBend',
  'midi_clip': 'midiClip',
  'pattern_ref': 'patternRef',
  'time_signature': 'signature',
  'control_change': 'control',
  'program_change': 'program',
  
  // Capitalized variants
  'Note': 'note',
  'Automation': 'automation',
  'Tempo': 'tempo',
  'Marker': 'marker',
  'Trigger': 'trigger',
  'Audio': 'audio',
  
  // Alternative names
  'cc': 'control',
  'controlChange': 'control',
  'programChange': 'program',
  'bend': 'pitchBend',
  'pattern': 'patternRef',
  'clip': 'midiClip',
  'region': 'audio',
  'timeSig': 'signature',
  'timeSignature': 'signature',
};

/**
 * Set of deprecated event kind strings.
 */
export const DEPRECATED_EVENT_KINDS = new Set(Object.keys(LEGACY_EVENT_KIND_ALIASES));

// ============================================================================
// NORMALIZATION
// ============================================================================

let deprecationWarningsEmitted = new Set<string>();

/**
 * Normalize an event kind to its canonical value.
 * Emits a deprecation warning once per legacy value.
 * 
 * @param value - The event kind (may be legacy or canonical)
 * @returns The canonical event kind
 */
export function normalizeEventKind(value: string): CanonicalEventKind | string {
  // Check if already canonical
  if (isCanonicalEventKind(value)) {
    return value;
  }

  // Check for legacy alias
  const canonical = LEGACY_EVENT_KIND_ALIASES[value];
  if (canonical) {
    // Emit deprecation warning once
    const warningKey = `eventKind:${value}`;
    if (!deprecationWarningsEmitted.has(warningKey)) {
      deprecationWarningsEmitted.add(warningKey);
      console.warn(
        `[CardPlay] Deprecated EventKind "${value}" - use "${canonical}" instead. ` +
        `See docs/event-kind-schemas.md for canonical values.`
      );
    }
    return canonical;
  }

  // Check if it's a namespaced extension kind
  if (value.includes(':')) {
    // Extension kinds are allowed as-is
    return value;
  }

  // Unknown kind - return as-is but could warn
  return value;
}

/**
 * Reset deprecation warning tracking (for testing).
 */
export function resetEventKindWarnings(): void {
  deprecationWarningsEmitted = new Set();
}

// ============================================================================
// CATEGORIES
// ============================================================================

/**
 * Event kind categories for grouping.
 */
export type EventKindCategory = 
  | 'music'
  | 'control'
  | 'timing'
  | 'structure'
  | 'media';

/**
 * Mapping from canonical event kinds to categories.
 */
export const EVENT_KIND_CATEGORIES: Record<CanonicalEventKind, EventKindCategory> = {
  note: 'music',
  automation: 'control',
  tempo: 'timing',
  signature: 'timing',
  control: 'control',
  program: 'control',
  pitchBend: 'control',
  marker: 'structure',
  trigger: 'structure',
  audio: 'media',
  midiClip: 'media',
  patternRef: 'structure',
};

/**
 * Get the category for an event kind.
 */
export function getEventKindCategory(kind: string): EventKindCategory | undefined {
  const canonical = normalizeEventKind(kind);
  return EVENT_KIND_CATEGORIES[canonical as CanonicalEventKind];
}
