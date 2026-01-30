# Port Vocabulary

**Status:** implemented  
**Canonical terms used:** PortType, PortTypes  
**Primary code references:** `cardplay/src/cards/card.ts`, `cardplay/src/boards/gating/validate-connection.ts`  
**SSOT:** This document defines canonical port types and extension.

---

## Builtin Port Types

From `cardplay/src/cards/card.ts`:

```ts
const PortTypes = {
  audio: 'audio',
  midi: 'midi',
  notes: 'notes',
  control: 'control',
  trigger: 'trigger',
  gate: 'gate',
  clock: 'clock',
  transport: 'transport',
} as const;
```

---

## Port Compatibility

Defined in `cardplay/src/boards/gating/validate-connection.ts`.

Default compatible pairs:
- `audio` ↔ `audio`
- `midi` ↔ `midi`
- `notes` → `midi` (with adapter)
- `control` ↔ `control`
- `trigger` ↔ `gate` (compatible)
- `clock` ↔ `transport` (compatible)

---

## Extension

Custom port types use namespaced IDs:

```
<namespace>:<port_type>
```

Register via port type registry (when implemented).

---

## Direction

Port direction is separate from type:
- Direction: `in` | `out`
- Type: One of the PortTypes

Don't encode direction in type name (e.g., avoid `audio_in`).
