# Architecture

**Status:** partial (describes intended architecture; some paths are legacy aliases)  
**Canonical terms used:** Event, Card, Stack, Container, Board, BoardDeck  
**Primary code references:** `cardplay/src/types/*`, `cardplay/src/cards/*`, `cardplay/src/state/*`, `cardplay/src/boards/*`  
**Analogy:** The "game board infrastructure" describing how layers fit together.  
**SSOT:** For actual module paths, see [Module Map](./canon/module-map.md). Paths below may be legacy aliases.

---

Cardplay is split into a few layers:

## Types and Core Logic

**Actual location:** `cardplay/src/types/`, `cardplay/src/cards/`, `cardplay/src/containers/`

> **Legacy alias:** Docs may refer to `src/core/` — this path does not exist. See [Module Map](./canon/module-map.md).

Pure domain logic and data structures:

- Events and containers (`Event<P>`, `Container<K, E>` as defined in cardplay2.md §2.0.1)
- Cards, stacks, graphs (editor model + compilation inputs)
- Fix logs, diffs, reports, serialization helpers

This layer should remain deterministic and testable without the DOM or WebAudio.

## Registries

**Actual location:** Distributed across `cardplay/src/cards/registry.ts`, `cardplay/src/boards/registry.ts`, etc.

> **Legacy alias:** Docs may refer to `src/registry/` — this path does not exist. See [Module Map](./canon/module-map.md).

Registries and validators:

- Port types and protocol compatibility (`cardplay/src/cards/card.ts`)
- Adapters and conversion rules (`cardplay/src/cards/adapter.ts`)
- Card definitions and builtins (`cardplay/src/cards/registry.ts`)

## Runtime

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
