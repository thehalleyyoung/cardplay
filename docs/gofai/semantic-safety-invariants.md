# GOFAI Music+ Semantic Safety Invariants

> Version 1.0.0 | Last updated: 2024

This document defines the **semantic safety invariants** for GOFAI Music+.
These invariants are non-negotiable guarantees that the system must uphold
at all times. They are designed to be testable requirements, not aspirational
goals.

## 1. Core Invariants

### 1.1 Constraint Executability Invariant

**Every constraint must be an executable check.**

```
∀ constraint C in CPL-Intent:
  ∃ verifier V: (ProjectState, EditPlan) → boolean
  such that V(state, plan) ↔ C is satisfied
```

This means:
- Constraints are not just annotations—they are runtime-checked predicates
- Every constraint type has a corresponding verifier function
- The verifier must be pure and deterministic
- If no verifier exists for a constraint type, compilation fails

**Test Requirements:**
- Unit tests for each constraint type's verifier
- Property tests: random plans that should fail constraint checks do fail
- Golden tests: known constraint violations produce expected error messages

### 1.2 Silent Ambiguity Prohibition

**No ambiguity may be resolved silently.**

```
∀ parse tree T with ambiguity A:
  IF A is semantic (affects meaning) THEN
    either (a) prompt user for clarification, or
           (b) fail with explicit "ambiguous" error
```

Types of ambiguity covered:
- **Referential**: "the verse" when multiple verses exist
- **Scope**: "add reverb to all drums and bass"
- **Degree**: "make it brighter" without degree specification
- **Temporal**: "after the drop" when drop timing is ambiguous
- **Comparison class**: "darker" without baseline

**Resolution Protocol:**
1. Detect ambiguity during semantic analysis
2. Generate clarification question following QUD model
3. Present options with default highlighted
4. Wait for explicit user resolution
5. Only then proceed to planning

**Test Requirements:**
- Ambiguity detection tests for each ambiguity type
- Golden tests: ambiguous inputs → clarification dialogs
- Negative tests: clear inputs do NOT trigger false clarification

### 1.3 Constraint Preservation Invariant

**Preserve constraints are inviolable during planning.**

```
∀ plan P and preserve constraint PRESERVE(target, aspects):
  let before = snapshot(target, aspects)
  let after = applyPlan(P, state)
  ASSERT before == after
```

Preserved aspects include:
- `melody`: pitch sequence, rhythm, note durations
- `harmony`: chord progression, voicings
- `rhythm`: onset patterns, groove characteristics
- `structure`: section boundaries, form
- `timbre`: sound design, processing chain
- `dynamics`: velocity patterns, automation

**Test Requirements:**
- Round-trip tests: apply edit → verify preserved aspects unchanged
- Golden tests: plans that violate preservation → planning error
- Fuzzing: random edits + random preservations → verify invariant holds

### 1.4 Referent Resolution Completeness

**All referential expressions must resolve or fail explicitly.**

```
∀ referential expression R in CPL:
  ∃ entities E in ProjectWorld
  such that R resolves to E, or
  compilation fails with "unresolved reference" error
```

Categories of referential expressions:
- Definite descriptions: "the chorus", "the bass"
- Demonstratives: "this section", "these notes"
- Anaphora: "it", "them", "there"
- Bound variables: "each track", "every verse"
- Names: "Track 3", "Verse 1"

**Resolution Order:**
1. Check explicit names (Track 3)
2. Check selection context (UI selection)
3. Check discourse context (recent mentions)
4. Check structural uniqueness (the only chorus)
5. If no unique referent → ambiguity error

**Test Requirements:**
- Resolution tests for each referential type
- Precedence tests: verify resolution order
- Failure tests: unresolvable references → clear errors

### 1.5 Effect Typing Invariant

**Every operation has a declared effect type.**

```
∀ operation O in CPL-Plan:
  O ∈ {inspect, propose, mutate}
  AND effect(O) is declared in opcode definition
```

Effect semantics:
- `inspect`: Read-only, never changes state
- `propose`: Generates a plan but does not apply it
- `mutate`: Actually modifies project state

**Invariant Rules:**
1. `inspect` operations may run freely
2. `propose` operations require preview confirmation
3. `mutate` operations require explicit user approval
4. No operation may have hidden side effects
5. Effect types are statically checked at compile time

**Test Requirements:**
- Type tests: verify each opcode's effect declaration
- Isolation tests: inspect operations have no side effects
- Permission tests: mutate requires approval flag

### 1.6 Determinism Invariant

**Same input + same state = same output.**

```
∀ input I, state S, time T1, T2:
  compile(I, S, T1) == compile(I, S, T2)
```

Sources of non-determinism to prohibit:
- Random number generation
- Current time/date
- External API calls
- Hash map iteration order
- Floating-point non-determinism
- Thread scheduling

**Implementation Requirements:**
1. All collections use stable sorting
2. Random seeds are explicit parameters (never automatic)
3. No network calls in compilation path
4. All floating-point uses fixed precision
5. Compilation is single-threaded or deterministically concurrent

**Test Requirements:**
- Replay tests: same input + state → same output
- Timing tests: output independent of wall clock
- Ordering tests: collection ordering is stable

### 1.7 Undoability Invariant

**Every mutation is reversible.**

```
∀ mutation M:
  ∃ inverse M⁻¹: (appliedState, undoToken) → originalState
  such that apply(M⁻¹, apply(M, S)) == S
```

Requirements:
- Every `mutate` operation produces an undo token
- Undo tokens are linear (consumed exactly once)
- Undo restores exact previous state (byte-for-byte)
- Redo is undo of undo
- Undo history persists across sessions

**Test Requirements:**
- Round-trip tests: apply → undo → verify identical
- Token linearity: double-undo fails gracefully
- Persistence tests: reload project → undo still works

---

## 2. Secondary Invariants

### 2.1 Scope Visibility Invariant

**Every edit's scope is visible before execution.**

```
∀ CPL-Plan P with scope S:
  UI must highlight S before user approval
```

Scope includes:
- Which sections are affected
- Which layers/tracks are affected  
- Which time range is affected
- Which parameters are affected

### 2.2 Plan Explainability Invariant

**Every step in a plan is explainable.**

```
∀ step S in CPL-Plan:
  ∃ explanation E: NaturalLanguage
  where E describes what S does and why
```

Explanation components:
- What operation is performed
- What entity is affected
- What the expected change is
- Why this step (link to original intent)

### 2.3 Constraint Compatibility Invariant

**Conflicting constraints are detected, not ignored.**

```
∀ constraints C1, C2 in same request:
  IF incompatible(C1, C2) THEN
    fail with "constraint conflict" error
```

Conflict examples:
- PRESERVE(melody) + CHANGE(melody)
- tempo > 200 + tempo < 100
- add(drums) + ONLY_CHANGE(harmony)

### 2.4 Presupposition Verification Invariant

**Presuppositions are verified, not assumed.**

```
∀ presupposition P triggered by expression E:
  IF NOT verify(P, state) THEN
    fail with "presupposition failure" error
```

Presupposition examples:
- "make the drums quieter" presupposes drums exist
- "the other verse" presupposes multiple verses
- "do it again" presupposes prior action exists

### 2.5 Extension Isolation Invariant

**Extension semantics cannot break core invariants.**

```
∀ extension X with semantics S:
  S operates within sandbox
  S cannot violate core invariants
  S failures do not crash core compiler
```

Sandbox restrictions:
- No access to file system
- No network access
- Memory/time limits
- Cannot modify core vocabulary
- Must declare capability requirements

---

## 3. Testable Requirements Matrix

| Invariant | Unit Tests | Property Tests | Golden Tests | Fuzzing |
|-----------|-----------|----------------|--------------|---------|
| Constraint Executability | ✓ | ✓ | ✓ | - |
| Silent Ambiguity Prohibition | ✓ | - | ✓ | - |
| Constraint Preservation | ✓ | ✓ | ✓ | ✓ |
| Referent Resolution | ✓ | - | ✓ | - |
| Effect Typing | ✓ | ✓ | - | - |
| Determinism | ✓ | ✓ | ✓ | ✓ |
| Undoability | ✓ | ✓ | ✓ | ✓ |
| Scope Visibility | ✓ | - | ✓ | - |
| Plan Explainability | ✓ | - | ✓ | - |
| Constraint Compatibility | ✓ | ✓ | ✓ | - |
| Presupposition Verification | ✓ | - | ✓ | - |
| Extension Isolation | ✓ | ✓ | - | ✓ |

---

## 4. Enforcement Mechanisms

### 4.1 Static Enforcement

- TypeScript types encode invariants where possible
- Branded types prevent mixing incompatible IDs
- Effect types are declared in opcode definitions
- Constraint types have associated verifier functions

### 4.2 Runtime Enforcement

- Assertion checks at invariant boundaries
- Undo token linearity checked at consumption
- Constraint verification before plan execution
- Scope calculation before UI display

### 4.3 Test Enforcement

- CI runs full invariant test suite
- Property-based testing with fast-check
- Golden test corpus with versioned expectations
- Fuzz testing for stateful invariants

### 4.4 Review Enforcement

- PRs modifying invariant code require extra review
- New features must include invariant test coverage
- Invariant violations are P0 bugs

---

## 5. Invariant Violation Responses

| Violation | Response | User Impact |
|-----------|----------|-------------|
| Constraint not executable | Compile error | Cannot add constraint |
| Silent ambiguity | Compile error | Forced clarification |
| Preservation violated | Plan rejected | Edit blocked |
| Referent unresolved | Compile error | Prompted to specify |
| Effect type missing | Type error | Developer fix |
| Non-determinism | Build error | None (CI catches) |
| Undo impossible | Mutation blocked | Edit rejected |

---

## 6. Appendix: Formal Notation

### Type Definitions

```
type Invariant = {
  name: string;
  description: string;
  predicate: (state: ProjectState, operation: Operation) => boolean;
  tests: TestSuite;
}

type InvariantViolation = {
  invariant: Invariant;
  operation: Operation;
  state: ProjectState;
  evidence: string;
}

type InvariantCheck = 
  | { ok: true }
  | { ok: false; violation: InvariantViolation }
```

### Verification Functions

```
function verifyAllInvariants(
  state: ProjectState,
  plan: CPLPlan
): InvariantCheck[] {
  return CORE_INVARIANTS.map(inv => 
    inv.predicate(state, plan)
      ? { ok: true }
      : { ok: false, violation: { invariant: inv, ... } }
  );
}

function planSatisfiesInvariants(
  state: ProjectState,
  plan: CPLPlan
): boolean {
  return verifyAllInvariants(state, plan).every(c => c.ok);
}
```

---

*This document is the SSOT for semantic safety invariants. Any behavior
that violates these invariants is a bug, not a feature.*
