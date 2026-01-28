# Architecture
Assumes canonical model and terminology in `cardplay2.md` (repo root).

Cardplay is split into a few layers:

## `src/core/`

Pure domain logic and data structures:

- Events and containers (`Event<P>`, `Container<K, E>` as defined in cardplay2.md §2.0.1)
- Cards, stacks, graphs (editor model + compilation inputs)
- Fix logs, diffs, reports, serialization helpers

This layer should remain deterministic and testable without the DOM or WebAudio.

## `src/registry/`

Registries and validators:

- Port types and protocol compatibility
- Adapters and conversion rules
- Card definitions and builtins

## `src/runtime/`

Graph execution:

- Processor registry (builtins + dynamic)
- Executor (tick window evaluation)
- CardScript runtime bridge

## `src/state/`

App state and persistence:

- Reducer + store
- Undo/redo history
- Autosave and persistence helpers

## `src/ui/`

Panels and workbench layout. UI renders from state selectors and dispatches actions.

## `src/audio/`

WebAudio integration:

- WebAudio host engine
- Offline render helpers

## `src/sandbox/`

CardScript language and pack loading with capability gating.
