# KB Architecture & Extension Points

CardPlay’s AI system is structured as:

1. **Prolog engine adapter** (Tau Prolog wrapped by TypeScript)
2. **Static knowledge bases** (`.pl` files bundled via `?raw`)
3. **Dynamic knowledge bases** (facts asserted/retracted at runtime)
4. **Query wrappers** (TypeScript functions that call Prolog predicates)

## KB loading tiers

The KB lifecycle code distinguishes:

- **Critical KBs** (preloaded): e.g. music theory, board layout
- **Standard KBs** (loaded for most AI features)
- **Optional KBs** (lazy-loaded): e.g. learning/adaptation

See: `src/ai/engine/kb-lifecycle.ts`

## Loader pattern (important for tests/workers)

Each KB has a loader module (e.g. `src/ai/knowledge/workflow-planning-loader.ts`) that:

- Imports a `.pl` file via `?raw`
- Loads it into a specific `PrologAdapter` instance
- Tracks loaded state **per adapter** (so multiple adapters don’t conflict)

## Dynamic KBs (learning/adaptation)

Some KBs declare predicates as `dynamic/1` and are populated at runtime:

- `src/ai/knowledge/user-prefs.pl` is populated from `src/ai/learning/user-preferences.ts` via `syncPreferencesToKB()`.
- `src/ai/knowledge/project-analysis.pl` can be driven by injected project snapshots via `analyzeProject()`.

Dynamic KBs are updated via `assertz/1` and `retractall/1` through the adapter.

## Extension points

### Add a new KB

1. Create a new `.pl` file under `src/ai/knowledge/`.
2. Create a loader module that imports the KB via `?raw` and calls `adapter.loadProgram(...)`.
3. Add it to the appropriate tier in `src/ai/engine/kb-lifecycle.ts` (critical/standard/optional).
4. Add query wrappers in `src/ai/queries/` for the predicates you want to expose.
5. Add at least one test that loads the KB and runs representative queries.

### Add new predicates to an existing KB

- Keep atoms valid for Tau Prolog: ASCII-only, no leading digits (avoid tokens like `16_bars`), and prefer snake_case.
- If you introduce runtime facts, declare them with Tau Prolog compatible directives (e.g. `:- dynamic(foo/2).`).

