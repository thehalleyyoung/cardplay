# Terminology Lint

**Status:** implemented  
**SSOT:** This document lists forbidden ambiguous phrases.

---

## Forbidden Phrases

| Forbidden | Canonical Replacement |
|---|---|
| "deck = workspace" | "deck = zone within a board" |
| "deck = main surface" | "board = workspace; deck = zone" |
| "stack of cards" (for UI) | "StackComponent (UI vertical list)" |
| "card definition" (generic) | Specify: CoreCard, TheoryCardDef, CardDefinition, etc. |
| "AI updates the state" | "AI proposes HostActions; host applies them" |
| "Prolog changes the project" | "Prolog emits HostActions" |
| "hybrid tonality model" | Aspirational—not implemented |
| "src/core/*" | Use real paths: `cardplay/src/cards/*`, etc. |
| "src/registry/*" | Use real paths: registries are distributed |
| `@/` or `~/` imports | Use full paths: `cardplay/src/...` |

---

## AI/Constraints Forbidden Phrases

| Forbidden | Canonical Replacement |
|---|---|
| "AI applies changes" | "AI suggests HostActions; user/policy accepts" |
| "constraints mutate score" | "constraints are declarative; decks mutate" |
| "KB updates events" | "KB reasons over facts; emits actions" |
| "spec stores events" | "spec is intent; event store has events" |

---

## Required Qualifiers

When using these terms, always qualify:

- **Deck**: "BoardDeck (zone)" or "DeckLayoutAdapter (slot-grid runtime)" or "DeckTemplate (AI)"
- **Stack**: "Stack (composition)" or "StackComponent (UI vertical list)"
- **Card**: "Card<A,B>" or "AudioModuleCard" or "TheoryCardDef" or "UICardComponent"
- **Track**: Specify which Track interface or note as aspirational
