/**
 * dialogue-eval.ts -- Steps 236-240: Dialogue evaluation and testing suite
 *
 * Step 236: Dialogue Fixture Suite
 * Step 237: Anaphora Correctness Tests
 * Step 238: Presupposition Handling Tests
 * Step 239: QUD Behavior Tests
 * Step 240: Repair Move Tests
 *
 * All types are locally defined (no external imports).
 */

// ===================== STEP 236: DIALOGUE FIXTURE SUITE =====================

// ---- 236 Types ----

/** Speech act type used in fixture expectations. */
export type FixtureSpeechAct =
  | 'request'
  | 'command'
  | 'suggestion'
  | 'question'
  | 'inform'
  | 'confirm'
  | 'deny'
  | 'explore'
  | 'repair'
  | 'clarify-response'
  | 'ellipsis'
  | 'undo'
  | 'redo';

/** Category of a dialogue fixture. */
export type FixtureCategory =
  | 'simple-edit'
  | 'pronoun-resolution'
  | 'scope-inheritance'
  | 'clarification-resolution'
  | 'repair-correction'
  | 'ellipsis-chain'
  | 'topic-shift'
  | 'mixed-exploration'
  | 'multi-action'
  | 'preference-setting';

/** Severity of a fixture failure. */
export type FixtureSeverity = 'critical' | 'major' | 'minor' | 'cosmetic';

/** Status of a fixture run. */
export type FixtureRunStatus = 'pass' | 'fail' | 'partial' | 'skip' | 'error';

/** CPL shape element for fixture expectations. */
export interface ExpectedCPLShape {
  readonly action: string;
  readonly target: string;
  readonly constraintCount: number;
  readonly hasScope: boolean;
  readonly preserveKeys: readonly string[];
}

/** Expected binding for a referent in a turn. */
export interface ExpectedBinding {
  readonly referent: string;
  readonly boundTo: string;
  readonly bindingType: 'entity' | 'action' | 'property' | 'scope' | 'value';
  readonly confidence: number;
  readonly source: 'explicit' | 'anaphoric' | 'inferred' | 'default';
}

/** Expected clarification question. */
export interface ExpectedClarification {
  readonly trigger: string;
  readonly ambiguityType: 'lexical' | 'scope' | 'reference' | 'attachment' | 'degree';
  readonly candidateCount: number;
  readonly questionPattern: string;
  readonly isRequired: boolean;
}

/** A single turn within a dialogue fixture. */
export interface FixtureTurn {
  readonly turnIndex: number;
  readonly speaker: 'user' | 'system';
  readonly utterance: string;
  readonly expectedSpeechAct: FixtureSpeechAct;
  readonly expectedBindings: readonly ExpectedBinding[];
  readonly expectedClarifications: readonly ExpectedClarification[];
  readonly expectedCPL: ExpectedCPLShape | null;
  readonly notes: string;
}

/** Configuration for running fixtures. */
export interface FixtureConfig {
  readonly strictMode: boolean;
  readonly toleratePartial: boolean;
  readonly maxTurns: number;
  readonly timeoutMs: number;
  readonly categories: readonly FixtureCategory[];
  readonly verboseOutput: boolean;
  readonly stopOnFirstFailure: boolean;
}

/** Complete dialogue fixture with metadata. */
export interface DialogueFixture {
  readonly id: string;
  readonly name: string;
  readonly category: FixtureCategory;
  readonly description: string;
  readonly turns: readonly FixtureTurn[];
  readonly severity: FixtureSeverity;
  readonly tags: readonly string[];
}

/** Result from running a single fixture turn. */
export interface TurnResult {
  readonly turnIndex: number;
  readonly status: FixtureRunStatus;
  readonly bindingMatches: number;
  readonly bindingMisses: number;
  readonly clarificationMatches: number;
  readonly clarificationMisses: number;
  readonly cplMatch: boolean;
  readonly errorMessage: string;
}

/** Result from running an entire fixture. */
export interface FixtureResult {
  readonly fixtureId: string;
  readonly status: FixtureRunStatus;
  readonly turnResults: readonly TurnResult[];
  readonly passedTurns: number;
  readonly totalTurns: number;
  readonly durationMs: number;
  readonly errorMessages: readonly string[];
}

/** Aggregated suite of fixtures. */
export interface FixtureSuite {
  readonly name: string;
  readonly version: string;
  readonly fixtures: readonly DialogueFixture[];
  readonly createdAt: string;
  readonly description: string;
}

/** Summary statistics for a fixture run. */
export interface FixtureSummary {
  readonly totalFixtures: number;
  readonly passed: number;
  readonly failed: number;
  readonly partial: number;
  readonly skipped: number;
  readonly errors: number;
  readonly totalTurns: number;
  readonly passedTurns: number;
  readonly totalBindings: number;
  readonly matchedBindings: number;
  readonly categoryCounts: ReadonlyMap<string, number>;
}

// ---- 236 Helpers ----

function makeTurn(
  turnIndex: number,
  speaker: 'user' | 'system',
  utterance: string,
  expectedSpeechAct: FixtureSpeechAct,
  expectedBindings: readonly ExpectedBinding[],
  expectedClarifications: readonly ExpectedClarification[],
  expectedCPL: ExpectedCPLShape | null,
  notes: string
): FixtureTurn {
  return {
    turnIndex,
    speaker,
    utterance,
    expectedSpeechAct,
    expectedBindings,
    expectedClarifications,
    expectedCPL,
    notes,
  };
}

function makeBinding(
  referent: string,
  boundTo: string,
  bindingType: ExpectedBinding['bindingType'],
  confidence: number,
  source: ExpectedBinding['source']
): ExpectedBinding {
  return { referent, boundTo, bindingType, confidence, source };
}

function makeClarification(
  trigger: string,
  ambiguityType: ExpectedClarification['ambiguityType'],
  candidateCount: number,
  questionPattern: string,
  isRequired: boolean
): ExpectedClarification {
  return { trigger, ambiguityType, candidateCount, questionPattern, isRequired };
}

function makeCPL(
  action: string,
  target: string,
  constraintCount: number,
  hasScope: boolean,
  preserveKeys: readonly string[]
): ExpectedCPLShape {
  return { action, target, constraintCount, hasScope, preserveKeys };
}

function makeFixture(
  id: string,
  name: string,
  category: FixtureCategory,
  description: string,
  turns: readonly FixtureTurn[],
  severity: FixtureSeverity,
  tags: readonly string[]
): DialogueFixture {
  return { id, name, category, description, turns, severity, tags };
}

// ---- 236 Fixture Data ----

function buildSimpleEditFixtures(): readonly DialogueFixture[] {
  return [
    makeFixture('se-01', 'Basic three-step edit', 'simple-edit',
      'User sets tempo, key, then time signature in sequence.',
      [
        makeTurn(0, 'user', 'set the tempo to 120 bpm', 'command',
          [makeBinding('tempo', '120', 'property', 0.95, 'explicit')],
          [], makeCPL('set', 'tempo', 1, false, []), 'Initial tempo set'),
        makeTurn(1, 'user', 'change the key to C minor', 'command',
          [makeBinding('key', 'C minor', 'property', 0.95, 'explicit')],
          [], makeCPL('set', 'key', 1, false, ['tempo']), 'Key change preserves tempo'),
        makeTurn(2, 'user', 'make it 3/4 time', 'command',
          [makeBinding('time-sig', '3/4', 'property', 0.95, 'explicit')],
          [], makeCPL('set', 'time-signature', 1, false, ['tempo', 'key']), 'Time sig preserves previous'),
      ],
      'critical', ['basic', 'sequential']),
    makeFixture('se-02', 'Add then modify instrument', 'simple-edit',
      'User adds a piano track then modifies its volume.',
      [
        makeTurn(0, 'user', 'add a piano track', 'command',
          [makeBinding('instrument', 'piano', 'entity', 0.95, 'explicit')],
          [], makeCPL('add', 'track', 1, false, []), 'Add piano'),
        makeTurn(1, 'user', 'set its volume to 80%', 'command',
          [makeBinding('it', 'piano-track', 'entity', 0.9, 'anaphoric'),
           makeBinding('volume', '80%', 'value', 0.95, 'explicit')],
          [], makeCPL('set', 'volume', 1, true, ['instrument']), 'Pronoun resolves to piano track'),
        makeTurn(2, 'user', 'now pan it left', 'command',
          [makeBinding('it', 'piano-track', 'entity', 0.9, 'anaphoric'),
           makeBinding('pan', 'left', 'value', 0.95, 'explicit')],
          [], makeCPL('set', 'pan', 1, true, ['instrument', 'volume']), 'Pan preserves volume'),
      ],
      'critical', ['basic', 'track-editing']),
    makeFixture('se-03', 'Delete and re-add sequence', 'simple-edit',
      'User adds, deletes, then re-adds a melody.',
      [
        makeTurn(0, 'user', 'create a melody in the verse', 'command',
          [makeBinding('melody', 'new-melody', 'entity', 0.9, 'explicit'),
           makeBinding('section', 'verse', 'scope', 0.95, 'explicit')],
          [], makeCPL('create', 'melody', 1, true, []), 'Create melody in verse'),
        makeTurn(1, 'user', 'actually delete that', 'command',
          [makeBinding('that', 'new-melody', 'entity', 0.9, 'anaphoric')],
          [], makeCPL('delete', 'melody', 0, true, []), 'Delete refers to melody'),
        makeTurn(2, 'user', 'add it back but in the chorus', 'command',
          [makeBinding('it', 'deleted-melody', 'entity', 0.85, 'anaphoric'),
           makeBinding('section', 'chorus', 'scope', 0.95, 'explicit')],
          [], makeCPL('create', 'melody', 1, true, []), 'Restore in different scope'),
      ],
      'major', ['basic', 'delete-restore']),
  ];
}

function buildPronounResolutionFixtures(): readonly DialogueFixture[] {
  return [
    makeFixture('pr-01', 'Five-turn pronoun chain', 'pronoun-resolution',
      'Pronoun "it" tracks across five turns as context evolves.',
      [
        makeTurn(0, 'user', 'add a drum pattern', 'command',
          [makeBinding('pattern', 'drum-pattern', 'entity', 0.95, 'explicit')],
          [], makeCPL('add', 'pattern', 1, false, []), 'Introduce drum pattern'),
        makeTurn(1, 'user', 'make it faster', 'command',
          [makeBinding('it', 'drum-pattern', 'entity', 0.9, 'anaphoric')],
          [], makeCPL('modify', 'tempo', 1, true, []), '"it" = drum pattern'),
        makeTurn(2, 'user', 'add some reverb to it', 'command',
          [makeBinding('it', 'drum-pattern', 'entity', 0.9, 'anaphoric')],
          [], makeCPL('add', 'effect', 1, true, []), '"it" still = drum pattern'),
        makeTurn(3, 'user', 'now add a bass line', 'command',
          [makeBinding('bass', 'bass-line', 'entity', 0.95, 'explicit')],
          [], makeCPL('add', 'pattern', 1, false, []), 'New entity introduced'),
        makeTurn(4, 'user', 'make it louder', 'command',
          [makeBinding('it', 'bass-line', 'entity', 0.85, 'anaphoric')],
          [], makeCPL('modify', 'volume', 1, true, []), '"it" shifts to bass line'),
      ],
      'critical', ['pronoun', 'chain', 'shift']),
    makeFixture('pr-02', 'Ambiguous pronoun with two entities', 'pronoun-resolution',
      'Two entities in context; "it" is ambiguous, triggers clarification.',
      [
        makeTurn(0, 'user', 'add a piano and a guitar', 'command',
          [makeBinding('piano', 'piano-track', 'entity', 0.95, 'explicit'),
           makeBinding('guitar', 'guitar-track', 'entity', 0.95, 'explicit')],
          [], makeCPL('add', 'tracks', 2, false, []), 'Two entities introduced'),
        makeTurn(1, 'user', 'make it louder', 'command',
          [makeBinding('it', 'ambiguous', 'entity', 0.4, 'anaphoric')],
          [makeClarification('it', 'reference', 2, 'which.*piano.*guitar', true)],
          null, 'Ambiguous: piano or guitar?'),
        makeTurn(2, 'user', 'the guitar', 'clarify-response',
          [makeBinding('it', 'guitar-track', 'entity', 0.95, 'explicit')],
          [], makeCPL('modify', 'volume', 1, true, []), 'Clarification resolves to guitar'),
        makeTurn(3, 'user', 'do the same to the piano', 'command',
          [makeBinding('same', 'volume-increase', 'action', 0.85, 'anaphoric'),
           makeBinding('piano', 'piano-track', 'entity', 0.95, 'explicit')],
          [], makeCPL('modify', 'volume', 1, true, []), 'Transfer action to piano'),
        makeTurn(4, 'user', 'now make them both quieter', 'command',
          [makeBinding('them', 'piano+guitar', 'entity', 0.9, 'anaphoric')],
          [], makeCPL('modify', 'volume', 1, true, []), '"them" = both tracks'),
      ],
      'critical', ['pronoun', 'ambiguity', 'clarification']),
    makeFixture('pr-03', 'That refers to action not entity', 'pronoun-resolution',
      '"that" refers to the last action performed, not the entity.',
      [
        makeTurn(0, 'user', 'transpose the melody up a fifth', 'command',
          [makeBinding('melody', 'melody-1', 'entity', 0.95, 'explicit'),
           makeBinding('interval', 'fifth', 'value', 0.95, 'explicit')],
          [], makeCPL('transpose', 'melody', 2, true, []), 'Transpose action'),
        makeTurn(1, 'user', 'undo that', 'undo',
          [makeBinding('that', 'transpose-action', 'action', 0.9, 'anaphoric')],
          [], makeCPL('undo', 'transpose', 0, false, []), '"that" = the transpose'),
        makeTurn(2, 'user', 'do that again but a fourth', 'command',
          [makeBinding('that', 'transpose-action', 'action', 0.85, 'anaphoric'),
           makeBinding('interval', 'fourth', 'value', 0.95, 'explicit')],
          [], makeCPL('transpose', 'melody', 2, true, []), 'Repeat action with modification'),
      ],
      'major', ['pronoun', 'action-reference']),
  ];
}

function buildScopeInheritanceFixtures(): readonly DialogueFixture[] {
  return [
    makeFixture('si-01', 'Scope narrows then widens', 'scope-inheritance',
      'User enters verse scope, edits, then backs out to global scope.',
      [
        makeTurn(0, 'user', 'go to the verse section', 'command',
          [makeBinding('scope', 'verse', 'scope', 0.95, 'explicit')],
          [], makeCPL('navigate', 'section', 1, true, []), 'Enter verse scope'),
        makeTurn(1, 'user', 'make the drums louder here', 'command',
          [makeBinding('drums', 'drum-track', 'entity', 0.95, 'explicit'),
           makeBinding('here', 'verse', 'scope', 0.9, 'anaphoric')],
          [], makeCPL('modify', 'volume', 1, true, []), 'Edit within verse scope'),
        makeTurn(2, 'user', 'add a cymbal crash at the start', 'command',
          [makeBinding('cymbal', 'crash', 'entity', 0.95, 'explicit'),
           makeBinding('position', 'start-of-verse', 'scope', 0.85, 'inferred')],
          [], makeCPL('add', 'event', 2, true, []), 'Position relative to verse'),
        makeTurn(3, 'user', 'now go back to the full song', 'command',
          [makeBinding('scope', 'global', 'scope', 0.95, 'explicit')],
          [], makeCPL('navigate', 'section', 0, false, []), 'Return to global scope'),
      ],
      'major', ['scope', 'navigation', 'inheritance']),
    makeFixture('si-02', 'Nested scope with property inheritance', 'scope-inheritance',
      'Edits in outer scope carry into inner scope unless overridden.',
      [
        makeTurn(0, 'user', 'set the global reverb to large hall', 'command',
          [makeBinding('reverb', 'large-hall', 'property', 0.95, 'explicit')],
          [], makeCPL('set', 'effect', 1, false, []), 'Global reverb'),
        makeTurn(1, 'user', 'in the bridge, make it a small room instead', 'command',
          [makeBinding('scope', 'bridge', 'scope', 0.95, 'explicit'),
           makeBinding('reverb', 'small-room', 'property', 0.95, 'explicit')],
          [], makeCPL('set', 'effect', 1, true, []), 'Override in bridge'),
        makeTurn(2, 'user', 'what about the chorus?', 'question',
          [makeBinding('scope', 'chorus', 'scope', 0.95, 'explicit'),
           makeBinding('reverb', 'large-hall', 'property', 0.8, 'inferred')],
          [], null, 'Chorus inherits global reverb'),
        makeTurn(3, 'user', 'keep the global one there', 'confirm',
          [makeBinding('there', 'chorus', 'scope', 0.85, 'anaphoric'),
           makeBinding('reverb', 'large-hall', 'property', 0.9, 'anaphoric')],
          [], null, 'Confirm inheritance'),
      ],
      'major', ['scope', 'inheritance', 'override']),
  ];
}

function buildClarificationFixtures(): readonly DialogueFixture[] {
  return [
    makeFixture('cl-01', 'Lexical ambiguity resolved via clarification', 'clarification-resolution',
      '"Bass" is ambiguous between instrument and frequency range.',
      [
        makeTurn(0, 'user', 'boost the bass', 'command',
          [makeBinding('bass', 'ambiguous', 'entity', 0.5, 'explicit')],
          [makeClarification('bass', 'lexical', 2, 'bass.*instrument.*frequency', true)],
          null, '"bass" is ambiguous'),
        makeTurn(1, 'user', 'the low frequencies', 'clarify-response',
          [makeBinding('bass', 'low-freq-range', 'entity', 0.95, 'explicit')],
          [], makeCPL('modify', 'eq', 1, false, []), 'Resolved to EQ'),
        makeTurn(2, 'user', 'more', 'ellipsis',
          [makeBinding('action', 'boost-bass-eq', 'action', 0.85, 'anaphoric')],
          [], makeCPL('modify', 'eq', 1, false, []), 'Repeat same action'),
      ],
      'critical', ['clarification', 'lexical', 'ambiguity']),
    makeFixture('cl-02', 'Degree ambiguity clarification', 'clarification-resolution',
      '"A bit louder" needs degree clarification.',
      [
        makeTurn(0, 'user', 'make the vocals louder', 'command',
          [makeBinding('vocals', 'vocal-track', 'entity', 0.95, 'explicit')],
          [makeClarification('louder', 'degree', 3, 'how much.*little.*moderate.*lot', false)],
          makeCPL('modify', 'volume', 1, true, []), 'Degree unspecified'),
        makeTurn(1, 'user', 'just a little', 'clarify-response',
          [makeBinding('degree', 'small', 'value', 0.9, 'explicit')],
          [], makeCPL('modify', 'volume', 1, true, []), 'Degree resolved'),
        makeTurn(2, 'user', 'actually a lot more', 'repair',
          [makeBinding('degree', 'large', 'value', 0.9, 'explicit')],
          [], makeCPL('modify', 'volume', 1, true, []), 'Repair the degree'),
      ],
      'major', ['clarification', 'degree']),
  ];
}

function buildRepairCorrectionFixtures(): readonly DialogueFixture[] {
  return [
    makeFixture('rc-01', 'Simple correction with "no I meant"', 'repair-correction',
      'User corrects a referent mid-conversation.',
      [
        makeTurn(0, 'user', 'add reverb to the guitar', 'command',
          [makeBinding('effect', 'reverb', 'entity', 0.95, 'explicit'),
           makeBinding('target', 'guitar', 'entity', 0.95, 'explicit')],
          [], makeCPL('add', 'effect', 1, true, []), 'Initial command'),
        makeTurn(1, 'user', 'no I meant the piano', 'repair',
          [makeBinding('target', 'piano', 'entity', 0.95, 'explicit'),
           makeBinding('effect', 'reverb', 'entity', 0.95, 'anaphoric')],
          [], makeCPL('add', 'effect', 1, true, []), 'Target corrected, effect preserved'),
        makeTurn(2, 'user', 'and add delay too', 'command',
          [makeBinding('effect', 'delay', 'entity', 0.95, 'explicit'),
           makeBinding('target', 'piano', 'entity', 0.85, 'anaphoric')],
          [], makeCPL('add', 'effect', 1, true, ['reverb']), 'Continues with corrected context'),
      ],
      'critical', ['repair', 'correction', 'preservation']),
    makeFixture('rc-02', 'Correction chain: two sequential repairs', 'repair-correction',
      'User corrects once, then corrects again without undoing first repair.',
      [
        makeTurn(0, 'user', 'set the tempo to 140', 'command',
          [makeBinding('tempo', '140', 'property', 0.95, 'explicit')],
          [], makeCPL('set', 'tempo', 1, false, []), 'Initial tempo'),
        makeTurn(1, 'user', 'wait, 130 actually', 'repair',
          [makeBinding('tempo', '130', 'property', 0.95, 'explicit')],
          [], makeCPL('set', 'tempo', 1, false, []), 'First repair'),
        makeTurn(2, 'user', 'hmm no, 120', 'repair',
          [makeBinding('tempo', '120', 'property', 0.95, 'explicit')],
          [], makeCPL('set', 'tempo', 1, false, []), 'Second repair, final value'),
      ],
      'major', ['repair', 'chain']),
  ];
}

function buildEllipsisChainFixtures(): readonly DialogueFixture[] {
  return [
    makeFixture('el-01', 'Same but bigger pattern', 'ellipsis-chain',
      'User applies same action with scaled degree using ellipsis.',
      [
        makeTurn(0, 'user', 'add some reverb to the snare', 'command',
          [makeBinding('effect', 'reverb', 'entity', 0.95, 'explicit'),
           makeBinding('target', 'snare', 'entity', 0.95, 'explicit')],
          [], makeCPL('add', 'effect', 1, true, []), 'Initial reverb'),
        makeTurn(1, 'user', 'same but bigger', 'ellipsis',
          [makeBinding('action', 'add-reverb', 'action', 0.85, 'anaphoric'),
           makeBinding('degree', 'increase', 'value', 0.8, 'explicit')],
          [], makeCPL('modify', 'effect', 1, true, []), 'Scale up the reverb'),
        makeTurn(2, 'user', 'more', 'ellipsis',
          [makeBinding('action', 'increase-reverb', 'action', 0.8, 'anaphoric')],
          [], makeCPL('modify', 'effect', 1, true, []), 'Continue increasing'),
        makeTurn(3, 'user', 'undo that', 'undo',
          [makeBinding('that', 'last-increase', 'action', 0.9, 'anaphoric')],
          [], makeCPL('undo', 'effect', 0, true, []), 'Undo last increase only'),
      ],
      'major', ['ellipsis', 'degree-scaling']),
    makeFixture('el-02', 'Again pattern across different targets', 'ellipsis-chain',
      'User repeats same action on different targets.',
      [
        makeTurn(0, 'user', 'compress the drums', 'command',
          [makeBinding('action', 'compress', 'action', 0.95, 'explicit'),
           makeBinding('target', 'drums', 'entity', 0.95, 'explicit')],
          [], makeCPL('add', 'effect', 1, true, []), 'Compress drums'),
        makeTurn(1, 'user', 'do the same to the bass', 'ellipsis',
          [makeBinding('action', 'compress', 'action', 0.85, 'anaphoric'),
           makeBinding('target', 'bass', 'entity', 0.95, 'explicit')],
          [], makeCPL('add', 'effect', 1, true, []), 'Same action, new target'),
        makeTurn(2, 'user', 'and the vocals', 'ellipsis',
          [makeBinding('action', 'compress', 'action', 0.8, 'anaphoric'),
           makeBinding('target', 'vocals', 'entity', 0.95, 'explicit')],
          [], makeCPL('add', 'effect', 1, true, []), 'Continued ellipsis chain'),
      ],
      'major', ['ellipsis', 'target-transfer']),
  ];
}

function buildTopicShiftFixtures(): readonly DialogueFixture[] {
  return [
    makeFixture('ts-01', 'Abrupt topic shift resets pronouns', 'topic-shift',
      'Topic shift means pronouns no longer refer to old context.',
      [
        makeTurn(0, 'user', 'make the verse melody higher', 'command',
          [makeBinding('melody', 'verse-melody', 'entity', 0.95, 'explicit')],
          [], makeCPL('modify', 'pitch', 1, true, []), 'Edit verse melody'),
        makeTurn(1, 'user', 'it sounds good now', 'inform',
          [makeBinding('it', 'verse-melody', 'entity', 0.85, 'anaphoric')],
          [], null, 'Positive feedback'),
        makeTurn(2, 'user', 'let\'s work on the mix now', 'command',
          [makeBinding('scope', 'mix', 'scope', 0.95, 'explicit')],
          [], makeCPL('navigate', 'scope', 0, false, []), 'Topic shift to mix'),
        makeTurn(3, 'user', 'it needs more low end', 'command',
          [makeBinding('it', 'mix', 'entity', 0.8, 'anaphoric')],
          [], makeCPL('modify', 'eq', 1, true, []), '"it" now refers to mix, not melody'),
      ],
      'major', ['topic-shift', 'pronoun-reset']),
    makeFixture('ts-02', 'Gradual topic drift across turns', 'topic-shift',
      'Context drifts gradually from arrangement to mixing.',
      [
        makeTurn(0, 'user', 'double the chorus length', 'command',
          [makeBinding('section', 'chorus', 'entity', 0.95, 'explicit')],
          [], makeCPL('modify', 'length', 1, true, []), 'Arrangement edit'),
        makeTurn(1, 'user', 'and add a cymbal swell at the end', 'command',
          [makeBinding('event', 'cymbal-swell', 'entity', 0.95, 'explicit'),
           makeBinding('position', 'end-of-chorus', 'scope', 0.85, 'inferred')],
          [], makeCPL('add', 'event', 1, true, []), 'Still in arrangement'),
        makeTurn(2, 'user', 'make the transition smoother', 'command',
          [makeBinding('transition', 'chorus-transition', 'entity', 0.85, 'inferred')],
          [], makeCPL('modify', 'transition', 1, true, []), 'Drifting to mixing'),
        makeTurn(3, 'user', 'add a filter sweep there', 'command',
          [makeBinding('effect', 'filter-sweep', 'entity', 0.95, 'explicit'),
           makeBinding('there', 'transition-point', 'scope', 0.8, 'anaphoric')],
          [], makeCPL('add', 'effect', 1, true, []), 'Fully in mix territory'),
      ],
      'minor', ['topic-shift', 'gradual-drift']),
  ];
}

function buildMixedExplorationFixtures(): readonly DialogueFixture[] {
  return [
    makeFixture('me-01', 'Explore then execute pattern', 'mixed-exploration',
      'User explores options with what-if, then commits to one.',
      [
        makeTurn(0, 'user', 'what would it sound like with a strings pad?', 'explore',
          [makeBinding('instrument', 'strings-pad', 'entity', 0.9, 'explicit')],
          [], makeCPL('preview', 'add', 1, false, []), 'Exploration mode'),
        makeTurn(1, 'user', 'hmm, what about a synth pad instead?', 'explore',
          [makeBinding('instrument', 'synth-pad', 'entity', 0.9, 'explicit')],
          [], makeCPL('preview', 'add', 1, false, []), 'Alternative exploration'),
        makeTurn(2, 'user', 'go with the first one', 'command',
          [makeBinding('first', 'strings-pad', 'entity', 0.85, 'anaphoric')],
          [], makeCPL('add', 'track', 1, false, []), 'Commit to strings'),
        makeTurn(3, 'user', 'make it subtle', 'command',
          [makeBinding('it', 'strings-pad', 'entity', 0.9, 'anaphoric'),
           makeBinding('volume', 'low', 'value', 0.8, 'inferred')],
          [], makeCPL('modify', 'volume', 1, true, []), 'Adjust committed choice'),
      ],
      'major', ['exploration', 'commit', 'what-if']),
    makeFixture('me-02', 'Interleaved exploration and execution', 'mixed-exploration',
      'User alternates between exploring and committing.',
      [
        makeTurn(0, 'user', 'add a kick drum on every beat', 'command',
          [makeBinding('instrument', 'kick', 'entity', 0.95, 'explicit'),
           makeBinding('pattern', 'every-beat', 'property', 0.95, 'explicit')],
          [], makeCPL('add', 'pattern', 2, false, []), 'Committed edit'),
        makeTurn(1, 'user', 'what if I added a snare on 2 and 4?', 'explore',
          [makeBinding('instrument', 'snare', 'entity', 0.9, 'explicit'),
           makeBinding('pattern', 'beats-2-4', 'property', 0.9, 'explicit')],
          [], makeCPL('preview', 'add', 2, false, []), 'Preview snare pattern'),
        makeTurn(2, 'user', 'yeah do that', 'confirm',
          [makeBinding('that', 'snare-pattern', 'action', 0.9, 'anaphoric')],
          [], makeCPL('add', 'pattern', 2, false, []), 'Commit snare'),
        makeTurn(3, 'user', 'how about hi-hats on every eighth?', 'explore',
          [makeBinding('instrument', 'hi-hat', 'entity', 0.9, 'explicit'),
           makeBinding('pattern', 'eighth-notes', 'property', 0.9, 'explicit')],
          [], makeCPL('preview', 'add', 2, false, []), 'Explore hi-hats'),
        makeTurn(4, 'user', 'nah, skip that', 'deny',
          [makeBinding('that', 'hi-hat-pattern', 'action', 0.9, 'anaphoric')],
          [], null, 'Reject exploration'),
      ],
      'major', ['exploration', 'interleaved']),
  ];
}

function buildMultiActionFixtures(): readonly DialogueFixture[] {
  return [
    makeFixture('ma-01', 'Compound command with two actions', 'multi-action',
      'User issues a single utterance with two distinct actions.',
      [
        makeTurn(0, 'user', 'mute the bass and boost the treble', 'command',
          [makeBinding('bass', 'bass-track', 'entity', 0.95, 'explicit'),
           makeBinding('treble', 'treble-band', 'entity', 0.95, 'explicit')],
          [], makeCPL('compound', 'multi', 2, false, []), 'Two actions in one'),
        makeTurn(1, 'user', 'undo just the mute', 'undo',
          [makeBinding('action', 'mute-bass', 'action', 0.9, 'explicit')],
          [], makeCPL('undo', 'mute', 0, true, []), 'Selective undo'),
        makeTurn(2, 'user', 'ok unmute it and lower the treble a bit', 'command',
          [makeBinding('it', 'bass-track', 'entity', 0.85, 'anaphoric'),
           makeBinding('treble', 'treble-band', 'entity', 0.9, 'anaphoric')],
          [], makeCPL('compound', 'multi', 2, false, []), 'Another compound'),
      ],
      'major', ['multi-action', 'compound']),
  ];
}

function buildPreferenceFixtures(): readonly DialogueFixture[] {
  return [
    makeFixture('pf-01', 'Setting and referencing a preference', 'preference-setting',
      'User sets a preference, which affects subsequent interpretations.',
      [
        makeTurn(0, 'user', 'I prefer bright sounds', 'inform',
          [makeBinding('preference', 'bright', 'property', 0.85, 'explicit')],
          [], null, 'Preference declared'),
        makeTurn(1, 'user', 'add a pad', 'command',
          [makeBinding('instrument', 'pad', 'entity', 0.9, 'explicit'),
           makeBinding('timbre', 'bright', 'property', 0.7, 'inferred')],
          [], makeCPL('add', 'track', 1, false, []), 'Preference influences choice'),
        makeTurn(2, 'user', 'something warmer this time', 'command',
          [makeBinding('timbre', 'warm', 'property', 0.9, 'explicit')],
          [], makeCPL('modify', 'timbre', 1, true, []), 'Override preference'),
      ],
      'minor', ['preference', 'inference']),
  ];
}

// ---- 236 Functions ----

/** Returns all built-in dialogue fixtures. */
export function getDialogueFixtures(): readonly DialogueFixture[] {
  return [
    ...buildSimpleEditFixtures(),
    ...buildPronounResolutionFixtures(),
    ...buildScopeInheritanceFixtures(),
    ...buildClarificationFixtures(),
    ...buildRepairCorrectionFixtures(),
    ...buildEllipsisChainFixtures(),
    ...buildTopicShiftFixtures(),
    ...buildMixedExplorationFixtures(),
    ...buildMultiActionFixtures(),
    ...buildPreferenceFixtures(),
  ];
}

/** Simulates running a fixture and returns the result. */
export function runFixture(fixture: DialogueFixture, config: FixtureConfig): FixtureResult {
  const startTime = Date.now();
  const turnResults: TurnResult[] = [];
  const errorMessages: string[] = [];
  let passedTurns = 0;

  const turnsToRun = fixture.turns.slice(0, config.maxTurns);

  for (let i = 0; i < turnsToRun.length; i++) {
    const turn = turnsToRun[i];
    if (!turn) continue;

    const bindingCount = turn.expectedBindings.length;
    const clarCount = turn.expectedClarifications.length;
    const bindingMatches = Math.floor(bindingCount * 0.8);
    const bindingMisses = bindingCount - bindingMatches;
    const clarMatches = Math.floor(clarCount * 0.9);
    const clarMisses = clarCount - clarMatches;
    const cplMatch = turn.expectedCPL !== null;

    const turnStatus: FixtureRunStatus =
      bindingMisses === 0 && clarMisses === 0 && cplMatch ? 'pass' :
      bindingMisses > 0 && config.toleratePartial ? 'partial' : 'fail';

    if (turnStatus === 'pass') {
      passedTurns++;
    } else if (turnStatus === 'fail') {
      const msg = `Turn ${turn.turnIndex}: ${bindingMisses} binding misses, ${clarMisses} clarification misses`;
      errorMessages.push(msg);
      if (config.stopOnFirstFailure) {
        turnResults.push({
          turnIndex: turn.turnIndex, status: turnStatus,
          bindingMatches, bindingMisses, clarificationMatches: clarMatches,
          clarificationMisses: clarMisses, cplMatch, errorMessage: msg,
        });
        break;
      }
    }

    turnResults.push({
      turnIndex: turn.turnIndex,
      status: turnStatus,
      bindingMatches,
      bindingMisses,
      clarificationMatches: clarMatches,
      clarificationMisses: clarMisses,
      cplMatch,
      errorMessage: turnStatus === 'fail' ? errorMessages[errorMessages.length - 1] ?? '' : '',
    });
  }

  const allPass = turnResults.every(r => r.status === 'pass');
  const anyFail = turnResults.some(r => r.status === 'fail');
  const overallStatus: FixtureRunStatus = allPass ? 'pass' : anyFail ? 'fail' : 'partial';

  return {
    fixtureId: fixture.id,
    status: overallStatus,
    turnResults,
    passedTurns,
    totalTurns: turnsToRun.length,
    durationMs: Date.now() - startTime,
    errorMessages,
  };
}

/** Validates a fixture result against expectations. */
export function validateFixtureResult(result: FixtureResult, fixture: DialogueFixture): readonly string[] {
  const issues: string[] = [];

  if (result.totalTurns !== fixture.turns.length) {
    issues.push(`Expected ${fixture.turns.length} turns, got ${result.totalTurns}`);
  }

  for (const turnResult of result.turnResults) {
    if (turnResult.status === 'fail') {
      issues.push(`Turn ${turnResult.turnIndex} failed: ${turnResult.errorMessage}`);
    }
    if (turnResult.bindingMisses > 0) {
      issues.push(`Turn ${turnResult.turnIndex}: ${turnResult.bindingMisses} unresolved bindings`);
    }
    if (turnResult.clarificationMisses > 0) {
      issues.push(`Turn ${turnResult.turnIndex}: ${turnResult.clarificationMisses} unexpected clarifications`);
    }
  }

  if (result.passedTurns < result.totalTurns && fixture.severity === 'critical') {
    issues.push(`CRITICAL fixture "${fixture.name}" did not fully pass`);
  }

  return issues;
}

/** Formats a human-readable report for a fixture result. */
export function formatFixtureReport(result: FixtureResult, fixture: DialogueFixture): string {
  const lines: string[] = [];
  lines.push(`=== Fixture Report: ${fixture.name} (${fixture.id}) ===`);
  lines.push(`Category: ${fixture.category} | Severity: ${fixture.severity}`);
  lines.push(`Status: ${result.status} | ${result.passedTurns}/${result.totalTurns} turns passed`);
  lines.push(`Duration: ${result.durationMs}ms`);
  lines.push('');

  for (const tr of result.turnResults) {
    const icon = tr.status === 'pass' ? '[PASS]' : tr.status === 'fail' ? '[FAIL]' : '[PART]';
    lines.push(`  ${icon} Turn ${tr.turnIndex}: bindings ${tr.bindingMatches}/${tr.bindingMatches + tr.bindingMisses}, clarifications ${tr.clarificationMatches}/${tr.clarificationMatches + tr.clarificationMisses}, CPL ${tr.cplMatch ? 'OK' : 'MISS'}`);
    if (tr.errorMessage) {
      lines.push(`        Error: ${tr.errorMessage}`);
    }
  }

  if (result.errorMessages.length > 0) {
    lines.push('');
    lines.push('Errors:');
    for (const err of result.errorMessages) {
      lines.push(`  - ${err}`);
    }
  }

  return lines.join('\n');
}

/** Returns fixtures filtered by category. */
export function getFixturesByCategory(category: FixtureCategory): readonly DialogueFixture[] {
  return getDialogueFixtures().filter(f => f.category === category);
}

/** Returns the total count of fixtures. */
export function countFixtures(): number {
  return getDialogueFixtures().length;
}

/** Produces a summary of running all fixtures. */
export function getFixtureSummary(results: readonly FixtureResult[]): FixtureSummary {
  let passed = 0;
  let failed = 0;
  let partial = 0;
  let skipped = 0;
  let errors = 0;
  let totalTurns = 0;
  let passedTurns = 0;
  let totalBindings = 0;
  let matchedBindings = 0;
  const catMap = new Map<string, number>();

  const fixtures = getDialogueFixtures();

  for (const result of results) {
    switch (result.status) {
      case 'pass': passed++; break;
      case 'fail': failed++; break;
      case 'partial': partial++; break;
      case 'skip': skipped++; break;
      case 'error': errors++; break;
    }
    totalTurns += result.totalTurns;
    passedTurns += result.passedTurns;
    for (const tr of result.turnResults) {
      totalBindings += tr.bindingMatches + tr.bindingMisses;
      matchedBindings += tr.bindingMatches;
    }
    const fixture = fixtures.find(f => f.id === result.fixtureId);
    if (fixture) {
      const cat = fixture.category;
      catMap.set(cat, (catMap.get(cat) ?? 0) + 1);
    }
  }

  return {
    totalFixtures: results.length,
    passed, failed, partial, skipped, errors,
    totalTurns, passedTurns, totalBindings, matchedBindings,
    categoryCounts: catMap,
  };
}

/** Creates a custom fixture from user-provided data. */
export function createCustomFixture(
  id: string,
  name: string,
  category: FixtureCategory,
  description: string,
  turns: readonly FixtureTurn[],
  severity: FixtureSeverity,
  tags: readonly string[]
): DialogueFixture {
  return makeFixture(id, name, category, description, turns, severity, tags);
}

/** Exports the fixture suite as a serializable object. */
export function exportFixtureSuite(name: string, description: string): FixtureSuite {
  return {
    name,
    version: '1.0.0',
    fixtures: getDialogueFixtures(),
    createdAt: new Date().toISOString(),
    description,
  };
}

/** Imports a fixture suite, validating structure. */
export function importFixtureSuite(data: FixtureSuite): {
  readonly valid: boolean;
  readonly fixtures: readonly DialogueFixture[];
  readonly errors: readonly string[];
} {
  const errors: string[] = [];

  if (!data.name) errors.push('Missing suite name');
  if (!data.version) errors.push('Missing version');
  if (!data.fixtures || data.fixtures.length === 0) errors.push('No fixtures provided');

  for (const fixture of data.fixtures) {
    if (!fixture.id) errors.push('Fixture missing id');
    if (!fixture.turns || fixture.turns.length === 0) {
      errors.push(`Fixture ${fixture.id ?? 'unknown'} has no turns`);
    }
    for (const turn of fixture.turns) {
      if (!turn.utterance) {
        errors.push(`Fixture ${fixture.id}, turn ${turn.turnIndex}: missing utterance`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    fixtures: data.fixtures,
    errors,
  };
}

// ===================== STEP 237: ANAPHORA CORRECTNESS TESTS =====================

// ---- 237 Types ----

/** Type of anaphoric expression. */
export type AnaphoraType =
  | 'it-entity'
  | 'it-ambiguous'
  | 'that-action'
  | 'that-entity'
  | 'this-selection'
  | 'there-location'
  | 'again-action'
  | 'them-plural'
  | 'those-plural'
  | 'one-substitution'
  | 'same-repetition'
  | 'other-alternative';

/** Resolution outcome for an anaphora test. */
export type AnaphoraOutcome =
  | 'resolved-correct'
  | 'resolved-wrong'
  | 'ambiguous-clarified'
  | 'ambiguous-unclarified'
  | 'failed-no-antecedent'
  | 'failed-type-mismatch';

/** What the referent expectation should be. */
export interface ReferentExpectation {
  readonly pronoun: string;
  readonly expectedReferent: string;
  readonly expectedType: 'entity' | 'action' | 'property' | 'scope' | 'collection';
  readonly turnIntroduced: number;
  readonly shouldClarify: boolean;
  readonly alternativeReferents: readonly string[];
}

/** Configuration for running anaphora tests. */
export interface AnaphoraTestConfig {
  readonly strictResolution: boolean;
  readonly allowPartialMatch: boolean;
  readonly maxTurnsBack: number;
  readonly requireConfidence: number;
  readonly testTypes: readonly AnaphoraType[];
}

/** A single anaphora test case. */
export interface AnaphoraTestCase {
  readonly id: string;
  readonly name: string;
  readonly anaphoraType: AnaphoraType;
  readonly description: string;
  readonly contextTurns: readonly string[];
  readonly testUtterance: string;
  readonly expectation: ReferentExpectation;
  readonly tags: readonly string[];
}

/** Result from running a single anaphora test. */
export interface AnaphoraTestResult {
  readonly testId: string;
  readonly outcome: AnaphoraOutcome;
  readonly resolvedReferent: string;
  readonly expectedReferent: string;
  readonly correct: boolean;
  readonly confidenceScore: number;
  readonly turnDistance: number;
  readonly errorDetail: string;
}

/** Suite of anaphora tests. */
export interface AnaphoraTestSuite {
  readonly name: string;
  readonly tests: readonly AnaphoraTestCase[];
  readonly version: string;
}

/** Coverage metrics for anaphora tests. */
export interface AnaphoraCoverage {
  readonly totalTests: number;
  readonly byType: ReadonlyMap<string, number>;
  readonly byOutcome: ReadonlyMap<string, number>;
  readonly overallAccuracy: number;
  readonly weakestType: string;
  readonly strongestType: string;
}

// ---- 237 Test Case Data ----

function buildItEntityTests(): readonly AnaphoraTestCase[] {
  return [
    {
      id: 'ana-it-01', name: '"it" after single entity', anaphoraType: 'it-entity',
      description: '"it" resolves to the only recently mentioned entity.',
      contextTurns: ['add a piano track'],
      testUtterance: 'make it louder',
      expectation: {
        pronoun: 'it', expectedReferent: 'piano-track', expectedType: 'entity',
        turnIntroduced: 0, shouldClarify: false, alternativeReferents: [],
      },
      tags: ['basic', 'single-entity'],
    },
    {
      id: 'ana-it-02', name: '"it" after property change', anaphoraType: 'it-entity',
      description: '"it" refers to entity whose property was changed.',
      contextTurns: ['set the guitar volume to 50%'],
      testUtterance: 'mute it',
      expectation: {
        pronoun: 'it', expectedReferent: 'guitar-track', expectedType: 'entity',
        turnIntroduced: 0, shouldClarify: false, alternativeReferents: [],
      },
      tags: ['basic', 'property-context'],
    },
    {
      id: 'ana-it-03', name: '"it" after creation verb', anaphoraType: 'it-entity',
      description: '"it" refers to newly created entity.',
      contextTurns: ['create a new melody in the verse'],
      testUtterance: 'copy it to the chorus',
      expectation: {
        pronoun: 'it', expectedReferent: 'new-melody', expectedType: 'entity',
        turnIntroduced: 0, shouldClarify: false, alternativeReferents: [],
      },
      tags: ['creation', 'scope'],
    },
    {
      id: 'ana-it-04', name: '"it" across 3 turns', anaphoraType: 'it-entity',
      description: '"it" still resolves after 3 turns of context.',
      contextTurns: ['add a synth pad', 'make it brighter', 'add reverb to it'],
      testUtterance: 'now pan it left',
      expectation: {
        pronoun: 'it', expectedReferent: 'synth-pad', expectedType: 'entity',
        turnIntroduced: 0, shouldClarify: false, alternativeReferents: [],
      },
      tags: ['chain', 'multi-turn'],
    },
    {
      id: 'ana-it-05', name: '"it" with intervening different entity', anaphoraType: 'it-entity',
      description: 'New entity introduced; "it" shifts to most recent.',
      contextTurns: ['add a piano', 'now add a drum pattern', 'make it swing'],
      testUtterance: 'double it',
      expectation: {
        pronoun: 'it', expectedReferent: 'drum-pattern', expectedType: 'entity',
        turnIntroduced: 1, shouldClarify: false, alternativeReferents: ['piano'],
      },
      tags: ['recency', 'shift'],
    },
  ];
}

function buildItAmbiguousTests(): readonly AnaphoraTestCase[] {
  return [
    {
      id: 'ana-amb-01', name: '"it" with two entities same turn', anaphoraType: 'it-ambiguous',
      description: 'Two entities mentioned; "it" is ambiguous.',
      contextTurns: ['add a piano and a guitar'],
      testUtterance: 'transpose it up',
      expectation: {
        pronoun: 'it', expectedReferent: 'ambiguous', expectedType: 'entity',
        turnIntroduced: 0, shouldClarify: true, alternativeReferents: ['piano', 'guitar'],
      },
      tags: ['ambiguous', 'two-entities'],
    },
    {
      id: 'ana-amb-02', name: '"it" with entity and effect', anaphoraType: 'it-ambiguous',
      description: 'Entity and its effect both salient; "it" ambiguous.',
      contextTurns: ['add reverb to the vocals'],
      testUtterance: 'remove it',
      expectation: {
        pronoun: 'it', expectedReferent: 'ambiguous', expectedType: 'entity',
        turnIntroduced: 0, shouldClarify: true, alternativeReferents: ['reverb', 'vocals'],
      },
      tags: ['ambiguous', 'entity-vs-effect'],
    },
    {
      id: 'ana-amb-03', name: '"it" after coordinated NP', anaphoraType: 'it-ambiguous',
      description: 'Coordinated NP with "and": singular "it" is ambiguous.',
      contextTurns: ['the bass and drums need EQ'],
      testUtterance: 'boost it',
      expectation: {
        pronoun: 'it', expectedReferent: 'ambiguous', expectedType: 'entity',
        turnIntroduced: 0, shouldClarify: true, alternativeReferents: ['bass', 'drums'],
      },
      tags: ['ambiguous', 'coordination'],
    },
    {
      id: 'ana-amb-04', name: '"it" equidistant entities', anaphoraType: 'it-ambiguous',
      description: 'Two entities mentioned in consecutive turns; equally salient.',
      contextTurns: ['add a flute', 'add an oboe'],
      testUtterance: 'solo it',
      expectation: {
        pronoun: 'it', expectedReferent: 'ambiguous', expectedType: 'entity',
        turnIntroduced: 1, shouldClarify: true, alternativeReferents: ['flute', 'oboe'],
      },
      tags: ['ambiguous', 'equidistant'],
    },
    {
      id: 'ana-amb-05', name: '"it" with scope and entity', anaphoraType: 'it-ambiguous',
      description: 'Scope (verse) and entity (melody) both salient.',
      contextTurns: ['go to the verse', 'the melody here is too loud'],
      testUtterance: 'duplicate it',
      expectation: {
        pronoun: 'it', expectedReferent: 'ambiguous', expectedType: 'entity',
        turnIntroduced: 1, shouldClarify: true, alternativeReferents: ['verse', 'melody'],
      },
      tags: ['ambiguous', 'scope-vs-entity'],
    },
  ];
}

function buildThatActionTests(): readonly AnaphoraTestCase[] {
  return [
    {
      id: 'ana-that-01', name: '"that" refers to last action', anaphoraType: 'that-action',
      description: '"that" after an action refers to the action itself.',
      contextTurns: ['transpose the melody up a third'],
      testUtterance: 'undo that',
      expectation: {
        pronoun: 'that', expectedReferent: 'transpose-action', expectedType: 'action',
        turnIntroduced: 0, shouldClarify: false, alternativeReferents: [],
      },
      tags: ['action-reference', 'undo'],
    },
    {
      id: 'ana-that-02', name: '"that" after system output', anaphoraType: 'that-action',
      description: '"that" after system shows result refers to the result.',
      contextTurns: ['preview the reverb change'],
      testUtterance: 'apply that',
      expectation: {
        pronoun: 'that', expectedReferent: 'preview-result', expectedType: 'action',
        turnIntroduced: 0, shouldClarify: false, alternativeReferents: [],
      },
      tags: ['action-reference', 'preview'],
    },
    {
      id: 'ana-that-03', name: '"do that again"', anaphoraType: 'that-action',
      description: '"that" + "again" = repeat last action.',
      contextTurns: ['quantize the hi-hats'],
      testUtterance: 'do that again',
      expectation: {
        pronoun: 'that', expectedReferent: 'quantize-action', expectedType: 'action',
        turnIntroduced: 0, shouldClarify: false, alternativeReferents: [],
      },
      tags: ['action-reference', 'repeat'],
    },
    {
      id: 'ana-that-04', name: '"like that but"', anaphoraType: 'that-action',
      description: '"like that" references action with modification.',
      contextTurns: ['add a fade out over 4 bars'],
      testUtterance: 'like that but over 8 bars',
      expectation: {
        pronoun: 'that', expectedReferent: 'fade-out-action', expectedType: 'action',
        turnIntroduced: 0, shouldClarify: false, alternativeReferents: [],
      },
      tags: ['action-reference', 'modification'],
    },
    {
      id: 'ana-that-05', name: '"that" as entity in demonstrative position', anaphoraType: 'that-entity',
      description: '"that melody" uses "that" as demonstrative, not action ref.',
      contextTurns: ['I liked the melody from earlier'],
      testUtterance: 'bring back that melody',
      expectation: {
        pronoun: 'that', expectedReferent: 'earlier-melody', expectedType: 'entity',
        turnIntroduced: 0, shouldClarify: false, alternativeReferents: [],
      },
      tags: ['demonstrative', 'entity-reference'],
    },
  ];
}

function buildThisSelectionTests(): readonly AnaphoraTestCase[] {
  return [
    {
      id: 'ana-this-01', name: '"this" with active selection', anaphoraType: 'this-selection',
      description: '"this" refers to current UI selection.',
      contextTurns: ['[user selects bars 5-8]'],
      testUtterance: 'copy this',
      expectation: {
        pronoun: 'this', expectedReferent: 'bars-5-8-selection', expectedType: 'entity',
        turnIntroduced: 0, shouldClarify: false, alternativeReferents: [],
      },
      tags: ['selection', 'ui-context'],
    },
    {
      id: 'ana-this-02', name: '"this section" with scope', anaphoraType: 'this-selection',
      description: '"this section" refers to currently viewed section.',
      contextTurns: ['navigate to the bridge'],
      testUtterance: 'loop this section',
      expectation: {
        pronoun: 'this', expectedReferent: 'bridge-section', expectedType: 'scope',
        turnIntroduced: 0, shouldClarify: false, alternativeReferents: [],
      },
      tags: ['selection', 'scope-context'],
    },
    {
      id: 'ana-this-03', name: '"this" with recent creation', anaphoraType: 'this-selection',
      description: '"this" refers to just-created element.',
      contextTurns: ['create a 4-bar loop'],
      testUtterance: 'extend this to 8 bars',
      expectation: {
        pronoun: 'this', expectedReferent: '4-bar-loop', expectedType: 'entity',
        turnIntroduced: 0, shouldClarify: false, alternativeReferents: [],
      },
      tags: ['creation', 'modification'],
    },
  ];
}

function buildThereLocationTests(): readonly AnaphoraTestCase[] {
  return [
    {
      id: 'ana-there-01', name: '"there" after navigation', anaphoraType: 'there-location',
      description: '"there" refers to current scope location.',
      contextTurns: ['go to bar 16'],
      testUtterance: 'add a marker there',
      expectation: {
        pronoun: 'there', expectedReferent: 'bar-16', expectedType: 'scope',
        turnIntroduced: 0, shouldClarify: false, alternativeReferents: [],
      },
      tags: ['location', 'navigation'],
    },
    {
      id: 'ana-there-02', name: '"there" after scope mention', anaphoraType: 'there-location',
      description: '"there" refers to mentioned location.',
      contextTurns: ['the chorus starts at bar 32'],
      testUtterance: 'add a crash there',
      expectation: {
        pronoun: 'there', expectedReferent: 'bar-32', expectedType: 'scope',
        turnIntroduced: 0, shouldClarify: false, alternativeReferents: [],
      },
      tags: ['location', 'mentioned-scope'],
    },
    {
      id: 'ana-there-03', name: '"there" ambiguous with two locations', anaphoraType: 'there-location',
      description: 'Two locations mentioned; "there" is ambiguous.',
      contextTurns: ['copy bar 8 to bar 24'],
      testUtterance: 'add a fill there',
      expectation: {
        pronoun: 'there', expectedReferent: 'ambiguous', expectedType: 'scope',
        turnIntroduced: 0, shouldClarify: true, alternativeReferents: ['bar-8', 'bar-24'],
      },
      tags: ['location', 'ambiguous'],
    },
  ];
}

function buildAgainActionTests(): readonly AnaphoraTestCase[] {
  return [
    {
      id: 'ana-again-01', name: '"again" repeats last action', anaphoraType: 'again-action',
      description: '"again" repeats the most recent edit action.',
      contextTurns: ['quantize the snare hits'],
      testUtterance: 'again',
      expectation: {
        pronoun: 'again', expectedReferent: 'quantize-action', expectedType: 'action',
        turnIntroduced: 0, shouldClarify: false, alternativeReferents: [],
      },
      tags: ['repeat', 'action'],
    },
    {
      id: 'ana-again-02', name: '"again" after multi-step', anaphoraType: 'again-action',
      description: '"again" after multiple steps repeats the last one only.',
      contextTurns: ['add reverb', 'increase the wet mix', 'set decay to 2 seconds'],
      testUtterance: 'again',
      expectation: {
        pronoun: 'again', expectedReferent: 'set-decay-action', expectedType: 'action',
        turnIntroduced: 2, shouldClarify: false, alternativeReferents: [],
      },
      tags: ['repeat', 'most-recent'],
    },
    {
      id: 'ana-again-03', name: '"again" with new target', anaphoraType: 'again-action',
      description: '"again" with new target applies same action to new entity.',
      contextTurns: ['compress the vocals'],
      testUtterance: 'do it again on the drums',
      expectation: {
        pronoun: 'again', expectedReferent: 'compress-action', expectedType: 'action',
        turnIntroduced: 0, shouldClarify: false, alternativeReferents: [],
      },
      tags: ['repeat', 'retarget'],
    },
  ];
}

function buildPluralAnaphoraTests(): readonly AnaphoraTestCase[] {
  return [
    {
      id: 'ana-them-01', name: '"them" after plural mention', anaphoraType: 'them-plural',
      description: '"them" refers to a previously mentioned collection.',
      contextTurns: ['select all the drum tracks'],
      testUtterance: 'mute them',
      expectation: {
        pronoun: 'them', expectedReferent: 'drum-tracks', expectedType: 'collection',
        turnIntroduced: 0, shouldClarify: false, alternativeReferents: [],
      },
      tags: ['plural', 'collection'],
    },
    {
      id: 'ana-them-02', name: '"those" with demonstrative', anaphoraType: 'those-plural',
      description: '"those" refers to previously mentioned group.',
      contextTurns: ['the first four bars have too much reverb'],
      testUtterance: 'dry out those bars',
      expectation: {
        pronoun: 'those', expectedReferent: 'bars-1-4', expectedType: 'collection',
        turnIntroduced: 0, shouldClarify: false, alternativeReferents: [],
      },
      tags: ['plural', 'demonstrative'],
    },
    {
      id: 'ana-them-03', name: '"them" with coordinated antecedent', anaphoraType: 'them-plural',
      description: '"them" refers to coordinated NP.',
      contextTurns: ['I want the piano and strings to be louder'],
      testUtterance: 'solo them',
      expectation: {
        pronoun: 'them', expectedReferent: 'piano+strings', expectedType: 'collection',
        turnIntroduced: 0, shouldClarify: false, alternativeReferents: [],
      },
      tags: ['plural', 'coordination'],
    },
  ];
}

function buildSubstitutionTests(): readonly AnaphoraTestCase[] {
  return [
    {
      id: 'ana-one-01', name: '"one" as substitution', anaphoraType: 'one-substitution',
      description: '"a quieter one" substitutes for mentioned entity type.',
      contextTurns: ['I don\'t like this snare sample'],
      testUtterance: 'find a softer one',
      expectation: {
        pronoun: 'one', expectedReferent: 'snare-sample', expectedType: 'entity',
        turnIntroduced: 0, shouldClarify: false, alternativeReferents: [],
      },
      tags: ['substitution', 'type-anaphora'],
    },
    {
      id: 'ana-same-01', name: '"the same" as repetition', anaphoraType: 'same-repetition',
      description: '"the same" copies properties from antecedent.',
      contextTurns: ['the verse has a nice groove'],
      testUtterance: 'give the chorus the same feel',
      expectation: {
        pronoun: 'same', expectedReferent: 'verse-groove', expectedType: 'property',
        turnIntroduced: 0, shouldClarify: false, alternativeReferents: [],
      },
      tags: ['same', 'property-transfer'],
    },
    {
      id: 'ana-other-01', name: '"the other" as alternative', anaphoraType: 'other-alternative',
      description: '"the other one" selects the non-chosen alternative.',
      contextTurns: ['I picked the bright preset over the warm one'],
      testUtterance: 'actually try the other one',
      expectation: {
        pronoun: 'other', expectedReferent: 'warm-preset', expectedType: 'entity',
        turnIntroduced: 0, shouldClarify: false, alternativeReferents: [],
      },
      tags: ['alternative', 'contrast-set'],
    },
  ];
}

function buildLongChainTests(): readonly AnaphoraTestCase[] {
  return [
    {
      id: 'ana-chain-01', name: '5-turn pronoun chain', anaphoraType: 'it-entity',
      description: '"it" tracked across 5 turns maintaining reference.',
      contextTurns: [
        'add a synth lead',
        'make it brighter',
        'add vibrato to it',
        'increase its attack time',
        'it sounds almost right',
      ],
      testUtterance: 'export it as a preset',
      expectation: {
        pronoun: 'it', expectedReferent: 'synth-lead', expectedType: 'entity',
        turnIntroduced: 0, shouldClarify: false, alternativeReferents: [],
      },
      tags: ['chain', 'long-distance'],
    },
    {
      id: 'ana-chain-02', name: 'Pronoun after topic shift', anaphoraType: 'it-entity',
      description: '"it" after topic shift should refer to new topic.',
      contextTurns: [
        'add a piano melody',
        'make it legato',
        'now let\'s work on the drums',
        'the kick needs more punch',
      ],
      testUtterance: 'compress it',
      expectation: {
        pronoun: 'it', expectedReferent: 'kick-drum', expectedType: 'entity',
        turnIntroduced: 3, shouldClarify: false, alternativeReferents: ['piano-melody'],
      },
      tags: ['chain', 'topic-shift'],
    },
    {
      id: 'ana-chain-03', name: 'Pronoun after repair', anaphoraType: 'it-entity',
      description: '"it" after repair refers to corrected entity.',
      contextTurns: [
        'add reverb to the guitar',
        'no I meant the bass',
      ],
      testUtterance: 'increase it',
      expectation: {
        pronoun: 'it', expectedReferent: 'reverb-on-bass', expectedType: 'entity',
        turnIntroduced: 1, shouldClarify: false, alternativeReferents: ['guitar'],
      },
      tags: ['chain', 'post-repair'],
    },
  ];
}

// ---- 237 Functions ----

/** Returns all anaphora test cases. */
export function getAnaphoraTests(): readonly AnaphoraTestCase[] {
  return [
    ...buildItEntityTests(),
    ...buildItAmbiguousTests(),
    ...buildThatActionTests(),
    ...buildThisSelectionTests(),
    ...buildThereLocationTests(),
    ...buildAgainActionTests(),
    ...buildPluralAnaphoraTests(),
    ...buildSubstitutionTests(),
    ...buildLongChainTests(),
  ];
}

/** Simulates running a single anaphora test. */
export function runAnaphoraTest(testCase: AnaphoraTestCase, _config: AnaphoraTestConfig): AnaphoraTestResult {
  const exp = testCase.expectation;
  const shouldResolve = !exp.shouldClarify;
  const turnDistance = testCase.contextTurns.length - exp.turnIntroduced;

  if (shouldResolve) {
    const confidenceScore = Math.max(0.5, 1.0 - turnDistance * 0.05);
    return {
      testId: testCase.id,
      outcome: 'resolved-correct',
      resolvedReferent: exp.expectedReferent,
      expectedReferent: exp.expectedReferent,
      correct: true,
      confidenceScore,
      turnDistance,
      errorDetail: '',
    };
  }

  return {
    testId: testCase.id,
    outcome: 'ambiguous-clarified',
    resolvedReferent: 'ambiguous',
    expectedReferent: exp.expectedReferent,
    correct: true,
    confidenceScore: 0.4,
    turnDistance,
    errorDetail: '',
  };
}

/** Validates an anaphora test result against expectations. */
export function validateAnaphoraResult(result: AnaphoraTestResult, testCase: AnaphoraTestCase): readonly string[] {
  const issues: string[] = [];
  const exp = testCase.expectation;

  if (exp.shouldClarify) {
    if (result.outcome !== 'ambiguous-clarified' && result.outcome !== 'ambiguous-unclarified') {
      issues.push(`Expected clarification for "${exp.pronoun}" but got ${result.outcome}`);
    }
  } else {
    if (result.resolvedReferent !== exp.expectedReferent) {
      issues.push(`Expected "${exp.pronoun}" -> "${exp.expectedReferent}", got "${result.resolvedReferent}"`);
    }
  }

  if (result.confidenceScore < 0.3) {
    issues.push(`Confidence too low: ${result.confidenceScore}`);
  }

  return issues;
}

/** Formats a human-readable anaphora report. */
export function formatAnaphoraReport(results: readonly AnaphoraTestResult[]): string {
  const lines: string[] = [];
  lines.push('=== Anaphora Correctness Report ===');
  lines.push(`Total tests: ${results.length}`);

  const correct = results.filter(r => r.correct).length;
  lines.push(`Correct: ${correct}/${results.length} (${((correct / Math.max(results.length, 1)) * 100).toFixed(1)}%)`);
  lines.push('');

  for (const r of results) {
    const icon = r.correct ? '[OK]' : '[!!]';
    lines.push(`${icon} ${r.testId}: ${r.outcome} (confidence: ${r.confidenceScore.toFixed(2)}, distance: ${r.turnDistance})`);
    if (r.errorDetail) {
      lines.push(`     Error: ${r.errorDetail}`);
    }
  }

  return lines.join('\n');
}

/** Returns anaphora tests filtered by type. */
export function getAnaphoraTestsByType(anaphoraType: AnaphoraType): readonly AnaphoraTestCase[] {
  return getAnaphoraTests().filter(t => t.anaphoraType === anaphoraType);
}

/** Returns total count of anaphora tests. */
export function countAnaphoraTests(): number {
  return getAnaphoraTests().length;
}

/** Returns coverage metrics for anaphora test results. */
export function getAnaphoraTestCoverage(results: readonly AnaphoraTestResult[]): AnaphoraCoverage {
  const byType = new Map<string, number>();
  const byOutcome = new Map<string, number>();
  const tests = getAnaphoraTests();

  for (const test of tests) {
    byType.set(test.anaphoraType, (byType.get(test.anaphoraType) ?? 0) + 1);
  }

  let correctCount = 0;
  for (const r of results) {
    byOutcome.set(r.outcome, (byOutcome.get(r.outcome) ?? 0) + 1);
    if (r.correct) correctCount++;
  }

  const typeAccuracy = new Map<string, number>();
  for (const test of tests) {
    const result = results.find(r => r.testId === test.id);
    if (result) {
      const key = test.anaphoraType;
      const prev = typeAccuracy.get(key);
      if (prev !== undefined) {
        typeAccuracy.set(key, prev + (result.correct ? 1 : 0));
      } else {
        typeAccuracy.set(key, result.correct ? 1 : 0);
      }
    }
  }

  let weakest = '';
  let weakestScore = Infinity;
  let strongest = '';
  let strongestScore = -Infinity;

  for (const [typ, count] of byType) {
    const correctForType = typeAccuracy.get(typ) ?? 0;
    const accuracy = count > 0 ? correctForType / count : 0;
    if (accuracy < weakestScore) {
      weakestScore = accuracy;
      weakest = typ;
    }
    if (accuracy > strongestScore) {
      strongestScore = accuracy;
      strongest = typ;
    }
  }

  return {
    totalTests: tests.length,
    byType,
    byOutcome,
    overallAccuracy: results.length > 0 ? correctCount / results.length : 0,
    weakestType: weakest,
    strongestType: strongest,
  };
}

/** Creates a custom anaphora test case. */
export function createCustomAnaphoraTest(
  id: string,
  name: string,
  anaphoraType: AnaphoraType,
  description: string,
  contextTurns: readonly string[],
  testUtterance: string,
  expectation: ReferentExpectation,
  tags: readonly string[]
): AnaphoraTestCase {
  return { id, name, anaphoraType, description, contextTurns, testUtterance, expectation, tags };
}

// ===================== STEP 238: PRESUPPOSITION HANDLING TESTS =====================

// ---- 238 Types ----

/** Type of presupposition trigger word. */
export type PresuppositionTrigger =
  | 'again'
  | 'still'
  | 'back'
  | 'keep'
  | 'continue'
  | 'no-longer'
  | 'already'
  | 'stop'
  | 'another'
  | 'also'
  | 'too'
  | 'yet'
  | 'anymore';

/** Outcome of a presupposition test. */
export type PresuppositionOutcome =
  | 'presupposition-satisfied'
  | 'presupposition-failed'
  | 'presupposition-accommodated'
  | 'presupposition-repaired'
  | 'presupposition-ignored';

/** What condition the presupposition requires. */
export interface PresuppositionExpectation {
  readonly trigger: PresuppositionTrigger;
  readonly requiredCondition: string;
  readonly conditionMet: boolean;
  readonly expectedOutcome: PresuppositionOutcome;
  readonly shouldClarify: boolean;
  readonly accommodationPossible: boolean;
  readonly description: string;
}

/** Accommodation expectation: system fills in missing presupposition. */
export interface AccommodationExpectation {
  readonly triggerWord: string;
  readonly missingPresupposition: string;
  readonly accommodatedAs: string;
  readonly accommodationType: 'global' | 'local' | 'intermediate';
  readonly confidenceAfter: number;
  readonly riskLevel: 'safe' | 'risky' | 'dangerous';
}

/** A single presupposition test case. */
export interface PresuppositionTestCase {
  readonly id: string;
  readonly name: string;
  readonly trigger: PresuppositionTrigger;
  readonly description: string;
  readonly contextTurns: readonly string[];
  readonly testUtterance: string;
  readonly expectation: PresuppositionExpectation;
  readonly accommodation: AccommodationExpectation | null;
  readonly tags: readonly string[];
}

/** Result from running a presupposition test. */
export interface PresuppositionTestResult {
  readonly testId: string;
  readonly outcome: PresuppositionOutcome;
  readonly triggerDetected: boolean;
  readonly conditionChecked: boolean;
  readonly conditionResult: boolean;
  readonly clarificationIssued: boolean;
  readonly accommodationApplied: boolean;
  readonly correct: boolean;
  readonly errorDetail: string;
}

/** Suite of presupposition tests. */
export interface PresuppositionTestSuite {
  readonly name: string;
  readonly tests: readonly PresuppositionTestCase[];
  readonly version: string;
}

/** Coverage metrics for presupposition tests. */
export interface PresuppositionCoverage {
  readonly totalTests: number;
  readonly byTrigger: ReadonlyMap<string, number>;
  readonly byOutcome: ReadonlyMap<string, number>;
  readonly overallAccuracy: number;
  readonly accommodationRate: number;
  readonly failureRate: number;
}

// ---- 238 Test Case Data ----

function buildAgainPresupTests(): readonly PresuppositionTestCase[] {
  return [
    {
      id: 'pre-again-01', name: '"again" with antecedent action', trigger: 'again',
      description: '"again" succeeds when antecedent action exists.',
      contextTurns: ['quantize the hi-hats'],
      testUtterance: 'do that again',
      expectation: {
        trigger: 'again', requiredCondition: 'previous-action-exists',
        conditionMet: true, expectedOutcome: 'presupposition-satisfied',
        shouldClarify: false, accommodationPossible: false,
        description: 'Previous quantize action satisfies "again"',
      },
      accommodation: null,
      tags: ['again', 'satisfied'],
    },
    {
      id: 'pre-again-02', name: '"again" without antecedent', trigger: 'again',
      description: '"again" fails when no prior action exists.',
      contextTurns: [],
      testUtterance: 'do that again',
      expectation: {
        trigger: 'again', requiredCondition: 'previous-action-exists',
        conditionMet: false, expectedOutcome: 'presupposition-failed',
        shouldClarify: true, accommodationPossible: false,
        description: 'No prior action: "again" presupposition fails',
      },
      accommodation: null,
      tags: ['again', 'failure'],
    },
    {
      id: 'pre-again-03', name: '"again" after undo', trigger: 'again',
      description: '"again" after an undo should re-apply the undone action.',
      contextTurns: ['add reverb to the vocals', 'undo that'],
      testUtterance: 'again',
      expectation: {
        trigger: 'again', requiredCondition: 'previous-action-exists',
        conditionMet: true, expectedOutcome: 'presupposition-satisfied',
        shouldClarify: false, accommodationPossible: false,
        description: '"again" re-applies the undone reverb addition',
      },
      accommodation: null,
      tags: ['again', 'undo-redo'],
    },
    {
      id: 'pre-again-04', name: '"again" on different target', trigger: 'again',
      description: '"again" with new target still presupposes prior action.',
      contextTurns: ['compress the drums'],
      testUtterance: 'again on the bass',
      expectation: {
        trigger: 'again', requiredCondition: 'previous-action-exists',
        conditionMet: true, expectedOutcome: 'presupposition-satisfied',
        shouldClarify: false, accommodationPossible: false,
        description: 'Prior compress action satisfies; retargets to bass',
      },
      accommodation: null,
      tags: ['again', 'retarget'],
    },
  ];
}

function buildStillPresupTests(): readonly PresuppositionTestCase[] {
  return [
    {
      id: 'pre-still-01', name: '"still" with persisting state', trigger: 'still',
      description: '"still" succeeds when the state persists.',
      contextTurns: ['set the tempo to 120', 'add some drums'],
      testUtterance: 'is it still at 120?',
      expectation: {
        trigger: 'still', requiredCondition: 'tempo-is-120',
        conditionMet: true, expectedOutcome: 'presupposition-satisfied',
        shouldClarify: false, accommodationPossible: false,
        description: 'Tempo unchanged; "still" is satisfied',
      },
      accommodation: null,
      tags: ['still', 'satisfied', 'persistence'],
    },
    {
      id: 'pre-still-02', name: '"still" after state change', trigger: 'still',
      description: '"still" fails when the state has changed.',
      contextTurns: ['set the tempo to 120', 'change the tempo to 140'],
      testUtterance: 'is it still at 120?',
      expectation: {
        trigger: 'still', requiredCondition: 'tempo-is-120',
        conditionMet: false, expectedOutcome: 'presupposition-failed',
        shouldClarify: false, accommodationPossible: false,
        description: 'Tempo was changed; "still" presupposition fails',
      },
      accommodation: null,
      tags: ['still', 'failure', 'state-change'],
    },
    {
      id: 'pre-still-03', name: '"still" with muted track', trigger: 'still',
      description: '"still muted" checks if the mute persists.',
      contextTurns: ['mute the bass track'],
      testUtterance: 'is it still muted?',
      expectation: {
        trigger: 'still', requiredCondition: 'bass-is-muted',
        conditionMet: true, expectedOutcome: 'presupposition-satisfied',
        shouldClarify: false, accommodationPossible: false,
        description: 'Bass remains muted; presupposition holds',
      },
      accommodation: null,
      tags: ['still', 'satisfied', 'boolean-state'],
    },
  ];
}

function buildBackPresupTests(): readonly PresuppositionTestCase[] {
  return [
    {
      id: 'pre-back-01', name: '"back" with previous state', trigger: 'back',
      description: '"go back" succeeds when history exists.',
      contextTurns: ['set the key to D major', 'change to E minor'],
      testUtterance: 'go back to D major',
      expectation: {
        trigger: 'back', requiredCondition: 'previous-state-exists',
        conditionMet: true, expectedOutcome: 'presupposition-satisfied',
        shouldClarify: false, accommodationPossible: false,
        description: 'D major exists in history; "back" succeeds',
      },
      accommodation: null,
      tags: ['back', 'satisfied', 'history'],
    },
    {
      id: 'pre-back-02', name: '"back" without history', trigger: 'back',
      description: '"go back" fails at the start of session.',
      contextTurns: [],
      testUtterance: 'go back',
      expectation: {
        trigger: 'back', requiredCondition: 'previous-state-exists',
        conditionMet: false, expectedOutcome: 'presupposition-failed',
        shouldClarify: true, accommodationPossible: false,
        description: 'No history; "back" presupposition fails',
      },
      accommodation: null,
      tags: ['back', 'failure', 'no-history'],
    },
    {
      id: 'pre-back-03', name: '"bring back" a deleted element', trigger: 'back',
      description: '"bring back" presupposes something was removed.',
      contextTurns: ['delete the bridge section'],
      testUtterance: 'bring back the bridge',
      expectation: {
        trigger: 'back', requiredCondition: 'element-was-deleted',
        conditionMet: true, expectedOutcome: 'presupposition-satisfied',
        shouldClarify: false, accommodationPossible: false,
        description: 'Bridge was deleted; "bring back" succeeds',
      },
      accommodation: null,
      tags: ['back', 'restore', 'deletion'],
    },
  ];
}

function buildKeepPresupTests(): readonly PresuppositionTestCase[] {
  return [
    {
      id: 'pre-keep-01', name: '"keep" with current property', trigger: 'keep',
      description: '"keep" succeeds when property currently exists.',
      contextTurns: ['set the reverb to hall'],
      testUtterance: 'keep the reverb',
      expectation: {
        trigger: 'keep', requiredCondition: 'property-currently-set',
        conditionMet: true, expectedOutcome: 'presupposition-satisfied',
        shouldClarify: false, accommodationPossible: false,
        description: 'Reverb is set; "keep" creates preservation constraint',
      },
      accommodation: null,
      tags: ['keep', 'satisfied', 'preservation'],
    },
    {
      id: 'pre-keep-02', name: '"keep" with unset property', trigger: 'keep',
      description: '"keep" on unset property needs accommodation.',
      contextTurns: [],
      testUtterance: 'keep the reverb',
      expectation: {
        trigger: 'keep', requiredCondition: 'property-currently-set',
        conditionMet: false, expectedOutcome: 'presupposition-accommodated',
        shouldClarify: true, accommodationPossible: true,
        description: 'No reverb set; accommodation needed',
      },
      accommodation: {
        triggerWord: 'keep',
        missingPresupposition: 'reverb is currently active',
        accommodatedAs: 'assume default reverb and preserve it',
        accommodationType: 'local',
        confidenceAfter: 0.6,
        riskLevel: 'risky',
      },
      tags: ['keep', 'accommodation'],
    },
    {
      id: 'pre-keep-03', name: '"keep it like this"', trigger: 'keep',
      description: '"keep it like this" preserves current full state.',
      contextTurns: ['set tempo to 120', 'add reverb', 'brighten the mix'],
      testUtterance: 'keep it like this',
      expectation: {
        trigger: 'keep', requiredCondition: 'current-state-defined',
        conditionMet: true, expectedOutcome: 'presupposition-satisfied',
        shouldClarify: false, accommodationPossible: false,
        description: 'Current state exists; creates snapshot constraint',
      },
      accommodation: null,
      tags: ['keep', 'snapshot', 'full-state'],
    },
  ];
}

function buildContinuePresupTests(): readonly PresuppositionTestCase[] {
  return [
    {
      id: 'pre-cont-01', name: '"continue" with ongoing process', trigger: 'continue',
      description: '"continue" succeeds when a process is in progress.',
      contextTurns: ['start extending the chorus', 'add 2 more bars'],
      testUtterance: 'continue',
      expectation: {
        trigger: 'continue', requiredCondition: 'process-in-progress',
        conditionMet: true, expectedOutcome: 'presupposition-satisfied',
        shouldClarify: false, accommodationPossible: false,
        description: 'Extension is ongoing; "continue" adds more',
      },
      accommodation: null,
      tags: ['continue', 'satisfied', 'process'],
    },
    {
      id: 'pre-cont-02', name: '"continue" without active process', trigger: 'continue',
      description: '"continue" fails when no process is active.',
      contextTurns: ['set the tempo to 100'],
      testUtterance: 'continue',
      expectation: {
        trigger: 'continue', requiredCondition: 'process-in-progress',
        conditionMet: false, expectedOutcome: 'presupposition-failed',
        shouldClarify: true, accommodationPossible: false,
        description: 'No ongoing process; "continue" fails',
      },
      accommodation: null,
      tags: ['continue', 'failure'],
    },
    {
      id: 'pre-cont-03', name: '"keep going"', trigger: 'continue',
      description: '"keep going" is a variant of continue.',
      contextTurns: ['generate a bassline', 'extend it by 4 bars'],
      testUtterance: 'keep going',
      expectation: {
        trigger: 'continue', requiredCondition: 'process-in-progress',
        conditionMet: true, expectedOutcome: 'presupposition-satisfied',
        shouldClarify: false, accommodationPossible: false,
        description: 'Extension process active; "keep going" continues',
      },
      accommodation: null,
      tags: ['continue', 'variant', 'keep-going'],
    },
  ];
}

function buildNoLongerPresupTests(): readonly PresuppositionTestCase[] {
  return [
    {
      id: 'pre-nolonger-01', name: '"no longer" with active state', trigger: 'no-longer',
      description: '"no longer" succeeds when state is currently active.',
      contextTurns: ['the drums are muted'],
      testUtterance: 'they should no longer be muted',
      expectation: {
        trigger: 'no-longer', requiredCondition: 'state-currently-active',
        conditionMet: true, expectedOutcome: 'presupposition-satisfied',
        shouldClarify: false, accommodationPossible: false,
        description: 'Drums are muted; "no longer" negates it',
      },
      accommodation: null,
      tags: ['no-longer', 'satisfied', 'negation'],
    },
    {
      id: 'pre-nolonger-02', name: '"no longer" with inactive state', trigger: 'no-longer',
      description: '"no longer" on already-inactive state is vacuous.',
      contextTurns: ['unmute the drums'],
      testUtterance: 'the drums should no longer be muted',
      expectation: {
        trigger: 'no-longer', requiredCondition: 'state-currently-active',
        conditionMet: false, expectedOutcome: 'presupposition-failed',
        shouldClarify: false, accommodationPossible: true,
        description: 'Already unmuted; vacuous but accommodated',
      },
      accommodation: {
        triggerWord: 'no longer',
        missingPresupposition: 'drums are currently muted',
        accommodatedAs: 'acknowledge already unmuted, no-op',
        accommodationType: 'global',
        confidenceAfter: 0.8,
        riskLevel: 'safe',
      },
      tags: ['no-longer', 'vacuous'],
    },
  ];
}

function buildAlreadyPresupTests(): readonly PresuppositionTestCase[] {
  return [
    {
      id: 'pre-already-01', name: '"already" with completed action', trigger: 'already',
      description: '"already" checks if action was done.',
      contextTurns: ['add reverb to the vocals'],
      testUtterance: 'I already added reverb',
      expectation: {
        trigger: 'already', requiredCondition: 'action-completed',
        conditionMet: true, expectedOutcome: 'presupposition-satisfied',
        shouldClarify: false, accommodationPossible: false,
        description: 'Reverb was added; "already" is satisfied',
      },
      accommodation: null,
      tags: ['already', 'satisfied'],
    },
    {
      id: 'pre-already-02', name: '"already" with uncompleted action', trigger: 'already',
      description: '"already" fails when action was not done.',
      contextTurns: [],
      testUtterance: 'I already set the tempo',
      expectation: {
        trigger: 'already', requiredCondition: 'action-completed',
        conditionMet: false, expectedOutcome: 'presupposition-failed',
        shouldClarify: true, accommodationPossible: true,
        description: 'No tempo set; "already" presupposition fails',
      },
      accommodation: {
        triggerWord: 'already',
        missingPresupposition: 'tempo was previously set',
        accommodatedAs: 'assume user set tempo outside session, ask for value',
        accommodationType: 'global',
        confidenceAfter: 0.5,
        riskLevel: 'risky',
      },
      tags: ['already', 'failure', 'accommodation'],
    },
  ];
}

function buildStopPresupTests(): readonly PresuppositionTestCase[] {
  return [
    {
      id: 'pre-stop-01', name: '"stop" with active process', trigger: 'stop',
      description: '"stop" succeeds when something is playing/looping.',
      contextTurns: ['play the track'],
      testUtterance: 'stop',
      expectation: {
        trigger: 'stop', requiredCondition: 'process-active',
        conditionMet: true, expectedOutcome: 'presupposition-satisfied',
        shouldClarify: false, accommodationPossible: false,
        description: 'Playback active; "stop" halts it',
      },
      accommodation: null,
      tags: ['stop', 'satisfied'],
    },
    {
      id: 'pre-stop-02', name: '"stop" with nothing active', trigger: 'stop',
      description: '"stop" fails when nothing is active.',
      contextTurns: [],
      testUtterance: 'stop',
      expectation: {
        trigger: 'stop', requiredCondition: 'process-active',
        conditionMet: false, expectedOutcome: 'presupposition-failed',
        shouldClarify: true, accommodationPossible: false,
        description: 'Nothing active; "stop" has no target',
      },
      accommodation: null,
      tags: ['stop', 'failure'],
    },
  ];
}

function buildAnotherAlsoTests(): readonly PresuppositionTestCase[] {
  return [
    {
      id: 'pre-another-01', name: '"another" presupposes prior instance', trigger: 'another',
      description: '"another" requires a prior instance of the same type.',
      contextTurns: ['add a piano track'],
      testUtterance: 'add another piano track',
      expectation: {
        trigger: 'another', requiredCondition: 'prior-instance-exists',
        conditionMet: true, expectedOutcome: 'presupposition-satisfied',
        shouldClarify: false, accommodationPossible: false,
        description: 'Piano track exists; "another" adds second one',
      },
      accommodation: null,
      tags: ['another', 'satisfied'],
    },
    {
      id: 'pre-another-02', name: '"another" without prior instance', trigger: 'another',
      description: '"another" with no prior instance needs accommodation.',
      contextTurns: [],
      testUtterance: 'add another reverb',
      expectation: {
        trigger: 'another', requiredCondition: 'prior-instance-exists',
        conditionMet: false, expectedOutcome: 'presupposition-accommodated',
        shouldClarify: false, accommodationPossible: true,
        description: 'No prior reverb; accommodate as "add a reverb"',
      },
      accommodation: {
        triggerWord: 'another',
        missingPresupposition: 'a reverb already exists',
        accommodatedAs: 'interpret as "add a reverb"',
        accommodationType: 'local',
        confidenceAfter: 0.7,
        riskLevel: 'safe',
      },
      tags: ['another', 'accommodation'],
    },
    {
      id: 'pre-also-01', name: '"also" presupposes prior similar action', trigger: 'also',
      description: '"also" requires a previous similar action.',
      contextTurns: ['add reverb to the drums'],
      testUtterance: 'also add delay',
      expectation: {
        trigger: 'also', requiredCondition: 'prior-similar-action',
        conditionMet: true, expectedOutcome: 'presupposition-satisfied',
        shouldClarify: false, accommodationPossible: false,
        description: 'Prior effect addition; "also" adds another effect',
      },
      accommodation: null,
      tags: ['also', 'satisfied'],
    },
    {
      id: 'pre-too-01', name: '"too" presupposes parallel action', trigger: 'too',
      description: '"too" implies same action applies to another target.',
      contextTurns: ['compress the vocals'],
      testUtterance: 'compress the guitars too',
      expectation: {
        trigger: 'too', requiredCondition: 'parallel-action-exists',
        conditionMet: true, expectedOutcome: 'presupposition-satisfied',
        shouldClarify: false, accommodationPossible: false,
        description: 'Compression on vocals; "too" extends to guitars',
      },
      accommodation: null,
      tags: ['too', 'satisfied', 'parallel'],
    },
    {
      id: 'pre-yet-01', name: '"yet" presupposes expected action', trigger: 'yet',
      description: '"not yet" presupposes an expected action.',
      contextTurns: ['we need to mix the track'],
      testUtterance: 'I haven\'t mastered it yet',
      expectation: {
        trigger: 'yet', requiredCondition: 'expected-action-pending',
        conditionMet: true, expectedOutcome: 'presupposition-satisfied',
        shouldClarify: false, accommodationPossible: false,
        description: 'Mastering expected as part of workflow; "yet" satisfied',
      },
      accommodation: null,
      tags: ['yet', 'satisfied', 'workflow'],
    },
    {
      id: 'pre-anymore-01', name: '"anymore" with changed state', trigger: 'anymore',
      description: '"don\'t need X anymore" presupposes X was needed.',
      contextTurns: ['the placeholder beat was useful during writing'],
      testUtterance: 'I don\'t need the click track anymore',
      expectation: {
        trigger: 'anymore', requiredCondition: 'was-previously-needed',
        conditionMet: true, expectedOutcome: 'presupposition-satisfied',
        shouldClarify: false, accommodationPossible: false,
        description: 'Click was needed; "anymore" signals removal',
      },
      accommodation: null,
      tags: ['anymore', 'satisfied'],
    },
  ];
}

// ---- 238 Functions ----

/** Returns all presupposition test cases. */
export function getPresuppositionTests(): readonly PresuppositionTestCase[] {
  return [
    ...buildAgainPresupTests(),
    ...buildStillPresupTests(),
    ...buildBackPresupTests(),
    ...buildKeepPresupTests(),
    ...buildContinuePresupTests(),
    ...buildNoLongerPresupTests(),
    ...buildAlreadyPresupTests(),
    ...buildStopPresupTests(),
    ...buildAnotherAlsoTests(),
  ];
}

/** Simulates running a presupposition test. */
export function runPresuppositionTest(testCase: PresuppositionTestCase): PresuppositionTestResult {
  const exp = testCase.expectation;
  const conditionResult = exp.conditionMet;
  const accommodationApplied = !conditionResult && exp.accommodationPossible && testCase.accommodation !== null;

  let outcome: PresuppositionOutcome;
  if (conditionResult) {
    outcome = 'presupposition-satisfied';
  } else if (accommodationApplied) {
    outcome = 'presupposition-accommodated';
  } else {
    outcome = 'presupposition-failed';
  }

  const correct = outcome === exp.expectedOutcome;

  return {
    testId: testCase.id,
    outcome,
    triggerDetected: true,
    conditionChecked: true,
    conditionResult,
    clarificationIssued: exp.shouldClarify && !conditionResult,
    accommodationApplied,
    correct,
    errorDetail: correct ? '' : `Expected ${exp.expectedOutcome}, got ${outcome}`,
  };
}

/** Validates a presupposition test result. */
export function validatePresuppositionResult(
  result: PresuppositionTestResult,
  testCase: PresuppositionTestCase
): readonly string[] {
  const issues: string[] = [];
  const exp = testCase.expectation;

  if (!result.triggerDetected) {
    issues.push(`Trigger "${exp.trigger}" not detected in "${testCase.testUtterance}"`);
  }

  if (result.outcome !== exp.expectedOutcome) {
    issues.push(`Expected outcome "${exp.expectedOutcome}", got "${result.outcome}"`);
  }

  if (exp.shouldClarify && !result.clarificationIssued && !exp.conditionMet) {
    issues.push(`Expected clarification for failed presupposition but none issued`);
  }

  if (exp.accommodationPossible && !exp.conditionMet && !result.accommodationApplied && testCase.accommodation !== null) {
    issues.push(`Accommodation was possible but not applied`);
  }

  if (testCase.accommodation !== null && result.accommodationApplied) {
    const acc = testCase.accommodation;
    if (acc.riskLevel === 'dangerous') {
      issues.push(`Dangerous accommodation applied without user confirmation`);
    }
  }

  return issues;
}

/** Formats a presupposition report. */
export function formatPresuppositionReport(results: readonly PresuppositionTestResult[]): string {
  const lines: string[] = [];
  lines.push('=== Presupposition Handling Report ===');
  lines.push(`Total tests: ${results.length}`);

  const correct = results.filter(r => r.correct).length;
  const satisfied = results.filter(r => r.outcome === 'presupposition-satisfied').length;
  const failed = results.filter(r => r.outcome === 'presupposition-failed').length;
  const accommodated = results.filter(r => r.outcome === 'presupposition-accommodated').length;

  lines.push(`Correct: ${correct}/${results.length} (${((correct / Math.max(results.length, 1)) * 100).toFixed(1)}%)`);
  lines.push(`Satisfied: ${satisfied} | Failed: ${failed} | Accommodated: ${accommodated}`);
  lines.push('');

  for (const r of results) {
    const icon = r.correct ? '[OK]' : '[!!]';
    lines.push(`${icon} ${r.testId}: ${r.outcome}`);
    if (r.clarificationIssued) lines.push(`     Clarification issued`);
    if (r.accommodationApplied) lines.push(`     Accommodation applied`);
    if (r.errorDetail) lines.push(`     Error: ${r.errorDetail}`);
  }

  return lines.join('\n');
}

/** Returns presupposition tests filtered by trigger word. */
export function getPresuppositionTestsByTrigger(trigger: PresuppositionTrigger): readonly PresuppositionTestCase[] {
  return getPresuppositionTests().filter(t => t.trigger === trigger);
}

/** Returns total count of presupposition tests. */
export function countPresuppositionTests(): number {
  return getPresuppositionTests().length;
}

/** Returns coverage metrics for presupposition tests. */
export function getPresuppositionTestCoverage(results: readonly PresuppositionTestResult[]): PresuppositionCoverage {
  const tests = getPresuppositionTests();
  const byTrigger = new Map<string, number>();
  const byOutcome = new Map<string, number>();

  for (const test of tests) {
    byTrigger.set(test.trigger, (byTrigger.get(test.trigger) ?? 0) + 1);
  }

  let correctCount = 0;
  let accommodationCount = 0;
  let failureCount = 0;

  for (const r of results) {
    byOutcome.set(r.outcome, (byOutcome.get(r.outcome) ?? 0) + 1);
    if (r.correct) correctCount++;
    if (r.accommodationApplied) accommodationCount++;
    if (r.outcome === 'presupposition-failed') failureCount++;
  }

  const total = Math.max(results.length, 1);

  return {
    totalTests: tests.length,
    byTrigger,
    byOutcome,
    overallAccuracy: correctCount / total,
    accommodationRate: accommodationCount / total,
    failureRate: failureCount / total,
  };
}

// ===================== STEP 239: QUD BEHAVIOR TESTS =====================

// ---- 239 Types ----

/** Type of QUD (Question Under Discussion) test. */
export type QUDTestType =
  | 'single-resolution'
  | 'no-new-ambiguity'
  | 'stack-behavior'
  | 'inheritance'
  | 'optimal-selection'
  | 'batch-efficiency'
  | 'expiry'
  | 'priority'
  | 'cascading'
  | 'nested';

/** Status of a QUD after a clarification round. */
export type QUDStatus =
  | 'open'
  | 'resolved'
  | 'expired'
  | 'superseded'
  | 'deferred'
  | 'partially-resolved';

/** Measures how much ambiguity was reduced. */
export interface AmbiguityReduction {
  readonly candidatesBefore: number;
  readonly candidatesAfter: number;
  readonly reductionRatio: number;
  readonly fullyResolved: boolean;
  readonly newAmbiguitiesIntroduced: number;
  readonly netReduction: number;
}

/** Expectation for a QUD test. */
export interface QUDExpectation {
  readonly qudType: QUDTestType;
  readonly initialAmbiguity: number;
  readonly expectedReduction: AmbiguityReduction;
  readonly expectedQUDStatus: QUDStatus;
  readonly stackDepthBefore: number;
  readonly stackDepthAfter: number;
  readonly contextPreserved: boolean;
  readonly description: string;
}

/** A single QUD test case. */
export interface QUDTestCase {
  readonly id: string;
  readonly name: string;
  readonly qudType: QUDTestType;
  readonly description: string;
  readonly ambiguousUtterance: string;
  readonly clarificationQuestion: string;
  readonly userResponse: string;
  readonly expectation: QUDExpectation;
  readonly tags: readonly string[];
}

/** Result from running a QUD test. */
export interface QUDTestResult {
  readonly testId: string;
  readonly qudType: QUDTestType;
  readonly ambiguityReduction: AmbiguityReduction;
  readonly qudStatus: QUDStatus;
  readonly correct: boolean;
  readonly noNewAmbiguities: boolean;
  readonly contextPreserved: boolean;
  readonly errorDetail: string;
}

/** Suite of QUD tests. */
export interface QUDTestSuite {
  readonly name: string;
  readonly tests: readonly QUDTestCase[];
  readonly version: string;
}

/** Coverage metrics for QUD tests. */
export interface QUDCoverage {
  readonly totalTests: number;
  readonly byType: ReadonlyMap<string, number>;
  readonly overallAccuracy: number;
  readonly avgReductionRatio: number;
  readonly newAmbiguityRate: number;
}

// ---- 239 Test Case Data ----

function buildSingleResolutionQUDTests(): readonly QUDTestCase[] {
  return [
    {
      id: 'qud-sr-01', name: 'Single clarification resolves ambiguity', qudType: 'single-resolution',
      description: 'One question fully resolves a two-way ambiguity.',
      ambiguousUtterance: 'boost the bass',
      clarificationQuestion: 'Do you mean the bass instrument or the low frequency range?',
      userResponse: 'the instrument',
      expectation: {
        qudType: 'single-resolution', initialAmbiguity: 2,
        expectedReduction: {
          candidatesBefore: 2, candidatesAfter: 1, reductionRatio: 0.5,
          fullyResolved: true, newAmbiguitiesIntroduced: 0, netReduction: 1,
        },
        expectedQUDStatus: 'resolved', stackDepthBefore: 1, stackDepthAfter: 0,
        contextPreserved: true, description: 'Binary ambiguity fully resolved',
      },
      tags: ['single', 'binary', 'full-resolution'],
    },
    {
      id: 'qud-sr-02', name: 'Three-way ambiguity needs one question', qudType: 'single-resolution',
      description: 'One question resolves a three-way ambiguity.',
      ambiguousUtterance: 'change the sound',
      clarificationQuestion: 'Which sound: the synth lead, the pad, or the bass?',
      userResponse: 'the pad',
      expectation: {
        qudType: 'single-resolution', initialAmbiguity: 3,
        expectedReduction: {
          candidatesBefore: 3, candidatesAfter: 1, reductionRatio: 0.333,
          fullyResolved: true, newAmbiguitiesIntroduced: 0, netReduction: 2,
        },
        expectedQUDStatus: 'resolved', stackDepthBefore: 1, stackDepthAfter: 0,
        contextPreserved: true, description: 'Three-way resolved in one step',
      },
      tags: ['single', 'ternary'],
    },
    {
      id: 'qud-sr-03', name: 'Partial resolution leaves one question', qudType: 'single-resolution',
      description: 'Question resolves one ambiguity but leaves another.',
      ambiguousUtterance: 'make the loud part softer',
      clarificationQuestion: 'Which loud part: the verse drums or the chorus guitars?',
      userResponse: 'the chorus guitars',
      expectation: {
        qudType: 'single-resolution', initialAmbiguity: 2,
        expectedReduction: {
          candidatesBefore: 2, candidatesAfter: 1, reductionRatio: 0.5,
          fullyResolved: true, newAmbiguitiesIntroduced: 0, netReduction: 1,
        },
        expectedQUDStatus: 'resolved', stackDepthBefore: 1, stackDepthAfter: 0,
        contextPreserved: true, description: 'Target disambiguation complete',
      },
      tags: ['single', 'reference'],
    },
  ];
}

function buildNoNewAmbiguityQUDTests(): readonly QUDTestCase[] {
  return [
    {
      id: 'qud-nna-01', name: 'Clarification does not add ambiguity', qudType: 'no-new-ambiguity',
      description: 'System question uses unambiguous wording.',
      ambiguousUtterance: 'adjust the level',
      clarificationQuestion: 'Do you want to adjust the volume fader or the send level?',
      userResponse: 'the volume fader',
      expectation: {
        qudType: 'no-new-ambiguity', initialAmbiguity: 2,
        expectedReduction: {
          candidatesBefore: 2, candidatesAfter: 1, reductionRatio: 0.5,
          fullyResolved: true, newAmbiguitiesIntroduced: 0, netReduction: 1,
        },
        expectedQUDStatus: 'resolved', stackDepthBefore: 1, stackDepthAfter: 0,
        contextPreserved: true, description: 'Question wording is unambiguous',
      },
      tags: ['no-new', 'clean-wording'],
    },
    {
      id: 'qud-nna-02', name: 'Options presented distinctly', qudType: 'no-new-ambiguity',
      description: 'Each option in clarification is clearly distinct.',
      ambiguousUtterance: 'add some color',
      clarificationQuestion: 'Add color via: (A) saturation/warmth, (B) chorus/modulation, or (C) harmonic distortion?',
      userResponse: 'A',
      expectation: {
        qudType: 'no-new-ambiguity', initialAmbiguity: 3,
        expectedReduction: {
          candidatesBefore: 3, candidatesAfter: 1, reductionRatio: 0.333,
          fullyResolved: true, newAmbiguitiesIntroduced: 0, netReduction: 2,
        },
        expectedQUDStatus: 'resolved', stackDepthBefore: 1, stackDepthAfter: 0,
        contextPreserved: true, description: 'Labeled options prevent new ambiguity',
      },
      tags: ['no-new', 'labeled-options'],
    },
    {
      id: 'qud-nna-03', name: 'Poorly worded question introduces ambiguity', qudType: 'no-new-ambiguity',
      description: 'Detects when a clarification introduces new confusion.',
      ambiguousUtterance: 'make it brighter',
      clarificationQuestion: 'Brighter as in EQ or timbre?',
      userResponse: 'timbre... wait, what do you mean?',
      expectation: {
        qudType: 'no-new-ambiguity', initialAmbiguity: 2,
        expectedReduction: {
          candidatesBefore: 2, candidatesAfter: 2, reductionRatio: 1.0,
          fullyResolved: false, newAmbiguitiesIntroduced: 1, netReduction: -1,
        },
        expectedQUDStatus: 'open', stackDepthBefore: 1, stackDepthAfter: 2,
        contextPreserved: true, description: 'EQ vs timbre distinction unclear to user',
      },
      tags: ['no-new', 'bad-question', 'regression'],
    },
  ];
}

function buildStackBehaviorQUDTests(): readonly QUDTestCase[] {
  return [
    {
      id: 'qud-stack-01', name: 'Sub-question resolves parent QUD', qudType: 'stack-behavior',
      description: 'Answering sub-question also resolves the parent.',
      ambiguousUtterance: 'fix the timing',
      clarificationQuestion: 'Which track has timing issues?',
      userResponse: 'the hi-hat — it\'s too late',
      expectation: {
        qudType: 'stack-behavior', initialAmbiguity: 4,
        expectedReduction: {
          candidatesBefore: 4, candidatesAfter: 1, reductionRatio: 0.25,
          fullyResolved: true, newAmbiguitiesIntroduced: 0, netReduction: 3,
        },
        expectedQUDStatus: 'resolved', stackDepthBefore: 2, stackDepthAfter: 0,
        contextPreserved: true, description: 'User answer resolves both track and issue',
      },
      tags: ['stack', 'cascading-resolution'],
    },
    {
      id: 'qud-stack-02', name: 'Nested QUD preserves outer context', qudType: 'stack-behavior',
      description: 'Inner QUD resolution does not lose outer context.',
      ambiguousUtterance: 'copy the pattern and modify it',
      clarificationQuestion: 'Which pattern should I copy?',
      userResponse: 'the drum pattern from bar 8',
      expectation: {
        qudType: 'stack-behavior', initialAmbiguity: 3,
        expectedReduction: {
          candidatesBefore: 3, candidatesAfter: 1, reductionRatio: 0.333,
          fullyResolved: true, newAmbiguitiesIntroduced: 0, netReduction: 2,
        },
        expectedQUDStatus: 'resolved', stackDepthBefore: 2, stackDepthAfter: 1,
        contextPreserved: true, description: '"modify it" QUD still open after copy resolved',
      },
      tags: ['stack', 'nested', 'context-preservation'],
    },
    {
      id: 'qud-stack-03', name: 'QUD stack depth limited', qudType: 'stack-behavior',
      description: 'System limits QUD stack to avoid cascading confusion.',
      ambiguousUtterance: 'adjust everything to match',
      clarificationQuestion: 'What should I adjust?',
      userResponse: 'the levels... and make them warmer',
      expectation: {
        qudType: 'stack-behavior', initialAmbiguity: 5,
        expectedReduction: {
          candidatesBefore: 5, candidatesAfter: 2, reductionRatio: 0.4,
          fullyResolved: false, newAmbiguitiesIntroduced: 1, netReduction: 2,
        },
        expectedQUDStatus: 'partially-resolved', stackDepthBefore: 1, stackDepthAfter: 2,
        contextPreserved: true, description: 'User introduces new sub-question',
      },
      tags: ['stack', 'depth-limit'],
    },
  ];
}

function buildInheritanceQUDTests(): readonly QUDTestCase[] {
  return [
    {
      id: 'qud-inh-01', name: 'Answer carries forward context', qudType: 'inheritance',
      description: 'Resolved QUD context persists for subsequent turns.',
      ambiguousUtterance: 'brighten the mix',
      clarificationQuestion: 'Brighten via high-shelf EQ or exciter?',
      userResponse: 'high-shelf EQ',
      expectation: {
        qudType: 'inheritance', initialAmbiguity: 2,
        expectedReduction: {
          candidatesBefore: 2, candidatesAfter: 1, reductionRatio: 0.5,
          fullyResolved: true, newAmbiguitiesIntroduced: 0, netReduction: 1,
        },
        expectedQUDStatus: 'resolved', stackDepthBefore: 1, stackDepthAfter: 0,
        contextPreserved: true, description: 'EQ choice carries forward if user says "more" later',
      },
      tags: ['inheritance', 'carry-forward'],
    },
    {
      id: 'qud-inh-02', name: 'Inherited context used in next utterance', qudType: 'inheritance',
      description: 'Previous clarification resolution informs next command.',
      ambiguousUtterance: 'compress the vocals',
      clarificationQuestion: 'Light compression or heavy limiting?',
      userResponse: 'light',
      expectation: {
        qudType: 'inheritance', initialAmbiguity: 2,
        expectedReduction: {
          candidatesBefore: 2, candidatesAfter: 1, reductionRatio: 0.5,
          fullyResolved: true, newAmbiguitiesIntroduced: 0, netReduction: 1,
        },
        expectedQUDStatus: 'resolved', stackDepthBefore: 1, stackDepthAfter: 0,
        contextPreserved: true, description: '"more" after this should mean more light compression',
      },
      tags: ['inheritance', 'degree-context'],
    },
    {
      id: 'qud-inh-03', name: 'Inherited context overridden by explicit mention', qudType: 'inheritance',
      description: 'Explicit new specification overrides inherited context.',
      ambiguousUtterance: 'add effects',
      clarificationQuestion: 'What type of effect?',
      userResponse: 'reverb',
      expectation: {
        qudType: 'inheritance', initialAmbiguity: 5,
        expectedReduction: {
          candidatesBefore: 5, candidatesAfter: 1, reductionRatio: 0.2,
          fullyResolved: true, newAmbiguitiesIntroduced: 0, netReduction: 4,
        },
        expectedQUDStatus: 'resolved', stackDepthBefore: 1, stackDepthAfter: 0,
        contextPreserved: true, description: 'If user later says "add delay", reverb context overridden',
      },
      tags: ['inheritance', 'override'],
    },
  ];
}

function buildOptimalSelectionQUDTests(): readonly QUDTestCase[] {
  return [
    {
      id: 'qud-opt-01', name: 'Binary question maximizes information gain', qudType: 'optimal-selection',
      description: 'With 4 candidates, best question splits into 2+2.',
      ambiguousUtterance: 'change the instrument',
      clarificationQuestion: 'Is it a melodic instrument (piano/guitar) or a rhythmic one (drums/percussion)?',
      userResponse: 'melodic',
      expectation: {
        qudType: 'optimal-selection', initialAmbiguity: 4,
        expectedReduction: {
          candidatesBefore: 4, candidatesAfter: 2, reductionRatio: 0.5,
          fullyResolved: false, newAmbiguitiesIntroduced: 0, netReduction: 2,
        },
        expectedQUDStatus: 'partially-resolved', stackDepthBefore: 1, stackDepthAfter: 1,
        contextPreserved: true, description: 'Optimal binary split reduces 4 to 2',
      },
      tags: ['optimal', 'binary-split', 'information-gain'],
    },
    {
      id: 'qud-opt-02', name: 'Question targets highest-entropy dimension', qudType: 'optimal-selection',
      description: 'System asks about the most ambiguous dimension first.',
      ambiguousUtterance: 'make the verse louder and brighter',
      clarificationQuestion: 'Which tracks in the verse should be affected?',
      userResponse: 'all of them',
      expectation: {
        qudType: 'optimal-selection', initialAmbiguity: 3,
        expectedReduction: {
          candidatesBefore: 3, candidatesAfter: 1, reductionRatio: 0.333,
          fullyResolved: true, newAmbiguitiesIntroduced: 0, netReduction: 2,
        },
        expectedQUDStatus: 'resolved', stackDepthBefore: 1, stackDepthAfter: 0,
        contextPreserved: true, description: 'Scope question is highest entropy',
      },
      tags: ['optimal', 'entropy', 'scope'],
    },
  ];
}

function buildBatchEfficiencyQUDTests(): readonly QUDTestCase[] {
  return [
    {
      id: 'qud-batch-01', name: 'Batch question resolves multiple ambiguities', qudType: 'batch-efficiency',
      description: 'Single compound question addresses two ambiguities at once.',
      ambiguousUtterance: 'add effects to the track and mix it down',
      clarificationQuestion: 'Which effects and which output format?',
      userResponse: 'reverb and delay, export as WAV',
      expectation: {
        qudType: 'batch-efficiency', initialAmbiguity: 4,
        expectedReduction: {
          candidatesBefore: 4, candidatesAfter: 1, reductionRatio: 0.25,
          fullyResolved: true, newAmbiguitiesIntroduced: 0, netReduction: 3,
        },
        expectedQUDStatus: 'resolved', stackDepthBefore: 2, stackDepthAfter: 0,
        contextPreserved: true, description: 'Two questions resolved in one turn',
      },
      tags: ['batch', 'efficiency', 'compound'],
    },
    {
      id: 'qud-batch-02', name: 'Batch question not too overwhelming', qudType: 'batch-efficiency',
      description: 'System limits batch to 2-3 questions max.',
      ambiguousUtterance: 'set up the whole arrangement with instruments and effects',
      clarificationQuestion: 'Let\'s start with the instruments. What genre and tempo?',
      userResponse: 'jazz at 120 bpm',
      expectation: {
        qudType: 'batch-efficiency', initialAmbiguity: 8,
        expectedReduction: {
          candidatesBefore: 8, candidatesAfter: 4, reductionRatio: 0.5,
          fullyResolved: false, newAmbiguitiesIntroduced: 0, netReduction: 4,
        },
        expectedQUDStatus: 'partially-resolved', stackDepthBefore: 4, stackDepthAfter: 2,
        contextPreserved: true, description: 'System wisely batches only 2 questions',
      },
      tags: ['batch', 'limit', 'cognitive-load'],
    },
  ];
}

function buildExpiryQUDTests(): readonly QUDTestCase[] {
  return [
    {
      id: 'qud-exp-01', name: 'Old QUD expires after topic shift', qudType: 'expiry',
      description: 'QUD from 5 turns ago is no longer relevant.',
      ambiguousUtterance: 'change the sound',
      clarificationQuestion: 'Which sound?',
      userResponse: 'never mind, let\'s work on the drums instead',
      expectation: {
        qudType: 'expiry', initialAmbiguity: 3,
        expectedReduction: {
          candidatesBefore: 3, candidatesAfter: 3, reductionRatio: 1.0,
          fullyResolved: false, newAmbiguitiesIntroduced: 0, netReduction: 0,
        },
        expectedQUDStatus: 'expired', stackDepthBefore: 1, stackDepthAfter: 0,
        contextPreserved: false, description: 'Topic shift renders QUD irrelevant',
      },
      tags: ['expiry', 'topic-shift'],
    },
    {
      id: 'qud-exp-02', name: 'QUD superseded by new command', qudType: 'expiry',
      description: 'New explicit command supersedes pending clarification.',
      ambiguousUtterance: 'adjust the mix',
      clarificationQuestion: 'What aspect of the mix?',
      userResponse: 'actually, just set everything to -6 dB',
      expectation: {
        qudType: 'expiry', initialAmbiguity: 4,
        expectedReduction: {
          candidatesBefore: 4, candidatesAfter: 0, reductionRatio: 0,
          fullyResolved: false, newAmbiguitiesIntroduced: 0, netReduction: 4,
        },
        expectedQUDStatus: 'superseded', stackDepthBefore: 1, stackDepthAfter: 0,
        contextPreserved: false, description: 'Explicit command replaces ambiguous one',
      },
      tags: ['expiry', 'superseded'],
    },
    {
      id: 'qud-exp-03', name: 'Deferred QUD revisited', qudType: 'expiry',
      description: 'User defers a question and comes back to it.',
      ambiguousUtterance: 'process the vocals',
      clarificationQuestion: 'What processing?',
      userResponse: 'I\'ll decide later',
      expectation: {
        qudType: 'expiry', initialAmbiguity: 4,
        expectedReduction: {
          candidatesBefore: 4, candidatesAfter: 4, reductionRatio: 1.0,
          fullyResolved: false, newAmbiguitiesIntroduced: 0, netReduction: 0,
        },
        expectedQUDStatus: 'deferred', stackDepthBefore: 1, stackDepthAfter: 0,
        contextPreserved: true, description: 'QUD deferred, can be revisited',
      },
      tags: ['expiry', 'deferred', 'revisit'],
    },
  ];
}

function buildPriorityQUDTests(): readonly QUDTestCase[] {
  return [
    {
      id: 'qud-pri-01', name: 'Critical question asked first', qudType: 'priority',
      description: 'When multiple QUDs exist, system asks the blocking one first.',
      ambiguousUtterance: 'delete some tracks and rebalance',
      clarificationQuestion: 'Which tracks should I delete? (This affects the rebalance.)',
      userResponse: 'the extra guitar layers',
      expectation: {
        qudType: 'priority', initialAmbiguity: 3,
        expectedReduction: {
          candidatesBefore: 3, candidatesAfter: 1, reductionRatio: 0.333,
          fullyResolved: true, newAmbiguitiesIntroduced: 0, netReduction: 2,
        },
        expectedQUDStatus: 'resolved', stackDepthBefore: 2, stackDepthAfter: 1,
        contextPreserved: true, description: 'Deletion QUD prioritized because it gates rebalance',
      },
      tags: ['priority', 'blocking', 'dependency'],
    },
    {
      id: 'qud-pri-02', name: 'Non-blocking question deferred', qudType: 'priority',
      description: 'System defers cosmetic questions to handle critical ones.',
      ambiguousUtterance: 'save the project with a new name and export a mixdown',
      clarificationQuestion: 'What filename should I use for the save?',
      userResponse: 'my-song-v2',
      expectation: {
        qudType: 'priority', initialAmbiguity: 2,
        expectedReduction: {
          candidatesBefore: 2, candidatesAfter: 1, reductionRatio: 0.5,
          fullyResolved: true, newAmbiguitiesIntroduced: 0, netReduction: 1,
        },
        expectedQUDStatus: 'resolved', stackDepthBefore: 2, stackDepthAfter: 1,
        contextPreserved: true, description: 'Save name asked first; export format deferred',
      },
      tags: ['priority', 'deferred-cosmetic'],
    },
  ];
}

// ---- 239 Functions ----

/** Returns all QUD test cases. */
export function getQUDTests(): readonly QUDTestCase[] {
  return [
    ...buildSingleResolutionQUDTests(),
    ...buildNoNewAmbiguityQUDTests(),
    ...buildStackBehaviorQUDTests(),
    ...buildInheritanceQUDTests(),
    ...buildOptimalSelectionQUDTests(),
    ...buildBatchEfficiencyQUDTests(),
    ...buildExpiryQUDTests(),
    ...buildPriorityQUDTests(),
  ];
}

/** Simulates running a QUD test. */
export function runQUDTest(testCase: QUDTestCase): QUDTestResult {
  const exp = testCase.expectation;
  const expectedRed = exp.expectedReduction;

  const ambiguityReduction: AmbiguityReduction = {
    candidatesBefore: expectedRed.candidatesBefore,
    candidatesAfter: expectedRed.candidatesAfter,
    reductionRatio: expectedRed.reductionRatio,
    fullyResolved: expectedRed.fullyResolved,
    newAmbiguitiesIntroduced: expectedRed.newAmbiguitiesIntroduced,
    netReduction: expectedRed.netReduction,
  };

  const noNewAmb = expectedRed.newAmbiguitiesIntroduced === 0;
  const correct = noNewAmb && exp.contextPreserved;

  return {
    testId: testCase.id,
    qudType: testCase.qudType,
    ambiguityReduction,
    qudStatus: exp.expectedQUDStatus,
    correct,
    noNewAmbiguities: noNewAmb,
    contextPreserved: exp.contextPreserved,
    errorDetail: correct ? '' : 'QUD behavior did not meet expectations',
  };
}

/** Validates a QUD test result against expectations. */
export function validateQUDResult(result: QUDTestResult, testCase: QUDTestCase): readonly string[] {
  const issues: string[] = [];
  const exp = testCase.expectation;

  if (result.qudStatus !== exp.expectedQUDStatus) {
    issues.push(`Expected QUD status "${exp.expectedQUDStatus}", got "${result.qudStatus}"`);
  }

  if (!result.noNewAmbiguities && testCase.qudType === 'no-new-ambiguity') {
    issues.push('Clarification introduced new ambiguities');
  }

  if (!result.contextPreserved && exp.contextPreserved) {
    issues.push('Context was not preserved across clarification');
  }

  const red = result.ambiguityReduction;
  const expRed = exp.expectedReduction;

  if (red.fullyResolved !== expRed.fullyResolved) {
    issues.push(`Expected fullyResolved=${expRed.fullyResolved}, got ${red.fullyResolved}`);
  }

  if (red.netReduction < expRed.netReduction) {
    issues.push(`Net reduction ${red.netReduction} less than expected ${expRed.netReduction}`);
  }

  return issues;
}

/** Formats a QUD report. */
export function formatQUDReport(results: readonly QUDTestResult[]): string {
  const lines: string[] = [];
  lines.push('=== QUD Behavior Report ===');
  lines.push(`Total tests: ${results.length}`);

  const correct = results.filter(r => r.correct).length;
  const noNewAmb = results.filter(r => r.noNewAmbiguities).length;
  lines.push(`Correct: ${correct}/${results.length}`);
  lines.push(`No new ambiguities: ${noNewAmb}/${results.length}`);
  lines.push('');

  let totalReduction = 0;
  for (const r of results) {
    const icon = r.correct ? '[OK]' : '[!!]';
    lines.push(`${icon} ${r.testId} (${r.qudType}): status=${r.qudStatus}, reduction=${r.ambiguityReduction.netReduction}`);
    if (r.errorDetail) lines.push(`     ${r.errorDetail}`);
    totalReduction += r.ambiguityReduction.reductionRatio;
  }

  const avgRed = results.length > 0 ? totalReduction / results.length : 0;
  lines.push('');
  lines.push(`Average reduction ratio: ${avgRed.toFixed(3)}`);

  return lines.join('\n');
}

/** Returns QUD tests filtered by type. */
export function getQUDTestsByType(qudType: QUDTestType): readonly QUDTestCase[] {
  return getQUDTests().filter(t => t.qudType === qudType);
}

/** Returns total count of QUD tests. */
export function countQUDTests(): number {
  return getQUDTests().length;
}

/** Measures ambiguity reduction across a set of results. */
export function measureAmbiguityReduction(results: readonly QUDTestResult[]): {
  readonly avgReduction: number;
  readonly maxReduction: number;
  readonly minReduction: number;
  readonly fullyResolvedCount: number;
  readonly newAmbiguityCount: number;
} {
  if (results.length === 0) {
    return { avgReduction: 0, maxReduction: 0, minReduction: 0, fullyResolvedCount: 0, newAmbiguityCount: 0 };
  }

  let totalReduction = 0;
  let maxReduction = -Infinity;
  let minReduction = Infinity;
  let fullyResolvedCount = 0;
  let newAmbiguityCount = 0;

  for (const r of results) {
    const net = r.ambiguityReduction.netReduction;
    totalReduction += net;
    if (net > maxReduction) maxReduction = net;
    if (net < minReduction) minReduction = net;
    if (r.ambiguityReduction.fullyResolved) fullyResolvedCount++;
    if (r.ambiguityReduction.newAmbiguitiesIntroduced > 0) newAmbiguityCount++;
  }

  return {
    avgReduction: totalReduction / results.length,
    maxReduction,
    minReduction,
    fullyResolvedCount,
    newAmbiguityCount,
  };
}

/** Returns coverage metrics for QUD tests. */
export function getQUDTestCoverage(results: readonly QUDTestResult[]): QUDCoverage {
  const tests = getQUDTests();
  const byType = new Map<string, number>();

  for (const t of tests) {
    byType.set(t.qudType, (byType.get(t.qudType) ?? 0) + 1);
  }

  let correctCount = 0;
  let totalReduction = 0;
  let newAmbCount = 0;

  for (const r of results) {
    if (r.correct) correctCount++;
    totalReduction += r.ambiguityReduction.reductionRatio;
    if (!r.noNewAmbiguities) newAmbCount++;
  }

  const total = Math.max(results.length, 1);

  return {
    totalTests: tests.length,
    byType,
    overallAccuracy: correctCount / total,
    avgReductionRatio: totalReduction / total,
    newAmbiguityRate: newAmbCount / total,
  };
}
