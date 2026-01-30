/**
 * GOFAI Canon — EventSelector: Typed Predicate Language over Event<P>
 *
 * Defines a composable, typed predicate language for selecting musical events
 * within CardPlay's Event<P> streams. EventSelectors are the foundation of
 * CPL scope resolution — they describe *which* events an edit should affect.
 *
 * Design principles:
 *   - Selectors are pure data (serializable, inspectable, deterministic)
 *   - Selectors compose via boolean algebra (and, or, not)
 *   - Every selector has a human-readable description for the preview UX
 *   - Selectors validate against project structure before execution
 *   - No selector can select events that don't exist (fail-safe)
 *
 * @module gofai/canon/event-selector
 * @see gofaimusicplus.md §3.3 — Scope is a selector over Event<P> streams
 * @see gofai_goalA.md Step 055
 */

import type { EntityType } from './types';
import type {
  SectionRefId,
  RangeRefId,
  LayerRefId,
  EventKind,
  EventPattern,
} from './entity-refs';

// =============================================================================
// CORE SELECTOR TYPE
// =============================================================================

/**
 * A typed predicate over Event<P> streams.
 *
 * This is a discriminated union where each variant describes a different
 * way to select events. Selectors can be composed to form complex queries.
 *
 * The selector is evaluated lazily — it describes *what* to select,
 * not the result of selection. Actual event enumeration happens only
 * during plan execution.
 */
export type EventSelector =
  | KindSelector
  | PitchRangeSelector
  | TimeRangeSelector
  | LayerSelector
  | SectionSelector
  | RoleSelector
  | TagSelector
  | PatternSelector
  | VelocitySelector
  | DurationSelector
  | ArticulationSelector
  | DynamicSelector
  | PositionSelector
  | PropertySelector
  | AllSelector
  | NoneSelector
  | AndSelector
  | OrSelector
  | NotSelector
  | DifferenceSelector
  | NthSelector
  | SliceSelector
  | NeighborSelector
  | ContextualSelector;

// =============================================================================
// ATOMIC SELECTORS (Leaf predicates)
// =============================================================================

/**
 * Select events by their kind (note, chord, drum_hit, cc, etc.).
 *
 * NL examples:
 *   - "the notes" → { type: 'kind', kinds: ['note'] }
 *   - "all the drum hits" → { type: 'kind', kinds: ['drum_hit'] }
 *   - "the chords and notes" → { type: 'kind', kinds: ['chord', 'note'] }
 */
export interface KindSelector {
  readonly type: 'kind';
  readonly kinds: readonly EventKind[];
}

/**
 * Select events by pitch range.
 *
 * NL examples:
 *   - "the high notes" → { type: 'pitch_range', range: 'high' }
 *   - "notes above C5" → { type: 'pitch_range', midiMin: 72 }
 *   - "the bass notes" → { type: 'pitch_range', range: 'low' }
 *   - "middle C" → { type: 'pitch_range', midiMin: 60, midiMax: 60 }
 */
export interface PitchRangeSelector {
  readonly type: 'pitch_range';
  readonly range?: PitchRangeLabel;
  readonly midiMin?: number;
  readonly midiMax?: number;
  readonly noteName?: string;
  readonly octave?: number;
  readonly chordTone?: ChordToneSelector;
}

/**
 * Select events by time range.
 *
 * NL examples:
 *   - "bars 1 to 8" → { type: 'time_range', startBar: 1, endBar: 8 }
 *   - "the first 4 bars" → { type: 'time_range', startBar: 1, endBar: 4 }
 *   - "at bar 49" → { type: 'time_range', startBar: 49, endBar: 49 }
 *   - "beat 3" → { type: 'time_range', beatFilter: { beat: 3 } }
 */
export interface TimeRangeSelector {
  readonly type: 'time_range';
  readonly startBar?: number;
  readonly endBar?: number;
  readonly startBeat?: number;
  readonly endBeat?: number;
  readonly sectionRef?: SectionRefId;
  readonly rangeRef?: RangeRefId;
  readonly beatFilter?: BeatFilter;
}

/**
 * Select events on a specific layer/track.
 *
 * NL examples:
 *   - "on the drums" → { type: 'layer', layerRef: ... }
 *   - "the bass line" → { type: 'layer', layerType: 'bass' }
 *   - "all vocals" → { type: 'layer', layerType: 'vocal', allInstances: true }
 */
export interface LayerSelector {
  readonly type: 'layer';
  readonly layerRef?: LayerRefId;
  readonly layerType?: string;
  readonly allInstances?: boolean;
}

/**
 * Select events within a specific section.
 *
 * NL examples:
 *   - "in the chorus" → { type: 'section', sectionType: 'chorus' }
 *   - "during verse 2" → { type: 'section', sectionType: 'verse', ordinal: 2 }
 *   - "the bridge section" → { type: 'section', sectionRef: ... }
 */
export interface SectionSelector {
  readonly type: 'section';
  readonly sectionRef?: SectionRefId;
  readonly sectionType?: string;
  readonly ordinal?: number;
  readonly relativePosition?: 'first' | 'last' | 'next' | 'previous';
}

/**
 * Select events by their musical role or function.
 *
 * NL examples:
 *   - "the melody" → { type: 'role', role: 'melody' }
 *   - "the bass line" → { type: 'role', role: 'bass' }
 *   - "the accompaniment" → { type: 'role', role: 'accompaniment' }
 *   - "the rhythm section" → { type: 'role', roles: ['drums', 'bass', 'rhythm_guitar'] }
 */
export interface RoleSelector {
  readonly type: 'role';
  readonly role?: MusicalRole;
  readonly roles?: readonly MusicalRole[];
}

/**
 * Select events by tag.
 *
 * Tags are user-defined or system-defined labels on events.
 *
 * NL examples:
 *   - "the hook" → { type: 'tag', tags: ['hook'] }
 *   - "the fill" → { type: 'tag', tags: ['fill'] }
 */
export interface TagSelector {
  readonly type: 'tag';
  readonly tags: readonly string[];
  readonly matchMode: 'any' | 'all';
}

/**
 * Select events by rhythmic pattern.
 *
 * NL examples:
 *   - "the downbeats" → { type: 'pattern', pattern: 'downbeat' }
 *   - "every other bar" → { type: 'pattern', pattern: 'every_other_bar' }
 *   - "the syncopations" → { type: 'pattern', pattern: 'syncopation' }
 *   - "the triplets" → { type: 'pattern', pattern: 'triplet' }
 */
export interface PatternSelector {
  readonly type: 'pattern';
  readonly pattern: EventPattern;
}

/**
 * Select events by velocity (dynamics).
 *
 * NL examples:
 *   - "the loud notes" → { type: 'velocity', range: 'loud' }
 *   - "the soft notes" → { type: 'velocity', range: 'soft' }
 *   - "ghost notes" → { type: 'velocity', range: 'ghost' }
 *   - "notes above velocity 100" → { type: 'velocity', min: 100 }
 */
export interface VelocitySelector {
  readonly type: 'velocity';
  readonly range?: VelocityRange;
  readonly min?: number;
  readonly max?: number;
}

/**
 * Select events by duration.
 *
 * NL examples:
 *   - "the long notes" → { type: 'duration', range: 'long' }
 *   - "the short notes" → { type: 'duration', range: 'short' }
 *   - "whole notes" → { type: 'duration', noteDuration: 'whole' }
 *   - "notes longer than a bar" → { type: 'duration', minBeats: 4 }
 */
export interface DurationSelector {
  readonly type: 'duration';
  readonly range?: DurationRange;
  readonly noteDuration?: NoteDuration;
  readonly minBeats?: number;
  readonly maxBeats?: number;
}

/**
 * Select events by articulation.
 *
 * NL examples:
 *   - "the staccato notes" → { type: 'articulation', articulation: 'staccato' }
 *   - "the legato passages" → { type: 'articulation', articulation: 'legato' }
 *   - "the accented notes" → { type: 'articulation', articulation: 'accent' }
 */
export interface ArticulationSelector {
  readonly type: 'articulation';
  readonly articulation: ArticulationType;
}

/**
 * Select events by dynamic marking.
 *
 * NL examples:
 *   - "the crescendo" → { type: 'dynamic', marking: 'crescendo' }
 *   - "the forte section" → { type: 'dynamic', level: 'forte' }
 */
export interface DynamicSelector {
  readonly type: 'dynamic';
  readonly level?: DynamicLevel;
  readonly marking?: DynamicMarking;
}

/**
 * Select events by their position within a group.
 *
 * NL examples:
 *   - "the first note" → { type: 'position', position: 'first' }
 *   - "the last chord" → { type: 'position', position: 'last' }
 *   - "the third beat" → { type: 'position', ordinal: 3 }
 */
export interface PositionSelector {
  readonly type: 'position';
  readonly position?: 'first' | 'last' | 'middle';
  readonly ordinal?: number;
  readonly fromEnd?: boolean;
  readonly withinScope?: EventSelector;
}

/**
 * Select events by an arbitrary named property.
 *
 * This is the escape hatch for properties not covered by specific selectors.
 * Used sparingly — prefer specific selectors when possible.
 */
export interface PropertySelector {
  readonly type: 'property';
  readonly propertyName: string;
  readonly operator: ComparisonOperator;
  readonly value: string | number | boolean;
}

/**
 * Select all events (universal selector).
 *
 * NL examples:
 *   - "everything" → { type: 'all' }
 *   - "all notes" → AND(kind:note, all)
 */
export interface AllSelector {
  readonly type: 'all';
}

/**
 * Select no events (empty selector — useful as identity for composition).
 */
export interface NoneSelector {
  readonly type: 'none';
}

// =============================================================================
// COMPOSITE SELECTORS (Boolean combinators)
// =============================================================================

/**
 * Intersection: events that match ALL sub-selectors.
 *
 * NL examples:
 *   - "high notes in the chorus" → AND(pitch_range:high, section:chorus)
 *   - "loud drum hits on the downbeats" → AND(kind:drum_hit, velocity:loud, pattern:downbeat)
 */
export interface AndSelector {
  readonly type: 'and';
  readonly selectors: readonly EventSelector[];
}

/**
 * Union: events that match ANY sub-selector.
 *
 * NL examples:
 *   - "the notes and chords" → OR(kind:note, kind:chord)
 *   - "the verse or the chorus" → OR(section:verse, section:chorus)
 */
export interface OrSelector {
  readonly type: 'or';
  readonly selectors: readonly EventSelector[];
}

/**
 * Negation: events that do NOT match the sub-selector.
 *
 * NL examples:
 *   - "everything except the drums" → NOT(layer:drums)
 *   - "notes that aren't in the chorus" → NOT(section:chorus)
 */
export interface NotSelector {
  readonly type: 'not';
  readonly selector: EventSelector;
}

/**
 * Set difference: events that match `include` but NOT `exclude`.
 *
 * NL examples:
 *   - "the melody without the high notes" → DIFF(role:melody, pitch_range:high)
 */
export interface DifferenceSelector {
  readonly type: 'difference';
  readonly include: EventSelector;
  readonly exclude: EventSelector;
}

// =============================================================================
// POSITIONAL SELECTORS (Indexed / sliced access)
// =============================================================================

/**
 * Select every Nth event from a base selection.
 *
 * NL examples:
 *   - "every other note" → { type: 'nth', n: 2, base: kind:note }
 *   - "every third beat" → { type: 'nth', n: 3, base: pattern:every_beat }
 */
export interface NthSelector {
  readonly type: 'nth';
  readonly n: number;
  readonly offset?: number;
  readonly base: EventSelector;
}

/**
 * Select a slice (range) of events from a base selection.
 *
 * NL examples:
 *   - "the first 4 notes" → { type: 'slice', start: 0, count: 4, base: kind:note }
 *   - "the last 3 chords" → { type: 'slice', fromEnd: true, count: 3, base: kind:chord }
 */
export interface SliceSelector {
  readonly type: 'slice';
  readonly start?: number;
  readonly count?: number;
  readonly fromEnd?: boolean;
  readonly base: EventSelector;
}

/**
 * Select events neighboring a reference event.
 *
 * NL examples:
 *   - "the note before the last chord" → { type: 'neighbor', direction: 'before', ... }
 *   - "the 2 notes after beat 3" → { type: 'neighbor', direction: 'after', count: 2, ... }
 */
export interface NeighborSelector {
  readonly type: 'neighbor';
  readonly direction: 'before' | 'after' | 'around';
  readonly count: number;
  readonly reference: EventSelector;
  readonly base?: EventSelector;
}

// =============================================================================
// CONTEXTUAL SELECTORS (Dependent on discourse/UI state)
// =============================================================================

/**
 * Select events based on discourse/UI context.
 *
 * These selectors require runtime context (UI selection, discourse history)
 * to resolve. They are always flagged for pragmatic resolution.
 *
 * NL examples:
 *   - "these notes" → { type: 'contextual', contextKind: 'deictic_selection' }
 *   - "those chords" → { type: 'contextual', contextKind: 'deictic_distal' }
 *   - "the ones I just changed" → { type: 'contextual', contextKind: 'anaphoric_recent_edit' }
 *   - "the same notes as before" → { type: 'contextual', contextKind: 'anaphoric_prior_selection' }
 */
export interface ContextualSelector {
  readonly type: 'contextual';
  readonly contextKind: ContextualSelectorKind;
  readonly fallback?: EventSelector;
}

/**
 * Kinds of contextual selection.
 */
export type ContextualSelectorKind =
  | 'deictic_selection'         // "this", "these" — current UI selection
  | 'deictic_distal'            // "that", "those" — previous UI focus
  | 'anaphoric_last_mentioned'  // "it", "them" — last discourse referent
  | 'anaphoric_recent_edit'     // "the ones I just changed"
  | 'anaphoric_prior_selection' // "the same notes as before"
  | 'salience_top'              // Most salient entity in focus stack
  | 'default_scope';            // System default scope for current context

// =============================================================================
// SUPPORTING TYPES
// =============================================================================

/**
 * Labels for pitch ranges.
 */
export type PitchRangeLabel =
  | 'very_low'    // MIDI 0–35 (sub-bass, very low bass)
  | 'low'         // MIDI 36–47 (bass register)
  | 'low_mid'     // MIDI 48–59 (baritone, tenor low)
  | 'mid'         // MIDI 60–71 (middle register around middle C)
  | 'high_mid'    // MIDI 72–83 (alto, soprano low)
  | 'high'        // MIDI 84–95 (soprano, high register)
  | 'very_high';  // MIDI 96–127 (extreme high register)

/**
 * Chord tone selection.
 */
export type ChordToneSelector =
  | 'root'
  | 'third'
  | 'fifth'
  | 'seventh'
  | 'ninth'
  | 'eleventh'
  | 'thirteenth'
  | 'extension'    // any extension tone (9th, 11th, 13th)
  | 'bass_note'    // lowest note of the chord
  | 'top_note';    // highest note of the chord

/**
 * Beat filter for time-based selection.
 */
export interface BeatFilter {
  readonly beat?: number;
  readonly subdivision?: BeatSubdivision;
  readonly isDownbeat?: boolean;
  readonly isUpbeat?: boolean;
  readonly isOnBeat?: boolean;
  readonly isOffBeat?: boolean;
}

/**
 * Beat subdivisions.
 */
export type BeatSubdivision =
  | 'quarter'      // Quarter note
  | 'eighth'       // Eighth note
  | 'sixteenth'    // Sixteenth note
  | 'triplet'      // Triplet subdivision
  | 'dotted'       // Dotted note position
  | 'swing';       // Swing subdivision (between straight and triplet)

/**
 * Velocity range labels.
 */
export type VelocityRange =
  | 'ghost'        // 1–30 (barely audible, ghost notes)
  | 'soft'         // 31–60 (piano, pianissimo)
  | 'medium'       // 61–90 (mezzo-forte)
  | 'loud'         // 91–110 (forte)
  | 'very_loud'    // 111–127 (fortissimo, maximum impact)
  | 'accented';    // Relative: higher velocity than surrounding notes

/**
 * Duration range labels.
 */
export type DurationRange =
  | 'very_short'   // < 1/16 note (grace notes, flams)
  | 'short'        // 1/16 to 1/8 note
  | 'medium'       // 1/8 to 1/2 note
  | 'long'         // 1/2 note to 2 bars
  | 'very_long'    // > 2 bars (sustained pads, drones)
  | 'staccato'     // Shorter than notated value
  | 'tenuto';      // Full notated value

/**
 * Standard note durations.
 */
export type NoteDuration =
  | 'whole'        // 4 beats
  | 'half'         // 2 beats
  | 'quarter'      // 1 beat
  | 'eighth'       // 1/2 beat
  | 'sixteenth'    // 1/4 beat
  | 'thirty_second' // 1/8 beat
  | 'dotted_half'  // 3 beats
  | 'dotted_quarter' // 1.5 beats
  | 'dotted_eighth'  // 3/4 beat
  | 'triplet_quarter' // 2/3 beat
  | 'triplet_eighth'; // 1/3 beat

/**
 * Musical roles for events.
 */
export type MusicalRole =
  | 'melody'           // Lead melodic line
  | 'harmony'          // Chord voicings, pads
  | 'bass'             // Bass line
  | 'rhythm'           // Rhythmic patterns (drums, percussion)
  | 'accompaniment'    // Supporting harmonic/rhythmic patterns
  | 'countermelody'    // Secondary melodic line
  | 'fill'             // Transitional fill
  | 'hook'             // Repeated catchy motif
  | 'riff'             // Repeated instrumental pattern
  | 'ostinato'         // Repeating pattern
  | 'pedal'            // Sustained tone (pedal point)
  | 'drone'            // Continuous sustained tone
  | 'texture'          // Ambient/textural elements
  | 'effect'           // Sound effects, risers, sweeps
  | 'transition'       // Transitional elements
  | 'solo'             // Solo passage
  | 'call'             // Call (in call-and-response)
  | 'response';        // Response (in call-and-response)

/**
 * Articulation types.
 */
export type ArticulationType =
  | 'staccato'         // Short, detached
  | 'legato'           // Smooth, connected
  | 'accent'           // Emphasized attack
  | 'marcato'          // Strongly accented
  | 'tenuto'           // Sustained full value
  | 'portato'          // Between staccato and legato
  | 'sforzando'        // Sudden forte
  | 'pizzicato'        // Plucked (vs bowed)
  | 'tremolo'          // Rapid repetition
  | 'trill'            // Rapid alternation with neighbor
  | 'glissando'        // Slide between pitches
  | 'bend'             // Pitch bend
  | 'hammer_on'        // Guitar hammer-on
  | 'pull_off'         // Guitar pull-off
  | 'palm_mute'        // Muted/dampened
  | 'harmonic'         // Natural/artificial harmonic
  | 'slide';           // Pitch slide

/**
 * Dynamic levels.
 */
export type DynamicLevel =
  | 'ppp'              // Pianississimo
  | 'pp'               // Pianissimo
  | 'p'                // Piano
  | 'mp'               // Mezzo-piano
  | 'mf'               // Mezzo-forte
  | 'f'                // Forte
  | 'ff'               // Fortissimo
  | 'fff';             // Fortississimo

/**
 * Dynamic markings (shape/direction).
 */
export type DynamicMarking =
  | 'crescendo'        // Getting louder
  | 'decrescendo'      // Getting softer
  | 'diminuendo'       // Getting softer (synonym)
  | 'sforzando'        // Sudden accent
  | 'fortepiano'       // Loud then immediately soft
  | 'subito_piano'     // Suddenly soft
  | 'subito_forte'     // Suddenly loud
  | 'morendo'          // Dying away
  | 'calando'          // Decreasing in both tempo and dynamics
  | 'perdendosi';      // Dying away to nothing

/**
 * Comparison operators for property selectors.
 */
export type ComparisonOperator =
  | 'eq'               // Equal
  | 'neq'              // Not equal
  | 'gt'               // Greater than
  | 'gte'              // Greater than or equal
  | 'lt'               // Less than
  | 'lte'              // Less than or equal
  | 'contains'         // String contains
  | 'starts_with'      // String starts with
  | 'matches';         // Regex match

// =============================================================================
// PITCH RANGE BOUNDARIES
// =============================================================================

/**
 * MIDI note boundaries for pitch range labels.
 */
export const PITCH_RANGE_BOUNDARIES: Record<PitchRangeLabel, {
  readonly min: number;
  readonly max: number;
  readonly description: string;
}> = {
  very_low: { min: 0, max: 35, description: 'Sub-bass to very low bass (C-1 to B1)' },
  low: { min: 36, max: 47, description: 'Bass register (C2 to B2)' },
  low_mid: { min: 48, max: 59, description: 'Baritone/low tenor (C3 to B3)' },
  mid: { min: 60, max: 71, description: 'Middle register around middle C (C4 to B4)' },
  high_mid: { min: 72, max: 83, description: 'Alto/low soprano (C5 to B5)' },
  high: { min: 84, max: 95, description: 'Soprano/high register (C6 to B6)' },
  very_high: { min: 96, max: 127, description: 'Extreme high register (C7 to G9)' },
};

/**
 * MIDI velocity boundaries for velocity range labels.
 */
export const VELOCITY_RANGE_BOUNDARIES: Record<Exclude<VelocityRange, 'accented'>, {
  readonly min: number;
  readonly max: number;
  readonly description: string;
}> = {
  ghost: { min: 1, max: 30, description: 'Barely audible ghost notes' },
  soft: { min: 31, max: 60, description: 'Piano, pianissimo' },
  medium: { min: 61, max: 90, description: 'Mezzo-piano to mezzo-forte' },
  loud: { min: 91, max: 110, description: 'Forte' },
  very_loud: { min: 111, max: 127, description: 'Fortissimo, maximum impact' },
};

/**
 * Beat boundaries for duration range labels.
 */
export const DURATION_RANGE_BOUNDARIES: Record<Exclude<DurationRange, 'staccato' | 'tenuto'>, {
  readonly minBeats: number;
  readonly maxBeats: number;
  readonly description: string;
}> = {
  very_short: { minBeats: 0, maxBeats: 0.25, description: 'Grace notes, flams (< 1/16)' },
  short: { minBeats: 0.25, maxBeats: 0.5, description: '1/16 to 1/8 note' },
  medium: { minBeats: 0.5, maxBeats: 2, description: '1/8 to half note' },
  long: { minBeats: 2, maxBeats: 8, description: 'Half note to 2 bars' },
  very_long: { minBeats: 8, maxBeats: Infinity, description: 'Sustained pads, drones (> 2 bars)' },
};

// =============================================================================
// SELECTOR CONSTRUCTORS (Convenience functions)
// =============================================================================

/**
 * Create a kind selector.
 */
export function byKind(...kinds: EventKind[]): KindSelector {
  return { type: 'kind', kinds };
}

/**
 * Create a pitch range selector from a label.
 */
export function byPitchRange(range: PitchRangeLabel): PitchRangeSelector {
  return { type: 'pitch_range', range };
}

/**
 * Create a pitch range selector from MIDI note numbers.
 */
export function byMidiRange(min: number, max: number): PitchRangeSelector {
  return { type: 'pitch_range', midiMin: min, midiMax: max };
}

/**
 * Create a time range selector from bar numbers.
 */
export function byBars(startBar: number, endBar: number): TimeRangeSelector {
  return { type: 'time_range', startBar, endBar };
}

/**
 * Create a time range selector from a section reference.
 */
export function bySection(sectionType: string, ordinal?: number): SectionSelector {
  const result: SectionSelector = { type: 'section', sectionType };
  if (ordinal !== undefined) {
    return { ...result, ordinal };
  }
  return result;
}

/**
 * Create a layer selector.
 */
export function onLayer(layerType: string): LayerSelector {
  return { type: 'layer', layerType };
}

/**
 * Create a role selector.
 */
export function byRole(role: MusicalRole): RoleSelector {
  return { type: 'role', role };
}

/**
 * Create a pattern selector.
 */
export function byPattern(pattern: EventPattern): PatternSelector {
  return { type: 'pattern', pattern };
}

/**
 * Create a velocity selector from a range label.
 */
export function byVelocity(range: VelocityRange): VelocitySelector {
  return { type: 'velocity', range };
}

/**
 * Create a duration selector from a range label.
 */
export function byDuration(range: DurationRange): DurationSelector {
  return { type: 'duration', range };
}

/**
 * Create an articulation selector.
 */
export function byArticulation(articulation: ArticulationType): ArticulationSelector {
  return { type: 'articulation', articulation };
}

/**
 * Create a tag selector.
 */
export function byTag(...tags: string[]): TagSelector {
  return { type: 'tag', tags, matchMode: 'any' };
}

/**
 * Create an "all events" selector.
 */
export function allEvents(): AllSelector {
  return { type: 'all' };
}

/**
 * Create an empty selector.
 */
export function noEvents(): NoneSelector {
  return { type: 'none' };
}

// =============================================================================
// SELECTOR COMBINATORS
// =============================================================================

/**
 * Combine selectors with AND (intersection).
 */
export function and(...selectors: EventSelector[]): AndSelector {
  return { type: 'and', selectors };
}

/**
 * Combine selectors with OR (union).
 */
export function or(...selectors: EventSelector[]): OrSelector {
  return { type: 'or', selectors };
}

/**
 * Negate a selector.
 */
export function not(selector: EventSelector): NotSelector {
  return { type: 'not', selector };
}

/**
 * Set difference: include minus exclude.
 */
export function difference(include: EventSelector, exclude: EventSelector): DifferenceSelector {
  return { type: 'difference', include, exclude };
}

/**
 * Select every Nth event from a base.
 */
export function everyNth(n: number, base: EventSelector, offset?: number): NthSelector {
  const result: NthSelector = { type: 'nth', n, base };
  if (offset !== undefined) {
    return { ...result, offset };
  }
  return result;
}

/**
 * Select a slice of events from a base.
 */
export function slice(
  base: EventSelector,
  start: number,
  count: number
): SliceSelector {
  return { type: 'slice', start, count, base };
}

/**
 * Select the first N events from a base.
 */
export function first(count: number, base: EventSelector): SliceSelector {
  return { type: 'slice', start: 0, count, base };
}

/**
 * Select the last N events from a base.
 */
export function last(count: number, base: EventSelector): SliceSelector {
  return { type: 'slice', count, fromEnd: true, base };
}

/**
 * Select events neighboring a reference.
 */
export function neighbors(
  direction: 'before' | 'after' | 'around',
  count: number,
  reference: EventSelector
): NeighborSelector {
  return { type: 'neighbor', direction, count, reference };
}

/**
 * Create a contextual (deictic/anaphoric) selector.
 */
export function contextual(
  contextKind: ContextualSelectorKind,
  fallback?: EventSelector
): ContextualSelector {
  const result: ContextualSelector = { type: 'contextual', contextKind };
  if (fallback !== undefined) {
    return { ...result, fallback };
  }
  return result;
}

// =============================================================================
// SELECTOR ANALYSIS
// =============================================================================

/**
 * Check if a selector requires runtime context (UI selection, discourse).
 */
export function requiresContext(selector: EventSelector): boolean {
  switch (selector.type) {
    case 'contextual':
      return true;
    case 'and':
      return selector.selectors.some(requiresContext);
    case 'or':
      return selector.selectors.some(requiresContext);
    case 'not':
      return requiresContext(selector.selector);
    case 'difference':
      return requiresContext(selector.include) || requiresContext(selector.exclude);
    case 'nth':
      return requiresContext(selector.base);
    case 'slice':
      return requiresContext(selector.base);
    case 'neighbor':
      return requiresContext(selector.reference) ||
        (selector.base ? requiresContext(selector.base) : false);
    case 'position':
      return selector.withinScope ? requiresContext(selector.withinScope) : false;
    default:
      return false;
  }
}

/**
 * Check if a selector is a leaf (atomic, non-composite).
 */
export function isLeafSelector(selector: EventSelector): boolean {
  return !['and', 'or', 'not', 'difference', 'nth', 'slice', 'neighbor'].includes(
    selector.type
  );
}

/**
 * Count the total number of leaf predicates in a selector tree.
 */
export function countPredicates(selector: EventSelector): number {
  switch (selector.type) {
    case 'and':
      return selector.selectors.reduce((sum, s) => sum + countPredicates(s), 0);
    case 'or':
      return selector.selectors.reduce((sum, s) => sum + countPredicates(s), 0);
    case 'not':
      return countPredicates(selector.selector);
    case 'difference':
      return countPredicates(selector.include) + countPredicates(selector.exclude);
    case 'nth':
      return 1 + countPredicates(selector.base);
    case 'slice':
      return 1 + countPredicates(selector.base);
    case 'neighbor':
      return 1 + countPredicates(selector.reference) +
        (selector.base ? countPredicates(selector.base) : 0);
    case 'position':
      return 1 + (selector.withinScope ? countPredicates(selector.withinScope) : 0);
    default:
      return 1;
  }
}

/**
 * Get all entity types referenced by a selector.
 */
export function getReferencedEntityTypes(selector: EventSelector): readonly EntityType[] {
  const types = new Set<EntityType>();

  function walk(s: EventSelector): void {
    switch (s.type) {
      case 'layer':
        types.add('layer');
        break;
      case 'section':
        types.add('section');
        break;
      case 'time_range':
        types.add('range');
        if (s.sectionRef) types.add('section');
        break;
      case 'kind':
      case 'pitch_range':
      case 'velocity':
      case 'duration':
      case 'articulation':
      case 'pattern':
      case 'dynamic':
      case 'position':
      case 'property':
        types.add('event');
        break;
      case 'role':
      case 'tag':
        types.add('event');
        break;
      case 'and':
        s.selectors.forEach(walk);
        break;
      case 'or':
        s.selectors.forEach(walk);
        break;
      case 'not':
        walk(s.selector);
        break;
      case 'difference':
        walk(s.include);
        walk(s.exclude);
        break;
      case 'nth':
        walk(s.base);
        break;
      case 'slice':
        walk(s.base);
        break;
      case 'neighbor':
        walk(s.reference);
        if (s.base) walk(s.base);
        break;
      case 'contextual':
        if (s.fallback) walk(s.fallback);
        break;
      case 'all':
      case 'none':
        break;
    }
  }

  walk(selector);
  return Array.from(types);
}

/**
 * Get the maximum nesting depth of a selector tree.
 */
export function getSelectorDepth(selector: EventSelector): number {
  switch (selector.type) {
    case 'and':
      return 1 + Math.max(0, ...selector.selectors.map(getSelectorDepth));
    case 'or':
      return 1 + Math.max(0, ...selector.selectors.map(getSelectorDepth));
    case 'not':
      return 1 + getSelectorDepth(selector.selector);
    case 'difference':
      return 1 + Math.max(
        getSelectorDepth(selector.include),
        getSelectorDepth(selector.exclude)
      );
    case 'nth':
      return 1 + getSelectorDepth(selector.base);
    case 'slice':
      return 1 + getSelectorDepth(selector.base);
    case 'neighbor':
      return 1 + Math.max(
        getSelectorDepth(selector.reference),
        selector.base ? getSelectorDepth(selector.base) : 0
      );
    case 'position':
      return 1 + (selector.withinScope ? getSelectorDepth(selector.withinScope) : 0);
    case 'contextual':
      return 1 + (selector.fallback ? getSelectorDepth(selector.fallback) : 0);
    default:
      return 1;
  }
}

// =============================================================================
// SELECTOR DESCRIPTION (Human-readable)
// =============================================================================

/**
 * Generate a human-readable description of a selector.
 *
 * Used in the preview-first UX to show what events will be affected.
 */
export function describeSelector(selector: EventSelector): string {
  switch (selector.type) {
    case 'all':
      return 'all events';
    case 'none':
      return 'no events';
    case 'kind':
      return selector.kinds.length === 1
        ? `${selector.kinds[0]} events`
        : `${selector.kinds.join(' and ')} events`;
    case 'pitch_range':
      if (selector.range) return `${selector.range.replace('_', ' ')} pitch events`;
      if (selector.midiMin !== undefined && selector.midiMax !== undefined) {
        return `events in MIDI range ${selector.midiMin}–${selector.midiMax}`;
      }
      if (selector.noteName) return `${selector.noteName}${selector.octave ?? ''} events`;
      return 'pitch-filtered events';
    case 'time_range':
      if (selector.startBar !== undefined && selector.endBar !== undefined) {
        if (selector.startBar === selector.endBar) return `events at bar ${selector.startBar}`;
        return `events in bars ${selector.startBar}–${selector.endBar}`;
      }
      return 'time-filtered events';
    case 'layer':
      return selector.layerType
        ? `events on the ${selector.layerType}`
        : 'events on specified layer';
    case 'section':
      if (selector.sectionType && selector.ordinal) {
        return `events in ${selector.sectionType} ${selector.ordinal}`;
      }
      return selector.sectionType
        ? `events in the ${selector.sectionType}`
        : 'events in specified section';
    case 'role':
      return selector.role
        ? `${selector.role} events`
        : `events with roles: ${selector.roles?.join(', ') ?? 'unspecified'}`;
    case 'tag':
      return `events tagged ${selector.tags.join(selector.matchMode === 'all' ? ' and ' : ' or ')}`;
    case 'pattern':
      return `${selector.pattern.replace(/_/g, ' ')} events`;
    case 'velocity':
      return selector.range
        ? `${selector.range} events`
        : 'velocity-filtered events';
    case 'duration':
      if (selector.noteDuration) return `${selector.noteDuration.replace(/_/g, ' ')} notes`;
      return selector.range
        ? `${selector.range.replace(/_/g, ' ')} events`
        : 'duration-filtered events';
    case 'articulation':
      return `${selector.articulation} events`;
    case 'dynamic':
      if (selector.marking) return `${selector.marking} passage`;
      return selector.level ? `${selector.level} events` : 'dynamically filtered events';
    case 'position':
      if (selector.position) return `the ${selector.position} event`;
      if (selector.ordinal) return `event #${selector.ordinal}`;
      return 'positionally filtered event';
    case 'property':
      return `events where ${selector.propertyName} ${selector.operator} ${selector.value}`;
    case 'and':
      return selector.selectors.map(describeSelector).join(', ');
    case 'or':
      return selector.selectors.map(describeSelector).join(' or ');
    case 'not':
      return `everything except ${describeSelector(selector.selector)}`;
    case 'difference':
      return `${describeSelector(selector.include)} excluding ${describeSelector(selector.exclude)}`;
    case 'nth':
      return `every ${ordinalSuffix(selector.n)} ${describeSelector(selector.base)}`;
    case 'slice':
      if (selector.fromEnd) return `the last ${selector.count} of ${describeSelector(selector.base)}`;
      return `the first ${selector.count} of ${describeSelector(selector.base)}`;
    case 'neighbor':
      return `${selector.count} events ${selector.direction} ${describeSelector(selector.reference)}`;
    case 'contextual':
      return describeContextualKind(selector.contextKind);
  }
}

/**
 * Describe a contextual selector kind.
 */
function describeContextualKind(kind: ContextualSelectorKind): string {
  switch (kind) {
    case 'deictic_selection': return 'the currently selected events';
    case 'deictic_distal': return 'those events (previously focused)';
    case 'anaphoric_last_mentioned': return 'the previously mentioned events';
    case 'anaphoric_recent_edit': return 'the recently edited events';
    case 'anaphoric_prior_selection': return 'the previously selected events';
    case 'salience_top': return 'the most prominent events in context';
    case 'default_scope': return 'the default scope events';
  }
}

/**
 * Get ordinal suffix for a number.
 */
function ordinalSuffix(n: number): string {
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

// =============================================================================
// SELECTOR VALIDATION
// =============================================================================

/**
 * Validation error for a selector.
 */
export interface SelectorValidationError {
  readonly path: string;
  readonly message: string;
  readonly severity: 'error' | 'warning';
}

/**
 * Validate a selector for structural correctness.
 *
 * Checks:
 *   - No empty AND/OR combinators
 *   - MIDI values in valid range (0–127)
 *   - Bar numbers are positive
 *   - No excessively deep nesting (max depth 10)
 *   - Contextual selectors have required context kind
 */
export function validateSelector(
  selector: EventSelector,
  path: string = 'root'
): readonly SelectorValidationError[] {
  const errors: SelectorValidationError[] = [];

  switch (selector.type) {
    case 'and':
    case 'or':
      if (selector.selectors.length === 0) {
        errors.push({
          path,
          message: `${selector.type.toUpperCase()} selector must have at least one child`,
          severity: 'error',
        });
      }
      selector.selectors.forEach((s, i) => {
        errors.push(...validateSelector(s, `${path}.${selector.type}[${i}]`));
      });
      break;

    case 'not':
      errors.push(...validateSelector(selector.selector, `${path}.not`));
      break;

    case 'difference':
      errors.push(...validateSelector(selector.include, `${path}.include`));
      errors.push(...validateSelector(selector.exclude, `${path}.exclude`));
      break;

    case 'pitch_range':
      if (selector.midiMin !== undefined && (selector.midiMin < 0 || selector.midiMin > 127)) {
        errors.push({ path, message: `MIDI min ${selector.midiMin} out of range (0–127)`, severity: 'error' });
      }
      if (selector.midiMax !== undefined && (selector.midiMax < 0 || selector.midiMax > 127)) {
        errors.push({ path, message: `MIDI max ${selector.midiMax} out of range (0–127)`, severity: 'error' });
      }
      if (selector.midiMin !== undefined && selector.midiMax !== undefined && selector.midiMin > selector.midiMax) {
        errors.push({ path, message: `MIDI min (${selector.midiMin}) > max (${selector.midiMax})`, severity: 'error' });
      }
      break;

    case 'time_range':
      if (selector.startBar !== undefined && selector.startBar < 1) {
        errors.push({ path, message: 'Bar numbers must be >= 1', severity: 'error' });
      }
      if (selector.startBar !== undefined && selector.endBar !== undefined && selector.startBar > selector.endBar) {
        errors.push({ path, message: `Start bar (${selector.startBar}) > end bar (${selector.endBar})`, severity: 'error' });
      }
      break;

    case 'velocity':
      if (selector.min !== undefined && (selector.min < 0 || selector.min > 127)) {
        errors.push({ path, message: `Velocity min ${selector.min} out of range (0–127)`, severity: 'error' });
      }
      if (selector.max !== undefined && (selector.max < 0 || selector.max > 127)) {
        errors.push({ path, message: `Velocity max ${selector.max} out of range (0–127)`, severity: 'error' });
      }
      break;

    case 'nth':
      if (selector.n < 1) {
        errors.push({ path, message: 'nth selector n must be >= 1', severity: 'error' });
      }
      errors.push(...validateSelector(selector.base, `${path}.base`));
      break;

    case 'slice':
      if (selector.count !== undefined && selector.count < 1) {
        errors.push({ path, message: 'Slice count must be >= 1', severity: 'error' });
      }
      errors.push(...validateSelector(selector.base, `${path}.base`));
      break;

    case 'neighbor':
      if (selector.count < 1) {
        errors.push({ path, message: 'Neighbor count must be >= 1', severity: 'error' });
      }
      errors.push(...validateSelector(selector.reference, `${path}.reference`));
      if (selector.base) {
        errors.push(...validateSelector(selector.base, `${path}.base`));
      }
      break;

    case 'kind':
      if (selector.kinds.length === 0) {
        errors.push({ path, message: 'Kind selector must specify at least one kind', severity: 'error' });
      }
      break;

    case 'tag':
      if (selector.tags.length === 0) {
        errors.push({ path, message: 'Tag selector must specify at least one tag', severity: 'error' });
      }
      break;

    case 'position':
      if (selector.withinScope) {
        errors.push(...validateSelector(selector.withinScope, `${path}.withinScope`));
      }
      break;

    case 'contextual':
      if (selector.fallback) {
        errors.push(...validateSelector(selector.fallback, `${path}.fallback`));
      }
      break;
  }

  // Check depth
  const depth = getSelectorDepth(selector);
  if (depth > 10) {
    errors.push({
      path,
      message: `Selector tree depth ${depth} exceeds maximum of 10`,
      severity: 'error',
    });
  }

  return errors;
}

// =============================================================================
// NATURAL LANGUAGE → SELECTOR MAPPING TABLE
// =============================================================================

/**
 * A mapping from natural language patterns to selector constructors.
 */
export interface NLSelectorMapping {
  readonly id: string;
  readonly patterns: readonly string[];
  readonly description: string;
  readonly selectorFactory: string;
  readonly examples: readonly NLSelectorExample[];
}

/**
 * An example of NL → selector mapping.
 */
export interface NLSelectorExample {
  readonly input: string;
  readonly selector: EventSelector;
  readonly description: string;
}

/**
 * Canonical NL → EventSelector mappings.
 *
 * These define how common natural language phrases map to typed selectors.
 * The parser uses these mappings (among other rules) to construct selectors.
 */
export const NL_SELECTOR_MAPPINGS: readonly NLSelectorMapping[] = [
  {
    id: 'nlsel-001',
    patterns: ['the notes', 'all notes', 'every note'],
    description: 'Select all note events',
    selectorFactory: 'byKind("note")',
    examples: [
      { input: 'make the notes louder', selector: byKind('note'), description: 'All note events' },
    ],
  },
  {
    id: 'nlsel-002',
    patterns: ['the chords', 'all chords'],
    description: 'Select chord events',
    selectorFactory: 'byKind("chord")',
    examples: [
      { input: 'simplify the chords', selector: byKind('chord'), description: 'All chord events' },
    ],
  },
  {
    id: 'nlsel-003',
    patterns: ['the high notes', 'the upper notes', 'notes up high'],
    description: 'Select high-pitched notes',
    selectorFactory: 'and(byKind("note"), byPitchRange("high"))',
    examples: [
      {
        input: 'lower the high notes',
        selector: and(byKind('note'), byPitchRange('high')),
        description: 'High-register note events',
      },
    ],
  },
  {
    id: 'nlsel-004',
    patterns: ['the bass notes', 'the low notes', 'the bottom notes'],
    description: 'Select low-pitched notes',
    selectorFactory: 'and(byKind("note"), byPitchRange("low"))',
    examples: [
      {
        input: 'make the bass notes shorter',
        selector: and(byKind('note'), byPitchRange('low')),
        description: 'Low-register note events',
      },
    ],
  },
  {
    id: 'nlsel-005',
    patterns: ['the downbeats', 'every downbeat', 'on the downbeats'],
    description: 'Select downbeat events',
    selectorFactory: 'byPattern("downbeat")',
    examples: [
      {
        input: 'accent the downbeats',
        selector: byPattern('downbeat'),
        description: 'Events on the downbeat of each bar',
      },
    ],
  },
  {
    id: 'nlsel-006',
    patterns: ['every other bar', 'alternate bars', 'bars 1, 3, 5'],
    description: 'Select events in alternating bars',
    selectorFactory: 'byPattern("every_other_bar")',
    examples: [
      {
        input: 'thin out every other bar',
        selector: byPattern('every_other_bar'),
        description: 'Events in alternating bars',
      },
    ],
  },
  {
    id: 'nlsel-007',
    patterns: ['the melody', 'the melodic line', 'the lead melody'],
    description: 'Select melody role events',
    selectorFactory: 'byRole("melody")',
    examples: [
      {
        input: 'make the melody brighter',
        selector: byRole('melody'),
        description: 'Events tagged with melody role',
      },
    ],
  },
  {
    id: 'nlsel-008',
    patterns: ['the ghost notes', 'the quiet notes', 'the subtle hits'],
    description: 'Select very quiet events',
    selectorFactory: 'byVelocity("ghost")',
    examples: [
      {
        input: 'bring up the ghost notes',
        selector: byVelocity('ghost'),
        description: 'Events with very low velocity',
      },
    ],
  },
  {
    id: 'nlsel-009',
    patterns: ['the loud notes', 'the heavy hits', 'the accents'],
    description: 'Select loud events',
    selectorFactory: 'byVelocity("loud")',
    examples: [
      {
        input: 'soften the loud notes',
        selector: byVelocity('loud'),
        description: 'Events with high velocity',
      },
    ],
  },
  {
    id: 'nlsel-010',
    patterns: ['the long notes', 'the sustained notes', 'the held notes'],
    description: 'Select long-duration events',
    selectorFactory: 'byDuration("long")',
    examples: [
      {
        input: 'shorten the long notes',
        selector: byDuration('long'),
        description: 'Events with long duration',
      },
    ],
  },
  {
    id: 'nlsel-011',
    patterns: ['everything', 'all events', 'the whole thing'],
    description: 'Select all events universally',
    selectorFactory: 'allEvents()',
    examples: [
      {
        input: 'transpose everything up',
        selector: allEvents(),
        description: 'All events in scope',
      },
    ],
  },
  {
    id: 'nlsel-012',
    patterns: ['everything except the drums', 'all but the drums'],
    description: 'Select all events except on a specific layer',
    selectorFactory: 'not(onLayer("drums"))',
    examples: [
      {
        input: 'make everything except the drums quieter',
        selector: not(onLayer('drums')),
        description: 'All events not on the drums layer',
      },
    ],
  },
  {
    id: 'nlsel-013',
    patterns: ['the first {n} notes', 'the first few notes', 'the opening notes'],
    description: 'Select the first N note events',
    selectorFactory: 'first(n, byKind("note"))',
    examples: [
      {
        input: 'make the first 4 notes louder',
        selector: first(4, byKind('note')),
        description: 'The first 4 note events',
      },
    ],
  },
  {
    id: 'nlsel-014',
    patterns: ['the last note', 'the final note', 'the ending note'],
    description: 'Select the last note event',
    selectorFactory: 'last(1, byKind("note"))',
    examples: [
      {
        input: 'hold the last note longer',
        selector: last(1, byKind('note')),
        description: 'The final note event',
      },
    ],
  },
  {
    id: 'nlsel-015',
    patterns: ['these notes', 'the selected notes', 'this selection'],
    description: 'Select events from current UI selection',
    selectorFactory: 'contextual("deictic_selection")',
    examples: [
      {
        input: 'transpose these notes up',
        selector: contextual('deictic_selection'),
        description: 'Currently selected events in the UI',
      },
    ],
  },
  {
    id: 'nlsel-016',
    patterns: ['the staccato notes', 'the short detached notes'],
    description: 'Select staccato-articulated events',
    selectorFactory: 'byArticulation("staccato")',
    examples: [
      {
        input: 'make the staccato notes even shorter',
        selector: byArticulation('staccato'),
        description: 'Events with staccato articulation',
      },
    ],
  },
  {
    id: 'nlsel-017',
    patterns: ['the crescendo', 'the crescendo passage', 'the build-up'],
    description: 'Select events in a crescendo',
    selectorFactory: 'and(byKind("note"), dynamic:crescendo)',
    examples: [
      {
        input: 'extend the crescendo',
        selector: and(byKind('note'), { type: 'dynamic', marking: 'crescendo' }),
        description: 'Events within a crescendo marking',
      },
    ],
  },
  {
    id: 'nlsel-018',
    patterns: ['the backbeat', 'beats 2 and 4', 'the snare hits'],
    description: 'Select backbeat events',
    selectorFactory: 'byPattern("backbeat")',
    examples: [
      {
        input: 'accent the backbeat',
        selector: byPattern('backbeat'),
        description: 'Events on beats 2 and 4',
      },
    ],
  },
  {
    id: 'nlsel-019',
    patterns: ['every other note', 'alternate notes'],
    description: 'Select every second note event',
    selectorFactory: 'everyNth(2, byKind("note"))',
    examples: [
      {
        input: 'remove every other note',
        selector: everyNth(2, byKind('note')),
        description: 'Every second note event',
      },
    ],
  },
  {
    id: 'nlsel-020',
    patterns: ['the rhythm section', 'the rhythm parts'],
    description: 'Select rhythm section events (drums + bass)',
    selectorFactory: 'or(onLayer("drums"), onLayer("bass"))',
    examples: [
      {
        input: 'tighten up the rhythm section',
        selector: or(onLayer('drums'), onLayer('bass')),
        description: 'Events on drums and bass layers',
      },
    ],
  },
];

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

/**
 * Rules governing EventSelector usage and composition.
 */
export interface EventSelectorRule {
  readonly id: string;
  readonly description: string;
  readonly category: 'composition' | 'validation' | 'evaluation' | 'display';
  readonly rule: string;
}

/**
 * Canonical rules for EventSelector handling.
 */
export const EVENT_SELECTOR_RULES: readonly EventSelectorRule[] = [
  {
    id: 'esel-001',
    description: 'Selectors are pure data',
    category: 'composition',
    rule: 'EventSelectors must be serializable JSON with no functions or closures. They describe *what* to select, never *how* to compute it.',
  },
  {
    id: 'esel-002',
    description: 'Selectors are lazy',
    category: 'evaluation',
    rule: 'EventSelectors are predicates, not materialized result sets. Actual event enumeration happens only during plan execution, not during parsing or semantic analysis.',
  },
  {
    id: 'esel-003',
    description: 'Contextual selectors require runtime context',
    category: 'validation',
    rule: 'Any selector with requiresContext() === true MUST have access to the current UI selection state and discourse history at evaluation time. The pipeline MUST fail gracefully if context is unavailable.',
  },
  {
    id: 'esel-004',
    description: 'Selector descriptions must be human-readable',
    category: 'display',
    rule: 'Every selector MUST produce a meaningful description via describeSelector(). These descriptions are shown in the preview-first UX to explain what events will be affected.',
  },
  {
    id: 'esel-005',
    description: 'Empty results require clarification',
    category: 'evaluation',
    rule: 'If a selector evaluates to zero events during plan execution, the system MUST ask the user for clarification rather than silently producing a no-op edit plan.',
  },
  {
    id: 'esel-006',
    description: 'Maximum selector depth',
    category: 'validation',
    rule: 'Selector trees deeper than 10 levels are rejected during validation. Deeply nested selectors indicate a parsing error or adversarial input.',
  },
  {
    id: 'esel-007',
    description: 'AND flattening',
    category: 'composition',
    rule: 'Nested AND(AND(a, b), c) should be flattened to AND(a, b, c) during normalization. Similarly for OR. This simplifies display and evaluation.',
  },
  {
    id: 'esel-008',
    description: 'Selector determinism',
    category: 'evaluation',
    rule: 'Given the same project state and context, a selector MUST always select exactly the same events. No randomness, no sampling, no approximation.',
  },
  {
    id: 'esel-009',
    description: 'Pitch range labels are stable',
    category: 'validation',
    rule: 'The MIDI note boundaries for pitch range labels (low, mid, high, etc.) are fixed and must not change between versions. They are part of the selector contract.',
  },
  {
    id: 'esel-010',
    description: 'Selector composition preserves provenance',
    category: 'composition',
    rule: 'When selectors are composed (AND, OR, NOT), the original sub-selectors must remain inspectable for provenance tracking. No lossy merging.',
  },
];
