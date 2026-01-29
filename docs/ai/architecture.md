# AI Architecture (Prolog)

CardPlay’s AI layer is a **browser-friendly Prolog engine** (Tau Prolog) wrapped by a TypeScript adapter, plus a set of knowledge bases and query helpers.

The guiding constraint is: **100% offline-capable**, deterministic, and explainable (rule traces).

## Top-level structure

- Engine wrapper: `src/ai/engine/prolog-adapter.ts`
- Knowledge bases: `src/ai/knowledge/*.pl` (loaded as raw strings)
- KB lifecycle/caching: `src/ai/engine/kb-lifecycle.ts`, `src/ai/engine/kb-idb-cache.ts`
- Performance monitoring: `src/ai/engine/perf-monitor.ts`, `src/ai/engine/query-profiler.ts`
- Query helpers: `src/ai/queries/*`
- Feature modules: `src/ai/harmony/*`, `src/ai/generators/*`, `src/ai/advisor/*`, `src/ai/learning/*`

## Runtime flow

1. **Initialize adapter** (`getPrologAdapter()`).
2. **Load KBs**:
   - Preload critical KBs on startup (e.g. music theory, board layout).
   - Lazy-load optional KBs on demand.
3. **Run queries** through `PrologAdapter` helpers (`querySingle`, `queryAll`, `findAll`, `queryHostActions`, etc.).
4. **Record performance** via `PerfMonitor` and enforce budgets in tests.

## Knowledge base lifecycle

The KB lifecycle utilities provide:

- Preloading and lazy loading (`preloadCriticalKBs`, `lazyLoadKB`)
- IndexedDB caching when available (`KBCache` in `kb-idb-cache.ts`)
- Versioning and migrations (`kb-lifecycle.ts`, `kb-migration.ts`)
- Unloading predicates for optional KBs (`unloadKB`, `getUnloadableKBs`)

## Performance characteristics

The Prolog layer is expected to stay within interactive budgets:

- Query p95 budget enforced by `PerformanceBudgets` (see `kb-lifecycle.ts`)
- LRU query result caching in the adapter for repeated calls
- Query batching (`QueryBatch`) for grouped/related lookups
- Optional profiling tooling for slow predicates (`query-profiler.ts`, `slow-query-logger.ts`)

## Extending the system

### Add a new knowledge base

1. Create a `.pl` file under `src/ai/knowledge/`.
2. Create a loader that imports it as `?raw` and calls `adapter.loadProgram(...)`.
3. Add query helpers under `src/ai/queries/` (typed return objects are preferred).
4. Add tests to validate correctness and performance.

### Example: adding a new genre to the composition KB

1. Edit `src/ai/knowledge/composition-patterns.pl`:
   - Add `genre(new_genre).`
   - Add at least: `genre_tempo_range/3`, `genre_typical_instruments/2`, and one pattern fact (`drum_pattern/2`, `bass_pattern/2`, etc.).
2. Add/extend tests in the composition query suite to ensure `suggestArrangement('new_genre', ...)` and/or generator queries succeed.
3. Update docs in `docs/ai/composition-predicates.md` if you’re adding new predicate families.

### Example: adding a new voice-leading rule

1. Edit `src/ai/knowledge/voice-leading.pl`:
   - Add a predicate or rule that scores/filters voicings (e.g. discourage a specific parallel motion or register crossing).
2. Add a focused unit test in the voice-leading / harmony test suite to ensure the rule changes rankings in the expected direction.
3. If the rule is user-facing, ensure `explainGeneration()`/advisor traces still remain readable.

## Safety & offline guarantees

- KBs are bundled with the app (no runtime fetch).
- Learning is local-only by design.
- Advisor “host actions” are capability-checked and must not run destructive operations without explicit confirmation.

