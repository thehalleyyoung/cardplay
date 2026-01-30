# Lyrics Integration: Making Words/Lines/Verses First‑Class in CardPlay

**Status:** aspirational
**Canonical terms used:** Event, EventKind, EventStream, Board, BoardDeck, MusicSpec, MusicConstraint, HostAction, ControlLevel
**Primary code references:** `cardplay/src/types/event.ts`, `cardplay/src/types/event-kind.ts`, `cardplay/src/state/event-store.ts`, `cardplay/src/boards/types.ts`, `cardplay/src/ai/theory/host-actions.ts`, `cardplay/src/ai/knowledge/music-spec.pl`, `cardplay/src/notation/layout.ts`
**Analogy:** Lyrics are tokens/pieces; a Lyrics surface is a zone; Prolog is the referee suggesting moves.

This document proposes the **simplest path** to make CardPlay “lyrics‑focused” in a way that works across boards (Ableton/session, Renoise/tracker, Dorico/notation, beginner boards) and integrates cleanly with the existing **events + cards + boards + Prolog AI** architecture.

It must obey the canon rules in `to_fix.md` (and, as they are created, the authoritative docs under `cardplay/docs/canon/`).

The core idea: **lyrics become structured entities with stable IDs + anchors**, and the AI pipeline learns to talk about them the same way it talks about chords, sections, and constraints—returning **HostActions** that either (a) modify lyric properties, or (b) apply musical changes *at the lyric‑anchored spans*.

#### Declarative vs Imperative Contract
- **Declarative layer:** lyrics facts/tags + `MusicSpec` constraints (what is desired / permitted).
- **Imperative layer:** boards/decks mutate SSOT stores (event streams, clips, routing, UI state).
- **Prolog’s role:** read facts, return *suggestions* as HostActions; it does not mutate host state.
- **Apply loop:** user accepts (or board policy auto-applies) → host applies HostActions → state changes → facts/spec re-synced → new inference.

#### Ontology Declaration
- **Ontology pack(s):** lyrics domain (language tokens) + whichever music ontology pack(s) the project is using via `MusicSpec` (western/carnatic/etc.)
- **Pitch representation:** n/a for lyrics; any pitch implications are delegated to the active music ontology
- **Time representation:** ticks (PPQ=960) for anchors
- **Assumptions:** lyrics are language-agnostic tokens; semantics are optional tags/features; “underlay” to notation is represented via note IDs
- **KB files:** none yet (planned: `cardplay/src/ai/knowledge/lyrics.pl`)

#### Extensibility Contract
- **What can extend this:** builtin + user pack + project-local
- **Extension surface:** new lyric tags/features, new Prolog rules, new HostAction terms/handlers, new UI surfaces/skins
- **Registration/loader:** EventKind registry (`cardplay/src/types/event-kind.ts`), KB loader pattern (`cardplay/src/ai/knowledge/*-loader.ts`), pack manifests (`cardplay/src/user-cards/manifest.ts`)
- **ID namespace rule:** tags/actions must be namespaced (`vendor:hook`, `user:assonance`, `lyrics:set_tag(...)`)
- **Versioning:** lyric event payloads and KB packs must declare schema versions; unknown versions must degrade gracefully
- **Failure mode:** missing/broken lyric extensions disable lyric-specific affordances but never break note editing/playback

---

## 0) Why this is “the simplest path” in this repo

CardPlay already has the pieces you need—just not connected for lyrics yet:

- **Everything is Events** (`cardplay/src/types/event.ts`) with typed `start/duration` in `Tick`s (`cardplay/src/types/primitives.ts`).
- There is precedent for “global non‑note tracks” as adapters over the shared event store: **ChordTrackAdapter** (`cardplay/src/containers/chord-track.ts`).
- The **Board/Deck system** is designed to surface different workflows without changing data (`cardplay/src/boards/types.ts`, `cardplay/src/boards/builtins/*`, deck factories in `cardplay/src/boards/decks/factories/*`).
- Prolog AI already returns structured **HostActions** (`cardplay/src/ai/knowledge/music-spec.pl` → parsed by `cardplay/src/ai/theory/host-actions.ts` → surfaced by queries like `getRecommendedActions()` in `cardplay/src/ai/queries/spec-queries.ts`).
- Notation has already started to model lyric layout primitives (**LyricSyllable**, verse numbers, placement) in `cardplay/src/notation/layout.ts`—it’s just not wired to a lyric source yet.

The main constraint that shapes the “simplest path”: many view adapters currently assume a stream contains a narrow payload shape and don’t filter unknown events (e.g. `cardplay/src/notation/notation-store-adapter.ts` casts stream events to notes; `cardplay/src/tracker/event-sync.ts` iterates all events and treats payload as tracker note-ish). So the first integration should avoid “mix lyrics into note streams” unless you also harden those adapters.

---

## 1) The minimum viable vertical slice (what to build first)

### MVP goal
Let a user:
1) write lyrics as verses/lines/words,
2) **select a word/line/verse** (including which verse iteration),
3) assign or accept AI‑suggested **semantic/prosody tags** on that selection,
4) click “Apply” and have the system create **musical consequences** at the lyric‑anchored span (dynamics/articulation/harmony/timbre/etc.), without the user thinking in bars/beats.

### MVP architecture

1) **A Lyrics Track (data)**
   - Add a `LyricsTrackAdapter` similar to `ChordTrackAdapter` (`cardplay/src/containers/chord-track.ts`).
   - Backed by its own `EventStreamId` in the SharedEventStore (`cardplay/src/state/event-store.ts`).
   - Stores lyric “tokens” (word or syllable events) with stable IDs and verse/line structure.

2) **A Lyrics Deck (UI)**
   - **MVP (non-breaking):** implement a Lyrics surface inside an existing builtin deck type (usually `properties-deck`) so you don’t need to add a new `DeckType` member.
   - **Later (optional):** add a dedicated `lyrics-deck` builtin deck type + factory *or* introduce a namespaced/custom deck-type mechanism. Until then, treat “Lyrics Deck” as a UI surface, not a `DeckType` string.
   - For boards that want it, include it in the layout; for others, expose it as a tab/card in `properties-deck` first.

3) **Anchors (the bridge to music)**
   - Each word/line/verse can be anchored to:
     - a tick span (`startTick`..`endTick`), and/or
     - one or more note IDs (for notation syllable underlay), and/or
     - a clip/section ID (session/arranger workflows).
   - MVP anchor can be “tick span + optional noteIds”; you can add clip/section anchors later.

4) **A Prolog lyrics KB + HostActions**
   - Add `lyrics.pl` + loader (patterned after `music-theory-loader.ts`).
   - Expose a query like `all_recommended_lyric_actions(Actions).` returning the same `action(ActionTerm, Confidence, Reasons)` wrapper used by `music-spec.pl`.
   - Extend TS parsing to accept lyric action terms and execute them as:
     - lyric metadata changes (tagging/coloring), and/or
     - *musical changes applied to the anchored time span* (e.g., adjust velocities of notes in span, add automation, schedule `host-action` events).

This vertical slice yields an immediately usable “lyrics-first” workflow even if tracker/notation/session UIs are still evolving.

---

## 2) Data model: words/lines/verses as first‑class citizens

### 2.1 Canonical entities

You want a stable hierarchy that is independent of board layout:

- **LyricDocument** (song text as structure)
  - id
  - sections (optional: Verse/Chorus/Bridge, tied to arranger)
  - verses (iteration matters: Verse 1 vs Verse 2)
  - lines
  - tokens (word/syllable)

### 2.2 Represent them as Events (but in a dedicated lyric stream)

Use the existing event system, but keep lyrics in their own stream initially to avoid breaking note-only assumptions:

- `Event.kind = 'lyric'` (registerable via `cardplay/src/types/event-kind.ts`)
- `Event.start/duration` used as the **anchor tick span** when available (span = `start .. start+duration`)
- `Event.payload` carries the structural identity:

Example payload shape (TypeScript, conceptual):

```ts
export type LyricScope = 'token' | 'line' | 'verse' | 'section';

export type LyricSyllableType = 'single' | 'begin' | 'middle' | 'end'; // reuse notation/layout.ts idea

export interface LyricTokenPayload {
  text: string;                 // the visible word/syllable
  scope: 'token';
  verse: number;                // 1-based verse index (or section iteration)
  line: number;                 // 1-based line index within verse
  token: number;                // 1-based token index within line
  syllableType?: LyricSyllableType;
  noteIds?: string[];           // optional underlay mapping (notation)
  tags?: string[];              // semantic/prosody tags (or use Event.tags)
}
```

Lines/verses can be represented as:
- separate events of `scope: 'line' | 'verse'` with spans, or
- derived views over token events (line = contiguous token range with same verse/line indices).

MVP: store **token events**; derive line/verse objects at runtime for UI and Prolog.

### 2.3 “Not bars/beats”: anchors are derived from lyric structure

Users select a word/line/verse; the system finds:
- its anchor tick range (from lyric event start/duration), or
- its noteIds (then derive tick span by looking up those notes), or
- its clip/section anchor (then derive tick span from clip/section).

Critically: the user never needs to choose “bar 17 beat 3”; they choose the lyric entity, and the system resolves time.

---

## 3) UI integration across board layouts

### 3.1 One always‑available surface: Lyrics Deck

Add a `lyrics-deck` that is board‑agnostic:

- **Beginner boards:** Lyrics deck is the primary “composition surface”; musical suggestions are presented as “apply to this line/word”.
- **Producer/session boards:** Lyrics deck shows per‑clip lyric chunks and can jump to clip/scene.
- **Tracker boards:** Lyrics deck is a side panel initially; later it can also render an inline lyrics lane/column.
- **Notation boards:** Lyrics deck is an editor + selection surface; notation view renders the underlay.

This mirrors how harmony is handled today: the harmony deck can exist regardless of whether the main view is tracker or notation.

### 3.2 Notation: reuse existing lyric layout primitives

`cardplay/src/notation/layout.ts` already defines:
- `LyricSyllable` with `tick`, `noteId`, optional `verse`
- `calculateLyricSyllablePlacement(...)`

So the integration path is:

1) `LyricsTrackAdapter` exposes `getSyllablesForRange(startTick,endTick)` returning `LyricSyllable[]`.
2) Notation rendering consumes those syllables and calls `calculateLyricSyllablePlacement`.

This also aligns with the notation roadmap’s “lyrics input port” idea (see `cardplay/docs/notation-roadmap-1000-steps.md`), and with the existence of `ScoreNotationCard` (`cardplay/src/cards/score-notation.ts`) even though it doesn’t yet accept lyrics.

### 3.3 Tracker: add a lyric lane without contaminating note streams

Tracker currently computes rows from stream events without filtering (`cardplay/src/tracker/event-sync.ts`). To avoid destabilizing it:

- Keep lyrics in a dedicated lyric stream.
- Render lyrics as an **overlay lane** (read from lyric stream, aligned to row/tick mapping).
- Only later: teach tracker to filter by `event.kind` (so it can tolerate other kinds), and optionally allow lyric events in the same stream.

MVP tracker UX:
- show the current line near the playhead,
- allow click/drag to align token events to rows,
- allow tagging and AI apply.

### 3.4 Ableton/session + arranger: treat lyrics like a chord track

The chord track is a global contextual track; lyrics can be similar:

- A “lyrics track” can attach to:
  - arranger sections (Verse/Chorus/Bridge) and their iterations, and/or
  - clips (each clip owns a lyric chunk).

MVP: start with tick anchors; later add `clipId` anchors and a helper that derives tick spans from clip placement.

---

## 4) AI integration: Prolog KB + HostActions that target lyric entities

### 4.1 Where the knowledge lives (follow existing KB layering)

Follow the pattern in `cardplay/docs/theory/kb-layering.md` and `KB_RESPONSIBILITIES` (`cardplay/src/ai/theory/canonical-representations.ts`):

- **TypeScript side**
  - data model + persistence (event store)
  - tokenization / verse-line parsing
  - optional lightweight NLP features (syllable count heuristics, repetition detection) if you don’t want this in Prolog
  - UI and anchor editing

- **Prolog side**
  - inference rules: rhyme groups, hook words, contrast points, emphasis heuristics
  - mapping from lyric tags/features → musical suggestions
  - explainable recommendations (`explain/2`, scoring conventions from `cardplay/docs/theory/prolog-conventions.md`)

### 4.2 Prolog representation (minimal)

Assert a small set of facts for the *currently relevant slice* of lyrics (e.g., active verse/section, or selection neighborhood):

```prolog
% token identity + structure
lyric_token(TokenId, verse(V), line(L), idx(I), text(TextAtom)).

% anchor to music time (ticks)
lyric_anchor(TokenId, ticks(Start, End)).

% optional underlay anchor (notation)
lyric_anchor(TokenId, note_ids([N1, N2])).

% tags and derived features
lyric_tag(TokenId, Tag).
```

Then define higher-level derived predicates:

```prolog
line_last_token(verse(V), line(L), TokenId) :-
  lyric_token(TokenId, verse(V), line(L), idx(_), text(_)),
  \+ (lyric_token(Other, verse(V), line(L), idx(I2), text(_)),
      lyric_token(TokenId, verse(V), line(L), idx(I1), text(_)),
      I2 > I1).

repeated_token(Text, TokenId) :-
  lyric_token(TokenId, _, _, _, text(Text)),
  lyric_token(Other, _, _, _, text(Text)),
  TokenId \= Other.
```

### 4.3 HostActions for lyric scope

Today, Prolog emits actions via `recommend_action/3` and `all_recommended_actions/1` in `cardplay/src/ai/knowledge/music-spec.pl`, parsed by `cardplay/src/ai/theory/host-actions.ts`.

For lyrics, add parallel predicates:

```prolog
recommend_lyric_action(Action, Confidence, Reasons) :- ...
all_recommended_lyric_actions(Actions) :-
  findall(action(A,C,Rs), recommend_lyric_action(A,C,Rs), Actions).
```

And define a **small, execution-friendly set** of action terms:

- `set_lyric_tag(TokenId, Tag)`
- `set_lyric_color(TokenId, ColorHex)`
- `emphasize_span(ticks(Start, End), amount(0..1))`
- `soften_span(ticks(Start, End), amount(0..1))`
- `suggest_constraint_for_span(ticks(Start, End), ConstraintTerm)` (optional bridge into MusicSpec world)
- `schedule_host_action(ticks(Start, End), host_action(set_param(...)))` (ties into existing “host-action events” idea in `cardplay/src/ui/drag-drop-payloads.ts` / `drop-handlers.ts`)

These actions make “word/line/verse” the *selector*, and ticks merely the implementation detail.

### 4.4 “Semiotic songwriting”: user chooses which musical aspects respond

Represent the user’s intent as **semiotic mappings**:

> “When this word has tag X, express it through (dynamics | harmony | orchestration | rhythm | space), not everything.”

Implementation-friendly way to do this in Prolog:

```prolog
% User-configurable mapping facts (asserted from TS)
semiotic_map(tag(emphasis), aspect(dynamics), action(emphasize_span)).
semiotic_map(tag(sorrow),  aspect(harmony),   action(suggest_minor_inflection)).
semiotic_map(tag(heat),    aspect(timbre),    action(suggest_brightness)).

% Board/policy toggles
aspect_enabled(dynamics).
aspect_enabled(harmony).
% (or derive from board control level / board type)
```

Then Prolog can generate actions only for enabled aspects, and explanations can cite both:
- lyric evidence (e.g., “end of line”, “repeated hook word”), and
- the user’s mapping (“you mapped ‘emphasis’ → dynamics”).

This is exactly how you keep the system “semiotically oriented” rather than “auto-compose everything”.

---

## 5) Execution: applying lyric‑scoped actions to music

### 5.1 The execution target should be spans, not bars

To “not be bars/beats-centric”, action execution should target:
- the note events whose `start` is within `ticks(Start,End)`, or
- note IDs referenced by the lyric token.

That lets the same lyric action affect:
- tracker notes (velocity column),
- piano roll notes (velocity lane),
- notation dynamics (future: convert to notated dynamic marks),
- arrangement automation (future: create automation lanes).

### 5.2 Use existing patterns: host-action events as schedulable control

There’s already a concept of arrangeable cross-card control:
- drag payload `HostActionPayload` includes scheduling (`cardplay/src/ui/drag-drop-payloads.ts`)
- the pattern editor can accept a dropped host action and inserts an event of kind `'host-action'` (`cardplay/src/ui/drop-handlers.ts`)

So one simple, consistent mechanism is:
- Prolog returns `schedule_host_action(ticks(Start, _End), host_action(...))`
- TS inserts a `'host-action'` event at `Start`

This creates a clean path for “word triggers a thing” even before you implement deep per-note rewrite logic.

---

## 6) Suggested phased plan (from simplest to richer)

### Phase A — Make lyrics exist (no AI yet)
1. `LyricsTrackAdapter` + lyric stream (copy the `ChordTrackAdapter` pattern).
2. Minimal lyrics deck: text editor → token events (verse/line parsing), list view, export/import.
3. Anchor editing: allow setting a token’s tick span (drag on timeline ruler or snap to playhead).

### Phase B — Make lyrics first-class in AI
4. Add `lyrics.pl` + loader, plus `getRecommendedLyricActions()` query wrapper.
5. Implement a small set of lyric actions: tag/color + emphasize/soften spans.
6. Add explanations + confidence (follow `explain/2` + `score/2` conventions).

### Phase C — Make it truly “semiotic”
7. Add a UI for semiotic mappings (tag → aspect → action), persisted and asserted into Prolog as facts.
8. Add style/persona defaults (e.g., “film scoring vocal” mappings can reuse film KB ideas).

### Phase D — Deep board integrations
9. Notation: render lyric underlay using `calculateLyricSyllablePlacement`.
10. Tracker: render a lyric lane/column and add “align to row” tools; later harden tracker sync to ignore unknown event kinds.
11. Session/arranger: add clip/section anchors; allow “chorus lyrics” to apply across scenes.

Each phase produces a usable feature; you don’t need to boil the ocean up front.

---

## 7) Concrete example (end-to-end)

User writes (Verse 2, line 3):
> “I can’t go home”

They select the word **“home”** (Verse 2), and tag it as:
- `tag(emphasis)`
- `tag(sorrow)`

Anchors:
- `ticks(7680, 8160)` (or derived from noteIds)

Prolog returns:
- `set_lyric_color(TokenId, '#4b89ff')` (blue = sorrow)
- `emphasize_span(ticks(7680,8160), amount(0.6))` (dynamic emphasis)
- `suggest_minor_inflection(ticks(7680,8160))` (optional harmony suggestion)

TS executes:
- update lyric event metadata/tags (for UI)
- update velocities for notes in that span (or schedule a host-action event)
- surface explanations in AI advisor / recommendations UI

The user never once touches “bar/beat”, but the implementation still uses ticks under the hood.

---

## 8) Key design decisions to lock early

1) **Separate lyric stream vs mixed streams**
   - Recommended initially: separate lyric stream (safer with current adapters).
   - Later: you can harden adapters and allow mixed streams if desired.

2) **Word vs syllable as the primitive**
   - Notation needs syllables; lyric writing wants words/lines.
   - Recommended: store tokens with optional `syllableType` and allow multiple tokens per word if syllabified.

3) **Where semantics are computed**
   - If you keep CardPlay “offline-first” and Prolog-centric, prefer Prolog for explainable heuristics.
   - If you later add LLM/NLP, keep it in TS and pass *tags/features* into Prolog; keep Prolog as the “reasoning + mapping” layer.

4) **Suggestion vs auto-apply**
   - Default: lyric-scoped HostActions are suggestions.
   - Auto-apply is a board/policy decision (gated by `ControlLevel` + tool modes in `cardplay/src/boards/types.ts`) and must remain undoable and inspectable.

5) **Namespacing is required for extension**
   - Lyric tags, derived features, and HostAction terms must be namespaced to support “infinite extensibility” without polluting core vocab.

---

## 9) Repo touchpoints (for implementation)

- Event foundation: `cardplay/src/types/event.ts`, `cardplay/src/types/event-kind.ts`, `cardplay/src/types/primitives.ts`
- Track precedent: `cardplay/src/containers/chord-track.ts`
- Notation lyric placement primitives: `cardplay/src/notation/layout.ts`
- Board/deck integration: `cardplay/src/boards/types.ts`, `cardplay/src/boards/decks/factories/*`
- Prolog runtime: `cardplay/src/ai/engine/prolog-adapter.ts`
- KB loading patterns: `cardplay/src/ai/knowledge/*-loader.ts`
- HostAction parsing/execution surface: `cardplay/src/ai/theory/host-actions.ts`, `cardplay/src/ai/knowledge/music-spec.pl`
- Existing “host-action as event” precedent: `cardplay/src/ui/drag-drop-payloads.ts`, `cardplay/src/ui/drop-handlers.ts`
- Pack/extension entrypoints: `cardplay/src/user-cards/manifest.ts`, `cardplay/src/user-cards/pack.ts`

---

## Bottom line

The simplest, most CardPlay-native path is:

1) **Add a lyrics track (events + anchors)** like the chord track.
2) **Add a lyrics deck** for editing/selecting words/lines/verses across boards.
3) **Add a Prolog lyrics KB** that emits **lyric-scoped HostActions** (tagging + span-targeted musical actions).
4) Make the system “semiotic” by letting users define **tag → aspect → action** mappings that Prolog respects.

This gives you lyrics as first-class citizens without rewriting the app around text—and it fits the existing Prolog-assisted, board-centric workflow model.
