# First 500 Documentation Fixes (LLM-Convergent)

Targets: `cardplay/cardplay2.md`, `cardplay/cardplayui.md`, and everything under `cardplay/docs/`.

This is a **doc-only** fix plan. The point is to make the documentation set internally consistent enough that an LLM (generating files independently, but conditioned on docs) will converge to a coherent implementation instead of re-inventing contradictory types and vocabularies.

Secondary goal: push a strong **game-board analogy** *without* polluting code identifiers (analogy is explanatory only).

**SSOT target:** `to_fix.md` (bootstrap canon hub) + the updated docs (`cardplay/docs/**`, including `cardplay/docs/canon/**`) + the two narrative specs (`cardplay/cardplay2.md`, `cardplay/cardplayui.md`). After these fixes, every major concept should have exactly one canonical definition and a clearly named extension surface.

---

## A. The “Game Board” Analogy (overlay, not renaming)

Use this mapping consistently in docs to help humans/LLMs keep layers straight.

| Literal (canonical) | Analogy | Use it to explain | Don’t do |
|---|---|---|---|
| **Board** | A *game board variant* / ruleset + layout | Different workflows share same underlying project state | Don't rename the type/identifier; keep `Board` in code |
| **Panel** | Region on the board | Where zones (decks) live | Don't confuse with “window”/“view” |
| **BoardDeck** | A *zone* / “area of play” | A focused surface: editor, browser, tool | Don't call unrelated systems “deck” without a qualifier |
| **Card (core)** | A *rule card* / “spell” transforming tokens | Typed transform `Card<A,B>` | Don't conflate with UI widget |
| **Card instance (UI)** | A *piece* placed on the board | Visual + interaction wrapper around some capability | Don't define a second unrelated `CardDefinition` |
| **Stack (core composition)** | A *combo chain* | Serial/parallel composition semantics | Don't equate with vertical list layout |
| **DeckCardLayout** | How a zone displays pieces | tabs/stack/split/floating | Don't treat layout modes as computation modes |
| **Ports** | Connectors on pieces | Valid wiring rules | Don't invent new port vocabularies in UI docs |
| **RoutingGraph** | Roads/lanes between zones | Audio/MIDI/modulation flow | Don't maintain “secret” parallel graphs |
| **ActiveContext** | The player’s cursor / selected piece | What the user is “currently acting on” | Don't store time in a different unit than the engine |
| **MusicSpec** | The scenario sheet / “win conditions” | The declarative intent knobs that guide tools | Don’t confuse it with the event store |
| **MusicConstraint** | A rule token / “quest requirement” | Hard/soft rules with weights | Don’t encode UI state/layout as constraints |
| **LyricToken (event)** | A text token / “quest text” | Lyrics-first editing via event streams + anchors | Don’t treat as “notes with text” |
| **Prolog KB** | The referee / rules oracle | Derives consequences + suggestions from facts | Don’t describe it as mutating host state directly |
| **HostAction** | A proposed move from the referee | The only sanctioned bridge into imperative changes | Don’t treat it as “truth”; it’s a suggestion |
| **CardPack** | Expansion box / mod bundle | Ships new cards, boards, themes, KB rules | Don’t assume “builtin-only” IDs |
| **Theme** | Skin / board art | Purely visual customization | Don’t encode logic in themes |
| **Registry** | Mod loader | Dynamic registration of extensions | Don’t hardcode extension IDs in prose |

**Rule for docs:** whenever a doc introduces one of these canonical nouns, add a short `Analogy:` line that references the table above.

---

## B. LLM-Convergence Invariants (must be true after the fixes)

1. **One noun, one meaning:** the docs must not use the same word for multiple non-isomorphic concepts without a qualifier (e.g., “Deck (board deck)” vs “DeckLayoutAdapter deck”).
2. **One canonical type name:** if the repo has multiple types with the same name but different shapes (e.g. multiple `CardDefinition`, multiple `PortType`), docs must choose one as canonical and rename the others *in docs* as legacy/secondary until code is refactored.
3. **One source-of-truth per layer:** docs must explicitly state the SSOT for (a) events, (b) clips, (c) routing graph, (d) board layout state, (e) AI spec state.
4. **No phantom modules:** docs must not reference non-existent paths like `src/core/*` or `src/registry/*` unless they are explicitly described as *legacy doc aliases* mapped to real paths.
5. **Every core ID set is canonicalized (and extension mechanism stated):** `ControlLevel` and builtin `DeckType` are pinned; `PortType` built-ins are pinned but the registry-based extension path must be documented; routing edge types, etc. must match code identifiers exactly (or be explicitly labeled legacy).
6. **Examples compile mentally:** snippets in docs should be directly mappable to actual modules/types in the repo.
7. **Declarative/imperative boundary is explicit:** `MusicSpec`/constraints are declarative; decks/boards mutate state imperatively; Prolog must be documented as “read facts → emit HostActions”, not as “directly updates the project”.
8. **HostAction schema is unified:** docs must pick one canonical HostAction wire format and map any other shapes as legacy (don’t silently mix `HostAction` types from different folders).
9. **Ontology assumptions are declared:** every “music theory tradition/model” doc must state its ontology pack(s) and projection assumptions (12‑TET vs microtonal, pitch representation, cadence vocabulary) and link to the canon.
10. **Extension is the default:** docs must treat “user-installed packs” as first-class, not an afterthought; every subsystem that is extensible must state *how* (where to register, what IDs look like, what capabilities are required).
11. **Namespacing prevents collisions:** any ID intended to be defined outside core (cards, boards, presets, ontology packs, constraints, UI themes) must be namespaced (e.g., `vendor:thing`) and must document its registry/loader entrypoint.
12. **Core IDs are stable, extension IDs are open:** core enums (e.g., `ControlLevel`, builtin `DeckType`) are pinned for convergence; extensibility happens via registries + namespaced IDs, not by casually inventing new core enum members in docs.
13. **Compatibility is versioned:** extensible artifacts (packs, schemas, state snapshots, KB packs) must declare versions and migration expectations; docs must specify what happens when an extension is missing/invalid.
14. **Lyrics are first-class:** docs must support lyrics-first workflows by treating lyrics as event streams + anchors + HostActions (not as “notes with text”), and must keep the lyrics domain extensible (namespaced tags/actions/KB rules).

---

## C. Standard Doc Blocks (copy/paste templates)

### C1) Status Header (`DOC-HEADER/1`)
Add to top of every doc in `cardplay/docs/` and to `cardplay2.md` / `cardplayui.md`:

```md
**Status:** implemented | partial | aspirational | obsolete
**Canonical terms used:** Board, BoardDeck, Card<A,B>, Stack (composition), EventStream, ClipRecord, RoutingGraph, ...
**Primary code references:** `cardplay/src/...` (only real paths)
**Analogy:** <1 sentence linking to the Game Board table>
**SSOT:** if this doc conflicts with anything, follow `to_fix.md` + `cardplay/docs/canon/**` + `cardplay/src/**`
```

### C2) Noun Contract Block (`NOUN-CONTRACT/1`)
For any overloaded term (Card/Deck/Stack/Track/Clip/Port), add:

```md
#### Noun Contract: <TERM>
- **Canonical meaning:** ...
- **Not this:** ...
- **Related nouns:** ...
- **Canonical type:** ... (`cardplay/src/...`)
- **SSOT store:** ...
- **Analogy:** ...
```

### C3) Legacy Alias Block (`LEGACY-ALIASES/1`)
When docs must mention legacy names, enforce one-way mapping:

```md
#### Legacy aliases (doc-only)
- Old term: <...> → Canonical term: <...> (do not use the old term elsewhere)
```

### C4) Declarative vs Imperative Contract (`DECL-IMP-CONTRACT/1`)
Use whenever a doc touches Prolog, constraints, or “AI does X” claims:

```md
#### Declarative vs Imperative Contract
- **Declarative layer:** `MusicSpec` + `MusicConstraint` facts (what is desired / permitted).
- **Imperative layer:** boards/decks mutate project state (events, clips, routing, UI).
- **Prolog’s role:** read facts, return *suggestions* as HostActions; it does not mutate host state.
- **Apply loop:** user accepts (or board policy allows auto-apply) → host applies HostActions → state changes → spec re-synced → new inference.
- **Auto-apply gating:** any automatic application must be explicitly enabled by board/tool policy (ControlLevel + tool mode), and must be undoable + visible in history.
- **Unknown actions:** unknown/extension HostActions must be ignored safely with diagnostics; extension action terms must be namespaced.
```

### C5) Ontology Declaration (`ONTOLOGY-DECL/1`)
Use whenever a doc depends on a specific tradition/theory model:

```md
#### Ontology Declaration
- **Ontology pack(s):** <e.g. western-tonal | galant | jazz | carnatic | arabic | spectral | computational>
- **Pitch representation:** <MIDI note | pitch class | swara | cents | other>
- **Time representation:** ticks (PPQ=960) | beats | free
- **Assumptions:** <12‑TET? functional harmony? cadence vocabulary?>
- **KB files:** `cardplay/src/ai/knowledge/<...>.pl`
```

### C6) Extensibility Contract (`EXTENSIBILITY-CONTRACT/1`)
Use whenever a doc describes something that third parties can extend (boards, decks, cards, ontologies, themes, packs):

```md
#### Extensibility Contract
- **What can extend this:** builtin | user pack | project-local
- **Extension surface:** <board | deck | card | ontology pack | constraint | prolog rules | theme>
- **Registration/loader:** <registry API + file path>
- **ID namespace rule:** <e.g., `vendor:thing`>
- **Versioning:** <schema version + migration story>
- **Capabilities/sandbox:** <required capabilities + security notes>
- **Failure mode:** <what happens if the extension is missing/broken?>
```

---

## D. Canonical ID Tables to embed in the docs

These are the IDs the LLM must copy verbatim.

### D1) `ControlLevel` (canonical)
From `cardplay/src/boards/types.ts`:

```ts
type ControlLevel = 'full-manual' | 'manual-with-hints' | 'assisted' | 'collaborative' | 'directed' | 'generative';
```

### D2) `DeckType` (canonical)
From `cardplay/src/boards/types.ts` (use these names in UI docs; treat older `pattern-editor`/`notation-score` as legacy):

```ts
type DeckType = 'pattern-deck' | 'notation-deck' | 'piano-roll-deck' | 'session-deck' | 'arrangement-deck' | 'instruments-deck' | 'dsp-chain' | 'effects-deck' | 'samples-deck' | 'phrases-deck' | 'harmony-deck' | 'generators-deck' | 'mixer-deck' | 'routing-deck' | 'automation-deck' | 'properties-deck' | 'transport-deck' | 'arranger-deck' | 'ai-advisor-deck' | 'sample-manager-deck' | 'modulation-matrix-deck' | 'track-groups-deck' | 'mix-bus-deck' | 'reference-track-deck' | 'spectrum-analyzer-deck' | 'waveform-editor-deck';
```

### D3) Tick resolution
From `cardplay/src/types/primitives.ts`:

```ts
export const PPQ = 960 as const;
```

### D4) `MusicSpec` enums (canonical)
From `cardplay/src/ai/theory/music-spec.ts`:

```ts
type CultureTag = 'western' | 'carnatic' | 'celtic' | 'chinese' | 'hybrid';
type StyleTag = 'galant' | 'baroque' | 'classical' | 'romantic' | 'cinematic' | 'trailer' | 'underscore' | 'edm' | 'pop' | 'jazz' | 'lofi' | 'custom';
type TonalityModel = 'ks_profile' | 'dft_phase' | 'spiral_array';
```

### D5) Namespaced ID pattern (canonical for extensions)
Use this pattern whenever docs introduce IDs that may be defined outside core:

```txt
<namespace>:<name>
```

Rules:
- `namespace` should match the pack/author domain (e.g., manifest `name`) or a stable subsystem prefix.
- Builtins *may* omit the namespace, but third-party additions must not.

---

## E. The First 500 Fixes (docs-only)

### Phase 0 — Canon scaffolding (Fixes 001–060)

- [x] Fix 001 — Create a single “Docs Canon” entrypoint in `cardplay/docs/index.md` that links to canonical tables (ControlLevel/DeckType/PPQ/MusicSpec enums/ontology packs/HostAction schema/namespaced-ID rules/extensibility entrypoints) and explicitly declares the SSOT set (`to_fix.md` + `cardplay/docs/canon/**` + `cardplay/src/**`), including a pointer to lyrics-first docs.
- [x] Fix 002 — Add `DOC-HEADER/1` to `cardplay/cardplay2.md` and declare it “canonical core model, but must match code paths under `cardplay/src/`”.
- [x] Fix 003 — Add `DOC-HEADER/1` to `cardplay/cardplayui.md` and declare it “canonical UI/board model, but must match `cardplay/src/boards/*`”.
- [x] Fix 004 — In `cardplay/docs/glossary.md`, add `NOUN-CONTRACT/1` blocks for Card, Deck, Stack, Track, Clip, PortType, Constraint, HostAction, OntologyPack, LyricToken, and LyricAnchor (lyrics-first must be first-class in the glossary).
- [x] Fix 005 — Create a new doc `cardplay/docs/canon/nouns.md` that is the SSOT for the noun contracts; all other docs must link to it instead of redefining nouns.
- [x] Fix 006 — Create a new doc `cardplay/docs/canon/module-map.md` mapping any legacy doc paths (`src/core/*`, `src/registry/*`) to real current paths (or mark as removed).
- [x] Fix 007 — Create a new doc `cardplay/docs/canon/ids.md` that contains canonical ID tables (ControlLevel, DeckType, PPQ, routing edge types, port vocab, MusicSpec enums, MusicConstraint type strings, and the namespaced-ID pattern for extensions).
- [x] Fix 008 — Create a new doc `cardplay/docs/canon/board-analogy.md` with the analogy table and rules (“analogy must not rename identifiers”).
- [x] Fix 009 — Add a repo-wide doc rule: “No doc may define a new `interface CardDefinition` in prose; must reference the canonical definition. Extensibility happens by authoring new cards (e.g., via packs/CardScript) that *conform* to the schema, not by redefining it.”
- [x] Fix 010 — Add a repo-wide doc rule: “Every time you mention `DeckLayoutAdapter`, you must call it `DeckLayoutAdapter (slot-grid runtime)` to avoid `BoardDeck` confusion.”
- [x] Fix 011 — Add a repo-wide doc rule: “Every time you mention `StackComponent`, you must call it `StackComponent (UI vertical list)` to avoid `Stack (composition)` confusion.”
- [x] Fix 012 — Create a new doc `cardplay/docs/canon/terminology-lint.md` listing forbidden ambiguous phrases (e.g., “deck = workspace” without qualifier).
- [x] Fix 013 — In `cardplay/docs/architecture.md`, replace references to non-existent `src/core/*` / `src/registry/*` with links to `canon/module-map.md` and real `cardplay/src/*` paths.
- [x] Fix 014 — In `cardplay/docs/plan.md`, annotate each roadmap path with “exists / partially exists / not present” and link to real paths.
- [x] Fix 015 — Add a `LEGACY-ALIASES/1` block in `cardplay/docs/boards/board-api.md` mapping old deck-type names (pattern-editor, notation-score, etc.) to canonical `DeckType`.
- [x] Fix 016 — Add a `LEGACY-ALIASES/1` block in `cardplay/cardplayui.md` Part VII mapping old `DeckType` names to canonical `DeckType`.
- [x] Fix 017 — Create a new doc `cardplay/docs/canon/port-vocabulary.md` that (a) pins the builtin `PortTypes.*` from `cardplay/src/cards/card.ts` and (b) documents the open extension mechanism (`registerPortType`) with namespaced custom port types; list other port systems as UI-only or legacy until unified.
- [x] Fix 018 — Create a new doc `cardplay/docs/canon/card-systems.md` explicitly enumerating the multiple “card” systems currently in code and naming them (CoreCard, AudioModuleCard, UICardComponent, UserCardTemplate, TheoryCard); add an `EXTENSIBILITY-CONTRACT/1` section explaining how third-party cards declare which system they belong to.
- [x] Fix 019 — Create a new doc `cardplay/docs/canon/deck-systems.md` explicitly enumerating “board deck” vs “slot-grid deck” vs “theory deck template”, with containment rules; include an `EXTENSIBILITY-CONTRACT/1` section describing what third-party packs can add (deck templates, board layouts) vs what is currently core-only (builtin DeckType).
- [x] Fix 020 — Create a new doc `cardplay/docs/canon/stack-systems.md` explicitly enumerating “composition stack” vs “layout stack”, with naming rules; include notes on extensibility (new composition operators/cards vs new UI layout containers).
- [x] Fix 021 — Add a doc rule: “When writing examples, always include the exact file path of the canonical type used.”
- [x] Fix 022 — Add a doc rule: “All examples must use PPQ=960 ticks, never 96.”
- [x] Fix 023 — Add a doc rule: “If a doc is aspirational, it must begin with **Status: aspirational** and contain a “Not implemented yet” section.”
- [x] Fix 024 — Add a doc rule: “If a doc references Prolog predicates, include the `.pl` file path where it lives.”
- [x] Fix 025 — Add a doc rule: “Never claim a component exists unless it exists in `cardplay/src/`.”
- [x] Fix 026 — Create a new doc `cardplay/docs/canon/ssot-stores.md` defining SSOT for Event streams, clips, routing, board state, active context, AI spec.
- [x] Fix 027 — Update `cardplay/docs/state-model.md` to either (a) become aspirational or (b) describe the actual store architecture; pick one and label it.
- [x] Fix 028 — Update `cardplay/docs/persistence-format.md` to explicitly state it is aspirational unless/until an `AppState` snapshot layer exists in code.
- [x] Fix 029 — Update `cardplay/docs/ui-storage-keys.md` to list the actual keys used by `cardplay/src/boards/store/storage.ts` and `cardplay/src/boards/context/store.ts`, and mark older keys as legacy.
- [x] Fix 030 — Create a new doc `cardplay/docs/canon/naming-rules.md` that (a) pins core IDs (ControlLevel, builtin DeckType, core port vocab) and (b) defines the *open* ID scheme for extensions (`<namespace>:<name>`): “don’t invent new un-namespaced core IDs; add new things via namespaced IDs + registries/pack manifests”.
- [x] Fix 031 — Rewrite `to_fix.md` into the bootstrap SSOT hub (canonical noun contracts + boundaries + extensibility rules) and link to this plan doc as the execution checklist.
- [x] Fix 032 — Create `cardplay/docs/canon/declarative-vs-imperative.md` defining the boundary: constraints/spec are declarative facts; decks/boards mutate state; Prolog emits HostActions only (include `DECL-IMP-CONTRACT/1` and the “referee” analogy).
- [x] Fix 033 — Create `cardplay/docs/canon/constraints.md` as the SSOT for `MusicSpec` + `MusicConstraint` semantics: hard vs soft, `weight`, conflict detection, lint/autofix; include the extension path for new constraint types (namespaced custom constraints registered via `cardplay/src/ai/theory/custom-constraints.ts`); reference `cardplay/src/ai/theory/music-spec.ts`.
- [x] Fix 034 — Create `cardplay/docs/canon/host-actions.md` defining the canonical Prolog→TS action wire format and mapping the multiple `HostAction` types in code (`cardplay/src/ai/engine/prolog-adapter.ts`, `cardplay/src/ai/theory/host-actions.ts`, `cardplay/src/ai/advisor/advisor-interface.ts`) as legacy aliases until unified; include an extension rule: new HostAction terms must be namespaced/documented, and the host must ignore/diagnose unknown actions safely.
- [x] Fix 035 — Create `cardplay/docs/canon/ontologies.md` listing each Prolog “ontology pack” loaded by `cardplay/src/ai/knowledge/music-theory-loader.ts` and, for each, its key entities + assumptions + which constraints are exposed via `MusicSpec` vs custom constraints; include an `EXTENSIBILITY-CONTRACT/1` section “how to add a new ontology pack and ship it (e.g., via CardPack)”.
- [x] Fix 036 — Create `cardplay/docs/canon/prolog-kb-map.md` mapping `.pl` files → predicate groups → which docs are allowed to cite them; mark each group as implemented vs experimental.
- [x] Fix 037 — In `cardplay/docs/glossary.md`, add `NOUN-CONTRACT/1` blocks for Constraint, HostAction, OntologyPack, and “SpecContextId” (the ID used to scope facts/actions).
- [x] Fix 038 — In `cardplay/docs/canon/ids.md`, add a “Constraint type strings” table enumerating `MusicConstraint['type']` values (built-in) and the allowed namespace forms for custom constraints.
- [x] Fix 039 — In `cardplay/docs/canon/ids.md`, explicitly pin `TonalityModel = 'ks_profile' | 'dft_phase' | 'spiral_array'` and mark any other doc-claimed values (e.g. `hybrid`) as aspirational/legacy.
- [x] Fix 040 — In `cardplay/docs/canon/naming-rules.md`, add the rule: custom constraints must be namespaced and registered via `cardplay/src/ai/theory/custom-constraints.ts`; docs must show the exact `type` string used.
- [x] Fix 041 — Create `cardplay/docs/canon/extensibility.md` as the SSOT for “infinite extensibility”: how to add (a) a new board + layout + policy (`cardplay/src/boards/registry.ts`), (b) a new deck factory (built-in deck types today; namespaced custom deck types as an explicit future extension), (c) a new card via pack/CardScript, (d) a new ontology pack + Prolog rules + loader (`cardplay/src/ai/knowledge/*.ts`), (e) a new theme/skin (`cardplay/src/boards/theme/*`), and (f) how IDs are namespaced + versioned.
- [x] Fix 042 — Create `cardplay/docs/canon/rules-vs-music-spec.md` explaining how the type-theoretic `Rules<E,C>` concept in `cardplay/cardplay2.md` maps onto the current implemented `MusicSpec` constraint union (and where it doesn’t).
- [x] Fix 043 — Add a repo-wide doc rule: any doc that defines/uses `MusicSpec` must match the exact field names from `cardplay/src/ai/theory/music-spec.ts` (no tuple-meter or nested key object redefinitions).
- [x] Fix 044 — Add a repo-wide doc rule: any Prolog→host recommendation must be documented as `action(ActionTerm, Confidence, Reasons)` (or explicitly marked legacy), and must describe how confidence/reasons are surfaced in UI.
- [x] Fix 045 — Add a repo-wide doc rule: any “deck reasoning” doc must distinguish (a) `BoardDeck` (UI zone), (b) deck templates (`cardplay/src/ai/theory/deck-templates.ts`), and (c) CardScript deck definitions; no unqualified “deck”.
- [x] Fix 046 — Add a repo-wide doc rule: no doc may claim “Prolog changes the project” without naming the HostAction(s) that the host applies (imperative boundary).
- [x] Fix 047 — In `cardplay/docs/canon/declarative-vs-imperative.md`, add a single authoritative “AI loop” diagram: UI edits → declarative spec/facts (MusicSpec + other domains like lyrics tags) → Prolog facts → queries → HostActions → apply → resync.
- [x] Fix 048 — In `cardplay/docs/canon/ssot-stores.md`, add explicit SSOT rules for: spec snapshots (if any), Prolog session state (ephemeral), and the per-board SpecContextId naming convention.
- [x] Fix 049 — Create `cardplay/docs/canon/ai-deck-integration.md` enumerating which `DeckType` read/write MusicSpec, which request Prolog suggestions, and what auto-apply is allowed at each `ControlLevel`; include lyrics-aware tools as first-class examples (lyric-scoped HostActions + lyric streams) and include an extensibility note: third-party AI tools/decks must declare their “suggest vs auto-apply” policy and required capabilities.
- [x] Fix 050 — Create `cardplay/docs/canon/ontology-gating.md` defining “ontology pack” selection rules for boards/decks (board-game analogy: expansion packs) and how cross-ontology tools behave (e.g., DFT/Spiral assume 12‑TET); include an extension hook: packs can add new ontology packs and optional gating/bridge policies.
- [x] Fix 051 — Create `cardplay/docs/canon/legacy-type-aliases.md` listing duplicated/conflicting type names across the repo (HostAction, CadenceType, PortType, CardDefinition, etc.) and the doc-level canonical names to use.
- [x] Fix 052 — Add a repo-wide doc rule: every theory/tradition doc must include `ONTOLOGY-DECL/1` and must not silently mix multiple ontologies without an explicit “bridge” section (bridge sections must use `EXTENSIBILITY-CONTRACT/1` to say how to add/override the bridge in extensions).
- [x] Fix 053 — Add a repo-wide doc rule: cadence IDs in docs must be canonicalized for the Western-tonal ontology (`CadenceType` in `cardplay/src/ai/theory/music-spec.ts`); for other ontologies, cadence/closure concepts must be *namespaced custom constraints* (do not add new un-namespaced cadence strings).
- [x] Fix 054 — Add a repo-wide doc rule: when docs mention “mode”, they must reference `ModeName` in `cardplay/src/ai/theory/music-spec.ts` and list any UI synonyms as `LEGACY-ALIASES/1`.
- [x] Fix 055 — Add a repo-wide doc rule: when docs mention raga/tala/maqam/microtonal pitch, they must state the pitch representation and whether it’s a 12‑TET approximation (link to `canon/ontologies.md`).
- [x] Fix 056 — Add a repo-wide doc rule: Prolog predicate examples must cite the source `.pl` file (`cardplay/src/ai/knowledge/*.pl`) and must not invent predicate names unless explicitly labeled aspirational; extension docs must show “where to put new predicates” and “how they’re loaded”.
- [x] Fix 057 — Create `cardplay/docs/canon/prolog-term-style.md` documenting repo conventions for atoms/lists/reasons (`because/1`), and how action terms are wrapped; link to `cardplay/docs/theory/prolog-conventions.md`.
- [x] Fix 058 — Extend `cardplay/docs/canon/module-map.md` with a section “AI/Prolog paths” (docs must include the `cardplay/` prefix and real module locations, not `src/...` shorthand).
- [x] Fix 059 — In `cardplay/docs/canon/terminology-lint.md`, add forbidden phrases specific to AI/constraints (e.g., “AI updates the state directly”, “hybrid tonality model” if not implemented) and their canonical replacements.
- [x] Fix 060 — Create `cardplay/docs/canon/ai-ssot.md` summarizing the single source of truth for: spec construction, spec→Prolog encoding, action parsing, and action application (with pointers to the exact files).

### Phase 1 — `cardplay/cardplay2.md` stabilization (Fixes 061–220)

- [x] Fix 061 — At the top of `cardplay/cardplay2.md`, add an explicit “This repo has multiple Card/Deck/Stack systems; this spec defines the canonical *core* ones” disclaimer, linking to `cardplay/docs/canon/card-systems.md`.
- [x] Fix 062 — In `cardplay/cardplay2.md` §0.0, update the “Consistency conventions” to include PPQ=960 explicitly and reference `cardplay/src/types/primitives.ts`.
- [x] Fix 063 — In `cardplay/cardplay2.md` core type table, replace `type Tick = number` with a branded-type explanation matching `cardplay/src/types/primitives.ts` (even if examples stay TS-like).
- [x] Fix 064 — In `cardplay/cardplay2.md`, add a `NOUN-CONTRACT/1` block for **Card** that explicitly distinguishes it from UI card widgets and audio module cards; link to `cardplay/src/cards/card.ts` as canonical.
- [x] Fix 065 — In `cardplay/cardplay2.md`, add a `NOUN-CONTRACT/1` block for **Stack (composition)** referencing `cardplay/src/cards/stack.ts`, and state that UI “stack layout” is a different concept.
- [x] Fix 066 — In `cardplay/cardplay2.md` Part XIII “Deck and workspace”, replace ambiguous “deck is main workspace” phrasing with: “Board deck is a zone; the workspace is the Board; decks are zones on it.”
- [x] Fix 067 — In `cardplay/cardplay2.md`, add a `LEGACY-ALIASES/1` mapping between the spec’s “deck grid” language and the implemented `DeckCardLayout`/board deck system.
- [x] Fix 068 — In `cardplay/cardplay2.md`, add a “Canonical ID tables” appendix that must match `cardplay/docs/canon/ids.md` (ControlLevel, DeckType).
- [x] Fix 069 — In `cardplay/cardplay2.md`, remove or clearly label any references to non-existent modules (`src/core/*`, `src/registry/*`).
- [x] Fix 070 — In `cardplay/cardplay2.md`, add a “Doc-to-code map” section listing the canonical modules for Event, Stream, Container, Card, Stack, Board types.
- [x] Fix 071 — In `cardplay/cardplay2.md` event definition, align fields with `cardplay/src/types/event.ts` (note legacy aliases already exist) and explicitly state `EventKind` is open-world (e.g., lyric events are added via the kind registry, not by editing a closed enum in docs).
- [x] Fix 072 — In `cardplay/cardplay2.md`, update any tick/beat formulas to match PPQ=960 and the conversion helpers in `cardplay/src/types/primitives.ts`.
- [x] Fix 073 — In `cardplay/cardplay2.md`, add a “Clip vs Container vs Stream” section that matches the actual code split (`SharedEventStore`, `ClipRegistry`, `Container` types) and includes a lyrics-first example: lyrics live in their own EventStream and are anchored to ticks and/or clips/notes (domain overlay, not a special case in the event store).
- [x] Fix 074 — In `cardplay/cardplay2.md`, add a “Port vocabulary” section that defers to `cardplay/docs/canon/port-vocabulary.md` and forbids inventing `Event<Note>` string types in UI docs.
- [x] Fix 075 — In `cardplay/cardplay2.md`, add an “Adapter system (implemented vs aspirational)” section that points to `cardplay/src/cards/adapter.ts` and explicitly states whether Dijkstra/pathfinding exists (and where).
- [x] Fix 076 — In `cardplay/cardplay2.md`, add a `DECL-IMP-CONTRACT/1` block in the AI/constraints area: Prolog is “referee”; constraints/spec are declarative; HostActions are the only bridge into imperative changes (link `cardplay/docs/canon/declarative-vs-imperative.md`).
- [x] Fix 077 — In `cardplay/cardplay2.md` §2.0.6 “Rules as parametric constraints”, add a “Current implementation mapping” note: implemented constraints are `MusicSpec` + `MusicConstraint` (`cardplay/src/ai/theory/music-spec.ts`), while `Rules<E,C>` is the conceptual umbrella (link `cardplay/docs/canon/rules-vs-music-spec.md`).
- [x] Fix 078 — In `cardplay/cardplay2.md`, add a table mapping doc concepts → implemented types: `Rules<E,C>` → `MusicConstraint` subset; “spec” → `MusicSpec`; “hard/soft” → `constraint.hard`; weights → `constraint.weight`.
- [x] Fix 079 — In `cardplay/cardplay2.md`, add a “Spec→Prolog encoding (canonical)” subsection that names the exact fact forms produced by `cardplay/src/ai/theory/spec-prolog-bridge.ts` (`spec_key/3`, `spec_meter/3`, `spec_tempo/2`, `spec_constraint/4`, …).
- [x] Fix 080 — In `cardplay/cardplay2.md`, add a “Spec scoping (avoid global Prolog state)” subsection referencing `spec_push/1` and `spec_pop/1` in `cardplay/src/ai/knowledge/music-spec.pl` and `withSpecContext` in `cardplay/src/ai/queries/spec-queries.ts`.
- [x] Fix 081 — In `cardplay/cardplay2.md`, add a “Prolog→HostActions (canonical)” subsection linking to `cardplay/docs/canon/host-actions.md` and naming the parsing/apply sites (`cardplay/src/ai/engine/prolog-adapter.ts`, `cardplay/src/ai/theory/host-actions.ts`).
- [x] Fix 082 — In `cardplay/cardplay2.md`, add a `LEGACY-ALIASES/1` block for any non-canonical HostAction examples in the spec (map them to the canonical “wire” action terms, or mark them aspirational).
- [x] Fix 083 — In `cardplay/cardplay2.md`, add a `NOUN-CONTRACT/1` for **Constraint** that bans encoding UI state/layout/selection into constraints; constraints describe *desired/allowed music* only.
- [x] Fix 084 — In `cardplay/cardplay2.md`, add a `NOUN-CONTRACT/1` for **Ontology pack** (a tradition/theory module) and state that mixing ontologies requires an explicit bridge; link `cardplay/docs/canon/ontologies.md`.
- [x] Fix 085 — In `cardplay/cardplay2.md`, add a “Ontology packs present in repo (implemented KB)” list derived from `cardplay/src/ai/knowledge/music-theory-loader.ts` and explicitly note: many KB packs exist even if `MusicSpec` doesn’t expose them as first-class constraints.
- [x] Fix 086 — In `cardplay/cardplay2.md`, update any `tonality_model` discussion/examples to use only `TonalityModel = 'ks_profile' | 'dft_phase' | 'spiral_array'` (mark any `hybrid` value as legacy/aspirational and link `cardplay/docs/canon/ids.md`).
- [x] Fix 087 — In `cardplay/cardplay2.md`, add a “Cadence taxonomy (canonical IDs)” note: cadence IDs in docs must match `cardplay/src/ai/theory/music-spec.ts` `CadenceType`; provide a table mapping UI abbreviations (PAC/HC/DC/PC) to those canonical IDs.
- [x] Fix 088 — In `cardplay/cardplay2.md`, add a “Known duplicate types” warning pointing to `cardplay/docs/canon/legacy-type-aliases.md` (e.g., `CadenceType` in `cardplay/src/ai/theory/music-spec.ts` vs `cardplay/src/ai/theory/harmony-cadence-integration.ts`).
- [x] Fix 089 — In `cardplay/cardplay2.md`, add a “Custom constraints = ontology extensions” subsection that references `cardplay/src/ai/theory/custom-constraints.ts` and requires namespaced constraint types (e.g., `arabic:maqam`) when introducing new ontology terms.
- [x] Fix 090 — In `cardplay/cardplay2.md`, add a table “Tradition/theory → pitch/time ontology → constraint surface” that states projection assumptions (12‑TET vs microtonal) and links to `cardplay/docs/canon/ontologies.md`.
- [x] Fix 091 — In `cardplay/cardplay2.md`, audit the raga/tala sections to explicitly declare pitch representation (12‑TET approximation vs swara) and to distinguish “knowledge in KB” vs “constraints exposed in MusicSpec”.
- [x] Fix 092 — In `cardplay/cardplay2.md`, audit any microtonality/maqam/just‑intonation claims and add **Status: aspirational** unless there is a concrete pitch representation + adapter in `cardplay/src/`.
- [x] Fix 093 — In `cardplay/cardplay2.md`, add a clarification: the Prolog session loads multiple ontology packs at once (see `music-theory-loader.ts`); docs must not imply per-board exclusive KB loading unless implemented.
- [x] Fix 094 — In `cardplay/cardplay2.md`, add a “Deck reasoning vs musical reasoning” subsection: deck/board Prolog facts are workflow/layout reasoning; MusicSpec facts are musical intent; link `cardplay/docs/ai/prolog-deck-reasoning.md` and `cardplay/docs/canon/constraints.md`.
- [x] Fix 095 — In `cardplay/cardplay2.md`, rewrite “AI applies changes” workflows to be expressed as (a) HostActions applied by the host with undo/redo, or (b) explicit validated event patches; no direct Prolog mutation language.
- [x] Fix 096 — In `cardplay/cardplay2.md`, ensure any “cards emit constraints” examples include `hard` vs `soft` semantics and weights (link `cardplay/docs/canon/constraints.md`).
- [x] Fix 097 — In `cardplay/cardplay2.md`, add a “Spec validation vs Prolog lint” subsection aligning `validateSpecConsistency` (`cardplay/src/ai/theory/music-spec.ts`) with `spec_conflict/3`, `spec_lint/2`, and `spec_autofix/3` (`cardplay/src/ai/knowledge/music-spec.pl`).
- [x] Fix 098 — In `cardplay/cardplay2.md`, add a “Spec autofix outputs HostActions” note: lint warnings map to action terms that the host may apply (link `cardplay/docs/canon/host-actions.md`).
- [x] Fix 099 — In `cardplay/cardplay2.md`, add a mandatory “AI/constraints linkouts” mini-index pointing to `cardplay/docs/canon/constraints.md`, `cardplay/docs/canon/host-actions.md`, and `cardplay/docs/canon/ontologies.md`.
- [x] Fix 100 — In `cardplay/cardplay2.md`, sweep AI/Prolog example code blocks: ensure every referenced path starts with `cardplay/src/` or is explicitly labeled aspirational; remove `src/...` shorthand.
- [x] Fix 101 — In `cardplay/cardplay2.md`, add a “SpecEventBus / update triggers” subsection referencing `cardplay/src/ai/theory/spec-event-bus.ts` and describing when spec sync happens (debounced UI edits vs explicit “apply”).
- [x] Fix 102 — In `cardplay/cardplay2.md`, add a note: board control levels affect AI policy (auto-apply vs hint-only); defer details to `cardplay/docs/canon/ai-deck-integration.md` and `cardplay/docs/boards/control-spectrum.md`.
- [x] Fix 103 — In `cardplay/cardplay2.md`, add a clarification: “imperative decks” are UI zones that mutate project state; “deck templates” are AI-recommended bundles (`cardplay/src/ai/theory/deck-templates.ts`); don’t conflate.
- [x] Fix 104 — In `cardplay/cardplay2.md`, add a short subsection: “Theory cards = constraint editors”, referencing `cardplay/src/ai/theory/theory-cards.ts` and the canonical `MusicSpec` field names they target.
- [x] Fix 105 — In `cardplay/cardplay2.md`, add a “Prolog engine (implemented)” note referencing `cardplay/src/ai/engine/prolog-adapter.ts` and pointing to `cardplay/docs/ai/prolog-engine-choice.md` for non-normative discussion.
- [x] Fix 106 — In `cardplay/cardplay2.md`, add a performance note: Tau Prolog runs on the JS thread; any worker-based execution must be marked aspirational unless `cardplay/src/` includes it.
- [x] Fix 107 — In `cardplay/cardplay2.md`, add an “Ontology pack complexity” note: spectral/computational packs may be heavier; docs must state whether queries are bounded/cached (link `cardplay/docs/ai/performance.md`).
- [x] Fix 108 — In `cardplay/cardplay2.md`, add a rule: mixing tonal (Spiral/DFT) and non-tonal/spectral analyses requires explicit bridges/adapters; otherwise treat as separate ontology tools.
- [x] Fix 109 — In `cardplay/cardplay2.md`, add a “Ontology selection” rule-of-thumb: select via `CultureTag`/`StyleTag` + constraints; anything beyond must be a namespaced custom constraint or a separate theory tool.
- [x] Fix 110 — In `cardplay/cardplay2.md`, ensure AI/constraints sections include one explicit board-game analogy line (constraints = rule tokens; Prolog = referee; HostActions = proposed moves).
- [x] Fix 111 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 112 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 113 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 114 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 115 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 116 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 117 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 118 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 119 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 120 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 121 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 122 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 123 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 124 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 125 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 126 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 127 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 128 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 129 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 130 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 131 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 132 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 133 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 134 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 135 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 136 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 137 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 138 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 139 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 140 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 141 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 142 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 143 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 144 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 145 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 146 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 147 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 148 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 149 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 150 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 151 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 152 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 153 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 154 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 155 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 156 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 157 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 158 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 159 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 160 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 161 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 162 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 163 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 164 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 165 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 166 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 167 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 168 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 169 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 170 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 171 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 172 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 173 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 174 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 175 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 176 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 177 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 178 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 179 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 180 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 181 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 182 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 183 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 184 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 185 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 186 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 187 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 188 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 189 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 190 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 191 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 192 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 193 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 194 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 195 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 196 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 197 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 198 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 199 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 200 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 201 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 202 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 203 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 204 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 205 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 206 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 207 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 208 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 209 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 210 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 211 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 212 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 213 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 214 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 215 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 216 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 217 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 218 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 219 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.
- [x] Fix 220 — In `cardplay/cardplay2.md`, audit one subsection and add: (a) `Status:` note if aspirational, (b) code-path references, (c) a 1–2 sentence Game Board analogy line that maps the concept to board/zone/piece/combo.

### Phase 2 — `cardplay/cardplayui.md` stabilization (Fixes 221–340)

- [x] Fix 221 — At the top of `cardplay/cardplayui.md`, add `DOC-HEADER/1` + link to `cardplay/docs/canon/ids.md` and `cardplay/docs/canon/nouns.md`.
- [x] Fix 222 — In `cardplay/cardplayui.md` Part II “Board Architecture”, add a `NOUN-CONTRACT/1` for Board/Panel/BoardDeck, explicitly stating “deck = zone” and “view = how a zone renders”.
- [x] Fix 223 — In `cardplay/cardplayui.md` Part VII “Deck and Stack System”, replace the `DeckType` examples (`pattern-editor`, `notation-score`, etc.) with the canonical `DeckType` union from `cardplay/src/boards/types.ts`.
- [x] Fix 224 — In `cardplay/cardplayui.md`, add a `LEGACY-ALIASES/1` mapping old deck type names to canonical deck type IDs.
- [x] Fix 225 — In `cardplay/cardplayui.md`, define “Stack” in UI context as “layout mode or UI container” and explicitly ban using “stack” for composition in UI sections.
- [x] Fix 226 — In `cardplay/cardplayui.md` Part VIII “Connection Routing”, align connection type names with `BoardConnection.connectionType` (`audio|midi|modulation|trigger`) and `RoutingGraph` edge types; map/remove `cv|data` unless explicitly supported.
- [x] Fix 227 — In `cardplay/cardplayui.md`, add a “Drag/drop payload contracts” section that references `cardplay/src/ui/drag-drop-payloads.ts` and specifies the canonical JSON wire format.
- [x] Fix 228 — In `cardplay/cardplayui.md`, add a “Gating semantics” section that references `cardplay/src/boards/gating/*` and explains control levels as rule variants in the board-game analogy.
- [x] Fix 229 — In `cardplay/cardplayui.md`, add a “Board switch semantics (actual)” section that matches `cardplay/src/boards/switching/switch-board.ts` and corrects any mismatch from docs.
- [x] Fix 230 — In `cardplay/cardplayui.md`, add a “What is *not* implemented” appendix and link out to the relevant docs with `Status: aspirational`.
- [x] Fix 231 — In `cardplay/cardplayui.md`, add a new “Declarative constraints vs imperative decks” section and include `DECL-IMP-CONTRACT/1` (link `cardplay/docs/canon/declarative-vs-imperative.md`).
- [x] Fix 232 — In `cardplay/cardplayui.md`, define where `MusicSpec` lives in the UI architecture: SSOT store, update triggers, and scoping rules (link `cardplay/src/ai/theory/spec-event-bus.ts` and `cardplay/docs/canon/ssot-stores.md`).
- [x] Fix 233 — In `cardplay/cardplayui.md`, add a table “Deck types that edit MusicSpec vs edit Events vs both”, referencing `DeckType` and linking to `cardplay/docs/canon/ai-deck-integration.md`; include lyric-oriented surfaces explicitly (lyrics edit EventStreams; lyric-aware AI requests HostActions).
- [x] Fix 234 — In `cardplay/cardplayui.md`, document the HostAction UX contract: preview → accept/reject → apply → undo/redo; link to `cardplay/docs/canon/host-actions.md` and note ControlLevel-dependent auto-apply policies (include at least one lyric-scoped HostAction example).
- [x] Fix 235 — In `cardplay/cardplayui.md`, add a “SpecContextId naming” section describing how boards/decks scope spec facts/actions (and how switching boards affects it); link `cardplay/docs/canon/ssot-stores.md`.
- [x] Fix 236 — In `cardplay/cardplayui.md`, add an “Ontology packs (expansion packs)” section: how boards declare traditions/models, how the UI hides incompatible theory cards, and why some tools assume 12‑TET (link `cardplay/docs/canon/ontologies.md`).
- [x] Fix 237 — In `cardplay/cardplayui.md`, add a “Theory cards are constraint editors” subsection referencing `cardplay/src/ai/theory/theory-cards.ts` and requiring canonical `MusicSpec` field names in any UI pseudo-code.
- [x] Fix 238 — In `cardplay/cardplayui.md`, add a “Custom constraints” subsection describing namespaced types + registry flow (link `cardplay/src/ai/theory/custom-constraints.ts`): docs must either use canonical builtin constraint types *or* show the registration step for a namespaced custom type (no “mystery strings”).
- [x] Fix 239 — In `cardplay/cardplayui.md`, add a “Deck templates vs board decks” subsection: AI suggests templates (`cardplay/src/ai/theory/deck-templates.ts`), but board decks are zones (`BoardDeck`); show the board-game analogy mapping.
- [x] Fix 240 — In `cardplay/cardplayui.md`, add a “Prolog execution model” note: Tau Prolog runs on the JS thread via `cardplay/src/ai/engine/prolog-adapter.ts`; worker/off-main-thread execution must be labeled aspirational unless implemented.
- [x] Fix 241 — In `cardplay/cardplayui.md`, add a “Tonality model selection UI” note that pins `TonalityModel` to `'ks_profile' | 'dft_phase' | 'spiral_array'` and marks `hybrid` as legacy/aspirational.
- [x] Fix 242 — In `cardplay/cardplayui.md`, add a “Cadence labels vs canonical IDs” table (PAC/HC/IAC/etc) that defers to `cardplay/docs/ai/cadence-types.md` and the canonical `CadenceType` in `cardplay/src/ai/theory/music-spec.ts`.
- [x] Fix 243 — In `cardplay/cardplayui.md`, update the “Boards as typed environments” narrative to include ontology gating as a first-class dimension (board chooses allowed theory cards/constraints).
- [x] Fix 244 — In `cardplay/cardplayui.md`, explicitly separate “AI hints” (read-only suggestions) from “AI actions” (HostActions) and state the acceptance policy per ControlLevel.
- [x] Fix 245 — In `cardplay/cardplayui.md`, add a doc rule box: “No UI doc may say ‘AI updates the project’ without naming HostActions and where they apply (events vs spec vs board layout).”
- [x] Fix 246 — In `cardplay/cardplayui.md`, add an example “Board that changes ontology packs” (e.g., western→carnatic) and specify what must happen: clear/translate constraints, update theory decks, keep events intact unless user opts in.
- [x] Fix 247 — In `cardplay/cardplayui.md`, add a “Cross-ontology bridges” subsection listing allowed bridge patterns (e.g., pitch-class projection, time-span mapping) and forbidding silent conversion.
- [x] Fix 248 — In `cardplay/cardplayui.md`, add a “Constraint conflicts in UI” subsection: show how hard vs soft conflicts render, and how autofix suggestions surface (link `cardplay/docs/canon/constraints.md`).
- [x] Fix 249 — In `cardplay/cardplayui.md`, add a “Gating uses the board-game analogy” sentence in each gating section: what rules change between control levels; tie to `cardplay/src/boards/types.ts` `ControlLevel`.
- [x] Fix 250 — In `cardplay/cardplayui.md`, add a “Doc-to-code map” appendix for AI integration: `music-spec.ts`, `spec-prolog-bridge.ts`, `music-spec.pl`, `host-actions.ts`, `prolog-adapter.ts` (no phantom `@/` paths).
- [x] Fix 251 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 252 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 253 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 254 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 255 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 256 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 257 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 258 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 259 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 260 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 261 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 262 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 263 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 264 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 265 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 266 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 267 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 268 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 269 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 270 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 271 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 272 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 273 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 274 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 275 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 276 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 277 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 278 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 279 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 280 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 281 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 282 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 283 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 284 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 285 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 286 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 287 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 288 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 289 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 290 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 291 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 292 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 293 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 294 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 295 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 296 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 297 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 298 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 299 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 300 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 301 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 302 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 303 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 304 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 305 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 306 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 307 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 308 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 309 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 310 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 311 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 312 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 313 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 314 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 315 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 316 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 317 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 318 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 319 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 320 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 321 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 322 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 323 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 324 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 325 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 326 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 327 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 328 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 329 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 330 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 331 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 332 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 333 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 334 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 335 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 336 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 337 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 338 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 339 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.
- [x] Fix 340 — In `cardplay/cardplayui.md`, for one UI concept (deck state, layout, routing, theming, shortcuts), add: canonical type names + code references + 1-sentence board-game analogy + remove any legacy name collisions.

### Phase 3 — `cardplay/docs/` sweep + targeted repairs (Fixes 341–500)

- [x] Fix 341 — Apply `DOC-HEADER/1` to every markdown file under `cardplay/docs/` (173 files).
- [x] Fix 342 — Apply `NOUN-CONTRACT/1` link-out rule: any doc that mentions Card/Deck/Stack/Track/Clip/Port must link to `cardplay/docs/canon/nouns.md` instead of redefining.
- [x] Fix 343 — Apply `LEGACY-ALIASES/1` rule: any doc using old deck type names must include the alias mapping block once and then only use canonical names.
- [x] Fix 344 — Run a docs-wide pass replacing phantom paths (`src/core/*`, `src/registry/*`) with links to `cardplay/docs/canon/module-map.md` plus the real `cardplay/src/*` paths.
- [x] Fix 345 — For every doc that includes TypeScript snippets, add a one-line “Imports in repo:” note pointing to the real module containing that type/function.
- [x] Fix 346 — Update `cardplay/docs/activity-system.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 347 — Update `cardplay/docs/adapter-cost-model.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 348 — Update `cardplay/docs/ai/ai-advisor.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 349 — Update `cardplay/docs/ai/architecture.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 350 — Update `cardplay/docs/ai/board-integration-guide.md`: add `DOC-HEADER/1`; replace `@/ai/*` import examples with real `cardplay/src/ai/*` paths (or mark aspirational); add `DECL-IMP-CONTRACT/1` (“Prolog suggests HostActions; decks/boards apply imperatively”); add `ONTOLOGY-DECL/1` notes where examples assume a tradition/model; verify all referenced identifiers exist.
- [x] Fix 351 — Update `cardplay/docs/ai/board-predicates.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 352 — Update `cardplay/docs/ai/cadence-types.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 353 — Update `cardplay/docs/ai/composition-predicates.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 354 — Update `cardplay/docs/ai/extending-music-theory-kb.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 355 — Update `cardplay/docs/ai/faq.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 356 — Update `cardplay/docs/ai/generators-reference.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 357 — Update `cardplay/docs/ai/harmony-examples.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 358 — Update `cardplay/docs/ai/harmony-explorer.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 359 — Update `cardplay/docs/ai/index.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 360 — Update `cardplay/docs/ai/kb-architecture.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 361 — Update `cardplay/docs/ai/learning.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 362 — Update `cardplay/docs/ai/music-spec.md`: add `DOC-HEADER/1`; ensure all `MusicSpec` field names match `cardplay/src/ai/theory/music-spec.ts`; add `ONTOLOGY-DECL/1` explaining culture/style vs ontology packs; add a “custom constraints must be namespaced” rule referencing `cardplay/src/ai/theory/custom-constraints.ts`; verify all referenced paths/identifiers exist.
- [x] Fix 363 — Update `cardplay/docs/ai/music-theory-predicates.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 364 — Update `cardplay/docs/ai/performance.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 365 — Update `cardplay/docs/ai/personas/index.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 366 — Update `cardplay/docs/ai/personas/notation-composer.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 367 — Update `cardplay/docs/ai/personas/producer.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 368 — Update `cardplay/docs/ai/personas/sound-designer.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 369 — Update `cardplay/docs/ai/personas/tracker-user.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 370 — Update `cardplay/docs/ai/phrase-adaptation.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 371 — Update `cardplay/docs/ai/predicate-signatures.md`: add `DOC-HEADER/1`; reorganize predicate signatures by KB file (`cardplay/src/ai/knowledge/*.pl`) and ontology pack; require every predicate listing to cite its source file; explicitly document the `action(ActionTerm, Confidence, Reasons)` wrapper where used.
- [x] Fix 372 — Update `cardplay/docs/ai/privacy.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 373 — Update `cardplay/docs/ai/project-analysis.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 374 — Update `cardplay/docs/ai/prolog-deck-reasoning.md`: add `DOC-HEADER/1`; add `NOUN-CONTRACT/1` blocks that distinguish `BoardDeck` vs deck templates vs CardScript deck defs (link `cardplay/docs/canon/deck-systems.md`); add `DECL-IMP-CONTRACT/1` clarifying Prolog emits HostActions and does not mutate decks directly; verify predicate examples match real `.pl` files.
- [x] Fix 375 — Update `cardplay/docs/ai/prolog-engine-choice.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 376 — Update `cardplay/docs/ai/prolog-reference.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 377 — Update `cardplay/docs/ai/prolog-syntax.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 378 — Update `cardplay/docs/ai/query-patterns.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 379 — Update `cardplay/docs/ai/theory-card-authoring.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 380 — Update `cardplay/docs/ai/tonal-centroid-vs-spiral-array.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 381 — Update `cardplay/docs/ai/troubleshooting.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 382 — Update `cardplay/docs/ai/workflow-planning.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 383 — Update `cardplay/docs/architecture.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 384 — Update `cardplay/docs/audio-engine-architecture.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 385 — Update `cardplay/docs/autosave-ux.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 386 — Update `cardplay/docs/boardcentric/audit.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 387 — Update `cardplay/docs/boardcentric/baseline.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 388 — Update `cardplay/docs/boardcentric/fix-priority.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 389 — Update `cardplay/docs/boardcentric/progress-a020.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 390 — Update `cardplay/docs/boardcentric/progress-a024.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 391 — Update `cardplay/docs/boardcentric/progress-session-summary.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 392 — Update `cardplay/docs/boardcentric/progress-summary.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 393 — Update `cardplay/docs/boardcentric/typecheck-analysis.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 394 — Update `cardplay/docs/boards/accessibility-checklist.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 395 — Update `cardplay/docs/boards/ai-arranger-board.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 396 — Update `cardplay/docs/boards/ai-composition-board.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 397 — Update `cardplay/docs/boards/authoring-boards.md`: add `DOC-HEADER/1` + `EXTENSIBILITY-CONTRACT/1`; document how to create/register a new board (`cardplay/src/boards/registry.ts`), how board IDs should be namespaced for packs, and how to ship boards via CardPacks (and what happens if a board is missing).
- [x] Fix 398 — Update `cardplay/docs/boards/authoring-decks.md`: add `DOC-HEADER/1` + `EXTENSIBILITY-CONTRACT/1`; document how deck factories register (`cardplay/src/boards/decks/factory-registry.ts`) and how new functionality usually ships as new cards inside existing deck types (note the current builtin `DeckType` constraint and the explicit future path for namespaced custom deck types).
- [x] Fix 399 — Update `cardplay/docs/boards/basic-sampler-board.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 400 — Update `cardplay/docs/boards/basic-session-board.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 401 — Update `cardplay/docs/boards/basic-tracker-board.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 402 — Update `cardplay/docs/boards/board-api.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 403 — Update `cardplay/docs/boards/board-state.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 404 — Update `cardplay/docs/boards/board-switching-semantics.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 405 — Update `cardplay/docs/boards/board-switching.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 406 — Update `cardplay/docs/boards/board-v1-release-checklist.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 407 — Update `cardplay/docs/boards/capabilities.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 408 — Update `cardplay/docs/boards/composer-board.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 409 — Update `cardplay/docs/boards/control-spectrum.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 410 — Update `cardplay/docs/boards/deck-stack-system.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 411 — Update `cardplay/docs/boards/decks.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 412 — Update `cardplay/docs/boards/e2e-test-plan.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 413 — Update `cardplay/docs/boards/gating.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 414 — Update `cardplay/docs/boards/generative-ambient-board.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 415 — Update `cardplay/docs/boards/harmony-coloring.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 416 — Update `cardplay/docs/boards/index.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 417 — Update `cardplay/docs/boards/integration-tests.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 418 — Update `cardplay/docs/boards/layout-runtime.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 419 — Update `cardplay/docs/boards/live-performance-board.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 420 — Update `cardplay/docs/boards/migration.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 421 — Update `cardplay/docs/boards/notation-board-manual.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 422 — Update `cardplay/docs/boards/notation-harmony-board.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 423 — Update `cardplay/docs/boards/panels.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 424 — Update `cardplay/docs/boards/performance-benchmarks.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 425 — Update `cardplay/docs/boards/producer-board.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 426 — Update `cardplay/docs/boards/project-compatibility.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 427 — Update `cardplay/docs/boards/release-criteria.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 428 — Update `cardplay/docs/boards/routing.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 429 — Update `cardplay/docs/boards/session-generators-board.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 430 — Update `cardplay/docs/boards/shortcuts.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 431 — Update `cardplay/docs/boards/theming.md`: add `DOC-HEADER/1` + `EXTENSIBILITY-CONTRACT/1`; document theme extension surfaces (`cardplay/src/boards/theme/*`), how custom colors/skins are applied, and how themes can be shipped in packs (visual-only; no logic).
- [x] Fix 432 — Update `cardplay/docs/boards/tool-modes.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 433 — Update `cardplay/docs/boards/tracker-harmony-board.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 434 — Update `cardplay/docs/boards/tracker-phrases-board.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 435 — Update `cardplay/docs/boards/ui-components.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 436 — Update `cardplay/docs/builtin-samples.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 437 — Update `cardplay/docs/capabilities-reference.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 438 — Update `cardplay/docs/capability-prompts.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 439 — Update `cardplay/docs/card-definition-format.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 440 — Update `cardplay/docs/cardscript-syntax-reference.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 441 — Update `cardplay/docs/cardscript-types-reference.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 442 — Update `cardplay/docs/cardscript.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 443 — Update `cardplay/docs/coding-style.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 444 — Update `cardplay/docs/composer-deck-layout.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 445 — Update `cardplay/docs/debugging.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 446 — Update `cardplay/docs/dsl-diff-patch-examples.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 447 — Update `cardplay/docs/dsl-examples.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 448 — Update `cardplay/docs/dsl-import-export-ui.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 449 — Update `cardplay/docs/dsl-schema-reference.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 450 — Update `cardplay/docs/event-kind-schemas.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`), and include a concrete extensibility example (registering a new kind such as `lyric` without breaking note-only adapters).
- [x] Fix 451 — Update `cardplay/docs/glossary.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 452 — Update `cardplay/docs/graph-invariants.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 453 — Update `cardplay/docs/history-semantics.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 454 — Update `cardplay/docs/host-surface-reference.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 455 — Update `cardplay/docs/index.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 456 — Update `cardplay/docs/learn-arrangement.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 457 — Update `cardplay/docs/learn-audio.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 458 — Update `cardplay/docs/learn-card-library.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 459 — Update `cardplay/docs/learn-card-packs.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 460 — Update `cardplay/docs/learn-clip-editor.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 461 — Update `cardplay/docs/learn-command-palette.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 462 — Update `cardplay/docs/learn-getting-started.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 463 — Update `cardplay/docs/learn-graph-report.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 464 — Update `cardplay/docs/learn-mixer.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 465 — Update `cardplay/docs/learn-pads.md`: add `DOC-HEADER/1`, add a 1-sentence `Analogy:` line, and verify all referenced paths/identifiers exist (otherwise mark them legacy/aspirational and link to `canon/module-map.md`).
- [x] Fix 466 — Rewrite `cardplay/docs/card-definition-format.md` to match actual card registries/types in `cardplay/src/cards/*` and the pack manifest entrypoints in `cardplay/src/user-cards/manifest.ts`; explicitly distinguish it from `cardplay/src/cards/card-visuals.ts`’s UI `CardDefinition`; include `EXTENSIBILITY-CONTRACT/1` for adding new cards via packs (namespaced IDs + capabilities).
- [x] Fix 467 — Rewrite `cardplay/docs/port-unification-rules.md` to either (a) match `cardplay/src/boards/gating/validate-connection.ts` and `cardplay/src/cards/card.ts`, or (b) mark unimplemented registry-based unification as aspirational.
- [x] Fix 468 — Rewrite `cardplay/docs/adapter-cost-model.md` to match `cardplay/src/cards/adapter.ts` (and state whether the cost model is actually used anywhere).
- [x] Fix 469 — Rewrite `cardplay/docs/protocol-compatibility.md` to match `cardplay/src/cards/protocol.ts` (and remove references to missing `src/registry/*`).
- [x] Fix 470 — Rewrite `cardplay/docs/graph-invariants.md` to either (a) match the actual routing graph invariants in `cardplay/src/state/routing-graph.ts` or (b) mark the “project graph” system as aspirational.
- [x] Fix 471 — Rewrite `cardplay/docs/stack-inference.md` to match `cardplay/src/cards/stack.ts` (or mark richer inference as aspirational and link to a stub location).
- [x] Fix 472 — Rewrite `cardplay/docs/state-model.md` to match actual stores (`SharedEventStore`, `ClipRegistry`, `RoutingGraphStore`, `BoardStateStore`, `BoardContextStore`) and include SSOT statement.
- [x] Fix 473 — Rewrite `cardplay/docs/boards/decks.md` to clearly distinguish “board deck types” from “cards inside decks” and to link to the implemented factory list in `cardplay/src/boards/decks/factories/`.
- [x] Fix 474 — Rewrite `cardplay/docs/boards/deck-stack-system.md` to rename “Stack” occurrences to “UI stack layout” where appropriate and link to `cardplay/src/ui/components/stack-component.ts` explicitly.
- [x] Fix 475 — Rewrite `cardplay/docs/boards/authoring-decks.md` to match the real `DeckFactory`/`DeckInstance` shape in `cardplay/src/boards/decks/factory-types.ts` and to explicitly frame decks as an extension surface (registration, namespacing, and pack distribution; remove Svelte references if inaccurate).
- [x] Fix 476 — Update `cardplay/docs/boards/board-switching-semantics.md` to match `cardplay/src/boards/switching/switch-board.ts` (including current bugs/mismatches, clearly labeled).
- [x] Fix 477 — Update `cardplay/docs/boards/gating.md` to match actual gating logic in `cardplay/src/boards/gating/*` and reframe control levels as “rule variants” in the board-game analogy.
- [x] Fix 478 — Update `cardplay/docs/theory/lyrics_integration.md`: add `DOC-HEADER/1` + `DECL-IMP-CONTRACT/1` + `EXTENSIBILITY-CONTRACT/1`, explicitly name the *current* assumptions in tracker/notation adapters, and mark integration steps as staged/aspirational (avoid requiring new builtin `DeckType` values for MVP).
- [x] Fix 479 — Update `cardplay/docs/pack-format-reference.md` to make “infinite extensibility” explicit: add `DOC-HEADER/1` + `EXTENSIBILITY-CONTRACT/1`; document how a CardPack can ship **new cards**, **CardScript**, **deck templates**, **boards**, **themes**, and **Prolog KB/ontology packs**; require namespaced IDs and a versioned manifest.
- [x] Fix 480 — Update `cardplay/docs/pack-installation-ux.md` to describe extension installation as the normal path: trust/signing, provenance, rollback, and how capability-gated cards/KBs/themes are surfaced safely (link `cardplay/docs/pack-signing-trust-model.md` and `cardplay/docs/pack-provenance.md`).
- [x] Fix 481 — Update `cardplay/docs/registry-api.md` to include the extension story: which registries exist (boards, deck factories, user cards/packs, ontology packs), how extensions register at runtime, and how IDs are namespaced to avoid collisions (link `cardplay/docs/canon/extensibility.md`).
- [x] Fix 482 — Update `cardplay/docs/theory/card-to-prolog-sync.md`: align MusicSpec shape with `cardplay/src/ai/theory/music-spec.ts` + `cardplay/src/ai/theory/spec-prolog-bridge.ts`; replace the incorrect `music_spec/7` signature; add `DECL-IMP-CONTRACT/1`; ensure paths use `cardplay/src/...`.
- [x] Fix 483 — Update `cardplay/docs/theory/prolog-to-host-actions.md`: replace the HostAction schema with the canonical wire format (link `cardplay/docs/canon/host-actions.md`); add a mapping table from Prolog action terms → TS types; include the accept/apply loop + undo/redo semantics.
- [x] Fix 484 — Update `cardplay/docs/theory/kb-layering.md`: treat KB files as ontology packs loaded by `cardplay/src/ai/knowledge/music-theory-loader.ts`; add a table “KB pack → domain entities → constraints exposed (MusicSpec vs custom)”; link `cardplay/docs/canon/ontologies.md`.
- [x] Fix 485 — Update `cardplay/docs/theory/prolog-conventions.md`: align explanation/reasons conventions with parsing in `cardplay/src/ai/theory/host-actions.ts`; document the `action(ActionTerm, Confidence, Reasons)` wrapper and forbid undocumented variants.
- [x] Fix 486 — Update `cardplay/docs/theory/computational-models.md`: add `DOC-HEADER/1` + `ONTOLOGY-DECL/1`; reconcile model names with `TonalityModel` in `cardplay/src/ai/theory/music-spec.ts`; replace phantom TS APIs with real ones or mark them aspirational; cite `.pl` sources.
- [x] Fix 487 — Update `cardplay/docs/theory/centroid-vs-spiral.md`: remove `hybrid` from tonality model values unless implemented; fix/label Prolog snippets to match `cardplay/src/ai/knowledge/*.pl`; add explicit 12‑TET assumptions and ontology notes.
- [x] Fix 488 — Update `cardplay/docs/theory/dft-phase-tonality.md`: align the TS “usage” import paths with real modules (or mark aspirational); ensure Prolog predicate names are cited from `cardplay/src/ai/knowledge/music-theory*.pl`; add `ONTOLOGY-DECL/1` (“12‑TET only”) and link to `TonalityModel='dft_phase'`.
- [x] Fix 489 — Update `cardplay/docs/theory/spiral-array.md`: add `ONTOLOGY-DECL/1`; ensure chord/key distance or modulation predicates are cited from the actual KB; remove voice-leading optimization claims unless implemented; tie explicitly to `TonalityModel='spiral_array'`.
- [x] Fix 490 — Update `cardplay/docs/theory/galant-schemata.md`: add `ONTOLOGY-DECL/1` (galant); align schema names with `GalantSchemaName` in `cardplay/src/ai/theory/music-spec.ts`; replace incorrect cadence IDs (e.g., `pac`) with canonical mappings; cite `cardplay/src/ai/knowledge/music-theory-galant.pl`.
- [x] Fix 491 — Update `cardplay/docs/theory/authoring-theory-cards.md`: define the canonical contract “theory cards edit MusicSpec constraints” and show the sync path via `cardplay/src/ai/theory/spec-event-bus.ts` + `cardplay/src/ai/theory/spec-prolog-bridge.ts` + `cardplay/src/ai/knowledge/music-spec.pl`.
- [x] Fix 492 — Update `cardplay/docs/theory/extending-music-theory-kb.md`: write a step-by-step “add ontology pack” checklist (new `.pl` file, loader wiring, docs/canon/ontologies update) and a “add new constraint” checklist (namespaced type, `custom-constraints.ts` registration, encoder/decoder).
- [x] Fix 493 — Update `cardplay/docs/ai/cadence-types.md`: reconcile cadence taxonomy across docs/TS (canonical `CadenceType` from `cardplay/src/ai/theory/music-spec.ts`; legacy IDs in `cardplay/src/ai/theory/harmony-cadence-integration.ts`); add a mapping table for PAC/HC/IAC/etc; for non-Western closure concepts, require namespaced custom constraints instead of un-namespaced “new cadence strings”.
- [x] Fix 494 — Update `cardplay/docs/ai/kb-architecture.md`: align the doc with `cardplay/docs/canon/ontologies.md` and `cardplay/src/ai/knowledge/music-theory-loader.ts`; explicitly separate “KB packs loaded” from “constraints exposed in MusicSpec”.
- [x] Fix 495 — Update `cardplay/docs/ai/music-theory-predicates.md`: group predicates by ontology pack and require citing the source `.pl` file for every predicate; add `ONTOLOGY-DECL/1` at the top and for any cross-pack bridge section.
- [x] Fix 496 — Update `cardplay/docs/ai/prolog-engine-choice.md`: make the execution model explicit (Tau Prolog via `cardplay/src/ai/engine/prolog-adapter.ts`); document main-thread implications and label worker execution as aspirational unless implemented.
- [x] Fix 497 — Update `cardplay/docs/ai/tonal-centroid-vs-spiral-array.md`: reconcile with `cardplay/docs/theory/centroid-vs-spiral.md`; pin `TonalityModel` to the canonical union; cite KB predicates or mark snippets aspirational.
- [x] Fix 498 — Update `cardplay/docs/ai/harmony-explorer.md`: ensure pivot/cadence vocabulary aligns with canonical cadence IDs and/or is explicitly labeled UI aliases; cite `cardplay/src/ai/theory/harmony-cadence-integration.ts` and mark mock generators as mock.
- [x] Fix 499 — Update `cardplay/docs/ai/board-predicates.md`: distinguish BoardDeck vs deck templates vs CardScript decks; cite `cardplay/src/ai/knowledge/board-layout.pl`; include `DECL-IMP-CONTRACT/1` to prevent “Prolog mutates UI” phrasing.
- [x] Fix 500 — Update `cardplay/docs/ai/prolog-deck-reasoning.md`: ensure it links to `cardplay/docs/canon/declarative-vs-imperative.md` + `cardplay/docs/canon/constraints.md`; remove any language that implies direct mutation; require citing `.pl` sources for facts/predicates.
