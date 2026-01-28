# Project DSL import/export UI
Assumes canonical model and terminology in `cardplay2.md` (repo root).

The Persistence panel contains a **Project DSL** section for exporting/importing the project as deterministic text.

## Export

- Choose a template (`minimal` or `full`) and output mode (`compact` or `verbose`).
- Optionally enable **Include registry** for a more portable export.
- Optionally switch Export to **partial** and enter comma-separated ids for containers/stacks/cards.

Click **Generate DSL** to populate the DSL textarea.

The exported DSL contains `Container<K,E>`, `Card<A,B>`, and stack definitions (see cardplay2.md §2.0.1 for type definitions).

## Format

Click **Format DSL** to:

- parse tolerant JSON-with-comments input
- migrate older versions forward (best-effort)
- validate the result
- rewrite the textarea with deterministic formatting

## Import modes

- **Import (replace)**: replaces the project with the DSL contents.
- **Import (merge)**: adds only missing ids into the current project.
- **Import (merge overwrite)**: merges and overwrites existing ids (does not delete).

## Registry hydration

When **Hydrate registry** is enabled, importing will hydrate the current runtime registry from the DSL’s `registry` section.

- Enabling **Overwrite registry** clears existing registry entries before hydrating.

