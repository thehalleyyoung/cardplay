# CardPlay Canon (SSOT) + Repo-Grounded Gaps

**Status:** draft SSOT hub + gap catalogue (doc-only)  
**Last updated:** 2026-01-29  
**Scope:** the `cardplay/` subtree (docs + code), plus root docs that steer it (`to_fix.md`, `to_fix_plan_500.md`)  
**Primary goal:** make the documentation set coherent enough that an LLM generating files independently (but conditioned on docs) converges instead of re-inventing types/vocabularies.

This file serves two purposes:
1) **SSOT hub (Part A):** the *canonical* terminology, boundaries, and extension rules the docs must obey.
2) **Repo-grounded gap catalogue (Part B):** where the current repo violates those rules, with concrete file references.

> TL;DR: CardPlay is trying to be a “board game” where boards define workflows and cards define capabilities, but today the repo contains multiple non-isomorphic meanings of **Card**, **Deck**, and **Stack**. This doc locks down a single set of meanings + explicit extension seams, then catalogs where the repo deviates.

---

## A) Single Source of Truth (what to believe)

### A1) Authority order (when docs disagree)

When two docs conflict, resolve in this order:

1) **`cardplay/src/**`** — truth for *what exists today* (types, stores, IDs, file paths).
2) **`cardplay/docs/canon/**`** — truth for *what things mean* (normative invariants).  
   - If a canon doc doesn’t exist yet, treat the relevant section of this file as canon until the canon doc is created.
3) **This file (`to_fix.md`)** — bootstrap canon for terms/boundaries/extension rules until canon docs exist.
4) **`cardplay/cardplay2.md` + `cardplay/cardplayui.md`** — large narrative specs; allowed to be aspirational, but must not silently redefine core nouns.
5) **All other docs (`cardplay/docs/**`)** — helpful, but must declare status + ontology, and must not contradict canon.

### A2) Convergence invariants (non‑negotiable)

These are the rules that prevent doc drift:

1) **One noun, one meaning.** If you need two meanings, rename one or qualify it (`BoardDeck` vs `DeckLayoutAdapter`, `CoreStack` vs `LayoutStack`).
2) **One canonical type name per concept.** If the repo currently has multiple `interface Track`/`CardDefinition`/`PortType`, docs must pick one as canonical and label the rest as legacy aliases until refactored.
3) **One SSOT store per data kind.** If there are multiple stores, their relationship must be explicitly defined (derived cache? view projection? adapter?).
4) **No phantom modules.** Docs must not reference non-existent paths like `src/core/*` or `src/registry/*` unless explicitly labeled as a legacy alias map to real paths.
5) **Stable kernel + infinite extensibility.**
   - Builtins (e.g., `ControlLevel`, builtin `DeckType`, builtin event kinds, builtin port types) are pinned.
   - Extensions are **default** and must use **namespaced IDs**: `<namespace>:<name>`.
6) **Declarative/imperative boundary is explicit.** Prolog and constraints are declarative; mutation happens imperatively via host-applied actions.
7) **Every doc declares its status** (`implemented` / `partial` / `aspirational` / `obsolete`) and its assumed ontology/tradition.

### A3) The “Game Board” analogy (overlay, not renaming)

This analogy is explanatory only; do not rename code identifiers.

| Canonical term | Analogy | Notes |
|---|---|---|
| `Board` | Game board variant | A workflow environment + policy, not a document |
| `BoardDeck` | Zone / area of play | A UI surface (editor/browser/tool) living in a panel |
| `Card` (core) | Rule card / spell | A typed transform (`cardplay/src/cards/card.ts`) |
| Card instance (UI) | Piece on the board | A UI wrapper around some capability |
| `Stack` (composition) | Combo chain | Serial/parallel composition of core cards |
| `MusicSpec` | Scenario sheet | Declarative intent that *guides* tools; not the event store |
| Prolog KB | Referee | Reads facts, emits suggested moves (`HostAction`s) |
| `HostAction` | Proposed move | Only sanctioned bridge into imperative changes |
| `CardPack` | Expansion pack | Ships new cards/boards/themes/KB rules via registries |

### A4) Canonical noun contracts (bootstrap glossary)

This glossary is intentionally “boring”: it defines exactly what each noun means in this repo.

| Term | Canonical meaning | Canonical code anchor | SSOT store / runtime anchor | Not‑this |
|---|---|---|---|---|
| **Event** | A typed occurrence in tick-time: `{ kind, start, duration, payload }` | `cardplay/src/types/event.ts` | `SharedEventStore` | Not a UI element |
| **EventKind** | Open-world kind string with registry metadata | `cardplay/src/types/event-kind.ts` | Event kind registry | Not a sealed enum |
| **EventStream** | Named ordered list of Events + metadata | `cardplay/src/state/types.ts` (`EventStreamRecord`) | `cardplay/src/state/event-store.ts` | Not “a Track” |
| **ClipRecord** | A reference to a stream + a placement window | `cardplay/src/state/types.ts` (`ClipRecord`) | `cardplay/src/state/clip-registry.ts` | Not “the events” |
| **RoutingGraph** | Nodes + edges describing signal flow | `cardplay/src/state/routing-graph.ts` | `RoutingGraphStore` | Not the visual deck layout |
| **Board** | A workflow environment: layout + decks + policy | `cardplay/src/boards/types.ts` | `BoardStateStore` persists preferences | Not a “mode toggle” |
| **BoardDeck** | A typed zone surface in a board | `cardplay/src/boards/types.ts` | Rendered via deck factories | Not the `DeckLayoutAdapter` |
| **ActiveContext** | Cross-board “current selection/cursor” | `cardplay/src/boards/context/types.ts` | `BoardContextStore` | Not project state |
| **CoreCard** | A typed transform with ports + metadata | `cardplay/src/cards/card.ts` (`Card<A,B>`) | `cardplay/src/cards/registry.ts` | Not a UI widget |
| **UICardComponent** | A UI lifecycle + drag/resize shell | `cardplay/src/ui/components/card-component.ts` | DOM component | Not a typed transform |
| **AudioModuleCard** | Runtime audio/MIDI processing module | `cardplay/src/audio/instrument-cards.ts` | Audio engine graph | Not the same as `CoreCard` |
| **TheoryCardDef** | UI “constraint contributor” shaping `MusicSpec` | `cardplay/src/ai/theory/theory-cards.ts` | Spec state (currently not a single global store) | Not an audio card |
| **MusicSpec** | Declarative musical intent (culture/style + constraints) | `cardplay/src/ai/theory/music-spec.ts` | Serialized into Prolog facts per query | Not the event store |
| **MusicConstraint** | A declarative rule in a spec (`hard|soft`, `weight`) | `cardplay/src/ai/theory/music-spec.ts` | `MusicSpec.constraints` | Not a UI-only toggle |
| **OntologyPack** | A coherent set of entities/assumptions/rules | `cardplay/src/ai/knowledge/*` | Prolog loader + docs | Not “just style” |
| **HostAction** | A structured imperative edit proposal from AI | `cardplay/src/ai/theory/host-actions.ts` | Applied by host; must be undoable | Not truth by itself |

### A5) SSOT stores & boundaries (what owns what)

This is the architecture boundary map that enables independent development:

| Data kind | Canonical store | Canonical types | Must be treated as SSOT by |
|---|---|---|---|
| Event streams + events | `cardplay/src/state/event-store.ts` (`SharedEventStore`) | `EventStreamRecord`, `Event<P>` | tracker/notation/session editors, AI fact extraction |
| Clip definitions / placement windows | `cardplay/src/state/clip-registry.ts` (`ClipRegistry`) | `ClipRecord` | session/arranger UIs, renderers |
| Routing graph | `cardplay/src/state/routing-graph.ts` (`RoutingGraphStore`) | `RoutingNodeInfo`, `RoutingEdgeInfo` | routing deck + audio engine |
| Board preferences/layout state | `cardplay/src/boards/store/store.ts` (`BoardStateStore`) | `BoardState`, `LayoutState` | board UI shell + persistence |
| Active selection/context | `cardplay/src/boards/context/store.ts` (`BoardContextStore`) | `ActiveContext` | all boards/decks |
| Declarative spec | `cardplay/src/ai/theory/music-spec.ts` (`MusicSpec`) | `MusicSpec`, `MusicConstraint` | theory cards + Prolog bridge (note: no single global spec store yet) |

### A6) Declarative vs imperative + AI autonomy (normative)

This is the only allowed mental model for “Prolog vs decks”.

#### `DECL-IMP-CONTRACT/1` (normative)

- **Declarative layer (facts/intent):**
  - `MusicSpec` + `MusicConstraint` are declarative and side-effect free.
  - Prolog KBs are pure reasoning over facts; they do not “apply changes”.
- **Imperative layer (edits/state):**
  - Mutations happen via the host updating SSOT stores (event store, clip registry, routing graph, board state).
- **Bridge (the only sanctioned crossing):**
  - Prolog emits **`HostAction`s** (proposed moves).
  - The host (TypeScript) validates, applies (or rejects), logs, and makes the result undoable.
- **“Suggestion” vs “auto-apply”:**
  - Default: HostActions are suggestions that require explicit user confirmation.
  - Auto-apply is permitted only when a board/tool mode explicitly enables it (see `ControlLevel` + `ToolMode` in `cardplay/src/boards/types.ts`), and it must still be undoable and surfaced in history.
- **Unknown/extension actions:**
  - Unknown HostActions must be ignored safely with a diagnostic, never crash the host.
  - Extensions must namespace their action terms (`<namespace>:<action>`).

### A7) Music “type theory” across traditions (ontology discipline)

CardPlay supports multiple music-theory traditions, which implies multiple ontologies. The SSOT rule is:

- **An ontology is a coherent world-model** (entities + assumptions + allowed inferences).  
  Example: Western functional harmony, Carnatic raga/tala, Celtic tune forms, etc.
- **Docs must not silently mix ontologies.** If a feature spans multiple traditions, it must include an explicit “Bridge” section and name the conversion assumptions.
- **In code, `MusicSpec.culture`/`style` are selectors, not ontologies.**  
  Treat them as *inputs* that choose which ontology packs and constraint sets are active.

### A8) Lyrics-first workflows (first-class, not a bolt-on)

Lyrics are a first-class *composition domain* that must obey the same SSOT rules:

- Lyrics should be represented as Events in a dedicated stream (initially), using a custom `EventKind` (e.g. `lyric`) registered via `cardplay/src/types/event-kind.ts`.
- Lyric entities must have stable IDs and **anchors** to musical time and/or notation underlay.
- AI integration must follow `DECL-IMP-CONTRACT/1`: Prolog suggests HostActions that tag/align lyrics and/or apply musical edits to lyric-anchored spans.
- See `cardplay/docs/theory/lyrics_integration.md` for the staged integration plan (this doc may be revised to match the canon rules above).

### A9) Execution checklist (the doc-only fix plan)

The detailed 500-item doc fix checklist is in `to_fix_plan_500.md`. Treat it as the mechanical “how we make the docs converge”. This file is the semantic “what the docs must mean”.

---

## B) Repo-grounded gap catalogue (where incoherence manifests today)

Everything below is tied to concrete paths in the repo. Use it as a map of “where the canon rules are currently violated”, not as a second competing theory.

## 1) Overloaded / conflicting core nouns (biggest theoretical shakiness)

### 1.1 `Card` is not one thing (it’s at least 5)

**What’s unclear:** “Card” sometimes means a *typed data transform*, sometimes a *UI widget*, sometimes an *audio processor*, sometimes a *user-authored definition schema*, and sometimes an *AI theory constraint UI*. This causes mismatched expectations around ports, state, instantiation, routing, and persistence.

**Where it manifests:**

- **Core typed transform card** (`Card<A,B>` morphism)
  - `cardplay/src/cards/card.ts` (defines `export interface Card<A, B>`)
  - `cardplay/src/cards/registry.ts` (registry of `Card<A,B>`)
  - `cardplay/src/cards/stack.ts` (composition of `Card<A,B>` into `Stack`)
- **Audio/MIDI processing “card” (runtime DSP module)**
  - `cardplay/src/audio/instrument-cards.ts` (`export interface Card` with `processAudio`, `processMIDI`, bypass/mute/solo, etc.)
- **UI card framework(s)**
  - `cardplay/src/ui/components/card-component.ts` (`CardComponent` with `PortType = 'audio_in' | ...`)
  - `cardplay/src/ui/cards.ts` (another “Card UI Components” system with its own `PortType`)
- **Runtime-visible “CardDefinition” schema(s)**
  - `cardplay/src/cards/card-visuals.ts` (`export interface CardDefinition` with `ports`, `parameters`, `presets`, etc.)
  - `cardplay/src/user-cards/card-editor-panel.ts` (`export interface CardDefinition` again, but a different shape)
  - `cardplay/docs/card-definition-format.md` (documents a `CardDefinition` + registry paths that don’t match repo structure)
- **AI theory “cards” (constraint/KB parameter widgets)**
  - `cardplay/src/ai/theory/deck-templates.ts` (`cardIds` like `theory:tonality_model`)
  - `cardplay/src/ai/theory/spec-event-bus.ts` (`cardId` used as identity for spec-change events)
  - `cardplay/docs/theory/authoring-theory-cards.md` (describes a “theory card” architecture; mentions UI tech and paths that don’t match current code)

**Why this is theoretically shaky:** the core system claims “one consistent card model” (`cardplay/cardplay2.md`), but the repo implements multiple non-isomorphic “card” models with different port systems, lifecycles, and state semantics.

**Fix/decision to make:**

- Decide whether the canonical “Card” is:
  - (A) a typed transform (`Card<A,B>`) that *also* has UI and audio implementations, or
  - (B) a UI-first “module card” that *also* has typed transforms behind it.
- Then **rename the others**:
  - e.g. `Card<A,B>` stays “Card”, but UI becomes `CardWidget` / `CardSurface`, audio becomes `AudioModule`, AI theory becomes `SpecCard` / `ConstraintCard`, etc.
- Consolidate `CardDefinition` into one canonical schema and derive UI/editor schemas from it (or vice versa), instead of defining multiple unrelated interfaces.

---

### 1.2 `Deck` is also not one thing (board deck vs workspace deck vs audio deck vs theory deck)

**What’s unclear:** “Deck” appears as (1) a board panel container, (2) the main workspace surface, (3) a grid-of-slots audio/modular deck, (4) an audio instrument/effect rack, (5) the composer “deck bar” strip, and (6) an AI theory “deck template”. These are different abstractions but share the same word.

**Where it manifests:**

- **Board decks (board-centric UI container within panels)**
  - `cardplay/src/boards/types.ts` (`export interface BoardDeck`, `DeckType`, `DeckCardLayout`)
  - `cardplay/docs/boards/decks.md` (board deck types & backing components)
  - `cardplay/src/boards/decks/factory-types.ts` (`DeckFactory`, `DeckInstance`)
- **Deck as the main workspace surface**
  - `cardplay/cardplay2.md` Part XIII “Deck and workspace” (deck = main workspace; cards live in a grid)
- **Deck as a grid-of-slots runtime adapter**
  - `cardplay/src/ui/deck-layout.ts` (`DeckLayoutAdapter`, `DeckState`, `CardSlot`, `DeckId`)
  - `cardplay/src/boards/decks/audio-deck-adapter.ts` (wraps `DeckLayoutAdapter` “for use within the board system”)
- **Audio instrument/effect “deck”**
  - `cardplay/src/audio/instrument-cards.ts` (`DeckSlot` and “deck synchronization and routing”)
- **Composer “deck bar” (generator strip)**
  - `cardplay/src/ui/composer-deck-bar.ts` (`DeckSlot` but unrelated to audio `DeckSlot`)
- **AI theory “deck templates”**
  - `cardplay/src/ai/theory/deck-templates.ts` (`DeckTemplate` = recommended combination of theory cards)

**Why this is theoretically shaky:** “Deck” is used at multiple architectural levels without a defined containment relationship. The board system says a deck is a UI container inside a panel, while the deck-layout system says a deck contains a slot grid and routing endpoints, and cardplay2 says the deck *is the workspace*.

**Fix/decision to make:**

- Choose canonical hierarchy and naming, e.g.:
  - `Board` → `Panel` → `Deck` (board-centric)
  - Inside some `Deck` types, you may embed a `PatchGrid` (currently `DeckLayoutAdapter`)
- Rename `DeckLayoutAdapter`’s “Deck” concept to avoid collision: `PatchGrid`, `Rack`, `SlotGrid`, etc.
- Rename AI `DeckTemplate` to `SpecPanelTemplate` / `TheoryPaletteTemplate` to avoid collision with board decks.

---

### 1.3 `Stack` is simultaneously: (a) card composition, and (b) UI layout container

**What’s unclear:** “Stack” is used for a *composition semantics* in core cards, but also for a *visual layout mode* (“stack layout”) and a *UI component* (“StackComponent”). These are not the same thing, and “tabs” exists as a mode in *both* meanings.

**Where it manifests:**

- **Core typed composition**
  - `cardplay/src/cards/stack.ts` (`StackMode = 'serial' | 'parallel' | 'layer' | 'tabs'`)
  - `cardplay/cardplay2.md` (Stack = composition of cards; includes “tabs/switch” behaviors)
  - `cardplay/docs/stack-inference.md` (describes stack inference that does not match current `cards/stack.ts` semantics)
- **UI layout / container**
  - `cardplay/src/ui/components/stack-component.ts` (`StackComponent` = UI vertical list)
  - `cardplay/src/boards/types.ts` (`DeckCardLayout = 'stack' | 'tabs' | ...`)
  - `cardplay/docs/boards/deck-stack-system.md` (“Stack: a vertical list of cards within a deck”)
  - `cardplay/cardplayui.md` Part VII “Deck and Stack System” (uses “stack” language for tab switching)

**Why this is theoretically shaky:** A user (or developer) cannot reason about “stacking” without guessing which meaning is intended. Worse: both meanings reuse the same sub-terms (`tabs`, `stack`), so even the mode names collide.

**Fix/decision to make:**

- Rename one of the meanings:
  - Keep `Stack` for core composition, rename UI “stack layout” to `ListLayout`/`ColumnLayout` and `StackComponent` to `CardList`.
  - Or rename composition stack to `Pipeline`/`Chain`/`Composite` and keep UI “stack”.
- Ensure **mode names** don’t collide (`tabs` in composition vs `tabs` in UI container).
- Update `cardplay/docs/boards/deck-stack-system.md` to explicitly say “UI stack layout” and avoid implying it is the same as `cards/stack.ts`.

---

### 1.4 `Track` has at least 3 meanings, but only 1 is documented as canonical

**What’s unclear:** The spec/glossary claims Track is a **bidirectional lens** into a container (not a store). In code, Track is used as an arrangement/mixer/channel concept and also as “thing a clip belongs to”. No canonical Track type exists in `cardplay/src/types/*`.

**Where it manifests:**

- Spec-defined “Track as lens”
  - `cardplay/docs/glossary.md` (“Track<K,A,B> is a bidirectional lens…”)
  - `cardplay/cardplay2.md` (Track lens idea is referenced)
- Implementation-defined tracks
  - `cardplay/src/ui/components/arrangement-panel.ts` (`export interface Track` for arrangement UI)
  - `cardplay/src/tracks/clip-operations.ts` (`export interface Track` for freeze/bounce/consolidate simulation; uses samples/beats time units)
  - `cardplay/src/boards/context/types.ts` (`activeTrackId: string | null` without defining what a track is)

**Why this is theoretically shaky:** “Track” is a central DAW concept. If the system doesn’t define whether a track is a data container, a view, a routing channel, or a lens, then clip placement, mixer strips, and editors cannot be coherently related.

**Fix/decision to make:**

- Define canonical track model:
  - If Track = lens into an event stream/container: add a real type and adapters.
  - If Track = “mixer channel / lane”: define it in state and map it to streams/clips.
- Stop exporting multiple unrelated `interface Track` types; move to namespaced types (e.g. `ArrangementTrack`, `FreezeTrackModel`) until canonical Track exists.

---

### 1.5 `Clip` and `Stream` and `Container` are not coherently related

**What’s unclear:** There is a Container system (`Container<'clip'>`) and also a ClipRegistry (`ClipRecord`) that references an event stream. The relationship between “container clip”, “clip record”, and “clip shown in arrangement UI” isn’t specified.

**Where it manifests:**

- Container model exists but is not clearly integrated with state
  - `cardplay/src/containers/container.ts` (`Container<K,E>`, `Clip`, `Pattern`, `Scene`, etc.)
- Event streams are the actual editor source of truth
  - `cardplay/src/state/event-store.ts` (`SharedEventStore` of `EventStreamRecord`)
  - `cardplay/src/state/types.ts` (`EventStreamRecord` has optional `containerId?: ContainerId`)
- Clip registry exists as a cross-view store
  - `cardplay/src/state/clip-registry.ts` (clip CRUD)
  - `cardplay/src/state/types.ts` (`ClipRecord` = `{ streamId, startTick, duration, loop, ... }`)
- UI defines its own clip types
  - `cardplay/src/ui/components/arrangement-panel.ts` (`export interface Clip` with `start: Tick`, `duration: TickDuration`)
  - `cardplay/src/tracks/clip-operations.ts` (`export interface Clip` with `start/end` in `samples` or `beats`)

**Why this is theoretically shaky:** “Clip” sits at the boundary between event data, arrangement UI, session UI, and audio rendering. Multiple clip models imply multiple un-specified conversion rules and duplication bugs.

**Fix/decision to make:**

- Define: “A clip is a reference to an event stream/container + a placement window.”
- Choose the canonical representation:
  - Either `ClipRecord` becomes canonical and containers are derived, or
  - `Container<'clip'>` becomes canonical and ClipRegistry holds references to containers.
- Unify time fields (ticks vs samples) and ensure all clip types share one schema.

---

### 1.6 `PortType` / ports / routing: 4+ incompatible type systems exist

**What’s unclear:** Port typing is central to card composition and routing, but the repo currently uses multiple mutually-incompatible port type systems (string unions with different vocabularies). Docs describe a registry-based unification system that doesn’t match code.

**Where it manifests:**

- Core port types for `Card<A,B>`
  - `cardplay/src/cards/card.ts` (`PortType` branded string, `PortTypes` constants: `'audio' | 'midi' | 'notes' | ...`)
  - `cardplay/src/boards/gating/validate-connection.ts` (compatibility matrix based on `PortTypes`)
- UI-specific port types
  - `cardplay/src/ui/components/card-component.ts` (`PortType = 'audio_in' | 'audio_out' | 'mod_in' | ...`)
  - `cardplay/src/ui/cards.ts` (`PortType = 'audio' | 'midi' | 'control' | 'trigger' | 'data'`)
- CardDefinition-level port types
  - `cardplay/src/cards/card-visuals.ts` (`PortType` union including `'Event<Note>'`, `'Event<any>'`, plus `'midi'`)
- Routing graph port types
  - `cardplay/src/state/routing-graph.ts` (`PortInfo.type = 'audio' | 'midi' | 'cv'`)
  - `cardplay/src/state/types.ts` (`RoutingConnection.type = 'audio' | 'midi' | 'modulation' | 'sidechain'`)
- Docs describing a different system entirely
  - `cardplay/docs/port-unification-rules.md` (references `src/registry/port-types.ts`, `src/core/port-conversion.ts` – not present)
  - `cardplay/docs/adapter-cost-model.md` (same)

**Why this is theoretically shaky:** Without one canonical port type vocabulary + compatibility/adaptation story, stacks/graphs/routing cannot be made type-safe or auto-fixable. This directly blocks “cards compose cleanly” as a core claim.

**Fix/decision to make:**

- Pick one canonical port vocabulary (likely `cards/card.ts`’s `PortType`), then:
  - Represent direction separately (`in|out`) rather than encoding `_in/_out` in the type name.
  - Map UI-only affordances to the canonical types.
- Make `CardDefinition` ports reference canonical `PortType` (not bespoke string unions).
- Replace ad-hoc compatibility matrices with the adapter/registry system *or* delete the docs for that system and explicitly adopt the simpler matrix.

---

## 2) Interaction semantics that are described but not implemented (or implemented differently)

### 2.1 Board deck “card layout” exists, but deck doesn’t actually manage multiple cards

**What’s unclear:** Board deck definitions include `cardLayout` and (in `BoardDeck`) `initialCardIds`, but the deck runtime container currently renders a single `DeckInstance` and does not use `initialCardIds` at all.

**Where it manifests:**

- `cardplay/src/boards/types.ts` (`BoardDeck.initialCardIds?`)
- `cardplay/src/boards/decks/deck-container.ts` (renders `DeckInstance.render()` regardless of layout; no multi-card management)
- `cardplay/docs/boards/deck-stack-system.md` and `cardplay/cardplayui.md` Part VII (describe decks containing multiple cards with tabs/stack/split)

**Fix/decision to make:**

- Either:
  - Make board decks truly contain multiple “cards” (as a first-class list with persistence, add/remove, tab switch), or
  - Remove `initialCardIds`/multi-card promises and redefine “deck” as “a surface” (pattern editor, mixer, etc.) that may internally manage sub-cards.

---

### 2.2 Drag-and-drop “card template” payload is not a single defined contract

**What’s unclear:** Multiple producers emit `application/x-card-template` payloads with different JSON shapes, while the canonical types in `drag-drop-payloads.ts` expect `{ type:'card-template', cardType, cardCategory, ... }`.

**Where it manifests:**

- Payload definition:
  - `cardplay/src/ui/drag-drop-payloads.ts` (`CardTemplatePayload`)
- Producers emitting inconsistent payload shapes:
  - `cardplay/src/boards/decks/factories/instrument-browser-factory.ts` (emits `{ type, defaultParams }` – not `CardTemplatePayload`)
  - `cardplay/src/ui/components/gated-card-browser.ts` (emits `{ id, type, name }` – not `CardTemplatePayload`)
- Drop handler expects `CardTemplatePayload`:
  - `cardplay/src/ui/drop-handlers.ts` (`handleCardTemplateToDeck`)

**Fix/decision to make:**

- Define the *wire format* once:
  - One MIME type, one JSON schema, one helper to encode/decode.
- Make all producers use `createCardTemplatePayload(...)` and make handlers decode/validate centrally.
- Define what “instantiate a card” means (which registry? which runtime object? where is it stored?).

---

### 2.3 Stack inference semantics differ between docs and code

**What’s unclear:** Docs describe a richer stack inference/type-check/adapter suggestion system, but code’s `inferStackPorts` and `validateStack` are much simpler and (for parallel mode) behave differently than described.

**Where it manifests:**

- Docs:
  - `cardplay/docs/stack-inference.md`
- Code:
  - `cardplay/src/cards/stack.ts` (`inferStackPorts`, `validateStack`)

**Fix/decision to make:**

- Decide the intended semantics for parallel/tabs stacks:
  - Union inputs vs “first card inputs”, union outputs vs something else.
- Either implement the richer inference system, or update docs to match current implementation.

---

## 3) “Single source of truth” claims that are contradicted by the code

### 3.1 Routing graph vs deck layout connections vs board connections (multiple graphs)

**What’s unclear:** There’s a stated goal of a unified routing graph “single source of truth”, but parts of the system keep their own connection state.

**Where it manifests:**

- “Single source of truth” routing graph store:
  - `cardplay/src/state/routing-graph.ts` (top comment)
- Deck layout keeps local connections:
  - `cardplay/src/ui/deck-layout.ts` (“maintains connections locally via inputConnections/outputConnections”)
- Board connections exist as part of board definitions:
  - `cardplay/src/boards/types.ts` (`BoardConnection`)
  - `cardplay/cardplayui.md` Part VIII (board connections)

**Fix/decision to make:**

- Choose the canonical routing graph representation and enforce it:
  - Either the routing graph store is canonical and deck layout derives from it, or vice versa.
- Define which graph is for:
  - Audio routing vs MIDI routing vs “card composition graph” vs UI “visual wiring”.
  - If there are multiple graphs, define how they interrelate (projection? compilation?).

---

### 3.2 State model and persistence docs describe an `AppState` that doesn’t exist in code

**What’s unclear:** Docs describe a monolithic `AppState` with persistence envelope keys, schema versioning, etc., but code uses separate singleton stores (`SharedEventStore`, `ClipRegistry`, `BoardStateStore`, etc.) and does not implement the documented persistence format.

**Where it manifests:**

- Docs that assume `AppState` exists:
  - `cardplay/docs/state-model.md`
  - `cardplay/docs/persistence-format.md`
  - `cardplay/docs/state-schema-versioning.md`
  - `cardplay/docs/learn-persistence.md`
- Code state stores (actual):
  - `cardplay/src/state/event-store.ts`
  - `cardplay/src/state/clip-registry.ts`
  - `cardplay/src/state/selection-state.ts`
  - `cardplay/src/state/routing-graph.ts`
  - `cardplay/src/state/undo-stack.ts`
  - `cardplay/src/boards/store/store.ts` (board UI persistence)
  - `cardplay/src/boards/context/store.ts` (active context persistence)

**Fix/decision to make:**

- Either:
  - Reintroduce a real `AppState` layer and make stores derive from it, or
  - Rewrite persistence docs to describe the actual multi-store architecture and define a snapshot format for it.

---

## 4) Timebase and unit coherence (ticks vs beats vs samples)

**What’s unclear:** The system wants “ticks as canonical time”, but several parts use beats or samples and don’t define conversion boundaries.

**Where it manifests:**

- Canonical ticks:
  - `cardplay/cardplay2.md` (ticks as default)
  - `cardplay/src/types/primitives.ts` (`Tick`, `TickDuration`, `PPQ = 960`, beat/tick conversions)
  - `cardplay/src/types/event.ts` (`Event.start/duration` in ticks)
- Beats in active context:
  - `cardplay/src/boards/context/types.ts` (`transportPosition` “in beats”)
  - `cardplay/src/boards/context/store.ts` (persists `transportPosition` as number)
- Samples/beats in clip operations simulation:
  - `cardplay/src/tracks/clip-operations.ts` (`TimeRange.unit = 'samples' | 'beats'`)

**Fix/decision to make:**

- Define the canonical internal unit (ticks) and forbid others in core state.
- If beats are used at UI boundaries, store them alongside `ppq`/tempo context or store ticks only.
- Ensure all “clip” and “transport” APIs agree on unit semantics.

---

## 5) Event kinds: open-world claim vs missing schema/validation

**What’s unclear:** Docs talk about “event kind schemas” that define payload shape and merge policies, but code’s event-kind registry only stores display metadata (no payload schema validation).

**Where it manifests:**

- Docs:
  - `cardplay/docs/event-kind-schemas.md` (schema fields, mergePolicy; points to non-existent `src/registry/event-kinds.ts`)
- Code:
  - `cardplay/src/types/event-kind.ts` (kind registry exists but no payload schema/validation)
  - `cardplay/src/types/event.ts` (events allow any payload; includes many deprecated aliases because callsites vary)

**Fix/decision to make:**

- Decide whether “event kind schema” is a real enforced concept:
  - If yes: implement schema registration/validation and update adapters to filter unknown kinds.
  - If no: update docs to match “event kind metadata only” and move validation elsewhere.

---

## 6) AI/Theory integration: “theory cards” don’t clearly map to board decks or core cards

**What’s unclear:** The AI/theory subsystem introduces “cards”, “decks”, and an event bus, but there’s no explicit bridge to the board-centric UI deck system or to the core `Card<A,B>` registry.

**Where it manifests:**

- Theory “deck templates”:
  - `cardplay/src/ai/theory/deck-templates.ts`
- Spec event bus keyed by `cardId`:
  - `cardplay/src/ai/theory/spec-event-bus.ts`
- Docs describing theory card authoring:
  - `cardplay/docs/theory/authoring-theory-cards.md`
  - `cardplay/docs/theory/card-to-prolog-sync.md`
  - `cardplay/docs/theory/prolog-to-host-actions.md`

**Fix/decision to make:**

- Rename theory concepts to avoid collision (`SpecCard`, `ConstraintWidget`, `SpecTemplate`).
- Define integration points:
  - Which board deck(s) render theory widgets?
  - Where is the “current MusicSpec” stored (state store)? How does it relate to ActiveContext?
  - How do HostActions become undoable edits (events? clip/stream mutations? parameter changes?)?

---

## 7) Docs/implementation drift (high volume; obscures what’s real)

Many docs reference a repo layout (`src/core/*`, `src/registry/*`, `AppState` persistence keys) that does not exist. This is not just cosmetic: it makes it unclear which parts are design intent vs implemented behavior.

**Where it manifests (examples):**

- `src/core/*` references in docs:
  - `cardplay/docs/architecture.md`
  - `cardplay/docs/plan.md`
  - `cardplay/docs/graph-invariants.md`
  - `cardplay/docs/stack-inference.md`
  - `cardplay/docs/validator-rules.md`
  - `cardplay/docs/card-definition-format.md`
  - `cardplay/docs/port-unification-rules.md`
  - `cardplay/docs/adapter-cost-model.md`
- `src/registry/*` references in docs (registry v2, validators, etc.):
  - `cardplay/docs/registry-api.md`
  - `cardplay/docs/protocol-compatibility.md`
  - `cardplay/docs/event-kind-schemas.md`
  - `cardplay/docs/registry-diff-format.md`
  - `cardplay/docs/registry-migration-format.md`
- Persistence/keys drift:
  - `cardplay/docs/ui-storage-keys.md` vs actual keys in `cardplay/src/boards/store/storage.ts` and `cardplay/src/boards/context/store.ts`
- Deck types drift:
  - `cardplay/cardplayui.md` uses `DeckType` names like `'pattern-editor'` vs actual `DeckType` union in `cardplay/src/boards/types.ts` and docs in `cardplay/docs/boards/board-api.md`
  - `cardplay/docs/boards/authoring-decks.md` shows an outdated `DeckFactory`/`DeckInstance` interface shape

**Fix/decision to make:**

- Make one doc the “what exists” truth (e.g., `cardplay/docs/index.md`), and mark others as:
  - implemented, aspirational, or obsolete.
- Run a docs audit pass to update paths/types and remove references to non-existent modules.

---

## 8) Suggested resolution order (pragmatic, high leverage)

If you want the most coherence with the least churn:

1) **Rename collisions** first (`DeckLayoutAdapter` deck, AI deck templates, UI StackComponent, etc.).
2) **Unify port type vocabulary** and routing graph semantics (define one canonical compatibility/adaptation story).
3) **Unify clip/stream/container model** with one canonical clip schema and time unit.
4) **Decide the canonical “Card”** (transform vs UI-first) and refactor other “card” systems around it.
5) **Doc audit**: update or tag obsolete docs so future design work doesn’t fork again.

---

## 9) Quick checklist of “terms that must be defined once” (and then enforced)

These are the concepts that currently cause repeated drift; treat them as required glossary entries with a single canonical definition:

- Card
- CardDefinition
- Card instance (runtime)
- Deck (board deck)
- Deck (workspace/patch grid) **(rename or define containment)**
- Stack (composition) vs stack (UI list layout)
- Stream vs Container
- Clip (definition, placement, loop semantics)
- Track (data vs mixer vs UI lane)
- PortType (canonical vocabulary)
- Protocol (what it means, how checked/enforced)
- Adapter (how inserted; cost model + search correctness)
- Routing graph (audio vs midi vs modulation; source of truth)
- Timebase (ticks/PPQ; beat conversions; sample conversions)
