/**
 * GOFAI Canonical User Scenarios
 *
 * Step 021 [HCI]: Write 10 canonical user scenarios spanning studio editing,
 * education, live performance, and IP-sensitive workflows.
 *
 * Each scenario defines:
 * - A user persona and context
 * - A sequence of natural language utterances
 * - Expected CPL-level intents for each utterance
 * - Expected clarification questions (if any)
 * - Expected plan summaries
 * - Expected safety checks and constraints
 * - Expected interaction loop states
 * - Acceptance criteria
 *
 * These scenarios serve as:
 * 1. Golden path tests for end-to-end validation
 * 2. Design anchors for UX decisions
 * 3. Regression baselines for parser/semantics changes
 * 4. Documentation for stakeholders
 *
 * ## Scenario Categories
 *
 * | # | Category           | Persona             | Key Features Exercised                    |
 * |---|-------------------|---------------------|-------------------------------------------|
 * | 1 | Studio editing     | Producer            | Comparatives, scope, constraints          |
 * | 2 | Studio editing     | Producer            | Multi-step coordination, anaphora         |
 * | 3 | Studio editing     | Mix engineer        | Preservation constraints, contrastive     |
 * | 4 | Education          | Music student       | Explain, inspect, why, vocabulary browse  |
 * | 5 | Education          | Composition teacher | Terminology, theory terms, undo/redo      |
 * | 6 | Live performance   | DJ/performer        | Quick edits, auto-apply, minimal UI       |
 * | 7 | Live performance   | Live coder          | Batch edits, quantification, timing       |
 * | 8 | IP-sensitive       | Film composer       | Preservation-heavy, diff inspection       |
 * | 9 | IP-sensitive       | Session musician    | Offline guarantee, scope highlighting     |
 * |10 | Cross-cutting      | Power user          | Preference profiles, defaults, overrides  |
 *
 * @module gofai/scenarios/canonical-scenarios
 */

// =============================================================================
// Scenario Types
// =============================================================================

/**
 * Unique identifier for a canonical scenario.
 */
export type ScenarioId = string & { readonly __brand: 'ScenarioId' };

/**
 * Create a ScenarioId from a string.
 */
export function scenarioId(id: string): ScenarioId {
  return id as ScenarioId;
}

/**
 * The domain category a scenario belongs to.
 */
export type ScenarioCategory =
  | 'studio_editing'
  | 'education'
  | 'live_performance'
  | 'ip_sensitive'
  | 'cross_cutting';

/**
 * The persona type using the system.
 */
export type PersonaType =
  | 'producer'
  | 'mix_engineer'
  | 'music_student'
  | 'composition_teacher'
  | 'dj_performer'
  | 'live_coder'
  | 'film_composer'
  | 'session_musician'
  | 'power_user';

/**
 * Board control level determining interaction style.
 */
export type ControlLevel =
  | 'manual'
  | 'assisted'
  | 'collaborative'
  | 'directed'
  | 'autonomous';

/**
 * Context in which the scenario takes place.
 */
export interface ScenarioContext {
  /** The persona/user type. */
  readonly persona: PersonaType;
  /** Board control level. */
  readonly controlLevel: ControlLevel;
  /** Whether the session is offline-only. */
  readonly offlineOnly: boolean;
  /** Whether IP protection is a concern. */
  readonly ipSensitive: boolean;
  /** Description of the musical project. */
  readonly projectDescription: string;
  /** Current state of the project (sections, layers, etc.). */
  readonly projectState: ScenarioProjectState;
  /** User's preference profile (for default overrides). */
  readonly preferenceProfile: string | undefined;
}

/**
 * Simplified project state for scenario descriptions.
 */
export interface ScenarioProjectState {
  /** Sections in the project. */
  readonly sections: readonly ScenarioSection[];
  /** Layers/tracks in the project. */
  readonly layers: readonly ScenarioLayer[];
  /** Tempo in BPM. */
  readonly tempo: number;
  /** Time signature (e.g., "4/4"). */
  readonly timeSignature: string;
  /** Key (e.g., "C minor"). */
  readonly key: string;
  /** Total length in bars. */
  readonly totalBars: number;
}

/**
 * A section in the scenario project state.
 */
export interface ScenarioSection {
  readonly name: string;
  readonly startBar: number;
  readonly endBar: number;
}

/**
 * A layer in the scenario project state.
 */
export interface ScenarioLayer {
  readonly name: string;
  readonly role: string;
  readonly active: boolean;
}

/**
 * A single step in a scenario's interaction sequence.
 */
export interface ScenarioStep {
  /** Step number within the scenario. */
  readonly stepNumber: number;
  /** The user's natural language input. */
  readonly userUtterance: string;
  /** Optional UI selection context (what's selected when the user speaks). */
  readonly uiSelection: ScenarioUISelection | undefined;
  /** Expected parsed intent category. */
  readonly expectedIntentCategory: ExpectedIntentCategory;
  /** Expected scope resolution. */
  readonly expectedScope: string;
  /** Expected target entities. */
  readonly expectedTargets: readonly string[];
  /** Expected constraints generated. */
  readonly expectedConstraints: readonly string[];
  /** Whether a clarification question is expected. */
  readonly expectsClarification: boolean;
  /** If clarification is expected, describe the expected question. */
  readonly expectedClarificationDescription: string | undefined;
  /** If clarification is expected, the user's response. */
  readonly clarificationResponse: string | undefined;
  /** Expected plan summary (what the plan should do). */
  readonly expectedPlanSummary: string;
  /** Expected safety checks. */
  readonly expectedSafetyChecks: readonly ExpectedSafetyCheck[];
  /** Expected interaction loop state after this step. */
  readonly expectedFinalState: ExpectedInteractionState;
  /** Whether undo should be available after this step. */
  readonly undoAvailable: boolean;
  /** Notes for test implementors. */
  readonly notes: string;
}

/**
 * Expected intent categories for scenario steps.
 */
export type ExpectedIntentCategory =
  | 'mutate_perceptual'
  | 'mutate_structural'
  | 'mutate_harmonic'
  | 'mutate_rhythmic'
  | 'mutate_melodic'
  | 'mutate_production'
  | 'add_content'
  | 'remove_content'
  | 'duplicate_content'
  | 'reorder_content'
  | 'preserve_constraint'
  | 'inspect_state'
  | 'explain_decision'
  | 'undo_action'
  | 'redo_action'
  | 'set_preference'
  | 'batch_edit'
  | 'coordinated_edit'
  | 'conditional_edit'
  | 'question';

/**
 * UI selection state during a scenario step.
 */
export interface ScenarioUISelection {
  /** Type of selection. */
  readonly type: 'section' | 'layer' | 'range' | 'card' | 'none';
  /** Human-readable description of the selection. */
  readonly description: string;
  /** Whether the selection is visible to the user. */
  readonly visible: boolean;
}

/**
 * Expected safety check for a scenario step.
 */
export interface ExpectedSafetyCheck {
  /** The safety invariant being checked. */
  readonly invariant: string;
  /** Whether the check should pass. */
  readonly shouldPass: boolean;
  /** If it should fail, what the expected remediation is. */
  readonly expectedRemediation: string | undefined;
}

/**
 * Expected interaction state after a scenario step.
 */
export type ExpectedInteractionState =
  | 'applied'
  | 'showing_plan'
  | 'showing_cpl'
  | 'clarifying'
  | 'explaining'
  | 'idle'
  | 'error';

/**
 * Full canonical scenario definition.
 */
export interface CanonicalScenario {
  /** Unique scenario ID. */
  readonly id: ScenarioId;
  /** Short title. */
  readonly title: string;
  /** Category. */
  readonly category: ScenarioCategory;
  /** Full description of the scenario and its purpose. */
  readonly description: string;
  /** What this scenario is designed to exercise/test. */
  readonly exercisedFeatures: readonly string[];
  /** Context and setup. */
  readonly context: ScenarioContext;
  /** Ordered interaction steps. */
  readonly steps: readonly ScenarioStep[];
  /** Acceptance criteria for the scenario. */
  readonly acceptanceCriteria: readonly string[];
  /** Related steps in gofai_goalA.md. */
  readonly relatedSteps: readonly string[];
}


// =============================================================================
// Scenario 1: Studio Editing — Producer — Perceptual Comparatives
// =============================================================================

export const SCENARIO_01_STUDIO_COMPARATIVES: CanonicalScenario = {
  id: scenarioId('scenario-001'),
  title: 'Make It Darker — Perceptual Editing with Comparatives',
  category: 'studio_editing',
  description:
    'A producer working on a lo-fi beat wants to darken the overall sound ' +
    'of the second verse. This scenario exercises perceptual axis mapping ' +
    '("darker"), scope resolution ("the second verse"), degree semantics ' +
    '("a lot"), and the default interpretation system ("darker" defaults ' +
    'to timbre axis unless overridden).',
  exercisedFeatures: [
    'Perceptual axis resolution (brightness → darker)',
    'Degree semantics (comparative "darker", intensifier "a lot")',
    'Section scope resolution ("the second verse")',
    'Default interpretation for vague adjectives',
    'Preview-first interaction (show plan before apply)',
    'Undo after application',
  ],
  context: {
    persona: 'producer',
    controlLevel: 'collaborative',
    offlineOnly: false,
    ipSensitive: false,
    projectDescription: 'A 3-minute lo-fi hip-hop beat with piano, drums, bass, and vinyl crackle.',
    projectState: {
      sections: [
        { name: 'Intro', startBar: 1, endBar: 8 },
        { name: 'Verse 1', startBar: 9, endBar: 24 },
        { name: 'Chorus 1', startBar: 25, endBar: 32 },
        { name: 'Verse 2', startBar: 33, endBar: 48 },
        { name: 'Chorus 2', startBar: 49, endBar: 56 },
        { name: 'Outro', startBar: 57, endBar: 64 },
      ],
      layers: [
        { name: 'Piano', role: 'harmony', active: true },
        { name: 'Drums', role: 'rhythm', active: true },
        { name: 'Bass', role: 'bass', active: true },
        { name: 'Vinyl Crackle', role: 'texture', active: true },
      ],
      tempo: 85,
      timeSignature: '4/4',
      key: 'D minor',
      totalBars: 64,
    },
    preferenceProfile: undefined,
  },
  steps: [
    {
      stepNumber: 1,
      userUtterance: 'Make the second verse darker',
      uiSelection: undefined,
      expectedIntentCategory: 'mutate_perceptual',
      expectedScope: 'Verse 2 (bars 33–48)',
      expectedTargets: ['Piano', 'Drums', 'Bass', 'Vinyl Crackle'],
      expectedConstraints: [],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary:
        'Decrease brightness axis across all layers in Verse 2 by a moderate amount ' +
        '(default step). Affects timbre parameters (filter cutoff, harmonic content).',
      expectedSafetyChecks: [
        {
          invariant: 'no_silent_ambiguity',
          shouldPass: true,
          expectedRemediation: undefined,
        },
        {
          invariant: 'executable_constraints',
          shouldPass: true,
          expectedRemediation: undefined,
        },
      ],
      expectedFinalState: 'showing_plan',
      undoAvailable: false,
      notes:
        '"Darker" resolves to the brightness axis via default interpretation. ' +
        'Scope "the second verse" resolves to Verse 2. No clarification needed ' +
        'because the default sense is unambiguous at soft severity.',
    },
    {
      stepNumber: 2,
      userUtterance: 'Actually, make it a lot darker',
      uiSelection: undefined,
      expectedIntentCategory: 'mutate_perceptual',
      expectedScope: 'Verse 2 (bars 33–48)',
      expectedTargets: ['Piano', 'Drums', 'Bass', 'Vinyl Crackle'],
      expectedConstraints: [],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary:
        'Decrease brightness axis across all layers in Verse 2 by a large amount ' +
        '(intensifier "a lot" maps to large degree step).',
      expectedSafetyChecks: [
        {
          invariant: 'no_silent_ambiguity',
          shouldPass: true,
          expectedRemediation: undefined,
        },
      ],
      expectedFinalState: 'showing_plan',
      undoAvailable: false,
      notes:
        '"Actually" signals plan replacement (discard previous plan). ' +
        '"A lot" is an intensifier mapping to large degree. Anaphoric "it" ' +
        'resolves to the same scope (Verse 2) via discourse salience.',
    },
    {
      stepNumber: 3,
      userUtterance: 'OK, apply it',
      uiSelection: undefined,
      expectedIntentCategory: 'mutate_perceptual',
      expectedScope: 'Verse 2 (bars 33–48)',
      expectedTargets: ['Piano', 'Drums', 'Bass', 'Vinyl Crackle'],
      expectedConstraints: [],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary: 'Apply the current plan (large brightness decrease in Verse 2).',
      expectedSafetyChecks: [
        {
          invariant: 'plan_matches_intent',
          shouldPass: true,
          expectedRemediation: undefined,
        },
      ],
      expectedFinalState: 'applied',
      undoAvailable: true,
      notes:
        '"Apply it" is a meta-command confirming the current plan. ' +
        'After application, undo becomes available.',
    },
    {
      stepNumber: 4,
      userUtterance: 'Undo that',
      uiSelection: undefined,
      expectedIntentCategory: 'undo_action',
      expectedScope: 'last applied edit',
      expectedTargets: [],
      expectedConstraints: [],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary: 'Revert the brightness decrease in Verse 2.',
      expectedSafetyChecks: [],
      expectedFinalState: 'applied',
      undoAvailable: false,
      notes:
        '"Undo that" reverts the last applied edit. After undo, ' +
        'redo becomes available but undo does not (only one step in history).',
    },
  ],
  acceptanceCriteria: [
    'Parser correctly identifies "darker" as a perceptual comparative on the brightness axis',
    'Scope "the second verse" resolves to Verse 2 (bars 33–48)',
    'Degree intensifier "a lot" maps to large step size',
    'Anaphoric "it" in step 2 resolves to same scope via discourse model',
    '"Actually" triggers plan replacement semantics',
    'Plan is shown before application (preview-first)',
    'Undo reverts the applied edit correctly',
    'Default interpretation for "darker" is logged and inspectable',
  ],
  relatedSteps: [
    'Step 019 (inspectable defaults)',
    'Step 043 (degree semantics)',
    'Step 042 (perceptual axes)',
    'Step 034 (preview-first UX)',
    'Step 009 (interaction loop)',
  ],
};


// =============================================================================
// Scenario 2: Studio Editing — Producer — Multi-Step Coordination
// =============================================================================

export const SCENARIO_02_STUDIO_COORDINATION: CanonicalScenario = {
  id: scenarioId('scenario-002'),
  title: 'Build a Drop — Multi-Step Coordinated Edits',
  category: 'studio_editing',
  description:
    'A producer building an EDM track wants to create a drop by coordinating ' +
    'multiple edits: removing elements, adding energy, and preserving the bass. ' +
    'This scenario exercises coordination ("X and Y"), sequencing ("then"), ' +
    'contrastive constructions ("but keep"), and anaphora across turns.',
  exercisedFeatures: [
    'Coordination parsing ("X and Y")',
    'Contrastive constructions ("but keep Y")',
    'Multi-step plan composition',
    'Anaphora across dialogue turns',
    'Preserve constraints',
    'Quantification ("all")',
  ],
  context: {
    persona: 'producer',
    controlLevel: 'collaborative',
    offlineOnly: false,
    ipSensitive: false,
    projectDescription: 'A 5-minute progressive house track with build and drop sections.',
    projectState: {
      sections: [
        { name: 'Intro', startBar: 1, endBar: 16 },
        { name: 'Build', startBar: 17, endBar: 32 },
        { name: 'Drop', startBar: 33, endBar: 64 },
        { name: 'Breakdown', startBar: 65, endBar: 80 },
        { name: 'Build 2', startBar: 81, endBar: 96 },
        { name: 'Drop 2', startBar: 97, endBar: 128 },
        { name: 'Outro', startBar: 129, endBar: 144 },
      ],
      layers: [
        { name: 'Kick', role: 'rhythm', active: true },
        { name: 'Hats', role: 'rhythm', active: true },
        { name: 'Clap', role: 'rhythm', active: true },
        { name: 'Bass', role: 'bass', active: true },
        { name: 'Lead', role: 'melody', active: true },
        { name: 'Pad', role: 'harmony', active: true },
        { name: 'Riser', role: 'texture', active: true },
        { name: 'FX', role: 'texture', active: true },
      ],
      tempo: 128,
      timeSignature: '4/4',
      key: 'F minor',
      totalBars: 144,
    },
    preferenceProfile: undefined,
  },
  steps: [
    {
      stepNumber: 1,
      userUtterance: 'In the drop, remove the pad and the riser but keep the bass',
      uiSelection: undefined,
      expectedIntentCategory: 'coordinated_edit',
      expectedScope: 'Drop (bars 33–64)',
      expectedTargets: ['Pad', 'Riser', 'Bass'],
      expectedConstraints: ['preserve Bass'],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary:
        'In Drop section: mute Pad layer, mute Riser layer. ' +
        'Preserve constraint: Bass layer remains unchanged.',
      expectedSafetyChecks: [
        {
          invariant: 'no_silent_ambiguity',
          shouldPass: true,
          expectedRemediation: undefined,
        },
        {
          invariant: 'constraint_satisfiable',
          shouldPass: true,
          expectedRemediation: undefined,
        },
      ],
      expectedFinalState: 'showing_plan',
      undoAvailable: false,
      notes:
        'Tests coordination ("X and Y"), contrastive ("but keep"), ' +
        'and explicit scope ("in the drop"). The preserve constraint on bass ' +
        'is generated from the "but keep" construction.',
    },
    {
      stepNumber: 2,
      userUtterance: 'Also make the kick punchier and add more energy to the lead',
      uiSelection: undefined,
      expectedIntentCategory: 'coordinated_edit',
      expectedScope: 'Drop (bars 33–64)',
      expectedTargets: ['Kick', 'Lead'],
      expectedConstraints: ['preserve Bass'],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary:
        'Extend current plan: increase punch/attack on Kick in Drop, ' +
        'increase energy axis on Lead in Drop. Bass preserve constraint carries forward.',
      expectedSafetyChecks: [
        {
          invariant: 'no_silent_ambiguity',
          shouldPass: true,
          expectedRemediation: undefined,
        },
      ],
      expectedFinalState: 'showing_plan',
      undoAvailable: false,
      notes:
        '"Also" is a rhetorical cue for plan extension (add to existing plan). ' +
        'Scope is inherited from discourse context (Drop). Two coordinated sub-edits.',
    },
    {
      stepNumber: 3,
      userUtterance: 'Do the same thing in the second drop',
      uiSelection: undefined,
      expectedIntentCategory: 'coordinated_edit',
      expectedScope: 'Drop 2 (bars 97–128)',
      expectedTargets: ['Pad', 'Riser', 'Bass', 'Kick', 'Lead'],
      expectedConstraints: ['preserve Bass'],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary:
        'Copy the entire plan from Drop to Drop 2: mute Pad, mute Riser, ' +
        'punch up Kick, add energy to Lead. Preserve Bass.',
      expectedSafetyChecks: [
        {
          invariant: 'plan_matches_intent',
          shouldPass: true,
          expectedRemediation: undefined,
        },
      ],
      expectedFinalState: 'showing_plan',
      undoAvailable: false,
      notes:
        '"Do the same thing" requires plan recognition — referencing the composite ' +
        'plan from the current dialogue. "The second drop" requires ordinal resolution.',
    },
  ],
  acceptanceCriteria: [
    'Parser handles coordination "X and Y" with shared scope',
    'Contrastive "but keep" generates a preserve constraint',
    '"Also" extends the existing plan rather than replacing it',
    'Scope is inherited across dialogue turns via discourse model',
    '"Do the same thing" correctly references the composite plan',
    'Ordinal "second drop" resolves to Drop 2',
    'Preserve constraint on Bass carries across plan extension',
  ],
  relatedSteps: [
    'Step 013 (semantic representation)',
    'Step 014 (discourse model)',
    'Step 037 (contrastive constructions)',
    'Step 094 (coordination semantics)',
    'Step 079 (shared plans)',
  ],
};


// =============================================================================
// Scenario 3: Studio Editing — Mix Engineer — Preservation Constraints
// =============================================================================

export const SCENARIO_03_MIX_PRESERVATION: CanonicalScenario = {
  id: scenarioId('scenario-003'),
  title: 'Tighten the Mix — Preservation-Heavy Mixing Workflow',
  category: 'studio_editing',
  description:
    'A mix engineer wants to tighten the low end across the track while ' +
    'preserving the vocal melody and the groove feel. This scenario exercises ' +
    'preservation constraints, "without" constructions, and the constraint ' +
    'satisfaction system.',
  exercisedFeatures: [
    'Preservation constraints (preserve melody, groove)',
    '"Without" constructions',
    'Constraint precedence rules',
    'Multiple simultaneous constraints',
    'Diff inspection (showing what changed and what was preserved)',
    'Quantification over sections ("across the whole track")',
  ],
  context: {
    persona: 'mix_engineer',
    controlLevel: 'assisted',
    offlineOnly: false,
    ipSensitive: false,
    projectDescription: 'An R&B/soul track being mixed for release.',
    projectState: {
      sections: [
        { name: 'Intro', startBar: 1, endBar: 8 },
        { name: 'Verse 1', startBar: 9, endBar: 24 },
        { name: 'Pre-Chorus', startBar: 25, endBar: 32 },
        { name: 'Chorus', startBar: 33, endBar: 48 },
        { name: 'Verse 2', startBar: 49, endBar: 64 },
        { name: 'Chorus 2', startBar: 65, endBar: 80 },
        { name: 'Bridge', startBar: 81, endBar: 96 },
        { name: 'Chorus 3', startBar: 97, endBar: 112 },
        { name: 'Outro', startBar: 113, endBar: 120 },
      ],
      layers: [
        { name: 'Vocals', role: 'melody', active: true },
        { name: 'Bass', role: 'bass', active: true },
        { name: 'Keys', role: 'harmony', active: true },
        { name: 'Guitar', role: 'harmony', active: true },
        { name: 'Drums', role: 'rhythm', active: true },
        { name: 'Strings', role: 'texture', active: true },
      ],
      tempo: 92,
      timeSignature: '4/4',
      key: 'Ab major',
      totalBars: 120,
    },
    preferenceProfile: undefined,
  },
  steps: [
    {
      stepNumber: 1,
      userUtterance: 'Tighten the low end across the whole track without changing the vocal melody',
      uiSelection: undefined,
      expectedIntentCategory: 'mutate_production',
      expectedScope: 'whole track (bars 1–120)',
      expectedTargets: ['Bass', 'Keys', 'Drums'],
      expectedConstraints: [
        'preserve Vocals melody exact',
        'scope: low frequency range',
      ],
      expectsClarification: true,
      expectedClarificationDescription:
        '"Tighten the low end" is ambiguous between: (a) reduce bass frequency mud, ' +
        '(b) tighten bass timing/groove, (c) reduce low-frequency content overall. ' +
        'Which interpretation?',
      clarificationResponse: 'Reduce the mud — clean up the low frequencies',
      expectedPlanSummary:
        'Apply low-frequency cleanup across all sections on Bass, Keys (low range), ' +
        'and Drums (kick). Vocal melody is preserved exactly.',
      expectedSafetyChecks: [
        {
          invariant: 'constraint_satisfiable',
          shouldPass: true,
          expectedRemediation: undefined,
        },
        {
          invariant: 'no_silent_ambiguity',
          shouldPass: true,
          expectedRemediation: undefined,
        },
      ],
      expectedFinalState: 'showing_plan',
      undoAvailable: false,
      notes:
        '"Tighten the low end" has multiple valid senses — this must trigger ' +
        'a clarification per the ambiguity policy (hard ambiguity). ' +
        '"Without changing" generates an exact preserve constraint.',
    },
    {
      stepNumber: 2,
      userUtterance: 'And keep the groove feel intact too',
      uiSelection: undefined,
      expectedIntentCategory: 'preserve_constraint',
      expectedScope: 'whole track (bars 1–120)',
      expectedTargets: ['Drums'],
      expectedConstraints: [
        'preserve Vocals melody exact',
        'preserve Drums groove recognizable',
      ],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary:
        'Add groove preservation constraint to existing plan. ' +
        'Drums timing and pattern preserved at "recognizable" level.',
      expectedSafetyChecks: [
        {
          invariant: 'constraint_satisfiable',
          shouldPass: true,
          expectedRemediation: undefined,
        },
      ],
      expectedFinalState: 'showing_plan',
      undoAvailable: false,
      notes:
        '"And" extends the plan. "Keep X intact" is a preserve construction. ' +
        '"Too" is an additive particle. "Groove feel" maps to rhythm/groove preservation.',
    },
    {
      stepNumber: 3,
      userUtterance: 'Show me the diff',
      uiSelection: undefined,
      expectedIntentCategory: 'inspect_state',
      expectedScope: 'current plan',
      expectedTargets: [],
      expectedConstraints: [],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary:
        'Display diff view showing: parameters changed (filter cutoffs, EQ bands), ' +
        'parameters preserved (vocal melody, drum pattern), affected sections.',
      expectedSafetyChecks: [],
      expectedFinalState: 'showing_plan',
      undoAvailable: false,
      notes:
        '"Show me the diff" is a meta-command for plan inspection. ' +
        'The diff should highlight both changes and preservations.',
    },
  ],
  acceptanceCriteria: [
    '"Tighten the low end" triggers hard ambiguity clarification',
    '"Without changing the vocal melody" generates exact preserve constraint',
    '"Keep the groove feel intact" generates recognizable preserve constraint',
    'Multiple preserve constraints are tracked simultaneously',
    'Diff view shows both changes and preserved elements',
    'Quantification "across the whole track" applies to all sections',
  ],
  relatedSteps: [
    'Step 012 (ambiguity policy)',
    'Step 015 (clarification contract)',
    'Step 037 (contrastive constructions)',
    'Step 078 (typed preserve targets)',
    'Step 034 (preview-first UX)',
  ],
};


// =============================================================================
// Scenario 4: Education — Music Student — Inspect and Explain
// =============================================================================

export const SCENARIO_04_EDUCATION_INSPECT: CanonicalScenario = {
  id: scenarioId('scenario-004'),
  title: 'Learning Chord Voicings — Inspect, Explain, Why',
  category: 'education',
  description:
    'A music student is learning about chord voicings and wants to use the ' +
    'system to explore how different voicings affect the sound. This scenario ' +
    'exercises the explain/inspect/why features, vocabulary browsing, and ' +
    'the educational workflow where understanding is more important than speed.',
  exercisedFeatures: [
    'Question parsing ("what chords are in...")',
    'Explain/inspect commands',
    '"Why" command for decision provenance',
    'Vocabulary browser integration',
    'Educational interaction mode (verbose explanations)',
    'Entity inspection',
  ],
  context: {
    persona: 'music_student',
    controlLevel: 'assisted',
    offlineOnly: false,
    ipSensitive: false,
    projectDescription: 'A simple 16-bar chord progression exercise in C major.',
    projectState: {
      sections: [
        { name: 'Part A', startBar: 1, endBar: 8 },
        { name: 'Part B', startBar: 9, endBar: 16 },
      ],
      layers: [
        { name: 'Piano', role: 'harmony', active: true },
        { name: 'Bass', role: 'bass', active: true },
      ],
      tempo: 120,
      timeSignature: '4/4',
      key: 'C major',
      totalBars: 16,
    },
    preferenceProfile: undefined,
  },
  steps: [
    {
      stepNumber: 1,
      userUtterance: 'What chords are in Part A?',
      uiSelection: undefined,
      expectedIntentCategory: 'question',
      expectedScope: 'Part A (bars 1–8)',
      expectedTargets: ['Piano'],
      expectedConstraints: [],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary:
        'Inspect the harmonic content of Part A and report chord names, ' +
        'voicings, and positions.',
      expectedSafetyChecks: [],
      expectedFinalState: 'explaining',
      undoAvailable: false,
      notes:
        'This is a question/inspect command, not a mutation. ' +
        'The system should analyze the Piano layer for harmonic content.',
    },
    {
      stepNumber: 2,
      userUtterance: 'Change the voicings to be more open',
      uiSelection: undefined,
      expectedIntentCategory: 'mutate_harmonic',
      expectedScope: 'Part A (bars 1–8)',
      expectedTargets: ['Piano'],
      expectedConstraints: [],
      expectsClarification: true,
      expectedClarificationDescription:
        '"More open voicings" could mean: (a) wider intervals between notes, ' +
        '(b) drop-2 or drop-3 voicings, (c) spread across more octaves. ' +
        'Which approach?',
      clarificationResponse: 'Wider intervals between notes',
      expectedPlanSummary:
        'Redistribute chord tones in Part A Piano to increase inter-note intervals ' +
        'while maintaining harmonic function.',
      expectedSafetyChecks: [
        {
          invariant: 'no_silent_ambiguity',
          shouldPass: true,
          expectedRemediation: undefined,
        },
      ],
      expectedFinalState: 'showing_plan',
      undoAvailable: false,
      notes:
        '"More open" is ambiguous for voicings — multiple valid interpretations. ' +
        'Scope is inherited from dialogue (Part A). Educational context means ' +
        'the clarification should include explanations of each option.',
    },
    {
      stepNumber: 3,
      userUtterance: 'Why did you choose those specific intervals?',
      uiSelection: undefined,
      expectedIntentCategory: 'explain_decision',
      expectedScope: 'current plan',
      expectedTargets: [],
      expectedConstraints: [],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary:
        'Explain the decision provenance: which rules were applied, what defaults ' +
        'were used, and how intervals were chosen to maintain voice-leading.',
      expectedSafetyChecks: [],
      expectedFinalState: 'explaining',
      undoAvailable: false,
      notes:
        '"Why" triggers decision provenance display. The system should trace ' +
        'back through the compilation pipeline to show which rules produced ' +
        'the current plan. Educational persona should get verbose explanations.',
    },
  ],
  acceptanceCriteria: [
    'Question "What chords are in..." maps to inspect intent',
    '"More open voicings" triggers clarification with educational explanations',
    '"Why" command shows decision provenance and rule traces',
    'Scope is correctly inherited across dialogue turns',
    'Educational persona receives more verbose explanations',
    'No mutations are applied without explicit user confirmation',
  ],
  relatedSteps: [
    'Step 119 (question grammar)',
    'Step 018 (error shapes)',
    'Step 026 (semantic provenance)',
    'Step 097 (vocabulary browser)',
    'Step 096 (binding inspector)',
  ],
};


// =============================================================================
// Scenario 5: Education — Composition Teacher — Theory Terms
// =============================================================================

export const SCENARIO_05_EDUCATION_THEORY: CanonicalScenario = {
  id: scenarioId('scenario-005'),
  title: 'Teaching Counterpoint — Theory Terminology and Undo',
  category: 'education',
  description:
    'A composition teacher is demonstrating counterpoint rules to a class. ' +
    'They want to add a countermelody, check it against voice-leading rules, ' +
    'and then undo/redo to show alternatives. This exercises theory terminology, ' +
    'the undo/redo stack, and multiple sequential edits.',
  exercisedFeatures: [
    'Music theory terminology (counterpoint, voice-leading)',
    'Undo/redo stack with multiple levels',
    'Sequential editing ("then")',
    'Domain noun resolution (countermelody, parallel fifths)',
    'Educational inspection mode',
    'Comparison between alternatives',
  ],
  context: {
    persona: 'composition_teacher',
    controlLevel: 'collaborative',
    offlineOnly: false,
    ipSensitive: false,
    projectDescription: 'A two-part counterpoint exercise in the style of Fux.',
    projectState: {
      sections: [
        { name: 'Cantus Firmus', startBar: 1, endBar: 8 },
      ],
      layers: [
        { name: 'Soprano', role: 'melody', active: true },
        { name: 'Alto', role: 'melody', active: true },
      ],
      tempo: 72,
      timeSignature: '4/4',
      key: 'C major',
      totalBars: 8,
    },
    preferenceProfile: undefined,
  },
  steps: [
    {
      stepNumber: 1,
      userUtterance: 'Add a countermelody in the alto voice following species counterpoint rules',
      uiSelection: undefined,
      expectedIntentCategory: 'add_content',
      expectedScope: 'Cantus Firmus (bars 1–8)',
      expectedTargets: ['Alto'],
      expectedConstraints: ['follow species counterpoint rules'],
      expectsClarification: true,
      expectedClarificationDescription:
        'Which species of counterpoint? (a) First species — note against note, ' +
        '(b) Second species — two notes against one, (c) Third species — four notes ' +
        'against one, (d) Fourth species — syncopated/suspended.',
      clarificationResponse: 'First species',
      expectedPlanSummary:
        'Generate a first-species countermelody in the Alto voice against the ' +
        'Soprano cantus firmus, following rules: no parallel fifths/octaves, ' +
        'contrary motion preferred, consonant intervals.',
      expectedSafetyChecks: [
        {
          invariant: 'no_silent_ambiguity',
          shouldPass: true,
          expectedRemediation: undefined,
        },
      ],
      expectedFinalState: 'showing_plan',
      undoAvailable: false,
      notes:
        '"Countermelody" and "species counterpoint" are domain nouns that must ' +
        'resolve via the domain noun inventory. The specific species is ambiguous ' +
        'and requires clarification.',
    },
    {
      stepNumber: 2,
      userUtterance: 'Apply it, then show me if there are any parallel fifths',
      uiSelection: undefined,
      expectedIntentCategory: 'coordinated_edit',
      expectedScope: 'Cantus Firmus (bars 1–8)',
      expectedTargets: ['Alto', 'Soprano'],
      expectedConstraints: [],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary:
        'Apply the countermelody, then analyze the interval sequence between ' +
        'Soprano and Alto for parallel fifth violations.',
      expectedSafetyChecks: [],
      expectedFinalState: 'explaining',
      undoAvailable: true,
      notes:
        '"Apply it, then show me" is a two-step sequence: apply + inspect. ' +
        '"Parallel fifths" is a domain-specific term that must be recognized.',
    },
    {
      stepNumber: 3,
      userUtterance: 'Undo that and try a different countermelody',
      uiSelection: undefined,
      expectedIntentCategory: 'undo_action',
      expectedScope: 'last applied edit',
      expectedTargets: ['Alto'],
      expectedConstraints: ['follow species counterpoint rules', 'different from previous'],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary:
        'Undo the countermelody, then generate an alternative first-species ' +
        'countermelody with different melodic choices.',
      expectedSafetyChecks: [],
      expectedFinalState: 'showing_plan',
      undoAvailable: false,
      notes:
        '"Undo that and try" is undo + new generation. "Different" implies ' +
        'the system should avoid the previously generated melody. This requires ' +
        'tracking the undo history for comparison.',
    },
  ],
  acceptanceCriteria: [
    'Domain nouns "countermelody", "species counterpoint", "parallel fifths" are recognized',
    'Species type clarification is triggered correctly',
    '"Apply it, then show me" is parsed as a two-step sequence',
    'Undo reverts the countermelody addition',
    '"Try a different" implies novelty constraint relative to undo history',
    'Educational persona gets theory-appropriate explanations',
  ],
  relatedSteps: [
    'Step 076 (domain noun inventory)',
    'Step 077 (musical object ontology)',
    'Step 094 (coordination/sequencing)',
    'Step 095 (instead/rather than)',
    'Step 009 (interaction loop)',
  ],
};


// =============================================================================
// Scenario 6: Live Performance — DJ/Performer — Quick Edits
// =============================================================================

export const SCENARIO_06_LIVE_QUICK: CanonicalScenario = {
  id: scenarioId('scenario-006'),
  title: 'Live Set Adjustment — Quick Auto-Apply Edits',
  category: 'live_performance',
  description:
    'A DJ performing live needs to make quick adjustments during a set. ' +
    'The interaction mode is "streamlined" (auto-apply for safe edits, ' +
    'minimal confirmations). This exercises the auto-apply safety gate, ' +
    'time-pressured editing, and minimal UI affordances.',
  exercisedFeatures: [
    'Streamlined interaction mode (auto-apply)',
    'Safety gate for auto-apply decisions',
    'Quick perceptual edits (energy, brightness)',
    'Implicit scope (current playing section)',
    'Minimal clarification (prefer defaults in live context)',
    'Time-sensitive execution',
  ],
  context: {
    persona: 'dj_performer',
    controlLevel: 'directed',
    offlineOnly: false,
    ipSensitive: false,
    projectDescription: 'A live DJ set mixing house and techno, currently in the middle of a track.',
    projectState: {
      sections: [
        { name: 'Intro', startBar: 1, endBar: 16 },
        { name: 'Main', startBar: 17, endBar: 64 },
        { name: 'Breakdown', startBar: 65, endBar: 80 },
        { name: 'Drop', startBar: 81, endBar: 112 },
        { name: 'Outro', startBar: 113, endBar: 128 },
      ],
      layers: [
        { name: 'Kick', role: 'rhythm', active: true },
        { name: 'Hats', role: 'rhythm', active: true },
        { name: 'Bass', role: 'bass', active: true },
        { name: 'Synth', role: 'melody', active: true },
        { name: 'FX', role: 'texture', active: true },
      ],
      tempo: 130,
      timeSignature: '4/4',
      key: 'G minor',
      totalBars: 128,
    },
    preferenceProfile: undefined,
  },
  steps: [
    {
      stepNumber: 1,
      userUtterance: 'More energy',
      uiSelection: { type: 'section', description: 'Drop (currently playing)', visible: true },
      expectedIntentCategory: 'mutate_perceptual',
      expectedScope: 'Drop (bars 81–112, currently playing)',
      expectedTargets: ['Kick', 'Hats', 'Bass', 'Synth', 'FX'],
      expectedConstraints: [],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary:
        'Increase energy axis across all layers in the currently playing section ' +
        '(Drop). Auto-applied because this is a safe, reversible perceptual edit.',
      expectedSafetyChecks: [
        {
          invariant: 'auto_apply_safe',
          shouldPass: true,
          expectedRemediation: undefined,
        },
      ],
      expectedFinalState: 'applied',
      undoAvailable: true,
      notes:
        'In streamlined/live mode, "more energy" is auto-applied without preview. ' +
        'Scope is implicit: the currently playing section. Safety gate passes because ' +
        'perceptual axis changes are reversible and non-destructive.',
    },
    {
      stepNumber: 2,
      userUtterance: 'Kill the hats',
      uiSelection: { type: 'section', description: 'Drop (currently playing)', visible: true },
      expectedIntentCategory: 'remove_content',
      expectedScope: 'Drop (bars 81–112)',
      expectedTargets: ['Hats'],
      expectedConstraints: [],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary:
        'Mute the Hats layer in the Drop section. Auto-applied.',
      expectedSafetyChecks: [
        {
          invariant: 'auto_apply_safe',
          shouldPass: true,
          expectedRemediation: undefined,
        },
      ],
      expectedFinalState: 'applied',
      undoAvailable: true,
      notes:
        '"Kill" is DJ parlance for mute. This is a safe, reversible operation ' +
        'and can be auto-applied in streamlined mode.',
    },
    {
      stepNumber: 3,
      userUtterance: 'Bring them back after the breakdown',
      uiSelection: undefined,
      expectedIntentCategory: 'add_content',
      expectedScope: 'Drop (bars 81–112, after Breakdown)',
      expectedTargets: ['Hats'],
      expectedConstraints: [],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary:
        'Unmute Hats layer starting from bar 81 (after Breakdown ends). Auto-applied.',
      expectedSafetyChecks: [
        {
          invariant: 'auto_apply_safe',
          shouldPass: true,
          expectedRemediation: undefined,
        },
      ],
      expectedFinalState: 'applied',
      undoAvailable: true,
      notes:
        '"Them" is anaphoric reference to Hats (most recently mentioned layer). ' +
        '"After the breakdown" is a temporal expression requiring section boundary resolution.',
    },
  ],
  acceptanceCriteria: [
    'Streamlined mode auto-applies safe perceptual edits without preview',
    'Implicit scope resolves to currently playing section',
    '"Kill" is recognized as DJ terminology for mute',
    'Anaphoric "them" resolves to recently mentioned Hats layer',
    '"After the breakdown" resolves to correct bar range',
    'All auto-applied edits have undo available',
    'Safety gate blocks auto-apply for destructive operations',
  ],
  relatedSteps: [
    'Step 009 (interaction loop, auto-apply mode)',
    'Step 034 (preview-first UX, exceptions for live)',
    'Step 036 (deictic resolution)',
    'Step 092 (temporal adverbs)',
    'Step 093 (demonstratives)',
  ],
};


// =============================================================================
// Scenario 7: Live Performance — Live Coder — Batch Edits
// =============================================================================

export const SCENARIO_07_LIVE_BATCH: CanonicalScenario = {
  id: scenarioId('scenario-007'),
  title: 'Pattern Variations — Batch Quantified Edits',
  category: 'live_performance',
  description:
    'A live coder wants to apply pattern variations across multiple sections ' +
    'simultaneously, using quantified expressions and batch operations. ' +
    'This exercises quantification, batch editing, and the event selector system.',
  exercisedFeatures: [
    'Universal quantification ("every", "all")',
    'Distributive quantification ("every other")',
    'Batch edit composition',
    'Event-level selectors ("the downbeats")',
    'Pattern-based editing',
    'Conditional edits ("if possible")',
  ],
  context: {
    persona: 'live_coder',
    controlLevel: 'directed',
    offlineOnly: false,
    ipSensitive: false,
    projectDescription: 'A generative ambient piece with evolving patterns.',
    projectState: {
      sections: [
        { name: 'Section A', startBar: 1, endBar: 16 },
        { name: 'Section B', startBar: 17, endBar: 32 },
        { name: 'Section C', startBar: 33, endBar: 48 },
        { name: 'Section D', startBar: 49, endBar: 64 },
      ],
      layers: [
        { name: 'Sequence 1', role: 'melody', active: true },
        { name: 'Sequence 2', role: 'harmony', active: true },
        { name: 'Percussion', role: 'rhythm', active: true },
        { name: 'Drone', role: 'texture', active: true },
      ],
      tempo: 110,
      timeSignature: '4/4',
      key: 'E minor',
      totalBars: 64,
    },
    preferenceProfile: undefined,
  },
  steps: [
    {
      stepNumber: 1,
      userUtterance: 'In every section, shift the sequence up by a third',
      uiSelection: undefined,
      expectedIntentCategory: 'batch_edit',
      expectedScope: 'all sections (A, B, C, D)',
      expectedTargets: ['Sequence 1'],
      expectedConstraints: [],
      expectsClarification: true,
      expectedClarificationDescription:
        '"A third" is ambiguous: (a) major third (4 semitones), ' +
        '(b) minor third (3 semitones), (c) diatonic third (scale-dependent). ' +
        'Also: "the sequence" — which sequence? Sequence 1 or Sequence 2?',
      clarificationResponse: 'Diatonic third, Sequence 1',
      expectedPlanSummary:
        'Transpose Sequence 1 up by a diatonic third in each section ' +
        '(A, B, C, D). Pitch adjustments follow E minor scale.',
      expectedSafetyChecks: [
        {
          invariant: 'no_silent_ambiguity',
          shouldPass: true,
          expectedRemediation: undefined,
        },
      ],
      expectedFinalState: 'showing_plan',
      undoAvailable: false,
      notes:
        'Universal quantifier "every" distributes the edit across all sections. ' +
        '"A third" is ambiguous (major/minor/diatonic) — requires clarification. ' +
        '"The sequence" is referentially ambiguous between two layers.',
    },
    {
      stepNumber: 2,
      userUtterance: 'Accent every other downbeat in the percussion across all sections',
      uiSelection: undefined,
      expectedIntentCategory: 'batch_edit',
      expectedScope: 'all sections (A, B, C, D)',
      expectedTargets: ['Percussion'],
      expectedConstraints: [],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary:
        'Select downbeat events in Percussion across all sections, then accent ' +
        'every other one (1, 3, 5, ...) by increasing velocity.',
      expectedSafetyChecks: [
        {
          invariant: 'no_silent_ambiguity',
          shouldPass: true,
          expectedRemediation: undefined,
        },
      ],
      expectedFinalState: 'showing_plan',
      undoAvailable: false,
      notes:
        '"Every other" is a distributive quantifier. "Downbeat" is an event-level ' +
        'selector. "Across all sections" is explicit universal scope.',
    },
    {
      stepNumber: 3,
      userUtterance: 'If possible, add a subtle delay to Sequence 2 without affecting the drone',
      uiSelection: undefined,
      expectedIntentCategory: 'conditional_edit',
      expectedScope: 'all sections',
      expectedTargets: ['Sequence 2'],
      expectedConstraints: ['preserve Drone', 'soft constraint (if possible)'],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary:
        'Add a delay effect to Sequence 2 with subtle parameters (low mix, ' +
        'short time). Marked as soft constraint — system will attempt but ' +
        'report if not feasible. Drone layer is preserved.',
      expectedSafetyChecks: [
        {
          invariant: 'constraint_satisfiable',
          shouldPass: true,
          expectedRemediation: undefined,
        },
      ],
      expectedFinalState: 'showing_plan',
      undoAvailable: false,
      notes:
        '"If possible" generates a soft/optional constraint (modality). ' +
        '"Subtle" maps to small degree. "Without affecting" is a preserve constraint.',
    },
  ],
  acceptanceCriteria: [
    'Universal quantifier "every" distributes edit across all sections',
    'Distributive "every other" selects alternating events',
    '"Downbeat" is recognized as an event-level selector',
    'Interval ambiguity ("a third") triggers clarification',
    'Referential ambiguity ("the sequence") triggers clarification',
    '"If possible" generates soft constraint',
    '"Without affecting" generates preserve constraint',
    'Batch edits compose correctly across sections',
  ],
  relatedSteps: [
    'Step 117 (quantification grammar)',
    'Step 074 (event-level references)',
    'Step 118 (modality grammar)',
    'Step 055 (event selectors)',
    'Step 037 (contrastive constructions)',
  ],
};


// =============================================================================
// Scenario 8: IP-Sensitive — Film Composer — Preservation Heavy
// =============================================================================

export const SCENARIO_08_IP_PRESERVATION: CanonicalScenario = {
  id: scenarioId('scenario-008'),
  title: 'Film Score Revision — IP-Sensitive Preservation Workflow',
  category: 'ip_sensitive',
  description:
    'A film composer is revising a score for a scene change. The director wants ' +
    'the music "more tense" but the composer must preserve the licensed melody ' +
    'and maintain sync points. Every change must be inspectable and diffable. ' +
    'This exercises IP sensitivity, strict preservation, sync constraints, and ' +
    'exhaustive diff inspection.',
  exercisedFeatures: [
    'IP-sensitive workflow (strict preservation)',
    'Sync point constraints (timing must match)',
    'Perceptual axis editing (tension)',
    'Multiple layered constraints',
    'Diff inspection with before/after comparison',
    'Scope highlighting for affected regions',
    'Exhaustive safety checking',
  ],
  context: {
    persona: 'film_composer',
    controlLevel: 'assisted',
    offlineOnly: true,
    ipSensitive: true,
    projectDescription:
      'A film score for a thriller scene. The main theme melody is licensed ' +
      'from a third party and must not be altered.',
    projectState: {
      sections: [
        { name: 'Establishing', startBar: 1, endBar: 8 },
        { name: 'Tension Build', startBar: 9, endBar: 24 },
        { name: 'Reveal', startBar: 25, endBar: 32 },
        { name: 'Chase', startBar: 33, endBar: 56 },
        { name: 'Resolution', startBar: 57, endBar: 64 },
      ],
      layers: [
        { name: 'Strings', role: 'harmony', active: true },
        { name: 'Theme Melody', role: 'melody', active: true },
        { name: 'Percussion', role: 'rhythm', active: true },
        { name: 'Low Brass', role: 'bass', active: true },
        { name: 'Woodwinds', role: 'texture', active: true },
      ],
      tempo: 108,
      timeSignature: '4/4',
      key: 'D minor',
      totalBars: 64,
    },
    preferenceProfile: undefined,
  },
  steps: [
    {
      stepNumber: 1,
      userUtterance: 'Make the tension build more intense without touching the theme melody',
      uiSelection: undefined,
      expectedIntentCategory: 'mutate_perceptual',
      expectedScope: 'Tension Build (bars 9–24)',
      expectedTargets: ['Strings', 'Percussion', 'Low Brass', 'Woodwinds'],
      expectedConstraints: [
        'preserve Theme Melody exact',
        'maintain sync points',
      ],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary:
        'Increase tension axis across Strings, Percussion, Low Brass, and Woodwinds ' +
        'in the Tension Build section. Theme Melody layer is locked (exact preservation). ' +
        'Sync points at scene cuts are maintained.',
      expectedSafetyChecks: [
        {
          invariant: 'no_silent_ambiguity',
          shouldPass: true,
          expectedRemediation: undefined,
        },
        {
          invariant: 'ip_preservation_check',
          shouldPass: true,
          expectedRemediation: undefined,
        },
        {
          invariant: 'sync_point_integrity',
          shouldPass: true,
          expectedRemediation: undefined,
        },
        {
          invariant: 'constraint_satisfiable',
          shouldPass: true,
          expectedRemediation: undefined,
        },
      ],
      expectedFinalState: 'showing_plan',
      undoAvailable: false,
      notes:
        'IP-sensitive context means: (1) exact preservation enforced for licensed content, ' +
        '(2) all changes must be diffable, (3) extra safety checks for sync points, ' +
        '(4) verbose plan display showing exactly what will change.',
    },
    {
      stepNumber: 2,
      userUtterance: 'Show me exactly what will change, note by note',
      uiSelection: undefined,
      expectedIntentCategory: 'inspect_state',
      expectedScope: 'current plan',
      expectedTargets: [],
      expectedConstraints: [],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary:
        'Display granular diff: for each affected layer and bar, show ' +
        'before/after parameter values. Highlight that Theme Melody is unchanged. ' +
        'Show sync point alignment is maintained.',
      expectedSafetyChecks: [],
      expectedFinalState: 'showing_plan',
      undoAvailable: false,
      notes:
        '"Exactly" and "note by note" indicate the user wants maximum detail. ' +
        'In IP-sensitive context, this level of granularity is always available.',
    },
    {
      stepNumber: 3,
      userUtterance: 'Also extend the crescendo in the strings by four bars',
      uiSelection: undefined,
      expectedIntentCategory: 'mutate_structural',
      expectedScope: 'Tension Build (bars 9–24) → extending to bar 28',
      expectedTargets: ['Strings'],
      expectedConstraints: [
        'preserve Theme Melody exact',
        'maintain sync points',
      ],
      expectsClarification: true,
      expectedClarificationDescription:
        'Extending the crescendo by four bars would push into the Reveal section ' +
        '(bars 25–32). This may affect sync points at the scene cut at bar 25. ' +
        'Options: (a) extend within Tension Build only (add 4 bars), ' +
        '(b) overlap into Reveal (keep bar count, extend dynamics), ' +
        '(c) cancel.',
      clarificationResponse: 'Overlap into Reveal',
      expectedPlanSummary:
        'Extend the strings crescendo from the Tension Build into the first 4 bars ' +
        'of the Reveal section, overlapping the dynamics. Sync points verified.',
      expectedSafetyChecks: [
        {
          invariant: 'sync_point_integrity',
          shouldPass: true,
          expectedRemediation: undefined,
        },
        {
          invariant: 'ip_preservation_check',
          shouldPass: true,
          expectedRemediation: undefined,
        },
      ],
      expectedFinalState: 'showing_plan',
      undoAvailable: false,
      notes:
        'Extending a crescendo across section boundaries creates a structural ' +
        'conflict that must be clarified. The sync point check ensures the ' +
        'scene cut timing is preserved. IP check verifies no licensed content is affected.',
    },
  ],
  acceptanceCriteria: [
    '"Without touching the theme melody" generates exact preserve constraint',
    'IP-sensitive context adds extra safety checks (ip_preservation_check)',
    'Sync point integrity is verified for structural changes',
    'Detailed diff shows per-layer, per-bar changes with before/after values',
    'Cross-section extension triggers clarification about sync points',
    'All edits are fully reversible with undo',
    'Offline-only constraint is respected (no external API calls)',
  ],
  relatedSteps: [
    'Step 005 (trust primitives)',
    'Step 034 (preview-first UX)',
    'Step 078 (typed preserve targets)',
    'Step 037 (contrastive constructions)',
    'Step 084 (focus stack UI)',
  ],
};


// =============================================================================
// Scenario 9: IP-Sensitive — Session Musician — Offline Guarantee
// =============================================================================

export const SCENARIO_09_IP_OFFLINE: CanonicalScenario = {
  id: scenarioId('scenario-009'),
  title: 'Session Recording — Offline Deterministic Editing',
  category: 'ip_sensitive',
  description:
    'A session musician is editing a recording at a studio with strict IP policies ' +
    '(no internet, no cloud). All processing must be local and deterministic. ' +
    'This exercises the offline guarantee, scope highlighting for the current ' +
    'selection, and the session musician workflow (quick, precise edits).',
  exercisedFeatures: [
    'Offline-only processing guarantee',
    'Deterministic behavior (same input → same output)',
    'Scope highlighting in UI',
    'Deictic reference ("this", "here")',
    'Precise numeric edits alongside vague edits',
    'Selection-based scope resolution',
  ],
  context: {
    persona: 'session_musician',
    controlLevel: 'assisted',
    offlineOnly: true,
    ipSensitive: true,
    projectDescription:
      'A recording session for a pop single. All audio is under NDA.',
    projectState: {
      sections: [
        { name: 'Verse 1', startBar: 1, endBar: 16 },
        { name: 'Chorus', startBar: 17, endBar: 32 },
        { name: 'Verse 2', startBar: 33, endBar: 48 },
        { name: 'Chorus 2', startBar: 49, endBar: 64 },
        { name: 'Bridge', startBar: 65, endBar: 72 },
        { name: 'Final Chorus', startBar: 73, endBar: 88 },
      ],
      layers: [
        { name: 'Lead Vocal', role: 'melody', active: true },
        { name: 'Backing Vocals', role: 'harmony', active: true },
        { name: 'Acoustic Guitar', role: 'harmony', active: true },
        { name: 'Electric Guitar', role: 'melody', active: true },
        { name: 'Bass', role: 'bass', active: true },
        { name: 'Drums', role: 'rhythm', active: true },
        { name: 'Keys', role: 'harmony', active: true },
      ],
      tempo: 118,
      timeSignature: '4/4',
      key: 'G major',
      totalBars: 88,
    },
    preferenceProfile: undefined,
  },
  steps: [
    {
      stepNumber: 1,
      userUtterance: 'Transpose this up by 2 semitones',
      uiSelection: {
        type: 'section',
        description: 'Chorus (bars 17–32) is selected in the UI',
        visible: true,
      },
      expectedIntentCategory: 'mutate_melodic',
      expectedScope: 'Chorus (bars 17–32, from UI selection)',
      expectedTargets: ['Lead Vocal', 'Backing Vocals', 'Acoustic Guitar', 'Electric Guitar', 'Bass', 'Keys'],
      expectedConstraints: [],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary:
        'Transpose all pitched layers in the selected Chorus section up by ' +
        '2 semitones. Drums excluded (non-pitched). Deterministic processing.',
      expectedSafetyChecks: [
        {
          invariant: 'offline_processing',
          shouldPass: true,
          expectedRemediation: undefined,
        },
        {
          invariant: 'deterministic_output',
          shouldPass: true,
          expectedRemediation: undefined,
        },
      ],
      expectedFinalState: 'showing_plan',
      undoAvailable: false,
      notes:
        '"This" is a deictic reference requiring a UI selection context. ' +
        'The selection provides the scope. "2 semitones" is an exact numeric ' +
        'value — no ambiguity. Drums are automatically excluded from transposition ' +
        'because they are non-pitched.',
    },
    {
      stepNumber: 2,
      userUtterance: 'Make the guitar part here a bit brighter',
      uiSelection: {
        type: 'range',
        description: 'Bars 20–24 selected in Electric Guitar layer',
        visible: true,
      },
      expectedIntentCategory: 'mutate_perceptual',
      expectedScope: 'bars 20–24, Electric Guitar (from UI selection)',
      expectedTargets: ['Electric Guitar'],
      expectedConstraints: [],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary:
        'Increase brightness axis on Electric Guitar in bars 20–24 by a small ' +
        'amount ("a bit" → small degree step). Deterministic processing.',
      expectedSafetyChecks: [
        {
          invariant: 'offline_processing',
          shouldPass: true,
          expectedRemediation: undefined,
        },
        {
          invariant: 'deterministic_output',
          shouldPass: true,
          expectedRemediation: undefined,
        },
      ],
      expectedFinalState: 'showing_plan',
      undoAvailable: false,
      notes:
        '"Here" is a deictic reference to the current selection (bars 20–24 in ' +
        'Electric Guitar). "The guitar part" could be ambiguous between Acoustic ' +
        'and Electric, but the UI selection disambiguates to Electric Guitar. ' +
        '"A bit" maps to small degree.',
    },
    {
      stepNumber: 3,
      userUtterance: 'Highlight what scope that would affect',
      uiSelection: undefined,
      expectedIntentCategory: 'inspect_state',
      expectedScope: 'current plan scope',
      expectedTargets: [],
      expectedConstraints: [],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary:
        'Activate scope highlighting in the UI: highlight bars 20–24 in the ' +
        'Electric Guitar layer to show the affected region.',
      expectedSafetyChecks: [],
      expectedFinalState: 'showing_plan',
      undoAvailable: false,
      notes:
        '"Highlight what scope" triggers scope highlighting — one of the trust ' +
        'primitives. This is an inspection command, not a mutation.',
    },
  ],
  acceptanceCriteria: [
    'Deictic "this" resolves to UI selection (Chorus section)',
    'Deictic "here" resolves to UI selection (bars 20–24 in Electric Guitar)',
    'UI selection disambiguates between Acoustic and Electric Guitar',
    'Exact numeric "2 semitones" requires no clarification',
    'Vague "a bit brighter" uses default interpretation',
    'Offline processing guarantee is enforced (no network calls)',
    'Deterministic output guarantee is enforced',
    'Scope highlighting is available as a trust primitive',
  ],
  relatedSteps: [
    'Step 036 (deictic resolution)',
    'Step 005 (trust primitives, scope highlighting)',
    'Step 019 (inspectable defaults)',
    'Step 043 (degree semantics)',
    'Step 001 (product contract, offline)',
  ],
};


// =============================================================================
// Scenario 10: Cross-Cutting — Power User — Preferences and Defaults
// =============================================================================

export const SCENARIO_10_POWER_PREFERENCES: CanonicalScenario = {
  id: scenarioId('scenario-010'),
  title: 'Custom Defaults — Preference Profiles and Overrides',
  category: 'cross_cutting',
  description:
    'A power user wants to customize how vague terms are interpreted. They ' +
    'want "darker" to mean harmonic darkening (not timbre), and "a lot" to be ' +
    'less aggressive than the default. This exercises the preference profile ' +
    'system, default overrides, and inspectable defaults.',
  exercisedFeatures: [
    'User preference profiles',
    'Default interpretation overrides',
    'Inspectable defaults ("show me what darker means")',
    'Profile switching',
    'Override persistence',
    'Interaction with degree semantics',
  ],
  context: {
    persona: 'power_user',
    controlLevel: 'collaborative',
    offlineOnly: false,
    ipSensitive: false,
    projectDescription: 'A jazz fusion piece with complex harmony.',
    projectState: {
      sections: [
        { name: 'Head', startBar: 1, endBar: 16 },
        { name: 'Solo 1', startBar: 17, endBar: 48 },
        { name: 'Solo 2', startBar: 49, endBar: 80 },
        { name: 'Head Out', startBar: 81, endBar: 96 },
      ],
      layers: [
        { name: 'Piano', role: 'harmony', active: true },
        { name: 'Bass', role: 'bass', active: true },
        { name: 'Drums', role: 'rhythm', active: true },
        { name: 'Sax', role: 'melody', active: true },
      ],
      tempo: 160,
      timeSignature: '4/4',
      key: 'Bb major',
      totalBars: 96,
    },
    preferenceProfile: 'jazz-harmony-focus',
  },
  steps: [
    {
      stepNumber: 1,
      userUtterance: 'What does "darker" mean right now?',
      uiSelection: undefined,
      expectedIntentCategory: 'inspect_state',
      expectedScope: 'default interpretation registry',
      expectedTargets: [],
      expectedConstraints: [],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary:
        'Display the current default interpretation for "darker": ' +
        'maps to brightness axis (timbre), moderate decrease step. ' +
        'Show that this is user-overridable.',
      expectedSafetyChecks: [],
      expectedFinalState: 'explaining',
      undoAvailable: false,
      notes:
        'Meta-question about the system\'s default interpretation. ' +
        'The system should show the current mapping, its provenance, ' +
        'and that it can be overridden.',
    },
    {
      stepNumber: 2,
      userUtterance: 'Change "darker" to mean more minor-key harmony instead of timbre',
      uiSelection: undefined,
      expectedIntentCategory: 'set_preference',
      expectedScope: 'user preference profile',
      expectedTargets: [],
      expectedConstraints: [],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary:
        'Update user preference profile: override "darker" default from ' +
        'brightness axis (timbre) to harmonic darkness (minor-key tendency). ' +
        'This affects future interpretations of "darker" in this profile.',
      expectedSafetyChecks: [
        {
          invariant: 'preference_valid',
          shouldPass: true,
          expectedRemediation: undefined,
        },
      ],
      expectedFinalState: 'applied',
      undoAvailable: true,
      notes:
        'Preference override: "darker" now maps to harmonic axis instead of ' +
        'brightness/timbre axis. This is stored in the user profile and affects ' +
        'all future compilations. Undo should revert to the previous default.',
    },
    {
      stepNumber: 3,
      userUtterance: 'Now make the head darker',
      uiSelection: undefined,
      expectedIntentCategory: 'mutate_harmonic',
      expectedScope: 'Head (bars 1–16)',
      expectedTargets: ['Piano', 'Bass', 'Sax'],
      expectedConstraints: [],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary:
        'Apply harmonic darkening to Head section: shift chord voicings toward ' +
        'minor-key tendency (using overridden "darker" interpretation). ' +
        'Affects Piano, Bass, and Sax (harmonic layers).',
      expectedSafetyChecks: [
        {
          invariant: 'no_silent_ambiguity',
          shouldPass: true,
          expectedRemediation: undefined,
        },
        {
          invariant: 'applied_default_logged',
          shouldPass: true,
          expectedRemediation: undefined,
        },
      ],
      expectedFinalState: 'showing_plan',
      undoAvailable: false,
      notes:
        '"Darker" now uses the overridden interpretation (harmonic, not timbre). ' +
        'The applied default must be logged so the user can trace why ' +
        '"darker" mapped to harmonic darkening. The "now" temporal adverb ' +
        'reinforces that this is a current action, not a preference change.',
    },
    {
      stepNumber: 4,
      userUtterance: 'Also, set "a lot" to mean only a moderate change for me',
      uiSelection: undefined,
      expectedIntentCategory: 'set_preference',
      expectedScope: 'user preference profile',
      expectedTargets: [],
      expectedConstraints: [],
      expectsClarification: false,
      expectedClarificationDescription: undefined,
      clarificationResponse: undefined,
      expectedPlanSummary:
        'Update user preference profile: override degree intensifier "a lot" ' +
        'from large step to moderate step. Future uses of "a lot" will produce ' +
        'smaller changes than the system default.',
      expectedSafetyChecks: [
        {
          invariant: 'preference_valid',
          shouldPass: true,
          expectedRemediation: undefined,
        },
      ],
      expectedFinalState: 'applied',
      undoAvailable: true,
      notes:
        'Degree intensifier override: "a lot" is remapped from large to moderate. ' +
        'This interacts with degree semantics (Step 043) and the default ' +
        'interpretation registry (Step 019).',
    },
  ],
  acceptanceCriteria: [
    'System can display current default interpretation for vague terms',
    'User can override default sense mapping ("darker" → harmonic)',
    'Overridden interpretation is used in subsequent compilations',
    'Applied defaults are logged with provenance',
    'User can override degree intensifier mappings',
    'Preference changes are undoable',
    'Profile changes persist across dialogue turns',
    'Inspecting defaults shows both system default and user override',
  ],
  relatedSteps: [
    'Step 019 (inspectable defaults)',
    'Step 049 (user preference profiles)',
    'Step 043 (degree semantics)',
    'Step 026 (semantic provenance)',
    'Step 042 (perceptual axes)',
  ],
};


// =============================================================================
// Scenario Registry
// =============================================================================

/**
 * All 10 canonical scenarios in order.
 */
export const ALL_CANONICAL_SCENARIOS: readonly CanonicalScenario[] = [
  SCENARIO_01_STUDIO_COMPARATIVES,
  SCENARIO_02_STUDIO_COORDINATION,
  SCENARIO_03_MIX_PRESERVATION,
  SCENARIO_04_EDUCATION_INSPECT,
  SCENARIO_05_EDUCATION_THEORY,
  SCENARIO_06_LIVE_QUICK,
  SCENARIO_07_LIVE_BATCH,
  SCENARIO_08_IP_PRESERVATION,
  SCENARIO_09_IP_OFFLINE,
  SCENARIO_10_POWER_PREFERENCES,
] as const;

/**
 * Look up a scenario by ID.
 */
export function getScenarioById(id: ScenarioId): CanonicalScenario | undefined {
  return ALL_CANONICAL_SCENARIOS.find(s => s.id === id);
}

/**
 * Get all scenarios in a given category.
 */
export function getScenariosByCategory(category: ScenarioCategory): readonly CanonicalScenario[] {
  return ALL_CANONICAL_SCENARIOS.filter(s => s.category === category);
}

/**
 * Get all scenarios for a given persona type.
 */
export function getScenariosByPersona(persona: PersonaType): readonly CanonicalScenario[] {
  return ALL_CANONICAL_SCENARIOS.filter(s => s.context.persona === persona);
}

/**
 * Get all scenarios that exercise a given feature (substring match).
 */
export function getScenariosExercising(feature: string): readonly CanonicalScenario[] {
  const lower = feature.toLowerCase();
  return ALL_CANONICAL_SCENARIOS.filter(s =>
    s.exercisedFeatures.some(f => f.toLowerCase().includes(lower))
  );
}

/**
 * Get the total number of interaction steps across all scenarios.
 */
export function getTotalStepCount(): number {
  return ALL_CANONICAL_SCENARIOS.reduce((sum, s) => sum + s.steps.length, 0);
}

/**
 * Get a summary of scenario coverage by category.
 */
export function getScenarioCoverageSummary(): Record<ScenarioCategory, number> {
  const coverage: Record<ScenarioCategory, number> = {
    studio_editing: 0,
    education: 0,
    live_performance: 0,
    ip_sensitive: 0,
    cross_cutting: 0,
  };
  for (const scenario of ALL_CANONICAL_SCENARIOS) {
    coverage[scenario.category]++;
  }
  return coverage;
}

/**
 * Get all unique features exercised across all scenarios.
 */
export function getAllExercisedFeatures(): readonly string[] {
  const features = new Set<string>();
  for (const scenario of ALL_CANONICAL_SCENARIOS) {
    for (const feature of scenario.exercisedFeatures) {
      features.add(feature);
    }
  }
  return [...features].sort();
}

/**
 * Validate that all scenarios have the expected structure.
 * Returns an array of validation errors (empty if valid).
 */
export function validateScenarios(): readonly string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const scenario of ALL_CANONICAL_SCENARIOS) {
    // Check unique IDs
    if (ids.has(scenario.id)) {
      errors.push(`Duplicate scenario ID: ${scenario.id}`);
    }
    ids.add(scenario.id);

    // Check non-empty steps
    if (scenario.steps.length === 0) {
      errors.push(`Scenario ${scenario.id} has no steps`);
    }

    // Check step numbering
    for (let i = 0; i < scenario.steps.length; i++) {
      const step = scenario.steps[i]!;
      if (step.stepNumber !== i + 1) {
        errors.push(
          `Scenario ${scenario.id} step ${i} has stepNumber ${step.stepNumber}, expected ${i + 1}`
        );
      }

      // Check clarification consistency
      if (step.expectsClarification && !step.expectedClarificationDescription) {
        errors.push(
          `Scenario ${scenario.id} step ${step.stepNumber} expects clarification but has no description`
        );
      }
      if (step.expectsClarification && !step.clarificationResponse) {
        errors.push(
          `Scenario ${scenario.id} step ${step.stepNumber} expects clarification but has no response`
        );
      }
    }

    // Check non-empty acceptance criteria
    if (scenario.acceptanceCriteria.length === 0) {
      errors.push(`Scenario ${scenario.id} has no acceptance criteria`);
    }

    // Check related steps
    if (scenario.relatedSteps.length === 0) {
      errors.push(`Scenario ${scenario.id} has no related steps`);
    }
  }

  return errors;
}
