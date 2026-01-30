/**
 * GOFAI Pragmatics — Deictic Resolution Test Cases
 *
 * Encodes the canonical test cases for deictic resolution rules.
 * These tests validate that "this", "these", "here", "those" correctly
 * resolve to UI selection state, and that the system correctly
 * handles edge cases (stale selection, empty selection, etc.).
 *
 * Each test case specifies:
 *   - Input utterance
 *   - UI selection state
 *   - Expected resolution result
 *   - Rationale for the expected behavior
 *
 * @module gofai/pragmatics/deictic-resolution-tests
 * @see gofai_goalA.md Step 072
 * @see deictic-resolution.ts for the resolution logic
 */

// =============================================================================
// TEST CASE TYPES
// =============================================================================

/**
 * A deictic resolution test case.
 */
export interface DeicticTestCase {
  readonly id: string;
  readonly category: DeicticTestCategory;
  readonly input: string;
  readonly deicticWord: string;
  readonly selectionState: TestSelectionState;
  readonly discourseContext: TestDiscourseContext;
  readonly expectedResult: DeicticTestExpectation;
  readonly rationale: string;
}

/**
 * Categories of deictic resolution tests.
 */
export type DeicticTestCategory =
  | 'proximal_success'        // "this/these" with valid selection
  | 'proximal_failure'        // "this/these" without selection
  | 'distal_success'          // "that/those" with valid prior focus
  | 'distal_failure'          // "that/those" without prior context
  | 'temporal_deictic'        // "here/now" temporal references
  | 'stale_selection'         // Selection exists but is stale
  | 'multi_selection'         // Multiple items selected
  | 'type_mismatch'           // Selection type doesn't match expected
  | 'nested_scope'            // Deictic within a larger scope expression
  | 'mixed_reference';        // Deictic + explicit in same utterance

/**
 * Test selection state.
 */
export interface TestSelectionState {
  readonly hasSelection: boolean;
  readonly selectionKind?: string;
  readonly selectedEntityType?: string;
  readonly selectedEntityName?: string;
  readonly selectedEntities?: readonly string[];
  readonly selectionTurn?: number;
  readonly currentTurn: number;
  readonly isTimeBased?: boolean;
  readonly timeRange?: { readonly startBar: number; readonly endBar: number };
}

/**
 * Test discourse context.
 */
export interface TestDiscourseContext {
  readonly recentMentions?: readonly string[];
  readonly lastEditedEntity?: string;
  readonly priorFocus?: string;
  readonly turnsSinceLastMention?: number;
}

/**
 * Expected result of a deictic resolution test.
 */
export type DeicticTestExpectation =
  | { readonly type: 'resolved'; readonly entity: string; readonly confidence: number; readonly via: string }
  | { readonly type: 'clarification'; readonly question: string }
  | { readonly type: 'failed'; readonly reason: string; readonly suggestion?: string };

// =============================================================================
// TEST CASES: PROXIMAL DEICTIC ("this", "these")
// =============================================================================

/**
 * Test cases for proximal deictic resolution.
 */
export const PROXIMAL_SUCCESS_TESTS: readonly DeicticTestCase[] = [
  {
    id: 'dt-001',
    category: 'proximal_success',
    input: 'make this louder',
    deicticWord: 'this',
    selectionState: {
      hasSelection: true,
      selectionKind: 'section',
      selectedEntityType: 'section',
      selectedEntityName: 'Chorus 2',
      currentTurn: 3,
      selectionTurn: 3,
    },
    discourseContext: {},
    expectedResult: {
      type: 'resolved',
      entity: 'Chorus 2',
      confidence: 1.0,
      via: 'deictic',
    },
    rationale: 'Proximal "this" with active selection resolves to the selected entity',
  },
  {
    id: 'dt-002',
    category: 'proximal_success',
    input: 'transpose these up a step',
    deicticWord: 'these',
    selectionState: {
      hasSelection: true,
      selectionKind: 'notes',
      selectedEntityType: 'event',
      selectedEntities: ['Note C4', 'Note E4', 'Note G4'],
      currentTurn: 5,
      selectionTurn: 5,
    },
    discourseContext: {},
    expectedResult: {
      type: 'resolved',
      entity: 'selected notes (3 events)',
      confidence: 1.0,
      via: 'deictic',
    },
    rationale: 'Proximal "these" with multi-selection resolves to all selected events',
  },
  {
    id: 'dt-003',
    category: 'proximal_success',
    input: 'add reverb to this track',
    deicticWord: 'this',
    selectionState: {
      hasSelection: true,
      selectionKind: 'layer',
      selectedEntityType: 'layer',
      selectedEntityName: 'Drums',
      currentTurn: 2,
      selectionTurn: 2,
    },
    discourseContext: {},
    expectedResult: {
      type: 'resolved',
      entity: 'Drums',
      confidence: 1.0,
      via: 'deictic',
    },
    rationale: '"this track" resolves to the selected layer/track',
  },
  {
    id: 'dt-004',
    category: 'proximal_success',
    input: 'copy this section',
    deicticWord: 'this',
    selectionState: {
      hasSelection: true,
      selectionKind: 'time_range',
      selectedEntityType: 'range',
      currentTurn: 1,
      selectionTurn: 1,
      isTimeBased: true,
      timeRange: { startBar: 1, endBar: 8 },
    },
    discourseContext: {},
    expectedResult: {
      type: 'resolved',
      entity: 'bars 1–8',
      confidence: 0.9,
      via: 'deictic',
    },
    rationale: '"this section" with time-range selection infers section from range',
  },
  {
    id: 'dt-005',
    category: 'proximal_success',
    input: 'make this part brighter',
    deicticWord: 'this',
    selectionState: {
      hasSelection: true,
      selectionKind: 'section',
      selectedEntityType: 'section',
      selectedEntityName: 'Verse 1',
      currentTurn: 4,
      selectionTurn: 3,
    },
    discourseContext: {},
    expectedResult: {
      type: 'resolved',
      entity: 'Verse 1',
      confidence: 0.95,
      via: 'deictic',
    },
    rationale: '"this part" resolves to selected section even if 1 turn old',
  },
];

/**
 * Test cases for proximal deictic failure.
 */
export const PROXIMAL_FAILURE_TESTS: readonly DeicticTestCase[] = [
  {
    id: 'dt-010',
    category: 'proximal_failure',
    input: 'make this louder',
    deicticWord: 'this',
    selectionState: {
      hasSelection: false,
      currentTurn: 3,
    },
    discourseContext: {},
    expectedResult: {
      type: 'failed',
      reason: 'no_selection',
      suggestion: 'Please select something first, then say "make this louder".',
    },
    rationale: '"this" with no selection MUST fail — never silently default',
  },
  {
    id: 'dt-011',
    category: 'proximal_failure',
    input: 'delete these notes',
    deicticWord: 'these',
    selectionState: {
      hasSelection: false,
      currentTurn: 2,
    },
    discourseContext: {
      recentMentions: ['Chorus 2'],
    },
    expectedResult: {
      type: 'failed',
      reason: 'no_selection',
      suggestion: 'No notes are selected. Select the notes you want to delete first.',
    },
    rationale: '"these" with no selection fails even if something was recently mentioned',
  },
  {
    id: 'dt-012',
    category: 'proximal_failure',
    input: 'make this section brighter',
    deicticWord: 'this',
    selectionState: {
      hasSelection: true,
      selectionKind: 'notes',
      selectedEntityType: 'event',
      currentTurn: 3,
      selectionTurn: 3,
    },
    discourseContext: {},
    expectedResult: {
      type: 'clarification',
      question: 'You said "this section" but notes are selected, not a section. Did you mean the section containing the selected notes?',
    },
    rationale: 'Type mismatch between "section" and selected entity type triggers clarification',
  },
];

// =============================================================================
// TEST CASES: DISTAL DEICTIC ("that", "those")
// =============================================================================

/**
 * Test cases for distal deictic resolution.
 */
export const DISTAL_SUCCESS_TESTS: readonly DeicticTestCase[] = [
  {
    id: 'dt-020',
    category: 'distal_success',
    input: 'make that louder too',
    deicticWord: 'that',
    selectionState: {
      hasSelection: false,
      currentTurn: 5,
    },
    discourseContext: {
      recentMentions: ['Verse 2'],
      priorFocus: 'Verse 2',
      turnsSinceLastMention: 1,
    },
    expectedResult: {
      type: 'resolved',
      entity: 'Verse 2',
      confidence: 0.85,
      via: 'deictic',
    },
    rationale: '"that" resolves to the most recently mentioned entity',
  },
  {
    id: 'dt-021',
    category: 'distal_success',
    input: 'copy those to the outro',
    deicticWord: 'those',
    selectionState: {
      hasSelection: false,
      currentTurn: 7,
    },
    discourseContext: {
      recentMentions: ['selected notes'],
      priorFocus: 'selected notes',
      turnsSinceLastMention: 2,
    },
    expectedResult: {
      type: 'resolved',
      entity: 'previously selected notes',
      confidence: 0.8,
      via: 'deictic',
    },
    rationale: '"those" resolves to previously focused/selected entity set',
  },
  {
    id: 'dt-022',
    category: 'distal_success',
    input: 'apply that effect to the bass too',
    deicticWord: 'that',
    selectionState: {
      hasSelection: false,
      currentTurn: 4,
    },
    discourseContext: {
      recentMentions: ['Reverb card'],
      lastEditedEntity: 'Reverb card',
      turnsSinceLastMention: 1,
    },
    expectedResult: {
      type: 'resolved',
      entity: 'Reverb card',
      confidence: 0.9,
      via: 'deictic',
    },
    rationale: '"that effect" resolves to recently mentioned/edited card',
  },
];

/**
 * Test cases for distal deictic failure.
 */
export const DISTAL_FAILURE_TESTS: readonly DeicticTestCase[] = [
  {
    id: 'dt-030',
    category: 'distal_failure',
    input: 'remove that',
    deicticWord: 'that',
    selectionState: {
      hasSelection: false,
      currentTurn: 1,
    },
    discourseContext: {},
    expectedResult: {
      type: 'failed',
      reason: 'no_discourse',
      suggestion: 'What would you like to remove? Please specify or select something.',
    },
    rationale: '"that" with no discourse history and no selection fails',
  },
  {
    id: 'dt-031',
    category: 'distal_failure',
    input: 'make those shorter',
    deicticWord: 'those',
    selectionState: {
      hasSelection: false,
      currentTurn: 20,
    },
    discourseContext: {
      recentMentions: ['Chorus 2'],
      turnsSinceLastMention: 15,
    },
    expectedResult: {
      type: 'failed',
      reason: 'stale_selection',
      suggestion: 'The reference might be stale (last mentioned 15 turns ago). Please specify what you want to make shorter.',
    },
    rationale: '"those" with only stale discourse context fails',
  },
];

// =============================================================================
// TEST CASES: STALE SELECTION
// =============================================================================

/**
 * Test cases for stale selection handling.
 */
export const STALE_SELECTION_TESTS: readonly DeicticTestCase[] = [
  {
    id: 'dt-040',
    category: 'stale_selection',
    input: 'make this louder',
    deicticWord: 'this',
    selectionState: {
      hasSelection: true,
      selectionKind: 'section',
      selectedEntityType: 'section',
      selectedEntityName: 'Chorus 1',
      currentTurn: 10,
      selectionTurn: 3,
    },
    discourseContext: {},
    expectedResult: {
      type: 'clarification',
      question: 'You said "this" — do you still mean Chorus 1? (It was selected 7 turns ago.)',
    },
    rationale: 'Selection older than 3 turns triggers staleness check',
  },
  {
    id: 'dt-041',
    category: 'stale_selection',
    input: 'delete these',
    deicticWord: 'these',
    selectionState: {
      hasSelection: true,
      selectionKind: 'notes',
      selectedEntityType: 'event',
      selectedEntities: ['Note A3', 'Note C4'],
      currentTurn: 8,
      selectionTurn: 4,
    },
    discourseContext: {
      lastEditedEntity: 'different section',
    },
    expectedResult: {
      type: 'clarification',
      question: 'You said "these" — do you still mean the 2 selected notes? (They were selected 4 turns ago.)',
    },
    rationale: 'Stale multi-selection with intervening edits triggers clarification',
  },
];

// =============================================================================
// TEST CASES: TEMPORAL DEICTIC ("here", "now")
// =============================================================================

/**
 * Test cases for temporal deictic resolution.
 */
export const TEMPORAL_DEICTIC_TESTS: readonly DeicticTestCase[] = [
  {
    id: 'dt-050',
    category: 'temporal_deictic',
    input: 'add a fill here',
    deicticWord: 'here',
    selectionState: {
      hasSelection: true,
      selectionKind: 'time_range',
      selectedEntityType: 'range',
      currentTurn: 2,
      selectionTurn: 2,
      isTimeBased: true,
      timeRange: { startBar: 8, endBar: 8 },
    },
    discourseContext: {},
    expectedResult: {
      type: 'resolved',
      entity: 'bar 8',
      confidence: 1.0,
      via: 'deictic',
    },
    rationale: '"here" resolves to the time position of the current selection',
  },
  {
    id: 'dt-051',
    category: 'temporal_deictic',
    input: 'insert a break here',
    deicticWord: 'here',
    selectionState: {
      hasSelection: false,
      currentTurn: 3,
    },
    discourseContext: {},
    expectedResult: {
      type: 'failed',
      reason: 'no_selection',
      suggestion: 'Place the cursor or make a selection to indicate where "here" is.',
    },
    rationale: '"here" without a time position fails',
  },
  {
    id: 'dt-052',
    category: 'temporal_deictic',
    input: 'from here to the end, make it quieter',
    deicticWord: 'here',
    selectionState: {
      hasSelection: true,
      selectionKind: 'time_range',
      selectedEntityType: 'range',
      currentTurn: 1,
      selectionTurn: 1,
      isTimeBased: true,
      timeRange: { startBar: 33, endBar: 33 },
    },
    discourseContext: {},
    expectedResult: {
      type: 'resolved',
      entity: 'from bar 33 to end',
      confidence: 0.95,
      via: 'deictic',
    },
    rationale: '"here" as start of a range, "the end" as endpoint',
  },
];

// =============================================================================
// TEST CASES: NESTED SCOPE
// =============================================================================

/**
 * Test cases for deictic references within larger scope expressions.
 */
export const NESTED_SCOPE_TESTS: readonly DeicticTestCase[] = [
  {
    id: 'dt-060',
    category: 'nested_scope',
    input: 'in this section, make the drums louder',
    deicticWord: 'this',
    selectionState: {
      hasSelection: true,
      selectionKind: 'section',
      selectedEntityType: 'section',
      selectedEntityName: 'Verse 2',
      currentTurn: 3,
      selectionTurn: 3,
    },
    discourseContext: {},
    expectedResult: {
      type: 'resolved',
      entity: 'Verse 2',
      confidence: 1.0,
      via: 'deictic',
    },
    rationale: '"this section" in a scoping phrase resolves to selected section',
  },
  {
    id: 'dt-061',
    category: 'nested_scope',
    input: 'on this track, add more reverb',
    deicticWord: 'this',
    selectionState: {
      hasSelection: true,
      selectionKind: 'layer',
      selectedEntityType: 'layer',
      selectedEntityName: 'Vocals',
      currentTurn: 5,
      selectionTurn: 5,
    },
    discourseContext: {},
    expectedResult: {
      type: 'resolved',
      entity: 'Vocals',
      confidence: 1.0,
      via: 'deictic',
    },
    rationale: '"this track" as scope modifier resolves to selected layer',
  },
];

// =============================================================================
// TEST CASES: MIXED REFERENCE
// =============================================================================

/**
 * Test cases for mixed deictic + explicit references.
 */
export const MIXED_REFERENCE_TESTS: readonly DeicticTestCase[] = [
  {
    id: 'dt-070',
    category: 'mixed_reference',
    input: 'copy this to Chorus 2',
    deicticWord: 'this',
    selectionState: {
      hasSelection: true,
      selectionKind: 'section',
      selectedEntityType: 'section',
      selectedEntityName: 'Verse 1',
      currentTurn: 3,
      selectionTurn: 3,
    },
    discourseContext: {},
    expectedResult: {
      type: 'resolved',
      entity: 'Verse 1',
      confidence: 1.0,
      via: 'deictic',
    },
    rationale: '"this" resolves via deictic, "Chorus 2" resolves via explicit name — both succeed independently',
  },
  {
    id: 'dt-071',
    category: 'mixed_reference',
    input: 'make this like the intro',
    deicticWord: 'this',
    selectionState: {
      hasSelection: true,
      selectionKind: 'section',
      selectedEntityType: 'section',
      selectedEntityName: 'Bridge',
      currentTurn: 2,
      selectionTurn: 2,
    },
    discourseContext: {},
    expectedResult: {
      type: 'resolved',
      entity: 'Bridge',
      confidence: 1.0,
      via: 'deictic',
    },
    rationale: '"this" (deictic → Bridge) as target, "the intro" (explicit) as reference — independent resolution',
  },
];

// =============================================================================
// ALL TEST CASES
// =============================================================================

/**
 * All deictic resolution test cases.
 */
export const ALL_DEICTIC_TESTS: readonly DeicticTestCase[] = [
  ...PROXIMAL_SUCCESS_TESTS,
  ...PROXIMAL_FAILURE_TESTS,
  ...DISTAL_SUCCESS_TESTS,
  ...DISTAL_FAILURE_TESTS,
  ...STALE_SELECTION_TESTS,
  ...TEMPORAL_DEICTIC_TESTS,
  ...NESTED_SCOPE_TESTS,
  ...MIXED_REFERENCE_TESTS,
];

/**
 * Get test cases by category.
 */
export function getDeicticTestsByCategory(
  category: DeicticTestCategory
): readonly DeicticTestCase[] {
  return ALL_DEICTIC_TESTS.filter(t => t.category === category);
}

/**
 * Get total test count.
 */
export function getDeicticTestCount(): number {
  return ALL_DEICTIC_TESTS.length;
}

/**
 * Validate that all test cases have unique IDs.
 */
export function validateDeicticTests(): {
  readonly valid: boolean;
  readonly issues: readonly string[];
} {
  const issues: string[] = [];
  const ids = new Set<string>();

  for (const test of ALL_DEICTIC_TESTS) {
    if (ids.has(test.id)) {
      issues.push(`Duplicate test ID: ${test.id}`);
    }
    ids.add(test.id);

    if (!test.input.includes(test.deicticWord) &&
        !test.input.toLowerCase().includes(test.deicticWord.toLowerCase())) {
      issues.push(`Test ${test.id}: input "${test.input}" doesn't contain deictic word "${test.deicticWord}"`);
    }
  }

  return { valid: issues.length === 0, issues };
}
