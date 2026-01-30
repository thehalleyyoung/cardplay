# GOFAI Music+ Compilation Pipeline

> Version 1.0.0 | Last updated: 2024
> 
> **Step 003 from gofai_goalB.md**: Document the compilation pipeline stages

This document defines the complete compilation pipeline for GOFAI Music+, from natural language input to executable CardPlay mutations.

---

## Overview

The GOFAI compiler transforms natural language instructions through a series of well-defined stages, each with clear inputs, outputs, and contracts:

```
Input Text
    ↓
[1. Normalization]      — Canonicalize spelling, units, synonyms
    ↓
Normalized Tokens
    ↓
[2. Tokenization]       — Break into tokens with spans
    ↓
Token Stream
    ↓
[3. Parsing]            — Build syntax tree(s)
    ↓
Parse Forest
    ↓
[4. Semantics]          — Convert to CPL-Intent (typed logical form)
    ↓
CPL-Intent (with holes)
    ↓
[5. Pragmatics]         — Resolve references, defaults, ambiguities
    ↓
CPL-Intent (complete)
    ↓
[6. Typecheck]          — Validate types and constraints
    ↓
Validated CPL-Intent
    ↓
[7. Planning]           — Generate action sequence
    ↓
CPL-Plan
    ↓
[8. Execution]          — Apply to project + generate diff
    ↓
EditPackage + Undo Token
```

Each stage is **pure and deterministic**: same input always produces same output.

---

## Stage 1: Normalization

**Purpose**: Convert surface variations into canonical forms before parsing.

**Input**: Raw user text string

**Output**: Normalized text string

**Operations**:

1. **Unicode normalization** (NFC)
2. **Whitespace canonicalization** (collapse multiple spaces, trim)
3. **Punctuation normalization** (smart quotes → straight quotes)
4. **Unit normalization** ("BPM" → "bpm", "hi-hats" → "hats")
5. **Synonym normalization** (builtin synonyms → canonical forms)
6. **Numeric normalization** ("two" → "2", "half" → "0.5")

**Examples**:

```
"Make the  Hi-Hats much   brighter"
→ "make the hats much brighter"

"Increase BPM to 96"
→ "increase bpm to 96"

"Add more reverb to the kick drum"
→ "add more reverb to the kick"
```

**Key Decisions**:

- Normalization is **lossy** but preserves original spans
- Original text is always available for error messages
- Normalization rules come from canon vocabulary tables
- Extension-provided synonyms are applied after core

**Implementation**: `gofai/canon/normalize.ts`

**Tests**: Unit tests for each normalization rule, property tests for idempotence

---

## Stage 2: Tokenization

**Purpose**: Break text into tokens with metadata for parsing.

**Input**: Normalized text string

**Output**: `Token[]` with spans and categories

**Token Structure**:

```typescript
interface Token {
  readonly text: string;           // Normalized form
  readonly originalText: string;   // As typed by user
  readonly span: { start: number; end: number };
  readonly category: TokenCategory;
  readonly lexemeId?: LexemeId;    // If matched to vocab
}

type TokenCategory =
  | 'word' | 'number' | 'punctuation'
  | 'unit' | 'entity_ref' | 'whitespace';
```

**Operations**:

1. **Lexeme matching**: Look up each word in vocabulary
2. **Multi-word construction detection**: "add reverb", "a little"
3. **Number parsing**: Detect numeric literals and ranges
4. **Entity reference detection**: Quoted names, section markers
5. **Span tracking**: Maintain original offsets for error reporting

**Examples**:

```
"make the chorus brighter"
→ [
    Token(text="make", category=word, lexemeId=lex:verb:make),
    Token(text="the", category=word, lexemeId=lex:det:the),
    Token(text="chorus", category=word, lexemeId=lex:noun:chorus),
    Token(text="brighter", category=word, lexemeId=lex:adj:brighter)
  ]
```

**Key Decisions**:

- Whitespace tokens are preserved for reconstruction
- Unknown words are NOT errors at this stage (might be entity names)
- Token categories enable parse optimizations

**Implementation**: `gofai/nl/tokenize.ts`

**Tests**: Golden corpus tests, round-trip tests (tokens → text → tokens)

---

## Stage 3: Parsing

**Purpose**: Build syntactic structure(s) from tokens.

**Input**: `Token[]`

**Output**: `ParseForest` (one or more syntax trees)

**Parse Tree Structure**:

```typescript
interface ParseNode {
  readonly rule: RuleId;
  readonly category: string;
  readonly children: readonly ParseNode[];
  readonly span: { start: number; end: number };
  readonly score: number; // Disambiguation weight
}

interface ParseForest {
  readonly trees: readonly ParseNode[];
  readonly ambiguous: boolean;
}
```

**Grammar Formalism**:

- **Earley parser** with weighted disambiguation
- Rules defined in `gofai/nl/grammar/*.ts`
- Supports ambiguity tracking for later clarification

**Core Grammar Categories**:

```
Command ::= Imperative | Question | Statement
Imperative ::= Verb NounPhrase PrepPhrase? AdvPhrase?
NounPhrase ::= Det? Adj* Noun
PrepPhrase ::= Prep NounPhrase
Adj ::= Axis | Comparator | Qualifier
```

**Key Decisions**:

- Keep **all** parses if ambiguous (prune by score, not discard)
- Parse failures produce partial trees for error recovery
- Rules have stable IDs for provenance tracking

**Implementation**: `gofai/nl/parse/*.ts`

**Tests**: Golden parse forests, ambiguity detection tests

---

## Stage 4: Semantic Composition

**Purpose**: Convert syntax trees into typed logical form (CPL-Intent).

**Input**: `ParseForest`

**Output**: `CPL-Intent` with possible holes (unresolved references)

**CPL-Intent Structure**:

```typescript
interface CPL_Intent {
  readonly goals: readonly Goal[];
  readonly constraints: readonly Constraint[];
  readonly scope: Scope;
  readonly provenance: SemanticProvenance;
}

interface Goal {
  readonly type: 'axis_change' | 'action' | 'query';
  readonly axis?: AxisId;
  readonly direction?: 'increase' | 'decrease';
  readonly amount?: Amount;
  readonly target?: EntityRef;
}

interface Constraint {
  readonly type: ConstraintTypeId;
  readonly params: Record<string, unknown>;
  readonly hard: boolean; // vs soft preference
}

interface Scope {
  readonly sections?: readonly string[];
  readonly layers?: readonly string[];
  readonly timeRange?: TimeRange;
  readonly selection?: 'current' | 'all';
}
```

**Semantic Rules**:

Each parse rule has a corresponding semantic action:

```typescript
// Example: "make X brighter" → axis_change goal
rule_imperative_axis_change: (verb, target, adj) => ({
  type: 'axis_change',
  axis: adj.axis, // From lexeme binding
  direction: adj.direction,
  target: target.ref, // May be unresolved
  amount: { type: 'default' } // Hole to be filled
})
```

**Key Decisions**:

- **Holes** are first-class: unresolved parts are explicitly marked
- Each semantic node has **provenance** (which lexeme/rule produced it)
- Type mismatches create holes, not errors (error later after pragmatics)
- Multiple parses → multiple CPL-Intents

**Implementation**: `gofai/nl/semantics/*.ts`

**Tests**: Golden CPL-Intent outputs, paraphrase invariance tests

---

## Stage 5: Pragmatic Resolution

**Purpose**: Resolve references, fill holes, apply conversational context.

**Input**: `CPL-Intent[]` (one per parse), `DialogueState`, `ProjectWorld`

**Output**: `CPL-Intent` (single, complete)

**Pragmatic Operations**:

1. **Anaphora resolution**: "it" → last-mentioned entity
2. **Deictic resolution**: "this" → UI selection
3. **Default inference**: "brighter" → "brighter by default amount"
4. **Scope inference**: "add drums" → "to current section" or "everywhere"?
5. **Presupposition checking**: "make the bass quieter" requires bass to exist
6. **Ambiguity detection**: Multiple valid resolutions → clarification

**Dialogue State**:

```typescript
interface DialogueState {
  readonly focusStack: readonly EntityRef[]; // Recent mentions
  readonly currentSelection?: EntityRef;
  readonly lastAction?: EditPackage;
  readonly preferences: UserPreferences;
}
```

**Clarification Protocol**:

If multiple resolutions are equally valid:

```typescript
{
  type: 'clarification',
  partialCpl: CPL_Intent,
  holes: [
    {
      type: 'ambiguous_reference',
      candidates: ['verse-1', 'verse-2'],
      question: "Which verse?"
    }
  ]
}
```

**Key Decisions**:

- **Never guess silently** (Semantic Safety Invariant #2)
- Use discourse salience to prefer recent entities
- UI selection overrides discourse context
- Defaults must be explicit and user-visible

**Implementation**: `gofai/pragmatics/*.ts`

**Tests**: Dialogue state tests, ambiguity detection goldens

---

## Stage 6: Typecheck & Validation

**Purpose**: Verify that the completed CPL-Intent is well-typed and satisfiable.

**Input**: Complete `CPL-Intent`

**Output**: `ValidationResult<CPL_Intent>`

**Type Checks**:

1. **Entity existence**: All references resolve to actual entities
2. **Type compatibility**: Axes apply to compatible targets
3. **Constraint satisfiability**: No contradictory constraints
4. **Capability checks**: Required capabilities are available
5. **Precondition checks**: Presuppositions hold in project state

**Constraint Compatibility**:

```typescript
// These are incompatible:
preserve(melody, exact) + change(melody) → ERROR

// These are compatible:
preserve(melody, exact) + change(harmony) → OK
only_change(drums) + change(drums) → OK
```

**Key Decisions**:

- Type errors are **fatal** (no execution)
- Warnings are allowed (user can override)
- Constraint conflicts are detected here, not during planning
- All semantic invariants are checked

**Implementation**: `gofai/cpl/typecheck.ts`

**Tests**: Type error tests, constraint conflict tests

---

## Stage 7: Planning

**Purpose**: Convert high-level goals into a sequence of concrete actions.

**Input**: Validated `CPL-Intent`, `ProjectWorld`

**Output**: `CPL-Plan` (sequence of opcodes with parameters)

**CPL-Plan Structure**:

```typescript
interface CPL_Plan {
  readonly steps: readonly PlanStep[];
  readonly score: PlanScore;
  readonly alternatives?: readonly CPL_Plan[]; // If multiple good plans
  readonly explanation: PlanExplanation;
}

interface PlanStep {
  readonly opcode: OpcodeId;
  readonly params: Record<string, unknown>;
  readonly scope: ResolvedScope;
  readonly reason: string; // Links back to goal
}

interface PlanScore {
  readonly goalSatisfaction: number; // How well goals are met
  readonly editCost: number; // How disruptive
  readonly constraintRisk: number; // Risk of constraint violations
}
```

**Planning Process**:

1. **Lever selection**: Map goals to candidate levers (from axis definitions)
2. **Opcode instantiation**: Fill in opcode parameters
3. **Scope calculation**: Compute exactly which entities are affected
4. **Constraint filtering**: Prune levers that would violate constraints
5. **Cost evaluation**: Score plans by satisfaction + cost
6. **Alternative generation**: Keep top N near-equal plans

**Example**:

```
Goal: increase(brightness, chorus)
Constraints: preserve(melody, exact)
→ Candidate Levers:
    1. raise_register(amount=+5st) — cost: medium, eff: 0.7
    2. adjust_voicing(brighter=true) — cost: low, eff: 0.6
    3. add_brightness_fx(amount=0.3) — cost: low, eff: 0.8
→ Filter by constraints:
    ✓ Lever 1: OK (doesn't affect melody notes)
    ✓ Lever 2: OK (voicing preserves melody)
    ✓ Lever 3: OK (FX doesn't change notes)
→ Score:
    Plan A: [Lever 3] — score: 0.92
    Plan B: [Lever 1] — score: 0.85
→ Present Plan A with Plan B as alternative
```

**Key Decisions**:

- Planning is **bounded**: depth limit, beam search
- **Least-change** is default preference
- Prolog KB is consulted for theory-driven options (chord subs, etc.)
- Plans are deterministic (no random selection)

**Implementation**: `gofai/planning/*.ts`

**Tests**: Planning goldens, constraint satisfaction tests, least-change tests

---

## Stage 8: Execution

**Purpose**: Apply the plan to the project and generate undo capability.

**Input**: `CPL-Plan`, `ProjectWorld`

**Output**: `EditPackage`

**EditPackage Structure**:

```typescript
interface EditPackage {
  readonly id: string;
  readonly cpl: CPL_Intent;
  readonly plan: CPL_Plan;
  readonly diff: ProjectDiff;
  readonly undoToken: UndoToken;
  readonly timestamp: number;
  readonly compilerVersion: string;
}

interface ProjectDiff {
  readonly eventDiffs: readonly EventDiff[];
  readonly paramDiffs: readonly ParamDiff[];
  readonly structureDiffs: readonly StructureDiff[];
  readonly summary: DiffSummary;
}

interface UndoToken {
  readonly type: 'undo_token';
  readonly packageId: string;
  readonly inverseOps: readonly InverseOp[];
}
```

**Execution Process**:

1. **Preflight checks**: Verify project invariants still hold
2. **Transactional apply**: Apply each opcode in a transaction
3. **Diff computation**: Compute before/after diffs
4. **Constraint verification**: Re-check all constraints post-apply
5. **Undo token generation**: Capture inverse operations
6. **Commit or rollback**: If constraints violated, rollback

**Transactional Semantics**:

```typescript
const before = snapshotProject(world);
try {
  for (const step of plan.steps) {
    applyOpcode(step, world);
  }
  const after = snapshotProject(world);
  const diff = computeDiff(before, after);
  
  if (!verifyConstraints(plan.constraints, before, after)) {
    rollback(world, before);
    throw new ConstraintViolation(...);
  }
  
  commit();
  return createEditPackage(plan, diff, ...);
} catch (e) {
  rollback(world, before);
  throw e;
}
```

**Key Decisions**:

- **All-or-nothing**: Either entire plan applies or none of it
- Diffs are **complete**: capture every change
- Undo is **perfect**: byte-for-byte restoration
- Edit packages are **serializable** and shareable

**Implementation**: `gofai/execution/*.ts`

**Tests**: Round-trip tests (apply + undo), diff accuracy tests, constraint verification tests

---

## Pipeline Determinism Guarantees

Every stage is deterministic:

| Stage | Determinism Source |
|-------|-------------------|
| Normalization | Pure string transformations, stable vocabulary |
| Tokenization | Stable lexeme matching, no randomness |
| Parsing | Stable grammar, deterministic tie-breakers |
| Semantics | Pure semantic rules, stable provenance |
| Pragmatics | Stable resolution order, explicit holes |
| Typecheck | Pure validation, no external calls |
| Planning | Stable scoring, no random beam search |
| Execution | Transactional, stable diff computation |

**Forbidden in Pipeline**:

- `Date.now()` (except in edit package metadata)
- `Math.random()`
- Network calls
- File I/O
- Hash map iteration (use stable sorting)
- Floating-point non-determinism

**Testing Determinism**:

```typescript
// Run same input twice, assert byte-identical output
const result1 = compiler.compile(text, state);
const result2 = compiler.compile(text, state);
assert(deepEqual(result1, result2));
```

---

## Error Handling Across Stages

Each stage can fail gracefully:

| Stage | Failure Mode | Recovery |
|-------|-------------|----------|
| Normalization | Invalid UTF-8 | Report source location, continue |
| Tokenization | Unknown words | Mark as unknown, continue |
| Parsing | No parse | Partial parse + error |
| Semantics | Type mismatch | Hole in CPL |
| Pragmatics | Ambiguity | Clarification question |
| Typecheck | Constraint conflict | Compilation error |
| Planning | No satisfying plan | Report which goal failed |
| Execution | Constraint violation | Rollback, report violation |

**Error Messages**:

All errors include:
- **What** went wrong
- **Where** in the input (span)
- **Why** it's a problem
- **Suggestions** for fixing

---

## Extension Points

Each stage supports extension:

1. **Normalization**: Extensions add synonym tables
2. **Tokenization**: Extensions add lexemes
3. **Parsing**: Extensions add grammar rules (namespaced)
4. **Semantics**: Extensions add semantic handlers
5. **Pragmatics**: Extensions add entity types for resolution
6. **Typecheck**: Extensions add constraint verifiers
7. **Planning**: Extensions add levers and opcodes
8. **Execution**: Extensions add opcode executors

All extensions are **namespaced** and **sandboxed**.

---

## Pipeline Performance

Target latencies (for typical project):

| Stage | Target | Notes |
|-------|--------|-------|
| Normalization | < 1ms | String ops |
| Tokenization | < 5ms | Vocabulary lookup |
| Parsing | < 50ms | Earley + beam |
| Semantics | < 10ms | Rule application |
| Pragmatics | < 20ms | Resolution + queries |
| Typecheck | < 10ms | Pure validation |
| Planning | < 100ms | Bounded search |
| Execution | < 50ms | Depends on scope |
| **Total** | **< 250ms** | Interactive |

**Optimization Strategies**:

- Incremental recomputation (reuse prior stages on edits)
- Aggressive caching (keyed by stable hashes)
- Lazy parse forest pruning
- Parallel opcode application (where safe)

---

## Future Enhancements

Planned pipeline improvements:

1. **Incremental parsing**: Reparse only changed tokens
2. **Parse caching**: Cache parse forests per normalized text
3. **Plan templates**: Reuse plans for similar requests
4. **Streaming execution**: Show diffs as they're computed
5. **Undo coalescing**: Group related edits into single undo

---

## Related Documentation

- [CPL Type System](cpl.md) — Formal specification of logical form
- [Semantic Safety Invariants](semantic-safety-invariants.md) — Guarantees at each stage
- [Opcodes Reference](opcodes.md) — Available actions
- [Extension API](extensions.md) — How to extend the pipeline

---

*This document is the SSOT for pipeline architecture. Changes to stage contracts require updating this doc.*
