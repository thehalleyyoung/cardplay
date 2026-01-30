/**
 * GOFAI Canon — Key Terms Glossary
 *
 * This module defines the glossary of key terms used throughout the GOFAI system,
 * implementing Step 016 from gofai_goalB.md: "Add a glossary of key terms
 * (scope, referent, salience, presupposition, implicature, constraint) and
 * require it in docs review."
 *
 * This glossary is the authoritative source for terminology used in:
 * - Documentation
 * - Code comments
 * - Type names
 * - Error messages
 * - User-facing explanations
 *
 * @module gofai/canon/glossary
 */

// =============================================================================
// Glossary Entry Types
// =============================================================================

/**
 * A single glossary entry defining a term.
 */
export interface GlossaryEntry {
  /** The term being defined */
  readonly term: string;

  /** Short definition (one sentence) */
  readonly shortDefinition: string;

  /** Detailed explanation (multiple paragraphs OK) */
  readonly longDefinition: string;

  /** Category/domain this term belongs to */
  readonly category: GlossaryCategory;

  /** Related terms */
  readonly relatedTerms: readonly string[];

  /** Example usage in context */
  readonly examples: readonly string[];

  /** References to relevant literature or specs */
  readonly references?: readonly string[];

  /** Alternative names or synonyms */
  readonly aliases?: readonly string[];
}

/**
 * Categories for organizing glossary terms.
 */
export type GlossaryCategory =
  | 'semantics' // Semantic interpretation
  | 'pragmatics' // Discourse and context
  | 'syntax' // Grammar and parsing
  | 'planning' // Goal-directed planning
  | 'constraints' // Constraint system
  | 'execution' // Edit execution
  | 'types' // Type system
  | 'music' // Musical concepts
  | 'infrastructure' // System infrastructure
  | 'extension'; // Extension system

// =============================================================================
// Core Glossary Terms
// =============================================================================

/**
 * The canonical GOFAI glossary.
 *
 * All terms used in documentation must be defined here.
 * Terms are organized alphabetically within each category.
 */
export const GOFAI_GLOSSARY: readonly GlossaryEntry[] = [
  // ===========================================================================
  // Semantics Terms
  // ===========================================================================
  {
    term: 'CPL',
    shortDefinition:
      'Compositional Pragmatic Language: the typed logical form representing musical intentions',
    longDefinition: `CPL (Compositional Pragmatic Language) is the intermediate representation
      used throughout the GOFAI compiler pipeline. It is a typed, compositional logical form that
      captures the semantic and pragmatic content of natural language utterances about music.
      
      CPL has three main forms:
      - CPL-Intent: High-level goals and constraints (what the user wants)
      - CPL-Plan: Concrete edit operations with scopes (how to achieve it)
      - CPL-Host: Low-level CardPlay host actions (what actually executes)
      
      CPL is designed to be:
      - Compositional: Meaning built from parts
      - Typed: Every node has a well-defined type
      - Serializable: Can be saved, shared, and replayed
      - Deterministic: Same CPL always means the same thing
      - Explainable: Every part has provenance traces`,
    category: 'semantics',
    relatedTerms: [
      'semantic composition',
      'pragmatic resolution',
      'typecheck',
      'provenance',
    ],
    examples: [
      'CPL-Intent: adjust(axis=brightness, direction=increase, scope=chorus)',
      'CPL-Plan: apply_filter(type=highpass, freq=8000, scope=chorus_1)',
      'CPL-Host: setCardParam(cardId=filter_42, param=cutoff, value=8000)',
    ],
    references: [
      'gofaimusicplus.md §3',
      'docs/gofai/architecture.md',
      'src/gofai/pipeline/types.ts',
    ],
  },

  {
    term: 'semantic composition',
    shortDefinition:
      'The process of building meaning from syntactic structure using composition rules',
    longDefinition: `Semantic composition is the stage of the compiler pipeline that converts
      syntactic parse trees into CPL-Intent. It follows the principle of compositionality:
      the meaning of a phrase is determined by the meanings of its parts and how they are combined.
      
      For example:
      - "make" → action(type=modify)
      - "brighter" → axis(id=brightness, direction=increase)
      - "the chorus" → scope(type=section, sectionType=chorus)
      - "make the chorus brighter" → adjust(axis=brightness, direction=increase, scope=chorus)
      
      Composition is guided by grammar rules that attach semantic actions to syntactic productions.
      The result is CPL-Intent with possible holes (unresolved references, unspecified amounts).`,
    category: 'semantics',
    relatedTerms: ['CPL', 'pragmatic resolution', 'holes', 'grammar rules'],
    examples: [
      '"darker" composes to axis_modifier(axis=brightness, direction=decrease)',
      '"in the verse" composes to scope(type=section, sectionType=verse)',
      'Composition rule: NP[scope] → Det "the" N[section] ⇒ scope(type=section, sectionType=N.semValue)',
    ],
    references: [
      'gofaimusicplus.md §4.1',
      'src/gofai/nl/semantic-composition.ts',
    ],
  },

  {
    term: 'referent',
    shortDefinition: 'The entity in the project world that a linguistic expression refers to',
    longDefinition: `A referent is the concrete entity (section, track, card, event, etc.) in the
      CardPlay project that a natural language expression picks out. Referents are determined by
      pragmatic resolution, which uses context, salience, and lexical matching to bind linguistic
      descriptions to actual entities.
      
      Types of referents:
      - Section referents: "the chorus", "bars 8-16"
      - Track referents: "the drums", "bass track"
      - Card referents: "the reverb", "that filter"
      - Event referents: "the kick hits", "those notes"
      - Abstract referents: "the current selection", "everything"
      
      Referents are stored with provenance (how they were resolved) and can be inspected by users
      to verify the system understood correctly.`,
    category: 'pragmatics',
    relatedTerms: [
      'salience',
      'anaphora',
      'deixis',
      'pragmatic resolution',
      'entity binding',
    ],
    examples: [
      '"the chorus" might refer to section marker with ID chorus_1',
      '"that reverb" might refer to card with ID reverb_42 based on recency',
      '"it" might refer to the most salient entity from prior utterance',
    ],
    references: [
      'src/gofai/pragmatics/referent-resolution.ts',
      'src/gofai/infra/symbol-table.ts',
    ],
  },

  {
    term: 'salience',
    shortDefinition:
      'The degree to which an entity is prominent and available for reference',
    longDefinition: `Salience is a measure of how prominent or accessible an entity is in the
      current discourse context. It determines which referents are considered when resolving
      pronouns and anaphoric expressions like "it", "that", "them", "again".
      
      Factors affecting salience:
      - Recency: Recently mentioned entities are more salient
      - Subject position: Entities in subject/topic position gain salience
      - Focus: UI-selected entities have maximum salience
      - Persistence: Some entities remain salient across multiple turns
      
      Salience is tracked in the dialogue state and decays over time. The salience tracker
      maintains a ranked list of candidate referents for anaphora resolution.`,
    category: 'pragmatics',
    relatedTerms: [
      'referent',
      'anaphora',
      'dialogue state',
      'focus',
      'discourse history',
    ],
    examples: [
      'After "brighten the chorus", chorus_1 becomes highly salient',
      'User selects bar 8-12 → selection becomes maximally salient',
      '"do it again" resolves to most salient edit action from history',
    ],
    references: [
      'src/gofai/infra/salience-tracker.ts',
      'src/gofai/pragmatics/anaphora-resolution.ts',
    ],
  },

  {
    term: 'scope',
    shortDefinition: 'The region of the project that an operation applies to',
    longDefinition: `A scope defines which parts of the project an edit operation applies to.
      Scopes can be specified explicitly ("in the chorus") or determined from context (current
      selection, focused section).
      
      Types of scopes:
      - Temporal: Bar ranges, time ranges, sections
      - Layered: Specific tracks/instruments ("only drums")
      - Hierarchical: Events within tracks within sections
      - Selector-based: Queries that match entities ("all kick hits")
      
      Scope is a critical safety mechanism: operations are constrained to their declared scope
      and cannot accidentally modify unrelated parts of the project. Scope validation happens
      during typecheck and is enforced during execution.`,
    category: 'semantics',
    relatedTerms: [
      'selector',
      'section',
      'range',
      'constraint',
      'capability',
      'safety',
    ],
    examples: [
      'scope(type=section, sectionId=chorus_1) → only chorus',
      'scope(type=range, startBar=8, endBar=12) → bars 8-12',
      'scope(type=layer, layerRole=drums) → only drum tracks',
      'scope(type=selection) → user-selected region',
    ],
    references: [
      'src/gofai/canon/scope-types.ts',
      'src/gofai/planning/scope-validation.ts',
    ],
  },

  {
    term: 'presupposition',
    shortDefinition: 'An implicit assumption that must be true for an utterance to be felicitous',
    longDefinition: `A presupposition is background information that the speaker assumes is already
      established or uncontroversial. Presuppositions must be satisfied (true in the context) for
      an utterance to be appropriate.
      
      Examples:
      - "Make the chorus brighter" presupposes there exists a chorus
      - "Do it again" presupposes a prior action exists
      - "Keep the melody" presupposes there is a melody to keep
      
      The GOFAI system checks presuppositions during pragmatic resolution and typechecking.
      If a presupposition fails, the system generates a clarification question rather than
      proceeding with an invalid interpretation.
      
      Presupposition failure is distinct from semantic incorrectness: the syntax and basic
      semantics might be fine, but the context doesn't support the assumptions.`,
    category: 'pragmatics',
    relatedTerms: [
      'pragmatic resolution',
      'typecheck',
      'clarification',
      'context',
      'felicity',
    ],
    examples: [
      '"The reverb" presupposes unique reverb card exists and is salient',
      '"Again" presupposes prior action to repeat',
      '"Only change the bass" presupposes bass layer exists and is identifiable',
    ],
    references: [
      'src/gofai/pragmatics/presupposition-checking.ts',
      'src/gofai/pipeline/typecheck.ts',
    ],
  },

  {
    term: 'implicature',
    shortDefinition:
      'Meaning that is implied or suggested but not explicitly stated',
    longDefinition: `An implicature is information conveyed indirectly through conversational context
      and pragmatic principles, rather than through literal semantic content. The GOFAI system
      must infer implicatures to interpret natural instructions correctly.
      
      Common implicatures in music editing:
      - "Make it darker" often implicates "but keep everything else the same" (default least-change)
      - "Add a pad" implicates "in a musically appropriate register and style"
      - "Tighten it up" implicates "reduce timing slop and tighten quantization"
      
      Implicatures are captured as:
      - Default constraints (least-change preference)
      - Soft preferences in planning
      - Contextual parameter inference
      
      Unlike presuppositions (which must be true), implicatures are defeasible: they can be
      cancelled if contradicted by explicit information.`,
    category: 'pragmatics',
    relatedTerms: [
      'pragmatic resolution',
      'preferences',
      'defaults',
      'inference',
      'context',
    ],
    examples: [
      '"Darker" implicates decrease brightness, possibly in familiar/intimate direction',
      '"More energy" implicates multiple coordinated changes (tempo, density, dynamics)',
      '"Clean it up" implicates reduce noise, tighten timing, clarify mix',
    ],
    references: [
      'src/gofai/pragmatics/implicature-inference.ts',
      'gofaimusicplus.md §5.3',
    ],
  },

  // ===========================================================================
  // Constraint Terms
  // ===========================================================================
  {
    term: 'constraint',
    shortDefinition: 'A requirement or restriction that limits valid plans and edits',
    longDefinition: `A constraint is a declarative specification of what must be true before and/or
      after an edit operation. Constraints are central to safe, predictable music editing.
      
      Types of constraints:
      - Hard constraints: Must never be violated (melody preservation, scope boundaries)
      - Soft constraints: Preferences that influence planning but can be overridden
      - Implicit constraints: Derived from board policy and capability model
      
      Constraint checking happens at multiple stages:
      - Planning: Candidate plans are filtered to satisfy constraints
      - Execution: Diffs are validated before commit
      - Post-execution: Verification that promised constraints were upheld
      
      If a constraint is violated, the system either:
      - Rejects the plan and asks for clarification
      - Rolls back the edit and reports the violation
      - Shows warnings and requires explicit override`,
    category: 'constraints',
    relatedTerms: [
      'goal',
      'preference',
      'preserve',
      'only-change',
      'validation',
      'safety',
    ],
    examples: [
      'preserve(melody, exact) → never modify melody note pitches or timings',
      'preserve(harmony, functional) → keep functional progression, allow voicing changes',
      'only_change(scope=drums) → do not modify non-drum tracks',
      'within_range(param=bpm, min=80, max=140) → tempo must stay in range',
    ],
    references: [
      'src/gofai/canon/goals-constraints-preferences.ts',
      'src/gofai/planning/constraint-satisfaction.ts',
    ],
  },

  {
    term: 'goal',
    shortDefinition: 'A desired outcome or target state that planning aims to achieve',
    longDefinition: `A goal is a positive specification of what the user wants to accomplish.
      Goals are distinct from constraints:
      - Goals specify desired changes (increase brightness)
      - Constraints specify what must not change (keep melody)
      
      Goals drive the planning process:
      1. User expresses goal in natural language
      2. Semantic composition maps to goal representation in CPL-Intent
      3. Planner maps goals to candidate levers and operations
      4. Constraint satisfaction filters to valid plans
      5. Cost model ranks remaining plans
      
      Goals can be:
      - Specific: "Set BPM to 120"
      - Directional: "Make it brighter"
      - Comparative: "More energy than the verse"
      - Multi-objective: "Darker and wider"`,
    category: 'constraints',
    relatedTerms: [
      'constraint',
      'preference',
      'lever',
      'planning',
      'axis',
      'satisfaction',
    ],
    examples: [
      'goal: adjust(axis=brightness, direction=increase, amount=moderate)',
      'goal: match_reference(target=energy, reference=previous_section)',
      'goal: achieve(target_value=120, param=bpm)',
    ],
    references: [
      'src/gofai/canon/goals-constraints-preferences.ts',
      'src/gofai/planning/goal-to-levers.ts',
    ],
  },

  {
    term: 'preference',
    shortDefinition:
      'A soft constraint that guides planning but can be violated if necessary',
    longDefinition: `A preference is a weighted guideline that influences plan selection without
      being strictly required. Preferences are used to:
      - Express defaults (least-change unless stated otherwise)
      - Capture style expectations (prefer common voicings)
      - Encode user habits (this user likes tight quantization)
      
      Preferences vs constraints vs goals:
      - Goals: What to achieve (increase brightness)
      - Constraints: What must not violate (keep melody exact)
      - Preferences: What is preferred but negotiable (minimize edits)
      
      In the cost model, preferences contribute to plan scores. Plans that satisfy more
      preferences rank higher, but a plan that violates preferences can still be chosen
      if it's the only way to satisfy goals and constraints.`,
    category: 'constraints',
    relatedTerms: [
      'constraint',
      'goal',
      'soft constraint',
      'cost model',
      'planning',
      'scoring',
    ],
    examples: [
      'preference: least_change (minimize diff size)',
      'preference: preserve_style (stay within established harmonic vocabulary)',
      'preference: avoid_melodic_edits (melody changes are expensive)',
    ],
    references: [
      'src/gofai/canon/goals-constraints-preferences.ts',
      'src/gofai/planning/cost-hierarchy.ts',
    ],
  },

  {
    term: 'preserve',
    shortDefinition: 'A constraint that specifies what must remain unchanged during editing',
    longDefinition: `Preserve constraints are explicit declarations that certain aspects of the
      music must not be modified. They are the primary safety mechanism for controlled editing.
      
      Preservation levels:
      - Exact: Bit-for-bit identical (preserve melody exactly)
      - Recognizable: Perceptually similar (keep melody recognizable)
      - Functional: Same structural role (preserve chord progression function)
      - None: No preservation required
      
      Preserve constraints can target:
      - Layers: preserve(layer=vocals)
      - Aspects: preserve(melody, exact)
      - Parameters: preserve(param=tempo)
      - Ranges: preserve(scope=intro)
      
      Validation:
      - Planning: Opcodes that would violate preservation are filtered out
      - Execution: Diffs are checked to ensure preserved elements unchanged
      - Post-exec: Verification reports any unexpected changes`,
    category: 'constraints',
    relatedTerms: [
      'constraint',
      'only-change',
      'safety',
      'validation',
      'diff',
      'scope',
    ],
    examples: [
      'preserve(melody, exact) → no pitch/timing changes to melody notes',
      'preserve(harmony, functional) → keep chord skeleton, allow voicing',
      'preserve(scope=intro) → do not touch intro at all',
    ],
    references: [
      'src/gofai/canon/preserve-constraints.ts',
      'src/gofai/execution/constraint-checkers.ts',
    ],
  },

  {
    term: 'only-change',
    shortDefinition: 'A constraint that restricts edits to a specific scope or aspect',
    longDefinition: `An only-change constraint is the dual of preserve: instead of saying what must
      stay the same, it says what is the only thing allowed to change.
      
      Forms:
      - only_change(scope=drums) → modify drums only, everything else preserved
      - only_change(aspect=timing) → adjust timing only, pitches stay same
      - only_change(param=cutoff) → this parameter only, others fixed
      
      Implementation:
      - Converted to equivalent preserve constraints on all other scopes/aspects
      - Validated during execution by checking diff touches only allowed targets
      - Violations reported with specific counterexamples
      
      Only-change is particularly useful when:
      - User wants surgical edits: "only fix the kick timing"
      - Debugging: "change just this one thing to test"
      - Learning: "show me what this parameter does alone"`,
    category: 'constraints',
    relatedTerms: ['preserve', 'constraint', 'scope', 'validation', 'safety'],
    examples: [
      'only_change(scope=drums) → plan must not touch non-drum tracks',
      'only_change(layer=bass, aspect=timing) → adjust bass timing only',
      'only_change(card=filter_42, param=cutoff) → this parameter only',
    ],
    references: [
      'src/gofai/canon/preserve-constraints.ts',
      'src/gofai/execution/constraint-checkers.ts',
    ],
  },

  // ===========================================================================
  // Planning Terms
  // ===========================================================================
  {
    term: 'lever',
    shortDefinition: 'A concrete mechanism that can be adjusted to achieve a goal',
    longDefinition: `A lever is a parameterized operation that the planner can use to satisfy goals.
      Levers bridge the gap between high-level perceptual axes (brightness, width, energy) and
      low-level musical parameters (EQ, reverb, note density).
      
      Lever anatomy:
      - Perceptual axis it affects (brightness, intimacy, lift)
      - Musical domain it operates on (harmony, rhythm, mixing)
      - Opcodes it can generate (adjust_eq, thin_texture, spread_voicing)
      - Parameter ranges and defaults
      - Cost (how expensive/risky is this lever)
      - Preconditions (when is this lever applicable)
      
      The lever mapping is the core "musical intelligence" of the planner: it encodes knowledge
      about how perceptual goals map to concrete musical changes.`,
    category: 'planning',
    relatedTerms: [
      'axis',
      'opcode',
      'goal',
      'planning',
      'perceptual dimension',
      'musical parameter',
    ],
    examples: [
      'brightness lever: adjust highpass filter, increase treble, brighten voicing',
      'intimacy lever: thin texture, reduce width, close mic positioning',
      'lift lever: raise register, lighten texture, reduce density',
    ],
    references: [
      'src/gofai/planning/lever-mappings-comprehensive-batch1.ts',
      'src/gofai/planning/goal-to-levers.ts',
    ],
  },

  {
    term: 'opcode',
    shortDefinition: 'A low-level edit operation that the executor can apply to project state',
    longDefinition: `An opcode (operation code) is a primitive edit operation in the GOFAI system.
      Opcodes are the instructions in CPL-Plan; they correspond to concrete CardPlay mutations.
      
      Opcode categories:
      - Event opcodes: quantize, shift_pitch, adjust_velocity
      - Container opcodes: insert_break, duplicate_section, trim
      - Card opcodes: set_param, add_card, remove_card
      - Routing opcodes: connect_ports, set_gain, adjust_pan
      - Structure opcodes: mark_section, set_tempo, change_meter
      
      Properties:
      - Deterministic: Same opcode + args → same result
      - Reversible: Each opcode can be undone
      - Scopeable: Opcodes apply to explicit scopes
      - Typed: Parameters are type-checked
      - Explainable: Each opcode carries provenance linking to goal`,
    category: 'planning',
    relatedTerms: [
      'CPL-Plan',
      'execution',
      'lever',
      'scope',
      'undo',
      'provenance',
    ],
    examples: [
      'opcode: quantize(strength=0.8, grid=sixteenth, scope=drums)',
      'opcode: adjust_eq(band=high, gain=+3dB, scope=vocals)',
      'opcode: thin_texture(reduction=0.3, scope=chorus)',
    ],
    references: [
      'src/gofai/planning/plan-types.ts',
      'src/gofai/canon/edit-opcodes-phase5-batch1.ts',
    ],
  },

  {
    term: 'plan',
    shortDefinition: 'An ordered sequence of opcodes that achieves goals while respecting constraints',
    longDefinition: `A plan is the output of the planning stage: a concrete, executable sequence
      of edit operations (opcodes) that will achieve the user's goals while satisfying all constraints.
      
      Plan structure:
      - List of opcodes with scopes and parameters
      - Preconditions (what must be true to execute)
      - Postconditions (what will be true after)
      - Cost score (total edit cost)
      - Satisfaction score (how well goals are met)
      - Provenance traces (which goal led to which opcode)
      - Explanation (human-readable summary)
      
      Planning process:
      1. Map goals to candidate levers
      2. Generate candidate opcode sequences
      3. Filter by constraint satisfaction
      4. Score by cost model
      5. Return top N plans (often just best, or top 2-3 if close)
      
      Plans are presented to users for preview and can be inspected, modified, or declined.`,
    category: 'planning',
    relatedTerms: [
      'CPL-Plan',
      'opcode',
      'goal',
      'constraint',
      'lever',
      'cost model',
      'satisfaction',
    ],
    examples: [
      'Plan to "brighten chorus": [adjust_eq(+3dB high), adjust_voicing(open), reduce_reverb]',
      'Plan to "add energy": [increase_density, raise_dynamics, tighten_timing]',
    ],
    references: [
      'src/gofai/planning/plan-generation.ts',
      'src/gofai/planning/plan-types.ts',
    ],
  },

  {
    term: 'cost model',
    shortDefinition: 'A scoring system that ranks plans by editing cost and user expectations',
    longDefinition: `The cost model assigns numeric costs to edit operations, reflecting both
      computational expense and user expectations about what kinds of edits are "cheap" vs "expensive".
      
      Cost factors:
      - Edit magnitude: Small changes cheaper than large
      - Domain: Melody edits expensive, voicing edits cheap
      - Reversibility: Irreversible ops (delete) cost more
      - Risk: Operations that might break things cost more
      - Scope size: Larger scopes cost more
      - Novelty: Unusual edits cost more than familiar patterns
      
      The cost hierarchy aligns with musical practice:
      - Cheapest: Mixing changes (EQ, levels, pan)
      - Cheap: Rhythm adjustments (quantize, humanize)
      - Moderate: Harmonic voicing changes
      - Expensive: Melody modifications
      - Most expensive: Structural reorganization
      
      When multiple plans satisfy constraints equally, lowest-cost plan wins.`,
    category: 'planning',
    relatedTerms: [
      'plan',
      'preference',
      'least-change',
      'scoring',
      'ranking',
      'planning',
    ],
    examples: [
      'Adjust EQ: cost = 1 (cheap)',
      'Requantize: cost = 3 (moderate)',
      'Revoice chord: cost = 5 (moderate)',
      'Change melody: cost = 20 (expensive)',
      'Restructure form: cost = 50 (very expensive)',
    ],
    references: [
      'src/gofai/planning/cost-hierarchy.ts',
      'gofai_goalB.md Step 255',
    ],
  },

  {
    term: 'holes',
    shortDefinition: 'Unresolved or underspecified parts of CPL that require clarification',
    longDefinition: `Holes are placeholders in CPL representing information that couldn't be
      determined from the input. They mark ambiguities, missing specifications, or unresolved
      references that need user input before planning can proceed.
      
      Types of holes:
      - Reference holes: "it" could refer to multiple entities
      - Amount holes: "brighter" but by how much?
      - Scope holes: No explicit scope and no clear default
      - Parameter holes: "add reverb" but which parameter values?
      
      Hole resolution strategies:
      - Ask user (generate clarification question)
      - Use defaults (if policy allows and defaults are safe)
      - Show multiple options (present alternatives for selection)
      - Infer from context (if sufficient information available)
      
      Holes are explicit in the representation, never silently defaulted. This ensures
      the system never acts on guesses without user awareness.`,
    category: 'semantics',
    relatedTerms: [
      'clarification',
      'ambiguity',
      'underspecification',
      'pragmatic resolution',
      'defaults',
    ],
    examples: [
      'hole(type=referent, candidates=[chorus_1, chorus_2])',
      'hole(type=amount, axis=brightness, range=[small, moderate, large])',
      'hole(type=scope, options=[selection, focused_section, all])',
    ],
    references: [
      'src/gofai/pipeline/ambiguity-policy.ts',
      'src/gofai/interaction/clarification.ts',
    ],
  },

  // ===========================================================================
  // Execution Terms
  // ===========================================================================
  {
    term: 'diff',
    shortDefinition: 'A structured description of changes between two project states',
    longDefinition: `A diff is a detailed record of what changed when a plan was executed.
      Diffs are the primary mechanism for:
      - Explaining what happened
      - Verifying constraints were respected
      - Supporting undo/redo
      - Auditing edit history
      
      Diff structure:
      - Before/after snapshots (of affected entities)
      - Change records (adds, removes, modifications)
      - Affected scopes and entities
      - Provenance traces (which opcode caused which change)
      - Constraint verification results
      - Human-readable summary
      
      Diffs are:
      - Deterministic: Same plan → same diff (modulo timestamps)
      - Reversible: Every diff can be inverted for undo
      - Compositional: Diffs can be sequenced, merged, or rebased
      - Inspectable: Users can drill into any level of detail`,
    category: 'execution',
    relatedTerms: [
      'execution',
      'undo',
      'provenance',
      'explanation',
      'verification',
      'audit',
    ],
    examples: [
      'Diff: Chorus bars 16-24: EQ +3dB@8kHz, 14 events quantized, reverb mix 20%→15%',
      'Diff: Bass track: 8 notes shifted -10ms, velocity variance reduced 30%',
    ],
    references: [
      'src/gofai/execution/diff-generation.ts',
      'gofai_goalB.md Phase 6',
    ],
  },

  {
    term: 'undo token',
    shortDefinition: 'A linear resource that enables deterministic undo of an applied edit',
    longDefinition: `An undo token is an opaque value returned when applying a plan that can be
      consumed exactly once to undo that specific edit. Tokens are "linear resources" in the
      type-theoretic sense: they cannot be duplicated or discarded; they must be used.
      
      Properties:
      - One token per edit package
      - Token encodes full inverse operation
      - Using token removes it from undo stack
      - Tokens can become invalid (if project state changes incompatibly)
      - Token includes diff for inspection before undo
      
      This design ensures:
      - Undo is always explicit and trackable
      - No silent rollbacks or mysterious state changes
      - Undo stack management is clear and predictable
      - Users can inspect what undo will do before doing it`,
    category: 'execution',
    relatedTerms: ['undo', 'execution', 'edit package', 'linear resource', 'diff'],
    examples: [
      'token = apply(plan) → UndoToken{editId=42, diff=...}',
      'undo(token) → restore previous state, consume token',
    ],
    references: [
      'gofai_goalB.md Step 035',
      'src/gofai/execution/undo-tokens.ts',
    ],
  },

  {
    term: 'edit package',
    shortDefinition: 'The atomic unit of applied edit containing CPL, plan, diff, and provenance',
    longDefinition: `An edit package is the complete record of a successfully executed edit.
      It is the unit stored in history, serialized for sharing, and used for undo/redo.
      
      Contents:
      - Original CPL-Intent (what user asked for)
      - Resolved CPL-Plan (what was planned)
      - Execution diff (what actually changed)
      - Provenance traces (why each change was made)
      - Undo token (how to reverse)
      - Metadata (timestamp, compiler version, user)
      - Verification results (constraint checks passed)
      
      Edit packages are:
      - Atomic: Succeed or fail as a unit
      - Serializable: Can be saved, shared, replayed
      - Inspectable: Users can examine all details
      - Replayable: Can be reapplied to compatible projects
      - Auditable: Full audit trail for every edit`,
    category: 'execution',
    relatedTerms: [
      'execution',
      'undo',
      'diff',
      'provenance',
      'serialization',
      'history',
    ],
    examples: [
      'EditPackage{intent=brighten(chorus), plan=[eq, voicing], diff=..., token=...}',
    ],
    references: [
      'gofai_goalB.md Step 301',
      'src/gofai/execution/edit-package.ts',
    ],
  },

  {
    term: 'provenance',
    shortDefinition: 'The traceable history of how a decision or value was derived',
    longDefinition: `Provenance is the record of how every part of the compilation and execution
      process was determined. It answers questions like:
      - Why did this word map to this meaning?
      - Why was this entity chosen as referent?
      - Why did this goal lead to this opcode?
      - Why did this parameter get this value?
      
      Provenance chains:
      - Lexical: Word → lemma → sense ID → semantic value
      - Pragmatic: Expression → candidate referents → resolution rule → chosen entity
      - Planning: Goal → lever mapping → opcode selection → parameter inference
      - Execution: Opcode → affected entities → actual changes
      
      Provenance enables:
      - Explanation generation
      - Debugging (why did it do that?)
      - User trust (I can verify the reasoning)
      - Reproducibility (replay with same provenance)
      - Extension attribution (which pack provided this meaning?)`,
    category: 'infrastructure',
    relatedTerms: [
      'explanation',
      'audit',
      'debugging',
      'trust',
      'attribution',
      'lineage',
    ],
    examples: [
      'Provenance: "darker" → lexeme:dark → axis:brightness(decrease) → eq_cut(band=high)',
      'Provenance: "it" → anaphora → salience(chorus_1) → scope(section=chorus_1)',
    ],
    references: [
      'src/gofai/pipeline/provenance.ts',
      'gofai_goalB.md Step 265',
    ],
  },

  // ===========================================================================
  // Pragmatics Terms
  // ===========================================================================
  {
    term: 'anaphora',
    shortDefinition: 'Reference back to an entity mentioned earlier in discourse',
    longDefinition: `Anaphora is a linguistic reference that depends on prior context to determine
      its referent. Common anaphoric expressions:
      - Pronouns: "it", "that", "them", "its"
      - Demonstratives: "this one", "those"
      - Definite descriptions: "the previous section"
      - Elided phrases: "do it again" (elided action)
      
      Resolution:
      - Maintain discourse history of mentioned entities
      - Track salience (recency, focus, prominence)
      - Match syntactic/semantic constraints (number, type)
      - Prefer most salient compatible referent
      - Ask for clarification if ambiguous
      
      Anaphora is critical for natural interaction:
      - "Make the chorus brighter. Now wider." (implicit: same chorus)
      - "Add reverb to the vocals. Reduce it a bit." (it = reverb amount)`,
    category: 'pragmatics',
    relatedTerms: [
      'referent',
      'salience',
      'deixis',
      'discourse history',
      'resolution',
    ],
    examples: [
      '"Make it darker" → resolve "it" to most salient section/layer',
      '"Do that again" → resolve "that" to most salient prior edit',
      '"them" → resolve to most salient plural entity (e.g., selected notes)',
    ],
    references: [
      'src/gofai/pragmatics/anaphora-resolution.ts',
      'src/gofai/infra/salience-tracker.ts',
    ],
  },

  {
    term: 'deixis',
    shortDefinition: 'Reference that depends on the immediate context or situation',
    longDefinition: `Deixis (pointing) is reference that depends on the speech situation:
      where, when, and by whom something is said.
      
      Types relevant to GOFAI:
      - Spatial: "this section", "here" → currently visible/focused region
      - Temporal: "now", "currently" → focused timeline position
      - Discourse: "the following", "above" → structural position in utterance
      - Selection: "these notes", "the selected region" → UI selection
      
      Resolution:
      - Spatial: Use current viewport, cursor position, zoom level
      - Selection: Use current selection state
      - Focus: Use focused deck, board, or timeline range
      - Context: Use speech situation model (who's speaking, what's focused)
      
      Deictic resolution is more immediate than anaphoric: it points to the
      current situation rather than discourse history.`,
    category: 'pragmatics',
    relatedTerms: [
      'anaphora',
      'referent',
      'speech situation',
      'selection',
      'focus',
    ],
    examples: [
      '"this section" → currently focused section in timeline',
      '"here" → current playhead position or viewport',
      '"these notes" → currently selected MIDI notes',
    ],
    references: [
      'src/gofai/pragmatics/deictic-resolution.ts',
      'gofai_goalB.md Step 073',
    ],
  },

  {
    term: 'dialogue state',
    shortDefinition: 'The accumulated context from conversation history',
    longDefinition: `Dialogue state is the representation of the ongoing conversation context,
      tracking everything needed for pragmatic resolution and coherent interaction.
      
      Components:
      - Discourse history: Recent utterances and their interpretations
      - Salience rankings: Which entities are prominent
      - QUD stack: Questions Under Discussion (current topics/goals)
      - Commitment slate: What's been agreed or established
      - Pending clarifications: Outstanding questions
      - Applied edits: Recent edit packages
      
      Dialogue state evolves:
      - Each utterance updates salience
      - Clarifications resolve holes and update commitments
      - Edits add to history and may close QUDs
      - Time decay reduces salience of old entities
      
      State is used for:
      - Anaphora resolution
      - Determining what's discourse-given vs new
      - Generating contextually appropriate responses
      - Managing multi-turn interactions`,
    category: 'pragmatics',
    relatedTerms: [
      'salience',
      'anaphora',
      'QUD',
      'discourse history',
      'pragmatic resolution',
    ],
    examples: [
      'After "brighten the chorus", dialogue state records: focused(chorus), goal(brighten)',
      'User says "now make it wider" → resolves "it" from state (chorus)',
    ],
    references: [
      'src/gofai/pragmatics/dialogue-state.ts',
      'src/gofai/infra/salience-tracker.ts',
    ],
  },

  {
    term: 'QUD',
    shortDefinition: 'Question Under Discussion: the implicit question the utterance addresses',
    longDefinition: `QUD (Question Under Discussion) is a pragmatic theory that models discourse
      as answering implicit questions. Every utterance either raises a question or provides
      information relevant to answering the current question.
      
      In GOFAI:
      - Directive utterances raise QUD: "What edit should be applied?"
      - Clarification questions raise sub-QUDs: "Which chorus did you mean?"
      - Answers resolve QUDs and may trigger execution
      - QUD stack tracks nested questions (main goal, clarifications, follow-ups)
      
      QUD management:
      - Push: User request raises new QUD
      - Pop: Clarification answer resolves QUD, return to parent
      - Shift: User changes topic, stack restructures
      
      Benefits:
      - Models natural conversation flow
      - Handles interruptions and topic shifts
      - Manages nested clarifications
      - Determines when interaction is "complete"`,
    category: 'pragmatics',
    relatedTerms: [
      'dialogue state',
      'clarification',
      'discourse structure',
      'coherence',
    ],
    examples: [
      'User: "Make it darker" → QUD: "How should darkness be adjusted?"',
      'System: "Which section?" → Sub-QUD: "Which section is meant?"',
      'User: "The chorus" → Resolves sub-QUD, returns to parent QUD',
    ],
    references: [
      'src/gofai/pragmatics/qud-management.ts',
      'gofaimusicplus.md §5.2',
    ],
  },

  // ===========================================================================
  // Type System Terms
  // ===========================================================================
  {
    term: 'axis',
    shortDefinition: 'A perceptual or musical dimension along which qualities vary',
    longDefinition: `An axis is a dimension of musical variation that can be adjusted directionally.
      Axes bridge the gap between perceptual language ("darker", "wider") and concrete parameters.
      
      Types of axes:
      - Perceptual: brightness, width, depth, weight, warmth
      - Musical: density, register, complexity, tension
      - Production: loudness, clarity, presence
      - Temporal: tempo, groove tightness
      
      Axis properties:
      - Direction: increase/decrease
      - Scale: continuous, discrete, ordinal
      - Range: bounded or unbounded
      - Polarity: bipolar (bright↔dark) or unipolar (loud↔quiet)
      - Compositionality: Some axes are combinations (energy = tempo + density + dynamics)
      
      Axes map to levers in planning: adjusting an axis triggers lever selection,
      which generates opcodes that implement the adjustment.`,
    category: 'types',
    relatedTerms: [
      'lever',
      'perceptual dimension',
      'goal',
      'adjective',
      'modifier',
    ],
    examples: [
      'axis:brightness (increase = brighter, decrease = darker)',
      'axis:width (increase = wider, decrease = narrower)',
      'axis:density (increase = busier, decrease = sparser)',
    ],
    references: [
      'src/gofai/canon/perceptual-axes-batch1.ts',
      'src/gofai/planning/axis-to-levers.ts',
    ],
  },

  {
    term: 'capability',
    shortDefinition: 'A permission or environmental feature that enables certain operations',
    longDefinition: `Capabilities define what the GOFAI system is allowed to do in the current
      context. They form a lattice from most restrictive to most permissive:
      
      Capability hierarchy:
      - Inspect-only: Can parse, analyze, explain, but not modify
      - Preview: Can generate plans and show previews
      - Execute-safe: Can execute low-risk operations (mixing, effects)
      - Execute-events: Can modify MIDI events (notes, timing)
      - Execute-structure: Can modify project structure (sections, routing)
      - Execute-any: No restrictions (full manual override)
      
      Capability gating:
      - Board policies set default capabilities
      - User settings can further restrict
      - Some operations require explicit capability elevation
      - Extensions may require additional capabilities
      
      Capabilities prevent:
      - Accidental destructive edits
      - Violating manual board discipline
      - Extension security issues`,
    category: 'types',
    relatedTerms: [
      'effect taxonomy',
      'board policy',
      'safety',
      'permissions',
      'execution',
    ],
    examples: [
      'capability:preview_only → plans can be generated but not applied',
      'capability:execute_safe → mixing edits OK, structural edits blocked',
      'capability:execute_structure → can rearrange sections, add markers',
    ],
    references: [
      'src/gofai/canon/capability-model.ts',
      'gofai_goalB.md Step 063',
    ],
  },

  {
    term: 'selector',
    shortDefinition: 'A query expression that matches entities in the project',
    longDefinition: `A selector is a typed query that specifies which entities in the CardPlay
      project an operation should apply to. Selectors are compositional and type-safe.
      
      Selector types:
      - Range selectors: bars(8,12), time(0:30, 1:00)
      - Layer selectors: layer(role=drums), track(name="Bass")
      - Event selectors: events(pitch=C4), events(tag=kick)
      - Section selectors: section(type=chorus), section(id=intro_1)
      - Card selectors: card(type=filter), card(id=reverb_42)
      - Compound selectors: intersect, union, difference
      
      Evaluation:
      - Selectors are evaluated against current project state
      - Return sets of entity IDs
      - Can be validated before execution (do they match anything?)
      - Support quantification (all, any, exactly N)
      
      Safety:
      - Selectors cannot escape their declared scope
      - Type system prevents nonsensical selectors (events on audio tracks)
      - Empty results handled explicitly (clarification or no-op)`,
    category: 'types',
    relatedTerms: ['scope', 'entity', 'query', 'validation', 'type safety'],
    examples: [
      'selector: section(type=chorus) ∧ bars(16,24)',
      'selector: events(layer=drums, pitch_class=C)',
      'selector: cards(type=eq) ∧ in_scope(chorus)',
    ],
    references: [
      'src/gofai/canon/selector-types.ts',
      'src/gofai/planning/scope-validation.ts',
    ],
  },

  // ===========================================================================
  // Extension System Terms
  // ===========================================================================
  {
    term: 'namespace',
    shortDefinition: 'A prefix that scopes extension-provided identifiers',
    longDefinition: `A namespace is a string prefix that qualifies all IDs contributed by an
      extension. Namespaces prevent collisions and enable provenance tracking.
      
      Rules:
      - Core GOFAI IDs have no namespace prefix
      - Extension IDs must be: namespace:category:name
      - Namespace must match providing pack's namespace
      - Namespace cannot be "gofai" or "cardplay" (reserved)
      
      Examples:
      - Core: axis:brightness, op:quantize, lex:verb:darken
      - Extension: mypack:axis:grit, mypack:op:stutter, mypack:lex:verb:chop
      
      Benefits:
      - Clear provenance (which pack provided this?)
      - No collisions (two packs can both define "grit")
      - Security (can disable all ops from untrusted namespace)
      - Debugging (filter to specific pack's contributions)
      
      Enforcement:
      - Compile-time checks reject malformed IDs
      - Runtime checks verify namespace matches pack
      - Documentation requires namespace in all examples`,
    category: 'extension',
    relatedTerms: [
      'extension',
      'provenance',
      'GofaiId',
      'vocabulary policy',
      'isolation',
    ],
    examples: [
      'Correct: mypack:axis:grit',
      'Incorrect: axis:mypack:grit (namespace in wrong position)',
      'Incorrect: grit (no namespace for extension)',
    ],
    references: [
      'src/gofai/canon/vocabulary-policy.ts',
      'gofai_goalB.md Step 004',
    ],
  },

  {
    term: 'extension',
    shortDefinition: 'A pack-provided module that extends GOFAI vocabulary, grammar, or capabilities',
    longDefinition: `An extension is a collection of GOFAI artifacts provided by a CardPlay pack
      to add language support for pack-specific cards, decks, boards, and musical concepts.
      
      Extension components:
      - Lexicon: New words, synonyms, lexeme senses
      - Grammar: New syntactic constructions
      - Semantics: New semantic types and meaning compositions
      - Opcodes: New edit operations
      - Constraints: New constraint types
      - Prolog: New theory predicates and facts
      - Levers: New axis-to-opcode mappings
      
      Extension lifecycle:
      - Register: Pack loads, extension registers with GOFAI
      - Activate: User enables extension (opt-in for execution)
      - Integrate: Vocabulary merged into symbol table
      - Use: Lexemes, opcodes available for parsing/planning
      - Unregister: Pack unloads, extension removed cleanly
      
      Safety:
      - Extensions cannot modify core behavior
      - Execution gated by user permission
      - Isolation prevents extensions from interfering`,
    category: 'extension',
    relatedTerms: [
      'namespace',
      'pack',
      'registry',
      'isolation',
      'auto-binding',
      'Prolog',
    ],
    examples: [
      'Extension adds: "stutter" verb → mypack:op:stutter opcode',
      'Extension adds: "grit" axis → maps to bitcrusher params',
      'Extension adds: Prolog predicates for microtonal scales',
    ],
    references: [
      'gofai_goalB.md Phase 8',
      'src/gofai/extension/registry.ts',
    ],
  },

  {
    term: 'auto-binding',
    shortDefinition: 'Automatic registration of pack entities as GOFAI referents',
    longDefinition: `Auto-binding is the process by which CardPlay entities (cards, boards, decks)
      automatically become available for natural language reference without explicit extension code.
      
      What gets auto-bound:
      - Card types: Every registered card becomes a noun ("add a reverb")
      - Card instances: Named cards become unique referents ("the master reverb")
      - Board types: Boards become referable ("switch to tracker")
      - Deck types: Deck kinds become referable ("open the mixer")
      - Deck instances: Deck instances become contextual refs ("that deck")
      
      Auto-binding uses metadata:
      - Display names → lexical variants
      - IDs → stable referents
      - Type info → semantic categories
      - Descriptions → help text
      
      Override:
      - Packs can provide explicit GOFAI metadata to control binding
      - Synonyms, example phrases, semantic roles can be declared
      - Without overrides, reasonable defaults used`,
    category: 'extension',
    relatedTerms: [
      'extension',
      'symbol table',
      'referent',
      'entity binding',
      'metadata',
    ],
    examples: [
      'Card "Stereo Delay" auto-binds to nouns: ["delay", "stereo delay"]',
      'Board "Tracker" auto-binds to referent: board(type=tracker)',
      'Deck instance binds to: deck(instanceId=mixer_1)',
    ],
    references: [
      'gofai_goalB.md Step 066',
      'src/gofai/extension/auto-binding.ts',
    ],
  },

  // ===========================================================================
  // Infrastructure Terms
  // ===========================================================================
  {
    term: 'determinism',
    shortDefinition: 'The guarantee that the same input always produces the same output',
    longDefinition: `Determinism is a core requirement for the offline GOFAI compiler: given
      identical inputs (utterance, project state, dialogue state), the system must produce
      identical outputs (CPL, plan, diff).
      
      Why determinism matters:
      - Reproducibility: Bugs can be reliably reproduced
      - Testing: Golden tests remain stable
      - Sharing: Saved plans replay identically
      - Trust: Users can understand and predict behavior
      - Debugging: Provenance traces are consistent
      
      Sources of non-determinism to avoid:
      - Random choices (use deterministic tie-breakers instead)
      - Time-based decisions (use logical time, not wall clock)
      - Hash map iteration (use stable sorting)
      - Floating point (careful with comparison and rounding)
      - Async race conditions (synchronize properly)
      
      Enforcement:
      - Linters flag Date.now(), Math.random() in core paths
      - Tests run twice and assert identical output
      - Serialization is order-stable`,
    category: 'infrastructure',
    relatedTerms: [
      'reproducibility',
      'testing',
      'stability',
      'offline',
      'compiler',
    ],
    examples: [
      'Same utterance + project → same CPL (always)',
      'Same plan → same diff (modulo timestamps)',
      'Replay conversation → identical plan sequence',
    ],
    references: [
      'src/gofai/infra/deterministic-ordering.ts',
      'gofai_goalB.md Step 033',
    ],
  },

  {
    term: 'offline',
    shortDefinition: 'Operating entirely locally without network dependencies',
    longDefinition: `Offline operation means the GOFAI system runs entirely on the local machine
      with no required network access. This is a core design principle for:
      
      Reasons:
      - Privacy: No user data leaves machine
      - Reliability: Works on planes, in studios, anywhere
      - Latency: No network round-trips, instant feedback
      - Cost: No API fees, no usage limits
      - Control: Deterministic, auditable, no black boxes
      
      Requirements:
      - All lexicons, grammars bundled with app
      - All reasoning (parsing, planning) runs locally
      - Prolog KB embedded, no external queries
      - No LLM API calls in runtime path
      
      Allowed network use:
      - Optional telemetry (anonymized, opt-in)
      - Pack installation (outside runtime)
      - Extension downloads (outside runtime)
      - Help/docs (separate from core operation)`,
    category: 'infrastructure',
    relatedTerms: [
      'determinism',
      'privacy',
      'reliability',
      'compiler',
      'local-first',
    ],
    examples: [
      'Parser runs entirely in-process (no API)',
      'Planning uses local Prolog KB (no queries)',
      'Execution manipulates local project state only',
    ],
    references: [
      'gofaimusicplus.md §1',
      'gofai_goalB.md Step 050',
    ],
  },

  {
    term: 'telemetry',
    shortDefinition: 'Optional anonymized logging of errors and ambiguities for system improvement',
    longDefinition: `Telemetry is an optional, local-only logging system that captures:
      - Parse failures
      - Ambiguities that required clarification
      - Constraint violations
      - User overrides of default plans
      - Error cases
      
      Properties:
      - Opt-in: Disabled by default
      - Local: Logs stored locally, never auto-uploaded
      - Anonymized: No project content, no identifying info
      - Auditable: User can inspect logs anytime
      - Deletable: User can clear logs
      
      Purpose:
      - Identify common failure modes
      - Improve vocabulary coverage
      - Refine disambiguation heuristics
      - Find gaps in constraint modeling
      
      NOT used for:
      - Training AI models
      - Sending data to external services
      - Tracking individual users`,
    category: 'infrastructure',
    relatedTerms: [
      'privacy',
      'evaluation',
      'debugging',
      'improvement',
      'offline',
    ],
    examples: [
      'Log: Failed to parse "make it groovy" (no sense for "groovy")',
      'Log: Ambiguity: "the chorus" → [chorus_1, chorus_2]',
      'Log: Constraint violation: Plan modified melody despite preserve(melody)',
    ],
    references: ['gofai_goalB.md Step 046'],
  },

  {
    term: 'golden test',
    shortDefinition: 'A test that asserts output matches a known-good reference',
    longDefinition: `A golden test (aka snapshot test) compares system output to a stored reference
      output (the "golden" expected result). Golden tests are critical for:
      
      What golden tests cover:
      - NL→CPL mappings (utterance → expected CPL-Intent)
      - Planning (CPL-Intent + fixture → expected plans)
      - Execution (plan + fixture → expected diff)
      - Paraphrase invariance (different phrasings → same CPL)
      
      Golden test discipline:
      - Goldens are version controlled
      - Changing a golden requires explicit rationale + review
      - Golden diffs must be inspected (no blind acceptance)
      - Golden coverage is tracked (what's tested vs what exists)
      
      Benefits:
      - Catch regressions immediately
      - Document expected behavior
      - Enable fearless refactoring
      - Ensure determinism (same input → same golden)`,
    category: 'infrastructure',
    relatedTerms: [
      'testing',
      'determinism',
      'regression',
      'validation',
      'paraphrase invariance',
    ],
    examples: [
      'Golden: "make it darker" → CPL{adjust, axis:brightness, direction:decrease}',
      'Golden: "brighten the chorus" → CPL with scope(section=chorus)',
      'Golden diff: Applying plan to fixture_A yields exactly diff_A',
    ],
    references: [
      'gofai_goalB.md Step 006, 452',
      'src/gofai/testing/golden-tests.ts',
    ],
  },

  {
    term: 'paraphrase invariance',
    shortDefinition: 'The property that different phrasings of the same intent yield the same CPL',
    longDefinition: `Paraphrase invariance is the requirement that semantically equivalent
      natural language expressions must compile to equivalent CPL-Intent, despite surface differences.
      
      Examples:
      - "make it darker" ≅ "darken it" ≅ "reduce brightness"
      - "in the chorus" ≅ "during the chorus" ≅ "for the chorus"
      - "only change the bass" ≅ "just the bass" ≅ "bass only"
      
      Why it matters:
      - Users shouldn't need to learn "magic phrases"
      - Natural variation in speech must be handled
      - Robustness to different speaking styles
      
      Testing:
      - Golden tests include paraphrase sets
      - All paraphrases in set must yield same CPL (modulo provenance)
      - Failures indicate missing lexical variants or incomplete grammar
      
      Coverage:
      - Track how many concepts have sufficient paraphrase coverage
      - Prioritize adding variants for common concepts`,
    category: 'infrastructure',
    relatedTerms: [
      'testing',
      'robustness',
      'lexicon',
      'synonyms',
      'golden test',
    ],
    examples: [
      '["brighten", "make brighter", "increase brightness"] → same CPL',
      '["the chorus", "chorus section"] → same scope',
      '["keep melody exact", "preserve the melody"] → same constraint',
    ],
    references: [
      'gofai_goalB.md Step 006, 434',
      'src/gofai/testing/paraphrase-tests.ts',
    ],
  },
];

// =============================================================================
// Glossary Utilities
// =============================================================================

/**
 * Find a glossary entry by term.
 */
export function findGlossaryEntry(term: string): GlossaryEntry | undefined {
  const normalized = term.toLowerCase().trim();
  return GOFAI_GLOSSARY.find(
    (entry) =>
      entry.term.toLowerCase() === normalized ||
      entry.aliases?.some((alias) => alias.toLowerCase() === normalized)
  );
}

/**
 * Get all terms in a category.
 */
export function getTermsByCategory(
  category: GlossaryCategory
): readonly GlossaryEntry[] {
  return GOFAI_GLOSSARY.filter((entry) => entry.category === category);
}

/**
 * Search glossary entries.
 */
export function searchGlossary(query: string): readonly GlossaryEntry[] {
  const q = query.toLowerCase();
  return GOFAI_GLOSSARY.filter(
    (entry) =>
      entry.term.toLowerCase().includes(q) ||
      entry.shortDefinition.toLowerCase().includes(q) ||
      entry.longDefinition.toLowerCase().includes(q) ||
      entry.examples.some((ex) => ex.toLowerCase().includes(q))
  );
}

/**
 * Validate that a term is defined in the glossary.
 * Used in docs linting.
 */
export function validateTermDefined(term: string): boolean {
  return findGlossaryEntry(term) !== undefined;
}

/**
 * Get terms related to a given term.
 */
export function getRelatedTerms(term: string): readonly GlossaryEntry[] {
  const entry = findGlossaryEntry(term);
  if (!entry) return [];

  return entry.relatedTerms
    .map(findGlossaryEntry)
    .filter((e): e is GlossaryEntry => e !== undefined);
}

/**
 * Format a glossary entry for display.
 */
export function formatGlossaryEntry(entry: GlossaryEntry): string {
  const parts: string[] = [
    `## ${entry.term}`,
    '',
    `**Category:** ${entry.category}`,
    '',
    `**Definition:** ${entry.shortDefinition}`,
    '',
    entry.longDefinition,
    '',
  ];

  if (entry.aliases && entry.aliases.length > 0) {
    parts.push(`**Also known as:** ${entry.aliases.join(', ')}`, '');
  }

  if (entry.examples.length > 0) {
    parts.push('**Examples:**', '');
    for (const example of entry.examples) {
      parts.push(`- ${example}`);
    }
    parts.push('');
  }

  if (entry.relatedTerms.length > 0) {
    parts.push(`**Related:** ${entry.relatedTerms.join(', ')}`, '');
  }

  if (entry.references && entry.references.length > 0) {
    parts.push('**References:**', '');
    for (const ref of entry.references) {
      parts.push(`- ${ref}`);
    }
    parts.push('');
  }

  return parts.join('\n');
}

/**
 * Generate complete glossary document (Markdown).
 */
export function generateGlossaryMarkdown(): string {
  const sections: string[] = ['# GOFAI Glossary', ''];

  const categories: GlossaryCategory[] = [
    'semantics',
    'pragmatics',
    'syntax',
    'planning',
    'constraints',
    'execution',
    'types',
    'music',
    'infrastructure',
    'extension',
  ];

  for (const category of categories) {
    const entries = getTermsByCategory(category);
    if (entries.length === 0) continue;

    sections.push(`## ${category.charAt(0).toUpperCase() + category.slice(1)}`, '');
    for (const entry of entries) {
      sections.push(formatGlossaryEntry(entry), '');
    }
  }

  return sections.join('\n');
}
