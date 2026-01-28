# CardScript types reference (Phase 9)
Assumes canonical model and terminology in `cardplay2.md` (repo root).

CardScript uses a minimal type language to typecheck card signatures and protocol method signatures. These simplified types bridge to the full parametric type system in cardplay2.md §2.0.

## Built-in types (current)

| CardScript Type | Parametric Type (cardplay2.md) |
|-----------------|-------------------------------|
| `EventStream` | `Stream<Event<any>>` (alias: `EventStream<E>`) |
| `AudioBuffer` | Audio sample data |
| `Control` | Modulation/automation control signal |
| `Any` | Top type (wildcard) |

## Convenience aliases in signatures

When CardScript ports use types like `NoteEvent` or `ChordEvent`, these map to parametric forms:

- `NoteEvent` → `Event<Voice<MIDIPitch>> & { kind: "note" }` (cardplay2.md §2.0.9)
- `AutomationEvent` → `Event<AutomationPayload> & { kind: "automation" }`

## Notes

- The runtime bridges CardScript types to runtime port types by name.
- Unknown/user-defined types are treated as `Any` by the bridge.
- See cardplay2.md §2.0.3 for the full type reduction table.

