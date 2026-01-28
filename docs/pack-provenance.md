# Pack Provenance
Assumes canonical model and terminology in `cardplay2.md` (repo root).

Card packs can install new card types at runtime using CardScript.

Implementation:
- `src/ui/PackPanel.ts`
- `src/runtime/pack-install.ts`
- `src/registry/v2/types.ts` (`RegistryEntryProvenance`)

## Provenance model

Registry v2 entries include:
- `meta.provenance.source`: `builtin` / `dsl` / `pack`
- for packs:
  - `packId`
  - `packName`
  - `packVersion`

This enables:
- listing what a pack installed (cards, protocols, inferred adapters)
- conflict reporting when multiple packs define the same ids
- gating/permissions UI (trust + capabilities)

