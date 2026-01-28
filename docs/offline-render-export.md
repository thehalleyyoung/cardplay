# Offline Render + Export Formats
Assumes canonical model and terminology in `cardplay2.md` (repo root).

The Audio panel can offline-render a selection to PCM, then:

- Play it back via WebAudio
- Export it to files (best-effort)

Source of truth: `cardplay/src/ui/AudioPanel.ts`.

## Backends

- `js`: deterministic JS renderer
- `wasm`: best-effort WASM renderer (falls back if unavailable)
- `worklet`: best-effort OfflineAudioContext + synth worklet (browser-only)
- `hybrid`: tries wasm → worklet → js

## Selection modes

- `loop/selection`: current loop window (or a tick window around the playhead)
- `session`: active clips in the current session (windowed)
- `scene`: specific scene (`Container<"scene">` — see cardplay2.md §2.0.1, windowed)
- `clip`: specific clip container (`Container<"clip">` — windowed)

## Stems

Stems can be rendered:

- by `track` (one file per track)
- by `bus` (grouped by mixer track output; `master` and `bus:<id>` keys)

## WAV

WAV export supports:

- PCM16 / PCM24 / Float32
- optional dither
- optional basic noise shaping
- LIST/INFO metadata (title/artist/comment)

Implementation: `cardplay/src/audio/wav.ts`.

## MP3/OGG (MediaRecorder)

MP3/OGG export uses `MediaRecorder` and is browser-dependent:

- mime type support varies
- export is real-time (duration ≈ audio duration)

Implementation: `cardplay/src/audio/mediarecorder-export.ts`.

