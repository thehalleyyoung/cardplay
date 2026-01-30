# GOFAI Music+ (CardPlay Integration): An Offline Natural‑Language Compiler into Typed Musical Logic + Verified Edits

This document is **GOFAI Music+**: a radically detailed integration blueprint that takes the ambition of `cardplay/gofaimusic.md` and **binds it tightly to CardPlay’s actual architecture** (Boards/Decks/Cards, `Event<P>` streams, the Prolog reasoning layer, and the repo’s “canon first” approach).

It is intentionally long and concrete because the core thesis is not “an assistant that talks about music”, but **a deterministic language compiler** that can:

1) Parse English music instructions into a **typed logical form** (Musical Logic)  
2) Validate that logical form against constraints, scope, and the current project world state  
3) Plan **bounded, reversible edits** to CardPlay project state (events, containers, cards, DSP params)  
4) Produce **diffs + explanations** users can trust and share

The “plus” adds what `gofaimusic.md` only sketches: **how this would actually live inside CardPlay**, how it would interact with existing components, and what the module structure would look like for a **100K+ line GOFAI English → Musical Logic parser** whose type system is explicitly inspired by CardPlay’s own typed model.

---

## 4) The 100K+ LOC English → CPL Parser: Architecture, Modules, and Why It’s That Big

If you want the system to be *offline and deterministic*, the parser cannot be a prompt‑engineering wrapper around an LLM. It has to be a real language frontend: lexicon, grammar, semantics, pragmatics, and typechecking. The reason the codebase needs to be huge is not because parsing is hard in the abstract; it’s because the useful musician sublanguage is broad, messy, and deeply contextual.

The key product requirement is this:

> A musician can speak naturally in a studio session, and the system can either (a) compile to the correct meaning or (b) ask a targeted clarification question.

That demands coverage of:

- Imperatives (“make it darker”)  
- Coordinations (“make it darker and less busy”)  
- Comparatives (“more lift”, “less reverb”)  
- Scopes (“in the second verse”, “for two bars”)  
- Referencing (“that chorus”, “do it again”, “like before”)  
- Constraints (“keep the melody exact”, “don’t change the chords”)  
- Domain nouns (bars, chorus, hook, pad, hats, swing, voicing, drop)  
- Domain adjectives (tight, intimate, hopeful, wide, bright, punchy)  
- Dialogue moves (accept defaults, override, ask “what changed?”)

### 4.1 The compiler pipeline (more detailed)

Here’s the pragmatic “real compiler” view, where every stage has a crisp contract:

1) **Normalization**  
   - Canonicalize punctuation, quotes, hyphenation, units (“bpm”, “BPM”)  
   - Normalize known synonyms into canonical vocab (“hi‑hats” → “hats”, “kick drum” → “kick”)  
   - Detect explicit references (bar numbers, section names, track names in quotes)

2) **Tokenization**  
   - Produce tokens with spans, whitespace, and original substrings  
   - Preserve user text for explanation and for exact references (“the thing I called ‘glass pad’”)

3) **Syntactic parse**  
   - Build a parse forest if ambiguous  
   - Prefer deterministic rules with explicit tie‑breakers (cost‑based or priority‑ordered)

4) **Semantic composition**  
   - Convert syntax trees into **CPL‑Intent with holes** (unresolved references, unspecified amounts)
   - Attach provenance to every semantic decision for later explanation (“this adjective mapped to axis=brightness”)

5) **Pragmatic resolution**  
   - Resolve anaphora (“that”, “it”, “again”) using dialogue state + salience  
   - Map conversational defaults (“keep tempo steady”) to explicit constraints  
   - Bind references to CardPlay entities (section markers, track IDs, card IDs)

6) **Typecheck / validation**  
   - Ensure every node is type‑valid (e.g., `preserve(melody, exact)` only applies if there is a melody layer)  
   - Ensure constraints are satisfiable or produce a structured conflict report  
   - Decide whether a clarification question is required

7) **Lowering / planning**  
   - Convert high‑level goals into a plan skeleton (levers, candidate actions)  
   - Call out to theory modules (Prolog) when needed (cadence analysis, key inference, etc.)

8) **Codegen**  
   - Compile the plan to CardPlay host actions and/or state mutations  
   - Generate diffs and rollback instructions

This separation is what keeps a 100K codebase maintainable: each layer can be tested with clear fixtures.

### 4.2 Deterministic parsing strategy: pick a formalism and commit

You need a grammar engine that supports:

- Ambiguity (parse forests)  
- Priorities / costs  
- Attaching semantic actions  
- Incremental extension by adding rules, not rewriting the engine

Two sane approaches:

**Option A: PEG / Packrat parsing (deterministic by construction)**  
- Pros: easy to implement, fast, predictable.  
- Cons: ambiguity is handled by rule ordering, which can hide problems unless you build diagnostics.

**Option B: Earley / GLR with weighted disambiguation (explicit ambiguity)**  
- Pros: you can retain multiple parses and pick best, enabling better clarifications.  
- Cons: more complex engine; performance needs care.

GOFAI Music+ benefits from **explicit ambiguity**, because it can say:

> “I can interpret ‘bring it in earlier’ as (A) earlier in song form or (B) earlier within the bar. Which do you mean?”

So the best long‑term bet is:

- a parsing engine that can return a parse forest plus feature annotations  
- a scoring layer that selects best parse when safe, otherwise triggers clarification

### 4.3 The lexicon is a “canon table”, not a pile of strings

CardPlay already has a culture of canon tables and normalizers (see `to_fix_repo_plan_500.md` and the canon scripts). GOFAI Music+ must follow that same pattern.

Treat every important lexical item as a **typed entry** with:

- `lemma` (surface form)  
- `pos` (part of speech / construction role)  
- `senseId` (stable identifier)  
- `semantics` (what CPL nodes it yields)  
- `selectional restrictions` (what it can modify or apply to)  
- `defaults` (e.g., “tighter” implies groove_tightness increase + microtiming reduction)

Example (conceptual):

```ts
export type LexemeId = `lex:${string}`;

export interface Lexeme {
  readonly id: LexemeId;
  readonly lemma: string;
  readonly variants: readonly string[];
  readonly category: 'verb' | 'adj' | 'noun' | 'prep' | 'det' | 'adv' | 'construction';
  readonly semantics: LexemeSemantics;
  readonly restrictions?: LexemeRestrictions;
}
```

The important discipline is that:

- The *canon* is in one place (SSOT).  
- Every synonym is mapped to a canonical sense.  
- There is a normalizer for user input.  
- There are tests that enforce that every “public” sense is documented.

This is how GOFAI Music+ avoids becoming “a big bag of heuristics.”

### 4.4 Ontology: bind music talk to CardPlay’s world model

Musicians talk about:

- Form (intro/verse/chorus/bridge, “drop”, “breakdown”)  
- Layers (drums/bass/pad/lead/vocal)  
- Roles (melody/countermelody/ostinato)  
- Production parameters (width, brightness, punch)  
- Time (bars, beats, “two bars before last chorus”)

CardPlay already has pieces of the ontology:

- Harmony and theory vocabularies in `cardplay/src/ai/theory/music-spec.ts`  
- Prolog KB files: `cardplay/src/ai/knowledge/music-theory*.pl`  
- Board/deck/card identities and layouts in `cardplay/src/boards/*`

GOFAI Music+ should add an explicit “world entity registry” layer that merges:

1) Static canon vocab (what *can* be referred to)  
2) Dynamic project symbols (what *is* currently present)  

So “that pad” might resolve to:

- a track labeled “Pad”  
- or a specific instrument card labeled “GlassPad”  
- or a set of events tagged with `role:pad`

And the resolver can show its work: “I bound ‘pad’ to track ‘Pad 2’ because it is the only track with role pad.”

### 4.5 Module structure for 100K+ LOC: the clean separation that keeps you sane

A plausible module map that scales beyond 100K LOC looks like this (names are suggestions; the structural separation is the point):

```text
cardplay/src/gofai/
  canon/
    lexemes.ts                 # SSOT lexicon tables (IDs + semantics)
    perceptual-axes.ts         # SSOT axis vocabulary + docs links
    section-vocabulary.ts      # intro/verse/chorus variants + normalizers
    layer-vocabulary.ts        # drums/bass/pad/... + mappings to roles/tags
    edit-opcodes.ts            # SSOT for CPL-Plan action kinds
    units.ts                   # bpm, bars, beats, semitones, etc.
    check.ts                   # canon checks similar to scripts/canon/check.ts

  cpl/
    ast.ts                     # CPL-Intent / CPL-Plan / CPL-Host types
    validate.ts                # typechecking + structural validation
    normalize.ts               # canonicalization helpers
    serialize-json.ts          # stable JSON schema encode/decode
    serialize-prolog.ts        # Prolog term encode/decode (if used)
    pretty.ts                  # user-facing printer ("here's what I understood")

  nl/
    tokenize.ts                # tokenizer + span tracking
    morph.ts                   # inflection normalization (tighten/tighter)
    grammar/
      index.ts                 # grammar registry
      imperative.ts
      coordination.ts
      comparatives.ts
      scope-phrases.ts
      constraints.ts
      time-expressions.ts
      references.ts
      domain-nouns.ts
      domain-adjectives.ts
    parse/
      parser.ts                # engine (Earley/GLR or PEG)
      forest.ts                # parse forest representation
      score.ts                 # disambiguation scoring
      diagnostics.ts           # “why did this parse win?”
    semantics/
      compose.ts               # syntax → CPL with holes
      frames.ts                # verb frames / argument structure
      mappings.ts              # lexeme semantics → CPL nodes
    pragmatics/
      dialogue-state.ts        # what’s salient, last edits, user prefs
      resolve.ts               # bind references to project entities
      ellipsis.ts              # “same but bigger”
      clarification.ts         # question generator + option sets

  planning/
    levers.ts                  # goal axes → lever candidates
    cost-model.ts              # least-change scoring
    planner.ts                 # candidate generation + selection
    validate.ts                # plan validation vs constraints
    explain.ts                 # plan explanations (“why these levers”)

  execution/
    compile-to-host.ts         # CPL-Plan → HostActions + state mutations
    apply.ts                   # apply edit packages to store
    diff.ts                    # event diffs + param diffs + summaries
    undo.ts                    # reversible packages + history

  ui/
    gofai-deck.tsx             # deck UI integration
    plan-preview.tsx
    cpl-viewer.tsx
    diff-viewer.tsx
    clarification-modal.tsx

  tests/
    nl/
      utterance-pairs.test.ts  # English → expected CPL
      paraphrase.test.ts       # paraphrase invariance suites
      ambiguity.test.ts        # ensures clarification triggers
    planning/
      constraint-safety.test.ts
      least-change.test.ts
    execution/
      undo-roundtrip.test.ts
      diff-stability.test.ts
```

This is “100K+ LOC” not because each file is huge, but because each layer needs enough cases to be reliable. A rough LOC allocation:

- `canon/*`: 10K (vocab tables, mappings, docs alignment, checkers)  
- `cpl/*`: 8K (types, validation, serialization)  
- `nl/*`: 45K (grammar rules + parse engine + semantics + pragmatics)  
- `planning/*`: 12K (goal→lever mappings, cost model, planner)  
- `execution/*`: 10K (compilation + diffs + undo)  
- `ui/*`: 8K (deck UI, viewers, interaction logic)  
- `tests/*`: 25K (fixtures, golden tests, regression suites)

Total: ~118K LOC, which is the correct scale for something you want to ship to demanding users.

### 4.6 The key design choice: “typed holes” and explicit clarifications

The parser should be allowed to produce partially specified meaning:

- “make it darker” without specifying whether “dark” means timbre vs harmony vs register  
- “do that again but bigger” without specifying which “that”  
- “bring it in earlier” without specifying macro vs micro‑timing

So CPL‑Intent should allow explicit *unknowns*:

- `CPLHole` nodes with enumerated candidate interpretations  
- Each hole has a rank and a set of clarifying questions  
- When holes remain at “commit time”, the UI forces resolution

This is how you avoid hallucinations while still being fast in a creative workflow. The system can propose defaults, but defaults are explicit and overridable.

### 4.7 Dialogue state: reuse the Advisor pattern, but extend it

CardPlay already has a conversation manager in `cardplay/src/ai/advisor/conversation-manager.ts`. GOFAI Music+ needs a similar concept, but with richer “edit referents”:

- last focused section / bar range  
- last edited layer(s)  
- last edit package (for “undo that”, “do that again”)  
- user preferences about vague terms (“dark usually means timbre+register for me”)

This can be implemented as a GOFAI‑specific dialogue state module, but it should mirror the Advisor’s persistence and bookmarking features because those are useful in real sessions: the user will want to bookmark “the chorus widening plan we liked.”

---

## 5) Planning and Execution: From CPL‑Intent to Verified CardPlay Edits

The planner is the “compiler backend”: it turns meaning into actions. A GOFAI system lives or dies by the planner’s discipline. In music, it is easy to do *something*; it is hard to do the *right* thing under constraints with minimal change.

### 5.1 Planning as constrained optimization

Represent a request as:

- scope S (what can change)  
- goals G (what should increase/decrease)  
- constraints C (what must not change)  
- preferences P (soft constraints / style)

Then planning is:

1) Generate candidate edit packages (bounded sequences of actions)  
2) Validate against constraints (hard fail if violated)  
3) Score by goal satisfaction and edit cost  
4) Select top option(s) and present if multiple are close

This is not “AI magic”; it is a deterministic search over a bounded action library.

### 5.2 The bounded action library: “world steps” become CardPlay mutations

`gofaimusic.md` calls these “world steps.” In CardPlay terms, they lower to two main families:

1) **Event‑level operations** (pure data transforms)  
   - shift timing  
   - quantize strength adjustments  
   - density thinning/densifying  
   - register shifting  
   - duplication, insertion, deletion over ranges

2) **Card graph operations** (tooling changes)  
   - set card params  
   - insert a new card (e.g., add a pad generator)  
   - add/remove a DSP card in the chain  
   - route signals differently (where safe)

The action library should have explicit preconditions and postconditions, like compiler rewrites:

- `halve_time(drums, range)` requires a drum layer present and a meter context.  
- `preserve(melody, exact)` requires a melody selector and a diff check.  
- `widen(section)` requires either (a) production layer enabled or (b) orchestration‑based widening strategy.

### 5.3 Constraint enforcement is a post‑edit diff, not wishful thinking

To enforce “keep melody exact,” you do not rely on the planner’s intent. You compute a diff:

- Identify the event set that constitutes the melody (selector)  
- Before/after compare pitch/rhythm depending on “exact vs recognizable” mode  
- Fail the plan if violated (or offer an override with explicit warning)

CardPlay already has solid primitives for event manipulation and serialization. GOFAI Music+ adds:

- stable selectors  
- diff reports that can be rendered in UI  
- invariants as executable checks

### 5.4 Using Prolog where it’s strongest: theory queries and pattern knowledge

CardPlay’s Prolog KB is a superpower, but it should be used for what Prolog is good at:

- theory inference (key, mode, cadence detection)  
- symbolic pattern knowledge (schema recognition, constraint suggestions)  
- rule‑based planning hints (“for ‘hopeful’, prefer raised register + brighter voicings”)

Do **not** use Prolog as the English parser. Use it as the theory brain and action recommender, with typed wrappers.

### 5.5 The execution layer must speak “Undo”

If GOFAI Music+ is not reversible, it is not usable. The execution layer should:

- package every set of mutations into an `EditPackage`  
- store a stable ID, timestamp, and summary  
- support “preview apply” (apply to a forked state)  
- support rollback by applying inverse patches or restoring snapshots

CardPlay’s central store already implies undo/redo. GOFAI Music+ should integrate by emitting store actions that are recorded in the same undo stack, and by generating a high‑level edit history that maps undo steps to user intent.

---

## 6) What It Would Look Like Inside CardPlay (Boards, Decks, Cards, UX)

GOFAI Music+ should feel like a *board* and also like a *tool*:

- A dedicated GOFAI board for “language‑to‑edit workflows”  
- A GOFAI deck that can be enabled in collaborative/directed boards

### 6.1 The GOFAI Board (a concrete proposal)

Create a new built‑in board, e.g.:

- `id`: `gofai-music`  
- `controlLevel`: `collaborative` (by default)  
- `primaryView`: depends on current focus (arrangement, tracker, etc.)

Layout sketch (using panel roles from `cardplay/src/boards/types.ts`):

- Left panel: **conversation + bookmarks** (GOFAI history)  
- Center panel: **current editor** (tracker/arrangement/notation depending on focus)  
- Right panel: **CPL viewer + plan preview + diff**  
- Bottom panel: transport + quick apply/undo

Deck placement should use `BoardDeck.panelId` so the existing `assignDecksToPanels()` logic routes everything deterministically.

### 6.2 The GOFAI Deck: the 3-pane “Compiler UI”

The deck itself should have three stable tabs/panes:

1) **English**  
   - text input (single line + multiline)  
   - command templates (chips)  
   - quick references to current focus (“chorus 2”, “bars 33–40”)

2) **Meaning (CPL)**  
   - the normalized/typed logical form  
   - clickable scopes that highlight affected events/tracks  
   - holes/ambiguities surfaced as “needs resolution”

3) **Plan / Diff**  
   - action sequence with explanations  
   - preview diffs (events changed, cards changed, params changed)  
   - apply + undo controls

This is the “compiler transparency” that distinguishes GOFAI from chat.

### 6.3 How GOFAI Music+ interacts with existing decks and tools

This is where integration gets real. Examples:

- **Pattern deck**: “Make the hats more syncopated” → edit only note events tagged hats in the current pattern.  
- **Arrangement deck**: “Cut drums for two bars before the last chorus” → find last chorus marker, compute range, delete drum events in range.  
- **Harmony deck**: “Make the bridge more tense” → add tension devices / chord substitutions under constraints; might consult Prolog for cadence options.  
- **DSP chain deck**: “Bring the bass forward and tighten it” → increase bass gain/compression params (if present), plus microtiming/humanize changes.

The key is that GOFAI Music+ is not a separate world. It is a compiler that emits mutations to the same project state those decks already edit.

### 6.4 Cards: GOFAI as a first-class card pack (optional but powerful)

CardPlay’s “cards as transformations” philosophy suggests an architectural move:

- Implement the GOFAI compiler as a “card pack” whose core is a `GofaiCompilerCard`.

This card could conceptually accept:

- input: a stream of “instruction events” (`Event<TextPayload>` or `Event<CPLRequest>`)  
- output: a stream of “plan events” or “host action events”

Even if you don’t literally route text through the audio graph, this framing helps the architecture:

- The compiler is a typed module with a signature.  
- It composes with other “advisor cards.”  
- It can be gated and placed like any other tool.

---

## 7) The 500-Step Integration Plan (Radical, Systematic, CardPlay-Native)

This section is intentionally written in the style of `to_fix_repo_plan_500.md`: systematic changes, canon discipline, and explicit module targets. The numbering is not “project management theatre”; it is a concrete map of what needs to exist before GOFAI Music+ can be trusted.

You can think of these as five parallel workstreams:

1) **Canon vocab + types** (make meaning stable)  
2) **Parser frontend** (English → CPL)  
3) **Planner backend** (CPL → plans)  
4) **Execution + diffs + undo** (plans → safe edits)  
5) **Board/Deck UI + gating** (make it usable in CardPlay)

Below, “Change NNN” is a deliverable that should result in code + tests + docs alignment.

### Phase 0 — Canon & Foundations (Changes 001–050)

- [ ] Change 001 — Add `cardplay/src/gofai/` top-level module folder with barrel exports.
- [ ] Change 002 — Add `cardplay/src/gofai/canon/perceptual-axes.ts` with SSOT axis vocabulary + doc links.
- [ ] Change 003 — Add `cardplay/src/gofai/canon/section-vocabulary.ts` with intro/verse/chorus variants + normalizers.
- [ ] Change 004 — Add `cardplay/src/gofai/canon/layer-vocabulary.ts` mapping “drums/hats/kick” → role tags/selectors.
- [ ] Change 005 — Add `cardplay/src/gofai/canon/units.ts` for bpm/bars/beats/semitones parsing + formatting.
- [ ] Change 006 — Add `cardplay/src/gofai/canon/edit-opcodes.ts` enumerating CPL-Plan action kinds.
- [ ] Change 007 — Add `cardplay/src/gofai/canon/lexemes.ts` as SSOT lexicon entry table (small seed set).
- [ ] Change 008 — Add `cardplay/src/gofai/canon/normalize.ts` exporting all normalizers in one place.
- [ ] Change 009 — Add `cardplay/src/gofai/canon/check.ts` that validates canon tables are internally consistent.
- [ ] Change 010 — Wire `npm run gofai:check` to run canon checks and core validations.
- [ ] Change 011 — Add `cardplay/src/gofai/cpl/ast.ts` defining CPL-Intent/CPL-Plan/CPL-Host types.
- [ ] Change 012 — Add `cardplay/src/gofai/cpl/validate.ts` (structural validation + type guards).
- [ ] Change 013 — Add `cardplay/src/gofai/cpl/pretty.ts` to print CPL in user-friendly form.
- [ ] Change 014 — Add `cardplay/src/gofai/cpl/serialize-json.ts` stable JSON encode/decode with versioning.
- [ ] Change 015 — Add `cardplay/src/gofai/cpl/schema-version.ts` and adopt canon serialization rules.
- [ ] Change 016 — Add `cardplay/src/gofai/tests/canon/gofai-canon.test.ts` ensuring vocab tables don’t drift.
- [ ] Change 017 — Add `cardplay/src/gofai/tests/cpl/roundtrip-json.test.ts` to guarantee CPL JSON roundtrips.
- [ ] Change 018 — Add `cardplay/src/gofai/tests/cpl/pretty-snapshots.test.ts` for stable CPL printing.
- [ ] Change 019 — Add `cardplay/docs/gofai/index.md` as SSOT docs entry (what GOFAI is in CardPlay).
- [ ] Change 020 — Add `cardplay/docs/gofai/cpl.md` documenting CPL types, goals, constraints, scopes.
- [ ] Change 021 — Add `cardplay/docs/gofai/perceptual-axes.md` mapping axes to levers + examples.
- [ ] Change 022 — Add `cardplay/docs/gofai/clarification.md` documenting ambiguity strategy + UI behavior.
- [ ] Change 023 — Add `cardplay/docs/gofai/security.md` documenting offline guarantees + asset boundaries.
- [ ] Change 024 — Add `cardplay/docs/gofai/testing.md` describing golden tests and paraphrase invariance.
- [ ] Change 025 — Add `cardplay/src/gofai/nl/tokenize.ts` with span-tracking tokenizer.
- [ ] Change 026 — Add `cardplay/src/gofai/nl/morph.ts` for inflection handling (comparatives, verb forms).
- [ ] Change 027 — Add `cardplay/src/gofai/nl/parse/parser.ts` placeholder interface (engine-agnostic).
- [ ] Change 028 — Add `cardplay/src/gofai/nl/parse/forest.ts` parse forest representation.
- [ ] Change 029 — Add `cardplay/src/gofai/nl/parse/score.ts` scoring API for disambiguation.
- [ ] Change 030 — Add `cardplay/src/gofai/nl/parse/diagnostics.ts` explaining parse choices.
- [ ] Change 031 — Add `cardplay/src/gofai/nl/grammar/index.ts` grammar registry + rule IDs.
- [ ] Change 032 — Add first grammar module `imperative.ts` for basic “make X Y” patterns.
- [ ] Change 033 — Add grammar module `coordination.ts` for “X and Y” goal conjunction.
- [ ] Change 034 — Add grammar module `comparatives.ts` for “more/less” axis adjustments.
- [ ] Change 035 — Add grammar module `scope-phrases.ts` for “in the chorus”, “for two bars”.
- [ ] Change 036 — Add grammar module `constraints.ts` for “keep”, “don’t change”, “only”.
- [ ] Change 037 — Add grammar module `time-expressions.ts` for bars/beats and relative phrases.
- [ ] Change 038 — Add grammar module `references.ts` for pronouns and demonstratives (“that”, “it”).
- [ ] Change 039 — Add `cardplay/src/gofai/nl/semantics/compose.ts` syntax → CPL with holes.
- [ ] Change 040 — Add `cardplay/src/gofai/nl/semantics/frames.ts` verb argument frames + selection rules.
- [ ] Change 041 — Add `cardplay/src/gofai/nl/pragmatics/dialogue-state.ts` minimal dialogue state store.
- [ ] Change 042 — Add `cardplay/src/gofai/nl/pragmatics/resolve.ts` project symbol binding interface.
- [ ] Change 043 — Add `cardplay/src/gofai/nl/pragmatics/clarification.ts` question generator interface.
- [ ] Change 044 — Add `cardplay/src/gofai/planning/levers.ts` axis→lever mapping table (seed).
- [ ] Change 045 — Add `cardplay/src/gofai/planning/cost-model.ts` least-change scoring (seed).
- [ ] Change 046 — Add `cardplay/src/gofai/planning/planner.ts` minimal planner stub (one-step plans).
- [ ] Change 047 — Add `cardplay/src/gofai/execution/diff.ts` diff model skeleton (events + params).
- [ ] Change 048 — Add `cardplay/src/gofai/execution/undo.ts` edit package identity + storage skeleton.
- [ ] Change 049 — Add `cardplay/src/gofai/execution/apply.ts` apply/rollback interface.
- [ ] Change 050 — Add `cardplay/src/gofai/ui/` skeleton components for deck, CPL viewer, diff viewer.

### Phase 1 — CPL Semantics + Typechecking (Changes 051–100)

- [ ] Change 051 — Define `CPLHole` and hole-resolution protocol in `cpl/ast.ts`.
- [ ] Change 052 — Implement CPL structural validator that rejects unknown axis/opcodes.
- [ ] Change 053 — Add `cpl/normalize.ts` to canonicalize amounts, axes, and scope defaults.
- [ ] Change 054 — Implement `CPLScope` resolver that can bind to sections, layers, cards, selections.
- [ ] Change 055 — Add branded ID types for GOFAI entities (SectionRefId, LayerRefId) mirroring DeckId style.
- [ ] Change 056 — Add a project “symbol table” builder that indexes tracks/cards/sections by names.
- [ ] Change 057 — Add section marker extraction utility (from arrangement markers / timeline state).
- [ ] Change 058 — Add layer-role inference utility (drums/bass/etc) using tags + heuristics.
- [ ] Change 059 — Add `CPLPerceptualAxis` canon map and expose `normalizeAxis()`.
- [ ] Change 060 — Add `CPLAmount` parsing (tiny/small/moderate/large/extreme + numeric forms).
- [ ] Change 061 — Implement constraint nodes that map directly to `MusicSpec` constraints when possible.
- [ ] Change 062 — Add explicit `preserve(melody, exact|recognizable)` semantics with selector binding.
- [ ] Change 063 — Add `only_change([layers...])` enforcement semantics (scope narrowing).
- [ ] Change 064 — Add temporal constraint semantics (“keep tempo steady”) → `ConstraintTempo`.
- [ ] Change 065 — Add meter/key reference parsing that aligns with `RootName`/`ModeName` canon.
- [ ] Change 066 — Add “negative commands” parsing (“don’t add drums”, “no hats”).
- [ ] Change 067 — Add “do X but keep Y” contrast construction parsing.
- [ ] Change 068 — Add explicit “same as before” / “do that again” reference semantics.
- [ ] Change 069 — Add clarification trigger for unresolved referents (“that chorus”) without salience.
- [ ] Change 070 — Add clarification trigger for ambiguous axis words (“dark”, “bigger”, “earlier”).
- [ ] Change 071 — Add disambiguation scoring: prefer explicit scopes over implicit scopes.
- [ ] Change 072 — Add disambiguation scoring: prefer last-focused section for pronoun “it”.
- [ ] Change 073 — Add disambiguation scoring: prefer minimal action count for same goal.
- [ ] Change 074 — Add `nl/tests/utterance-pairs` with 50 core English→CPL examples.
- [ ] Change 075 — Add paraphrase suite for the 50 core examples (at least 3 paraphrases each).
- [ ] Change 076 — Add ambiguity suite ensuring clarifications occur for known ambiguous utterances.
- [ ] Change 077 — Add “scope default rules” doc and test (focus section, then selection, then global).
- [ ] Change 078 — Add “amount default rules” doc and test (moderate unless user specifies).
- [ ] Change 079 — Implement `CPLQuery` nodes for inspection (“show chords in chorus”).
- [ ] Change 080 — Implement inspection compilation into read-only queries (no mutation).
- [ ] Change 081 — Add `CPLExplainTarget` nodes (“why did you do that?”).
- [ ] Change 082 — Add `CPLUndoTarget` nodes (“undo the last chorus change”).
- [ ] Change 083 — Add dialogue memory: store CPL + plan + diff per turn for reference.
- [ ] Change 084 — Integrate with Advisor-like bookmarking model (save favorite plans).
- [ ] Change 085 — Add canonical serialization for edit packages so sessions can be restored.
- [ ] Change 086 — Add schema migration rules for CPL JSON (version bump support).
- [ ] Change 087 — Add type-level “capabilities” flags (production layer enabled, routing editable, etc.).
- [ ] Change 088 — Add constraint for “no new layers” preference.
- [ ] Change 089 — Add constraint for “no new chords” vs “functional harmony preserved” distinction.
- [ ] Change 090 — Add constraint for vocal range (pitch bounds) enforcement.
- [ ] Change 091 — Add constraint for “keep rhythm” enforcement (timing diff checks).
- [ ] Change 092 — Add constraint conflict reporter (structured explanation for unsatisfiable sets).
- [ ] Change 093 — Add UI component to display conflict reports and suggest relaxations.
- [ ] Change 094 — Add UI component for clarification questions with default suggestions.
- [ ] Change 095 — Add canonical mapping: CPL constraints → `MusicSpec` constraints when possible.
- [ ] Change 096 — Add canonical mapping: `MusicSpec` constraints → CPL constraints for explanation.
- [ ] Change 097 — Add “CPL pretty printer” rules for stable, readable logical form display.
- [ ] Change 098 — Add snapshot tests for pretty printing of 200+ CPL examples.
- [ ] Change 099 — Add `gofai:check` integration into `npm run check` so drift blocks merges.
- [ ] Change 100 — Add `cardplay/docs/gofai/roadmap.md` linking to this 500-change plan.

### Phase 2 — Infinite Extensibility (Cards / Decks / Boards / Prolog) (Changes 101–150)

This phase is the “CardPlay principle applied to GOFAI”: **extensibility at the edges**. The goal is that a third‑party can introduce new musical concepts and new tooling, and the English→CPL compiler can learn to talk about them *without* forking core.

- [ ] Change 101 — Define a `GofaiExtensionId` alias that is a `CardPlayId` and require namespaced IDs for non-core GOFAI extensions.
- [ ] Change 102 — Add `cardplay/src/gofai/extensions/types.ts` defining the stable plugin interface (`registerLexicon`, `registerBindings`, `registerPlanner`, `registerProlog`).
- [ ] Change 103 — Add `cardplay/src/gofai/extensions/registry.ts` that can register/unregister GOFAI extensions at runtime (mirrors BoardRegistry listener pattern).
- [ ] Change 104 — Add `cardplay/src/gofai/extensions/capabilities.ts` describing extension capabilities (adds opcodes, adds constraints, adds Prolog KB, adds UI).
- [ ] Change 105 — Add security policy: extensions can *propose* plans but execution requires board policy and user confirmation in low-control contexts.
- [ ] Change 106 — Implement “namespaced semantics”: any lexeme/opcode/constraint from an extension carries `namespace:` and is printed that way in CPL.
- [ ] Change 107 — Add `cardplay/src/gofai/extensions/compat.ts` version negotiation between CPL schema and extension schema.
- [ ] Change 108 — Add “auto-discovery” hook: when a CardPlay pack loads, attempt to load its GOFAI extension module if present.
- [ ] Change 109 — Extend `cardplay/src/user-cards/manifest.ts` docs (and optionally schema) to allow a `gofai` block (lexemes, prolog programs, bindings).
- [ ] Change 110 — Add `cardplay/docs/gofai/extensions.md` specifying extension format, namespacing rules, and compatibility guarantees.

- [ ] Change 111 — Add `cardplay/src/gofai/extensions/auto-bind-cards.ts` that turns CardRegistry entries into baseline lexicon entries (“add <CardName>”, “set <param>”).
- [ ] Change 112 — Add `cardplay/src/gofai/extensions/auto-bind-boards.ts` that turns BoardRegistry entries into board-referent lexicon entries (“switch to <BoardName>”).
- [ ] Change 113 — Add `cardplay/src/gofai/extensions/auto-bind-decks.ts` that exposes builtin + namespaced deck types and their display names (“open the waveform editor deck”).
- [ ] Change 114 — Add a “symbol table” merge step that includes extension-contributed entities alongside project entities (cards/tracks/sections).
- [ ] Change 115 — Add “entity alias resolution” for extension IDs using `getDisplayName()` from `cardplay/src/canon/cardplay-id.ts`.

- [ ] Change 116 — Add `cardplay/src/gofai/extensions/card-meta-gofai.ts` defining optional GOFAI annotations on CardMeta (synonyms, roles, params semantics).
- [ ] Change 117 — Add `cardplay/src/gofai/extensions/board-meta-gofai.ts` defining optional GOFAI annotations on Board definitions (workflow verbs, deck semantics, preferred scopes).
- [ ] Change 118 — Add `cardplay/src/gofai/extensions/deck-meta-gofai.ts` defining optional GOFAI annotations on deck templates (what “the deck” means, common queries/edits).
- [ ] Change 119 — Implement a “fallback to meta”: if no GOFAI annotations exist, use `{id, name, description, tags}` to produce minimal language bindings.
- [ ] Change 120 — Add tests ensuring auto-bound cards/boards produce deterministic lexicon entries (stable sorting, stable IDs).

- [ ] Change 121 — Define an extension “constraint schema” for namespaced constraints so the parser can typecheck and pretty-print unknown-but-declared constraints.
- [ ] Change 122 — Add `cardplay/src/gofai/extensions/constraint-bindings.ts` mapping declared constraint schemas → CPL constraint nodes.
- [ ] Change 123 — Add UI rendering for unknown constraint namespaces (“extension:my-pack constraint foo(bar=…)”).
- [ ] Change 124 — Add `gofai:check` rule: extension-contributed constraints must be namespaced and documented.

- [ ] Change 125 — Add `cardplay/src/gofai/extensions/prolog-programs.ts` allowing extensions to register Prolog source strings and module names.
- [ ] Change 126 — Add `cardplay/src/gofai/extensions/prolog-introspection.ts` defining a convention for exporting vocab from Prolog (e.g., `gofai_vocab/3`).
- [ ] Change 127 — Add loader that consults extension Prolog programs into `PrologAdapter` on registration.
- [ ] Change 128 — Add a “vocab import” path that can pull canonicalized terms (modes/scales/devices) from Prolog into the GOFAI lexicon at startup.
- [ ] Change 129 — Add tests that Prolog-exported vocab integrates into normalization (e.g., new mode names parse correctly).
- [ ] Change 130 — Add tests that extension Prolog modules do not break core KB (consult order + module naming).

- [ ] Change 131 — Define `CPLPlanOpcode` namespacing rules (builtin opcodes un-namespaced; extension opcodes namespaced).
- [ ] Change 132 — Add `cardplay/src/gofai/extensions/opcode-registry.ts` that registers opcode handlers (planner lowering + execution compilation).
- [ ] Change 133 — Add execution sandboxing: extension opcode handlers must be pure (plan → host actions), with runtime mutation performed only by core executors.
- [ ] Change 134 — Add cost-model hooks: extensions can contribute additional costs/heuristics but cannot override core safety constraints.
- [ ] Change 135 — Add “unknown opcode” behavior: show plan step but require explicit user selection of a handler (or refuse).

- [ ] Change 136 — Add a “language pack builder” script that can generate a starter GOFAI extension module from a card pack manifest (card names, params, tags).
- [ ] Change 137 — Add a “lexeme coverage report” script to show which cards/decks/boards lack usable language bindings.
- [ ] Change 138 — Add a “paraphrase invariance” harness that can be run per extension namespace.
- [ ] Change 139 — Add a “golden diff” harness that runs a battery of plans against fixtures and asserts constraints are preserved.
- [ ] Change 140 — Add docs: “How to ship a GOFAI-enabled pack” with a minimal working example.

- [ ] Change 141 — Integrate GOFAI extension registry with BoardRegistry listener events so board additions update language references immediately.
- [ ] Change 142 — Integrate GOFAI extension registry with CardRegistry (register/unregister) so card additions update language references immediately.
- [ ] Change 143 — Add “hot reload” dev path for GOFAI extensions (rebuild lexicon + invalidate parse cache).
- [ ] Change 144 — Add parse-cache invalidation keyed by extension registry version.
- [ ] Change 145 — Add UI indicator showing which namespaces contributed to a plan (core vs extensions).

- [ ] Change 146 — Add policy: if board control level is `full-manual`, GOFAI can parse + explain but not execute plans without explicit “apply” actions.
- [ ] Change 147 — Add policy: if an extension is untrusted, allow parsing and CPL display but disable execution of its opcodes by default.
- [ ] Change 148 — Add “capability prompts” so the user can approve enabling an extension’s execution hooks (local-only, no network).
- [ ] Change 149 — Add audit log that records extension namespace + version for every applied edit package.
- [ ] Change 150 — Add migration strategy: when an extension updates, preserve old CPL/plan serialization by storing extension namespace+version in the edit history.


## 0) TL;DR

- CardPlay already has the right substrate: **typed events**, **typed cards**, **boards that gate AI tools**, and a **Prolog reasoning layer** (`cardplay/src/ai/engine/prolog-adapter.ts`, `cardplay/src/ai/knowledge/*.pl`, `cardplay/src/ai/theory/music-spec.ts`).  
- GOFAI Music+ is a new pipeline in that substrate:  
  **English → (typed) Musical Logic → (typed) EditPlan → CardPlay state mutations + HostActions → diffs + undo**.  
- The “compiler” should be treated like a first‑class engine in CardPlay, with the same discipline as the canon IDs / constraint types work: **SSOT vocabulary, validators, migrations, tests that block drift**.  
- The parser is big because coverage is big: a practical, musician‑natural sublanguage with dialogue context, anaphora (“that chorus”), comparisons (“more lift”), and constraint semantics (“keep the melody exact”). A 100K+ codebase is not indulgence; it is the **price of reliability**.

---

## 1) CardPlay as the Host Runtime: What We’re Building On

Before adding anything, it matters that CardPlay is *already* a typed music system, not just a UI:

### 1.1 The project world is already structured

CardPlay’s fundamental object is a time‑anchored, strongly typed event:

- `Event<P>` in `cardplay/src/types/event.ts`  
- A global tick grid (PPQ) via `cardplay/src/types/primitives.ts` and related types  
- Stream/container abstractions (patterns, clips, scenes, etc.)

That means GOFAI Music+ doesn’t need to invent a “song model” from scratch. It needs to:

1) **Reference** existing state (sections, patterns, tracks, lanes, cards)  
2) **Compute diffs** between states  
3) Apply **validated operations** (shift, quantize, split, remove, insert) using already‑existing utilities (e.g., `cardplay/src/events/operations.ts`)

### 1.2 Cards already represent musical transformations

CardPlay’s “cards are typed morphisms” philosophy is the perfect conceptual container for GOFAI:

- Cards take an input stream type and output stream type (`Card<I,O>` conceptually; concrete system is more complex but aligned).
- Cards already have parameters, state, and (critically) **identity** (cardId) that can be mutated via host actions.

This is key: a natural language instruction like “make the drums tighter” often translates into:

- event transformations (quantize/humanize adjustments) **and/or**
- parameter changes on specific cards (e.g., groove strength, swing amount, transient shaping)

GOFAI Music+ shouldn’t be a separate “music editor”. It should be a compiler that can emit:

- **Event edits** (deterministic transformations)
- **Card parameter edits** (`set_param`)
- **Card graph edits** (add/remove/move cards)
- **Board/deck changes** (bring required tools into view, switch boards)

### 1.3 There is already an AI reasoning + HostAction bridge

CardPlay already encodes an important pattern:

- Prolog produces recommendations/actions.
- TypeScript parses and validates them.
- The host executes them in a controlled way.

Concretely, there are multiple “action vocabulary” layers already in the repo:

- Prolog engine wrapper: `cardplay/src/ai/engine/prolog-adapter.ts` defines a minimal `HostAction` representation and term conversion utilities.
- Theory/action mapping: `cardplay/src/ai/theory/host-actions.ts` defines a richer, user‑facing `HostAction` discriminated union with `confidence` and `reasons` and parsers for Prolog term shapes.
- Canon wire format: the repo has canon utilities for validating/serializing action envelopes (see references in `prolog-adapter.ts`).

GOFAI Music+ should **not** invent a parallel “action language”. It should:

1) Produce a *typed* intermediate form (Musical Logic / EditPlan) that is stable under paraphrase.  
2) Compile that into the **existing HostAction / state‑mutation machinery** (with extensions where required).  
3) Reuse the same canon discipline: single‑source vocabularies + normalizers + tests that lock them.

### 1.4 The Board System is already a gating and workflow router

The Board system’s types (see `cardplay/src/boards/types.ts`) already encode the “AI is optional” philosophy through:

- `ControlLevel` (full manual → generative)  
- `CompositionToolConfig` (tools can be hidden, browse‑only, auto‑apply, etc.)  
- Deck and panel layouts (where things live, and what’s visible)

This matters because GOFAI Music+ is powerful enough to be disruptive if un‑gated. You should not drop a language compiler into a “full manual” board by default. Instead:

- It should be *available as a board* (a dedicated workflow).  
- And *available as a deck/tool* only where the board’s control policy allows it.

The existing layout pipeline (e.g., `cardplay/src/boards/layout/assign-decks-to-panels.ts`) is precisely the sort of deterministic infrastructure we want: declarative board definitions → stable runtime placement. GOFAI Music+ should plug in the same way: add a deck type, define its default `panelId`, and let the layout system route it.

---

## 2) The GOFAI Music+ Contract: Inputs, Outputs, Guarantees

Think of GOFAI Music+ as a compiler toolchain that lives inside CardPlay:

```text
User English
  ↓
Tokenize / normalize (canon vocab)
  ↓
Parse → syntactic structure
  ↓
Compose semantics → Musical Logic (typed intent w/ holes)
  ↓
Pragmatics → resolve references + dialogue context
  ↓
Typecheck + constraint validation (fail/ask if needed)
  ↓
Plan → EditPlan (bounded sequence of edits + justifications)
  ↓
Compile → CardPlay mutations (events/cards/boards) + HostActions
  ↓
Execute → new project state
  ↓
Explain → human summary + machine diff + undo package
```

### 2.1 Hard guarantees (the “trust surface”)

GOFAI Music+ must be trusted the way a compiler is trusted:

1) **No silent guessing about ambiguity.**  
   If a phrase can map to multiple formal meanings with materially different edits, the system asks a clarification question or presents explicit options.

2) **Constraints are executable, not decorative.**  
   “Keep the melody exact” should be validated against actual events; “only change drums” should be enforced by the edit planner; violations should be impossible without a user‑acknowledged override.

3) **Edits are bounded and reversible.**  
   Every plan produces an `EditPackage` with a stable undo identity; the system should support “apply”, “preview”, “rollback”, and “reapply”.

4) **Stable semantics under paraphrase.**  
   The same intent phrased in different ways should compile to the same Musical Logic (or the same clarification). This is the semantic reliability goal from `gofaimusic.md`, but made operational.

5) **Local and deterministic.**  
   Runtime parsing/planning does not depend on cloud calls. (LLMs may be used as *authoring tools* for grammar/lexicon expansion, but shipping artifacts are symbolic and tested.)

### 2.2 Soft guarantees (the “product feel”)

These are not strictly necessary for safety, but they drive adoption:

- **Least‑change defaults.** If a goal can be satisfied by revoicing instead of reharmonizing, it should prefer the smaller edit unless the user asks for larger changes.
- **Explainable lever mapping.** “More lift” should map to a known set of musical levers and the system should say which it used (register, voicing brightness, density, etc.).
- **Board‑native UX.** The experience should feel like CardPlay (decks/panels/cards), not like an embedded chat widget.

---

## 3) Musical Logic (Typed) Inspired by CardPlay’s Type System

CardPlay’s core type trick is parametric payloads (`Event<P>`) and discriminated unions with canonical vocabularies (`MusicSpec` constraints). GOFAI Music+ should mirror that discipline.

### 3.1 Name it: CPL (CardPlay Logic) or MUS‑LF+?

`gofaimusic.md` uses “MUS‑LF” as a conceptual name. For CardPlay integration, treat the type system as a *product surface*, not a research artifact. I’d use:

- **CPL** = *CardPlay Logic* (typed logical form for user intent + edits)  
  and expose it as a stable JSON schema + TS types.

If you prefer MUS‑LF as a public term, then:

- MUS‑LF+ = MUS‑LF with explicit CardPlay bindings (IDs, event ranges, card params, decks/boards)

In this document I’ll write “CPL” to mean “the typed logical form.”

### 3.2 The three layers of meaning

To stay sane at 100K LOC, don’t make one monolithic AST. Use three layers:

1) **CPL‑Intent**: what the user meant in general musical terms  
   (goals, constraints, scope, references, discourse)

2) **CPL‑Plan**: a validated, tool‑executable plan  
   (a sequence of domain actions: thin texture, shift groove, add layer)

3) **CPL‑Host**: CardPlay‑specific commands  
   (event edits, card param changes, add/remove cards, set `MusicSpec` constraints, switch boards, etc.)

This is exactly the “typed intermediate representation” philosophy from compilers, and it mirrors CardPlay’s existing separation:

- `MusicSpec` (intent constraints)  
- Prolog queries / recommendations  
- Host actions / concrete mutations

### 3.3 Typed scope is everything

Most failures in “language to edit” come from scope errors:

- “Make the chorus brighter” → which chorus? all choruses? current chorus? last chorus?  
- “Cut the drums” → which drum layer? which track? all percussive events?  
- “Bring it in earlier” → earlier in the song or earlier within each bar?

So: scope must be first‑class and typed. CardPlay already has branded IDs (e.g., `DeckId`, `PanelId` in `cardplay/src/boards/types.ts`). GOFAI Music+ should use the same pattern for entity references:

- `SectionRef` (intro/verse/chorus, numbered or labeled)
- `RangeRef` (bars 33–40, last 2 bars before last chorus, etc.)
- `LayerRef` / `TrackRef` (drums, bass, pad, lead, voice)
- `CardRef` (specific instrument/effect cards by cardId)
- `EventSelector` (by kind, tags, pitch range, role tags)

The key “CardPlay‑inspired” insight is: **scope is a selector over `Event<P>` streams + card graphs**, and selectors can be typed and validated.

### 3.4 CPL is typed like CardPlay: discriminated unions + canonical vocab

The most CardPlay‑native approach is to make CPL a discriminated union family similar to `MusicSpec` constraints:

- Every node has `type: '...'`  
- Vocabularies are centralized (canon)  
- There are normalizers (`normalizeX`)  
- There are validation functions and test suites

Here is a sketch (illustrative, not final):

```ts
// "CPL Intent" (user meaning) ------------------------------------------------

export type CPLRequest =
  | { type: 'change'; scope: CPLScope; goals: CPLGoal[]; constraints: CPLConstraint[]; prefs?: CPLPreference[] }
  | { type: 'inspect'; scope: CPLScope; query: CPLQuery }
  | { type: 'undo'; target?: CPLUndoTarget }
  | { type: 'redo'; target?: CPLUndoTarget }
  | { type: 'explain'; target: CPLExplainTarget };

export type CPLScope =
  | { type: 'section'; section: CPLSectionRef; range?: CPLRangeRef }
  | { type: 'global'; range?: CPLRangeRef }
  | { type: 'layer'; layer: CPLLayerRef; within?: CPLScope }
  | { type: 'card'; cardId: string; within?: CPLScope }
  | { type: 'selection'; selector: CPLEventSelector };

export type CPLGoal =
  | { type: 'increase'; axis: CPLPerceptualAxis; amount: CPLAmount }
  | { type: 'decrease'; axis: CPLPerceptualAxis; amount: CPLAmount }
  | { type: 'set'; axis: CPLPerceptualAxis; target: CPLAxisValue }
  | { type: 'introduce'; thing: CPLIntroducible; amount?: CPLAmount }
  | { type: 'remove'; thing: CPLRemovable; amount?: CPLAmount };

export type CPLConstraint =
  | { type: 'preserve'; target: CPLPreservable; mode: 'exact' | 'functional' | 'recognizable'; hard: boolean }
  | { type: 'only_change'; targets: CPLChangeTarget[]; hard: boolean }
  | { type: 'tempo'; bpm: number; tolerance?: number; hard: boolean }
  | { type: 'meter'; numerator: number; denominator: number; hard: boolean }
  | { type: 'range_limit'; voice: CPLLayerRef; midiMin: number; midiMax: number; hard: boolean };
```

Notice the parallels:

- `hard` vs weighted preferences matches `MusicSpec` constraint pattern.
- “Perceptual axes” can reuse vocabulary already implied in `music-spec.ts` (`DensityLevel`, tension devices, register models, etc.).
- Scopes select parts of the project the same way a board selects tools: explicit, typed, validated.

### 3.5 The typed “Perceptual Axes” bridge (goals → levers)

The phrase “make it feel more hopeful” is not a single operation; it’s an **optimization target**. GOFAI Music+ needs a stable internal vocabulary of perceptual axes that are:

1) Interpretable by users (in explanations)  
2) Mappable to concrete musical levers (in planning)  
3) Measurable or at least proxy‑scorable (for plan selection)

CardPlay already has the beginnings of this vocabulary in theory types:

- `DensityLevel`, `HarmonicRhythmLevel`, `TensionDevice`, `RegisterModel`, etc. in `cardplay/src/ai/theory/music-spec.ts`.

GOFAI Music+ should define a canon set such as:

- `energy`, `impact`, `lift`, `brightness`, `width`, `intimacy`, `tension`, `release`, `groove_tightness`, `busyness`, `simplicity`, `warmth`, `darkness`, `motion`, `stability`

Then define lever mappings that can be reasoned about:

- `lift` can be achieved by higher register voicings, higher melodic contour, brighter chord extensions, increased rhythmic activity in top layers, or dynamic contour in the chorus.
- `intimacy` can be achieved by thinning texture, reducing reverb/width (if production enabled), narrowing register spread, and reducing transient density.

In CardPlay terms, levers are:

- **Event edits**: density changes, register shifts, rhythmic displacement, articulation changes  
- **Card param edits**: timbre/FX adjustments, humanize/swing settings  
- **Card graph edits**: adding a pad, doubling a melody, inserting a build card  
- **MusicSpec edits**: constraints that guide generators or advisor suggestions

The reason this belongs in “typed Musical Logic” is that it enables a core promise:

> When the user says “more lift”, the system can show a *typed* decomposition:  
> “I will raise harmony register (+7), brighten voicings, add top percussion, widen pad layer”  
> and those are verifiable.

### 3.6 “Typed in a way inspired by CardPlay” (the radical version)

The most radical (and most CardPlay‑native) move is to treat **instructions themselves as events**.

CardPlay’s universal currency is `Event<P>`. So define:

- `Event<CPLRequest>` as a “command stream”  
- `Event<CPLPlanStep>` as an “edit plan stream”  
- `Event<HostAction>` as an “execution stream”

Why? Because it enables things CardPlay is uniquely positioned to do:

- Time‑anchor instructions: “At bar 49, drop everything for 2 bars” becomes an instruction event aligned to the same tick timeline as notes.
- Route instructions through cards: a “Clarify Card” could take a stream of instructions and output a stream of clarified instruction events; an “Optimizer Card” could reorder or cost‑minimize plan events.
- Version instruction history: instruction events become part of the project’s lineage and can be replayed.

This is not required for MVP, but it is the kind of “ambition integration” that justifies GOFAI Music+ inside CardPlay instead of beside it.

## 8) Infinite Extensibility: Making New Cards, Decks, Boards, and Theories First-Class in English → CPL

CardPlay’s explicit philosophy is “extensibility at the edges.” GOFAI Music+ should inherit that philosophy *all the way into the compiler*. The promise is not just that CardPlay core can understand English; it’s that once someone invents something new—**a new card, deck, board, Prolog module, or theory vocabulary**—the system can immediately incorporate it into the English → CPL pipeline *offline and deterministically*.

This is the difference between:

- A clever “feature” (a chat box that can operate a fixed set of tools), and
- A **language layer** for the whole ecosystem (a compiler that can grow with the system).

### 8.1 The key design move: keep syntax stable; make bindings extensible

If you try to make the English parser “complete,” you end up with a brittle monolith. The sustainable path is:

- Keep a relatively stable set of **core constructions** (scope, coordination, negation, comparatives, preservation constraints, references, quantities).
- Let extensions contribute **bindings** into those constructions:
  - new nouns (“GlassPad”, “Tonnetz”, “Euclidean groove”)  
  - new adjectives (“grainier”, “crunchier”)  
  - new verbs (“stutter”, “reharmonize”, “humanize”)  
  - new constraints and queries  
  - new plan opcodes and compilation handlers

This is exactly how CardPlay stays coherent while adding new musical functionality: it doesn’t rewrite the engine for every new tool; it adds new cards and keeps the abstraction stable.

### 8.2 Extension level taxonomy (what “integrate directly” really means)

“Integrate directly with the NLP → CPL parser” can mean three different things. All three should exist, but they have different costs and safety properties:

**Level 1 — Entity integration (zero grammar changes)**  
New things become referable in English as noun phrases:

- “Add `my-pack:granular-sampler`.”
- “Switch to `my-studio:film-score-board`.”
- “Open the `my-pack:wavetable-deck`.”

This comes almost entirely from *introspection* of registries + metadata.

**Level 2 — Semantic integration (lexeme semantics + lever mappings)**  
New musical words map to known CPL goals/levers:

- “Make it more glassy” → `increase(brightness)` + `increase(width)` + maybe add a specific card from an installed pack.
- “Give it dhol energy” → apply a rhythmic template and instrument-role constraints from an extension theory pack.

This requires extensions to declare how their vocabulary maps to CPL axes, constraints, or plan opcodes.

**Level 3 — Construction/opcode integration (new plan actions)**  
New concepts introduce new action families, but still remain safe because:

- new plan steps are namespaced
- handlers are registered explicitly
- core execution owns diffs/undo/validation

Example: `theory-lab:tonnetz_transform` as a plan opcode with a handler that consults Prolog and emits a bounded set of chord substitution edits.

### 8.3 The GOFAI extension contract: a plugin API that feels like CardPlay

CardPlay already treats extension identity as a namespaced ID (see `cardplay/src/canon/cardplay-id.ts`). Apply the same principle: every non-core GOFAI extension is `namespace:something`, and the namespace is the pack name.

A minimal conceptual contract:

```ts
export interface GofaiExtension {
  readonly id: CardPlayId;    // must be namespaced for third-party
  readonly version: string;   // semver

  registerLexicon(reg: GofaiLexiconRegistry): void;
  registerBindings(reg: GofaiBindingRegistry): void;
  registerPlanner(reg: GofaiPlannerRegistry): void;
  registerProlog(reg: GofaiPrologRegistry): void;
}
```

“Direct integration” means: install the pack → register this module → the compiler updates its lexicon/bindings/opcodes immediately.

### 8.4 Auto-binding: new cards become English nouns automatically

The most important “infinite” feeling is that **new cards are immediately addressable**:

- “Add a tape saturator.”  
- “Put a transient designer on the drums.”  
- “Turn up the width on the stereo shaper.”

CardPlay already has the raw material for this in the card registry:

- `CardMeta` contains `id`, `name`, `description`, `tags`, category, etc.  
- The card definition (or manifest config schema) defines parameters and their types.

From that, GOFAI can auto-generate a baseline lexicon:

1) Card referents from `meta.name` and `meta.id` (split hyphens/underscores into phrases).  
2) Parameter referents from schema keys (`cutoff`, `resonance`, `mix`, `drive`, etc.).  
3) A minimal set of “tool verbs” that are generic:
   - add/remove/move
   - set/turn up/turn down
   - enable/disable

Then the core grammar composes meaning:

- “add <CardName>” → `CPLHost.add_card(cardType=<CardPlayId>)`  
- “set <CardName> <Param> to <Value>” → `CPLHost.set_param(cardId=?, param=?, value=?)` (cardId resolved by context)

That’s the baseline. It works for *any* card, including ones invented later.

### 8.5 Quality upgrade: optional GOFAI annotations on cards/boards/decks

Auto-binding will never be as fluent as “musician language,” because:

- musicians use many synonyms (“hats” vs “hi-hats”)  
- adjectives are semantic (“warmer”, “punchier”) not param names  
- verbs often imply multi-step edits (“tighten the groove”)

So packs should be able to optionally provide GOFAI annotations. Think of these as the equivalent of typing a card signature: they declare how language should bind to the tool.

Examples of useful annotations on a card:

- synonyms for the card itself (“tape saturator”, “tape drive”)  
- synonyms for params (“brightness” → `tilt`, “air” → `highShelf`)  
- perceptual-axis hooks (“wider” maps to this card’s `stereoWidth` param)  
- role hints (commonly applied to drums, vocals, master)  

For boards/decks:

- what the board is “for” (workflow verbs: “score”, “arrange”, “design sound”)  
- what decks represent in user language (“the mixer”, “the transport”, “the harmony explorer”)  
- preferred default scopes (board can declare that “it” means the focused deck’s selection)

These annotations let GOFAI become fluent without changing the core grammar.

### 8.6 New Prolog modules and new theory: export vocab + declare bindings

Prolog is where CardPlay can accumulate symbolic music theory without bloating TS code. To make it extensible in GOFAI:

1) Packs can contribute Prolog source modules (strings) and register them into the `PrologAdapter`.
2) Those modules can export vocabulary (mode names, devices, form labels, etc.).
3) A GOFAI binding module maps the exported vocabulary into CPL constraints/actions.

There are two complementary mechanisms:

**Mechanism A: explicit TS bindings (recommended for semantics)**  
The extension provides a TS module that registers:

- lexemes (“tonnetz”, “neo-Riemannian”, “LPR”)  
- CPL constraints (namespaced)  
- planner hooks (how to satisfy those constraints)  
- prolog query wrappers (typed API over raw predicates)

This keeps semantics typed and stable.

**Mechanism B: Prolog vocab export (recommended for scale)**  
Define a convention predicate like:

```prolog
% gofai_vocab(Kind, Surface, Canonical).
gofai_vocab(mode, 'hungarian minor', hungarian_minor).
gofai_vocab(device, 'chromatic mediant', chromatic_mediant).
```

The GOFAI system can query those facts at load time and ingest:

- surface forms into the normalizer  
- canonical atoms into the CPL layer (namespaced if extension-defined)

This lets a theory pack add dozens/hundreds of terms without hand-updating TS normalizers.

### 8.7 Namespaced constraints: the universal integration hook

If you want to integrate new theory without rewriting the core, you need a stable escape hatch: **namespaced constraints**.

CardPlay already uses namespacing to distinguish builtin vs extension IDs. GOFAI should treat constraints the same:

- builtin: `tempo`, `key`, `meter`, …  
- extension: `theory-lab:neo_riemannian_path`, `microtonal:edlo_tuning`, …

Core can remain agnostic to the meaning of those constraints while still supporting:

- parsing  
- typechecking (against an extension-declared schema)  
- serialization/versioning  
- UI display  
- enforcement where possible (or safe “unknown constraint” handling)

This is how “not-yet-added music theory” becomes first-class: it can be carried through the compiler as a typed artifact, even before every generator/action understands it.

### 8.8 Extensible planning and execution: opcodes + handlers, not ad-hoc code paths

For new tools to be *actionable*, they must be plannable. The safe pattern is:

- CPL‑Plan uses action opcodes (a bounded action vocabulary).
- Each opcode has a handler that can:
  - validate preconditions
  - estimate cost / satisfaction
  - compile to host actions / state mutations

For infinite extensibility:

- builtin opcodes are un-namespaced and live in core  
- extension opcodes are namespaced and registered by the pack  
- unknown opcodes cannot execute silently

Most importantly:

> Extension handlers should not directly mutate CardPlay state; they should *propose* `EditPackage`s.  
> Core execution applies edits, computes diffs, and enforces constraints.

That preserves the trust surface even as behavior expands.

### 8.9 Extensibility without chaos: provenance + gating + audit

Infinite extensibility is only valuable if users can still trust the system. The safety story is:

- Provenance is explicit: every lexeme/opcode/constraint carries `namespace:` and version.  
- Board policy gates execution (manual boards are parse/explain-first).  
- Plans are previewable and undoable.  
- Unknown or untrusted extension behaviors default to “show but don’t run.”

This “show your work” discipline is what makes the system usable in real creative contexts.

### 8.10 Concrete examples of “direct integration”

**Example 1: New card pack with no GOFAI annotations**  
Pack installs cards with meta `{id,name,params}`. Immediately:

- “Add the `my-pack:stereo-shaper` and make it wider.”  
  → auto-binding resolves the card and maps “wider” to its `width` param if present; otherwise it asks which parameter to change.

**Example 2: New board added at runtime**  
Board registers with `BoardRegistry.register()`. Immediately:

- “Switch to my board ‘Ambient Lab’ and open the generators deck.”  
  → BoardRegistry search + deck focus actions.

**Example 3: New theory module**  
Pack adds Prolog predicates and exports `gofai_vocab/3`. Immediately:

- “Use the pelog scale and keep the melody recognizable.”  
  → normalizer recognizes “pelog” because it was exported; CPL carries an extension constraint; planner routes to any generator that understands it (or asks to pick one).

In all cases, the core English grammar didn’t change; the system grew by binding new entities and semantics into stable constructions.

---
