# Prolog AI: Reasoning About Cards, Decks, and Boards

**Status:** implemented  
**Canonical terms used:** BoardDeck, Card, MusicSpec, HostAction, Prolog KB  
**Primary code references:** `cardplay/src/ai/knowledge/board-layout.pl`, `cardplay/src/ai/engine/prolog-adapter.ts`  
**Analogy:** The "referee" (Prolog) reasoning about which game pieces (cards) and zones (decks) to recommend.  
**SSOT:** See [Declarative vs Imperative](../canon/declarative-vs-imperative.md) for the boundary contract.

> **Important:** Prolog emits HostActions as suggestions. It does not directly mutate UI or project state. See [HostActions](../canon/host-actions.md).

> **Noun Contracts:**
> - **BoardDeck (zone):** UI zone in a panel — see [Deck Systems](../canon/deck-systems.md)
> - **DeckTemplate (AI):** Recommended card combinations — see [Deck Systems](../canon/deck-systems.md)
> - **Card:** Different meanings exist; this doc discusses recommendation, not `Card<A,B>` — see [Card Systems](../canon/card-systems.md)

---

CardPlay’s AI layer is **declarative**: we represent “what is true” about cards/decks/boards and the current project state as **facts**, then ask Prolog to derive **recommendations**, **validations**, and **explanations** as queries.

This doc describes:
- How to model **card-level**, **deck-level**, and **board-level** choices in Prolog
- How to structure “high-level” vs “low-level” predicates (so the KB stays maintainable)
- Two-way interoperability between **CardScript** and **Prolog**:
  - writing Prolog queries from CardScript
  - synthesizing CardScript cards/decks into Prolog facts (and CardScript query objects into Prolog goals)

---

## 1) Mental model: three scopes of choice

### Card-level choices
Decisions local to a single card or a single card invocation:
- parameter selection (`gain=0.8`, `swing=54%`, `density=0.2`)
- which variant/mode to run (e.g. “arpeggiate” vs “strum”)
- micro-choices during generation (note selection, voicing, rhythm pattern)

Card-level reasoning is typically about **constraints** and **local optimization**:
- “produce a bassline that fits these chords”
- “pick a filter cutoff that won’t clip”
- “choose a phrase tagged `lofi` with energy < 0.4”

### Deck-level choices
Decisions about a chain/stack of cards (in a deck/stack/panel):
- which cards to include (composition)
- ordering and routing (serial/parallel/tabs)
- adapter insertion (type conversions / glue)
- deck “role” selection (bass deck, drums deck, harmony deck, master deck)

Deck-level reasoning is typically about **compatibility** and **coverage**:
- “this deck needs a generator + a humanizer + a limiter”
- “ports unify without adapters” or “insert `midi->cv` here”
- “avoid redundant cards; keep cognitive load low”

### Board-level choices
Decisions about the whole UI surface and workflow:
- which board template is appropriate (tracker vs composer vs arranger)
- which decks/panels are visible (and where)
- what to show/hide given **controlLevel** and persona mode (manual / directed / generative)
- cross-deck guidance (e.g. “you changed chords; regenerate bass + pad voicings”)

Board-level reasoning is about **workflow coherence**:
- “given this user + project state, what’s the next helpful action?”
- “which deck should be active and which tools should be gated?”

---

## 2) High-level vs low-level Prolog: keep the KB layered

A healthy Prolog knowledge base is layered:

- **Low-level facts**: “atoms of truth” imported from registries/state.
  - `card/1`, `card_tag/2`, `card_port/4`, `deck_slot/3`, `board_deck/2`, …
- **Low-level derived predicates**: reusable relations that don’t encode product goals.
  - `compatible_type/2`, `deck_has_role/2`, `can_connect/4`, `requires_adapter/3`, …
- **Mid-level constraints**: named constraints you can compose.
  - `valid_deck/1`, `no_dead_ends/1`, `meets_goal/2`, `within_budget/2`, …
- **High-level queries**: what callers actually ask for.
  - `recommend_deck/3`, `recommend_card_params/4`, `recommend_board/3`, …

This separation is what lets you support “high-level reasoning” (workflow and intent) while still being able to drill down to “low-level reasoning” (ports, tags, invariants).

---

## 3) Representing cards/decks/boards as Prolog facts

### 3.1 Cards (library-level facts)

At minimum, represent:
- identity: `card(CardId).`
- UI/semantic grouping: `card_category(CardId, Category).`
- ports: `card_port(CardId, in|out, Index, Type).`
- tags and affordances: `card_tag(CardId, Tag).`
- effects/capabilities: `card_effect(CardId, Effect).`

Example:

```prolog
% Identity
card('fx.gain').
card_category('fx.gain', effects).

% Ports (index-based to match inference logic)
card_port('fx.gain', in, 0, audio).
card_port('fx.gain', out, 0, audio).

% Tags and effects (used for search + gating)
card_tag('fx.gain', gain).
card_effect('fx.gain', deterministic).
```

### 3.2 Decks (instance-level facts)

Deck facts are about a *specific configured deck instance*:
- identity: `deck(DeckId).`
- slots/order: `deck_slot(DeckId, SlotIndex, CardId).`
- routing: `deck_routing(DeckId, serial|parallel|tabs|switch).`
- role: `deck_role(DeckId, Role).` (optional but useful)

Example:

```prolog
deck('deck.master').
deck_routing('deck.master', serial).
deck_role('deck.master', master_bus).
deck_slot('deck.master', 0, 'fx.gain').
deck_slot('deck.master', 1, 'fx.limiter').
```

### 3.3 Boards (workflow + layout facts)

Board facts describe what a board is and what it contains:
- identity: `board(BoardId).`
- which decks/panels it includes: `board_deck(BoardId, DeckId).`
- control level / persona mode: `board_mode(BoardId, manual|directed|generative).`
- UI layout hints: `board_panel(BoardId, PanelId, Region).` (optional)

Example:

```prolog
board('board.composer').
board_mode('board.composer', directed).
board_deck('board.composer', 'deck.master').
board_deck('board.composer', 'deck.harmony').
board_deck('board.composer', 'deck.bass').
```

---

## 4) Turning facts into choices

### 4.1 Card-level: pick parameters or actions

A common pattern is a high-level predicate returning both a recommendation and an explanation:

```prolog
% recommend_card_params(+CardId, +Context, -Params, -Reasons)
recommend_card_params(CardId, Ctx, Params, Reasons) :-
  card(CardId),
  card_tag(CardId, generator),
  context_tempo(Ctx, Tempo),
  Tempo > 90,
  Params = [density-0.25, swing-0.12],
  Reasons = [because(tempo_fast), because(generator_card)].
```

Notes:
- `Ctx` is usually a *term* representing the current project slice (tempo, key, selected deck, etc).
- The `Reasons` list is a structured explanation you can surface in UI.

### 4.2 Deck-level: choose a composition that unifies

Deck-level reasoning typically combines:
- content constraints (“needs a limiter”)
- type constraints (port unification / adapter insertion)
- UX constraints (“keep it short”, “avoid duplicates”)

Sketch:

```prolog
% A deck is "safe" if it ends with a limiter (toy example)
safe_master_deck(DeckId) :-
  deck_role(DeckId, master_bus),
  deck_slot(DeckId, LastIndex, CardId),
  card_tag(CardId, limiter),
  \+ ( deck_slot(DeckId, I, _), I > LastIndex ).

% Recommend a deck for a role + goal (prefer decks already valid)
recommend_deck(Role, Goal, DeckId) :-
  deck_role(DeckId, Role),
  meets_goal(DeckId, Goal),
  valid_deck_ports(DeckId),
  safe_master_deck(DeckId).
```

In practice, `valid_deck_ports/1` should match your stack inference model
(see `docs/stack-inference.md`), but expressed declaratively:
- `can_connect(CardA, CardB)` based on ports/types
- `requires_adapter(TypeA, TypeB, AdapterCard)` when necessary

### 4.3 Board-level: choose workflow + gating

Board-level predicates answer questions like:
- “What board should I switch to for this task?”
- “Which decks should be surfaced for this mode?”
- “Which tools should be hidden for beginner/manual mode?”

Sketch:

```prolog
% Recommend a board given a persona + project state
recommend_board(Persona, Project, BoardId) :-
  board(BoardId),
  persona_prefers(Persona, BoardId),
  board_supports(Project, BoardId),
  board_mode(BoardId, directed).
```

---

## 5) Runtime: static KB + dynamic facts

Most systems work best with two layers:

1) **Static knowledge bases** (loaded once):
   - card library facts (builtins + installed packs)
   - general rules (compatibility, inference, heuristics)
2) **Dynamic session facts** (asserted per project / per query):
   - current tempo/key/time signature
   - current board/deck selection
   - which cards are currently present and how they’re routed

In TypeScript, dynamic facts map well to `assertz/1` + `retractall/1` via `PrologAdapter`.

Implementation reference:
- `src/ai/engine/prolog-adapter.ts`

Example sketch (TS):

```ts
import { getPrologAdapter } from '../ai/engine/prolog-adapter';

const prolog = getPrologAdapter();

await prolog.loadProgram(STATIC_KB, 'kb_static');

// Per-query dynamic facts (keep them namespaced)
await prolog.assertz(`ctx_tempo(tempo, 120)`);
await prolog.assertz(`ctx_key(key, 'c_minor')`);

const result = await prolog.queryAll(`recommend_board(composer, project, Board).`);

await prolog.retractAll(`ctx_tempo(_, _)`);
await prolog.retractAll(`ctx_key(_, _)`);
```

Practical note: Tau Prolog runs on the JS thread; for non-trivial KBs, prefer running the Prolog session in a Web Worker (`prolog-worker.ts` in the roadmap) so queries can be bounded without risking UI stalls.

---

## 6) CardScript ↔ Prolog interoperability

There are two complementary directions:

1) **CardScript → Prolog**: install-time synthesis of CardScript cards/decks into Prolog facts.
2) **CardScript → Prolog (queries)**: build Prolog goals from CardScript query objects (avoid raw strings when possible).
3) **CardScript ↔ Prolog at runtime**: call Prolog from CardScript for suggestions/generation (capability-gated).

### 6.1 Synthesizing CardScript definitions into Prolog facts

CardScript already has “complete mode” objects and registries (see `src/user-cards/cardscript/invoke.ts`):
- `registerCard(...)`
- `registerDeck(...)` where `DeckDef` is `{ id, name, cards, routing, tags }`

At pack install time (or dev hot-reload), translate these into Prolog facts:

```prolog
% Cards
card('fx.gain').
card_category('fx.gain', effects).
card_tag('fx.gain', gain).
card_port('fx.gain', in, 0, audio).
card_port('fx.gain', out, 0, audio).

% Decks
deck('deck.lofi.master').
deck_routing('deck.lofi.master', serial).
deck_tag('deck.lofi.master', lofi).
deck_card('deck.lofi.master', 0, 'fx.saturation').
deck_card('deck.lofi.master', 1, 'fx.limiter').
```

This gives Prolog a searchable inventory of what exists in the user’s installed ecosystem.

### 6.2 Writing Prolog queries from CardScript (raw goal strings)

The most direct approach is to provide a **capability-gated stdlib function** in CardScript:
- `prologSingle(goal: string) -> object|null`
- `prologAll(goal: string) -> object[]`

Then a generator card can ask for a decision:

```cardscript
card SuggestBassStyle {
  inputs: { in: EventStream }
  outputs: { out: EventStream }
  params: { genre: string }
  process: {
    // goal string is Prolog syntax; keep it deterministic and allowlisted
    let r = await prologSingle("recommend_bass_style(Genre, Style).")
    emit recommendation({ kind: "bassStyle", style: r.Style })
    output = input
  }
}
```

Design constraints:
- **Never** let CardScript perform unrestricted `assert/retract` unless explicitly allowed by capabilities.
- Prefer **pure queries** for determinism and replayability.
- Route Prolog execution off the audio thread (worker) for safety.

### 6.3 Synthesizing CardScript query objects into Prolog goals (structured queries)

Raw Prolog strings are powerful but fragile. A more user-friendly and LLM-friendly pattern is a structured query object that compiles to a goal.

Example CardScript-side query object:

```cardscript
let q = {
  want: "card",
  where: [
    { tag: "limiter" },
    { outputs: ["audio"] }
  ],
  limit: 3
}
```

Compile to Prolog goal (one possible mapping):

```prolog
cardscript_query(
  query(want(card), where([tag(limiter), outputs([audio])]), limit(3)),
  CardId
).
```

The compilation step lives in TypeScript:
- validate the object
- map fields → predicate templates
- convert JSON → Prolog term syntax (a `jsToTermString`-style helper)

This is the same idea as “SQL query builder”: CardScript authors express *intent*, Prolog still does the reasoning.

---

## 7) End-to-end flow (recommended)

1) **Install packs** → compile CardScript definitions → assert `card/*`, `deck/*`, `board/*` facts into the static KB.
2) **Open project** → assert dynamic state facts (`tempo`, `key`, `selected_board`, deck contents, etc).
3) **Ask high-level query** from UI or an AI card:
   - `recommend_board(Persona, Project, Board).`
   - `recommend_deck(Role, Goal, Deck).`
   - `recommend_card_params(Card, Ctx, Params, Reasons).`
4) **Return results** as JSON-friendly bindings + explanations.
5) **Apply** results as explicit patches/events (so the output is inspectable, undoable, and replayable).

