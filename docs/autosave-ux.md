# Autosave UX + failure modes
Assumes canonical model and terminology in `cardplay2.md` (repo root).

Autosave is intentionally **best-effort** and **non-blocking**: it should help you not lose work without getting in the way of editing.

## What autosave does

- Tracks whether the in-memory project has changed since the last successful save (`isDirty`).
- Debounces saves to avoid writing on every tiny edit.
- Saves into the currently selected persistence slot (or the default slot).

## Status model

Autosave status is modeled as a simple UI state machine:

- `idle`: nothing pending
- `saving`: a save is in progress
- `saved`: the last save succeeded
- `error`: the last save failed

## Failure modes

- **Storage quota reached**: saves fail; the UI should warn when approaching quota.
- **Encryption passphrase missing/incorrect**: encrypted loads/imports fail to decode.
- **Integrity checksum mismatch**: snapshot is treated as corrupted; the loader tries backups.
- **Slot conflicts**: if another tab overwrote a slot, saves should detect conflicts (unless forced).

## Recovery

- **Retry save**: UI should offer a one-click retry when status is `error`.
- **Restore from backup**: if a snapshot is corrupted, load attempts fall back to the most recent backup and restore it.
- **Save As…**: if in read-only mode (or to avoid overwriting), write to a new slot.

