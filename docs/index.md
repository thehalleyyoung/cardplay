# CardPlay Documentation

**Status:** implemented  
**Canonical terms used:** Board, BoardDeck, Card<A,B>, Stack (composition), EventStream, ClipRecord, RoutingGraph, MusicSpec, MusicConstraint, HostAction, OntologyPack  
**Primary code references:** `cardplay/src/types/*`, `cardplay/src/cards/*`, `cardplay/src/boards/*`, `cardplay/src/state/*`, `cardplay/src/ai/*`  
**Analogy:** This documentation hub is the "rulebook index" for the CardPlay game board—linking to canonical definitions for every game piece, zone, and rule.  
**SSOT:** If this doc conflicts with anything, follow `to_fix.md` + `cardplay/docs/canon/**` + `cardplay/src/**`

---

## Single Source of Truth (SSOT) Declaration

This documentation set follows a strict authority order when resolving conflicts:

1. **`cardplay/src/**`** — Truth for *what exists today* (types, stores, IDs, file paths)
2. **`cardplay/docs/canon/**`** — Truth for *what things mean* (normative invariants)
3. **`to_fix.md`** (repo root) — Bootstrap canon for terms/boundaries/extension rules
4. **`cardplay/cardplay2.md` + `cardplay/cardplayui.md`** — Large narrative specs; allowed to be aspirational
5. **All other docs (`cardplay/docs/**`)** — Helpful, but must declare status and not contradict canon

---

## Canon Documents (Normative)

> These are the authoritative definitions. All other docs must link here instead of redefining terms.

- [**Canonical Nouns**](./canon/nouns.md) — SSOT for Card, Deck, Stack, Track, Clip, Port, Constraint, HostAction, OntologyPack, LyricToken
- [**Canonical IDs**](./canon/ids.md) — ControlLevel, DeckType, PPQ, MusicSpec enums, port vocabulary, namespaced ID pattern
- [**Module Map**](./canon/module-map.md) — Maps legacy doc paths to real `cardplay/src/*` paths
- [**Board Analogy**](./canon/board-analogy.md) — Game board analogy table (explanatory only; does not rename code)
- [**Card Systems**](./canon/card-systems.md) — CoreCard, AudioModuleCard, UICardComponent, TheoryCard distinctions
- [**Deck Systems**](./canon/deck-systems.md) — BoardDeck vs slot-grid deck vs theory deck template
- [**Stack Systems**](./canon/stack-systems.md) — Composition Stack vs UI StackComponent
- [**SSOT Stores**](./canon/ssot-stores.md) — Canonical stores for events, clips, routing, board state, active context, AI spec
- [**Declarative vs Imperative**](./canon/declarative-vs-imperative.md) — Constraints/spec are declarative; Prolog emits HostActions; decks mutate state
- [**Constraints**](./canon/constraints.md) — MusicSpec + MusicConstraint semantics, hard/soft, weights, conflict detection
- [**HostActions**](./canon/host-actions.md) — Canonical Prolog→TS action wire format and apply loop
- [**Ontologies**](./canon/ontologies.md) — Ontology packs, tradition/theory models, bridge rules
- [**Extensibility**](./canon/extensibility.md) — How to extend boards, decks, cards, ontologies, themes via packs
- [**Naming Rules**](./canon/naming-rules.md) — Core IDs are stable; extension IDs use `<namespace>:<name>`
- [**Port Vocabulary**](./canon/port-vocabulary.md) — Builtin PortTypes and extension mechanism
- [**Terminology Lint**](./canon/terminology-lint.md) — Forbidden ambiguous phrases and their canonical replacements
- [**Legacy Type Aliases**](./canon/legacy-type-aliases.md) — Mapping duplicate type names to canonical names

---

## Canonical ID Tables

### ControlLevel (from `cardplay/src/boards/types.ts`)

```ts
type ControlLevel = 'full-manual' | 'manual-with-hints' | 'assisted' | 'collaborative' | 'directed' | 'generative';
```

### DeckType (from `cardplay/src/boards/types.ts`)

```ts
type DeckType = 'pattern-deck' | 'notation-deck' | 'piano-roll-deck' | 'session-deck' | 
  'arrangement-deck' | 'instruments-deck' | 'dsp-chain' | 'effects-deck' | 'samples-deck' | 
  'phrases-deck' | 'harmony-deck' | 'generators-deck' | 'mixer-deck' | 'routing-deck' | 
  'automation-deck' | 'properties-deck' | 'transport-deck' | 'arranger-deck' | 
  'ai-advisor-deck' | 'sample-manager-deck' | 'modulation-matrix-deck' | 'track-groups-deck' | 
  'mix-bus-deck' | 'reference-track-deck' | 'spectrum-analyzer-deck' | 'waveform-editor-deck';
```

### Tick Resolution (from `cardplay/src/types/primitives.ts`)

```ts
export const PPQ = 960 as const;
```

### MusicSpec Enums (from `cardplay/src/ai/theory/music-spec.ts`)

```ts
type CultureTag = 'western' | 'carnatic' | 'celtic' | 'chinese' | 'hybrid';
type StyleTag = 'galant' | 'baroque' | 'classical' | 'romantic' | 'cinematic' | 
  'trailer' | 'underscore' | 'edm' | 'pop' | 'jazz' | 'lofi' | 'custom';
type TonalityModel = 'ks_profile' | 'dft_phase' | 'spiral_array';
```

### Namespaced ID Pattern (for extensions)

```
<namespace>:<name>
```

- `namespace` matches the pack/author domain or a stable subsystem prefix
- Builtins *may* omit namespace; third-party additions **must not**

---

## Quick Links

### Core Architecture
- [Architecture](./architecture.md)
- [State Model](./state-model.md)
- [Glossary](./glossary.md)
- [Master Plan](./plan.md)

### Board System
- [Board API Reference](./boards/board-api.md)
- [Board State Persistence](./boards/board-state.md)
- [Control Spectrum](./boards/control-spectrum.md)
- [Decks Reference](./boards/decks.md)
- [Layout Runtime](./boards/layout-runtime.md)
- [Gating](./boards/gating.md)
- [Theming](./boards/theming.md)

### AI / Prolog / Music Theory
- [AI Index](./ai/index.md)
- [MusicSpec (canonical musical intent)](./ai/music-spec.md)
- [Prolog Engine Choice](./ai/prolog-engine-choice.md)
- [Prolog Deck/Card/Board Reasoning](./ai/prolog-deck-reasoning.md)
- [Cadence Types](./ai/cadence-types.md)
- [Tonal Centroid vs Spiral Array](./ai/tonal-centroid-vs-spiral-array.md)
- [Theory Card Authoring](./ai/theory-card-authoring.md)
- [Extending the Music Theory KB](./ai/extending-music-theory-kb.md)
- [Predicate Signatures](./ai/predicate-signatures.md)

### Theory / Ontology
- [Galant Schemata](./theory/galant-schemata.md)
- [Computational Models](./theory/computational-models.md)
- [DFT Phase Tonality](./theory/dft-phase-tonality.md)
- [Spiral Array](./theory/spiral-array.md)
- [KB Layering](./theory/kb-layering.md)
- [Lyrics Integration](./theory/lyrics_integration.md)

### Cards & Stacks
- [CardScript](./cardscript.md)
- [Card Definition Format](./card-definition-format.md)
- [Stack Inference](./stack-inference.md)
- [Port Unification Rules](./port-unification-rules.md)
- [Adapter Cost Model](./adapter-cost-model.md)

### Packs & Extensions
- [Pack Format Reference](./pack-format-reference.md)
- [Pack Installation UX](./pack-installation-ux.md)
- [Pack Provenance](./pack-provenance.md)
- [Pack Signing & Trust Model](./pack-signing-trust-model.md)
- [Registry API](./registry-api.md)

### State & Playback
- [State Schema Versioning](./state-schema-versioning.md)
- [Persistence Format](./persistence-format.md)
- [Autosave UX](./autosave-ux.md)
- [History Semantics](./history-semantics.md)
- [Transport Semantics](./transport-semantics.md)
- [Recording Semantics](./recording-semantics.md)
- [Mixer Semantics](./mixer-semantics.md)

### UI & Learn
- [UI Integration Scenarios](./ui-integration-scenarios.md)
- [UI Keyboard Shortcuts](./ui-keyboard-shortcuts-reference.md)
- [UI Panels Reference](./ui-panels-reference.md)
- [Getting Started](./learn-getting-started.md)
- [Debugging](./debugging.md)

### Technical Reference
- [Event Kind Schemas](./event-kind-schemas.md)
- [Graph Invariants](./graph-invariants.md)
- [Protocol Compatibility](./protocol-compatibility.md)
- [Validator Rules](./validator-rules.md)
- [Audio Engine Architecture](./audio-engine-architecture.md)
- [WASM](./wasm.md)
- [Runtime Execution](./runtime-execution.md)
- [Coding Style](./coding-style.md)

---

## Lyrics-First Workflows

Lyrics are a first-class composition domain in CardPlay:

- Lyrics are represented as Events in dedicated streams using a registered `EventKind` (e.g., `lyric`)
- Lyric entities have stable IDs and anchors to musical time and/or notation underlay
- AI integration follows `DECL-IMP-CONTRACT/1`: Prolog suggests HostActions for lyric tagging/alignment
- See [Lyrics Integration](./theory/lyrics_integration.md) for the staged integration plan

---

## Extension Is Default

CardPlay treats user-installed packs as first-class. Every subsystem that is extensible documents:

- **What can extend it:** builtin | user pack | project-local
- **Registration/loader:** registry API + file path
- **ID namespace rule:** `<namespace>:<name>`
- **Versioning:** schema version + migration story
- **Failure mode:** what happens if extension is missing/broken

See [Extensibility](./canon/extensibility.md) for the complete extension surface.

---

## Doc Standards

Every doc in this folder should include:

1. **DOC-HEADER/1** — Status, canonical terms, code references, analogy, SSOT declaration
2. **NOUN-CONTRACT/1** — For any overloaded term (Card/Deck/Stack/etc.)
3. **LEGACY-ALIASES/1** — When mentioning legacy names
4. **DECL-IMP-CONTRACT/1** — When touching Prolog/constraints/AI
5. **ONTOLOGY-DECL/1** — When depending on a specific tradition/theory model
6. **EXTENSIBILITY-CONTRACT/1** — When describing extensible surfaces

See individual canon docs for templates.

