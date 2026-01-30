/**
 * GOFAI Canon — Canonical Time Vocabulary
 *
 * Defines the SSOT vocabulary for all temporal expressions in the
 * GOFAI Music+ compilation pipeline. This includes:
 *
 *   - Absolute time units (bars, beats, ticks, seconds, minutes)
 *   - Relative time phrases ("two bars before", "the next beat")
 *   - Timepoint references ("at bar 49", "on beat 3")
 *   - Duration expressions ("for 4 bars", "lasting 2 beats")
 *   - Tempo-relative expressions ("at double speed", "half time")
 *   - Musical time divisions (whole, half, quarter, eighth, etc.)
 *   - Grid/quantization vocabulary ("snap to grid", "on the grid")
 *
 * Every temporal expression in natural language maps through this
 * vocabulary to a typed `TimeExpression` that the planner can use.
 *
 * @module gofai/canon/time-vocabulary
 * @see gofai_goalA.md Step 060
 * @see gofaimusicplus.md §3.3 — Scope is first-class and typed
 */

import type { UnitId } from './types';
import { createUnitId } from './types';

// =============================================================================
// TIME UNIT TYPES
// =============================================================================

/**
 * Categories of time units.
 */
export type TimeUnitCategory =
  | 'musical'     // Bars, beats, note values
  | 'absolute'    // Seconds, milliseconds, minutes
  | 'grid'        // Grid-based (quantized positions)
  | 'tempo'       // Tempo-relative (BPM fractions)
  | 'relative';   // Relative to current position

/**
 * A canonical time unit entry in the vocabulary.
 */
export interface TimeUnitEntry {
  readonly id: UnitId;
  readonly name: string;
  readonly category: TimeUnitCategory;
  readonly pluralName: string;
  readonly abbreviations: readonly string[];
  readonly synonyms: readonly string[];
  readonly beatsEquivalent?: number;
  readonly secondsEquivalent?: number;
  readonly description: string;
  readonly examples: readonly string[];
}

// =============================================================================
// CANONICAL TIME UNITS TABLE
// =============================================================================

/**
 * All canonical time units.
 */
export const TIME_UNITS: readonly TimeUnitEntry[] = [
  // ===== Musical Units =====
  {
    id: createUnitId('bar'),
    name: 'bar',
    category: 'musical',
    pluralName: 'bars',
    abbreviations: ['b', 'br'],
    synonyms: ['measure', 'measures', 'bar', 'bars'],
    beatsEquivalent: 4,  // default 4/4
    description: 'A bar (measure) — the fundamental grouping unit',
    examples: ['4 bars', 'one bar', 'half a bar', 'bars 1 to 8'],
  },
  {
    id: createUnitId('beat'),
    name: 'beat',
    category: 'musical',
    pluralName: 'beats',
    abbreviations: ['bt'],
    synonyms: ['beat', 'beats', 'pulse', 'pulses'],
    beatsEquivalent: 1,
    description: 'A single beat — the fundamental pulse unit',
    examples: ['on beat 3', '2 beats', 'every beat', 'the first beat'],
  },
  {
    id: createUnitId('half_beat'),
    name: 'half beat',
    category: 'musical',
    pluralName: 'half beats',
    abbreviations: [],
    synonyms: ['half beat', 'half-beat', 'and', 'offbeat'],
    beatsEquivalent: 0.5,
    description: 'Half a beat — eighth note subdivision in 4/4',
    examples: ['on the and of beat 2', 'half a beat early'],
  },
  {
    id: createUnitId('tick'),
    name: 'tick',
    category: 'musical',
    pluralName: 'ticks',
    abbreviations: ['t', 'tk'],
    synonyms: ['tick', 'ticks', 'PPQN tick'],
    description: 'A MIDI tick — finest resolution unit (480 PPQ typical)',
    examples: ['move 10 ticks earlier', '480 ticks per beat'],
  },
  {
    id: createUnitId('whole_note'),
    name: 'whole note',
    category: 'musical',
    pluralName: 'whole notes',
    abbreviations: ['1n'],
    synonyms: ['whole note', 'semibreve'],
    beatsEquivalent: 4,
    description: 'Whole note — 4 beats in 4/4',
    examples: ['a whole note', 'for one whole note'],
  },
  {
    id: createUnitId('half_note'),
    name: 'half note',
    category: 'musical',
    pluralName: 'half notes',
    abbreviations: ['2n'],
    synonyms: ['half note', 'minim'],
    beatsEquivalent: 2,
    description: 'Half note — 2 beats in 4/4',
    examples: ['a half note', 'for two half notes'],
  },
  {
    id: createUnitId('quarter_note'),
    name: 'quarter note',
    category: 'musical',
    pluralName: 'quarter notes',
    abbreviations: ['4n', 'qn'],
    synonyms: ['quarter note', 'crotchet'],
    beatsEquivalent: 1,
    description: 'Quarter note — 1 beat in 4/4',
    examples: ['a quarter note', 'quarter note value'],
  },
  {
    id: createUnitId('eighth_note'),
    name: 'eighth note',
    category: 'musical',
    pluralName: 'eighth notes',
    abbreviations: ['8n'],
    synonyms: ['eighth note', 'eighth', 'quaver'],
    beatsEquivalent: 0.5,
    description: 'Eighth note — half a beat in 4/4',
    examples: ['eighth notes', 'in eighths'],
  },
  {
    id: createUnitId('sixteenth_note'),
    name: 'sixteenth note',
    category: 'musical',
    pluralName: 'sixteenth notes',
    abbreviations: ['16n'],
    synonyms: ['sixteenth note', 'sixteenth', 'semiquaver'],
    beatsEquivalent: 0.25,
    description: 'Sixteenth note — quarter of a beat in 4/4',
    examples: ['sixteenth notes', 'in sixteenths'],
  },
  {
    id: createUnitId('thirty_second_note'),
    name: 'thirty-second note',
    category: 'musical',
    pluralName: 'thirty-second notes',
    abbreviations: ['32n'],
    synonyms: ['thirty-second note', 'thirty-second', 'demisemiquaver', '32nd note', '32nd'],
    beatsEquivalent: 0.125,
    description: 'Thirty-second note — 1/8 of a beat',
    examples: ['thirty-second notes', 'in thirty-seconds'],
  },
  {
    id: createUnitId('dotted_quarter'),
    name: 'dotted quarter note',
    category: 'musical',
    pluralName: 'dotted quarter notes',
    abbreviations: ['4n.'],
    synonyms: ['dotted quarter', 'dotted quarter note', 'dotted crotchet'],
    beatsEquivalent: 1.5,
    description: 'Dotted quarter note — 1.5 beats',
    examples: ['a dotted quarter', 'dotted quarter note length'],
  },
  {
    id: createUnitId('dotted_eighth'),
    name: 'dotted eighth note',
    category: 'musical',
    pluralName: 'dotted eighth notes',
    abbreviations: ['8n.'],
    synonyms: ['dotted eighth', 'dotted eighth note', 'dotted quaver'],
    beatsEquivalent: 0.75,
    description: 'Dotted eighth note — 3/4 of a beat',
    examples: ['dotted eighth', 'dotted eighth value'],
  },
  {
    id: createUnitId('dotted_half'),
    name: 'dotted half note',
    category: 'musical',
    pluralName: 'dotted half notes',
    abbreviations: ['2n.'],
    synonyms: ['dotted half', 'dotted half note', 'dotted minim'],
    beatsEquivalent: 3,
    description: 'Dotted half note — 3 beats',
    examples: ['a dotted half', 'dotted half note duration'],
  },
  {
    id: createUnitId('triplet_quarter'),
    name: 'triplet quarter note',
    category: 'musical',
    pluralName: 'triplet quarter notes',
    abbreviations: ['4nt'],
    synonyms: ['triplet quarter', 'quarter note triplet'],
    beatsEquivalent: 2 / 3,
    description: 'Triplet quarter note — 2/3 of a beat',
    examples: ['quarter note triplets', 'triplet quarters'],
  },
  {
    id: createUnitId('triplet_eighth'),
    name: 'triplet eighth note',
    category: 'musical',
    pluralName: 'triplet eighth notes',
    abbreviations: ['8nt'],
    synonyms: ['triplet eighth', 'eighth note triplet', 'triplet'],
    beatsEquivalent: 1 / 3,
    description: 'Triplet eighth note — 1/3 of a beat',
    examples: ['eighth note triplets', 'triplets'],
  },

  // ===== Absolute Units =====
  {
    id: createUnitId('second'),
    name: 'second',
    category: 'absolute',
    pluralName: 'seconds',
    abbreviations: ['s', 'sec'],
    synonyms: ['second', 'seconds'],
    secondsEquivalent: 1,
    description: 'One second of real time',
    examples: ['3 seconds', 'a second later', 'for 10 seconds'],
  },
  {
    id: createUnitId('millisecond'),
    name: 'millisecond',
    category: 'absolute',
    pluralName: 'milliseconds',
    abbreviations: ['ms'],
    synonyms: ['millisecond', 'milliseconds', 'ms'],
    secondsEquivalent: 0.001,
    description: 'One millisecond of real time',
    examples: ['200ms', '50 milliseconds'],
  },
  {
    id: createUnitId('minute'),
    name: 'minute',
    category: 'absolute',
    pluralName: 'minutes',
    abbreviations: ['min'],
    synonyms: ['minute', 'minutes'],
    secondsEquivalent: 60,
    description: 'One minute of real time',
    examples: ['2 minutes in', 'at 1:30'],
  },

  // ===== Grid Units =====
  {
    id: createUnitId('grid'),
    name: 'grid position',
    category: 'grid',
    pluralName: 'grid positions',
    abbreviations: [],
    synonyms: ['grid', 'grid position', 'grid line', 'grid point', 'on the grid'],
    description: 'A quantized grid position (resolution depends on current grid setting)',
    examples: ['snap to grid', 'on the grid', 'next grid line'],
  },
  {
    id: createUnitId('grid_division'),
    name: 'grid division',
    category: 'grid',
    pluralName: 'grid divisions',
    abbreviations: [],
    synonyms: ['grid division', 'subdivision'],
    description: 'One division of the current grid resolution',
    examples: ['one grid division', 'two subdivisions'],
  },
];

// =============================================================================
// TIME EXPRESSION TYPES
// =============================================================================

/**
 * A typed time expression — the result of parsing a temporal NL phrase.
 *
 * This is the intermediate representation between raw NL and the
 * concrete tick values used by the planner.
 */
export type TimeExpression =
  | AbsoluteTimepoint
  | RelativeTimeOffset
  | TimeRange
  | TimeDuration
  | TempoRelativeTime
  | MusicalPosition
  | NamedTimepoint
  | ConditionalTime;

/**
 * An absolute time position.
 *
 * NL examples:
 *   - "at bar 49" → { type: 'absolute', bar: 49 }
 *   - "at bar 3, beat 2" → { type: 'absolute', bar: 3, beat: 2 }
 *   - "at 1:30" → { type: 'absolute', seconds: 90 }
 */
export interface AbsoluteTimepoint {
  readonly type: 'absolute';
  readonly bar?: number;
  readonly beat?: number;
  readonly tick?: number;
  readonly seconds?: number;
}

/**
 * A relative time offset from a reference point.
 *
 * NL examples:
 *   - "two bars before the chorus" → { type: 'relative', offset: -2, unit: 'bar', anchor: ... }
 *   - "one beat after" → { type: 'relative', offset: 1, unit: 'beat' }
 *   - "3 bars later" → { type: 'relative', offset: 3, unit: 'bar' }
 */
export interface RelativeTimeOffset {
  readonly type: 'relative';
  readonly offset: number;
  readonly unit: TimeUnitName;
  readonly anchor?: TimeAnchor;
  readonly direction?: 'before' | 'after';
}

/**
 * A time range with start and end.
 *
 * NL examples:
 *   - "from bar 1 to bar 8" → { type: 'range', start: ..., end: ... }
 *   - "bars 33 to 40" → { type: 'range', start: { bar: 33 }, end: { bar: 40 } }
 *   - "from the verse to the chorus" → { type: 'range', start: { section: 'verse' }, end: { section: 'chorus' } }
 */
export interface TimeRange {
  readonly type: 'range';
  readonly start: TimeExpression;
  readonly end: TimeExpression;
}

/**
 * A duration (length of time, not a position).
 *
 * NL examples:
 *   - "for 4 bars" → { type: 'duration', amount: 4, unit: 'bar' }
 *   - "lasting 2 beats" → { type: 'duration', amount: 2, unit: 'beat' }
 *   - "for a quarter note" → { type: 'duration', amount: 1, unit: 'quarter_note' }
 */
export interface TimeDuration {
  readonly type: 'duration';
  readonly amount: number;
  readonly unit: TimeUnitName;
}

/**
 * A tempo-relative time expression.
 *
 * NL examples:
 *   - "at double speed" → { type: 'tempo_relative', multiplier: 2 }
 *   - "half time" → { type: 'tempo_relative', multiplier: 0.5 }
 *   - "at 120 BPM" → { type: 'tempo_relative', absoluteBPM: 120 }
 */
export interface TempoRelativeTime {
  readonly type: 'tempo_relative';
  readonly multiplier?: number;
  readonly absoluteBPM?: number;
}

/**
 * A musical position within a bar.
 *
 * NL examples:
 *   - "on the downbeat" → { type: 'musical_position', position: 'downbeat' }
 *   - "on beat 3" → { type: 'musical_position', beat: 3 }
 *   - "on the and of 2" → { type: 'musical_position', beat: 2, subdivision: 'and' }
 */
export interface MusicalPosition {
  readonly type: 'musical_position';
  readonly position?: MusicalPositionName;
  readonly beat?: number;
  readonly subdivision?: BeatSubdivisionName;
}

/**
 * A named timepoint (section boundary, marker, etc.).
 *
 * NL examples:
 *   - "the start of the chorus" → { type: 'named', name: 'chorus', edge: 'start' }
 *   - "the end of the song" → { type: 'named', name: 'song', edge: 'end' }
 *   - "the beginning" → { type: 'named', name: 'song', edge: 'start' }
 */
export interface NamedTimepoint {
  readonly type: 'named';
  readonly name: string;
  readonly edge?: 'start' | 'end' | 'middle';
}

/**
 * A conditional time expression (depends on musical content).
 *
 * NL examples:
 *   - "when the drums come in" → { type: 'conditional', condition: 'instrument_entry', target: 'drums' }
 *   - "where the melody peaks" → { type: 'conditional', condition: 'peak', target: 'melody' }
 */
export interface ConditionalTime {
  readonly type: 'conditional';
  readonly condition: TimeCondition;
  readonly target?: string;
}

// =============================================================================
// SUPPORTING TYPES
// =============================================================================

/**
 * Named time units for parsing.
 */
export type TimeUnitName =
  | 'bar' | 'beat' | 'tick'
  | 'whole_note' | 'half_note' | 'quarter_note' | 'eighth_note' | 'sixteenth_note'
  | 'thirty_second_note'
  | 'dotted_half' | 'dotted_quarter' | 'dotted_eighth'
  | 'triplet_quarter' | 'triplet_eighth'
  | 'second' | 'millisecond' | 'minute'
  | 'grid' | 'grid_division';

/**
 * Time anchors for relative expressions.
 */
export type TimeAnchor =
  | { readonly type: 'section'; readonly sectionName: string }
  | { readonly type: 'timepoint'; readonly bar: number; readonly beat?: number }
  | { readonly type: 'current'; }
  | { readonly type: 'start'; }
  | { readonly type: 'end'; }
  | { readonly type: 'marker'; readonly markerName: string };

/**
 * Named musical positions within a bar.
 */
export type MusicalPositionName =
  | 'downbeat'       // Beat 1
  | 'upbeat'         // Last beat before downbeat (pickup)
  | 'backbeat'       // Beats 2 and 4 in 4/4
  | 'offbeat'        // Between beats (the "and")
  | 'anacrusis'      // Pickup note(s) before downbeat
  | 'syncopation';   // Displaced accent position

/**
 * Beat subdivision names.
 */
export type BeatSubdivisionName =
  | 'and'            // Second eighth of the beat
  | 'e'              // First sixteenth after the beat
  | 'a'              // Third sixteenth (last before next beat)
  | 'trip'           // First triplet subdivision
  | 'let'            // Second triplet subdivision
  | 'ta'             // Third triplet subdivision (same as next beat in triplet feel)
  | 'push';          // Just before the beat (anticipation)

/**
 * Conditions for conditional time expressions.
 */
export type TimeCondition =
  | 'instrument_entry'   // When an instrument first enters
  | 'instrument_exit'    // When an instrument drops out
  | 'peak'               // Where musical intensity peaks
  | 'trough'             // Where musical intensity is lowest
  | 'chord_change'       // At a chord change
  | 'key_change'         // At a key change
  | 'tempo_change'       // At a tempo change
  | 'section_boundary'   // At a section boundary
  | 'dynamic_change'     // At a dynamic marking change
  | 'pattern_start'      // Where a repeating pattern begins
  | 'pattern_end';       // Where a repeating pattern ends

// =============================================================================
// RELATIVE TIME PHRASES TABLE
// =============================================================================

/**
 * A canonical relative time phrase.
 */
export interface RelativeTimePhrase {
  readonly id: string;
  readonly patterns: readonly string[];
  readonly meaning: string;
  readonly expression: RelativeTimeOffset | TimeDuration;
  readonly examples: readonly string[];
}

/**
 * Canonical relative time phrases.
 *
 * These define how common temporal NL phrases map to typed expressions.
 */
export const RELATIVE_TIME_PHRASES: readonly RelativeTimePhrase[] = [
  {
    id: 'rtp-001',
    patterns: ['{n} bars before', '{n} bars ahead of', '{n} measures before'],
    meaning: 'N bars before a reference point',
    expression: { type: 'relative', offset: -1, unit: 'bar', direction: 'before' },
    examples: ['two bars before the chorus', '4 bars before the drop'],
  },
  {
    id: 'rtp-002',
    patterns: ['{n} bars after', '{n} bars past', '{n} measures after'],
    meaning: 'N bars after a reference point',
    expression: { type: 'relative', offset: 1, unit: 'bar', direction: 'after' },
    examples: ['3 bars after the intro', 'one bar after the fill'],
  },
  {
    id: 'rtp-003',
    patterns: ['{n} beats before', '{n} beats ahead of'],
    meaning: 'N beats before a reference point',
    expression: { type: 'relative', offset: -1, unit: 'beat', direction: 'before' },
    examples: ['two beats before the downbeat', 'one beat before bar 5'],
  },
  {
    id: 'rtp-004',
    patterns: ['{n} beats after', '{n} beats past', '{n} beats later'],
    meaning: 'N beats after a reference point',
    expression: { type: 'relative', offset: 1, unit: 'beat', direction: 'after' },
    examples: ['2 beats after beat 1', 'one beat later'],
  },
  {
    id: 'rtp-005',
    patterns: ['right before', 'just before', 'immediately before'],
    meaning: 'Immediately before a reference point (1 beat)',
    expression: { type: 'relative', offset: -1, unit: 'beat', direction: 'before' },
    examples: ['right before the chorus', 'just before the drop'],
  },
  {
    id: 'rtp-006',
    patterns: ['right after', 'just after', 'immediately after'],
    meaning: 'Immediately after a reference point (1 beat)',
    expression: { type: 'relative', offset: 1, unit: 'beat', direction: 'after' },
    examples: ['right after the intro', 'just after beat 1'],
  },
  {
    id: 'rtp-007',
    patterns: ['at the start of', 'at the beginning of', 'from the top of'],
    meaning: 'The start edge of a section',
    expression: { type: 'relative', offset: 0, unit: 'beat', direction: 'after' },
    examples: ['at the start of the chorus', 'at the beginning of verse 2'],
  },
  {
    id: 'rtp-008',
    patterns: ['at the end of', 'at the tail of'],
    meaning: 'The end edge of a section',
    expression: { type: 'relative', offset: 0, unit: 'beat', direction: 'before' },
    examples: ['at the end of the verse', 'at the end of bar 8'],
  },
  {
    id: 'rtp-009',
    patterns: ['in the middle of', 'halfway through', 'midway through'],
    meaning: 'The midpoint of a section',
    expression: { type: 'relative', offset: 0, unit: 'bar' },
    examples: ['in the middle of the chorus', 'halfway through the bridge'],
  },
  {
    id: 'rtp-010',
    patterns: ['from here', 'starting here', 'from this point'],
    meaning: 'From the current position/selection',
    expression: { type: 'relative', offset: 0, unit: 'beat', anchor: { type: 'current' } },
    examples: ['from here to the end', 'starting here'],
  },
  {
    id: 'rtp-011',
    patterns: ['from the beginning', 'from the start', 'from the top', 'from bar 1'],
    meaning: 'From the very beginning of the project',
    expression: { type: 'relative', offset: 0, unit: 'beat', anchor: { type: 'start' } },
    examples: ['from the beginning', 'from the top'],
  },
  {
    id: 'rtp-012',
    patterns: ['to the end', 'until the end', 'through the end'],
    meaning: 'Until the end of the project',
    expression: { type: 'relative', offset: 0, unit: 'beat', anchor: { type: 'end' } },
    examples: ['from here to the end', 'until the end'],
  },
  {
    id: 'rtp-013',
    patterns: ['for {n} bars', 'over {n} bars', 'across {n} bars', 'spanning {n} bars'],
    meaning: 'Duration of N bars',
    expression: { type: 'duration', amount: 1, unit: 'bar' },
    examples: ['for 4 bars', 'over 8 bars', 'spanning 16 bars'],
  },
  {
    id: 'rtp-014',
    patterns: ['for {n} beats', 'over {n} beats', 'lasting {n} beats'],
    meaning: 'Duration of N beats',
    expression: { type: 'duration', amount: 1, unit: 'beat' },
    examples: ['for 2 beats', 'lasting 8 beats'],
  },
  {
    id: 'rtp-015',
    patterns: ['the next {n} bars', 'the following {n} bars'],
    meaning: 'N bars starting from current position',
    expression: { type: 'relative', offset: 0, unit: 'bar', anchor: { type: 'current' }, direction: 'after' },
    examples: ['the next 4 bars', 'the following 2 bars'],
  },
  {
    id: 'rtp-016',
    patterns: ['the previous {n} bars', 'the last {n} bars', 'the prior {n} bars'],
    meaning: 'N bars before current position',
    expression: { type: 'relative', offset: 0, unit: 'bar', anchor: { type: 'current' }, direction: 'before' },
    examples: ['the previous 4 bars', 'the last 2 bars'],
  },
  {
    id: 'rtp-017',
    patterns: ['the first {n} bars', 'the opening {n} bars'],
    meaning: 'N bars from the beginning',
    expression: { type: 'relative', offset: 0, unit: 'bar', anchor: { type: 'start' }, direction: 'after' },
    examples: ['the first 8 bars', 'the opening 4 bars'],
  },
  {
    id: 'rtp-018',
    patterns: ['the final {n} bars', 'the closing {n} bars', 'the ending {n} bars'],
    meaning: 'N bars at the end',
    expression: { type: 'relative', offset: 0, unit: 'bar', anchor: { type: 'end' }, direction: 'before' },
    examples: ['the final 4 bars', 'the closing 2 bars'],
  },
];

// =============================================================================
// TIMEPOINT REFERENCE PATTERNS
// =============================================================================

/**
 * A canonical timepoint reference pattern.
 */
export interface TimepointPattern {
  readonly id: string;
  readonly pattern: string;
  readonly description: string;
  readonly expressionType: TimeExpression['type'];
  readonly examples: readonly string[];
}

/**
 * Canonical timepoint reference patterns.
 */
export const TIMEPOINT_PATTERNS: readonly TimepointPattern[] = [
  {
    id: 'tp-001',
    pattern: 'at bar {n}',
    description: 'Absolute bar reference',
    expressionType: 'absolute',
    examples: ['at bar 49', 'at bar 1', 'at bar 33'],
  },
  {
    id: 'tp-002',
    pattern: 'at bar {n}, beat {m}',
    description: 'Absolute bar+beat reference',
    expressionType: 'absolute',
    examples: ['at bar 3, beat 2', 'at bar 49, beat 1'],
  },
  {
    id: 'tp-003',
    pattern: 'on beat {n}',
    description: 'Beat within current context',
    expressionType: 'musical_position',
    examples: ['on beat 3', 'on beat 1', 'on beat 4'],
  },
  {
    id: 'tp-004',
    pattern: 'on the downbeat',
    description: 'First beat of the bar',
    expressionType: 'musical_position',
    examples: ['on the downbeat', 'on the downbeat of each bar'],
  },
  {
    id: 'tp-005',
    pattern: 'on the backbeat',
    description: 'Beats 2 and 4 in 4/4',
    expressionType: 'musical_position',
    examples: ['on the backbeat', 'accent the backbeat'],
  },
  {
    id: 'tp-006',
    pattern: 'on the upbeat',
    description: 'The "and" between beats',
    expressionType: 'musical_position',
    examples: ['on the upbeat', 'on the offbeat'],
  },
  {
    id: 'tp-007',
    pattern: 'on the and of {n}',
    description: 'Eighth note after beat N',
    expressionType: 'musical_position',
    examples: ['on the and of 2', 'on the and of beat 4'],
  },
  {
    id: 'tp-008',
    pattern: 'at {m}:{ss}',
    description: 'Absolute time in minutes:seconds',
    expressionType: 'absolute',
    examples: ['at 1:30', 'at 0:45', 'at 3:00'],
  },
  {
    id: 'tp-009',
    pattern: 'at {n} seconds',
    description: 'Absolute time in seconds',
    expressionType: 'absolute',
    examples: ['at 30 seconds', 'at 90 seconds'],
  },
  {
    id: 'tp-010',
    pattern: 'when the {instrument} comes in',
    description: 'Conditional: instrument entry',
    expressionType: 'conditional',
    examples: ['when the drums come in', 'when the bass enters'],
  },
  {
    id: 'tp-011',
    pattern: 'where the {part} peaks',
    description: 'Conditional: intensity peak',
    expressionType: 'conditional',
    examples: ['where the melody peaks', 'where the energy peaks'],
  },
  {
    id: 'tp-012',
    pattern: 'at the {section} boundary',
    description: 'At a section transition',
    expressionType: 'named',
    examples: ['at the verse-chorus boundary', 'at the section change'],
  },
];

// =============================================================================
// LOOKUP AND NORMALIZATION
// =============================================================================

/**
 * Look up a time unit by name, abbreviation, or synonym.
 */
export function lookupTimeUnit(query: string): TimeUnitEntry | undefined {
  const normalized = query.toLowerCase().trim();

  for (const unit of TIME_UNITS) {
    if (unit.name === normalized) return unit;
    if (unit.pluralName === normalized) return unit;
    if (unit.abbreviations.includes(normalized)) return unit;
    if (unit.synonyms.includes(normalized)) return unit;
  }

  return undefined;
}

/**
 * Normalize a time unit name to its canonical form.
 */
export function normalizeTimeUnit(query: string): string | undefined {
  const unit = lookupTimeUnit(query);
  return unit?.name;
}

/**
 * Get all time units in a given category.
 */
export function getTimeUnitsByCategory(category: TimeUnitCategory): readonly TimeUnitEntry[] {
  return TIME_UNITS.filter(u => u.category === category);
}

/**
 * Convert a duration from one unit to another (in beats).
 *
 * Both units must have `beatsEquivalent` defined.
 */
export function convertTimeUnits(
  amount: number,
  fromUnit: TimeUnitName,
  toUnit: TimeUnitName
): number | undefined {
  const from = lookupTimeUnit(fromUnit);
  const to = lookupTimeUnit(toUnit);

  if (!from?.beatsEquivalent || !to?.beatsEquivalent) return undefined;

  const totalBeats = amount * from.beatsEquivalent;
  return totalBeats / to.beatsEquivalent;
}

/**
 * Convert beats to bars (given a time signature).
 */
export function beatsToBar(beats: number, beatsPerBar: number): {
  readonly bar: number;
  readonly beat: number;
} {
  const bar = Math.floor(beats / beatsPerBar) + 1;
  const beat = (beats % beatsPerBar) + 1;
  return { bar, beat };
}

/**
 * Convert bars+beats to total beats.
 */
export function barToBeats(bar: number, beat: number, beatsPerBar: number): number {
  return (bar - 1) * beatsPerBar + (beat - 1);
}

/**
 * Get the duration in beats for a time expression.
 */
export function getDurationInBeats(
  duration: TimeDuration
): number | undefined {
  const unit = lookupTimeUnit(duration.unit);
  if (!unit?.beatsEquivalent) return undefined;
  return duration.amount * unit.beatsEquivalent;
}

// =============================================================================
// HUMAN-READABLE FORMATTING
// =============================================================================

/**
 * Format a time expression for display.
 */
export function formatTimeExpression(expr: TimeExpression): string {
  switch (expr.type) {
    case 'absolute':
      if (expr.bar !== undefined && expr.beat !== undefined) {
        return `bar ${expr.bar}, beat ${expr.beat}`;
      }
      if (expr.bar !== undefined) return `bar ${expr.bar}`;
      if (expr.seconds !== undefined) return formatSeconds(expr.seconds);
      return 'unknown position';

    case 'relative':
      if (expr.direction === 'before') {
        return `${Math.abs(expr.offset)} ${expr.unit}${Math.abs(expr.offset) !== 1 ? 's' : ''} before${expr.anchor ? ' ' + formatAnchor(expr.anchor) : ''}`;
      }
      if (expr.direction === 'after') {
        return `${expr.offset} ${expr.unit}${expr.offset !== 1 ? 's' : ''} after${expr.anchor ? ' ' + formatAnchor(expr.anchor) : ''}`;
      }
      return `${expr.offset} ${expr.unit}${Math.abs(expr.offset) !== 1 ? 's' : ''}`;

    case 'range':
      return `${formatTimeExpression(expr.start)} to ${formatTimeExpression(expr.end)}`;

    case 'duration':
      return `${expr.amount} ${expr.unit}${expr.amount !== 1 ? 's' : ''}`;

    case 'tempo_relative':
      if (expr.absoluteBPM !== undefined) return `at ${expr.absoluteBPM} BPM`;
      if (expr.multiplier !== undefined) {
        if (expr.multiplier === 2) return 'double time';
        if (expr.multiplier === 0.5) return 'half time';
        return `${expr.multiplier}× speed`;
      }
      return 'tempo change';

    case 'musical_position':
      if (expr.position) return `on the ${expr.position}`;
      if (expr.beat !== undefined) {
        if (expr.subdivision) return `on the ${expr.subdivision} of beat ${expr.beat}`;
        return `on beat ${expr.beat}`;
      }
      return 'at position';

    case 'named':
      if (expr.edge === 'start') return `start of ${expr.name}`;
      if (expr.edge === 'end') return `end of ${expr.name}`;
      return expr.name;

    case 'conditional':
      return `when ${expr.condition.replace(/_/g, ' ')}${expr.target ? ` (${expr.target})` : ''}`;
  }
}

/**
 * Format seconds as m:ss.
 */
function formatSeconds(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

/**
 * Format a time anchor for display.
 */
function formatAnchor(anchor: TimeAnchor): string {
  switch (anchor.type) {
    case 'section': return `the ${anchor.sectionName}`;
    case 'timepoint':
      if (anchor.beat !== undefined) return `bar ${anchor.bar}, beat ${anchor.beat}`;
      return `bar ${anchor.bar}`;
    case 'current': return 'here';
    case 'start': return 'the beginning';
    case 'end': return 'the end';
    case 'marker': return `"${anchor.markerName}"`;
  }
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

/**
 * Rules governing time vocabulary usage.
 */
export interface TimeVocabularyRule {
  readonly id: string;
  readonly description: string;
  readonly category: 'parsing' | 'normalization' | 'resolution' | 'display';
  readonly rule: string;
}

/**
 * Canonical rules for time vocabulary.
 */
export const TIME_VOCABULARY_RULES: readonly TimeVocabularyRule[] = [
  {
    id: 'time-001',
    description: 'Bar numbers are 1-based',
    category: 'normalization',
    rule: 'All bar references in natural language are 1-based. "Bar 1" is the first bar. Internal representations may use 0-based indexing, but all user-facing references are 1-based.',
  },
  {
    id: 'time-002',
    description: 'Beat numbers are 1-based within a bar',
    category: 'normalization',
    rule: '"Beat 1" is the downbeat. In 4/4, beats are 1, 2, 3, 4. "On beat 3" means the third beat of the bar.',
  },
  {
    id: 'time-003',
    description: 'Relative phrases require an anchor',
    category: 'resolution',
    rule: 'Phrases like "2 bars before" require an anchor (explicit or from context). If no anchor can be determined, the system must ask for clarification.',
  },
  {
    id: 'time-004',
    description: 'Musical units depend on time signature',
    category: 'normalization',
    rule: 'The beats-equivalent of a "bar" depends on the time signature. In 4/4, a bar = 4 beats. In 3/4, a bar = 3 beats. In 6/8, a bar = 6 eighth-note beats.',
  },
  {
    id: 'time-005',
    description: 'Absolute and musical times are convertible',
    category: 'resolution',
    rule: 'Seconds ↔ beats conversion requires knowing the tempo. "At 30 seconds" at 120 BPM = beat 60 = bar 16 (in 4/4). The conversion must use the actual project tempo.',
  },
  {
    id: 'time-006',
    description: 'Grid quantization is context-dependent',
    category: 'resolution',
    rule: '"Snap to grid" uses the current grid resolution setting. The time vocabulary does not define what the grid resolution is — that comes from the project state.',
  },
  {
    id: 'time-007',
    description: 'Conditional times are resolved at plan time',
    category: 'resolution',
    rule: 'Conditional time expressions ("when the drums come in") cannot be resolved during parsing. They are passed through to the planner, which evaluates them against the project content.',
  },
  {
    id: 'time-008',
    description: 'Duration vs position disambiguation',
    category: 'parsing',
    rule: '"4 bars" is ambiguous between duration ("for 4 bars") and range ("the first 4 bars"). Context determines which. "For" prefix → duration. Article prefix → range.',
  },
  {
    id: 'time-009',
    description: 'Triplet subdivisions are explicit',
    category: 'normalization',
    rule: 'Triplet feel is never assumed — it must be explicitly stated. "In triplets", "triplet eighth notes", "swing feel" all explicitly indicate non-standard subdivision.',
  },
  {
    id: 'time-010',
    description: 'Time displays use musical units first',
    category: 'display',
    rule: 'When displaying time to users, prefer musical units (bars/beats) over absolute time (seconds). Use absolute time only when the user explicitly used seconds or when musical units are ambiguous.',
  },
];
