# Module Map (Legacy Path Resolution)

**Status:** implemented  
**Canonical terms used:** All module paths  
**Primary code references:** `cardplay/src/**`  
**Analogy:** This is the "address translation table" for the game board—mapping old street names to current locations.  
**SSOT:** This document is the single source of truth for module path resolution. Legacy paths in docs must be mapped here.

---

## Purpose

This document maps **legacy doc paths** (paths that appear in old documentation but don't exist in the current codebase) to their **real current paths** in `cardplay/src/`. Use this when you encounter a phantom path in docs.

---

## Legacy Path Mappings

### Core Module Paths

| Legacy Doc Path | Real Current Path | Notes |
|---|---|---|
| `src/core/*` | **Does not exist** | Legacy alias; use specific `cardplay/src/` paths below |
| `src/registry/*` | **Does not exist** | Legacy alias; registries are distributed |
| `src/core/card.ts` | `cardplay/src/cards/card.ts` | Core Card<A,B> type |
| `src/core/stack.ts` | `cardplay/src/cards/stack.ts` | Composition Stack |
| `src/core/event.ts` | `cardplay/src/types/event.ts` | Event types |
| `src/core/primitives.ts` | `cardplay/src/types/primitives.ts` | Tick, PPQ, branded types |
| `src/registry/cards.ts` | `cardplay/src/cards/registry.ts` | Card registry |
| `src/registry/port-types.ts` | `cardplay/src/cards/card.ts` | PortTypes defined inline |
| `src/core/port-conversion.ts` | **Does not exist** | Aspirational; see `cardplay/src/boards/gating/validate-connection.ts` |

### State & Store Paths

| Legacy Doc Path | Real Current Path | Notes |
|---|---|---|
| `src/state/store.ts` | `cardplay/src/state/event-store.ts` | SharedEventStore |
| `src/state/clips.ts` | `cardplay/src/state/clip-registry.ts` | ClipRegistry |
| `src/state/routing.ts` | `cardplay/src/state/routing-graph.ts` | RoutingGraphStore |
| `src/stores/*` | `cardplay/src/state/*` | State stores moved |

### Board System Paths

| Legacy Doc Path | Real Current Path | Notes |
|---|---|---|
| `src/boards/store.ts` | `cardplay/src/boards/store/store.ts` | BoardStateStore |
| `src/boards/context.ts` | `cardplay/src/boards/context/store.ts` | BoardContextStore |
| `src/boards/types.ts` | `cardplay/src/boards/types.ts` | ✓ Exists |
| `src/boards/decks/*` | `cardplay/src/boards/decks/*` | ✓ Exists |
| `src/boards/gating/*` | `cardplay/src/boards/gating/*` | ✓ Exists |
| `src/boards/switching/*` | `cardplay/src/boards/switching/*` | ✓ Exists |

### AI / Prolog Paths

| Legacy Doc Path | Real Current Path | Notes |
|---|---|---|
| `src/ai/prolog.ts` | `cardplay/src/ai/engine/prolog-adapter.ts` | Prolog adapter |
| `src/ai/spec.ts` | `cardplay/src/ai/theory/music-spec.ts` | MusicSpec type |
| `src/ai/constraints.ts` | `cardplay/src/ai/theory/music-spec.ts` | Constraints are in MusicSpec |
| `src/ai/host-actions.ts` | `cardplay/src/ai/theory/host-actions.ts` | HostAction types |
| `src/ai/theory-cards.ts` | `cardplay/src/ai/theory/theory-cards.ts` | TheoryCardDef |
| `src/ai/kb/*.pl` | `cardplay/src/ai/knowledge/*.pl` | Prolog KB files |
| `@/ai/*` | `cardplay/src/ai/*` | Remove `@/` alias in docs |

### UI Paths

| Legacy Doc Path | Real Current Path | Notes |
|---|---|---|
| `src/ui/deck.ts` | `cardplay/src/ui/deck-layout.ts` | DeckLayoutAdapter |
| `src/ui/card.ts` | `cardplay/src/ui/components/card-component.ts` | UI CardComponent |
| `src/ui/stack.ts` | `cardplay/src/ui/components/stack-component.ts` | UI StackComponent |
| `src/components/*` | `cardplay/src/ui/components/*` | Components moved |

### Audio Paths

| Legacy Doc Path | Real Current Path | Notes |
|---|---|---|
| `src/audio/cards.ts` | `cardplay/src/audio/instrument-cards.ts` | Audio module cards |
| `src/audio/engine.ts` | `cardplay/src/audio/audio-engine.ts` | Audio engine (if exists) |
| `src/audio/*` | `cardplay/src/audio/*` | ✓ Exists |

### User Cards & Packs

| Legacy Doc Path | Real Current Path | Notes |
|---|---|---|
| `src/user-cards/*` | `cardplay/src/user-cards/*` | ✓ Exists |
| `src/packs/*` | `cardplay/src/user-cards/*` | Packs are in user-cards |

---

## Import Alias Resolution

| Doc Alias | Real Path Prefix | Notes |
|---|---|---|
| `@/` | `cardplay/src/` | Remove alias; use full path |
| `~/` | `cardplay/src/` | Remove alias; use full path |
| `src/` | `cardplay/src/` | Add `cardplay/` prefix |

---

## Current Module Structure

### `cardplay/src/types/`
- `event.ts` — Event<P>, EventKind
- `event-kind.ts` — EventKind registry
- `primitives.ts` — Tick, PPQ, branded types

### `cardplay/src/cards/`
- `card.ts` — Card<A,B>, PortType, PortTypes
- `stack.ts` — Stack composition
- `registry.ts` — Card registry
- `adapter.ts` — Card adapters
- `card-visuals.ts` — CardDefinition (visuals)
- `protocol.ts` — Protocol definitions

### `cardplay/src/state/`
- `event-store.ts` — SharedEventStore
- `clip-registry.ts` — ClipRegistry
- `routing-graph.ts` — RoutingGraphStore
- `types.ts` — EventStreamRecord, ClipRecord, etc.

### `cardplay/src/boards/`
- `types.ts` — Board, BoardDeck, DeckType, ControlLevel
- `store/store.ts` — BoardStateStore
- `context/store.ts` — BoardContextStore
- `context/types.ts` — ActiveContext
- `decks/` — Deck factories and types
- `gating/` — Connection validation, control levels
- `switching/` — Board switching logic
- `theme/` — Theme definitions

### `cardplay/src/ai/`
- `engine/prolog-adapter.ts` — Prolog engine adapter
- `theory/music-spec.ts` — MusicSpec, MusicConstraint
- `theory/host-actions.ts` — HostAction types
- `theory/theory-cards.ts` — TheoryCardDef
- `theory/spec-prolog-bridge.ts` — Spec→Prolog encoding
- `theory/spec-event-bus.ts` — Spec update events
- `theory/custom-constraints.ts` — Custom constraint registration
- `theory/deck-templates.ts` — AI deck templates
- `knowledge/*.pl` — Prolog KB files
- `knowledge/music-theory-loader.ts` — KB loader
- `queries/` — Query utilities
- `advisor/` — AI advisor service
- `generators/` — Melody/harmony generators

### `cardplay/src/ui/`
- `deck-layout.ts` — DeckLayoutAdapter
- `components/card-component.ts` — UI CardComponent
- `components/stack-component.ts` — UI StackComponent
- `components/arrangement-panel.ts` — Arrangement UI

### `cardplay/src/audio/`
- `instrument-cards.ts` — AudioModuleCard
- `audio-engine.ts` — Audio engine

### `cardplay/src/user-cards/`
- `manifest.ts` — Pack manifest
- `card-editor-panel.ts` — Card editor

### `cardplay/src/containers/`
- `container.ts` — Container<K,E>, Clip, Pattern, Scene

### `cardplay/src/tracker/`
- Tracker-specific modules

### `cardplay/src/notation/`
- Notation-specific modules

---

## Usage Rules

1. **Always use `cardplay/src/` prefix** in documentation
2. **Never use `src/core/*` or `src/registry/*`** — they don't exist
3. **Remove `@/` and `~/` aliases** — use full paths
4. **When path doesn't exist**, mark as "aspirational" and note what it should map to
5. **Link to this doc** when correcting legacy paths
