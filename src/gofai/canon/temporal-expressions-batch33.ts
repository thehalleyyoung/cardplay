/**
 * GOFAI Canon — Temporal Expressions Batch 33
 *
 * Comprehensive catalog of temporal expressions for musical timing and sequencing.
 * These expressions allow users to specify when and for how long actions should occur.
 *
 * **Musical Time is Multi-Layered:**
 * - **Metric Time**: Bars, beats, subdivisions (quarter notes, eighth notes)
 * - **Section Time**: Intro, verse, chorus, bridge, outro
 * - **Event Time**: On the downbeat, at the drop, before the fill
 * - **Duration**: For 2 bars, throughout the section, until the end
 * - **Frequency**: Every bar, every other beat, twice per section
 *
 * **Design Principles:**
 * 1. **Compositional**: Temporal expressions combine with spatial and logical operators
 * 2. **Precise**: Map to exact tick positions when possible
 * 3. **Flexible**: Support both absolute and relative time
 * 4. **Musical**: Use musician terminology, not programmer terms
 *
 * ## Temporal Model
 *
 * Each temporal expression maps to one or more of:
 * - **Point in time**: "at bar 5", "on beat 3"
 * - **Time interval**: "from bar 5 to 8", "for 2 bars"
 * - **Recurring time**: "every bar", "every other beat"
 * - **Relative time**: "before the drop", "after the verse"
 * - **Boundary time**: "at the start", "at the end"
 *
 * ## Integration with CPL
 *
 * Temporal expressions become CPL temporal operators that:
 * 1. Resolve to concrete tick ranges
 * 2. Validate against project timeline
 * 3. Support scope restriction in plans
 * 4. Enable undo/redo by time range
 *
 * @module gofai/canon/temporal-expressions-batch33
 */

import type { GofaiId } from './types';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Category of temporal expression
 */
export type TemporalCategory =
  | 'point'           // at a specific moment
  | 'interval'        // spanning a duration
  | 'recurring'       // repeating pattern
  | 'relative'        // relative to another time
  | 'boundary'        // start or end point
  | 'frequency'       // how often
  | 'phase';          // within a cycle

/**
 * Temporal precision
 */
export type TemporalPrecision =
  | 'tick'            // Exact tick position
  | 'subdiv'          // Subdivision (16th, 32nd)
  | 'beat'            // Beat position
  | 'bar'             // Bar position
  | 'section'         // Section marker
  | 'event'           // Relative to musical event
  | 'approximate';    // Fuzzy/approximate

/**
 * A temporal expression entry
 */
export interface TemporalExpression {
  /** Canonical ID */
  readonly id: GofaiId;
  
  /** Surface form(s) */
  readonly forms: readonly string[];
  
  /** Category */
  readonly category: TemporalCategory;
  
  /** Precision level */
  readonly precision: TemporalPrecision;
  
  /** Whether this is absolute (vs relative) */
  readonly absolute?: boolean;
  
  /** Usage notes */
  readonly notes?: string;
  
  /** Typical collocations */
  readonly collocations?: readonly string[];
  
  /** Related expressions */
  readonly related?: readonly GofaiId[];
}

// =============================================================================
// Point in Time — Absolute
// =============================================================================

export const ABSOLUTE_TIME_POINTS: readonly TemporalExpression[] = [
  {
    id: 'gofai:temp:at_bar:absolute' as GofaiId,
    forms: ['at bar', 'on bar', 'bar'],
    category: 'point',
    precision: 'bar',
    absolute: true,
    notes: 'Specific bar number',
    collocations: ['at bar 5', 'on bar 8', 'bar 16'],
  },
  {
    id: 'gofai:temp:at_beat:absolute' as GofaiId,
    forms: ['at beat', 'on beat', 'beat'],
    category: 'point',
    precision: 'beat',
    absolute: true,
    notes: 'Specific beat within a bar',
    collocations: ['at beat 3', 'on beat 2', 'beat 4'],
  },
  {
    id: 'gofai:temp:at_tick:absolute' as GofaiId,
    forms: ['at tick', 'tick'],
    category: 'point',
    precision: 'tick',
    absolute: true,
    notes: 'Exact tick position (expert use)',
    collocations: ['at tick 1920', 'tick 3840'],
  },
  {
    id: 'gofai:temp:at_time:absolute' as GofaiId,
    forms: ['at', 'at time'],
    category: 'point',
    precision: 'approximate',
    absolute: true,
    notes: 'General time point',
    collocations: ['at 0:15', 'at 1 minute', 'at time 2:30'],
  },
];

// =============================================================================
// Point in Time — Relative to Sections
// =============================================================================

export const SECTION_TIME_POINTS: readonly TemporalExpression[] = [
  {
    id: 'gofai:temp:in_section:point' as GofaiId,
    forms: ['in the', 'in', 'during the'],
    category: 'point',
    precision: 'section',
    absolute: false,
    notes: 'Within a named section',
    collocations: ['in the verse', 'in the chorus', 'during the bridge'],
  },
  {
    id: 'gofai:temp:at_section_start:boundary' as GofaiId,
    forms: ['at the start of', 'at the beginning of'],
    category: 'boundary',
    precision: 'section',
    absolute: false,
    notes: 'First moment of section',
    collocations: ['at the start of the verse', 'at the beginning of the chorus'],
  },
  {
    id: 'gofai:temp:at_section_end:boundary' as GofaiId,
    forms: ['at the end of', 'at the close of'],
    category: 'boundary',
    precision: 'section',
    absolute: false,
    notes: 'Last moment of section',
    collocations: ['at the end of the verse', 'at the close of the bridge'],
  },
  {
    id: 'gofai:temp:before_section:relative' as GofaiId,
    forms: ['before the', 'prior to the'],
    category: 'relative',
    precision: 'section',
    absolute: false,
    notes: 'Immediately before section',
    collocations: ['before the chorus', 'prior to the drop'],
  },
  {
    id: 'gofai:temp:after_section:relative' as GofaiId,
    forms: ['after the', 'following the'],
    category: 'relative',
    precision: 'section',
    absolute: false,
    notes: 'Immediately after section',
    collocations: ['after the verse', 'following the bridge'],
  },
];

// =============================================================================
// Point in Time — Relative to Musical Events
// =============================================================================

export const EVENT_TIME_POINTS: readonly TemporalExpression[] = [
  {
    id: 'gofai:temp:on_downbeat:event' as GofaiId,
    forms: ['on the downbeat', 'on downbeats'],
    category: 'point',
    precision: 'beat',
    absolute: false,
    notes: 'First beat of bar',
    collocations: ['on the downbeat', 'on every downbeat'],
  },
  {
    id: 'gofai:temp:on_upbeat:event' as GofaiId,
    forms: ['on the upbeat', 'on upbeats'],
    category: 'point',
    precision: 'beat',
    absolute: false,
    notes: 'Off-beat, typically beat 2 and 4',
    collocations: ['on the upbeat', 'on upbeats'],
  },
  {
    id: 'gofai:temp:at_the_drop:event' as GofaiId,
    forms: ['at the drop', 'when the drop hits'],
    category: 'point',
    precision: 'event',
    absolute: false,
    notes: 'Moment of major energy change (EDM/hip-hop)',
    collocations: ['at the drop', 'when the drop hits'],
  },
  {
    id: 'gofai:temp:during_fill:event' as GofaiId,
    forms: ['during the fill', 'in the fill'],
    category: 'interval',
    precision: 'event',
    absolute: false,
    notes: 'During drum fill or transitional passage',
    collocations: ['during the fill', 'in the drum fill'],
  },
  {
    id: 'gofai:temp:at_cadence:event' as GofaiId,
    forms: ['at the cadence', 'at cadences'],
    category: 'point',
    precision: 'event',
    absolute: false,
    notes: 'At harmonic resolution points',
    collocations: ['at the cadence', 'at cadences'],
  },
  {
    id: 'gofai:temp:when_melody_plays:event' as GofaiId,
    forms: ['when the melody plays', 'while the melody is playing'],
    category: 'interval',
    precision: 'event',
    absolute: false,
    notes: 'Coinciding with melody events',
    collocations: ['when the melody plays', 'while melody is active'],
  },
  {
    id: 'gofai:temp:between_notes:event' as GofaiId,
    forms: ['between notes', 'in the gaps'],
    category: 'point',
    precision: 'event',
    absolute: false,
    notes: 'In silent gaps between note events',
    collocations: ['between notes', 'in the gaps'],
  },
];

// =============================================================================
// Time Intervals — Duration
// =============================================================================

export const DURATION_INTERVALS: readonly TemporalExpression[] = [
  {
    id: 'gofai:temp:for_bars:duration' as GofaiId,
    forms: ['for', 'for the next', 'over'],
    category: 'interval',
    precision: 'bar',
    absolute: false,
    notes: 'Duration in bars',
    collocations: ['for 4 bars', 'for the next 8 bars', 'over 2 bars'],
  },
  {
    id: 'gofai:temp:for_beats:duration' as GofaiId,
    forms: ['for', 'for the next'],
    category: 'interval',
    precision: 'beat',
    absolute: false,
    notes: 'Duration in beats',
    collocations: ['for 2 beats', 'for the next 4 beats'],
  },
  {
    id: 'gofai:temp:throughout:duration' as GofaiId,
    forms: ['throughout', 'throughout the', 'all through'],
    category: 'interval',
    precision: 'section',
    absolute: false,
    notes: 'Entire duration of section',
    collocations: ['throughout the verse', 'throughout the entire song'],
  },
  {
    id: 'gofai:temp:from_to:interval' as GofaiId,
    forms: ['from', 'to'],
    category: 'interval',
    precision: 'bar',
    absolute: false,
    notes: 'Explicit start and end',
    collocations: ['from bar 5 to bar 8', 'from the verse to the chorus'],
  },
  {
    id: 'gofai:temp:until:endpoint' as GofaiId,
    forms: ['until', 'till', 'up to'],
    category: 'interval',
    precision: 'bar',
    absolute: false,
    notes: 'Up to a specific endpoint',
    collocations: ['until bar 16', 'till the end', 'up to the drop'],
  },
  {
    id: 'gofai:temp:since:startpoint' as GofaiId,
    forms: ['since', 'from'],
    category: 'interval',
    precision: 'bar',
    absolute: false,
    notes: 'From a specific startpoint',
    collocations: ['since bar 8', 'from the beginning'],
  },
];

// =============================================================================
// Recurring Time — Frequency
// =============================================================================

export const RECURRING_PATTERNS: readonly TemporalExpression[] = [
  {
    id: 'gofai:temp:every_bar:recurring' as GofaiId,
    forms: ['every bar', 'each bar'],
    category: 'recurring',
    precision: 'bar',
    absolute: false,
    notes: 'Once per bar',
    collocations: ['every bar', 'each bar'],
  },
  {
    id: 'gofai:temp:every_beat:recurring' as GofaiId,
    forms: ['every beat', 'each beat'],
    category: 'recurring',
    precision: 'beat',
    absolute: false,
    notes: 'Once per beat',
    collocations: ['every beat', 'each beat', 'on every beat'],
  },
  {
    id: 'gofai:temp:every_other_bar:recurring' as GofaiId,
    forms: ['every other bar', 'every second bar', 'alternate bars'],
    category: 'recurring',
    precision: 'bar',
    absolute: false,
    notes: 'Every second bar',
    collocations: ['every other bar', 'alternate bars'],
  },
  {
    id: 'gofai:temp:every_other_beat:recurring' as GofaiId,
    forms: ['every other beat', 'every second beat', 'alternate beats'],
    category: 'recurring',
    precision: 'beat',
    absolute: false,
    notes: 'Every second beat',
    collocations: ['every other beat', 'alternate beats'],
  },
  {
    id: 'gofai:temp:every_n_bars:recurring' as GofaiId,
    forms: ['every', 'every N bars'],
    category: 'recurring',
    precision: 'bar',
    absolute: false,
    notes: 'Regular interval of N bars',
    collocations: ['every 2 bars', 'every 4 bars', 'every 8 bars'],
  },
  {
    id: 'gofai:temp:twice_per:frequency' as GofaiId,
    forms: ['twice per', 'two times per'],
    category: 'frequency',
    precision: 'bar',
    absolute: false,
    notes: 'Two occurrences per unit',
    collocations: ['twice per bar', 'two times per section'],
  },
  {
    id: 'gofai:temp:n_times_per:frequency' as GofaiId,
    forms: ['N times per'],
    category: 'frequency',
    precision: 'bar',
    absolute: false,
    notes: 'N occurrences per unit',
    collocations: ['3 times per bar', '4 times per section'],
  },
  {
    id: 'gofai:temp:once:frequency' as GofaiId,
    forms: ['once', 'one time'],
    category: 'frequency',
    precision: 'approximate',
    absolute: false,
    notes: 'Single occurrence',
    collocations: ['once per verse', 'one time in the chorus'],
  },
];

// =============================================================================
// Phase Within Cycle
// =============================================================================

export const PHASE_EXPRESSIONS: readonly TemporalExpression[] = [
  {
    id: 'gofai:temp:first_half:phase' as GofaiId,
    forms: ['the first half', 'first half of'],
    category: 'phase',
    precision: 'section',
    absolute: false,
    notes: 'First 50% of duration',
    collocations: ['the first half of the verse', 'first half of the song'],
  },
  {
    id: 'gofai:temp:second_half:phase' as GofaiId,
    forms: ['the second half', 'second half of'],
    category: 'phase',
    precision: 'section',
    absolute: false,
    notes: 'Second 50% of duration',
    collocations: ['the second half of the verse', 'second half of the song'],
  },
  {
    id: 'gofai:temp:first_quarter:phase' as GofaiId,
    forms: ['the first quarter', 'first quarter of'],
    category: 'phase',
    precision: 'section',
    absolute: false,
    notes: 'First 25% of duration',
    collocations: ['the first quarter of the verse'],
  },
  {
    id: 'gofai:temp:last_quarter:phase' as GofaiId,
    forms: ['the last quarter', 'final quarter of'],
    category: 'phase',
    precision: 'section',
    absolute: false,
    notes: 'Last 25% of duration',
    collocations: ['the last quarter of the verse'],
  },
  {
    id: 'gofai:temp:halfway_through:phase' as GofaiId,
    forms: ['halfway through', 'midway through'],
    category: 'phase',
    precision: 'section',
    absolute: false,
    notes: 'At 50% point',
    collocations: ['halfway through the verse', 'midway through the song'],
  },
  {
    id: 'gofai:temp:early_in:phase' as GofaiId,
    forms: ['early in', 'near the start of'],
    category: 'phase',
    precision: 'section',
    absolute: false,
    notes: 'In first ~25% of duration',
    collocations: ['early in the verse', 'near the start of the chorus'],
  },
  {
    id: 'gofai:temp:late_in:phase' as GofaiId,
    forms: ['late in', 'near the end of'],
    category: 'phase',
    precision: 'section',
    absolute: false,
    notes: 'In last ~25% of duration',
    collocations: ['late in the verse', 'near the end of the chorus'],
  },
];

// =============================================================================
// Boundary Time — Song Structure
// =============================================================================

export const BOUNDARY_EXPRESSIONS: readonly TemporalExpression[] = [
  {
    id: 'gofai:temp:at_start:absolute_boundary' as GofaiId,
    forms: ['at the start', 'at the beginning', 'from the start'],
    category: 'boundary',
    precision: 'section',
    absolute: true,
    notes: 'Very first moment of project',
    collocations: ['at the start', 'at the beginning', 'from the start'],
  },
  {
    id: 'gofai:temp:at_end:absolute_boundary' as GofaiId,
    forms: ['at the end', 'at the close', 'at the finish'],
    category: 'boundary',
    precision: 'section',
    absolute: true,
    notes: 'Very last moment of project',
    collocations: ['at the end', 'at the close', 'at the finish'],
  },
  {
    id: 'gofai:temp:from_beginning:interval' as GofaiId,
    forms: ['from the beginning', 'from start to finish'],
    category: 'interval',
    precision: 'section',
    absolute: true,
    notes: 'Entire project duration',
    collocations: ['from the beginning', 'from start to finish'],
  },
  {
    id: 'gofai:temp:to_end:interval' as GofaiId,
    forms: ['to the end', 'till the end', 'through to the end'],
    category: 'interval',
    precision: 'section',
    absolute: false,
    notes: 'From current point to end',
    collocations: ['to the end', 'till the end'],
  },
];

// =============================================================================
// Relative Temporal Ordering
// =============================================================================

export const RELATIVE_ORDERING: readonly TemporalExpression[] = [
  {
    id: 'gofai:temp:before:relative' as GofaiId,
    forms: ['before', 'prior to'],
    category: 'relative',
    precision: 'approximate',
    absolute: false,
    notes: 'Earlier than reference point',
    collocations: ['before the drop', 'prior to the verse'],
  },
  {
    id: 'gofai:temp:after:relative' as GofaiId,
    forms: ['after', 'following', 'subsequent to'],
    category: 'relative',
    precision: 'approximate',
    absolute: false,
    notes: 'Later than reference point',
    collocations: ['after the chorus', 'following the bridge'],
  },
  {
    id: 'gofai:temp:during:coincident' as GofaiId,
    forms: ['during', 'while', 'as'],
    category: 'relative',
    precision: 'approximate',
    absolute: false,
    notes: 'Coinciding with reference',
    collocations: ['during the verse', 'while the bass plays'],
  },
  {
    id: 'gofai:temp:right_before:immediate' as GofaiId,
    forms: ['right before', 'immediately before', 'just before'],
    category: 'relative',
    precision: 'beat',
    absolute: false,
    notes: 'Immediately preceding',
    collocations: ['right before the drop', 'just before beat 4'],
  },
  {
    id: 'gofai:temp:right_after:immediate' as GofaiId,
    forms: ['right after', 'immediately after', 'just after'],
    category: 'relative',
    precision: 'beat',
    absolute: false,
    notes: 'Immediately following',
    collocations: ['right after the chorus', 'just after beat 1'],
  },
  {
    id: 'gofai:temp:between:bounded' as GofaiId,
    forms: ['between'],
    category: 'interval',
    precision: 'bar',
    absolute: false,
    notes: 'In the interval between two points',
    collocations: ['between bar 4 and 8', 'between the verses'],
  },
];

// =============================================================================
// Approximate Time
// =============================================================================

export const APPROXIMATE_TIME: readonly TemporalExpression[] = [
  {
    id: 'gofai:temp:around:approximate' as GofaiId,
    forms: ['around', 'about', 'roughly'],
    category: 'point',
    precision: 'approximate',
    absolute: false,
    notes: 'Approximate time point',
    collocations: ['around bar 8', 'about 2 minutes in', 'roughly halfway'],
  },
  {
    id: 'gofai:temp:somewhere:vague' as GofaiId,
    forms: ['somewhere', 'somewhere in', 'somewhere around'],
    category: 'point',
    precision: 'approximate',
    absolute: false,
    notes: 'Vague location in time',
    collocations: ['somewhere in the verse', 'somewhere around bar 16'],
  },
  {
    id: 'gofai:temp:near:proximity' as GofaiId,
    forms: ['near', 'close to'],
    category: 'point',
    precision: 'approximate',
    absolute: false,
    notes: 'In proximity to time point',
    collocations: ['near the end', 'close to bar 8'],
  },
];

// =============================================================================
// Subdivision-Specific Time
// =============================================================================

export const SUBDIVISION_TIME: readonly TemporalExpression[] = [
  {
    id: 'gofai:temp:on_sixteenth:subdivision' as GofaiId,
    forms: ['on the sixteenth', 'on sixteenths', 'every sixteenth note'],
    category: 'point',
    precision: 'subdiv',
    absolute: false,
    notes: '16th note grid',
    collocations: ['on the sixteenth', 'on sixteenths'],
  },
  {
    id: 'gofai:temp:on_eighth:subdivision' as GofaiId,
    forms: ['on the eighth', 'on eighths', 'every eighth note'],
    category: 'point',
    precision: 'subdiv',
    absolute: false,
    notes: '8th note grid',
    collocations: ['on the eighth', 'on eighths'],
  },
  {
    id: 'gofai:temp:on_quarter:subdivision' as GofaiId,
    forms: ['on the quarter', 'on quarters', 'every quarter note'],
    category: 'point',
    precision: 'beat',
    absolute: false,
    notes: 'Quarter note grid (beat)',
    collocations: ['on the quarter', 'on quarters'],
  },
  {
    id: 'gofai:temp:on_triplet:subdivision' as GofaiId,
    forms: ['on triplets', 'on the triplet', 'every triplet'],
    category: 'point',
    precision: 'subdiv',
    absolute: false,
    notes: 'Triplet subdivision',
    collocations: ['on triplets', 'on the triplet'],
  },
  {
    id: 'gofai:temp:on_off_beat:subdivision' as GofaiId,
    forms: ['on the off-beat', 'on off-beats', 'off the beat'],
    category: 'point',
    precision: 'subdiv',
    absolute: false,
    notes: 'Between beats (syncopated)',
    collocations: ['on the off-beat', 'on off-beats'],
  },
  {
    id: 'gofai:temp:on_grid:subdivision' as GofaiId,
    forms: ['on the grid', 'on grid', 'quantized'],
    category: 'point',
    precision: 'subdiv',
    absolute: false,
    notes: 'Aligned to quantization grid',
    collocations: ['on the grid', 'on grid points'],
  },
  {
    id: 'gofai:temp:off_grid:subdivision' as GofaiId,
    forms: ['off the grid', 'off grid', 'unquantized'],
    category: 'point',
    precision: 'tick',
    absolute: false,
    notes: 'Not aligned to grid (human feel)',
    collocations: ['off the grid', 'off grid timing'],
  },
];

// =============================================================================
// Special Musical Time
// =============================================================================

export const SPECIAL_MUSICAL_TIME: readonly TemporalExpression[] = [
  {
    id: 'gofai:temp:on_one:special' as GofaiId,
    forms: ['on the one', 'on one'],
    category: 'point',
    precision: 'beat',
    absolute: false,
    notes: 'First beat of bar (funk/R&B emphasis)',
    collocations: ['on the one', 'hit on one'],
  },
  {
    id: 'gofai:temp:on_and_of:subdivision' as GofaiId,
    forms: ['on the and', 'on the and of'],
    category: 'point',
    precision: 'subdiv',
    absolute: false,
    notes: 'Off-beat 8th notes ("1 and 2 and")',
    collocations: ['on the and of 2', 'on the and'],
  },
  {
    id: 'gofai:temp:pickup:special' as GofaiId,
    forms: ['on the pickup', 'in the pickup', 'pickup bar'],
    category: 'point',
    precision: 'bar',
    absolute: false,
    notes: 'Anacrusis before section',
    collocations: ['on the pickup', 'in the pickup bar'],
  },
  {
    id: 'gofai:temp:turnaround:special' as GofaiId,
    forms: ['in the turnaround', 'during the turnaround'],
    category: 'interval',
    precision: 'bar',
    absolute: false,
    notes: 'Final bar(s) leading back to start',
    collocations: ['in the turnaround', 'during the turnaround'],
  },
];

// =============================================================================
// Aggregated Collections
// =============================================================================

/** All absolute time points */
export const ALL_ABSOLUTE_TIME_POINTS = ABSOLUTE_TIME_POINTS;

/** All section-relative time points */
export const ALL_SECTION_TIME_POINTS = SECTION_TIME_POINTS;

/** All event-relative time points */
export const ALL_EVENT_TIME_POINTS = EVENT_TIME_POINTS;

/** All duration intervals */
export const ALL_DURATION_INTERVALS = DURATION_INTERVALS;

/** All recurring patterns */
export const ALL_RECURRING_PATTERNS = RECURRING_PATTERNS;

/** All phase expressions */
export const ALL_PHASE_EXPRESSIONS = PHASE_EXPRESSIONS;

/** All boundary expressions */
export const ALL_BOUNDARY_EXPRESSIONS = BOUNDARY_EXPRESSIONS;

/** All relative ordering */
export const ALL_RELATIVE_ORDERING = RELATIVE_ORDERING;

/** All approximate time */
export const ALL_APPROXIMATE_TIME = APPROXIMATE_TIME;

/** All subdivision-specific time */
export const ALL_SUBDIVISION_TIME = SUBDIVISION_TIME;

/** All special musical time */
export const ALL_SPECIAL_MUSICAL_TIME = SPECIAL_MUSICAL_TIME;

/**
 * All temporal expressions in this batch
 */
export const ALL_TEMPORAL_EXPRESSIONS: readonly TemporalExpression[] = [
  ...ABSOLUTE_TIME_POINTS,
  ...SECTION_TIME_POINTS,
  ...EVENT_TIME_POINTS,
  ...DURATION_INTERVALS,
  ...RECURRING_PATTERNS,
  ...PHASE_EXPRESSIONS,
  ...BOUNDARY_EXPRESSIONS,
  ...RELATIVE_ORDERING,
  ...APPROXIMATE_TIME,
  ...SUBDIVISION_TIME,
  ...SPECIAL_MUSICAL_TIME,
];

// =============================================================================
// Lookup Helpers
// =============================================================================

/**
 * Find temporal expressions by form
 */
export function findByForm(form: string): readonly TemporalExpression[] {
  const normalized = form.toLowerCase().trim();
  return ALL_TEMPORAL_EXPRESSIONS.filter(t =>
    t.forms.some(f => f.toLowerCase() === normalized)
  );
}

/**
 * Find temporal expressions by category
 */
export function findByCategory(
  category: TemporalCategory
): readonly TemporalExpression[] {
  return ALL_TEMPORAL_EXPRESSIONS.filter(t => t.category === category);
}

/**
 * Find temporal expressions by precision
 */
export function findByPrecision(
  precision: TemporalPrecision
): readonly TemporalExpression[] {
  return ALL_TEMPORAL_EXPRESSIONS.filter(t => t.precision === precision);
}

/**
 * Find absolute temporal expressions
 */
export function findAbsolute(): readonly TemporalExpression[] {
  return ALL_TEMPORAL_EXPRESSIONS.filter(t => t.absolute === true);
}

/**
 * Find relative temporal expressions
 */
export function findRelative(): readonly TemporalExpression[] {
  return ALL_TEMPORAL_EXPRESSIONS.filter(t => t.absolute === false);
}

// =============================================================================
// Statistics and Metadata
// =============================================================================

/**
 * Statistics about this vocabulary batch
 */
export const TEMPORAL_EXPRESSIONS_STATS = {
  absoluteTimePoints: ABSOLUTE_TIME_POINTS.length,
  sectionTimePoints: SECTION_TIME_POINTS.length,
  eventTimePoints: EVENT_TIME_POINTS.length,
  durationIntervals: DURATION_INTERVALS.length,
  recurringPatterns: RECURRING_PATTERNS.length,
  phaseExpressions: PHASE_EXPRESSIONS.length,
  boundaryExpressions: BOUNDARY_EXPRESSIONS.length,
  relativeOrdering: RELATIVE_ORDERING.length,
  approximateTime: APPROXIMATE_TIME.length,
  subdivisionTime: SUBDIVISION_TIME.length,
  specialMusicalTime: SPECIAL_MUSICAL_TIME.length,
  total: ALL_TEMPORAL_EXPRESSIONS.length,
  
  byCategory: {
    point: ALL_TEMPORAL_EXPRESSIONS.filter(t => t.category === 'point').length,
    interval: ALL_TEMPORAL_EXPRESSIONS.filter(t => t.category === 'interval').length,
    recurring: ALL_TEMPORAL_EXPRESSIONS.filter(t => t.category === 'recurring').length,
    relative: ALL_TEMPORAL_EXPRESSIONS.filter(t => t.category === 'relative').length,
    boundary: ALL_TEMPORAL_EXPRESSIONS.filter(t => t.category === 'boundary').length,
    frequency: ALL_TEMPORAL_EXPRESSIONS.filter(t => t.category === 'frequency').length,
    phase: ALL_TEMPORAL_EXPRESSIONS.filter(t => t.category === 'phase').length,
  },
  
  byPrecision: {
    tick: ALL_TEMPORAL_EXPRESSIONS.filter(t => t.precision === 'tick').length,
    subdiv: ALL_TEMPORAL_EXPRESSIONS.filter(t => t.precision === 'subdiv').length,
    beat: ALL_TEMPORAL_EXPRESSIONS.filter(t => t.precision === 'beat').length,
    bar: ALL_TEMPORAL_EXPRESSIONS.filter(t => t.precision === 'bar').length,
    section: ALL_TEMPORAL_EXPRESSIONS.filter(t => t.precision === 'section').length,
    event: ALL_TEMPORAL_EXPRESSIONS.filter(t => t.precision === 'event').length,
    approximate: ALL_TEMPORAL_EXPRESSIONS.filter(t => t.precision === 'approximate').length,
  },
  
  absolute: ALL_TEMPORAL_EXPRESSIONS.filter(t => t.absolute === true).length,
  relative: ALL_TEMPORAL_EXPRESSIONS.filter(t => t.absolute === false).length,
} as const;

/**
 * Coverage summary
 */
export const COVERAGE_SUMMARY = `
Temporal Expressions Batch 33 Coverage:
- Absolute Time Points: ${TEMPORAL_EXPRESSIONS_STATS.absoluteTimePoints}
- Section Time Points: ${TEMPORAL_EXPRESSIONS_STATS.sectionTimePoints}
- Event Time Points: ${TEMPORAL_EXPRESSIONS_STATS.eventTimePoints}
- Duration Intervals: ${TEMPORAL_EXPRESSIONS_STATS.durationIntervals}
- Recurring Patterns: ${TEMPORAL_EXPRESSIONS_STATS.recurringPatterns}
- Phase Expressions: ${TEMPORAL_EXPRESSIONS_STATS.phaseExpressions}
- Boundary Expressions: ${TEMPORAL_EXPRESSIONS_STATS.boundaryExpressions}
- Relative Ordering: ${TEMPORAL_EXPRESSIONS_STATS.relativeOrdering}
- Approximate Time: ${TEMPORAL_EXPRESSIONS_STATS.approximateTime}
- Subdivision Time: ${TEMPORAL_EXPRESSIONS_STATS.subdivisionTime}
- Special Musical Time: ${TEMPORAL_EXPRESSIONS_STATS.specialMusicalTime}
- TOTAL: ${TEMPORAL_EXPRESSIONS_STATS.total} temporal expressions

By Category:
- Point: ${TEMPORAL_EXPRESSIONS_STATS.byCategory.point}
- Interval: ${TEMPORAL_EXPRESSIONS_STATS.byCategory.interval}
- Recurring: ${TEMPORAL_EXPRESSIONS_STATS.byCategory.recurring}
- Relative: ${TEMPORAL_EXPRESSIONS_STATS.byCategory.relative}
- Boundary: ${TEMPORAL_EXPRESSIONS_STATS.byCategory.boundary}
- Frequency: ${TEMPORAL_EXPRESSIONS_STATS.byCategory.frequency}
- Phase: ${TEMPORAL_EXPRESSIONS_STATS.byCategory.phase}

By Precision:
- Tick: ${TEMPORAL_EXPRESSIONS_STATS.byPrecision.tick}
- Subdivision: ${TEMPORAL_EXPRESSIONS_STATS.byPrecision.subdiv}
- Beat: ${TEMPORAL_EXPRESSIONS_STATS.byPrecision.beat}
- Bar: ${TEMPORAL_EXPRESSIONS_STATS.byPrecision.bar}
- Section: ${TEMPORAL_EXPRESSIONS_STATS.byPrecision.section}
- Event: ${TEMPORAL_EXPRESSIONS_STATS.byPrecision.event}
- Approximate: ${TEMPORAL_EXPRESSIONS_STATS.byPrecision.approximate}

Absolute vs Relative:
- Absolute: ${TEMPORAL_EXPRESSIONS_STATS.absolute}
- Relative: ${TEMPORAL_EXPRESSIONS_STATS.relative}

This provides comprehensive coverage of temporal expressions essential for musical timing and sequencing in natural language.
`.trim();
