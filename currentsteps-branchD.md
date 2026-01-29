# CardPlay Implementation Roadmap — Branch D (Lyrics + Semiotic Songwriting)

Branch A is **boards/product/UI**. Branch B is **Prolog engine + AI infrastructure**. Branch C is **MusicSpec + music-theory KB depth**.  
This Branch D is **lyrics-first composition**: words/lines/verses become *first-class citizens* that can be selected, tagged, referenced by Prolog, and used to trigger musical changes **without the user thinking in bars/beats**.

The “simplest path” architecture for this repo is documented in:
- `cardplay/docs/theory/lyrics_integration.md` (Branch D concept + minimal vertical slice)

This file turns that concept into a **comprehensive, step-by-step implementation plan**.

---

## Background (required reading + key takeaways)

### Primary Branch D document
- `cardplay/docs/theory/lyrics_integration.md`
  - Decide: **lyrics as structured entities with stable IDs + anchors**
  - Start: **separate lyric stream** (avoid breaking note-only assumptions in tracker/notation adapters)
  - AI contract: Prolog emits **lyric-scoped actions** (tagging + span-targeted musical actions)
  - “Semiotic” layer: user defines **tag → aspect → action** mappings

### Prolog conventions and where knowledge lives
- `cardplay/docs/theory/kb-layering.md`
  - Keep **facts/inference** in Prolog; keep **types/validation + real-time** in TS
- `cardplay/docs/theory/prolog-conventions.md`
  - All recommendations must be **explainable** (`explain/2`)
  - Use **scores/confidence** consistently (`score/2`, confidence semantics)
- `cardplay/docs/theory/card-to-prolog-sync.md`
  - Pattern for **syncing TS state → Prolog facts** (assert/retract, scoped push/pop)
- `cardplay/docs/theory/prolog-to-host-actions.md`
  - Pattern for Prolog → host action objects (note: code currently uses `action(ActionTerm, Confidence, Reasons)` wrappers; keep Branch D consistent with actual code)

### Extending the system (patterns to reuse)
- `cardplay/docs/theory/extending-music-theory-kb.md`
  - KB layering pattern: **facts → derived predicates → query predicates**
  - How to add a new `.pl` file + loader
- `cardplay/docs/theory/authoring-theory-cards.md`
  - Pattern: **card params → constraints → Prolog predicates → HostActions**
  - Branch D reuses this for “semiotic mapping” and “lyrics intent” controls (optional)

### Notation roadmap (lyrics already anticipated)
- `cardplay/docs/notation-roadmap-1000-steps.md`
  - ScoreNotationCard architecture mentions a **lyrics input**
  - Vertical layout roadmap includes **lyrics baseline alignment**

---

## Current repo reality (constraints that affect design)

### Existing building blocks we will reuse
- Events & time: `cardplay/src/types/event.ts`, `cardplay/src/types/primitives.ts`
- Precedent for global contextual tracks: `cardplay/src/containers/chord-track.ts`
- Selection is **stream-scoped**: `cardplay/src/state/selection-state.ts`
- Deck factories & board layouts: `cardplay/src/boards/decks/factories/*`, `cardplay/src/boards/builtins/*`
- Prolog engine + loaders: `cardplay/src/ai/engine/prolog-adapter.ts`, `cardplay/src/ai/knowledge/*-loader.ts`
- MusicSpec action pattern (wrapper `action(Action, Confidence, Reasons)`): `cardplay/src/ai/knowledge/music-spec.pl`, `cardplay/src/ai/queries/spec-queries.ts`, `cardplay/src/ai/theory/host-actions.ts`
- Notation has lyric placement primitives (not wired): `cardplay/src/notation/layout.ts` (`LyricSyllable`, placement)
- “host-action event” precedent (schedulable control): `cardplay/src/ui/drag-drop-payloads.ts`, `cardplay/src/ui/drop-handlers.ts`

### Critical constraint: do NOT break note-only assumptions early
- `cardplay/src/tracker/event-sync.ts` iterates stream events and assumes tracker-like payload.
- `cardplay/src/notation/notation-store-adapter.ts` currently casts stream events to notes.

Therefore, the MVP path must keep lyrics in a **dedicated lyric stream** and integrate as an overlay/secondary source until adapters are hardened.

---

## Definition of “done” for Branch D

By the end of Branch D:
1) Lyrics exist as structured entities (words/lines/verses) with stable IDs and anchors.
2) Users can edit/select lyrics on any board layout (lyrics deck).
3) Prolog can reason over lyrics and emit explainable recommendations.
4) Users can apply AI suggestions to **words/lines/verses** and see musical consequences at those anchored spans.
5) Users can configure **semiotic mappings** (tag → aspect → action) and boards respect them.
6) Notation can render lyric underlay; tracker/session can show lyric lanes; all share the same underlying lyric model.

---

## Roadmap: 1300 steps (D001–D1300)

Notes:
- Steps are written so each produces either: (a) new types/data model, (b) new UI surface, (c) new Prolog predicates, (d) new query wrapper, (e) tests/docs.
- Keep Branch D aligned with Prolog conventions (`explain/2`, scoring) and board-centric integration.

---

## Phase D0 — Alignment, terminology, and decision log (D001–D060)

- [x] D001 Write the Branch D concept doc (`cardplay/docs/theory/lyrics_integration.md`). *(done)*
- [ ] D002 Re-read `cardplay/docs/theory/kb-layering.md` and decide what belongs in TS vs Prolog for lyrics.
- [ ] D003 Re-read `cardplay/docs/theory/prolog-conventions.md` and confirm explain/score conventions for lyric recommenders.
- [ ] D004 Re-read `cardplay/docs/theory/card-to-prolog-sync.md` and pick the sync strategy for lyrics (scoped push/pop vs pure stateless terms).
- [ ] D005 Re-read `cardplay/docs/theory/prolog-to-host-actions.md` and reconcile doc vs actual code action wrapper format.
- [ ] D006 Decide canonical naming: `lyric` vs `lyrics` for Event kind, deck type, KB filenames, and predicate prefixes.
- [ ] D007 Decide canonical entity hierarchy: document → section → verse iteration → line → token.
- [ ] D008 Decide primitive unit for storage: token events only (derive line/verse), vs explicit line/verse events.
- [ ] D009 Decide how tags are stored: `Event.tags` vs payload `tags` vs `EventMeta` (and how to persist).
- [ ] D010 Decide how anchors are represented: ticks span only, noteIds only, or both.
- [ ] D011 Decide “verse identity” semantics across arranger sections (Verse 2 vs Verse section iteration).
- [ ] D012 Decide multi-language strategy: store raw text; Prolog operates on atoms; avoid heavy NLP in MVP.
- [ ] D013 Decide “AI apply” semantics per board control level (manual boards show suggestions but never auto-apply).
- [ ] D014 Define the Branch D action vocabulary (small set of Prolog→TS actions).
- [ ] D015 Define the minimal aspects list for semiotic mapping (dynamics, harmony, rhythm, timbre, space, orchestration, form, articulation, texture).
- [ ] D016 Define the “span application” rules (which note kinds are affected; how to handle overlaps).
- [ ] D017 Define the selection model: lyric selection should not destroy note selection (dual selection vs mode switch).
- [ ] D018 Define interoperability targets: MusicXML lyrics export, MIDI lyric meta, plain-text import/export.
- [ ] D019 Create a Branch D glossary section (token, syllable, underlay, verse iteration, anchor, aspect).
- [ ] D020 Add a “non-goals for MVP” section (e.g., perfect syllabification, rhyme dictionary, LLM generation).
- [ ] D021 Add an architecture diagram for Branch D (streams + decks + Prolog).
- [ ] D022 Add a data-flow diagram for lyric facts → Prolog → actions → host application.
- [ ] D023 Inventory existing lyric-related code (notation layout primitives; any old lyric WIP).
- [ ] D024 Inventory how chord track is integrated into boards and active context.
- [ ] D025 Inventory how selection store is used by piano roll + notation + tracker adapters.
- [ ] D026 Inventory persistence format for streams and how new lyric stream will be saved.
- [ ] D027 Inventory Prolog KB load lifecycle and decide whether lyrics KB is “critical” or “lazy”.
- [ ] D028 Decide where to put Branch D types (`src/lyrics/*` vs `src/containers/lyrics-track.ts` vs `src/types/lyrics.ts`).
- [ ] D029 Decide where to put Branch D Prolog files (`src/ai/knowledge/lyrics.pl`) and loaders.
- [ ] D030 Decide query surface: separate `lyrics-queries.ts` module.
- [ ] D031 Decide whether to integrate into AIAdvisor question categories now or later.
- [ ] D032 Decide board-level UI: which builtin boards include lyrics deck by default.
- [ ] D033 Decide minimal “lyrics-first board” MVP (beginner/singer-songwriter board).
- [ ] D034 Decide whether lyrics also appear in `properties-deck` as a tab for boards without lyrics deck.
- [ ] D035 Decide “tokenization rules” for editing: whitespace vs punctuation vs explicit syllable separators.
- [ ] D036 Decide how to represent hyphenation for syllables (syllableType begin/middle/end).
- [ ] D037 Decide how to handle melisma (one syllable across multiple notes) for underlay.
- [ ] D038 Decide how to handle “pickup”/anacrusis alignment for lyrics.
- [ ] D039 Decide how to handle repeated sections: copy lyric tokens or reference same tokens with different anchors.
- [ ] D040 Decide how to version lyric payload schema for migrations.
- [ ] D041 Define performance budgets for lyric lookups (per-render query time).
- [ ] D042 Define test strategy (unit tests for tokenization; integration tests for deck; Prolog predicate tests).
- [ ] D043 Define telemetry strategy (optional) for lyric edits/actions (align with advisor telemetry patterns).
- [ ] D044 Create Branch D project checklist for “first playable demo”.
- [ ] D045 Lock decisions in this doc (Decision Log subsection).
- [ ] D046 Add links to all relevant background docs in a “See Also”.
- [ ] D047 Define a minimal set of default tags (emphasis, hook, contrast, tenderness, anger, doubt, resolution, etc.).
- [ ] D048 Define minimal UI colors/icons for default tags.
- [ ] D049 Define minimal tag-to-aspect default mappings per persona (notation composer vs producer vs tracker).
- [ ] D050 Define how board gating limits aspects/actions (manual boards: suggest-only; assisted: apply).
- [ ] D051 Identify where in code to register new deck type `lyrics-deck`.
- [ ] D052 Identify where in Prolog KB to register new deck type (board-layout.pl) if needed.
- [ ] D053 Identify where in docs to document lyric deck and workflows.
- [ ] D054 Create a milestone table for Phases D1–D9.
- [ ] D055 Add risk list: adapter assumptions, selection conflicts, notation rendering complexity.
- [ ] D056 Add mitigation plan: keep separate stream; overlay rendering; harden adapters later.
- [ ] D057 Add a “data contract” section for TS↔Prolog lyric facts.
- [ ] D058 Add a “host action contract” section for Prolog→TS lyric actions.
- [ ] D059 Add a “migration contract” section (how lyric schemas evolve).
- [ ] D060 Freeze Phase D0 and start implementation.

---

## Phase D1 — Core lyric data model + track adapter (D061–D200)

### D1.1 Event kind + payload types (D061–D100)

- [ ] D061 Add a canonical lyric event kind entry (optional metadata) and decide naming.
- [ ] D062 Define TS types: `LyricTokenPayload`, `LyricScope`, `LyricAnchor`, `LyricTag`.
- [ ] D063 Define TS types: `LyricLine`, `LyricVerse`, `LyricSection` derived views.
- [ ] D064 Define TS types: `LyricDocument` (structure + references to token IDs).
- [ ] D065 Define a stable ID scheme for lyric tokens (UUID vs deterministic id based on verse/line/token).
- [ ] D066 Define how to store verse+line+token indices in payload (1-based canonical).
- [ ] D067 Define how to represent punctuation (token property vs separate tokens).
- [ ] D068 Define how to represent whitespace and line breaks (structure not tokens).
- [ ] D069 Define how to represent “empty line” (line exists even if no tokens).
- [ ] D070 Define how to represent multiple verses: verse index + optional section id.
- [ ] D071 Define how to represent verse iteration within an arranger section.
- [ ] D072 Define how to represent syllables: `syllableType` + hyphenation.
- [ ] D073 Define how to represent melisma: token has multiple noteIds or explicit extension flags.
- [ ] D074 Define where tags live (payload.tags vs Event.tags) and implement.
- [ ] D075 Define where display properties live (EventMeta.color/label vs payload).
- [ ] D076 Define a minimal schema validator for `LyricTokenPayload`.
- [ ] D077 Add helpers to build/clone/update lyric events.
- [ ] D078 Add helpers to compute derived line/verse views from token events.
- [ ] D079 Add helpers to compute “token ranges” (line range, verse range).
- [ ] D080 Add helpers to compute “active token at playhead tick”.
- [ ] D081 Add helpers to map noteIds → tick spans (requires note stream lookup).
- [ ] D082 Add helpers to map tick spans → affected note event IDs.
- [ ] D083 Add helpers to compute verse/line text rendering from tokens (with spacing rules).
- [ ] D084 Add helpers to compute stable “selector handles” (TokenId, LineId, VerseId).
- [ ] D085 Add helpers to compute “which verse is this” in repeated sections.
- [ ] D086 Add helpers to merge lyric edits without losing anchors.
- [ ] D087 Add helpers to diff lyric documents for undo stack.
- [ ] D088 Add unit tests: token payload validation.
- [ ] D089 Add unit tests: derived line/verse reconstruction.
- [ ] D090 Add unit tests: mapping noteIds ↔ tick spans (with dummy note stream).
- [ ] D091 Add unit tests: stable ID behavior across edits.
- [ ] D092 Add a minimal “lyrics domain” barrel export.
- [ ] D093 Add documentation block comments for types (public API).
- [ ] D094 Decide if lyric tokens should support per-token “stress” and “syllable count” fields now.
- [ ] D095 If adding stress, define fields: `stress: 0|1|2` and `phonemes?: string[]` (optional).
- [ ] D096 Add a normalized `TagName` type (string union for builtin tags + open for custom).
- [ ] D097 Add tag registry (id → label/color/icon) with extensibility.
- [ ] D098 Add “aspect” registry (id → label).
- [ ] D099 Add “action kind” registry (id → label + execution handler).
- [ ] D100 Freeze the D1 payload schema (v0.1) and commit as doc in this file.

### D1.2 LyricsTrackAdapter (D101–D160)

- [ ] D101 Create `LyricsTrackAdapter` patterned after `ChordTrackAdapter` (`cardplay/src/containers/chord-track.ts`).
- [ ] D102 Decide global vs per-project lyric stream naming (`global-lyrics-track` default).
- [ ] D103 Implement stream creation/get in constructor; ensure stream exists.
- [ ] D104 Subscribe to store changes and notify lyric state subscribers.
- [ ] D105 Implement `getTokens()` reading from lyric stream.
- [ ] D106 Implement `getTokensInRange(start,end)` for rendering overlays.
- [ ] D107 Implement `getTokenById(id)` and `getTokenAtTick(tick)`.
- [ ] D108 Implement `getLine(verse,line)` derived from tokens.
- [ ] D109 Implement `getVerse(verse)` derived from tokens.
- [ ] D110 Implement `setDocument(text)` which parses and rewrites token events (with undo support).
- [ ] D111 Implement `applyTextEdit(op)` (incremental editing) to avoid full rewrite later.
- [ ] D112 Implement `setTokenAnchorTicks(tokenId, start, end)` (undoable).
- [ ] D113 Implement `setTokenNoteIds(tokenId, noteIds)` (undoable).
- [ ] D114 Implement `addTag(tokenId, tag)` / `removeTag(tokenId, tag)` (undoable).
- [ ] D115 Implement `setTokenColor(tokenId, color)` using EventMeta.
- [ ] D116 Implement `setTokenLabel(tokenId, label)` if useful for UI.
- [ ] D117 Implement `setTokenSyllableType(tokenId, type)` and hyphen rules.
- [ ] D118 Implement `splitWordIntoSyllables(tokenId, syllables[])` (creates new tokens).
- [ ] D119 Implement `mergeSyllables(tokenIds[])` (reverse operation).
- [ ] D120 Implement “copy verse” and “duplicate verse iteration” operations.
- [ ] D121 Implement “link verse iterations” (shared text, different anchors) (optional).
- [ ] D122 Implement `exportPlainText()` (round-trip friendly).
- [ ] D123 Implement `importPlainText(text)` alias for setDocument.
- [ ] D124 Implement `exportLyricJSON()` (structured export).
- [ ] D125 Implement `importLyricJSON(obj)` with schema validation.
- [ ] D126 Implement `getSyllablesForNotation(start,end, noteStream)` returning `LyricSyllable[]` compatible with notation layout.
- [ ] D127 Implement `getSyllablesForNotationByNoteIds(noteIds)` helper.
- [ ] D128 Implement “active line near playhead” helper for tracker overlay.
- [ ] D129 Implement “search tokens” helper (query by substring/tag).
- [ ] D130 Implement “tag summary” helper (count tags per verse/line).
- [ ] D131 Implement “rhyme key” placeholder field (computed later by Prolog).
- [ ] D132 Add unit tests: stream initialization and persistence behavior.
- [ ] D133 Add unit tests: tagging, anchoring, import/export.
- [ ] D134 Add unit tests: syllable split/merge.
- [ ] D135 Add unit tests: getSyllablesForNotation output correctness.
- [ ] D136 Add unit tests: undo stack integration (executeWithUndo usage).
- [ ] D137 Add perf tests: token lookups in a large lyric doc.
- [ ] D138 Add docs: API usage examples in code comments.
- [ ] D139 Add singleton helper `getLyricsTrackAdapter()` similar to chord track (optional).
- [ ] D140 Freeze the adapter API as “Branch D v0.1”.
- [ ] D141 Add an `ActiveContext` field for lyric stream id (parallel to chordStreamId).
- [ ] D142 Ensure board context store can persist lyric stream selection across boards.
- [ ] D143 Decide whether lyric stream is global or per-song/project (likely per project).
- [ ] D144 If per project, ensure project load creates lyric stream consistently.
- [ ] D145 Add migration strategy for older projects without lyric stream.
- [ ] D146 Add a placeholder “lyrics track” container type for future clip association.
- [ ] D147 Add docs to `cardplay/docs/state-model.md` (if exists) describing lyric stream.
- [ ] D148 Add docs to `cardplay/docs/persistence-format.md` describing lyric stream encoding.
- [ ] D149 Add docs to `cardplay/docs/learn-*.md` for beginner lyric workflow (later).
- [ ] D150 Complete D1.2 milestone: editable lyrics exist in the event store.

### D1.3 Selection + cross-view state (D161–D200)

- [ ] D161 Add a lyric selection model that doesn’t fight note selection (dual selection state).
- [ ] D162 Option A: use selection store stream scoping and switch streamId when lyric deck is focused.
- [ ] D163 Option B: extend selection store to track multiple selections (notes + lyrics) simultaneously.
- [ ] D164 Implement the chosen option and update adapters accordingly.
- [ ] D165 Add `ActiveContext` fields: `activeLyricTokenId`, `activeLyricVerse`, `activeLyricLine` (optional).
- [ ] D166 Ensure lyrics deck can set active context and selection.
- [ ] D167 Ensure other decks can “jump to lyric token” by ID.
- [ ] D168 Add UI affordance: clicking a note selects related lyric token (if underlay mapping exists).
- [ ] D169 Add UI affordance: clicking a lyric token selects related notes (if noteIds exist).
- [ ] D170 Add unit tests for selection semantics.
- [ ] D171 Add integration tests for selection interactions with piano roll and notation adapters.
- [ ] D172 Add “focus mode” concept: lyrics-focused vs note-focused tools.
- [ ] D173 Add keyboard shortcuts for switching focus mode (board policy).
- [ ] D174 Add context menu operations for tokens (tagging, anchor set).
- [ ] D175 Add “tag palette” UI component for fast tagging.
- [ ] D176 Add “verse/line navigation” UI (jump to verse/line, filter).
- [ ] D177 Add “find” UI (search tokens, tags).
- [ ] D178 Add minimal telemetry hooks for selection changes (optional).
- [ ] D179 Add docs: selection model for lyrics in this file.
- [ ] D180 Complete D1 milestone: lyric model + adapter + selection baseline.

---

## Phase D2 — Lyrics deck UI (editing, anchors, tags) (D201–D350)

### D2.1 Deck type + factory (D201–D240)

- [ ] D201 Add deck type `lyrics-deck` to `DeckType` union (`cardplay/src/boards/types.ts`).
- [ ] D202 Add a deck factory `cardplay/src/boards/decks/factories/lyrics-deck-factory.ts`.
- [ ] D203 Register factory in `cardplay/src/boards/decks/factories/index.ts`.
- [ ] D204 Add stub rendering first (like other factories) and ensure no build errors.
- [ ] D205 Define a minimal UI component `LyricsPanel` in `cardplay/src/ui/components/lyrics-panel.ts`.
- [ ] D206 Inject styles (pattern: harmony-controls component).
- [ ] D207 Wire panel to `LyricsTrackAdapter` (read tokens, update on subscription).
- [ ] D208 Implement “document view” editor (plain text textarea) with parse → tokens.
- [ ] D209 Implement “structured view” (verses/lines/tokens list).
- [ ] D210 Implement token selection (click selects token; updates selection store/context).
- [ ] D211 Implement token tagging UI (toggle default tags).
- [ ] D212 Implement token color UI (default tag colors).
- [ ] D213 Implement per-token anchor display (tick span or noteIds).
- [ ] D214 Implement set-anchor-to-playhead button (uses active transport tick).
- [ ] D215 Implement set-anchor-from-selection button (derives ticks from selected notes).
- [ ] D216 Implement clear-anchor button.
- [ ] D217 Implement underlay mapping editor (assign noteIds; later automated).
- [ ] D218 Implement verse/line navigation controls.
- [ ] D219 Implement search/filter (by text, tag).
- [ ] D220 Implement import/export buttons (plain text + JSON).
- [ ] D221 Add undo integration for edits (executeWithUndo).
- [ ] D222 Add error handling: invalid JSON, invalid schema.
- [ ] D223 Add “diff preview” for parse operations (optional).
- [ ] D224 Add tests for lyrics deck factory render/mount/unmount.
- [ ] D225 Add tests for LyricsPanel basic interactions.
- [ ] D226 Add accessibility (keyboard nav, focus ring, aria labels).
- [ ] D227 Add board policy toggles for showing lyrics deck (optional).
- [ ] D228 Add docs: lyrics deck UX in `cardplay/docs/ui-workflows.md` (later).
- [ ] D229 Complete D2.1 milestone: lyrics deck renders and edits tokens.

### D2.2 Board inclusion (D241–D300)

- [ ] D241 Add lyrics deck to selected builtin boards:
  - notation boards (lyrics underlay workflow)
  - composer/producer boards (section/clip lyric workflow)
  - tracker boards (overlay lane workflow)
- [ ] D242 Decide panel placement defaults per board (left browser vs right properties).
- [ ] D243 Update `cardplay/src/boards/builtins/*` accordingly.
- [ ] D244 Add a dedicated beginner “Singer-Songwriter / Lyrics-first” board (optional but recommended).
- [ ] D245 Add lyrics deck to board templates if templates exist.
- [ ] D246 Update board gating capabilities so lyrics deck is allowed on all control levels (manual tool, not AI).
- [ ] D247 Update `cardplay/src/ai/knowledge/board-layout.pl` deck taxonomy to include `lyrics_deck` (or map to `lyrics-deck` naming).
- [ ] D248 Update board-layout predicates: deck_type, board_has_deck, layout suggestions.
- [ ] D249 Add tests for board factory validation when lyrics deck is present.
- [ ] D250 Add docs: which boards include lyrics deck by default.
- [ ] D251 Ensure `ActiveContext` persists lyric stream id across board switches.
- [ ] D252 Ensure the board switcher preserves lyric deck runtime state.
- [ ] D253 Add keyboard shortcut for toggling lyrics deck visibility (policy).
- [ ] D254 Complete D2.2 milestone: lyrics deck is available across board layouts.

### D2.3 Anchoring UX (D301–D350)

- [ ] D301 Implement anchor editing UI that doesn’t require bars/beats terminology.
- [ ] D302 Add “Anchor to selection” (notes) and “Anchor to playhead window” operations.
- [ ] D303 Add “snap anchor to nearest note onsets” operation.
- [ ] D304 Add “stretch anchor with tempo changes” semantics (ticks are absolute; later tie to musical time).
- [ ] D305 Add display of anchor as “timecode” and “musical time” (bars/beats optional).
- [ ] D306 Add “align tokens to rhythm grid” helper (for performance lyrics timing).
- [ ] D307 Add “melisma mode”: one token spans multiple notes (draw extension line later).
- [ ] D308 Add “syllable mode”: split words and map syllables across notes.
- [ ] D309 Add “auto-map to selected notes” helper (one-to-one assignment).
- [ ] D310 Add “auto-map across phrase” helper (distribute tokens across note onsets).
- [ ] D311 Add preview overlay in piano roll/notation for mapped tokens (hover shows token).
- [ ] D312 Add per-verse anchor offset controls (useful for Verse 2 repeated).
- [ ] D313 Add conflict detection UI: overlapping anchors, unmapped tokens.
- [ ] D314 Add unit tests for anchoring helpers.
- [ ] D315 Add integration tests for mapping to note selections in piano roll and notation.
- [ ] D316 Complete D2 milestone: user can author lyric structure + anchors comfortably.

---

## Phase D3 — Prolog lyrics KB + TS query wrappers (D351–D520)

### D3.1 New Prolog KB module (D351–D420)

- [ ] D351 Create `cardplay/src/ai/knowledge/lyrics.pl` with clear layer headings (facts → derived → queries).
- [ ] D352 Define base predicates for tokens: `lyric_token/5` (id, verse, line, idx, text).
- [ ] D353 Define anchor predicates: `lyric_anchor/2` for ticks spans and noteIds.
- [ ] D354 Define tag predicates: `lyric_tag/2`.
- [ ] D355 Define derived predicates: last token in line, repeated tokens, line length, etc.
- [ ] D356 Define derived predicates: simple prosody features (syllable count heuristics placeholder).
- [ ] D357 Define derived predicates: hook detection (repetition + position).
- [ ] D358 Define derived predicates: contrast markers (negations, tense shifts) (minimal heuristics).
- [ ] D359 Define derived predicates: rhyme group placeholders (later improved).
- [ ] D360 Define derived predicates: “emphasis candidates” (end of line, repeated token, capitalization).
- [ ] D361 Define explain predicates for each recommender per convention (`explain/2` or reasons list).
- [ ] D362 Define scoring predicates for each recommender (`score/2` or confidence).
- [ ] D363 Define semiotic mapping predicates: `semiotic_map/3`, `aspect_enabled/1`.
- [ ] D364 Define board/policy facts for allowed aspects (asserted from TS).
- [ ] D365 Implement `recommend_lyric_action/3` generating action terms + reasons.
- [ ] D366 Implement `all_recommended_lyric_actions/1` returning `action(Action, C, Reasons)` wrappers.
- [ ] D367 Add a small set of action functors:
  - `set_lyric_tag(TokenId, Tag)`
  - `set_lyric_color(TokenId, Color)`
  - `emphasize_span(ticks(S,E), amount(A))`
  - `soften_span(ticks(S,E), amount(A))`
  - `schedule_host_action(ticks(S,_), set_param(CardId, ParamId, Value))` (bridge)
- [ ] D368 Add tests at Prolog level (via TS adapter) for basic derived predicates.
- [ ] D369 Add tests for action generation + explanations.
- [ ] D370 Add docs at top of `lyrics.pl` describing API predicates.
- [ ] D371 Add explicit “do not require external NLP” note for MVP.
- [ ] D372 Ensure `lyrics.pl` loads in Tau Prolog (avoid unsupported libs unless necessary).
- [ ] D373 Add compatibility: include `lists` module usage if needed (already loaded by adapter).
- [ ] D374 Complete D3.1 milestone: Prolog can reason over lyrics slice and emit actions.

### D3.2 Loader + query wrappers (D421–D480)

- [ ] D421 Create `cardplay/src/ai/knowledge/lyrics-loader.ts` (pattern: board-layout-loader.ts).
- [ ] D422 Add `lyrics.pl?raw` import and `loadLyricsKB(adapter)` function.
- [ ] D423 Decide whether lyrics KB is loaded by default (AI advisor) or lazily (when lyrics deck requests).
- [ ] D424 Add `ensureLoadedLyrics(adapter)` helper in query layer.
- [ ] D425 Create `cardplay/src/ai/queries/lyrics-queries.ts`.
- [ ] D426 Define TS interface for `RecommendedLyricAction` (action term + params + confidence + reasons).
- [ ] D427 Implement `withLyricsContext(...)` helper analogous to `withSpecContext`:
  - assert lyric_token/anchor/tag facts for relevant slice
  - run query
  - retract/restore (scoped token approach)
- [ ] D428 Add Prolog scoped push/pop for lyrics (optional): `lyrics_push(Token)` / `lyrics_pop(Token)`.
- [ ] D429 Implement `getRecommendedLyricActions(lyricsContext)` calling `all_recommended_lyric_actions(Actions).`
- [ ] D430 Implement parsing of returned action terms into TS typed actions.
- [ ] D431 Implement reasons parsing using existing `prologReasonsToStrings` helper.
- [ ] D432 Add unit tests for `lyrics-queries.ts`.
- [ ] D433 Add benchmark tests for large lyrics (fact assertion + query time).
- [ ] D434 Add docs: query API usage examples.
- [ ] D435 Complete D3.2 milestone: TS can call Prolog lyrics KB and get typed actions.

### D3.3 Unify action semantics with existing HostActions (D481–D520)

- [ ] D481 Decide whether lyric actions are:
  - new action union type (`LyricHostAction`), or
  - extensions to existing `HostAction` parsing (`cardplay/src/ai/theory/host-actions.ts`)
- [ ] D482 Implement parsing and ensure it doesn’t break existing spec actions.
- [ ] D483 Add “apply lyric action” executor (updates lyric stream, schedules host-actions, or rewrites notes).
- [ ] D484 Decide on confidence scale (0–100) and normalize if Prolog returns 0–1 floats.
- [ ] D485 Add tests for parsing and execution of each action functor.
- [ ] D486 Add docs: action vocabulary and meaning.
- [ ] D487 Complete D3 milestone: lyric recommendations are generated and executable.

---

## Phase D4 — Applying lyric-scoped actions to music (D521–D700)

### D4.1 Span → events mapping (D521–D580)

- [ ] D521 Implement `getNoteEventsInSpan(streamId, ticks(S,E))` helper.
- [ ] D522 Ensure the helper can operate on:
  - current active note stream (tracker/piano roll)
  - notation stream
  - selected stream (activeContext.activeStreamId)
- [ ] D523 Implement mapping via noteIds if present (preferred).
- [ ] D524 Implement fallback mapping via time span (start within range).
- [ ] D525 Define inclusion semantics for edge overlap (start-only vs overlap).
- [ ] D526 Define behavior for polyphonic chords (multiple note events at same tick).
- [ ] D527 Define behavior for sustained notes crossing span boundaries (partial vs full).
- [ ] D528 Implement “event rewrite” functions:
  - adjust velocity in span
  - add articulation tags (as event.meta or payload)
  - add automation lane events (future)
- [ ] D529 Make rewrites undoable (executeWithUndo).
- [ ] D530 Add tests for span mapping and rewrite correctness.
- [ ] D531 Add perf tests for span rewrite on large event streams.
- [ ] D532 Add a “dry run” mode for previewing changes.
- [ ] D533 Add a “diff summary” for UI display (N notes affected).
- [ ] D534 Complete D4.1 milestone: lyric span selection can identify target musical events.

### D4.2 Execution handlers for lyric actions (D581–D650)

- [ ] D581 Implement handler: `set_lyric_tag(TokenId, Tag)` (updates lyric event tags).
- [ ] D582 Implement handler: `set_lyric_color(TokenId, Color)` (updates EventMeta).
- [ ] D583 Implement handler: `emphasize_span(ticks(S,E), amount(A))`:
  - define mapping to velocity/dynamics (board-dependent)
- [ ] D584 Implement handler: `soften_span(ticks(S,E), amount(A))`.
- [ ] D585 Implement handler: `schedule_host_action(...)` by inserting `kind: 'host-action'` event (pattern: drop-handlers).
- [ ] D586 Implement handler: “suggest only” vs “apply” mode (respect board control level).
- [ ] D587 Add tests for each handler.
- [ ] D588 Add integration with undo stack descriptions (“Emphasize ‘home’ (Verse 2)”).
- [ ] D589 Add guardrails: don’t blow up velocities beyond 0..127.
- [ ] D590 Add guardrails: ignore empty spans gracefully.
- [ ] D591 Add guardrails: prevent duplicate host-action events on repeated apply unless requested.
- [ ] D592 Add UI preview rendering for emphasize/soften changes (piano roll colors/vel bars).
- [ ] D593 Add UI preview rendering for scheduled host-actions (tracker row markers).
- [ ] D594 Add docs: how lyric actions are executed per board.
- [ ] D595 Complete D4.2 milestone: lyric actions can be applied meaningfully.

### D4.3 Optional: map lyric tags to MusicSpec constraints (D651–D700)

- [ ] D651 Add optional action: `suggest_constraint_for_span(ticks(S,E), ConstraintTerm)`.
- [ ] D652 Define how span constraints interact with global MusicSpec (board policy).
- [ ] D653 Implement “span-scoped constraint” storage (not global constraints list).
- [ ] D654 Add Prolog predicates for span constraints and conflict detection.
- [ ] D655 Add UI to show span constraints in lyrics deck or properties.
- [ ] D656 Add tests for span constraint application and conflicts.
- [ ] D657 Complete D4 milestone: lyric intent can influence theory constraints (optional but powerful).

---

## Phase D5 — Board integrations (Notation / Tracker / Session+Arranger) (D701–D980)

### D5.1 Notation underlay (D701–D820)

- [ ] D701 Decide integration point: notation store adapter vs ScoreNotationCard inputs.
- [ ] D702 If store adapter: extend `NotationAdapterState` to include lyric stream id.
- [ ] D703 Implement lyric syllable retrieval: `LyricsTrackAdapter.getSyllablesForNotation(...)`.
- [ ] D704 Ensure syllables reference noteIds that exist in notation events.
- [ ] D705 Use `calculateLyricSyllablePlacement` for positioning (`cardplay/src/notation/layout.ts`).
- [ ] D706 Extend rendered notation types to include lyric glyphs/text items.
- [ ] D707 Extend SVG renderer to draw lyric text under the staff.
- [ ] D708 Implement multi-verse spacing (verse numbers).
- [ ] D709 Implement hyphen rendering for syllables (begin/middle).
- [ ] D710 Implement extension line rendering for melisma (later).
- [ ] D711 Implement collision avoidance with dynamics/text (use text placement layering rules).
- [ ] D712 Add tests for lyric placement (baseline alignment, verse spacing).
- [ ] D713 Add tests for rendering output contains lyric text at expected positions.
- [ ] D714 Add editing: click lyric in notation selects lyric token.
- [ ] D715 Add editing: typing in lyrics deck updates notation view live.
- [ ] D716 Add MusicXML export includes lyrics (if exporting notation).
- [ ] D717 Add MusicXML import populates lyric stream (optional).
- [ ] D718 Complete D5.1 milestone: notation displays lyrics underlay tied to notes.

### D5.2 Tracker lyric lane/overlay (D821–D900)

- [ ] D821 Keep lyrics separate stream; render overlay aligned to tracker rows.
- [ ] D822 Implement mapping tick→row using tracker config (ppq/rowsPerBeat).
- [ ] D823 Display current line near playhead and/or inline per row.
- [ ] D824 Add click on row to anchor selected token to that row tick.
- [ ] D825 Add “distribute tokens across selection” helper (assign anchors across rows).
- [ ] D826 Add optional “lyrics column” that scrolls with tracker.
- [ ] D827 Add tests for tick→row mapping and overlay placement.
- [ ] D828 Harden tracker event sync to ignore non-note kinds (optional future step to allow mixed streams).
- [ ] D829 Complete D5.2 milestone: tracker users can align lyrics to patterns without bars/beats.

### D5.3 Session/arrangement/arranger integration (D901–D980)

- [ ] D901 Decide clip/section anchoring model:
  - per-clip lyric document chunks
  - per-arranger-section lyric chunks with verse iteration
- [ ] D902 Add optional anchor type: `clipId` or `sectionId` in lyric token payload.
- [ ] D903 Implement derive tick span from clip placement in arrangement view.
- [ ] D904 Implement derive tick span from section boundaries in arranger.
- [ ] D905 Add lyrics deck UI to group lyrics by clip/section.
- [ ] D906 Add “jump to clip/section” from lyric selection.
- [ ] D907 Add Prolog facts to represent section context (Verse/Chorus) for lyric inference.
- [ ] D908 Add AI suggestions that differ per section (chorus hook emphasis).
- [ ] D909 Add tests for clip/section anchoring and tick derivation.
- [ ] D910 Complete D5 milestone: lyrics integrate with arrangement structure across boards.

---

## Phase D6 — Semiotic mapping system (user-defined tag → aspect → action) (D981–D1120)

### D6.1 Data + UI (D981–D1050)

- [ ] D981 Define TS types: `SemioticMapping`, `AspectId`, `ActionId`.
- [ ] D982 Implement storage of mappings in project state (persisted).
- [ ] D983 Implement UI editor for mappings (in lyrics deck or a dedicated “Semiotic” panel).
- [ ] D984 Provide presets per persona (notation vocal, pop topline, hiphop, film cue).
- [ ] D985 Implement enable/disable aspects per board (policy integration).
- [ ] D986 Implement mapping export/import (JSON).
- [ ] D987 Add tests for mapping editor state changes and persistence.
- [ ] D988 Add docs for mapping UI and examples.
- [ ] D989 Complete D6.1 milestone: user can configure how meaning maps to music.

### D6.2 Prolog integration (D1051–D1120)

- [ ] D1051 Assert mappings into Prolog as facts (`semiotic_map/3`, `aspect_enabled/1`).
- [ ] D1052 Ensure mapping facts are scoped to the query context (don’t leak across sessions).
- [ ] D1053 Update `recommend_lyric_action/3` to respect enabled aspects and mappings.
- [ ] D1054 Add explanations that cite mapping and lyric evidence.
- [ ] D1055 Add scoring that rewards consistency with mapping and avoids over-generation.
- [ ] D1056 Add tests for mapping-respecting action generation.
- [ ] D1057 Complete D6 milestone: semiotic reasoning is first-class and explainable.

---

## Phase D7 — AI Advisor + “lyrics-first” command surface (D1121–D1210)

- [ ] D1121 Add a new Advisor question category: `lyrics` (patterns: word/line/verse/lyrics/rhyme/hook).
- [ ] D1122 Implement queries: “tag this line”, “find the hook”, “which words to emphasize”.
- [ ] D1123 Implement queries: “make Verse 2 darker”, “soften the chorus lyrics”.
- [ ] D1124 Ensure advisor answers return executable actions (same action parsing/execution path).
- [ ] D1125 Add follow-up suggestions: mapping changes, alternative aspects.
- [ ] D1126 Add board-specific advisor responses (notation vs tracker vs producer).
- [ ] D1127 Add tests for advisor lyric category routing.
- [ ] D1128 Add tests for advisor execution suggestions.
- [ ] D1129 Add docs: “Lyrics-first AI” usage in `cardplay/docs/ai/ai-advisor.md` (or create a new page).
- [ ] D1130 Complete D7 milestone: users can drive lyric-focused workflows via natural language.

---

## Phase D8 — Interop, persistence, QA, and docs (D1211–D1300)

### D8.1 Persistence + migrations (D1211–D1245)

- [ ] D1211 Ensure lyric stream is saved/loaded in project persistence.
- [ ] D1212 Add migration for older projects: create empty lyric stream if missing.
- [ ] D1213 Add versioning for lyric payload schema.
- [ ] D1214 Add tests for persistence round-trip of lyric stream and mappings.
- [ ] D1215 Add docs in `cardplay/docs/persistence-format.md`.

### D8.2 Export/import (D1246–D1275)

- [ ] D1246 Add plain text lyric export/import (already via adapter; ensure wired to UI).
- [ ] D1247 Add MusicXML lyrics export for notation exports.
- [ ] D1248 Add MusicXML lyrics import if feasible.
- [ ] D1249 Add MIDI lyric meta export (optional; depends on MIDI exporter).
- [ ] D1250 Add tests for exports (snapshot tests).

### D8.3 QA + perf + polish (D1276–D1300)

- [ ] D1276 Add integration tests: lyrics deck + apply action modifies notes correctly.
- [ ] D1277 Add integration tests: notation renders lyrics underlay from lyric stream.
- [ ] D1278 Add integration tests: tracker overlay shows correct current line.
- [ ] D1279 Add performance regression tests for large lyric docs and long sessions.
- [ ] D1280 Add UI polish: tag chips, keyboard navigation, command palette actions.
- [ ] D1281 Add onboarding tutorial docs for lyrics-first workflows.
- [ ] D1282 Add “Starter templates” that include lyrics deck and mappings (optional).
- [ ] D1283 Complete Branch D final checklist: demo song with Verse/Chorus + lyric-scoped AI apply.
- [ ] D1284 Run `npm test` and fix Branch D regressions only (don’t chase unrelated failures).
- [ ] D1285 Run `npm run typecheck` and keep lyrics code at zero new type errors.
- [ ] D1286 Run `npm run dev` smoke test: edit lyrics, apply AI action, verify undo/redo.
- [ ] D1287 Add Help Browser page “Lyrics & Semiotic Songwriting” linking to Branch D docs.
- [ ] D1288 Add docs: `cardplay/docs/learn-lyrics.md` (quickstart: write → tag → apply).
- [ ] D1289 Add docs: update `cardplay/docs/ui-panels-reference.md` to include lyrics deck.
- [ ] D1290 Add docs: update `cardplay/docs/ai/board-integration-guide.md` with lyric context facts/actions.
- [ ] D1291 Add docs: add a “Lyrics” section to `cardplay/README.md` (user-facing feature).
- [ ] D1292 Add a reference template project “Singer-Songwriter (Lyrics-first)” (optional but recommended).
- [ ] D1293 Add accessibility audit for lyrics deck (keyboard-only, screen reader labels, contrast).
- [ ] D1294 Add performance audit: large lyric doc + long song, verify no UI jank.
- [ ] D1295 Freeze lyric schema version and record it in `cardplay/docs/persistence-format.md`.
- [ ] D1296 Add a regression test for the “lyrics underlay renders” path (snapshot or DOM assertions).
- [ ] D1297 Add a regression test for the “apply emphasize_span modifies velocities” path.
- [ ] D1298 Add a “known limitations” list (melisma lines, rhyme heuristics, language support).
- [ ] D1299 Write release notes section for Branch D in `cardplay/RELEASE_NOTES_v1.0.md` (if applicable).
- [ ] D1300 Branch D complete: lyrics-first workflows working across boards with explainable AI.
