# Declarative vs Imperative Contract

**Status:** implemented  
**Canonical terms used:** MusicSpec, MusicConstraint, HostAction, Prolog KB  
**Primary code references:** `cardplay/src/ai/theory/music-spec.ts`, `cardplay/src/ai/theory/host-actions.ts`, `cardplay/src/ai/engine/prolog-adapter.ts`  
**Analogy:** Constraints/spec are the "scenario rules"; Prolog is the "referee"; HostActions are "proposed moves"; decks apply moves.  
**SSOT:** This document defines the boundary between declarative and imperative layers.

---

## The Contract

### DECL-IMP-CONTRACT/1

#### Declarative Layer (Facts/Intent)

- **`MusicSpec`** + **`MusicConstraint`** are declarative and side-effect free
- They describe *what is desired/permitted*, not how to achieve it
- Prolog KBs are pure reasoning over facts—they do not "apply changes"

#### Imperative Layer (Edits/State)

- Mutations happen via the host updating SSOT stores:
  - `SharedEventStore` (events)
  - `ClipRegistry` (clips)
  - `RoutingGraphStore` (routing)
  - `BoardStateStore` (board layout)
- Decks and boards are the imperative actors

#### Bridge (The Only Sanctioned Crossing)

- Prolog emits **`HostAction`s** (proposed moves)
- The host (TypeScript) validates, applies (or rejects), logs, and makes results undoable
- HostActions are the **only** way declarative reasoning triggers imperative changes

---

## AI Loop Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      DECLARATIVE LAYER                       │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐ │
│  │  MusicSpec   │────▶│ Prolog Facts │────▶│   Queries    │ │
│  │ + Constraints│     │  (encoded)   │     │              │ │
│  └──────────────┘     └──────────────┘     └──────┬───────┘ │
│         ▲                                         │         │
│         │                                         ▼         │
│  ┌──────┴───────┐                        ┌──────────────┐  │
│  │ Theory Cards │                        │  HostActions │  │
│  │    (edit)    │                        │  (proposed)  │  │
│  └──────────────┘                        └──────┬───────┘  │
└─────────────────────────────────────────────────┼──────────┘
                                                  │
                         ══════════════════════════════════════
                                    BRIDGE
                         ══════════════════════════════════════
                                                  │
┌─────────────────────────────────────────────────┼──────────┐
│                      IMPERATIVE LAYER           ▼          │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐│
│  │  Accept/     │────▶│    Apply     │────▶│ SSOT Stores  ││
│  │   Reject     │     │  (with undo) │     │   Updated    ││
│  └──────────────┘     └──────────────┘     └──────────────┘│
│         ▲                                         │        │
│         │                                         ▼        │
│  ┌──────┴───────┐                        ┌──────────────┐  │
│  │     User     │                        │  Spec Resync │  │
│  │   Decision   │                        │  (new facts) │  │
│  └──────────────┘                        └──────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## Suggestion vs Auto-Apply

- **Default:** HostActions are suggestions requiring explicit user confirmation
- **Auto-apply:** Permitted only when:
  1. Board/tool mode explicitly enables it (see `ControlLevel` + `ToolMode`)
  2. Still undoable and surfaced in history
  3. User has opted in to this control level

**ControlLevel affects AI policy:**
- `full-manual`: No AI suggestions
- `manual-with-hints`: Suggestions shown, user applies
- `assisted`: Suggestions with one-click apply
- `collaborative`: AI can auto-apply with user override
- `directed`: User sets goals, AI executes
- `generative`: AI generates, user curates

---

## Unknown/Extension Actions

- Unknown HostActions must be ignored safely with a diagnostic
- Never crash on unknown action terms
- Extensions must namespace their action terms: `<namespace>:<action>`

---

## Forbidden Patterns

❌ "Prolog updates the project state" — Prolog emits HostActions; host applies them

❌ "AI changes the events directly" — AI proposes; host applies

❌ "Constraints mutate the score" — Constraints are declarative; decks mutate

❌ "The KB applies the fix" — The KB suggests; the host applies
