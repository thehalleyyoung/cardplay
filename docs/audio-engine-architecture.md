# Audio Engine Architecture (Worklet/Graph)
Assumes canonical model and terminology in `cardplay2.md` (repo root).

Cardplay’s audio stack is intentionally **two-layer**:

1) **Scheduling layer** (transport → events → note times) — produces `Stream<Event<Voice<P>>>` (see cardplay2.md §2.0.1)
2) **DSP layer** (WebAudio graph + optional AudioWorklets)

This separation keeps deterministic offline rendering and interactive WebAudio playback aligned.

## WebAudio graph (runtime)

At runtime, the app builds a graph roughly like:

- Per-track strips:
  - `input` → `duckGain` → *(optional FX chain)* → `preFader` → `postGain` → `panner` → output bus/master
  - Sends: tapped from `preFader` or `postGain` into return buses.
  - Optional sidechain ducking: an analyser reads a source (track/bus/master) and modulates `duckGain`.
- Bus strips:
  - `input` → `postGain` → output bus/master
- Master:
  - `masterGain` → *(optional master meter worklet)* → `destination`

Source of truth: `cardplay/src/audio/webaudio-engine.ts`.

## Worklets

Cardplay uses AudioWorklets for:

- A **runtime synth** (polyphonic, voice allocation, low-latency scheduling).
- A **master meter** for RMS/peak telemetry.

Worklets are best-effort: the app falls back to JS scheduling/render paths when unavailable.

## Offline render

Offline rendering renders a selected session/scene/clip window to PCM for:

- determinism checks
- quick audio validation in the UI
- exports (WAV and browser-dependent MediaRecorder formats)

Source of truth: `cardplay/src/runtime/offline-render.ts` and `cardplay/src/runtime/audio-render.ts`.

