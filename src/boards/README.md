# Board System

This directory contains the canonical board model implementation for CardPlay.

## Overview

The board system provides composable workspaces for music creation. Each board consists of:

- **Decks**: Collections of cards organized by type and purpose
- **Layout**: Panel arrangement and dock configuration
- **Routing**: Connection graph for audio/MIDI/data flow
- **Policy**: Control level and capability gates

## Key Concepts

### Board Definition (`BoardDefinition`)

A board is defined by:
- `id`: Unique board identifier (builtin or namespaced)
- `name`: Display name
- `decks`: Array of deck definitions (DeckType + DeckId + panelId)
- `layout`: Panel layout specification
- `routing`: Initial connection graph (optional)
- `policy`: Control level, tool modes, capability gates
- Metadata: `difficulty`, `tags`, `author`, `version`, `description`

### Deck Placement

Each `BoardDeck` specifies:
- `id`: Unique DeckId within the board
- `type`: DeckType (pattern-deck, piano-roll-deck, etc.)
- `panelId`: Which panel this deck renders into
- `title`: Display name (optional)
- `layout`: DeckCardLayout (`tabs`, `stack`, `split`, `floating`, `grid`)

### Panels

Panels are named dock regions (`left`, `right`, `top`, `bottom`, `center`).
Decks with the same `panelId` render as tabs within that panel.

## Canonical Paths

See `docs/canon/` for Single Source of Truth:

- **Board Schema**: `docs/canon/board-definition-schema.md`
- **Deck Systems**: `docs/canon/deck-systems.md`
- **Control Levels**: `docs/canon/control-levels.md`
- **Panel Layout**: `docs/canon/panel-layout.md`

## Directory Structure

```
boards/
├── types.ts              - Core board types
├── validate.ts           - Board validation
├── builtins/             - Built-in board definitions
│   ├── register.ts       - Board registration
│   ├── basic-tracker-board.ts
│   ├── basic-session-board.ts
│   └── ...
├── layout/               - Panel layout system
│   ├── adapter.ts        - Dock tree adapter
│   ├── runtime-types.ts  - Runtime layout state
│   └── assign-decks-to-panels.ts
├── decks/                - Deck factories and runtime
│   ├── factory-types.ts  - Deck factory interface
│   ├── factory-registry.ts - Factory registration
│   ├── deck-container.ts - Deck UI container
│   └── factories/        - Individual deck factories
├── context/              - Board context (selection, etc.)
├── gating/               - Connection validation
├── store/                - Board state persistence
└── switching/            - Board transition logic
```

## Deck Types

Each deck type has a corresponding factory in `decks/factories/`:

### Pattern/Notation Decks
- `pattern-deck` → `pattern-deck-factory.ts`
- `piano-roll-deck` → `piano-roll-deck-factory.ts`
- `notation-deck` → `notation-deck-factory.ts`

### Session/Arrangement Decks
- `session-deck` → `session-deck-factory.ts`
- `arrangement-deck` → `arrangement-deck-factory.ts`
- `arranger-deck` → `arranger-deck-factory.ts`

### Audio Decks
- `mixer-deck` → `mixer-deck-factory.ts`
- `instruments-deck` → `instruments-deck-factory.ts`
- `samples-deck` → `samples-deck-factory.ts`
- `sample-manager-deck` → `sample-manager-factory.ts`
- `effects-deck` → `effects-deck-factory.ts`
- `dsp-chain` → `dsp-chain-factory.ts`

### Routing/Modulation Decks
- `routing-deck` → `routing-deck-factory.ts`
- `modulation-matrix-deck` → `modulation-matrix-deck-factory.ts`

### Utility Decks
- `transport-deck` → `transport-deck-factory.ts`
- `automation-deck` → `automation-deck-factory.ts`
- `properties-deck` → `properties-deck-factory.ts`

### AI/Theory Decks
- `generators-deck` → `generators-deck-factory.ts`
- `harmony-deck` → `harmony-display-factory.ts`
- `phrases-deck` → `phrases-deck-factory.ts`
- `ai-advisor-deck` → `ai-advisor-factory.ts`

### Production Decks
- `track-groups-deck` → `track-groups-factory.ts`
- `mix-bus-deck` → `mix-bus-factory.ts`
- `reference-track-deck` → `reference-track-factory.ts`
- `spectrum-analyzer-deck` → `spectrum-analyzer-factory.ts`
- `waveform-editor-deck` → `waveform-editor-factory.ts`

## Creating a New Board

1. Define the board in `builtins/your-board.ts`:

```typescript
import type { BoardDefinition } from '../types.js';

export const yourBoard: BoardDefinition = {
  id: 'your-board',
  name: 'Your Board',
  difficulty: 'beginner',
  tags: ['tracker', 'lofi'],
  author: 'CardPlay',
  version: '1.0.0',
  description: 'Your board description',
  
  layout: {
    type: 'dock',
    panels: [
      { id: 'left', position: 'left', size: 300 },
      { id: 'center', position: 'center' },
      { id: 'right', position: 'right', size: 300 },
    ]
  },
  
  decks: [
    {
      id: 'main-pattern' as DeckId,
      type: 'pattern-deck',
      panelId: 'center',
      layout: 'tabs'
    },
    {
      id: 'instruments' as DeckId,
      type: 'instruments-deck',
      panelId: 'left',
      layout: 'tabs'
    },
    {
      id: 'mixer' as DeckId,
      type: 'mixer-deck',
      panelId: 'right',
      layout: 'tabs'
    }
  ],
  
  controlLevel: 'full-auto',
  primaryView: 'pattern',
};
```

2. Register it in `builtins/register.ts`:

```typescript
import { yourBoard } from './your-board.js';

const BUILTIN_BOARDS = [
  // ... existing boards
  yourBoard,
];
```

3. Ensure all DeckTypes have registered factories (see validation tests)

## Testing

Key tests:
- `__tests__/board-factory-validation.test.ts` - Factory registration
- `__tests__/board-metadata-validation.test.ts` - Metadata completeness
- `__tests__/board-schema-canon.test.ts` - Canon schema compliance

Run: `npm run test:boards`

## Migration Notes

### Legacy Deck Types

Old deck type strings are normalized to canonical DeckType values:
- `'pattern-editor'` → `'pattern-deck'`
- `'piano-roll'` → `'piano-roll-deck'`
- `'notation-score'` → `'notation-deck'`
- `'session'` → `'session-deck'`
- `'arrangement'` → `'arrangement-deck'`
- `'mixer'` → `'mixer-deck'`

Use `normalizeDeckType()` for migration (see `src/canon/legacy-aliases.ts`).

### PanelId Addition

All boards now require `panelId` on each deck. Older boards without `panelId`
will auto-assign to `'center'` panel during migration.

## See Also

- `docs/canon/board-definition-schema.md` - Canonical board schema
- `docs/boards/` - Board-specific documentation
- `src/boards/types.ts` - TypeScript type definitions
- `CANON_IMPLEMENTATION_GAPS.md` - Known gaps between docs and implementation
