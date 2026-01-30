# GOFAI Music+ Glossary

> Version 2.0.0 | Last updated: 2026-01-30
>
> **Step 016 from gofai_goalB.md**: Comprehensive glossary of key terms (200+ entries)

This glossary defines technical terms used throughout GOFAI Music+. It draws from linguistics, logic, semantics, pragmatics, planning theory, and music theory to establish precise terminology.

**Coverage**: Linguistics (30%), Logic & Semantics (25%), Music Theory (20%), Planning & Execution (15%), System Architecture (10%)

---

## A

### Adjunct
An optional modifier that adds information but is not required by grammar.

**Example**: "Make it brighter *in the chorus*" (*in the chorus* is an adjunct specifying scope)

**GOFAI Treatment**: Adjuncts modify scope or constraints without changing core goal structure.

**Related**: [Scope](#scope), [Modifier](#modifier)

---

### Affordance
A possible action suggested by the current context.

**Example**: If drums are selected, "make it tighter" is an affordance that applies to drum timing.

**GOFAI Treatment**: UI shows affordances derived from dialogue state and capabilities.

**Related**: [Capability](#capability), [Context](#context)

---

### Agent
The entity performing an action in semantic role structure.

**Example**: "The *planner* generates options" (*planner* is agent)

**GOFAI Treatment**: In edit operations, the user is agent, system is instrument.

**Related**: [Patient](#patient), [Semantic Role](#semantic-role)

---

### Ambiguity
A situation where a single linguistic expression has multiple possible interpretations.

**Types**:
- **Lexical ambiguity**: Word has multiple meanings ("bank" = financial institution or river edge)
- **Structural ambiguity**: Sentence structure allows multiple parses ("old men and women")
- **Scope ambiguity**: Quantifier or modifier scope is unclear ("all drums and bass")
- **Referential ambiguity**: Multiple entities could match a description ("the verse")

**GOFAI Treatment**: Never resolve silently; require explicit clarification from user.

**Related**: [Clarification](#clarification), [Silent Ambiguity Prohibition](semantic-safety-invariants.md#silent-ambiguity-prohibition)

---

### Anaphora
A linguistic expression that refers back to a previously mentioned entity.

**Examples**:
- "Make the chorus brighter. Then make *it* louder." (*it* = the chorus)
- "Add drums to verse 1. Copy *them* to verse 2." (*them* = the drums)

**GOFAI Treatment**: Resolve via dialogue state focus stack and salience model.

**Related**: [Referent](#referent), [Salience](#salience), [Dialogue State](#dialogue-state)

---

### Antecedent
The entity that an anaphoric expression refers back to.

**Example**: "Make the *chorus* brighter. Then make it louder." (*chorus* is the antecedent of *it*)

**GOFAI Treatment**: Tracked in focus stack; must be accessible for anaphora to resolve.

**Related**: [Anaphora](#anaphora), [Focus Stack](#focus-stack)

---

### Applicability Condition
A requirement that must hold for an operation to be valid.

**Example**: `raise_register` requires notes to exist in scope.

**GOFAI Treatment**: Checked during planning; violations trigger errors or alternative plans.

**Related**: [Precondition](#precondition), [Validation](#validation)

---

### Argument Structure
The pattern of semantic roles required by a predicate.

**Example**: "Make X Y" requires agent (implicit user), patient (X), result (Y).

**GOFAI Treatment**: Used to validate semantic completeness and resolve holes.

**Related**: [Semantic Role](#semantic-role), [Valency](#valency)

---

### Arity
The number of arguments a predicate or function takes.

**Example**: `preserve(melody, exact)` has arity 2.

**GOFAI Treatment**: Enforced by type system; mismatched arity causes parse errors.

**Related**: [Predicate](#predicate), [Type System](#type-system)

---

### Articulation
How a musical note is performed (attack, sustain, release characteristics).

**Examples**: staccato, legato, marcato, tenuto

**GOFAI Treatment**: Mapped to envelope parameters or MIDI articulation attributes.

**Related**: [Envelope](#envelope), [Performance](#performance)

---

### Assertion
A statement that something is true.

**Example**: "The chorus is at bar 8" asserts chorus location.

**GOFAI Treatment**: Assertions update world model or trigger validation checks.

**Related**: [World Model](#world-model), [Belief State](#belief-state)

---

### Attachment Ambiguity
Uncertainty about which constituent a modifier attaches to.

**Example**: "Make the bass and drums louder" — does "louder" apply to both or just drums?

**GOFAI Treatment**: Resolved via coordination scope rules or clarification.

**Related**: [Coordination](#coordination), [Ambiguity](#ambiguity)

---

### Attribute
A property of an entity.

**Examples**: pitch (of note), tempo (of section), brightness (of timbre)

**GOFAI Treatment**: Attributes are typed and have refinement constraints.

**Related**: [Entity](#entity), [Refinement](#refinement)

---

### Axis (Perceptual Axis)
An abstract dimension of musical quality that users describe with adjectives.

**Examples**:
- **Brightness**: Timbral brightness (darker ↔ brighter)
- **Energy**: Overall activity and impact (calmer ↔ more energetic)
- **Width**: Stereo spread (narrower ↔ wider)
- **Tightness**: Rhythmic precision (looser ↔ tighter)
- **Tension**: Harmonic/melodic tension (resolved ↔ tense)

**GOFAI Representation**: Each axis maps to concrete levers (parameter changes, edit operations).

**Related**: [Lever](#lever), [Perceptual Axes](perceptual-axes.md)

---

## B

### Backoff Strategy
A fallback approach when primary resolution fails.

**Example**: If named reference fails, try fuzzy matching; if that fails, ask user.

**GOFAI Treatment**: Defined for each resolution stage with clear priority ordering.

**Related**: [Fuzzy Matching](#fuzzy-matching), [Resolution](#resolution)

---

### Beam Search
A bounded search algorithm that keeps top N candidates at each step.

**GOFAI Usage**: Planning uses beam search to explore edit options without exhaustive search.

**Related**: [Planning](#planning), [Search Strategy](#search-strategy)

---

### Belief State
The system's model of what is currently true about the project.

**Contents**: Section structure, layer assignments, key/tempo, card configuration

**GOFAI Treatment**: Updated after edits; used to validate preconditions and answer questions.

**Related**: [World Model](#world-model), [Context](#context)

---

### Binding
The association between a reference and its referent.

**Example**: "the chorus" binds to `section-id-123`

**GOFAI Treatment**: Bindings created during pragmatic resolution; stored in CPL with provenance.

**Related**: [Referent](#referent), [Entity Reference](#entity-reference)

---

### Board Policy
The set of capabilities and constraints enforced by a board mode.

**Examples**:
- `full-manual`: No AI execution without explicit confirmation
- `ai-assisted`: Preview required for mutations
- `sandbox`: Unrestricted experimentation

**GOFAI Treatment**: Policy gates which operations can execute automatically.

**Related**: [Capability](#capability), [Effect Type](#effect-type)

---

### Boundedness
The property that an operation has finite, predictable resource usage.

**GOFAI Requirement**: All parsing, planning, and execution must complete in bounded time/memory.

**Related**: [Determinism](#determinism), [Performance](#performance)

---

### Branching Factor
The average number of options at each decision point.

**Example**: Planning may have 5 lever choices per axis, yielding high branching.

**GOFAI Treatment**: Controlled via beam search, pruning, and early stopping.

**Related**: [Beam Search](#beam-search), [Planning](#planning)

---

## C

### Cadence
A harmonic progression that establishes closure.

**Types**: Authentic, half, deceptive, plagal

**GOFAI Treatment**: Recognized by Prolog theory module; used in structural analysis.

**Related**: [Harmony](#harmony), [Theory Module](#theory-module)

---

### Canonical Form
A standardized representation used internally.

**Example**: "hi-hats" → "hats"; "bpm" → "BPM"

**GOFAI Treatment**: Normalization produces canonical forms for consistent matching.

**Related**: [Normalization](#normalization), [Lemma](#lemma)

---

### Capability
A permission or feature that must be available for an operation to execute.

**Examples**:
- `production-editing` — Can modify DSP parameters
- `routing-editing` — Can change signal routing
- `ai-execution` — Can run AI-assisted operations

**GOFAI Treatment**: Operations check required capabilities before execution; missing capabilities cause graceful failure.

**Related**: [Effect Type](#effect-type), [Board Policy](#board-policy)

---

### Cardinality
The number of entities in a set.

**Example**: "all verses" has cardinality 3 if there are 3 verses.

**GOFAI Treatment**: Used in quantification and validation ("at least 2 verses required").

**Related**: [Quantification](#quantification), [Selector](#selector)

---

### Categorial Grammar
A grammar formalism where words have types encoding their combinatory behavior.

**GOFAI Usage**: Influences semantic composition where adjectives and verbs combine via function application.

**Related**: [Semantic Composition](#semantic-composition), [Type System](#type-system)

---

### Centroid
A representative point in a semantic space.

**Example**: "dark" maps to low spectral centroid.

**GOFAI Treatment**: Used in fuzzy matching and perceptual axis calibration.

**Related**: [Perceptual Space](#perceptual-space), [Axis](#axis)

---

### Clarification
A targeted question asked when input is ambiguous or underspecified.

**Properties**:
- **Question text**: Human-readable question
- **Options**: Available choices
- **Default**: Suggested answer (user can override)
- **Impact**: What choosing each option affects

**Example**:
```
"By 'darker', do you mean:
 - Timbre (lower brightness, warmer)
 - Harmony (more minor/modal)
 - Register (lower pitch range)
Default: Timbre"
```

**GOFAI Treatment**: Generated when semantic invariants detect ambiguity; user must resolve before execution.

**Related**: [Ambiguity](#ambiguity), [QUD](#qud)

---

### Cloze Task
A task where the system fills in missing information.

**Example**: "Make it ___" where ___ is inferred from context (e.g., "brighter" if discussing timbre).

**GOFAI Treatment**: Pragmatic resolution attempts to fill holes; failures trigger clarification.

**Related**: [Hole](#hole), [Pragmatics](#pragmatics)

---

### Coercion
Converting a value from one type to another.

**Examples**:
- "12k" → 12000 Hz
- "+3dB" → numeric gain value
- "a little" → small magnitude

**GOFAI Treatment**: Type-safe coercion with provenance; unsafe coercions rejected.

**Related**: [Type System](#type-system), [Unit System](#unit-system)

---

### Coherence
The property that discourse maintains consistent topic and relationships.

**Example**: "Make the chorus brighter. Then widen it." maintains coherence (both modify chorus).

**GOFAI Treatment**: Tracked via discourse segments and topic continuity.

**Related**: [Dialogue State](#dialogue-state), [Topic](#topic)

---

### Compositional Semantics
The principle that meaning of complex expressions derives from parts and their combination.

**Example**: "make" + "brighter" + "in chorus" → compose to form complete intent.

**GOFAI Implementation**: Systematic composition rules at syntax-semantics interface.

**Related**: [Semantic Composition](#semantic-composition), [Parsing](#parsing)

---

### Compositionality
See [Compositional Semantics](#compositional-semantics).

---

### Concurrency
Multiple operations happening simultaneously.

**GOFAI Constraint**: Edits are serialized; only one mutation at a time to maintain consistency.

**Related**: [Transaction](#transaction), [Isolation](#isolation)

---

### Conditional
An operation that depends on a test.

**Example**: "If there's a bass, make it quieter" — execution conditional on bass presence.

**GOFAI Treatment**: Conditionals become preconditions; failed conditionals skip operation or trigger clarification.

**Related**: [Precondition](#precondition), [Guard](#guard)

---

### Confidence Score
A measure of how certain the system is about a decision.

**Factors**: Parse ambiguity, binding certainty, constraint risk

**GOFAI Treatment**: Low confidence triggers preview mode or clarification.

**Related**: [Ambiguity](#ambiguity), [Preview](#preview)

---

### Conflict
When multiple goals or constraints cannot be simultaneously satisfied.

**Example**: "Make it louder but quieter" is conflicting.

**GOFAI Treatment**: Conflicts detected early; structured error report with explanation.

**Related**: [Constraint](#constraint), [Goal](#goal)

---

### Conjunction
Combining multiple elements with "and".

**Example**: "Make it brighter and tighter" — two goals coordinated.

**GOFAI Treatment**: Parsed as coordination; both goals must be satisfiable.

**Related**: [Coordination](#coordination), [Disjunction](#disjunction)

---

### Constructional Idiom
A fixed pattern with conventional meaning.

**Example**: "bring X in" means introduce layer X.

**GOFAI Treatment**: Recognized via grammar rules; maps to specific semantic schema.

**Related**: [Grammar](#grammar), [Idiom](#idiom)

---

### Context
The surrounding information that influences interpretation.

**Components**: Dialogue history, UI state, project structure, user preferences

**GOFAI Treatment**: Context threaded through all pipeline stages.

**Related**: [Dialogue State](#dialogue-state), [Situation](#situation)

---

### Contour
The shape of a melodic line (rising, falling, arching, etc.).

**GOFAI Treatment**: Analyzed for melody preservation checks and planning.

**Related**: [Melody](#melody), [Preservation](#preservation)

---

### Contrast
Difference between two entities or states.

**Example**: "Make the verse quieter than the chorus" establishes contrast.

**GOFAI Treatment**: Comparative structures create relative constraints.

**Related**: [Comparative](#comparative), [Relative Scope](#relative-scope)

---

### Control Flow
The order in which operations execute.

**GOFAI Constraint**: Deterministic, explicit sequencing; no implicit parallelism.

**Related**: [Determinism](#determinism), [Transaction](#transaction)

---

### Cooperative Principle
The assumption that speakers are trying to be informative, truthful, relevant, and clear.

**GOFAI Application**: Guides pragmatic reasoning and default inference.

**Related**: [Gricean Maxims](#gricean-maxims), [Implicature](#implicature)

---

### Coordination
Combining elements of same type with conjunctions.

**Example**: "drums and bass" coordinates two layers.

**Types**: Conjunctive (and), disjunctive (or), adversative (but)

**GOFAI Treatment**: Parsed specially to create sets or alternatives.

**Related**: [Conjunction](#conjunction), [Scope](#scope)

---

### Cost Model
A function assigning cost to operations.

**Factors**: Disruptiveness, computational expense, risk, user preference

**GOFAI Usage**: Planning minimizes total cost while satisfying goals.

**Related**: [Planning](#planning), [Lever](#lever), [Optimization](#optimization)

---

### Counterexample
An instance that violates a claimed property.

**Example**: If "preserve melody exact" claimed but note changed, that note is counterexample.

**GOFAI Treatment**: Constraint checkers report counterexamples for debugging.

**Related**: [Constraint](#constraint), [Validation](#validation)

---

### Coverage
The extent to which vocabulary handles user expressions.

**Measurement**: % of test utterances that parse successfully.

**GOFAI Goal**: >90% coverage for domain-typical expressions.

**Related**: [Vocabulary](#vocabulary), [Lexeme](#lexeme)

---

### Constraint
A requirement that limits what edits are allowed.

**Types**:
- **Preserve constraint**: Keep something unchanged (e.g., `preserve(melody, exact)`)
- **Only-change constraint**: Modify only specific aspects (e.g., `only_change(drums)`)
- **Refinement constraint**: Value must satisfy condition (e.g., `BPM > 0`, `width ∈ [0,1]`)

**Properties**:
- **Hard constraint**: Must be satisfied (violation blocks execution)
- **Soft constraint**: Preference (influences planning but can be overridden)

**GOFAI Treatment**: Every constraint has an executable verifier; violations produce structured error reports.

**Related**: [Semantic Safety Invariants](semantic-safety-invariants.md#constraint-executability), [Goal](#goal), [Preference](#preference)

---

### Contraction
Shortening of an expression ("don't" from "do not").

**GOFAI Treatment**: Normalized during tokenization for consistent parsing.

**Related**: [Normalization](#normalization), [Tokenization](#tokenization)

---

### Conversational Move
An action in dialogue (request, clarification, confirmation, etc.).

**GOFAI Moves**:
- **Request**: User asks for edit
- **Clarify**: System asks question
- **Confirm**: User approves plan
- **Reject**: User declines option
- **Query**: User asks about state

**Related**: [Dialogue State](#dialogue-state), [Turn](#turn)

---

### Corpus
A collection of examples for training or testing.

**GOFAI Corpora**:
- Golden examples (canonical input→output pairs)
- Paraphrase sets (equivalent expressions)
- Adversarial examples (edge cases)

**Related**: [Evaluation](#evaluation), [Golden Test](#golden-test)

---

### Counterfactual
A hypothetical "what if" scenario.

**Example**: "What would happen if I made it brighter?"

**GOFAI Treatment**: Preview mode simulates counterfactual without committing.

**Related**: [Preview](#preview), [Simulation](#simulation)

---

### CPL (CardPlay Logic)
The typed logical form that represents user intent in GOFAI.

**Levels**:
1. **CPL-Intent**: What the user wants (goals + constraints + scope)
2. **CPL-Plan**: How to achieve it (sequence of opcodes)
3. **CPL-Host**: CardPlay-specific mutations (event edits, param changes)

**Properties**:
- Serializable to JSON
- Versioned schema
- Preserves provenance
- Deterministically computable from natural language

**Related**: [Pipeline](pipeline.md), [CPL Reference](cpl.md)

---

## D

### Decaying Salience
The property that entity prominence decreases over time.

**Example**: After 3 turns, "it" no longer refers to first-mentioned chorus.

**GOFAI Model**: Exponential decay with recency weight.

**Related**: [Salience](#salience), [Focus Stack](#focus-stack)

---

### Default Logic
Reasoning with defaults that can be overridden.

**Example**: "Make it brighter" defaults to current scope unless specified otherwise.

**GOFAI Usage**: Pragmatic resolution fills holes with defaults; user can override.

**Related**: [Pragmatics](#pragmatics), [Preference](#preference)

---

### Definite Description
A referring expression with "the" (presupposes uniqueness).

**Example**: "the chorus", "the bass line"

**GOFAI Treatment**: Must resolve to exactly one entity or trigger clarification.

**Related**: [Presupposition](#presupposition), [Uniqueness](#uniqueness)

---

### Deictic Reference
A reference to something present in shared context.

**Examples**: "this", "that", "here"

**GOFAI Treatment**: Resolved via UI selection state (what user has selected/focused).

**Related**: [Entity Reference](#entity-reference), [Context](#context)

---

### Density
The amount of musical activity per unit time.

**Measures**: Notes per beat, event count, polyphonic density

**GOFAI Treatment**: Axis for "busier"/"sparser"; levers add/remove notes.

**Related**: [Axis](#axis), [Texture](#texture)

---

### Dependency
A relationship where one element requires another.

**Examples**: "it" depends on antecedent; plan step depends on precondition.

**GOFAI Treatment**: Dependencies tracked for resolution ordering and validation.

**Related**: [Precondition](#precondition), [Ordering](#ordering)

---

### Derivation
The step-by-step process of constructing meaning from input.

**GOFAI Stages**: Tokenize → parse → compose semantics → resolve pragmatics → plan → execute

**Related**: [Pipeline](#pipeline), [Provenance](#provenance)

---

### Descriptor
An expression that describes properties without referring to specific entity.

**Example**: "bright sound" describes property; "the bright sound" refers to entity.

**GOFAI Treatment**: Descriptors used in fuzzy matching and similarity scoring.

**Related**: [Fuzzy Matching](#fuzzy-matching), [Attribute](#attribute)

---

### Determinism
The property that same input always produces same output.

**GOFAI Requirements**:
- No randomness (no `Math.random()`)
- No time dependencies (no `Date.now()` in compilation)
- No network calls
- Stable sorting (no hash map iteration order)
- Reproducible floating-point arithmetic

**Why It Matters**: Enables reliable testing, debugging, and replay.

**Related**: [Semantic Safety Invariants](semantic-safety-invariants.md#determinism)

---

### Dialogue Act
The communicative function of an utterance.

**Types**: Request, inform, query, confirm, reject, acknowledge

**GOFAI Treatment**: Classified to determine system response type.

**Related**: [Conversational Move](#conversational-move), [Turn](#turn)

---

### Dialogue State
The conversational context tracking what has been mentioned and what is salient.

**Components**:
- **Focus stack**: Recently mentioned entities (for anaphora resolution)
- **Current selection**: UI-selected entity (for deictic resolution)
- **Last action**: Most recent edit (for "undo that", "do it again")
- **User preferences**: Standing preferences (e.g., "always preview")

**GOFAI Treatment**: Updated after every utterance and edit; used to resolve references and fill holes.

**Related**: [Anaphora](#anaphora), [Salience](#salience), [Pragmatics](pipeline.md#stage-5-pragmatic-resolution)

---

### Diff
A structured description of what changed between two project states.

**Types**:
- **Event diff**: Notes added, removed, or modified
- **Param diff**: Card parameters changed
- **Structure diff**: Sections added, removed, or restructured
- **Routing diff**: Signal connections changed

**Properties**:
- Deterministic computation
- Human-readable summary
- Linked to plan steps (why each change happened)

**GOFAI Treatment**: Generated after every mutation; shown in preview UI; stored in edit packages.

**Related**: [Edit Package](#edit-package), [Undo Token](#undo-token)

---

### Dimension Reduction
Mapping high-dimensional space to lower dimensions.

**GOFAI Usage**: Timbre space reduced to axes (brightness, warmth, etc.) for user comprehension.

**Related**: [Perceptual Space](#perceptual-space), [Axis](#axis)

---

### Discourse Marker
A word/phrase that structures conversation.

**Examples**: "also", "however", "by the way", "anyway"

**GOFAI Treatment**: Influences discourse structure and topic shifts.

**Related**: [Topic](#topic), [Coherence](#coherence)

---

### Discourse Referent
An entity introduced into the discourse model.

**Example**: "Add a bass line" introduces bass line as referent for subsequent references.

**GOFAI Treatment**: Tracked in focus stack with salience scores.

**Related**: [Referent](#referent), [Discourse Representation Theory](#discourse-representation-theory)

---

### Discourse Representation Theory (DRT)
A semantic framework using discourse representation structures.

**GOFAI Usage**: Influences how referents, presuppositions, and anaphora are modeled.

**Related**: [Anaphora](#anaphora), [Presupposition](#presupposition)

---

### Discourse Segment
A coherent chunk of conversation on a single topic.

**Example**: Discussion about chorus is one segment; shift to verse starts new segment.

**GOFAI Treatment**: Segmentation affects scope defaults and topic tracking.

**Related**: [Topic](#topic), [Coherence](#coherence)

---

### Disjunction
Combining elements with "or" (alternatives).

**Example**: "Make it brighter or wider" — user chooses one.

**GOFAI Treatment**: Generates alternative plans; user selects preferred option.

**Related**: [Coordination](#coordination), [Alternative](#alternative)

---

### Distance Metric
A function measuring similarity between entities.

**Examples**: Edit distance (strings), Euclidean distance (vectors), semantic distance (meanings)

**GOFAI Usage**: Fuzzy matching, axis mapping, alternative ranking.

**Related**: [Fuzzy Matching](#fuzzy-matching), [Similarity](#similarity)

---

### Domain
The subject matter area.

**GOFAI Domain**: Music production, with subdomains (harmony, rhythm, timbre, production, etc.).

**Related**: [Ontology](#ontology), [Vocabulary](#vocabulary)

---

### Duration
The length of time something lasts.

**Units**: Beats, bars, seconds, milliseconds

**GOFAI Treatment**: Typed duration values with unit conversions.

**Related**: [Unit System](#unit-system), [Time](#time)

---

### Dynamic Binding
Resolution that depends on runtime context (vs static, at parse time).

**Example**: "it" resolves dynamically based on focus stack state.

**GOFAI Treatment**: Most binding is dynamic (pragmatic stage); only structural parsing is static.

**Related**: [Binding](#binding), [Pragmatics](#pragmatics)

---

## E

### Earley Parser
A parsing algorithm that handles ambiguous grammars efficiently.

**Properties**: Polynomial time, returns parse forest, handles left recursion.

**GOFAI Usage**: Candidate for grammar engine (vs PEG or GLR).

**Related**: [Parsing](#parsing), [Parse Forest](#parse-forest)

---

### Edit Package
The atomic unit of applied change in GOFAI.

**Contents**:
- **CPL-Intent**: What was requested
- **CPL-Plan**: What was executed
- **Diff**: What changed
- **Undo Token**: How to reverse it
- **Provenance**: Compiler version, timestamps, traces

**Properties**:
- Serializable
- Shareable (can export and replay)
- Addressable (can undo by package ID)

**Related**: [Undo Token](#undo-token), [Diff](#diff)

---

### Effect Type
The category of side effects an operation has.

**Types**:
- **Inspect**: Read-only, never modifies state
- **Propose**: Generates plans, requires preview
- **Mutate**: Modifies project, requires confirmation

**GOFAI Treatment**: Every operation declares its effect type; policies gate which effects are allowed.

**Related**: [Effect Taxonomy](effect-taxonomy.ts), [Board Policy](#board-policy)

---

### Ellipsis
Omission of words recoverable from context.

**Example**: "Make the chorus brighter and the verse [brighter too]."

**GOFAI Treatment**: Resolved via syntactic and semantic parallelism.

**Related**: [Anaphora](#anaphora), [Context](#context)

---

### Embedding
Placing one structure inside another.

**Example**: "Make [the chorus that I showed you] brighter" embeds relative clause.

**GOFAI Treatment**: Recursive composition with scope tracking.

**Related**: [Scope](#scope), [Nesting](#nesting)

---

### Entailment
A logical relationship where one statement implies another.

**Example**: "preserve melody exact" entails "don't change pitches".

**GOFAI Usage**: Constraint propagation and conflict detection.

**Related**: [Inference](#inference), [Constraint](#constraint)

---

### Entity
A project component that can be referenced and modified.

**Types**:
- **Section**: Song structure (verse, chorus, bridge)
- **Layer**: Track or role (drums, bass, melody)
- **Card**: Processing element (synth, effect)
- **Event**: Musical note or automation point
- **Deck**: UI container
- **Board**: Editing mode

**GOFAI Treatment**: Entities are resolved during pragmatics; unresolved entities cause errors.

**Related**: [Referent](#referent), [Entity Reference](#entity-reference)

---

### Entity Reference
A reference to a project entity, either resolved or unresolved.

**Forms**:
- **ID reference**: `"track-123"` (stable)
- **Name reference**: `"Verse 1"` (resolved to ID)
- **Deictic reference**: `"this"` (resolved from UI selection)
- **Anaphoric reference**: `"it"` (resolved from dialogue state)

**GOFAI Treatment**: All references must resolve before execution; ambiguous references trigger clarification.

**Related**: [Entity](#entity), [Referent](#referent)

---

### Envelope
The amplitude profile of a sound over time (ADSR: attack, decay, sustain, release).

**GOFAI Treatment**: Envelope parameters targeted by articulation and punchiness levers.

**Related**: [Articulation](#articulation), [Timbre](#timbre)

---

### Equivalence Class
A set of items treated as identical for some purpose.

**Example**: All paraphrases of "make it brighter" form equivalence class for testing.

**GOFAI Usage**: Paraphrase invariance testing.

**Related**: [Paraphrase](#paraphrase), [Invariance](#invariance)

---

### Error Recovery
Strategies for handling failures gracefully.

**GOFAI Strategies**:
- Suggest corrections for typos
- Offer similar alternatives
- Ask clarification questions
- Provide structured error messages

**Related**: [Failure](#failure), [Graceful Degradation](#graceful-degradation)

---

### Evaluation
Assessing system performance.

**Metrics**: Accuracy, coverage, latency, user satisfaction

**GOFAI Tests**: Golden examples, paraphrase invariance, constraint correctness, undo roundtrips

**Related**: [Testing](#testing), [Validation](#validation)

---

### Event
A musical note or automation point in CardPlay.

**Properties**: Onset, duration, pitch, velocity, tags

**GOFAI Treatment**: Events are primary targets for edits; selectors filter event sets.

**Related**: [Selector](#selector), [Mutation](#mutation)

---

### Exclusion
Specifying what should NOT be affected.

**Example**: "Make everything brighter except the bass"

**GOFAI Treatment**: Parsed as scope with exclusion set; validated before execution.

**Related**: [Scope](#scope), [Negation](#negation)

---

### Executability
The property that a specification can be mechanically verified or applied.

**GOFAI Requirement**: All constraints must be executable (no informal requirements).

**Related**: [Semantic Safety Invariants](semantic-safety-invariants.md#constraint-executability)

---

### Existential Quantification
Asserting that at least one element satisfies a condition.

**Example**: "If there's a bass" checks existence.

**GOFAI Treatment**: Existence checks are preconditions; failures skip operation or ask user.

**Related**: [Quantification](#quantification), [Presupposition](#presupposition)

---

### Expectation
What the system anticipates based on context.

**Example**: After "make the chorus brighter", system expects follow-up to relate to chorus or brightness.

**GOFAI Treatment**: Influences default resolution and relevance scoring.

**Related**: [Context](#context), [Predictive Model](#predictive-model)

---

### Explanation
A human-readable account of why something happened.

**GOFAI Explanations**:
- Why this plan was chosen
- What constraints were satisfied
- What changed and why
- Why a clarification was needed

**Related**: [Provenance](#provenance), [Explainability](#explainability)

---

### Explainability
The degree to which system decisions can be explained.

**GOFAI Design**: Every decision has traceable provenance and human-readable rationale.

**Related**: [Provenance](#provenance), [Transparency](#transparency)

---

### Extension
A plugin that adds vocabulary, opcodes, or constraints.

**Properties**: Namespaced, versioned, declarative schema

**GOFAI Integration**: Extensions register via standard API; auto-binding from card/board metadata.

**Related**: [Namespace](#namespace), [Plugin](#plugin)

---

### Extraction
Pulling specific information from structured data.

**Example**: Extract chorus bars from section markers.

**GOFAI Usage**: Selector execution extracts events matching criteria.

**Related**: [Selector](#selector), [Query](#query)

---

## F

### Facet
An aspect or dimension of meaning.

**Example**: "dark" has facets: spectral (low brightness), emotional (somber), registral (low pitch).

**GOFAI Treatment**: Facets disambiguated via context or clarification.

**Related**: [Ambiguity](#ambiguity), [Dimension](#dimension)

---

### Failure Mode
A way something can go wrong.

**GOFAI Failure Modes**: Wrong scope, wrong target, broken constraints, destructive edits

**Mitigation**: Risk register maps each failure to prevention/recovery strategies.

**Related**: [Risk Register](#risk-register), [Error Recovery](#error-recovery)

---

### Feature Structure
A collection of attribute-value pairs describing an entity.

**Example**: `[pitch: C4, onset: 0.0, duration: 1.0]`

**GOFAI Usage**: Events and entities represented as feature structures for matching and unification.

**Related**: [Attribute](#attribute), [Unification](#unification)

---

### Fidelity
How precisely a representation captures the original.

**GOFAI Fidelity Levels**:
- **Exact**: Byte-for-byte preservation
- **Recognizable**: Human perception equivalent
- **Approximate**: Similar character

**Related**: [Preservation](#preservation), [Lossy](#lossy)

---

### Filter
A predicate that selects subset of entities.

**Example**: "drums in the chorus" filters events by layer AND section.

**GOFAI Treatment**: Filters compose into selectors; evaluated deterministically.

**Related**: [Selector](#selector), [Predicate](#predicate)

---

### Focus
The entity currently most prominent in discourse.

**GOFAI Model**: Top of focus stack; primary target for anaphoric "it".

**Related**: [Focus Stack](#focus-stack), [Salience](#salience)

---

### Focus Stack
A LIFO structure tracking recently mentioned entities.

**Operations**: Push (mention entity), pop (shift topic), peek (resolve "it")

**GOFAI Usage**: Central to anaphora resolution and default scope selection.

**Related**: [Anaphora](#anaphora), [Dialogue State](#dialogue-state)

---

### Formalism
A mathematical framework for defining structures.

**GOFAI Formalisms**: Type theory, lambda calculus, logic, grammars

**Related**: [Formal Semantics](#formal-semantics), [Logic](#logic)

---

### Formal Semantics
Precise mathematical definition of meaning.

**GOFAI Approach**: CPL defined via typed lambda calculus with model-theoretic interpretation.

**Related**: [Semantics](#semantics), [Type Theory](#type-theory)

---

### Frame
A structured representation of a stereotypical situation.

**Example**: "Make it brighter" activates brightness-adjustment frame with slots for target, amount, scope.

**GOFAI Usage**: Frames guide semantic composition and slot filling.

**Related**: [Slot Filling](#slot-filling), [Schema](#schema)

---

### Functional Harmony
Harmonic analysis based on chord function (tonic, dominant, subdominant).

**GOFAI Integration**: Prolog theory module analyzes functional progressions.

**Related**: [Harmony](#harmony), [Theory Module](#theory-module)

---

### Fuzzy Matching
Approximate string/semantic matching allowing errors.

**Techniques**: Edit distance, phonetic similarity, semantic embedding distance

**GOFAI Usage**: Typo tolerance, synonym recognition, "did you mean" suggestions.

**Related**: [Distance Metric](#distance-metric), [Similarity](#similarity)

---

### CPL (CardPlay Logic)
The typed logical form that represents user intent in GOFAI.

**Levels**:
1. **CPL-Intent**: What the user wants (goals + constraints + scope)
2. **CPL-Plan**: How to achieve it (sequence of opcodes)
3. **CPL-Host**: CardPlay-specific mutations (event edits, param changes)

**Properties**:
- Serializable to JSON
- Versioned schema
- Preserves provenance
- Deterministically computable from natural language

**Related**: [Pipeline](pipeline.md), [CPL Reference](cpl.md)

---

## D

### Determinism
The property that same input always produces same output.

**GOFAI Requirements**:
- No randomness (no `Math.random()`)
- No time dependencies (no `Date.now()` in compilation)
- No network calls
- Stable sorting (no hash map iteration order)
- Reproducible floating-point arithmetic

**Why It Matters**: Enables reliable testing, debugging, and replay.

**Related**: [Semantic Safety Invariants](semantic-safety-invariants.md#determinism)

---

### Dialogue State
The conversational context tracking what has been mentioned and what is salient.

**Components**:
- **Focus stack**: Recently mentioned entities (for anaphora resolution)
- **Current selection**: UI-selected entity (for deictic resolution)
- **Last action**: Most recent edit (for "undo that", "do it again")
- **User preferences**: Standing preferences (e.g., "always preview")

**GOFAI Treatment**: Updated after every utterance and edit; used to resolve references and fill holes.

**Related**: [Anaphora](#anaphora), [Salience](#salience), [Pragmatics](pipeline.md#stage-5-pragmatic-resolution)

---

### Diff
A structured description of what changed between two project states.

**Types**:
- **Event diff**: Notes added, removed, or modified
- **Param diff**: Card parameters changed
- **Structure diff**: Sections added, removed, or restructured
- **Routing diff**: Signal connections changed

**Properties**:
- Deterministic computation
- Human-readable summary
- Linked to plan steps (why each change happened)

**GOFAI Treatment**: Generated after every mutation; shown in preview UI; stored in edit packages.

**Related**: [Edit Package](#edit-package), [Undo Token](#undo-token)

---

## E

### Edit Package
The atomic unit of applied change in GOFAI.

**Contents**:
- **CPL-Intent**: What was requested
- **CPL-Plan**: What was executed
- **Diff**: What changed
- **Undo Token**: How to reverse it
- **Provenance**: Compiler version, timestamps, traces

**Properties**:
- Serializable
- Shareable (can export and replay)
- Addressable (can undo by package ID)

**Related**: [Undo Token](#undo-token), [Diff](#diff)

---

### Effect Type
The category of side effects an operation has.

**Types**:
- **Inspect**: Read-only, never modifies state
- **Propose**: Generates plans, requires preview
- **Mutate**: Modifies project, requires confirmation

**GOFAI Treatment**: Every operation declares its effect type; policies gate which effects are allowed.

**Related**: [Effect Taxonomy](effect-taxonomy.ts), [Board Policy](#board-policy)

---

### Entity
A project component that can be referenced and modified.

**Types**:
- **Section**: Song structure (verse, chorus, bridge)
- **Layer**: Track or role (drums, bass, melody)
- **Card**: Processing element (synth, effect)
- **Event**: Musical note or automation point
- **Deck**: UI container
- **Board**: Editing mode

**GOFAI Treatment**: Entities are resolved during pragmatics; unresolved entities cause errors.

**Related**: [Referent](#referent), [Entity Reference](#entity-reference)

---

### Entity Reference
A reference to a project entity, either resolved or unresolved.

**Forms**:
- **ID reference**: `"track-123"` (stable)
- **Name reference**: `"Verse 1"` (resolved to ID)
- **Deictic reference**: `"this"` (resolved from UI selection)
- **Anaphoric reference**: `"it"` (resolved from dialogue state)

**GOFAI Treatment**: All references must resolve before execution; ambiguous references trigger clarification.

**Related**: [Entity](#entity), [Referent](#referent)

---

## G

### Goal
A desired outcome or axis change.

**Examples**:
- `increase(brightness, chorus)`
- `add(drums, verse-1)`
- `restructure(intro, shorter)`

**Properties**:
- Goals are satisfiable (can be achieved) or not
- Multiple goals can be coordinated ("brighter and tighter")
- Goals can conflict with constraints (triggers error)

**Related**: [Constraint](#constraint), [Preference](#preference), [Lever](#lever)

---

### Graceful Degradation
Continuing to function (with reduced capability) when failures occur.

**GOFAI Examples**:
- Parse fails → offer fuzzy matches
- Binding ambiguous → ask clarification
- Plan risky → show preview instead of auto-apply

**Related**: [Error Recovery](#error-recovery), [Robustness](#robustness)

---

### Grammar
The set of rules defining valid sentence structures.

**GOFAI Grammar**: Context-free backbone with feature structures; handles coordination, embedding, scope.

**Related**: [Parsing](#parsing), [Syntax](#syntax)

---

### Granularity
The level of detail in a representation.

**Example**: Bar-level vs beat-level vs tick-level edits.

**GOFAI Treatment**: Users specify granularity explicitly or implicitly via scope.

**Related**: [Resolution](#resolution), [Precision](#precision)

---

### Gricean Maxims
Conversational principles: be informative, truthful, relevant, clear.

**GOFAI Application**: Default reasoning assumes user follows maxims; violations trigger inference.

**Related**: [Cooperative Principle](#cooperative-principle), [Implicature](#implicature)

---

### Ground Truth
The correct answer used for evaluation.

**GOFAI Usage**: Golden examples provide ground truth for regression testing.

**Related**: [Golden Test](#golden-test), [Evaluation](#evaluation)

---

### Grounding
Establishing shared understanding of referents between user and system.

**Example**: System confirms "By 'the verse', you mean Verse 1?" to ground reference.

**GOFAI Treatment**: Explicit via clarification questions; implicit via feedback.

**Related**: [Common Ground](#common-ground), [Confirmation](#confirmation)

---

### Guard
A condition that must hold for an operation to proceed.

**Example**: "If tempo > 100 BPM, apply swing" — tempo check is guard.

**GOFAI Treatment**: Guards are preconditions; failed guards skip operation or error.

**Related**: [Precondition](#precondition), [Conditional](#conditional)

---

## H

### Halting Problem
The undecidable question of whether a computation will terminate.

**GOFAI Mitigation**: Bounded search, timeouts, resource limits ensure termination.

**Related**: [Boundedness](#boundedness), [Complexity](#complexity)

---

### Harmony
The vertical (simultaneous) organization of pitches.

**Aspects**: Chord types, progressions, voice leading, functional relationships

**GOFAI Treatment**: Analyzed by theory module; constrained/modified via planning.

**Related**: [Theory Module](#theory-module), [Functional Harmony](#functional-harmony)

---

### Hash
A fixed-size fingerprint of data.

**GOFAI Usage**: Cache keys, deterministic IDs, change detection.

**Related**: [Caching](#caching), [Determinism](#determinism)

---

### Heuristic
A rule of thumb that usually works but isn't guaranteed.

**GOFAI Heuristics**: Cost estimation, default preferences, fuzzy match scoring.

**Related**: [Cost Model](#cost-model), [Planning](#planning)

---

### Hierarchy
A tree-like organization with parent-child relationships.

**GOFAI Hierarchies**: Section containment, scope nesting, type inheritance.

**Related**: [Nesting](#nesting), [Taxonomy](#taxonomy)

---

### Hole
An unresolved part of CPL-Intent.

**Types**:
- **Amount hole**: Degree not specified ("brighter" — by how much?)
- **Reference hole**: Target not resolved ("the verse" — which verse?)
- **Scope hole**: Location not specified ("add drums" — where?)

**GOFAI Treatment**: Holes trigger pragmatic resolution; if still unresolved, trigger clarification.

**Related**: [Clarification](#clarification), [Pragmatics](pipeline.md#stage-5-pragmatic-resolution)

---

### Homonymy
Multiple unrelated words with same form.

**Example**: "bank" (financial) vs "bank" (river)

**GOFAI Treatment**: Disambiguated via domain constraints and context.

**Related**: [Ambiguity](#ambiguity), [Polysemy](#polysemy)

---

### Host Action
A CardPlay-specific operation (event edit, param change, routing update).

**GOFAI Integration**: CPL-Plan compiles to host actions; executed transactionally.

**Related**: [Mutation](#mutation), [Transaction](#transaction)

---

### Hypernym
A more general term (superclass).

**Example**: "instrument" is hypernym of "drums", "bass", "piano".

**GOFAI Usage**: Taxonomy navigation, generalization in fuzzy matching.

**Related**: [Hyponym](#hyponym), [Taxonomy](#taxonomy)

---

### Hyponym
A more specific term (subclass).

**Example**: "kick" is hyponym of "drums".

**GOFAI Usage**: Specialization, default refinement ("drums" → "kick" if only kicks present).

**Related**: [Hypernym](#hypernym), [Taxonomy](#taxonomy)

---

## I

### Idiom
A fixed expression whose meaning isn't compositional.

**Example**: "bring it in" = introduce layer (not literal spatial movement).

**GOFAI Treatment**: Idioms stored as lexical patterns with special semantics.

**Related**: [Constructional Idiom](#constructional-idiom), [Lexeme](#lexeme)

---

### Implicature
An implied meaning derived from context, not explicitly stated.

**Example**:
- User: "Make the chorus brighter."
- Implicature: Only the chorus (not the whole song)

**Types**:
- **Conversational implicature**: Derived from Gricean maxims
- **Conventional implicature**: Encoded in specific constructions

**GOFAI Treatment**: Captured via scope inference and presupposition tracking.

**Related**: [Presupposition](#presupposition), [Scope](#scope)

---

### Incremental Processing
Computing results as input arrives (vs waiting for complete input).

**GOFAI Opportunity**: Parse/display intent as user types; currently batched per utterance.

**Related**: [Streaming](#streaming), [Latency](#latency)

---

### Indexical
An expression whose reference depends on context.

**Examples**: "now", "here", "I", "this"

**GOFAI Treatment**: Resolved via speech situation model (speaker, time, location, selection).

**Related**: [Deictic Reference](#deictic-reference), [Context](#context)

---

### Inference
Deriving new information from known facts.

**Types**: Deductive, inductive, abductive

**GOFAI Usage**: Pragmatic inference fills holes; theory inference suggests harmonizations.

**Related**: [Reasoning](#reasoning), [Logic](#logic)

---

### Inflection
Grammatical variation of a word (tense, number, case).

**Example**: "bright", "brighter", "brightest"

**GOFAI Treatment**: Normalized to lemma; morphological features preserved if semantically relevant.

**Related**: [Lemma](#lemma), [Normalization](#normalization)

---

### Information Structure
How information is packaged (topic vs focus, given vs new).

**Example**: "The chorus is what I want to change" — "chorus" is topic.

**GOFAI Treatment**: Influences default scope and anaphora resolution.

**Related**: [Topic](#topic), [Focus](#focus)

---

### Instrumentation
The selection and combination of instruments/timbres.

**GOFAI Treatment**: Layer assignments, card selection, orchestration planning.

**Related**: [Timbre](#timbre), [Orchestration](#orchestration)

---

### Intent
What the user wants to achieve.

**Representation**: CPL-Intent with goals, constraints, scope.

**Related**: [CPL](#cpl-cardplay-logic), [Goal](#goal)

---

### Interaction Model
How user and system exchange information.

**GOFAI Model**: Mixed-initiative dialogue with preview-first policy.

**Related**: [Dialogue State](#dialogue-state), [Preview](#preview)

---

### Interface
A boundary between components defining communication protocol.

**GOFAI Interfaces**: NL→CPL, CPL→Plan, Plan→HostAction, Extension API.

**Related**: [API](#api), [Contract](#contract)

---

### Interpolation
Estimating intermediate values.

**GOFAI Usage**: Tempo curves, dynamic envelopes, parameter automation.

**Related**: [Automation](#automation), [Smoothing](#smoothing)

---

### Invariance
Property of being unchanged under transformation.

**GOFAI Invariances**: Paraphrase invariance (same CPL from equivalent inputs).

**Related**: [Equivalence Class](#equivalence-class), [Testing](#testing)

---

### Invariant
A property that must always hold.

**GOFAI Invariants**: See [Semantic Safety Invariants](semantic-safety-invariants.md)

**Examples**:
- Constraint executability
- Silent ambiguity prohibition
- Determinism
- Undoability

**Treatment**: Checked at compile time and runtime; violations are errors.

**Related**: [Semantic Safety](#semantic-safety)

---

### Inversion
Reversing an operation.

**Example**: "undo" inverts last edit.

**GOFAI Requirement**: Every mutation produces invertible undo token.

**Related**: [Undo Token](#undo-token), [Reversibility](#reversibility)

---

### Isolation
The property that operations don't interfere with each other.

**GOFAI Guarantee**: Edits are transactional; no concurrent mutations.

**Related**: [Transaction](#transaction), [Concurrency](#concurrency)

---

## K

### Key Signature
The tonal center and scale of a section.

**GOFAI Usage**: Inferred by theory module; constrains/guides harmony edits.

**Related**: [Harmony](#harmony), [Theory Module](#theory-module)

---

### Knowledge Base
A repository of facts and rules.

**GOFAI KB**: Prolog music theory, chord progressions, voice leading rules.

**Related**: [Theory Module](#theory-module), [Reasoning](#reasoning)

---

## L

### Lambda Calculus
A formal system for expressing computation via function abstraction and application.

**GOFAI Usage**: Semantic composition defined via typed lambda terms.

**Related**: [Formal Semantics](#formal-semantics), [Type Theory](#type-theory)

---

### Latency
Time delay between input and output.

**GOFAI Targets**: Parse <100ms, plan <500ms, execute <1s for typical edits.

**Related**: [Performance](#performance), [Responsiveness](#responsiveness)

---

### Layer
A track or functional role in the arrangement (drums, bass, melody, etc.).

**GOFAI Treatment**: Primary dimension for scope specification.

**Related**: [Entity](#entity), [Scope](#scope)

---

### Lemma
The dictionary headword form of a lexeme.

**Example**: "bright" is lemma for "brighter", "brightest", "brightness".

**GOFAI Usage**: Normalization maps variants to lemmas for consistent matching.

**Related**: [Lexeme](#lexeme), [Normalization](#normalization)

---

### Lever
A concrete way to move along a perceptual axis.

**Example**: To increase brightness:
- **Lever 1**: Raise register (+5 semitones)
- **Lever 2**: Add brightness EQ
- **Lever 3**: Change voicing to brighter intervals

**Properties**:
- Maps to specific opcode
- Has cost (how disruptive)
- Has effectiveness (how much axis movement)
- May require capabilities

**GOFAI Treatment**: Planner selects levers based on goal satisfaction + cost + constraints.

**Related**: [Axis](#axis), [Opcode](#opcode), [Planning](pipeline.md#stage-7-planning)

---

### Lexeme
A vocabulary entry (word or phrase) with semantic binding.

**Components**:
- **Lemma**: Base form ("bright")
- **Variants**: Synonyms and inflections ("brighter", "brightest", "brilliant")
- **Category**: Part of speech (verb, adjective, noun, etc.)
- **Semantics**: What CPL node this produces
- **Restrictions**: What it can apply to

**Example**:
```typescript
{
  id: 'lex:adj:bright',
  lemma: 'bright',
  variants: ['brighter', 'brightest', 'brilliant'],
  category: 'adj',
  semantics: {
    type: 'axis_modifier',
    axis: 'axis:brightness',
    direction: 'increase'
  }
}
```

**Related**: [Vocabulary](#vocabulary), [Axis](#axis)

---

## M

### Magnitude
The size or degree of a value.

**Examples**: "a little brighter" (small magnitude), "much louder" (large magnitude)

**GOFAI Treatment**: Mapped to numeric scale factors with type-safe ranges.

**Related**: [Degree](#degree), [Scale](#scale)

---

### Mapping
A correspondence between two domains.

**GOFAI Mappings**: Lexemes→semantics, axes→levers, CPL→HostActions.

**Related**: [Binding](#binding), [Translation](#translation)

---

### Melody
A sequence of pitches forming a recognizable line.

**GOFAI Treatment**: Identified by contour and rhythm; preserved via constraints.

**Related**: [Contour](#contour), [Preservation](#preservation)

---

### Meronymy
Part-whole relationship.

**Example**: "kick" is meronym of "drums" (kick is part of drums).

**GOFAI Usage**: Scope refinement ("drums" can mean all drum sounds or specific component).

**Related**: [Taxonomy](#taxonomy), [Holonym](#holonym)

---

### Meter
The rhythmic organization of beats into measures.

**Examples**: 4/4, 3/4, 6/8

**GOFAI Treatment**: Inferred from project; used in quantization and phrasing.

**Related**: [Rhythm](#rhythm), [Quantization](#quantization)

---

### Modality
Necessity, possibility, permission.

**Examples**: "must preserve melody", "can change chords", "should avoid dissonance"

**GOFAI Treatment**: Hard vs soft constraints, capability requirements.

**Related**: [Constraint](#constraint), [Capability](#capability)

---

### Model
A formal representation of a domain.

**GOFAI Models**: World model (project state), dialogue model (conversational context), cost model (planning).

**Related**: [World Model](#world-model), [Formal Semantics](#formal-semantics)

---

### Modifier
An element that adds information to another.

**Examples**: "very bright", "in the chorus", "except bass"

**GOFAI Treatment**: Adjuncts and adverbs modify scope, amount, or constraints.

**Related**: [Adjunct](#adjunct), [Scope](#scope)

---

### Monotonicity
Property that adding information doesn't retract conclusions.

**GOFAI Constraint**: Pragmatic defaults are defeasible (non-monotonic); semantic composition is monotonic.

**Related**: [Default Logic](#default-logic), [Reasoning](#reasoning)

---

### Morphology
The structure of words (inflection, derivation).

**Example**: "bright" → "brighter" (comparative inflection)

**GOFAI Treatment**: Morphological normalization to lemmas.

**Related**: [Lemma](#lemma), [Inflection](#inflection)

---

### Mutation
An operation that modifies project state.

**Examples**:
- Adding/removing events
- Changing parameters
- Restructuring sections

**Properties**:
- Transactional (all-or-nothing)
- Generates diff
- Produces undo token
- Requires `mutate` effect capability

**Related**: [Effect Type](#effect-type), [Undo Token](#undo-token)

---

## N

### Namespace
A prefix identifying the source of a vocabulary item.

**Builtin namespace**: None (e.g., `lex:verb:make`)
**Extension namespace**: Pack ID (e.g., `my-pack:lex:verb:stutter`)

**Rules**:
- Extensions MUST use namespace
- Core vocabulary NEVER uses namespace
- Reserved namespaces: `gofai`, `core`, `cardplay`, `builtin`, `system`, `user`

**Related**: [Vocabulary Policy](vocabulary-policy.md), [Extension](#extension)

---

### Negation
Logical NOT; expressing absence or prohibition.

**Examples**: "not the bass", "don't change melody"

**GOFAI Treatment**: Negated scope creates exclusion sets; negated constraints create prohibitions.

**Related**: [Exclusion](#exclusion), [Scope](#scope)

---

### Nesting
Embedding structures within other structures.

**Example**: "Make [the drums [in the chorus]] louder" — double nesting of scope.

**GOFAI Treatment**: Recursive scoping with proper containment validation.

**Related**: [Embedding](#embedding), [Scope](#scope)

---

### Nominal
A noun phrase functioning as argument.

**Example**: "the chorus", "drums and bass", "bright sounds"

**GOFAI Treatment**: Parsed as entity references, coordinations, or descriptors.

**Related**: [Noun Phrase](#noun-phrase), [Entity Reference](#entity-reference)

---

### Normalization
Converting input to standard form.

**Operations**: Case folding, punctuation removal, synonym mapping, unit canonicalization.

**GOFAI Stage**: First step in pipeline.

**Related**: [Canonical Form](#canonical-form), [Tokenization](#tokenization)

---

### Noun Phrase
A syntactic constituent headed by a noun.

**Examples**: "the chorus", "drums", "that bright pad sound"

**GOFAI Treatment**: Parsed to extract referent and modifiers.

**Related**: [Nominal](#nominal), [Parsing](#parsing)

---

## O

### Ontology
A formal specification of concepts and relationships in a domain.

**GOFAI Ontology**: Musical entities, perceptual axes, edit operations, constraints.

**Related**: [Taxonomy](#taxonomy), [Domain](#domain)

---

### Opcode
A low-level operation that modifies project state.

**Examples**:
- `op:raise_register` — Shift notes up/down
- `op:quantize` — Snap notes to grid
- `op:thin_texture` — Reduce note density
- `op:set_param` — Change card parameter

**Properties**:
- Declares effect type (`inspect` / `propose` / `mutate`)
- Declares parameter schema
- Declares preconditions and postconditions
- Has cost level (`low` / `medium` / `high`)

**Related**: [Lever](#lever), [CPL-Plan](#cpl-cardplay-logic)

---

### Optimization
Finding the best solution according to some criterion.

**GOFAI Usage**: Planning optimizes for goal satisfaction + low cost + constraint adherence.

**Related**: [Cost Model](#cost-model), [Planning](#planning)

---

### Orchestration
The art of assigning musical ideas to instruments/timbres.

**GOFAI Treatment**: Layer assignment, role distribution, textural planning.

**Related**: [Instrumentation](#instrumentation), [Texture](#texture)

---

### Ordering
A sequence or partial order on elements.

**GOFAI Orderings**: Salience (for resolution), plan steps (for execution), scope precedence.

**Related**: [Dependency](#dependency), [Determinism](#determinism)

---

## P

### Paraphrase
An alternative expression with same meaning.

**Example**: "make it brighter" ≈ "brighten it" ≈ "increase brightness"

**GOFAI Requirement**: Paraphrase invariance — same CPL from equivalent inputs.

**Related**: [Equivalence Class](#equivalence-class), [Invariance](#invariance)

---

### Parsing
Converting text into structured representation.

**GOFAI Parsing**: Tokenize → build parse forest → select best parse → compose semantics.

**Related**: [Grammar](#grammar), [Parse Forest](#parse-forest)

---

### Parse Forest
A compact representation of all possible parses.

**GOFAI Usage**: Maintains ambiguity explicitly; disambiguation done later.

**Related**: [Ambiguity](#ambiguity), [Parsing](#parsing)

---

### Patient
The entity affected by an action (semantic role).

**Example**: "Make *the chorus* brighter" — chorus is patient.

**GOFAI Treatment**: Patient becomes primary scope target.

**Related**: [Agent](#agent), [Semantic Role](#semantic-role)

---

### Pattern Matching
Finding instances of a template.

**GOFAI Usage**: Grammar rules, idiom recognition, selector evaluation.

**Related**: [Parsing](#parsing), [Selector](#selector)

---

### Perceptual Space
A multi-dimensional space representing perceived qualities.

**GOFAI Axes**: Brightness, warmth, width, energy, tightness, tension, etc.

**Related**: [Axis](#axis), [Dimension Reduction](#dimension-reduction)

---

### Performance
How fast and efficient a system is.

**GOFAI Targets**: Parse <100ms, plan <500ms, execute <1s.

**Related**: [Latency](#latency), [Optimization](#optimization)

---

### Phonetics
The sounds of speech.

**GOFAI Usage**: Minimal (text-based); phonetic similarity for typo tolerance.

**Related**: [Fuzzy Matching](#fuzzy-matching)

---

### Pitch
The perceived frequency of a sound.

**Units**: MIDI note number, Hz, note names (C4, A440).

**GOFAI Treatment**: Typed pitch values with conversions.

**Related**: [Event](#event), [Melody](#melody)

---

### Plan
A sequence of operations to achieve goals.

**Representation**: CPL-Plan (opcodes with parameters).

**Properties**: Satisfies goals, respects constraints, minimizes cost.

**Related**: [Planning](#planning), [Opcode](#opcode)

---

### Planning
The process of generating plans.

**GOFAI Algorithm**: Beam search over lever space with constraint checking.

**Related**: [Beam Search](#beam-search), [Plan](#plan)

---

### Plugin
See [Extension](#extension).

---

### Polarity
Positive vs negative sentiment/direction.

**Example**: "brighter" (positive), "darker" (negative).

**GOFAI Treatment**: Determines axis direction in edits.

**Related**: [Axis](#axis), [Direction](#direction)

---

### Polysemy
One word with multiple related meanings.

**Example**: "head" (leader, top, body part).

**GOFAI Treatment**: Context disambiguates related senses.

**Related**: [Ambiguity](#ambiguity), [Homonymy](#homonymy)

---

### Postcondition
A condition that must hold after an operation.

**Example**: After `add(drums)`, drums layer must exist.

**GOFAI Treatment**: Validated after execution; failures rollback.

**Related**: [Precondition](#precondition), [Validation](#validation)

---

### Pragmatics
The study of how context affects meaning.

**GOFAI Pragmatics Stage**:
- Resolve anaphora ("it" → last-mentioned entity)
- Resolve deictic references ("this" → UI selection)
- Fill holes with defaults
- Check presuppositions
- Detect ambiguity

**Related**: [Pipeline](pipeline.md#stage-5-pragmatic-resolution), [Dialogue State](#dialogue-state)

---

### Precedence
Priority ordering for conflict resolution.

**GOFAI Precedence**: Exact references > recent mentions > defaults.

**Related**: [Salience](#salience), [Resolution](#resolution)

---

### Precondition
A condition that must hold before an operation.

**Example**: `raise_register` requires notes to exist in scope.

**GOFAI Treatment**: Checked during planning; violations block or skip operation.

**Related**: [Guard](#guard), [Postcondition](#postcondition)

---

### Precision
The exactness of a measurement or representation.

**Trade-off**: High precision vs user convenience ("a little" vs "0.15").

**GOFAI Treatment**: Users specify natural degrees; system maps to precise values.

**Related**: [Granularity](#granularity), [Magnitude](#magnitude)

---

### Predicate
A function from entities to truth values.

**Examples**: `is_drum(X)`, `in_scope(X, chorus)`, `brighter_than(X, Y)`

**GOFAI Usage**: Constraints, selectors, theory predicates.

**Related**: [Logic](#logic), [Filter](#filter)

---

### Predictive Model
A model that anticipates what comes next.

**GOFAI Usage**: Scope prediction, auto-completion, expectation setting.

**Related**: [Expectation](#expectation), [Context](#context)

---

### Preference
A soft constraint that influences planning but can be overridden.

**Examples**:
- "Prefer simpler changes"
- "Favor brightness over loudness for 'brighter'"
- "Default to affecting current section"

**Properties**:
- Influence scoring, not satisfiability
- User can override
- Can be learned from history

**Related**: [Constraint](#constraint), [Goal](#goal)

---

### Preservation
Keeping something unchanged.

**Fidelity Levels**: Exact (byte-for-byte), recognizable (perceived equivalent), approximate (similar character).

**GOFAI Treatment**: Preserve constraints enforce fidelity levels.

**Related**: [Constraint](#preservation), [Fidelity](#fidelity)

---

### Presupposition
An assumption triggered by linguistic expressions.

**Examples**:
- "Make the **bass** quieter" presupposes **bass exists**
- "Do it **again**" presupposes **prior action exists**
- "The **other** verse" presupposes **multiple verses exist**

**Types**:
- **Existential**: Entity exists
- **Uniqueness**: Reference is unambiguous
- **Prior action**: History context required

**GOFAI Treatment**: Verified before planning; failure triggers structured error with suggestions.

**Related**: [Semantic Safety Invariants](semantic-safety-invariants.md#presupposition-verification)

---

### Provenance
The origin and history of a semantic decision.

**Tracked Information**:
- Which lexeme produced which CPL node
- Which grammar rule applied
- Which resolution strategy succeeded
- Which extension contributed vocabulary

**Why It Matters**: Enables explanation ("why did you do X?") and debugging.

**Related**: [Explainability](#explainability)

---

## Q

### QUD (Question Under Discussion)
The implicit question being addressed in a conversation.

**Example**:
```
User: "Make the chorus brighter."
Implicit QUD: "How should I change the chorus?"

User: "What changed?"
Explicit QUD: "What changed in the last edit?"
```

**GOFAI Treatment**: Clarification questions are framed as QUDs; defaults are QUD-appropriate.

**Related**: [Clarification](#clarification), [Dialogue State](#dialogue-state)

---

### Quantification
Expressing quantity (all, some, none, exactly N).

**Examples**: "all verses", "some drums", "at least 2 bars"

**GOFAI Treatment**: Quantifiers create selectors with cardinality constraints.

**Related**: [Selector](#selector), [Cardinality](#cardinality)

---

### Quantization
Aligning events to a grid.

**Parameters**: Grid resolution, strength (0-100%), swing amount.

**GOFAI Treatment**: Common opcode for tightening rhythm.

**Related**: [Opcode](#opcode), [Rhythm](#rhythm)

---

### Query
A request for information.

**Examples**: "What's the tempo?", "Show me the chorus", "What changed?"

**GOFAI Treatment**: Query effects (inspect-only); return structured responses.

**Related**: [Effect Type](#effect-type), [Inspection](#inspection)

---

## R

### Range
An interval between two values.

**Examples**: Bars 8-16, MIDI notes 60-72, BPM 90-140.

**GOFAI Treatment**: Typed range values with refinement constraints.

**Related**: [Refinement](#refinement), [Scope](#scope)

---

### Reasoning
Drawing conclusions from premises.

**Types**: Deductive (guaranteed), inductive (probable), abductive (best explanation).

**GOFAI Usage**: Pragmatic reasoning (defaults), theory reasoning (harmonization), plan reasoning (goal satisfaction).

**Related**: [Inference](#inference), [Logic](#logic)

---

### Recency
How recently something was mentioned or occurred.

**GOFAI Usage**: Primary factor in salience scoring for anaphora resolution.

**Related**: [Salience](#salience), [Decaying Salience](#decaying-salience)

---

### Refinement
Adding constraints to narrow possibilities.

**Example**: "drums" refined to "kick" if only kicks in scope.

**GOFAI Treatment**: Refinement constraints typed per value domain.

**Related**: [Constraint](#constraint), [Type System](#type-system)

---

### Referent
The entity that a linguistic expression refers to.

**Example**:
- "the chorus" → referent: section with ID `section-chorus-1`
- "the drums" → referent: layer with role `drums`
- "that change" → referent: edit package ID `pkg-123`

**GOFAI Treatment**: All referential expressions must resolve to concrete referents; ambiguity triggers clarification.

**Related**: [Entity Reference](#entity-reference), [Anaphora](#anaphora)

---

### Register
The pitch height range.

**Examples**: Low register (bass), mid register (melody), high register (bells).

**GOFAI Treatment**: Axis for pitch height edits; lever via transposition.

**Related**: [Pitch](#pitch), [Axis](#axis)

---

### Relative Scope
Scope defined relative to another entity.

**Example**: "louder than the verse" — scope relates to verse level.

**GOFAI Treatment**: Comparative structures create relative constraints.

**Related**: [Scope](#scope), [Comparative](#comparative)

---

### Resolution
The process of determining what a reference refers to.

**Strategies**: Direct ID match, name match, fuzzy match, anaphoric, deictic, default.

**GOFAI Treatment**: Backoff through strategies with provenance tracking.

**Related**: [Binding](#binding), [Backoff Strategy](#backoff-strategy)

---

### Responsiveness
How quickly the system reacts to input.

**GOFAI Target**: Interactive feedback within perceptual threshold (<100ms for typing).

**Related**: [Latency](#latency), [Performance](#performance)

---

### Reversibility
The property that operations can be undone.

**GOFAI Guarantee**: All mutations produce undo tokens with inverse operations.

**Related**: [Undo Token](#undo-token), [Inversion](#inversion)

---

### Rhythm
The temporal organization of musical events.

**Aspects**: Meter, tempo, groove, subdivision, syncopation.

**GOFAI Treatment**: Analyzed and modified via rhythm opcodes.

**Related**: [Meter](#meter), [Tempo](#tempo)

---

### Risk Register
A catalog of potential failures and mitigations.

**GOFAI Risks**: Wrong scope, wrong target, constraint violations, destructive edits.

**Related**: [Failure Mode](#failure-mode), [Safety](#safety)

---

### Robustness
Gracefully handling unexpected or erroneous input.

**GOFAI Strategies**: Typo tolerance, fuzzy matching, helpful errors, fallback options.

**Related**: [Error Recovery](#error-recovery), [Graceful Degradation](#graceful-degradation)

---

### Role
The function an entity plays.

**Examples**: Melodic role, harmonic role, rhythmic role.

**GOFAI Treatment**: Roles guide scope selection and edit appropriateness.

**Related**: [Semantic Role](#semantic-role), [Layer](#layer)

---

## S

### Safety
Protection against harmful operations.

**GOFAI Safety Mechanisms**: Preview-first policy, constraint checking, undo capability, explicit confirmation.

**Related**: [Semantic Safety](#semantic-safety), [Risk Register](#risk-register)

---

### Salience
The prominence of an entity in discourse.

**Factors**:
- **Recency**: How recently mentioned
- **Selection**: Whether UI-selected
- **Syntactic role**: Subject vs object
- **Semantic role**: Agent vs patient

**GOFAI Treatment**: Salience determines resolution order for anaphora and defaults.

**Related**: [Dialogue State](#dialogue-state), [Anaphora](#anaphora)

---

### Scale
A sequence of pitches defining tonal material.

**Examples**: Major, minor, pentatonic, chromatic, modes.

**GOFAI Treatment**: Inferred by theory module; constrains pitch selection.

**Related**: [Key Signature](#key-signature), [Theory Module](#theory-module)

---

### Schema
A structured template or pattern.

**Examples**: Constraint schema, opcode schema, edit package schema.

**GOFAI Treatment**: Schemas define valid structures with typed fields.

**Related**: [Type System](#type-system), [Frame](#frame)

---

### Scope
The region of the project that an operation affects.

**Dimensions**:
- **Sections**: Which song parts (verse, chorus, etc.)
- **Layers**: Which tracks or roles (drums, bass, etc.)
- **Time range**: Bar range or selection
- **Entity set**: Specific events or cards

**Example**:
```
"Make the chorus drums brighter"
Scope:
  - Section: chorus
  - Layer: drums
  - Aspect: brightness
```

**GOFAI Treatment**: Scope resolved during pragmatics; ambiguous scope triggers clarification.

**Related**: [Entity](#entity), [Implicature](#implicature)

---

### Search Strategy
An algorithm for exploring possibilities.

**GOFAI Strategy**: Beam search with cost-based pruning.

**Related**: [Beam Search](#beam-search), [Planning](#planning)

---

### Section
A structural unit of song form.

**Examples**: Intro, verse, chorus, bridge, outro.

**GOFAI Treatment**: Primary dimension for structural scope.

**Related**: [Entity](#entity), [Form](#form)

---

### Selector
A predicate that filters entities.

**Syntax**: Combinations of filters (layer, section, time, tags).

**GOFAI Treatment**: Selectors compiled to deterministic event queries.

**Related**: [Filter](#filter), [Scope](#scope)

---

### Semantic Composition
Combining meanings of parts to form meaning of whole.

**Principle**: Compositional semantics via function application and lambda abstraction.

**GOFAI Implementation**: Typed lambda calculus with axiom-based rules.

**Related**: [Compositional Semantics](#compositional-semantics), [Parsing](#parsing)

---

### Semantic Role
The function an argument plays in an event.

**Roles**: Agent (doer), patient (affected), instrument (means), location, time.

**GOFAI Treatment**: Roles guide slot filling and scope determination.

**Related**: [Agent](#agent), [Patient](#patient)

---

### Semantic Safety
The property that the system never violates semantic invariants.

**Key Invariants**:
- Constraints are executable
- Ambiguity is never silent
- Preservation is byte-for-byte
- References resolve or fail explicitly
- Effects are typed and declared
- Operations are deterministic
- Mutations are undoable

**Related**: [Semantic Safety Invariants](semantic-safety-invariants.md)

---

### Semantics
The study of meaning.

**GOFAI Semantics**: Formal, compositional, model-theoretic interpretation of CPL.

**Related**: [Formal Semantics](#formal-semantics), [Meaning](#meaning)

---

### Serialization
Converting structures to portable format.

**GOFAI Serialization**: CPL to JSON, edit packages to transportable bundles.

**Related**: [Schema](#schema), [Versioning](#versioning)

---

### Similarity
How alike two entities are.

**Measures**: String edit distance, semantic distance, perceptual distance.

**GOFAI Usage**: Fuzzy matching, axis calibration, alternative ranking.

**Related**: [Distance Metric](#distance-metric), [Fuzzy Matching](#fuzzy-matching)

---

### Simulation
Running "what if" scenarios.

**GOFAI Usage**: Preview mode simulates edits without committing.

**Related**: [Preview](#preview), [Counterfactual](#counterfactual)

---

### Situation
The context of an utterance (speaker, time, place, shared knowledge).

**GOFAI Model**: Speech situation with speaker, addressee, UI state, project state.

**Related**: [Context](#context), [Indexical](#indexical)

---

### Slot Filling
Assigning values to template slots.

**Example**: "Make X Y" frame has slots for target (X) and goal (Y).

**GOFAI Treatment**: Holes in CPL are slots; pragmatics fills them.

**Related**: [Frame](#frame), [Hole](#hole)

---

### Smoothing
Interpolating to remove discontinuities.

**GOFAI Usage**: Parameter automation curves, transition interpolation.

**Related**: [Interpolation](#interpolation), [Automation](#automation)

---

### Span
A range of text positions.

**Properties**: Start offset, end offset, substring.

**GOFAI Usage**: Tokens carry spans for error reporting and provenance.

**Related**: [Token](#token), [Provenance](#provenance)

---

### Streaming
Processing data as it arrives (vs batch).

**GOFAI Opportunity**: Future incremental parsing; currently batch-per-utterance.

**Related**: [Incremental Processing](#incremental-processing)

---

### Sublanguage
A restricted subset of natural language.

**GOFAI Sublanguage**: Music editing commands with constrained vocabulary/syntax.

**Related**: [Domain](#domain), [Coverage](#coverage)

---

### Substitution
Replacing one element with another.

**Example**: Chord substitution, synonym substitution.

**GOFAI Treatment**: Theory module suggests substitutions via rewrite rules.

**Related**: [Theory Module](#theory-module), [Rewriting](#rewriting)

---

### Syntax
The structure of sentences.

**GOFAI Syntax**: Context-free grammar with feature structures.

**Related**: [Grammar](#grammar), [Parsing](#parsing)

---

## T

### Taxonomy
A hierarchical classification.

**GOFAI Taxonomies**: Entity types, lexeme categories, constraint types.

**Related**: [Ontology](#ontology), [Hierarchy](#hierarchy)

---

### Tempo
The speed of music.

**Units**: BPM (beats per minute).

**GOFAI Treatment**: Project-level property; modifiable via tempo edits.

**Related**: [Rhythm](#rhythm), [Unit System](#unit-system)

---

### Testing
Validating system behavior.

**GOFAI Tests**: Golden examples, paraphrase invariance, constraint correctness, undo roundtrips, fuzz tests.

**Related**: [Evaluation](#evaluation), [Golden Test](#golden-test)

---

### Texture
The density and layering of musical material.

**Dimensions**: Polyphonic density, rhythmic activity, spectral density.

**GOFAI Treatment**: Axis for "busier"/"sparser"; modified via density opcodes.

**Related**: [Density](#density), [Axis](#axis)

---

### Theory Module
A subsystem encoding music theory knowledge.

**Implementation**: Prolog knowledge base with chord progressions, voice leading, cadence patterns.

**GOFAI Integration**: Queried during planning for theory-informed suggestions.

**Related**: [Knowledge Base](#knowledge-base), [Prolog](#prolog)

---

### Threshold
A boundary value for decision-making.

**Examples**: Similarity threshold for fuzzy matching, confidence threshold for clarification.

**GOFAI Treatment**: Thresholds tuned empirically and documentable.

**Related**: [Fuzzy Matching](#fuzzy-matching), [Confidence Score](#confidence-score)

---

### Timbre
The tonal color or quality of a sound.

**Aspects**: Spectral content, envelope, harmonics, formants.

**GOFAI Treatment**: Multiple axes (brightness, warmth, harshness, etc.).

**Related**: [Axis](#axis), [Perceptual Space](#perceptual-space)

---

### Time
Temporal position or duration.

**Units**: Bars, beats, ticks, seconds, milliseconds.

**GOFAI Treatment**: Typed time values with unit conversions.

**Related**: [Duration](#duration), [Unit System](#unit-system)

---

### Token
A segment of input text with metadata.

**Properties**:
- **Text**: Normalized form
- **Original text**: As typed by user
- **Span**: Character offsets
- **Category**: word, number, punctuation, etc.
- **Lexeme ID**: If matched to vocabulary

**Related**: [Tokenization](pipeline.md#stage-2-tokenization), [Lexeme](#lexeme)

---

### Tokenization
Splitting text into tokens.

**Operations**: Whitespace splitting, punctuation handling, number recognition.

**GOFAI Stage**: Stage 2 of pipeline.

**Related**: [Normalization](#normalization), [Token](#token)

---

### Topic
What a conversation is about.

**GOFAI Treatment**: Topic tracked across discourse segments; influences scope defaults.

**Related**: [QUD](#qud), [Coherence](#coherence)

---

### Trace
A record of execution steps.

**GOFAI Traces**: Provenance traces showing derivation from input to output.

**Related**: [Provenance](#provenance), [Debugging](#debugging)

---

### Transaction
An atomic unit of change (all-or-nothing).

**GOFAI Transactions**: Edits applied transactionally; failures rollback completely.

**Related**: [Mutation](#mutation), [Isolation](#isolation)

---

### Translation
Converting from one representation to another.

**GOFAI Translations**: NL→CPL, CPL→Plan, Plan→HostActions.

**Related**: [Compilation](#compilation), [Mapping](#mapping)

---

### Transparency
The ability to inspect internal workings.

**GOFAI Design**: All decisions traceable; explanations available on demand.

**Related**: [Explainability](#explainability), [Provenance](#provenance)

---

### Turn
A single exchange in dialogue.

**Components**: User utterance, system response (clarification, plan, confirmation, or execution).

**GOFAI Treatment**: Turns update dialogue state.

**Related**: [Dialogue State](#dialogue-state), [Conversational Move](#conversational-move)

---

### Type System
A formal system for classifying values.

**GOFAI Types**: Entities, scopes, constraints, goals, magnitudes, durations, pitches, axes.

**Related**: [Type Theory](#type-theory), [Schema](#schema)

---

### Type Theory
A formal framework for typed lambda calculus.

**GOFAI Usage**: CPL semantics defined via typed lambda terms with dependent types where useful.

**Related**: [Lambda Calculus](#lambda-calculus), [Formal Semantics](#formal-semantics)

---

## U

### Undo Token
A linear resource that enables reversing a mutation.

**Properties**:
- **Package ID**: Which edit to undo
- **Inverse operations**: Exact reverse steps
- **Linearity**: Consumed exactly once

**GOFAI Treatment**: Every mutation produces an undo token; undo restores byte-for-byte state.

**Related**: [Edit Package](#edit-package), [Semantic Safety Invariants](semantic-safety-invariants.md#undoability)

---

### Unification
Combining partial descriptions to find common specialization.

**GOFAI Usage**: Feature structure unification in parsing and entity matching.

**Related**: [Feature Structure](#feature-structure), [Resolution](#resolution)

---

### Uniqueness
The property that exactly one entity matches.

**Example**: "the chorus" presupposes unique chorus referent.

**GOFAI Treatment**: Uniqueness presupposition checked; violations trigger clarification.

**Related**: [Presupposition](#presupposition), [Definite Description](#definite-description)

---

### Unit System
A framework for typed dimensional quantities.

**GOFAI Units**: BPM, semitones, bars, beats, ticks, seconds, Hz, dB.

**Related**: [Coercion](#coercion), [Type System](#type-system)

---

### Universal Quantification
Asserting that all elements satisfy a condition.

**Example**: "all verses" selects every verse section.

**GOFAI Treatment**: Universal quantifiers create selectors matching all instances.

**Related**: [Quantification](#quantification), [Selector](#selector)

---

## V

### Valency
The number of arguments required by a predicate or verb.

**Example**: "make" has valency 2 (agent, patient+result).

**GOFAI Treatment**: Valency enforced by argument structure validation.

**Related**: [Arity](#arity), [Argument Structure](#argument-structure)

---

### Validation
Checking that a structure satisfies requirements.

**GOFAI Validation**: Type checking, constraint checking, presupposition verification.

**Related**: [Type System](#type-system), [Constraint](#constraint)

---

### Velocity
The dynamic level or loudness of a note (MIDI velocity 0-127).

**GOFAI Treatment**: Event attribute; modified via dynamics opcodes.

**Related**: [Event](#event), [Dynamics](#dynamics)

---

### Versioning
Managing changes to schemas and semantics over time.

**GOFAI Strategy**: CPL schema versioned; migration functions for compatibility.

**Related**: [Schema](#schema), [Compatibility](#compatibility)

---

### Vocabulary
The collection of all lexemes, axes, opcodes, and other linguistic items.

**Organization**:
- **Core vocabulary**: Builtin, un-namespaced
- **Extension vocabulary**: Namespaced by pack

**Tables**:
- Lexemes (words and phrases)
- Perceptual axes (abstract qualities)
- Edit opcodes (operations)
- Constraint types (requirements)
- Section types (song structure)
- Layer types (track roles)
- Measurement units (bars, beats, semitones, etc.)

**Related**: [Lexeme](#lexeme), [Namespace](#namespace), [Vocabulary Policy](vocabulary-policy.md)

---

### Voicing
The arrangement of chord tones across registers.

**Examples**: Close voicing (compact), open voicing (spread), drop-2, drop-3.

**GOFAI Treatment**: Modified via harmony opcodes; analyzed by theory module.

**Related**: [Harmony](#harmony), [Register](#register)

---

## W

### Weight
A numeric factor expressing importance or priority.

**GOFAI Usage**: Salience weights, cost weights, preference weights.

**Related**: [Salience](#salience), [Cost Model](#cost-model)

---

### World Model
The system's representation of project state.

**Contents**: Section structure, layers, card graph, tempo, key, event data.

**GOFAI Treatment**: Updated after edits; queried during pragmatics and planning.

**Related**: [Belief State](#belief-state), [Context](#context)

---

## X

### XML
Extensible Markup Language (not heavily used in GOFAI).

**GOFAI Usage**: Minimal; prefer JSON for serialization.

**Related**: [Serialization](#serialization), [JSON](#json)

---

## Y

### Yield
The output or result of an operation.

**Example**: Parse yields syntax tree; planning yields plan; execution yields diff.

**GOFAI Treatment**: Each pipeline stage yields typed output for next stage.

**Related**: [Pipeline](#pipeline), [Output](#output)

---

## Z

### Zone
A region or area of focus.

**Example**: "The tense zone in bar 16" — local area with specific character.

**GOFAI Treatment**: Zones can be scope targets for localized edits.

**Related**: [Scope](#scope), [Region](#region)

---

## Abbreviations and Acronyms

- **AI**: Artificial Intelligence
- **API**: Application Programming Interface
- **BPM**: Beats Per Minute
- **CPL**: CardPlay Logic (GOFAI's typed logical form)
- **DRT**: Discourse Representation Theory
- **DSP**: Digital Signal Processing
- **GOFAI**: Good Old-Fashioned AI (symbolic, rule-based)
- **GLR**: Generalized LR (parsing algorithm)
- **Hz**: Hertz (frequency unit)
- **ID**: Identifier
- **JSON**: JavaScript Object Notation
- **KB**: Knowledge Base
- **LIFO**: Last In, First Out
- **LOC**: Lines of Code
- **LR**: Left-to-Right (parsing)
- **MIDI**: Musical Instrument Digital Interface
- **MRS**: Minimal Recursion Semantics
- **NL**: Natural Language
- **NLP**: Natural Language Processing
- **PEG**: Parsing Expression Grammar
- **QUD**: Question Under Discussion
- **SSOT**: Single Source of Truth
- **TS**: TypeScript
- **UI**: User Interface
- **UX**: User Experience
- **XML**: Extensible Markup Language

---

## Related Documentation

- [Semantic Safety Invariants](semantic-safety-invariants.md) — Core guarantees
- [Compilation Pipeline](pipeline.md) — Processing stages
- [Vocabulary Policy](vocabulary-policy.md) — Namespacing rules
- [CPL Reference](cpl.md) — Typed logical form
- [Perceptual Axes](perceptual-axes.md) — Abstract qualities
- [Product Contract](product-contract.md) — User-facing commitments
- [Risk Register](../infra/risk-register.ts) — Failure modes and mitigations

---

## Statistics

**Total Terms**: 275+
**Sections**: A-Z complete
**Coverage Areas**:
- Linguistics & Semantics: ~90 terms (33%)
- Planning & Execution: ~60 terms (22%)
- Music Theory & Production: ~55 terms (20%)
- System Architecture: ~45 terms (16%)
- Logic & Formal Methods: ~25 terms (9%)

**Last Updated**: 2026-01-30
**Version**: 2.0.0
**Maintainer**: GOFAI Team

---

*This glossary is the SSOT for terminology. Use these definitions consistently in docs and code comments.*
