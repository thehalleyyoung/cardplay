# Mixer Semantics Reference
Assumes canonical model and terminology in `cardplay2.md` (repo root).

This doc covers the **session mixer** behavior in Cardplay.

## Session Mixer Channels (Audio Routing)

> **Note:** The mixer uses "track" to refer to audio routing channels (gain, pan, FX). This is distinct from `Track<K, A, B>`, which is a bidirectional lens into containers (cardplay2.md §2.3). The mixer concept corresponds to "Channel" in the canonical spec (cardplay2.md §2.12).

Session mixer channels live under:

`project.session.tracks[trackId]`

Each channel has `audio` settings:

- `gain`: `0..2`
- `pan`: `-1..1`
- `waveform`: oscillator type for the simple synth
- `effects`: optional FX chain (lowpass/highpass/delay/distortion)

### FX chain editing

The FX chain is stored on the track as:

`project.session.tracks[trackId].audio.effects`

It is normalized/clamped on write (see `src/audio/track-effects.ts`).

State actions exist for convenience:

- `session.track.fx.add`
- `session.track.fx.remove`

## Buses (Groups + Returns)

Session mixer routing lives under:

`project.session.mixer`

The mixer contains:

- `buses[busId]`: `{ kind: 'group' | 'return', gain, ... }`
- `busOutputs[busId]`: routes a bus to another bus or `'master'`
- `trackOutputs[trackId]`: routes a track to a bus or `'master'`
- `trackSends[trackId][busId]`: per-track send into a **return** bus

### Routing constraints

- **No cycles** are allowed in `busOutputs` (bus -> bus -> ... -> same bus). The reducer rejects updates that would create a cycle.
- Missing/unknown routing targets are treated as `'master'`.

### Sends/returns

Sends are only valid to buses with `kind: 'return'`.

`trackSends[trackId][returnBusId]` includes:

- `level` (`0..2`)
- `preFader` (if `true`, ignores the track fader when computing send gain)

## Clip gain

Session playback uses `ContainerRef` transforms at render time:

- `clip.gain` multiplies note velocity before scheduling
- `clip.transpose` shifts pitch
- `clip.scale` time-stretches ticks (render-time)

Clip transforms are applied without duplicating events.

## Metronome / groove / humanize

These are session-level settings:

- metronome enable + gain
- groove template + amount (swing8/swing16)
- humanize seed + timing/velocity variance

Groove/humanize are applied as timing/velocity transforms at scheduling time.

## Gain staging (debug selector)

`src/state/selectors.ts` exports `selectGainStaging(state)` which computes a basic gain-staging breakdown:

- `trackToMasterGain[trackId]` = track fader * routed bus chain gains
- `trackSendToBusGain[trackId][returnBusId]` = send level * (track fader unless `preFader`)
- `trackSendToMasterGain[trackId][returnBusId]` additionally multiplies the return bus chain gains

This is a **model/debug helper** and does not guarantee full audio engine parity (e.g., pan laws, meter ballistics, limiter/clip).

## Meter smoothing helper

For UI meters, `src/state/meter-smoothing.ts` provides `smoothMeter(prev, next, dtMs, { attackMs, releaseMs })` which applies simple attack/release ballistics to RMS/peak values (`0..1`).
