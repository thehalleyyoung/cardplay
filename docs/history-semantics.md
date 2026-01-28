# History Semantics Reference
Assumes canonical model and terminology in `cardplay2.md` (repo root).

Cardplay history is a **linear** sequence of state transitions.

## Model

- Each dispatched action is reduced into a `HistoryEntry`:
  - `before` / `after` snapshots
  - `changedKeys` summary
  - `patches`: structural diff patches (`set` / `delete`) rooted at `$`
  - optional commit metadata: `label` and `source`
- `history.cursor` points to the “current” state after applying entries `0..cursor-1`.

Undo/redo move the cursor backward/forward.

## Branching (undo then edit)

History is stored as a **linear** sequence, but it still supports the typical “branching” UX:

- If you **undo** to an older cursor and then dispatch a new action, the store truncates all “future” entries.
- As a result, redo is no longer available (classic editor behavior).

## Groups

The store supports optional action groups:

- `dispatchGroup(actions, {label})` tags entries with a `groupId` and optional `groupLabel`.
- Undo/redo group operations move the cursor to group boundaries.

## Coalescing

Certain noisy actions (selection changes, scrubbing) can be **coalesced** into a single history entry when they occur close together.

This keeps undo/redo usable during drag-like interactions.

## Checkpoints

The store supports named checkpoints:

- Create a checkpoint at the current cursor.
- Jump to a checkpoint to time-travel back to that cursor.

## Scrubbing and diffing

The UI can jump to any cursor (timeline scrubbing).

Diff between two cursors is produced by patching:

- `diffAppStateToPatches(before, after)` creates a patch list rooted at `$`.
- The debug UI can export this patch list as JSON and re-apply it using a “patch apply” action.

Patch application is best-effort and designed for debugging and small workflows, not as a conflict-free merge system.
