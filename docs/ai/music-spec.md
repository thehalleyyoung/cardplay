# MusicSpec (Branch C): Canonical Musical Intent

`MusicSpec` is the canonical, **type-safe representation of musical intent** used to keep:
- UI-level “theory controls” (cards / decks)
- Prolog knowledge base reasoning
- generators / analyzers

in sync.

In Branch C, the goal is *one* coherent contract that can round-trip between:
- TypeScript objects (`MusicSpec`, `MusicConstraint`)
- Prolog facts (`spec_*`, `spec_constraint/4`)
- Prolog terms (`music_spec/7` for inline stateless queries)
- explainable recommendations (`recommend_*`, `explain_*`, `spec_lint`, `spec_autofix`)

## Where does this knowledge live? (C020–C021)

CardPlay keeps Prolog knowledge **layered**:

- **Music theory KB**: pitch, scales/modes, chords, computational models, world-music scaffolding.
  - Loaded by: `src/ai/knowledge/music-theory-loader.ts`
  - Files: `src/ai/knowledge/music-theory*.pl` + `src/ai/knowledge/music-spec.pl`
- **Composition patterns KB**: patterns and style idioms used by generators.
  - Loaded by: `src/ai/knowledge/composition-patterns-loader.ts`
- **Deck/board reasoning KB**: card/deck/board recommendation logic.
  - See: `docs/ai/prolog-deck-reasoning.md`

Rule of thumb:
- If it’s about *music itself* (notes/chords/ragas/schemata, scoring, similarity) → music theory KB.
- If it’s about *how to generate* (pattern libraries, motifs, fills) → composition patterns KB.
- If it’s about *workflow/UI composition* (deck templates, board switching) → deck/board KB.

## Card params → Prolog facts (C022)

The Prolog engine is driven by **facts**, not by ad-hoc string concatenation.

The canonical “spec as facts” encoding is:
- Core fields:
  - `spec_key/3`, `spec_meter/3`, `spec_tempo/2`, `spec_tonality_model/2`, `spec_style/2`, `spec_culture/2`
- Constraints:
  - `spec_constraint(SpecId, ConstraintTerm, hard|soft, Weight)`

TypeScript encodes a spec into those facts via:
- `src/ai/theory/spec-prolog-bridge.ts`
  - `specToPrologFacts(spec, specId)`
  - `specToPrologTerm(spec)` (inline `music_spec/7` form)

Queries that need a spec context use `withSpecContext` in:
- `src/ai/queries/spec-queries.ts`

### Scoped querying (stateless mode)

To avoid leaking facts across queries, stateless mode uses:
- `spec_push/1` and `spec_pop/1` (in `src/ai/knowledge/music-spec.pl`)

This snapshots the current `spec_*` facts, clears them, asserts the requested spec, runs the query, then restores.

## Prolog → HostActions (C023)

Prolog communicates recommended changes back to the host (TypeScript) as **action terms**.

Two key entrypoints:
- `recommend_action/3` → collected by `all_recommended_actions/1`
- `spec_autofix/3` → maps lint warnings to fix actions

TypeScript parses these into typed actions:
- `src/ai/theory/host-actions.ts`
  - `parseHostActionFromPrologTerm(...)`
  - helpers like `applyActionToSpec(...)`

## Invariants, conflicts, lint, and autofix (C006, C048–C050, C118–C121)

Cross-card/spec consistency is enforced via:
- `spec_conflict/3` (in `music-spec.pl`) — *why these constraints clash*
- `spec_lint/2` (in `music-spec.pl`) — *warnings/errors with severities*
- `spec_autofix/3` (in `music-spec.pl`) — *suggest fixes as HostActions*

TypeScript wrappers:
- `detectSpecConflicts(spec, ...)`
- `lintSpec(spec, ...)`
- `suggestSpecAutofix(spec, ...)`

## Conventions: explainability and scoring (C024–C026)

Conventions used throughout the KB:
- Explanations are returned as lists (often `because(Reason)` terms).
- Confidence is treated as either a float in `0..1` (Prolog-side) or an integer `0..100` (UI/TS-side).
- Scores should be comparable across candidates when exposed to UI; prefer normalizing into `0..100`.

For deck/board reasoning conventions, see `docs/ai/prolog-deck-reasoning.md`.

