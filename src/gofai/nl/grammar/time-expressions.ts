/**
 * GOFAI NL Grammar — Time Expressions
 *
 * Implements grammar rules for temporal and structural references
 * in musical editing commands. These expressions specify *where*
 * in the song an edit should apply:
 *
 * - Duration: "for 8 bars", "for 2 beats", "for the whole song"
 * - Position: "at bar 16", "at the start", "at beat 3"
 * - Section references: "in verse 2", "in the chorus", "in the bridge"
 * - Relative time: "before the chorus", "after the bridge", "during the solo"
 * - Range: "from bar 8 to bar 16", "bars 1 through 8"
 * - Ordinal: "the first chorus", "the second verse", "the last bridge"
 * - Repetition: "every other bar", "every 4 beats"
 *
 * ## Output
 *
 * Time expressions produce typed `TimeRange` structures that specify
 * a region in the song using either absolute positions (bar/beat) or
 * structural references (section names/ordinals).
 *
 * ## Design
 *
 * Musical time has two coordinate systems:
 * 1. **Absolute**: bar/beat positions (bar 16, beat 3 of bar 4)
 * 2. **Structural**: section references (the chorus, verse 2)
 *
 * Users mix both freely: "in the chorus from bar 8 to 16" combines
 * structural and absolute references. The grammar preserves both
 * and lets the resolver combine them.
 *
 * @module gofai/nl/grammar/time-expressions
 * @see gofai_goalA.md Step 115
 */

import type { Span } from '../tokenizer/span-tokenizer';

// =============================================================================
// TIME RANGE — the output of parsing a time expression
// =============================================================================

/**
 * A parsed time range: where in the song an edit applies.
 */
export type TimeRange =
  | AbsoluteRange
  | SectionRange
  | RelativeRange
  | DurationRange
  | PointRange
  | WholeRange
  | RepetitionRange
  | CompositeRange;

/**
 * An absolute bar/beat range.
 */
export interface AbsoluteRange {
  readonly type: 'absolute';
  /** Start position */
  readonly start: MusicalPosition;
  /** End position (exclusive) */
  readonly end: MusicalPosition;
  /** Span in the input */
  readonly span: Span;
}

/**
 * A section-based range.
 */
export interface SectionRange {
  readonly type: 'section';
  /** Section name (e.g., "chorus", "verse") */
  readonly sectionName: string;
  /** Ordinal (1 = first, 2 = second, -1 = last, undefined = all) */
  readonly ordinal: number | undefined;
  /** Whether this is "the last" */
  readonly isLast: boolean;
  /** Span in the input */
  readonly span: Span;
}

/**
 * A relative time range (before/after/during a reference).
 */
export interface RelativeRange {
  readonly type: 'relative';
  /** The relation */
  readonly relation: TemporalRelation;
  /** The reference point */
  readonly reference: TimeRange;
  /** Span in the input */
  readonly span: Span;
}

/**
 * A duration range ("for 8 bars", "for 2 beats").
 */
export interface DurationRange {
  readonly type: 'duration';
  /** The duration value */
  readonly value: number;
  /** The duration unit */
  readonly unit: DurationUnit;
  /** Starting from (if specified) */
  readonly from: TimeRange | undefined;
  /** Span in the input */
  readonly span: Span;
}

/**
 * A point in time (not a range).
 */
export interface PointRange {
  readonly type: 'point';
  /** The position */
  readonly position: MusicalPosition;
  /** Span in the input */
  readonly span: Span;
}

/**
 * The whole song.
 */
export interface WholeRange {
  readonly type: 'whole';
  /** Span in the input */
  readonly span: Span;
}

/**
 * A repetition pattern ("every 4 bars", "every other beat").
 */
export interface RepetitionRange {
  readonly type: 'repetition';
  /** The repetition interval */
  readonly interval: number;
  /** The unit of repetition */
  readonly unit: DurationUnit;
  /** Whether "every other" was used */
  readonly everyOther: boolean;
  /** Within what scope */
  readonly within: TimeRange | undefined;
  /** Span in the input */
  readonly span: Span;
}

/**
 * A composite range combining structural and absolute references.
 */
export interface CompositeRange {
  readonly type: 'composite';
  /** The components */
  readonly components: readonly TimeRange[];
  /** How they combine */
  readonly combination: 'intersection' | 'union';
  /** Span in the input */
  readonly span: Span;
}

// =============================================================================
// MUSICAL POSITION — a point in musical time
// =============================================================================

/**
 * A position in musical time.
 */
export interface MusicalPosition {
  /** Bar number (1-based) */
  readonly bar: number;
  /** Beat within the bar (1-based, optional) */
  readonly beat: number | undefined;
  /** Subdivision within the beat (optional) */
  readonly subdivision: number | undefined;
}

/**
 * Create a bar position.
 */
export function barPosition(bar: number): MusicalPosition {
  return { bar, beat: undefined, subdivision: undefined };
}

/**
 * Create a bar + beat position.
 */
export function barBeatPosition(bar: number, beat: number): MusicalPosition {
  return { bar, beat, subdivision: undefined };
}

/**
 * Compare two positions.
 */
export function comparePositions(a: MusicalPosition, b: MusicalPosition): number {
  if (a.bar !== b.bar) return a.bar - b.bar;
  const aBeat = a.beat ?? 1;
  const bBeat = b.beat ?? 1;
  if (aBeat !== bBeat) return aBeat - bBeat;
  const aSub = a.subdivision ?? 0;
  const bSub = b.subdivision ?? 0;
  return aSub - bSub;
}

// =============================================================================
// TEMPORAL RELATIONS — how one time relates to another
// =============================================================================

/**
 * Temporal relations.
 */
export type TemporalRelation =
  | 'before'       // Before the reference
  | 'after'        // After the reference
  | 'during'       // During/within the reference
  | 'until'        // Up to the reference
  | 'since'        // From the reference onward
  | 'between';     // Between two references

// =============================================================================
// DURATION UNITS — units of musical time
// =============================================================================

/**
 * Units of musical duration.
 */
export type DurationUnit =
  | 'bar'          // Musical bars/measures
  | 'beat'         // Musical beats
  | 'second'       // Seconds
  | 'millisecond'  // Milliseconds
  | 'measure'      // Synonym for bar
  | 'phrase'       // Musical phrase (typically 4-8 bars)
  | 'note'         // Note value (quarter, eighth, etc.)
  | 'tick';        // MIDI ticks

/**
 * Duration unit aliases.
 */
export const DURATION_UNIT_ALIASES: ReadonlyMap<string, DurationUnit> = new Map([
  // Bar/measure
  ['bar', 'bar'],
  ['bars', 'bar'],
  ['measure', 'measure'],
  ['measures', 'measure'],

  // Beat
  ['beat', 'beat'],
  ['beats', 'beat'],

  // Seconds
  ['second', 'second'],
  ['seconds', 'second'],
  ['sec', 'second'],
  ['secs', 'second'],
  ['s', 'second'],

  // Milliseconds
  ['millisecond', 'millisecond'],
  ['milliseconds', 'millisecond'],
  ['ms', 'millisecond'],

  // Phrase
  ['phrase', 'phrase'],
  ['phrases', 'phrase'],

  // Note values
  ['whole', 'note'],
  ['half', 'note'],
  ['quarter', 'note'],
  ['eighth', 'note'],
  ['sixteenth', 'note'],

  // Ticks
  ['tick', 'tick'],
  ['ticks', 'tick'],
]);

/**
 * Look up a duration unit by name.
 */
export function lookupDurationUnit(name: string): DurationUnit | undefined {
  return DURATION_UNIT_ALIASES.get(name.toLowerCase());
}

// =============================================================================
// SECTION NAMES — recognized musical section names
// =============================================================================

/**
 * A section name entry.
 */
export interface SectionNameEntry {
  /** Canonical name */
  readonly canonical: string;

  /** All recognized forms */
  readonly forms: readonly string[];

  /** Typical order in a song (for relative references) */
  readonly typicalOrder: number;

  /** Whether this section typically repeats */
  readonly repeats: boolean;

  /** Description */
  readonly description: string;
}

/**
 * All recognized section names.
 */
export const SECTION_NAMES: readonly SectionNameEntry[] = [
  {
    canonical: 'intro',
    forms: ['intro', 'introduction', 'opening'],
    typicalOrder: 1,
    repeats: false,
    description: 'Song introduction',
  },
  {
    canonical: 'verse',
    forms: ['verse', 'verses', 'vrs'],
    typicalOrder: 2,
    repeats: true,
    description: 'Verse section',
  },
  {
    canonical: 'pre-chorus',
    forms: ['pre-chorus', 'prechorus', 'pre chorus', 'build', 'buildup', 'build-up', 'ramp'],
    typicalOrder: 3,
    repeats: true,
    description: 'Pre-chorus / build section',
  },
  {
    canonical: 'chorus',
    forms: ['chorus', 'choruses', 'hook', 'refrain'],
    typicalOrder: 4,
    repeats: true,
    description: 'Chorus / hook section',
  },
  {
    canonical: 'post-chorus',
    forms: ['post-chorus', 'postchorus', 'post chorus'],
    typicalOrder: 5,
    repeats: true,
    description: 'Post-chorus section',
  },
  {
    canonical: 'bridge',
    forms: ['bridge', 'middle 8', 'middle eight', 'b-section'],
    typicalOrder: 6,
    repeats: false,
    description: 'Bridge section',
  },
  {
    canonical: 'breakdown',
    forms: ['breakdown', 'break', 'drop'],
    typicalOrder: 7,
    repeats: false,
    description: 'Breakdown / drop section',
  },
  {
    canonical: 'solo',
    forms: ['solo', 'instrumental', 'inst'],
    typicalOrder: 8,
    repeats: false,
    description: 'Solo / instrumental section',
  },
  {
    canonical: 'outro',
    forms: ['outro', 'ending', 'coda', 'tag', 'finale'],
    typicalOrder: 9,
    repeats: false,
    description: 'Song ending',
  },
  {
    canonical: 'interlude',
    forms: ['interlude', 'transition', 'fill'],
    typicalOrder: 5,
    repeats: true,
    description: 'Interlude / transition section',
  },
];

// =============================================================================
// SECTION NAME LOOKUP INDEX
// =============================================================================

/**
 * Index: form → section entry.
 */
const sectionIndex: ReadonlyMap<string, SectionNameEntry> = (() => {
  const index = new Map<string, SectionNameEntry>();
  for (const entry of SECTION_NAMES) {
    for (const form of entry.forms) {
      index.set(form.toLowerCase(), entry);
    }
  }
  return index;
})();

/**
 * Look up a section by name.
 */
export function lookupSection(name: string): SectionNameEntry | undefined {
  return sectionIndex.get(name.toLowerCase());
}

/**
 * Check if a word is a known section name.
 */
export function isSectionName(word: string): boolean {
  return sectionIndex.has(word.toLowerCase());
}

/**
 * Get all known section name forms.
 */
export function getAllSectionForms(): readonly string[] {
  return Array.from(sectionIndex.keys());
}

// =============================================================================
// TEMPORAL PREPOSITIONS — words that introduce time expressions
// =============================================================================

/**
 * A temporal preposition entry.
 */
export interface TemporalPrepositionEntry {
  /** Surface forms */
  readonly forms: readonly string[];

  /** What temporal construct this introduces */
  readonly introduces: TemporalConstructType;

  /** The temporal relation it implies */
  readonly relation: TemporalRelation | undefined;

  /** Description */
  readonly description: string;

  /** Examples */
  readonly examples: readonly string[];

  /** Priority */
  readonly priority: number;
}

/**
 * Types of temporal constructs.
 */
export type TemporalConstructType =
  | 'duration'     // "for 8 bars"
  | 'location'     // "in the chorus", "at bar 16"
  | 'relative'     // "before the chorus", "after the bridge"
  | 'range'        // "from bar 8 to bar 16"
  | 'point'        // "at beat 3"
  | 'whole';       // "throughout", "the whole time"

/**
 * All temporal prepositions.
 */
export const TEMPORAL_PREPOSITIONS: readonly TemporalPrepositionEntry[] = [
  // --- Duration ---
  {
    forms: ['for'],
    introduces: 'duration',
    relation: undefined,
    description: 'Duration: how long',
    examples: ['for 8 bars', 'for 2 beats', 'for the whole song'],
    priority: 15,
  },
  {
    forms: ['over'],
    introduces: 'duration',
    relation: undefined,
    description: 'Duration (spanning): over a period',
    examples: ['over 4 bars', 'over the verse'],
    priority: 10,
  },
  {
    forms: ['during'],
    introduces: 'location',
    relation: 'during',
    description: 'During: within a section',
    examples: ['during the chorus', 'during the solo'],
    priority: 15,
  },
  {
    forms: ['throughout', 'across'],
    introduces: 'whole',
    relation: 'during',
    description: 'Throughout: the entire span',
    examples: ['throughout the song', 'across all verses'],
    priority: 12,
  },

  // --- Location ---
  {
    forms: ['in', 'within'],
    introduces: 'location',
    relation: 'during',
    description: 'Location: within a section',
    examples: ['in the chorus', 'in verse 2', 'within the bridge'],
    priority: 15,
  },
  {
    forms: ['at'],
    introduces: 'point',
    relation: undefined,
    description: 'Point: at a specific position',
    examples: ['at bar 16', 'at beat 3', 'at the start'],
    priority: 15,
  },
  {
    forms: ['on'],
    introduces: 'point',
    relation: undefined,
    description: 'Point: on a specific beat/position',
    examples: ['on beat 1', 'on the downbeat'],
    priority: 10,
  },

  // --- Relative ---
  {
    forms: ['before'],
    introduces: 'relative',
    relation: 'before',
    description: 'Before: preceding a reference',
    examples: ['before the chorus', 'before bar 16'],
    priority: 15,
  },
  {
    forms: ['after'],
    introduces: 'relative',
    relation: 'after',
    description: 'After: following a reference',
    examples: ['after the bridge', 'after bar 8'],
    priority: 15,
  },
  {
    forms: ['until', 'up to', 'up until', 'till'],
    introduces: 'relative',
    relation: 'until',
    description: 'Until: up to a reference',
    examples: ['until the chorus', 'until bar 16'],
    priority: 12,
  },
  {
    forms: ['since', 'starting from', 'starting at', 'beginning at', 'beginning from'],
    introduces: 'relative',
    relation: 'since',
    description: 'Since: from a reference onward',
    examples: ['since the verse', 'starting from bar 8'],
    priority: 12,
  },

  // --- Range ---
  {
    forms: ['from'],
    introduces: 'range',
    relation: undefined,
    description: 'Range start (paired with "to")',
    examples: ['from bar 8 to bar 16', 'from the verse to the chorus'],
    priority: 15,
  },
  {
    forms: ['to', 'through', 'thru'],
    introduces: 'range',
    relation: undefined,
    description: 'Range end (paired with "from")',
    examples: ['to bar 16', 'through the outro'],
    priority: 12,
  },
  {
    forms: ['between'],
    introduces: 'range',
    relation: 'between',
    description: 'Range: between two references',
    examples: ['between bar 8 and bar 16', 'between the verse and chorus'],
    priority: 15,
  },
];

/**
 * Index: form → temporal preposition entries.
 */
const temporalPrepIndex: ReadonlyMap<string, readonly TemporalPrepositionEntry[]> = (() => {
  const index = new Map<string, TemporalPrepositionEntry[]>();
  for (const entry of TEMPORAL_PREPOSITIONS) {
    for (const form of entry.forms) {
      const lower = form.toLowerCase();
      const existing = index.get(lower);
      if (existing) {
        existing.push(entry);
      } else {
        index.set(lower, [entry]);
      }
    }
  }
  return index;
})();

/**
 * Look up temporal prepositions by form.
 */
export function lookupTemporalPreposition(form: string): readonly TemporalPrepositionEntry[] {
  return temporalPrepIndex.get(form.toLowerCase()) ?? [];
}

/**
 * Check if a word is a temporal preposition.
 */
export function isTemporalPreposition(word: string): boolean {
  return temporalPrepIndex.has(word.toLowerCase());
}

// =============================================================================
// ORDINAL REFERENCES — "the first", "the second", "the last"
// =============================================================================

/**
 * An ordinal reference for selecting among repeated sections.
 */
export interface OrdinalReference {
  /** The ordinal value (1-based, -1 = last) */
  readonly value: number;

  /** Surface form */
  readonly surface: string;

  /** Whether this is "the last" */
  readonly isLast: boolean;
}

/**
 * Ordinal word → number mapping.
 */
export const ORDINAL_WORDS: ReadonlyMap<string, number> = new Map([
  ['first', 1],
  ['1st', 1],
  ['second', 2],
  ['2nd', 2],
  ['third', 3],
  ['3rd', 3],
  ['fourth', 4],
  ['4th', 4],
  ['fifth', 5],
  ['5th', 5],
  ['sixth', 6],
  ['6th', 6],
  ['seventh', 7],
  ['7th', 7],
  ['eighth', 8],
  ['8th', 8],
  ['ninth', 9],
  ['9th', 9],
  ['tenth', 10],
  ['10th', 10],
  ['last', -1],
  ['final', -1],
  ['penultimate', -2],
  ['next', -3], // Special: relative to current position
  ['previous', -4], // Special: relative to current position
]);

/**
 * Look up an ordinal by word.
 */
export function lookupOrdinal(word: string): number | undefined {
  return ORDINAL_WORDS.get(word.toLowerCase());
}

/**
 * Check if a word is an ordinal.
 */
export function isOrdinal(word: string): boolean {
  return ORDINAL_WORDS.has(word.toLowerCase());
}

// =============================================================================
// WHOLE-SONG REFERENCES
// =============================================================================

/**
 * Words that refer to the entire song.
 */
export const WHOLE_SONG_WORDS: readonly string[] = [
  'everywhere',
  'throughout',
  'overall',
  'globally',
  'the whole song',
  'the entire song',
  'the whole track',
  'the entire track',
  'all of it',
  'everything',
  'the whole thing',
];

/**
 * Check if a phrase refers to the whole song.
 */
export function isWholeSongReference(phrase: string): boolean {
  return WHOLE_SONG_WORDS.includes(phrase.toLowerCase());
}

// =============================================================================
// RELATIVE POSITION WORDS
// =============================================================================

/**
 * Words indicating relative positions.
 */
export const RELATIVE_POSITION_WORDS: ReadonlyMap<string, RelativePositionType> = new Map([
  ['start', 'start'],
  ['beginning', 'start'],
  ['top', 'start'],
  ['head', 'start'],
  ['end', 'end'],
  ['ending', 'end'],
  ['tail', 'end'],
  ['bottom', 'end'],
  ['middle', 'middle'],
  ['center', 'middle'],
  ['halfway', 'middle'],
  ['midpoint', 'middle'],
]);

/**
 * Types of relative positions.
 */
export type RelativePositionType = 'start' | 'middle' | 'end';

/**
 * Look up a relative position word.
 */
export function lookupRelativePosition(word: string): RelativePositionType | undefined {
  return RELATIVE_POSITION_WORDS.get(word.toLowerCase());
}

// =============================================================================
// TIME EXPRESSION ANALYSIS — parsing word sequences into TimeRanges
// =============================================================================

/**
 * Result of analyzing a time expression.
 */
export interface TimeExpressionAnalysis {
  /** The parsed time range */
  readonly range: TimeRange;

  /** Words consumed by this analysis */
  readonly wordsConsumed: number;

  /** Confidence */
  readonly confidence: number;

  /** Warnings */
  readonly warnings: readonly TimeExpressionWarning[];
}

/**
 * Warning about a time expression.
 */
export interface TimeExpressionWarning {
  readonly code: TimeWarningCode;
  readonly message: string;
  readonly span: Span;
}

/**
 * Warning codes.
 */
export type TimeWarningCode =
  | 'ambiguous_section'       // Section name is ambiguous
  | 'missing_ordinal'         // Repeated section without ordinal
  | 'bar_out_of_range'        // Bar number seems too high/low
  | 'beat_out_of_range'       // Beat number exceeds time signature
  | 'conflicting_references'  // Two time references that conflict
  | 'unknown_section'         // Section name not recognized
  | 'incomplete_range';       // "from bar 8" without "to"

/**
 * Attempt to parse a time expression from a word sequence.
 *
 * Tries patterns in order of specificity:
 * 1. "from X to Y" (range)
 * 2. "in/at/during SECTION [ORDINAL]" (section)
 * 3. "for N UNIT" (duration)
 * 4. "before/after REFERENCE" (relative)
 * 5. "at bar N" (point)
 * 6. "bars N through M" (shorthand range)
 * 7. "every N UNIT" (repetition)
 */
export function analyzeTimeExpression(words: readonly string[]): TimeExpressionAnalysis | undefined {
  if (words.length === 0) return undefined;

  const lower = words.map(w => w.toLowerCase());

  // Try "from X to Y" range
  const fromIdx = lower.indexOf('from');
  if (fromIdx !== -1) {
    const toIdx = findRangeEnd(lower, fromIdx + 1);
    if (toIdx !== -1) {
      const startWords = lower.slice(fromIdx + 1, toIdx);
      const endWords = lower.slice(toIdx + 1);

      const startRange = parseSimplePosition(startWords);
      const endRange = parseSimplePosition(endWords);

      if (startRange && endRange) {
        return {
          range: {
            type: 'absolute',
            start: startRange,
            end: endRange,
            span: { start: 0, end: 0 },
          },
          wordsConsumed: words.length,
          confidence: 0.8,
          warnings: [],
        };
      }
    }
  }

  // Try "between X and Y"
  const betweenIdx = lower.indexOf('between');
  if (betweenIdx !== -1) {
    const andIdx = lower.indexOf('and', betweenIdx + 1);
    if (andIdx !== -1) {
      const startWords = lower.slice(betweenIdx + 1, andIdx);
      const endWords = lower.slice(andIdx + 1);

      const startRange = parseSimplePosition(startWords);
      const endRange = parseSimplePosition(endWords);

      if (startRange && endRange) {
        return {
          range: {
            type: 'absolute',
            start: startRange,
            end: endRange,
            span: { start: 0, end: 0 },
          },
          wordsConsumed: words.length,
          confidence: 0.7,
          warnings: [],
        };
      }
    }
  }

  // Try "for N UNIT" duration
  if (lower[0] === 'for') {
    const durationResult = parseDuration(lower.slice(1));
    if (durationResult) {
      return {
        range: {
          type: 'duration',
          value: durationResult.value,
          unit: durationResult.unit,
          from: undefined,
          span: { start: 0, end: 0 },
        },
        wordsConsumed: 1 + durationResult.wordsConsumed,
        confidence: 0.8,
        warnings: [],
      };
    }
  }

  // Try "in/at/during SECTION [ORDINAL]"
  const prepEntries = lookupTemporalPreposition(lower[0] ?? '');
  if (prepEntries.length > 0 && lower.length >= 2) {
    const sectionResult = parseSectionReference(lower.slice(1));
    if (sectionResult) {
      return {
        range: sectionResult.range,
        wordsConsumed: 1 + sectionResult.wordsConsumed,
        confidence: 0.8,
        warnings: [],
      };
    }

    // Try "at bar N"
    const positionResult = parseBarBeatReference(lower.slice(1));
    if (positionResult) {
      const prep = prepEntries[0]!;
      if (prep.relation === 'before' || prep.relation === 'after') {
        return {
          range: {
            type: 'relative',
            relation: prep.relation,
            reference: {
              type: 'point',
              position: positionResult.position,
              span: { start: 0, end: 0 },
            },
            span: { start: 0, end: 0 },
          },
          wordsConsumed: 1 + positionResult.wordsConsumed,
          confidence: 0.7,
          warnings: [],
        };
      }

      return {
        range: {
          type: 'point',
          position: positionResult.position,
          span: { start: 0, end: 0 },
        },
        wordsConsumed: 1 + positionResult.wordsConsumed,
        confidence: 0.7,
        warnings: [],
      };
    }
  }

  // Try "every N UNIT" repetition
  if (lower[0] === 'every') {
    const repResult = parseRepetition(lower.slice(1));
    if (repResult) {
      return {
        range: {
          type: 'repetition',
          interval: repResult.interval,
          unit: repResult.unit,
          everyOther: repResult.everyOther,
          within: undefined,
          span: { start: 0, end: 0 },
        },
        wordsConsumed: 1 + repResult.wordsConsumed,
        confidence: 0.7,
        warnings: [],
      };
    }
  }

  // Try whole-song references
  const phrase = lower.join(' ');
  if (isWholeSongReference(phrase)) {
    return {
      range: { type: 'whole', span: { start: 0, end: 0 } },
      wordsConsumed: words.length,
      confidence: 0.9,
      warnings: [],
    };
  }

  // Try bare section name
  const sectionResult = parseSectionReference(lower);
  if (sectionResult) {
    return {
      range: sectionResult.range,
      wordsConsumed: sectionResult.wordsConsumed,
      confidence: 0.5, // Lower confidence without preposition
      warnings: [],
    };
  }

  return undefined;
}

// =============================================================================
// PARSING HELPERS
// =============================================================================

/**
 * Find the "to" or "through" keyword that ends a range start.
 */
function findRangeEnd(words: readonly string[], startIdx: number): number {
  for (let i = startIdx; i < words.length; i++) {
    if (words[i] === 'to' || words[i] === 'through' || words[i] === 'thru') {
      return i;
    }
  }
  return -1;
}

/**
 * Parse a simple position (bar number or section name).
 */
function parseSimplePosition(words: readonly string[]): MusicalPosition | undefined {
  if (words.length === 0) return undefined;

  // "bar N" or "bar N beat M"
  if (words[0] === 'bar' && words.length >= 2) {
    const barNum = parseInt(words[1]!, 10);
    if (!isNaN(barNum)) {
      if (words.length >= 4 && words[2] === 'beat') {
        const beatNum = parseInt(words[3]!, 10);
        if (!isNaN(beatNum)) {
          return barBeatPosition(barNum, beatNum);
        }
      }
      return barPosition(barNum);
    }
  }

  // Just a number (assumed bar)
  const num = parseInt(words[0]!, 10);
  if (!isNaN(num)) {
    return barPosition(num);
  }

  return undefined;
}

/**
 * Parse a bar/beat reference from words.
 */
function parseBarBeatReference(
  words: readonly string[],
): { position: MusicalPosition; wordsConsumed: number } | undefined {
  if (words.length === 0) return undefined;

  // "bar N"
  if (words[0] === 'bar' && words.length >= 2) {
    const barNum = parseInt(words[1]!, 10);
    if (!isNaN(barNum)) {
      // "bar N beat M"
      if (words.length >= 4 && words[2] === 'beat') {
        const beatNum = parseInt(words[3]!, 10);
        if (!isNaN(beatNum)) {
          return { position: barBeatPosition(barNum, beatNum), wordsConsumed: 4 };
        }
      }
      return { position: barPosition(barNum), wordsConsumed: 2 };
    }
  }

  // "beat N"
  if (words[0] === 'beat' && words.length >= 2) {
    const beatNum = parseInt(words[1]!, 10);
    if (!isNaN(beatNum)) {
      return { position: barBeatPosition(1, beatNum), wordsConsumed: 2 };
    }
  }

  // Relative position words
  const relPos = lookupRelativePosition(words[0]!);
  if (relPos) {
    const pos: MusicalPosition = relPos === 'start'
      ? barPosition(1)
      : relPos === 'end'
        ? barPosition(Infinity)
        : barPosition(-1); // middle
    return { position: pos, wordsConsumed: 1 };
  }

  return undefined;
}

/**
 * Parse a section reference from words.
 */
function parseSectionReference(
  words: readonly string[],
): { range: SectionRange; wordsConsumed: number } | undefined {
  if (words.length === 0) return undefined;

  let idx = 0;
  let ordinal: number | undefined;
  let isLast = false;

  // Skip "the"
  if (words[idx] === 'the') idx++;

  // Check for ordinal before section name
  if (idx < words.length) {
    const ord = lookupOrdinal(words[idx]!);
    if (ord !== undefined) {
      ordinal = ord;
      if (ord === -1) isLast = true;
      idx++;
    }
  }

  // Look for section name
  if (idx < words.length) {
    const section = lookupSection(words[idx]!);
    if (section) {
      // Check for number after section name ("verse 2")
      if (idx + 1 < words.length && ordinal === undefined) {
        const num = parseInt(words[idx + 1]!, 10);
        if (!isNaN(num) && num > 0) {
          ordinal = num;
          return {
            range: {
              type: 'section',
              sectionName: section.canonical,
              ordinal,
              isLast,
              span: { start: 0, end: 0 },
            },
            wordsConsumed: idx + 2,
          };
        }
      }

      return {
        range: {
          type: 'section',
          sectionName: section.canonical,
          ordinal,
          isLast,
          span: { start: 0, end: 0 },
        },
        wordsConsumed: idx + 1,
      };
    }
  }

  return undefined;
}

/**
 * Parse a duration from words ("8 bars", "2 beats").
 */
function parseDuration(
  words: readonly string[],
): { value: number; unit: DurationUnit; wordsConsumed: number } | undefined {
  if (words.length < 2) return undefined;

  // "the whole song"
  if (words.length >= 3 && words[0] === 'the' && words[1] === 'whole') {
    return undefined; // Handled as whole-song reference
  }

  const value = parseFloat(words[0]!);
  if (isNaN(value)) return undefined;

  const unit = lookupDurationUnit(words[1]!);
  if (!unit) return undefined;

  return { value, unit, wordsConsumed: 2 };
}

/**
 * Parse a repetition pattern from words ("other bar", "4 bars").
 */
function parseRepetition(
  words: readonly string[],
): { interval: number; unit: DurationUnit; everyOther: boolean; wordsConsumed: number } | undefined {
  if (words.length === 0) return undefined;

  // "every other bar"
  if (words[0] === 'other' && words.length >= 2) {
    const unit = lookupDurationUnit(words[1]!);
    if (unit) {
      return { interval: 2, unit, everyOther: true, wordsConsumed: 2 };
    }
  }

  // "every N bars"
  const value = parseInt(words[0]!, 10);
  if (!isNaN(value) && words.length >= 2) {
    const unit = lookupDurationUnit(words[1]!);
    if (unit) {
      return { interval: value, unit, everyOther: false, wordsConsumed: 2 };
    }
  }

  // "every bar"
  const unit = lookupDurationUnit(words[0]!);
  if (unit) {
    return { interval: 1, unit, everyOther: false, wordsConsumed: 1 };
  }

  return undefined;
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format a time range for display.
 */
export function formatTimeRange(range: TimeRange): string {
  switch (range.type) {
    case 'absolute':
      return `bars ${formatPosition(range.start)}-${formatPosition(range.end)}`;
    case 'section':
      return range.ordinal
        ? `${ordinalName(range.ordinal)} ${range.sectionName}`
        : range.sectionName;
    case 'relative':
      return `${range.relation} ${formatTimeRange(range.reference)}`;
    case 'duration':
      return `for ${range.value} ${range.unit}${range.value !== 1 ? 's' : ''}`;
    case 'point':
      return `at ${formatPosition(range.position)}`;
    case 'whole':
      return 'the whole song';
    case 'repetition':
      return range.everyOther
        ? `every other ${range.unit}`
        : `every ${range.interval} ${range.unit}${range.interval !== 1 ? 's' : ''}`;
    case 'composite':
      return range.components.map(formatTimeRange).join(` ${range.combination} `);
  }
}

/**
 * Format a musical position.
 */
export function formatPosition(pos: MusicalPosition): string {
  if (pos.bar === Infinity) return 'end';
  if (pos.bar === -1) return 'middle';
  let result = `bar ${pos.bar}`;
  if (pos.beat !== undefined) result += ` beat ${pos.beat}`;
  if (pos.subdivision !== undefined) result += `.${pos.subdivision}`;
  return result;
}

/**
 * Convert ordinal number to name.
 */
function ordinalName(n: number): string {
  if (n === -1) return 'last';
  if (n === -2) return 'penultimate';
  if (n === 1) return 'first';
  if (n === 2) return 'second';
  if (n === 3) return 'third';
  return `${n}th`;
}

/**
 * Format a section name entry for display.
 */
export function formatSectionEntry(entry: SectionNameEntry): string {
  const repeats = entry.repeats ? 'repeats' : 'unique';
  return `${entry.canonical} (${entry.forms.join('/')}) — order: ${entry.typicalOrder}, ${repeats}`;
}

/**
 * Format all section names for display.
 */
export function formatAllSections(): string {
  return SECTION_NAMES.map(formatSectionEntry).join('\n');
}

/**
 * Format a time expression analysis for display.
 */
export function formatTimeExpressionAnalysis(analysis: TimeExpressionAnalysis): string {
  const lines: string[] = [];
  lines.push(`Time expression: ${formatTimeRange(analysis.range)}`);
  lines.push(`  Words consumed: ${analysis.wordsConsumed}`);
  lines.push(`  Confidence: ${(analysis.confidence * 100).toFixed(0)}%`);
  for (const w of analysis.warnings) {
    lines.push(`  Warning: ${w.code} — ${w.message}`);
  }
  return lines.join('\n');
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get statistics about the time expressions grammar.
 */
export function getTimeExpressionStats(): TimeExpressionStats {
  return {
    totalSectionNames: SECTION_NAMES.length,
    totalSectionForms: sectionIndex.size,
    totalTemporalPrepositions: TEMPORAL_PREPOSITIONS.length,
    totalDurationUnits: DURATION_UNIT_ALIASES.size,
    totalOrdinals: ORDINAL_WORDS.size,
    totalWholeSongWords: WHOLE_SONG_WORDS.length,
    totalRelativePositions: RELATIVE_POSITION_WORDS.size,
  };
}

/**
 * Statistics about the time expressions grammar.
 */
export interface TimeExpressionStats {
  readonly totalSectionNames: number;
  readonly totalSectionForms: number;
  readonly totalTemporalPrepositions: number;
  readonly totalDurationUnits: number;
  readonly totalOrdinals: number;
  readonly totalWholeSongWords: number;
  readonly totalRelativePositions: number;
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const TIME_EXPRESSION_RULES = [
  'Rule TIME-001: Time expressions have two coordinate systems: absolute ' +
  '(bar/beat) and structural (section names). Both can be combined.',

  'Rule TIME-002: Section names are canonicalized: "hook" → "chorus", ' +
  '"ending" → "outro", "build" → "pre-chorus".',

  'Rule TIME-003: Ordinals select among repeated sections: "the second ' +
  'verse" = verse with ordinal 2. "the last chorus" = ordinal -1.',

  'Rule TIME-004: Duration expressions ("for 8 bars") produce DurationRange ' +
  'with a numeric value and unit. They require resolution to absolute time.',

  'Rule TIME-005: Relative expressions ("before the chorus") produce ' +
  'RelativeRange with a temporal relation and a reference TimeRange.',

  'Rule TIME-006: Range expressions ("from bar 8 to bar 16") produce ' +
  'AbsoluteRange with start and end positions.',

  'Rule TIME-007: Repetition expressions ("every 4 bars") produce ' +
  'RepetitionRange with an interval and optional containing scope.',

  'Rule TIME-008: "the whole song" and synonyms produce WholeRange, ' +
  'meaning the edit applies everywhere.',

  'Rule TIME-009: Bar and beat numbers are 1-based. "bar 1" is the first ' +
  'bar. "beat 1" is the downbeat.',

  'Rule TIME-010: Missing ordinals on repeated sections (e.g., "the chorus" ' +
  'in a song with multiple choruses) generate a warning and default to all.',

  'Rule TIME-011: Composite ranges combine multiple time constraints. ' +
  '"in the chorus from bar 8 to 16" = intersection of section + absolute.',

  'Rule TIME-012: Duration units include bars, beats, seconds, milliseconds, ' +
  'phrases, note values, and MIDI ticks.',
] as const;
