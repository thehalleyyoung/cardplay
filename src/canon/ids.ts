/**
 * @fileoverview Canonical ID Types and Constants
 * 
 * Re-exports canonical ID types/constants from their source modules and 
 * provides a single import point for canonical IDs.
 * 
 * This is the SSOT for canonical IDs used throughout CardPlay.
 * Extensions must use namespaced IDs (format: <namespace>:<name>).
 * 
 * @module @cardplay/canon/ids
 * @see cardplay/docs/canon/ids.md
 * @see to_fix_repo_plan_500.md Change 051
 */

// ============================================================================
// RE-EXPORTS FROM SOURCE MODULES
// ============================================================================

// From boards/types.ts
export type { ControlLevel } from '../boards/types';

// From types/primitives.ts
export { PPQ } from '../types/primitives';
export type { Tick, TickDuration } from '../types/primitives';

// ============================================================================
// CANONICAL DECK TYPES
// ============================================================================

/**
 * Canonical deck type values.
 * 
 * These are the only valid deck types for BoardDeck.type.
 * Legacy names (pattern-editor, notation-score, piano-roll, etc.) 
 * should be normalized via normalizeDeckType().
 */
export type DeckType =
  // Pattern/Tracker
  | 'pattern-deck'
  // Notation
  | 'notation-deck'
  // Piano Roll
  | 'piano-roll-deck'
  // Session/Clips
  | 'session-deck'
  // Arrangement
  | 'arrangement-deck'
  // Instruments
  | 'instruments-deck'
  // DSP/Effects
  | 'dsp-chain'
  | 'effects-deck'
  // Samples
  | 'samples-deck'
  | 'sample-manager-deck'
  // Phrases
  | 'phrases-deck'
  // Harmony/Theory
  | 'harmony-deck'
  // Generators
  | 'generators-deck'
  // Mixing
  | 'mixer-deck'
  | 'mix-bus-deck'
  // Routing
  | 'routing-deck'
  // Automation
  | 'automation-deck'
  // Properties
  | 'properties-deck'
  // Transport
  | 'transport-deck'
  // Arranger
  | 'arranger-deck'
  // AI
  | 'ai-advisor-deck'
  // Modulation
  | 'modulation-matrix-deck'
  // Groups
  | 'track-groups-deck'
  // Reference
  | 'reference-track-deck'
  // Analysis
  | 'spectrum-analyzer-deck'
  // Waveform
  | 'waveform-editor-deck'
  // Developer tools
  | 'registry-devtool-deck';

/**
 * Array of all canonical deck types for validation.
 */
export const DECK_TYPES: readonly DeckType[] = [
  'pattern-deck',
  'notation-deck',
  'piano-roll-deck',
  'session-deck',
  'arrangement-deck',
  'instruments-deck',
  'dsp-chain',
  'effects-deck',
  'samples-deck',
  'sample-manager-deck',
  'phrases-deck',
  'harmony-deck',
  'generators-deck',
  'mixer-deck',
  'mix-bus-deck',
  'routing-deck',
  'automation-deck',
  'properties-deck',
  'transport-deck',
  'arranger-deck',
  'ai-advisor-deck',
  'modulation-matrix-deck',
  'track-groups-deck',
  'reference-track-deck',
  'spectrum-analyzer-deck',
  'waveform-editor-deck',
  'registry-devtool-deck',
] as const;

/**
 * Check if a string is a valid canonical DeckType.
 */
export function isDeckType(value: string): value is DeckType {
  return (DECK_TYPES as readonly string[]).includes(value);
}

// ============================================================================
// CANONICAL PORT TYPES
// ============================================================================

/**
 * Canonical port type values.
 * Direction (in/out) is separate from type.
 */
export type PortType =
  | 'audio'
  | 'midi'
  | 'notes'
  | 'control'
  | 'trigger'
  | 'gate'
  | 'clock'
  | 'transport';

/**
 * Object form of canonical port types for easy access.
 */
export const PORT_TYPES = {
  audio: 'audio' as PortType,
  midi: 'midi' as PortType,
  notes: 'notes' as PortType,
  control: 'control' as PortType,
  trigger: 'trigger' as PortType,
  gate: 'gate' as PortType,
  clock: 'clock' as PortType,
  transport: 'transport' as PortType,
} as const;

/**
 * Array of all canonical port types for validation.
 */
export const PORT_TYPE_LIST: readonly PortType[] = [
  'audio', 'midi', 'notes', 'control', 'trigger', 'gate', 'clock', 'transport',
] as const;

/**
 * Check if a string is a valid canonical PortType.
 */
export function isPortType(value: string): value is PortType {
  return (PORT_TYPE_LIST as readonly string[]).includes(value);
}

// ============================================================================
// MUSICSPEC IDs
// ============================================================================

/**
 * Culture tag for music style classification.
 */
export type CultureTag =
  | 'western'   // Western tonal music
  | 'carnatic'  // South Indian classical
  | 'celtic'    // Irish/Scottish/Breton traditional
  | 'chinese'   // Chinese traditional
  | 'hybrid';   // Cross-cultural fusion

/**
 * Style tag for more specific style classification.
 */
export type StyleTag =
  | 'galant'      // 18th century galant style
  | 'baroque'     // Baroque period
  | 'classical'   // Classical period
  | 'romantic'    // Romantic period
  | 'cinematic'   // Film score style
  | 'trailer'     // Trailer music
  | 'underscore'  // Background/ambient scoring
  | 'edm'         // Electronic dance music
  | 'pop'         // Pop music
  | 'jazz'        // Jazz
  | 'lofi'        // Lo-fi hip hop / chill
  | 'custom';     // User-defined style

/**
 * Tonality model for key detection and representation.
 */
export type TonalityModel =
  | 'ks_profile'    // Krumhansl-Schmuckler key profiles
  | 'dft_phase'     // DFT phase-based tonality
  | 'spiral_array'; // Chew's Spiral Array model

/**
 * Mode names for scale/mode identification.
 */
export type ModeName =
  | 'ionian' | 'dorian' | 'phrygian' | 'lydian'
  | 'mixolydian' | 'aeolian' | 'locrian'
  // Extended modes
  | 'harmonic_minor' | 'melodic_minor'
  | 'pentatonic_major' | 'pentatonic_minor'
  | 'blues' | 'whole_tone' | 'diminished';

/**
 * Cadence type for harmonic analysis.
 */
export type CadenceType =
  | 'perfect_authentic'    // PAC: V → I, soprano on tonic
  | 'imperfect_authentic'  // IAC: V → I, soprano not on tonic
  | 'half'                 // HC: ends on V
  | 'plagal'               // PC: IV → I
  | 'deceptive'            // DC: V → vi (or other)
  | 'phrygian_half'        // PHC: iv6 → V in minor
  | 'evaded';              // Cadence avoided/interrupted

/**
 * Routing connection types.
 */
export type RoutingConnectionType =
  | 'audio'       // Audio signal
  | 'midi'        // MIDI messages
  | 'modulation'  // Control rate modulation
  | 'sidechain';  // Sidechain signal

// ============================================================================
// CONSTRAINT TYPES
// ============================================================================

/**
 * Builtin constraint type strings.
 * Custom constraints must be namespaced: <namespace>:<type>
 */
export type BuiltinConstraintType =
  // Key/Tonality
  | 'key'
  | 'tonality_model'
  // Meter/Rhythm
  | 'meter'
  | 'tempo'
  // Harmony
  | 'cadence'
  | 'chord_progression'
  | 'harmonic_rhythm'
  | 'avoid_parallel'
  // Melody
  | 'range'
  | 'contour'
  | 'density'
  // Style/Culture
  | 'culture'
  | 'style'
  | 'schema'
  // Carnatic
  | 'raga'
  | 'tala'
  | 'gamaka_density'
  | 'eduppu'
  // Celtic
  | 'tune_type'
  | 'tune_form'
  // Chinese
  | 'chinese_mode'
  | 'heterophony'
  // Film/Media
  | 'film_device';

/**
 * Set of builtin constraint types for validation.
 */
export const BUILTIN_CONSTRAINT_TYPES = new Set<BuiltinConstraintType>([
  'key', 'tonality_model', 'meter', 'tempo', 'cadence', 'chord_progression',
  'harmonic_rhythm', 'avoid_parallel', 'range', 'contour', 'density',
  'culture', 'style', 'schema', 'raga', 'tala', 'gamaka_density', 'eduppu',
  'tune_type', 'tune_form', 'chinese_mode', 'heterophony', 'film_device',
]);

/**
 * Check if a constraint type is a builtin.
 */
export function isBuiltinConstraintType(value: string): value is BuiltinConstraintType {
  return BUILTIN_CONSTRAINT_TYPES.has(value as BuiltinConstraintType);
}
