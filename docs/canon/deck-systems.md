# Deck Systems

**Status:** implemented  
**Canonical terms used:** BoardDeck, DeckType, DeckLayoutAdapter, DeckTemplate, DeckCardLayout  
**Primary code references:** `cardplay/src/boards/types.ts`, `cardplay/src/boards/decks/*`, `cardplay/src/ui/deck-layout.ts`, `cardplay/src/ai/theory/deck-templates.ts`  
**Analogy:** Different types of "zones" on the game board with different containment and display rules.  
**SSOT:** This document is the canonical reference for distinguishing the multiple "deck" systems in the codebase.

---

## Purpose

The CardPlay codebase uses "deck" for multiple concepts that are **not interchangeable**. This document explicitly enumerates them.

---

## Deck Systems Overview

| Deck System | Canonical Name | Location | Purpose |
|---|---|---|---|
| Board zone container | `BoardDeck` | `cardplay/src/boards/types.ts` | UI zone in a panel |
| Slot-grid runtime adapter | `DeckLayoutAdapter` | `cardplay/src/ui/deck-layout.ts` | Card slot grid with routing |
| AI theory template | `DeckTemplate` | `cardplay/src/ai/theory/deck-templates.ts` | Recommended card combination |

---

## 1. Board Deck (`BoardDeck`)

**Location:** `cardplay/src/boards/types.ts`

**Purpose:** A typed zone surface within a board panel.

```ts
interface BoardDeck {
  readonly id: string;
  readonly type: DeckType;
  readonly panelId: string;
  readonly cardLayout: DeckCardLayout;
  readonly initialCardIds?: readonly string[];
}

type DeckCardLayout = 'stack' | 'tabs' | 'split' | 'floating' | 'grid';
```

**Key characteristics:**
- Part of board architecture
- Has a specific `DeckType` (pattern-deck, notation-deck, etc.)
- Lives in a `Panel`
- Rendered by deck factories

**Analogy:** A "zone" or "area of play" on the game board.

**Canonical `DeckType` values:** See [Canonical IDs](./ids.md#decktype)

---

## 2. Deck Layout Adapter (`DeckLayoutAdapter`)

**Location:** `cardplay/src/ui/deck-layout.ts`

**Purpose:** Grid of card slots with routing capabilities.

```ts
interface DeckLayoutAdapter {
  readonly deckId: DeckId;
  readonly slots: readonly CardSlot[];
  readonly connections: readonly Connection[];
  
  addCard(slot: CardSlot): void;
  removeCard(slotId: string): void;
  connect(from: PortRef, to: PortRef): void;
}
```

**Key characteristics:**
- Manages a grid of card slots
- Handles routing between slots
- State management for slot positions
- Used for modular/rack-style UIs

**Analogy:** A "patch grid" or "rack" where you place and wire modules.

**Distinction from BoardDeck:** `DeckLayoutAdapter` manages the *contents* of some deck types (like a modular rack); `BoardDeck` is the *container*.

**Naming rule for docs:** Always call this `DeckLayoutAdapter (slot-grid runtime)` to avoid confusion with `BoardDeck`.

---

## 3. Deck Template (`DeckTemplate`)

**Location:** `cardplay/src/ai/theory/deck-templates.ts`

**Purpose:** AI-recommended combination of theory cards.

```ts
interface DeckTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly cardIds: readonly string[];
  readonly culture: CultureTag;
  readonly style?: StyleTag;
}
```

**Key characteristics:**
- Bundles theory cards by workflow
- Recommended by AI based on MusicSpec
- Not a runtime container—a *suggestion*
- Used in harmony-deck, generators-deck

**Analogy:** A "preset deck" or "starter pack" the AI suggests.

**Distinction from BoardDeck:** `DeckTemplate` is a *recommendation*; `BoardDeck` is the actual zone.

**Naming rule for docs:** Always call this `DeckTemplate (AI)` or "theory deck template" to avoid confusion.

---

## Containment Rules

```
Board
  └── Panel
        └── BoardDeck (zone)
              └── [optionally] DeckLayoutAdapter (slot-grid)
                    └── CardSlot[]
                          └── Card instances
```

- A `Board` contains `Panel`s
- A `Panel` contains `BoardDeck`s
- Some `BoardDeck` types (like a modular rack) may use `DeckLayoutAdapter` internally
- `DeckTemplate` is not in this hierarchy—it's a suggestion that populates theory cards

---

## Deck Factory System

**Location:** `cardplay/src/boards/decks/`

Each `DeckType` has a factory that creates `DeckInstance`:

```ts
interface DeckFactory {
  readonly deckType: DeckType;
  create(config: DeckConfig): DeckInstance;
}

interface DeckInstance {
  render(): HTMLElement;
  dispose(): void;
  getState(): DeckState;
}
```

**Factory registration:** `cardplay/src/boards/decks/factory-registry.ts`

---

## Extensibility Contract

#### EXTENSIBILITY-CONTRACT/1

- **What can extend this:** builtin (DeckType currently pinned) | user pack (for DeckTemplate)
- **Extension surface:** 
  - `DeckType` is currently **builtin-only** (closed enum)
  - `DeckTemplate` can be extended via packs
  - Custom deck *content* ships as new cards inside existing deck types
- **Registration/loader:** 
  - DeckFactory: `cardplay/src/boards/decks/factory-registry.ts`
  - DeckTemplate: `cardplay/src/ai/theory/deck-templates.ts`
- **ID namespace rule:** `<namespace>:<deck_template>` for templates
- **Versioning:** Pack manifest version
- **Future extension:** Namespaced custom `DeckType` is an explicit future extension path (not yet implemented)

---

## Which Deck Concept to Use?

| If you're talking about... | Use this term |
|---|---|
| A zone in the board UI | `BoardDeck` |
| The type of a zone (pattern, notation, etc.) | `DeckType` |
| A modular slot grid inside a zone | `DeckLayoutAdapter (slot-grid runtime)` |
| AI-recommended theory cards | `DeckTemplate (AI)` |
| How cards are arranged in a zone | `DeckCardLayout` |

---

## Common Mistakes

❌ "The deck is the main workspace" — The `Board` is the workspace; decks are zones within it

❌ "Create a new DeckType for my extension" — DeckType is pinned; ship new functionality as cards inside existing types

❌ "DeckLayoutAdapter contains BoardDecks" — Reversed: BoardDecks may contain DeckLayoutAdapter

❌ "Use DeckTemplate to render the zone" — DeckTemplate is a suggestion, not a renderer
