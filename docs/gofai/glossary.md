# GOFAI Music+ Glossary

> Version 1.0.0 | Last updated: 2024
>
> **Step 016 from gofai_goalB.md**: Add a glossary of key terms

This glossary defines technical terms used throughout GOFAI Music+. It draws from linguistics, logic, semantics, and pragmatics to establish precise terminology.

---

## A

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

## C

### Capability
A permission or feature that must be available for an operation to execute.

**Examples**:
- `production-editing` — Can modify DSP parameters
- `routing-editing` — Can change signal routing
- `ai-execution` — Can run AI-assisted operations

**GOFAI Treatment**: Operations check required capabilities before execution; missing capabilities cause graceful failure.

**Related**: [Effect Type](#effect-type), [Board Policy](#board-policy)

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

## H

### Hole
An unresolved part of CPL-Intent.

**Types**:
- **Amount hole**: Degree not specified ("brighter" — by how much?)
- **Reference hole**: Target not resolved ("the verse" — which verse?)
- **Scope hole**: Location not specified ("add drums" — where?)

**GOFAI Treatment**: Holes trigger pragmatic resolution; if still unresolved, trigger clarification.

**Related**: [Clarification](#clarification), [Pragmatics](pipeline.md#stage-5-pragmatic-resolution)

---

## I

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

## L

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

## O

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

## P

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

## R

### Referent
The entity that a linguistic expression refers to.

**Example**:
- "the chorus" → referent: section with ID `section-chorus-1`
- "the drums" → referent: layer with role `drums`
- "that change" → referent: edit package ID `pkg-123`

**GOFAI Treatment**: All referential expressions must resolve to concrete referents; ambiguity triggers clarification.

**Related**: [Entity Reference](#entity-reference), [Anaphora](#anaphora)

---

## S

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

## T

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

## V

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

## Related Documentation

- [Semantic Safety Invariants](semantic-safety-invariants.md) — Core guarantees
- [Compilation Pipeline](pipeline.md) — Processing stages
- [Vocabulary Policy](vocabulary-policy.md) — Namespacing rules
- [CPL Reference](cpl.md) — Typed logical form
- [Perceptual Axes](perceptual-axes.md) — Abstract qualities

---

*This glossary is the SSOT for terminology. Use these definitions consistently in docs and code comments.*
