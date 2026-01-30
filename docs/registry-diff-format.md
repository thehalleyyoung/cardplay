# Registry Diff Format
Assumes canonical model and terminology in `cardplay2.md` (repo root).

**Status:** Implemented  
**Real implementation:** `cardplay/src/registry/v2/diff.ts`

Registry diffs are used in debugging UI and report bundles.

Phase 4 has two layers:

1. **Core registry diff** [**Aspirational reference:** `src/registry/diff.ts` (does not exist)]
   - Would diff `eventKinds`, `portTypes`, `protocols`
   - stable ordering and deterministic output

2. **Registry v2 diff** (`src/registry/v2/diff.ts`) [**Implemented**]
   - diffs full v2 snapshots (`entries`, `packs`)
   - produces UI-friendly structured output:
     - `added`, `removed`, `changed`
     - `renamed` (best-effort)
     - `details` for changed entries

## Determinism

Diffing intentionally excludes volatile fields (timestamps) and uses stable key ordering.

## Implementation Status

✅ **Implemented:**
- `diffRegistrySnapshots()` in `src/registry/v2/diff.ts`
- Stable ordering by entry ID
- Change detection (added/removed/modified)
- Detail reporting for changed entries

⏳ **Aspirational:**
- Rename detection (best-effort heuristics)
- UI-friendly diff visualization components
- Diff merging and conflict resolution UI
