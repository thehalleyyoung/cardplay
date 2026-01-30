# HostActions

**Status:** implemented  
**Canonical terms used:** HostAction, Prolog, apply loop  
**Primary code references:** `cardplay/src/ai/theory/host-actions.ts`, `cardplay/src/ai/engine/prolog-adapter.ts`  
**Analogy:** "Proposed moves" from the referee (Prolog) that the host validates and applies.  
**SSOT:** This document defines the canonical HostAction wire format.

---

## Purpose

HostActions are the **only** sanctioned bridge from declarative Prolog reasoning to imperative state changes.

---

## Canonical Wire Format

From Prolog:

```prolog
action(ActionTerm, Confidence, Reasons)
```

- `ActionTerm`: The action to perform (see types below)
- `Confidence`: 0.0-1.0, how confident the suggestion is
- `Reasons`: List of `because(Explanation)` terms

---

## HostAction Types

**Location:** `cardplay/src/ai/theory/host-actions.ts`

```ts
type HostAction =
  | { type: 'add_note'; ... }
  | { type: 'delete_note'; ... }
  | { type: 'modify_note'; ... }
  | { type: 'add_chord'; ... }
  | { type: 'set_key'; ... }
  | { type: 'set_tempo'; ... }
  | { type: 'add_constraint'; ... }
  | { type: 'remove_constraint'; ... }
  | { type: 'autofix'; ... }
  // Extension actions must be namespaced
  | { type: `${string}:${string}`; ... };
```

---

## Apply Loop

1. **Prolog emits** `action(Term, Confidence, Reasons)`
2. **Parser converts** to TypeScript `HostAction`
3. **UI presents** action with confidence/reasons
4. **User accepts/rejects** (or auto-apply if ControlLevel permits)
5. **Host applies** action to SSOT stores
6. **Undo recorded** for rollback
7. **Spec resyncs** with new state

---

## Extension Actions

Custom actions must be namespaced: `<namespace>:<action_type>`

Unknown actions are ignored with a diagnostic—never crash.

---

## Legacy Aliases

Multiple HostAction shapes exist in code:
- `cardplay/src/ai/theory/host-actions.ts` — Canonical
- `cardplay/src/ai/engine/prolog-adapter.ts` — Parser
- `cardplay/src/ai/advisor/advisor-interface.ts` — Advisor wrapper

Use the canonical shape from `host-actions.ts`.
