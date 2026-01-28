# Adapter Cost Model
Assumes canonical model and terminology in `cardplay2.md` (repo root).

Adapters are edges `fromType → toType` labeled with a conversion card and a numeric `cost`. Port types follow the parametric vocabulary from cardplay2.md §2.0.1 (e.g., `EventStream<E>` is `Stream<Event<any>>`).

Implementation:
- `src/registry/adapters.ts`
- `src/core/port-conversion.ts`
- `src/registry/v2/reports.ts` (coverage matrix)

## Interpretation

- cost is additive across a multi-hop conversion path
- lower is preferred for suggestions and autofix planning

## Default costs

Builtins register:
- `EventStream → AudioBuffer` via `Render` (cost 2)
- `AudioBuffer → EventStream` via `Analyze` (cost 3)

CardScript packs can also contribute inferred adapters:
- any 1-in/1-out card with different port types contributes a cost-1 adapter edge

