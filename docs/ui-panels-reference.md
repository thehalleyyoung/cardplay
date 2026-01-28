# UI Panels (Reference)
Assumes canonical model and terminology in `cardplay2.md` (repo root).

Panels are shown/hidden from the sidebar. You can also pin panels (star icon) and drag/drop panel toggles to reorder or dock between columns.

Topbar:
- **Layout**: export/import/reset panel layout (localStorage-backed)

## Core

- **Getting Started**: beginner checklist + demo project.
- **Session**: scenes (`Container<"scene">`)/tracks/slot grid + launch quantize.
- **Session Inspector**: selected slot details + quick actions.
- **Mixer**: track gain/pan (mixer channels, not `Track<K,A,B>` lenses), buses/sends, metronome + groove/humanize.
- **Samples**: builtin sample library + import user samples, create Sampler banks (multi-sample keyzones), audition/copy ids.
- **Tracker**: tick-grid event editor (note-centric, editing `Event<Voice<P>>`).
- **Clip Editor**: step-grid note toggles (clip-centric).
- **Event Palette**: create arbitrary event kinds (non-note `Event<P>` payloads).
- **Card Library**: browse card definitions (`Card<A,B>`), favorites/recents, add to stacks.
- **Card Details**: inspect/edit a card instance (JSON params), copy, jump to stack.

## Runtime / Diagnostics

- **Runtime**: compile/eval stack runtimes, view logs, prompts, traces.
- **Profiler**: best-effort UI/runtime perf sampling.
- **Graph Report**: graph diagnostics + apply fixes / materialize artifacts.
- **Compile Trace**: compilation trace + flamegraph tree.
- **Event Log**: structured log stream (virtualized list).
- **State Explorer / History / Persistence**: state inspection, history checkpoints, save/load/export.
- **Registry Browser**: registry explorer v2 as a normal panel.
- **Protocols & Ports / Adapters Inspector / Merge Inspector**: registry report wrappers.

## Sandbox / Packs

- **Card Packs**: install/import/export packs, manage permissions, view audit logs.
- **CardScript Debugger**: CardScript instrumentation config, breakpoints, and trace/profile views.

## Editing / Advanced

- **Arrangement**: experimental session timeline view.
- **Piano Roll**: note rectangles + drag/resize/select (clip view).
- **Notation**: simple staff-like view (clip view).
- **Automation Lanes**: edit session-level automation lanes.
- **Modulation**: inspect Control-emitting cards and tweak params.
- **Take Tools**: trim/stretch/comp take containers.
- **Tempo & Meter**: edit transport maps.

## Audio Analysis

- **Audio Scope**: oscilloscope view of master output (freeze).
- **Audio Spectrum**: magnitude spectrum view of master output (smoothing).
- **Audio Loudness**: master meter telemetry view (hold/decay).
- **Audio Routing**: best-effort audio routing/telemetry view.

## Export & Render (NEW)

- **Render Dialog**: Comprehensive render settings with format, quality, and metadata options
- **Export Stems**: Export each track as a separate WAV file for mixing in external DAWs
- **Export Clip**: Export a single clip as an audio file
- **Export Scene**: Export a complete scene with all tracks as audio
- **Export Selection**: Export a custom time range from the session

## Panel Tips

- **Double-click** a panel title to maximize it (exit with `Escape`)
- **Drag** panel toggle buttons in sidebar to reorder
- **Star icon** on panels marks them as pinned (always visible)
- **Right-click** panels for context menu (future)
- Use `Ctrl/Cmd` + number keys for quick panel switching

## Panel Best Practices

1. **Getting Started** - Use for initial orientation and demo projects
2. **Session + Mixer** - Core workflow for clip launching and mixing
3. **Tracker or Clip Editor** - Choose based on preference (grid vs. step-sequencer)
4. **Stack Builder** - Build signal chains and effect racks
5. **Graph Report** - Debug and optimize graph compilation
6. **Audio** - Control playback, render, and audio I/O settings
7. **Samples** - Manage sample library and Sampler banks
8. **Command Palette** - Quick access to all actions without mouse
