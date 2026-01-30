# GOFAI Music+ Product Contract

> **Version**: 1.0.0  
> **Last Updated**: 2026-01-29  
> **Status**: Canonical  
> **Tags**: [Infra][HCI]

This document defines the **GOFAI Music+ Product Contract**: the non-negotiable guarantees, architectural commitments, operational boundaries, and explicit non-goals that govern the GOFAI Music+ system within CardPlay.

GOFAI Music+ is a **deterministic language compiler** that translates natural language music instructions into typed musical logic (CPL) and verified edits. It is not a chat assistant, not a probabilistic model, and not a creative co-pilot. It is a **compiler** with all the discipline, predictability, and trustworthiness that word implies.

---

## Table of Contents

1. [Product Definition](#product-definition)
2. [Core Guarantees](#core-guarantees)
   - [Offline Operation](#guarantee-1-offline-operation)
   - [Determinism](#guarantee-2-determinism)
   - [Inspectability](#guarantee-3-inspectability)
   - [Undoability](#guarantee-4-undoability)
3. [Architectural Commitments](#architectural-commitments)
4. [Operational Boundaries](#operational-boundaries)
5. [Trust Model](#trust-model)
6. [Non-Goals (Explicit)](#non-goals-explicit)
7. [Success Criteria](#success-criteria)
8. [Versioning and Compatibility](#versioning-and-compatibility)
9. [Glossary](#glossary)
10. [References](#references)

---

## Product Definition

### What GOFAI Music+ Is

GOFAI Music+ is a **typed language compiler** integrated into CardPlay that:

1. **Parses** natural language music instructions into structured tokens with span tracking
2. **Composes** semantic meaning into typed logical form (CPL - CardPlay Logic)
3. **Resolves** references and ambiguities through explicit pragmatic rules
4. **Validates** meaning against project state, constraints, and capabilities
5. **Plans** bounded, least-change edits to achieve user goals under constraints
6. **Executes** verified mutations with full diff tracking and undo support
7. **Explains** every decision in human-readable, auditable form

### The Compiler Metaphor

Like a programming language compiler, GOFAI Music+ has:

- A **frontend** (lexer, parser, semantic analysis)
- A **middle-end** (type checking, optimization, pragmatic resolution)
- A **backend** (code generation to CardPlay mutations)
- **Diagnostics** (errors, warnings, clarification requests)
- **Deterministic output** (same input → same output, always)

Unlike an LLM or assistant:

- No probabilistic sampling
- No hallucination possible (meaning is derived from rules, not generated)
- No network dependency at runtime
- No "creativity" or "suggestions" outside explicit mechanisms
- Full auditability of every decision

### The User Promise

> "When I speak to GOFAI Music+ in natural language, I can trust that:
> - It understands exactly what I said (or tells me precisely what was ambiguous)
> - It shows me exactly what it plans to do (before doing anything)
> - It does exactly what it showed me (no more, no less)
> - I can undo everything it did (with full fidelity)
> - All of this works offline, without network access, forever."

---

## Core Guarantees

### Guarantee 1: Offline Operation

**Statement**: GOFAI Music+ operates entirely offline. No network connectivity is required for any runtime operation.

**What This Means**:

1. **No Cloud Dependencies**
   - Parsing does not call external APIs
   - Semantic analysis is local computation
   - Planning uses local Prolog inference, not remote services
   - Execution mutates local state only
   - All knowledge bases are bundled locally

2. **No Telemetry at Runtime**
   - Parse decisions are not logged to external servers
   - User instructions are never transmitted
   - Project state never leaves the local machine
   - No "phone home" behavior under any circumstance

3. **Works Air-Gapped**
   - Full functionality in airplane mode
   - Full functionality in classified/isolated environments
   - No degraded mode for offline operation (it's the only mode)

4. **Assets Stay Local**
   - Audio files never leave the machine
   - Project structure never leaves the machine
   - Edit history never leaves the machine
   - User preferences never leave the machine

**Implementation Requirements**:

```typescript
// All GOFAI runtime modules MUST satisfy this constraint:
interface OfflineConstraint {
  // No fetch(), XMLHttpRequest, WebSocket, or network APIs
  // No dynamic imports from URLs
  // No service worker network interception
  // All knowledge bases are static imports or bundled assets
}
```

**Verification**:

- Static analysis: grep for network APIs in GOFAI modules
- Runtime audit: CSP policy preventing GOFAI network access
- Build-time check: verify no external URL dependencies
- Test suite: all tests pass with network disabled

**Exceptions (None)**:

There are no exceptions. If a future feature requires network access (e.g., collaborative editing), it must be:
- A separate module outside GOFAI core
- Explicitly labeled as network-dependent
- Not part of the compilation/execution pipeline

---

### Guarantee 2: Determinism

**Statement**: GOFAI Music+ produces identical outputs for identical inputs. Same utterance + same project state → same CPL + same plan + same diff.

**What This Means**:

1. **No Randomness**
   - No `Math.random()` in any decision path
   - No probabilistic disambiguation
   - No sampling from distributions
   - No temperature-based selection

2. **No Time-Dependence in Logic**
   - `Date.now()` is forbidden in semantic/planning paths
   - Timestamps appear only in metadata (package IDs, audit logs)
   - No "fresher is better" recency bias in selection
   - Stable ordering under clock changes

3. **Stable Ordering**
   - Parse forests use stable comparison functions
   - Plan candidates use deterministic tie-breakers
   - Entity references resolve in stable order
   - Diff outputs use canonical event ordering

4. **Reproducibility**
   - Replay of logged utterance produces identical CPL
   - Replay of plan produces identical diff
   - Version fingerprints ensure cross-version reproducibility
   - Fixtures define expected behavior under specific compiler versions

**Implementation Requirements**:

```typescript
// All GOFAI decision functions MUST be pure:
type PureDecision<I, O> = (input: I) => O;
// No side effects, no global state reads, no randomness

// Ordering functions MUST be total orders with stable tie-breakers:
type StableCompare<T> = (a: T, b: T) => -1 | 0 | 1;
// Must return 0 only for genuinely equal items
// Must break ties using stable secondary keys (IDs, creation order)

// Time-dependent operations MUST be isolated:
interface ExecutionMetadata {
  readonly timestamp: number;     // Recording only, not decision input
  readonly packageId: string;     // Stable hash of CPL + plan + version
}
```

**Verification**:

- Double-run tests: parse twice, assert identical CPL
- Replay tests: execute logged plan, assert identical diff
- Fuzz tests: random ordering of inputs, assert stable outputs
- Clock-skew tests: run with mocked clocks, assert no behavior change

**Exceptions (Enumerated)**:

1. **Metadata timestamps**: Edit packages include creation timestamps for audit purposes. These do not affect behavior.

2. **Cache performance**: Caching may cause faster execution, but outputs remain identical.

3. **UI rendering order**: Non-semantic UI elements (tooltip positions, animation timing) may vary.

---

### Guarantee 3: Inspectability

**Statement**: Every GOFAI Music+ decision is auditable. Users can inspect exactly what was understood, why, and what will change.

**What This Means**:

1. **Parse Transparency**
   - Token spans link to original text
   - Parse tree shows grammatical structure
   - Semantic nodes show rule IDs that created them
   - Ambiguities are surfaced, never hidden

2. **Meaning Transparency**
   - CPL shows normalized logical form
   - References show how they were resolved
   - Defaults show where they were applied
   - Holes show what remains underspecified

3. **Plan Transparency**
   - Each plan step links to the goal it serves
   - Cost estimates are visible
   - Constraint checks show pass/fail with details
   - Alternative plans are visible when requested

4. **Execution Transparency**
   - Diffs show exactly what changed
   - Before/after comparisons are available
   - Constraint validation results are shown
   - Undo instructions are explicit

5. **Provenance Chains**
   - Every CPL node traces to source words
   - Every plan step traces to CPL nodes
   - Every mutation traces to plan steps
   - Complete "why" chains from utterance to edit

**Implementation Requirements**:

```typescript
// All CPL nodes carry provenance:
interface CPLNode {
  readonly type: string;
  readonly provenance: {
    readonly sourceSpan: TextSpan;      // Original text location
    readonly ruleId: RuleId;            // Grammar/semantic rule
    readonly lexemeId?: LexemeId;       // Lexicon entry if applicable
    readonly resolutionTrace?: string;  // How references were resolved
  };
}

// All plan steps carry explanations:
interface PlanStep {
  readonly opcode: OpcodeId;
  readonly params: Record<string, unknown>;
  readonly reason: string;              // Human-readable goal link
  readonly goalIds: GoalId[];           // Formal goal links
  readonly estimatedCost: number;       // Edit cost estimate
}

// All diffs carry summaries:
interface DiffSummary {
  readonly eventChanges: EventDiff[];
  readonly paramChanges: ParamDiff[];
  readonly structureChanges: StructureDiff[];
  readonly humanSummary: string;        // "Chorus: hats density +20%"
}
```

**Verification**:

- Provenance coverage: every CPL node has non-empty provenance
- Explanation coverage: every plan step has non-empty reason
- UI tests: all inspectable data is accessible in UI
- Snapshot tests: provenance chains match expected format

**Exceptions (None)**:

All decisions are inspectable. There is no "black box" behavior.

---

### Guarantee 4: Undoability

**Statement**: Every GOFAI Music+ mutation is fully reversible. Users can undo any change with complete fidelity.

**What This Means**:

1. **Atomic Edit Packages**
   - Each user action produces one `EditPackage`
   - Packages are indivisible units of undo
   - No partial rollbacks within a package
   - Clear boundaries between packages

2. **Complete Reversal**
   - Undo restores exact prior state
   - No "approximate" or "best effort" rollback
   - Event data is identical after undo
   - Parameter values are identical after undo

3. **Undo History Persistence**
   - Edit history survives app restart
   - Edit history survives project reload
   - Edit history is bounded but configurable
   - Old packages can be archived, not lost

4. **Redo Consistency**
   - Redo reapplies the same mutations
   - Redo validates constraints in current context
   - Redo may fail if world state changed incompatibly
   - Failure produces clear explanation, not silent corruption

5. **Addressable Undo**
   - Undo by recency ("undo last")
   - Undo by package ID ("undo package X")
   - Undo by scope ("undo chorus changes")
   - Undo by turn ("undo that edit")

**Implementation Requirements**:

```typescript
// EditPackage is the atomic undo unit:
interface EditPackage {
  readonly id: EditPackageId;           // Stable, hashable identifier
  readonly cpl: CPLRequest;             // The normalized intent
  readonly plan: CPLPlan;               // The executed plan
  readonly diff: ProjectDiff;           // What changed
  readonly inverse: ProjectDiff;        // How to undo
  readonly timestamp: number;           // When applied
  readonly version: CompilerVersion;    // Compiler fingerprint
}

// Undo operations MUST be lossless:
declare function applyUndo(pkg: EditPackage): void;
// Post-condition: project state === state before applyEdit(pkg)

// Redo operations MUST validate:
declare function applyRedo(pkg: EditPackage): RedoResult;
type RedoResult = 
  | { success: true; diff: ProjectDiff }
  | { success: false; reason: string; conflicts: Conflict[] };
```

**Verification**:

- Roundtrip tests: apply → undo → assert identical state
- Property tests: random edits, random undos, assert consistency
- Persistence tests: restart app, assert undo history intact
- Conflict tests: mutate world, redo, assert graceful failure

**Exceptions (Enumerated)**:

1. **External mutations**: If something outside GOFAI changes project state (manual edits, other tools), GOFAI's undo may conflict. Conflicts are detected and reported, not silently corrupted.

2. **History limits**: Undo history may be bounded by user configuration. Evicted packages are archived or deleted per policy.

---

## Architectural Commitments

### Commitment 1: Separation of Concerns

The GOFAI Music+ pipeline is strictly layered:

```
┌─────────────────────────────────────────────────────────────────┐
│ Layer 1: Tokenization + Normalization                           │
│   Input: Raw text                                               │
│   Output: Token stream with spans                               │
│   Guarantee: Reversible, span-preserving                        │
├─────────────────────────────────────────────────────────────────┤
│ Layer 2: Parsing                                                │
│   Input: Token stream                                           │
│   Output: Parse forest (may be ambiguous)                       │
│   Guarantee: Deterministic, covers all valid parses             │
├─────────────────────────────────────────────────────────────────┤
│ Layer 3: Semantic Composition                                   │
│   Input: Parse tree(s)                                          │
│   Output: CPL-Intent (may have holes)                           │
│   Guarantee: Compositional, rule-based                          │
├─────────────────────────────────────────────────────────────────┤
│ Layer 4: Pragmatic Resolution                                   │
│   Input: CPL-Intent + dialogue state + project state            │
│   Output: Resolved CPL-Intent (or clarification request)        │
│   Guarantee: Explicit resolution rules, no silent guessing      │
├─────────────────────────────────────────────────────────────────┤
│ Layer 5: Type Checking + Validation                             │
│   Input: Resolved CPL-Intent                                    │
│   Output: Validated CPL-Intent (or structured error)            │
│   Guarantee: All constraints checked, all types verified        │
├─────────────────────────────────────────────────────────────────┤
│ Layer 6: Planning                                               │
│   Input: Validated CPL-Intent + project state                   │
│   Output: CPL-Plan (bounded action sequence)                    │
│   Guarantee: Constraint-respecting, least-change preferred      │
├─────────────────────────────────────────────────────────────────┤
│ Layer 7: Execution                                              │
│   Input: CPL-Plan                                               │
│   Output: EditPackage (mutations + diff + undo)                 │
│   Guarantee: Transactional, reversible, diff-tracked            │
├─────────────────────────────────────────────────────────────────┤
│ Layer 8: Explanation                                            │
│   Input: EditPackage                                            │
│   Output: Human-readable summary + UI bindings                  │
│   Guarantee: Complete provenance, actionable diagnostics        │
└─────────────────────────────────────────────────────────────────┘
```

Each layer:
- Has a well-defined input and output type
- Is independently testable
- Does not reach into other layers' internals
- Communicates through typed interfaces only

### Commitment 2: Canon Discipline

All vocabulary is canonical:

- **Lexemes**: SSOT in `src/gofai/canon/lexemes.ts`
- **Axes**: SSOT in `src/gofai/canon/perceptual-axes.ts`
- **Opcodes**: SSOT in `src/gofai/canon/edit-opcodes.ts`
- **Constraints**: SSOT in `src/gofai/canon/constraint-types.ts`
- **Units**: SSOT in `src/gofai/canon/units.ts`

Canon rules:
- Every vocabulary item has a stable ID
- Every synonym maps to a canonical form
- Normalizers are generated from canon tables
- Tests validate canon table integrity
- Drift between code and docs blocks CI

### Commitment 3: Extensibility at the Edges

Core grammar is stable; bindings are extensible:

- Core constructions (scope, coordination, negation) are fixed
- Extensions contribute nouns, verbs, constraints, opcodes
- Extensions are namespaced (`namespace:identifier`)
- Extensions declare schemas for their contributions
- Unknown extensions are parseable but not executable

### Commitment 4: CardPlay Integration

GOFAI Music+ is part of CardPlay, not beside it:

- Uses CardPlay's type system (`Event<P>`, branded IDs, etc.)
- Uses CardPlay's store/undo infrastructure
- Uses CardPlay's board/deck/panel layout system
- Uses CardPlay's Prolog integration
- Emits CardPlay host actions and state mutations

---

## Operational Boundaries

### Boundary 1: Language Scope

GOFAI Music+ handles:
- Imperatives ("make it darker", "add reverb")
- Coordinations ("make it darker and less busy")
- Comparatives ("more lift", "brighter than before")
- Scopes ("in the chorus", "on the drums", "for two bars")
- Constraints ("keep the melody", "don't change the chords")
- References ("that", "it", "the same thing again")
- Quantities ("two bars", "slightly", "a lot")
- Questions about state ("what chords are here?")
- Questions about actions ("why did you do that?")
- Undo commands ("undo that", "go back")

GOFAI Music+ does NOT handle:
- Arbitrary conversation ("how's your day?")
- Non-music domains ("write me an email")
- Philosophical questions ("what is music?")
- Requests outside project scope ("search the internet")

### Boundary 2: Action Scope

GOFAI Music+ can:
- Edit events (notes, controls, automation)
- Edit card parameters
- Add/remove cards in limited contexts
- Navigate boards and decks
- Set MusicSpec constraints
- Query project state

GOFAI Music+ cannot:
- Create new project files
- Access file system beyond project
- Make network requests
- Execute arbitrary code
- Modify CardPlay configuration
- Access other applications

### Boundary 3: Knowledge Scope

GOFAI Music+ knows:
- Music theory (keys, modes, chords, cadences)
- Production concepts (EQ, compression, width)
- Arrangement concepts (form, texture, dynamics)
- CardPlay concepts (boards, decks, cards, events)

GOFAI Music+ does NOT know:
- Specific songs or artists (no copyright knowledge)
- Historical music facts (no encyclopedic knowledge)
- Current events (no temporal knowledge)
- User personal information (no memory across projects)

---

## Trust Model

### Who Trusts Whom

```
┌─────────────────────────────────────────────────────────────────┐
│ User                                                            │
│   Trusts: GOFAI core (offline, deterministic, inspectable)      │
│   Trusts: CardPlay project integrity                            │
│   Distrusts: Extensions by default (must explicitly enable)     │
│   Controls: Board policies, execution approval, undo            │
├─────────────────────────────────────────────────────────────────┤
│ GOFAI Core                                                      │
│   Trusts: Canon vocabulary (source of truth)                    │
│   Trusts: CardPlay store (project state)                        │
│   Trusts: Prolog KB (music theory facts)                        │
│   Distrusts: Extensions (validates, sandboxes)                  │
│   Distrusts: User input (parses, validates, clarifies)          │
├─────────────────────────────────────────────────────────────────┤
│ Extensions                                                       │
│   Provides: Lexemes, bindings, constraints, opcodes             │
│   Cannot: Execute mutations directly                            │
│   Cannot: Access network                                        │
│   Cannot: Bypass core validation                                │
│   Subject to: Namespace requirements, schema validation         │
└─────────────────────────────────────────────────────────────────┘
```

### Trust Verification

1. **Core Code Trust**: Verified by code review, type checking, test coverage
2. **Canon Trust**: Verified by automated checks, drift detection
3. **Extension Trust**: Verified by namespace validation, capability checks
4. **User Intent Trust**: Verified by clarification, preview, explicit apply

---

## Non-Goals (Explicit)

The following are **explicitly not goals** of GOFAI Music+. This section exists to prevent scope creep and clarify what the system will never do.

### Non-Goal 1: Creative Authorship

GOFAI Music+ does NOT:
- "Write music" or "compose"
- Suggest creative ideas unprompted
- Have aesthetic preferences
- Make artistic judgments
- Compete with the user's creativity

**Rationale**: GOFAI Music+ is a tool for executing user intent, not a creative partner. The user is the author; the system is the compiler.

### Non-Goal 2: Probabilistic Generation

GOFAI Music+ does NOT:
- Use LLMs for runtime decisions
- Sample from probability distributions
- Generate varied outputs for the same input
- Have "temperature" or "creativity" settings
- Produce "surprising" results

**Rationale**: Determinism is a core guarantee. Probabilistic systems cannot provide the trust surface we require.

### Non-Goal 3: Natural Conversation

GOFAI Music+ does NOT:
- Engage in chitchat
- Remember personal details across sessions
- Have a "personality"
- Express opinions
- Use filler phrases or hedging

**Rationale**: GOFAI Music+ is a compiler interface, not a social agent. Professional, precise, minimal.

### Non-Goal 4: External Knowledge

GOFAI Music+ does NOT:
- Search the internet
- Access databases of songs
- Know about current events
- Reference copyrighted material
- Learn from user data

**Rationale**: Offline operation and copyright safety require bounded knowledge.

### Non-Goal 5: Unrestricted Execution

GOFAI Music+ does NOT:
- Execute without user approval in low-control contexts
- Bypass board policies
- Ignore constraints
- Make "helpful" changes beyond what was requested
- Auto-apply in manual boards

**Rationale**: User control is paramount. The system does exactly what was approved, nothing more.

### Non-Goal 6: Perfect Natural Language Understanding

GOFAI Music+ does NOT:
- Understand arbitrary English
- Parse poetic or metaphorical language perfectly
- Handle every possible phrasing
- Achieve human-level comprehension

**Rationale**: The system handles a **specific sublanguage** (music editing commands). It is designed to succeed in that domain and fail gracefully outside it.

### Non-Goal 7: Visual/Audio Analysis

GOFAI Music+ does NOT:
- Listen to audio to understand it
- Read notation images
- Transcribe recordings
- Analyze audio waveforms

**Rationale**: GOFAI Music+ operates on structured project state (events, cards, parameters), not raw audio/visual data.

### Non-Goal 8: Cross-Project Memory

GOFAI Music+ does NOT:
- Remember preferences across projects by default
- Learn from one project to apply in another
- Build a model of the user over time
- Share data between sessions

**Rationale**: Privacy and predictability require project-scoped operation. User preference profiles, if implemented, are explicit and portable.

### Non-Goal 9: Real-Time Audio Processing

GOFAI Music+ does NOT:
- Run during audio playback
- Affect audio rendering directly
- Operate at audio sample rate
- Block the audio thread

**Rationale**: GOFAI Music+ is an editing tool, not a DSP processor. It modifies project state; the audio engine renders.

### Non-Goal 10: Mobile/Embedded First

GOFAI Music+ does NOT:
- Prioritize mobile performance
- Run on microcontrollers
- Minimize memory footprint aggressively
- Support minimal compute environments

**Rationale**: The target is professional desktop use. The 100K+ LOC parser requires resources. Future optimization is possible but not a constraint on initial design.

---

## Success Criteria

### Quantitative Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Semantic reliability under paraphrase | ≥95% | Same CPL for paraphrase pairs |
| Constraint correctness | 100% | No constraint violations in output |
| Edit reversibility | 100% | Roundtrip undo/redo fidelity |
| Parse latency (typical) | <200ms | P95 for single-sentence input |
| Plan latency (typical) | <500ms | P95 for chorus-level scope |
| Clarification load | <0.5 per edit | Questions per successful edit |
| User trust (survey) | ≥4/5 | "I trust GOFAI to do what I asked" |

### Qualitative Criteria

1. **Musicians can speak naturally**: No need to learn "command language"
2. **Clarifications are musically meaningful**: Not "computer questions"
3. **Previews are useful**: Users can predict what will happen
4. **Undos are reliable**: Users are not afraid to try things
5. **Explanations are clear**: Users understand what happened and why
6. **Integration is seamless**: Feels like CardPlay, not a separate tool

---

## Versioning and Compatibility

### Schema Versions

- **CPL Schema**: Versioned independently, migration functions required
- **Plan Schema**: Versioned with CPL, compatible migration
- **Edit Package Schema**: Includes compiler version fingerprint
- **Extension Schema**: Includes extension version, validated on load

### Compatibility Rules

1. **Forward Compatibility**: New compiler can read old CPL (with migration)
2. **Backward Compatibility**: Old CPL is preserved in edit history (not rewritten)
3. **Extension Compatibility**: Extension version recorded in packages
4. **Breaking Changes**: Require major version bump, migration documentation

### Version Fingerprint

```typescript
interface CompilerVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly lexiconHash: string;   // Hash of canon tables
  readonly grammarHash: string;   // Hash of grammar rules
  readonly prologHash: string;    // Hash of KB facts
}
```

---

## Glossary

| Term | Definition |
|------|------------|
| **CPL** | CardPlay Logic — the typed intermediate representation for user intent |
| **CPL-Intent** | High-level user meaning (goals, constraints, scope) |
| **CPL-Plan** | Validated action sequence (opcodes with parameters) |
| **CPL-Host** | CardPlay-specific mutations (event edits, param changes) |
| **Edit Package** | Atomic unit of mutation (CPL + plan + diff + undo) |
| **Canon** | Single source of truth vocabulary tables |
| **Hole** | Underspecified part of CPL requiring clarification |
| **Lever** | Concrete musical action that affects a perceptual axis |
| **Axis** | Perceptual dimension (brightness, energy, width, etc.) |
| **Opcode** | Named action type in CPL-Plan |
| **Scope** | Region of project affected by an edit |
| **Provenance** | Trace from output back to input source |

---

## References

- [GOFAI Music+ Architecture](../gofaimusicplus.md) — Detailed technical blueprint
- [CPL Type System](cpl.md) — CPL types and schemas
- [Perceptual Axes](perceptual-axes.md) — Axis vocabulary and lever mappings
- [Clarification Design](clarification.md) — Ambiguity handling strategy
- [Security Model](security.md) — Offline and asset protection guarantees
- [Testing Strategy](testing.md) — Golden tests and paraphrase invariance
- [Extension Spec](extensions.md) — How third-party extensions integrate
- [Canon System](../canon/ids.md) — CardPlay canon discipline

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-01-29 | GOFAI Team | Initial product contract |

---

## Approval

This document is the canonical definition of what GOFAI Music+ is and is not. All implementation decisions must be consistent with these guarantees and non-goals. Deviations require explicit amendment of this contract.

```
┌─────────────────────────────────────────────────────────────────┐
│  GOFAI MUSIC+ PRODUCT CONTRACT                                  │
│                                                                 │
│  Core Guarantees:                                               │
│    ✓ Offline — No network at runtime, ever                      │
│    ✓ Deterministic — Same input → same output, always           │
│    ✓ Inspectable — Every decision is auditable                  │
│    ✓ Undoable — Every mutation is reversible                    │
│                                                                 │
│  This is a compiler, not a chat assistant.                      │
│  This is a tool, not a creative partner.                        │
│  This is trustworthy by design, not by hope.                    │
└─────────────────────────────────────────────────────────────────┘
```
