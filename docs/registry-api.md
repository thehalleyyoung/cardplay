# Registry API Reference (Phase 4)
Assumes canonical model and terminology in `cardplay2.md` (repo root).

Cardplay's "registry" provides runtime schemas and definitions for the parametric type system (cardplay2.md §2.0.1):

- Event kinds (`src/registry/event-kinds.ts`) — defines payload schemas for `Event<P>`
- Port types (`src/registry/port-types.ts`) — typed ports for `Card<A,B>` morphisms
- Protocols (`src/registry/protocols.ts`)
- Adapters (`src/registry/adapters.ts`)
- Card definitions (`src/registry/cards.ts`) — defines `CardDefinition` for `Card<A,B>`

Phase 4 stretch also introduces a **registry v2 snapshot layer** with metadata, diff/merge, and pack provenance:

- `src/registry/v2/types.ts` (entry metadata model)
- `src/registry/v2/schema.ts` (versioned snapshot envelope + migrations)
- `src/registry/v2/diff.ts` (stable diff output)
- `src/registry/v2/merge.ts` (overlay merge + conflict report)
- `src/registry/v2/search.ts` (tokenized search index)
- `src/registry/v2/reports.ts` (graphs + coverage + health reports)

## Core registry: high-level

- `registerEventKind(schema)` / `listEventKinds()` / `getEventKind(kind)`
- `registerPortType(def)` / `listPortTypes()` / `getPortType(type)`
- `registerProtocol(def)` / `listProtocols()` / `getProtocol(name)`
- `registerAdapter(edge)` / `listAdapters()`
- `registerCardDefinition(def)` / `listCardDefinitions()` / `getCardDefinition(type)`

These registries are used by:
- graph compilation (`src/core/graph-compiler.ts`)
- diagnostics + report bundle (`src/core/graph-report-bundle.ts`)
- CardScript pack install (`src/ui/PackPanel.ts`, `src/runtime/pack-install.ts`)

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

