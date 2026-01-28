# Registry Diff Format
Assumes canonical model and terminology in `cardplay2.md` (repo root).

Registry diffs are used in debugging UI and report bundles.

Phase 4 has two layers:

1. **Core registry diff** (`src/registry/diff.ts`)
   - diffs `eventKinds`, `portTypes`, `protocols`
   - stable ordering and deterministic output

2. **Registry v2 diff** (`src/registry/v2/diff.ts`)
   - diffs full v2 snapshots (`entries`, `packs`)
   - produces UI-friendly structured output:
     - `added`, `removed`, `changed`
     - `renamed` (best-effort)
     - `details` for changed entries

## Determinism

Diffing intentionally excludes volatile fields (timestamps) and uses stable key ordering.

