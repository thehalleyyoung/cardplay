# Registry API Reference (Phase 4)
Assumes canonical model and terminology in `cardplay2.md` (repo root).

**Status:** Mix of implemented and aspirational  
**Real implementation:** `cardplay/src/extensions/registry.ts` and `cardplay/src/registry/v2/*`

Cardplay's "registry" provides runtime schemas and definitions for the parametric type system (cardplay2.md §2.0.1):

- Event kinds (`src/types/event-kind.ts`) — defines payload schemas for `Event<P>` [**Implemented**]
- Port types (`src/cards/card.ts`) — typed ports for `Card<A,B>` morphisms [**Implemented**]
- Protocols (`src/cards/protocol.ts`) — port protocol definitions [**Implemented**]
- Adapters (`src/cards/adapter.ts` + `src/boards/gating/port-conversion.ts`) — port type adapters [**Implemented**]
- Card definitions (`src/cards/card.ts` + `src/cards/registry.ts`) — defines `CardDefinition` for `Card<A,B>` [**Implemented**]

Phase 4 stretch also introduces a **registry v2 snapshot layer** with metadata, diff/merge, and pack provenance:

- `src/registry/v2/types.ts` (entry metadata model) [**Implemented**]
- `src/registry/v2/schema.ts` (versioned snapshot envelope + migrations) [**Implemented**]
- `src/registry/v2/diff.ts` (stable diff output) [**Implemented**]
- `src/registry/v2/merge.ts` (overlay merge + conflict report) [**Implemented**]
- `src/registry/v2/search.ts` (tokenized search index) [**Aspirational**]
- `src/registry/v2/reports.ts` (graphs + coverage + health reports) [**Partial - see scripts/registry-report.ts**]

## Core registry: high-level

**Implemented APIs:**
- `registerEventKind(schema)` / `listEventKinds()` / `getEventKind(kind)` → `src/types/event-kind.ts`
- `registerPortType(def)` / `listPortTypes()` / `getPortType(type)` → `src/cards/card.ts`
- `registerCardDefinition(def)` / `listCardDefinitions()` / `getCardDefinition(type)` → `src/cards/registry.ts`

**Aspirational APIs:**
- `registerProtocol(def)` / `listProtocols()` / `getProtocol(name)` → Protocol registry not yet centralized
- `registerAdapter(edge)` / `listAdapters()` → Adapter registry exists but no formal registration API

These registries are used by:
- graph compilation (`src/state/routing-graph.ts`) [**Implemented**]
- diagnostics + report bundle (`scripts/registry-report.ts`) [**Implemented**]
- CardScript pack install (`src/extensions/registry.ts`) [**Implemented**]

## Registry v2 snapshots

Registry v2 is a **metadata + tooling layer** over the concrete runtime registries.

Key concepts:
- `RegistryEntry` = `(kind, key, value) + meta` with a stable `id`
- `RegistryPackRecord` = a pack’s trust, caps, and revocation state
- `RegistrySnapshotV2` = `{ entries, packs }`

Snapshots are intended for:
- diff/merge tooling (UI-friendly)
- stable exports for external tooling
- tracking provenance/trust/capability gating

