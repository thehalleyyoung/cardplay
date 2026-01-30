# Deck System

This directory contains the deck factory system for Cardplay boards.

## Overview

Decks are UI components that render into board panels. Each deck type has a factory that creates deck instances.

## Canonical DeckType → Factory Mapping

| DeckType | Factory File | Status |
|----------|-------------|--------|
| `pattern-deck` | `factories/pattern-deck-factory.ts` | ✅ Implemented |
| `piano-roll-deck` | `factories/piano-roll-deck-factory.ts` | ✅ Implemented |
| `notation-deck` | `factories/notation-deck-factory.ts` | ✅ Implemented |
| `session-deck` | `factories/session-deck-factory.ts` | ✅ Implemented |
| `arrangement-deck` | `factories/arrangement-deck-factory.ts` | ✅ Implemented |
| `mixer-deck` | `factories/mixer-deck-factory.ts` | ✅ Implemented |
| `transport-deck` | `factories/transport-deck-factory.ts` | ✅ Implemented |
| `properties-deck` | `factories/properties-deck-factory.ts` | ✅ Implemented |
| `instruments-deck` | `factories/instruments-deck-factory.ts` | ✅ Implemented |
| `samples-deck` | `factories/samples-deck-factory.ts` | ✅ Implemented |
| `sample-manager-deck` | `factories/sample-manager-deck-factory.ts` | ✅ Implemented |
| `effects-deck` | `factories/effects-deck-factory.ts` | ✅ Implemented |
| `dsp-chain` | `factories/dsp-chain-factory.ts` | ✅ Implemented |
| `routing-deck` | `factories/routing-deck-factory.ts` | ✅ Implemented |
| `modulation-matrix-deck` | `factories/modulation-matrix-deck-factory.ts` | ✅ Implemented |
| `automation-deck` | `factories/automation-deck-factory.ts` | ✅ Implemented |
| `phrases-deck` | `factories/phrases-deck-factory.ts` | ✅ Implemented |
| `harmony-deck` | `factories/harmony-deck-factory.ts` | ✅ Implemented |
| `generators-deck` | `factories/generator-factory.ts` | ✅ Implemented |
| `arranger-deck` | `factories/arranger-deck-factory.ts` | ✅ Implemented |
| `ai-advisor-deck` | `factories/ai-advisor-factory.ts` | ✅ Implemented |
| `track-groups-deck` | `factories/track-groups-factory.ts` | ✅ Implemented |
| `mix-bus-deck` | `factories/mix-bus-factory.ts` | ✅ Implemented |
| `reference-track-deck` | `factories/reference-track-factory.ts` | ✅ Implemented |
| `spectrum-analyzer-deck` | `factories/spectrum-analyzer-factory.ts` | ❌ TODO |
| `waveform-editor-deck` | `factories/waveform-editor-factory.ts` | ❌ TODO |

## Architecture

### Factory Registry

The `factory-registry.ts` maintains a map of `DeckType → DeckFactory`. All factories are registered at startup via `registerBuiltinDeckFactories()` in `factories/index.ts`.

### Factory Interface

Each factory implements the `DeckFactory` interface:

```typescript
interface DeckFactory {
  deckType: DeckType;
  create(deckDef: BoardDeck, ctx: DeckFactoryContext): DeckInstance;
  validate?(deckDef: BoardDeck): string | null;
}
```

### Deck Instance

Factories return `DeckInstance` objects:

```typescript
interface DeckInstance {
  id: DeckId;              // Unique instance ID
  type: DeckType;          // Deck type
  title: string;           // Display title
  panelId?: PanelId;       // Panel placement
  render: () => HTMLElement | null;
  mount?: (container: HTMLElement) => void;
  unmount?: () => void;
  update?: (context: ActiveContext) => void;
  destroy?: () => void;
}
```

## Key Concepts

### DeckType vs DeckId

- **DeckType**: The type/class of deck (e.g., `pattern-deck`, `piano-roll-deck`)
- **DeckId**: Unique instance ID (e.g., `pattern-deck-main`, `piano-roll-melody`)

A board can have multiple deck instances of the same type.

### Legacy Aliases

The system supports legacy DeckType strings via `normalizeDeckType()`:
- `pattern-editor` → `pattern-deck`
- `piano-roll` → `piano-roll-deck`
- `notation-score` → `notation-deck`

These are normalized at the factory registry boundary.

## Related Documentation

- [Board System](../../docs/canon/deck-systems.md) - Canonical deck model
- [Board Types](../types.ts) - Type definitions
- [Factory Types](./factory-types.ts) - Factory interfaces

## Adding New Deck Types

1. Create factory file in `factories/` (e.g., `my-deck-factory.ts`)
2. Implement `DeckFactory` interface
3. Export factory from `factories/index.ts`
4. Register in `registerBuiltinDeckFactories()`
5. Add to this README mapping table
6. Update canonical `DeckType` union in `../types.ts`

See existing factories for implementation patterns.
