# CardScript syntax reference (Phase 9)
Assumes canonical model and terminology in `cardplay2.md` (repo root).

CardScript is a small, deterministic scripting language for creating “pack” cards.

## Comments

- Line comments: `// ...`
- Block comments: `/* ... */`

## Top-level declarations

### `card`

```cardscript
card "Name" {
  signature: { inputs: [EventStream], outputs: [EventStream] }
  params: { semitones: number }
  state: { seed: number }
  effects: { creates: [EventStream], deterministic: true }
  behavior: { transpose(in0, params.semitones) }
}
```

### `protocol`

```cardscript
protocol Renderable { toAudio(stream: Any): AudioBuffer; }
```

Protocols are used for metadata/typechecking and for registry entry generation when installed as a pack.

## Behavior blocks

Behavior is a list of host calls. Calls can refer to:

- `in0`, `in1`, ... (inputs)
- `out0`, `out1`, ... (outputs)
- `params.<name>`
- `state.<name>`

Example:

```cardscript
behavior: {
  humanize(in0, params.amount)
  gate(out0, params.probability)
}
```

## Runtime limits

The runtime enforces best-effort budgets (invocation counts and optional time budgets). Excess work is aborted with warnings, and is surfaced in trace/events.

