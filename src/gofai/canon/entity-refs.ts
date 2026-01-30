/**
 * GOFAI Canon — Entity Reference Types with Branded IDs
 *
 * Defines the typed reference system for all musical entities in the
 * GOFAI Music+ compilation pipeline. Each entity kind gets:
 *   - A branded ID type (nominal typing via __brand)
 *   - A constructor function
 *   - A validator function
 *   - A typed reference structure for CPL scoping
 *
 * Entity reference resolution flows through these layers:
 *   1. Unresolved (parsed from user input, may be ambiguous)
 *   2. Resolved (bound to a specific project entity)
 *   3. Validated (confirmed to exist and be accessible)
 *
 * @module gofai/canon/entity-refs
 * @see gofaimusicplus.md §3.3 — Scope is first-class and typed
 * @see gofai_goalA.md Step 054
 */

import type { EntityType } from './types';

// =============================================================================
// BRANDED ID TYPES
// =============================================================================

/**
 * A branded ID for a section instance in a project.
 *
 * Format: `secref:<section-type>:<instance>` or `secref:<section-type>:<label>`
 * Examples:
 *   - `secref:chorus:1` — First chorus
 *   - `secref:verse:2` — Second verse
 *   - `secref:intro:0` — The intro (singleton)
 *   - `secref:bridge:autumn_bridge` — Named bridge section
 */
export type SectionRefId = string & { readonly __brand: 'SectionRefId' };

/**
 * A branded ID for a bar range within a project.
 *
 * Format: `rangeref:<start>-<end>` or `rangeref:<relative-spec>`
 * Examples:
 *   - `rangeref:33-40` — Bars 33 through 40
 *   - `rangeref:1-8` — First 8 bars
 *   - `rangeref:last4` — Last 4 bars
 */
export type RangeRefId = string & { readonly __brand: 'RangeRefId' };

/**
 * A branded ID for a layer/track in a project.
 *
 * Format: `layerref:<layer-type>:<instance>` or `layerref:<layer-type>:<name>`
 * Examples:
 *   - `layerref:drums:0` — Main drums layer
 *   - `layerref:bass:0` — Main bass layer
 *   - `layerref:lead:synth_pad` — Named lead layer
 */
export type LayerRefId = string & { readonly __brand: 'LayerRefId' };

/**
 * A branded ID for a specific card (instrument or effect) in a project.
 *
 * Format: `cardref:<card-id>` or `cardref:<deck>:<slot>`
 * Examples:
 *   - `cardref:piano_001` — A specific card by its project-local ID
 *   - `cardref:drums:reverb` — Reverb card on drums deck
 */
export type CardRefId = string & { readonly __brand: 'CardRefId' };

/**
 * A branded ID for a parameter on a card or global setting.
 *
 * Format: `paramref:<card-or-scope>:<param-name>`
 * Examples:
 *   - `paramref:piano_001:velocity` — Velocity param on a specific card
 *   - `paramref:global:tempo` — Global tempo parameter
 *   - `paramref:drums:reverb:decay` — Decay param on drums reverb card
 */
export type ParamRefId = string & { readonly __brand: 'ParamRefId' };

/**
 * A branded ID for a deck (collection of cards forming a channel strip).
 *
 * Format: `deckref:<deck-id>` or `deckref:<layer>:<index>`
 * Examples:
 *   - `deckref:drums_main` — Main drums deck
 *   - `deckref:bass:0` — First bass deck
 */
export type DeckRefId = string & { readonly __brand: 'DeckRefId' };

/**
 * A branded ID for a board (top-level project container).
 *
 * Format: `boardref:<board-id>`
 * Examples:
 *   - `boardref:main` — Main project board
 *   - `boardref:arrangement_v2` — Named board variant
 */
export type BoardRefId = string & { readonly __brand: 'BoardRefId' };

/**
 * A branded ID for a track (synonym for layer in some contexts).
 *
 * Format: `trackref:<track-type>:<instance>`
 * Examples:
 *   - `trackref:vocal:0` — Main vocal track
 *   - `trackref:fx:1` — Second FX track
 */
export type TrackRefId = string & { readonly __brand: 'TrackRefId' };

/**
 * A branded ID for an event (specific musical event within a layer).
 *
 * Format: `eventref:<layer>:<time>:<kind>` or `eventref:<event-uuid>`
 * Examples:
 *   - `eventref:drums:4.1:note` — Note event at bar 4 beat 1 in drums
 *   - `eventref:abc123` — Event by UUID
 */
export type EventRefId = string & { readonly __brand: 'EventRefId' };

/**
 * Union of all entity reference ID types.
 */
export type AnyEntityRefId =
  | SectionRefId
  | RangeRefId
  | LayerRefId
  | CardRefId
  | ParamRefId
  | DeckRefId
  | BoardRefId
  | TrackRefId
  | EventRefId;

// =============================================================================
// ID CONSTRUCTORS
// =============================================================================

/**
 * Create a SectionRefId.
 */
export function createSectionRefId(
  sectionType: string,
  instance: number | string
): SectionRefId {
  const normalized = sectionType.toLowerCase().replace(/\s+/g, '_');
  return `secref:${normalized}:${instance}` as SectionRefId;
}

/**
 * Create a RangeRefId from bar numbers.
 */
export function createRangeRefId(startBar: number, endBar: number): RangeRefId {
  return `rangeref:${startBar}-${endBar}` as RangeRefId;
}

/**
 * Create a RangeRefId from a relative specification.
 */
export function createRelativeRangeRefId(spec: string): RangeRefId {
  const normalized = spec.toLowerCase().replace(/\s+/g, '_');
  return `rangeref:${normalized}` as RangeRefId;
}

/**
 * Create a LayerRefId.
 */
export function createLayerRefId(
  layerType: string,
  instance: number | string
): LayerRefId {
  const normalized = layerType.toLowerCase().replace(/\s+/g, '_');
  return `layerref:${normalized}:${instance}` as LayerRefId;
}

/**
 * Create a CardRefId from a card ID.
 */
export function createCardRefId(cardId: string): CardRefId {
  return `cardref:${cardId}` as CardRefId;
}

/**
 * Create a CardRefId from a deck and slot.
 */
export function createCardRefIdFromSlot(deck: string, slot: string): CardRefId {
  const normalizedDeck = deck.toLowerCase().replace(/\s+/g, '_');
  const normalizedSlot = slot.toLowerCase().replace(/\s+/g, '_');
  return `cardref:${normalizedDeck}:${normalizedSlot}` as CardRefId;
}

/**
 * Create a ParamRefId.
 */
export function createParamRefId(scope: string, paramName: string): ParamRefId {
  const normalizedScope = scope.toLowerCase().replace(/\s+/g, '_');
  const normalizedParam = paramName.toLowerCase().replace(/\s+/g, '_');
  return `paramref:${normalizedScope}:${normalizedParam}` as ParamRefId;
}

/**
 * Create a DeckRefId.
 */
export function createDeckRefId(deckId: string): DeckRefId {
  const normalized = deckId.toLowerCase().replace(/\s+/g, '_');
  return `deckref:${normalized}` as DeckRefId;
}

/**
 * Create a BoardRefId.
 */
export function createBoardRefId(boardId: string): BoardRefId {
  const normalized = boardId.toLowerCase().replace(/\s+/g, '_');
  return `boardref:${normalized}` as BoardRefId;
}

/**
 * Create a TrackRefId.
 */
export function createTrackRefId(
  trackType: string,
  instance: number | string
): TrackRefId {
  const normalized = trackType.toLowerCase().replace(/\s+/g, '_');
  return `trackref:${normalized}:${instance}` as TrackRefId;
}

/**
 * Create an EventRefId from a UUID.
 */
export function createEventRefId(eventUuid: string): EventRefId {
  return `eventref:${eventUuid}` as EventRefId;
}

/**
 * Create an EventRefId from location components.
 */
export function createEventRefIdFromLocation(
  layer: string,
  time: string,
  kind: string
): EventRefId {
  const normalizedLayer = layer.toLowerCase().replace(/\s+/g, '_');
  return `eventref:${normalizedLayer}:${time}:${kind}` as EventRefId;
}

// =============================================================================
// ID VALIDATION
// =============================================================================

/**
 * Validate a SectionRefId.
 */
export function isValidSectionRefId(id: string): id is SectionRefId {
  return /^secref:[a-z0-9_]+:[a-z0-9_]+$/.test(id);
}

/**
 * Validate a RangeRefId.
 */
export function isValidRangeRefId(id: string): id is RangeRefId {
  return /^rangeref:(?:\d+-\d+|[a-z0-9_]+)$/.test(id);
}

/**
 * Validate a LayerRefId.
 */
export function isValidLayerRefId(id: string): id is LayerRefId {
  return /^layerref:[a-z0-9_]+:[a-z0-9_]+$/.test(id);
}

/**
 * Validate a CardRefId.
 */
export function isValidCardRefId(id: string): id is CardRefId {
  return /^cardref:[a-z0-9_]+(?::[a-z0-9_]+)?$/.test(id);
}

/**
 * Validate a ParamRefId.
 */
export function isValidParamRefId(id: string): id is ParamRefId {
  return /^paramref:[a-z0-9_]+(?::[a-z0-9_]+)+$/.test(id);
}

/**
 * Validate a DeckRefId.
 */
export function isValidDeckRefId(id: string): id is DeckRefId {
  return /^deckref:[a-z0-9_]+(?::[a-z0-9_]+)?$/.test(id);
}

/**
 * Validate a BoardRefId.
 */
export function isValidBoardRefId(id: string): id is BoardRefId {
  return /^boardref:[a-z0-9_]+$/.test(id);
}

/**
 * Validate a TrackRefId.
 */
export function isValidTrackRefId(id: string): id is TrackRefId {
  return /^trackref:[a-z0-9_]+:[a-z0-9_]+$/.test(id);
}

/**
 * Validate an EventRefId.
 */
export function isValidEventRefId(id: string): id is EventRefId {
  return /^eventref:[a-z0-9_:.]+$/.test(id);
}

/**
 * Validate any entity ref ID, returning the entity type if valid.
 */
export function validateEntityRefId(id: string): {
  readonly valid: boolean;
  readonly entityType?: EntityType;
  readonly id?: AnyEntityRefId;
} {
  if (isValidSectionRefId(id)) return { valid: true, entityType: 'section', id };
  if (isValidRangeRefId(id)) return { valid: true, entityType: 'range', id };
  if (isValidLayerRefId(id)) return { valid: true, entityType: 'layer', id };
  if (isValidCardRefId(id)) return { valid: true, entityType: 'card', id };
  if (isValidParamRefId(id)) return { valid: true, entityType: 'param', id };
  if (isValidDeckRefId(id)) return { valid: true, entityType: 'deck', id };
  if (isValidBoardRefId(id)) return { valid: true, entityType: 'board', id };
  if (isValidTrackRefId(id)) return { valid: true, entityType: 'track', id };
  if (isValidEventRefId(id)) return { valid: true, entityType: 'event', id };
  return { valid: false };
}

// =============================================================================
// ID PARSING
// =============================================================================

/**
 * Parsed components of a SectionRefId.
 */
export interface ParsedSectionRefId {
  readonly sectionType: string;
  readonly instance: string;
  readonly instanceNumber?: number;
}

/**
 * Parsed components of a RangeRefId.
 */
export interface ParsedRangeRefId {
  readonly isAbsolute: boolean;
  readonly startBar?: number;
  readonly endBar?: number;
  readonly relativeSpec?: string;
}

/**
 * Parsed components of a LayerRefId.
 */
export interface ParsedLayerRefId {
  readonly layerType: string;
  readonly instance: string;
  readonly instanceNumber?: number;
}

/**
 * Parsed components of a CardRefId.
 */
export interface ParsedCardRefId {
  readonly cardId: string;
  readonly deck?: string;
  readonly slot?: string;
}

/**
 * Parsed components of a ParamRefId.
 */
export interface ParsedParamRefId {
  readonly scope: string;
  readonly paramPath: readonly string[];
}

/**
 * Parse a SectionRefId into its components.
 */
export function parseSectionRefId(id: SectionRefId): ParsedSectionRefId {
  const parts = id.replace('secref:', '').split(':');
  const sectionType = parts[0]!;
  const instance = parts[1]!;
  const parsed = /^\d+$/.test(instance) ? parseInt(instance, 10) : undefined;
  const result: ParsedSectionRefId = { sectionType, instance };
  if (parsed !== undefined) {
    return { ...result, instanceNumber: parsed };
  }
  return result;
}

/**
 * Parse a RangeRefId into its components.
 */
export function parseRangeRefId(id: RangeRefId): ParsedRangeRefId {
  const body = id.replace('rangeref:', '');
  const barMatch = /^(\d+)-(\d+)$/.exec(body);
  if (barMatch) {
    return {
      isAbsolute: true,
      startBar: parseInt(barMatch[1]!, 10),
      endBar: parseInt(barMatch[2]!, 10),
    };
  }
  return { isAbsolute: false, relativeSpec: body };
}

/**
 * Parse a LayerRefId into its components.
 */
export function parseLayerRefId(id: LayerRefId): ParsedLayerRefId {
  const parts = id.replace('layerref:', '').split(':');
  const layerType = parts[0]!;
  const instance = parts[1]!;
  const parsed = /^\d+$/.test(instance) ? parseInt(instance, 10) : undefined;
  const result: ParsedLayerRefId = { layerType, instance };
  if (parsed !== undefined) {
    return { ...result, instanceNumber: parsed };
  }
  return result;
}

/**
 * Parse a CardRefId into its components.
 */
export function parseCardRefId(id: CardRefId): ParsedCardRefId {
  const body = id.replace('cardref:', '');
  const parts = body.split(':');
  if (parts.length >= 2) {
    const deck = parts[0]!;
    const slot = parts[1]!;
    return { cardId: body, deck, slot };
  }
  return { cardId: body };
}

/**
 * Parse a ParamRefId into its components.
 */
export function parseParamRefId(id: ParamRefId): ParsedParamRefId {
  const parts = id.replace('paramref:', '').split(':');
  const scope = parts[0]!;
  const paramPath = parts.slice(1);
  return { scope, paramPath };
}

// =============================================================================
// UNRESOLVED ENTITY REFERENCES (from user input)
// =============================================================================

/**
 * Resolution status for an entity reference.
 */
export type ResolutionStatus =
  | 'unresolved'   // Parsed but not yet looked up
  | 'resolved'     // Successfully bound to a project entity
  | 'ambiguous'    // Multiple candidates, needs clarification
  | 'failed';      // Could not resolve

/**
 * An unresolved section reference from user input.
 *
 * Examples of input forms:
 *   - "the chorus" → { sectionType: 'chorus' }
 *   - "verse 2" → { sectionType: 'verse', ordinal: 2 }
 *   - "the second bridge" → { sectionType: 'bridge', ordinal: 2 }
 *   - "the last chorus" → { sectionType: 'chorus', relativePosition: 'last' }
 *   - "this section" → deictic, resolved via UI context
 */
export interface UnresolvedSectionRef {
  readonly entityType: 'section';
  readonly sectionType?: string;
  readonly ordinal?: number;
  readonly label?: string;
  readonly relativePosition?: 'first' | 'last' | 'next' | 'previous' | 'current';
  readonly isDeictic?: boolean;
  readonly rawText: string;
}

/**
 * An unresolved range reference from user input.
 *
 * Examples:
 *   - "bars 33 to 40" → { startBar: 33, endBar: 40 }
 *   - "the first 8 bars" → { relativeStart: 'first', barCount: 8 }
 *   - "two bars before the chorus" → { anchorRef, offset, barCount }
 *   - "from here to the end" → deictic start, absolute end
 */
export interface UnresolvedRangeRef {
  readonly entityType: 'range';
  readonly startBar?: number;
  readonly endBar?: number;
  readonly barCount?: number;
  readonly beatOffset?: number;
  readonly relativeStart?: 'first' | 'last' | 'current';
  readonly relativeEnd?: 'end' | 'section_end' | 'next_section';
  readonly anchorRef?: UnresolvedSectionRef;
  readonly anchorOffset?: {
    readonly direction: 'before' | 'after';
    readonly bars?: number;
    readonly beats?: number;
  };
  readonly isDeictic?: boolean;
  readonly rawText: string;
}

/**
 * An unresolved layer/track reference from user input.
 *
 * Examples:
 *   - "the drums" → { layerType: 'drums' }
 *   - "bass track" → { layerType: 'bass' }
 *   - "the second guitar" → { layerType: 'guitar', ordinal: 2 }
 *   - "the pad" → { layerType: 'pad' }
 *   - "all the synths" → { layerType: 'synth', quantifier: 'all' }
 */
export interface UnresolvedLayerRef {
  readonly entityType: 'layer';
  readonly layerType?: string;
  readonly ordinal?: number;
  readonly modifier?: string;
  readonly quantifier?: 'all' | 'every' | 'each';
  readonly isDeictic?: boolean;
  readonly rawText: string;
}

/**
 * An unresolved card reference from user input.
 *
 * Examples:
 *   - "the piano" → { instrumentName: 'piano' }
 *   - "the reverb on the drums" → { effectName: 'reverb', onLayer: ... }
 *   - "that synth" → deictic
 */
export interface UnresolvedCardRef {
  readonly entityType: 'card';
  readonly instrumentName?: string;
  readonly effectName?: string;
  readonly onLayer?: UnresolvedLayerRef;
  readonly onDeck?: UnresolvedDeckRef;
  readonly isDeictic?: boolean;
  readonly rawText: string;
}

/**
 * An unresolved parameter reference from user input.
 *
 * Examples:
 *   - "the tempo" → { paramName: 'tempo', isGlobal: true }
 *   - "the velocity" → { paramName: 'velocity' }
 *   - "the reverb decay" → { paramName: 'decay', onCard: ... }
 *   - "the volume on the drums" → { paramName: 'volume', onLayer: ... }
 */
export interface UnresolvedParamRef {
  readonly entityType: 'param';
  readonly paramName: string;
  readonly isGlobal?: boolean;
  readonly onCard?: UnresolvedCardRef;
  readonly onLayer?: UnresolvedLayerRef;
  readonly onDeck?: UnresolvedDeckRef;
  readonly isDeictic?: boolean;
  readonly rawText: string;
}

/**
 * An unresolved deck reference from user input.
 *
 * Examples:
 *   - "the drums deck" → { deckLayer: 'drums' }
 *   - "the main deck" → { deckName: 'main' }
 */
export interface UnresolvedDeckRef {
  readonly entityType: 'deck';
  readonly deckName?: string;
  readonly deckLayer?: string;
  readonly ordinal?: number;
  readonly isDeictic?: boolean;
  readonly rawText: string;
}

/**
 * An unresolved board reference from user input.
 *
 * Examples:
 *   - "this board" → deictic
 *   - "the main board" → { boardName: 'main' }
 *   - "the arrangement" → { boardName: 'arrangement' }
 */
export interface UnresolvedBoardRef {
  readonly entityType: 'board';
  readonly boardName?: string;
  readonly isDeictic?: boolean;
  readonly rawText: string;
}

/**
 * An unresolved event reference from user input.
 *
 * Examples:
 *   - "the last note" → { eventKind: 'note', relativePosition: 'last' }
 *   - "the downbeats" → { eventPattern: 'downbeat' }
 *   - "every other bar" → { eventPattern: 'every_other_bar' }
 *   - "the high notes" → { eventKind: 'note', pitchFilter: { range: 'high' } }
 */
export interface UnresolvedEventRef {
  readonly entityType: 'event';
  readonly eventKind?: EventKind;
  readonly relativePosition?: 'first' | 'last' | 'next' | 'previous';
  readonly eventPattern?: EventPattern;
  readonly pitchFilter?: PitchFilter;
  readonly timeFilter?: TimeFilter;
  readonly roleFilter?: string;
  readonly quantifier?: 'all' | 'every' | 'each' | 'some';
  readonly isDeictic?: boolean;
  readonly rawText: string;
}

/**
 * Union of all unresolved entity references.
 */
export type UnresolvedEntityRef =
  | UnresolvedSectionRef
  | UnresolvedRangeRef
  | UnresolvedLayerRef
  | UnresolvedCardRef
  | UnresolvedParamRef
  | UnresolvedDeckRef
  | UnresolvedBoardRef
  | UnresolvedEventRef;

// =============================================================================
// EVENT REFERENCE SUPPORTING TYPES
// =============================================================================

/**
 * Kinds of musical events that can be referenced.
 */
export type EventKind =
  | 'note'          // A pitched note event
  | 'chord'         // A chord (group of simultaneous notes)
  | 'rest'          // A rest/silence
  | 'drum_hit'      // A percussion hit
  | 'cc'            // A MIDI CC (continuous controller) event
  | 'pitch_bend'    // A pitch bend event
  | 'sustain'       // A sustain pedal event
  | 'expression'    // An expression event
  | 'tempo_change'  // A tempo change marker
  | 'meter_change'  // A time signature change
  | 'marker'        // A section/rehearsal marker
  | 'automation';   // An automation point

/**
 * Patterns for selecting groups of events.
 */
export type EventPattern =
  | 'downbeat'          // First beat of each bar
  | 'upbeat'            // Off-beats
  | 'backbeat'          // Beats 2 and 4 (in 4/4)
  | 'every_other_bar'   // Bars 1, 3, 5, ...
  | 'every_beat'        // Every beat position
  | 'syncopation'       // Syncopated events (between beats)
  | 'triplet'           // Triplet subdivisions
  | 'grace_note'        // Grace notes
  | 'tied'              // Tied notes
  | 'staccato'          // Staccato articulations
  | 'legato'            // Legato passages
  | 'accented'          // Accented events
  | 'ghost_note'        // Ghost notes (low velocity)
  | 'sustained'         // Long-held events
  | 'repeated'          // Repeated patterns
  | 'ascending'         // Part of ascending motion
  | 'descending'        // Part of descending motion
  | 'chromatic';        // Chromatic passages

/**
 * Filter events by pitch range.
 */
export interface PitchFilter {
  readonly range?: 'low' | 'mid' | 'high' | 'very_low' | 'very_high';
  readonly midiMin?: number;
  readonly midiMax?: number;
  readonly noteName?: string;
  readonly octave?: number;
  readonly chordTone?: 'root' | 'third' | 'fifth' | 'seventh' | 'extension';
}

/**
 * Filter events by time position.
 */
export interface TimeFilter {
  readonly withinSection?: UnresolvedSectionRef;
  readonly withinRange?: UnresolvedRangeRef;
  readonly atBeat?: number;
  readonly afterBeat?: number;
  readonly beforeBeat?: number;
  readonly onBar?: number;
}

// =============================================================================
// RESOLVED ENTITY REFERENCES
// =============================================================================

/**
 * A resolved section reference — bound to a concrete project section.
 */
export interface ResolvedSectionRef {
  readonly entityType: 'section';
  readonly id: SectionRefId;
  readonly sectionType: string;
  readonly instanceNumber: number;
  readonly label?: string;
  readonly startBar: number;
  readonly endBar: number;
  readonly displayName: string;
}

/**
 * A resolved range reference — bound to concrete bar positions.
 */
export interface ResolvedRangeRef {
  readonly entityType: 'range';
  readonly id: RangeRefId;
  readonly startBar: number;
  readonly endBar: number;
  readonly startBeat?: number;
  readonly endBeat?: number;
  readonly displayName: string;
}

/**
 * A resolved layer reference — bound to a concrete project layer.
 */
export interface ResolvedLayerRef {
  readonly entityType: 'layer';
  readonly id: LayerRefId;
  readonly layerType: string;
  readonly instanceNumber: number;
  readonly layerName: string;
  readonly displayName: string;
}

/**
 * A resolved card reference — bound to a concrete card in the project.
 */
export interface ResolvedCardRef {
  readonly entityType: 'card';
  readonly id: CardRefId;
  readonly cardType: 'instrument' | 'effect' | 'utility';
  readonly cardName: string;
  readonly deckId?: DeckRefId;
  readonly layerId?: LayerRefId;
  readonly displayName: string;
}

/**
 * A resolved parameter reference — bound to a concrete parameter.
 */
export interface ResolvedParamRef {
  readonly entityType: 'param';
  readonly id: ParamRefId;
  readonly paramName: string;
  readonly paramType: ParamType;
  readonly currentValue: number | string | boolean;
  readonly range?: { readonly min: number; readonly max: number };
  readonly cardId?: CardRefId;
  readonly isGlobal: boolean;
  readonly displayName: string;
}

/**
 * A resolved deck reference — bound to a concrete deck.
 */
export interface ResolvedDeckRef {
  readonly entityType: 'deck';
  readonly id: DeckRefId;
  readonly deckName: string;
  readonly layerId?: LayerRefId;
  readonly cardCount: number;
  readonly displayName: string;
}

/**
 * A resolved board reference — bound to a concrete board.
 */
export interface ResolvedBoardRef {
  readonly entityType: 'board';
  readonly id: BoardRefId;
  readonly boardName: string;
  readonly deckCount: number;
  readonly displayName: string;
}

/**
 * A resolved event reference — bound to concrete events.
 */
export interface ResolvedEventRef {
  readonly entityType: 'event';
  readonly id: EventRefId;
  readonly eventKind: EventKind;
  readonly matchedCount: number;
  readonly layerId?: LayerRefId;
  readonly timeRange?: { readonly startBar: number; readonly endBar: number };
  readonly displayName: string;
}

/**
 * Union of all resolved entity references.
 */
export type ResolvedEntityRef =
  | ResolvedSectionRef
  | ResolvedRangeRef
  | ResolvedLayerRef
  | ResolvedCardRef
  | ResolvedParamRef
  | ResolvedDeckRef
  | ResolvedBoardRef
  | ResolvedEventRef;

// =============================================================================
// PARAMETER TYPES
// =============================================================================

/**
 * Types of parameters that can be referenced.
 */
export type ParamType =
  | 'continuous'     // 0.0–1.0 normalized float
  | 'discrete'       // Integer values
  | 'enum'           // One of a fixed set of string values
  | 'boolean'        // On/off toggle
  | 'tempo'          // BPM value
  | 'pitch'          // MIDI note or frequency
  | 'time'           // Duration in bars/beats/ms
  | 'percentage'     // 0–100%
  | 'decibels'       // dB value
  | 'frequency'      // Hz value
  | 'ratio';         // Ratio value (e.g., compression ratio)

// =============================================================================
// RESOLUTION RESULT TYPES
// =============================================================================

/**
 * Result of attempting to resolve an entity reference.
 */
export type EntityResolutionResult =
  | EntityResolutionSuccess
  | EntityResolutionAmbiguous
  | EntityResolutionFailed;

/**
 * Successfully resolved to a single entity.
 */
export interface EntityResolutionSuccess {
  readonly status: 'resolved';
  readonly entity: ResolvedEntityRef;
  readonly confidence: number;
  readonly resolvedVia: ResolutionMethod;
}

/**
 * Multiple candidates found — needs clarification.
 */
export interface EntityResolutionAmbiguous {
  readonly status: 'ambiguous';
  readonly candidates: readonly ResolvedEntityRef[];
  readonly disambiguationQuestion: string;
  readonly suggestedDefault?: ResolvedEntityRef;
}

/**
 * Could not resolve the reference.
 */
export interface EntityResolutionFailed {
  readonly status: 'failed';
  readonly reason: EntityResolutionFailureReason;
  readonly suggestion?: string;
  readonly nearMatches?: readonly ResolvedEntityRef[];
}

/**
 * Method by which an entity was resolved.
 */
export type ResolutionMethod =
  | 'exact_id'             // Matched by exact ID
  | 'exact_name'           // Matched by exact display name
  | 'fuzzy_name'           // Matched by fuzzy name matching
  | 'type_and_ordinal'     // Matched by entity type + ordinal ("verse 2")
  | 'type_and_position'    // Matched by type + relative position ("last chorus")
  | 'deictic'              // Resolved via UI selection context
  | 'anaphoric'            // Resolved via discourse history ("it", "that")
  | 'salience'             // Resolved via most-salient entity
  | 'default'              // Resolved via system default
  | 'context_inferred';    // Inferred from surrounding context

/**
 * Reasons why resolution can fail.
 */
export type EntityResolutionFailureReason =
  | 'not_found'            // No entity matches the reference
  | 'no_project'           // No project context available
  | 'invalid_type'         // Entity type doesn't exist in project
  | 'out_of_range'         // Ordinal or bar number out of range
  | 'no_selection'         // Deictic reference but nothing selected
  | 'stale_selection'      // UI selection is too old to trust
  | 'no_discourse'         // Anaphoric reference but no discourse history
  | 'type_mismatch'        // Entity found but wrong type for context
  | 'access_denied';       // Entity exists but not accessible

// =============================================================================
// SCOPE COMPOSITION
// =============================================================================

/**
 * A CPL scope composed from entity references.
 *
 * Scopes are composed hierarchically:
 *   board → deck → layer → section/range → event selection
 *
 * Any level can be omitted, defaulting to "current" context.
 */
export interface EntityScope {
  readonly board?: ResolvedBoardRef | UnresolvedBoardRef;
  readonly deck?: ResolvedDeckRef | UnresolvedDeckRef;
  readonly layer?: ResolvedLayerRef | UnresolvedLayerRef;
  readonly section?: ResolvedSectionRef | UnresolvedSectionRef;
  readonly range?: ResolvedRangeRef | UnresolvedRangeRef;
  readonly events?: ResolvedEventRef | UnresolvedEventRef;
  readonly card?: ResolvedCardRef | UnresolvedCardRef;
  readonly param?: ResolvedParamRef | UnresolvedParamRef;
}

/**
 * A fully resolved scope — all references bound to project entities.
 */
export interface ResolvedEntityScope {
  readonly board?: ResolvedBoardRef;
  readonly deck?: ResolvedDeckRef;
  readonly layer?: ResolvedLayerRef;
  readonly section?: ResolvedSectionRef;
  readonly range?: ResolvedRangeRef;
  readonly events?: ResolvedEventRef;
  readonly card?: ResolvedCardRef;
  readonly param?: ResolvedParamRef;
}

/**
 * Check if a scope is fully resolved.
 */
export function isScopeResolved(
  scope: EntityScope
): scope is ResolvedEntityScope {
  const checkResolved = (ref: { entityType: string } | undefined): boolean => {
    if (!ref) return true; // absent is OK
    return 'id' in ref; // resolved refs always have an id field
  };

  return (
    checkResolved(scope.board) &&
    checkResolved(scope.deck) &&
    checkResolved(scope.layer) &&
    checkResolved(scope.section) &&
    checkResolved(scope.range) &&
    checkResolved(scope.events) &&
    checkResolved(scope.card) &&
    checkResolved(scope.param)
  );
}

/**
 * Get the most specific entity in a scope.
 */
export function getMostSpecificRef(
  scope: ResolvedEntityScope
): ResolvedEntityRef | undefined {
  // Return in order of specificity (most specific first)
  if (scope.param) return scope.param;
  if (scope.events) return scope.events;
  if (scope.card) return scope.card;
  if (scope.range) return scope.range;
  if (scope.section) return scope.section;
  if (scope.layer) return scope.layer;
  if (scope.deck) return scope.deck;
  if (scope.board) return scope.board;
  return undefined;
}

/**
 * Get the entity type hierarchy depth for ordering.
 */
export function getEntityTypeDepth(entityType: EntityType): number {
  const depths: Record<EntityType, number> = {
    board: 0,
    deck: 1,
    layer: 2,
    track: 2,
    section: 3,
    range: 3,
    card: 4,
    event: 5,
    param: 6,
    axis: 6,
  };
  return depths[entityType];
}

// =============================================================================
// DISPLAY NAME FORMATTING
// =============================================================================

/**
 * Format an entity reference for display in the UI.
 *
 * Returns human-readable strings like:
 *   - "Chorus 2 (bars 49–65)"
 *   - "Drums layer"
 *   - "Piano card on Drums deck"
 *   - "Reverb decay parameter"
 */
export function formatEntityRefDisplay(ref: ResolvedEntityRef): string {
  return ref.displayName;
}

/**
 * Format a scope for display, showing the full path.
 *
 * Returns strings like:
 *   - "Main Board → Drums → Chorus 2"
 *   - "Bass layer (bars 33–40)"
 */
export function formatScopeDisplay(scope: ResolvedEntityScope): string {
  const parts: string[] = [];

  if (scope.board) parts.push(scope.board.displayName);
  if (scope.deck) parts.push(scope.deck.displayName);
  if (scope.layer) parts.push(scope.layer.displayName);
  if (scope.section) parts.push(scope.section.displayName);
  if (scope.range) parts.push(scope.range.displayName);
  if (scope.card) parts.push(scope.card.displayName);
  if (scope.param) parts.push(scope.param.displayName);

  if (parts.length === 0) return 'Global scope';
  return parts.join(' → ');
}

/**
 * Format a binding explanation for the UI.
 *
 * Returns strings like:
 *   - "'that chorus' → Chorus 2 (bars 49–65)"
 *   - "'the drums' → Drums layer"
 */
export function formatBindingExplanation(
  rawText: string,
  resolved: ResolvedEntityRef
): string {
  return `'${rawText}' → ${resolved.displayName}`;
}

// =============================================================================
// ENTITY REF REGISTRY
// =============================================================================

/**
 * Entity type metadata for the reference system.
 */
export interface EntityTypeMetadata {
  readonly entityType: EntityType;
  readonly displayName: string;
  readonly pluralName: string;
  readonly idPrefix: string;
  readonly canBeScoped: boolean;
  readonly canContainOthers: boolean;
  readonly containedBy: readonly EntityType[];
  readonly defaultArticle: 'the' | 'a';
  readonly supportsOrdinals: boolean;
  readonly supportsRelativePosition: boolean;
  readonly naturalLanguagePatterns: readonly string[];
}

/**
 * Registry of all entity type metadata.
 */
export const ENTITY_TYPE_REGISTRY: readonly EntityTypeMetadata[] = [
  {
    entityType: 'board',
    displayName: 'Board',
    pluralName: 'Boards',
    idPrefix: 'boardref',
    canBeScoped: true,
    canContainOthers: true,
    containedBy: [],
    defaultArticle: 'the',
    supportsOrdinals: false,
    supportsRelativePosition: false,
    naturalLanguagePatterns: [
      'the board',
      'this board',
      'the main board',
      'the arrangement',
      'the project',
    ],
  },
  {
    entityType: 'deck',
    displayName: 'Deck',
    pluralName: 'Decks',
    idPrefix: 'deckref',
    canBeScoped: true,
    canContainOthers: true,
    containedBy: ['board'],
    defaultArticle: 'the',
    supportsOrdinals: true,
    supportsRelativePosition: false,
    naturalLanguagePatterns: [
      'the {layer} deck',
      'the main deck',
      '{layer} channel',
      'the {layer} strip',
      'channel {ordinal}',
    ],
  },
  {
    entityType: 'layer',
    displayName: 'Layer',
    pluralName: 'Layers',
    idPrefix: 'layerref',
    canBeScoped: true,
    canContainOthers: true,
    containedBy: ['board', 'deck'],
    defaultArticle: 'the',
    supportsOrdinals: true,
    supportsRelativePosition: false,
    naturalLanguagePatterns: [
      'the {type}',
      'the {type} layer',
      'the {type} track',
      'on the {type}',
      'on {type}',
      'the {ordinal} {type}',
      'all the {type}s',
    ],
  },
  {
    entityType: 'track',
    displayName: 'Track',
    pluralName: 'Tracks',
    idPrefix: 'trackref',
    canBeScoped: true,
    canContainOthers: true,
    containedBy: ['board', 'deck'],
    defaultArticle: 'the',
    supportsOrdinals: true,
    supportsRelativePosition: false,
    naturalLanguagePatterns: [
      'the {type} track',
      'track {ordinal}',
      'the {ordinal} track',
    ],
  },
  {
    entityType: 'section',
    displayName: 'Section',
    pluralName: 'Sections',
    idPrefix: 'secref',
    canBeScoped: true,
    canContainOthers: false,
    containedBy: ['board'],
    defaultArticle: 'the',
    supportsOrdinals: true,
    supportsRelativePosition: true,
    naturalLanguagePatterns: [
      'the {type}',
      'the {ordinal} {type}',
      'the last {type}',
      'the first {type}',
      'in the {type}',
      '{type} {ordinal}',
      'this section',
      'that section',
      'the next {type}',
      'the previous {type}',
    ],
  },
  {
    entityType: 'range',
    displayName: 'Range',
    pluralName: 'Ranges',
    idPrefix: 'rangeref',
    canBeScoped: true,
    canContainOthers: false,
    containedBy: ['board', 'section'],
    defaultArticle: 'the',
    supportsOrdinals: false,
    supportsRelativePosition: true,
    naturalLanguagePatterns: [
      'bars {start} to {end}',
      'bar {number}',
      'the first {count} bars',
      'the last {count} bars',
      'from bar {start}',
      'until bar {end}',
      '{count} bars before the {section}',
      '{count} bars after the {section}',
      'from here to the end',
      'the next {count} bars',
    ],
  },
  {
    entityType: 'card',
    displayName: 'Card',
    pluralName: 'Cards',
    idPrefix: 'cardref',
    canBeScoped: false,
    canContainOthers: false,
    containedBy: ['deck'],
    defaultArticle: 'the',
    supportsOrdinals: true,
    supportsRelativePosition: false,
    naturalLanguagePatterns: [
      'the {name}',
      'the {name} card',
      'the {name} on the {layer}',
      'the {effect} effect',
      'the {instrument} instrument',
      'that card',
      'this card',
    ],
  },
  {
    entityType: 'param',
    displayName: 'Parameter',
    pluralName: 'Parameters',
    idPrefix: 'paramref',
    canBeScoped: false,
    canContainOthers: false,
    containedBy: ['card'],
    defaultArticle: 'the',
    supportsOrdinals: false,
    supportsRelativePosition: false,
    naturalLanguagePatterns: [
      'the {name}',
      'the {name} parameter',
      'the {name} on the {card}',
      'the {name} setting',
      'the {name} value',
      'the {name} knob',
      '{name} level',
    ],
  },
  {
    entityType: 'event',
    displayName: 'Event',
    pluralName: 'Events',
    idPrefix: 'eventref',
    canBeScoped: false,
    canContainOthers: false,
    containedBy: ['layer', 'section', 'range'],
    defaultArticle: 'the',
    supportsOrdinals: true,
    supportsRelativePosition: true,
    naturalLanguagePatterns: [
      'the {kind}',
      'the {kind}s',
      'the last {kind}',
      'the first {kind}',
      'every {kind}',
      'the {pattern}',
      'the {pitch} notes',
      'all {kind}s',
      'the selected {kind}s',
      'these {kind}s',
      'those {kind}s',
    ],
  },
  {
    entityType: 'axis',
    displayName: 'Axis',
    pluralName: 'Axes',
    idPrefix: 'axis',
    canBeScoped: false,
    canContainOthers: false,
    containedBy: [],
    defaultArticle: 'the',
    supportsOrdinals: false,
    supportsRelativePosition: false,
    naturalLanguagePatterns: [
      'the {name}',
      '{name} level',
      '{name}',
    ],
  },
];

/**
 * Look up entity type metadata.
 */
export function getEntityTypeMetadata(
  entityType: EntityType
): EntityTypeMetadata | undefined {
  return ENTITY_TYPE_REGISTRY.find(m => m.entityType === entityType);
}

/**
 * Get all entity types that can contain a given type.
 */
export function getContainerTypes(entityType: EntityType): readonly EntityType[] {
  const metadata = getEntityTypeMetadata(entityType);
  return metadata ? metadata.containedBy : [];
}

/**
 * Check if one entity type can contain another.
 */
export function canContain(
  containerType: EntityType,
  containedType: EntityType
): boolean {
  const metadata = getEntityTypeMetadata(containedType);
  return metadata ? metadata.containedBy.includes(containerType) : false;
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

/**
 * Rules governing entity reference resolution.
 */
export interface EntityRefRule {
  readonly id: string;
  readonly description: string;
  readonly category: 'resolution' | 'validation' | 'display' | 'scoping';
  readonly rule: string;
}

/**
 * Canonical rules for entity reference resolution and handling.
 */
export const ENTITY_REF_RULES: readonly EntityRefRule[] = [
  {
    id: 'eref-001',
    description: 'Entity reference resolution precedence',
    category: 'resolution',
    rule: 'Resolution follows strict precedence: exact_id > exact_name > deictic > anaphoric > salience > fuzzy_name > default. No step may be skipped.',
  },
  {
    id: 'eref-002',
    description: 'Deictic references require UI selection',
    category: 'resolution',
    rule: 'References like "this", "here", "these" MUST have an active, non-stale UI selection. If no selection exists, resolution MUST fail with reason "no_selection", never silently default.',
  },
  {
    id: 'eref-003',
    description: 'Ambiguity triggers clarification',
    category: 'resolution',
    rule: 'When multiple candidates have confidence scores within 0.15 of each other, resolution MUST return "ambiguous" status with a clarification question. Never auto-pick among near-equal candidates.',
  },
  {
    id: 'eref-004',
    description: 'Scope hierarchy must be respected',
    category: 'scoping',
    rule: 'Entity references are resolved within their containing scope. A card reference on "the drums" means a card within the drums deck, not a card named "drums" elsewhere.',
  },
  {
    id: 'eref-005',
    description: 'Branded IDs are opaque',
    category: 'validation',
    rule: 'Branded IDs (SectionRefId, LayerRefId, etc.) must never be parsed by downstream code. Only the designated parse functions may decompose them. All other code treats them as opaque strings.',
  },
  {
    id: 'eref-006',
    description: 'Display names include context',
    category: 'display',
    rule: 'Entity display names must include enough context to disambiguate within the current scope. "Chorus 2 (bars 49–65)" not just "Chorus". "Reverb on Drums" not just "Reverb".',
  },
  {
    id: 'eref-007',
    description: 'Resolution method is always recorded',
    category: 'resolution',
    rule: 'Every successful resolution MUST record the method used (exact_id, fuzzy_name, deictic, etc.) for provenance and debugging. This is part of the determinism guarantee.',
  },
  {
    id: 'eref-008',
    description: 'Failed resolution suggests alternatives',
    category: 'resolution',
    rule: 'When resolution fails, the result MUST include near-matches (if any) and a human-readable suggestion. "Did you mean Chorus 2?" not "Reference not found".',
  },
  {
    id: 'eref-009',
    description: 'Ordinal references are 1-based for users',
    category: 'resolution',
    rule: '"The second verse" means the verse with instanceNumber=2 (the second one encountered in the arrangement). "Verse 1" means instanceNumber=1. Internal arrays may be 0-indexed but user-facing ordinals are always 1-based.',
  },
  {
    id: 'eref-010',
    description: 'Relative positions depend on current context',
    category: 'resolution',
    rule: '"The next chorus" means the next chorus after the current playback position or current selection. "The last verse" means the verse closest to the end of the arrangement. These require temporal or positional context.',
  },
  {
    id: 'eref-011',
    description: 'Layer and track are synonyms',
    category: 'resolution',
    rule: '"Layer" and "track" are treated as synonyms during resolution. A LayerRefId and TrackRefId for the same entity must resolve identically. The canonical internal type is "layer" but "track" is accepted.',
  },
  {
    id: 'eref-012',
    description: 'Event references are lazy',
    category: 'resolution',
    rule: 'Event references (EventRefId) describe a selection predicate, not a materialized set. The actual events are only enumerated when the plan is executed, not during parsing or semantic analysis.',
  },
];
