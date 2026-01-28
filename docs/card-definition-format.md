# Card Definition Format
Assumes canonical model and terminology in `cardplay2.md` (repo root).

Card definitions are runtime-visible “types” used to build stacks/graphs.

Implementation:
- `src/core/card.ts` (types)
- `src/registry/cards.ts` (registry)
- `src/registry/builtins.ts` (built-in card definitions)
- `src/runtime/cardscript-bridge.ts` (CardScript → runtime definition bridge)

## Fields (Phase 4)

`CardDefinition` includes:
- `type`: unique string id (registry key)
- `name`: human display name
- `signature`: `{inputs, outputs}` typed ports
- optional `paramsSchema`, `defaults`
- optional `stateSchema`, `stateDefaults`
- optional `version`

## Naming conventions

- Builtins use short stable types like `Track`, `Instrument`, `AudioOut`
- CardScript packs use namespaced types like `cs:<packSlug>:<CardName>`

## Signature rules

- `inputs` / `outputs` are arrays of `{name, type}`
- port names are used in edge references in the compiled graph
- Port types use the parametric type vocabulary from cardplay2.md §2.0.1 (e.g., `EventStream<E>` is `Stream<Event<any>>`, `NoteEvent` is `Event<Voice<MIDIPitch>>`)

