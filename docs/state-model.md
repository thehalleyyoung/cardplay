# State Model Reference
Assumes canonical model and terminology in `cardplay2.md` (repo root).

This doc describes the **Phase 6+** `AppState` shape used by the in-memory store, history, and persistence.

## Top-level

`AppState` is intentionally small and split into slices:

- `project`: musical + graph content (containers, cards, stacks, session)
- `ui`: view state and selections
- `transport`: playhead and clock configuration
- `recording`: recording and input-capture configuration

## `project`

The `project` slice is the user-authored content.

Key concepts:

- **Containers**: `project.containers[containerId]` hold `Stream<E>` timelines—ordered event arrays (`E[]` where `E extends Event<any>`) containing notes and non-note events. (See cardplay2.md §2.0.1 for type definitions.)
- **Session**: `project.session` is the scene/track grid and launch state used by session playback.
- **Graph**: optional graph stack execution and runtime values (Phase 4/5+).

Practical note: UI and runtime modules often treat `project` as the only “creative” content that should mark autosave as dirty.

## `ui`

The `ui` slice is navigational state:

- `ui.mode`: overall UI layout mode
- `ui.selection`: selected container/card/stack/session-slot
- `ui.view.playback`: playback mode toggles (`session` vs `graph`)

The store tries to avoid autosaving “selection churn” (see autosave logic).

## `transport`

The `transport` slice is the playhead:

- `tick`: integer tick position
- `ppq`: ticks per quarter note (default `96`)
- `bpm`: fallback tempo (used when no tempo map is present)
- `mode`: `playing` / `stopped`
- `loop`: loop range config

Tempo/meter maps can be authored as events (or metadata) in a **scene-level timeline container** and are consulted by runtimes.

## `recording`

The `recording` slice controls capture:

- `enabled`: whether recording capture is on
- `mode`: `direct` vs `take`
- `targetContainerId`: where new events are written (else selected container)
- `quantize`: tick grid for note start/end
- `keyboardEnabled`: whether the keyboard keymap is active
- `countInBars`, `armedAtTick`: count-in gating
- `punchEnabled`, `punchInTick`, `punchOutTick`: punch range gating
- `overdubEnabled`: currently informational (runtime always overdubs)
- `latencyCompTicks`: capture-time shift earlier in ticks

In `take` mode, recorded content is accumulated into a take container and then committed into the target on toggle-off.

