# Debugging
Assumes canonical model and terminology in `cardplay2.md` (repo root).

## Reports

- Graph report: shows compilation inputs, inferred stacks (`Card<A,B>` morphisms), and suggested fixes.
- Runtime panel: compiles and evaluates a stack across a tick window, producing `Stream<Event<any>>`.

## State explorer

Use the state explorer panel to inspect the current store state, including persistence and history snapshots.

## Event log

The event log captures actions, warnings, and runtime diagnostics with stable ordering where possible.

