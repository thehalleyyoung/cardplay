# Persistence Format Reference
Assumes canonical model and terminology in `cardplay2.md` (repo root).

Cardplay persists `AppState` snapshots into browser storage using a versioned **envelope**.

## Storage keys

- Baseline (default slot): `cardplay.appstate.v1`
- Slot index: `cardplay.appstate.slots.v1`
- Slot payload: `cardplay.appstate.slot.<slotId>.v1`

## Envelope V1

The persisted JSON is an object:

- `envelopeVersion`: `1`
- `schemaVersion`: integer state schema version (see `STATE_SCHEMA_VERSION`)
- `savedAt`: epoch ms
- `encoding`: `{ compression: 'none' | 'gzip', encryption: 'none' | 'aesgcm' }`
- `payload`:
  - if `encoding` is `{none,none}`: JSON string of `{ state: AppState }`
  - otherwise: base64-encoded bytes (gzip and/or AES-GCM)
- `meta` (optional): slot metadata and encryption parameters
  - `slotId`, `slotName`
  - `ivB64`, `saltB64` (for `aesgcm`)

## Compression (optional)

When `compression='gzip'`, the inner `{state}` JSON is gzipped via `CompressionStream` and stored as base64 bytes.

If `CompressionStream` is unavailable, encoding/decoding returns an error (callers can fall back to `none`).

## Encryption (optional)

When `encryption='aesgcm'`, bytes are encrypted via WebCrypto using:

- PBKDF2 (SHA-256) to derive an AES-GCM key from the passphrase
- a random `salt` (stored as base64)
- a random `iv` (stored as base64)

If WebCrypto is unavailable, encoding/decoding returns an error.

## Migration

Loading a snapshot migrates `schemaVersion` forward to the current `STATE_SCHEMA_VERSION` using a chained migration runner.

- Unknown future versions are rejected.
- Missing migration steps are rejected.
- Each step validates the output is still a valid `AppState` shape.

