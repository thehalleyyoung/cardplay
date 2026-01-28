# Event Kind Schemas
Assumes canonical model and terminology in `cardplay2.md` (repo root).

Event kinds define the shape of events that appear in clips/scenes and flow through event ports.

Implementation:
- `src/registry/event-kinds.ts`

## Schema fields

An event kind schema includes:
- `kind`: string id (e.g. `note`, `tempo`)
- `fields`: field-name → `{type, required}` map — this defines the shape of the event's `payload` property (see cardplay2.md §2.0.1)
- `description`: optional help text
- `renderHints`: optional UI hints (color/icon)
- `mergePolicy`: how to merge events of this kind

## Validation

Validation rules are enforced by registry validators and used by UI tools:
- kind must be non-empty
- fields must be a non-empty object
- field types must be supported
- merge policy must be a known value

## Built-in examples

Builtins register:
- `note` (pitch, velocity, ...)
- `tempo` (bpm)
- `meter` (numerator/denominator)

Custom kinds can be hydrated from DSL (debug panel) or provided by packs in future phases.

