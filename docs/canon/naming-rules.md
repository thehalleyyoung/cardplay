# Naming Rules

**Status:** implemented  
**Canonical terms used:** ControlLevel, DeckType, PortType, namespaced IDs  
**Primary code references:** `cardplay/src/boards/types.ts`, `cardplay/src/cards/card.ts`  
**SSOT:** This document defines ID stability and extension patterns.

---

## Core IDs Are Stable

These enums are **pinned** and should not be extended casually:

- `ControlLevel` — 6 values, closed
- `DeckType` — ~25 values, closed (for now)
- `PortTypes` — Builtin set, extensible via registry

See [Canonical IDs](./ids.md) for exact values.

---

## Extension IDs Are Open

New functionality uses **namespaced IDs**:

```
<namespace>:<name>
```

### Examples

- `vendor:custom_card` — Third-party card
- `carnatic:gamaka` — Carnatic-specific constraint
- `user:my_preset` — User-created preset

### Rules

1. Namespace should match pack name or author domain
2. Names should be lowercase with underscores
3. Builtins may omit namespace; extensions must not
4. Register via appropriate registry before use

---

## Don't Invent New Core IDs

❌ Adding new `DeckType` values in docs  
❌ Inventing new `ControlLevel` without code change  
❌ Creating un-namespaced constraint types  

✅ Ship new functionality as namespaced extensions  
✅ Register custom types via registries  
✅ Document extension path in pack manifest
