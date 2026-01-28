# Runtime execution model (graph scheduling)
Assumes canonical model and terminology in `cardplay2.md` (repo root).

## Overview

Cardplay’s Phase 4/5 runtime evaluates a stack graph over a tick window:

- **Input:** `window=[fromTick,toTick)` + `transport={bpm,ppq,tick,mode}`.
- **Compile step:** materialize executable nodes and a **topological order** from graph edges.
- **Eval step:** run each processor in topo order, producing `RuntimeValue`s keyed by `${nodeId}:${port}`.

## Deterministic scheduler rules

### Stable topo tie-breaker

Topo ordering is deterministic. When multiple nodes are runnable, ties are broken by:

1. **Lexicographic sort by `nodeId`** (only).

### Cycle detection

If the scheduler detects a cycle:

- It returns a **best-effort order** (all nodes still appear), and
- Adds an actionable diagnostic describing the cycle path and suggested fixes (remove an edge or insert an explicit delay/feedback node).

### Cached topo order (by structure hash)

Topo ordering is cached by a stable **graph structure hash** (nodes + edges). Parameter/state edits reuse the cached order.

### Batched windows (optional)

For debugging/perf experiments, the runtime can split large windows into **tick batches** and merge outputs back into a single result.

## Event ordering and capture

### Deterministic event queue

When enabled, the runtime records emitted `EventStream` events (where `EventStream<E> = Stream<Event<any>>`, see cardplay2.md §2.0.1) into a fixed-capacity ring buffer with a monotonic sequence number:

- Deterministic ordering by `seq`
- Configurable overflow strategy (`drop-oldest`, `drop-newest`, `clip`, `error`)

### Pre/post processor log (optional)

The executor can capture a compact **pre/post log** per processor:

- inputs summary (by port)
- outputs summary (by port)
- duration (ms), and error boundary notes

## Determinism guarantees + replay

### Time source abstraction

Runtime profiling and trace timestamps use a `TimeSource` abstraction so tests can swap in deterministic clocks.

### Lockstep replay (trace-based)

When `traceWindow` is enabled, the executor emits a `runtime.exec.window` trace event containing:

- window + transport
- summarized outputs (event stream hash + count; audio buffer hash + metadata)

The runtime can then rebuild the stack and re-run the same window to verify summarized outputs match.

In the UI, this is exposed in **RuntimePanel**:

- `Eval…` records a `runtime.exec.window` trace event
- `Tool -> Replay (lockstep)` replays the last recorded window and reports diffs

