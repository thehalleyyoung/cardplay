# SSOT Stores

**Status:** implemented  
**Canonical terms used:** SharedEventStore, ClipRegistry, RoutingGraphStore, BoardStateStore, BoardContextStore, MusicSpec  
**Primary code references:** `cardplay/src/state/*`, `cardplay/src/boards/store/*`, `cardplay/src/boards/context/*`, `cardplay/src/ai/theory/music-spec.ts`  
**Analogy:** The "game state containers" that hold the canonical truth for each data kind.  
**SSOT:** This document defines which store is authoritative for each data kind.

---

## SSOT Store Map

| Data Kind | Canonical Store | Location | Must Be Treated As SSOT By |
|---|---|---|---|
| Event streams + events | `SharedEventStore` | `cardplay/src/state/event-store.ts` | Tracker, notation, session editors, AI fact extraction |
| Clip definitions / placement | `ClipRegistry` | `cardplay/src/state/clip-registry.ts` | Session/arranger UIs, renderers |
| Routing graph | `RoutingGraphStore` | `cardplay/src/state/routing-graph.ts` | Routing deck, audio engine |
| Board preferences/layout | `BoardStateStore` | `cardplay/src/boards/store/store.ts` | Board UI shell, persistence |
| Active selection/context | `BoardContextStore` | `cardplay/src/boards/context/store.ts` | All boards/decks |
| Declarative spec | `MusicSpec` | `cardplay/src/ai/theory/music-spec.ts` | Theory cards, Prolog bridge |

---

## Store Details

### SharedEventStore

**Location:** `cardplay/src/state/event-store.ts`

**Owns:** `EventStreamRecord[]` — all event streams and their events.

**Canonical types:** `EventStreamRecord`, `Event<P>` from `cardplay/src/state/types.ts`

---

### ClipRegistry

**Location:** `cardplay/src/state/clip-registry.ts`

**Owns:** `ClipRecord[]` — clip definitions referencing event streams.

**Canonical types:** `ClipRecord` from `cardplay/src/state/types.ts`

---

### RoutingGraphStore

**Location:** `cardplay/src/state/routing-graph.ts`

**Owns:** `RoutingNodeInfo[]`, `RoutingEdgeInfo[]` — signal flow graph.

---

### BoardStateStore

**Location:** `cardplay/src/boards/store/store.ts`

**Owns:** `BoardState`, `LayoutState` — board preferences and deck layout.

---

### BoardContextStore

**Location:** `cardplay/src/boards/context/store.ts`

**Owns:** `ActiveContext` — current selection, cursor, active items.

---

### MusicSpec (No Global Store Yet)

**Location:** `cardplay/src/ai/theory/music-spec.ts`

**Note:** MusicSpec is currently serialized into Prolog facts per query. No single global MusicSpec store exists yet—spec state is managed by theory cards and the spec event bus.

**Update triggers:** `cardplay/src/ai/theory/spec-event-bus.ts`

---

## Rules

1. **One SSOT per data kind** — Don't create parallel stores
2. **Derived caches must sync** — Any derived state must update from SSOT
3. **Mutations go through SSOT** — Don't mutate copies; update the canonical store
4. **AI reads SSOT, writes HostActions** — Prolog doesn't mutate stores directly
