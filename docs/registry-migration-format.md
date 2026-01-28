# Registry Migration Format
Assumes canonical model and terminology in `cardplay2.md` (repo root).

Registry snapshots are versioned using a schema envelope:

- `schema`: string (e.g. `cardplay.registry`)
- `version`: integer
- `data`: payload

Implementation:
- `src/registry/v2/schema.ts`

## v1 (current)

`data` is a `RegistrySnapshotV2`:
- `createdAtMs`
- `entries`: list of `RegistryEntry`
- `packs`: list of `RegistryPackRecord`

## Migration strategy

Migration is designed to be:
- strict about shape (fails fast on malformed payloads)
- permissive about missing timestamps (normalized to 0)
- stable under JSON roundtrips

Future versions can add fields by:
- defaulting missing fields during migration
- avoiding breaking changes to entry ids

