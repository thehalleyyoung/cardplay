# Port Unification Rules
Assumes canonical model and terminology in `cardplay2.md` (repo root).

Ports are typed endpoints on cards and graphs. Port types follow the parametric type vocabulary from cardplay2.md §2.0.1 (e.g., `EventStream<E>` is `Stream<Event<any>>`). The registry defines:
- port type compatibility (subtyping)
- adapter edges (explicit conversions with cost)

Implementation:
- `src/registry/port-types.ts`
- `src/registry/adapters.ts`
- `src/core/port-conversion.ts`

## Compatibility (`compatibleWith`)

Port types can declare a zero-cost compatibility list:

- `A compatibleWith: [B]` means `A → B` is allowed without inserting adapter cards.

This is treated as a “registry conversion edge” of cost 0 in `findCheapestConversionPath()`.

## Adapters

Adapter edges are explicit conversions:

- from `EventStream` to `AudioBuffer` via card `Render` (cost 2)

The system prefers:
1. direct compatibility (cost 0)
2. cheapest adapter path (Dijkstra over a small graph)

## Cost model

Costs are additive across a multi-hop path. They are used for:
- best-effort fix suggestions
- selecting which adapters to auto-insert in a stack

