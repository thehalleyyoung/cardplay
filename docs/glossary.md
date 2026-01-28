# Glossary
Assumes canonical model and terminology in `cardplay2.md` (repo root).

These terms extend the canonical definitions in `cardplay2.md` (repo root). The parametric type system from cardplay2.md §2.0 is the source of truth.

---

## Core Parametric Types (from cardplay2.md §2.0.1)

### Event\<P\>

A time-stamped object in ticks with a `kind` and a typed `payload: P` (plus optional `id`/`meta`/`tags`). This is the atomic data unit of the system.

```ts
type Event<P> = {
  id: EventId;
  kind: EventKind;
  start: Tick;
  duration: TickDuration;
  payload: P;
  // ...optional fields
};
```

### Stream\<E\>

An ordered sequence of events: `E[]` where `E extends Event<any>`. The alias `EventStream<E>` is used in CardScript and manifests.

### Container\<K, E\>

A named context owning a Stream of events. `K` is the container kind string (`"pattern"`, `"scene"`, `"clip"`, `"score"`, `"take"`, `"phrase"`). Container replaces proliferated types like Pattern, Scene, Clip, etc.

### Track\<K, A, B\>

A **bidirectional lens** (read/write pair) into a Container, NOT a separate store of events. Tracks project and update container contents—e.g., a note track, automation track, or chord track are all lenses on the same container. (See cardplay2.md §2.3)

### Card\<A, B\>

A typed morphism from input type A to output type B. Cards are the unit of composition; stacks compose cards via serial (∘) or parallel (⊗) operators.

### Rules\<E, C\>

Parametric constraints over events of type E given context C. Replaces proliferated types like `MelodyRules`, `HarmonyRules`, `RagaConstraint`. (See cardplay2.md §2.0.6)

### Lane\<T\>

A temporal projection of values of type T (e.g., automation, modulation, expression). Replaces proliferated types like `AutomationLane`, `ModulationLane`, `ExpressionLane`. (See cardplay2.md §2.0.1)

### Voice\<P\>

A sounding entity parametric over pitch system P. Pitch systems include `MIDIPitch`, `MicrotonalPitch`, `JustPitch`, `SwaraPitch`. The `NotePayload` is an alias for `Voice<MIDIPitch>`. (See cardplay2.md §2.0.5)

---

## Derived / Convenience Aliases

These are sugar over the parametric types (cardplay2.md §2.0.9):

- **NoteEvent**: `Event<Voice<MIDIPitch>> & { kind: "note" }`
- **ChordEvent**: `Event<ChordPayload> & { kind: "chord" }`
- **AutomationEvent**: `Event<AutomationPayload> & { kind: "automation" }`
- **Pattern**: `Container<"pattern">`
- **Scene**: `Container<"scene">`
- **Clip**: `Container<"clip">`

---

## Application-Level Concepts

### Stack

A graph-shaped arrangement of Card instances wired together. Stacks are compositions of cards.

### Protocol

A compatibility layer for ports. Protocols define how one port type can connect to another, optionally through adapters. (See cardplay2.md §2.9)

### Mixer Channel

Audio routing and mixing (gain, pan, sends, FX). **Not** the same as `Track<K,A,B>` which is a lens. Mixer channels are stored in `project.session.tracks` and `project.session.mixer`.
