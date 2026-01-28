# Project DSL schema (v0.2)
Assumes canonical model and terminology in `cardplay2.md` (repo root).

This document describes the **Project DSL** format used by Cardplay for project-level import/export. The DSL is a **JSON-based** schema; the UI accepts a tolerant “JSON-with-comments” superset, but the model is standard JSON.

For external tooling, a JSON Schema is provided in `cardplay/docs/project-dsl-0.2.schema.json`.

## Top-level shape

- `version` (string): schema version. Current: `0.2`.
- `metadata` (object): `{ id, name }`
- `containers` (array): event containers (`Container<K,E>` — patterns/scenes/clips/etc., see cardplay2.md §2.0.1)
- `cards` (array): card instances (`Card<A,B>` morphisms)
- `stacks` (array): stack definitions referencing `cards`

Optional:

- `graph` (object): project graph (when present)
- `graphPatches` (array): graph patch log (when present)
- `fixLog` (array): fix log entries (when present)
- `registry` (object): snapshot of event kinds / port types / protocols
- `reports` (any): optional embedded reports payload
- `audioRender` (object): optional export/render configuration snapshot

## Validation vs lint

- Validation (`src/dsl/schema.ts`) catches structural problems (missing metadata, missing card references, invalid registry entries, broken graph edges).
- Lint (`src/dsl/lint.ts`) emits best-practice warnings (missing registry snapshot, unused cards, duplicates, etc.).

## Versioning

The system accepts older versions and migrates them forward (best-effort) before importing. See `src/dsl/migrations.ts`.

