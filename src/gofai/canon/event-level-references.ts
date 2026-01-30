/**
 * GOFAI Canon — Event-Level References in Natural Language
 *
 * Specifies how users refer to individual or groups of musical events
 * in natural language, and how those references map to EventSelectors.
 *
 * Event-level references are the most granular form of scope selection.
 * Users rarely reference events by ID — instead they use patterns like:
 *   - "the last note"
 *   - "the downbeats"
 *   - "every other bar"
 *   - "the high notes in the chorus"
 *   - "the ghost notes on the hi-hat"
 *
 * This module defines:
 *   1. The canonical vocabulary of event reference patterns
 *   2. Disambiguation rules when patterns are ambiguous
 *   3. Scoping rules for narrowing event references
 *   4. Display formatting for showing matched events to users
 *
 * @module gofai/canon/event-level-references
 * @see gofai_goalA.md Step 074
 * @see gofaimusicplus.md §3.3 — Scope is a selector over Event<P>
 */

import type { EventSelector } from './event-selector';

// =============================================================================
// EVENT REFERENCE PATTERN TYPES
// =============================================================================

/**
 * A canonical event reference pattern.
 *
 * Each pattern describes a way users refer to events in natural language,
 * along with the corresponding EventSelector construction.
 */
export interface EventReferencePattern {
  readonly id: string;
  readonly category: EventReferenceCategory;
  readonly patterns: readonly string[];
  readonly description: string;
  readonly selectorTemplate: string;
  readonly requiresScope: boolean;
  readonly requiresContext: boolean;
  readonly disambiguation: readonly string[];
  readonly examples: readonly EventReferenceExample[];
}

/**
 * Categories of event references.
 */
export type EventReferenceCategory =
  | 'positional'    // "the first note", "the last chord"
  | 'rhythmic'      // "the downbeats", "every other bar"
  | 'pitch_based'   // "the high notes", "the bass notes"
  | 'velocity_based' // "the loud notes", "the ghost notes"
  | 'duration_based' // "the long notes", "the short notes"
  | 'role_based'    // "the melody", "the accompaniment"
  | 'pattern_based' // "the arpeggios", "the runs"
  | 'articulation'  // "the staccato notes", "the legato passages"
  | 'group_based'   // "all notes", "every note", "each beat"
  | 'relative'      // "the next note", "the previous chord"
  | 'contrastive';  // "the other notes", "everything else"

/**
 * An example of an event reference in context.
 */
export interface EventReferenceExample {
  readonly input: string;
  readonly scope: string;
  readonly resolvedTo: string;
  readonly eventCount: string;
}

// =============================================================================
// CANONICAL EVENT REFERENCE PATTERNS
// =============================================================================

/**
 * All canonical event reference patterns.
 */
export const EVENT_REFERENCE_PATTERNS: readonly EventReferencePattern[] = [
  // ===== Positional References =====
  {
    id: 'evref-001',
    category: 'positional',
    patterns: ['the first note', 'the opening note', 'the initial note'],
    description: 'The first note event in the current scope',
    selectorTemplate: 'first(1, byKind("note"))',
    requiresScope: false,
    requiresContext: false,
    disambiguation: ['If scope is ambiguous, default to the entire project'],
    examples: [
      {
        input: 'hold the first note longer',
        scope: 'whole project',
        resolvedTo: 'The very first note event',
        eventCount: '1',
      },
      {
        input: 'make the first note in the chorus louder',
        scope: 'Chorus 1',
        resolvedTo: 'First note event in Chorus 1',
        eventCount: '1',
      },
    ],
  },
  {
    id: 'evref-002',
    category: 'positional',
    patterns: ['the last note', 'the final note', 'the ending note'],
    description: 'The last note event in the current scope',
    selectorTemplate: 'last(1, byKind("note"))',
    requiresScope: false,
    requiresContext: false,
    disambiguation: ['If scope is ambiguous, default to the entire project'],
    examples: [
      {
        input: 'hold the last note',
        scope: 'whole project',
        resolvedTo: 'The very last note event',
        eventCount: '1',
      },
    ],
  },
  {
    id: 'evref-003',
    category: 'positional',
    patterns: ['the {ordinal} note', 'note {n}', 'the {ordinal} chord'],
    description: 'The Nth note or chord by position',
    selectorTemplate: 'slice(byKind("note"), n-1, 1)',
    requiresScope: true,
    requiresContext: false,
    disambiguation: [
      'Ordinals are counted from the start of the current scope',
      '"The third note" = the third note event, not the third bar',
    ],
    examples: [
      {
        input: 'raise the third note up an octave',
        scope: 'current section',
        resolvedTo: 'Third note event in scope',
        eventCount: '1',
      },
    ],
  },
  {
    id: 'evref-004',
    category: 'positional',
    patterns: ['the first {n} notes', 'the opening {n} notes'],
    description: 'The first N note events',
    selectorTemplate: 'first(n, byKind("note"))',
    requiresScope: false,
    requiresContext: false,
    disambiguation: [],
    examples: [
      {
        input: 'make the first 4 notes louder',
        scope: 'current section',
        resolvedTo: 'First 4 note events',
        eventCount: '4',
      },
    ],
  },
  {
    id: 'evref-005',
    category: 'positional',
    patterns: ['the last {n} notes', 'the final {n} notes', 'the ending {n} notes'],
    description: 'The last N note events',
    selectorTemplate: 'last(n, byKind("note"))',
    requiresScope: false,
    requiresContext: false,
    disambiguation: [],
    examples: [
      {
        input: 'slow down the last 3 notes',
        scope: 'whole project',
        resolvedTo: 'Last 3 note events',
        eventCount: '3',
      },
    ],
  },

  // ===== Rhythmic References =====
  {
    id: 'evref-010',
    category: 'rhythmic',
    patterns: ['the downbeats', 'every downbeat', 'on the downbeats', 'beat one'],
    description: 'Events on the first beat of each bar',
    selectorTemplate: 'byPattern("downbeat")',
    requiresScope: false,
    requiresContext: false,
    disambiguation: [
      'In compound time (6/8), the downbeat is beat 1 only (not beat 4)',
    ],
    examples: [
      {
        input: 'accent the downbeats',
        scope: 'whole project',
        resolvedTo: 'Events on beat 1 of every bar',
        eventCount: 'varies',
      },
    ],
  },
  {
    id: 'evref-011',
    category: 'rhythmic',
    patterns: ['the backbeat', 'beats 2 and 4', 'the snare beats'],
    description: 'Events on beats 2 and 4 in 4/4',
    selectorTemplate: 'byPattern("backbeat")',
    requiresScope: false,
    requiresContext: false,
    disambiguation: [
      'Only meaningful in 4/4 or 2/4 time',
      'In 3/4, there is no standard backbeat — ask for clarification',
    ],
    examples: [
      {
        input: 'accent the backbeat',
        scope: 'drums track',
        resolvedTo: 'Events on beats 2 and 4',
        eventCount: 'varies',
      },
    ],
  },
  {
    id: 'evref-012',
    category: 'rhythmic',
    patterns: ['every other note', 'alternate notes', 'every second note'],
    description: 'Every second note event (1st, 3rd, 5th, ...)',
    selectorTemplate: 'everyNth(2, byKind("note"))',
    requiresScope: true,
    requiresContext: false,
    disambiguation: [
      'Default starts from the first note (offset 0)',
      '"Every other note starting from the second" → offset 1',
    ],
    examples: [
      {
        input: 'remove every other note',
        scope: 'current layer',
        resolvedTo: 'Notes at positions 1, 3, 5, ...',
        eventCount: 'half of total',
      },
    ],
  },
  {
    id: 'evref-013',
    category: 'rhythmic',
    patterns: ['every other bar', 'alternate bars', 'odd bars', 'even bars'],
    description: 'Events in alternating bars',
    selectorTemplate: 'byPattern("every_other_bar")',
    requiresScope: false,
    requiresContext: false,
    disambiguation: [
      '"Odd bars" = bars 1, 3, 5, ...',
      '"Even bars" = bars 2, 4, 6, ...',
    ],
    examples: [
      {
        input: 'mute every other bar',
        scope: 'drums track',
        resolvedTo: 'Events in bars 1, 3, 5, ...',
        eventCount: 'varies',
      },
    ],
  },
  {
    id: 'evref-014',
    category: 'rhythmic',
    patterns: ['the syncopations', 'the syncopated notes', 'the off-beat notes'],
    description: 'Events that fall between the main beats',
    selectorTemplate: 'byPattern("syncopation")',
    requiresScope: false,
    requiresContext: false,
    disambiguation: [
      'Syncopation = events not aligned to the main beat grid',
      'Does not include events on the "and" in swing feel',
    ],
    examples: [
      {
        input: 'straighten out the syncopations',
        scope: 'bass track',
        resolvedTo: 'Off-beat events',
        eventCount: 'varies',
      },
    ],
  },
  {
    id: 'evref-015',
    category: 'rhythmic',
    patterns: ['the triplets', 'triplet notes', 'the triplet feel'],
    description: 'Events in triplet subdivisions',
    selectorTemplate: 'byPattern("triplet")',
    requiresScope: true,
    requiresContext: false,
    disambiguation: [
      'Includes quarter, eighth, and sixteenth note triplets',
    ],
    examples: [
      {
        input: 'make the triplets more even',
        scope: 'piano track',
        resolvedTo: 'Events in triplet positions',
        eventCount: 'varies',
      },
    ],
  },

  // ===== Pitch-Based References =====
  {
    id: 'evref-020',
    category: 'pitch_based',
    patterns: ['the high notes', 'the upper notes', 'the top notes', 'notes up high'],
    description: 'Notes in the high register (MIDI 84–127)',
    selectorTemplate: 'and(byKind("note"), byPitchRange("high"))',
    requiresScope: false,
    requiresContext: false,
    disambiguation: [
      '"High" means MIDI 84+ by default',
      'Context may shift the boundary (e.g., for bass, "high" might mean MIDI 60+)',
    ],
    examples: [
      {
        input: 'lower the high notes by an octave',
        scope: 'melody track',
        resolvedTo: 'Notes with MIDI ≥ 84',
        eventCount: 'varies',
      },
    ],
  },
  {
    id: 'evref-021',
    category: 'pitch_based',
    patterns: ['the low notes', 'the bottom notes', 'the bass notes'],
    description: 'Notes in the low register (MIDI 0–47)',
    selectorTemplate: 'and(byKind("note"), byPitchRange("low"))',
    requiresScope: false,
    requiresContext: false,
    disambiguation: [
      '"Low" means MIDI 0–47 by default',
      '"Bass notes" is ambiguous between pitch range and bass track — use context',
    ],
    examples: [
      {
        input: 'bring up the low notes',
        scope: 'current layer',
        resolvedTo: 'Notes with MIDI ≤ 47',
        eventCount: 'varies',
      },
    ],
  },
  {
    id: 'evref-022',
    category: 'pitch_based',
    patterns: ['the middle notes', 'the mid-range notes'],
    description: 'Notes in the middle register (MIDI 60–71)',
    selectorTemplate: 'and(byKind("note"), byPitchRange("mid"))',
    requiresScope: false,
    requiresContext: false,
    disambiguation: [],
    examples: [
      {
        input: 'thin out the middle notes',
        scope: 'piano track',
        resolvedTo: 'Notes with MIDI 60–71',
        eventCount: 'varies',
      },
    ],
  },

  // ===== Velocity-Based References =====
  {
    id: 'evref-030',
    category: 'velocity_based',
    patterns: ['the loud notes', 'the heavy hits', 'the strong notes', 'the accents'],
    description: 'Events with high velocity (91–127)',
    selectorTemplate: 'byVelocity("loud")',
    requiresScope: false,
    requiresContext: false,
    disambiguation: [
      '"Accents" may refer to velocity OR articulation — prefer velocity',
    ],
    examples: [
      {
        input: 'soften the loud notes',
        scope: 'drums track',
        resolvedTo: 'Events with velocity ≥ 91',
        eventCount: 'varies',
      },
    ],
  },
  {
    id: 'evref-031',
    category: 'velocity_based',
    patterns: ['the soft notes', 'the quiet notes', 'the gentle notes'],
    description: 'Events with low velocity (1–60)',
    selectorTemplate: 'byVelocity("soft")',
    requiresScope: false,
    requiresContext: false,
    disambiguation: [],
    examples: [
      {
        input: 'bring up the soft notes',
        scope: 'current layer',
        resolvedTo: 'Events with velocity ≤ 60',
        eventCount: 'varies',
      },
    ],
  },
  {
    id: 'evref-032',
    category: 'velocity_based',
    patterns: ['the ghost notes', 'the barely-there notes', 'the whisper notes'],
    description: 'Events with very low velocity (1–30)',
    selectorTemplate: 'byVelocity("ghost")',
    requiresScope: false,
    requiresContext: false,
    disambiguation: [
      'Ghost notes are a specific drumming technique with velocity ≤ 30',
    ],
    examples: [
      {
        input: 'make the ghost notes a bit louder',
        scope: 'drums track',
        resolvedTo: 'Events with velocity ≤ 30',
        eventCount: 'varies',
      },
    ],
  },

  // ===== Duration-Based References =====
  {
    id: 'evref-040',
    category: 'duration_based',
    patterns: ['the long notes', 'the sustained notes', 'the held notes'],
    description: 'Notes with duration > 2 beats',
    selectorTemplate: 'byDuration("long")',
    requiresScope: false,
    requiresContext: false,
    disambiguation: [
      '"Long" is relative to the context (e.g., in a fast passage, a quarter note might be "long")',
    ],
    examples: [
      {
        input: 'shorten the long notes',
        scope: 'strings track',
        resolvedTo: 'Notes with duration > 2 beats',
        eventCount: 'varies',
      },
    ],
  },
  {
    id: 'evref-041',
    category: 'duration_based',
    patterns: ['the short notes', 'the quick notes', 'the brief notes'],
    description: 'Notes with duration < 0.5 beats',
    selectorTemplate: 'byDuration("short")',
    requiresScope: false,
    requiresContext: false,
    disambiguation: [],
    examples: [
      {
        input: 'make the short notes even shorter',
        scope: 'current layer',
        resolvedTo: 'Notes with duration < 0.5 beats',
        eventCount: 'varies',
      },
    ],
  },

  // ===== Role-Based References =====
  {
    id: 'evref-050',
    category: 'role_based',
    patterns: ['the melody', 'the melodic line', 'the lead melody', 'the tune'],
    description: 'Events tagged with the melody role',
    selectorTemplate: 'byRole("melody")',
    requiresScope: false,
    requiresContext: false,
    disambiguation: [
      '"The melody" on a specific track means the melodic content of that track',
      'If multiple tracks have melody content, ask for clarification',
    ],
    examples: [
      {
        input: 'make the melody brighter',
        scope: 'whole project',
        resolvedTo: 'Events with melody role',
        eventCount: 'varies',
      },
    ],
  },
  {
    id: 'evref-051',
    category: 'role_based',
    patterns: ['the bass line', 'the bass part', 'the low end'],
    description: 'Events tagged with the bass role',
    selectorTemplate: 'byRole("bass")',
    requiresScope: false,
    requiresContext: false,
    disambiguation: [
      '"Bass line" = role-based selection, NOT the bass track/layer',
      'If the user says "the bass", prefer track interpretation',
    ],
    examples: [
      {
        input: 'simplify the bass line',
        scope: 'bass track',
        resolvedTo: 'Events with bass role',
        eventCount: 'varies',
      },
    ],
  },
  {
    id: 'evref-052',
    category: 'role_based',
    patterns: ['the harmony', 'the harmonies', 'the harmonic content', 'the chords'],
    description: 'Events tagged with the harmony role',
    selectorTemplate: 'byRole("harmony")',
    requiresScope: false,
    requiresContext: false,
    disambiguation: [
      '"The chords" may mean chord events OR harmony role — prefer chord events',
    ],
    examples: [
      {
        input: 'enrich the harmony',
        scope: 'piano track',
        resolvedTo: 'Events with harmony role',
        eventCount: 'varies',
      },
    ],
  },

  // ===== Group-Based References =====
  {
    id: 'evref-060',
    category: 'group_based',
    patterns: ['all notes', 'every note', 'each note', 'all the notes'],
    description: 'All note events in the current scope',
    selectorTemplate: 'byKind("note")',
    requiresScope: false,
    requiresContext: false,
    disambiguation: [],
    examples: [
      {
        input: 'make all notes louder',
        scope: 'current section',
        resolvedTo: 'Every note event in scope',
        eventCount: 'all',
      },
    ],
  },
  {
    id: 'evref-061',
    category: 'group_based',
    patterns: ['everything', 'all events', 'the whole thing', 'all of it'],
    description: 'All events in the current scope',
    selectorTemplate: 'allEvents()',
    requiresScope: false,
    requiresContext: false,
    disambiguation: [
      '"Everything" defaults to current scope, not the whole project',
      'If no scope is set, asks "Do you mean the entire project?"',
    ],
    examples: [
      {
        input: 'transpose everything up',
        scope: 'current section',
        resolvedTo: 'All events in scope',
        eventCount: 'all',
      },
    ],
  },

  // ===== Relative References =====
  {
    id: 'evref-070',
    category: 'relative',
    patterns: ['the next note', 'the following note'],
    description: 'The note event immediately after the current focus',
    selectorTemplate: 'neighbors("after", 1, contextual("deictic_selection"))',
    requiresScope: false,
    requiresContext: true,
    disambiguation: [
      '"Next" requires a current position or selection context',
    ],
    examples: [
      {
        input: 'make the next note louder',
        scope: 'from current position',
        resolvedTo: 'Next note after current position',
        eventCount: '1',
      },
    ],
  },
  {
    id: 'evref-071',
    category: 'relative',
    patterns: ['the previous note', 'the note before', 'the preceding note'],
    description: 'The note event immediately before the current focus',
    selectorTemplate: 'neighbors("before", 1, contextual("deictic_selection"))',
    requiresScope: false,
    requiresContext: true,
    disambiguation: [
      '"Previous" requires a current position or selection context',
    ],
    examples: [
      {
        input: 'delete the previous note',
        scope: 'from current position',
        resolvedTo: 'Note before current position',
        eventCount: '1',
      },
    ],
  },

  // ===== Contrastive References =====
  {
    id: 'evref-080',
    category: 'contrastive',
    patterns: ['the other notes', 'the rest of the notes', 'everything else'],
    description: 'All events NOT in the current selection/focus',
    selectorTemplate: 'not(contextual("deictic_selection"))',
    requiresScope: false,
    requiresContext: true,
    disambiguation: [
      '"The other notes" requires knowing what the "non-other" notes are',
      'Resolves to NOT(current selection or last mentioned)',
    ],
    examples: [
      {
        input: 'keep these and delete the other notes',
        scope: 'current layer',
        resolvedTo: 'Notes NOT in current selection',
        eventCount: 'varies',
      },
    ],
  },
  {
    id: 'evref-081',
    category: 'contrastive',
    patterns: ['everything except the drums', 'all but the drums', 'everything besides the drums'],
    description: 'All events except those on the specified layer',
    selectorTemplate: 'not(onLayer("{layer}"))',
    requiresScope: false,
    requiresContext: false,
    disambiguation: [],
    examples: [
      {
        input: 'make everything except the drums quieter',
        scope: 'whole project',
        resolvedTo: 'All events not on drums',
        eventCount: 'varies',
      },
    ],
  },
];

// =============================================================================
// DISAMBIGUATION RULES
// =============================================================================

/**
 * Disambiguation rules for event references.
 */
export interface EventRefDisambiguationRule {
  readonly id: string;
  readonly ambiguousPattern: string;
  readonly possibleMeanings: readonly string[];
  readonly defaultMeaning: string;
  readonly contextClues: readonly string[];
  readonly clarificationQuestion: string;
}

/**
 * Canonical disambiguation rules for ambiguous event references.
 */
export const EVENT_REF_DISAMBIGUATION_RULES: readonly EventRefDisambiguationRule[] = [
  {
    id: 'disambig-001',
    ambiguousPattern: 'the bass notes',
    possibleMeanings: [
      'Notes in the low pitch range (pitch_based)',
      'Notes on the bass track (layer_based)',
      'Notes with the bass role (role_based)',
    ],
    defaultMeaning: 'Notes on the bass track (layer_based)',
    contextClues: [
      'If bass track exists → layer_based',
      'If no bass track but "bass notes" used with pitch context → pitch_based',
      'If discussing roles/parts → role_based',
    ],
    clarificationQuestion: 'Do you mean the notes on the bass track, or notes in the bass register?',
  },
  {
    id: 'disambig-002',
    ambiguousPattern: 'the accents',
    possibleMeanings: [
      'Notes with high velocity (velocity_based)',
      'Notes with accent articulation (articulation_based)',
    ],
    defaultMeaning: 'Notes with high velocity (velocity_based)',
    contextClues: [
      'In drums context → velocity_based',
      'In classical/notation context → articulation_based',
      'If discussing dynamics → velocity_based',
    ],
    clarificationQuestion: 'Do you mean the louder notes, or notes with accent markings?',
  },
  {
    id: 'disambig-003',
    ambiguousPattern: 'the chords',
    possibleMeanings: [
      'Chord events (simultaneous notes grouped as chords)',
      'All notes that form harmonies (role_based)',
    ],
    defaultMeaning: 'Chord events',
    contextClues: [
      'If track has explicit chord events → chord events',
      'If discussing harmony → role_based',
    ],
    clarificationQuestion: 'Do you mean the chord events, or all the notes forming harmonies?',
  },
  {
    id: 'disambig-004',
    ambiguousPattern: 'the melody',
    possibleMeanings: [
      'Events on the melody/lead track (layer_based)',
      'Events with melody role across all tracks (role_based)',
      'The highest note in each chord voicing (pitch_based)',
    ],
    defaultMeaning: 'Events on the melody/lead track (layer_based)',
    contextClues: [
      'If a melody track exists → layer_based',
      'If discussing voice leading → pitch_based (top voice)',
      'If discussing arrangement → role_based',
    ],
    clarificationQuestion: 'Do you mean the melody track, or the melodic line across all tracks?',
  },
];

// =============================================================================
// LOOKUP AND VALIDATION
// =============================================================================

/**
 * Look up an event reference pattern by natural language phrase.
 */
export function lookupEventReferencePattern(
  phrase: string
): EventReferencePattern | undefined {
  const normalized = phrase.toLowerCase().trim();

  for (const pattern of EVENT_REFERENCE_PATTERNS) {
    for (const p of pattern.patterns) {
      // Simple match: check if the phrase matches the pattern
      // (In a real system, this would use regex with placeholders)
      const patternLower = p.toLowerCase();
      if (normalized.includes(patternLower) || patternLower.includes(normalized)) {
        return pattern;
      }
    }
  }

  return undefined;
}

/**
 * Get all event reference patterns in a category.
 */
export function getEventReferencesByCategory(
  category: EventReferenceCategory
): readonly EventReferencePattern[] {
  return EVENT_REFERENCE_PATTERNS.filter(p => p.category === category);
}

/**
 * Get patterns that require context.
 */
export function getContextDependentPatterns(): readonly EventReferencePattern[] {
  return EVENT_REFERENCE_PATTERNS.filter(p => p.requiresContext);
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

/**
 * Rules governing event-level references.
 */
export const EVENT_REFERENCE_RULES: readonly {
  readonly id: string;
  readonly description: string;
  readonly rule: string;
}[] = [
  {
    id: 'evrefr-001',
    description: 'Event references are scoped',
    rule: '"The high notes" means the high notes IN THE CURRENT SCOPE. If the user specified "in the chorus", it means high notes in the chorus. If no scope is given, the current scope from the focus stack is used.',
  },
  {
    id: 'evrefr-002',
    description: 'Positional references are deterministic',
    rule: '"The first note" and "the last note" are always determined by chronological order within the scope. No randomness, no heuristics.',
  },
  {
    id: 'evrefr-003',
    description: 'Pattern references match by musical grid',
    rule: '"The downbeats" are strictly beat 1 of each bar. "The backbeat" is beats 2 and 4. These are determined by the time signature, not by event content.',
  },
  {
    id: 'evrefr-004',
    description: 'Velocity/pitch ranges use canonical boundaries',
    rule: 'Pitch and velocity ranges use the boundaries defined in PITCH_RANGE_BOUNDARIES and VELOCITY_RANGE_BOUNDARIES. These boundaries are stable across versions.',
  },
  {
    id: 'evrefr-005',
    description: 'Empty results trigger clarification',
    rule: 'If an event reference matches zero events in the current scope, the system must ask the user to adjust the scope or reference, not silently produce a no-op.',
  },
  {
    id: 'evrefr-006',
    description: 'Role-based references use track metadata',
    rule: '"The melody" resolves using track role tags, not pitch analysis. If no track has a "melody" role tag, the system asks for clarification rather than guessing.',
  },
  {
    id: 'evrefr-007',
    description: 'Relative references require context',
    rule: '"The next note" and "the previous note" require a current position (from playback cursor, selection, or last-edited position). Without context, they fail with a helpful suggestion.',
  },
  {
    id: 'evrefr-008',
    description: 'Contrastive references preserve the complement',
    rule: '"Everything except X" constructs NOT(X). "The other notes" constructs NOT(current_focus). The system must verify that the complement is non-empty.',
  },
];
