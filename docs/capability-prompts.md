# Capability Prompts
Assumes canonical model and terminology in `cardplay2.md` (repo root).

CardScript packs declare requested capabilities (read/write privileges) at install time.

Implementation:
- `src/sandbox/capabilities.ts`
- `src/registry/v2/policy.ts` (risk classification)
- `src/ui/PackPanel.ts` (prompt + trust tracking + revocation toggle)

## Why prompts exist

Some capabilities are high-risk because they can mutate project state or UI:
- `GraphPatch`
- `ContainerWrite`
- `TransportWrite`
- `AssetWrite`
- `UIOverlay`
- `MetaTransform`
- `AnalysisWrite`

The Pack UI prompts users before installing a pack with high-risk capabilities.

## Gating and revocation

Registry v2 stores:
- granted capabilities per pack
- trust level per pack
- a revocation flag

This enables disabling entries from untrusted or revoked packs in tooling and reports.

