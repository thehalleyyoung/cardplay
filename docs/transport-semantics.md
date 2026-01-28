# Transport Semantics Reference
Assumes canonical model and terminology in `cardplay2.md` (repo root).

The transport slice represents **musical time** in integer ticks.

## Units

- `ppq`: ticks per quarter note (default `96`)
- `tick`: current playhead tick (integer)
- `bpm`: fallback tempo used when no tempo map is present

## Clocking

The transport clock advances `tick` while `mode='playing'`.

When tempo events (or a tempo map) exist in a scene-level timeline container, the clock consults the tempo map to compute ticks-per-second at the current tick.

## Tempo map

Tempo may be authored as:

- `tempo` events in a scene-level timeline container (`event.kind === 'tempo'` with `payload.bpm` — events are `Event<P>` with typed payload per cardplay2.md §2.0.1)
- `container.meta.tempoMap` points (optional)
- `transport.tempoMap` segments (state-level map)

Runtimes use these points when converting ticks ⇄ seconds.

## Time signatures

Meter may be authored as:

- `meter` events in a scene-level timeline container (`event.kind === 'meter'` with `payload.numerator/denominator`)
- `container.meta.timeSignatureMap` points (optional)
- `transport.timeSignatureMap` segments (state-level map)

Session metronome scheduling and quantized session launch use the time signature at the current tick:

- `beatTicks = ppq * 4 / denominator`
- `barTicks = beatTicks * numerator`

## Markers and regions

- `transport.markers`: named positions (arrangement markers)
- `transport.regions`: named ranges (arrangement regions)

## Looping

When `transport.loop.enabled`, the transport clock wraps tick progression when passing `loop.end`, preserving fractional tick continuity.

Loop controls can be expressed either as a single “set loop” action or as start/end/enabled sub-actions.
