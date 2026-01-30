/**
 * GOFAI NL Semantics — Evaluation Framework: Golden Tests, Semantic Diffs,
 * Scope Safety, Operator Interaction, and Presupposition Tests
 *
 * Steps 191–195:
 *   191: Golden tests for CPL-Intent construction (200 utterances)
 *   192: Semantic diff tests (lexicon mapping stability)
 *   193: Scope safety tests (consistent range binding)
 *   194: Operator interaction tests (negation/only/quantifiers)
 *   195: Presupposition trigger tests (prior referent requirements)
 *
 * @module gofai/nl/semantics/eval-golden-tests
 */


// =============================================================================
// § 191 — Golden Tests for CPL-Intent Construction
// =============================================================================

/**
 * A golden test case: an utterance with expected CPL-Intent output.
 */
export interface GoldenTestCase {
  /** Test ID */
  readonly id: string;
  /** Category of the test */
  readonly category: GoldenTestCategory;
  /** Input utterance */
  readonly utterance: string;
  /** Expected CPL output (partial match) */
  readonly expected: GoldenExpectedOutput;
  /** Whether ambiguity is expected (holes should be present) */
  readonly expectsHoles: boolean;
  /** Expected hole kinds (if ambiguity exists) */
  readonly expectedHoleKinds: readonly string[];
  /** Tags for filtering */
  readonly tags: readonly string[];
  /** Notes on the test */
  readonly notes: string;
}

/**
 * Category of golden test.
 */
export type GoldenTestCategory =
  | 'axis-change'          // Simple axis modification
  | 'structural-edit'      // Structural changes (add/remove/move)
  | 'preservation'         // Keep/preserve instructions
  | 'scope-binding'        // Scope-related instructions
  | 'affective'            // Affective adjectives
  | 'impact'               // Impact/punch phrases
  | 'complex-emotion'      // Complex emotional adjectives
  | 'numeric-qualified'    // Instructions with numeric amounts
  | 'conjunction'          // Conjoined instructions
  | 'negation'             // Negation patterns
  | 'only-focus'           // "Only" focus patterns
  | 'ellipsis'             // Elliptical references
  | 'metonymy'             // Metonymic references
  | 'presupposition'       // Presuppositional triggers
  | 'discourse-cue'        // Discourse-cued instructions
  | 'quoted-ref'           // Quoted references
  | 'range-expression'     // Range-based scoping
  | 'multi-goal'           // Multiple goals in one utterance
  | 'ambiguous'            // Known ambiguous inputs
  | 'edge-case';           // Edge cases and boundary tests

/**
 * Expected output shape for golden tests.
 */
export interface GoldenExpectedOutput {
  /** Expected number of goals */
  readonly goalCount?: number;
  /** Expected goal variants */
  readonly goalVariants?: readonly string[];
  /** Expected axes referenced */
  readonly expectedAxes?: readonly string[];
  /** Expected directions */
  readonly expectedDirections?: readonly ('increase' | 'decrease' | 'set')[];
  /** Expected constraint count */
  readonly constraintCount?: number;
  /** Expected constraint variants */
  readonly constraintVariants?: readonly string[];
  /** Expected preference count */
  readonly preferenceCount?: number;
  /** Expected scope type */
  readonly scopeType?: string;
  /** Expected hole count */
  readonly holeCount?: number;
  /** Expected hole kinds */
  readonly holeKinds?: readonly string[];
  /** Custom validators (field name → expected value as string) */
  readonly customChecks?: ReadonlyMap<string, string>;
}

/**
 * Golden test database — 200 utterances covering all categories.
 */
export const GOLDEN_TESTS: readonly GoldenTestCase[] = [
  // ── Axis Change (1–20) ──
  {
    id: 'g001', category: 'axis-change', utterance: 'Make it brighter',
    expected: { goalCount: 1, goalVariants: ['axis-goal'], expectedAxes: ['brightness'], expectedDirections: ['increase'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['simple', 'axis'], notes: 'Simple comparative adjective → axis increase',
  },
  {
    id: 'g002', category: 'axis-change', utterance: 'Make it darker',
    expected: { goalCount: 1, goalVariants: ['axis-goal'], expectedAxes: ['brightness'], expectedDirections: ['decrease'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['simple', 'axis'], notes: 'Opposite adjective → brightness decrease',
  },
  {
    id: 'g003', category: 'axis-change', utterance: 'Make it warmer',
    expected: { goalCount: 1, expectedAxes: ['warmth'], expectedDirections: ['increase'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['simple', 'axis'], notes: 'Warmth increase',
  },
  {
    id: 'g004', category: 'axis-change', utterance: 'Add more width',
    expected: { goalCount: 1, expectedAxes: ['width'], expectedDirections: ['increase'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['simple', 'axis'], notes: '"Add more" = increase',
  },
  {
    id: 'g005', category: 'axis-change', utterance: 'Reduce the density',
    expected: { goalCount: 1, expectedAxes: ['density'], expectedDirections: ['decrease'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['simple', 'axis'], notes: '"Reduce" = decrease',
  },
  {
    id: 'g006', category: 'axis-change', utterance: 'Less aggression please',
    expected: { goalCount: 1, expectedAxes: ['aggression'], expectedDirections: ['decrease'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['polite', 'axis'], notes: '"Less X" = decrease',
  },
  {
    id: 'g007', category: 'axis-change', utterance: 'I want it smoother',
    expected: { goalCount: 1, expectedAxes: ['smoothness'], expectedDirections: ['increase'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['axis'], notes: 'Comparative adjective',
  },
  {
    id: 'g008', category: 'axis-change', utterance: 'Can you increase the clarity?',
    expected: { goalCount: 1, expectedAxes: ['clarity'], expectedDirections: ['increase'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['polite', 'axis'], notes: 'Question-form instruction',
  },
  {
    id: 'g009', category: 'axis-change', utterance: 'Dial back the harshness',
    expected: { goalCount: 1, expectedAxes: ['harshness'], expectedDirections: ['decrease'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['axis', 'colloquial'], notes: '"Dial back" = decrease',
  },
  {
    id: 'g010', category: 'axis-change', utterance: 'Give it more air',
    expected: { goalCount: 1, expectedAxes: ['air'], expectedDirections: ['increase'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['axis', 'colloquial'], notes: '"Give it more" = increase',
  },
  {
    id: 'g011', category: 'axis-change', utterance: 'It needs more punch',
    expected: { goalCount: 1, expectedAxes: ['punch'], expectedDirections: ['increase'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['axis', 'impact'], notes: '"Needs more" = increase',
  },
  {
    id: 'g012', category: 'axis-change', utterance: 'Not enough shimmer',
    expected: { goalCount: 1, expectedAxes: ['shimmer'], expectedDirections: ['increase'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['axis'], notes: '"Not enough" = increase',
  },
  {
    id: 'g013', category: 'axis-change', utterance: 'Too much mud',
    expected: { goalCount: 1, expectedAxes: ['mud'], expectedDirections: ['decrease'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['axis'], notes: '"Too much" = decrease',
  },
  {
    id: 'g014', category: 'axis-change', utterance: 'Bump up the presence',
    expected: { goalCount: 1, expectedAxes: ['presence'], expectedDirections: ['increase'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['axis', 'colloquial'], notes: '"Bump up" = increase',
  },
  {
    id: 'g015', category: 'axis-change', utterance: 'Tone down the sharpness',
    expected: { goalCount: 1, expectedAxes: ['sharpness'], expectedDirections: ['decrease'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['axis', 'colloquial'], notes: '"Tone down" = decrease',
  },
  {
    id: 'g016', category: 'axis-change', utterance: 'Make the bass have more weight',
    expected: { goalCount: 1, expectedAxes: ['weight'], expectedDirections: ['increase'], scopeType: 'entity-bass' },
    expectsHoles: false, expectedHoleKinds: [], tags: ['axis', 'scoped'], notes: 'Entity-scoped axis change',
  },
  {
    id: 'g017', category: 'axis-change', utterance: 'Increase tension in the bridge',
    expected: { goalCount: 1, expectedAxes: ['tension'], expectedDirections: ['increase'], scopeType: 'section-bridge' },
    expectsHoles: false, expectedHoleKinds: [], tags: ['axis', 'section-scoped'], notes: 'Section-scoped axis change',
  },
  {
    id: 'g018', category: 'axis-change', utterance: 'The chorus needs to be lusher',
    expected: { goalCount: 1, expectedAxes: ['lushness'], expectedDirections: ['increase'], scopeType: 'section-chorus' },
    expectsHoles: false, expectedHoleKinds: [], tags: ['axis', 'section-scoped'], notes: 'Implicitly scoped to chorus',
  },
  {
    id: 'g019', category: 'axis-change', utterance: 'Set the energy to medium',
    expected: { goalCount: 1, expectedAxes: ['energy'], expectedDirections: ['set'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['axis', 'set'], notes: '"Set to" = set direction',
  },
  {
    id: 'g020', category: 'axis-change', utterance: 'Maximum fullness',
    expected: { goalCount: 1, expectedAxes: ['fullness'], expectedDirections: ['increase'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['axis', 'extreme'], notes: '"Maximum" = strong increase',
  },

  // ── Structural Edit (21–40) ──
  {
    id: 'g021', category: 'structural-edit', utterance: 'Add a new section after the chorus',
    expected: { goalCount: 1, goalVariants: ['structural-goal'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['structural', 'add'], notes: 'Add section',
  },
  {
    id: 'g022', category: 'structural-edit', utterance: 'Delete the intro',
    expected: { goalCount: 1, goalVariants: ['structural-goal'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['structural', 'delete'], notes: 'Delete section',
  },
  {
    id: 'g023', category: 'structural-edit', utterance: 'Move the bridge before the final chorus',
    expected: { goalCount: 1, goalVariants: ['structural-goal'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['structural', 'move'], notes: 'Move section',
  },
  {
    id: 'g024', category: 'structural-edit', utterance: 'Duplicate the verse',
    expected: { goalCount: 1, goalVariants: ['structural-goal'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['structural', 'copy'], notes: 'Duplicate section',
  },
  {
    id: 'g025', category: 'structural-edit', utterance: 'Remove the drum track',
    expected: { goalCount: 1, goalVariants: ['structural-goal'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['structural', 'delete', 'track'], notes: 'Remove track',
  },
  {
    id: 'g026', category: 'structural-edit', utterance: 'Add a synth layer to the chorus',
    expected: { goalCount: 1, goalVariants: ['structural-goal'], scopeType: 'section-chorus' },
    expectsHoles: false, expectedHoleKinds: [], tags: ['structural', 'add', 'scoped'], notes: 'Scoped add',
  },
  {
    id: 'g027', category: 'structural-edit', utterance: 'Split the verse at bar 8',
    expected: { goalCount: 1, goalVariants: ['structural-goal'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['structural', 'split'], notes: 'Split at position',
  },
  {
    id: 'g028', category: 'structural-edit', utterance: 'Extend the outro by 4 bars',
    expected: { goalCount: 1, goalVariants: ['structural-goal'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['structural', 'extend'], notes: 'Extend with numeric qualifier',
  },
  {
    id: 'g029', category: 'structural-edit', utterance: 'Shorten the intro to 2 bars',
    expected: { goalCount: 1, goalVariants: ['structural-goal'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['structural', 'shorten'], notes: 'Shorten to specific length',
  },
  {
    id: 'g030', category: 'structural-edit', utterance: 'Swap the verse and chorus',
    expected: { goalCount: 1, goalVariants: ['structural-goal'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['structural', 'swap'], notes: 'Swap two sections',
  },

  // ── Preservation (31–50) ──
  {
    id: 'g031', category: 'preservation', utterance: 'Keep the melody the same',
    expected: { constraintCount: 1, constraintVariants: ['preserve'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['preserve', 'exact'], notes: 'Exact preservation',
  },
  {
    id: 'g032', category: 'preservation', utterance: "Don't change the chords",
    expected: { constraintCount: 1, constraintVariants: ['preserve'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['preserve', 'negation'], notes: 'Negation = preserve',
  },
  {
    id: 'g033', category: 'preservation', utterance: 'Preserve the rhythm',
    expected: { constraintCount: 1, constraintVariants: ['preserve'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['preserve'], notes: 'Explicit preserve',
  },
  {
    id: 'g034', category: 'preservation', utterance: 'Only change the brightness',
    expected: { constraintCount: 1, constraintVariants: ['only-change'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['only-change'], notes: 'Only-change constraint',
  },
  {
    id: 'g035', category: 'preservation', utterance: 'Make it brighter but keep the warmth',
    expected: { goalCount: 1, constraintCount: 1 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['axis', 'preserve', 'compound'], notes: 'Goal + constraint in one',
  },
  {
    id: 'g036', category: 'preservation', utterance: 'Everything except the drums should stay as is',
    expected: { constraintCount: 1, constraintVariants: ['only-change'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['preserve', 'except'], notes: '"Except" scope',
  },
  {
    id: 'g037', category: 'preservation', utterance: 'Leave the bass alone',
    expected: { constraintCount: 1, constraintVariants: ['preserve'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['preserve', 'colloquial'], notes: '"Leave alone" = preserve',
  },
  {
    id: 'g038', category: 'preservation', utterance: "Don't touch the vocals",
    expected: { constraintCount: 1, constraintVariants: ['preserve'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['preserve', 'colloquial'], notes: '"Don\'t touch" = preserve',
  },
  {
    id: 'g039', category: 'preservation', utterance: 'Maintain the groove but change the instrumentation',
    expected: { constraintCount: 1, goalCount: 1 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['preserve', 'compound'], notes: 'Maintain + change compound',
  },
  {
    id: 'g040', category: 'preservation', utterance: 'Keep it recognizable but make it more modern',
    expected: { constraintCount: 1, goalCount: 1 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['preserve', 'affective'], notes: 'Recognizable preservation + affective goal',
  },

  // ── Affective / Complex Emotion (41–60) ──
  {
    id: 'g041', category: 'affective', utterance: 'Make it feel dreamy',
    expected: { goalCount: 3 }, // Multiple axes
    expectsHoles: false, expectedHoleKinds: [], tags: ['affective', 'emotional'], notes: 'Affective adjective',
  },
  {
    id: 'g042', category: 'affective', utterance: 'I want it to sound vintage',
    expected: { goalCount: 3 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['affective', 'aesthetic'], notes: 'Aesthetic adjective',
  },
  {
    id: 'g043', category: 'complex-emotion', utterance: 'Make it feel more hopeful',
    expected: { goalCount: 4 }, // Primary + secondary axes
    expectsHoles: false, expectedHoleKinds: [], tags: ['emotion', 'complex'], notes: 'Complex emotion with constraints',
  },
  {
    id: 'g044', category: 'complex-emotion', utterance: 'Give it a triumphant feel',
    expected: { goalCount: 5 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['emotion', 'complex'], notes: 'Triumphant: multiple axes',
  },
  {
    id: 'g045', category: 'complex-emotion', utterance: 'Make it mysterious',
    expected: { goalCount: 4 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['emotion', 'complex'], notes: 'Mysterious emotion',
  },
  {
    id: 'g046', category: 'affective', utterance: 'Too gritty, clean it up',
    expected: { goalCount: 1, expectedAxes: ['grittiness'], expectedDirections: ['decrease'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['affective', 'textural'], notes: '"Too X, fix it" = decrease',
  },
  {
    id: 'g047', category: 'impact', utterance: 'It needs to hit harder',
    expected: { goalCount: 2 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['impact'], notes: 'Impact phrase',
  },
  {
    id: 'g048', category: 'impact', utterance: 'More punch on the kick',
    expected: { goalCount: 2, scopeType: 'entity-kick' },
    expectsHoles: false, expectedHoleKinds: [], tags: ['impact', 'scoped'], notes: 'Entity-scoped impact',
  },
  {
    id: 'g049', category: 'affective', utterance: 'Make the verse feel intimate and the chorus feel powerful',
    expected: { goalCount: 6 }, // Two emotions, each with multiple axes
    expectsHoles: false, expectedHoleKinds: [], tags: ['emotion', 'compound', 'scoped'], notes: 'Two scoped emotions',
  },
  {
    id: 'g050', category: 'affective', utterance: 'It sounds too cold and sterile',
    expected: { goalCount: 2, expectedAxes: ['warmth'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['affective', 'compound'], notes: 'Multiple affective adjectives',
  },

  // ── Scope & Range (51–70) ──
  {
    id: 'g051', category: 'scope-binding', utterance: 'In the chorus, make it louder',
    expected: { goalCount: 1, scopeType: 'section-chorus' },
    expectsHoles: false, expectedHoleKinds: [], tags: ['scope', 'section'], notes: 'Section scope',
  },
  {
    id: 'g052', category: 'scope-binding', utterance: 'On the bass track, increase the warmth',
    expected: { goalCount: 1, scopeType: 'entity-bass' },
    expectsHoles: false, expectedHoleKinds: [], tags: ['scope', 'entity'], notes: 'Entity scope',
  },
  {
    id: 'g053', category: 'range-expression', utterance: 'Brighten bars 4-8',
    expected: { goalCount: 1, scopeType: 'bar-range' },
    expectsHoles: false, expectedHoleKinds: [], tags: ['scope', 'bar-range'], notes: 'Bar-range scope',
  },
  {
    id: 'g054', category: 'range-expression', utterance: 'Add reverb to the last 2 bars',
    expected: { goalCount: 1, scopeType: 'relative-range' },
    expectsHoles: false, expectedHoleKinds: [], tags: ['scope', 'relative'], notes: 'Relative range',
  },
  {
    id: 'g055', category: 'scope-binding', utterance: 'Make every verse brighter',
    expected: { goalCount: 1, scopeType: 'universal-section' },
    expectsHoles: false, expectedHoleKinds: [], tags: ['scope', 'universal'], notes: 'Universal section scope',
  },
  {
    id: 'g056', category: 'scope-binding', utterance: 'In the chorus, on the drums, add more punch',
    expected: { goalCount: 1, scopeType: 'nested' },
    expectsHoles: false, expectedHoleKinds: [], tags: ['scope', 'nested'], notes: 'Nested scope (section + entity)',
  },
  {
    id: 'g057', category: 'scope-binding', utterance: 'For bars 1 through 8 of the intro',
    expected: { scopeType: 'bar-range-within-section' },
    expectsHoles: false, expectedHoleKinds: [], tags: ['scope', 'compound'], notes: 'Compound scope',
  },
  {
    id: 'g058', category: 'quoted-ref', utterance: "Make the track called 'Glass Pad' warmer",
    expected: { goalCount: 1, scopeType: 'quoted-entity' },
    expectsHoles: false, expectedHoleKinds: [], tags: ['scope', 'quoted'], notes: 'Quoted entity reference',
  },
  {
    id: 'g059', category: 'scope-binding', utterance: 'Only the synth tracks should change',
    expected: { constraintCount: 1, constraintVariants: ['only-change'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['scope', 'only'], notes: '"Only X" constraint',
  },
  {
    id: 'g060', category: 'scope-binding', utterance: 'Apply to the whole project',
    expected: { scopeType: 'whole-project' },
    expectsHoles: false, expectedHoleKinds: [], tags: ['scope', 'global'], notes: 'Whole-project scope',
  },

  // ── Numeric Qualifiers (61–80) ──
  {
    id: 'g061', category: 'numeric-qualified', utterance: 'Raise it 2 semitones',
    expected: { goalCount: 1, expectedDirections: ['increase'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['numeric', 'semitones'], notes: 'Semitone amount',
  },
  {
    id: 'g062', category: 'numeric-qualified', utterance: 'Reduce density by 20%',
    expected: { goalCount: 1, expectedDirections: ['decrease'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['numeric', 'percent'], notes: 'Percentage amount',
  },
  {
    id: 'g063', category: 'numeric-qualified', utterance: 'Set the tempo to 120 BPM',
    expected: { goalCount: 1, expectedDirections: ['set'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['numeric', 'bpm'], notes: 'Absolute BPM',
  },
  {
    id: 'g064', category: 'numeric-qualified', utterance: 'Boost 3 dB at 2 kHz',
    expected: { goalCount: 1 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['numeric', 'db', 'hz'], notes: 'Multiple numeric qualifiers',
  },
  {
    id: 'g065', category: 'numeric-qualified', utterance: 'Add 50ms of delay',
    expected: { goalCount: 1 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['numeric', 'ms'], notes: 'Millisecond amount',
  },
  {
    id: 'g066', category: 'numeric-qualified', utterance: 'Transpose down 1 octave',
    expected: { goalCount: 1, expectedDirections: ['decrease'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['numeric', 'octave'], notes: 'Octave transposition',
  },
  {
    id: 'g067', category: 'numeric-qualified', utterance: 'Compression ratio 4:1',
    expected: { goalCount: 1 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['numeric', 'ratio'], notes: 'Compression ratio',
  },
  {
    id: 'g068', category: 'numeric-qualified', utterance: 'Cut the low end below 80 Hz',
    expected: { goalCount: 1 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['numeric', 'hz', 'filter'], notes: 'Frequency cutoff',
  },
  {
    id: 'g069', category: 'numeric-qualified', utterance: 'Make the attack 10ms faster',
    expected: { goalCount: 1 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['numeric', 'ms', 'relative'], notes: 'Relative time adjustment',
  },
  {
    id: 'g070', category: 'numeric-qualified', utterance: 'Drop the volume by 6 dB',
    expected: { goalCount: 1, expectedDirections: ['decrease'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['numeric', 'db'], notes: 'Relative dB change',
  },

  // ── Conjunction / Multi-Goal (71–90) ──
  {
    id: 'g071', category: 'conjunction', utterance: 'Make it brighter and wider',
    expected: { goalCount: 2 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['conjunction', 'and'], notes: 'Two-goal conjunction',
  },
  {
    id: 'g072', category: 'conjunction', utterance: 'Brighter, wider, and punchier',
    expected: { goalCount: 3 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['conjunction', 'comma'], notes: 'Three-goal conjunction',
  },
  {
    id: 'g073', category: 'conjunction', utterance: 'Make it louder but keep the dynamics',
    expected: { goalCount: 1, constraintCount: 1 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['conjunction', 'but'], notes: 'Goal + constraint with "but"',
  },
  {
    id: 'g074', category: 'conjunction', utterance: 'Add warmth and remove the harshness',
    expected: { goalCount: 2 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['conjunction', 'mixed-direction'], notes: 'Mixed increase/decrease',
  },
  {
    id: 'g075', category: 'conjunction', utterance: 'More punch and less mud',
    expected: { goalCount: 2 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['conjunction', 'mixed'], notes: '"More X and less Y"',
  },
  {
    id: 'g076', category: 'multi-goal', utterance: 'Brighten the chorus and add reverb to the verse',
    expected: { goalCount: 2 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['multi-goal', 'scoped'], notes: 'Two goals, different scopes',
  },
  {
    id: 'g077', category: 'multi-goal', utterance: 'Delete the intro, extend the outro, and make the chorus louder',
    expected: { goalCount: 3 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['multi-goal', 'mixed-types'], notes: 'Three different goal types',
  },
  {
    id: 'g078', category: 'multi-goal', utterance: 'First brighten it, then add more space',
    expected: { goalCount: 2 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['multi-goal', 'sequential'], notes: 'Sequential goals',
  },
  {
    id: 'g079', category: 'conjunction', utterance: 'Either make it brighter or add more warmth',
    expected: { goalCount: 2 },
    expectsHoles: true, expectedHoleKinds: ['conflicting-constraints'], tags: ['conjunction', 'or', 'ambiguous'], notes: '"Either/or" creates alternatives',
  },
  {
    id: 'g080', category: 'multi-goal', utterance: 'Make the verse intimate, the chorus powerful, and the bridge mysterious',
    expected: { goalCount: 12 }, // 3 emotions × ~4 axes each
    expectsHoles: false, expectedHoleKinds: [], tags: ['multi-goal', 'emotion', 'scoped'], notes: 'Three emotions, three scopes',
  },

  // ── Negation / Only / Quantifiers (81–110) ──
  {
    id: 'g081', category: 'negation', utterance: "Don't make it louder",
    expected: { constraintCount: 1 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['negation'], notes: '"Don\'t" = constraint',
  },
  {
    id: 'g082', category: 'negation', utterance: "Don't add any reverb",
    expected: { constraintCount: 1, constraintVariants: ['preserve'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['negation', 'specific'], notes: 'Specific negation',
  },
  {
    id: 'g083', category: 'negation', utterance: 'Never go above 0 dB',
    expected: { constraintCount: 1, constraintVariants: ['range'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['negation', 'range'], notes: 'Range constraint from negation',
  },
  {
    id: 'g084', category: 'only-focus', utterance: 'Only adjust the EQ',
    expected: { constraintCount: 1, constraintVariants: ['only-change'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['only'], notes: '"Only" = only-change constraint',
  },
  {
    id: 'g085', category: 'only-focus', utterance: 'Just the drums',
    expected: { constraintCount: 1 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['only', 'colloquial'], notes: '"Just" = only scope',
  },
  {
    id: 'g086', category: 'only-focus', utterance: 'Only change the brightness, nothing else',
    expected: { constraintCount: 1, constraintVariants: ['only-change'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['only', 'explicit'], notes: 'Explicit only-change',
  },
  {
    id: 'g087', category: 'negation', utterance: 'No reverb',
    expected: { constraintCount: 1, constraintVariants: ['preserve'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['negation', 'bare'], notes: 'Bare negation',
  },
  {
    id: 'g088', category: 'negation', utterance: 'Nothing should change except the volume',
    expected: { constraintCount: 1, constraintVariants: ['only-change'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['negation', 'except'], notes: 'Nothing-except = only-change',
  },

  // ── Ellipsis (89–100) ──
  {
    id: 'g089', category: 'ellipsis', utterance: 'Do that again',
    expected: { goalCount: 1 },
    expectsHoles: true, expectedHoleKinds: ['ambiguous-reference'], tags: ['ellipsis', 'repeat'], notes: 'Requires prior context',
  },
  {
    id: 'g090', category: 'ellipsis', utterance: 'Same but bigger',
    expected: { goalCount: 1 },
    expectsHoles: true, expectedHoleKinds: ['ambiguous-reference'], tags: ['ellipsis', 'modified'], notes: 'Modified repeat',
  },
  {
    id: 'g091', category: 'ellipsis', utterance: 'More',
    expected: { goalCount: 1 },
    expectsHoles: true, expectedHoleKinds: ['ambiguous-reference'], tags: ['ellipsis', 'bare'], notes: 'Bare "more"',
  },
  {
    id: 'g092', category: 'ellipsis', utterance: 'Same thing for the bass',
    expected: { goalCount: 1 },
    expectsHoles: true, expectedHoleKinds: ['ambiguous-reference'], tags: ['ellipsis', 'parallel'], notes: 'Parallel application',
  },
  {
    id: 'g093', category: 'ellipsis', utterance: 'The opposite',
    expected: { goalCount: 1 },
    expectsHoles: true, expectedHoleKinds: ['ambiguous-reference'], tags: ['ellipsis', 'reverse'], notes: 'Reverse of prior',
  },
  {
    id: 'g094', category: 'ellipsis', utterance: 'Not that much',
    expected: { goalCount: 1 },
    expectsHoles: true, expectedHoleKinds: ['ambiguous-reference'], tags: ['ellipsis', 'scale-down'], notes: 'Scale-down of prior amount',
  },
  {
    id: 'g095', category: 'ellipsis', utterance: 'Actually, make it darker',
    expected: { goalCount: 1 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['ellipsis', 'correction'], notes: 'Correction (replaces prior)',
  },
  {
    id: 'g096', category: 'ellipsis', utterance: 'And also the reverb',
    expected: { goalCount: 1 },
    expectsHoles: true, expectedHoleKinds: ['ambiguous-reference'], tags: ['ellipsis', 'continuation'], notes: 'Continuation',
  },

  // ── Metonymy (97–110) ──
  {
    id: 'g097', category: 'metonymy', utterance: 'Change the chorus',
    expected: { goalCount: 1 },
    expectsHoles: true, expectedHoleKinds: ['ambiguous-reference'], tags: ['metonymy', 'section'], notes: '"The chorus" = time/events/harmony?',
  },
  {
    id: 'g098', category: 'metonymy', utterance: 'Fix the bass',
    expected: { goalCount: 1 },
    expectsHoles: true, expectedHoleKinds: ['ambiguous-reference'], tags: ['metonymy', 'entity'], notes: '"The bass" = track/sound/frequency?',
  },
  {
    id: 'g099', category: 'metonymy', utterance: 'The mix needs work',
    expected: { goalCount: 1 },
    expectsHoles: true, expectedHoleKinds: ['ambiguous-reference'], tags: ['metonymy', 'mix'], notes: '"The mix" = balance/tonality/dynamics?',
  },
  {
    id: 'g100', category: 'metonymy', utterance: 'Make the drums better',
    expected: { goalCount: 1 },
    expectsHoles: true, expectedHoleKinds: ['ambiguous-reference'], tags: ['metonymy', 'vague'], notes: '"Better" is too vague',
  },

  // ── Presupposition (101–120) ──
  {
    id: 'g101', category: 'presupposition', utterance: 'Keep doing what you were doing',
    expected: { goalCount: 1 },
    expectsHoles: true, expectedHoleKinds: ['ambiguous-reference'], tags: ['presupposition', 'continuity'], notes: 'Presupposes prior action',
  },
  {
    id: 'g102', category: 'presupposition', utterance: 'Still too bright',
    expected: { goalCount: 1, expectedAxes: ['brightness'], expectedDirections: ['decrease'] },
    expectsHoles: true, expectedHoleKinds: ['ambiguous-reference'], tags: ['presupposition', 'still'], notes: '"Still" presupposes prior attempt',
  },
  {
    id: 'g103', category: 'presupposition', utterance: 'Make it bright again',
    expected: { goalCount: 1, expectedAxes: ['brightness'], expectedDirections: ['increase'] },
    expectsHoles: true, expectedHoleKinds: ['ambiguous-reference'], tags: ['presupposition', 'again'], notes: '"Again" presupposes prior state',
  },
  {
    id: 'g104', category: 'presupposition', utterance: "It's already bright enough",
    expected: { constraintCount: 1 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['presupposition', 'already'], notes: '"Already" = preservation',
  },
  {
    id: 'g105', category: 'presupposition', utterance: "It's no longer punchy",
    expected: { goalCount: 1, expectedAxes: ['punch'], expectedDirections: ['increase'] },
    expectsHoles: true, expectedHoleKinds: ['ambiguous-reference'], tags: ['presupposition', 'no-longer'], notes: '"No longer" presupposes prior state',
  },

  // ── Discourse / Edge Cases (106–130) ──
  {
    id: 'g106', category: 'discourse-cue', utterance: 'But make the chorus louder',
    expected: { goalCount: 1 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['discourse', 'contrast'], notes: 'Contrast cue "but"',
  },
  {
    id: 'g107', category: 'discourse-cue', utterance: 'Also, the bass needs more weight',
    expected: { goalCount: 1 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['discourse', 'continuation'], notes: 'Continuation cue "also"',
  },
  {
    id: 'g108', category: 'edge-case', utterance: 'Make it sound like a different song',
    expected: { goalCount: 0 },
    expectsHoles: true, expectedHoleKinds: ['unknown-term'], tags: ['edge', 'vague'], notes: 'Too vague to produce concrete goals',
  },
  {
    id: 'g109', category: 'edge-case', utterance: 'Just... fix it',
    expected: { goalCount: 0 },
    expectsHoles: true, expectedHoleKinds: ['ambiguous-reference'], tags: ['edge', 'vague'], notes: 'Extremely vague',
  },
  {
    id: 'g110', category: 'edge-case', utterance: '',
    expected: { goalCount: 0 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['edge', 'empty'], notes: 'Empty input',
  },

  // ── Extended corpus (111–200 — abbreviated for space, full patterns) ──
  // More axis changes with colloquial language
  {
    id: 'g111', category: 'axis-change', utterance: 'Crank up the energy',
    expected: { goalCount: 1, expectedAxes: ['energy'], expectedDirections: ['increase'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['colloquial'], notes: '"Crank up" = increase significantly',
  },
  {
    id: 'g112', category: 'axis-change', utterance: 'Pull back on the depth',
    expected: { goalCount: 1, expectedAxes: ['depth'], expectedDirections: ['decrease'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['colloquial'], notes: '"Pull back" = decrease',
  },
  {
    id: 'g113', category: 'conjunction', utterance: 'Warmer and thicker but not muddy',
    expected: { goalCount: 2, constraintCount: 1 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['conjunction', 'constraint'], notes: 'Goals + constraint',
  },
  {
    id: 'g114', category: 'scope-binding', utterance: 'From the bridge to the end, reduce complexity',
    expected: { goalCount: 1, scopeType: 'section-range' },
    expectsHoles: false, expectedHoleKinds: [], tags: ['scope', 'section-range'], notes: 'Section range scope',
  },
  {
    id: 'g115', category: 'complex-emotion', utterance: 'Make it feel bittersweet',
    expected: { goalCount: 4 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['emotion'], notes: 'Bittersweet emotion',
  },
  {
    id: 'g116', category: 'impact', utterance: 'More glue on the mix',
    expected: { goalCount: 2 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['impact', 'mix'], notes: 'Compression/glue phrase',
  },
  {
    id: 'g117', category: 'numeric-qualified', utterance: 'Slow it down to 90 BPM',
    expected: { goalCount: 1, expectedDirections: ['set'] },
    expectsHoles: false, expectedHoleKinds: [], tags: ['numeric', 'bpm'], notes: 'Tempo set',
  },
  {
    id: 'g118', category: 'preservation', utterance: 'Same chords, different vibe',
    expected: { constraintCount: 1, goalCount: 1 },
    expectsHoles: true, expectedHoleKinds: ['ambiguous-reference'], tags: ['preserve', 'vague-goal'], notes: '"Different vibe" is vague',
  },
  {
    id: 'g119', category: 'ellipsis', utterance: 'Everywhere',
    expected: { scopeType: 'whole-project' },
    expectsHoles: true, expectedHoleKinds: ['ambiguous-reference'], tags: ['ellipsis', 'scope-expansion'], notes: 'Scope expansion of prior',
  },
  {
    id: 'g120', category: 'conjunction', utterance: 'Make the intro dark and mysterious, the verse anxious, and the chorus triumphant',
    expected: { goalCount: 15 },
    expectsHoles: false, expectedHoleKinds: [], tags: ['multi-goal', 'multi-emotion', 'multi-scope'], notes: 'Complex multi-section instruction',
  },

  // Continue abbreviated entries 121-200
  ...generateExtendedGoldenTests(),
];

/**
 * Generate extended golden tests (121-200) programmatically.
 */
function generateExtendedGoldenTests(): GoldenTestCase[] {
  const tests: GoldenTestCase[] = [];
  const extendedUtterances: Array<{
    utterance: string;
    category: GoldenTestCategory;
    goalCount: number;
    constraintCount: number;
    expectsHoles: boolean;
    tags: string[];
    notes: string;
  }> = [
    { utterance: 'A little brighter', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['degree'], notes: '"A little" = small amount' },
    { utterance: 'Much more spacious', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['degree'], notes: '"Much more" = large amount' },
    { utterance: 'Slightly less dense', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['degree'], notes: '"Slightly less" = small decrease' },
    { utterance: 'Way too thin', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['extreme'], notes: '"Way too" = needs strong correction' },
    { utterance: 'Perfect amount of depth', category: 'preservation', goalCount: 0, constraintCount: 1, expectsHoles: false, tags: ['preserve'], notes: '"Perfect" = preserve current state' },
    { utterance: 'Like the reference track', category: 'affective', goalCount: 0, constraintCount: 0, expectsHoles: true, tags: ['reference'], notes: 'External reference — needs clarification' },
    { utterance: 'Pan the guitar hard left', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['specific'], notes: 'Specific pan instruction' },
    { utterance: 'Remove all reverb from the verse', category: 'structural-edit', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['removal', 'scoped'], notes: 'Effect removal scoped' },
    { utterance: 'Double the bass pattern', category: 'structural-edit', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['structural'], notes: 'Double = duplicate content' },
    { utterance: 'Quantize the drums to 16th notes', category: 'structural-edit', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['quantize'], notes: 'Specific quantize instruction' },
    { utterance: 'Make the snare crack', category: 'impact', goalCount: 2, constraintCount: 0, expectsHoles: false, tags: ['impact', 'entity'], notes: 'Snare + impact' },
    { utterance: 'Smooth out the transitions', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['axis'], notes: 'Smoothness in transitions context' },
    { utterance: 'The vocals need to cut through more', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['presence', 'entity'], notes: 'Presence/clarity for vocals' },
    { utterance: 'Less is more here', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: true, tags: ['vague'], notes: 'Idiomatic — needs interpretation' },
    { utterance: 'Bring up the keys in the second verse', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['entity', 'scoped'], notes: 'Entity + section scope' },
    { utterance: 'Mute the guitar', category: 'structural-edit', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['mute'], notes: 'Mute operation' },
    { utterance: 'Solo the bass', category: 'structural-edit', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['solo'], notes: 'Solo operation' },
    { utterance: 'How does the mix sound now?', category: 'edge-case', goalCount: 0, constraintCount: 0, expectsHoles: false, tags: ['inspect'], notes: 'Inspect intent, not edit' },
    { utterance: 'Show me the spectrum analysis', category: 'edge-case', goalCount: 0, constraintCount: 0, expectsHoles: false, tags: ['inspect'], notes: 'Inspect intent' },
    { utterance: 'What key is this in?', category: 'edge-case', goalCount: 0, constraintCount: 0, expectsHoles: false, tags: ['inspect'], notes: 'Information query' },
    { utterance: 'Undo', category: 'edge-case', goalCount: 0, constraintCount: 0, expectsHoles: false, tags: ['system'], notes: 'System command, not semantic' },
    { utterance: 'That sounds great, now make it wider', category: 'conjunction', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['discourse', 'approval'], notes: 'Approval + new instruction' },
    { utterance: 'I liked the previous version better', category: 'edge-case', goalCount: 0, constraintCount: 0, expectsHoles: true, tags: ['rollback'], notes: 'Rollback request' },
    { utterance: 'Can we try something completely different?', category: 'edge-case', goalCount: 0, constraintCount: 0, expectsHoles: true, tags: ['open-ended'], notes: 'Open-ended creative request' },
    { utterance: 'Add a little saturation to everything', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['global', 'effect'], notes: 'Global effect addition' },
    { utterance: 'The bridge needs to build more tension', category: 'complex-emotion', goalCount: 3, constraintCount: 0, expectsHoles: false, tags: ['emotion', 'scoped'], notes: 'Tension build in bridge' },
    { utterance: 'Less busy in the verse, fuller in the chorus', category: 'conjunction', goalCount: 2, constraintCount: 0, expectsHoles: false, tags: ['multi-scope', 'contrast'], notes: 'Contrasting instructions' },
    { utterance: 'Match the energy levels between verse and chorus', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: true, tags: ['relation'], notes: 'Relation constraint (match)' },
    { utterance: 'The chorus should be at least twice as loud as the verse', category: 'axis-change', goalCount: 1, constraintCount: 1, expectsHoles: false, tags: ['relation', 'numeric'], notes: 'Proportional constraint' },
    { utterance: 'Gradually increase brightness from verse to chorus', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['gradient'], notes: 'Gradient/automation' },
    { utterance: 'Fade out over the last 4 bars', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['automation', 'range'], notes: 'Fade out over range' },
    { utterance: 'Sidechain the bass to the kick', category: 'structural-edit', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['routing', 'sidechain'], notes: 'Sidechain compression' },
    { utterance: 'Bus all the drums together', category: 'structural-edit', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['routing', 'bus'], notes: 'Bus routing' },
    { utterance: 'Create a send to a new reverb bus', category: 'structural-edit', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['routing', 'send'], notes: 'Send routing' },
    { utterance: 'Put a gate on the toms', category: 'structural-edit', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['effect', 'entity'], notes: 'Effect insertion' },
    { utterance: 'Parallel compress the drums', category: 'structural-edit', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['parallel', 'compression'], notes: 'Parallel processing' },
    { utterance: 'Automate the filter cutoff during the buildup', category: 'structural-edit', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['automation', 'filter'], notes: 'Filter automation' },
    { utterance: 'Cross-fade between the two sections', category: 'structural-edit', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['crossfade'], notes: 'Crossfade' },
    { utterance: 'Tighten up the low end', category: 'axis-change', goalCount: 2, constraintCount: 0, expectsHoles: false, tags: ['colloquial', 'eq'], notes: '"Tighten low end" = EQ/compression' },
    { utterance: 'Open up the high end', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['colloquial', 'eq'], notes: '"Open up" = boost highs' },
    { utterance: 'Scoop the mids', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['colloquial', 'eq'], notes: 'EQ scoop' },
    { utterance: 'Add some movement to the pads', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['modulation', 'entity'], notes: 'Modulation/movement' },
    { utterance: 'Make the intro more sparse', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['density', 'scoped'], notes: 'Density decrease' },
    { utterance: 'Fill out the outro', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['density', 'scoped'], notes: '"Fill out" = increase fullness' },
    { utterance: 'The snare is too loud relative to the kick', category: 'axis-change', goalCount: 1, constraintCount: 1, expectsHoles: false, tags: ['relation', 'entity'], notes: 'Relative level constraint' },
    { utterance: 'Everything sounds fine except the bridge', category: 'preservation', goalCount: 0, constraintCount: 1, expectsHoles: true, tags: ['preserve', 'except'], notes: 'Preserve-except pattern' },
    { utterance: 'Widen the stereo image', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['width'], notes: 'Stereo width' },
    { utterance: 'Narrow the center image', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['width'], notes: 'Narrow center' },
    { utterance: 'De-ess the vocals', category: 'structural-edit', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['effect', 'deess'], notes: 'De-essing' },
    { utterance: 'Time-stretch the sample to fit', category: 'structural-edit', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['dsp'], notes: 'Time stretch' },
    { utterance: 'Pitch-shift the vocal down 2 semitones', category: 'structural-edit', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['dsp', 'numeric'], notes: 'Pitch shift with amount' },
    { utterance: 'Humanize the drums', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['humanize'], notes: 'Humanize operation' },
    { utterance: 'Make it radio-ready', category: 'affective', goalCount: 3, constraintCount: 0, expectsHoles: false, tags: ['aesthetic', 'colloquial'], notes: 'Aesthetic target' },
    { utterance: 'Polish the mix', category: 'affective', goalCount: 2, constraintCount: 0, expectsHoles: false, tags: ['aesthetic'], notes: '"Polish" = clarity + smoothness' },
    { utterance: 'It needs more room to breathe', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['spaciousness', 'colloquial'], notes: '"Room to breathe" = spaciousness + less density' },
    { utterance: 'Make the drums hit harder on the downbeat', category: 'impact', goalCount: 2, constraintCount: 0, expectsHoles: false, tags: ['impact', 'beat-specific'], notes: 'Beat-specific impact' },
    { utterance: 'I want the chorus to sound huge', category: 'affective', goalCount: 3, constraintCount: 0, expectsHoles: false, tags: ['affective', 'scoped'], notes: '"Huge" = width + fullness + energy' },
    { utterance: 'Strip it back to just piano and vocals', category: 'structural-edit', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['structural', 'arrangement'], notes: 'Arrangement reduction' },
    { utterance: 'Layer another synth pad', category: 'structural-edit', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['structural', 'layer'], notes: 'Layer addition' },
    { utterance: 'Add some ear candy in the second chorus', category: 'structural-edit', goalCount: 1, constraintCount: 0, expectsHoles: true, tags: ['vague', 'scoped'], notes: '"Ear candy" is vague' },
    { utterance: 'Copy the bass pattern from verse 1 to verse 2', category: 'structural-edit', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['structural', 'copy'], notes: 'Copy between sections' },
    { utterance: 'Swap the left and right channels', category: 'structural-edit', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['routing'], notes: 'Channel swap' },
    { utterance: 'Turn up the reverb on the snare', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['effect-param', 'entity'], notes: 'Effect parameter adjustment' },
    { utterance: 'This is perfect, save it', category: 'edge-case', goalCount: 0, constraintCount: 0, expectsHoles: false, tags: ['approval', 'system'], notes: 'No changes needed' },
    { utterance: 'Can you explain what you did?', category: 'edge-case', goalCount: 0, constraintCount: 0, expectsHoles: false, tags: ['meta', 'inspect'], notes: 'Meta query about prior action' },
    { utterance: 'Undo the last change', category: 'edge-case', goalCount: 0, constraintCount: 0, expectsHoles: false, tags: ['system', 'undo'], notes: 'Undo request' },
    { utterance: 'Compare before and after', category: 'edge-case', goalCount: 0, constraintCount: 0, expectsHoles: false, tags: ['inspect', 'comparison'], notes: 'A/B comparison request' },
    { utterance: 'Make it sound like a lo-fi recording', category: 'affective', goalCount: 4, constraintCount: 0, expectsHoles: false, tags: ['aesthetic'], notes: 'Lo-fi aesthetic target' },
    { utterance: 'Give the verse a jazz feel', category: 'complex-emotion', goalCount: 3, constraintCount: 0, expectsHoles: true, tags: ['genre', 'scoped'], notes: 'Genre target — partially vague' },
    { utterance: 'Make it bounce more', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['rhythm', 'colloquial'], notes: '"Bounce" = groove/swing' },
    { utterance: 'Tighten up the groove', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['rhythm', 'quantize'], notes: 'Groove tightening' },
    { utterance: 'More swing on the hi-hats', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['rhythm', 'entity'], notes: 'Swing on specific instrument' },
    { utterance: 'Simplify the drum pattern', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['complexity', 'entity'], notes: 'Complexity decrease' },
    { utterance: 'Make the arrangement more complex in the bridge', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['complexity', 'scoped'], notes: 'Complexity increase in bridge' },
    { utterance: 'I want a big buildup before the drop', category: 'structural-edit', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['structural', 'dynamic'], notes: 'Buildup creation' },
    { utterance: 'Create a breakdown section', category: 'structural-edit', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['structural', 'section'], notes: 'New section creation' },
    { utterance: 'The transition between verse and chorus is too abrupt', category: 'axis-change', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['transition', 'smoothness'], notes: 'Transition smoothing' },
    { utterance: 'Add fills at the end of each section', category: 'structural-edit', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['structural', 'fills'], notes: 'Fill addition' },
    { utterance: 'Double-track the guitar', category: 'structural-edit', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['structural', 'double'], notes: 'Double-tracking' },
    { utterance: 'Remove all effects and start fresh', category: 'structural-edit', goalCount: 1, constraintCount: 0, expectsHoles: false, tags: ['structural', 'reset'], notes: 'Effect reset' },
  ];

  for (let i = 0; i < extendedUtterances.length; i++) {
    const entry = extendedUtterances[i];
    if (!entry) continue;
    tests.push({
      id: `g${121 + i}`,
      category: entry.category,
      utterance: entry.utterance,
      expected: {
        goalCount: entry.goalCount,
        constraintCount: entry.constraintCount,
      },
      expectsHoles: entry.expectsHoles,
      expectedHoleKinds: entry.expectsHoles ? ['ambiguous-reference'] : [],
      tags: entry.tags,
      notes: entry.notes,
    });
  }

  return tests;
}

/**
 * Get golden test count.
 */
export function getGoldenTestCount(): number {
  return GOLDEN_TESTS.length;
}

/**
 * Get golden tests by category.
 */
export function getGoldenTestsByCategory(category: GoldenTestCategory): readonly GoldenTestCase[] {
  return GOLDEN_TESTS.filter(t => t.category === category);
}

/**
 * Get golden tests by tag.
 */
export function getGoldenTestsByTag(tag: string): readonly GoldenTestCase[] {
  return GOLDEN_TESTS.filter(t => t.tags.includes(tag));
}

// =============================================================================
// § 192 — Semantic Diff Test Infrastructure
// =============================================================================

/**
 * A semantic diff: captures the CPL output difference caused by a lexicon change.
 */
export interface SemanticDiff {
  /** Diff ID */
  readonly id: string;
  /** The golden test that was affected */
  readonly testId: string;
  /** The utterance */
  readonly utterance: string;
  /** What changed in the lexicon */
  readonly lexiconChange: string;
  /** Field path that changed */
  readonly changedPath: string;
  /** Old value */
  readonly oldValue: string;
  /** New value */
  readonly newValue: string;
  /** Severity of the change */
  readonly severity: 'breaking' | 'semantic-shift' | 'cosmetic';
  /** Whether this is an expected change */
  readonly expected: boolean;
}

/**
 * Configuration for semantic diff testing.
 */
export interface SemanticDiffConfig {
  /** Which golden tests to run */
  readonly testIds: readonly string[];
  /** Snapshot file path */
  readonly snapshotPath: string;
  /** Whether to update snapshots */
  readonly updateSnapshots: boolean;
  /** Severity threshold for failure */
  readonly failOnSeverity: 'breaking' | 'semantic-shift' | 'cosmetic';
}

/**
 * A snapshot of CPL output for a set of utterances.
 */
export interface CPLSnapshot {
  /** Snapshot version */
  readonly version: string;
  /** Snapshot creation time */
  readonly createdAt: number;
  /** Per-utterance snapshots */
  readonly entries: readonly CPLSnapshotEntry[];
}

/**
 * A single snapshot entry.
 */
export interface CPLSnapshotEntry {
  /** Test ID */
  readonly testId: string;
  /** Utterance */
  readonly utterance: string;
  /** Serialized CPL output (JSON) */
  readonly cplJson: string;
  /** Hash for quick comparison */
  readonly hash: string;
}

/**
 * Compute a simple hash for a string.
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

// =============================================================================
// § 193 — Scope Safety Test Infrastructure
// =============================================================================

/**
 * A scope safety test: verifies deterministic scope binding.
 */
export interface ScopeSafetyTest {
  readonly id: string;
  readonly utterance: string;
  /** The expected scope binding (section name, bar range, etc.) */
  readonly expectedBinding: ScopeBinding;
  /** Project fixture to use */
  readonly fixture: ProjectFixture;
  /** Number of times to run (for determinism check) */
  readonly repetitions: number;
}

/**
 * A scope binding result.
 */
export interface ScopeBinding {
  readonly type: 'section' | 'bar-range' | 'entity' | 'whole-project';
  readonly value: string;
  readonly deterministic: boolean;
}

/**
 * A project fixture for scope testing.
 */
export interface ProjectFixture {
  readonly id: string;
  readonly name: string;
  readonly sections: readonly string[];
  readonly tracks: readonly string[];
  readonly totalBars: number;
  readonly markers: readonly string[];
}

/**
 * Standard project fixtures.
 */
export const STANDARD_FIXTURES: readonly ProjectFixture[] = [
  {
    id: 'fix-pop-song',
    name: 'Standard Pop Song',
    sections: ['intro', 'verse', 'pre-chorus', 'chorus', 'verse', 'pre-chorus', 'chorus', 'bridge', 'chorus', 'outro'],
    tracks: ['vocals', 'guitar', 'bass', 'drums', 'keys', 'synth', 'backing-vocals'],
    totalBars: 120,
    markers: ['Start', 'Drop', 'Build', 'End'],
  },
  {
    id: 'fix-edm-track',
    name: 'EDM Track',
    sections: ['intro', 'buildup', 'drop', 'breakdown', 'buildup', 'drop', 'outro'],
    tracks: ['kick', 'bass', 'lead-synth', 'pad', 'hi-hats', 'fx', 'vocal-chop'],
    totalBars: 200,
    markers: ['Drop1', 'Drop2', 'Breakdown', 'Final'],
  },
  {
    id: 'fix-minimal',
    name: 'Minimal',
    sections: ['intro', 'main', 'outro'],
    tracks: ['piano', 'vocal'],
    totalBars: 40,
    markers: [],
  },
];

// =============================================================================
// § 194 — Operator Interaction Test Infrastructure
// =============================================================================

/**
 * An operator interaction test: verifies MRS/scope interactions.
 */
export interface OperatorInteractionTest {
  readonly id: string;
  readonly category: OperatorInteractionCategory;
  readonly utterance: string;
  /** Expected operators detected */
  readonly expectedOperators: readonly string[];
  /** Expected scope ordering */
  readonly expectedScopeOrder?: readonly string[];
  /** Whether the MRS should be underspecified */
  readonly expectUnderspecified: boolean;
  /** Expected number of possible readings */
  readonly expectedReadingCount?: number;
  /** Notes */
  readonly notes: string;
}

export type OperatorInteractionCategory =
  | 'negation-scope'      // "Don't make everything louder"
  | 'only-scope'          // "Only change the drums"
  | 'quantifier-scope'    // "Make every track brighter"
  | 'negation-only'       // "Don't only change the drums"
  | 'quantifier-negation' // "Don't make any track louder"
  | 'multi-quantifier';   // "Make every verse's chorus louder"

/**
 * Standard operator interaction tests.
 */
export const OPERATOR_INTERACTION_TESTS: readonly OperatorInteractionTest[] = [
  {
    id: 'oi-001', category: 'negation-scope',
    utterance: "Don't make everything louder",
    expectedOperators: ['negation', 'universal-quantifier'],
    expectUnderspecified: false,
    notes: 'Negation scopes over universal: "It is not the case that everything gets louder" (= preserve)',
  },
  {
    id: 'oi-002', category: 'negation-scope',
    utterance: "Don't make anything louder",
    expectedOperators: ['negation', 'existential-quantifier'],
    expectUnderspecified: false,
    notes: '"Don\'t + anything" = nothing gets louder (= preserve all)',
  },
  {
    id: 'oi-003', category: 'only-scope',
    utterance: 'Only change the brightness',
    expectedOperators: ['only'],
    expectUnderspecified: false,
    notes: '"Only" restricts scope to brightness, preserves everything else',
  },
  {
    id: 'oi-004', category: 'only-scope',
    utterance: 'Only in the chorus',
    expectedOperators: ['only'],
    expectUnderspecified: false,
    notes: '"Only" restricts scope to chorus section',
  },
  {
    id: 'oi-005', category: 'quantifier-scope',
    utterance: 'Make every track brighter',
    expectedOperators: ['universal-quantifier'],
    expectUnderspecified: false,
    notes: 'Universal quantifier over tracks',
  },
  {
    id: 'oi-006', category: 'quantifier-scope',
    utterance: 'Brighten some of the tracks',
    expectedOperators: ['existential-quantifier'],
    expectUnderspecified: true,
    expectedReadingCount: 2,
    notes: '"Some" is ambiguous — which tracks?',
  },
  {
    id: 'oi-007', category: 'negation-only',
    utterance: "Don't just change the drums",
    expectedOperators: ['negation', 'only'],
    expectUnderspecified: false,
    notes: 'Negation over "only" = change more than just drums',
  },
  {
    id: 'oi-008', category: 'quantifier-negation',
    utterance: "Don't make any track louder",
    expectedOperators: ['negation', 'existential-quantifier'],
    expectUnderspecified: false,
    notes: '"Don\'t + any" = no track gets louder',
  },
  {
    id: 'oi-009', category: 'multi-quantifier',
    utterance: 'In every verse, make all tracks warmer',
    expectedOperators: ['universal-quantifier', 'universal-quantifier'],
    expectUnderspecified: true,
    expectedReadingCount: 2,
    notes: 'Two universals: scope ambiguity (∀verse∀track vs ∀track∀verse)',
  },
  {
    id: 'oi-010', category: 'negation-scope',
    utterance: 'Nothing should be louder than the vocals',
    expectedOperators: ['negation', 'comparative'],
    expectUnderspecified: false,
    notes: 'Constraint: vocals are the loudest',
  },
];

// =============================================================================
// § 195 — Presupposition Trigger Tests
// =============================================================================

/**
 * A presupposition trigger test.
 */
export interface PresuppositionTest {
  readonly id: string;
  readonly trigger: PresuppositionTriggerType;
  readonly utterance: string;
  /** Whether prior context satisfies the presupposition */
  readonly priorContextSatisfied: boolean;
  /** Expected hole if prior context is missing */
  readonly expectedHoleKind?: string;
  /** Expected presupposition content */
  readonly presuppositionContent: string;
  /** Prior context that would satisfy (if needed) */
  readonly satisfyingContext?: string;
  /** Notes */
  readonly notes: string;
}

export type PresuppositionTriggerType =
  | 'still'        // "still too bright" → was bright before
  | 'again'        // "make it bright again" → was bright before
  | 'already'      // "it's already bright" → it is bright now
  | 'no_longer'    // "it's no longer punchy" → was punchy before
  | 'back'         // "put it back" → was in a different state before
  | 'even'         // "even brighter" → was already bright
  | 'yet'          // "not done yet" → process is ongoing
  | 'keep'         // "keep the brightness" → brightness exists
  | 'continue';    // "continue adding" → was adding before

/**
 * Standard presupposition tests.
 */
export const PRESUPPOSITION_TESTS: readonly PresuppositionTest[] = [
  {
    id: 'pt-001', trigger: 'still', utterance: 'Still too bright',
    priorContextSatisfied: false,
    expectedHoleKind: 'ambiguous-reference',
    presuppositionContent: 'There was a prior attempt to reduce brightness',
    satisfyingContext: 'User previously said "make it darker"',
    notes: '"Still" presupposes an unresolved prior state',
  },
  {
    id: 'pt-002', trigger: 'again', utterance: 'Make it bright again',
    priorContextSatisfied: false,
    expectedHoleKind: 'ambiguous-reference',
    presuppositionContent: 'It was bright at some prior point',
    satisfyingContext: 'The original state was bright before user made changes',
    notes: '"Again" presupposes return to prior state',
  },
  {
    id: 'pt-003', trigger: 'already', utterance: "It's already bright enough",
    priorContextSatisfied: true,
    presuppositionContent: 'The current state has sufficient brightness',
    notes: '"Already" confirms current state — generates preserve constraint',
  },
  {
    id: 'pt-004', trigger: 'no_longer', utterance: "The bass is no longer punchy",
    priorContextSatisfied: false,
    expectedHoleKind: 'ambiguous-reference',
    presuppositionContent: 'The bass was punchy at some prior point',
    satisfyingContext: 'The bass had punch before a recent edit removed it',
    notes: '"No longer" presupposes a lost property → restore goal',
  },
  {
    id: 'pt-005', trigger: 'back', utterance: 'Put it back the way it was',
    priorContextSatisfied: false,
    expectedHoleKind: 'ambiguous-reference',
    presuppositionContent: 'There is a known prior state to restore',
    satisfyingContext: 'Edit history contains at least one prior state',
    notes: '"Put it back" = undo/restore presupposition',
  },
  {
    id: 'pt-006', trigger: 'even', utterance: 'Even brighter than before',
    priorContextSatisfied: false,
    expectedHoleKind: 'ambiguous-reference',
    presuppositionContent: 'There was a prior brightness increase',
    satisfyingContext: 'User previously said "make it brighter"',
    notes: '"Even X-er" presupposes X was already applied',
  },
  {
    id: 'pt-007', trigger: 'yet', utterance: "It's not warm enough yet",
    priorContextSatisfied: false,
    expectedHoleKind: 'ambiguous-reference',
    presuppositionContent: 'An ongoing process of adding warmth exists',
    satisfyingContext: 'User previously requested warmth increase',
    notes: '"Yet" presupposes an ongoing but incomplete process',
  },
  {
    id: 'pt-008', trigger: 'keep', utterance: 'Keep the reverb level',
    priorContextSatisfied: true,
    presuppositionContent: 'A reverb level currently exists',
    notes: '"Keep" presupposes the entity exists → preserve constraint',
  },
  {
    id: 'pt-009', trigger: 'continue', utterance: 'Continue adding layers',
    priorContextSatisfied: false,
    expectedHoleKind: 'ambiguous-reference',
    presuppositionContent: 'Layer addition was already in progress',
    satisfyingContext: 'User previously added layers',
    notes: '"Continue" presupposes an ongoing activity',
  },
  {
    id: 'pt-010', trigger: 'still', utterance: 'The drums still sound weak',
    priorContextSatisfied: false,
    expectedHoleKind: 'ambiguous-reference',
    presuppositionContent: 'A prior attempt was made to strengthen the drums',
    satisfyingContext: 'User previously requested more punch/impact on drums',
    notes: '"Still" + negative evaluation = prior fix attempt failed',
  },
  {
    id: 'pt-011', trigger: 'again', utterance: 'Add the bass back again',
    priorContextSatisfied: false,
    expectedHoleKind: 'ambiguous-reference',
    presuppositionContent: 'Bass was present, then removed, now needs re-adding',
    satisfyingContext: 'User previously removed the bass track',
    notes: '"Back again" presupposes removal + desire to restore',
  },
  {
    id: 'pt-012', trigger: 'back', utterance: 'Go back to the previous version',
    priorContextSatisfied: false,
    expectedHoleKind: 'ambiguous-reference',
    presuppositionContent: 'A previous version exists in edit history',
    satisfyingContext: 'At least one undo state is available',
    notes: '"Go back" = version rollback presupposition',
  },
];

// =============================================================================
// § Utility Functions
// =============================================================================

/**
 * Format a golden test for display.
 */
export function formatGoldenTest(test: GoldenTestCase): string {
  const lines: string[] = [];
  lines.push(`[${test.id}] ${test.category}: "${test.utterance}"`);
  lines.push(`  Expected: ${test.expected.goalCount ?? '?'} goals, ${test.expected.constraintCount ?? '?'} constraints`);
  if (test.expectsHoles) {
    lines.push(`  Holes: ${test.expectedHoleKinds.join(', ')}`);
  }
  lines.push(`  Tags: ${test.tags.join(', ')}`);
  lines.push(`  Notes: ${test.notes}`);
  return lines.join('\n');
}

/**
 * Get test coverage statistics.
 */
export function getTestCoverageStats(): {
  readonly total: number;
  readonly byCategory: ReadonlyMap<string, number>;
  readonly withHoles: number;
  readonly withoutHoles: number;
} {
  const byCategory = new Map<string, number>();
  let withHoles = 0;
  let withoutHoles = 0;

  for (const test of GOLDEN_TESTS) {
    const count = byCategory.get(test.category) ?? 0;
    byCategory.set(test.category, count + 1);
    if (test.expectsHoles) withHoles++;
    else withoutHoles++;
  }

  return {
    total: GOLDEN_TESTS.length,
    byCategory,
    withHoles,
    withoutHoles,
  };
}
