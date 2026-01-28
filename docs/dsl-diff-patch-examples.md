# DSL diff/patch examples
Assumes canonical model and terminology in `cardplay2.md` (repo root).

Cardplay supports lightweight diff/patch operations over the Project DSL:

- `diffProjectDSL(a, b)` produces a list of patch ops.
- `applyProjectDLSPatch(a, ops)` applies those ops to a base DSL.
- `makeProjectDSLBundle(base, next)` produces `{ base, patch }`.
- `applyProjectDSLBundle(bundle)` reconstructs the target DSL.

## Patch op shapes

Operations are entity-oriented:

- add/update: `{ op: "add" | "update", kind: "container" | "card" | "stack", id, value }`
- remove: `{ op: "remove", kind, id }`

## Notes

- Patch application preserves existing ordering where possible; exporters/formatters should be used to produce deterministic output.
- The patch format is intentionally simple and best-effort (suitable for “small merges” and tooling integrations).

