# Host surface reference (CardScript)
Assumes canonical model and terminology in `cardplay2.md` (repo root).

This document describes the host-call surface (what a CardScript `behavior` can invoke) and the capability gates.

Source of truth:

- `cardplay/src/sandbox/cardscript/host-api.ts` (capability requirements)
- `cardplay/src/sandbox/cardscript/host-surface.ts` (shape documentation)
- `cardplay/src/runtime/cardscript-exec.ts` (best-effort execution semantics)

## Calls (selected)

- `transpose(in0, semitones)`
- `quantize(in0, gridTicks)`
- `humanize(in0, amountTicks)`
- `gate(in0, probability01)`
- `merge(in0, in1)` / `concat(in0, in1)`
- `emitEvents([...])`
- `emitAudio(buffer)`
- `readContainer(containerId)` (gated)
- `readTransport()` (gated)
- `logInfo(msg, data)` (gated)

When a call requires a capability that is not granted, it is blocked and a capability prompt is recorded.

