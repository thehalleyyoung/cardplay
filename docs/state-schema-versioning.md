# State schema versioning + migration policy
Assumes canonical model and terminology in `cardplay2.md` (repo root).

Cardplay persists the full `AppState` (containing `Container<K,E>`, `Card<A,B>`, stacks, session, transport, recording) inside a versioned **envelope**.

There are two independent version numbers:

- **`envelopeVersion`**: the outer persistence container format (currently `1`).
- **`schemaVersion`**: the in-memory `AppState` schema version (see `STATE_SCHEMA_VERSION`).

## Goals

- Load older snapshots safely by running a deterministic migration chain.
- Validate the output after each migration step to avoid “half-migrated” states.
- Always write the latest supported format (no downgrades).
- Provide an auditable migration log (warnings/issues) for UI surfacing.

## Migration mechanics

- Migrations are single-step functions: `vN -> vN+1` (see `STATE_SCHEMA_MIGRATIONS`).
- The runner applies migrations **sequentially** until `STATE_SCHEMA_VERSION`.
- Each step:
  - coerces best-effort defaults (`coerceAppState`) to tolerate missing fields
  - validates the resulting shape (`validateAppStateShape`)
  - appends a structured log entry (`MigrationLogEntry`)
- Failures return a typed `MigrationError` including step context (`from`/`to`) when applicable.

## Read + write policy

- **Read:** imports and loads always run migrations to reach the current schema version.
- **Write:** all save paths emit `schemaVersion=STATE_SCHEMA_VERSION` and `envelopeVersion=1`.
- **Downgrades are intentionally prevented:** the app does not write older formats.

## Integrity + recovery

Snapshots may include:

- `meta.checksum`: detects corruption (checksum mismatch fails decoding)
- backup rotation: saves keep the last `N` snapshots per slot and can restore on load when the primary snapshot is corrupted

See `cardplay/src/state/persistence.ts` and `cardplay/src/state/schema.ts` for the source of truth.

## ZIP bundles

The Persistence panel also supports export/import as a `.zip` bundle (store method, best-effort). The ZIP contains:

- `slot.json`: the snapshot envelope JSON (source of truth)
- `bundle.json` (and back-compat `manifest.json`): bundle header (metadata + validation)

See `cardplay/docs/zip-bundle-format.md` for the current bundle file layout and header schema.

## Non-persisted runtime registries

Some features intentionally keep data **out of persisted `AppState`** (for now). Example:

- **User samples** imported via the **Samples** panel are stored in an in-memory registry (usable for realtime playback + offline render in the current tab), and are not included in snapshot persistence yet. Reloading clears them.
- **Sampler banks** (multi-sample instruments) created via the **Samples** panel are also in-memory only and are not persisted yet.
