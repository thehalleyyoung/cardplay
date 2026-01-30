/**
 * GOFAI Eval Seed Dataset — 200 English Instructions with Expected CPL
 *
 * Step 028 [Eval]: Create a seed dataset of 200 English instructions with
 * expected CPL output, covering scope, constraints, comparatives, anaphora,
 * negation, coordination, quantification, questions, and meta-commands.
 *
 * Each entry includes:
 * - The English instruction
 * - Expected CPL-Intent (as a typed structure)
 * - Expected features exercised
 * - Category tags
 * - Difficulty level
 * - Notes on expected behavior
 *
 * This dataset serves as:
 * 1. Golden tests for the compilation pipeline
 * 2. Regression baselines for parser changes
 * 3. Coverage measurement for feature completeness
 * 4. Training data specification for future ML components
 *
 * ## Batching
 *
 * Due to size, the dataset is split into batches:
 * - Batch 1 (001–050): Core imperatives + perceptual edits
 * - Batch 2 (051–100): Scope, constraints, and preservation
 * - Batch 3 (101–150): Coordination, anaphora, and discourse
 * - Batch 4 (151–200): Quantification, questions, negation, and meta
 *
 * @module gofai/eval/seed-dataset
 */

// =============================================================================
// Seed Dataset Types
// =============================================================================

/**
 * Unique identifier for a seed example.
 */
export type SeedExampleId = string & { readonly __brand: 'SeedExampleId' };

/**
 * Create a SeedExampleId.
 */
export function seedExampleId(id: string): SeedExampleId {
  return id as SeedExampleId;
}

/**
 * Category tags for seed examples.
 */
export type SeedCategory =
  | 'imperative'
  | 'perceptual'
  | 'structural'
  | 'harmonic'
  | 'rhythmic'
  | 'melodic'
  | 'production'
  | 'scope'
  | 'constraint'
  | 'preservation'
  | 'comparative'
  | 'superlative'
  | 'coordination'
  | 'sequencing'
  | 'contrastive'
  | 'anaphora'
  | 'deictic'
  | 'quantification'
  | 'negation'
  | 'question'
  | 'meta'
  | 'temporal'
  | 'conditional'
  | 'preference'
  | 'explanation';

/**
 * Difficulty levels for seed examples.
 */
export type SeedDifficulty =
  | 'basic'
  | 'intermediate'
  | 'advanced'
  | 'expert';

/**
 * Features exercised by a seed example.
 */
export type SeedFeature =
  | 'axis_mapping'
  | 'degree_semantics'
  | 'scope_resolution'
  | 'entity_binding'
  | 'preserve_constraint'
  | 'contrastive_parsing'
  | 'coordination_parsing'
  | 'anaphora_resolution'
  | 'deictic_resolution'
  | 'quantifier_distribution'
  | 'negation_scope'
  | 'temporal_resolution'
  | 'question_parsing'
  | 'meta_command'
  | 'default_application'
  | 'clarification_trigger'
  | 'plan_composition'
  | 'event_selection'
  | 'number_parsing'
  | 'unit_parsing'
  | 'morphological_normalization'
  | 'presupposition_trigger'
  | 'implicature'
  | 'modality';

/**
 * Expected CPL intent structure for a seed example.
 * This is a simplified representation for the dataset —
 * the real CPL types are in pipeline/types.ts.
 */
export interface ExpectedCPL {
  /** The action type (verb/opcode). */
  readonly action: string;
  /** Target entities (layers, sections, etc.). */
  readonly targets: readonly string[];
  /** Scope (section, range, whole track). */
  readonly scope: string;
  /** Axis being modified (if perceptual). */
  readonly axis: string | undefined;
  /** Direction of change. */
  readonly direction: 'increase' | 'decrease' | 'set' | 'none';
  /** Degree/amount. */
  readonly degree: string | undefined;
  /** Constraints to enforce. */
  readonly constraints: readonly ExpectedConstraint[];
  /** Sub-intents for coordinated edits. */
  readonly subIntents: readonly ExpectedCPL[];
  /** Whether clarification is expected. */
  readonly expectsClarification: boolean;
  /** Clarification reason (if expected). */
  readonly clarificationReason: string | undefined;
}

/**
 * Expected constraint in a seed example.
 */
export interface ExpectedConstraint {
  /** What to preserve/constrain. */
  readonly target: string;
  /** Preservation mode. */
  readonly mode: 'exact' | 'functional' | 'recognizable' | 'none';
  /** Source construction (e.g., "without", "but keep"). */
  readonly sourceConstruction: string;
}

/**
 * A single seed example in the dataset.
 */
export interface SeedExample {
  /** Unique ID. */
  readonly id: SeedExampleId;
  /** The English instruction. */
  readonly instruction: string;
  /** Expected CPL-Intent. */
  readonly expectedCPL: ExpectedCPL;
  /** Category tags. */
  readonly categories: readonly SeedCategory[];
  /** Features exercised. */
  readonly features: readonly SeedFeature[];
  /** Difficulty level. */
  readonly difficulty: SeedDifficulty;
  /** Notes for test implementors. */
  readonly notes: string;
  /** Optional UI selection context. */
  readonly uiContext: string | undefined;
  /** Optional dialogue history context. */
  readonly dialogueContext: readonly string[] | undefined;
}


// =============================================================================
// Helper: Create a basic expected CPL with defaults
// =============================================================================

function cpl(overrides: Partial<ExpectedCPL> & { action: string }): ExpectedCPL {
  return {
    targets: [],
    scope: 'implicit',
    axis: undefined,
    direction: 'none',
    degree: undefined,
    constraints: [],
    subIntents: [],
    expectsClarification: false,
    clarificationReason: undefined,
    ...overrides,
  };
}

export function constraint(
  target: string,
  mode: 'exact' | 'functional' | 'recognizable' | 'none',
  sourceConstruction: string,
): ExpectedConstraint {
  return { target, mode, sourceConstruction };
}


// =============================================================================
// Batch 1: Core Imperatives + Perceptual Edits (001–050)
// =============================================================================

export const SEED_BATCH_1: readonly SeedExample[] = [
  // --- 001–010: Basic imperatives with verbs ---
  {
    id: seedExampleId('seed-001'),
    instruction: 'Make it darker',
    expectedCPL: cpl({
      action: 'change',
      scope: 'implicit',
      axis: 'brightness',
      direction: 'decrease',
      degree: 'moderate',
    }),
    categories: ['imperative', 'perceptual'],
    features: ['axis_mapping', 'degree_semantics', 'default_application'],
    difficulty: 'basic',
    notes: '"Darker" maps to brightness axis decrease. Default sense: timbre (not harmony).',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-002'),
    instruction: 'Make it brighter',
    expectedCPL: cpl({
      action: 'change',
      scope: 'implicit',
      axis: 'brightness',
      direction: 'increase',
      degree: 'moderate',
    }),
    categories: ['imperative', 'perceptual'],
    features: ['axis_mapping', 'degree_semantics'],
    difficulty: 'basic',
    notes: '"Brighter" maps to brightness axis increase.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-003'),
    instruction: 'Add more energy',
    expectedCPL: cpl({
      action: 'change',
      scope: 'implicit',
      axis: 'energy',
      direction: 'increase',
      degree: 'moderate',
    }),
    categories: ['imperative', 'perceptual'],
    features: ['axis_mapping', 'degree_semantics'],
    difficulty: 'basic',
    notes: '"More energy" maps to energy axis increase.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-004'),
    instruction: 'Tighten the groove',
    expectedCPL: cpl({
      action: 'change',
      scope: 'implicit',
      axis: 'groove_tightness',
      direction: 'increase',
      degree: 'moderate',
    }),
    categories: ['imperative', 'perceptual'],
    features: ['axis_mapping', 'degree_semantics'],
    difficulty: 'basic',
    notes: '"Tighten" maps to groove_tightness axis increase.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-005'),
    instruction: 'Widen the stereo image',
    expectedCPL: cpl({
      action: 'change',
      scope: 'implicit',
      axis: 'width',
      direction: 'increase',
      degree: 'moderate',
    }),
    categories: ['imperative', 'production'],
    features: ['axis_mapping', 'degree_semantics'],
    difficulty: 'basic',
    notes: '"Widen" maps to width axis increase.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-006'),
    instruction: 'Make it warmer',
    expectedCPL: cpl({
      action: 'change',
      scope: 'implicit',
      axis: 'brightness',
      direction: 'decrease',
      degree: 'moderate',
      expectsClarification: true,
      clarificationReason: '"Warmer" is ambiguous: timbre warmth (less brightness) vs harmonic warmth (richer voicings)',
    }),
    categories: ['imperative', 'perceptual'],
    features: ['axis_mapping', 'degree_semantics', 'clarification_trigger'],
    difficulty: 'intermediate',
    notes: '"Warmer" has multiple valid senses. Default: timbre (brightness decrease).',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-007'),
    instruction: 'Remove the reverb',
    expectedCPL: cpl({
      action: 'remove',
      targets: ['reverb'],
      scope: 'implicit',
      direction: 'none',
    }),
    categories: ['imperative', 'production'],
    features: ['entity_binding'],
    difficulty: 'basic',
    notes: '"Remove" is a delete opcode. "The reverb" is an entity reference to a specific effect.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-008'),
    instruction: 'Add a pad layer',
    expectedCPL: cpl({
      action: 'add',
      targets: ['pad'],
      scope: 'implicit',
      direction: 'none',
    }),
    categories: ['imperative', 'structural'],
    features: ['entity_binding'],
    difficulty: 'basic',
    notes: '"Add" is an insert opcode. "A pad layer" creates a new layer with role pad.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-009'),
    instruction: 'Duplicate the chorus',
    expectedCPL: cpl({
      action: 'duplicate',
      targets: ['Chorus'],
      scope: 'Chorus',
      direction: 'none',
    }),
    categories: ['imperative', 'structural'],
    features: ['entity_binding', 'scope_resolution'],
    difficulty: 'basic',
    notes: '"Duplicate" copies a section. "The chorus" resolves to the Chorus section.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-010'),
    instruction: 'Swap the verse and chorus',
    expectedCPL: cpl({
      action: 'reorder',
      targets: ['Verse', 'Chorus'],
      scope: 'whole track',
      direction: 'none',
    }),
    categories: ['imperative', 'structural'],
    features: ['entity_binding', 'scope_resolution'],
    difficulty: 'basic',
    notes: '"Swap" reorders two sections. Both entities must be resolved.',
    uiContext: undefined,
    dialogueContext: undefined,
  },

  // --- 011–020: Degree modifiers ---
  {
    id: seedExampleId('seed-011'),
    instruction: 'Make it slightly brighter',
    expectedCPL: cpl({
      action: 'change',
      scope: 'implicit',
      axis: 'brightness',
      direction: 'increase',
      degree: 'small',
    }),
    categories: ['imperative', 'perceptual', 'comparative'],
    features: ['axis_mapping', 'degree_semantics'],
    difficulty: 'basic',
    notes: '"Slightly" is a small degree modifier.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-012'),
    instruction: 'Make it much darker',
    expectedCPL: cpl({
      action: 'change',
      scope: 'implicit',
      axis: 'brightness',
      direction: 'decrease',
      degree: 'large',
    }),
    categories: ['imperative', 'perceptual', 'comparative'],
    features: ['axis_mapping', 'degree_semantics'],
    difficulty: 'basic',
    notes: '"Much" is a large degree modifier.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-013'),
    instruction: 'Add a lot more energy',
    expectedCPL: cpl({
      action: 'change',
      scope: 'implicit',
      axis: 'energy',
      direction: 'increase',
      degree: 'large',
    }),
    categories: ['imperative', 'perceptual', 'comparative'],
    features: ['axis_mapping', 'degree_semantics'],
    difficulty: 'basic',
    notes: '"A lot more" is a large degree modifier + comparative.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-014'),
    instruction: 'Make it a tiny bit less busy',
    expectedCPL: cpl({
      action: 'change',
      scope: 'implicit',
      axis: 'density',
      direction: 'decrease',
      degree: 'tiny',
    }),
    categories: ['imperative', 'perceptual', 'comparative'],
    features: ['axis_mapping', 'degree_semantics'],
    difficulty: 'intermediate',
    notes: '"A tiny bit less" combines degree modifier with direction. "Busy" maps to density.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-015'),
    instruction: 'Increase the tension significantly',
    expectedCPL: cpl({
      action: 'change',
      scope: 'implicit',
      axis: 'tension',
      direction: 'increase',
      degree: 'large',
    }),
    categories: ['imperative', 'perceptual', 'comparative'],
    features: ['axis_mapping', 'degree_semantics'],
    difficulty: 'basic',
    notes: '"Significantly" is a large degree modifier. "Increase" is explicit direction.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-016'),
    instruction: 'Set the tempo to 120 BPM',
    expectedCPL: cpl({
      action: 'set',
      targets: ['tempo'],
      scope: 'whole track',
      direction: 'set',
      degree: '120 BPM',
    }),
    categories: ['imperative', 'production'],
    features: ['number_parsing', 'unit_parsing', 'entity_binding'],
    difficulty: 'basic',
    notes: 'Explicit numeric set. "120 BPM" requires number + unit parsing.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-017'),
    instruction: 'Transpose up by 3 semitones',
    expectedCPL: cpl({
      action: 'transpose',
      scope: 'implicit',
      direction: 'increase',
      degree: '3 semitones',
    }),
    categories: ['imperative', 'melodic'],
    features: ['number_parsing', 'unit_parsing'],
    difficulty: 'basic',
    notes: '"Transpose up by 3 semitones" is a precise numeric change.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-018'),
    instruction: 'Make the bass louder by 3 dB',
    expectedCPL: cpl({
      action: 'change',
      targets: ['Bass'],
      scope: 'implicit',
      direction: 'increase',
      degree: '3 dB',
    }),
    categories: ['imperative', 'production'],
    features: ['number_parsing', 'unit_parsing', 'entity_binding'],
    difficulty: 'basic',
    notes: '"Louder by 3 dB" combines perceptual direction with numeric amount.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-019'),
    instruction: 'Extend the intro by 4 bars',
    expectedCPL: cpl({
      action: 'extend',
      targets: ['Intro'],
      scope: 'Intro',
      direction: 'increase',
      degree: '4 bars',
    }),
    categories: ['imperative', 'structural'],
    features: ['number_parsing', 'unit_parsing', 'entity_binding', 'scope_resolution'],
    difficulty: 'basic',
    notes: '"Extend" modifies section length. "4 bars" is numeric with unit.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-020'),
    instruction: 'Make the drums punchier',
    expectedCPL: cpl({
      action: 'change',
      targets: ['Drums'],
      scope: 'implicit',
      axis: 'punch',
      direction: 'increase',
      degree: 'moderate',
    }),
    categories: ['imperative', 'perceptual'],
    features: ['axis_mapping', 'degree_semantics', 'entity_binding'],
    difficulty: 'basic',
    notes: '"Punchier" is a comparative on the punch axis. Targets drums layer.',
    uiContext: undefined,
    dialogueContext: undefined,
  },

  // --- 021–030: Scoped imperatives ---
  {
    id: seedExampleId('seed-021'),
    instruction: 'Make the second verse darker',
    expectedCPL: cpl({
      action: 'change',
      scope: 'Verse 2',
      axis: 'brightness',
      direction: 'decrease',
      degree: 'moderate',
    }),
    categories: ['imperative', 'perceptual', 'scope'],
    features: ['axis_mapping', 'degree_semantics', 'scope_resolution'],
    difficulty: 'basic',
    notes: '"The second verse" resolves to Verse 2 via ordinal + section type.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-022'),
    instruction: 'In the chorus, add more bass',
    expectedCPL: cpl({
      action: 'change',
      targets: ['Bass'],
      scope: 'Chorus',
      direction: 'increase',
      degree: 'moderate',
    }),
    categories: ['imperative', 'perceptual', 'scope'],
    features: ['scope_resolution', 'entity_binding'],
    difficulty: 'basic',
    notes: '"In the chorus" is a prepositional scope marker.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-023'),
    instruction: 'Brighten the lead in verse 1',
    expectedCPL: cpl({
      action: 'change',
      targets: ['Lead'],
      scope: 'Verse 1',
      axis: 'brightness',
      direction: 'increase',
      degree: 'moderate',
    }),
    categories: ['imperative', 'perceptual', 'scope'],
    features: ['axis_mapping', 'scope_resolution', 'entity_binding'],
    difficulty: 'basic',
    notes: 'Postposed scope "in verse 1". Verb "brighten" maps directly to brightness axis.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-024'),
    instruction: 'From bar 17 to bar 32, increase the energy',
    expectedCPL: cpl({
      action: 'change',
      scope: 'bars 17–32',
      axis: 'energy',
      direction: 'increase',
      degree: 'moderate',
    }),
    categories: ['imperative', 'perceptual', 'scope', 'temporal'],
    features: ['scope_resolution', 'number_parsing', 'unit_parsing'],
    difficulty: 'intermediate',
    notes: '"From bar 17 to bar 32" is an explicit bar range scope.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-025'),
    instruction: 'Make the last 8 bars more intense',
    expectedCPL: cpl({
      action: 'change',
      scope: 'last 8 bars',
      axis: 'energy',
      direction: 'increase',
      degree: 'moderate',
    }),
    categories: ['imperative', 'perceptual', 'scope', 'temporal'],
    features: ['scope_resolution', 'number_parsing', 'temporal_resolution'],
    difficulty: 'intermediate',
    notes: '"The last 8 bars" requires computing the range from the end of the track.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-026'),
    instruction: 'Darken just the pad in the bridge',
    expectedCPL: cpl({
      action: 'change',
      targets: ['Pad'],
      scope: 'Bridge',
      axis: 'brightness',
      direction: 'decrease',
      degree: 'moderate',
    }),
    categories: ['imperative', 'perceptual', 'scope'],
    features: ['axis_mapping', 'scope_resolution', 'entity_binding'],
    difficulty: 'basic',
    notes: '"Just" indicates locality (only the pad, nothing else). Dual scope: layer + section.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-027'),
    instruction: 'Make the whole track less busy',
    expectedCPL: cpl({
      action: 'change',
      scope: 'whole track',
      axis: 'density',
      direction: 'decrease',
      degree: 'moderate',
    }),
    categories: ['imperative', 'perceptual', 'scope'],
    features: ['axis_mapping', 'degree_semantics', 'scope_resolution'],
    difficulty: 'basic',
    notes: '"The whole track" is explicit universal scope. "Less busy" = density decrease.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-028'),
    instruction: 'In the intro and outro, reduce the volume',
    expectedCPL: cpl({
      action: 'change',
      scope: 'Intro + Outro',
      direction: 'decrease',
      degree: 'moderate',
    }),
    categories: ['imperative', 'production', 'scope', 'coordination'],
    features: ['scope_resolution', 'coordination_parsing'],
    difficulty: 'intermediate',
    notes: '"Intro and outro" is coordinated scope — edit applies to both sections.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-029'),
    instruction: 'Make this brighter',
    expectedCPL: cpl({
      action: 'change',
      scope: 'UI selection',
      axis: 'brightness',
      direction: 'increase',
      degree: 'moderate',
    }),
    categories: ['imperative', 'perceptual', 'deictic'],
    features: ['axis_mapping', 'deictic_resolution'],
    difficulty: 'intermediate',
    notes: '"This" is a deictic pronoun requiring UI selection context.',
    uiContext: 'Chorus section selected',
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-030'),
    instruction: 'Do the same thing here',
    expectedCPL: cpl({
      action: 'repeat_previous',
      scope: 'UI selection',
    }),
    categories: ['imperative', 'deictic', 'anaphora'],
    features: ['deictic_resolution', 'anaphora_resolution'],
    difficulty: 'advanced',
    notes: '"The same thing" refers to the previous edit. "Here" is deictic scope.',
    uiContext: 'Verse 2 section selected',
    dialogueContext: ['Make the chorus brighter'],
  },

  // --- 031–040: Layer-targeted edits ---
  {
    id: seedExampleId('seed-031'),
    instruction: 'Mute the hats',
    expectedCPL: cpl({
      action: 'mute',
      targets: ['Hats'],
      scope: 'implicit',
    }),
    categories: ['imperative', 'structural'],
    features: ['entity_binding'],
    difficulty: 'basic',
    notes: '"Mute" is a reversible toggle. "The hats" resolves to hi-hat layer.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-032'),
    instruction: 'Solo the bass',
    expectedCPL: cpl({
      action: 'solo',
      targets: ['Bass'],
      scope: 'implicit',
    }),
    categories: ['imperative', 'structural'],
    features: ['entity_binding'],
    difficulty: 'basic',
    notes: '"Solo" mutes all other layers. "The bass" resolves to bass layer.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-033'),
    instruction: 'Pan the lead guitar to the right',
    expectedCPL: cpl({
      action: 'set',
      targets: ['Lead Guitar'],
      scope: 'implicit',
      direction: 'set',
      degree: 'right',
    }),
    categories: ['imperative', 'production'],
    features: ['entity_binding'],
    difficulty: 'basic',
    notes: '"Pan to the right" is a directional parameter set.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-034'),
    instruction: 'Double the vocal part',
    expectedCPL: cpl({
      action: 'duplicate',
      targets: ['Vocals'],
      scope: 'implicit',
    }),
    categories: ['imperative', 'structural'],
    features: ['entity_binding'],
    difficulty: 'basic',
    notes: '"Double" in production context means create a copy/layer doubling.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-035'),
    instruction: 'Bring up the kick',
    expectedCPL: cpl({
      action: 'change',
      targets: ['Kick'],
      scope: 'implicit',
      direction: 'increase',
      degree: 'moderate',
    }),
    categories: ['imperative', 'production'],
    features: ['entity_binding', 'degree_semantics'],
    difficulty: 'basic',
    notes: '"Bring up" is a colloquial expression for increase volume/presence.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-036'),
    instruction: 'Cut the low end on the vocal',
    expectedCPL: cpl({
      action: 'remove',
      targets: ['Vocals'],
      scope: 'implicit',
      axis: 'low_frequency',
      direction: 'decrease',
    }),
    categories: ['imperative', 'production'],
    features: ['entity_binding', 'axis_mapping'],
    difficulty: 'intermediate',
    notes: '"Cut the low end" is an EQ operation. Requires understanding frequency band reference.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-037'),
    instruction: 'Add a high-pass filter to the pad at 200 Hz',
    expectedCPL: cpl({
      action: 'add',
      targets: ['Pad'],
      scope: 'implicit',
      degree: '200 Hz',
    }),
    categories: ['imperative', 'production'],
    features: ['entity_binding', 'number_parsing', 'unit_parsing'],
    difficulty: 'intermediate',
    notes: 'Technical production edit with precise frequency. Requires unit parsing.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-038'),
    instruction: 'Make the strings more legato',
    expectedCPL: cpl({
      action: 'change',
      targets: ['Strings'],
      scope: 'implicit',
      axis: 'articulation',
      direction: 'increase',
      degree: 'moderate',
    }),
    categories: ['imperative', 'perceptual'],
    features: ['axis_mapping', 'entity_binding', 'degree_semantics'],
    difficulty: 'intermediate',
    notes: '"Legato" is a performance articulation term mapping to sustain/overlap.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-039'),
    instruction: 'Humanize the drums',
    expectedCPL: cpl({
      action: 'change',
      targets: ['Drums'],
      scope: 'implicit',
      axis: 'humanization',
      direction: 'increase',
      degree: 'moderate',
    }),
    categories: ['imperative', 'rhythmic'],
    features: ['axis_mapping', 'entity_binding'],
    difficulty: 'basic',
    notes: '"Humanize" is a standard production term for adding timing/velocity variation.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-040'),
    instruction: 'Quantize the bass to sixteenth notes',
    expectedCPL: cpl({
      action: 'change',
      targets: ['Bass'],
      scope: 'implicit',
      axis: 'quantization',
      direction: 'set',
      degree: '1/16',
    }),
    categories: ['imperative', 'rhythmic'],
    features: ['entity_binding', 'unit_parsing'],
    difficulty: 'intermediate',
    notes: '"Quantize to sixteenth notes" is a timing grid operation.',
    uiContext: undefined,
    dialogueContext: undefined,
  },

  // --- 041–050: Multi-word adjectives and domain terms ---
  {
    id: seedExampleId('seed-041'),
    instruction: 'Give it more low-end punch',
    expectedCPL: cpl({
      action: 'change',
      scope: 'implicit',
      axis: 'punch',
      direction: 'increase',
      degree: 'moderate',
    }),
    categories: ['imperative', 'production'],
    features: ['axis_mapping', 'degree_semantics'],
    difficulty: 'intermediate',
    notes: '"Low-end punch" is a compound domain term. Must parse as a unit.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-042'),
    instruction: 'Make the mix more spacious',
    expectedCPL: cpl({
      action: 'change',
      scope: 'whole track',
      axis: 'width',
      direction: 'increase',
      degree: 'moderate',
    }),
    categories: ['imperative', 'perceptual'],
    features: ['axis_mapping', 'degree_semantics'],
    difficulty: 'basic',
    notes: '"Spacious" maps to width axis. "The mix" implies whole track scope.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-043'),
    instruction: 'Thin out the arrangement in the verse',
    expectedCPL: cpl({
      action: 'change',
      scope: 'Verse',
      axis: 'density',
      direction: 'decrease',
      degree: 'moderate',
    }),
    categories: ['imperative', 'structural', 'scope'],
    features: ['axis_mapping', 'scope_resolution'],
    difficulty: 'intermediate',
    notes: '"Thin out" is an idiomatic expression for reducing density/layers.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-044'),
    instruction: 'Add swing to the hi-hats',
    expectedCPL: cpl({
      action: 'change',
      targets: ['Hats'],
      scope: 'implicit',
      axis: 'swing',
      direction: 'increase',
      degree: 'moderate',
    }),
    categories: ['imperative', 'rhythmic'],
    features: ['axis_mapping', 'entity_binding'],
    difficulty: 'basic',
    notes: '"Swing" is a rhythmic feel parameter.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-045'),
    instruction: 'Make the melody more memorable',
    expectedCPL: cpl({
      action: 'change',
      targets: ['melody'],
      scope: 'implicit',
      expectsClarification: true,
      clarificationReason: '"More memorable" is vague — could mean: simpler rhythm, stronger contour, more repetition, catchier intervals',
    }),
    categories: ['imperative', 'melodic'],
    features: ['clarification_trigger'],
    difficulty: 'advanced',
    notes: '"More memorable" is too vague for automatic resolution. Must trigger clarification.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-046'),
    instruction: 'Boost the presence of the vocal',
    expectedCPL: cpl({
      action: 'change',
      targets: ['Vocals'],
      scope: 'implicit',
      axis: 'presence',
      direction: 'increase',
      degree: 'moderate',
    }),
    categories: ['imperative', 'production'],
    features: ['axis_mapping', 'entity_binding'],
    difficulty: 'intermediate',
    notes: '"Boost the presence" combines a production verb with a frequency-band term.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-047'),
    instruction: 'Compress the drums harder',
    expectedCPL: cpl({
      action: 'change',
      targets: ['Drums'],
      scope: 'implicit',
      axis: 'compression',
      direction: 'increase',
      degree: 'moderate',
    }),
    categories: ['imperative', 'production', 'comparative'],
    features: ['axis_mapping', 'entity_binding', 'degree_semantics'],
    difficulty: 'intermediate',
    notes: '"Harder" is a comparative degree on compression intensity.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-048'),
    instruction: 'Add a crescendo over the last 4 bars',
    expectedCPL: cpl({
      action: 'add',
      scope: 'last 4 bars',
      direction: 'increase',
    }),
    categories: ['imperative', 'structural', 'temporal'],
    features: ['scope_resolution', 'number_parsing', 'temporal_resolution'],
    difficulty: 'intermediate',
    notes: '"Crescendo" is a dynamic shape (volume increase over time). Scoped to "last 4 bars".',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-049'),
    instruction: 'Change the key to E minor',
    expectedCPL: cpl({
      action: 'set',
      scope: 'whole track',
      direction: 'set',
      degree: 'E minor',
    }),
    categories: ['imperative', 'harmonic'],
    features: ['entity_binding'],
    difficulty: 'basic',
    notes: '"Change the key to" is a set operation on a harmonic parameter.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
  {
    id: seedExampleId('seed-050'),
    instruction: 'Slow it down by 10 BPM',
    expectedCPL: cpl({
      action: 'change',
      targets: ['tempo'],
      scope: 'whole track',
      direction: 'decrease',
      degree: '10 BPM',
    }),
    categories: ['imperative', 'production'],
    features: ['number_parsing', 'unit_parsing'],
    difficulty: 'basic',
    notes: '"Slow it down" = decrease tempo. "By 10 BPM" is a relative numeric change.',
    uiContext: undefined,
    dialogueContext: undefined,
  },
];


// =============================================================================
// Dataset Utilities
// =============================================================================

/**
 * Get all seed examples across all batches.
 * More batches will be added in subsequent files.
 */
export function getAllSeedExamples(): readonly SeedExample[] {
  return [
    ...SEED_BATCH_1,
  ];
}

/**
 * Get seed examples by category.
 */
export function getSeedExamplesByCategory(category: SeedCategory): readonly SeedExample[] {
  return getAllSeedExamples().filter(e => e.categories.includes(category));
}

/**
 * Get seed examples by difficulty.
 */
export function getSeedExamplesByDifficulty(difficulty: SeedDifficulty): readonly SeedExample[] {
  return getAllSeedExamples().filter(e => e.difficulty === difficulty);
}

/**
 * Get seed examples by feature.
 */
export function getSeedExamplesByFeature(feature: SeedFeature): readonly SeedExample[] {
  return getAllSeedExamples().filter(e => e.features.includes(feature));
}

/**
 * Get a seed example by ID.
 */
export function getSeedExampleById(id: SeedExampleId): SeedExample | undefined {
  return getAllSeedExamples().find(e => e.id === id);
}

/**
 * Get dataset coverage statistics.
 */
export function getSeedDatasetStats(): SeedDatasetStats {
  const examples = getAllSeedExamples();
  const categories = new Map<SeedCategory, number>();
  const features = new Map<SeedFeature, number>();
  const difficulties = new Map<SeedDifficulty, number>();

  for (const example of examples) {
    for (const cat of example.categories) {
      categories.set(cat, (categories.get(cat) ?? 0) + 1);
    }
    for (const feat of example.features) {
      features.set(feat, (features.get(feat) ?? 0) + 1);
    }
    difficulties.set(example.difficulty, (difficulties.get(example.difficulty) ?? 0) + 1);
  }

  return {
    totalExamples: examples.length,
    categoryCoverage: Object.fromEntries(categories) as Record<string, number>,
    featureCoverage: Object.fromEntries(features) as Record<string, number>,
    difficultyCoverage: Object.fromEntries(difficulties) as Record<string, number>,
    clarificationCount: examples.filter(e => e.expectedCPL.expectsClarification).length,
    withUIContext: examples.filter(e => e.uiContext !== undefined).length,
    withDialogueContext: examples.filter(e => e.dialogueContext !== undefined).length,
  };
}

/**
 * Statistics for the seed dataset.
 */
export interface SeedDatasetStats {
  readonly totalExamples: number;
  readonly categoryCoverage: Record<string, number>;
  readonly featureCoverage: Record<string, number>;
  readonly difficultyCoverage: Record<string, number>;
  readonly clarificationCount: number;
  readonly withUIContext: number;
  readonly withDialogueContext: number;
}

/**
 * Validate the seed dataset for consistency.
 */
export function validateSeedDataset(): readonly string[] {
  const errors: string[] = [];
  const examples = getAllSeedExamples();
  const ids = new Set<string>();

  for (const example of examples) {
    // Check unique IDs
    if (ids.has(example.id)) {
      errors.push(`Duplicate seed example ID: ${example.id}`);
    }
    ids.add(example.id);

    // Check non-empty instruction
    if (example.instruction.trim().length === 0) {
      errors.push(`Seed example ${example.id} has empty instruction`);
    }

    // Check categories
    if (example.categories.length === 0) {
      errors.push(`Seed example ${example.id} has no categories`);
    }

    // Check features
    if (example.features.length === 0) {
      errors.push(`Seed example ${example.id} has no features`);
    }

    // Check clarification consistency
    if (example.expectedCPL.expectsClarification && !example.expectedCPL.clarificationReason) {
      errors.push(`Seed example ${example.id} expects clarification but has no reason`);
    }

    // Check UI context for deictic examples
    if (example.categories.includes('deictic') && !example.uiContext) {
      errors.push(`Seed example ${example.id} is deictic but has no UI context`);
    }
  }

  return errors;
}
