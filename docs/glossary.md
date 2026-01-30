# Glossary

**Status:** implemented  
**Canonical terms used:** All core nouns  
**Primary code references:** `cardplay/src/types/*`, `cardplay/src/cards/*`, `cardplay/src/state/*`, `cardplay/src/boards/*`, `cardplay/src/ai/theory/*`  
**Analogy:** The "game piece identification guide" for CardPlay.  
**SSOT:** For detailed noun contracts, see [Canonical Nouns](./canon/nouns.md). This glossary provides quick definitions.

> **Note:** This glossary extends the canonical definitions. When in doubt, defer to `cardplay/docs/canon/nouns.md` and the source code.

---

## Core Parametric Types (from cardplay2.md §2.0.1)

### Event\<P\>

#### Noun Contract: Event
- **Canonical meaning:** A typed occurrence in tick-time: `{ kind, start, duration, payload }`
- **Not this:** A UI element or DOM event
- **Canonical type:** `Event<P>` in `cardplay/src/types/event.ts`
- **SSOT store:** `SharedEventStore` in `cardplay/src/state/event-store.ts`

```ts
type Event<P> = {
  id: EventId;
  kind: EventKind;
  start: Tick;
  duration: TickDuration;
  payload: P;
};
```

### Stream\<E\> / EventStream

#### Noun Contract: EventStream
- **Canonical meaning:** Named ordered list of Events + metadata
- **Not this:** A Track (which references streams)
- **Canonical type:** `EventStreamRecord` in `cardplay/src/state/types.ts`
- **SSOT store:** `SharedEventStore`

### Container\<K, E\>

A named context owning a Stream of events. `K` is the container kind (`"pattern"`, `"scene"`, `"clip"`, `"score"`, `"take"`, `"phrase"`).

### Track

#### Noun Contract: Track
- **Canonical meaning:** A channel/lane in arrangement or mixer referencing event streams
- **Not this:** A bidirectional lens (spec concept not fully implemented)
- **Canonical type:** Various `Track` interfaces (not yet unified)
- **Note:** The lens concept from cardplay2.md §2.3 is aspirational

### Card\<A, B\>

#### Noun Contract: Card
- **Canonical meaning:** A typed transform `Card<A,B>` mapping input A to output B
- **Not this:** A UI widget, audio processor, or theory card
- **Canonical type:** `Card<A,B>` in `cardplay/src/cards/card.ts`
- **See also:** [Card Systems](./canon/card-systems.md) for all card types

### Stack

#### Noun Contract: Stack
- **Canonical meaning:** Serial/parallel composition of `Card<A,B>` transforms
- **Not this:** UI StackComponent (vertical list) or layout mode
- **Canonical type:** `Stack` in `cardplay/src/cards/stack.ts`
- **See also:** [Stack Systems](./canon/stack-systems.md)

### Clip

#### Noun Contract: Clip
- **Canonical meaning:** Reference to an event stream + placement window (start, duration, loop)
- **Not this:** The events themselves
- **Canonical type:** `ClipRecord` in `cardplay/src/state/types.ts`
- **SSOT store:** `ClipRegistry` in `cardplay/src/state/clip-registry.ts`

### Port / PortType

#### Noun Contract: Port
- **Canonical meaning:** Connection point on a card with a typed port type
- **Not this:** UI-only visual affordance
- **Canonical type:** `PortType` in `cardplay/src/cards/card.ts`
- **Builtin types:** `audio`, `midi`, `notes`, `control`, `trigger`, `gate`, `clock`, `transport`
- **See also:** [Port Vocabulary](./canon/port-vocabulary.md)

### MusicConstraint

#### Noun Contract: MusicConstraint
- **Canonical meaning:** Declarative rule in a MusicSpec (hard/soft, weight, typed)
- **Not this:** UI state or layout preferences
- **Canonical type:** `MusicConstraint` in `cardplay/src/ai/theory/music-spec.ts`

### HostAction

#### Noun Contract: HostAction
- **Canonical meaning:** Structured imperative edit proposal from AI to host
- **Not this:** Truth by itself—requires validation and application
- **Canonical type:** `HostAction` in `cardplay/src/ai/theory/host-actions.ts`
- **See also:** [HostActions](./canon/host-actions.md)

### OntologyPack

#### Noun Contract: OntologyPack
- **Canonical meaning:** Coherent set of entities + assumptions + rules for a music theory tradition
- **Not this:** "Just style"—ontologies define what entities exist
- **Location:** Prolog files in `cardplay/src/ai/knowledge/*`

### LyricToken

#### Noun Contract: LyricToken
- **Canonical meaning:** Text token in a lyric event stream with time anchors
- **Not this:** "Notes with text"—lyrics are a separate event domain
- **Canonical type:** Custom `EventKind` for lyrics

### LyricAnchor

#### Noun Contract: LyricAnchor
- **Canonical meaning:** Reference tying lyric to musical time and/or notation
- **Location:** Part of lyric event payload

---

## Board System Terms

### Board

#### Noun Contract: Board
- **Canonical meaning:** Workflow environment with layout, decks, and policy
- **Not this:** A document or mode toggle
- **Canonical type:** `Board`, `BoardState` in `cardplay/src/boards/types.ts`

### BoardDeck

#### Noun Contract: Deck
- **Canonical meaning:** Typed zone surface within a board panel
- **Not this:** Main workspace, slot-grid adapter, or AI template
- **Canonical type:** `BoardDeck` in `cardplay/src/boards/types.ts`
- **See also:** [Deck Systems](./canon/deck-systems.md)

### Panel

Region on a board that contains decks.

### ActiveContext

Cross-board "current selection/cursor" state. See `cardplay/src/boards/context/types.ts`.

### ControlLevel

Board policy for AI involvement. Values: `full-manual`, `manual-with-hints`, `assisted`, `collaborative`, `directed`, `generative`. See [Canonical IDs](./canon/ids.md).

---

## Derived / Convenience Aliases

These are sugar over the parametric types (cardplay2.md §2.0.9):

- **NoteEvent**: `Event<Voice<MIDIPitch>> & { kind: "note" }`
- **ChordEvent**: `Event<ChordPayload> & { kind: "chord" }`
- **AutomationEvent**: `Event<AutomationPayload> & { kind: "automation" }`
- **Pattern**: `Container<"pattern">`
- **Scene**: `Container<"scene">`

---

## Application-Level Concepts

### MusicSpec

Declarative musical intent (culture, style, constraints) guiding AI tools. See `cardplay/src/ai/theory/music-spec.ts`.

### RoutingGraph

Nodes + edges describing audio/MIDI/modulation signal flow. See `cardplay/src/state/routing-graph.ts`.

### CardPack

Expansion bundle shipping new cards, boards, themes, KB rules.

### Theme

Purely visual customization (colors, skins, fonts).

### Protocol

Compatibility layer for ports defining how types connect.

### Mixer Channel

Audio routing and mixing (gain, pan, sends, FX). **Not** a `Track`.
