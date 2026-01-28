# Stack Inference
Assumes canonical model and terminology in `cardplay2.md` (repo root).

Cardplay supports building "stacks" of cards (`Card<A,B>` morphisms — see cardplay2.md §2.1). Stack inference computes:

- A derived **stack signature** (inputs/outputs)
- A list of **issues** (missing cards, mismatched port types, unsupported layouts)
- Suggested **adapter paths** for mismatches (when available)

Primary implementation:
- `src/core/stack-inference.ts`
- `src/core/stack-inspector.ts`

## Inputs

Stack inference requires:

- A `CardStack`:
  - `cardIds` ordering
  - `compositionMode` (`serial` or `parallel`)
  - `behavior` (`layer`, `tabs`, `switch`)
  - optional `bindings` for explicit port routing
- A mapping from `cardId` → `CardDefinition`

## Serial stacks

Serial inference assumes a pipeline:

1. Start with the first card’s inputs as the stack inputs.
2. Walk adjacent pairs of cards and align ports:
   - If explicit `bindings` exist for a pair, use them.
   - Otherwise use positional matching (N inputs with N outputs).
3. For each link, validate types:
   - compatible types are ok
   - mismatched types generate issues and adapter suggestions
4. Final stack outputs are the last card’s outputs.

## Parallel stacks

Parallel inference is a “fan-out/fan-in” model:

- Stack inputs are the union of all card inputs (deduped by `(name,type)`).
- Stack outputs are the union of all card outputs.
- Issues capture cases where cards require conflicting inputs/outputs.

Parallel is useful for “layered” behavior: multiple generators that are later merged.

## Tabs / Switch stacks

Tabs/switch behavior is treated as “one of N active cards”.

- Stack inputs are the union of all card inputs.
- Stack outputs are the union of all card outputs.
- If an `activeCardIndex` is present, inference may prioritize that card for reporting.

## Adapter paths

When a mismatch is detected, inference can compute adapter paths using the adapter registry and port type compatibility:

- `src/core/port-conversion.ts`
- `src/registry/adapters.ts`

These paths are used by:
- diagnostics reports (show suggested fixes)
- stack autofix (insert real adapter cards deterministically)

