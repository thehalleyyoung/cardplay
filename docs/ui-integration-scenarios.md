# UI Integration Scenarios (Golden Paths)
Assumes canonical model and terminology in `cardplay2.md` (repo root).

This page documents end-to-end user flows that touch **UI + state + core graph** (using the parametric types from cardplay2.md §2.0.1: `Container<K,E>`, `Card<A,B>`, `Stream<Event<any>>`).

## Scenario A: “Hello stack” → hear audio

1. Open the app and start Audio in the **Audio** panel.
2. In **Getting Started**, load the demo project (or ensure a starter session).
3. Verify the **Session** grid has a scene/clip and a selected slot.
4. Verify the project has a serial stack that ends in `AudioOut`.
5. In **Runtime**, compile the selected stack runtime and run a short eval window.
6. Confirm audio outputs and the event log shows no critical errors.

Expected integration points:
- UI triggers a state change (project/session selection).
- Runtime compilation uses `ensureProjectGraph()` and `compileStackRuntime()`.
- Audio engine uses the compiled runtime output and transport clock.

## Scenario B: Graph diagnostics → apply fixes → re-run

1. Open **Graph Report**.
2. Switch view to **Lint** and confirm adapter/merge suggestions appear for problems.
3. Switch view to **Fix Plan** and confirm planned operations are present.
4. Click **Apply fixes** (project mutation) and verify the graph changes.
5. Switch view to **Report** and verify warnings are reduced.
6. (Optional) Click **Materialize graph artifacts** to convert merge/synthetic nodes.

Expected integration points:
- `buildGraphReportBundle()` generates snapshots, diffs, lint, and fixes.
- `applyGraphFirstStackAutoFix()` can be used for “graph-first” deterministic updates.
- `materializeMergeNodes()` / `materializeSyntheticAdapters()` remove synthetic nodes and reify stacks.

## Scenario C: Compile performance debugging

1. Open **Compile Trace**.
2. Click **Run trace** and inspect:
   - JSON trace output
   - flamegraph collapsed stack output
   - flamegraph tree viewer
3. If compilation feels slow, focus a single stack and re-run.
4. Export the JSON and flamegraph output for offline profiling tools.

Expected integration points:
- `compileProjectGraphWithTrace()` emits structured spans.
- UI renders a span-tree viewer for human inspection and exports artifacts.

## Scenario D: Persistence export/import sanity

1. Open **Persistence**.
2. Export state to JSON.
3. Reload the page and import the JSON.
4. Confirm stacks, session grid, and cards are restored.

Expected integration points:
- State persistence is versioned independently from core graph/schema versioning.
- Exported JSON should remain parseable across small schema changes (via migrations).

