# Canonical Noun Contracts

**Status:** implemented  
**Canonical terms used:** All core nouns defined here  
**Primary code references:** `cardplay/src/types/*`, `cardplay/src/cards/*`, `cardplay/src/state/*`, `cardplay/src/boards/*`, `cardplay/src/ai/theory/*`  
**Analogy:** This is the "piece identification guide" for the CardPlay game board—defining exactly what each game piece, zone, and rule token means.  
**SSOT:** This document is the single source of truth for noun meanings. All other docs must link here instead of redefining these terms.

---

## Purpose

This document defines **canonical meanings** for overloaded terms in the CardPlay codebase. When a doc uses one of these terms, it must use the meaning defined here—or explicitly qualify the term (e.g., "UI StackComponent" vs "composition Stack").

---

## Noun Contracts

### Card

#### Noun Contract: Card
- **Canonical meaning:** A typed transform `Card<A,B>` that maps input type A to output type B, with ports and metadata
- **Not this:** A UI widget, an audio processor module, or a visual card component
- **Related nouns:** Stack (composition of cards), Port (connection point on a card), CardPack (bundle of cards)
- **Canonical type:** `Card<A,B>` in `cardplay/src/cards/card.ts`
- **SSOT store:** `cardplay/src/cards/registry.ts`
- **Analogy:** A "rule card" or "spell" that transforms tokens passing through it

**Other card-like types (use qualified names):**
- `AudioModuleCard` — Runtime audio/MIDI processing module (`cardplay/src/audio/instrument-cards.ts`)
- `UICardComponent` — UI lifecycle + drag/resize shell (`cardplay/src/ui/components/card-component.ts`)
- `TheoryCardDef` — UI "constraint contributor" shaping MusicSpec (`cardplay/src/ai/theory/theory-cards.ts`)
- `CardDefinition` (visuals) — Visual/parameter schema for card rendering (`cardplay/src/cards/card-visuals.ts`)

---

### Deck

#### Noun Contract: Deck
- **Canonical meaning:** `BoardDeck` — A typed zone surface within a board panel (e.g., pattern editor, mixer, notation view)
- **Not this:** The main workspace, a slot-grid runtime adapter, or an AI theory template
- **Related nouns:** Board (contains panels which contain decks), Panel (region containing decks), DeckType (enum of deck kinds)
- **Canonical type:** `BoardDeck` in `cardplay/src/boards/types.ts`
- **SSOT store:** Board state via `cardplay/src/boards/store/store.ts`
- **Analogy:** A "zone" or "area of play" on the game board

**Other deck-like types (use qualified names):**
- `DeckLayoutAdapter` (slot-grid runtime) — Grid of card slots with routing (`cardplay/src/ui/deck-layout.ts`)
- `DeckTemplate` (AI) — Recommended combination of theory cards (`cardplay/src/ai/theory/deck-templates.ts`)

---

### Stack

#### Noun Contract: Stack
- **Canonical meaning:** Serial/parallel composition of `Card<A,B>` transforms
- **Not this:** A UI vertical list component or a layout mode
- **Related nouns:** Card (what stacks compose), Pipeline (synonym for serial stack)
- **Canonical type:** `Stack` in `cardplay/src/cards/stack.ts`
- **SSOT store:** Runtime composition graph
- **Analogy:** A "combo chain" of rule cards

**Other stack-like types (use qualified names):**
- `StackComponent` (UI vertical list) — UI container rendering cards in a column (`cardplay/src/ui/components/stack-component.ts`)
- `DeckCardLayout = 'stack'` — Layout mode for decks (`cardplay/src/boards/types.ts`)

---

### Track

#### Noun Contract: Track
- **Canonical meaning:** A channel/lane in the arrangement or mixer that references event streams
- **Not this:** A bidirectional lens (spec concept not yet implemented)
- **Related nouns:** EventStream (what tracks reference), Clip (placed on tracks), Mixer (where tracks route)
- **Canonical type:** `Track` in `cardplay/src/ui/components/arrangement-panel.ts` (UI); no unified Track type yet
- **SSOT store:** Arrangement/mixer state (not yet unified)
- **Analogy:** A "lane" on the game board where clips are placed

---

### Clip

#### Noun Contract: Clip
- **Canonical meaning:** A reference to an event stream + a placement window (start tick, duration, loop settings)
- **Not this:** The events themselves, or a container
- **Related nouns:** EventStream (what clips reference), Track (where clips live), ClipRecord (the record type)
- **Canonical type:** `ClipRecord` in `cardplay/src/state/types.ts`
- **SSOT store:** `cardplay/src/state/clip-registry.ts`
- **Analogy:** A "tile" placed on a track lane

---

### Port

#### Noun Contract: Port
- **Canonical meaning:** A connection point on a card with a typed port type (audio, midi, notes, etc.)
- **Not this:** A UI-only visual affordance
- **Related nouns:** Card (has ports), RoutingGraph (connects ports), PortType (the type of a port)
- **Canonical type:** `PortType` branded string in `cardplay/src/cards/card.ts`
- **SSOT store:** Card definitions + routing graph
- **Analogy:** "Connectors" on game pieces for valid wiring rules

**Canonical PortTypes (builtin):**
- `audio`, `midi`, `notes`, `control`, `trigger`, `gate`, `clock`, `transport`

See [Port Vocabulary](./port-vocabulary.md) for the complete list and extension mechanism.

---

### Event

#### Noun Contract: Event
- **Canonical meaning:** A typed occurrence in tick-time: `{ kind, start, duration, payload }`
- **Not this:** A UI element or a DOM event
- **Related nouns:** EventStream (ordered list of events), EventKind (type of event), Tick (time unit)
- **Canonical type:** `Event<P>` in `cardplay/src/types/event.ts`
- **SSOT store:** `cardplay/src/state/event-store.ts` (`SharedEventStore`)
- **Analogy:** A "token" with timing that flows through the system

---

### EventStream

#### Noun Contract: EventStream
- **Canonical meaning:** A named ordered list of Events + metadata
- **Not this:** A Track (which references streams)
- **Related nouns:** Event (contents), Clip (references streams), Container (may group streams)
- **Canonical type:** `EventStreamRecord` in `cardplay/src/state/types.ts`
- **SSOT store:** `cardplay/src/state/event-store.ts`
- **Analogy:** A "token pool" or "event log"

---

### MusicSpec

#### Noun Contract: MusicSpec
- **Canonical meaning:** Declarative musical intent (culture, style, constraints) that guides AI tools
- **Not this:** The event store, the project state, or imperative commands
- **Related nouns:** MusicConstraint (rules within spec), TheoryCard (edits spec), HostAction (proposed changes)
- **Canonical type:** `MusicSpec` in `cardplay/src/ai/theory/music-spec.ts`
- **SSOT store:** Serialized into Prolog facts per query (no single global store yet)
- **Analogy:** The "scenario sheet" or "win conditions" for composition

---

### MusicConstraint

#### Noun Contract: MusicConstraint
- **Canonical meaning:** A declarative rule in a MusicSpec (`hard|soft`, `weight`, typed constraint)
- **Not this:** UI state, layout preferences, or selection
- **Related nouns:** MusicSpec (contains constraints), TheoryCard (produces constraints), Prolog KB (evaluates constraints)
- **Canonical type:** `MusicConstraint` union in `cardplay/src/ai/theory/music-spec.ts`
- **SSOT store:** `MusicSpec.constraints`
- **Analogy:** A "rule token" or "quest requirement"

**Constraint types must be canonicalized.** Custom constraint types must be namespaced: `<namespace>:<constraint_type>`.

---

### HostAction

#### Noun Contract: HostAction
- **Canonical meaning:** A structured imperative edit proposal from AI (Prolog) to the host (TypeScript)
- **Not this:** Truth by itself—it's a suggestion that must be validated and applied
- **Related nouns:** Prolog KB (emits actions), Constraint (may trigger actions), Apply loop (processes actions)
- **Canonical type:** `HostAction` in `cardplay/src/ai/theory/host-actions.ts`
- **SSOT store:** Applied by host into SSOT stores; must be undoable
- **Analogy:** A "proposed move" from the referee

See [HostActions](./host-actions.md) for the canonical wire format.

---

### OntologyPack

#### Noun Contract: OntologyPack
- **Canonical meaning:** A coherent set of entities + assumptions + inference rules for a music theory tradition
- **Not this:** "Just style"—ontologies define what entities exist and how they relate
- **Related nouns:** Prolog KB (implements ontology), MusicSpec.culture/style (selects ontology), Bridge (converts between ontologies)
- **Canonical type:** Prolog files in `cardplay/src/ai/knowledge/*`
- **SSOT store:** Loaded by `cardplay/src/ai/knowledge/music-theory-loader.ts`
- **Analogy:** An "expansion pack" with its own rule set

**Current ontology packs:**
- Western tonal (functional harmony, cadences)
- Galant (schemata, partimento)
- Carnatic (raga, tala, gamaka)
- Celtic (tune forms, modes)
- Chinese (modes, heterophony)
- Computational (DFT, Spiral Array, KS profiles)

---

### LyricToken

#### Noun Contract: LyricToken
- **Canonical meaning:** A text token in a lyric event stream, with anchors to musical time
- **Not this:** "Notes with text"—lyrics are a separate event domain
- **Related nouns:** EventStream (lyrics live in streams), LyricAnchor (ties to notation), HostAction (lyric-scoped edits)
- **Canonical type:** Custom `EventKind` registered for lyrics
- **SSOT store:** `SharedEventStore` with lyric streams
- **Analogy:** "Quest text" or "story tokens"

---

### LyricAnchor

#### Noun Contract: LyricAnchor
- **Canonical meaning:** A reference tying a lyric token to musical time and/or notation underlay
- **Not this:** The lyric text itself
- **Related nouns:** LyricToken (what's anchored), Tick (time reference), Note (optional underlay reference)
- **Canonical type:** Part of lyric event payload
- **SSOT store:** Within lyric event payloads
- **Analogy:** "Attachment point" for story tokens

---

### Board

#### Noun Contract: Board
- **Canonical meaning:** A workflow environment with layout, decks, and policy
- **Not this:** A document or a mode toggle
- **Related nouns:** Panel (regions on board), BoardDeck (zones in panels), ControlLevel (policy)
- **Canonical type:** `Board`, `BoardState` in `cardplay/src/boards/types.ts`
- **SSOT store:** `cardplay/src/boards/store/store.ts` (`BoardStateStore`)
- **Analogy:** A "game board variant" or "ruleset + layout"

---

### Panel

#### Noun Contract: Panel
- **Canonical meaning:** A region on a board that contains decks
- **Not this:** A window or view
- **Related nouns:** Board (contains panels), BoardDeck (lives in panels)
- **Canonical type:** Panel definitions in board specs
- **SSOT store:** Board layout state
- **Analogy:** A "region" on the game board

---

### ActiveContext

#### Noun Contract: ActiveContext
- **Canonical meaning:** Cross-board "current selection/cursor" state
- **Not this:** Project state or musical content
- **Related nouns:** Board (provides context), Deck (may have active items), Selection (what's active)
- **Canonical type:** `ActiveContext` in `cardplay/src/boards/context/types.ts`
- **SSOT store:** `cardplay/src/boards/context/store.ts` (`BoardContextStore`)
- **Analogy:** The player's "cursor" or "selected piece"

---

### RoutingGraph

#### Noun Contract: RoutingGraph
- **Canonical meaning:** Nodes + edges describing audio/MIDI/modulation signal flow
- **Not this:** The visual deck layout
- **Related nouns:** Port (connection points), Card (nodes in graph), Connection (edges)
- **Canonical type:** `RoutingNodeInfo`, `RoutingEdgeInfo` in `cardplay/src/state/routing-graph.ts`
- **SSOT store:** `cardplay/src/state/routing-graph.ts` (`RoutingGraphStore`)
- **Analogy:** "Roads" or "lanes" between zones

---

### CardPack

#### Noun Contract: CardPack
- **Canonical meaning:** An expansion bundle shipping new cards, boards, themes, KB rules
- **Not this:** Builtin-only resources
- **Related nouns:** Card (what packs contain), Board (can be in packs), Theme (visual customization)
- **Canonical type:** Pack manifest format
- **SSOT store:** Pack registry
- **Analogy:** An "expansion box" or "mod bundle"

---

### Theme

#### Noun Contract: Theme
- **Canonical meaning:** Purely visual customization (colors, skins, fonts)
- **Not this:** Logic or behavior changes
- **Related nouns:** CardPack (can ship themes), Board (applies theme)
- **Canonical type:** Theme definitions in `cardplay/src/boards/theme/*`
- **SSOT store:** Theme registry
- **Analogy:** "Board art" or "skin"

---

## Usage Rules

1. **Always use canonical meanings** unless explicitly qualified
2. **Link to this doc** instead of redefining nouns
3. **Use qualified names** for non-canonical meanings (e.g., "UI StackComponent", "DeckLayoutAdapter (slot-grid runtime)")
4. **New nouns must be added here** before being used in other docs
