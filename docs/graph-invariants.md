# Graph Invariants
Assumes canonical model and terminology in `cardplay2.md` (repo root).

These invariants define what “a valid graph” means in Cardplay. They’re enforced in various places:
- `src/core/graph-validator.ts`
- `src/core/graph-normalizer.ts`
- `src/core/project-graph-runtime.ts`

## Structural invariants

- Every edge references existing nodes (`edge.from.nodeId`, `edge.to.nodeId`).
- Every edge references existing ports for its endpoints.
  - Ports can come from:
    - the node’s explicit `node.ports` (virtual stack IO, merge nodes), or
    - the node’s `CardInstance` + `CardDefinition` signature.
- Edge direction is correct:
  - `from` must be an output port, `to` must be an input port.

## Type invariants

- Port types must be compatible (using the parametric type vocabulary from cardplay2.md §2.0.1):
  - exact match, or
  - `compatibleWith` relationship in the port type registry, or
  - an explicit adapter path that is materialized (as real cards in a stack or graph).

## Fan-in invariants

- A normal input port should have at most one incoming edge.
- If there are multiple incoming edges into a single input, the fan-in must be made explicit:
  - by inserting a merge node/card (e.g. `MergeEventStream`, `MergeAudioBuffer`, etc).

## “Synthetic” nodes

Some fix passes introduce synthetic/virtual nodes:
- Merge nodes (`kind: 'merge'`, `cardId` like `merge:<MergeType>:<toNodeId>:<port>`)
- Adapter nodes (historical; preferred path is stack-level autofix that inserts real adapter cards)

These should be **materialized** into real card instances when persisting the graph or running runtime compilation:
- `materializeMergeNodes()`
- `materializeSyntheticAdapters()`

## Normalization invariants

Normalization can be applied defensively before diffing/reporting:
- Remove edges referencing missing nodes.
- Remove nodes with invalid `cardId`.
- Deduplicate identical edges (same `from` and `to`).
- Stabilize ordering (sorted nodes/edges).

This keeps reports deterministic and reduces noise in diffs/snapshots.

