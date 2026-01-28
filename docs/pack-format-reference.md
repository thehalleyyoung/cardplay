# Pack format reference (Phase 9)
Assumes canonical model and terminology in `cardplay2.md` (repo root).

This describes the `CardPackManifest` envelope used by the loader to install `Card<A,B>` definitions (cardplay2.md §2.1).

Source of truth:

- `cardplay/src/sandbox/packs/manifest.ts`
- `cardplay/src/sandbox/packs/versioning.ts`
- `cardplay/src/sandbox/packs/signing.ts`

## Manifest fields

- `schemaVersion` (semver): manifest schema version (not the pack’s `version`)
- `packId` (string, optional): stable identifier
- `name` (string)
- `version` (semver): pack version
- `entry`:
  - `kind`: currently only `cardscript`
  - `source`: CardScript source string
- `capabilities` (optional): requested capabilities
- `dependencies` (optional): best-effort dependency list `{ packId, range }`
- `signature` (optional):
  - `sha256`: integrity signature with `contentHashHex`
  - `ed25519`: signature over `contentHashHex` (best-effort; environment dependent)

## Versioning

Missing `schemaVersion` is treated as legacy `0.1.0` and migrated forward.

