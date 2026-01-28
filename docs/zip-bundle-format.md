# ZIP Bundle Format (Persistence)
Assumes canonical model and terminology in `cardplay2.md` (repo root).

Cardplay can export/import a “slot bundle” as a `.zip` (store method; no compression) via the **Persistence** panel.

## Files

- `bundle.json`: bundle header (preferred)
- `manifest.json`: bundle header (back-compat alias)
- `slot.json`: persisted snapshot envelope JSON (the same content as “Export JSON”)
- `README.txt`: human notes (optional)

## `bundle.json` schema (v1)

```json
{
  "bundleVersion": 1,
  "kind": "cardplay-slot",
  "slotId": "default",
  "createdAt": "2026-01-26T00:00:00.000Z",
  "envelopeVersion": 1,
  "schemaVersion": 12,
  "savedAt": 1700000000000
}
```

Notes:
- `envelopeVersion` and `schemaVersion` mirror the values inside `slot.json` when available.
- Import uses `slot.json` as the source of truth and treats the header as best-effort validation.

