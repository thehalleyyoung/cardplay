# Game Board Analogy

**Status:** implemented  
**Canonical terms used:** Board, BoardDeck, Card, Stack, Panel, RoutingGraph, ActiveContext, MusicSpec, MusicConstraint, HostAction, CardPack, Theme  
**Primary code references:** `cardplay/src/boards/*`, `cardplay/src/cards/*`, `cardplay/src/ai/theory/*`  
**Analogy:** This document defines the "game board" mental model for CardPlay.  
**SSOT:** This is the canonical analogy mapping. Use these analogies consistently but **do not rename code identifiers**.

---

## Purpose

CardPlay uses a **game board analogy** to help humans and LLMs understand the layered architecture. This document defines the canonical mappings.

---

## The Analogy Table

| Literal (Canonical) | Analogy | Use It To Explain | Don't Do |
|---|---|---|---|
| **Board** | A *game board variant* / ruleset + layout | Different workflows share same underlying project state | Don't rename the type/identifier; keep `Board` in code |
| **Panel** | Region on the board | Where zones (decks) live | Don't confuse with "window"/"view" |
| **BoardDeck** | A *zone* / "area of play" | A focused surface: editor, browser, tool | Don't call unrelated systems "deck" without a qualifier |
| **Card (core)** | A *rule card* / "spell" transforming tokens | Typed transform `Card<A,B>` | Don't conflate with UI widget |
| **Card instance (UI)** | A *piece* placed on the board | Visual + interaction wrapper around some capability | Don't define a second unrelated `CardDefinition` |
| **Stack (core composition)** | A *combo chain* | Serial/parallel composition semantics | Don't equate with vertical list layout |
| **DeckCardLayout** | How a zone displays pieces | tabs/stack/split/floating | Don't treat layout modes as computation modes |
| **Ports** | Connectors on pieces | Valid wiring rules | Don't invent new port vocabularies in UI docs |
| **RoutingGraph** | Roads/lanes between zones | Audio/MIDI/modulation flow | Don't maintain "secret" parallel graphs |
| **ActiveContext** | The player's cursor / selected piece | What the user is "currently acting on" | Don't store time in a different unit than the engine |
| **MusicSpec** | The scenario sheet / "win conditions" | The declarative intent knobs that guide tools | Don't confuse it with the event store |
| **MusicConstraint** | A rule token / "quest requirement" | Hard/soft rules with weights | Don't encode UI state/layout as constraints |
| **LyricToken (event)** | A text token / "quest text" | Lyrics-first editing via event streams + anchors | Don't treat as "notes with text" |
| **Prolog KB** | The referee / rules oracle | Derives consequences + suggestions from facts | Don't describe it as mutating host state directly |
| **HostAction** | A proposed move from the referee | The only sanctioned bridge into imperative changes | Don't treat it as "truth"; it's a suggestion |
| **CardPack** | Expansion box / mod bundle | Ships new cards, boards, themes, KB rules | Don't assume "builtin-only" IDs |
| **Theme** | Skin / board art | Purely visual customization | Don't encode logic in themes |
| **Registry** | Mod loader | Dynamic registration of extensions | Don't hardcode extension IDs in prose |

---

## Expanded Analogies

### Board as Game Board Variant

A **Board** in CardPlay is like choosing which variant of a board game to play:

- Each board has its own **layout** (which zones/decks are visible)
- Each board has its own **policy** (ControlLevel, AI behavior)
- Different boards share the same **project state** (events, clips, routing)
- Switching boards is like switching game variants mid-game—pieces stay, rules change

### Decks as Zones

A **BoardDeck** is like a zone on the game board:

- The **tracker zone** (pattern-deck) for step sequencing
- The **notation zone** (notation-deck) for score editing
- The **mixer zone** (mixer-deck) for audio levels
- Each zone has its own rules for what you can do there

### Cards as Rule Cards / Spells

A **Card<A,B>** is like a rule card or spell in a card game:

- Input type A = what the card needs to activate
- Output type B = what the card produces
- **Ports** are the connectors showing valid inputs/outputs
- **Stacking** cards creates combos (serial, parallel, layer)

### MusicSpec as Scenario Sheet

The **MusicSpec** is like the scenario setup for a board game:

- **Culture/Style** = which expansion packs are active
- **Constraints** = the victory conditions / rules to follow
- The spec doesn't contain the game state (events)—it defines the goals

### Prolog KB as Referee

The **Prolog KB** is like a referee or rules oracle:

- You tell it the current facts (spec, events, constraints)
- It tells you what moves are valid or recommended
- **It does not move pieces itself**—it suggests HostActions
- The host (TypeScript) actually applies the moves

### HostAction as Proposed Move

A **HostAction** is like a referee's ruling that a move is valid:

- The referee (Prolog) says "you could do X"
- The player (user) can accept, modify, or reject
- The game (host) applies accepted moves and records them for undo

### CardPack as Expansion Box

A **CardPack** is like an expansion pack for a board game:

- Ships new cards, boards, themes, KB rules
- Uses namespaced IDs to avoid conflicts
- Loaded via registries (the "mod loader")

---

## Usage in Documentation

When a doc introduces one of these canonical nouns, add a short **Analogy:** line:

```markdown
## MusicSpec

**Analogy:** The "scenario sheet" defining win conditions—what culture/style is active and what constraints must be satisfied.

The MusicSpec is the declarative musical intent...
```

---

## Rules for the Analogy

1. **Use consistently** — Always use the same analogy for the same concept
2. **Explanatory only** — Avoid renaming code identifiers to match the analogy
3. **One-sentence max** — Keep analogy lines brief in docs
4. **Link here** — Reference this doc for the full analogy table
5. **Don't extend unilaterally** — New analogies must be added to this canon doc first
