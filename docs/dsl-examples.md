# Project DSL examples
Assumes canonical model and terminology in `cardplay2.md` (repo root).

These examples use the DSL schema for serializing `Container<K,E>`, `Card<A,B>`, and stack definitions. See cardplay2.md §2.0.1 for type definitions.

## Minimal project

```json
{
  "version": "0.2",
  "metadata": { "id": "proj-1", "name": "Demo" },
  "containers": [],
  "cards": [],
  "stacks": []
}
```

## Registry-inclusive export

Exports can include a registry snapshot so imports are more portable across environments:

```json
{
  "version": "0.2",
  "metadata": { "id": "proj-1", "name": "Demo" },
  "containers": [],
  "cards": [],
  "stacks": [],
  "registry": {
    "eventKinds": [{ "kind": "note", "fields": { "pitch": { "type": "number", "required": true } } }],
    "portTypes": [{ "type": "EventStream", "compatibleWith": ["Any"] }],
    "protocols": [{ "name": "ContainerIO", "methods": [{ "name": "readContainer", "args": ["string"], "returns": "Container" }] }]
  }
}
```

## JSON-with-comments input

The UI accepts a tolerant input form (comments + trailing commas):

```jsonc
{
  // comment
  "version": "0.2",
  "metadata": { "id": "proj-1", "name": "Demo", },
  "containers": [],
  "cards": [],
  "stacks": [],
}
```

