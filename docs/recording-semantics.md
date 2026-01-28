# Recording Semantics Reference
Assumes canonical model and terminology in `cardplay2.md` (repo root).

Recording is implemented as **event capture** into a target container (`Container<K,E>` holding a `Stream<Event<any>>` — see cardplay2.md §2.0.1).

## Modes

- `direct`: writes events directly into the target container
- `take`: writes into a take container and merges into the commit target on toggle-off

## Target selection

The recording runtime chooses a target container in this order:

1. If `mode='take'` and a take container is active: the take container
2. `recording.targetContainerId` if set
3. The UI-selected container

## Count-in

Count-in delays capture after recording is toggled on:

- `armedAtTick` stores the tick when recording was enabled
- capture starts when `transport.tick >= armedAtTick + countInBars * barTicks`

## Pre-roll

`preRollBars` is a UX-oriented setting (for “play a bit before recording starts”).

Current event-capture gating is controlled by count-in + punch; pre-roll does not change capture timing by itself.

## Punch in/out

When `punchEnabled`, capture is allowed only when:

`punchInTick <= tick < punchOutTick`

## Latency compensation

Captured event times are shifted earlier by:

`latencyCompMs` (converted to ticks based on current tempo) or `latencyCompTicks` (legacy/precomputed)

before quantization is applied.

## Quantize-on-record

- If `quantizeOnRecord=true`, newly captured events are snapped to the `quantize` grid.
- If `quantizeOnRecord=false`, events preserve the raw captured tick (after latency compensation).

## Overdub

The keyboard recording runtime always overdubs by adding events.

When `overdubEnabled=false` in `direct` mode, starting recording clears the target container first (replace semantics).
