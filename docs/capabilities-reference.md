# Capabilities reference
Assumes canonical model and terminology in `cardplay2.md` (repo root).

Capabilities gate access to side-effecting host calls in CardScript packs.

See:

- `cardplay/src/extensions/capabilities.ts` (capability definitions and risk levels)
- `cardplay/src/registry/v2/policy.ts` (risk classification and enforcement)
- `cardplay/src/cardscript/sandbox.ts` (CardScript sandbox with capability checks)

## Risk tiers (policy)

- High-risk: `GraphPatch`, `ContainerWrite`, `TransportWrite`, `AssetWrite`, `UIOverlay`, `MetaTransform`, `AnalysisWrite`
- Medium-risk: `EventWrite`, `AnalysisRead`, `AssetRead`
- Low-risk: everything else

## Enforcement highlights

- Revoked packs are disabled.
- Untrusted packs are restricted (entry kinds + high-risk capabilities).
- Missing required capabilities disable entries at registry-policy time and block runtime calls at execution time.

